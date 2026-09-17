import { MaintenanceBlankView } from "@/components/maintenance/MaintenanceBlankView";

export default function AssetsPage() {
  return (
    <MaintenanceBlankView
      title="Assets & Equipment"
      description="Service-critical hotel machinery ledger, warranties, AMC contracts, and complete lifetime repair service history."
      actionLabel="+ Register Asset"
    />
  );
}
