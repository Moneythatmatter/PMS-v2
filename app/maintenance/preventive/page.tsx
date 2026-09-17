import { MaintenanceBlankView } from "@/components/maintenance/MaintenanceBlankView";

export default function PreventiveMaintenancePage() {
  return (
    <MaintenanceBlankView
      title="Preventive Maintenance"
      description="Scheduled servicing lists and calendar schedules for DG sets, chillers, elevators, and pool pumps."
      actionLabel="+ Schedule PM Task"
    />
  );
}
