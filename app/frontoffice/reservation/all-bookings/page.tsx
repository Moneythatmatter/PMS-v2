import { reservationBookings } from "@/app/data";
import { AllBookingsView } from "@/components/frontoffice/reservation/AllBookingsView";

export default function AllBookingsPage() {
  return <AllBookingsView bookings={reservationBookings} />;
}
