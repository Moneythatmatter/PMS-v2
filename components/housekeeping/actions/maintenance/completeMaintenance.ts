import { logAudit } from "../common/audit";
import { changeRoomStatus } from "../room/roomStatus";
import type { HousekeepingDispatchers } from "../../HousekeepingActions";
import type { MaintenanceRequest, HKRoom } from "../../HousekeepingTypes";

export const startMaintenanceRepair = (
  id: string,
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

  dispatchers.setMaintenance((prev) =>
    prev.map((r) => {
      if (r.id !== id) return r;
      const history = r.assignmentHistory || [];
      const newLog = {
        timestamp: nowStr,
        action: "Repair Started",
        by: r.engineer || "Engineer",
      };
      return {
        ...r,
        status: "In Progress",
        startedAt: nowStr,
        assignmentHistory: [...history, newLog],
      };
    })
  );

  const req = currentMaintenance.find((r) => r.id === id);
  logAudit("Maintenance", "Repair Started", `Engineer started repair on request #${id} in Room ${req?.room}.`, req?.room, dispatchers.currentUsername, dispatchers.setHistory);
};

export const completeMaintenanceRequest = (
  id: string,
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

  dispatchers.setMaintenance((prev) =>
    prev.map((r) => {
      if (r.id !== id) return r;
      const history = r.assignmentHistory || [];
      const newLog = {
        timestamp: nowStr,
        action: "Repair Completed",
        by: r.engineer || "Engineer",
      };
      return {
        ...r,
        status: "Awaiting Verification",
        completedAt: nowStr,
        assignmentHistory: [...history, newLog],
      };
    })
  );

  const req = currentMaintenance.find((r) => r.id === id);
  logAudit("Maintenance", "Repair Completed", `Engineer completed repair on request #${id} in Room ${req?.room}. Awaiting supervisor verification.`, req?.room, dispatchers.currentUsername, dispatchers.setHistory);
};

export const verifyMaintenanceRequest = (
  id: string,
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
  if (!req) return;

  const engineerName = req.engineer;

  dispatchers.setMaintenance((prev) =>
    prev.map((r) => {
      if (r.id !== id) return r;
      const history = r.assignmentHistory || [];
      const newLog = {
        timestamp: nowStr,
        action: "Verified by Supervisor",
        by: dispatchers.currentUsername,
      };
      return {
        ...r,
        status: "Closed",
        actualCompletion: nowStr,
        assignmentHistory: [...history, newLog],
      };
    })
  );

  // Update workloads
  if (engineerName && engineerName !== "—") {
    dispatchers.setStaff((prev) =>
      prev.map((s) => {
        if (s.name === engineerName) {
          return {
            ...s,
            activeJobs: Math.max(0, (s.activeJobs || 0) - 1),
            completedToday: (s.completedToday || 0) + 1,
          };
        }
        return s;
      })
    );
  }

  // Release room back to vacant dirty/clean!
  const storedRooms = localStorage.getItem("hk_rooms");
  let targetHKStatus = "Clean";
  if (storedRooms) {
    const hkRooms: HKRoom[] = JSON.parse(storedRooms);
    const targetRoomObj = hkRooms.find((rm) => rm.roomNo === req.room);
    targetHKStatus = targetRoomObj?.hkStatus || "Clean";
  }

  const finalRoomStatus = (targetHKStatus === "Clean" || targetHKStatus === "Inspected") ? "Vacant Ready" : "Vacant Dirty";
  changeRoomStatus(req.room, finalRoomStatus as any, dispatchers);

  logAudit("Maintenance", "Issue Closed", `Verified and closed maintenance request #${id} in Room ${req.room}. Room released back to cleaning/occupancy.`, req.room, dispatchers.currentUsername, dispatchers.setHistory);
};
