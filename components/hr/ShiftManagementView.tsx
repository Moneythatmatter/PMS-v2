"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Repeat,
  Search,
  Filter,
  Plus,
  Users,
  Sun,
  Moon,
  Sunset,
  Clock,
  Calendar,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Upload,
  Download,
  X,
  User,
  Building2,
  Layers,
  ChevronDown,
  ChevronUp,
  Check,
  Sparkles,
  Info,
  History,
  Zap,
  CalendarDays,
  UserCheck,
  UserX,
  AlertCircle,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface MasterShiftTemplate {
  id: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  graceMinutes: number;
  color: string;
  badgeColor: string;
  category: "Morning" | "Evening" | "Night" | "General" | "Split";
}

export interface ShiftHistoryEntry {
  id: string;
  date: string;
  oldShift: string;
  newShift: string;
  changedBy: string;
  remarks?: string;
}

export interface ShiftAssignment {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  employmentType: "Permanent" | "Contractual" | "Probation" | "Trainee";
  avatar: string;
  photoUrl?: string;
  shiftId: string;
  shiftCode: string;
  shiftName: string;
  shiftCategory: "Morning" | "Evening" | "Night" | "General" | "Split";
  startTime: string;
  endTime: string;
  effectiveFrom: string;
  effectiveTo?: string; // Optional: If empty -> "Until Further Notice"
  status: "Active" | "Upcoming" | "Expired" | "Inactive";
  assignedBy: string;
  assignedOn: string;
  remarks?: string;
  history?: ShiftHistoryEntry[];
}

export const MASTER_SHIFTS: MasterShiftTemplate[] = [
  {
    id: "shift-m1",
    code: "MS-01",
    name: "Morning Shift (A)",
    startTime: "07:00",
    endTime: "15:30",
    breakMinutes: 45,
    graceMinutes: 15,
    color: "bg-amber-100 text-amber-800 border-amber-300",
    badgeColor: "bg-amber-500 text-white",
    category: "Morning",
  },
  {
    id: "shift-e2",
    code: "ES-02",
    name: "Evening Shift (B)",
    startTime: "15:00",
    endTime: "23:30",
    breakMinutes: 45,
    graceMinutes: 15,
    color: "bg-blue-100 text-blue-800 border-blue-300",
    badgeColor: "bg-blue-600 text-white",
    category: "Evening",
  },
  {
    id: "shift-n3",
    code: "NS-03",
    name: "Night Shift (C)",
    startTime: "23:00",
    endTime: "07:30",
    breakMinutes: 45,
    graceMinutes: 15,
    color: "bg-purple-100 text-purple-800 border-purple-300",
    badgeColor: "bg-purple-600 text-white",
    category: "Night",
  },
  {
    id: "shift-g4",
    code: "GS-04",
    name: "General Office Shift",
    startTime: "09:00",
    endTime: "17:30",
    breakMinutes: 60,
    graceMinutes: 15,
    color: "bg-emerald-100 text-emerald-800 border-emerald-300",
    badgeColor: "bg-emerald-600 text-white",
    category: "General",
  },
  {
    id: "shift-s5",
    code: "SS-05",
    name: "Split Shift (F&B / Kitchen)",
    startTime: "11:00 - 15:00 & 19:00 - 23:00",
    endTime: "23:00",
    breakMinutes: 60,
    graceMinutes: 15,
    color: "bg-orange-100 text-orange-800 border-orange-300",
    badgeColor: "bg-orange-600 text-white",
    category: "Split",
  },
];

export const INITIAL_ASSIGNMENTS: ShiftAssignment[] = [
  {
    id: "SA-101",
    employeeId: "EMP-0101",
    employeeName: "Rajesh Kumar",
    department: "Front Office",
    designation: "Front Desk Manager",
    employmentType: "Permanent",
    avatar: "RK",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    shiftId: "shift-m1",
    shiftCode: "MS-01",
    shiftName: "Morning Shift (A)",
    shiftCategory: "Morning",
    startTime: "07:00",
    endTime: "15:30",
    effectiveFrom: "01/01/2026",
    effectiveTo: undefined, // Until Further Notice
    status: "Active",
    assignedBy: "Neha Mehta (HR)",
    assignedOn: "15/12/2025",
    remarks: "Standard Manager Roster.",
    history: [
      { id: "h1", date: "01/01/2026", oldShift: "Evening Shift (ES-02)", newShift: "Morning Shift (MS-01)", changedBy: "Neha Mehta (HR)", remarks: "Annual Manager Roster Swap" },
      { id: "h2", date: "01/06/2025", oldShift: "General Shift (GS-04)", newShift: "Evening Shift (ES-02)", changedBy: "HR Recruiter", remarks: "Promotion Shift Change" },
    ],
  },
  {
    id: "SA-102",
    employeeId: "EMP-0102",
    employeeName: "Anjali Sharma",
    department: "Housekeeping",
    designation: "Executive Housekeeper",
    employmentType: "Permanent",
    avatar: "AS",
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150",
    shiftId: "shift-g4",
    shiftCode: "GS-04",
    shiftName: "General Office Shift",
    shiftCategory: "General",
    startTime: "09:00",
    endTime: "17:30",
    effectiveFrom: "01/06/2021",
    effectiveTo: undefined,
    status: "Active",
    assignedBy: "Neha Mehta (HR)",
    assignedOn: "01/06/2021",
    history: [
      { id: "h3", date: "01/06/2021", oldShift: "None", newShift: "General Office Shift (GS-04)", changedBy: "Neha Mehta (HR)", remarks: "Initial Onboarding Shift" },
    ],
  },
  {
    id: "SA-103",
    employeeId: "EMP-0103",
    employeeName: "Chef Vikramjit Singh",
    department: "Food & Beverage",
    designation: "Executive Head Chef",
    employmentType: "Permanent",
    avatar: "VS",
    shiftId: "shift-s5",
    shiftCode: "SS-05",
    shiftName: "Split Shift (F&B / Kitchen)",
    shiftCategory: "Split",
    startTime: "11:00 - 15:00 & 19:00 - 23:00",
    endTime: "23:00",
    effectiveFrom: "01/08/2026",
    effectiveTo: "31/08/2026",
    status: "Active",
    assignedBy: "Neha Mehta (HR)",
    assignedOn: "25/07/2026",
    remarks: "Kitchen split hours.",
  },
  {
    id: "SA-104",
    employeeId: "EMP-0104",
    employeeName: "Priya Patel",
    department: "Front Office",
    designation: "Guest Relations Executive",
    employmentType: "Permanent",
    avatar: "PP",
    shiftId: "shift-e2",
    shiftCode: "ES-02",
    shiftName: "Evening Shift (B)",
    shiftCategory: "Evening",
    startTime: "15:00",
    endTime: "23:30",
    effectiveFrom: "01/08/2026",
    effectiveTo: "17/08/2026",
    status: "Active",
    assignedBy: "HR Admin",
    assignedOn: "28/07/2026",
  },
  {
    id: "SA-105",
    employeeId: "EMP-0105",
    employeeName: "Arjun Verma",
    department: "Food & Beverage",
    designation: "Restaurant Captain",
    employmentType: "Contractual",
    avatar: "AV",
    shiftId: "shift-e2",
    shiftCode: "ES-02",
    shiftName: "Evening Shift (B)",
    shiftCategory: "Evening",
    startTime: "15:00",
    endTime: "23:30",
    effectiveFrom: "01/08/2026",
    effectiveTo: "31/08/2026",
    status: "Active",
    assignedBy: "HR Admin",
    assignedOn: "29/07/2026",
  },
  {
    id: "SA-106",
    employeeId: "EMP-0106",
    employeeName: "Meera Nair",
    department: "Front Office",
    designation: "Concierge Lead",
    employmentType: "Permanent",
    avatar: "MN",
    shiftId: "shift-n3",
    shiftCode: "NS-03",
    shiftName: "Night Shift (C)",
    shiftCategory: "Night",
    startTime: "23:00",
    endTime: "07:30",
    effectiveFrom: "01/08/2026",
    effectiveTo: undefined,
    status: "Active",
    assignedBy: "Neha Mehta (HR)",
    assignedOn: "30/07/2026",
  },
  {
    id: "SA-107",
    employeeId: "EMP-0107",
    employeeName: "Sanjay Dutt",
    department: "Accounts",
    designation: "Senior Accountant",
    employmentType: "Permanent",
    avatar: "SD",
    shiftId: "shift-g4",
    shiftCode: "GS-04",
    shiftName: "General Office Shift",
    shiftCategory: "General",
    startTime: "09:00",
    endTime: "17:30",
    effectiveFrom: "01/08/2024",
    effectiveTo: undefined,
    status: "Active",
    assignedBy: "Finance Mgr",
    assignedOn: "01/08/2024",
  },
  {
    id: "SA-108",
    employeeId: "EMP-0108",
    employeeName: "Kavita Reddy",
    department: "Housekeeping",
    designation: "Room Attendant",
    employmentType: "Probation",
    avatar: "KR",
    shiftId: "shift-m1",
    shiftCode: "MS-01",
    shiftName: "Morning Shift (A)",
    shiftCategory: "Morning",
    startTime: "07:00",
    endTime: "15:30",
    effectiveFrom: "01/09/2026",
    effectiveTo: undefined,
    status: "Upcoming",
    assignedBy: "Housekeeping Admin",
    assignedOn: "05/08/2026",
  },
];

export function ShiftManagementView() {
  const [assignments, setAssignments] = useState<ShiftAssignment[]>(INITIAL_ASSIGNMENTS);
  const [viewMode, setViewMode] = useState<"table" | "roster">("table");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Single-Line Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("ALL");
  const [selectedShiftType, setSelectedShiftType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [showFilterPanel, setShowFilterPanel] = useState<boolean>(false);

  // Modals & Drawers State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isQuickChangeModalOpen, setIsQuickChangeModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [editingAssignment, setEditingAssignment] = useState<ShiftAssignment | null>(null);
  const [quickChangeTarget, setQuickChangeTarget] = useState<ShiftAssignment | null>(null);
  const [historyTarget, setHistoryTarget] = useState<ShiftAssignment | null>(null);
  const [viewingAssignment, setViewingAssignment] = useState<ShiftAssignment | null>(null);

  // Single Form State (With Live Search Employee Filter)
  const [assignEmpId, setAssignEmpId] = useState("");
  const [assignEmpQuery, setAssignEmpQuery] = useState("");
  const [isEmpComboboxOpen, setIsEmpComboboxOpen] = useState(false);
  const assignComboboxRef = useRef<HTMLDivElement>(null);
  const [assignShiftId, setAssignShiftId] = useState("");

  // Close Employee Combobox Popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (assignComboboxRef.current && !assignComboboxRef.current.contains(event.target as Node)) {
        setIsEmpComboboxOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const [assignEffectiveFrom, setAssignEffectiveFrom] = useState("2026-08-01");
  const [assignEffectiveTo, setAssignEffectiveTo] = useState("");
  const [assignRemarks, setAssignRemarks] = useState("");
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Quick Change State
  const [quickNewShiftId, setQuickNewShiftId] = useState("shift-e2");

  // Flexible Bulk Form State
  const [bulkApplyTo, setBulkApplyTo] = useState<"Department" | "Employees" | "Designation" | "EmploymentType">("Department");
  const [bulkDepartment, setBulkDepartment] = useState("");
  const [bulkDesignation, setBulkDesignation] = useState("");
  const [bulkEmploymentType, setBulkEmploymentType] = useState("");
  const [bulkShiftId, setBulkShiftId] = useState("");
  const [bulkEffectiveFrom, setBulkEffectiveFrom] = useState("2026-08-01");
  const [bulkEffectiveTo, setBulkEffectiveTo] = useState("");

  // Filtered Assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const matchSearch =
        a.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.shiftName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.shiftCode.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = selectedDepartment === "ALL" || a.department === selectedDepartment;
      const matchShift = selectedShiftType === "ALL" || a.shiftId === selectedShiftType;
      const matchStatus = selectedStatus === "ALL" || a.status === selectedStatus;

      return matchSearch && matchDept && matchShift && matchStatus;
    });
  }, [assignments, searchTerm, selectedDepartment, selectedShiftType, selectedStatus]);

  // Real-Time Coverage Breakdown Widget Metrics
  const coverageMetrics = useMemo(() => {
    const activeAssigned = assignments.filter((a) => a.status === "Active");
    const morning = activeAssigned.filter((a) => a.shiftCategory === "Morning").length + 10;
    const evening = activeAssigned.filter((a) => a.shiftCategory === "Evening").length + 6;
    const night = activeAssigned.filter((a) => a.shiftCategory === "Night").length + 3;
    const weeklyOff = 2;
    const unassigned = 1; // 1 Staff has no shift assigned!
    return { morning, evening, night, weeklyOff, unassigned, total: morning + evening + night + weeklyOff + unassigned };
  }, [assignments]);

  // Upcoming Shift Changes List (Improvement #6)
  const upcomingChanges = useMemo(() => {
    return [
      { empName: "Rajesh Kumar", empId: "EMP-0101", fromShift: "Morning", toShift: "Evening", effectiveDate: "15 Aug 2026" },
      { empName: "Priya Patel", empId: "EMP-0104", fromShift: "Evening", toShift: "Night", effectiveDate: "18 Aug 2026" },
      { empName: "Kavita Reddy", empId: "EMP-0108", fromShift: "General", toShift: "Morning", effectiveDate: "01 Sep 2026" },
    ];
  }, []);

  // Conflict Detection Check (Improvement #3)
  const checkConflict = (empId: string, currentId?: string) => {
    const existing = assignments.find((a) => a.employeeId === empId && a.status === "Active" && a.id !== currentId);
    if (existing) {
      setConflictWarning(
        `⚠️ Conflict Warning: ${existing.employeeName} (${existing.employeeId}) is currently assigned to ${existing.shiftName} (${existing.shiftCode}). Saving will update the active roster assignment.`
      );
    } else {
      setConflictWarning(null);
    }
  };

  // Bulk Preview Staff List (Improvement #7)
  const bulkPreviewStaff = useMemo(() => {
    if (bulkApplyTo === "Department") {
      if (!bulkDepartment) return [];
      return assignments.filter((a) => bulkDepartment === "ALL" || a.department === bulkDepartment);
    } else if (bulkApplyTo === "Designation") {
      if (!bulkDesignation) return [];
      return assignments.filter((a) => a.designation === bulkDesignation);
    } else if (bulkApplyTo === "EmploymentType") {
      if (!bulkEmploymentType) return [];
      return assignments.filter((a) => a.employmentType === bulkEmploymentType);
    }
    return [];
  }, [assignments, bulkApplyTo, bulkDepartment, bulkDesignation, bulkEmploymentType]);

  // Single Assign Handler
  const handleOpenSingleAssign = (existing?: ShiftAssignment) => {
    if (existing) {
      setEditingAssignment(existing);
      setAssignEmpId(existing.employeeId);
      setAssignEmpQuery(`${existing.employeeName} (${existing.employeeId}) - ${existing.department}`);
      setIsEmpComboboxOpen(false);
      setAssignShiftId(existing.shiftId);
      setAssignEffectiveFrom("2026-08-01");
      setAssignEffectiveTo(existing.effectiveTo || "");
      setAssignRemarks(existing.remarks || "");
      checkConflict(existing.employeeId, existing.id);
    } else {
      const todayIso = new Date().toISOString().split("T")[0];
      setEditingAssignment(null);
      setAssignEmpId("");
      setAssignEmpQuery("");
      setIsEmpComboboxOpen(false);
      setAssignShiftId("");
      setAssignEffectiveFrom(todayIso);
      setAssignEffectiveTo("");
      setAssignRemarks("");
      setConflictWarning(null);
    }
    setIsAssignModalOpen(true);
  };

  const handleSaveSingleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    const shiftObj = MASTER_SHIFTS.find((s) => s.id === assignShiftId);
    if (!shiftObj) return;

    const fromParts = assignEffectiveFrom.split("-");
    const formattedFrom = fromParts.length === 3 ? `${fromParts[2]}/${fromParts[1]}/${fromParts[0]}` : assignEffectiveFrom;
    let formattedTo: string | undefined = undefined;
    if (assignEffectiveTo) {
      const toParts = assignEffectiveTo.split("-");
      formattedTo = toParts.length === 3 ? `${toParts[2]}/${toParts[1]}/${toParts[0]}` : assignEffectiveTo;
    }

    const targetEmp = INITIAL_ASSIGNMENTS.find((x) => x.employeeId === assignEmpId);
    const empName = targetEmp?.employeeName || "Rajesh Kumar";
    const empDept = targetEmp?.department || "Front Office";
    const empDesig = targetEmp?.designation || "Staff";
    const empAvatar = targetEmp?.avatar || "RK";

    if (editingAssignment) {
      const oldShiftName = editingAssignment.shiftName;
      const historyLog: ShiftHistoryEntry[] = [
        {
          id: `h-${Date.now()}`,
          date: new Date().toLocaleDateString("en-GB"),
          oldShift: oldShiftName,
          newShift: shiftObj.name,
          changedBy: "Neha Mehta (HR)",
          remarks: assignRemarks || "Shift modified via Management Center",
        },
        ...(editingAssignment.history || []),
      ];

      setAssignments((prev) =>
        prev.map((a) =>
          a.id === editingAssignment.id
            ? {
                ...a,
                shiftId: shiftObj.id,
                shiftCode: shiftObj.code,
                shiftName: shiftObj.name,
                shiftCategory: shiftObj.category,
                startTime: shiftObj.startTime,
                endTime: shiftObj.endTime,
                effectiveFrom: formattedFrom,
                effectiveTo: formattedTo,
                remarks: assignRemarks,
                history: historyLog,
              }
            : a
        )
      );
      setToastMessage(`Updated shift assignment for ${empName} to ${shiftObj.name}.`);
    } else {
      const newAssignment: ShiftAssignment = {
        id: `SA-${Math.floor(100 + Math.random() * 900)}`,
        employeeId: assignEmpId,
        employeeName: empName,
        department: empDept,
        designation: empDesig,
        employmentType: "Permanent",
        avatar: empAvatar,
        shiftId: shiftObj.id,
        shiftCode: shiftObj.code,
        shiftName: shiftObj.name,
        shiftCategory: shiftObj.category,
        startTime: shiftObj.startTime,
        endTime: shiftObj.endTime,
        effectiveFrom: formattedFrom,
        effectiveTo: formattedTo,
        status: "Active",
        assignedBy: "Neha Mehta (HR)",
        assignedOn: new Date().toLocaleDateString("en-GB"),
        remarks: assignRemarks || "Assigned via Shift Management.",
        history: [
          {
            id: `h-${Date.now()}`,
            date: new Date().toLocaleDateString("en-GB"),
            oldShift: "None",
            newShift: shiftObj.name,
            changedBy: "Neha Mehta (HR)",
            remarks: "Initial Roster Assignment",
          },
        ],
      };
      setAssignments((prev) => [newAssignment, ...prev]);
      setToastMessage(`Assigned ${shiftObj.name} to ${empName}.`);
    }
    setIsAssignModalOpen(false);
  };

  // Quick Shift Change Handler (Improvement #5)
  const handleOpenQuickChange = (a: ShiftAssignment) => {
    setQuickChangeTarget(a);
    setQuickNewShiftId(a.shiftId === "shift-m1" ? "shift-e2" : "shift-m1");
    setIsQuickChangeModalOpen(true);
  };

  const handleSaveQuickChange = () => {
    if (!quickChangeTarget) return;
    const shiftObj = MASTER_SHIFTS.find((s) => s.id === quickNewShiftId);
    if (!shiftObj) return;

    const oldShiftName = quickChangeTarget.shiftName;
    const historyLog: ShiftHistoryEntry[] = [
      {
        id: `h-${Date.now()}`,
        date: new Date().toLocaleDateString("en-GB"),
        oldShift: oldShiftName,
        newShift: shiftObj.name,
        changedBy: "Neha Mehta (Quick Action)",
        remarks: "1-Click Quick Shift Swap",
      },
      ...(quickChangeTarget.history || []),
    ];

    setAssignments((prev) =>
      prev.map((a) =>
        a.id === quickChangeTarget.id
          ? {
              ...a,
              shiftId: shiftObj.id,
              shiftCode: shiftObj.code,
              shiftName: shiftObj.name,
              shiftCategory: shiftObj.category,
              startTime: shiftObj.startTime,
              endTime: shiftObj.endTime,
              history: historyLog,
            }
          : a
      )
    );

    setIsQuickChangeModalOpen(false);
    setToastMessage(`Quick swapped ${quickChangeTarget.employeeName} to ${shiftObj.name}.`);
  };

  // End Assignment Action (Improvement #4)
  const handleEndAssignment = (id: string, empName: string) => {
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: "Inactive",
              effectiveTo: new Date().toLocaleDateString("en-GB"),
            }
          : a
      )
    );
    setToastMessage(`Ended shift assignment for ${empName}. Assignment marked Inactive with today's end date.`);
  };

  // Save Bulk Assignment (Improvement #7)
  const handleSaveBulkAssign = (e: React.FormEvent) => {
    e.preventDefault();
    const shiftObj = MASTER_SHIFTS.find((s) => s.id === bulkShiftId);
    if (!shiftObj) return;

    const fromParts = bulkEffectiveFrom.split("-");
    const formattedFrom = fromParts.length === 3 ? `${fromParts[2]}/${fromParts[1]}/${fromParts[0]}` : bulkEffectiveFrom;
    let formattedTo: string | undefined = undefined;
    if (bulkEffectiveTo) {
      const toParts = bulkEffectiveTo.split("-");
      formattedTo = toParts.length === 3 ? `${toParts[2]}/${toParts[1]}/${toParts[0]}` : bulkEffectiveTo;
    }

    setAssignments((prev) =>
      prev.map((a) => {
        let match = false;
        if (bulkApplyTo === "Department") match = bulkDepartment === "ALL" || a.department === bulkDepartment;
        else if (bulkApplyTo === "Designation") match = a.designation === bulkDesignation;
        else if (bulkApplyTo === "EmploymentType") match = a.employmentType === bulkEmploymentType;
        else match = true;

        if (match) {
          return {
            ...a,
            shiftId: shiftObj.id,
            shiftCode: shiftObj.code,
            shiftName: shiftObj.name,
            shiftCategory: shiftObj.category,
            startTime: shiftObj.startTime,
            endTime: shiftObj.endTime,
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
    setToastMessage(`Bulk assigned ${shiftObj.name} to target staff.`);
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource / Attendance & Leave"
      title="Shift Management"
      description="Schedule and assign predefined shift templates to individual employees or departmental teams across property operations."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Attendance & Leave" },
        { label: "Shift Management" },
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
            Assign Shift
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
            onClick={() => setToastMessage("Exporting shift roster to CSV...")}
            className="rounded-xl text-xs font-medium bg-white text-slate-700 border-slate-300 shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export Roster
          </Button>
        </div>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: CURRENT SHIFT COVERAGE WIDGET & UPCOMING CHANGES
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-5">
        {/* Coverage Widget (Improvement #1) */}
        <div className="lg:col-span-8 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-700" />
                Current Shift Coverage Breakdown
              </h3>
              <p className="text-xs text-slate-500">Real-time roster distribution for active property operations.</p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              {coverageMetrics.total} Total Staff
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center text-xs">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
              <span className="text-[10px] font-bold uppercase text-amber-800 block">Morning Shift</span>
              <p className="text-2xl font-black text-amber-950">{coverageMetrics.morning}</p>
              <span className="text-[10px] text-amber-700 block">07:00 - 15:30</span>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 space-y-1">
              <span className="text-[10px] font-bold uppercase text-blue-800 block">Evening Shift</span>
              <p className="text-2xl font-black text-blue-950">{coverageMetrics.evening}</p>
              <span className="text-[10px] text-blue-700 block">15:00 - 23:30</span>
            </div>

            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 space-y-1">
              <span className="text-[10px] font-bold uppercase text-purple-800 block">Night Shift</span>
              <p className="text-2xl font-black text-purple-950">{coverageMetrics.night}</p>
              <span className="text-[10px] text-purple-700 block">23:00 - 07:30</span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
              <span className="text-[10px] font-bold uppercase text-emerald-800 block">Weekly Off</span>
              <p className="text-2xl font-black text-emerald-950">{coverageMetrics.weeklyOff}</p>
              <span className="text-[10px] text-emerald-700 block">Rest Day</span>
            </div>

            {/* Unassigned Warning Pill (Improvement #1) */}
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
              <span className="text-[10px] font-bold uppercase text-rose-800 block">Unassigned</span>
              <p className="text-2xl font-black text-rose-950">{coverageMetrics.unassigned}</p>
              <span className="text-[10px] text-rose-700 font-bold block">⚠️ Needs Shift</span>
            </div>
          </div>
        </div>

        {/* Upcoming Shift Changes Card (Improvement #6) */}
        <div className="lg:col-span-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-emerald-700" />
                Upcoming Shift Changes
              </h4>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full">
                {upcomingChanges.length} Scheduled
              </span>
            </div>

            <div className="space-y-2">
              {upcomingChanges.map((uc, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{uc.empName}</span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {uc.fromShift} → <strong className="text-emerald-700">{uc.toShift}</strong>
                    </span>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-mono font-bold text-slate-700 shadow-2xs">
                    {uc.effectiveDate}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: STREAMLINED STANDARDIZED TOOLBAR & VIEW TOGGLE
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs mb-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          {/* Full-width Rounded Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Employee, Shift Code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-8 py-2 text-xs rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white font-medium text-slate-800 shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Right-aligned Filter Dropdown & View Mode Switcher */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="rounded-full border-slate-200 text-xs font-bold gap-1.5 hidden md:inline-flex bg-white text-slate-700 hover:bg-slate-50 cursor-pointer px-4 shadow-2xs"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-700" />
              <span>Filters</span>
            </Button>

            {/* View Mode Switcher Pills */}
            <div className="flex items-center border border-slate-200 rounded-full p-0.5 bg-slate-50 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-full transition flex items-center gap-1.5 cursor-pointer",
                  viewMode === "table"
                    ? "bg-white text-emerald-800 shadow-2xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Table View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("roster")}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-full transition flex items-center gap-1.5 cursor-pointer",
                  viewMode === "roster"
                    ? "bg-white text-emerald-800 shadow-2xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                <span>Weekly Roster</span>
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Secondary Filters Drawer Bar */}
        {showFilterPanel && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in-50">
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="text-xs rounded-full border border-slate-200 py-1.5 px-3 bg-slate-50 font-bold text-slate-800"
              >
                <option value="ALL">All Departments</option>
                <option value="Front Office">Front Office</option>
                <option value="Housekeeping">Housekeeping</option>
                <option value="Food & Beverage">Food &amp; Beverage</option>
                <option value="Accounts">Accounts</option>
              </select>

              <select
                value={selectedShiftType}
                onChange={(e) => setSelectedShiftType(e.target.value)}
                className="text-xs rounded-full border border-slate-200 py-1.5 px-3 bg-slate-50 font-bold text-slate-800"
              >
                <option value="ALL">All Shifts</option>
                {MASTER_SHIFTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs rounded-full border border-slate-200 py-1.5 px-3 bg-slate-50 font-bold text-slate-800"
              >
                <option value="ALL">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedDepartment("ALL");
                setSelectedShiftType("ALL");
                setSelectedStatus("ALL");
              }}
              className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3A: TABLE VIEW (With End Assignment, History, Quick Change, Assigned By/On)
      ───────────────────────────────────────────────────────────── */}
      {viewMode === "table" ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Assigned Shift</th>
                  <th className="py-3 px-4">Effective From</th>
                  <th className="py-3 px-4">Effective To</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned By / On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssignments.map((a) => (
                  <tr
                    key={a.id}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                    onClick={() => setViewingAssignment(a)}
                  >
                    {/* Employee Name & Photo */}
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

                    {/* Shift */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-900 border border-slate-200">
                          <span>{a.shiftName}</span>
                          <span className="text-[10px] font-mono text-emerald-700 font-extrabold">({a.shiftCode})</span>
                        </span>
                        <p className="text-[11px] text-slate-500 font-semibold">⏰ {a.startTime} - {a.endTime}</p>
                      </div>
                    </td>

                    {/* Effective From / To */}
                    <td className="py-3 px-4 font-medium text-slate-700">{a.effectiveFrom}</td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {a.effectiveTo ? (
                        a.effectiveTo
                      ) : (
                        <span className="text-slate-600 font-semibold text-[11px]">
                          Until Further Notice
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      {a.status === "Active" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Active
                        </span>
                      )}
                      {a.status === "Upcoming" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                          Upcoming
                        </span>
                      )}
                      {(a.status === "Expired" || a.status === "Inactive") && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-300">
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Assigned By & Assigned On Columns */}
                    <td className="py-3 px-4 text-xs">
                      <p className="font-semibold text-slate-800">{a.assignedBy}</p>
                      <p className="text-[10px] text-slate-400">{a.assignedOn}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
            SECTION 3B: WEEKLY ROSTER MATRIX VIEW ⭐ (Improvement #8)
        ───────────────────────────────────────────────────────────── */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Weekly Roster Matrix — August 2026</h3>
              <p className="text-xs text-slate-500">Day-by-day shift distribution for department schedules.</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-bold">MS (Morning)</span>
              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-300 font-bold">ES (Evening)</span>
              <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-300 font-bold">NS (Night)</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">WO (Off)</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3 text-center">Mon (03)</th>
                  <th className="py-2.5 px-3 text-center">Tue (04)</th>
                  <th className="py-2.5 px-3 text-center">Wed (05)</th>
                  <th className="py-2.5 px-3 text-center">Thu (06)</th>
                  <th className="py-2.5 px-3 text-center">Fri (07)</th>
                  <th className="py-2.5 px-3 text-center">Sat (08)</th>
                  <th className="py-2.5 px-3 text-center">Sun (09)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssignments.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {emp.employeeName}
                      <span className="block text-[10px] text-slate-400 font-mono">{emp.department}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-1 rounded-lg bg-amber-100 text-amber-900 font-black border border-amber-300 text-[11px]">MS</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-1 rounded-lg bg-amber-100 text-amber-900 font-black border border-amber-300 text-[11px]">MS</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-1 rounded-lg bg-amber-100 text-amber-900 font-black border border-amber-300 text-[11px]">MS</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-1 rounded-lg bg-blue-100 text-blue-900 font-black border border-blue-300 text-[11px]">ES</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-1 rounded-lg bg-blue-100 text-blue-900 font-black border border-blue-300 text-[11px]">ES</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-1 rounded-lg bg-purple-100 text-purple-900 font-black border border-purple-300 text-[11px]">NS</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-black border border-emerald-300 text-[11px]">WO</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: SINGLE SHIFT ASSIGNMENT MODAL (With Conflict Alert & Optional To Date)
      ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={editingAssignment ? `Edit Shift Assignment` : "Assign Shift to Employee"}
        description="Assign a master shift type to an individual employee."
        size="md"
      >
        <form onSubmit={handleSaveSingleAssign} className="space-y-4">
          {/* Conflict Warning Box (Improvement #3) */}
          {conflictWarning && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <span>{conflictWarning}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Employee <span className="text-rose-500">*</span>
            </label>

            {/* Single Unified Searchable Employee Combobox */}
            <div className="relative" ref={assignComboboxRef}>
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={assignEmpQuery}
                onFocus={() => setIsEmpComboboxOpen(true)}
                onChange={(e) => {
                  setAssignEmpQuery(e.target.value);
                  setIsEmpComboboxOpen(true);
                }}
                placeholder="Type employee name, ID or department to search..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-xs font-semibold text-slate-900 shadow-2xs focus:border-emerald-500 focus:outline-none"
              />
              {assignEmpQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setAssignEmpQuery("");
                    setAssignEmpId("");
                    setIsEmpComboboxOpen(true);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              )}

              {/* Combobox Dropdown Results List */}
              {isEmpComboboxOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl space-y-1 max-h-56 overflow-y-auto animate-in fade-in-50">
                  {INITIAL_ASSIGNMENTS.filter((staff) => {
                    if (!assignEmpQuery.trim()) return true;
                    const q = assignEmpQuery.toLowerCase().trim();
                    return (
                      staff.employeeName.toLowerCase().includes(q) ||
                      staff.employeeId.toLowerCase().includes(q) ||
                      staff.department.toLowerCase().includes(q) ||
                      staff.designation.toLowerCase().includes(q)
                    );
                  }).length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400 font-medium">
                      No matching employee found.
                    </div>
                  ) : (
                    INITIAL_ASSIGNMENTS.filter((staff) => {
                      if (!assignEmpQuery.trim()) return true;
                      const q = assignEmpQuery.toLowerCase().trim();
                      return (
                        staff.employeeName.toLowerCase().includes(q) ||
                        staff.employeeId.toLowerCase().includes(q) ||
                        staff.department.toLowerCase().includes(q) ||
                        staff.designation.toLowerCase().includes(q)
                      );
                    }).map((staff) => (
                      <div
                        key={staff.employeeId}
                        onClick={() => {
                          setAssignEmpId(staff.employeeId);
                          setAssignEmpQuery(`${staff.employeeName} (${staff.employeeId}) - ${staff.department}`);
                          setIsEmpComboboxOpen(false);
                          checkConflict(staff.employeeId, editingAssignment?.id);
                        }}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors hover:bg-slate-100/80 border border-transparent",
                          assignEmpId === staff.employeeId && "bg-emerald-50 text-emerald-900 border-emerald-200"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[10px] shrink-0">
                            {staff.avatar}
                          </div>
                          <div className="truncate">
                            <p className="font-bold text-xs text-slate-900 truncate">
                              {staff.employeeName} <span className="text-[10px] font-semibold text-emerald-700">({staff.employeeId})</span>
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">{staff.designation} • {staff.department}</p>
                          </div>
                        </div>
                        {assignEmpId === staff.employeeId && <Check className="h-4 w-4 text-emerald-600 shrink-0 ml-2" />}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Shift Type (From Masters → Shift Types) <span className="text-rose-500">*</span>
            </label>
            <select
              value={assignShiftId}
              onChange={(e) => setAssignShiftId(e.target.value)}
              required
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold text-slate-800"
            >
              <option value="">-- Select Shift Type --</option>
              {MASTER_SHIFTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code}) • {s.startTime} - {s.endTime}
                </option>
              ))}
            </select>
          </div>

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

            {/* Optional Effective To Date (Improvement #9) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Effective To <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="date"
                value={assignEffectiveTo}
                onChange={(e) => setAssignEffectiveTo(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-medium"
              />
              <span className="text-[10px] text-slate-400 block mt-1">Leave blank for "Until Further Notice"</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Remarks / Assignment Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Front Desk manager shift roster assignment..."
              value={assignRemarks}
              onChange={(e) => setAssignRemarks(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
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
              Save Shift Assignment
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: FLEXIBLE BULK SHIFT ASSIGNMENT MODAL (Improvement #7)
      ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Bulk Assign Shift"
        description="Assign a shift to multiple employees filtered by Department, Designation, or Employment Type."
        size="lg"
      >
        <form onSubmit={handleSaveBulkAssign} className="space-y-4">
          {/* Target Group Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Apply To Target Group:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setBulkApplyTo("Department")}
                className={cn(
                  "p-2 rounded-xl border text-xs font-bold transition",
                  bulkApplyTo === "Department" ? "bg-emerald-50 border-emerald-500 text-emerald-900" : "bg-white border-slate-200 text-slate-600"
                )}
              >
                Department
              </button>

              <button
                type="button"
                onClick={() => setBulkApplyTo("Designation")}
                className={cn(
                  "p-2 rounded-xl border text-xs font-bold transition",
                  bulkApplyTo === "Designation" ? "bg-emerald-50 border-emerald-500 text-emerald-900" : "bg-white border-slate-200 text-slate-600"
                )}
              >
                Designation
              </button>

              <button
                type="button"
                onClick={() => setBulkApplyTo("EmploymentType")}
                className={cn(
                  "p-2 rounded-xl border text-xs font-bold transition",
                  bulkApplyTo === "EmploymentType" ? "bg-emerald-50 border-emerald-500 text-emerald-900" : "bg-white border-slate-200 text-slate-600"
                )}
              >
                Employment Type
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {bulkApplyTo === "Department" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                <select
                  value={bulkDepartment}
                  onChange={(e) => setBulkDepartment(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold text-slate-800"
                >
                  <option value="">-- Select Department --</option>
                  <option value="ALL">All Departments</option>
                  <option value="Front Office">Front Office</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Kitchen / Culinary">Kitchen / Culinary</option>
                  <option value="F&B Service">F&amp;B Service</option>
                  <option value="Maintenance & Eng.">Maintenance &amp; Eng.</option>
                  <option value="HR & Admin">HR &amp; Admin</option>
                </select>
              </div>
            )}

            {bulkApplyTo === "Designation" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                <select
                  value={bulkDesignation}
                  onChange={(e) => setBulkDesignation(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold text-slate-800"
                >
                  <option value="">-- Select Designation --</option>
                  <option value="Front Desk Manager">Front Desk Manager</option>
                  <option value="Guest Relations Executive">Guest Relations Executive</option>
                  <option value="Executive Housekeeper">Executive Housekeeper</option>
                  <option value="Room Attendant">Room Attendant</option>
                  <option value="Executive Head Chef">Executive Head Chef</option>
                  <option value="Restaurant Captain">Restaurant Captain</option>
                </select>
              </div>
            )}

            {bulkApplyTo === "EmploymentType" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Employment Type</label>
                <select
                  value={bulkEmploymentType}
                  onChange={(e) => setBulkEmploymentType(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold text-slate-800"
                >
                  <option value="">-- Select Employment Type --</option>
                  <option value="Permanent">Permanent</option>
                  <option value="Contractual">Contractual</option>
                  <option value="Probation">Probation</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Shift</label>
              <select
                value={bulkShiftId}
                onChange={(e) => setBulkShiftId(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold text-slate-800"
              >
                <option value="">-- Select Shift Type --</option>
                {MASTER_SHIFTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive Preview */}
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
          MODAL 3: QUICK SHIFT CHANGE MODAL (Improvement #5)
      ───────────────────────────────────────────────────────────── */}
      {quickChangeTarget && (
        <Modal
          isOpen={isQuickChangeModalOpen}
          onClose={() => setIsQuickChangeModalOpen(false)}
          title={`Quick Shift Swap for ${quickChangeTarget.employeeName}`}
          description={`Currently assigned: ${quickChangeTarget.shiftName} (${quickChangeTarget.shiftCode})`}
          size="sm"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select New Shift</label>
              <select
                value={quickNewShiftId}
                onChange={(e) => setQuickNewShiftId(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-bold text-slate-900"
              >
                {MASTER_SHIFTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code}) • {s.startTime} - {s.endTime}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsQuickChangeModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveQuickChange}
                className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                Confirm Shift Swap
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 4: SHIFT ASSIGNMENT HISTORY MODAL (Improvement #2)
      ───────────────────────────────────────────────────────────── */}
      {historyTarget && (
        <Modal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          title={`Shift History — ${historyTarget.employeeName}`}
          description={`Complete audit history log of all shift assignment changes for ${historyTarget.employeeId}.`}
          size="md"
        >
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Old Shift</th>
                    <th className="py-2.5 px-3">New Shift</th>
                    <th className="py-2.5 px-3">Changed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historyTarget.history && historyTarget.history.length > 0 ? (
                    historyTarget.history.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{h.date}</td>
                        <td className="py-2.5 px-3 text-slate-500">{h.oldShift}</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-800">{h.newShift}</td>
                        <td className="py-2.5 px-3 text-slate-600 font-medium">{h.changedBy}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400 italic">
                        No previous shift history recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button
                type="button"
                size="sm"
                onClick={() => setIsHistoryModalOpen(false)}
                className="rounded-xl text-xs font-bold bg-slate-800 text-white"
              >
                Close History
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SIDE DRAWER: VIEW ASSIGNMENT DETAILS
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
                  <Clock className="h-5 w-5 text-emerald-700" />
                  <h3 className="font-bold text-sm text-slate-900">Shift Schedule Details</h3>
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
                    <span className="text-xs font-bold text-slate-500">Assigned Shift</span>
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {viewingAssignment.shiftCode}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900">{viewingAssignment.shiftName}</h3>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Check-In Time</span>
                      <span className="font-bold text-slate-900">{viewingAssignment.startTime} AM</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Check-Out Time</span>
                      <span className="font-bold text-slate-900">{viewingAssignment.endTime} PM</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Effective Date Range</span>
                    <span className="font-bold text-slate-800">
                      {viewingAssignment.effectiveFrom} → {viewingAssignment.effectiveTo || "Until Further Notice"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Assigned By / On</span>
                    <span className="font-semibold text-slate-800">
                      {viewingAssignment.assignedBy} ({viewingAssignment.assignedOn})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const target = viewingAssignment;
                    setViewingAssignment(null);
                    handleOpenSingleAssign(target);
                  }}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold h-9 cursor-pointer"
                >
                  <Edit2 className="mr-1 h-3.5 w-3.5" /> Edit Shift
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const target = viewingAssignment;
                    setViewingAssignment(null);
                    handleOpenQuickChange(target);
                  }}
                  className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold h-9 cursor-pointer"
                >
                  <Zap className="mr-1 h-3.5 w-3.5 text-amber-600 fill-amber-500" /> Quick Swap
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setHistoryTarget(viewingAssignment);
                    setIsHistoryModalOpen(true);
                  }}
                  className="flex-1 text-slate-700 bg-white border-slate-300 rounded-xl text-xs font-bold h-9 cursor-pointer"
                >
                  <History className="mr-1 h-3.5 w-3.5" /> View History
                </Button>

                {viewingAssignment.status === "Active" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const targetId = viewingAssignment.id;
                      const targetName = viewingAssignment.employeeName;
                      setViewingAssignment(null);
                      handleEndAssignment(targetId, targetName);
                    }}
                    className="flex-1 text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200 rounded-xl text-xs font-bold h-9 cursor-pointer"
                  >
                    End Assignment
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </ModulePageShell>
  );
}
