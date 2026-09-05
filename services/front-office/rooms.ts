import { api, foPath } from "../api";
import type { RoomMaster } from "@/app/data/frontoffice/masters";
import type { RoomAvailabilityRow, RoomStatusCard } from "@/app/data/frontoffice/modules";

export type RoomDto = RoomMaster;

export type RoomAvailabilityBlock = {
  roomId: string;
  roomNo?: string;
  startDate: string;
  endDate: string;
  kind: "maintenance" | "blocked";
  reason?: string;
};

export type RoomAvailabilityResponse = {
  start: string;
  month: string;
  days: string[];
  rows: RoomAvailabilityRow[];
  blocks?: RoomAvailabilityBlock[];
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
  availability: (month?: string) =>
    api.get<RoomAvailabilityResponse>(
      foPath(
        `/rooms/availability${month ? `?start=${encodeURIComponent(month)}` : ""}`,
      ),
    ),
  status: () => api.get<RoomStatusCard[]>(foPath("/rooms/status")),
  blocks: (start: string, end: string) =>
    api.get<RoomAvailabilityBlock[]>(
      foPath(`/rooms/blocks?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`),
    ),
};
