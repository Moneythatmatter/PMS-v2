import type { Metadata } from "next";
import { TaxiBookingView } from "@/components/frontoffice/ServiceViews";

export const metadata: Metadata = {
  title: "Taxi / Cab Booking | Hotel PMS",
  description: "Arrange transport for in-house and departing guests.",
};

export default function TaxiBookingPage() {
  return <TaxiBookingView />;
}
