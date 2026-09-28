"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Printer,
  Download,
  Search,
  Calendar,
  Filter,
  Loader2,
  AlertCircle,
  Save,
  RotateCcw,
  Check,
  SlidersHorizontal,
  ChevronDown,
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField, StatMiniCard, Drawer, FODatePicker } from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import { cn } from "@/lib/utils";
import { accBankReconService, type BankReconEntry } from "@/services/accounts";
import {
  accErrorMessage,
  formatDate,
  formatINR,
  fyStartIso,
  todayIso,
  useAccLookups,
  useAccQuery,
} from "@/components/accounts/accountsApi";

type Toast = { message: string; variant: "success" | "error" } | null;

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

const shiftIso = (iso: string, { years = 0, months = 0, days = 0 }: { years?: number; months?: number; days?: number }) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setFullYear(d.getFullYear() + years, d.getMonth() + months, d.getDate() + days);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

function datePresets() {
  const today = todayIso();
  const fy = fyStartIso(today);
  const fyYear = parseInt(fy.slice(0, 4), 10);
  const monthStart = `${today.slice(0, 7)}-01`;
  const fyLabel = (y: number) => `FY ${y}-${String((y + 1) % 100).padStart(2, "0")}`;
  return [
    { id: "fy", label: fyLabel(fyYear), from: fy, to: shiftIso(fy, { years: 1, days: -1 }) },
    { id: "prevFy", label: fyLabel(fyYear - 1), from: shiftIso(fy, { years: -1 }), to: shiftIso(fy, { days: -1 }) },
    { id: "q1", label: "Q1 Apr-Jun", from: fy, to: shiftIso(fy, { months: 3, days: -1 }) },
    { id: "q2", label: "Q2 Jul-Sep", from: shiftIso(fy, { months: 3 }), to: shiftIso(fy, { months: 6, days: -1 }) },
    { id: "thisMonth", label: "This Month", from: monthStart, to: shiftIso(monthStart, { months: 1, days: -1 }) },
  ];
}

export function BankReconciliationView() {
  const { lookups } = useAccLookups();

  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Bank Account & Date Controls
  const [selectedBank, setSelectedBank] = useState("");
  const [fromDate, setFromDate] = useState(fyStartIso);
  const [toDate, setToDate] = useState(todayIso);
  const [applied, setApplied] = useState(() => ({ bank: "", from: fyStartIso(), to: todayIso() }));
  const [datePreset, setDatePreset] = useState("");

  // Reconciliation options
  const [fullNarration, setFullNarration] = useState(true);
  const [considerPriorUnreconciled, setConsiderPriorUnreconciled] = useState(true);
  const [sortOnChqNo, setSortOnChqNo] = useState(false);
  const [autoSearch, setAutoSearch] = useState(true);
  const [reconAfterToDt, setReconAfterToDt] = useState(true);
  const [systemDtAsReconcileDt, setSystemDtAsReconcileDt] = useState(true);
  const [printReconcileDt, setPrintReconcileDt] = useState(false);
  const [considerReconciled, setConsiderReconciled] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [pending, setPending] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const notify = (message: string, variant: "success" | "error" = "success") => setToast({ message, variant });

  const active = autoSearch ? { bank: selectedBank, from: fromDate, to: toDate } : applied;
  const status = considerReconciled ? "all" : "unreconciled";
  const recon = useAccQuery(
    () =>
      accBankReconService.get({
        bankAccountId: active.bank || undefined,
        from: active.from || undefined,
        to: active.to || undefined,
        status,
      }),
    [active.bank, active.from, active.to, status],
  );

  const bankOptions = useMemo(() => {
    const fromRecon = recon.data?.bankAccounts ?? [];
    if (fromRecon.length) return fromRecon.map((b) => ({ id: b.id, label: `${b.code} - ${b.name}${b.bankAccountNo ? ` (${b.bankAccountNo})` : ""}` }));
    return (lookups?.bankCashAccounts ?? [])
      .filter((b) => b.isBankAccount)
      .map((b) => ({ id: b.id, label: `${b.code} - ${b.name}` }));
  }, [recon.data, lookups]);
  const account = recon.data?.account ?? null;
  const bankId = selectedBank || account?.id || "";
  const summary = recon.data?.summary ?? null;
  const entries = useMemo(() => recon.data?.entries ?? [], [recon.data]);
  const presets = useMemo(() => datePresets(), []);

  const pendingIds = Object.keys(pending).filter((id) => entries.some((e) => e.id === id && !e.reconciled));
  const reconciledCount = pendingIds.length;

  const handleDatePreset = (id: string) => {
    const p = presets.find((x) => x.id === id);
    if (!p) return;
    setDatePreset(id);
    setFromDate(p.from);
    setToDate(p.to);
    setApplied({ bank: selectedBank, from: p.from, to: p.to });
  };

  const handleDisplayReport = () => {
    setApplied({ bank: selectedBank, from: fromDate, to: toDate });
    setPending({});
    setMobileFilterOpen(false);
    if (autoSearch) void recon.reload();
  };

  const handleToggleReconciled = (row: BankReconEntry) => {
    if (row.reconciled) return;
    setPending((prev) => {
      const next = { ...prev };
      if (next[row.id]) delete next[row.id];
      else next[row.id] = systemDtAsReconcileDt ? todayIso() : row.instrumentDate ?? row.voucherDate;
      return next;
    });
  };

  const handleUpdateReconDate = (id: string, dateVal: string) => setPending((prev) => ({ ...prev, [id]: dateVal }));

  const initiateSaveReconciliation = () => {
    if (reconciledCount === 0) {
      notify("Please select at least one transaction to reconcile.", "error");
      return;
    }
    const bad = entries.find((e) => pendingIds.includes(e.id) && (!pending[e.id] || pending[e.id] < e.voucherDate));
    if (bad) {
      notify(`Bank clearing date for ${bad.voucherNo} cannot be empty or before the voucher date (${formatDate(bad.voucherDate)}).`, "error");
      return;
    }
    setShowSaveConfirmModal(true);
  };

  const handleExecuteSaveReconciliation = async () => {
    setIsSaving(true);
    try {
      const res = await accBankReconService.reconcile(pendingIds.map((lineId) => ({ lineId, reconDate: pending[lineId] })));
      notify(`✓ ${res.reconciled} transaction(s) reconciled successfully.`);
      setPending({});
      setShowSaveConfirmModal(false);
      void recon.reload();
    } catch (e) {
      notify(accErrorMessage(e), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const result = entries.filter((item) => {
      if (!considerPriorUnreconciled && active.from && item.voucherDate < active.from) return false;
      if (!reconAfterToDt && item.reconciled && item.reconDate && active.to && item.reconDate > active.to) return false;
      if (!q) return true;
      return [item.voucherNo, item.instrumentNo, item.narration, item.partyName, item.referenceNo]
        .some((s) => (s ?? "").toLowerCase().includes(q));
    });
    return sortOnChqNo
      ? [...result].sort((a, b) => (a.instrumentNo || "").localeCompare(b.instrumentNo || "", undefined, { numeric: true }))
      : result;
  }, [entries, considerPriorUnreconciled, reconAfterToDt, searchQuery, sortOnChqNo, active.from, active.to]);

  const priorUnreconciled = entries
    .filter((e) => !e.reconciled && active.from && e.voucherDate < active.from)
    .reduce((sum, e) => sum + e.debit - e.credit, 0);
  const glClosingBalance = summary?.bookBalance ?? 0;
  const bankStatementBalance = summary?.balanceAsPerBank ?? 0;
  const unreconciledDiff = glClosingBalance - bankStatementBalance;

  const handleExport = () => {
    if (filteredData.length === 0) {
      notify("Nothing to export for the selected filters.", "error");
      return;
    }
    downloadCsv(
      `bank-reconciliation-${account?.code ?? "bank"}-${active.to}.csv`,
      ["Voucher Date", "Voucher No", "Type", "Cheque No", "Cheque Date", "Party", "Narration", "Debit", "Credit", "Reconciled", "Recon Date"],
      filteredData.map((e) => [
        e.voucherDate,
        e.voucherNo,
        e.voucherCategory,
        e.instrumentNo,
        e.instrumentDate,
        e.partyName,
        e.narration,
        e.debit,
        e.credit,
        e.reconciled ? "Yes" : "No",
        e.reconDate,
      ]),
    );
    notify(`Exported ${filteredData.length} entries to CSV.`);
  };

  const trnBadge = (t: string) =>
    t === "Receipt"
      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
      : t === "Payment"
      ? "bg-rose-100 text-rose-800 border-rose-300"
      : "bg-blue-100 text-blue-800 border-blue-300";

  const optionCheckbox = (label: string, checked: boolean, onChange: (v: boolean) => void, className?: string) => (
    <label
      className={cn(
        "flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 border border-slate-200 cursor-pointer hover:border-emerald-300",
        className,
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
      />
      <span className="text-[11px] truncate">{label}</span>
    </label>
  );

  const filterFormContent = (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
      {/* Box 1: Bank Account Selection */}
      <div className="lg:col-span-4 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/70 space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 text-emerald-600" />
          Bank Account Selection
        </p>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-600">Bank Account:</label>
          <select
            value={bankId}
            onChange={(e) => {
              setSelectedBank(e.target.value);
              setPending({});
            }}
            className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 font-bold focus:border-emerald-500 focus:outline-none"
          >
            {bankOptions.length === 0 && <option value="">No bank accounts configured</option>}
            {bankOptions.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </div>

        {optionCheckbox("Consider Prior Unreconciled", considerPriorUnreconciled, setConsiderPriorUnreconciled, "px-2.5 py-1.5 text-xs font-medium text-slate-700")}
      </div>

      {/* Box 2: Reconciliation Options */}
      <div className="lg:col-span-4 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/70 space-y-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600" />
          Reconciliation Controls
        </p>

        <div className="grid grid-cols-2 gap-1.5 text-xs font-medium text-slate-700">
          {optionCheckbox("\"Narration\" as Line Narration", fullNarration, setFullNarration)}
          {optionCheckbox("Sort On Chq.No", sortOnChqNo, setSortOnChqNo)}
          {optionCheckbox("Auto Search", autoSearch, setAutoSearch)}
          {optionCheckbox("Recon after To Dt", reconAfterToDt, setReconAfterToDt)}
          {optionCheckbox("System Dt as Reconcile Dt", systemDtAsReconcileDt, setSystemDtAsReconcileDt)}
          {optionCheckbox("Print Reconcile Dt", printReconcileDt, setPrintReconcileDt)}
          {optionCheckbox("Consider Reconciled", considerReconciled, setConsiderReconciled, "col-span-2")}
        </div>
      </div>

      {/* Box 3: Period & Action Controls */}
      <div className="lg:col-span-4 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/70 space-y-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-emerald-600" />
          Period & Display
        </p>

        <div className="flex flex-wrap items-center gap-1">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleDatePreset(p.id)}
              className={cn(
                "flex-1 min-w-[70px] rounded-lg py-1 text-[10px] font-bold transition-all border cursor-pointer select-none text-center",
                datePreset === p.id
                  ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-2 pt-0.5">
          <FormField label="From Date" className="flex-1 min-w-[105px]">
            <FODatePicker
              value={fromDate}
              onChange={(val) => {
                setFromDate(val);
                setDatePreset("");
              }}
            />
          </FormField>

          <FormField label="To Date" className="flex-1 min-w-[105px]">
            <FODatePicker
              value={toDate}
              onChange={(val) => {
                setToDate(val);
                setDatePreset("");
              }}
            />
          </FormField>

          <Button
            type="button"
            size="sm"
            onClick={handleDisplayReport}
            disabled={recon.loading}
            className="h-8 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-3 shadow-xs shrink-0 disabled:opacity-75 cursor-pointer"
          >
            {recon.loading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Search className="h-3.5 w-3.5 mr-1" />}
            Display
          </Button>
        </div>
      </div>
    </div>
  );

  const bankLabel = account ? `${account.code} - ${account.name}` : "No bank account";

  return (
    <ModulePageShell
      eyebrow="Accounts & Bank Audit"
      title="Bank Reconciliation Statement"
      description="Reconcile General Ledger bank account postings with actual bank statement transactions and un-cleared cheques."
      toast={toast?.message ?? null}
      toastVariant={toast?.variant}
      onDismissToast={() => setToast(null)}
      secondaryActions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={initiateSaveReconciliation}
            disabled={reconciledCount === 0 || isSaving}
            className={cn(
              "rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-all cursor-pointer",
              (reconciledCount === 0 || isSaving) && "opacity-50 cursor-not-allowed",
            )}
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
            Save Reconciliation ({reconciledCount})
          </Button>

          <Link href="/accounts/transactions/bank-reconciliation-reversing">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-semibold bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100 shadow-xs"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1 text-rose-700" />
              Reversing View
            </Button>
          </Link>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl text-xs font-medium bg-white shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Print
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
      {/* Top Controls Toolbar Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="rounded-xl border-slate-200 text-xs font-semibold gap-1.5 hidden md:inline-flex bg-white text-slate-700"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600" />
            <span>{showFilters ? "Hide Parameters" : "Parameters & Options"}</span>
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", showFilters && "rotate-180")} />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMobileFilterOpen(true)}
            className="rounded-xl border-slate-200 text-xs font-semibold gap-1.5 md:hidden bg-white text-slate-700"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filter</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
            <Building2 className="h-3.5 w-3.5 text-emerald-700" />
            Selected Bank: <span className="underline">{bankLabel}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            <Calendar className="h-3.5 w-3.5 text-slate-600" />
            {formatDate(active.from)} – {formatDate(active.to)}
          </span>
        </div>
      </div>

      {/* Desktop Filter Panel (Collapsible) */}
      {showFilters && (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs animate-in fade-in-50">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Bank Reconciliation Parameters & View Controls
              </h3>
            </div>
            <button onClick={() => setShowFilters(false)} className="text-xs text-slate-400 hover:text-slate-600">
              ✕ Hide Options
            </button>
          </div>
          {filterFormContent}
        </div>
      )}

      {/* Mobile Drawer */}
      <Drawer open={mobileFilterOpen} onClose={() => setMobileFilterOpen(false)} title="Bank Reconciliation Options">
        <div className="p-4">
          {filterFormContent}
          <div className="mt-4 border-t border-slate-100 pt-3">
            <Button type="button" className="w-full bg-emerald-700 text-white" onClick={handleDisplayReport}>
              Apply Filter
            </Button>
          </div>
        </div>
      </Drawer>

      {recon.error && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {recon.error}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={() => void recon.reload()} className="rounded-xl bg-white text-xs">
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry
          </Button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatMiniCard
          label="GL Book Closing Balance"
          value={summary ? formatINR(glClosingBalance) : "—"}
          sublabel={`Ledger balance in books as on ${formatDate(recon.data?.asOn ?? active.to)}`}
          accent="#0284c7"
          icon={Building2}
        />
        <StatMiniCard
          label="Balance As Per Bank Statement"
          value={summary ? formatINR(bankStatementBalance) : "—"}
          sublabel="Reconciled (cleared) entries only"
          accent="#16a34a"
          icon={CheckCircle2}
        />
        <StatMiniCard
          label="Unreconciled Difference"
          value={summary ? formatINR(unreconciledDiff) : "—"}
          sublabel={
            summary
              ? `${summary.unreconciledCount} pending • Dr ${formatINR(summary.unreconciledDebit)} / Cr ${formatINR(summary.unreconciledCredit)}`
              : "Pending cheques & uncleared deposits"
          }
          accent="#e11d48"
          icon={AlertCircle}
        />
      </div>

      {/* Bank Reconciliation Summary Info Box */}
      <div className="mb-4 rounded-2xl border border-rose-200/90 bg-rose-50/40 p-4 text-xs space-y-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between font-bold text-rose-900 border-b border-rose-200/60 pb-2 gap-2">
          <span className="flex items-center gap-1.5 text-rose-900 font-bold text-xs">
            <AlertCircle className="h-4 w-4 text-rose-700 shrink-0" />
            Note : The following transactions are not reconciled with bank statement
          </span>
          <span className="text-[11px] uppercase tracking-wider text-slate-600 font-semibold">{bankLabel}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-800 font-semibold">
          <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-slate-600 text-[11px]">Closing Balance</span>
            <span className="font-bold text-slate-900 text-xs">{formatINR(glClosingBalance)}</span>
          </div>

          <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-slate-600 text-[11px]">Balance As Per Bank Statement</span>
            <span className="font-bold text-emerald-800 text-xs">{formatINR(bankStatementBalance)}</span>
          </div>

          <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={considerPriorUnreconciled}
                onChange={(e) => setConsiderPriorUnreconciled(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
              />
              <span className="text-[11px] text-slate-700">not reconciled prior to from date</span>
            </label>
            <span className="font-bold text-rose-700 text-xs">{formatINR(priorUnreconciled)}</span>
          </div>
        </div>
      </div>

      {/* Main Reconciliation Table Card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Bank Transaction Entries Log ({filteredData.length} items)
            </h2>
          </div>

          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search voucher #, chq # or narration..."
              className="h-8 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block max-h-[540px] overflow-y-auto overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5 w-24">VouchDt</th>
                <th className="px-3.5 py-2.5 w-28">Vouch#</th>
                <th className="px-2.5 py-2.5 text-center w-20">TrnType</th>
                <th className="px-3.5 py-2.5 w-32">Chq No</th>
                <th className="px-3 py-2.5 w-24">Chq Dt</th>
                <th className="px-4 py-2.5 min-w-[200px]">Narration</th>
                <th className="px-3 py-2.5 text-right w-28">Dr Amt (₹)</th>
                <th className="px-3 py-2.5 text-right w-28">Cr Amt (₹)</th>
                <th className="px-3 py-2.5 text-center w-24">Reconciled</th>
                <th className={cn("px-3 py-2.5 text-center w-32", !printReconcileDt && "print:hidden")}>Recon Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {recon.loading && !recon.data ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500 font-medium">
                    <Loader2 className="inline h-4 w-4 mr-1 animate-spin text-emerald-600" /> Loading bank entries…
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 font-medium">
                    {account ? "No bank transaction entries found matching the filter criteria." : "No bank account is configured in the chart of accounts."}
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => {
                  const pendingDate = pending[row.id];
                  const ticked = row.reconciled || !!pendingDate;
                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        "even:bg-slate-50/50 hover:bg-slate-100/80 transition-colors",
                        ticked && "bg-emerald-50/60 hover:bg-emerald-100/60 border-l-2 border-l-emerald-600",
                      )}
                    >
                      <td className="px-3 py-2.5 text-slate-600 font-medium">{formatDate(row.voucherDate)}</td>
                      <td className="px-3.5 py-2.5 font-bold text-slate-900">{row.voucherNo}</td>
                      <td className="px-2.5 py-2.5 text-center">
                        <span
                          className={cn(
                            "inline-block px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider",
                            trnBadge(row.voucherCategory),
                          )}
                        >
                          {row.voucherCategory}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 font-bold text-slate-800">{row.instrumentNo || "—"}</td>
                      <td className="px-3 py-2.5 text-slate-600 font-medium">{formatDate(row.instrumentDate)}</td>
                      <td className="px-4 py-2.5 text-slate-800 font-medium">
                        {fullNarration || row.narration.length <= 25 ? row.narration : `${row.narration.slice(0, 25)}...`}
                        {row.partyName && <span className="block text-[10px] text-slate-400">{row.partyName}</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-slate-900">{row.debit > 0 ? formatINR(row.debit) : "-"}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-slate-900">{row.credit > 0 ? formatINR(row.credit) : "-"}</td>
                      <td className="px-3 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={ticked}
                          disabled={row.reconciled}
                          onChange={() => handleToggleReconciled(row)}
                          title={row.reconciled ? "Already reconciled — use the Reversing View to undo" : "Mark as cleared in bank"}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className={cn("px-3 py-2.5 text-center", !printReconcileDt && "print:hidden")}>
                        {row.reconciled ? (
                          <span className="text-xs font-bold text-emerald-800" title={row.reconciledBy ? `By ${row.reconciledBy}` : undefined}>
                            {formatDate(row.reconDate)}
                          </span>
                        ) : pendingDate ? (
                          <input
                            type="date"
                            value={pendingDate}
                            min={row.voucherDate}
                            onChange={(e) => handleUpdateReconDate(row.id, e.target.value)}
                            className="h-6 w-32 rounded border border-slate-200 px-1.5 text-center text-xs font-bold text-emerald-800 focus:border-emerald-500 focus:outline-none"
                          />
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Card View */}
        <div className="md:hidden space-y-2.5">
          {recon.loading && !recon.data ? (
            <div className="p-6 text-center text-slate-500 font-medium text-xs rounded-xl border border-slate-200 bg-white">
              <Loader2 className="inline h-4 w-4 mr-1 animate-spin text-emerald-600" /> Loading bank entries…
            </div>
          ) : filteredData.length === 0 ? (
            <div className="p-6 text-center text-slate-400 font-medium text-xs rounded-xl border border-slate-200 bg-white">
              No bank transaction entries found.
            </div>
          ) : (
            filteredData.map((row) => {
              const pendingDate = pending[row.id];
              const ticked = row.reconciled || !!pendingDate;
              return (
                <div
                  key={row.id}
                  className={cn("rounded-xl border border-slate-200 bg-white p-3.5 space-y-2", ticked && "border-emerald-300 bg-emerald-50/20")}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{row.voucherNo}</span>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ticked}
                        disabled={row.reconciled}
                        onChange={() => handleToggleReconciled(row)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <span>{row.reconciled ? `Reconciled ${formatDate(row.reconDate)}` : pendingDate ? "To reconcile" : "Pending"}</span>
                    </label>
                  </div>

                  <p className="text-xs font-semibold text-slate-800">{row.narration}</p>
                  <p className="text-[11px] text-slate-500">
                    Chq #: {row.instrumentNo || "—"} • Date: {formatDate(row.instrumentDate)}
                  </p>
                  {pendingDate && (
                    <input
                      type="date"
                      value={pendingDate}
                      min={row.voucherDate}
                      onChange={(e) => handleUpdateReconDate(row.id, e.target.value)}
                      className="h-7 w-full rounded border border-slate-200 px-2 text-xs font-bold text-emerald-800"
                    />
                  )}

                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100">
                    <span className="text-slate-500 font-medium">Voucher Dt: {formatDate(row.voucherDate)}</span>
                    <span className="font-bold text-slate-900">
                      {row.debit > 0 ? `Dr ${formatINR(row.debit)}` : `Cr ${formatINR(row.credit)}`}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* SAVE RECONCILIATION CONFIRMATION MODAL */}
      {showSaveConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Confirm Reconciliation</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Bank Audit Confirmation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveConfirmModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs space-y-1.5">
              <p className="text-slate-700 leading-relaxed">
                You are about to reconcile <strong className="text-slate-900">{reconciledCount} selected transaction(s)</strong> in{" "}
                <strong>{bankLabel}</strong>.
              </p>
              <p className="text-[11px] text-emerald-800 font-semibold">
                The bank clearing dates entered will be recorded against each entry.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowSaveConfirmModal(false)}
                className="rounded-xl text-xs font-semibold bg-white cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isSaving}
                onClick={() => void handleExecuteSaveReconciliation()}
                className="rounded-xl font-bold text-xs px-4 text-white bg-emerald-700 hover:bg-emerald-800 cursor-pointer"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </ModulePageShell>
  );
}
