export type VoucherCategory =
  | "Receipt"
  | "Payment"
  | "Journal"
  | "Contra"
  | "Credit Note"
  | "Debit Note";

export interface VoucherTypeModel {
  voucherTypeId: string; // e.g. "VT-001" (Primary Key)
  voucherTypeName: string; // e.g. "Receipt Voucher"
  shortCode: string; // e.g. "RV" (uppercase, unique)
  category: VoucherCategory;
  sequence: number;

  numberingMethod: "Automatic" | "Manual";
  prefixTemplate: string; // e.g. "RV/{FY}/"
  startingNumber: number; // e.g. 1
  resetFrequency: "Yearly" | "Monthly" | "Never";

  defaultEntryNature: "Debit" | "Credit" | "Both";

  partyRequired: boolean;
  divisionRequired: boolean;

  status: "Active" | "Inactive";

  companyId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  hasTransactions?: boolean;
  transactionCount?: number;
}

// Current active fiscal year code for live numbering preview
export const currentFiscalYearCode = "26-27";

// Standard Hotel PMS V1 Default Seed Voucher Types (strictly 2 records)
export const sampleVoucherTypesList: VoucherTypeModel[] = [
  {
    voucherTypeId: "VT-001",
    voucherTypeName: "Receipt Voucher",
    shortCode: "RV",
    category: "Receipt",
    sequence: 1,
    numberingMethod: "Automatic",
    prefixTemplate: "RV/{FY}/",
    startingNumber: 1,
    resetFrequency: "Yearly",
    defaultEntryNature: "Debit",
    partyRequired: true,
    divisionRequired: false,
    status: "Active",
    companyId: "comp-101",
    createdAt: "01 Apr 2024",
    updatedAt: "10 Jan 2025",
    createdBy: "Finance Admin",
    updatedBy: "Finance Admin",
    hasTransactions: true,
    transactionCount: 320,
  },
  {
    voucherTypeId: "VT-002",
    voucherTypeName: "Payment Voucher",
    shortCode: "PV",
    category: "Payment",
    sequence: 2,
    numberingMethod: "Automatic",
    prefixTemplate: "PV/{FY}/",
    startingNumber: 1,
    resetFrequency: "Yearly",
    defaultEntryNature: "Credit",
    partyRequired: true,
    divisionRequired: false,
    status: "Active",
    companyId: "comp-101",
    createdAt: "01 Apr 2024",
    updatedAt: "12 Jan 2025",
    createdBy: "Finance Admin",
    updatedBy: "Finance Admin",
    hasTransactions: true,
    transactionCount: 285,
  },
];

// Helper to generate a live preview of the voucher number
export function formatVoucherNumberPreview(
  template: string,
  startingNo: number,
  method: "Automatic" | "Manual",
  fyCode: string = currentFiscalYearCode
): string {
  if (method === "Manual") {
    return "(Manual Number Entry at Voucher Posting)";
  }
  const prefix = (template || "").replace("{FY}", fyCode);
  const numStr = String(startingNo || 1).padStart(5, "0");
  return `${prefix}${numStr}`;
}
