export type TransactionType =
  | "Opening Stock"
  | "GRN"
  | "Department Issue"
  | "Stock Transfer In"
  | "Stock Transfer Out"
  | "Vendor Return"
  | "Internal Return"
  | "Stock Adjustment"
  | "Physical Count"
  | "Scrap"
  | "Closing Stock";

export interface StockLedgerRecord {
  id: string;
  transactionDate: string; // e.g. "2026-07-24 10:30 AM"
  transactionNo: string; // e.g. "SL-2026-001"
  referenceNo: string; // e.g. "GRN-2026-041"
  transactionType: TransactionType;
  itemCode: string; // e.g. "HK-LIN-001"
  itemName: string; // e.g. "Bedsheet (King Size 300TC)"
  category: string; // e.g. "Linen"
  warehouse: string; // e.g. "Central Linen Warehouse"
  store: string; // e.g. "Housekeeping Main Store"
  department: string; // e.g. "Housekeeping"
  supplier: string; // e.g. "ABC Linen Pvt Ltd"
  batchNo: string; // e.g. "B-ABC-9901"
  unit: string; // e.g. "Pieces"
  stockIn: number;
  stockOut: number;
  openingBalance: number;
  balanceQty: number; // running balance
  unitCost: number; // e.g. 350
  transactionValue: number; // e.g. 70000
  remarks: string;
  createdBy: string;
  approvedBy: string;
  status: "Completed" | "Verified" | "Adjusted" | "Flagged";
  linkedDocs: {
    grnNo?: string;
    poNo?: string;
    issueSlipNo?: string;
    transferNoteNo?: string;
    vendorReturnNo?: string;
  };
  attachments: { id: string; fileName: string; fileSize: string; fileType: string }[];
}

export const INITIAL_STOCK_LEDGER_RECORDS: StockLedgerRecord[] = [
  {
    id: "sl-001",
    transactionDate: "2026-07-24 09:15 AM",
    transactionNo: "SL-2026-8801",
    referenceNo: "GRN-2026-041",
    transactionType: "GRN",
    itemCode: "HK-LIN-001",
    itemName: "Bedsheet (King Size 300TC)",
    category: "Housekeeping Linen",
    warehouse: "Central Linen Warehouse",
    store: "Main Housekeeping Store",
    department: "Housekeeping",
    supplier: "ABC Linen Pvt Ltd",
    batchNo: "B-ABC-9901",
    unit: "Pieces",
    stockIn: 200,
    stockOut: 0,
    openingBalance: 50,
    balanceQty: 250,
    unitCost: 350,
    transactionValue: 70000,
    remarks: "Bulk delivery received against PO-2026-001",
    createdBy: "Amit Sharma",
    approvedBy: "Store Manager Anand",
    status: "Completed",
    linkedDocs: { grnNo: "GRN-2026-041", poNo: "PO-2026-001" },
    attachments: [{ id: "sla-1", fileName: "GRN_041_Delivery.pdf", fileSize: "420 KB", fileType: "pdf" }],
  },
  {
    id: "sl-002",
    transactionDate: "2026-07-24 11:30 AM",
    transactionNo: "SL-2026-8802",
    referenceNo: "ISS-2026-104",
    transactionType: "Department Issue",
    itemCode: "HK-LIN-001",
    itemName: "Bedsheet (King Size 300TC)",
    category: "Housekeeping Linen",
    warehouse: "Central Linen Warehouse",
    store: "Floor 4 Linen Pantry",
    department: "Housekeeping",
    supplier: "ABC Linen Pvt Ltd",
    batchNo: "B-ABC-9901",
    unit: "Pieces",
    stockIn: 0,
    stockOut: 45,
    openingBalance: 250,
    balanceQty: 205,
    unitCost: 350,
    transactionValue: 15750,
    remarks: "Daily floor replenishment for Executive Suites",
    createdBy: "Supervisor Priya",
    approvedBy: "Executive Housekeeper",
    status: "Completed",
    linkedDocs: { issueSlipNo: "ISS-2026-104" },
    attachments: [{ id: "sla-2", fileName: "Issue_Requisition_104.pdf", fileSize: "280 KB", fileType: "pdf" }],
  },
  {
    id: "sl-003",
    transactionDate: "2026-07-23 04:00 PM",
    transactionNo: "SL-2026-8803",
    referenceNo: "TRF-2026-022",
    transactionType: "Stock Transfer Out",
    itemCode: "FNB-DRY-01",
    itemName: "Full Cream Fresh Milk 1L",
    category: "F&B Dairy",
    warehouse: "Main Cold Room Warehouse",
    store: "Banquet Kitchen Cold Store",
    department: "Kitchen / F&B",
    supplier: "Amul Dairy",
    batchNo: "B-AML-8821",
    unit: "Litres",
    stockIn: 0,
    stockOut: 100,
    openingBalance: 500,
    balanceQty: 400,
    unitCost: 66,
    transactionValue: 6600,
    remarks: "Inter-store transfer to banquet kitchen for diplomatic dinner",
    createdBy: "Chef Marco",
    approvedBy: "F&B Director",
    status: "Completed",
    linkedDocs: { transferNoteNo: "TRF-2026-022" },
    attachments: [],
  },
];
