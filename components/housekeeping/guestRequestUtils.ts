import type { HousekeepingRequest } from "@/app/data/frontoffice/modules";

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
