import {
  cashierShiftRecords,
  dayClosingSummary,
  initialNightAuditItems,
  openPosTabs,
  pendingDepartures,
  roomChargePostings,
  type CashierShiftRecord,
  type DayClosingReport,
  type DayClosingSummary,
  type NightAuditItem,
  type NightAuditItemStatus,
  type OpenPosTab,
  type PendingDeparture,
  type RoomChargePosting,
} from "@/app/data/frontoffice/closing";

export type { NightAuditItem, NightAuditItemStatus };
export { initialNightAuditItems };

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

export function createInitialDayClosingState(): DayClosingSessionState {
  return {
    shifts: structuredClone(cashierShiftRecords),
    pending: structuredClone(pendingDepartures),
    charges: structuredClone(roomChargePostings),
    posTabs: structuredClone(openPosTabs),
    summary: structuredClone(dayClosingSummary),
    completed: false,
    report: null,
    nightAuditCompleted: false,
  };
}

export function createInitialNightAuditState(): NightAuditSessionState {
  return {
    items: structuredClone(initialNightAuditItems),
    running: false,
    completed: false,
    completedAt: null,
    completedBy: null,
    auditLog: [],
  };
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
  if (typeof window === "undefined") return createInitialDayClosingState();
  try {
    const raw = sessionStorage.getItem(DAY_CLOSING_STORAGE_KEY);
    if (!raw) return createInitialDayClosingState();
    const parsed = JSON.parse(raw) as DayClosingSessionState;
    return {
      ...createInitialDayClosingState(),
      ...parsed,
      nightAuditCompleted: parsed.nightAuditCompleted ?? false,
    };
  } catch {
    return createInitialDayClosingState();
  }
}

export function saveDayClosingState(state: DayClosingSessionState) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(DAY_CLOSING_STORAGE_KEY, JSON.stringify(state));
}

export function clearDayClosingState() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(DAY_CLOSING_STORAGE_KEY);
}

export function loadNightAuditState(): NightAuditSessionState {
  if (typeof window === "undefined") return createInitialNightAuditState();
  try {
    const raw = sessionStorage.getItem(NIGHT_AUDIT_STORAGE_KEY);
    if (!raw) return createInitialNightAuditState();
    return {
      ...createInitialNightAuditState(),
      ...(JSON.parse(raw) as NightAuditSessionState),
    };
  } catch {
    return createInitialNightAuditState();
  }
}

export function saveNightAuditState(state: NightAuditSessionState) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(NIGHT_AUDIT_STORAGE_KEY, JSON.stringify(state));
}

export function clearNightAuditState() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(NIGHT_AUDIT_STORAGE_KEY);
}

export function resetClosingDemo() {
  clearDayClosingState();
  clearNightAuditState();
}
