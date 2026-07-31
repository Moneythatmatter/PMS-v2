export interface GLReceiptPaymentVoucher {
  id: string;
  vouchNo: string;
  vouchDt: string;
  type: "Receipt" | "Payment";
  bankCashLedger: string;
  paymentMode: "Cash" | "Cheque / DD" | "NEFT / RTGS" | "Credit Card / EDC" | "UPI / QR";
  instrumentNo?: string;
  partyName: string;
  accountLedger: string;
  amount: number;
  narration: string;
  status: "Posted" | "Draft" | "Cancelled";
}

export const sampleBankCashLedgers = [
  "YES BANK A/c #9012",
  "HDFC Bank Operating A/c #4401",
  "Cash in Hand - Front Desk",
  "Petty Cash - Accounts Dept",
  "ICICI Bank Collection A/c #1029",
];

export const sampleOppositeLedgers = [
  "Room Sales Revenue",
  "Food & Beverage Revenue",
  "City Ledger Debtors (Guest AR)",
  "Accounts Payable - Fresh Foods Ltd",
  "Accounts Payable - CleanLinen Co.",
  "Electricity & Utility Expense",
  "Staff Salary & Wages",
  "Laundry & Housekeeping Supplies",
  "Banquet Event Advance",
];

export const samplePaymentModes = [
  "Cash",
  "Cheque / DD",
  "NEFT / RTGS",
  "Credit Card / EDC",
  "UPI / QR",
];

// Exactly 9 clean, realistic recent GL Receipt & Payment transactions
export const sampleGLReceiptsPaymentsData: GLReceiptPaymentVoucher[] = [
  {
    id: "rp-001",
    vouchNo: "RCP-2026-0042",
    vouchDt: "28/04/2026",
    type: "Receipt",
    bankCashLedger: "YES BANK A/c #9012",
    paymentMode: "Credit Card / EDC",
    instrumentNo: "EDC-TXN-99120",
    partyName: "Guest Folio #1042 - Mr. Rajesh Kumar",
    accountLedger: "Room Sales Revenue",
    amount: 45000,
    narration: "Room settlement received via YES BANK EDC POS terminal",
    status: "Posted",
  },
  {
    id: "rp-002",
    vouchNo: "RCP-2026-0043",
    vouchDt: "28/04/2026",
    type: "Receipt",
    bankCashLedger: "HDFC Bank Operating A/c #4401",
    paymentMode: "NEFT / RTGS",
    instrumentNo: "UTR-882910485",
    partyName: "MakeMyTrip India Pvt Ltd",
    accountLedger: "City Ledger Debtors (Guest AR)",
    amount: 65000,
    narration: "Corporate booking deposit received via NEFT transfer",
    status: "Posted",
  },
  {
    id: "rp-003",
    vouchNo: "PAY-2026-0089",
    vouchDt: "28/04/2026",
    type: "Payment",
    bankCashLedger: "YES BANK A/c #9012",
    paymentMode: "NEFT / RTGS",
    instrumentNo: "NEFT-77120938",
    partyName: "Fresh Foods Supplies Ltd",
    accountLedger: "Accounts Payable - Fresh Foods Ltd",
    amount: 35000,
    narration: "Vendor bill settlement for April fresh food & vegetable supplies",
    status: "Posted",
  },
  {
    id: "rp-004",
    vouchNo: "RCP-2026-0044",
    vouchDt: "27/04/2026",
    type: "Receipt",
    bankCashLedger: "Cash in Hand - Front Desk",
    paymentMode: "Cash",
    partyName: "Restaurant Guest - Walk-in Table #12",
    accountLedger: "Food & Beverage Revenue",
    amount: 18500,
    narration: "Cash settlement for F&B dining invoice",
    status: "Posted",
  },
  {
    id: "rp-005",
    vouchNo: "PAY-2026-0090",
    vouchDt: "27/04/2026",
    type: "Payment",
    bankCashLedger: "HDFC Bank Operating A/c #4401",
    paymentMode: "Cheque / DD",
    instrumentNo: "CHQ-991204",
    partyName: "CleanLinen Laundry Co.",
    accountLedger: "Accounts Payable - CleanLinen Co.",
    amount: 25000,
    narration: "Laundry service charges paid via cheque",
    status: "Posted",
  },
  {
    id: "rp-006",
    vouchNo: "PAY-2026-0091",
    vouchDt: "26/04/2026",
    type: "Payment",
    bankCashLedger: "YES BANK A/c #9012",
    paymentMode: "NEFT / RTGS",
    instrumentNo: "NEFT-11029481",
    partyName: "State Electricity Distribution Board",
    accountLedger: "Electricity & Utility Expense",
    amount: 18500,
    narration: "Monthly utility power bill payment",
    status: "Posted",
  },
  {
    id: "rp-007",
    vouchNo: "RCP-2026-0045",
    vouchDt: "26/04/2026",
    type: "Receipt",
    bankCashLedger: "YES BANK A/c #9012",
    paymentMode: "UPI / QR",
    instrumentNo: "UPI-PAY-441209",
    partyName: "Agoda International",
    accountLedger: "Banquet Event Advance",
    amount: 43000,
    narration: "Banquet hall advance booking deposit via UPI",
    status: "Posted",
  },
  {
    id: "rp-008",
    vouchNo: "PAY-2026-0092",
    vouchDt: "25/04/2026",
    type: "Payment",
    bankCashLedger: "Petty Cash - Accounts Dept",
    paymentMode: "Cash",
    partyName: "Front Desk Staff",
    accountLedger: "Staff Salary & Wages",
    amount: 12000,
    narration: "Petty cash reimbursement for staff travel & transport",
    status: "Posted",
  },
  {
    id: "rp-009",
    vouchNo: "RCP-2026-0046",
    vouchDt: "25/04/2026",
    type: "Receipt",
    bankCashLedger: "Cash in Hand - Front Desk",
    paymentMode: "Cash",
    partyName: "Guest Folio #1088 - Ms. Anita Sharma",
    accountLedger: "Room Sales Revenue",
    amount: 22000,
    narration: "Express check-out cash room payment",
    status: "Posted",
  },
];
