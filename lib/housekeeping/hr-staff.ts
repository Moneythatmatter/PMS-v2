import type { StaffMasterRecord } from "@/app/data/housekeepingWorkforceMasters";

export const WORKFORCE_DEPARTMENTS = {
  housekeeping: /house\s*keep|housekeep|laundry|linen|public area|room attendant|\bhk\b/i,
  "front-office": /front\s*office|reception|reservation|guest relation|concierge|cashier|bell desk|night audit|\bfo\b/i,
  "food-beverage": /food|beverage|f\s*&\s*b|\bf&b\b|kitchen|restaurant|steward|chef|banquet|\bbar\b|pastry|outlet/i,
} as const;

export type WorkforceDepartment = keyof typeof WORKFORCE_DEPARTMENTS;

export type HkStaffRecord = StaffMasterRecord & {
  departmentId?: string;
  designationId?: string;
  shiftTypeId?: string;
};

export type NamedOption = { id: string; label: string };

export function optionsWithCurrent(options: NamedOption[], current?: string) {
  if (!current || current === "—" || current === "Unassigned") return options;
  if (options.some((option) => option.label === current)) return options;
  return [{ id: "", label: current }, ...options];
}

function text(value: unknown) {
  return value == null ? "" : String(value).trim();
}

function clock(value: string) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return value.trim();
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

export function formatShiftLabel(name: string, start: string, end: string) {
  const title = name.trim();
  const from = clock(start);
  const to = clock(end);
  if (!title && !from && !to) return "Unassigned";
  if (from && to) return `${title || "Shift"} (${from} - ${to})`;
  return title || "Unassigned";
}

function mapStatus(raw: string): StaffMasterRecord["status"] {
  const status = raw.trim().toLowerCase().replace(/[\s_]+/g, " ");
  if (status === "inactive") return "Inactive";
  if (status === "on leave") return "On Leave";
  if (status === "draft") return "Draft";
  if (status === "suspended") return "Suspended";
  if (status === "archived") return "Archived";
  return "Active";
}

function matchesDepartment(department: WorkforceDepartment, name: string, designation: string) {
  return WORKFORCE_DEPARTMENTS[department].test(`${name} ${designation}`);
}

type ShiftTiming = { name: string; start: string; end: string };

export function mapDepartmentStaff(
  employees: Record<string, unknown>[],
  shiftTypes: Record<string, unknown>[],
  assignments: Record<string, unknown>[],
  department: WorkforceDepartment = "housekeeping",
  fallbackToAll = department === "housekeeping",
): { staff: HkStaffRecord[]; narrowed: boolean } {
  const shiftsById = new Map<string, ShiftTiming>();
  for (const row of shiftTypes) {
    const id = text(row.id);
    if (!id) continue;
    shiftsById.set(id, {
      name: text(row.shiftName),
      start: text(row.startTime),
      end: text(row.endTime),
    });
  }

  const latestAssignment = new Map<string, { from: string; shiftTypeId: string; name: string; start: string; end: string }>();
  for (const row of assignments) {
    const employeeId = text(row.employeeId ?? row.employee_id);
    if (!employeeId) continue;
    const status = text(row.status).toLowerCase();
    if (status === "inactive" || status === "cancelled" || status === "canceled") continue;
    const from = text(row.effectiveFrom ?? row.effective_from);
    const current = latestAssignment.get(employeeId);
    if (current && current.from > from) continue;
    latestAssignment.set(employeeId, {
      from,
      shiftTypeId: text(row.shiftTypeId ?? row.shift_type_id),
      name: text(row.shiftName ?? row.shift_name),
      start: text(row.startTime ?? row.start_time),
      end: text(row.endTime ?? row.end_time),
    });
  }

  const staff = employees.map((row) => {
    const id = text(row.id);
    const department = text(row.department);
    const designation = text(row.designation);
    const departmentId = text(row.departmentId);
    const designationId = text(row.designationId);
    let shiftTypeId = text(row.shiftTypeId);
    const assignment = latestAssignment.get(id);
    const master = shiftsById.get(assignment?.shiftTypeId || shiftTypeId);
    if (assignment?.shiftTypeId) shiftTypeId = assignment.shiftTypeId;

    const shiftName = assignment?.name || master?.name || text(row.shiftType);
    const start = assignment?.start || master?.start || "";
    const end = assignment?.end || master?.end || "";
    const employment = text(row.employmentType);

    const record: HkStaffRecord = {
      id,
      employeeId: text(row.empCode) || "—",
      employeeName: text(row.name) || `${text(row.firstName)} ${text(row.lastName)}`.trim() || "Unnamed",
      role: designation || "—",
      team: department || "—",
      assignedShift: formatShiftLabel(shiftName, start, end),
      assignedFloors: "—",
      phone: text(row.phone) || "—",
      email: text(row.email) || "—",
      status: mapStatus(text(row.status)),
      employmentType: employment || "—",
      joinDate: text(row.joinDate) || "—",
      creditCapacity: 0,
      departmentId: departmentId || undefined,
      designationId: designationId || undefined,
      shiftTypeId: shiftTypeId || undefined,
    };
    return record;
  });

  staff.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
  const matched = staff.filter((row) => matchesDepartment(department, row.team, row.role));
  if (matched.length > 0) {
    return { staff: matched, narrowed: true };
  }
  if (fallbackToAll) {
    return { staff, narrowed: false };
  }
  return { staff: [], narrowed: false };
}

export function mapHousekeepingStaff(
  employees: Record<string, unknown>[],
  shiftTypes: Record<string, unknown>[],
  assignments: Record<string, unknown>[],
): { staff: HkStaffRecord[]; narrowedToHousekeeping: boolean } {
  const mapped = mapDepartmentStaff(employees, shiftTypes, assignments, "housekeeping", true);
  return { staff: mapped.staff, narrowedToHousekeeping: mapped.narrowed };
}
