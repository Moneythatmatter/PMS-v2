export interface POLineItem {
  id: string;
  itemCode: string;
  itemDescription: string;
  category: string;
  quantity: number;
  unit: string;
  unitRate: number;
  taxPercent: number;
  totalAmount: number;
}

export interface PORecord {
  id: string;
  poNumber: string;
  orderDate: string;
  linkedPR: string;
  linkedRFQ?: string;
  department: string;
  buyerName: string;
  vendorName: string;
  contactPerson: string;
  gstin: string;
  vendorAddress: string;
  vendorPhone: string;
  shipToWarehouse: string;
  dockGate: string;
  expectedDeliveryDate: string;
  freightTerms: string;
  paymentTerms: string;
  paymentDueDays: number;
  discountPercent: number;
  currency: string;
  taxTerms: string;
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  status: "Draft" | "Pending Approval" | "Approved" | "Issued" | "Closed" | "Cancelled";
  items: POLineItem[];
  attachments: { id: string; fileName: string; fileSize: string; fileType: string }[];
  approvalHistory: { level: string; approver: string; action: string; timestamp: string; comments: string }[];
  activityTimeline: { stage: string; timestamp: string; note: string; author: string }[];
}

export const INITIAL_PO_RECORDS: PORecord[] = [
  {
    id: "po-001",
    poNumber: "PO-2026-001",
    orderDate: "2026-07-18",
    linkedPR: "PR-2026-001",
    linkedRFQ: "RFQ-2026-001",
    department: "Housekeeping",
    buyerName: "Amit Sharma",
    vendorName: "ABC Linen Pvt Ltd",
    contactPerson: "Rajesh Mittal",
    gstin: "07AAACB1234F1Z8",
    vendorAddress: "Plot 42, Okhla Industrial Area Phase 3, New Delhi",
    vendorPhone: "+91 98765 43210",
    shipToWarehouse: "Central Linen Warehouse",
    dockGate: "Receiving Dock 2",
    expectedDeliveryDate: "2026-07-25",
    freightTerms: "FOB Destination (Supplier Paid)",
    paymentTerms: "Net 30 Days post GRN & 3-Way Match",
    paymentDueDays: 30,
    discountPercent: 2,
    currency: "INR (₹)",
    taxTerms: "18% GST Included",
    subTotal: 68000,
    taxAmount: 12240,
    totalAmount: 80240,
    status: "Approved",
    items: [
      { id: "pli-1", itemCode: "HK-LIN-001", itemDescription: "Bedsheet (King Size 300TC)", category: "Linen", quantity: 200, unit: "Pieces", unitRate: 340, taxPercent: 18, totalAmount: 68000 },
      { id: "pli-2", itemCode: "HK-LIN-002", itemDescription: "Pillow Cover (Satin Finish)", category: "Linen", quantity: 150, unit: "Pieces", unitRate: 90, taxPercent: 18, totalAmount: 13500 }
    ],
    attachments: [
      { id: "pa-1", fileName: "ABC_Linen_Quotation_Approved.pdf", fileSize: "320 KB", fileType: "pdf" }
    ],
    approvalHistory: [
      { level: "Level 1", approver: "Store Manager", action: "Approved", timestamp: "18 Jul 2026", comments: "PR & RFQ verified" },
      { level: "Level 2", approver: "Finance Head", action: "Approved", timestamp: "19 Jul 2026", comments: "Budget allocated" }
    ],
    activityTimeline: [
      { stage: "PO Drafted", timestamp: "18 Jul 2026", note: "Generated from RFQ-2026-001", author: "Amit Sharma" },
      { stage: "PO Approved", timestamp: "19 Jul 2026", note: "Approved by Finance Head", author: "Finance Head" },
      { stage: "Issued to Vendor", timestamp: "19 Jul 2026", note: "Dispatched via Email & Supplier Portal", author: "System" }
    ]
  },
  {
    id: "po-002",
    poNumber: "PO-2026-002",
    orderDate: "2026-07-19",
    linkedPR: "PR-2026-002",
    department: "Engineering",
    buyerName: "Suresh Sharma",
    vendorName: "Daikin India Electronics",
    contactPerson: "Sunil Verma",
    gstin: "07AAACD9988G1Z4",
    vendorAddress: "Tower A, DLF Cyber City, Gurugram",
    vendorPhone: "+91 98100 44332",
    shipToWarehouse: "Engineering HVAC Store",
    dockGate: "Gate 4 Maintenance",
    expectedDeliveryDate: "2026-07-28",
    freightTerms: "Ex-Works (Hotel Arranged)",
    paymentTerms: "50% Advance, 50% on Delivery",
    paymentDueDays: 15,
    discountPercent: 0,
    currency: "INR (₹)",
    taxTerms: "18% GST extra",
    subTotal: 120000,
    taxAmount: 21600,
    totalAmount: 141600,
    status: "Pending Approval",
    items: [
      { id: "pli-3", itemCode: "ENG-HVAC-09", itemDescription: "VRV Compressor Unit 10HP", category: "HVAC", quantity: 2, unit: "Units", unitRate: 60000, taxPercent: 18, totalAmount: 120000 }
    ],
    attachments: [
      { id: "pa-2", fileName: "Daikin_Compressor_Specs.pdf", fileSize: "1.1 MB", fileType: "pdf" }
    ],
    approvalHistory: [
      { level: "Level 1", approver: "Chief Engineer", action: "Approved", timestamp: "19 Jul 2026", comments: "Urgent HVAC repair" },
      { level: "Level 2", approver: "General Manager", action: "Pending", timestamp: "19 Jul 2026", comments: "Awaiting final approval" }
    ],
    activityTimeline: [
      { stage: "PO Drafted", timestamp: "19 Jul 2026", note: "Drafted by Duty Engineer", author: "Suresh Sharma" },
      { stage: "Submitted for Approval", timestamp: "19 Jul 2026", note: "Sent to GM Queue", author: "System" }
    ]
  },
  {
    id: "po-003",
    poNumber: "PO-2026-003",
    orderDate: "2026-07-20",
    linkedPR: "PR-2026-003",
    department: "Kitchen / F&B",
    buyerName: "Rajesh Kumar",
    vendorName: "Gourmet Foods Imports",
    contactPerson: "Marco Rossi",
    gstin: "07AAACG5544H1Z6",
    vendorAddress: "Vasant Kunj, New Delhi",
    vendorPhone: "+91 98111 22334",
    shipToWarehouse: "Cold Storage Kitchen Dock",
    dockGate: "Kitchen Gate 1",
    expectedDeliveryDate: "2026-07-22",
    freightTerms: "Refrigerated Transport Included",
    paymentTerms: "Net 15 Days",
    paymentDueDays: 15,
    discountPercent: 5,
    currency: "INR (₹)",
    taxTerms: "12% GST Included",
    subTotal: 45000,
    taxAmount: 5400,
    totalAmount: 50400,
    status: "Closed",
    items: [
      { id: "pli-4", itemCode: "FB-GRM-04", itemDescription: "Fresh Black Truffle Oil (500ml)", category: "Gourmet", quantity: 10, unit: "Bottles", unitRate: 4500, taxPercent: 12, totalAmount: 45000 }
    ],
    attachments: [],
    approvalHistory: [
      { level: "Level 1", approver: "F&B Director", action: "Approved", timestamp: "20 Jul 2026", comments: "Approved for fine dining" }
    ],
    activityTimeline: [
      { stage: "PO Issued", timestamp: "20 Jul 2026", note: "Issued to vendor", author: "Rajesh Kumar" },
      { stage: "GRN & Invoice Matched", timestamp: "22 Jul 2026", note: "GRN-2026-881 verified", author: "Store Inspector" },
      { stage: "Closed", timestamp: "22 Jul 2026", note: "Payment disbursed", author: "Accounts Payable" }
    ]
  }
];
