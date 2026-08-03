export interface QueryResultItem {
  id: string;
  voucherDate: string;
  voucherNo: string;
  voucherType: "JV" | "PV" | "RV" | "CV" | "SV";
  accountName: string;
  accountCode: string;
  narration: string;
  refNo: string;
  debitAmount: number;
  creditAmount: number;
  createdBy: string;
  createdDate: string;
  status: "Posted" | "Unposted" | "Cancelled";
  division: string;
  chequeNo?: string;
  chequeDate?: string;
  bankName?: string;
  lineItems: {
    lineNo: number;
    glAccount: string;
    description: string;
    debit: number;
    credit: number;
  }[];
}

export const sampleQueryResultsData: QueryResultItem[] = [
  {
    id: "q-001",
    voucherDate: "02/08/2026",
    voucherNo: "PV-2026-0084",
    voucherType: "PV",
    accountName: "MakeMyTrip India Pvt Ltd",
    accountCode: "PARTY-TA01",
    narration: "Payment towards OTA Commission & Net Settlement for July 2026 bookings",
    refNo: "MMT/JUL/8821",
    debitAmount: 450000.0,
    creditAmount: 0.0,
    createdBy: "Jay Admin",
    createdDate: "02/08/2026 14:30",
    status: "Posted",
    division: "Rooms Division",
    chequeNo: "CHQ-882109",
    chequeDate: "02/08/2026",
    bankName: "HDFC Bank Operations A/c",
    lineItems: [
      {
        lineNo: 1,
        glAccount: "1200 - City Ledger Control A/c (MMT)",
        description: "OTA Net Settlement Debit",
        debit: 450000.0,
        credit: 0.0,
      },
      {
        lineNo: 2,
        glAccount: "1020 - HDFC Bank Operations A/c",
        description: "Bank Transfer Outward",
        debit: 0.0,
        credit: 450000.0,
      },
    ],
  },
  {
    id: "q-002",
    voucherDate: "01/08/2026",
    voucherNo: "RV-2026-0112",
    voucherType: "RV",
    accountName: "Infosys Technologies Ltd",
    accountCode: "PARTY-CORP02",
    narration: "Advance deposit received for Annual Corporate Conference (August 2026)",
    refNo: "UTR/INF/991202",
    debitAmount: 0.0,
    creditAmount: 850000.0,
    createdBy: "Abhijit Suthar",
    createdDate: "01/08/2026 11:15",
    status: "Posted",
    division: "Food & Beverage",
    chequeNo: "UTR991202",
    chequeDate: "01/08/2026",
    bankName: "ICICI Bank Collection A/c",
    lineItems: [
      {
        lineNo: 1,
        glAccount: "1030 - ICICI Bank Collection A/c",
        description: "Direct NEFT Credit",
        debit: 850000.0,
        credit: 0.0,
      },
      {
        lineNo: 2,
        glAccount: "1200 - City Ledger Control A/c (Infosys)",
        description: "Banquet Advance Receipt",
        debit: 0.0,
        credit: 850000.0,
      },
    ],
  },
  {
    id: "q-003",
    voucherDate: "30/07/2026",
    voucherNo: "JV-2026-0045",
    voucherType: "JV",
    accountName: "Fresh Supplies & Co",
    accountCode: "PARTY-SUPP05",
    narration: "Monthly provision for Kitchen Perishable Vegetables & Dairy supplies",
    refNo: "INV-FS-4410",
    debitAmount: 185000.0,
    creditAmount: 0.0,
    createdBy: "System Auditor",
    createdDate: "30/07/2026 16:45",
    status: "Posted",
    division: "Food & Beverage",
    lineItems: [
      {
        lineNo: 1,
        glAccount: "5100 - F&B Kitchen Supplies Expense A/c",
        description: "Kitchen Supplies Expense",
        debit: 185000.0,
        credit: 0.0,
      },
      {
        lineNo: 2,
        glAccount: "2100 - Sundry Creditors (Fresh Supplies)",
        description: "Vendor Payable Credit",
        debit: 0.0,
        credit: 185000.0,
      },
    ],
  },
  {
    id: "q-004",
    voucherDate: "28/07/2026",
    voucherNo: "CV-2026-0018",
    voucherType: "CV",
    accountName: "Main Cash In Hand A/c",
    accountCode: "1010",
    narration: "Cash withdrawal from HDFC Bank for Front Desk Petty Cash Replenishment",
    refNo: "CHQ-77102",
    debitAmount: 50000.0,
    creditAmount: 0.0,
    createdBy: "Jay Admin",
    createdDate: "28/07/2026 10:20",
    status: "Unposted",
    division: "Administrative & General",
    chequeNo: "CHQ-77102",
    chequeDate: "28/07/2026",
    bankName: "HDFC Bank Operations A/c",
    lineItems: [
      {
        lineNo: 1,
        glAccount: "1010 - Main Cash In Hand A/c",
        description: "Cash Received",
        debit: 50000.0,
        credit: 0.0,
      },
      {
        lineNo: 2,
        glAccount: "1020 - HDFC Bank Operations A/c",
        description: "Cash Withdrawal",
        debit: 0.0,
        credit: 50000.0,
      },
    ],
  },
  {
    id: "q-005",
    voucherDate: "25/07/2026",
    voucherNo: "JV-2026-0041",
    voucherType: "JV",
    accountName: "Property Electricity Expense",
    accountCode: "5200",
    narration: "Monthly State Electricity Board Utility Bill Posting for July 2026",
    refNo: "BILL-EB-0726",
    debitAmount: 620000.0,
    creditAmount: 0.0,
    createdBy: "Abhijit Suthar",
    createdDate: "25/07/2026 15:10",
    status: "Posted",
    division: "Property Operations & Maintenance",
    lineItems: [
      {
        lineNo: 1,
        glAccount: "5200 - Electricity & Power Utility A/c",
        description: "Electricity Expense",
        debit: 620000.0,
        credit: 0.0,
      },
      {
        lineNo: 2,
        glAccount: "2300 - Statutory Utilities Payable A/c",
        description: "EB Board Payable",
        debit: 0.0,
        credit: 620000.0,
      },
    ],
  },
];
