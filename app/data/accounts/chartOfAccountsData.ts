export type AccountNature = "Asset" | "Liability" | "Income" | "Expense";
export type AccountType = "Group" | "Ledger";
export type AccountClassification = "Normal Account" | "Control Account" | "System Account";
export type OpeningBalanceType = "None" | "Debit Only" | "Credit Only" | "Both";
export type PostingType = "Manual" | "System" | "Both";
export type AccountStatus = "Active" | "Inactive";

export interface COANode {
  id: string; // e.g. "ACC-001"
  code: string; // e.g. "1000"
  name: string;
  parentName: string;
  parentId?: string;
  nature: AccountNature;
  category: string;
  type: AccountType;
  status: AccountStatus;
  description?: string;

  // Accounting Configuration
  allowPosting: boolean;
  openingBalanceType: OpeningBalanceType;
  classification: AccountClassification;
  postingType: PostingType;
  isSystemAccount?: boolean;

  // Usage & Audit Info (Read-Only)
  level: number;
  createdAt: string;
  updatedAt: string;
  hasTransactions?: boolean;
  transactionCount?: number;

  children?: COANode[];
}

export const natureCategories: Record<AccountNature, string[]> = {
  Asset: [
    "Bank",
    "Cash",
    "Receivable",
    "Deposit",
    "Advance",
    "Current Asset",
    "Fixed Asset",
    "Investment",
  ],
  Liability: [
    "Payable",
    "GST Payable",
    "TDS Payable",
    "Current Liability",
    "Loan",
    "Security Deposit",
    "Capital Account",
  ],
  Income: [
    "Room Revenue",
    "F&B Revenue",
    "Laundry Revenue",
    "Banquet Revenue",
    "Other Income",
  ],
  Expense: [
    "Payroll",
    "Utility",
    "Purchase",
    "Maintenance",
    "Admin Expense",
    "Operating Expense",
  ],
};

// Hotel PMS V1 Chart of Accounts - 4 Root Primary Natures
export const sampleCOATree: COANode[] = [
  // 1. ASSETS (Level 1 Root)
  {
    id: "ACC-001",
    code: "1000",
    name: "Assets",
    parentName: "Root",
    nature: "Asset",
    category: "Current Asset",
    type: "Group",
    status: "Active",
    description: "All tangible and intangible economic resources of the property.",
    allowPosting: false,
    openingBalanceType: "Debit Only",
    classification: "System Account",
    postingType: "Both",
    isSystemAccount: true,
    level: 1,
    createdAt: "01 Apr 2024",
    updatedAt: "01 Apr 2024",
    hasTransactions: false,
    transactionCount: 0,
    children: [],
  },

  // 2. LIABILITIES (Level 1 Root)
  {
    id: "ACC-002",
    code: "2000",
    name: "Liabilities",
    parentName: "Root",
    nature: "Liability",
    category: "Current Liability",
    type: "Group",
    status: "Active",
    description: "Financial debts, statutory obligations, and vendor payables.",
    allowPosting: false,
    openingBalanceType: "Credit Only",
    classification: "System Account",
    postingType: "Both",
    isSystemAccount: true,
    level: 1,
    createdAt: "01 Apr 2024",
    updatedAt: "01 Apr 2024",
    hasTransactions: false,
    transactionCount: 0,
    children: [],
  },

  // 3. INCOME (Level 1 Root)
  {
    id: "ACC-003",
    code: "3000",
    name: "Income",
    parentName: "Root",
    nature: "Income",
    category: "Room Revenue",
    type: "Group",
    status: "Active",
    description: "Operational revenues and auxiliary hospitality earnings.",
    allowPosting: false,
    openingBalanceType: "None",
    classification: "System Account",
    postingType: "Both",
    isSystemAccount: true,
    level: 1,
    createdAt: "01 Apr 2024",
    updatedAt: "01 Apr 2024",
    hasTransactions: false,
    transactionCount: 0,
    children: [],
  },

  // 4. EXPENSES (Level 1 Root)
  {
    id: "ACC-004",
    code: "4000",
    name: "Expenses",
    parentName: "Root",
    nature: "Expense",
    category: "Operating Expense",
    type: "Group",
    status: "Active",
    description: "Operational overheads, payroll, utilities, and departmental expenses.",
    allowPosting: false,
    openingBalanceType: "None",
    classification: "System Account",
    postingType: "Both",
    isSystemAccount: true,
    level: 1,
    createdAt: "01 Apr 2024",
    updatedAt: "01 Apr 2024",
    hasTransactions: false,
    transactionCount: 0,
    children: [],
  },
];

// Helper: Find Node in tree by ID
export function findCOANodeById(nodes: COANode[], id: string): COANode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children && node.children.length > 0) {
      const found = findCOANodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

// Helper: Get all Group nodes (for parent selection dropdowns)
export function getAllGroupNodes(nodes: COANode[]): { id: string; name: string; nature: AccountNature; code: string; level: number }[] {
  const groups: { id: string; name: string; nature: AccountNature; code: string; level: number }[] = [];
  function traverse(list: COANode[]) {
    for (const item of list) {
      if (item.type === "Group") {
        groups.push({
          id: item.id,
          name: item.name,
          nature: item.nature,
          code: item.code,
          level: item.level,
        });
        if (item.children) traverse(item.children);
      }
    }
  }
  traverse(nodes);
  return groups;
}

// Helper: Auto-generate hierarchical Account Code
export function generateAccountCode(parentNode: COANode | null, nature: AccountNature, type: AccountType): string {
  if (!parentNode) {
    const naturePrefix = { Asset: "1000", Liability: "2000", Income: "3000", Expense: "4000" }[nature];
    return naturePrefix || "1000";
  }

  const parentCode = parentNode.code || "1000";
  const existingCount = (parentNode.children || []).length;
  const nextSeq = existingCount + 1;

  if (parentNode.level === 1) {
    const baseNum = parseInt(parentCode, 10);
    return `${baseNum + nextSeq * 100}`;
  } else if (parentNode.level === 2) {
    const baseNum = parseInt(parentCode, 10);
    return `${baseNum + nextSeq * 10}`;
  } else {
    const baseNum = parseInt(parentCode, 10);
    return `${baseNum + nextSeq}`;
  }
}
