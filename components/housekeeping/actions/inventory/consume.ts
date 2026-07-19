import { logAudit } from "../common/audit";
import type { HousekeepingDispatchers } from "../../HousekeepingActions";

export const consumeItemStock = (
  itemName: string,
  qty: number,
  dispatchers: HousekeepingDispatchers
) => {
  dispatchers.setInventory((prev) =>
    prev.map((item) => {
      if (item.name.toLowerCase().includes(itemName.toLowerCase())) {
        return {
          ...item,
          available: Math.max(0, item.available - qty),
        };
      }
      return item;
    })
  );
  logAudit(
    "Inventory",
    "Stock Consumed",
    `Deducted ${qty} units of "${itemName}" from available stock.`,
    undefined,
    dispatchers.currentUsername,
    dispatchers.setHistory
  );
};
