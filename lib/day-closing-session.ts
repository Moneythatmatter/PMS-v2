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
import { safeGetStorage, safeRemoveStorage, safeSetStorage } from "@/lib/utils";

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
  const initial = createInitialDayClosingState();
  const parsed = safeGetStorage<Partial<DayClosingSessionState> | null>(
    DAY_CLOSING_STORAGE_KEY,
    null,
    true,
  );
  if (!parsed) return initial;
  return {
    ...initial,
    ...parsed,
    nightAuditCompleted: parsed.nightAuditCompleted ?? false,
  };
}

export function saveDayClosingState(state: DayClosingSessionState) {
  safeSetStorage(DAY_CLOSING_STORAGE_KEY, state, true);
}

export function clearDayClosingState() {
  safeRemoveStorage(DAY_CLOSING_STORAGE_KEY, true);
}

export function loadNightAuditState(): NightAuditSessionState {
  const initial = createInitialNightAuditState();
  const parsed = safeGetStorage<Partial<NightAuditSessionState> | null>(
    NIGHT_AUDIT_STORAGE_KEY,
    null,
    true,
  );
  if (!parsed) return initial;
  return {
    ...initial,
    ...parsed,
  };
}

export function saveNightAuditState(state: NightAuditSessionState) {
  safeSetStorage(NIGHT_AUDIT_STORAGE_KEY, state, true);
}

export function clearNightAuditState() {
  safeRemoveStorage(NIGHT_AUDIT_STORAGE_KEY, true);
}

export function resetClosingDemo() {
  clearDayClosingState();
  clearNightAuditState();
}
