import type { Metadata } from "next";
import { LuggageManagementView } from "@/components/frontoffice/ServiceViews";

export const metadata: Metadata = {
  title: "Luggage Management | Hotel PMS",
  description: "Store and return guest luggage at the front desk.",
};

export default function FrontOfficeLuggagePage() {
  return <LuggageManagementView />;
}
