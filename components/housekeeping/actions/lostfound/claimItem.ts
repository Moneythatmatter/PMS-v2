import { logAudit } from "../common/audit";
import type { HousekeepingDispatchers } from "../../HousekeepingActions";
import type { LostFoundItem } from "../../HousekeepingTypes";
import { hkLostFoundService } from "@/services/housekeeping";

export const returnLostFound = (id: string, currentLostFound: LostFoundItem[], claimBy?: string, dispatchers?: HousekeepingDispatchers) => {
  const now = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  if (dispatchers) {
    dispatchers.setLostFound((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "Returned", returnedDate: now, guest: claimBy || r.guest } : r))
    );
    const item = currentLostFound.find((r) => r.id === id);
    logAudit(
      "Lost & Found",
      "Item Returned",
      `Returned item "${item?.item}" to claimant: ${claimBy || item?.guest || "Guest"}.`,
      item?.room,
      dispatchers.currentUsername,
      dispatchers.setHistory
    );

    void hkLostFoundService.update(id, {
      status: "Returned",
      returnedDate: now,
      guest: claimBy || item?.guest || "Guest",
    }).catch((err) => {
      console.error("[HK] Failed to sync Lost & Found return to API", err);
    });
  }
};
