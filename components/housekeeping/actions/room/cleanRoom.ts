import { logAudit } from "../common/audit";
import type { HousekeepingDispatchers } from "../../HousekeepingActions";
import { hkRoomService } from "@/services/housekeeping";
import { matchesRoomKey, roomApiId, roomDisplayNo } from "../../roomUtils";
import { syncTaskForRoom } from "./taskSync";
import type { HKRoom } from "../../HousekeepingTypes";

function patchRoom(
  prev: HKRoom[],
  roomKey: string,
  patch: Partial<HKRoom>,
): HKRoom[] {
  return prev.map((r) => (matchesRoomKey(r, roomKey) ? { ...r, ...patch } : r));
}

function resolveApiId(prev: HKRoom[], roomKey: string): string {
  const match = prev.find((r) => matchesRoomKey(r, roomKey));
  return match ? roomApiId(match) : roomKey;
}

export const startCleaning = (
  roomKey: string,
  housekeeper: string,
  dispatchers: HousekeepingDispatchers,
) => {
  let apiId = roomKey;
  let roomsSnapshot: HKRoom[] = [];

  dispatchers.setRooms((prev) => {
    roomsSnapshot = prev;
    apiId = resolveApiId(prev, roomKey);
    const label = roomDisplayNo(prev.find((r) => matchesRoomKey(r, roomKey)) ?? { roomNo: roomKey });
    logAudit(
      "Cleaning",
      "Started Cleaning",
      `Housekeeper ${housekeeper} started cleaning room ${label}.`,
      label,
      dispatchers.currentUsername,
      dispatchers.setHistory,
    );
    return patchRoom(prev, roomKey, {
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
    });
  });

  void syncTaskForRoom(roomsSnapshot, roomKey, "assign-start", {
    staff: housekeeper,
  });

  void hkRoomService.startClean(apiId, housekeeper).catch((err) => {
    console.error(`[HK] Failed to sync startClean for room ${roomKey} to API`, err);
  });
};

export const pauseCleaning = (roomKey: string, dispatchers: HousekeepingDispatchers) => {
  let apiId = roomKey;
  dispatchers.setRooms((prev) => {
    apiId = resolveApiId(prev, roomKey);
    const label = roomDisplayNo(prev.find((r) => matchesRoomKey(r, roomKey)) ?? { roomNo: roomKey });
    logAudit(
      "Cleaning",
      "Paused Cleaning",
      `Cleaning paused for room ${label}.`,
      label,
      dispatchers.currentUsername,
      dispatchers.setHistory,
    );
    return prev.map((r) => {
      if (!matchesRoomKey(r, roomKey) || !r.cleaningTimer) return r;
      return {
        ...r,
        cleaningTimer: {
          ...r.cleaningTimer,
          paused: true,
          lastTick: new Date().toISOString(),
        },
      };
    });
  });

  void hkRoomService.pauseClean(apiId, true).catch((err) => {
    console.error(`[HK] Failed to sync pauseClean for room ${roomKey} to API`, err);
  });
};

export const resumeCleaning = (roomKey: string, dispatchers: HousekeepingDispatchers) => {
  let apiId = roomKey;
  dispatchers.setRooms((prev) => {
    apiId = resolveApiId(prev, roomKey);
    const label = roomDisplayNo(prev.find((r) => matchesRoomKey(r, roomKey)) ?? { roomNo: roomKey });
    logAudit(
      "Cleaning",
      "Resumed Cleaning",
      `Cleaning resumed for room ${label}.`,
      label,
      dispatchers.currentUsername,
      dispatchers.setHistory,
    );
    return prev.map((r) => {
      if (!matchesRoomKey(r, roomKey) || !r.cleaningTimer) return r;
      return {
        ...r,
        cleaningTimer: {
          ...r.cleaningTimer,
          paused: false,
          lastTick: new Date().toISOString(),
        },
      };
    });
  });

  void hkRoomService.pauseClean(apiId, false).catch((err) => {
    console.error(`[HK] Failed to sync resumeClean for room ${roomKey} to API`, err);
  });
};

export const completeCleaning = (
  roomKey: string,
  progressItems: string[],
  dispatchers: HousekeepingDispatchers,
  photos?: string[],
) => {
  let apiId = roomKey;
  let roomsSnapshot: HKRoom[] = [];
  const notes = `Items checked: ${progressItems.length}`;

  dispatchers.setRooms((prev) => {
    roomsSnapshot = prev;
    apiId = resolveApiId(prev, roomKey);
    const label = roomDisplayNo(prev.find((r) => matchesRoomKey(r, roomKey)) ?? { roomNo: roomKey });
    logAudit(
      "Cleaning",
      "Finished Cleaning",
      `Room cleaning complete. Awaiting supervisor inspection. Items checked: ${progressItems.length}. Soap & shampoo stock decremented by 1, water bottles by 2.`,
      label,
      dispatchers.currentUsername,
      dispatchers.setHistory,
    );
    return patchRoom(prev, roomKey, {
      status: "Inspection Pending",
      hkStatus: "Dirty",
      cleaningProgress: 100,
      cleaningTimer: undefined,
      photos: photos && photos.length > 0 ? photos : prev.find((r) => matchesRoomKey(r, roomKey))?.photos,
    });
  });

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
    }),
  );

  void syncTaskForRoom(roomsSnapshot, roomKey, "complete", { notes });

  void hkRoomService
    .completeClean(apiId, {
      photos,
      remarks: notes,
    })
    .catch((err) => {
      console.error(`[HK] Failed to sync completeClean for room ${roomKey} to API`, err);
    });
};
