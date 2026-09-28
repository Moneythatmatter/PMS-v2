"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  RotateCcw,
  CheckCircle2,
  Search,
  Calendar,
  SlidersHorizontal,
  Printer,
  Download,
  Info,
  ShieldAlert,
  X,
  ChevronDown,
  Filter,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField, StatMiniCard, Drawer, FODatePicker } from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import { cn } from "@/lib/utils";
import { accBankReconService } from "@/services/accounts";
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

const trnBadge = (t: string) =>
  t === "Receipt"
    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
    : t === "Payment"
    ? "bg-rose-100 text-rose-800 border-rose-300"
    : "bg-blue-100 text-blue-800 border-blue-300";

export function BankReconciliationReversingView() {
  const { lookups } = useAccLookups();

  const [showFilters, setShowFilters] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Bank & Filter Controls
  const [selectedBank, setSelectedBank] = useState("");
  const [fromReconDate, setFromReconDate] = useState(fyStartIso);
  const [toReconDate, setToReconDate] = useState(todayIso);
  const [applied, setApplied] = useState(() => ({ bank: "", from: fyStartIso(), to: todayIso() }));
  const [searchQuery, setSearchQuery] = useState("");

  const [reverseReason, setReverseReason] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [isReversing, setIsReversing] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const notify = (message: string, variant: "success" | "error" = "success") => setToast({ message, variant });
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [targetReversalIds, setTargetReversalIds] = useState<string[]>([]);

  // Voucher date <= recon date, so limiting voucher dates to the recon "to" date never hides a match.
  const recon = useAccQuery(
    () =>
      accBankReconService.get({
        bankAccountId: applied.bank || undefined,
        to: applied.to || undefined,
        status: "reconciled",
      }),
    [applied],
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
  const bankLabel = account ? `${account.code} - ${account.name}` : "No bank account";

  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (recon.data?.entries ?? []).filter((item) => {
      if (!item.reconciled) return false;
      const d = item.reconDate ?? item.voucherDate;
      if (applied.from && d < applied.from) return false;
      if (applied.to && d > applied.to) return false;
      if (!q) return true;
      return [item.voucherNo, item.instrumentNo, item.narration, item.partyName, item.referenceNo]
        .some((s) => (s ?? "").toLowerCase().includes(q));
    });
  }, [recon.data, applied.from, applied.to, searchQuery]);

  const selectedEntriesInLog = filteredData.filter((item) => selectedIds.has(item.id));
  const selectedCount = selectedEntriesInLog.length;
  const selectedTotalValue = selectedEntriesInLog.reduce((sum, item) => sum + Math.max(item.debit, item.credit), 0);

  const totalReconciledCount = filteredData.length;
  const totalReconciledDr = filteredData.reduce((sum, item) => sum + item.debit, 0);
  const totalReconciledCr = filteredData.reduce((sum, item) => sum + item.credit, 0);
  const totalReconciledValue = totalReconciledDr - totalReconciledCr;

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedCount === filteredData.length && filteredData.length > 0) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredData.map((e) => e.id)));
  };

  const targetItems = filteredData.filter((item) => targetReversalIds.includes(item.id));
  const targetTotalAmount = targetItems.reduce((sum, item) => sum + Math.max(item.debit, item.credit), 0);

  const handleInitiateReversal = (specificId?: string) => {
    const ids = (specificId ? [specificId] : [...selectedIds]).filter((id) => filteredData.some((f) => f.id === id));
    if (ids.length === 0) {
      notify("Please select at least one reconciled transaction to reverse.", "error");
      return;
    }
    setTargetReversalIds(ids);
    setShowVerificationModal(true);
  };

  const handleExecuteReversal = async () => {
    if (!reverseReason.trim()) {
      notify("A reason is required to unreconcile entries.", "error");
      return;
    }
    setIsReversing(true);
    try {
      const res = await accBankReconService.unreconcile(targetReversalIds, reverseReason.trim());
      notify(`✓ ${res.unreconciled} transaction(s) moved back to unreconciled.`);
      setSelectedIds(new Set());
      setTargetReversalIds([]);
      setShowVerificationModal(false);
      void recon.reload();
    } catch (e) {
      notify(accErrorMessage(e), "error");
    } finally {
      setIsReversing(false);
    }
  };

  const handleFetchReconciledLogs = () => {
    if (fromReconDate && toReconDate && fromReconDate > toReconDate) {
      notify("From recon date cannot be after the to recon date.", "error");
      return;
    }
    setApplied({ bank: selectedBank, from: fromReconDate, to: toReconDate });
    setSelectedIds(new Set());
    setMobileFilterOpen(false);
  };

  const handleExport = () => {
    if (filteredData.length === 0) {
      notify("Nothing to export for the selected filters.", "error");
      return;
    }
    downloadCsv(
      `reconciled-entries-${account?.code ?? "bank"}.csv`,
      ["Voucher Date", "Voucher No", "Type", "Cheque No", "Cheque Date", "Party", "Narration", "Debit", "Credit", "Recon Date", "Reconciled By"],
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
        e.reconDate,
        e.reconciledBy,
      ]),
    );
    notify(`Exported ${filteredData.length} reconciled entries to CSV.`);
  };

  const filterFormContent = (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
      {/* Box 1: Bank Account */}
      <div className="lg:col-span-4 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/70 space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 text-rose-600" />
          Bank Account Selection
        </p>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-600">Bank Account:</label>
          <select
            value={bankId}
            onChange={(e) => setSelectedBank(e.target.value)}
            className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 font-bold focus:border-rose-500 focus:outline-none"
          >
            {bankOptions.length === 0 && <option value="">No bank accounts configured</option>}
            {bankOptions.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 pt-1 text-xs text-slate-600 font-medium">
          <Info className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          <span>Select account to view and reverse posted reconciliations.</span>
        </div>
      </div>

      {/* Box 2: Reversal Parameters */}
      <div className="lg:col-span-4 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/70 space-y-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5 text-rose-600" />
          Reversal Settings
        </p>

        <div className="space-y-2 text-xs">
          <div>
            <label className="text-[11px] font-semibold text-slate-600">
              Reversal Reason / Remark: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={reverseReason}
              onChange={(e) => setReverseReason(e.target.value)}
              placeholder="e.g. Statement mismatch correction"
              className="mt-1 h-7 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-800 focus:border-rose-500 focus:outline-none"
            />
          </div>
          <p className="text-[11px] text-slate-500">Every reversal is recorded in the accounts audit trail with this reason.</p>
        </div>
      </div>

      {/* Box 3: Reconciliation Date Range */}
      <div className="lg:col-span-4 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/70 space-y-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-rose-600" />
          Reconciliation Date Period
        </p>

        <div className="flex items-center gap-2">
          <FormField label="From Recon Date" className="flex-1">
            <FODatePicker value={fromReconDate} onChange={setFromReconDate} />
          </FormField>

          <FormField label="To Recon Date" className="flex-1">
            <FODatePicker value={toReconDate} onChange={setToReconDate} />
          </FormField>
        </div>

        <Button
          type="button"
          onClick={handleFetchReconciledLogs}
          disabled={recon.loading}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white text-xs h-7 rounded-lg font-bold cursor-pointer"
        >
          {recon.loading && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
          Fetch Reconciled Logs
        </Button>
      </div>
    </div>
  );

  return (
    <ModulePageShell
      eyebrow="Accounts & Bank Audit"
      title="Bank Reconciliation Reversing"
      description="Select and un-reconcile previously cleared bank statement entries to restore them to pending status."
      toast={toast?.message ?? null}
      toastVariant={toast?.variant}
      onDismissToast={() => setToast(null)}
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Transactions", href: "/accounts/transactions" },
        { label: "Bank Reconciliation Reversing" },
      ]}
      actionButtons={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            disabled={selectedCount === 0 || isReversing}
            onClick={() => handleInitiateReversal()}
            className={cn(
              "rounded-xl text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white shadow-xs transition-all cursor-pointer",
              (selectedCount === 0 || isReversing) && "opacity-50 cursor-not-allowed",
            )}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            {isReversing ? "Reversing..." : `Reverse Reconciliation (${selectedCount})`}
          </Button>

          <Link href="/accounts/transactions/bank-reconciliation">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-semibold bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100 shadow-xs cursor-pointer"
            >
              <Building2 className="h-3.5 w-3.5 mr-1.5 text-emerald-700" />
              Reconciliation View
            </Button>
          </Link>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl text-xs font-medium bg-white shadow-xs cursor-pointer text-slate-700"
          >
            <Printer className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
            Print Log
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="rounded-xl text-xs font-medium bg-white shadow-xs cursor-pointer text-slate-700"
          >
            <Download className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
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
            className="rounded-xl border-slate-200 text-xs font-semibold gap-1.5 hidden md:inline-flex bg-white text-slate-700 cursor-pointer"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-rose-600" />
            <span>{showFilters ? "Hide Parameters" : "Parameters & Options"}</span>
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", showFilters && "rotate-180")} />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMobileFilterOpen(true)}
            className="rounded-xl border-slate-200 text-xs font-semibold gap-1.5 md:hidden bg-white text-slate-700 cursor-pointer"
          >
            <Filter className="h-3.5 w-3.5 text-rose-600" />
            <span>Filter</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800 border border-rose-200">
            <Building2 className="h-3.5 w-3.5 text-rose-700" />
            Selected Bank: <span className="underline">{bankLabel}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            <Calendar className="h-3.5 w-3.5 text-slate-600" />
            {formatDate(applied.from)} – {formatDate(applied.to)}
          </span>
        </div>
      </div>

      {/* Desktop Filter Panel (Collapsible) */}
      {showFilters && (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs animate-in fade-in-50">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-rose-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Reversal Search Parameters &amp; Options</h3>
            </div>
            <button
              onClick={() => setShowFilters(false)}
              className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer font-medium"
            >
              ✕ Hide Options
            </button>
          </div>
          {filterFormContent}
        </div>
      )}

      {/* Mobile Drawer */}
      <Drawer open={mobileFilterOpen} onClose={() => setMobileFilterOpen(false)} title="Reversal Parameters & Options">
        <div className="p-4">
          {filterFormContent}
          <div className="mt-4 border-t border-slate-100 pt-3">
            <Button type="button" className="w-full bg-rose-700 text-white font-bold" onClick={handleFetchReconciledLogs}>
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
          label="Total Reconciled Entries"
          value={totalReconciledCount.toString()}
          sublabel="Available for reversal"
          accent="#0284c7"
          icon={CheckCircle2}
        />
        <StatMiniCard
          label="Total Reconciled Net Value"
          value={formatINR(totalReconciledValue)}
          sublabel="Debit - Credit cleared total"
          accent="#16a34a"
          icon={Building2}
        />
        <StatMiniCard
          label="Selected for Reversal"
          value={`${selectedCount} ${selectedCount === 1 ? "Entry" : "Entries"}`}
          sublabel={selectedCount > 0 ? `Total Value: ${formatINR(selectedTotalValue)}` : "Select checkboxes in log below"}
          accent="#e11d48"
          icon={RotateCcw}
        />
      </div>

      {/* Audit Warning Note Banner */}
      <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50/70 p-3 text-xs space-y-1">
        <div className="flex items-center justify-between font-bold text-rose-900">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-700 shrink-0" />
            <span>Note: The following cleared entries are available for bank reconciliation reversal</span>
          </div>
          <span className="text-[11px] font-mono text-rose-700 uppercase tracking-wider">{bankLabel}</span>
        </div>
        <p className="text-slate-700 pl-6 leading-relaxed text-[11px]">
          Reversing reconciliation entries will remove their cleared bank statement date and restore them to <strong>Unreconciled</strong> pending status.
        </p>
      </div>

      {/* Main Table Card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-rose-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Reconciled Entries Log ({filteredData.length} entries)
            </h2>
          </div>

          <div className="flex items-center gap-3 flex-1 sm:flex-initial">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search voucher #, chq # or narration..."
                className="h-8 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 focus:border-rose-500 focus:outline-none"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="text-xs border-slate-300 font-semibold cursor-pointer"
            >
              {selectedCount === filteredData.length && filteredData.length > 0 ? "Deselect All" : "Select All"}
            </Button>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block max-h-[540px] overflow-y-auto overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5 text-center w-12">
                  <input
                    type="checkbox"
                    checked={selectedCount > 0 && selectedCount === filteredData.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4 cursor-pointer"
                  />
                </th>
                <th className="px-3 py-2.5 w-24">Vouch Dt</th>
                <th className="px-3.5 py-2.5 w-28">Vouch #</th>
                <th className="px-2.5 py-2.5 text-center w-20">Trn Type</th>
                <th className="px-3.5 py-2.5 w-32">Chq No</th>
                <th className="px-3 py-2.5 w-24">Chq Dt</th>
                <th className="px-4 py-2.5 min-w-[200px]">Narration</th>
                <th className="px-3 py-2.5 text-right w-28">Dr Amt (₹)</th>
                <th className="px-3 py-2.5 text-right w-28">Cr Amt (₹)</th>
                <th className="px-3 py-2.5 text-center w-28">Recon Date</th>
                <th className="px-3 py-2.5 text-center w-28">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {recon.loading && !recon.data ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500 font-medium">
                    <Loader2 className="inline h-4 w-4 mr-1 animate-spin text-rose-600" /> Loading reconciled entries…
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400 font-medium">
                    {account ? "No reconciled entries found matching the filter criteria." : "No bank account is configured in the chart of accounts."}
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => {
                  const isSelected = selectedIds.has(row.id);
                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        "even:bg-slate-50/50 hover:bg-slate-100/80 transition-colors",
                        isSelected && "bg-rose-50/80 hover:bg-rose-100/80",
                      )}
                    >
                      <td className="px-3 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(row.id)}
                          className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4 cursor-pointer"
                        />
                      </td>
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
                        {row.narration}
                        {row.partyName && <span className="block text-[10px] text-slate-400">{row.partyName}</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-slate-900">{row.debit > 0 ? formatINR(row.debit) : "-"}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-slate-900">{row.credit > 0 ? formatINR(row.credit) : "-"}</td>
                      <td
                        className="px-3 py-2.5 text-center font-bold text-emerald-800 bg-emerald-50/50 rounded"
                        title={row.reconciledBy ? `Reconciled by ${row.reconciledBy}` : undefined}
                      >
                        {formatDate(row.reconDate)}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleInitiateReversal(row.id)}
                          className="px-2 py-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          Reverse
                        </button>
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
              <Loader2 className="inline h-4 w-4 mr-1 animate-spin text-rose-600" /> Loading reconciled entries…
            </div>
          ) : filteredData.length === 0 ? (
            <div className="p-6 text-center text-slate-400 font-medium text-xs rounded-xl border border-slate-200 bg-white">
              No reconciled entries found.
            </div>
          ) : (
            filteredData.map((row) => {
              const isSelected = selectedIds.has(row.id);
              return (
                <div
                  key={row.id}
                  className={cn(
                    "rounded-xl border p-3.5 space-y-2 bg-white transition-colors",
                    isSelected ? "border-rose-300 bg-rose-50/40" : "border-slate-200",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 font-bold text-xs text-slate-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(row.id)}
                        className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                      />
                      <span>{row.voucherNo}</span>
                    </label>

                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider",
                        trnBadge(row.voucherCategory),
                      )}
                    >
                      {row.voucherCategory}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 font-medium">{row.narration}</p>

                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100">
                    <span className="text-slate-500 font-medium">Chq: {row.instrumentNo || "—"}</span>
                    <span className="font-bold text-slate-900">
                      {row.debit > 0 ? `Dr ${formatINR(row.debit)}` : `Cr ${formatINR(row.credit)}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[11px] text-emerald-800 font-semibold">Reconciled: {formatDate(row.reconDate)}</span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleInitiateReversal(row.id)}
                      className="h-6 px-2.5 text-[10px] font-bold bg-rose-700 hover:bg-rose-800 text-white rounded-md"
                    >
                      Reverse Entry
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Verification Modal Overlay */}
      {showVerificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700 font-bold">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Confirm Reconciliation Reversal</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Reversal Confirmation</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowVerificationModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 text-xs space-y-1.5">
                <p className="text-slate-800 leading-relaxed font-semibold">
                  You are about to reverse <strong className="text-rose-900 font-extrabold">{targetItems.length} reconciled transaction(s)</strong>{" "}
                  worth {formatINR(targetTotalAmount)}.
                </p>
                <p className="text-slate-700 text-[11px]">
                  These transactions will be moved back to the <strong>unreconciled state</strong>.
                </p>
                <p className="text-[11px] text-rose-800 font-medium pt-0.5">This action may affect bank reconciliation records.</p>
              </div>

              <FormField label="Reversal Reason" required>
                <input
                  type="text"
                  value={reverseReason}
                  onChange={(e) => setReverseReason(e.target.value)}
                  placeholder="e.g. Statement mismatch correction"
                  className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-800 focus:border-rose-500 focus:outline-none"
                />
              </FormField>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVerificationModal(false)}
                  className="rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  size="sm"
                  disabled={isReversing || !reverseReason.trim()}
                  onClick={() => void handleExecuteReversal()}
                  className="rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  {isReversing ? "Reversing..." : "Confirm Reversal"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModulePageShell>
  );
}
