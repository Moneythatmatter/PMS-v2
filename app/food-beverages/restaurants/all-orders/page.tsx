import { Suspense } from "react";
import { FbAllOrdersView } from "@/components/foodbeverages/FbAllOrdersView";

export default function RestaurantAllOrdersPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-500">Loading orders…</p>}>
      <FbAllOrdersView />
    </Suspense>
  );
}
