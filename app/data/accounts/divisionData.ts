export type DivisionType =
  | "Revenue Department"
  | "Support Department"
  | "Administrative Department"
  | "Other";

export interface DivisionModel {
  divisionId: string; // e.g. "DIV-001" (Primary Key)
  divisionCode: string; // e.g. "ROOMS"
  divisionName: string; // e.g. "Rooms"
  shortName?: string; // e.g. "RMS"
  divisionType?: DivisionType;
  parentDivisionId?: string;
  sequence: number;
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

// Standard Hotel PMS V1 Default Seed Divisions
export const sampleDivisionsList: DivisionModel[] = [
  {
    divisionId: "DIV-001",
    divisionCode: "ROOMS",
    divisionName: "Rooms",
    shortName: "RMS",
    divisionType: "Revenue Department",
    sequence: 1,
    status: "Active",
    description: "Front office lodging, resident guest services, and accommodation operations.",
    companyId: "CMP-001",
    createdAt: "01 Apr 2024",
    updatedAt: "10 Jan 2025",
    createdBy: "Finance Admin",
    updatedBy: "Finance Admin",
    hasTransactions: true,
    transactionCount: 245,
  },
  {
    divisionId: "DIV-002",
    divisionCode: "FNB",
    divisionName: "F&B",
    shortName: "FNB",
    divisionType: "Revenue Department",
    sequence: 2,
    status: "Active",
    description: "All-day dining restaurant, bar lounges, room service, and culinary cost center.",
    companyId: "CMP-001",
    createdAt: "01 Apr 2024",
    updatedAt: "12 Jan 2025",
    createdBy: "Finance Admin",
    updatedBy: "Finance Admin",
    hasTransactions: true,
    transactionCount: 180,
  },
  {
    divisionId: "DIV-003",
    divisionCode: "BANQUET",
    divisionName: "Banquet",
    shortName: "BNQ",
    divisionType: "Revenue Department",
    sequence: 3,
    status: "Active",
    description: "Conference halls, corporate conventions, wedding catering, and private event spaces.",
    companyId: "CMP-001",
    createdAt: "01 Apr 2024",
    updatedAt: "08 Jan 2025",
    createdBy: "Finance Admin",
    updatedBy: "Finance Admin",
    hasTransactions: true,
    transactionCount: 65,
  },
  {
    divisionId: "DIV-004",
    divisionCode: "HOUSEKEEPING",
    divisionName: "Housekeeping",
    shortName: "HKP",
    divisionType: "Support Department",
    sequence: 4,
    status: "Active",
    description: "Room cleaning, linen management, public area hygiene, and floral upkeep.",
    companyId: "CMP-001",
    createdAt: "01 Apr 2024",
    updatedAt: "04 Jan 2025",
    createdBy: "Finance Admin",
    updatedBy: "Finance Admin",
    hasTransactions: true,
    transactionCount: 95,
  },
  {
    divisionId: "DIV-005",
    divisionCode: "ENGINEERING",
    divisionName: "Engineering & Maintenance",
    shortName: "ENG",
    divisionType: "Support Department",
    sequence: 5,
    status: "Active",
    description: "HVAC systems, electrical maintenance, plumbing, boilers, and property upkeep.",
    companyId: "CMP-001",
    createdAt: "01 Apr 2024",
    updatedAt: "03 Jan 2025",
    createdBy: "Finance Admin",
    updatedBy: "Finance Admin",
    hasTransactions: true,
    transactionCount: 110,
  },
  {
    divisionId: "DIV-006",
    divisionCode: "SALES",
    divisionName: "Sales & Marketing",
    shortName: "MKT",
    divisionType: "Administrative Department",
    sequence: 6,
    status: "Active",
    description: "Corporate contracts, digital advertising, travel trade promotions, and OTA distribution.",
    companyId: "CMP-001",
    createdAt: "01 Apr 2024",
    updatedAt: "02 Jan 2025",
    createdBy: "Finance Admin",
    updatedBy: "Finance Admin",
    hasTransactions: true,
    transactionCount: 50,
  },
  {
    divisionId: "DIV-007",
    divisionCode: "HR",
    divisionName: "Human Resources",
    shortName: "HR",
    divisionType: "Administrative Department",
    sequence: 7,
    status: "Active",
    description: "Recruitment, payroll administration, employee welfare, and staff training programs.",
    companyId: "CMP-001",
    createdAt: "01 Apr 2024",
    updatedAt: "02 Jan 2025",
    createdBy: "Finance Admin",
    updatedBy: "Finance Admin",
    hasTransactions: true,
    transactionCount: 85,
  },
  {
    divisionId: "DIV-008",
    divisionCode: "ADMIN",
    divisionName: "Administration",
    shortName: "ADM",
    divisionType: "Administrative Department",
    sequence: 8,
    status: "Active",
    description: "General executive management, legal counsel, insurance, and executive overheads.",
    companyId: "CMP-001",
    createdAt: "01 Apr 2024",
    updatedAt: "02 Jan 2025",
    createdBy: "Finance Admin",
    updatedBy: "Finance Admin",
    hasTransactions: false,
    transactionCount: 0,
  },
];
