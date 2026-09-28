"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
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
  PieChart,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  Info,
  Sliders,
  Phone,
  RefreshCw,
  AlertCircle,
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
  type AgingSummaryRow,
  type ModuleType,
} from "@/services/accounts";
import { useAccLookups, useAccQuery, formatDate, todayIso } from "@/components/accounts/accountsApi";
import { cn } from "@/lib/utils";

// Custom Aging Slab Interface
interface CustomSlabConfig {
  slab1Max: number; // e.g. 15
  slab2Max: number; // e.g. 30
  slab3Max: number; // e.g. 45
  slab4Max: number; // e.g. 90
}

type SlabPreset = "custom" | "short" | "standard" | "long";

const SLAB_PRESETS: Record<Exclude<SlabPreset, "custom">, CustomSlabConfig> = {
  short: { slab1Max: 15, slab2Max: 30, slab3Max: 45, slab4Max: 90 },
  standard: { slab1Max: 30, slab2Max: 60, slab3Max: 90, slab4Max: 180 },
  long: { slab1Max: 60, slab2Max: 120, slab3Max: 180, slab4Max: 360 },
};

const PARTY_GROUPS = [
  "Sundry Debtors",
  "Sundry Creditors",
  "Corporate Debtors",
  "Travel Agents",
  "Credit Card Company",
  "City Ledger",
];
const MSME_TYPES = ["<All>", "Micro", "Small", "Medium", "Non-MSME"];
const BUCKET_CELL_CLASSES = [
  "font-medium text-slate-700 border-r border-slate-100",
  "font-medium text-slate-700 border-r border-slate-100",
  "font-medium text-amber-800 border-r border-slate-100",
  "font-semibold text-rose-700 border-r border-slate-100",
  "font-bold text-rose-900",
];

type SummaryRow = AgingSummaryRow & { moduleType: ModuleType };

type SummaryParams = {
  modules: ModuleType[];
  partyGroup?: string;
  partyId?: string;
  asOnDate: string;
  ageBy: "billDate" | "dueDate";
  slabs: CustomSlabConfig;
};

function slabList(s: CustomSlabConfig) {
  return [s.slab1Max, s.slab2Max, s.slab3Max, s.slab4Max];
}

function labelsFor(s: CustomSlabConfig) {
  const [a, b, c, d] = slabList(s);
  return [`0-${a}`, `${a + 1}-${b}`, `${b + 1}-${c}`, `${c + 1}-${d}`, `>${d}`];
}

function bucketClass(i: number, count: number) {
  return BUCKET_CELL_CLASSES[i === count - 1 ? 4 : Math.min(i, 3)];
}

function headerLabel(label: string) {
  return `${label.replace("-", " - ").replace(">", "> ")} d`;
}

/** Receivables carry a debit (D) balance, payables a credit (C) balance. */
function sideOf(moduleType: ModuleType): "D" | "C" {
  return moduleType === "AR" ? "D" : "C";
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

export function OutstandingAgingSummaryCustomView() {
  // Desktop & Mobile filter state
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Custom Aging Slab State Configuration
  const [slabPreset, setSlabPreset] = useState<SlabPreset>("short");
  const [slabs, setSlabs] = useState<CustomSlabConfig>(SLAB_PRESETS.short);

  // WINHMS Reference Parameters
  const [includeAR, setIncludeAR] = useState(true);
  const [includeAP, setIncludeAP] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState("All Groups");
  const [allParties, setAllParties] = useState(true);
  const [selectedPartyId, setSelectedPartyId] = useState("");
  const [asOnDate, setAsOnDate] = useState(todayIso());

  // Age According To Options
  const [ageAccordingTo, setAgeAccordingTo] = useState<"DueDate" | "BillDate">("BillDate");
  const [selectedMSME, setSelectedMSME] = useState("<All>");

  // Search & Toast State
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");

  // Row Details Drawer State
  const [selectedPartyDetail, setSelectedPartyDetail] = useState<SummaryRow | null>(null);

  const [applied, setApplied] = useState<SummaryParams>(() => ({
    modules: ["AR", "AP"],
    asOnDate: todayIso(),
    ageBy: "billDate",
    slabs: SLAB_PRESETS.short,
  }));

  const { lookups, error: lookupsError, reload: reloadLookups } = useAccLookups();

  const partiesQuery = useAccQuery(() => accPartyService.list(), []);
  const partyById = useMemo(
    () => new Map((partiesQuery.data ?? []).map((p) => [p.id, p])),
    [partiesQuery.data]
  );

  const report = useAccQuery(async () => {
    const results = await Promise.all(
      applied.modules.map(async (moduleType) => {
        const r = await accReportService.agingSummary({
          asOnDate: applied.asOnDate,
          moduleType,
          partyGroup: applied.partyGroup,
          partyId: applied.partyId,
          ageBy: applied.ageBy,
          slabs: slabList(applied.slabs).join(","),
        });
        return { labels: r.labels, rows: r.rows.map((row): SummaryRow => ({ ...row, moduleType })) };
      })
    );
    return {
      labels: results[0]?.labels ?? labelsFor(applied.slabs),
      rows: results.flatMap((r) => r.rows),
    };
  }, [applied]);

  const labels = report.data?.labels ?? labelsFor(applied.slabs);
  const parties = useMemo(() => report.data?.rows ?? [], [report.data]);
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

  // Filtered Parties Logic matching WINHMS options
  const filteredParties = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return parties.filter((item) => {
      const msme = partyById.get(item.partyId)?.msmeType || "Non-MSME";
      if (selectedMSME !== "<All>" && msme !== selectedMSME) return false;

      if (q) {
        return (
          item.partyName.toLowerCase().includes(q) ||
          item.partyCode.toLowerCase().includes(q) ||
          (item.partyGroup ?? "").toLowerCase().includes(q) ||
          (item.city ?? "").toLowerCase().includes(q) ||
          msme.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [parties, partyById, selectedMSME, searchQuery]);

  // Grouped Parties by Group Category for Table Header Rows
  const groupedParties = useMemo(() => {
    const map = new Map<string, SummaryRow[]>();
    filteredParties.forEach((item) => {
      const g = item.partyGroup || "Ungrouped";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(item);
    });
    return map;
  }, [filteredParties]);

  // Summary Totals
  const totalAR = useMemo(
    () => filteredParties.filter((p) => p.moduleType === "AR").reduce((sum, p) => sum + p.total, 0),
    [filteredParties]
  );
  const totalAP = useMemo(
    () => filteredParties.filter((p) => p.moduleType === "AP").reduce((sum, p) => sum + p.total, 0),
    [filteredParties]
  );
  const totalBalanceAmt = totalAR - totalAP;
  const bucketTotals = useMemo(
    () => labels.map((_, i) => filteredParties.reduce((sum, p) => sum + (p.buckets[i] ?? 0), 0)),
    [labels, filteredParties]
  );
  const distinctPartyCount = useMemo(
    () => new Set(filteredParties.map((p) => p.partyId)).size,
    [filteredParties]
  );

  // Format WINHMS Amount with D or C indicator
  const formatWINHMSAmount = (amt: number, type?: "D" | "C") => {
    if (amt === 0) return "";
    const formatted = amt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${formatted}${type || ""}`;
  };

  const showToast = (message: string, variant: "success" | "error" = "success") => {
    setToastVariant(variant);
    setToastMessage(message);
  };

  const applyFilters = (slabConfig: CustomSlabConfig = slabs) => {
    const modules: ModuleType[] = [];
    if (includeAR) modules.push("AR");
    if (includeAP) modules.push("AP");
    if (modules.length === 0) {
      showToast("Select AR and/or AP to display the aging summary.", "error");
      return false;
    }
    if (!allParties && !selectedPartyId) {
      showToast("Select a party or tick All Parties.", "error");
      return false;
    }
    const list = slabList(slabConfig);
    if (list.some((n) => !Number.isInteger(n) || n <= 0) || list.some((n, i) => i > 0 && n <= list[i - 1])) {
      showToast("Slab days must be positive whole numbers in ascending order.", "error");
      return false;
    }
    setApplied({
      modules,
      partyGroup: selectedGroup === "All Groups" ? undefined : selectedGroup,
      partyId: allParties ? undefined : selectedPartyId,
      asOnDate,
      ageBy: ageAccordingTo === "DueDate" ? "dueDate" : "billDate",
      slabs: slabConfig,
    });
    return true;
  };

  // Apply Preset Slabs
  const handlePresetChange = (preset: Exclude<SlabPreset, "custom">) => {
    setSlabPreset(preset);
    setSlabs(SLAB_PRESETS[preset]);
    applyFilters(SLAB_PRESETS[preset]);
  };

  const updateSlab = (key: keyof CustomSlabConfig, value: string) => {
    setSlabPreset("custom");
    setSlabs((prev) => ({ ...prev, [key]: Number(value) }));
  };

  const handleRetry = () => {
    if (lookupsError) void reloadLookups(true);
    if (partiesQuery.error) void partiesQuery.reload();
    void report.reload();
  };

  const handleExportCsv = () => {
    if (filteredParties.length === 0) {
      showToast("Nothing to export for the current filters.", "error");
      return;
    }
    const header = ["Party Code", "Party Name", "Party Group", "Module", "MSME Type", "City", "Bills", "Oldest Days", "Balance", "Dr/Cr", ...labels];
    const rows = filteredParties.map((p) => [
      p.partyCode,
      p.partyName,
      p.partyGroup ?? "",
      p.moduleType,
      msmeOf(p.partyId),
      p.city ?? "",
      p.billsCount,
      p.oldestDays,
      p.total.toFixed(2),
      sideOf(p.moduleType),
      ...p.buckets.map((b) => b.toFixed(2)),
    ]);
    rows.push(["", "Grand Total", "", "", "", "", "", "", Math.abs(totalBalanceAmt).toFixed(2), totalBalanceAmt >= 0 ? "D" : "C", ...bucketTotals.map((t) => t.toFixed(2))]);
    downloadCsv(`outstanding-aging-summary-custom-${applied.asOnDate}.csv`, [header, ...rows]);
  };

  const tableColSpan = 2 + labels.length;
  const appliedSlabs = slabList(applied.slabs);

  // Shared WINHMS Parameter Form Layout
  const renderFilterForm = () => (
    <div className="space-y-3 text-xs">
      {/* Row 1: Custom Slab Days Configurator (WINHMS Custom Aging Feature) */}
      <div className="rounded-xl bg-emerald-50/70 p-3 border border-emerald-200 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/80 pb-2">
          <span className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
            <Sliders className="h-4 w-4 text-emerald-700" />
            WINHMS Custom Summary Day Slab Intervals Configurator
          </span>
          <div className="flex items-center gap-1 font-semibold text-[11px]">
            <span className="text-slate-600 mr-1">Presets:</span>
            {(
              [
                { id: "short", label: "Short (15d)" },
                { id: "standard", label: "Standard (30d)" },
                { id: "long", label: "Long (60d)" },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetChange(p.id)}
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
          {(
            [
              { key: "slab1Max", label: "Slab 1 Max Days", from: 0 },
              { key: "slab2Max", label: "Slab 2 Max Days", from: slabs.slab1Max + 1 },
              { key: "slab3Max", label: "Slab 3 Max Days", from: slabs.slab2Max + 1 },
              { key: "slab4Max", label: "Slab 4 Max Days", from: slabs.slab3Max + 1 },
            ] as const
          ).map((s) => (
            <div key={s.key} className="bg-white p-2 rounded-lg border border-emerald-200 space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-500 block">{s.label}</label>
              <div className="flex items-center gap-1">
                <span className="text-slate-500 text-[11px] font-medium">{s.from} to</span>
                <input
                  type="number"
                  min={1}
                  value={slabs[s.key]}
                  onChange={(e) => updateSlab(s.key, e.target.value)}
                  className="h-7 w-16 rounded border border-slate-300 px-2 font-bold text-slate-900 text-xs focus:border-emerald-500 focus:outline-none"
                />
                <span className="text-slate-500 text-[11px]">Days</span>
              </div>
            </div>
          ))}
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
          <label htmlFor="chk-all-parties-custom-summary" className="flex items-center gap-1.5 shrink-0 cursor-pointer">
            <input
              type="checkbox"
              id="chk-all-parties-custom-summary"
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
            onClick={() => applyFilters()}
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

      {/* Row 3: Age According To, MSME Filter */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 items-start bg-slate-50/80 p-3 rounded-xl border border-slate-200">
        <div className="lg:col-span-6 space-y-1 rounded-lg bg-white p-2 border border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Age According To
          </span>
          <div className="flex flex-wrap items-center gap-2 font-semibold text-slate-700 text-[11px]">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="custom-summary-age-mode"
                checked={ageAccordingTo === "DueDate"}
                onChange={() => setAgeAccordingTo("DueDate")}
                className="text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
              />
              <span>Due Date</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="custom-summary-age-mode"
                checked={ageAccordingTo === "BillDate"}
                onChange={() => setAgeAccordingTo("BillDate")}
                className="text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
              />
              <span>Bill Date</span>
            </label>
          </div>
        </div>

        <div className="lg:col-span-6 space-y-1 rounded-lg bg-white p-2 border border-slate-200">
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
      title="Outstanding Aging Summary (Custom)"
      description="Customizable day-slab party ledger aging summary grouped by customer and vendor accounts with Debit/Credit indicators."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Party Outstanding", href: "/accounts/party-outstanding" },
        { label: "Outstanding Aging Summary (Custom)" },
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
            Print Summary
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
            <span>{showFilters ? "Hide Custom Slab Options" : "Custom Summary Parameters & Slabs"}</span>
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
            Slabs: 0-{appliedSlabs[0]} | {appliedSlabs[0] + 1}-{appliedSlabs[1]} | {appliedSlabs[1] + 1}-{appliedSlabs[2]} | {appliedSlabs[2] + 1}-{appliedSlabs[3]} | &gt;{appliedSlabs[3]} d
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
                WINHMS Custom Outstanding Aging Summary Parameters & Slabs
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
        title="Custom Summary Options"
      >
        <div className="p-4">
          {renderFilterForm()}
          <div className="mt-4 border-t border-slate-100 pt-3">
            <Button
              type="button"
              className="w-full bg-emerald-700 text-white"
              onClick={() => {
                if (applyFilters()) setMobileFilterOpen(false);
              }}
            >
              Apply Custom Slabs
            </Button>
          </div>
        </div>
      </Drawer>

      {/* KPI Stat Cards Grid */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatMiniCard
          label="Net Outstanding Balance"
          value={formatWINHMSAmount(Math.abs(totalBalanceAmt), totalBalanceAmt >= 0 ? "D" : "C") || "0.00"}
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
          value={`${distinctPartyCount} Parties`}
          sublabel="Filtered by custom slabs"
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
                Custom Outstanding Aging Summary Table ({filteredParties.length} party ledgers)
              </h2>
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Double click party row to view details & bill breakdown
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

        {/* WINHMS Custom Slab Table Format */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="px-3.5 py-2.5 min-w-[220px] border-r border-slate-200">Party Name</th>
                <th className="px-3 py-2.5 text-right w-32 border-r border-slate-200 bg-slate-200/50">Balance Amt</th>

                {/* Dynamic Custom Slab Column Headers */}
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
                    Loading aging summary…
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
              ) : filteredParties.length === 0 ? (
                <tr>
                  <td colSpan={tableColSpan} className="py-8 text-center text-slate-400 font-medium">
                    No party ledger summary records found matching custom criteria.
                  </td>
                </tr>
              ) : (
                Array.from(groupedParties.entries()).map(([groupName, groupList]) => (
                  <React.Fragment key={groupName}>
                    {/* WINHMS Group Category Header Row (e.g. SUNDRY CREDITORS) */}
                    <tr className="bg-amber-100/60 font-bold text-slate-900 border-y border-amber-200/80">
                      <td colSpan={tableColSpan} className="px-3.5 py-1.5 uppercase text-[11px] tracking-wider text-amber-900">
                        {groupName} ({groupList.length} parties)
                      </td>
                    </tr>

                    {/* Party Rows under Group */}
                    {groupList.map((row) => {
                      const side = sideOf(row.moduleType);
                      return (
                        <tr
                          key={`${row.moduleType}-${row.partyId}`}
                          onDoubleClick={() => setSelectedPartyDetail(row)}
                          className="hover:bg-amber-50/60 transition-colors cursor-pointer"
                          title="Double click to view party details & bills"
                        >
                          <td className="px-3.5 py-2 font-bold text-slate-800 border-r border-slate-100 text-[11px]">
                            {row.partyName}
                            {row.overLimit && (
                              <AlertCircle className="inline h-3 w-3 ml-1 text-rose-600" aria-label="Over credit limit" />
                            )}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-slate-900 border-r border-slate-100 bg-slate-50 text-[11px]">
                            {formatWINHMSAmount(row.total, side)}
                          </td>
                          {labels.map((label, i) => (
                            <td key={label} className={cn("px-3 py-2 text-right text-[11px]", bucketClass(i, labels.length))}>
                              {formatWINHMSAmount(row.buckets[i] ?? 0, side)}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))
              )}
            </tbody>
            {!loadError && filteredParties.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-300 text-xs">
                  <td className="px-3.5 py-2.5 text-right uppercase text-[10px] tracking-wider border-r border-slate-300">
                    Grand Total Custom Summary:
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-slate-900 border-r border-slate-300 bg-slate-200/60">
                    {formatWINHMSAmount(Math.abs(totalBalanceAmt), totalBalanceAmt >= 0 ? "D" : "C")}
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
                      {formatWINHMSAmount(total)}
                    </td>
                  ))}
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
        title="Custom Party Aging Summary Details"
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
                {selectedPartyDetail.partyCode} • Group: <strong>{selectedPartyDetail.partyGroup || "—"}</strong> • MSME: <strong>{msmeOf(selectedPartyDetail.partyId)}</strong>
                {selectedPartyDetail.city ? ` • ${selectedPartyDetail.city}` : ""}
              </p>
              {partyById.get(selectedPartyDetail.partyId)?.phone && (
                <p className="text-slate-600 text-[11px] flex items-center gap-1.5 pt-1">
                  <Phone className="h-3 w-3 text-slate-500" />
                  <span>{partyById.get(selectedPartyDetail.partyId)?.phone}</span>
                </p>
              )}
            </div>

            <div className="space-y-2 border-b border-slate-200 pb-3 text-slate-700">
              <div className="flex justify-between">
                <span>Active Pending Bills Count:</span>
                <strong className="text-slate-900">{selectedPartyDetail.billsCount} Bills</strong>
              </div>
              <div className="flex justify-between">
                <span>Oldest Bill Age:</span>
                <span>{selectedPartyDetail.oldestDays} days</span>
              </div>
              <div className="flex justify-between">
                <span>Credit Days / Limit:</span>
                <span>
                  {selectedPartyDetail.creditDays} d / {selectedPartyDetail.creditLimit > 0 ? formatINR(selectedPartyDetail.creditLimit) : "No limit"}
                </span>
              </div>
              {selectedPartyDetail.overLimit && (
                <p className="text-rose-700 font-semibold text-[11px]">Outstanding exceeds the party&apos;s credit limit.</p>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-2">
                <span>Total Net Outstanding:</span>
                <span className="text-emerald-800 font-bold">
                  {formatWINHMSAmount(selectedPartyDetail.total, sideOf(selectedPartyDetail.moduleType))}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                Custom Slab Summary:
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {labels.map((label, i) => (
                  <div key={label} className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-slate-500 block">{headerLabel(label)}</span>
                    <span className={cn("font-bold", i >= 3 ? "text-rose-800" : i === 2 ? "text-amber-800" : "text-slate-900")}>
                      {formatWINHMSAmount(selectedPartyDetail.buckets[i] ?? 0, sideOf(selectedPartyDetail.moduleType)) || "0.00"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Link href="/accounts/party-outstanding/bills-aging-custom">
                <Button type="button" className="w-full bg-emerald-700 text-white font-semibold text-xs">
                  View Custom Bills Aging Breakdown
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Drawer>
    </ModulePageShell>
  );
}
