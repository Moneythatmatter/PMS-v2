import { logAudit } from "../common/audit";
import type { HousekeepingDispatchers } from "../../HousekeepingActions";
import type { HKLuggageJob } from "../../HousekeepingTypes";
import { hkLuggageService } from "@/services/housekeeping";

export const deliverLuggage = (id: string, currentLuggageJobs: HKLuggageJob[], dispatchers: HousekeepingDispatchers) => {
  const nowStr = new Date().toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  dispatchers.setLuggageJobs((prev) =>
    prev.map((job) => (job.id === id ? { ...job, status: "Delivered", deliveryTime: nowStr } : job))
  );
  const job = currentLuggageJobs.find((j) => j.id === id);
  logAudit("Room Status", "Luggage Delivered", `Delivered tag #${job?.tagNumber} bags to Room ${job?.room}.`, job?.room, dispatchers.currentUsername, dispatchers.setHistory);

  void hkLuggageService.update(id, { status: "Delivered", deliveryTime: nowStr }).catch((err) => {
    console.error("[HK] Failed to sync luggage delivery to API", err);
  });
};
