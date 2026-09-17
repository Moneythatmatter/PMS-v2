import { MaintenanceBlankView } from "@/components/maintenance/MaintenanceBlankView";

export default function WorkOrdersPage() {
  return (
    <MaintenanceBlankView
      title="Work Orders"
      description="Engineering job cards, in-house technician and external AMC vendor dispatch, spare parts consumption, and sign-offs."
      actionLabel="+ Create Work Order"
    />
  );
}
