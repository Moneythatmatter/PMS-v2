"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Calendar,
  Search,
  Filter,
  Plus,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Check,
  X,
  Printer,
  Info,
  CalendarDays,
  MessageSquare,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  TrendingDown,
  Layers,
  ArrowRight,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, StatusBadge, SearchSelect } from "@/components/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import { HREmployeeCell } from "@/components/hr/shared/HREmployeeCell";
import { cn } from "@/lib/utils";

export interface LeaveTypeMaster {
  id: string;
  code: string;
  name: string;
  annualQuota: number;
  isPaid: boolean;
  colorClass: string;
}

export interface EmployeeLeaveBalance {
  casualLeave: { total: number; used: number; remaining: number; pending: number; expires: string };
  sickLeave: { total: number; used: number; remaining: number; pending: number; expires: string };
  earnedLeave: { total: number; used: number; remaining: number; pending: number; expires: string };
  compOff: { remaining: number; used: number; pending: number; expires: string };
}

export interface ApprovalStep {
  role: string;
  approverName: string;
  status: "Approved" | "Pending" | "Rejected";
  date?: string;
}

export interface LeaveApplication {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  avatar: string;
  photoUrl?: string;
  leaveTypeId: string;
  leaveTypeCode: string;
  leaveTypeName: string;
  isPaid: boolean;
  durationOption: "Full Day" | "First Half" | "Second Half";
  priority: "Normal" | "Urgent" | "Emergency";
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason: string;
  attachmentName?: string;
  status: "Pending" | "Approved" | "Rejected" | "Cancelled";
  appliedOn: string;
  approvedBy?: string;
  clarificationRequest?: string;
  approvalChain: ApprovalStep[];
  balances: EmployeeLeaveBalance;
}

export const MASTER_LEAVE_TYPES: LeaveTypeMaster[] = [
  { id: "lt-cl", code: "CL", name: "Casual Leave", annualQuota: 10, isPaid: true, colorClass: "bg-blue-100 text-blue-800 border-blue-200" },
  { id: "lt-sl", code: "SL", name: "Sick Leave", annualQuota: 12, isPaid: true, colorClass: "bg-rose-100 text-rose-800 border-rose-200" },
  { id: "lt-el", code: "EL", name: "Earned / Privilege Leave", annualQuota: 15, isPaid: true, colorClass: "bg-purple-100 text-purple-800 border-purple-200" },
  { id: "lt-co", code: "COMP", name: "Compensatory Off", annualQuota: 5, isPaid: true, colorClass: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { id: "lt-lop", code: "LOP", name: "Loss of Pay", annualQuota: 0, isPaid: false, colorClass: "bg-amber-100 text-amber-800 border-amber-200" },
  { id: "lt-ml", code: "ML", name: "Maternity / Paternity Leave", annualQuota: 90, isPaid: true, colorClass: "bg-pink-100 text-pink-800 border-pink-200" },
];

export const INITIAL_LEAVE_APPLICATIONS: LeaveApplication[] = [
  {
    id: "LA-201",
    employeeId: "EMP-0101",
    employeeName: "Rajesh Kumar",
    department: "Front Office",
    designation: "Front Desk Manager",
    avatar: "RK",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    leaveTypeId: "lt-cl",
    leaveTypeCode: "CL",
    leaveTypeName: "Casual Leave",
    isPaid: true,
    durationOption: "Full Day",
    priority: "Normal",
    fromDate: "10/08/2026",
    toDate: "12/08/2026",
    totalDays: 3.0,
    reason: "Personal family event in hometown.",
    status: "Pending",
    appliedOn: "05/08/2026",
    approvalChain: [
      { role: "Dept Manager", approverName: "Ananya Sharma", status: "Approved", date: "05/08/2026" },
      { role: "HR Manager", approverName: "Neha Mehta", status: "Pending" },
      { role: "General Manager", approverName: "Vikram Malhotra", status: "Pending" },
    ],
    balances: {
      casualLeave: { total: 10, used: 2, remaining: 8, pending: 1, expires: "31 Dec 2026" },
      sickLeave: { total: 12, used: 3, remaining: 9, pending: 0, expires: "31 Dec 2026" },
      earnedLeave: { total: 15, used: 5, remaining: 10, pending: 0, expires: "31 Dec 2026" },
      compOff: { remaining: 2, used: 1, pending: 0, expires: "30 Sep 2026" },
    },
  },
  {
    id: "LA-202",
    employeeId: "EMP-0102",
    employeeName: "Anjali Sharma",
    department: "Housekeeping",
    designation: "Executive Housekeeper",
    avatar: "AS",
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150",
    leaveTypeId: "lt-sl",
    leaveTypeCode: "SL",
    leaveTypeName: "Sick Leave",
    isPaid: true,
    durationOption: "Full Day",
    priority: "Urgent",
    fromDate: "15/08/2026",
    toDate: "15/08/2026",
    totalDays: 1.0,
    reason: "Doctor consultation and fever recovery.",
    attachmentName: "Medical_Certificate_15Aug.pdf",
    status: "Approved",
    appliedOn: "06/08/2026",
    approvedBy: "Neha Mehta (HR)",
    approvalChain: [
      { role: "Dept Manager", approverName: "Housekeeping Head", status: "Approved", date: "06/08/2026" },
      { role: "HR Manager", approverName: "Neha Mehta", status: "Approved", date: "06/08/2026" },
    ],
    balances: {
      casualLeave: { total: 10, used: 1, remaining: 9, pending: 0, expires: "31 Dec 2026" },
      sickLeave: { total: 12, used: 3, remaining: 9, pending: 0, expires: "31 Dec 2026" },
      earnedLeave: { total: 15, used: 2, remaining: 13, pending: 0, expires: "31 Dec 2026" },
      compOff: { remaining: 1, used: 0, pending: 0, expires: "30 Sep 2026" },
    },
  },
  {
    id: "LA-203",
    employeeId: "EMP-0104",
    employeeName: "Priya Patel",
    department: "Front Office",
    designation: "Guest Relations Executive",
    avatar: "PP",
    leaveTypeId: "lt-el",
    leaveTypeCode: "EL",
    leaveTypeName: "Earned Leave",
    isPaid: true,
    durationOption: "Full Day",
    priority: "Normal",
    fromDate: "18/08/2026",
    toDate: "22/08/2026",
    totalDays: 5.0,
    reason: "Annual vacation with family.",
    status: "Pending",
    appliedOn: "04/08/2026",
    approvalChain: [
      { role: "Dept Manager", approverName: "Rajesh Kumar", status: "Approved", date: "04/08/2026" },
      { role: "HR Manager", approverName: "Neha Mehta", status: "Pending" },
    ],
    balances: {
      casualLeave: { total: 10, used: 4, remaining: 6, pending: 0, expires: "31 Dec 2026" },
      sickLeave: { total: 12, used: 1, remaining: 11, pending: 0, expires: "31 Dec 2026" },
      earnedLeave: { total: 15, used: 4, remaining: 11, pending: 1, expires: "31 Dec 2026" },
      compOff: { remaining: 3, used: 0, pending: 0, expires: "30 Sep 2026" },
    },
  },
  {
    id: "LA-204",
    employeeId: "EMP-0103",
    employeeName: "Chef Vikramjit Singh",
    department: "Food & Beverage",
    designation: "Executive Head Chef",
    avatar: "VS",
    leaveTypeId: "lt-co",
    leaveTypeCode: "COMP",
    leaveTypeName: "Compensatory Off",
    isPaid: true,
    durationOption: "First Half",
    priority: "Normal",
    fromDate: "07/08/2026",
    toDate: "07/08/2026",
    totalDays: 0.5,
    reason: "Comp-Off for Sunday banquet catering shift.",
    status: "Approved",
    appliedOn: "03/08/2026",
    approvedBy: "F&B Director",
    approvalChain: [
      { role: "F&B Director", approverName: "Chef Vikram", status: "Approved", date: "03/08/2026" },
      { role: "HR Manager", approverName: "Neha Mehta", status: "Approved", date: "03/08/2026" },
    ],
    balances: {
      casualLeave: { total: 10, used: 0, remaining: 10, pending: 0, expires: "31 Dec 2026" },
      sickLeave: { total: 12, used: 2, remaining: 10, pending: 0, expires: "31 Dec 2026" },
      earnedLeave: { total: 15, used: 3, remaining: 12, pending: 0, expires: "31 Dec 2026" },
      compOff: { remaining: 2, used: 1, pending: 0, expires: "30 Sep 2026" },
    },
  },
];

export function LeaveManagementView() {
  const [applications, setApplications] = useState<LeaveApplication[]>(INITIAL_LEAVE_APPLICATIONS);
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Context Employee Selection via SearchSelect Combobox (Improvement #2)
  const [selectedEmpId, setSelectedEmpId] = useState<string>("EMP-0101");

  // Single Line Toolbar Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");
  const [selectedLeaveType, setSelectedLeaveType] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Modals & Side Drawer State
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [viewingLeave, setViewingLeave] = useState<LeaveApplication | null>(null);
  const [hoveredCalendarDay, setHoveredCalendarDay] = useState<{ empName: string; type: string; dates: string; status: string } | null>(null);

  // Apply Form State (With Unified Searchable Employee Combobox & Unselected Placeholders)
  const [applyEmpId, setApplyEmpId] = useState("");
  const [applyEmpQuery, setApplyEmpQuery] = useState("");
  const [isApplyEmpComboboxOpen, setIsApplyEmpComboboxOpen] = useState(false);
  const applyComboboxRef = useRef<HTMLDivElement>(null);
  const [applyLeaveTypeId, setApplyLeaveTypeId] = useState("");
  const [applyDuration, setApplyDuration] = useState<"Full Day" | "First Half" | "Second Half">("Full Day");
  const [applyPriority, setApplyPriority] = useState<"Normal" | "Urgent" | "Emergency">("Normal");
  const [applyFromDate, setApplyFromDate] = useState("");
  const [applyToDate, setApplyToDate] = useState("");
  const [applyReason, setApplyReason] = useState("");

  // Close Employee Combobox Popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (applyComboboxRef.current && !applyComboboxRef.current.contains(event.target as Node)) {
        setIsApplyEmpComboboxOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Context Employee Object (Improvement #2)
  const selectedEmpObject = useMemo(() => {
    return applications.find((a) => a.employeeId === selectedEmpId) || applications[0];
  }, [applications, selectedEmpId]);

  // Options for SearchSelect Employee Combobox
  const employeeComboboxOptions = useMemo(() => {
    return INITIAL_LEAVE_APPLICATIONS.map((staff) => ({
      id: staff.employeeId,
      label: staff.employeeName,
      sublabel: `${staff.employeeId} • ${staff.department}`,
    }));
  }, []);

  // Filtered Applications
  const filteredApplications = useMemo(() => {
    return applications.filter((a) => {
      const matchSearch =
        a.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.leaveTypeName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = selectedDepartment === "ALL" || a.department === selectedDepartment;
      const matchType = selectedLeaveType === "ALL" || a.leaveTypeId === selectedLeaveType;
      const matchStatus = selectedStatus === "ALL" || a.status === selectedStatus;

      return matchSearch && matchDept && matchType && matchStatus;
    });
  }, [applications, searchTerm, selectedDepartment, selectedLeaveType, selectedStatus]);

  // Metrics Dashboard
  const metrics = useMemo(() => {
    const pending = applications.filter((a) => a.status === "Pending").length;
    const approvedMonth = applications.filter((a) => a.status === "Approved").length + 42;
    const rejectedMonth = applications.filter((a) => a.status === "Rejected").length + 2;
    const onLeaveToday = 7;
    return { pending, approvedMonth, rejectedMonth, onLeaveToday };
  }, [applications]);

  // Department Staffing Risk & Leave Heatmap (Improvement #6)
  const departmentStaffingRisk = useMemo(() => {
    return [
      { dept: "Front Office", onLeave: 3, riskLevel: "High Risk ⚠️", bg: "bg-rose-50 border-rose-200 text-rose-900" },
      { dept: "Housekeeping", onLeave: 0, riskLevel: "Normal 🟢", bg: "bg-emerald-50 border-emerald-200 text-emerald-900" },
      { dept: "Kitchen & F&B", onLeave: 2, riskLevel: "Moderate 🟡", bg: "bg-amber-50 border-amber-200 text-amber-900" },
      { dept: "Accounts & HR", onLeave: 1, riskLevel: "Normal 🟢", bg: "bg-emerald-50 border-emerald-200 text-emerald-900" },
    ];
  }, []);

  // Handlers
  const handleApprove = (id: string, empName: string) => {
    setApplications((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: "Approved",
              approvedBy: "Neha Mehta (HR Manager)",
              approvalChain: a.approvalChain.map((step) => ({ ...step, status: "Approved", date: new Date().toLocaleDateString("en-GB") })),
            }
          : a
      )
    );
    if (viewingLeave?.id === id) {
      setViewingLeave((prev) =>
        prev
          ? {
              ...prev,
              status: "Approved",
              approvedBy: "Neha Mehta (HR Manager)",
              approvalChain: prev.approvalChain.map((step) => ({ ...step, status: "Approved", date: new Date().toLocaleDateString("en-GB") })),
            }
          : null
      );
    }
    setToastMessage(`Approved leave application for ${empName}.`);
  };

  const handleReject = (id: string, empName: string) => {
    setApplications((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: "Rejected",
              approvedBy: "Neha Mehta (HR Manager)",
              approvalChain: a.approvalChain.map((step) => ({ ...step, status: "Rejected" })),
            }
          : a
      )
    );
    if (viewingLeave?.id === id) {
      setViewingLeave((prev) => (prev ? { ...prev, status: "Rejected", approvedBy: "Neha Mehta (HR Manager)" } : null));
    }
    setToastMessage(`Rejected leave application for ${empName}.`);
  };

  const handleSaveApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    const ltObj = MASTER_LEAVE_TYPES.find((x) => x.id === applyLeaveTypeId);
    const empObj = INITIAL_LEAVE_APPLICATIONS.find((x) => x.employeeId === applyEmpId);

    const newApp: LeaveApplication = {
      id: `LA-${Math.floor(200 + Math.random() * 800)}`,
      employeeId: applyEmpId,
      employeeName: empObj?.employeeName || "Rajesh Kumar",
      department: empObj?.department || "Front Office",
      designation: empObj?.designation || "Staff",
      avatar: empObj?.avatar || "RK",
      leaveTypeId: ltObj?.id || "lt-cl",
      leaveTypeCode: ltObj?.code || "CL",
      leaveTypeName: ltObj?.name || "Casual Leave",
      isPaid: ltObj?.isPaid ?? true,
      durationOption: applyDuration,
      priority: applyPriority,
      fromDate: applyFromDate,
      toDate: applyToDate,
      totalDays: applyDuration === "Full Day" ? 3.0 : 0.5,
      reason: applyReason || "Leave request submitted.",
      status: "Pending",
      appliedOn: new Date().toLocaleDateString("en-GB"),
      approvalChain: [
        { role: "Dept Manager", approverName: "Dept Head", status: "Approved", date: new Date().toLocaleDateString("en-GB") },
        { role: "HR Manager", approverName: "Neha Mehta", status: "Pending" },
      ],
      balances: empObj?.balances || {
        casualLeave: { total: 10, used: 2, remaining: 8, pending: 1, expires: "31 Dec 2026" },
        sickLeave: { total: 12, used: 3, remaining: 9, pending: 0, expires: "31 Dec 2026" },
        earnedLeave: { total: 15, used: 5, remaining: 10, pending: 0, expires: "31 Dec 2026" },
        compOff: { remaining: 2, used: 1, pending: 0, expires: "30 Sep 2026" },
      },
    };

    setApplications((prev) => [newApp, ...prev]);
    setIsApplyModalOpen(false);
    setToastMessage(`Submitted ${ltObj?.code} leave request for ${newApp.employeeName}.`);
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource / Attendance & Leave"
      title="Leave Management"
      description="Enterprise multi-level leave approval, employee quota balance tracking, and hotel staffing risk heatmap integration."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Attendance & Leave" },
        { label: "Leave Management" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setApplyEmpId("");
              setApplyEmpQuery("");
              setIsApplyEmpComboboxOpen(false);
              setApplyLeaveTypeId("");
              setApplyFromDate("");
              setApplyToDate("");
              setApplyReason("");
              setIsApplyModalOpen(true);
            }}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Apply Leave
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === "table" ? "calendar" : "table")}
            className="rounded-xl text-xs font-bold bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50 shadow-xs cursor-pointer"
          >
            <CalendarDays className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
            {viewMode === "table" ? "Leave Calendar ⭐" : "Table View"}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setToastMessage("Exporting leave logs to CSV...")}
            className="rounded-xl text-xs font-medium bg-white text-slate-700 border-slate-300 shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export Log
          </Button>
        </div>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: LEAVE TRENDS DASHBOARD CARDS (Improvement #7)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <HRKPICard
          label="Pending Requests"
          value={metrics.pending}
          subtitle="Requires Approval"
          tone="amber"
          icon={<Clock className="h-5 w-5" />}
        />
        <HRKPICard
          label="Approved This Month"
          value={metrics.approvedMonth}
          subtitle="August 2026 Roster"
          tone="emerald"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <HRKPICard
          label="Rejected"
          value={metrics.rejectedMonth}
          subtitle="Excluded from Quotas"
          tone="rose"
          icon={<AlertCircle className="h-5 w-5" />}
        />
        <HRKPICard
          label="On Leave Today"
          value={`${metrics.onLeaveToday} Staff`}
          subtitle="Active Property Roster"
          tone="blue"
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: EMPLOYEE SEARCHSELECT & DETAILED LEAVE BALANCES (Improvements #1 & #2)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-5">
        {/* SearchSelect Combobox & Employee Summary Card */}
        <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <label className="block text-xs font-bold text-slate-700">
            🔍 Search &amp; Select Employee for Quota Summary:
          </label>
          <SearchSelect
            options={employeeComboboxOptions}
            value={selectedEmpId}
            onChange={(val) => setSelectedEmpId(val)}
            placeholder="Type employee name or ID..."
          />

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <HREmployeeCell
              name={selectedEmpObject.employeeName}
              id={selectedEmpObject.employeeId}
              avatar={selectedEmpObject.avatar}
              photoUrl={selectedEmpObject.photoUrl}
              department={selectedEmpObject.department}
            />
          </div>
        </div>

        {/* Detailed Utilization Leave Balance Cards (Improvement #1) */}
        <div className="lg:col-span-8 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
              Leave Utilization Summary — {selectedEmpObject.employeeName}
            </h3>
            <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              CL: {selectedEmpObject.balances.casualLeave.remaining} | SL: {selectedEmpObject.balances.sickLeave.remaining} | EL: {selectedEmpObject.balances.earnedLeave.remaining} | COMP: {selectedEmpObject.balances.compOff.remaining}
            </span>
          </div>

          <div className="flex overflow-x-auto gap-3 pb-1 sm:grid sm:grid-cols-4 scrollbar-none">
            {/* Casual Leave Card */}
            <div className="min-w-[170px] p-3 rounded-xl bg-blue-50/80 border border-blue-200 space-y-1 shrink-0 sm:shrink">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-blue-900">Casual Leave (CL)</span>
                <span className="text-[9px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                  Exp: {selectedEmpObject.balances.casualLeave.expires}
                </span>
              </div>
              <h4 className="text-xl font-black text-blue-950">
                {selectedEmpObject.balances.casualLeave.remaining} / {selectedEmpObject.balances.casualLeave.total}
              </h4>
              <div className="text-[10px] text-blue-800 flex justify-between font-semibold">
                <span>Used: {selectedEmpObject.balances.casualLeave.used}</span>
                <span>Pending: {selectedEmpObject.balances.casualLeave.pending}</span>
              </div>
            </div>

            {/* Sick Leave Card */}
            <div className="min-w-[170px] p-3 rounded-xl bg-rose-50/80 border border-rose-200 space-y-1 shrink-0 sm:shrink">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-rose-900">Sick Leave (SL)</span>
                <span className="text-[9px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                  Exp: {selectedEmpObject.balances.sickLeave.expires}
                </span>
              </div>
              <h4 className="text-xl font-black text-rose-950">
                {selectedEmpObject.balances.sickLeave.remaining} / {selectedEmpObject.balances.sickLeave.total}
              </h4>
              <div className="text-[10px] text-rose-800 flex justify-between font-semibold">
                <span>Used: {selectedEmpObject.balances.sickLeave.used}</span>
                <span>Pending: {selectedEmpObject.balances.sickLeave.pending}</span>
              </div>
            </div>

            {/* Earned Leave Card */}
            <div className="min-w-[170px] p-3 rounded-xl bg-purple-50/80 border border-purple-200 space-y-1 shrink-0 sm:shrink">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-purple-900">Earned Leave (EL)</span>
                <span className="text-[9px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                  Exp: {selectedEmpObject.balances.earnedLeave.expires}
                </span>
              </div>
              <h4 className="text-xl font-black text-purple-950">
                {selectedEmpObject.balances.earnedLeave.remaining} / {selectedEmpObject.balances.earnedLeave.total}
              </h4>
              <div className="text-[10px] text-purple-800 flex justify-between font-semibold">
                <span>Used: {selectedEmpObject.balances.earnedLeave.used}</span>
                <span>Pending: {selectedEmpObject.balances.earnedLeave.pending}</span>
              </div>
            </div>

            {/* Comp Off Card */}
            <div className="min-w-[170px] p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-1 shrink-0 sm:shrink">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-emerald-900">Compensatory Off</span>
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  Exp: {selectedEmpObject.balances.compOff.expires}
                </span>
              </div>
              <h4 className="text-xl font-black text-emerald-950">
                {selectedEmpObject.balances.compOff.remaining} Days
              </h4>
              <div className="text-[10px] text-emerald-800 flex justify-between font-semibold">
                <span>Used: {selectedEmpObject.balances.compOff.used}</span>
                <span>Pending: {selectedEmpObject.balances.compOff.pending}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: HOTEL DEPARTMENT STAFFING RISK HEATMAP (Improvement #6)
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs mb-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-emerald-700" />
            Hotel Department Staffing Risk &amp; Leave Heatmap
          </h3>
          <span className="text-xs text-slate-500 font-medium">Real-time Coverage Audit</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {departmentStaffingRisk.map((risk, i) => (
            <div key={i} className={cn("p-3 rounded-xl border space-y-1", risk.bg)}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{risk.dept}</span>
                <span className="font-extrabold text-[11px]">{risk.riskLevel}</span>
              </div>
              <p className="text-[11px] font-semibold text-slate-700">
                {risk.onLeave} Staff Currently on Leave
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: FILTERS TOOLBAR
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Employee..."
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

            {/* Desktop Filters */}
            <div className="hidden sm:flex items-center gap-2">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All Departments</option>
                <option value="Front Office">Front Office</option>
                <option value="Housekeeping">Housekeeping</option>
                <option value="Food & Beverage">Food &amp; Beverage</option>
              </select>

              <select
                value={selectedLeaveType}
                onChange={(e) => setSelectedLeaveType(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All Leave Types</option>
                {MASTER_LEAVE_TYPES.map((lt) => (
                  <option key={lt.id} value={lt.id}>
                    {lt.name} ({lt.code})
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All Statuses</option>
                <option value="Pending">🟡 Pending</option>
                <option value="Approved">🟢 Approved</option>
                <option value="Rejected">🔴 Rejected</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedDepartment("ALL");
                  setSelectedLeaveType("ALL");
                  setSelectedStatus("ALL");
                }}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Mobile Filter Button */}
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="sm:hidden px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 flex items-center gap-1.5"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 5A: DESKTOP TABLE & MOBILE CARDS VIEW (Improvements #3 & #4)
      ───────────────────────────────────────────────────────────── */}
      {viewMode === "table" ? (
        <>
          {/* Desktop Table View (hidden on small screens) */}
          <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Date Range</th>
                    <th className="py-3 px-4">Total Days</th>
                    <th className="py-3 px-4">Applied Date</th>
                    <th className="py-3 px-4">Approved By</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApplications.map((a) => {
                    const typeObj = MASTER_LEAVE_TYPES.find((t) => t.code === a.leaveTypeCode) || MASTER_LEAVE_TYPES[0];
                    return (
                      <tr
                        key={a.id}
                        className="hover:bg-slate-50/80 transition cursor-pointer"
                        onClick={() => setViewingLeave(a)}
                      >
                        <td className="py-3 px-4">
                          <HREmployeeCell
                            name={a.employeeName}
                            id={a.employeeId}
                            avatar={a.avatar}
                            photoUrl={a.photoUrl}
                          />
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-800">{a.department}</p>
                          <p className="text-[10px] text-slate-500">{a.designation}</p>
                        </td>

                        <td className="py-3 px-4">
                          <span className={cn("px-2.5 py-0.5 rounded-lg text-xs font-bold border", typeObj.colorClass)}>
                            {a.leaveTypeName} ({a.leaveTypeCode})
                          </span>
                        </td>

                        <td className="py-3 px-4 font-medium text-slate-800">
                          {a.fromDate} {a.fromDate !== a.toDate && `→ ${a.toDate}`}
                        </td>

                        <td className="py-3 px-4 font-black text-slate-900">{a.totalDays} Days</td>
                        <td className="py-3 px-4 text-slate-500 font-medium">{a.appliedOn}</td>
                        <td className="py-3 px-4 text-slate-600 font-medium">{a.approvedBy || "Pending Review"}</td>

                        <td className="py-3 px-4">
                          <StatusBadge status={a.status} />
                        </td>

                        {/* Quick Approve / Reject Actions (Improvement #4) */}
                        <td
                          className="py-3 px-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setViewingLeave(a)}
                              title="View Leave Details"
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {a.status === "Pending" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApprove(a.id, a.employeeName)}
                                  title="Quick Approve"
                                  className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition"
                                >
                                  <Check className="h-4 w-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleReject(a.id, a.employeeName)}
                                  title="Quick Reject"
                                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View (shown only on mobile) */}
          <div className="sm:hidden space-y-3">
            {filteredApplications.map((a) => (
              <div
                key={a.id}
                onClick={() => setViewingLeave(a)}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <HREmployeeCell name={a.employeeName} id={a.employeeId} avatar={a.avatar} photoUrl={a.photoUrl} />
                  <StatusBadge status={a.status} />
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Leave Type &amp; Dates</span>
                    <span className="font-bold text-slate-900">{a.leaveTypeName} ({a.fromDate} - {a.toDate})</span>
                  </div>
                  <span className="font-black text-emerald-800 text-sm self-center">{a.totalDays} Days</span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewingLeave(a);
                    }}
                    className="flex-1 text-xs"
                  >
                    View
                  </Button>
                  {a.status === "Pending" && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(a.id, a.employeeName);
                        }}
                        className="flex-1 bg-emerald-700 text-white text-xs font-bold"
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReject(a.id, a.employeeName);
                        }}
                        className="flex-1 text-rose-700 border-rose-300 text-xs font-bold"
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* ─────────────────────────────────────────────────────────────
            SECTION 5B: LEAVE CALENDAR MATRIX & MOBILE LIST (Improvement #5)
        ───────────────────────────────────────────────────────────── */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Leave Calendar Roster — August 2026</h3>
              <p className="text-xs text-slate-500">Departmental coverage visual matrix.</p>
            </div>
            {/* Color-Coded Calendar Legend (Improvement #5) */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-300">
                🔵 CL (Casual)
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-900 border border-rose-300">
                🔴 SL (Sick)
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-300">
                🟣 EL (Earned)
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300">
                🟢 COMP (Comp Off)
              </span>
            </div>
          </div>

          {/* Desktop Month Grid */}
          <div className="hidden sm:grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500 border-b border-slate-200 pb-2">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
            <div>Sun</div>
          </div>

          <div className="hidden sm:grid grid-cols-7 gap-2 text-xs min-h-[220px]">
            {Array.from({ length: 14 }).map((_, idx) => {
              const dayNum = idx + 7;
              return (
                <div key={idx} className="p-2 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-600 text-[11px] block">{dayNum} Aug</span>
                  {dayNum >= 10 && dayNum <= 12 && (
                    <span
                      title="Rajesh Kumar - Casual Leave | 10 Aug - 12 Aug | Pending"
                      className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-900 font-extrabold text-[10px] block cursor-pointer"
                    >
                      Rajesh (CL)
                    </span>
                  )}
                  {dayNum === 15 && (
                    <span
                      title="Anjali Sharma - Sick Leave | 15 Aug | Approved"
                      className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-900 font-extrabold text-[10px] block cursor-pointer"
                    >
                      Anjali (SL)
                    </span>
                  )}
                  {dayNum >= 18 && dayNum <= 22 && (
                    <span
                      title="Priya Patel - Earned Leave | 18 Aug - 22 Aug | Pending"
                      className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-900 font-extrabold text-[10px] block cursor-pointer"
                    >
                      Priya (EL)
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile Agenda List View (Improvement #5 Mobile Optimization) */}
          <div className="sm:hidden space-y-2 text-xs">
            <span className="font-bold text-slate-800 uppercase block">August Roster Agenda:</span>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-900 block">10 Aug - 12 Aug</span>
                <span className="text-slate-600">Rajesh Kumar • Casual Leave</span>
              </div>
              <StatusBadge status="Pending" />
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-900 block">15 Aug</span>
                <span className="text-slate-600">Anjali Sharma • Sick Leave</span>
              </div>
              <StatusBadge status="Approved" />
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SIDE DRAWER: MULTI-LEVEL APPROVAL WORKFLOW (Improvement #5 Enterprise Approval)
      ───────────────────────────────────────────────────────────── */}
      <Drawer
        isOpen={Boolean(viewingLeave)}
        onClose={() => setViewingLeave(null)}
        title="Leave Application Details"
        icon={<Calendar className="h-5 w-5 text-emerald-700" />}
        footer={
          viewingLeave && viewingLeave.status === "Pending" ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => handleApprove(viewingLeave.id, viewingLeave.employeeName)}
                className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold h-9"
              >
                <Check className="mr-1 h-4 w-4" /> Approve Leave
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleReject(viewingLeave.id, viewingLeave.employeeName)}
                className="flex-1 text-rose-700 bg-white border-rose-300 hover:bg-rose-50 rounded-xl text-xs font-bold h-9"
              >
                <X className="mr-1 h-4 w-4" /> Reject Leave
              </Button>
            </div>
          ) : (
            <div className="text-center w-full">
              <span className="text-xs font-bold text-slate-600">
                Status: {viewingLeave?.status} (Processed by {viewingLeave?.approvedBy || "HR Manager"})
              </span>
            </div>
          )
        }
      >
        {viewingLeave && (
          <>
            <HREmployeeCell
              name={viewingLeave.employeeName}
              id={viewingLeave.employeeId}
              avatar={viewingLeave.avatar}
              photoUrl={viewingLeave.photoUrl}
              department={viewingLeave.department}
              designation={viewingLeave.designation}
            />

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Requested Leave Type</span>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {viewingLeave.leaveTypeName} ({viewingLeave.leaveTypeCode})
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900">{viewingLeave.totalDays} Days ({viewingLeave.durationOption})</h3>
              <p className="text-xs text-slate-600 font-medium">
                Dates: {viewingLeave.fromDate} → {viewingLeave.toDate}
              </p>
            </div>

            {/* Multi-Level Approval Chain (Improvement #5 Enterprise Feature) */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800 uppercase block flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                Multi-Level Approval Chain:
              </span>
              <div className="space-y-1.5 text-xs">
                {viewingLeave.approvalChain.map((step, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                    <div>
                      <span className="font-bold text-slate-900 block">{step.role}</span>
                      <span className="text-[11px] text-slate-500">{step.approverName}</span>
                    </div>
                    <StatusBadge status={step.status} />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500">Reason</span>
              <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 italic">
                "{viewingLeave.reason}"
              </p>
            </div>
          </>
        )}
      </Drawer>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: APPLY LEAVE MODAL
      ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Apply Leave Application"
        description="Submit a new leave application with auto-calculated duration and multi-level approval check."
        size="lg"
      >
        <form onSubmit={handleSaveApplyLeave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Employee <span className="text-rose-500">*</span>
              </label>

              {/* Single Unified Searchable Employee Combobox */}
              <div className="relative" ref={applyComboboxRef}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={applyEmpQuery}
                  onFocus={() => setIsApplyEmpComboboxOpen(true)}
                  onChange={(e) => {
                    setApplyEmpQuery(e.target.value);
                    setIsApplyEmpComboboxOpen(true);
                  }}
                  placeholder="Type name, ID or dept..."
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-7 text-xs font-semibold text-slate-900 shadow-2xs focus:border-emerald-500 focus:outline-none"
                />
                {applyEmpQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setApplyEmpQuery("");
                      setApplyEmpId("");
                      setIsApplyEmpComboboxOpen(true);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                )}

                {/* Combobox Dropdown Results List */}
                {isApplyEmpComboboxOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl space-y-1 max-h-52 overflow-y-auto animate-in fade-in-50">
                    {INITIAL_LEAVE_APPLICATIONS.filter((staff) => {
                      if (!applyEmpQuery.trim()) return true;
                      const q = applyEmpQuery.toLowerCase().trim();
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
                      INITIAL_LEAVE_APPLICATIONS.filter((staff) => {
                        if (!applyEmpQuery.trim()) return true;
                        const q = applyEmpQuery.toLowerCase().trim();
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
                            setApplyEmpId(staff.employeeId);
                            setApplyEmpQuery(`${staff.employeeName} (${staff.employeeId})`);
                            setIsApplyEmpComboboxOpen(false);
                          }}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors hover:bg-slate-100/80 border border-transparent",
                            applyEmpId === staff.employeeId && "bg-emerald-50 text-emerald-900 border-emerald-200"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[10px] shrink-0">
                              {staff.avatar}
                            </div>
                            <div className="truncate">
                              <p className="font-bold text-xs text-slate-900 truncate">
                                {staff.employeeName} <span className="text-[10px] text-emerald-700">({staff.employeeId})</span>
                              </p>
                              <p className="text-[10px] text-slate-500 truncate">{staff.department}</p>
                            </div>
                          </div>
                          {applyEmpId === staff.employeeId && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 ml-1" />}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Leave Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={applyLeaveTypeId}
                onChange={(e) => setApplyLeaveTypeId(e.target.value)}
                required
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold text-slate-800"
              >
                <option value="">-- Select Leave Type --</option>
                {MASTER_LEAVE_TYPES.map((lt) => (
                  <option key={lt.id} value={lt.id}>
                    {lt.name} ({lt.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">From Date</label>
              <input
                type="date"
                value={applyFromDate}
                onChange={(e) => setApplyFromDate(e.target.value)}
                required
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">To Date</label>
              <input
                type="date"
                value={applyToDate}
                onChange={(e) => setApplyToDate(e.target.value)}
                required
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Reason</label>
            <textarea
              rows={3}
              placeholder="Provide reason for leave application..."
              value={applyReason}
              onChange={(e) => setApplyReason(e.target.value)}
              required
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsApplyModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>

      {/* MOBILE FILTERS BOTTOM SHEET MODAL */}
      {isMobileFilterOpen && (
        <Modal
          isOpen={isMobileFilterOpen}
          onClose={() => setIsMobileFilterOpen(false)}
          title="Filter Leave Requests"
          size="sm"
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Department</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
              >
                <option value="ALL">All Departments</option>
                <option value="Front Office">Front Office</option>
                <option value="Housekeeping">Housekeeping</option>
                <option value="Food & Beverage">Food &amp; Beverage</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Leave Type</label>
              <select
                value={selectedLeaveType}
                onChange={(e) => setSelectedLeaveType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
              >
                <option value="ALL">All Leave Types</option>
                {MASTER_LEAVE_TYPES.map((lt) => (
                  <option key={lt.id} value={lt.id}>
                    {lt.name} ({lt.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
              >
                <option value="ALL">All Statuses</option>
                <option value="Pending">🟡 Pending</option>
                <option value="Approved">🟢 Approved</option>
                <option value="Rejected">🔴 Rejected</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                size="sm"
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full bg-emerald-700 text-white rounded-xl font-bold"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </ModulePageShell>
  );
}
