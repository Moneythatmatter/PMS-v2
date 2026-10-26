"use client";

import { DepartmentShiftView } from "@/components/workforce/DepartmentShiftView";

export default function FrontOfficeShiftsPage() {
  return (
    <DepartmentShiftView
      eyebrow="Front Office Masters"
      title="Shifts"
      description="Shift timings from Human Resources, with how many front office staff are assigned to each shift."
      department="front-office"
      emptyMessage="No shifts found in Human Resources."
    />
  );
}
