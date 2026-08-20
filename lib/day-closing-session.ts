import type {
  CashierShiftRecord,
  DayClosingReport,
  DayClosingSummary,
  NightAuditItem,
  NightAuditItemStatus,
  OpenPosTab,
  PendingDeparture,
  RoomChargePosting,
} from "@/app/data/frontoffice/closing";
import {
  cashierShiftService,
  reservationService,
  roomChargePostingService,
} from "@/services/front-office";

export type { NightAuditItem, NightAuditItemStatus };

export const DAY_CLOSING_STORAGE_KEY = "pms-day-closing-v1";
export const NIGHT_AUDIT_STORAGE_KEY = "pms-night-audit-v1";

export type DayClosingSessionState = {
  shifts: CashierShiftRecord[];
  pending: PendingDeparture[];
  charges: RoomChargePosting[];
  posTabs: OpenPosTab[];
  summary: DayClosingSummary;
  completed: boolean;
  report: DayClosingReport | null;
  nightAuditCompleted: boolean;
};

export type NightAuditSessionState = {
  items: NightAuditItem[];
  running: boolean;
  completed: boolean;
  completedAt: string | null;
  completedBy: string | null;
  auditLog: string[];
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function createEmptyDayClosingSummary(
  businessDate = todayIso(),
): DayClosingSummary {
  return {
    businessDate,
    totalRevenue: 0,
    roomRevenue: 0,
    fbRevenue: 0,
    otherRevenue: 0,
    occupancy: 0,
    arrivals: 0,
    departures: 0,
    inHouse: 0,
    pendingCheckouts: 0,
  };
}

export function createInitialDayClosingState(): DayClosingSessionState {
  return {
    shifts: [],
    pending: [],
    charges: [],
    posTabs: [],
    summary: createEmptyDayClosingSummary(),
    completed: false,
    report: null,
    nightAuditCompleted: false,
  };
}

export function createInitialNightAuditState(): NightAuditSessionState {
  return {
    items: [],
    running: false,
    completed: false,
    completedAt: null,
    completedBy: null,
    auditLog: [],
  };
}

/** Load live day-closing inputs from FO APIs (no mock seed). */
export async function fetchLiveDayClosingState(): Promise<
  Pick<DayClosingSessionState, "shifts" | "pending" | "charges" | "posTabs" | "summary">
> {
  const [shifts, inHouse, charges] = await Promise.all([
    cashierShiftService.list().catch(() => [] as CashierShiftRecord[]),
    reservationService.inHouse().catch(() => []),
    roomChargePostingService.list().catch(() => [] as RoomChargePosting[]),
  ]);

  const today = todayIso();
  const pending: PendingDeparture[] = inHouse
    .filter((g) => {
      const out = String(g.checkOut || "").slice(0, 10);
      return !out || out <= today;
    })
    .map((g) => ({
      id: g.id,
      guestName: g.guestName,
      roomNo: g.room,
      checkOut: g.checkOut,
      balance: g.balance ?? 0,
      status: "Pending" as const,
    }));

  const summary: DayClosingSummary = {
    ...createEmptyDayClosingSummary(today),
    inHouse: inHouse.length,
    pendingCheckouts: pending.length,
    roomRevenue: charges.reduce(
      (sum, c) => sum + (c.roomRate || 0) + (c.extras || 0),
      0,
    ),
    totalRevenue: charges.reduce(
      (sum, c) => sum + (c.roomRate || 0) + (c.extras || 0),
      0,
    ),
  };

  return {
    shifts,
    pending,
    charges,
    posTabs: [],
    summary,
  };
}

/** Build night-audit rows from room charge postings / in-house guests. */
export async function fetchLiveNightAuditItems(): Promise<NightAuditItem[]> {
  const [charges, inHouse] = await Promise.all([
    roomChargePostingService.list().catch(() => [] as RoomChargePosting[]),
    reservationService.inHouse().catch(() => []),
  ]);

  if (charges.length > 0) {
    return charges.map((c) => ({
      id: c.id,
      roomNo: c.roomNo,
      guestName: c.guestName,
      roomRate: c.roomRate,
      extras: c.extras,
      posted: c.roomRate + c.extras,
      auditTime: "",
      status: c.status === "Posted" ? ("Posted" as const) : ("Pending" as const),
    }));
  }

  return inHouse.map((g) => ({
    id: g.id,
    roomNo: g.room,
    guestName: g.guestName,
    roomRate: Math.max(0, (g.balance || 0) - (g.restaurantBill || 0) - (g.laundry || 0)),
    extras: (g.restaurantBill || 0) + (g.laundry || 0),
    posted: g.balance || 0,
    auditTime: "",
    status: "Pending" as const,
  }));
}

export function addDaysIso(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatBusinessDate(isoDate: string) {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function loadDayClosingState(): DayClosingSessionState {
  return createInitialDayClosingState();
}

export function saveDayClosingState(_state: DayClosingSessionState) {
  /* in-memory only — no browser persistence */
}

export function clearDayClosingState() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(DAY_CLOSING_STORAGE_KEY);
  }
}

export function loadNightAuditState(): NightAuditSessionState {
  return createInitialNightAuditState();
}

export function saveNightAuditState(_state: NightAuditSessionState) {
  /* in-memory only — no browser persistence */
}

export function clearNightAuditState() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(NIGHT_AUDIT_STORAGE_KEY);
  }
}

export function resetClosingDemo() {
  clearDayClosingState();
  clearNightAuditState();
}
