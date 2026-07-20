export interface HousekeepingReportTemplate {
  id: string;
  code: string;
  name: string;
  category:
    | "Operational Reports"
    | "Housekeeping Performance"
    | "Inspection Reports"
    | "Laundry Reports"
    | "Lost & Found Reports"
    | "Damage Reports"
    | "Deep Cleaning Reports"
    | "Maintenance Reports"
    | "Inventory Reports"
    | "Audit Reports"
    | "Executive Dashboard";
  description: string;
  lastGenerated: string;
  generatedBy: string;
  isPinned: boolean;
  defaultFormat: "PDF" | "Excel" | "CSV";
  frequency: string;
}

export interface RecentReportEntry {
  id: string;
  reportName: string;
  category: string;
  generatedBy: string;
  generatedTime: string;
  format: "PDF" | "Excel" | "CSV";
  fileSize: string;
  status: "Completed" | "Processing" | "Failed";
}

export interface ScheduledReportEntry {
  id: string;
  reportName: string;
  frequency: "Daily" | "Weekly" | "Monthly";
  recipients: string[];
  nextRun: string;
  status: "Active" | "Paused";
}

export const REPORT_CATEGORIES_LIST = [
  "Operational Reports",
  "Housekeeping Performance",
  "Inspection Reports",
  "Laundry Reports",
  "Lost & Found Reports",
  "Damage Reports",
  "Deep Cleaning Reports",
  "Maintenance Reports",
  "Inventory Reports",
  "Audit Reports",
  "Executive Dashboard",
] as const;

export const INITIAL_REPORT_TEMPLATES: HousekeepingReportTemplate[] = [
  {
    id: "RPT-101",
    code: "OPS-CL-01",
    name: "Daily Room Turnaround & Cleaning Summary",
    category: "Operational Reports",
    description: "Detailed breakdown of checkout cleanings, stayovers, turnaround SLAs, and dirty room queue aging.",
    lastGenerated: "Today at 08:30 AM",
    generatedBy: "Ramesh Kumar",
    isPinned: true,
    defaultFormat: "PDF",
    frequency: "Daily at 08:00 AM",
  },
  {
    id: "RPT-102",
    code: "PER-HK-02",
    name: "Housekeeper Productivity & Credit Summary",
    category: "Housekeeping Performance",
    description: "Individual credit capacities, average cleaning mins per room category, and completion rates.",
    lastGenerated: "Yesterday at 05:00 PM",
    generatedBy: "Admin User",
    isPinned: true,
    defaultFormat: "Excel",
    frequency: "Weekly (Mondays)",
  },
  {
    id: "RPT-103",
    code: "INS-PASS-03",
    name: "Quality Audit Pass % & Fail Variance",
    category: "Inspection Reports",
    description: "Supervisor QC pass rates, failed SOP checklist items, re-inspection SLAs, and auditor ratings.",
    lastGenerated: "Today at 10:15 AM",
    generatedBy: "Priya Sharma",
    isPinned: true,
    defaultFormat: "PDF",
    frequency: "Daily at 06:00 PM",
  },
  {
    id: "RPT-104",
    code: "LND-VOL-04",
    name: "Linen Wash Volume & Turnaround Times",
    category: "Laundry Reports",
    description: "Linen throughput (Kg), wash-cycle aging, express vs standard turnaround, and off-site vendor SLAs.",
    lastGenerated: "2026-07-18 at 04:00 PM",
    generatedBy: "Anil Verma",
    isPinned: false,
    defaultFormat: "Excel",
    frequency: "Weekly",
  },
  {
    id: "RPT-105",
    code: "LF-VAULT-05",
    name: "Lost & Found Custody & Claim Audit",
    category: "Lost & Found Reports",
    description: "Vault item registrations, high-value asset tracking, guest claim rates, and disposal logs.",
    lastGenerated: "2026-07-19 at 02:30 PM",
    generatedBy: "Ramesh Kumar",
    isPinned: false,
    defaultFormat: "PDF",
    frequency: "Monthly",
  },
  {
    id: "RPT-106",
    code: "DMG-REC-06",
    name: "Guest Damage Financial Recovery & Tariffs",
    category: "Damage Reports",
    description: "Asset damage incident breakdown, guest folio billing recovery, waiver approvals, and cost center charges.",
    lastGenerated: "Today at 09:00 AM",
    generatedBy: "Admin User",
    isPinned: true,
    defaultFormat: "Excel",
    frequency: "Monthly",
  },
  {
    id: "RPT-107",
    code: "DPC-SCH-07",
    name: "Deep Cleaning Cycle & Preventive SLA Compliance",
    category: "Deep Cleaning Reports",
    description: "Periodic deep clean schedules, room blocking compliance, chemical consumption, and before/after photos.",
    lastGenerated: "2026-07-15 at 11:00 AM",
    generatedBy: "Meena Kumari",
    isPinned: false,
    defaultFormat: "PDF",
    frequency: "Bi-Weekly",
  },
  {
    id: "RPT-108",
    code: "MNT-ENG-08",
    name: "Housekeeping Work Orders & Engineering SLAs",
    category: "Maintenance Reports",
    description: "Cross-departmental engineering tickets, OOO/OOS room blocks, resolution SLAs, and vendor work orders.",
    lastGenerated: "Today at 07:45 AM",
    generatedBy: "Sanjay Patel",
    isPinned: false,
    defaultFormat: "PDF",
    frequency: "Daily",
  },
  {
    id: "RPT-109",
    code: "INV-STK-09",
    name: "Inventory Valuation & Par Level Consumption",
    category: "Inventory Reports",
    description: "Amenity usage per occupied room, chemical dilution logs, linen ragging threshold, and store requisitions.",
    lastGenerated: "2026-07-19 at 06:00 PM",
    generatedBy: "Admin User",
    isPinned: false,
    defaultFormat: "CSV",
    frequency: "Monthly",
  },
  {
    id: "RPT-110",
    code: "AUD-SEC-10",
    name: "System Governance & Security Audit Trail",
    category: "Audit Reports",
    description: "Supervisor status overrides, permission changes, login events, and digital audit signatures.",
    lastGenerated: "Today at 10:45 AM",
    generatedBy: "Admin User",
    isPinned: false,
    defaultFormat: "CSV",
    frequency: "Weekly",
  },
  {
    id: "RPT-111",
    code: "EXEC-SUM-11",
    name: "Executive Management Housekeeping Summary",
    category: "Executive Dashboard",
    description: "High-level KPI scorecard combining cleaning speed, inspection scores, laundry cost, and guest satisfaction.",
    lastGenerated: "Today at 06:00 AM",
    generatedBy: "Admin User",
    isPinned: true,
    defaultFormat: "PDF",
    frequency: "Daily at 06:00 AM",
  },
];

export const INITIAL_RECENT_REPORTS: RecentReportEntry[] = [
  {
    id: "REC-RPT-01",
    reportName: "Daily Room Turnaround & Cleaning Summary",
    category: "Operational Reports",
    generatedBy: "Ramesh Kumar",
    generatedTime: "Today at 08:30 AM",
    format: "PDF",
    fileSize: "2.4 MB",
    status: "Completed",
  },
  {
    id: "REC-RPT-02",
    reportName: "Quality Audit Pass % & Fail Variance",
    category: "Inspection Reports",
    generatedBy: "Priya Sharma",
    generatedTime: "Today at 10:15 AM",
    format: "PDF",
    fileSize: "1.8 MB",
    status: "Completed",
  },
  {
    id: "REC-RPT-03",
    reportName: "Guest Damage Financial Recovery & Tariffs",
    category: "Damage Reports",
    generatedBy: "Admin User",
    generatedTime: "Today at 09:00 AM",
    format: "Excel",
    fileSize: "4.1 MB",
    status: "Completed",
  },
  {
    id: "REC-RPT-04",
    reportName: "System Governance & Security Audit Trail",
    category: "Audit Reports",
    generatedBy: "Admin User",
    generatedTime: "Today at 10:45 AM",
    format: "CSV",
    fileSize: "850 KB",
    status: "Completed",
  },
];

export const INITIAL_SCHEDULED_REPORTS: ScheduledReportEntry[] = [
  {
    id: "SCH-01",
    reportName: "Daily Room Turnaround & Cleaning Summary",
    frequency: "Daily",
    recipients: ["ex.housekeeper@grandhotel.com", "gm@grandhotel.com"],
    nextRun: "Tomorrow at 08:00 AM",
    status: "Active",
  },
  {
    id: "SCH-02",
    reportName: "Executive Management Housekeeping Summary",
    frequency: "Daily",
    recipients: ["management@grandhotel.com", "finance@grandhotel.com"],
    nextRun: "Tomorrow at 06:00 AM",
    status: "Active",
  },
  {
    id: "SCH-03",
    reportName: "Housekeeper Productivity & Credit Summary",
    frequency: "Weekly",
    recipients: ["hr@grandhotel.com", "ex.housekeeper@grandhotel.com"],
    nextRun: "Next Monday at 09:00 AM",
    status: "Active",
  },
  {
    id: "SCH-04",
    reportName: "Inventory Valuation & Par Level Consumption",
    frequency: "Monthly",
    recipients: ["purchase@grandhotel.com", "stores@grandhotel.com"],
    nextRun: "2026-08-01 at 09:00 AM",
    status: "Active",
  },
];
