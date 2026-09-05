/** Reservation statuses where the guest is currently in the room. */
export const ACTIVE_ROOM_BOOKING_STATUSES = ["Checked In", "In-House"] as const;

export type ActiveRoomBookingStatus =
  (typeof ACTIVE_ROOM_BOOKING_STATUSES)[number];

export function isActiveRoomBookingStatus(
  status: string | null | undefined,
): boolean {
  const value = String(status ?? "").trim();
  return (ACTIVE_ROOM_BOOKING_STATUSES as readonly string[]).includes(value);
}
