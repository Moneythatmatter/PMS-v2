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

export const INITIAL_DSP_RECORDS: DSPRecord[] = [
  {
    id: "dsp-001",
    dspNumber: "DSP-2026-001",
    purchaseDate: "2026-07-20",
    department: "Kitchen / F&B",
    requesterName: "Chef Rajesh Kumar",
    paymentType: "Spot Cash",
    vendorName: "Fresh Organics Pvt Ltd",
    gstin: "07AAACF1234H1Z5",
    receiptNumber: "RCP-88412",
    contactNumber: "+91 98112 33445",
    vendorAddress: "Shop 14, Azadpur Mandi, New Delhi",
    storeLocation: "Main Kitchen Cold Storage",
    receivingDate: "2026-07-20",
    receivedBy: "Receiving Executive",
    storageBin: "BIN-COLD-04",
    paymentMode: "Petty Cash",
    transactionRef: "PC-TXN-9041",
    taxAmount: 450,
    netAmount: 8500,
    totalAmount: 8950,
    status: "Approved",
    createdBy: "Rajesh Kumar",
    items: [
      { id: "di-1", itemName: "Exotic Herbs Mix (500g)", category: "Fresh Produce", quantity: 10, unit: "Packs", unitRate: 450, lineAmount: 4500 },
      { id: "di-2", itemName: "Imported Edible Flowers", category: "Gourmet", quantity: 5, unit: "Boxes", unitRate: 800, lineAmount: 4000 },
    ],
    attachments: [
      { id: "da-1", fileName: "Cash_Receipt_RCP88412.pdf", fileSize: "180 KB", fileType: "pdf" }
    ],
    remarks: "Emergency purchase for VIP banquet dinner.",
    activityTimeline: [
      { stage: "Purchase Created", timestamp: "20 Jul 2026", note: "Purchased using petty cash", author: "Rajesh Kumar" },
      { stage: "GRN Verified", timestamp: "20 Jul 2026", note: "Verified at Store Gate", author: "Store Manager" },
      { stage: "Approved", timestamp: "20 Jul 2026", note: "Petty cash reimbursed", author: "Finance Controller" }
    ]
  },
  {
    id: "dsp-002",
    dspNumber: "DSP-2026-002",
    purchaseDate: "2026-07-21",
    department: "Engineering",
    requesterName: "Suresh Sharma",
    paymentType: "Corporate Card",
    vendorName: "City Electricals Store",
    gstin: "07BBBCE5678J1Z9",
    receiptNumber: "INV-2026-990",
    contactNumber: "+91 98450 11223",
    vendorAddress: "Block B, Connaught Place, New Delhi",
    storeLocation: "Engineering Maintenance Store",
    receivingDate: "2026-07-21",
    receivedBy: "Duty Engineer",
    storageBin: "BIN-ELEC-12",
    paymentMode: "HDFC Corp Card",
    transactionRef: "CC-AUTH-77312",
    taxAmount: 2160,
    netAmount: 12000,
    totalAmount: 14160,
    status: "Pending Approval",
    createdBy: "Suresh Sharma",
    items: [
      { id: "di-3", itemName: "LED Floodlight 150W (IP66)", category: "Electrical", quantity: 4, unit: "Units", unitRate: 2500, lineAmount: 10000 },
      { id: "di-4", itemName: "MCB 32A Triple Pole", category: "Electrical", quantity: 4, unit: "Pieces", unitRate: 500, lineAmount: 2000 },
    ],
    attachments: [
      { id: "da-2", fileName: "City_Electricals_Invoice.pdf", fileSize: "310 KB", fileType: "pdf" }
    ],
    remarks: "Immediate replacement required for garden illumination breakdown.",
    activityTimeline: [
      { stage: "Purchase Created", timestamp: "21 Jul 2026", note: "Purchased via Corp Card", author: "Suresh Sharma" },
      { stage: "Pending Approval", timestamp: "21 Jul 2026", note: "Awaiting Chief Engineer Approval", author: "System" }
    ]
  },
  {
    id: "dsp-003",
    dspNumber: "DSP-2026-003",
    purchaseDate: "2026-07-22",
    department: "Housekeeping",
    requesterName: "Amit Sharma",
    paymentType: "Direct Credit",
    vendorName: "Sparkle Chemical Agency",
    gstin: "07AAACS9988K1Z2",
    receiptNumber: "BILL-5541",
    contactNumber: "+91 97110 55667",
    vendorAddress: "Lajpat Nagar, New Delhi",
    storeLocation: "Housekeeping Central Chemical Store",
    receivingDate: "2026-07-22",
    receivedBy: "HK Supervisor",
    storageBin: "BIN-CHEM-02",
    paymentMode: "Direct Vendor Credit 7 Days",
    transactionRef: "CR-NOTE-5541",
    taxAmount: 1080,
    netAmount: 6000,
    totalAmount: 7080,
    status: "Draft",
    createdBy: "Amit Sharma",
    items: [
      { id: "di-5", itemName: "Marble Polish Compound (5L)", category: "Chemicals", quantity: 2, unit: "Cans", unitRate: 3000, lineAmount: 6000 }
    ],
    attachments: [],
    remarks: "Urgent floor polishing ahead of conference.",
    activityTimeline: [
      { stage: "Draft Created", timestamp: "22 Jul 2026", note: "Draft record initiated", author: "Amit Sharma" }
    ]
  }
];
