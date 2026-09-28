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
  AlertCircle,
  PieChart,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  Info,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  StatMiniCard,
  Drawer,
  FODatePicker,
  formatINR,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import {
  accPartyService,
  accReportService,
  type AgingBill,
  type ModuleType,
} from "@/services/accounts";
import { useAccLookups, useAccQuery, formatDate, todayIso } from "@/components/accounts/accountsApi";
import { cn } from "@/lib/utils";

const PARTY_GROUPS = [
  "Sundry Debtors",
  "Sundry Creditors",
  "Corporate Debtors",
  "Travel Agents",
  "Credit Card Company",
  "City Ledger",
];
const MSME_TYPES = ["<All>", "Micro", "Small", "Medium", "Non-MSME"];
const DEFAULT_LABELS = ["0-30", "31-60", "61-90", "91-180", ">180"];
const BUCKET_CELL_CLASSES = [
  "font-medium text-slate-700 border-r border-slate-100",
  "font-medium text-slate-700 border-r border-slate-100",
  "font-medium text-amber-800 border-r border-slate-100",
  "font-semibold text-rose-700 border-r border-slate-100",
  "font-bold text-rose-900",
];

type AgingParams = {
  modules: ModuleType[];
  partyGroup?: string;
  partyId?: string;
  asOnDate: string;
  ageBy: "billDate" | "dueDate";
};

function bucketClass(i: number, count: number) {
  return BUCKET_CELL_CLASSES[i === count - 1 ? 4 : Math.min(i, 3)];
}

function headerLabel(label: string) {
  return label.replace("-", " - ").replace(">", "> ");
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const blob = new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function OutstandingBillsAgingView() {
  // Desktop & Mobile filter state
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // WINHMS Reference Parameters
  const [includeAR, setIncludeAR] = useState(true);
  const [includeAP, setIncludeAP] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState("All Groups");
  const [allParties, setAllParties] = useState(true);
  const [selectedPartyId, setSelectedPartyId] = useState("");
  const [asOnDate, setAsOnDate] = useState(todayIso());

  // Bill Filter Options
  const [billFilterMode, setBillFilterMode] = useState<"Due Bill" | "All Bills">("All Bills");

  // Age According To Options
  const [ageAccordingTo, setAgeAccordingTo] = useState<"DueDate" | "BillDate">("BillDate");

  // Columns & MSME Filter
  const [showDueDateCol, setShowDueDateCol] = useState(true);
  const [showDueDaysCol, setShowDueDaysCol] = useState(false);
  const [selectedMSME, setSelectedMSME] = useState("<All>");

  // Search & Toast State
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");

  // Row Details Drawer State
  const [selectedRowDetail, setSelectedRowDetail] = useState<AgingBill | null>(null);

  const [applied, setApplied] = useState<AgingParams>(() => ({
    modules: ["AR", "AP"],
    asOnDate: todayIso(),
    ageBy: "billDate",
  }));

  const { lookups, error: lookupsError, reload: reloadLookups } = useAccLookups();

  const partiesQuery = useAccQuery(() => accPartyService.list(), []);
  const partyById = useMemo(
    () => new Map((partiesQuery.data ?? []).map((p) => [p.id, p])),
    [partiesQuery.data]
  );

  const report = useAccQuery(async () => {
    const results = await Promise.all(
      applied.modules.map((moduleType) =>
        accReportService.outstandingBills({
          asOnDate: applied.asOnDate,
          moduleType,
          partyGroup: applied.partyGroup,
          partyId: applied.partyId,
          ageBy: applied.ageBy,
        })
      )
    );
    return {
      labels: results[0]?.labels ?? DEFAULT_LABELS,
      bills: results.flatMap((r) => r.bills),
    };
  }, [applied]);

  const labels = report.data?.labels ?? DEFAULT_LABELS;
  const bills = useMemo(() => report.data?.bills ?? [], [report.data]);
  const loadError = report.error ?? partiesQuery.error ?? lookupsError;

  const groupOptions = useMemo(() => {
    const set = new Set(PARTY_GROUPS);
    lookups?.parties.forEach((p) => p.partyGroup && set.add(p.partyGroup));
    return ["All Groups", ...Array.from(set)];
  }, [lookups]);

  const partyOptions = useMemo(
    () =>
      (lookups?.parties ?? []).filter(
        (p) => selectedGroup === "All Groups" || p.partyGroup === selectedGroup
      ),
    [lookups, selectedGroup]
  );

  const msmeOf = (partyId: string) => partyById.get(partyId)?.msmeType || "Non-MSME";

  // Filtered Bills Logic matching WINHMS options
  const filteredBills = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bills.filter((item) => {
      if (selectedMSME !== "<All>" && (partyById.get(item.partyId)?.msmeType || "Non-MSME") !== selectedMSME) {
        return false;
      }

      if (billFilterMode === "Due Bill" && item.dueDate > applied.asOnDate) return false;

      if (q) {
        return (
          item.billNo.toLowerCase().includes(q) ||
          (item.partyName ?? "").toLowerCase().includes(q) ||
          (item.partyCode ?? "").toLowerCase().includes(q) ||
          item.refType.toLowerCase().includes(q) ||
          (item.partyGroup ?? "").toLowerCase().includes(q) ||
          (item.details ?? "").toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [bills, selectedMSME, partyById, billFilterMode, applied.asOnDate, searchQuery]);

  // Total Summary Calculations
  const totalBalance = useMemo(
    () => filteredBills.reduce((sum, b) => sum + b.balance, 0),
    [filteredBills]
  );
  const totalAR = useMemo(
    () => filteredBills.filter((b) => b.moduleType === "AR").reduce((sum, b) => sum + b.balance, 0),
    [filteredBills]
  );
  const totalAP = useMemo(
    () => filteredBills.filter((b) => b.moduleType === "AP").reduce((sum, b) => sum + b.balance, 0),
    [filteredBills]
  );
  const bucketTotals = useMemo(
    () =>
      labels.map((_, i) =>
        filteredBills.filter((b) => b.bucketIndex === i).reduce((sum, b) => sum + b.balance, 0)
      ),
    [labels, filteredBills]
  );
  const totalOver90Days = useMemo(
    () => filteredBills.filter((b) => b.ageDays > 90).reduce((sum, b) => sum + b.balance, 0),
    [filteredBills]
  );

  const showToast = (message: string, variant: "success" | "error" = "success") => {
    setToastVariant(variant);
    setToastMessage(message);
  };

  // Handle Display Button
  const handleDisplayReport = () => {
    const modules: ModuleType[] = [];
    if (includeAR) modules.push("AR");
    if (includeAP) modules.push("AP");
    if (modules.length === 0) {
      showToast("Select AR and/or AP to display the aging report.", "error");
      return false;
    }
    if (!allParties && !selectedPartyId) {
      showToast("Select a party or tick All Parties.", "error");
      return false;
    }
    setApplied({
      modules,
      partyGroup: selectedGroup === "All Groups" ? undefined : selectedGroup,
      partyId: allParties ? undefined : selectedPartyId,
      asOnDate,
      ageBy: ageAccordingTo === "DueDate" ? "dueDate" : "billDate",
    });
    return true;
  };

  const handleRetry = () => {
    if (lookupsError) void reloadLookups(true);
    if (partiesQuery.error) void partiesQuery.reload();
    void report.reload();
  };

  const handleExportCsv = () => {
    if (filteredBills.length === 0) {
      showToast("Nothing to export for the current filters.", "error");
      return;
    }
    const header = ["Bill No", "Bill Date", "Module", "Ref Type", "Party Code", "Party Name", "Party Group", "MSME Type", "Due Date", "Overdue Days", "Age Days", "Balance", ...labels];
    const rows = filteredBills.map((b) => [
      b.billNo,
      b.billDate,
      b.moduleType,
      b.refType,
      b.partyCode ?? "",
      b.partyName ?? "",
      b.partyGroup ?? "",
      msmeOf(b.partyId),
      b.dueDate,
      b.overdueDays,
      b.ageDays,
      b.balance.toFixed(2),
      ...labels.map((_, i) => (b.bucketIndex === i ? b.balance.toFixed(2) : "")),
    ]);
    rows.push(["Total", "", "", "", "", "", "", "", "", "", "", totalBalance.toFixed(2), ...bucketTotals.map((t) => t.toFixed(2))]);
    downloadCsv(`outstanding-bills-aging-${applied.asOnDate}.csv`, [header, ...rows]);
  };

  const tableColSpan = 5 + (showDueDateCol ? 1 : 0) + (showDueDaysCol ? 1 : 0) + labels.length;

  // Shared WINHMS Parameter Form Layout
  const renderFilterForm = () => (
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
        <div className="lg:col-span-3 flex items-center gap-2">
          <span className="font-semibold text-slate-600 shrink-0">Group:</span>
          <select
            value={selectedGroup}
            onChange={(e) => {
              setSelectedGroup(e.target.value);
              setSelectedPartyId("");
            }}
            className="h-8 flex-1 rounded-lg border border-slate-300 bg-white px-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
          >
            {groupOptions.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* All Parties Checkbox / Party Selector */}
        <div className="lg:col-span-3 flex items-center gap-2 font-semibold text-slate-700">
          <label htmlFor="chk-all-parties" className="flex items-center gap-1.5 shrink-0 cursor-pointer">
            <input
              type="checkbox"
              id="chk-all-parties"
              checked={allParties}
              onChange={(e) => setAllParties(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            All Parties
          </label>
          {!allParties && (
            <select
              value={selectedPartyId}
              onChange={(e) => setSelectedPartyId(e.target.value)}
              className="h-8 flex-1 min-w-0 rounded-lg border border-slate-300 bg-white px-2 text-[11px] font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none truncate"
            >
              <option value="">Select party…</option>
              {partyOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.partyName} ({p.partyCode})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* As On Date & Display Button */}
        <div className="lg:col-span-4 flex items-center gap-2 justify-end">
          <span className="font-semibold text-slate-600 shrink-0">As On:</span>
          <FODatePicker value={asOnDate} onChange={setAsOnDate} className="w-32" />
          <Button
            type="button"
            size="sm"
            onClick={handleDisplayReport}
            disabled={report.loading}
            className="h-8 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs shrink-0 cursor-pointer"
          >
            {report.loading ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5 mr-1" />
            )}
            Display
          </Button>
        </div>
      </div>

      {/* Row 2: Aging Criteria, Column Checks, MSME Filter */}
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
                checked={ageAccordingTo === "BillDate"}
                onChange={() => setAgeAccordingTo("BillDate")}
                className="text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
              />
              <span>Bill Date</span>
            </label>
          </div>
        </div>

        {/* Column Checks */}
        <div className="lg:col-span-3 space-y-1 rounded-lg bg-white p-2 border border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Columns
          </span>
          <div className="grid grid-cols-2 gap-1 font-semibold text-slate-700 text-[11px]">
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
            {MSME_TYPES.map((m) => (
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
      toastVariant={toastVariant}
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
            onClick={handleExportCsv}
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
            Module: {applied.modules.length === 2 ? "AR & AP" : applied.modules[0] === "AR" ? "AR Only" : "AP Only"}
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            <Calendar className="h-3.5 w-3.5 text-slate-600" />
            As On: {formatDate(applied.asOnDate)}
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
          {renderFilterForm()}
        </div>
      )}

      {/* Mobile Drawer */}
      <Drawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        title="Aging Options"
      >
        <div className="p-4">
          {renderFilterForm()}
          <div className="mt-4 border-t border-slate-100 pt-3">
            <Button
              type="button"
              className="w-full bg-emerald-700 text-white"
              onClick={() => {
                if (handleDisplayReport()) setMobileFilterOpen(false);
              }}
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
          label="Aged > 90 Days"
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
              placeholder="Search bill # or party..."
              className="h-8 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* WINHMS Table Format */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="px-3 py-2.5 w-24 border-r border-slate-200">Bill No</th>
                <th className="px-3 py-2.5 w-24 border-r border-slate-200">Bill Dt</th>
                <th className="px-2.5 py-2.5 w-24 border-r border-slate-200 text-center">Ref Type</th>
                <th className="px-3.5 py-2.5 min-w-[200px] border-r border-slate-200">Party Name</th>
                {showDueDateCol && <th className="px-3 py-2.5 w-24 border-r border-slate-200">Due Dt</th>}
                {showDueDaysCol && <th className="px-2.5 py-2.5 w-20 border-r border-slate-200 text-center">Due Days</th>}
                <th className="px-3 py-2.5 text-right w-28 border-r border-slate-200 bg-slate-200/50">Balance Amt</th>
                {labels.map((label, i) => (
                  <th
                    key={label}
                    className={cn(
                      "px-3 py-2.5 text-right w-24",
                      i === labels.length - 1 ? "font-bold text-rose-800" : "border-r border-slate-200"
                    )}
                  >
                    {headerLabel(label)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {report.loading && !report.data ? (
                <tr>
                  <td colSpan={tableColSpan} className="py-8 text-center text-slate-500 font-medium">
                    <Loader2 className="inline h-4 w-4 mr-1.5 animate-spin text-emerald-600" />
                    Loading outstanding bills…
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={tableColSpan} className="py-8 text-center">
                    <p className="text-rose-700 font-semibold mb-2">{loadError}</p>
                    <Button type="button" size="sm" variant="outline" onClick={handleRetry} className="text-xs">
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      Retry
                    </Button>
                  </td>
                </tr>
              ) : filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={tableColSpan} className="py-8 text-center text-slate-400 font-medium">
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
                    <td className="px-3 py-2.5 font-bold text-slate-900 border-r border-slate-100">{row.billNo}</td>
                    <td className="px-3 py-2.5 text-slate-600 font-medium border-r border-slate-100">{formatDate(row.billDate)}</td>
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
                      <span className="font-bold text-slate-900 block">{row.partyName ?? "—"}</span>
                      <span className="text-[10px] text-slate-500 font-medium block">
                        {row.partyGroup || "—"} • {msmeOf(row.partyId)}
                      </span>
                    </td>
                    {showDueDateCol && (
                      <td className="px-3 py-2.5 text-slate-600 font-medium border-r border-slate-100">{formatDate(row.dueDate)}</td>
                    )}
                    {showDueDaysCol && (
                      <td className="px-2.5 py-2.5 text-center border-r border-slate-100 font-bold text-slate-700">
                        {row.overdueDays} d
                      </td>
                    )}
                    <td className="px-3 py-2.5 text-right font-bold text-slate-900 border-r border-slate-100 bg-slate-50">
                      {formatINR(row.balance)}
                    </td>
                    {labels.map((label, i) => (
                      <td key={label} className={cn("px-3 py-2.5 text-right", bucketClass(i, labels.length))}>
                        {row.bucketIndex === i ? formatINR(row.balance) : "-"}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
            {!loadError && filteredBills.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-300 text-xs">
                  <td colSpan={showDueDateCol && showDueDaysCol ? 6 : showDueDateCol || showDueDaysCol ? 5 : 4} className="px-3 py-2.5 text-right uppercase text-[10px] tracking-wider border-r border-slate-300">
                    Total Outstanding:
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-slate-900 border-r border-slate-300 bg-slate-200/60">
                    {formatINR(totalBalance)}
                  </td>
                  {bucketTotals.map((total, i) => (
                    <td
                      key={labels[i]}
                      className={cn(
                        "px-3 py-2.5 text-right",
                        i === labels.length - 1 ? "font-bold text-rose-900" : "border-r border-slate-300",
                        i === labels.length - 2 && "text-rose-800"
                      )}
                    >
                      {formatINR(total)}
                    </td>
                  ))}
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
                <span className="font-bold text-slate-900 text-sm">{selectedRowDetail.partyName ?? "—"}</span>
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
                Group: <strong>{selectedRowDetail.partyGroup || "—"}</strong> • MSME: <strong>{msmeOf(selectedRowDetail.partyId)}</strong>
              </p>
            </div>

            <div className="space-y-2 border-b border-slate-200 pb-3 text-slate-700">
              <div className="flex justify-between">
                <span>Bill No:</span>
                <strong className="text-slate-900">{selectedRowDetail.billNo}</strong>
              </div>
              <div className="flex justify-between">
                <span>Bill Date:</span>
                <span>{formatDate(selectedRowDetail.billDate)}</span>
              </div>
              <div className="flex justify-between">
                <span>Due Date:</span>
                <span>{formatDate(selectedRowDetail.dueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span>Overdue Days:</span>
                <strong className="text-rose-700">{selectedRowDetail.overdueDays} days</strong>
              </div>
              <div className="flex justify-between">
                <span>Bill Amount:</span>
                <span>{formatINR(selectedRowDetail.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Settled Amount:</span>
                <span className="text-emerald-700 font-semibold">{formatINR(selectedRowDetail.settledAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-2">
                <span>Total Balance:</span>
                <span>{formatINR(selectedRowDetail.balance)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                Aging Bucket Breakdown ({selectedRowDetail.ageDays} days by {applied.ageBy === "dueDate" ? "due date" : "bill date"}):
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {labels.map((label, i) => (
                  <div key={label} className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-slate-500 block">{headerLabel(label)} Days</span>
                    <span className={cn("font-bold", i >= 3 ? "text-rose-800" : i === 2 ? "text-amber-800" : "text-slate-900")}>
                      {formatINR(selectedRowDetail.bucketIndex === i ? selectedRowDetail.balance : 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {(selectedRowDetail.details || selectedRowDetail.remarks) && (
              <div className="bg-amber-50 p-2.5 rounded border border-amber-200 text-amber-900 text-[11px] space-y-1">
                {selectedRowDetail.details && (
                  <p>
                    <strong>Details:</strong> {selectedRowDetail.details}
                  </p>
                )}
                {selectedRowDetail.remarks && (
                  <p>
                    <strong>Remarks:</strong> {selectedRowDetail.remarks}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </ModulePageShell>
  );
}
