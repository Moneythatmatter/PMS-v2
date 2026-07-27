export interface VRItem {
  id: string;
  productCode: string;
  productName: string;
  receivedQty: number;
  acceptedQty: number;
  returnQty: number;
  reason: "Damaged" | "Expired" | "Wrong Item" | "Quantity Mismatch" | "Quality Failure" | "Packaging Damage";
  batchNumber: string;
  mfgDate?: string;
  expiryDate: string;
  remarks?: string;
}

export interface VRAttachment {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: string;
}

export interface ReplacementDetails {
  replacementRequired: boolean;
  expectedDate?: string;
  status: "Pending" | "Dispatched" | "Received" | "Not Applicable";
  supplierResponse: string;
}

export interface VendorReturnRecord {
  id: string;
  returnNumber: string;
  returnDate: string;
  supplierName: string;
  grnNumber: string;
  inspectionNumber: string;
  poNumber: string;
  warehouse: string;
  itemsReturnedCount: number;
  returnReason: "Damaged Items" | "Expired Items" | "Wrong Product" | "Quality Failure" | "Packaging Damage" | "Quantity Mismatch";
  status: "Pending Pickup" | "Replacement Sent" | "Completed" | "Cancelled" | "Rejected";
  transportDetails: string;
  remarks?: string;
  items: VRItem[];
  replacementDetails: ReplacementDetails;
  attachments: VRAttachment[];
}

export const INITIAL_VENDOR_RETURN_RECORDS: VendorReturnRecord[] = [
  {
    id: "vr-1",
    returnNumber: "VR-2026-001",
    returnDate: "18-Jul-2026",
    supplierName: "Amul Dairy",
    grnNumber: "GRN-2026-011",
    inspectionNumber: "QI-2026-011",
    poNumber: "PO-2026-041",
    warehouse: "Main Warehouse",
    itemsReturnedCount: 3,
    returnReason: "Damaged Items",
    status: "Pending Pickup",
    transportDetails: "Vendor Logistics Van DL-01-AB-1234",
    remarks: "3 cartons of sour cream received with punctured foil lids.",
    items: [
      {
        id: "vri-1",
        productCode: "FNB-DRY-09",
        productName: "Gourmet Sour Cream 200g",
        receivedQty: 50,
        acceptedQty: 47,
        returnQty: 3,
        reason: "Packaging Damage",
        batchNumber: "B-AML-8821",
        expiryDate: "25-Jul-2026",
        remarks: "Punctured lids during transport",
      },
    ],
    replacementDetails: {
      replacementRequired: true,
      expectedDate: "20-Jul-2026",
      status: "Pending",
      supplierResponse: "Amul local distributor acknowledged return; replacement dispatch scheduled.",
    },
    attachments: [
      { id: "vra-1", fileName: "Amul_Return_Debit_Note.pdf", fileSize: "320 KB", fileType: "pdf" },
      { id: "vra-2", fileName: "Punctured_Lids_Photo.png", fileSize: "1.5 MB", fileType: "png" },
    ],
  },
  {
    id: "vr-2",
    returnNumber: "VR-2026-002",
    returnDate: "19-Jul-2026",
    supplierName: "Fresh Farms",
    grnNumber: "GRN-2026-012",
    inspectionNumber: "QI-2026-012",
    poNumber: "PO-2026-042",
    warehouse: "Kitchen Store",
    itemsReturnedCount: 8,
    returnReason: "Expired Items",
    status: "Replacement Sent",
    transportDetails: "Fresh Farms Express Pickup HR-55-XY-9081",
    remarks: "8 packs of imported herbs failed shelf-life requirement (< 2 days to expiry).",
    items: [
      {
        id: "vri-2",
        productCode: "FNB-VEG-15",
        productName: "Fresh Basil Leaves (250g)",
        receivedQty: 20,
        acceptedQty: 12,
        returnQty: 8,
        reason: "Expired",
        batchNumber: "B-FF-1120",
        mfgDate: "10-Jul-2026",
        expiryDate: "19-Jul-2026",
        remarks: "Near expiry date delivered",
      },
    ],
    replacementDetails: {
      replacementRequired: true,
      expectedDate: "20-Jul-2026",
      status: "Dispatched",
      supplierResponse: "Replacement fresh harvest batch dispatched from Azadpur farm hub.",
    },
    attachments: [
      { id: "vra-3", fileName: "FreshFarms_Replacement_Note.pdf", fileSize: "410 KB", fileType: "pdf" },
      { id: "vra-4", fileName: "Herb_Expiry_Photo.jpg", fileSize: "2.2 MB", fileType: "jpg" },
    ],
  },
  {
    id: "vr-3",
    returnNumber: "VR-2026-003",
    returnDate: "20-Jul-2026",
    supplierName: "EcoClean",
    grnNumber: "GRN-2026-013",
    inspectionNumber: "QI-2026-013",
    poNumber: "PO-2026-043",
    warehouse: "Housekeeping Store",
    itemsReturnedCount: 5,
    returnReason: "Wrong Product",
    status: "Completed",
    transportDetails: "EcoClean Return Carrier UP-14-CC-8090",
    remarks: "5 canisters of toilet cleaner delivered instead of glass polish.",
    items: [
      {
        id: "vri-3",
        productCode: "HK-CHM-08",
        productName: "Glass Polish Concentrated 5L",
        receivedQty: 5,
        acceptedQty: 0,
        returnQty: 5,
        reason: "Wrong Item",
        batchNumber: "B-ECO-7742",
        expiryDate: "01-Jun-2028",
        remarks: "Wrong product code dispatched by warehouse",
      },
    ],
    replacementDetails: {
      replacementRequired: false,
      expectedDate: "N/A",
      status: "Received",
      supplierResponse: "Full credit note CN-ECO-9081 issued by EcoClean finance team.",
    },
    attachments: [
      { id: "vra-5", fileName: "EcoClean_Credit_Note_9081.pdf", fileSize: "520 KB", fileType: "pdf" },
      { id: "vra-6", fileName: "Gate_Pass_RGP_Signed.pdf", fileSize: "310 KB", fileType: "pdf" },
    ],
  },
];
