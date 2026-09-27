import { Suspense } from "react";
import { GuestFolioView } from "@/components/frontoffice/GuestFolioView";

export default function GuestFolioPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-500">Loading folios…</p>}>
      <GuestFolioView />
    </Suspense>
  );
}
