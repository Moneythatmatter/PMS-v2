import { logAudit } from "../common/audit";
import { changeRoomStatus } from "../room/roomStatus";
import type { HousekeepingDispatchers } from "../../HousekeepingActions";
import type { HKStaff, MaintenanceRequest } from "../../HousekeepingTypes";

export const getSmartEngineerRecommendation = (staffList: HKStaff[], targetFloor: string, category: string): HKStaff | null => {
  const candidateEngineers = staffList.filter((s) => {
    const isEngineer = s.role === "Engineer";
    const isActive = s.status === "Active";
    const isAvailable = s.workStatus !== "Break" && s.workStatus !== "Off Shift";
    return isEngineer && isActive && isAvailable;
  });

  if (candidateEngineers.length === 0) return null;

  const matchSpecialization = (cat: string, spec?: string): boolean => {
    if (!spec) return false;
    const catLower = cat.toLowerCase();
    const specLower = spec.toLowerCase();
    if (catLower.includes("elect") && specLower === "electrical") return true;
    if (catLower.includes("plumb") && specLower === "plumbing") return true;
    if ((catLower.includes("ac") || catLower.includes("air cond") || catLower.includes("cooler") || catLower.includes("heating")) && specLower === "hvac") return true;
    if (catLower.includes("furn") && specLower === "carpentry") return true;
    if (catLower.includes("general") || catLower.includes("other") || specLower === "general") return true;
    return false;
  };

  const sorted = candidateEngineers.slice().sort((a, b) => {
    // 1. Lowest workload
    const jobsA = a.activeJobs || 0;
    const jobsB = b.activeJobs || 0;
    if (jobsA !== jobsB) return jobsA - jobsB;

    // 2. Same floor
    const floorMatchA = (a.currentFloor && targetFloor && a.currentFloor.toLowerCase() === targetFloor.toLowerCase()) ? 1 : 0;
    const floorMatchB = (b.currentFloor && targetFloor && b.currentFloor.toLowerCase() === targetFloor.toLowerCase()) ? 1 : 0;
    if (floorMatchA !== floorMatchB) {
      return floorMatchB - floorMatchA;
    }

    // 3. Specialization match
    const specMatchA = matchSpecialization(category, a.specialization) ? 1 : 0;
    const specMatchB = matchSpecialization(category, b.specialization) ? 1 : 0;
    if (specMatchA !== specMatchB) {
      return specMatchB - specMatchA;
    }

    // 4. Least recently assigned
    const timeA = a.lastAssignedTime ? new Date(a.lastAssignedTime).getTime() : 0;
    const timeB = b.lastAssignedTime ? new Date(b.lastAssignedTime).getTime() : 0;
    return timeA - timeB;
  });

  return sorted[0] || candidateEngineers.find((s) => s.specialization === "General") || sorted[0];
};

export const addMaintenanceRequest = (
  req: {
    room: string;
    problem: string;
    priority: "Low" | "Medium" | "High" | "Critical";
    engineer: string;
    assignmentType: "Auto" | "Manual";
    estimatedCompletion?: string;
    attachments?: { name: string; type: "image" | "pdf" | "video"; url: string }[];
  },
  maintenanceLength: number,
  dispatchers: HousekeepingDispatchers
) => {
  const nowStr = new Date().toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const isAssigned = req.engineer && req.engineer !== "—";

  const record: MaintenanceRequest = {
    id: `MT-${String(maintenanceLength + 1).padStart(2, "0")}`,
    room: req.room,
    problem: req.problem,
    priority: req.priority,
    status: isAssigned ? "Assigned" : "Open",
    engineer: req.engineer || "—",
    reportedBy: dispatchers.currentUsername,
    createdAt: nowStr,
    assignedAt: isAssigned ? nowStr : undefined,
    estimatedCompletion: req.estimatedCompletion,
    assignmentType: req.assignmentType,
    attachments: req.attachments || [],
    assignmentHistory: [
      {
        timestamp: nowStr,
        action: "Issue Reported",
        by: "System",
      },
      ...(isAssigned ? [
        {
          timestamp: nowStr,
          action: `${req.assignmentType === "Auto" ? "Auto Assigned" : "Manually Assigned"} → ${req.engineer}`,
          by: "System",
        }
      ] : [])
    ],
  };

  dispatchers.setMaintenance((prev) => [record, ...prev]);

  if (isAssigned) {
    dispatchers.setStaff((prev) =>
      prev.map((s) => {
        if (s.name === req.engineer) {
          return {
            ...s,
            activeJobs: (s.activeJobs || 0) + 1,
            lastAssignedTime: new Date().toISOString(),
            lastAssignment: new Date().toISOString(),
          };
        }
        return s;
      })
    );
  }

  // OOO / OOS rules: Critical issue immediately blocks room
  if (req.priority === "Critical") {
    changeRoomStatus(req.room, "Out of Order", dispatchers);
  } else if (req.priority === "High") {
    changeRoomStatus(req.room, "Out of Service", dispatchers);
  }

  logAudit("Maintenance", "Issue Raised", `Reported maintenance issue in Room ${req.room}: "${req.problem}".`, req.room, dispatchers.currentUsername, dispatchers.setHistory);
};
