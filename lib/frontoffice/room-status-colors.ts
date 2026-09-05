/** Front Office room status colours — shared by Room Status & Room Availability. */

export type FoRoomStatus =
  | "Vacant"
  | "Reserved"
  | "Occupied"
  | "Dirty"
  | "Clean"
  | "Maintenance"
  | "Blocked";

export const FO_ROOM_STATUS_LEGEND_ORDER: FoRoomStatus[] = [
  "Vacant",
  "Reserved",
  "Occupied",
  "Dirty",
  "Clean",
  "Maintenance",
  "Blocked",
];

export const foRoomStatusColors: Record<
  FoRoomStatus,
  {
    label: string;
    description: string;
    card: string;
    dot: string;
    legend: string;
    roomNoText: string;
    metaText: string;
    statusText: string;
    badge: string;
    /** Badge classes for white dropdown/list backgrounds */
    listBadge: string;
  }
> = {
  Vacant: {
    label: "Vacant",
    description: "Open and ready",
    card: "border-emerald-400/80 bg-gradient-to-br from-emerald-200 to-emerald-300 shadow-sm shadow-emerald-300/50",
    dot: "bg-emerald-600 ring-2 ring-white/80",
    legend: "bg-emerald-300 border-emerald-500",
    roomNoText: "text-emerald-950",
    metaText: "text-emerald-800",
    statusText: "text-emerald-900",
    badge: "bg-emerald-600/25 text-emerald-950",
    listBadge: "bg-emerald-100 text-emerald-800",
  },
  Reserved: {
    label: "Reserved",
    description: "Future booking assigned",
    card: "border-sky-400/80 bg-gradient-to-br from-sky-200 to-sky-300 shadow-sm shadow-sky-300/50",
    dot: "bg-sky-600 ring-2 ring-white/80",
    legend: "bg-sky-300 border-sky-500",
    roomNoText: "text-sky-950",
    metaText: "text-sky-800",
    statusText: "text-sky-900",
    badge: "bg-sky-600/25 text-sky-950",
    listBadge: "bg-sky-100 text-sky-800",
  },
  Occupied: {
    label: "Occupied",
    description: "Checked-in guest in room",
    card: "border-violet-500 bg-gradient-to-br from-violet-500 to-violet-700 shadow-md shadow-violet-400/40",
    dot: "bg-white ring-2 ring-violet-300",
    legend: "bg-violet-600 border-violet-500",
    roomNoText: "text-white",
    metaText: "text-violet-100",
    statusText: "text-violet-50",
    badge: "bg-white/20 text-white",
    listBadge: "bg-violet-100 text-violet-800",
  },
  Dirty: {
    label: "Dirty",
    description: "Needs housekeeping",
    card: "border-amber-400/80 bg-gradient-to-br from-amber-200 to-amber-300 shadow-sm shadow-amber-300/50",
    dot: "bg-amber-600 ring-2 ring-white/80",
    legend: "bg-amber-300 border-amber-500",
    roomNoText: "text-amber-950",
    metaText: "text-amber-800",
    statusText: "text-amber-900",
    badge: "bg-amber-600/25 text-amber-950",
    listBadge: "bg-amber-100 text-amber-800",
  },
  Clean: {
    label: "Clean",
    description: "Housekeeping complete",
    card: "border-teal-400/80 bg-gradient-to-br from-teal-200 to-teal-300 shadow-sm shadow-teal-300/50",
    dot: "bg-teal-600 ring-2 ring-white/80",
    legend: "bg-teal-300 border-teal-500",
    roomNoText: "text-teal-950",
    metaText: "text-teal-800",
    statusText: "text-teal-900",
    badge: "bg-teal-600/25 text-teal-950",
    listBadge: "bg-teal-100 text-teal-800",
  },
  Maintenance: {
    label: "Maintenance",
    description: "Under repair / out of order",
    card: "border-orange-400/80 bg-gradient-to-br from-orange-200 to-orange-300 shadow-sm shadow-orange-300/50",
    dot: "bg-orange-600 ring-2 ring-white/80",
    legend: "bg-orange-300 border-orange-500",
    roomNoText: "text-orange-950",
    metaText: "text-orange-800",
    statusText: "text-orange-900",
    badge: "bg-orange-600/25 text-orange-950",
    listBadge: "bg-orange-100 text-orange-800",
  },
  Blocked: {
    label: "Blocked",
    description: "Not available for sale",
    card: "border-slate-400/80 bg-gradient-to-br from-slate-300 to-slate-400 shadow-sm shadow-slate-300/50",
    dot: "bg-slate-700 ring-2 ring-white/80",
    legend: "bg-slate-400 border-slate-500",
    roomNoText: "text-slate-900",
    metaText: "text-slate-800",
    statusText: "text-slate-900",
    badge: "bg-slate-700/20 text-slate-900",
    listBadge: "bg-slate-100 text-slate-700",
  },
};

export function getFoRoomStatusConfig(status: string) {
  return foRoomStatusColors[status as FoRoomStatus] ?? foRoomStatusColors.Vacant;
}

export function getFoRoomStatusListBadge(status: string): string {
  return getFoRoomStatusConfig(status).listBadge;
}
