import { logAudit } from "../common/audit";
import type { HousekeepingDispatchers } from "../../HousekeepingActions";
import type { HKLuggageJob } from "../../HousekeepingTypes";
import { hkLuggageService } from "@/services/housekeeping";

export const addLuggageJob = (job: Omit<HKLuggageJob, "id" | "status" | "pickupTime">, luggageJobsLength: number, dispatchers: HousekeepingDispatchers) => {
  const record: HKLuggageJob = {
    id: `LG-${String(luggageJobsLength + 1).padStart(3, "0")}`,
    guest: job.guest,
    room: job.room,
    bellBoy: job.bellBoy,
    tagNumber: job.tagNumber,
    bagCount: job.bagCount,
    type: job.type,
    status: "Pending",
    pickupTime: new Date().toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
    remarks: job.remarks,
  };
  dispatchers.setLuggageJobs((prev) => [record, ...prev]);
  logAudit("Room Status", "Luggage Tagged", `Bell Boy ${job.bellBoy} registered tag #${job.tagNumber} for guest ${job.guest}.`, job.room, dispatchers.currentUsername, dispatchers.setHistory);

  void hkLuggageService.create(record).catch((err) => {
    console.error("[HK] Failed to sync new luggage job to API", err);
  });
};
