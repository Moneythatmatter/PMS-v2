import { logAudit } from "../common/audit";
import type { HousekeepingDispatchers } from "../../HousekeepingActions";
import { hkRoomService } from "@/services/housekeeping";
import { matchesRoomKey, roomApiId, roomDisplayNo } from "../../roomUtils";
import { syncTaskForRoom } from "./taskSync";
import type { HKRoom } from "../../HousekeepingTypes";

export const inspectRoom = (
  roomKey: string,
  passed: boolean,
  signature: string,
  remarks: string,
  qualityScore: number,
  dispatchers: HousekeepingDispatchers,
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
    result: passed ? ("Passed" as const) : ("Rejected" as const),
    qualityScore,
    remarks: remarks || (passed ? "Passed inspection" : "Failed inspection"),
    signature,
  };

  let apiId = roomKey;
  let label = roomKey;
  let roomsSnapshot: HKRoom[] = [];

  dispatchers.setRooms((prev) => {
    roomsSnapshot = prev;
    const match = prev.find((r) => matchesRoomKey(r, roomKey));
    apiId = match ? roomApiId(match) : roomKey;
    label = match ? roomDisplayNo(match) : roomKey;

    return prev.map((r) => {
      if (!matchesRoomKey(r, roomKey)) return r;
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
      }
      return {
        ...r,
        status: "Vacant Dirty" as const,
        hkStatus: "Dirty" as const,
        remarks: remarks || "Inspection failed. Requires reclean.",
        inspectionHistory: updatedHistory,
      };
    });
  });

  if (passed) {
    void syncTaskForRoom(roomsSnapshot, roomKey, "approve", {
      approvedBy: dispatchers.currentUsername,
    });
    logAudit(
      "Inspection",
      "Inspection Passed",
      `Supervisor ${dispatchers.currentUsername} approved room ${label}. Quality Score: ${qualityScore}%. Signature: ${signature || "Signed"}. Remarks: ${remarks || "None"}. Room is now Vacant Ready.`,
      label,
      dispatchers.currentUsername,
      dispatchers.setHistory,
    );
  } else {
    void syncTaskForRoom(roomsSnapshot, roomKey, "reject", { notes: remarks });
    logAudit(
      "Inspection",
      "Inspection Rejected",
      `Supervisor ${dispatchers.currentUsername} rejected room ${label}. Quality Score: ${qualityScore}%. Return to housekeeper queue. Remarks: ${remarks}`,
      label,
      dispatchers.currentUsername,
      dispatchers.setHistory,
    );
  }

  void hkRoomService
    .inspect(apiId, {
      result: passed ? "Passed" : "Rejected",
      qualityScore,
      remarks: remarks || (passed ? "Passed inspection" : "Failed inspection"),
      inspector: dispatchers.currentUsername,
      signature,
    })
    .catch((err) => {
      console.error(`[HK] Failed to sync inspectRoom for room ${roomKey} to API`, err);
    });
};
