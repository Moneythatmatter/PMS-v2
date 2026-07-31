import type { Metadata } from "next";
import { FrontOfficeDashboardView } from "@/components/frontoffice/FrontOfficeDashboardView";

export const metadata: Metadata = {
  title: "Front Office Dashboard | Hotel PMS",
  description: "Overview of Front Office operations, check-ins, and room statuses.",
};

export default function FrontOfficeDashboardPage() {
  return <FrontOfficeDashboardView />;
}
