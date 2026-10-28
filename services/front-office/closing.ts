import { api, foPath } from "../api";
import type {
  CashierShiftRecord,
  RoomChargePosting,
} from "@/app/data/frontoffice/closing";

function crud<T>(base: string) {
  return {
    list: () => api.get<T[]>(foPath(base)),
    get: (id: string) => api.get<T>(foPath(`${base}/${id}`)),
    create: (body: Partial<T>) => api.post<T>(foPath(base), body),
    update: (id: string, body: Partial<T>) =>
      api.put<T>(foPath(`${base}/${id}`), body),
    remove: (id: string) => api.delete<{ id: string }>(foPath(`${base}/${id}`)),
  };
}

export const cashierShiftService = crud<CashierShiftRecord>("/cashier-shifts");
export const roomChargePostingService =
  crud<RoomChargePosting>("/room-charge-postings");
export type DayClosingCheck = {
  id: string;
  label: string;
  mandatory: boolean;
  passed: boolean;
  detail: string;
  href?: string;
};

export type DayClosingRecord = {
  id: string;
  businessDate: string;
  nextBusinessDate: string;
  totalRevenue: number;
  roomRevenue: number;
  fbRevenue: number;
  otherRevenue: number;
  occupancy: number;
  arrivals: number;
  departures: number;
  inHouse: number;
  pendingCheckouts: number;
  closedAt: string;
  closedBy: string;
  createdAt?: string;
};

export type DayClosingStatus = {
  businessDate: string;
  calendarDate: string;
  isBehind: boolean;
  canCloseDate: boolean;
  lastClosing: DayClosingRecord | null;
  checks: DayClosingCheck[];
  blockers: number;
  guests: {
    inHouse: number;
    stayingOver: number;
    arrivedToday: number;
    departedToday: number;
    pendingArrivals: number;
  };
  rooms: {
    total: number;
    occupied: number;
    vacant: number;
    dirty: number;
    clean: number;
    inspected: number;
    outOfOrder: number;
    sellable: number;
    occupancy: number;
    roomRevenue: number;
    adr: number;
    revpar: number;
  };
  collections: {
    byMethod: { method: string; label: string; amount: number }[];
    gross: number;
    refunds: number;
    net: number;
    bySource: { frontOffice: number; fnb: number; other: number };
    count: number;
  };
  outstanding: number;
  departments: {
    laundryPending: number;
    luggageStored: number;
    maintenanceOpen: number;
    maintenanceUrgent: number;
    fnbOpenBills: number;
  };
  dueOut: { id: string; guestName: string; roomNo: string; checkOut: string; balance: number }[];
  pendingArrivalList: { id: string; guestName: string; roomNo: string; status: string }[];
  unsettledSessions: {
    id: string;
    cashierName: string;
    shiftName: string;
    openedAt: string;
    status: string;
  }[];
};

export const dayClosingService = {
  status: () => api.get<DayClosingStatus>(foPath("/day-closing/status")),
  run: () => api.post<DayClosingRecord>(foPath("/day-closing/run")),
  history: (limit = 30) =>
    api.get<DayClosingRecord[]>(foPath(`/day-closing/history?limit=${limit}`)),
};

export type ReportResponse = {
  type: string;
  title: string;
  summary: Record<string, unknown>;
  rows: unknown[];
  generatedAt: string;
};

export const reportService = {
  get: (type: string) =>
    api.get<ReportResponse>(foPath(`/reports/${type}`)),
};
