import { hkTaskService } from "@/services/housekeeping";
import type { HKRoom } from "../../HousekeepingTypes";
import { matchesRoomKey } from "../../roomUtils";

/** Best-effort sync with housekeeping_tasks — ignores 404 when no task exists. */
export async function syncTaskForRoom(
  rooms: HKRoom[],
  roomKey: string,
  action: "assign-start" | "complete" | "approve" | "reject",
  meta?: { staff?: string; notes?: string; approvedBy?: string },
): Promise<void> {
  const match = rooms.find((r) => matchesRoomKey(r, roomKey));
  const roomId = match?.roomId ?? match?.roomRefId ?? match?.roomNo ?? roomKey;

  try {
    let task = await hkTaskService.getActiveForRoom(roomId);

    if (action === "assign-start") {
      if (task.status === "PENDING" && meta?.staff) {
        task = await hkTaskService.assign(task.id, meta.staff);
      }
      if (task.status === "PENDING" || task.status === "ASSIGNED") {
        await hkTaskService.start(task.id);
      }
      return;
    }

    if (action === "complete" && task.status === "IN_PROGRESS") {
      await hkTaskService.complete(task.id, { notes: meta?.notes });
      return;
    }

    if (action === "approve" && task.status === "COMPLETED") {
      await hkTaskService.approve(task.id, {
        approvedBy: meta?.approvedBy ?? meta?.staff,
      });
      return;
    }

    if (action === "reject" && task.status === "COMPLETED") {
      await hkTaskService.cancel(task.id, {
        notes: meta?.notes ?? "Inspection rejected — reclean required",
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!/404|not found|No active task/i.test(msg)) {
      console.error(`[HK] Task sync failed for room ${roomKey}`, err);
    }
  }
}
