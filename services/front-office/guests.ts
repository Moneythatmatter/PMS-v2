import { api, foPath } from "../api";
import type {
  FolioEntry,
  GuestProfile,
  GuestStayHistory,
  InvoiceRecord,
  PaymentRecord,
} from "@/app/data/frontoffice/modules";

function crud<T>(base: string) {
  return {
    list: (query = "") => api.get<T[]>(foPath(`${base}${query}`)),
    get: (id: string) => api.get<T>(foPath(`${base}/${id}`)),
    create: (body: Partial<T>) => api.post<T>(foPath(base), body),
    update: (id: string, body: Partial<T>) =>
      api.put<T>(foPath(`${base}/${id}`), body),
    remove: (id: string) => api.delete<{ id: string }>(foPath(`${base}/${id}`)),
  };
}

export const guestService = crud<GuestProfile>("/guests");

export const guestStayHistoryService = {
  ...crud<GuestStayHistory>("/guest-stay-history"),
  byGuest: (guestId: string) =>
    api.get<GuestStayHistory[]>(
      foPath(`/guest-stay-history?guestId=${encodeURIComponent(guestId)}`),
    ),
};

export const folioService = {
  ...crud<FolioEntry>("/folio"),
  byRoom: (room: string) =>
    api.get<FolioEntry[]>(
      foPath(`/folio?room=${encodeURIComponent(room)}`),
    ),
  byReservation: (reservationId: string) =>
    api.get<FolioEntry[]>(
      foPath(`/folio?reservationId=${encodeURIComponent(reservationId)}`),
    ),
};

export const paymentService = crud<PaymentRecord>("/payments");
export const invoiceService = crud<InvoiceRecord>("/invoices");
