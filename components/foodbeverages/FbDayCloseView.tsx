"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Circle,
  ClipboardList,
  IndianRupee,
  LayoutGrid,
  Loader2,
  RotateCcw,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { formatINR } from "@/app/data/foodbeverages/ops";
import { currentUser } from "@/app/data";
import { Button } from "@/components/ui/Button";
import { ModulePageShell } from "@/components/pms";
import { AlertBanner, ConfirmModal } from "@/components/frontoffice/ui";
import { FbOutletSelect } from "@/components/foodbeverages/FbOutletSelect";
import { cn } from "@/lib/utils";
import {
  dayCloseService,
  fbCashierService,
  fbOrderService,
  liveTableService,
  type FbCashierShift,
  type FbOrder,
  type LiveTable,
} from "@/services/food-beverages";
import { useFbOutlets } from "@/services/food-beverages/useFbOutlets";

type CheckStatus = "done" | "pending" | "warning";

type ChecklistItem = {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
  mandatory: boolean;
  href?: string;
};

function businessDateLabel(d = new Date()) {
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isOpenTable(status: string) {
  const s = status.toLowerCase();
  return ["occupied", "seated", "dining", "dirty", "reserved", "open"].includes(s);
}

function isOpenOrder(status: string) {
  const s = status.toLowerCase();
  return !["settled", "served", "closed", "cancelled", "void", "voided", "rejected"].includes(s);
}

function isActiveKitchenOrder(status: string) {
  const s = status.toLowerCase();
  return ["pending", "preparing", "ready"].includes(s);
}

export function FbDayCloseView() {
  const { outlets } = useFbOutlets(["restaurant", "cafe", "bar"]);
  const [outletId, setOutletId] = useState("");
  const [tables, setTables] = useState<LiveTable[]>([]);
  const [orders, setOrders] = useState<FbOrder[]>([]);
  const [shifts, setShifts] = useState<FbCashierShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(-1);
  const [closedOutlets, setClosedOutlets] = useState<Record<string, string>>({});

  const bizDate = businessDateLabel();

  useEffect(() => {
    if (!outletId && outlets[0]?.id) setOutletId(outlets[0].id);
  }, [outlets, outletId]);

  const reload = useCallback(async () => {
    if (!outletId) return;
    setLoading(true);
    try {
      const [t, o, s] = await Promise.all([
        liveTableService.list(outletId),
        fbOrderService.list(outletId),
        fbCashierService.list(outletId),
      ]);
      setTables(t);
      setOrders(o);
      setShifts(s);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load day close data");
    } finally {
      setLoading(false);
    }
  }, [outletId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const openTables = useMemo(
    () => tables.filter((t) => isOpenTable(String(t.status ?? ""))),
    [tables],
  );
  const openOrders = useMemo(
    () => orders.filter((o) => isOpenOrder(String(o.status ?? ""))),
    [orders],
  );
  const openShifts = useMemo(
    () => shifts.filter((s) => String(s.status).toLowerCase() === "open"),
    [shifts],
  );
  const activeKitchenOrders = useMemo(
    () => orders.filter((o) => isActiveKitchenOrder(String(o.status ?? ""))),
    [orders],
  );
  const settledOrders = useMemo(
    () =>
      orders.filter((o) =>
        ["settled", "served", "closed"].includes(String(o.status ?? "").toLowerCase()),
      ),
    [orders],
  );
  const daySales = settledOrders.reduce((sum, o) => sum + Number(o.amount ?? 0), 0);
  const outletClosed = Boolean(closedOutlets[outletId]);

  const checklist: ChecklistItem[] = useMemo(
    () => [
      {
        id: "tables",
        label: "Open tables settled",
        status: openTables.length === 0 ? "done" : "warning",
        detail:
          openTables.length === 0
            ? "No active covers on the floor"
            : `${openTables.length} table${openTables.length === 1 ? "" : "s"} still open`,
        mandatory: true,
        href: "/food-beverages/restaurants/orders",
      },
      {
        id: "orders",
        label: "Open orders closed",
        status: openOrders.length === 0 ? "done" : "warning",
        detail:
          openOrders.length === 0
            ? "All orders settled or cancelled"
            : `${openOrders.length} order${openOrders.length === 1 ? "" : "s"} still open`,
        mandatory: true,
        href: "/food-beverages/restaurants/orders",
      },
      {
        id: "cashier",
        label: "All cashier shifts closed",
        status: openShifts.length === 0 ? "done" : "warning",
        detail:
          openShifts.length === 0
            ? "All shifts reconciled"
            : `${openShifts.length} shift${openShifts.length === 1 ? "" : "s"} still open`,
        mandatory: true,
        href: "/food-beverages/restaurants/cashier",
      },
      {
        id: "kitchen",
        label: "Kitchen orders cleared",
        status: activeKitchenOrders.length === 0 ? "done" : "warning",
        detail:
          activeKitchenOrders.length === 0
            ? "No pending kitchen orders"
            : `${activeKitchenOrders.length} order${activeKitchenOrders.length === 1 ? "" : "s"} still in kitchen`,
        mandatory: true,
        href: "/food-beverages/kitchen/orders",
      },
      {
        id: "close",
        label: "Day close posted",
        status: outletClosed ? "done" : "pending",
        detail: outletClosed
          ? `Closed for ${bizDate}`
          : "Available after mandatory checks pass",
        mandatory: false,
      },
    ],
    [
      openTables.length,
      openOrders.length,
      openShifts.length,
      activeKitchenOrders.length,
      outletClosed,
      bizDate,
    ],
  );

  const blockers = checklist.filter((c) => c.mandatory && c.status !== "done");
  const canClose = blockers.length === 0 && !outletClosed && !running;
  const doneCount = checklist.filter((c) => c.status === "done").length;
  const progressPercent = Math.round((doneCount / checklist.length) * 100);

  const steps = [
    "Checking open tables…",
    "Verifying open orders…",
    "Confirming cashier shifts…",
    "Clearing kitchen orders…",
    "Posting day sales…",
    "Locking outlet business day…",
    "Day close completed.",
  ];

  const runDayClose = async () => {
    if (!canClose) return;
    setConfirmOpen(false);
    setRunning(true);
    setStepIndex(0);

    for (let i = 0; i < steps.length; i++) {
      setStepIndex(i);
      await new Promise((r) => setTimeout(r, 350));
    }

    try {
      await dayCloseService.create({
        outletId,
        businessDate: bizDate,
        checkpoint: "Day close",
        detail: `Closed by ${currentUser.name}`,
        count: 0,
        status: "Completed",
      });
      setClosedOutlets((prev) => ({ ...prev, [outletId]: bizDate }));
      setToast(`Day close completed for ${outlets.find((o) => o.id === outletId)?.name ?? "outlet"}.`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to post day close");
    } finally {
      setRunning(false);
      setStepIndex(-1);
    }
  };

  const resetSession = () => {
    setClosedOutlets((prev) => {
      const next = { ...prev };
      delete next[outletId];
      return next;
    });
    setToast("Day close session reset for this outlet.");
    void reload();
  };

  const selectedOutlet = outlets.find((o) => o.id === outletId);

  if (loading && !outletId) {
    return (
      <ModulePageShell
        eyebrow="Restaurants"
        title="Day Close"
        description="End-of-day close checklist for the selected restaurant outlet."
        wrapChildren={false}
      >
        <p className="text-sm text-slate-500">Loading…</p>
      </ModulePageShell>
    );
  }

  if (error) {
    return (
      <ModulePageShell
        eyebrow="Restaurants"
        title="Day Close"
        description="End-of-day close checklist for the selected restaurant outlet."
        wrapChildren={false}
      >
        <p className="text-sm text-red-600">{error}</p>
      </ModulePageShell>
    );
  }

  return (
    <ModulePageShell
      eyebrow={selectedOutlet ? `Food & Beverages · ${selectedOutlet.name}` : "Restaurants"}
      title="Day Close"
      description="Verify outlet checklist and close the F&B business day."
      toast={toast}
      onDismissToast={() => setToast(null)}
      wrapChildren={false}
      beforeFilters={
        <FbOutletSelect outlets={outlets} value={outletId} onChange={setOutletId} />
      }
      actionButtons={
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
            <CalendarClock className="h-3.5 w-3.5 text-emerald-600" />
            Business Date: {bizDate}
            {outletClosed && (
              <span className="ml-1 rounded bg-emerald-50 px-1 py-0.5 text-[9px] font-semibold uppercase text-emerald-700">
                Closed
              </span>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1 text-xs font-semibold"
            onClick={resetSession}
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
          {!outletClosed && (
            <Button
              size="sm"
              className="bg-emerald-700 text-xs font-semibold hover:bg-emerald-800"
              disabled={!canClose}
              onClick={() => setConfirmOpen(true)}
            >
              Run Day Close
            </Button>
          )}
        </div>
      }
      stats={[
        {
          label: "Business Date",
          value: bizDate,
          sublabel: "Current day",
          icon: CalendarClock,
        },
        {
          label: "Open Checks",
          value: openTables.length + openOrders.length,
          accent: openTables.length + openOrders.length > 0 ? "#f59e0b" : "#15803d",
          sublabel: "Must settle",
          icon: ClipboardList,
        },
        {
          label: "Day Sales",
          value: formatINR(daySales),
          accent: "#15803d",
          sublabel: "Gross settled",
          icon: IndianRupee,
        },
        {
          label: "Status",
          value: outletClosed ? "Closed" : blockers.length ? "Blocked" : "Ready",
          accent: outletClosed ? "#15803d" : blockers.length ? "#f59e0b" : "#10b981",
          sublabel: outletClosed ? "Posted" : blockers.length ? "Resolve checks" : "Can close",
          icon: CheckCircle2,
        },
      ]}
    >
      {running && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <div className="flex items-center gap-2 font-semibold">
            <Loader2 className="h-4 w-4 animate-spin" />
            Running day close…
          </div>
          <p className="mt-1 text-xs text-emerald-700">
            {stepIndex >= 0 ? steps[stepIndex] : "Starting…"}
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Day Close Readiness
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {doneCount} of {checklist.length} checks passed
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-bold",
                  progressPercent === 100
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700",
                )}
              >
                {progressPercent}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  progressPercent === 100 ? "bg-emerald-600" : "bg-amber-500",
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {blockers.length > 0 && !outletClosed && (
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Closing Checklist
              </h3>
              {blockers.length > 0 ? (
                <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                  {blockers.length} remaining
                </span>
              ) : (
                <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                  Ready
                </span>
              )}
            </div>
            <ul className="divide-y divide-slate-100">
              {checklist.map((item) => {
                const Icon =
                  item.status === "done"
                    ? CheckCircle2
                    : item.status === "warning"
                      ? AlertTriangle
                      : Circle;
                return (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-3 px-4 py-3"
                  >
                    <div className="flex gap-3">
                      <Icon
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0",
                          item.status === "done"
                            ? "text-emerald-600"
                            : item.status === "warning"
                              ? "text-amber-500"
                              : "text-slate-300",
                        )}
                      />
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
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={cn(
                          "text-[11px] font-semibold",
                          item.status === "done" ? "text-emerald-600" : "text-amber-600",
                        )}
                      >
                        {item.status === "done" ? "Checked" : "Pending"}
                      </span>
                      {item.href && item.status !== "done" && (
                        <Link
                          href={item.href}
                          className="text-[11px] font-semibold text-emerald-700 hover:underline"
                        >
                          Resolve
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {openShifts.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-900">
                Open Cashier Shifts
              </h3>
              <ul className="space-y-2">
                {openShifts.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {s.cashier} · {s.shift}
                      </p>
                      <p className="text-xs text-slate-500">Opened {s.openedAt}</p>
                    </div>
                    <Link href="/food-beverages/restaurants/cashier">
                      <Button size="sm" className="bg-emerald-700 text-xs hover:bg-emerald-800">
                        Close shift
                      </Button>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {openTables.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-900">
                Open Tables
              </h3>
              <ul className="space-y-2">
                {openTables.slice(0, 6).map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {t.tableNo} · {t.guest || "Guest"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {t.status} · {formatINR(Number(t.checkAmount ?? 0))}
                      </p>
                    </div>
                    <Link href="/food-beverages/restaurants/orders">
                      <Button size="sm" variant="outline" className="text-xs">
                        Settle
                      </Button>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-900">
              Outlet Snapshot
            </h3>
            <ul className="space-y-2 text-sm">
              <SummaryLine
                icon={LayoutGrid}
                label="Open tables"
                value={String(openTables.length)}
              />
              <SummaryLine
                icon={UtensilsCrossed}
                label="Open orders"
                value={String(openOrders.length)}
              />
              <SummaryLine
                icon={Wallet}
                label="Open shifts"
                value={String(openShifts.length)}
              />
              <SummaryLine
                icon={ClipboardList}
                label="Kitchen orders"
                value={String(activeKitchenOrders.length)}
              />
              <SummaryLine
                icon={IndianRupee}
                label="Settled sales"
                value={formatINR(daySales)}
                strong
              />
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-900">
              Before You Close
            </h3>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>Settle or transfer all open covers and orders.</li>
              <li>Close and reconcile every cashier shift.</li>
              <li>Clear pending kitchen orders (Pending / Preparing / Ready).</li>
              <li>Run day close once readiness reaches 100%.</li>
            </ul>
          </div>

          {outletClosed && (
            <AlertBanner
              variant="success"
              message={`Day close posted for ${selectedOutlet?.name ?? "outlet"} on ${closedOutlets[outletId]}.`}
            />
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void runDayClose()}
        title="Run Day Close?"
        message={`This will lock the F&B business day for ${selectedOutlet?.name ?? "this outlet"} (${bizDate}).`}
        confirmLabel="Run Day Close"
      />
    </ModulePageShell>
  );
}

function SummaryLine({
  icon: Icon,
  label,
  value,
  strong,
}: {
  icon: typeof LayoutGrid;
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
      <span className={cn("font-semibold text-slate-900", strong && "text-emerald-700")}>
        {value}
      </span>
    </li>
  );
}
