"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BedDouble,
  Calendar,
  CreditCard,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Printer,
  User,
  Utensils,
} from "lucide-react";
import type { ReservationBooking } from "@/app/data/types";
import { reservationService } from "@/services/front-office";
import { Button } from "@/components/ui/Button";
import { Drawer, formatINR } from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";
import { displayBookingNo } from "@/lib/booking-display";
import { formatBookingGuestLine } from "@/lib/reservation-display";
import { ReservationStatusBadge } from "./ReservationStatusBadge";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function DetailRow({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-3 py-3", className)}>
      {Icon && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <Icon className="h-3.5 w-3.5" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-slate-100 pb-4 last:border-0">
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </h3>
      <div className="divide-y divide-slate-50">{children}</div>
    </section>
  );
}

interface BookingDetailDrawerProps {
  booking: ReservationBooking | null;
  onClose: () => void;
  onCancel?: (booking: ReservationBooking) => void;
}

export function BookingDetailDrawer({ booking, onClose, onCancel }: BookingDetailDrawerProps) {
  const [detail, setDetail] = useState<ReservationBooking | null>(booking);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!booking?.id) {
      setDetail(null);
      return;
    }
    setDetail(booking);
    let cancelled = false;
    (async () => {
      try {
        setLoadingDetail(true);
        const full = await reservationService.get(booking.id);
        if (!cancelled) setDetail(full);
      } catch {
        if (!cancelled) setDetail(booking);
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [booking?.id]);

  if (!booking || !detail) return null;

  const open = true;
  const guestNo = detail.guestNo?.trim() || "—";

  const nights = detail.nights ?? 3;
  const roomRate = detail.roomRate ?? Math.round((detail.totalAmount ?? detail.balance + (detail.advancePaid ?? 0)) / nights);
  const total = detail.totalAmount ?? detail.balance + (detail.advancePaid ?? 0);
  const advance = detail.advancePaid ?? 0;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={detail.guestName ?? "Guest"}
      description={formatBookingGuestLine(detail)}
      width="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button variant="outline" className="gap-1.5" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
          {detail.status === "Checked In" || detail.status === "In-House" ? (
            <Link href="/frontoffice/check-out">
              <Button className="gap-1.5 bg-emerald-700 hover:bg-emerald-800">
                <LogOut className="h-3.5 w-3.5" />
                Check Out
              </Button>
            </Link>
          ) : detail.status !== "Cancelled" && detail.status !== "Checked Out" ? (
            <Link href="/frontoffice/check-in">
              <Button className="gap-1.5 bg-emerald-700 hover:bg-emerald-800">
                <LogIn className="h-3.5 w-3.5" />
                Check In
              </Button>
            </Link>
          ) : null}
        </>
      }
    >
      {/* Guest header */}
      <div className="mb-6 flex items-center gap-4 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/50 p-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-lg font-bold text-white shadow-md shadow-emerald-200/50">
          {getInitials(detail.guestName ?? "G")}
        </div>
        <div className="min-w-0 flex-1">
          <ReservationStatusBadge status={detail.status} />
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600 shadow-sm">
              {detail.source}
            </span>
            {detail.arrivingToday && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                Arriving Today
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stay summary tiles */}
      <div className="mb-6 grid grid-cols-3 gap-2">
        {[
          { label: "Nights", value: nights },
          { label: "Adults", value: detail.adults ?? 1 },
          { label: "Children", value: detail.children ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-center">
            <p className="text-[10px] font-medium uppercase text-slate-400">{label}</p>
            <p className="mt-0.5 text-lg font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-5">
        <Section title="Guest Information">
          <DetailRow icon={User} label="Guest No." value={loadingDetail ? "…" : guestNo} />
          <DetailRow icon={Phone} label="Mobile" value={detail.phone ?? "—"} />
          {detail.email && <DetailRow icon={Mail} label="Email" value={detail.email} />}
          {detail.nationality && (
            <DetailRow icon={MapPin} label="Nationality" value={detail.nationality} />
          )}
          {detail.idProofType && (
            <DetailRow
              icon={User}
              label="ID Proof"
              value={`${detail.idProofType}${detail.idNumber ? ` · ${detail.idNumber}` : ""}`}
            />
          )}
        </Section>

        <Section title="Stay Details">
          <DetailRow icon={Calendar} label="Check-in" value={detail.checkIn} />
          <DetailRow icon={Calendar} label="Check-out" value={detail.checkOut} />
          <DetailRow
            icon={BedDouble}
            label="Room"
            value={`Room ${detail.roomNo ?? "TBA"} · ${detail.roomType ?? "—"}`}
          />
          {detail.tariffPlan && (
            <DetailRow label="Tariff Plan" value={detail.tariffPlan} />
          )}
          {detail.mealPlan && (
            <DetailRow icon={Utensils} label="Meal Plan" value={detail.mealPlan} />
          )}
        </Section>

        <Section title="Payment Summary">
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Room rate × {nights} night{nights !== 1 ? "s" : ""}</span>
                <span>{formatINR(roomRate)} × {nights}</span>
              </div>
              <div className="flex justify-between font-medium text-slate-800">
                <span>Total Amount</span>
                <span>{formatINR(total)}</span>
              </div>
              {advance > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Advance Paid{detail.paymentMode ? ` (${detail.paymentMode})` : ""}</span>
                  <span>− {formatINR(advance)}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-900">Balance Due</span>
                  <span className={cn("text-lg font-bold", detail.balance > 0 ? "text-amber-600" : "text-emerald-600")}>
                    {formatINR(detail.balance)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {detail.specialRequests && (
          <Section title="Special Requests">
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {detail.specialRequests}
            </p>
          </Section>
        )}

        <Section title="Booking Meta">
          {detail.createdAt && (
            <DetailRow label="Created" value={detail.createdAt} />
          )}
          {detail.bookedBy && (
            <DetailRow label="Booked By" value={detail.bookedBy} />
          )}
          <DetailRow icon={CreditCard} label="Booking No." value={displayBookingNo(detail)} />
          <DetailRow icon={User} label="Guest No." value={loadingDetail ? "…" : guestNo} />
        </Section>
      </div>

      {onCancel && detail.status !== "Cancelled" && detail.status !== "Checked Out" && (
        <div className="mt-6 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => onCancel(detail)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <Pencil className="h-3.5 w-3.5" />
            Cancel Reservation
          </button>
        </div>
      )}
    </Drawer>
  );
}
