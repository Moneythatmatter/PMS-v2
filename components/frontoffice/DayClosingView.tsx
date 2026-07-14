"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Circle,
  ClipboardList,
  Download,
  ExternalLink,
  FileText,
  IndianRupee,
  Loader2,
  RotateCcw,
  Users,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import {
  type DayClosingChecklistItem,
  type DayClosingReport,
} from "@/app/data/frontoffice/closing";
import { currentUser } from "@/app/data";
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
import {
  addDaysIso,
  createInitialDayClosingState,
  formatBusinessDate,
  loadDayClosingState,
  resetClosingDemo,
  saveDayClosingState,
  type DayClosingSessionState,
} from "@/lib/day-closing-session";

const statusIcon = {
  done: CheckCircle2,
  pending: Circle,
  warning: AlertTriangle,
};

const statusStyle = {
  done: "text-emerald-600",
  pending: "text-slate-400",
  warning: "text-amber-500",
};

const CLOSING_STEPS = [
  "Validating cashier shifts…",
  "Settling pending departures…",
  "Posting remaining room charges…",
  "Transferring open POS bills to folios…",
  "Locking today's transactions…",
  "Rolling business date forward…",
  "Generating day closing report…",
];

function buildChecklist(state: DayClosingSessionState): DayClosingChecklistItem[] {
  const openShifts = state.shifts.filter((s) => s.status === "Open").length;
  const pendingDepartures = state.pending.filter((p) => p.status === "Pending").length;
  const pendingCharges = state.charges.filter((c) => c.status === "Pending").length;
  const openPos = state.posTabs.filter((p) => p.status === "Open").length;

  return [
    {
      id: "cashier",
      label: "All cashier shifts closed",
      status: openShifts === 0 ? "done" : "warning",
      detail:
        openShifts === 0
          ? "All shifts reconciled"
          : `${openShifts} shift${openShifts === 1 ? "" : "s"} still open`,
      href: "/frontoffice/cashiers-closing",
    },
    {
      id: "checkouts",
      label: "Pending check-outs settled",
      status: pendingDepartures === 0 ? "done" : "warning",
      detail:
        pendingDepartures === 0
          ? "No pending departures"
          : `${pendingDepartures} guest${pendingDepartures === 1 ? "" : "s"} pending`,
      href: "/frontoffice/reservation/check-out",
    },
    {
      id: "charges",
      label: "Room charges posted",
      status: pendingCharges === 0 ? "done" : "warning",
      detail:
        pendingCharges === 0
          ? "All in-house rooms posted"
          : `${pendingCharges} room${pendingCharges === 1 ? "" : "s"} pending posting`,
    },
    {
      id: "pos",
      label: "POS bills transferred",
      status: openPos === 0 ? "done" : "warning",
      detail:
        openPos === 0
          ? "No open POS tabs"
          : `${openPos} open POS tab${openPos === 1 ? "" : "s"}`,
      href: "/food-beverages/pos-billing",
    },
    {
      id: "audit",
      label: "Night audit",
      status: state.nightAuditCompleted ? "done" : state.completed ? "warning" : "pending",
      detail: state.nightAuditCompleted
        ? "Night audit completed"
        : state.completed
          ? "Ready — run Night Audit next"
          : "Available after day closing",
      href: "/frontoffice/reports/night-audit",
    },
  ];
}

export function DayClosingView() {
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<DayClosingSessionState>(createInitialDayClosingState);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(-1);

  useEffect(() => {
    setState(loadDayClosingState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveDayClosingState(state);
  }, [state, hydrated]);

  const checklist = useMemo(() => buildChecklist(state), [state]);
  const blockers = useMemo(
    () => checklist.filter((c) => c.id !== "audit" && c.status !== "done"),
    [checklist],
  );
  const canClose = blockers.length === 0 && !state.completed && !running;

  const openShifts = state.shifts.filter((s) => s.status === "Open");
  const pendingGuests = state.pending.filter((p) => p.status === "Pending");
  const pendingCharges = state.charges.filter((c) => c.status === "Pending");
  const openPos = state.posTabs.filter((p) => p.status === "Open");

  const setToastMsg = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  const resolveCashier = (id: string) => {
    setState((prev) => ({
      ...prev,
      shifts: prev.shifts.map((s) =>
        s.id === id
          ? {
              ...s,
              status: "Closed",
              actual: s.expected,
              variance: 0,
            }
          : s,
      ),
    }));
    setToastMsg(`Cashier shift ${id} closed and balanced.`);
  };

  const settleDeparture = (id: string) => {
    setState((prev) => {
      const guest = prev.pending.find((p) => p.id === id);
      return {
        ...prev,
        pending: prev.pending.map((p) =>
          p.id === id ? { ...p, status: "Settled", balance: 0 } : p,
        ),
        summary: {
          ...prev.summary,
          pendingCheckouts: Math.max(0, prev.summary.pendingCheckouts - 1),
          departures: prev.summary.departures + (guest?.status === "Pending" ? 1 : 0),
          inHouse: Math.max(0, prev.summary.inHouse - (guest?.status === "Pending" ? 1 : 0)),
          totalRevenue: prev.summary.totalRevenue + (guest?.balance ?? 0),
          roomRevenue: prev.summary.roomRevenue + (guest?.balance ?? 0),
        },
      };
    });
    setToastMsg("Pending check-out settled and folio closed.");
  };

  const postCharge = (id: string) => {
    setState((prev) => ({
      ...prev,
      charges: prev.charges.map((c) =>
        c.id === id ? { ...c, status: "Posted" } : c,
      ),
    }));
    setToastMsg("Room charge posted to guest folio.");
  };

  const postAllCharges = () => {
    setState((prev) => ({
      ...prev,
      charges: prev.charges.map((c) => ({ ...c, status: "Posted" })),
    }));
    setToastMsg("All pending room charges posted.");
  };

  const transferPos = (id: string) => {
    setState((prev) => {
      const tab = prev.posTabs.find((p) => p.id === id);
      return {
        ...prev,
        posTabs: prev.posTabs.map((p) =>
          p.id === id ? { ...p, status: "Transferred" } : p,
        ),
        summary: {
          ...prev.summary,
          fbRevenue: prev.summary.fbRevenue + (tab?.status === "Open" ? tab.amount : 0),
          totalRevenue:
            prev.summary.totalRevenue + (tab?.status === "Open" ? tab.amount : 0),
        },
      };
    });
    setToastMsg("POS bill transferred to room folio.");
  };

  const transferAllPos = () => {
    setState((prev) => {
      const openAmount = prev.posTabs
        .filter((p) => p.status === "Open")
        .reduce((sum, p) => sum + p.amount, 0);
      return {
        ...prev,
        posTabs: prev.posTabs.map((p) => ({ ...p, status: "Transferred" })),
        summary: {
          ...prev.summary,
          fbRevenue: prev.summary.fbRevenue + openAmount,
          totalRevenue: prev.summary.totalRevenue + openAmount,
        },
      };
    });
    setToastMsg("All open POS tabs transferred to folios.");
  };

  const runClosing = async () => {
    setConfirmOpen(false);
    setRunning(true);
    setStepIndex(0);

    for (let i = 0; i < CLOSING_STEPS.length; i++) {
      setStepIndex(i);
      await new Promise((r) => setTimeout(r, 450));
    }

    const previous = state.summary.businessDate;
    const next = addDaysIso(previous, 1);
    const now = new Date().toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const report: DayClosingReport = {
      closedAt: now,
      previousBusinessDate: previous,
      nextBusinessDate: next,
      closedBy: currentUser.name,
      steps: [...CLOSING_STEPS],
      roomRevenue: state.summary.roomRevenue,
      fbRevenue: state.summary.fbRevenue,
      otherRevenue: state.summary.otherRevenue,
      totalRevenue: state.summary.totalRevenue,
      occupancy: state.summary.occupancy,
      arrivals: state.summary.arrivals,
      departures: state.summary.departures,
      inHouse: state.summary.inHouse,
      shiftsClosed: state.shifts.filter((s) => s.status === "Closed").length,
      chargesPosted: state.charges.filter((c) => c.status === "Posted").length,
      posTransferred: state.posTabs.filter((p) => p.status === "Transferred").length,
    };

    setState((prev) => ({
      ...prev,
      completed: true,
      nightAuditCompleted: false,
      report,
      summary: {
        ...prev.summary,
        businessDate: next,
        pendingCheckouts: 0,
      },
    }));
    setRunning(false);
    setStepIndex(-1);
    setToastMsg(
      `Day closing complete. Business date rolled to ${formatBusinessDate(next)}.`,
    );
  };

  const resetDemo = () => {
    resetClosingDemo();
    setState(createInitialDayClosingState());
    setToastMsg("Day closing demo reset to start-of-day state.");
  };

  const exportReport = () => {
    if (!state.report) return;
    const r = state.report;
    const lines = [
      "DAY CLOSING REPORT",
      `Closed at,${r.closedAt}`,
      `Closed by,${r.closedBy}`,
      `Previous business date,${formatBusinessDate(r.previousBusinessDate)}`,
      `Next business date,${formatBusinessDate(r.nextBusinessDate)}`,
      `Room revenue,${r.roomRevenue}`,
      `F&B revenue,${r.fbRevenue}`,
      `Other revenue,${r.otherRevenue}`,
      `Total revenue,${r.totalRevenue}`,
      `Occupancy,${r.occupancy}%`,
      `Arrivals,${r.arrivals}`,
      `Departures,${r.departures}`,
      `In-house,${r.inHouse}`,
      `Shifts closed,${r.shiftsClosed}`,
      `Charges posted,${r.chargesPosted}`,
      `POS transferred,${r.posTransferred}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `day-closing-${r.previousBusinessDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToastMsg("Day closing report exported.");
  };

  const summary = state.summary;

  return (
    <div className="space-y-5">
      {toast && (
        <AlertBanner variant="success" message={toast} onDismiss={() => setToast(null)} />
      )}

      <FOPageHeader
        eyebrow="Front Office"
        title="Day Closing"
        description="Clear blockers, run daily closing, and roll the business date."
        badge={
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
            <CalendarClock className="h-3.5 w-3.5 text-emerald-600" />
            Business Date: {formatBusinessDate(summary.businessDate)}
            {state.completed && (
              <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                Closed
              </span>
            )}
          </div>
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={resetDemo}>
              <RotateCcw className="h-3.5 w-3.5" />
              Reset demo
            </Button>
            {!state.completed && (
              <Button
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800"
                onClick={() => setConfirmOpen(true)}
                disabled={!canClose}
              >
                Run Day Closing
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatMiniCard
          label="Total Revenue"
          value={formatINR(summary.totalRevenue)}
          accent="#15803d"
          icon={IndianRupee}
        />
        <StatMiniCard label="Occupancy" value={`${summary.occupancy}%`} icon={Users} />
        <StatMiniCard
          label="Arrivals / Departures"
          value={`${summary.arrivals} / ${summary.departures}`}
          icon={Calendar}
        />
        <StatMiniCard
          label="In-House Guests"
          value={summary.inHouse}
          accent="#10b981"
          icon={Users}
        />
      </div>

      {running && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">Running day closing…</p>
              <p className="text-xs text-emerald-700">
                {CLOSING_STEPS[Math.max(0, stepIndex)]}
              </p>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-emerald-100">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-300"
              style={{
                width: `${((Math.max(stepIndex, 0) + 1) / CLOSING_STEPS.length) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {state.completed && state.report ? (
        <div className="space-y-5">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
            <p className="mt-4 text-lg font-bold text-emerald-900">Day Closing Complete</p>
            <p className="mt-1 text-sm text-emerald-700">
              Business date rolled from{" "}
              {formatBusinessDate(state.report.previousBusinessDate)} →{" "}
              {formatBusinessDate(state.report.nextBusinessDate)}.
              {state.nightAuditCompleted
                ? " Night audit is also complete."
                : " Next: run Night Audit."}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 bg-white"
                onClick={exportReport}
              >
                <Download className="h-3.5 w-3.5" />
                Export report
              </Button>
              <Link href="/frontoffice/reports/night-audit">
                <Button size="sm" className="gap-1.5 bg-emerald-700 hover:bg-emerald-800">
                  {state.nightAuditCompleted ? "View Night Audit" : "Open Night Audit"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <FileText className="h-4 w-4 text-emerald-700" />
                Closing Report
              </h2>
              <div className="divide-y divide-slate-100">
                <SummaryRow label="Closed by" value={state.report.closedBy} />
                <SummaryRow label="Closed at" value={state.report.closedAt} />
                <SummaryRow
                  label="Previous date"
                  value={formatBusinessDate(state.report.previousBusinessDate)}
                />
                <SummaryRow
                  label="New business date"
                  value={formatBusinessDate(state.report.nextBusinessDate)}
                  highlight
                />
                <SummaryRow label="Shifts closed" value={String(state.report.shiftsClosed)} />
                <SummaryRow label="Charges posted" value={String(state.report.chargesPosted)} />
                <SummaryRow
                  label="POS transferred"
                  value={String(state.report.posTransferred)}
                />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">Revenue snapshot</h2>
              <div className="divide-y divide-slate-100">
                <SummaryRow
                  label="Room Revenue"
                  value={formatINR(state.report.roomRevenue)}
                />
                <SummaryRow label="F&B Revenue" value={formatINR(state.report.fbRevenue)} />
                <SummaryRow
                  label="Other Revenue"
                  value={formatINR(state.report.otherRevenue)}
                />
                <SummaryRow
                  label="Total Revenue"
                  value={formatINR(state.report.totalRevenue)}
                  highlight
                />
                <SummaryRow label="Occupancy" value={`${state.report.occupancy}%`} />
                <SummaryRow
                  label="Arrivals / Departures"
                  value={`${state.report.arrivals} / ${state.report.departures}`}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-5">
          <div className="space-y-5 xl:col-span-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-900">Pre-Closing Checklist</h2>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                    blockers.length === 0
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700",
                  )}
                >
                  {blockers.length === 0
                    ? "Ready to close"
                    : `${blockers.length} blocker${blockers.length === 1 ? "" : "s"}`}
                </span>
              </div>
              <ul className="space-y-3">
                {checklist.map((item) => {
                  const Icon = statusIcon[item.status];
                  return (
                    <li
                      key={item.id}
                      className="flex items-start gap-3 rounded-lg border border-slate-100 p-3"
                    >
                      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", statusStyle[item.status])} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium text-slate-900">{item.label}</p>
                          {item.href && (
                            <Link
                              href={item.href}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:underline"
                            >
                              Open
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{item.detail}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {blockers.length > 0 && (
                <p className="mt-4 text-xs text-amber-600">
                  Resolve all blockers below before running day closing.
                </p>
              )}
            </div>

            {openShifts.length > 0 && (
              <BlockerCard
                icon={Wallet}
                title="Open cashier shifts"
                description="Close and balance each open shift before day end."
              >
                {openShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {shift.cashier} · {shift.id}
                      </p>
                      <p className="text-xs text-slate-500">
                        {shift.shift} · Expected {formatINR(shift.expected)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-emerald-700 hover:bg-emerald-800"
                      onClick={() => resolveCashier(shift.id)}
                    >
                      Close shift
                    </Button>
                  </div>
                ))}
              </BlockerCard>
            )}

            {pendingGuests.length > 0 && (
              <BlockerCard
                icon={ClipboardList}
                title="Pending check-outs"
                description="Settle folios for guests still marked as departing today."
              >
                {pendingGuests.map((guest) => (
                  <div
                    key={guest.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {guest.guestName} · Room {guest.roomNo}
                      </p>
                      <p className="text-xs text-slate-500">
                        Due {guest.checkOut} · Balance {formatINR(guest.balance)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-emerald-700 hover:bg-emerald-800"
                      onClick={() => settleDeparture(guest.id)}
                    >
                      Settle & check out
                    </Button>
                  </div>
                ))}
              </BlockerCard>
            )}

            {pendingCharges.length > 0 && (
              <BlockerCard
                icon={IndianRupee}
                title="Unposted room charges"
                description="Post nightly room rate and extras to in-house folios."
                action={
                  <Button type="button" variant="outline" size="sm" onClick={postAllCharges}>
                    Post all
                  </Button>
                }
              >
                {pendingCharges.map((charge) => (
                  <div
                    key={charge.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Room {charge.roomNo} · {charge.guestName}
                      </p>
                      <p className="text-xs text-slate-500">
                        Rate {formatINR(charge.roomRate)} + extras {formatINR(charge.extras)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-emerald-700 hover:bg-emerald-800"
                      onClick={() => postCharge(charge.id)}
                    >
                      Post charge
                    </Button>
                  </div>
                ))}
              </BlockerCard>
            )}

            {openPos.length > 0 && (
              <BlockerCard
                icon={UtensilsCrossed}
                title="Open POS tabs"
                description="Transfer restaurant / bar bills to guest room folios."
                action={
                  <Button type="button" variant="outline" size="sm" onClick={transferAllPos}>
                    Transfer all
                  </Button>
                }
              >
                {openPos.map((tab) => (
                  <div
                    key={tab.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {tab.id} · {tab.outlet}
                      </p>
                      <p className="text-xs text-slate-500">
                        Room {tab.roomNo} · {tab.guestName} · {formatINR(tab.amount)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-emerald-700 hover:bg-emerald-800"
                      onClick={() => transferPos(tab.id)}
                    >
                      Transfer to folio
                    </Button>
                  </div>
                ))}
              </BlockerCard>
            )}
          </div>

          <div className="space-y-5 xl:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">Day End Summary</h2>
              <div className="divide-y divide-slate-100">
                <SummaryRow label="Room Revenue" value={formatINR(summary.roomRevenue)} />
                <SummaryRow label="F&B Revenue" value={formatINR(summary.fbRevenue)} />
                <SummaryRow label="Other Revenue" value={formatINR(summary.otherRevenue)} />
                <SummaryRow
                  label="Total Revenue"
                  value={formatINR(summary.totalRevenue)}
                  highlight
                />
                <SummaryRow label="Occupancy" value={`${summary.occupancy}%`} />
                <SummaryRow label="Arrivals Today" value={String(summary.arrivals)} />
                <SummaryRow label="Departures Today" value={String(summary.departures)} />
                <SummaryRow
                  label="Pending Check-outs"
                  value={String(summary.pendingCheckouts)}
                />
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-5">
              <h3 className="text-sm font-semibold text-slate-900">How this demo works</h3>
              <ol className="mt-3 list-decimal space-y-2 pl-4 text-xs text-slate-600">
                <li>Clear every warning item using the action buttons.</li>
                <li>
                  When the checklist shows <strong>Ready to close</strong>, run Day Closing.
                </li>
                <li>The business date rolls forward and a closing report is generated.</li>
                <li>Use Reset demo anytime to start again (stored in this browser session).</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={runClosing}
        title="Run Day Closing?"
        message={`This will lock ${formatBusinessDate(summary.businessDate)}, roll the business date forward, and generate a closing report. This demo action can be reset afterward.`}
        confirmLabel="Run Day Closing"
      />
    </div>
  );
}

function BlockerCard({
  icon: Icon,
  title,
  description,
  action,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
