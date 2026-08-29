export interface PRRequestedItem {
  id: string;
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
