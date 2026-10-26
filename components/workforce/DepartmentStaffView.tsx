"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Eye,
  Edit2,
  Download,
  Phone,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import {
  TextInput,
  SelectInput,
  FormField,
  FOPageHeader,
  AlertBanner,
} from "@/components/frontoffice/ui";
import { OperationsToolbar, OperationsFilterDrawer } from "@/components/housekeeping/OperationsToolbar";
import { ModuleSelectionBar } from "@/components/pms/ModuleSelectionBar";
import {
  hrDepartmentService,
  hrDesignationService,
  hrEmployeeService,
  hrShiftAssignmentService,
  hrShiftTypeService,
} from "@/services/human-resources";
import { mapDepartmentFromApi, mapDesignationFromApi, mapShiftTypeFromApi } from "@/lib/hr/api-mappers";
import { formatShiftLabel, mapDepartmentStaff, optionsWithCurrent, type HkStaffRecord, type NamedOption, type WorkforceDepartment } from "@/lib/housekeeping/hr-staff";

export function DepartmentStaffView({
  eyebrow,
  title,
  description,
  department,
  fallbackToAll = false,
  fallbackNote,
  emptyMessage,
}: {
  eyebrow: string;
  title: string;
  description: string;
  department: WorkforceDepartment;
  fallbackToAll?: boolean;
  fallbackNote: string;
  emptyMessage: string;
}) {
  const [staffList, setStaffList] = useState<HkStaffRecord[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [showingAllDepartments, setShowingAllDepartments] = useState(false);
  const [departmentOptions, setDepartmentOptions] = useState<NamedOption[]>([]);
  const [designationOptions, setDesignationOptions] = useState<NamedOption[]>([]);
  const [shiftOptions, setShiftOptions] = useState<NamedOption[]>([]);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [shiftFilter, setShiftFilter] = useState("all");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [selectedStaffItem, setSelectedStaffItem] = useState<HkStaffRecord | null>(null);
  const [editStaffItem, setEditStaffItem] = useState<HkStaffRecord | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; variant: "success" | "info" } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [employees, shiftRows, assignmentRows, departmentRows, designationRows] = await Promise.all([
          hrEmployeeService.list(),
          hrShiftTypeService.list(),
          hrShiftAssignmentService.list(),
          hrDepartmentService.list(),
          hrDesignationService.list(),
        ]);
        if (cancelled) return;
        const mapped = mapDepartmentStaff(employees, shiftRows, assignmentRows, department, fallbackToAll);
        const departments = departmentRows
          .map((row) => mapDepartmentFromApi(row))
          .filter((row) => row.departmentName)
          .map((row) => ({ id: row.id, label: row.departmentName }));
        const designations = designationRows
          .map((row) => mapDesignationFromApi(row))
          .filter((row) => row.designationTitle)
          .map((row) => ({ id: row.id, label: row.designationTitle }));
        const shifts = shiftRows
          .map((row) => mapShiftTypeFromApi(row))
          .filter((row) => row.shiftName)
          .map((row) => ({
            id: row.id,
            label: formatShiftLabel(row.shiftName, row.startTime, row.endTime),
          }));
        setStaffList(mapped.staff);
        setShowingAllDepartments(!mapped.narrowed && mapped.staff.length > 0);
        setDepartmentOptions(departments);
        setDesignationOptions(designations);
        setShiftOptions(shifts);
      } catch {
        if (!cancelled) {
          setToast({ message: "Could not load staff from Human Resources.", variant: "info" });
        }
      } finally {
        if (!cancelled) setLoadingStaff(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [department, fallbackToAll]);

  // Dynamic KPI Metric Calculations
  const metrics = useMemo(() => {
    const activeStaffCount = staffList.filter((s) => s.status === "Active").length;
    const inactiveStaffCount = staffList.filter((s) => s.status === "Inactive").length;
    const supervisorCount = staffList.filter((s) => /supervisor|inspector/i.test(s.role)).length;

    return {
      activeStaffCount,
      inactiveStaffCount,
      supervisorCount,
      totalStaff: staffList.length,
    };
  }, [staffList]);

  // Active Filter Count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== "all") count++;
    if (roleFilter !== "all") count++;
    if (shiftFilter !== "all") count++;
    return count;
  }, [statusFilter, roleFilter, shiftFilter]);

  // Filtered Data Lists
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const matchSearch =
        s.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        s.employeeId.toLowerCase().includes(search.toLowerCase()) ||
        s.phone.toLowerCase().includes(search.toLowerCase()) ||
        s.role.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "all" || s.status.toLowerCase() === statusFilter.toLowerCase();
      const matchRole = roleFilter === "all" || s.role.toLowerCase() === roleFilter.toLowerCase();
      const matchShift = shiftFilter === "all" || s.assignedShift.toLowerCase().includes(shiftFilter.toLowerCase());

      return matchSearch && matchStatus && matchRole && matchShift;
    });
  }, [staffList, search, statusFilter, roleFilter, shiftFilter]);

  // Status Badge Component Helper
  const renderStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-[9px] font-extrabold uppercase">Active</span>;
      case "inactive":
        return <span className="rounded-full bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 text-[9px] font-extrabold uppercase">Inactive</span>;
      case "on leave":
        return <span className="rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 text-[9px] font-extrabold uppercase">On Leave</span>;
      case "draft":
        return <span className="rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 text-[9px] font-extrabold uppercase">Draft</span>;
      case "suspended":
        return <span className="rounded-full bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 text-[9px] font-extrabold uppercase">Suspended</span>;
      case "archived":
        return <span className="rounded-full bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 text-[9px] font-extrabold uppercase">Archived</span>;
      default:
        return <span className="rounded-full bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 text-[9px] font-extrabold uppercase">{status}</span>;
    }
  };

  // Handlers: Toggle Record Status
  const handleToggleStatus = async (id: string) => {
    const current = staffList.find((s) => s.id === id);
    if (!current) return;
    const next = current.status === "Active" ? "Inactive" : "Active";
    try {
      await hrEmployeeService.update(id, { status: next });
      setStaffList((prev) => prev.map((s) => (s.id === id ? { ...s, status: next } : s)));
      setToast({ message: "Staff status updated.", variant: "success" });
    } catch {
      setToast({ message: "Could not update staff status.", variant: "info" });
    }
  };

  const handleSaveStaffEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStaffItem) return;
    const role = designationOptions.find((option) => option.label === editStaffItem.role);
    const team = departmentOptions.find((option) => option.label === editStaffItem.team);
    const shift = shiftOptions.find((option) => option.label === editStaffItem.assignedShift);
    const email = editStaffItem.email === "—" ? "" : editStaffItem.email.trim();
    const phone = editStaffItem.phone === "—" ? "" : editStaffItem.phone.trim();
    const saved: HkStaffRecord = {
      ...editStaffItem,
      email: email || "—",
      phone: phone || "—",
      designationId: role?.id ?? editStaffItem.designationId,
      departmentId: team?.id ?? editStaffItem.departmentId,
      shiftTypeId: shift?.id ?? editStaffItem.shiftTypeId,
    };
    try {
      await hrEmployeeService.update(editStaffItem.id, {
        name: editStaffItem.employeeName,
        email,
        phone,
        status: editStaffItem.status,
        ...(role?.id ? { designationId: role.id } : {}),
        ...(team?.id ? { departmentId: team.id } : {}),
        ...(shift?.id ? { shiftTypeId: shift.id } : {}),
      });
      setStaffList((prev) => prev.map((s) => (s.id === editStaffItem.id ? saved : s)));
      setEditStaffItem(null);
      setToast({ message: `${editStaffItem.employeeName} updated.`, variant: "success" });
    } catch {
      setToast({ message: "Could not save staff changes.", variant: "info" });
    }
  };

  const firstSelectedStaff = filteredStaff.find((s) => selectedIds.has(s.id));

  const selectionBarActions = [
    {
      label: "View",
      icon: <Eye className="h-3.5 w-3.5" />,
      onClick: () => {
        if (firstSelectedStaff) setSelectedStaffItem(firstSelectedStaff);
      },
    },
    {
      label: "Edit",
      icon: <Edit2 className="h-3.5 w-3.5" />,
      onClick: () => {
        if (firstSelectedStaff) setEditStaffItem(firstSelectedStaff);
      },
    },
    {
      label: firstSelectedStaff?.status === "Active" ? "Deactivate" : "Activate",
      onClick: () => {
        if (firstSelectedStaff) handleToggleStatus(firstSelectedStaff.id);
      },
    },
  ];

  return (
    <div className="space-y-5 select-none">
      {toast && (
        <AlertBanner
          variant={toast.variant}
          message={toast.message}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* Header */}
      <FOPageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        action={
          <Button
            variant="outline"
            onClick={() => setToast({ message: "Exporting Workforce Master roster CSV...", variant: "info" })}
            className="!bg-white hover:!bg-slate-100 !text-slate-700 !border-slate-200 flex items-center justify-center gap-1.5 rounded-xl h-8 px-3 text-xs font-bold shrink-0"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" /> Export Data
          </Button>
        }
      />

      {/* Summary KPI Cards (Dynamic Metrics) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard stat={{ title: "Active Staff", value: String(metrics.activeStaffCount), change: "", trend: "up" }} />
        <StatCard stat={{ title: "Inactive Staff", value: String(metrics.inactiveStaffCount), change: "", trend: "up" }} />
        <StatCard stat={{ title: "Total Staff", value: String(metrics.totalStaff), change: "", trend: "up" }} />
        <StatCard stat={{ title: "Supervisors", value: String(metrics.supervisorCount), change: "", trend: "up" }} />
      </div>

      {showingAllDepartments && (
        <p className="text-xs font-medium text-slate-500">
          {fallbackNote}
        </p>
      )}

      {/* Search & Filter Operations Toolbar */}
      <OperationsToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search employee ID, name, phone, or role…"
        activeFilterCount={activeFilterCount}
        onOpenFilters={() => setFilterDrawerOpen(true)}
        statusTabs={[
          { id: "all", label: "All Records" },
          { id: "active", label: "Active" },
          { id: "inactive", label: "Inactive" },
        ]}
        activeStatusTab={statusFilter}
        onStatusTabChange={setStatusFilter}
        selectionBar={
          <ModuleSelectionBar
            count={selectedIds.size}
            noun="staff member"
            onClear={() => setSelectedIds(new Set())}
            actions={selectionBarActions}
          />
        }
      />

      {/* Slide-over Filter Drawer */}
      <OperationsFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        title="Filter Workforce Masters"
        activeFilterCount={activeFilterCount}
        onReset={() => {
          setStatusFilter("all");
          setRoleFilter("all");
          setShiftFilter("all");
        }}
      >
        <div className="space-y-4 select-none">
          <FormField label="Record Status">
            <SelectInput
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
              <option value="suspended">Suspended</option>
              <option value="archived">Archived</option>
            </SelectInput>
          </FormField>

          <FormField label="Role">
                <SelectInput
                  value={roleFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRoleFilter(e.target.value)}
                  className="w-full text-xs rounded-xl h-9 bg-white"
                >
                  <option value="all">All Roles</option>
                  {Array.from(new Set(staffList.map((staff) => staff.role).filter((role) => role && role !== "—"))).map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </SelectInput>
              </FormField>

              <FormField label="Assigned Shift Schedule">
                <SelectInput
                  value={shiftFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setShiftFilter(e.target.value)}
                  className="w-full text-xs rounded-xl h-9 bg-white"
                >
                  <option value="all">All Shifts</option>
                  {Array.from(new Set(staffList.map((staff) => staff.assignedShift).filter((shift) => shift && shift !== "Unassigned"))).map((shift) => (
                    <option key={shift} value={shift}>{shift}</option>
                  ))}
                </SelectInput>
              </FormField>
        </div>
      </OperationsFilterDrawer>

      {/* STAFF LIST */}
        <div className="space-y-2">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold sticky top-0 z-10">
                  <th className="w-10 px-3.5 py-3">
                    <input
                      type="checkbox"
                      checked={filteredStaff.length > 0 && filteredStaff.every((s) => selectedIds.has(s.id))}
                      onChange={() => {
                        const allIds = filteredStaff.map((s) => s.id);
                        const allSelected = allIds.every((id) => selectedIds.has(id));
                        setSelectedIds(allSelected ? new Set() : new Set(allIds));
                      }}
                      className="rounded border-slate-300"
                      aria-label="Select all"
                    />
                  </th>
                  <th className="px-3.5 py-3">Employee ID</th>
                  <th className="px-3.5 py-3">Employee Name</th>
                  <th className="px-3.5 py-3">Role</th>
                  <th className="px-3.5 py-3">Department</th>
                  <th className="px-3.5 py-3">Assigned Shift</th>
                  <th className="px-3.5 py-3">Contact Phone</th>
                  <th className="px-3.5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredStaff.length > 0 ? (
                  filteredStaff.map((s) => (
                    <tr
                      key={s.id}
                      className={cn(
                        "hover:bg-slate-50/60 transition-colors",
                        selectedIds.has(s.id) && "bg-emerald-50/40",
                      )}
                    >
                      <td className="px-3.5 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(s.id)}
                          onChange={() => {
                            const next = new Set(selectedIds);
                            if (next.has(s.id)) next.delete(s.id);
                            else next.add(s.id);
                            setSelectedIds(next);
                          }}
                          className="rounded border-slate-300"
                          aria-label={`Select ${s.employeeName}`}
                        />
                      </td>
                      <td className="px-3.5 py-3 font-mono font-bold text-slate-600">{s.employeeId}</td>
                      <td className="px-3.5 py-3">
                        <p className="font-extrabold text-slate-900 leading-tight">{s.employeeName}</p>
                        <p className="text-[10px] text-slate-400 font-normal">{s.email}</p>
                      </td>
                      <td className="px-3.5 py-3 text-slate-700 font-medium">{s.role}</td>
                      <td className="px-3.5 py-3 text-slate-600 font-normal">{s.team}</td>
                      <td className="px-3.5 py-3 text-slate-600 font-normal">{s.assignedShift}</td>
                      <td className="px-3.5 py-3 text-slate-600 font-mono">{s.phone}</td>
                      <td className="px-3.5 py-3">{renderStatusBadge(s.status)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400 font-medium">
                      {loadingStaff ? "Loading staff from Human Resources…" : emptyMessage}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-1">
            <span>Showing {filteredStaff.length} of {staffList.length} staff master entries</span>
          </div>
        </div>

      {/* VIEW STAFF DETAILS DRAWER */}
      {selectedStaffItem && (
        <Drawer
          open={!!selectedStaffItem}
          onClose={() => setSelectedStaffItem(null)}
          title={`Staff Profile: ${selectedStaffItem.employeeId}`}
          width="md"
        >
          <div className="space-y-4 select-none pb-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-extrabold text-emerald-700">{selectedStaffItem.employeeId}</span>
                {renderStatusBadge(selectedStaffItem.status)}
              </div>
              <h3 className="text-base font-extrabold text-slate-900">{selectedStaffItem.employeeName}</h3>
              <p className="text-xs text-slate-500 font-medium">{selectedStaffItem.role} · {selectedStaffItem.team}</p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Employment & Shift</h4>
              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Assigned Shift:</span>
                  <span className="font-bold text-slate-800">{selectedStaffItem.assignedShift}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Employment Type:</span>
                  <span className="font-bold text-slate-800">{selectedStaffItem.employmentType} (Joined {selectedStaffItem.joinDate})</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Contact Details</h4>
              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>{selectedStaffItem.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span>{selectedStaffItem.email}</span>
                </div>
              </div>
            </div>

            {selectedStaffItem.remarks && (
              <div className="rounded-xl bg-amber-50/60 border border-amber-200 p-3 text-xs text-amber-900 font-medium">
                {selectedStaffItem.remarks}
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => setSelectedStaffItem(null)}
              className="w-full h-9 text-xs font-bold border-slate-200 !bg-slate-100 text-slate-700 hover:!bg-slate-200 rounded-xl"
            >
              Close Profile
            </Button>
          </div>
        </Drawer>
      )}

      {/* EDIT STAFF MASTER DRAWER */}
      {editStaffItem && (
        <Drawer
          open={!!editStaffItem}
          onClose={() => setEditStaffItem(null)}
          title={`Edit Staff Profile: ${editStaffItem.employeeId}`}
        >
          <form onSubmit={handleSaveStaffEdit} className="space-y-4 select-none pb-6">
            <FormField label="Full Employee Name">
              <TextInput
                value={editStaffItem.employeeName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditStaffItem({ ...editStaffItem, employeeName: e.target.value })
                }
                className="h-9 text-xs"
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Role">
                <SelectInput
                  value={editStaffItem.role}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setEditStaffItem({ ...editStaffItem, role: e.target.value })
                  }
                  className="h-9 text-xs"
                >
                  {optionsWithCurrent(designationOptions, editStaffItem.role).map((option) => (
                    <option key={`${option.id}-${option.label}`} value={option.label}>{option.label}</option>
                  ))}
                </SelectInput>
              </FormField>

              <FormField label="Department">
                <SelectInput
                  value={editStaffItem.team}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setEditStaffItem({ ...editStaffItem, team: e.target.value })
                  }
                  className="h-9 text-xs"
                >
                  {optionsWithCurrent(departmentOptions, editStaffItem.team).map((option) => (
                    <option key={`${option.id}-${option.label}`} value={option.label}>{option.label}</option>
                  ))}
                </SelectInput>
              </FormField>
            </div>

            <FormField label="Assigned Shift">
              <SelectInput
                value={editStaffItem.assignedShift}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setEditStaffItem({ ...editStaffItem, assignedShift: e.target.value })
                }
                className="h-9 text-xs"
              >
                {optionsWithCurrent(shiftOptions, editStaffItem.assignedShift).map((option) => (
                  <option key={`${option.id}-${option.label}`} value={option.label}>{option.label}</option>
                ))}
              </SelectInput>
            </FormField>

            <FormField label="Email Address">
              <TextInput
                value={editStaffItem.email === "—" ? "" : editStaffItem.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditStaffItem({ ...editStaffItem, email: e.target.value })
                }
                className="h-9 text-xs"
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Mobile Phone">
                <TextInput
                  value={editStaffItem.phone === "—" ? "" : editStaffItem.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditStaffItem({ ...editStaffItem, phone: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </FormField>

              <FormField label="Status">
                <SelectInput
                  value={editStaffItem.status}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setEditStaffItem({ ...editStaffItem, status: e.target.value as HkStaffRecord["status"] })
                  }
                  className="h-9 text-xs"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="On Leave">On Leave</option>
                </SelectInput>
              </FormField>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditStaffItem(null)}
                className="h-9 px-4 text-xs font-bold !bg-slate-100 text-slate-700 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 px-4 text-xs font-bold !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white rounded-xl"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Drawer>
      )}

    </div>
  );
}
