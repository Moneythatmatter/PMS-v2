export interface FiscalYearAuditItem {
  id: string;
  action: "Created" | "Opened" | "Set Current" | "Closed" | "Reopened";
  user: string;
  date: string;
  time: string;
  reason?: string;
}

export interface FiscalYearModel {
  fiscalYearId: string;
  companyId: string;
  companyName: string;
  fiscalYearName: string;
  startDate: string;
  endDate: string;
  status: "Upcoming" | "Open" | "Closed";
  isCurrent: boolean;

  // Opening Balance & Carry Forward Configurations
  carryForwardBalanceSheet: boolean;
  carryForwardCustomers: boolean;
  carryForwardVendors: boolean;
  transferPnLToRetainedEarnings: boolean;
  retainedEarningsAccountId: string;

  // Year-End Pre-close Financial Metrics & Validation
  totalRevenue: number;
  totalExpenses: number;
  netProfitLoss: number;
  receivableOutstanding: number;
  payableOutstanding: number;
  unpostedVouchersCount: number;
  isTrialBalanceBalanced: boolean;

  createdAt: string;
  createdBy: string;
  openedAt?: string;
  openedBy?: string;
  closedAt?: string;
  closedBy?: string;
  reopenedAt?: string;
  reopenedBy?: string;
  reopenReason?: string;

  auditLogs: FiscalYearAuditItem[];
}

export const sampleRetainedEarningsAccounts = [
  { id: "3100", name: "3100 - Retained Earnings & Reserves A/c" },
  { id: "3150", name: "3150 - General Reserve A/c" },
  { id: "3200", name: "3200 - Profit & Loss Surplus A/c" },
];

export const sampleFiscalYearsList: FiscalYearModel[] = [
  {
    fiscalYearId: "FY-2027-28",
    companyId: "CMP-001",
    companyName: "HOTEL & RESORTS PRIVATE LIMITED",
    fiscalYearName: "FY 2027-28",
    startDate: "01/04/2027",
    endDate: "31/03/2028",
    status: "Upcoming",
    isCurrent: false,

    carryForwardBalanceSheet: true,
    carryForwardCustomers: true,
    carryForwardVendors: true,
    transferPnLToRetainedEarnings: true,
    retainedEarningsAccountId: "3100 - Retained Earnings & Reserves A/c",

    totalRevenue: 0,
    totalExpenses: 0,
    netProfitLoss: 0,
    receivableOutstanding: 0,
    payableOutstanding: 0,
    unpostedVouchersCount: 0,
    isTrialBalanceBalanced: true,

    createdAt: "01/08/2026",
    createdBy: "Accounts Admin (Jay)",

    auditLogs: [
      {
        id: "log-1",
        action: "Created",
        user: "Accounts Admin (Jay)",
        date: "01/08/2026",
        time: "11:30 AM",
        reason: "Initial period initialization for upcoming fiscal cycle.",
      },
    ],
  },
  {
    fiscalYearId: "FY-2026-27",
    companyId: "CMP-001",
    companyName: "HOTEL & RESORTS PRIVATE LIMITED",
    fiscalYearName: "FY 2026-27",
    startDate: "01/04/2026",
    endDate: "31/03/2027",
    status: "Open",
    isCurrent: true,

    carryForwardBalanceSheet: true,
    carryForwardCustomers: true,
    carryForwardVendors: true,
    transferPnLToRetainedEarnings: true,
    retainedEarningsAccountId: "3100 - Retained Earnings & Reserves A/c",

    totalRevenue: 58240000,
    totalExpenses: 42415000,
    netProfitLoss: 15825000,
    receivableOutstanding: 4280000,
    payableOutstanding: 2850000,
    unpostedVouchersCount: 0,
    isTrialBalanceBalanced: true,

    createdAt: "01/03/2026",
    createdBy: "Abhijit Suthar",
    openedAt: "01/04/2026",
    openedBy: "Abhijit Suthar",

    auditLogs: [
      {
        id: "log-1",
        action: "Created",
        user: "Abhijit Suthar",
        date: "01/03/2026",
        time: "10:00 AM",
      },
      {
        id: "log-2",
        action: "Opened",
        user: "Abhijit Suthar",
        date: "01/04/2026",
        time: "08:00 AM",
      },
      {
        id: "log-3",
        action: "Set Current",
        user: "Abhijit Suthar",
        date: "01/04/2026",
        time: "08:05 AM",
      },
    ],
  },
  {
    fiscalYearId: "FY-2025-26",
    companyId: "CMP-001",
    companyName: "HOTEL & RESORTS PRIVATE LIMITED",
    fiscalYearName: "FY 2025-26",
    startDate: "01/04/2025",
    endDate: "31/03/2026",
    status: "Closed",
    isCurrent: false,

    carryForwardBalanceSheet: true,
    carryForwardCustomers: true,
    carryForwardVendors: true,
    transferPnLToRetainedEarnings: true,
    retainedEarningsAccountId: "3100 - Retained Earnings & Reserves A/c",

    totalRevenue: 49500000,
    totalExpenses: 37200000,
    netProfitLoss: 12300000,
    receivableOutstanding: 3120000,
    payableOutstanding: 2150000,
    unpostedVouchersCount: 0,
    isTrialBalanceBalanced: true,

    createdAt: "01/03/2025",
    createdBy: "System Admin",
    openedAt: "01/04/2025",
    openedBy: "System Admin",
    closedAt: "31/03/2026",
    closedBy: "Accounts Controller",

    auditLogs: [
      {
        id: "log-1",
        action: "Created",
        user: "System Admin",
        date: "01/03/2025",
        time: "09:00 AM",
      },
      {
        id: "log-2",
        action: "Opened",
        user: "System Admin",
        date: "01/04/2025",
        time: "08:00 AM",
      },
      {
        id: "log-3",
        action: "Set Current",
        user: "System Admin",
        date: "01/04/2025",
        time: "08:05 AM",
      },
      {
        id: "log-4",
        action: "Closed",
        user: "Accounts Controller",
        date: "31/03/2026",
        time: "11:59 PM",
        reason: "Annual Year-End Books Closure Completed.",
      },
    ],
  },
];
