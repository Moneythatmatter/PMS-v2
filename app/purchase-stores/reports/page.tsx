import { Suspense } from "react";
import { PsReportsPage } from "@/components/purchase-stores/reports/PsReportsPage";

export default function PurchaseStoresReportsPage() {
  return (
    <Suspense fallback={null}>
      <PsReportsPage />
    </Suspense>
  );
}
