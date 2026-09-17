import { MaintenanceBlankView } from "@/components/maintenance/MaintenanceBlankView";

export default function RootCausesPage() {
  return (
    <MaintenanceBlankView
      title="Root Causes"
      category="Masters"
      description="Standardized engineering defect reasons (Wear & tear, voltage fluctuation, guest misuse, bad spares)."
      actionLabel="+ New Root Cause"
    />
  );
}
