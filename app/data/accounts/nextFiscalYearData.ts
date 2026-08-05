export interface FiscalYearRecord {
  id: string;
  fyName: string;
  companyCode: string;
  companyName: string;
  startDate: string;
  endDate: string;
  startMonth: string;
  endMonth: string;
  status: "Active" | "Pending Initialization" | "Locked" | "Closed";
  baseCurrency: string;
  totalLedgersCount: number;
  retainedEarningsAccount: string;
  retainedEarningsAmount: number;
  allowBackPosting: boolean;
  lockDate: string;
  voucherResetFrequency: string;
  createdDate: string;
  createdBy: string;
  lastAuditDate: string;
}

export interface FiscalPeriodItem {
  periodNo: number;
  periodName: string;
  startDate: string;
  endDate: string;
  status: "Open" | "Locked" | "Closed" | "Future";
}

export const sampleFiscalYearRecords: FiscalYearRecord[] = [
  {
    id: "fy-2027",
    fyName: "FY 2027-2028",
    companyCode: "CMP-001",
    companyName: "LUXY HOTEL & RESORTS PRIVATE LIMITED",
    startDate: "01/04/2027",
    endDate: "31/03/2028",
    startMonth: "April",
    endMonth: "March",
    status: "Pending Initialization",
    baseCurrency: "INR",
    totalLedgersCount: 142,
    retainedEarningsAccount: "3100 - Retained Earnings & Reserves A/c",
    retainedEarningsAmount: 48520500.0,
    allowBackPosting: true,
    lockDate: "31/03/2027",
    voucherResetFrequency: "Annually",
    createdDate: "Today",
    createdBy: "Accounts Admin (Jay)",
    lastAuditDate: "31/07/2026 17:45",
  },
  {
    id: "fy-2026",
    fyName: "FY 2026-2027",
    companyCode: "CMP-001",
    companyName: "LUXY HOTEL & RESORTS PRIVATE LIMITED",
    startDate: "01/04/2026",
    endDate: "31/03/2027",
    startMonth: "April",
    endMonth: "March",
    status: "Active",
    baseCurrency: "INR",
    totalLedgersCount: 142,
    retainedEarningsAccount: "3100 - Retained Earnings & Reserves A/c",
    retainedEarningsAmount: 38250000.0,
    allowBackPosting: true,
    lockDate: "31/03/2026",
    voucherResetFrequency: "Annually",
    createdDate: "01/04/2026",
    createdBy: "Abhijit Suthar",
    lastAuditDate: "31/07/2026 14:30",
  },
  {
    id: "fy-2025",
    fyName: "FY 2025-2026",
    companyCode: "CMP-001",
    companyName: "LUXY HOTEL & RESORTS PRIVATE LIMITED",
    startDate: "01/04/2025",
    endDate: "31/03/2026",
    startMonth: "April",
    endMonth: "March",
    status: "Locked",
    baseCurrency: "INR",
    totalLedgersCount: 135,
    retainedEarningsAccount: "3100 - Retained Earnings & Reserves A/c",
    retainedEarningsAmount: 29500000.0,
    allowBackPosting: false,
    lockDate: "31/03/2026",
    voucherResetFrequency: "Annually",
    createdDate: "01/04/2025",
    createdBy: "System Migration",
    lastAuditDate: "31/03/2026 23:59",
  },
  {
    id: "fy-2024",
    fyName: "FY 2024-2025",
    companyCode: "CMP-001",
    companyName: "LUXY HOTEL & RESORTS PRIVATE LIMITED",
    startDate: "01/04/2024",
    endDate: "31/03/2025",
    startMonth: "April",
    endMonth: "March",
    status: "Closed",
    baseCurrency: "INR",
    totalLedgersCount: 120,
    retainedEarningsAccount: "3100 - Retained Earnings & Reserves A/c",
    retainedEarningsAmount: 21000000.0,
    allowBackPosting: false,
    lockDate: "31/03/2025",
    voucherResetFrequency: "Annually",
    createdDate: "01/04/2024",
    createdBy: "System Setup",
    lastAuditDate: "31/03/2025 23:59",
  },
];

export const sampleFiscalPeriods2027: FiscalPeriodItem[] = [
  { periodNo: 1, periodName: "Period 01 (April 2027)", startDate: "01/04/2027", endDate: "30/04/2027", status: "Future" },
  { periodNo: 2, periodName: "Period 02 (May 2027)", startDate: "01/05/2027", endDate: "31/05/2027", status: "Future" },
  { periodNo: 3, periodName: "Period 03 (June 2027)", startDate: "01/06/2027", endDate: "30/06/2027", status: "Future" },
  { periodNo: 4, periodName: "Period 04 (July 2027)", startDate: "01/07/2027", endDate: "31/07/2027", status: "Future" },
  { periodNo: 5, periodName: "Period 05 (August 2027)", startDate: "01/08/2027", endDate: "31/08/2027", status: "Future" },
  { periodNo: 6, periodName: "Period 06 (September 2027)", startDate: "01/09/2027", endDate: "30/09/2027", status: "Future" },
  { periodNo: 7, periodName: "Period 07 (October 2027)", startDate: "01/10/2027", endDate: "31/10/2027", status: "Future" },
  { periodNo: 8, periodName: "Period 08 (November 2027)", startDate: "01/11/2027", endDate: "30/11/2027", status: "Future" },
  { periodNo: 9, periodName: "Period 09 (December 2027)", startDate: "01/12/2027", endDate: "31/12/2027", status: "Future" },
  { periodNo: 10, periodName: "Period 10 (January 2028)", startDate: "01/01/2028", endDate: "31/01/2028", status: "Future" },
  { periodNo: 11, periodName: "Period 11 (February 2028)", startDate: "01/02/2028", endDate: "29/02/2028", status: "Future" },
  { periodNo: 12, periodName: "Period 12 (March 2028)", startDate: "01/03/2028", endDate: "31/03/2028", status: "Future" },
];

export const sampleValidationChecklist = [
  { id: "chk-1", title: "Active Financial Year Audit", detail: "FY 2026-2027 is active with zero unposted journal batches.", status: "Passed" },
  { id: "chk-2", title: "Trial Balance Equilibrium", detail: "Debit Total matches Credit Total (Difference: ₹0.00).", status: "Passed" },
  { id: "chk-3", title: "Bank Reconciliation Audit", detail: "All bank accounts reconciled up to current month closing.", status: "Passed" },
  { id: "chk-4", title: "Retained Earnings Mapping", detail: "Account 3100 mapped for P&L Year-End net balance transfer.", status: "Passed" },
  { id: "chk-5", title: "Chart of Accounts Structure", detail: "142 active groups & ledgers verified for opening balance transfer.", status: "Passed" },
];
