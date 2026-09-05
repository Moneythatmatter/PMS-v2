"use client";

import React, { useState, useMemo } from "react";
import {
  Clock,
  Search,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Edit2,
  Plus,
  Printer,
  Info,
  Calendar,
  SlidersHorizontal,
  X,
  MapPin,
  Fingerprint,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, StatusBadge } from "@/components/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import { HREmployeeCell } from "@/components/hr/shared/HREmployeeCell";
import { cn } from "@/lib/utils";

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  avatar: string;
  photoUrl?: string;
  shiftCode: string;
  shiftName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  workedHours: number;
  expectedHours: number;
  status: "Present" | "Late" | "Absent" | "Half Day" | "On Leave" | "Weekly Off";
  inLocation?: string;
  outLocation?: string;
  deviceType: "Biometric Reader" | "Mobile App (GPS)" | "Manual Entry";
  isManualEntry?: boolean;
  manualReason?: string;
  editedBy?: string;
  editedOn?: string;
}

export const INITIAL_ATTENDANCE_RECORDS: AttendanceRecord[] = [
  {
    id: "ATT-101",
    employeeId: "EMP-0101",
    employeeName: "Rajesh Kumar",
    department: "Front Office",
    designation: "Front Desk Manager",
    avatar: "RK",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    shiftCode: "MS-01",
    shiftName: "Morning Shift (07:00 AM - 03:30 PM)",
    date: "08/08/2026",
    checkIn: "08:58 AM",
    checkOut: "05:30 PM",
    workedHours: 8.5,
    expectedHours: 8.0,
    status: "Present",
    inLocation: "Main Lobby Terminal #01",
    outLocation: "Main Lobby Terminal #01",
    deviceType: "Biometric Reader",
  },
  {
    id: "ATT-102",
    employeeId: "EMP-0102",
    employeeName: "Anjali Sharma",
    department: "Housekeeping",
    designation: "Executive Housekeeper",
    avatar: "AS",
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150",
    shiftCode: "GS-04",
    shiftName: "General Shift (09:00 AM - 05:30 PM)",
    date: "08/08/2026",
    checkIn: "09:25 AM",
    checkOut: "05:30 PM",
    workedHours: 8.0,
    expectedHours: 8.0,
    status: "Late",
    inLocation: "Housekeeping Office Terminal",
    outLocation: "Housekeeping Office Terminal",
    deviceType: "Biometric Reader",
    manualReason: "Delayed due to monsoon traffic congestion.",
  },
  {
    id: "ATT-103",
    employeeId: "EMP-0103",
    employeeName: "Chef Vikramjit Singh",
    department: "Kitchen / Culinary",
    designation: "Executive Head Chef",
    avatar: "VS",
    shiftCode: "SS-05",
    shiftName: "Split Shift (F&B Kitchen)",
    date: "08/08/2026",
    checkIn: "10:55 AM",
    checkOut: "11:00 PM",
    workedHours: 11.0,
    expectedHours: 8.0,
    status: "Present",
    inLocation: "Kitchen Terminal #02",
    outLocation: "Kitchen Terminal #02",
    deviceType: "Biometric Reader",
  },
  {
    id: "ATT-104",
    employeeId: "EMP-0104",
    employeeName: "Priya Patel",
    department: "Front Office",
    designation: "Guest Relations Executive",
    avatar: "PP",
    photoUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150",
    shiftCode: "ES-02",
    shiftName: "Evening Shift (03:00 PM - 11:30 PM)",
    date: "08/08/2026",
    checkIn: "—",
    checkOut: "—",
    workedHours: 0.0,
    expectedHours: 8.0,
    status: "On Leave",
    deviceType: "Manual Entry",
    manualReason: "Approved Casual Leave application (LA-203).",
  },
  {
    id: "ATT-105",
    employeeId: "EMP-0105",
    employeeName: "Suresh Babu",
    department: "Maintenance & Eng.",
    designation: "Chief Engineer",
    avatar: "SB",
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
    shiftCode: "GS-04",
    shiftName: "General Shift (09:00 AM - 05:30 PM)",
    date: "08/08/2026",
    checkIn: "08:50 AM",
    checkOut: "05:40 PM",
    workedHours: 8.8,
    expectedHours: 8.0,
    status: "Present",
    inLocation: "Engineering Workshop Terminal",
    outLocation: "Engineering Workshop Terminal",
    deviceType: "Biometric Reader",
  },
  {
    id: "ATT-106",
    employeeId: "EMP-0106",
    employeeName: "Sunita Patel",
    department: "Housekeeping",
    designation: "Floor Supervisor",
    avatar: "SP",
    shiftCode: "MS-01",
    shiftName: "Morning Shift (07:00 AM - 03:30 PM)",
    date: "08/08/2026",
    checkIn: "06:55 AM",
    checkOut: "03:35 PM",
    workedHours: 8.6,
    expectedHours: 8.0,
    status: "Present",
    inLocation: "3rd Floor Linen Room Terminal",
    outLocation: "3rd Floor Linen Room Terminal",
    deviceType: "Biometric Reader",
  },
  {
    id: "ATT-107",
    employeeId: "EMP-0107",
    employeeName: "Ramesh Verma",
    department: "Front Office",
    designation: "Night Auditor",
    avatar: "RV",
    photoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150",
    shiftCode: "NS-03",
    shiftName: "Night Shift (11:00 PM - 07:30 AM)",
    date: "08/08/2026",
    checkIn: "10:52 PM",
    checkOut: "07:35 AM",
    workedHours: 8.7,
    expectedHours: 8.0,
    status: "Present",
    inLocation: "Front Desk Terminal #01",
    outLocation: "Front Desk Terminal #01",
    deviceType: "Biometric Reader",
  },
  {
    id: "ATT-108",
    employeeId: "EMP-0108",
    employeeName: "Deepak Chawla",
    department: "Kitchen / Culinary",
    designation: "Commi 1 (Pastry)",
    avatar: "DC",
    photoUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150",
    shiftCode: "MS-01",
    shiftName: "Morning Shift (07:00 AM - 03:30 PM)",
    date: "08/08/2026",
    checkIn: "—",
    checkOut: "—",
    workedHours: 0.0,
    expectedHours: 8.0,
    status: "On Leave",
    deviceType: "Manual Entry",
    manualReason: "Approved Sick Leave (SL-109).",
  },
  {
    id: "ATT-109",
    employeeId: "EMP-0109",
    employeeName: "Meenakshi Sundaram",
    department: "HR & Admin",
    designation: "HR Executive",
    avatar: "MS",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
    shiftCode: "GS-04",
    shiftName: "General Shift (09:00 AM - 05:30 PM)",
    date: "08/08/2026",
    checkIn: "08:59 AM",
    checkOut: "05:30 PM",
    workedHours: 8.5,
    expectedHours: 8.0,
    status: "Present",
    inLocation: "HR Admin Office Biometric",
    outLocation: "HR Admin Office Biometric",
    deviceType: "Biometric Reader",
  },
  {
    id: "ATT-110",
    employeeId: "EMP-0110",
    employeeName: "Arun Joshi",
    department: "F&B Service",
    designation: "Captain / Waiter",
    avatar: "AJ",
    photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150",
    shiftCode: "ES-02",
    shiftName: "Evening Shift (03:00 PM - 11:30 PM)",
    date: "08/08/2026",
    checkIn: "—",
    checkOut: "—",
    workedHours: 0.0,
    expectedHours: 0.0,
    status: "Weekly Off",
    deviceType: "Manual Entry",
    manualReason: "Scheduled Weekly Off.",
  },
];

export function AttendanceView() {
  const [records, setRecords] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE_RECORDS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");
  const [selectedShift, setSelectedShift] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState("2026-08-08");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Modals & Side Drawer State
  const [isManualPunchModalOpen, setIsManualPunchModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<AttendanceRecord | null>(null);

  // Manual Punch Form State
  const [punchEmpId, setPunchEmpId] = useState("EMP-0101");
  const [punchDate, setPunchDate] = useState("2026-08-08");
  const [punchInTime, setPunchInTime] = useState("09:00 AM");
  const [punchOutTime, setPunchOutTime] = useState("05:30 PM");
  const [punchStatus, setPunchStatus] = useState<"Present" | "Late" | "Half Day">("Present");
  const [punchReason, setPunchReason] = useState("");

  // Mode Filter Tab State (All Logs | Manual Overrides; biometric tabs show coming soon)
  const [attendanceMode, setAttendanceMode] = useState<"ALL" | "MANUAL">("ALL");

  const showBiometricComingSoon = () => {
    setToastMessage("Biometric features are coming soon.");
  };

  // Filtered Attendance Records with Mode Filter
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.shiftName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = selectedDepartment === "ALL" || r.department === selectedDepartment;
      const matchShift = selectedShift === "ALL" || r.shiftCode.startsWith(selectedShift);
      const matchStatus = selectedStatus === "ALL" || r.status === selectedStatus;

      let matchMode = true;
      if (attendanceMode === "MANUAL") matchMode = r.isManualEntry === true || r.deviceType === "Manual Entry";

      return matchSearch && matchDept && matchShift && matchStatus && matchMode;
    });
  }, [records, searchTerm, selectedDepartment, selectedShift, selectedStatus, attendanceMode]);

  // KPI Metrics
  const metrics = useMemo(() => {
    const present = records.filter((r) => r.status === "Present").length + 72;
    const late = records.filter((r) => r.status === "Late").length + 4;
    const absent = records.filter((r) => r.status === "Absent").length + 1;
    const onLeave = records.filter((r) => r.status === "On Leave" || r.status === "Weekly Off").length + 12;
    return { present, late, absent, onLeave };
  }, [records]);

  // Handle Manual Punch-In / Punch-Out Submit
  const handleSaveManualPunch = (e: React.FormEvent) => {
    e.preventDefault();
    const empObj = INITIAL_ATTENDANCE_RECORDS.find((x) => x.employeeId === punchEmpId);
    const empName = empObj?.employeeName || "Rajesh Kumar";
    const empDept = empObj?.department || "Front Office";
    const empDesig = empObj?.designation || "Staff";
    const empAvatar = empObj?.avatar || "RK";

    const today = new Date().toLocaleDateString("en-GB");

    // Check if record exists for this employee
    const existingIndex = records.findIndex((r) => r.employeeId === punchEmpId);

    if (existingIndex >= 0) {
      setRecords((prev) =>
        prev.map((r) =>
          r.employeeId === punchEmpId
            ? {
                ...r,
                checkIn: punchInTime,
                checkOut: punchOutTime,
                workedHours: 8.5,
                status: punchStatus,
                isManualEntry: true,
                deviceType: "Manual Entry",
                manualReason: punchReason || "Manual Punch recorded by HR Manager.",
                editedBy: "Neha Mehta (HR Manager)",
                editedOn: today,
              }
            : r
        )
      );
    } else {
      const newRecord: AttendanceRecord = {
        id: `ATT-${Math.floor(100 + Math.random() * 900)}`,
        employeeId: punchEmpId,
        employeeName: empName,
        department: empDept,
        designation: empDesig,
        avatar: empAvatar,
        shiftCode: "MS-01",
        shiftName: "Morning Shift (A)",
        date: punchDate,
        checkIn: punchInTime,
        checkOut: punchOutTime,
        workedHours: 8.5,
        expectedHours: 8.0,
        status: punchStatus,
        deviceType: "Manual Entry",
        isManualEntry: true,
        manualReason: punchReason || "Manual Punch recorded by HR Manager.",
        editedBy: "Neha Mehta (HR Manager)",
        editedOn: today,
      };
      setRecords((prev) => [newRecord, ...prev]);
    }

    setIsManualPunchModalOpen(false);
    setToastMessage(`Recorded manual punch-in (${punchInTime}) and punch-out (${punchOutTime}) for ${empName}.`);
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource / Attendance & Leave"
      title="Attendance Management"
      description="Monitor daily employee attendance punch logs, manual punch overrides, and shift compliance."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Attendance & Leave" },
        { label: "Attendance" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          {/* Working Manual Punch Button */}
          <Button
            type="button"
            size="sm"
            onClick={() => setIsManualPunchModalOpen(true)}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            + Manual Punch-In / Out
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={showBiometricComingSoon}
            className="rounded-xl text-xs font-bold bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50 shadow-xs cursor-pointer"
          >
            <Fingerprint className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
            Sync Biometrics
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setToastMessage("Exporting attendance report to CSV...")}
            className="rounded-xl text-xs font-medium bg-white text-slate-700 border-slate-300 shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export Report
          </Button>
        </div>
      }
    >
      {/* MODE NAVIGATION SWITCHER TABS (All Logs | Biometric Reader | Manual Overrides | Biometric Terminals) */}
      <div className="flex overflow-x-auto gap-2 mb-4 scrollbar-none">
        {[
          { id: "ALL", label: "All Attendance Logs", count: records.length },
          { id: "BIOMETRIC", label: "Biometric Hardware Logs", count: records.filter((r) => r.deviceType === "Biometric Reader").length },
          { id: "MANUAL", label: "Manual Override Logs", count: records.filter((r) => r.isManualEntry || r.deviceType === "Manual Entry").length },
          { id: "TERMINALS", label: "Biometric Device Status", count: "3/4 Online" },
        ].map((tab) => {
          const isBiometricTab = tab.id === "BIOMETRIC" || tab.id === "TERMINALS";
          const isActive = !isBiometricTab && attendanceMode === tab.id;

          return (
          <button
            key={tab.id}
            onClick={() => {
              if (isBiometricTab) {
                showBiometricComingSoon();
                return;
              }
              setAttendanceMode(tab.id as "ALL" | "MANUAL");
            }}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border",
              isActive
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
              isBiometricTab && "opacity-75"
            )}
          >
            <span>{tab.label}</span>
            <span className={cn(
              "px-1.5 py-0.5 rounded-md text-[10px] font-black",
              isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
            )}>
              {tab.count}
            </span>
          </button>
          );
        })}
      </div>
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: 4 KPI SUMMARY CARDS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <HRKPICard
          label="Total Present"
          value={`${metrics.present} Staff`}
          subtitle="Punch In Verified"
          tone="emerald"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <HRKPICard
          label="Late / Early Out"
          value={`${metrics.late} Staff`}
          subtitle="Grace Period Exceeded"
          tone="amber"
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <HRKPICard
          label="Absent"
          value={`${metrics.absent} Staff`}
          subtitle="No Punch Detected"
          tone="rose"
          icon={<XCircle className="h-5 w-5" />}
        />
        <HRKPICard
          label="On Leave / Weekly Off"
          value={`${metrics.onLeave} Staff`}
          subtitle="Scheduled Rest / Leave"
          tone="blue"
          icon={<Clock className="h-5 w-5" />}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: FILTERS TOOLBAR
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
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              />

              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All Departments</option>
                <option value="Front Office">Front Office</option>
                <option value="Housekeeping">Housekeeping</option>
                <option value="Kitchen / Culinary">Kitchen / Culinary</option>
                <option value="F&B Service">F&amp;B Service</option>
                <option value="Maintenance & Eng.">Maintenance &amp; Eng.</option>
                <option value="HR & Admin">HR &amp; Admin</option>
              </select>

              <select
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All Shifts</option>
                <option value="MS">Morning Shift (MS-01)</option>
                <option value="ES">Evening Shift (ES-02)</option>
                <option value="NS">Night Shift (NS-03)</option>
                <option value="GS">General Shift (GS-04)</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All Statuses</option>
                <option value="Present">🟢 Present</option>
                <option value="Late">🟡 Late</option>
                <option value="Absent">🔴 Absent</option>
                <option value="On Leave">🔵 On Leave</option>
                <option value="Weekly Off">⚪ Weekly Off</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedDepartment("ALL");
                  setSelectedShift("ALL");
                  setSelectedStatus("ALL");
                  setSelectedDate("2026-08-08");
                }}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Mobile Filter Trigger */}
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

      {/* Desktop Table View */}
      <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Assigned Shift</th>
                <th className="py-3 px-4">Punch In</th>
                <th className="py-3 px-4">Punch Out</th>
                <th className="py-3 px-4">Worked Hours</th>
                <th className="py-3 px-4">Device / Verification</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
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
                      {r.shiftCode}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-mono font-bold text-emerald-800">{r.checkIn}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">{r.checkOut}</td>
                  <td className="py-3 px-4 font-black text-slate-900">{r.workedHours} Hrs</td>

                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-bold border",
                        r.isManualEntry
                          ? "bg-amber-100 text-amber-900 border-amber-300"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      )}
                    >
                      {r.deviceType}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <StatusBadge status={r.status} />
                  </td>

                  <td
                    className="py-3 px-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setViewingRecord(r)}
                        title="View Attendance Details"
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPunchEmpId(r.employeeId);
                          setIsManualPunchModalOpen(true);
                        }}
                        title="Manual Edit Punch"
                        className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards View */}
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
                <span className="text-slate-400 text-[10px] block">Punch In / Out</span>
                <span className="font-bold text-slate-900">{r.checkIn} → {r.checkOut}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[10px] block">Worked Duration</span>
                <span className="font-black text-emerald-800 text-sm">{r.workedHours} Hours</span>
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
                View
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setPunchEmpId(r.employeeId);
                  setIsManualPunchModalOpen(true);
                }}
                className="flex-1 bg-emerald-700 text-white text-xs font-bold"
              >
                Manual Punch
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: MANUAL PUNCH-IN / PUNCH-OUT MODAL (Functioning)
      ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isManualPunchModalOpen}
        onClose={() => setIsManualPunchModalOpen(false)}
        title="Manual Punch-In / Punch-Out Entry"
        description="Record or override punch timestamps for an employee."
        size="md"
      >
        <form onSubmit={handleSaveManualPunch} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Employee <span className="text-rose-500">*</span>
            </label>
            <select
              value={punchEmpId}
              onChange={(e) => setPunchEmpId(e.target.value)}
              required
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
            >
              {INITIAL_ATTENDANCE_RECORDS.map((staff) => (
                <option key={staff.employeeId} value={staff.employeeId}>
                  👤 {staff.employeeName} ({staff.employeeId}) - {staff.department}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Attendance Date</label>
              <input
                type="date"
                value={punchDate}
                onChange={(e) => setPunchDate(e.target.value)}
                required
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Attendance Status</label>
              <select
                value={punchStatus}
                onChange={(e) => setPunchStatus(e.target.value as "Present" | "Late" | "Half Day")}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
              >
                <option value="Present">🟢 Present</option>
                <option value="Late">🟡 Late</option>
                <option value="Half Day">🟣 Half Day</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Punch-In Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={punchInTime}
                onChange={(e) => setPunchInTime(e.target.value)}
                placeholder="e.g. 09:00 AM"
                required
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Punch-Out Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={punchOutTime}
                onChange={(e) => setPunchOutTime(e.target.value)}
                placeholder="e.g. 05:30 PM"
                required
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Manual Entry</label>
            <textarea
              rows={2}
              placeholder="e.g. Terminal scanner malfunction / delayed due to monsoon..."
              value={punchReason}
              onChange={(e) => setPunchReason(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsManualPunchModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              Save Manual Punch
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          SIDE DRAWER: VIEW ATTENDANCE DETAILS
      ───────────────────────────────────────────────────────────── */}
      <Drawer
        isOpen={Boolean(viewingRecord)}
        onClose={() => setViewingRecord(null)}
        title="Attendance Punch Log Audit"
        icon={<Clock className="h-5 w-5 text-emerald-700" />}
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

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500 font-medium">Assigned Shift</span>
                <span className="font-bold text-slate-900">{viewingRecord.shiftName} ({viewingRecord.shiftCode})</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Punch In Time</span>
                  <span className="font-extrabold text-emerald-800 text-sm">{viewingRecord.checkIn}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Punch Out Time</span>
                  <span className="font-extrabold text-slate-900 text-sm">{viewingRecord.checkOut}</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <span className="font-bold text-slate-800 uppercase block">Verification &amp; Audit Log:</span>
              <p className="text-slate-600">Verification Source: <strong className="text-slate-900">{viewingRecord.deviceType}</strong></p>
              {viewingRecord.inLocation && <p className="text-slate-600">Terminal: <strong className="text-slate-900">{viewingRecord.inLocation}</strong></p>}
              {viewingRecord.isManualEntry && (
                <div className="pt-1 text-amber-900">
                  <span className="font-bold block">Manual Entry Reason:</span>
                  <p className="italic">"{viewingRecord.manualReason || "Manual Punch Override."}"</p>
                  <p className="text-[10px] text-slate-400 mt-1">Edited by {viewingRecord.editedBy} on {viewingRecord.editedOn}</p>
                </div>
              )}
            </div>
          </>
        )}
      </Drawer>

      {/* MOBILE FILTERS BOTTOM SHEET MODAL */}
      {isMobileFilterOpen && (
        <Modal
          isOpen={isMobileFilterOpen}
          onClose={() => setIsMobileFilterOpen(false)}
          title="Filter Attendance Records"
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
              <label className="block font-bold text-slate-700 mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
              >
                <option value="ALL">All Statuses</option>
                <option value="Present">🟢 Present</option>
                <option value="Late">🟡 Late</option>
                <option value="Absent">🔴 Absent</option>
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
