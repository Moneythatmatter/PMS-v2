"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  BedDouble,
  CalendarClock,
  CheckCircle2,
  Download,
  ExternalLink,
  History,
  IndianRupee,
  Loader2,
  LogIn,
  LogOut,
  Percent,
  RefreshCw,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  AlertBanner,
  ConfirmModal,
  FOPageHeader,
  StatMiniCard,
  SummaryRow,
  formatINR,
} from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";
import { downloadXlsx } from "@/lib/xlsx";
import {
  dayClosingService,
  type DayClosingRecord,
  type DayClosingStatus,
} from "@/services/front-office/closing";

function formatDay(iso: string) {
  if (!iso) return "—";
  return new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatStamp(value: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function fetchAll() {
  const [status, history] = await Promise.all([
    dayClosingService.status(),
    dayClosingService.history(10).catch(() => [] as DayClosingRecord[]),
  ]);
  return { status, history };
}

function errorText(e: unknown) {
  return e instanceof Error ? e.message : "Something went wrong";
}

export function DayClosingView() {
  const [status, setStatus] = useState<DayClosingStatus | null>(null);
  const [history, setHistory] = useState<DayClosingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<DayClosingRecord | null>(null);

  const apply = useCallback((data: Awaited<ReturnType<typeof fetchAll>>) => {
    setStatus(data.status);
    setHistory(data.history);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      apply(await fetchAll());
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, [apply]);

  useEffect(() => {
    let cancelled = false;
    fetchAll()
      .then((data) => !cancelled && apply(data))
      .catch((e) => !cancelled && setError(errorText(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [apply]);

  const runClosing = async () => {
    setRunning(true);
    setError(null);
    try {
      const record = await dayClosingService.run();
      setConfirmOpen(false);
      setLastRun(record);
      setToast(
        `Day closing complete. Business date moved to ${formatDay(record.nextBusinessDate)}.`,
      );
      await load();
    } catch (e) {
      setConfirmOpen(false);
      setError(errorText(e));
    } finally {
      setRunning(false);
    }
  };

  const exportReport = (record: DayClosingRecord) => {
    downloadXlsx(`day-closing-${record.businessDate}`, [
      {
        name: "Day Closing",
        title: "Day Closing Report",
        meta: [
          ["Business date", formatDay(record.businessDate)],
          ["Next business date", formatDay(record.nextBusinessDate)],
          ["Closed by", record.closedBy],
          ["Closed at", formatStamp(record.closedAt)],
        ],
        header: ["Metric", "Value"],
        rows: [
          ["Net collections", Number(record.totalRevenue)],
          ["Room revenue (night)", Number(record.roomRevenue)],
          ["F&B collections", Number(record.fbRevenue)],
          ["Other collections", Number(record.otherRevenue)],
          ["Occupancy %", Number(record.occupancy)],
          ["Arrivals", Number(record.arrivals)],
          ["Departures", Number(record.departures)],
          ["In-house", Number(record.inHouse)],
        ],
      },
    ]);
  };

  if (loading && !status) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading day closing…
      </div>
    );
  }

  if (!status) {
    return (
      <div className="space-y-4">
        <AlertBanner variant="error" message={error ?? "Could not load day closing"} />
        <Button size="sm" variant="outline" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    );
  }

  const { checks, rooms, collections, guests, departments } = status;
  const mandatory = checks.filter((c) => c.mandatory);
  const passedMandatory = mandatory.filter((c) => c.passed).length;
  const progress = mandatory.length ? Math.round((passedMandatory / mandatory.length) * 100) : 100;
  const advisories = checks.filter((c) => !c.mandatory && !c.passed);
  const canRun = status.canCloseDate && status.blockers === 0 && !running;
  const alreadyClosed = !status.canCloseDate;

  return (
    <div className="space-y-4">
      {toast && <AlertBanner variant="success" message={toast} onDismiss={() => setToast(null)} />}
      {error && <AlertBanner variant="error" message={error} onDismiss={() => setError(null)} />}

      <FOPageHeader
        eyebrow="Front Office"
        title="Day Closing"
        description="Check every department, then close the business date and roll it forward."
        badge={
          <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
            <CalendarClock className="h-3.5 w-3.5 text-emerald-600" />
            Business Date: {formatDay(status.businessDate)}
          </div>
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1 text-xs font-semibold"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button
              size="sm"
              className="bg-emerald-700 text-xs font-semibold hover:bg-emerald-800"
              onClick={() => setConfirmOpen(true)}
              disabled={!canRun}
            >
              Run Day Closing
            </Button>
          </div>
        }
      />

      {status.isBehind && !alreadyClosed && (
        <AlertBanner
          variant="info"
          message={`Business date ${formatDay(status.businessDate)} is behind today (${formatDay(status.calendarDate)}). Close each pending day to catch up.`}
        />
      )}
      {alreadyClosed && (
        <AlertBanner
          variant="info"
          message={`${formatDay(status.businessDate)} can't be closed right now — it is either already closed or ahead of today's date.`}
        />
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatMiniCard
          label="Occupancy"
          value={`${rooms.occupancy}%`}
          sublabel={`${rooms.occupied} of ${rooms.sellable} rooms`}
          icon={Percent}
        />
        <StatMiniCard
          label="Net collections"
          value={formatINR(collections.net)}
          sublabel={`${collections.count} transactions`}
          icon={IndianRupee}
        />
        <StatMiniCard
          label="Room revenue"
          value={formatINR(rooms.roomRevenue)}
          sublabel={`ADR ${formatINR(rooms.adr)}`}
          icon={BedDouble}
        />
        <StatMiniCard
          label="In-house"
          value={guests.inHouse}
          sublabel={`${guests.stayingOver} staying over`}
          icon={Users}
        />
        <StatMiniCard
          label="Due check-outs"
          value={status.dueOut.length}
          sublabel={`${guests.departedToday} checked out today`}
          accent={status.dueOut.length ? "#DC3545" : "#15803d"}
          icon={LogOut}
        />
        <StatMiniCard
          label="Open cashier shifts"
          value={status.unsettledSessions.length}
          sublabel={status.unsettledSessions.length ? "Close before day end" : "All settled"}
          accent={status.unsettledSessions.length ? "#f59e0b" : "#15803d"}
          icon={Wallet}
        />
      </div>

      {lastRun && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            <div>
              <p className="text-sm font-bold text-emerald-900">
                {formatDay(lastRun.businessDate)} closed by {lastRun.closedBy}
              </p>
              <p className="text-xs text-emerald-800">
                Business date is now {formatDay(lastRun.nextBusinessDate)}.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1 bg-white text-xs font-semibold"
            onClick={() => exportReport(lastRun)}
          >
            <Download className="h-3 w-3" /> Export report
          </Button>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-3">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Closing checklist
                </h3>
                <p className="text-[11px] text-slate-500">
                  {passedMandatory} of {mandatory.length} mandatory checks passed
                </p>
              </div>
              <span
                className={cn(
                  "rounded px-2 py-0.5 text-[10px] font-bold uppercase",
                  status.blockers === 0
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700",
                )}
              >
                {status.blockers === 0 ? "Ready to close" : `${status.blockers} blocking`}
              </span>
            </div>
            <div className="px-4 pt-3">
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    progress === 100 ? "bg-emerald-600" : "bg-amber-500",
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <ul className="divide-y divide-slate-100 px-4">
              {checks.map((check) => {
                const Icon = check.passed ? CheckCircle2 : check.mandatory ? XCircle : AlertTriangle;
                return (
                  <li key={check.id} className="flex items-start gap-3 py-3">
                    <Icon
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        check.passed
                          ? "text-emerald-600"
                          : check.mandatory
                            ? "text-red-500"
                            : "text-amber-500",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-bold text-slate-800">{check.label}</p>
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                            check.mandatory ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500",
                          )}
                        >
                          {check.mandatory ? "Mandatory" : "Advisory"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">{check.detail}</p>
                    </div>
                    {!check.passed && check.href && (
                      <Link
                        href={check.href}
                        className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline"
                      >
                        Resolve <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
            {advisories.length > 0 && status.blockers === 0 && (
              <p className="border-t border-slate-100 px-4 py-2.5 text-[11px] text-amber-700">
                Advisory items don&apos;t block closing, but review them before you roll the date.
              </p>
            )}
          </div>

          {status.unsettledSessions.length > 0 && (
            <ListCard icon={Wallet} title="Cashier shifts to settle" href="/frontoffice/cashier/history">
              {status.unsettledSessions.map((s) => (
                <ListRow
                  key={s.id}
                  primary={`${s.cashierName} · ${s.shiftName}`}
                  secondary={`Opened ${formatStamp(s.openedAt)}`}
                  badge={s.status}
                  badgeTone={s.status === "Pending Approval" ? "amber" : "red"}
                />
              ))}
            </ListCard>
          )}

          {status.dueOut.length > 0 && (
            <ListCard icon={LogOut} title="Guests due to check out" href="/frontoffice/reservation/check-out">
              {status.dueOut.map((g) => (
                <ListRow
                  key={g.id}
                  primary={`${g.guestName} · Room ${g.roomNo || "—"}`}
                  secondary={`Due ${formatDay(g.checkOut)}`}
                  badge={g.balance > 0 ? `Balance ${formatINR(g.balance)}` : "Settled"}
                  badgeTone={g.balance > 0 ? "red" : "emerald"}
                />
              ))}
            </ListCard>
          )}

          {status.pendingArrivalList.length > 0 && (
            <ListCard icon={LogIn} title="Arrivals not checked in" href="/frontoffice/reservation/check-in">
              {status.pendingArrivalList.map((g) => (
                <ListRow
                  key={g.id}
                  primary={`${g.guestName} · Room ${g.roomNo || "TBA"}`}
                  secondary="Check in, cancel or mark as no-show"
                  badge={g.status}
                  badgeTone="amber"
                />
              ))}
            </ListCard>
          )}
        </div>

        <div className="space-y-4 xl:col-span-2">
          <SideCard title={`Collections · ${formatDay(status.businessDate)}`}>
            {collections.byMethod
              .filter((m) => m.amount > 0 || ["CASH", "CARD", "UPI", "BANK_TRANSFER"].includes(m.method))
              .map((m) => (
                <SummaryRow key={m.method} label={m.label} value={formatINR(m.amount)} />
              ))}
            <SummaryRow
              label="Refunds"
              value={collections.refunds ? `−${formatINR(collections.refunds)}` : formatINR(0)}
            />
            <SummaryRow label="Net collections" value={formatINR(collections.net)} highlight />
            <div className="pt-2 text-[10px] text-slate-500">
              Front office {formatINR(collections.bySource.frontOffice)} · F&amp;B{" "}
              {formatINR(collections.bySource.fnb)} · Other {formatINR(collections.bySource.other)}
            </div>
          </SideCard>

          <SideCard title="Revenue & balances">
            <SummaryRow label="Room revenue (tonight)" value={formatINR(rooms.roomRevenue)} />
            <SummaryRow label="ADR" value={formatINR(rooms.adr)} />
            <SummaryRow label="RevPAR" value={formatINR(rooms.revpar)} />
            <SummaryRow label="Outstanding on open folios" value={formatINR(status.outstanding)} highlight />
          </SideCard>

          <SideCard title="Rooms">
            <SummaryRow label="Total rooms" value={String(rooms.total)} />
            <SummaryRow label="Occupied" value={String(rooms.occupied)} />
            <SummaryRow label="Vacant" value={String(rooms.vacant)} />
            <SummaryRow label="Dirty" value={String(rooms.dirty)} />
            <SummaryRow label="Clean / inspected" value={`${rooms.clean} / ${rooms.inspected}`} />
            <SummaryRow label="Out of order" value={String(rooms.outOfOrder)} />
          </SideCard>

          <SideCard title="Departments">
            <SummaryRow label="Arrivals checked in today" value={String(guests.arrivedToday)} />
            <SummaryRow label="Departures today" value={String(guests.departedToday)} />
            <SummaryRow
              label="Maintenance tickets open"
              value={`${departments.maintenanceOpen}${departments.maintenanceUrgent ? ` (${departments.maintenanceUrgent} urgent)` : ""}`}
            />
            <SummaryRow label="Laundry jobs pending" value={String(departments.laundryPending)} />
            <SummaryRow label="Luggage in store" value={String(departments.luggageStored)} />
            <SummaryRow label="Open restaurant bills" value={String(departments.fnbOpenBills)} />
          </SideCard>

          <SideCard
            title="Recent closings"
            icon={History}
          >
            {history.length === 0 ? (
              <p className="py-3 text-center text-[11px] text-slate-400">No day closings yet.</p>
            ) : (
              history.map((h) => (
                <div key={h.id} className="flex items-center justify-between gap-2 py-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800">{formatDay(h.businessDate)}</p>
                    <p className="truncate text-[10px] text-slate-500">
                      {h.closedBy} · {formatStamp(h.closedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">
                      {formatINR(Number(h.totalRevenue))}
                    </span>
                    <button
                      type="button"
                      title="Export"
                      onClick={() => exportReport(h)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </SideCard>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => !running && setConfirmOpen(false)}
        onConfirm={() => void runClosing()}
        loading={running}
        title={`Close ${formatDay(status.businessDate)}?`}
        message={`This saves the day's figures and moves the business date to the next day. It can't be undone.${
          advisories.length ? `\n\n${advisories.length} advisory item(s) are still open.` : ""
        }`}
        confirmLabel="Run Day Closing"
      />
    </div>
  );
}

function SideCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-1 flex items-center gap-1.5 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-slate-900">
        {Icon && <Icon className="h-3.5 w-3.5 text-slate-400" />}
        {title}
      </h3>
      <div className="divide-y divide-slate-100 text-[11px] font-semibold text-slate-700">{children}</div>
    </div>
  );
}

function ListCard({
  icon: Icon,
  title,
  href,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <Icon className="h-3.5 w-3.5" />
          </span>
          {title}
        </h3>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline"
        >
          Open <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function ListRow({
  primary,
  secondary,
  badge,
  badgeTone,
}: {
  primary: string;
  secondary: string;
  badge: string;
  badgeTone: "red" | "amber" | "emerald";
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-slate-800">{primary}</p>
        <p className="text-[10px] text-slate-500">{secondary}</p>
      </div>
      <span
        className={cn(
          "rounded px-1.5 py-0.5 text-[10px] font-bold",
          badgeTone === "red" && "bg-red-50 text-red-700",
          badgeTone === "amber" && "bg-amber-50 text-amber-700",
          badgeTone === "emerald" && "bg-emerald-50 text-emerald-700",
        )}
      >
        {badge}
      </span>
    </div>
  );
}

