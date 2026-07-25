import { api, foPath } from "../api";
import type {
  GuestFeedbackRecord,
  HousekeepingRequest,
  LostFoundItem,
  LuggageRecord,
  MaintenanceRequest,
  MessageRecord,
  RoomTransferRecord,
  TaxiBooking,
  WakeUpCall,
} from "@/app/data/frontoffice/modules";

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

export const transferService = crud<RoomTransferRecord>("/transfers");
export const wakeUpCallService = crud<WakeUpCall>("/wake-up-calls");
export const taxiBookingService = crud<TaxiBooking>("/taxi-bookings");
export const luggageService = crud<LuggageRecord>("/luggage");
export const messageService = crud<MessageRecord>("/messages");
export const feedbackService = crud<GuestFeedbackRecord>("/feedback");
export const lostFoundService = crud<LostFoundItem>("/lost-found");
export const housekeepingRequestService =
  crud<HousekeepingRequest>("/housekeeping-requests");
export const maintenanceRequestService =
  crud<MaintenanceRequest>("/maintenance-requests");
