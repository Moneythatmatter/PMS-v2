"use client";

import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
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
  LayoutGrid,
  ListFilter,
  Building2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  TextInput,
  StatMiniCard,
  Drawer,
  AlertBanner,
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
            className="h-8 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-3.5 shadow-xs shrink-0 disabled:opacity-75 cursor-pointer"
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
                    "flex items-center gap-2 rounded-xl border px-3 py-1 text-xs font-semibold transition-all cursor-pointer select-none",
                    active
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600/20 shadow-2xs"
                      : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-slate-50"
                  )}
                >
                  <span
                    className={cn(
                      "h-3.5 w-3.5 rounded-full border flex items-center justify-center transition-all shrink-0",
                      active
                        ? "border-emerald-600 bg-emerald-600"
                        : "border-slate-300 bg-white"
                    )}
                  >
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
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
      eyebrow="Accounts & Financial Statements"
      title="Profit & Loss Statement"
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
            className="rounded-xl text-xs font-medium bg-white shadow-xs hidden sm:inline-flex"
          >
            <Maximize2 className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Expand All
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={collapseAll}
            className="rounded-xl text-xs font-medium bg-white shadow-xs hidden sm:inline-flex"
          >
            <Minimize2 className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Collapse
          </Button>

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
            onClick={() => alert("Profit & Loss Statement exported to CSV successfully.")}
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
            <span>{showFilters ? "Hide Report Options" : "Report Parameters & Options"}</span>
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

        {/* Financial Year Badge & Format Indicator */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-700" />
            Format: {viewStyle === "horizontal" ? "Horizontal (T-Account)" : "Vertical List"}
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
                Report Parameters & View Options
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
        title="Profit & Loss Options"
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

      {/* KPI Cards Grid */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatMiniCard
          label="Total Operating Revenue"
          value={formatINR(totalRevenue)}
          sublabel="Room, Food, Beverage & Indirect Income"
          accent="#0284c7"
          icon={TrendingUp}
        />
        <StatMiniCard
          label="Total Cost & Expenses"
          value={formatINR(totalExpenses)}
          sublabel="Direct Costs + Indirect Operating Expenses"
          accent="#e11d48"
          icon={TrendingDown}
        />
        <StatMiniCard
          label="Net Operating Profit"
          value={formatINR(pl.netProfit)}
          sublabel={`✓ Profit Margin: ${profitMargin}%`}
          accent="#16a34a"
          icon={CheckCircle2}
        />
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
            PROFIT & LOSS STATEMENT
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
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
            <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 text-emerald-800 text-xs">1</span>
                Trading & Operating Gross Profit Account
              </h2>
              <span className="text-xs text-slate-500 font-semibold">T-Account Format</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Column: Expenditure */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-amber-100/70 border-b border-slate-200 px-4 py-2 font-bold text-xs uppercase tracking-wider text-amber-900 flex justify-between">
                  <span>Expenditure</span>
                  <span>Amount (₹)</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="flex justify-between px-4 py-2 font-bold text-blue-900 hover:bg-slate-50">
                    <span>OPENING STOCK</span>
                    <span>{formatINR(pl.openingStock)}</span>
                  </div>

                  <div className="flex justify-between px-4 py-2 font-semibold text-emerald-700 hover:bg-slate-50">
                    <span>PURCHASES</span>
                    <span>{formatINR(pl.purchases)}</span>
                  </div>

                  <div className="flex justify-between px-4 py-2 font-bold text-emerald-800 hover:bg-slate-50">
                    <span>DIRECT EXPENSES</span>
                    <span>{formatINR(pl.directExpenses)}</span>
                  </div>

                  <div className="flex justify-between px-4 py-2 font-bold text-blue-900 hover:bg-slate-50">
                    <span>COST OF OPERATIONS</span>
                    <span>{formatINR(pl.costOfOperations)}</span>
                  </div>

                  <div className="flex justify-between px-4 py-2.5 font-bold text-emerald-800 bg-emerald-50/60 border-t border-emerald-200">
                    <span>GROSS PROFIT C/O</span>
                    <span className="text-emerald-900 font-black">{formatINR(pl.grossProfit)}</span>
                  </div>

                  <div className="flex justify-between px-4 py-2.5 font-black text-xs uppercase bg-slate-100 text-slate-900 border-t-2 border-slate-300">
                    <span>TOTAL EXPENDITURE</span>
                    <span>{formatINR(pl.totalTradingExp)}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Income */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-amber-100/70 border-b border-slate-200 px-4 py-2 font-bold text-xs uppercase tracking-wider text-amber-900 flex justify-between">
                  <span>Income</span>
                  <span>Amount (₹)</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="flex justify-between px-4 py-2 font-bold text-emerald-800 hover:bg-slate-50">
                    <span>SALES</span>
                    <span>{formatINR(pl.sales)}</span>
                  </div>

                  {/* Direct Income Group Dropdown */}
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleSection("directIncome")}
                      className="w-full flex items-center justify-between px-4 py-2 font-bold text-emerald-700 hover:bg-slate-50 text-left"
                    >
                      <span className="flex items-center gap-1">
                        {expandedSections.directIncome ? (
                          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                        )}
                        DIRECT INCOME
                      </span>
                      <span>{formatINR(pl.directIncome)}</span>
                    </button>

                    {expandedSections.directIncome && (
                      <div className="bg-slate-50/70 pl-8 pr-4 py-1.5 space-y-1.5 text-xs text-blue-900 border-y border-slate-200/60 font-semibold">
                        <div className="flex justify-between hover:text-emerald-800">
                          <span>ROOM REVENUE</span>
                          <span>{formatINR(pl.roomRevenue)}</span>
                        </div>
                        <div className="flex justify-between hover:text-emerald-800">
                          <span>FOOD REVENUE</span>
                          <span>{formatINR(pl.foodRevenue)}</span>
                        </div>
                        <div className="flex justify-between hover:text-emerald-800">
                          <span>BEVERAGE REVENUE</span>
                          <span>{formatINR(pl.beverageRevenue)}</span>
                        </div>
                        <div className="flex justify-between hover:text-emerald-800">
                          <span>OTHER REVENUE</span>
                          <span>{formatINR(pl.otherRevenue)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between px-4 py-2 font-bold text-blue-900 hover:bg-slate-50">
                    <span>CLOSING STOCK</span>
                    <span>{formatINR(pl.closingStock)}</span>
                  </div>

                  {/* Empty Spacer Row for Equal Column Balancing */}
                  <div className="px-4 py-2 text-transparent select-none">&nbsp;</div>

                  <div className="flex justify-between px-4 py-2.5 font-black text-xs uppercase bg-slate-100 text-slate-900 border-t-2 border-slate-300">
                    <span>TOTAL INCOME</span>
                    <span>{formatINR(pl.totalTradingIncome)}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: NET PROFIT ACCOUNT (Indirect Expenses & Income Statement) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
            <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-700 text-white text-xs">2</span>
                Net Profit & Loss Account
              </h2>
              <span className="text-xs text-slate-500 font-semibold">Indirect Expenses & Income</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Column: Indirect Expenses */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-amber-100/70 border-b border-slate-200 px-4 py-2 font-bold text-xs uppercase tracking-wider text-amber-900 flex justify-between">
                  <span>Expenditure</span>
                  <span>Amount (₹)</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {/* Indirect Expenses Sub Breakdown */}
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleSection("indirectExp")}
                      className="w-full flex items-center justify-between px-4 py-2 font-bold text-emerald-700 hover:bg-slate-50 text-left"
                    >
                      <span className="flex items-center gap-1">
                        {expandedSections.indirectExp ? (
                          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                        )}
                        INDIRECT EXPENSES
                      </span>
                      <span>{formatINR(pl.indirectExpenses)}</span>
                    </button>

                    {expandedSections.indirectExp && (
                      <div className="bg-slate-50/70 pl-8 pr-4 py-2 space-y-1.5 text-xs text-blue-900 border-y border-slate-200/60 font-semibold">
                        <div className="flex justify-between hover:text-emerald-800">
                          <span>REPAIR & MAINT. EXPENSES</span>
                          <span>{formatINR(pl.repairMaint)}</span>
                        </div>
                        <div className="flex justify-between hover:text-emerald-800">
                          <span>ADMIN & GENERAL EXPENSES</span>
                          <span>{formatINR(pl.adminGeneral)}</span>
                        </div>
                        <div className="flex justify-between hover:text-emerald-800">
                          <span>OPERATING EXPENSE</span>
                          <span>{formatINR(pl.operatingExp)}</span>
                        </div>
                        <div className="flex justify-between hover:text-emerald-800">
                          <span>HEAT LIGHT POWER</span>
                          <span>{formatINR(pl.heatLightPower)}</span>
                        </div>
                        <div className="flex justify-between hover:text-emerald-800">
                          <span>PAYROLL & STAFF EXPENSES</span>
                          <span>{formatINR(pl.payrollStaff)}</span>
                        </div>
                        <div className="flex justify-between hover:text-emerald-800">
                          <span>SALES & MARKETING EXPENSES</span>
                          <span>{formatINR(pl.salesMarketing)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between px-4 py-2.5 font-bold text-emerald-800 bg-emerald-50/80 border-t border-emerald-200">
                    <span className="uppercase">NET PROFIT</span>
                    <span className="text-emerald-900 font-black text-sm">{formatINR(pl.netProfit)}</span>
                  </div>

                  <div className="flex justify-between px-4 py-2.5 font-black text-xs uppercase bg-slate-100 text-slate-900 border-t-2 border-slate-300">
                    <span>TOTAL EXPENDITURE</span>
                    <span>{formatINR(pl.totalNetProfitExp)}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Gross Profit B/F & Indirect Income */}
              <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="bg-amber-100/70 border-b border-slate-200 px-4 py-2 font-bold text-xs uppercase tracking-wider text-amber-900 flex justify-between">
                    <span>Income</span>
                    <span>Amount (₹)</span>
                  </div>
                  <div className="divide-y divide-slate-100 text-xs">
                    <div className="flex justify-between px-4 py-2.5 font-bold text-blue-900 hover:bg-slate-50">
                      <span>GROSS PROFIT B/F</span>
                      <span>{formatINR(pl.grossProfitBf)}</span>
                    </div>

                    <div className="flex justify-between px-4 py-2.5 font-bold text-emerald-700 hover:bg-slate-50">
                      <span>INDIRECT INCOME</span>
                      <span>{formatINR(pl.indirectIncome)}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 divide-y divide-slate-100 text-xs">
                  <div className="flex justify-between px-4 py-2.5 font-black text-xs uppercase bg-slate-100 text-slate-900 border-t-2 border-slate-300">
                    <span>TOTAL INCOME</span>
                    <span>{formatINR(pl.totalNetProfitIncome)}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : (
        /* Vertical List Presentation View */
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Vertical Statement Format
            </h2>
            <span className="text-xs font-semibold text-emerald-700">Financial Period Summary</span>
          </div>

          <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden text-xs">
            {/* 1. Operating Revenue */}
            <div className="p-3 bg-emerald-50/50">
              <div className="flex justify-between font-bold text-emerald-900 uppercase">
                <span>1. Operating Revenue & Income</span>
                <span>{formatINR(pl.directIncome)}</span>
              </div>
              <div className="pl-4 pt-2 space-y-1 text-slate-700 font-medium">
                <div className="flex justify-between"><span>Room Revenue</span><span>{formatINR(pl.roomRevenue)}</span></div>
                <div className="flex justify-between"><span>Food Revenue</span><span>{formatINR(pl.foodRevenue)}</span></div>
                <div className="flex justify-between"><span>Beverage Revenue</span><span>{formatINR(pl.beverageRevenue)}</span></div>
                <div className="flex justify-between"><span>Other Revenue</span><span>{formatINR(pl.otherRevenue)}</span></div>
              </div>
            </div>

            {/* 2. Direct Costs */}
            <div className="p-3 bg-slate-50">
              <div className="flex justify-between font-bold text-rose-900 uppercase">
                <span>2. Direct Costs & Operating Expenses</span>
                <span>{formatINR(pl.directExpenses + pl.costOfOperations + pl.openingStock - pl.closingStock)}</span>
              </div>
              <div className="pl-4 pt-2 space-y-1 text-slate-700 font-medium">
                <div className="flex justify-between"><span>Opening Stock</span><span>{formatINR(pl.openingStock)}</span></div>
                <div className="flex justify-between"><span>Direct Expenses</span><span>{formatINR(pl.directExpenses)}</span></div>
                <div className="flex justify-between"><span>Cost of Operations</span><span>{formatINR(pl.costOfOperations)}</span></div>
                <div className="flex justify-between text-emerald-700"><span>Less: Closing Stock</span><span>({formatINR(pl.closingStock)})</span></div>
              </div>
            </div>

            {/* 3. Gross Operating Profit */}
            <div className="p-3 bg-emerald-100/70 flex justify-between font-black text-sm text-emerald-950 uppercase border-y-2 border-emerald-300">
              <span>3. Gross Operating Profit (1 - 2)</span>
              <span>{formatINR(pl.grossProfit)}</span>
            </div>

            {/* 4. Indirect Expenses */}
            <div className="p-3 bg-slate-50">
              <div className="flex justify-between font-bold text-rose-900 uppercase">
                <span>4. Indirect Expenses</span>
                <span>{formatINR(pl.indirectExpenses)}</span>
              </div>
              <div className="pl-4 pt-2 space-y-1 text-slate-700 font-medium">
                <div className="flex justify-between"><span>Repair & Maint. Expenses</span><span>{formatINR(pl.repairMaint)}</span></div>
                <div className="flex justify-between"><span>Admin & General Expenses</span><span>{formatINR(pl.adminGeneral)}</span></div>
                <div className="flex justify-between"><span>Operating Expense</span><span>{formatINR(pl.operatingExp)}</span></div>
                <div className="flex justify-between"><span>Heat Light Power</span><span>{formatINR(pl.heatLightPower)}</span></div>
                <div className="flex justify-between"><span>Payroll & Staff Expenses</span><span>{formatINR(pl.payrollStaff)}</span></div>
                <div className="flex justify-between"><span>Sales & Marketing Expenses</span><span>{formatINR(pl.salesMarketing)}</span></div>
              </div>
            </div>

            {/* 5. Indirect Income */}
            <div className="p-3 bg-white">
              <div className="flex justify-between font-bold text-emerald-800 uppercase">
                <span>5. Indirect Income</span>
                <span>{formatINR(pl.indirectIncome)}</span>
              </div>
            </div>

            {/* 6. Net Profit Final */}
            <div className="p-4 bg-emerald-700 text-white flex justify-between font-black text-base uppercase">
              <span>Net Profit (3 - 4 + 5)</span>
              <span>{formatINR(pl.netProfit)}</span>
            </div>
          </div>
        </section>
      )}
    </ModulePageShell>
  );
}
