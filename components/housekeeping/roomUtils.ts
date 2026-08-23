import type { HKRoom } from "./HousekeepingTypes";

export type HkRoomStatusEnum =
  | "CLEAN"
  | "DIRTY"
  | "INSPECTING"
  | "INSPECTED"
  | "OUT_OF_SERVICE";

const HK_ENUMS: HkRoomStatusEnum[] = [
  "CLEAN",
  "DIRTY",
  "INSPECTING",
  "INSPECTED",
  "OUT_OF_SERVICE",
];

function isHkEnum(value: string): value is HkRoomStatusEnum {
  return (HK_ENUMS as string[]).includes(value);
}

/** Map Front Office room status labels to hk_rooms enum for API writes. */
export function foStatusToHkEnum(status: string): HkRoomStatusEnum {
  switch (status.trim()) {
    case "Vacant":
    case "Clean":
      return "INSPECTED";
    case "Dirty":
      return "DIRTY";
    case "Maintenance":
      return "INSPECTING";
    case "Blocked":
      return "OUT_OF_SERVICE";
    default:
      return "DIRTY";
  }
}

/** Map housekeeping dropdown values to hk_rooms enum. */
export function hkHousekeepingToHkEnum(value: string): HkRoomStatusEnum {
  switch (value.trim()) {
    case "Dirty":
      return "DIRTY";
    case "In Progress":
      return "INSPECTING";
    case "Clean":
    case "Inspected":
    default:
      return "CLEAN";
  }
}

/** Map legacy UI status labels to DB enum for API writes. */
export function uiStatusToHkEnum(status: HKRoom["status"]): HkRoomStatusEnum {
  switch (status) {
    case "Vacant Ready":
      return "INSPECTED";
    case "Vacant Dirty":
    case "Occupied Dirty":
      return "DIRTY";
    case "Cleaning":
    case "Inspection Pending":
      return "INSPECTING";
    case "Out of Order":
    case "Out of Service":
    case "Blocked":
      return "OUT_OF_SERVICE";
    case "Occupied":
      return "CLEAN";
    default:
      return "DIRTY";
  }
}

/** Map DB enum (+ timestamps) to legacy UI status fields. */
export function hkEnumToUiFields(row: {
  status?: string;
  lastCleanedAt?: string | null;
}): Pick<HKRoom, "status" | "hkStatus" | "foStatus"> {
  const raw = String(row.status ?? "DIRTY").trim().toUpperCase();
  const enumStatus: HkRoomStatusEnum = isHkEnum(raw) ? raw : "DIRTY";

  switch (enumStatus) {
    case "CLEAN":
      return { status: "Vacant Ready", hkStatus: "Clean", foStatus: "Vacant" };
    case "DIRTY":
      return { status: "Vacant Dirty", hkStatus: "Dirty", foStatus: "Vacant" };
    case "INSPECTING":
      if (row.lastCleanedAt) {
        return {
          status: "Inspection Pending",
          hkStatus: "Cleaning",
          foStatus: "Vacant",
        };
      }
      return { status: "Cleaning", hkStatus: "Cleaning", foStatus: "Vacant" };
    case "INSPECTED":
      return {
        status: "Vacant Ready",
        hkStatus: "Inspected",
        foStatus: "Vacant",
      };
    case "OUT_OF_SERVICE":
      return {
        status: "Out of Service",
        hkStatus: "OOS",
        foStatus: "Blocked",
      };
    default:
      return { status: "Vacant Dirty", hkStatus: "Dirty", foStatus: "Vacant" };
  }
}

/** Match a room by its primary key (`id`), FO room id, or display number (`roomNo`). */
export function matchesRoomKey(room: HKRoom, key: string): boolean {
  if (!key) return false;
  return (
    room.id === key ||
    room.roomId === key ||
    room.roomNo === key ||
    room.roomRefId === key
  );
}

/** API path segment — always prefer the hk_rooms record id. */
export function roomApiId(room: Pick<HKRoom, "id" | "roomNo">): string {
  return String(room.id ?? room.roomNo);
}

/** Stable key for lists / selection (always defined after normalizeHkRoom). */
export function roomKey(room: Pick<HKRoom, "id" | "roomNo">): string {
  return roomApiId(room);
}

export function findRoomByKey(rooms: HKRoom[], key: string): HKRoom | undefined {
  return rooms.find((r) => matchesRoomKey(r, key));
}

export function roomDisplayNo(room: Pick<HKRoom, "roomNo">): string {
  return room.roomNo;
}

type ApiHkRoom = Partial<HKRoom> & {
  roomId?: string;
  roomType?: string;
  assignedTo?: string | null;
  assignedToName?: string | null;
  inspectedBy?: string | null;
  inspectedByName?: string | null;
  lastCleanedAt?: string | null;
  lastInspectedAt?: string | null;
  notes?: string | null;
  status?: string;
};

/** Normalize API slim row (or legacy local row) into HK UI shape. */
export function normalizeHkRoom(row: ApiHkRoom): HKRoom {
  const roomNo = String(row.roomNo ?? row.roomRefId ?? "").trim();
  const roomId = String(row.roomId ?? row.roomRefId ?? roomNo).trim();
  const id = String(row.id ?? "").trim() || undefined;

  const rawStatus = String(row.status ?? "").trim().toUpperCase();
  const ui =
    isHkEnum(rawStatus) || !row.hkStatus
      ? hkEnumToUiFields({
          status: rawStatus || "DIRTY",
          lastCleanedAt: row.lastCleanedAt,
        })
      : {
          status: row.status as HKRoom["status"],
          hkStatus: row.hkStatus as HKRoom["hkStatus"],
          foStatus: (row.foStatus ?? "Vacant") as HKRoom["foStatus"],
        };

  return {
    id,
    roomId,
    roomRefId: roomId || roomNo,
    roomNo: roomNo || roomId,
    category: row.category ?? row.roomType ?? "Standard",
    type: row.type ?? row.roomType ?? "Standard",
    bedType: row.bedType ?? "King",
    floor: row.floor ?? "",
    wing: row.wing ?? "",
    maxOccupancy: row.maxOccupancy ?? 2,
    cleaningFrequency: row.cleaningFrequency ?? "Daily",
    deepCleaningFrequency: row.deepCleaningFrequency ?? "Every 30 Days",
    lastDeepCleaned: row.lastDeepCleaned ?? "",
    status: ui.status,
    hkStatus: ui.hkStatus,
    foStatus: ui.foStatus,
    dnd: row.dnd ?? false,
    sleepOut: row.sleepOut ?? false,
    facilities: row.facilities ?? [],
    remarks: String(row.notes ?? row.remarks ?? ""),
    assignedStaff: row.assignedToName ?? row.assignedStaff ?? row.assignedTo ?? undefined,
    assignedSupervisor:
      row.inspectedByName ?? row.assignedSupervisor ?? row.inspectedBy ?? undefined,
    lastCleanedAt: row.lastCleanedAt ?? undefined,
    lastInspectedAt: row.lastInspectedAt ?? undefined,
    cleaningTimer: row.cleaningTimer,
    cleaningProgress: row.cleaningProgress,
    photos: row.photos,
    inspectionHistory: row.inspectionHistory,
    guestName: row.guestName,
    checkoutDate: row.checkoutDate,
    housekeeping: row.housekeeping,
    maintenance: row.maintenance,
  };
}
