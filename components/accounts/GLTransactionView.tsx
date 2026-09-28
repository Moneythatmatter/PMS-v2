"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Save,
  X,
  Printer,
  Download,
  ChevronDown,
  Trash2,
  CheckCircle2,
  FileText,
  Scale,
  RotateCcw,
  History,
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormSection,
  FormField,
  TextInput,
  SelectInput,
  TextAreaInput,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import { LedgerPickerModal, type LedgerPickerOption } from "./LedgerPickerModal";
import { cn } from "@/lib/utils";
import {
  accCompanyService,
  accVoucherService,
  type VoucherDetail,
  type VoucherInput,
} from "@/services/accounts";
import {
  accErrorMessage,
  formatDate,
  formatINR,
  fyStartIso,
  todayIso,
  useAccLookups,
  useAccQuery,
} from "@/components/accounts/accountsApi";

interface JournalRow {
  key: string;
  type: "Dr" | "Cr";
  accountId: string;
  partyId: string;
  divisionId: string;
  debit: number;
  credit: number;
  narration: string;
  chequeNo: string;
  chequeDate: string;
  gstRate: string;
}

type Toast = { message: string; variant: "success" | "error" } | null;

const GST_RATES = ["0", "5", "12", "18", "28"];

let rowSeq = 0;
const newRow = (type: "Dr" | "Cr"): JournalRow => ({
  key: `row-${++rowSeq}`,
  type,
  accountId: "",
  partyId: "",
  divisionId: "",
  debit: 0,
  credit: 0,
  narration: "",
  chequeNo: "",
  chequeDate: "",
  gstRate: "",
});
const blankRows = () => [newRow("Dr"), newRow("Cr")];

const rowsFromVoucher = (v: VoucherDetail): JournalRow[] =>
  v.lines.map((l) => ({
    key: `row-${++rowSeq}`,
    type: l.debit > 0 ? "Dr" : "Cr",
    accountId: l.accountId,
    partyId: l.partyId ?? "",
    divisionId: l.divisionId ?? "",
    debit: l.debit,
    credit: l.credit,
    narration: l.narration ?? "",
    chequeNo: l.chequeNo ?? "",
    chequeDate: l.chequeDate ?? "",
    gstRate: l.gstRate === null || l.gstRate === undefined ? "" : String(l.gstRate),
  }));

function downloadCsv(filename: string, header: string[], rows: (string | number | null | undefined)[][]) {
  const esc = (v: string | number | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const statusBadgeClass = (status: string) =>
  status === "Posted"
    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
    : status === "Reversed"
    ? "bg-rose-100 text-rose-800 border-rose-300"
    : status === "Draft"
    ? "bg-amber-100 text-amber-800 border-amber-300"
    : "bg-slate-100 text-slate-700 border-slate-300";

export function GLTransactionView() {
  const { lookups, loading: lookupsLoading, error: lookupsError, reload: reloadLookups } = useAccLookups();
  const companies = useAccQuery(() => accCompanyService.list(), []);

  // Voucher header state
  const [current, setCurrent] = useState<VoucherDetail | null>(null);
  const [voucherTypeId, setVoucherTypeId] = useState("");
  const [transactionDate, setTransactionDate] = useState(todayIso());
  const [manualVoucherNo, setManualVoucherNo] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [voucherPartyId, setVoucherPartyId] = useState("");
  const [commonNarration, setCommonNarration] = useState("");
  const [lineNarrationDetails, setLineNarrationDetails] = useState("");
  const [rows, setRows] = useState<JournalRow[]>(blankRows);

  const [preview, setPreview] = useState<{ key: string; voucherNo: string; error: string | null } | null>(null);
  const [previewNonce, setPreviewNonce] = useState(0);

  // UI state
  const [saving, setSaving] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showAuditHistoryModal, setShowAuditHistoryModal] = useState(false);
  const [reverseReason, setReverseReason] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const notify = (message: string, variant: "success" | "error" = "success") => setToast({ message, variant });

  // History filters
  const [histFrom, setHistFrom] = useState(fyStartIso());
  const [histTo, setHistTo] = useState(todayIso());
  const [histStatus, setHistStatus] = useState("all");
  const [histTypeId, setHistTypeId] = useState("");
  const [histSearch, setHistSearch] = useState("");

  const history = useAccQuery(
    () =>
      accVoucherService.list({
        provisional: false,
        from: histFrom || undefined,
        to: histTo || undefined,
        status: histStatus === "all" ? undefined : histStatus,
        voucherTypeId: histTypeId || undefined,
        limit: 500,
      }),
    [histFrom, histTo, histStatus, histTypeId],
  );

  const voucherTypes = useMemo(
    () => (lookups?.voucherTypes ?? []).filter((vt) => vt.shortCode !== "PRV"),
    [lookups],
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
  const editable = !current || current.status === "Draft";
  const status = current?.status ?? "New";

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
    return base;
  }, [lookups, current]);
  const ledgerOptions = useMemo(
    () => ledgerPickerOptions.map((l) => ({ id: l.id, label: `${l.code} - ${l.name}` })),
    [ledgerPickerOptions],
  );
  const [ledgerPickerRowKey, setLedgerPickerRowKey] = useState<string | null>(null);
  const ledgerPickerRow = rows.find((r) => r.key === ledgerPickerRowKey) ?? null;
  const ledgerLabel = (id: string) => ledgerOptions.find((l) => l.id === id)?.label ?? "";
  const partyLabel = (id: string) => lookups?.parties.find((p) => p.id === id)?.partyName ?? "";
  const divisionLabel = (id: string) => lookups?.divisions.find((d) => d.id === id)?.divisionName ?? "";

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

  // Form helpers
  const loadIntoForm = (v: VoucherDetail) => {
    setCurrent(v);
    setVoucherTypeId(v.voucherTypeId);
    setTransactionDate(v.voucherDate);
    setManualVoucherNo(v.voucherNo);
    setReferenceNumber(v.referenceNo ?? "");
    setVoucherPartyId(v.partyId ?? v.lines.find((l) => l.partyId)?.partyId ?? "");
    setCommonNarration(v.narration ?? "");
    setLineNarrationDetails("");
    setRows(rowsFromVoucher(v));
  };

  const resetForm = () => {
    setCurrent(null);
    setManualVoucherNo("");
    setReferenceNumber("");
    setVoucherPartyId("");
    setCommonNarration("");
    setLineNarrationDetails("");
    setRows(blankRows());
    setPreviewNonce((n) => n + 1);
  };

  const openVoucher = async (id: string) => {
    try {
      const v = await accVoucherService.get(id);
      loadIntoForm(v);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      notify(accErrorMessage(e), "error");
    }
  };

  // Row manipulation
  const handleAddRow = () => {
    const nextType: "Dr" | "Cr" = totalDebit > totalCredit ? "Cr" : "Dr";
    const row = newRow(nextType);
    if (difference > 0) {
      if (nextType === "Cr") row.credit = Math.round(difference * 100) / 100;
      else row.debit = Math.round(difference * 100) / 100;
    }
    setRows((prev) => [...prev, row]);
  };

  const handleDeleteRow = (key: string) => {
    if (rows.length <= 2) {
      notify("A voucher needs at least two lines (one debit and one credit).", "error");
      return;
    }
    setRows((prev) => prev.filter((r) => r.key !== key));
  };

  const handleUpdateRow = <K extends keyof JournalRow>(key: string, field: K, value: JournalRow[K]) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.key !== key) return row;
        const updated: JournalRow = { ...row, [field]: value };
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
      }),
    );
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
    const defaultLineNarration = lineNarrationDetails.trim();
    return {
      partyId: voucherPartyId || null,
      voucherTypeId: typeId,
      voucherNo: isManualNumbering && !current ? manualVoucherNo.trim() : undefined,
      voucherDate: transactionDate,
      referenceNo: referenceNumber.trim(),
      narration: commonNarration.trim(),
      lines: rows.map((r) => ({
        accountId: r.accountId,
        partyId: r.partyId || null,
        divisionId: r.divisionId || null,
        debit: r.debit || 0,
        credit: r.credit || 0,
        narration: r.narration.trim() || defaultLineNarration,
        chequeNo: r.chequeNo.trim(),
        chequeDate: r.chequeDate || null,
        gstRate: r.gstRate === "" ? null : Number(r.gstRate),
      })),
    };
  };

  const persist = async (mode: "draft" | "post", thenNew: boolean) => {
    if (!editable) {
      notify(`${status} vouchers cannot be edited — reverse and re-enter instead.`, "error");
      return;
    }
    const input = buildInput();
    if (!input) return;
    setSaving(true);
    try {
      let saved: VoucherDetail;
      if (current) {
        saved = await accVoucherService.update(current.id, input);
        if (mode === "post") saved = await accVoucherService.post(current.id);
      } else {
        saved = await accVoucherService.create({ ...input, status: mode === "post" ? "Posted" : "Draft" });
      }
      notify(
        mode === "post"
          ? `✓ Voucher ${saved.voucherNo} posted to the General Ledger.`
          : `✓ Voucher ${saved.voucherNo} saved as Draft.`,
      );
      void history.reload();
      if (thenNew) resetForm();
      else loadIntoForm(saved);
    } catch (e) {
      notify(accErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelVoucher = () => {
    if (current) {
      loadIntoForm(current);
      notify(`Discarded unsaved edits for ${current.voucherNo}.`);
    } else {
      resetForm();
      notify("Cleared the voucher entry form.");
    }
  };

  const handleDeleteDraft = async () => {
    setShowMoreActions(false);
    if (!current || current.status !== "Draft") return;
    if (!window.confirm(`Delete draft voucher ${current.voucherNo}? This cannot be undone.`)) return;
    try {
      await accVoucherService.remove(current.id);
      notify(`Draft voucher ${current.voucherNo} deleted.`);
      resetForm();
      void history.reload();
    } catch (e) {
      notify(accErrorMessage(e), "error");
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
      loadIntoForm(v);
      setReverseReason(null);
      notify(`Voucher ${v.voucherNo} reversed.`);
      void history.reload();
    } catch (e) {
      notify(accErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePrintVoucher = () => {
    if (!current) {
      notify("Save the voucher before printing.", "error");
      return;
    }
    setShowPrintPreview(true);
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

  const handleExportCSV = () => {
    downloadCsv(
      `${current?.voucherNo || "journal-entry"}.csv`.replace(/[\\/]/g, "-"),
      ["Type", "Account", "Party", "Division", "Debit", "Credit", "Narration", "Cheque No", "Cheque Date", "GST %"],
      rows.map((r) => [
        r.type,
        ledgerLabel(r.accountId),
        partyLabel(r.partyId),
        divisionLabel(r.divisionId),
        r.debit,
        r.credit,
        r.narration,
        r.chequeNo,
        r.chequeDate,
        r.gstRate,
      ]),
    );
    notify(`Exported ${current?.voucherNo || "journal entry"} to CSV.`);
  };

  const filteredHistory = useMemo(() => {
    const q = histSearch.trim().toLowerCase();
    const list = history.data ?? [];
    if (!q) return list;
    return list.filter((v) =>
      [v.voucherNo, v.narration, v.referenceNo, v.partyName, v.debitAccounts, v.creditAccounts]
        .some((s) => (s ?? "").toLowerCase().includes(q)),
    );
  }, [history.data, histSearch]);

  const company = companies.data?.[0];
  const voucherTypeName = voucherType?.voucherTypeName ?? current?.voucherTypeName ?? "Journal Voucher";

  return (
    <ModulePageShell
      eyebrow="Accounts & General Ledger"
      title="GL Transaction"
      description="Create, post, and manage General Ledger journal transaction vouchers."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Transaction", href: "/accounts/transaction" },
        { label: "GL Transaction" },
      ]}
      toast={toast?.message ?? null}
      toastVariant={toast?.variant}
      onDismissToast={() => setToast(null)}
    >
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

      {/* Top Action Buttons Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <FileText className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Voucher Entry ({currentVoucherNo || "—"})</h2>
            <p className="text-[11px] text-slate-500 font-medium">
              General Ledger {voucherTypeName.replace(" Voucher", "")} Entry
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              resetForm();
              notify("Prepared a fresh GL voucher entry.");
            }}
            className="rounded-xl border-slate-300 text-xs font-bold hover:bg-slate-50 bg-white text-slate-800"
          >
            <Plus className="h-3.5 w-3.5 mr-1 text-emerald-600" />
            + New
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!editable || saving}
            onClick={() => void persist("draft", false)}
            className="rounded-xl border-slate-300 text-xs font-bold hover:bg-slate-50 bg-white text-slate-800 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1 text-emerald-600" />}
            Save Draft
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={!editable || saving}
            onClick={() => void persist("post", false)}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5 mr-1" />
            Post
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!editable || saving}
            onClick={() => void persist("post", true)}
            className="rounded-xl border-slate-300 text-xs font-bold hover:bg-slate-50 bg-white text-slate-800 disabled:opacity-50"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
            Post & New
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancelVoucher}
            className="rounded-xl border-slate-300 text-xs font-semibold hover:bg-slate-50 bg-white text-slate-700"
          >
            <X className="h-3.5 w-3.5 mr-1 text-slate-400" />
            Cancel
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrintVoucher}
            className="rounded-xl border-slate-300 text-xs font-semibold hover:bg-slate-50 bg-white text-slate-700"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-600" />
            Print
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="rounded-xl border-slate-300 text-xs font-semibold hover:bg-slate-50 bg-white text-slate-700"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-slate-600" />
            Export
          </Button>

          {/* More Actions Dropdown */}
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowMoreActions(!showMoreActions)}
              className="rounded-xl border-slate-300 text-xs font-semibold bg-white text-slate-800"
            >
              More Actions
              <ChevronDown className="h-3.5 w-3.5 ml-1 text-slate-500" />
            </Button>

            {showMoreActions && (
              <div className="absolute right-0 mt-1.5 z-30 w-48 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl animate-in fade-in-50">
                <button
                  type="button"
                  disabled={current?.status !== "Posted"}
                  onClick={() => {
                    setShowMoreActions(false);
                    setReverseReason("");
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-2 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reverse Voucher
                </button>
                <button
                  type="button"
                  disabled={current?.status !== "Draft"}
                  onClick={() => void handleDeleteDraft()}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-2 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Draft
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreActions(false);
                    setShowAuditHistoryModal(true);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <History className="h-3.5 w-3.5 text-slate-500" />
                  Audit History
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 1 — Transaction Information */}
      <FormSection title="Section 1 — Transaction Information" columns={3} className="mb-4">
        <FormField label="Transaction Type" required>
          <SelectInput
            value={typeId}
            disabled={!!current}
            onChange={(e) => setVoucherTypeId(e.target.value)}
          >
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

        <FormField label="Reference Number">
          <TextInput
            value={referenceNumber}
            disabled={!editable}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="e.g. REF-88492"
          />
        </FormField>

        {(voucherType?.partyRequired || voucherPartyId) && (
          <FormField label="Party" required={voucherType?.partyRequired}>
            <SelectInput
              value={voucherPartyId}
              disabled={!editable}
              onChange={(e) => setVoucherPartyId(e.target.value)}
            >
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
              Enter debit and credit line items for this voucher.
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
            Add Row
          </Button>
        </div>

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
                <th className="px-3 py-2.5 min-w-[100px] border-r border-slate-200">GST</th>
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
                  <td className="p-2 border-r border-slate-100">
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
                  </td>
                  <td className="p-2 border-r border-slate-100">
                    <TextInput
                      type="number"
                      min={0}
                      step="0.01"
                      value={(row.type === "Dr" ? row.debit : row.credit) || ""}
                      disabled={!editable}
                      onChange={(e) =>
                        handleUpdateRow(row.key, row.type === "Dr" ? "debit" : "credit", parseFloat(e.target.value) || 0)
                      }
                      placeholder="0.00"
                      className="h-8 text-xs text-right font-bold text-slate-900"
                    />
                  </td>
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
                  <td className="p-2 border-r border-slate-100">
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
                  </td>
                  <td className="p-2 border-r border-slate-100">
                    <SelectInput
                      value={row.gstRate}
                      disabled={!editable}
                      onChange={(e) => handleUpdateRow(row.key, "gstRate", e.target.value)}
                      className="h-8 text-xs"
                    >
                      <option value="">—</option>
                      {GST_RATES.map((g) => (
                        <option key={g} value={g}>
                          {g}%
                        </option>
                      ))}
                    </SelectInput>
                  </td>
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      disabled={!editable}
                      onClick={() => handleDeleteRow(row.key)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-40"
                      title="Delete row"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {ledgerPickerRow && (
        <LedgerPickerModal
          ledgers={ledgerPickerOptions}
          selectedId={ledgerPickerRow.accountId}
          title={`Select Ledger — Line ${rows.indexOf(ledgerPickerRow) + 1} (${ledgerPickerRow.type})`}
          onSelect={(ledger) => handleUpdateRow(ledgerPickerRow.key, "accountId", ledger.id)}
          onClose={() => setLedgerPickerRowKey(null)}
        />
      )}

      {/* Section 3 — Dynamic Footer Totals Summary */}
      <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Debit</p>
          <p className="mt-1 text-xl font-bold tracking-tight text-slate-900 font-mono">{formatINR(totalDebit)}</p>
          <p className="mt-0.5 text-[11px] text-emerald-700 font-semibold">Live DR Entry Sum</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Credit</p>
          <p className="mt-1 text-xl font-bold tracking-tight text-slate-900 font-mono">{formatINR(totalCredit)}</p>
          <p className="mt-0.5 text-[11px] text-emerald-700 font-semibold">Live CR Entry Sum</p>
        </div>

        <div
          className={cn(
            "rounded-2xl border p-4 shadow-xs transition-colors",
            isBalanced ? "border-emerald-200 bg-emerald-50/60" : "border-rose-200 bg-rose-50/60",
          )}
        >
          <div className="flex items-center justify-between">
            <p className={cn("text-xs font-bold uppercase tracking-wider", isBalanced ? "text-emerald-800" : "text-rose-800")}>
              Difference
            </p>
            <Scale className={cn("h-4 w-4", isBalanced ? "text-emerald-600" : "text-rose-600")} />
          </div>
          <p className={cn("mt-1 text-xl font-bold tracking-tight font-mono", isBalanced ? "text-emerald-900" : "text-rose-900")}>
            {formatINR(difference)}
          </p>
          <p className={cn("mt-0.5 text-[11px] font-bold", isBalanced ? "text-emerald-700" : "text-rose-700")}>
            {isBalanced ? "✓ Voucher is in balance" : `⚠ Imbalanced by ${formatINR(difference)}`}
          </p>
        </div>
      </section>

      {/* Section 4 — Line Narration */}
      <FormSection title="Section 4 — Line Narration" columns={1} className="mb-4">
        <FormField label="Line Narration Details" helperText="Applied to every line that has no narration of its own.">
          <TextAreaInput
            rows={3}
            value={lineNarrationDetails}
            disabled={!editable}
            onChange={(e) => setLineNarrationDetails(e.target.value)}
            placeholder="Enter detailed line narration or explanatory notes for auditor reference..."
          />
        </FormField>
      </FormSection>

      {/* Section 5 — Voucher History */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Recent GL Vouchers ({filteredHistory.length})
            </h2>
          </div>
          <div className="flex flex-wrap items-end gap-2 text-xs">
            <label className="space-y-1">
              <span className="block text-[10px] font-bold uppercase text-slate-500">From</span>
              <TextInput type="date" value={histFrom} onChange={(e) => setHistFrom(e.target.value)} className="h-8 text-xs" />
            </label>
            <label className="space-y-1">
              <span className="block text-[10px] font-bold uppercase text-slate-500">To</span>
              <TextInput type="date" value={histTo} onChange={(e) => setHistTo(e.target.value)} className="h-8 text-xs" />
            </label>
            <label className="space-y-1">
              <span className="block text-[10px] font-bold uppercase text-slate-500">Type</span>
              <SelectInput value={histTypeId} onChange={(e) => setHistTypeId(e.target.value)} className="h-8 text-xs">
                <option value="">All Types</option>
                {voucherTypes.map((vt) => (
                  <option key={vt.id} value={vt.id}>
                    {vt.voucherTypeName}
                  </option>
                ))}
              </SelectInput>
            </label>
            <label className="space-y-1">
              <span className="block text-[10px] font-bold uppercase text-slate-500">Status</span>
              <SelectInput value={histStatus} onChange={(e) => setHistStatus(e.target.value)} className="h-8 text-xs">
                <option value="all">All</option>
                <option value="Draft">Draft</option>
                <option value="Posted">Posted</option>
                <option value="Reversed">Reversed</option>
              </SelectInput>
            </label>
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={histSearch}
                onChange={(e) => setHistSearch(e.target.value)}
                placeholder="Search voucher #, narration, account..."
                className="h-8 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="px-3 py-2.5">Voucher #</th>
                <th className="px-3 py-2.5">Date</th>
                <th className="px-3 py-2.5">Type</th>
                <th className="px-3 py-2.5">Debit Accounts</th>
                <th className="px-3 py-2.5">Credit Accounts</th>
                <th className="px-3 py-2.5 min-w-[180px]">Narration</th>
                <th className="px-3 py-2.5 text-right">Amount</th>
                <th className="px-3 py-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {history.loading && !history.data ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-medium">
                    <Loader2 className="inline h-4 w-4 mr-1 animate-spin text-emerald-600" /> Loading vouchers…
                  </td>
                </tr>
              ) : history.error ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-rose-700 font-medium">
                    {history.error}{" "}
                    <button type="button" onClick={() => void history.reload()} className="ml-2 underline font-bold">
                      Retry
                    </button>
                  </td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    No vouchers found for the selected filters.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => void openVoucher(v.id)}
                    className={cn("cursor-pointer hover:bg-emerald-50/60", current?.id === v.id && "bg-amber-50/70")}
                  >
                    <td className="px-3 py-2.5 font-bold text-slate-900 font-mono">{v.voucherNo}</td>
                    <td className="px-3 py-2.5 text-slate-600">{formatDate(v.voucherDate)}</td>
                    <td className="px-3 py-2.5 text-slate-700">{v.voucherTypeName ?? v.voucherCategory}</td>
                    <td className="px-3 py-2.5 text-slate-700">{v.debitAccounts || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-700">{v.creditAccounts || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-600">{v.narration || "—"}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-slate-900">{formatINR(v.totalAmount)}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={cn("inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border", statusBadgeClass(v.status))}>
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Reverse Voucher Modal */}
      {reverseReason !== null && current && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50">
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
                        <td className="px-3 py-1.5 border-r border-slate-200 font-bold">{l.debit > 0 ? "Dr" : "Cr"}</td>
                        <td className="px-3 py-1.5 border-r border-slate-200">
                          {l.accountCode} - {l.accountName}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50">
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
    </ModulePageShell>
  );
}
