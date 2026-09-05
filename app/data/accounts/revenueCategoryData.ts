export interface RevenueCategoryModel {
  revenueCategoryId: string; // e.g. "RC-001" (Primary Key)
  revenueCategoryCode: string; // e.g. "ROOMS" (uppercase, unique per company)
  revenueCategoryName: string; // e.g. "Rooms" (unique per company)
  status: "Active" | "Inactive";
  description?: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  hasTransactions?: boolean;
  transactionCount?: number;
}

// Standard Hotel PMS V1 Default Seed Revenue Categories (strictly 2 records)
export const sampleRevenueCategoriesList: RevenueCategoryModel[] = [
  {
    revenueCategoryId: "RC-001",
    revenueCategoryCode: "ROOMS",
    revenueCategoryName: "Rooms",
    status: "Active",
    description: "Lodging, room tariff, package accommodation, and upgrade revenues.",
    companyId: "comp-101",
    createdAt: "01 Apr 2024",
    updatedAt: "10 Jan 2025",
    createdBy: "Finance Admin",
    updatedBy: "Finance Admin",
    hasTransactions: true,
    transactionCount: 520,
  },
  {
    revenueCategoryId: "RC-002",
    revenueCategoryCode: "FNB",
    revenueCategoryName: "F&B",
    status: "Active",
    description: "Restaurant sales, in-room dining, bar lounges, and culinary revenues.",
    companyId: "comp-101",
    createdAt: "01 Apr 2024",
    updatedAt: "12 Jan 2025",
    createdBy: "Finance Admin",
    updatedBy: "Finance Admin",
    hasTransactions: true,
    transactionCount: 380,
  },
];
