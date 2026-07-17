"use client";

import React, { useState, useMemo } from "react";
import { useHousekeeping } from "@/components/housekeeping/HousekeepingContext";
import { Users, Plus, CheckCircle2, Phone, Clock, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { TextInput, SelectInput, FormField, TextAreaInput } from "@/components/frontoffice/ui";

const STAFF_ROLES = ["Housekeeper", "Supervisor", "Inspector", "Laundry Staff", "Engineer", "Bell Boy"];

export default function StaffShiftMasters() {
  const {
    staff,
    shifts,
    setStaff,
    logAudit,
  } = useHousekeeping();

  const [activeTab, setActiveTab] = useState<"staff" | "shifts">("staff");
  const [createOpen, setCreateOpen] = useState(false);

  // Form Fields: New Staff
  const [name, setName] = useState("");
  const [role, setRole] = useState(STAFF_ROLES[0]);
  const [shiftName, setShiftName] = useState(shifts[0]?.name || "Morning Shift");
  const [phone, setPhone] = useState("+91 ");

  const handleCreateStaff = () => {
    if (!name.trim()) return;
    const newId = `ST-${String(staff.length + 1).padStart(2, "0")}`;
    const newRecord = {
      id: newId,
      name,
      role: role as any,
      activeShift: shiftName,
      phone,
      status: "Active" as const,
    };
    setStaff((prev) => [...prev, newRecord]);
    logAudit("Room Status", "Staff Enrolled", `Registered new housekeeping staff member: ${name} (${role}).`);
    setCreateOpen(false);
    setName("");
    setPhone("+91 ");
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Masters</span>
          <h1 className="mt-1 text-2xl font-bold text-slate-800">Staff & Shifts Scheduler</h1>
          <p className="text-sm text-slate-500 font-normal">
            Manage hotel housekeeping active staff profiles, department roles, and shift timings templates.
          </p>
        </div>
        {activeTab === "staff" && (
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 self-start sm:self-auto"
          >
            <UserPlus className="h-4 w-4" /> Enroll Staff
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab("staff")}
            className={cn(
              "pb-4 px-1 border-b-2",
              activeTab === "staff"
                ? "border-emerald-700 text-emerald-700"
                : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            Active Staff Directory ({staff.length})
          </button>
          <button
            onClick={() => setActiveTab("shifts")}
            className={cn(
              "pb-4 px-1 border-b-2",
              activeTab === "shifts"
                ? "border-emerald-700 text-emerald-700"
                : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            Shift Timings Master
          </button>
        </nav>
      </div>

      {activeTab === "staff" ? (
        /* Staff table list */
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Role / Department</th>
                <th className="px-5 py-3">Assigned Shift</th>
                <th className="px-5 py-3">Contact Phone</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-4 font-semibold text-slate-500">{member.id}</td>
                  <td className="px-5 py-4 font-bold text-slate-800">{member.name}</td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700"
                      )}
                    >
                      {member.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600 font-semibold">{member.activeShift}</td>
                  <td className="px-5 py-4 text-slate-500 font-medium flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-slate-400" /> {member.phone}
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 uppercase">
                      {member.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Shifts table list */
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Shift Name</th>
                <th className="px-5 py-3">Timings</th>
                <th className="px-5 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shifts.map((shift) => (
                <tr key={shift.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-4 font-semibold text-slate-500">{shift.id}</td>
                  <td className="px-5 py-4 font-bold text-slate-800">{shift.name}</td>
                  <td className="px-5 py-4 text-emerald-700 font-semibold flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {shift.timings}
                  </td>
                  <td className="px-5 py-4 text-slate-500 font-medium max-w-md">{shift.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer: Add Staff */}
      <Drawer open={createOpen} onClose={() => setCreateOpen(false)} title="Enroll Housekeeping Staff">
        <div className="space-y-4">
          <FormField label="Full Name" required>
            <TextInput placeholder="e.g. Somnath Sen" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
          </FormField>

          <FormField label="Role / Title" required>
            <SelectInput value={role} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRole(e.target.value)}>
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField label="Shift Assignment">
            <SelectInput value={shiftName} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setShiftName(e.target.value)}>
              {shifts.map((sh) => (
                <option key={sh.id} value={sh.name}>
                  {sh.name} ({sh.timings})
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField label="Contact Phone" required>
            <TextInput value={phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)} />
          </FormField>

          <Button
            onClick={handleCreateStaff}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white"
          >
            Enroll Staff
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
