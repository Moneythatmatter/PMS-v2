export interface AccountingUtilityTool {
  id: string;
  code: string;
  title: string;
  description: string;
  category: "Maintenance" | "Audit" | "DataManagement" | "Security";
  lastRunDate: string;
  lastRunBy: string;
  status: "Optimal" | "Action Recommended" | "Locked";
  estimatedTime: string;
}

export const sampleAccountingToolsData: AccountingUtilityTool[] = [
  {
    id: "tool-01",
    code: "UTIL-GL-01",
    title: "GL Account & Ledger Re-Indexing Utility",
    description: "Scans all historical transaction vouchers and recalculates debit/credit closing balances for every GL account ledger.",
    category: "Maintenance",
    lastRunDate: "04/08/2026 08:30 AM",
    lastRunBy: "Jay Admin",
    status: "Optimal",
    estimatedTime: "45 Seconds",
  },
  {
    id: "tool-02",
    code: "UTIL-VCH-02",
    title: "Voucher Sequence Re-Numbering Tool",
    description: "Re-sequences voucher numbers chronologically to eliminate gap sequence numbers created by deleted draft vouchers.",
    category: "Maintenance",
    lastRunDate: "01/08/2026 06:00 PM",
    lastRunBy: "Abhijit Suthar",
    status: "Optimal",
    estimatedTime: "30 Seconds",
  },
  {
    id: "tool-03",
    code: "UTIL-DAT-03",
    title: "Bulk Master Import & Export Utility",
    description: "Bulk import Chart of Accounts, Party Masters, and Opening Ledger Balances from Excel (.xlsx) / CSV files.",
    category: "DataManagement",
    lastRunDate: "25/07/2026 11:15 AM",
    lastRunBy: "Jay Admin",
    status: "Optimal",
    estimatedTime: "Instant",
  },
  {
    id: "tool-04",
    code: "UTIL-INT-04",
    title: "Database Integrity & Parity Checker",
    description: "Performs full database verification to confirm Debit = Credit equality across all posted vouchers and flags orphaned records.",
    category: "Audit",
    lastRunDate: "04/08/2026 07:00 AM",
    lastRunBy: "System Auditor",
    status: "Optimal",
    estimatedTime: "15 Seconds",
  },
  {
    id: "tool-05",
    code: "UTIL-LOCK-05",
    title: "Financial Period Lock & Unlock Utility",
    description: "Locks past financial months to prevent unauthorized creation, modification, or backdated voucher posting by users.",
    category: "Security",
    lastRunDate: "30/06/2026 11:59 PM",
    lastRunBy: "Jay Admin",
    status: "Locked",
    estimatedTime: "Instant",
  },
  {
    id: "tool-06",
    code: "UTIL-LOG-06",
    title: "Audit Log & Temporary Session Purge",
    description: "Purges temporary session logs, query caches, and archives audit trail records older than specified retention period.",
    category: "Maintenance",
    lastRunDate: "15/07/2026 10:00 PM",
    lastRunBy: "System Auditor",
    status: "Optimal",
    estimatedTime: "10 Seconds",
  },
];
