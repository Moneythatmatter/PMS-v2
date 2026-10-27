import { redirect } from "next/navigation";

export default function GroupBookingPage() {
  redirect("/frontoffice/reservation/all-bookings?filter=group");
}
