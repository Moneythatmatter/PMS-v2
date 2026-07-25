import { api, foPath } from "../api";
import type {
  CashierShiftRecord,
  DayClosingReport,
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
export const dayClosingService = crud<DayClosingReport & { id: string; businessDate: string }>(
  "/day-closing",
);

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
