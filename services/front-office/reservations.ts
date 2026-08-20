import { api, foPath } from "../api";
import type { ReservationBooking, ReservationSummaryStat } from "@/app/data/types";

export type InHouseGuestDto = {
  id: string;
  guestName: string;
  room: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  balance: number;
  restaurantBill: number;
  laundry: number;
  status: string;
  isVip?: boolean;
  email?: string;
  adults: number;
  children: number;
};

export const reservationService = {
  list: (status?: string) =>
    api.get<ReservationBooking[]>(
      foPath(`/reservations${status ? `?status=${encodeURIComponent(status)}` : ""}`),
    ),
  get: (id: string) =>
    api.get<ReservationBooking>(foPath(`/reservations/${id}`)),
  create: (body: Partial<ReservationBooking>) =>
    api.post<ReservationBooking>(foPath("/reservations"), body),
  update: (id: string, body: Partial<ReservationBooking>) =>
    api.put<ReservationBooking>(foPath(`/reservations/${id}`), body),
  remove: (id: string) =>
    api.delete<{ id: string }>(foPath(`/reservations/${id}`)),
  checkIn: (id: string, body?: Partial<ReservationBooking>) =>
    api.post<ReservationBooking>(foPath(`/reservations/${id}/check-in`), body ?? {}),
  checkOut: (id: string, body?: Record<string, unknown>) =>
    api.post<ReservationBooking>(foPath(`/reservations/${id}/check-out`), body ?? {}),
  extendStay: (
    id: string,
    body: { checkOut: string; nights?: number; totalAmount?: number; balance?: number },
  ) => api.post<ReservationBooking>(foPath(`/reservations/${id}/extend-stay`), body),
  summary: () =>
    api.get<ReservationSummaryStat[]>(foPath("/reservations/summary")),
  inHouse: () =>
    api.get<InHouseGuestDto[]>(foPath("/reservations/in-house")),
  getCurrentForRoom: (roomId: string) =>
    api.get<ReservationBooking>(
      foPath(`/reservations/by-room/${encodeURIComponent(roomId)}/current`),
    ),
};
