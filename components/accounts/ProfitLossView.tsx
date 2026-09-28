"use client";

import React, { useMemo, useState } from "react";
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
  AlertCircle,
  Filter,
  Loader2,
  LayoutGrid,
  ChevronDown,
  ChevronRight,
  Receipt,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import {
  FormField,
  Drawer,
  FODatePicker,
  formatINR,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import { accCompanyService, accReportService, type PnlSection } from "@/services/accounts";
import { useAccLookups, useAccQuery, fyStartIso, todayIso, formatDate } from "@/components/accounts/accountsApi";
import { cn } from "@/lib/utils";

type SectionName = PnlSection["section"];
const SECTION_NAMES: SectionName[] = ["Direct Income", "Indirect Income", "Direct Expenses", "Indirect Expenses"];

function addMonths(iso: string, months: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setMonth(d.getMonth() + months);
  d.setDate(d.getDate() - 1);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function ProfitLossView() {
  // Filters Panel / Mobile Drawer Toggle
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // View Style: Horizontal (T-Account) vs Vertical (Statement)
  const [viewStyle, setViewStyle] = useState<"horizontal" | "vertical">("horizontal");

  // View Checkboxes
  const [displayLedger, setDisplayLedger] = useState(true);
  const [showComparison, setShowComparison] = useState(false);
  const [showCompanyHeading, setShowCompanyHeading] = useState(true);

  // Filter & Search Controls
  const fyStart = fyStartIso();
  const [fromDate, setFromDate] = useState(fyStart);
  const [toDate, setToDate] = useState(todayIso());
  const [appliedFromDate, setAppliedFromDate] = useState(fyStart);
  const [appliedToDate, setAppliedToDate] = useState(todayIso());
  const [datePreset, setDatePreset] = useState("fy");
  const [sortOn, setSortOn] = useState<"seqNo" | "acId">("seqNo");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { lookups } = useAccLookups();
  const currentFy = useMemo(() => {
    const fys = lookups?.fiscalYears ?? [];
    return (
      fys.find((f) => f.startDate <= appliedToDate && f.endDate >= appliedToDate) ??
      fys.find((f) => f.isCurrent) ??
      null
    );
  }, [lookups, appliedToDate]);

  const report = useAccQuery(
    () => accReportService.profitLoss({ from: appliedFromDate, to: appliedToDate }),
    [appliedFromDate, appliedToDate]
  );

  const companyQuery = useAccQuery(
    () => (showCompanyHeading ? accCompanyService.list() : Promise.resolve([])),
    [showCompanyHeading]
  );
  const company = companyQuery.data?.find((c) => c.status === "Active") ?? companyQuery.data?.[0] ?? null;

  // Expanded sub-items state (sections are expanded unless collapsed)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const isExpanded = (key: SectionName) => expandedSections[key] !== false;

  const toggleSection = (key: SectionName) => {
    setExpandedSections((prev) => ({ ...prev, [key]: prev[key] === false }));
  };

  const expandAll = () => {
    setExpandedSections({});
  };

  const collapseAll = () => {
    setExpandedSections(Object.fromEntries(SECTION_NAMES.map((s) => [s, false])));
  };

  // Preset Date Range Selector
  const handleDatePreset = (preset: string) => {
    setDatePreset(preset);
    const today = todayIso();
    let newFrom = fyStart;
    let newTo = today;
    if (preset === "q1") {
      newTo = addMonths(fyStart, 3);
    } else if (preset === "thisMonth") {
      newFrom = `${today.slice(0, 7)}-01`;
    }
    setFromDate(newFrom);
    setToDate(newTo);
  };

  // Trigger Display Report Action
  const handleDisplayReport = () => {
    if (toDate < fromDate) {
      setToastMessage("'To' date must be on or after 'From' date.");
      return;
    }
    if (fromDate === appliedFromDate && toDate === appliedToDate) {
      void report.reload();
    } else {
      setAppliedFromDate(fromDate);
      setAppliedToDate(toDate);
    }
  };

  const sections = useMemo(() => {
    const map = new Map<SectionName, PnlSection>();
    for (const name of SECTION_NAMES) {
      const s = report.data?.sections.find((x) => x.section === name) ?? {
        section: name,
        accounts: [],
        total: 0,
        previousTotal: 0,
      };
      const accounts =
        sortOn === "acId" ? [...s.accounts].sort((a, b) => a.code.localeCompare(b.code)) : s.accounts;
      map.set(name, { ...s, accounts });
    }
    return map;
  }, [report.data, sortOn]);
  const sec = (name: SectionName) => sections.get(name)!;

  const summary = report.data?.summary;
  const totalRevenue = summary?.totalRevenue ?? 0;
  const totalExpenses = summary?.totalExpenses ?? 0;
  const netProfit = summary?.netProfit ?? 0;
  const grossProfit = summary?.grossProfit ?? 0;
  const directIncome = sec("Direct Income").total;
  const directExpenses = sec("Direct Expenses").total;
  const indirectIncome = sec("Indirect Income").total;
  const indirectExpenses = sec("Indirect Expenses").total;

  // T-account balancing figures
  const tradingTotal = Math.max(directIncome, directExpenses);
  const netLeftTotal = indirectExpenses + Math.max(-grossProfit, 0) + Math.max(netProfit, 0);
  const netRightTotal = Math.max(grossProfit, 0) + indirectIncome + Math.max(-netProfit, 0);

  const hasData = SECTION_NAMES.some((n) => sec(n).accounts.length > 0);

  // ─────────────────────────────────────────────────────────────
  // CLEAN EXCEL-READY CSV EXPORT
  // ─────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (!report.data) {
      setToastMessage("Nothing to export yet — load the report first.");
      return;
    }
    const escapeCSV = (val: string | number | null | undefined): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return `"${str}"`;
    };

    const headers = ["SECTION", "ACCOUNT CODE", "LINE ITEM", "CURRENT PERIOD (INR)", "PREVIOUS PERIOD (INR)"];

    const rows: (string | number)[][] = [];
    for (const name of SECTION_NAMES) {
      const s = sec(name);
      for (const a of s.accounts) {
        rows.push([name.toUpperCase(), a.code, a.name, a.amount, a.previousAmount]);
      }
      rows.push([name.toUpperCase(), "", `TOTAL ${name.toUpperCase()}`, s.total, s.previousTotal]);
    }
    rows.push(["SUMMARY", "", "GROSS PROFIT", grossProfit, ""]);
    rows.push(["SUMMARY", "", "TOTAL REVENUE", totalRevenue, ""]);
    rows.push(["SUMMARY", "", "TOTAL EXPENSES", totalExpenses, ""]);
    rows.push(["SUMMARY", "", "NET PROFIT", netProfit, summary?.previousNetProfit ?? ""]);

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

  // Ledger breakdown lines for a section
  const renderLedgerLines = (name: SectionName, className: string) => {
    const s = sec(name);
    if (!displayLedger || !isExpanded(name)) return null;
    return (
      <div className={className}>
        {s.accounts.length === 0 ? (
          <div className="text-slate-400 italic">No transactions</div>
        ) : (
          s.accounts.map((a) => (
            <div key={a.accountId} className="flex justify-between gap-3 hover:text-slate-900">
              <span className="truncate">
                <span className="font-mono text-[10px] text-slate-400 mr-1.5">{a.code}</span>
                {a.name.toUpperCase()}
              </span>
              <span className="font-mono shrink-0">
                {formatINR(a.amount)}
                {showComparison && (
                  <span className="ml-2 text-[10px] text-slate-400">PY {formatINR(a.previousAmount)}</span>
                )}
              </span>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderSectionHeader = (name: SectionName, label: string) => {
    const s = sec(name);
    return (
      <button
        type="button"
        onClick={() => toggleSection(name)}
        className="w-full flex items-center justify-between px-4 py-2 font-bold text-slate-900 hover:bg-slate-50 text-left cursor-pointer"
      >
        <span className="flex items-center gap-1">
          {displayLedger &&
            (isExpanded(name) ? (
              <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
            ))}
          {label}
        </span>
        <span className="font-mono">
          {formatINR(s.total)}
          {showComparison && (
            <span className="ml-2 text-[10px] font-semibold text-slate-400">PY {formatINR(s.previousTotal)}</span>
          )}
        </span>
      </button>
    );
  };

  // Shared Filter Form Controls Component
  const filterFormContent = (
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
              checked={showComparison}
              onChange={(e) => setShowComparison(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Prev. Year</span>
          </label>

          <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 cursor-pointer hover:border-emerald-300 col-span-2">
            <input
              type="checkbox"
              checked={showCompanyHeading}
              onChange={(e) => setShowCompanyHeading(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Company Heading</span>
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
            { id: "fy", label: "FY to Date" },
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
            disabled={report.loading}
            className="h-8 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-3.5 shadow-2xs shrink-0 disabled:opacity-75 cursor-pointer rounded-lg"
          >
            {report.loading ? (
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
                  onClick={() => setSortOn(opt.id as typeof sortOn)}
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
            disabled={!report.data}
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
            {currentFy ? currentFy.fiscalYearName : `${formatDate(appliedFromDate)} – ${formatDate(appliedToDate)}`}
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
          {filterFormContent}
        </div>
      )}

      {/* Mobile Drawer */}
      <Drawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        title="Profit &amp; Loss Options"
      >
        <div className="p-4 space-y-4">
          {filterFormContent}
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

      {report.loading && !report.data ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-white text-xs text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          Loading profit &amp; loss statement…
        </div>
      ) : report.error ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-rose-200 bg-rose-50/40">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-500 mb-2" />
          <p className="text-sm font-semibold text-slate-700">Could not load profit &amp; loss statement</p>
          <p className="text-xs text-slate-500 mt-1">{report.error}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => void report.reload()} className="mt-3">
            Retry
          </Button>
        </div>
      ) : (
        <>
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
                Direct {formatINR(directIncome)} · Indirect {formatINR(indirectIncome)}
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
                  {netProfit >= 0 ? "Net Operating Profit" : "Net Operating Loss"}
                </p>
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-8 sm:w-8",
                    netProfit >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                  )}
                >
                  {netProfit >= 0 ? (
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  )}
                </span>
              </div>
              <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl truncate font-mono">
                {formatINR(netProfit)}
              </p>
              <p
                className={cn(
                  "mt-0.5 text-[11px] font-semibold sm:text-xs truncate",
                  netProfit >= 0 ? "text-emerald-700" : "text-rose-700"
                )}
              >
                Net Margin: {(summary?.netMargin ?? 0).toFixed(1)}% · PY {formatINR(summary?.previousNetProfit ?? 0)}
              </p>
            </Card>
          </div>

          {/* Official Company Heading Block */}
          {showCompanyHeading && (
            <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5 text-center shadow-2xs">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                {company ? company.legalName || company.tradeName : companyQuery.loading ? "Loading company…" : "Company not configured"}
              </h1>
              {company && (
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {[company.addressLine1, company.city, company.state].filter(Boolean).join(", ")}
                  {company.gstNumber ? ` • GSTIN: ${company.gstNumber}` : ""}
                </p>
              )}
              <div className="my-2.5 border-t border-slate-100 max-w-xs mx-auto" />
              <h2 className="text-xs font-bold tracking-widest text-emerald-800 uppercase">
                PROFIT &amp; LOSS STATEMENT
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                For the Period: <span className="font-semibold text-slate-700">{formatDate(report.data?.from ?? appliedFromDate)}</span> to <span className="font-semibold text-slate-700">{formatDate(report.data?.to ?? appliedToDate)}</span>
              </p>
              {showComparison && report.data && (
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Compared with {formatDate(report.data.compareFrom)} to {formatDate(report.data.compareTo)}
                </p>
              )}
            </div>
          )}

          {!hasData && (
            <div className="mb-4 py-10 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
              <Receipt className="mx-auto h-8 w-8 text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No income or expense postings in this period</p>
              <p className="text-xs text-slate-500 mt-1">
                Try a different date range. Only posted vouchers are included.
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
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 font-bold text-[11px] uppercase tracking-wider text-slate-700 flex justify-between">
                        <span>Expenditure</span>
                        <span>Amount (₹)</span>
                      </div>
                      <div className="divide-y divide-slate-100 text-xs">
                        <div>
                          {renderSectionHeader("Direct Expenses", "DIRECT EXPENSES")}
                          {renderLedgerLines(
                            "Direct Expenses",
                            "bg-slate-50/70 pl-8 pr-4 py-1.5 space-y-1.5 text-xs text-slate-700 border-y border-slate-200/60 font-medium"
                          )}
                        </div>

                        {grossProfit >= 0 && (
                          <div className="flex justify-between px-4 py-2.5 font-bold text-emerald-800 bg-emerald-50/70 border-t border-emerald-200">
                            <span>GROSS PROFIT C/O</span>
                            <span className="text-emerald-900 font-mono font-bold">{formatINR(grossProfit)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between px-4 py-2.5 font-bold text-xs uppercase bg-slate-100 text-slate-900 border-t-2 border-slate-300">
                      <span>TOTAL EXPENDITURE</span>
                      <span className="font-mono">{formatINR(tradingTotal)}</span>
                    </div>
                  </div>

                  {/* Right Column: Income */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 font-bold text-[11px] uppercase tracking-wider text-slate-700 flex justify-between">
                        <span>Income</span>
                        <span>Amount (₹)</span>
                      </div>
                      <div className="divide-y divide-slate-100 text-xs">
                        <div>
                          {renderSectionHeader("Direct Income", "DIRECT INCOME")}
                          {renderLedgerLines(
                            "Direct Income",
                            "bg-slate-50/70 pl-8 pr-4 py-1.5 space-y-1.5 text-xs text-slate-700 border-y border-slate-200/60 font-medium"
                          )}
                        </div>

                        {grossProfit < 0 && (
                          <div className="flex justify-between px-4 py-2.5 font-bold text-rose-800 bg-rose-50/70 border-t border-rose-200">
                            <span>GROSS LOSS C/O</span>
                            <span className="text-rose-900 font-mono font-bold">{formatINR(-grossProfit)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between px-4 py-2.5 font-bold text-xs uppercase bg-slate-100 text-slate-900 border-t-2 border-slate-300">
                      <span>TOTAL INCOME</span>
                      <span className="font-mono">{formatINR(tradingTotal)}</span>
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
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 font-bold text-[11px] uppercase tracking-wider text-slate-700 flex justify-between">
                        <span>Expenditure</span>
                        <span>Amount (₹)</span>
                      </div>
                      <div className="divide-y divide-slate-100 text-xs">
                        {grossProfit < 0 && (
                          <div className="flex justify-between px-4 py-2.5 font-semibold text-slate-800 hover:bg-slate-50">
                            <span>GROSS LOSS B/F</span>
                            <span className="font-mono">{formatINR(-grossProfit)}</span>
                          </div>
                        )}

                        {/* Indirect Expenses Sub Breakdown */}
                        <div>
                          {renderSectionHeader("Indirect Expenses", "INDIRECT EXPENSES")}
                          {renderLedgerLines(
                            "Indirect Expenses",
                            "bg-slate-50/70 pl-8 pr-4 py-2 space-y-1.5 text-xs text-slate-700 border-y border-slate-200/60 font-medium"
                          )}
                        </div>

                        {netProfit >= 0 && (
                          <div className="flex justify-between px-4 py-2.5 font-bold text-emerald-800 bg-emerald-50/70 border-t border-emerald-200">
                            <span className="uppercase">NET PROFIT</span>
                            <span className="text-emerald-900 font-mono font-bold text-sm">{formatINR(netProfit)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between px-4 py-2.5 font-bold text-xs uppercase bg-slate-100 text-slate-900 border-t-2 border-slate-300">
                      <span>TOTAL EXPENDITURE</span>
                      <span className="font-mono">{formatINR(netLeftTotal)}</span>
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
                        {grossProfit >= 0 && (
                          <div className="flex justify-between px-4 py-2.5 font-semibold text-slate-800 hover:bg-slate-50">
                            <span>GROSS PROFIT B/F</span>
                            <span className="font-mono">{formatINR(grossProfit)}</span>
                          </div>
                        )}

                        <div>
                          {renderSectionHeader("Indirect Income", "INDIRECT INCOME")}
                          {renderLedgerLines(
                            "Indirect Income",
                            "bg-slate-50/70 pl-8 pr-4 py-2 space-y-1.5 text-xs text-slate-700 border-y border-slate-200/60 font-medium"
                          )}
                        </div>

                        {netProfit < 0 && (
                          <div className="flex justify-between px-4 py-2.5 font-bold text-rose-800 bg-rose-50/70 border-t border-rose-200">
                            <span className="uppercase">NET LOSS</span>
                            <span className="text-rose-900 font-mono font-bold text-sm">{formatINR(-netProfit)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-slate-200 divide-y divide-slate-100 text-xs">
                      <div className="flex justify-between px-4 py-2.5 font-bold text-xs uppercase bg-slate-100 text-slate-900 border-t-2 border-slate-300">
                        <span>TOTAL INCOME</span>
                        <span className="font-mono">{formatINR(netRightTotal)}</span>
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
                    <span className="font-mono">{formatINR(directIncome)}</span>
                  </div>
                  {renderLedgerLines("Direct Income", "pl-4 pt-2 space-y-1.5 text-slate-700 font-medium")}
                </div>

                {/* 2. Direct Costs */}
                <div className="p-3.5 bg-slate-50/70">
                  <div className="flex justify-between font-bold text-slate-900 uppercase">
                    <span>2. Direct Costs &amp; Operating Expenses</span>
                    <span className="font-mono">{formatINR(directExpenses)}</span>
                  </div>
                  {renderLedgerLines("Direct Expenses", "pl-4 pt-2 space-y-1.5 text-slate-700 font-medium")}
                </div>

                {/* 3. Gross Operating Profit */}
                <div
                  className={cn(
                    "p-3.5 flex justify-between font-bold text-sm uppercase border-y",
                    grossProfit >= 0
                      ? "bg-emerald-50 text-emerald-950 border-emerald-200"
                      : "bg-rose-50 text-rose-950 border-rose-200"
                  )}
                >
                  <span>3. Gross Operating {grossProfit >= 0 ? "Profit" : "Loss"} (1 - 2)</span>
                  <span className={cn("font-mono font-bold", grossProfit >= 0 ? "text-emerald-900" : "text-rose-900")}>
                    {formatINR(grossProfit)}
                  </span>
                </div>

                {/* 4. Indirect Expenses */}
                <div className="p-3.5 bg-slate-50/70">
                  <div className="flex justify-between font-bold text-slate-900 uppercase">
                    <span>4. Indirect Expenses</span>
                    <span className="font-mono">{formatINR(indirectExpenses)}</span>
                  </div>
                  {renderLedgerLines("Indirect Expenses", "pl-4 pt-2 space-y-1.5 text-slate-700 font-medium")}
                </div>

                {/* 5. Indirect Income */}
                <div className="p-3.5 bg-white">
                  <div className="flex justify-between font-bold text-slate-900 uppercase">
                    <span>5. Indirect Income</span>
                    <span className="font-mono">{formatINR(indirectIncome)}</span>
                  </div>
                  {renderLedgerLines("Indirect Income", "pl-4 pt-2 space-y-1.5 text-slate-700 font-medium")}
                </div>

                {/* 6. Net Profit Final */}
                <div className="p-4 bg-slate-900 text-white flex justify-between font-bold text-base uppercase">
                  <span>Net {netProfit >= 0 ? "Profit" : "Loss"} (3 - 4 + 5)</span>
                  <span className={cn("font-mono font-bold", netProfit >= 0 ? "text-emerald-400" : "text-rose-400")}>
                    {formatINR(netProfit)}
                  </span>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </ModulePageShell>
  );
}
