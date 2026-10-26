"use client";

import { DepartmentStaffView } from "@/components/workforce/DepartmentStaffView";

export default function FoodBeverageStaffPage() {
  return (
    <DepartmentStaffView
      eyebrow="Food & Beverages Masters"
      title="Staff"
      description="Food and beverage staff from Human Resources, with role, department, shift, contact, and status."
      department="food-beverage"
      fallbackNote="No food and beverage department is set in Human Resources."
      emptyMessage="No food and beverage staff found. Add them in Human Resources and set the department to Food & Beverage."
    />
  );
}
