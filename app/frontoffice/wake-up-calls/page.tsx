import type { Metadata } from "next";
import { WakeUpCallsView } from "@/components/frontoffice/ServiceViews";

export const metadata: Metadata = {
  title: "Wake-up Calls | Hotel PMS",
  description: "Schedule and track guest wake-up calls.",
};

export default function WakeUpCallsPage() {
  return <WakeUpCallsView />;
}
