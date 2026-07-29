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
  const [selectedBank, setSelectedBank] = useState("YES BANK A/c #9012");
  const [fromReconDate, setFromReconDate] = useState("2026-04-01");
  const [toReconDate, setToReconDate] = useState("2027-03-31");
  const [searchQuery, setSearchQuery] = useState("");

  // Reversal Options
  const [reverseReason, setReverseReason] = useState("Statement Mismatch Correction");
  const [keepAuditLog, setKeepAuditLog] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(["bank-recon-1", "bank-recon-4"]));

  // Reconciled Entries List (Initial state with reconciled items)
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

  // Filtered Reconciled Entries
  const filteredData = useMemo(() => {
    return reconciledEntries.filter((item) => {
      // Only show entries that are currently reconciled for reversal
      if (!item.reconciled) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.vouchNo.toLowerCase().includes(q) ||
          item.chqNo.toLowerCase().includes(q) ||
          item.narration.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [reconciledEntries, searchQuery]);

  // Statistics
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
    if (selectedIds.size === filteredData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map((e) => e.id)));
    }
  };

  // Selected Items to be reversed calculation
  const targetItems = useMemo(() => {
    return reconciledEntries.filter((item) => targetReversalIds.has(item.id));
  }, [reconciledEntries, targetReversalIds]);

  const targetTotalAmount = useMemo(() => {
    return targetItems.reduce((sum, item) => sum + Math.max(item.drAmt, item.crAmt), 0);
  }, [targetItems]);

  // Initiation of Reversal Process (Opens Verification Modal)
  const handleInitiateReversal = (specificId?: string) => {
    const idsToUse = specificId ? new Set([specificId]) : selectedIds;
    if (idsToUse.size === 0) {
      setToastMessage("Please select at least one reconciled entry to reverse.");
      return;
    }
    setTargetReversalIds(idsToUse);
    setAuthorizationConfirmed(false);
    setShowVerificationModal(true);
  };

  // Execution of Reversal
  const handleExecuteReversal = () => {
    if (!authorizationConfirmed) {
      setToastMessage("Please check the confirmation checkbox to proceed.");
      return;
    }

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
        `Successfully reversed ${targetReversalIds.size} bank reconciliation item(s) for ${selectedBank}.`
      );
      setSelectedIds(new Set());
      setTargetReversalIds(new Set());
      setShowVerificationModal(false);
      setIsReversing(false);
    }, 500);
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
          onClick={() => {
            setToastMessage(`Fetched reconciled records for period ${fromReconDate} to ${toReconDate}.`);
          }}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white text-xs h-7 rounded-lg font-bold"
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
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Transactions", href: "/accounts/transactions" },
        { label: "Bank Reconciliation Reversing" },
      ]}

      actionButtons={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="hidden sm:flex border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5 text-rose-600" />
            {showFilters ? "Hide Options" : "Show Options"}
          </Button>

          <Button
            type="button"
            disabled={selectedIds.size === 0 || isReversing}
            onClick={() => handleInitiateReversal()}
            className="bg-rose-700 hover:bg-rose-800 text-white shadow-xs font-bold"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            {isReversing ? "Reversing..." : `Reverse Selected (${selectedIds.size})`}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => alert("Reversal log printed.")}
            className="border-slate-300 text-slate-700"
          >
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            Print Log
          </Button>
        </div>
      }
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-slate-900 px-4 py-2.5 text-xs text-white shadow-md animate-in fade-in-50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-4 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Warning Alert Banner */}
      <div className="mb-4 rounded-2xl border border-rose-200/90 bg-rose-50/50 p-3.5 text-xs space-y-1">
        <div className="flex items-center gap-2 font-bold text-rose-900">
          <ShieldAlert className="h-4 w-4 text-rose-700 shrink-0" />
          <span>WINHMS Audit Warning: Reversing Bank Reconciliation</span>
        </div>
        <p className="text-slate-700 pl-6 leading-relaxed">
          Reversing reconciliation entries will remove their cleared bank statement date and mark them as <strong>Unreconciled</strong>.
          This will affect your Bank Statement Balance report calculation for the selected period.
        </p>
      </div>

      {/* Desktop Filter Panel */}
      {showFilters && (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs animate-in fade-in-50">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-rose-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Reversal Search Parameters & Options
              </h3>
            </div>
          </div>
          <FilterFormContent />
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
          value={`${selectedIds.size} Entries`}
          sublabel="Ready to be un-reconciled"
          accent="#e11d48"
          icon={RotateCcw}
        />
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
              className="text-xs border-slate-300 font-semibold"
            >
              {selectedIds.size === filteredData.length && filteredData.length > 0
                ? "Deselect All"
                : "Select All"}
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="px-3 py-2.5 text-center w-12">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.size > 0 &&
                      selectedIds.size === filteredData.length
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
                        "hover:bg-slate-50 transition-colors",
                        isSelected && "bg-rose-50/40"
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
                    Reversal Verification Security Check
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Reversal Audit Confirmation
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
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
                  <span>Audit Review & Impact Summary</span>
                </div>
                <p className="text-slate-700 leading-relaxed text-[11px]">
                  You are initiating reversal for{" "}
                  <strong className="text-slate-900">{targetItems.length} entry/entries</strong> totaling{" "}
                  <strong className="text-slate-900">{formatINR(targetTotalAmount)}</strong> under{" "}
                  <strong>{selectedBank}</strong>.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2 text-xs">
                <p className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                  Selected Transactions Summary:
                </p>
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                  {targetItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px]"
                    >
                      <span className="font-bold text-slate-800">{item.vouchNo} ({item.trnType})</span>
                      <span className="font-semibold text-rose-700">
                        {formatINR(Math.max(item.drAmt, item.crAmt))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirmation Checkbox */}
              <label className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3 border border-slate-200 cursor-pointer hover:border-rose-300 transition-colors">
                <input
                  type="checkbox"
                  checked={authorizationConfirmed}
                  onChange={(e) => setAuthorizationConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4 cursor-pointer"
                />
                <span className="text-[11px] text-slate-700 font-medium leading-relaxed">
                  I confirm that I have verified the bank statement and am authorized to reverse these posted reconciliation records.
                </span>
              </label>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVerificationModal(false)}
                  className="text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  size="sm"
                  disabled={!authorizationConfirmed || isReversing}
                  onClick={handleExecuteReversal}
                  className="bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isReversing ? "Reversing..." : "Confirm & Execute Reversal"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModulePageShell>
  );
}
