import type { HKStaff } from "../../HousekeepingTypes";

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
