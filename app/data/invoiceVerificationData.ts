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
  qtyDiscrepancy: number; // invoiceQty - grnQty
  priceDiscrepancy: number; // invoiceRate - poRate
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

export const INITIAL_INVOICE_RECORDS: InvoiceRecord[] = [
  {
    id: "inv-001",
    invoiceNumber: "INV-2026-9081",
    invoiceDate: "2026-07-21",
    vendorName: "ABC Linen Pvt Ltd",
    gstin: "07AAACB1234F1Z8",
    poNumber: "PO-2026-001",
    poValue: 80240,
    grnNumber: "GRN-2026-041",
    grnDate: "2026-07-20",
    invoiceAmount: 80240,
    poAmount: 80240,
    grnAmount: 80240,
    status: "Approved for Payment",
    verificationResult: "Matched",
    taxInvoiceNumber: "TXN-88124",
    buyerName: "Amit Sharma",
    department: "Housekeeping",
    paymentDueDate: "2026-08-20",
    matchLines: [
      { id: "ml-1", itemCode: "HK-LIN-001", description: "Bedsheet (King Size 300TC)", poQty: 200, poRate: 340, poAmount: 68000, grnQty: 200, grnStatus: "Pass", invoiceQty: 200, invoiceRate: 340, invoiceAmount: 68000, qtyDiscrepancy: 0, priceDiscrepancy: 0, isMatched: true },
      { id: "ml-2", itemCode: "HK-LIN-002", description: "Pillow Cover (Satin Finish)", poQty: 150, poRate: 90, poAmount: 13500, grnQty: 150, grnStatus: "Pass", invoiceQty: 150, invoiceRate: 90, invoiceAmount: 13500, qtyDiscrepancy: 0, priceDiscrepancy: 0, isMatched: true }
    ],
    exceptions: [],
    comments: "100% 3-Way Match verified between PO, GRN and Vendor Tax Invoice.",
    attachments: [
      { id: "ia-1", fileName: "Tax_Invoice_INV9081.pdf", fileSize: "450 KB", fileType: "pdf" },
      { id: "ia-2", fileName: "GRN_041_Signed.pdf", fileSize: "220 KB", fileType: "pdf" }
    ],
    approvalSignoff: [
      { level: "Store Auditor", reviewer: "Anand Gupta", action: "Matched & Passed", timestamp: "21 Jul 2026", note: "Zero variance" },
      { level: "Finance Manager", reviewer: "Suresh Menon", action: "Approved for Payment", timestamp: "21 Jul 2026", note: "Disbursement scheduled for 20 Aug" }
    ]
  },
  {
    id: "inv-002",
    invoiceNumber: "INV-2026-9412",
    invoiceDate: "2026-07-22",
    vendorName: "City Electricals Store",
    gstin: "07BBBCE5678J1Z9",
    poNumber: "PO-2026-009",
    poValue: 14160,
    grnNumber: "GRN-2026-055",
    grnDate: "2026-07-21",
    invoiceAmount: 16500,
    poAmount: 14160,
    grnAmount: 14160,
    status: "Pending Verification",
    verificationResult: "Mismatch",
    taxInvoiceNumber: "BILL-ELEC-902",
    buyerName: "Suresh Sharma",
    department: "Engineering",
    paymentDueDate: "2026-08-05",
    matchLines: [
      { id: "ml-3", itemCode: "ENG-ELEC-15", description: "LED Floodlight 150W (IP66)", poQty: 4, poRate: 2500, poAmount: 10000, grnQty: 4, grnStatus: "Pass", invoiceQty: 4, invoiceRate: 2900, invoiceAmount: 11600, qtyDiscrepancy: 0, priceDiscrepancy: 400, isMatched: false }
    ],
    exceptions: [
      { id: "ex-1", type: "Price Mismatch", severity: "Critical", description: "Vendor invoiced ₹2,900/unit vs PO rate of ₹2,500/unit.", impactAmount: 1600 },
      { id: "ex-2", type: "Tax Mismatch", severity: "Warning", description: "Tax calculated at 18% on higher unit rate.", impactAmount: 740 }
    ],
    comments: "Vendor applied unapproved price increase of ₹400 per LED Floodlight.",
    attachments: [
      { id: "ia-3", fileName: "Vendor_Invoice_Mismatch.pdf", fileSize: "310 KB", fileType: "pdf" }
    ],
    approvalSignoff: [
      { level: "Store Auditor", reviewer: "Anand Gupta", action: "Flagged Mismatch", timestamp: "22 Jul 2026", note: "Held for vendor credit note" }
    ]
  },
  {
    id: "inv-003",
    invoiceNumber: "INV-2026-9500",
    invoiceDate: "2026-07-22",
    vendorName: "Fresh Organics Pvt Ltd",
    gstin: "07AAACF1234H1Z5",
    poNumber: "PO-2026-012",
    poValue: 25000,
    grnNumber: "GRN-2026-060",
    grnDate: "2026-07-22",
    invoiceAmount: 21000,
    poAmount: 25000,
    grnAmount: 21000,
    status: "Pending Verification",
    verificationResult: "Partial Match",
    taxInvoiceNumber: "INV-FO-441",
    buyerName: "Chef Rajesh Kumar",
    department: "Kitchen / F&B",
    paymentDueDate: "2026-08-01",
    matchLines: [
      { id: "ml-4", itemCode: "FB-VEG-01", description: "Exotic Herbs Mix (500g)", poQty: 20, poRate: 450, poAmount: 9000, grnQty: 15, grnStatus: "Partial", invoiceQty: 15, invoiceRate: 450, invoiceAmount: 6750, qtyDiscrepancy: -5, priceDiscrepancy: 0, isMatched: true }
    ],
    exceptions: [
      { id: "ex-3", type: "Quantity Mismatch", severity: "Info", description: "Partial delivery received (15 of 20 units). Invoice billed only received quantity.", impactAmount: 0 }
    ],
    comments: "Partial delivery accepted per GRN. Invoice correctly reflects short delivery.",
    attachments: [],
    approvalSignoff: []
  }
];
