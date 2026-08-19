import type { HKRoom, HKTask } from "./HousekeepingTypes";

const ACTIVE_TASK_STATUSES = new Set([
  "PENDING",
  "ASSIGNED",
  "IN_PROGRESS",
  "COMPLETED",
]);

export function isActiveTask(task: HKTask): boolean {
  return ACTIVE_TASK_STATUSES.has(task.status);
}

/** Map housekeeping_tasks.status → room cleaning queue label. */
export function taskToRoomStatus(task: HKTask): HKRoom["status"] {
  switch (task.status) {
    case "IN_PROGRESS":
      return "Cleaning";
    case "COMPLETED":
      return "Inspection Pending";
    case "PENDING":
    case "ASSIGNED":
    default:
      return "Vacant Dirty";
  }
}

function roomMatchesTask(room: HKRoom, task: HKTask): boolean {
  const roomKeys = [room.id, room.roomId, room.roomNo, room.roomRefId].filter(Boolean);
  const taskKeys = [task.roomId, task.roomNo].filter(Boolean);
  return roomKeys.some((k) => taskKeys.some((t) => String(k) === String(t)));
}

/** Overlay active tasks onto hk_rooms; add cards for tasks with no hk_rooms row yet. */
export function mergeTasksIntoRooms(rooms: HKRoom[], tasks: HKTask[]): HKRoom[] {
  const activeTasks = tasks.filter(isActiveTask);
  if (!activeTasks.length) return rooms;

  const merged = rooms.map((room) => {
    const task = activeTasks.find((t) => roomMatchesTask(room, t));
    if (!task) return room;
    return {
      ...room,
      status: taskToRoomStatus(task),
      assignedStaff: task.assignedToName ?? task.assignedTo ?? room.assignedStaff,
      remarks: task.notes ?? room.remarks,
      activeTaskId: task.id,
      activeTaskNumber: task.taskNumber,
      activeTaskType: task.taskType,
    };
  });

  for (const task of activeTasks) {
    if (merged.some((r) => roomMatchesTask(r, task))) continue;
    merged.push({
      id: undefined,
      roomId: task.roomId,
      roomRefId: task.roomId,
      roomNo: task.roomNo ?? task.roomId,
      category: "Standard",
      type: "Standard",
      bedType: "King",
      floor: "",
      wing: "",
      maxOccupancy: 2,
      cleaningFrequency: "Daily",
      deepCleaningFrequency: "Every 30 Days",
      lastDeepCleaned: "",
      status: taskToRoomStatus(task),
      hkStatus: task.status === "IN_PROGRESS" ? "Cleaning" : "Dirty",
      foStatus: "Vacant",
      dnd: false,
      sleepOut: false,
      facilities: [],
      remarks: task.notes ?? "",
      assignedStaff: task.assignedToName ?? task.assignedTo ?? undefined,
      activeTaskId: task.id,
      activeTaskNumber: task.taskNumber,
      activeTaskType: task.taskType,
    });
  }

  return merged.sort((a, b) => a.roomNo.localeCompare(b.roomNo));
}

export function formatTaskTypeLabel(type?: string): string {
  if (!type) return "Cleaning";
  return type
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export function formatTaskStatusLabel(status?: string): string {
  if (!status) return "Pending";
  return status
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export function taskStatusTone(
  status: string,
): "slate" | "amber" | "blue" | "emerald" | "red" {
  switch (status) {
    case "IN_PROGRESS":
      return "amber";
    case "COMPLETED":
      return "blue";
    case "APPROVED":
      return "emerald";
    case "CANCELLED":
      return "red";
    case "ASSIGNED":
    case "PENDING":
    default:
      return "slate";
  }
}
