import { api } from "../api";
import type {
  Account,
  AccountTreeNode,
  AccountsDashboard,
  AgingSummaryReport,
  AnalysisReport,
  AuditLog,
  BalanceConfirmationReport,
  BalanceSheetReport,
  BankReconciliation,
  BillAllocationInput,
  Budget,
  ClosingStockItem,
  Company,
  CompanySettings,
  CoveringLetter,
  Currency,
  DayBookReport,
  Division,
  FiscalPeriod,
  FiscalYear,
  GeneralLedgerReport,
  Lookups,
  NewBillInput,
  OutstandingBillsReport,
  Party,
  PartyBill,
  PartySettlementReport,
  PartySubType,
  PartyType,
  PaymentAdviceReport,
  PaymentMethod,
  ProfitLossReport,
  ReceiptPaymentInput,
  ReminderLettersReport,
  RevenueCategory,
  TaxDefinition,
  TaxRule,
  TrialBalanceReport,
  Voucher,
  VoucherDetail,
  VoucherInput,
  VoucherQuery,
  VoucherType,
} from "./types";

export * from "./types";

export const accPath = (segment: string) =>
  `/api/accounts${segment.startsWith("/") ? segment : `/${segment}`}`;

type QueryValue = string | number | boolean | undefined | null;

/** Build "?a=1&b=2" skipping empty values. */
export function qs(params: Record<string, QueryValue> = {}): string {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    s.set(k, String(v));
  }
  const out = s.toString();
  return out ? `?${out}` : "";
}

function crud<T>(base: string) {
  return {
    list: (params: Record<string, QueryValue> = {}) => api.get<T[]>(accPath(`${base}${qs(params)}`)),
    get: (id: string) => api.get<T>(accPath(`${base}/${id}`)),
    create: (body: Partial<T>) => api.post<T>(accPath(base), body),
    update: (id: string, body: Partial<T>) => api.put<T>(accPath(`${base}/${id}`), body),
    remove: (id: string) => api.delete<{ id: string }>(accPath(`${base}/${id}`)),
  };
}

// Masters -------------------------------------------------------------------
export const accLookupService = { get: () => api.get<Lookups>(accPath("/lookups")) };

export const accCurrencyService = crud<Currency>("/masters/currencies");
export const accCompanyService = crud<Company>("/masters/companies");
export const accAccountService = {
  ...crud<Account>("/masters/accounts"),
  tree: (asOn?: string) => api.get<AccountTreeNode[]>(accPath(`/masters/accounts/tree${qs({ asOn })}`)),
};
export const accDivisionService = crud<Division>("/masters/divisions");
export const accPartyTypeService = crud<PartyType>("/masters/party-types");
export const accPartySubTypeService = crud<PartySubType>("/masters/party-sub-types");
export const accPaymentMethodService = crud<PaymentMethod>("/masters/payment-methods");
export const accPartyService = crud<Party>("/masters/parties");
export const accVoucherTypeService = crud<VoucherType>("/masters/voucher-types");
export const accRevenueCategoryService = crud<RevenueCategory>("/masters/revenue-categories");
export const accTaxDefinitionService = crud<TaxDefinition>("/masters/tax-definitions");
export const accTaxRuleService = crud<TaxRule>("/masters/tax-rules");
export const accBudgetService = crud<Budget>("/masters/budgets");

export const accCompanySettingsService = {
  get: (companyId?: string) => api.get<CompanySettings>(accPath(`/masters/company-settings${qs({ companyId })}`)),
  update: (id: string, body: Partial<CompanySettings>) =>
    api.put<CompanySettings>(accPath(`/masters/company-settings/${id}`), body),
};

export const accFiscalYearService = {
  ...crud<FiscalYear>("/masters/fiscal-years"),
  open: (id: string) => api.post<FiscalYear>(accPath(`/masters/fiscal-years/${id}/open`), {}),
  setCurrent: (id: string) => api.post<FiscalYear>(accPath(`/masters/fiscal-years/${id}/set-current`), {}),
  close: (id: string) => api.post<FiscalYear>(accPath(`/masters/fiscal-years/${id}/close`), {}),
  reopen: (id: string, reason: string) =>
    api.post<FiscalYear>(accPath(`/masters/fiscal-years/${id}/reopen`), { reason }),
};

export const accFiscalPeriodService = {
  list: (fiscalYearId?: string) => api.get<FiscalPeriod[]>(accPath(`/fiscal-periods${qs({ fiscalYearId })}`)),
  close: (id: string, force = false) => api.post<FiscalPeriod>(accPath(`/fiscal-periods/${id}/close`), { force }),
  reopen: (id: string, reason: string) => api.post<FiscalPeriod>(accPath(`/fiscal-periods/${id}/reopen`), { reason }),
};

export const accAuditLogService = {
  list: (params: { entityType?: string; entityId?: string; limit?: number } = {}) =>
    api.get<AuditLog[]>(accPath(`/audit-logs${qs(params)}`)),
};

// Vouchers ------------------------------------------------------------------
export const accVoucherService = {
  list: (query: VoucherQuery = {}) => api.get<Voucher[]>(accPath(`/vouchers${qs(query)}`)),
  get: (id: string) => api.get<VoucherDetail>(accPath(`/vouchers/${id}`)),
  nextNumber: (voucherTypeId: string, date?: string) =>
    api.get<{ voucherNo: string; fiscalYearId: string; fiscalYearName: string }>(
      accPath(`/vouchers/next-number${qs({ voucherTypeId, date })}`),
    ),
  create: (body: VoucherInput) => api.post<VoucherDetail>(accPath("/vouchers"), body),
  update: (id: string, body: VoucherInput) => api.put<VoucherDetail>(accPath(`/vouchers/${id}`), body),
  remove: (id: string) => api.delete<{ id: string }>(accPath(`/vouchers/${id}`)),
  post: (id: string, body: { billAllocations?: BillAllocationInput[]; newBill?: NewBillInput } = {}) =>
    api.post<VoucherDetail>(accPath(`/vouchers/${id}/post`), body),
  reverse: (id: string, reason: string) => api.post<VoucherDetail>(accPath(`/vouchers/${id}/reverse`), { reason }),
  convert: (id: string, body: { voucherDate?: string; voucherTypeId?: string; narration?: string } = {}) =>
    api.post<{ provisional: VoucherDetail; voucher: VoucherDetail }>(accPath(`/vouchers/${id}/convert`), body),
  print: (id: string) => api.post<VoucherDetail>(accPath(`/vouchers/${id}/print`), {}),
  receiptPayment: (body: ReceiptPaymentInput) => api.post<VoucherDetail>(accPath("/receipts-payments"), body),
};

export const accBankReconService = {
  get: (params: { bankAccountId?: string; from?: string; to?: string; status?: "all" | "reconciled" | "unreconciled" } = {}) =>
    api.get<BankReconciliation>(accPath(`/bank-reconciliation${qs(params)}`)),
  reconcile: (items: { lineId: string; reconDate: string }[]) =>
    api.post<{ reconciled: number }>(accPath("/bank-reconciliation/reconcile"), { items }),
  unreconcile: (lineIds: string[], reason: string) =>
    api.post<{ unreconciled: number }>(accPath("/bank-reconciliation/unreconcile"), { lineIds, reason }),
};

export const accClosingStockService = {
  ...crud<ClosingStockItem>("/closing-stock"),
  post: (body: { itemIds?: string[]; valuationDate?: string; postingDate?: string }) =>
    api.post<{ posted: number; voucher: VoucherDetail | null }>(accPath("/closing-stock/post"), body),
};

// Bills ---------------------------------------------------------------------
export const accPartyBillService = {
  list: (params: {
    moduleType?: "AR" | "AP";
    partyId?: string;
    partyGroup?: string;
    status?: string;
    asOnDate?: string;
    pendingOnly?: boolean;
    from?: string;
    to?: string;
  } = {}) => api.get<PartyBill[]>(accPath(`/party-bills${qs(params)}`)),
  get: (id: string) => api.get<PartyBill>(accPath(`/party-bills/${id}`)),
  create: (body: Partial<PartyBill>) => api.post<PartyBill>(accPath("/party-bills"), body),
  update: (id: string, body: Partial<PartyBill>) => api.put<PartyBill>(accPath(`/party-bills/${id}`), body),
  cancel: (id: string, reason: string) => api.post<PartyBill>(accPath(`/party-bills/${id}/cancel`), { reason }),
  settle: (
    id: string,
    body: { amount: number; settlementDate?: string; voucherId?: string; deductions?: number; referenceNo?: string; trnType?: string; remarks?: string },
  ) => api.post<PartyBill>(accPath(`/party-bills/${id}/settle`), body),
  removeSettlement: (settlementId: string) => api.delete<{ id: string }>(accPath(`/bill-settlements/${settlementId}`)),
};

export const accCoveringLetterService = {
  list: (params: { status?: string; partyId?: string; from?: string; to?: string } = {}) =>
    api.get<CoveringLetter[]>(accPath(`/covering-letters${qs(params)}`)),
  candidates: (params: { partyId?: string; partyGroup?: string; asOnDate?: string; from?: string; to?: string } = {}) =>
    api.get<PartyBill[]>(accPath(`/covering-letters/candidates${qs(params)}`)),
  create: (body: { letterDate?: string; billIds: string[]; remarks?: string }) =>
    api.post<CoveringLetter>(accPath("/covering-letters"), body),
  reverse: (id: string, reason: string) => api.post<CoveringLetter>(accPath(`/covering-letters/${id}/reverse`), { reason }),
};

// Reports -------------------------------------------------------------------
type RangeParams = { from?: string; to?: string; fiscalYearId?: string };

export const accReportService = {
  dashboard: (asOn?: string) => api.get<AccountsDashboard>(accPath(`/dashboard${qs({ asOn })}`)),
  trialBalance: (p: RangeParams & { showZero?: boolean } = {}) =>
    api.get<TrialBalanceReport>(accPath(`/reports/trial-balance${qs(p)}`)),
  profitLoss: (p: RangeParams & { compareFrom?: string; compareTo?: string } = {}) =>
    api.get<ProfitLossReport>(accPath(`/reports/profit-loss${qs(p)}`)),
  balanceSheet: (p: { asOn?: string; compareAsOn?: string } = {}) =>
    api.get<BalanceSheetReport>(accPath(`/reports/balance-sheet${qs(p)}`)),
  generalLedger: (p: RangeParams & { accountId?: string; partyId?: string; divisionId?: string; voucherTypeId?: string }) =>
    api.get<GeneralLedgerReport>(accPath(`/reports/general-ledger${qs(p)}`)),
  dayBook: (p: { date?: string; from?: string; to?: string; voucherTypeId?: string; category?: string; status?: string } = {}) =>
    api.get<DayBookReport>(accPath(`/reports/day-book${qs(p)}`)),
  outstandingBills: (p: { asOnDate?: string; moduleType?: "AR" | "AP"; partyGroup?: string; partyId?: string; slabs?: string; ageBy?: "billDate" | "dueDate" } = {}) =>
    api.get<OutstandingBillsReport>(accPath(`/reports/outstanding-bills${qs(p)}`)),
  agingSummary: (p: { asOnDate?: string; moduleType?: "AR" | "AP"; partyGroup?: string; partyId?: string; slabs?: string; ageBy?: "billDate" | "dueDate" } = {}) =>
    api.get<AgingSummaryReport>(accPath(`/reports/aging-summary${qs(p)}`)),
  partySettlement: (p: { from?: string; to?: string; moduleType?: "AR" | "AP"; partyId?: string; partyGroup?: string; status?: "all" | "pending" | "settled" } = {}) =>
    api.get<PartySettlementReport>(accPath(`/reports/party-settlement${qs(p)}`)),
  reminderLetters: (p: { asOnDate?: string; partyGroup?: string; partyId?: string; minOverdueDays?: number } = {}) =>
    api.get<ReminderLettersReport>(accPath(`/reports/reminder-letters${qs(p)}`)),
  balanceConfirmation: (p: RangeParams & { partyGroup?: string; partyId?: string; includeZero?: boolean } = {}) =>
    api.get<BalanceConfirmationReport>(accPath(`/reports/balance-confirmation${qs(p)}`)),
  paymentAdvice: (p: RangeParams & { partyId?: string } = {}) =>
    api.get<PaymentAdviceReport>(accPath(`/reports/payment-advice${qs(p)}`)),
  analysis: (p: RangeParams = {}) => api.get<AnalysisReport>(accPath(`/reports/analysis${qs(p)}`)),
};
