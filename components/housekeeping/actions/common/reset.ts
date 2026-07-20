import {
  initialHKRooms,
  initialHKPublicAreas,
  initialHKInventory,
  initialHKLaundry,
  initialHKDamageReports,
  initialHKRequisitions,
  initialHKHistory,
  initialHKLuggageJobs
} from "../../HousekeepingData";
import {
  housekeepingRequests as initialHKRequests,
  maintenanceRequests as initialMaintenanceRequests,
  lostFoundItems as initialLostFoundItems,
} from "@/app/data/frontoffice/modules";
import { logAudit } from "./audit";
import type { HousekeepingDispatchers } from "../../HousekeepingActions";

export const resetState = (dispatchers: HousekeepingDispatchers) => {
  localStorage.removeItem("hk_rooms");
  localStorage.removeItem("hk_publicAreas");
  localStorage.removeItem("hk_inventory");
  localStorage.removeItem("hk_laundry");
  localStorage.removeItem("hk_damages");
  localStorage.removeItem("hk_requisitions");
  localStorage.removeItem("hk_history");
  localStorage.removeItem("hk_luggage");
  localStorage.removeItem("hk_requests");
  localStorage.removeItem("hk_maintenance");
  localStorage.removeItem("hk_lostfound");

  dispatchers.setRooms(initialHKRooms);
  dispatchers.setPublicAreas(initialHKPublicAreas);
  dispatchers.setInventory(initialHKInventory);
  dispatchers.setLaundryJobs(initialHKLaundry);
  dispatchers.setDamageReports(initialHKDamageReports);
  dispatchers.setRequisitions(initialHKRequisitions);
  dispatchers.setHistory(initialHKHistory);
  dispatchers.setLuggageJobs(initialHKLuggageJobs);
  dispatchers.setRequests(initialHKRequests);
  dispatchers.setMaintenance(initialMaintenanceRequests);
  dispatchers.setLostFound(initialLostFoundItems);

  logAudit("Room Status", "State Reset", "Reset all PMS database elements back to default.", undefined, dispatchers.currentUsername, dispatchers.setHistory);
};
