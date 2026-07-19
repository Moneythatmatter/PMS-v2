import { logAudit } from "../common/audit";
import type { HousekeepingDispatchers } from "../../HousekeepingActions";
import type { HKRequisition } from "../../HousekeepingTypes";

export const approveRequisition = (id: string, currentRequisitions: HKRequisition[], dispatchers: HousekeepingDispatchers) => {
  dispatchers.setRequisitions((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Approved" } : r)));
  const req = currentRequisitions.find((r) => r.id === id);
  logAudit("Inventory", "Requisition Approved", `Approved stock request ${req?.requestNo}.`, undefined, dispatchers.currentUsername, dispatchers.setHistory);
};

export const issueRequisition = (id: string, currentRequisitions: HKRequisition[], dispatchers: HousekeepingDispatchers) => {
  const nowStr = new Date().toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: true });

  // Deduct items from inventory stock!
  const req = currentRequisitions.find((r) => r.id === id);
  if (!req) return;

  dispatchers.setInventory((prev) =>
    prev.map((invItem) => {
      const requested = req.items.find((i) => i.item === invItem.name);
      if (requested) {
        return {
          ...invItem,
          available: Math.max(0, invItem.available - requested.quantity),
        };
      }
      return invItem;
    })
  );

  dispatchers.setRequisitions((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Issued", issuedAt: nowStr } : r)));
  logAudit("Inventory", "Requisition Issued", `Issued stock items for ${req.requestNo}. Store quantities decremented.`, undefined, dispatchers.currentUsername, dispatchers.setHistory);
};

export const rejectRequisition = (id: string, currentRequisitions: HKRequisition[], remarks?: string, dispatchers?: HousekeepingDispatchers) => {
  if (dispatchers) {
    dispatchers.setRequisitions((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Rejected", remarks: remarks || r.remarks } : r)));
    const req = currentRequisitions.find((r) => r.id === id);
    logAudit("Inventory", "Requisition Rejected", `Rejected stock request ${req?.requestNo}. Remarks: ${remarks || "None"}.`, undefined, dispatchers.currentUsername, dispatchers.setHistory);
  }
};
