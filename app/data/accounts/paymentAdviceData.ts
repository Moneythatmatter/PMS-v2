export interface SettledInvoiceDetail {
  invoiceNo: string;
  invoiceDt: string;
  billAmt: number;
  deductions: number;
  netPaidAmt: number;
}

export interface PaymentAdviceItem {
  id: string;
  vouchNo: string;
  vouchDt: string;
  chqNo: string;
  chqDt: string;
  chqAmt: number;
  groupName: "SUNDRY CREDITORS" | "SUNDRY DEBTORS" | "CREDIT CARD COMPANY";
  voucherType: "Payments" | "Bank Payments" | "Cash Payments";
  supplierName: string;
  supplierAddress: string;
  supplierGstin?: string;
  bankName: string;
  preparedBy: string;
  selected: boolean;
  settledInvoices: SettledInvoiceDetail[];
}

export const samplePaymentAdviceGroups = [
  "All Groups",
  "SUNDRY CREDITORS",
  "SUNDRY DEBTORS",
  "CREDIT CARD COMPANY",
];

export const sampleVoucherTypesList = [
  "Payments",
  "Bank Payments",
  "Cash Payments",
  "All Types",
];

export const samplePaymentAdviceData: PaymentAdviceItem[] = [
  {
    id: "pa-101",
    vouchNo: "PYM-2026-0301",
    vouchDt: "15/07/2026",
    chqNo: "CHQ-44012",
    chqDt: "15/07/2026",
    chqAmt: 50000,
    groupName: "SUNDRY CREDITORS",
    voucherType: "Payments",
    supplierName: "AMAAN AGENCY",
    supplierAddress: "Shop 12, APMC Market, Station Road, Bharuch, Gujarat 392001",
    supplierGstin: "24AABCA1234F1ZP",
    bankName: "ICICI Bank Ltd (A/C: 001205009912)",
    preparedBy: "Accounts Exec (Jay)",
    selected: true,
    settledInvoices: [
      {
        invoiceNo: "BILL-2026-0044",
        invoiceDt: "05/07/2026",
        billAmt: 50000,
        deductions: 0,
        netPaidAmt: 50000,
      },
    ],
  },
  {
    id: "pa-102",
    vouchNo: "PYM-2026-0340",
    vouchDt: "18/07/2026",
    chqNo: "NEFT-99120",
    chqDt: "18/07/2026",
    chqAmt: 85000,
    groupName: "SUNDRY CREDITORS",
    voucherType: "Bank Payments",
    supplierName: "FRESH FOODS SUPPLIES LTD",
    supplierAddress: "Plot 88, GIDC Industrial Estate, Ankleshwar, Gujarat 393002",
    supplierGstin: "24AAACF9988G1ZQ",
    bankName: "HDFC Bank Ltd (A/C: 502000112233)",
    preparedBy: "Accounts Exec (Jay)",
    selected: true,
    settledInvoices: [
      {
        invoiceNo: "BILL-2026-0089",
        invoiceDt: "01/07/2026",
        billAmt: 85000,
        deductions: 0,
        netPaidAmt: 85000,
      },
    ],
  },
  {
    id: "pa-103",
    vouchNo: "PYM-2026-0412",
    vouchDt: "22/07/2026",
    chqNo: "CHQ-66019",
    chqDt: "22/07/2026",
    chqAmt: 62000,
    groupName: "SUNDRY CREDITORS",
    voucherType: "Payments",
    supplierName: "APEX LINEN & LAUNDRY SERVICES",
    supplierAddress: "Survey 41, GIDC Dahej Phase 1, Dahej, Bharuch 392130",
    supplierGstin: "24AABCA9911D1ZR",
    bankName: "State Bank of India (A/C: 3300112244)",
    preparedBy: "Senior Accountant",
    selected: false,
    settledInvoices: [
      {
        invoiceNo: "BILL-2026-0290",
        invoiceDt: "05/07/2026",
        billAmt: 62000,
        deductions: 0,
        netPaidAmt: 62000,
      },
    ],
  },
];
