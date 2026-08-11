import { logAudit } from "../common/audit";
import type { HousekeepingDispatchers } from "../../HousekeepingActions";
import { hkRoomService } from "@/services/housekeeping";

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
    result: passed ? ("Passed" as const) : ("Rejected" as const),
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

  void hkRoomService.inspect(roomNo, {
    result: passed ? "Passed" : "Rejected",
    qualityScore,
    remarks: remarks || (passed ? "Passed inspection" : "Failed inspection"),
    inspector: dispatchers.currentUsername,
    signature,
  }).catch((err) => {
    console.error(`[HK] Failed to sync inspectRoom for room ${roomNo} to API`, err);
  });
};

