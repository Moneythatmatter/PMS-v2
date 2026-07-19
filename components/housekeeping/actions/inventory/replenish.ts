import { logAudit } from "../common/audit";
import type { HousekeepingDispatchers } from "../../HousekeepingActions";
import type { HKInventoryItem } from "../../HousekeepingTypes";

export const restockInventoryItem = (itemId: string, qty: number, currentInventory: HKInventoryItem[], dispatchers: HousekeepingDispatchers) => {
  dispatchers.setInventory((prev) =>
    prev.map((item) => {
      if (item.id !== itemId) return item;
      return {
        ...item,
        available: item.available + qty,
      };
    })
  );
  const item = currentInventory.find((i) => i.id === itemId);
  logAudit("Inventory", "Stock Replenished", `Restocked ${qty} units of "${item?.name}".`, undefined, dispatchers.currentUsername, dispatchers.setHistory);
};
