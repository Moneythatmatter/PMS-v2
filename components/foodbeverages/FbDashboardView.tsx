"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ChefHat,
  ClipboardList,
  Clock,
  LayoutGrid,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { formatINR } from "@/app/data/foodbeverages/ops";
import {
  fbDashboardService,
  type FbOrder,
  type FbOutlet,
  type LiveTable,
} from "@/services/food-beverages";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
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
    label: "Kitchen",
    href: "/food-beverages/kitchen/orders",
    icon: ChefHat,
    hint: "Accept / prep",
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
      href: "/food-beverages/restaurants/orders",
      action: "Open orders",
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

  const occupied = data.liveTables.filter((t) =>
    ["Occupied", "Reserved"].includes(t.status),
  ).length;
  if (occupied) {
    items.push({
      id: "floor",
      tone: "info",
      title: `${occupied} tables on floor`,
      detail: "Occupied or reserved right now",
      href: "/food-beverages/restaurants/orders",
      action: "Open orders",
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

const statIcons = [TrendingUp, ClipboardList, UtensilsCrossed, LayoutGrid];
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
        const payload = await fbDashboardService.get() as DashboardData;
        if (!cancelled) {
          setData(payload);
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
        description="Live outlet performance and open work."
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
        description="Live outlet performance and open work."
        wrapChildren={false}
      >
        <p className="text-sm text-red-600">{error ?? "Failed to load"}</p>
      </ModulePageShell>
    );
  }

  const restaurantOutlets = data.outlets.filter((o) =>
    ["restaurant", "cafe", "bar"].includes(String(o.type)),
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

  return (
    <ModulePageShell
      eyebrow="Food & Beverages"
      title="Dashboard"
      description="Live outlet performance and open work."
      wrapChildren={false}
    >
      <div className="min-w-0 space-y-4 sm:space-y-6 lg:space-y-8">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          {shellStats.map((stat) => {
            const Icon = stat.icon ?? TrendingUp;
            return (
              <Card key={stat.label} className="h-full min-w-0 p-3 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
                    {stat.label}
                  </p>
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-8 sm:w-8"
                    style={{ backgroundColor: `${stat.accent}20`, color: stat.accent }}
                  >
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </span>
                </div>
                <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">{stat.value}</p>
                {stat.sublabel && (
                  <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">{stat.sublabel}</p>
                )}
              </Card>
            );
          })}
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8">
          <Card className="min-w-0 lg:col-span-1">
            <CardHeader title="Alerts" subtitle="Needs attention now" />
            {alerts.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-slate-400">All clear</p>
            ) : (
              <ul className="space-y-2 px-4 pb-4">
                {alerts.map((item) => (
                  <li
                    key={item.id}
                    className={cn(
                      "rounded-lg border px-3 py-2.5",
                      toneClass(item.tone),
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", toneDot(item.tone))}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="mt-0.5 text-xs opacity-90">{item.detail}</p>
                        <Link
                          href={item.href}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                        >
                          {item.action}
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="min-w-0 xl:col-span-2">
            <CardHeader title="Quick actions" subtitle="Jump into daily F&B ops" />
            <div className="grid grid-cols-2 gap-3">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group rounded-lg border border-slate-200 bg-slate-50/50 p-3 transition hover:border-emerald-300 hover:bg-emerald-50/50"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-emerald-700 ring-1 ring-slate-200 group-hover:ring-emerald-200">
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{link.label}</p>
                    <p className="text-xs text-slate-500">{link.hint}</p>
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8">
          <Card className="min-w-0 lg:col-span-1">
            <CardHeader
              title="Outlets"
              subtitle={`${restaurantOutlets.length} active`}
            />
            <ul className="divide-y divide-slate-100">
              {restaurantOutlets.map((outlet) => {
                const open = openByOutlet[outlet.id] ?? 0;
                const tables = tablesByOutlet[outlet.id];
                return (
                  <li key={outlet.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{outlet.name}</p>
                      <p className="text-xs text-slate-500">
                        {open} open order{open === 1 ? "" : "s"}
                        {tables ? ` · ${tables.occupied}/${tables.total} tables` : ""}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
                        statusBadge(outletStatus(outlet, open)),
                      )}
                    >
                      {outletStatus(outlet, open)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card className="min-w-0 lg:col-span-2">
            <CardHeader
              title="Live orders"
              subtitle="Latest tickets across restaurants, cafe & bar"
              action={
                <Link
                  href="/food-beverages/restaurants/orders"
                  className="text-xs font-medium text-emerald-700 hover:underline"
                >
                  Open orders
                </Link>
              }
            />
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
                        <td className="py-3 pr-3 text-sm font-medium text-slate-900">
                          {order.orderNo}
                        </td>
                        <td className="py-3 pr-3 text-slate-700">{outletName}</td>
                        <td className="py-3 pr-3 text-slate-700">{order.ref}</td>
                        <td className="py-3 pr-3 font-medium text-slate-900">
                          {formatINR(order.amount)}
                        </td>
                        <td className="py-3 pr-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
                              statusBadge(order.status),
                            )}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 text-xs text-slate-500">{order.placedAt}</td>
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
          </Card>
        </div>
      </div>
    </ModulePageShell>
  );
}
