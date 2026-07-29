export interface TrialBalanceEntry {
  id: string;
  code: string;
  name: string;
  level: "group" | "ledger" | "sub-ledger";
  parentId?: string;
  openingDr: number;
  openingCr: number;
  transDr: number;
  transCr: number;
  closingDr: number;
  closingCr: number;
  seqNo: number;
}

export const sampleTrialBalanceData: TrialBalanceEntry[] = [
  // 1000 — ASSETS
  {
    id: "grp-1000",
    code: "1000",
    name: "ASSETS",
    level: "group",
    openingDr: 400000,
    openingCr: 0,
    transDr: 380000,
    transCr: 200000,
    closingDr: 580000,
    closingCr: 0,
    seqNo: 1,
  },
  {
    id: "led-1010",
    code: "1010",
    name: "Cash in Hand - Front Desk",
    level: "ledger",
    parentId: "grp-1000",
    openingDr: 50000,
    openingCr: 0,
    transDr: 100000,
    transCr: 70000,
    closingDr: 80000,
    closingCr: 0,
    seqNo: 2,
  },
  {
    id: "led-1020",
    code: "1020",
    name: "HDFC Bank Operating A/c",
    level: "ledger",
    parentId: "grp-1000",
    openingDr: 250000,
    openingCr: 0,
    transDr: 200000,
    transCr: 100000,
    closingDr: 350000,
    closingCr: 0,
    seqNo: 3,
  },
  {
    id: "led-1030",
    code: "1030",
    name: "City Ledger Debtors (Guest AR)",
    level: "ledger",
    parentId: "grp-1000",
    openingDr: 100000,
    openingCr: 0,
    transDr: 80000,
    transCr: 30000,
    closingDr: 150000,
    closingCr: 0,
    seqNo: 4,
  },

  // 2000 — LIABILITIES
  {
    id: "grp-2000",
    code: "2000",
    name: "LIABILITIES",
    level: "group",
    openingDr: 0,
    openingCr: 200000,
    transDr: 70000,
    transCr: 150000,
    closingDr: 0,
    closingCr: 280000,
    seqNo: 5,
  },
  {
    id: "led-2010",
    code: "2010",
    name: "Accounts Payable - Vendors",
    level: "ledger",
    parentId: "grp-2000",
    openingDr: 0,
    openingCr: 150000,
    transDr: 50000,
    transCr: 100000,
    closingDr: 0,
    closingCr: 200000,
    seqNo: 6,
  },
  {
    id: "led-2020",
    code: "2020",
    name: "Advance Guest Deposits",
    level: "ledger",
    parentId: "grp-2000",
    openingDr: 0,
    openingCr: 50000,
    transDr: 20000,
    transCr: 50000,
    closingDr: 0,
    closingCr: 80000,
    seqNo: 7,
  },

  // 3000 — EQUITY & CAPITAL
  {
    id: "grp-3000",
    code: "3000",
    name: "EQUITY & CAPITAL",
    level: "group",
    openingDr: 0,
    openingCr: 200000,
    transDr: 0,
    transCr: 0,
    closingDr: 0,
    closingCr: 200000,
    seqNo: 8,
  },
  {
    id: "led-3010",
    code: "3010",
    name: "Owner Share Capital",
    level: "ledger",
    parentId: "grp-3000",
    openingDr: 0,
    openingCr: 200000,
    transDr: 0,
    transCr: 0,
    closingDr: 0,
    closingCr: 200000,
    seqNo: 9,
  },

  // 4000 — REVENUE & INCOME
  {
    id: "grp-4000",
    code: "4000",
    name: "REVENUE & INCOME",
    level: "group",
    openingDr: 0,
    openingCr: 0,
    transDr: 0,
    transCr: 100000,
    closingDr: 0,
    closingCr: 100000,
    seqNo: 10,
  },
];
