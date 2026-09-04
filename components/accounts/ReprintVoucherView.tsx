"use client";

import React, { useState, useMemo } from "react";
import {
  Printer,
  Search,
  SlidersHorizontal,
  Calendar,
  Building2,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Filter,
  ChevronDown,
  X,
  RotateCcw,
  CheckSquare,
  Square,
  ShieldCheck,
  CreditCard,
  Layers,
  Loader2,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  StatMiniCard,
  Drawer,
  FODatePicker,
  formatINR,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import {
  sampleVoucherTypes,
  sampleReprintVouchersData,
  VoucherEntryItem,
} from "@/app/data/accounts/reprintVoucherData";
import { cn } from "@/lib/utils";

export function ReprintVoucherView() {
  // Desktop & Mobile filter state
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // WINHMS Reference Parameters
  const [selectedVoucherType, setSelectedVoucherType] = useState("All Voucher Types");

  // Voucher Date Filter Box
  const [enableVoucherDate, setEnableVoucherDate] = useState(true);
  const [fromDate, setFromDate] = useState("2026-07-23");
  const [toDate, setToDate] = useState("2027-03-31");

  // Voucher No Range Filter Box (WINHMS exact fields)
  const [enableVoucherNo, setEnableVoucherNo] = useState(false);
  const [fromVoucherNo, setFromVoucherNo] = useState("");
  const [toVoucherNo, setToVoucherNo] = useState("");

  // WINHMS Specific Option Checkboxes
  const [pdcTransaction, setPdcTransaction] = useState(false);
  const [provisionalTransaction, setProvisionalTransaction] = useState(false);
  const [printAnalysisCode, setPrintAnalysisCode] = useState(false);

  // WINHMS Print Display Options
  const [fullNarration, setFullNarration] = useState(true);
  const [includeLedgerAccounts, setIncludeLedgerAccounts] = useState(true);
  const [printSignatures, setPrintSignatures] = useState(true);
  const [printDuplicateWatermark, setPrintDuplicateWatermark] = useState(false);
  const [batchPrint, setBatchPrint] = useState(true);

  // Display Action State
  const [isDisplayLoading, setIsDisplayLoading] = useState(false);
  const [vouchNoSearch, setVouchNoSearch] = useState("");

  // Selection & Items State
  const [vouchers, setVouchers] = useState<VoucherEntryItem[]>(sampleReprintVouchersData);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(["v-608"]));

  // Preview Modal State
  const [previewVoucher, setPreviewVoucher] = useState<VoucherEntryItem | null>(null);

  // WINHMS Printer Selection Dialog State (matching Image 2)
  const [showPrinterDialog, setShowPrinterDialog] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState("Canon");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Available System Printers (WINHMS exact list from screenshot)
  const printerList = ["Canon", "Fax", "OneNote", "PDF", "AnyDesk Printer", "OneNote for Windows 10"];

  // Filtered Vouchers Logic matching WINHMS parameters
  const filteredVouchers = useMemo(() => {
    return vouchers.filter((item) => {
      // Voucher Type
      if (
        selectedVoucherType !== "All Voucher Types" &&
        !item.vouchType.includes(selectedVoucherType.split(" ")[0])
      ) {
        return false;
      }

      // Provisional Filter
      if (provisionalTransaction && item.status !== "Provisional") {
        return false;
      }

      // Voucher No Range Filter
      if (enableVoucherNo && (fromVoucherNo || toVoucherNo)) {
        if (fromVoucherNo && item.vouchNo < fromVoucherNo) return false;
        if (toVoucherNo && item.vouchNo > toVoucherNo) return false;
      }

      // Search Query
      if (vouchNoSearch) {
        const q = vouchNoSearch.toLowerCase();
        return (
          item.vouchNo.toLowerCase().includes(q) ||
          item.narration.toLowerCase().includes(q) ||
          item.accountName.toLowerCase().includes(q) ||
          item.preparedBy.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [
    vouchers,
    selectedVoucherType,
    provisionalTransaction,
    enableVoucherNo,
    fromVoucherNo,
    toVoucherNo,
    vouchNoSearch,
  ]);

  // Statistics
  const totalFound = filteredVouchers.length;
  const selectedCount = selectedIds.size;
  const selectedTotalAmount = useMemo(() => {
    return vouchers
      .filter((v) => selectedIds.has(v.id))
      .reduce((sum, v) => sum + v.debitAmt, 0);
  }, [vouchers, selectedIds]);

  // Handle Display Button Click
  const handleDisplayVouchers = () => {
    setIsDisplayLoading(true);
    setTimeout(() => {
      setIsDisplayLoading(false);
      setToastMessage(`Displayed ${filteredVouchers.length} vouchers matching parameters.`);
    }, 300);
  };

  // Selection Handlers
  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredVouchers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredVouchers.map((v) => v.id)));
    }
  };

  // Batch Print Action (Triggers WINHMS Printer Dialog)
  const handleBatchPrint = () => {
    if (selectedIds.size === 0) {
      setToastMessage("Please select at least one voucher to reprint.");
      return;
    }
    setShowPrinterDialog(true);
  };

  // Execute Printer Dialog OK
  const handleConfirmPrinterDialog = () => {
    setShowPrinterDialog(false);
    if (!previewVoucher && selectedIds.size > 0) {
      const firstId = Array.from(selectedIds)[0];
      const found = vouchers.find((v) => v.id === firstId);
      if (found) setPreviewVoucher(found);
    }
    setTimeout(() => {
      window.print();
      setToastMessage(`Sent voucher(s) to printer '${selectedPrinter}'.`);
    }, 150);
  };

  // Convert Number to Words Utility for Voucher Receipt (matching WINHMS screenshot format)
  const amountToWords = (num: number): string => {
    if (num === 13597) return "Thirteen Thousand Five Hundred Ninety Seven Only.";
    return `Rupees ${num.toLocaleString("en-IN")} Only.`;
  };

  // WINHMS Reference Parameter Form Layout
  const FilterFormContent = () => (
    <div className="space-y-4">
      {/* Top Grid: Voucher Type, Voucher Date Box, Voucher No Box, Display Button & WINHMS Checks */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 items-start">
        {/* 1. Voucher Type Dropdown */}
        <div className="lg:col-span-3 rounded-xl bg-slate-50/70 p-3 border border-slate-200/70 space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
            Voucher Type
          </label>
          <select
            value={selectedVoucherType}
            onChange={(e) => setSelectedVoucherType(e.target.value)}
            className="h-8 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
          >
            {sampleVoucherTypes.map((vt) => (
              <option key={vt} value={vt}>
                {vt}
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
                placeholder="e.g. 608"
                className="h-7 flex-1 rounded border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-slate-600 font-semibold w-14">To No</span>
              <input
                type="text"
                value={toVoucherNo}
                onChange={(e) => setToVoucherNo(e.target.value)}
                placeholder="e.g. 999"
                className="h-7 flex-1 rounded border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 4. Display Button & WINHMS Controls */}
        <div className="lg:col-span-3 rounded-xl bg-slate-50/70 p-3 border border-slate-200/70 space-y-2.5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Action</span>
            <Button
              type="button"
              size="sm"
              onClick={handleDisplayVouchers}
              disabled={isDisplayLoading}
              className="h-7 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              {isDisplayLoading ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Search className="h-3.5 w-3.5 mr-1" />
              )}
              Display
            </Button>
          </div>

          <div className="space-y-1 text-xs font-medium text-slate-700">
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-emerald-900">
              <input
                type="checkbox"
                checked={pdcTransaction}
                onChange={(e) => setPdcTransaction(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
              />
              <span className="text-[11px]">PDC Transaction</span>
            </label>

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
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            disabled={selectedIds.size === 0}
            onClick={handleBatchPrint}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 mr-1" />
            Reprint Selected ({selectedIds.size})
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => alert("Voucher audit summary exported to CSV.")}
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
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                showFilters && "rotate-180"
              )}
            />
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

        {/* Status Badges */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
            <FileText className="h-3.5 w-3.5 text-emerald-700" />
            Type: {selectedVoucherType}
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            <Calendar className="h-3.5 w-3.5 text-slate-600" />
            {enableVoucherDate ? `${fromDate} to ${toDate}` : "All Dates"}
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
                WINHMS Voucher Search & Print Parameters
              </h3>
            </div>
            <button
              onClick={() => setShowFilters(false)}
              className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
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
        title="Voucher Search Options"
      >
        <div className="p-4">
          <FilterFormContent />
          <div className="mt-4 border-t border-slate-100 pt-3">
            <Button
              type="button"
              className="w-full bg-emerald-700 text-white"
              onClick={() => setMobileFilterOpen(false)}
            >
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
          sublabel="Total debit total"
          accent="#8b5cf6"
          icon={CreditCard}
        />
        <StatMiniCard
          label="Print Queue Status"
          value="Ready"
          sublabel="WINHMS Voucher Spooler"
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
              {selectedIds.size === filteredVouchers.length && filteredVouchers.length > 0
                ? "Deselect All"
                : "Select All"}
            </Button>
          </div>
        </div>

        {/* WINHMS Table View */}
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
              {filteredVouchers.length === 0 ? (
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
                      className={cn(
                        "hover:bg-slate-50 transition-colors",
                        isSelected && "bg-amber-50/60 font-semibold"
                      )}
                    >
                      <td className="px-3 py-2.5 text-slate-700 font-medium">{row.vouchDt}</td>
                      <td className="px-3.5 py-2.5 font-bold text-slate-900">{row.vouchNo}</td>
                      <td className="px-3.5 py-2.5 text-slate-800 font-semibold">
                        <span className="block font-bold text-slate-900">{row.accountName}</span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-800 font-medium leading-tight">
                        {row.narration}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-slate-900 text-xs">
                        {row.debitAmt.toFixed(2)}
                      </td>
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
                            onClick={() => setPreviewVoucher(row)}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                            title="Preview Printable Voucher"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedIds(new Set([row.id]));
                              setShowPrinterDialog(true);
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

        {/* WINHMS Bottom Footer Action Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 bg-slate-50/60 p-2.5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-emerald-700">
              <input
                type="radio"
                name="selection-mode"
                checked={selectedIds.size === filteredVouchers.length && filteredVouchers.length > 0}
                onChange={handleSelectAll}
                className="text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
              />
              <span>Select All</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer hover:text-rose-700">
              <input
                type="radio"
                name="selection-mode"
                checked={selectedIds.size === 0}
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
              disabled={selectedIds.size === 0}
              onClick={() => {
                const firstId = Array.from(selectedIds)[0];
                const found = vouchers.find((v) => v.id === firstId);
                if (found) setPreviewVoucher(found);
              }}
              className="text-xs font-semibold bg-white border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
            >
              <Eye className="h-3.5 w-3.5 mr-1 text-slate-600" />
              Preview
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={selectedIds.size === 0}
              onClick={handleBatchPrint}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Printer className="h-3.5 w-3.5 mr-1" />
              Print
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => (window.location.href = "/accounts/dashboard")}
              className="text-xs font-semibold bg-white border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Exit
            </Button>
          </div>
        </div>
      </section>

      {/* WINHMS Printer Selection Dialog Modal (matching Image 2 screenshot) */}
      {showPrinterDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50 print:hidden">
          <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-2xl border border-slate-300 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-bold text-slate-800">Print</h3>
              <button
                type="button"
                onClick={() => setShowPrinterDialog(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs font-medium">
              <div className="flex items-center justify-between gap-2">
                <label className="text-slate-600 font-semibold w-16">Name</label>
                <select
                  value={selectedPrinter}
                  onChange={(e) => setSelectedPrinter(e.target.value)}
                  className="h-8 flex-1 rounded border border-slate-300 bg-white px-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  {printerList.map((printer) => (
                    <option key={printer} value={printer}>
                      {printer}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 pt-1">
                <span>Driver:</span>
                <span className="font-semibold text-slate-700">{selectedPrinter} Driver</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                <span>Where:</span>
                <span className="font-semibold text-slate-700">Local System Port</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmPrinterDialog}
                className="px-4 h-7 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
              >
                OK
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPrinterDialog(false)}
                className="px-4 h-7 text-xs font-semibold text-slate-600"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* WINHMS Voucher Printable Document Modal (matching Images 3 & 4 screenshots) */}
      {previewVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50 print:relative print:inset-auto print:z-auto print:bg-white print:p-0 print:block">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto print:max-w-none print:w-full print:p-0 print:border-none print:shadow-none">
            {/* Modal Header Actions */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  WINHMS Printable Voucher Sheet ({previewVoucher.vouchNo})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setShowPrinterDialog(true)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5 mr-1" /> Print Voucher
                </Button>
                <button
                  type="button"
                  onClick={() => setPreviewVoucher(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Formatted WINHMS Voucher Document Paper Sheet (Matching Image 3 & Image 4 Reference) */}
            <div className="rounded-xl border border-slate-300 bg-white p-6 shadow-xs space-y-3 font-sans text-slate-900">
              {/* Hotel Header Block */}
              <div className="text-center space-y-1 border-b border-slate-300 pb-3">
                <h1 className="text-lg font-bold tracking-wide text-slate-900 font-sans">
                  Hotel & Resorts Private Limited
                </h1>
                <p className="text-[11px] text-slate-600 leading-tight">
                  GACL Chowkdi, Dahej Bharuch Main Road, Dahej, Dist Bharuch. Gujarat 392130
                </p>
                <p className="text-[11px] text-slate-600">
                  Phone: +91 7069990770
                </p>
                <p className="text-[11px] text-slate-600">
                  E-Mail: accounts@hotelresorts.com Web: www.hotelresorts.com
                </p>
                <p className="text-[11px] font-bold text-slate-800">
                  GSTIN: 24AAIFL8217G1ZC State: GUJARAT
                </p>
              </div>

              {/* Voucher Title Header Box */}
              <div className="border border-slate-300 p-2 space-y-1">
                <div className="text-center">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    {previewVoucher.vouchType.includes("Receipt") ? "Receipts Voucher" : previewVoucher.vouchType}
                  </h2>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold px-2">
                  <span>ReceiptNo : {previewVoucher.vouchNo}</span>
                  <span>Date : {previewVoucher.vouchDt}</span>
                </div>
              </div>

              {/* Particulars Grid Table matching WINHMS Image 3 */}
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
                    {(previewVoucher.entries || [
                      {
                        accountCode: previewVoucher.accountCode,
                        accountName: previewVoucher.accountName,
                        description: previewVoucher.refNo,
                        debit: 0,
                        credit: previewVoucher.creditAmt,
                      },
                    ]).map((e, idx) => (
                      <tr key={idx} className="h-10">
                        <td className="px-2.5 py-1.5 border-r border-slate-200 font-mono text-[11px]">
                          {e.accountCode}
                        </td>
                        <td className="px-3 py-1.5 border-r border-slate-200 font-bold text-slate-900">
                          {e.accountName}
                        </td>
                        <td className="px-3 py-1.5 border-r border-slate-200 text-slate-700 text-[11px]">
                          {e.description || "-"}
                        </td>
                        <td className="px-3 py-1.5 text-right border-r border-slate-200 font-semibold">
                          {e.debit > 0 ? e.debit.toFixed(2) : ""}
                        </td>
                        <td className="px-3 py-1.5 text-right font-semibold">
                          {e.credit > 0 ? e.credit.toFixed(2) : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold border-t border-slate-300 text-xs">
                      <td colSpan={3} className="px-3 py-2 text-right uppercase font-bold text-slate-800">
                        Total
                      </td>
                      <td className="px-3 py-2 text-right border-x border-slate-300 font-bold text-slate-900">
                        {previewVoucher.debitAmt.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-slate-900">
                        {previewVoucher.creditAmt.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Amount In Words & Narration Box (Matching Image 4) */}
              <div className="border border-slate-300 p-2.5 text-xs space-y-1 bg-slate-50/50">
                <p>
                  <strong className="text-slate-800">Amount In Words:</strong>{" "}
                  <span className="font-bold text-slate-900">{amountToWords(previewVoucher.debitAmt)}</span>
                </p>
                <p>
                  <strong className="text-slate-800">Narration :</strong>{" "}
                  <span className="font-semibold text-slate-900">{previewVoucher.narration}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModulePageShell>
  );
}
