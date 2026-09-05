import { Suspense } from "react";
import { AllBookingsView } from "@/components/frontoffice/reservation/AllBookingsView";

export default function AllBookingsPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-500">Loading bookings…</p>}>
      <AllBookingsView />
    </Suspense>
  );
}
