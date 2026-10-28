"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Printer,
  Scale,
  Columns,
  ListFilter,
  TrendingUp,
  Building,
  Loader2,
  AlertCircle,
  BookOpen,
  Landmark,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui";
import { FODatePicker, formatINR } from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import { accReportService, type BalanceSheetSection } from "@/services/accounts";
import { useAccLookups, useAccQuery, todayIso, fyStartIso, formatDate } from "@/components/accounts/accountsApi";
import { cn } from "@/lib/utils";
import { downloadXlsx } from "@/lib/xlsx";
import { ExportMenu } from "@/components/accounts/ExportMenu";
import { KpiCard } from "@/components/accounts/KpiCard";

const EXPORT_HEADER = ["Side", "Section", "Code", "Particulars", "Current (₹)", "Previous Year (₹)"];

export function BalanceSheetView() {
  const [appliedAsOn, setAppliedAsOn] = useState(todayIso());
  const [reportFormat, setReportFormat] = useState<"horizontal" | "vertical">("horizontal");
  const [detailLevel, setDetailLevel] = useState<"summary" | "detailed">("detailed");
  const [showPrevYear, setShowPrevYear] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { lookups } = useAccLookups();
  const router = useRouter();
  const openLedger = (accountId: string) => {
    const fy = lookups?.fiscalYears.find((f) => f.startDate <= appliedAsOn && f.endDate >= appliedAsOn);
    const from = fy?.startDate.slice(0, 10) ?? fyStartIso();
    const params = new URLSearchParams({ accountId, from, to: appliedAsOn });
    router.push(`/accounts/reports/general-ledger?${params.toString()}`);
  };

  const report = useAccQuery(() => accReportService.balanceSheet({ asOn: appliedAsOn }), [appliedAsOn]);
  const data = report.data;
  const totals = data?.totals;
  const equity = data?.liabilities.find((s) => s.section === "Capital & Reserves")?.total ?? 0;
  const currentRatio = data?.ratios.currentRatio ?? null;

  const exportRows = (side: string, sections: BalanceSheetSection[]) =>
    sections.flatMap((section) => {
      const rows: (string | number)[][] = [[side, section.section, "", section.section, section.total, section.previousTotal]];
      if (detailLevel === "detailed") {
        for (const group of section.groups) {
          rows.push([side, section.section, "", `  ${group.groupName}`, group.total, group.previousTotal]);
          for (const acc of group.accounts) {
            rows.push([side, section.section, acc.code, `    ${acc.name}`, acc.amount, acc.previousAmount]);
          }
        }
      }
      return rows;
    });

  const allExportRows = () => {
    if (!data) return [];
    return [
      ...exportRows("Capital & Liabilities", data.liabilities),
      ["Capital & Liabilities", "", "", "Total Capital & Liabilities", data.totals.totalLiabilities, data.totals.previousTotalLiabilities],
      ...exportRows("Assets", data.assets),
      ["Assets", "", "", "Total Assets", data.totals.totalAssets, data.totals.previousTotalAssets],
    ];
  };

  const handleExportExcel = () => {
    if (!data) {
      setToastMessage("Nothing to export yet — wait for the report to load.");
      return;
    }
    downloadXlsx(`balance-sheet-${data.asOn}.xlsx`, [
      {
        name: "Balance Sheet",
        title: "Balance Sheet",
        meta: [
          ["As on", formatDate(data.asOn)],
          ["Previous year as on", formatDate(data.compareAsOn)],
          ["Detail level", detailLevel === "detailed" ? "Groups & ledgers" : "Sections only"],
          ["Total Assets", data.totals.totalAssets],
          ["Total Capital & Liabilities", data.totals.totalLiabilities],
          ["Status", data.totals.balanced ? "Balanced" : `Difference ${data.totals.difference}`],
          ["Generated", new Date().toLocaleString("en-IN")],
        ],
        header: EXPORT_HEADER,
        rows: allExportRows(),
      },
    ]);
    setToastMessage("Balance Sheet exported to Excel.");
  };

  const handleExportCsv = () => {
    if (!data) {
      setToastMessage("Nothing to export yet — wait for the report to load.");
      return;
    }
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = "\uFEFF" + [EXPORT_HEADER, ...allExportRows()].map((r) => r.map(esc).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `balance-sheet-${data.asOn}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const th = "border-b border-slate-200 bg-slate-100 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600";
  const td = "border-b border-slate-100 px-3 py-1.5";

  const renderSectionRows = (sections: BalanceSheetSection[]) =>
    sections.map((section) => (
      <React.Fragment key={section.section}>
        <tr className="bg-slate-50 font-bold text-slate-900">
          <td className={cn(td, "py-2")}>{section.section}</td>
          {showPrevYear && (
            <td className={cn(td, "py-2 text-right tabular-nums font-medium text-slate-500")}>
              {formatINR(section.previousTotal)}
            </td>
          )}
          <td className={cn(td, "py-2 text-right tabular-nums text-emerald-800")}>{formatINR(section.total)}</td>
        </tr>
        {detailLevel === "detailed" &&
          (section.groups.length === 0 ? (
            <tr>
              <td className={cn(td, "pl-6 italic text-slate-400")} colSpan={showPrevYear ? 3 : 2}>
                No balances
              </td>
            </tr>
          ) : (
            section.groups.map((group) => (
              <React.Fragment key={`${section.section}-${group.groupId ?? group.groupName}`}>
                <tr className="font-semibold text-slate-800">
                  <td className={cn(td, "pl-6")}>{group.groupName}</td>
                  {showPrevYear && (
                    <td className={cn(td, "text-right tabular-nums font-normal text-slate-400")}>
                      {formatINR(group.previousTotal)}
                    </td>
                  )}
                  <td className={cn(td, "text-right tabular-nums")}>{formatINR(group.total)}</td>
                </tr>
                {group.accounts.map((acc) => (
                  <tr
                    key={acc.accountId}
                    onClick={() => openLedger(acc.accountId)}
                    title={`Open ${acc.name} in General Ledger`}
                    className="group cursor-pointer text-slate-700 hover:bg-emerald-50/70"
                  >
                    <td className={cn(td, "pl-10")}>
                      <span className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-slate-400">{acc.code}</span>
                        <span className="group-hover:text-emerald-800 group-hover:underline underline-offset-2">
                          {acc.name}
                        </span>
                        <BookOpen className="h-3 w-3 shrink-0 text-emerald-600 opacity-0 group-hover:opacity-100" />
                      </span>
                    </td>
                    {showPrevYear && (
                      <td className={cn(td, "text-right tabular-nums text-slate-400")}>{formatINR(acc.previousAmount)}</td>
                    )}
                    <td className={cn(td, "text-right tabular-nums")}>{formatINR(acc.amount)}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))
          ))}
      </React.Fragment>
    ));

  const statementTable = (
    sections: BalanceSheetSection[],
    totalLabel: string,
    total: number,
    previousTotal: number,
    heading?: string
  ) => (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr>
          <th className={cn(th, "text-left")}>{heading ?? "Particulars"}</th>
          {showPrevYear && <th className={cn(th, "w-32 text-right")}>PY {data ? formatDate(data.compareAsOn) : ""}</th>}
          <th className={cn(th, "w-36 text-right")}>As on {data ? formatDate(data.asOn) : ""}</th>
        </tr>
      </thead>
      <tbody>{renderSectionRows(sections)}</tbody>
      <tfoot>
        <tr className="bg-slate-900 font-bold text-white">
          <td className="px-3 py-2.5 uppercase tracking-wider">{totalLabel}</td>
          {showPrevYear && <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">{formatINR(previousTotal)}</td>}
          <td className="px-3 py-2.5 text-right tabular-nums text-emerald-300">{formatINR(total)}</td>
        </tr>
      </tfoot>
    </table>
  );

  const segmentBtn = (active: boolean) =>
    cn(
      "inline-flex h-full items-center gap-1 rounded-md px-2.5 text-[11px] font-semibold transition-colors cursor-pointer select-none",
      active ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
    );

  return (
    <ModulePageShell
      eyebrow="Accounts &amp; Reports"
      title="Balance Sheet"
      description="Statement of financial position: assets, liabilities, equity and net worth as on a date."
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-lg text-xs font-semibold bg-white border-slate-200 text-slate-700 shadow-2xs hidden sm:inline-flex"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Print
          </Button>
          <ExportMenu
            onExcel={handleExportExcel}
            onCsv={handleExportCsv}
            disabled={!data}
            excelHint="Statement with PY comparison"
            csvHint="Plain rows"
          />
        </div>
      }
      wrapChildren={false}
    >
      {totals && data && (
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard
            label="Total Assets"
            value={formatINR(totals.totalAssets)}
            note={totals.balanced ? "Balanced with liabilities ✓" : `Difference ${formatINR(Math.abs(totals.difference))}`}
            icon={Scale}
            tone={totals.balanced ? "emerald" : "rose"}
            strong={!totals.balanced}
          />
          <KpiCard
            label="Capital & Liabilities"
            value={formatINR(totals.totalLiabilities)}
            note={`PY ${formatINR(totals.previousTotalLiabilities)}`}
            icon={Building}
            tone="sky"
          />
          <KpiCard
            label="Equity & Reserves"
            value={formatINR(equity)}
            note="Net worth / owner capital"
            icon={Landmark}
            tone="slate"
          />
          <KpiCard
            label="Current Ratio"
            value={currentRatio === null ? "—" : `${currentRatio.toFixed(2)} : 1`}
            note={`Working capital ${formatINR(data.ratios.workingCapital)}`}
            icon={TrendingUp}
            tone="amber"
          />
        </div>
      )}

      {/* Controls bar */}
      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">As on</span>
          <div className="w-36">
            <FODatePicker
              value={appliedAsOn}
              onChange={(v) => v && setAppliedAsOn(v)}
              placeholder="DD/MM/YYYY"
              className="h-9"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void report.reload()}
            disabled={report.loading}
            title="Reload balance sheet"
            className="h-9 w-9 rounded-lg border-slate-200 bg-white p-0 text-slate-600"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", report.loading && "animate-spin")} />
          </Button>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex h-9 items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button type="button" onClick={() => setReportFormat("horizontal")} className={segmentBtn(reportFormat === "horizontal")}>
              <Columns className="h-3.5 w-3.5" /> Side by side
            </button>
            <button type="button" onClick={() => setReportFormat("vertical")} className={segmentBtn(reportFormat === "vertical")}>
              <ListFilter className="h-3.5 w-3.5" /> Schedule III
            </button>
          </div>
          <div className="flex h-9 items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button type="button" onClick={() => setDetailLevel("detailed")} className={segmentBtn(detailLevel === "detailed")}>
              Detailed
            </button>
            <button type="button" onClick={() => setDetailLevel("summary")} className={segmentBtn(detailLevel === "summary")}>
              Summary
            </button>
          </div>
          <button
            type="button"
            aria-pressed={showPrevYear}
            onClick={() => setShowPrevYear((v) => !v)}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-semibold transition-colors cursor-pointer select-none",
              showPrevYear
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
            )}
          >
            <CheckCircle2 className={cn("h-3.5 w-3.5", showPrevYear ? "text-emerald-600" : "text-slate-300")} />
            Previous year
          </button>
        </div>
      </div>

      {report.loading && !data ? (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-16 text-xs font-medium text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-600" /> Loading balance sheet…
        </div>
      ) : report.error || !data || !totals ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/40 py-14 text-center">
          <AlertCircle className="mx-auto mb-2 h-8 w-8 text-rose-500" />
          <p className="text-sm font-semibold text-slate-700">Could not load balance sheet</p>
          <p className="mt-1 text-xs text-slate-500">{report.error ?? "No data returned."}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => void report.reload()} className="mt-3">
            Retry
          </Button>
        </div>
      ) : reportFormat === "horizontal" ? (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="flex items-center gap-2.5 border-b border-slate-200 px-4 py-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                <Building className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-bold text-slate-900">Capital &amp; Liabilities</h2>
            </div>
            {statementTable(
              data.liabilities,
              "Total Capital & Liabilities",
              totals.totalLiabilities,
              totals.previousTotalLiabilities
            )}
          </section>
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="flex items-center gap-2.5 border-b border-slate-200 px-4 py-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <Scale className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-bold text-slate-900">Assets</h2>
            </div>
            {statementTable(data.assets, "Total Assets", totals.totalAssets, totals.previousTotalAssets)}
          </section>
        </div>
      ) : (
        <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center gap-2.5 border-b border-slate-200 px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <ListFilter className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Balance Sheet (Schedule III)</h2>
              <p className="text-[11px] text-slate-500">As on {formatDate(data.asOn)}</p>
            </div>
          </div>
          {statementTable(
            data.liabilities,
            "Total Equity & Liabilities",
            totals.totalLiabilities,
            totals.previousTotalLiabilities,
            "I. Equity and Liabilities"
          )}
          {statementTable(data.assets, "Total Assets", totals.totalAssets, totals.previousTotalAssets, "II. Assets")}
        </section>
      )}
    </ModulePageShell>
  );
}
