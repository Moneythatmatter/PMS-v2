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
  Layers,
  Phone,
  Mail,
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
  samplePartySummaryGroups,
  sampleMSMETypes,
  samplePartyAgingSummaryData,
  PartyAgingSummaryItem,
} from "@/app/data/accounts/outstandingAgingSummaryData";
import { cn } from "@/lib/utils";

export function OutstandingAgingSummaryView() {
  // Desktop & Mobile filter state
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // WINHMS Reference Parameters
  const [includeAR, setIncludeAR] = useState(true);
  const [includeAP, setIncludeAP] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState("All Groups");
  const [allParties, setAllParties] = useState(true);
  const [asOnDate, setAsOnDate] = useState("2026-07-24");

  // Bill Filter Options
  const [billFilterMode, setBillFilterMode] = useState<"Due Bill" | "All Bills">("Due Bill");

  // Age According To Options
  const [ageAccordingTo, setAgeAccordingTo] = useState<"DueDate" | "VoucherDate" | "BillDate">("VoucherDate");

  // WINHMS Option Checkboxes (Image 1 & 3 exact fields)
  const [includeDrTrn, setIncludeDrTrn] = useState(true);
  const [includeCrTrn, setIncludeCrTrn] = useState(true);
  const [filterZeroBalance, setFilterZeroBalance] = useState(true);
  const [adjUnAdjDrCr, setAdjUnAdjDrCr] = useState(false);
  const [includeDrCr, setIncludeDrCr] = useState(true);
  const [selectedMSME, setSelectedMSME] = useState("<All>");

  // Search & Loading State
  const [searchQuery, setSearchQuery] = useState("");
  const [isDisplayLoading, setIsDisplayLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Row Details Drawer State
  const [selectedPartyDetail, setSelectedPartyDetail] = useState<PartyAgingSummaryItem | null>(null);

  // Party Summaries Data State
  const [parties, setParties] = useState<PartyAgingSummaryItem[]>(samplePartyAgingSummaryData);

  // Filtered Parties Logic matching WINHMS options
  const filteredParties = useMemo(() => {
    return parties.filter((item) => {
      // Module AR / AP
      if (!includeAR && item.moduleType === "AR") return false;
      if (!includeAP && item.moduleType === "AP") return false;

      // Group
      if (selectedGroup !== "All Groups" && item.partyGroup !== selectedGroup) {
        return false;
      }

      // Filter Zero Balance
      if (filterZeroBalance && item.balanceAmt === 0) {
        return false;
      }

      // MSME Type
      if (selectedMSME !== "<All>" && item.msmeType !== selectedMSME) {
        return false;
      }

      // Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.partyName.toLowerCase().includes(q) ||
          item.partyGroup.toLowerCase().includes(q) ||
          item.msmeType.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [
    parties,
    includeAR,
    includeAP,
    selectedGroup,
    filterZeroBalance,
    selectedMSME,
    searchQuery,
  ]);

  // Grouped Parties by Group Category for Table Header Rows
  const groupedParties = useMemo(() => {
    const map = new Map<string, PartyAgingSummaryItem[]>();
    filteredParties.forEach((item) => {
      const g = item.partyGroup;
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(item);
    });
    return map;
  }, [filteredParties]);

  // Summary Totals
  const totalBalanceAmt = useMemo(
    () => filteredParties.reduce((sum, p) => sum + (p.balanceType === "D" ? p.balanceAmt : -p.balanceAmt), 0),
    [filteredParties]
  );
  const totalAR = useMemo(
    () => filteredParties.filter((p) => p.moduleType === "AR").reduce((sum, p) => sum + p.balanceAmt, 0),
    [filteredParties]
  );
  const totalAP = useMemo(
    () => filteredParties.filter((p) => p.moduleType === "AP").reduce((sum, p) => sum + p.balanceAmt, 0),
    [filteredParties]
  );

  const total0to30 = useMemo(() => filteredParties.reduce((sum, p) => sum + p.aging0to30, 0), [filteredParties]);
  const total31to60 = useMemo(() => filteredParties.reduce((sum, p) => sum + p.aging31to60, 0), [filteredParties]);
  const total61to90 = useMemo(() => filteredParties.reduce((sum, p) => sum + p.aging61to90, 0), [filteredParties]);
  const total91to180 = useMemo(() => filteredParties.reduce((sum, p) => sum + p.aging91to180, 0), [filteredParties]);
  const totalOver180 = useMemo(() => filteredParties.reduce((sum, p) => sum + p.agingOver180, 0), [filteredParties]);

  // Format WINHMS Amount with D or C indicator
  const formatWINHMSAmount = (amt: number, type?: "D" | "C") => {
    if (amt === 0) return "";
    const formatted = amt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${formatted}${type || ""}`;
  };

  // Handle Display Button
  const handleDisplayReport = () => {
    setIsDisplayLoading(true);
    setTimeout(() => {
      setIsDisplayLoading(false);
      setToastMessage(`Updated aging summary for ${filteredParties.length} party ledgers as on ${asOnDate}.`);
    }, 300);
  };

  // Shared WINHMS Parameter Form Layout
  const FilterFormContent = () => (
    <div className="space-y-3 text-xs">
      {/* Row 1: AR / AP, Group Dropdown, All Parties Checkbox, As On Date, Display Button */}
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
        <div className="lg:col-span-4 flex items-center gap-2">
          <span className="font-semibold text-slate-600 shrink-0">Group:</span>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="h-8 flex-1 rounded-lg border border-slate-300 bg-white px-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
          >
            {samplePartySummaryGroups.map((g) => (
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
            id="chk-all-parties-summary"
            checked={allParties}
            onChange={(e) => setAllParties(e.target.checked)}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
          />
          <label htmlFor="chk-all-parties-summary" className="cursor-pointer">
            All Parties
          </label>
        </div>

        {/* As On Date & Display Button */}
        <div className="lg:col-span-4 flex items-center gap-2 justify-end">
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

      {/* Row 2: Aging Criteria, Option Checks, MSME Filter */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 items-start bg-slate-50/80 p-3 rounded-xl border border-slate-200">
        {/* Bill Filter */}
        <div className="lg:col-span-3 space-y-1 rounded-lg bg-white p-2 border border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Bill Filter Mode
          </span>
          <div className="flex items-center gap-3 font-semibold text-slate-700">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="summary-bill-mode"
                checked={billFilterMode === "Due Bill"}
                onChange={() => setBillFilterMode("Due Bill")}
                className="text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
              />
              <span>Due Bill</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="summary-bill-mode"
                checked={billFilterMode === "All Bills"}
                onChange={() => setBillFilterMode("All Bills")}
                className="text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
              />
              <span>All Bills</span>
            </label>
          </div>
        </div>

        {/* Age According To Box */}
        <div className="lg:col-span-3 space-y-1 rounded-lg bg-white p-2 border border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Age According To
          </span>
          <div className="flex flex-wrap items-center gap-2 font-semibold text-slate-700 text-[11px]">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="summary-age-mode"
                checked={ageAccordingTo === "DueDate"}
                onChange={() => setAgeAccordingTo("DueDate")}
                className="text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
              />
              <span>Due Date</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="summary-age-mode"
                checked={ageAccordingTo === "VoucherDate"}
                onChange={() => setAgeAccordingTo("VoucherDate")}
                className="text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
              />
              <span>Voucher Date</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="summary-age-mode"
                checked={ageAccordingTo === "BillDate"}
                onChange={() => setAgeAccordingTo("BillDate")}
                className="text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
              />
              <span>Bill Date</span>
            </label>
          </div>
        </div>

        {/* WINHMS Control Checkboxes */}
        <div className="lg:col-span-3 space-y-1 rounded-lg bg-white p-2 border border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            WINHMS Filters & Checks
          </span>
          <div className="grid grid-cols-2 gap-1 font-semibold text-slate-700 text-[11px]">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={filterZeroBalance}
                onChange={(e) => setFilterZeroBalance(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
              />
              <span className="truncate">Filter 0 Balance</span>
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
          </div>
        </div>

        {/* MSME Filter */}
        <div className="lg:col-span-3 space-y-1 rounded-lg bg-white p-2 border border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            MSME Type Filter
          </span>
          <select
            value={selectedMSME}
            onChange={(e) => setSelectedMSME(e.target.value)}
            className="h-7 w-full rounded border border-slate-300 bg-white px-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
          >
            {sampleMSMETypes.map((m) => (
              <option key={m} value={m}>
                MSME Type: {m}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <ModulePageShell
      eyebrow="Accounts & Party Outstanding"
      title="Outstanding Aging Summary"
      description="Consolidated party ledger aging summary grouped by customer and vendor accounts with Debit/Credit balance indicators."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Party Outstanding", href: "/accounts/party-outstanding" },
        { label: "Outstanding Aging Summary" },
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
            Print Summary
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => alert("Outstanding Aging Summary exported to CSV.")}
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
            <span>{showFilters ? "Hide Options" : "Summary Parameters & Options"}</span>
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
            <Users className="h-3.5 w-3.5 text-emerald-700" />
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
                WINHMS Outstanding Aging Summary Parameters & Options
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
        title="Aging Summary Options"
      >
        <div className="p-4">
          <FilterFormContent />
          <div className="mt-4 border-t border-slate-100 pt-3">
            <Button
              type="button"
              className="w-full bg-emerald-700 text-white"
              onClick={() => setMobileFilterOpen(false)}
            >
              Apply Summary Options
            </Button>
          </div>
        </div>
      </Drawer>

      {/* KPI Stat Cards Grid */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatMiniCard
          label="Net Outstanding Balance"
          value={formatWINHMSAmount(Math.abs(totalBalanceAmt), totalBalanceAmt >= 0 ? "D" : "C")}
          sublabel={`${filteredParties.length} party ledgers`}
          accent="#0284c7"
          icon={PieChart}
        />
        <StatMiniCard
          label="Total Receivables (AR)"
          value={formatINR(totalAR)}
          sublabel="Debtors balance total"
          accent="#16a34a"
          icon={ArrowDownLeft}
        />
        <StatMiniCard
          label="Total Payables (AP)"
          value={formatINR(totalAP)}
          sublabel="Creditors balance total"
          accent="#f59e0b"
          icon={ArrowUpRight}
        />
        <StatMiniCard
          label="Active Parties Analyzed"
          value={`${filteredParties.length} Ledgers`}
          sublabel="Filtered by criteria"
          accent="#8b5cf6"
          icon={Users}
        />
      </div>

      {/* Main Table Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Outstanding Aging Summary Table ({filteredParties.length} party ledgers)
              </h2>
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Double click party row to view pending bills breakdown
            </p>
          </div>

          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search party name or group..."
              className="h-8 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* WINHMS Table Format (Matching Image 3 Screenshot) */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="px-3.5 py-2.5 min-w-[220px] border-r border-slate-200">Party Name</th>
                <th className="px-3 py-2.5 text-right w-32 border-r border-slate-200 bg-slate-200/50">Balance Amt</th>
                <th className="px-3 py-2.5 text-right w-24 border-r border-slate-200">0 - 30</th>
                <th className="px-3 py-2.5 text-right w-24 border-r border-slate-200">31 - 60</th>
                <th className="px-3 py-2.5 text-right w-24 border-r border-slate-200">61 - 90</th>
                <th className="px-3 py-2.5 text-right w-24 border-r border-slate-200">91 - 180</th>
                <th className="px-3 py-2.5 text-right w-24 font-bold text-rose-800">&gt; 180</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredParties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No party ledger summary records found matching criteria.
                  </td>
                </tr>
              ) : (
                Array.from(groupedParties.entries()).map(([groupName, groupList]) => (
                  <React.Fragment key={groupName}>
                    {/* WINHMS Group Category Header Row (e.g. SUNDRY CREDITORS) */}
                    <tr className="bg-amber-100/60 font-bold text-slate-900 border-y border-amber-200/80">
                      <td colSpan={7} className="px-3.5 py-1.5 uppercase text-[11px] tracking-wider text-amber-900">
                        {groupName} ({groupList.length} parties)
                      </td>
                    </tr>

                    {/* Party Rows under Group */}
                    {groupList.map((row) => (
                      <tr
                        key={row.id}
                        onDoubleClick={() => setSelectedPartyDetail(row)}
                        className="hover:bg-amber-50/60 transition-colors cursor-pointer"
                        title="Double click to view party details & bills"
                      >
                        <td className="px-3.5 py-2 font-bold text-slate-800 border-r border-slate-100 text-[11px]">
                          {row.partyName}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-slate-900 border-r border-slate-100 bg-slate-50 text-[11px]">
                          {formatWINHMSAmount(row.balanceAmt, row.balanceType)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-slate-700 border-r border-slate-100 text-[11px]">
                          {formatWINHMSAmount(row.aging0to30, row.aging0to30Type)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-slate-700 border-r border-slate-100 text-[11px]">
                          {formatWINHMSAmount(row.aging31to60, row.aging31to60Type)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-amber-800 border-r border-slate-100 text-[11px]">
                          {formatWINHMSAmount(row.aging61to90, row.aging61to90Type)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-rose-700 border-r border-slate-100 text-[11px]">
                          {formatWINHMSAmount(row.aging91to180, row.aging91to180Type)}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-rose-900 text-[11px]">
                          {formatWINHMSAmount(row.agingOver180, row.agingOver180Type)}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              )}
            </tbody>
            {filteredParties.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-300 text-xs">
                  <td className="px-3.5 py-2.5 text-right uppercase text-[10px] tracking-wider border-r border-slate-300">
                    Grand Total Summary:
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-slate-900 border-r border-slate-300 bg-slate-200/60">
                    {formatWINHMSAmount(Math.abs(totalBalanceAmt), totalBalanceAmt >= 0 ? "D" : "C")}
                  </td>
                  <td className="px-3 py-2.5 text-right border-r border-slate-300">{formatWINHMSAmount(total0to30)}</td>
                  <td className="px-3 py-2.5 text-right border-r border-slate-300">{formatWINHMSAmount(total31to60)}</td>
                  <td className="px-3 py-2.5 text-right border-r border-slate-300">{formatWINHMSAmount(total61to90)}</td>
                  <td className="px-3 py-2.5 text-right border-r border-slate-300 text-rose-800">{formatWINHMSAmount(total91to180)}</td>
                  <td className="px-3 py-2.5 text-right font-bold text-rose-900">{formatWINHMSAmount(totalOver180)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      {/* Row Detail Drawer (Double Click Party Details) */}
      <Drawer
        open={Boolean(selectedPartyDetail)}
        onClose={() => setSelectedPartyDetail(null)}
        title="Party Ledger Summary Details"
      >
        {selectedPartyDetail && (
          <div className="p-4 space-y-4 text-xs font-sans">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{selectedPartyDetail.partyName}</span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                    selectedPartyDetail.moduleType === "AR" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  )}
                >
                  {selectedPartyDetail.moduleType === "AR" ? "Debtor (AR)" : "Creditor (AP)"}
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Group: <strong>{selectedPartyDetail.partyGroup}</strong> • MSME: <strong>{selectedPartyDetail.msmeType}</strong>
              </p>
              {selectedPartyDetail.contactPhone && (
                <p className="text-slate-600 text-[11px] flex items-center gap-1.5 pt-1">
                  <Phone className="h-3 w-3 text-slate-500" />
                  <span>{selectedPartyDetail.contactPhone}</span>
                </p>
              )}
            </div>

            <div className="space-y-2 border-b border-slate-200 pb-3 text-slate-700">
              <div className="flex justify-between">
                <span>Active Pending Bills Count:</span>
                <strong className="text-slate-900">{selectedPartyDetail.billsCount} Bills</strong>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-2">
                <span>Total Net Outstanding:</span>
                <span className="text-emerald-800 font-bold">
                  {formatWINHMSAmount(selectedPartyDetail.balanceAmt, selectedPartyDetail.balanceType)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                Aging Bucket Summary:
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-slate-500 block">0 - 30 Days</span>
                  <span className="font-bold text-slate-900">{formatWINHMSAmount(selectedPartyDetail.aging0to30, selectedPartyDetail.aging0to30Type)}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-slate-500 block">31 - 60 Days</span>
                  <span className="font-bold text-slate-900">{formatWINHMSAmount(selectedPartyDetail.aging31to60, selectedPartyDetail.aging31to60Type)}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-slate-500 block">61 - 90 Days</span>
                  <span className="font-bold text-amber-800">{formatWINHMSAmount(selectedPartyDetail.aging61to90, selectedPartyDetail.aging61to90Type)}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-slate-500 block">&gt; 90 Days</span>
                  <span className="font-bold text-rose-800">{formatWINHMSAmount(selectedPartyDetail.aging91to180 + selectedPartyDetail.agingOver180)}</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <a href="/accounts/party-outstanding/bills-aging">
                <Button type="button" className="w-full bg-emerald-700 text-white font-semibold text-xs">
                  View Detailed Bills Breakdown
                </Button>
              </a>
            </div>
          </div>
        )}
      </Drawer>
    </ModulePageShell>
  );
}
