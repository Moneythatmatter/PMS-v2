import { api, foPath } from "../api";
import type {
  CompanyMaster,
  MarketSegmentMaster,
  RatePlanMaster,
  RoomTypeMaster,
} from "@/app/data/frontoffice/masters";

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

export const roomTypeService = crud<RoomTypeMaster>("/masters/room-types");
export const ratePlanService = crud<RatePlanMaster>("/masters/rate-plans");
export const marketSegmentService =
  crud<MarketSegmentMaster>("/masters/market-segments");
export const companyService = crud<CompanyMaster>("/masters/companies");

export const mastersService = {
  roomTypes: roomTypeService,
  ratePlans: ratePlanService,
  marketSegments: marketSegmentService,
  companies: companyService,
};
