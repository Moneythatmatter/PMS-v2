"use client";

import React, { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
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
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { ModulePageShell } from "@/components/pms";
import type { SummaryStat } from "@/app/data/types";
import {
  sampleHRKpiSummary,
  sampleAttendanceBreakdown,
  sampleDepartmentHeadcounts,
  samplePendingLeaves,
  sampleHRActivities,
  sampleEvents,
  sampleHolidaysAndShifts,
  sampleGrievances,
  sampleDesignationHeadcounts,
  sampleGenderDistribution,
  sampleWeeklyAttendanceTrend,
  departmentChartColors,
  PendingLeaveItem,
} from "@/app/data/hr/hrDashboardData";
import { cn } from "@/lib/utils";

function PanelCard({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("flex h-full flex-col", className)}>
      <CardHeader title={title} subtitle={subtitle} action={action} />
      {children}
    </Card>
  );
}

function MetricTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: number | string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 text-center">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-0.5 text-[10px] text-slate-400">{detail}</p>
    </div>
  );
}

function ListRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-slate-100 bg-white px-3 py-2.5", className)}>
      {children}
    </div>
  );
}

const activityDotColors: Record<string, string> = {
  join: "bg-sky-500",
  leave: "bg-emerald-500",
  attendance: "bg-amber-500",
  payroll: "bg-violet-500",
  grievance: "bg-rose-500",
};

export function HRDashboardView() {
  const router = useRouter();
  const [leavesList, setLeavesList] = useState<PendingLeaveItem[]>(samplePendingLeaves);
  const [selectedDesigDept, setSelectedDesigDept] = useState<string>("All");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleApproveLeave = (id: string, name: string) => {
    setLeavesList((prev) => prev.filter((item) => item.id !== id));
    setToastMessage(`Approved leave request for ${name}.`);
  };

  const handleRejectLeave = (id: string, name: string) => {
    setLeavesList((prev) => prev.filter((item) => item.id !== id));
    setToastMessage(`Rejected leave request for ${name}.`);
  };

  const kpiStats: SummaryStat[] = useMemo(
    () => [
      {
        title: "Total Employees",
        value: String(sampleHRKpiSummary.totalEmployees),
        change: `+${sampleHRKpiSummary.newJoineesThisMonth} this month`,
        trend: "up",
      },
      {
        title: "Pending Leave",
        value: String(sampleHRKpiSummary.pendingLeaveRequestsCount),
        change: "Awaiting approval",
        trend: "down",
      },
      {
        title: "Open Grievances",
        value: String(sampleGrievances.open),
        change: `${sampleGrievances.escalated} escalated`,
        trend: "down",
      },
      {
        title: "Payroll Processed",
        value: String(sampleHRKpiSummary.payrollProcessedCount),
        change: `${sampleHRKpiSummary.payrollPendingCount} pending`,
        trend: "up",
      },
    ],
    [],
  );

  const departmentChartData = useMemo(
    () =>
      sampleDepartmentHeadcounts.map((dept) => ({
        name: dept.department,
        count: dept.count,
        fill: departmentChartColors[dept.department] ?? "#64748b",
      })),
    [],
  );

  const filteredDesignations = useMemo(
    () =>
      sampleDesignationHeadcounts.filter(
        (desig) => selectedDesigDept === "All" || desig.department === selectedDesigDept,
      ),
    [selectedDesigDept],
  );

  const totalStaff = sampleHRKpiSummary.totalEmployees;

  return (
    <ModulePageShell
      eyebrow="Human Resource Module"
      title="Human Resource Dashboard"
      breadcrumbs={[{ label: "Human Resource", href: "/human-resources/dashboard" }, { label: "Dashboard" }]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      wrapChildren={false}
      primaryAction={{
        label: "Add Employee",
        onClick: () => router.push("/human-resources/employees/add"),
      }}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <a href="/human-resources/attendance-leave/attendance">
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-sm"
            >
              <Clock className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
              Mark Attendance
            </Button>
          </a>
          <a href="/human-resources/attendance-leave/leave-management">
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-sm"
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
              Approve Leaves
            </Button>
          </a>
        </div>
      }
    >
      <div className="min-w-0 space-y-4 sm:space-y-6 lg:space-y-8">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          {kpiStats.map((stat) => (
            <StatCard key={stat.title} stat={stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="min-w-0 lg:col-span-7">
            <PanelCard
              title="Attendance overview"
              subtitle="Today's shift headcount across operational departments"
              action={
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                  {sampleAttendanceBreakdown.present} / {totalStaff} active
                </span>
              }
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MetricTile label="Present" value={sampleAttendanceBreakdown.present} detail="81.2% on shift" />
                <MetricTile label="Absent" value={sampleAttendanceBreakdown.absent} detail="9.3% unexcused" />
                <MetricTile label="On leave" value={sampleAttendanceBreakdown.onLeave} detail="6.2% approved" />
                <MetricTile label="Late arrivals" value={sampleAttendanceBreakdown.lateArrivals} detail="Within grace" />
              </div>

              <div className="mt-4 h-44 sm:h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sampleWeeklyAttendanceTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="hrAttendanceFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#16a34a" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} width={28} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="present"
                      stroke="#16a34a"
                      strokeWidth={2}
                      fill="url(#hrAttendanceFill)"
                      dot={{ fill: "#16a34a", r: 2.5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-[11px] font-medium text-slate-500">
                  <span>Shift distribution</span>
                  <span>{sampleAttendanceBreakdown.present} on duty</span>
                </div>
                <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="bg-emerald-500" style={{ width: "81.2%" }} />
                  <div className="bg-rose-400" style={{ width: "9.3%" }} />
                  <div className="bg-amber-400" style={{ width: "6.2%" }} />
                  <div className="bg-sky-400" style={{ width: "3.3%" }} />
                </div>
              </div>
            </PanelCard>
          </div>

          <div className="min-w-0 lg:col-span-5">
            <PanelCard title="Department headcount" subtitle="Staff allocation by department">
              <div className="h-52 sm:h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentChartData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      width={92}
                    />
                    <Tooltip
                      cursor={{ fill: "#f8fafc" }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
                      {departmentChartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </PanelCard>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="min-w-0 lg:col-span-7">
            <PanelCard
              title="Employee count by designation"
              subtitle="Role-wise staffing across hotel operations"
              action={
                <a
                  href="/human-resources/masters/designations"
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  View all
                  <ArrowRight className="h-3 w-3" />
                </a>
              }
            >
              <div className="mb-4 flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedDesigDept("All")}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                    selectedDesigDept === "All"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                  )}
                >
                  All ({totalStaff})
                </button>
                {Array.from(new Set(sampleDesignationHeadcounts.map((d) => d.department))).map((dept) => {
                  const deptCount = sampleDesignationHeadcounts
                    .filter((d) => d.department === dept)
                    .reduce((acc, curr) => acc + curr.count, 0);
                  return (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => setSelectedDesigDept(dept)}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                        selectedDesigDept === dept
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                      )}
                    >
                      {dept} ({deptCount})
                    </button>
                  );
                })}
              </div>

              <div className="space-y-3">
                {filteredDesignations.map((desig) => {
                  const percentage = Math.round((desig.count / totalStaff) * 100);
                  return (
                    <div key={desig.designation} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-800">{desig.designation}</p>
                          <p className="text-[10px] text-slate-400">{desig.department}</p>
                        </div>
                        <span className="shrink-0 font-semibold text-slate-900">
                          {desig.count}
                          <span className="ml-1 font-normal text-slate-400">({percentage}%)</span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={cn("h-full rounded-full transition-all duration-300", desig.color)}
                          style={{ width: `${(desig.count / 24) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </PanelCard>
          </div>

          <div className="min-w-0 lg:col-span-5">
            <PanelCard
              title="Gender distribution"
              subtitle="Active workforce diversity breakdown"
              action={
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  {sampleGenderDistribution.total} total
                </span>
              }
            >
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-medium text-slate-500">
                    <span>Gender ratio</span>
                    <span>
                      {Math.round((sampleGenderDistribution.male / sampleGenderDistribution.total) * 100)}% male ·{" "}
                      {Math.round((sampleGenderDistribution.female / sampleGenderDistribution.total) * 100)}% female
                    </span>
                  </div>
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="bg-slate-700"
                      style={{ width: `${(sampleGenderDistribution.male / sampleGenderDistribution.total) * 100}%` }}
                    />
                    <div
                      className="bg-slate-400"
                      style={{ width: `${(sampleGenderDistribution.female / sampleGenderDistribution.total) * 100}%` }}
                    />
                    <div
                      className="bg-slate-300"
                      style={{ width: `${(sampleGenderDistribution.other / sampleGenderDistribution.total) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <MetricTile
                    label="Male"
                    value={sampleGenderDistribution.male}
                    detail={`${Math.round((sampleGenderDistribution.male / sampleGenderDistribution.total) * 100)}%`}
                  />
                  <MetricTile
                    label="Female"
                    value={sampleGenderDistribution.female}
                    detail={`${Math.round((sampleGenderDistribution.female / sampleGenderDistribution.total) * 100)}%`}
                  />
                  <MetricTile
                    label="Other"
                    value={sampleGenderDistribution.other}
                    detail={`${Math.round((sampleGenderDistribution.other / sampleGenderDistribution.total) * 100)}%`}
                  />
                </div>
              </div>
            </PanelCard>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="min-w-0 lg:col-span-7">
            <PanelCard
              title="Pending leave requests"
              subtitle={`${leavesList.length} awaiting approval`}
              action={
                <a
                  href="/human-resources/attendance-leave/leave-management"
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  View all
                  <ArrowRight className="h-3 w-3" />
                </a>
              }
            >
              <div className="space-y-2.5">
                {leavesList.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-400">No pending leave requests.</p>
                ) : (
                  leavesList.map((leave) => (
                    <ListRow key={leave.id} className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-700">
                          {leave.avatar}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{leave.employeeName}</p>
                          <p className="text-xs text-slate-500">
                            {leave.department} · {leave.leaveType}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-medium text-slate-700">
                          {leave.fromDate} – {leave.toDate} ({leave.days}d)
                        </p>
                        <p className="text-[11px] text-slate-400">{leave.reason}</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleApproveLeave(leave.id, leave.employeeName)}
                          className="h-7 rounded-lg bg-emerald-700 px-2.5 text-[11px] font-semibold hover:bg-emerald-800"
                        >
                          <Check className="mr-0.5 h-3 w-3" /> Approve
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectLeave(leave.id, leave.employeeName)}
                          className="h-7 rounded-lg border-slate-200 px-2.5 text-[11px] font-medium"
                        >
                          <X className="mr-0.5 h-3 w-3" /> Reject
                        </Button>
                      </div>
                    </ListRow>
                  ))
                )}
              </div>
            </PanelCard>
          </div>

          <div className="min-w-0 lg:col-span-5">
            <PanelCard title="Recent HR activities" subtitle="Live updates from HR operations">
              <ul className="space-y-4">
                {sampleHRActivities.map((act) => (
                  <li key={act.id} className="flex gap-3">
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", activityDotColors[act.type])} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-900">{act.title}</p>
                        <span className="shrink-0 text-[11px] text-slate-400">{act.timeAgo}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{act.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </PanelCard>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 lg:gap-8">
          <PanelCard title="Birthdays & work anniversaries" subtitle="Upcoming celebrations">
            <div className="space-y-2.5">
              {sampleEvents.map((ev) => (
                <ListRow key={ev.id} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-700">
                      {ev.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{ev.name}</p>
                      <p className="text-xs text-slate-500">
                        {ev.department}
                        {ev.years ? ` · ${ev.years} years` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-md bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600">
                    {ev.date}
                  </span>
                </ListRow>
              ))}
            </div>
          </PanelCard>

          <PanelCard title="Holidays & shift exceptions" subtitle="Upcoming schedule changes">
            <div className="space-y-2.5">
              {sampleHolidaysAndShifts.map((hs) => (
                <ListRow key={hs.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{hs.title}</p>
                    <p className="text-xs text-slate-500">{hs.date}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-wide",
                      hs.type === "holiday"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-violet-50 text-violet-700",
                    )}
                  >
                    {hs.badgeText}
                  </span>
                </ListRow>
              ))}
            </div>
          </PanelCard>
        </div>

        <PanelCard
          title="Grievance summary"
          subtitle="Complaint status overview"
          action={
            <a
              href="/human-resources/grievances/complaint-list"
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Grievance portal
              <ArrowRight className="h-3 w-3" />
            </a>
          }
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricTile label="Open" value={sampleGrievances.open} detail="Needs HR review" />
            <MetricTile label="In progress" value={sampleGrievances.inProgress} detail="Under investigation" />
            <MetricTile label="Escalated" value={sampleGrievances.escalated} detail="Management review" />
            <MetricTile label="Resolved" value={sampleGrievances.resolved} detail="Closed this year" />
          </div>
        </PanelCard>
      </div>
    </ModulePageShell>
  );
}
