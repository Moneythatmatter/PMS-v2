import type { Metadata } from "next";
import { CheckInForm } from "@/components/frontoffice/CheckInForm";

export const metadata: Metadata = {
  title: "Guest Check-In Desk | Hotel PMS",
  description: "Process arrivals for reserved bookings or instant walk-in guests.",
};

export default function CheckInPage() {
  return <CheckInForm />;
}
