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
  samplePartyGroups,
  sampleMSMETypes,
  sampleOutstandingBillsData,
  OutstandingBillItem,
} from "@/app/data/accounts/outstandingBillsAgingData";
import { cn } from "@/lib/utils";

export function OutstandingBillsAgingView() {
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

  // Transaction Filters
  const [includeDrCr, setIncludeDrCr] = useState(true);
  const [includeDrTrn, setIncludeDrTrn] = useState(true);
  const [includeCrTrn, setIncludeCrTrn] = useState(true);

  // Columns & MSME Filter
  const [showDueDateCol, setShowDueDateCol] = useState(true);
  const [showDueDaysCol, setShowDueDaysCol] = useState(false);
  const [selectedMSME, setSelectedMSME] = useState("<All>");

  // Search & Loading State
  const [searchQuery, setSearchQuery] = useState("");
  const [isDisplayLoading, setIsDisplayLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Row Details Drawer State
  const [selectedRowDetail, setSelectedRowDetail] = useState<OutstandingBillItem | null>(null);

  // Bills Data State
  const [bills, setBills] = useState<OutstandingBillItem[]>(sampleOutstandingBillsData);

  // Filtered Bills Logic matching WINHMS options
  const filteredBills = useMemo(() => {
    return bills.filter((item) => {
      // Module AR / AP
      if (!includeAR && item.moduleType === "AR") return false;
      if (!includeAP && item.moduleType === "AP") return false;

      // Group
      if (selectedGroup !== "All Groups" && item.partyGroup !== selectedGroup) {
        return false;
      }

      // MSME Type
      if (selectedMSME !== "<All>" && item.msmeType !== selectedMSME) {
        return false;
      }

      // Bill Filter Mode (Due Bill vs All Bills)
      if (billFilterMode === "Due Bill" && item.dueDays <= 0 && item.aging0to30 === 0) {
        // Keeps bills with outstanding aging
      }

      // Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.vouchNo.toLowerCase().includes(q) ||
          item.refName.toLowerCase().includes(q) ||
          item.refType.toLowerCase().includes(q) ||
          item.partyGroup.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [
    bills,
    includeAR,
    includeAP,
    selectedGroup,
    selectedMSME,
    billFilterMode,
    searchQuery,
  ]);

  // Total Summary Calculations
  const totalBalance = useMemo(
    () => filteredBills.reduce((sum, b) => sum + b.balanceAmt, 0),
    [filteredBills]
  );
  const totalAR = useMemo(
    () => filteredBills.filter((b) => b.moduleType === "AR").reduce((sum, b) => sum + b.balanceAmt, 0),
    [filteredBills]
  );
  const totalAP = useMemo(
    () => filteredBills.filter((b) => b.moduleType === "AP").reduce((sum, b) => sum + b.balanceAmt, 0),
    [filteredBills]
  );

  const total0to30 = useMemo(() => filteredBills.reduce((sum, b) => sum + b.aging0to30, 0), [filteredBills]);
  const total31to60 = useMemo(() => filteredBills.reduce((sum, b) => sum + b.aging31to60, 0), [filteredBills]);
  const total61to90 = useMemo(() => filteredBills.reduce((sum, b) => sum + b.aging61to90, 0), [filteredBills]);
  const total91to180 = useMemo(() => filteredBills.reduce((sum, b) => sum + b.aging91to180, 0), [filteredBills]);
  const totalOver180 = useMemo(() => filteredBills.reduce((sum, b) => sum + b.agingOver180, 0), [filteredBills]);

  const totalOver90Days = total91to180 + totalOver180;

  // Handle Display Button
  const handleDisplayReport = () => {
    setIsDisplayLoading(true);
    setTimeout(() => {
      setIsDisplayLoading(false);
      setToastMessage(`Updated aging report for ${filteredBills.length} party bills as on ${asOnDate}.`);
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
            id="chk-all-parties"
            checked={allParties}
            onChange={(e) => setAllParties(e.target.checked)}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
          />
          <label htmlFor="chk-all-parties" className="cursor-pointer">
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

      {/* Row 2: Aging Criteria, Transaction Checks, MSME Filter */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 items-start bg-slate-50/80 p-3 rounded-xl border border-slate-200">
        {/* Bill Filter Checkboxes */}
        <div className="lg:col-span-3 space-y-1 rounded-lg bg-white p-2 border border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Bill Filter
          </span>
          <div className="flex items-center gap-3 font-semibold text-slate-700">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="bill-mode"
                checked={billFilterMode === "Due Bill"}
                onChange={() => setBillFilterMode("Due Bill")}
                className="text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
              />
              <span>Due Bill</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="bill-mode"
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
                name="age-mode"
                checked={ageAccordingTo === "DueDate"}
                onChange={() => setAgeAccordingTo("DueDate")}
                className="text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
              />
              <span>Due Date</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="age-mode"
                checked={ageAccordingTo === "VoucherDate"}
                onChange={() => setAgeAccordingTo("VoucherDate")}
                className="text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
              />
              <span>Voucher Date</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="age-mode"
                checked={ageAccordingTo === "BillDate"}
                onChange={() => setAgeAccordingTo("BillDate")}
                className="text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
              />
              <span>Bill Date</span>
            </label>
          </div>
        </div>

        {/* DR / CR Transaction Checks */}
        <div className="lg:col-span-3 space-y-1 rounded-lg bg-white p-2 border border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Transactions & Columns
          </span>
          <div className="grid grid-cols-2 gap-1 font-semibold text-slate-700 text-[11px]">
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
                checked={showDueDateCol}
                onChange={(e) => setShowDueDateCol(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
              />
              <span>Due Dt</span>
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
                checked={showDueDaysCol}
                onChange={(e) => setShowDueDaysCol(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
              />
              <span>Due Days</span>
            </label>
          </div>
        </div>

        {/* MSME Type Filter */}
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
      title="Outstanding Bills Aging"
      description="Comprehensive aging analysis of Accounts Receivable (AR) debtors and Accounts Payable (AP) creditors by aging buckets."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Party Outstanding", href: "/accounts/party-outstanding" },
        { label: "Outstanding Bills Aging" },
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
            onClick={() => alert("Outstanding Bills Aging report exported to CSV.")}
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
            <span>{showFilters ? "Hide Options" : "Aging Parameters & Options"}</span>
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
            Module: {includeAR && includeAP ? "AR & AP" : includeAR ? "AR Only" : "AP Only"}
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
                WINHMS Outstanding Bills Aging Parameters & Options
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
        title="Aging Options"
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
          label="Total Outstanding Balance"
          value={formatINR(totalBalance)}
          sublabel={`${filteredBills.length} active bills`}
          accent="#0284c7"
          icon={PieChart}
        />
        <StatMiniCard
          label="AR Outstanding (Debtors)"
          value={formatINR(totalAR)}
          sublabel="Receivables due"
          accent="#16a34a"
          icon={ArrowDownLeft}
        />
        <StatMiniCard
          label="AP Outstanding (Creditors)"
          value={formatINR(totalAP)}
          sublabel="Payables due"
          accent="#f59e0b"
          icon={ArrowUpRight}
        />
        <StatMiniCard
          label="Overdue > 90 Days"
          value={formatINR(totalOver90Days)}
          sublabel="High priority collections"
          accent="#e11d48"
          icon={AlertCircle}
        />
      </div>

      {/* Main Table Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Outstanding Bills Aging Table ({filteredBills.length} records)
              </h2>
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Double click row to view bill details & transaction history
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
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="px-3 py-2.5 w-24 border-r border-slate-200">VouchNo</th>
                <th className="px-3 py-2.5 w-24 border-r border-slate-200">VouchDt</th>
                <th className="px-2.5 py-2.5 w-24 border-r border-slate-200 text-center">Ref Type</th>
                <th className="px-3.5 py-2.5 min-w-[200px] border-r border-slate-200">Ref Name</th>
                {showDueDateCol && <th className="px-3 py-2.5 w-24 border-r border-slate-200">Due Dt</th>}
                {showDueDaysCol && <th className="px-2.5 py-2.5 w-20 border-r border-slate-200 text-center">Due Days</th>}
                <th className="px-3 py-2.5 text-right w-28 border-r border-slate-200 bg-slate-200/50">Balance Amt</th>
                <th className="px-3 py-2.5 text-right w-24 border-r border-slate-200">0 - 30</th>
                <th className="px-3 py-2.5 text-right w-24 border-r border-slate-200">31 - 60</th>
                <th className="px-3 py-2.5 text-right w-24 border-r border-slate-200">61 - 90</th>
                <th className="px-3 py-2.5 text-right w-24 border-r border-slate-200">91 - 180</th>
                <th className="px-3 py-2.5 text-right w-24 font-bold text-rose-800">&gt; 180</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400 font-medium">
                    No outstanding bills found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredBills.map((row) => (
                  <tr
                    key={row.id}
                    onDoubleClick={() => setSelectedRowDetail(row)}
                    className="hover:bg-amber-50/70 transition-colors cursor-pointer"
                    title="Double click to view full party details"
                  >
                    <td className="px-3 py-2.5 font-bold text-slate-900 border-r border-slate-100">{row.vouchNo}</td>
                    <td className="px-3 py-2.5 text-slate-600 font-medium border-r border-slate-100">{row.vouchDt}</td>
                    <td className="px-2.5 py-2.5 text-center border-r border-slate-100">
                      <span
                        className={cn(
                          "inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                          row.moduleType === "AR"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        )}
                      >
                        {row.refType}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 border-r border-slate-100">
                      <span className="font-bold text-slate-900 block">{row.refName}</span>
                      <span className="text-[10px] text-slate-500 font-medium block">{row.partyGroup} • {row.msmeType}</span>
                    </td>
                    {showDueDateCol && (
                      <td className="px-3 py-2.5 text-slate-600 font-medium border-r border-slate-100">{row.dueDate}</td>
                    )}
                    {showDueDaysCol && (
                      <td className="px-2.5 py-2.5 text-center border-r border-slate-100 font-bold text-slate-700">
                        {row.dueDays} d
                      </td>
                    )}
                    <td className="px-3 py-2.5 text-right font-bold text-slate-900 border-r border-slate-100 bg-slate-50">
                      {formatINR(row.balanceAmt)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-slate-700 border-r border-slate-100">
                      {row.aging0to30 > 0 ? formatINR(row.aging0to30) : "-"}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-slate-700 border-r border-slate-100">
                      {row.aging31to60 > 0 ? formatINR(row.aging31to60) : "-"}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-amber-800 border-r border-slate-100">
                      {row.aging61to90 > 0 ? formatINR(row.aging61to90) : "-"}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-rose-700 border-r border-slate-100">
                      {row.aging91to180 > 0 ? formatINR(row.aging91to180) : "-"}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-rose-900">
                      {row.agingOver180 > 0 ? formatINR(row.agingOver180) : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredBills.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-300 text-xs">
                  <td colSpan={showDueDateCol && showDueDaysCol ? 6 : showDueDateCol || showDueDaysCol ? 5 : 4} className="px-3 py-2.5 text-right uppercase text-[10px] tracking-wider border-r border-slate-300">
                    Total Outstanding:
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-slate-900 border-r border-slate-300 bg-slate-200/60">
                    {formatINR(totalBalance)}
                  </td>
                  <td className="px-3 py-2.5 text-right border-r border-slate-300">{formatINR(total0to30)}</td>
                  <td className="px-3 py-2.5 text-right border-r border-slate-300">{formatINR(total31to60)}</td>
                  <td className="px-3 py-2.5 text-right border-r border-slate-300">{formatINR(total61to90)}</td>
                  <td className="px-3 py-2.5 text-right border-r border-slate-300 text-rose-800">{formatINR(total91to180)}</td>
                  <td className="px-3 py-2.5 text-right font-bold text-rose-900">{formatINR(totalOver180)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      {/* Row Detail Drawer (Double Click Details) */}
      <Drawer
        open={Boolean(selectedRowDetail)}
        onClose={() => setSelectedRowDetail(null)}
        title="Outstanding Bill Details"
      >
        {selectedRowDetail && (
          <div className="p-4 space-y-4 text-xs font-sans">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{selectedRowDetail.refName}</span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                    selectedRowDetail.moduleType === "AR" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  )}
                >
                  {selectedRowDetail.moduleType === "AR" ? "Receivable (AR)" : "Payable (AP)"}
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Group: <strong>{selectedRowDetail.partyGroup}</strong> • MSME: <strong>{selectedRowDetail.msmeType}</strong>
              </p>
            </div>

            <div className="space-y-2 border-b border-slate-200 pb-3 text-slate-700">
              <div className="flex justify-between">
                <span>Voucher No:</span>
                <strong className="text-slate-900">{selectedRowDetail.vouchNo}</strong>
              </div>
              <div className="flex justify-between">
                <span>Voucher Date:</span>
                <span>{selectedRowDetail.vouchDt}</span>
              </div>
              <div className="flex justify-between">
                <span>Due Date:</span>
                <span>{selectedRowDetail.dueDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Overdue Days:</span>
                <strong className="text-rose-700">{selectedRowDetail.dueDays} days</strong>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-2">
                <span>Total Balance:</span>
                <span>{formatINR(selectedRowDetail.balanceAmt)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                Aging Bucket Breakdown:
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-slate-500 block">0 - 30 Days</span>
                  <span className="font-bold text-slate-900">{formatINR(selectedRowDetail.aging0to30)}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-slate-500 block">31 - 60 Days</span>
                  <span className="font-bold text-slate-900">{formatINR(selectedRowDetail.aging31to60)}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-slate-500 block">61 - 90 Days</span>
                  <span className="font-bold text-amber-800">{formatINR(selectedRowDetail.aging61to90)}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-slate-500 block">&gt; 90 Days</span>
                  <span className="font-bold text-rose-800">{formatINR(selectedRowDetail.aging91to180 + selectedRowDetail.agingOver180)}</span>
                </div>
              </div>
            </div>

            {selectedRowDetail.remarks && (
              <div className="bg-amber-50 p-2.5 rounded border border-amber-200 text-amber-900 text-[11px]">
                <strong>Audit Note:</strong> {selectedRowDetail.remarks}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </ModulePageShell>
  );
}
