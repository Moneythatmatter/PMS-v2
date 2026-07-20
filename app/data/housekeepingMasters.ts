export interface MasterCategory {
  id: string;
  name: string;
  iconName: string;
  description: string;
  masters: {
    id: string;
    code: string;
    name: string;
    recordCount: number;
    description: string;
    dependentModules: string[];
  }[];
}

export interface MasterRecord {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  categoryName: string;
  subCategory: string;
  status: "Active" | "Inactive" | "Draft" | "Archived";
  lastUpdated: string;
  updatedBy: string;
  version: string;
  description: string;
  properties: Record<string, string>;
  dependencies: {
    moduleName: string;
    usageType: "Primary Lookup" | "Validation Rule" | "Calculation Engine" | "Reference Only";
    activeUsageCount: number;
  }[];
  syncInfo: {
    sourceSystem: string;
    lastSync: string;
    nextSync: string;
    status: "Synced" | "Pending" | "Failed";
    affectedModulesCount: number;
  };
  remarks?: string;
}

export interface MasterSyncStatus {
  id: string;
  systemName: string;
  integrationType: "HRMS" | "ERP Inventory" | "Finance & Accounting" | "PMS Core";
  lastSync: string;
  nextSync: string;
  status: "Healthy" | "Syncing" | "Warning" | "Error";
  syncedRecords: number;
  failedRecords: number;
  affectedModules: string[];
}

export interface MasterAuditLog {
  id: string;
  timestamp: string;
  user: string;
  masterTable: string;
  recordCode: string;
  action: "Created" | "Updated" | "Deactivated" | "Activated" | "Synced";
  oldValue: string;
  newValue: string;
  remarks: string;
}

export const MASTER_CATEGORIES_DATA: MasterCategory[] = [
  {
    id: "property",
    name: "Property Configuration",
    iconName: "Building2",
    description: "Physical structure, floors, wings, areas and room master metadata",
    masters: [
      { id: "building", code: "MST-BLD", name: "Building Master", recordCount: 4, description: "Hotel towers and auxiliary structures", dependentModules: ["Room Cleaning", "Public Area", "Inspection", "Maintenance"] },
      { id: "wing", code: "MST-WNG", name: "Wing Master", recordCount: 8, description: "East, West, Executive & Presidential Wings", dependentModules: ["Room Cleaning", "Public Area", "Inspection"] },
      { id: "floor", code: "MST-FLR", name: "Floor Master", recordCount: 12, description: "Floor levels and elevator zone assignments", dependentModules: ["Room Cleaning", "Public Area", "Inspection", "Luggage"] },
      { id: "area", code: "MST-ARA", name: "Area Master", recordCount: 18, description: "Public lobbies, restaurants, spa & pool zones", dependentModules: ["Public Area", "Deep Cleaning", "Maintenance"] },
      { id: "room", code: "MST-RM", name: "Room Master", recordCount: 120, description: "Guest room numbers, floor maps and layouts", dependentModules: ["Room Cleaning", "Inspection", "Lost & Found", "Maintenance", "Damage Reports"] },
      { id: "room-type", code: "MST-RMT", name: "Room Type Master", recordCount: 8, description: "Standard, Deluxe, Executive Suite, Villa", dependentModules: ["Room Cleaning", "Inspection", "Requisitions"] },
    ],
  },
  {
    id: "workforce",
    name: "Workforce",
    iconName: "Users",
    description: "Staff rosters, shift timings, team hierarchies and assignment rules",
    masters: [
      { id: "staff", code: "MST-STF", name: "Staff Master", recordCount: 45, description: "Housekeepers, Supervisors, Inspectors & Attendants", dependentModules: ["Room Cleaning", "Public Area", "Inspection", "Laundry", "Luggage"] },
      { id: "shift", code: "MST-SFT", name: "Shift Master", recordCount: 4, description: "Morning, Evening, Night & General Shifts", dependentModules: ["Room Cleaning", "Public Area", "Inspection"] },
      { id: "team", code: "MST-TM", name: "Team Master", recordCount: 6, description: "Floor Teams, Deep Clean Crew & Public Area Squad", dependentModules: ["Room Cleaning", "Deep Cleaning"] },
      { id: "role", code: "MST-ROL", name: "Role Master", recordCount: 8, description: "Housekeeper, Supervisor, Executive Housekeeper", dependentModules: ["All Housekeeping Modules"] },
      { id: "assign-rules", code: "MST-ARL", name: "Assignment Rules Master", recordCount: 5, description: "Auto-assignment algorithms and credit limits", dependentModules: ["Room Cleaning", "Maintenance"] },
    ],
  },
  {
    id: "cleaning",
    name: "Cleaning Operations",
    iconName: "Sparkles",
    description: "Task types, frequencies, SLA targets, checklists and version controls",
    masters: [
      { id: "clean-type", code: "MST-CLT", name: "Cleaning Type Master", recordCount: 7, description: "Checkout Clean, Stayover, Touch-up, Deep Clean", dependentModules: ["Room Cleaning", "Deep Cleaning"] },
      { id: "frequency", code: "MST-FRQ", name: "Frequency Master", recordCount: 6, description: "Daily, Twice Daily, Weekly, Monthly, Quarterly", dependentModules: ["Public Area", "Deep Cleaning"] },
      { id: "priority", code: "MST-PRY", name: "Priority Master", recordCount: 4, description: "Critical, High, Medium, Low urgency tiers", dependentModules: ["All Operational Sections"] },
      { id: "checklist", code: "MST-CHK", name: "Checklist Master", recordCount: 14, description: "Standard operating procedure inspection items", dependentModules: ["Room Cleaning", "Inspection", "Public Area", "Deep Cleaning"] },
      { id: "chk-versions", code: "MST-CHV", name: "Checklist Version Master", recordCount: 22, description: "Historical and active SOP checklist revisions", dependentModules: ["Inspection", "Audit Logs"] },
      { id: "sla", code: "MST-SLA", name: "SLA Master", recordCount: 10, description: "Target completion times per cleaning task", dependentModules: ["Room Cleaning", "Maintenance", "Guest Requests"] },
    ],
  },
  {
    id: "inventory",
    name: "Inventory & Chemicals",
    iconName: "Package",
    description: "Linens, chemicals, equipment, MSDS safety sheets and lifecycle rules",
    masters: [
      { id: "item", code: "MST-ITM", name: "Item Master", recordCount: 85, description: "Amenities, towels, bedsheets, guest supplies", dependentModules: ["Laundry", "Requisitions", "Lost & Found"] },
      { id: "item-cat", code: "MST-ICA", name: "Category Master", recordCount: 12, description: "Linen, Guest Amenity, Cleaning Chemical, Paper", dependentModules: ["Inventory", "Requisitions"] },
      { id: "unit", code: "MST-UNT", name: "Unit Master", recordCount: 8, description: "Pcs, Pairs, Liters, Kg, Boxes, Canisters", dependentModules: ["Inventory", "Requisitions", "Chemicals"] },
      { id: "equipment", code: "MST-EQP", name: "Equipment Master", recordCount: 24, description: "Vacuum cleaners, polishers, steam jets, carts", dependentModules: ["Deep Cleaning", "Public Area", "Maintenance"] },
      { id: "chemical", code: "MST-CHM", name: "Chemical Master", recordCount: 16, description: "Diversey R1-R9, disinfectants & degreasers", dependentModules: ["Room Cleaning", "Deep Cleaning", "Public Area"] },
      { id: "msds", code: "MST-MSD", name: "Chemical MSDS Safety Master", recordCount: 16, description: "OSHA safety hazard documents & dilution ratios", dependentModules: ["Deep Cleaning", "Public Area"] },
      { id: "linen-life", code: "MST-LNL", name: "Linen Lifecycle Master", recordCount: 10, description: "Wash-cycle thresholds and ragging rules", dependentModules: ["Laundry", "Inventory", "Requisitions"] },
    ],
  },
  {
    id: "services",
    name: "Guest Services",
    iconName: "ConciergeBell",
    description: "Laundry tariffs, Lost & Found vaults, luggage bays, damage pricing",
    masters: [
      { id: "laundry-svc", code: "MST-LND", name: "Laundry Services Master", recordCount: 18, description: "Dry cleaning, pressing, washing price tiers", dependentModules: ["Laundry"] },
      { id: "lf-storage", code: "MST-LFS", name: "Lost & Found Storage Master", recordCount: 8, description: "Security lockers, safes, perishable holding bins", dependentModules: ["Lost & Found"] },
      { id: "luggage-bay", code: "MST-LGB", name: "Luggage Storage Master", recordCount: 6, description: "Bell desk holding bays and VIP luggage racks", dependentModules: ["Luggage"] },
      { id: "damage-cat", code: "MST-DMC", name: "Damage Categories Master", recordCount: 9, description: "Electronics, Furniture, Linen, Glass, Flooring", dependentModules: ["Damage Reports"] },
      { id: "damage-tariff", code: "MST-DMT", name: "Damage Tariffs Master", recordCount: 35, description: "Standard guest recovery charge price catalog", dependentModules: ["Damage Reports", "Finance"] },
      { id: "amenity-std", code: "MST-AST", name: "Room Amenity Standards Master", recordCount: 8, description: "Standard par setup per room category (BOM)", dependentModules: ["Room Cleaning", "Requisitions"] },
    ],
  },
  {
    id: "financial",
    name: "Financial",
    iconName: "Landmark",
    description: "Cost centers, budget allocations and charge type classifications",
    masters: [
      { id: "cost-center", code: "MST-CST", name: "Cost Center Master", recordCount: 12, description: "CC-HK-GUEST, CC-HK-PUBLIC, CC-LAUNDRY", dependentModules: ["Requisitions", "Damage Reports"] },
      { id: "budget-cat", code: "MST-BDG", name: "Budget Categories Master", recordCount: 8, description: "Linen Replenishment, Chemical Supply, Hardware", dependentModules: ["Requisitions"] },
      { id: "charge-type", code: "MST-CHG", name: "Charge Types Master", recordCount: 6, description: "Folio Direct Charge, Post Departure, Insurance", dependentModules: ["Damage Reports", "Laundry"] },
    ],
  },
  {
    id: "compliance",
    name: "Compliance",
    iconName: "ShieldCheck",
    description: "Quality thresholds, OOO reason codes, escalation matrix and templates",
    masters: [
      { id: "inspect-thresh", code: "MST-ITH", name: "Inspection Thresholds Master", recordCount: 5, description: "Quality pass cutoffs (≥90%) & auto-reject rules", dependentModules: ["Room Inspection"] },
      { id: "ooo-reason", code: "MST-OOO", name: "OOO/OOS Reason Codes Master", recordCount: 14, description: "Standard system hold codes & SLA resolution hours", dependentModules: ["Room Cleaning", "Maintenance", "Deep Cleaning"] },
      { id: "notify-tpl", code: "MST-NTF", name: "Notification Templates Master", recordCount: 12, description: "SMS, Email & Push notification message templates", dependentModules: ["Guest Requests", "Damage Reports"] },
      { id: "escalation", code: "MST-ESC", name: "Escalation Matrix Master", recordCount: 6, description: "SLA breach notification escalation hierarchies", dependentModules: ["Maintenance", "Guest Requests"] },
    ],
  },
  {
    id: "administration",
    name: "Administration",
    iconName: "Sliders",
    description: "External contractors, system status codes, document attachments",
    masters: [
      { id: "vendors", code: "MST-VND", name: "Vendors & Partners Master", recordCount: 15, description: "Laundry hubs, pest control & repair contractors", dependentModules: ["Laundry", "Deep Cleaning", "Damage Reports"] },
      { id: "status-codes", code: "MST-STS", name: "Status Codes Master", recordCount: 24, description: "Universal housekeeping status code registry", dependentModules: ["All Housekeeping Modules"] },
      { id: "doc-templates", code: "MST-DOC", name: "Document Templates Master", recordCount: 8, description: "Gate pass, requisition slips, damage notices", dependentModules: ["Requisitions", "Damage Reports"] },
      { id: "attachment-type", code: "MST-ATT", name: "Attachment Types Master", recordCount: 6, description: "Evidence photos, invoices, inspection PDFs", dependentModules: ["Damage Reports", "Deep Cleaning"] },
    ],
  },
];

export const INITIAL_MASTER_RECORDS: MasterRecord[] = [
  {
    id: "REC-101",
    code: "RM-305",
    name: "Room 305 (Executive Suite)",
    categoryId: "property",
    categoryName: "Property Configuration",
    subCategory: "Room Master",
    status: "Active",
    lastUpdated: "2026-07-20 10:30 AM",
    updatedBy: "Admin User",
    version: "v2.4",
    description: "Executive Corner Suite with Jacuzzi & Ocean View balcony",
    properties: {
      "Room Category": "Executive Suite",
      "Floor": "3rd Floor",
      "Wing": "Presidential East Wing",
      "Key Lock Type": "RFID Smart Card",
      "Max Occupancy": "2 Adults + 1 Child",
      "Bed Type": "King Size Plush",
    },
    dependencies: [
      { moduleName: "Room Cleaning", usageType: "Primary Lookup", activeUsageCount: 412 },
      { moduleName: "Room Inspection", usageType: "Validation Rule", activeUsageCount: 180 },
      { moduleName: "Damage Reports", usageType: "Reference Only", activeUsageCount: 3 },
      { moduleName: "Lost & Found", usageType: "Reference Only", activeUsageCount: 8 },
    ],
    syncInfo: {
      sourceSystem: "PMS Core Engine",
      lastSync: "2026-07-20 08:00 AM",
      nextSync: "2026-07-21 08:00 AM",
      status: "Synced",
      affectedModulesCount: 5,
    },
    remarks: "Primary suite configured with VIP priority SLA.",
  },
  {
    id: "REC-102",
    code: "STF-088",
    name: "Meena Kumari",
    categoryId: "workforce",
    categoryName: "Workforce",
    subCategory: "Staff Master",
    status: "Active",
    lastUpdated: "2026-07-19 04:15 PM",
    updatedBy: "Ramesh Kumar",
    version: "v1.8",
    description: "Senior Housekeeping Attendant - Floor 3 & 4 Lead",
    properties: {
      "Employee ID": "EMP-99104",
      "Designation": "Senior Housekeeper",
      "Shift Assigned": "Morning Shift (07:00 AM - 03:30 PM)",
      "Primary Area": "3rd Floor West Wing",
      "Credit Capacity": "14 Credits / Shift",
      "Mobile Contact": "+91 98765 43210",
    },
    dependencies: [
      { moduleName: "Room Cleaning", usageType: "Primary Lookup", activeUsageCount: 245 },
      { moduleName: "Laundry", usageType: "Reference Only", activeUsageCount: 14 },
      { moduleName: "Public Area", usageType: "Primary Lookup", activeUsageCount: 38 },
    ],
    syncInfo: {
      sourceSystem: "HRMS Enterprise",
      lastSync: "2026-07-20 06:00 AM",
      nextSync: "2026-07-20 06:00 PM",
      status: "Synced",
      affectedModulesCount: 4,
    },
    remarks: "Certified in luxury suite sanitization & chemical safety.",
  },
  {
    id: "REC-103",
    code: "CHK-SOP-01",
    name: "Executive Suite Checkout Cleaning SOP",
    categoryId: "cleaning",
    categoryName: "Cleaning Operations",
    subCategory: "Checklist Master",
    status: "Active",
    lastUpdated: "2026-07-18 11:20 AM",
    updatedBy: "Meena Kumari",
    version: "v3.1",
    description: "24-Point Comprehensive Checkout Sanitization Procedure",
    properties: {
      "Total Checklist Items": "24 Tasks",
      "Est. Completion Time": "45 Minutes",
      "Mandatory Evidence Photos": "Bathroom + Bedding + Minibar",
      "Quality Pass Cutoff": "92%",
      "Chemical Dilution Ref": "Taski R1/R2 Standard",
    },
    dependencies: [
      { moduleName: "Room Cleaning", usageType: "Validation Rule", activeUsageCount: 520 },
      { moduleName: "Room Inspection", usageType: "Primary Lookup", activeUsageCount: 310 },
      { moduleName: "Deep Cleaning", usageType: "Reference Only", activeUsageCount: 45 },
    ],
    syncInfo: {
      sourceSystem: "Housekeeping Master Engine",
      lastSync: "2026-07-20 10:00 AM",
      nextSync: "2026-07-20 10:00 PM",
      status: "Synced",
      affectedModulesCount: 3,
    },
    remarks: "Updated with COVID-19 UV light wand sanitization step.",
  },
  {
    id: "REC-104",
    code: "CHM-R2-DIV",
    name: "Taski R2 All-Purpose Disinfectant",
    categoryId: "inventory",
    categoryName: "Inventory & Chemicals",
    subCategory: "Chemical MSDS Safety Master",
    status: "Active",
    lastUpdated: "2026-07-15 02:40 PM",
    updatedBy: "Admin User",
    version: "v1.2",
    description: "Hygienic Hard Surface Cleaner & Sanitizer Concentrate",
    properties: {
      "Manufacturer": "Diversey Commercial Hygiene",
      "Dilution Ratio": "20ml per 1 Liter Water",
      "PPE Requirement": "Nitrile Gloves + Eye Goggles",
      "Hazard Class": "Class 8 Mild Corrosive",
      "Reorder Min Level": "25 Liters",
      "Stock Unit": "5L Canister",
    },
    dependencies: [
      { moduleName: "Room Cleaning", usageType: "Calculation Engine", activeUsageCount: 890 },
      { moduleName: "Deep Cleaning", usageType: "Primary Lookup", activeUsageCount: 120 },
      { moduleName: "Public Area", usageType: "Primary Lookup", activeUsageCount: 340 },
      { moduleName: "Requisitions", usageType: "Validation Rule", activeUsageCount: 28 },
    ],
    syncInfo: {
      sourceSystem: "ERP Inventory Module",
      lastSync: "2026-07-20 09:30 AM",
      nextSync: "2026-07-21 09:30 AM",
      status: "Synced",
      affectedModulesCount: 4,
    },
    remarks: "MSDS Sheet PDF attached to record file v2.0.",
  },
  {
    id: "REC-105",
    code: "DMT-TV-55",
    name: "55 Inch Smart LED TV Replacement Tariff",
    categoryId: "services",
    categoryName: "Guest Services",
    subCategory: "Damage Tariffs Master",
    status: "Active",
    lastUpdated: "2026-07-12 09:00 AM",
    updatedBy: "Admin User",
    version: "v2.0",
    description: "Standard guest recovery penalty tariff for damaged TV screen",
    properties: {
      "Recovery Price": "₹45,000 INR",
      "Auto Folio Charge": "Enabled (Instant Charge)",
      "Depreciation Value": "₹38,000 INR",
      "Waiver Approval Authority": "General Manager Only",
      "Category": "Electronics / AV",
    },
    dependencies: [
      { moduleName: "Damage Reports", usageType: "Calculation Engine", activeUsageCount: 12 },
      { moduleName: "Front Office Billing", usageType: "Validation Rule", activeUsageCount: 12 },
    ],
    syncInfo: {
      sourceSystem: "Finance Tariff Engine",
      lastSync: "2026-07-20 07:00 AM",
      nextSync: "2026-07-21 07:00 AM",
      status: "Synced",
      affectedModulesCount: 2,
    },
    remarks: "Includes wall bracket replacement and installation surcharge.",
  },
  {
    id: "REC-106",
    code: "OOO-PLM-LEAK",
    name: "Severe Plumbing & Water Pipe Leakage",
    categoryId: "compliance",
    categoryName: "Compliance",
    subCategory: "OOO/OOS Reason Codes Master",
    status: "Active",
    lastUpdated: "2026-07-10 03:00 PM",
    updatedBy: "Ramesh Kumar",
    version: "v1.5",
    description: "Out of Order hold code blocking room sale during major leaks",
    properties: {
      "Hold Type": "Out of Order (Unsellable)",
      "SLA Resolution Target": "24 Hours",
      "Engineering Category": "Plumbing & Drainage",
      "Requires Supervisor Signoff": "Yes",
      "Auto Notification": "Executive Housekeeper + GM",
    },
    dependencies: [
      { moduleName: "Room Cleaning", usageType: "Validation Rule", activeUsageCount: 65 },
      { moduleName: "Maintenance", usageType: "Primary Lookup", activeUsageCount: 45 },
      { moduleName: "Deep Cleaning", usageType: "Reference Only", activeUsageCount: 8 },
    ],
    syncInfo: {
      sourceSystem: "PMS Core Engine",
      lastSync: "2026-07-20 08:30 AM",
      nextSync: "2026-07-21 08:30 AM",
      status: "Synced",
      affectedModulesCount: 3,
    },
    remarks: "Requires mandatory water pressure re-test before releasing room.",
  },
  {
    id: "REC-107",
    code: "VND-METRO-LND",
    name: "Metropolitan Commercial Laundry Hub",
    categoryId: "administration",
    categoryName: "Administration",
    subCategory: "Vendors & Partners Master",
    status: "Active",
    lastUpdated: "2026-07-14 05:30 PM",
    updatedBy: "Admin User",
    version: "v4.0",
    description: "External off-site commercial laundry service provider",
    properties: {
      "Vendor GSTIN": "27AAACM1029F1Z8",
      "Contract Expiry": "2027-12-31",
      "Turnaround SLA": "24 Hours Express / 48 Hours Standard",
      "Daily Capacity": "1,500 Kg",
      "Contact Person": "Suresh Deshmukh (+91 98111 22334)",
    },
    dependencies: [
      { moduleName: "Laundry", usageType: "Primary Lookup", activeUsageCount: 340 },
      { moduleName: "Requisitions", usageType: "Reference Only", activeUsageCount: 15 },
    ],
    syncInfo: {
      sourceSystem: "ERP Procurement",
      lastSync: "2026-07-20 07:15 AM",
      nextSync: "2026-07-21 07:15 AM",
      status: "Synced",
      affectedModulesCount: 2,
    },
    remarks: "Contract renewed for FY2026-27 with thermal wash addendum.",
  },
  {
    id: "REC-108",
    code: "CC-HK-GUEST",
    name: "Guest Supplies Cost Center",
    categoryId: "financial",
    categoryName: "Financial",
    subCategory: "Cost Center Master",
    status: "Active",
    lastUpdated: "2026-07-01 09:00 AM",
    updatedBy: "Admin User",
    version: "v1.0",
    description: "Direct operating budget cost center for room guest amenities",
    properties: {
      "Financial Code": "CC-4010-HK",
      "Annual Budget Allocation": "₹45,000,000 INR",
      "Department": "Housekeeping - Guest Rooms",
      "Approver Role": "Executive Housekeeper",
    },
    dependencies: [
      { moduleName: "Requisitions", usageType: "Primary Lookup", activeUsageCount: 512 },
      { moduleName: "Damage Reports", usageType: "Calculation Engine", activeUsageCount: 38 },
    ],
    syncInfo: {
      sourceSystem: "Finance ERP (SAP)",
      lastSync: "2026-07-20 05:00 AM",
      nextSync: "2026-07-21 05:00 AM",
      status: "Synced",
      affectedModulesCount: 2,
    },
    remarks: "Q3 budget variance currently within +2% target buffer.",
  },
];

export const MASTER_SYNC_STATUSES: MasterSyncStatus[] = [
  {
    id: "SYNC-01",
    systemName: "HRMS Enterprise Employee Sync",
    integrationType: "HRMS",
    lastSync: "2026-07-20 06:00 AM",
    nextSync: "2026-07-20 06:00 PM",
    status: "Healthy",
    syncedRecords: 45,
    failedRecords: 0,
    affectedModules: ["Room Cleaning", "Public Area", "Inspection", "Laundry", "Luggage"],
  },
  {
    id: "SYNC-02",
    systemName: "SAP ERP Inventory & Chemical Sync",
    integrationType: "ERP Inventory",
    lastSync: "2026-07-20 09:30 AM",
    nextSync: "2026-07-21 09:30 AM",
    status: "Healthy",
    syncedRecords: 142,
    failedRecords: 0,
    affectedModules: ["Requisitions", "Deep Cleaning", "Laundry", "Public Area"],
  },
  {
    id: "SYNC-03",
    systemName: "Finance & Cost Center Ledger Sync",
    integrationType: "Finance & Accounting",
    lastSync: "2026-07-20 07:00 AM",
    nextSync: "2026-07-21 07:00 AM",
    status: "Healthy",
    syncedRecords: 48,
    failedRecords: 0,
    affectedModules: ["Requisitions", "Damage Reports", "Laundry"],
  },
  {
    id: "SYNC-04",
    systemName: "PMS Core Room & Status Sync Engine",
    integrationType: "PMS Core",
    lastSync: "2026-07-20 10:15 AM",
    nextSync: "2026-07-20 10:30 AM",
    status: "Healthy",
    syncedRecords: 120,
    failedRecords: 0,
    affectedModules: ["All Housekeeping Modules"],
  },
];

export const MASTER_AUDIT_LOGS: MasterAuditLog[] = [
  {
    id: "AUD-801",
    timestamp: "2026-07-20 10:30 AM",
    user: "Admin User",
    masterTable: "Room Master (MST-RM)",
    recordCode: "RM-305",
    action: "Updated",
    oldValue: "Key Lock: Magnetic Card",
    newValue: "Key Lock: RFID Smart Card",
    remarks: "Upgraded room door lock hardware to RFID standard.",
  },
  {
    id: "AUD-802",
    timestamp: "2026-07-20 09:15 AM",
    user: "Meena Kumari",
    masterTable: "Checklist Master (MST-CHK)",
    recordCode: "CHK-SOP-01",
    action: "Updated",
    oldValue: "Version v3.0 (22 Tasks)",
    newValue: "Version v3.1 (24 Tasks)",
    remarks: "Added UV light wand sanitization step for executive suites.",
  },
  {
    id: "AUD-803",
    timestamp: "2026-07-19 04:15 PM",
    user: "Ramesh Kumar",
    masterTable: "Staff Master (MST-STF)",
    recordCode: "STF-088",
    action: "Updated",
    oldValue: "Shift: General",
    newValue: "Shift: Morning Shift",
    remarks: "Assigned Meena Kumari as Morning Shift Lead.",
  },
  {
    id: "AUD-804",
    timestamp: "2026-07-18 02:00 PM",
    user: "Admin User",
    masterTable: "Vendors Master (MST-VND)",
    recordCode: "VND-METRO-LND",
    action: "Activated",
    oldValue: "Status: Pending Review",
    newValue: "Status: Active",
    remarks: "Contract renewed for FY2026-27 with Metropolitan Laundry Hub.",
  },
  {
    id: "AUD-805",
    timestamp: "2026-07-17 11:45 AM",
    user: "Sanjay Patel",
    masterTable: "Damage Tariffs Master (MST-DMT)",
    recordCode: "DMT-TV-55",
    action: "Created",
    oldValue: "—",
    newValue: "₹45,000 INR (55\" TV Screen Replacement)",
    remarks: "Configured standard penalty tariff for 55\" Smart LED TVs.",
  },
  {
    id: "AUD-806",
    timestamp: "2026-07-15 10:00 AM",
    user: "Ramesh Kumar",
    masterTable: "OOO Reason Codes Master (MST-OOO)",
    recordCode: "OOO-PLM-LEAK",
    action: "Created",
    oldValue: "—",
    newValue: "Severe Plumbing & Water Pipe Leakage (24h SLA)",
    remarks: "Added standard OOO hold code for plumbing emergencies.",
  },
];
