export interface VoucherEntryItem {
  id: string;
  vouchNo: string;
  vouchDt: string;
  vouchType: "Journal (JV)" | "Receipt (RCP)" | "Payment (PAY)" | "Bank (BNK)" | "Sales (SLS)";
  refNo: string;
  accountCode: string;
  accountName: string;
  narration: string;
  debitAmt: number;
  creditAmt: number;
  preparedBy: string;
  approvedBy: string;
  status: "Posted" | "Provisional" | "Approved";
  entries?: {
    accountCode: string;
    accountName: string;
    description?: string;
    debit: number;
    credit: number;
  }[];
}

export const sampleVoucherTypes = [
  "All Voucher Types",
  "Receipts",
  "Payments",
  "Journals",
  "Bank Vouchers",
  "Sales Vouchers",
];

export const sampleReprintVouchersData: VoucherEntryItem[] = [
  {
    id: "v-608",
    vouchNo: "608",
    vouchDt: "23/07/26",
    vouchType: "Receipt (RCP)",
    refNo: "AgnsBlRef PAYTM 22/07/26",
    accountCode: "1102-88",
    accountName: "ONE 97 COMMUNICATION LIMITED",
    narration: "NEFT PAYTM PAYMENTS SERVICES LIMITED",
    debitAmt: 13597,
    creditAmt: 13597,
    preparedBy: "ABHIJIT",
    approvedBy: "Rajesh Kumar",
    status: "Posted",
    entries: [
      {
        accountCode: "1102-88",
        accountName: "ONE 97 COMMUNICATION LIMITED",
        description: "AgnsBlRef PAYTM 22/07/26",
        debit: 0,
        credit: 13597,
      },
      {
        accountCode: "1002-05",
        accountName: "THE COSMOS CO-OP BANK LTD",
        description: "Direct Bank Receipt Transfer",
        debit: 13597,
        credit: 0,
      },
    ],
  },
  {
    id: "v-101",
    vouchNo: "JV-2026-0891",
    vouchDt: "28/04/2026",
    vouchType: "Journal (JV)",
    refNo: "REF-88912",
    accountCode: "1401-01",
    accountName: "Stock Asset - F&B Food Provisions",
    narration: "Period end closing stock adjustment valuation transfer to COGS account",
    debitAmt: 49500,
    creditAmt: 49500,
    preparedBy: "Sunil Sharma",
    approvedBy: "Rajesh Kumar",
    status: "Posted",
    entries: [
      { accountCode: "1401-01", accountName: "Stock Asset - F&B Food Provisions", description: "Closing Stock Valuation", debit: 49500, credit: 0 },
      { accountCode: "5101-01", accountName: "Cost of Goods Sold - F&B Provisions", description: "COGS Transfer", debit: 0, credit: 49500 },
    ],
  },
  {
    id: "v-102",
    vouchNo: "RCP-2026-0042",
    vouchDt: "28/04/2026",
    vouchType: "Receipt (RCP)",
    refNo: "EDC-TXN-99120",
    accountCode: "1002-01",
    accountName: "YES BANK A/c #9012",
    narration: "Room revenue EDC card settlement deposit in transit",
    debitAmt: 45000,
    creditAmt: 45000,
    preparedBy: "Anita Desai",
    approvedBy: "Rajesh Kumar",
    status: "Posted",
    entries: [
      { accountCode: "1002-01", accountName: "YES BANK A/c #9012", description: "EDC Card Batch Deposit", debit: 45000, credit: 0 },
      { accountCode: "1101-01", accountName: "Guest Ledger - Front Office Receipts", description: "Folio Settlement", debit: 0, credit: 45000 },
    ],
  },
  {
    id: "v-103",
    vouchNo: "PAY-2026-0089",
    vouchDt: "27/04/2026",
    vouchType: "Payment (PAY)",
    refNo: "CHQ-884012",
    accountCode: "2101-05",
    accountName: "Fresh Foods Supplies Ltd",
    narration: "Vendor payment cheque issued for weekly dairy & vegetable supplies",
    debitAmt: 35000,
    creditAmt: 35000,
    preparedBy: "Sunil Sharma",
    approvedBy: "Rajesh Kumar",
    status: "Posted",
    entries: [
      { accountCode: "2101-05", accountName: "Fresh Foods Supplies Ltd", description: "Vendor Bill Payment", debit: 35000, credit: 0 },
      { accountCode: "1002-01", accountName: "YES BANK A/c #9012", description: "Bank Cheque Outflow", debit: 0, credit: 35000 },
    ],
  },
  {
    id: "v-104",
    vouchNo: "RCP-2026-0043",
    vouchDt: "28/04/2026",
    vouchType: "Receipt (RCP)",
    refNo: "UTR-882910485",
    accountCode: "1002-01",
    accountName: "YES BANK A/c #9012",
    narration: "MakeMyTrip corporate booking NEFT direct credit settlement",
    debitAmt: 65000,
    creditAmt: 65000,
    preparedBy: "Anita Desai",
    approvedBy: "Rajesh Kumar",
    status: "Approved",
    entries: [
      { accountCode: "1002-01", accountName: "YES BANK A/c #9012", description: "NEFT Credit", debit: 65000, credit: 0 },
      { accountCode: "1102-04", accountName: "MakeMyTrip India Pvt Ltd", description: "Corporate Bill Settlement", debit: 0, credit: 65000 },
    ],
  },
];
