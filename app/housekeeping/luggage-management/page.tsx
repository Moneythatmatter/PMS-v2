import type { Metadata } from "next";
import { LuggageView } from "@/components/housekeeping/LuggageView";

export const metadata: Metadata = {
  title: "Luggage & Baggage Management | Hotel PMS",
  description: "Register guest baggage tags, schedule bell staff deliveries, and trace active BOH locker rooms.",
};

export default function HousekeepingLuggagePage() {
  return <LuggageView />;
}
