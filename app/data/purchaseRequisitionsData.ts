/** One row of `purchase_requisition_items`. */
export interface PRRequestedItem {
  id: string;
  lineNo?: number;
  /** ps_products.id */
  materialId?: string;
  /** Product Master code (e.g. PRD-LIN-001) */
  productCode?: string;
  item: string;
  category: string;
  quantity: number;
  unit: string;
  estimatedPrice: number;
  total: number;
  remarks?: string;
  approvedQty?: number | null;
  /** Maintained by the backend from linked purchase orders. */
  orderedQty?: number;
  /** Maintained by the backend from QC-passed GRNs (stock posted). */
  receivedQty?: number;
  /** Store stock when the line was last saved. */
  stockOnHand?: number | null;
  requiredDate?: string | null;
}

/** Module a requisition was raised from (`purchase_requisitions.source_module`). */
export const PR_SOURCE_MODULES = [
  "Front Office",
  "Housekeeping",
  "Food & Beverage",
  "Kitchen",
  "Maintenance",
  "Human Resources",
  "Accounts",
  "Sales & Marketing",
  "Security",
  "Purchase & Stores",
] as const;

export type PRSourceModule = (typeof PR_SOURCE_MODULES)[number];

export interface PRApprovalStep {
  stage: string;
  approverName: string;
  status: "Completed" | "Current" | "Pending" | "Rejected";
  timestamp?: string;
}

export interface PRAttachment {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: "pdf" | "xlsx" | "doc" | "image";
  /** Base64 data URL for in-app preview after save */
  dataUrl?: string;
  mimeType?: string;
}

export interface PRComment {
  id: string;
  authorRole: string;
  authorName: string;
  commentText: string;
  timestamp: string;
}

export const PR_STATUSES = [
  "Draft",
  "Pending Approval",
  "Approved",
  "In Sourcing",
  "Partially Ordered",
  "Closed",
  "Rejected",
  "Cancelled",
] as const;

export type PRStatus = (typeof PR_STATUSES)[number];

/** Set by the backend from linked RFQs / POs; cannot be chosen manually. */
export const SYSTEM_PR_STATUSES: readonly PRStatus[] = ["In Sourcing", "Partially Ordered", "Closed"];

export interface PRItemFulfillment {
  prItemId: string;
  item: string;
  unit: string;
  requested: number;
  ordered: number;
  remaining: number;
}

/** GET /requisitions/fulfillment — ordered vs remaining quantity per PR. */
export interface PRFulfillment {
  prId: string;
  prNumber: string;
  status: PRStatus;
  derivedStatus: PRStatus;
  items: PRItemFulfillment[];
  totalRequested: number;
  totalOrdered: number;
  totalRemaining: number;
  openRfq: { id: string; rfqNumber: string; status: string } | null;
  rfqs: { id: string; rfqNumber: string; status: string }[];
  purchaseOrders: { id: string; poNumber: string; status: string }[];
  canCreateRfq: boolean;
  canCreatePo: boolean;
}

export function remainingByPrItemId(fulfillment?: PRFulfillment | null): Record<string, number> | undefined {
  if (!fulfillment) return undefined;
  return Object.fromEntries(fulfillment.items.map((i) => [i.prItemId, i.remaining]));
}

export interface PurchaseRequisition {
  id: string;
  prNumber: string;
  sourceModule?: PRSourceModule;
  /** e.g. work order / damage report number the request was raised against */
  sourceReference?: string;
  deliveryWarehouseId?: string | null;
  submittedAt?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string;
  department: string;
  requestedBy: string;
  requestDate: string;
  requiredDate: string;
  priority: "Low" | "Medium" | "High" | "Emergency";
  costCenter: string;
  estimatedAmount: number;
  currentApprover: string;
  status: PRStatus;
  justification: string;
  requestedItems: PRRequestedItem[];
  approvalTimeline: PRApprovalStep[];
  attachments: PRAttachment[];
  comments: PRComment[];
}

export interface DepartmentStaff {
  department: string;
  costCenters: { code: string; name: string }[];
  employees: { name: string; designation: string }[];
}

export const DEPARTMENT_STAFF_DATA: DepartmentStaff[] = [
  {
    department: "Housekeeping",
    costCenters: [
      { code: "CC-HK-LINEN", name: "CC-HK-LINEN (Housekeeping Linen Dept)" },
      { code: "CC-HK-GUEST", name: "CC-HK-GUEST (Guest Room Amenities)" },
      { code: "CC-HK-CHEM", name: "CC-HK-CHEM (Cleaning Chemicals & Sanitation)" },
    ],
    employees: [
      { name: "Amit Sharma", designation: "Housekeeping Supervisor" },
      { name: "Anjali Sharma", designation: "Executive Housekeeper" },
      { name: "Sunita Patel", designation: "Floor Supervisor" },
    ],
  },
  {
    department: "Kitchen / Culinary",
    costCenters: [
      { code: "CC-FB-KITCHEN", name: "CC-FB-KITCHEN (Main Kitchen Operating)" },
      { code: "CC-FB-PASTRY", name: "CC-FB-PASTRY (Bakery & Pastry Unit)" },
      { code: "CC-FB-BANQUET", name: "CC-FB-BANQUET (Banquet & Events Culinary)" },
    ],
    employees: [
      { name: "Chef Arjun", designation: "Executive Chef" },
      { name: "Chef Vikramjit Singh", designation: "Executive Sous Chef" },
      { name: "Deepak Chawla", designation: "Commi 1 (Pastry)" },
    ],
  },
  {
    department: "F&B Service",
    costCenters: [
      { code: "CC-FB-REST", name: "CC-FB-REST (All-Day Dining Restaurant)" },
      { code: "CC-FB-BAR", name: "CC-FB-BAR (Lounge & Beverage Bar)" },
      { code: "CC-FB-ROOMSVC", name: "CC-FB-ROOMSVC (In-Room Dining)" },
    ],
    employees: [
      { name: "Priya Nair", designation: "Restaurant Supervisor" },
      { name: "Arun Joshi", designation: "Captain / Waiter" },
    ],
  },
  {
    department: "Engineering",
    costCenters: [
      { code: "CC-ENG-HVAC", name: "CC-ENG-HVAC (Engineering HVAC Maintenance)" },
      { code: "CC-ENG-ELEC", name: "CC-ENG-ELEC (Electrical & Lighting)" },
      { code: "CC-ENG-PLUMB", name: "CC-ENG-PLUMB (Plumbing & Water Treatment)" },
    ],
    employees: [
      { name: "Rahul Singh", designation: "Assistant Chief Engineer" },
      { name: "Suresh Babu", designation: "Chief Engineer" },
    ],
  },
  {
    department: "Front Office",
    costCenters: [
      { code: "CC-FO-DESK", name: "CC-FO-DESK (Front Desk & Reception)" },
      { code: "CC-FO-CONC", name: "CC-FO-CONC (Concierge & Bell Desk)" },
    ],
    employees: [
      { name: "Rajesh Kumar", designation: "Front Desk Manager" },
      { name: "Ramesh Verma", designation: "Night Auditor" },
    ],
  },
  {
    department: "Human Resources",
    costCenters: [
      { code: "CC-HR-ADMIN", name: "CC-HR-ADMIN (HR & Employee Welfare)" },
      { code: "CC-HR-TRAIN", name: "CC-HR-TRAIN (Staff Training & Development)" },
    ],
    employees: [
      { name: "Meenakshi Sundaram", designation: "HR Executive" },
      { name: "Kavita Rao", designation: "HR Director" },
    ],
  },
  {
    department: "Accounts & Finance",
    costCenters: [
      { code: "CC-ACC-GEN", name: "CC-ACC-GEN (Finance & Audit)" },
      { code: "CC-ACC-PAYROLL", name: "CC-ACC-PAYROLL (Payroll & Disbursements)" },
    ],
    employees: [
      { name: "Anil Kapoor", designation: "Finance Manager" },
      { name: "Sneha Reddy", designation: "Accounts Officer" },
    ],
  },
  {
    department: "Sales & Marketing",
    costCenters: [
      { code: "CC-SM-SALES", name: "CC-SM-SALES (Sales & Business Development)" },
      { code: "CC-SM-MKT", name: "CC-SM-MKT (Marketing & Brand Collateral)" },
    ],
    employees: [
      { name: "Nikhil Arora", designation: "Director of Sales" },
      { name: "Ritu Malhotra", designation: "Marketing Manager" },
    ],
  },
  {
    department: "Purchase & Stores",
    costCenters: [
      { code: "CC-PUR-MAIN", name: "CC-PUR-MAIN (Central Procurement & Stores)" },
      { code: "CC-STR-WH01", name: "CC-STR-WH01 (Central Linen & General Warehouse)" },
    ],
    employees: [
      { name: "Sunil Mehta", designation: "Purchase Manager" },
      { name: "Manoj Gupta", designation: "Store Keeper" },
    ],
  },
  {
    department: "Security & Safety",
    costCenters: [
      { code: "CC-SEC-MAIN", name: "CC-SEC-MAIN (Security & CCTV Surveillance)" },
    ],
    employees: [
      { name: "Ranjit Singh", designation: "Chief Security Officer" },
      { name: "Balwinder Singh", designation: "Security Supervisor" },
    ],
  },
];

export const ITEM_OPTIONS_LIST = [
  "Bedsheet",
  "Bath Towel",
  "Pillow Cover",
  "Blanket",
  "Cleaning Chemical",
] as const;
