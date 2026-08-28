export interface QIItem {
  id: string;
  productCode: string;
  productName: string;
  receivedQty: number;
  inspectedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  qualityResult: "Passed" | "Rejected" | "Partial" | "Partially Accepted";
  rejectionReason?: string;
  remarks?: string;
}

export interface QIChecklistItem {
  id?: string;
  checkItem: string;
  category?: string;
  result: "Pass" | "Fail" | string;
  notes?: string;
}

export interface QIAttachment {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: string;
}

export interface QualityInspectionRecord {
  id: string;
  inspectionNumber: string;
  inspectionDate: string;
  grnNumber: string;
  poNumber: string;
  supplierName: string;
  warehouse: string;
  inspectorName: string;
  itemsInspectedCount?: number;
  itemsCount?: number;
  result: "Passed" | "Pending" | "Rejected" | "Partially Accepted" | "Partial";
  status: "Completed" | "Pending" | "In Progress" | "Inspection Pending" | "Vendor Return" | "Draft";
  inspectionType: "Incoming GRN Receipt" | "Random Audit" | "Expiry Verification";
  priority: "High" | "Medium" | "Low";
  age: string;
  isOverdue?: boolean;
  generalRemarks?: string;
  remarks?: string;
  items: QIItem[];
  checklist: QIChecklistItem[];
  attachments: QIAttachment[];
  history?: Array<{ timestamp: string; user: string; action: string; status: string }>;
}
