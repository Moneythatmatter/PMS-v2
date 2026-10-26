import type { HousekeepingRequest } from "@/app/data/frontoffice/modules";

export const OPEN_GUEST_REQUEST_STATUSES = new Set([
  "PENDING",
  "ASSIGNED",
  "IN_PROGRESS",
]);

/** API shape from guest_requests table. */
export interface GuestRequestDto {
  id: string;
  requestNumber?: string;
  roomId: string;
  bookingId?: string | null;
  requestType?: string;
  description: string;
  status: string;
  priority: string;
  assignedTo?: string | null;
  assignedToName?: string | null;
  createdBy?: string | null;
  requestedAt?: string | null;
  completedAt?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  roomNo?: string;
  bookingNo?: string;
  guestName?: string;
}

export function isOpenGuestRequest(row: Pick<GuestRequestDto, "status">): boolean {
  return OPEN_GUEST_REQUEST_STATUSES.has(String(row.status ?? "").toUpperCase());
}

export function isCleaningGuestRequest(
  row: Pick<GuestRequestDto, "requestType">,
): boolean {
  return String(row.requestType ?? "").toUpperCase() === "CLEANING";
}

export function formatGuestRequestTypeLabel(type?: string | null): string {
  if (!type) return "Request";
  return type
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

function uiPriority(priority?: string): HousekeepingRequest["priority"] {
  switch (String(priority ?? "").toUpperCase()) {
    case "LOW":
      return "Low";
    case "HIGH":
    case "URGENT":
      return "High";
    default:
      return "Medium";
  }
}

function uiStatus(status?: string, assignedTo?: string | null): HousekeepingRequest["status"] {
  const raw = String(status ?? "").toUpperCase();
  if (raw === "COMPLETED") return "Completed";
  if (raw === "CANCELLED") return "Cancelled";
  if (raw === "IN_PROGRESS" || raw === "ASSIGNED") return "In Progress";
  if (assignedTo && String(assignedTo).trim() && assignedTo !== "—") {
    return "In Progress";
  }
  return "Open";
}

function formatLabel(iso?: string | null): string | undefined {
  if (!iso) return undefined;
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

function assigneeFromNotes(notes?: string | null): string | undefined {
  if (!notes) return undefined;
  const match = notes.match(/Assigned to:\s*([^·]+)/i);
  return match?.[1]?.trim() || undefined;
}

/** Map slim guest_requests row → legacy HousekeepingRequest for existing UI. */
export function normalizeGuestRequest(row: GuestRequestDto): HousekeepingRequest {
  const assigned =
    row.assignedToName ??
    assigneeFromNotes(row.notes) ??
    row.assignedTo ??
    "—";
  const requestedAt = row.requestedAt ?? row.createdAt ?? new Date().toISOString();
  const bookingLabel = row.bookingNo ?? row.bookingId;

  return {
    id: row.requestNumber ?? row.id,
    guest: row.guestName ?? "Guest",
    room: row.roomNo ?? row.roomId,
    issue: row.description,
    priority: uiPriority(row.priority),
    status: uiStatus(row.status, assigned),
    assignedStaff: assigned || "—",
    createdAt: requestedAt,
    createdAtLabel: formatLabel(requestedAt),
    assignmentType: assigned && assigned !== "—" ? "Auto" : undefined,
    assignmentHistory: [],
    bookingId: row.bookingId ?? undefined,
    bookingNo: bookingLabel ?? undefined,
    apiId: row.id,
    roomId: row.roomId,
    requestType: row.requestType ? String(row.requestType).toUpperCase() : undefined,
    fromGuestQr: isGuestQrRequest(row),
  };
}

export function isGuestQrRequest(row: Pick<GuestRequestDto, "description">): boolean {
  return /via guest QR/i.test(row.description ?? "");
}

/** Reads service + turnaround out of a guest-QR laundry description. */
export function parseLaundryRequest(description: string) {
  const service = description.match(/Service:\s*([^·]+)/i)?.[1]?.trim();
  const turnaround = description.match(/Turnaround:\s*([^·]+)/i)?.[1]?.trim();
  const notes = description
    .split("·")
    .map((p) => p.trim())
    .filter((p) => p && !/via guest QR|^Service:|^Turnaround:/i.test(p))
    .join(" · ");
  return {
    serviceType: service && ["Wash & Iron", "Dry Clean", "Iron Only"].includes(service) ? service : "Wash & Iron",
    urgency: turnaround === "Express" ? "Express" : "Normal",
    notes,
  };
}

export function mapRequestItemToType(item: string): string {
  const lower = item.toLowerCase();
  if (lower.includes("towel")) return "TOWELS";
  if (lower.includes("pillow") || lower.includes("blanket") || lower.includes("cot")) {
    return "LINEN";
  }
  if (lower.includes("clean")) return "CLEANING";
  if (lower.includes("minibar")) return "MINIBAR";
  if (
    lower.includes("water") ||
    lower.includes("toiletries") ||
    lower.includes("coffee") ||
    lower.includes("tea") ||
    lower.includes("iron") ||
    lower.includes("dryer")
  ) {
    return "AMENITY";
  }
  return "OTHER";
}

export function uiPriorityToApi(
  priority: HousekeepingRequest["priority"],
): string {
  switch (priority) {
    case "Low":
      return "LOW";
    case "High":
      return "HIGH";
    default:
      return "MEDIUM";
  }
}
