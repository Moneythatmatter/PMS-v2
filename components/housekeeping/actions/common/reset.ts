import { logAudit } from "./audit";
import type { HousekeepingDispatchers } from "../../HousekeepingActions";

export const resetState = (dispatchers: HousekeepingDispatchers) => {
  dispatchers.setRooms([]);
  dispatchers.setPublicAreas([]);
  dispatchers.setInventory([]);
  dispatchers.setLaundryJobs([]);
  dispatchers.setDamageReports([]);
  dispatchers.setRequisitions([]);
  dispatchers.setHistory([]);
  dispatchers.setLuggageJobs([]);
  dispatchers.setRequests([]);
  dispatchers.setMaintenance([]);
  dispatchers.setLostFound([]);

  logAudit(
    "Room Status",
    "State Reset",
    "Reset all PMS database elements back to default.",
    undefined,
    dispatchers.currentUsername,
    dispatchers.setHistory,
  );
};
