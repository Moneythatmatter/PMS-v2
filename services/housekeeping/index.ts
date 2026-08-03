import { api } from "../api";
import type {
  HKRoom,
  HKPublicArea,
  HKChecklistTemplate,
  HKStaff,
  HKShift,
  HKInventoryItem,
  HKLaundryJob,
  HKDamageReport,
  HKRequisition,
  HKHistoryLog,
  HKLuggageJob,
} from "@/components/housekeeping/HousekeepingTypes";

/** Housekeeping base path helper. */
export const hkPath = (segment: string) =>
  `/api/housekeeping${segment.startsWith("/") ? segment : `/${segment}`}`;

function crud<T>(base: string) {
  return {
    list: (query = "") => api.get<T[]>(hkPath(`${base}${query}`)),
    get: (id: string) => api.get<T>(hkPath(`${base}/${id}`)),
    create: (body: Partial<T>) => api.post<T>(hkPath(base), body),
    update: (id: string, body: Partial<T>) =>
      api.put<T>(hkPath(`${base}/${id}`), body),
    remove: (id: string) => api.delete<{ id: string }>(hkPath(`${base}/${id}`)),
  };
}

export const hkDashboardService = {
  get: () => api.get<Record<string, unknown>>(hkPath("/dashboard")),
};

export const hkRoomService = {
  list: (query = "") => api.get<HKRoom[]>(hkPath(`/rooms${query}`)),
  get: (id: string) => api.get<HKRoom>(hkPath(`/rooms/${id}`)),
  create: (body: Partial<HKRoom>) => api.post<HKRoom>(hkPath("/rooms"), body),
  update: (id: string, body: Partial<HKRoom>) =>
    api.put<HKRoom>(hkPath(`/rooms/${id}`), body),
  remove: (id: string) => api.delete<{ id: string }>(hkPath(`/rooms/${id}`)),
  startClean: (id: string, assignedStaff?: string) =>
    api.post<HKRoom>(hkPath(`/rooms/${id}/start-clean`), { assignedStaff }),
  pauseClean: (id: string, paused?: boolean) =>
    api.post<HKRoom>(hkPath(`/rooms/${id}/pause-clean`), { paused }),
  completeClean: (
    id: string,
    body?: { assignedSupervisor?: string; photos?: string[]; remarks?: string },
  ) => api.post<HKRoom>(hkPath(`/rooms/${id}/complete-clean`), body ?? {}),
  inspect: (
    id: string,
    body: {
      result: "Passed" | "Rejected";
      qualityScore?: number;
      remarks?: string;
      inspector?: string;
      signature?: string;
    },
  ) => api.post<HKRoom>(hkPath(`/rooms/${id}/inspect`), body),
  markDirty: (id: string, user?: string) =>
    api.post<HKRoom>(hkPath(`/rooms/${id}/mark-dirty`), { user }),
};

export const hkLaundryService = {
  list: (query = "") => api.get<HKLaundryJob[]>(hkPath(`/laundry${query}`)),
  get: (id: string) => api.get<HKLaundryJob>(hkPath(`/laundry/${id}`)),
  create: (body: Partial<HKLaundryJob>) =>
    api.post<HKLaundryJob>(hkPath("/laundry"), body),
  update: (id: string, body: Partial<HKLaundryJob>) =>
    api.put<HKLaundryJob>(hkPath(`/laundry/${id}`), body),
  remove: (id: string) => api.delete<{ id: string }>(hkPath(`/laundry/${id}`)),
  advance: (id: string) =>
    api.post<HKLaundryJob>(hkPath(`/laundry/${id}/advance`), {}),
};

export const hkRequisitionService = {
  list: (query = "") =>
    api.get<HKRequisition[]>(hkPath(`/requisitions${query}`)),
  get: (id: string) => api.get<HKRequisition>(hkPath(`/requisitions/${id}`)),
  create: (body: Partial<HKRequisition>) =>
    api.post<HKRequisition>(hkPath("/requisitions"), body),
  update: (id: string, body: Partial<HKRequisition>) =>
    api.put<HKRequisition>(hkPath(`/requisitions/${id}`), body),
  remove: (id: string) =>
    api.delete<{ id: string }>(hkPath(`/requisitions/${id}`)),
  approve: (id: string, remarks?: string) =>
    api.post<HKRequisition>(hkPath(`/requisitions/${id}/approve`), { remarks }),
  issue: (id: string) =>
    api.post<HKRequisition>(hkPath(`/requisitions/${id}/issue`), {}),
  reject: (id: string, remarks?: string) =>
    api.post<HKRequisition>(hkPath(`/requisitions/${id}/reject`), { remarks }),
};

export const hkPublicAreaService = crud<HKPublicArea>("/public-areas");
export const hkChecklistService = crud<HKChecklistTemplate>("/checklists");
export const hkStaffService = crud<HKStaff>("/staff");
export const hkShiftService = crud<HKShift>("/shifts");
export const hkInventoryService = crud<HKInventoryItem>("/inventory");
export const hkDamageService = crud<HKDamageReport>("/damage-reports");
export const hkHistoryService = crud<HKHistoryLog>("/history");
export const hkLuggageService = crud<HKLuggageJob>("/luggage");
export const hkSettingsService = crud<{
  id: string;
  label?: string;
  value: Record<string, unknown>;
}>("/settings");

export const hkGuestRequestService = crud("/guest-requests");
export const hkMaintenanceService = crud("/maintenance");
export const hkLostFoundService = crud("/lost-found");

export const hkReportService = {
  get: (type: string) =>
    api.get<{
      type: string;
      title: string;
      summary: Record<string, unknown>;
      rows: unknown[];
      generatedAt: string;
    }>(hkPath(`/reports/${type}`)),
};
