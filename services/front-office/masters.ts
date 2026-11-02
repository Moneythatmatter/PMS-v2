import { api, foPath } from "../api";
import type {
  BookingSourceMaster,
  CompanyMaster,
  CompanyPartyOption,
  TariffPlanMaster,
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
export const tariffPlanService = crud<TariffPlanMaster>("/masters/tariff-plans");
/** @deprecated Use tariffPlanService */
export const ratePlanService = tariffPlanService;
export const companyService = {
  ...crud<CompanyMaster>("/masters/companies"),
  /** Accounts parties of type Corporate a company can be linked to. */
  partyOptions: () => api.get<CompanyPartyOption[]>(foPath("/masters/companies/party-options")),
};
export const bookingSourceService =
  crud<BookingSourceMaster>("/masters/booking-sources");

export const mastersService = {
  roomTypes: roomTypeService,
  tariffPlans: tariffPlanService,
  ratePlans: tariffPlanService,
  companies: companyService,
  bookingSources: bookingSourceService,
};
