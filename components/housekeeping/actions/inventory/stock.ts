import { logAudit } from "../common/audit";
import type { HousekeepingDispatchers } from "../../HousekeepingActions";
import type { HKInventoryItem, HKDamageReport } from "../../HousekeepingTypes";

export const discardLinenItem = (itemId: string, qty: number, currentInventory: HKInventoryItem[], dispatchers: HousekeepingDispatchers) => {
  dispatchers.setInventory((prev) =>
    prev.map((item) => {
      if (item.id !== itemId) return item;
      return {
        ...item,
        available: Math.max(0, item.available - qty),
        discarded: item.discarded + qty,
      };
    })
  );
  const item = currentInventory.find((i) => i.id === itemId);
  logAudit("Inventory", "Linen Discarded", `Discarded ${qty}x ${item?.name} due to wear and tear.`, undefined, dispatchers.currentUsername, dispatchers.setHistory);
};

export const addDamageReport = (
  report: Omit<HKDamageReport, "id" | "reportedAt" | "status" | "reportedBy">,
  damageReportsLength: number,
  dispatchers: HousekeepingDispatchers
) => {
  const record: HKDamageReport = {
    id: `DM-${String(damageReportsLength + 1).padStart(2, "0")}`,
    room: report.room,
    damageType: report.damageType,
    description: report.description,
    reportedBy: dispatchers.currentUsername,
    reportedAt: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    estimatedCost: report.estimatedCost,
    status: "Reported",
  };
  dispatchers.setDamageReports((prev) => [record, ...prev]);
  logAudit("Room Status", "Damage Reported", `Reported ${report.damageType} damage in Room ${report.room}. Cost estimate: INR ${report.estimatedCost}.`, report.room, dispatchers.currentUsername, dispatchers.setHistory);
};

export const updateDamageStatus = (
  id: string,
  status: HKDamageReport["status"],
  currentDamageReports: HKDamageReport[],
  dispatchers: HousekeepingDispatchers
) => {
  dispatchers.setDamageReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  const report = currentDamageReports.find((r) => r.id === id);
  logAudit("Room Status", "Damage Status", `Damage report #${id} in Room ${report?.room} status set to ${status}.`, report?.room, dispatchers.currentUsername, dispatchers.setHistory);
};
