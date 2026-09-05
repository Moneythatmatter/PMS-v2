"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ChevronDown,
  Printer,
  Download,
  Search,
  Scale,
  Maximize2,
  Minimize2,
  CheckCircle2,
  SlidersHorizontal,
  X,
  Calendar,
  Layers,
  FileSpreadsheet,
  AlertCircle,
  Filter,
  Loader2,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import {
  FormField,
  TextInput,
  Drawer,
  AlertBanner,
  FODatePicker,
  formatINR,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import {
  sampleTrialBalanceData,
  TrialBalanceEntry,
} from "@/app/data/accounts/trialBalanceData";
import { cn } from "@/lib/utils";

export function TrialBalanceView() {
  // Filters Panel / Mobile Drawer Toggle
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Level Selection Checkboxes
  const [showGroup, setShowGroup] = useState(true);
  const [showLedger, setShowLedger] = useState(true);
  const [showSubLedger, setShowSubLedger] = useState(true);
  const [suppressZero, setSuppressZero] = useState(true);

  // Column Visibility Checkboxes
  const [showOpening, setShowOpening] = useState(true);
  const [showTransactions, setShowTransactions] = useState(true);
  const [showClosing, setShowClosing] = useState(true);
  const [showDiff, setShowDiff] = useState(false);
  const [showCompanyHeading, setShowCompanyHeading] = useState(false);

  // Filter & Search Controls
  const [fromDate, setFromDate] = useState("2026-04-01");
  const [toDate, setToDate] = useState("2027-03-31");
  const [appliedFromDate, setAppliedFromDate] = useState("2026-04-01");
  const [appliedToDate, setAppliedToDate] = useState("2027-03-31");
  const [datePreset, setDatePreset] = useState("fy26");
  const [searchQuery, setSearchQuery] = useState("");
  const [orderBy, setOrderBy] = useState<"acGroup" | "seqNo" | "name">("seqNo");
  const [isDisplayLoading, setIsDisplayLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Expanded group IDs state
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "grp-1000": true,
    "grp-1100": true,
    "grp-1200": true,
    "grp-2000": true,
    "grp-2100": true,
    "grp-3000": true,
    "grp-4000": true,
    "grp-5000": true,
    "led-1030": true,
    "led-2010": true,
  });

  const toggleExpand = (id: string) => {
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    sampleTrialBalanceData.forEach((item) => {
      allExpanded[item.id] = true;
    });
    setExpandedGroups(allExpanded);
  };

  const collapseAll = () => {
    setExpandedGroups({});
  };

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
      newFrom = "2026-07-01";
      newTo = "2026-07-31";
    }
    setFromDate(newFrom);
    setToDate(newTo);
  };

  // Trigger Display Report Action
  const handleDisplayReport = () => {
    setIsDisplayLoading(true);
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    setToastMessage(`Trial Balance refreshed for period ${fromDate} to ${toDate}.`);
    setTimeout(() => {
      setIsDisplayLoading(false);
    }, 350);
  };

  // Filtered & Sorted Trial Balance Data
  const filteredData = useMemo(() => {
    return sampleTrialBalanceData
      .filter((item) => {
        // Level Filters
        if (item.level === "group" && !showGroup) return false;
        if (item.level === "ledger" && !showLedger) return false;
        if (item.level === "sub-ledger" && !showSubLedger) return false;

        // Suppress Zero Transactions Filter
        if (suppressZero) {
          const totalActivity =
            item.openingDr +
            item.openingCr +
            item.transDr +
            item.transCr +
            item.closingDr +
            item.closingCr;
          if (totalActivity === 0) return false;
        }

        // Search Query Filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchesName = item.name.toLowerCase().includes(query);
          const matchesCode = item.code.toLowerCase().includes(query);
          if (!matchesName && !matchesCode) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (orderBy === "name") return a.name.localeCompare(b.name);
        if (orderBy === "acGroup") return a.code.localeCompare(b.code);
        return a.seqNo - b.seqNo;
      });
  }, [showGroup, showLedger, showSubLedger, suppressZero, searchQuery, orderBy]);

  // Grand Totals Calculation
  const grandTotals = useMemo(() => {
    const topLevelGroups = filteredData.filter(
      (item) => item.level === "group" && !item.parentId
    );

    const initial = {
      openingDr: 0,
      openingCr: 0,
      transDr: 0,
      transCr: 0,
      closingDr: 0,
      closingCr: 0,
    };

    if (topLevelGroups.length > 0) {
      return topLevelGroups.reduce((acc, curr) => {
        acc.openingDr += curr.openingDr;
        acc.openingCr += curr.openingCr;
        acc.transDr += curr.transDr;
        acc.transCr += curr.transCr;
        acc.closingDr += curr.closingDr;
        acc.closingCr += curr.closingCr;
        return acc;
      }, initial);
    }

    return filteredData
      .filter((item) => item.level === "ledger")
      .reduce((acc, curr) => {
        acc.openingDr += curr.openingDr;
        acc.openingCr += curr.openingCr;
        acc.transDr += curr.transDr;
        acc.transCr += curr.transCr;
        acc.closingDr += curr.closingDr;
        acc.closingCr += curr.closingCr;
        return acc;
      }, initial);
  }, [filteredData]);

  // Check if trial balance is in balance
  const isBalanced =
    grandTotals.closingDr === grandTotals.closingCr &&
    grandTotals.openingDr === grandTotals.openingCr;

  // Active filter count for pill badge
  const activeFiltersCount =
    (!showGroup ? 1 : 0) +
    (!showLedger ? 1 : 0) +
    (!showSubLedger ? 1 : 0) +
    (suppressZero ? 1 : 0) +
    (searchQuery ? 1 : 0);

  // Helper for Group Category Color Badges
  const getCategoryBadgeClass = (code: string) => {
    if (code.startsWith("1")) return "bg-emerald-50 text-emerald-800 border-emerald-200";
    if (code.startsWith("2")) return "bg-purple-50 text-purple-800 border-purple-200";
    if (code.startsWith("3")) return "bg-blue-50 text-blue-800 border-blue-200";
    if (code.startsWith("4")) return "bg-amber-50 text-amber-800 border-amber-200";
    if (code.startsWith("5")) return "bg-rose-50 text-rose-800 border-rose-200";
    return "bg-slate-100 text-slate-800 border-slate-200";
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
      "ACCOUNT CODE",
      "ACCOUNT NAME",
      "LEVEL TYPE",
      "OPENING DEBIT (INR)",
      "OPENING CREDIT (INR)",
      "TRANSACTIONS DEBIT (INR)",
      "TRANSACTIONS CREDIT (INR)",
      "CLOSING DEBIT (INR)",
      "CLOSING CREDIT (INR)",
    ];

    const dataRows = filteredData.map((item) => [
      item.code,
      item.name,
      item.level.toUpperCase(),
      item.openingDr || 0,
      item.openingCr || 0,
      item.transDr || 0,
      item.transCr || 0,
      item.closingDr || 0,
      item.closingCr || 0,
    ]);

    // Grand Totals Row
    dataRows.push([
      "TOTALS",
      "GRAND TOTAL",
      "SUMMARY",
      grandTotals.openingDr,
      grandTotals.openingCr,
      grandTotals.transDr,
      grandTotals.transCr,
      grandTotals.closingDr,
      grandTotals.closingCr,
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
    link.setAttribute("download", `PMS_Trial_Balance_Report_${appliedFromDate}_to_${appliedToDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Shared Filter Form Controls Component
  const FilterFormContent = () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
      {/* Box 1: Levels & Suppress Zero */}
      <div className="lg:col-span-4 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200 space-y-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-emerald-600" />
          Display Levels
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700">
          <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 cursor-pointer hover:border-slate-300">
            <input
              type="checkbox"
              checked={showGroup}
              onChange={(e) => setShowGroup(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span>Group</span>
          </label>

          <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 cursor-pointer hover:border-slate-300">
            <input
              type="checkbox"
              checked={showLedger}
              onChange={(e) => setShowLedger(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span>Ledger</span>
          </label>

          <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 cursor-pointer hover:border-slate-300">
            <input
              type="checkbox"
              checked={showSubLedger}
              onChange={(e) => setShowSubLedger(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span>Sub Ledger</span>
          </label>

          <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 cursor-pointer hover:border-slate-300">
            <input
              type="checkbox"
              checked={suppressZero}
              onChange={(e) => setSuppressZero(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span>Suppress Zero Trn</span>
          </label>
        </div>
      </div>

      {/* Box 2: Column Selection */}
      <div className="lg:col-span-4 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200 space-y-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
          Columns to Display
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700">
          <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 cursor-pointer hover:border-slate-300">
            <input
              type="checkbox"
              checked={showOpening}
              onChange={(e) => setShowOpening(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span>Opening Balance</span>
          </label>

          <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 cursor-pointer hover:border-slate-300">
            <input
              type="checkbox"
              checked={showTransactions}
              onChange={(e) => setShowTransactions(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span>Transactions</span>
          </label>

          <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 cursor-pointer hover:border-slate-300">
            <input
              type="checkbox"
              checked={showClosing}
              onChange={(e) => setShowClosing(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span>Closing Balance</span>
          </label>

          <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 cursor-pointer hover:border-slate-300">
            <input
              type="checkbox"
              checked={showCompanyHeading}
              onChange={(e) => setShowCompanyHeading(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span>Company Heading</span>
          </label>

          <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 cursor-pointer hover:border-slate-300 col-span-2 sm:col-span-1">
            <input
              type="checkbox"
              checked={showDiff}
              onChange={(e) => setShowDiff(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span>Transaction Diff</span>
          </label>
        </div>
      </div>

      {/* Box 3: Date Range & Order By */}
      <div className="lg:col-span-4 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200 space-y-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-emerald-600" />
          Period &amp; Sorting
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
                "flex-1 rounded-lg py-1 text-[11px] font-semibold transition-all border cursor-pointer",
                datePreset === p.id
                  ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Dates Input Row & Display Button */}
        <div className="flex flex-wrap items-end gap-2 pt-0.5">
          <FormField label="From Date" className="flex-1 min-w-[125px]">
            <FODatePicker
              value={fromDate}
              onChange={(val) => setFromDate(val)}
            />
          </FormField>

          <FormField label="To Date" className="flex-1 min-w-[125px]">
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

        {/* Sorting Selection (Touch Friendly) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pt-1 text-xs text-slate-700">
          <span className="font-bold text-slate-600 text-[11px] uppercase tracking-wider">Order By:</span>
          <div className="flex flex-wrap items-center gap-1.5 font-medium">
            {[
              { id: "seqNo", label: "Seq. No" },
              { id: "acGroup", label: "AC Group" },
              { id: "name", label: "Ledger Name" },
            ].map((opt) => {
              const active = orderBy === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setOrderBy(opt.id as any)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer select-none",
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
      eyebrow="Accounts &amp; Financial Reports"
      title="Trial Balance Report"
      description="Interactive summary of General Ledger debit and credit balances with group hierarchy drill-down."
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={expandAll}
            className="rounded-lg text-xs font-semibold bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs hidden sm:inline-flex cursor-pointer"
          >
            <Maximize2 className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Expand All
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={collapseAll}
            className="rounded-lg text-xs font-semibold bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs hidden sm:inline-flex cursor-pointer"
          >
            <Minimize2 className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Collapse
          </Button>

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
            Export
          </Button>
        </div>
      }
      wrapChildren={false}
    >
      {/* FrontOffice Search & Action Toolbar */}
      <div className="mt-4 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[240px]">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search account name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8.5 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Desktop Filter Toggle Button */}
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
            <span>Report Controls</span>
            {activeFiltersCount > 0 && (
              <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                {activeFiltersCount}
              </span>
            )}
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
            {activeFiltersCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[9px] font-bold text-white">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>

        {/* Financial Year Badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200">
            <Calendar className="h-3.5 w-3.5 text-slate-600" />
            FY 2026 - 27
          </span>
        </div>
      </div>

      {/* Desktop Filter Panel */}
      {showFilters && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4 hidden md:block">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <SlidersHorizontal className="h-4 w-4" />
              </span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Report Parameters &amp; View Options
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

      {/* FrontOffice Drawer for Mobile Filters */}
      <Drawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        title="Report Controls & Filters"
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
              Apply Filters
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Standard Vertical KPI Cards Grid (F&B / Front Office Style) */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Card 1: Total Opening Balance */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Total Opening Balance
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 sm:h-8 sm:w-8">
              <Scale className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl truncate font-mono">
            {formatINR(grandTotals.openingDr)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs truncate font-mono">
            Dr: {formatINR(grandTotals.openingDr)} | Cr: {formatINR(grandTotals.openingCr)}
          </p>
        </Card>

        {/* Card 2: Total Period Activity */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Total Period Activity
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-700 sm:h-8 sm:w-8">
              <SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl truncate font-mono">
            {formatINR(grandTotals.transDr)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs truncate font-mono">
            Dr: {formatINR(grandTotals.transDr)} | Cr: {formatINR(grandTotals.transCr)}
          </p>
        </Card>

        {/* Card 3: Closing Balance Status */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Closing Trial Balance Status
            </p>
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-8 sm:w-8",
                isBalanced ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
              )}
            >
              {isBalanced ? (
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl truncate font-mono">
            {formatINR(grandTotals.closingDr)}
          </p>
          <p
            className={cn(
              "mt-0.5 text-[11px] sm:text-xs truncate font-semibold",
              isBalanced ? "text-emerald-700" : "text-rose-700"
            )}
          >
            {isBalanced ? "✓ Balanced — Dr & Cr match" : "⚠️ Discrepancy Found"}
          </p>
        </Card>
      </div>

      {/* Official Company Heading Block */}
      {showCompanyHeading && (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-xs">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
            Hotel & Resorts Private Limited
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            123 Grand Boulevard, City Center • GSTIN: 27AAAAA0000A1Z5
          </p>
          <div className="my-2.5 border-t border-slate-100 max-w-xs mx-auto" />
          <h2 className="text-xs font-bold tracking-widest text-emerald-800 uppercase">
            TRIAL BALANCE STATEMENT
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Period: <span className="font-semibold text-slate-700">{fromDate}</span> to <span className="font-semibold text-slate-700">{toDate}</span>
          </p>
        </div>
      )}

      {/* Main Section Card */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Scale className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Trial Balance Ledger Accounts
              </h2>
              <p className="text-xs text-slate-500">
                Click any group row to expand or collapse items.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {filteredData.length} accounts found
            </span>
          </div>
        </div>

        {/* Empty Search State */}
        {filteredData.length === 0 ? (
          <div className="py-12 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
            <Scale className="mx-auto h-8 w-8 text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No accounts match your search filters</p>
            <p className="text-xs text-slate-500 mt-1">Try clearing your search term or checking "Hide Zero Trns".</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setShowGroup(true);
                setShowLedger(true);
                setShowSubLedger(true);
              }}
              className="mt-3"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <>
            {/* MOBILE VIEW (Card Stack layout for small screens) */}
            <div className="space-y-3 md:hidden">
              {filteredData.map((item) => {
                const isGroup = item.level === "group";
                const isSubLedger = item.level === "sub-ledger";

                return (
                  <div
                    key={item.id}
                    onClick={() => isGroup && toggleExpand(item.id)}
                    className={cn(
                      "rounded-xl border border-slate-200 bg-white p-3.5 transition-all shadow-2xs",
                      isGroup && "bg-slate-50/90 border-slate-300 font-bold",
                      isSubLedger && "ml-4 border-l-2 border-l-emerald-500 bg-slate-50/30"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={cn(
                            "font-mono text-[10px] px-1.5 py-0.5 rounded border font-semibold shrink-0",
                            getCategoryBadgeClass(item.code)
                          )}
                        >
                          {item.code}
                        </span>
                        <span
                          className={cn(
                            "text-xs truncate",
                            isGroup
                              ? "font-bold text-slate-900"
                              : "font-semibold text-slate-800"
                          )}
                        >
                          {item.name}
                        </span>
                      </div>

                      {isGroup && (
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 text-slate-500 transition-transform",
                            expandedGroups[item.id] === false && "-rotate-90"
                          )}
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                      {showOpening && (
                        <div>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase">Opening</p>
                          <p className="font-mono font-medium text-slate-700">
                            {item.openingDr > 0 ? `Dr ${item.openingDr.toLocaleString("en-IN")}` : item.openingCr > 0 ? `Cr ${item.openingCr.toLocaleString("en-IN")}` : "-"}
                          </p>
                        </div>
                      )}

                      {showTransactions && (
                        <div>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase">Activity</p>
                          <p className="font-mono font-medium text-slate-700">
                            {item.transDr > 0 ? `Dr ${item.transDr.toLocaleString("en-IN")}` : item.transCr > 0 ? `Cr ${item.transCr.toLocaleString("en-IN")}` : "-"}
                          </p>
                        </div>
                      )}

                      {showClosing && (
                        <div>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase">Closing</p>
                          <p className="font-mono font-bold text-emerald-800">
                            {item.closingDr > 0 ? `Dr ${item.closingDr.toLocaleString("en-IN")}` : item.closingCr > 0 ? `Cr ${item.closingCr.toLocaleString("en-IN")}` : "-"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP VIEW (Full Balanced Table) */}
            <div className="w-full overflow-x-auto rounded-xl border border-slate-200 hidden md:block">
              <table className="w-full text-left text-xs border-collapse table-auto">
                {/* FrontOffice Multi-Tier Header */}
                <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th
                      rowSpan={2}
                      className="px-4 py-3 border-r border-slate-200 text-slate-800 text-[11px] font-bold uppercase tracking-wider min-w-[280px]"
                    >
                      Account Name &amp; Code
                    </th>

                    {showOpening && (
                      <th
                        colSpan={2}
                        className="px-3 py-1.5 text-center border-r border-slate-200 bg-slate-100/80 font-bold text-slate-800 text-[11px] uppercase tracking-wider"
                      >
                        Opening Balance
                      </th>
                    )}

                    {showTransactions && (
                      <th
                        colSpan={2}
                        className="px-3 py-1.5 text-center border-r border-slate-200 bg-slate-100/60 font-bold text-slate-800 text-[11px] uppercase tracking-wider"
                      >
                        Transaction Amounts
                      </th>
                    )}

                    {showClosing && (
                      <th
                        colSpan={2}
                        className="px-3 py-1.5 text-center border-r border-slate-200 bg-slate-100/80 font-bold text-slate-800 text-[11px] uppercase tracking-wider"
                      >
                        Closing Balance
                      </th>
                    )}

                    {showDiff && (
                      <th
                        rowSpan={2}
                        className="px-3 py-3 text-right font-bold text-slate-800 text-[11px] uppercase tracking-wider w-24"
                      >
                        Diff
                      </th>
                    )}
                  </tr>
                  <tr className="bg-slate-100/50 border-t border-slate-200">
                    {showOpening && (
                      <>
                        <th className="px-3 py-2 text-right border-r border-slate-200 w-28 text-slate-600 font-bold text-[10px] uppercase tracking-wider">
                          Dr
                        </th>
                        <th className="px-3 py-2 text-right border-r border-slate-200 w-28 text-slate-600 font-bold text-[10px] uppercase tracking-wider">
                          Cr
                        </th>
                      </>
                    )}
                    {showTransactions && (
                      <>
                        <th className="px-3 py-2 text-right border-r border-slate-200 w-28 text-slate-600 font-bold text-[10px] uppercase tracking-wider">
                          Dr
                        </th>
                        <th className="px-3 py-2 text-right border-r border-slate-200 w-28 text-slate-600 font-bold text-[10px] uppercase tracking-wider">
                          Cr
                        </th>
                      </>
                    )}
                    {showClosing && (
                      <>
                        <th className="px-3 py-2 text-right border-r border-slate-200 w-28 text-slate-600 font-bold text-[10px] uppercase tracking-wider">
                          Dr
                        </th>
                        <th className="px-3 py-2 text-right border-r border-slate-200 w-28 text-slate-600 font-bold text-[10px] uppercase tracking-wider">
                          Cr
                        </th>
                      </>
                    )}
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredData.map((item) => {
                    const isGroup = item.level === "group";
                    const isSubLedger = item.level === "sub-ledger";
                    const isExpanded = expandedGroups[item.id] !== false;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => isGroup && toggleExpand(item.id)}
                        className={cn(
                          "transition-colors hover:bg-slate-50/80 cursor-pointer select-none",
                          isGroup && "bg-slate-50/70 font-bold text-slate-900",
                          isSubLedger && "text-slate-600 text-[11px]"
                        )}
                      >
                        {/* Name Column */}
                        <td
                          className={cn(
                            "px-4 py-2.5 border-r border-slate-200 flex items-center gap-2",
                            isSubLedger ? "pl-10" : item.parentId ? "pl-7" : "pl-4"
                          )}
                        >
                          {isGroup && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(item.id);
                              }}
                              className="p-0.5 rounded hover:bg-slate-200 text-slate-500"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5 text-slate-600" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                              )}
                            </button>
                          )}

                          <span
                            className={cn(
                              "font-mono text-[11px] px-1.5 py-0.5 rounded border font-semibold shrink-0",
                              getCategoryBadgeClass(item.code)
                            )}
                          >
                            {item.code}
                          </span>

                          <span
                            className={cn(
                              isGroup
                                ? "font-bold text-slate-900"
                                : isSubLedger
                                ? "text-slate-600 font-normal"
                                : "font-semibold text-slate-800"
                            )}
                          >
                            {item.name}
                          </span>
                        </td>

                        {/* Opening Dr & Cr */}
                        {showOpening && (
                          <>
                            <td className="px-3 py-2.5 text-right font-mono border-r border-slate-100 w-28 whitespace-nowrap">
                              {item.openingDr > 0 ? item.openingDr.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "-"}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono border-r border-slate-200 w-28 whitespace-nowrap">
                              {item.openingCr > 0 ? item.openingCr.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "-"}
                            </td>
                          </>
                        )}

                        {/* Transaction Dr & Cr */}
                        {showTransactions && (
                          <>
                            <td className="px-3 py-2.5 text-right font-mono border-r border-slate-100 w-28 whitespace-nowrap">
                              {item.transDr > 0 ? item.transDr.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "-"}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono border-r border-slate-200 w-28 whitespace-nowrap">
                              {item.transCr > 0 ? item.transCr.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "-"}
                            </td>
                          </>
                        )}

                        {/* Closing Dr & Cr */}
                        {showClosing && (
                          <>
                            <td
                              className={cn(
                                "px-3 py-2.5 text-right font-mono border-r border-slate-100 w-28 whitespace-nowrap",
                                isGroup ? "font-bold text-slate-900" : "font-medium text-slate-800"
                              )}
                            >
                              {item.closingDr > 0 ? item.closingDr.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "-"}
                            </td>
                            <td
                              className={cn(
                                "px-3 py-2.5 text-right font-mono border-r border-slate-200 w-28 whitespace-nowrap",
                                isGroup ? "font-bold text-slate-900" : "font-medium text-slate-800"
                              )}
                            >
                              {item.closingCr > 0 ? item.closingCr.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "-"}
                            </td>
                          </>
                        )}

                        {showDiff && (
                          <td className="px-3 py-2.5 text-right font-mono text-slate-500 w-24 whitespace-nowrap">
                            0.00
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>

                {/* Grand Totals Footer */}
                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900 sticky bottom-0">
                  <tr>
                    <td className="px-4 py-3 border-r border-slate-200 text-slate-900">
                      GRAND TOTAL
                    </td>

                    {showOpening && (
                      <>
                        <td className="px-3 py-3 text-right font-mono border-r border-slate-200 text-emerald-800 whitespace-nowrap">
                          {grandTotals.openingDr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-3 text-right font-mono border-r border-slate-200 text-emerald-800 whitespace-nowrap">
                          {grandTotals.openingCr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </>
                    )}

                    {showTransactions && (
                      <>
                        <td className="px-3 py-3 text-right font-mono border-r border-slate-200 text-emerald-800 whitespace-nowrap">
                          {grandTotals.transDr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-3 text-right font-mono border-r border-slate-200 text-emerald-800 whitespace-nowrap">
                          {grandTotals.transCr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </>
                    )}

                    {showClosing && (
                      <>
                        <td className="px-3 py-3 text-right font-mono border-r border-slate-200 text-emerald-800 whitespace-nowrap">
                          {grandTotals.closingDr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-3 text-right font-mono border-r border-slate-200 text-emerald-800 whitespace-nowrap">
                          {grandTotals.closingCr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </>
                    )}

                    {showDiff && (
                      <td className="px-3 py-3 text-right font-mono text-slate-700 whitespace-nowrap">
                        0.00
                      </td>
                    )}
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </section>
    </ModulePageShell>
  );
}
