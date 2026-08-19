import { Suspense } from "react";
import { CheckOutView } from "@/components/frontoffice/CheckOutView";

export default function CheckOutPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-500">Loading check-out…</p>}>
      <CheckOutView />
    </Suspense>
  );
}
