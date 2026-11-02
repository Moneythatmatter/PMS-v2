"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  BedDouble,
  CalendarClock,
  CheckCircle2,
  Download,
  ExternalLink,
  History,
  IndianRupee,
  Loader2,
  Lock,
  Moon,
  Receipt,
  RefreshCw,
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
  nightAuditService,
  type NightAuditAccountsResult,
  type NightAuditRecord,
  type NightAuditStatus,
} from "@/services/front-office/closing";

function formatDay(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatStamp(value: string | null | undefined) {
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

function errorText(e: unknown) {
  return e instanceof Error ? e.message : "Something went wrong";
}

async function fetchAll() {
  const [status, history] = await Promise.all([
    nightAuditService.status(),
    nightAuditService.history(15).catch(() => [] as NightAuditRecord[]),
  ]);
  return { status, history };
}

function accountsText(acc: NightAuditAccountsResult | undefined) {
  if (!acc) return "Not posted";
  if (acc.status === "POSTED") {
    return `Voucher ${acc.voucherNo ?? ""} (${acc.voucherStatus ?? "Draft"}) · ${formatINR(Number(acc.amount ?? 0))}`;
  }
  if (acc.status === "NOTHING") return "Nothing new to post";
  return "Failed — post manually";
}

/** Front Office and F&B posting results on one line (older audits have no F&B result). */
function postingText(summary: NightAuditRecord["summary"]) {
  const fo = accountsText(summary?.accounts);
  return summary?.accountsFnb ? `FO: ${fo} · F&B: ${accountsText(summary.accountsFnb)}` : fo;
}

const STATUS_TONE: Record<NightAuditRecord["status"], string> = {
  COMPLETED: "bg-emerald-50 text-emerald-700",
  FAILED: "bg-red-50 text-red-700",
  RUNNING: "bg-amber-50 text-amber-700",
};

export function NightAuditView() {
  const [status, setStatus] = useState<NightAuditStatus | null>(null);
  const [history, setHistory] = useState<NightAuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [running, setRunning] = useState(false);

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

  const runAudit = async () => {
    setRunning(true);
    setError(null);
    try {
      const record = await nightAuditService.run();
      setConfirmOpen(false);
      const posted =
        record.summary?.accounts?.status === "POSTED" || record.summary?.accountsFnb?.status === "POSTED";
      setToast(
        `Night audit for ${formatDay(record.businessDate)} complete — ${record.roomNightsPosted} room night(s) posted. Business date is now ${formatDay(record.nextBusinessDate)}.${
          posted ? ` Accounts: ${postingText(record.summary)}.` : ""
        }`,
      );
    } catch (e) {
      setConfirmOpen(false);
      setError(errorText(e));
    } finally {
      setRunning(false);
      await load();
    }
  };

  const exportRecord = (record: NightAuditRecord) => {
    downloadXlsx(`night-audit-${record.businessDate}`, [
      {
        name: "Night Audit",
        title: "Night Audit Report",
        meta: [
          ["Business date", formatDay(record.businessDate)],
          ["Rolled to", formatDay(record.nextBusinessDate)],
          ["Status", record.status],
          ["Run by", record.runByName ?? "—"],
          ["Completed at", formatStamp(record.completedAt)],
        ],
        header: ["Metric", "Value"],
        rows: [
          ["Room nights posted", Number(record.roomNightsPosted)],
          ["Room revenue", Number(record.roomRevenue)],
          ["Room tax", Number(record.roomTax)],
          ["Attempts", Number(record.attempts)],
          ["Posted to Accounts", postingText(record.summary)],
        ],
      },
    ]);
  };

  if (loading && !status) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading night audit…
      </div>
    );
  }

  if (!status) {
    return (
      <div className="space-y-4">
        <AlertBanner variant="error" message={error ?? "Could not load night audit"} />
        <Button size="sm" variant="outline" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    );
  }

  const { preview, audit } = status;
  const needsClosing = !status.dayClosing;
  const failed = audit?.status === "FAILED";
  const lastAccounts = status.lastAudit?.summary?.accounts;
  const lastFnb = status.lastAudit?.summary?.accountsFnb;

  return (
    <div className="space-y-4">
      {toast && <AlertBanner variant="success" message={toast} onDismiss={() => setToast(null)} />}
      {error && <AlertBanner variant="error" message={error} onDismiss={() => setError(null)} />}

      <FOPageHeader
        eyebrow="Front Office"
        title="Night Audit"
        description="Post tonight's room charges and roll the business date forward. Runs after Day Closing."
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
              className="gap-1 bg-emerald-700 text-xs font-semibold hover:bg-emerald-800"
              onClick={() => setConfirmOpen(true)}
              disabled={!status.canRun || running}
            >
              {running ? <Loader2 className="h-3 w-3 animate-spin" /> : <Moon className="h-3 w-3" />}
              {failed ? "Retry Night Audit" : "Run Night Audit"}
            </Button>
          </div>
        }
      />

      {needsClosing ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-3">
            <Lock className="h-6 w-6 text-amber-600" />
            <div>
              <p className="text-sm font-bold text-amber-900">
                Day Closing for {formatDay(status.businessDate)} must finish first
              </p>
              <p className="text-xs text-amber-800">
                Night Audit unlocks once the day&apos;s collections are reconciled and closed.
              </p>
            </div>
          </div>
          <Link
            href="/frontoffice/day-closing"
            className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 hover:underline"
          >
            Go to Day Closing <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          <div>
            <p className="text-sm font-bold text-emerald-900">
              {formatDay(status.businessDate)} closed by {status.dayClosing?.closedBy ?? "—"}
            </p>
            <p className="text-xs text-emerald-800">
              Day Closing finished {formatStamp(status.dayClosing?.closedAt)}. Running the audit moves the
              business date to {formatDay(status.nextBusinessDate)}.
            </p>
          </div>
        </div>
      )}

      {failed && audit?.error && (
        <AlertBanner
          variant="error"
          message={`Last attempt failed (business date not advanced): ${audit.error}`}
        />
      )}

      {lastAccounts?.status === "FAILED" && status.lastAudit && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div>
            <p className="text-sm font-bold text-amber-900">
              Night audit for {formatDay(status.lastAudit.businessDate)} was not posted to Accounts
            </p>
            <p className="text-xs text-amber-800">{lastAccounts.message}</p>
          </div>
          <Link
            href="/accounts/transactions/front-office-posting"
            className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 hover:underline"
          >
            Front Office Posting <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      )}

      {lastFnb?.status === "FAILED" && status.lastAudit && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div>
            <p className="text-sm font-bold text-amber-900">
              F&amp;B bills for {formatDay(status.lastAudit.businessDate)} were not posted to Accounts
            </p>
            <p className="text-xs text-amber-800">{lastFnb.message}</p>
          </div>
          <Link
            href="/accounts/transactions/fnb-posting"
            className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 hover:underline"
          >
            F&amp;B Posting <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      )}

      {status.blockers
        .filter((b) => b.id !== "day-closing")
        .map((b) => (
          <AlertBanner key={b.id + b.message} variant="error" message={b.message} />
        ))}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatMiniCard
          label="Room nights to post"
          value={preview.nights}
          sublabel={`${preview.rows.length} nightly-billed stay(s)`}
          icon={BedDouble}
        />
        <StatMiniCard
          label="Room revenue"
          value={formatINR(preview.amount)}
          sublabel="Before tax"
          icon={IndianRupee}
        />
        <StatMiniCard label="Room tax" value={formatINR(preview.tax)} sublabel="Per Accounts tax rules" icon={Receipt} />
        <StatMiniCard
          label="In-house"
          value={status.inHouse}
          sublabel={`${status.legacyCount} pre-billed · ${status.groupCount} group`}
          icon={Moon}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Room charges for {formatDay(status.businessDate)}
              </h3>
              <p className="text-[11px] text-slate-500">
                One charge per stay per night. Already-posted nights are skipped, so a retry never double-charges.
              </p>
            </div>
            {preview.rows.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-slate-400">
                No nightly-billed guests in house. Stays booked before nightly billing started, and group stays, are
                already billed for the full stay.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-2">Room</th>
                      <th className="px-4 py-2">Guest</th>
                      <th className="px-4 py-2 text-right">Tariff</th>
                      <th className="px-4 py-2 text-right">Nights</th>
                      <th className="px-4 py-2 text-right">Tax</th>
                      <th className="px-4 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.rows.map((r) => (
                      <tr key={r.reservationId} className={cn(r.issue && "bg-red-50/50")}>
                        <td className="px-4 py-2 font-semibold text-slate-800">{r.roomNo || "—"}</td>
                        <td className="px-4 py-2">
                          <p className="font-semibold text-slate-800">{r.guestName}</p>
                          <p className="text-[10px] text-slate-500">{r.bookingNo}</p>
                          {r.issue && (
                            <p className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-red-600">
                              <XCircle className="h-3 w-3" /> {r.issue}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">{formatINR(r.tariff)}</td>
                        <td className="px-4 py-2 text-right" title={r.nights.join(", ")}>
                          {r.nights.length || <span className="text-slate-400">Posted</span>}
                        </td>
                        <td className="px-4 py-2 text-right">{formatINR(r.tax)}</td>
                        <td className="px-4 py-2 text-right font-semibold text-slate-900">
                          {formatINR(r.amount + r.tax)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 xl:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-1 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-slate-900">
              Tonight&apos;s audit
            </h3>
            <div className="divide-y divide-slate-100 text-[11px] font-semibold text-slate-700">
              <SummaryRow label="Business date" value={formatDay(status.businessDate)} />
              <SummaryRow label="Rolls to" value={formatDay(status.nextBusinessDate)} />
              <SummaryRow label="Day Closing" value={status.dayClosing ? "Done" : "Pending"} />
              <SummaryRow label="Room revenue + tax" value={formatINR(preview.amount + preview.tax)} highlight />
              <SummaryRow
                label="Last completed audit"
                value={status.lastAudit ? formatDay(status.lastAudit.businessDate) : "None yet"}
              />
              {status.lastAudit && <SummaryRow label="Last posting to Accounts" value={postingText(status.lastAudit.summary)} />}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-1 flex items-center gap-1.5 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-slate-900">
              <History className="h-3.5 w-3.5 text-slate-400" /> Audit history
            </h3>
            {history.length === 0 ? (
              <p className="py-3 text-center text-[11px] text-slate-400">No night audits yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {history.map((h) => (
                  <div key={h.id} className="flex items-center justify-between gap-2 py-2">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                        {formatDay(h.businessDate)}
                        <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-bold uppercase", STATUS_TONE[h.status])}>
                          {h.status}
                        </span>
                      </p>
                      <p className="truncate text-[10px] text-slate-500">
                        {h.runByName ?? "—"} · {formatStamp(h.completedAt ?? h.startedAt)} · {h.roomNightsPosted} night(s)
                      </p>
                      {h.status === "COMPLETED" && (
                        <p
                          className={cn(
                            "truncate text-[10px]",
                            h.summary?.accounts?.status === "FAILED" || h.summary?.accountsFnb?.status === "FAILED"
                              ? "font-semibold text-amber-700"
                              : "text-slate-500",
                          )}
                        >
                          Accounts: {postingText(h.summary)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-700">
                        {formatINR(Number(h.roomRevenue) + Number(h.roomTax))}
                      </span>
                      <button
                        type="button"
                        title="Export"
                        onClick={() => exportRecord(h)}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => !running && setConfirmOpen(false)}
        onConfirm={() => void runAudit()}
        loading={running}
        title={`Run night audit for ${formatDay(status.businessDate)}?`}
        message={`This posts ${preview.nights} room night(s) (${formatINR(preview.amount + preview.tax)} incl. tax) to guest folios and moves the business date to ${formatDay(status.nextBusinessDate)}. It can't be undone.`}
        confirmLabel="Run Night Audit"
      />
    </div>
  );
}
