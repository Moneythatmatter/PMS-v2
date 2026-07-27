export interface GRNItem {
  id: string;
  productCode: string;
  productName: string;
  category: string;
  orderedQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  unit: string;
  batchNumber: string;
  mfgDate?: string;
  expiryDate: string;
  storageBin: string;
  remarks?: string;
}

export interface GRNAttachment {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: string;
}

export interface QualityInspectionDetails {
  status: "Passed" | "Pending" | "Rejected" | "Under QC" | "Partially Accepted";
  inspector: string;
  inspectionDate: string;
  comments: string;
}

export interface GRNRecord {
  id: string;
  grnNumber: string;
  receiptDate: string;
  poNumber: string;
  supplierName: string;
  warehouse: string;
  itemCount: number;
  receivedBy: string;
  inspectionStatus: "Passed" | "Pending" | "Rejected" | "Under QC" | "Partially Accepted";
  status: "Received" | "Completed" | "Return" | "Pending" | "Approved";
  invoiceNumber: string;
  vehicleNumber: string;
  deliveryChallan: string;
  totalAmount: number;
  remarks?: string;
  items: GRNItem[];
  inspectionDetails: QualityInspectionDetails;
  attachments: GRNAttachment[];
  logs?: Array<{ timestamp: string; user: string; action: string; status: string }>;
}

export const INITIAL_GRN_RECORDS: GRNRecord[] = [
  {
    id: "grn-1",
    grnNumber: "GRN-2026-001",
    receiptDate: "15-Jul-2026",
    poNumber: "PO-2026-041",
    supplierName: "Amul Dairy",
    warehouse: "Central Cold Storage",
    itemCount: 12,
    totalAmount: 34650,
    receivedBy: "Suresh Chander",
    inspectionStatus: "Passed",
    status: "Approved",
    invoiceNumber: "INV-AMUL-998",
    vehicleNumber: "MH-04-AB-1234",
    deliveryChallan: "CHAL-8841",
    remarks: "Inspected and accepted at cold dock",
    items: [
      {
        id: "item-1",
        productCode: "FNB-DRY-01",
        productName: "Full Cream Fresh Milk 1L",
        category: "Dairy",
        orderedQty: 500,
        receivedQty: 500,
        acceptedQty: 500,
        rejectedQty: 0,
        unit: "Litres",
        batchNumber: "B-AML-8821",
        mfgDate: "2026-07-20",
        expiryDate: "2026-07-28",
        storageBin: "BIN-CHILL-D1-01",
        remarks: "Temperature checked: +3°C",
      },
    ],
    inspectionDetails: {
      status: "Passed",
      inspector: "Quality Auditor Anand",
      inspectionDate: "15-Jul-2026",
      comments: "All 500 litres in sound condition with intact seal.",
    },
    attachments: [
      { id: "att-1", fileName: "Vendor_Invoice_AMUL_998.pdf", fileSize: "1.4 MB", fileType: "pdf" },
      { id: "att-2", fileName: "Delivery_Challan_CHAL_8841.pdf", fileSize: "850 KB", fileType: "pdf" },
    ],
  },
  {
    id: "grn-2",
    grnNumber: "GRN-2026-002",
    receiptDate: "18-Jul-2026",
    poNumber: "PO-2026-042",
    supplierName: "Fresh Farms",
    warehouse: "Main Kitchen Store",
    itemCount: 8,
    totalAmount: 18400,
    receivedBy: "Chef Marco",
    inspectionStatus: "Pending",
    status: "Pending",
    invoiceNumber: "INV-FF-401",
    vehicleNumber: "DL-01-XY-9081",
    deliveryChallan: "CHAL-9902",
    remarks: "Produce receiving at kitchen bay",
    items: [
      {
        id: "item-2",
        productCode: "FNB-VEG-09",
        productName: "Exotic Baby Spinach (500g)",
        category: "Produce",
        orderedQty: 70,
        receivedQty: 70,
        acceptedQty: 70,
        rejectedQty: 0,
        unit: "Packs",
        batchNumber: "B-FF-1120",
        mfgDate: "2026-07-22",
        expiryDate: "2026-07-26",
        storageBin: "BIN-VEG-02",
        remarks: "Fresh green leaves",
      },
    ],
    inspectionDetails: {
      status: "Pending",
      inspector: "Unassigned",
      inspectionDate: "18-Jul-2026",
      comments: "Awaiting final freshness score.",
    },
    attachments: [
      { id: "att-3", fileName: "Fresh_Farms_Challan.pdf", fileSize: "920 KB", fileType: "pdf" },
    ],
  },
  {
    id: "grn-3",
    grnNumber: "GRN-2026-003",
    receiptDate: "20-Jul-2026",
    poNumber: "PO-2026-043",
    supplierName: "EcoClean",
    warehouse: "Housekeeping Store",
    itemCount: 15,
    totalAmount: 24500,
    receivedBy: "Priya Das",
    inspectionStatus: "Rejected",
    status: "Return",
    invoiceNumber: "INV-ECO-881",
    vehicleNumber: "KA-03-MC-4410",
    deliveryChallan: "CHAL-4412",
    remarks: "2 canisters leaking - rejected at dock",
    items: [
      {
        id: "item-3",
        productCode: "HK-CHM-05",
        productName: "Taski R2 All Surface Cleaner 5L",
        category: "Cleaning Chemicals",
        orderedQty: 15,
        receivedQty: 15,
        acceptedQty: 13,
        rejectedQty: 2,
        unit: "Canisters",
        batchNumber: "B-ECO-7741",
        mfgDate: "2026-06-01",
        expiryDate: "2028-06-01",
        storageBin: "BIN-CHEM-01",
        remarks: "2 damaged canisters returned to driver",
      },
    ],
    inspectionDetails: {
      status: "Rejected",
      inspector: "Priya Das",
      inspectionDate: "20-Jul-2026",
      comments: "Packaging leak detected on 2 units.",
    },
    attachments: [
      { id: "att-4", fileName: "EcoClean_Damage_Report.pdf", fileSize: "1.1 MB", fileType: "pdf" },
    ],
  },
];
