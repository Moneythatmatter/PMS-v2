"use client";

import React, { useState, useMemo } from "react";
import {
  BookOpen,
  Printer,
  Search,
  X,
  Pencil,
  Wallet,
  Landmark,
  Loader2,
  AlertCircle,
  ArrowLeftRight,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui";
import { FODatePicker, formatINR } from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import { accReportService, type Voucher, type VoucherCategory } from "@/services/accounts";
import { useAccLookups, useAccQuery, todayIso, formatDate } from "@/components/accounts/accountsApi";
import { cn } from "@/lib/utils";
import { downloadXlsx } from "@/lib/xlsx";
import { ExportMenu } from "@/components/accounts/ExportMenu";
import { KpiCard } from "@/components/accounts/KpiCard";
import { VoucherEditModal } from "./VoucherEditModal";

const EXPORT_HEADER = [
  "Voucher Date",
  "Time",
  "Voucher No",
  "Voucher Type",
  "Primary Account",
  "Ref No",
  "Line",
  "GL Code",
  "GL Account",
  "Party",
  "Narration",
  "Debit (₹)",
  "Credit (₹)",
  "Division",
  "Prepared By",
];

function voucherTime(v: Voucher): string {
  const ts = v.postedAt ?? v.createdAt;
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function primaryAccount(v: Voucher): string {
  return v.partyName || v.bankCashAccountName || v.debitAccounts || v.creditAccounts || "—";
}

function voucherTypeBadgeClass(category: VoucherCategory) {
  switch (category) {
    case "Journal":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "Payment":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "Receipt":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Contra":
      return "bg-blue-50 text-blue-700 border-blue-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export function DayBookView() {
  const [appliedDate, setAppliedDate] = useState(todayIso());
  const [voucherTypeFilter, setVoucherTypeFilter] = useState("All");
  const [divisionFilter, setDivisionFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [editVoucherId, setEditVoucherId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { lookups, loading: lookupsLoading } = useAccLookups();

  const report = useAccQuery(
    () =>
      accReportService.dayBook({
        date: appliedDate,
        voucherTypeId: voucherTypeFilter !== "All" ? voucherTypeFilter : undefined,
      }),
    [appliedDate, voucherTypeFilter]
  );
  const summary = report.data?.summary;

  const filteredVouchers = useMemo(() => {
    const vouchersList = report.data?.vouchers ?? [];
    const q = searchQuery.trim().toLowerCase();
    return vouchersList.filter((v) => {
      if (
        divisionFilter !== "All" &&
        v.divisionId !== divisionFilter &&
        !v.lines.some((l) => l.divisionId === divisionFilter)
      ) {
        return false;
      }
      if (!q) return true;
      return (
        v.voucherNo.toLowerCase().includes(q) ||
        primaryAccount(v).toLowerCase().includes(q) ||
        (v.referenceNo ?? "").toLowerCase().includes(q) ||
        (v.narration ?? "").toLowerCase().includes(q) ||
        v.lines.some(
          (l) => (l.accountName ?? "").toLowerCase().includes(q) || (l.partyName ?? "").toLowerCase().includes(q)
        )
      );
    });
  }, [report.data, divisionFilter, searchQuery]);

  const totals = useMemo(() => {
    let debit = 0;
    let credit = 0;
    for (const v of filteredVouchers) {
      for (const l of v.lines) {
        debit += l.debit;
        credit += l.credit;
      }
    }
    return { debit, credit, volume: filteredVouchers.reduce((sum, v) => sum + v.totalAmount, 0) };
  }, [filteredVouchers]);

  const openingCash = summary?.openingCash ?? 0;
  const closingCash = summary?.closingCash ?? 0;
  const openingBank = (summary?.openingCashBank ?? 0) - openingCash;
  const closingBank = (summary?.closingCashBank ?? 0) - closingCash;

  const balanceRows = [
    { label: "Cash in hand", opening: openingCash, closing: closingCash },
    { label: "Bank accounts", opening: openingBank, closing: closingBank },
    {
      label: "Total cash + bank",
      opening: summary?.openingCashBank ?? 0,
      closing: summary?.closingCashBank ?? 0,
      total: true,
    },
  ];

  const exportRows = () =>
    filteredVouchers.flatMap((v) =>
      v.lines.map((l) => [
        formatDate(v.voucherDate),
        voucherTime(v),
        v.voucherNo,
        v.voucherTypeName ?? v.voucherCategory,
        primaryAccount(v),
        v.referenceNo ?? "",
        l.lineNo,
        l.accountCode ?? "",
        l.accountName ?? "",
        l.partyName ?? "",
        v.narration ?? "",
        l.debit,
        l.credit,
        l.divisionName ?? v.divisionName ?? "",
        v.preparedBy ?? "",
      ])
    );

  const ensureExportable = () => {
    if (report.data) return true;
    setToastMessage("Nothing to export yet — wait for the Day Book to load.");
    return false;
  };

  const handleExportExcel = () => {
    if (!ensureExportable()) return;
    downloadXlsx(`day-book-${appliedDate}.xlsx`, [
      {
        name: "Day Book",
        title: "Day Book Register",
        meta: [
          ["Date", formatDate(appliedDate)],
          ...(searchQuery.trim() ? [["Search", searchQuery.trim()] as [string, string]] : []),
          ["Vouchers", filteredVouchers.length],
          ["Total Debit", totals.debit],
          ["Total Credit", totals.credit],
          ["Generated", new Date().toLocaleString("en-IN")],
        ],
        header: EXPORT_HEADER,
        rows: [...exportRows(), ["Total", "", "", "", "", "", "", "", "", "", "", totals.debit, totals.credit, "", ""]],
      },
      {
        name: "Cash & Bank",
        title: "Cash & Bank Position",
        meta: [["Date", formatDate(appliedDate)]],
        header: ["Account", "Opening (₹)", "Net Movement (₹)", "Closing (₹)"],
        rows: [
          ...balanceRows.map((r) => [r.label, r.opening, r.closing - r.opening, r.closing]),
          [],
          ["Total inflow", summary?.inflow ?? 0],
          ["Total outflow", summary?.outflow ?? 0],
        ],
      },
    ]);
    setToastMessage(`Exported ${filteredVouchers.length} vouchers to Excel.`);
  };

  const handleExportCsv = () => {
    if (!ensureExportable()) return;
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = "\uFEFF" + [EXPORT_HEADER, ...exportRows()].map((r) => r.map(esc).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `day-book-${appliedDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const selectClass =
    "h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none";
  const th = "border border-slate-200 bg-slate-100 px-2.5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600";
  const td = "border border-slate-200 px-2.5 py-1.5";

  return (
    <ModulePageShell
      eyebrow="Accounts &amp; Reports"
      title="Day Book"
      description="Chronological daily register of all General Ledger vouchers with the day's cash and bank position."
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
            disabled={!report.data}
            excelHint="Register + cash & bank sheet"
            csvHint="Plain voucher lines"
          />
        </div>
      }
      wrapChildren={false}
    >
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Vouchers Posted"
          value={String(filteredVouchers.length)}
          note={`Volume ${formatINR(totals.volume)}`}
          icon={BookOpen}
          tone="sky"
        />
        <KpiCard
          label="Debit / Credit"
          value={formatINR(totals.debit)}
          note={`Cr ${formatINR(totals.credit)}${Math.abs(totals.debit - totals.credit) > 0.009 ? " · not matched" : " · matched"}`}
          icon={ArrowLeftRight}
          tone="amber"
        />
        <KpiCard
          label="Cash Closing"
          value={formatINR(closingCash)}
          note={`Opening ${formatINR(openingCash)}`}
          icon={Wallet}
          tone="emerald"
        />
        <KpiCard
          label="Bank Closing"
          value={formatINR(closingBank)}
          note={`Opening ${formatINR(openingBank)}`}
          icon={Landmark}
          tone="slate"
        />
      </div>

      {/* Filter bar: search left, filters right */}
      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="relative min-w-[220px] flex-1 lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search voucher #, account, party, ref…"
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-8 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="w-36">
            <FODatePicker
              value={appliedDate}
              onChange={(v) => v && setAppliedDate(v)}
              placeholder="DD/MM/YYYY"
              className="h-9"
            />
          </div>
          <select
            value={voucherTypeFilter}
            disabled={lookupsLoading}
            onChange={(e) => setVoucherTypeFilter(e.target.value)}
            className={cn(selectClass, "w-44")}
          >
            <option value="All">All voucher types</option>
            {(lookups?.voucherTypes ?? []).map((vt) => (
              <option key={vt.id} value={vt.id}>
                {vt.voucherTypeName} ({vt.shortCode})
              </option>
            ))}
          </select>
          <select
            value={divisionFilter}
            disabled={lookupsLoading}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className={cn(selectClass, "w-44")}
          >
            <option value="All">All divisions</option>
            {(lookups?.divisions ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.divisionName}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void report.reload()}
            disabled={report.loading}
            title="Reload day book"
            className="h-9 w-9 rounded-lg border-slate-200 bg-white p-0 text-slate-600"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", report.loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Register */}
      <section className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <BookOpen className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Day Book Register</h2>
              <p className="text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">{formatDate(appliedDate)}</span> ·{" "}
                {filteredVouchers.length} voucher{filteredVouchers.length !== 1 ? "s" : ""} · click a voucher to open it
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-semibold">
            <span className="rounded-lg bg-sky-50 px-2.5 py-1 text-sky-800">Dr {formatINR(totals.debit)}</span>
            <span className="rounded-lg bg-rose-50 px-2.5 py-1 text-rose-800">Cr {formatINR(totals.credit)}</span>
          </div>
        </div>

        {report.loading && !report.data ? (
          <div className="flex items-center justify-center gap-2 py-12 text-xs font-medium text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-600" /> Loading day book…
          </div>
        ) : report.error ? (
          <div className="m-4 flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
            <span className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> {report.error}
            </span>
            <Button type="button" variant="outline" size="sm" onClick={() => void report.reload()} className="bg-white text-xs">
              Retry
            </Button>
          </div>
        ) : filteredVouchers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <BookOpen className="h-5 w-5" />
            </span>
            <p className="text-sm font-semibold text-slate-700">
              {(report.data?.vouchers.length ?? 0) === 0
                ? `No vouchers posted on ${formatDate(appliedDate)}`
                : "No vouchers match these filters"}
            </p>
            <p className="text-xs text-slate-500">Pick another date or clear the filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-xs">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className={cn(th, "w-16 text-left")}>Time</th>
                  <th className={cn(th, "w-36 text-left")}>Voucher No</th>
                  <th className={cn(th, "w-20 text-center")}>Type</th>
                  <th className={cn(th, "text-left")}>Account / Particulars</th>
                  <th className={cn(th, "w-36 text-right")}>Debit (₹)</th>
                  <th className={cn(th, "w-36 text-right")}>Credit (₹)</th>
                </tr>
              </thead>
              <tbody>
                {filteredVouchers.map((v) => {
                  const vDebit = v.lines.reduce((s, l) => s + l.debit, 0);
                  const vCredit = v.lines.reduce((s, l) => s + l.credit, 0);
                  return (
                    <React.Fragment key={v.id}>
                      <tr
                        onClick={() => setEditVoucherId(v.id)}
                        title="Open to view or edit"
                        className="group cursor-pointer bg-slate-50/80 font-semibold text-slate-900 hover:bg-emerald-50/70"
                      >
                        <td className={cn(td, "tabular-nums text-slate-500")}>{voucherTime(v)}</td>
                        <td className={td}>
                          <span className="flex items-center gap-1.5">
                            {v.voucherNo}
                            <Pencil className="h-3 w-3 text-emerald-600 opacity-0 group-hover:opacity-100" />
                          </span>
                        </td>
                        <td className={cn(td, "text-center")}>
                          <span
                            className={cn(
                              "inline-block rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                              voucherTypeBadgeClass(v.voucherCategory)
                            )}
                          >
                            {v.voucherTypeCode ?? v.voucherCategory}
                          </span>
                        </td>
                        <td className={td}>
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="truncate">{primaryAccount(v)}</span>
                            {v.referenceNo && (
                              <span className="shrink-0 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                                Ref {v.referenceNo}
                              </span>
                            )}
                            {v.narration && (
                              <span className="truncate text-[11px] font-normal text-slate-500" title={v.narration}>
                                {v.narration}
                              </span>
                            )}
                          </span>
                        </td>
                        <td className={cn(td, "text-right tabular-nums")}>{formatINR(vDebit)}</td>
                        <td className={cn(td, "text-right tabular-nums")}>{formatINR(vCredit)}</td>
                      </tr>
                      {v.lines.map((l) => (
                        <tr key={l.id} className="text-slate-700">
                          <td className={td} />
                          <td className={td} />
                          <td className={cn(td, "text-center tabular-nums text-slate-400")}>{l.lineNo}</td>
                          <td className={cn(td, "pl-6")}>
                            <span className="mr-1.5 font-mono text-[11px] text-slate-400">{l.accountCode}</span>
                            {l.accountName}
                            {l.partyName && <span className="text-slate-400"> · {l.partyName}</span>}
                          </td>
                          <td className={cn(td, "text-right tabular-nums")}>{l.debit > 0 ? formatINR(l.debit) : ""}</td>
                          <td className={cn(td, "text-right tabular-nums")}>{l.credit > 0 ? formatINR(l.credit) : ""}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900">
                  <td className={cn(td, "py-2 text-right")} colSpan={4}>
                    Total ({filteredVouchers.length} vouchers)
                  </td>
                  <td className={cn(td, "py-2 text-right tabular-nums")}>{formatINR(totals.debit)}</td>
                  <td className={cn(td, "py-2 text-right tabular-nums")}>{formatINR(totals.credit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* Cash & Bank position */}
      <section className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Landmark className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Cash &amp; Bank Position</h2>
              <p className="text-[11px] text-slate-500">Opening, movement and closing for {formatDate(appliedDate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-semibold">
            <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-800">
              Inflow {formatINR(summary?.inflow ?? 0)}
            </span>
            <span className="rounded-lg bg-rose-50 px-2.5 py-1 text-rose-800">
              Outflow {formatINR(summary?.outflow ?? 0)}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-xs">
            <thead>
              <tr>
                <th className={cn(th, "text-left")}>Account</th>
                <th className={cn(th, "w-44 text-right")}>Opening (₹)</th>
                <th className={cn(th, "w-44 text-right")}>Net Movement (₹)</th>
                <th className={cn(th, "w-44 text-right")}>Closing (₹)</th>
              </tr>
            </thead>
            <tbody>
              {balanceRows.map((r) => {
                const net = r.closing - r.opening;
                return (
                  <tr key={r.label} className={cn(r.total ? "bg-slate-100 font-bold text-slate-900" : "text-slate-700")}>
                    <td className={cn(td, "py-2 font-semibold")}>{r.label}</td>
                    <td className={cn(td, "py-2 text-right tabular-nums")}>{formatINR(r.opening)}</td>
                    <td className={cn(td, "py-2 text-right tabular-nums", net >= 0 ? "text-emerald-700" : "text-rose-700")}>
                      {net >= 0 ? "+" : "−"}
                      {formatINR(Math.abs(net))}
                    </td>
                    <td className={cn(td, "py-2 text-right tabular-nums font-semibold text-slate-900")}>
                      {formatINR(r.closing)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {editVoucherId && (
        <VoucherEditModal
          voucherId={editVoucherId}
          onClose={() => setEditVoucherId(null)}
          onChanged={() => void report.reload()}
        />
      )}
    </ModulePageShell>
  );
}
