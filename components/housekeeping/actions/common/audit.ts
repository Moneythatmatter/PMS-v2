import React from "react";
import type { HKHistoryLog } from "../../HousekeepingTypes";

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
