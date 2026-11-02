"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  IndianRupee,
  Loader2,
  Receipt,
  RotateCcw,
  Wallet,
} from "lucide-react";
import { formatINR } from "@/app/data/foodbeverages/ops";
import { Button } from "@/components/ui/Button";
import { ModulePageShell } from "@/components/pms";
import { AlertBanner, ConfirmModal } from "@/components/frontoffice/ui";
import { FbOutletSelect } from "@/components/foodbeverages/FbOutletSelect";
import { useSelectedFbOutlet } from "@/components/foodbeverages/FbCashierView";
import { cn } from "@/lib/utils";
import {
  fbDayCloseService,
  type FbDayCloseStatus,
  type FbOutletDayClosing,
} from "@/services/food-beverages";
import { useFbOutlets } from "@/services/food-beverages/useFbOutlets";

function dateLabel(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return iso.length === 10
    ? d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export function FbDayCloseView() {
  const { outlets, loading: outletsLoading } = useFbOutlets(["restaurant", "cafe", "bar"]);
  const [outletId, setOutletId] = useSelectedFbOutlet(outlets);
  const [status, setStatus] = useState<FbDayCloseStatus | null>(null);
  const [history, setHistory] = useState<FbOutletDayClosing[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!outletId) return;
    let cancelled = false;
    Promise.all([fbDayCloseService.status(outletId), fbDayCloseService.history(outletId).catch(() => [])])
      .then(([s, h]) => {
        if (cancelled) return;
        setStatus(s);
        setHistory(h);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load day close");
      });
    return () => {
      cancelled = true;
    };
  }, [outletId, reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);
  const current = status && status.outlet.id === outletId ? status : null;

  const runDayClose = async () => {
    setConfirmOpen(false);
    setRunning(true);
    try {
      await fbDayCloseService.run(outletId);
      setToast(`Day close completed for ${current?.outlet.name ?? "outlet"} (${dateLabel(current?.businessDate)}).`);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run day close");
    } finally {
      setRunning(false);
    }
  };

  const shell = (children: ReactNode) => (
    <ModulePageShell
      eyebrow={current ? `Food & Beverages · ${current.outlet.name}` : "Restaurants"}
      title="Day Close"
      description="Close the outlet for the hotel business date once every shift, order and bill is settled."
      toast={toast}
      onDismissToast={() => setToast(null)}
      wrapChildren={false}
      beforeFilters={<FbOutletSelect outlets={outlets} value={outletId} onChange={setOutletId} />}
      actionButtons={
        current && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
              <CalendarClock className="h-3.5 w-3.5 text-emerald-600" />
              Business Date: {dateLabel(current.businessDate)}
              {current.closed && (
                <span className="ml-1 rounded bg-emerald-50 px-1 py-0.5 text-[9px] font-semibold uppercase text-emerald-700">
                  Closed
                </span>
              )}
            </div>
            <Button type="button" variant="outline" size="sm" className="gap-1 text-xs font-semibold" onClick={reload}>
              <RotateCcw className="h-3 w-3" />
              Refresh
            </Button>
            {!current.closed && (
              <Button
                size="sm"
                className="bg-emerald-700 text-xs font-semibold hover:bg-emerald-800"
                disabled={!current.canClose || current.blockers > 0 || running}
                onClick={() => setConfirmOpen(true)}
              >
                {running && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
                Run Day Close
              </Button>
            )}
          </div>
        )
      }
      stats={
        current
          ? [
              { label: "Business Date", value: dateLabel(current.businessDate), sublabel: "Hotel business day", icon: CalendarClock },
              {
                label: "Blocking Checks",
                value: current.blockers,
                accent: current.blockers ? "#f59e0b" : "#15803d",
                sublabel: current.blockers ? "Resolve before closing" : "None",
                icon: ClipboardList,
              },
              {
                label: "Net Sales",
                value: formatINR(current.totals.netSales),
                accent: "#15803d",
                sublabel: `${current.totals.billsCount} bill${current.totals.billsCount === 1 ? "" : "s"} raised`,
                icon: IndianRupee,
              },
              {
                label: "Collected",
                value: formatINR(current.totals.collections.net),
                accent: "#0f766e",
                sublabel: "Payments taken today",
                icon: Wallet,
              },
            ]
          : []
      }
    >
      {error && <AlertBanner variant="error" message={error} onDismiss={() => setError(null)} />}
      {children}
    </ModulePageShell>
  );

  if (outletsLoading) return shell(<p className="text-sm text-slate-500">Loading…</p>);
  if (!outlets.length) return shell(<p className="text-sm text-slate-500">No restaurant, cafe or bar outlets yet.</p>);
  if (!current) return shell(error ? null : <p className="text-sm text-slate-500">Loading…</p>);

  const t = current.totals;
  const blockers = current.checks.filter((c) => c.mandatory && !c.passed);

  return shell(
    <>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          {current.closed && current.closing && (
            <AlertBanner
              variant="success"
              message={`${current.outlet.name} is closed for ${dateLabel(current.businessDate)} by ${current.closing.closedByName ?? "—"} at ${dateLabel(current.closing.closedAt)}. New shifts open after Night Audit moves the business date.`}
            />
          )}
          {!current.closed && !current.canClose && (
            <AlertBanner variant="error" message="The business date is ahead of today. Run day close on that date." />
          )}
          {!current.closed && blockers.length > 0 && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <div className="mb-2 flex items-center gap-2 font-bold uppercase tracking-wide">
                <AlertTriangle className="h-4 w-4" />
                Cannot Run Day Close
              </div>
              <ul className="space-y-1 text-xs">
                {blockers.map((b) => (
                  <li key={b.id}>
                    {b.label}: {b.detail}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Closing Checklist</h3>
              <span
                className={cn(
                  "rounded px-2 py-0.5 text-[10px] font-bold uppercase",
                  blockers.length ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700",
                )}
              >
                {blockers.length ? `${blockers.length} remaining` : "Ready"}
              </span>
            </div>
            <ul className="divide-y divide-slate-100">
              {current.checks.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="flex gap-3">
                    {item.passed ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                        {item.mandatory && (
                          <span className="rounded bg-red-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red-600">
                            Mandatory
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{item.detail}</p>
                    </div>
                  </div>
                  {!item.passed && item.href && (
                    <Link href={item.href} className="shrink-0 text-[11px] font-semibold text-emerald-700 hover:underline">
                      Resolve
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {current.unsettledShifts.length > 0 && (
            <ListCard title="Cashier Shifts Not Closed">
              {current.unsettledShifts.map((s) => (
                <Row
                  key={s.id}
                  title={`${s.cashierName} · ${s.shiftName}`}
                  sub={`Opened ${dateLabel(s.openedAt)} · ${s.status}`}
                  href={s.status === "Pending Approval" ? "/food-beverages/restaurants/cashier/history" : "/food-beverages/restaurants/cashier"}
                  action={s.status === "Pending Approval" ? "Review" : "Close shift"}
                />
              ))}
            </ListCard>
          )}

          {current.openOrders.length > 0 && (
            <ListCard title="Open Orders">
              {current.openOrders.map((o) => (
                <Row
                  key={o.id}
                  title={`${o.orderNo} · ${o.type}${o.ref ? ` · ${o.ref}` : ""}`}
                  sub={`${o.status} · ${formatINR(o.amount)}`}
                  href="/food-beverages/restaurants/orders"
                  action="Settle"
                />
              ))}
            </ListCard>
          )}

          {current.unpaidBills.length > 0 && (
            <ListCard title="Unpaid Bills">
              {current.unpaidBills.map((b) => (
                <Row
                  key={b.id}
                  title={b.billNo}
                  sub={`${b.paymentStatus.replace("_", " ")} · ${formatINR(b.total)}`}
                  href="/food-beverages/restaurants/bills"
                  action="Collect"
                />
              ))}
            </ListCard>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-900">
              Sales · {dateLabel(current.businessDate)}
            </h3>
            <ul className="space-y-2 text-sm">
              <SummaryLine icon={Receipt} label="Bills raised" value={String(t.billsCount)} />
              <SummaryLine icon={IndianRupee} label="Gross (before tax)" value={formatINR(t.grossSales)} />
              <SummaryLine icon={IndianRupee} label="Discount" value={formatINR(t.discount)} />
              <SummaryLine icon={IndianRupee} label="Tax" value={formatINR(t.tax)} />
              <SummaryLine icon={IndianRupee} label="Net sales" value={formatINR(t.netSales)} strong />
              <SummaryLine icon={IndianRupee} label="Charged to rooms" value={formatINR(t.roomCharges)} />
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-900">Collections by Method</h3>
            <ul className="space-y-2 text-sm">
              {t.collections.byMethod
                .filter((m) => m.amount !== 0 || m.method === "CASH")
                .map((m) => (
                  <SummaryLine key={m.method} icon={Wallet} label={m.label} value={formatINR(m.amount)} />
                ))}
              {t.collections.refunds > 0 && (
                <SummaryLine icon={Wallet} label="Refunds" value={`−${formatINR(t.collections.refunds)}`} />
              )}
              <SummaryLine icon={Wallet} label="Net collected" value={formatINR(t.collections.net)} strong />
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-900">Recent Day Closes</h3>
            {history.length === 0 ? (
              <p className="text-xs text-slate-400">No day close recorded for this outlet yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100 text-xs">
                {history.slice(0, 10).map((h) => (
                  <li key={h.id} className="flex items-center justify-between gap-3 py-2">
                    <div>
                      <p className="font-semibold text-slate-900">{dateLabel(h.businessDate)}</p>
                      <p className="text-[11px] text-slate-500">
                        {h.closedByName ?? "—"} · {dateLabel(h.closedAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{formatINR(Number(h.netSales))}</p>
                      <p className="text-[11px] text-slate-500">Collected {formatINR(Number(h.collections))}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void runDayClose()}
        title="Run Day Close?"
        message={`This closes ${current.outlet.name} for ${dateLabel(current.businessDate)}. No new cashier shift can start here until Night Audit moves the business date.`}
        confirmLabel="Run Day Close"
      />
    </>,
  );
}

function ListCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-900">{title}</h3>
      <ul className="space-y-2">{children}</ul>
    </section>
  );
}

function Row({ title, sub, href, action }: { title: string; sub: string; href: string; action: string }) {
  return (
    <li className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-sm">
      <div>
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{sub}</p>
      </div>
      <Link href={href}>
        <Button size="sm" variant="outline" className="text-xs">
          {action}
        </Button>
      </Link>
    </li>
  );
}

function SummaryLine({
  icon: Icon,
  label,
  value,
  strong,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
      <span className="flex items-center gap-2 text-slate-600">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        {label}
      </span>
      <span className={cn("font-semibold text-slate-900", strong && "text-emerald-700")}>{value}</span>
    </li>
  );
}
