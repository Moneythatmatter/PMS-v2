"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import {
  AlertBanner,
  FOPageHeader,
  FormField,
  SelectInput,
  TextAreaInput,
  TextInput,
  formatINR,
} from "@/components/frontoffice/ui";
import {
  cashierSessionService,
  type CashierLine,
  type CashierSession,
  type CashierSessionDetail,
} from "@/services/front-office/cashier-sessions";
import { cn } from "@/lib/utils";

export type CashierDeskMode = "start" | "session" | "closing" | "history" | "approvals";

const LINKS: { href: string; label: string; mode: CashierDeskMode }[] = [
  { href: "/frontoffice/cashier/start", label: "Start Shift", mode: "start" },
  { href: "/frontoffice/cashier/session", label: "Active Session", mode: "session" },
  { href: "/frontoffice/cashier/closing", label: "Closing", mode: "closing" },
  { href: "/frontoffice/cashier/history", label: "History", mode: "history" },
  { href: "/frontoffice/cashier/approvals", label: "Approvals", mode: "approvals" },
];

const SHIFTS = ["Morning", "Evening", "Night", "General"];

function when(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
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
            mode === link.mode ? "bg-emerald-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200",
          )}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

export function CashierDeskView({ mode }: { mode: CashierDeskMode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [active, setActive] = useState<CashierSession | null>(null);
  const [detail, setDetail] = useState<CashierSessionDetail | null>(null);
  const [history, setHistory] = useState<CashierSession[]>([]);
  const [pending, setPending] = useState<CashierSession[]>([]);
  const [shiftName, setShiftName] = useState("Morning");
  const [openingCash, setOpeningCash] = useState("0");
  const [openingRemarks, setOpeningRemarks] = useState("");
  const [closingRemarks, setClosingRemarks] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [drafts, setDrafts] = useState<Record<string, { actual: string; remarks: string }>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (mode === "history") {
          const rows = await cashierSessionService.list();
          if (!cancelled) setHistory(rows);
        } else if (mode === "approvals") {
          const rows = await cashierSessionService.list("Pending Approval");
          if (!cancelled) setPending(rows);
        } else {
          const session = await cashierSessionService.active();
          if (cancelled) return;
          setActive(session);
          if (session && (mode === "session" || mode === "closing")) {
            const full = await cashierSessionService.get(session.id);
            if (!cancelled) {
              setDetail(full);
              setClosingRemarks(full.session.closingRemarks ?? "");
              setDrafts(
                Object.fromEntries(
                  full.lines.map((line) => [
                    line.paymentMethod,
                    {
                      actual: line.actualAmount == null ? "" : String(line.actualAmount),
                      remarks: line.remarks ?? "",
                    },
                  ]),
                ),
              );
            }
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
  }, [mode]);

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
    try {
      const created = await cashierSessionService.start({
        shiftName,
        openingCash: Number(openingCash || 0),
        openingRemarks,
      });
      setToast(`${created.session.shiftName} shift started.`);
      setActive(created.session);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the shift");
    }
  }

  async function saveOrSubmit(kind: "save" | "submit" | "resubmit") {
    if (!detail) return;
    try {
      const body = payloadFromDrafts();
      const next =
        kind === "save"
          ? await cashierSessionService.saveClosing(detail.session.id, body)
          : kind === "resubmit"
            ? await cashierSessionService.resubmit(detail.session.id, body)
            : await cashierSessionService.submit(detail.session.id, body);
      setDetail(next);
      setToast(kind === "save" ? "Count saved." : "Closing submitted for approval.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the closing");
    }
  }

  async function decide(id: string, action: "approve" | "reject") {
    try {
      if (action === "reject" && !rejectNote.trim()) {
        setError("Enter a reason before rejecting the closing.");
        return;
      }
      await (action === "approve"
        ? cashierSessionService.approve(id)
        : cashierSessionService.reject(id, rejectNote));
      setPending((rows) => rows.filter((row) => row.id !== id));
      setToast(action === "approve" ? "Shift closed." : "Closing sent back to the cashier.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the closing");
    }
  }

  const title =
    mode === "start"
      ? "Start Shift"
      : mode === "session"
        ? "Active Cashier Session"
        : mode === "closing"
          ? "Cashier Closing"
          : mode === "history"
            ? "Closing History"
            : "Manager Approval";

  return (
    <div className="space-y-5">
      {toast && <AlertBanner variant="success" message={toast} onDismiss={() => setToast(null)} />}
      {error && <AlertBanner variant="error" message={error} onDismiss={() => setError(null)} />}
      <FOPageHeader
        eyebrow="Front Office"
        title={title}
        description="Opening cash, payment-wise reconciliation, and manager approval. Amounts come from Front Office transactions already recorded on this shift."
        action={<DeskNav mode={mode} />}
      />
      {loading ? <p className="text-sm text-slate-500">Loading…</p> : null}

      {!loading && mode === "start" && (
        <div className="max-w-xl space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          {active ? (
            <p className="text-sm text-slate-600">
              {active.status === "Rejected"
                ? `Your ${active.shiftName} closing was rejected. Correct it before starting another shift. `
                : `You already have an open ${active.shiftName} shift from ${when(active.openedAt)}. `}
              <Link href={active.status === "Rejected" ? "/frontoffice/cashier/closing" : "/frontoffice/cashier/session"} className="font-semibold text-emerald-700">
                {active.status === "Rejected" ? "Open the closing" : "Open the active session"}
              </Link>
            </p>
          ) : (
            <>
              <FormField label="Shift">
                <SelectInput value={shiftName} onChange={(e) => setShiftName(e.target.value)} className="h-10">
                  {SHIFTS.map((shift) => (
                    <option key={shift} value={shift}>{shift}</option>
                  ))}
                </SelectInput>
              </FormField>
              <FormField label="Opening cash">
                <TextInput value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} inputMode="decimal" className="h-10" />
              </FormField>
              <FormField label="Remarks">
                <TextAreaInput value={openingRemarks} onChange={(e) => setOpeningRemarks(e.target.value)} rows={3} />
              </FormField>
              <Button onClick={startShift} className="!bg-[#0F8A5F] text-white">Start shift</Button>
            </>
          )}
        </div>
      )}

      {!loading && mode === "session" && (
        active && detail ? (
          <SessionSummary detail={detail} />
        ) : (
          <p className="text-sm text-slate-600">
            No open shift. <Link href="/frontoffice/cashier/start" className="font-semibold text-emerald-700">Start a shift</Link>
          </p>
        )
      )}

      {!loading && mode === "closing" && detail && (
        <ClosingForm
          detail={detail}
          drafts={drafts}
          closingRemarks={closingRemarks}
          onRemarks={setClosingRemarks}
          onDraft={(method, patch) =>
            setDrafts((current) => ({ ...current, [method]: { ...current[method], ...patch } }))
          }
          onSave={() => saveOrSubmit(detail.session.status === "Rejected" ? "resubmit" : "save")}
          onSubmit={() => saveOrSubmit(detail.session.status === "Rejected" ? "resubmit" : "submit")}
        />
      )}
      {!loading && mode === "closing" && !detail && (
        <p className="text-sm text-slate-600">
          Start a shift before closing. <Link href="/frontoffice/cashier/start" className="font-semibold text-emerald-700">Start shift</Link>
        </p>
      )}

      {!loading && mode === "history" && <SessionTable rows={history} />}

      {!loading && mode === "approvals" && (
        <div className="space-y-3">
          <FormField label="Rejection reason">
            <TextInput value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} className="h-10" />
          </FormField>
          <SessionTable
            rows={pending}
            actions={(row) => (
              <div className="flex gap-2">
                <Button size="sm" className="!bg-[#0F8A5F] text-white" onClick={() => decide(row.id, "approve")}>Approve</Button>
                <Button size="sm" variant="outline" onClick={() => decide(row.id, "reject")}>Reject</Button>
              </div>
            )}
          />
        </div>
      )}
    </div>
  );
}

function SessionSummary({ detail }: { detail: CashierSessionDetail }) {
  const cash = detail.lines.find((line) => line.paymentMethod === "Cash");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard stat={{ title: "Opening cash", value: formatINR(Number(detail.session.openingCash || 0)), change: "", trend: "up" }} />
        <StatCard stat={{ title: "Cash expected", value: formatINR(cash?.expectedAmount ?? 0), change: "", trend: "up" }} />
        <StatCard stat={{ title: "Shift", value: detail.session.shiftName, change: "", trend: "up" }} />
        <StatCard stat={{ title: "Status", value: detail.session.status, change: "", trend: "up" }} />
      </div>
      <p className="text-xs text-slate-500">Opened {when(detail.session.openedAt)}</p>
      <LineTable lines={detail.lines} />
      <Link href="/frontoffice/cashier/closing" className="inline-flex text-sm font-semibold text-emerald-700">
        Go to closing
      </Link>
    </div>
  );
}

function ClosingForm({
  detail,
  drafts,
  closingRemarks,
  onRemarks,
  onDraft,
  onSave,
  onSubmit,
}: {
  detail: CashierSessionDetail;
  drafts: Record<string, { actual: string; remarks: string }>;
  closingRemarks: string;
  onRemarks: (value: string) => void;
  onDraft: (method: string, patch: Partial<{ actual: string; remarks: string }>) => void;
  onSave: () => void;
  onSubmit: () => void;
}) {
  const locked = detail.session.status === "Pending Approval" || detail.session.status === "Closed";
  return (
    <div className="space-y-4">
      {detail.session.status === "Rejected" && (
        <p className="text-sm text-amber-800">This closing was rejected. Correct the count and submit it again. The earlier submission stays in the audit history.</p>
      )}
      {locked && <p className="text-sm text-slate-600">This shift is {detail.session.status.toLowerCase()} and cannot be edited.</p>}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-3 py-3">Method</th>
              <th className="px-3 py-3">Received</th>
              <th className="px-3 py-3">Refunded</th>
              <th className="px-3 py-3">Paid out</th>
              <th className="px-3 py-3">Expected</th>
              <th className="px-3 py-3">Actual</th>
              <th className="px-3 py-3">Variance</th>
              <th className="px-3 py-3">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {detail.lines.map((line) => {
              const actual = drafts[line.paymentMethod]?.actual ?? "";
              const variance = actual === "" ? null : Number(actual) - Number(line.expectedAmount);
              return (
                <tr key={line.paymentMethod}>
                  <td className="px-3 py-3 font-semibold text-slate-900">
                    {line.paymentMethod}
                    {line.paymentMethod === "Cash" && (
                      <p className="text-[10px] font-normal text-slate-400">Opening {formatINR(line.openingAmount)}</p>
                    )}
                  </td>
                  <td className="px-3 py-3">{formatINR(line.totalReceived)}</td>
                  <td className="px-3 py-3">{formatINR(line.totalRefunded)}</td>
                  <td className="px-3 py-3">{formatINR(line.totalPaidOut)}</td>
                  <td className="px-3 py-3 font-semibold">{formatINR(line.expectedAmount)}</td>
                  <td className="px-3 py-3">
                    <TextInput
                      value={actual}
                      disabled={locked}
                      onChange={(e) => onDraft(line.paymentMethod, { actual: e.target.value })}
                      className="h-9 w-28"
                    />
                  </td>
                  <td className={cn("px-3 py-3 font-semibold", variance != null && variance !== 0 && "text-red-600")}>
                    {variance == null ? "—" : formatINR(variance)}
                  </td>
                  <td className="px-3 py-3">
                    <TextInput
                      value={drafts[line.paymentMethod]?.remarks ?? ""}
                      disabled={locked}
                      onChange={(e) => onDraft(line.paymentMethod, { remarks: e.target.value })}
                      className="h-9 w-40"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <FormField label="Closing remarks">
        <TextAreaInput value={closingRemarks} disabled={locked} onChange={(e) => onRemarks(e.target.value)} rows={3} />
      </FormField>
      {!locked && (
        <div className="flex gap-2">
          <Button variant="outline" onClick={onSave}>Save count</Button>
          <Button className="!bg-[#0F8A5F] text-white" onClick={onSubmit}>
            {detail.session.status === "Rejected" ? "Resubmit" : "Submit for approval"}
          </Button>
        </div>
      )}
    </div>
  );
}

function LineTable({ lines }: { lines: CashierLine[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-3 py-3">Method</th>
            <th className="px-3 py-3">Expected</th>
            <th className="px-3 py-3">Received</th>
            <th className="px-3 py-3">Refunded</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {lines.map((line) => (
            <tr key={line.paymentMethod}>
              <td className="px-3 py-3 font-semibold">{line.paymentMethod}</td>
              <td className="px-3 py-3">{formatINR(line.expectedAmount)}</td>
              <td className="px-3 py-3">{formatINR(line.totalReceived)}</td>
              <td className="px-3 py-3">{formatINR(line.totalRefunded)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SessionTable({
  rows,
  actions,
}: {
  rows: CashierSession[];
  actions?: (row: CashierSession) => ReactNode;
}) {
  if (!rows.length) return <p className="text-sm text-slate-500">No cashier sessions yet.</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-3 py-3">Shift</th>
            <th className="px-3 py-3">Opened</th>
            <th className="px-3 py-3">Opening cash</th>
            <th className="px-3 py-3">Cash variance</th>
            <th className="px-3 py-3">Status</th>
            {actions && <th className="px-3 py-3">Action</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-3 font-semibold">{row.shiftName}</td>
              <td className="px-3 py-3">{when(row.openedAt)}</td>
              <td className="px-3 py-3">{formatINR(Number(row.openingCash || 0))}</td>
              <td className="px-3 py-3">{row.cashVariance == null ? "—" : formatINR(Number(row.cashVariance))}</td>
              <td className="px-3 py-3">{row.status}</td>
              {actions && <td className="px-3 py-3">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
