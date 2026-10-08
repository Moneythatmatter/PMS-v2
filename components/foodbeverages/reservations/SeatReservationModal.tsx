"use client";

import React, { useState } from "react";
import { AlertTriangle, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/frontoffice/ui/Modal";
import { usePsList } from "@/hooks/usePsResource";
import { ApiError } from "@/services/api";
import { fbReservationService, floorPlanService } from "@/services/food-beverages";
import { formatClock, formatTime24, type Reservation } from "@/app/data/foodbeverages/reservations";

export type SeatResult = Awaited<ReturnType<typeof fbReservationService.seat>>;

const norm = (v: string) => v.trim().toLowerCase();

export function SeatReservationModal({
  open,
  onClose,
  reservation,
  onSeated,
}: {
  open: boolean;
  onClose: () => void;
  reservation: Reservation;
  onSeated: (result: SeatResult) => void;
}) {
  const floor = usePsList(() => floorPlanService.list(reservation.outletId), [reservation.outletId]);
  const [tableNo, setTableNo] = useState(reservation.tableNos[0] ?? "");
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const seat = async (override = false) => {
    setBusy(true);
    setError(null);
    try {
      const result = await fbReservationService.seat(reservation.id, { tableNo, override });
      onSeated(result);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setConflict(e.message);
      else setError(e instanceof Error ? e.message : "Could not seat the guest.");
    } finally {
      setBusy(false);
    }
  };

  const reserved = new Set(reservation.tableNos.map(norm));
  const tables = [...floor.data].sort(
    (a, b) => Number(reserved.has(norm(b.tableNo))) - Number(reserved.has(norm(a.tableNo))) || a.tableNo.localeCompare(b.tableNo),
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={`Seat ${reservation.guest}`}
      description={`${reservation.resNo} · ${reservation.covers} guests · booked for ${formatTime24(reservation.time)}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => seat(false)} disabled={busy || !tableNo} className="!bg-emerald-700 text-white hover:!bg-emerald-800">
            {busy ? "Seating…" : `Seat at ${tableNo || "table"}`}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {reservation.status === "No Show" && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            This booking was marked No Show. Seating it now will reopen it as Seated.
          </p>
        )}
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
        {conflict && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <p className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="h-3.5 w-3.5" /> Another booking needs this table soon
            </p>
            <p className="mt-0.5">{conflict}</p>
            <Button
              onClick={() => seat(true)}
              disabled={busy}
              className="mt-2 h-7 !bg-amber-600 px-2.5 text-[11px] font-bold text-white hover:!bg-amber-700"
            >
              Seat anyway
            </Button>
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-semibold text-slate-700">Choose table</p>
          {floor.loading && floor.data.length === 0 ? (
            <p className="rounded-lg bg-slate-50 px-3 py-6 text-center text-xs text-slate-400">Loading tables…</p>
          ) : (
            <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
              {tables.map((t) => {
                const free = (t.displayState ?? "BLANK") === "BLANK";
                const other = t.reservation && t.reservation.id !== reservation.id && ["reserved", "late"].includes(t.reservation.phase);
                const on = norm(tableNo) === norm(t.tableNo);
                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={!free}
                    onClick={() => {
                      setTableNo(t.tableNo);
                      setConflict(null);
                    }}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-50",
                      on ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500" : "border-slate-200 bg-white hover:border-slate-300",
                    )}
                  >
                    <span className="flex items-center justify-between text-sm font-bold text-slate-900">
                      {t.tableNo}
                      {reserved.has(norm(t.tableNo)) && (
                        <span className="rounded bg-violet-100 px-1 text-[9px] font-bold uppercase text-violet-700">Booked</span>
                      )}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Users className="h-3 w-3" /> {t.capacity || "—"}
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 block truncate text-[10px] font-semibold",
                        !free ? "text-rose-600" : other ? "text-amber-700" : "text-emerald-700",
                      )}
                    >
                      {!free
                        ? `Occupied · ${t.guest}`
                        : other
                          ? `Held for ${t.reservation?.guest} ${formatClock(t.reservation?.startsAt)}`
                          : "Free"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <p className="text-[11px] text-slate-500">
          Seating opens a dining session: the reservation becomes Seated and the table becomes Occupied.
        </p>
      </div>
    </Modal>
  );
}
