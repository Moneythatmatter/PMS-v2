import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckInForm } from "@/components/frontoffice/CheckInForm";

export const metadata: Metadata = {
  title: "Guest Check-In Desk | Hotel PMS",
  description: "Process arrivals for reserved bookings or instant walk-in guests.",
};

export default function CheckInPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-500">Loading check-in…</p>}>
      <CheckInForm />
    </Suspense>
  );
}
