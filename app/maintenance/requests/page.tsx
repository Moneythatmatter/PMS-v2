import { MaintenanceBlankView } from "@/components/maintenance/MaintenanceBlankView";

export default function RequestsPage() {
  return (
    <MaintenanceBlankView
      title="Maintenance Requests"
      description="Quick-entry and triage portal for Front Office, Housekeeping, and F&B staff defect reports."
      actionLabel="+ Log New Request"
    />
  );
}
