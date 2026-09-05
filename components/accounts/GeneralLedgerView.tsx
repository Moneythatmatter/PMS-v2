"use client";

import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Printer,
  Download,
  Search,
  CheckCircle2,
  SlidersHorizontal,
  X,
  Calendar,
  FileSpreadsheet,
  Filter,
  Loader2,
  BookOpen,
  ChevronDown,
  Eye,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import {
  FormField,
  Drawer,
  Modal,
  FODatePicker,
  formatINR,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import {
  sampleGeneralLedgerData,
  sampleGroups,
  sampleLedgersList,
  sampleVoucherTypes,
  resolvePartyName,
  resolveDivisionName,
  GeneralLedgerEntry,
} from "@/app/data/accounts/generalLedgerData";
import { cn } from "@/lib/utils";

export function GeneralLedgerView() {
  // Filters Panel / Mobile Drawer Toggle
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Search Modal for Ledger Selection
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState("");

  // Voucher Detail Drill-Down Modal State (Read-Only)
  const [selectedVoucherForModal, setSelectedVoucherForModal] = useState<GeneralLedgerEntry | null>(null);

  // Primary Selection Controls (ID-based / Group-based)
  const [selectedGroup, setSelectedGroup] = useState("<ALL>");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedVoucherType, setSelectedVoucherType] = useState("<ALL>");

  // Date Range Controls
  const [fromDate, setFromDate] = useState("2026-04-01");
  const [toDate, setToDate] = useState("2027-03-31");
  const [appliedFromDate, setAppliedFromDate] = useState("2026-04-01");
  const [appliedToDate, setAppliedToDate] = useState("2027-03-31");
  const [datePreset, setDatePreset] = useState("fy26");
  const [sortOn, setSortOn] = useState<"seqNo" | "vouchDt">("seqNo");

  // Report display options (lean V1)
  const [cummulativeBalance, setCummulativeBalance] = useState(true);
  const [showCompanyHeading, setShowCompanyHeading] = useState(true);
  const [showDrTrn, setShowDrTrn] = useState(true);
  const [showCrTrn, setShowCrTrn] = useState(true);
  const [suppressZero, setSuppressZero] = useState(false);

  // Search filter query (searches Voucher #, Particulars, Party, Account, Division)
  const [searchQuery, setSearchQuery] = useState("");

  // Action Loading & Toast State
  const [isDisplayLoading, setIsDisplayLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active selected account object
  const activeAccount = useMemo(() => {
    if (!selectedAccountId) return null;
    return sampleLedgersList.find((l) => l.accountId === selectedAccountId) || null;
  }, [selectedAccountId]);

  // Preset Date Range Selector
  const handleDatePreset = (preset: string) => {
    setDatePreset(preset);
    let newFrom = "2026-04-01";
    let newTo = "2027-03-31";
    if (preset === "fy26") {
      newFrom = "2026-04-01";
      newTo = "2027-03-31";
    } else if (preset === "q1") {
      newFrom = "2026-04-01";
      newTo = "2026-06-30";
    } else if (preset === "thisMonth") {
      newFrom = "2026-04-01";
      newTo = "2026-04-30";
    }
    setFromDate(newFrom);
    setToDate(newTo);
  };

  // Trigger Display Action
  const handleDisplayReport = () => {
    setIsDisplayLoading(true);
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    const ledgerLabel = activeAccount ? `${activeAccount.accountCode} - ${activeAccount.accountName}` : "All Ledgers";
    setToastMessage(`General Ledger refreshed for ${ledgerLabel} (${fromDate} to ${toDate}).`);
    setTimeout(() => {
      setIsDisplayLoading(false);
    }, 250);
  };

  // Filtered Ledger Data
  const filteredData = useMemo(() => {
    return sampleGeneralLedgerData.filter((item) => {
      // Group Filter (Hierarchy Match)
      if (selectedGroup !== "<ALL>") {
        if (selectedGroup === "Assets" && item.nature !== "Asset") return false;
        else if (selectedGroup === "Liabilities" && item.nature !== "Liability") return false;
        else if (selectedGroup === "Income" && item.nature !== "Income") return false;
        else if (selectedGroup === "Expenses" && item.nature !== "Expense") return false;
        else if (
          selectedGroup !== "Assets" &&
          selectedGroup !== "Liabilities" &&
          selectedGroup !== "Income" &&
          selectedGroup !== "Expenses" &&
          item.group !== selectedGroup
        ) {
          return false;
        }
      }

      // Ledger Filter (by accountId)
      if (selectedAccountId && item.accountId !== selectedAccountId) {
        return false;
      }

      // Voucher Type Filter
      if (selectedVoucherType !== "<ALL>" && item.trnType !== selectedVoucherType) return false;

      // DR / CR Trn Filters
      if (!showDrTrn && item.drAmt > 0 && !item.isOpeningBalance) return false;
      if (!showCrTrn && item.crAmt > 0 && !item.isOpeningBalance) return false;

      // Suppress Zero Filter
      if (suppressZero && item.drAmt === 0 && item.crAmt === 0) return false;

      // Global Search Filter (Voucher #, Particulars, Party, Account, Division)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const partyName = resolvePartyName(item.partyId).toLowerCase();
        const divisionName = resolveDivisionName(item.divisionId).toLowerCase();
        const matchesVouchNo = item.vouchNo.toLowerCase().includes(q);
        const matchesParticulars = item.particulars.toLowerCase().includes(q);
        const matchesAccount = item.accountName.toLowerCase().includes(q) || item.accountCode.toLowerCase().includes(q);
        const matchesParty = partyName.includes(q);
        const matchesDivision = divisionName.includes(q);

        if (!matchesVouchNo && !matchesParticulars && !matchesAccount && !matchesParty && !matchesDivision) {
          return false;
        }
      }

      return true;
    });
  }, [
    selectedGroup,
    selectedAccountId,
    selectedVoucherType,
    showDrTrn,
    showCrTrn,
    suppressZero,
    searchQuery,
  ]);

  // Account Nature-Aware Dynamic Running Balance Calculation
  const rowsWithRunningBalance = useMemo(() => {
    let running = 0;
    const isCreditOriented = activeAccount?.nature === "Liability" || activeAccount?.nature === "Income";

    return filteredData.map((row) => {
      let netMovement = 0;
      if (isCreditOriented) {
        // For Liability & Income: Credit increases balance, Debit decreases balance
        netMovement = row.crAmt - row.drAmt;
      } else {
        // For Assets & Expenses: Debit increases balance, Credit decreases balance
        netMovement = row.drAmt - row.crAmt;
      }

      running += netMovement;

      let balType: "Dr" | "Cr" = "Dr";
      if (isCreditOriented) {
        balType = running >= 0 ? "Cr" : "Dr";
      } else {
        balType = running >= 0 ? "Dr" : "Cr";
      }

      return {
        ...row,
        computedRunningBal: Math.abs(running),
        computedBalType: balType,
      };
    });
  }, [filteredData, activeAccount]);

  // Dynamic Total Calculations
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, item) => {
        acc.totalDr += item.drAmt;
        acc.totalCr += item.crAmt;
        return acc;
      },
      { totalDr: 0, totalCr: 0 }
    );
  }, [filteredData]);

  // Dynamic Closing Balance
  const isCreditOriented = activeAccount?.nature === "Liability" || activeAccount?.nature === "Income";
  const netDiff = isCreditOriented
    ? totals.totalCr - totals.totalDr
    : totals.totalDr - totals.totalCr;
  const closingBalanceType: "Dr" | "Cr" = isCreditOriented
    ? netDiff >= 0 ? "Cr" : "Dr"
    : netDiff >= 0 ? "Dr" : "Cr";

  // Count operational vouchers (excluding opening balance baseline from operational count)
  const operationalVoucherCount = filteredData.filter((item) => !item.isOpeningBalance).length;

  // Filtered Ledgers for Modal Search
  const filteredModalLedgers = sampleLedgersList.filter((l) => {
    const q = ledgerSearchQuery.toLowerCase();
    return (
      l.accountName.toLowerCase().includes(q) ||
      l.accountCode.toLowerCase().includes(q) ||
      l.group.toLowerCase().includes(q)
    );
  });

  // Badge Color Helper for Transaction Types
  const getTrnTypeBadgeClass = (type: string) => {
    switch (type) {
      case "Receipts":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Payments":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "Journal":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Opening":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  // ─────────────────────────────────────────────────────────────
  // CLEAN EXCEL-READY CSV EXPORT
  // ─────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const escapeCSV = (val: string | number | null | undefined): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return `"${str}"`;
    };

    const headers = [
      "VOUCHER DATE",
      "VOUCHER NO",
      "PARTICULARS",
      "PARTY",
      "DIVISION",
      "ACCOUNT CODE",
      "ACCOUNT NAME",
      "TYPE",
      "DR AMOUNT (INR)",
      "CR AMOUNT (INR)",
      "RUNNING BALANCE",
    ];

    const dataRows = rowsWithRunningBalance.map((r) => [
      r.vouchDt,
      r.vouchNo,
      r.particulars,
      resolvePartyName(r.partyId),
      resolveDivisionName(r.divisionId),
      r.accountCode,
      r.accountName,
      r.trnType,
      r.drAmt,
      r.crAmt,
      `${r.computedRunningBal} ${r.computedBalType}`,
    ]);

    // Totals Row
    dataRows.push([
      "TOTALS",
      "GRAND TOTAL",
      "GENERAL LEDGER POSTINGS",
      "",
      "",
      "",
      "",
      "",
      totals.totalDr,
      totals.totalCr,
      `${Math.abs(netDiff)} ${closingBalanceType}`,
    ]);

    const csvContent =
      "\uFEFF" +
      [headers, ...dataRows]
        .map((row) => row.map(escapeCSV).join(","))
        .join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `PMS_General_Ledger_${appliedFromDate}_to_${appliedToDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Shared Filter Controls Component
  const FilterFormContent = () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
      {/* Box 1: Group, Ledger & Voucher Type Selection */}
      <div className="lg:col-span-4 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/70 space-y-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
          Account & Voucher Selection
        </p>

        {/* Group Dropdown */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-600">Group / Nature:</label>
          <select
            value={selectedGroup}
            onChange={(e) => {
              setSelectedGroup(e.target.value);
              setSelectedAccountId(""); // Reset specific account when switching group
            }}
            className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          >
            {sampleGroups.map((grp) => (
              <option key={grp} value={grp}>
                {grp}
              </option>
            ))}
          </select>
        </div>

        {/* Ledger Selector with Search Modal */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-600">Specific Ledger Account:</label>
          <div className="flex items-center gap-1.5">
            <div className="flex-1 truncate rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 h-8 flex items-center">
              {activeAccount ? (
                <span className="truncate">
                  <strong className="text-emerald-700">{activeAccount.accountCode}</strong> - {activeAccount.accountName}
                </span>
              ) : (
                <span className="text-slate-400">All Accounts in Scope</span>
              )}
            </div>
            {selectedAccountId && (
              <button
                type="button"
                onClick={() => setSelectedAccountId("")}
                className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-600 flex items-center justify-center shrink-0 cursor-pointer"
                title="Clear selected account"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLedgerModalOpen(true)}
              className="h-8 px-2.5 border-slate-200 bg-white text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer shrink-0"
              title="Lookup Account"
            >
              <Search className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-[11px] font-bold">Find</span>
            </Button>
          </div>
        </div>

        {/* Voucher Type Dropdown */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-600">Voucher Type:</label>
          <select
            value={selectedVoucherType}
            onChange={(e) => setSelectedVoucherType(e.target.value)}
            className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          >
            {sampleVoucherTypes.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Box 2: Report & Display Options */}
      <div className="lg:col-span-4 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/70 space-y-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
          Report & Display Options
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700">
          <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={cummulativeBalance}
              onChange={(e) => setCummulativeBalance(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-[11px]">Cumulative Bal</span>
          </label>

          <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={showCompanyHeading}
              onChange={(e) => setShowCompanyHeading(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-[11px]">Company Heading</span>
          </label>

          <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={showDrTrn}
              onChange={(e) => setShowDrTrn(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-[11px]">DR Postings</span>
          </label>

          <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={showCrTrn}
              onChange={(e) => setShowCrTrn(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-[11px]">CR Postings</span>
          </label>

          <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 cursor-pointer hover:border-emerald-300 col-span-2">
            <input
              type="checkbox"
              checked={suppressZero}
              onChange={(e) => setSuppressZero(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-[11px]">Suppress Zero Balances</span>
          </label>
        </div>
      </div>

      {/* Box 3: Period & Sorting */}
      <div className="lg:col-span-4 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/70 space-y-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-emerald-600" />
          Period & Sorting
        </p>

        {/* Date Presets */}
        <div className="flex items-center gap-1">
          {[
            { id: "fy26", label: "FY 2026-27" },
            { id: "q1", label: "Q1 Apr-Jun" },
            { id: "thisMonth", label: "This Month" },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleDatePreset(p.id)}
              className={cn(
                "flex-1 rounded-lg py-1 text-[11px] font-semibold transition-all border cursor-pointer select-none",
                datePreset === p.id
                  ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Dates Row & Display Button */}
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
            className="h-8 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-3.5 shadow-2xs shrink-0 disabled:opacity-75 cursor-pointer rounded-lg"
          >
            {isDisplayLoading ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5 mr-1" />
            )}
            Display
          </Button>
        </div>

        {/* Sorting Touch Pills */}
        <div className="flex items-center justify-between pt-1 text-xs text-slate-700">
          <span className="font-bold text-slate-600 text-[11px] uppercase tracking-wider">Sort On:</span>
          <div className="flex items-center gap-1.5 font-medium">
            {[
              { id: "seqNo", label: "Voucher Date" },
              { id: "vouchDt", label: "Sequence #" },
            ].map((opt) => {
              const active = sortOn === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSortOn(opt.id as any)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer select-none",
                    active
                      ? "border-slate-900 bg-slate-900 text-white shadow-2xs"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ModulePageShell
      eyebrow="Accounts &amp; General Ledger"
      title="General Ledger Report"
      description="Voucher-level account transactions, debit/credit postings, and running balances."
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-lg text-xs font-semibold bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs hidden sm:inline-flex cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Print
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleExportCSV}
            className="rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs cursor-pointer px-3.5"
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            Export CSV
          </Button>
        </div>
      }
      wrapChildren={false}
    >
      {/* Top Filter Controls Toolbar Bar */}
      <div className="mt-4 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "rounded-lg border-slate-200 text-xs font-semibold gap-1.5 transition-all hidden md:inline-flex cursor-pointer shadow-2xs",
              showFilters ? "bg-slate-100 text-slate-900 border-slate-300" : "text-slate-700 bg-white hover:bg-slate-50"
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
            <span>{showFilters ? "Hide Report Controls" : "Report Parameters & Options"}</span>
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
            className="rounded-lg border-slate-200 text-xs font-semibold gap-1.5 md:hidden bg-white text-slate-700"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filter</span>
          </Button>
        </div>

        {/* Selected Ledger Badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200">
            <BookOpen className="h-3.5 w-3.5 text-emerald-700" />
            Active Ledger:{" "}
            <span className="underline">
              {activeAccount ? `${activeAccount.accountCode} - ${activeAccount.accountName}` : selectedGroup !== "<ALL>" ? `Group: ${selectedGroup}` : "All Ledgers"}
            </span>
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200">
            <Calendar className="h-3.5 w-3.5 text-slate-600" />
            FY 2026 - 27
          </span>
        </div>
      </div>

      {/* Desktop Filter Panel (Collapsible) */}
      {showFilters && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4 hidden md:block">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <SlidersHorizontal className="h-4 w-4" />
              </span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                General Ledger Selection Parameters
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(false)}
              className="text-xs text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              Hide Filters
            </button>
          </div>
          <FilterFormContent />
        </div>
      )}

      {/* Mobile Drawer */}
      <Drawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        title="General Ledger Options"
      >
        <div className="p-4 space-y-4">
          <FilterFormContent />
          <div className="pt-2">
            <Button
              type="button"
              size="sm"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg"
              onClick={() => setMobileFilterOpen(false)}
            >
              Apply Ledger Filter
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Standard Vertical KPI Cards Grid (F&B / Front Office Style) */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Card 1: Total Debit Postings */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Total Debit Postings (DR)
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 sm:h-8 sm:w-8">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl truncate font-mono">
            {formatINR(totals.totalDr)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs truncate">
            Total period debit vouchers
          </p>
        </Card>

        {/* Card 2: Total Credit Postings */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Total Credit Postings (CR)
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-700 sm:h-8 sm:w-8">
              <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl truncate font-mono">
            {formatINR(totals.totalCr)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs truncate">
            Total period credit vouchers
          </p>
        </Card>

        {/* Card 3: Closing Running Balance */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Closing Running Balance
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 sm:h-8 sm:w-8">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl truncate font-mono">
            {formatINR(Math.abs(netDiff))} {closingBalanceType}
          </p>
          <p className="mt-0.5 text-[11px] text-emerald-700 font-semibold sm:text-xs truncate">
            {activeAccount ? `Account Nature: ${activeAccount.nature}` : "Consolidated Ledger Position"}
          </p>
        </Card>
      </div>

      {/* Company Heading Block */}
      {showCompanyHeading && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5 text-center shadow-2xs">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
            Hotel &amp; Resorts Private Limited
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Grand Boulevard, Hospitality District • GSTIN: 27AAAAA0000A1Z5
          </p>
          <div className="my-2.5 border-t border-slate-100 max-w-xs mx-auto" />
          <h2 className="text-xs font-bold tracking-widest text-emerald-800 uppercase">
            GENERAL LEDGER STATEMENT{" "}
            {activeAccount
              ? `— ${activeAccount.accountCode} ${activeAccount.accountName.toUpperCase()}`
              : selectedGroup !== "<ALL>"
              ? `— GROUP: ${selectedGroup.toUpperCase()}`
              : "— ALL LEDGERS"}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            For the Period: <span className="font-semibold text-slate-700">{appliedFromDate}</span> to{" "}
            <span className="font-semibold text-slate-700">{appliedToDate}</span>
          </p>
        </div>
      )}

      {/* Account Lookup Modal */}
      <Modal
        open={ledgerModalOpen}
        onClose={() => setLedgerModalOpen(false)}
        title="Chart of Accounts - Ledger Lookup"
      >
        <div className="space-y-3 p-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={ledgerSearchQuery}
              onChange={(e) => setLedgerSearchQuery(e.target.value)}
              placeholder="Search by account code, name, or group..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
            />
          </div>

          <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white shadow-2xs">
            {filteredModalLedgers.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">No accounts match your search.</div>
            ) : (
              filteredModalLedgers.map((acc) => (
                <button
                  key={acc.accountId}
                  type="button"
                  onClick={() => {
                    setSelectedAccountId(acc.accountId);
                    setLedgerModalOpen(false);
                  }}
                  className={cn(
                    "w-full px-3.5 py-2 text-left text-xs font-medium transition-colors flex items-center justify-between hover:bg-slate-50 cursor-pointer",
                    selectedAccountId === acc.accountId ? "bg-slate-100 font-bold text-slate-900" : "text-slate-700"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-700">{acc.accountCode}</span>
                    <span>{acc.accountName}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({acc.group})</span>
                  </div>
                  {selectedAccountId === acc.accountId && (
                    <span className="text-[10px] uppercase font-bold text-slate-900">Selected</span>
                  )}
                </button>
              ))
            )}
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLedgerModalOpen(false)}
              className="text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Read-Only Voucher Detail Modal (Drill-Down) */}
      <Modal
        open={Boolean(selectedVoucherForModal)}
        onClose={() => setSelectedVoucherForModal(null)}
        title={`Voucher Inquiry: ${selectedVoucherForModal?.vouchNo || ""}`}
      >
        {selectedVoucherForModal && (
          <div className="space-y-4 p-1">
            {/* Read-Only Notice */}
            <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-200">
              <Eye className="h-4 w-4 text-emerald-700" />
              <span>General Ledger Inquiry (Strictly Read-Only Transaction Breakdown)</span>
            </div>

            {/* Voucher Meta Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Voucher Number</span>
                <span className="font-bold text-slate-900 font-mono">{selectedVoucherForModal.vouchNo}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Voucher Date</span>
                <span className="font-semibold text-slate-800 font-mono">{selectedVoucherForModal.vouchDt}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Voucher Type</span>
                <span
                  className={cn(
                    "inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider mt-0.5",
                    getTrnTypeBadgeClass(selectedVoucherForModal.trnType)
                  )}
                >
                  {selectedVoucherForModal.trnType}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Source Module</span>
                <span className="font-semibold text-emerald-800">{selectedVoucherForModal.sourceModule}</span>
              </div>
            </div>

            {/* PMS Dimensions (Party & Division) */}
            <div className="grid grid-cols-2 gap-2.5 rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Party</span>
                <span className="font-bold text-slate-900">{resolvePartyName(selectedVoucherForModal.partyId)}</span>
                {selectedVoucherForModal.partyId && (
                  <span className="text-[10px] text-slate-400 font-mono block">ID: {selectedVoucherForModal.partyId}</span>
                )}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Division / Cost Center</span>
                <span className="font-bold text-slate-900">{resolveDivisionName(selectedVoucherForModal.divisionId)}</span>
                {selectedVoucherForModal.divisionId && (
                  <span className="text-[10px] text-slate-400 font-mono block">ID: {selectedVoucherForModal.divisionId}</span>
                )}
              </div>
            </div>

            {/* Narration */}
            <div className="rounded-xl border border-slate-200 p-3 bg-white space-y-1 text-xs shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Particulars / Narration</span>
              <p className="font-medium text-slate-800">{selectedVoucherForModal.particulars}</p>
            </div>

            {/* Accounting Distribution Breakdown Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <th className="px-3 py-2">Side</th>
                    <th className="px-3 py-2">Account</th>
                    <th className="px-3 py-2 text-right">Debit (₹)</th>
                    <th className="px-3 py-2 text-right">Credit (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {selectedVoucherForModal.drAccounts.map((dr, idx) => (
                    <tr key={`dr-${idx}`}>
                      <td className="px-3 py-2 font-bold text-sky-700">Dr</td>
                      <td className="px-3 py-2 font-medium text-slate-900">
                        <span className="font-mono text-slate-500 mr-1.5">{dr.accountCode}</span>
                        {dr.accountName}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold font-mono text-slate-900">{formatINR(dr.amount)}</td>
                      <td className="px-3 py-2 text-right text-slate-400">-</td>
                    </tr>
                  ))}
                  {selectedVoucherForModal.crAccounts.map((cr, idx) => (
                    <tr key={`cr-${idx}`}>
                      <td className="px-3 py-2 font-bold text-rose-700">Cr</td>
                      <td className="px-3 py-2 font-medium text-slate-900">
                        <span className="font-mono text-slate-500 mr-1.5">{cr.accountCode}</span>
                        {cr.accountName}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-400">-</td>
                      <td className="px-3 py-2 text-right font-semibold font-mono text-slate-900">{formatINR(cr.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Audit Stamp */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Created By: <strong>{selectedVoucherForModal.createdBy}</strong></span>
              <span>Timestamp: <strong>{selectedVoucherForModal.createdDate}</strong></span>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedVoucherForModal(null)}
                className="text-xs font-semibold"
              >
                Close Inquiry
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Main General Ledger Table Card */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs">
        {/* Table Search Toolbar */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <BookOpen className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                General Ledger Transactions
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Double click or tap any voucher row to view accounting distribution.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search voucher #, particulars, party..."
                className="h-8.5 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200 shrink-0">
              {operationalVoucherCount} operational vouchers
            </span>
          </div>
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse table-auto">
            {/* Table Header */}
            <thead>
              <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold uppercase text-[10px] tracking-wider">
                <th className="px-3 py-2.5 border-r border-slate-200 w-24">Vouch Dt</th>
                <th className="px-3 py-2.5 border-r border-slate-200 w-32">Vouch No</th>
                <th className="px-3.5 py-2.5 border-r border-slate-200 min-w-[200px]">Particulars</th>
                <th className="px-3 py-2.5 border-r border-slate-200 w-36">Party</th>
                <th className="px-3 py-2.5 border-r border-slate-200 w-28">Division</th>
                <th className="px-2.5 py-2.5 border-r border-slate-200 w-24 text-center">Type</th>
                <th className="px-3 py-2.5 border-r border-slate-200 text-right w-28">DR Amount (₹)</th>
                <th className="px-3 py-2.5 border-r border-slate-200 text-right w-28">CR Amount (₹)</th>
                {cummulativeBalance && (
                  <th className="px-3 py-2.5 text-right w-32">Running Bal (₹)</th>
                )}
              </tr>
            </thead>

            {/* Table Rows */}
            <tbody className="divide-y divide-slate-100 bg-white">
              {rowsWithRunningBalance.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    "hover:bg-slate-50/80 transition-colors cursor-pointer select-none",
                    row.isOpeningBalance && "bg-amber-50/30 font-semibold"
                  )}
                  onDoubleClick={() => setSelectedVoucherForModal(row)}
                  onClick={() => setSelectedVoucherForModal(row)}
                >
                  <td className="px-3 py-2.5 border-r border-slate-100 text-slate-600 font-medium font-mono">
                    {row.vouchDt}
                  </td>
                  <td className="px-3 py-2.5 border-r border-slate-100 font-bold text-slate-800 font-mono">
                    {row.vouchNo}
                  </td>
                  <td className="px-3.5 py-2.5 border-r border-slate-100 font-semibold text-slate-900">
                    {row.particulars}
                  </td>
                  <td className="px-3 py-2.5 border-r border-slate-100 text-slate-700 truncate max-w-[150px]">
                    {resolvePartyName(row.partyId)}
                  </td>
                  <td className="px-3 py-2.5 border-r border-slate-100 text-slate-600 font-medium">
                    {resolveDivisionName(row.divisionId)}
                  </td>
                  <td className="px-2.5 py-2.5 border-r border-slate-100 text-center">
                    <span
                      className={cn(
                        "inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wider",
                        getTrnTypeBadgeClass(row.trnType)
                      )}
                    >
                      {row.trnType}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 border-r border-slate-100 text-right font-mono font-medium text-slate-800">
                    {row.drAmt > 0 ? formatINR(row.drAmt) : "-"}
                  </td>
                  <td className="px-3 py-2.5 border-r border-slate-100 text-right font-mono font-medium text-slate-800">
                    {row.crAmt > 0 ? formatINR(row.crAmt) : "-"}
                  </td>
                  {cummulativeBalance && (
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-900 bg-slate-50/50">
                      {formatINR(row.computedRunningBal)} {row.computedBalType}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>

            {/* Table Footer Totals */}
            <tfoot>
              <tr className="bg-slate-100 font-bold text-xs border-t-2 border-slate-300 text-slate-900 uppercase">
                <td colSpan={6} className="px-4 py-2.5 text-right border-r border-slate-200 text-slate-900">
                  TOTAL GENERAL LEDGER POSTINGS:
                </td>
                <td className="px-3 py-2.5 text-right font-mono border-r border-slate-200 text-slate-900">
                  {formatINR(totals.totalDr)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono border-r border-slate-200 text-slate-900">
                  {formatINR(totals.totalCr)}
                </td>
                {cummulativeBalance && (
                  <td className="px-3 py-2.5 text-right font-mono text-emerald-950 font-bold bg-emerald-100/60">
                    {formatINR(Math.abs(netDiff))} {closingBalanceType}
                  </td>
                )}
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Mobile Stacked Card View */}
        <div className="md:hidden space-y-3">
          {rowsWithRunningBalance.map((row) => (
            <div
              key={row.id}
              onClick={() => setSelectedVoucherForModal(row)}
              className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2 cursor-pointer hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 font-mono">{row.vouchNo}</span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wider",
                    getTrnTypeBadgeClass(row.trnType)
                  )}
                >
                  {row.trnType}
                </span>
              </div>

              <p className="text-xs font-semibold text-slate-800">{row.particulars}</p>

              <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600 pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Party</span>
                  <span className="font-medium truncate">{resolvePartyName(row.partyId)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Division</span>
                  <span className="font-medium">{resolveDivisionName(row.divisionId)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-2 text-slate-600">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Voucher Date</span>
                  <span className="font-semibold font-mono">{row.vouchDt}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Amount</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {row.drAmt > 0 ? `Dr ${formatINR(row.drAmt)}` : `Cr ${formatINR(row.crAmt)}`}
                  </span>
                </div>
              </div>

              {cummulativeBalance && (
                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs font-bold text-emerald-900 bg-emerald-50/50 -mx-3.5 -mb-3.5 p-2.5 rounded-b-xl">
                  <span className="text-[11px] uppercase tracking-wider text-slate-600 font-semibold">Running Balance:</span>
                  <span className="font-mono">{formatINR(row.computedRunningBal)} {row.computedBalType}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </ModulePageShell>
  );
}
