export interface TransactionValidationMatrix {
  transactionType: string;
  drAllowAccounts: string[];
  drNotAllowAccounts: string[];
  crAllowAccounts: string[];
  crNotAllowAccounts: string[];
  updateBy: string;
  updateDate: string;
}

export const sampleTransactionValidationMatrixData: TransactionValidationMatrix[] = [
  {
    transactionType: "Journal Voucher (JV)",
    drAllowAccounts: [
      "1100 - Guest Ledger Control A/c",
      "1200 - City Ledger Control A/c",
      "5100 - A&G Expense Control A/c",
      "5200 - Maintenance Control A/c",
    ],
    drNotAllowAccounts: [
      "1010 - Main Cash In Hand A/c",
      "1020 - HDFC Bank Operations A/c",
    ],
    crAllowAccounts: [
      "1200 - City Ledger Control A/c",
      "2100 - Sundry Creditors Control A/c",
      "4100 - F&B Revenue Control A/c",
    ],
    crNotAllowAccounts: [
      "1010 - Main Cash In Hand A/c",
    ],
    updateBy: "ABHIJIT",
    updateDate: "24-July-2026",
  },
  {
    transactionType: "Receipt Voucher (RV)",
    drAllowAccounts: [
      "1010 - Main Cash In Hand A/c",
      "1020 - HDFC Bank Operations A/c",
      "1030 - ICICI Bank Collection A/c",
    ],
    drNotAllowAccounts: [
      "5100 - A&G Expense Control A/c",
      "5200 - Maintenance Control A/c",
    ],
    crAllowAccounts: [
      "1100 - Guest Ledger Control A/c",
      "1200 - City Ledger Control A/c",
    ],
    crNotAllowAccounts: [
      "2100 - Sundry Creditors Control A/c",
    ],
    updateBy: "ABHIJIT",
    updateDate: "24-July-2026",
  },
  {
    transactionType: "Payment Voucher (PV)",
    drAllowAccounts: [
      "2100 - Sundry Creditors Control A/c",
      "5100 - A&G Expense Control A/c",
      "5200 - Maintenance Control A/c",
    ],
    drNotAllowAccounts: [
      "4100 - F&B Revenue Control A/c",
    ],
    crAllowAccounts: [
      "1010 - Main Cash In Hand A/c",
      "1020 - HDFC Bank Operations A/c",
    ],
    crNotAllowAccounts: [
      "1100 - Guest Ledger Control A/c",
    ],
    updateBy: "ABHIJIT",
    updateDate: "24-July-2026",
  },
  {
    transactionType: "Contra Voucher (CV)",
    drAllowAccounts: [
      "1010 - Main Cash In Hand A/c",
      "1020 - HDFC Bank Operations A/c",
    ],
    drNotAllowAccounts: [
      "1200 - City Ledger Control A/c",
    ],
    crAllowAccounts: [
      "1010 - Main Cash In Hand A/c",
      "1020 - HDFC Bank Operations A/c",
    ],
    crNotAllowAccounts: [
      "2100 - Sundry Creditors Control A/c",
    ],
    updateBy: "ABHIJIT",
    updateDate: "24-July-2026",
  },
];
