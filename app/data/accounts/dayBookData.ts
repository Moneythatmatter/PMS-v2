export interface DayBookEntryLine {
  lineNo: number;
  glCode: string;
  glAccountName: string;
  particulars: string;
  debitAmount: number;
  creditAmount: number;
}

export interface DayBookVoucher {
  id: string;
  voucherDate: string;
  voucherTime: string;
  voucherNo: string;
  voucherType: "JV" | "PV" | "RV" | "CV" | "SV";
  primaryAccount: string;
  refNo: string;
  totalDebit: number;
  totalCredit: number;
  createdBy: string;
  division: string;
  status: "Posted" | "Unposted";
  lines: DayBookEntryLine[];
}

export interface DayBookSummary {
  cashOpening: number;
  cashReceipts: number;
  cashPayments: number;
  cashClosing: number;
  bankOpening: number;
  bankDeposits: number;
  bankPayments: number;
  bankClosing: number;
}

export const sampleDayBookVouchers: DayBookVoucher[] = [
  {
    id: "db-01",
    voucherDate: "04/08/2026",
    voucherTime: "10:15 AM",
    voucherNo: "RV-2026-0115",
    voucherType: "RV",
    primaryAccount: "MakeMyTrip India Pvt Ltd",
    refNo: "UTR/MMT/9941",
    totalDebit: 450000.0,
    totalCredit: 450000.0,
    createdBy: "Jay Admin",
    division: "Rooms Division",
    status: "Posted",
    lines: [
      {
        lineNo: 1,
        glCode: "1020",
        glAccountName: "HDFC Bank Operations A/c",
        particulars: "Direct NEFT Collection for OTA Room Settlement",
        debitAmount: 450000.0,
        creditAmount: 0.0,
      },
      {
        lineNo: 2,
        glCode: "1200",
        glAccountName: "City Ledger Receivables (MakeMyTrip)",
        particulars: "City Ledger Bill Credit Settlement",
        debitAmount: 0.0,
        creditAmount: 450000.0,
      },
    ],
  },
  {
    id: "db-02",
    voucherDate: "04/08/2026",
    voucherTime: "11:45 AM",
    voucherNo: "PV-2026-0092",
    voucherType: "PV",
    primaryAccount: "Fresh Produce Dairy Supplies",
    refNo: "INV-FP-7721",
    totalDebit: 185000.0,
    totalCredit: 185000.0,
    createdBy: "Abhijit Suthar",
    division: "Food & Beverage",
    status: "Posted",
    lines: [
      {
        lineNo: 1,
        glCode: "2100",
        glAccountName: "Sundry Creditors (Fresh Produce Dairy)",
        particulars: "Vendor Payment against Purchase Bill #FP-7721",
        debitAmount: 185000.0,
        creditAmount: 0.0,
      },
      {
        lineNo: 2,
        glCode: "1020",
        glAccountName: "HDFC Bank Operations A/c",
        particulars: "Cheque Outward Payment #CHQ-44102",
        debitAmount: 0.0,
        creditAmount: 185000.0,
      },
    ],
  },
  {
    id: "db-03",
    voucherDate: "04/08/2026",
    voucherTime: "02:30 PM",
    voucherNo: "CV-2026-0021",
    voucherType: "CV",
    primaryAccount: "Main Cash In Hand A/c",
    refNo: "CHQ-88219",
    totalDebit: 50000.0,
    totalCredit: 50000.0,
    createdBy: "Jay Admin",
    division: "Administrative & General",
    status: "Posted",
    lines: [
      {
        lineNo: 1,
        glCode: "1010",
        glAccountName: "Main Cash In Hand A/c",
        particulars: "Cash Drawn from Bank for Front Office Cash Float",
        debitAmount: 50000.0,
        creditAmount: 0.0,
      },
      {
        lineNo: 2,
        glCode: "1020",
        glAccountName: "HDFC Bank Operations A/c",
        particulars: "Bank Self Withdrawal",
        debitAmount: 0.0,
        creditAmount: 50000.0,
      },
    ],
  },
  {
    id: "db-04",
    voucherDate: "04/08/2026",
    voucherTime: "04:10 PM",
    voucherNo: "JV-2026-0068",
    voucherType: "JV",
    primaryAccount: "Property Operations Maintenance",
    refNo: "JV-MAINT-08",
    totalDebit: 700000.0,
    totalCredit: 700000.0,
    createdBy: "Abhijit Suthar",
    division: "Property Operations & Maintenance",
    status: "Posted",
    lines: [
      {
        lineNo: 1,
        glCode: "5200",
        glAccountName: "HVAC Generator Maintenance Expense A/c",
        particulars: "Monthly AMC Generator Servicing Expense Provision",
        debitAmount: 700000.0,
        creditAmount: 0.0,
      },
      {
        lineNo: 2,
        glCode: "2100",
        glAccountName: "Sundry Creditors (Voltas HVAC Services)",
        particulars: "AMC Provision Payable Credit",
        debitAmount: 0.0,
        creditAmount: 700000.0,
      },
    ],
  },
];

export const sampleDayBookSummaryData: DayBookSummary = {
  cashOpening: 350000.0,
  cashReceipts: 100000.0,
  cashPayments: 50000.0,
  cashClosing: 400000.0,
  bankOpening: 18000000.0,
  bankDeposits: 12500000.0,
  bankPayments: 4500000.0,
  bankClosing: 26000000.0,
};
