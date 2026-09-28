"use client";

import React, { useState } from "react";
import {
  Building2,
  CheckCircle2,
  Printer,
  Download,
  X,
  Scale,
  Columns,
  ListFilter,
  TrendingUp,
  DollarSign,
  Building,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import {
  FODatePicker,
  formatINR,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import { accReportService, type BalanceSheetSection } from "@/services/accounts";
import { useAccLookups, useAccQuery, todayIso, formatDate } from "@/components/accounts/accountsApi";
import { cn } from "@/lib/utils";

type DrillItem = {
  accountId: string;
  code: string;
  name: string;
  section: string;
  groupName: string;
  amount: number;
  previousAmount: number;
};

export function BalanceSheetView() {
  // As On Date Filter State
  const [asOnDate, setAsOnDate] = useState(todayIso());
  const [appliedAsOn, setAppliedAsOn] = useState(todayIso());

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
  const [selectedDrillItem, setSelectedDrillItem] = useState<DrillItem | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { lookups } = useAccLookups();
  const company =
    lookups?.companies.find((c) => c.status === "Active") ?? lookups?.companies[0] ?? null;

  const report = useAccQuery(
    () => accReportService.balanceSheet({ asOn: appliedAsOn }),
    [appliedAsOn]
  );
  const data = report.data;
  const totals = data?.totals;
  const equity = data?.liabilities.find((s) => s.section === "Capital & Reserves")?.total ?? 0;
  const currentRatio = data?.ratios.currentRatio ?? null;

  const handleGenerate = () => {
    if (!asOnDate) {
      setToastMessage("Select an 'As On' date.");
      return;
    }
    if (asOnDate === appliedAsOn) void report.reload();
    else setAppliedAsOn(asOnDate);
  };

  // ─────────────────────────────────────────────────────────────
  // CLEAN EXCEL-READY CSV EXPORT
  // ─────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (!data) {
      setToastMessage("Nothing to export yet — generate the report first.");
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

    const headers = [
      "CATEGORY",
      "SUB SECTION",
      "ACCOUNT CODE",
      "ACCOUNT NAME",
      "CURRENT AMOUNT (INR)",
      "PREVIOUS YEAR AMOUNT (INR)",
    ];

    const sectionRows = (category: string, sections: BalanceSheetSection[]) =>
      sections.flatMap((section) => {
        const rows: (string | number)[][] = [
          [category, section.section, "", section.section, section.total, section.previousTotal],
        ];
        section.groups.forEach((group) => {
          rows.push([category, section.section, "", group.groupName, group.total, group.previousTotal]);
          group.accounts.forEach((acc) => {
            rows.push([category, section.section, acc.code, acc.name, acc.amount, acc.previousAmount]);
          });
        });
        return rows;
      });

    const summaryRows: (string | number)[][] = [
      ["TOTALS", "CAPITAL & LIABILITIES", "", "TOTAL LIABILITIES & CAPITAL", data.totals.totalLiabilities, data.totals.previousTotalLiabilities],
      ["TOTALS", "PROPERTY ASSETS", "", "TOTAL PROPERTY ASSETS", data.totals.totalAssets, data.totals.previousTotalAssets],
    ];

    const csvContent =
      "\uFEFF" +
      [headers, ...sectionRows("CAPITAL & LIABILITIES", data.liabilities), ...sectionRows("PROPERTY ASSETS", data.assets), ...summaryRows]
        .map((row) => row.map(escapeCSV).join(","))
        .join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PMS_Balance_Sheet_AsOn_${data.asOn}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMessage("Balance Sheet exported to Excel-ready CSV.");
  };

  // Horizontal panel section list
  const renderHorizontalSections = (sections: BalanceSheetSection[]) => (
    <div className="space-y-3">
      {sections.map((section) => (
        <div key={section.section} className="space-y-1.5">
          {/* Level 1 Section Header */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg font-bold text-slate-900 border border-slate-200">
            <span>{section.section}</span>
            <div className="flex items-center gap-3 font-mono">
              {showPrevYear && (
                <span className="text-slate-500 text-[11px] font-normal">
                  PY: {formatINR(section.previousTotal)}
                </span>
              )}
              <span className="text-emerald-800 font-bold">{formatINR(section.total)}</span>
            </div>
          </div>

          {/* Level 2 Groups & Ledgers */}
          {detailLevel === "detailed" && (
            <div className="pl-3 pr-1 space-y-1">
              {section.groups.length === 0 && (
                <div className="p-2 text-slate-400 italic">No balances</div>
              )}
              {section.groups.map((group) => (
                <div key={`${section.section}-${group.groupId ?? group.groupName}`} className="space-y-0.5">
                  <div className="flex items-center justify-between p-2 rounded-lg font-semibold text-slate-900">
                    <span>{group.groupName}</span>
                    <div className="flex items-center gap-3 font-mono">
                      {showPrevYear && (
                        <span className="text-slate-400 text-[10px]">
                          {formatINR(group.previousTotal)}
                        </span>
                      )}
                      <span className="font-bold text-slate-900">{formatINR(group.total)}</span>
                    </div>
                  </div>

                  {group.accounts.map((acc) => (
                    <div
                      key={acc.accountId}
                      onClick={() =>
                        setSelectedDrillItem({ ...acc, section: section.section, groupName: group.groupName })
                      }
                      className="flex items-center justify-between p-2 pl-5 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-all font-medium text-slate-800"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-mono text-[10px]">{acc.code}</span>
                        <span>{acc.name}</span>
                      </span>

                      <div className="flex items-center gap-3 font-mono">
                        {showPrevYear && (
                          <span className="text-slate-400 text-[10px]">
                            {formatINR(acc.previousAmount)}
                          </span>
                        )}
                        <span className="font-medium text-slate-900">{formatINR(acc.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // Vertical (Schedule III) section list
  const renderVerticalSections = (sections: BalanceSheetSection[]) => (
    <div className="space-y-3">
      {sections.map((section) => (
        <div key={section.section} className="space-y-1">
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg font-bold text-slate-900 border border-slate-200">
            <span>{section.section}</span>
            <div className="flex items-center gap-3 font-mono">
              {showPrevYear && (
                <span className="text-slate-500 text-[11px] font-normal">PY: {formatINR(section.previousTotal)}</span>
              )}
              <span className="text-emerald-800 font-bold">{formatINR(section.total)}</span>
            </div>
          </div>

          {detailLevel === "detailed" &&
            section.groups.map((group) => (
              <React.Fragment key={`${section.section}-${group.groupId ?? group.groupName}`}>
                <div className="flex items-center justify-between p-2 pl-6 font-semibold text-slate-900 border-b border-slate-100">
                  <span>{group.groupName}</span>
                  <span className="font-mono font-bold">{formatINR(group.total)}</span>
                </div>
                {group.accounts.map((acc) => (
                  <div
                    key={acc.accountId}
                    onClick={() =>
                      setSelectedDrillItem({ ...acc, section: section.section, groupName: group.groupName })
                    }
                    className="flex items-center justify-between p-2 pl-10 rounded-lg hover:bg-slate-50 cursor-pointer font-medium text-slate-700 border-b border-slate-100"
                  >
                    <span>{acc.name}</span>
                    <span className="font-mono">{formatINR(acc.amount)}</span>
                  </div>
                ))}
              </React.Fragment>
            ))}
        </div>
      ))}
    </div>
  );

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
            onClick={handleGenerate}
            disabled={report.loading}
            className="rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-2xs cursor-pointer px-3.5"
          >
            {report.loading ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Scale className="h-3.5 w-3.5 mr-1" />
            )}
            Generate Report
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
            disabled={!data}
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
              <span className="font-bold text-[11px] uppercase tracking-wider text-slate-600 block mb-1">Company Entity:</span>
              <div className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-900 flex items-center truncate">
                {company ? `${company.legalName || company.tradeName} (${company.companyCode})` : "—"}
              </div>
            </div>

            <div className="w-44">
              <span className="font-bold text-[11px] uppercase tracking-wider text-slate-600 block mb-1">As On Date:</span>
              <FODatePicker value={asOnDate} onChange={setAsOnDate} placeholder="DD/MM/YYYY" />
            </div>
          </div>

          {data && totals && (
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              {totals.balanced ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-emerald-800 border border-emerald-200 font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                  Equilibrium Balanced ✓
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-rose-800 border border-rose-200 font-bold">
                  <AlertCircle className="h-3.5 w-3.5 text-rose-700" />
                  Difference {formatINR(Math.abs(totals.difference))}
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-slate-700 border border-slate-200 font-mono">
                <Scale className="h-3.5 w-3.5 text-slate-600" />
                Total: {formatINR(totals.totalAssets)}
              </span>
            </div>
          )}
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
                onChange={(e) => setDetailLevel(e.target.value as typeof detailLevel)}
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
              <span>
                Show Previous Year Comparison
                {data && showPrevYear && (
                  <span className="text-slate-400 font-normal"> (as on {formatDate(data.compareAsOn)})</span>
                )}
              </span>
            </label>
          </div>
        </div>
      </div>

      {report.loading && !data ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-white text-xs text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          Loading balance sheet…
        </div>
      ) : report.error || !data || !totals ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-rose-200 bg-rose-50/40">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-500 mb-2" />
          <p className="text-sm font-semibold text-slate-700">Could not load balance sheet</p>
          <p className="text-xs text-slate-500 mt-1">{report.error ?? "No data returned."}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => void report.reload()} className="mt-3">
            Retry
          </Button>
        </div>
      ) : (
        <>
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
                {formatINR(totals.totalLiabilities)}
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
                {formatINR(totals.totalAssets)}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs truncate">
                Fixed &amp; Current Assets
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
                {formatINR(equity)}
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
                {currentRatio === null ? "—" : `${currentRatio.toFixed(2)} : 1`}
              </p>
              <p className="mt-0.5 text-[11px] text-emerald-700 font-semibold sm:text-xs truncate">
                Working Capital {formatINR(data.ratios.workingCapital)}
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
                    <span className="font-mono text-xs font-semibold text-slate-500">As On {formatDate(data.asOn)}</span>
                  </div>

                  {renderHorizontalSections(data.liabilities)}
                </div>

                {/* Total Liabilities Footer */}
                <div className="p-3 bg-slate-900 text-white rounded-lg flex items-center justify-between font-mono font-bold text-xs shadow-2xs">
                  <span>TOTAL CAPITAL &amp; LIABILITIES</span>
                  <span className="text-emerald-400">{formatINR(totals.totalLiabilities)}</span>
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
                    <span className="font-mono text-xs font-semibold text-slate-500">As On {formatDate(data.asOn)}</span>
                  </div>

                  {renderHorizontalSections(data.assets)}
                </div>

                {/* Total Assets Footer */}
                <div className="p-3 bg-slate-900 text-white rounded-lg flex items-center justify-between font-mono font-bold text-xs shadow-2xs">
                  <span>TOTAL PROPERTY ASSETS</span>
                  <span className="text-emerald-400">{formatINR(totals.totalAssets)}</span>
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

                {renderVerticalSections(data.liabilities)}

                <div className="p-3 bg-slate-100 rounded-lg flex items-center justify-between font-mono font-bold text-xs text-slate-900 border border-slate-300">
                  <span>TOTAL EQUITY AND LIABILITIES</span>
                  <span className="text-emerald-800">{formatINR(totals.totalLiabilities)}</span>
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

                {renderVerticalSections(data.assets)}

                <div className="p-3 bg-slate-100 rounded-lg flex items-center justify-between font-mono font-bold text-xs text-slate-900 border border-slate-300">
                  <span>TOTAL ASSETS</span>
                  <span className="text-emerald-800">{formatINR(totals.totalAssets)}</span>
                </div>
              </div>
            </div>
          )}

          {/* EQUILIBRIUM MATCH BANNER */}
          {totals.balanced ? (
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 font-mono font-bold text-xs flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="uppercase tracking-wider">
                  BALANCE SHEET EQUILIBRIUM MATCHED (TOTAL LIABILITIES = TOTAL ASSETS)
                </span>
              </div>
              <div className="text-xs bg-white px-3 py-1 rounded-lg border border-emerald-200 text-emerald-800 font-bold">
                {formatINR(totals.totalAssets)}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 font-mono font-bold text-xs flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600" />
                <span className="uppercase tracking-wider">
                  BALANCE SHEET OUT OF BALANCE (ASSETS − LIABILITIES)
                </span>
              </div>
              <div className="text-xs bg-white px-3 py-1 rounded-lg border border-rose-200 text-rose-800 font-bold">
                {formatINR(totals.difference)}
              </div>
            </div>
          )}
        </>
      )}

      {/* Drill-down Detail Modal */}
      {selectedDrillItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg p-5 space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <span className="font-mono text-[10px] uppercase text-slate-500 font-bold">
                  {selectedDrillItem.section} › {selectedDrillItem.groupName}
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
                <span className="text-slate-500">Current Balance (As On {formatDate(data?.asOn)}):</span>
                <strong className="text-emerald-800 text-sm font-bold">
                  {formatINR(selectedDrillItem.amount)}
                </strong>
              </div>

              {showPrevYear && (
                <div className="flex justify-between border-t border-slate-200 pt-1 text-slate-600">
                  <span>Previous Year Balance (As On {formatDate(data?.compareAsOn)}):</span>
                  <strong className="font-semibold">{formatINR(selectedDrillItem.previousAmount)}</strong>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium">
              Balances include all posted vouchers up to the as-on date. Open the General Ledger report for the voucher-level breakdown of this account.
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
