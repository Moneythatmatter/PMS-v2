import { logAudit } from "../common/audit";
import type { HousekeepingDispatchers } from "../../HousekeepingActions";
import type { HKLuggageJob } from "../../HousekeepingTypes";
import { hkLuggageService } from "@/services/housekeeping";

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

  void hkLuggageService.update(id, { bellBoy: bellBoyName }).catch((err) => {
    console.error("[HK] Failed to sync bell boy assignment to API", err);
  });
};
