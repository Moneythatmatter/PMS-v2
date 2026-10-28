"use client";

import { DepartmentStaffView } from "@/components/workforce/DepartmentStaffView";

export default function FrontOfficeStaffPage() {
  return (
    <DepartmentStaffView
      eyebrow="Front Office Masters"
      title="Staff & Shifts"
      description="Front office staff from Human Resources, with role, department, shift, contact, and status."
      department="front-office"
      fallbackNote="No front office department is set in Human Resources."
      emptyMessage="No front office staff found. Add them in Human Resources and set the department to Front Office."
    />
  );
}
