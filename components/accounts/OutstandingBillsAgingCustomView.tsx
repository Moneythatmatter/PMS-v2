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
  Settings2,
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

// Custom Aging Slab Interface
interface CustomSlabConfig {
  slab1Max: number; // e.g. 15
  slab2Max: number; // e.g. 30
  slab3Max: number; // e.g. 45
  slab4Max: number; // e.g. 90
}

export function OutstandingBillsAgingCustomView() {
  // Desktop & Mobile filter state
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Custom Aging Slab State Configuration
  const [slabPreset, setSlabPreset] = useState<"custom" | "short" | "standard" | "long">("short");
  const [slabs, setSlabs] = useState<CustomSlabConfig>({
    slab1Max: 15,
    slab2Max: 30,
    slab3Max: 45,
    slab4Max: 90,
  });

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
  const [showDueDaysCol, setShowDueDaysCol] = useState(true);
  const [selectedMSME, setSelectedMSME] = useState("<All>");

  // Search & Loading State
  const [searchQuery, setSearchQuery] = useState("");
  const [isDisplayLoading, setIsDisplayLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Row Details Drawer State
  const [selectedRowDetail, setSelectedRowDetail] = useState<OutstandingBillItem | null>(null);

  // Bills Data State
  const [bills, setBills] = useState<OutstandingBillItem[]>(sampleOutstandingBillsData);

  // Apply Preset Slabs
  const handlePresetChange = (preset: "custom" | "short" | "standard" | "long") => {
    setSlabPreset(preset);
    if (preset === "short") {
      setSlabs({ slab1Max: 15, slab2Max: 30, slab3Max: 45, slab4Max: 90 });
    } else if (preset === "standard") {
      setSlabs({ slab1Max: 30, slab2Max: 60, slab3Max: 90, slab4Max: 180 });
    } else if (preset === "long") {
      setSlabs({ slab1Max: 60, slab2Max: 120, slab3Max: 180, slab4Max: 360 });
    }
  };

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
    searchQuery,
  ]);

  // Calculate Custom Slab Breakdown for a Bill based on dueDays or balance
  const calculateBillSlabs = (bill: OutstandingBillItem) => {
    const days = Math.max(0, bill.dueDays);
    let s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0;

    if (days <= slabs.slab1Max) {
      s1 = bill.balanceAmt;
    } else if (days <= slabs.slab2Max) {
      s2 = bill.balanceAmt;
    } else if (days <= slabs.slab3Max) {
      s3 = bill.balanceAmt;
    } else if (days <= slabs.slab4Max) {
      s4 = bill.balanceAmt;
    } else {
      s5 = bill.balanceAmt;
    }

    return { s1, s2, s3, s4, s5 };
  };

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

  const totalCustomSlabs = useMemo(() => {
    let s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0;
    filteredBills.forEach((b) => {
      const calc = calculateBillSlabs(b);
      s1 += calc.s1;
      s2 += calc.s2;
      s3 += calc.s3;
      s4 += calc.s4;
      s5 += calc.s5;
    });
    return { s1, s2, s3, s4, s5 };
  }, [filteredBills, slabs]);

  // Handle Display Button
  const handleDisplayReport = () => {
    setIsDisplayLoading(true);
    setTimeout(() => {
      setIsDisplayLoading(false);
      setToastMessage(`Calculated custom slab aging report for ${filteredBills.length} party bills.`);
    }, 300);
  };

  // Shared WINHMS Parameter Form Layout
  const FilterFormContent = () => (
    <div className="space-y-3 text-xs">
      {/* Row 1: Custom Slab Days Configurator (WINHMS Custom Aging Feature) */}
      <div className="rounded-xl bg-emerald-50/70 p-3 border border-emerald-200 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/80 pb-2">
          <span className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
            <Sliders className="h-4 w-4 text-emerald-700" />
            WINHMS Custom Aging Day Slab Intervals Configurator
          </span>
          <div className="flex items-center gap-1 font-semibold text-[11px]">
            <span className="text-slate-600 mr-1">Presets:</span>
            {[
              { id: "short", label: "Short (15d)" },
              { id: "standard", label: "Standard (30d)" },
              { id: "long", label: "Long (60d)" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetChange(p.id as any)}
                className={cn(
                  "px-2 py-0.5 rounded-lg border transition-colors cursor-pointer",
                  slabPreset === p.id
                    ? "bg-emerald-700 text-white border-emerald-700 font-bold"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white p-2 rounded-lg border border-emerald-200 space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-500 block">Slab 1 Max Days</label>
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[11px] font-medium">0 to</span>
              <input
                type="number"
                value={slabs.slab1Max}
                onChange={(e) => {
                  setSlabPreset("custom");
                  setSlabs((prev) => ({ ...prev, slab1Max: Number(e.target.value) }));
                }}
                className="h-7 w-16 rounded border border-slate-300 px-2 font-bold text-slate-900 text-xs focus:border-emerald-500 focus:outline-none"
              />
              <span className="text-slate-500 text-[11px]">Days</span>
            </div>
          </div>

          <div className="bg-white p-2 rounded-lg border border-emerald-200 space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-500 block">Slab 2 Max Days</label>
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[11px] font-medium">{slabs.slab1Max + 1} to</span>
              <input
                type="number"
                value={slabs.slab2Max}
                onChange={(e) => {
                  setSlabPreset("custom");
                  setSlabs((prev) => ({ ...prev, slab2Max: Number(e.target.value) }));
                }}
                className="h-7 w-16 rounded border border-slate-300 px-2 font-bold text-slate-900 text-xs focus:border-emerald-500 focus:outline-none"
              />
              <span className="text-slate-500 text-[11px]">Days</span>
            </div>
          </div>

          <div className="bg-white p-2 rounded-lg border border-emerald-200 space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-500 block">Slab 3 Max Days</label>
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[11px] font-medium">{slabs.slab2Max + 1} to</span>
              <input
                type="number"
                value={slabs.slab3Max}
                onChange={(e) => {
                  setSlabPreset("custom");
                  setSlabs((prev) => ({ ...prev, slab3Max: Number(e.target.value) }));
                }}
                className="h-7 w-16 rounded border border-slate-300 px-2 font-bold text-slate-900 text-xs focus:border-emerald-500 focus:outline-none"
              />
              <span className="text-slate-500 text-[11px]">Days</span>
            </div>
          </div>

          <div className="bg-white p-2 rounded-lg border border-emerald-200 space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-500 block">Slab 4 Max Days</label>
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[11px] font-medium">{slabs.slab3Max + 1} to</span>
              <input
                type="number"
                value={slabs.slab4Max}
                onChange={(e) => {
                  setSlabPreset("custom");
                  setSlabs((prev) => ({ ...prev, slab4Max: Number(e.target.value) }));
                }}
                className="h-7 w-16 rounded border border-slate-300 px-2 font-bold text-slate-900 text-xs focus:border-emerald-500 focus:outline-none"
              />
              <span className="text-slate-500 text-[11px]">Days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: AR / AP, Group Dropdown, All Parties Checkbox, As On Date, Display Button */}
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
            id="chk-all-parties-custom"
            checked={allParties}
            onChange={(e) => setAllParties(e.target.checked)}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
          />
          <label htmlFor="chk-all-parties-custom" className="cursor-pointer">
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
    </div>
  );

  return (
    <ModulePageShell
      eyebrow="Accounts & Party Outstanding"
      title="Outstanding Bills Aging (Custom)"
      description="Customizable day-interval aging analysis of Accounts Receivable (AR) and Accounts Payable (AP) party bills."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Party Outstanding", href: "/accounts/party-outstanding" },
        { label: "Outstanding Bills Aging (Custom)" },
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
            onClick={() => alert("Custom Outstanding Bills Aging report exported to CSV.")}
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
            <span>{showFilters ? "Hide Custom Slab Options" : "Custom Aging Parameters & Slabs"}</span>
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
            <Sliders className="h-3.5 w-3.5 text-emerald-700" />
            Slabs: 0-{slabs.slab1Max} | {slabs.slab1Max + 1}-{slabs.slab2Max} | {slabs.slab2Max + 1}-{slabs.slab3Max} | {slabs.slab3Max + 1}-{slabs.slab4Max} | &gt;{slabs.slab4Max} d
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
                WINHMS Custom Outstanding Bills Aging Parameters & Slabs
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
        title="Custom Aging Options"
      >
        <div className="p-4">
          <FilterFormContent />
          <div className="mt-4 border-t border-slate-100 pt-3">
            <Button
              type="button"
              className="w-full bg-emerald-700 text-white"
              onClick={() => setMobileFilterOpen(false)}
            >
              Apply Custom Slabs
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
          label="Overdue > S4 Threshold"
          value={formatINR(totalCustomSlabs.s5)}
          sublabel={`Over ${slabs.slab4Max} days overdue`}
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
                Custom Outstanding Bills Aging Table ({filteredBills.length} records)
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

        {/* WINHMS Custom Slab Table Format */}
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

                {/* Dynamic Custom Slab Column Headers */}
                <th className="px-3 py-2.5 text-right w-24 border-r border-slate-200">0 - {slabs.slab1Max} d</th>
                <th className="px-3 py-2.5 text-right w-24 border-r border-slate-200">{slabs.slab1Max + 1} - {slabs.slab2Max} d</th>
                <th className="px-3 py-2.5 text-right w-24 border-r border-slate-200">{slabs.slab2Max + 1} - {slabs.slab3Max} d</th>
                <th className="px-3 py-2.5 text-right w-24 border-r border-slate-200">{slabs.slab3Max + 1} - {slabs.slab4Max} d</th>
                <th className="px-3 py-2.5 text-right w-24 font-bold text-rose-800">&gt; {slabs.slab4Max} d</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400 font-medium">
                    No outstanding bills found matching custom criteria.
                  </td>
                </tr>
              ) : (
                filteredBills.map((row) => {
                  const calc = calculateBillSlabs(row);

                  return (
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
                        {calc.s1 > 0 ? formatINR(calc.s1) : "-"}
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium text-slate-700 border-r border-slate-100">
                        {calc.s2 > 0 ? formatINR(calc.s2) : "-"}
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium text-amber-800 border-r border-slate-100">
                        {calc.s3 > 0 ? formatINR(calc.s3) : "-"}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-rose-700 border-r border-slate-100">
                        {calc.s4 > 0 ? formatINR(calc.s4) : "-"}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-rose-900">
                        {calc.s5 > 0 ? formatINR(calc.s5) : "-"}
                      </td>
                    </tr>
                  );
                })
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
                  <td className="px-3 py-2.5 text-right border-r border-slate-300">{formatINR(totalCustomSlabs.s1)}</td>
                  <td className="px-3 py-2.5 text-right border-r border-slate-300">{formatINR(totalCustomSlabs.s2)}</td>
                  <td className="px-3 py-2.5 text-right border-r border-slate-300">{formatINR(totalCustomSlabs.s3)}</td>
                  <td className="px-3 py-2.5 text-right border-r border-slate-300 text-rose-800">{formatINR(totalCustomSlabs.s4)}</td>
                  <td className="px-3 py-2.5 text-right font-bold text-rose-900">{formatINR(totalCustomSlabs.s5)}</td>
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
        title="Custom Outstanding Bill Details"
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
