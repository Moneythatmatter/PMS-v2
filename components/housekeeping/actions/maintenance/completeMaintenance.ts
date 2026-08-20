import { logAudit } from "../common/audit";
import { changeRoomStatus } from "../room/roomStatus";
import type { HousekeepingDispatchers } from "../../HousekeepingActions";
import type { MaintenanceRequest, HKRoom } from "../../HousekeepingTypes";
import { hkMaintenanceService } from "@/services/housekeeping";
import { normalizeMaintenanceRequest } from "../../maintenanceRequestUtils";

export const startMaintenanceRepair = (
  id: string,
  currentMaintenance: MaintenanceRequest[],
  dispatchers: HousekeepingDispatchers,
) => {
  const nowStr = new Date().toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const req = currentMaintenance.find((r) => r.id === id);
  const history = req?.assignmentHistory || [];
  const newLog = {
    timestamp: nowStr,
    action: "Repair Started",
    by: req?.engineer || "Engineer",
  };
  const updatedHistory = [...history, newLog];

  dispatchers.setMaintenance((prev) =>
    prev.map((r) => {
      if (r.id !== id) return r;
      return {
        ...r,
        status: "In Progress",
        startedAt: nowStr,
        assignmentHistory: updatedHistory,
      };
    }),
  );

  logAudit(
    "Maintenance",
    "Repair Started",
    `Engineer started repair on request #${id} in Room ${req?.room}.`,
    req?.room,
    dispatchers.currentUsername,
    dispatchers.setHistory,
  );

  void hkMaintenanceService
    .start(id)
    .then((updated) => {
      dispatchers.setMaintenance((prev) =>
        prev.map((r) => (r.id === id ? normalizeMaintenanceRequest(updated) : r)),
      );
    })
    .catch((err) => {
      console.error("[HK] Failed to sync start repair to API", err);
    });
};

export const completeMaintenanceRequest = (
  id: string,
  currentMaintenance: MaintenanceRequest[],
  dispatchers: HousekeepingDispatchers,
) => {
  const nowStr = new Date().toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const req = currentMaintenance.find((r) => r.id === id);
  const history = req?.assignmentHistory || [];
  const newLog = {
    timestamp: nowStr,
    action: "Repair Completed",
    by: req?.engineer || "Engineer",
  };
  const updatedHistory = [...history, newLog];

  dispatchers.setMaintenance((prev) =>
    prev.map((r) => {
      if (r.id !== id) return r;
      return {
        ...r,
        status: "Awaiting Verification",
        completedAt: nowStr,
        assignmentHistory: updatedHistory,
      };
    }),
  );

  logAudit(
    "Maintenance",
    "Repair Completed",
    `Engineer completed repair on request #${id} in Room ${req?.room}. Awaiting supervisor verification.`,
    req?.room,
    dispatchers.currentUsername,
    dispatchers.setHistory,
  );

  void hkMaintenanceService
    .complete(id)
    .then((updated) => {
      dispatchers.setMaintenance((prev) =>
        prev.map((r) => (r.id === id ? normalizeMaintenanceRequest(updated) : r)),
      );
    })
    .catch((err) => {
      console.error("[HK] Failed to sync complete repair to API", err);
    });
};

export const verifyMaintenanceRequest = (
  id: string,
  currentMaintenance: MaintenanceRequest[],
  currentRooms: HKRoom[],
  dispatchers: HousekeepingDispatchers,
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
  const history = req?.assignmentHistory || [];
  const newLog = {
    timestamp: nowStr,
    action: "Verified by Supervisor",
    by: dispatchers.currentUsername,
  };
  const updatedHistory = [...history, newLog];

  dispatchers.setMaintenance((prev) =>
    prev.map((r) => {
      if (r.id !== id) return r;
      return {
        ...r,
        status: "Closed",
        actualCompletion: nowStr,
        assignmentHistory: updatedHistory,
      };
    }),
  );

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
      }),
    );
  }

  const targetRoomObj = currentRooms.find((rm) => rm.roomNo === req.room);
  const targetHKStatus = targetRoomObj?.hkStatus || "Clean";

  const finalRoomStatus =
    targetHKStatus === "Clean" || targetHKStatus === "Inspected"
      ? "Vacant Ready"
      : "Vacant Dirty";
  changeRoomStatus(req.room, finalRoomStatus as any, dispatchers);

  logAudit(
    "Maintenance",
    "Issue Closed",
    `Verified and closed maintenance request #${id} in Room ${req.room}. Room released back to cleaning/occupancy.`,
    req.room,
    dispatchers.currentUsername,
    dispatchers.setHistory,
  );

  void hkMaintenanceService
    .verify(id, dispatchers.currentUsername)
    .then((updated) => {
      dispatchers.setMaintenance((prev) =>
        prev.map((r) => (r.id === id ? normalizeMaintenanceRequest(updated) : r)),
      );
    })
    .catch((err) => {
      console.error("[HK] Failed to sync verify/close repair to API", err);
    });
};
