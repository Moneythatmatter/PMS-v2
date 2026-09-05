/** Housekeeping room status colours — shared by HK Room Status board. */

export type HkRoomStatusUi =
  | "Vacant Ready"
  | "Vacant Dirty"
  | "Occupied Dirty"
  | "Cleaning"
  | "Inspection Pending"
  | "Occupied"
  | "Blocked"
  | "Out of Service"
  | "Out of Order";

export const HK_ROOM_STATUS_LEGEND_ORDER: { key: HkRoomStatusUi | "Blocked / OOS"; label: string }[] = [
  { key: "Vacant Ready", label: "Vacant Ready" },
  { key: "Vacant Dirty", label: "Dirty" },
  { key: "Cleaning", label: "Cleaning" },
  { key: "Inspection Pending", label: "Inspection" },
  { key: "Occupied", label: "Occupied" },
  { key: "Blocked / OOS", label: "Blocked / OOS" },
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
  "Vacant Ready": {
    label: "Vacant Ready",
    description: "Clean and ready to sell",
    card: "border-emerald-400/80 bg-gradient-to-br from-emerald-200 to-emerald-300 shadow-sm shadow-emerald-300/50",
    dot: "bg-emerald-600 ring-2 ring-white/80",
    legend: "bg-emerald-300 border-emerald-500",
    roomNoText: "text-emerald-950",
    metaText: "text-emerald-800",
    badge: "bg-emerald-600/25 text-emerald-950",
  },
  "Vacant Dirty": {
    label: "Vacant Dirty",
    description: "Needs housekeeping",
    card: "border-rose-400/80 bg-gradient-to-br from-rose-200 to-rose-300 shadow-sm shadow-rose-300/50",
    dot: "bg-rose-600 ring-2 ring-white/80",
    legend: "bg-rose-300 border-rose-500",
    roomNoText: "text-rose-950",
    metaText: "text-rose-800",
    badge: "bg-rose-600/25 text-rose-950",
  },
  "Occupied Dirty": {
    label: "Occupied Dirty",
    description: "Guest in room — needs cleaning",
    card: "border-red-400/80 bg-gradient-to-br from-red-200 to-red-300 shadow-sm shadow-red-300/50",
    dot: "bg-red-600 ring-2 ring-white/80",
    legend: "bg-red-300 border-red-500",
    roomNoText: "text-red-950",
    metaText: "text-red-800",
    badge: "bg-red-600/25 text-red-950",
  },
  Cleaning: {
    label: "Cleaning",
    description: "Housekeeper actively cleaning",
    card: "border-amber-400/80 bg-gradient-to-br from-amber-200 to-amber-300 shadow-sm shadow-amber-300/50",
    dot: "bg-amber-600 ring-2 ring-white/80 animate-pulse",
    legend: "bg-amber-300 border-amber-500",
    roomNoText: "text-amber-950",
    metaText: "text-amber-800",
    badge: "bg-amber-600/25 text-amber-950",
  },
  "Inspection Pending": {
    label: "Inspection Pending",
    description: "Awaiting supervisor inspection",
    card: "border-sky-400/80 bg-gradient-to-br from-sky-200 to-sky-300 shadow-sm shadow-sky-300/50",
    dot: "bg-sky-600 ring-2 ring-white/80",
    legend: "bg-sky-300 border-sky-500",
    roomNoText: "text-sky-950",
    metaText: "text-sky-800",
    badge: "bg-sky-600/25 text-sky-950",
  },
  Occupied: {
    label: "Occupied",
    description: "Guest in room — clean",
    card: "border-violet-500 bg-gradient-to-br from-violet-500 to-violet-700 shadow-md shadow-violet-400/40",
    dot: "bg-white ring-2 ring-violet-300",
    legend: "bg-violet-600 border-violet-500",
    roomNoText: "text-white",
    metaText: "text-violet-100",
    badge: "bg-white/20 text-white",
  },
  Blocked: {
    label: "Blocked",
    description: "Not available for sale",
    card: "border-slate-400/80 bg-gradient-to-br from-slate-300 to-slate-400 shadow-sm shadow-slate-300/50",
    dot: "bg-slate-700 ring-2 ring-white/80",
    legend: "bg-slate-400 border-slate-500",
    roomNoText: "text-slate-900",
    metaText: "text-slate-800",
    badge: "bg-slate-700/20 text-slate-900",
  },
  "Out of Service": {
    label: "Out of Service",
    description: "Temporarily unavailable",
    card: "border-slate-400/80 bg-gradient-to-br from-slate-300 to-slate-400 shadow-sm shadow-slate-300/50",
    dot: "bg-slate-700 ring-2 ring-white/80",
    legend: "bg-slate-400 border-slate-500",
    roomNoText: "text-slate-900",
    metaText: "text-slate-800",
    badge: "bg-slate-700/20 text-slate-900",
  },
  "Out of Order": {
    label: "Out of Order",
    description: "Not available for sale",
    card: "border-slate-400/80 bg-gradient-to-br from-slate-300 to-slate-400 shadow-sm shadow-slate-300/50",
    dot: "bg-slate-700 ring-2 ring-white/80",
    legend: "bg-slate-400 border-slate-500",
    roomNoText: "text-slate-900",
    metaText: "text-slate-800",
    badge: "bg-slate-700/20 text-slate-900",
  },
};

export function getHkRoomStatusConfig(status: string): StatusColorConfig {
  if (status in hkRoomStatusColors) {
    return hkRoomStatusColors[status as HkRoomStatusUi];
  }
  if (status.includes("Dirty")) return hkRoomStatusColors["Vacant Dirty"];
  return hkRoomStatusColors["Vacant Ready"];
}

/** Compact label for room tiles — avoids long uppercase badges on small cards. */
export function getHkRoomStatusShortLabel(status: string): string {
  switch (status) {
    case "Vacant Ready":
      return "Ready";
    case "Vacant Dirty":
      return "Dirty";
    case "Occupied Dirty":
      return "Occ. dirty";
    case "Cleaning":
      return "Cleaning";
    case "Inspection Pending":
      return "Inspect";
    case "Occupied":
      return "Occupied";
    case "Blocked":
    case "Out of Service":
    case "Out of Order":
      return "OOS";
    default:
      return status.includes("Dirty") ? "Dirty" : status;
  }
}

export function getHkLegendConfig(key: HkRoomStatusUi | "Blocked / OOS"): StatusColorConfig {
  if (key === "Blocked / OOS") return hkRoomStatusColors.Blocked;
  return hkRoomStatusColors[key];
}

export function matchesHkStatusFilter(
  room: { status: string; hkStatus?: string },
  filter: string,
): boolean {
  const { status, hkStatus } = room;
  if (filter === "all") return true;
  if (filter === "dirty") {
    return status.includes("Dirty") || (status === "Occupied" && hkStatus === "Dirty");
  }
  if (filter === "occupied") {
    return status === "Occupied" || status === "Occupied Dirty";
  }
  if (filter === "cleaning") return status === "Cleaning";
  if (filter === "inspection") return status === "Inspection Pending";
  if (filter === "ready") return status === "Vacant Ready";
  if (filter === "blocked") {
    return status === "Blocked" || status === "Out of Order" || status === "Out of Service";
  }
  return true;
}

export function countHkStatusFilter(
  rooms: { status: string; hkStatus?: string }[],
  filter: string,
): number {
  return rooms.filter((r) => matchesHkStatusFilter(r, filter)).length;
}
