"use client";

import { useEffect, useMemo, useState } from "react";
import { StatCard } from "@/components/ui/StatCard";
import { AlertBanner, FOPageHeader } from "@/components/frontoffice/ui";
import { OperationsToolbar } from "@/components/housekeeping/OperationsToolbar";
import {
  hrEmployeeService,
  hrShiftAssignmentService,
  hrShiftTypeService,
} from "@/services/human-resources";
import { mapShiftTypeFromApi } from "@/lib/hr/api-mappers";
import { formatShiftLabel, mapDepartmentStaff, type WorkforceDepartment } from "@/lib/housekeeping/hr-staff";
import { cn } from "@/lib/utils";

type ShiftRow = {
  id: string;
  code: string;
  name: string;
  start: string;
  end: string;
  breakLabel: string;
  status: string;
  staffCount: number;
};

function statusBadge(status: string) {
  const key = status.toLowerCase();
  const tone =
    key === "active"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : key === "inactive"
        ? "bg-slate-100 text-slate-600 border-slate-200"
        : "bg-amber-50 text-amber-800 border-amber-200";
  return (
    <span className={cn("rounded-full border px-2.5 py-0.5 text-[9px] font-extrabold uppercase", tone)}>
      {status}
    </span>
  );
}

export function DepartmentShiftView({
  eyebrow,
  title,
  description,
  department,
  fallbackToAll = false,
  emptyMessage,
}: {
  eyebrow: string;
  title: string;
  description: string;
  department: WorkforceDepartment;
  fallbackToAll?: boolean;
  emptyMessage: string;
}) {
  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toast, setToast] = useState<{ message: string; variant: "success" | "info" } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [employees, shiftRows, assignmentRows] = await Promise.all([
          hrEmployeeService.list(),
          hrShiftTypeService.list(),
          hrShiftAssignmentService.list(),
        ]);
        if (cancelled) return;
        const staff = mapDepartmentStaff(employees, shiftRows, assignmentRows, department, fallbackToAll).staff;
        const counts = new Map<string, number>();
        for (const person of staff) {
          if (!person.shiftTypeId) continue;
          counts.set(person.shiftTypeId, (counts.get(person.shiftTypeId) ?? 0) + 1);
        }
        const rows = shiftRows
          .map((row) => mapShiftTypeFromApi(row))
          .filter((row) => row.shiftName)
          .map((row) => ({
            id: row.id,
            code: row.shiftCode || "—",
            name: row.shiftName,
            start: row.startTime || "—",
            end: row.endTime || "—",
            breakLabel: row.breakDurationMinutes ? `${row.breakDurationMinutes} min` : "—",
            status: row.status || "Active",
            staffCount: counts.get(row.id) ?? 0,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setShifts(rows);
      } catch {
        if (!cancelled) setToast({ message: "Could not load shifts from Human Resources.", variant: "info" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [department, fallbackToAll]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return shifts.filter((shift) => {
      const matchesSearch =
        !query ||
        shift.name.toLowerCase().includes(query) ||
        shift.code.toLowerCase().includes(query) ||
        formatShiftLabel(shift.name, shift.start, shift.end).toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || shift.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [shifts, search, statusFilter]);

  const metrics = useMemo(() => {
    const active = shifts.filter((shift) => shift.status === "Active").length;
    const inactive = shifts.filter((shift) => shift.status === "Inactive").length;
    const assigned = shifts.reduce((sum, shift) => sum + shift.staffCount, 0);
    return { active, inactive, total: shifts.length, assigned };
  }, [shifts]);

  return (
    <div className="space-y-5 select-none">
      {toast && <AlertBanner variant={toast.variant} message={toast.message} onDismiss={() => setToast(null)} />}

      <FOPageHeader eyebrow={eyebrow} title={title} description={description} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard stat={{ title: "Active Shifts", value: String(metrics.active), change: "", trend: "up" }} />
        <StatCard stat={{ title: "Inactive Shifts", value: String(metrics.inactive), change: "", trend: "up" }} />
        <StatCard stat={{ title: "Total Shifts", value: String(metrics.total), change: "", trend: "up" }} />
        <StatCard stat={{ title: "Assigned Staff", value: String(metrics.assigned), change: "", trend: "up" }} />
      </div>

      <OperationsToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search shift name or code…"
        showFilters={false}
        statusTabs={[
          { id: "all", label: "All Records" },
          { id: "active", label: "Active" },
          { id: "inactive", label: "Inactive" },
        ]}
        activeStatusTab={statusFilter}
        onStatusTabChange={setStatusFilter}
      />

      <div className="space-y-2">
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-3.5 py-3">Shift Code</th>
                <th className="px-3.5 py-3">Shift Name</th>
                <th className="px-3.5 py-3">Start</th>
                <th className="px-3.5 py-3">End</th>
                <th className="px-3.5 py-3">Break</th>
                <th className="px-3.5 py-3">Staff</th>
                <th className="px-3.5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {filtered.length > 0 ? (
                filtered.map((shift) => (
                  <tr key={shift.id} className="hover:bg-slate-50/60">
                    <td className="px-3.5 py-3 font-mono font-bold text-slate-600">{shift.code}</td>
                    <td className="px-3.5 py-3 font-extrabold text-slate-900">{shift.name}</td>
                    <td className="px-3.5 py-3 text-emerald-700 font-extrabold">{shift.start}</td>
                    <td className="px-3.5 py-3 font-extrabold text-slate-800">{shift.end}</td>
                    <td className="px-3.5 py-3 font-normal text-slate-600">{shift.breakLabel}</td>
                    <td className="px-3.5 py-3 font-bold text-slate-800">{shift.staffCount}</td>
                    <td className="px-3.5 py-3">{statusBadge(shift.status)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center font-medium text-slate-400">
                    {loading ? "Loading shifts from Human Resources…" : emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="px-1 text-[11px] font-semibold text-slate-400">
          Showing {filtered.length} of {shifts.length} shifts
        </p>
      </div>
    </div>
  );
}
