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
  FileSpreadsheet,
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
  sampleCoveringPrintGroups,
  sampleCoveringPrintData,
  CoveringLetterPrintVoucher,
} from "@/app/data/accounts/billCoveringLetterPrintData";
import { cn } from "@/lib/utils";

export function BillCoveringLetterPrintView() {
  // Desktop & Mobile filter state
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // WINHMS Reference Parameters
  const [selectedGroup, setSelectedGroup] = useState("SUNDRY DEBTORS");
  const [partySearch, setPartySearch] = useState("");
  const [trnNoSearch, setTrnNoSearch] = useState("");
  const [fromDate, setFromDate] = useState("2026-04-01");
  const [toDate, setToDate] = useState("2027-03-31");

  // Table Data & Selection State
  const [vouchers, setVouchers] = useState<CoveringLetterPrintVoucher[]>(sampleCoveringPrintData);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(sampleCoveringPrintData.filter((v) => v.selected).map((v) => v.id))
  );

  // Preview & Printer Dialog State
  const [previewVoucher, setPreviewVoucher] = useState<CoveringLetterPrintVoucher | null>(null);
  const [showPrinterDialog, setShowPrinterDialog] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState("Canon MF230 Series UFRII LT");

  // Search & Loading State
  const [searchQuery, setSearchQuery] = useState("");
  const [isDisplayLoading, setIsDisplayLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filtered Vouchers Logic
  const filteredVouchers = useMemo(() => {
    return vouchers.filter((item) => {
      // Group
      if (selectedGroup !== "All Groups" && item.partyGroup !== selectedGroup) {
        return false;
      }

      // Party Search Filter
      if (partySearch && !item.partyName.toLowerCase().includes(partySearch.toLowerCase())) {
        return false;
      }

      // Trn No Search Filter
      if (trnNoSearch && !item.trnNo.toLowerCase().includes(trnNoSearch.toLowerCase())) {
        return false;
      }

      // General Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.trnNo.toLowerCase().includes(q) ||
          item.partyName.toLowerCase().includes(q) ||
          item.preparedBy.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [vouchers, selectedGroup, partySearch, trnNoSearch, searchQuery]);

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
    setSelectedIds(new Set(filteredVouchers.map((v) => v.id)));
  };

  const handleClearAll = () => {
    setSelectedIds(new Set());
  };

  // Calculations
  const selectedVouchersList = useMemo(
    () => filteredVouchers.filter((v) => selectedIds.has(v.id)),
    [filteredVouchers, selectedIds]
  );

  const totalSelectedAmt = useMemo(
    () => selectedVouchersList.reduce((sum, v) => sum + v.totalAmount, 0),
    [selectedVouchersList]
  );

  // Primary Client for preview letter
  const activePreview = previewVoucher || (selectedVouchersList.length > 0 ? selectedVouchersList[0] : sampleCoveringPrintData[0]);

  // Handle Display Button
  const handleDisplayReport = () => {
    setIsDisplayLoading(true);
    setTimeout(() => {
      setIsDisplayLoading(false);
      setToastMessage(`Displayed ${filteredVouchers.length} bill covering letter vouchers for printing.`);
    }, 300);
  };

  // Execute Printer Dialog OK
  const handleConfirmPrinterDialog = () => {
    setShowPrinterDialog(false);
    if (!previewVoucher && selectedVouchersList.length > 0) {
      setPreviewVoucher(selectedVouchersList[0]);
    }
    setTimeout(() => {
      window.print();
      setToastMessage(`Sent ${selectedIds.size} Bill Covering Letter(s) to printer '${selectedPrinter}'.`);
    }, 150);
  };

  // Export CSV Report
  const handleExportCSV = () => {
    const csvHeader = "TrnNo,TrnDt,PartyName,Group,BillsCount,TotalAmount,PreparedBy\n";
    const csvRows = filteredVouchers
      .map(
        (v) =>
          `"${v.trnNo}","${v.trnDt}","${v.partyName}","${v.partyGroup}","${v.billsCount}","${v.totalAmount}","${v.preparedBy}"`
      )
      .join("\n");
    const blob = new Blob([csvHeader + csvRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Bill_Covering_Letter_Print_Report_${fromDate}_to_${toDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMessage("Exported Bill Covering Letter report to CSV.");
  };

  // Utility to convert number to words for document
  const amountToWords = (num: number): string => {
    if (num === 295000) return "Rupees Two Lakh Ninety Five Thousand Only.";
    if (num === 145000) return "Rupees One Lakh Forty Five Thousand Only.";
    if (num === 220000) return "Rupees Two Lakh Twenty Thousand Only.";
    return `Rupees ${num.toLocaleString("en-IN")} Only.`;
  };

  // Shared WINHMS Parameter Form Layout
  const FilterFormContent = () => (
    <div className="space-y-3 text-xs">
      {/* Row 1: Group Dropdown, Party Search, Covering Letter No, Date Range & Display Button */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 items-center bg-slate-50/80 p-3 rounded-xl border border-slate-200">
        {/* Group Dropdown */}
        <div className="lg:col-span-4 flex items-center gap-2">
          <span className="font-semibold text-slate-600 shrink-0">Group:</span>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value as any)}
            className="h-8 flex-1 rounded-lg border border-slate-300 bg-white px-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
          >
            {sampleCoveringPrintGroups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* Party Input */}
        <div className="lg:col-span-4 flex items-center gap-2">
          <span className="font-semibold text-slate-600 shrink-0">Party:</span>
          <input
            type="text"
            value={partySearch}
            onChange={(e) => setPartySearch(e.target.value)}
            placeholder="Type party name..."
            className="h-8 flex-1 rounded-lg border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Trn No Input */}
        <div className="lg:col-span-4 flex items-center gap-2">
          <span className="font-semibold text-slate-600 shrink-0">Trn No:</span>
          <input
            type="text"
            value={trnNoSearch}
            onChange={(e) => setTrnNoSearch(e.target.value)}
            placeholder="e.g. BCL-2026-0041"
            className="h-8 flex-1 font-mono font-bold rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
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
            Display Vouchers
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <ModulePageShell
      eyebrow="Accounts & Party Outstanding"
      title="Bill Covering Letter Print"
      description="Query, preview, and re-print official Bill Covering Letters for customer invoice submission and dispatch tracking."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Party Outstanding", href: "/accounts/party-outstanding" },
        { label: "Bill Covering Letter Print" },
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
            Print Selected ({selectedIds.size})
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
            <span>{showFilters ? "Hide Options" : "Print Parameters & Options"}</span>
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
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" />
            Selected: {selectedIds.size} / {filteredVouchers.length} Vouchers
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
                WINHMS Bill Covering Letter Print Parameters & Options
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
        title="Print Filter Options"
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
          label="Total Covering Letters"
          value={`${filteredVouchers.length} Vouchers`}
          sublabel="Issued in date range"
          accent="#0284c7"
          icon={FileSpreadsheet}
        />
        <StatMiniCard
          label="Total Enclosed Amount"
          value={formatINR(filteredVouchers.reduce((sum, v) => sum + v.totalAmount, 0))}
          sublabel="Net enclosed value"
          accent="#16a34a"
          icon={PieChart}
        />
        <StatMiniCard
          label="Selected for Printing"
          value={`${selectedIds.size} Statements`}
          sublabel="Targeted for print"
          accent="#f59e0b"
          icon={Printer}
        />
        <StatMiniCard
          label="Batch Print Readiness"
          value={`${selectedIds.size} Ready`}
          sublabel="Formatted documents"
          accent="#8b5cf6"
          icon={FileText}
        />
      </div>

      {/* Main Table Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Printer className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Issued Bill Covering Letters Table ({filteredVouchers.length} records)
              </h2>
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Select covering letter vouchers to preview or print official statement documents
            </p>
          </div>

          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search voucher # or party..."
              className="h-8 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* WINHMS Table Format */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="px-3 py-2.5 w-12 border-r border-slate-200 text-center">#</th>
                <th className="px-3 py-2.5 w-28 border-r border-slate-200">Trn No</th>
                <th className="px-3 py-2.5 w-24 border-r border-slate-200">Trn Dt</th>
                <th className="px-3.5 py-2.5 min-w-[240px] border-r border-slate-200">Party Name</th>
                <th className="px-3 py-2.5 w-28 border-r border-slate-200">Group</th>
                <th className="px-2.5 py-2.5 w-24 border-r border-slate-200 text-center">Bills Count</th>
                <th className="px-3 py-2.5 text-right w-36 border-r border-slate-200 font-bold bg-slate-200/50">Total Amount</th>
                <th className="px-3 py-2.5 w-32 border-r border-slate-200">Prepared By</th>
                <th className="px-3 py-2.5 text-center w-20">Select</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                    No bill covering letter vouchers found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((row, idx) => (
                  <tr
                    key={row.id}
                    onClick={() => handleToggleSelect(row.id)}
                    className="hover:bg-amber-50/70 transition-colors cursor-pointer text-[11px]"
                  >
                    <td className="px-3 py-2.5 text-center font-bold text-slate-500 border-r border-slate-100">{idx + 1}</td>
                    <td className="px-3 py-2.5 font-bold font-mono text-slate-900 border-r border-slate-100">{row.trnNo}</td>
                    <td className="px-3 py-2.5 text-slate-600 font-medium border-r border-slate-100">{row.trnDt}</td>
                    <td className="px-3.5 py-2.5 border-r border-slate-100">
                      <span className="font-bold text-slate-900 block">{row.partyName}</span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-700 font-medium border-r border-slate-100">{row.partyGroup}</td>
                    <td className="px-2.5 py-2.5 text-center font-bold text-slate-800 border-r border-slate-100">
                      {row.billsCount} Bills
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-slate-900 border-r border-slate-100 bg-slate-50">
                      {formatINR(row.totalAmount)}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 border-r border-slate-100">{row.preparedBy}</td>
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
            {filteredVouchers.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-300 text-xs">
                  <td colSpan={6} className="px-3 py-2.5 text-right uppercase text-[10px] tracking-wider border-r border-slate-300">
                    Grand Total Balance ({selectedIds.size} vouchers):
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-slate-900 bg-slate-200/60 border-r border-slate-300">
                    {formatINR(totalSelectedAmt)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* WINHMS Action Footer Bar */}
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
                if (selectedVouchersList.length > 0) {
                  setPreviewVoucher(selectedVouchersList[0]);
                }
              }}
              className="h-8 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              Preview Document
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={selectedIds.size === 0}
              onClick={() => setShowPrinterDialog(true)}
              className="h-8 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 mr-1" />
              Print Selected
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-8 px-3.5 text-xs font-semibold text-slate-700 bg-white"
            >
              <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
              Export CSV
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setToastMessage("Bill covering letter print process exited.")}
              className="h-8 px-4 text-xs font-semibold text-slate-600 bg-white"
            >
              Exit
            </Button>
          </div>
        </div>
      </section>

      {/* WINHMS Printer Selection Dialog Modal (matching standard popup) */}
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
                  <span className="font-semibold text-slate-800">{selectedIds.size} Covering Letters</span>
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

      {/* Formatted WINHMS Bill Covering Letter Printable Document Sheet Modal */}
      {previewVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50 print:relative print:inset-auto print:z-auto print:bg-white print:p-0 print:block">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto print:max-w-none print:w-full print:p-0 print:border-none print:shadow-none">
            {/* Modal Header Actions */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 print:hidden">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  WINHMS Bill Covering Letter Sheet ({previewVoucher.trnNo})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setShowPrinterDialog(true)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5 mr-1" /> Print Letter
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

            {/* Formatted WINHMS Bill Covering Letter Paper Sheet */}
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

              {/* Document Header Box */}
              <div className="border border-slate-300 p-2 space-y-1 bg-slate-50/50 text-center">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  BILL COVERING LETTER
                </h2>
              </div>

              {/* Date & Recipient Address */}
              <div className="flex items-start justify-between text-xs pt-2">
                <div className="space-y-1">
                  <p className="font-bold text-slate-800">To,</p>
                  <p className="font-bold text-slate-900 text-sm">{previewVoucher.partyName}</p>
                  <p className="text-slate-600 max-w-xs text-[11px]">{previewVoucher.partyAddress}</p>
                  <p className="text-slate-600 text-[11px]">Attn: {previewVoucher.contactPerson} ({previewVoucher.contactPhone})</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-semibold text-slate-700">Covering Letter No: <span className="font-mono font-bold text-slate-900">{previewVoucher.trnNo}</span></p>
                  <p className="font-semibold text-slate-700">Date: {previewVoucher.trnDt}</p>
                </div>
              </div>

              {/* Body Text */}
              <div className="text-xs text-slate-700 space-y-2 leading-relaxed">
                <p>Dear Sir/Madam,</p>
                <p>
                  Please find enclosed herewith our bills for the services rendered at <strong>Luxy Hotel</strong>. We request you to kindly verify the enclosed invoices and process the payment at your earliest convenience.
                </p>
              </div>

              {/* Enclosed Bills Table Grid */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-[11px] border-b border-slate-300">
                      <th className="px-3 py-1.5 border-r border-slate-300 w-28">Voucher No</th>
                      <th className="px-3 py-1.5 border-r border-slate-300 w-24">Voucher Date</th>
                      <th className="px-3 py-1.5 border-r border-slate-300 w-28">Ref Invoice</th>
                      <th className="px-3.5 py-1.5 border-r border-slate-300">Particulars / Details</th>
                      <th className="px-3 py-1.5 text-right w-32 font-bold bg-slate-200/60">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {previewVoucher.enclosedBills.map((b, idx) => (
                      <tr key={idx} className="h-8">
                        <td className="px-3 py-1.5 border-r border-slate-200 font-bold font-mono">
                          {b.vouchNo}
                        </td>
                        <td className="px-3 py-1.5 border-r border-slate-200 text-slate-700">
                          {b.vouchDt}
                        </td>
                        <td className="px-3 py-1.5 border-r border-slate-200 font-semibold">
                          {b.refName}
                        </td>
                        <td className="px-3.5 py-1.5 border-r border-slate-200 text-slate-700 text-[11px]">
                          {b.details}
                        </td>
                        <td className="px-3 py-1.5 text-right font-bold text-slate-900 bg-slate-50">
                          {b.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold border-t border-slate-300 text-xs">
                      <td colSpan={4} className="px-3 py-2 text-right uppercase font-bold text-slate-800 border-r border-slate-300">
                        Total Enclosed Bills Amount:
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-slate-900 bg-slate-200/60">
                        {previewVoucher.totalAmount.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Amount In Words */}
              <div className="border border-slate-300 p-2.5 text-xs bg-slate-50/50">
                <strong className="text-slate-800">Amount In Words:</strong>{" "}
                <span className="font-bold text-slate-900">{amountToWords(previewVoucher.totalAmount)}</span>
              </div>

              {/* Signatures Footer */}
              <div className="pt-8 grid grid-cols-2 gap-4 text-xs text-slate-800 font-semibold">
                <div>
                  <p>Thanking You,</p>
                  <p className="font-bold">Luxy Hotel Accounts Division</p>
                  <p className="pt-8 border-t border-slate-400 mt-4">Authorized Signatory</p>
                </div>

                <div className="text-right border-l border-slate-200 pl-4 space-y-8">
                  <p className="font-bold text-slate-900">Client Acknowledgement Slip:</p>
                  <p className="border-t border-slate-400 pt-1">Received By / Signature & Stamp</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModulePageShell>
  );
}
