import type { ReservationBooking } from "@/app/data/types";

export function checkInHref(booking: Pick<ReservationBooking, "id">): string {
  return `/frontoffice/check-in?bookingId=${encodeURIComponent(booking.id)}`;
}

export function checkOutHref(booking: Pick<ReservationBooking, "id">): string {
  return `/frontoffice/check-out?bookingId=${encodeURIComponent(booking.id)}`;
}
