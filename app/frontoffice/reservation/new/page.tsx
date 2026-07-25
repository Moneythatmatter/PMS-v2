import { Suspense } from "react";
import { NewReservationForm } from "@/components/frontoffice/reservation/NewReservationForm";

export default function NewReservationPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-500">Loading…</p>}>
      <NewReservationForm />
    </Suspense>
  );
}
