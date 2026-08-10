import { logAudit } from "../common/audit";
import type { HousekeepingDispatchers } from "../../HousekeepingActions";
import type { MaintenanceRequest } from "../../HousekeepingTypes";
import { hkMaintenanceService } from "@/services/housekeeping";

export const assignMaintenanceRequest = (
  id: string,
  engineerName: string,
  assignmentType: "Auto" | "Manual",
  reason: string,
  currentMaintenance: MaintenanceRequest[],
  dispatchers: HousekeepingDispatchers
) => {
  const nowStr = new Date().toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const req = currentMaintenance.find((r) => r.id === id);
  const oldEngineer = req?.engineer;
  const history = req?.assignmentHistory || [];
  const newLog = {
    timestamp: nowStr,
    action: oldEngineer && oldEngineer !== "—"
      ? `Reassigned → ${engineerName}`
      : `${assignmentType === "Auto" ? "Auto Assigned" : "Manually Assigned"} → ${engineerName}`,
    by: oldEngineer && oldEngineer !== "—" ? "Supervisor" : "System",
    reason: reason || undefined,
  };
  const updatedHistory = [...history, newLog];

  dispatchers.setMaintenance((prev) =>
    prev.map((r) => {
      if (r.id !== id) return r;
      return {
        ...r,
        status: "Assigned",
        engineer: engineerName,
        assignedAt: nowStr,
        assignmentType,
        assignmentHistory: updatedHistory,
      };
    })
  );

  // Update workloads
  dispatchers.setStaff((prev) =>
    prev.map((s) => {
      let updated = { ...s };
      if (oldEngineer && oldEngineer !== "—" && s.name === oldEngineer) {
        updated.activeJobs = Math.max(0, (s.activeJobs || 0) - 1);
      }
      if (s.name === engineerName) {
        updated.activeJobs = (s.activeJobs || 0) + 1;
        updated.lastAssignedTime = new Date().toISOString();
        updated.lastAssignment = new Date().toISOString();
      }
      return updated;
    })
  );

  logAudit("Maintenance", "Issue Assigned", `Assigned maintenance request #${id} to engineer ${engineerName}.`, req?.room, dispatchers.currentUsername, dispatchers.setHistory);

  void hkMaintenanceService.update(id, {
    status: "Assigned",
    engineer: engineerName,
    assignedAt: nowStr,
    assignmentType,
    assignmentHistory: updatedHistory,
  }).catch((err) => {
    console.error("[HK] Failed to sync assign maintenance request to API", err);
  });
};
