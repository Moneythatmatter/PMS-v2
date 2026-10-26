"use client";

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
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

function Delta({ current, previous }: { current: number; previous: number }) {
  if (!previous) return <p className="mt-1 text-xs text-slate-400">No previous period to compare</p>;
  const pct = ((current - previous) / previous) * 100;
  const up = pct >= 0;
  return (
    <p className={cn("mt-1 text-xs font-semibold", up ? "text-emerald-700" : "text-rose-700")}>
      {up ? "+" : ""}
      {pct.toFixed(1)}% vs previous period
    </p>
  );
}

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
  }, [dates.from, dates.to, period, customFrom, customTo]);

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

  const selectClass = "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600";

  return (
    <div className="min-w-0 space-y-4">
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-3">
          <label className="block text-xs font-semibold text-slate-500">
            Property
            <select className={cn(selectClass, "mt-1.5")} value={propertyFilter} onChange={(e) => setPropertyFilter(e.target.value)}>
              <option value="ALL">All properties</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>{property.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-500">
            Reporting period
            <select className={cn(selectClass, "mt-1.5")} value={period} onChange={(e) => {
              const next = e.target.value as PeriodId;
              if (next !== "custom") setLoading(true);
              setPeriod(next);
            }}>
              {PERIODS.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-500">
            Department
            <select className={cn(selectClass, "mt-1.5")} value={department} onChange={(e) => setDepartment(e.target.value as DeptId)}>
              {DEPARTMENTS.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>
        </div>
        {period === "custom" && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-500">
              Start
              <input type="date" className={cn(selectClass, "mt-1.5")} value={customFrom} onChange={(e) => { setCustomFrom(e.target.value); if (e.target.value && customTo) setLoading(true); }} />
            </label>
            <label className="block text-xs font-semibold text-slate-500">
              End
              <input type="date" className={cn(selectClass, "mt-1.5")} value={customTo} onChange={(e) => { setCustomTo(e.target.value); if (customFrom && e.target.value) setLoading(true); }} />
            </label>
          </div>
        )}
        <p className="mt-3 text-xs text-slate-500">{propertyName} · {dates.from} to {dates.to}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label} className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-900">{loading && !snapshot ? "…" : card.value}</p>
            {card.current !== null && card.previous !== null ? <Delta current={card.current} previous={card.previous} /> : null}
            <p className="mt-2 text-xs leading-relaxed text-slate-500">{card.note}</p>
          </Card>
        ))}
      </div>

      {department === "all" || department === "front-office" ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ["Arrivals", String(sumBy(scoped, (row) => row.arrivals))],
            ["Departures", String(sumBy(scoped, (row) => row.departures))],
            ["In house now", String(sumBy(scoped, (row) => row.inHouse))],
            ["Average stay", `${avgLos} nights`],
            ["Cancellations", String(sumBy(scoped, (row) => num(row.cancellations)))],
            ["No-shows", String(sumBy(scoped, (row) => num(row.noShows)))],
            ["Room revenue", inr(earned)],
            ["F&B revenue", inr(fb)],
          ].map(([label, value]) => (
            <Card key={label} className="p-3 sm:p-4">
              <p className="text-[11px] font-medium text-slate-500">{label}</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{loading && !snapshot ? "…" : value}</p>
            </Card>
          ))}
        </div>
      ) : null}

      <Card>
        <CardHeader title="Revenue trend" subtitle={department === "fb" ? "F&B sales" : department === "front-office" ? "Room revenue" : "Room revenue and F&B sales"} />
        <div className="h-56">
          {trend.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-500">No revenue in this period.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} margin={{ top: 5, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip formatter={(value) => inr(Number(value ?? 0))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {department !== "fb" && <Bar dataKey="room" name="Room revenue" fill="#1e293b" radius={[4, 4, 0, 0]} maxBarSize={22} />}
                {department !== "front-office" && department !== "purchase" && department !== "hr" && (
                  <Bar dataKey="fb" name="F&B sales" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={22} />
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden p-0 sm:p-0">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Property comparison</h2>
            <p className="mt-0.5 text-xs text-slate-500">Same definitions for every property. Open a row for that property dashboard.</p>
          </div>
          <Button type="button" variant="outline" className="h-9 px-3" disabled={!snapshot} onClick={exportComparison}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export
          </Button>
        </div>
        <div className="overflow-x-auto px-4 py-2 sm:px-5">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <tr className="border-b border-slate-200">
                {([
                  ["name", "Property"],
                  ["revenue", "Revenue"],
                  ["occupancy", "Occupancy"],
                  ["expenses", "Expenses"],
                  ["profit", "Profit"],
                ] as [SortKey, string][]).map(([key, label]) => (
                  <th key={key} className={cn("py-2 pr-3", key !== "name" && "text-right")}>
                    <button type="button" className="font-semibold hover:text-slate-900" onClick={() => toggleSort(key)}>{label}</button>
                  </th>
                ))}
                <th className="py-2 text-right" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => {
                const figures = rowFigures(row);
                return (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2.5 pr-3">
                      <p className="font-semibold text-slate-900">{row.name}</p>
                      <p className="text-[10px] text-slate-500">{row.city || "No city"} · {row.rooms} rooms</p>
                    </td>
                    <td className="py-2.5 pr-3 text-right font-medium">{figures.revenue === null ? "—" : inr(figures.revenue)}</td>
                    <td className="py-2.5 pr-3 text-right">{num(row.periodOccupancyPct)}%</td>
                    <td className="py-2.5 pr-3 text-right">{figures.expenses === null ? "—" : inr(figures.expenses)}</td>
                    <td className="py-2.5 pr-3 text-right font-semibold">{figures.profit === null ? "—" : inr(figures.profit)}</td>
                    <td className="py-2.5 text-right">
                      <button type="button" onClick={() => onOpen(row)} className="font-semibold text-emerald-800 hover:underline">View property</button>
                    </td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-slate-500">No properties in this view.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {(department === "all" || department === "purchase" || department === "fb" || department === "hr" || department === "front-office") && (
        <div className="grid gap-3 lg:grid-cols-2">
          {(department === "all" || department === "purchase") && (
            <Card>
              <CardHeader title="Purchase & Stores" subtitle={snapshot?.coverage?.purchases ? "Orders and requisitions stored on a property" : "Waiting for property-linked purchase records"} />
              <OpsList items={[
                ["Pending requisitions", String(sumBy(scoped, (row) => num(row.pendingPurchases)))],
                ["Purchase spend", inr(purchase)],
              ]} />
            </Card>
          )}
          {(department === "all" || department === "fb") && (
            <Card>
              <CardHeader title="Food & Beverage" subtitle={snapshot?.coverage?.fb ? "Orders stored on a property" : "F&B is not linked to properties yet"} />
              <OpsList items={[
                ["Sales", inr(fb)],
                ["Orders", String(sumBy(scoped, (row) => num(row.fbOrders)))],
                ["Open orders now", String(sumBy(scoped, (row) => row.openOrders))],
              ]} />
            </Card>
          )}
          {(department === "all" || department === "hr") && (
            <Card>
              <CardHeader title="HR & Payroll" subtitle="Headcount is current. Payroll follows the months in this period." />
              <OpsList items={[
                ["Employees", String(sumBy(scoped, (row) => row.employees))],
                ["Absent today", String(sumBy(scoped, (row) => num(row.absentToday)))],
                ["Pending leave", String(sumBy(scoped, (row) => num(row.pendingLeaves)))],
                ["Payroll cost", inr(payroll)],
              ]} />
            </Card>
          )}
          {(department === "all" || department === "front-office") && (
            <Card>
              <CardHeader title="Property operations" subtitle="Current room and maintenance status" />
              <OpsList items={[
                ["Out of order", String(sumBy(scoped, (row) => num(row.oooRooms)))],
                ["Dirty or cleaning", String(sumBy(scoped, (row) => row.dirtyRooms))],
                ["Open work orders", String(sumBy(scoped, (row) => row.openWorkOrders))],
                ["Overdue work orders", String(sumBy(scoped, (row) => num(row.overdueWorkOrders)))],
              ]} />
            </Card>
          )}
        </div>
      )}

      <Card>
        <CardHeader title="Needs attention" subtitle="Each item names the property and where to open it" />
        {alerts.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing waiting in this view.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {alerts.map((alert) => (
              <li key={alert.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", alert.severity === "high" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800")}>
                  {alert.severity}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
                  <p className="text-xs text-slate-500">{alert.propertyName} · {alert.detail} · {alert.owner}</p>
                </div>
                <button
                  type="button"
                  className="text-sm font-semibold text-emerald-800 hover:underline"
                  onClick={() => {
                    const property = properties.find((row) => row.id === alert.propertyId);
                    if (property) onOpenAt(property, alert.href);
                  }}
                >
                  Open
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="text-xs leading-relaxed text-slate-500">
        Cash and bank balances, budget versus actual, and vendor payable aging are not shown. Those need reconciled accounting entries, which this workspace does not treat as a closed ledger.
        Guest balances above are open folio amounts, not a full accounts-receivable aging.
      </p>
    </div>
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
