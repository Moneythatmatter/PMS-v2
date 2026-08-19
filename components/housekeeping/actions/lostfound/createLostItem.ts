import { logAudit } from "../common/audit";
import type { HousekeepingDispatchers } from "../../HousekeepingActions";
import type { LostFoundItem } from "../../HousekeepingTypes";
import { hkLostFoundService } from "@/services/housekeeping";
import {
  normalizeLostFoundItem,
  resolveLostFoundApiId,
  toLostFoundCreatePayload,
  type LostFoundCreateInput,
} from "../../lostFoundItemUtils";

export const addLostFoundItem = (
  item: LostFoundCreateInput,
  dispatchers: HousekeepingDispatchers,
) => {
  const payload = toLostFoundCreatePayload(item);
  const optimistic: LostFoundItem = {
    id: `LF-pending-${Date.now()}`,
    item: item.item,
    guest: item.guest || "Unknown",
    foundBy: item.foundBy || "Housekeeping Staff",
    room: item.room || item.foundLocation || "Lobby",
    foundDate: new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    description: item.description,
    status: "Stored",
    category: item.category,
    foundLocation: item.foundLocation,
    storedLocation: item.storedLocation,
  };
  dispatchers.setLostFound((prev) => [optimistic, ...prev]);

  void hkLostFoundService
    .create(payload)
    .then((row) => {
      const record = normalizeLostFoundItem(row);
      dispatchers.setLostFound((prev) =>
        prev.map((r) => (r.id === optimistic.id ? record : r)),
      );
    })
    .catch((err) => {
      console.error("[HK] Failed to sync new Lost & Found item to API", err);
      dispatchers.setLostFound((prev) =>
        prev.filter((r) => r.id !== optimistic.id),
      );
    });

  logAudit(
    "Lost & Found",
    "Item Logged",
    `Registered Lost & Found item: "${item.item}" found in ${item.room || item.foundLocation || "property"} by ${item.foundBy || "staff"}.`,
    item.room,
    dispatchers.currentUsername,
    dispatchers.setHistory,
  );
};
