import { Suspense } from "react";
import { FrontOfficeReportsView } from "@/components/frontoffice/ReportsViews";

export default function FrontOfficeReportsPage() {
  return (
    <Suspense fallback={null}>
      <FrontOfficeReportsView />
    </Suspense>
  );
}
