import { logAudit } from "../common/audit";
import type { HousekeepingDispatchers } from "../../HousekeepingActions";
import type { HKLaundryJob } from "../../HousekeepingTypes";

export const updateLaundryStatus = (id: string, newStatus: HKLaundryJob["status"], currentLaundryJobs: HKLaundryJob[], dispatchers: HousekeepingDispatchers) => {
  const nowStr = new Date().toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  dispatchers.setLaundryJobs((prev) =>
    prev.map((job) => {
      if (job.id !== id) return job;
      const tl = { ...job.timeline };
      if (newStatus === "Washing") tl.washedAt = nowStr;
      if (newStatus === "Ready") tl.readyAt = nowStr;
      if (newStatus === "Delivered") tl.deliveredAt = nowStr;

      return {
        ...job,
        status: newStatus,
        timeline: tl,
      };
    })
  );

  const job = currentLaundryJobs.find((j) => j.id === id);
  if (!job) return;

  // If hotel laundry job complete ("Ready" / "Delivered"), return items to stock!
  if (job.type === "Hotel" && newStatus === "Ready") {
    dispatchers.setInventory((prev) =>
      prev.map((item) => {
        if (item.name === job.item) {
          return {
            ...item,
            available: item.available + job.quantity,
            laundry: Math.max(0, (item.laundry || 0) - job.quantity),
          };
        }
        return item;
      })
    );
    logAudit("Inventory", "Linen Returned", `Returned ${job.quantity}x ${job.item} from Laundry to Available Stock.`, undefined, dispatchers.currentUsername, dispatchers.setHistory);
  }

  logAudit("Laundry", "Laundry Updated", `Laundry job #${id} (${job.item}) status updated to ${newStatus}.`, job.room, dispatchers.currentUsername, dispatchers.setHistory);
};
