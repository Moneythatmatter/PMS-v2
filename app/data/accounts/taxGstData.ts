export type TaxType =
  | "GST"
  | "CGST"
  | "SGST"
  | "IGST"
  | "CESS"
  | "Other";

export type TaxCalculationType = "Exclusive" | "Inclusive";

export interface TaxDefinitionModel {
  taxId: string; // e.g. "TX-001" (Primary Key)
  taxCode: string; // e.g. "GST12" (uppercase, unique)
  taxName: string; // e.g. "GST 12%"
  taxType: TaxType;
  rate: number; // e.g. 12
  calculationType: TaxCalculationType;
  hsnSacCode?: string;
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

export type TaxApplicabilityType =
  | "Revenue Category"
  | "Service"
  | "Item Category"
  | "Department"
  | "Amount Slab";

export interface TaxRuleModel {
  taxRuleId: string; // e.g. "TR-001" (Primary Key)
  taxRuleCode: string; // e.g. "ROOM-LOW" (uppercase, unique)
  taxRuleName: string; // e.g. "Room Tariff Base Slab"
  taxId: string; // references TaxDefinitionModel.taxId (e.g. "TX-001")
  applicabilityType: TaxApplicabilityType;
  revenueCategoryId?: string; // references RevenueCategoryModel.revenueCategoryId (e.g. "RC-001")
  serviceType?: string;
  itemCategoryId?: string;
  divisionId?: string; // references DivisionModel.divisionId
  minimumAmount?: number;
  maximumAmount?: number;
  priority: number; // e.g. 1, 2 (higher priority evaluated first)
  effectiveFrom: string; // e.g. "2024-04-01"
  effectiveTo?: string; // e.g. "2099-12-31" or undefined
  status: "Active" | "Inactive";
  description?: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

// Initial Sample Tax Definitions (strictly 2 records)
export const sampleTaxDefinitionsList: TaxDefinitionModel[] = [
  {
    taxId: "TX-001",
    taxCode: "GST12",
    taxName: "GST 12%",
    taxType: "GST",
    rate: 12,
    calculationType: "Exclusive",
    status: "Active",
    description: "Standard 12% Goods and Services Tax applicable to base hospitality accommodations.",
    companyId: "comp-101",
    createdAt: "01 Apr 2024",
    updatedAt: "10 Jan 2025",
    createdBy: "Finance Admin",
    updatedBy: "Finance Admin",
    hasTransactions: true,
    transactionCount: 840,
  },
  {
    taxId: "TX-002",
    taxCode: "GST18",
    taxName: "GST 18%",
    taxType: "GST",
    rate: 18,
    calculationType: "Exclusive",
    status: "Active",
    description: "Standard 18% Goods and Services Tax applicable to upper tariff accommodations and events.",
    companyId: "comp-101",
    createdAt: "01 Apr 2024",
    updatedAt: "12 Jan 2025",
    createdBy: "Finance Admin",
    updatedBy: "Finance Admin",
    hasTransactions: true,
    transactionCount: 620,
  },
];

// Initial Sample Tax Rules (strictly 2 records demonstrating amount slab logic)
export const sampleTaxRulesList: TaxRuleModel[] = [
  {
    taxRuleId: "TR-001",
    taxRuleCode: "ROOM-LOW",
    taxRuleName: "Room Tariff Base Slab",
    taxId: "TX-001",
    applicabilityType: "Revenue Category",
    revenueCategoryId: "RC-001", // Rooms
    minimumAmount: 0,
    maximumAmount: 7500,
    priority: 1,
    effectiveFrom: "2024-04-01",
    status: "Active",
    description: "Applies 12% GST on room charges with declared tariff up to ₹7,500 per unit/night.",
    companyId: "comp-101",
    createdAt: "01 Apr 2024",
    updatedAt: "10 Jan 2025",
    createdBy: "Finance Admin",
    updatedBy: "Finance Admin",
  },
  {
    taxRuleId: "TR-002",
    taxRuleCode: "ROOM-HIGH",
    taxRuleName: "Room Tariff Upper Slab",
    taxId: "TX-002",
    applicabilityType: "Revenue Category",
    revenueCategoryId: "RC-001", // Rooms
    minimumAmount: 7500.01,
    maximumAmount: undefined,
    priority: 2,
    effectiveFrom: "2024-04-01",
    status: "Active",
    description: "Applies 18% GST on room charges with declared tariff exceeding ₹7,500 per unit/night.",
    companyId: "comp-101",
    createdAt: "01 Apr 2024",
    updatedAt: "12 Jan 2025",
    createdBy: "Finance Admin",
    updatedBy: "Finance Admin",
  },
];
