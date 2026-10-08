export type ReservationStatus = "Confirmed" | "Seated" | "Completed" | "No Show" | "Cancelled";

/**
 * Where a booking stands right now. Only `reserved` and `late` hold the table:
 * upcoming → (start − buffer) reserved → start → late → (start + grace) overdue → auto No Show.
 */
export type ReservationPhase =
  | "unscheduled"
  | "upcoming"
  | "reserved"
  | "late"
  | "overdue"
  | "seated"
  | "completed"
  | "no_show"
  | "cancelled";

export type Reservation = {
  id: string;
  resNo: string;
  outletId: string;
  guest: string;
  phone: string;
  covers: number;
  tableNo: string;
  tableNos: string[];
  status: ReservationStatus;
  reservationDate: string | null;
  time: string;
  durationMin: number;
  startsAt: string | null;
  endsAt: string | null;
  blockFrom: string | null;
  /** start + grace; still Confirmed after this, the booking is auto-marked No Show. */
  graceEndsAt: string | null;
  bufferBeforeMin: number;
  gracePeriodMin: number;
  phase: ReservationPhase;
  sessionId: string | null;
  notes?: string;
  statusNote?: string;
  seatedAt?: string | null;
  completedAt?: string | null;
  noShowAt?: string | null;
  cancelledAt?: string | null;
  createdAt?: string;
};

export type ReservationInput = {
  guest: string;
  phone: string;
  reservationDate: string;
  time: string;
  covers: number;
  outletId: string;
  tableNo: string;
  durationMin: number;
  notes: string;
  override?: boolean;
};

export type ReservationSettings = {
  scopeKey: string;
  bufferBeforeMin: number;
  gracePeriodMin: number;
  defaultDurationMin: number;
  updatedAt?: string;
};

export type ReservationSettingsBundle = {
  global: ReservationSettings;
  outlets: ReservationSettings[];
};

/** Overlay the floor plan attaches to each table; independent of the table's physical status. */
export type TableReservationOverlay = {
  id: string;
  resNo: string;
  guest: string;
  phone: string;
  time: string;
  covers: number;
  startsAt: string | null;
  blockFrom: string | null;
  graceEndsAt: string | null;
  endsAt: string | null;
  phase: ReservationPhase;
  conflict: boolean;
};

export const RESERVATION_STATUSES: ReservationStatus[] = ["Confirmed", "Seated", "Completed", "No Show", "Cancelled"];

export const statusTone: Record<ReservationStatus, string> = {
  Confirmed: "bg-violet-50 text-violet-700 ring-violet-200",
  Seated: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Completed: "bg-slate-100 text-slate-600 ring-slate-200",
  "No Show": "bg-rose-50 text-rose-700 ring-rose-200",
  Cancelled: "bg-amber-50 text-amber-700 ring-amber-200",
};

export const phaseMeta: Record<ReservationPhase, { label: string; tone: string }> = {
  unscheduled: { label: "No date", tone: "text-slate-500" },
  upcoming: { label: "Upcoming", tone: "text-sky-700" },
  reserved: { label: "Table held", tone: "text-violet-700" },
  late: { label: "Running late", tone: "text-amber-700" },
  overdue: { label: "Grace over", tone: "text-rose-700" },
  seated: { label: "Dining", tone: "text-emerald-700" },
  completed: { label: "Done", tone: "text-slate-500" },
  no_show: { label: "Didn't arrive", tone: "text-rose-700" },
  cancelled: { label: "Cancelled", tone: "text-amber-700" },
};

export const isHoldingTable = (phase: ReservationPhase) => phase === "reserved" || phase === "late";

export function formatClock(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

/** "19:30" → "7:30 PM" */
export function formatTime24(time: string | null | undefined) {
  const m = String(time ?? "").match(/^(\d{1,2}):(\d{2})/);
  if (!m) return time || "—";
  const h = Number(m[1]);
  return `${h % 12 || 12}:${m[2]} ${h >= 12 ? "PM" : "AM"}`;
}

export function formatDateLabel(date: string | null | undefined) {
  if (!date) return "No date";
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export function formatDuration(min: number) {
  if (!min) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h${m ? ` ${m}m` : ""}` : `${m}m`;
}

/** Minutes from now to an instant (negative when it's in the past). */
export function minutesUntil(iso: string | null | undefined, now = Date.now()) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : Math.round((t - now) / 60_000);
}

export function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function shiftDate(date: string, days: number) {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return localDateKey(d);
}

export const DURATION_PRESETS = [45, 60, 90, 120, 150, 180];

export const DEFAULT_RESERVATION_SETTINGS: ReservationSettings = {
  scopeKey: "global",
  bufferBeforeMin: 15,
  gracePeriodMin: 15,
  defaultDurationMin: 90,
};

export function settingsForOutlet(bundle: ReservationSettingsBundle | null, outletId: string) {
  if (!bundle) return DEFAULT_RESERVATION_SETTINGS;
  return bundle.outlets.find((s) => s.scopeKey === outletId) ?? bundle.global;
}

/** Same window math as the server, for previews while the form is being filled. */
export function previewWindow(date: string, time: string, durationMin: number, settings: ReservationSettings) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const startsAt = new Date(`${date}T${time}:00`);
  if (Number.isNaN(startsAt.getTime())) return null;
  const at = (offsetMin: number) => new Date(startsAt.getTime() + offsetMin * 60_000).toISOString();
  return {
    startsAt: startsAt.toISOString(),
    blockFrom: at(-settings.bufferBeforeMin),
    graceEndsAt: at(settings.gracePeriodMin),
    endsAt: at(durationMin),
  };
}

export const windowsOverlap = (aFrom: string, aTo: string, bFrom: string, bTo: string) =>
  new Date(aFrom).getTime() < new Date(bTo).getTime() && new Date(bFrom).getTime() < new Date(aTo).getTime();

/** Bookings that still hold (or will hold) their tables. */
export const isActiveBooking = (r: Reservation) =>
  r.status === "Seated" || (r.status === "Confirmed" && r.phase !== "overdue");
