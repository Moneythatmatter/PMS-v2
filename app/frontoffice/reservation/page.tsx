import { redirect } from "next/navigation";

export default function ReservationPage() {
  redirect("/frontoffice/reservation/all-bookings");
}
