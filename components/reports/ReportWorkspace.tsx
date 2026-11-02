"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  BarChart3,
  CalendarCheck,
  Download,
  RefreshCw,
  Search,
  Table2,
  X,
  type LucideIcon,
} from "lucide-react";
import type { ReportChartConfig, ReportColumn, ReportRow } from "@/app/data/frontoffice/reports";
import { ReportCharts } from "@/components/frontoffice/ReportCharts";
import { ReportExcelGrid } from "@/components/frontoffice/ReportExcelGrid";
import { FODatePicker, SelectInput } from "@/components/frontoffice/ui";
import { Button } from "@/components/ui/Button";
import { downloadXlsx, slugifyFilename } from "@/lib/xlsx";
import { cn } from "@/lib/utils";

export interface WorkspaceKpi {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
}

export interface WorkspaceReportOption {
  id: string;
  label: string;
  icon?: LucideIcon;
}

export interface WorkspaceDateRange {
  /** Quick range chips, e.g. Today / 7D / MTD. */
  quick: { id: string; label: string }[];
  active: string;
  onQuick: (id: string) => void;
  from: string;
  to: string;
  onFrom: (value: string) => void;
  onTo: (value: string) => void;
}

/* ─────────────────────────── Date helpers ─────────────────────────── */

export type QuickRangeId = "today" | "7d" | "30d" | "mtd" | "custom";

export const QUICK_RANGES: { id: QuickRangeId; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7D" },
  { id: "30d", label: "30D" },
  { id: "mtd", label: "MTD" },
];

export function toIsoDay(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function quickRangeDates(range: QuickRangeId): { from: string; to: string } {
  const to = new Date();
  to.setHours(12, 0, 0, 0);
  const from = new Date(to);
  if (range === "30d") from.setDate(to.getDate() - 29);
  else if (range === "mtd") from.setDate(1);
  else if (range === "7d") from.setDate(to.getDate() - 6);
  return { from: toIsoDay(from), to: toIsoDay(to) };
}

/** Quick range + from/to state wired for `ReportWorkspace`'s `dateRange` prop. */
export function useQuickDateRange(initial: QuickRangeId = "today") {
  const [range, setRange] = useState<QuickRangeId>(initial);
  const [dates, setDates] = useState(() => quickRangeDates(initial));
  const dateRange: WorkspaceDateRange = {
    quick: QUICK_RANGES,
    active: range,
    onQuick: (id) => {
      setRange(id as QuickRangeId);
      if (id !== "custom") setDates(quickRangeDates(id as QuickRangeId));
    },
    from: dates.from,
    to: dates.to,
    onFrom: (from) => {
      setRange("custom");
      setDates((d) => ({ from, to: d.to && from > d.to ? from : d.to }));
    },
    onTo: (to) => {
      setRange("custom");
      setDates((d) => ({ from: d.from && to < d.from ? to : d.from, to }));
    },
  };
  return { from: dates.from, to: dates.to, dateRange };
}

export function formatDay(iso: string) {
  if (!iso) return "";
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function periodLabelOf(from: string, to: string) {
  if (!from && !to) return "All time";
  if (from === to) return formatDay(from);
  return `${formatDay(from) || "Start"} – ${formatDay(to) || "Today"}`;
}

/* ─────────────────────────── Export ─────────────────────────── */

function excelValue(value: ReportRow[string], format?: ReportColumn["format"]) {
  if (value === undefined || value === null) return "";
  if (typeof value === "number" || !format) return value;
  const numeric = Number(String(value).replace(/[₹,%\s]/g, ""));
  return String(value).trim() !== "" && Number.isFinite(numeric) ? numeric : value;
}

export function exportReportXlsx(
  title: string,
  subtitle: string,
  columns: ReportColumn[],
  rows: ReportRow[],
  meta: [string, string | number][] = [],
) {
  downloadXlsx(`${slugifyFilename(title)}-${toIsoDay(new Date())}`, [
    {
      name: title.slice(0, 31),
      title: `${title} — ${subtitle}`,
      meta: [...meta, ["Records", rows.length], ["Generated", new Date().toLocaleString("en-IN")]],
      header: columns.map((c) => c.header),
      rows: rows.map((row) => columns.map((c) => excelValue(row[c.key], c.format))),
    },
  ]);
}

/** Columns without a format pick one from their values (₹… → currency, …% → percent) so the grid keeps the symbol. */
function inferFormat(rows: ReportRow[], key: string): ReportColumn["format"] {
  for (const row of rows) {
    const v = row[key];
    if (v === undefined || v === null || v === "" || typeof v === "number") continue;
    const text = String(v).trim();
    if (text.startsWith("₹")) return "currency";
    if (/^-?\d+(\.\d+)?%$/.test(text)) return "percent";
    return undefined;
  }
  return undefined;
}

/* ─────────────────────────── Pieces ─────────────────────────── */

function KpiCard({ kpi, loading }: { kpi: WorkspaceKpi; loading: boolean }) {
  const Icon = kpi.icon;
  const value = String(kpi.value);
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{kpi.label}</p>
          {loading ? (
            <div className="mt-2 h-6 w-24 animate-pulse rounded bg-slate-100" />
          ) : (
            <p className="mt-1 truncate text-xl font-bold tabular-nums text-slate-900" title={value}>
              {value}
            </p>
          )}
          <p className="mt-0.5 truncate text-xs text-slate-500">{loading ? "\u00a0" : kpi.hint || "\u00a0"}</p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-200">
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

/** Use for extra toolbar filters so they match the workspace controls. */
export function WorkspaceFilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: (string | { value: string; label: string })[];
  allLabel?: string;
}) {
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <SelectInput
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "!h-9 !w-auto min-w-[8.5rem] shrink-0",
        value !== "all" && "border-emerald-400 bg-emerald-50/60 text-emerald-900",
      )}
    >
      <option value="all">{allLabel ?? `All ${label.toLowerCase()}`}</option>
      {opts.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </SelectInput>
  );
}

/* ─────────────────────────── Workspace ─────────────────────────── */

export function ReportWorkspace({
  eyebrow,
  title,
  description,
  reportOptions,
  activeReport,
  onReportChange,
  periodLabel,
  loading = false,
  error,
  onRefresh,
  onExport,
  exportSlot,
  kpis,
  search,
  onSearchChange,
  searchPlaceholder = "Search this report…",
  dateRange,
  filters,
  filtersActive = false,
  onClearFilters,
  columns,
  rows,
  totalRows,
  charts,
  sheetTabs = true,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  reportOptions?: WorkspaceReportOption[];
  activeReport?: string;
  onReportChange?: (id: string) => void;
  /** Chip next to the title; defaults to the date range. */
  periodLabel?: string;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onExport?: () => void;
  /** Replaces the default Export Excel button (e.g. a multi-format menu). */
  exportSlot?: ReactNode;
  kpis: WorkspaceKpi[];
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  dateRange?: WorkspaceDateRange;
  filters?: ReactNode;
  filtersActive?: boolean;
  onClearFilters?: () => void;
  columns: ReportColumn[];
  rows: ReportRow[];
  /** Row count before search / filters, for "Showing x of y". */
  totalRows?: number;
  charts: ReportChartConfig[];
  /** Mirror the report switcher as Excel sheet tabs under the grid. */
  sheetTabs?: boolean;
}) {
  const [viewMode, setViewMode] = useState<"table" | "graph">("table");
  const active = reportOptions?.find((o) => o.id === activeReport);
  const ActiveIcon = active?.icon;
  const chip = periodLabel ?? (dateRange ? periodLabelOf(dateRange.from, dateRange.to) : undefined);
  const anyFilter = filtersActive || search.trim() !== "";
  const visibleCharts = charts.filter((c) => c.data.length > 0);
  const gridColumns = useMemo(
    () => columns.map((c) => (c.format ? c : { ...c, format: inferFormat(rows, c.key) })),
    [columns, rows],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">{eyebrow}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
            {chip ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                <CalendarCheck className="h-3.5 w-3.5" />
                {chip}
              </span>
            ) : null}
          </div>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {reportOptions?.length && onReportChange ? (
            <div className="relative">
              {ActiveIcon ? (
                <ActiveIcon className="pointer-events-none absolute left-2.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-emerald-600" />
              ) : null}
              <SelectInput
                value={activeReport}
                onChange={(e) => onReportChange(e.target.value)}
                className={cn(
                  "!h-8 !w-auto min-w-[11.5rem] text-sm font-semibold text-slate-800",
                  ActiveIcon && "!pl-8",
                )}
                aria-label="Report type"
              >
                {reportOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </SelectInput>
            </div>
          ) : null}
          {onRefresh ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={onRefresh}
              disabled={loading}
              title="Reload report"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Refresh
            </Button>
          ) : null}
          {exportSlot ??
            (onExport ? (
              <Button
                type="button"
                size="sm"
                className="gap-1.5 bg-emerald-700 text-white hover:bg-emerald-800"
                onClick={onExport}
                disabled={loading || !rows.length}
              >
                <Download className="h-3.5 w-3.5" />
                Export Excel
              </Button>
            ) : null)}
        </div>
      </div>

      {kpis.length ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} kpi={kpi} loading={loading && !rows.length} />
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="relative min-w-[13rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        {dateRange ? (
          <>
            <div className="inline-flex shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-0.5" aria-label="Quick range">
              {dateRange.quick.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => dateRange.onQuick(opt.id)}
                  className={cn(
                    "h-8 rounded-md px-2.5 text-xs font-semibold transition-colors",
                    dateRange.active === opt.id
                      ? "bg-white text-emerald-800 shadow-sm ring-1 ring-slate-200"
                      : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <div className="w-[9.25rem]">
                <FODatePicker value={dateRange.from} placeholder="From date" className="!h-9" onChange={dateRange.onFrom} />
              </div>
              <span className="text-xs text-slate-400">to</span>
              <div className="w-[9.25rem]">
                <FODatePicker value={dateRange.to} placeholder="To date" className="!h-9" onChange={dateRange.onTo} />
              </div>
            </div>
          </>
        ) : null}

        {filters}

        {anyFilter ? (
          <button
            type="button"
            onClick={() => {
              onSearchChange("");
              onClearFilters?.();
            }}
            className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        ) : null}

        <div
          className="ml-auto inline-flex shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-0.5"
          role="tablist"
          aria-label="Report view"
        >
          {(
            [
              { id: "table", label: "Sheet", icon: Table2 },
              { id: "graph", label: "Charts", icon: BarChart3 },
            ] as const
          ).map((opt) => {
            const Icon = opt.icon;
            const selected = viewMode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={selected}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors",
                  selected ? "bg-emerald-700 text-white shadow-sm" : "text-slate-600 hover:bg-white hover:text-slate-900",
                )}
                onClick={() => setViewMode(opt.id)}
              >
                <Icon className="h-3.5 w-3.5" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      <p className="text-xs text-slate-500">
        Showing <span className="font-semibold text-slate-700">{rows.length}</span> of {totalRows ?? rows.length} records
        {viewMode === "table" ? " · click a header to sort, drag to move, drag its edge to resize" : ""}
      </p>

      {viewMode === "table" ? (
        <ReportExcelGrid
          columns={gridColumns}
          rows={rows}
          loading={loading}
          sheets={sheetTabs && reportOptions && onReportChange ? reportOptions : undefined}
          activeSheet={activeReport}
          onSheetChange={(id) => onReportChange?.(id)}
        />
      ) : visibleCharts.length ? (
        <ReportCharts charts={visibleCharts} />
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
          No chart data for the selected filters.
        </div>
      )}
    </div>
  );
}
