"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Banknote,
  CalendarClock,
  ChefHat,
  CreditCard,
  ExternalLink,
  LayoutGrid,
  Printer,
  Receipt,
  ShoppingBag,
  Smartphone,
  Store,
  User,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { formatINRExact } from "@/app/data/foodbeverages/ops";
import {
  posService,
  type FbBillPayment,
  type FbBillTaxSummary,
  type FbPosBill,
} from "@/services/food-beverages";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Bone } from "@/components/foodbeverages/FbSkeletons";
import { billRoundOff, taxLineLabel } from "@/lib/food-beverages/print-slips";
import { cn } from "@/lib/utils";

type Row = Record<string, unknown>;

type Details = {
  items: Row[];
  kots: Row[];
  taxSummary?: FbBillTaxSummary;
  payments: FbBillPayment[];
  paidAmount: number;
};

function formatWhen(value: unknown) {
  if (!value) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

const titleCase = (s: string) =>
  s
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const STATUS_STYLE: Record<string, { pill: string; hero: string; bar: string }> = {
  PAID: {
    pill: "bg-emerald-600 text-white",
    hero: "from-emerald-50 to-white border-emerald-200",
    bar: "bg-emerald-500",
  },
  PARTIALLY_PAID: {
    pill: "bg-amber-500 text-white",
    hero: "from-amber-50 to-white border-amber-200",
    bar: "bg-amber-500",
  },
  UNPAID: {
    pill: "bg-slate-800 text-white",
    hero: "from-slate-50 to-white border-slate-200",
    bar: "bg-slate-400",
  },
};

const KOT_STYLE: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-700",
  PREPARING: "bg-amber-100 text-amber-800",
  READY: "bg-emerald-100 text-emerald-800",
  SERVED: "bg-sky-100 text-sky-800",
  CANCELLED: "bg-red-50 text-red-600 line-through",
};

function paymentIcon(method: string): LucideIcon {
  const m = method.toUpperCase();
  if (m.includes("CARD")) return CreditCard;
  if (m.includes("UPI")) return Smartphone;
  if (m.includes("ROOM") || m.includes("FOLIO")) return Wallet;
  return Banknote;
}

function Meta({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value?: string | null }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className={cn("truncate text-sm font-semibold", value ? "text-slate-800" : "text-slate-300")}>
          {value || "Not yet"}
        </p>
      </div>
    </div>
  );
}

function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{children}</h3>
      {aside}
    </div>
  );
}

type Props = {
  bill: FbPosBill;
  outletName: string;
  orderHref: string;
  onClose: () => void;
  onReprint: () => void;
  reprinting?: boolean;
};

export function FbBillDetailDrawer({
  bill,
  outletName,
  orderHref,
  onClose,
  onReprint,
  reprinting = false,
}: Props) {
  const [details, setDetails] = useState<Details | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    posService
      .getOrderDetails(bill.orderId)
      .then((data) => {
        if (cancelled) return;
        setDetails({
          items: data.items as Row[],
          kots: data.kots as Row[],
          taxSummary: data.taxSummary,
          payments: data.payments ?? [],
          paidAmount: Number(data.paidAmount ?? 0),
        });
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load bill");
      });
    return () => {
      cancelled = true;
    };
  }, [bill.orderId]);

  const status = bill.paymentStatus.toUpperCase();
  const isPaid = status === "PAID";
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.UNPAID;
  const taxLines = details?.taxSummary?.lines ?? [];
  const roundOff = billRoundOff(bill.subtotal, bill.discount, bill.tax, bill.total);
  const taxIncluded = Boolean(details?.taxSummary?.included);
  const paid = isPaid && details && !details.payments.length ? bill.total : details?.paidAmount ?? 0;
  const balance = Math.max(0, Math.round((bill.total - paid) * 100) / 100);
  const paidPct = bill.total > 0 ? Math.min(100, Math.round((paid / bill.total) * 100)) : 0;
  const activeItems = details?.items.filter((r) => String(r.status ?? "ACTIVE").toUpperCase() === "ACTIVE") ?? [];
  const itemCount = activeItems.reduce((s, r) => s + Number(r.quantity ?? 1), 0);

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title={bill.billNo}
      subtitle={`${bill.orderNo} · ${bill.orderType}`}
      icon={
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
          <Receipt className="h-5 w-5" />
        </span>
      }
      maxWidth="md"
      footer={
        <div className="flex w-full justify-end gap-2">
          <Link href={orderHref} className="shrink-0">
            <Button type="button" variant="outline" className="gap-1.5 whitespace-nowrap">
              <ExternalLink className="h-4 w-4" />
              View order
            </Button>
          </Link>
          <Button
            type="button"
            className="gap-1.5 whitespace-nowrap bg-emerald-700 px-5 hover:bg-emerald-800"
            disabled={reprinting}
            onClick={onReprint}
          >
            <Printer className="h-4 w-4" />
            {reprinting ? "Printing…" : "Reprint bill"}
          </Button>
        </div>
      }
    >
      <section className={cn("rounded-2xl border bg-gradient-to-br p-4", style.hero)}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Bill total</p>
            <p className="mt-0.5 font-mono text-3xl font-black tracking-tight text-slate-900">
              {formatINRExact(bill.total)}
            </p>
          </div>
          <span className={cn("rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide shadow-sm", style.pill)}>
            {titleCase(bill.paymentStatus)}
          </span>
        </div>
        <div className="mt-4">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/70">
            <div className={cn("h-full rounded-full transition-all", style.bar)} style={{ width: `${paidPct}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between text-xs">
            <span className="text-slate-500">
              Paid <span className="font-mono font-semibold text-slate-800">{formatINRExact(paid)}</span>
            </span>
            {isPaid ? (
              <span className="font-semibold text-emerald-700">Fully settled</span>
            ) : (
              <span className="text-slate-500">
                Due <span className="font-mono font-bold text-amber-700">{formatINRExact(balance)}</span>
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-x-4 gap-y-3.5 rounded-2xl border border-slate-200 bg-white p-4">
        <Meta icon={Store} label="Outlet" value={outletName} />
        <Meta icon={ShoppingBag} label="Order type" value={bill.orderType} />
        <Meta
          icon={LayoutGrid}
          label={bill.orderType === "Takeaway" ? "Pickup" : "Table / Ref"}
          value={bill.ref}
        />
        <Meta icon={User} label="Guest" value={bill.guest} />
        <Meta icon={ChefHat} label="Server" value={bill.server} />
        <Meta icon={CalendarClock} label="Created" value={formatWhen(bill.createdAt)} />
        <Meta icon={Printer} label="Printed" value={formatWhen(bill.billPrintedAt)} />
      </section>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : !details ? (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex justify-between">
              <Bone className={cn("h-4", i % 2 ? "w-28" : "w-40")} />
              <Bone className="h-4 w-14" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="px-4 pt-4">
              <SectionTitle
                aside={
                  <span className="text-[11px] font-medium text-slate-400">
                    {itemCount} item{itemCount === 1 ? "" : "s"}
                  </span>
                }
              >
                Items
              </SectionTitle>
            </div>
            <ul className="px-4">
              {details.items.length === 0 ? (
                <li className="py-4 text-center text-sm text-slate-400">No items</li>
              ) : (
                details.items.map((row, idx) => {
                  const cancelled = String(row.status ?? "ACTIVE").toUpperCase() !== "ACTIVE";
                  const qty = Number(row.quantity ?? 1);
                  const price = Number(row.unitPrice ?? 0);
                  return (
                    <li
                      key={String(row.id ?? idx)}
                      className="flex items-center gap-3 border-b border-dashed border-slate-200 py-2.5 last:border-0"
                    >
                      <span
                        className={cn(
                          "flex h-7 min-w-7 shrink-0 items-center justify-center rounded-md px-1.5 font-mono text-xs font-bold",
                          cancelled ? "bg-slate-100 text-slate-400" : "bg-emerald-50 text-emerald-800",
                        )}
                      >
                        {qty}×
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={cn("truncate text-sm font-semibold text-slate-800", cancelled && "text-slate-400 line-through")}>
                          {String(row.name ?? "Item")}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {formatINRExact(price)} each
                          {cancelled && <span className="ml-1 font-semibold text-red-500">· Cancelled</span>}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 font-mono text-sm font-bold text-slate-900",
                          cancelled && "text-slate-400 line-through",
                        )}
                      >
                        {formatINRExact(qty * price)}
                      </span>
                    </li>
                  );
                })
              )}
            </ul>

            <div className="mt-1 space-y-1.5 border-t border-slate-100 bg-slate-50/70 px-4 py-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>{taxIncluded ? "Taxable value" : "Subtotal"}</span>
                <span className="font-mono font-semibold text-slate-800">{formatINRExact(bill.subtotal)}</span>
              </div>
              {bill.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <span className="font-mono font-semibold">− {formatINRExact(bill.discount)}</span>
                </div>
              )}
              {taxLines.length > 0
                ? taxLines.map((line) => (
                    <div key={`${line.code}-${line.rate}`} className="flex justify-between text-slate-500">
                      <span className="pl-2">{taxLineLabel(line)}</span>
                      <span className="font-mono">{formatINRExact(line.amount)}</span>
                    </div>
                  ))
                : bill.tax > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span className="pl-2">Tax</span>
                      <span className="font-mono">{formatINRExact(bill.tax)}</span>
                    </div>
                  )}
              {taxIncluded && bill.tax > 0 && (
                <p className="pl-2 text-[11px] text-slate-400">Included in menu prices</p>
              )}
              {roundOff !== 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Round off</span>
                  <span className="font-mono">
                    {roundOff > 0 ? "+" : "−"} {formatINRExact(Math.abs(roundOff))}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between bg-slate-900 px-4 py-3 text-white">
              <span className="text-sm font-semibold">Grand total</span>
              <span className="font-mono text-lg font-black">{formatINRExact(bill.total)}</span>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <SectionTitle>Payments</SectionTitle>
            {details.payments.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 px-3 py-3 text-sm text-slate-500">
                {isPaid ? <Wallet className="h-4 w-4 text-emerald-600" /> : <Banknote className="h-4 w-4 text-slate-400" />}
                {isPaid ? "Settled — posted to the guest folio" : "No payments collected yet"}
              </div>
            ) : (
              <ul className="space-y-2">
                {details.payments.map((p) => {
                  const Icon = paymentIcon(p.method);
                  return (
                    <li key={p.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-2xs">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800">{titleCase(p.method || "Payment")}</p>
                        <p className="text-[11px] text-slate-400">{formatWhen(p.at) ?? "—"}</p>
                      </div>
                      <span className="font-mono text-sm font-bold text-emerald-700">{formatINRExact(p.amount)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {details.kots.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <SectionTitle>Kitchen tickets</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {details.kots.map((kot, idx) => {
                  const kotStatus = String(kot.status ?? "").toUpperCase();
                  return (
                    <div
                      key={String(kot.id ?? idx)}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5"
                      title={formatWhen(kot.createdAt) ?? undefined}
                    >
                      <span className="text-xs font-bold text-slate-800">{String(kot.kotNumber ?? kot.id)}</span>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                          KOT_STYLE[kotStatus] ?? "bg-slate-100 text-slate-600",
                        )}
                      >
                        {titleCase(kotStatus || "—")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </Drawer>
  );
}
