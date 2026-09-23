import { api, mntPath } from "../api";
import type {
  AssetCategoryMaster,
  ProblemCategoryMaster,
  RootCauseMaster,
  SparePartMaster,
  PMTaskTemplate,
  MaintenanceVendor,
  MaintenanceAsset,
  MaintenanceRequest,
  WorkOrder,
  PMSchedule,
  MaintenanceDashboardStats,
  RoomUnderMaintenance,
  MntRoom,
  MntPublicArea,
} from "@/app/data/maintenance/types";

function crud<T>(base: string) {
  return {
    list: (query = "") => api.get<T[]>(mntPath(`${base}${query}`)),
    get: (id: string) => api.get<T>(mntPath(`${base}/${id}`)),
    create: (body: Partial<T>) => api.post<T>(mntPath(base), body),
    update: (id: string, body: Partial<T>) => api.put<T>(mntPath(`${base}/${id}`), body),
    remove: (id: string) => api.delete<{ id: string }>(mntPath(`${base}/${id}`)),
  };
}

export type MntDashboardData = {
  stats: MaintenanceDashboardStats;
  criticalIssues: WorkOrder[];
  activeWorkOrders: WorkOrder[];
  roomsUnderMaintenance: RoomUnderMaintenance[];
  pmTasksToday: PMSchedule[];
  recentRequests: MaintenanceRequest[];
};

export type MntReportsData = {
  turnaround: Array<Record<string, unknown>>;
  pmCompliance: Array<Record<string, unknown>>;
  roomDowntime: Array<Record<string, unknown>>;
  spareParts: Array<Record<string, unknown>>;
};

export const mntDashboardService = {
  get: () => api.get<MntDashboardData>(mntPath("/dashboard")),
};

export const mntReportsService = {
  get: () => api.get<MntReportsData>(mntPath("/reports")),
};

export const mntAssetCategoryService = crud<AssetCategoryMaster>("/masters/asset-categories");
export const mntProblemCategoryService = crud<ProblemCategoryMaster>("/masters/problem-categories");
export const mntRootCauseService = crud<RootCauseMaster>("/masters/root-causes");
export const mntPmTemplateService = crud<PMTaskTemplate>("/masters/pm-templates");
export const mntVendorService = crud<MaintenanceVendor>("/masters/vendors");
export const mntSparePartService = crud<SparePartMaster>("/masters/spare-parts");
export const mntRoomService = crud<MntRoom>("/rooms");
export const mntRoomMasterService = crud<MntRoom>("/masters/rooms");
export const mntPublicAreaService = crud<MntPublicArea>("/masters/public-areas");
export const mntAssetService = crud<MaintenanceAsset>("/assets");
export const mntRequestService = crud<MaintenanceRequest>("/requests");
export const mntWorkOrderService = crud<WorkOrder>("/work-orders");
export const mntPmScheduleService = crud<PMSchedule>("/pm-schedules");
