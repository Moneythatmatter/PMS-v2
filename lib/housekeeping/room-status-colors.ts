/** Housekeeping room status colours — FO + HK unified model. */

export type HkRoomStatusUi =
  | "Vacant"
  | "Reserved"
  | "Occupied"
  | "Dirty"
  | "Cleaning"
  | "Clean"
  | "Inspected"
  | "Blocked";

export const HK_ROOM_STATUS_LEGEND_ORDER: { key: HkRoomStatusUi; label: string }[] = [
  { key: "Vacant", label: "Vacant" },
  { key: "Reserved", label: "Reserved" },
  { key: "Occupied", label: "Occupied" },
  { key: "Dirty", label: "Dirty" },
  { key: "Cleaning", label: "Cleaning" },
  { key: "Clean", label: "Clean" },
  { key: "Inspected", label: "Inspected" },
  { key: "Blocked", label: "Blocked / OOS" },
];

type StatusColorConfig = {
  label: string;
  description: string;
  card: string;
  dot: string;
  legend: string;
  roomNoText: string;
  metaText: string;
  badge: string;
};

const hkRoomStatusColors: Record<HkRoomStatusUi, StatusColorConfig> = {
  Vacant: {
    label: "Vacant",
    description: "Clean, inspected, and available for sale",
    card: "border-emerald-400/80 bg-gradient-to-br from-emerald-200 to-emerald-300 shadow-sm shadow-emerald-300/50",
    dot: "bg-emerald-600 ring-2 ring-white/80",
    legend: "bg-emerald-300 border-emerald-500",
    roomNoText: "text-emerald-950",
    metaText: "text-emerald-800",
    badge: "bg-emerald-600/25 text-emerald-950",
  },
  Reserved: {
    label: "Reserved",
    description: "Future booking — room assigned",
    card: "border-blue-400/80 bg-gradient-to-br from-blue-200 to-blue-300 shadow-sm shadow-blue-300/50",
    dot: "bg-blue-600 ring-2 ring-white/80",
    legend: "bg-blue-300 border-blue-500",
    roomNoText: "text-blue-950",
    metaText: "text-blue-800",
    badge: "bg-blue-600/25 text-blue-950",
  },
  Occupied: {
    label: "Occupied",
    description: "Guest is currently checked in",
    card: "border-violet-500 bg-gradient-to-br from-violet-500 to-violet-700 shadow-md shadow-violet-400/40",
    dot: "bg-white ring-2 ring-violet-300",
    legend: "bg-violet-600 border-violet-500",
    roomNoText: "text-white",
    metaText: "text-violet-100",
    badge: "bg-white/20 text-white",
  },
  Dirty: {
    label: "Dirty",
    description: "Needs housekeeping after checkout",
    card: "border-red-400/80 bg-gradient-to-br from-red-200 to-red-300 shadow-sm shadow-red-300/50",
    dot: "bg-red-600 ring-2 ring-white/80",
    legend: "bg-red-300 border-red-500",
    roomNoText: "text-red-950",
    metaText: "text-red-800",
    badge: "bg-red-600/25 text-red-950",
  },
  Cleaning: {
    label: "Cleaning",
    description: "Housekeeper is actively cleaning",
    card: "border-yellow-400/80 bg-gradient-to-br from-yellow-200 to-yellow-300 shadow-sm shadow-yellow-300/50",
    dot: "bg-yellow-600 ring-2 ring-white/80 animate-pulse",
    legend: "bg-yellow-300 border-yellow-500",
    roomNoText: "text-yellow-950",
    metaText: "text-yellow-800",
    badge: "bg-yellow-600/25 text-yellow-950",
  },
  Clean: {
    label: "Clean",
    description: "Cleaning finished — awaiting inspection",
    card: "border-sky-400/80 bg-gradient-to-br from-sky-200 to-sky-300 shadow-sm shadow-sky-300/50",
    dot: "bg-sky-600 ring-2 ring-white/80",
    legend: "bg-sky-300 border-sky-500",
    roomNoText: "text-sky-950",
    metaText: "text-sky-800",
    badge: "bg-sky-600/25 text-sky-950",
  },
  Inspected: {
    label: "Inspected",
    description: "Supervisor approved — ready for sale",
    card: "border-teal-400/80 bg-gradient-to-br from-teal-200 to-teal-300 shadow-sm shadow-teal-300/50",
    dot: "bg-teal-600 ring-2 ring-white/80",
    legend: "bg-teal-300 border-teal-500",
    roomNoText: "text-teal-950",
    metaText: "text-teal-800",
    badge: "bg-teal-600/25 text-teal-950",
  },
  Blocked: {
    label: "Blocked",
    description: "Out of service — not available for sale",
    card: "border-slate-400/80 bg-gradient-to-br from-slate-300 to-slate-400 shadow-sm shadow-slate-300/50",
    dot: "bg-slate-700 ring-2 ring-white/80",
    legend: "bg-slate-400 border-slate-500",
    roomNoText: "text-slate-900",
    metaText: "text-slate-800",
    badge: "bg-slate-700/20 text-slate-900",
  },
};

/** Map legacy UI labels to the new unified model. */
const legacyStatusMap: Record<string, HkRoomStatusUi> = {
  "Vacant Ready": "Vacant",
  "Vacant Dirty": "Dirty",
  "Occupied Dirty": "Occupied",
  "Inspection Pending": "Clean",
  "Out of Service": "Blocked",
  "Out of Order": "Blocked",
};

export function normalizeRoomDisplayStatus(status: string): HkRoomStatusUi {
  if (status in hkRoomStatusColors) return status as HkRoomStatusUi;
  if (status in legacyStatusMap) return legacyStatusMap[status];
  if (status.includes("Dirty")) return "Dirty";
  if (status.includes("Inspect")) return "Clean";
  return "Vacant";
}

export function getHkRoomStatusConfig(status: string): StatusColorConfig {
  return hkRoomStatusColors[normalizeRoomDisplayStatus(status)];
}

export function getHkRoomStatusShortLabel(status: string): string {
  const normalized = normalizeRoomDisplayStatus(status);
  switch (normalized) {
    case "Vacant":
      return "Vacant";
    case "Reserved":
      return "Reserved";
    case "Occupied":
      return "Occupied";
    case "Dirty":
      return "Dirty";
    case "Cleaning":
      return "Cleaning";
    case "Clean":
      return "Clean";
    case "Inspected":
      return "Inspected";
    case "Blocked":
      return "OOS";
    default:
      return normalized;
  }
}

export function getHkLegendConfig(key: HkRoomStatusUi): StatusColorConfig {
  return hkRoomStatusColors[key];
}

export function matchesHkStatusFilter(status: string, filter: string): boolean {
  const normalized = normalizeRoomDisplayStatus(status);
  if (filter === "all") return true;
  if (filter === "vacant") return normalized === "Vacant";
  if (filter === "reserved") return normalized === "Reserved";
  if (filter === "occupied") return normalized === "Occupied";
  if (filter === "dirty") return normalized === "Dirty";
  if (filter === "cleaning") return normalized === "Cleaning";
  if (filter === "clean") return normalized === "Clean";
  if (filter === "inspection") return normalized === "Clean";
  if (filter === "inspected") return normalized === "Inspected";
  if (filter === "ready") return normalized === "Vacant" || normalized === "Inspected";
  if (filter === "blocked") return normalized === "Blocked";
  return true;
}

export function countHkStatusFilter(rooms: { status: string }[], filter: string): number {
  return rooms.filter((r) => matchesHkStatusFilter(r.status, filter)).length;
}
