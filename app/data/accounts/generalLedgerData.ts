export type SourceModule =
  | "Front Office"
  | "F&B"
  | "Purchase & Stores"
  | "HR"
  | "Maintenance"
  | "Sales & Marketing"
  | "Accounts";

export type AccountNature = "Asset" | "Liability" | "Income" | "Expense";

export interface VoucherLineAccount {
  accountId: string;
  accountCode: string;
  accountName: string;
  amount: number;
}

export interface GeneralLedgerEntry {
  id: string;
  vouchDt: string;
  vouchNo: string;
  particulars: string;
  voucherTypeId: string;
  trnType: "Opening" | "Receipts" | "Payments" | "Journal" | "Sales" | "Purchase" | "Contra";
  sourceModule: SourceModule;

  // ID-based Accounting Relationships
  accountId: string;
  accountCode: string;
  accountName: string;
  group: string;
  nature: AccountNature;

  // PMS Dimensions
  partyId?: string;
  divisionId?: string;

  // Amounts
  drAmt: number;
  crAmt: number;

  // Accounting distribution breakdown for drill-down view
  drAccounts: VoucherLineAccount[];
  crAccounts: VoucherLineAccount[];

  // Audit Info
  createdBy: string;
  createdDate: string;
  isOpeningBalance?: boolean;
}

// Party Master Reference Map
export interface PartyReference {
  partyId: string;
  partyName: string;
  partyType: "Guest" | "Corporate" | "Travel Agent" | "Vendor" | "Utility Provider";
}

export const samplePartiesList: PartyReference[] = [
  {
    partyId: "PTY-00101",
    partyName: "Raj Kumar (Folio #1042)",
    partyType: "Guest",
  },
  {
    partyId: "PTY-00102",
    partyName: "MakeMyTrip India Pvt Ltd",
    partyType: "Travel Agent",
  },
  {
    partyId: "PTY-00201",
    partyName: "ABC Foods Pvt Ltd",
    partyType: "Vendor",
  },
  {
    partyId: "PTY-00202",
    partyName: "CleanLinen Laundry Co.",
    partyType: "Vendor",
  },
  {
    partyId: "PTY-00301",
    partyName: "State Power & Electricity Corp Ltd",
    partyType: "Utility Provider",
  },
];

export function resolvePartyName(partyId?: string): string {
  if (!partyId) return "-";
  const p = samplePartiesList.find((item) => item.partyId === partyId);
  return p ? p.partyName : partyId;
}

// Division Master Reference Map
export interface DivisionReference {
  divisionId: string;
  divisionCode: string;
  divisionName: string;
}

export const sampleDivisionsReference: DivisionReference[] = [
  { divisionId: "DIV-001", divisionCode: "ROOMS", divisionName: "Rooms" },
  { divisionId: "DIV-002", divisionCode: "FNB", divisionName: "F&B" },
  { divisionId: "DIV-003", divisionCode: "BANQUET", divisionName: "Banquet" },
  { divisionId: "DIV-004", divisionCode: "HOUSEKEEPING", divisionName: "Housekeeping" },
  { divisionId: "DIV-005", divisionCode: "ENGINEERING", divisionName: "Engineering & Maintenance" },
  { divisionId: "DIV-006", divisionCode: "SALES", divisionName: "Sales & Marketing" },
  { divisionId: "DIV-007", divisionCode: "HR", divisionName: "Human Resources" },
  { divisionId: "DIV-008", divisionCode: "ADMIN", divisionName: "Administration" },
];

export function resolveDivisionName(divisionId?: string): string {
  if (!divisionId) return "-";
  const d = sampleDivisionsReference.find((item) => item.divisionId === divisionId);
  return d ? d.divisionName : divisionId;
}

// Account Option for Selector
export interface LedgerAccountOption {
  accountId: string;
  accountCode: string;
  accountName: string;
  group: string;
  nature: AccountNature;
}

export const sampleLedgersList: LedgerAccountOption[] = [
  { accountId: "ACC-1001", accountCode: "1010", accountName: "YES BANK Operating A/c", group: "Bank Accounts", nature: "Asset" },
  { accountId: "ACC-1002", accountCode: "1020", accountName: "Cash in Hand - Front Desk", group: "Cash Accounts", nature: "Asset" },
  { accountId: "ACC-1003", accountCode: "1030", accountName: "City Ledger Debtors (Guest AR)", group: "Current Assets", nature: "Asset" },
  { accountId: "ACC-2001", accountCode: "2010", accountName: "Accounts Payable - Vendors", group: "Current Liabilities", nature: "Liability" },
  { accountId: "ACC-3001", accountCode: "3010", accountName: "Room Sales Revenue", group: "Income", nature: "Income" },
  { accountId: "ACC-3002", accountCode: "3020", accountName: "Food & Beverage Revenue", group: "Income", nature: "Income" },
  { accountId: "ACC-4001", accountCode: "4010", accountName: "Electricity & Power Utility", group: "Expenses", nature: "Expense" },
  { accountId: "ACC-4002", accountCode: "4020", accountName: "Laundry & Linen Operating Expense", group: "Expenses", nature: "Expense" },
];

export const sampleGroups = [
  "<ALL>",
  "Assets",
  "Liabilities",
  "Income",
  "Expenses",
  "Bank Accounts",
  "Cash Accounts",
  "Current Assets",
  "Current Liabilities",
];

export const sampleVoucherTypes = [
  "<ALL>",
  "Receipts",
  "Payments",
  "Journal",
  "Sales",
  "Purchase",
  "Contra",
];

// Seed Data: Exactly 1 Opening Balance + 6 PMS-style Operational Postings
export const sampleGeneralLedgerData: GeneralLedgerEntry[] = [
  {
    id: "gl-ob-001",
    vouchDt: "01/04/2026",
    vouchNo: "OB-2026-001",
    particulars: "Opening Balance Brought Forward",
    voucherTypeId: "VT-003",
    trnType: "Opening",
    sourceModule: "Accounts",
    accountId: "ACC-1001",
    accountCode: "1010",
    accountName: "YES BANK Operating A/c",
    group: "Bank Accounts",
    nature: "Asset",
    partyId: undefined,
    divisionId: undefined,
    drAmt: 250000,
    crAmt: 0,
    drAccounts: [
      { accountId: "ACC-1001", accountCode: "1010", accountName: "YES BANK Operating A/c", amount: 250000 },
    ],
    crAccounts: [
      { accountId: "ACC-2099", accountCode: "2099", accountName: "Retained Earnings / Reserve Fund", amount: 250000 },
    ],
    createdBy: "System Migration",
    createdDate: "01/04/2026 00:00",
    isOpeningBalance: true,
  },
  {
    id: "gl-001",
    vouchDt: "05/04/2026",
    vouchNo: "RV/26-27/00001",
    particulars: "Room Revenue Settlement - Guest Folio #1042",
    voucherTypeId: "VT-001",
    trnType: "Receipts",
    sourceModule: "Front Office",
    accountId: "ACC-3001",
    accountCode: "3010",
    accountName: "Room Sales Revenue",
    group: "Income",
    nature: "Income",
    partyId: "PTY-00101",
    divisionId: "DIV-001",
    drAmt: 45000,
    crAmt: 0,
    drAccounts: [
      { accountId: "ACC-1001", accountCode: "1010", accountName: "YES BANK Operating A/c", amount: 45000 },
    ],
    crAccounts: [
      { accountId: "ACC-3001", accountCode: "3010", accountName: "Room Sales Revenue", amount: 45000 },
    ],
    createdBy: "FO Cashier (Priya S.)",
    createdDate: "05/04/2026 11:30",
  },
  {
    id: "gl-002",
    vouchDt: "08/04/2026",
    vouchNo: "RV/26-27/00002",
    particulars: "Advance Corporate Booking Deposit - MakeMyTrip",
    voucherTypeId: "VT-001",
    trnType: "Receipts",
    sourceModule: "Front Office",
    accountId: "ACC-1003",
    accountCode: "1030",
    accountName: "City Ledger Debtors (Guest AR)",
    group: "Current Assets",
    nature: "Asset",
    partyId: "PTY-00102",
    divisionId: "DIV-006",
    drAmt: 60000,
    crAmt: 0,
    drAccounts: [
      { accountId: "ACC-1001", accountCode: "1010", accountName: "YES BANK Operating A/c", amount: 60000 },
    ],
    crAccounts: [
      { accountId: "ACC-1003", accountCode: "1030", accountName: "City Ledger Debtors (Guest AR)", amount: 60000 },
    ],
    createdBy: "Reservation Desk (Karan M.)",
    createdDate: "08/04/2026 14:15",
  },
  {
    id: "gl-003",
    vouchDt: "12/04/2026",
    vouchNo: "PV/26-27/00001",
    particulars: "Vendor Payment - ABC Foods Pvt Ltd (Kitchen Inventory)",
    voucherTypeId: "VT-002",
    trnType: "Payments",
    sourceModule: "Purchase & Stores",
    accountId: "ACC-2001",
    accountCode: "2010",
    accountName: "Accounts Payable - Vendors",
    group: "Current Liabilities",
    nature: "Liability",
    partyId: "PTY-00201",
    divisionId: "DIV-002",
    drAmt: 0,
    crAmt: 35000,
    drAccounts: [
      { accountId: "ACC-2001", accountCode: "2010", accountName: "Accounts Payable - Vendors", amount: 35000 },
    ],
    crAccounts: [
      { accountId: "ACC-1001", accountCode: "1010", accountName: "YES BANK Operating A/c", amount: 35000 },
    ],
    createdBy: "Accounts Executive (Sunil M.)",
    createdDate: "12/04/2026 16:45",
  },
  {
    id: "gl-004",
    vouchDt: "15/04/2026",
    vouchNo: "PV/26-27/00002",
    particulars: "Guest Laundry & Linen Service Settlement - CleanLinen Co.",
    voucherTypeId: "VT-002",
    trnType: "Payments",
    sourceModule: "Purchase & Stores",
    accountId: "ACC-4002",
    accountCode: "4020",
    accountName: "Laundry & Linen Operating Expense",
    group: "Expenses",
    nature: "Expense",
    partyId: "PTY-00202",
    divisionId: "DIV-004",
    drAmt: 0,
    crAmt: 25000,
    drAccounts: [
      { accountId: "ACC-4002", accountCode: "4020", accountName: "Laundry & Linen Operating Expense", amount: 25000 },
    ],
    crAccounts: [
      { accountId: "ACC-1001", accountCode: "1010", accountName: "YES BANK Operating A/c", amount: 25000 },
    ],
    createdBy: "Accounts Executive (Sunil M.)",
    createdDate: "15/04/2026 11:20",
  },
  {
    id: "gl-005",
    vouchDt: "18/04/2026",
    vouchNo: "RV/26-27/00003",
    particulars: "All-Day Dining Restaurant POS Daily Settlement",
    voucherTypeId: "VT-001",
    trnType: "Receipts",
    sourceModule: "F&B",
    accountId: "ACC-3002",
    accountCode: "3020",
    accountName: "Food & Beverage Revenue",
    group: "Income",
    nature: "Income",
    partyId: undefined,
    divisionId: "DIV-002",
    drAmt: 28500,
    crAmt: 0,
    drAccounts: [
      { accountId: "ACC-1001", accountCode: "1010", accountName: "YES BANK Operating A/c", amount: 28500 },
    ],
    crAccounts: [
      { accountId: "ACC-3002", accountCode: "3020", accountName: "Food & Beverage Revenue", amount: 28500 },
    ],
    createdBy: "Restaurant Cashier (Anita R.)",
    createdDate: "18/04/2026 23:10",
  },
  {
    id: "gl-006",
    vouchDt: "22/04/2026",
    vouchNo: "PV/26-27/00003",
    particulars: "Monthly Grid Electricity & Transformer Utility Bill",
    voucherTypeId: "VT-002",
    trnType: "Payments",
    sourceModule: "Maintenance",
    accountId: "ACC-4001",
    accountCode: "4010",
    accountName: "Electricity & Power Utility",
    group: "Expenses",
    nature: "Expense",
    partyId: "PTY-00301",
    divisionId: "DIV-005",
    drAmt: 0,
    crAmt: 42000,
    drAccounts: [
      { accountId: "ACC-4001", accountCode: "4010", accountName: "Electricity & Power Utility", amount: 42000 },
    ],
    crAccounts: [
      { accountId: "ACC-1001", accountCode: "1010", accountName: "YES BANK Operating A/c", amount: 42000 },
    ],
    createdBy: "Finance Manager (Vikas K.)",
    createdDate: "22/04/2026 15:00",
  },
];
