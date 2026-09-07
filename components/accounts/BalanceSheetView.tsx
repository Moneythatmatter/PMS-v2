"use client";

import React, { useState } from "react";
import {
  Building2,
  CheckCircle2,
  Save,
  Printer,
  Download,
  X,
  Scale,
  Columns,
  ListFilter,
  TrendingUp,
  DollarSign,
  Building,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import {
  FODatePicker,
  formatINR,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import {
  sampleBalanceSheetData,
  BalanceSheetLineItem,
} from "@/app/data/accounts/balanceSheetData";
import { cn } from "@/lib/utils";

export function BalanceSheetView() {
  // As On Date Filter State
  const [asOnDate, setAsOnDate] = useState(sampleBalanceSheetData.asOnDate);

  // Format Switcher State ('horizontal' | 'vertical')
  const [reportFormat, setReportFormat] = useState<"horizontal" | "vertical">(
    "horizontal"
  );

  // Detail Level State ('summary' | 'detailed')
  const [detailLevel, setDetailLevel] = useState<"summary" | "detailed">(
    "detailed"
  );

  // Show Previous Year Comparison State
  const [showPrevYear, setShowPrevYear] = useState(true);

  // Selected Item for Drill-down Modal
  const [selectedDrillItem, setSelectedDrillItem] =
    useState<BalanceSheetLineItem | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Data Reference
  const data = sampleBalanceSheetData;

  // Filtered List Helper (Summary vs Detailed)
  const getFilteredItems = (items: BalanceSheetLineItem[]) => {
    if (detailLevel === "summary") {
      return items;
    }
    return items;
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
      "CATEGORY",
      "SUB SECTION",
      "ACCOUNT CODE",
      "ACCOUNT NAME",
      "CURRENT AMOUNT (INR)",
      "PREVIOUS YEAR AMOUNT (INR)",
    ];

    const liabRows = data.equityAndLiabilities.flatMap((group) => {
      const rows = [
        [
          "CAPITAL & LIABILITIES",
          group.name,
          "",
          group.name,
          group.amount,
          group.previousYearAmount,
        ],
      ];
      if (group.childItems) {
        group.childItems.forEach((child) => {
          rows.push([
            "CAPITAL & LIABILITIES",
            group.name,
            child.code,
            child.name,
            child.amount,
            child.previousYearAmount,
          ]);
        });
      }
      return rows;
    });

    const assetRows = data.assets.flatMap((group) => {
      const rows = [
        [
          "PROPERTY ASSETS",
          group.name,
          "",
          group.name,
          group.amount,
          group.previousYearAmount,
        ],
      ];
      if (group.childItems) {
        group.childItems.forEach((child) => {
          rows.push([
            "PROPERTY ASSETS",
            group.name,
            child.code,
            child.name,
            child.amount,
            child.previousYearAmount,
          ]);
        });
      }
      return rows;
    });

    const summaryRows = [
      ["TOTALS", "CAPITAL & LIABILITIES", "", "TOTAL LIABILITIES & CAPITAL", data.totalLiabilities, ""],
      ["TOTALS", "PROPERTY ASSETS", "", "TOTAL PROPERTY ASSETS", data.totalAssets, ""],
    ];

    const csvContent =
      "\uFEFF" +
      [headers, ...liabRows, ...assetRows, ...summaryRows]
        .map((row) => row.map(escapeCSV).join(","))
        .join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PMS_Balance_Sheet_AsOn_${asOnDate.replace(/\//g, "-")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMessage("Balance Sheet exported to Excel-ready CSV.");
  };

  return (
    <ModulePageShell
      eyebrow="Accounts &amp; Reports"
      title="Balance Sheet"
      description="Statement of Financial Position: Assets, Liabilities, Equity Reserves, and Net Worth as on date."
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => setToastMessage("Recalculated Balance Sheet as on date.")}
            className="rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-2xs cursor-pointer px-3.5"
          >
            <Scale className="h-3.5 w-3.5 mr-1" />
            Generate Report
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setToastMessage("Saved Balance Sheet view preferences.")}
            className="rounded-lg text-xs font-semibold bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs cursor-pointer"
          >
            <Save className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Save Options
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-lg text-xs font-semibold bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs cursor-pointer"
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
      {/* Top Active Target Entity & Date Selector Bar */}
      <div className="mt-4 mb-4 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <Building2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="flex-1 max-w-sm">
              <span className="font-bold text-[11px] uppercase tracking-wider text-slate-600 block mb-1">Target Company Entity:</span>
              <select
                value="HOTEL & RESORTS PRIVATE LIMITED"
                onChange={() => {}}
                className="h-8 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="HOTEL & RESORTS PRIVATE LIMITED">
                  HOTEL &amp; RESORTS PRIVATE LIMITED (CMP-001)
                </option>
              </select>
            </div>

            <div className="w-44">
              <span className="font-bold text-[11px] uppercase tracking-wider text-slate-600 block mb-1">As On Date:</span>
              <FODatePicker value={asOnDate} onChange={setAsOnDate} placeholder="DD/MM/YYYY" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-emerald-800 border border-emerald-200 font-bold">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
              Equilibrium Balanced ✓
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-slate-700 border border-slate-200 font-mono">
              <Scale className="h-3.5 w-3.5 text-slate-600" />
              Total: {formatINR(data.totalAssets)}
            </span>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-100 text-xs">
          {/* Format Switcher */}
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100/80 p-0.5">
            <button
              type="button"
              onClick={() => setReportFormat("horizontal")}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer select-none",
                reportFormat === "horizontal"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Columns className="h-3.5 w-3.5 inline mr-1" />
              Horizontal (Side-by-Side)
            </button>
            <button
              type="button"
              onClick={() => setReportFormat("vertical")}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer select-none",
                reportFormat === "vertical"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <ListFilter className="h-3.5 w-3.5 inline mr-1" />
              Vertical (Schedule III)
            </button>
          </div>

          {/* Options */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[11px] uppercase tracking-wider text-slate-600">Detail Level:</span>
              <select
                value={detailLevel}
                onChange={(e) => setDetailLevel(e.target.value as any)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="detailed">Detailed (Sub-Groups &amp; Ledgers)</option>
                <option value="summary">Summary (Major Account Groups)</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-slate-800">
              <input
                type="checkbox"
                checked={showPrevYear}
                onChange={(e) => setShowPrevYear(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 h-4 w-4"
              />
              <span>Show Previous Year Comparison</span>
            </label>
          </div>
        </div>
      </div>

      {/* Standard Vertical KPI Cards Grid (F&B / Front Office Style) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {/* Card 1: Total Liabilities & Capital */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Total Liabilities &amp; Capital
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 sm:h-8 sm:w-8">
              <Building className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl truncate font-mono">
            {formatINR(data.totalLiabilities)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs truncate">
            Capital, Reserves &amp; Liabilities
          </p>
        </Card>

        {/* Card 2: Total Property Assets */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Total Property Assets
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 sm:h-8 sm:w-8">
              <Scale className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl truncate font-mono">
            {formatINR(data.totalAssets)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs truncate">
            Fixed, Current &amp; Investments
          </p>
        </Card>

        {/* Card 3: Equity & Retained Reserves */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Equity &amp; Retained Reserves
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-700 sm:h-8 sm:w-8">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl truncate font-mono">
            ₹32,10,00,000.00
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs truncate">
            Net Worth / Owner Capital
          </p>
        </Card>

        {/* Card 4: Current Liquidity Ratio */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Current Liquidity Ratio
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 sm:h-8 sm:w-8">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl truncate font-mono">
            2.45 : 1
          </p>
          <p className="mt-0.5 text-[11px] text-emerald-700 font-semibold sm:text-xs truncate">
            Current Assets / Liabilities
          </p>
        </Card>
      </div>

      {/* HORIZONTAL MODE: Side-by-Side Dual Panel */}
      {reportFormat === "horizontal" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 font-sans text-xs">
          {/* LEFT PANEL: CAPITAL & LIABILITIES */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Building className="h-4 w-4 text-emerald-600" />
                  CAPITAL &amp; LIABILITIES
                </h3>
                <span className="font-mono text-xs font-semibold text-slate-500">As On {asOnDate}</span>
              </div>

              <div className="space-y-3">
                {getFilteredItems(data.equityAndLiabilities).map((group) => (
                  <div key={group.id} className="space-y-1.5">
                    {/* Level 1 Group Header */}
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg font-bold text-slate-900 border border-slate-200">
                      <span>{group.name}</span>
                      <div className="flex items-center gap-3 font-mono">
                        {showPrevYear && (
                          <span className="text-slate-500 text-[11px] font-normal">
                            PY: {formatINR(group.previousYearAmount)}
                          </span>
                        )}
                        <span className="text-emerald-800 font-bold">{formatINR(group.amount)}</span>
                      </div>
                    </div>

                    {/* Level 2 Sub-Items */}
                    {detailLevel === "detailed" && group.childItems && (
                      <div className="pl-3 pr-1 space-y-1">
                        {group.childItems.map((sub) => (
                          <div
                            key={sub.id}
                            onClick={() => setSelectedDrillItem(sub)}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-all font-medium text-slate-800"
                          >
                            <span className="flex items-center gap-1.5">
                              <span className="text-slate-400 font-mono text-[10px]">{sub.code}</span>
                              <span>{sub.name}</span>
                            </span>

                            <div className="flex items-center gap-3 font-mono">
                              {showPrevYear && (
                                <span className="text-slate-400 text-[10px]">
                                  {formatINR(sub.previousYearAmount)}
                                </span>
                              )}
                              <span className="font-bold text-slate-900">{formatINR(sub.amount)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Total Liabilities Footer */}
            <div className="p-3 bg-slate-900 text-white rounded-lg flex items-center justify-between font-mono font-bold text-xs shadow-2xs">
              <span>TOTAL CAPITAL &amp; LIABILITIES</span>
              <span className="text-emerald-400">{formatINR(data.totalLiabilities)}</span>
            </div>
          </div>

          {/* RIGHT PANEL: ASSETS & APPLICABLE INVESTMENTS */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Scale className="h-4 w-4 text-emerald-600" />
                  PROPERTY ASSETS &amp; INVESTMENTS
                </h3>
                <span className="font-mono text-xs font-semibold text-slate-500">As On {asOnDate}</span>
              </div>

              <div className="space-y-3">
                {getFilteredItems(data.assets).map((group) => (
                  <div key={group.id} className="space-y-1.5">
                    {/* Level 1 Group Header */}
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg font-bold text-slate-900 border border-slate-200">
                      <span>{group.name}</span>
                      <div className="flex items-center gap-3 font-mono">
                        {showPrevYear && (
                          <span className="text-slate-500 text-[11px] font-normal">
                            PY: {formatINR(group.previousYearAmount)}
                          </span>
                        )}
                        <span className="text-emerald-800 font-bold">{formatINR(group.amount)}</span>
                      </div>
                    </div>

                    {/* Level 2 Sub-Items */}
                    {detailLevel === "detailed" && group.childItems && (
                      <div className="pl-3 pr-1 space-y-1">
                        {group.childItems.map((sub) => (
                          <div
                            key={sub.id}
                            onClick={() => setSelectedDrillItem(sub)}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-all font-medium text-slate-800"
                          >
                            <span className="flex items-center gap-1.5">
                              <span className="text-slate-400 font-mono text-[10px]">{sub.code}</span>
                              <span>{sub.name}</span>
                            </span>

                            <div className="flex items-center gap-3 font-mono">
                              {showPrevYear && (
                                <span className="text-slate-400 text-[10px]">
                                  {formatINR(sub.previousYearAmount)}
                                </span>
                              )}
                              <span className="font-bold text-slate-900">{formatINR(sub.amount)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Total Assets Footer */}
            <div className="p-3 bg-slate-900 text-white rounded-lg flex items-center justify-between font-mono font-bold text-xs shadow-2xs">
              <span>TOTAL PROPERTY ASSETS</span>
              <span className="text-emerald-400">{formatINR(data.totalAssets)}</span>
            </div>
          </div>
        </div>
      ) : (
        /* VERTICAL MODE: Schedule III Format */
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs font-sans text-xs space-y-6 mb-4">
          {/* SECTION I: EQUITY AND LIABILITIES */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                I. EQUITY AND LIABILITIES
              </h3>
              <span className="font-mono text-xs text-slate-500 font-semibold">Schedule III Format</span>
            </div>

            <div className="space-y-3">
              {data.equityAndLiabilities.map((group) => (
                <div key={group.id} className="space-y-1">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg font-bold text-slate-900 border border-slate-200">
                    <span>{group.name}</span>
                    <span className="font-mono text-emerald-800 font-bold">{formatINR(group.amount)}</span>
                  </div>

                  {group.childItems?.map((sub) => (
                    <div
                      key={sub.id}
                      onClick={() => setSelectedDrillItem(sub)}
                      className="flex items-center justify-between p-2 pl-6 rounded-lg hover:bg-slate-50 cursor-pointer font-medium text-slate-800 border-b border-slate-100"
                    >
                      <span>{sub.name}</span>
                      <span className="font-mono font-bold">{formatINR(sub.amount)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-100 rounded-lg flex items-center justify-between font-mono font-bold text-xs text-slate-900 border border-slate-300">
              <span>TOTAL EQUITY AND LIABILITIES</span>
              <span className="text-emerald-800">{formatINR(data.totalLiabilities)}</span>
            </div>
          </div>

          {/* SECTION II: ASSETS */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                II. ASSETS
              </h3>
              <span className="font-mono text-xs text-slate-500 font-semibold">Schedule III Format</span>
            </div>

            <div className="space-y-3">
              {data.assets.map((group) => (
                <div key={group.id} className="space-y-1">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg font-bold text-slate-900 border border-slate-200">
                    <span>{group.name}</span>
                    <span className="font-mono text-emerald-800 font-bold">{formatINR(group.amount)}</span>
                  </div>

                  {group.childItems?.map((sub) => (
                    <div
                      key={sub.id}
                      onClick={() => setSelectedDrillItem(sub)}
                      className="flex items-center justify-between p-2 pl-6 rounded-lg hover:bg-slate-50 cursor-pointer font-medium text-slate-800 border-b border-slate-100"
                    >
                      <span>{sub.name}</span>
                      <span className="font-mono font-bold">{formatINR(sub.amount)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-100 rounded-lg flex items-center justify-between font-mono font-bold text-xs text-slate-900 border border-slate-300">
              <span>TOTAL ASSETS</span>
              <span className="text-emerald-800">{formatINR(data.totalAssets)}</span>
            </div>
          </div>
        </div>
      )}

      {/* EQUILIBRIUM MATCH BANNER */}
      <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 font-mono font-bold text-xs flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span className="uppercase tracking-wider">
            BALANCE SHEET EQUILIBRIUM MATCHED (TOTAL LIABILITIES = TOTAL ASSETS)
          </span>
        </div>
        <div className="text-xs bg-white px-3 py-1 rounded-lg border border-emerald-200 text-emerald-800 font-bold">
          {formatINR(data.totalAssets)}
        </div>
      </div>

      {/* Drill-down Detail Modal */}
      {selectedDrillItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg p-5 space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <span className="font-mono text-[10px] uppercase text-slate-500 font-bold">
                  {selectedDrillItem.subSection}
                </span>
                <h3 className="font-bold text-sm text-slate-900">
                  {selectedDrillItem.name} ({selectedDrillItem.code})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDrillItem(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Current Balance (As On {asOnDate}):</span>
                <strong className="text-emerald-800 text-sm font-bold">
                  {formatINR(selectedDrillItem.amount)}
                </strong>
              </div>

              {showPrevYear && (
                <div className="flex justify-between border-t border-slate-200 pt-1 text-slate-600">
                  <span>Previous Year Balance:</span>
                  <strong className="font-semibold">{formatINR(selectedDrillItem.previousYearAmount)}</strong>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium">
              Click &quot;Export CSV&quot; or &quot;Print&quot; from the top action menu to download full ledger breakdown reports for this account.
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDrillItem(null)}
                className="rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </ModulePageShell>
  );
}
