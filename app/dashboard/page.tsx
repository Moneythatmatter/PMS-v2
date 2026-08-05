import type { Metadata } from "next";
import { MainDashboardView } from "@/components/dashboard/MainDashboardView";

export const metadata: Metadata = {
  title: "Main Dashboard | Hotel PMS",
  description: "Comprehensive overview of hotel metrics, occupancy, and active operations.",
};

export default function DashboardPage() {
  return <MainDashboardView />;
}
