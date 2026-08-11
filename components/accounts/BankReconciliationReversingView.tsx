"use client";

import React, { useState, useMemo } from "react";
import {
  Building2,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Search,
  Calendar,
  SlidersHorizontal,
  FileText,
  Save,
  Printer,
  Download,
  CheckSquare,
  Square,
  Info,
  ShieldAlert,
  Lock,
  X,
  ArrowRight,
  ChevronDown,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  StatMiniCard,
  Drawer,
  FODatePicker,
  formatINR,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import {
  sampleBankAccounts,
  sampleBankReconciliationData,
  BankReconciliationEntry,
} from "@/app/data/accounts/bankReconciliationData";
import { cn } from "@/lib/utils";

export function BankReconciliationReversingView() {
  // Mobile Filter Drawer State
  const [showFilters, setShowFilters] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Bank & Filter Controls
  const [selectedBank, setSelectedBank] = useState("<ALL Banks>");
  const [appliedBank, setAppliedBank] = useState("<ALL Banks>");
  const [fromReconDate, setFromReconDate] = useState("2026-04-01");
  const [toReconDate, setToReconDate] = useState("2027-03-31");
  const [appliedFromReconDate, setAppliedFromReconDate] = useState("2026-04-01");
  const [appliedToReconDate, setAppliedToReconDate] = useState("2027-03-31");
  const [searchQuery, setSearchQuery] = useState("");

  // Reversal Options
  const [reverseReason, setReverseReason] = useState("Statement Mismatch Correction");
  const [keepAuditLog, setKeepAuditLog] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Reconciled Entries List (Initial state with reconciled items across bank accounts)
  const [reconciledEntries, setReconciledEntries] = useState<BankReconciliationEntry[]>(() =>
    sampleBankReconciliationData.map((item, idx) => ({
      ...item,
      // Make most sample items reconciled so there are items to reverse
      reconciled: idx % 2 === 0 ? true : item.reconciled,
      reconDate: item.reconDate || "28/04/2026",
    }))
  );

  // Status & Notification state
  const [isReversing, setIsReversing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Single-Step Verification Modal State
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [authorizationConfirmed, setAuthorizationConfirmed] = useState(false);
  const [targetReversalIds, setTargetReversalIds] = useState<Set<string>>(new Set());

  // Helper to parse DD/MM/YYYY into YYYY-MM-DD for date comparisons
  const parseFormattedDate = (dateStr: string): string => {
    if (!dateStr) return "";
    if (dateStr.includes("-")) return dateStr;
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
    return dateStr;
  };

  // Filtered Reconciled Entries by Applied Bank Account & Applied Date Range
  const filteredData = useMemo(() => {
    return reconciledEntries.filter((item) => {
      // 1. Only show entries that are currently reconciled for reversal
      if (!item.reconciled) return false;

      // 2. Bank Account Filter (<ALL Banks> or specific selected bank)
      if (
        appliedBank &&
        appliedBank !== "<ALL Banks>" &&
        item.bankName !== appliedBank
      ) {
        return false;
      }

      // 3. Date Period Filter (Applied From & To Recon Dates)
      const itemDate = parseFormattedDate(item.reconDate || item.vouchDt);
      if (appliedFromReconDate && itemDate < appliedFromReconDate) return false;
      if (appliedToReconDate && itemDate > appliedToReconDate) return false;

      // 4. Search Query Filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.vouchNo.toLowerCase().includes(q) ||
          item.chqNo.toLowerCase().includes(q) ||
          item.narration.toLowerCase().includes(q) ||
          item.bankName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [
    reconciledEntries,
    appliedBank,
    appliedFromReconDate,
    appliedToReconDate,
    searchQuery,
  ]);

  // Synchronized Selection Calculations
  const selectedEntriesInLog = useMemo(() => {
    return filteredData.filter((item) => selectedIds.has(item.id));
  }, [filteredData, selectedIds]);

  const selectedCount = selectedEntriesInLog.length;
  const selectedTotalValue = useMemo(() => {
    return selectedEntriesInLog.reduce(
      (sum, item) => sum + Math.max(item.drAmt, item.crAmt),
      0
    );
  }, [selectedEntriesInLog]);

  // Overall Statistics
  const totalReconciledCount = filteredData.length;
  const totalReconciledDr = useMemo(
    () => filteredData.reduce((sum, item) => sum + item.drAmt, 0),
    [filteredData]
  );
  const totalReconciledCr = useMemo(
    () => filteredData.reduce((sum, item) => sum + item.crAmt, 0),
    [filteredData]
  );
  const totalReconciledValue = Math.abs(totalReconciledDr - totalReconciledCr);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedCount === filteredData.length && filteredData.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map((e) => e.id)));
    }
  };

  // Selected Items to be reversed calculation for Modal
  const targetItems = useMemo(() => {
    return reconciledEntries.filter((item) => targetReversalIds.has(item.id));
  }, [reconciledEntries, targetReversalIds]);

  const targetTotalAmount = useMemo(() => {
    return targetItems.reduce((sum, item) => sum + Math.max(item.drAmt, item.crAmt), 0);
  }, [targetItems]);

  // Initiation of Reversal Process (Opens Verification Modal)
  const handleInitiateReversal = (specificId?: string) => {
    const rawIdsToUse = specificId ? new Set([specificId]) : selectedIds;
    
    // Ensure only valid IDs present in current filtered log are processed
    const validIds = new Set(
      Array.from(rawIdsToUse).filter((id) => filteredData.some((f) => f.id === id))
    );

    if (validIds.size === 0) {
      setToastMessage(
        "Please select at least one reconciled transaction to reverse."
      );
      return;
    }

    setTargetReversalIds(validIds);
    setAuthorizationConfirmed(false);
    setShowVerificationModal(true);
  };

  // Execution of Reversal
  const handleExecuteReversal = () => {
    const countToReport = targetReversalIds.size;
    setIsReversing(true);
    setTimeout(() => {
      setReconciledEntries((prev) =>
        prev.map((item) => {
          if (targetReversalIds.has(item.id)) {
            return {
              ...item,
              reconciled: false,
              reconDate: "",
            };
          }
          return item;
        })
      );
      setToastMessage(
        `✓ ${countToReport} transaction(s) reversed successfully.`
      );
      setSelectedIds(new Set());
      setTargetReversalIds(new Set());
      setShowVerificationModal(false);
      setIsReversing(false);
    }, 500);
  };

  // Fetch Reconciled Logs Handler (Third Fix: Filters accurately by Bank & Period)
  const handleFetchReconciledLogs = () => {
    setAppliedBank(selectedBank);
    setAppliedFromReconDate(fromReconDate);
    setAppliedToReconDate(toReconDate);
    setSelectedIds(new Set());
    setToastMessage(
      `✓ Fetched reconciled logs for ${selectedBank} (Period: ${fromReconDate} to ${toReconDate}).`
    );
  };

  // Filter Form Controls Component
  const FilterFormContent = () => (
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
            value={selectedBank}
            onChange={(e) => setSelectedBank(e.target.value)}
            className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 font-bold focus:border-rose-500 focus:outline-none"
          >
            {sampleBankAccounts.map((b) => (
              <option key={b} value={b}>
                {b}
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
          Reversal Settings & Audit Options
        </p>

        <div className="space-y-2 text-xs">
          <div>
            <label className="text-[11px] font-semibold text-slate-600">Reversal Reason / Remark:</label>
            <input
              type="text"
              value={reverseReason}
              onChange={(e) => setReverseReason(e.target.value)}
              placeholder="Reason for un-reconciling..."
              className="mt-1 h-7 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-800 focus:border-rose-500 focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 cursor-pointer hover:border-rose-300">
            <input
              type="checkbox"
              checked={keepAuditLog}
              onChange={(e) => setKeepAuditLog(e.target.checked)}
              className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-3.5 w-3.5"
            />
            <span className="text-[11px] text-slate-700 font-medium">Maintain Detailed Audit Trail Log</span>
          </label>
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
          className="w-full bg-slate-800 hover:bg-slate-900 text-white text-xs h-7 rounded-lg font-bold cursor-pointer"
        >
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
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
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
              (selectedCount === 0 || isReversing) && "opacity-50 cursor-not-allowed"
            )}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            {isReversing ? "Reversing..." : `Reverse Reconciliation (${selectedCount})`}
          </Button>

          <a href="/accounts/transactions/bank-reconciliation">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-semibold bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100 shadow-xs cursor-pointer"
            >
              <Building2 className="h-3.5 w-3.5 mr-1.5 text-emerald-700" />
              Reconciliation View
            </Button>
          </a>

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
            onClick={() => alert("Reversal log exported to CSV.")}
            className="rounded-xl text-xs font-medium bg-white shadow-xs cursor-pointer text-slate-700"
          >
            <Download className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
            Export CSV
          </Button>
        </div>
      }
    >
      {/* Top Controls Toolbar Bar (Identical to Bank Reconciliation Page) */}
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
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                showFilters && "rotate-180"
              )}
            />
          </Button>

          {/* Mobile Filter Drawer Button */}
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

        {/* Bank & Period Badges */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800 border border-rose-200">
            <Building2 className="h-3.5 w-3.5 text-rose-700" />
            Selected Bank: <span className="underline">{appliedBank}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            <Calendar className="h-3.5 w-3.5 text-slate-600" />
            FY 2026 - 27
          </span>
        </div>
      </div>

      {/* Desktop Filter Panel (Collapsible) */}
      {showFilters && (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs animate-in fade-in-50">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-rose-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Reversal Search Parameters &amp; Options
              </h3>
            </div>
            <button
              onClick={() => setShowFilters(false)}
              className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer font-medium"
            >
              ✕ Hide Options
            </button>
          </div>
          <FilterFormContent />
        </div>
      )}

      {/* Mobile Drawer */}
      <Drawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        title="Reversal Parameters & Options"
      >
        <div className="p-4">
          <FilterFormContent />
          <div className="mt-4 border-t border-slate-100 pt-3">
            <Button
              type="button"
              className="w-full bg-rose-700 text-white font-bold"
              onClick={() => setMobileFilterOpen(false)}
            >
              Apply Filter
            </Button>
          </div>
        </div>
      </Drawer>

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

      {/* WINHMS Audit Warning Note Banner */}
      <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50/70 p-3 text-xs space-y-1">
        <div className="flex items-center justify-between font-bold text-rose-900">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-700 shrink-0" />
            <span>Note: The following cleared entries are available for bank reconciliation reversal</span>
          </div>
          <span className="text-[11px] font-mono text-rose-700 uppercase tracking-wider">{appliedBank}</span>
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
              {selectedCount === filteredData.length && filteredData.length > 0
                ? "Deselect All"
                : "Select All"}
            </Button>
          </div>
        </div>

        {/* Desktop Table (hidden md:block) */}
        <div className="hidden md:block max-h-[540px] overflow-y-auto overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5 text-center w-12">
                  <input
                    type="checkbox"
                    checked={
                      selectedCount > 0 &&
                      selectedCount === filteredData.length
                    }
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
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400 font-medium">
                    No reconciled entries found matching the filter criteria.
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
                        isSelected && "bg-rose-50/80 hover:bg-rose-100/80"
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
                      <td className="px-3 py-2.5 text-slate-600 font-medium">{row.vouchDt}</td>
                      <td className="px-3.5 py-2.5 font-bold text-slate-900">{row.vouchNo}</td>
                      <td className="px-2.5 py-2.5 text-center">
                        <span
                          className={cn(
                            "inline-block px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider",
                            row.trnType === "Receipt"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : row.trnType === "Payment"
                              ? "bg-rose-100 text-rose-800 border-rose-300"
                              : "bg-blue-100 text-blue-800 border-blue-300"
                          )}
                        >
                          {row.trnType}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 font-bold text-slate-800">{row.chqNo}</td>
                      <td className="px-3 py-2.5 text-slate-600 font-medium">{row.chqDt}</td>
                      <td className="px-4 py-2.5 text-slate-800 font-medium">{row.narration}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-slate-900">
                        {row.drAmt > 0 ? formatINR(row.drAmt) : "-"}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-slate-900">
                        {row.crAmt > 0 ? formatINR(row.crAmt) : "-"}
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-emerald-800 bg-emerald-50/50 rounded">
                        {row.reconDate || "28/04/2026"}
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

        {/* Mobile Stacked Card View (md:hidden) */}
        <div className="md:hidden space-y-2.5">
          {filteredData.length === 0 ? (
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
                    isSelected ? "border-rose-300 bg-rose-50/40" : "border-slate-200"
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
                      <span>{row.vouchNo}</span>
                    </label>

                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider",
                        row.trnType === "Receipt"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : row.trnType === "Payment"
                          ? "bg-rose-100 text-rose-800 border-rose-300"
                          : "bg-blue-100 text-blue-800 border-blue-300"
                      )}
                    >
                      {row.trnType}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 font-medium">{row.narration}</p>

                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100">
                    <span className="text-slate-500 font-medium">Chq: {row.chqNo}</span>
                    <span className="font-bold text-slate-900">
                      {row.drAmt > 0 ? `Dr ${formatINR(row.drAmt)}` : `Cr ${formatINR(row.crAmt)}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[11px] text-emerald-800 font-semibold">Reconciled: {row.reconDate || "28/04/2026"}</span>
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

      {/* Single-Step Verification Modal Overlay */}
      {showVerificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700 font-bold">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Confirm Reconciliation Reversal
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Reversal Confirmation
                  </p>
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

            {/* Modal Body */}
            <div className="space-y-4">
              <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 text-xs space-y-1.5">
                <p className="text-slate-800 leading-relaxed font-semibold">
                  You are about to reverse <strong className="text-rose-900 font-extrabold">{targetItems.length} reconciled transaction(s)</strong>.
                </p>
                <p className="text-slate-700 text-[11px]">
                  These transactions will be moved back to the <strong>unreconciled state</strong>.
                </p>
                <p className="text-[11px] text-rose-800 font-medium pt-0.5">
                  This action may affect bank reconciliation records.
                </p>
              </div>

              {/* Modal Footer Buttons */}
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
                  disabled={isReversing}
                  onClick={handleExecuteReversal}
                  className="rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-xs cursor-pointer"
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
