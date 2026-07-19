import { logAudit } from "../common/audit";
import type { HousekeepingDispatchers } from "../../HousekeepingActions";

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
