"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BedDouble,
  Building2,
  ExternalLink,
  Eye,
  EyeOff,
  Gift,
  Mail,
  Pencil,
  Printer,
  Send,
  Smartphone,
  Tag,
  User,
  Users,
  X,
} from "lucide-react";
import type { ReservationBooking } from "@/app/data/types";
import { reservationService } from "@/services/front-office/reservations";
import { usePropertyOptional } from "@/components/platform/PropertyProvider";
import { formatINR } from "@/components/frontoffice/ui";
import { displayBookingNo } from "@/lib/booking-display";
import { cn } from "@/lib/utils";
import { printBookingDetail } from "./bookingPrintUtils";
import { ReservationStatusBadge } from "./ReservationStatusBadge";

export type ReservationQuickViewProps = {
  bookingId: string | null;
  onClose: () => void;
};

function maskPhone(value?: string) {
  if (!value) return "";
  const digits = value.replace(/\s+/g, "");
  return digits.length <= 4 ? digits : `${"*".repeat(Math.max(digits.length - 4, 4))}${digits.slice(-4)}`;
}

function maskEmail(value?: string) {
  if (!value) return "";
  const [name, domain] = value.split("@");
  if (!domain) return value;
  return `${name.slice(0, 1)}****@${domain}`;
}

function formatStayDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" });
}

function stayNights(b: ReservationBooking) {
  if (b.nights) return b.nights;
  const a = new Date(`${b.checkIn.slice(0, 10)}T00:00:00`).getTime();
  const c = new Date(`${b.checkOut.slice(0, 10)}T00:00:00`).getTime();
  return Number.isFinite(a) && Number.isFinite(c) ? Math.max(1, Math.round((c - a) / 86_400_000)) : 1;
}

export function ReservationQuickView({ bookingId, onClose }: ReservationQuickViewProps) {
  if (!bookingId) return null;
  return <ReservationQuickViewDialog key={bookingId} bookingId={bookingId} onClose={onClose} />;
}

function ReservationQuickViewDialog({ bookingId, onClose }: { bookingId: string; onClose: () => void }) {
  const propertyCtx = usePropertyOptional();
  const propertyName = propertyCtx?.property?.name ?? "IMPACT PMS";
  const [booking, setBooking] = useState<ReservationBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    reservationService
      .get(bookingId)
      .then((b) => {
        if (!cancelled) setBooking(b);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load reservation");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const total = Number(booking?.totalAmount ?? 0);
  const balance = Number(booking?.balance ?? 0);
  const paid = booking?.advancePaid != null ? Number(booking.advancePaid) : Math.max(0, total - balance);
  const isGroup = Boolean(booking?.groupId);

  const handlePrint = () => {
    if (!booking) return;
    if (!printBookingDetail(booking, propertyName)) {
      setNotice("Unable to open print dialog. Allow pop-ups and try again.");
    }
  };

  const handleEmail = () => {
    if (!booking) return;
    if (!booking.email) {
      setNotice("No email address on this reservation.");
      return;
    }
    const subject = `Reservation ${displayBookingNo(booking)} — ${propertyName}`;
    const body = [
      `Dear ${booking.guestName ?? "Guest"},`,
      "",
      `Your reservation at ${propertyName} is confirmed.`,
      "",
      `Booking No: ${displayBookingNo(booking)}`,
      `Room: ${booking.roomType ?? ""}${booking.roomNo ? ` #${booking.roomNo}` : ""}`,
      `Check-in: ${formatStayDate(booking.checkIn)}`,
      `Check-out: ${formatStayDate(booking.checkOut)} (${stayNights(booking)} night(s))`,
      `Total: ${formatINR(total)}`,
      `Paid: ${formatINR(paid)}`,
      `Balance: ${formatINR(balance)}`,
      "",
      "We look forward to welcoming you.",
    ].join("\n");
    window.location.href = `mailto:${booking.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close reservation"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-2xl overflow-hidden rounded-xl bg-slate-50 shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 bg-slate-800 px-5 py-3 text-white">
          <h2 className="text-sm font-semibold">
            {isGroup ? "Group Reservation" : "Single Reservation"}
          </h2>
          <div className="flex items-center gap-4">
            {booking && (
              <span className="text-sm text-slate-300">
                Res # <span className="font-bold text-amber-400">{displayBookingNo(booking)}</span>
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-slate-300 hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          {loading && <p className="py-10 text-center text-sm text-slate-500">Loading reservation…</p>}
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>
          )}
          {notice && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">{notice}</p>
          )}

          {booking && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                        <User className="h-4 w-4" />
                      </span>
                      {booking.guestId ? (
                        <Link
                          href={`/frontoffice/guest-profiles?guestId=${encodeURIComponent(booking.guestId)}`}
                          className="truncate text-base font-bold text-slate-900 hover:text-emerald-700 hover:underline"
                        >
                          {booking.guestName ?? "Guest"}
                        </Link>
                      ) : (
                        <span className="truncate text-base font-bold text-slate-900">
                          {booking.guestName ?? "Guest"}
                        </span>
                      )}
                      {booking.guestNo && (
                        <span className="shrink-0 rounded-full border border-slate-300 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {booking.guestNo}
                        </span>
                      )}
                    </div>
                    {(booking.phone || booking.email) && (
                      <button
                        type="button"
                        onClick={() => setReveal((v) => !v)}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        title={reveal ? "Hide contact details" : "Show contact details"}
                      >
                        {reveal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </div>
                  <dl className="mt-3 space-y-2 text-sm text-slate-600">
                    {booking.companyName && <ContactLine icon={Building2} value={booking.companyName} />}
                    <ContactLine icon={Smartphone} value={reveal ? booking.phone : maskPhone(booking.phone)} />
                    <ContactLine
                      icon={Mail}
                      value={reveal ? booking.email : maskEmail(booking.email)}
                      className="text-sky-700"
                    />
                  </dl>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                        <BedDouble className="h-4 w-4" />
                      </span>
                      <span className="truncate text-base font-bold text-slate-900">
                        {booking.roomType ?? "Room"}
                        {booking.roomNo ? ` | #${booking.roomNo}` : ""}
                      </span>
                    </div>
                    <ReservationStatusBadge status={booking.status} />
                  </div>
                  <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Stay Details</p>
                  <div className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <span>{formatStayDate(booking.checkIn)}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      {stayNights(booking)}N
                    </span>
                    <span>{formatStayDate(booking.checkOut)}</span>
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                    <Users className="h-3.5 w-3.5" />
                    {booking.adults ?? 1} Adult{(booking.adults ?? 1) !== 1 ? "s" : ""}
                    {booking.children ? ` · ${booking.children} Child${booking.children !== 1 ? "ren" : ""}` : ""}
                  </p>
                  {isGroup && (
                    <p className="mt-2 text-xs text-slate-500">
                      Group:{" "}
                      <Link
                        href={`/frontoffice/group-booking/${booking.groupId}`}
                        className="font-semibold text-indigo-700 hover:underline"
                      >
                        {booking.groupName ?? booking.groupNo ?? "Open group"}
                      </Link>
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-slate-500" />
                      <span className="font-semibold text-slate-800">Rate:</span>
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-700">
                        {booking.tariffPlan || "Standard Rate"}
                      </span>
                    </p>
                    {booking.roomRate ? (
                      <p className="text-xs text-slate-500">{formatINR(Number(booking.roomRate))} / night</p>
                    ) : null}
                    <p className="flex items-center gap-1.5 text-xs">
                      <Gift className="h-3.5 w-3.5 text-slate-500" />
                      <span className="font-semibold text-slate-700">Includes:</span>
                      <span className="text-slate-600">{booking.mealPlan || "Room only"}</span>
                    </p>
                    {booking.source && <p className="text-xs text-slate-500">Source: {booking.source}</p>}
                  </div>
                  <dl className="space-y-2 rounded-lg bg-slate-50 p-3 text-sm sm:min-w-[15rem] sm:justify-self-end">
                    <AmountRow label="Total" value={formatINR(total)} />
                    <AmountRow label="Paid" value={formatINR(paid)} className="text-emerald-700" />
                    <div
                      className={cn(
                        "-mx-3 -mb-3 flex items-center justify-between gap-6 rounded-b-lg px-3 py-2",
                        balance > 0 ? "bg-red-50" : "bg-emerald-50",
                      )}
                    >
                      <dt className="font-semibold text-slate-700">Balance:</dt>
                      <dd
                        className={cn(
                          "text-base font-bold tabular-nums",
                          balance > 0 ? "text-red-600" : "text-emerald-700",
                        )}
                      >
                        {formatINR(balance)}
                      </dd>
                    </div>
                  </dl>
                </div>
                {booking.specialRequests && (
                  <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    <span className="font-semibold">Special requests: </span>
                    {booking.specialRequests}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-200 bg-white px-5 py-3">
          <button
            type="button"
            disabled={!booking}
            onClick={handlePrint}
            className={cn(btnCls, "bg-slate-600 text-white hover:bg-slate-700")}
          >
            <Printer className="h-3.5 w-3.5" /> Print Reservation Card
          </button>
          <button
            type="button"
            disabled={!booking}
            onClick={handleEmail}
            className={cn(btnCls, "bg-blue-600 text-white hover:bg-blue-700")}
          >
            <Send className="h-3.5 w-3.5" /> Send Email
          </button>
          {booking ? (
            <Link
              href={`/frontoffice/reservation/new?bookingId=${encodeURIComponent(booking.id)}`}
              className={cn(btnCls, "bg-amber-400 text-slate-900 hover:bg-amber-500")}
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Link>
          ) : null}
          {booking ? (
            <Link
              href={`/frontoffice/reservation/all-bookings/${encodeURIComponent(booking.id)}`}
              className={cn(btnCls, "bg-emerald-700 text-white hover:bg-emerald-800")}
            >
              <ExternalLink className="h-3.5 w-3.5" /> View Details
            </Link>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className={cn(btnCls, "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50")}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

const btnCls =
  "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-colors disabled:opacity-50";

function ContactLine({
  icon: Icon,
  value,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value?: string;
  className?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      <span className={cn("truncate", value ? className : "text-slate-300")}>{value || "—"}</span>
    </div>
  );
}

function AmountRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <dt className="font-semibold text-slate-700">{label}:</dt>
      <dd className={cn("font-semibold tabular-nums text-slate-900", className)}>{value}</dd>
    </div>
  );
}
