/** Check-in / check-out dates are stored either as ISO (`2026-08-05`) or display text (`5 Aug 2026`). */

export function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function matchesToday(dateValue?: string) {
  const value = String(dateValue ?? "").trim();
  if (!value) return false;
  const today = todayIso();
  const displayToday = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return (
    value === today ||
    value.startsWith(today) ||
    value.includes(displayToday)
  );
}

export function isArrivingToday(booking: {
  checkIn?: string;
  arrivingToday?: boolean;
}) {
  if (booking.arrivingToday) return true;
  return matchesToday(booking.checkIn);
}

export function isDepartingToday(booking: {
  checkOut?: string;
  departingToday?: boolean;
}) {
  // Only trust the stored flag when no check-out date is available.
  if (booking.checkOut) return matchesToday(booking.checkOut);
  return booking.departingToday === true;
}
