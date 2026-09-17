import { MaintenanceBlankView } from "@/components/maintenance/MaintenanceBlankView";

export default function ReportsPage() {
  return (
    <MaintenanceBlankView
      title="Maintenance Reports"
      description="Work order turnaround times, room downtime analytics, PM compliance rates, and spare parts consumption."
      actionLabel="Export Report"
    />
  );
}
