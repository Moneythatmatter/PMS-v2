"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock,
  Pencil,
  Plus,
  RefreshCw,
  Settings2,
  Trash2,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { AlertBanner, FormField, SelectInput } from "@/components/frontoffice/ui";
import { ConfirmModal } from "@/components/frontoffice/ui/Modal";
import { OperationsFilterDrawer, OperationsToolbar } from "@/components/housekeeping/OperationsToolbar";
import { usePsList } from "@/hooks/usePsResource";
import { fbReservationService, reservationSettingsService } from "@/services/food-beverages";
import { useFbOutlets } from "@/services/food-beverages/useFbOutlets";
import {
  RESERVATION_STATUSES,
  formatClock,
  formatDateLabel,
  formatDuration,
  formatTime24,
  localDateKey,
  minutesUntil,
  phaseMeta,
  settingsForOutlet,
  shiftDate,
  statusTone,
  type Reservation,
  type ReservationStatus,
} from "@/app/data/foodbeverages/reservations";
import { ReservationFormDrawer } from "./ReservationFormDrawer";
import { ReservationSettingsModal } from "./ReservationSettingsModal";
import { SeatReservationModal } from "./SeatReservationModal";

type StatusTab = "all" | ReservationStatus;
type PendingAction = { kind: "noshow" | "cancel" | "complete" | "delete"; reservation: Reservation };

const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  tone: "violet" | "sky" | "emerald" | "rose" | "slate";
}) {
  const tones = {
    violet: "bg-violet-50 text-violet-700",
    sky: "bg-sky-50 text-sky-600",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-600",
    slate: "bg-slate-50 text-slate-600",
  };
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 shadow-2xs">
      <div className="min-w-0">
        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <h3 className="text-lg font-extrabold leading-tight text-slate-800">{value}</h3>
        {sub && <p className="truncate text-[10px] text-slate-400">{sub}</p>}
      </div>
      <div className={cn("shrink-0 rounded-lg p-2", tones[tone])}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
  );
}

function phaseLine(r: Reservation) {
  const meta = phaseMeta[r.phase];
  if (r.status !== "Confirmed") {
    if (r.status === "Seated" && r.seatedAt) return { text: `Seated ${formatClock(r.seatedAt)}`, tone: meta.tone };
    if (r.status === "No Show" && r.statusNote) return { text: r.statusNote, tone: meta.tone };
    return { text: meta.label, tone: meta.tone };
  }
  const toStart = minutesUntil(r.startsAt);
  const toHold = minutesUntil(r.blockFrom);
  if (r.phase === "upcoming" && toHold !== null) {
    return {
      text: toHold > 180 ? `Table free until ${formatClock(r.blockFrom)}` : `Table held in ${toHold} min`,
      tone: meta.tone,
    };
  }
  if (r.phase === "reserved" && toStart !== null) return { text: `Table held · arrives in ${toStart} min`, tone: meta.tone };
  if (r.phase === "late" && toStart !== null) {
    return { text: `${-toStart} min late · releases ${formatClock(r.graceEndsAt)}`, tone: meta.tone };
  }
  return { text: meta.label, tone: meta.tone };
}

export function ReservationsPage() {
  const { outlets } = useFbOutlets(["restaurant", "cafe", "bar"]);
  const [date, setDate] = useState(() => localDateKey());
  const [allDates, setAllDates] = useState(false);
  const [outletId, setOutletId] = useState("");
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" | "info" } | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [editing, setEditing] = useState<Reservation | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [seating, setSeating] = useState<Reservation | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [busy, setBusy] = useState(false);

  const reservations = usePsList(
    () => fbReservationService.list({ ...(allDates ? {} : { date }), ...(outletId ? { outletId } : {}) }),
    [date, allDates, outletId],
  );
  const settingsList = usePsList(() => reservationSettingsService.get().then((b) => [b]), []);
  const settings = settingsList.data[0] ?? null;
  const { reload } = reservations;

  useEffect(() => {
    const timer = window.setInterval(() => void reload(), 60_000);
    return () => window.clearInterval(timer);
  }, [reload]);

  const outletName = useMemo(() => new Map(outlets.map((o) => [o.id, o.name])), [outlets]);
  const rows = reservations.data;

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    for (const s of RESERVATION_STATUSES) c[s] = rows.filter((r) => r.status === s).length;
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = norm(search);
    return rows.filter((r) => {
      if (statusTab !== "all" && r.status !== statusTab) return false;
      if (!q) return true;
      return [r.guest, r.phone, r.resNo, r.tableNo, outletName.get(r.outletId), r.notes].some((v) => norm(v).includes(q));
    });
  }, [rows, statusTab, search, outletName]);

  const kpis = useMemo(() => {
    const live = rows.filter((r) => r.status === "Confirmed" || r.status === "Seated" || r.status === "Completed");
    const nextHour = rows.filter((r) => {
      const m = minutesUntil(r.startsAt);
      return r.status === "Confirmed" && m !== null && m >= -r.gracePeriodMin && m <= 60;
    });
    return {
      bookings: live.length,
      covers: live.reduce((s, r) => s + r.covers, 0),
      nextHour: nextHour.length,
      nextHourCovers: nextHour.reduce((s, r) => s + r.covers, 0),
      seated: rows.filter((r) => r.status === "Seated").length,
      noShows: rows.filter((r) => r.status === "No Show").length,
    };
  }, [rows]);

  const openCreate = () => {
    setEditing(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };
  const openEdit = (r: Reservation) => {
    setEditing(r);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const runPending = async () => {
    if (!pending) return;
    const { kind, reservation: r } = pending;
    setBusy(true);
    try {
      if (kind === "noshow") await fbReservationService.markNoShow(r.id);
      if (kind === "cancel") await fbReservationService.cancel(r.id);
      if (kind === "complete") await fbReservationService.complete(r.id);
      if (kind === "delete") await fbReservationService.remove(r.id);
      const done = { noshow: "marked No Show", cancel: "cancelled", complete: "completed", delete: "deleted" }[kind];
      setToast({ message: `${r.resNo} ${done}.`, variant: "success" });
      await reload();
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Action failed", variant: "error" });
    } finally {
      setBusy(false);
      setPending(null);
    }
  };

  const isToday = !allDates && date === localDateKey();
  const loading = reservations.loading && rows.length === 0;
  const global = settingsForOutlet(settings, "");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Food &amp; Beverage · Restaurants</span>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-800">Table Reservations</h1>
          <p className="text-xs text-slate-500">
            Tables are held from {global.bufferBeforeMin} min before each booking and released {global.gracePeriodMin} min after
            if the guest doesn&apos;t arrive.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setSettingsOpen(true)} className="h-8 gap-1.5 rounded-xl px-3 text-xs font-bold">
            <Settings2 className="h-3.5 w-3.5" /> Settings
          </Button>
          <Button variant="outline" onClick={() => reload()} className="h-8 gap-1.5 rounded-xl px-3 text-xs font-bold">
            <RefreshCw className={cn("h-3.5 w-3.5", reservations.loading && "animate-spin")} /> Refresh
          </Button>
          <Button
            onClick={openCreate}
            className="flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-xl !bg-[#0F8A5F] px-3.5 text-xs font-bold text-white shadow-xs hover:!bg-[#0d7d56]"
          >
            <Plus className="h-3.5 w-3.5" /> New Reservation
          </Button>
        </div>
      </div>

      {toast && <AlertBanner variant={toast.variant} message={toast.message} onDismiss={() => setToast(null)} />}
      {reservations.error && <AlertBanner variant="error" message={`Could not load reservations: ${reservations.error}`} />}

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={() => {
              setAllDates(false);
              setDate((d) => shiftDate(d, -1));
            }}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setAllDates(false);
              if (e.target.value) setDate(e.target.value);
            }}
            className={cn("h-7 bg-transparent px-1 text-xs font-semibold text-slate-800 outline-none", allDates && "text-slate-400")}
            aria-label="Reservation date"
          />
          <button
            type="button"
            onClick={() => {
              setAllDates(false);
              setDate((d) => shiftDate(d, 1));
            }}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setAllDates(false);
            setDate(localDateKey());
          }}
          className={cn("h-8 rounded-xl px-3 text-xs font-bold", isToday && "border-emerald-500 text-emerald-800")}
        >
          Today
        </Button>
        <Button
          variant="outline"
          onClick={() => setAllDates((v) => !v)}
          className={cn("h-8 rounded-xl px-3 text-xs font-bold", allDates && "border-emerald-500 text-emerald-800")}
        >
          All dates
        </Button>
        <span className="text-xs font-semibold text-slate-500">{allDates ? "Showing every date" : formatDateLabel(date)}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Bookings" value={String(kpis.bookings)} sub="Excludes no-shows & cancelled" icon={CalendarCheck} tone="violet" />
        <KpiCard label="Covers" value={String(kpis.covers)} sub="Guests expected" icon={Users} tone="slate" />
        <KpiCard
          label="Next hour"
          value={String(kpis.nextHour)}
          sub={`${kpis.nextHourCovers} guests arriving`}
          icon={Clock}
          tone="sky"
        />
        <KpiCard label="Seated now" value={String(kpis.seated)} icon={UserCheck} tone="emerald" />
        <KpiCard label="No shows" value={String(kpis.noShows)} icon={UserX} tone="rose" />
      </div>

      <OperationsToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search guest, phone, booking # or table…"
        activeFilterCount={Number(Boolean(outletId))}
        onOpenFilters={() => setFiltersOpen(true)}
        statusTabs={[
          { id: "all", label: "All", count: counts.all },
          ...RESERVATION_STATUSES.map((s) => ({ id: s, label: s, count: counts[s] ?? 0 })),
        ]}
        activeStatusTab={statusTab}
        onStatusTabChange={(id) => setStatusTab(id as StatusTab)}
      />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
        <table className="w-full min-w-[1080px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <th className="px-3 py-2.5">Time</th>
              <th className="px-3 py-2.5">Guest</th>
              <th className="px-3 py-2.5">Party</th>
              <th className="px-3 py-2.5">Table</th>
              <th className="px-3 py-2.5">Table hold</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-3 py-12 text-center text-sm font-medium text-slate-400">
                  Loading reservations…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-12 text-center">
                  <CalendarClock className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-sm font-semibold text-slate-600">
                    {rows.length === 0 ? "No reservations for this day" : "No reservations match these filters"}
                  </p>
                  <p className="text-xs font-normal text-slate-400">
                    {rows.length === 0 ? "Book a table with New Reservation." : "Try another tab or clear the search."}
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const line = phaseLine(r);
                const holding = r.phase === "reserved" || r.phase === "late";
                return (
                  <tr key={r.id} className={cn("transition-colors hover:bg-slate-50/60", holding && "bg-violet-50/40")}>
                    <td className="px-3 py-2.5">
                      <p className="text-sm font-extrabold text-slate-900">{formatTime24(r.time)}</p>
                      <p className="text-[10px] font-medium text-slate-400">
                        {allDates ? formatDateLabel(r.reservationDate) : formatDuration(r.durationMin)}
                      </p>
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="font-bold text-slate-900">{r.guest}</p>
                      <p className="text-[10px] font-medium text-slate-400">{[r.resNo, r.phone].filter(Boolean).join(" · ")}</p>
                      {r.notes && <p className="max-w-[220px] truncate text-[10px] font-medium text-slate-500" title={r.notes}>{r.notes}</p>}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-slate-400" /> {r.covers}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="font-bold text-slate-900">{r.tableNos.join(" + ") || "—"}</p>
                      <p className="text-[10px] font-medium text-slate-400">{outletName.get(r.outletId) ?? "—"}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      {r.blockFrom ? (
                        <>
                          <p>
                            {formatClock(r.blockFrom)} – {formatClock(r.endsAt)}
                          </p>
                          <p className="text-[10px] font-medium text-slate-400">No-show after {formatClock(r.graceEndsAt)}</p>
                        </>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400">No date — doesn&apos;t hold the table</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1",
                          statusTone[r.status],
                        )}
                      >
                        {r.status}
                      </span>
                      <p className={cn("mt-1 max-w-[220px] truncate text-[11px] font-medium", line.tone)} title={line.text}>
                        {line.text}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        {(r.status === "Confirmed" || r.status === "No Show") && (
                          <Button
                            onClick={() => setSeating(r)}
                            className="h-7 gap-1 rounded-lg !bg-emerald-700 px-2.5 text-[11px] font-bold text-white hover:!bg-emerald-800"
                          >
                            <UserCheck className="h-3.5 w-3.5" /> Seat
                          </Button>
                        )}
                        {r.status === "Seated" && (
                          <Button
                            variant="outline"
                            onClick={() => setPending({ kind: "complete", reservation: r })}
                            className="h-7 rounded-lg px-2.5 text-[11px] font-bold"
                          >
                            Complete
                          </Button>
                        )}
                        {r.status === "Confirmed" && (
                          <>
                            <Button
                              variant="outline"
                              onClick={() => setPending({ kind: "noshow", reservation: r })}
                              disabled={r.phase === "upcoming" || r.phase === "unscheduled"}
                              title={r.phase === "upcoming" ? "Available once the table is held" : undefined}
                              className="h-7 rounded-lg px-2.5 text-[11px] font-bold"
                            >
                              No show
                            </Button>
                            <IconAction label={`Edit ${r.resNo}`} onClick={() => openEdit(r)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </IconAction>
                            <IconAction label={`Cancel ${r.resNo}`} danger onClick={() => setPending({ kind: "cancel", reservation: r })}>
                              <UserX className="h-3.5 w-3.5" />
                            </IconAction>
                          </>
                        )}
                        {(r.status === "Cancelled" || r.status === "No Show" || r.status === "Completed") && (
                          <IconAction label={`Delete ${r.resNo}`} danger onClick={() => setPending({ kind: "delete", reservation: r })}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </IconAction>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <OperationsFilterDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filter Reservations"
        activeFilterCount={Number(Boolean(outletId))}
        onReset={() => setOutletId("")}
      >
        <FormField label="Outlet">
          <SelectInput value={outletId} onChange={(e) => setOutletId(e.target.value)} className="block">
            <option value="">All outlets</option>
            {outlets.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </SelectInput>
        </FormField>
      </OperationsFilterDrawer>

      {formOpen && (
        <ReservationFormDrawer
          key={formKey}
          open={formOpen}
          onClose={() => setFormOpen(false)}
          initial={editing}
          defaultDate={allDates ? localDateKey() : date}
          defaultOutletId={outletId}
          outlets={outlets}
          settings={settings}
          onSaved={async (saved, message) => {
            setFormOpen(false);
            setToast({ message, variant: "success" });
            if (saved.reservationDate && !allDates) setDate(saved.reservationDate);
            await reload();
          }}
        />
      )}

      {settingsOpen && (
        <ReservationSettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          settings={settings}
          outlets={outlets}
          onSaved={(bundle) => {
            settingsList.setData([bundle]);
            setSettingsOpen(false);
            setToast({ message: "Reservation settings saved.", variant: "success" });
            void reload();
          }}
        />
      )}

      {seating && (
        <SeatReservationModal
          key={seating.id}
          open
          onClose={() => setSeating(null)}
          reservation={seating}
          onSeated={(result) => {
            setSeating(null);
            setToast({
              message: `${result.reservation.guest} seated at ${result.tableNo}. Open Orders to start their KOT.`,
              variant: "success",
            });
            void reload();
          }}
        />
      )}

      <ConfirmModal
        open={pending !== null}
        onClose={() => setPending(null)}
        onConfirm={() => void runPending()}
        loading={busy}
        variant={pending?.kind === "complete" ? "primary" : "danger"}
        title={
          pending
            ? {
                noshow: "Mark as no-show?",
                cancel: "Cancel reservation?",
                complete: "Complete reservation?",
                delete: "Delete reservation?",
              }[pending.kind]
            : ""
        }
        message={pending ? pendingMessage(pending) : ""}
        confirmLabel={
          pending ? { noshow: "Mark No Show", cancel: "Cancel Booking", complete: "Complete", delete: "Delete" }[pending.kind] : ""
        }
      />
    </div>
  );
}

function pendingMessage({ kind, reservation: r }: PendingAction) {
  const who = `${r.resNo} · ${r.guest} (${r.covers} pax, ${formatTime24(r.time)})`;
  switch (kind) {
    case "noshow":
      return `${who} did not arrive. ${r.tableNos.join(" + ")} will be released for walk-ins.`;
    case "cancel":
      return `${who} will be cancelled and ${r.tableNos.join(" + ")} released for that time.`;
    case "complete":
      return `${who} has finished dining. If the table has no open order, its session is closed; otherwise settle the bill first.`;
    case "delete":
      return `${who} will be permanently removed from the reservation list.`;
  }
}

function IconAction({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "rounded-md p-1.5 text-slate-500 transition",
        danger ? "hover:bg-red-50 hover:text-red-600" : "hover:bg-slate-100 hover:text-slate-800",
      )}
    >
      {children}
    </button>
  );
}
