import { api } from "../api";
import type {
  HKRoom,
  HKTask,
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
  create: (body: {
    roomId: string;
    status?: string;
    notes?: string;
    assignedTo?: string;
  }) => api.post<Record<string, unknown>>(hkPath("/rooms"), body),
  update: (
    id: string,
    body: Omit<Partial<HKRoom>, "status"> & { status?: string },
  ) => api.put<HKRoom>(hkPath(`/rooms/${id}`), body),
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

export const hkTaskService = {
  list: (query = "") => api.get<HKTask[]>(hkPath(`/tasks${query}`)),
  get: (id: string) => api.get<HKTask>(hkPath(`/tasks/${id}`)),
  getActiveForRoom: (roomId: string) =>
    api.get<HKTask>(hkPath(`/tasks/room/${encodeURIComponent(roomId)}/active`)),
  create: (body: Partial<HKTask> & { roomId: string }) =>
    api.post<HKTask>(hkPath("/tasks"), body),
  assign: (id: string, assignedTo: string) =>
    api.post<HKTask>(hkPath(`/tasks/${id}/assign`), { assignedTo }),
  start: (id: string) => api.post<HKTask>(hkPath(`/tasks/${id}/start`), {}),
  complete: (id: string, body?: { notes?: string; remarks?: string }) =>
    api.post<HKTask>(hkPath(`/tasks/${id}/complete`), body ?? {}),
  approve: (
    id: string,
    body?: { approvedBy?: string; inspector?: string },
  ) => api.post<HKTask>(hkPath(`/tasks/${id}/approve`), body ?? {}),
  cancel: (id: string, body?: { notes?: string }) =>
    api.post<HKTask>(hkPath(`/tasks/${id}/cancel`), body ?? {}),
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
export const hkDamageService = {
  list: (query = "") =>
    api.get<
      import("@/components/housekeeping/damageReportUtils").DamageReportDto[]
    >(hkPath(`/damage-reports${query}`)),
  get: (id: string) =>
    api.get<
      import("@/components/housekeeping/damageReportUtils").DamageReportDto
    >(hkPath(`/damage-reports/${id}`)),
  create: (
    body: Record<string, unknown> & { description: string },
  ) =>
    api.post<
      import("@/components/housekeeping/damageReportUtils").DamageReportDto
    >(hkPath("/damage-reports"), body),
  update: (id: string, body: Record<string, unknown>) =>
    api.put<
      import("@/components/housekeeping/damageReportUtils").DamageReportDto
    >(hkPath(`/damage-reports/${id}`), body),
  resolve: (
    id: string,
    body?: { actualCost?: number; status?: string; notes?: string },
  ) =>
    api.post<
      import("@/components/housekeeping/damageReportUtils").DamageReportDto
    >(hkPath(`/damage-reports/${id}/resolve`), body ?? {}),
};
export const hkHistoryService = crud<HKHistoryLog>("/history");
export const hkLuggageService = crud<HKLuggageJob>("/luggage");
export const hkSettingsService = crud<{
  id: string;
  label?: string;
  value: Record<string, unknown>;
}>("/settings");

export const hkGuestRequestService = {
  list: (query = "") =>
    api.get<import("@/components/housekeeping/guestRequestUtils").GuestRequestDto[]>(
      hkPath(`/guest-requests${query}`),
    ),
  get: (id: string) =>
    api.get<import("@/components/housekeeping/guestRequestUtils").GuestRequestDto>(
      hkPath(`/guest-requests/${id}`),
    ),
  create: (
    body: Partial<
      import("@/components/housekeeping/guestRequestUtils").GuestRequestDto
    > & { roomId: string; description: string },
  ) =>
    api.post<
      import("@/components/housekeeping/guestRequestUtils").GuestRequestDto
    >(hkPath("/guest-requests"), body),
  update: (
    id: string,
    body: Partial<
      import("@/components/housekeeping/guestRequestUtils").GuestRequestDto
    >,
  ) =>
    api.put<
      import("@/components/housekeeping/guestRequestUtils").GuestRequestDto
    >(hkPath(`/guest-requests/${id}`), body),
  assign: (id: string, assignedTo: string) =>
    api.post<
      import("@/components/housekeeping/guestRequestUtils").GuestRequestDto
    >(hkPath(`/guest-requests/${id}/assign`), { assignedTo }),
  start: (id: string) =>
    api.post<
      import("@/components/housekeeping/guestRequestUtils").GuestRequestDto
    >(hkPath(`/guest-requests/${id}/start`), {}),
  complete: (id: string, body?: { notes?: string; remarks?: string }) =>
    api.post<
      import("@/components/housekeeping/guestRequestUtils").GuestRequestDto
    >(hkPath(`/guest-requests/${id}/complete`), body ?? {}),
  cancel: (id: string, body?: { notes?: string }) =>
    api.post<
      import("@/components/housekeeping/guestRequestUtils").GuestRequestDto
    >(hkPath(`/guest-requests/${id}/cancel`), body ?? {}),
};
export const hkMaintenanceService = {
  list: (query = "") =>
    api.get<
      import("@/components/housekeeping/maintenanceRequestUtils").MaintenanceRequestDto[]
    >(hkPath(`/maintenance${query}`)),
  get: (id: string) =>
    api.get<
      import("@/components/housekeeping/maintenanceRequestUtils").MaintenanceRequestDto
    >(hkPath(`/maintenance/${id}`)),
  create: (
    body: Partial<
      import("@/components/housekeeping/maintenanceRequestUtils").MaintenanceRequestDto
    > & { title: string; description: string },
  ) =>
    api.post<
      import("@/components/housekeeping/maintenanceRequestUtils").MaintenanceRequestDto
    >(hkPath("/maintenance"), body),
  update: (
    id: string,
    body: Partial<
      import("@/components/housekeeping/maintenanceRequestUtils").MaintenanceRequestDto
    >,
  ) =>
    api.put<
      import("@/components/housekeeping/maintenanceRequestUtils").MaintenanceRequestDto
    >(hkPath(`/maintenance/${id}`), body),
  assign: (
    id: string,
    assignedTo: string,
    estimatedCompletion?: string,
  ) =>
    api.post<
      import("@/components/housekeeping/maintenanceRequestUtils").MaintenanceRequestDto
    >(hkPath(`/maintenance/${id}/assign`), { assignedTo, estimatedCompletion }),
  start: (id: string) =>
    api.post<
      import("@/components/housekeeping/maintenanceRequestUtils").MaintenanceRequestDto
    >(hkPath(`/maintenance/${id}/start`), {}),
  complete: (id: string, body?: { resolution?: string; notes?: string }) =>
    api.post<
      import("@/components/housekeeping/maintenanceRequestUtils").MaintenanceRequestDto
    >(hkPath(`/maintenance/${id}/complete`), body ?? {}),
  verify: (id: string, verifiedBy: string, resolution?: string) =>
    api.post<
      import("@/components/housekeeping/maintenanceRequestUtils").MaintenanceRequestDto
    >(hkPath(`/maintenance/${id}/verify`), { verifiedBy, resolution }),
  cancel: (id: string, body?: { notes?: string }) =>
    api.post<
      import("@/components/housekeeping/maintenanceRequestUtils").MaintenanceRequestDto
    >(hkPath(`/maintenance/${id}/cancel`), body ?? {}),
};
export const hkLostFoundService = {
  list: (query = "") =>
    api.get<
      import("@/components/housekeeping/lostFoundItemUtils").LostFoundItemDto[]
    >(hkPath(`/lost-found${query}`)),
  get: (id: string) =>
    api.get<
      import("@/components/housekeeping/lostFoundItemUtils").LostFoundItemDto
    >(hkPath(`/lost-found/${id}`)),
  create: (
    body: Partial<
      import("@/components/housekeeping/lostFoundItemUtils").LostFoundItemDto
    > & { itemName: string },
  ) =>
    api.post<
      import("@/components/housekeeping/lostFoundItemUtils").LostFoundItemDto
    >(hkPath("/lost-found"), body),
  update: (
    id: string,
    body: Partial<
      import("@/components/housekeeping/lostFoundItemUtils").LostFoundItemDto
    >,
  ) =>
    api.put<
      import("@/components/housekeeping/lostFoundItemUtils").LostFoundItemDto
    >(hkPath(`/lost-found/${id}`), body),
  return: (
    id: string,
    body?: { returnedTo?: string; claimBy?: string; guest?: string },
  ) =>
    api.post<
      import("@/components/housekeeping/lostFoundItemUtils").LostFoundItemDto
    >(hkPath(`/lost-found/${id}/return`), body ?? {}),
  claim: (
    id: string,
    body?: { claimedBy?: string; claimBy?: string; guest?: string },
  ) =>
    api.post<
      import("@/components/housekeeping/lostFoundItemUtils").LostFoundItemDto
    >(hkPath(`/lost-found/${id}/claim`), body ?? {}),
  dispose: (id: string, body?: { notes?: string }) =>
    api.post<
      import("@/components/housekeeping/lostFoundItemUtils").LostFoundItemDto
    >(hkPath(`/lost-found/${id}/dispose`), body ?? {}),
  courier: (
    id: string,
    body?: { returnedTo?: string; notes?: string; trackingNumber?: string },
  ) =>
    api.post<
      import("@/components/housekeeping/lostFoundItemUtils").LostFoundItemDto
    >(hkPath(`/lost-found/${id}/courier`), body ?? {}),
};

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
