"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Loader2,
  Package,
  ShoppingCart,
  Users,
  Warehouse,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ModulePageShell } from "@/components/pms";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils";
import { usePsItem, usePsList } from "@/hooks/usePsResource";
import { psDashboardService, psPurchaseOrderService } from "@/services/purchase-stores/index";

const quickLinks = [
  {
    label: "New PR",
    href: "/purchase-stores/procurement/requisitions",
    icon: FileText,
    hint: "Requisitions",
  },
  {
    label: "Purchase Orders",
    href: "/purchase-stores/procurement/orders",
    icon: ShoppingCart,
    hint: "Open POs",
  },
  {
    label: "Receive GRN",
    href: "/purchase-stores/receiving/grn",
    icon: ClipboardCheck,
    hint: "Goods receipt",
  },
  {
    label: "Stock",
    href: "/purchase-stores/inventory/stock",
    icon: Boxes,
    hint: "On-hand balances",
  },
  {
    label: "Warehouses",
    href: "/purchase-stores/inventory/warehouses",
    icon: Warehouse,
    hint: "Storage locations",
  },
  {
    label: "Vendors",
    href: "/purchase-stores/vendors",
    icon: Users,
    hint: "Vendor registry",
  },
];

function Pill({ status }: { status: string }) {
  const tone =
    status === "Approved" ||
    status === "Active" ||
    status === "Matched" ||
    status === "Approved for Payment" ||
    status === "Completed"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : status === "Pending Approval" ||
          status === "Pending Verification" ||
          status === "Sent" ||
          status === "Draft" ||
          status === "Partial Match"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : status === "Mismatch" || status === "Rejected" || status === "Low Stock Alert" || status === "Emergency"
          ? "bg-red-50 text-red-700 ring-red-200"
          : "bg-slate-100 text-slate-600 ring-slate-200";

  return (
    <span className={cn("inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", tone)}>
      {status}
    </span>
  );
}

export default function PurchaseStoresDashboardPage() {
  const { data: dashboard, loading: dashboardLoading } = usePsItem(() => psDashboardService.get(), []);
  const { data: allPos, loading: posLoading } = usePsList(() => psPurchaseOrderService.list(), []);

  const loading = dashboardLoading || posLoading;
  const counts = dashboard?.counts ?? {};

  const pendingPrs = counts.pendingRequisitions ?? 0;
  const openPos = counts.purchaseOrders ?? 0;
  const pendingInvoices = counts.pendingInvoices ?? 0;
  const activeContracts = counts.activeContracts ?? 0;
  const productCount = counts.products ?? 0;
  const supplierCount = counts.suppliers ?? 0;
  const dspCount = counts.dsp ?? 0;
  const lowStockCount = counts.lowStockSkus ?? 0;

  const recentPrs = dashboard?.recentRequisitions ?? [];
  const recentPos = allPos.slice(0, 6);
  const recentDsp = dashboard?.recentDsp ?? [];
  const lowStockItems = dashboard?.lowStockItems ?? [];
  const stockPreview = dashboard?.stockPreview ?? [];

  const stockHealthPct = Math.round(
    ((productCount - lowStockCount) / Math.max(productCount, 1)) * 100,
  );

  const stockBreakdown = [
    { label: "Healthy SKUs", count: Math.max(productCount - lowStockCount, 0), color: "#15803d" },
    { label: "Low stock", count: lowStockCount, color: "#dc2626" },
    { label: "Open POs", count: openPos, color: "#2563eb" },
    { label: "Pending PRs", count: pendingPrs, color: "#d97706" },
  ];

  const alerts = [
    pendingPrs > 0 && {
      id: "pr",
      tone: "warning" as const,
      title: `${pendingPrs} PR${pendingPrs === 1 ? "" : "s"} pending approval`,
      detail: recentPrs.filter((p) => p.status === "Pending Approval").map((p) => p.prNumber).join(", ") || "Review requisitions",
      href: "/purchase-stores/procurement/requisitions",
    },
    pendingInvoices > 0 && {
      id: "invoice",
      tone: "danger" as const,
      title: `${pendingInvoices} invoice${pendingInvoices === 1 ? "" : "s"} pending match on POs`,
      detail: "Pending 3-way verification",
      href: "/purchase-stores/procurement/invoice-matching",
    },
    lowStockCount > 0 && {
      id: "stock",
      tone: "warning" as const,
      title: `${lowStockCount} item${lowStockCount === 1 ? "" : "s"} below reorder`,
      detail: lowStockItems.map((p) => p.productName).join(", ") || "Review stock levels",
      href: "/purchase-stores/inventory/stock",
    },
    dspCount > 0 && {
      id: "dsp",
      tone: "info" as const,
      title: `${dspCount} direct store purchase${dspCount === 1 ? "" : "s"} active`,
      detail: recentDsp[0]
        ? `${recentDsp[0].dspNumber} · ${recentDsp[0].department}`
        : "Spot buys",
      href: "/purchase-stores/procurement/dsp",
    },
  ].filter(Boolean) as {
    id: string;
    tone: "danger" | "warning" | "info";
    title: string;
    detail: string;
    href: string;
  }[];

  const statCards = [
    {
      label: "Pending PRs",
      value: pendingPrs,
      accent: "#d97706",
      icon: FileText,
      sublabel: "Awaiting approval",
    },
    {
      label: "Open POs",
      value: openPos,
      accent: "#2563eb",
      icon: ShoppingCart,
      sublabel: "Orders in flight",
    },
    {
      label: "3-Way Matches",
      value: pendingInvoices,
      accent: "#9333ea",
      icon: CheckCircle2,
      sublabel: "Pending verification",
    },
    {
      label: "Low Stock",
      value: lowStockCount,
      accent: "#dc2626",
      icon: AlertTriangle,
      sublabel: "Below reorder",
    },
  ];

  if (loading) {
    return (
      <ModulePageShell
        eyebrow="Purchase & Stores"
        title="Dashboard"
        description="Procurement, receiving, stock balances, and invoice matching for today."
        wrapChildren={false}
      >
        <div className="flex min-h-[40vh] items-center justify-center text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </ModulePageShell>
    );
  }

  return (
    <ModulePageShell
      eyebrow="Purchase & Stores"
      title="Dashboard"
      description="Procurement, receiving, stock balances, and invoice matching for today."
      wrapChildren={false}
    >
      <div className="min-w-0 space-y-4 sm:space-y-6 lg:space-y-8">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
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
                <p className="mt-1.5 truncate text-lg font-bold tracking-tight text-slate-900 sm:mt-2 sm:text-2xl">
                  {stat.value}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-slate-500 sm:text-xs">
                  {stat.sublabel}
                </p>
              </Card>
            );
          })}
        </div>

        {alerts.length > 0 && (
          <Card className="min-w-0">
            <CardHeader
              title="Needs attention"
              subtitle={`${alerts.length} item${alerts.length === 1 ? "" : "s"} to review`}
            />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {alerts.map((alert) => (
                <Link
                  key={alert.id}
                  href={alert.href}
                  className={cn(
                    "block min-w-0 rounded-lg border p-3 transition hover:shadow-sm",
                    alert.tone === "danger" && "border-red-200 bg-red-50 text-red-900",
                    alert.tone === "warning" && "border-amber-200 bg-amber-50 text-amber-950",
                    alert.tone === "info" && "border-emerald-200 bg-emerald-50 text-emerald-950",
                  )}
                >
                  <p className="text-sm font-semibold leading-snug">{alert.title}</p>
                  <p className="mt-0.5 truncate text-xs opacity-80">{alert.detail}</p>
                </Link>
              ))}
            </div>
          </Card>
        )}

        <Card className="min-w-0">
          <CardHeader title="Quick actions" subtitle="Procurement shortcuts" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/60 p-3 transition hover:border-emerald-300 hover:bg-emerald-50/60"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 ring-1 ring-slate-200">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{link.label}</p>
                    <p className="truncate text-xs text-slate-500">{link.hint}</p>
                  </span>
                </Link>
              );
            })}
          </div>
        </Card>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 lg:gap-8">
          <Card className="flex h-full min-w-0 flex-col">
            <CardHeader
              title="Purchase requisitions"
              subtitle={`${pendingPrs} pending approval`}
              action={
                <Link href="/purchase-stores/procurement/requisitions">
                  <Button type="button" size="sm" variant="outline">
                    Open PRs
                  </Button>
                </Link>
              }
            />
            <ul className="flex flex-1 flex-col divide-y divide-slate-100">
              {recentPrs.map((pr) => (
                <li
                  key={pr.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{pr.prNumber}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {pr.department} · ₹{pr.estimatedAmount.toLocaleString("en-IN")} · {pr.requestedBy}
                    </p>
                  </div>
                  <Pill status={pr.status} />
                </li>
              ))}
              {recentPrs.length === 0 && (
                <li className="py-6 text-center text-sm text-slate-500">No requisitions yet</li>
              )}
            </ul>
          </Card>

          <Card className="flex h-full min-w-0 flex-col">
            <CardHeader
              title="Purchase orders"
              subtitle={`${openPos} open orders`}
              action={
                <Link href="/purchase-stores/procurement/orders">
                  <Button type="button" size="sm" variant="outline">
                    Open POs
                  </Button>
                </Link>
              }
            />
            <ul className="flex flex-1 flex-col divide-y divide-slate-100">
              {recentPos.map((po) => (
                <li
                  key={po.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{po.poNumber}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {po.vendorName} · ₹{po.totalAmount.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <Pill status={po.status} />
                </li>
              ))}
              {recentPos.length === 0 && (
                <li className="py-6 text-center text-sm text-slate-500">No purchase orders yet</li>
              )}
            </ul>
          </Card>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8">
          <Card className="flex h-full min-w-0 flex-col border-amber-200/80 bg-amber-50/40">
            <CardHeader
              title="Direct store purchases"
              subtitle={`${dspCount} active DSP`}
              action={
                <Link
                  href="/purchase-stores/procurement/dsp"
                  className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 hover:underline"
                >
                  Manage
                  <ArrowRight className="h-3 w-3" />
                </Link>
              }
            />
            <ul className="flex flex-1 flex-col space-y-2">
              {recentDsp.map((dsp) => (
                <li
                  key={dsp.id}
                  className="rounded-lg border border-amber-100 bg-white p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {dsp.dspNumber}
                        <span className="font-normal text-slate-500"> · {dsp.department}</span>
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        {dsp.vendorName} · ₹{dsp.totalAmount.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-amber-800">
                      <Zap className="h-3.5 w-3.5" />
                      {dsp.status}
                    </span>
                  </div>
                </li>
              ))}
              {recentDsp.length === 0 && (
                <li className="py-6 text-center text-sm text-slate-500">No direct purchases yet</li>
              )}
            </ul>
          </Card>

          <Card className="flex h-full min-w-0 flex-col">
            <CardHeader
              title="Stock health"
              subtitle="Inventory overview"
              action={
                <Link
                  href="/purchase-stores/inventory/stock"
                  className="text-xs font-medium text-emerald-700 hover:underline"
                >
                  View stock
                </Link>
              }
            />
            <div className="mb-4 flex items-center gap-3">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="#15803d"
                    strokeWidth="3"
                    strokeDasharray={`${stockHealthPct} ${100 - stockHealthPct}`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-sm font-bold text-slate-900">{stockHealthPct}%</span>
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold tracking-tight text-slate-900">
                  {Math.max(productCount - lowStockCount, 0)} / {productCount}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">SKUs at healthy levels</p>
              </div>
            </div>
            <div className="mt-auto space-y-2">
              {stockBreakdown.map((row) => (
                <div key={row.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-600">{row.label}</span>
                    <span className="font-medium text-slate-900">{row.count}</span>
                  </div>
                  <ProgressBar
                    value={row.count}
                    max={Math.max(productCount, openPos, pendingPrs, 1)}
                    color={row.color}
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card className="flex h-full min-w-0 flex-col">
            <CardHeader
              title="Stock & vendors"
              subtitle={`${activeContracts} contracts · ${supplierCount} vendors`}
              action={
                <Link
                  href="/purchase-stores/masters/products"
                  className="text-xs font-medium text-emerald-700 hover:underline"
                >
                  Products
                </Link>
              }
            />
            <ul className="flex flex-1 flex-col divide-y divide-slate-100">
              {stockPreview.map((prod) => {
                const low = (prod.parStock ?? 0) - 20 < (prod.reorderLevel ?? 0);
                return (
                  <li
                    key={prod.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{prod.productName}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {prod.productCode} · Par {prod.parStock} {prod.unit}
                      </p>
                    </div>
                    <Pill status={low ? "Low Stock Alert" : "Active"} />
                  </li>
                );
              })}
              {stockPreview.length === 0 && (
                <li className="flex items-center gap-2 py-6 text-sm text-slate-500">
                  <Package className="h-4 w-4" />
                  No products loaded
                </li>
              )}
            </ul>
          </Card>
        </div>
      </div>
    </ModulePageShell>
  );
}
