import { logAudit } from "../common/audit";
import type { HousekeepingDispatchers } from "../../HousekeepingActions";
import type { LostFoundItem } from "../../HousekeepingTypes";
import { hkLostFoundService } from "@/services/housekeeping";
import {
  normalizeLostFoundItem,
  resolveLostFoundApiId,
} from "../../lostFoundItemUtils";

export const returnLostFound = (
  id: string,
  currentLostFound: LostFoundItem[],
  claimBy?: string,
  dispatchers?: HousekeepingDispatchers,
) => {
  const item = currentLostFound.find((r) => r.id === id);
  const apiId = item ? resolveLostFoundApiId(item) : id;
  const claimant = claimBy || item?.guest || "Guest";

  if (dispatchers) {
    dispatchers.setLostFound((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "Returned",
              returnedDate: new Date().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }),
              guest: claimant,
            }
          : r,
      ),
    );

    logAudit(
      "Lost & Found",
      "Item Returned",
      `Returned item "${item?.item}" to claimant: ${claimant}.`,
      item?.room,
      dispatchers.currentUsername,
      dispatchers.setHistory,
    );

    void hkLostFoundService
      .return(apiId, { returnedTo: claimant, claimBy: claimant })
      .then((row) => {
        const record = normalizeLostFoundItem(row);
        dispatchers.setLostFound((prev) =>
          prev.map((r) => (r.id === id ? record : r)),
        );
      })
      .catch((err) => {
        console.error("[HK] Failed to sync Lost & Found return to API", err);
      });
  }
};
