export interface MatchComparisonLine {
  id: string;
  itemCode: string;
  description: string;
  poQty: number;
  poRate: number;
  poAmount: number;
  grnQty: number;
  grnStatus: "Pass" | "Fail" | "Partial";
  invoiceQty: number;
  invoiceRate: number;
  invoiceAmount: number;
  qtyDiscrepancy: number;
  priceDiscrepancy: number;
  isMatched: boolean;
}

export interface DiscrepancyException {
  id: string;
  type: "Quantity Mismatch" | "Price Mismatch" | "Tax Mismatch" | "Missing Goods Receipt";
  severity: "Critical" | "Warning" | "Info";
  description: string;
  impactAmount: number;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  vendorName: string;
  gstin: string;
  poNumber: string;
  poValue: number;
  grnNumber: string;
  grnDate: string;
  invoiceAmount: number;
  poAmount: number;
  grnAmount: number;
  status: "Pending Verification" | "Approved for Payment" | "Rejected" | "Draft";
  verificationResult: "Matched" | "Partial Match" | "Mismatch" | "Rejected" | "Approved";
  taxInvoiceNumber: string;
  buyerName: string;
  department: string;
  paymentDueDate: string;
  matchLines: MatchComparisonLine[];
  exceptions: DiscrepancyException[];
  comments: string;
  attachments: { id: string; fileName: string; fileSize: string; fileType: string }[];
  approvalSignoff: { level: string; reviewer: string; action: string; timestamp: string; note: string }[];
}
