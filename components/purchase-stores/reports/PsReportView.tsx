"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowUpRight,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  Sheet,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import type { ReportChartConfig, ReportColumn as GridColumn, ReportRow } from "@/app/data/frontoffice/reports";
import { SelectInput } from "@/components/frontoffice/ui";
import { ReportWorkspace, type WorkspaceReportOption } from "@/components/reports/ReportWorkspace";
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
      className={cn("!h-9 !w-auto min-w-[8.5rem] shrink-0", value !== "all" && "border-emerald-400 bg-emerald-50/60 text-emerald-900")}
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

function exportCell(value: string | number, format?: ReportColumn<unknown>["format"]) {
  if (format === "currency") return (Number(value) || 0).toFixed(2);
  if (format === "date") return formatReportDate(String(value));
  return value ?? "";
}

function gridCell(value: string | number, format?: ReportColumn<unknown>["format"]) {
  if (format === "date") return value ? formatReportDate(String(value)) : "";
  if (format === "currency" || format === "number") return Number(value) || 0;
  return value === null || value === undefined ? "" : value;
}

const PS_REPORTS: WorkspaceReportOption[] = [
  { id: "stock-register", label: "Stock Register", icon: FileText },
  { id: "par-stock", label: "Par Stock", icon: SlidersHorizontal },
  { id: "spoilage", label: "Spoilage & Write-offs", icon: AlertTriangle },
  { id: "issues", label: "Issue Register", icon: ArrowUpRight },
  { id: "purchases", label: "Purchase Register", icon: ShoppingBag },
  { id: "orders", label: "Purchase Order Status", icon: ShoppingCart },
  { id: "returns", label: "Vendor Returns", icon: RotateCcw },
];

export const PS_REPORT_IDS = PS_REPORTS.map((r) => r.id);
export const PS_DEFAULT_REPORT = "stock-register";

const PERIOD_CHIPS: { id: ReportPeriodId; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7D" },
  { id: "mtd", label: "MTD" },
  { id: "last-month", label: "Last month" },
  { id: "90d", label: "90D" },
  { id: "fy", label: "FY" },
  { id: "all", label: "All" },
];

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
}: PsReportViewProps<T>) {
  const router = useRouter();
  const activeType = useSearchParams().get("type") ?? PS_DEFAULT_REPORT;
  const [search, setSearch] = useState("");
  const columns = useMemo(() => allColumns.filter((c) => !c.hidden), [allColumns]);

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => allColumns.some((c) => String(c.value(row) ?? "").toLowerCase().includes(q)));
  }, [rows, allColumns, search]);

  const sorted = useMemo(() => {
    if (!defaultSort) return searched;
    const col = allColumns.find((c) => c.key === defaultSort.key);
    if (!col) return searched;
    const dir = defaultSort.dir === "asc" ? 1 : -1;
    return [...searched].sort((a, b) => {
      const av = col.value(a);
      const bv = col.value(b);
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true }) * dir;
    });
  }, [searched, defaultSort, allColumns]);

  const gridColumns = useMemo<GridColumn[]>(
    () =>
      columns.map((c) => ({
        key: c.key,
        header: c.header,
        format: c.format === "currency" ? "currency" : undefined,
      })),
    [columns],
  );

  const gridRows = useMemo<ReportRow[]>(
    () =>
      sorted.map((row) => {
        const out: ReportRow = { id: row.id };
        for (const c of columns) out[c.key] = gridCell(c.value(row), c.format);
        return out;
      }),
    [sorted, columns],
  );

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
    <ReportWorkspace
      eyebrow="Purchase & Stores · Reports"
      title={title}
      description={description}
      reportOptions={PS_REPORTS}
      activeReport={activeType}
      onReportChange={(id) => router.replace(`/purchase-stores/reports?type=${id}`, { scroll: false })}
      periodLabel={periodLabel}
      loading={loading}
      error={error ? `Couldn't load report data: ${error}` : null}
      exportSlot={
        <ExportMenu
          label="Export"
          disabled={loading || sorted.length === 0}
          buttonClassName="!h-8"
          options={[
            { id: "excel", label: "Excel", description: "Opens in Excel / Sheets", icon: <Sheet className="h-3.5 w-3.5 text-emerald-600" /> },
            { id: "csv", label: "CSV", description: "Comma-separated values", icon: <FileText className="h-3.5 w-3.5 text-slate-500" /> },
            { id: "pdf", label: "PDF", description: "Printable A4 report", icon: <FileSpreadsheet className="h-3.5 w-3.5 text-red-500" /> },
          ]}
          onExport={handleExport}
        />
      }
      kpis={stats.map((s) => ({ label: s.label, value: s.value, hint: s.sublabel, icon: s.icon }))}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder={searchPlaceholder}
      dateRange={
        period
          ? {
              quick: PERIOD_CHIPS,
              active: period.period,
              onQuick: (id) => period.setPeriod(id as ReportPeriodId),
              from: period.from,
              to: period.to,
              onFrom: period.setFrom,
              onTo: period.setTo,
            }
          : undefined
      }
      filters={filters}
      filtersActive={activeFilterCount > 0}
      onClearFilters={onResetFilters}
      columns={gridColumns}
      rows={gridRows}
      totalRows={rows.length}
      charts={charts}
      sheetTabs={false}
    />
  );
}
