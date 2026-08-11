"use client";

import React, { useState } from "react";
import {
  Users,
  UserCheck,
  CalendarOff,
  Wallet,
  UserPlus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  Gift,
  Award,
  Calendar,
  MessageSquareWarning,
  Plus,
  ArrowRight,
  TrendingUp,
  FileCheck,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatMiniCard } from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import {
  sampleHRKpiSummary,
  sampleAttendanceBreakdown,
  sampleDepartmentHeadcounts,
  samplePendingLeaves,
  sampleHRActivities,
  sampleEvents,
  sampleHolidaysAndShifts,
  sampleGrievances,
  PendingLeaveItem,
} from "@/app/data/hr/hrDashboardData";
import { cn } from "@/lib/utils";

export function HRDashboardView() {
  const [leavesList, setLeavesList] = useState<PendingLeaveItem[]>(samplePendingLeaves);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleApproveLeave = (id: string, name: string) => {
    setLeavesList((prev) => prev.filter((item) => item.id !== id));
    setToastMessage(`✓ Approved leave request for ${name}.`);
  };

  const handleRejectLeave = (id: string, name: string) => {
    setLeavesList((prev) => prev.filter((item) => item.id !== id));
    setToastMessage(`Rejected leave request for ${name}.`);
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource Module"
      title="Human Resource Dashboard"
      description="Real-time employee headcount, shift attendance, leave requests, payroll status, and grievance metrics."
      breadcrumbs={[{ label: "Human Resource", href: "/human-resources/dashboard" }, { label: "Dashboard" }]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <a href="/human-resources/attendance-leave/attendance">
            <Button size="sm" variant="outline" className="bg-white text-slate-700 border-slate-300 font-semibold text-xs rounded-xl shadow-xs">
              <Clock className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
              Mark Attendance
            </Button>
          </a>
          <a href="/human-resources/attendance-leave/leave-management">
            <Button size="sm" variant="outline" className="bg-white text-slate-700 border-slate-300 font-semibold text-xs rounded-xl shadow-xs">
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
              Approve Leaves
            </Button>
          </a>
        </div>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          ROW 1: 4 Core Domain KPI Cards (Employees, Leave, Grievances, Payroll)
      ───────────────────────────────────────────────────────────── */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Total Employees */}
        <StatMiniCard
          label="Total Employees"
          value={sampleHRKpiSummary.totalEmployees}
          sublabel={`+${sampleHRKpiSummary.newJoineesThisMonth} New Joinees`}
          accent="#0284c7"
          icon={Users}
        />

        {/* 2. Pending Leave */}
        <StatMiniCard
          label="Pending Leave"
          value={`${sampleHRKpiSummary.pendingLeaveRequestsCount} Requests`}
          sublabel="Awaiting Approval"
          accent="#f59e0b"
          icon={CalendarOff}
        />

        {/* 3. Open Grievances */}
        <StatMiniCard
          label="Open Grievances"
          value={`${sampleGrievances.open} Active`}
          sublabel={`${sampleGrievances.escalated} Escalated`}
          accent="#e11d48"
          icon={MessageSquareWarning}
        />

        {/* 4. Payroll Status */}
        <StatMiniCard
          label="Payroll Status"
          value={`${sampleHRKpiSummary.payrollProcessedCount} Processed`}
          sublabel={`${sampleHRKpiSummary.payrollPendingCount} Pending`}
          accent="#8b5cf6"
          icon={Wallet}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ROW 2: Attendance Overview & Department Headcount
      ───────────────────────────────────────────────────────────── */}
      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Attendance Overview (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600" />
                Attendance Overview Today
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Shift headcount summary for active operational departments
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-200">
              {sampleAttendanceBreakdown.present} / 128 Staff Active
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Present</span>
              <p className="text-xl font-black text-emerald-900 mt-1">{sampleAttendanceBreakdown.present}</p>
              <span className="text-[10px] text-emerald-700 font-medium">81.2% Shift</span>
            </div>

            <div className="rounded-xl border border-rose-200/80 bg-rose-50/50 p-3 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Absent</span>
              <p className="text-xl font-black text-rose-900 mt-1">{sampleAttendanceBreakdown.absent}</p>
              <span className="text-[10px] text-rose-700 font-medium">9.3% Unexcused</span>
            </div>

            <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">On Leave</span>
              <p className="text-xl font-black text-amber-900 mt-1">{sampleAttendanceBreakdown.onLeave}</p>
              <span className="text-[10px] text-amber-700 font-medium">6.2% Approved</span>
            </div>

            <div className="rounded-xl border border-sky-200/80 bg-sky-50/50 p-3 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Late Arrivals</span>
              <p className="text-xl font-black text-sky-900 mt-1">{sampleAttendanceBreakdown.lateArrivals}</p>
              <span className="text-[10px] text-sky-700 font-medium">&lt;30m Grace</span>
            </div>
          </div>

          {/* Stacked Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-semibold text-slate-600">
              <span>Overall Shift Attendance Distribution</span>
              <span>104 On Duty</span>
            </div>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 border border-slate-200">
              <div className="bg-emerald-500 rounded-l-full" style={{ width: "81.2%" }} title="Present: 104" />
              <div className="bg-rose-500" style={{ width: "9.3%" }} title="Absent: 12" />
              <div className="bg-amber-500" style={{ width: "6.2%" }} title="On Leave: 8" />
              <div className="bg-sky-500 rounded-r-full" style={{ width: "3.3%" }} title="Late: 4" />
            </div>
          </div>
        </div>

        {/* Department Headcount Chart (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-purple-600" />
              Department Headcount
            </h3>
            <span className="text-[11px] text-slate-500 font-semibold">6 Departments</span>
          </div>

          <div className="space-y-2.5">
            {sampleDepartmentHeadcounts.map((dept) => {
              const percentage = Math.round((dept.count / 128) * 100);
              return (
                <div key={dept.department} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">{dept.department}</span>
                    <span className="font-bold text-slate-900">{dept.count} <span className="text-[10px] text-slate-400 font-normal">({percentage}%)</span></span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn("h-full rounded-full transition-all duration-300", dept.color)}
                      style={{ width: `${(dept.count / 34) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ROW 3: Pending Leave Requests & Recent HR Activities
      ───────────────────────────────────────────────────────────── */}
      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Pending Leave Requests (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CalendarOff className="h-4 w-4 text-amber-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Pending Leave Requests ({leavesList.length})
              </h3>
            </div>
            <a href="/human-resources/attendance-leave/leave-management" className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </a>
          </div>

          <div className="space-y-2.5">
            {leavesList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                No pending leave requests requiring approval.
              </div>
            ) : (
              leavesList.map((leave) => (
                <div
                  key={leave.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs transition-colors hover:bg-slate-100/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800 font-bold text-xs shrink-0">
                      {leave.avatar}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{leave.employeeName}</p>
                      <p className="text-[10px] font-semibold text-slate-500">{leave.department} • <span className="text-amber-800">{leave.leaveType}</span></p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                      {leave.fromDate} - {leave.toDate} ({leave.days}d)
                    </span>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Reason: {leave.reason}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleApproveLeave(leave.id, leave.employeeName)}
                      className="h-7 px-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] cursor-pointer"
                    >
                      <Check className="h-3 w-3 mr-0.5" /> Approve
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRejectLeave(leave.id, leave.employeeName)}
                      className="h-7 px-2.5 rounded-lg bg-white border-slate-300 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-semibold text-[11px] cursor-pointer"
                    >
                      <X className="h-3 w-3 mr-0.5" /> Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent HR Activities Feed (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Recent HR Activities
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Live Feed</span>
          </div>

          <div className="space-y-3">
            {sampleHRActivities.map((act) => (
              <div key={act.id} className="flex items-start gap-2.5 text-xs">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg font-bold shrink-0 mt-0.5",
                    act.type === "join" && "bg-sky-100 text-sky-800",
                    act.type === "leave" && "bg-emerald-100 text-emerald-800",
                    act.type === "attendance" && "bg-amber-100 text-amber-800",
                    act.type === "payroll" && "bg-purple-100 text-purple-800",
                    act.type === "grievance" && "bg-rose-100 text-rose-800"
                  )}
                >
                  {act.type === "join" && <UserPlus className="h-3.5 w-3.5" />}
                  {act.type === "leave" && <CheckCircle2 className="h-3.5 w-3.5" />}
                  {act.type === "attendance" && <Clock className="h-3.5 w-3.5" />}
                  {act.type === "payroll" && <Wallet className="h-3.5 w-3.5" />}
                  {act.type === "grievance" && <MessageSquareWarning className="h-3.5 w-3.5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900 truncate">{act.title}</p>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-1">{act.timeAgo}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate mt-0.5">{act.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ROW 4: Birthdays & Anniversaries + Holidays & Shift Exceptions
      ───────────────────────────────────────────────────────────── */}
      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Birthdays & Anniversaries (6 cols) */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Gift className="h-4 w-4 text-rose-500" />
              Birthdays &amp; Work Anniversaries
            </h3>
            <span className="text-[11px] font-semibold text-slate-500">Upcoming Celebrations</span>
          </div>

          <div className="space-y-2.5">
            {sampleEvents.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-xs">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-xl font-bold text-xs shrink-0",
                      ev.type === "birthday" ? "bg-rose-100 text-rose-800" : "bg-indigo-100 text-indigo-800"
                    )}
                  >
                    {ev.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      {ev.name}
                      {ev.type === "birthday" ? (
                        <Gift className="h-3 w-3 text-rose-500 inline" />
                      ) : (
                        <Award className="h-3 w-3 text-indigo-500 inline" />
                      )}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">{ev.department} {ev.years ? `• ${ev.years} Years Completed` : ""}</p>
                  </div>
                </div>

                <span className="rounded-lg bg-white border border-slate-200 px-2 py-1 text-[11px] font-bold text-slate-700">
                  {ev.date}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Holidays & Shift Exceptions (6 cols) */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-600" />
              Holidays &amp; Shift Exceptions
            </h3>
            <span className="text-[11px] font-semibold text-slate-500">Upcoming Schedule</span>
          </div>

          <div className="space-y-2.5">
            {sampleHolidaysAndShifts.map((hs) => (
              <div key={hs.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-xs">
                <div>
                  <p className="font-bold text-slate-900">{hs.title}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{hs.date}</p>
                </div>

                <span
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border",
                    hs.type === "holiday" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-purple-50 text-purple-800 border-purple-200"
                  )}
                >
                  {hs.badgeText}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ROW 5: Grievance Summary (4 Mini Statistic Cards)
      ───────────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <MessageSquareWarning className="h-4 w-4 text-rose-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Grievance &amp; Complaint Summary Overview
            </h2>
          </div>
          <a href="/human-resources/grievances/complaint-list" className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
            Grievance Portal <ArrowRight className="h-3 w-3" />
          </a>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Open Complaints</span>
            <p className="text-2xl font-black text-rose-900 mt-1">{sampleGrievances.open}</p>
            <span className="text-[10px] text-rose-700 font-semibold">Requires HR Review</span>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">In Progress</span>
            <p className="text-2xl font-black text-amber-900 mt-1">{sampleGrievances.inProgress}</p>
            <span className="text-[10px] text-amber-700 font-semibold">Under Investigation</span>
          </div>

          <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Escalated</span>
            <p className="text-2xl font-black text-purple-900 mt-1">{sampleGrievances.escalated}</p>
            <span className="text-[10px] text-purple-700 font-semibold">GM / Legal Escalation</span>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Resolved (YTD)</span>
            <p className="text-2xl font-black text-emerald-900 mt-1">{sampleGrievances.resolved}</p>
            <span className="text-[10px] text-emerald-700 font-semibold">Closed &amp; Archived</span>
          </div>
        </div>
      </section>
    </ModulePageShell>
  );
}
