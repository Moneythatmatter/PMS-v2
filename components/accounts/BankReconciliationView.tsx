"use client";

import React, { useState, useMemo } from "react";
import {
  Building2,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Printer,
  Download,
  Search,
  Calendar,
  Filter,
  Loader2,
  FileText,
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
import {
  FormField,
  TextInput,
  StatMiniCard,
  Drawer,
  FODatePicker,
  formatINR,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import {
  sampleBankReconciliationData,
  sampleBankAccounts,
  BankReconciliationEntry,
} from "@/app/data/accounts/bankReconciliationData";
import { cn } from "@/lib/utils";

export function BankReconciliationView() {
  // Mobile Filter Drawer State
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Bank Account & Date Controls
  const [selectedBank, setSelectedBank] = useState("<ALL Banks>");
  const [appliedBank, setAppliedBank] = useState("<ALL Banks>");
  const [fromDate, setFromDate] = useState("2026-04-01");
  const [toDate, setToDate] = useState("2027-03-31");
  const [appliedFromDate, setAppliedFromDate] = useState("2026-04-01");
  const [appliedToDate, setAppliedToDate] = useState("2027-03-31");
  const [datePreset, setDatePreset] = useState("fy26");

  // WINHMS Checkboxes (Matching Screenshot)
  const [showDebit, setShowDebit] = useState(true);
  const [showCredit, setShowCredit] = useState(true);
  const [fullNarration, setFullNarration] = useState(true); // "Narration" as Line Narration
  const [considerPriorUnreconciled, setConsiderPriorUnreconciled] = useState(true);
  const [sortOnChqNo, setSortOnChqNo] = useState(false);
  const [autoSearch, setAutoSearch] = useState(true);
  const [reconAfterToDt, setReconAfterToDt] = useState(true);
  const [systemDtAsReconcileDt, setSystemDtAsReconcileDt] = useState(true);
  const [printReconcileDt, setPrintReconcileDt] = useState(false);
  const [summaryWithChqDetails, setSummaryWithChqDetails] = useState(false);
  const [foreignCurrency, setForeignCurrency] = useState(false);
  const [considerReconciled, setConsiderReconciled] = useState(true);

  // Reconciliation Entries List
  const [entries, setEntries] = useState<BankReconciliationEntry[]>(
    sampleBankReconciliationData
  );

  // Search Filter Query
  const [searchQuery, setSearchQuery] = useState("");

  // Loading, Confirmation Modal, & Toast Notification State
  const [isDisplayLoading, setIsDisplayLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Count selected/reconciled transactions
  const reconciledCount = useMemo(() => {
    return entries.filter((e) => e.reconciled).length;
  }, [entries]);

  // Initiate Save Reconciliation Confirmation Modal
  const initiateSaveReconciliation = () => {
    if (reconciledCount === 0) {
      setToastMessage("Please select at least one transaction to reconcile.");
      return;
    }
    setShowSaveConfirmModal(true);
  };

  // Execution of Save Reconciliation
  const handleExecuteSaveReconciliation = () => {
    const countToReport = reconciledCount;
    setShowSaveConfirmModal(false);
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setToastMessage(
        `✓ ${countToReport} transaction(s) reconciled successfully.`
      );
    }, 400);
  };

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


  // Update Item Recon Date
  const handleUpdateReconDate = (id: string, dateVal: string) => {
    setEntries(
      entries.map((item) => (item.id === id ? { ...item, reconDate: dateVal } : item))
    );
  };

  // Date Presets Handler — Programmed to adjust From & To dates automatically
  const handleDatePreset = (preset: string) => {
    setDatePreset(preset);
    let newFrom = "2026-04-01";
    let newTo = "2027-03-31";

    if (preset === "fy26") {
      newFrom = "2026-04-01";
      newTo = "2027-03-31";
    } else if (preset === "fy25") {
      newFrom = "2025-04-01";
      newTo = "2026-03-31";
    } else if (preset === "q1") {
      newFrom = "2026-04-01";
      newTo = "2026-06-30";
    } else if (preset === "q2") {
      newFrom = "2026-07-01";
      newTo = "2026-09-30";
    } else if (preset === "q3") {
      newFrom = "2026-10-01";
      newTo = "2026-12-31";
    } else if (preset === "q4") {
      newFrom = "2027-01-01";
      newTo = "2027-03-31";
    } else if (preset === "thisMonth") {
      newFrom = "2026-07-01";
      newTo = "2026-07-31";
    }

    setFromDate(newFrom);
    setToDate(newTo);
    setAppliedFromDate(newFrom);
    setAppliedToDate(newTo);
  };

  // Display Report Action — Updates transaction log according to selected date range and bank account
  const handleDisplayReport = () => {
    setIsDisplayLoading(true);
    setAppliedBank(selectedBank);
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    setToastMessage(
      `✓ Updated transaction log for ${selectedBank} (Period: ${fromDate} to ${toDate}).`
    );
    setTimeout(() => {
      setIsDisplayLoading(false);
    }, 350);
  };

  // Save Reconciliation State
  const handleSaveReconciliation = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setToastMessage(
        `✓ Bank Reconciliation statement saved successfully for ${appliedBank}.`
      );
    }, 400);
  };

  // Filtered Entries by Applied Bank Account, Date Range, & User Preferences
  const activeBank = autoSearch ? selectedBank : appliedBank;
  const activeFromDate = autoSearch ? fromDate : appliedFromDate;
  const activeToDate = autoSearch ? toDate : appliedToDate;

  // Toggle Single Item Reconciled Status
  const handleToggleReconciled = (id: string) => {
    setEntries((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextState = !item.reconciled;
          const defaultDate = systemDtAsReconcileDt
            ? "05/08/2026"
            : item.vouchDt || "28/04/2026";
          return {
            ...item,
            reconciled: nextState,
            reconDate: nextState ? defaultDate : "",
          };
        }
        return item;
      })
    );
  };

  const filteredData = useMemo(() => {
    let result = entries.filter((item) => {
      // 1. Bank Account Filter (<ALL Banks> or specific selected bank)
      if (
        activeBank &&
        activeBank !== "<ALL Banks>" &&
        item.bankName !== activeBank
      ) {
        return false;
      }

      // 2. Date Range Filter & Prior Unreconciled Handling
      const itemDate = parseFormattedDate(item.vouchDt);
      if (activeFromDate && itemDate < activeFromDate) {
        // If prior to from date, keep only if considerPriorUnreconciled is true AND item is NOT yet reconciled
        if (!considerPriorUnreconciled || item.reconciled) {
          return false;
        }
      }
      if (activeToDate && itemDate > activeToDate) {
        return false;
      }

      // 3. Debit/Credit Toggles
      if (!showDebit && item.drAmt > 0) return false;
      if (!showCredit && item.crAmt > 0) return false;

      // 4. Consider Reconciled Filter
      if (!considerReconciled && item.reconciled) return false;

      // 5. Recon After To Date Filter
      if (!reconAfterToDt && item.reconciled && item.reconDate) {
        const rDate = parseFormattedDate(item.reconDate);
        if (activeToDate && rDate > activeToDate) return false;
      }

      // 6. Search Query Filter
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

    if (sortOnChqNo) {
      result = [...result].sort((a, b) =>
        (a.chqNo || "").localeCompare(b.chqNo || "")
      );
    }

    return result;
  }, [
    entries,
    activeBank,
    activeFromDate,
    activeToDate,
    showDebit,
    showCredit,
    considerReconciled,
    considerPriorUnreconciled,
    reconAfterToDt,
    searchQuery,
    sortOnChqNo,
  ]);

  // Balance Calculations for Applied Bank Account & Date Range
  const bankEntries = useMemo(() => {
    return entries.filter((e) => {
      if (appliedBank && appliedBank !== "<ALL Banks>" && e.bankName !== appliedBank) {
        return false;
      }
      const d = parseFormattedDate(e.vouchDt);
      if (appliedFromDate && d < appliedFromDate) return false;
      if (appliedToDate && d > appliedToDate) return false;
      return true;
    });
  }, [entries, appliedBank, appliedFromDate, appliedToDate]);

  const glClosingBalance = useMemo(() => {
    if (appliedBank === "<ALL Banks>") return 2275000;
    if (appliedBank.includes("YES")) return 425000;
    if (appliedBank.includes("HDFC")) return 850000;
    if (appliedBank.includes("ICICI")) return 350000;
    return 650000;
  }, [appliedBank]);

  const unreconciledDeposits = useMemo(() => {
    return bankEntries
      .filter((e) => !e.reconciled && e.drAmt > 0)
      .reduce((sum, e) => sum + e.drAmt, 0);
  }, [bankEntries]);

  const unreconciledCheques = useMemo(() => {
    return bankEntries
      .filter((e) => !e.reconciled && e.crAmt > 0)
      .reduce((sum, e) => sum + e.crAmt, 0);
  }, [bankEntries]);

  const bankStatementBalance =
    glClosingBalance + unreconciledCheques - unreconciledDeposits;
  const unreconciledDiff = Math.abs(glClosingBalance - bankStatementBalance);

  // Shared Filter Form Controls Component (3 Equal Cards like Trial Balance)
  const FilterFormContent = () => (
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
            value={selectedBank}
            onChange={(e) => setSelectedBank(e.target.value)}
            className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 font-bold focus:border-emerald-500 focus:outline-none"
          >
            {sampleBankAccounts.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 cursor-pointer hover:border-emerald-300 text-xs font-medium text-slate-700">
          <input
            type="checkbox"
            checked={considerPriorUnreconciled}
            onChange={(e) => setConsiderPriorUnreconciled(e.target.checked)}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-[11px]">Consider Prior Unreconciled</span>
        </label>
      </div>

      {/* Box 2: Reconciliation Options Checkboxes (WINHMS Image) */}
      <div className="lg:col-span-4 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/70 space-y-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600" />
          Reconciliation Controls
        </p>

        <div className="grid grid-cols-2 gap-1.5 text-xs font-medium text-slate-700">
          <label className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={fullNarration}
              onChange={(e) => setFullNarration(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span className="text-[11px] truncate">"Narration" as Line Narration</span>
          </label>

          <label className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={sortOnChqNo}
              onChange={(e) => setSortOnChqNo(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span className="text-[11px] truncate">Sort On Chq.No</span>
          </label>

          <label className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={autoSearch}
              onChange={(e) => setAutoSearch(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span className="text-[11px] truncate">Auto Search</span>
          </label>

          <label className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={reconAfterToDt}
              onChange={(e) => setReconAfterToDt(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span className="text-[11px] truncate">Recon after To Dt</span>
          </label>

          <label className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={systemDtAsReconcileDt}
              onChange={(e) => setSystemDtAsReconcileDt(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span className="text-[11px] truncate">System Dt as Reconcile Dt</span>
          </label>

          <label className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={printReconcileDt}
              onChange={(e) => setPrintReconcileDt(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span className="text-[11px] truncate">Print Reconcile Dt</span>
          </label>

          <label className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={foreignCurrency}
              onChange={(e) => setForeignCurrency(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span className="text-[11px] truncate">Foreign Currency</span>
          </label>

          <label className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={summaryWithChqDetails}
              onChange={(e) => setSummaryWithChqDetails(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span className="text-[11px] truncate">Summary with Chq Details</span>
          </label>

          <label className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 border border-slate-200 cursor-pointer hover:border-emerald-300 col-span-2">
            <input
              type="checkbox"
              checked={considerReconciled}
              onChange={(e) => setConsiderReconciled(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span className="text-[11px] truncate">Consider Reconciled</span>
          </label>
        </div>
      </div>

      {/* Box 3: Period & Action Controls */}
      <div className="lg:col-span-4 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/70 space-y-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-emerald-600" />
          Period & Display
        </p>

        {/* Date Presets */}
        <div className="flex flex-wrap items-center gap-1">
          {[
            { id: "fy26", label: "FY 2026-27" },
            { id: "fy25", label: "FY 2025-26" },
            { id: "q1", label: "Q1 Apr-Jun" },
            { id: "q2", label: "Q2 Jul-Sep" },
            { id: "thisMonth", label: "This Month" },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleDatePreset(p.id)}
              className={cn(
                "flex-1 min-w-[70px] rounded-lg py-1 text-[10px] font-bold transition-all border cursor-pointer select-none text-center",
                datePreset === p.id
                  ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Date Inputs & Display Button */}
        <div className="flex flex-wrap items-end gap-2 pt-0.5">
          <FormField label="From Date" className="flex-1 min-w-[105px]">
            <FODatePicker
              value={fromDate}
              onChange={(val) => setFromDate(val)}
            />
          </FormField>

          <FormField label="To Date" className="flex-1 min-w-[105px]">
            <FODatePicker
              value={toDate}
              onChange={(val) => setToDate(val)}
            />
          </FormField>

          <Button
            type="button"
            size="sm"
            onClick={handleDisplayReport}
            disabled={isDisplayLoading}
            className="h-8 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-3 shadow-xs shrink-0 disabled:opacity-75 cursor-pointer"
          >
            {isDisplayLoading ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5 mr-1" />
            )}
            Display
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <ModulePageShell
      eyebrow="Accounts & Bank Audit"
      title="Bank Reconciliation Statement"
      description="Reconcile General Ledger bank account postings with actual bank statement transactions and un-cleared cheques."
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={initiateSaveReconciliation}
            disabled={reconciledCount === 0 || isSaving}
            className={cn(
              "rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-all cursor-pointer",
              (reconciledCount === 0 || isSaving) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1" />
            )}
            Save Reconciliation ({reconciledCount})
          </Button>

          <a href="/accounts/transactions/bank-reconciliation-reversing">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-semibold bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100 shadow-xs"
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
            Print
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => alert("Bank Reconciliation exported to CSV.")}
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
            className="rounded-xl border-slate-200 text-xs font-semibold gap-1.5 md:hidden bg-white text-slate-700"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filter</span>
          </Button>
        </div>

        {/* Bank Badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
            <Building2 className="h-3.5 w-3.5 text-emerald-700" />
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
              <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Bank Reconciliation Parameters & View Controls
              </h3>
            </div>
            <button
              onClick={() => setShowFilters(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
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
        title="Bank Reconciliation Options"
      >
        <div className="p-4">
          <FilterFormContent />
          <div className="mt-4 border-t border-slate-100 pt-3">
            <Button
              type="button"
              className="w-full bg-emerald-700 text-white"
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
          label="GL Book Closing Balance"
          value={formatINR(glClosingBalance)}
          sublabel="Current ledger balance in books"
          accent="#0284c7"
          icon={Building2}
        />
        <StatMiniCard
          label="Balance As Per Bank Statement"
          value={formatINR(bankStatementBalance)}
          sublabel="Calculated actual bank balance"
          accent="#16a34a"
          icon={CheckCircle2}
        />
        <StatMiniCard
          label="Unreconciled Difference"
          value={formatINR(unreconciledDiff)}
          sublabel="Pending cheques & uncleared deposits"
          accent="#e11d48"
          icon={AlertCircle}
        />
      </div>

      {/* Bank Reconciliation Summary Info Box (Matching WINHMS Note Box) */}
      <div className="mb-4 rounded-2xl border border-rose-200/90 bg-rose-50/40 p-4 text-xs space-y-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between font-bold text-rose-900 border-b border-rose-200/60 pb-2 gap-2">
          <span className="flex items-center gap-1.5 text-rose-900 font-bold text-xs">
            <AlertCircle className="h-4 w-4 text-rose-700 shrink-0" />
            Note : The following transactions are not reconciled with bank statement
          </span>
          <span className="text-[11px] uppercase tracking-wider text-slate-600 font-semibold">
            {selectedBank}
          </span>
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
            <span className="font-bold text-rose-700 text-xs">{formatINR(unreconciledDiff)}</span>
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

        {/* Desktop Table (hidden md:block) */}
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
                <th className="px-3 py-2.5 text-right w-28">
                  Dr Amt {foreignCurrency ? "(INR ₹)" : "(₹)"}
                </th>
                <th className="px-3 py-2.5 text-right w-28">
                  Cr Amt {foreignCurrency ? "(INR ₹)" : "(₹)"}
                </th>
                <th className="px-3 py-2.5 text-center w-24">Reconciled</th>
                <th className="px-3 py-2.5 text-center w-28">
                  Recon Date {printReconcileDt && <span className="text-[8px] text-emerald-700 block font-normal">(Print)</span>}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 font-medium">
                    No bank transaction entries found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "even:bg-slate-50/50 hover:bg-slate-100/80 transition-colors",
                      row.reconciled && "bg-emerald-50/60 hover:bg-emerald-100/60 border-l-2 border-l-emerald-600"
                    )}
                  >
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
                    <td className="px-4 py-2.5 text-slate-800 font-medium">
                      {fullNarration
                        ? row.narration
                        : row.narration.length > 25
                        ? `${row.narration.slice(0, 25)}...`
                        : row.narration}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-slate-900">
                      {row.drAmt > 0
                        ? foreignCurrency
                          ? `INR ${formatINR(row.drAmt)}`
                          : formatINR(row.drAmt)
                        : "-"}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-slate-900">
                      {row.crAmt > 0
                        ? foreignCurrency
                          ? `INR ${formatINR(row.crAmt)}`
                          : formatINR(row.crAmt)
                        : "-"}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={row.reconciled}
                        onChange={() => handleToggleReconciled(row.id)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {row.reconciled ? (
                        <input
                          type="text"
                          value={row.reconDate || "28/04/2026"}
                          onChange={(e) => handleUpdateReconDate(row.id, e.target.value)}
                          className="h-6 w-24 rounded border border-slate-200 px-1.5 text-center text-xs font-bold text-emerald-800 focus:border-emerald-500 focus:outline-none"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Card View (md:hidden) */}
        <div className="md:hidden space-y-2.5">
          {filteredData.length === 0 ? (
            <div className="p-6 text-center text-slate-400 font-medium text-xs rounded-xl border border-slate-200 bg-white">
              No bank transaction entries found.
            </div>
          ) : (
            filteredData.map((row) => (
              <div
                key={row.id}
                className={cn(
                  "rounded-xl border border-slate-200 bg-white p-3.5 space-y-2",
                  row.reconciled && "border-emerald-300 bg-emerald-50/20"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{row.vouchNo}</span>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={row.reconciled}
                      onChange={() => handleToggleReconciled(row.id)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span>{row.reconciled ? "Reconciled" : "Pending"}</span>
                  </label>
                </div>

                <p className="text-xs font-semibold text-slate-800">{row.narration}</p>
                <p className="text-[11px] text-slate-500">Chq #: {row.chqNo} • Date: {row.chqDt}</p>

                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">Voucher Dt: {row.vouchDt}</span>
                  <span className="font-bold text-slate-900">
                    {row.drAmt > 0 ? `Dr ${formatINR(row.drAmt)}` : `Cr ${formatINR(row.crAmt)}`}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 🔐 SAVE RECONCILIATION CONFIRMATION MODAL */}
      {showSaveConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Confirm Reconciliation
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Bank Audit Confirmation
                  </p>
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
                You are about to reconcile <strong className="text-slate-900">{reconciledCount} selected transaction(s)</strong>.
              </p>
              <p className="text-[11px] text-emerald-800 font-semibold">
                This action will update the reconciliation records.
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
                onClick={handleExecuteSaveReconciliation}
                className="rounded-xl font-bold text-xs px-4 text-white bg-emerald-700 hover:bg-emerald-800 cursor-pointer"
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </ModulePageShell>
  );
}
