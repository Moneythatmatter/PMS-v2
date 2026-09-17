import { MaintenanceBlankView } from "@/components/maintenance/MaintenanceBlankView";

export default function PMTemplatesPage() {
  return (
    <MaintenanceBlankView
      title="PM Task Templates"
      category="Masters"
      description="Predefined inspection checklists for recurring servicing (e.g. Monthly DG test, Daily pool chlorine balancing)."
      actionLabel="+ New Template"
    />
  );
}
