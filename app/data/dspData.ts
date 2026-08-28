export interface DSPItem {
  id: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  unitRate: number;
  lineAmount: number;
}

export interface DSPAttachment {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: string;
}

export interface DSPRecord {
  id: string;
  dspNumber: string;
  purchaseDate: string;
  department: string;
  requesterName: string;
  paymentType: "Spot Cash" | "Corporate Card" | "Direct Credit";
  vendorName: string;
  gstin: string;
  receiptNumber: string;
  contactNumber: string;
  vendorAddress: string;
  storeLocation: string;
  receivingDate: string;
  receivedBy: string;
  storageBin: string;
  paymentMode: string;
  transactionRef: string;
  taxAmount: number;
  netAmount: number;
  totalAmount: number;
  status: "Draft" | "Pending Approval" | "Approved" | "Rejected";
  createdBy: string;
  items: DSPItem[];
  attachments: DSPAttachment[];
  remarks: string;
  activityTimeline: {
    stage: string;
    timestamp: string;
    note: string;
    author: string;
  }[];
}
