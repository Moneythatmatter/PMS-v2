"use client";

import React, { useState, useMemo } from "react";
import {
  BookOpen,
  Building2,
  CheckCircle2,
  Printer,
  Download,
  Search,
  X,
  Eye,
  DollarSign,
  Landmark,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import {
  FormField,
  FODatePicker,
  formatINR,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import { accReportService, type Voucher, type VoucherCategory } from "@/services/accounts";
import { useAccLookups, useAccQuery, todayIso, formatDate } from "@/components/accounts/accountsApi";
import { cn } from "@/lib/utils";

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

export function DayBookView() {
  // Selected Date State
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [appliedDate, setAppliedDate] = useState(todayIso());

  // Filters State
  const [voucherTypeFilter, setVoucherTypeFilter] = useState("All");
  const [divisionFilter, setDivisionFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Inspect Voucher Modal State
  const [inspectVoucher, setInspectVoucher] = useState<Voucher | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { lookups, loading: lookupsLoading } = useAccLookups();
  const company =
    lookups?.companies.find((c) => c.status === "Active") ?? lookups?.companies[0] ?? null;

  const report = useAccQuery(
    () =>
      accReportService.dayBook({
        date: appliedDate,
        voucherTypeId: voucherTypeFilter !== "All" ? voucherTypeFilter : undefined,
      }),
    [appliedDate, voucherTypeFilter]
  );
  const summary = report.data?.summary;

  const handleFetch = () => {
    if (!selectedDate) {
      setToastMessage("Select a register date.");
      return;
    }
    if (selectedDate === appliedDate) void report.reload();
    else setAppliedDate(selectedDate);
  };

  // Filtered Vouchers List
  const filteredVouchers = useMemo(() => {
    const vouchersList = report.data?.vouchers ?? [];
    return vouchersList.filter((v) => {
      if (
        divisionFilter !== "All" &&
        v.divisionId !== divisionFilter &&
        !v.lines.some((l) => l.divisionId === divisionFilter)
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          v.voucherNo.toLowerCase().includes(q) ||
          primaryAccount(v).toLowerCase().includes(q) ||
          (v.referenceNo ?? "").toLowerCase().includes(q) ||
          (v.narration ?? "").toLowerCase().includes(q) ||
          v.lines.some(
            (l) =>
              (l.accountName ?? "").toLowerCase().includes(q) ||
              (l.partyName ?? "").toLowerCase().includes(q) ||
              (l.narration ?? "").toLowerCase().includes(q)
          )
        );
      }
      return true;
    });
  }, [report.data, divisionFilter, searchQuery]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalCount = filteredVouchers.length;
    const totalVolume = filteredVouchers.reduce((sum, v) => sum + v.totalAmount, 0);
    return { totalCount, totalVolume };
  }, [filteredVouchers]);

  const openingCash = summary?.openingCash ?? 0;
  const closingCash = summary?.closingCash ?? 0;
  const openingBank = (summary?.openingCashBank ?? 0) - openingCash;
  const closingBank = (summary?.closingCashBank ?? 0) - closingCash;

  // Helper for Voucher Type Badges
  const getVoucherTypeBadgeClass = (category: VoucherCategory) => {
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
  };

  // ─────────────────────────────────────────────────────────────
  // CLEAN EXCEL-READY CSV EXPORT
  // ─────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (!report.data) {
      setToastMessage("Nothing to export yet — fetch the Day Book first.");
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
      "VOUCHER DATE",
      "VOUCHER TIME",
      "VOUCHER NO",
      "VOUCHER TYPE",
      "PRIMARY ACCOUNT",
      "REF NO",
      "LINE NO",
      "GL CODE",
      "GL ACCOUNT",
      "PARTICULARS",
      "DEBIT (INR)",
      "CREDIT (INR)",
      "DIVISION",
      "CREATED BY",
    ];

    const dataRows = filteredVouchers.flatMap((v) =>
      v.lines.map((l) => [
        v.voucherDate,
        voucherTime(v),
        v.voucherNo,
        v.voucherTypeName ?? v.voucherCategory,
        primaryAccount(v),
        v.referenceNo,
        l.lineNo,
        l.accountCode ?? "",
        l.accountName ?? "",
        l.narration || v.narration,
        l.debit,
        l.credit,
        l.divisionName ?? v.divisionName ?? "",
        v.preparedBy ?? "",
      ])
    );

    const csvContent =
      "\uFEFF" +
      [headers, ...dataRows]
        .map((row) => row.map(escapeCSV).join(","))
        .join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `PMS_Day_Book_${appliedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToastMessage("Day Book exported to Excel-ready CSV.");
  };

  const selectClass =
    "h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900";

  return (
    <ModulePageShell
      eyebrow="Accounts &amp; Reports"
      title="Day Book"
      description="Chronological daily transaction register of all General Ledger vouchers, debit/credit postings, and cash/bank summary."
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleFetch}
            disabled={report.loading}
            className="rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-2xs cursor-pointer px-3.5"
          >
            {report.loading ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <BookOpen className="h-3.5 w-3.5 mr-1" />
            )}
            Fetch Day Book
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-lg text-xs font-semibold bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Print Register
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
      {/* Top Active Target Entity & Date Selector Bar */}
      <div className="mt-4 mb-4 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <Building2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="flex-1 max-w-sm">
              <span className="font-bold text-[11px] uppercase tracking-wider text-slate-600 block mb-1">
                Company Entity:
              </span>
              <div className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-900 flex items-center truncate">
                {company ? `${company.legalName || company.tradeName} (${company.companyCode})` : "—"}
              </div>
            </div>

            <div className="w-44">
              <span className="font-bold text-[11px] uppercase tracking-wider text-slate-600 block mb-1">
                Selected Register Date:
              </span>
              <FODatePicker value={selectedDate} onChange={setSelectedDate} placeholder="DD/MM/YYYY" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-emerald-800 border border-emerald-200 font-bold">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
              {metrics.totalCount} Vouchers Posted on {formatDate(appliedDate)}
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-slate-700 border border-slate-200 font-mono">
              <BookOpen className="h-3.5 w-3.5 text-slate-600" />
              Daily Volume: {formatINR(metrics.totalVolume)}
            </span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2.5 border-t border-slate-100 text-xs">
          {/* Voucher Type Filter */}
          <FormField label="Voucher Type Filter">
            <select
              value={voucherTypeFilter}
              disabled={lookupsLoading}
              onChange={(e) => setVoucherTypeFilter(e.target.value)}
              className={selectClass}
            >
              <option value="All">All Voucher Types</option>
              {(lookups?.voucherTypes ?? []).map((vt) => (
                <option key={vt.id} value={vt.id}>
                  {vt.voucherTypeName} ({vt.shortCode})
                </option>
              ))}
            </select>
          </FormField>

          {/* Division Filter */}
          <FormField label="Division Filter">
            <select
              value={divisionFilter}
              disabled={lookupsLoading}
              onChange={(e) => setDivisionFilter(e.target.value)}
              className={selectClass}
            >
              <option value="All">All Property Divisions</option>
              {(lookups?.divisions ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.divisionName}
                </option>
              ))}
            </select>
          </FormField>

          {/* Keyword Search */}
          <FormField label="Search Register Keyword">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Voucher #, Account, Ref #..."
                className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-7 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </FormField>
        </div>
      </div>

      {report.loading && !report.data ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-white text-xs text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          Loading day book…
        </div>
      ) : report.error ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-rose-200 bg-rose-50/40">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-500 mb-2" />
          <p className="text-sm font-semibold text-slate-700">Could not load day book</p>
          <p className="text-xs text-slate-500 mt-1">{report.error}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => void report.reload()} className="mt-3">
            Retry
          </Button>
        </div>
      ) : (
        <>
          {/* Standard Vertical KPI Cards Grid (F&B / Front Office Style) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {/* Card 1: Total Vouchers Posted */}
            <Card className="h-full min-w-0 p-3 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
                  Total Vouchers Posted
                </p>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 sm:h-8 sm:w-8">
                  <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </span>
              </div>
              <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl truncate font-mono">
                {metrics.totalCount} Vouchers
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs truncate">
                Daily Transaction Count
              </p>
            </Card>

            {/* Card 2: Total Daily Debit / Credit */}
            <Card className="h-full min-w-0 p-3 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
                  Total Daily Debit / Credit
                </p>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 sm:h-8 sm:w-8">
                  <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </span>
              </div>
              <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl truncate font-mono">
                {formatINR(summary?.totalDebit ?? 0)}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs truncate">
                Dr {formatINR(summary?.totalDebit ?? 0)} / Cr {formatINR(summary?.totalCredit ?? 0)}
              </p>
            </Card>

            {/* Card 3: Cash Closing Balance */}
            <Card className="h-full min-w-0 p-3 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
                  Cash Closing Balance
                </p>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-700 sm:h-8 sm:w-8">
                  <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </span>
              </div>
              <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl truncate font-mono">
                {formatINR(closingCash)}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs truncate">
                All cash-in-hand accounts
              </p>
            </Card>

            {/* Card 4: Bank Closing Balance */}
            <Card className="h-full min-w-0 p-3 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
                  Bank Closing Balance
                </p>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 sm:h-8 sm:w-8">
                  <Landmark className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </span>
              </div>
              <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl truncate font-mono">
                {formatINR(closingBank)}
              </p>
              <p className="mt-0.5 text-[11px] text-emerald-700 font-semibold sm:text-xs truncate">
                All bank accounts
              </p>
            </Card>
          </div>

          {/* Day Book Detailed Register Table */}
          <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs font-sans text-xs space-y-4 mb-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-600" />
                Chronological Daily Register Entries ({filteredVouchers.length} Vouchers)
              </h3>
              <span className="font-mono text-[11px] text-slate-500 font-semibold">
                Date: {formatDate(appliedDate)}
              </span>
            </div>

            <div className="space-y-4">
              {filteredVouchers.length === 0 ? (
                <div className="py-8 text-center text-slate-400 font-semibold italic border border-dashed border-slate-200 rounded-xl">
                  {(report.data?.vouchers.length ?? 0) === 0
                    ? `No vouchers were posted on ${formatDate(appliedDate)}.`
                    : "No matching vouchers posted in the Day Book for the selected filter parameters."}
                </div>
              ) : (
                filteredVouchers.map((voucher) => (
                  <div
                    key={voucher.id}
                    className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs space-y-0"
                  >
                    {/* Voucher Header Bar */}
                    <div className="bg-slate-50 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-500 text-[11px]">
                          {voucherTime(voucher)}
                        </span>

                        <span
                          className={cn(
                            "px-2 py-0.5 rounded font-mono font-bold text-[10px] border uppercase tracking-wider",
                            getVoucherTypeBadgeClass(voucher.voucherCategory)
                          )}
                        >
                          {voucher.voucherTypeCode ?? voucher.voucherCategory}
                        </span>

                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {voucher.voucherNo}
                        </span>

                        <span className="text-slate-600 font-semibold">
                          • {primaryAccount(voucher)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {voucher.referenceNo && (
                          <span className="font-mono text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700">
                            Ref: {voucher.referenceNo}
                          </span>
                        )}

                        <span className="font-mono font-bold text-emerald-800">
                          Total: {formatINR(voucher.totalAmount)}
                        </span>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setInspectVoucher(voucher)}
                          className="h-6 px-2 text-[10px] font-semibold rounded-md border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-slate-700"
                        >
                          <Eye className="h-3 w-3 mr-1 text-slate-500" />
                          Inspect
                        </Button>
                      </div>
                    </div>

                    {/* Voucher Line Items Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50/50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                            <th className="py-2 px-4 border-r border-slate-200 w-12">#</th>
                            <th className="py-2 px-4 border-r border-slate-200 w-64">GL Account</th>
                            <th className="py-2 px-4 border-r border-slate-200">Particulars / Narration</th>
                            <th className="py-2 px-3 text-right border-r border-slate-200 w-36">Debit (INR)</th>
                            <th className="py-2 px-3 text-right w-36">Credit (INR)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                          {voucher.lines.map((line) => (
                            <tr key={line.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-2.5 px-4 font-mono text-slate-400 border-r border-slate-100">
                                {line.lineNo}
                              </td>

                              <td className="py-2.5 px-4 font-semibold text-slate-900 border-r border-slate-100">
                                <span className="font-mono text-slate-500 font-normal mr-1.5">
                                  {line.accountCode}
                                </span>
                                <span>{line.accountName}</span>
                                {line.partyName && (
                                  <span className="block text-[10px] font-normal text-slate-500">{line.partyName}</span>
                                )}
                              </td>

                              <td className="py-2.5 px-4 text-slate-600 border-r border-slate-100">
                                {line.narration || voucher.narration || "—"}
                              </td>

                              <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 border-r border-slate-100">
                                {line.debit > 0 ? formatINR(line.debit) : "-"}
                              </td>

                              <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                                {line.credit > 0 ? formatINR(line.credit) : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Cash & Bank Daily Balance Reconciliation Summary */}
          <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs font-sans text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Landmark className="h-4 w-4 text-emerald-600" />
                Daily Cash &amp; Bank Balance Reconciliation Summary
              </h3>
              <span className="font-mono text-[11px] text-slate-500 font-semibold">
                Date: {formatDate(appliedDate)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Cash Summary Panel */}
              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2 font-mono">
                <div className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-1.5 flex justify-between">
                  <span>CASH IN HAND SUMMARY</span>
                  <span className="text-slate-500 text-[10px]">ALL CASH ACCOUNTS</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Opening Cash Balance:</span>
                    <strong className="text-slate-900">{formatINR(openingCash)}</strong>
                  </div>
                  <div className={cn("flex justify-between", closingCash - openingCash >= 0 ? "text-emerald-800" : "text-rose-700")}>
                    <span>(±) Net Cash Movement Today:</span>
                    <strong>{formatINR(closingCash - openingCash)}</strong>
                  </div>
                  <div className="flex justify-between border-t border-slate-300 pt-1.5 text-slate-900 font-bold text-sm">
                    <span>Closing Cash Balance:</span>
                    <span className="text-emerald-800">{formatINR(closingCash)}</span>
                  </div>
                </div>
              </div>

              {/* Bank Summary Panel */}
              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2 font-mono">
                <div className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-1.5 flex justify-between">
                  <span>BANK ACCOUNTS SUMMARY</span>
                  <span className="text-slate-500 text-[10px]">ALL BANK ACCOUNTS</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Opening Bank Balance:</span>
                    <strong className="text-slate-900">{formatINR(openingBank)}</strong>
                  </div>
                  <div className={cn("flex justify-between", closingBank - openingBank >= 0 ? "text-emerald-800" : "text-rose-700")}>
                    <span>(±) Net Bank Movement Today:</span>
                    <strong>{formatINR(closingBank - openingBank)}</strong>
                  </div>
                  <div className="flex justify-between border-t border-slate-300 pt-1.5 text-slate-900 font-bold text-sm">
                    <span>Closing Bank Balance:</span>
                    <span className="text-emerald-800">{formatINR(closingBank)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Combined Cash + Bank Flow */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 font-mono text-xs grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div className="flex justify-between sm:block">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Opening Cash + Bank</span>
                <strong className="text-slate-900">{formatINR(summary?.openingCashBank ?? 0)}</strong>
              </div>
              <div className="flex justify-between sm:block text-emerald-800">
                <span className="text-[10px] font-bold uppercase block">(+) Total Inflow</span>
                <strong>{formatINR(summary?.inflow ?? 0)}</strong>
              </div>
              <div className="flex justify-between sm:block text-rose-700">
                <span className="text-[10px] font-bold uppercase block">(-) Total Outflow</span>
                <strong>{formatINR(summary?.outflow ?? 0)}</strong>
              </div>
              <div className="flex justify-between sm:block">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Closing Cash + Bank</span>
                <strong className="text-emerald-800">{formatINR(summary?.closingCashBank ?? 0)}</strong>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Inspect Voucher Modal */}
      {inspectVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-xl p-5 space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div>
                <span className="font-mono text-[10px] uppercase text-slate-500 font-bold">
                  Day Book Register Inspection
                </span>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <span className="font-mono">{inspectVoucher.voucherNo}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {inspectVoucher.status}
                  </span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectVoucher(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Voucher Date</span>
                <span className="font-bold text-slate-900">
                  {formatDate(inspectVoucher.voucherDate)}
                  {voucherTime(inspectVoucher) ? ` (${voucherTime(inspectVoucher)})` : ""}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Division</span>
                <span className="font-bold text-slate-900">{inspectVoucher.divisionName ?? "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Created By</span>
                <span className="font-bold text-slate-900">{inspectVoucher.preparedBy ?? "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Reference No</span>
                <span className="font-bold text-slate-900">{inspectVoucher.referenceNo || "N/A"}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Narration</span>
                <span className="font-semibold text-slate-800 font-sans">{inspectVoucher.narration || "—"}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-slate-900 block text-xs">Line Entries:</span>
              <div className="border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">GL Account Description</th>
                      <th className="py-2 px-3 text-right">Debit (INR)</th>
                      <th className="py-2 px-3 text-right">Credit (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {inspectVoucher.lines.map((l) => (
                      <tr key={l.id}>
                        <td className="py-2 px-3 text-slate-400">{l.lineNo}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{l.accountName}</td>
                        <td className="py-2 px-3 text-right font-bold">
                          {l.debit > 0 ? formatINR(l.debit) : "-"}
                        </td>
                        <td className="py-2 px-3 text-right font-bold">
                          {l.credit > 0 ? formatINR(l.credit) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="rounded-lg text-xs font-semibold cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5 mr-1" />
                Print Voucher
              </Button>
              <Button
                size="sm"
                onClick={() => setInspectVoucher(null)}
                className="rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs cursor-pointer px-3.5"
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
