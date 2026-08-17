/** Human-readable booking reference for UI (BK-0, BK-1, …). */
export function displayBookingNo(
  booking: { bookingNo?: string | null; id?: string | null },
): string {
  const no = String(booking.bookingNo ?? "").trim();
  if (no) return no;
  return String(booking.id ?? "").trim();
}
