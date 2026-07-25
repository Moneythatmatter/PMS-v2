"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  ChefHat,
  ClipboardList,
  Clock,
  LayoutGrid,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
  Wine,
} from "lucide-react";
import { formatINR } from "@/app/data/foodbeverages/ops";
import {
  banquetBookingService,
  fbDashboardService,
  type FbOrder,
  type FbOutlet,
  type LiveTable,
} from "@/services/food-beverages";
import { Button } from "@/components/ui/Button";
import { ModulePageShell } from "@/components/pms";
import { cn } from "@/lib/utils";

const quickLinks = [
  {
    label: "Tables",
    href: "/food-beverages/restaurants/tables",
    icon: LayoutGrid,
    hint: "Floor plan",
  },
  {
    label: "Orders",
    href: "/food-beverages/restaurants/orders",
    icon: ClipboardList,
    hint: "Open checks",
  },
  {
    label: "Cashier",
    href: "/food-beverages/restaurants/cashier",
    icon: Wallet,
    hint: "Shift close",
  },
  {
    label: "Kitchen KDS",
    href: "/food-beverages/kitchen/kds",
    icon: ChefHat,
    hint: "Tickets",
  },
  {
    label: "Banquet",
    href: "/food-beverages/banquet/bookings",
    icon: Building2,
    hint: "Events",
  },
  {
    label: "Bar",
    href: "/food-beverages/bar/orders",
    icon: Wine,
    hint: "Bar tickets",
  },
  {
    label: "POS Billing",
    href: "/food-beverages/pos-billing",
    icon: Wallet,
    hint: "Walk-in",
  },
  {
    label: "Day Close",
    href: "/food-beverages/restaurants/day-close",
    icon: Clock,
    hint: "Outlet close",
  },
];

type BanquetBooking = {
  id: string;
  venue?: string;
  event?: string;
  time?: string;
  pax?: number;
  status?: string;
  balance?: string | number;
};

type DashboardStat = {
  label: string;
  value: string | number;
  sublabel?: string;
  accent?: string;
};

type DashboardData = {
  outlets: FbOutlet[];
  stats: DashboardStat[];
  recentOrders: FbOrder[];
  liveTables: LiveTable[];
  banquetBookings: BanquetBooking[];
};

type AlertItem = {
  id: string;
  tone: "danger" | "warning" | "info";
  title: string;
  detail: string;
  href: string;
  action: string;
};

function buildAlerts(data: DashboardData): AlertItem[] {
  const items: AlertItem[] = [];
  const billing = data.liveTables.filter((t) => t.status === "Billing");
  if (billing.length) {
    items.push({
      id: "billing",
      tone: "danger",
      title: `${billing.length} table${billing.length > 1 ? "s" : ""} in billing`,
      detail: billing
        .slice(0, 3)
        .map((t) => t.tableNo)
        .join(", "),
      href: "/food-beverages/restaurants/live-status",
      action: "Open tables",
    });
  }

  const openOrders = data.recentOrders.filter((o) => o.status !== "Settled");
  if (openOrders.length) {
    items.push({
      id: "orders",
      tone: "warning",
      title: `${openOrders.length} open order${openOrders.length > 1 ? "s" : ""}`,
      detail: "In kitchen / service",
      href: "/food-beverages/restaurants/orders",
      action: "Open orders",
    });
  }

  const pendingBanquet = data.banquetBookings.filter((b) => {
    const bal = Number(String(b.balance ?? "0").replace(/[^\d.-]/g, ""));
    return bal > 0;
  });
  if (pendingBanquet.length) {
    const first = pendingBanquet[0];
    items.push({
      id: "banquet",
      tone: "warning",
      title: `${first.venue ?? "Venue"} · ${first.event ?? "Event"} balance ${
        typeof first.balance === "number"
          ? formatINR(first.balance)
          : String(first.balance)
      }`,
      detail: "Pending banquet close",
      href: "/food-beverages/banquet/bookings",
      action: "Open banquet",
    });
  }

  const occupied = data.liveTables.filter((t) =>
    ["Occupied", "Reserved"].includes(t.status),
  ).length;
  if (occupied) {
    items.push({
      id: "floor",
      tone: "info",
      title: `${occupied} tables on floor`,
      detail: "Occupied or reserved right now",
      href: "/food-beverages/restaurants/live-status",
      action: "Live status",
    });
  }

  return items;
}

function toneClass(tone: "danger" | "warning" | "info") {
  if (tone === "danger") return "border-red-200 bg-red-50 text-red-800";
  if (tone === "warning") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-emerald-200 bg-emerald-50 text-emerald-900";
}

function toneDot(tone: "danger" | "warning" | "info") {
  if (tone === "danger") return "bg-red-500";
  if (tone === "warning") return "bg-amber-500";
  return "bg-emerald-500";
}

function statusBadge(status: string) {
  if (status === "Busy" || status === "Serving" || status === "In Progress") {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }
  if (status === "Billing" || status === "Preparing") {
    return "bg-orange-50 text-orange-700 ring-orange-200";
  }
  if (status === "Paid" || status === "Steady" || status === "Confirmed" || status === "Ready" || status === "Served") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

const statIcons = [TrendingUp, ClipboardList, UtensilsCrossed, Building2];
const statAccents = ["#15803d", "#f59e0b", "#10b981", "#15803d"];

function outletStatus(outlet: FbOutlet, openOrders: number): string {
  if (outlet.status) return outlet.status;
  if (openOrders >= 5) return "Busy";
  if (openOrders >= 2) return "Steady";
  return "Quiet";
}

export function FbDashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [payload, bookings] = await Promise.all([
          fbDashboardService.get() as Promise<Omit<DashboardData, "banquetBookings">>,
          banquetBookingService.list().catch(() => [] as BanquetBooking[]),
        ]);
        if (!cancelled) {
          setData({
            ...payload,
            banquetBookings: bookings as BanquetBooking[],
          });
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setData(null);
          setError(e instanceof Error ? e.message : "Failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <ModulePageShell
        eyebrow="Food & Beverages"
        title="Dashboard"
        description="Live outlet performance, open work, and banquet activity."
        wrapChildren={false}
      >
        <p className="text-sm text-slate-500">Loading…</p>
      </ModulePageShell>
    );
  }

  if (error || !data) {
    return (
      <ModulePageShell
        eyebrow="Food & Beverages"
        title="Dashboard"
        description="Live outlet performance, open work, and banquet activity."
        wrapChildren={false}
      >
        <p className="text-sm text-red-600">{error ?? "Failed to load"}</p>
      </ModulePageShell>
    );
  }

  const restaurantOutlets = data.outlets.filter((o) =>
    ["restaurant", "cafe"].includes(String(o.type)),
  );
  const openByOutlet = data.recentOrders.reduce<Record<string, number>>((acc, o) => {
    if (o.status !== "Settled") {
      acc[o.outletId] = (acc[o.outletId] ?? 0) + 1;
    }
    return acc;
  }, {});
  const tablesByOutlet = data.liveTables.reduce<
    Record<string, { occupied: number; total: number }>
  >((acc, t) => {
    const row = acc[t.outletId] ?? { occupied: 0, total: 0 };
    row.total += 1;
    if (["Occupied", "Billing", "Reserved"].includes(t.status)) row.occupied += 1;
    acc[t.outletId] = row;
    return acc;
  }, {});

  const shellStats = (data.stats ?? []).slice(0, 4).map((stat, i) => ({
    label: stat.label,
    value: stat.value,
    accent: stat.accent ?? statAccents[i] ?? "#15803d",
    icon: statIcons[i],
    sublabel: stat.sublabel,
  }));
  const alerts = buildAlerts(data);
  const banquetVenues = data.outlets.filter((o) => o.type === "banquet");
  const banquetToday = data.banquetBookings.slice(0, 6);

  return (
    <ModulePageShell
      eyebrow="Food & Beverages"
      title="Dashboard"
      description="Live outlet performance, open work, and banquet activity."
      stats={shellStats}
      wrapChildren={false}
    >
      {/* Needs attention */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-slate-900">Needs attention</h2>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
              {alerts.length}
            </span>
          </div>
          <Link
            href="/food-beverages/restaurants/orders"
            className="text-xs font-medium text-emerald-700 hover:underline"
          >
            View all operations
          </Link>
        </div>
        {alerts.length === 0 ? (
          <p className="text-sm text-slate-500">No open alerts from live F&B data.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {alerts.map((alert) => (
              <Link
                key={alert.id}
                href={alert.href}
                className={cn(
                  "rounded-xl border p-3 transition hover:-translate-y-0.5 hover:shadow-sm",
                  toneClass(alert.tone),
                )}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", toneDot(alert.tone))}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-snug">{alert.title}</p>
                    <p className="mt-0.5 text-xs opacity-80">{alert.detail}</p>
                    <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold">
                      {alert.action}
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-5">
        {/* Outlet performance */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 xl:col-span-3">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Outlet performance</h2>
              <p className="text-xs text-slate-500">Sales, covers, and floor pressure right now</p>
            </div>
            <Link
              href="/food-beverages/restaurants/outlets"
              className="text-xs font-medium text-emerald-700 hover:underline"
            >
              Manage outlets
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-2 pr-3 font-semibold">Outlet</th>
                  <th className="pb-2 pr-3 font-semibold">Sales</th>
                  <th className="pb-2 pr-3 font-semibold">Covers</th>
                  <th className="pb-2 pr-3 font-semibold">Open</th>
                  <th className="pb-2 pr-3 font-semibold">Floor</th>
                  <th className="pb-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {restaurantOutlets.map((outlet) => {
                  const openOrders = openByOutlet[outlet.id] ?? 0;
                  const floor = tablesByOutlet[outlet.id];
                  const occupied = floor?.occupied ?? 0;
                  const total = floor?.total ?? outlet.tables ?? 0;
                  const occupancy = total > 0 ? Math.round((occupied / total) * 100) : 0;
                  const status = outletStatus(outlet, openOrders);
                  const sales =
                    typeof outlet.sales === "string"
                      ? outlet.sales
                      : outlet.sales != null
                        ? formatINR(Number(outlet.sales))
                        : "—";
                  return (
                    <tr key={outlet.id} className="group hover:bg-emerald-50/30">
                      <td className="py-3 pr-3">
                        <Link
                          href="/food-beverages/restaurants/tables"
                          className="block"
                        >
                          <p className="font-semibold text-slate-900 group-hover:text-emerald-800">
                            {outlet.name}
                          </p>
                          <p className="text-[11px] capitalize text-slate-500">{outlet.type}</p>
                        </Link>
                      </td>
                      <td className="py-3 pr-3 font-medium text-slate-800">{sales}</td>
                      <td className="py-3 pr-3 text-slate-700">{outlet.covers ?? "—"}</td>
                      <td className="py-3 pr-3 text-slate-700">{openOrders}</td>
                      <td className="py-3 pr-3">
                        <div className="space-y-1">
                          <p className="text-xs text-slate-600">
                            {total > 0 ? `${occupied} / ${total}` : "—"} occupied
                          </p>
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-emerald-600"
                              style={{ width: `${occupancy}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                            statusBadge(status),
                          )}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {restaurantOutlets.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-slate-400">
                      No outlets available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quick actions */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 xl:col-span-2">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Quick actions</h2>
            <p className="text-xs text-slate-500">Jump into daily F&B ops</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group rounded-xl border border-slate-200 bg-slate-50/50 p-3 transition hover:border-emerald-300 hover:bg-emerald-50/50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200 group-hover:ring-emerald-200">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{link.label}</p>
                  <p className="text-[11px] text-slate-500">{link.hint}</p>
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Banquet today */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Banquet today</h2>
              <p className="text-xs text-slate-500">{banquetVenues.length} venues configured</p>
            </div>
            <Link href="/food-beverages/banquet/bookings">
              <Button type="button" size="sm" variant="outline">
                All bookings
              </Button>
            </Link>
          </div>
          <ul className="space-y-2">
            {banquetToday.length === 0 ? (
              <li className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-400">
                No banquet bookings from API
              </li>
            ) : (
              banquetToday.map((event) => (
                <li
                  key={event.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {event.event ?? "Event"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {event.venue ?? "Venue"}
                        {event.time ? ` · ${event.time}` : ""}
                        {event.pax != null ? ` · ${event.pax} pax` : ""}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
                        statusBadge(String(event.status ?? "")),
                      )}
                    >
                      {event.status ?? "—"}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      Balance{" "}
                      {typeof event.balance === "number"
                        ? formatINR(event.balance)
                        : String(event.balance ?? "—")}
                    </span>
                    <Link
                      href="/food-beverages/banquet/bookings"
                      className="font-medium text-emerald-700 hover:underline"
                    >
                      Open
                    </Link>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

        {/* Recent orders */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Live orders</h2>
              <p className="text-xs text-slate-500">Latest tickets across restaurants, cafe & bar</p>
            </div>
            <Link
              href="/food-beverages/restaurants/orders"
              className="text-xs font-medium text-emerald-700 hover:underline"
            >
              Open orders
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-2 pr-3 font-semibold">Order</th>
                  <th className="pb-2 pr-3 font-semibold">Outlet</th>
                  <th className="pb-2 pr-3 font-semibold">Table</th>
                  <th className="pb-2 pr-3 font-semibold">Amount</th>
                  <th className="pb-2 pr-3 font-semibold">Status</th>
                  <th className="pb-2 font-semibold">Age</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.recentOrders.map((order) => {
                  const outletName =
                    data.outlets.find((o) => o.id === order.outletId)?.name ?? order.outletId;
                  return (
                    <tr key={order.id} className="hover:bg-emerald-50/30">
                      <td className="py-2.5 pr-3 font-medium text-slate-900">{order.orderNo}</td>
                      <td className="py-2.5 pr-3 text-slate-700">{outletName}</td>
                      <td className="py-2.5 pr-3 text-slate-700">{order.ref}</td>
                      <td className="py-2.5 pr-3 font-medium text-slate-900">
                        {formatINR(order.amount)}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                            statusBadge(order.status),
                          )}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-xs text-slate-500">{order.placedAt}</td>
                    </tr>
                  );
                })}
                {data.recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-slate-400">
                      No recent orders
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </ModulePageShell>
  );
}
