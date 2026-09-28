"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Clock,
  CheckCircle2,
  Printer,
  Download,
  Search,
  Loader2,
  FileText,
  AlertCircle,
  X,
  RotateCcw,
  Check,
  Pencil,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  TextInput,
  StatMiniCard,
  FODatePicker,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import { cn } from "@/lib/utils";
import { accVoucherService, type Voucher, type VoucherInput } from "@/services/accounts";
import {
  accErrorMessage,
  formatDate,
  formatINR,
  todayIso,
  useAccLookups,
  useAccQuery,
} from "@/components/accounts/accountsApi";

const PROVISION_CATEGORIES = [
  "Accrued Expenses",
  "Unbilled Revenue",
  "Provision for Utilities",
  "Vendor Provision",
  "Tax Provision",
];

const PROVISIONAL_TYPES = [
  "Provisional Journal",
  "Provisional Receipt",
  "Provisional Payment",
  "Provisional Purchase",
];

const EXPENSE_CATEGORIES = ["Accrued Expenses", "Provision for Utilities", "Vendor Provision"];

type StatusFilter = "<ALL>" | "Provisional" | "Converted" | "Reversed";
const STATUS_LABEL: Record<StatusFilter, string> = {
  "<ALL>": "<ALL>",
  Provisional: "Provisional",
  Converted: "Converted to GL",
  Reversed: "Reversed",
};

type Toast = { message: string; variant: "success" | "error" } | null;

interface VerificationState {
  type: "POST" | "CONVERT" | "REVERSE";
  item?: Voucher | null;
  confirmedCheckbox: boolean;
  reason: string;
  convertDate: string;
}

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

const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

/** The first line is the provision ledger, the second its offset. */
const mainLine = (v: Voucher) => v.lines[0];
const contraLine = (v: Voucher) => v.lines[1];

export function ProvisionalTransactionsView() {
  const { lookups, loading: lookupsLoading, error: lookupsError, reload: reloadLookups } = useAccLookups();

  // Provisional Entry Form State
  const [editing, setEditing] = useState<Voucher | null>(null);
  const [vouchDt, setVouchDt] = useState(todayIso());
  const [expiryDt, setExpiryDt] = useState(addDays(todayIso(), 30));
  const [category, setCategory] = useState(PROVISION_CATEGORIES[0]);
  const [vouchType, setVouchType] = useState(PROVISIONAL_TYPES[0]);
  const [accountId, setAccountId] = useState("");
  const [contraAccountId, setContraAccountId] = useState("");
  const [partyId, setPartyId] = useState("");
  const [drAmt, setDrAmt] = useState<number>(0);
  const [crAmt, setCrAmt] = useState<number>(0);
  const [narration, setNarration] = useState("");
  const [preview, setPreview] = useState<{ key: string; voucherNo: string } | null>(null);
  const [previewNonce, setPreviewNonce] = useState(0);

  // List filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("<ALL>");

  const [isPosting, setIsPosting] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const notify = (message: string, variant: "success" | "error" = "success") => setToast({ message, variant });
  const [verificationModal, setVerificationModal] = useState<VerificationState | null>(null);

  const list = useAccQuery(() => accVoucherService.list({ provisional: true, limit: 1000 }), []);
  const transactions = useMemo(() => list.data ?? [], [list.data]);

  const prvType = lookups?.voucherTypes.find((vt) => vt.shortCode === "PRV");
  const ledgers = lookups?.ledgers ?? [];
  const ledgerName = (id: string) => {
    const l = ledgers.find((x) => x.id === id);
    return l ? `${l.code} - ${l.name}` : "—";
  };
  const partyName = lookups?.parties.find((p) => p.id === partyId)?.partyName ?? "";

  const previewKey = `${prvType?.id}|${vouchDt}`;
  useEffect(() => {
    if (!prvType?.id || !vouchDt || editing) return;
    let cancelled = false;
    const key = `${prvType.id}|${vouchDt}`;
    accVoucherService
      .nextNumber(prvType.id, vouchDt)
      .then((r) => {
        if (!cancelled) setPreview({ key, voucherNo: r.voucherNo });
      })
      .catch(() => {
        if (!cancelled) setPreview({ key, voucherNo: "" });
      });
    return () => {
      cancelled = true;
    };
  }, [prvType, vouchDt, editing, previewNonce]);
  const vouchNo = editing
    ? editing.voucherNo
    : !prvType
    ? "Assigned on save"
    : preview?.key === previewKey
    ? preview.voucherNo || "—"
    : "…";

  const amount = drAmt > 0 ? drAmt : crAmt;

  const resetForm = () => {
    setEditing(null);
    setDrAmt(0);
    setCrAmt(0);
    setNarration("");
    setPartyId("");
    setAccountId("");
    setContraAccountId("");
    setPreviewNonce((n) => n + 1);
  };

  const startEdit = (v: Voucher) => {
    if (v.lines.length !== 2) {
      notify(`${v.voucherNo} has ${v.lines.length} lines and cannot be edited on this screen.`, "error");
      return;
    }
    const main = mainLine(v);
    setEditing(v);
    setVouchDt(v.voucherDate);
    setExpiryDt(v.expiryDate ?? "");
    setCategory(v.provisionalCategory || PROVISION_CATEGORIES[0]);
    setVouchType(v.provisionalType || PROVISIONAL_TYPES[0]);
    setAccountId(main.accountId);
    setContraAccountId(contraLine(v).accountId);
    setPartyId(v.partyId ?? "");
    setDrAmt(main.debit);
    setCrAmt(main.credit);
    setNarration(v.narration ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const initiatePostProvisional = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || !contraAccountId) {
      notify("Select both the provision ledger and its offset (contra) ledger.", "error");
      return;
    }
    if (accountId === contraAccountId) {
      notify("The provision ledger and the offset ledger must be different.", "error");
      return;
    }
    if ((drAmt > 0) === (crAmt > 0)) {
      notify("Enter either a Debit or a Credit amount greater than zero (not both).", "error");
      return;
    }
    if (expiryDt && expiryDt < vouchDt) {
      notify("Target expiry date cannot be before the posting date.", "error");
      return;
    }
    setVerificationModal({ type: "POST", confirmedCheckbox: false, reason: "", convertDate: todayIso() });
  };

  const initiateConvert = (item: Voucher) =>
    setVerificationModal({ type: "CONVERT", item, confirmedCheckbox: false, reason: "", convertDate: todayIso() });

  const initiateReverse = (item: Voucher) =>
    setVerificationModal({ type: "REVERSE", item, confirmedCheckbox: false, reason: "", convertDate: todayIso() });

  const buildInput = (): VoucherInput => {
    const isDebit = drAmt > 0;
    return {
      voucherTypeCode: "PRV",
      voucherTypeId: prvType?.id,
      voucherDate: vouchDt,
      narration: narration.trim(),
      status: "Provisional",
      partyId: partyId || null,
      provisionalCategory: category,
      provisionalType: vouchType,
      expiryDate: expiryDt || null,
      lines: [
        { accountId, entryType: isDebit ? "Dr" : "Cr", amount },
        { accountId: contraAccountId, entryType: isDebit ? "Cr" : "Dr", amount },
      ],
    };
  };

  const handleExecuteDoubleVerifiedAction = async () => {
    if (!verificationModal?.confirmedCheckbox) return;
    const { type, item, reason, convertDate } = verificationModal;
    if (type === "REVERSE" && !reason.trim()) {
      notify("A reversal reason is required.", "error");
      return;
    }

    setIsPosting(true);
    try {
      if (type === "POST") {
        if (editing) {
          const saved = await accVoucherService.update(editing.id, buildInput());
          notify(`✓ Provisional entry ${saved.voucherNo} updated.`);
        } else {
          const saved = await accVoucherService.create(buildInput());
          notify(`✓ Provisional entry ${saved.voucherNo} for ${formatINR(saved.totalAmount)} created successfully.`);
        }
        resetForm();
      } else if (type === "CONVERT" && item) {
        const res = await accVoucherService.convert(item.id, { voucherDate: convertDate || undefined });
        notify(`✓ Provisional voucher ${item.voucherNo} converted to GL voucher ${res.voucher.voucherNo}.`);
      } else if (type === "REVERSE" && item) {
        await accVoucherService.reverse(item.id, reason.trim());
        notify(`✓ Provisional voucher ${item.voucherNo} reversed.`);
        if (editing?.id === item.id) resetForm();
      }
      setVerificationModal(null);
      void list.reload();
    } catch (e) {
      notify(accErrorMessage(e), "error");
    } finally {
      setIsPosting(false);
    }
  };

  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return transactions.filter((item) => {
      if (statusFilter !== "<ALL>" && item.status !== statusFilter) return false;
      if (!q) return true;
      return [item.voucherNo, item.partyName, item.debitAccounts, item.creditAccounts, item.provisionalCategory, item.narration]
        .some((s) => (s ?? "").toLowerCase().includes(q));
    });
  }, [transactions, statusFilter, searchQuery]);

  const active = transactions.filter((t) => t.status === "Provisional");
  const activeProvisionalTotal = active.reduce((sum, t) => sum + t.totalAmount, 0);
  const accruedExpenseTotal = active
    .filter((t) => EXPENSE_CATEGORIES.includes(t.provisionalCategory ?? ""))
    .reduce((sum, t) => sum + t.totalAmount, 0);
  const unbilledRevenueTotal = active
    .filter((t) => t.provisionalCategory === "Unbilled Revenue")
    .reduce((sum, t) => sum + t.totalAmount, 0);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Provisional":
        return "bg-amber-100 text-amber-900 border-amber-300";
      case "Converted":
        return "bg-emerald-100 text-emerald-900 border-emerald-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };
  const statusLabel = (s: string) => (s === "Converted" ? "Converted to GL" : s);

  const handleExport = () => {
    if (filteredData.length === 0) {
      notify("Nothing to export for the selected filters.", "error");
      return;
    }
    downloadCsv(
      "provisional-transactions.csv",
      ["Voucher No", "Date", "Expiry", "Category", "Type", "Party", "Ledger", "Offset Ledger", "Debit", "Credit", "Status", "Narration"],
      filteredData.map((v) => [
        v.voucherNo,
        v.voucherDate,
        v.expiryDate,
        v.provisionalCategory,
        v.provisionalType,
        v.partyName,
        mainLine(v)?.accountName,
        contraLine(v)?.accountName,
        mainLine(v)?.debit,
        mainLine(v)?.credit,
        statusLabel(v.status),
        v.narration,
      ]),
    );
    notify(`Exported ${filteredData.length} provisional entries to CSV.`);
  };

  const selectClass =
    "h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 font-semibold focus:border-blue-500 focus:outline-none";

  const renderRowActions = (row: Voucher, compact: boolean) =>
    row.status === "Provisional" ? (
      <div className={cn("flex items-center gap-1", compact ? "justify-center" : "justify-end w-full")}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => initiateConvert(row)}
          className={cn(
            "font-bold bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 cursor-pointer",
            compact ? "h-6 px-2 text-[10px] rounded-md" : "h-7 text-xs flex-1 justify-center",
          )}
          title="Convert to Permanent GL Voucher"
        >
          <Check className="h-3 w-3 mr-0.5" /> Convert to GL
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => startEdit(row)}
          className={cn(
            "font-bold bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 cursor-pointer",
            compact ? "h-6 px-2 text-[10px] rounded-md" : "h-7 text-xs",
          )}
          title="Edit Provision"
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => initiateReverse(row)}
          className={cn(
            "font-bold bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 cursor-pointer",
            compact ? "h-6 px-2 text-[10px] rounded-md" : "h-7 text-xs",
          )}
          title="Reverse Provision"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      </div>
    ) : (
      <span className="text-[10px] text-slate-400 font-medium">Completed</span>
    );

  const modalItem = verificationModal?.item;

  return (
    <ModulePageShell
      eyebrow="Accounts & Period-End Accruals"
      title="Provisional Transactions"
      description="Post temporary accruals, unbilled revenue provisions, and estimated expenses prior to permanent GL audit posting."
      toast={toast?.message ?? null}
      toastVariant={toast?.variant}
      onDismissToast={() => setToast(null)}
      secondaryActions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl text-xs font-medium bg-white shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Print List
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="rounded-xl text-xs font-medium bg-white shadow-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export CSV
          </Button>
        </div>
      }
    >
      {lookupsError ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Could not load ledgers and parties: {lookupsError}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={() => void reloadLookups(true)} className="rounded-xl bg-white text-xs">
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : lookupsLoading && !lookups ? (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> Loading ledgers and parties…
        </div>
      ) : null}

      {/* KPI Cards Grid */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatMiniCard
          label="Active Provisional Entries"
          value={formatINR(activeProvisionalTotal)}
          sublabel={`${active.length} pending period-end accruals`}
          accent="#0284c7"
          icon={Clock}
        />
        <StatMiniCard
          label="Accrued Expense Provisions"
          value={formatINR(accruedExpenseTotal)}
          sublabel="Estimated utility & supplier bills"
          accent="#e11d48"
          icon={FileText}
        />
        <StatMiniCard
          label="Unbilled Revenue Provisions"
          value={formatINR(unbilledRevenueTotal)}
          sublabel="Provisional guest room settlements"
          accent="#16a34a"
          icon={CheckCircle2}
        />
      </div>

      {/* Provisional Voucher Entry Form Card */}
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 font-bold text-white text-xs shadow-2xs">
              <Clock className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editing ? `Edit Provisional Entry ${editing.voucherNo}` : "New Provisional Entry / Accrual"}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Record temporary estimated provisions prior to final bill verification.
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 rounded-xl bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-900 border border-amber-200">
            <AlertCircle className="h-3.5 w-3.5 text-amber-700" />
            Provisional Mode: Excluded from Tax Statements until Converted
          </span>
        </div>

        {/* Entry Form Grid */}
        <form onSubmit={initiatePostProvisional} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/70">
            <FormField label="Prov Voucher No">
              <TextInput value={vouchNo} readOnly className="h-8 text-xs font-bold bg-white text-blue-800 border-slate-200" />
            </FormField>

            <FormField label="Posting Date" required>
              <FODatePicker value={vouchDt} onChange={(val) => setVouchDt(val)} />
            </FormField>

            <FormField label="Target Expiry Date">
              <FODatePicker value={expiryDt} onChange={(val) => setExpiryDt(val)} />
            </FormField>

            <FormField label="Provision Category">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
                {PROVISION_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Voucher Type">
              <select value={vouchType} onChange={(e) => setVouchType(e.target.value)} className={selectClass}>
                {PROVISIONAL_TYPES.map((vt) => (
                  <option key={vt} value={vt}>
                    {vt}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Account Ledger" required>
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={selectClass}>
                <option value="">Select ledger…</option>
                {ledgers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code} - {l.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Offset (Contra) Ledger" required>
              <select value={contraAccountId} onChange={(e) => setContraAccountId(e.target.value)} className={selectClass}>
                <option value="">Select ledger…</option>
                {ledgers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code} - {l.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Party / Sub-Ledger">
              <select value={partyId} onChange={(e) => setPartyId(e.target.value)} className={selectClass}>
                <option value="">— General Provision —</option>
                {(lookups?.parties ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.partyName} ({p.partyCode})
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Debit Amount (₹)">
              <input
                type="number"
                min={0}
                step="0.01"
                value={drAmt || ""}
                onChange={(e) => {
                  const v = parseFloat(e.target.value) || 0;
                  setDrAmt(v);
                  if (v > 0) setCrAmt(0);
                }}
                placeholder="0.00"
                className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-right text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </FormField>

            <FormField label="Credit Amount (₹)">
              <input
                type="number"
                min={0}
                step="0.01"
                value={crAmt || ""}
                onChange={(e) => {
                  const v = parseFloat(e.target.value) || 0;
                  setCrAmt(v);
                  if (v > 0) setDrAmt(0);
                }}
                placeholder="0.00"
                className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-right text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </FormField>

            <FormField label="Provisional Narration" className="sm:col-span-2">
              <TextInput
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                placeholder="Explain the purpose of this provisional entry..."
                className="h-8 text-xs bg-white"
              />
            </FormField>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetForm}
              className="rounded-xl text-xs font-semibold bg-white"
            >
              {editing ? "Cancel Edit" : "Clear Form"}
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={isPosting}
              className="rounded-xl font-bold text-xs px-4 shadow-sm text-white bg-blue-700 hover:bg-blue-800 cursor-pointer disabled:opacity-75"
            >
              {isPosting ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Clock className="h-3.5 w-3.5 mr-1" />}
              {editing ? "Update Provisional Entry" : "Post Provisional Entry"}
            </Button>
          </div>
        </form>
      </section>

      {/* Provisional Entries Audit & Conversion Table */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Provisional Transactions Audit Log
            </h2>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
              {(Object.keys(STATUS_LABEL) as StatusFilter[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all cursor-pointer select-none",
                    statusFilter === st ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  {STATUS_LABEL[st]}
                </button>
              ))}
            </div>

            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search prov #, party or ledger..."
                className="h-8 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {list.error ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
            <span>{list.error}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => void list.reload()} className="rounded-xl bg-white text-xs">
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry
            </Button>
          </div>
        ) : list.loading && !list.data ? (
          <div className="flex items-center justify-center gap-2 py-8 text-xs font-medium text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> Loading provisional entries…
          </div>
        ) : filteredData.length === 0 ? (
          <div className="py-8 text-center text-xs font-medium text-slate-400">
            {transactions.length === 0 ? "No provisional entries have been recorded yet." : "No provisional entries match the filters."}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <th className="px-3.5 py-2.5">Prov Vouch #</th>
                    <th className="px-3 py-2.5">Date</th>
                    <th className="px-3 py-2.5">Category</th>
                    <th className="px-3.5 py-2.5">Account / Party</th>
                    <th className="px-3.5 py-2.5 text-right">Debit (₹)</th>
                    <th className="px-3.5 py-2.5 text-right">Credit (₹)</th>
                    <th className="px-3.5 py-2.5 text-center">Status</th>
                    <th className="px-3.5 py-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredData.map((row) => {
                    const main = mainLine(row);
                    return (
                      <tr key={row.id} className={cn("hover:bg-slate-50", editing?.id === row.id && "bg-blue-50/60")}>
                        <td className="px-3.5 py-2.5 font-bold text-slate-900">
                          {row.voucherNo}
                          {row.provisionalType && (
                            <span className="block text-[10px] text-slate-400 font-normal">{row.provisionalType}</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 font-medium">
                          {formatDate(row.voucherDate)}
                          <span
                            className={cn(
                              "block text-[10px]",
                              row.status === "Provisional" && row.expiryDate && row.expiryDate < todayIso()
                                ? "text-rose-600 font-bold"
                                : "text-slate-400",
                            )}
                          >
                            Exp: {formatDate(row.expiryDate)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-slate-700">{row.provisionalCategory ?? "—"}</td>
                        <td className="px-3.5 py-2.5 font-semibold text-slate-900">
                          {row.partyName ?? "General Provision"}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {main?.accountName ?? "—"}
                            {contraLine(row) ? ` ↔ ${contraLine(row).accountName}` : ""}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-bold text-slate-900">
                          {main && main.debit > 0 ? formatINR(main.debit) : "-"}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-bold text-slate-900">
                          {main && main.credit > 0 ? formatINR(main.credit) : "-"}
                        </td>
                        <td className="px-3.5 py-2.5 text-center">
                          <span
                            className={cn(
                              "inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                              getStatusBadgeClass(row.status),
                            )}
                          >
                            {statusLabel(row.status)}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-center">{renderRowActions(row, true)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card View */}
            <div className="md:hidden space-y-2.5">
              {filteredData.map((row) => {
                const main = mainLine(row);
                return (
                  <div key={row.id} className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{row.voucherNo}</span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                          getStatusBadgeClass(row.status),
                        )}
                      >
                        {statusLabel(row.status)}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-900">{row.partyName ?? "General Provision"}</p>
                    <p className="text-[11px] text-slate-500">
                      {main?.accountName ?? "—"} • {row.provisionalCategory ?? "—"}
                    </p>

                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100">
                      <span className="text-slate-500 font-medium">{formatDate(row.voucherDate)}</span>
                      <span className="font-bold text-slate-900">
                        {main && main.debit > 0 ? `Dr ${formatINR(main.debit)}` : `Cr ${formatINR(main?.credit ?? 0)}`}
                      </span>
                    </div>

                    {row.status === "Provisional" && (
                      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">{renderRowActions(row, false)}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* DOUBLE VERIFICATION CONFIRMATION MODAL */}
      {verificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                  🔐
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                    Double Verification Confirmation
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    {verificationModal.type === "POST" &&
                      (editing ? "Confirming Provisional Entry Changes" : "Confirming New Provisional Accrual Entry")}
                    {verificationModal.type === "CONVERT" && "Converting Provisional Entry to Permanent GL Voucher"}
                    {verificationModal.type === "REVERSE" && "Reversing Provisional Transaction"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVerificationModal(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Target Entry Summary Card */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 font-mono text-xs">
              {verificationModal.type === "POST" ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Provisional Voucher #:</span>
                    <strong className="text-slate-900">{vouchNo}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Posting / Expiry Date:</span>
                    <strong className="text-slate-900">
                      {formatDate(vouchDt)} (Exp: {formatDate(expiryDt)})
                    </strong>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500 font-bold shrink-0">Category &amp; Ledger:</span>
                    <strong className="text-slate-900 text-right">
                      {category} • {ledgerName(accountId)}
                    </strong>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500 font-bold shrink-0">Offset Ledger:</span>
                    <strong className="text-slate-900 text-right">{ledgerName(contraAccountId)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Party Name:</span>
                    <strong className="text-slate-900">{partyName || "General Provision"}</strong>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5 text-sm font-extrabold">
                    <span className="text-slate-700">Provisional Amount:</span>
                    <span className="text-emerald-800">{drAmt > 0 ? `Dr ${formatINR(drAmt)}` : `Cr ${formatINR(crAmt)}`}</span>
                  </div>
                </>
              ) : (
                modalItem && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">Provisional Voucher #:</span>
                      <strong className="text-slate-900">{modalItem.voucherNo}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">Posting / Expiry Date:</span>
                      <strong className="text-slate-900">
                        {formatDate(modalItem.voucherDate)} (Exp: {formatDate(modalItem.expiryDate)})
                      </strong>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500 font-bold shrink-0">Category &amp; Ledger:</span>
                      <strong className="text-slate-900 text-right">
                        {modalItem.provisionalCategory ?? "—"} • {mainLine(modalItem)?.accountName ?? "—"}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">Party Name:</span>
                      <strong className="text-slate-900">{modalItem.partyName ?? "General Provision"}</strong>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1.5 text-sm font-extrabold">
                      <span className="text-slate-700">Provisional Amount:</span>
                      <span className="text-emerald-800">{formatINR(modalItem.totalAmount)}</span>
                    </div>
                  </>
                )
              )}
            </div>

            {verificationModal.type === "CONVERT" && (
              <FormField label="GL Voucher Date for Conversion">
                <TextInput
                  type="date"
                  value={verificationModal.convertDate}
                  onChange={(e) => setVerificationModal({ ...verificationModal, convertDate: e.target.value })}
                  className="h-8 text-xs"
                />
              </FormField>
            )}

            {verificationModal.type === "REVERSE" && (
              <FormField label="Reversal Reason" required>
                <TextInput
                  value={verificationModal.reason}
                  onChange={(e) => setVerificationModal({ ...verificationModal, reason: e.target.value })}
                  placeholder="Why is this provision being reversed?"
                  className="h-8 text-xs"
                />
              </FormField>
            )}

            {/* Mandatory Verification Checkbox */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs">
              <label className="flex items-start gap-2.5 cursor-pointer font-bold text-amber-950">
                <input
                  type="checkbox"
                  checked={verificationModal.confirmedCheckbox}
                  onChange={(e) => setVerificationModal({ ...verificationModal, confirmedCheckbox: e.target.checked })}
                  className="rounded border-amber-400 text-emerald-700 h-4 w-4 mt-0.5"
                />
                <span>
                  Double Verification Check: I confirm that I have verified physical supporting invoices, GL ledger accounts, and authorized this financial action.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVerificationModal(null)}
                className="rounded-xl text-xs font-semibold bg-white cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={
                  !verificationModal.confirmedCheckbox ||
                  isPosting ||
                  (verificationModal.type === "REVERSE" && !verificationModal.reason.trim())
                }
                onClick={() => void handleExecuteDoubleVerifiedAction()}
                className={cn(
                  "rounded-xl font-bold text-xs px-4 text-white cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                  verificationModal.type === "REVERSE" ? "bg-rose-700 hover:bg-rose-800" : "bg-emerald-700 hover:bg-emerald-800",
                )}
              >
                {isPosting ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                Confirm &amp; Execute Action
              </Button>
            </div>
          </div>
        </div>
      )}
    </ModulePageShell>
  );
}
