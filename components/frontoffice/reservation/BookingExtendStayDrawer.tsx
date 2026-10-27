"use client";

import { useState } from "react";
import type { ReservationBooking } from "@/app/data/types";
import { reservationService } from "@/services/front-office";
import { Button } from "@/components/ui/Button";
import { AlertBanner, Drawer, FormField, TextInput, formatINR } from "@/components/frontoffice/ui";
import { normalizeToIso } from "@/lib/reservation-dates";

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function daysBetween(fromIso: string, toIso: string): number {
  return Math.round(
    (Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / 86_400_000,
  );
}

export function BookingExtendStayDrawer({
  booking,
  onClose,
  onExtended,
}: {
  booking: ReservationBooking;
  onClose: () => void;
  onExtended: (checkOut: string, extraNights: number) => void;
}) {
  const currentCheckOut = normalizeToIso(booking.checkOut) || booking.checkOut;
  const [checkOut, setCheckOut] = useState(() => addDays(currentCheckOut, 1));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nights = booking.nights || 1;
  const rate = booking.roomRate ?? Math.round((booking.totalAmount ?? 0) / nights);
  const extraNights = checkOut ? Math.max(0, daysBetween(currentCheckOut, checkOut)) : 0;
  const extraAmount = extraNights * rate;

  const handleSubmit = async () => {
    if (extraNights <= 0) {
      setError("Pick a date after the current check-out.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await reservationService.extendStay(booking.id, { checkOut });
      onExtended(checkOut, extraNights);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to extend stay");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title="Extend Stay"
      description={`${booking.guestName ?? "Guest"} · Room ${booking.roomNo || "TBA"}`}
      width="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            className="bg-emerald-700 hover:bg-emerald-800"
            onClick={() => void handleSubmit()}
            disabled={submitting || extraNights <= 0}
          >
            {submitting ? "Extending…" : "Extend Stay"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <AlertBanner variant="error" message={error} onDismiss={() => setError(null)} />}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Current check-out">
            <TextInput value={currentCheckOut} disabled />
          </FormField>
          <FormField label="New check-out" required>
            <TextInput
              type="date"
              min={addDays(currentCheckOut, 1)}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </FormField>
        </div>
        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Extra nights</span>
            <span className="font-medium text-slate-900">{extraNights}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Room rate</span>
            <span className="font-medium text-slate-900">{formatINR(rate)} / night</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2">
            <span className="font-semibold text-slate-900">Added to folio</span>
            <span className="font-bold text-slate-900">{formatINR(extraAmount)}</span>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          The same room is kept. If it is booked by someone else for the new dates, transfer the guest first.
        </p>
      </div>
    </Drawer>
  );
}
