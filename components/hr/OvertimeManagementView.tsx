"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Timer,
  Search,
  Users,
  Clock,
  CheckCircle2,
  Eye,
  Check,
  X,
  Printer,
  Info,
  Zap,
  IndianRupee,
  AlertTriangle,
  Trash2,
  Building2,
  SlidersHorizontal,
  Plus,
  ChevronDown,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, StatusBadge, SearchSelect } from "@/components/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import { HREmployeeCell } from "@/components/hr/shared/HREmployeeCell";
import { cn } from "@/lib/utils";

export type OvertimeType =
  | "Regular OT"
  | "Holiday OT"
  | "Weekly Off OT"
  | "Emergency Call-In OT"
  | "Night Differential OT";

export interface OvertimeRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  avatar: string;
  photoUrl?: string;
  shiftCode: string;
  shiftName: string;
  otType: OvertimeType;
  date: string;
  checkIn: string;
  checkOut: string;
  scheduledHours: number;
  breakHours: number;
  workedHours: number;
  overtimeHours: number;
  hourlyRate: number;
  otRateMultiplier: number;
  payableAmount: number; // Calculated: OT Hours * Multiplier * Base Hourly Rate
  reason?: string;
  status: "Pending" | "Approved" | "Rejected" | "Processed";
  approvedBy?: string;
  approvedOn?: string;
  approvalRemarks?: string;
}

export const INITIAL_OVERTIME_RECORDS: OvertimeRecord[] = [
  {
    id: "OT-301",
    employeeId: "EMP-0101",
    employeeName: "Rajesh Kumar",
    department: "Front Office",
    designation: "Front Desk Manager",
    avatar: "RK",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    shiftCode: "MS-01",
    shiftName: "Morning Shift (A)",
    otType: "Regular OT",
    date: "06/08/2026",
    checkIn: "07:00 AM",
    checkOut: "07:30 PM",
    scheduledHours: 8.0,
    breakHours: 0.75,
    workedHours: 11.75,
    overtimeHours: 3.75,
    hourlyRate: 300,
    otRateMultiplier: 1.5,
    payableAmount: 1688,
    reason: "Extended coverage for VIP delegation check-in peak.",
    status: "Pending",
  },
  {
    id: "OT-302",
    employeeId: "EMP-0102",
    employeeName: "Anjali Sharma",
    department: "Housekeeping",
    designation: "Executive Housekeeper",
    avatar: "AS",
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150",
    shiftCode: "GS-04",
    shiftName: "General Office Shift",
    otType: "Weekly Off OT",
    date: "05/08/2026",
    checkIn: "09:00 AM",
    checkOut: "08:30 PM",
    scheduledHours: 8.0,
    breakHours: 1.0,
    workedHours: 10.5,
    overtimeHours: 2.5,
    hourlyRate: 280,
    otRateMultiplier: 2.0,
    payableAmount: 1400,
    reason: "Supervised floor deep cleaning inspection post banquet.",
    status: "Approved",
    approvedBy: "Neha Mehta (HR Admin)",
    approvedOn: "05/08/2026",
    approvalRemarks: "Approved for deep cleaning post-event inspection.",
  },
  {
    id: "OT-303",
    employeeId: "EMP-0103",
    employeeName: "Chef Vikramjit Singh",
    department: "Food & Beverage",
    designation: "Executive Head Chef",
    avatar: "VS",
    shiftCode: "SS-05",
    shiftName: "Split Shift (F&B)",
    otType: "Emergency Call-In OT",
    date: "06/08/2026",
    checkIn: "11:00 AM",
    checkOut: "01:00 AM",
    scheduledHours: 8.0,
    breakHours: 1.0,
    workedHours: 13.0,
    overtimeHours: 5.0,
    hourlyRate: 400,
    otRateMultiplier: 2.0,
    payableAmount: 4000,
    reason: "Late night wedding dinner buffet catering.",
    status: "Pending",
  },
  {
    id: "OT-304",
    employeeId: "EMP-0104",
    employeeName: "Priya Patel",
    department: "Front Office",
    designation: "Guest Relations Executive",
    avatar: "PP",
    shiftCode: "ES-02",
    shiftName: "Evening Shift (B)",
    otType: "Night Differential OT",
    date: "04/08/2026",
    checkIn: "03:00 PM",
    checkOut: "02:00 AM",
    scheduledHours: 8.0,
    breakHours: 0.75,
    workedHours: 10.25,
    overtimeHours: 2.25,
    hourlyRate: 250,
    otRateMultiplier: 1.75,
    payableAmount: 984,
    reason: "Late night delayed flight group arrival.",
    status: "Processed",
    approvedBy: "Neha Mehta (HR Admin)",
    approvedOn: "05/08/2026",
  },
  {
    id: "OT-305",
    employeeId: "EMP-0105",
    employeeName: "Arjun Verma",
    department: "Food & Beverage",
    designation: "Restaurant Captain",
    avatar: "AV",
    shiftCode: "ES-02",
    shiftName: "Evening Shift (B)",
    otType: "Regular OT",
    date: "06/08/2026",
    checkIn: "03:00 PM",
    checkOut: "01:30 AM",
    scheduledHours: 8.0,
    breakHours: 0.75,
    workedHours: 9.75,
    overtimeHours: 1.75,
    hourlyRate: 220,
    otRateMultiplier: 1.5,
    payableAmount: 578,
    reason: "Restaurant closing and inventory audit.",
    status: "Pending",
  },
];

export function OvertimeManagementView() {
  const [records, setRecords] = useState<OvertimeRecord[]>(INITIAL_OVERTIME_RECORDS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Single-Line Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");
  const [selectedOtType, setSelectedOtType] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Modals & Side Drawer
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<OvertimeRecord | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Request OT Form State (With Unified Searchable Combobox & Auto-Close)
  const [reqEmpId, setReqEmpId] = useState("");
  const [reqEmpQuery, setReqEmpQuery] = useState("");
  const [isReqEmpComboboxOpen, setIsReqEmpComboboxOpen] = useState(false);
  const reqComboboxRef = useRef<HTMLDivElement>(null);
  const [reqOtType, setReqOtType] = useState<OvertimeType | "">("");
  const [reqDate, setReqDate] = useState("");
  const [reqHours, setReqHours] = useState<string>("");
  const [reqReason, setReqReason] = useState("");

  // Close Employee Combobox Popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (reqComboboxRef.current && !reqComboboxRef.current.contains(event.target as Node)) {
        setIsReqEmpComboboxOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.shiftName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = selectedDepartment === "ALL" || r.department === selectedDepartment;
      const matchOtType = selectedOtType === "ALL" || r.otType === selectedOtType;
      const matchStatus = selectedStatus === "ALL" || r.status === selectedStatus;

      return matchSearch && matchDept && matchOtType && matchStatus;
    });
  }, [records, searchTerm, selectedDepartment, selectedOtType, selectedStatus]);

  // Meaningful KPI Metrics (Improvement #1)
  const metrics = useMemo(() => {
    const pendingCount = records.filter((r) => r.status === "Pending").length;
    const approvedHours = records
      .filter((r) => r.status === "Approved" || r.status === "Processed")
      .reduce((sum, r) => sum + r.overtimeHours, 0);

    const totalCostPayable = records
      .filter((r) => r.status === "Approved" || r.status === "Processed")
      .reduce((sum, r) => sum + r.payableAmount, 0) + 16148; // Mock overall month total

    const uniqueEmployees = new Set(records.map((r) => r.employeeId)).size;

    return {
      pendingCount,
      approvedHours: approvedHours.toFixed(1),
      totalCostPayable: totalCostPayable.toLocaleString("en-IN"),
      uniqueEmployees,
    };
  }, [records]);

  // Department OT Analysis Widget (Improvement #6)
  const departmentOtAnalysis = useMemo(() => {
    return [
      { dept: "Front Office", hours: "42.5 Hrs", cost: "₹12,750", bg: "bg-blue-50 border-blue-200 text-blue-900" },
      { dept: "Housekeeping", hours: "65.0 Hrs", cost: "₹18,200", bg: "bg-purple-50 border-purple-200 text-purple-900" },
      { dept: "Kitchen & F&B", hours: "98.0 Hrs", cost: "₹34,300", bg: "bg-amber-50 border-amber-200 text-amber-900" },
      { dept: "Maintenance", hours: "21.5 Hrs", cost: "₹6,450", bg: "bg-emerald-50 border-emerald-200 text-emerald-900" },
    ];
  }, []);

  // Handlers
  const handleApprove = (id: string, empName: string, hours: number) => {
    const today = new Date().toLocaleDateString("en-GB");
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "Approved",
              approvedBy: "Neha Mehta (HR Admin)",
              approvedOn: today,
              approvalRemarks: "Approved for extended shift operations.",
            }
          : r
      )
    );
    if (viewingRecord?.id === id) {
      setViewingRecord((prev) =>
        prev
          ? {
              ...prev,
              status: "Approved",
              approvedBy: "Neha Mehta (HR Admin)",
              approvedOn: today,
              approvalRemarks: "Approved for extended shift operations.",
            }
          : null
      );
    }
    setToastMessage(`Approved ${hours} hrs overtime for ${empName}. Payable amount forwarded to Payroll.`);
  };

  const handleReject = (id: string, empName: string) => {
    const today = new Date().toLocaleDateString("en-GB");
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "Rejected",
              approvedBy: "Neha Mehta (HR Admin)",
              approvedOn: today,
              approvalRemarks: "Overtime rejected by HR.",
            }
          : r
      )
    );
    if (viewingRecord?.id === id) {
      setViewingRecord((prev) => (prev ? { ...prev, status: "Rejected", approvedBy: "Neha Mehta (HR Admin)" } : null));
    }
    setToastMessage(`Rejected overtime entry for ${empName}. Excluded from Payroll calculations.`);
  };

  const handleDelete = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    if (viewingRecord?.id === id) setViewingRecord(null);
    setDeleteTargetId(null);
    setToastMessage("Deleted overtime record.");
  };

  const handleSaveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const empObj = INITIAL_OVERTIME_RECORDS.find((x) => x.employeeId === reqEmpId);
    const parsedHours = parseFloat(reqHours) || 2.0;
    const actualOtType = reqOtType || "Regular OT";
    const multiplier = actualOtType === "Regular OT" ? 1.5 : 2.0;
    const hourlyRate = 300;
    const payable = Math.round(parsedHours * multiplier * hourlyRate);

    const newRecord: OvertimeRecord = {
      id: `OT-${Math.floor(300 + Math.random() * 700)}`,
      employeeId: reqEmpId || "EMP-0101",
      employeeName: empObj?.employeeName || "Rajesh Kumar",
      department: empObj?.department || "Front Office",
      designation: empObj?.designation || "Staff",
      avatar: empObj?.avatar || "RK",
      shiftCode: "MS-01",
      shiftName: "Morning Shift (A)",
      otType: actualOtType,
      date: reqDate || new Date().toISOString().split("T")[0],
      checkIn: "07:00 AM",
      checkOut: "07:30 PM",
      scheduledHours: 8.0,
      breakHours: 0.75,
      workedHours: 8.0 + parsedHours,
      overtimeHours: parsedHours,
      hourlyRate,
      otRateMultiplier: multiplier,
      payableAmount: payable,
      reason: reqReason || "Overtime request submitted via HR.",
      status: "Pending",
    };

    setRecords((prev) => [newRecord, ...prev]);
    setIsRequestModalOpen(false);
    setToastMessage(`Submitted ${actualOtType} request for ${newRecord.employeeName} (${parsedHours} Hrs).`);
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource / Attendance & Leave"
      title="Overtime Management"
      description="Review, approve, and track overtime hours automatically calculated from Attendance logs with live Payroll impact (₹ Payable) and audit trail logs."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Attendance & Leave" },
        { label: "Overtime Management" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setReqEmpId("");
              setReqEmpQuery("");
              setIsReqEmpComboboxOpen(false);
              setReqOtType("");
              setReqHours("");
              setReqReason("");
              setIsRequestModalOpen(true);
            }}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Assign Overtime
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setToastMessage("Synced with Attendance engine. 2 new OT records detected.")}
            className="rounded-xl text-xs font-bold bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50 shadow-xs cursor-pointer"
          >
            <Zap className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
            Auto-Detect OT
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setToastMessage("Exporting overtime report to CSV...")}
            className="rounded-xl text-xs font-medium bg-white text-slate-700 border-slate-300 shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export Report
          </Button>
        </div>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: CLEAR TOP KPI CARDS (Improvement #1)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <HRKPICard
          label="Pending Approval"
          value={`${metrics.pendingCount} Requests`}
          subtitle="Requires HR Review"
          tone="amber"
          icon={<Clock className="h-5 w-5" />}
        />
        <HRKPICard
          label="Approved This Month"
          value={`${metrics.approvedHours} Hours`}
          subtitle="August 2026 Roster"
          tone="emerald"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <HRKPICard
          label="Overtime Cost Impact"
          value={`₹${metrics.totalCostPayable}`}
          subtitle="Forwarded to Payroll"
          tone="blue"
          icon={<IndianRupee className="h-5 w-5" />}
        />
        <HRKPICard
          label="Employees With OT"
          value={`${metrics.uniqueEmployees} Staff`}
          subtitle="Across All Depts"
          tone="slate"
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: FILTERS TOOLBAR
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

          {/* Filters Toggle Button (Right) */}
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

            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="md:hidden p-2 rounded-full border border-slate-200 bg-white text-slate-700"
            >
              <SlidersHorizontal className="h-4 w-4 text-emerald-700" />
            </button>
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
              </select>

              <select
                value={selectedOtType}
                onChange={(e) => setSelectedOtType(e.target.value)}
                className="text-xs rounded-full border border-slate-200 py-1.5 px-3 bg-slate-50 font-bold text-slate-800"
              >
                <option value="ALL">All OT Types</option>
                <option value="Regular OT">Regular OT (1.5x)</option>
                <option value="Weekly Off OT">Weekly Off OT (2.0x)</option>
                <option value="Emergency Call-In OT">Emergency Call-In (2.0x)</option>
                <option value="Night Differential OT">Night Differential (1.75x)</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs rounded-full border border-slate-200 py-1.5 px-3 bg-slate-50 font-bold text-slate-800"
              >
                <option value="ALL">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedDepartment("ALL");
                setSelectedOtType("ALL");
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
          SECTION 3: MAIN DESKTOP TABLE & MOBILE CARD LAYOUT
      ───────────────────────────────────────────────────────────── */}
      {/* Desktop Table View */}
      <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">OT Type</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">OT Hours</th>
                <th className="py-3 px-4">Payable Amount (₹)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Approved By / Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-slate-50/80 transition cursor-pointer"
                  onClick={() => setViewingRecord(r)}
                >
                  <td className="py-3 px-4">
                    <HREmployeeCell
                      name={r.employeeName}
                      id={r.employeeId}
                      avatar={r.avatar}
                      photoUrl={r.photoUrl}
                    />
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-800">{r.department}</p>
                    <p className="text-[10px] text-slate-500">{r.designation}</p>
                  </td>

                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {r.otType} ({r.otRateMultiplier}x)
                    </span>
                  </td>

                  <td className="py-3 px-4 font-medium text-slate-800">{r.date}</td>
                  <td className="py-3 px-4 font-black text-slate-900">+ {r.overtimeHours} Hrs</td>

                  <td className="py-3 px-4 font-black text-emerald-800 text-xs">
                    ₹{r.payableAmount.toLocaleString("en-IN")}
                  </td>

                  <td className="py-3 px-4">
                    <StatusBadge status={r.status} />
                  </td>

                  <td className="py-3 px-4 text-slate-600 text-[11px]">
                    <p className="font-semibold text-slate-800">{r.approvedBy || "—"}</p>
                    <p className="text-[10px] text-slate-400">{r.approvedOn || "Pending"}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards View (shown on mobile devices) */}
      <div className="sm:hidden space-y-3">
        {filteredRecords.map((r) => (
          <div
            key={r.id}
            onClick={() => setViewingRecord(r)}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <HREmployeeCell name={r.employeeName} id={r.employeeId} avatar={r.avatar} photoUrl={r.photoUrl} />
              <StatusBadge status={r.status} />
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between">
              <div>
                <span className="text-slate-400 text-[10px] block">{r.otType} • {r.date}</span>
                <span className="font-bold text-slate-900">+{r.overtimeHours} Hours ({r.otRateMultiplier}x)</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[10px] block">Payable</span>
                <span className="font-black text-emerald-800 text-sm">₹{r.payableAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewingRecord(r);
                }}
                className="flex-1 text-xs"
              >
                View Details
              </Button>
              {r.status === "Pending" && (
                <>
                  <Button
                    type="button"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApprove(r.id, r.employeeName, r.overtimeHours);
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
                      handleReject(r.id, r.employeeName);
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

      {/* ─────────────────────────────────────────────────────────────
          SIDE DRAWER: OVERTIME DETAILS & AUDIT TRAIL
      ───────────────────────────────────────────────────────────── */}
      <Drawer
        isOpen={Boolean(viewingRecord)}
        onClose={() => setViewingRecord(null)}
        title="Overtime Record Details"
        icon={<Timer className="h-5 w-5 text-emerald-700" />}
        footer={
          viewingRecord && viewingRecord.status === "Pending" ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => handleApprove(viewingRecord.id, viewingRecord.employeeName, viewingRecord.overtimeHours)}
                className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full text-xs font-bold h-9 cursor-pointer"
              >
                <Check className="mr-1 h-4 w-4" /> Approve
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleReject(viewingRecord.id, viewingRecord.employeeName)}
                className="flex-1 text-rose-700 bg-white border-rose-200 hover:bg-rose-50 rounded-full text-xs font-bold h-9 cursor-pointer"
              >
                <X className="mr-1 h-4 w-4" /> Reject
              </Button>
            </div>
          ) : (
            <div className="text-center w-full">
              <span className="text-xs font-bold text-slate-600">
                Status: {viewingRecord?.status} {viewingRecord?.approvedBy ? `(by ${viewingRecord.approvedBy})` : ""}
              </span>
            </div>
          )
        }
      >
        {viewingRecord && (
          <>
            <HREmployeeCell
              name={viewingRecord.employeeName}
              id={viewingRecord.employeeId}
              avatar={viewingRecord.avatar}
              photoUrl={viewingRecord.photoUrl}
              department={viewingRecord.department}
              designation={viewingRecord.designation}
            />

            {/* Payroll Impact Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="text-xs font-bold text-slate-700 uppercase">Payroll Impact</span>
                <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Rate: {viewingRecord.otRateMultiplier}x
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Overtime Hours</span>
                  <span className="font-extrabold text-slate-900 text-base">+{viewingRecord.overtimeHours} Hours</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Payable Amount</span>
                  <span className="font-black text-emerald-800 text-base">₹{viewingRecord.payableAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* Audit Trail Details */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-800 uppercase block">Audit Details</span>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Classification:</span>
                <span className="font-bold text-slate-900">{viewingRecord.otType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Shift Code:</span>
                <span className="font-bold text-slate-900">{viewingRecord.shiftName} ({viewingRecord.shiftCode})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Approved By:</span>
                <span className="font-bold text-slate-900">{viewingRecord.approvedBy || "Pending Review"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Approval Date:</span>
                <span className="font-semibold text-slate-800">{viewingRecord.approvedOn || "Pending"}</span>
              </div>
              {viewingRecord.reason && (
                <div className="pt-1">
                  <span className="text-slate-500 font-semibold block mb-0.5">Reason:</span>
                  <p className="italic text-slate-700">"{viewingRecord.reason}"</p>
                </div>
              )}
            </div>
          </>
        )}
      </Drawer>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: REQUEST OVERTIME MODAL
      ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Assign Overtime Hours"
        description="Assign overtime hours to an employee with OT classification type."
        size="md"
      >
        <form onSubmit={handleSaveRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Employee <span className="text-rose-500">*</span>
            </label>

            {/* Single Unified Searchable Employee Combobox */}
            <div className="relative" ref={reqComboboxRef}>
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={reqEmpQuery}
                onFocus={() => setIsReqEmpComboboxOpen(true)}
                onChange={(e) => {
                  setReqEmpQuery(e.target.value);
                  setIsReqEmpComboboxOpen(true);
                }}
                placeholder="Type employee name, ID or department to search..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-xs font-semibold text-slate-900 shadow-2xs focus:border-emerald-500 focus:outline-none"
              />
              {reqEmpQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setReqEmpQuery("");
                    setReqEmpId("");
                    setIsReqEmpComboboxOpen(true);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              )}

              {/* Combobox Dropdown Results List */}
              {isReqEmpComboboxOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl space-y-1 max-h-56 overflow-y-auto animate-in fade-in-50">
                  {INITIAL_OVERTIME_RECORDS.filter((staff) => {
                    if (!reqEmpQuery.trim()) return true;
                    const q = reqEmpQuery.toLowerCase().trim();
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
                    INITIAL_OVERTIME_RECORDS.filter((staff) => {
                      if (!reqEmpQuery.trim()) return true;
                      const q = reqEmpQuery.toLowerCase().trim();
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
                          setReqEmpId(staff.employeeId);
                          setReqEmpQuery(`${staff.employeeName} (${staff.employeeId}) - ${staff.department}`);
                          setIsReqEmpComboboxOpen(false);
                        }}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors hover:bg-slate-100/80 border border-transparent",
                          reqEmpId === staff.employeeId && "bg-emerald-50 text-emerald-900 border-emerald-200"
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
                        {reqEmpId === staff.employeeId && <Check className="h-4 w-4 text-emerald-600 shrink-0 ml-2" />}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Overtime Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={reqOtType}
                onChange={(e) => setReqOtType(e.target.value as OvertimeType)}
                required
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold text-slate-800"
              >
                <option value="">-- Select Overtime Type --</option>
                <option value="Regular OT">Regular OT (1.5x)</option>
                <option value="Weekly Off OT">Weekly Off OT (2.0x)</option>
                <option value="Emergency Call-In OT">Emergency Call-In (2.0x)</option>
                <option value="Night Differential OT">Night Differential (1.75x)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                OT Hours <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="12"
                placeholder="e.g. 2.0"
                value={reqHours}
                onChange={(e) => setReqHours(e.target.value)}
                required
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-bold text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Reason / Event Note</label>
            <textarea
              rows={2}
              placeholder="e.g. Extended banquet event coverage..."
              value={reqReason}
              onChange={(e) => setReqReason(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRequestModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              Assign Overtime
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: DELETE CONFIRMATION MODAL */}
      {deleteTargetId && (
        <Modal
          isOpen={Boolean(deleteTargetId)}
          onClose={() => setDeleteTargetId(null)}
          title="Delete Overtime Record"
          size="sm"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-700 font-medium">
              Are you sure you want to delete this overtime record? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteTargetId(null)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleDelete(deleteTargetId)}
                className="rounded-xl text-xs font-bold bg-rose-700 text-white"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MOBILE FILTERS BOTTOM SHEET MODAL */}
      {isMobileFilterOpen && (
        <Modal
          isOpen={isMobileFilterOpen}
          onClose={() => setIsMobileFilterOpen(false)}
          title="Filter Overtime Requests"
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
              <label className="block font-bold text-slate-700 mb-1">OT Type</label>
              <select
                value={selectedOtType}
                onChange={(e) => setSelectedOtType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
              >
                <option value="ALL">All OT Types</option>
                <option value="Regular OT">Regular OT</option>
                <option value="Weekly Off OT">Weekly Off OT</option>
                <option value="Emergency Call-In OT">Emergency Call-In</option>
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
