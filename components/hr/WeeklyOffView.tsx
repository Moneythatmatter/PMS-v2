"use client";

import React, { useState, useMemo } from "react";
import {
  CalendarOff,
  Search,
  Filter,
  Plus,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Edit2,
  Trash2,
  Check,
  X,
  FileText,
  Printer,
  ChevronLeft,
  ChevronRight,
  Building2,
  User,
  ShieldAlert,
  Sparkles,
  Info,
  Repeat,
  Calendar,
  Layers,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface WeeklyOffAssignment {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  avatar: string;
  photoUrl?: string;
  type: "Fixed" | "Rotational";
  days: string[]; // e.g. ["Sunday"], ["Saturday", "Sunday"]
  rotationPattern?: string; // e.g. "W1-Sun, W2-Mon, W3-Tue, W4-Wed"
  effectiveFrom: string;
  effectiveTo: string;
  status: "Active" | "Upcoming" | "Expired";
  assignedBy: string;
  remarks?: string;
}

export const INITIAL_WEEKLY_OFFS: WeeklyOffAssignment[] = [
  {
    id: "WO-401",
    employeeId: "EMP-0101",
    employeeName: "Rajesh Kumar",
    department: "Front Office",
    designation: "Front Desk Manager",
    avatar: "RK",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    type: "Fixed",
    days: ["Sunday"],
    effectiveFrom: "01/01/2026",
    effectiveTo: "31/12/2026",
    status: "Active",
    assignedBy: "Neha Mehta (HR Admin)",
    remarks: "Standard Sunday weekly off.",
  },
  {
    id: "WO-402",
    employeeId: "EMP-0102",
    employeeName: "Anjali Sharma",
    department: "Housekeeping",
    designation: "Executive Housekeeper",
    avatar: "AS",
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150",
    type: "Fixed",
    days: ["Saturday", "Sunday"],
    effectiveFrom: "01/01/2026",
    effectiveTo: "31/12/2026",
    status: "Active",
    assignedBy: "Neha Mehta (HR Admin)",
    remarks: "Weekend 2-day weekly off for management.",
  },
  {
    id: "WO-403",
    employeeId: "EMP-0103",
    employeeName: "Chef Vikramjit Singh",
    department: "Food & Beverage",
    designation: "Executive Head Chef",
    avatar: "VS",
    type: "Rotational",
    days: ["Monday"],
    rotationPattern: "Rotational (W1: Mon, W2: Tue, W3: Wed, W4: Thu)",
    effectiveFrom: "01/08/2026",
    effectiveTo: "31/08/2026",
    status: "Active",
    assignedBy: "HR Admin",
    remarks: "Kitchen weekly off rotation schedule.",
  },
  {
    id: "WO-404",
    employeeId: "EMP-0104",
    employeeName: "Priya Patel",
    department: "Front Office",
    designation: "Guest Relations Executive",
    avatar: "PP",
    type: "Rotational",
    days: ["Tuesday"],
    rotationPattern: "Rotational Shift Weekly Off",
    effectiveFrom: "01/08/2026",
    effectiveTo: "31/08/2026",
    status: "Active",
    assignedBy: "HR Admin",
  },
  {
    id: "WO-405",
    employeeId: "EMP-0105",
    employeeName: "Arjun Verma",
    department: "Food & Beverage",
    designation: "Restaurant Captain",
    avatar: "AV",
    type: "Rotational",
    days: ["Wednesday"],
    rotationPattern: "Rotational (Mid-week Off)",
    effectiveFrom: "01/08/2026",
    effectiveTo: "31/08/2026",
    status: "Active",
    assignedBy: "F&B Manager",
  },
  {
    id: "WO-406",
    employeeId: "EMP-0106",
    employeeName: "Meera Nair",
    department: "Front Office",
    designation: "Concierge Lead",
    avatar: "MN",
    type: "Fixed",
    days: ["Sunday"],
    effectiveFrom: "01/09/2026",
    effectiveTo: "30/09/2026",
    status: "Upcoming",
    assignedBy: "Neha Mehta (HR Admin)",
  },
  {
    id: "WO-407",
    employeeId: "EMP-0107",
    employeeName: "Sanjay Dutt",
    department: "Accounts",
    designation: "Senior Accountant",
    avatar: "SD",
    type: "Fixed",
    days: ["Saturday", "Sunday"],
    effectiveFrom: "01/01/2026",
    effectiveTo: "31/12/2026",
    status: "Active",
    assignedBy: "Finance Director",
  },
  {
    id: "WO-408",
    employeeId: "EMP-0108",
    employeeName: "Kavita Reddy",
    department: "Housekeeping",
    designation: "Room Attendant",
    avatar: "KR",
    type: "Fixed",
    days: ["Sunday"],
    effectiveFrom: "01/07/2026",
    effectiveTo: "31/07/2026",
    status: "Expired",
    assignedBy: "Housekeeping Admin",
  },
];

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function WeeklyOffView() {
  const [assignments, setAssignments] = useState<WeeklyOffAssignment[]>(INITIAL_WEEKLY_OFFS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedDay, setSelectedDay] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Modals & Drawers state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<WeeklyOffAssignment | null>(null);
  const [viewingAssignment, setViewingAssignment] = useState<WeeklyOffAssignment | null>(null);

  // Single Assign Form State
  const [assignEmpId, setAssignEmpId] = useState("EMP-0101");
  const [assignType, setAssignType] = useState<"Fixed" | "Rotational">("Fixed");
  const [assignDays, setAssignDays] = useState<string[]>(["Sunday"]);
  const [assignRotationPattern, setAssignRotationPattern] = useState("");
  const [assignEffectiveFrom, setAssignEffectiveFrom] = useState("2026-08-01");
  const [assignEffectiveTo, setAssignEffectiveTo] = useState("2026-12-31");
  const [assignRemarks, setAssignRemarks] = useState("");

  // Bulk Assign Form State
  const [bulkDepartment, setBulkDepartment] = useState("Front Office");
  const [bulkType, setBulkType] = useState<"Fixed" | "Rotational">("Fixed");
  const [bulkDays, setBulkDays] = useState<string[]>(["Sunday"]);
  const [bulkEffectiveFrom, setBulkEffectiveFrom] = useState("2026-08-01");
  const [bulkEffectiveTo, setBulkEffectiveTo] = useState("2026-12-31");

  // Filtered Assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const matchSearch =
        a.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.days.join(" ").toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = selectedDepartment === "ALL" || a.department === selectedDepartment;
      const matchType = selectedType === "ALL" || a.type === selectedType;
      const matchDay = selectedDay === "ALL" || a.days.includes(selectedDay);
      const matchStatus = selectedStatus === "ALL" || a.status === selectedStatus;

      return matchSearch && matchDept && matchType && matchDay && matchStatus;
    });
  }, [assignments, searchTerm, selectedDepartment, selectedType, selectedDay, selectedStatus]);

  // KPI Metrics
  const kpiMetrics = useMemo(() => {
    const totalAssigned = assignments.length;
    const fixed = assignments.filter((a) => a.type === "Fixed" && a.status === "Active").length + 76; // Mock total staff
    const rotational = assignments.filter((a) => a.type === "Rotational" && a.status === "Active").length + 20;
    const upcoming = assignments.filter((a) => a.status === "Upcoming").length + 4;
    return { totalAssigned: 106, fixed, rotational, upcoming };
  }, [assignments]);

  // Bulk preview list
  const bulkPreviewStaff = useMemo(() => {
    if (bulkDepartment === "ALL") return INITIAL_WEEKLY_OFFS;
    return INITIAL_WEEKLY_OFFS.filter((a) => a.department === bulkDepartment);
  }, [bulkDepartment]);

  // Handlers
  const handleToggleDay = (day: string, currentDays: string[], setDays: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (currentDays.includes(day)) {
      if (currentDays.length > 1) {
        setDays(currentDays.filter((d) => d !== day));
      }
    } else {
      setDays([...currentDays, day]);
    }
  };

  const handleOpenSingleAssign = (existing?: WeeklyOffAssignment) => {
    if (existing) {
      setEditingAssignment(existing);
      setAssignEmpId(existing.employeeId);
      setAssignType(existing.type);
      setAssignDays(existing.days);
      setAssignRotationPattern(existing.rotationPattern || "");
      setAssignRemarks(existing.remarks || "");
    } else {
      setEditingAssignment(null);
      setAssignEmpId("EMP-0101");
      setAssignType("Fixed");
      setAssignDays(["Sunday"]);
      setAssignRotationPattern("");
      setAssignRemarks("");
    }
    setIsAssignModalOpen(true);
  };

  const handleSaveSingleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    const empObj = INITIAL_WEEKLY_OFFS.find((x) => x.employeeId === assignEmpId);
    const empName = empObj?.employeeName || "Rajesh Kumar";
    const empDept = empObj?.department || "Front Office";
    const empDesig = empObj?.designation || "Staff";
    const empAvatar = empObj?.avatar || "RK";

    const fromParts = assignEffectiveFrom.split("-");
    const toParts = assignEffectiveTo.split("-");
    const formattedFrom = fromParts.length === 3 ? `${fromParts[2]}/${fromParts[1]}/${fromParts[0]}` : assignEffectiveFrom;
    const formattedTo = toParts.length === 3 ? `${toParts[2]}/${toParts[1]}/${toParts[0]}` : assignEffectiveTo;

    if (editingAssignment) {
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === editingAssignment.id
            ? {
                ...a,
                type: assignType,
                days: assignDays,
                rotationPattern: assignType === "Rotational" ? assignRotationPattern || "Rotational Weekly Off" : undefined,
                effectiveFrom: formattedFrom,
                effectiveTo: formattedTo,
                remarks: assignRemarks,
              }
            : a
        )
      );
      setToastMessage(`Updated weekly off for ${empName} (${assignDays.join(", ")}).`);
    } else {
      const newWO: WeeklyOffAssignment = {
        id: `WO-${Math.floor(400 + Math.random() * 600)}`,
        employeeId: assignEmpId,
        employeeName: empName,
        department: empDept,
        designation: empDesig,
        avatar: empAvatar,
        type: assignType,
        days: assignDays,
        rotationPattern: assignType === "Rotational" ? assignRotationPattern || "Rotational Weekly Off" : undefined,
        effectiveFrom: formattedFrom,
        effectiveTo: formattedTo,
        status: "Active",
        assignedBy: "Neha Mehta (HR Admin)",
        remarks: assignRemarks || "Assigned via Weekly Off Center.",
      };

      setAssignments((prev) => [newWO, ...prev]);
      setToastMessage(`Assigned ${assignDays.join(", ")} weekly off to ${empName}.`);
    }
    setIsAssignModalOpen(false);
  };

  const handleSaveBulkAssign = (e: React.FormEvent) => {
    e.preventDefault();
    const fromParts = bulkEffectiveFrom.split("-");
    const toParts = bulkEffectiveTo.split("-");
    const formattedFrom = fromParts.length === 3 ? `${fromParts[2]}/${fromParts[1]}/${fromParts[0]}` : bulkEffectiveFrom;
    const formattedTo = toParts.length === 3 ? `${toParts[2]}/${toParts[1]}/${toParts[0]}` : bulkEffectiveTo;

    setAssignments((prev) =>
      prev.map((a) => {
        if (bulkDepartment === "ALL" || a.department === bulkDepartment) {
          return {
            ...a,
            type: bulkType,
            days: bulkDays,
            effectiveFrom: formattedFrom,
            effectiveTo: formattedTo,
            status: "Active",
            assignedBy: "HR Admin (Bulk Action)",
          };
        }
        return a;
      })
    );

    setIsBulkModalOpen(false);
    setToastMessage(`Bulk assigned ${bulkDays.join(", ")} weekly off to all ${bulkDepartment} staff.`);
  };

  const handleRemoveAssignment = (id: string, empName: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    setToastMessage(`Removed weekly off assignment for ${empName}.`);
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource / Attendance & Leave"
      title="Weekly Off Management"
      description="Define recurring weekly rest days (fixed or rotational) for employees and departments. Attendance uses this schedule to verify expected work days and calculate overtime."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Attendance & Leave" },
        { label: "Weekly Off Management" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => handleOpenSingleAssign()}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Assign Weekly Off
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsBulkModalOpen(true)}
            className="rounded-xl text-xs font-bold bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50 shadow-xs cursor-pointer"
          >
            <Users className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
            Bulk Assign
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setToastMessage("Exporting weekly off schedule to CSV...")}
            className="rounded-xl text-xs font-medium bg-white text-slate-700 border-slate-300 shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export Schedule
          </Button>
        </div>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: 4 KPI SUMMARY CARDS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Employees Assigned</p>
            <h4 className="text-2xl font-black text-slate-900 mt-1">{kpiMetrics.totalAssigned} Staff</h4>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">100% Scheduled Rest Days</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fixed Weekly Off</p>
            <h4 className="text-2xl font-black text-blue-900 mt-1">{kpiMetrics.fixed} Staff</h4>
            <p className="text-[11px] text-blue-700 font-semibold mt-0.5">Fixed Day Schedule</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
            <CalendarOff className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rotational Weekly Off</p>
            <h4 className="text-2xl font-black text-amber-900 mt-1">{kpiMetrics.rotational} Staff</h4>
            <p className="text-[11px] text-amber-700 font-semibold mt-0.5">Shift Roster Offs</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
            <Repeat className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upcoming Changes</p>
            <h4 className="text-2xl font-black text-purple-900 mt-1">{kpiMetrics.upcoming} Changes</h4>
            <p className="text-[11px] text-purple-700 font-semibold mt-0.5">Effective Next Month</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
            <Clock className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          INTEGRATION RULES NOTICE BANNER
      ───────────────────────────────────────────────────────────── */}
      <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-900 flex items-start gap-3">
        <Info className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Attendance &amp; Overtime Rules:</span> Weekly Off assignments define scheduled rest days. If an employee punch log is detected on their assigned Weekly Off, Attendance flags the day as <span className="font-bold">WORKED ON WEEKLY OFF</span> and automatically calculates <span className="font-bold text-emerald-950 underline">Overtime (2.0x Rate)</span> or <span className="font-bold text-emerald-950 underline">Comp-Off Eligibility</span>.
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: FILTERS TOOLBAR
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Employee Name, ID or Off Day..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50/50 font-medium text-slate-800"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setSelectedDepartment("ALL");
              setSelectedType("ALL");
              setSelectedDay("ALL");
              setSelectedStatus("ALL");
            }}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition self-end md:self-auto"
          >
            Reset Filters
          </button>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 py-1.5 px-2.5 bg-white font-medium"
            >
              <option value="ALL">All Departments</option>
              <option value="Front Office">Front Office</option>
              <option value="Housekeeping">Housekeeping</option>
              <option value="Food & Beverage">Food &amp; Beverage</option>
              <option value="Kitchen">Kitchen</option>
              <option value="HR">HR</option>
              <option value="Accounts">Accounts</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Weekly Off Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 py-1.5 px-2.5 bg-white font-medium"
            >
              <option value="ALL">All Off Types</option>
              <option value="Fixed">Fixed Schedule</option>
              <option value="Rotational">Rotational Shift Off</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Day of Week</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 py-1.5 px-2.5 bg-white font-medium"
            >
              <option value="ALL">All Days</option>
              {DAYS_OF_WEEK.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 py-1.5 px-2.5 bg-white font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">🟢 Active</option>
              <option value="Upcoming">🟡 Upcoming</option>
              <option value="Expired">🔴 Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: MAIN WEEKLY OFF ASSIGNMENTS TABLE
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Weekly Off Type</th>
                <th className="py-3 px-4">Weekly Off Day(s)</th>
                <th className="py-3 px-4">Effective From</th>
                <th className="py-3 px-4">Effective To</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssignments.map((a) => (
                <tr
                  key={a.id}
                  className="hover:bg-slate-50/80 transition cursor-pointer"
                  onClick={() => setViewingAssignment(a)}
                >
                  {/* Employee Info */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      {a.photoUrl ? (
                        <img
                          src={a.photoUrl}
                          alt={a.employeeName}
                          className="h-8 w-8 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-700 text-white font-bold text-xs shrink-0">
                          {a.avatar}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-900">{a.employeeName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{a.employeeId}</p>
                      </div>
                    </div>
                  </td>

                  {/* Department */}
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-800">{a.department}</p>
                    <p className="text-[10px] text-slate-500">{a.designation}</p>
                  </td>

                  {/* Type Badge */}
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-lg text-[11px] font-bold border",
                        a.type === "Fixed"
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : "bg-amber-100 text-amber-800 border-amber-200"
                      )}
                    >
                      {a.type === "Fixed" ? "📌 Fixed Schedule" : "🔄 Rotational Off"}
                    </span>
                  </td>

                  {/* Off Days */}
                  <td className="py-3 px-4">
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap gap-1">
                        {a.days.map((day) => (
                          <span
                            key={day}
                            className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold border border-emerald-200 text-[11px]"
                          >
                            🌴 {day}
                          </span>
                        ))}
                      </div>
                      {a.rotationPattern && (
                        <p className="text-[10px] text-slate-400 font-medium italic">{a.rotationPattern}</p>
                      )}
                    </div>
                  </td>

                  {/* Dates */}
                  <td className="py-3 px-4 font-medium text-slate-800">{a.effectiveFrom}</td>
                  <td className="py-3 px-4 font-medium text-slate-800">{a.effectiveTo}</td>

                  {/* Status Badge */}
                  <td className="py-3 px-4">
                    {a.status === "Active" && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        🟢 Active
                      </span>
                    )}
                    {a.status === "Upcoming" && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        🟡 Upcoming
                      </span>
                    )}
                    {a.status === "Expired" && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        🔴 Expired
                      </span>
                    )}
                  </td>

                  {/* Actions Column */}
                  <td
                    className="py-3 px-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setViewingAssignment(a)}
                        title="View Details"
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenSingleAssign(a)}
                        title="Edit Weekly Off"
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveAssignment(a.id, a.employeeName)}
                        title="Remove Weekly Off"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: SINGLE WEEKLY OFF ASSIGNMENT MODAL
      ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={editingAssignment ? `Edit Weekly Off: ${editingAssignment.employeeName}` : "Assign Weekly Off"}
        description="Assign recurring rest days to an employee with fixed or rotational patterns."
        size="md"
      >
        <form onSubmit={handleSaveSingleAssign} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Employee <span className="text-rose-500">*</span>
            </label>
            <select
              value={assignEmpId}
              onChange={(e) => setAssignEmpId(e.target.value)}
              required
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
            >
              {INITIAL_WEEKLY_OFFS.map((staff) => (
                <option key={staff.employeeId} value={staff.employeeId}>
                  👤 {staff.employeeName} ({staff.employeeId}) - {staff.department}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Weekly Off Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAssignType("Fixed")}
                className={cn(
                  "p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition",
                  assignType === "Fixed"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                📌 Fixed Schedule
              </button>

              <button
                type="button"
                onClick={() => setAssignType("Rotational")}
                className={cn(
                  "p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition",
                  assignType === "Rotational"
                    ? "bg-amber-50 border-amber-500 text-amber-900 shadow-2xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                🔄 Rotational Off
              </button>
            </div>
          </div>

          {/* Days Checkboxes Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Weekly Off Day(s) <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = assignDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleToggleDay(day, assignDays, setAssignDays)}
                    className={cn(
                      "py-2 px-2.5 rounded-xl text-xs font-bold border transition text-center",
                      isSelected
                        ? "bg-emerald-700 text-white border-emerald-800 shadow-2xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rotational Pattern Option */}
          {assignType === "Rotational" && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rotation Pattern Notes</label>
              <input
                type="text"
                placeholder="e.g. Week 1: Sunday, Week 2: Monday, Week 3: Tuesday"
                value={assignRotationPattern}
                onChange={(e) => setAssignRotationPattern(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Effective From <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={assignEffectiveFrom}
                onChange={(e) => setAssignEffectiveFrom(e.target.value)}
                required
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Effective To <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={assignEffectiveTo}
                onChange={(e) => setAssignEffectiveTo(e.target.value)}
                required
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAssignModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              Save Assignment
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: BULK WEEKLY OFF ASSIGNMENT MODAL
      ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Bulk Assign Weekly Off to Department"
        description="Assign weekly rest days in bulk across an entire department."
        size="lg"
      >
        <form onSubmit={handleSaveBulkAssign} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={bulkDepartment}
                onChange={(e) => setBulkDepartment(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
              >
                <option value="ALL">All Departments</option>
                <option value="Front Office">Front Office</option>
                <option value="Housekeeping">Housekeeping</option>
                <option value="Food & Beverage">Food &amp; Beverage</option>
                <option value="Kitchen">Kitchen</option>
                <option value="HR">HR</option>
                <option value="Accounts">Accounts</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Weekly Off Type</label>
              <select
                value={bulkType}
                onChange={(e) => setBulkType(e.target.value as "Fixed" | "Rotational")}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
              >
                <option value="Fixed">Fixed Schedule</option>
                <option value="Rotational">Rotational Shift Off</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Off Day(s)</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = bulkDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleToggleDay(day, bulkDays, setBulkDays)}
                    className={cn(
                      "py-2 px-2.5 rounded-xl text-xs font-bold border transition text-center",
                      isSelected
                        ? "bg-emerald-700 text-white border-emerald-800 shadow-2xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Effective From</label>
              <input
                type="date"
                value={bulkEffectiveFrom}
                onChange={(e) => setBulkEffectiveFrom(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Effective To</label>
              <input
                type="date"
                value={bulkEffectiveTo}
                onChange={(e) => setBulkEffectiveTo(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-medium"
              />
            </div>
          </div>

          {/* Interactive Affected Staff Preview */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-800 uppercase block">
              Affected Employees ({bulkPreviewStaff.length} Staff Selected):
            </span>
            <div className="max-h-36 overflow-y-auto space-y-1.5">
              {bulkPreviewStaff.map((emp) => (
                <div
                  key={emp.employeeId}
                  className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs"
                >
                  <span className="font-bold text-slate-900">
                    {emp.employeeName} ({emp.employeeId})
                  </span>
                  <span className="text-slate-500 text-[11px] font-semibold">{emp.department}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsBulkModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              Confirm Bulk Assignment
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          SIDE DRAWER: VIEW WEEKLY OFF DETAILS
      ───────────────────────────────────────────────────────────── */}
      {viewingAssignment && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in-50">
          <div
            className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2">
                  <CalendarOff className="h-5 w-5 text-emerald-700" />
                  <h3 className="font-bold text-sm text-slate-900">Weekly Off Schedule Details</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingAssignment(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900">{viewingAssignment.employeeName}</h4>
                    <span className="font-mono text-xs font-bold text-slate-600">{viewingAssignment.employeeId}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {viewingAssignment.designation} • <span className="text-emerald-700 font-semibold">{viewingAssignment.department}</span>
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Assignment Type</span>
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {viewingAssignment.type} Schedule
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {viewingAssignment.days.map((day) => (
                      <span key={day} className="px-3 py-1 rounded-xl bg-emerald-700 text-white text-xs font-bold shadow-2xs">
                        🌴 Every {day}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Effective Date Range</span>
                    <span className="font-bold text-slate-800">
                      {viewingAssignment.effectiveFrom} → {viewingAssignment.effectiveTo}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Attendance Overtime Rule</span>
                    <span className="font-bold text-emerald-700">2.0x OT or Comp-Off</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Assigned By</span>
                    <span className="font-semibold text-slate-800">{viewingAssignment.assignedBy}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <Button
                type="button"
                size="sm"
                onClick={() => handleOpenSingleAssign(viewingAssignment)}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold h-9"
              >
                <Edit2 className="mr-1 h-3.5 w-3.5" /> Edit Rest Day Schedule
              </Button>
            </div>
          </div>
        </div>
      )}
    </ModulePageShell>
  );
}
