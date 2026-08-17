import { displayBookingNo } from "@/lib/booking-display";

/** Booking + guest refs for list rows and drawer subtitles. */
export function formatBookingGuestLine(
  booking: {
    bookingNo?: string | null;
    guestNo?: string | null;
    guestId?: string | null;
    id?: string | null;
    phone?: string | null;
  },
): string {
  const guestNo = String(booking.guestNo ?? "").trim();
  const parts = [
    displayBookingNo(booking),
    ...(guestNo ? [guestNo] : []),
    booking.phone?.trim(),
  ].filter(Boolean);
  return parts.join(" · ");
}
