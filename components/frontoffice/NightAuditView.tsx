"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  FileText,
  IndianRupee,
  Loader2,
  Lock,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { currentUser } from "@/app/data";
import { Button } from "@/components/ui/Button";
import {
  AlertBanner,
  ConfirmModal,
  FOPageHeader,
  FOSearchToolbar,
  StatMiniCard,
  SummaryRow,
  formatINR,
} from "@/components/frontoffice/ui";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { cn } from "@/lib/utils";
import {
  createInitialNightAuditState,
  formatBusinessDate,
  loadDayClosingState,
  loadNightAuditState,
  resetClosingDemo,
  saveDayClosingState,
  saveNightAuditState,
  type DayClosingSessionState,
  type NightAuditItem,
  type NightAuditSessionState,
} from "@/lib/day-closing-session";

const AUDIT_STEPS = [
  "Locking room and rate inventory…",
  "Re-posting verified room charges…",
  "Applying no-show / exception decisions…",
  "Rebuilding trial balance…",
  "Writing night-audit journal…",
  "Publishing flash & manager pack…",
];

function statusPill(status: NightAuditItem["status"]) {
  switch (status) {
    case "Posted":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "Resolved":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200";
    case "Pending":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "Exception":
      return "bg-red-50 text-red-700 ring-red-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

export function NightAuditView() {
  const [hydrated, setHydrated] = useState(false);
  const [dayClose, setDayClose] = useState<DayClosingSessionState | null>(null);
  const [audit, setAudit] = useState<NightAuditSessionState>(createInitialNightAuditState);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toast, setToast] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(-1);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [focusItemId, setFocusItemId] = useState<string | null>(null);

  useEffect(() => {
    setDayClose(loadDayClosingState());
    setAudit(loadNightAuditState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveNightAuditState(audit);
  }, [audit, hydrated]);

  const unlocked = !!dayClose?.completed;
  const auditDate = dayClose?.report?.previousBusinessDate ?? dayClose?.summary.businessDate;
  const nextBusinessDate =
    dayClose?.report?.nextBusinessDate ?? dayClose?.summary.businessDate;

  const openItems = useMemo(
    () => audit.items.filter((i) => i.status === "Pending" || i.status === "Exception"),
    [audit.items],
  );

  const drawerItems = useMemo(() => {
    if (focusItemId) {
      const focused = audit.items.find((i) => i.id === focusItemId);
      if (focused && (focused.status === "Pending" || focused.status === "Exception")) {
        return [focused];
      }
    }
    return openItems;
  }, [audit.items, focusItemId, openItems]);

  const postedTotal = useMemo(
    () =>
      audit.items
        .filter((i) => i.status === "Posted" || i.status === "Resolved")
        .reduce((sum, i) => sum + (i.posted || i.roomRate + i.extras), 0),
    [audit.items],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return audit.items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.roomNo.toLowerCase().includes(q) ||
        item.guestName.toLowerCase().includes(q) ||
        (item.note ?? "").toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
      );
    });
  }, [audit.items, search, statusFilter]);

  const canRunAudit =
    unlocked && !audit.completed && !running && openItems.length === 0;

  const openResolveDrawer = (itemId?: string) => {
    setFocusItemId(itemId ?? null);
    setResolveOpen(true);
  };

  const closeResolveDrawer = () => {
    setResolveOpen(false);
    setFocusItemId(null);
  };

  const resolveException = (id: string, action: "no-show" | "waive") => {
    setAudit((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "Resolved",
              posted: 0,
              auditTime: new Date().toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              note:
                action === "no-show"
                  ? "Marked no-show — room released, no charge posted"
                  : "Exception waived by night auditor",
            }
          : item,
      ),
      auditLog: [
        `${action === "no-show" ? "No-show" : "Waive"} applied on ${id}`,
        ...prev.auditLog,
      ],
    }));
    setToast(
      action === "no-show"
        ? "No-show recorded and room released."
        : "Exception waived for this audit.",
    );
  };

  const forcePost = (id: string) => {
    setAudit((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "Posted",
              posted: item.roomRate + item.extras,
              auditTime: new Date().toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              note: "Force-posted during night audit",
            }
          : item,
      ),
      auditLog: [`Force-posted charges for ${id}`, ...prev.auditLog],
    }));
    setToast("Room charges force-posted to folio.");
  };

  const holdOvernight = (id: string) => {
    setAudit((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "Resolved",
              posted: 0,
              auditTime: "—",
              note: "Held overnight — will post next business date",
            }
          : item,
      ),
      auditLog: [`Held overnight: ${id}`, ...prev.auditLog],
    }));
    setToast("Item held — excluded from tonight’s posting.");
  };

  const runNightAudit = async () => {
    setConfirmOpen(false);
    setRunning(true);
    setStepIndex(0);

    for (let i = 0; i < AUDIT_STEPS.length; i++) {
      setStepIndex(i);
      await new Promise((r) => setTimeout(r, 420));
    }

    const completedAt = new Date().toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    setAudit((prev) => ({
      ...prev,
      completed: true,
      completedAt,
      completedBy: currentUser.name,
      auditLog: ["Night audit completed", ...prev.auditLog],
    }));

    const closing = loadDayClosingState();
    saveDayClosingState({
      ...closing,
      nightAuditCompleted: true,
    });
    setDayClose({ ...closing, nightAuditCompleted: true });

    setRunning(false);
    setStepIndex(-1);
    setToast("Night audit completed. Flash report pack is ready.");
  };

  const exportPack = () => {
    const lines = [
      "NIGHT AUDIT PACK",
      `Auditor,${audit.completedBy ?? currentUser.name}`,
      `Completed at,${audit.completedAt ?? "—"}`,
      `Audit date,${auditDate ? formatBusinessDate(auditDate) : "—"}`,
      `Next business date,${nextBusinessDate ? formatBusinessDate(nextBusinessDate) : "—"}`,
      `Posted total,${postedTotal}`,
      "",
      "Room,Guest,Rate,Extras,Posted,Status,Note",
      ...audit.items.map(
        (i) =>
          `${i.roomNo},${i.guestName},${i.roomRate},${i.extras},${i.posted},${i.status},"${i.note ?? ""}"`,
      ),
      "",
      "Audit log",
      ...audit.auditLog,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `night-audit-${auditDate ?? "pack"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToast("Night audit pack exported.");
  };

  const resetDemo = () => {
    resetClosingDemo();
    setDayClose(loadDayClosingState());
    setAudit(createInitialNightAuditState());
    closeResolveDrawer();
    setToast("Closing & night-audit demo reset. Start again from Day Closing.");
  };

  // Auto-close drawer when everything is resolved
  useEffect(() => {
    if (resolveOpen && openItems.length === 0) {
      closeResolveDrawer();
    }
  }, [openItems.length, resolveOpen]);

  return (
    <div className="space-y-5">
      {toast && (
        <AlertBanner variant="success" message={toast} onDismiss={() => setToast(null)} />
      )}

      <FOPageHeader
        eyebrow="Front Office · Operations"
        title="Night Audit"
        description="Resolve exceptions, post remaining charges, and finalize the night-audit pack."
        badge={
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
            <Clock className="h-3.5 w-3.5 text-emerald-600" />
            {unlocked
              ? `Audit date: ${auditDate ? formatBusinessDate(auditDate) : "—"}`
              : "Waiting for day closing"}
            {audit.completed && (
              <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                Complete
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
            {audit.completed ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={exportPack}
              >
                <Download className="h-3.5 w-3.5" />
                Export pack
              </Button>
            ) : (
              <Button
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800"
                disabled={!canRunAudit}
                onClick={() => setConfirmOpen(true)}
              >
                Run Night Audit
              </Button>
            )}
          </div>
        }
      />

      {!unlocked && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-950">
                  Day Closing must finish first
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  Night Audit unlocks after the business date is closed and rolled forward.
                </p>
              </div>
            </div>
            <Link href="/frontoffice/day-closing">
              <Button size="sm" className="gap-1.5 bg-emerald-700 hover:bg-emerald-800">
                Go to Day Closing
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {unlocked && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatMiniCard
              label="Audit Date"
              value={auditDate ? formatBusinessDate(auditDate) : "—"}
              sublabel={
                nextBusinessDate
                  ? `Next: ${formatBusinessDate(nextBusinessDate)}`
                  : "Business date"
              }
              icon={Clock}
            />
            <StatMiniCard
              label="Charges Posted"
              value={formatINR(postedTotal)}
              accent="#15803d"
              icon={IndianRupee}
              sublabel={`${audit.items.filter((i) => i.status === "Posted" || i.status === "Resolved").length} rooms finalized`}
            />
            <button
              type="button"
              onClick={() => openItems.length > 0 && openResolveDrawer()}
              className={cn(
                "text-left transition",
                openItems.length > 0 && "rounded-2xl ring-2 ring-transparent hover:ring-amber-200",
              )}
            >
              <StatMiniCard
                label="Open Items"
                value={openItems.length}
                accent={openItems.length ? "#f59e0b" : "#10b981"}
                icon={AlertTriangle}
                sublabel={openItems.length ? "Click to resolve" : "Clear to run"}
              />
            </button>
            <StatMiniCard
              label="Audit Status"
              value={audit.completed ? "Finalized" : openItems.length ? "Blocked" : "Ready"}
              accent={audit.completed || openItems.length === 0 ? "#10b981" : "#f59e0b"}
              icon={ShieldCheck}
              sublabel={
                audit.completed
                  ? "Pack available"
                  : dayClose?.report
                    ? `Closed by ${dayClose.report.closedBy}`
                    : "After day close"
              }
            />
          </div>

          {running && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900">Running night audit…</p>
                  <p className="text-xs text-emerald-700">
                    {AUDIT_STEPS[Math.max(0, stepIndex)]}
                  </p>
                </div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-emerald-100">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                  style={{
                    width: `${((Math.max(stepIndex, 0) + 1) / AUDIT_STEPS.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {audit.completed ? (
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center lg:col-span-2">
                <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
                <p className="mt-4 text-lg font-bold text-emerald-900">Night Audit Complete</p>
                <p className="mt-1 text-sm text-emerald-700">
                  Finalized by {audit.completedBy} at {audit.completedAt}. Business date{" "}
                  {nextBusinessDate ? formatBusinessDate(nextBusinessDate) : "—"} is now open for
                  new postings.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 bg-white"
                    onClick={exportPack}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export audit pack
                  </Button>
                  <Link href="/frontoffice/day-closing">
                    <Button size="sm" variant="outline" className="gap-1.5 bg-white">
                      Back to Day Closing
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <FileText className="h-4 w-4 text-emerald-700" />
                  Flash summary
                </h2>
                <div className="divide-y divide-slate-100">
                  <SummaryRow
                    label="Audit date"
                    value={auditDate ? formatBusinessDate(auditDate) : "—"}
                  />
                  <SummaryRow
                    label="Next business date"
                    value={nextBusinessDate ? formatBusinessDate(nextBusinessDate) : "—"}
                    highlight
                  />
                  <SummaryRow label="Posted charges" value={formatINR(postedTotal)} />
                  <SummaryRow label="Rooms audited" value={String(audit.items.length)} />
                  <SummaryRow
                    label="Exceptions cleared"
                    value={String(audit.items.filter((i) => i.status === "Resolved").length)}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <ClipboardCheck className="h-4 w-4 text-emerald-700" />
                  Audit trail
                </h2>
                <ul className="space-y-2">
                  {audit.auditLog.length === 0 ? (
                    <li className="text-sm text-slate-500">No log entries.</li>
                  ) : (
                    audit.auditLog.map((entry, idx) => (
                      <li
                        key={`${entry}-${idx}`}
                        className="rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2 text-xs text-slate-700"
                      >
                        {entry}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Compact status strip */}
              <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {openItems.length > 0
                      ? `${openItems.length} item${openItems.length === 1 ? "" : "s"} blocking finalize`
                      : "All clear — ready to run Night Audit"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Day close by {dayClose?.report?.closedBy ?? "—"} ·{" "}
                    {dayClose?.report?.closedAt ?? "—"}
                    {dayClose?.report
                      ? ` · Revenue ${formatINR(dayClose.report.totalRevenue)}`
                      : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link href="/frontoffice/day-closing">
                    <Button type="button" variant="outline" size="sm">
                      Day Closing
                    </Button>
                  </Link>
                  {openItems.length > 0 ? (
                    <Button
                      type="button"
                      size="sm"
                      className="gap-1.5 bg-amber-600 hover:bg-amber-700"
                      onClick={() => openResolveDrawer()}
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Resolve open items
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      className="bg-emerald-700 hover:bg-emerald-800"
                      disabled={!canRunAudit}
                      onClick={() => setConfirmOpen(true)}
                    >
                      Run Night Audit
                    </Button>
                  )}
                </div>
              </div>

              {/* Main table */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                <FOSearchToolbar
                  search={search}
                  onSearchChange={setSearch}
                  searchPlaceholder="Search room, guest, or audit note…"
                  filterPills={{
                    active: statusFilter,
                    onChange: setStatusFilter,
                    options: [
                      { id: "all", label: `All ${audit.items.length}` },
                      {
                        id: "Posted",
                        label: `Posted ${audit.items.filter((i) => i.status === "Posted").length}`,
                      },
                      {
                        id: "Pending",
                        label: `Pending ${audit.items.filter((i) => i.status === "Pending").length}`,
                      },
                      {
                        id: "Exception",
                        label: `Exception ${audit.items.filter((i) => i.status === "Exception").length}`,
                      },
                      {
                        id: "Resolved",
                        label: `Resolved ${audit.items.filter((i) => i.status === "Resolved").length}`,
                      },
                    ],
                  }}
                />

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[780px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80">
                        <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Room
                        </th>
                        <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Guest
                        </th>
                        <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Rate
                        </th>
                        <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Extras
                        </th>
                        <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Posted
                        </th>
                        <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Status
                        </th>
                        <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Note
                        </th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filtered.map((item) => {
                        const needsAction =
                          item.status === "Pending" || item.status === "Exception";
                        return (
                          <tr
                            key={item.id}
                            className={cn(
                              "transition-colors",
                              needsAction
                                ? "cursor-pointer bg-amber-50/30 hover:bg-amber-50/60"
                                : "hover:bg-emerald-50/20",
                            )}
                            onClick={() => needsAction && openResolveDrawer(item.id)}
                          >
                            <td className="px-3 py-3 font-medium text-slate-900">
                              {item.roomNo}
                            </td>
                            <td className="px-3 py-3 text-slate-700">{item.guestName}</td>
                            <td className="px-3 py-3 text-slate-700">
                              {formatINR(item.roomRate)}
                            </td>
                            <td className="px-3 py-3 text-slate-700">
                              {formatINR(item.extras)}
                            </td>
                            <td className="px-3 py-3 font-medium text-slate-900">
                              {formatINR(item.posted)}
                            </td>
                            <td className="px-3 py-3">
                              <span
                                className={cn(
                                  "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                                  statusPill(item.status),
                                )}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td className="max-w-[200px] truncate px-3 py-3 text-xs text-slate-500">
                              {item.note ?? "—"}
                            </td>
                            <td className="px-3 py-3 text-right">
                              {needsAction ? (
                                <button
                                  type="button"
                                  className="text-xs font-semibold text-amber-700 hover:underline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openResolveDrawer(item.id);
                                  }}
                                >
                                  Resolve
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <Drawer
        open={resolveOpen}
        onClose={closeResolveDrawer}
        title="Resolve open items"
        description={
          focusItemId
            ? "Decide this blocking item, then continue."
            : `${openItems.length} item${openItems.length === 1 ? "" : "s"} must be cleared before Night Audit can run.`
        }
        width="lg"
        footer={
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {openItems.length === 0
                ? "Nothing left to resolve"
                : `${openItems.length} remaining`}
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={closeResolveDrawer}>
                Close
              </Button>
              {openItems.length === 0 && (
                <Button
                  type="button"
                  size="sm"
                  className="bg-emerald-700 hover:bg-emerald-800"
                  onClick={() => {
                    closeResolveDrawer();
                    setConfirmOpen(true);
                  }}
                >
                  Run Night Audit
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {drawerItems.length === 0 ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
              <p className="mt-3 text-sm font-semibold text-emerald-900">All items resolved</p>
              <p className="mt-1 text-xs text-emerald-700">You can run Night Audit now.</p>
            </div>
          ) : (
            drawerItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        Room {item.roomNo} · {item.guestName}
                      </p>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
                          statusPill(item.status),
                        )}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{item.note}</p>
                  </div>
                  <p className="text-xs font-medium text-slate-600">{item.id}</p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 text-xs">
                  <div>
                    <p className="text-slate-500">Room rate</p>
                    <p className="font-semibold text-slate-900">{formatINR(item.roomRate)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Extras</p>
                    <p className="font-semibold text-slate-900">{formatINR(item.extras)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Posted so far</p>
                    <p className="font-semibold text-slate-900">{formatINR(item.posted)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Would post</p>
                    <p className="font-semibold text-slate-900">
                      {formatINR(item.roomRate + item.extras)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {item.status === "Exception" && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        className="bg-emerald-700 hover:bg-emerald-800"
                        onClick={() => resolveException(item.id, "no-show")}
                      >
                        Mark no-show
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => resolveException(item.id, "waive")}
                      >
                        Waive
                      </Button>
                    </>
                  )}
                  {item.status === "Pending" && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        className="bg-emerald-700 hover:bg-emerald-800"
                        onClick={() => forcePost(item.id)}
                      >
                        Force post
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => holdOvernight(item.id)}
                      >
                        Hold overnight
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}

          {focusItemId && openItems.length > 1 && (
            <button
              type="button"
              className="text-xs font-medium text-emerald-700 hover:underline"
              onClick={() => setFocusItemId(null)}
            >
              Show all {openItems.length} open items
            </button>
          )}
        </div>
      </Drawer>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={runNightAudit}
        title="Run Night Audit?"
        message="This will finalize postings for the closed business date, write the audit journal, and publish the flash report pack. You can reset the demo afterward."
        confirmLabel="Run Night Audit"
      />
    </div>
  );
}
