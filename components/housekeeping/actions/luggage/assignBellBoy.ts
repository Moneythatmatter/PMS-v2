import { logAudit } from "../common/audit";
import type { HousekeepingDispatchers } from "../../HousekeepingActions";
import type { HKLuggageJob } from "../../HousekeepingTypes";

export const assignBellBoy = (
  id: string,
  bellBoyName: string,
  currentLuggageJobs: HKLuggageJob[],
  dispatchers: HousekeepingDispatchers
) => {
  dispatchers.setLuggageJobs((prev) =>
    prev.map((job) => (job.id === id ? { ...job, bellBoy: bellBoyName } : job))
  );
  const job = currentLuggageJobs.find((j) => j.id === id);
  logAudit(
    "Room Status",
    "Luggage Assigned",
    `Assigned Bell Boy ${bellBoyName} to luggage tag #${job?.tagNumber}.`,
    job?.room,
    dispatchers.currentUsername,
    dispatchers.setHistory
  );
};
