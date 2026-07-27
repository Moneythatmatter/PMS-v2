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

export const INITIAL_QUALITY_INSPECTION_RECORDS: QualityInspectionRecord[] = [
  {
    id: "qi-2",
    inspectionNumber: "QI-2026-002",
    inspectionDate: "25-Jul-2026",
    grnNumber: "GRN-2026-012",
    poNumber: "PO-2026-042",
    supplierName: "Fresh Farms India Pvt. Ltd.",
    warehouse: "Main Kitchen Store",
    inspectorName: "Rahul Sharma",
    itemsInspectedCount: 1,
    itemsCount: 1,
    result: "Pending",
    status: "Pending",
    priority: "High",
    age: "2 Hours",
    isOverdue: false,
    inspectionType: "Incoming GRN Receipt",
    generalRemarks: "Perishable leafy vegetables received at dock. Cold chain inspection required immediately.",
    remarks: "Pending QC auditor sign-off.",
    items: [
      {
        id: "qi-item-2",
        productCode: "FNB-VEG-09",
        productName: "Exotic Baby Spinach (500g)",
        receivedQty: 70,
        inspectedQty: 70,
        acceptedQty: 70,
        rejectedQty: 0,
        qualityResult: "Passed",
        remarks: "Fresh green leaves",
      },
    ],
    checklist: [
      { id: "c1", category: "Packaging & Seal Verification", checkItem: "Packaging Condition", result: "Pass" },
      { id: "c2", category: "Packaging & Seal Verification", checkItem: "Seal Integrity", result: "Pass" },
    ],
    attachments: [],
    history: [
      { timestamp: "25-Jul-2026 11:30 AM", user: "GRN System", action: "Inspection automatically created from GRN-2026-012", status: "Success" },
    ],
  },
  {
    id: "qi-4",
    inspectionNumber: "QI-2026-004",
    inspectionDate: "24-Jul-2026",
    grnNumber: "GRN-2026-014",
    poNumber: "PO-2026-044",
    supplierName: "ABC Linen Pvt Ltd",
    warehouse: "Central Linen Warehouse",
    inspectorName: "Anand Verma",
    itemsInspectedCount: 150,
    itemsCount: 1,
    result: "Pending",
    status: "In Progress",
    priority: "High",
    age: "1 Day",
    isOverdue: true,
    inspectionType: "Incoming GRN Receipt",
    generalRemarks: "Thread count and GSM testing under process.",
    remarks: "Thread count check in progress.",
    items: [
      {
        id: "qi-item-4",
        productCode: "HK-LIN-01",
        productName: "King Bed Sheets 300TC Cotton",
        receivedQty: 150,
        inspectedQty: 100,
        acceptedQty: 100,
        rejectedQty: 0,
        qualityResult: "Passed",
        remarks: "100 sheets checked",
      },
    ],
    checklist: [
      { id: "c1", category: "Packaging & Seal Verification", checkItem: "Packaging Condition", result: "Pass" },
    ],
    attachments: [],
    history: [
      { timestamp: "24-Jul-2026 09:00 AM", user: "GRN System", action: "Inspection automatically created from GRN-2026-014", status: "Success" },
    ],
  },
  {
    id: "qi-1",
    inspectionNumber: "QI-2026-001",
    inspectionDate: "15-Jul-2026",
    grnNumber: "GRN-2026-011",
    poNumber: "PO-2026-041",
    supplierName: "Amul Dairy Products Ltd.",
    warehouse: "Central Cold Storage",
    inspectorName: "Rahul Sharma",
    itemsInspectedCount: 12,
    itemsCount: 1,
    result: "Passed",
    status: "Completed",
    priority: "Medium",
    age: "10 Days",
    isOverdue: false,
    inspectionType: "Incoming GRN Receipt",
    generalRemarks: "All milk pouches & butter cartons inspected for temperature compliance and sealed packaging.",
    remarks: "Passed dock sampling.",
    items: [
      {
        id: "qi-item-1",
        productCode: "FNB-DRY-01",
        productName: "Full Cream Fresh Milk 1L",
        receivedQty: 500,
        inspectedQty: 500,
        acceptedQty: 500,
        rejectedQty: 0,
        qualityResult: "Passed",
        remarks: "Temperature checked: +3°C",
      },
    ],
    checklist: [
      { id: "c1", category: "Packaging & Seal Verification", checkItem: "Packaging Condition", result: "Pass" },
      { id: "c2", category: "Packaging & Seal Verification", checkItem: "Seal Integrity", result: "Pass" },
      { id: "c3", category: "Expiry & Storage", checkItem: "Expiry & FEFO Check", result: "Pass" },
      { id: "c4", category: "Temperature & Quality", checkItem: "Cold Chain Temperature", result: "Pass" },
    ],
    attachments: [
      { id: "att-1", fileName: "Cold_Dock_Temp_Log_25Jul.pdf", fileSize: "1.1 MB", fileType: "pdf" },
    ],
    history: [
      { timestamp: "15-Jul-2026 10:00 AM", user: "Rahul Sharma", action: "Quality Inspection Completed (Passed)", status: "Success" },
    ],
  },
  {
    id: "qi-3",
    inspectionNumber: "QI-2026-003",
    inspectionDate: "20-Jul-2026",
    grnNumber: "GRN-2026-013",
    poNumber: "PO-2026-043",
    supplierName: "EcoClean Hygiene Solutions Ltd.",
    warehouse: "Housekeeping Store",
    inspectorName: "Priya Das",
    itemsInspectedCount: 15,
    itemsCount: 1,
    result: "Rejected",
    status: "Completed",
    priority: "Low",
    age: "5 Days",
    isOverdue: false,
    inspectionType: "Incoming GRN Receipt",
    generalRemarks: "2 chemical canisters leaking - rejected at dock.",
    remarks: "Packaging leak detected.",
    items: [
      {
        id: "qi-item-3",
        productCode: "HK-CHM-05",
        productName: "Taski R2 All Surface Cleaner 5L",
        receivedQty: 15,
        inspectedQty: 15,
        acceptedQty: 13,
        rejectedQty: 2,
        qualityResult: "Rejected",
        rejectionReason: "Damaged Packaging",
        remarks: "2 damaged canisters flagged for Vendor Return",
      },
    ],
    checklist: [
      { id: "c1", category: "Packaging & Seal Verification", checkItem: "Packaging Condition", result: "Fail" },
      { id: "c2", category: "Packaging & Seal Verification", checkItem: "Seal Integrity", result: "Fail" },
    ],
    attachments: [
      { id: "att-3", fileName: "EcoClean_Damage_Report.pdf", fileSize: "1.1 MB", fileType: "pdf" },
    ],
    history: [
      { timestamp: "20-Jul-2026 02:15 PM", user: "Priya Das", action: "Quality Inspection Completed (Rejected 2 units)", status: "Success" },
    ],
  },
];
