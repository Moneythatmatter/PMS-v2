"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BedDouble,
  Building2,
  CalendarCheck,
  CalendarDays,
  ChefHat,
  ChevronRight,
  Clock,
  Download,
  IndianRupee,
  Info,
  LogOut,
  Percent,
  RefreshCw,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  UserX,
  Users,
  Wallet,
  Wrench,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { downloadXlsx } from "@/lib/xlsx";
import { cn } from "@/lib/utils";
import { platformService, type PortfolioProperty, type PortfolioSnapshot } from "@/services/platform";

type PeriodId = "today" | "month" | "quarter" | "fy" | "custom";
type DeptId = "all" | "front-office" | "fb" | "purchase" | "hr";
type SortKey = "name" | "revenue" | "occupancy" | "expenses" | "profit";

const PERIODS: { id: PeriodId; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "month", label: "This month" },
  { id: "quarter", label: "This quarter" },
  { id: "fy", label: "This financial year" },
  { id: "custom", label: "Custom date range" },
];

const DEPARTMENTS: { id: DeptId; label: string }[] = [
  { id: "all", label: "All departments" },
  { id: "front-office", label: "Front Office" },
  { id: "fb", label: "Food & Beverage" },
  { id: "purchase", label: "Purchase & Stores" },
  { id: "hr", label: "HR & Payroll" },
];

function toIsoDay(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function periodDates(period: PeriodId, customFrom: string, customTo: string) {
  const today = new Date();
  const to = toIsoDay(today);
  if (period === "custom") return { from: customFrom || to, to: customTo || to };
  if (period === "month") return { from: toIsoDay(new Date(today.getFullYear(), today.getMonth(), 1)), to };
  if (period === "quarter") {
    const startMonth = Math.floor(today.getMonth() / 3) * 3;
    return { from: toIsoDay(new Date(today.getFullYear(), startMonth, 1)), to };
  }
  if (period === "fy") {
    const year = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
    return { from: `${year}-04-01`, to };
  }
  return { from: to, to };
}

const inr = (n: number) => `₹${(Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const num = (value: number | undefined) => Number(value) || 0;

function sumBy(rows: PortfolioProperty[], pick: (row: PortfolioProperty) => number) {
  return rows.reduce((total, row) => total + pick(row), 0);
}

function Delta({ current, previous, inverse = false }: { current: number; previous: number; inverse?: boolean }) {
  if (!previous) return <span className="text-[11px] text-slate-400">No previous period</span>;
  const pct = ((current - previous) / previous) * 100;
  const up = pct >= 0;
  const good = inverse ? !up : up;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        good ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
      )}
    >
      <Icon className="h-3 w-3" />
      {up ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
}

const CARD_ICONS: Record<string, { icon: LucideIcon; tone: string; bar?: string; wash?: string }> = {
  "Total revenue": { icon: IndianRupee, tone: "bg-emerald-50 text-emerald-700", bar: "bg-emerald-500", wash: "from-emerald-50" },
  "Room revenue": { icon: BedDouble, tone: "bg-emerald-50 text-emerald-700", bar: "bg-emerald-500", wash: "from-emerald-50" },
  Occupancy: { icon: Percent, tone: "bg-sky-50 text-sky-700", bar: "bg-sky-500", wash: "from-sky-50" },
  "Operating expenses": { icon: Wallet, tone: "bg-amber-50 text-amber-700", bar: "bg-amber-500", wash: "from-amber-50" },
  "Operating profit": { icon: TrendingUp, tone: "bg-violet-50 text-violet-700", bar: "bg-violet-500", wash: "from-violet-50" },
  ADR: { icon: IndianRupee, tone: "bg-sky-50 text-sky-700", bar: "bg-sky-500", wash: "from-sky-50" },
  RevPAR: { icon: TrendingUp, tone: "bg-violet-50 text-violet-700", bar: "bg-violet-500", wash: "from-violet-50" },
  "F&B sales": { icon: ChefHat, tone: "bg-emerald-50 text-emerald-700", bar: "bg-emerald-500", wash: "from-emerald-50" },
  Orders: { icon: ShoppingCart, tone: "bg-sky-50 text-sky-700", bar: "bg-sky-500", wash: "from-sky-50" },
  "Purchase spend": { icon: ShoppingCart, tone: "bg-emerald-50 text-emerald-700", bar: "bg-emerald-500", wash: "from-emerald-50" },
  "Payroll cost": { icon: Users, tone: "bg-emerald-50 text-emerald-700", bar: "bg-emerald-500", wash: "from-emerald-50" },
  Employees: { icon: Users, tone: "bg-sky-50 text-sky-700", bar: "bg-sky-500", wash: "from-sky-50" },
};

export function GroupOverview({
  onOpen,
  onOpenAt,
}: {
  onOpen: (property: PortfolioProperty) => void;
  onOpenAt: (property: PortfolioProperty, href: string) => void;
}) {
  const [period, setPeriod] = useState<PeriodId>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("ALL");
  const [department, setDepartment] = useState<DeptId>("all");
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [sortAsc, setSortAsc] = useState(false);
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const dates = periodDates(period, customFrom, customTo);

  useEffect(() => {
    if (period === "custom" && (!customFrom || !customTo)) return;
    let cancelled = false;
    platformService
      .getPortfolio(dates.from, dates.to)
      .then((data) => {
        if (cancelled) return;
        setSnapshot({
          ...data,
          series: data.series ?? [],
          platforms: data.platforms ?? [],
          arrivals: data.arrivals ?? [],
          departures: data.departures ?? [],
          staying: data.staying ?? [],
          trend: data.trend ?? [],
          alerts: data.alerts ?? [],
        });
        setError(null);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load the group overview");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dates.from, dates.to, period, customFrom, customTo, reloadKey]);

  const properties = snapshot?.properties ?? [];
  const scoped = propertyFilter === "ALL" ? properties : properties.filter((row) => row.id === propertyFilter);
  const propertyName = propertyFilter === "ALL" ? "All properties" : scoped[0]?.name ?? "Property";

  const earned = sumBy(scoped, (row) => num(row.earnedRoomRevenue));
  const fb = sumBy(scoped, (row) => num(row.fbRevenue));
  const payroll = sumBy(scoped, (row) => num(row.payrollCost));
  const purchase = sumBy(scoped, (row) => num(row.purchaseSpend));
  const expenses = payroll + purchase;
  const sold = sumBy(scoped, (row) => num(row.roomNightsSold));
  const available = sumBy(scoped, (row) => num(row.availableRoomNights));
  const prevEarned = sumBy(scoped, (row) => num(row.prevRevenue));
  const prevFb = sumBy(scoped, (row) => num(row.prevFbRevenue));
  const prevExpenses = sumBy(scoped, (row) => num(row.prevExpenses));
  const occupancy = available ? Math.round((sold / available) * 1000) / 10 : 0;
  const adr = sold ? Math.round(earned / sold) : 0;
  const revpar = available ? Math.round(earned / available) : 0;
  const stayCount = sumBy(scoped, (row) => num(row.stayCount));
  const avgLos = stayCount ? Math.round((sumBy(scoped, (row) => num(row.stayNights)) / stayCount) * 10) / 10 : 0;

  const cards = useMemo(() => {
    const defs = snapshot?.definitions;
    if (department === "front-office") {
      return [
        { label: "Room revenue", value: inr(earned), note: "Charges for nights in this period. Payments are not added again.", current: earned, previous: prevEarned },
        { label: "Occupancy", value: `${occupancy}%`, note: defs?.occupancy ?? "Room-nights sold ÷ room-nights available", current: null, previous: null },
        { label: "ADR", value: inr(adr), note: "Room revenue ÷ room-nights sold", current: null, previous: null },
        { label: "RevPAR", value: inr(revpar), note: "Room revenue ÷ available room-nights", current: null, previous: null },
      ];
    }
    if (department === "fb") {
      return [
        { label: "F&B sales", value: inr(fb), note: snapshot?.coverage?.fb ? "Order totals stored against a property. Not a second copy of a guest payment." : "F&B orders are not stored against a property yet, so this stays at zero.", current: fb, previous: prevFb },
        { label: "Orders", value: String(sumBy(scoped, (row) => num(row.fbOrders))), note: "Non-cancelled orders in the period", current: null, previous: null },
        { label: "Average order", value: inr(sumBy(scoped, (row) => num(row.fbOrders)) ? fb / sumBy(scoped, (row) => num(row.fbOrders)) : 0), note: "F&B sales ÷ orders", current: null, previous: null },
        { label: "Food cost", value: "Not calculated", note: "Recipe food cost is not consolidated here.", current: null, previous: null },
      ];
    }
    if (department === "purchase") {
      return [
        { label: "Purchase spend", value: inr(purchase), note: snapshot?.coverage?.purchases ? "Purchase orders in the period, excluding drafts and cancellations." : "Purchase orders are not stored against a property yet.", current: null, previous: null },
        { label: "Requisitions waiting", value: String(sumBy(scoped, (row) => num(row.pendingPurchases))), note: "Draft or pending approval", current: null, previous: null },
        { label: "Operating expenses", value: inr(expenses), note: "Purchase spend plus payroll for months this period touches", current: null, previous: null },
        { label: "Payables", value: "Not reconciled", note: "Vendor balances are not taken from a reconciled accounts ledger.", current: null, previous: null },
      ];
    }
    if (department === "hr") {
      return [
        { label: "Payroll cost", value: inr(payroll), note: "Net salary for months the period touches. A short period still includes that month's payroll.", current: null, previous: null },
        { label: "Employees", value: String(sumBy(scoped, (row) => num(row.employees))), note: "Active staff", current: null, previous: null },
        { label: "Payroll waiting", value: String(sumBy(scoped, (row) => num(row.pendingPayroll))), note: "Draft or calculated, not approved", current: null, previous: null },
        { label: "Approved, unpaid", value: String(sumBy(scoped, (row) => num(row.unpaidPayroll))), note: "Approved payroll not marked paid", current: null, previous: null },
      ];
    }
    return [
      { label: "Total revenue", value: inr(earned + fb), note: defs?.revenue ?? "Room charges plus F&B sales in the period", current: earned + fb, previous: prevEarned + prevFb },
      { label: "Occupancy", value: `${occupancy}%`, note: defs?.occupancy ?? "Across the selected properties", current: null, previous: null },
      { label: "Operating expenses", value: inr(expenses), note: defs?.expenses ?? "Payroll and recorded purchases", current: expenses, previous: prevExpenses },
      { label: "Operating profit", value: inr(earned + fb - expenses), note: defs?.profit ?? "Revenue minus those expenses", current: earned + fb - expenses, previous: prevEarned + prevFb - prevExpenses },
    ];
  }, [adr, department, earned, expenses, fb, occupancy, payroll, prevEarned, prevExpenses, prevFb, purchase, revpar, scoped, snapshot?.coverage?.fb, snapshot?.coverage?.purchases, snapshot?.definitions]);

  const rowFigures = (row: PortfolioProperty) => {
    const room = num(row.earnedRoomRevenue);
    const food = num(row.fbRevenue);
    const cost = num(row.expenses);
    if (department === "front-office") return { revenue: room, expenses: null as number | null, profit: null as number | null };
    if (department === "fb") return { revenue: food, expenses: null, profit: null };
    if (department === "purchase") return { revenue: null, expenses: num(row.purchaseSpend), profit: null };
    if (department === "hr") return { revenue: null, expenses: num(row.payrollCost), profit: null };
    return { revenue: room + food, expenses: cost, profit: num(row.profit) };
  };

  const sorted = [...scoped].sort((a, b) => {
    const left = rowFigures(a);
    const right = rowFigures(b);
    const value = (row: typeof left, property: PortfolioProperty) => {
      if (sortKey === "name") return property.name;
      if (sortKey === "occupancy") return num(property.periodOccupancyPct);
      if (sortKey === "expenses") return row.expenses ?? -1;
      if (sortKey === "profit") return row.profit ?? -1;
      return row.revenue ?? -1;
    };
    const av = value(left, a);
    const bv = value(right, b);
    if (typeof av === "string" && typeof bv === "string") return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortAsc ? Number(av) - Number(bv) : Number(bv) - Number(av);
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((current) => !current);
    else {
      setSortKey(key);
      setSortAsc(key === "name");
    }
  };

  const trend = useMemo(() => {
    const ids = new Set(scoped.map((row) => row.id));
    const grouped = new Map<string, { label: string; sort: string; room: number; fb: number }>();
    for (const point of snapshot?.trend ?? []) {
      if (!ids.has(point.propertyId)) continue;
      const current = grouped.get(point.sort) ?? { label: point.label, sort: point.sort, room: 0, fb: 0 };
      current.room += point.roomRevenue;
      current.fb += point.fbRevenue;
      grouped.set(point.sort, current);
    }
    return [...grouped.values()].sort((a, b) => a.sort.localeCompare(b.sort));
  }, [scoped, snapshot?.trend]);

  const alerts = (snapshot?.alerts ?? []).filter((alert) => {
    if (propertyFilter !== "ALL" && alert.propertyId !== propertyFilter) return false;
    if (department === "all") return true;
    if (department === "front-office") return alert.href.startsWith("/frontoffice") || alert.href.startsWith("/housekeeping");
    if (department === "fb") return alert.href.startsWith("/food-beverages");
    if (department === "purchase") return alert.href.startsWith("/purchase-stores");
    return alert.href.startsWith("/human-resources");
  });

  const exportComparison = () => {
    downloadXlsx(`group-overview-${dates.from}`, [
      {
        name: "Comparison",
        title: "Property comparison",
        meta: [["Period", `${dates.from} to ${dates.to}`], ["Department", DEPARTMENTS.find((item) => item.id === department)?.label ?? ""], ["Properties", propertyName]],
        header: ["Property", "City", "Revenue", "Occupancy %", "Expenses", "Profit", "ADR", "RevPAR"],
        rows: sorted.map((row) => {
          const figures = rowFigures(row);
          return [row.name, row.city, figures.revenue ?? "", num(row.periodOccupancyPct), figures.expenses ?? "", figures.profit ?? "", num(row.adr), num(row.revpar)];
        }),
      },
    ]);
  };

  const selectClass =
    "h-9 rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600";
  const busy = loading && !snapshot;
  const fmtDay = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const refresh = () => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  };
  const maxRevenue = Math.max(1, ...sorted.map((row) => rowFigures(row).revenue ?? 0));

  const tiles: { label: string; value: string; icon: LucideIcon; tone: string }[] = [
    { label: "Arrivals", value: String(sumBy(scoped, (row) => row.arrivals)), icon: CalendarCheck, tone: "bg-sky-50 text-sky-600" },
    { label: "Departures", value: String(sumBy(scoped, (row) => row.departures)), icon: LogOut, tone: "bg-indigo-50 text-indigo-600" },
    { label: "In house now", value: String(sumBy(scoped, (row) => row.inHouse)), icon: BedDouble, tone: "bg-emerald-50 text-emerald-600" },
    { label: "Average stay", value: `${avgLos} nights`, icon: Clock, tone: "bg-violet-50 text-violet-600" },
    { label: "Cancellations", value: String(sumBy(scoped, (row) => num(row.cancellations))), icon: XCircle, tone: "bg-rose-50 text-rose-600" },
    { label: "No-shows", value: String(sumBy(scoped, (row) => num(row.noShows))), icon: UserX, tone: "bg-amber-50 text-amber-600" },
    { label: "Room revenue", value: inr(earned), icon: BedDouble, tone: "bg-teal-50 text-teal-600" },
    { label: "F&B revenue", value: inr(fb), icon: ChefHat, tone: "bg-lime-50 text-lime-700" },
  ];

  return (
    <div className="min-w-0 space-y-5">
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm xl:flex-row xl:items-center">
        <div className="flex min-w-0 gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
          {DEPARTMENTS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setDepartment(item.id)}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                department === item.id ? "bg-white text-emerald-800 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:bg-white/60 hover:text-slate-800",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 xl:ml-auto">
          <span className="hidden items-center gap-1.5 whitespace-nowrap rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 2xl:inline-flex">
            <CalendarDays className="h-3.5 w-3.5" />
            {dates.from === dates.to ? fmtDay(dates.from) : `${fmtDay(dates.from)} – ${fmtDay(dates.to)}`}
          </span>
          <label className="relative">
            <Building2 className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <select aria-label="Property" className={cn(selectClass, "max-w-[220px] pl-8")} value={propertyFilter} onChange={(e) => setPropertyFilter(e.target.value)}>
              <option value="ALL">All properties</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>{property.name}</option>
              ))}
            </select>
          </label>
          <label className="relative">
            <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <select
              aria-label="Reporting period"
              className={cn(selectClass, "pl-8")}
              value={period}
              onChange={(e) => {
                const next = e.target.value as PeriodId;
                if (next !== "custom") setLoading(true);
                setPeriod(next);
              }}
            >
              {PERIODS.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>
          {period === "custom" && (
            <div className="flex items-center gap-1.5">
              <input type="date" aria-label="Start date" className={cn(selectClass, "pr-3")} value={customFrom} onChange={(e) => { setCustomFrom(e.target.value); if (e.target.value && customTo) setLoading(true); }} />
              <span className="text-xs text-slate-400">to</span>
              <input type="date" aria-label="End date" className={cn(selectClass, "pr-3")} value={customTo} onChange={(e) => { setCustomTo(e.target.value); if (customFrom && e.target.value) setLoading(true); }} />
            </div>
          )}
          <button
            type="button"
            disabled={loading}
            onClick={refresh}
            title="Refresh"
            aria-label="Refresh"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const meta = CARD_ICONS[card.label];
          const Icon = meta?.icon ?? IndianRupee;
          return (
            <div
              key={card.label}
              className={cn(
                "relative min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br to-white to-60% p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
                meta?.wash ?? "from-slate-50",
              )}
            >
              <span className={cn("pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.08]", meta?.bar ?? "bg-slate-400")} />
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-1">
                  <p className="truncate text-xs font-medium text-slate-500">{card.label}</p>
                  <span title={card.note} className="shrink-0 cursor-help text-slate-300 hover:text-slate-500">
                    <Info className="h-3 w-3" />
                  </span>
                </div>
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm", meta?.bar ?? "bg-slate-500")}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className={cn("relative -mt-1 truncate text-[28px] font-bold leading-tight tracking-tight text-slate-900 tabular-nums", busy && "animate-pulse text-slate-300")}>
                {busy ? "₹ ——" : card.value}
              </p>
              <div className="relative mt-3 flex min-h-[22px] items-center gap-2">
                {card.current !== null && card.previous !== null ? (
                  <>
                    <Delta current={card.current} previous={card.previous} inverse={card.label === "Operating expenses"} />
                    {card.previous ? (
                      <span className="truncate text-[11px] text-slate-400">prev. {inr(card.previous)}</span>
                    ) : null}
                  </>
                ) : (
                  <span className="line-clamp-1 text-[11px] text-slate-400" title={card.note}>{card.note}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {department === "all" || department === "front-office" ? (
        <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-4 xl:grid-cols-8">
          {tiles.map((tile) => (
            <div key={tile.label} className="flex min-w-0 items-center gap-2.5 border-b border-r border-slate-100 px-3 py-3">
              <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", tile.tone)}>
                <tile.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-medium text-slate-500">{tile.label}</p>
                <p className="truncate text-base font-bold text-slate-900 tabular-nums">{busy ? "…" : tile.value}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-3 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Revenue trend" subtitle={department === "fb" ? "F&B sales" : department === "front-office" ? "Room revenue" : "Room revenue and F&B sales"} />
          <div className="h-64">
            {trend.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-slate-500">
                <TrendingUp className="h-6 w-6 text-slate-300" />
                No revenue in this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend} margin={{ top: 5, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    tickFormatter={(v: number) => (v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                  />
                  <Tooltip formatter={(value) => inr(Number(value ?? 0))} cursor={{ fill: "#f1f5f9" }} contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
                  {department !== "fb" && <Bar dataKey="room" name="Room revenue" fill="#0f766e" radius={[6, 6, 0, 0]} maxBarSize={26} />}
                  {department !== "front-office" && department !== "purchase" && department !== "hr" && (
                    <Bar dataKey="fb" name="F&B sales" fill="#86efac" radius={[6, 6, 0, 0]} maxBarSize={26} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="flex min-h-0 flex-col">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Needs attention</h2>
              <p className="text-xs text-slate-500">Open an item to jump to that property</p>
            </div>
            {alerts.length > 0 && (
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700">{alerts.length}</span>
            )}
          </div>
          {alerts.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-sm text-slate-500">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">✓</span>
              All clear in this view.
            </div>
          ) : (
            <ul className="-mx-2 max-h-64 space-y-1 overflow-y-auto">
              {alerts.map((alert) => (
                <li key={alert.id}>
                  <button
                    type="button"
                    className="flex w-full items-start gap-3 rounded-xl px-2 py-2 text-left hover:bg-slate-50"
                    onClick={() => {
                      const property = properties.find((row) => row.id === alert.propertyId);
                      if (property) onOpenAt(property, alert.href);
                    }}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                        alert.severity === "high" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600",
                      )}
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{alert.title}</p>
                      <p className="truncate text-xs text-slate-500">{alert.propertyName} · {alert.detail}</p>
                    </div>
                    <ChevronRight className="mt-1.5 h-4 w-4 shrink-0 text-slate-300" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="overflow-hidden p-0 sm:p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Property comparison</h2>
            <p className="mt-0.5 text-xs text-slate-500">Same definitions for every property. Click a row to open that property.</p>
          </div>
          <Button type="button" variant="outline" className="h-9 gap-1.5 rounded-full px-3" disabled={!snapshot} onClick={exportComparison}>
            <Download className="h-3.5 w-3.5" />
            Export Excel
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="w-10 py-2.5 pl-5 pr-2">#</th>
                {([
                  ["name", "Property"],
                  ["revenue", "Revenue"],
                  ["occupancy", "Occupancy"],
                  ["expenses", "Expenses"],
                  ["profit", "Profit"],
                ] as [SortKey, string][]).map(([key, label]) => {
                  const SortIcon = sortKey !== key ? ArrowUpDown : sortAsc ? ArrowUp : ArrowDown;
                  return (
                    <th key={key} className={cn("py-2.5 pr-4", key !== "name" && "text-right")}>
                      <button
                        type="button"
                        className={cn("inline-flex items-center gap-1 font-semibold hover:text-slate-900", sortKey === key && "text-slate-900")}
                        onClick={() => toggleSort(key)}
                      >
                        {label}
                        <SortIcon className={cn("h-3 w-3", sortKey !== key && "opacity-40")} />
                      </button>
                    </th>
                  );
                })}
                <th className="w-10 py-2.5 pr-5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((row, idx) => {
                const figures = rowFigures(row);
                const occ = num(row.periodOccupancyPct);
                return (
                  <tr key={row.id} className="group cursor-pointer hover:bg-emerald-50/40" onClick={() => onOpen(row)}>
                    <td className="py-3 pl-5 pr-2 text-xs font-semibold text-slate-400">{idx + 1}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-bold text-white">
                          {row.name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{row.name}</p>
                          <p className="text-[11px] text-slate-500">{row.city || "No city"} · {row.rooms} rooms</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      {figures.revenue === null ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-semibold text-slate-900">{inr(figures.revenue)}</span>
                          <span className="h-1 w-20 overflow-hidden rounded-full bg-slate-100">
                            <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${(figures.revenue / maxRevenue) * 100}%` }} />
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                          <span
                            className={cn("block h-full rounded-full", occ >= 70 ? "bg-emerald-500" : occ >= 40 ? "bg-amber-400" : "bg-rose-400")}
                            style={{ width: `${Math.min(100, occ)}%` }}
                          />
                        </span>
                        <span className="w-12 font-semibold text-slate-700">{occ}%</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-right text-slate-700">{figures.expenses === null ? <span className="text-slate-400">—</span> : inr(figures.expenses)}</td>
                    <td className={cn("py-3 pr-4 text-right font-bold", figures.profit === null ? "text-slate-400" : figures.profit >= 0 ? "text-emerald-700" : "text-rose-600")}>
                      {figures.profit === null ? "—" : inr(figures.profit)}
                    </td>
                    <td className="py-3 pr-5 text-right">
                      <ChevronRight className="ml-auto h-4 w-4 text-slate-300 transition-colors group-hover:text-emerald-700" />
                    </td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-slate-500">No properties in this view.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {(department === "all" || department === "purchase") && (
          <OpsCard
            icon={ShoppingCart}
            title="Purchase & Stores"
            subtitle={snapshot?.coverage?.purchases ? "Orders and requisitions on a property" : "Waiting for property-linked records"}
            items={[
              ["Pending requisitions", String(sumBy(scoped, (row) => num(row.pendingPurchases)))],
              ["Purchase spend", inr(purchase)],
            ]}
          />
        )}
        {(department === "all" || department === "fb") && (
          <OpsCard
            icon={ChefHat}
            title="Food & Beverage"
            subtitle={snapshot?.coverage?.fb ? "Orders stored on a property" : "Not linked to properties yet"}
            items={[
              ["Sales", inr(fb)],
              ["Orders", String(sumBy(scoped, (row) => num(row.fbOrders)))],
              ["Open now", String(sumBy(scoped, (row) => row.openOrders))],
            ]}
          />
        )}
        {(department === "all" || department === "hr") && (
          <OpsCard
            icon={Users}
            title="HR & Payroll"
            subtitle="Headcount now · payroll for the period"
            items={[
              ["Employees", String(sumBy(scoped, (row) => row.employees))],
              ["Absent today", String(sumBy(scoped, (row) => num(row.absentToday)))],
              ["Pending leave", String(sumBy(scoped, (row) => num(row.pendingLeaves)))],
              ["Payroll cost", inr(payroll)],
            ]}
          />
        )}
        {(department === "all" || department === "front-office") && (
          <OpsCard
            icon={Wrench}
            title="Property operations"
            subtitle="Current room and maintenance status"
            items={[
              ["Out of order", String(sumBy(scoped, (row) => num(row.oooRooms)))],
              ["Dirty / cleaning", String(sumBy(scoped, (row) => row.dirtyRooms))],
              ["Open work orders", String(sumBy(scoped, (row) => row.openWorkOrders))],
              ["Overdue", String(sumBy(scoped, (row) => num(row.overdueWorkOrders)))],
            ]}
          />
        )}
      </div>

      <p className="flex items-start gap-2 rounded-xl bg-slate-100/70 px-3 py-2.5 text-[11px] leading-relaxed text-slate-500">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Cash and bank balances, budget versus actual, and vendor payable aging are not shown — they need reconciled accounting entries.
        Guest balances are open folio amounts, not a full receivables aging.
      </p>
    </div>
  );
}

function OpsCard({ icon: Icon, title, subtitle, items }: { icon: LucideIcon; title: string; subtitle: string; items: [string, string][] }) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-start gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="truncate text-[11px] text-slate-500" title={subtitle}>{subtitle}</p>
        </div>
      </div>
      <OpsList items={items} />
    </Card>
  );
}

function OpsList({ items }: { items: [string, string][] }) {
  return (
    <dl className="grid grid-cols-2 gap-2">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-lg bg-slate-50 px-3 py-2">
          <dt className="text-[10px] font-semibold uppercase text-slate-500">{label}</dt>
          <dd className="mt-0.5 text-sm font-bold text-slate-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
