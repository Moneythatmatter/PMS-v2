"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Banknote,
  BarChart3,
  BedDouble,
  CalendarCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  DoorOpen,
  Download,
  Globe,
  LogOut,
  Percent,
  Receipt,
  RotateCcw,
  Search,
  Star,
  Table2,
  TrendingUp,
  UserCheck,
  Users,
  UtensilsCrossed,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type {
  ReportChartConfig,
  ReportDefinition,
  ReportId,
  ReportRow,
} from "@/app/data/frontoffice/reports";
import { reportDefinitions, reportStatusClass } from "@/app/data/frontoffice/reports";
import { reportService } from "@/services/front-office";
import { ReportCharts } from "@/components/frontoffice/ReportCharts";
import { NightAuditView } from "@/components/frontoffice/NightAuditView";
import { SelectInput, FODatePicker, formatINR } from "@/components/frontoffice/ui";
import { ModuleDataTable, ModulePageShell } from "@/components/pms";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type ViewMode = "table" | "graph";
type RangeId = "today" | "7d" | "30d" | "mtd" | "custom";

const RANGE_OPTIONS: { id: RangeId; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "mtd", label: "Month to date" },
  { id: "custom", label: "Custom range" },
];

function toIsoDay(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function rangeToDates(range: RangeId): { from: string; to: string } {
  const to = new Date();
  to.setHours(12, 0, 0, 0);
  const from = new Date(to);
  if (range === "today") {
    /* same day */
  } else if (range === "30d") {
    from.setDate(to.getDate() - 29);
  } else if (range === "mtd") {
    from.setDate(1);
  } else {
    from.setDate(to.getDate() - 6);
  }
  return { from: toIsoDay(from), to: toIsoDay(to) };
}

const REPORT_STAT_ICONS: Record<string, LucideIcon[]> = {
  arrival: [CalendarCheck, CheckCircle2, BedDouble, Star],
  departure: [LogOut, CheckCircle2, AlertCircle, Wallet],
  occupancy: [BedDouble, DoorOpen, Wrench, TrendingUp],
  revenue: [TrendingUp, BedDouble, UtensilsCrossed, Receipt],
  cashier: [Wallet, Banknote, CreditCard, RotateCcw],
  "night-audit": [Clock, Receipt, AlertTriangle, CheckCircle2],
  guest: [Users, Globe, Globe, UserCheck],
  room: [DoorOpen, BedDouble, CheckCircle2, AlertTriangle],
  tax: [Receipt, Percent, Percent, Wallet],
};

function parseMoney(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const raw = String(value ?? "")
    .replace(/₹/g, "")
    .replace(/,/g, "")
    .replace(/\s/g, "")
    .toUpperCase();
  if (!raw || raw === "—") return 0;
  if (raw.endsWith("L")) return (Number.parseFloat(raw) || 0) * 100_000;
  if (raw.endsWith("K")) return (Number.parseFloat(raw) || 0) * 1_000;
  return Number.parseFloat(raw) || 0;
}

function countBy(rows: ReportRow[], key: string): ReportChartConfig["data"] {
  const map: Record<string, number> = {};
  for (const row of rows) {
    const name = String(row[key] ?? "Other");
    map[name] = (map[name] ?? 0) + 1;
  }
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}

function sumBy(
  rows: ReportRow[],
  nameKey: string,
  valueKey: string,
): ReportChartConfig["data"] {
  const map: Record<string, number> = {};
  for (const row of rows) {
    const name = String(row[nameKey] ?? "Other");
    map[name] = (map[name] ?? 0) + parseMoney(row[valueKey]);
  }
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}

function buildCharts(type: ReportId, rows: ReportRow[]): ReportChartConfig[] {
  if (!rows.length) return [];

  switch (type) {
    case "arrival":
      return [
        {
          title: "Arrivals by status",
          type: "pie",
          data: countBy(rows, "status"),
          valueFormat: "number",
        },
        {
          title: "Arrivals by source",
          type: "bar",
          data: countBy(rows, "source"),
          valueFormat: "number",
          layout: "horizontal",
        },
      ];
    case "departure":
      return [
        {
          title: "Departures by status",
          type: "pie",
          data: countBy(rows, "status"),
          valueFormat: "number",
        },
        {
          title: "Outstanding balance",
          type: "bar",
          data: rows.slice(0, 12).map((r) => ({
            name: String(r.guestName ?? r.guest ?? r.roomNo ?? r.id),
            value: parseMoney(r.balance),
          })),
          valueFormat: "currency",
          layout: "horizontal",
        },
      ];
    case "occupancy":
      return [
        {
          title: "Rooms by status",
          type: "pie",
          data: countBy(rows, "status"),
          valueFormat: "number",
        },
        {
          title: "Rooms by type",
          type: "bar",
          data: countBy(rows, "type"),
          valueFormat: "number",
          layout: "horizontal",
        },
      ];
    case "revenue":
      return [
        {
          title: "Room revenue",
          type: "bar",
          data: rows.slice(0, 12).map((r) => ({
            name: String(r.guestName ?? r.guest ?? r.bookingId ?? r.id),
            value: parseMoney(r.roomRevenue ?? r.amount ?? r.totalAmount),
          })),
          valueFormat: "currency",
          layout: "horizontal",
        },
        {
          title: "Balance outstanding",
          type: "bar",
          data: sumBy(rows, "status", "balance"),
          valueFormat: "currency",
        },
      ];
    case "cashier":
      return [
        {
          title: "Shifts by status",
          type: "pie",
          data: countBy(rows, "status"),
          valueFormat: "number",
        },
        {
          title: "Collections",
          type: "bar",
          data: rows.map((r) => ({
            name: String(r.cashier ?? r.shift ?? r.id),
            value:
              parseMoney(r.cashSales) +
              parseMoney(r.cardSales) +
              parseMoney(r.upiSales) +
              parseMoney(r.sales),
          })),
          valueFormat: "currency",
          layout: "horizontal",
        },
      ];
    case "guest":
      return [
        {
          title: "Guests by status",
          type: "pie",
          data: countBy(rows, "status"),
          valueFormat: "number",
        },
        {
          title: "Guests by nationality",
          type: "bar",
          data: countBy(rows, "nationality"),
          valueFormat: "number",
          layout: "horizontal",
        },
      ];
    case "room":
      return [
        {
          title: "Rooms by status",
          type: "pie",
          data: countBy(rows, "status"),
          valueFormat: "number",
        },
        {
          title: "Rooms by type",
          type: "bar",
          data: countBy(rows, "roomType"),
          valueFormat: "number",
          layout: "horizontal",
        },
      ];
    case "tax":
      return [
        {
          title: "GST by booking",
          type: "bar",
          data: rows.slice(0, 12).map((r) => ({
            name: String(r.bookingId ?? r.guest ?? r.id),
            value: parseMoney(r.gst),
          })),
          valueFormat: "currency",
          layout: "horizontal",
        },
        {
          title: "Taxable amount",
          type: "area",
          data: rows.slice(0, 12).map((r, i) => ({
            name: String(r.bookingId ?? i + 1),
            value: parseMoney(r.taxableAmount),
          })),
          valueFormat: "currency",
        },
      ];
    default:
      return [
        {
          title: "Report distribution",
          type: "bar",
          data: countBy(rows, "status"),
          valueFormat: "number",
        },
      ];
  }
}

function normalizeRow(type: ReportId, row: Record<string, unknown>, index: number): ReportRow {
  const id = String(
    row.id ??
      row.bookingId ??
      row.room ??
      row.roomNo ??
      row.metric ??
      `report-${type}-${index}`,
  );

  return {
    id,
    ...row,
    guestName: String(row.guestName ?? row.guest ?? ""),
    guest: String(row.guest ?? row.guestName ?? ""),
    roomNo: String(row.roomNo ?? row.room ?? ""),
    room: String(row.room ?? row.roomNo ?? ""),
    roomType: String(row.roomType ?? row.type ?? ""),
    type: String(row.type ?? row.roomType ?? ""),
    checkOutTime: String(row.checkOutTime ?? row.checkOut ?? ""),
    eta: String(row.eta ?? row.checkIn ?? ""),
    status: row.status !== undefined ? String(row.status) : undefined,
  } as ReportRow;
}

function buildStats(
  base: ReportDefinition,
  rows: ReportRow[],
  summary: Record<string, unknown>,
) {
  const icons = REPORT_STAT_ICONS[base.id] ?? [Receipt, Receipt, Receipt, Receipt];
  const fromSummary = Object.entries(summary).map(([label, value], i) => ({
    label: label
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (c) => c.toUpperCase())
      .trim(),
    value:
      typeof value === "number"
        ? label.toLowerCase().includes("revenue") ||
          label.toLowerCase().includes("payment") ||
          label.toLowerCase().includes("total")
          ? formatINR(value)
          : value
        : String(value),
    icon: icons[i % icons.length],
  }));

  if (fromSummary.length) return fromSummary.slice(0, 4);

  return [
    { label: "Records", value: rows.length, icon: icons[0] },
    {
      label: "Active",
      value: rows.filter((r) => String(r.status ?? "").toLowerCase() !== "cancelled").length,
      icon: icons[1],
    },
    {
      label: "Pending",
      value: rows.filter((r) => /pending|open/i.test(String(r.status ?? ""))).length,
      icon: icons[2],
    },
    { label: "Total", value: rows.length, icon: icons[3] },
  ];
}

function exportCsv(title: string, columns: ReportDefinition["columns"], rows: ReportRow[]) {
  const header = columns.map((c) => c.header).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((c) => `"${String(row[c.key] ?? "").replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
  const blob = new Blob([[header, body].filter(Boolean).join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function ReportListView({ type }: { type: ReportId }) {
  const base = reportDefinitions[type];
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [summary, setSummary] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [range, setRange] = useState<RangeId>("today");
  const initialDates = rangeToDates("today");
  const [fromDate, setFromDate] = useState(initialDates.from);
  const [toDate, setToDate] = useState(initialDates.to);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const applyRange = (next: RangeId) => {
    setRange(next);
    if (next === "custom") return;
    const dates = rangeToDates(next);
    setFromDate(dates.from);
    setToDate(dates.to);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await reportService.get(type);
        if (cancelled) return;
        const apiRows = (data.rows as Record<string, unknown>[]) ?? [];
        setRows(apiRows.map((row, index) => normalizeRow(type, row, index)));
        setSummary(data.summary ?? {});
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setRows([]);
          setSummary({});
          setError(e instanceof Error ? e.message : "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [type]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== "all") {
        const status = String(row.status ?? row.band ?? "");
        if (status !== statusFilter) return false;
      }
      if (!q) return true;
      return Object.values(row).some((v) =>
        String(v ?? "").toLowerCase().includes(q),
      );
    });
  }, [rows, search, statusFilter]);

  const charts = useMemo(() => {
    if (base.charts?.length) return base.charts;
    return buildCharts(type, filtered);
  }, [base.charts, type, filtered]);

  const stats = useMemo(
    () => buildStats(base, filtered, summary),
    [base, filtered, summary],
  );

  const statusMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const row of filtered) {
      if (row.status) map[String(row.status)] = reportStatusClass(String(row.status));
      if (row.band) map[String(row.band)] = reportStatusClass(String(row.band));
    }
    return map;
  }, [filtered]);

  const toolbar = (
    <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm scrollbar-none">
      <div className="relative min-w-[12rem] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={base.searchPlaceholder}
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        />
      </div>
      <SelectInput
        value={range}
        onChange={(e) => applyRange(e.target.value as RangeId)}
        className="!h-10 !w-auto min-w-[9.5rem] shrink-0"
        aria-label="Date range"
      >
        {RANGE_OPTIONS.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </SelectInput>
      <div className="flex shrink-0 items-center gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          From
        </span>
        <div className="w-[9.25rem]">
          <FODatePicker
            value={fromDate}
            placeholder="From date"
            className="!h-10"
            onChange={(value) => {
              setFromDate(value);
              setRange("custom");
              if (toDate && value > toDate) setToDate(value);
            }}
          />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          To
        </span>
        <div className="w-[9.25rem]">
          <FODatePicker
            value={toDate}
            placeholder="To date"
            className="!h-10"
            onChange={(value) => {
              setToDate(value);
              setRange("custom");
              if (fromDate && value < fromDate) setFromDate(value);
            }}
          />
        </div>
      </div>
      {base.filterOptions?.length ? (
        <SelectInput
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="!h-10 !w-auto min-w-[9rem] shrink-0"
          aria-label="Status filter"
        >
          {base.filterOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </SelectInput>
      ) : null}
      <div
        className="inline-flex shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-0.5"
        role="tablist"
        aria-label="Report view"
      >
        {(
          [
            { id: "table", label: "Table", icon: Table2 },
            { id: "graph", label: "Graph report", icon: BarChart3 },
          ] as const
        ).map((opt) => {
          const Icon = opt.icon;
          const active = viewMode === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors",
                active
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "text-slate-600 hover:bg-white hover:text-slate-900",
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
  );

  if (loading) {
    return (
      <ModulePageShell
        eyebrow="Front Office · Reports"
        title={base.title}
        description={base.description}
        wrapChildren={false}
      >
        <p className="text-sm text-slate-500">Loading report…</p>
      </ModulePageShell>
    );
  }

  if (error) {
    return (
      <ModulePageShell
        eyebrow="Front Office · Reports"
        title={base.title}
        description={base.description}
        wrapChildren={false}
      >
        <p className="text-sm text-red-600">{error}</p>
      </ModulePageShell>
    );
  }

  return (
    <ModulePageShell
      eyebrow="Front Office · Reports"
      title={base.title}
      description={base.description}
      wrapChildren={false}
      stats={stats}
      actionButtons={
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1"
          onClick={() => exportCsv(base.title, base.columns, filtered)}
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
      }
      aboveTable={
        <div className="space-y-3">
          {toolbar}
          {viewMode === "table" ? (
            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-medium text-slate-700">{filtered.length}</span> of{" "}
              {rows.length} records ·{" "}
              {fromDate} → {toDate}
            </p>
          ) : null}
          {viewMode === "graph" ? (
            charts.length ? (
              <ReportCharts charts={charts} />
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
                No chart data for the selected filters.
              </div>
            )
          ) : null}
        </div>
      }
    >
      {viewMode === "table" ? (
        <ModuleDataTable
          columns={base.columns}
          rows={filtered}
          statusMap={statusMap}
          emptyMessage="No records match your search or filters."
        />
      ) : null}
    </ModulePageShell>
  );
}

export function DailyArrivalReportView() {
  return <ReportListView type="arrival" />;
}

export function DepartureReportView() {
  return <ReportListView type="departure" />;
}

export function OccupancyReportView() {
  return <ReportListView type="occupancy" />;
}

export function RevenueReportView() {
  return <ReportListView type="revenue" />;
}

export function CashierReportView() {
  return <ReportListView type="cashier" />;
}

export function NightAuditReportView() {
  return <NightAuditView />;
}

export function GuestReportView() {
  return <ReportListView type="guest" />;
}

export function RoomReportView() {
  return <ReportListView type="room" />;
}

export function TaxReportView() {
  return <ReportListView type="tax" />;
}
