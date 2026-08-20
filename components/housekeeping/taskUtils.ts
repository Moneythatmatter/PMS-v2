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

/** User-facing task status — PENDING/ASSIGNED both mean work not started yet. */
export function formatTaskStatusLabel(status?: string): string {
  switch (String(status ?? "").toUpperCase()) {
    case "PENDING":
    case "ASSIGNED":
      return "Pending";
    case "IN_PROGRESS":
      return "In Progress";
    case "COMPLETED":
      return "Awaiting Inspection";
    case "APPROVED":
      return "Approved";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status
        ? status
            .split("_")
            .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
            .join(" ")
        : "Pending";
  }
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

export function findTaskForRoom(tasks: HKTask[], room: HKRoom): HKTask | undefined {
  if (room.activeTaskId) {
    const byId = tasks.find((t) => t.id === room.activeTaskId);
    if (byId) return byId;
  }
  return tasks.find((t) => roomMatchesTask(room, t));
}

export function taskPriorityLabel(
  priority?: string,
): "Critical" | "High" | "Medium" | "Low" {
  switch (String(priority ?? "").toUpperCase()) {
    case "CRITICAL":
      return "Critical";
    case "HIGH":
      return "High";
    case "LOW":
      return "Low";
    default:
      return "Medium";
  }
}

export function formatTaskTimestamp(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "—";
  }
}

function isTodayTimestamp(value?: string): boolean {
  if (!value) return false;
  try {
    return new Date(value).toDateString() === new Date().toDateString();
  } catch {
    return false;
  }
}

export type InspectionQueueStatus = "awaiting" | "cleaning" | "passed" | "failed";

export interface InspectionQueueItem {
  key: string;
  room: HKRoom;
  task: HKTask | null;
  queueStatus: InspectionQueueStatus;
  completedAt?: string;
  priority: "Critical" | "High" | "Medium" | "Low";
}

/** Build supervisor inspection queue — task + today's inspection history only (not static hk_rooms status). */
export function buildInspectionQueue(
  rooms: HKRoom[],
  tasks: HKTask[],
  history: { category?: string; action?: string; room?: string; timestamp?: string }[],
): InspectionQueueItem[] {
  const merged = mergeTasksIntoRooms(rooms, tasks);
  const items: InspectionQueueItem[] = [];
  const seen = new Set<string>();

  const push = (room: HKRoom, task: HKTask | null, queueStatus: InspectionQueueStatus) => {
    const key = room.roomNo || task?.id || room.id || "";
    if (!key || seen.has(key)) return;
    seen.add(key);
    items.push({
      key,
      room,
      task,
      queueStatus,
      completedAt: task?.completedAt ?? undefined,
      priority: task ? taskPriorityLabel(task.priority) : "Medium",
    });
  };

  const roomForTask = (task: HKTask): HKRoom =>
    merged.find((r) => roomMatchesTask(r, task)) ??
    ({
      roomNo: task.roomNo ?? task.roomId,
      roomId: task.roomId,
      category: "Standard",
      type: "Standard",
      status: taskToRoomStatus(task),
    } as HKRoom);

  for (const task of tasks) {
    if (task.status === "COMPLETED") {
      push(roomForTask(task), task, "awaiting");
    } else if (task.status === "IN_PROGRESS") {
      push(roomForTask(task), task, "cleaning");
    } else if (task.status === "APPROVED" && isTodayTimestamp(task.approvedAt ?? undefined)) {
      push(roomForTask(task), task, "passed");
    }
  }

  for (const entry of history) {
    if (entry.category !== "Inspection") continue;
    if (!isTodayTimestamp(entry.timestamp)) continue;
    const room = merged.find((r) => r.roomNo === entry.room);
    if (!room) continue;
    const task = findTaskForRoom(tasks, room) ?? null;
    if (/reject/i.test(String(entry.action ?? ""))) {
      push(room, task, "failed");
    } else if (/pass/i.test(String(entry.action ?? ""))) {
      push(room, task, "passed");
    }
  }

  const weight = { awaiting: 4, cleaning: 3, failed: 2, passed: 1 };
  return items.sort(
    (a, b) => (weight[b.queueStatus] - weight[a.queueStatus]) || a.key.localeCompare(b.key),
  );
}

export function inspectionStats(
  tasks: HKTask[],
  history: {
    category?: string;
    action?: string;
    timestamp?: string;
    details?: string;
  }[],
) {
  const pending = tasks.filter((t) => t.status === "COMPLETED").length;
  const passedEntries = history.filter(
    (h) =>
      h.category === "Inspection" &&
      /pass/i.test(String(h.action ?? "")) &&
      isTodayTimestamp(h.timestamp),
  );
  const failedEntries = history.filter(
    (h) =>
      h.category === "Inspection" &&
      /reject/i.test(String(h.action ?? "")) &&
      isTodayTimestamp(h.timestamp),
  );

  const qualityScores: number[] = [];
  for (const entry of [...passedEntries, ...failedEntries]) {
    const match = String(entry.details ?? "").match(/Quality Score:\s*(\d+)/i);
    if (match) qualityScores.push(Number(match[1]));
  }

  const inspectionDurations: number[] = [];
  for (const task of tasks) {
    if (
      task.status === "APPROVED" &&
      task.completedAt &&
      task.approvedAt &&
      isTodayTimestamp(task.approvedAt)
    ) {
      const mins =
        (new Date(task.approvedAt).getTime() - new Date(task.completedAt).getTime()) / 60000;
      if (mins > 0 && mins < 240) inspectionDurations.push(mins);
    }
  }

  const avgQualityScore = qualityScores.length
    ? Math.round(qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length)
    : null;
  const avgInspectionMins = inspectionDurations.length
    ? Math.round(
        inspectionDurations.reduce((sum, mins) => sum + mins, 0) / inspectionDurations.length,
      )
    : null;

  return {
    pending,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    passed: passedEntries.length,
    failed: failedEntries.length,
    avgQualityScore,
    avgInspectionMins,
  };
}
