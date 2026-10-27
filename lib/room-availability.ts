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

/** Room is inspected and has no reservation / in-house guest right now. */
export function isRoomVacantStatus(status?: string): boolean {
  return String(status ?? "").trim().toLowerCase() === "vacant";
}

export function isRoomDirtyCard(card: { status?: string; housekeeping?: string }): boolean {
  const status = String(card.status ?? "").trim().toLowerCase();
  const hk = String(card.housekeeping ?? "").trim().toLowerCase();
  return status === "dirty" || hk === "dirty";
}

/**
 * Room can be offered for sale: vacant (inspected) or clean. Dirty rooms are
 * offered only when the clerk opts in; occupied / blocked / cleaning never are.
 */
export function isRoomOfferable(
  card: { status?: string; housekeeping?: string },
  includeDirty = false,
): boolean {
  const status = String(card.status ?? "").trim().toLowerCase();
  if (isRoomDirtyCard(card)) return includeDirty && (status === "dirty" || status === "vacant" || status === "clean");
  return status === "vacant" || status === "clean";
}

const MOVE_IN_BLOCKING_STATUSES = new Set([
  "occupied",
  "blocked",
  "maintenance",
  "reserved",
  "out of order",
  "out of service",
  "dirty",
  "cleaning",
]);

/** Ready to move a guest into: not occupied/blocked and housekeeping has finished cleaning it. */
export function isRoomFreeToMoveIn(
  card: { status?: string; housekeeping?: string; guestName?: string; maintenance?: string },
  includeDirty = false,
): boolean {
  const status = String(card.status ?? "").trim().toLowerCase();
  const hk = String(card.housekeeping ?? "").trim().toLowerCase();
  const hasGuest = Boolean(card.guestName?.trim());
  const underMaintenance = Boolean(card.maintenance && card.maintenance !== "OK");
  const allowed = (s: string) =>
    !MOVE_IN_BLOCKING_STATUSES.has(s) || (includeDirty && s === "dirty");
  return allowed(status) && allowed(hk) && !underMaintenance && !hasGuest;
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
  excludeReservationId?: string,
): Set<string> {
  const blocked = new Set<string>();
  const stayIn = normalizeToIso(checkIn);
  const stayOut = normalizeToIso(checkOut);
  if (!stayIn || !stayOut || stayOut <= stayIn) return blocked;

  for (const reservation of reservations) {
    if (excludeReservationId && reservation.id === excludeReservationId) continue;
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
  excludeReservationId?: string,
): string[] {
  const blocked = getBlockedRoomNos(
    reservations,
    checkIn,
    checkOut,
    availabilityBlocks,
    excludeReservationId,
  );
  return roomNos
    .filter((roomNo) => !blocked.has(roomNo))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}
