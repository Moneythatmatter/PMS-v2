"use client";

import React, { useState } from "react";
import { CalendarClock, Phone, UserCheck, UserX, Users, Footprints } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/frontoffice/ui/Modal";
import { TextAreaInput } from "@/components/frontoffice/ui";
import { ApiError } from "@/services/api";
import { fbReservationService, type LiveTable } from "@/services/food-beverages";
import { formatClock, formatTime24, minutesUntil, phaseMeta } from "@/app/data/foodbeverages/reservations";

type Mode = "choose" | "walkin" | "noshow";

export function ReservationArrivalModal({
  table,
  onClose,
  onSeated,
  onWalkIn,
  onNoShow,
}: {
  table: LiveTable;
  onClose: () => void;
  /** Reservation is Seated and its session is open on this table. */
  onSeated: (message: string) => void;
  onWalkIn: (override: { reservationId: string; reason: string }) => void;
  onNoShow: (message: string) => void;
}) {
  const reservation = table.reservation;
  const [mode, setMode] = useState<Mode>("choose");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);

  if (!reservation) return null;
  const startsIn = minutesUntil(reservation.startsAt);
  const timing =
    startsIn === null
      ? ""
      : startsIn > 0
        ? `Arriving in ${startsIn} min`
        : startsIn === 0
          ? "Due now"
          : `${-startsIn} min late`;

  const seat = async (override = false) => {
    setBusy(true);
    setError(null);
    try {
      const result = await fbReservationService.seat(reservation.id, { tableNo: table.tableNo, override });
      onSeated(`${reservation.guest} seated at ${result.tableNo} · ${reservation.resNo} is now Seated`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setConflict(e.message);
      else setError(e instanceof Error ? e.message : "Could not seat the guest.");
    } finally {
      setBusy(false);
    }
  };

  const noShow = async () => {
    setBusy(true);
    setError(null);
    try {
      await fbReservationService.markNoShow(reservation.id);
      onNoShow(`${reservation.resNo} marked as no-show · table ${table.tableNo} is free`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not mark no-show.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title={`Table ${table.tableNo} is reserved`}
      description={`${reservation.resNo} · held from ${formatClock(reservation.blockFrom)} until the guest arrives`}
      footer={
        mode === "walkin" ? (
          <>
            <Button variant="outline" onClick={() => setMode("choose")} disabled={busy}>
              Back
            </Button>
            <Button
              onClick={() => onWalkIn({ reservationId: reservation.id, reason: reason.trim() })}
              disabled={!reason.trim()}
              className="!bg-amber-600 text-white hover:!bg-amber-700"
            >
              Override &amp; take order
            </Button>
          </>
        ) : mode === "noshow" ? (
          <>
            <Button variant="outline" onClick={() => setMode("choose")} disabled={busy}>
              Back
            </Button>
            <Button onClick={() => void noShow()} disabled={busy} className="!bg-rose-600 text-white hover:!bg-rose-700">
              {busy ? "Saving…" : "Mark No Show"}
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Close
          </Button>
        )
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-slate-900">{reservation.guest || "Guest"}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="h-3.5 w-3.5" /> {formatTime24(reservation.time)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> {reservation.covers} guests
                </span>
                {reservation.phone && (
                  <a href={`tel:${reservation.phone}`} className="inline-flex items-center gap-1 text-violet-700 hover:underline">
                    <Phone className="h-3.5 w-3.5" /> {reservation.phone}
                  </a>
                )}
              </p>
            </div>
            <span className={cn("shrink-0 text-xs font-bold", phaseMeta[reservation.phase].tone)}>{timing}</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Released automatically as No Show at <strong>{formatClock(reservation.graceEndsAt)}</strong> if the guest hasn&apos;t
            arrived.
          </p>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
        {conflict && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <p>{conflict}</p>
            <Button
              onClick={() => void seat(true)}
              disabled={busy}
              className="mt-2 h-7 !bg-amber-600 px-2.5 text-[11px] font-bold text-white hover:!bg-amber-700"
            >
              Seat anyway
            </Button>
          </div>
        )}

        {mode === "choose" && (
          <div className="grid gap-2">
            <ActionRow
              icon={UserCheck}
              tone="emerald"
              title="Guest has arrived"
              hint="Seat the party: the booking becomes Seated, the table Occupied, and the order screen opens."
              onClick={() => void seat(false)}
              disabled={busy}
            />
            <ActionRow
              icon={Footprints}
              tone="amber"
              title="Seat a walk-in anyway"
              hint="Staff override. The booking stays Confirmed; you'll need another table when the guest arrives."
              onClick={() => setMode("walkin")}
              disabled={busy}
            />
            <ActionRow
              icon={UserX}
              tone="rose"
              title="Guest isn't coming"
              hint="Mark the booking No Show and free the table now."
              onClick={() => setMode("noshow")}
              disabled={busy}
            />
          </div>
        )}

        {mode === "walkin" && (
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">Reason for override</span>
            <TextAreaInput
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Quick lunch, will finish before 1 PM; booking moved to T-08"
              className="mt-1 min-h-[70px]"
              autoFocus
            />
            <span className="mt-1 block text-[11px] text-slate-500">Saved on the dining session for the audit trail.</span>
          </label>
        )}

        {mode === "noshow" && (
          <p className="text-sm text-slate-600">
            {reservation.guest} ({reservation.covers} pax, {formatTime24(reservation.time)}) will be marked No Show and table{" "}
            {table.tableNo} returns to Available.
          </p>
        )}
      </div>
    </Modal>
  );
}

function ActionRow({
  icon: Icon,
  tone,
  title,
  hint,
  onClick,
  disabled,
}: {
  icon: React.ElementType;
  tone: "emerald" | "amber" | "rose";
  title: string;
  hint: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100",
    amber: "bg-amber-50 text-amber-700 group-hover:bg-amber-100",
    rose: "bg-rose-50 text-rose-700 group-hover:bg-rose-100",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300 hover:shadow-sm disabled:opacity-60"
    >
      <span className={cn("rounded-lg p-2 transition", tones[tone])}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-900">{title}</span>
        <span className="block text-xs text-slate-500">{hint}</span>
      </span>
    </button>
  );
}
