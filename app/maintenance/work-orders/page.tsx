import React, { Suspense } from "react";
import { MaintenanceWorkOrdersView } from "@/components/maintenance/MaintenanceWorkOrdersView";

export default function WorkOrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading work orders...</div>}>
      <MaintenanceWorkOrdersView />
    </Suspense>
  );
}
