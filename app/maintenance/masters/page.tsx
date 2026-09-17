import { MaintenanceBlankView } from "@/components/maintenance/MaintenanceBlankView";

export default function MastersPage() {
  return (
    <MaintenanceBlankView
      title="Maintenance Masters"
      description="Asset categories, problem category taxonomies, root cause libraries, and preventive maintenance task templates."
      actionLabel="+ Add Master Record"
    />
  );
}
