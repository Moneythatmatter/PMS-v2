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

export type RoomDisplayStatus = HKRoom["status"];

/** Map Front Office room status labels to hk_rooms enum for API writes. */
export function foStatusToHkEnum(status: string): HkRoomStatusEnum {
  switch (status.trim()) {
    case "Vacant":
    case "Inspected":
      return "INSPECTED";
    case "Clean":
      return "CLEAN";
    case "Dirty":
      return "DIRTY";
    case "Cleaning":
      return "INSPECTING";
    case "Blocked":
    case "Out of Service":
    case "Out of Order":
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
    case "Cleaning":
      return "INSPECTING";
    case "Clean":
      return "CLEAN";
    case "Inspected":
      return "INSPECTED";
    case "Out of Service":
      return "OUT_OF_SERVICE";
    default:
      return "INSPECTED";
  }
}

/** Map UI status labels to DB enum for API writes. */
export function uiStatusToHkEnum(status: HKRoom["status"]): HkRoomStatusEnum {
  switch (status) {
    case "Vacant":
    case "Inspected":
      return "INSPECTED";
    case "Clean":
      return "CLEAN";
    case "Dirty":
      return "DIRTY";
    case "Cleaning":
      return "INSPECTING";
    case "Reserved":
      return "INSPECTED";
    case "Occupied":
      return "CLEAN";
    case "Blocked":
      return "OUT_OF_SERVICE";
    default:
      return "DIRTY";
  }
}

function hkEnumToHkStatusLabel(enumStatus: HkRoomStatusEnum): HKRoom["hkStatus"] {
  switch (enumStatus) {
    case "DIRTY":
      return "Dirty";
    case "INSPECTING":
      return "Cleaning";
    case "CLEAN":
      return "Clean";
    case "INSPECTED":
      return "Inspected";
    case "OUT_OF_SERVICE":
      return "OOS";
    default:
      return "Dirty";
  }
}

/**
 * Derive unified room display status from DB enum + reservation overlay.
 *
 * Priority: Blocked → Occupied → HK pipeline (Dirty/Cleaning/Clean) → Reserved → Vacant/Inspected
 */
export function hkEnumToUiFields(row: {
  status?: string;
  isOccupied?: boolean;
  hasReservation?: boolean;
  isActive?: boolean;
}): Pick<HKRoom, "status" | "hkStatus" | "foStatus"> {
  const raw = String(row.status ?? "DIRTY").trim().toUpperCase();
  const enumStatus: HkRoomStatusEnum = isHkEnum(raw) ? raw : "DIRTY";
  const isOccupied = row.isOccupied === true;
  const hasReservation = row.hasReservation === true;
  const isActive = row.isActive !== false;
  const hkStatus = hkEnumToHkStatusLabel(enumStatus);

  if (!isActive || enumStatus === "OUT_OF_SERVICE") {
    return { status: "Blocked", hkStatus: "OOS", foStatus: "Blocked" };
  }

  if (isOccupied) {
    return { status: "Occupied", hkStatus, foStatus: "Occupied" };
  }

  if (enumStatus === "DIRTY") {
    return { status: "Dirty", hkStatus: "Dirty", foStatus: "Vacant" };
  }
  if (enumStatus === "INSPECTING") {
    return { status: "Cleaning", hkStatus: "Cleaning", foStatus: "Vacant" };
  }
  if (enumStatus === "CLEAN") {
    return { status: "Clean", hkStatus: "Clean", foStatus: "Vacant" };
  }
  if (enumStatus === "INSPECTED") {
    if (hasReservation) {
      return { status: "Reserved", hkStatus: "Inspected", foStatus: "Vacant" };
    }
    return { status: "Vacant", hkStatus: "Inspected", foStatus: "Vacant" };
  }

  return { status: "Dirty", hkStatus: "Dirty", foStatus: "Vacant" };
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
  isOccupied?: boolean;
  isActive?: boolean;
  guestName?: string | null;
};

/** Normalize API slim row (or legacy local row) into HK UI shape. */
export function normalizeHkRoom(row: ApiHkRoom): HKRoom {
  const roomNo = String(row.roomNo ?? row.roomRefId ?? "").trim();
  const roomId = String(row.roomId ?? row.roomRefId ?? roomNo).trim();
  const id = String(row.id ?? "").trim() || undefined;

  const rawStatus = String(row.status ?? "").trim().toUpperCase();
  const isOccupied = row.isOccupied === true;
  const hasReservation = Boolean(row.guestName) && !isOccupied;

  const ui =
    isHkEnum(rawStatus) || !row.hkStatus
      ? hkEnumToUiFields({
          status: rawStatus || "DIRTY",
          isOccupied,
          hasReservation,
          isActive: row.isActive,
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
    guestName: row.guestName ?? undefined,
    checkoutDate: row.checkoutDate,
    housekeeping: row.housekeeping,
    maintenance: row.maintenance,
  };
}
