import { api, foPath } from "../api";
import type { RoomAvailabilityRow, RoomStatusCard } from "@/app/data/frontoffice/modules";

export type RoomDto = {
  roomNo: string;
  roomType: string;
  floor: string;
  status: string;
  guestName?: string;
  housekeeping: string;
  maintenance: string;
  checkoutDate?: string;
};

export type RoomAvailabilityResponse = {
  start: string;
  days: string[];
  rows: RoomAvailabilityRow[];
};

export const roomService = {
  list: (status?: string) =>
    api.get<RoomDto[]>(
      foPath(`/rooms${status ? `?status=${encodeURIComponent(status)}` : ""}`),
    ),
  get: (id: string) => api.get<RoomDto>(foPath(`/rooms/${id}`)),
  create: (body: Partial<RoomDto>) =>
    api.post<RoomDto>(foPath("/rooms"), body),
  update: (id: string, body: Partial<RoomDto>) =>
    api.put<RoomDto>(foPath(`/rooms/${id}`), body),
  availability: (start?: string) =>
    api.get<RoomAvailabilityResponse>(
      foPath(
        `/rooms/availability${start ? `?start=${encodeURIComponent(start)}` : ""}`,
      ),
    ),
  status: () => api.get<RoomStatusCard[]>(foPath("/rooms/status")),
};
