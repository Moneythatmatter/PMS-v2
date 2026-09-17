import { Suspense } from "react";
import { GuestProfileView } from "@/components/frontoffice/GuestProfileView";

export default function GuestProfilesPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-500">Loading…</p>}>
      <GuestProfileView />
    </Suspense>
  );
}
