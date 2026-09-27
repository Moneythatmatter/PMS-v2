import { logAudit } from "../common/audit";
import type { HousekeepingDispatchers } from "../../HousekeepingActions";
import { hkLaundryService } from "@/services/housekeeping";

export const cancelLaundryJob = (
  id: string,
  dispatchers: HousekeepingDispatchers,
) => {
  let room: string | undefined;
  dispatchers.setLaundryJobs((prev) =>
    prev.map((job) => {
      if (job.id !== id) return job;
      room = job.room;
      return { ...job, cancelled: true };
    }),
  );

  logAudit(
    "Laundry",
    "Laundry Cancelled",
    `Laundry job #${id} cancelled.`,
    room,
    dispatchers.currentUsername,
    dispatchers.setHistory,
  );

  void hkLaundryService
    .update(id, { cancelled: true })
    .catch((err) => {
      console.error("[HK] Failed to sync laundry cancel to API", err);
    });
};
