import { api } from "../api";

export const smPath = (segment: string) =>
  `/api/sales-marketing${segment.startsWith("/") ? segment : `/${segment}`}`;

function crud<T>(base: string) {
  return {
    list: (query = "") => api.get<T[]>(smPath(`${base}${query}`)),
    get: (id: string) => api.get<T>(smPath(`${base}/${id}`)),
    create: (body: Partial<T>) => api.post<T>(smPath(base), body),
    update: (id: string, body: Partial<T>) => api.put<T>(smPath(`${base}/${id}`), body),
    remove: (id: string) => api.delete<{ id: string }>(smPath(`${base}/${id}`)),
  };
}

export const smDashboardService = {
  get: () => api.get<Record<string, unknown>>(smPath("/dashboard")),
};

export const smVenueService = crud<Record<string, unknown>>("/masters/venues-spaces");
export const smLeadSourceService = crud<Record<string, unknown>>("/masters/lead-sources");
export const smActivityTypeService = crud<Record<string, unknown>>("/masters/activity-types");
export const smDealStageService = crud<Record<string, unknown>>("/masters/deal-stages");
export const smContactTypeService = crud<Record<string, unknown>>("/masters/contact-types");
export const smBookingTypeService = {
  ...crud<Record<string, unknown>>("/masters/booking-types"),
  list: () => api.get<Record<string, unknown>[]>(smPath("/masters/booking-types")),
  ensureSystem: () =>
    api.post<Record<string, unknown>[]>(smPath("/masters/booking-types/ensure-system"), {}),
};

export const smContactService = crud<Record<string, unknown>>("/contacts");
export const smLeadService = crud<Record<string, unknown>>("/leads");
export const smDealService = crud<Record<string, unknown>>("/deals");
export const smActivityService = crud<Record<string, unknown>>("/activities");
export const smBookingService = crud<Record<string, unknown>>("/bookings");
export const smPromotionService = crud<Record<string, unknown>>("/promotions");
export const smCampaignService = crud<Record<string, unknown>>("/campaigns");
export const smOtaChannelService = crud<Record<string, unknown>>("/ota-channels");
