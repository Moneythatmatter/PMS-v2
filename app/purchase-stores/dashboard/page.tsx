"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Bell,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Package,
  ShoppingCart,
  Users,
  Warehouse,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ModulePageShell } from "@/components/pms";
import { StatMiniCard } from "@/components/frontoffice/ui";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils";
import { INITIAL_PURCHASE_REQUISITIONS } from "@/app/data/purchaseRequisitionsData";
import { INITIAL_PO_RECORDS } from "@/app/data/purchaseOrdersData";
import { INITIAL_DSP_RECORDS } from "@/app/data/dspData";
import { INITIAL_INVOICE_RECORDS } from "@/app/data/invoiceVerificationData";
import { INITIAL_CONTRACT_RECORDS } from "@/app/data/contractsData";
import { INITIAL_PRODUCTS_DATA, SUPPLIER_MASTER_LIST } from "@/app/data/productMasterData";

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
    label: "QC Inspection",
    href: "/purchase-stores/receiving/inspection",
    icon: CheckCircle2,
    hint: "Quality checks",
  },
  {
    label: "Stock Ledger",
    href: "/purchase-stores/inventory/ledger",
    icon: Boxes,
    hint: "Balances",
  },
  {
    label: "Warehouses",
    href: "/purchase-stores/inventory/warehouses",
    icon: Warehouse,
    hint: "Bins & stores",
  },
  {
    label: "3-Way Match",
    href: "/purchase-stores/procurement/invoice-matching",
    icon: Award,
    hint: "Invoice verify",
  },
  {
    label: "Vendors",
    href: "/purchase-stores/masters/suppliers",
    icon: Users,
    hint: "Supplier master",
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
  const pendingPrs = useMemo(
    () => INITIAL_PURCHASE_REQUISITIONS.filter((p) => p.status === "Pending Approval"),
    [],
  );
  const openPos = INITIAL_PO_RECORDS;
  const pendingInvoices = useMemo(
    () => INITIAL_INVOICE_RECORDS.filter((i) => i.status === "Pending Verification"),
    [],
  );
  const activeContracts = useMemo(
    () => INITIAL_CONTRACT_RECORDS.filter((c) => c.status === "Active"),
    [],
  );
  const lowStockItems = useMemo(
    () =>
      INITIAL_PRODUCTS_DATA.filter((p) => p.parStock - 20 < p.reorderLevel).slice(0, 5),
    [],
  );
  const recentPrs = INITIAL_PURCHASE_REQUISITIONS.slice(0, 6);
  const recentPos = openPos.slice(0, 6);
  const recentDsp = INITIAL_DSP_RECORDS.slice(0, 4);
  const stockPreview = INITIAL_PRODUCTS_DATA.slice(0, 5);

  const totalStockValue = 485200;
  const stockHealthPct = Math.round(
    ((INITIAL_PRODUCTS_DATA.length - lowStockItems.length) / Math.max(INITIAL_PRODUCTS_DATA.length, 1)) * 100,
  );

  const stockBreakdown = [
    { label: "Healthy SKUs", count: INITIAL_PRODUCTS_DATA.length - lowStockItems.length, color: "#15803d" },
    { label: "Low stock", count: lowStockItems.length, color: "#dc2626" },
    { label: "Open POs", count: openPos.length, color: "#2563eb" },
    { label: "Pending PRs", count: pendingPrs.length, color: "#d97706" },
  ];

  const alerts = [
    pendingPrs.length > 0 && {
      id: "pr",
      tone: "warning" as const,
      title: `${pendingPrs.length} PR${pendingPrs.length === 1 ? "" : "s"} pending approval`,
      detail: pendingPrs.map((p) => p.prNumber).join(", "),
      href: "/purchase-stores/procurement/requisitions",
    },
    pendingInvoices.length > 0 && {
      id: "invoice",
      tone: "danger" as const,
      title: `${pendingInvoices.length} invoice${pendingInvoices.length === 1 ? "" : "s"} need 3-way match`,
      detail: pendingInvoices.map((i) => i.invoiceNumber).join(", "),
      href: "/purchase-stores/procurement/invoice-matching",
    },
    lowStockItems.length > 0 && {
      id: "stock",
      tone: "warning" as const,
      title: `${lowStockItems.length} item${lowStockItems.length === 1 ? "" : "s"} below reorder`,
      detail: lowStockItems.map((p) => p.productName).join(", "),
      href: "/purchase-stores/inventory/ledger",
    },
    INITIAL_DSP_RECORDS.length > 0 && {
      id: "dsp",
      tone: "info" as const,
      title: `${INITIAL_DSP_RECORDS.length} direct store purchase${INITIAL_DSP_RECORDS.length === 1 ? "" : "s"} active`,
      detail: INITIAL_DSP_RECORDS[0]
        ? `${INITIAL_DSP_RECORDS[0].dspNumber} · ${INITIAL_DSP_RECORDS[0].department}`
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

  return (
    <ModulePageShell
      eyebrow="Purchase & Stores"
      title="Dashboard"
      description="Procurement, receiving, stock balances, and invoice matching for today."
      wrapChildren={false}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatMiniCard
          label="Pending PRs"
          value={pendingPrs.length}
          accent="#d97706"
          icon={FileText}
          sublabel="Awaiting approval"
        />
        <StatMiniCard
          label="Open POs"
          value={openPos.length}
          accent="#2563eb"
          icon={ShoppingCart}
          sublabel="Orders in flight"
        />
        <StatMiniCard
          label="3-Way Matches"
          value={pendingInvoices.length}
          accent="#9333ea"
          icon={CheckCircle2}
          sublabel="Pending verification"
        />
        <StatMiniCard
          label="Low Stock"
          value={lowStockItems.length}
          accent="#dc2626"
          icon={AlertTriangle}
          sublabel="Below reorder"
        />
      </div>

      {alerts.length > 0 && (
        <section className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Bell className="h-3.5 w-3.5 text-amber-600" />
              <h2 className="text-sm font-semibold text-slate-900">Needs attention</h2>
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                {alerts.length}
              </span>
            </div>
            <Link
              href="/purchase-stores/approvals"
              className="text-xs font-medium text-emerald-700 hover:underline"
            >
              Approval center
            </Link>
          </div>
          <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
            {alerts.map((alert) => (
              <Link
                key={alert.id}
                href={alert.href}
                className={cn(
                  "rounded-lg border px-2.5 py-2 transition hover:shadow-sm",
                  alert.tone === "danger" && "border-red-200 bg-red-50 text-red-900",
                  alert.tone === "warning" && "border-amber-200 bg-amber-50 text-amber-950",
                  alert.tone === "info" && "border-emerald-200 bg-emerald-50 text-emerald-950",
                )}
              >
                <p className="text-xs font-semibold leading-snug">{alert.title}</p>
                <p className="mt-0.5 truncate text-[11px] opacity-80">{alert.detail}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Quick actions</h2>
          <p className="text-[11px] text-slate-500">Procurement shortcuts</p>
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 xl:grid-cols-8">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-2 transition hover:border-emerald-300 hover:bg-emerald-50/60"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-emerald-700 ring-1 ring-slate-200">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-900">{link.label}</p>
                  <p className="truncate text-[10px] text-slate-500">{link.hint}</p>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <section className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Purchase requisitions</h2>
              <p className="text-[11px] text-slate-500">{pendingPrs.length} pending approval</p>
            </div>
            <Link href="/purchase-stores/procurement/requisitions">
              <Button type="button" size="sm" variant="outline">
                Open PRs
              </Button>
            </Link>
          </div>
          <ul className="flex flex-1 flex-col divide-y divide-slate-100">
            {recentPrs.map((pr) => (
              <li
                key={pr.id}
                className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{pr.prNumber}</p>
                  <p className="truncate text-[11px] text-slate-500">
                    {pr.department} · ₹{pr.estimatedAmount.toLocaleString("en-IN")} · {pr.requestedBy}
                  </p>
                </div>
                <Pill status={pr.status} />
              </li>
            ))}
          </ul>
        </section>

        <section className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Purchase orders</h2>
              <p className="text-[11px] text-slate-500">{openPos.length} open orders</p>
            </div>
            <Link href="/purchase-stores/procurement/orders">
              <Button type="button" size="sm" variant="outline">
                Open POs
              </Button>
            </Link>
          </div>
          <ul className="flex flex-1 flex-col divide-y divide-slate-100">
            {recentPos.map((po) => (
              <li
                key={po.id}
                className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{po.poNumber}</p>
                  <p className="truncate text-[11px] text-slate-500">
                    {po.vendorName} · ₹{po.totalAmount.toLocaleString("en-IN")}
                  </p>
                </div>
                <Pill status={po.status} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <section className="flex h-full flex-col rounded-xl border border-amber-200/80 bg-amber-50/40 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Direct store purchases</h2>
              <p className="text-[11px] text-slate-500">{INITIAL_DSP_RECORDS.length} active DSP</p>
            </div>
            <Link
              href="/purchase-stores/procurement/dsp"
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 hover:underline"
            >
              Manage
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="flex flex-1 flex-col space-y-1.5">
            {recentDsp.map((dsp) => (
              <li
                key={dsp.id}
                className="rounded-lg border border-amber-100 bg-white px-2.5 py-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {dsp.dspNumber}
                      <span className="font-normal text-slate-500"> · {dsp.department}</span>
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-400">
                      {dsp.vendorName} · ₹{dsp.totalAmount.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-amber-800">
                    <Zap className="h-3 w-3" />
                    {dsp.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Stock health</h2>
              <p className="text-[11px] text-slate-500">
                ₹{totalStockValue.toLocaleString("en-IN")} inventory value
              </p>
            </div>
            <Link
              href="/purchase-stores/inventory/ledger"
              className="text-xs font-medium text-emerald-700 hover:underline"
            >
              Ledger
            </Link>
          </div>
          <div className="mb-3 flex items-center gap-3">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
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
              <span className="absolute text-xs font-bold text-slate-900">{stockHealthPct}%</span>
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">
                {INITIAL_PRODUCTS_DATA.length - lowStockItems.length} / {INITIAL_PRODUCTS_DATA.length}
              </p>
              <p className="text-[11px] text-slate-500">SKUs at healthy levels</p>
            </div>
          </div>
          <div className="mt-auto space-y-1.5">
            {stockBreakdown.map((row) => (
              <div key={row.label}>
                <div className="mb-0.5 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">{row.label}</span>
                  <span className="font-medium text-slate-900">{row.count}</span>
                </div>
                <ProgressBar
                  value={row.count}
                  max={Math.max(INITIAL_PRODUCTS_DATA.length, openPos.length, pendingPrs.length, 1)}
                  color={row.color}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Stock & vendors</h2>
              <p className="text-[11px] text-slate-500">
                {activeContracts.length} contracts · {SUPPLIER_MASTER_LIST.length} suppliers
              </p>
            </div>
            <Link
              href="/purchase-stores/masters/products"
              className="text-xs font-medium text-emerald-700 hover:underline"
            >
              Products
            </Link>
          </div>
          <ul className="flex flex-1 flex-col divide-y divide-slate-100">
            {stockPreview.map((prod) => {
              const low = prod.parStock - 20 < prod.reorderLevel;
              return (
                <li
                  key={prod.id}
                  className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{prod.productName}</p>
                    <p className="truncate text-[11px] text-slate-500">
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
        </section>
      </div>
    </ModulePageShell>
  );
}
