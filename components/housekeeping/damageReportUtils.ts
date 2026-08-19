import type { HKDamageReport } from "@/components/housekeeping/HousekeepingTypes";

/** API shape from damage_reports table. */
export interface DamageReportDto {
  id: string;
  reportNumber?: string;
  roomId?: string | null;
  bookingId?: string | null;
  guestId?: string | null;
  assetId?: string | null;
  reportedBy?: string | null;
  damageType?: string;
  severity?: string;
  responsibility?: string;
  description: string;
  estimatedCost?: number;
  actualCost?: number | null;
  status?: string;
  reportedAt?: string | null;
  resolvedAt?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  roomNo?: string;
  guestName?: string;
  reportedByName?: string;
}

const DAMAGE_TYPE_LABELS: Record<string, string> = {
  ELECTRICAL: "Electrical",
  PLUMBING: "Plumbing",
  HVAC: "AC / HVAC",
  FURNITURE: "Furniture",
  WALL: "Wall",
  LINEN: "Linen",
  GLASS: "Glass",
  FLOORING: "Flooring",
  EQUIPMENT: "Equipment",
  ELECTRONICS: "Electronics",
  BATHROOM: "Bathroom",
  DECOR: "Decor",
  OTHER: "Other",
};

const SEVERITY_LABELS: Record<string, string> = {
  CRITICAL: "Critical",
  MAJOR: "Major",
  MODERATE: "Moderate",
  MINOR: "Minor",
};

const RESPONSIBILITY_LABELS: Record<string, string> = {
  GUEST: "Guest",
  HOTEL: "Hotel",
  NATURAL_WEAR: "Natural Wear",
  VENDOR: "Vendor",
  SPLIT: "Split Recovery",
};

function uiStatus(status?: string): string {
  switch (String(status ?? "").toUpperCase()) {
    case "UNDER_REVIEW":
      return "Under Review";
    case "PENDING_FINANCE":
      return "Pending Finance";
    case "PENDING_ENGINEERING":
      return "Pending Engineering";
    case "INSURANCE_CLAIM":
      return "Insurance Claim";
    case "REPAIRED":
      return "Repaired";
    case "RECOVERED":
      return "Recovered";
    case "CLOSED":
      return "Closed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return "Reported";
  }
}

function formatDate(iso?: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return String(iso);
  }
}

function label(map: Record<string, string>, value?: string): string {
  const key = String(value ?? "").toUpperCase();
  return map[key] ?? value ?? "Other";
}

export function normalizeDamageReport(row: DamageReportDto): HKDamageReport {
  const reportedAt = row.reportedAt ?? row.createdAt ?? new Date().toISOString();
  const room = row.roomNo ?? (row.roomId ? String(row.roomId) : "—");

  return {
    id: row.reportNumber ?? row.id,
    reportNumber: row.reportNumber,
    room: room === "—" ? "—" : room,
    roomId: row.roomId ?? undefined,
    bookingId: row.bookingId ?? undefined,
    guestId: row.guestId ?? undefined,
    guestName: row.guestName,
    assetId: row.assetId ?? undefined,
    damageType: label(DAMAGE_TYPE_LABELS, row.damageType),
    severity: label(SEVERITY_LABELS, row.severity),
    responsibility: label(RESPONSIBILITY_LABELS, row.responsibility),
    description: row.description,
    reportedBy: row.reportedByName ?? row.reportedBy ?? "Housekeeping",
    reportedAt: formatDate(reportedAt),
    estimatedCost: Number(row.estimatedCost ?? 0),
    actualCost: row.actualCost != null ? Number(row.actualCost) : undefined,
    status: uiStatus(row.status),
    resolvedAt: row.resolvedAt ? formatDate(row.resolvedAt) : undefined,
    notes: row.notes ?? undefined,
  };
}

export function uiDamageTypeToApi(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes("elect")) return "ELECTRICAL";
  if (lower.includes("plumb")) return "PLUMBING";
  if (lower.includes("ac") || lower.includes("hvac")) return "HVAC";
  if (lower.includes("furn")) return "FURNITURE";
  if (lower.includes("wall")) return "WALL";
  if (lower.includes("linen")) return "LINEN";
  if (lower.includes("glass") || lower.includes("mirror")) return "GLASS";
  if (lower.includes("floor") || lower.includes("carpet")) return "FLOORING";
  if (lower.includes("equip")) return "EQUIPMENT";
  if (lower.includes("electron") || lower.includes("tv")) return "ELECTRONICS";
  if (lower.includes("bath")) return "BATHROOM";
  if (lower.includes("decor")) return "DECOR";
  return "OTHER";
}

export function uiSeverityToApi(severity: string): string {
  switch (severity) {
    case "Critical":
      return "CRITICAL";
    case "Major":
      return "MAJOR";
    case "Minor":
      return "MINOR";
    default:
      return "MODERATE";
  }
}

export function uiResponsibilityToApi(responsibility: string): string {
  switch (responsibility) {
    case "Guest":
      return "GUEST";
    case "Natural Wear":
      return "NATURAL_WEAR";
    case "Vendor":
      return "VENDOR";
    case "Split Recovery":
      return "SPLIT";
    default:
      return "HOTEL";
  }
}

export function uiStatusToApi(status: string): string {
  switch (status) {
    case "Under Review":
      return "UNDER_REVIEW";
    case "Pending Finance":
      return "PENDING_FINANCE";
    case "Pending Engineering":
      return "PENDING_ENGINEERING";
    case "Insurance Claim":
      return "INSURANCE_CLAIM";
    case "Repaired":
      return "REPAIRED";
    case "Recovered":
      return "RECOVERED";
    case "Closed":
      return "CLOSED";
    case "Cancelled":
      return "CANCELLED";
    default:
      return "REPORTED";
  }
}

export type DamageReportCreateInput = {
  room: string;
  damageType: string;
  severity: string;
  responsibility: string;
  description: string;
  estimatedCost: number;
  assetId?: string;
  guest?: string;
  notes?: string;
};

export function toDamageReportCreatePayload(
  input: DamageReportCreateInput,
): Record<string, unknown> & { description: string } {
  return {
    roomId: input.room.trim(),
    damageType: uiDamageTypeToApi(input.damageType),
    severity: uiSeverityToApi(input.severity),
    responsibility: uiResponsibilityToApi(input.responsibility),
    description: input.description.trim(),
    estimatedCost: input.estimatedCost,
    assetId: input.assetId?.trim() || undefined,
    guest: input.guest?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    status: "REPORTED",
  };
}

export function resolveDamageReportApiId(
  report: Pick<HKDamageReport, "id" | "reportNumber">,
): string {
  return report.reportNumber ?? report.id;
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
