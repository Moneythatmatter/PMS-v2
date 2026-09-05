export interface GLAccountOption {
  id: string;
  code: string;
  name: string;
  category: string;
}

export const standardGLAccountOptions: Record<
  "receivables" | "payables" | "roundOff" | "guestDeposit",
  GLAccountOption[]
> = {
  receivables: [
    { id: "1195", code: "1195", name: "1195 - SUNDRY DEBTORS", category: "Current Assets" },
    { id: "1140", code: "1140", name: "1140 - TRADE DEBTORS (CORPORATE)", category: "Current Assets" },
    { id: "1141", code: "1141", name: "1141 - GUEST LEDGER AR", category: "Current Assets" },
    { id: "1142", code: "1142", name: "1142 - TRAVEL AGENTS AR", category: "Current Assets" },
  ],
  payables: [
    { id: "2410", code: "2410", name: "2410 - Sundry Creditors", category: "Current Liabilities" },
    { id: "2411", code: "2411", name: "2411 - TRADE PAYABLES (F&B / STORES)", category: "Current Liabilities" },
    { id: "2412", code: "2412", name: "2412 - EXPENSE CREDITORS & CONTRACTORS", category: "Current Liabilities" },
  ],
  roundOff: [
    { id: "2600", code: "2600", name: "2600 - ROUND OFF A/C", category: "Indirect Expenses / Income" },
    { id: "4290", code: "4290", name: "4290 - MISC EXPENSE ROUND OFF", category: "Indirect Expenses" },
  ],
  guestDeposit: [
    { id: "1150", code: "1150", name: "1150 - GUEST SECURITY DEPOSITS", category: "Current Liabilities" },
    { id: "2450", code: "2450", name: "2450 - ADVANCE GUEST RESERVATION DEPOSITS", category: "Current Liabilities" },
    { id: "1151", code: "1151", name: "1151 - BANQUET EVENT ADVANCE DEPOSITS", category: "Current Liabilities" },
  ],
};

export interface CompanySettingsModel {
  companyCode: string;
  companyName: string;
  
  // Read-only Reference Identifiers
  baseCurrencyId: string;
  currentFiscalYearId: string;

  // 1. General & Accounting Preferences
  accountingMethod: "Accrual" | "Cash";
  decimalPlaces: number;
  allowFutureTransactions: boolean;
  allowBackDatedPosting: boolean;
  backDatedLimitDays: number;
  lockDateBefore: string;
  requireVoucherApproval: boolean;

  // 2. Voucher Numbering Controls
  autoVoucherNumbering: boolean;
  voucherResetFrequency: "Annually" | "Monthly" | "Never";
  allowManualVoucherNo: boolean;
  preventDuplicateVouchers: boolean;
  requirePostingApproval: boolean;
  paymentPrefix: string;
  paymentStartNo: string;
  receiptPrefix: string;
  receiptStartNo: string;
  journalPrefix: string;
  journalStartNo: string;
  contraPrefix: string;
  contraStartNo: string;

  // 3. General Ledger & Credit Controls
  allowNegativeCash: "Warn" | "Block" | "Allow";
  enforceCreditLimit: "Warn Only" | "Block Transaction" | "Ignore";
  defaultReceivableAcc: string;
  defaultPayableAcc: string;
  defaultRoundOffAcc: string;
  defaultGuestDepositAcc: string;

  // 4. Tax & Statutory Configurations (High-Level Company-Wide)
  enableGst: boolean;
  enableEInvoicing: boolean;
  defaultTaxRegion: string;
  enableTdsDeductions: boolean;

  // Audit Info
  lastAuditDate: string;
  configuredBy: string;
}

export const initialCompanySettings: CompanySettingsModel = {
  companyCode: "CMP-001",
  companyName: "HOTEL & RESORTS PRIVATE LIMITED",
  
  baseCurrencyId: "INR",
  currentFiscalYearId: "FY 2026-27",

  // 1. General & Accounting
  accountingMethod: "Accrual",
  decimalPlaces: 2,
  allowFutureTransactions: false,
  allowBackDatedPosting: true,
  backDatedLimitDays: 30,
  lockDateBefore: "31/03/2026",
  requireVoucherApproval: true,

  // 2. Voucher Controls
  autoVoucherNumbering: true,
  voucherResetFrequency: "Annually",
  allowManualVoucherNo: false,
  preventDuplicateVouchers: true,
  requirePostingApproval: true,
  paymentPrefix: "PAY-2026-",
  paymentStartNo: "0001",
  receiptPrefix: "RCP-2026-",
  receiptStartNo: "0001",
  journalPrefix: "VCH-2026-",
  journalStartNo: "0001",
  contraPrefix: "CTR-2026-",
  contraStartNo: "0001",

  // 3. GL & Credit Policy
  allowNegativeCash: "Warn",
  enforceCreditLimit: "Block Transaction",
  defaultReceivableAcc: "1195 - SUNDRY DEBTORS",
  defaultPayableAcc: "2410 - Sundry Creditors",
  defaultRoundOffAcc: "2600 - ROUND OFF A/C",
  defaultGuestDepositAcc: "1150 - GUEST SECURITY DEPOSITS",

  // 4. Tax & Statutory
  enableGst: true,
  enableEInvoicing: true,
  defaultTaxRegion: "Gujarat (24)",
  enableTdsDeductions: true,

  // Audit Info
  lastAuditDate: "Today (Configured)",
  configuredBy: "Accounts Administrator",
};
