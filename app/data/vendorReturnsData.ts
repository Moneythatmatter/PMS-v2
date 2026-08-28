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
