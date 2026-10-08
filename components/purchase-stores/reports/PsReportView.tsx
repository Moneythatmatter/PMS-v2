"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileSpreadsheet,
  FileText,
  Hash,
  RotateCcw,
  Search,
  Sheet,
  Table2,
  type LucideIcon,
} from "lucide-react";
import type { ReportChartConfig } from "@/app/data/frontoffice/reports";
import { ReportCharts } from "@/components/frontoffice/ReportCharts";
import { FODatePicker, FOPageHeader, SelectInput, StatMiniCard } from "@/components/frontoffice/ui";
import { ExportMenu } from "@/components/shared/ExportMenu";
import { exportTableAsCsv, exportTableAsExcel, exportTableAsPdf } from "@/lib/exportUtils";
import { cn } from "@/lib/utils";

/* ─────────────────────────── Period ─────────────────────────── */

export type ReportPeriodId = "today" | "7d" | "mtd" | "last-month" | "90d" | "fy" | "all" | "custom";

export const REPORT_PERIOD_OPTIONS: { id: ReportPeriodId; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "mtd", label: "This month" },
  { id: "last-month", label: "Last month" },
  { id: "90d", label: "Last 90 days" },
  { id: "fy", label: "This financial year" },
  { id: "all", label: "All time" },
  { id: "custom", label: "Custom range" },
];

function toIsoDay(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function periodToDates(id: ReportPeriodId): { from: string; to: string } {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const from = new Date(today);
  let to = new Date(today);
  switch (id) {
    case "7d":
      from.setDate(today.getDate() - 6);
      break;
    case "mtd":
      from.setDate(1);
      break;
    case "last-month":
      from.setMonth(today.getMonth() - 1, 1);
      to = new Date(today.getFullYear(), today.getMonth(), 0, 12);
      break;
    case "90d":
      from.setDate(today.getDate() - 89);
      break;
    case "fy": {
      // Indian financial year: 1 April – 31 March.
      const startYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
      return { from: toIsoDay(new Date(startYear, 3, 1, 12)), to: toIsoDay(today) };
    }
    case "all":
      return { from: "", to: "" };
    default:
      break;
  }
  return { from: toIsoDay(from), to: toIsoDay(to) };
}

export function useReportPeriod(initial: ReportPeriodId = "fy") {
  const [period, setPeriodId] = useState<ReportPeriodId>(initial);
  const [range, setRange] = useState(() => periodToDates(initial));

  const setPeriod = (id: ReportPeriodId) => {
    setPeriodId(id);
    if (id !== "custom") setRange(periodToDates(id));
  };
  const setFrom = (from: string) => {
    setPeriodId("custom");
    setRange((r) => ({ from, to: r.to && from > r.to ? from : r.to }));
  };
  const setTo = (to: string) => {
    setPeriodId("custom");
    setRange((r) => ({ from: r.from && to < r.from ? to : r.from, to }));
  };

  const inPeriod = useCallback(
    (date?: string | null) => {
      if (!range.from && !range.to) return true;
      const d = String(date ?? "").slice(0, 10);
      if (!d) return false;
      if (range.from && d < range.from) return false;
      if (range.to && d > range.to) return false;
      return true;
    },
    [range],
  );

  return { period, from: range.from, to: range.to, setPeriod, setFrom, setTo, inPeriod };
}

export type ReportPeriod = ReturnType<typeof useReportPeriod>;

/* ─────────────────────────── Formatting ─────────────────────────── */

export function formatMoney(n: number) {
  return `₹${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Lakh / crore shorthand for KPI cards. */
export function formatCompactMoney(n: number) {
  const v = Number(n) || 0;
  const abs = Math.abs(v);
  if (abs >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
  return `₹${Math.round(v).toLocaleString("en-IN")}`;
}

export function formatQty(n: number) {
  return (Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function formatReportDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? String(iso)
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function sumBy<T>(rows: T[], pick: (row: T) => number) {
  return rows.reduce((s, r) => s + (Number(pick(r)) || 0), 0);
}

/** Group rows and sum a value — top N by value, remainder folded into "Others". */
export function groupSum<T>(rows: T[], key: (row: T) => string, value: (row: T) => number, top = 8) {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = key(r) || "Unspecified";
    map.set(k, (map.get(k) ?? 0) + (Number(value(r)) || 0));
  }
  const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
  const head = sorted.slice(0, top).map(([name, v]) => ({ name, value: Math.round(v * 100) / 100 }));
  const rest = sorted.slice(top).reduce((s, [, v]) => s + v, 0);
  return rest > 0 ? [...head, { name: "Others", value: Math.round(rest * 100) / 100 }] : head;
}

/** Totals per calendar month, oldest first — for trend charts. */
export function monthlySum<T>(rows: T[], date: (row: T) => string, value: (row: T) => number) {
  const map = new Map<string, number>();
  for (const r of rows) {
    const d = String(date(r) ?? "").slice(0, 7);
    if (!d) continue;
    map.set(d, (map.get(d) ?? 0) + (Number(value(r)) || 0));
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ym, v]) => ({
      name: new Date(`${ym}-01T00:00:00`).toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
      value: Math.round(v * 100) / 100,
    }));
}

/* ─────────────────────────── Small cells ─────────────────────────── */

const STATUS_TONES: [RegExp, string, string][] = [
  [/overdue|critical|reject|cancel|out of stock|expired|failed/i, "bg-red-50 text-red-700 ring-red-200", "bg-red-500"],
  [/pending|below|partial|draft|awaiting|reorder|low/i, "bg-amber-50 text-amber-800 ring-amber-200", "bg-amber-500"],
  [/closed|inactive|not applicable|not issued|n\/a/i, "bg-slate-100 text-slate-600 ring-slate-200", "bg-slate-400"],
  [/overstock|sent|dispatch|replacement|transit|issued to/i, "bg-blue-50 text-blue-700 ring-blue-200", "bg-blue-500"],
  [/approved|issued|completed|received|^ok$|in stock|passed|on time|delivered|healthy/i, "bg-emerald-50 text-emerald-800 ring-emerald-200", "bg-emerald-500"],
];

export function ReportStatusPill({ status }: { status?: string | null }) {
  const label = status || "—";
  const tone = STATUS_TONES.find(([re]) => re.test(label));
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        tone ? tone[1] : "bg-slate-50 text-slate-600 ring-slate-200",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", tone ? tone[2] : "bg-slate-300")} />
      {label}
    </span>
  );
}

export function ReportProgress({ value, tone = "emerald" }: { value: number; tone?: "emerald" | "amber" | "red" | "blue" }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const bar = { emerald: "bg-emerald-500", amber: "bg-amber-500", red: "bg-red-500", blue: "bg-blue-500" }[tone];
  return (
    <div className="flex min-w-[96px] items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className={cn("h-full rounded-full", bar)} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-9 text-right text-xs tabular-nums text-slate-600">{pct}%</span>
    </div>
  );
}

export function ReportFilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[] | { value: string; label: string }[];
  allLabel?: string;
}) {
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <SelectInput
      aria-label={label}
      value={value}
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
      className={cn("!h-10 !w-auto min-w-[9.5rem] shrink-0", value !== "all" && "border-emerald-400 bg-emerald-50/60 text-emerald-900")}
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

/** Distinct, sorted, non-empty values — for building filter options. */
export function distinct(values: (string | null | undefined)[]) {
  return [...new Set(values.map((v) => (v ?? "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

/* ─────────────────────────── Report view ─────────────────────────── */

export interface ReportColumn<T> {
  key: string;
  header: string;
  /** Raw value — used for sorting, search, totals and export. */
  value: (row: T) => string | number;
  render?: (row: T) => ReactNode;
  format?: "currency" | "number" | "date";
  align?: "left" | "right" | "center";
  /** Sum this column in the totals row. */
  total?: boolean;
  className?: string;
  exportable?: boolean;
  /** Export-only column — not shown in the on-screen table. */
  hidden?: boolean;
}

export interface ReportStat {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: LucideIcon;
  accent?: string;
}

interface PsReportViewProps<T extends { id: string }> {
  title: string;
  description: string;
  stats: ReportStat[];
  rows: T[];
  columns: ReportColumn<T>[];
  charts?: ReportChartConfig[];
  loading?: boolean;
  error?: string | null;
  /** Omit for point-in-time reports (e.g. par stock). */
  period?: ReportPeriod;
  snapshotLabel?: string;
  filters?: ReactNode;
  activeFilterCount?: number;
  onResetFilters?: () => void;
  searchPlaceholder?: string;
  defaultSort?: { key: string; dir: "asc" | "desc" };
  emptyMessage?: string;
  pageSize?: number;
  rowClassName?: (row: T) => string | undefined;
}

function formatCell(value: string | number, format?: ReportColumn<unknown>["format"]) {
  if (format === "currency") return formatMoney(Number(value));
  if (format === "number") return formatQty(Number(value));
  if (format === "date") return formatReportDate(String(value));
  return value === "" || value === null || value === undefined ? "—" : String(value);
}

function exportCell(value: string | number, format?: ReportColumn<unknown>["format"]) {
  if (format === "currency") return (Number(value) || 0).toFixed(2);
  if (format === "date") return formatReportDate(String(value));
  return value ?? "";
}

export function PsReportView<T extends { id: string }>({
  title,
  description,
  stats,
  rows,
  columns: allColumns,
  charts = [],
  loading,
  error,
  period,
  snapshotLabel = "As of today",
  filters,
  activeFilterCount = 0,
  onResetFilters,
  searchPlaceholder = "Search this report…",
  defaultSort,
  emptyMessage = "No records match the selected period and filters.",
  pageSize = 25,
  rowClassName,
}: PsReportViewProps<T>) {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"register" | "analytics">("register");
  const [sort, setSort] = useState(defaultSort ?? null);
  const [page, setPage] = useState(0);
  const columns = useMemo(() => allColumns.filter((c) => !c.hidden), [allColumns]);

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => columns.some((c) => String(c.value(row) ?? "").toLowerCase().includes(q)));
  }, [rows, columns, search]);

  const sorted = useMemo(() => {
    if (!sort) return searched;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return searched;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...searched].sort((a, b) => {
      const av = col.value(a);
      const bv = col.value(b);
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true }) * dir;
    });
  }, [searched, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const hasTotals = columns.some((c) => c.total);

  const toggleSort = (key: string) => {
    setPage(0);
    setSort((s) => (s?.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }));
  };

  const periodLabel = period
    ? period.from || period.to
      ? `${formatReportDate(period.from)} – ${formatReportDate(period.to)}`
      : "All time"
    : snapshotLabel;

  const handleExport = (kind: string) => {
    const exportCols = allColumns.filter((c) => c.exportable !== false);
    const data = sorted.map((row) =>
      Object.fromEntries(exportCols.map((c) => [c.key, exportCell(c.value(row), c.format)])),
    ) as Record<string, unknown>[];
    const cols = exportCols.map((c) => ({ key: c.key, header: c.header }));
    const base = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${toIsoDay(new Date())}`;
    if (kind === "csv") exportTableAsCsv(`${base}.csv`, cols, data);
    else if (kind === "excel") exportTableAsExcel(`${base}.xls`, title, cols, data);
    else exportTableAsPdf(`${title} · ${periodLabel}`, cols, data, `${base}.pdf`, "Hotel PMS — Purchase & Stores");
  };

  return (
    <div className="space-y-5">
      <FOPageHeader
        eyebrow="Purchase & Stores · Reports"
        title={title}
        description={description}
        breadcrumbs={[{ label: "Reports", href: "/purchase-stores/reports" }, { label: title }]}
        action={
          <ExportMenu
            disabled={loading || sorted.length === 0}
            options={[
              { id: "csv", label: "CSV", description: "Comma-separated values", icon: <FileText className="h-3.5 w-3.5 text-slate-500" /> },
              { id: "excel", label: "Excel", description: "Opens in Excel / Sheets", icon: <Sheet className="h-3.5 w-3.5 text-emerald-600" /> },
              { id: "pdf", label: "PDF", description: "Printable A4 report", icon: <FileSpreadsheet className="h-3.5 w-3.5 text-red-500" /> },
            ]}
            onExport={handleExport}
          />
        }
      />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <CalendarRange className="h-3.5 w-3.5 text-slate-400" />
          {period ? "Period" : "Snapshot"} <strong className="font-semibold text-slate-800">{periodLabel}</strong>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Hash className="h-3.5 w-3.5 text-slate-400" />
          Records <strong className="font-semibold text-slate-800">{loading ? "…" : rows.length}</strong>
        </span>
        <span className="inline-flex items-center gap-1.5" suppressHydrationWarning>
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          Generated{" "}
          <strong className="font-semibold text-slate-800" suppressHydrationWarning>
            {new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </strong>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <StatMiniCard
            key={s.label}
            label={s.label}
            value={loading ? "…" : s.value}
            sublabel={s.sublabel}
            icon={s.icon}
            accent={s.accent}
          />
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[14rem] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder={searchPlaceholder}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {period && (
            <>
              <SelectInput
                aria-label="Report period"
                value={period.period}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => period.setPeriod(e.target.value as ReportPeriodId)}
                className="!h-10 !w-auto min-w-[10.5rem] shrink-0"
              >
                {REPORT_PERIOD_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </SelectInput>
              <div className="w-[9.25rem] shrink-0">
                <FODatePicker value={period.from} placeholder="From" className="!h-10" onChange={period.setFrom} />
              </div>
              <span className="text-xs text-slate-400">to</span>
              <div className="w-[9.25rem] shrink-0">
                <FODatePicker value={period.to} placeholder="To" className="!h-10" onChange={period.setTo} />
              </div>
            </>
          )}

          {filters}

          {activeFilterCount > 0 && onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset ({activeFilterCount})
            </button>
          )}

          <div className="ml-auto inline-flex shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-0.5" role="tablist" aria-label="Report view">
            {(
              [
                { id: "register", label: "Register", icon: Table2 },
                { id: "analytics", label: "Analytics", icon: BarChart3 },
              ] as const
            ).map((opt) => {
              const Icon = opt.icon;
              const active = view === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setView(opt.id)}
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors",
                    active ? "bg-emerald-700 text-white shadow-sm" : "text-slate-600 hover:bg-white hover:text-slate-900",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Couldn&apos;t load report data: {error}</span>
        </div>
      )}

      {view === "analytics" ? (
        loading ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-16 text-center text-sm text-slate-500">Loading analytics…</div>
        ) : charts.some((c) => c.data.length > 0) ? (
          <ReportCharts charts={charts.filter((c) => c.data.length > 0)} />
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-16 text-center">
            <BarChart3 className="mx-auto h-6 w-6 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-700">No chart data</p>
            <p className="text-xs text-slate-500">Widen the period or clear filters to see analytics.</p>
          </div>
        )
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="max-h-[68vh] overflow-auto">
            <table className="w-full min-w-max border-separate border-spacing-0 text-left text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                  {columns.map((c) => {
                    const active = sort?.key === c.key;
                    const SortIcon = active ? (sort?.dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
                    return (
                      <th
                        key={c.key}
                        scope="col"
                        className={cn(
                          "whitespace-nowrap border-b border-slate-200 bg-slate-50 px-4 py-2.5 font-medium",
                          c.align === "right" && "text-right",
                          c.align === "center" && "text-center",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => toggleSort(c.key)}
                          className={cn(
                            "group inline-flex items-center gap-1 uppercase tracking-wide transition-colors hover:text-slate-900",
                            active && "text-slate-900",
                            c.align === "right" && "flex-row-reverse",
                          )}
                        >
                          {c.header}
                          <SortIcon className={cn("h-3 w-3", active ? "opacity-100" : "opacity-0 group-hover:opacity-60")} />
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={`sk-${i}`}>
                      {columns.map((c) => (
                        <td key={c.key} className="border-b border-slate-100 px-4 py-3">
                          <div className="h-3.5 w-full max-w-[8rem] animate-pulse rounded bg-slate-100" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-16 text-center">
                      <Table2 className="mx-auto h-6 w-6 text-slate-300" />
                      <p className="mt-2 text-sm font-medium text-slate-700">No records</p>
                      <p className="text-xs text-slate-500">{search ? "Nothing matches your search." : emptyMessage}</p>
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row) => (
                    <tr key={row.id} className={cn("transition-colors hover:bg-slate-50/80", rowClassName?.(row))}>
                      {columns.map((c) => (
                        <td
                          key={c.key}
                          className={cn(
                            "whitespace-nowrap border-b border-slate-100 px-4 py-2.5 text-slate-700",
                            c.align === "right" && "text-right tabular-nums",
                            c.align === "center" && "text-center",
                            c.className,
                          )}
                        >
                          {c.render ? c.render(row) : formatCell(c.value(row), c.format)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
              {hasTotals && !loading && sorted.length > 0 && (
                <tfoot className="sticky bottom-0 z-10">
                  <tr className="bg-slate-50 text-sm font-semibold text-slate-900">
                    {columns.map((c, idx) => (
                      <td
                        key={c.key}
                        className={cn(
                          "whitespace-nowrap border-t border-slate-200 bg-slate-50 px-4 py-2.5",
                          c.align === "right" && "text-right tabular-nums",
                        )}
                      >
                        {c.total
                          ? formatCell(sumBy(sorted, (r) => Number(c.value(r))), c.format ?? "number")
                          : idx === 0
                            ? `Total · ${sorted.length}`
                            : ""}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {!loading && sorted.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-2.5 text-xs text-slate-500">
              <span>
                Showing <strong className="text-slate-800">{safePage * pageSize + 1}</strong>–
                <strong className="text-slate-800">{Math.min(sorted.length, (safePage + 1) * pageSize)}</strong> of{" "}
                <strong className="text-slate-800">{sorted.length}</strong>
                {sorted.length !== rows.length && ` (filtered from ${rows.length})`}
              </span>
              {pageCount > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={safePage === 0}
                    onClick={() => setPage(safePage - 1)}
                    className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 px-2.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                  </button>
                  <span className="px-2">
                    Page {safePage + 1} of {pageCount}
                  </span>
                  <button
                    type="button"
                    disabled={safePage >= pageCount - 1}
                    onClick={() => setPage(safePage + 1)}
                    className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 px-2.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
