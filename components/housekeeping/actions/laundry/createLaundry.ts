import { logAudit } from "../common/audit";
import type { HousekeepingDispatchers } from "../../HousekeepingActions";
import type { HKLaundryJob } from "../../HousekeepingTypes";
import { hkLaundryService } from "@/services/housekeeping";

export const addLaundryJob = (job: Omit<HKLaundryJob, "id" | "status" | "timeline">, laundryLength: number, dispatchers: HousekeepingDispatchers) => {
  const uniqueCode = `${Date.now().toString(36).toUpperCase().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
  const optimisticId = `LD-${uniqueCode}`;

  const record: HKLaundryJob = {
    id: optimisticId,
    type: job.type,
    item: job.item,
    quantity: job.quantity,
    room: job.room,
    guestName: job.guestName,
    status: "Collection",
    charges: job.charges,
    timeline: {
      collectedAt: new Date().toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    },
    notes: job.notes,
  };
  dispatchers.setLaundryJobs((prev) => [record, ...prev]);

  // If hotel linen, deduct from available stock and add to laundry
  if (job.type === "Hotel") {
    dispatchers.setInventory((prev) =>
      prev.map((item) => {
        if (item.name === job.item) {
          return {
            ...item,
            available: Math.max(0, item.available - job.quantity),
            laundry: (item.laundry || 0) + job.quantity,
          };
        }
        return item;
      })
    );
  }

  logAudit("Laundry", "Laundry Registered", `Registered laundry job: ${job.quantity}x ${job.item}. Status: Collection.`, job.room, dispatchers.currentUsername, dispatchers.setHistory);

  void hkLaundryService
    .create(record)
    .then((created) => {
      if (created && created.id) {
        dispatchers.setLaundryJobs((prev) =>
          prev.map((r) => (r.id === optimisticId ? { ...r, ...created } : r))
        );
      }
    })
    .catch((err) => {
      console.error("[HK] Failed to sync new laundry job to API", err);
    });
};
