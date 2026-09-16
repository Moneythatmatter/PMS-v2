import type { ReservationBooking } from "@/app/data/types";

export function checkInHref(booking: Pick<ReservationBooking, "id">): string {
  return `/frontoffice/check-in?bookingId=${encodeURIComponent(booking.id)}`;
}

export function checkOutHref(booking: Pick<ReservationBooking, "id">): string {
  return `/frontoffice/check-out?bookingId=${encodeURIComponent(booking.id)}`;
}

export function allBookingsDetailHref(booking: Pick<ReservationBooking, "id">): string {
  return `/frontoffice/reservation/all-bookings?bookingId=${encodeURIComponent(booking.id)}`;
}

export function allBookingsGuestHref(guest: { id: string }): string {
  return `/frontoffice/reservation/all-bookings?guestId=${encodeURIComponent(guest.id)}`;
}

export function guestProfileHref(
  guest: { id: string },
  options?: { edit?: boolean },
): string {
  const params = new URLSearchParams({ guestId: guest.id });
  if (options?.edit) params.set("edit", "1");
  return `/frontoffice/guest-profiles?${params.toString()}`;
}
