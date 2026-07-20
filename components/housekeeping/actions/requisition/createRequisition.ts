import { logAudit } from "../common/audit";
import type { HousekeepingDispatchers } from "../../HousekeepingActions";
import type { HKRequisition } from "../../HousekeepingTypes";

export const addRequisition = (req: Omit<HKRequisition, "id" | "requestNo" | "status" | "requestedAt" | "requestedBy">, requisitionsLength: number, dispatchers: HousekeepingDispatchers) => {
  const record: HKRequisition = {
    id: `RQ-${String(requisitionsLength + 1).padStart(2, "0")}`,
    requestNo: `REQ-2026-${String(requisitionsLength + 1).padStart(3, "0")}`,
    requestedBy: dispatchers.currentUsername,
    items: req.items,
    status: "Pending",
    requestedAt: new Date().toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: true }),
    remarks: req.remarks,
  };
  dispatchers.setRequisitions((prev) => [record, ...prev]);
  logAudit("Inventory", "Requisition Created", `Requisition ${record.requestNo} created by ${dispatchers.currentUsername} for ${req.items.length} items.`, undefined, dispatchers.currentUsername, dispatchers.setHistory);
};
