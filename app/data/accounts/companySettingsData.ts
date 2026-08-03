export interface CompanySettingsModel {
  companyCode: string;
  companyName: string;
  financialYear: string;
  
  // General & Accounting Preferences
  fiscalStartMonth: string;
  currency: string;
  currencySymbol: string;
  decimalPlaces: number;
  accountingMethod: "Accrual" | "Cash";
  allowFutureTransactions: boolean;
  allowBackDatedPosting: boolean;
  backDatedLimitDays: number;
  lockDateBefore: string;
  requireVoucherApproval: boolean;

  // Voucher Numbering Controls
  autoVoucherNumbering: boolean;
  voucherResetFrequency: "Annually" | "Monthly" | "Never";
  paymentPrefix: string;
  paymentStartNo: string;
  receiptPrefix: string;
  receiptStartNo: string;
  journalPrefix: string;
  journalStartNo: string;
  contraPrefix: string;
  contraStartNo: string;

  // General Ledger & Credit Controls
  strictDoubleEntry: boolean;
  allowNegativeCash: "Allow" | "Warn" | "Block";
  enforceCreditLimit: "Warn Only" | "Block Transaction" | "Ignore";
  defaultReceivableAcc: string;
  defaultPayableAcc: string;
  defaultRoundOffAcc: string;

  // Tax Configurations
  enableGst: boolean;
  defaultTaxRegion: string;
  autoTdsVendorPayments: boolean;
  tdsThresholdAmount: number;
  enableTcs: boolean;
  ewayBillThreshold: number;

  // Hotel & Property Operational Settings
  autoPostRoomRevenue: boolean;
  autoPostPosSales: boolean;
  cityLedgerAutoTransfer: boolean;
  defaultGuestDepositAcc: string;
  enableCostCenterAllocations: boolean;

  // Audit Info
  lastAuditDate: string;
  configuredBy: string;
}

export const initialCompanySettings: CompanySettingsModel = {
  companyCode: "CMP-001",
  companyName: "LUXY HOTEL & RESORTS PRIVATE LIMITED",
  financialYear: "01/04/2026 - 31/03/2027",

  fiscalStartMonth: "April",
  currency: "INR",
  currencySymbol: "₹",
  decimalPlaces: 2,
  accountingMethod: "Accrual",
  allowFutureTransactions: false,
  allowBackDatedPosting: true,
  backDatedLimitDays: 30,
  lockDateBefore: "31/03/2026",
  requireVoucherApproval: true,

  autoVoucherNumbering: true,
  voucherResetFrequency: "Annually",
  paymentPrefix: "PAY-2026-",
  paymentStartNo: "0001",
  receiptPrefix: "RCP-2026-",
  receiptStartNo: "0001",
  journalPrefix: "VCH-2026-",
  journalStartNo: "0001",
  contraPrefix: "CTR-2026-",
  contraStartNo: "0001",

  strictDoubleEntry: true,
  allowNegativeCash: "Warn",
  enforceCreditLimit: "Block Transaction",
  defaultReceivableAcc: "1195 - SUNDRY DEBTORS",
  defaultPayableAcc: "2410 - Sundry Creditors",
  defaultRoundOffAcc: "2600 - ROUND OFF",

  enableGst: true,
  defaultTaxRegion: "Gujarat (24)",
  autoTdsVendorPayments: true,
  tdsThresholdAmount: 30000,
  enableTcs: false,
  ewayBillThreshold: 50000,

  autoPostRoomRevenue: true,
  autoPostPosSales: true,
  cityLedgerAutoTransfer: true,
  defaultGuestDepositAcc: "1150 - DEPOSITS",
  enableCostCenterAllocations: true,

  lastAuditDate: "31/07/2026 17:45",
  configuredBy: "Accounts Admin (Jay)",
};
