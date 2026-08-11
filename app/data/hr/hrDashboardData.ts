export interface HRKpiSummary {
  totalEmployees: number;
  newJoineesThisMonth: number;
  presentCount: number;
  totalShiftStaff: number;
  attendanceRate: number;
  onLeaveCount: number;
  pendingLeaveRequestsCount: number;
  payrollProcessedCount: number;
  payrollPendingCount: number;
  payCycleDate: string;
}

export interface AttendanceBreakdown {
  present: number;
  absent: number;
  onLeave: number;
  lateArrivals: number;
}

export interface DepartmentHeadcount {
  department: string;
  count: number;
  color: string;
}

export interface PendingLeaveItem {
  id: string;
  employeeName: string;
  avatar: string;
  department: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
}

export interface HRActivityItem {
  id: string;
  type: "join" | "leave" | "attendance" | "payroll" | "grievance";
  title: string;
  description: string;
  timeAgo: string;
}

export interface EmployeeEventItem {
  id: string;
  name: string;
  avatar: string;
  department: string;
  type: "birthday" | "anniversary";
  date: string;
  years?: number;
}

export interface HolidayShiftItem {
  id: string;
  title: string;
  date: string;
  type: "holiday" | "shift_exception";
  badgeText: string;
}

export interface GrievanceSummary {
  open: number;
  inProgress: number;
  escalated: number;
  resolved: number;
}

export const sampleHRKpiSummary: HRKpiSummary = {
  totalEmployees: 128,
  newJoineesThisMonth: 6,
  presentCount: 104,
  totalShiftStaff: 128,
  attendanceRate: 92,
  onLeaveCount: 8,
  pendingLeaveRequestsCount: 6,
  payrollProcessedCount: 120,
  payrollPendingCount: 8,
  payCycleDate: "24 Aug 2026",
};

export const sampleAttendanceBreakdown: AttendanceBreakdown = {
  present: 104,
  absent: 12,
  onLeave: 8,
  lateArrivals: 4,
};

export const sampleDepartmentHeadcounts: DepartmentHeadcount[] = [
  { department: "Housekeeping", count: 34, color: "bg-emerald-500" },
  { department: "F&B Service", count: 27, color: "bg-blue-500" },
  { department: "Kitchen / Culinary", count: 22, color: "bg-amber-500" },
  { department: "Front Office", count: 18, color: "bg-purple-500" },
  { department: "Maintenance & Eng.", count: 11, color: "bg-rose-500" },
  { department: "HR & Admin", count: 6, color: "bg-indigo-500" },
];

export const samplePendingLeaves: PendingLeaveItem[] = [
  {
    id: "l-101",
    employeeName: "Ramesh Sharma",
    avatar: "RS",
    department: "Front Office",
    leaveType: "Casual Leave",
    fromDate: "10 Aug",
    toDate: "12 Aug",
    days: 3,
    reason: "Family Event",
  },
  {
    id: "l-102",
    employeeName: "Priya Nair",
    avatar: "PN",
    department: "Housekeeping",
    leaveType: "Sick Leave",
    fromDate: "08 Aug",
    toDate: "09 Aug",
    days: 2,
    reason: "Doctor Appointment",
  },
  {
    id: "l-103",
    employeeName: "Chef Anil Varma",
    avatar: "AV",
    department: "Kitchen",
    leaveType: "Privilege Leave",
    fromDate: "15 Aug",
    toDate: "18 Aug",
    days: 4,
    reason: "Annual Trip",
  },
];

export const sampleHRActivities: HRActivityItem[] = [
  {
    id: "act-1",
    type: "join",
    title: "New Employee Joined",
    description: "Suresh Menon joined as Front Desk Executive",
    timeAgo: "25 mins ago",
  },
  {
    id: "act-2",
    type: "leave",
    title: "Leave Request Approved",
    description: "Approved 2 days Earned Leave for Vikram Singh (HK)",
    timeAgo: "1 hour ago",
  },
  {
    id: "act-3",
    type: "attendance",
    title: "Attendance Regularized",
    description: "Late check-in regularized for Sunita Patel (F&B)",
    timeAgo: "3 hours ago",
  },
  {
    id: "act-4",
    type: "payroll",
    title: "July Payroll Processed",
    description: "Salary slips generated for 120 Staff members",
    timeAgo: "Yesterday",
  },
  {
    id: "act-5",
    type: "grievance",
    title: "Complaint Resolved",
    description: "Resolved shift timing complaint #GR-402",
    timeAgo: " Yesterday",
  },
];

export const sampleEvents: EmployeeEventItem[] = [
  {
    id: "ev-1",
    name: "Anjali Gupta",
    avatar: "AG",
    department: "Front Office",
    type: "birthday",
    date: "Today (06 Aug)",
  },
  {
    id: "ev-2",
    name: "Chef Rajesh Kumar",
    avatar: "RK",
    department: "Kitchen",
    type: "anniversary",
    date: "08 Aug",
    years: 5,
  },
  {
    id: "ev-3",
    name: "Sunil Verma",
    avatar: "SV",
    department: "Housekeeping",
    type: "birthday",
    date: "11 Aug",
  },
];

export const sampleHolidaysAndShifts: HolidayShiftItem[] = [
  {
    id: "hs-1",
    title: "Independence Day",
    date: "15 Aug 2026",
    type: "holiday",
    badgeText: "National Holiday",
  },
  {
    id: "hs-2",
    title: "Night Shift Rotation Swap",
    date: "12 Aug 2026",
    type: "shift_exception",
    badgeText: "Night Shift",
  },
  {
    id: "hs-3",
    title: "Janmashtami",
    date: "28 Aug 2026",
    type: "holiday",
    badgeText: "Restricted Holiday",
  },
];

export const sampleGrievances: GrievanceSummary = {
  open: 3,
  inProgress: 4,
  escalated: 1,
  resolved: 19,
};
