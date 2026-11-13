/** Shared Accounts report catalog — safe for server + client imports. */
export const ACCOUNTS_REPORT_IDS = [
  "trial-balance",
  "profit-and-loss",
  "balance-sheet",
  "general-ledger",
  "day-book",
] as const;

export type AccountsReportId = (typeof ACCOUNTS_REPORT_IDS)[number];

export const ACCOUNTS_REPORT_LABELS: Record<AccountsReportId, string> = {
  "trial-balance": "Trial Balance",
  "profit-and-loss": "Profit & Loss",
  "balance-sheet": "Balance Sheet",
  "general-ledger": "General Ledger",
  "day-book": "Day Book",
};

export function isAccountsReportId(value: string): value is AccountsReportId {
  return (ACCOUNTS_REPORT_IDS as readonly string[]).includes(value);
}
