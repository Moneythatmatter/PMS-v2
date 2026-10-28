"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Banknote,
  CheckCircle2,
  Clock,
  Hourglass,
  Loader2,
  LockKeyhole,
  Play,
  Search,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { KpiCard } from "@/components/accounts/KpiCard";
import {
  AlertBanner,
  FOPageHeader,
  FormField,
  TextAreaInput,
  TextInput,
  formatINR,
} from "@/components/frontoffice/ui";
import {
  cashierSessionService,
  type CashierSession,
  type CashierSessionDetail,
} from "@/services/front-office/cashier-sessions";
import { cn } from "@/lib/utils";

export type CashierDeskMode = "start" | "session" | "closing" | "history" | "approvals";

const LINKS: { href: string; label: string; modes: CashierDeskMode[] }[] = [
  { href: "/frontoffice/cashier/session", label: "My Shift", modes: ["start", "session", "closing"] },
  { href: "/frontoffice/cashier/history", label: "History & Approvals", modes: ["history", "approvals"] },
];

const SHIFTS = ["Morning", "Evening", "Night", "General"];

type Drafts = Record<string, { actual: string; remarks: string }>;

function when(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function draftsFrom(detail: CashierSessionDetail): Drafts {
  return Object.fromEntries(
    detail.lines.map((line) => [
      line.paymentMethod,
      { actual: line.actualAmount == null ? "" : String(line.actualAmount), remarks: line.remarks ?? "" },
    ]),
  );
}

function DeskNav({ mode }: { mode: CashierDeskMode }) {
  return (
    <div className="flex flex-wrap gap-2">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold",
            link.modes.includes(mode) ? "bg-emerald-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200",
          )}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

function Variance({ value }: { value: number | null }) {
  if (value == null) return <span className="text-slate-400">—</span>;
  if (Math.abs(value) < 0.005) {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" /> Matched
      </span>
    );
  }
  return value > 0 ? (
    <span className="font-semibold text-amber-700">+{formatINR(value)} excess</span>
  ) : (
    <span className="font-semibold text-red-600">−{formatINR(Math.abs(value))} short</span>
  );
}

export function CashierDeskView({ mode }: { mode: CashierDeskMode }) {
  const isShiftPage = mode === "start" || mode === "session" || mode === "closing";
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [detail, setDetail] = useState<CashierSessionDetail | null>(null);
  const [history, setHistory] = useState<CashierSession[]>([]);
  const [shiftName, setShiftName] = useState("Morning");
  const [openingCash, setOpeningCash] = useState("");
  const [openingRemarks, setOpeningRemarks] = useState("");
  const [closingRemarks, setClosingRemarks] = useState("");
  const [drafts, setDrafts] = useState<Drafts>({});
  const [closingOpen, setClosingOpen] = useState(mode === "closing");

  const loadDetail = (full: CashierSessionDetail) => {
    setDetail(full);
    setClosingRemarks(full.session.closingRemarks ?? "");
    setDrafts(draftsFrom(full));
    if (full.session.status === "Rejected" || full.lines.some((l) => l.actualAmount != null)) setClosingOpen(true);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!isShiftPage) {
          const rows = await cashierSessionService.list();
          if (!cancelled) setHistory(rows);
        } else {
          const session = await cashierSessionService.active();
          if (cancelled) return;
          if (session) {
            const full = await cashierSessionService.get(session.id);
            if (!cancelled) loadDetail(full);
          } else {
            const rows = await cashierSessionService.list().catch(() => [] as CashierSession[]);
            if (!cancelled) setHistory(rows);
          }
        }
        if (!cancelled) setError(null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load the cashier desk");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, isShiftPage]);

  function payloadFromDrafts() {
    return {
      closingRemarks,
      lines: (detail?.lines ?? []).map((line) => ({
        paymentMethod: line.paymentMethod,
        actualAmount: drafts[line.paymentMethod]?.actual === "" ? null : Number(drafts[line.paymentMethod]?.actual),
        remarks: drafts[line.paymentMethod]?.remarks ?? "",
      })),
    };
  }

  async function startShift() {
    const amount = Number(openingCash || 0);
    if (!Number.isFinite(amount) || amount < 0) {
      setError("Enter a valid opening cash amount.");
      return;
    }
    setBusy(true);
    try {
      const created = await cashierSessionService.start({ shiftName, openingCash: amount, openingRemarks });
      loadDetail(created);
      setClosingOpen(false);
      setOpeningCash("");
      setOpeningRemarks("");
      setToast(`${created.session.shiftName} shift started.`);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the shift");
    } finally {
      setBusy(false);
    }
  }

  async function saveOrSubmit(kind: "save" | "submit") {
    if (!detail) return;
    const lines = payloadFromDrafts().lines;
    if (kind === "submit" && lines.some((l) => l.actualAmount == null)) {
      setError("Enter the counted amount for every payment method (use 0 if none) before submitting.");
      return;
    }
    if (lines.some((l) => l.actualAmount != null && (!Number.isFinite(l.actualAmount) || l.actualAmount < 0))) {
      setError("Counted amounts must be valid numbers of 0 or more.");
      return;
    }
    setBusy(true);
    try {
      const body = payloadFromDrafts();
      const rejected = detail.session.status === "Rejected";
      const next =
        kind === "save" && !rejected
          ? await cashierSessionService.saveClosing(detail.session.id, body)
          : rejected
            ? await cashierSessionService.resubmit(detail.session.id, body)
            : await cashierSessionService.submit(detail.session.id, body);
      setDetail(next);
      setDrafts(draftsFrom(next));
      setToast(kind === "save" && !rejected ? "Count saved." : "Closing submitted for manager approval.");
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the closing");
    } finally {
      setBusy(false);
    }
  }

  const title = isShiftPage ? "My Cashier Shift" : "Shift History & Approvals";
  const description = isShiftPage
    ? "Start your shift, watch collections as they are posted, then count and submit your closing — all on one page."
    : "Every cashier shift at this property. Review submitted closings and approve them or send them back.";

  return (
    <div className="space-y-5">
      {toast && <AlertBanner variant="success" message={toast} onDismiss={() => setToast(null)} />}
      {error && <AlertBanner variant="error" message={error} onDismiss={() => setError(null)} />}
      <FOPageHeader eyebrow="Front Office" title={title} description={description} action={<DeskNav mode={mode} />} />
      {loading ? (
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </p>
      ) : null}

      {!loading && isShiftPage && !detail && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <StartShiftCard
            shiftName={shiftName}
            openingCash={openingCash}
            openingRemarks={openingRemarks}
            busy={busy}
            onShift={setShiftName}
            onCash={setOpeningCash}
            onRemarks={setOpeningRemarks}
            onStart={startShift}
          />
          <div className="space-y-4">
            <ShiftGuide />
            <RecentShifts rows={history.slice(0, 5)} />
          </div>
        </div>
      )}

      {!loading && isShiftPage && detail && (
        <ShiftPanel
          detail={detail}
          drafts={drafts}
          closingRemarks={closingRemarks}
          closingOpen={closingOpen}
          busy={busy}
          onOpenClosing={() => setClosingOpen(true)}
          onCancelClosing={() => {
            setDrafts(draftsFrom(detail));
            setClosingOpen(false);
          }}
          onRemarks={setClosingRemarks}
          onDraft={(method, patch) => setDrafts((current) => ({ ...current, [method]: { ...current[method], ...patch } }))}
          onSave={() => saveOrSubmit("save")}
          onSubmit={() => saveOrSubmit("submit")}
          onStartNext={() => {
            setDetail(null);
            setClosingOpen(false);
            void cashierSessionService.list().then(setHistory).catch(() => undefined);
          }}
        />
      )}

      {!loading && !isShiftPage && (
        <ReviewPanel
          rows={history}
          initialFilter={mode === "approvals" ? "Pending Approval" : "All"}
          onToast={setToast}
          onError={setError}
          onReload={() => cashierSessionService.list().then(setHistory)}
        />
      )}
    </div>
  );
}

function StartShiftCard({
  shiftName,
  openingCash,
  openingRemarks,
  busy,
  onShift,
  onCash,
  onRemarks,
  onStart,
}: {
  shiftName: string;
  openingCash: string;
  openingRemarks: string;
  busy: boolean;
  onShift: (v: string) => void;
  onCash: (v: string) => void;
  onRemarks: (v: string) => void;
  onStart: () => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
      <div className="flex items-center gap-3 bg-emerald-700 px-5 py-4 text-white">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
          <Play className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-sm font-bold">Start your shift</h2>
          <p className="text-[11px] text-white/80">
            You have no open shift. Count the float in your drawer, then start.
          </p>
        </div>
        <span className="ml-auto hidden text-right text-[11px] text-white/80 sm:block">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>

      <div className="flex-1 space-y-5 px-5 py-5">
        <FormField label="Shift">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SHIFTS.map((shift) => (
              <button
                key={shift}
                type="button"
                onClick={() => onShift(shift)}
                className={cn(
                  "h-11 rounded-xl border text-sm font-semibold transition-colors cursor-pointer",
                  shiftName === shift
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                )}
              >
                {shift}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="Opening cash in drawer">
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-semibold text-slate-400">
              ₹
            </span>
            <TextInput
              value={openingCash}
              onChange={(e) => onCash(e.target.value)}
              inputMode="decimal"
              placeholder="0.00"
              className="h-12 pl-9 text-lg font-bold tabular-nums"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[0, 5000, 10000, 20000, 50000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => onCash(String(amt))}
                className={cn(
                  "rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors cursor-pointer",
                  openingCash === String(amt)
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                )}
              >
                {formatINR(amt)}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="Remarks">
          <TextAreaInput
            value={openingRemarks}
            onChange={(e) => onRemarks(e.target.value)}
            rows={3}
            placeholder="Optional — e.g. float received from previous shift"
          />
        </FormField>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3">
        <p className="text-[11px] text-slate-500">
          {shiftName} shift · opening {formatINR(Number(openingCash || 0))}
        </p>
        <Button onClick={onStart} disabled={busy} className="!bg-[#0F8A5F] px-5 text-white">
          {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Play className="mr-1.5 h-4 w-4" />}
          Start shift
        </Button>
      </div>
    </div>
  );
}

function ShiftGuide() {
  const steps = [
    { icon: Play, title: "Start shift", note: "Choose the shift and enter the float in your drawer." },
    { icon: Banknote, title: "Collect payments", note: "Payments posted in Front Office add up here automatically." },
    { icon: LockKeyhole, title: "Close & count", note: "Enter what you actually hold for each payment method." },
    { icon: CheckCircle2, title: "Manager approval", note: "Your closing is reviewed, then approved or sent back." },
  ];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <h3 className="text-sm font-bold text-slate-900">How a shift works</h3>
      <ol className="mt-4 space-y-4">
        {steps.map((s, i) => (
          <li key={s.title} className="relative flex gap-3">
            {i < steps.length - 1 && <span className="absolute left-4 top-9 h-[calc(100%-1rem)] w-px bg-slate-200" />}
            <span
              className={cn(
                "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                i === 0 ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-500",
              )}
            >
              <s.icon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-semibold text-slate-900">
                {i + 1}. {s.title}
              </p>
              <p className="text-[11px] text-slate-500">{s.note}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function statusChip(status: string) {
  const cls =
    status === "Closed"
      ? "bg-emerald-50 text-emerald-700"
      : status === "Pending Approval"
        ? "bg-amber-50 text-amber-700"
        : status === "Rejected"
          ? "bg-rose-50 text-rose-700"
          : "bg-sky-50 text-sky-700";
  return <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", cls)}>{status}</span>;
}

function RecentShifts({ rows }: { rows: CashierSession[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
        <h3 className="text-sm font-bold text-slate-900">Recent shifts</h3>
        <Link href="/frontoffice/cashier/history" className="text-[11px] font-semibold text-emerald-700 hover:underline">
          View all
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-6 text-center text-xs text-slate-400">No shifts recorded yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-xs">
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">
                  {row.cashierName || "Unknown cashier"} <span className="font-normal text-slate-400">· {row.shiftName}</span>
                </p>
                <p className="truncate text-[11px] text-slate-500">{when(row.openedAt)}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {statusChip(row.status)}
                <span className="text-[11px]">
                  <Variance value={row.cashVariance == null ? null : Number(row.cashVariance)} />
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ShiftPanel({
  detail,
  drafts,
  closingRemarks,
  closingOpen,
  busy,
  onOpenClosing,
  onCancelClosing,
  onRemarks,
  onDraft,
  onSave,
  onSubmit,
  onStartNext,
}: {
  detail: CashierSessionDetail;
  drafts: Drafts;
  closingRemarks: string;
  closingOpen: boolean;
  busy: boolean;
  onOpenClosing: () => void;
  onCancelClosing: () => void;
  onRemarks: (value: string) => void;
  onDraft: (method: string, patch: Partial<{ actual: string; remarks: string }>) => void;
  onSave: () => void;
  onSubmit: () => void;
  onStartNext: () => void;
}) {
  const { session, lines } = detail;
  const status = session.status;
  const locked = status === "Pending Approval" || status === "Closed";
  const rejected = status === "Rejected";
  const counting = closingOpen && !locked;
  const showCount = counting || locked;
  const rejectReason = [...detail.audits].reverse().find((a) => a.action === "reject")?.remarks;

  const cash = lines.find((l) => l.paymentMethod === "Cash");
  const received = lines.reduce((s, l) => s + Number(l.totalReceived || 0), 0);
  const refunded = lines.reduce((s, l) => s + Number(l.totalRefunded || 0), 0);
  const paidOut = lines.reduce((s, l) => s + Number(l.totalPaidOut || 0), 0);
  const expected = lines.reduce((s, l) => s + Number(l.expectedAmount || 0), 0);
  const counted = lines.reduce((s, l) => {
    const v = drafts[l.paymentMethod]?.actual ?? "";
    return v === "" ? s : s + Number(v || 0);
  }, 0);
  const anyCounted = lines.some((l) => (drafts[l.paymentMethod]?.actual ?? "") !== "");

  const th = "px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500";
  const td = "px-3 py-2.5";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Opening cash"
          value={formatINR(Number(session.openingCash || 0))}
          note={`Opened ${when(session.openedAt)}`}
          icon={Wallet}
          tone="slate"
        />
        <KpiCard
          label="Collected this shift"
          value={formatINR(received)}
          note={refunded || paidOut ? `Refunds ${formatINR(refunded)} · Paid out ${formatINR(paidOut)}` : "All payment methods"}
          icon={Banknote}
          tone="sky"
        />
        <KpiCard
          label="Cash expected in drawer"
          value={formatINR(cash?.expectedAmount ?? 0)}
          note="Opening + cash in − cash out"
          icon={Clock}
          tone="emerald"
        />
        <KpiCard
          label={`${session.shiftName} shift`}
          value={status}
          note={locked ? "Read only" : rejected ? "Needs correction" : "Collections are live"}
          icon={locked ? LockKeyhole : rejected ? XCircle : Hourglass}
          tone={rejected ? "rose" : locked ? "amber" : "emerald"}
          strong={rejected}
        />
      </div>

      {rejected && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
          <p className="font-bold">Your closing was sent back by the manager.</p>
          {rejectReason && <p className="mt-0.5">Reason: {rejectReason}</p>}
          <p className="mt-0.5 text-rose-700">Correct the count below and resubmit. The earlier submission stays in the audit history.</p>
        </div>
      )}
      {status === "Pending Approval" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <span>
            <span className="font-bold">Closing submitted — awaiting manager approval.</span> This shift is now read only.
          </span>
          <Button size="sm" onClick={onStartNext} className="!bg-[#0F8A5F] text-white">
            <Play className="mr-1 h-3.5 w-3.5" /> Start next shift
          </Button>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {showCount ? "Closing count" : "Collections by payment method"}
            </h2>
            <p className="text-[11px] text-slate-500">
              {showCount
                ? "Enter what you actually have for each method. Variance is worked out against the expected amount."
                : "Amounts come from payments already posted in Front Office during this shift."}
            </p>
          </div>
          {!locked && !closingOpen && (
            <Button onClick={onOpenClosing} className="!bg-[#0F8A5F] text-white">
              <LockKeyhole className="mr-1.5 h-4 w-4" /> Close shift
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className={th}>Method</th>
                <th className={cn(th, "text-right")}>Received</th>
                <th className={cn(th, "text-right")}>Refunded</th>
                <th className={cn(th, "text-right")}>Paid out</th>
                <th className={cn(th, "text-right")}>Expected</th>
                {showCount && (
                  <>
                    <th className={cn(th, "w-36")}>Counted</th>
                    <th className={th}>Variance</th>
                    <th className={th}>Remarks</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lines.map((line) => {
                const actual = drafts[line.paymentMethod]?.actual ?? "";
                const variance = actual === "" ? null : Number(actual) - Number(line.expectedAmount);
                return (
                  <tr key={line.paymentMethod}>
                    <td className={cn(td, "font-semibold text-slate-900")}>
                      {line.paymentMethod}
                      {line.paymentMethod === "Cash" && (
                        <p className="text-[10px] font-normal text-slate-400">Opening {formatINR(line.openingAmount)}</p>
                      )}
                    </td>
                    <td className={cn(td, "text-right tabular-nums")}>{formatINR(line.totalReceived)}</td>
                    <td className={cn(td, "text-right tabular-nums")}>{formatINR(line.totalRefunded)}</td>
                    <td className={cn(td, "text-right tabular-nums")}>{formatINR(line.totalPaidOut)}</td>
                    <td className={cn(td, "text-right font-semibold tabular-nums")}>{formatINR(line.expectedAmount)}</td>
                    {showCount && (
                      <>
                        <td className={td}>
                          <TextInput
                            value={actual}
                            disabled={locked}
                            inputMode="decimal"
                            placeholder="0.00"
                            onChange={(e) => onDraft(line.paymentMethod, { actual: e.target.value })}
                            className="h-9 w-32 text-right tabular-nums"
                          />
                        </td>
                        <td className={td}>
                          <Variance value={variance} />
                        </td>
                        <td className={td}>
                          <TextInput
                            value={drafts[line.paymentMethod]?.remarks ?? ""}
                            disabled={locked}
                            placeholder={variance != null && Math.abs(variance) >= 0.005 ? "Explain the difference" : ""}
                            onChange={(e) => onDraft(line.paymentMethod, { remarks: e.target.value })}
                            className="h-9 w-48"
                          />
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold text-slate-900">
                <td className={td}>Total</td>
                <td className={cn(td, "text-right tabular-nums")}>{formatINR(received)}</td>
                <td className={cn(td, "text-right tabular-nums")}>{formatINR(refunded)}</td>
                <td className={cn(td, "text-right tabular-nums")}>{formatINR(paidOut)}</td>
                <td className={cn(td, "text-right tabular-nums")}>{formatINR(expected)}</td>
                {showCount && (
                  <>
                    <td className={cn(td, "pr-6 text-right tabular-nums")}>{anyCounted ? formatINR(counted) : "—"}</td>
                    <td className={td}>
                      <Variance value={anyCounted ? counted - expected : null} />
                    </td>
                    <td className={td} />
                  </>
                )}
              </tr>
            </tfoot>
          </table>
        </div>

        {showCount && (
          <div className="space-y-3 border-t border-slate-200 px-4 py-4 sm:px-5">
            <FormField label="Closing remarks">
              <TextAreaInput
                value={closingRemarks}
                disabled={locked}
                onChange={(e) => onRemarks(e.target.value)}
                rows={2}
                placeholder="Optional — handover notes for the manager"
              />
            </FormField>
            {!locked && (
              <div className="flex flex-wrap items-center justify-end gap-2">
                {!rejected && (
                  <Button variant="outline" onClick={onCancelClosing} disabled={busy}>
                    Back to live view
                  </Button>
                )}
                {!rejected && (
                  <Button variant="outline" onClick={onSave} disabled={busy}>
                    Save count
                  </Button>
                )}
                <Button className="!bg-[#0F8A5F] text-white" onClick={onSubmit} disabled={busy}>
                  {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                  {rejected ? "Resubmit for approval" : "Submit for approval"}
                </Button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

const REVIEW_FILTERS = ["All", "Pending Approval", "Open", "Rejected", "Closed"] as const;
type ReviewFilter = (typeof REVIEW_FILTERS)[number];

function ReviewPanel({
  rows,
  initialFilter,
  onToast,
  onError,
  onReload,
}: {
  rows: CashierSession[];
  initialFilter: ReviewFilter;
  onToast: (msg: string) => void;
  onError: (msg: string | null) => void;
  onReload: () => Promise<unknown>;
}) {
  const [filter, setFilter] = useState<ReviewFilter>(initialFilter);
  const [query, setQuery] = useState("");
  const [cashierFilter, setCashierFilter] = useState("");
  const cashiers = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of rows) m.set(r.cashierId, r.cashierName || "Unknown cashier");
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [rows]);
  const [viewId, setViewId] = useState<string | null>(null);
  const [view, setView] = useState<CashierSessionDetail | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: rows.length };
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);

  const totalVariance = rows
    .filter((r) => r.status === "Closed" && r.cashVariance != null)
    .reduce((s, r) => s + Number(r.cashVariance), 0);

  const filtered = rows.filter((r) => {
    if (filter !== "All" && r.status !== filter) return false;
    if (cashierFilter && r.cashierId !== cashierFilter) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [r.cashierName, r.cashierEmail, r.shiftName, r.status, when(r.openedAt), r.closingRemarks]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  const openView = async (id: string) => {
    setViewId(id);
    setView(null);
    try {
      setView(await cashierSessionService.get(id));
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not load the shift");
      setViewId(null);
    }
  };

  const approve = async (id: string) => {
    setBusyId(id);
    try {
      await cashierSessionService.approve(id);
      await onReload();
      onToast("Closing approved — shift closed.");
      onError(null);
      setViewId(null);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not approve the closing");
    } finally {
      setBusyId(null);
    }
  };

  const reject = async () => {
    if (!rejectId) return;
    if (!rejectNote.trim()) {
      onError("Enter a reason before rejecting the closing.");
      return;
    }
    setBusyId(rejectId);
    try {
      await cashierSessionService.reject(rejectId, rejectNote.trim());
      await onReload();
      onToast("Closing sent back to the cashier.");
      onError(null);
      setRejectId(null);
      setRejectNote("");
      setViewId(null);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not reject the closing");
    } finally {
      setBusyId(null);
    }
  };

  const actionButtons = (row: CashierSession) =>
    row.status === "Pending Approval" ? (
      <div className="flex justify-end gap-1.5">
        <Button
          size="sm"
          className="h-7 !bg-[#0F8A5F] px-2.5 text-[11px] text-white"
          disabled={busyId === row.id}
          onClick={(e) => {
            e.stopPropagation();
            void approve(row.id);
          }}
        >
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2.5 text-[11px] text-rose-700"
          disabled={busyId === row.id}
          onClick={(e) => {
            e.stopPropagation();
            setRejectId(row.id);
          }}
        >
          Reject
        </Button>
      </div>
    ) : (
      <span className="text-[11px] font-semibold text-emerald-700">View</span>
    );

  const th = "px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500";
  const td = "px-3 py-2.5";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Awaiting approval"
          value={String(counts["Pending Approval"] ?? 0)}
          note="Closings to review"
          icon={Hourglass}
          tone="amber"
          strong={(counts["Pending Approval"] ?? 0) > 0}
        />
        <KpiCard label="Open shifts" value={String(counts.Open ?? 0)} note="Cashiers on duty" icon={Clock} tone="sky" />
        <KpiCard
          label="Sent back"
          value={String(counts.Rejected ?? 0)}
          note="Waiting for correction"
          icon={XCircle}
          tone="rose"
        />
        <KpiCard
          label="Closed shifts"
          value={String(counts.Closed ?? 0)}
          note={`Net cash variance ${totalVariance >= 0 ? "+" : "−"}${formatINR(Math.abs(totalVariance))}`}
          icon={CheckCircle2}
          tone="emerald"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="relative min-w-[220px] flex-1 lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cashier, shift, date, remarks…"
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-8 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <select
            value={cashierFilter}
            onChange={(e) => setCashierFilter(e.target.value)}
            className="h-8 rounded-full border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none"
          >
            <option value="">All cashiers</option>
            {cashiers.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          {REVIEW_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[11px] font-semibold transition-colors cursor-pointer",
                filter === f
                  ? "border-emerald-700 bg-emerald-700 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
              )}
            >
              {f === "Pending Approval" ? "Awaiting approval" : f}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px]",
                  filter === f ? "bg-white/20" : "bg-slate-100 text-slate-500",
                )}
              >
                {counts[f] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {filtered.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-500">
            {rows.length === 0 ? "No cashier shifts yet." : "No shifts match these filters."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className={th}>Cashier</th>
                  <th className={th}>Shift</th>
                  <th className={th}>Opened</th>
                  <th className={th}>Closed</th>
                  <th className={cn(th, "text-right")}>Opening cash</th>
                  <th className={cn(th, "text-right")}>Cash expected</th>
                  <th className={cn(th, "text-right")}>Cash counted</th>
                  <th className={th}>Variance</th>
                  <th className={th}>Status</th>
                  <th className={cn(th, "text-right")}>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => void openView(row.id)}
                    className={cn(
                      "cursor-pointer hover:bg-slate-50",
                      row.status === "Pending Approval" && "bg-amber-50/40",
                    )}
                  >
                    <td className={td}>
                      <CashierCell name={row.cashierName} email={row.cashierEmail} />
                    </td>
                    <td className={cn(td, "font-semibold text-slate-900")}>{row.shiftName}</td>
                    <td className={td}>{when(row.openedAt)}</td>
                    <td className={td}>
                      {when(row.closedAt)}
                      {row.approvedByName && (
                        <p className="text-[10px] text-slate-400">Approved by {row.approvedByName}</p>
                      )}
                    </td>
                    <td className={cn(td, "text-right tabular-nums")}>{formatINR(Number(row.openingCash || 0))}</td>
                    <td className={cn(td, "text-right tabular-nums")}>
                      {row.closingCashExpected == null ? "—" : formatINR(Number(row.closingCashExpected))}
                    </td>
                    <td className={cn(td, "text-right tabular-nums")}>
                      {row.closingCashActual == null ? "—" : formatINR(Number(row.closingCashActual))}
                    </td>
                    <td className={td}>
                      <Variance value={row.cashVariance == null ? null : Number(row.cashVariance)} />
                    </td>
                    <td className={td}>{statusChip(row.status)}</td>
                    <td className={td}>{actionButtons(row)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {viewId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" onClick={() => setViewId(null)}>
          <div
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {view ? `${view.session.cashierName || "Unknown cashier"} · ${view.session.shiftName} shift` : "Loading shift…"}
                </h3>
                {view && (
                  <p className="text-[11px] text-slate-500">
                    Opened {when(view.session.openedAt)} · Closed {when(view.session.closedAt)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {view && statusChip(view.session.status)}
                <button type="button" onClick={() => setViewId(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {!view ? (
                <p className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    {[
                      { label: "Cashier", value: view.session.cashierName, sub: view.session.cashierEmail },
                      { label: "Opening cash", value: formatINR(Number(view.session.openingCash || 0)), sub: when(view.session.openedAt) },
                      { label: "Submitted by", value: view.session.closedByName, sub: when(view.session.closedAt) },
                      { label: "Approved by", value: view.session.approvedByName, sub: view.session.approvedAt ? when(view.session.approvedAt) : null },
                    ].map((p) => (
                      <div key={p.label} className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{p.label}</p>
                        <p className="mt-0.5 truncate font-semibold text-slate-900">{p.value || "—"}</p>
                        {p.sub && p.sub !== "—" && <p className="truncate text-[11px] text-slate-500">{p.sub}</p>}
                      </div>
                    ))}
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className={th}>Method</th>
                          <th className={cn(th, "text-right")}>Received</th>
                          <th className={cn(th, "text-right")}>Refunded</th>
                          <th className={cn(th, "text-right")}>Expected</th>
                          <th className={cn(th, "text-right")}>Counted</th>
                          <th className={th}>Variance</th>
                          <th className={th}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {view.lines.map((l) => (
                          <tr key={l.paymentMethod}>
                            <td className={cn(td, "font-semibold")}>{l.paymentMethod}</td>
                            <td className={cn(td, "text-right tabular-nums")}>{formatINR(l.totalReceived)}</td>
                            <td className={cn(td, "text-right tabular-nums")}>{formatINR(l.totalRefunded)}</td>
                            <td className={cn(td, "text-right tabular-nums")}>{formatINR(l.expectedAmount)}</td>
                            <td className={cn(td, "text-right tabular-nums")}>
                              {l.actualAmount == null ? "—" : formatINR(l.actualAmount)}
                            </td>
                            <td className={td}>
                              <Variance value={l.actualAmount == null ? null : l.actualAmount - l.expectedAmount} />
                            </td>
                            <td className={cn(td, "text-slate-500")}>{l.remarks || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {(view.session.openingRemarks || view.session.closingRemarks) && (
                    <div className="grid gap-3 text-xs sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Opening remarks</p>
                        <p className="mt-1 text-slate-700">{view.session.openingRemarks || "—"}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Closing remarks</p>
                        <p className="mt-1 text-slate-700">{view.session.closingRemarks || "—"}</p>
                      </div>
                    </div>
                  )}
                  {view.audits.length > 0 && (
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Activity</p>
                      <ul className="space-y-1.5 text-xs">
                        {view.audits.map((a) => (
                          <li key={a.id} className="flex flex-wrap items-baseline gap-x-2 text-slate-600">
                            <span className="text-[11px] text-slate-400">{when(a.createdAt)}</span>
                            <span className="font-semibold capitalize text-slate-800">{a.action}</span>
                            {a.actorName && <span className="text-slate-500">by {a.actorName}</span>}
                            {a.toStatus && <span>→ {a.toStatus}</span>}
                            {a.remarks && <span className="text-slate-500">· {a.remarks}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
            {view?.session.status === "Pending Approval" && (
              <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
                <Button variant="outline" className="text-rose-700" onClick={() => setRejectId(view.session.id)}>
                  Reject
                </Button>
                <Button
                  className="!bg-[#0F8A5F] text-white"
                  disabled={busyId === view.session.id}
                  onClick={() => void approve(view.session.id)}
                >
                  Approve closing
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {rejectId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4" onClick={() => setRejectId(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-900">Send closing back to cashier</h3>
            <p className="mt-0.5 text-[11px] text-slate-500">The cashier will see this reason and must correct the count.</p>
            <TextAreaInput
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={3}
              placeholder="e.g. Card total does not match the EDC settlement slip"
              className="mt-3"
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectId(null)}>
                Cancel
              </Button>
              <Button className="!bg-rose-600 text-white" disabled={busyId === rejectId} onClick={() => void reject()}>
                Reject closing
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CashierCell({ name, email }: { name?: string | null; email?: string | null }) {
  const label = name || "Unknown cashier";
  const initials = label
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-800">
        {initials}
      </span>
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-900">{label}</p>
        {email && <p className="truncate text-[10px] text-slate-400">{email}</p>}
      </div>
    </div>
  );
}
