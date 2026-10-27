"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Save,
  X,
  Printer,
  Trash2,
  CheckCircle2,
  Scale,
  RotateCcw,
  History,
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  Send,
  Percent,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormSection, FormField, TextInput, SelectInput, TextAreaInput } from "@/components/frontoffice/ui";
import {
  LedgerPickerModal,
  type LedgerPickerOption,
  type NewLedgerInput,
  type TaxPickerOption,
} from "./LedgerPickerModal";
import { cn } from "@/lib/utils";
import {
  accAccountService,
  accCompanyService,
  accPartyBillService,
  accTaxDefinitionService,
  accVoucherService,
  type Account,
  type Company,
  type PartyBill,
  type TaxDefinition,
  type VoucherDetail,
  type VoucherInput,
} from "@/services/accounts";
import {
  accErrorMessage,
  formatDate,
  formatINR,
  invalidateAccLookups,
  todayIso,
  useAccLookups,
  useAccQuery,
} from "@/components/accounts/accountsApi";

interface JournalRow {
  key: string;
  type: "Dr" | "Cr";
  accountId: string;
  divisionId: string;
  debit: number;
  credit: number;
  chequeNo: string;
  chequeDate: string;
  narration: string;
  /** Tax group driving this line's amount (client-only; cleared on manual amount / ledger edits). */
  taxId: string;
  /** Receipt / Payment mode: party bill settled by this line. */
  billId: string;
}

type RpKind = "Receipt" | "Payment";
const bankSideFor = (kind: RpKind): "Dr" | "Cr" => (kind === "Receipt" ? "Dr" : "Cr");
const counterSideFor = (kind: RpKind): "Dr" | "Cr" => (kind === "Receipt" ? "Cr" : "Dr");
const asRpKind = (category: string | null | undefined): RpKind | null =>
  category === "Receipt" || category === "Payment" ? category : null;

/** A saved voucher opens in Receipt / Payment layout when it is one bank line against counter lines. */
const rpKindOfVoucher = (v: VoucherDetail): RpKind | null => {
  const kind = asRpKind(v.voucherCategory);
  if (!kind || !v.bankCashAccountId) return null;
  const bankSide = bankSideFor(kind);
  const bankLines = v.lines.filter((l) => l.entryType === bankSide);
  return bankLines.length === 1 && bankLines[0].accountId === v.bankCashAccountId ? kind : null;
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const rowAmount = (r: JournalRow) => (r.type === "Dr" ? r.debit : r.credit) || 0;

/** Tax base: non-tax lines on the same side, falling back to the opposite side. */
const taxBaseFor = (rows: JournalRow[], row: JournalRow) => {
  const sideTotal = (type: "Dr" | "Cr") =>
    rows.filter((r) => r.key !== row.key && !r.taxId && r.type === type).reduce((s, r) => s + rowAmount(r), 0);
  return sideTotal(row.type) || sideTotal(row.type === "Dr" ? "Cr" : "Dr");
};

const taxAmountFor = (tax: TaxPickerOption, base: number) =>
  tax.calculationType === "Fixed" ? round2(Number(tax.rate) || 0) : round2((base * (Number(tax.rate) || 0)) / 100);

const applyTaxes = (rows: JournalRow[], taxes: Map<string, TaxPickerOption>): JournalRow[] =>
  rows.map((row) => {
    const tax = row.taxId ? taxes.get(row.taxId) : undefined;
    if (!tax) return row;
    const amount = taxAmountFor(tax, taxBaseFor(rows, row));
    return { ...row, debit: row.type === "Dr" ? amount : 0, credit: row.type === "Cr" ? amount : 0 };
  });

export type VoucherNotify = (message: string, variant?: "success" | "error") => void;

const MUTABLE_STATUSES = ["Draft", "Provisional", "Posted"];

let rowSeq = 0;
const newRow = (type: "Dr" | "Cr"): JournalRow => ({
  key: `row-${++rowSeq}`,
  type,
  accountId: "",
  divisionId: "",
  debit: 0,
  credit: 0,
  chequeNo: "",
  chequeDate: "",
  narration: "",
  taxId: "",
  billId: "",
});
const blankRows = () => [newRow("Dr"), newRow("Cr")];

const rowsFromVoucher = (v: VoucherDetail): JournalRow[] => {
  const rows = journalRowsFromVoucher(v);
  const kind = rpKindOfVoucher(v);
  if (!kind) return rows;
  const bankSide = bankSideFor(kind);
  const pending = [...(v.allocations ?? [])];
  return rows
    .filter((r) => r.type !== bankSide)
    .map((r) => {
      const i = pending.findIndex((a) => round2(Number(a.amount)) === round2(rowAmount(r)));
      if (i < 0) return r;
      const [a] = pending.splice(i, 1);
      return { ...r, billId: a.billId };
    });
};

const journalRowsFromVoucher = (v: VoucherDetail): JournalRow[] =>
  v.lines.map((l) => ({
    key: `row-${++rowSeq}`,
    type: l.entryType ?? (l.credit > 0 ? "Cr" : "Dr"),
    accountId: l.accountId,
    divisionId: l.divisionId ?? "",
    debit: Number(l.debit) || 0,
    credit: Number(l.credit) || 0,
    chequeNo: l.chequeNo ?? "",
    chequeDate: l.chequeDate ?? "",
    narration: l.narration ?? "",
    taxId: "",
    billId: "",
  }));

export const statusBadgeClass = (status: string) =>
  status === "Posted"
    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
    : status === "Reversed"
    ? "bg-rose-100 text-rose-800 border-rose-300"
    : status === "Draft"
    ? "bg-amber-100 text-amber-800 border-amber-300"
    : "bg-slate-100 text-slate-700 border-slate-300";

interface VoucherEditorProps {
  /** Voucher to open; read once on mount (change the component `key` to load another). */
  voucher?: VoucherDetail | null;
  variant?: "page" | "modal";
  notify: VoucherNotify;
  /** Modal variant: called after a successful save / post / reverse. */
  onSaved?: (voucher: VoucherDetail, message: string) => void;
  /** Called after the voucher is deleted. */
  onDeleted?: (id: string, message: string) => void;
  /** Modal variant: Close button. */
  onClose?: () => void;
}

export function VoucherEditor({ voucher = null, variant = "page", notify, onSaved, onDeleted, onClose }: VoucherEditorProps) {
  const isModal = variant === "modal";
  const { lookups, loading: lookupsLoading, error: lookupsError, reload: reloadLookups } = useAccLookups();
  const companies = useAccQuery<Company[]>(
    () => (isModal ? Promise.resolve([]) : accCompanyService.list()),
    [isModal],
  );
  const taxDefinitions = useAccQuery<TaxDefinition[]>(() => accTaxDefinitionService.list(), []);
  const taxOptions = useMemo<TaxPickerOption[]>(
    () =>
      (taxDefinitions.data ?? [])
        .filter((t) => t.status === "Active")
        .map((t) => ({
          id: t.id,
          taxCode: t.taxCode,
          taxName: t.taxName,
          taxType: t.taxType,
          rate: Number(t.rate) || 0,
          calculationType: t.calculationType,
          outputAccountId: t.outputAccountId,
          outputAccountName: t.outputAccountName,
        }))
        .sort((a, b) => a.taxCode.localeCompare(b.taxCode, undefined, { numeric: true })),
    [taxDefinitions.data],
  );
  const taxMap = useMemo(() => new Map(taxOptions.map((t) => [t.id, t])), [taxOptions]);

  const [current, setCurrent] = useState<VoucherDetail | null>(voucher);
  const [voucherTypeId, setVoucherTypeId] = useState(voucher?.voucherTypeId ?? "");
  const [transactionDate, setTransactionDate] = useState(voucher?.voucherDate ?? todayIso());
  const [manualVoucherNo, setManualVoucherNo] = useState(voucher?.voucherNo ?? "");
  const [referenceNumber, setReferenceNumber] = useState(voucher?.referenceNo ?? "");
  const [voucherPartyId, setVoucherPartyId] = useState(
    voucher ? voucher.partyId ?? voucher.lines.find((l) => l.partyId)?.partyId ?? "" : "",
  );
  const [commonNarration, setCommonNarration] = useState(voucher?.narration ?? "");
  const [rows, setRows] = useState<JournalRow[]>(() => (voucher ? rowsFromVoucher(voucher) : blankRows()));
  const [bankCashAccountId, setBankCashAccountId] = useState(voucher?.bankCashAccountId ?? "");
  const [paymentMethodId, setPaymentMethodId] = useState(voucher?.paymentMethodId ?? "");
  const [instrumentNo, setInstrumentNo] = useState(voucher?.instrumentNo ?? "");
  const [instrumentDate, setInstrumentDate] = useState(voucher?.instrumentDate ?? "");

  const [preview, setPreview] = useState<{ key: string; voucherNo: string; error: string | null } | null>(null);
  const [previewNonce, setPreviewNonce] = useState(0);

  const [saving, setSaving] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showAuditHistoryModal, setShowAuditHistoryModal] = useState(false);
  const [reverseReason, setReverseReason] = useState<string | null>(null);

  const voucherTypes = useMemo(
    () => (lookups?.voucherTypes ?? []).filter((vt) => vt.shortCode !== "PRV" || vt.id === current?.voucherTypeId),
    [lookups, current?.voucherTypeId],
  );
  const defaultTypeId = useMemo(
    () =>
      (voucherTypes.find((vt) => vt.shortCode === "JV") ??
        voucherTypes.find((vt) => vt.category === "Journal") ??
        voucherTypes[0])?.id ?? "",
    [voucherTypes],
  );
  const typeId = current?.voucherTypeId ?? (voucherTypeId || defaultTypeId);
  const voucherType = voucherTypes.find((vt) => vt.id === typeId);
  const isManualNumbering = voucherType?.numberingMethod === "Manual";
  const editable = !current || MUTABLE_STATUSES.includes(current.status);
  const isDraftOrNew = !current || current.status === "Draft";
  const status = current?.status ?? "New";

  const rpKind: RpKind | null = current ? rpKindOfVoucher(current) : asRpKind(voucherType?.category);
  const bankAccounts = useMemo(() => lookups?.bankCashAccounts ?? [], [lookups]);
  const bankId = bankCashAccountId || bankAccounts[0]?.id || "";
  const paymentMethod = lookups?.paymentMethods.find((m) => m.id === paymentMethodId);
  const billsLocked = current?.status === "Posted";

  const partyBillsQuery = useAccQuery<PartyBill[]>(
    () =>
      rpKind && voucherPartyId
        ? accPartyBillService.list({
            partyId: voucherPartyId,
            moduleType: rpKind === "Receipt" ? "AR" : "AP",
            pendingOnly: true,
          })
        : Promise.resolve([]),
    [rpKind, voucherPartyId],
  );
  const billOptions = useMemo(() => {
    const out = (partyBillsQuery.data ?? []).map((b) => ({
      id: b.id,
      label: `${b.billNo} · ${formatDate(b.billDate)} · Bal ${formatINR(b.balance)}`,
      balance: b.balance,
    }));
    for (const a of current?.allocations ?? []) {
      if (!out.some((o) => o.id === a.billId)) {
        out.push({ id: a.billId, label: `${a.billNo ?? "Bill"} · settled ${formatINR(a.amount)}`, balance: 0 });
      }
    }
    return out;
  }, [partyBillsQuery.data, current]);

  const partyAccountFor = (partyId: string, kind: RpKind | null) => {
    if (!partyId || !kind) return "";
    const party = lookups?.parties.find((p) => p.id === partyId);
    return (kind === "Receipt" ? party?.receivableAccountId : party?.payableAccountId) ?? "";
  };

  const handlePartyChange = (id: string) => {
    if (rpKind) {
      const prevAccount = partyAccountFor(voucherPartyId, rpKind);
      const nextAccount = partyAccountFor(id, rpKind);
      setRows((prev) =>
        prev.map((r) => ({
          ...r,
          billId: "",
          accountId:
            nextAccount && !r.taxId && (!r.accountId || r.accountId === prevAccount) ? nextAccount : r.accountId,
        })),
      );
    }
    setVoucherPartyId(id);
  };

  const handleVoucherTypeChange = (id: string) => {
    const nextKind = asRpKind(voucherTypes.find((vt) => vt.id === id)?.category);
    setVoucherTypeId(id);
    if (nextKind === rpKind) return;
    setRows((prev) => {
      const used = prev.filter((r) => r.accountId || rowAmount(r) > 0).map((r) => ({ ...r, billId: "" }));
      if (nextKind) {
        const side = counterSideFor(nextKind);
        const lines = (used.length ? used : [newRow(side)]).map((r) => {
          const amount = rowAmount(r);
          return { ...r, type: side, debit: side === "Dr" ? amount : 0, credit: side === "Cr" ? amount : 0 };
        });
        return applyTaxes(lines, taxMap);
      }
      const next = used.length ? used : [];
      if (!next.some((r) => r.type === "Dr")) next.push(newRow("Dr"));
      if (!next.some((r) => r.type === "Cr")) next.push(newRow("Cr"));
      return next;
    });
  };

  const ledgerPickerOptions = useMemo(() => {
    const base: LedgerPickerOption[] = (lookups?.ledgers ?? []).map((l) => ({
      id: l.id,
      code: l.code,
      name: l.name,
      nature: l.nature,
      category: l.category,
      isBankAccount: l.isBankAccount,
      isCashAccount: l.isCashAccount,
    }));
    const known = new Set(base.map((b) => b.id));
    for (const l of current?.lines ?? []) {
      if (!known.has(l.accountId)) {
        known.add(l.accountId);
        base.push({ id: l.accountId, code: l.accountCode ?? "", name: l.accountName ?? "Account" });
      }
    }
    for (const t of taxOptions) {
      if (t.outputAccountId && !known.has(t.outputAccountId)) {
        known.add(t.outputAccountId);
        base.push({ id: t.outputAccountId, code: "", name: t.outputAccountName ?? t.taxName });
      }
    }
    return base;
  }, [lookups, current, taxOptions]);
  const ledgerOptions = useMemo(
    () => ledgerPickerOptions.map((l) => ({ id: l.id, label: `${l.code} - ${l.name}` })),
    [ledgerPickerOptions],
  );
  const [ledgerPickerRowKey, setLedgerPickerRowKey] = useState<string | null>(null);
  const ledgerPickerRow = rows.find((r) => r.key === ledgerPickerRowKey) ?? null;
  const ledgerLabel = (id: string) => ledgerOptions.find((l) => l.id === id)?.label ?? "";

  const handleQuickCreateLedger = async (input: NewLedgerInput): Promise<LedgerPickerOption> => {
    let created: Account;
    try {
      created = await accAccountService.create({
        ...input,
        nature: input.nature as Account["nature"],
        accountType: "Ledger",
        allowPosting: true,
        status: "Active",
      });
    } catch (e) {
      throw new Error(accErrorMessage(e));
    }
    invalidateAccLookups();
    await reloadLookups(true);
    notify(`Ledger “${created.name}” created.`);
    return {
      id: created.id,
      code: created.code,
      name: created.name,
      nature: created.nature,
      category: created.category,
      isBankAccount: created.isBankAccount,
      isCashAccount: created.isCashAccount,
    };
  };

  // Server-side number preview for new vouchers
  const previewKey = `${typeId}|${transactionDate}`;
  useEffect(() => {
    if (current || !typeId || isManualNumbering || !transactionDate) return;
    let cancelled = false;
    accVoucherService
      .nextNumber(typeId, transactionDate)
      .then((r) => {
        if (!cancelled) setPreview({ key: `${typeId}|${transactionDate}`, voucherNo: r.voucherNo, error: null });
      })
      .catch((e) => {
        if (!cancelled) setPreview({ key: `${typeId}|${transactionDate}`, voucherNo: "", error: accErrorMessage(e) });
      });
    return () => {
      cancelled = true;
    };
  }, [current, typeId, isManualNumbering, transactionDate, previewNonce]);

  const currentVoucherNo = current
    ? current.voucherNo
    : isManualNumbering
    ? manualVoucherNo
    : preview?.key === previewKey
    ? preview.voucherNo || "—"
    : "…";
  const previewError = !current && !isManualNumbering && preview?.key === previewKey ? preview.error : null;

  // Live totals
  const totalDebit = useMemo(() => rows.reduce((sum, r) => sum + (Number(r.debit) || 0), 0), [rows]);
  const totalCredit = useMemo(() => rows.reduce((sum, r) => sum + (Number(r.credit) || 0), 0), [rows]);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.01;
  const rpTotal = round2(totalDebit + totalCredit);

  const loadIntoForm = (v: VoucherDetail) => {
    setCurrent(v);
    setVoucherTypeId(v.voucherTypeId);
    setTransactionDate(v.voucherDate);
    setManualVoucherNo(v.voucherNo);
    setReferenceNumber(v.referenceNo ?? "");
    setVoucherPartyId(v.partyId ?? v.lines.find((l) => l.partyId)?.partyId ?? "");
    setCommonNarration(v.narration ?? "");
    setRows(rowsFromVoucher(v));
    setBankCashAccountId(v.bankCashAccountId ?? "");
    setPaymentMethodId(v.paymentMethodId ?? "");
    setInstrumentNo(v.instrumentNo ?? "");
    setInstrumentDate(v.instrumentDate ?? "");
  };

  const resetForm = () => {
    setCurrent(null);
    setManualVoucherNo("");
    setReferenceNumber("");
    setVoucherPartyId("");
    setCommonNarration("");
    setRows(rpKind ? [newRow(counterSideFor(rpKind))] : blankRows());
    setPaymentMethodId("");
    setInstrumentNo("");
    setInstrumentDate("");
    setPreviewNonce((n) => n + 1);
  };

  // Row manipulation
  const handleAddRow = () => {
    if (rpKind) {
      const row = newRow(counterSideFor(rpKind));
      row.accountId = partyAccountFor(voucherPartyId, rpKind);
      setRows((prev) => applyTaxes([...prev, row], taxMap));
      return;
    }
    const nextType: "Dr" | "Cr" = totalDebit > totalCredit ? "Cr" : "Dr";
    const row = newRow(nextType);
    if (difference > 0) {
      if (nextType === "Cr") row.credit = Math.round(difference * 100) / 100;
      else row.debit = Math.round(difference * 100) / 100;
    }
    setRows((prev) => applyTaxes([...prev, row], taxMap));
  };

  const handleDeleteRow = (key: string) => {
    if (rpKind ? rows.length <= 1 : rows.length <= 2) {
      notify(
        rpKind
          ? "At least one line item is required."
          : "A voucher needs at least two lines (one debit and one credit).",
        "error",
      );
      return;
    }
    setRows((prev) => applyTaxes(prev.filter((r) => r.key !== key), taxMap));
  };

  const handleSelectTax = (key: string, tax: TaxPickerOption) => {
    if (!tax.outputAccountId) return;
    const accountId = tax.outputAccountId;
    setRows((prev) =>
      applyTaxes(
        prev.map((row) => (row.key === key ? { ...row, accountId, taxId: tax.id } : row)),
        taxMap,
      ),
    );
  };

  const handleUpdateRow = <K extends keyof JournalRow>(key: string, field: K, value: JournalRow[K]) => {
    setRows((prev) => {
      const next = prev.map((row) => {
        if (row.key !== key) return row;
        const updated: JournalRow = { ...row, [field]: value };
        if (field === "accountId" || field === "debit" || field === "credit") updated.taxId = "";
        if (field === "billId" && value && !rowAmount(row)) {
          const balance = round2(billOptions.find((b) => b.id === value)?.balance ?? 0);
          if (balance > 0) {
            updated.debit = row.type === "Dr" ? balance : 0;
            updated.credit = row.type === "Cr" ? balance : 0;
            updated.taxId = "";
          }
        }
        if (field === "type") {
          const amount = row.debit || row.credit;
          updated.debit = value === "Dr" ? amount : 0;
          updated.credit = value === "Cr" ? amount : 0;
        } else if (field === "debit" && Number(value) > 0) {
          updated.credit = 0;
          updated.type = "Dr";
        } else if (field === "credit" && Number(value) > 0) {
          updated.debit = 0;
          updated.type = "Cr";
        }
        return updated;
      });
      return field === "chequeNo" || field === "chequeDate" || field === "narration" || field === "divisionId"
        ? next
        : applyTaxes(next, taxMap);
    });
  };

  const taxNote = (row: JournalRow) => {
    const tax = row.taxId ? taxMap.get(row.taxId) : undefined;
    if (!tax) return "";
    if (tax.calculationType === "Fixed") return `${tax.taxCode} · Fixed ${formatINR(Number(tax.rate) || 0)}`;
    return `${tax.taxCode} @ ${Number(tax.rate)}% on ${formatINR(taxBaseFor(rows, row))}`;
  };

  const buildInput = (): VoucherInput | null => {
    if (!typeId) {
      notify("Select a transaction (voucher) type.", "error");
      return null;
    }
    if (!transactionDate) {
      notify("Select the transaction date.", "error");
      return null;
    }
    if (isManualNumbering && !current && !manualVoucherNo.trim()) {
      notify(`${voucherType?.voucherTypeName ?? "This voucher type"} uses manual numbering — enter a voucher number.`, "error");
      return null;
    }
    if (rpKind) return buildReceiptPaymentInput(rpKind);
    const lineIdx = rows.findIndex((r) => !r.accountId);
    if (lineIdx >= 0) {
      notify(`Line ${lineIdx + 1}: select a GL account.`, "error");
      return null;
    }
    const amountIdx = rows.findIndex((r) => (r.debit > 0) === (r.credit > 0));
    if (amountIdx >= 0) {
      notify(`Line ${amountIdx + 1}: enter an amount.`, "error");
      return null;
    }
    if (totalDebit <= 0) {
      notify("Total debit amount must be greater than ₹0.00.", "error");
      return null;
    }
    if (!isBalanced) {
      notify(
        `Out of balance: Total Debit (${formatINR(totalDebit)}) does not equal Total Credit (${formatINR(totalCredit)}). Difference ${formatINR(difference)}.`,
        "error",
      );
      return null;
    }
    if (voucherType?.partyRequired && !voucherPartyId) {
      notify(`${voucherType.voucherTypeName} requires a party — select one in Section 1.`, "error");
      return null;
    }
    return {
      partyId: voucherPartyId || null,
      voucherTypeId: typeId,
      voucherNo: isManualNumbering && !current ? manualVoucherNo.trim() : undefined,
      voucherDate: transactionDate,
      referenceNo: referenceNumber.trim(),
      narration: commonNarration.trim(),
      lines: rows.map((r) => ({
        accountId: r.accountId,
        entryType: r.type,
        amount: (r.type === "Dr" ? r.debit : r.credit) || 0,
        divisionId: r.divisionId || null,
        chequeNo: r.chequeNo.trim(),
        chequeDate: r.chequeDate || null,
        narration: r.narration.trim() || taxNote(r),
      })),
    };
  };

  const buildReceiptPaymentInput = (kind: RpKind): VoucherInput | null => {
    if (!bankId) {
      notify("Select the cash / bank account.", "error");
      return null;
    }
    const lineIdx = rows.findIndex((r) => !r.accountId);
    if (lineIdx >= 0) {
      notify(`Line ${lineIdx + 1}: select an account ledger.`, "error");
      return null;
    }
    const bankLineIdx = rows.findIndex((r) => r.accountId === bankId);
    if (bankLineIdx >= 0) {
      notify(`Line ${bankLineIdx + 1}: the cash / bank account cannot also be a line ledger.`, "error");
      return null;
    }
    const zeroIdx = rows.findIndex((r) => !(rowAmount(r) > 0));
    if (zeroIdx >= 0) {
      notify(`Line ${zeroIdx + 1}: enter an amount greater than zero.`, "error");
      return null;
    }
    if (paymentMethod?.referenceRequired && !instrumentNo.trim()) {
      notify(`${paymentMethod.paymentMethodName} requires a reference / instrument number.`, "error");
      return null;
    }
    if (voucherType?.partyRequired && !voucherPartyId) {
      notify(`${voucherType.voucherTypeName} requires a party.`, "error");
      return null;
    }
    const billAllocations = billsLocked
      ? []
      : rows.filter((r) => r.billId).map((r) => ({ billId: r.billId, amount: rowAmount(r) }));
    if (billAllocations.length && !voucherPartyId) {
      notify("Select the party to settle bills against.", "error");
      return null;
    }
    return {
      partyId: voucherPartyId || null,
      voucherTypeId: typeId,
      voucherNo: isManualNumbering && !current ? manualVoucherNo.trim() : undefined,
      voucherDate: transactionDate,
      referenceNo: referenceNumber.trim(),
      narration: commonNarration.trim(),
      bankCashAccountId: bankId,
      paymentMethodId: paymentMethodId || null,
      instrumentNo: instrumentNo.trim(),
      instrumentDate: instrumentDate || null,
      lines: [
        {
          accountId: bankId,
          entryType: bankSideFor(kind),
          amount: rpTotal,
          divisionId: rows[0]?.divisionId || null,
          chequeNo: instrumentNo.trim(),
          chequeDate: instrumentDate || null,
          narration: "",
        },
        ...rows.map((r) => ({
          accountId: r.accountId,
          entryType: counterSideFor(kind),
          amount: rowAmount(r),
          divisionId: r.divisionId || null,
          narration: r.narration.trim() || taxNote(r),
        })),
      ],
      billAllocations,
    };
  };

  const afterSave = (saved: VoucherDetail, message: string, thenNew = false) => {
    if (isModal && onSaved) {
      onSaved(saved, message);
      return;
    }
    notify(message);
    if (thenNew) resetForm();
    else loadIntoForm(saved);
  };

  const persist = async (mode: "draft" | "post" | "update", thenNew: boolean) => {
    if (!editable) {
      notify(`${status} vouchers cannot be edited.`, "error");
      return;
    }
    const input = buildInput();
    if (!input) return;
    setSaving(true);
    try {
      let saved: VoucherDetail;
      if (current) {
        saved = await accVoucherService.update(current.id, input);
        if (mode === "post" && current.status === "Draft") {
          saved = await accVoucherService.post(current.id, { billAllocations: input.billAllocations });
        }
      } else {
        saved = await accVoucherService.create({ ...input, status: mode === "post" ? "Posted" : "Draft" });
      }
      afterSave(
        saved,
        mode === "update"
          ? `✓ Voucher ${saved.voucherNo} updated — ledger balances reflect the changes.`
          : mode === "post"
          ? `✓ Voucher ${saved.voucherNo} posted to the General Ledger.`
          : `✓ Voucher ${saved.voucherNo} saved as Draft.`,
        thenNew,
      );
    } catch (e) {
      notify(accErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!current || !MUTABLE_STATUSES.includes(current.status)) return;
    const prompt =
      current.status === "Posted"
        ? `Delete posted voucher ${current.voucherNo}? Its entries will be removed from every ledger and any bill settlements released. This cannot be undone.`
        : `Delete ${current.status.toLowerCase()} voucher ${current.voucherNo}? This cannot be undone.`;
    if (!window.confirm(prompt)) return;
    setSaving(true);
    try {
      await accVoucherService.remove(current.id);
      const message = `Voucher ${current.voucherNo} deleted.`;
      if (onDeleted) onDeleted(current.id, message);
      if (!isModal) {
        notify(message);
        resetForm();
      }
    } catch (e) {
      notify(accErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleReverseVoucher = async () => {
    if (!current || reverseReason === null) return;
    if (!reverseReason.trim()) {
      notify("A reversal reason is required.", "error");
      return;
    }
    setSaving(true);
    try {
      const v = await accVoucherService.reverse(current.id, reverseReason.trim());
      setReverseReason(null);
      afterSave(v, `Voucher ${v.voucherNo} reversed.`);
    } catch (e) {
      notify(accErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmPrint = async () => {
    if (!current) return;
    try {
      const v = await accVoucherService.print(current.id);
      setCurrent(v);
      window.print();
    } catch (e) {
      notify(accErrorMessage(e), "error");
    }
  };

  const renderLedgerCell = (row: JournalRow) => (
    <>
      <button
        type="button"
        disabled={!editable}
        onClick={() => setLedgerPickerRowKey(row.key)}
        title={ledgerLabel(row.accountId) || "Select ledger"}
        className="flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-left text-xs transition hover:border-emerald-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50"
      >
        <span className={cn("truncate", row.accountId ? "font-semibold text-slate-900" : "text-slate-400")}>
          {ledgerLabel(row.accountId) || "Select Ledger..."}
        </span>
        <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      </button>
      {row.taxId && taxMap.has(row.taxId) && (
        <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
          <Percent className="h-2.5 w-2.5" />
          {taxNote(row)}
        </span>
      )}
    </>
  );

  const renderAmountInput = (row: JournalRow) => (
    <TextInput
      type="number"
      min={0}
      step="0.01"
      value={rowAmount(row) || ""}
      disabled={!editable}
      onChange={(e) => handleUpdateRow(row.key, row.type === "Dr" ? "debit" : "credit", parseFloat(e.target.value) || 0)}
      placeholder="0.00"
      className="h-8 text-xs text-right font-bold text-slate-900"
    />
  );

  const renderDivisionSelect = (row: JournalRow) => (
    <SelectInput
      value={row.divisionId}
      disabled={!editable}
      onChange={(e) => handleUpdateRow(row.key, "divisionId", e.target.value)}
      className="h-8 text-xs"
    >
      <option value="">General</option>
      {(lookups?.divisions ?? []).map((d) => (
        <option key={d.id} value={d.id}>
          {d.divisionName}
        </option>
      ))}
    </SelectInput>
  );

  const renderNarrationInput = (row: JournalRow) => (
    <TextInput
      value={row.narration}
      disabled={!editable}
      maxLength={500}
      onChange={(e) => handleUpdateRow(row.key, "narration", e.target.value)}
      placeholder={commonNarration.trim() || "Line narration..."}
      title={row.narration || undefined}
      className="h-8 text-xs"
    />
  );

  const renderDeleteButton = (row: JournalRow) => (
    <button
      type="button"
      disabled={!editable}
      onClick={() => handleDeleteRow(row.key)}
      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-40"
      title="Delete row"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );

  const company = companies.data?.[0];
  const voucherTypeName = voucherType?.voucherTypeName ?? current?.voucherTypeName ?? "Journal Voucher";

  return (
    <>
      {lookupsError ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Could not load accounts, parties and voucher types: {lookupsError}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={() => void reloadLookups(true)} className="rounded-xl bg-white text-xs">
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : lookupsLoading && !lookups ? (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-600" /> Loading ledgers, parties and voucher types…
        </div>
      ) : null}

      {current?.status === "Posted" && isModal && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          This voucher is posted. Saving changes or deleting it updates every affected ledger immediately.
        </div>
      )}

      <div className="space-y-4 print:hidden">
        {/* Section 1 — Transaction Information */}
        <FormSection title="Section 1 — Transaction Information" columns={3} className="mb-4">
          <FormField label="Transaction Type" required>
            <SelectInput value={typeId} disabled={!!current} onChange={(e) => handleVoucherTypeChange(e.target.value)}>
              {voucherTypes.length === 0 && <option value="">No voucher types configured</option>}
              {voucherTypes.map((vt) => (
                <option key={vt.id} value={vt.id}>
                  {vt.voucherTypeName} ({vt.shortCode})
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField label="Transaction Date" required>
            <TextInput
              type="date"
              value={transactionDate}
              disabled={!editable}
              onChange={(e) => setTransactionDate(e.target.value)}
            />
          </FormField>

          <FormField
            label={isManualNumbering && !current ? "Voucher Number (Manual)" : "Voucher Number (Auto Generated)"}
            error={previewError ?? undefined}
          >
            <TextInput
              value={currentVoucherNo}
              readOnly={!(isManualNumbering && !current)}
              disabled={!(isManualNumbering && !current)}
              onChange={(e) => setManualVoucherNo(e.target.value)}
              placeholder={isManualNumbering ? "Enter voucher number" : undefined}
              className={cn(
                "font-mono font-bold text-slate-900",
                !(isManualNumbering && !current) && "bg-slate-50 cursor-not-allowed",
              )}
            />
          </FormField>

          {rpKind && (
            <>
              <FormField label="Cash / Bank Account" required>
                <SelectInput value={bankId} disabled={!editable} onChange={(e) => setBankCashAccountId(e.target.value)}>
                  {bankAccounts.length === 0 && <option value="">No bank / cash accounts configured</option>}
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} - {b.name}
                    </option>
                  ))}
                </SelectInput>
              </FormField>

              <FormField label={rpKind === "Receipt" ? "Receipt Mode" : "Payment Mode"}>
                <SelectInput value={paymentMethodId} disabled={!editable} onChange={(e) => setPaymentMethodId(e.target.value)}>
                  <option value="">— Select mode —</option>
                  {(lookups?.paymentMethods ?? []).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.paymentMethodName}
                    </option>
                  ))}
                </SelectInput>
              </FormField>

              <FormField label="Ref / Instrument No" required={paymentMethod?.referenceRequired}>
                <TextInput
                  value={instrumentNo}
                  disabled={!editable}
                  onChange={(e) => setInstrumentNo(e.target.value)}
                  placeholder="Cheque #, UTR #, or EDC approval code..."
                />
              </FormField>

              <FormField label="Instrument Date">
                <TextInput
                  type="date"
                  value={instrumentDate}
                  disabled={!editable}
                  onChange={(e) => setInstrumentDate(e.target.value)}
                />
              </FormField>

              <FormField label="Party / Sub-Ledger" required={voucherType?.partyRequired}>
                <SelectInput value={voucherPartyId} disabled={!editable} onChange={(e) => handlePartyChange(e.target.value)}>
                  <option value="">— No party (direct {rpKind.toLowerCase()}) —</option>
                  {(lookups?.parties ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.partyName} ({p.partyCode})
                    </option>
                  ))}
                </SelectInput>
              </FormField>
            </>
          )}

          <FormField label="Reference Number">
            <TextInput
              value={referenceNumber}
              disabled={!editable}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. REF-88492"
            />
          </FormField>

          {!rpKind && (voucherType?.partyRequired || voucherPartyId) && (
            <FormField label="Party" required={voucherType?.partyRequired}>
              <SelectInput value={voucherPartyId} disabled={!editable} onChange={(e) => setVoucherPartyId(e.target.value)}>
                <option value="">Select party...</option>
                {(lookups?.parties ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.partyName} ({p.partyCode})
                  </option>
                ))}
              </SelectInput>
            </FormField>
          )}

          <FormField label="Common Narration">
            <TextInput
              value={commonNarration}
              disabled={!editable}
              onChange={(e) => setCommonNarration(e.target.value)}
              placeholder="Enter common transaction narration..."
            />
          </FormField>

          <FormField label="Voucher Status (System Managed)">
            <div className="flex items-center gap-2 h-9 px-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs text-slate-800 cursor-not-allowed">
              <span
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-extrabold border",
                  statusBadgeClass(status),
                )}
              >
                {status}
              </span>
              <span className="text-[11px] text-slate-400 font-normal truncate">
                {current?.status === "Posted"
                  ? `Posted ${current.postedBy ? `by ${current.postedBy}` : ""}`
                  : current?.status === "Reversed"
                  ? current.reversalReason || "Reversed"
                  : "(Save Draft or Post)"}
              </span>
            </div>
          </FormField>
        </FormSection>

        {/* Section 2 — Journal Entry Table */}
        <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Section 2 — {voucherTypeName.replace(" Voucher", "")} Entry
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                {rpKind
                  ? `Ledgers ${rpKind === "Receipt" ? "credited" : "debited"} against the cash / bank account — the bank line is added automatically.`
                  : "Enter debit and credit line items for this voucher."}
                {voucherType?.partyRequired && " A party is required for this voucher type."}
                {voucherType?.divisionRequired && " A division is required for this voucher type."}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!editable}
              onClick={handleAddRow}
              className="rounded-xl text-xs font-bold bg-white text-emerald-700 border-slate-300 hover:bg-emerald-50"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              {rpKind ? "Add Line Item" : "Add Row"}
            </Button>
          </div>

          {rpKind ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[960px] text-left text-xs font-sans">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-3 py-2.5 w-10 text-center border-r border-slate-200">#</th>
                    <th className="px-3.5 py-2.5 min-w-[260px] border-r border-slate-200">Account Ledger</th>
                    <th className="px-3 py-2.5 min-w-[220px] border-r border-slate-200">Against Bill</th>
                    <th className="px-3 py-2.5 min-w-[140px] text-right border-r border-slate-200">Amount (₹)</th>
                    <th className="px-3 py-2.5 min-w-[150px] border-r border-slate-200">Analysis (Division)</th>
                    <th className="px-3 py-2.5 min-w-[200px] border-r border-slate-200">Narration</th>
                    <th className="px-3 py-2.5 w-12 text-center">Del</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {rows.map((row, idx) => (
                    <tr key={row.key} className="hover:bg-amber-50/60 transition-colors">
                      <td className="p-2 text-center font-bold text-slate-400 border-r border-slate-100">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-100">{renderLedgerCell(row)}</td>
                      <td className="p-2 border-r border-slate-100">
                        <SelectInput
                          value={row.billId}
                          disabled={!editable || billsLocked || !voucherPartyId || partyBillsQuery.loading}
                          onChange={(e) => handleUpdateRow(row.key, "billId", e.target.value)}
                          className="h-8 text-xs"
                          title={billsLocked ? "Bill settlements of a posted voucher cannot be changed" : undefined}
                        >
                          <option value="">
                            {!voucherPartyId
                              ? "Select a party first"
                              : partyBillsQuery.loading
                              ? "Loading bills…"
                              : billOptions.length === 0
                              ? `No open ${rpKind === "Receipt" ? "AR" : "AP"} bills (on account)`
                              : "On account (no bill)"}
                          </option>
                          {billOptions.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.label}
                            </option>
                          ))}
                        </SelectInput>
                      </td>
                      <td className="p-2 border-r border-slate-100">{renderAmountInput(row)}</td>
                      <td className="p-2 border-r border-slate-100">{renderDivisionSelect(row)}</td>
                      <td className="p-2 border-r border-slate-100">{renderNarrationInput(row)}</td>
                      <td className="p-2 text-center">{renderDeleteButton(row)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr
                    className={cn(
                      "border-t border-slate-200 text-xs",
                      rpKind === "Receipt" ? "bg-emerald-50/70" : "bg-rose-50/70",
                    )}
                  >
                    <td className="p-2 text-center border-r border-slate-100">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-bold",
                          rpKind === "Receipt" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800",
                        )}
                      >
                        {bankSideFor(rpKind)}
                      </span>
                    </td>
                    <td colSpan={2} className="px-3.5 py-2 border-r border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Cash / Bank ({rpKind === "Receipt" ? "debited" : "credited"})
                      </span>
                      <span className="block font-semibold text-slate-900">
                        {bankAccounts.find((b) => b.id === bankId)?.name ?? "Select cash / bank account"}
                      </span>
                    </td>
                    <td
                      className={cn(
                        "px-3 py-2 text-right text-sm font-black border-r border-slate-100",
                        rpKind === "Receipt" ? "text-emerald-800" : "text-rose-800",
                      )}
                    >
                      {formatINR(rpTotal)}
                    </td>
                    <td colSpan={3} className="px-3 py-2 text-[11px] text-slate-500">
                      {paymentMethod?.paymentMethodName ?? `No ${rpKind === "Receipt" ? "receipt" : "payment"} mode`}
                      {instrumentNo.trim() && ` · ${instrumentNo.trim()}`}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[960px] text-left text-xs font-sans">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-3 py-2.5 w-[92px] min-w-[92px] border-r border-slate-200">Dr / Cr</th>
                  <th className="px-3.5 py-2.5 min-w-[280px] border-r border-slate-200">Account Name (Ledger)</th>
                  <th className="px-3 py-2.5 min-w-[140px] text-right border-r border-slate-200">Amount</th>
                  <th className="px-3 py-2.5 min-w-[120px] border-r border-slate-200">Cheque No.</th>
                  <th className="px-3 py-2.5 min-w-[140px] border-r border-slate-200">Cheque Date</th>
                  <th className="px-3 py-2.5 min-w-[150px] border-r border-slate-200">Analysis (Division)</th>
                  <th className="px-3 py-2.5 min-w-[220px] border-r border-slate-200">Narration</th>
                  <th className="px-3 py-2.5 w-12 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.map((row) => (
                  <tr key={row.key} className="hover:bg-amber-50/60 transition-colors">
                    <td className="p-2 border-r border-slate-100">
                      <SelectInput
                        value={row.type}
                        disabled={!editable}
                        onChange={(e) => handleUpdateRow(row.key, "type", e.target.value as "Dr" | "Cr")}
                        className={cn(
                          "h-8 min-w-[76px] pl-2.5 pr-7 bg-[right_8px_center] text-xs font-bold",
                          row.type === "Dr" ? "text-emerald-700" : "text-rose-700",
                        )}
                      >
                        <option value="Dr">Dr</option>
                        <option value="Cr">Cr</option>
                      </SelectInput>
                    </td>
                    <td className="p-2 border-r border-slate-100">{renderLedgerCell(row)}</td>
                    <td className="p-2 border-r border-slate-100">{renderAmountInput(row)}</td>
                    <td className="p-2 border-r border-slate-100">
                      <TextInput
                        value={row.chequeNo}
                        disabled={!editable}
                        onChange={(e) => handleUpdateRow(row.key, "chequeNo", e.target.value)}
                        placeholder="CHQ-..."
                        className="h-8 text-xs font-mono"
                      />
                    </td>
                    <td className="p-2 border-r border-slate-100">
                      <TextInput
                        type="date"
                        value={row.chequeDate}
                        disabled={!editable}
                        onChange={(e) => handleUpdateRow(row.key, "chequeDate", e.target.value)}
                        className="h-8 text-xs"
                      />
                    </td>
                    <td className="p-2 border-r border-slate-100">{renderDivisionSelect(row)}</td>
                    <td className="p-2 border-r border-slate-100">{renderNarrationInput(row)}</td>
                    <td className="p-2 text-center">{renderDeleteButton(row)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </section>

        <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur sm:px-5">
          <div className="flex flex-wrap items-center gap-2">
            {rpKind ? (
              <div
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[11px] font-bold",
                  rpKind === "Receipt"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-rose-200 bg-rose-50 text-rose-900",
                )}
              >
                {rpKind === "Receipt" ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                Total {rpKind}
                <span className="font-mono text-sm font-black">{formatINR(rpTotal)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-[11px] font-bold">
                <span className="text-slate-700">
                  Dr <span className="text-emerald-700">{formatINR(totalDebit)}</span>
                </span>
                <span className="text-slate-700">
                  Cr <span className="text-rose-700">{formatINR(totalCredit)}</span>
                </span>
                <span className={cn("flex items-center gap-1", isBalanced ? "text-emerald-700" : "text-rose-700")}>
                  <Scale className="h-3 w-3" />
                  Diff {formatINR(difference)}
                </span>
              </div>
            )}
            {current && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAuditHistoryModal(true)}
                className="rounded-xl border-slate-300 text-xs font-semibold bg-white text-slate-700"
              >
                <History className="h-3.5 w-3.5 mr-1 text-slate-500" />
                Audit History
              </Button>
            )}
            {current && MUTABLE_STATUSES.includes(current.status) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={() => void handleDelete()}
                className="rounded-xl border-rose-200 text-xs font-semibold bg-white text-rose-700 hover:bg-rose-50"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                {current.status === "Draft" ? "Delete Draft" : "Delete"}
              </Button>
            )}
            {current?.status === "Posted" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={() => setReverseReason("")}
                className="rounded-xl border-rose-200 text-xs font-semibold bg-white text-rose-700 hover:bg-rose-50"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Reverse
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={isModal ? onClose : resetForm}
              className="rounded-xl border-slate-300 text-xs font-semibold bg-white text-slate-700"
            >
              {isModal || current ? "Close" : "Clear"}
            </Button>
            {current && !isModal && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPrintPreview(true)}
                className="rounded-xl border-slate-300 text-xs font-semibold bg-white text-slate-700"
              >
                <Printer className="h-3.5 w-3.5 mr-1 text-slate-600" />
                Print
              </Button>
            )}
            {editable && isDraftOrNew && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={saving}
                  onClick={() => void persist("draft", false)}
                  className="rounded-xl border-slate-300 text-xs font-bold bg-white text-slate-800 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1 text-emerald-600" />}
                  Save Draft
                </Button>
                {!isModal && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={saving}
                    onClick={() => void persist("post", true)}
                    className="rounded-xl border-slate-300 text-xs font-bold bg-white text-slate-800 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                    Post & New
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  disabled={saving}
                  onClick={() => void persist("post", false)}
                  className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5 mr-1" />
                  Post
                </Button>
              </>
            )}
            {editable && !isDraftOrNew && (
              <Button
                type="button"
                size="sm"
                disabled={saving}
                onClick={() => void persist("update", false)}
                className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                Save Changes
              </Button>
            )}
          </div>
        </div>
      </div>

      {ledgerPickerRow && (
        <LedgerPickerModal
          ledgers={ledgerPickerOptions}
          selectedId={ledgerPickerRow.accountId}
          title={`Select Ledger — Line ${rows.indexOf(ledgerPickerRow) + 1} (${ledgerPickerRow.type})`}
          onSelect={(ledger) => handleUpdateRow(ledgerPickerRow.key, "accountId", ledger.id)}
          onClose={() => setLedgerPickerRowKey(null)}
          accounts={lookups?.accounts}
          onCreate={handleQuickCreateLedger}
          taxes={taxOptions}
          selectedTaxId={ledgerPickerRow.taxId || undefined}
          onSelectTax={(tax) => handleSelectTax(ledgerPickerRow.key, tax)}
        />
      )}

      {/* Reverse Voucher Modal */}
      {reverseReason !== null && current && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">Reverse Voucher {current.voucherNo}</h3>
              </div>
              <button
                type="button"
                onClick={() => setReverseReason(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-slate-600">
              Reversing removes this voucher&apos;s effect from the ledgers and releases any bill settlements. This cannot be undone.
            </p>
            <FormField label="Reversal Reason" required>
              <TextAreaInput
                rows={3}
                value={reverseReason}
                onChange={(e) => setReverseReason(e.target.value)}
                placeholder="Why is this voucher being reversed?"
              />
            </FormField>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setReverseReason(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={saving || !reverseReason.trim()}
                onClick={() => void handleReverseVoucher()}
                className="bg-rose-700 hover:bg-rose-800 text-white font-bold disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5 mr-1" />}
                Reverse Voucher
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Formatted Printable Voucher Document Sheet Modal */}
      {showPrintPreview && current && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50 print:relative print:inset-auto print:z-auto print:bg-white print:p-0 print:block">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto print:max-w-none print:w-full print:p-0 print:border-none print:shadow-none">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 print:hidden">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Print Journal Voucher ({current.voucherNo})
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void handleConfirmPrint()}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
                >
                  <Printer className="h-3.5 w-3.5 mr-1" /> Print
                </Button>
                <button
                  type="button"
                  onClick={() => setShowPrintPreview(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-300 bg-white p-6 shadow-xs space-y-4 font-sans text-slate-900">
              <div className="text-center space-y-1 border-b border-slate-300 pb-3">
                <h1 className="text-lg font-bold tracking-wide text-slate-900 font-sans">
                  {company ? company.legalName || company.tradeName : "Company not configured"}
                </h1>
                {company && (
                  <p className="text-[11px] text-slate-600">
                    {[company.addressLine1, company.addressLine2, company.city, company.state, company.pincode]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
                <p className="text-[11px] font-bold text-slate-800 uppercase">{current.voucherTypeName ?? "Journal Voucher"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p><strong>Voucher No:</strong> {current.voucherNo}</p>
                  <p><strong>Voucher Type:</strong> {current.voucherTypeName}</p>
                  <p><strong>Reference No:</strong> {current.referenceNo || "N/A"}</p>
                </div>
                <div className="text-right">
                  <p><strong>Voucher Date:</strong> {formatDate(current.voucherDate)}</p>
                  <p><strong>Status:</strong> {current.status}</p>
                  {current.reprintCount > 0 && <p><strong>Print Count:</strong> {current.reprintCount}</p>}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 font-bold border-b border-slate-300">
                      <th className="px-3 py-1.5 border-r border-slate-300">Type</th>
                      <th className="px-3 py-1.5 border-r border-slate-300">Account Name</th>
                      <th className="px-3 py-1.5 border-r border-slate-300">Party / Division</th>
                      <th className="px-3 py-1.5 text-right border-r border-slate-300">Debit Amount (₹)</th>
                      <th className="px-3 py-1.5 text-right">Credit Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {current.lines.map((l) => (
                      <tr key={l.id} className="h-8">
                        <td className="px-3 py-1.5 border-r border-slate-200 font-bold">{l.entryType ?? (l.credit > 0 ? "Cr" : "Dr")}</td>
                        <td className="px-3 py-1.5 border-r border-slate-200">
                          {l.accountCode} - {l.accountName}
                          {l.narration && (
                            <span className="block text-[10px] italic text-slate-500">{l.narration}</span>
                          )}
                        </td>
                        <td className="px-3 py-1.5 border-r border-slate-200">
                          {[l.partyName, l.divisionName].filter(Boolean).join(" / ") || "—"}
                        </td>
                        <td className="px-3 py-1.5 text-right border-r border-slate-200 font-mono">{l.debit.toFixed(2)}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{l.credit.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold border-t border-slate-300">
                      <td colSpan={3} className="px-3 py-2 text-right uppercase">Total:</td>
                      <td className="px-3 py-2 text-right border-r border-slate-300 font-mono">{current.totalAmount.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-mono">{current.totalAmount.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="text-xs border border-slate-300 p-2.5 rounded bg-slate-50">
                <strong>Narration:</strong> {current.narration || "No narration provided."}
              </div>

              <div className="pt-8 grid grid-cols-3 gap-4 text-center text-xs text-slate-800 font-semibold">
                <div>
                  <p className="border-t border-slate-400 pt-1">Prepared By{current.preparedBy ? ` (${current.preparedBy})` : ""}</p>
                </div>
                <div><p className="border-t border-slate-400 pt-1">Checked By</p></div>
                <div><p className="border-t border-slate-400 pt-1">Authorized Manager</p></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit History Modal */}
      {showAuditHistoryModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Voucher Audit History</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditHistoryModal(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-slate-700 max-h-[60vh] overflow-y-auto">
              {!current ? (
                <p className="text-slate-500">Save or open a voucher to see its audit trail.</p>
              ) : current.auditLogs.length === 0 ? (
                <p className="text-slate-500">No audit entries recorded for {current.voucherNo}.</p>
              ) : (
                current.auditLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <p className="font-bold text-slate-900">{log.action}</p>
                    <p className="text-[11px] text-slate-500">
                      {new Date(log.createdAt).toLocaleString("en-IN")}
                      {log.actor ? ` by ${log.actor}` : ""}
                    </p>
                    {log.reason && <p className="text-[11px] text-slate-600">Reason: {log.reason}</p>}
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="button" size="sm" onClick={() => setShowAuditHistoryModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
