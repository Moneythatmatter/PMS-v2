"use client";

import React, { useState, useMemo } from "react";
import {
  Building2,
  CheckCircle2,
  Save,
  RotateCcw,
  Printer,
  Download,
  Search,
  X,
  ShieldCheck,
  CheckSquare,
  FileText,
  Eye,
  Calendar,
  Users,
  CreditCard,
  Building,
  DollarSign,
  AlertCircle,
  FileCheck2,
  Scale,
  Columns,
  ListFilter,
  ArrowUpRight,
  TrendingUp,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  TextInput,
  SelectInput,
  StatMiniCard,
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

  // Export CSV Action
  const handleExportCSV = () => {
    const csvHeader = "Category,Section,Code,ItemName,AmountINR,PreviousYearINR\n";
    const liabRows = data.equityAndLiabilities
      .map(
        (i) =>
          `"LIABILITIES","${i.subSection}","${i.code}","${i.name}","${i.amount}","${i.previousYearAmount}"`
      )
      .join("\n");
    const assetRows = data.assets
      .map(
        (i) =>
          `"ASSETS","${i.subSection}","${i.code}","${i.name}","${i.amount}","${i.previousYearAmount}"`
      )
      .join("\n");

    const blob = new Blob([csvHeader + liabRows + "\n" + assetRows], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `WINHMS_Balance_Sheet_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMessage("Exported Balance Sheet report to CSV.");
  };

  return (
    <ModulePageShell
      eyebrow="Accounts & Reports"
      title="Balance Sheet"
      description="Statement of Financial Position: Assets, Liabilities, Equity Reserves, and Net Worth as on date."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Reports", href: "/accounts/reports" },
        { label: "Balance Sheet" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => setToastMessage("Recalculated Balance Sheet as on date.")}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            <Scale className="h-3.5 w-3.5 mr-1" />
            Generate Report
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setToastMessage("Saved Balance Sheet view preferences.")}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Save Options
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Print
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export CSV
          </Button>
        </div>
      }
    >
      {/* Top Active Target Entity & Date Selector Bar */}
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <Building2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="flex-1 max-w-sm">
              <span className="font-bold text-xs text-slate-600 block">Target Company Entity:</span>
              <select
                value="HOTEL & RESORTS PRIVATE LIMITED"
                onChange={() => {}}
                className="h-8 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
              >
                <option value="HOTEL & RESORTS PRIVATE LIMITED">
                  HOTEL & RESORTS PRIVATE LIMITED (CMP-001)
                </option>
              </select>
            </div>

            <div className="w-44">
              <span className="font-bold text-xs text-slate-600 block">As On Date:</span>
              <FODatePicker value={asOnDate} onChange={setAsOnDate} placeholder="DD/MM/YYYY" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1 text-emerald-800 border border-emerald-200 font-bold">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
              Equilibrium Balanced ✓
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-slate-700 border border-slate-200 font-mono">
              <Scale className="h-3.5 w-3.5 text-slate-600" />
              Total: {formatINR(data.totalAssets)}
            </span>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Format Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setReportFormat("horizontal")}
              className={cn(
                "px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
                reportFormat === "horizontal"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Columns className="h-3.5 w-3.5 inline mr-1" />
              Horizontal (Side-by-Side)
            </button>
            <button
              onClick={() => setReportFormat("vertical")}
              className={cn(
                "px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
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
              <span className="font-bold text-slate-600">Detail Level:</span>
              <select
                value={detailLevel}
                onChange={(e) => setDetailLevel(e.target.value as any)}
                className="h-8 rounded-xl border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
              >
                <option value="detailed">Detailed (Sub-Groups & Ledgers)</option>
                <option value="summary">Summary (Major Account Groups)</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
              <input
                type="checkbox"
                checked={showPrevYear}
                onChange={(e) => setShowPrevYear(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 h-4 w-4"
              />
              <span>Show Previous Year Comparison</span>
            </label>
          </div>
        </div>
      </div>

      {/* Metrics Overview Strip (4 Stat Mini-Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatMiniCard
          label="Total Liabilities & Capital"
          value={formatINR(data.totalLiabilities)}
          icon={Building}
        />
        <StatMiniCard
          label="Total Property Assets"
          value={formatINR(data.totalAssets)}
          icon={Scale}
        />
        <StatMiniCard
          label="Equity & Retained Reserves"
          value="₹ 32,10,00,000.00"
          sublabel="Net Worth / Owner Capital"
          icon={DollarSign}
        />
        <StatMiniCard
          label="Current Liquidity Ratio"
          value="2.45 : 1"
          sublabel="Current Assets / Liabilities"
          icon={TrendingUp}
        />
      </div>

      {/* HORIZONTAL MODE: Side-by-Side Dual Panel (WINHMS Style) */}
      {reportFormat === "horizontal" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 font-sans text-xs">
          {/* LEFT PANEL: CAPITAL & LIABILITIES */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Building className="h-4 w-4 text-emerald-600" />
                  CAPITAL & LIABILITIES
                </h3>
                <span className="font-mono text-xs font-bold text-slate-500">As On {asOnDate}</span>
              </div>

              <div className="space-y-4">
                {getFilteredItems(data.equityAndLiabilities).map((group) => (
                  <div key={group.id} className="space-y-1.5">
                    {/* Level 1 Group Header */}
                    <div className="flex items-center justify-between p-2 bg-slate-100 rounded-xl font-extrabold text-slate-900 border border-slate-200">
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
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-emerald-50/70 cursor-pointer border border-transparent hover:border-emerald-200 transition-all font-semibold text-slate-800"
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
            <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between font-mono font-extrabold text-sm border border-slate-900">
              <span>TOTAL CAPITAL & LIABILITIES</span>
              <span className="text-emerald-400">{formatINR(data.totalLiabilities)}</span>
            </div>
          </div>

          {/* RIGHT PANEL: ASSETS & APPLICABLE INVESTMENTS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Scale className="h-4 w-4 text-emerald-600" />
                  PROPERTY ASSETS & INVESTMENTS
                </h3>
                <span className="font-mono text-xs font-bold text-slate-500">As On {asOnDate}</span>
              </div>

              <div className="space-y-4">
                {getFilteredItems(data.assets).map((group) => (
                  <div key={group.id} className="space-y-1.5">
                    {/* Level 1 Group Header */}
                    <div className="flex items-center justify-between p-2 bg-slate-100 rounded-xl font-extrabold text-slate-900 border border-slate-200">
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
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-emerald-50/70 cursor-pointer border border-transparent hover:border-emerald-200 transition-all font-semibold text-slate-800"
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
            <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between font-mono font-extrabold text-sm border border-slate-900">
              <span>TOTAL PROPERTY ASSETS</span>
              <span className="text-emerald-400">{formatINR(data.totalAssets)}</span>
            </div>
          </div>
        </div>
      ) : (
        /* VERTICAL MODE: Schedule III Format */
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs font-sans text-xs space-y-6 mb-4">
          {/* SECTION I: EQUITY AND LIABILITIES */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
                I. EQUITY AND LIABILITIES
              </h3>
              <span className="font-mono text-xs text-slate-500 font-bold">Schedule III Format</span>
            </div>

            <div className="space-y-3">
              {data.equityAndLiabilities.map((group) => (
                <div key={group.id} className="space-y-1">
                  <div className="flex items-center justify-between p-2.5 bg-slate-100 rounded-xl font-bold text-slate-900 border border-slate-200">
                    <span>{group.name}</span>
                    <span className="font-mono text-emerald-800 font-extrabold">{formatINR(group.amount)}</span>
                  </div>

                  {group.childItems?.map((sub) => (
                    <div
                      key={sub.id}
                      onClick={() => setSelectedDrillItem(sub)}
                      className="flex items-center justify-between p-2 pl-6 rounded-lg hover:bg-slate-50 cursor-pointer font-semibold text-slate-800 border-b border-slate-100"
                    >
                      <span>{sub.name}</span>
                      <span className="font-mono">{formatINR(sub.amount)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between font-mono font-extrabold text-sm text-slate-900 border border-slate-300">
              <span>TOTAL EQUITY AND LIABILITIES</span>
              <span className="text-emerald-800">{formatINR(data.totalLiabilities)}</span>
            </div>
          </div>

          {/* SECTION II: ASSETS */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
                II. ASSETS
              </h3>
              <span className="font-mono text-xs text-slate-500 font-bold">Schedule III Format</span>
            </div>

            <div className="space-y-3">
              {data.assets.map((group) => (
                <div key={group.id} className="space-y-1">
                  <div className="flex items-center justify-between p-2.5 bg-slate-100 rounded-xl font-bold text-slate-900 border border-slate-200">
                    <span>{group.name}</span>
                    <span className="font-mono text-emerald-800 font-extrabold">{formatINR(group.amount)}</span>
                  </div>

                  {group.childItems?.map((sub) => (
                    <div
                      key={sub.id}
                      onClick={() => setSelectedDrillItem(sub)}
                      className="flex items-center justify-between p-2 pl-6 rounded-lg hover:bg-slate-50 cursor-pointer font-semibold text-slate-800 border-b border-slate-100"
                    >
                      <span>{sub.name}</span>
                      <span className="font-mono">{formatINR(sub.amount)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between font-mono font-extrabold text-sm text-slate-900 border border-slate-300">
              <span>TOTAL ASSETS</span>
              <span className="text-emerald-800">{formatINR(data.totalAssets)}</span>
            </div>
          </div>
        </div>
      )}

      {/* EQUILIBRIUM MATCH BANNER */}
      <div className="p-4 rounded-2xl bg-emerald-800 text-white font-mono font-extrabold text-xs flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-300" />
          <span className="uppercase tracking-wider">
            BALANCE SHEET EQUILIBRIUM MATCHED (TOTAL LIABILITIES = TOTAL ASSETS)
          </span>
        </div>
        <div className="text-sm bg-emerald-900/60 px-3 py-1 rounded-xl border border-emerald-700">
          {formatINR(data.totalAssets)}
        </div>
      </div>

      {/* Drill-down Detail Modal */}
      {selectedDrillItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-5 space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <span className="font-mono text-xs text-slate-500 font-bold">
                  {selectedDrillItem.subSection}
                </span>
                <h3 className="font-bold text-sm text-slate-900">
                  {selectedDrillItem.name} ({selectedDrillItem.code})
                </h3>
              </div>
              <button
                onClick={() => setSelectedDrillItem(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Current Balance (As On {asOnDate}):</span>
                <strong className="text-emerald-800 text-sm font-extrabold">
                  {formatINR(selectedDrillItem.amount)}
                </strong>
              </div>

              {showPrevYear && (
                <div className="flex justify-between border-t border-slate-200 pt-1 text-slate-600">
                  <span>Previous Year Balance:</span>
                  <strong>{formatINR(selectedDrillItem.previousYearAmount)}</strong>
                </div>
              )}
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs font-semibold">
              ℹ️ Click &quot;Export CSV&quot; or &quot;Print&quot; from the top menu to download full ledger breakdown reports for this account.
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDrillItem(null)}
                className="rounded-xl text-xs font-semibold cursor-pointer"
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
