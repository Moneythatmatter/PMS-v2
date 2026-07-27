export interface PRRequestedItem {
  id: string;
  item: string;
  category: string;
  quantity: number;
  unit: string;
  estimatedPrice: number;
  total: number;
  remarks?: string;
}

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
  fileType: "pdf" | "xlsx" | "doc";
}

export interface PRComment {
  id: string;
  authorRole: string;
  authorName: string;
  commentText: string;
  timestamp: string;
}

export interface PurchaseRequisition {
  id: string;
  prNumber: string;
  department: string;
  requestedBy: string;
  requestDate: string;
  requiredDate: string;
  priority: "Low" | "Medium" | "High" | "Emergency";
  costCenter: string;
  estimatedAmount: number;
  currentApprover: string;
  status: "Draft" | "Pending Approval" | "Approved" | "Rejected" | "Cancelled";
  justification: string;
  requestedItems: PRRequestedItem[];
  approvalTimeline: PRApprovalStep[];
  attachments: PRAttachment[];
  comments: PRComment[];
}

export const ITEM_OPTIONS_LIST = [
  "Bedsheet",
  "Bath Towel",
  "Pillow Cover",
  "Blanket",
  "Cleaning Chemical",
] as const;

export const INITIAL_PURCHASE_REQUISITIONS: PurchaseRequisition[] = [
  {
    id: "pr-1",
    prNumber: "PR-2026-001",
    department: "Housekeeping",
    requestedBy: "Amit Sharma",
    requestDate: "18 Jul 2026",
    requiredDate: "25 Jul 2026",
    priority: "High",
    costCenter: "CC-HK-LINEN",
    estimatedAmount: 48500,
    currentApprover: "Purchase Manager",
    status: "Pending Approval",
    justification: "Current linen inventory has fallen below the minimum stock level before the upcoming holiday season. Additional stock is required to maintain operational readiness.",
    requestedItems: [
      {
        id: "item-1",
        item: "Bedsheet",
        category: "Linen",
        quantity: 100,
        unit: "Pieces",
        estimatedPrice: 350,
        total: 35000,
        remarks: "High thread count 300TC for suite rooms",
      },
      {
        id: "item-2",
        item: "Pillow Cover",
        category: "Linen",
        quantity: 150,
        unit: "Pieces",
        estimatedPrice: 90,
        total: 13500,
        remarks: "Satin finish white covers",
      },
    ],
    approvalTimeline: [
      { stage: "Created", approverName: "Amit Sharma", status: "Completed", timestamp: "18 Jul 2026 09:30 AM" },
      { stage: "Department Head", approverName: "Rajesh Verma", status: "Completed", timestamp: "18 Jul 2026 02:15 PM" },
      { stage: "Purchase Manager", approverName: "Sunil Mehta", status: "Current" },
      { stage: "Finance Manager", approverName: "Anil Kapoor", status: "Pending" },
      { stage: "General Manager", approverName: "Vikramaditya Roy", status: "Pending" },
    ],
    attachments: [
      { id: "att-1", fileName: "Specification.pdf", fileSize: "1.2 MB", fileType: "pdf" },
      { id: "att-2", fileName: "Requirement.xlsx", fileSize: "450 KB", fileType: "xlsx" },
    ],
    comments: [
      {
        id: "com-1",
        authorRole: "Department Head",
        authorName: "Rajesh Verma",
        commentText: "Approved.",
        timestamp: "18 Jul 2026 02:15 PM",
      },
      {
        id: "com-2",
        authorRole: "Purchase Manager",
        authorName: "Sunil Mehta",
        commentText: "Waiting for budget validation.",
        timestamp: "19 Jul 2026 10:00 AM",
      },
    ],
  },
  {
    id: "pr-2",
    prNumber: "PR-2026-002",
    department: "Engineering",
    requestedBy: "Rahul Singh",
    requestDate: "19 Jul 2026",
    requiredDate: "28 Jul 2026",
    priority: "Medium",
    costCenter: "CC-ENG-HVAC",
    estimatedAmount: 42000,
    currentApprover: "Finance Manager",
    status: "Approved",
    justification: "Replacement chillers and air filters for Floor 4 Central HVAC plant maintenance.",
    requestedItems: [
      {
        id: "item-3",
        item: "Blanket",
        category: "Linen",
        quantity: 20,
        unit: "Units",
        estimatedPrice: 1500,
        total: 30000,
        remarks: "Heavy duty thermal fleece",
      },
      {
        id: "item-4",
        item: "Cleaning Chemical",
        category: "Chemicals",
        quantity: 3,
        unit: "Canisters",
        estimatedPrice: 4000,
        total: 12000,
        remarks: "Taski R2 disinfectant concentrate",
      },
    ],
    approvalTimeline: [
      { stage: "Created", approverName: "Rahul Singh", status: "Completed", timestamp: "19 Jul 2026 08:00 AM" },
      { stage: "Department Head", approverName: "Sanjay Patel", status: "Completed", timestamp: "19 Jul 2026 11:30 AM" },
      { stage: "Purchase Manager", approverName: "Sunil Mehta", status: "Completed", timestamp: "19 Jul 2026 04:00 PM" },
      { stage: "Finance Manager", approverName: "Anil Kapoor", status: "Completed", timestamp: "20 Jul 2026 09:15 AM" },
      { stage: "General Manager", approverName: "Vikramaditya Roy", status: "Completed", timestamp: "20 Jul 2026 11:00 AM" },
    ],
    attachments: [
      { id: "att-3", fileName: "HVAC_Tech_Spec.pdf", fileSize: "2.4 MB", fileType: "pdf" },
      { id: "att-4", fileName: "Vendor_Quote_Draft.xlsx", fileSize: "680 KB", fileType: "xlsx" },
    ],
    comments: [
      {
        id: "com-3",
        authorRole: "Department Head",
        authorName: "Sanjay Patel",
        commentText: "Critical for summer peak load maintenance.",
        timestamp: "19 Jul 2026 11:30 AM",
      },
      {
        id: "com-4",
        authorRole: "Finance Manager",
        authorName: "Anil Kapoor",
        commentText: "Budget approved within Q3 engineering allocation.",
        timestamp: "20 Jul 2026 09:15 AM",
      },
    ],
  },
  {
    id: "pr-3",
    prNumber: "PR-2026-003",
    department: "Kitchen",
    requestedBy: "Chef Arjun",
    requestDate: "20 Jul 2026",
    requiredDate: "20 Jul 2026",
    priority: "Emergency",
    costCenter: "CC-FB-[#001]",
    estimatedAmount: 8700,
    currentApprover: "Purchase Manager",
    status: "Pending Approval",
    justification: "Emergency replenishment of fresh imported herbs and condiments for VIP diplomatic banquet tonight.",
    requestedItems: [
      {
        id: "item-5",
        item: "Bath Towel",
        category: "Bath Linen",
        quantity: 20,
        unit: "Pieces",
        estimatedPrice: 310,
        total: 6200,
        remarks: "750 GSM luxury plush white",
      },
      {
        id: "item-6",
        item: "Cleaning Chemical",
        category: "Chemicals",
        quantity: 1,
        unit: "Canister",
        estimatedPrice: 2500,
        total: 2500,
        remarks: "Food grade kitchen sanitizer",
      },
    ],
    approvalTimeline: [
      { stage: "Created", approverName: "Chef Arjun", status: "Completed", timestamp: "20 Jul 2026 07:30 AM" },
      { stage: "Department Head", approverName: "Executive Chef Marco", status: "Completed", timestamp: "20 Jul 2026 08:00 AM" },
      { stage: "Purchase Manager", approverName: "Sunil Mehta", status: "Current" },
      { stage: "Finance Manager", approverName: "Anil Kapoor", status: "Pending" },
      { stage: "General Manager", approverName: "Vikramaditya Roy", status: "Pending" },
    ],
    attachments: [
      { id: "att-5", fileName: "VIP_Menu_Requirement.pdf", fileSize: "890 KB", fileType: "pdf" },
      { id: "att-6", fileName: "Chef_Urgent_Memo.pdf", fileSize: "310 KB", fileType: "pdf" },
    ],
    comments: [
      {
        id: "com-5",
        authorRole: "Department Head",
        authorName: "Executive Chef Marco",
        commentText: "Urgent! Fast-track purchase needed for 7 PM banquet.",
        timestamp: "20 Jul 2026 08:00 AM",
      },
      {
        id: "com-6",
        authorRole: "Purchase Manager",
        authorName: "Sunil Mehta",
        commentText: "Fast-track vendor contacted for spot delivery.",
        timestamp: "20 Jul 2026 08:45 AM",
      },
    ],
  },
];
