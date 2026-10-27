"use client";

import { DepartmentStaffView } from "@/components/workforce/DepartmentStaffView";

export default function StaffWorkforceMastersPage() {
  return (
    <DepartmentStaffView
        eyebrow="Housekeeping Masters"
        title="Workforce & Staffing Masters"
      description="Staff for this property from Human Resources, with role, department, shift, contact, and status."
      department="housekeeping"
      fallbackToAll
      fallbackNote="No housekeeping department is set in Human Resources, so this list includes every employee at this property."
      emptyMessage="No staff records found for this property."
    />
  );
}
