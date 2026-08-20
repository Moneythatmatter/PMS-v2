import type { MaintenanceRequest } from "@/app/data/frontoffice/modules";

/** API shape from maintenance_requests table. */
export interface MaintenanceRequestDto {
  id: string;
  requestNumber?: string;
  roomId?: string | null;
  publicAreaId?: string | null;
  issueType?: string;
  title?: string;
  description: string;
  priority: string;
  status: string;
  reportedBy?: string | null;
  assignedTo?: string | null;
  reportedAt?: string | null;
  assignedAt?: string | null;
  startedAt?: string | null;
  estimatedCompletionAt?: string | null;
  completedAt?: string | null;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  resolution?: string | null;
  notes?: string | null;
  blocksRoom?: boolean;
  createdAt?: string;
  updatedAt?: string;
  roomNo?: string;
  publicAreaName?: string;
  assignedToName?: string | null;
  reportedByName?: string | null;
  verifiedByName?: string | null;
}

const ISSUE_TYPE_LABELS: Record<string, string> = {
  ELECTRICAL: "Electrical",
  PLUMBING: "Plumbing",
  HVAC: "Air Conditioner",
  CARPENTRY: "Furniture",
  CIVIL: "Civil",
  APPLIANCE: "Appliance",
  IT: "Television",
  OTHER: "Others",
};

function uiPriority(priority?: string): MaintenanceRequest["priority"] {
  switch (String(priority ?? "").toUpperCase()) {
    case "LOW":
      return "Low";
    case "HIGH":
      return "High";
    case "CRITICAL":
      return "Critical";
    default:
      return "Medium";
  }
}

function uiStatus(status?: string): MaintenanceRequest["status"] {
  switch (String(status ?? "").toUpperCase()) {
    case "ASSIGNED":
      return "Assigned";
    case "IN_PROGRESS":
      return "In Progress";
    case "AWAITING_VERIFICATION":
      return "Awaiting Verification";
    case "CLOSED":
      return "Closed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return "Open";
  }
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

function issueLabel(issueType?: string, title?: string): string {
  if (title?.trim()) return title.trim();
  const key = String(issueType ?? "").toUpperCase();
  return ISSUE_TYPE_LABELS[key] ?? "Others";
}

/** Map slim maintenance_requests row → legacy MaintenanceRequest for existing UI. */
export function normalizeMaintenanceRequest(
  row: MaintenanceRequestDto,
): MaintenanceRequest {
  const category = issueLabel(row.issueType, row.title);
  const assigned =
    row.assignedToName ??
    assigneeFromNotes(row.notes) ??
    row.assignedTo ??
    "—";
  const reportedAt = row.reportedAt ?? row.createdAt ?? new Date().toISOString();
  const location =
    row.roomNo ??
    (row.roomId ? String(row.roomId) : undefined) ??
    row.publicAreaName ??
    "—";

  return {
    id: row.requestNumber ?? row.id,
    room: location,
    problem: `${category} — ${row.description}`,
    priority: uiPriority(row.priority),
    status: uiStatus(row.status),
    engineer: assigned || "—",
    reportedBy: row.reportedByName ?? row.reportedBy ?? undefined,
    createdAt: reportedAt,
    createdAtLabel: formatLabel(reportedAt),
    assignedAt: formatLabel(row.assignedAt),
    startedAt: formatLabel(row.startedAt),
    completedAt: formatLabel(row.completedAt),
    estimatedCompletion: formatLabel(row.estimatedCompletionAt),
    actualCompletion: formatLabel(row.verifiedAt),
    assignmentType: assigned && assigned !== "—" ? "Auto" : undefined,
    assignmentHistory: [],
    attachments: [],
  };
}

export function uiCategoryToIssueType(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes("elect")) return "ELECTRICAL";
  if (lower.includes("plumb") || lower.includes("leak")) return "PLUMBING";
  if (lower.includes("air cond") || lower.includes("ac ") || lower.includes("hvac")) {
    return "HVAC";
  }
  if (lower.includes("furn")) return "CARPENTRY";
  if (lower.includes("paint") || lower.includes("door") || lower.includes("window")) {
    return "CIVIL";
  }
  if (lower.includes("tv") || lower.includes("television")) return "IT";
  if (lower.includes("appliance")) return "APPLIANCE";
  return "OTHER";
}

export function uiPriorityToMaintenanceApi(
  priority: MaintenanceRequest["priority"],
): string {
  switch (priority) {
    case "Low":
      return "LOW";
    case "High":
      return "HIGH";
    case "Critical":
      return "CRITICAL";
    default:
      return "MEDIUM";
  }
}
