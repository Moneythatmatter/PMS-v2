import { logAudit } from "../common/audit";
import type { HousekeepingDispatchers } from "../../HousekeepingActions";
import type { LostFoundItem } from "../../HousekeepingTypes";
import { hkLostFoundService } from "@/services/housekeeping";

export const addLostFoundItem = (item: Omit<LostFoundItem, "id" | "foundDate" | "status">, lostFoundLength: number, dispatchers: HousekeepingDispatchers) => {
  const record: LostFoundItem = {
    id: `LF-${String(lostFoundLength + 1).padStart(2, "0")}`,
    item: item.item,
    guest: item.guest || "Unknown",
    foundBy: item.foundBy,
    room: item.room || "Lobby",
    foundDate: new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    description: item.description,
    status: "Stored",
  };
  dispatchers.setLostFound((prev) => [record, ...prev]);
  logAudit(
    "Lost & Found",
    "Item Logged",
    `Registered Lost & Found item: "${item.item}" found in ${item.room} by ${item.foundBy}.`,
    item.room,
    dispatchers.currentUsername,
    dispatchers.setHistory
  );

  void hkLostFoundService.create(record).catch((err) => {
    console.error("[HK] Failed to sync new Lost & Found item to API", err);
  });
};
