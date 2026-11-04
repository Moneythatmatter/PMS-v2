"use client";

import { useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  BarChart3,
  BedDouble,
  Building2,
  CalendarCheck,
  CheckCircle2,
  DoorOpen,
  Download,
  LogOut,
  RefreshCw,
  Search,
  Percent,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { FODatePicker, SelectInput, StatMiniCard } from "@/components/frontoffice/ui";
import { Button } from "@/components/ui/Button";
import { ReportExcelGrid } from "@/components/frontoffice/ReportExcelGrid";
import type { ReportColumn, ReportRow } from "@/app/data/frontoffice/reports";
import { downloadXlsx } from "@/lib/xlsx";
import { cn } from "@/lib/utils";
import { GroupOverview } from "@/components/platform/GroupOverview";
import { WorkspaceActionSlotContext } from "@/components/platform/WorkspaceShell";
import {
  platformService,
  type PortfolioMovement,
  type PortfolioProperty,
  type PortfolioSnapshot,
} from "@/services/platform";

type GridData = { columns: ReportColumn[]; rows: ReportRow[] };

type RangeId = "today" | "7d" | "30d" | "mtd" | "custom";
export type ReportId = "occupancy" | "arrivals" | "departures" | "revenue" | "in-house" | "rooms" | "outstanding";

export const REPORT_IDS: ReportId[] = ["arrivals", "departures", "occupancy", "revenue", "in-house", "rooms", "outstanding"];

const RANGE_OPTIONS: { id: RangeId; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "mtd", label: "Month to date" },
  { id: "custom", label: "Custom range" },
];

export const REPORTS: { id: ReportId; label: string; hint: string }[] = [
  { id: "arrivals", label: "Daily Arrival", hint: "Check-ins across every property" },
  { id: "departures", label: "Departure Report", hint: "Check-outs across every property" },
  { id: "occupancy", label: "Occupancy Report", hint: "Rooms occupied right now, all properties" },
  { id: "revenue", label: "Revenue Report", hint: "Room charges on arrivals, all properties" },
  { id: "in-house", label: "Guest Report", hint: "Guests staying now, all properties" },
  { id: "rooms", label: "Room Report", hint: "Occupied, vacant, and dirty rooms by property" },
  { id: "outstanding", label: "Outstanding", hint: "Open balances across every property" },
];

function toIsoDay(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function rangeToDates(range: RangeId) {
  const to = new Date();
  const from = new Date(to);
  if (range === "7d") from.setDate(to.getDate() - 6);
  else if (range === "30d") from.setDate(to.getDate() - 29);
  else if (range === "mtd") from.setDate(1);
  return { from: toIsoDay(from), to: toIsoDay(to) };
}

const inr = (n: number) =>
  `₹${(Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export function PropertyPortfolioDashboard({
  mode,
  report = "occupancy",
  onOpen,
  onOpenAt,
  onReportChange,
}: {
  mode: "dashboard" | "reports";
  report?: ReportId;
  onOpen: (property: PortfolioProperty) => void;
  onOpenAt?: (property: PortfolioProperty, href: string) => void;
  onReportChange?: (report: ReportId) => void;
}) {
  const [range, setRange] = useState<RangeId>("today");
  const initialDates = rangeToDates("today");
  const [fromDate, setFromDate] = useState(initialDates.from);
  const [toDate, setToDate] = useState(initialDates.to);
  const [propertyFilter, setPropertyFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const actionSlot = useContext(WorkspaceActionSlotContext);

  useEffect(() => {
    if (mode === "dashboard") return;
    let cancelled = false;
    platformService
      .getPortfolio(fromDate, toDate)
      .then((data) => {
        if (cancelled) return;
        setSnapshot({
          ...data,
          series: data.series ?? [],
          platforms: data.platforms ?? [],
          arrivals: data.arrivals ?? [],
          departures: data.departures ?? [],
          staying: data.staying ?? [],
        });
        setError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load the portfolio");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fromDate, toDate, mode, reloadKey]);

  const refresh = () => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  const applyRange = (next: RangeId) => {
    setRange(next);
    if (next === "custom") return;
    const dates = rangeToDates(next);
    if (dates.from === fromDate && dates.to === toDate) return;
    setLoading(true);
    setFromDate(dates.from);
    setToDate(dates.to);
  };

  const changeFromDate = (value: string) => {
    setRange("custom");
    const nextTo = toDate && value > toDate ? value : toDate;
    if (value === fromDate && nextTo === toDate) return;
    setLoading(true);
    setFromDate(value);
    if (nextTo !== toDate) setToDate(nextTo);
  };

  const changeToDate = (value: string) => {
    setRange("custom");
    const nextFrom = fromDate && value < fromDate ? value : fromDate;
    if (value === toDate && nextFrom === fromDate) return;
    setLoading(true);
    setToDate(value);
    if (nextFrom !== fromDate) setFromDate(nextFrom);
  };

  const totals = snapshot?.totals;
  const properties = snapshot?.properties ?? [];
  const arrivals = snapshot?.arrivals ?? [];
  const departures = snapshot?.departures ?? [];
  const staying = snapshot?.staying ?? [];

  const scopedProperties = propertyFilter === "ALL" ? properties : properties.filter((p) => p.id === propertyFilter);
  const scopedArrivals = propertyFilter === "ALL" ? arrivals : arrivals.filter((r) => r.propertyId === propertyFilter);
  const scopedDepartures = propertyFilter === "ALL" ? departures : departures.filter((r) => r.propertyId === propertyFilter);
  const scopedStaying = propertyFilter === "ALL" ? staying : staying.filter((r) => r.propertyId === propertyFilter);
  const needle = search.trim().toLowerCase();
  const propertyHit = (property: PortfolioProperty) =>
    !needle || [property.name, property.city, property.code].some((value) => value.toLowerCase().includes(needle));
  const movementHit = (row: PortfolioMovement) =>
    !needle || [row.guest, row.propertyName, row.bookingNo, row.room, row.status].some((value) => value.toLowerCase().includes(needle));
  const listedProperties = scopedProperties.filter(propertyHit);
  const listedArrivals = scopedArrivals.filter(movementHit);
  const listedDepartures = scopedDepartures.filter(movementHit);
  const listedStaying = scopedStaying.filter(movementHit);

  const exportReport = () => {
    if (!snapshot) return;
    const period = snapshot.from === snapshot.to ? snapshot.from : `${snapshot.from} to ${snapshot.to}`;
    const sheets = {
      occupancy: {
        header: ["Property", "City", "Rooms", "Occupied", "Vacant", "Occupancy %", "In-house"],
        rows: listedProperties.map((p) => [p.name, p.city, p.rooms, p.occupied, Math.max(0, p.rooms - p.occupied), p.occupancyPct, p.inHouse]),
      },
      arrivals: {
        header: ["Guest", "Property", "Booking", "Room", "Status", "Amount"],
        rows: listedArrivals.map((r) => [r.guest, r.propertyName, r.bookingNo, r.room, r.status, r.amount]),
      },
      departures: {
        header: ["Guest", "Property", "Booking", "Room", "Status", "Balance"],
        rows: listedDepartures.map((r) => [r.guest, r.propertyName, r.bookingNo, r.room, r.status, r.balance]),
      },
      revenue: {
        header: ["Property", "City", "Arrivals", "Room revenue", "Open balance"],
        rows: listedProperties.map((p) => [p.name, p.city, p.arrivals, p.roomRevenue, p.outstanding]),
      },
      "in-house": {
        header: ["Guest", "Property", "Booking", "Room", "Status", "Balance"],
        rows: listedStaying.map((r) => [r.guest, r.propertyName, r.bookingNo, r.room, r.status, r.balance]),
      },
      rooms: {
        header: ["Property", "City", "Rooms", "Occupied", "Vacant", "Dirty", "Occupancy %"],
        rows: listedProperties.map((p) => [p.name, p.city, p.rooms, p.occupied, Math.max(0, p.rooms - p.occupied), p.dirtyRooms, p.occupancyPct]),
      },
      outstanding: {
        header: ["Property", "City", "In-house", "Open balance"],
        rows: listedProperties.filter((p) => p.outstanding > 0).map((p) => [p.name, p.city, p.inHouse, p.outstanding]),
      },
    }[report];
    downloadXlsx(`property-${report}-${snapshot.from}`, [
      {
        name: REPORTS.find((item) => item.id === report)?.label ?? "Report",
        title: `${REPORTS.find((item) => item.id === report)?.label} report`,
        meta: [["Period", period], ["Properties", totals?.properties ?? 0]],
        header: sheets.header,
        rows: sheets.rows,
      },
    ]);
  };

  if (mode === "dashboard") {
    return <GroupOverview onOpen={onOpen} onOpenAt={onOpenAt ?? onOpen} />;
  }

  const periodLabel = snapshot
    ? snapshot.from === snapshot.to
      ? snapshot.from
      : `${snapshot.from} → ${snapshot.to}`
    : "—";
  const roomsTotal = listedProperties.reduce((s, p) => s + p.rooms, 0);
  const occupiedTotal = listedProperties.reduce((s, p) => s + p.occupied, 0);
  const summary: { label: string; value: string | number; icon: LucideIcon }[] =
    report === "occupancy"
      ? [
          { label: "Properties", value: listedProperties.length, icon: Building2 },
          { label: "Rooms", value: roomsTotal, icon: DoorOpen },
          { label: "Occupied", value: occupiedTotal, icon: BedDouble },
          { label: "Occupancy", value: `${roomsTotal ? Math.round((occupiedTotal / roomsTotal) * 100) : 0}%`, icon: Percent },
        ]
      : report === "arrivals"
        ? [
            { label: "Arrivals", value: listedArrivals.length, icon: CalendarCheck },
            { label: "Properties", value: new Set(listedArrivals.map((r) => r.propertyId)).size, icon: Building2 },
            { label: "Amount", value: inr(listedArrivals.reduce((s, r) => s + r.amount, 0)), icon: Wallet },
          ]
        : report === "departures"
          ? [
              { label: "Departures", value: listedDepartures.length, icon: LogOut },
              { label: "Properties", value: new Set(listedDepartures.map((r) => r.propertyId)).size, icon: Building2 },
              { label: "Balance", value: inr(listedDepartures.reduce((s, r) => s + r.balance, 0)), icon: Wallet },
            ]
          : report === "revenue"
            ? [
                { label: "Arrivals", value: listedProperties.reduce((s, p) => s + p.arrivals, 0), icon: CalendarCheck },
                { label: "Room revenue", value: inr(listedProperties.reduce((s, p) => s + p.roomRevenue, 0)), icon: TrendingUp },
                { label: "Still open", value: inr(listedProperties.reduce((s, p) => s + p.outstanding, 0)), icon: Wallet },
              ]
            : report === "in-house"
              ? [
                  { label: "Guests", value: listedStaying.length, icon: Users },
                  { label: "Properties", value: new Set(listedStaying.map((r) => r.propertyId)).size, icon: Building2 },
                  { label: "Open balance", value: inr(listedStaying.reduce((s, r) => s + r.balance, 0)), icon: Wallet },
                ]
              : report === "rooms"
                ? [
                    { label: "Rooms", value: roomsTotal, icon: DoorOpen },
                    { label: "Occupied", value: occupiedTotal, icon: BedDouble },
                    { label: "Vacant", value: listedProperties.reduce((s, p) => s + Math.max(0, p.rooms - p.occupied), 0), icon: CheckCircle2 },
                    { label: "Dirty", value: listedProperties.reduce((s, p) => s + p.dirtyRooms, 0), icon: AlertTriangle },
                  ]
                : [
                    { label: "Properties owing", value: listedProperties.filter((p) => p.outstanding > 0).length, icon: Building2 },
                    { label: "Open balance", value: inr(listedProperties.reduce((s, p) => s + p.outstanding, 0)), icon: Wallet },
                    { label: "Guests in house", value: listedProperties.reduce((s, p) => s + p.inHouse, 0), icon: Users },
                  ];
  const outstandingProperties = listedProperties.filter((p) => p.outstanding > 0);
  const movementGrid = (rows: PortfolioMovement[], amountKey: "amount" | "balance"): GridData => ({
    columns: [
      { key: "guest", header: "Guest" },
      { key: "property", header: "Property" },
      { key: "booking", header: "Booking" },
      { key: "room", header: "Room" },
      { key: "status", header: "Status" },
      { key: amountKey, header: amountKey === "amount" ? "Amount" : "Balance", format: "currency" },
    ],
    rows: rows.map((r) => ({
      id: r.id,
      guest: r.guest,
      property: r.propertyName,
      booking: r.bookingNo,
      room: r.room,
      status: r.status,
      [amountKey]: Number(r[amountKey]) || 0,
    })),
  });
  const propertyBase = (p: PortfolioProperty) => ({ id: p.id, property: p.name, city: p.city || "—" });
  const grid: GridData =
    report === "arrivals"
      ? movementGrid(listedArrivals, "amount")
      : report === "departures"
        ? movementGrid(listedDepartures, "balance")
        : report === "in-house"
          ? movementGrid(listedStaying, "balance")
          : report === "occupancy"
            ? {
                columns: [
                  { key: "property", header: "Property" },
                  { key: "city", header: "City" },
                  { key: "rooms", header: "Rooms" },
                  { key: "occupied", header: "Occupied" },
                  { key: "vacant", header: "Vacant" },
                  { key: "occupancy", header: "Occupancy", format: "percent" },
                  { key: "inHouse", header: "In-house" },
                ],
                rows: listedProperties.map((p) => ({
                  ...propertyBase(p),
                  rooms: p.rooms,
                  occupied: p.occupied,
                  vacant: Math.max(0, p.rooms - p.occupied),
                  occupancy: p.occupancyPct,
                  inHouse: p.inHouse,
                })),
              }
            : report === "revenue"
              ? {
                  columns: [
                    { key: "property", header: "Property" },
                    { key: "city", header: "City" },
                    { key: "arrivals", header: "Arrivals" },
                    { key: "roomRevenue", header: "Room Revenue", format: "currency" },
                    { key: "outstanding", header: "Open Balance", format: "currency" },
                  ],
                  rows: listedProperties.map((p) => ({
                    ...propertyBase(p),
                    arrivals: p.arrivals,
                    roomRevenue: p.roomRevenue,
                    outstanding: p.outstanding,
                  })),
                }
              : report === "rooms"
                ? {
                    columns: [
                      { key: "property", header: "Property" },
                      { key: "city", header: "City" },
                      { key: "rooms", header: "Rooms" },
                      { key: "occupied", header: "Occupied" },
                      { key: "vacant", header: "Vacant" },
                      { key: "dirty", header: "Dirty" },
                      { key: "occupancy", header: "Occupancy", format: "percent" },
                    ],
                    rows: listedProperties.map((p) => ({
                      ...propertyBase(p),
                      rooms: p.rooms,
                      occupied: p.occupied,
                      vacant: Math.max(0, p.rooms - p.occupied),
                      dirty: p.dirtyRooms,
                      occupancy: p.occupancyPct,
                    })),
                  }
                : {
                    columns: [
                      { key: "property", header: "Property" },
                      { key: "city", header: "City" },
                      { key: "inHouse", header: "In-house" },
                      { key: "outstanding", header: "Open Balance", format: "currency" },
                    ],
                    rows: outstandingProperties.map((p) => ({
                      ...propertyBase(p),
                      inHouse: p.inHouse,
                      outstanding: p.outstanding,
                    })),
                  };
  const fieldClass = "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100";
  const shownCount = report === "arrivals" ? listedArrivals.length : report === "departures" ? listedDepartures.length : report === "in-house" ? listedStaying.length : report === "outstanding" ? listedProperties.filter((p) => p.outstanding > 0).length : listedProperties.length;
  const totalCount = report === "arrivals" ? scopedArrivals.length : report === "departures" ? scopedDepartures.length : report === "in-house" ? scopedStaying.length : report === "outstanding" ? scopedProperties.filter((p) => p.outstanding > 0).length : scopedProperties.length;

  return (
    <div className="min-w-0 space-y-4 sm:space-y-5">
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div
        className={cn(
          "grid gap-3 sm:gap-4",
          summary.length === 4 ? "grid-cols-2 lg:grid-cols-4 lg:gap-6" : "grid-cols-1 sm:grid-cols-3",
        )}
      >
        {summary.map((stat) => (
          <StatMiniCard
            key={stat.label}
            label={stat.label}
            value={loading && !snapshot ? "…" : stat.value}
            icon={stat.icon}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm">
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={report === "arrivals" || report === "departures" || report === "in-house" ? "Search guest, booking, or room…" : "Search property or city…"}
            className={cn(fieldClass, "w-full pl-9 pr-3 placeholder:text-slate-400")}
          />
        </div>
        <select
          aria-label="Property"
          className={cn(fieldClass, "w-auto min-w-[11rem] shrink-0")}
          value={propertyFilter}
          onChange={(e) => setPropertyFilter(e.target.value)}
        >
          <option value="ALL">All properties</option>
          {properties.map((property) => (
            <option key={property.id} value={property.id}>{property.name}</option>
          ))}
        </select>
        <SelectInput
          value={range}
          onChange={(e) => applyRange(e.target.value as RangeId)}
          className="!h-10 !w-auto min-w-[9.5rem] shrink-0"
          aria-label="Date range"
        >
          {RANGE_OPTIONS.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </SelectInput>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">From</span>
          <div className="w-[9.25rem]">
            <FODatePicker value={fromDate} placeholder="From date" className="!h-10" onChange={changeFromDate} />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">To</span>
          <div className="w-[9.25rem]">
            <FODatePicker value={toDate} placeholder="To date" className="!h-10" onChange={changeToDate} />
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Showing <span className="font-medium text-slate-700">{shownCount}</span> of {totalCount} records · {periodLabel}
      </p>

      {actionSlot
        ? createPortal(
            <>
              {onReportChange && (
                <div className="relative">
                  <BarChart3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-700" />
                  <SelectInput
                    value={report}
                    onChange={(e) => onReportChange(e.target.value as ReportId)}
                    className="!h-9 !w-auto min-w-[13rem] pl-9 text-sm font-semibold"
                    aria-label="Report"
                  >
                    {REPORTS.map((item) => (
                      <option key={item.id} value={item.id}>{item.label}</option>
                    ))}
                  </SelectInput>
                </div>
              )}
              <Button type="button" size="sm" variant="outline" className="gap-1" disabled={loading} onClick={refresh}>
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                Refresh
              </Button>
              <Button type="button" size="sm" variant="outline" className="gap-1" disabled={!snapshot || loading} onClick={exportReport}>
                <Download className="h-3.5 w-3.5" />
                Export Excel
              </Button>
            </>,
            actionSlot,
          )
        : null}

      <ReportExcelGrid columns={grid.columns} rows={grid.rows} loading={loading && !snapshot} />
    </div>
  );
}
