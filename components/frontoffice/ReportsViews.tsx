"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  Banknote,
  BedDouble,
  CalendarCheck,
  CheckCircle2,
  Clock,
  DoorOpen,
  Globe,
  LogOut,
  Percent,
  Receipt,
  RotateCcw,
  Star,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type {
  ReportChartConfig,
  ReportId,
  ReportRow,
} from "@/app/data/frontoffice/reports";
import { reportDefinitions } from "@/app/data/frontoffice/reports";
import { reportService } from "@/services/front-office";
import {
  ReportWorkspace,
  WorkspaceFilterSelect,
  exportReportXlsx,
  useQuickDateRange,
} from "@/components/reports/ReportWorkspace";
import { NightAuditView } from "@/components/frontoffice/NightAuditView";
import { formatINR } from "@/components/frontoffice/ui";

type ListReportId = Exclude<ReportId, "night-audit">;

export const REPORT_TYPE_OPTIONS: { id: ListReportId; label: string }[] = [
  { id: "arrival", label: "Daily Arrival" },
  { id: "departure", label: "Departure Report" },
  { id: "occupancy", label: "Occupancy Report" },
  { id: "revenue", label: "Revenue Report" },
  { id: "cashier", label: "Cashier Report" },
  { id: "guest", label: "Guest Report" },
  { id: "room", label: "Room Report" },
  { id: "tax", label: "Tax Report" },
];

function isListReportId(value: string | null): value is ListReportId {
  return REPORT_TYPE_OPTIONS.some((opt) => opt.id === value);
}
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
          title: "Occupancy by room type",
          type: "bar",
          data: rows.map((r) => ({
            name: String(r.roomType ?? r.id),
            value: Number(r.occupancy ?? 0),
          })),
          valueFormat: "number",
          layout: "horizontal",
        },
        {
          title: "Room nights sold",
          type: "pie",
          data: rows
            .map((r) => ({ name: String(r.roomType ?? r.id), value: Number(r.occupied ?? 0) }))
            .filter((d) => d.value > 0),
          valueFormat: "number",
        },
      ];
    case "revenue":
      return [
        {
          title: "Revenue by category",
          type: "bar",
          data: sumBy(rows, "category", "amount"),
          valueFormat: "currency",
          layout: "horizontal",
        },
        {
          title: "Revenue share by group",
          type: "pie",
          data: sumBy(rows, "group", "amount"),
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
            value: parseMoney(r.collected),
          })),
          valueFormat: "currency",
          layout: "horizontal",
        },
      ];
    case "guest":
      return [
        {
          title: "Guests by segment",
          type: "pie",
          data: countBy(rows, "segment"),
          valueFormat: "number",
        },
        {
          title: "Revenue by guest",
          type: "bar",
          data: rows
            .slice()
            .sort((a, b) => parseMoney(b.revenue) - parseMoney(a.revenue))
            .slice(0, 10)
            .map((r) => ({ name: String(r.guestName ?? r.id), value: parseMoney(r.revenue) })),
          valueFormat: "currency",
          layout: "horizontal",
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
          title: "Tax collected by category",
          type: "bar",
          data: rows.map((r) => ({
            name: String(r.category ?? r.id),
            value: parseMoney(r.totalTax),
          })),
          valueFormat: "currency",
          layout: "horizontal",
        },
        {
          title: "Taxable value by group",
          type: "pie",
          data: Object.entries(
            rows.reduce<Record<string, number>>((acc, r) => {
              const key = String(r.group ?? "Other");
              acc[key] = (acc[key] ?? 0) + parseMoney(r.taxable);
              return acc;
            }, {}),
          ).map(([name, value]) => ({ name, value })),
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

/** Row ids fall back to room / booking numbers, which repeat across stays — suffix repeats so table keys stay unique. */
function withUniqueIds(rows: ReportRow[]): ReportRow[] {
  const seen = new Map<string, number>();
  return rows.map((row) => {
    const uses = seen.get(row.id) ?? 0;
    seen.set(row.id, uses + 1);
    return uses === 0 ? row : { ...row, id: `${row.id}-${uses}` };
  });
}

type Kpi = { label: string; value: string; hint: string; icon: LucideIcon };

const REPORT_ICONS: Record<ListReportId, LucideIcon> = {
  arrival: CalendarCheck,
  departure: LogOut,
  occupancy: BedDouble,
  revenue: TrendingUp,
  cashier: Wallet,
  guest: Users,
  room: DoorOpen,
  tax: Receipt,
};

const sumOf = (rows: ReportRow[], key: string) => rows.reduce((n, r) => n + parseMoney(r[key]), 0);
const countWhere = (rows: ReportRow[], re: RegExp, key = "status") =>
  rows.filter((r) => re.test(String(r[key] ?? ""))).length;
const pctOf = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);
const plural = (n: number, word: string) => `${n.toLocaleString("en-IN")} ${word}${n === 1 ? "" : "s"}`;

function topBy(rows: ReportRow[], labelKey: string, valueKey?: string) {
  const totals = new Map<string, number>();
  for (const r of rows) {
    const name = String(r[labelKey] ?? "").trim();
    if (!name) continue;
    totals.set(name, (totals.get(name) ?? 0) + (valueKey ? parseMoney(r[valueKey]) : 1));
  }
  let best: [string, number] | null = null;
  for (const entry of totals) if (!best || entry[1] > best[1]) best = entry;
  return { name: best?.[0] ?? "—", value: best?.[1] ?? 0, distinct: totals.size };
}

/** KPIs are derived from the rows on screen so they always follow the active filters. */
function buildKpis(type: ListReportId, rows: ReportRow[], summary: Record<string, unknown>): Kpi[] {
  const n = rows.length;
  switch (type) {
    case "arrival": {
      const confirmed = countWhere(rows, /confirm|checked.?in/i);
      const pending = countWhere(rows, /pending|reserved|tentative/i);
      const source = topBy(rows, "source");
      return [
        { label: "Arrivals", value: n.toLocaleString("en-IN"), hint: plural(source.distinct, "source"), icon: CalendarCheck },
        { label: "Confirmed", value: confirmed.toLocaleString("en-IN"), hint: `${pctOf(confirmed, n)}% of arrivals`, icon: CheckCircle2 },
        { label: "Pending", value: pending.toLocaleString("en-IN"), hint: pending ? "Needs follow-up" : "All clear", icon: AlertCircle },
        { label: "Top source", value: source.name, hint: source.value ? plural(source.value, "booking") : "No bookings", icon: Globe },
      ];
    }
    case "departure": {
      const settled = countWhere(rows, /settled|checked.?out/i);
      const pending = countWhere(rows, /pending/i);
      const balance = sumOf(rows, "balance");
      return [
        { label: "Departures", value: n.toLocaleString("en-IN"), hint: "In selected period", icon: LogOut },
        { label: "Settled", value: settled.toLocaleString("en-IN"), hint: `${pctOf(settled, n)}% of departures`, icon: CheckCircle2 },
        { label: "Pending settlement", value: pending.toLocaleString("en-IN"), hint: pending ? "Folios still open" : "All clear", icon: AlertCircle },
        { label: "Outstanding", value: formatINR(balance), hint: "Balance due", icon: Wallet },
      ];
    }
    case "occupancy": {
      const available = sumOf(rows, "totalRooms");
      const sold = sumOf(rows, "occupied");
      const vacant = sumOf(rows, "vacant");
      const revenue = rows.reduce((t, r) => t + parseMoney(r.adr) * parseMoney(r.occupied), 0);
      const best = topBy(rows, "roomType", "occupancy");
      return [
        { label: "Occupancy", value: `${pctOf(sold, available)}%`, hint: `${sold} of ${available} room nights`, icon: Percent },
        { label: "Room nights sold", value: sold.toLocaleString("en-IN"), hint: best.value ? `Best: ${best.name}` : "No stays", icon: BedDouble },
        { label: "Vacant nights", value: vacant.toLocaleString("en-IN"), hint: `${pctOf(vacant, available)}% unsold`, icon: DoorOpen },
        {
          label: "ADR",
          value: formatINR(sold ? Math.round(revenue / sold) : 0),
          hint: `Room revenue ${formatINR(parseMoney(summary.roomRevenue) || revenue)}`,
          icon: TrendingUp,
        },
      ];
    }
    case "revenue": {
      const net = sumOf(rows, "amount");
      const top = topBy(rows, "category", "amount");
      return [
        { label: "Net revenue", value: formatINR(net), hint: plural(sumOf(rows, "transactions"), "charge"), icon: TrendingUp },
        { label: "Tax", value: formatINR(sumOf(rows, "tax")), hint: "Collected on charges", icon: Percent },
        { label: "Gross", value: formatINR(sumOf(rows, "gross")), hint: "Revenue + tax", icon: Receipt },
        { label: "Top category", value: top.name, hint: top.value ? `${pctOf(top.value, net)}% of revenue` : "No revenue", icon: Star },
      ];
    }
    case "cashier": {
      const open = countWhere(rows, /open/i);
      return [
        { label: "Shifts", value: n.toLocaleString("en-IN"), hint: open ? `${open} still open` : "All closed", icon: Clock },
        { label: "Collected", value: formatINR(sumOf(rows, "collected")), hint: "All payment modes", icon: Banknote },
        { label: "Refunds", value: formatINR(sumOf(rows, "refunds")), hint: "Paid out", icon: RotateCcw },
        { label: "Cash in drawer", value: formatINR(sumOf(rows, "closing")), hint: `Opening ${formatINR(sumOf(rows, "openingFloat"))}`, icon: Wallet },
      ];
    }
    case "guest": {
      const repeat = rows.filter((r) => parseMoney(r.totalStays) > 1).length;
      const intl = countWhere(rows, /international/i, "segment");
      return [
        { label: "Guests", value: n.toLocaleString("en-IN"), hint: `${countWhere(rows, /corporate/i, "segment")} corporate`, icon: Users },
        { label: "Revenue", value: formatINR(sumOf(rows, "revenue")), hint: n ? `Avg ${formatINR(Math.round(sumOf(rows, "revenue") / n))} / guest` : "No guests", icon: TrendingUp },
        { label: "Repeat guests", value: repeat.toLocaleString("en-IN"), hint: `${pctOf(repeat, n)}% returning`, icon: UserCheck },
        { label: "International", value: intl.toLocaleString("en-IN"), hint: `${pctOf(intl, n)}% of guests`, icon: Globe },
      ];
    }
    case "room": {
      const occupied = countWhere(rows, /occupied/i);
      const vacant = countWhere(rows, /vacant/i);
      const dirty = countWhere(rows, /dirty/i, "housekeeping");
      const blocked = countWhere(rows, /blocked|maintenance|out of order/i);
      return [
        { label: "Occupied", value: occupied.toLocaleString("en-IN"), hint: `${pctOf(occupied, n)}% of ${n} rooms`, icon: BedDouble },
        { label: "Vacant", value: vacant.toLocaleString("en-IN"), hint: "Ready to sell", icon: DoorOpen },
        { label: "Dirty", value: dirty.toLocaleString("en-IN"), hint: dirty ? "Awaiting housekeeping" : "All clean", icon: AlertTriangle },
        { label: "Blocked", value: blocked.toLocaleString("en-IN"), hint: blocked ? "Out of inventory" : "None blocked", icon: Wrench },
      ];
    }
    case "tax": {
      const taxable = sumOf(rows, "taxable");
      const total = sumOf(rows, "totalTax");
      return [
        { label: "Taxable value", value: formatINR(taxable), hint: plural(sumOf(rows, "charges"), "charge"), icon: Receipt },
        { label: "CGST", value: formatINR(sumOf(rows, "cgst")), hint: "Central tax", icon: Percent },
        { label: "SGST", value: formatINR(sumOf(rows, "sgst")), hint: "State tax", icon: Percent },
        { label: "Total tax", value: formatINR(total), hint: taxable ? `Effective ${((total / taxable) * 100).toFixed(1)}%` : "No taxable charges", icon: Wallet },
      ];
    }
  }
}

function ReportListView({
  type,
  onTypeChange,
}: {
  type: ReportId;
  onTypeChange?: (next: ListReportId) => void;
}) {
  const base = reportDefinitions[type];
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [summary, setSummary] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [prevType, setPrevType] = useState(type);
  if (prevType !== type) {
    setPrevType(type);
    setStatusFilter("all");
  }
  const { from: fromDate, to: toDate, dateRange } = useQuickDateRange("today");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await reportService.get(type, { from: fromDate, to: toDate });
        if (cancelled) return;
        const apiRows = (data.rows as Record<string, unknown>[]) ?? [];
        setRows(withUniqueIds(apiRows.map((row, index) => normalizeRow(type, row, index))));
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
  }, [type, fromDate, toDate, reloadKey]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== "all") {
        const tags = [row.status, row.band, row.group, row.segment, row.shiftBand];
        if (!tags.some((tag) => String(tag ?? "") === statusFilter)) return false;
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

  const listType: ListReportId = isListReportId(type) ? type : "arrival";
  const kpis = useMemo(() => buildKpis(listType, filtered, summary), [listType, filtered, summary]);

  return (
    <ReportWorkspace
      eyebrow="Front Office · Reports"
      title={base.title}
      description={base.description}
      reportOptions={
        onTypeChange ? REPORT_TYPE_OPTIONS.map((opt) => ({ ...opt, icon: REPORT_ICONS[opt.id] })) : undefined
      }
      activeReport={type}
      onReportChange={(id) => onTypeChange?.(id as ListReportId)}
      loading={loading}
      error={error}
      onRefresh={() => setReloadKey((k) => k + 1)}
      onExport={() =>
        exportReportXlsx(base.title, "Front Office", base.columns, filtered, [
          ["Period", `${fromDate} to ${toDate}`],
          ...(statusFilter !== "all" ? ([["Status", statusFilter]] as [string, string][]) : []),
          ...(search.trim() ? ([["Search", search.trim()]] as [string, string][]) : []),
        ])
      }
      kpis={kpis}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder={base.searchPlaceholder}
      dateRange={dateRange}
      filters={
        base.filterOptions?.length ? (
          <WorkspaceFilterSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            allLabel="All statuses"
            options={base.filterOptions
              .filter((opt) => opt.id !== "all")
              .map((opt) => ({ value: opt.id, label: opt.label }))}
          />
        ) : null
      }
      filtersActive={statusFilter !== "all"}
      onClearFilters={() => setStatusFilter("all")}
      columns={base.columns}
      rows={filtered}
      totalRows={rows.length}
      charts={charts}
    />
  );
}

/** Single Reports page; the selected report lives in `?type=` so it survives refresh and can be linked. */
export function FrontOfficeReportsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requested = searchParams.get("type");
  const type: ListReportId = isListReportId(requested) ? requested : "arrival";

  return (
    <ReportListView
      type={type}
      onTypeChange={(next) => router.replace(`${pathname}?type=${next}`, { scroll: false })}
    />
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
