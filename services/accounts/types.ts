/** Accounts API types — mirror the backend responses from /api/accounts (all ids are UUID strings). */

export type Status = "Active" | "Inactive";
export type AccountNature = "Asset" | "Liability" | "Income" | "Expense";
export type ModuleType = "AR" | "AP";
export type VoucherStatus = "Draft" | "Posted" | "Provisional" | "Converted" | "Reversed";
export type VoucherCategory =
  | "Journal" | "Receipt" | "Payment" | "Contra" | "Sales" | "Purchase" | "Credit Note" | "Debit Note" | "Opening";

type Audit = { createdAt: string; updatedAt: string; createdBy?: string | null; updatedBy?: string | null };

// ---------------------------------------------------------------------------
// Masters
// ---------------------------------------------------------------------------

export type Currency = Audit & {
  id: string;
  code: string;
  name: string;
  symbol: string;
  country: string;
  decimalPlaces: number;
  isBaseCurrency: boolean;
  exchangeRateToBase: number;
  rateEffectiveDate: string | null;
  rateSource: string;
  foreignTransactionsAllowed: boolean;
  status: Status;
};

export type Company = Audit & {
  id: string;
  companyCode: string;
  tradeName: string;
  legalName: string;
  alias: string;
  companyType: string;
  businessNature: string;
  status: Status;
  logoUrl: string | null;
  addressLine1: string;
  addressLine2: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  country: string;
  primaryContact: string;
  mobile: string;
  telephone: string;
  email: string;
  website: string;
  gstNumber: string;
  panNumber: string;
  tanNumber: string;
  cinNumber: string;
  msmeNumber: string;
  registrationDate: string | null;
  taxRegion: string;
  gstApplicable: boolean;
  baseCurrencyId: string | null;
  baseCurrencyCode: string | null;
};

export type CompanySettings = {
  id: string;
  companyId: string;
  companyName: string;
  companyCode: string;
  currentFiscalYearId: string | null;
  accountingMethod: "Accrual" | "Cash";
  decimalPlaces: number;
  allowFutureTransactions: boolean;
  allowBackDatedPosting: boolean;
  backDatedLimitDays: number;
  lockDateBefore: string | null;
  requireVoucherApproval: boolean;
  autoVoucherNumbering: boolean;
  voucherResetFrequency: string;
  allowManualVoucherNo: boolean;
  preventDuplicateVouchers: boolean;
  requirePostingApproval: boolean;
  allowNegativeCash: boolean;
  enforceCreditLimit: boolean;
  defaultReceivableAccountId: string | null;
  defaultPayableAccountId: string | null;
  defaultRoundOffAccountId: string | null;
  defaultGuestDepositAccountId: string | null;
  enableGst: boolean;
  enableEinvoice: boolean;
  defaultTaxRegion: string;
  enableTdsDeductions: boolean;
  lastAuditDate: string | null;
  configuredBy: string | null;
  updatedAt: string;
};

export type FiscalYearAuditLog = { id: string; action: string; actor: string | null; reason: string | null; at: string };

export type FiscalYear = Audit & {
  id: string;
  companyId: string | null;
  fiscalYearName: string;
  fyCode: string;
  startDate: string;
  endDate: string;
  status: "Upcoming" | "Open" | "Closed";
  isCurrent: boolean;
  carryForwardBalanceSheet: boolean;
  carryForwardCustomers: boolean;
  carryForwardVendors: boolean;
  transferPnlToRetainedEarnings: boolean;
  retainedEarningsAccountId: string | null;
  openedAt: string | null;
  openedBy: string | null;
  closedAt: string | null;
  closedBy: string | null;
  reopenedAt: string | null;
  reopenedBy: string | null;
  reopenReason: string | null;
  totalPeriods: number;
  closedPeriods: number;
  voucherCount: number;
  auditLogs: FiscalYearAuditLog[];
};

export type PeriodChecks = {
  unpostedVouchers: number;
  trialBalanceDifference: number;
  trialBalanced: boolean;
  unreconciledBankLines: number;
  pendingClosingStock: number;
  postedVouchers: number;
  totalDebit: number;
  totalCredit: number;
};

export type FiscalPeriod = {
  id: string;
  fiscalYearId: string;
  fiscalYearName: string;
  fiscalYearStatus: FiscalYear["status"];
  periodNo: number;
  periodCode: string;
  periodName: string;
  startDate: string;
  endDate: string;
  status: "Open" | "Closed";
  closedAt: string | null;
  closedBy: string | null;
  reopenedAt: string | null;
  reopenedBy: string | null;
  reopenReason: string | null;
  checks: PeriodChecks;
};

export type Account = Audit & {
  id: string;
  parentId: string | null;
  parentName: string | null;
  parentCode: string | null;
  code: string;
  name: string;
  accountType: "Group" | "Ledger";
  nature: AccountNature;
  reportSection: string;
  category: string;
  classification: string;
  description: string;
  allowPosting: boolean;
  isSystemAccount: boolean;
  isBankAccount: boolean;
  isCashAccount: boolean;
  bankAccountNo: string;
  bankIfsc: string;
  status: Status;
  level: number;
  childCount: number;
  transactionCount: number;
};

export type AccountTreeNode = Omit<Account, "parentName" | "parentCode" | "childCount"> & {
  debit: number;
  credit: number;
  net: number;
  balance: number;
  balanceSide: "Dr" | "Cr";
  children: AccountTreeNode[];
};

export type Division = Audit & {
  id: string;
  companyId: string | null;
  parentDivisionId: string | null;
  parentDivisionName: string | null;
  divisionCode: string;
  divisionName: string;
  shortName: string;
  divisionType: string;
  sequence: number;
  description: string;
  status: Status;
  transactionCount: number;
};

export type PartyType = Audit & {
  id: string;
  typeCode: string;
  typeName: string;
  description: string;
  sequence: number;
  status: Status;
  subTypeCount: number;
  partyCount: number;
};

export type PartySubType = Audit & {
  id: string;
  partyTypeId: string;
  partyTypeName: string | null;
  partyTypeCode: string | null;
  subTypeCode: string;
  subTypeName: string;
  description: string;
  sequence: number;
  status: Status;
  partyCount: number;
};

export type PaymentMethod = Audit & {
  id: string;
  companyId: string | null;
  accountId: string | null;
  accountName: string | null;
  paymentMethodCode: string;
  paymentMethodName: string;
  methodType: string;
  referenceRequired: boolean;
  description: string;
  status: Status;
  transactionCount: number;
};

export type Party = Audit & {
  id: string;
  partyCode: string;
  partyName: string;
  shortName: string;
  partyTypeId: string | null;
  partyTypeName: string | null;
  partyTypeCode: string | null;
  partySubTypeId: string | null;
  partySubTypeName: string | null;
  partyGroup: string;
  entityType: string;
  email: string;
  phone: string;
  alternatePhone: string;
  website: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  contactPersonName: string;
  contactPersonPhone: string;
  contactPersonEmail: string;
  contactPersonDesignation: string;
  panNumber: string;
  gstin: string;
  gstRegistrationType: string;
  tanNumber: string;
  msmeNumber: string;
  msmeType: string;
  currencyId: string | null;
  currencyCode: string | null;
  creditDays: number;
  creditLimit: number;
  paymentMethodId: string | null;
  paymentMethodName: string | null;
  bankName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  bankBranch: string;
  bankAccountType: string;
  receivableAccountId: string | null;
  receivableAccountName: string | null;
  payableAccountId: string | null;
  payableAccountName: string | null;
  remarks: string;
  status: "Active" | "Inactive" | "Blocked";
  outstandingReceivable: number;
  outstandingPayable: number;
  outstandingBalance: number;
  openBillsCount: number;
};

export type VoucherType = Audit & {
  id: string;
  companyId: string | null;
  voucherTypeName: string;
  shortCode: string;
  category: VoucherCategory;
  sequence: number;
  numberingMethod: "Automatic" | "Manual";
  prefixTemplate: string;
  startingNumber: number;
  numberPadding: number;
  resetFrequency: "Never" | "Yearly" | "Monthly";
  defaultEntryNature: "Debit" | "Credit" | "None";
  partyRequired: boolean;
  divisionRequired: boolean;
  isSystem: boolean;
  status: Status;
  transactionCount: number;
  lastVoucherNo: string | null;
};

export type RevenueCategory = Audit & {
  id: string;
  companyId: string | null;
  incomeAccountId: string | null;
  incomeAccountName: string | null;
  revenueCategoryCode: string;
  revenueCategoryName: string;
  description: string;
  status: Status;
  ruleCount: number;
};

export type TaxDefinition = Audit & {
  id: string;
  companyId: string | null;
  outputAccountId: string | null;
  outputAccountName: string | null;
  taxCode: string;
  taxName: string;
  taxType: string;
  rate: number;
  calculationType: "Percentage" | "Fixed";
  hsnSacCode: string;
  description: string;
  status: Status;
  ruleCount: number;
};

export type TaxRule = Audit & {
  id: string;
  companyId: string | null;
  taxId: string;
  taxName: string | null;
  taxCode: string | null;
  taxRate: number | null;
  revenueCategoryId: string | null;
  revenueCategoryName: string | null;
  divisionId: string | null;
  divisionName: string | null;
  taxRuleCode: string;
  taxRuleName: string;
  applicabilityType: string;
  serviceType: string;
  minimumAmount: number | null;
  maximumAmount: number | null;
  priority: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  description: string;
  status: Status;
};

export type Budget = {
  id: string;
  fiscalYearId: string;
  divisionId: string;
  divisionName: string | null;
  divisionCode: string | null;
  budgetAmount: number;
  remarks: string;
};

export type ClosingStockItem = {
  id: string;
  valuationDate: string;
  storeName: string;
  valuationMethod: string;
  itemCode: string;
  itemName: string;
  category: string;
  uom: string;
  sysQty: number;
  physicalQty: number;
  unitRate: number;
  prevPeriodValue: number;
  stockAccountId: string | null;
  stockAccountName: string | null;
  consumptionAccountId: string | null;
  consumptionAccountName: string | null;
  status: "Draft" | "Audited" | "GL Posted";
  lastAuditDate: string | null;
  voucherId: string | null;
  totalValuation: number;
  varianceQty: number;
  varianceValue: number;
  changeFromPrev: number;
  createdAt: string;
  updatedAt: string;
};

export type AuditLog = {
  id: string;
  entityType: string;
  entityId: string | null;
  action: string;
  actor: string | null;
  reason: string | null;
  details: Record<string, unknown>;
  createdAt: string;
};

export type Lookups = {
  accounts: Pick<Account, "id" | "code" | "name" | "parentId" | "accountType" | "nature" | "category" | "reportSection" | "isBankAccount" | "isCashAccount" | "allowPosting">[];
  ledgers: Pick<Account, "id" | "code" | "name" | "nature" | "category" | "isBankAccount" | "isCashAccount">[];
  bankCashAccounts: Pick<Account, "id" | "code" | "name" | "isBankAccount" | "isCashAccount">[];
  parties: Pick<Party, "id" | "partyCode" | "partyName" | "partyGroup" | "partyTypeId" | "receivableAccountId" | "payableAccountId" | "creditDays" | "status">[];
  divisions: Pick<Division, "id" | "divisionCode" | "divisionName" | "parentDivisionId">[];
  voucherTypes: Pick<VoucherType, "id" | "voucherTypeName" | "shortCode" | "category" | "partyRequired" | "divisionRequired" | "numberingMethod">[];
  paymentMethods: Pick<PaymentMethod, "id" | "paymentMethodCode" | "paymentMethodName" | "methodType" | "referenceRequired" | "accountId">[];
  currencies: Pick<Currency, "id" | "code" | "name" | "symbol" | "isBaseCurrency">[];
  fiscalYears: Pick<FiscalYear, "id" | "fiscalYearName" | "fyCode" | "startDate" | "endDate" | "status" | "isCurrent">[];
  partyTypes: Pick<PartyType, "id" | "typeCode" | "typeName">[];
  partySubTypes: Pick<PartySubType, "id" | "partyTypeId" | "subTypeCode" | "subTypeName">[];
  companies: Pick<Company, "id" | "companyCode" | "tradeName" | "legalName" | "status">[];
  taxes: Pick<TaxDefinition, "id" | "taxCode" | "taxName" | "rate">[];
  revenueCategories: Pick<RevenueCategory, "id" | "revenueCategoryCode" | "revenueCategoryName">[];
};

// ---------------------------------------------------------------------------
// Vouchers
// ---------------------------------------------------------------------------

export type EntryType = "Dr" | "Cr";

export type VoucherLine = {
  id: string;
  voucherId: string;
  lineNo: number;
  accountId: string;
  accountCode: string | null;
  accountName: string | null;
  partyId: string | null;
  partyName: string | null;
  divisionId: string | null;
  divisionName: string | null;
  entryType: EntryType;
  amount: number;
  /** Derived from entryType + amount. */
  debit: number;
  credit: number;
  chequeNo: string;
  chequeDate: string | null;
  gstRate: number | null;
  reconciled: boolean;
  reconDate: string | null;
};

export type Voucher = {
  id: string;
  voucherNo: string;
  voucherDate: string;
  voucherTypeId: string;
  voucherTypeName: string | null;
  voucherTypeCode: string | null;
  voucherCategory: VoucherCategory;
  fiscalYearId: string | null;
  fiscalYearName: string | null;
  fiscalPeriodId: string | null;
  referenceNo: string;
  narration: string;
  status: VoucherStatus;
  isProvisional: boolean;
  provisionalCategory: string | null;
  provisionalType: string | null;
  expiryDate: string | null;
  convertedVoucherId: string | null;
  partyId: string | null;
  partyName: string | null;
  divisionId: string | null;
  divisionName: string | null;
  bankCashAccountId: string | null;
  bankCashAccountName: string | null;
  paymentMethodId: string | null;
  paymentMethodName: string | null;
  instrumentNo: string;
  instrumentDate: string | null;
  totalAmount: number;
  sourceModule: string;
  preparedBy: string | null;
  postedAt: string | null;
  postedBy: string | null;
  reversedAt: string | null;
  reversedBy: string | null;
  reversalReason: string | null;
  reprintCount: number;
  lastPrintedAt: string | null;
  createdAt: string;
  debitAccounts: string;
  creditAccounts: string;
  lines: VoucherLine[];
};

export type VoucherDetail = Voucher & {
  allocations: {
    id: string;
    billId: string;
    billNo: string | null;
    billDate: string | null;
    billAmount: number | null;
    amount: number;
    deductions: number;
    settlementDate: string;
    trnType: string;
  }[];
  bills: PartyBill[];
  auditLogs: AuditLog[];
};

/** The line party is derived server-side from the voucher-level partyId. */
export type VoucherLineInput = {
  accountId: string;
  entryType: EntryType;
  amount: number;
  divisionId?: string | null;
  chequeNo?: string;
  chequeDate?: string | null;
  gstRate?: number | null;
};

export type BillAllocationInput = { billId: string; amount: number; deductions?: number };

export type NewBillInput = {
  moduleType: ModuleType;
  refType?: string;
  billNo: string;
  billDate?: string;
  dueDate?: string;
  amount?: number;
  details?: string;
  partyId?: string;
  divisionId?: string | null;
};

export type VoucherInput = {
  voucherTypeId?: string;
  voucherTypeCode?: string;
  voucherNo?: string;
  voucherDate: string;
  referenceNo?: string;
  narration?: string;
  status?: "Draft" | "Posted" | "Provisional";
  partyId?: string | null;
  divisionId?: string | null;
  bankCashAccountId?: string | null;
  paymentMethodId?: string | null;
  instrumentNo?: string;
  instrumentDate?: string | null;
  provisionalCategory?: string | null;
  provisionalType?: string | null;
  expiryDate?: string | null;
  lines: VoucherLineInput[];
  billAllocations?: BillAllocationInput[];
  newBill?: NewBillInput | null;
};

export type ReceiptPaymentInput = {
  type: "Receipt" | "Payment";
  voucherTypeId?: string;
  voucherDate: string;
  bankCashAccountId: string;
  paymentMethodId?: string | null;
  instrumentNo?: string;
  instrumentDate?: string | null;
  referenceNo?: string;
  narration?: string;
  partyId?: string | null;
  status?: "Draft" | "Posted";
  lines: { accountId: string; divisionId?: string | null; amount: number; billId?: string | null }[];
};

export type VoucherQuery = {
  from?: string;
  to?: string;
  status?: string;
  category?: string;
  voucherTypeId?: string;
  partyId?: string;
  bankCashAccountId?: string;
  provisional?: boolean;
  fiscalYearId?: string;
  search?: string;
  limit?: number;
  /** "recent" orders by entry time (newest first) instead of voucher date. */
  sort?: "recent";
};

export type BankReconEntry = {
  id: string;
  voucherId: string;
  voucherNo: string;
  voucherDate: string;
  voucherCategory: VoucherCategory;
  narration: string;
  referenceNo: string;
  instrumentNo: string;
  instrumentDate: string | null;
  partyName: string | null;
  debit: number;
  credit: number;
  reconciled: boolean;
  reconDate: string | null;
  reconciledBy: string | null;
  reconciledAt: string | null;
};

export type BankReconciliation = {
  bankAccounts: { id: string; code: string; name: string; bankAccountNo: string; bankIfsc: string }[];
  account: { id: string; code: string; name: string; bankAccountNo: string; bankIfsc: string } | null;
  asOn: string;
  entries: BankReconEntry[];
  summary: {
    bookBalance: number;
    balanceAsPerBank: number;
    unreconciledDebit: number;
    unreconciledCredit: number;
    unreconciledCount: number;
    difference: number;
  } | null;
};

// ---------------------------------------------------------------------------
// Bills
// ---------------------------------------------------------------------------

export type BillSettlement = {
  id: string;
  billId: string;
  voucherId: string | null;
  voucherNo?: string | null;
  settlementDate: string;
  trnType: string;
  amount: number;
  deductions: number;
  referenceNo: string;
  remarks: string;
  createdBy: string | null;
};

export type PartyBill = {
  id: string;
  partyId: string;
  partyName: string | null;
  partyCode: string | null;
  partyGroup: string | null;
  moduleType: ModuleType;
  refType: string;
  billNo: string;
  billDate: string;
  dueDate: string;
  amount: number;
  details: string;
  voucherId: string | null;
  divisionId: string | null;
  status: "Open" | "Cancelled";
  remarks: string;
  settledAmount: number;
  balance: number;
  overdueDays: number;
  billAgeDays: number;
  settlementStatus: "Unpaid" | "Partial" | "Settled";
  settlements: BillSettlement[];
  coveringLetterNo?: string | null;
  createdAt: string;
};

export type CoveringLetter = {
  id: string;
  letterNo: string;
  letterDate: string;
  partyId: string;
  partyName: string | null;
  partyCode: string | null;
  partyGroup: string | null;
  partyAddress: string;
  partyGstin: string;
  contactPersonName: string;
  status: "Active" | "Reversed";
  totalAmount: number;
  billsCount: number;
  preparedBy: string | null;
  remarks: string;
  reversedAt: string | null;
  reversedBy: string | null;
  reversalReason: string | null;
  bills: { id: string; billId: string; billNo: string | null; billDate: string | null; dueDate: string | null; details: string; amount: number }[];
};

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export type DrCr = { amount: number; side: "Dr" | "Cr"; net: number };

export type TrialBalanceRow = {
  accountId: string;
  parentId: string | null;
  code: string;
  name: string;
  accountType: "Group" | "Ledger";
  nature: AccountNature;
  level: number;
  openingDebit: number;
  openingCredit: number;
  debit: number;
  credit: number;
  closingDebit: number;
  closingCredit: number;
};

export type TrialBalanceReport = {
  from: string;
  to: string;
  rows: TrialBalanceRow[];
  totals: { openingDebit: number; openingCredit: number; debit: number; credit: number; closingDebit: number; closingCredit: number };
  balanced: boolean;
  difference: number;
};

export type PnlSection = {
  section: "Direct Income" | "Indirect Income" | "Direct Expenses" | "Indirect Expenses";
  accounts: { accountId: string; code: string; name: string; category: string; amount: number; previousAmount: number }[];
  total: number;
  previousTotal: number;
};

export type PnlSummary = {
  totalRevenue: number;
  directIncome: number;
  indirectIncome: number;
  directExpenses: number;
  indirectExpenses: number;
  totalExpenses: number;
  grossProfit: number;
  grossMargin: number;
  operatingProfit: number;
  financeCosts: number;
  netProfit: number;
  netMargin: number;
  previousNetProfit: number;
  netProfitChange: number;
  roomRevenue: number;
  foodRevenue: number;
  beverageRevenue: number;
  banquetRevenue: number;
  otherOperatingRevenue: number;
  otherIncome: number;
  costOfSales: number;
  payroll: number;
  utilities: number;
  repairsMaintenance: number;
  salesMarketing: number;
  administrative: number;
  commission: number;
};

export type MonthlyPnl = { month: string; income: number; expense: number; net: number };
export type DivisionPnl = { divisionId: string | null; divisionName: string; income: number; expense: number; net: number };

export type ProfitLossReport = {
  from: string;
  to: string;
  compareFrom: string;
  compareTo: string;
  sections: PnlSection[];
  summary: PnlSummary;
  categories: { category: string; nature: AccountNature; amount: number }[];
  monthly: MonthlyPnl[];
  divisions: DivisionPnl[];
};

export type BalanceSheetSection = {
  section: string;
  groups: {
    groupId: string | null;
    groupName: string;
    accounts: { accountId: string; code: string; name: string; amount: number; previousAmount: number }[];
    total: number;
    previousTotal: number;
  }[];
  total: number;
  previousTotal: number;
};

export type BalanceSheetReport = {
  asOn: string;
  compareAsOn: string;
  assets: BalanceSheetSection[];
  liabilities: BalanceSheetSection[];
  totals: {
    totalAssets: number;
    totalLiabilities: number;
    previousTotalAssets: number;
    previousTotalLiabilities: number;
    difference: number;
    balanced: boolean;
  };
  ratios: { currentRatio: number | null; quickRatio: number | null; debtEquity: number | null; workingCapital: number };
};

export type GeneralLedgerEntry = {
  lineId: string;
  voucherId: string;
  voucherNo: string;
  voucherDate: string;
  voucherType: string;
  voucherTypeCode: string | null;
  accountName: string | null;
  particulars: string;
  narration: string;
  referenceNo: string;
  chequeNo: string;
  partyName: string | null;
  divisionName: string | null;
  debit: number;
  credit: number;
  balance: number;
  balanceSide: "Dr" | "Cr";
};

export type GeneralLedgerReport = {
  from: string;
  to: string;
  account: { id: string; code: string; name: string; nature: AccountNature; accountType: "Group" | "Ledger" } | null;
  party: { id: string; code: string; name: string } | null;
  opening: DrCr;
  entries: GeneralLedgerEntry[];
  totals: { debit: number; credit: number };
  closing: DrCr;
};

export type DayBookReport = {
  from: string;
  to: string;
  vouchers: Voucher[];
  summary: {
    voucherCount: number;
    totalDebit: number;
    totalCredit: number;
    openingCashBank: number;
    inflow: number;
    outflow: number;
    closingCashBank: number;
    openingCash: number;
    closingCash: number;
    byCategory: { category: string; count: number; amount: number }[];
  };
};

export type AgingBill = PartyBill & { ageDays: number; bucketIndex: number; bucket: string };

export type OutstandingBillsReport = {
  asOnDate: string;
  slabs: number[];
  labels: string[];
  ageBy: "billDate" | "dueDate";
  moduleType: ModuleType;
  bills: AgingBill[];
  totals: { bucket: string; amount: number; count: number }[];
  totalOutstanding: number;
  totalBillAmount: number;
};

export type AgingSummaryRow = {
  partyId: string;
  partyCode: string;
  partyName: string;
  partyGroup: string;
  city: string;
  creditDays: number;
  creditLimit: number;
  overLimit: boolean;
  billsCount: number;
  oldestDays: number;
  buckets: number[];
  total: number;
};

export type AgingSummaryReport = {
  asOnDate: string;
  slabs: number[];
  labels: string[];
  ageBy: "billDate" | "dueDate";
  moduleType: ModuleType;
  rows: AgingSummaryRow[];
  totals: { buckets: number[]; total: number };
};

export type PartySettlementReport = {
  from: string | null;
  to: string;
  bills: PartyBill[];
  totals: { billAmount: number; settled: number; balance: number };
};

export type ReminderParty = {
  partyId: string;
  partyCode: string;
  partyName: string;
  partyGroup: string;
  contactPersonName: string;
  email: string;
  phone: string;
  address: string;
  maxOverdueDays: number;
  totalOverdue: number;
  bills: { billId: string; billNo: string; billDate: string; dueDate: string; amount: number; balance: number; overdueDays: number; details: string }[];
};

export type ReminderLettersReport = { asOnDate: string; parties: ReminderParty[] };

export type BalanceConfirmationRow = {
  partyId: string;
  partyCode: string;
  partyName: string;
  partyGroup: string;
  contactPersonName: string;
  email: string;
  address: string;
  gstin: string;
  opening: DrCr;
  debit: number;
  credit: number;
  closing: DrCr;
};

export type BalanceConfirmationReport = { from: string; to: string; rows: BalanceConfirmationRow[] };

export type PaymentAdvice = {
  voucherId: string;
  voucherNo: string;
  voucherDate: string;
  amount: number;
  narration: string;
  referenceNo: string;
  instrumentNo: string;
  instrumentDate: string | null;
  paymentMethodName: string | null;
  bankCashAccountName: string | null;
  partyId: string;
  partyName: string | null;
  partyCode: string | null;
  partyEmail: string;
  partyAddress: string;
  bankName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  bills: { billId: string; billNo: string | null; billDate: string | null; billAmount: number | null; paidAmount: number; deductions: number }[];
};

export type PaymentAdviceReport = { from: string; to: string; advices: PaymentAdvice[] };

export type AnalysisReport = {
  from: string;
  to: string;
  fiscalYearId: string | null;
  fiscalYearName: string | null;
  summary: PnlSummary;
  departments: (DivisionPnl & { share: number; budget: number | null })[];
  quarterly: { quarter: string; from: string; to: string; income: number; expense: number; net: number }[];
  monthly: MonthlyPnl[];
  ratios: {
    grossMargin: number;
    netMargin: number;
    payrollPercent: number;
    costOfSalesPercent: number;
    currentRatio: number | null;
    quickRatio: number | null;
    debtEquity: number | null;
    workingCapital: number;
    receivableDays: number;
    payableDays: number;
  };
  receivablesAging: { labels: string[]; totals: { buckets: number[]; total: number }; topParties: AgingSummaryRow[] };
  payablesOutstanding: number;
  budgets: { budgetId: string; divisionId: string; divisionName: string | null; divisionCode: string | null; budget: number; actual: number; variance: number; utilization: number }[];
};

export type NameValue = { name: string; value: number };

export type AccountsDashboard = {
  asOn: string;
  fiscalYearName: string | null;
  kpis: {
    cashBalance: number;
    bankBalance: number;
    receivables: number;
    overdueReceivables: number;
    payables: number;
    revenueMtd: number;
    expensesMtd: number;
    netProfitMtd: number;
    revenueYtd: number;
    expensesYtd: number;
    netProfitYtd: number;
    netMarginYtd: number;
    gstPayable: number;
    draftVouchers: number;
    provisionalEntries: number;
    unreconciledBankEntries: number;
  };
  departmentRevenue: NameValue[];
  channelRevenue: NameValue[];
  monthly: MonthlyPnl[];
  revenueMix: NameValue[];
  upcomingVendorPayments: {
    billId: string;
    partyId: string;
    partyName: string | null;
    billNo: string;
    billDate: string;
    dueDate: string;
    amount: number;
    balance: number;
    overdueDays: number;
    status: "Overdue" | "Due Today" | "Upcoming";
  }[];
  recentVouchers: Pick<Voucher, "id" | "voucherNo" | "voucherDate" | "voucherTypeName" | "voucherCategory" | "narration" | "partyName" | "totalAmount" | "status">[];
};
