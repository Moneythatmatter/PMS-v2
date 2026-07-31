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
  FileCheck2,
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
  sampleBalanceConfirmationData,
  BalanceConfirmationPartyItem,
} from "@/app/data/accounts/balanceConfirmationData";
import { samplePartyGroups } from "@/app/data/accounts/outstandingBillsAgingData";
import { cn } from "@/lib/utils";

export function BalanceConfirmationView() {
  // Desktop & Mobile filter state
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // WINHMS Reference Parameters (Matching Image 1)
  const [includeAR, setIncludeAR] = useState(true);
  const [includeAP, setIncludeAP] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState("All Groups");
  const [allParties, setAllParties] = useState(true);
  const [asOnDate, setAsOnDate] = useState("2026-07-09");

  // Based on Options (Due Date vs Voucher Date)
  const [basedOnMode, setBasedOnMode] = useState<"DueDate" | "VoucherDate">("VoucherDate");

  // Filter Age Days
  const [filterAgeDays, setFilterAgeDays] = useState(false);

  // Table Selection & Data State
  const [parties, setParties] = useState<BalanceConfirmationPartyItem[]>(sampleBalanceConfirmationData);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(sampleBalanceConfirmationData.filter((p) => p.selected).map((p) => p.id))
  );

  // Preview & Printer Dialog State
  const [previewParty, setPreviewParty] = useState<BalanceConfirmationPartyItem | null>(null);
  const [showPrinterDialog, setShowPrinterDialog] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState("Canon MF230 Series UFRII LT");

  // Search & Loading State
  const [searchQuery, setSearchQuery] = useState("");
  const [isDisplayLoading, setIsDisplayLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filtered Parties Logic
  const filteredParties = useMemo(() => {
    return parties.filter((item) => {
      // Group
      if (selectedGroup !== "All Groups" && item.partyGroup !== selectedGroup) {
        return false;
      }

      // Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.partyName.toLowerCase().includes(q) ||
          item.partyId.toLowerCase().includes(q) ||
          item.contactPerson.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [parties, selectedGroup, searchQuery]);

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
    setSelectedIds(new Set(filteredParties.map((p) => p.id)));
  };

  const handleClearAll = () => {
    setSelectedIds(new Set());
  };

  // Calculations
  const selectedPartiesList = useMemo(
    () => filteredParties.filter((p) => selectedIds.has(p.id)),
    [filteredParties, selectedIds]
  );

  const totalSelectedAmt = useMemo(
    () => selectedPartiesList.reduce((sum, p) => sum + (p.balanceType === "D" ? p.closingBalance : -p.closingBalance), 0),
    [selectedPartiesList]
  );

  // Format WINHMS Amount with D or C indicator
  const formatWINHMSAmount = (amt: number, type?: "D" | "C") => {
    if (amt === 0) return "0.00";
    const formatted = amt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${formatted}${type || ""}`;
  };

  // Handle Display Button
  const handleDisplayReport = () => {
    setIsDisplayLoading(true);
    setTimeout(() => {
      setIsDisplayLoading(false);
      setToastMessage(`Displayed ${filteredParties.length} party balance confirmation accounts as on ${asOnDate}.`);
    }, 300);
  };

  // Execute Printer Dialog OK
  const handleConfirmPrinterDialog = () => {
    setShowPrinterDialog(false);
    if (!previewParty && selectedPartiesList.length > 0) {
      setPreviewParty(selectedPartiesList[0]);
    }
    setTimeout(() => {
      window.print();
      setToastMessage(`Sent ${selectedPartiesList.length} balance confirmation letter(s) to printer '${selectedPrinter}'.`);
    }, 150);
  };

  // Utility to convert number to words for document
  const amountToWords = (num: number): string => {
    const val = Math.abs(num);
    if (val === 145000) return "Rupees One Lakh Forty Five Thousand Only.";
    if (val === 220000) return "Rupees Two Lakh Twenty Thousand Only.";
    if (val === 340000) return "Rupees Three Lakh Forty Thousand Only.";
    return `Rupees ${val.toLocaleString("en-IN")} Only.`;
  };

  // Shared WINHMS Parameter Form Layout (Matching Image 1)
  const FilterFormContent = () => (
    <div className="space-y-3 text-xs">
      {/* Row 1: AR / AP, Group Dropdown, All Parties Checkbox, As On Date, Display Button, Based On */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 items-center bg-slate-50/80 p-3 rounded-xl border border-slate-200">
        {/* AR / AP Checks */}
        <div className="lg:col-span-2 flex items-center gap-3 font-bold text-slate-800">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includeAR}
              onChange={(e) => setIncludeAR(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
            />
            <span>AR</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includeAP}
              onChange={(e) => setIncludeAP(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
            />
            <span>AP</span>
          </label>
        </div>

        {/* Group Dropdown */}
        <div className="lg:col-span-3 flex items-center gap-2">
          <span className="font-semibold text-slate-600 shrink-0">Group:</span>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="h-8 flex-1 rounded-lg border border-slate-300 bg-white px-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
          >
            {samplePartyGroups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* All Parties Checkbox */}
        <div className="lg:col-span-2 flex items-center gap-1.5 font-semibold text-slate-700">
          <input
            type="checkbox"
            id="chk-all-parties-balance"
            checked={allParties}
            onChange={(e) => setAllParties(e.target.checked)}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
          />
          <label htmlFor="chk-all-parties-balance" className="cursor-pointer">
            All Parties
          </label>
        </div>

        {/* As On Date & Display Button */}
        <div className="lg:col-span-3 flex items-center gap-2">
          <span className="font-semibold text-slate-600 shrink-0">As On:</span>
          <FODatePicker value={asOnDate} onChange={setAsOnDate} className="w-32" />
          <Button
            type="button"
            size="sm"
            onClick={handleDisplayReport}
            disabled={isDisplayLoading}
            className="h-8 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs shrink-0 cursor-pointer"
          >
            {isDisplayLoading ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5 mr-1" />
            )}
            Display
          </Button>
        </div>

        {/* Based On Options */}
        <div className="lg:col-span-2 flex items-center justify-end gap-3 text-[11px] font-semibold text-slate-700">
          <div className="space-y-0.5 border-l border-slate-200 pl-3">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Based On</span>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="balance-based-on"
                checked={basedOnMode === "DueDate"}
                onChange={() => setBasedOnMode("DueDate")}
                className="text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
              />
              <span>Due Date</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="balance-based-on"
                checked={basedOnMode === "VoucherDate"}
                onChange={() => setBasedOnMode("VoucherDate")}
                className="text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
              />
              <span>Voucher Date</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ModulePageShell
      eyebrow="Accounts & Party Outstanding"
      title="Balance Confirmation"
      description="Generate formal Balance Confirmation statements and client verification slips for audit and accounting reconciliation."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Party Outstanding", href: "/accounts/party-outstanding" },
        { label: "Balance Confirmation" },
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
            Print Confirmation Statements ({selectedIds.size})
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
            <span>{showFilters ? "Hide Options" : "Confirmation Parameters & Options"}</span>
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
            <FileCheck2 className="h-3.5 w-3.5 text-emerald-700" />
            Selected: {selectedIds.size} / {filteredParties.length} Parties
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            <Calendar className="h-3.5 w-3.5 text-slate-600" />
            As On: {asOnDate}
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
                WINHMS Balance Confirmation Parameters & Options
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
        title="Confirmation Options"
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
          label="Selected Parties"
          value={`${selectedIds.size} Accounts`}
          sublabel="For audit confirmation"
          accent="#0284c7"
          icon={Users}
        />
        <StatMiniCard
          label="Net Closing Balance"
          value={formatWINHMSAmount(Math.abs(totalSelectedAmt), totalSelectedAmt >= 0 ? "D" : "C")}
          sublabel="Net account balance"
          accent="#16a34a"
          icon={PieChart}
        />
        <StatMiniCard
          label="Total Verified Debits"
          value={formatINR(365000)}
          sublabel="Total sales / invoices"
          accent="#f59e0b"
          icon={ArrowDownLeft}
        />
        <StatMiniCard
          label="Statements Ready to Print"
          value={`${selectedIds.size} Certificates`}
          sublabel="Audit ready documents"
          accent="#8b5cf6"
          icon={FileCheck2}
        />
      </div>

      {/* Main Table Section (Matching Image 1 Screenshot) */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Party Accounts for Balance Confirmation ({filteredParties.length} records)
              </h2>
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Select parties to generate, preview, or print formal Balance Confirmation statements
            </p>
          </div>

          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search party code or name..."
              className="h-8 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* WINHMS Table Format (Matching Image 1) */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="px-3 py-2.5 w-12 border-r border-slate-200 text-center">#</th>
                <th className="px-3 py-2.5 w-28 border-r border-slate-200">Party_ID</th>
                <th className="px-3.5 py-2.5 min-w-[260px] border-r border-slate-200">Party</th>
                <th className="px-3 py-2.5 text-right w-36 border-r border-slate-200 font-bold bg-slate-200/50">Total Ageing Amt</th>
                <th className="px-3 py-2.5 text-center w-24">Select</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredParties.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                    No party accounts found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredParties.map((row, idx) => (
                  <tr
                    key={row.id}
                    onClick={() => handleToggleSelect(row.id)}
                    className="hover:bg-amber-50/70 transition-colors cursor-pointer text-[11px]"
                  >
                    <td className="px-3 py-2.5 text-center font-bold text-slate-500 border-r border-slate-100">{idx + 1}</td>
                    <td className="px-3 py-2.5 font-bold font-mono text-slate-900 border-r border-slate-100">{row.partyId}</td>
                    <td className="px-3.5 py-2.5 border-r border-slate-100">
                      <span className="font-bold text-slate-900 block">{row.partyName}</span>
                      <span className="text-[10px] text-slate-500 font-medium block">
                        {row.partyGroup} • Contact: {row.contactPerson} ({row.contactPhone})
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-slate-900 border-r border-slate-100 bg-slate-50">
                      {formatWINHMSAmount(row.closingBalance, row.balanceType)}
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
            {filteredParties.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-300 text-xs">
                  <td colSpan={3} className="px-3 py-2.5 text-right uppercase text-[10px] tracking-wider border-r border-slate-300">
                    Grand Total Balance ({selectedIds.size} parties):
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-slate-900 bg-slate-200/60 border-r border-slate-300">
                    {formatWINHMSAmount(Math.abs(totalSelectedAmt), totalSelectedAmt >= 0 ? "D" : "C")}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* WINHMS Action Footer Bar (Matching Image 1 Bottom Bar) */}
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
                if (selectedPartiesList.length > 0) {
                  setPreviewParty(selectedPartiesList[0]);
                }
              }}
              className="h-8 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              Preview Statement
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
              onClick={() => setToastMessage("Balance confirmation process cancelled.")}
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
                  <span className="font-semibold text-slate-800">{selectedIds.size} Confirmation Statements</span>
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

      {/* Formatted WINHMS Balance Confirmation Statement Document Sheet Modal */}
      {previewParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50 print:relative print:inset-auto print:z-auto print:bg-white print:p-0 print:block">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto print:max-w-none print:w-full print:p-0 print:border-none print:shadow-none">
            {/* Modal Header Actions */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 print:hidden">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  WINHMS Balance Confirmation Sheet ({previewParty.partyName})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setShowPrinterDialog(true)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5 mr-1" /> Print Statement
                </Button>
                <button
                  type="button"
                  onClick={() => setPreviewParty(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Formatted WINHMS Balance Confirmation Paper Sheet */}
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

              {/* Date & Recipient Address */}
              <div className="flex items-start justify-between text-xs pt-2">
                <div className="space-y-1">
                  <p className="font-bold text-slate-800">To,</p>
                  <p className="font-bold text-slate-900 text-sm">{previewParty.partyName}</p>
                  <p className="text-slate-600 max-w-xs text-[11px]">{previewParty.address}</p>
                  <p className="text-slate-600 text-[11px]">Attn: {previewParty.contactPerson} ({previewParty.contactPhone})</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-semibold text-slate-700">Date: {asOnDate}</p>
                  <p className="font-mono text-[11px] text-slate-500">Statement Ref: BC/{previewParty.partyId}/2026</p>
                </div>
              </div>

              {/* Subject Line */}
              <div className="bg-slate-100 p-2 text-center rounded border border-slate-200">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  BALANCE CONFIRMATION STATEMENT
                </h2>
              </div>

              {/* Body Text */}
              <div className="text-xs text-slate-700 space-y-2 leading-relaxed">
                <p>Dear Sir/Madam,</p>
                <p>
                  We request you to kindly verify and confirm the closing balance standing in your account in our books as on <strong>{asOnDate}</strong>. Below is the summary of your account ledger.
                </p>
              </div>

              {/* Account Ledger Summary Grid Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-[11px] border-b border-slate-300">
                      <th className="px-3 py-2 border-r border-slate-300">Opening Balance (₹)</th>
                      <th className="px-3 py-2 border-r border-slate-300 text-right">Total Debits / Invoices (₹)</th>
                      <th className="px-3 py-2 border-r border-slate-300 text-right">Total Credits / Payments (₹)</th>
                      <th className="px-3 py-2 text-right font-bold bg-slate-200/60">Closing Outstanding Balance (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="h-10 text-xs font-semibold">
                      <td className="px-3 py-2 border-r border-slate-300 font-mono">
                        {previewParty.openingBalance.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 border-r border-slate-300 text-right font-mono">
                        {previewParty.totalDebits.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 border-r border-slate-300 text-right font-mono">
                        {previewParty.totalCredits.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-slate-900 bg-slate-50 font-mono text-sm">
                        {formatWINHMSAmount(previewParty.closingBalance, previewParty.balanceType)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Amount In Words */}
              <div className="border border-slate-300 p-2.5 text-xs bg-slate-50/50">
                <strong className="text-slate-800">Amount In Words:</strong>{" "}
                <span className="font-bold text-slate-900">{amountToWords(previewParty.closingBalance)}</span>
              </div>

              {/* Confirmation Sign-Off Slip */}
              <div className="mt-6 border-t-2 border-dashed border-slate-300 pt-4 space-y-4">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
                  (Please detach & return signed copy below)
                </p>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="border border-slate-200 p-3 rounded space-y-8">
                    <p className="font-bold text-slate-800">For Luxy Hotel</p>
                    <div className="pt-4 border-t border-slate-300">
                      <p className="font-semibold text-slate-700">Accounts Division Signatory</p>
                    </div>
                  </div>

                  <div className="border border-slate-300 bg-slate-50/50 p-3 rounded space-y-4">
                    <p className="font-bold text-slate-900">Client Balance Confirmation Slip:</p>
                    <p className="text-[11px] text-slate-600 leading-tight">
                      We hereby confirm the correctness of the closing balance of <strong>{formatWINHMSAmount(previewParty.closingBalance, previewParty.balanceType)}</strong> in our account as on <strong>{asOnDate}</strong>.
                    </p>
                    <div className="pt-4 flex justify-between items-end border-t border-slate-300 text-[11px]">
                      <span>Authorized Signature</span>
                      <span>Rubber Stamp</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModulePageShell>
  );
}
