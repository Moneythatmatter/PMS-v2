/** Check-in dates are stored either as ISO (`2026-08-05`) or display text (`5 Aug 2026`). */

export function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isArrivingToday(booking: {
  checkIn?: string;
  arrivingToday?: boolean;
}) {
  if (booking.arrivingToday) return true;
  const checkIn = String(booking.checkIn ?? "").trim();
  if (!checkIn) return false;
  const today = todayIso();
  const displayToday = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return (
    checkIn === today ||
    checkIn.startsWith(today) ||
    checkIn.includes(displayToday)
  );
}
