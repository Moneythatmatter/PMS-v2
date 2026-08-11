"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar,
  CheckCircle2,
  Lock,
  RotateCcw,
  ShieldAlert,
  SlidersHorizontal,
  Building2,
  FileText,
  Printer,
  Download,
  AlertTriangle,
  ChevronDown,
  X,
  Search,
  Filter,
  Check,
  ShieldCheck,
  Clock,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
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

export function FiscalPeriodClosingView() {
  // Desktop & Mobile filter state
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Period & Company Parameters
  const [selectedCompany, setSelectedCompany] = useState("Luxy Hotel Pvt Ltd");
  const [selectedFY, setSelectedFY] = useState("FY 2026-27 (01-Apr-2026 to 31-Mar-2027)");

  // WINHMS Security Options
  const [lockPeriod, setLockPeriod] = useState(true);
  const [preventBackdated, setPreventBackdated] = useState(true);
  const [autoTransferProfit, setAutoTransferProfit] = useState(true);
  const [requireSuperUser, setRequireSuperUser] = useState(false);
  const [generateAuditLog, setGenerateAuditLog] = useState(true);

  // Periods State
  const [periods, setPeriods] = useState<FiscalPeriodItem[]>(sampleFiscalPeriodsData);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [targetPeriod, setTargetPeriod] = useState<FiscalPeriodItem | null>(null);
  const [authorizationConfirmed, setAuthorizationConfirmed] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filtered Periods
  const filteredPeriods = useMemo(() => {
    return periods.filter((p) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          p.periodCode.toLowerCase().includes(q) ||
          p.periodName.toLowerCase().includes(q) ||
          p.status.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [periods, searchQuery]);

  // Statistics
  const closedCount = useMemo(() => periods.filter((p) => p.status === "Closed").length, [periods]);
  const openCount = useMemo(() => periods.filter((p) => p.status === "Open").length, [periods]);
  const pendingAuditCount = useMemo(() => periods.filter((p) => p.status === "Pending Audit").length, [periods]);

  // Current Business Date & Logged in User (System Context)
  const currentBusinessDateIso = "2026-08-05";
  const currentBusinessDateFormatted = "05/08/2026";
  const loggedInUser = "Rajesh Kumar (Chief Accountant)";

  // Find index of the first non-closed period in chronological order
  const firstUnclosedPeriodIndex = useMemo(() => {
    return periods.findIndex((p) => p.status !== "Closed");
  }, [periods]);

  // Initiation of Closing Process with Strict ERP Audit & Sequential Validation
  const handleInitiateClosing = (period: FiscalPeriodItem, periodIndex?: number) => {
    const idx = periodIndex ?? periods.findIndex((p) => p.id === period.id);

    // Rule 1: Sequential Period Closure Rule
    if (idx > firstUnclosedPeriodIndex && firstUnclosedPeriodIndex !== -1) {
      setToastMessage("Previous fiscal periods must be closed first.");
      return;
    }

    // Rule 2: Cannot close period before its Start Date
    if (period.startDate > currentBusinessDateIso) {
      setToastMessage(`Cannot close ${period.periodName} before its Start Date (${period.startDate}).`);
      return;
    }

    // Rule 3: Unposted Draft Vouchers Check
    if (period.unpostedVouchersCount > 0) {
      setToastMessage(`Cannot close ${period.periodName}: ${period.unpostedVouchersCount} unposted draft voucher(s) remain.`);
      return;
    }

    // Rule 4: Bank Reconciliation Check
    if (!period.bankReconciled) {
      setToastMessage(`Cannot close ${period.periodName}: Bank statement reconciliation entries are pending.`);
      return;
    }

    // Rule 5: Closing Stock Entry Check
    if (!period.closingStockPosted) {
      setToastMessage(`Cannot close ${period.periodName}: Period-end closing stock valuation has not been posted.`);
      return;
    }

    setTargetPeriod(period);
    setShowCloseModal(true);
  };

  // Execution of Period Closing (Automatically assigns current business date and user)
  const handleExecuteClosing = () => {
    if (!targetPeriod) return;

    setIsClosing(true);
    setTimeout(() => {
      setPeriods((prev) =>
        prev.map((item) => {
          if (item.id === targetPeriod.id) {
            return {
              ...item,
              status: "Closed",
              closedDate: currentBusinessDateFormatted,
              closedBy: loggedInUser,
            };
          }
          return item;
        })
      );
      setToastMessage(`✓ ${targetPeriod.periodName} closed successfully.`);
      setShowCloseModal(false);
      setTargetPeriod(null);
      setIsClosing(false);
    }, 500);
  };

  // Primary Action execution for next eligible period
  const handleExecutePrimaryClosing = () => {
    if (firstUnclosedPeriodIndex === -1) {
      setToastMessage("All fiscal periods for the selected financial year are already closed.");
      return;
    }
    const eligiblePeriod = periods[firstUnclosedPeriodIndex];
    handleInitiateClosing(eligiblePeriod, firstUnclosedPeriodIndex);
  };

  // Shared Filter Form Content
  const FilterFormContent = () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
      {/* Box 1: Company & FY Selection */}
      <div className="lg:col-span-6 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/70 space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 text-emerald-600" />
          Company & Financial Year
        </p>

        <div className="space-y-2">
          <div>
            <label className="text-[11px] font-semibold text-slate-600">Company Property:</label>
            <input
              type="text"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="mt-1 h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600">Financial Year (FY):</label>
            <select
              value={selectedFY}
              onChange={(e) => setSelectedFY(e.target.value)}
              className="mt-1 h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
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

      {/* Box 2: WINHMS Security Options */}
      <div className="lg:col-span-6 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/70 space-y-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-emerald-600" />
          WINHMS Period Locking Controls
        </p>

        <div className="grid grid-cols-2 gap-1.5 text-xs font-medium text-slate-700">
          <label className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={lockPeriod}
              onChange={(e) => setLockPeriod(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span className="text-[11px] truncate">Lock Financial Period</span>
          </label>

          <label className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={preventBackdated}
              onChange={(e) => setPreventBackdated(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span className="text-[11px] truncate">Prevent Backdated Entries</span>
          </label>

          <label className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={autoTransferProfit}
              onChange={(e) => setAutoTransferProfit(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span className="text-[11px] truncate">Auto Transfer Net Profit</span>
          </label>

          <label className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={generateAuditLog}
              onChange={(e) => setGenerateAuditLog(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span className="text-[11px] truncate">Generate Audit Trail Log</span>
          </label>

          <label className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 border border-slate-200 cursor-pointer hover:border-emerald-300 col-span-2">
            <input
              type="checkbox"
              checked={requireSuperUser}
              onChange={(e) => setRequireSuperUser(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span className="text-[11px] truncate">Require Super-User Admin Override for Reopening</span>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <ModulePageShell
      eyebrow="Accounts & Period Audit"
      title="Fiscal Period Closing"
      description="Period-end financial closing, sub-ledger audit verification, and financial period freezing for General Ledger integrity."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Transactions", href: "/accounts/transactions" },
        { label: "Fiscal Period Closing" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleExecutePrimaryClosing}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
          >
            <Lock className="mr-1.5 h-3.5 w-3.5" />
            Execute Period Closing
          </Button>

          <a href="/accounts/transactions/fiscal-period-closing-reversing">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-semibold bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100 shadow-xs cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1 text-rose-700" />
              Reversing View
            </Button>
          </a>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl text-xs font-medium bg-white shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Print Status
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => alert("Fiscal Period Audit log exported to CSV.")}
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
            <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600" />
            <span>{showFilters ? "Hide Period Options" : "Fiscal Period Parameters & Options"}</span>
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
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
            <Calendar className="h-3.5 w-3.5 text-emerald-700" />
            Active FY: FY 2026-27
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            <Lock className="h-3.5 w-3.5 text-slate-600" />
            {closedCount} / {periods.length} Closed
          </span>
        </div>
      </div>

      {/* Desktop Filter Panel */}
      {showFilters && (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs animate-in fade-in-50">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Fiscal Period Closing Parameters & Options
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
        title="Fiscal Period Options"
      >
        <div className="p-4">
          <FilterFormContent />
          <div className="mt-4 border-t border-slate-100 pt-3">
            <Button
              type="button"
              className="w-full bg-emerald-700 text-white"
              onClick={() => setMobileFilterOpen(false)}
            >
              Apply Options
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Pre-Closing Audit Checklist Box */}
      <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-xs space-y-3 shadow-2xs">
        <div className="flex items-center justify-between font-bold text-emerald-900 border-b border-emerald-200/80 pb-2">
          <span className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
            <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" />
            WINHMS Pre-Closing Audit Rules Verification Checklist
          </span>
          <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-semibold">
            {selectedCompany}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-slate-600 text-[11px]">Unposted Vouchers</span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-800 text-[11px]">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Passed (0 Drafts)
            </span>
          </div>

          <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-slate-600 text-[11px]">Bank Reconciliation</span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-800 text-[11px]">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Passed (Cleared)
            </span>
          </div>

          <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-slate-600 text-[11px]">Closing Stock Entry</span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-800 text-[11px]">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Passed (Posted)
            </span>
          </div>

          <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-slate-600 text-[11px]">Trial Balance Balance</span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-800 text-[11px]">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Balanced (Diff ₹0)
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <StatMiniCard
          label="Total Fiscal Periods"
          value={`${periods.length} Periods`}
          sublabel="Annual period schedule"
          accent="#0284c7"
          icon={Calendar}
        />
        <StatMiniCard
          label="Closed & Locked Periods"
          value={`${closedCount} Closed`}
          sublabel="Locked against new vouchers"
          accent="#16a34a"
          icon={Lock}
        />
        <StatMiniCard
          label="Pending Audit Period"
          value={`${pendingAuditCount} Ready`}
          sublabel="Awaiting period lock execution"
          accent="#f59e0b"
          icon={Clock}
        />
        <StatMiniCard
          label="Open Active Periods"
          value={`${openCount} Open`}
          sublabel="Accepting voucher postings"
          accent="#8b5cf6"
          icon={Layers}
        />
      </div>

      {/* Main Periods Table Card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Fiscal Period Status Log ({filteredPeriods.length} periods)
            </h2>
          </div>

          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search period code or name..."
              className="h-8 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block max-h-[540px] overflow-y-auto overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5 w-20">Code</th>
                <th className="px-3.5 py-2.5 min-w-[180px]">Period Name</th>
                <th className="px-3 py-2.5 w-24">Start Date</th>
                <th className="px-3 py-2.5 w-24">End Date</th>
                <th className="px-3 py-2.5 text-center w-28">Unposted Drafts</th>
                <th className="px-3 py-2.5 text-center w-28">Bank Recon</th>
                <th className="px-3 py-2.5 text-center w-28">Stock Entry</th>
                <th className="px-3.5 py-2.5 w-32">Closed Date</th>
                <th className="px-3.5 py-2.5 min-w-[160px]">Closed By User</th>
                <th className="px-3 py-2.5 text-center w-24">Status</th>
                <th className="px-3 py-2.5 text-center w-28">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredPeriods.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400 font-medium">
                    No fiscal periods found.
                  </td>
                </tr>
              ) : (
                filteredPeriods.map((row) => {
                  const periodOriginalIndex = periods.findIndex((p) => p.id === row.id);
                  const isClosed = row.status === "Closed";
                  const isPending = row.status === "Pending Audit";
                  const isEligibleForClosing = periodOriginalIndex === firstUnclosedPeriodIndex;

                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        "even:bg-slate-50/50 hover:bg-slate-100/80 transition-colors",
                        isClosed && "bg-slate-50/50"
                      )}
                    >
                      <td className="px-3 py-2.5 font-bold text-slate-900">{row.periodCode}</td>
                      <td className="px-3.5 py-2.5 font-bold text-slate-800">{row.periodName}</td>
                      <td className="px-3 py-2.5 text-slate-600 font-medium">{row.startDate}</td>
                      <td className="px-3 py-2.5 text-slate-600 font-medium">{row.endDate}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className={cn(
                            "inline-block px-2 py-0.5 rounded text-[10px] font-bold",
                            row.unpostedVouchersCount === 0
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          )}
                        >
                          {row.unpostedVouchersCount} Drafts
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {row.bankReconciled ? (
                          <span className="text-emerald-700 font-bold text-[10px] flex items-center justify-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Cleared
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium text-[10px]">Pending</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {row.closingStockPosted ? (
                          <span className="text-emerald-700 font-bold text-[10px] flex items-center justify-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Posted
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium text-[10px]">Pending</span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-600 font-medium">
                        {row.closedDate || "-"}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-700 text-[11px] font-medium truncate">
                        {row.closedBy || "-"}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className={cn(
                            "inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border",
                            isClosed
                              ? "bg-slate-100 text-slate-700 border-slate-300"
                              : isPending
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : "bg-emerald-100 text-emerald-800 border-emerald-300"
                          )}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {isClosed ? (
                          <span className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1">
                            <Lock className="h-3 w-3" /> Locked
                          </span>
                        ) : isEligibleForClosing ? (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleInitiateClosing(row, periodOriginalIndex)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold shadow-xs cursor-pointer"
                          >
                            Lock &amp; Close
                          </Button>
                        ) : (
                          <span title="Previous fiscal periods must be closed first.">
                            <Button
                              type="button"
                              size="sm"
                              disabled
                              className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-400 text-[10px] font-medium border border-slate-200 cursor-not-allowed opacity-60"
                            >
                              Lock &amp; Close
                            </Button>
                          </span>
                        )}
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
          {filteredPeriods.length === 0 ? (
            <div className="p-6 text-center text-slate-400 font-medium text-xs rounded-xl border border-slate-200 bg-white">
              No fiscal periods found.
            </div>
          ) : (
            filteredPeriods.map((row) => (
              <div key={row.id} className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{row.periodCode} - {row.periodName}</span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-bold uppercase border",
                      row.status === "Closed"
                        ? "bg-slate-100 text-slate-700 border-slate-300"
                        : "bg-emerald-100 text-emerald-800 border-emerald-300"
                    )}
                  >
                    {row.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">{row.startDate} to {row.endDate}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Confirmation Closing Modal */}
      {targetPeriod && (
        <Modal
          isOpen={showCloseModal}
          onClose={() => setShowCloseModal(false)}
          title="Confirm Fiscal Period Closing"
          description="WINHMS Financial Period Audit Confirmation"
          maxWidth="md"
        >
          <div className="space-y-4 font-sans">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs space-y-1.5">
              <p className="text-slate-800 leading-relaxed font-semibold">
                You are about to close the selected fiscal period.
              </p>
              <p className="text-[11px] text-emerald-800 font-medium">
                This action will lock accounting transactions for the selected period and post required financial adjustments.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-600">Selected Period:</span>
                <span className="font-bold text-slate-800">{targetPeriod.periodName} ({targetPeriod.periodCode})</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-600">Period Duration:</span>
                <span className="font-bold text-slate-800">{targetPeriod.startDate} to {targetPeriod.endDate}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-600">Period Closing Date:</span>
                <span className="font-bold text-emerald-800">{currentBusinessDateFormatted} (System Business Date)</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-600">Closed By User:</span>
                <span className="font-bold text-slate-800">{loggedInUser}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCloseModal(false)}
                className="rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </Button>

              <Button
                type="button"
                size="sm"
                disabled={isClosing}
                onClick={handleExecuteClosing}
                className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                {isClosing ? "Closing..." : "Confirm"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </ModulePageShell>
  );
}
