import type { ReservationBooking } from "@/app/data/types/frontoffice";
import type { RoomAvailabilityBlock } from "@/services/front-office/rooms";
import { normalizeToIso, staysOverlap } from "@/lib/reservation-dates";

const INACTIVE_RESERVATION_STATUSES = new Set([
  "cancelled",
  "checked out",
  "no show",
]);

export function isActiveReservation(status?: string): boolean {
  const value = String(status ?? "").trim().toLowerCase();
  return value.length > 0 && !INACTIVE_RESERVATION_STATUSES.has(value);
}

export function isRoomSellableStatus(status?: string): boolean {
  const value = String(status ?? "").trim().toLowerCase();
  return value !== "blocked" && value !== "maintenance";
}

function blockOverlapsStay(
  block: RoomAvailabilityBlock,
  checkIn: string,
  checkOut: string,
): boolean {
  const stayIn = normalizeToIso(checkIn);
  const stayOut = normalizeToIso(checkOut);
  if (!stayIn || !stayOut || stayOut <= stayIn) return false;
  return block.startDate < stayOut && block.endDate >= stayIn;
}

export function getBlockedRoomNosFromBlocks(
  blocks: RoomAvailabilityBlock[],
  checkIn: string,
  checkOut: string,
): Set<string> {
  const blocked = new Set<string>();
  for (const block of blocks) {
    const roomNo = String(block.roomNo ?? "").trim();
    if (!roomNo) continue;
    if (blockOverlapsStay(block, checkIn, checkOut)) {
      blocked.add(roomNo);
    }
  }
  return blocked;
}

export function getBlockedRoomNos(
  reservations: ReservationBooking[],
  checkIn: string,
  checkOut: string,
  availabilityBlocks: RoomAvailabilityBlock[] = [],
): Set<string> {
  const blocked = new Set<string>();
  const stayIn = normalizeToIso(checkIn);
  const stayOut = normalizeToIso(checkOut);
  if (!stayIn || !stayOut || stayOut <= stayIn) return blocked;

  for (const reservation of reservations) {
    if (!isActiveReservation(reservation.status)) continue;
    const roomNo = String(reservation.roomNo ?? "").trim();
    if (!roomNo || /^(tba|n\/?a|unassigned|-)$/i.test(roomNo)) continue;
    if (staysOverlap(stayIn, stayOut, reservation.checkIn, reservation.checkOut)) {
      blocked.add(roomNo);
    }
  }

  for (const roomNo of getBlockedRoomNosFromBlocks(availabilityBlocks, checkIn, checkOut)) {
    blocked.add(roomNo);
  }

  return blocked;
}

export function filterRoomsForStay(
  roomNos: string[],
  reservations: ReservationBooking[],
  checkIn: string,
  checkOut: string,
  availabilityBlocks: RoomAvailabilityBlock[] = [],
): string[] {
  const blocked = getBlockedRoomNos(reservations, checkIn, checkOut, availabilityBlocks);
  return roomNos
    .filter((roomNo) => !blocked.has(roomNo))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}
