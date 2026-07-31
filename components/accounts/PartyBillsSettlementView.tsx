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
  Sliders,
  Receipt,
  FileSpreadsheet,
  CheckSquare,
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
  samplePartySettlementGroups,
  sampleTrnTypesList,
  samplePartyNamesList,
  samplePartyBillsSettlementData,
  PartyBillsSettlementItem,
} from "@/app/data/accounts/partyBillsSettlementData";
import { cn } from "@/lib/utils";

export function PartyBillsSettlementView() {
  // Desktop & Mobile filter state
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // WINHMS Reference Parameters
  const [includeAR, setIncludeAR] = useState(true);
  const [includeAP, setIncludeAP] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState("All Groups");
  const [allParties, setAllParties] = useState(true);
  const [selectedPartyName, setSelectedPartyName] = useState(samplePartyNamesList[0]);
  const [asOnDate, setAsOnDate] = useState("2026-07-24");

  // WINHMS Option Checkboxes (Images 1-5 exact fields)
  const [pendingBillsOnly, setPendingBillsOnly] = useState(true);
  const [showDueDate, setShowDueDate] = useState(false);
  const [includeDrCr, setIncludeDrCr] = useState(true);
  const [showRefDt, setShowRefDt] = useState(true);
  const [includeDrTrn, setIncludeDrTrn] = useState(true);
  const [includeCrTrn, setIncludeCrTrn] = useState(true);
  const [supressZero, setSupressZero] = useState(true);
  const [summaryOnly, setSummaryOnly] = useState(false);

  // WINHMS Advance Filter Modal State (Images 4 & 5)
  const [showAdvanceFilterModal, setShowAdvanceFilterModal] = useState(false);
  const [advRefNameFilter, setAdvRefNameFilter] = useState("");
  const [advTrnTypeFilter, setAdvTrnTypeFilter] = useState("<All>");

  // Search & Loading State
  const [searchQuery, setSearchQuery] = useState("");
  const [isDisplayLoading, setIsDisplayLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Row Details Drawer State
  const [selectedSettlementDetail, setSelectedSettlementDetail] = useState<PartyBillsSettlementItem | null>(null);

  // Records Data State
  const [records, setRecords] = useState<PartyBillsSettlementItem[]>(samplePartyBillsSettlementData);

  // Filtered Records Logic matching WINHMS options & Advance Filter
  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      // Module AR / AP
      if (!includeAR && item.moduleType === "AR") return false;
      if (!includeAP && item.moduleType === "AP") return false;

      // Group
      if (selectedGroup !== "All Groups" && item.partyGroup !== selectedGroup) {
        return false;
      }

      // Party Name (when All Parties is unchecked)
      if (!allParties && selectedPartyName && !item.partyName.toLowerCase().includes(selectedPartyName.toLowerCase().slice(0, 8))) {
        return false;
      }

      // Pending Bills Only
      if (pendingBillsOnly && item.outstandingAmt <= 0) {
        return false;
      }

      // Supress Zero
      if (supressZero && item.debitAmt === 0 && item.creditAmt === 0 && item.outstandingAmt === 0) {
        return false;
      }

      // DR / CR Trn filters
      if (!includeDrTrn && item.debitAmt > 0) return false;
      if (!includeCrTrn && item.creditAmt > 0) return false;

      // WINHMS Advance Filter (Ref Name & Trn Type)
      if (advRefNameFilter && !item.refName.toLowerCase().includes(advRefNameFilter.toLowerCase())) {
        return false;
      }
      if (advTrnTypeFilter !== "<All>" && item.trnType !== advTrnTypeFilter) {
        return false;
      }

      // General Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.trnNo.toLowerCase().includes(q) ||
          item.refName.toLowerCase().includes(q) ||
          item.partyName.toLowerCase().includes(q) ||
          item.details.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [
    records,
    includeAR,
    includeAP,
    selectedGroup,
    allParties,
    selectedPartyName,
    pendingBillsOnly,
    supressZero,
    includeDrTrn,
    includeCrTrn,
    advRefNameFilter,
    advTrnTypeFilter,
    searchQuery,
  ]);

  // Totals
  const totalDebit = useMemo(() => filteredRecords.reduce((sum, r) => sum + r.debitAmt, 0), [filteredRecords]);
  const totalCredit = useMemo(() => filteredRecords.reduce((sum, r) => sum + r.creditAmt, 0), [filteredRecords]);
  const totalOutstanding = useMemo(() => filteredRecords.reduce((sum, r) => sum + r.outstandingAmt, 0), [filteredRecords]);

  // Handle Display Button
  const handleDisplayReport = () => {
    setIsDisplayLoading(true);
    setTimeout(() => {
      setIsDisplayLoading(false);
      setToastMessage(`Displayed ${filteredRecords.length} party bills and settlement records as on ${asOnDate}.`);
    }, 300);
  };

  // Shared WINHMS Parameter Form Layout (Matching Images 1, 2, 3)
  const FilterFormContent = () => (
    <div className="space-y-3 text-xs">
      {/* Row 1: AR / AP, Group Dropdown, All Parties / Party Selector, As On Date, Display Button & Filter Funnel */}
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
            {samplePartySettlementGroups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* Party Selector / All Parties */}
        <div className="lg:col-span-3 flex items-center gap-2">
          <label className="flex items-center gap-1.5 font-semibold text-slate-700 shrink-0 cursor-pointer">
            <input
              type="checkbox"
              checked={allParties}
              onChange={(e) => setAllParties(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span>All Parties</span>
          </label>

          {!allParties && (
            <select
              value={selectedPartyName}
              onChange={(e) => setSelectedPartyName(e.target.value)}
              className="h-8 flex-1 rounded-lg border border-slate-300 bg-white px-2 text-[11px] font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none truncate"
            >
              {samplePartyNamesList.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* As On Date & Display Button */}
        <div className="lg:col-span-4 flex items-center gap-2 justify-end">
          {/* Funnel Icon for WINHMS Advance Filter Modal */}
          <button
            type="button"
            onClick={() => setShowAdvanceFilterModal(true)}
            className="h-8 px-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer"
            title="Open WINHMS Advance Filter Modal"
          >
            <Filter className="h-3.5 w-3.5 text-emerald-700" />
            <span className="hidden sm:inline">Adv Filter</span>
          </button>

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
      </div>

      {/* Row 2: WINHMS Control Checkboxes (Matching Images 1, 2, 3) */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 items-center bg-slate-50/80 p-3 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-700">
        <div className="lg:col-span-4 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={pendingBillsOnly}
              onChange={(e) => setPendingBillsOnly(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span>Pending Bills</span>
          </label>

          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={showDueDate}
              onChange={(e) => setShowDueDate(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span>Due Dt</span>
          </label>

          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={includeDrCr}
              onChange={(e) => setIncludeDrCr(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span>DR/CR</span>
          </label>

          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={showRefDt}
              onChange={(e) => setShowRefDt(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span>Ref Dt</span>
          </label>
        </div>

        <div className="lg:col-span-4 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={includeDrTrn}
              onChange={(e) => setIncludeDrTrn(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span>DR Trn</span>
          </label>

          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={includeCrTrn}
              onChange={(e) => setIncludeCrTrn(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span>CR Trn</span>
          </label>

          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={supressZero}
              onChange={(e) => setSupressZero(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span>Supress Zero</span>
          </label>
        </div>

        <div className="lg:col-span-4 flex items-center gap-3 justify-end">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={summaryOnly}
              onChange={(e) => setSummaryOnly(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span>Summary</span>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <ModulePageShell
      eyebrow="Accounts & Party Outstanding"
      title="Party Bills & Settlement"
      description="Track detailed bill lifecycle, invoice generation, payment receipt settlements, and outstanding balance status."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Party Outstanding", href: "/accounts/party-outstanding" },
        { label: "Party Bills & Settlement" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl text-xs font-medium bg-white shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Print Report
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => alert("Party Bills & Settlement exported to CSV.")}
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
            <span>{showFilters ? "Hide Options" : "Settlement Parameters & Options"}</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                showFilters && "rotate-180"
              )}
            />
          </Button>

          <button
            type="button"
            onClick={() => setShowAdvanceFilterModal(true)}
            className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Filter className="h-3.5 w-3.5 text-emerald-700" />
            <span>Adv Filter</span>
          </button>

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
            <Receipt className="h-3.5 w-3.5 text-emerald-700" />
            Group: {selectedGroup}
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
                WINHMS Party Bills & Settlement Parameters & Options
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
        title="Settlement Filter Options"
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

      {/* WINHMS Advance Filter Popup Modal (Matching Images 4 & 5 Screenshots) */}
      {showAdvanceFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-2xl border border-slate-300 space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Filter className="h-4 w-4 text-emerald-600" />
                Advance Filter
              </h3>
              <button
                type="button"
                onClick={() => setShowAdvanceFilterModal(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Reference Name</label>
                <input
                  type="text"
                  value={advRefNameFilter}
                  onChange={(e) => setAdvRefNameFilter(e.target.value)}
                  placeholder="Enter reference / bill invoice no..."
                  className="h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Trn Type</label>
                <select
                  value={advTrnTypeFilter}
                  onChange={(e) => setAdvTrnTypeFilter(e.target.value)}
                  className="h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  {sampleTrnTypesList.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setShowAdvanceFilterModal(false);
                  setToastMessage(`Applied Advance Filter (Ref: ${advRefNameFilter || "All"}, Type: ${advTrnTypeFilter})`);
                }}
                className="px-4 h-7 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-2xs"
              >
                Ok
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanceFilterModal(false)}
                className="px-4 h-7 text-xs font-semibold text-slate-600"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stat Cards Grid */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatMiniCard
          label="Total Net Outstanding"
          value={formatINR(totalOutstanding)}
          sublabel={`${filteredRecords.length} settlement records`}
          accent="#0284c7"
          icon={PieChart}
        />
        <StatMiniCard
          label="Total Debit Amount"
          value={formatINR(totalDebit)}
          sublabel="Sales & payment debits"
          accent="#16a34a"
          icon={ArrowDownLeft}
        />
        <StatMiniCard
          label="Total Credit Amount"
          value={formatINR(totalCredit)}
          sublabel="Receipts & purchase credits"
          accent="#f59e0b"
          icon={ArrowUpRight}
        />
        <StatMiniCard
          label="Filtered Records"
          value={`${filteredRecords.length} Transactions`}
          sublabel="Matching parameters"
          accent="#8b5cf6"
          icon={Receipt}
        />
      </div>

      {/* Main Table Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Party Bills & Settlement Table ({filteredRecords.length} records)
              </h2>
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Double click row to view bill settlement traceability & payment history
            </p>
          </div>

          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search voucher #, bill, or party..."
              className="h-8 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* WINHMS Table Format (Matching Images 1, 4, 5 Screenshots) */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="px-2.5 py-2.5 w-20 border-r border-slate-200 text-center">Trn Type</th>
                <th className="px-3 py-2.5 w-28 border-r border-slate-200">Trn No</th>
                <th className="px-3 py-2.5 w-24 border-r border-slate-200">Trn Dt</th>
                <th className="px-2.5 py-2.5 w-20 border-r border-slate-200 text-center">Ref Ty</th>
                <th className="px-3 py-2.5 w-32 border-r border-slate-200">Ref Name</th>
                <th className="px-3 py-2.5 w-28 border-r border-slate-200">Doc.No</th>
                <th className="px-3 py-2.5 w-24 border-r border-slate-200">Doc Dt</th>
                {showRefDt && <th className="px-3 py-2.5 w-24 border-r border-slate-200">Ref Dt</th>}
                <th className="px-3.5 py-2.5 min-w-[200px] border-r border-slate-200">Details</th>
                <th className="px-3 py-2.5 text-right w-28 border-r border-slate-200">DebitAmt</th>
                <th className="px-3 py-2.5 text-right w-28 border-r border-slate-200">CreditAmt</th>
                <th className="px-3 py-2.5 text-right w-28 font-bold text-slate-900 bg-slate-200/50">Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400 font-medium">
                    No party bills or settlement records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row) => (
                  <tr
                    key={row.id}
                    onDoubleClick={() => setSelectedSettlementDetail(row)}
                    className="hover:bg-amber-50/70 transition-colors cursor-pointer text-[11px]"
                    title="Double click to view settlement details"
                  >
                    <td className="px-2.5 py-2.5 text-center border-r border-slate-100">
                      <span
                        className={cn(
                          "inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                          row.trnType === "Sales" || row.trnType === "Receipts"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        )}
                      >
                        {row.trnType}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-bold text-slate-900 border-r border-slate-100">{row.trnNo}</td>
                    <td className="px-3 py-2.5 text-slate-600 font-medium border-r border-slate-100">{row.trnDt}</td>
                    <td className="px-2.5 py-2.5 text-center border-r border-slate-100 font-semibold text-slate-700">
                      {row.refTy}
                    </td>
                    <td className="px-3 py-2.5 font-bold text-slate-800 border-r border-slate-100">{row.refName}</td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-slate-600 border-r border-slate-100">{row.docNo}</td>
                    <td className="px-3 py-2.5 text-slate-600 font-medium border-r border-slate-100">{row.docDt}</td>
                    {showRefDt && (
                      <td className="px-3 py-2.5 text-slate-600 font-medium border-r border-slate-100">{row.refDt}</td>
                    )}
                    <td className="px-3.5 py-2.5 border-r border-slate-100">
                      <span className="font-semibold text-slate-900 block">{row.partyName}</span>
                      <span className="text-[10px] text-slate-500 block truncate max-w-xs">{row.details}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-slate-800 border-r border-slate-100">
                      {row.debitAmt > 0 ? row.debitAmt.toFixed(2) : ""}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-slate-800 border-r border-slate-100">
                      {row.creditAmt > 0 ? row.creditAmt.toFixed(2) : ""}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-slate-900 bg-slate-50">
                      {row.outstandingAmt > 0 ? row.outstandingAmt.toFixed(2) : "0.00"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredRecords.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-300 text-xs">
                  <td colSpan={showRefDt ? 9 : 8} className="px-3 py-2.5 text-right uppercase text-[10px] tracking-wider border-r border-slate-300">
                    Grand Total Settlement:
                  </td>
                  <td className="px-3 py-2.5 text-right border-r border-slate-300 font-bold text-slate-900">
                    {totalDebit.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-right border-r border-slate-300 font-bold text-slate-900">
                    {totalCredit.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-slate-900 bg-slate-200/60">
                    {totalOutstanding.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      {/* Row Detail Drawer (Double Click Settlement Details) */}
      <Drawer
        open={Boolean(selectedSettlementDetail)}
        onClose={() => setSelectedSettlementDetail(null)}
        title="Party Bill Settlement Traceability"
      >
        {selectedSettlementDetail && (
          <div className="p-4 space-y-4 text-xs font-sans">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{selectedSettlementDetail.partyName}</span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                    selectedSettlementDetail.settlementStatus === "Full"
                      ? "bg-emerald-100 text-emerald-800"
                      : selectedSettlementDetail.settlementStatus === "Partial"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-rose-100 text-rose-800"
                  )}
                >
                  {selectedSettlementDetail.settlementStatus} Settled
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Group: <strong>{selectedSettlementDetail.partyGroup}</strong> • Type: <strong>{selectedSettlementDetail.moduleType}</strong>
              </p>
            </div>

            <div className="space-y-2 border-b border-slate-200 pb-3 text-slate-700">
              <div className="flex justify-between">
                <span>Transaction No:</span>
                <strong className="text-slate-900">{selectedSettlementDetail.trnNo}</strong>
              </div>
              <div className="flex justify-between">
                <span>Transaction Date:</span>
                <span>{selectedSettlementDetail.trnDt}</span>
              </div>
              <div className="flex justify-between">
                <span>Reference Invoice / Bill:</span>
                <strong className="text-slate-900">{selectedSettlementDetail.refName}</strong>
              </div>
              <div className="flex justify-between">
                <span>Document No:</span>
                <span className="font-mono">{selectedSettlementDetail.docNo}</span>
              </div>
              <div className="flex justify-between">
                <span>Reference / Due Date:</span>
                <span>{selectedSettlementDetail.refDt}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-2">
                <span>Remaining Outstanding:</span>
                <span className="text-emerald-800 font-bold">
                  {formatINR(selectedSettlementDetail.outstandingAmt)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                Transaction Details / Particulars:
              </p>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-800">
                {selectedSettlementDetail.details}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </ModulePageShell>
  );
}
