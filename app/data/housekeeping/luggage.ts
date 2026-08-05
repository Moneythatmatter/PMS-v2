import { initialHKLuggageJobs } from "../housekeepingData";
import type { HKLuggageJob } from "@/components/housekeeping/HousekeepingTypes";

export const initialLuggageItems: HKLuggageJob[] = [
  ...initialHKLuggageJobs,
  {
    id: "LG-003",
    guest: "Rahul Sharma",
    room: "204",
    bellBoy: "Ravi Kumar",
    tagNumber: "TAG-9923",
    bagCount: 2,
    type: "Check-out",
    pickupTime: "24 Jun 10:00 AM",
    status: "Pending",
    remarks: "Hold at front desk for pickup",
  },
];
