import React from "react";
import type {
  HKRoom,
  HKPublicArea,
  HKInventoryItem,
  HKLaundryJob,
  HKDamageReport,
  HKRequisition,
  HKHistoryLog,
  HKLuggageJob,
  HousekeepingRequest,
  MaintenanceRequest,
  LostFoundItem,
  HKStaff,
  HKChecklistTemplate,
  HKShift
} from "./HousekeepingTypes";
import {
  initialHKRooms,
  initialHKPublicAreas,
  initialHKInventory,
  initialHKLaundry,
  initialHKDamageReports,
  initialHKRequisitions,
  initialHKHistory,
  initialHKLuggageJobs
} from "./HousekeepingData";
import {
  housekeepingRequests as initialHKRequests,
  maintenanceRequests as initialMaintenanceRequests,
  lostFoundItems as initialLostFoundItems,
} from "@/app/data/frontoffice/modules";

export interface HousekeepingDispatchers {
  setRooms: React.Dispatch<React.SetStateAction<HKRoom[]>>;
  setPublicAreas: React.Dispatch<React.SetStateAction<HKPublicArea[]>>;
  setInventory: React.Dispatch<React.SetStateAction<HKInventoryItem[]>>;
  setLaundryJobs: React.Dispatch<React.SetStateAction<HKLaundryJob[]>>;
  setDamageReports: React.Dispatch<React.SetStateAction<HKDamageReport[]>>;
  setRequisitions: React.Dispatch<React.SetStateAction<HKRequisition[]>>;
  setHistory: React.Dispatch<React.SetStateAction<HKHistoryLog[]>>;
  setLuggageJobs: React.Dispatch<React.SetStateAction<HKLuggageJob[]>>;
  setRequests: React.Dispatch<React.SetStateAction<HousekeepingRequest[]>>;
  setMaintenance: React.Dispatch<React.SetStateAction<MaintenanceRequest[]>>;
  setLostFound: React.Dispatch<React.SetStateAction<LostFoundItem[]>>;
  setStaff: React.Dispatch<React.SetStateAction<HKStaff[]>>;
  setChecklists: React.Dispatch<React.SetStateAction<HKChecklistTemplate[]>>;
  setCurrentUserRole: (role: string) => void;
  setCurrentUsername: (username: string) => void;
  currentUsername: string;
}

// Log audit helper
export const logAudit = (
  category: HKHistoryLog["category"],
  action: string,
  details: string,
  roomNo: string | undefined,
  currentUsername: string,
  setHistory: React.Dispatch<React.SetStateAction<HKHistoryLog[]>>
) => {
  const log: HKHistoryLog = {
    id: `H-${String(Date.now()).slice(-6)}`,
    timestamp: new Date().toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
    user: currentUsername,
    category,
    action,
    room: roomNo,
    details,
  };
  setHistory((prev) => [log, ...prev]);
};

export const startCleaning = (
  roomNo: string,
  housekeeper: string,
  dispatchers: HousekeepingDispatchers
) => {
  dispatchers.setRooms((prev) =>
    prev.map((r) => {
      if (r.roomNo !== roomNo) return r;
      return {
        ...r,
        status: "Cleaning",
        hkStatus: "Cleaning",
        assignedStaff: housekeeper,
        cleaningProgress: 10,
        cleaningTimer: {
          startedAt: new Date().toISOString(),
          elapsedSeconds: 0,
          paused: false,
          lastTick: new Date().toISOString(),
        },
      };
    })
  );
  logAudit("Cleaning", "Started Cleaning", `Housekeeper ${housekeeper} started cleaning room ${roomNo}.`, roomNo, dispatchers.currentUsername, dispatchers.setHistory);
};

export const pauseCleaning = (roomNo: string, dispatchers: HousekeepingDispatchers) => {
  dispatchers.setRooms((prev) =>
    prev.map((r) => {
      if (r.roomNo !== roomNo || !r.cleaningTimer) return r;
      return {
        ...r,
        cleaningTimer: {
          ...r.cleaningTimer,
          paused: true,
          lastTick: new Date().toISOString(),
        },
      };
    })
  );
  logAudit("Cleaning", "Paused Cleaning", `Cleaning paused for room ${roomNo}.`, roomNo, dispatchers.currentUsername, dispatchers.setHistory);
};

export const resumeCleaning = (roomNo: string, dispatchers: HousekeepingDispatchers) => {
  dispatchers.setRooms((prev) =>
    prev.map((r) => {
      if (r.roomNo !== roomNo || !r.cleaningTimer) return r;
      return {
        ...r,
        cleaningTimer: {
          ...r.cleaningTimer,
          paused: false,
          lastTick: new Date().toISOString(),
        },
      };
    })
  );
  logAudit("Cleaning", "Resumed Cleaning", `Cleaning resumed for room ${roomNo}.`, roomNo, dispatchers.currentUsername, dispatchers.setHistory);
};

export const completeCleaning = (roomNo: string, progressItems: string[], dispatchers: HousekeepingDispatchers) => {
  dispatchers.setRooms((prev) =>
    prev.map((r) => {
      if (r.roomNo !== roomNo) return r;
      return {
        ...r,
        status: "Inspection Pending",
        hkStatus: "Dirty", // Still dirty until inspection passes!
        cleaningProgress: 100,
        cleaningTimer: undefined, // clear timer
      };
    })
  );

  // Consume inventory chemicals / amenities mock deduction
  dispatchers.setInventory((prev) =>
    prev.map((item) => {
      if (item.name.includes("Herbal Soap") && item.available > 0) {
        return { ...item, available: item.available - 1 };
      }
      if (item.name.includes("Shampoo") && item.available > 0) {
        return { ...item, available: item.available - 1 };
      }
      if (item.name.includes("Water Bottles") && item.available > 0) {
        return { ...item, available: item.available - 2 };
      }
      return item;
    })
  );

  logAudit(
    "Cleaning",
    "Finished Cleaning",
    `Room cleaning complete. Awaiting supervisor inspection. Items checked: ${progressItems.length}. Soap & shampoo stock decremented by 1, water bottles by 2.`,
    roomNo,
    dispatchers.currentUsername,
    dispatchers.setHistory
  );
};

export const inspectRoom = (
  roomNo: string,
  passed: boolean,
  signature: string,
  remarks: string,
  qualityScore: number,
  dispatchers: HousekeepingDispatchers
) => {
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeStr = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const newHistoryRecord = {
    id: `INS-${String(Date.now()).slice(-6)}`,
    date: dateStr,
    time: timeStr,
    inspector: dispatchers.currentUsername,
    supervisor: dispatchers.currentUsername,
    result: passed ? "Passed" as const : "Rejected" as const,
    qualityScore,
    remarks: remarks || (passed ? "Passed inspection" : "Failed inspection"),
    signature,
  };

  dispatchers.setRooms((prev) =>
    prev.map((r) => {
      if (r.roomNo !== roomNo) return r;
      const historyList = r.inspectionHistory || [];
      const updatedHistory = [newHistoryRecord, ...historyList];

      if (passed) {
        return {
          ...r,
          status: "Vacant Ready" as const,
          hkStatus: "Inspected" as const,
          foStatus: "Vacant" as const,
          assignedSupervisor: dispatchers.currentUsername,
          remarks: remarks || "Inspection passed.",
          inspectionHistory: updatedHistory,
        };
      } else {
        return {
          ...r,
          status: "Vacant Dirty" as const,
          hkStatus: "Dirty" as const,
          remarks: remarks || "Inspection failed. Requires reclean.",
          inspectionHistory: updatedHistory,
        };
      }
    })
  );

  if (passed) {
    logAudit(
      "Inspection",
      "Inspection Passed",
      `Supervisor ${dispatchers.currentUsername} approved room ${roomNo}. Quality Score: ${qualityScore}%. Signature: ${signature || "Signed"}. Remarks: ${remarks || "None"}. Room is now Vacant Ready.`,
      roomNo,
      dispatchers.currentUsername,
      dispatchers.setHistory
    );
  } else {
    logAudit(
      "Inspection",
      "Inspection Rejected",
      `Supervisor ${dispatchers.currentUsername} rejected room ${roomNo}. Quality Score: ${qualityScore}%. Return to housekeeper queue. Remarks: ${remarks}`,
      roomNo,
      dispatchers.currentUsername,
      dispatchers.setHistory
    );
  }
};


export const changeRoomStatus = (roomNo: string, status: HKRoom["status"], dispatchers: HousekeepingDispatchers) => {
  dispatchers.setRooms((prev) =>
    prev.map((r) => {
      if (r.roomNo !== roomNo) return r;
      let hkSt: HKRoom["hkStatus"] = "Clean";
      let foSt: HKRoom["foStatus"] = "Vacant";

      if (status === "Vacant Ready") {
        hkSt = "Inspected";
        foSt = "Vacant";
      } else if (status === "Vacant Dirty") {
        hkSt = "Dirty";
        foSt = "Vacant";
      } else if (status === "Occupied") {
        hkSt = "Clean";
        foSt = "Occupied";
      } else if (status === "Occupied Dirty") {
        hkSt = "Dirty";
        foSt = "Occupied";
      } else if (status === "Blocked") {
        hkSt = "Clean";
        foSt = "Blocked";
      } else if (status === "Out of Order") {
        hkSt = "OOO";
        foSt = "Blocked";
      } else if (status === "Out of Service") {
        hkSt = "OOS";
        foSt = "Vacant";
      } else if (status === "Cleaning") {
        hkSt = "Cleaning";
        foSt = "Vacant";
      } else if (status === "Inspection Pending") {
        hkSt = "Cleaning";
        foSt = "Vacant";
      }

      return {
        ...r,
        status,
        hkStatus: hkSt,
        foStatus: foSt,
      };
    })
  );
  logAudit("Room Status", "Status Override", `Overwrote status of Room ${roomNo} to ${status}.`, roomNo, dispatchers.currentUsername, dispatchers.setHistory);
};

export const addLostFoundItem = (item: Omit<LostFoundItem, "id" | "foundDate" | "status">, lostFoundLength: number, dispatchers: HousekeepingDispatchers) => {
  const record: LostFoundItem = {
    id: `LF-${String(lostFoundLength + 1).padStart(2, "0")}`,
    item: item.item,
    guest: item.guest || "Unknown",
    foundBy: item.foundBy,
    room: item.room || "Lobby",
    foundDate: new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    description: item.description,
    status: "Stored",
  };
  dispatchers.setLostFound((prev) => [record, ...prev]);
  logAudit(
    "Lost & Found",
    "Item Logged",
    `Registered Lost & Found item: "${item.item}" found in ${item.room} by ${item.foundBy}.`,
    item.room,
    dispatchers.currentUsername,
    dispatchers.setHistory
  );
};

export const returnLostFound = (id: string, currentLostFound: LostFoundItem[], claimBy?: string, dispatchers?: HousekeepingDispatchers) => {
  const now = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  if (dispatchers) {
    dispatchers.setLostFound((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "Returned", returnedDate: now, guest: claimBy || r.guest } : r))
    );
    const item = currentLostFound.find((r) => r.id === id);
    logAudit(
      "Lost & Found",
      "Item Returned",
      `Returned item "${item?.item}" to claimant: ${claimBy || item?.guest || "Guest"}.`,
      item?.room,
      dispatchers.currentUsername,
      dispatchers.setHistory
    );
  }
};

export const getSmartStaffRecommendation = (staffList: HKStaff[], targetFloor: string): HKStaff | null => {
  // Candidate staff: Housekeeper role, active status, not on break/off shift
  const candidateStaff = staffList.filter((s) => {
    const isHousekeeper = s.role === "Housekeeper";
    const isActive = s.status === "Active";
    const isAvailable = s.workStatus !== "Break" && s.workStatus !== "Off Shift";
    return isHousekeeper && isActive && isAvailable;
  });

  if (candidateStaff.length === 0) return null;

  const sorted = candidateStaff.slice().sort((a, b) => {
    // Rule 1: Fewest active tasks (lower is better)
    const tasksA = a.activeTaskCount || 0;
    const tasksB = b.activeTaskCount || 0;
    if (tasksA !== tasksB) return tasksA - tasksB;

    // Rule 2: Same floor (matching floor is better)
    const floorMatchA = (a.currentFloor && targetFloor && a.currentFloor.toLowerCase() === targetFloor.toLowerCase()) ? 1 : 0;
    const floorMatchB = (b.currentFloor && targetFloor && b.currentFloor.toLowerCase() === targetFloor.toLowerCase()) ? 1 : 0;
    if (floorMatchA !== floorMatchB) {
      return floorMatchB - floorMatchA; // 1 (match) comes before 0 (no match)
    }

    // Rule 3: Least recently assigned (older timestamp comes first)
    const timeA = a.lastAssignedTime ? new Date(a.lastAssignedTime).getTime() : 0;
    const timeB = b.lastAssignedTime ? new Date(b.lastAssignedTime).getTime() : 0;
    return timeA - timeB; // ascending order puts older timestamp first
  });

  return sorted[0];
};

export const addHKRequest = (
  req: {
    room: string;
    guest: string;
    issue: string;
    priority: "Low" | "Medium" | "High";
    assignedStaff: string;
    assignmentType: "Auto" | "Manual";
  },
  requestsLength: number,
  dispatchers: HousekeepingDispatchers
) => {
  const nowStr = new Date().toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const record: HousekeepingRequest = {
    id: `HK-${String(requestsLength + 1).padStart(2, "0")}`,
    guest: req.guest,
    room: req.room,
    issue: req.issue,
    priority: req.priority,
    status: req.assignedStaff && req.assignedStaff !== "—" ? "In Progress" : "Open",
    assignedStaff: req.assignedStaff || "—",
    createdAt: nowStr,
    assignmentType: req.assignmentType,
    assignmentHistory: req.assignedStaff && req.assignedStaff !== "—" ? [
      {
        timestamp: nowStr,
        action: `${req.assignmentType === "Auto" ? "Auto Assigned" : "Manually Assigned"} → ${req.assignedStaff}`,
        by: "System",
      }
    ] : [],
  };

  dispatchers.setRequests((prev) => [record, ...prev]);

  // Update staff workload if assigned!
  if (req.assignedStaff && req.assignedStaff !== "—") {
    dispatchers.setStaff((prev) =>
      prev.map((s) => {
        if (s.name === req.assignedStaff) {
          return {
            ...s,
            activeTaskCount: (s.activeTaskCount || 0) + 1,
            lastAssignedTime: new Date().toISOString(),
          };
        }
        return s;
      })
    );
  }

  logAudit(
    "Room Status",
    "Guest Request Created",
    `Logged request for Room ${req.room}: "${req.issue}". Assigned to ${req.assignedStaff || "none"}.`,
    req.room,
    dispatchers.currentUsername,
    dispatchers.setHistory
  );
};

export const assignHKRequest = (
  id: string,
  staffName: string,
  assignmentType: "Auto" | "Manual",
  reason: string,
  currentRequests: HousekeepingRequest[],
  dispatchers: HousekeepingDispatchers
) => {
  const nowStr = new Date().toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const req = currentRequests.find((r) => r.id === id);
  const oldStaff = req?.assignedStaff;

  dispatchers.setRequests((prev) =>
    prev.map((r) => {
      if (r.id !== id) return r;
      const history = r.assignmentHistory || [];
      const newLog = {
        timestamp: nowStr,
        action: oldStaff && oldStaff !== "—"
          ? `Reassigned → ${staffName}`
          : `${assignmentType === "Auto" ? "Auto Assigned" : "Manually Assigned"} → ${staffName}`,
        by: oldStaff && oldStaff !== "—" ? "Supervisor" : "System",
        reason: reason || undefined,
      };
      return {
        ...r,
        status: "In Progress",
        assignedStaff: staffName,
        assignmentType,
        assignmentHistory: [...history, newLog],
      };
    })
  );

  // Update workloads
  dispatchers.setStaff((prev) =>
    prev.map((s) => {
      let updated = { ...s };
      if (oldStaff && oldStaff !== "—" && s.name === oldStaff) {
        updated.activeTaskCount = Math.max(0, (s.activeTaskCount || 0) - 1);
      }
      if (s.name === staffName) {
        updated.activeTaskCount = (s.activeTaskCount || 0) + 1;
        updated.lastAssignedTime = new Date().toISOString();
      }
      return updated;
    })
  );

  logAudit(
    "Room Status",
    "Request Assigned",
    `Assigned request "${req?.issue}" for Room ${req?.room} to ${staffName}. Type: ${assignmentType}. Reason: ${reason || "none"}.`,
    req?.room,
    dispatchers.currentUsername,
    dispatchers.setHistory
  );
};

export const completeHKRequest = (
  id: string,
  currentRequests: HousekeepingRequest[],
  dispatchers: HousekeepingDispatchers
) => {
  const req = currentRequests.find((r) => r.id === id);
  const staffName = req?.assignedStaff;

  dispatchers.setRequests((prev) =>
    prev.map((r) => (r.id === id ? { ...r, status: "Completed" } : r))
  );

  // Update workloads
  if (staffName && staffName !== "—") {
    dispatchers.setStaff((prev) =>
      prev.map((s) => {
        if (s.name === staffName) {
          return {
            ...s,
            activeTaskCount: Math.max(0, (s.activeTaskCount || 0) - 1),
            completedToday: (s.completedToday || 0) + 1,
          };
        }
        return s;
      })
    );
  }

  // Deduct stock if laundry/towel/sachets
  dispatchers.setInventory((prev) =>
    prev.map((item) => {
      if (req?.issue.toLowerCase().includes("towel") && item.name.toLowerCase().includes("bath towel")) {
        return { ...item, available: Math.max(0, item.available - 2) };
      }
      if (req?.issue.toLowerCase().includes("water") && item.name.toLowerCase().includes("water bottle")) {
        return { ...item, available: Math.max(0, item.available - 2) };
      }
      return item;
    })
  );

  logAudit("Room Status", "Request Completed", `Completed request "${req?.issue}" for Room ${req?.room}. Stock adjusted.`, req?.room, dispatchers.currentUsername, dispatchers.setHistory);
};

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

  dispatchers.setMaintenance((prev) =>
    prev.map((r) => {
      if (r.id !== id) return r;
      const history = r.assignmentHistory || [];
      const newLog = {
        timestamp: nowStr,
        action: oldEngineer && oldEngineer !== "—"
          ? `Reassigned → ${engineerName}`
          : `${assignmentType === "Auto" ? "Auto Assigned" : "Manually Assigned"} → ${engineerName}`,
        by: oldEngineer && oldEngineer !== "—" ? "Supervisor" : "System",
        reason: reason || undefined,
      };
      return {
        ...r,
        status: "Assigned",
        engineer: engineerName,
        assignedAt: nowStr,
        assignmentType,
        assignmentHistory: [...history, newLog],
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
};

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

export const addLaundryJob = (job: Omit<HKLaundryJob, "id" | "status" | "timeline">, laundryLength: number, dispatchers: HousekeepingDispatchers) => {
  const record: HKLaundryJob = {
    id: `LD-${String(laundryLength + 1).padStart(2, "0")}`,
    type: job.type,
    item: job.item,
    quantity: job.quantity,
    room: job.room,
    guestName: job.guestName,
    status: "Collection",
    charges: job.charges,
    timeline: {
      collectedAt: new Date().toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    },
    notes: job.notes,
  };
  dispatchers.setLaundryJobs((prev) => [record, ...prev]);

  // If hotel linen, deduct from available stock and add to laundry
  if (job.type === "Hotel") {
    dispatchers.setInventory((prev) =>
      prev.map((item) => {
        if (item.name === job.item) {
          return {
            ...item,
            available: Math.max(0, item.available - job.quantity),
            laundry: (item.laundry || 0) + job.quantity,
          };
        }
        return item;
      })
    );
  }

  logAudit("Laundry", "Laundry Registered", `Registered laundry job: ${job.quantity}x ${job.item}. Status: Collection.`, job.room, dispatchers.currentUsername, dispatchers.setHistory);
};

export const updateLaundryStatus = (id: string, newStatus: HKLaundryJob["status"], currentLaundryJobs: HKLaundryJob[], dispatchers: HousekeepingDispatchers) => {
  const nowStr = new Date().toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  dispatchers.setLaundryJobs((prev) =>
    prev.map((job) => {
      if (job.id !== id) return job;
      const tl = { ...job.timeline };
      if (newStatus === "Washing") tl.washedAt = nowStr;
      if (newStatus === "Ready") tl.readyAt = nowStr;
      if (newStatus === "Delivered") tl.deliveredAt = nowStr;

      return {
        ...job,
        status: newStatus,
        timeline: tl,
      };
    })
  );

  const job = currentLaundryJobs.find((j) => j.id === id);
  if (!job) return;

  // If hotel laundry job complete ("Ready" / "Delivered"), return items to stock!
  if (job.type === "Hotel" && newStatus === "Ready") {
    dispatchers.setInventory((prev) =>
      prev.map((item) => {
        if (item.name === job.item) {
          return {
            ...item,
            available: item.available + job.quantity,
            laundry: Math.max(0, (item.laundry || 0) - job.quantity),
          };
        }
        return item;
      })
    );
    logAudit("Inventory", "Linen Returned", `Returned ${job.quantity}x ${job.item} from Laundry to Available Stock.`, undefined, dispatchers.currentUsername, dispatchers.setHistory);
  }

  logAudit("Laundry", "Laundry Updated", `Laundry job #${id} (${job.item}) status updated to ${newStatus}.`, job.room, dispatchers.currentUsername, dispatchers.setHistory);
};

export const addLuggageJob = (job: Omit<HKLuggageJob, "id" | "status" | "pickupTime">, luggageJobsLength: number, dispatchers: HousekeepingDispatchers) => {
  const record: HKLuggageJob = {
    id: `LG-${String(luggageJobsLength + 1).padStart(3, "0")}`,
    guest: job.guest,
    room: job.room,
    bellBoy: job.bellBoy,
    tagNumber: job.tagNumber,
    bagCount: job.bagCount,
    type: job.type,
    status: "Pending",
    pickupTime: new Date().toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
    remarks: job.remarks,
  };
  dispatchers.setLuggageJobs((prev) => [record, ...prev]);
  logAudit("Room Status", "Luggage Tagged", `Bell Boy ${job.bellBoy} registered tag #${job.tagNumber} for guest ${job.guest}.`, job.room, dispatchers.currentUsername, dispatchers.setHistory);
};

export const deliverLuggage = (id: string, currentLuggageJobs: HKLuggageJob[], dispatchers: HousekeepingDispatchers) => {
  const nowStr = new Date().toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  dispatchers.setLuggageJobs((prev) =>
    prev.map((job) => (job.id === id ? { ...job, status: "Delivered", deliveryTime: nowStr } : job))
  );
  const job = currentLuggageJobs.find((j) => j.id === id);
  logAudit("Room Status", "Luggage Delivered", `Delivered tag #${job?.tagNumber} bags to Room ${job?.room}.`, job?.room, dispatchers.currentUsername, dispatchers.setHistory);
};

export const addDamageReport = (report: Omit<HKDamageReport, "id" | "reportedAt" | "status" | "reportedBy">, damageReportsLength: number, dispatchers: HousekeepingDispatchers) => {
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

export const updateDamageStatus = (id: string, status: HKDamageReport["status"], currentDamageReports: HKDamageReport[], dispatchers: HousekeepingDispatchers) => {
  dispatchers.setDamageReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  const report = currentDamageReports.find((r) => r.id === id);
  logAudit("Room Status", "Damage Status", `Damage report #${id} in Room ${report?.room} status set to ${status}.`, report?.room, dispatchers.currentUsername, dispatchers.setHistory);
};

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

export const restockInventoryItem = (itemId: string, qty: number, currentInventory: HKInventoryItem[], dispatchers: HousekeepingDispatchers) => {
  dispatchers.setInventory((prev) =>
    prev.map((item) => {
      if (item.id !== itemId) return item;
      return {
        ...item,
        available: item.available + qty,
      };
    })
  );
  const item = currentInventory.find((i) => i.id === itemId);
  logAudit("Inventory", "Stock Replenished", `Restocked ${qty} units of "${item?.name}".`, undefined, dispatchers.currentUsername, dispatchers.setHistory);
};

export const cleanPublicArea = (id: string, completed: boolean, currentPublicAreas: HKPublicArea[], dispatchers: HousekeepingDispatchers) => {
  const nowStr = new Date().toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  dispatchers.setPublicAreas((prev) =>
    prev.map((area) => {
      if (area.id !== id) return area;
      return {
        ...area,
        status: completed ? "Inspected" : "Cleaning",
        lastCleaned: nowStr,
      };
    })
  );
  const area = currentPublicAreas.find((a) => a.id === id);
  logAudit(
    "Cleaning",
    completed ? "Public Area Inspected" : "Public Area Cleaning",
    `Area "${area?.name}" cleaned by ${area?.assignedStaff || dispatchers.currentUsername}.`,
    "Public Area",
    dispatchers.currentUsername,
    dispatchers.setHistory
  );
};

export const startCleaningPublicArea = (id: string, currentPublicAreas: HKPublicArea[], dispatchers: HousekeepingDispatchers) => {
  dispatchers.setPublicAreas((prev) =>
    prev.map((area) => {
      if (area.id !== id) return area;
      return {
        ...area,
        status: "Cleaning",
      };
    })
  );
  const area = currentPublicAreas.find((a) => a.id === id);
  logAudit(
    "Cleaning",
    "Public Area Cleaning Started",
    `Cleaning started for "${area?.name}" by ${area?.assignedStaff || dispatchers.currentUsername}.`,
    "Public Area",
    dispatchers.currentUsername,
    dispatchers.setHistory
  );
};

export const completeCleaningPublicArea = (id: string, checkedTasks: string[], remarks: string, currentPublicAreas: HKPublicArea[], dispatchers: HousekeepingDispatchers) => {
  const nowStr = new Date().toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  dispatchers.setPublicAreas((prev) =>
    prev.map((area) => {
      if (area.id !== id) return area;
      const updatedChecklist = area.checklist.map((item) => ({
        ...item,
        completed: checkedTasks.includes(item.task),
      }));
      return {
        ...area,
        status: "Pending Inspection",
        inspectionStatus: "Pending" as const,
        checklist: updatedChecklist,
        lastCleaned: nowStr,
      };
    })
  );
  const area = currentPublicAreas.find((a) => a.id === id);
  logAudit(
    "Cleaning",
    "Public Area Cleaning Completed",
    `Cleaning completed for "${area?.name}". Checklist items: ${checkedTasks.length}/${area?.checklist.length || 0}. Remarks: ${remarks || "None"}.`,
    "Public Area",
    dispatchers.currentUsername,
    dispatchers.setHistory
  );
};

export const verifyCleaningPublicArea = (id: string, approved: boolean, remarks: string, currentPublicAreas: HKPublicArea[], dispatchers: HousekeepingDispatchers) => {
  const nowStr = new Date().toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  dispatchers.setPublicAreas((prev) =>
    prev.map((area) => {
      if (area.id !== id) return area;
      const status = approved ? ("Clean" as const) : ("Dirty" as const);
      const inspectionStatus = approved ? ("Passed" as const) : ("Failed" as const);

      // Add item to history
      const newHistoryLog = {
        id: `HPA-${String(Date.now()).slice(-6)}`,
        date: nowStr,
        housekeeper: area.assignedStaff || "Staff",
        supervisor: dispatchers.currentUsername,
        duration: area.estDuration || "30 mins",
        status: approved ? "Clean" : "Dirty",
        remarks: remarks || (approved ? "Passed Inspection" : "Failed Inspection - Reclean Required"),
      };

      return {
        ...area,
        status,
        inspectionStatus,
        history: [newHistoryLog, ...area.history],
      };
    })
  );
  const area = currentPublicAreas.find((a) => a.id === id);
  logAudit(
    "Inspection",
    approved ? "Public Area Inspection Passed" : "Public Area Inspection Failed",
    `Inspection for "${area?.name}" ${approved ? "passed" : "failed"} by supervisor ${dispatchers.currentUsername}. Remarks: ${remarks || "None"}.`,
    "Public Area",
    dispatchers.currentUsername,
    dispatchers.setHistory
  );
};

export const assignStaffPublicArea = (id: string, housekeeper: string, supervisor: string, currentPublicAreas: HKPublicArea[], dispatchers: HousekeepingDispatchers) => {
  dispatchers.setPublicAreas((prev) =>
    prev.map((area) => {
      if (area.id !== id) return area;
      return {
        ...area,
        assignedStaff: housekeeper,
        supervisor: supervisor,
        status: area.status === "Dirty" ? ("Assigned" as const) : area.status,
      };
    })
  );
  const area = currentPublicAreas.find((a) => a.id === id);
  logAudit(
    "Room Status",
    "Public Area Staff Assigned",
    `Assigned housekeeper ${housekeeper} and supervisor ${supervisor} to "${area?.name}".`,
    "Public Area",
    dispatchers.currentUsername,
    dispatchers.setHistory
  );
};

export const blockPublicArea = (id: string, blocked: boolean, currentPublicAreas: HKPublicArea[], dispatchers: HousekeepingDispatchers) => {
  dispatchers.setPublicAreas((prev) =>
    prev.map((area) => {
      if (area.id !== id) return area;
      return {
        ...area,
        status: blocked ? ("Blocked" as const) : ("Dirty" as const),
      };
    })
  );
  const area = currentPublicAreas.find((a) => a.id === id);
  logAudit(
    "Room Status",
    blocked ? "Public Area Blocked" : "Public Area Unblocked",
    `Area "${area?.name}" has been ${blocked ? "blocked" : "unblocked"}.`,
    "Public Area",
    dispatchers.currentUsername,
    dispatchers.setHistory
  );
};

export const configurePublicAreaChecklist = (category: string, items: string[], estDuration: string | undefined, frequency: string | undefined, dispatchers: HousekeepingDispatchers) => {
  dispatchers.setPublicAreas((prev) =>
    prev.map((area) => {
      if (area.category !== category) return area;
      // Keep completed items if they match the task, otherwise create new
      const updatedChecklist = items.map((task) => {
        const existing = area.checklist.find((item) => item.task === task);
        return {
          task,
          completed: existing ? existing.completed : false,
        };
      });
      return {
        ...area,
        checklist: updatedChecklist,
        estDuration: estDuration !== undefined ? estDuration : area.estDuration,
        cleaningFrequency: frequency !== undefined ? frequency : area.cleaningFrequency,
      };
    })
  );
  // Also update checklist templates if they exist in checklists
  dispatchers.setChecklists((prev) =>
    prev.map((t) => {
      if (t.type === "Public-Area" && t.name.toLowerCase().includes(category.toLowerCase())) {
        return { ...t, items };
      }
      return t;
    })
  );
  logAudit(
    "Room Status",
    "Public Area Checklist Configured",
    `Checklist template for category "${category}" updated with ${items.length} tasks.`,
    "Public Area",
    dispatchers.currentUsername,
    dispatchers.setHistory
  );
};

export const addPublicArea = (areaData: Omit<HKPublicArea, "id" | "checklist" | "history">, dispatchers: HousekeepingDispatchers) => {
  const newId = `PA-${String(Date.now()).slice(-4)}`;

  // Generate default checklist based on category
  let defaultTasks: string[] = [];
  switch (areaData.category) {
    case "Lobby":
      defaultTasks = ["Sweep, vacuum, and mop floor surfaces", "Wipe and sanitize reception desk/counters", "Clean glass panels and doors", "Empty trash bins and sanitize handles", "Wipe lift buttons and grab rails", "Sofa cleaned and vacuumed", "Check plants and water them"];
      break;
    case "Restaurant":
      defaultTasks = ["Tables Sanitized", "Chairs Cleaned", "Counter Cleaned", "Floor Mopped", "Wash Area Cleaned", "Dustbins Cleared & Disinfected"];
      break;
    case "Gym":
      defaultTasks = ["Equipment Sanitized", "Mirrors Cleaned", "Towels Restocked", "Floor Cleaned & Sanitized", "Water Station Replenished"];
      break;
    case "Pool":
      defaultTasks = ["Water pH Level Check", "Pool Deck Cleared", "Sun Loungers Sanitized", "Fresh Towels Restocked", "Trash Bins Cleared", "Shower Area Cleaned"];
      break;
    case "Corridor":
      defaultTasks = ["Carpet Vacuumed", "Handrails Sanitized", "Lighting Checked & Bulbs Inspected", "Room Doors Wiped", "Fire Extinguishers Checked"];
      break;
    case "Parking":
      defaultTasks = ["Sweeping floor surfaces", "Trash Cans Cleared & Bags Replaced", "Signages Wiped & Inspected", "Light Fixtures Inspected", "Oil Spills Sprinkled with Absorbent"];
      break;
    case "Spa":
      defaultTasks = ["Massage Beds Sanitized", "Clean Towels Restocked", "Sauna Sanitized & Disinfected", "Floor Disinfected & Dried", "Aroma Oils & Amenities Restocked"];
      break;
    case "Banquet Hall":
      defaultTasks = ["Carpet Vacuumed", "Stage Area Cleared", "Chairs Arranged & Cleaned", "AV Console Wiped", "Trash Bins Emptied"];
      break;
    case "Washroom":
    case "Restroom":
      defaultTasks = ["Toilets Sanitized & Disinfected", "Mirrors Wiped & Polished", "Hand Wash Soap Restocked", "Hand Towels Restocked", "Floors Mopped with Disinfectant", "Air Freshener Spray Checked"];
      break;
    default:
      defaultTasks = ["Sweep & mop floor", "Sanitize surfaces", "Empty trash bins"];
  }

  const newArea: HKPublicArea = {
    ...areaData,
    id: newId,
    checklist: defaultTasks.map((t) => ({ task: t, completed: false })),
    history: [],
  };

  dispatchers.setPublicAreas((prev) => [...prev, newArea]);
  logAudit(
    "Room Status",
    "Public Area Created",
    `New public area "${areaData.name}" created under category "${areaData.category}".`,
    "Public Area",
    dispatchers.currentUsername,
    dispatchers.setHistory
  );
};

export const updatePublicArea = (id: string, updatedFields: Partial<HKPublicArea>, currentPublicAreas: HKPublicArea[], dispatchers: HousekeepingDispatchers) => {
  dispatchers.setPublicAreas((prev) =>
    prev.map((area) => {
      if (area.id !== id) return area;
      return {
        ...area,
        ...updatedFields,
      };
    })
  );
  const area = currentPublicAreas.find((a) => a.id === id);
  logAudit(
    "Room Status",
    "Public Area Updated",
    `Public area "${area?.name}" details updated.`,
    "Public Area",
    dispatchers.currentUsername,
    dispatchers.setHistory
  );
};

export const deletePublicArea = (id: string, currentPublicAreas: HKPublicArea[], dispatchers: HousekeepingDispatchers) => {
  const area = currentPublicAreas.find((a) => a.id === id);
  dispatchers.setPublicAreas((prev) => prev.filter((a) => a.id !== id));
  logAudit(
    "Room Status",
    "Public Area Deleted",
    `Public area "${area?.name}" deleted.`,
    "Public Area",
    dispatchers.currentUsername,
    dispatchers.setHistory
  );
};

export const setRole = (role: string, dispatchers: HousekeepingDispatchers) => {
  dispatchers.setCurrentUserRole(role);
  const name =
    role === "Housekeeper"
      ? "Meena Kumari"
      : role === "Supervisor"
        ? "Ramesh Kumar"
        : role === "Laundry Staff"
          ? "Somnath Sen"
          : role === "Engineering Staff"
            ? "Suresh Gupta"
            : "Admin User";
  dispatchers.setCurrentUsername(name);
  localStorage.setItem("hk_role", role);
  logAudit("Room Status", "Role Switched", `Switched active user profile to ${role} (${name}).`, undefined, name, dispatchers.setHistory);
};

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
