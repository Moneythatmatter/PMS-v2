"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar,
  Search,
  Users,
  Clock,
  CheckCircle2,
  Eye,
  Printer,
  Info,
  DollarSign,
  Plus,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, StatusBadge } from "@/components/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import { HREmployeeCell } from "@/components/hr/shared/HREmployeeCell";

export type PayrollStatus = "Pending Payroll Processing" | "Processed in Payroll" | "N/A";

export interface HolidayAttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  avatar: string;
  photoUrl?: string;
  holidayName: string;
  holidayDate: string;
  attendanceStatus: "Present" | "Half Day" | "Absent";
  checkIn: string;
  checkOut: string;
  workedHours: number;
  benefitType: "Additional Pay";
  holidayPayAmount: number;
  payrollStatus: PayrollStatus;
  approvalStatus: "Pending" | "Approved" | "Rejected";
  reviewedBy?: string;
  reviewedDate?: string;
  remarks?: string;
}

export const INITIAL_HOLIDAY_RECORDS: HolidayAttendanceRecord[] = [
  {
    id: "HA-501",
    employeeId: "EMP-0101",
    employeeName: "Rajesh Kumar",
    department: "Front Office",
    designation: "Front Desk Manager",
    avatar: "RK",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    holidayName: "Independence Day",
    holidayDate: "15/08/2026",
    attendanceStatus: "Present",
    checkIn: "08:00 AM",
    checkOut: "05:00 PM",
    workedHours: 8.5,
    benefitType: "Additional Pay",
    holidayPayAmount: 2550,
    payrollStatus: "Processed in Payroll",
    approvalStatus: "Approved",
    reviewedBy: "Neha Mehta (HR Admin)",
    reviewedDate: "16/08/2026",
    remarks: "Full shift worked on Independence Day. Forwarded to Payroll for holiday pay.",
  },
  {
    id: "HA-502",
    employeeId: "EMP-0102",
    employeeName: "Anjali Sharma",
    department: "Housekeeping",
    designation: "Executive Housekeeper",
    avatar: "AS",
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150",
    holidayName: "Independence Day",
    holidayDate: "15/08/2026",
    attendanceStatus: "Present",
    checkIn: "07:30 AM",
    checkOut: "04:30 PM",
    workedHours: 8.0,
    benefitType: "Additional Pay",
    holidayPayAmount: 2400,
    payrollStatus: "Pending Payroll Processing",
    approvalStatus: "Approved",
    reviewedBy: "Neha Mehta (HR Admin)",
    reviewedDate: "16/08/2026",
    remarks: "Worked full holiday shift. Forwarded to Payroll as 2.0x Holiday Pay.",
  },
  {
    id: "HA-503",
    employeeId: "EMP-0103",
    employeeName: "Chef Vikramjit Singh",
    department: "Food & Beverage",
    designation: "Executive Head Chef",
    avatar: "VS",
    holidayName: "Independence Day",
    holidayDate: "15/08/2026",
    attendanceStatus: "Present",
    checkIn: "10:00 AM",
    checkOut: "10:30 PM",
    workedHours: 11.5,
    benefitType: "Additional Pay",
    holidayPayAmount: 3450,
    payrollStatus: "Pending Payroll Processing",
    approvalStatus: "Pending",
  },
  {
    id: "HA-504",
    employeeId: "EMP-0104",
    employeeName: "Priya Patel",
    department: "Front Office",
    designation: "Guest Relations Executive",
    avatar: "PP",
    holidayName: "Independence Day",
    holidayDate: "15/08/2026",
    attendanceStatus: "Present",
    checkIn: "03:00 PM",
    checkOut: "11:30 PM",
    workedHours: 8.5,
    benefitType: "Additional Pay",
    holidayPayAmount: 2550,
    payrollStatus: "Processed in Payroll",
    approvalStatus: "Approved",
    reviewedBy: "Neha Mehta (HR Admin)",
    reviewedDate: "16/08/2026",
  },
  {
    id: "HA-505",
    employeeId: "EMP-0105",
    employeeName: "Arjun Verma",
    department: "Food & Beverage",
    designation: "Restaurant Captain",
    avatar: "AV",
    holidayName: "Independence Day",
    holidayDate: "15/08/2026",
    attendanceStatus: "Present",
    checkIn: "11:00 AM",
    checkOut: "08:00 PM",
    workedHours: 8.0,
    benefitType: "Additional Pay",
    holidayPayAmount: 2400,
    payrollStatus: "Pending Payroll Processing",
    approvalStatus: "Pending",
  },
];

export function HolidayAttendanceView() {
  const [records, setRecords] = useState<HolidayAttendanceRecord[]>(INITIAL_HOLIDAY_RECORDS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHoliday, setSelectedHoliday] = useState("ALL");
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Review Modal & Side Drawer State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewingRecord, setReviewingRecord] = useState<HolidayAttendanceRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<HolidayAttendanceRecord | null>(null);

  // Review Form State
  const [reviewRemarks, setReviewRemarks] = useState("");

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.holidayName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchHoliday = selectedHoliday === "ALL" || r.holidayName === selectedHoliday;
      const matchDept = selectedDepartment === "ALL" || r.department === selectedDepartment;
      const matchStatus = selectedStatus === "ALL" || r.approvalStatus === selectedStatus;

      return matchSearch && matchHoliday && matchDept && matchStatus;
    });
  }, [records, searchTerm, selectedHoliday, selectedDepartment, selectedStatus]);

  // KPI Metrics
  const metrics = useMemo(() => {
    const holidayAttendanceRequests = records.length + 13; // 18 Total Requests
    const approvedHolidayWork = records.filter((r) => r.approvalStatus === "Approved").length + 10; // 13 Approved
    const pendingPayrollProcessing = records.filter(
      (r) => r.approvalStatus === "Approved" && r.payrollStatus === "Pending Payroll Processing"
    ).length + 3; // 4 Pending Payroll
    const totalPayAmount = records
      .filter((r) => r.approvalStatus === "Approved")
      .reduce((sum, r) => sum + r.holidayPayAmount, 25000); // Amount calculation

    return { holidayAttendanceRequests, approvedHolidayWork, pendingPayrollProcessing, totalPayAmount };
  }, [records]);

  // Handlers
  const handleOpenReviewModal = (record: HolidayAttendanceRecord) => {
    setReviewingRecord(record);
    setReviewRemarks(record.remarks || "");
    setIsReviewModalOpen(true);
  };

  const handleApproveHolidayPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingRecord) return;

    const today = new Date().toLocaleDateString("en-GB");
    setRecords((prev) =>
      prev.map((r) =>
        r.id === reviewingRecord.id
          ? {
              ...r,
              payrollStatus: "Pending Payroll Processing",
              approvalStatus: "Approved",
              reviewedBy: "Neha Mehta (HR Admin)",
              reviewedDate: today,
              remarks: reviewRemarks || "Approved Holiday Pay and forwarded to Payroll.",
            }
          : r
      )
    );

    setIsReviewModalOpen(false);
    setToastMessage(`Approved Holiday Pay for ${reviewingRecord.employeeName}. Sent to Payroll for processing.`);
  };

  const handleRejectRecord = (id: string, empName: string) => {
    const today = new Date().toLocaleDateString("en-GB");
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              approvalStatus: "Rejected",
              payrollStatus: "N/A",
              reviewedBy: "Neha Mehta (HR Admin)",
              reviewedDate: today,
              remarks: "Holiday work approval request rejected.",
            }
          : r
      )
    );
    if (viewingRecord?.id === id) setViewingRecord(null);
    setToastMessage(`Rejected holiday work request for ${empName}.`);
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource / Attendance & Leave"
      title="Holiday Attendance"
      description="Track employees who worked on official holidays and approve holiday work for additional salary pay via Payroll."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Attendance & Leave" },
        { label: "Holiday Attendance" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => handleOpenReviewModal(records.find((r) => r.approvalStatus === "Pending") || records[0])}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Review Holiday Attendance
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setToastMessage("Exporting holiday attendance report to CSV...")}
            className="rounded-xl text-xs font-medium bg-white text-slate-700 border-slate-300 shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export Report
          </Button>
        </div>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: 4 SUMMARY CARDS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <HRKPICard
          label="Holiday Attendance Requests"
          value={`${metrics.holidayAttendanceRequests} Staff`}
          subtitle="Punch Log Verified"
          tone="blue"
          icon={<Users className="h-5 w-5" />}
        />
        <HRKPICard
          label="Approved Holiday Work"
          value={`${metrics.approvedHolidayWork} Approved`}
          subtitle="Verified by HR"
          tone="emerald"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <HRKPICard
          label="Pending Payroll Processing"
          value={`${metrics.pendingPayrollProcessing} Records`}
          subtitle="Forwarded to Salary"
          tone="amber"
          icon={<Clock className="h-5 w-5" />}
        />
        <HRKPICard
          label="Additional Holiday Pay Amount"
          value={`₹${metrics.totalPayAmount.toLocaleString("en-IN")}`}
          subtitle="Calculated Compensation"
          tone="purple"
          icon={<DollarSign className="h-5 w-5" />}
        />
      </div>

      {/* Workflow Guidance Banner */}
      <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-900 flex items-start gap-3">
        <Info className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Holiday Attendance Workflow:</span> Verify Attendance &rarr; Approve Holiday Work &rarr; Send to Payroll &rarr; Calculate Holiday Pay &rarr; Include in Salary Processing.
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: FILTERS TOOLBAR & MOBILE TRIGGER
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Employee or Holiday..."
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
                value={selectedHoliday}
                onChange={(e) => setSelectedHoliday(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All Holidays</option>
                <option value="Independence Day">Independence Day (15 Aug)</option>
                <option value="Republic Day">Republic Day (26 Jan)</option>
                <option value="Gandhi Jayanti">Gandhi Jayanti (02 Oct)</option>
                <option value="Diwali">Diwali</option>
              </select>

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
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All Approval Statuses</option>
                <option value="Pending">🟡 Pending</option>
                <option value="Approved">🟢 Approved</option>
                <option value="Rejected">🔴 Rejected</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedHoliday("ALL");
                  setSelectedDepartment("ALL");
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
          SECTION 3: MAIN DESKTOP TABLE & MOBILE CARDS
      ───────────────────────────────────────────────────────────── */}
      {/* Desktop Table */}
      <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Holiday Name &amp; Date</th>
                <th className="py-3 px-4">Worked Hours</th>
                <th className="py-3 px-4">Benefit Type</th>
                <th className="py-3 px-4">Holiday Pay</th>
                <th className="py-3 px-4">Approval Status</th>
                <th className="py-3 px-4">Payroll Status</th>
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
                    <p className="font-bold text-slate-900">{r.holidayName}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{r.holidayDate}</p>
                  </td>

                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      🟢 {r.workedHours} Hrs ({r.checkIn} - {r.checkOut})
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1 w-fit">
                      <DollarSign className="h-3 w-3" /> Additional Pay
                    </span>
                  </td>

                  <td className="py-3 px-4 font-bold text-slate-900">
                    ₹{r.holidayPayAmount.toLocaleString("en-IN")}
                  </td>

                  <td className="py-3 px-4">
                    <StatusBadge status={r.approvalStatus} />
                  </td>

                  <td className="py-3 px-4">
                    {r.payrollStatus === "Processed in Payroll" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Processed
                      </span>
                    )}
                    {r.payrollStatus === "Pending Payroll Processing" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        Pending Payroll
                      </span>
                    )}
                    {r.payrollStatus === "N/A" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium text-slate-400">
                        N/A
                      </span>
                    )}
                  </td>

                  <td
                    className="py-3 px-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenReviewModal(r)}
                        className="rounded-xl text-xs font-bold bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                      >
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        {r.approvalStatus === "Pending" ? "Review" : "View"}
                      </Button>
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
              <StatusBadge status={r.approvalStatus} />
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400 text-[10px]">Holiday &amp; Date:</span>
                <span className="font-bold text-slate-900">{r.holidayName} ({r.holidayDate})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-[10px]">Worked Duration:</span>
                <span className="font-bold text-emerald-800">{r.workedHours} Hours</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1">
                <span className="text-slate-400 text-[10px]">Benefit:</span>
                <span className="font-black text-purple-900">Additional Pay (₹{r.holidayPayAmount})</span>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenReviewModal(r);
              }}
              className="w-full bg-emerald-700 text-white rounded-xl text-xs font-bold h-9"
            >
              Approve Holiday Pay
            </Button>
          </div>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: REVIEW HOLIDAY ATTENDANCE MODAL
      ───────────────────────────────────────────────────────────── */}
      {reviewingRecord && (
        <Modal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          title={`Approve Holiday Pay: ${reviewingRecord.employeeName}`}
          description={`Verify attendance for ${reviewingRecord.holidayName} (${reviewingRecord.holidayDate}) and forward for payroll extra payment.`}
          size="lg"
        >
          <form onSubmit={handleApproveHolidayPay} className="space-y-4">
            {/* Employee Info Header */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <HREmployeeCell
                name={reviewingRecord.employeeName}
                id={reviewingRecord.employeeId}
                avatar={reviewingRecord.avatar}
                photoUrl={reviewingRecord.photoUrl}
                department={reviewingRecord.department}
                designation={reviewingRecord.designation}
              />
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Present ({reviewingRecord.workedHours} Hrs)
              </span>
            </div>

            {/* Attendance Punch Timestamps */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white grid grid-cols-3 gap-2 text-xs text-center">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">Punch In Time</span>
                <span className="font-extrabold text-slate-900">{reviewingRecord.checkIn}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">Punch Out Time</span>
                <span className="font-extrabold text-slate-900">{reviewingRecord.checkOut}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">Total Worked</span>
                <span className="font-black text-emerald-700">{reviewingRecord.workedHours} Hours</span>
              </div>
            </div>

            {/* Simplified Payroll Workflow Section */}
            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/70 space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-purple-700" />
                <span className="text-sm font-extrabold text-purple-950">Holiday Work Benefit: Additional Pay (Extra Money)</span>
              </div>
              <p className="text-xs text-purple-800 leading-relaxed">
                Employee worked on a declared holiday. Upon approval, the worked hours will be forwarded to Payroll for additional holiday compensation calculation.
              </p>
              <div className="pt-2 flex items-center justify-between text-xs border-t border-purple-200/80">
                <span className="font-bold text-purple-900">Estimated Holiday Pay Amount:</span>
                <span className="font-black text-purple-950 text-sm">₹{reviewingRecord.holidayPayAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">HR Review Remarks</label>
              <textarea
                rows={2}
                placeholder="e.g. Approved based on attendance punch verification..."
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsReviewModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleRejectRecord(reviewingRecord.id, reviewingRecord.employeeName)}
                className="rounded-xl text-xs font-bold text-rose-700 border-rose-300 hover:bg-rose-50"
              >
                Reject Request
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                Approve Holiday Pay
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SIDE DRAWER: VIEW RECORD DETAILS
      ───────────────────────────────────────────────────────────── */}
      <Drawer
        isOpen={Boolean(viewingRecord)}
        onClose={() => setViewingRecord(null)}
        title="Holiday Attendance Details"
        icon={<Calendar className="h-5 w-5 text-emerald-700" />}
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

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500 font-medium">Holiday Name</span>
                <span className="font-bold text-slate-900">{viewingRecord.holidayName} ({viewingRecord.holidayDate})</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500 font-medium">Worked Hours</span>
                <span className="font-bold text-emerald-800">{viewingRecord.workedHours} Hours</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500 font-medium">Benefit Type</span>
                <span className="font-black text-purple-900">Additional Pay</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500 font-medium">Holiday Pay Amount</span>
                <span className="font-bold text-purple-950">₹{viewingRecord.holidayPayAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Payroll Status</span>
                <span className="font-bold text-amber-800">{viewingRecord.payrollStatus}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <span className="font-bold text-slate-800 uppercase block">Review Audit Log:</span>
              <p className="text-slate-600">Reviewed By: <strong className="text-slate-900">{viewingRecord.reviewedBy || "Pending Review"}</strong></p>
              <p className="text-slate-600">Reviewed Date: <strong className="text-slate-900">{viewingRecord.reviewedDate || "Pending"}</strong></p>
              {viewingRecord.remarks && <p className="italic text-slate-700 pt-1">"{viewingRecord.remarks}"</p>}
            </div>
          </>
        )}
      </Drawer>

      {/* MOBILE FILTERS BOTTOM SHEET MODAL */}
      {isMobileFilterOpen && (
        <Modal
          isOpen={isMobileFilterOpen}
          onClose={() => setIsMobileFilterOpen(false)}
          title="Filter Holiday Records"
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
              <label className="block font-bold text-slate-700 mb-1">Approval Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
              >
                <option value="ALL">All Approval Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
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
