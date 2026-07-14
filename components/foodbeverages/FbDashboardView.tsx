"use client";

import Link from "next/link";
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
import { banquetVenues, restaurantOutlets } from "@/app/data/foodbeverages/modules";
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

const outletMetrics: Record<
  string,
  {
    sales: string;
    covers: number;
    openOrders: number;
    tables: string;
    occupancy: number;
    status: "Busy" | "Steady" | "Quiet";
  }
> = {
  "rest-1": {
    sales: "₹48,200",
    covers: 42,
    openOrders: 7,
    tables: "5 / 16",
    occupancy: 72,
    status: "Busy",
  },
  "rest-2": {
    sales: "₹36,400",
    covers: 28,
    openOrders: 4,
    tables: "3 / 14",
    occupancy: 48,
    status: "Steady",
  },
  "cafe-1": {
    sales: "₹22,100",
    covers: 11,
    openOrders: 2,
    tables: "2 / 8",
    occupancy: 35,
    status: "Quiet",
  },
  "cafe-2": {
    sales: "₹17,800",
    covers: 5,
    openOrders: 1,
    tables: "1 / 6",
    occupancy: 22,
    status: "Quiet",
  },
};

const alerts = [
  {
    id: "a1",
    tone: "danger" as const,
    title: "1 table in billing · Restaurant #1",
    detail: "Guest waiting over 12 min",
    href: "/food-beverages/restaurants/tables",
    action: "Open tables",
  },
  {
    id: "a2",
    tone: "warning" as const,
    title: "2 kitchen tickets over SLA",
    detail: "Main Kitchen KDS",
    href: "/food-beverages/kitchen/kds",
    action: "Open KDS",
  },
  {
    id: "a3",
    tone: "warning" as const,
    title: "Lawn · Product Launch balance ₹52,000",
    detail: "Pending banquet close",
    href: "/food-beverages/banquet/bookings",
    action: "Open banquet",
  },
  {
    id: "a4",
    tone: "info" as const,
    title: "Cashier shift open · Amit Kumar",
    detail: "Restaurant #1 · Lunch",
    href: "/food-beverages/restaurants/cashier",
    action: "Cashier",
  },
];

const banquetToday = [
  {
    id: "b1",
    venue: "Lawn",
    event: "Product Launch",
    time: "6:00 PM",
    pax: 120,
    status: "Confirmed",
    balance: "₹52,000",
  },
  {
    id: "b2",
    venue: "Conference Hall A",
    event: "Board Meeting",
    time: "10:00 AM",
    pax: 28,
    status: "In Progress",
    balance: "₹0",
  },
];

const recentOrders = [
  {
    id: "O-1842",
    outlet: "Restaurant #1",
    table: "T12",
    amount: "₹3,240",
    status: "Serving",
    ago: "2 min",
  },
  {
    id: "O-1841",
    outlet: "Lobby Cafe",
    table: "C3",
    amount: "₹680",
    status: "Billing",
    ago: "5 min",
  },
  {
    id: "O-1840",
    outlet: "Main Bar",
    table: "B2",
    amount: "₹2,150",
    status: "Preparing",
    ago: "8 min",
  },
  {
    id: "O-1839",
    outlet: "Restaurant #2",
    table: "T4",
    amount: "₹4,890",
    status: "Paid",
    ago: "12 min",
  },
];

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
  if (status === "Paid" || status === "Steady" || status === "Confirmed") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

export function FbDashboardView() {
  return (
    <ModulePageShell
      eyebrow="Food & Beverages"
      title="Dashboard"
      description="Live outlet performance, open work, and banquet activity."
      stats={[
        {
          label: "Today's Sales",
          value: "₹1.24L",
          accent: "#15803d",
          icon: TrendingUp,
          sublabel: "+12% vs yesterday",
        },
        {
          label: "Open Orders",
          value: 18,
          accent: "#f59e0b",
          icon: ClipboardList,
          sublabel: "7 dining · 4 kitchen SLA",
        },
        {
          label: "Live Covers",
          value: 86,
          accent: "#10b981",
          icon: UtensilsCrossed,
          sublabel: "Across 4 outlets",
        },
        {
          label: "Events Today",
          value: 2,
          accent: "#15803d",
          icon: Building2,
          sublabel: "1 in progress",
        },
      ]}
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
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", toneDot(alert.tone))} />
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
                  const m = outletMetrics[outlet.id];
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
                      <td className="py-3 pr-3 font-medium text-slate-800">{m.sales}</td>
                      <td className="py-3 pr-3 text-slate-700">{m.covers}</td>
                      <td className="py-3 pr-3 text-slate-700">{m.openOrders}</td>
                      <td className="py-3 pr-3">
                        <div className="space-y-1">
                          <p className="text-xs text-slate-600">{m.tables} occupied</p>
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-emerald-600"
                              style={{ width: `${m.occupancy}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                            statusBadge(m.status),
                          )}
                        >
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
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
            {banquetToday.map((event) => (
              <li
                key={event.id}
                className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{event.event}</p>
                    <p className="text-xs text-slate-500">
                      {event.venue} · {event.time} · {event.pax} pax
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
                      statusBadge(event.status),
                    )}
                  >
                    {event.status}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Balance {event.balance}</span>
                  <Link
                    href="/food-beverages/banquet/bookings"
                    className="font-medium text-emerald-700 hover:underline"
                  >
                    Open
                  </Link>
                </div>
              </li>
            ))}
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
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-emerald-50/30">
                    <td className="py-2.5 pr-3 font-medium text-slate-900">{order.id}</td>
                    <td className="py-2.5 pr-3 text-slate-700">{order.outlet}</td>
                    <td className="py-2.5 pr-3 text-slate-700">{order.table}</td>
                    <td className="py-2.5 pr-3 font-medium text-slate-900">{order.amount}</td>
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
                    <td className="py-2.5 text-xs text-slate-500">{order.ago}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </ModulePageShell>
  );
}
