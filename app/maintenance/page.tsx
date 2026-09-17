import { MaintenanceDashboardView } from "@/components/maintenance/MaintenanceDashboardView";

export const metadata = {
  title: "Maintenance Dashboard | Impact PMS",
  description: "Engineering work orders, critical breakdown dispatch, and preventive maintenance compliance.",
};

export default function MaintenancePage() {
  return <MaintenanceDashboardView />;
}
