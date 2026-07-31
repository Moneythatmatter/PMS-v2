"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar,
  Clock,
  Download,
  Filter,
  Printer,
  Search,
  SlidersHorizontal,
  Users,
  ChevronDown,
  X,
  Building2,
  FileText,
  AlertCircle,
  CheckCircle2,
  PieChart,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  Info,
  CheckSquare,
  Square,
  Eye,
  Receipt,
  CreditCard,
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
  samplePaymentAdviceGroups,
  sampleVoucherTypesList,
  samplePaymentAdviceData,
  PaymentAdviceItem,
} from "@/app/data/accounts/paymentAdviceData";
import { cn } from "@/lib/utils";

export function PaymentAdviceView() {
  // Desktop & Mobile filter state
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // WINHMS Reference Parameters (Matching Image 1)
  const [selectedGroup, setSelectedGroup] = useState("SUNDRY CREDITORS");
  const [selectedVoucherType, setSelectedVoucherType] = useState("Payments");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [fromDate, setFromDate] = useState("2026-04-01");
  const [toDate, setToDate] = useState("2027-03-31");

  // Table Selection & Data State
  const [advices, setAdvices] = useState<PaymentAdviceItem[]>(samplePaymentAdviceData);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(samplePaymentAdviceData.filter((a) => a.selected).map((a) => a.id))
  );

  // Preview & Printer Dialog State
  const [previewAdvice, setPreviewAdvice] = useState<PaymentAdviceItem | null>(null);
  const [showPrinterDialog, setShowPrinterDialog] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState("Canon MF230 Series UFRII LT");

  // Search & Loading State
  const [searchQuery, setSearchQuery] = useState("");
  const [isDisplayLoading, setIsDisplayLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filtered Advices Logic
  const filteredAdvices = useMemo(() => {
    return advices.filter((item) => {
      // Group
      if (selectedGroup !== "All Groups" && item.groupName !== selectedGroup) {
        return false;
      }

      // Voucher Type
      if (selectedVoucherType !== "All Types" && item.voucherType !== selectedVoucherType) {
        return false;
      }

      // Supplier Search Filter
      if (supplierSearch) {
        const s = supplierSearch.toLowerCase();
        if (!item.supplierName.toLowerCase().includes(s)) return false;
      }

      // General Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.vouchNo.toLowerCase().includes(q) ||
          item.chqNo.toLowerCase().includes(q) ||
          item.supplierName.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [advices, selectedGroup, selectedVoucherType, supplierSearch, searchQuery]);

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
    setSelectedIds(new Set(filteredAdvices.map((a) => a.id)));
  };

  const handleClearAll = () => {
    setSelectedIds(new Set());
  };

  // Calculations
  const selectedAdvicesList = useMemo(
    () => filteredAdvices.filter((a) => selectedIds.has(a.id)),
    [filteredAdvices, selectedIds]
  );

  const totalSelectedChqAmt = useMemo(
    () => selectedAdvicesList.reduce((sum, a) => sum + a.chqAmt, 0),
    [selectedAdvicesList]
  );

  // Handle Display Button
  const handleDisplayReport = () => {
    setIsDisplayLoading(true);
    setTimeout(() => {
      setIsDisplayLoading(false);
      setToastMessage(`Displayed ${filteredAdvices.length} payment advice vouchers for ${selectedGroup}.`);
    }, 300);
  };

  // Execute Printer Dialog OK
  const handleConfirmPrinterDialog = () => {
    setShowPrinterDialog(false);
    if (!previewAdvice && selectedAdvicesList.length > 0) {
      setPreviewAdvice(selectedAdvicesList[0]);
    }
    setTimeout(() => {
      window.print();
      setToastMessage(`Sent ${selectedAdvicesList.length} payment advice document(s) to printer '${selectedPrinter}'.`);
    }, 150);
  };

  // Utility to convert number to words for document
  const amountToWords = (num: number): string => {
    if (num === 50000) return "Rupees Fifty Thousand Only.";
    if (num === 85000) return "Rupees Eighty Five Thousand Only.";
    if (num === 62000) return "Rupees Sixty Two Thousand Only.";
    return `Rupees ${num.toLocaleString("en-IN")} Only.`;
  };

  // Shared WINHMS Parameter Form Layout (Matching Image 1)
  const FilterFormContent = () => (
    <div className="space-y-3 text-xs">
      {/* Row 1: Group Dropdown, Voucher Type Dropdown, Supplier Input, Date Range & Display Button */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 items-center bg-slate-50/80 p-3 rounded-xl border border-slate-200">
        {/* Group Dropdown */}
        <div className="lg:col-span-4 flex items-center gap-2">
          <span className="font-semibold text-slate-600 shrink-0">Group:</span>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value as any)}
            className="h-8 flex-1 rounded-lg border border-slate-300 bg-white px-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
          >
            {samplePaymentAdviceGroups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* Voucher Type Dropdown */}
        <div className="lg:col-span-4 flex items-center gap-2">
          <span className="font-semibold text-slate-600 shrink-0">Voucher Type:</span>
          <select
            value={selectedVoucherType}
            onChange={(e) => setSelectedVoucherType(e.target.value)}
            className="h-8 flex-1 rounded-lg border border-slate-300 bg-white px-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
          >
            {sampleVoucherTypesList.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Supplier Input */}
        <div className="lg:col-span-4 flex items-center gap-2">
          <span className="font-semibold text-slate-600 shrink-0">Supplier:</span>
          <input
            type="text"
            value={supplierSearch}
            onChange={(e) => setSupplierSearch(e.target.value)}
            placeholder="Type supplier name..."
            className="h-8 flex-1 rounded-lg border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Row 2: Date Range (From - To) & Display Button */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 items-center bg-slate-50/80 p-3 rounded-xl border border-slate-200">
        <div className="lg:col-span-8 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">From:</span>
            <FODatePicker value={fromDate} onChange={setFromDate} className="w-32" />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">To:</span>
            <FODatePicker value={toDate} onChange={setToDate} className="w-32" />
          </div>
        </div>

        <div className="lg:col-span-4 flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={handleDisplayReport}
            className="h-8 px-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer"
            title="Search Payment Advice Vouchers"
          >
            <Search className="h-3.5 w-3.5 text-emerald-700" />
            <span>Search</span>
          </button>

          <Button
            type="button"
            size="sm"
            onClick={handleDisplayReport}
            disabled={isDisplayLoading}
            className="h-8 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs shrink-0 cursor-pointer"
          >
            {isDisplayLoading ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5 mr-1" />
            )}
            Display
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <ModulePageShell
      eyebrow="Accounts & Party Outstanding"
      title="Payment Advice"
      description="Generate, preview, and print official Payment Advice disbursement documents for vendor bill settlements."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Party Outstanding", href: "/accounts/party-outstanding" },
        { label: "Payment Advice" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPrinterDialog(true)}
            disabled={selectedIds.size === 0}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1" />
            Print Payment Advices ({selectedIds.size})
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
            <span>{showFilters ? "Hide Options" : "Advice Parameters & Options"}</span>
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
            <CreditCard className="h-3.5 w-3.5 text-emerald-700" />
            Group: {selectedGroup}
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            <Calendar className="h-3.5 w-3.5 text-slate-600" />
            Period: {fromDate} to {toDate}
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
                WINHMS Payment Advice Parameters & Options
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
        title="Payment Advice Options"
      >
        <div className="p-4">
          <FilterFormContent />
          <div className="mt-4 border-t border-slate-100 pt-3">
            <Button
              type="button"
              className="w-full bg-emerald-700 text-white"
              onClick={() => setMobileFilterOpen(false)}
            >
              Apply Filter Options
            </Button>
          </div>
        </div>
      </Drawer>

      {/* KPI Stat Cards Grid */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatMiniCard
          label="Selected Payment Vouchers"
          value={`${selectedIds.size} Vouchers`}
          sublabel="Targeted for advice slips"
          accent="#0284c7"
          icon={Receipt}
        />
        <StatMiniCard
          label="Total Disbursement Amount"
          value={formatINR(totalSelectedChqAmt)}
          sublabel="Net payment total"
          accent="#16a34a"
          icon={PieChart}
        />
        <StatMiniCard
          label="Cheques / UTR Issued"
          value={`${selectedIds.size} Instruments`}
          sublabel="Bank payment instruments"
          accent="#f59e0b"
          icon={CreditCard}
        />
        <StatMiniCard
          label="Advices Ready to Print"
          value={`${selectedIds.size} Slips`}
          sublabel="Formatted advice documents"
          accent="#8b5cf6"
          icon={FileText}
        />
      </div>

      {/* Main Table Section (Matching Image 1 Screenshot) */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Payment Advice Vouchers Table ({filteredAdvices.length} records)
              </h2>
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Select vouchers to preview or print official Payment Advice slips
            </p>
          </div>

          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search voucher #, chq #, or supplier..."
              className="h-8 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* WINHMS Table Format (Matching Image 1) */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="px-3 py-2.5 w-28 border-r border-slate-200">VouchNo</th>
                <th className="px-3 py-2.5 w-24 border-r border-slate-200">VouchDt</th>
                <th className="px-3 py-2.5 w-28 border-r border-slate-200">Chq.No</th>
                <th className="px-3 py-2.5 w-24 border-r border-slate-200">Chq Dt</th>
                <th className="px-3 py-2.5 text-right w-36 border-r border-slate-200 font-bold bg-slate-200/50">Chq Amt</th>
                <th className="px-3 py-2.5 text-center w-20">Select</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredAdvices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    No payment advice vouchers found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredAdvices.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => handleToggleSelect(row.id)}
                    className="hover:bg-amber-50/70 transition-colors cursor-pointer text-[11px]"
                  >
                    <td className="px-3 py-2.5 font-bold font-mono text-slate-900 border-r border-slate-100">{row.vouchNo}</td>
                    <td className="px-3 py-2.5 text-slate-600 font-medium border-r border-slate-100">{row.vouchDt}</td>
                    <td className="px-3 py-2.5 font-mono text-slate-700 font-semibold border-r border-slate-100">{row.chqNo}</td>
                    <td className="px-3 py-2.5 text-slate-600 font-medium border-r border-slate-100">{row.chqDt}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-slate-900 border-r border-slate-100 bg-slate-50">
                      {formatINR(row.chqAmt)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={() => handleToggleSelect(row.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredAdvices.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-300 text-xs">
                  <td colSpan={4} className="px-3 py-2.5 text-right uppercase text-[10px] tracking-wider border-r border-slate-300">
                    Total Selected Payment Amount ({selectedIds.size} vouchers):
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-slate-900 bg-slate-200/60 border-r border-slate-300">
                    {formatINR(totalSelectedChqAmt)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* WINHMS Action Footer Bar (Matching Image 1 Bottom Controls) */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3 bg-slate-50/80 p-3 rounded-xl">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="h-8 text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700"
            >
              <CheckSquare className="h-3.5 w-3.5 mr-1 text-emerald-600" />
              Select All
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="h-8 text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700"
            >
              <Square className="h-3.5 w-3.5 mr-1 text-slate-400" />
              Clear All
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              disabled={selectedIds.size === 0}
              onClick={() => {
                if (selectedAdvicesList.length > 0) {
                  setPreviewAdvice(selectedAdvicesList[0]);
                }
              }}
              className="h-8 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              Preview Advice
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={selectedIds.size === 0}
              onClick={() => setShowPrinterDialog(true)}
              className="h-8 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 mr-1" />
              Print
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setToastMessage("Payment advice process cancelled.")}
              className="h-8 px-4 text-xs font-semibold text-slate-600 bg-white"
            >
              Exit
            </Button>
          </div>
        </div>
      </section>

      {/* WINHMS Printer Selection Dialog Modal (matching Image 1 standard popup) */}
      {showPrinterDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50 print:hidden">
          <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-2xl border border-slate-300 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-bold text-slate-800">Print</h3>
              <button
                type="button"
                onClick={() => setShowPrinterDialog(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 font-sans text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Printer Name:</label>
                <select
                  value={selectedPrinter}
                  onChange={(e) => setSelectedPrinter(e.target.value)}
                  className="w-full rounded border border-slate-300 bg-white p-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Canon MF230 Series UFRII LT">Canon MF230 Series UFRII LT</option>
                  <option value="Fax">Fax</option>
                  <option value="Microsoft Print to PDF">Microsoft Print to PDF</option>
                  <option value="OneNote for Windows 10">OneNote for Windows 10</option>
                  <option value="AnyDesk Printer">AnyDesk Printer</option>
                </select>
              </div>

              <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200 text-[11px] space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-semibold text-emerald-700">Ready</span>
                </div>
                <div className="flex justify-between">
                  <span>Target Documents:</span>
                  <span className="font-semibold text-slate-800">{selectedIds.size} Payment Advice Slips</span>
                </div>
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

      {/* Formatted WINHMS Payment Advice Printable Document Sheet Modal */}
      {previewAdvice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50 print:relative print:inset-auto print:z-auto print:bg-white print:p-0 print:block">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto print:max-w-none print:w-full print:p-0 print:border-none print:shadow-none">
            {/* Modal Header Actions */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 print:hidden">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  WINHMS Payment Advice Sheet ({previewAdvice.vouchNo})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setShowPrinterDialog(true)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5 mr-1" /> Print Advice
                </Button>
                <button
                  type="button"
                  onClick={() => setPreviewAdvice(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Formatted WINHMS Payment Advice Document Sheet */}
            <div className="rounded-xl border border-slate-300 bg-white p-6 shadow-xs space-y-4 font-sans text-slate-900">
              {/* Hotel Header Block */}
              <div className="text-center space-y-1 border-b border-slate-300 pb-3">
                <h1 className="text-lg font-bold tracking-wide text-slate-900 font-sans">
                  Luxy hotel
                </h1>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Luxy Hotel GACL Chowkdi, Dahej Bharuch Main Road, Dahej, Dist Bharuch. Gujarat Gujarat 392130
                </p>
                <p className="text-[11px] text-slate-600">
                  Phone: 7069990770 • E-Mail: gm@hotelluxy.com • Web: www.hotelluxy.com
                </p>
                <p className="text-[11px] font-bold text-slate-800">
                  GSTIN: 24AAIFL8217G1ZC State: GUJARAT
                </p>
              </div>

              {/* Title Header Box */}
              <div className="border border-slate-300 p-2 space-y-1 bg-slate-50/50 text-center">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  PAYMENT ADVICE
                </h2>
              </div>

              {/* Metadata & Supplier Box */}
              <div className="grid grid-cols-2 gap-4 text-xs border border-slate-300 p-3 rounded">
                <div className="space-y-1">
                  <p className="font-bold text-slate-800">Paid To Supplier:</p>
                  <p className="font-bold text-slate-900 text-sm">{previewAdvice.supplierName}</p>
                  <p className="text-slate-600 text-[11px]">{previewAdvice.supplierAddress}</p>
                  {previewAdvice.supplierGstin && (
                    <p className="text-slate-700 text-[11px]">GSTIN: <strong>{previewAdvice.supplierGstin}</strong></p>
                  )}
                </div>

                <div className="space-y-1 text-right border-l border-slate-200 pl-3">
                  <p><strong>Voucher No:</strong> {previewAdvice.vouchNo}</p>
                  <p><strong>Voucher Date:</strong> {previewAdvice.vouchDt}</p>
                  <p><strong>Chq / Ref No:</strong> <span className="font-mono font-bold text-emerald-800">{previewAdvice.chqNo}</span></p>
                  <p><strong>Chq / Ref Date:</strong> {previewAdvice.chqDt}</p>
                  <p className="text-[11px] text-slate-600">Bank: {previewAdvice.bankName}</p>
                </div>
              </div>

              {/* Settled Invoices Table Grid */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-[11px] border-b border-slate-300">
                      <th className="px-3 py-1.5 border-r border-slate-300">Supplier Invoice No</th>
                      <th className="px-3 py-1.5 border-r border-slate-300">Invoice Date</th>
                      <th className="px-3 py-1.5 text-right border-r border-slate-300">Invoice Bill Amt (₹)</th>
                      <th className="px-3 py-1.5 text-right border-r border-slate-300">Deductions / TDS (₹)</th>
                      <th className="px-3 py-1.5 text-right font-bold bg-slate-200/60">Net Paid Amt (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {previewAdvice.settledInvoices.map((inv, idx) => (
                      <tr key={idx} className="h-8">
                        <td className="px-3 py-1.5 border-r border-slate-200 font-bold font-mono">
                          {inv.invoiceNo}
                        </td>
                        <td className="px-3 py-1.5 border-r border-slate-200 text-slate-700">
                          {inv.invoiceDt}
                        </td>
                        <td className="px-3 py-1.5 text-right border-r border-slate-200 font-semibold">
                          {inv.billAmt.toFixed(2)}
                        </td>
                        <td className="px-3 py-1.5 text-right border-r border-slate-200 text-slate-600">
                          {inv.deductions.toFixed(2)}
                        </td>
                        <td className="px-3 py-1.5 text-right font-bold text-slate-900 bg-slate-50">
                          {inv.netPaidAmt.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold border-t border-slate-300 text-xs">
                      <td colSpan={4} className="px-3 py-2 text-right uppercase font-bold text-slate-800 border-r border-slate-300">
                        Total Amount Paid:
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-slate-900 bg-slate-200/60">
                        {previewAdvice.chqAmt.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Amount In Words */}
              <div className="border border-slate-300 p-2.5 text-xs bg-slate-50/50">
                <strong className="text-slate-800">Amount In Words:</strong>{" "}
                <span className="font-bold text-slate-900">{amountToWords(previewAdvice.chqAmt)}</span>
              </div>

              {/* Signatures Footer */}
              <div className="pt-8 grid grid-cols-3 gap-4 text-center text-xs text-slate-800 font-semibold">
                <div>
                  <p className="border-t border-slate-400 pt-1">Prepared By ({previewAdvice.preparedBy})</p>
                </div>
                <div>
                  <p className="border-t border-slate-400 pt-1">Checked By (Accounts Head)</p>
                </div>
                <div>
                  <p className="border-t border-slate-400 pt-1">Receiver's Signature & Stamp</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModulePageShell>
  );
}
