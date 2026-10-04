import { logAudit } from "../common/audit";
import type { HousekeepingDispatchers } from "../../HousekeepingActions";
import { hkRoomService } from "@/services/housekeeping";
import { matchesRoomKey, roomApiId, roomDisplayNo } from "../../roomUtils";
import { syncTaskForRoom } from "./taskSync";

export const inspectRoom = async (
  roomKey: string,
  passed: boolean,
  signature: string,
  remarks: string,
  qualityScore: number,
  dispatchers: HousekeepingDispatchers,
): Promise<void> => {
  const currentRooms = dispatchers.rooms;
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
    result: passed ? ("Passed" as const) : ("Rejected" as const),
    qualityScore,
    remarks: remarks || (passed ? "Passed inspection" : "Failed inspection"),
    signature,
  };

  const match = currentRooms.find((r) => matchesRoomKey(r, roomKey));
  const apiId = match ? roomApiId(match) : roomKey;
  const label = match ? roomDisplayNo(match) : roomKey;

  dispatchers.setRooms((prev) => {
    return prev.map((r) => {
      if (!matchesRoomKey(r, roomKey)) return r;
      const historyList = r.inspectionHistory || [];
      const updatedHistory = [newHistoryRecord, ...historyList];

      if (passed) {
        const hasReservation = Boolean(r.guestName) && r.foStatus !== "Occupied";
        const nextStatus = hasReservation ? "Reserved" : "Vacant";
        return {
          ...r,
          status: nextStatus,
          hkStatus: "Inspected",
          foStatus: "Vacant",
          assignedSupervisor: dispatchers.currentUsername,
          remarks: remarks || "Inspection passed.",
          inspectionHistory: updatedHistory,
        };
      }
      return {
        ...r,
        status: "Dirty" as const,
        hkStatus: "Dirty" as const,
        remarks: remarks || "Inspection failed. Requires reclean.",
        inspectionHistory: updatedHistory,
      };
    });
  });

  const taskSync = passed
    ? syncTaskForRoom(currentRooms, roomKey, "approve", {
        approvedBy: dispatchers.currentUsername,
      })
    : syncTaskForRoom(currentRooms, roomKey, "reject", { notes: remarks });

  if (passed) {
    logAudit(
      "Inspection",
      "Inspection Passed",
      `Supervisor ${dispatchers.currentUsername} approved room ${label}. Quality Score: ${qualityScore}%. Signature: ${signature || "Signed"}. Remarks: ${remarks || "None"}. Room is now ready for sale.`,
      label,
      dispatchers.currentUsername,
      dispatchers.setHistory,
    );
  } else {
    logAudit(
      "Inspection",
      "Inspection Rejected",
      `Supervisor ${dispatchers.currentUsername} rejected room ${label}. Quality Score: ${qualityScore}%. Return to housekeeper queue. Remarks: ${remarks}`,
      label,
      dispatchers.currentUsername,
      dispatchers.setHistory,
    );
  }

  const inspectCall = hkRoomService.inspect(apiId, {
    result: passed ? "Passed" : "Rejected",
    qualityScore,
    remarks: remarks || (passed ? "Passed inspection" : "Failed inspection"),
    inspector: dispatchers.currentUsername,
    signature,
  });

  const [, inspectResult] = await Promise.allSettled([taskSync, inspectCall]);
  if (inspectResult.status === "rejected") {
    console.error(`[HK] Failed to sync inspectRoom for room ${roomKey} to API`, inspectResult.reason);
    throw inspectResult.reason;
  }
};
