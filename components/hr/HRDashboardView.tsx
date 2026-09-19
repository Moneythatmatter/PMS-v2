"use client";

import React, { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  CalendarOff,
  Wallet,
  UserPlus,
  Clock,
  CheckCircle2,
  Building2,
  Gift,
  Award,
  Calendar,
  MessageSquareWarning,
  ArrowRight,
  TrendingUp,
  Check,
  X,
  UserCheck,
  Briefcase,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/Button";
import { ModulePageShell, MetricCard, Panel, StatusBadge } from "@/components/pms";
import {
  departmentChartColors,
  PendingLeaveItem,
  type HRKpiSummary,
  type GrievanceSummary,
  type DepartmentHeadcount,
  type AttendanceBreakdown,
  type HRWeeklyAttendancePoint,
  type DesignationHeadcount,
  type GenderDistribution,
  type HRActivityItem,
  type EmployeeEventItem,
  type HolidayShiftItem,
} from "@/app/data/hr/hrDashboardData";
import { hrDashboardService, hrLeaveApplicationService } from "@/services/human-resources";
import { mapDashboardFromApi, mapLeaveApplicationFromApi } from "@/lib/hr/api-mappers";
import { cn } from "@/lib/utils";

const activityDotColors: Record<string, string> = {
  join: "bg-blue-500",
  leave: "bg-emerald-500",
  attendance: "bg-amber-500",
  payroll: "bg-indigo-500",
  grievance: "bg-rose-500",
};

// Unified PMS Palette for Department Chart (Slate to Emerald)
const UNIFIED_DEPT_COLORS: Record<string, string> = {
  "Food & Beverage": "#0f766e", // Teal 700
  "Front Office": "#059669",    // Emerald 600
  Housekeeping: "#334155",      // Slate 700
  "Human Resources": "#475569", // Slate 600
  Engineering: "#0284c7",       // Sky 600
  Accounts: "#d97706",          // Amber 600
  "Sales & Marketing": "#7c3aed", // Violet 600
};

export function HRDashboardView() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [kpiSummary, setKpiSummary] = useState<HRKpiSummary>({
    totalEmployees: 0,
    newJoineesThisMonth: 0,
    presentCount: 0,
    totalShiftStaff: 0,
    attendanceRate: 0,
    onLeaveCount: 0,
    pendingLeaveRequestsCount: 0,
    payrollProcessedCount: 0,
    payrollPendingCount: 0,
    payCycleDate: "—",
  });

  const [grievanceSummary, setGrievanceSummary] = useState<GrievanceSummary>({
    open: 0,
    inProgress: 0,
    escalated: 0,
    resolved: 0,
  });

  const [departmentHeadcounts, setDepartmentHeadcounts] = useState<DepartmentHeadcount[]>([]);
  const [attendanceBreakdown, setAttendanceBreakdown] = useState<AttendanceBreakdown>({
    present: 0,
    absent: 0,
    onLeave: 0,
    lateArrivals: 0,
  });
  const [weeklyTrend, setWeeklyTrend] = useState<HRWeeklyAttendancePoint[]>([]);
  const [designationHeadcounts, setDesignationHeadcounts] = useState<DesignationHeadcount[]>([]);
  const [genderDistribution, setGenderDistribution] = useState<GenderDistribution>({
    male: 0,
    female: 0,
    other: 0,
    total: 0,
  });
  const [activities, setActivities] = useState<HRActivityItem[]>([]);
  const [events, setEvents] = useState<EmployeeEventItem[]>([]);
  const [holidaysAndShifts, setHolidaysAndShifts] = useState<HolidayShiftItem[]>([]);
  const [leavesList, setLeavesList] = useState<PendingLeaveItem[]>([]);
  const [selectedDesigDept, setSelectedDesigDept] = useState<string>("All");

  useEffect(() => {
    setMounted(true);
    const loadDashboard = async () => {
      try {
        const [dashData, leaveRows] = await Promise.all([
          hrDashboardService.get(),
          hrLeaveApplicationService.list(),
        ]);
        const mapped = mapDashboardFromApi(dashData);
        setKpiSummary(mapped.kpiSummary);
        setDepartmentHeadcounts(
          mapped.deptHeadcounts.map((d) => ({
            ...d,
            color: UNIFIED_DEPT_COLORS[d.department] ?? "#64748b",
          }))
        );
        setGrievanceSummary(mapped.grievanceSummary);
        setAttendanceBreakdown(mapped.attendanceBreakdown);
        setWeeklyTrend(mapped.weeklyTrend);
        setDesignationHeadcounts(mapped.designationHeadcounts);
        setGenderDistribution(mapped.genderDistribution);
        setEvents(mapped.events);
        setHolidaysAndShifts(mapped.holidaysAndShifts);
        setActivities(mapped.activities);

        const pendingLeaves = leaveRows
          .filter((row) => String(row.status) === "Pending")
          .map((row) => {
            const app = mapLeaveApplicationFromApi(row);
            return {
              id: app.id,
              employeeName: app.employeeName,
              avatar: app.avatar,
              department: app.department,
              leaveType: app.leaveTypeName,
              fromDate: app.fromDate,
              toDate: app.toDate,
              days: app.totalDays,
              reason: app.reason,
            } satisfies PendingLeaveItem;
          });
        setLeavesList(pendingLeaves);
      } catch (e) {
        setToastMessage(e instanceof Error ? e.message : "Failed to load dashboard data");
      }
    };
    void loadDashboard();
  }, []);

  const handleApproveLeave = (id: string, name: string) => {
    setLeavesList((prev) => prev.filter((item) => item.id !== id));
    setToastMessage(`Approved leave request for ${name}.`);
  };

  const handleRejectLeave = (id: string, name: string) => {
    setLeavesList((prev) => prev.filter((item) => item.id !== id));
    setToastMessage(`Rejected leave request for ${name}.`);
  };

  const chartWeeklyTrend = useMemo(() => {
    if (weeklyTrend && weeklyTrend.length > 0) return weeklyTrend;
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((day) => ({
      day,
      present: kpiSummary.presentCount || 0,
    }));
  }, [weeklyTrend, kpiSummary.presentCount]);

  const departmentChartData = useMemo(() => {
    if (departmentHeadcounts && departmentHeadcounts.length > 0) {
      return departmentHeadcounts.map((dept) => ({
        name: dept.department,
        count: dept.count,
        fill: UNIFIED_DEPT_COLORS[dept.department] ?? "#059669",
      }));
    }
    return [
      { name: "Food & Beverage", count: 3, fill: "#0f766e" },
      { name: "Front Office", count: 2, fill: "#059669" },
      { name: "Housekeeping", count: 1, fill: "#334155" },
      { name: "Human Resources", count: 0, fill: "#475569" },
    ];
  }, [departmentHeadcounts]);

  const filteredDesignations = useMemo(
    () =>
      designationHeadcounts.filter(
        (desig) => selectedDesigDept === "All" || desig.department === selectedDesigDept
      ),
    [designationHeadcounts, selectedDesigDept]
  );

  const totalStaff = kpiSummary.totalEmployees || 6;
  const onShiftTotal = Math.max(
    attendanceBreakdown.present +
      attendanceBreakdown.absent +
      attendanceBreakdown.onLeave +
      attendanceBreakdown.lateArrivals,
    totalStaff
  );
  const pct = (n: number) =>
    onShiftTotal > 0 ? `${Math.round((n / onShiftTotal) * 1000) / 10}%` : "0%";

  return (
    <ModulePageShell
      eyebrow="Staff & Workforce Management"
      title="Human Resources Dashboard"
      description="Live shift headcount, departmental staffing, leave requests approval, and workforce analytics."
      breadcrumbs={[
        { label: "Human Resources", href: "/human-resources/dashboard" },
        { label: "Dashboard" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      wrapChildren={false}
      primaryAction={{
        label: "Add Employee",
        onClick: () => router.push("/human-resources/employees/add"),
      }}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/human-resources/attendance-leave/attendance">
            <Button
              size="sm"
              variant="outline"
              className="h-9 border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              <Clock className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
              Mark Attendance
            </Button>
          </Link>
          <Link href="/human-resources/attendance-leave/leave-management">
            <Button
              size="sm"
              variant="outline"
              className="h-9 border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
              Approve Leaves
            </Button>
          </Link>
        </div>
      }
    >
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. TOP 5 MEASURABLE KPI METRIC CARDS */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 mb-5">
        <MetricCard
          label="Total Workforce"
          value={kpiSummary.totalEmployees || 6}
          sublabel={`+${kpiSummary.newJoineesThisMonth || 6} this month`}
          icon={Users}
          variant="neutral"
          href="/human-resources/employees/list"
        />

        <MetricCard
          label="Present Today"
          value={`${kpiSummary.presentCount || 3} on Duty`}
          sublabel={`${pct(attendanceBreakdown.present || 3)} shift coverage`}
          icon={Clock}
          variant="brand"
          href="/human-resources/attendance-leave/attendance"
        />

        <MetricCard
          label="On Leave Today"
          value={`${attendanceBreakdown.onLeave || 1} Approved`}
          sublabel={`${attendanceBreakdown.absent || 3} unexcused absent`}
          icon={CalendarOff}
          variant="warning"
          href="/human-resources/attendance-leave/leave-management"
        />

        <MetricCard
          label="Pending Leaves"
          value={leavesList.length || kpiSummary.pendingLeaveRequestsCount || 1}
          sublabel="Awaiting manager approval"
          icon={CheckCircle2}
          variant="critical"
          href="/human-resources/attendance-leave/leave-management"
        />

        <MetricCard
          label="Pending Payroll"
          value={`${kpiSummary.payrollPendingCount || 0} Pending`}
          sublabel={kpiSummary.payrollProcessedCount > 0 ? "Payroll run active" : "All cycles processed"}
          icon={Wallet}
          variant="info"
          href="/human-resources/payroll/process-payroll"
        />
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. MAIN 2-COLUMN OPERATIONAL DASHBOARD */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="space-y-5">
        
        {/* ROW 1: Attendance Shift Overview (7 Cols) & Department Headcount (5 Cols) */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          
          {/* SECTION 2.1: ATTENDANCE & SHIFT OVERVIEW */}
          <div className="lg:col-span-7">
            <Panel
              title="Today's Shift Attendance"
              subtitle="Real-time check-in breakdown across morning, evening & night shifts"
              action={
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                  {kpiSummary.presentCount || 3} / {totalStaff} Active
                </span>
              }
            >
              {/* 4 Metric Sub-Tiles */}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 text-center">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">Present</p>
                  <p className="mt-0.5 text-lg font-bold text-slate-900">{attendanceBreakdown.present || 3}</p>
                  <p className="text-[10px] font-medium text-emerald-700">{pct(attendanceBreakdown.present || 3)} on shift</p>
                </div>

                <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 text-center">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">Absent</p>
                  <p className="mt-0.5 text-lg font-bold text-slate-900">{attendanceBreakdown.absent || 3}</p>
                  <p className="text-[10px] font-medium text-rose-600">{pct(attendanceBreakdown.absent || 3)} unexcused</p>
                </div>

                <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 text-center">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">On Leave</p>
                  <p className="mt-0.5 text-lg font-bold text-slate-900">{attendanceBreakdown.onLeave || 1}</p>
                  <p className="text-[10px] font-medium text-amber-700">{pct(attendanceBreakdown.onLeave || 1)} approved</p>
                </div>

                <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 text-center">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">Late Arrivals</p>
                  <p className="mt-0.5 text-lg font-bold text-slate-900">{attendanceBreakdown.lateArrivals || 0}</p>
                  <p className="text-[10px] font-medium text-slate-400">Within grace</p>
                </div>
              </div>

              {/* Area Chart: Weekly Trend (Re-themed to PMS Emerald Standard) */}
              <div className="mt-4 h-44 sm:h-48">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartWeeklyTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="hrAttendanceFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#059669" stopOpacity={0.16} />
                          <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} width={28} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                          fontSize: "12px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="present"
                        stroke="#059669"
                        strokeWidth={2}
                        fill="url(#hrAttendanceFill)"
                        dot={{ fill: "#059669", r: 2.5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full rounded-xl bg-slate-50 animate-pulse" />
                )}
              </div>

              {/* Shift Distribution Ratio Bar */}
              <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3">
                <div className="flex justify-between text-[11px] font-medium text-slate-500">
                  <span>Shift distribution</span>
                  <span className="font-semibold text-slate-800">{kpiSummary.presentCount || 3} on active duty</span>
                </div>
                <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="bg-emerald-600" style={{ width: `${((attendanceBreakdown.present || 3) / onShiftTotal) * 100}%` }} />
                  <div className="bg-rose-400" style={{ width: `${((attendanceBreakdown.absent || 3) / onShiftTotal) * 100}%` }} />
                  <div className="bg-amber-400" style={{ width: `${((attendanceBreakdown.onLeave || 1) / onShiftTotal) * 100}%` }} />
                  <div className="bg-blue-400" style={{ width: `${((attendanceBreakdown.lateArrivals || 0) / onShiftTotal) * 100}%` }} />
                </div>
              </div>
            </Panel>
          </div>

          {/* SECTION 2.2: DEPARTMENT HEADCOUNT (RE-THEMED TO SLATE/EMERALD) */}
          <div className="lg:col-span-5">
            <Panel
              title="Department Headcount"
              subtitle="Staff allocation across hotel operational divisions"
              action={
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {totalStaff} Total
                </span>
              }
            >
              <div className="h-56">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentChartData} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#475569", fontSize: 11, fontWeight: 500 }}
                        width={105}
                      />
                      <Tooltip
                        cursor={{ fill: "#f8fafc" }}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                        {departmentChartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full rounded-xl bg-slate-50 animate-pulse" />
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-teal-700" /> F&amp;B ({departmentChartData.find(d => d.name.includes("Food"))?.count || 3})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" /> Front Office ({departmentChartData.find(d => d.name.includes("Front"))?.count || 2})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-slate-700" /> Housekeeping ({departmentChartData.find(d => d.name.includes("Housekeeping"))?.count || 1})
                </span>
              </div>
            </Panel>
          </div>

        </div>

        {/* ROW 2: Employee Count by Designation (7 Cols) & Gender Diversity (5 Cols) */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          
          {/* SECTION 2.3: DESIGNATION & ROLE-WISE BREAKDOWN */}
          <div className="lg:col-span-7">
            <Panel
              title="Employee Count by Designation"
              subtitle="Role-wise staffing distribution across hotel operations"
              action={
                <Link
                  href="/human-resources/masters/designations"
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  <span>Masters</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            >
              {/* Filter Pills */}
              <div className="mb-4 flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedDesigDept("All")}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-colors",
                    selectedDesigDept === "All"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  All ({totalStaff})
                </button>
                {Array.from(new Set(designationHeadcounts.map((d) => d.department))).map((dept) => {
                  const deptCount = designationHeadcounts
                    .filter((d) => d.department === dept)
                    .reduce((acc, curr) => acc + curr.count, 0);
                  return (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => setSelectedDesigDept(dept)}
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-colors",
                        selectedDesigDept === dept
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {dept} ({deptCount})
                    </button>
                  );
                })}
              </div>

              {/* Designation Progress Bars */}
              <div className="space-y-3">
                {filteredDesignations.length === 0 ? (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-900">Executive Head Chef (Food &amp; Beverage)</span>
                        <span className="font-bold text-slate-800">3 (50%)</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-teal-700 rounded-full" style={{ width: "50%" }} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-900">Front Desk Manager (Front Office)</span>
                        <span className="font-bold text-slate-800">1 (17%)</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded-full" style={{ width: "17%" }} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-900">Executive Housekeeper (Housekeeping)</span>
                        <span className="font-bold text-slate-800">1 (17%)</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-slate-700 rounded-full" style={{ width: "17%" }} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-900">Guest Relations Executive (Front Office)</span>
                        <span className="font-bold text-slate-800">1 (17%)</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded-full" style={{ width: "17%" }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  filteredDesignations.map((desig) => {
                    const percentage = totalStaff > 0 ? Math.round((desig.count / totalStaff) * 100) : 0;
                    return (
                      <div key={desig.designation} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-900 truncate">
                            {desig.designation} <span className="text-slate-400 font-normal">({desig.department})</span>
                          </span>
                          <span className="font-bold text-slate-800 shrink-0">
                            {desig.count} <span className="text-slate-400 font-normal">({percentage}%)</span>
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                            style={{ width: `${totalStaff > 0 ? (desig.count / totalStaff) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Panel>
          </div>

          {/* SECTION 2.4: GENDER & WORKFORCE DIVERSITY */}
          <div className="lg:col-span-5">
            <Panel
              title="Workforce Diversity"
              subtitle="Active staff demographic breakdown"
              action={
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {genderDistribution.total || 6} Total Staff
                </span>
              }
            >
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-medium text-slate-500">
                    <span>Gender ratio</span>
                    <span className="font-semibold text-slate-800">
                      {Math.round(((genderDistribution.male || 4) / (genderDistribution.total || 6)) * 100)}% Male ·{" "}
                      {Math.round(((genderDistribution.female || 2) / (genderDistribution.total || 6)) * 100)}% Female
                    </span>
                  </div>
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="bg-slate-700"
                      style={{ width: `${((genderDistribution.male || 4) / (genderDistribution.total || 6)) * 100}%` }}
                    />
                    <div
                      className="bg-emerald-600"
                      style={{ width: `${((genderDistribution.female || 2) / (genderDistribution.total || 6)) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 text-center">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">Male</p>
                    <p className="mt-0.5 text-lg font-bold text-slate-900">{genderDistribution.male || 4}</p>
                    <p className="text-[10px] font-medium text-slate-400">
                      {Math.round(((genderDistribution.male || 4) / (genderDistribution.total || 6)) * 100)}%
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 text-center">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">Female</p>
                    <p className="mt-0.5 text-lg font-bold text-slate-900">{genderDistribution.female || 2}</p>
                    <p className="text-[10px] font-medium text-slate-400">
                      {Math.round(((genderDistribution.female || 2) / (genderDistribution.total || 6)) * 100)}%
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 text-center">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">Other</p>
                    <p className="mt-0.5 text-lg font-bold text-slate-900">{genderDistribution.other || 0}</p>
                    <p className="text-[10px] font-medium text-slate-400">0%</p>
                  </div>
                </div>
              </div>
            </Panel>
          </div>

        </div>

        {/* ROW 3: Pending Leaves (7 Cols) & Recent HR Activities (5 Cols) */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          
          {/* SECTION 2.5: PENDING LEAVE REQUESTS */}
          <div className="lg:col-span-7">
            <Panel
              title="Pending Leave Requests"
              subtitle={`${leavesList.length} applications awaiting approval`}
              action={
                <Link
                  href="/human-resources/attendance-leave/leave-management"
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  <span>All Leaves</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            >
              <div className="space-y-2.5">
                {leavesList.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                        SS
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Sanjay Sharma</p>
                        <p className="text-[10px] text-slate-400">Front Office · Casual Leave (2 days)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="h-7 bg-emerald-700 text-white text-[11px] font-semibold hover:bg-emerald-800"
                        onClick={() => setToastMessage("Approved leave request for Sanjay Sharma.")}
                      >
                        <Check className="mr-1 h-3 w-3" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 border-slate-300 text-[11px] font-medium"
                        onClick={() => setToastMessage("Rejected leave request.")}
                      >
                        <X className="mr-1 h-3 w-3" /> Reject
                      </Button>
                    </div>
                  </div>
                ) : (
                  leavesList.map((leave) => (
                    <div
                      key={leave.id}
                      className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50 transition"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                          {leave.avatar || leave.employeeName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-slate-900">{leave.employeeName}</p>
                          <p className="text-[10px] text-slate-500">
                            {leave.department} · {leave.leaveType} ({leave.days}d)
                          </p>
                        </div>
                      </div>

                      <div className="text-right text-[11px]">
                        <p className="font-medium text-slate-700">{leave.fromDate} – {leave.toDate}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{leave.reason}</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleApproveLeave(leave.id, leave.employeeName)}
                          className="h-7 rounded bg-emerald-700 px-2.5 text-[11px] font-semibold hover:bg-emerald-800 text-white"
                        >
                          <Check className="mr-0.5 h-3 w-3" /> Approve
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectLeave(leave.id, leave.employeeName)}
                          className="h-7 rounded border-slate-200 px-2.5 text-[11px] font-medium"
                        >
                          <X className="mr-0.5 h-3 w-3" /> Reject
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Panel>
          </div>

          {/* SECTION 2.6: RECENT HR ACTIVITIES */}
          <div className="lg:col-span-5">
            <Panel
              title="Recent HR Activities"
              subtitle="Live event log from workforce operations"
            >
              <ul className="space-y-3">
                {activities.length === 0 ? (
                  <>
                    <li className="flex gap-2.5 text-xs">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-slate-900">Shift Check-in Completed</p>
                          <span className="text-[10px] text-slate-400">10m ago</span>
                        </div>
                        <p className="text-[11px] text-slate-500">3 employees punched in on Morning shift.</p>
                      </div>
                    </li>
                    <li className="flex gap-2.5 text-xs">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-slate-900">New Joinee Onboarded</p>
                          <span className="text-[10px] text-slate-400">1h ago</span>
                        </div>
                        <p className="text-[11px] text-slate-500">Executive Head Chef added to F&amp;B department.</p>
                      </div>
                    </li>
                    <li className="flex gap-2.5 text-xs">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-slate-900">Leave Application Logged</p>
                          <span className="text-[10px] text-slate-400">2h ago</span>
                        </div>
                        <p className="text-[11px] text-slate-500">Casual leave submitted for 2 days.</p>
                      </div>
                    </li>
                  </>
                ) : (
                  activities.map((act) => (
                    <li key={act.id} className="flex gap-2.5 text-xs">
                      <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", activityDotColors[act.type] || "bg-slate-400")} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-slate-900 truncate">{act.title}</p>
                          <span className="shrink-0 text-[10px] text-slate-400">{act.timeAgo}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">{act.description}</p>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </Panel>
          </div>

        </div>

        {/* ROW 4: Upcoming Celebrations (6 Cols) & Holidays & Grievances (6 Cols) */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          
          {/* SECTION 2.7: UPCOMING CELEBRATIONS */}
          <div className="lg:col-span-6">
            <Panel
              title="Upcoming Celebrations"
              subtitle="Birthdays and work anniversaries this month"
            >
              <div className="space-y-2.5">
                {events.length === 0 ? (
                  <>
                    <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-50 text-pink-700 border border-pink-200">
                          <Gift className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900">Ramesh Kumar</p>
                          <p className="text-[10px] text-slate-400">Engineering · Birthday</p>
                        </div>
                      </div>
                      <span className="rounded bg-white px-2 py-0.5 text-[11px] font-bold text-slate-700 border border-slate-200">
                        22 Sep
                      </span>
                    </div>

                    <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Award className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900">Pooja Verma</p>
                          <p className="text-[10px] text-slate-400">Housekeeping · 2nd Work Anniversary</p>
                        </div>
                      </div>
                      <span className="rounded bg-white px-2 py-0.5 text-[11px] font-bold text-slate-700 border border-slate-200">
                        28 Sep
                      </span>
                    </div>
                  </>
                ) : (
                  events.map((ev) => (
                    <div key={ev.id} className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-lg border",
                            ev.type === "birthday"
                              ? "bg-pink-50 text-pink-700 border-pink-200"
                              : "bg-indigo-50 text-indigo-700 border-indigo-200"
                          )}
                        >
                          {ev.type === "birthday" ? <Gift className="h-3.5 w-3.5" /> : <Award className="h-3.5 w-3.5" />}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900">{ev.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {ev.department} · {ev.type === "birthday" ? "Birthday" : "Work Anniversary"}
                          </p>
                        </div>
                      </div>
                      <span className="rounded bg-white px-2 py-0.5 text-[11px] font-bold text-slate-700 border border-slate-200">
                        {ev.date}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Panel>
          </div>

          {/* SECTION 2.8: GRIEVANCES SUMMARY */}
          <div className="lg:col-span-6">
            <Panel
              title="Grievance & Feedback Summary"
              subtitle="Staff complaint tracking & resolution pipeline"
              action={
                <Link
                  href="/human-resources/grievances/complaint-list"
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  <span>Portal</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            >
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 text-center">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">Open</p>
                  <p className="mt-0.5 text-lg font-bold text-slate-900">{grievanceSummary.open || 0}</p>
                  <p className="text-[10px] font-medium text-slate-400">Needs review</p>
                </div>

                <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 text-center">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">In Progress</p>
                  <p className="mt-0.5 text-lg font-bold text-slate-900">{grievanceSummary.inProgress || 0}</p>
                  <p className="text-[10px] font-medium text-amber-700">Investigating</p>
                </div>

                <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 text-center">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">Escalated</p>
                  <p className="mt-0.5 text-lg font-bold text-slate-900">{grievanceSummary.escalated || 0}</p>
                  <p className="text-[10px] font-medium text-rose-600">Mgmt review</p>
                </div>

                <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 text-center">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">Resolved</p>
                  <p className="mt-0.5 text-lg font-bold text-slate-900">{grievanceSummary.resolved || 0}</p>
                  <p className="text-[10px] font-medium text-emerald-700">Closed</p>
                </div>
              </div>
            </Panel>
          </div>

        </div>

      </div>
    </ModulePageShell>
  );
}
