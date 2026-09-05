"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Printer,
  Download,
  Search,
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
  LayoutGrid,
  ChevronDown,
  ChevronRight,
  Receipt,
  PieChart,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import {
  FormField,
  Drawer,
  FODatePicker,
  formatINR,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import { samplePLSummary } from "@/app/data/accounts/profitLossData";
import { cn } from "@/lib/utils";

export function ProfitLossView() {
  // Filters Panel / Mobile Drawer Toggle
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // View Style: Horizontal (T-Account) vs Vertical (Statement)
  const [viewStyle, setViewStyle] = useState<"horizontal" | "vertical">("horizontal");

  // View Checkboxes
  const [displayLedger, setDisplayLedger] = useState(true);
  const [filterInactive, setFilterInactive] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [showGroup, setShowGroup] = useState(true);
  const [showCompanyHeading, setShowCompanyHeading] = useState(true);
  const [plNewFormat, setPlNewFormat] = useState(false);

  // Filter & Search Controls
  const [fromDate, setFromDate] = useState("2026-04-01");
  const [toDate, setToDate] = useState("2027-03-31");
  const [appliedFromDate, setAppliedFromDate] = useState("2026-04-01");
  const [appliedToDate, setAppliedToDate] = useState("2027-03-31");
  const [datePreset, setDatePreset] = useState("fy26");
  const [sortOn, setSortOn] = useState<"seqNo" | "acId">("seqNo");

  const [isDisplayLoading, setIsDisplayLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Expanded sub-items state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    directIncome: true,
    indirectExp: true,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const expandAll = () => {
    setExpandedSections({
      directIncome: true,
      indirectExp: true,
    });
  };

  const collapseAll = () => {
    setExpandedSections({
      directIncome: false,
      indirectExp: false,
    });
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
    setToastMessage(`Profit & Loss Statement refreshed for period ${fromDate} to ${toDate}.`);
    setTimeout(() => {
      setIsDisplayLoading(false);
    }, 350);
  };

  const pl = samplePLSummary;
  const totalRevenue = pl.directIncome + pl.indirectIncome;
  const totalExpenses = pl.openingStock + pl.directExpenses + pl.costOfOperations + pl.indirectExpenses - pl.closingStock;
  const profitMargin = ((pl.netProfit / totalRevenue) * 100).toFixed(1);

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

    const headers = ["SECTION", "LINE ITEM", "EXPENDITURE (INR)", "INCOME (INR)"];

    const rows: (string | number)[][] = [
      ["TRADING ACCOUNT", "OPENING STOCK", pl.openingStock, ""],
      ["TRADING ACCOUNT", "PURCHASES", pl.purchases, ""],
      ["TRADING ACCOUNT", "DIRECT EXPENSES", pl.directExpenses, ""],
      ["TRADING ACCOUNT", "COST OF OPERATIONS", pl.costOfOperations, ""],
      ["TRADING ACCOUNT", "GROSS PROFIT C/O", pl.grossProfit, ""],
      ["TRADING ACCOUNT", "SALES", "", pl.sales],
      ["TRADING ACCOUNT", "DIRECT INCOME (TOTAL)", "", pl.directIncome],
      ["TRADING ACCOUNT - DIRECT INCOME", "ROOM REVENUE", "", pl.roomRevenue],
      ["TRADING ACCOUNT - DIRECT INCOME", "FOOD REVENUE", "", pl.foodRevenue],
      ["TRADING ACCOUNT - DIRECT INCOME", "BEVERAGE REVENUE", "", pl.beverageRevenue],
      ["TRADING ACCOUNT - DIRECT INCOME", "OTHER REVENUE", "", pl.otherRevenue],
      ["TRADING ACCOUNT", "CLOSING STOCK", "", pl.closingStock],
      ["TRADING TOTALS", "TOTAL TRADING TRN", pl.totalTradingExp, pl.totalTradingIncome],
      ["NET PROFIT ACCOUNT", "INDIRECT EXPENSES (TOTAL)", pl.indirectExpenses, ""],
      ["NET PROFIT ACCOUNT - EXPENSES", "REPAIR & MAINT. EXPENSES", pl.repairMaint, ""],
      ["NET PROFIT ACCOUNT - EXPENSES", "ADMIN & GENERAL EXPENSES", pl.adminGeneral, ""],
      ["NET PROFIT ACCOUNT - EXPENSES", "OPERATING EXPENSE", pl.operatingExp, ""],
      ["NET PROFIT ACCOUNT - EXPENSES", "HEAT LIGHT POWER", pl.heatLightPower, ""],
      ["NET PROFIT ACCOUNT - EXPENSES", "PAYROLL & STAFF EXPENSES", pl.payrollStaff, ""],
      ["NET PROFIT ACCOUNT - EXPENSES", "SALES & MARKETING EXPENSES", pl.salesMarketing, ""],
      ["NET PROFIT ACCOUNT", "NET PROFIT", pl.netProfit, ""],
      ["NET PROFIT ACCOUNT", "GROSS PROFIT B/F", "", pl.grossProfitBf],
      ["NET PROFIT ACCOUNT", "INDIRECT INCOME", "", pl.indirectIncome],
      ["NET PROFIT TOTALS", "TOTAL NET PROFIT TRN", pl.totalNetProfitExp, pl.totalNetProfitIncome],
    ];

    const csvContent =
      "\uFEFF" +
      [headers, ...rows]
        .map((row) => row.map(escapeCSV).join(","))
        .join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `PMS_Profit_Loss_Statement_${appliedFromDate}_to_${appliedToDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Shared Filter Form Controls Component
  const FilterFormContent = () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
      {/* Box 1: View Style & Display Checkboxes */}
      <div className="lg:col-span-4 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/70 space-y-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <LayoutGrid className="h-3.5 w-3.5 text-emerald-600" />
          Format & View Options
        </p>

        {/* Style Selector */}
        <div className="flex items-center gap-1.5 pb-1">
          <span className="text-[11px] font-semibold text-slate-500">Style:</span>
          <div className="flex items-center gap-1 flex-1">
            <button
              type="button"
              onClick={() => setViewStyle("horizontal")}
              className={cn(
                "flex-1 rounded-lg py-1 px-2 text-[11px] font-semibold transition-all border cursor-pointer select-none",
                viewStyle === "horizontal"
                  ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
              )}
            >
              Horizontal (T-Account)
            </button>
            <button
              type="button"
              onClick={() => setViewStyle("vertical")}
              className={cn(
                "flex-1 rounded-lg py-1 px-2 text-[11px] font-semibold transition-all border cursor-pointer select-none",
                viewStyle === "vertical"
                  ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
              )}
            >
              Vertical List
            </button>
          </div>
        </div>

        {/* Checkbox Options Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700">
          <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={displayLedger}
              onChange={(e) => setDisplayLedger(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Display Ledger</span>
          </label>

          <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={filterInactive}
              onChange={(e) => setFilterInactive(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Filter Inactive</span>
          </label>

          <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={showDetails}
              onChange={(e) => setShowDetails(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Details</span>
          </label>

          <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={showCompanyHeading}
              onChange={(e) => setShowCompanyHeading(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Company Heading</span>
          </label>

          <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 cursor-pointer hover:border-emerald-300 col-span-2">
            <input
              type="checkbox"
              checked={plNewFormat}
              onChange={(e) => setPlNewFormat(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>P & L New Format</span>
          </label>
        </div>
      </div>

      {/* Box 2: Period & Sorting */}
      <div className="lg:col-span-8 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/70 space-y-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-emerald-600" />
          Financial Period & Action
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

        {/* Sorting Touch Pills */}
        <div className="flex items-center justify-between pt-1 text-xs text-slate-700">
          <span className="font-bold text-slate-600 text-[11px] uppercase tracking-wider">Sort On:</span>
          <div className="flex items-center gap-1.5 font-medium">
            {[
              { id: "seqNo", label: "Seq. No" },
              { id: "acId", label: "AC ID" },
            ].map((opt) => {
              const active = sortOn === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSortOn(opt.id as any)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-1 text-xs font-semibold transition-all cursor-pointer select-none",
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
      eyebrow="Accounts &amp; Financial Statements"
      title="Profit &amp; Loss Statement"
      description="Comprehensive Trading and Net Profit statement with dual Horizontal (T-Account) and Vertical presentation formats."
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
            Export CSV
          </Button>
        </div>
      }
      wrapChildren={false}
    >
      {/* Top Controls Toolbar Bar */}
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
            <span>{showFilters ? "Hide Report Options" : "Report Parameters & Options"}</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                showFilters && "rotate-180"
              )}
            />
          </Button>

          {/* Format Toggle Pill */}
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100/80 p-0.5">
            <button
              type="button"
              onClick={() => setViewStyle("horizontal")}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer select-none",
                viewStyle === "horizontal"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Horizontal (T-Account)
            </button>
            <button
              type="button"
              onClick={() => setViewStyle("vertical")}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer select-none",
                viewStyle === "vertical"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Vertical List
            </button>
          </div>

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

        {/* Financial Year Badge & Format Indicator */}
        <div className="flex items-center gap-2">
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

      {/* Mobile Drawer */}
      <Drawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        title="Profit &amp; Loss Options"
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
              Apply Options
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Standard Vertical KPI Cards Grid (F&B / Front Office Style) */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Card 1: Total Operating Revenue */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Total Operating Revenue
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 sm:h-8 sm:w-8">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl truncate font-mono">
            {formatINR(totalRevenue)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs truncate">
            Room, Food, Beverage &amp; Indirect Income
          </p>
        </Card>

        {/* Card 2: Total Cost & Expenses */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Total Cost &amp; Expenses
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-700 sm:h-8 sm:w-8">
              <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl truncate font-mono">
            {formatINR(totalExpenses)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs truncate">
            Direct Costs + Indirect Operating Expenses
          </p>
        </Card>

        {/* Card 3: Net Operating Profit */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Net Operating Profit
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 sm:h-8 sm:w-8">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl truncate font-mono">
            {formatINR(pl.netProfit)}
          </p>
          <p className="mt-0.5 text-[11px] text-emerald-700 font-semibold sm:text-xs truncate">
            ✓ Profit Margin: {profitMargin}%
          </p>
        </Card>
      </div>

      {/* Official Company Heading Block */}
      {showCompanyHeading && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5 text-center shadow-2xs">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
            Hotel &amp; Resorts Private Limited
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            123 Grand Boulevard, City Center • GSTIN: 27AAAAA0000A1Z5
          </p>
          <div className="my-2.5 border-t border-slate-100 max-w-xs mx-auto" />
          <h2 className="text-xs font-bold tracking-widest text-emerald-800 uppercase">
            PROFIT &amp; LOSS STATEMENT
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            For the Period: <span className="font-semibold text-slate-700">{appliedFromDate}</span> to <span className="font-semibold text-slate-700">{appliedToDate}</span>
          </p>
        </div>
      )}

      {/* Horizontal T-Account Presentation View */}
      {viewStyle === "horizontal" ? (
        <div className="space-y-4">
          {/* SECTION 1: TRADING ACCOUNT (Gross Profit Statement) */}
          <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs">
            <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">1</span>
                Trading &amp; Operating Gross Profit Account
              </h2>
              <span className="text-[11px] text-slate-500 font-semibold">T-Account Format</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Column: Expenditure */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 font-bold text-[11px] uppercase tracking-wider text-slate-700 flex justify-between">
                  <span>Expenditure</span>
                  <span>Amount (₹)</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="flex justify-between px-4 py-2 font-semibold text-slate-800 hover:bg-slate-50">
                    <span>OPENING STOCK</span>
                    <span className="font-mono">{formatINR(pl.openingStock)}</span>
                  </div>

                  <div className="flex justify-between px-4 py-2 font-semibold text-slate-800 hover:bg-slate-50">
                    <span>PURCHASES</span>
                    <span className="font-mono">{formatINR(pl.purchases)}</span>
                  </div>

                  <div className="flex justify-between px-4 py-2 font-semibold text-slate-800 hover:bg-slate-50">
                    <span>DIRECT EXPENSES</span>
                    <span className="font-mono">{formatINR(pl.directExpenses)}</span>
                  </div>

                  <div className="flex justify-between px-4 py-2 font-semibold text-slate-800 hover:bg-slate-50">
                    <span>COST OF OPERATIONS</span>
                    <span className="font-mono">{formatINR(pl.costOfOperations)}</span>
                  </div>

                  <div className="flex justify-between px-4 py-2.5 font-bold text-emerald-800 bg-emerald-50/70 border-t border-emerald-200">
                    <span>GROSS PROFIT C/O</span>
                    <span className="text-emerald-900 font-mono font-bold">{formatINR(pl.grossProfit)}</span>
                  </div>

                  <div className="flex justify-between px-4 py-2.5 font-bold text-xs uppercase bg-slate-100 text-slate-900 border-t-2 border-slate-300">
                    <span>TOTAL EXPENDITURE</span>
                    <span className="font-mono">{formatINR(pl.totalTradingExp)}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Income */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 font-bold text-[11px] uppercase tracking-wider text-slate-700 flex justify-between">
                  <span>Income</span>
                  <span>Amount (₹)</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="flex justify-between px-4 py-2 font-semibold text-slate-800 hover:bg-slate-50">
                    <span>SALES</span>
                    <span className="font-mono">{formatINR(pl.sales)}</span>
                  </div>

                  {/* Direct Income Group Dropdown */}
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleSection("directIncome")}
                      className="w-full flex items-center justify-between px-4 py-2 font-bold text-slate-900 hover:bg-slate-50 text-left cursor-pointer"
                    >
                      <span className="flex items-center gap-1">
                        {expandedSections.directIncome ? (
                          <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                        )}
                        DIRECT INCOME
                      </span>
                      <span className="font-mono">{formatINR(pl.directIncome)}</span>
                    </button>

                    {expandedSections.directIncome && (
                      <div className="bg-slate-50/70 pl-8 pr-4 py-1.5 space-y-1.5 text-xs text-slate-700 border-y border-slate-200/60 font-medium">
                        <div className="flex justify-between hover:text-slate-900">
                          <span>ROOM REVENUE</span>
                          <span className="font-mono">{formatINR(pl.roomRevenue)}</span>
                        </div>
                        <div className="flex justify-between hover:text-slate-900">
                          <span>FOOD REVENUE</span>
                          <span className="font-mono">{formatINR(pl.foodRevenue)}</span>
                        </div>
                        <div className="flex justify-between hover:text-slate-900">
                          <span>BEVERAGE REVENUE</span>
                          <span className="font-mono">{formatINR(pl.beverageRevenue)}</span>
                        </div>
                        <div className="flex justify-between hover:text-slate-900">
                          <span>OTHER REVENUE</span>
                          <span className="font-mono">{formatINR(pl.otherRevenue)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between px-4 py-2 font-semibold text-slate-800 hover:bg-slate-50">
                    <span>CLOSING STOCK</span>
                    <span className="font-mono">{formatINR(pl.closingStock)}</span>
                  </div>

                  {/* Empty Spacer Row for Equal Column Balancing */}
                  <div className="px-4 py-2 text-transparent select-none">&nbsp;</div>

                  <div className="flex justify-between px-4 py-2.5 font-bold text-xs uppercase bg-slate-100 text-slate-900 border-t-2 border-slate-300">
                    <span>TOTAL INCOME</span>
                    <span className="font-mono">{formatINR(pl.totalTradingIncome)}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: NET PROFIT ACCOUNT (Indirect Expenses & Income Statement) */}
          <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs">
            <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-900 text-white text-[11px] font-bold">2</span>
                Net Profit &amp; Loss Account
              </h2>
              <span className="text-[11px] text-slate-500 font-semibold">Indirect Expenses &amp; Income</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Column: Indirect Expenses */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 font-bold text-[11px] uppercase tracking-wider text-slate-700 flex justify-between">
                  <span>Expenditure</span>
                  <span>Amount (₹)</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {/* Indirect Expenses Sub Breakdown */}
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleSection("indirectExp")}
                      className="w-full flex items-center justify-between px-4 py-2 font-bold text-slate-900 hover:bg-slate-50 text-left cursor-pointer"
                    >
                      <span className="flex items-center gap-1">
                        {expandedSections.indirectExp ? (
                          <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                        )}
                        INDIRECT EXPENSES
                      </span>
                      <span className="font-mono">{formatINR(pl.indirectExpenses)}</span>
                    </button>

                    {expandedSections.indirectExp && (
                      <div className="bg-slate-50/70 pl-8 pr-4 py-2 space-y-1.5 text-xs text-slate-700 border-y border-slate-200/60 font-medium">
                        <div className="flex justify-between hover:text-slate-900">
                          <span>REPAIR &amp; MAINT. EXPENSES</span>
                          <span className="font-mono">{formatINR(pl.repairMaint)}</span>
                        </div>
                        <div className="flex justify-between hover:text-slate-900">
                          <span>ADMIN &amp; GENERAL EXPENSES</span>
                          <span className="font-mono">{formatINR(pl.adminGeneral)}</span>
                        </div>
                        <div className="flex justify-between hover:text-slate-900">
                          <span>OPERATING EXPENSE</span>
                          <span className="font-mono">{formatINR(pl.operatingExp)}</span>
                        </div>
                        <div className="flex justify-between hover:text-slate-900">
                          <span>HEAT LIGHT POWER</span>
                          <span className="font-mono">{formatINR(pl.heatLightPower)}</span>
                        </div>
                        <div className="flex justify-between hover:text-slate-900">
                          <span>PAYROLL &amp; STAFF EXPENSES</span>
                          <span className="font-mono">{formatINR(pl.payrollStaff)}</span>
                        </div>
                        <div className="flex justify-between hover:text-slate-900">
                          <span>SALES &amp; MARKETING EXPENSES</span>
                          <span className="font-mono">{formatINR(pl.salesMarketing)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between px-4 py-2.5 font-bold text-emerald-800 bg-emerald-50/70 border-t border-emerald-200">
                    <span className="uppercase">NET PROFIT</span>
                    <span className="text-emerald-900 font-mono font-bold text-sm">{formatINR(pl.netProfit)}</span>
                  </div>

                  <div className="flex justify-between px-4 py-2.5 font-bold text-xs uppercase bg-slate-100 text-slate-900 border-t-2 border-slate-300">
                    <span>TOTAL EXPENDITURE</span>
                    <span className="font-mono">{formatINR(pl.totalNetProfitExp)}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Gross Profit B/F & Indirect Income */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 font-bold text-[11px] uppercase tracking-wider text-slate-700 flex justify-between">
                    <span>Income</span>
                    <span>Amount (₹)</span>
                  </div>
                  <div className="divide-y divide-slate-100 text-xs">
                    <div className="flex justify-between px-4 py-2.5 font-semibold text-slate-800 hover:bg-slate-50">
                      <span>GROSS PROFIT B/F</span>
                      <span className="font-mono">{formatINR(pl.grossProfitBf)}</span>
                    </div>

                    <div className="flex justify-between px-4 py-2.5 font-semibold text-slate-800 hover:bg-slate-50">
                      <span>INDIRECT INCOME</span>
                      <span className="font-mono">{formatINR(pl.indirectIncome)}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 divide-y divide-slate-100 text-xs">
                  <div className="flex justify-between px-4 py-2.5 font-bold text-xs uppercase bg-slate-100 text-slate-900 border-t-2 border-slate-300">
                    <span>TOTAL INCOME</span>
                    <span className="font-mono">{formatINR(pl.totalNetProfitIncome)}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : (
        /* Vertical List Presentation View */
        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Vertical Statement Format
            </h2>
            <span className="text-xs font-semibold text-slate-600">Financial Period Summary</span>
          </div>

          <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden text-xs shadow-2xs">
            {/* 1. Operating Revenue */}
            <div className="p-3.5 bg-emerald-50/40">
              <div className="flex justify-between font-bold text-slate-900 uppercase">
                <span>1. Operating Revenue &amp; Income</span>
                <span className="font-mono">{formatINR(pl.directIncome)}</span>
              </div>
              <div className="pl-4 pt-2 space-y-1.5 text-slate-700 font-medium">
                <div className="flex justify-between"><span>Room Revenue</span><span className="font-mono">{formatINR(pl.roomRevenue)}</span></div>
                <div className="flex justify-between"><span>Food Revenue</span><span className="font-mono">{formatINR(pl.foodRevenue)}</span></div>
                <div className="flex justify-between"><span>Beverage Revenue</span><span className="font-mono">{formatINR(pl.beverageRevenue)}</span></div>
                <div className="flex justify-between"><span>Other Revenue</span><span className="font-mono">{formatINR(pl.otherRevenue)}</span></div>
              </div>
            </div>

            {/* 2. Direct Costs */}
            <div className="p-3.5 bg-slate-50/70">
              <div className="flex justify-between font-bold text-slate-900 uppercase">
                <span>2. Direct Costs &amp; Operating Expenses</span>
                <span className="font-mono">{formatINR(pl.directExpenses + pl.costOfOperations + pl.openingStock - pl.closingStock)}</span>
              </div>
              <div className="pl-4 pt-2 space-y-1.5 text-slate-700 font-medium">
                <div className="flex justify-between"><span>Opening Stock</span><span className="font-mono">{formatINR(pl.openingStock)}</span></div>
                <div className="flex justify-between"><span>Direct Expenses</span><span className="font-mono">{formatINR(pl.directExpenses)}</span></div>
                <div className="flex justify-between"><span>Cost of Operations</span><span className="font-mono">{formatINR(pl.costOfOperations)}</span></div>
                <div className="flex justify-between text-emerald-700"><span>Less: Closing Stock</span><span className="font-mono font-semibold">({formatINR(pl.closingStock)})</span></div>
              </div>
            </div>

            {/* 3. Gross Operating Profit */}
            <div className="p-3.5 bg-emerald-50 flex justify-between font-bold text-sm text-emerald-950 uppercase border-y border-emerald-200">
              <span>3. Gross Operating Profit (1 - 2)</span>
              <span className="font-mono font-bold text-emerald-900">{formatINR(pl.grossProfit)}</span>
            </div>

            {/* 4. Indirect Expenses */}
            <div className="p-3.5 bg-slate-50/70">
              <div className="flex justify-between font-bold text-slate-900 uppercase">
                <span>4. Indirect Expenses</span>
                <span className="font-mono">{formatINR(pl.indirectExpenses)}</span>
              </div>
              <div className="pl-4 pt-2 space-y-1.5 text-slate-700 font-medium">
                <div className="flex justify-between"><span>Repair &amp; Maint. Expenses</span><span className="font-mono">{formatINR(pl.repairMaint)}</span></div>
                <div className="flex justify-between"><span>Admin &amp; General Expenses</span><span className="font-mono">{formatINR(pl.adminGeneral)}</span></div>
                <div className="flex justify-between"><span>Operating Expense</span><span className="font-mono">{formatINR(pl.operatingExp)}</span></div>
                <div className="flex justify-between"><span>Heat Light Power</span><span className="font-mono">{formatINR(pl.heatLightPower)}</span></div>
                <div className="flex justify-between"><span>Payroll &amp; Staff Expenses</span><span className="font-mono">{formatINR(pl.payrollStaff)}</span></div>
                <div className="flex justify-between"><span>Sales &amp; Marketing Expenses</span><span className="font-mono">{formatINR(pl.salesMarketing)}</span></div>
              </div>
            </div>

            {/* 5. Indirect Income */}
            <div className="p-3.5 bg-white">
              <div className="flex justify-between font-bold text-slate-900 uppercase">
                <span>5. Indirect Income</span>
                <span className="font-mono">{formatINR(pl.indirectIncome)}</span>
              </div>
            </div>

            {/* 6. Net Profit Final */}
            <div className="p-4 bg-slate-900 text-white flex justify-between font-bold text-base uppercase">
              <span>Net Profit (3 - 4 + 5)</span>
              <span className="font-mono font-bold text-emerald-400">{formatINR(pl.netProfit)}</span>
            </div>
          </div>
        </section>
      )}
    </ModulePageShell>
  );
}
