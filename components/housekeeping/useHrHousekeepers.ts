"use client";

import { useEffect, useState } from "react";
import {
  hrEmployeeService,
  hrShiftAssignmentService,
  hrShiftTypeService,
} from "@/services/human-resources";
import { mapHousekeepingStaff } from "@/lib/housekeeping/hr-staff";

export type HrHousekeeper = { id: string; name: string };

/** Active housekeeping employees from HR (falls back to all active staff). */
export function useHrHousekeepers() {
  const [housekeepers, setHousekeepers] = useState<HrHousekeeper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      hrEmployeeService.list(),
      hrShiftTypeService.list(),
      hrShiftAssignmentService.list(),
    ])
      .then(([employees, shiftTypes, assignments]) => {
        if (cancelled) return;
        const { staff } = mapHousekeepingStaff(employees, shiftTypes, assignments);
        setHousekeepers(
          staff
            .filter((s) => s.id && s.status === "Active")
            .map((s) => ({ id: s.id, name: s.employeeName })),
        );
      })
      .catch(() => {
        if (!cancelled) setHousekeepers([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { housekeepers, loading };
}
