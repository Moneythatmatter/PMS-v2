"use client";

import React, { useState, useMemo } from "react";
import {
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Download,
  Filter,
  Lock,
  Printer,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Unlock,
  X,
  AlertTriangle,
  FileText,
  Info,
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
  sampleFiscalYears,
  sampleFiscalPeriodsData,
  FiscalPeriodItem,
} from "@/app/data/accounts/fiscalPeriodClosingData";
import { cn } from "@/lib/utils";

export function FiscalPeriodClosingReversingView() {
  // Desktop & Mobile filter state
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Parameters State
  const [selectedCompany, setSelectedCompany] = useState("Luxy Hotel Pvt Ltd");
  const [selectedFY, setSelectedFY] = useState("FY 2026-27 (01-Apr-2026 to 31-Mar-2027)");
  const [reopenReason, setReopenReason] = useState("Audit Correction & Tax Return Adjustment");

  // Reversal Options
  const [keepAuditLog, setKeepAuditLog] = useState(true);
  const [notifyController, setNotifyController] = useState(true);
  const [requirePasscode, setRequirePasscode] = useState(true);

  // Multi-selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Periods State (Initial state containing closed periods to reopen)
  const [periods, setPeriods] = useState<FiscalPeriodItem[]>(sampleFiscalPeriodsData);
  const [searchQuery, setSearchQuery] = useState("");

  // Reversal Modal State
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [targetIds, setTargetIds] = useState<Set<string>>(new Set());
  const [isReopening, setIsReopening] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filtered Closed Periods (Only show closed/locked periods for reversal)
  const closedPeriods = useMemo(() => {
    return periods.filter((p) => {
      if (p.status !== "Closed") return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          p.periodCode.toLowerCase().includes(q) ||
          p.periodName.toLowerCase().includes(q) ||
          (p.closedBy && p.closedBy.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [periods, searchQuery]);

  // Statistics
  const totalClosedCount = closedPeriods.length;

  // Toggle selection
  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === closedPeriods.length && closedPeriods.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(closedPeriods.map((p) => p.id)));
    }
  };

  // Initiation of Reopening Process
  const handleInitiateReopen = (specificId?: string) => {
    const rawIds = specificId ? new Set([specificId]) : selectedIds;
    const validIds = new Set(
      Array.from(rawIds).filter((id) => closedPeriods.some((p) => p.id === id))
    );

    if (validIds.size === 0) {
      setToastMessage("Please select at least one closed fiscal period.");
      return;
    }

    setTargetIds(validIds);
    setShowReopenModal(true);
  };

  // Execution of Reopening
  const handleExecuteReopen = () => {
    const countToReport = targetIds.size;
    setIsReopening(true);
    setTimeout(() => {
      setPeriods((prev) =>
        prev.map((item) => {
          if (targetIds.has(item.id)) {
            return {
              ...item,
              status: "Open",
              closedDate: undefined,
              closedBy: undefined,
            };
          }
          return item;
        })
      );
      setToastMessage(`✓ ${countToReport} fiscal period(s) reversed successfully.`);
      setSelectedIds(new Set());
      setTargetIds(new Set());
      setShowReopenModal(false);
      setIsReopening(false);
    }, 500);
  };

  // Shared Filter Form Content
  const FilterFormContent = () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
      {/* Box 1: Company & FY Selection */}
      <div className="lg:col-span-6 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/70 space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 text-rose-600" />
          Company & Financial Year
        </p>

        <div className="space-y-2">
          <div>
            <label className="text-[11px] font-semibold text-slate-600">Company Property:</label>
            <input
              type="text"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="mt-1 h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-800 focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600">Financial Year (FY):</label>
            <select
              value={selectedFY}
              onChange={(e) => setSelectedFY(e.target.value)}
              className="mt-1 h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-800 focus:border-rose-500 focus:outline-none"
            >
              {sampleFiscalYears.map((fy) => (
                <option key={fy} value={fy}>
                  {fy}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Box 2: Reopening Audit Settings */}
      <div className="lg:col-span-6 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/70 space-y-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5 text-rose-600" />
          Reopening Audit & Reason Options
        </p>

        <div className="space-y-2 text-xs">
          <div>
            <label className="text-[11px] font-semibold text-slate-600">Reopening Audit Remark / Reason:</label>
            <input
              type="text"
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="Reason for reopening period..."
              className="mt-1 h-7 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-800 focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-1.5 font-medium text-slate-700">
            <label className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 border border-slate-200 cursor-pointer hover:border-rose-300">
              <input
                type="checkbox"
                checked={keepAuditLog}
                onChange={(e) => setKeepAuditLog(e.target.checked)}
                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-3.5 w-3.5"
              />
              <span className="text-[11px] truncate">Log Audit Trail</span>
            </label>

            <label className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 border border-slate-200 cursor-pointer hover:border-rose-300">
              <input
                type="checkbox"
                checked={notifyController}
                onChange={(e) => setNotifyController(e.target.checked)}
                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-3.5 w-3.5"
              />
              <span className="text-[11px] truncate">Notify Controller</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ModulePageShell
      eyebrow="Accounts & Period Audit"
      title="Fiscal Period Closing Reversing"
      description="Reopen and un-lock previously closed financial periods to allow retroactive ledger entries and audit corrections."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Transactions", href: "/accounts/transactions" },
        { label: "Fiscal Period Closing Reversing" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            disabled={selectedIds.size === 0 || isReopening}
            onClick={() => handleInitiateReopen()}
            className={cn(
              "rounded-xl text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white shadow-xs transition-all cursor-pointer",
              (selectedIds.size === 0 || isReopening) && "opacity-50 cursor-not-allowed"
            )}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            {isReopening ? "Reversing..." : `Reverse Period (${selectedIds.size})`}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl text-xs font-medium bg-white shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Print Log
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => alert("Reopened Fiscal Period log exported to CSV.")}
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
            className="rounded-xl border-slate-200 text-xs font-semibold gap-1.5 hidden md:inline-flex bg-white text-slate-700 cursor-pointer"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-rose-600" />
            <span>{showFilters ? "Hide Reopening Options" : "Reopening Parameters & Options"}</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                showFilters && "rotate-180"
              )}
            />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMobileFilterOpen(true)}
            className="rounded-xl border-slate-200 text-xs font-semibold gap-1.5 md:hidden bg-white text-slate-700 cursor-pointer"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filter</span>
          </Button>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800 border border-rose-200">
            <RotateCcw className="h-3.5 w-3.5 text-rose-700" />
            Closed Periods: {totalClosedCount}
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            <Building2 className="h-3.5 w-3.5 text-slate-600" />
            {selectedCompany}
          </span>
        </div>
      </div>

      {/* Desktop Filter Panel */}
      {showFilters && (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs animate-in fade-in-50">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-rose-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Reopening Parameters & Options
              </h3>
            </div>
            <button
              onClick={() => setShowFilters(false)}
              className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
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
        title="Reopening Options"
      >
        <div className="p-4">
          <FilterFormContent />
          <div className="mt-4 border-t border-slate-100 pt-3">
            <Button
              type="button"
              className="w-full bg-rose-700 text-white"
              onClick={() => setMobileFilterOpen(false)}
            >
              Apply Options
            </Button>
          </div>
        </div>
      </Drawer>

      {/* KPI Stat Cards Grid */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatMiniCard
          label="Closed & Locked Periods"
          value={`${totalClosedCount} Periods`}
          sublabel="Available for reopening"
          accent="#0284c7"
          icon={Lock}
        />
        <StatMiniCard
          label="Financial Year Scope"
          value="FY 2026-27"
          sublabel={selectedCompany}
          accent="#16a34a"
          icon={Calendar}
        />
        <StatMiniCard
          label="Reopening Security Level"
          value="Authorized"
          sublabel="Super-user audit trail enabled"
          accent="#e11d48"
          icon={ShieldCheck}
        />
      </div>

      {/* Main Table Card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-rose-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Closed Fiscal Periods Log ({closedPeriods.length} locked periods)
            </h2>
          </div>

          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search period code or user..."
              className="h-8 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 focus:border-rose-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block max-h-[540px] overflow-y-auto overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === closedPeriods.length && closedPeriods.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-3.5 w-3.5 cursor-pointer"
                  />
                </th>
                <th className="px-3 py-2.5 w-20">Code</th>
                <th className="px-3.5 py-2.5 min-w-[200px]">Period Name</th>
                <th className="px-3 py-2.5 w-24">Start Date</th>
                <th className="px-3 py-2.5 w-24">End Date</th>
                <th className="px-3.5 py-2.5 w-32">Closed Date</th>
                <th className="px-4 py-2.5 min-w-[200px]">Closed By User</th>
                <th className="px-3 py-2.5 text-center w-24">Status</th>
                <th className="px-3 py-2.5 text-center w-28">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {closedPeriods.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                    No fiscal periods found.
                  </td>
                </tr>
              ) : (
                closedPeriods.map((row) => {
                  const isSelected = selectedIds.has(row.id);
                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        "even:bg-slate-50/50 hover:bg-slate-100/80 transition-colors",
                        isSelected && "bg-rose-50/80 hover:bg-rose-100/80 border-l-2 border-l-rose-600"
                      )}
                    >
                      <td className="px-3 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(row.id)}
                          className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-3.5 w-3.5 cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-2.5 font-bold text-slate-900">{row.periodCode}</td>
                      <td className="px-3.5 py-2.5 font-bold text-slate-800">{row.periodName}</td>
                      <td className="px-3 py-2.5 text-slate-600 font-medium">{row.startDate}</td>
                      <td className="px-3 py-2.5 text-slate-600 font-medium">{row.endDate}</td>
                      <td className="px-3.5 py-2.5 text-slate-600 font-medium">{row.closedDate || "02/05/2026"}</td>
                      <td className="px-4 py-2.5 text-slate-700 font-medium">{row.closedBy || "Rajesh Kumar (Chief Accountant)"}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-300">
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleInitiateReopen(row.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          Reopen Period
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked View (md:hidden) */}
        <div className="md:hidden space-y-2.5">
          {closedPeriods.length === 0 ? (
            <div className="p-6 text-center text-slate-400 font-medium text-xs rounded-xl border border-slate-200 bg-white">
              No fiscal periods found.
            </div>
          ) : (
            closedPeriods.map((row) => {
              const isSelected = selectedIds.has(row.id);
              return (
                <div
                  key={row.id}
                  onClick={() => toggleSelectRow(row.id)}
                  className={cn(
                    "rounded-xl border border-slate-200 bg-white p-3.5 space-y-2 cursor-pointer transition-colors",
                    isSelected && "border-rose-300 bg-rose-50/70 ring-1 ring-rose-400"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(row.id)}
                        className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4 cursor-pointer"
                      />
                      <span className="font-bold text-xs text-slate-900">{row.periodCode} - {row.periodName}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-300">
                      {row.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium pl-6">{row.startDate} to {row.endDate}</p>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Confirmation Reversal Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700 font-bold">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Confirm Fiscal Period Reversal
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Fiscal Period Reopening
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReopenModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 text-xs space-y-1.5">
                <p className="text-slate-800 leading-relaxed font-semibold">
                  You are about to reopen <strong className="text-rose-900 font-extrabold">{targetIds.size} fiscal period(s)</strong>.
                </p>
                <p className="text-[11px] text-rose-800 font-medium">
                  This action will unlock the selected periods and may affect financial postings.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowReopenModal(false)}
                className="rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </Button>

              <Button
                type="button"
                size="sm"
                disabled={isReopening}
                onClick={handleExecuteReopen}
                className="rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                {isReopening ? "Reversing..." : "Confirm Reversal"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ModulePageShell>
  );
}
