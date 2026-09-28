"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Printer,
  Search,
  SlidersHorizontal,
  Calendar,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Filter,
  ChevronDown,
  X,
  CreditCard,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatMiniCard, Drawer, FODatePicker } from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import { cn } from "@/lib/utils";
import { accCompanyService, accVoucherService, type Voucher, type VoucherDetail } from "@/services/accounts";
import {
  accErrorMessage,
  formatDate,
  formatINR,
  fyStartIso,
  todayIso,
  useAccLookups,
  useAccQuery,
} from "@/components/accounts/accountsApi";

type Toast = { message: string; variant: "success" | "error" } | null;

type AppliedFilters = {
  voucherTypeId: string;
  enableDate: boolean;
  from: string;
  to: string;
  provisional: boolean;
};

function downloadCsv(filename: string, header: string[], rows: (string | number | null | undefined)[][]) {
  const esc = (v: string | number | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
  "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function belowThousand(n: number): string {
  const parts: string[] = [];
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} Hundred`);
    n %= 100;
  }
  if (n >= 20) {
    parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : ""));
  } else if (n > 0) {
    parts.push(ONES[n]);
  }
  return parts.join(" ");
}

/** Indian numbering (Crore / Lakh / Thousand) amount in words. */
function amountToWords(value: number): string {
  const rupees = Math.floor(Math.abs(value));
  const paise = Math.round((Math.abs(value) - rupees) * 100);
  const words = (n: number): string => {
    if (n === 0) return "Zero";
    const parts: string[] = [];
    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    const lakh = Math.floor(n / 100000);
    n %= 100000;
    const thousand = Math.floor(n / 1000);
    n %= 1000;
    if (crore) parts.push(`${words(crore)} Crore`);
    if (lakh) parts.push(`${belowThousand(lakh)} Lakh`);
    if (thousand) parts.push(`${belowThousand(thousand)} Thousand`);
    if (n) parts.push(belowThousand(n));
    return parts.join(" ");
  };
  return `Rupees ${words(rupees)}${paise ? ` and ${belowThousand(paise)} Paise` : ""} Only.`;
}

export function ReprintVoucherView() {
  const { lookups } = useAccLookups();
  const companies = useAccQuery(() => accCompanyService.list(), []);

  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filter form (applied on Display)
  const [selectedVoucherType, setSelectedVoucherType] = useState("");
  const [enableVoucherDate, setEnableVoucherDate] = useState(true);
  const [fromDate, setFromDate] = useState(fyStartIso);
  const [toDate, setToDate] = useState(todayIso);
  const [provisionalTransaction, setProvisionalTransaction] = useState(false);
  const [printAnalysisCode, setPrintAnalysisCode] = useState(false);
  const [applied, setApplied] = useState<AppliedFilters>(() => ({
    voucherTypeId: "",
    enableDate: true,
    from: fyStartIso(),
    to: todayIso(),
    provisional: false,
  }));

  // Client-side filters
  const [enableVoucherNo, setEnableVoucherNo] = useState(false);
  const [fromVoucherNo, setFromVoucherNo] = useState("");
  const [toVoucherNo, setToVoucherNo] = useState("");
  const [vouchNoSearch, setVouchNoSearch] = useState("");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [printBatch, setPrintBatch] = useState<VoucherDetail[] | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const notify = (message: string, variant: "success" | "error" = "success") => setToast({ message, variant });

  const list = useAccQuery(
    () =>
      accVoucherService.list({
        status: applied.provisional ? "Provisional,Converted,Reversed" : "Posted,Reversed",
        provisional: applied.provisional,
        voucherTypeId: applied.voucherTypeId || undefined,
        from: applied.enableDate ? applied.from || undefined : undefined,
        to: applied.enableDate ? applied.to || undefined : undefined,
        limit: 2000,
      }),
    [applied],
  );
  const vouchers = useMemo(() => list.data ?? [], [list.data]);

  const voucherTypes = lookups?.voucherTypes ?? [];
  const appliedTypeName = voucherTypes.find((vt) => vt.id === applied.voucherTypeId)?.voucherTypeName ?? "All Voucher Types";

  const filteredVouchers = useMemo(() => {
    const q = vouchNoSearch.trim().toLowerCase();
    const cmp = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
    return vouchers.filter((item) => {
      if (enableVoucherNo) {
        if (fromVoucherNo.trim() && cmp(item.voucherNo, fromVoucherNo.trim()) < 0) return false;
        if (toVoucherNo.trim() && cmp(item.voucherNo, toVoucherNo.trim()) > 0) return false;
      }
      if (!q) return true;
      return [item.voucherNo, item.narration, item.partyName, item.debitAccounts, item.creditAccounts, item.preparedBy, item.referenceNo]
        .some((s) => (s ?? "").toLowerCase().includes(q));
    });
  }, [vouchers, enableVoucherNo, fromVoucherNo, toVoucherNo, vouchNoSearch]);

  const visibleSelected = filteredVouchers.filter((v) => selectedIds.has(v.id));
  const totalFound = filteredVouchers.length;
  const selectedCount = visibleSelected.length;
  const selectedTotalAmount = visibleSelected.reduce((sum, v) => sum + v.totalAmount, 0);
  const printedBeforeCount = filteredVouchers.filter((v) => v.reprintCount > 0).length;

  const handleDisplayVouchers = () => {
    setApplied({
      voucherTypeId: selectedVoucherType,
      enableDate: enableVoucherDate,
      from: fromDate,
      to: toDate,
      provisional: provisionalTransaction,
    });
    setSelectedIds(new Set());
    setMobileFilterOpen(false);
  };

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedCount === filteredVouchers.length && filteredVouchers.length > 0) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredVouchers.map((v) => v.id)));
  };

  const openPreview = async (ids: string[]) => {
    if (ids.length === 0) {
      notify("Please select at least one voucher to reprint.", "error");
      return;
    }
    setLoadingPreview(true);
    try {
      setPrintBatch(await Promise.all(ids.map((id) => accVoucherService.get(id))));
    } catch (e) {
      notify(accErrorMessage(e), "error");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handlePrint = async () => {
    if (!printBatch?.length) return;
    setPrinting(true);
    try {
      const updated = await Promise.all(printBatch.map((v) => accVoucherService.print(v.id)));
      setPrintBatch(updated);
      void list.reload();
      window.print();
      notify(`Sent ${updated.length} voucher(s) to the printer.`);
    } catch (e) {
      notify(accErrorMessage(e), "error");
    } finally {
      setPrinting(false);
    }
  };

  const handleExport = () => {
    if (filteredVouchers.length === 0) {
      notify("Nothing to export for the selected filters.", "error");
      return;
    }
    downloadCsv(
      "vouchers-reprint-list.csv",
      ["Voucher No", "Date", "Type", "Party", "Debit Accounts", "Credit Accounts", "Narration", "Amount", "Status", "Print Count"],
      filteredVouchers.map((v) => [
        v.voucherNo,
        v.voucherDate,
        v.voucherTypeName,
        v.partyName,
        v.debitAccounts,
        v.creditAccounts,
        v.narration,
        v.totalAmount,
        v.status,
        v.reprintCount,
      ]),
    );
    notify(`Exported ${filteredVouchers.length} vouchers to CSV.`);
  };

  const ledgerLabel = (v: Voucher) => v.partyName ?? (v.debitAccounts || v.creditAccounts || "—");
  const company = companies.data?.[0];

  const filterFormContent = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 items-start">
        {/* 1. Voucher Type Dropdown */}
        <div className="lg:col-span-3 rounded-xl bg-slate-50/70 p-3 border border-slate-200/70 space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">Voucher Type</label>
          <select
            value={selectedVoucherType}
            onChange={(e) => setSelectedVoucherType(e.target.value)}
            className="h-8 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
          >
            <option value="">All Voucher Types</option>
            {voucherTypes.map((vt) => (
              <option key={vt.id} value={vt.id}>
                {vt.voucherTypeName}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Voucher Date Group Box */}
        <div className="lg:col-span-3 rounded-xl bg-slate-50/70 p-3 border border-slate-200/70 space-y-2">
          <div className="flex items-center gap-1.5">
            <input
              type="checkbox"
              id="chk-vouch-date"
              checked={enableVoucherDate}
              onChange={(e) => setEnableVoucherDate(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer"
            />
            <label htmlFor="chk-vouch-date" className="text-[11px] font-bold uppercase tracking-wider text-slate-700 cursor-pointer">
              Voucher Date
            </label>
          </div>

          <div className={cn("space-y-1.5", !enableVoucherDate && "opacity-50 pointer-events-none")}>
            <div className="flex items-center justify-between gap-1 text-[11px]">
              <span className="text-slate-600 font-semibold w-16">From Date</span>
              <FODatePicker value={fromDate} onChange={setFromDate} className="flex-1" />
            </div>
            <div className="flex items-center justify-between gap-1 text-[11px]">
              <span className="text-slate-600 font-semibold w-16">To Date</span>
              <FODatePicker value={toDate} onChange={setToDate} className="flex-1" />
            </div>
          </div>
        </div>

        {/* 3. Voucher No Range Group Box */}
        <div className="lg:col-span-3 rounded-xl bg-slate-50/70 p-3 border border-slate-200/70 space-y-2">
          <div className="flex items-center gap-1.5">
            <input
              type="checkbox"
              id="chk-vouch-no"
              checked={enableVoucherNo}
              onChange={(e) => setEnableVoucherNo(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer"
            />
            <label htmlFor="chk-vouch-no" className="text-[11px] font-bold uppercase tracking-wider text-slate-700 cursor-pointer">
              Voucher No
            </label>
          </div>

          <div className={cn("space-y-1.5", !enableVoucherNo && "opacity-50 pointer-events-none")}>
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-slate-600 font-semibold w-14">From No</span>
              <input
                type="text"
                value={fromVoucherNo}
                onChange={(e) => setFromVoucherNo(e.target.value)}
                placeholder="e.g. JV/2026-27/00001"
                className="h-7 flex-1 rounded border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-slate-600 font-semibold w-14">To No</span>
              <input
                type="text"
                value={toVoucherNo}
                onChange={(e) => setToVoucherNo(e.target.value)}
                placeholder="e.g. JV/2026-27/00099"
                className="h-7 flex-1 rounded border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 4. Display Button & Options */}
        <div className="lg:col-span-3 rounded-xl bg-slate-50/70 p-3 border border-slate-200/70 space-y-2.5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Action</span>
            <Button
              type="button"
              size="sm"
              onClick={handleDisplayVouchers}
              disabled={list.loading}
              className="h-7 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              {list.loading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Search className="h-3.5 w-3.5 mr-1" />}
              Display
            </Button>
          </div>

          <div className="space-y-1 text-xs font-medium text-slate-700">
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-emerald-900">
              <input
                type="checkbox"
                checked={provisionalTransaction}
                onChange={(e) => setProvisionalTransaction(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
              />
              <span className="text-[11px]">Provisional Transaction</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer hover:text-emerald-900">
              <input
                type="checkbox"
                checked={printAnalysisCode}
                onChange={(e) => setPrintAnalysisCode(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
              />
              <span className="text-[11px]">Print Analysis Code</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ModulePageShell
      eyebrow="Accounts & Voucher Audit"
      title="Reprint Voucher"
      description="Search, preview, and batch reprint posted accounting Journal Vouchers, Receipts, Payments, and Sales transactions."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Transactions", href: "/accounts/transactions" },
        { label: "Reprint Voucher" },
      ]}
      toast={toast?.message ?? null}
      toastVariant={toast?.variant}
      onDismissToast={() => setToast(null)}
      secondaryActions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            disabled={selectedCount === 0 || loadingPreview}
            onClick={() => void openPreview(visibleSelected.map((v) => v.id))}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {loadingPreview ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Printer className="h-3.5 w-3.5 mr-1" />}
            Reprint Selected ({selectedCount})
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExport}
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
            className="rounded-xl border-slate-200 text-xs font-semibold gap-1.5 hidden md:inline-flex bg-white text-slate-700 cursor-pointer"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600" />
            <span>{showFilters ? "Hide Search Options" : "Voucher Search Options"}</span>
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", showFilters && "rotate-180")} />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMobileFilterOpen(true)}
            className="rounded-xl border-slate-200 text-xs font-semibold gap-1.5 md:hidden bg-white text-slate-700 cursor-pointer"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filter</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
            <FileText className="h-3.5 w-3.5 text-emerald-700" />
            Type: {appliedTypeName}
            {applied.provisional && " (Provisional)"}
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            <Calendar className="h-3.5 w-3.5 text-slate-600" />
            {applied.enableDate ? `${formatDate(applied.from)} to ${formatDate(applied.to)}` : "All Dates"}
          </span>
        </div>
      </div>

      {/* Desktop Filter Panel */}
      {showFilters && (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs animate-in fade-in-50">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Voucher Search &amp; Print Parameters
              </h3>
            </div>
            <button onClick={() => setShowFilters(false)} className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer">
              ✕ Hide Options
            </button>
          </div>
          {filterFormContent}
        </div>
      )}

      {/* Mobile Drawer */}
      <Drawer open={mobileFilterOpen} onClose={() => setMobileFilterOpen(false)} title="Voucher Search Options">
        <div className="p-4">
          {filterFormContent}
          <div className="mt-4 border-t border-slate-100 pt-3">
            <Button type="button" className="w-full bg-emerald-700 text-white" onClick={handleDisplayVouchers}>
              Apply Filter
            </Button>
          </div>
        </div>
      </Drawer>

      {/* KPI Stat Cards Grid */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <StatMiniCard
          label="Total Vouchers Found"
          value={`${totalFound} Vouchers`}
          sublabel="Available for reprint"
          accent="#0284c7"
          icon={FileText}
        />
        <StatMiniCard
          label="Selected for Reprint"
          value={`${selectedCount} Selected`}
          sublabel="Ready in print batch"
          accent="#16a34a"
          icon={Printer}
        />
        <StatMiniCard
          label="Selected Batch Value"
          value={formatINR(selectedTotalAmount)}
          sublabel="Total voucher amount"
          accent="#8b5cf6"
          icon={CreditCard}
        />
        <StatMiniCard
          label="Printed Before"
          value={`${printedBeforeCount} Vouchers`}
          sublabel="Will print as reprints"
          accent="#e11d48"
          icon={CheckCircle2}
        />
      </div>

      {/* Main Vouchers Table Card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Printer className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Vouchers Log List ({filteredVouchers.length} items)
            </h2>
          </div>

          <div className="flex items-center gap-3 flex-1 sm:flex-initial">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={vouchNoSearch}
                onChange={(e) => setVouchNoSearch(e.target.value)}
                placeholder="Search voucher #, narration or account..."
                className="h-8 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="text-xs border-slate-300 font-semibold cursor-pointer"
            >
              {selectedCount === filteredVouchers.length && filteredVouchers.length > 0 ? "Deselect All" : "Select All"}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="px-3 py-2.5 w-24">VouchDt</th>
                <th className="px-3.5 py-2.5 w-28">VouchNo</th>
                <th className="px-3.5 py-2.5 min-w-[200px]">Ledger Nm</th>
                <th className="px-4 py-2.5 min-w-[220px]">Narration</th>
                <th className="px-3 py-2.5 text-right w-28">Amt (₹)</th>
                <th className="px-3 py-2.5 text-center w-16">Select</th>
                <th className="px-3 py-2.5 text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {list.error ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-rose-700 font-medium">
                    <AlertCircle className="inline h-4 w-4 mr-1" />
                    {list.error}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void list.reload()}
                      className="ml-3 rounded-xl bg-white text-xs"
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry
                    </Button>
                  </td>
                </tr>
              ) : list.loading && !list.data ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                    <Loader2 className="inline h-4 w-4 mr-1 animate-spin text-emerald-600" /> Loading vouchers…
                  </td>
                </tr>
              ) : filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No vouchers found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((row) => {
                  const isSelected = selectedIds.has(row.id);
                  return (
                    <tr
                      key={row.id}
                      className={cn("hover:bg-slate-50 transition-colors", isSelected && "bg-amber-50/60 font-semibold")}
                    >
                      <td className="px-3 py-2.5 text-slate-700 font-medium">{formatDate(row.voucherDate)}</td>
                      <td className="px-3.5 py-2.5 font-bold text-slate-900">
                        {row.voucherNo}
                        {row.status !== "Posted" && (
                          <span className="block text-[9px] font-bold uppercase text-rose-600">{row.status}</span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-800 font-semibold">
                        <span className="block font-bold text-slate-900">{ledgerLabel(row)}</span>
                        <span className="block text-[10px] font-normal text-slate-400">
                          {row.voucherTypeName}
                          {row.reprintCount > 0 && ` • printed ${row.reprintCount}×`}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-800 font-medium leading-tight">{row.narration || "—"}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-slate-900 text-xs">{row.totalAmount.toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(row.id)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => void openPreview([row.id])}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                            title="Preview Printable Voucher"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedIds(new Set([row.id]));
                              void openPreview([row.id]);
                            }}
                            className="p-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 cursor-pointer"
                            title="Print Voucher"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Footer Action Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 bg-slate-50/60 p-2.5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-emerald-700">
              <input
                type="radio"
                name="selection-mode"
                checked={selectedCount === filteredVouchers.length && filteredVouchers.length > 0}
                onChange={handleSelectAll}
                className="text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
              />
              <span>Select All</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer hover:text-rose-700">
              <input
                type="radio"
                name="selection-mode"
                checked={selectedCount === 0}
                onChange={() => setSelectedIds(new Set())}
                className="text-rose-600 focus:ring-rose-500 h-3.5 w-3.5"
              />
              <span>Clear All</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={selectedCount === 0 || loadingPreview}
              onClick={() => void openPreview(visibleSelected.map((v) => v.id))}
              className="text-xs font-semibold bg-white border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
            >
              <Eye className="h-3.5 w-3.5 mr-1 text-slate-600" />
              Preview
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={selectedCount === 0 || loadingPreview}
              onClick={() => void openPreview(visibleSelected.map((v) => v.id))}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Printer className="h-3.5 w-3.5 mr-1" />
              Print
            </Button>

            <Link href="/accounts/dashboard">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs font-semibold bg-white border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Exit
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Printable Voucher Document Modal */}
      {printBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50 print:relative print:inset-auto print:z-auto print:bg-white print:p-0 print:block">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto print:max-w-none print:w-full print:p-0 print:border-none print:shadow-none print:max-h-none print:overflow-visible">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Printable Voucher Sheet
                  {printBatch.length === 1 ? ` (${printBatch[0].voucherNo})` : ` (${printBatch.length} vouchers)`}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={printing}
                  onClick={() => void handlePrint()}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer"
                >
                  {printing ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Printer className="h-3.5 w-3.5 mr-1" />}
                  Print Voucher{printBatch.length > 1 ? "s" : ""}
                </Button>
                <button
                  type="button"
                  onClick={() => setPrintBatch(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {printBatch.map((v) => (
              <div
                key={v.id}
                className="rounded-xl border border-slate-300 bg-white p-6 shadow-xs space-y-3 font-sans text-slate-900 break-after-page"
              >
                {/* Company Header Block */}
                <div className="text-center space-y-1 border-b border-slate-300 pb-3">
                  <h1 className="text-lg font-bold tracking-wide text-slate-900 font-sans">
                    {company ? company.legalName || company.tradeName : companies.loading ? "Loading company…" : "Company not configured"}
                  </h1>
                  {company && (
                    <>
                      <p className="text-[11px] text-slate-600 leading-tight">
                        {[company.addressLine1, company.addressLine2, company.city, company.district, company.state, company.pincode]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      {(company.telephone || company.mobile) && (
                        <p className="text-[11px] text-slate-600">Phone: {company.telephone || company.mobile}</p>
                      )}
                      {(company.email || company.website) && (
                        <p className="text-[11px] text-slate-600">
                          {company.email && `E-Mail: ${company.email}`} {company.website && `Web: ${company.website}`}
                        </p>
                      )}
                      {company.gstNumber && (
                        <p className="text-[11px] font-bold text-slate-800">
                          GSTIN: {company.gstNumber} {company.state && `State: ${company.state.toUpperCase()}`}
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Voucher Title Header Box */}
                <div className="border border-slate-300 p-2 space-y-1">
                  <div className="text-center">
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      {v.voucherTypeName ?? v.voucherCategory}
                      {v.status === "Reversed" && " (Reversed)"}
                    </h2>
                    {v.reprintCount > 0 && (
                      <p className="text-[10px] font-bold uppercase text-rose-700">Duplicate — Reprint #{v.reprintCount}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold px-2">
                    <span>Voucher No : {v.voucherNo}</span>
                    <span>Date : {formatDate(v.voucherDate)}</span>
                  </div>
                  {(v.partyName || v.referenceNo || v.instrumentNo) && (
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] px-2 text-slate-700">
                      {v.partyName && <span>Party : {v.partyName}</span>}
                      {v.referenceNo && <span>Ref : {v.referenceNo}</span>}
                      {v.instrumentNo && (
                        <span>
                          Instrument : {v.instrumentNo}
                          {v.instrumentDate ? ` (${formatDate(v.instrumentDate)})` : ""}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Particulars Grid Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-[11px] border-b border-slate-300">
                        <th className="px-2.5 py-1.5 border-r border-slate-300 w-20">GLCode</th>
                        <th className="px-3 py-1.5 border-r border-slate-300">Account Head</th>
                        <th className="px-3 py-1.5 border-r border-slate-300">Description</th>
                        <th className="px-3 py-1.5 text-right border-r border-slate-300 w-28">Debit Amt</th>
                        <th className="px-3 py-1.5 text-right w-28">Credit Amt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {v.lines.map((l) => (
                        <tr key={l.id} className="h-10">
                          <td className="px-2.5 py-1.5 border-r border-slate-200 font-mono text-[11px]">{l.accountCode}</td>
                          <td className="px-3 py-1.5 border-r border-slate-200 font-bold text-slate-900">{l.accountName}</td>
                          <td className="px-3 py-1.5 border-r border-slate-200 text-slate-700 text-[11px]">
                            {[l.partyName, l.chequeNo && `Chq ${l.chequeNo}`, printAnalysisCode && l.divisionName]
                              .filter(Boolean)
                              .join(" • ") || "-"}
                          </td>
                          <td className="px-3 py-1.5 text-right border-r border-slate-200 font-semibold">
                            {l.debit > 0 ? l.debit.toFixed(2) : ""}
                          </td>
                          <td className="px-3 py-1.5 text-right font-semibold">{l.credit > 0 ? l.credit.toFixed(2) : ""}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 font-bold border-t border-slate-300 text-xs">
                        <td colSpan={3} className="px-3 py-2 text-right uppercase font-bold text-slate-800">
                          Total
                        </td>
                        <td className="px-3 py-2 text-right border-x border-slate-300 font-bold text-slate-900">
                          {v.lines.reduce((s, l) => s + l.debit, 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-slate-900">
                          {v.lines.reduce((s, l) => s + l.credit, 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Amount In Words & Narration Box */}
                <div className="border border-slate-300 p-2.5 text-xs space-y-1 bg-slate-50/50">
                  <p>
                    <strong className="text-slate-800">Amount In Words:</strong>{" "}
                    <span className="font-bold text-slate-900">{amountToWords(v.totalAmount)}</span>
                  </p>
                  <p>
                    <strong className="text-slate-800">Narration :</strong>{" "}
                    <span className="font-semibold text-slate-900">{v.narration || "—"}</span>
                  </p>
                </div>

                <div className="pt-8 grid grid-cols-3 gap-4 text-center text-xs text-slate-800 font-semibold">
                  <div>
                    <p className="border-t border-slate-400 pt-1">Prepared By{v.preparedBy ? ` (${v.preparedBy})` : ""}</p>
                  </div>
                  <div>
                    <p className="border-t border-slate-400 pt-1">Checked By</p>
                  </div>
                  <div>
                    <p className="border-t border-slate-400 pt-1">Authorised Signatory</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ModulePageShell>
  );
}
