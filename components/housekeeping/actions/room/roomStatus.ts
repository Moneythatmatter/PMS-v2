import { logAudit } from "../common/audit";
import type { HousekeepingDispatchers } from "../../HousekeepingActions";
import type { HKRoom, HKPublicArea, HousekeepingRequest } from "../../HousekeepingTypes";
import { hkRoomService, hkGuestRequestService } from "@/services/housekeeping";

export const changeRoomStatus = (roomNo: string, status: HKRoom["status"], dispatchers: HousekeepingDispatchers) => {
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

  dispatchers.setRooms((prev) =>
    prev.map((r) => {
      if (r.roomNo !== roomNo) return r;
      return {
        ...r,
        status,
        hkStatus: hkSt,
        foStatus: foSt,
      };
    })
  );
  logAudit("Room Status", "Status Override", `Overwrote status of Room ${roomNo} to ${status}.`, roomNo, dispatchers.currentUsername, dispatchers.setHistory);

  void hkRoomService.update(roomNo, {
    status,
    hkStatus: hkSt,
    foStatus: foSt,
  }).catch((err) => {
    console.error(`[HK] Failed to sync changeRoomStatus for room ${roomNo} to API`, err);
  });
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
  const isoStr = new Date().toISOString();
  const labelStr = new Date().toLocaleString("en-IN", {
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
    createdAt: isoStr,
    createdAtLabel: labelStr,
    assignmentType: req.assignmentType,
    assignmentHistory: req.assignedStaff && req.assignedStaff !== "—" ? [
      {
        timestamp: labelStr,
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

  void hkGuestRequestService.create(record).catch((err) => {
    console.error("[HK] Failed to sync new HK request to API", err);
  });
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
  const history = req?.assignmentHistory || [];
  const newLog = {
    timestamp: nowStr,
    action: oldStaff && oldStaff !== "—"
      ? `Reassigned → ${staffName}`
      : `${assignmentType === "Auto" ? "Auto Assigned" : "Manually Assigned"} → ${staffName}`,
    by: oldStaff && oldStaff !== "—" ? "Supervisor" : "System",
    reason: reason || undefined,
  };
  const updatedHistory = [...history, newLog];

  dispatchers.setRequests((prev) =>
    prev.map((r) => {
      if (r.id !== id) return r;
      return {
        ...r,
        status: "In Progress",
        assignedStaff: staffName,
        assignmentType,
        assignmentHistory: updatedHistory,
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

  void hkGuestRequestService.update(id, {
    status: "In Progress",
    assignedStaff: staffName,
    assignmentType,
    assignmentHistory: updatedHistory,
  }).catch((err) => {
    console.error("[HK] Failed to sync assign HK request to API", err);
  });
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

  void hkGuestRequestService.update(id, { status: "Completed" }).catch((err) => {
    console.error("[HK] Failed to sync complete HK request to API", err);
  });
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
