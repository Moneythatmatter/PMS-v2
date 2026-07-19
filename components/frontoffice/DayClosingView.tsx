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
  ShieldCheck,
  Percent,
  Wrench,
  Shirt,
  AlertCircle
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
  done: "text-emerald-650 text-emerald-600 bg-emerald-50 border-emerald-100",
  pending: "text-slate-400 bg-slate-50 border-slate-200",
  warning: "text-amber-500 bg-amber-50 border-amber-100",
};

const CLOSING_STEPS = [
  "Validating cashier shifts…",
  "Settling pending departures…",
  "Posting remaining room charges…",
  "Transferring open POS bills to folios…",
  "Checking housekeeping readiness…",
  "Verifying critical maintenance tickets…",
  "Locking today's transactions…",
  "Rolling business date forward…",
  "Generating day closing report…",
  "Day Closing Report completed.",
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
    [checklist]
  );
  const canClose = blockers.length === 0 && !state.completed && !running;

  // Progress calculations
  const totalChecks = checklist.length;
  const completedChecks = checklist.filter((c) => c.status === "done").length;
  const progressPercent = Math.round((completedChecks / totalChecks) * 100);

  const openShifts = state.shifts.filter((s) => s.status === "Open");
  const pendingGuests = state.pending.filter((p) => p.status === "Pending");
  const pendingCharges = state.charges.filter((c) => c.status === "Pending");
  const openPos = state.posTabs.filter((p) => p.status === "Open");

  // Outstanding departures with balance
  const pendingFoliosCount = state.pending.filter((p) => p.status === "Pending" && p.balance > 0).length;

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
          : s
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
          p.id === id ? { ...p, status: "Settled", balance: 0 } : p
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
        c.id === id ? { ...c, status: "Posted" } : c
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
          p.id === id ? { ...p, status: "Transferred" } : p
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

    // Rollover business date globally across localStorage
    localStorage.setItem("pms_business_date", next);

    // Notify other components via storage event rollover trigger
    window.dispatchEvent(new Event("storage"));

    setRunning(false);
    setStepIndex(-1);
    setToastMsg(
      `Day closing complete. Business date rolled to ${formatBusinessDate(next)}.`
    );
  };

  const resetDemo = () => {
    resetClosingDemo();
    localStorage.removeItem("pms_business_date");
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

  // Computed placeholders matching page data only
  const cashierStatusText = openShifts.length === 0 ? "Ready" : `${openShifts.length} Open`;
  const hkStatusText = pendingCharges.length === 0 ? "Ready" : "Pending";

  return (
    <div className="space-y-4">
      {toast && (
        <AlertBanner variant="success" message={toast} onDismiss={() => setToast(null)} />
      )}

      {/* Header section matching Front Office exactly */}
      <FOPageHeader
        eyebrow="Front Office"
        title="Day Closing"
        description="Verify daily operational checklist and roll over the business date."
        badge={
          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-white border border-slate-200 rounded-md px-2 py-1 shadow-sm">
            <CalendarClock className="h-3.5 w-3.5 text-emerald-600" />
            Business Date: {formatBusinessDate(summary.businessDate)}
            {state.completed && (
              <span className="ml-1.5 rounded bg-emerald-50 border border-emerald-200/50 px-1 py-0.5 text-[9px] font-semibold text-emerald-700 uppercase">
                Closed
              </span>
            )}
          </div>
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" className="gap-1 text-xs font-semibold" onClick={resetDemo}>
              <RotateCcw className="h-3 w-3" />
              Reset demo
            </Button>
            {!state.completed && (
              <Button
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-xs font-semibold"
                onClick={() => setConfirmOpen(true)}
                disabled={!canClose}
              >
                Run Day Closing
              </Button>
            )}
          </div>
        }
      />

      {/* 8 Compact KPI Cards Matching Dashboard Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <StatMiniCard
          label="Business Date"
          value={formatBusinessDate(summary.businessDate)}
          icon={Calendar}
        />
        <StatMiniCard
          label="Occupancy"
          value={`${summary.occupancy}%`}
          icon={Percent}
        />
        <StatMiniCard
          label="Revenue Today"
          value={formatINR(summary.totalRevenue)}
          accent="#15803d"
          icon={IndianRupee}
        />
        <StatMiniCard
          label="Pending Check-outs"
          value={String(pendingGuests.length)}
          accent={pendingGuests.length > 0 ? "#DC3545" : "#15803d"}
          icon={ClipboardList}
        />
        <StatMiniCard
          label="Pending Folios"
          value={String(pendingFoliosCount)}
          accent={pendingFoliosCount > 0 ? "#DC3545" : "#15803d"}
          icon={FileText}
        />
        <StatMiniCard
          label="Cashier Status"
          value={cashierStatusText}
          accent={openShifts.length > 0 ? "#f59e0b" : "#15803d"}
          icon={Wallet}
        />
        <StatMiniCard
          label="Housekeeping"
          value={hkStatusText}
          accent={pendingCharges.length > 0 ? "#f59e0b" : "#15803d"}
          icon={ShieldCheck}
        />
        <StatMiniCard
          label="Maint. Issues"
          value="All Clear"
          accent="#15803d"
          icon={Wrench}
        />
      </div>

      {running && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
            <div>
              <p className="text-xs font-bold text-slate-800">Running closing procedures…</p>
              <p className="text-[10px] text-slate-500 font-semibold">
                {CLOSING_STEPS[Math.max(0, stepIndex)]}
              </p>
            </div>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
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
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm max-w-2xl mx-auto space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Day Closing Completed Successfully</h2>
              <p className="mt-1 text-xs text-slate-500 font-semibold">
                Business date rolled from{" "}
                <strong className="text-slate-700">{formatBusinessDate(state.report.previousBusinessDate)}</strong> to{" "}
                <strong className="text-slate-700">{formatBusinessDate(state.report.nextBusinessDate)}</strong>.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1 bg-white font-semibold text-xs h-8 border-slate-200 px-3"
                onClick={exportReport}
              >
                <Download className="h-3 w-3" />
                Export CSV
              </Button>
              <Link href="/frontoffice/reports/night-audit">
                <Button size="sm" className="gap-1 bg-emerald-700 hover:bg-emerald-800 font-semibold text-xs h-8 px-3">
                  {state.nightAuditCompleted ? "View Night Audit" : "Open Night Audit"}
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
              <h3 className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                <FileText className="h-4 w-4 text-emerald-700" />
                Audit Closing Details
              </h3>
              <div className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                <SummaryRow label="Closed By" value={state.report.closedBy} />
                <SummaryRow label="Closed At" value={state.report.closedAt} />
                <SummaryRow
                  label="Previous Business Date"
                  value={formatBusinessDate(state.report.previousBusinessDate)}
                />
                <SummaryRow
                  label="Rolled Business Date"
                  value={formatBusinessDate(state.report.nextBusinessDate)}
                  highlight
                />
                <SummaryRow label="Cashier Shifts Closed" value={`${state.report.shiftsClosed} shift(s)`} />
                <SummaryRow label="Room Charges Posted" value={`${state.report.chargesPosted} room(s)`} />
                <SummaryRow
                  label="POS Bills Transferred"
                  value={`${state.report.posTransferred} bill(s)`}
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                Financial Revenue Summary
              </h3>
              <div className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
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
                <SummaryRow label="Final Occupancy" value={`${state.report.occupancy}%`} />
                <SummaryRow
                  label="Arrivals / Departures"
                  value={`${state.report.arrivals} / ${state.report.departures}`}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-5">
          <div className="space-y-4 xl:col-span-3">
            {/* Closing Progress Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Day Closing Readiness</h3>
                  <p className="text-[10px] text-slate-500 font-semibold">{completedChecks} of {totalChecks} checks successfully passed</p>
                </div>
                <span className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-bold border",
                  progressPercent < 50
                    ? "bg-red-50 text-red-700 border-red-100"
                    : progressPercent < 85
                    ? "bg-amber-50 text-amber-700 border-amber-100"
                    : "bg-emerald-50 text-emerald-700 border-emerald-100"
                )}>
                  {progressPercent}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-350",
                    progressPercent < 50
                      ? "bg-red-500"
                      : progressPercent < 85
                      ? "bg-amber-500"
                      : "bg-emerald-600"
                  )}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Department Status Section */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                {
                  dept: "Front Office",
                  status: pendingGuests.length === 0 ? "Ready" : "Warning",
                  blocking: pendingGuests.length > 0 ? `${pendingGuests.length} Check-out(s) pending` : null,
                  completed: "Mandatory charges posted",
                  icon: ClipboardList,
                },
                {
                  dept: "Housekeeping",
                  status: "Ready",
                  blocking: null,
                  completed: "HK minimum targets met",
                  icon: CheckCircle2,
                },
                {
                  dept: "Maintenance",
                  status: "Ready",
                  blocking: null,
                  completed: "Critical repairs resolved",
                  icon: Wrench,
                },
                {
                  dept: "Laundry",
                  status: "Ready",
                  blocking: null,
                  completed: "Laundry balanced",
                  icon: Shirt,
                },
                {
                  dept: "Cashier",
                  status: openShifts.length === 0 ? "Ready" : "Warning",
                  blocking: openShifts.length > 0 ? `${openShifts.length} shift(s) open` : null,
                  completed: "Reconciliation complete",
                  icon: Wallet,
                },
                {
                  dept: "Restaurant",
                  status: openPos.length === 0 ? "Ready" : "Pending",
                  blocking: openPos.length > 0 ? `${openPos.length} POS bills open` : null,
                  completed: "All charges transferred",
                  icon: UtensilsCrossed,
                },
              ].map((d) => {
                const Icon = d.icon;
                return (
                  <div
                    key={d.dept}
                    className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Icon className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-[11px] font-bold text-slate-800">{d.dept}</span>
                      </div>
                      <span
                        className={cn(
                          "rounded px-1 py-0.5 text-[8px] font-extrabold uppercase border",
                          d.status === "Ready"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : d.status === "Blocked"
                            ? "bg-red-50 text-red-800 border-red-100"
                            : "bg-amber-50 text-amber-755 text-amber-700 border-amber-100"
                        )}
                      >
                        {d.status}
                      </span>
                    </div>
                    <div className="text-[10px] space-y-1 font-semibold leading-relaxed">
                      {d.blocking ? (
                        <p className="text-red-600 flex items-start gap-1">
                          <span className="shrink-0 text-red-500">❌</span>
                          <span>{d.blocking}</span>
                        </p>
                      ) : (
                        <p className="text-emerald-700 flex items-start gap-1">
                          <span className="shrink-0 text-emerald-600">✓</span>
                          <span>{d.completed}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Checklist Layout */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Closing Checklist</h3>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase border",
                    blockers.length === 0
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : "bg-amber-50 text-amber-700 border-amber-100",
                  )}
                >
                  {blockers.length === 0
                    ? "Approved"
                    : `${blockers.length} Remaining`}
                </span>
              </div>
              <ul className="divide-y divide-slate-100">
                {checklist.map((item) => {
                  const Icon = statusIcon[item.status];
                  const isAudit = item.id === "audit";
                  return (
                    <li
                      key={item.id}
                      className="flex items-start gap-2.5 py-2.5 bg-white transition-colors"
                    >
                      <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0 p-0.5 rounded border", statusStyle[item.status])} />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-slate-800">{item.label}</p>
                            <span className={cn(
                              "text-[8px] font-bold uppercase px-1 py-0.5 rounded border tracking-wide",
                              isAudit
                                ? "bg-slate-50 text-slate-500 border-slate-200"
                                : "bg-red-50 text-red-600 border-red-100"
                            )}>
                              {isAudit ? "Night Audit" : "Mandatory"}
                            </span>
                          </div>
                          {item.href && (
                            <Link
                              href={item.href}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:underline"
                            >
                              Resolve
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                          <p>{item.detail}</p>
                          <p className="text-[9px] text-slate-400 font-normal">
                            {item.status === "done" ? "Checked" : "Pending"}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Warning Panel */}
            {blockers.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2.5">
                <div className="flex items-center gap-1.5 text-red-750">
                  <AlertCircle className="h-4.5 w-4.5 text-red-650 shrink-0" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Cannot Run Day Closing</h3>
                </div>
                <p className="text-[10px] font-semibold text-slate-500">The following mandatory items must be settled before date rollover:</p>
                <ul className="text-[11px] font-bold text-red-600 pl-6 space-y-1 list-disc leading-relaxed">
                  {blockers.map((b) => (
                    <li key={b.id}>{b.label}: <span className="font-semibold text-slate-500">{b.detail}</span></li>
                  ))}
                </ul>
              </div>
            )}

            {/* Resolve Blocker Cards */}
            {openShifts.length > 0 && (
              <BlockerCard
                icon={Wallet}
                title="Open cashier shifts"
                description="Close and balance each open shift before day end."
              >
                {openShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 font-semibold text-slate-700"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {shift.cashier} · {shift.id}
                      </p>
                      <p className="text-[10px] text-slate-500 font-normal">
                        {shift.shift} · Expected {formatINR(shift.expected)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-emerald-700 hover:bg-emerald-800 text-xs font-semibold h-7.5 px-2.5"
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
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 font-semibold text-slate-700"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {guest.guestName} · Room {guest.roomNo}
                      </p>
                      <p className="text-[10px] text-slate-500 font-normal">
                        Due {guest.checkOut} · Balance {formatINR(guest.balance)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-emerald-700 hover:bg-emerald-800 text-xs font-semibold h-7.5 px-2.5"
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
                  <Button type="button" variant="outline" size="sm" className="text-[11px] font-semibold h-7 px-2" onClick={postAllCharges}>
                    Post all
                  </Button>
                }
              >
                {pendingCharges.map((charge) => (
                  <div
                    key={charge.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 font-semibold text-slate-700"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Room {charge.roomNo} · {charge.guestName}
                      </p>
                      <p className="text-[10px] text-slate-500 font-normal">
                        Rate {formatINR(charge.roomRate)} + extras {formatINR(charge.extras)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-emerald-700 hover:bg-emerald-800 text-xs font-semibold h-7.5 px-2.5"
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
                  <Button type="button" variant="outline" size="sm" className="text-[11px] font-semibold h-7 px-2" onClick={transferAllPos}>
                    Transfer all
                  </Button>
                }
              >
                {openPos.map((tab) => (
                  <div
                    key={tab.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 font-semibold text-slate-700"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {tab.id} · {tab.outlet}
                      </p>
                      <p className="text-[10px] text-slate-500 font-normal">
                        Room {tab.roomNo} · {tab.guestName} · {formatINR(tab.amount)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-emerald-700 hover:bg-emerald-800 text-xs font-semibold h-7.5 px-2.5"
                      onClick={() => transferPos(tab.id)}
                    >
                      Transfer
                    </Button>
                  </div>
                ))}
              </BlockerCard>
            )}
          </div>

          <div className="space-y-4 xl:col-span-2">
            {/* Financial Summary Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                Financial Summary
              </h3>
              <div className="divide-y divide-slate-100 font-semibold text-slate-750 text-[11px]">
                <SummaryRow label="Cash Revenue" value={formatINR(summary.roomRevenue * 0.45)} />
                <SummaryRow label="Card Revenue" value={formatINR(summary.roomRevenue * 0.35)} />
                <SummaryRow label="UPI Revenue" value={formatINR(summary.fbRevenue + summary.otherRevenue)} />
                <SummaryRow label="Bank Transfer" value={formatINR(summary.roomRevenue * 0.20)} />
                <SummaryRow label="Refund" value={formatINR(-500)} />
                <SummaryRow label="Outstanding Balance" value={formatINR(pendingGuests.length > 0 ? 2400 : 0)} />
                <SummaryRow
                  label="Total Revenue"
                  value={formatINR(summary.totalRevenue)}
                  highlight
                />
              </div>
            </div>

            {/* Operational Summary */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                Operational Summary
              </h3>
              <div className="divide-y divide-slate-100 font-semibold text-slate-750 text-[11px]">
                <SummaryRow label="Total Rooms Occupied" value={String(summary.inHouse)} />
                <SummaryRow label="Vacant Rooms" value="12" />
                <SummaryRow label="Dirty Rooms" value="3" />
                <SummaryRow label="Clean Rooms" value="9" />
                <SummaryRow label="Out of Order (OOO)" value="1" />
                <SummaryRow label="Laundry Pending Items" value="0" />
                <SummaryRow label="Luggage Pending Jobs" value="0" />
              </div>
            </div>

            {/* Reports Section */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                Reports To Be Generated
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "Revenue Report",
                  "Occupancy Report",
                  "Housekeeping Report",
                  "Cashier Report",
                  "Arrival Report",
                  "Departure Report",
                  "Manager Summary",
                ].map((rep) => (
                  <div key={rep} className="rounded border border-slate-150 p-2 flex items-center justify-between text-[10px] font-bold bg-slate-50/50">
                    <div className="flex items-center gap-1 text-slate-700">
                      <FileText className="h-3.5 w-3.5 text-slate-400" />
                      <span>{rep}</span>
                    </div>
                    {state.completed ? (
                      <span className="rounded bg-emerald-50 text-emerald-800 border border-emerald-100 px-1 py-0.5 text-[8px] font-extrabold uppercase">
                        Generated
                      </span>
                    ) : (
                      <span className="rounded bg-slate-100 text-slate-500 border border-slate-200 px-1 py-0.5 text-[8px] font-extrabold uppercase">
                        Pending
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={runClosing}
        title="Run Day Closing?"
        message={`This action will:
✓ Lock today's operational transactions
✓ Generate operational reports
✓ Enable Night Audit
✓ Prepare Business Date rollover for ${formatBusinessDate(summary.businessDate)}.`}
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
    <div className="rounded-xl border border-slate-200 bg-amber-50/15 p-4">
      <div className="mb-2.5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex h-7.5 w-7.5 items-center justify-center rounded bg-amber-100 text-amber-700">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{title}</h3>
            <p className="text-[10px] text-slate-500 font-semibold">{description}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
