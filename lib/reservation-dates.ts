/** Check-in / check-out dates are stored either as ISO (`2026-08-05`) or display text (`5 Aug 2026`). */

export function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function normalizeToIso(dateValue?: string): string | null {
  const value = String(dateValue ?? "").trim();
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return null;
}

export function matchesDate(dateValue: string | undefined, isoDate: string) {
  const value = String(dateValue ?? "").trim();
  if (!value || !isoDate) return false;

  const normalized = normalizeToIso(value);
  if (normalized === isoDate) return true;

  const target = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(target.getTime())) return false;
  const displayTarget = target.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return value === displayTarget || value.includes(displayTarget);
}

function matchesToday(dateValue?: string) {
  return matchesDate(dateValue, todayIso());
}

export function isArrivingToday(booking: {
  checkIn?: string;
  arrivingToday?: boolean;
}) {
  if (booking.arrivingToday) return true;
  return matchesToday(booking.checkIn);
}

export function isArrivingOnDate(
  booking: {
    checkIn?: string;
    arrivingToday?: boolean;
  },
  isoDate: string,
) {
  if (booking.checkIn) return matchesDate(booking.checkIn, isoDate);
  if (isoDate === todayIso()) return booking.arrivingToday === true;
  return false;
}

export function isDepartingOnDate(
  booking: {
    checkOut?: string;
    departingToday?: boolean;
  },
  isoDate: string,
) {
  if (booking.checkOut) return matchesDate(booking.checkOut, isoDate);
  if (isoDate === todayIso()) return booking.departingToday === true;
  return false;
}

export function isDepartingToday(booking: {
  checkOut?: string;
  departingToday?: boolean;
}) {
  // Only trust the stored flag when no check-out date is available.
  if (booking.checkOut) return matchesToday(booking.checkOut);
  return booking.departingToday === true;
}
