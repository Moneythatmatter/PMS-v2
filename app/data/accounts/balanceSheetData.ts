export interface BalanceSheetLineItem {
  id: string;
  code: string;
  name: string;
  amount: number;
  previousYearAmount: number;
  level: 1 | 2 | 3; // 1: Group, 2: SubGroup, 3: Ledger
  category: "EQUITY_LIABILITIES" | "ASSETS";
  subSection:
    | "Capital & Reserves"
    | "Non-Current Liabilities"
    | "Current Liabilities"
    | "Fixed Assets"
    | "Non-Current Investments"
    | "Current Assets";
  childItems?: BalanceSheetLineItem[];
}

export interface BalanceSheetData {
  asOnDate: string;
  companyName: string;
  financialYear: string;
  totalLiabilities: number;
  totalAssets: number;
  isBalanced: boolean;
  equityAndLiabilities: BalanceSheetLineItem[];
  assets: BalanceSheetLineItem[];
}

export const sampleBalanceSheetData: BalanceSheetData = {
  asOnDate: "31/03/2027",
  companyName: "HOTEL & RESORTS PRIVATE LIMITED",
  financialYear: "2026 - 2027",
  totalLiabilities: 485000000.0,
  totalAssets: 485000000.0,
  isBalanced: true,
  equityAndLiabilities: [
    {
      id: "liab-01",
      code: "1000",
      name: "CAPITAL & RESERVES",
      amount: 321000000.0,
      previousYearAmount: 295000000.0,
      level: 1,
      category: "EQUITY_LIABILITIES",
      subSection: "Capital & Reserves",
      childItems: [
        {
          id: "liab-01-01",
          code: "1010",
          name: "Paid-up Share Capital",
          amount: 200000000.0,
          previousYearAmount: 200000000.0,
          level: 2,
          category: "EQUITY_LIABILITIES",
          subSection: "Capital & Reserves",
        },
        {
          id: "liab-01-02",
          code: "1020",
          name: "General Reserve & Surplus",
          amount: 73800000.0,
          previousYearAmount: 61000000.0,
          level: 2,
          category: "EQUITY_LIABILITIES",
          subSection: "Capital & Reserves",
        },
        {
          id: "liab-01-03",
          code: "1030",
          name: "Profit & Loss A/c (Current Year Retained Earnings)",
          amount: 47200000.0,
          previousYearAmount: 34000000.0,
          level: 2,
          category: "EQUITY_LIABILITIES",
          subSection: "Capital & Reserves",
        },
      ],
    },
    {
      id: "liab-02",
      code: "2000",
      name: "NON-CURRENT LIABILITIES (LONG-TERM BORROWINGS)",
      amount: 110000000.0,
      previousYearAmount: 125000000.0,
      level: 1,
      category: "EQUITY_LIABILITIES",
      subSection: "Non-Current Liabilities",
      childItems: [
        {
          id: "liab-02-01",
          code: "2010",
          name: "HDFC Term Loan (Hotel Property Construction)",
          amount: 85000000.0,
          previousYearAmount: 95000000.0,
          level: 2,
          category: "EQUITY_LIABILITIES",
          subSection: "Non-Current Liabilities",
        },
        {
          id: "liab-02-02",
          code: "2020",
          name: "ICICI Equipment Financial Lease Loan",
          amount: 25000000.0,
          previousYearAmount: 30000000.0,
          level: 2,
          category: "EQUITY_LIABILITIES",
          subSection: "Non-Current Liabilities",
        },
      ],
    },
    {
      id: "liab-03",
      code: "3000",
      name: "CURRENT LIABILITIES & PROVISIONS",
      amount: 54000000.0,
      previousYearAmount: 48000000.0,
      level: 1,
      category: "EQUITY_LIABILITIES",
      subSection: "Current Liabilities",
      childItems: [
        {
          id: "liab-03-01",
          code: "2100",
          name: "Sundry Creditors (Vendors & Suppliers)",
          amount: 28500000.0,
          previousYearAmount: 24000000.0,
          level: 2,
          category: "EQUITY_LIABILITIES",
          subSection: "Current Liabilities",
        },
        {
          id: "liab-03-02",
          code: "2200",
          name: "Guest Advance Deposits & OTA Prepayments",
          amount: 12500000.0,
          previousYearAmount: 11000000.0,
          level: 2,
          category: "EQUITY_LIABILITIES",
          subSection: "Current Liabilities",
        },
        {
          id: "liab-03-03",
          code: "2300",
          name: "Statutory Taxes Payable (GST & TDS)",
          amount: 8200000.0,
          previousYearAmount: 8000000.0,
          level: 2,
          category: "EQUITY_LIABILITIES",
          subSection: "Current Liabilities",
        },
        {
          id: "liab-03-04",
          code: "2400",
          name: "Outstanding Payroll & Utility Expenses",
          amount: 4800000.0,
          previousYearAmount: 5000000.0,
          level: 2,
          category: "EQUITY_LIABILITIES",
          subSection: "Current Liabilities",
        },
      ],
    },
  ],
  assets: [
    {
      id: "asset-01",
      code: "5000",
      name: "FIXED ASSETS (PROPERTY, PLANT & EQUIPMENT)",
      amount: 382000000.0,
      previousYearAmount: 395000000.0,
      level: 1,
      category: "ASSETS",
      subSection: "Fixed Assets",
      childItems: [
        {
          id: "asset-01-01",
          code: "5010",
          name: "Hotel Land & Building (Freehold)",
          amount: 280000000.0,
          previousYearAmount: 280000000.0,
          level: 2,
          category: "ASSETS",
          subSection: "Fixed Assets",
        },
        {
          id: "asset-01-02",
          code: "5020",
          name: "Plant, Machinery & HVAC Systems",
          amount: 55000000.0,
          previousYearAmount: 62000000.0,
          level: 2,
          category: "ASSETS",
          subSection: "Fixed Assets",
        },
        {
          id: "asset-01-03",
          code: "5030",
          name: "Furniture, Fixtures & Guest Room Interiors",
          amount: 32000000.0,
          previousYearAmount: 38000000.0,
          level: 2,
          category: "ASSETS",
          subSection: "Fixed Assets",
        },
        {
          id: "asset-01-04",
          code: "5040",
          name: "Computers, POS Hardware & System Software",
          amount: 15000000.0,
          previousYearAmount: 15000000.0,
          level: 2,
          category: "ASSETS",
          subSection: "Fixed Assets",
        },
      ],
    },
    {
      id: "asset-02",
      code: "6000",
      name: "NON-CURRENT INVESTMENTS & SECURITY DEPOSITS",
      amount: 15000000.0,
      previousYearAmount: 15000000.0,
      level: 1,
      category: "ASSETS",
      subSection: "Non-Current Investments",
      childItems: [
        {
          id: "asset-02-01",
          code: "6010",
          name: "Electricity Board & Utility Security Deposits",
          amount: 10000000.0,
          previousYearAmount: 10000000.0,
          level: 2,
          category: "ASSETS",
          subSection: "Non-Current Investments",
        },
        {
          id: "asset-02-02",
          code: "6020",
          name: "Long-Term Bank Fixed Deposits (Reserve)",
          amount: 5000000.0,
          previousYearAmount: 5000000.0,
          level: 2,
          category: "ASSETS",
          subSection: "Non-Current Investments",
        },
      ],
    },
    {
      id: "asset-03",
      code: "7000",
      name: "CURRENT ASSETS, LOANS & ADVANCES",
      amount: 88000000.0,
      previousYearAmount: 58000000.0,
      level: 1,
      category: "ASSETS",
      subSection: "Current Assets",
      childItems: [
        {
          id: "asset-03-01",
          code: "7010",
          name: "F&B Stores & General Inventory Stock",
          amount: 18500000.0,
          previousYearAmount: 14000000.0,
          level: 2,
          category: "ASSETS",
          subSection: "Current Assets",
        },
        {
          id: "asset-03-02",
          code: "1200",
          name: "Sundry Debtors (City Ledger Receivables)",
          amount: 42500000.0,
          previousYearAmount: 22000000.0,
          level: 2,
          category: "ASSETS",
          subSection: "Current Assets",
        },
        {
          id: "asset-03-03",
          code: "1100",
          name: "Guest Ledger (In-House Open Folios)",
          amount: 4200000.0,
          previousYearAmount: 3800000.0,
          level: 2,
          category: "ASSETS",
          subSection: "Current Assets",
        },
        {
          id: "asset-03-04",
          code: "1020",
          name: "Bank Balances (HDFC / ICICI / SBI)",
          amount: 18800000.0,
          previousYearAmount: 15000000.0,
          level: 2,
          category: "ASSETS",
          subSection: "Current Assets",
        },
        {
          id: "asset-03-05",
          code: "1010",
          name: "Cash in Hand & Front Desk Till Floats",
          amount: 4000000.0,
          previousYearAmount: 3200000.0,
          level: 2,
          category: "ASSETS",
          subSection: "Current Assets",
        },
      ],
    },
  ],
};
