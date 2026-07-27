export type ExpiryStatus =
  | "Fresh"
  | "FEFO Recommended"
  | "Near Expiry"
  | "Expiring Soon"
  | "Expired"
  | "Blocked"
  | "Disposed";

export interface BatchMovementLog {
  timestamp: string;
  action: string;
  user: string;
  qty: number;
  location: string;
}

export interface BatchRecord {
  id: string;
  batchNumber: string;
  itemCode: string;
  itemName: string;
  category: string;
  warehouse: string;
  zone: string;
  rack: string;
  shelf: string;
  bin: string;
  supplier: string;
  grnNumber: string;
  poNumber: string;
  mfgDate: string;
  expiryDate: string;
  totalShelfLifeDays: number;
  daysRemaining: number;
  availableQty: number;
  reservedQty: number;
  issuedQty: number;
  unitCost: number;
  stockValue: number;
  unit: string;
  status: ExpiryStatus;
  isFEFORecommended: boolean;
  qualityPassed: boolean;
  qrCode: string;
  barcode: string;
  movements: BatchMovementLog[];
}

export const INITIAL_BATCH_RECORDS: BatchRecord[] = [
  {
    id: "bat-1",
    batchNumber: "B-AML-8821",
    itemCode: "FNB-DRY-01",
    itemName: "Full Cream Fresh Milk 1L",
    category: "Dairy",
    warehouse: "Central Cold Storage",
    zone: "Dairy Chiller Bay (+3°C)",
    rack: "Rack D",
    shelf: "Shelf D1",
    bin: "BIN-CHILL-D1-01",
    supplier: "Amul Dairy",
    grnNumber: "GRN-2026-001",
    poNumber: "PO-2026-041",
    mfgDate: "2026-07-20",
    expiryDate: "2026-07-28",
    totalShelfLifeDays: 8,
    daysRemaining: 3,
    availableQty: 500,
    reservedQty: 50,
    issuedQty: 150,
    unitCost: 66,
    stockValue: 33000,
    unit: "Litres",
    status: "Expiring Soon",
    isFEFORecommended: true,
    qualityPassed: true,
    qrCode: "QR-BAT-AML-8821",
    barcode: "BAR-BAT-AML-8821",
    movements: [
      { timestamp: "2026-07-20 09:00 AM", action: "Goods Received (GRN-2026-001)", user: "Rahul Sharma", qty: 700, location: "Receiving Bay 01" },
      { timestamp: "2026-07-20 10:30 AM", action: "Quality Inspection Passed", user: "Quality Officer Anand", qty: 700, location: "Lab Bay" },
      { timestamp: "2026-07-20 11:00 AM", action: "Stored in Cold Chiller", user: "Suresh Chander", qty: 700, location: "BIN-CHILL-D1-01" },
      { timestamp: "2026-07-22 08:00 AM", action: "Issued to Main Kitchen", user: "Chef Marco", qty: 150, location: "Main Kitchen" },
    ],
  },
  {
    id: "bat-2",
    batchNumber: "B-FF-1120",
    itemCode: "FNB-VEG-09",
    itemName: "Exotic Baby Spinach (500g)",
    category: "Produce",
    warehouse: "Main Kitchen Store",
    zone: "Veg Storage Zone",
    rack: "Rack V",
    shelf: "Shelf V1",
    bin: "BIN-VEG-02",
    supplier: "Fresh Farms",
    grnNumber: "GRN-2026-002",
    poNumber: "PO-2026-042",
    mfgDate: "2026-07-22",
    expiryDate: "2026-07-26",
    totalShelfLifeDays: 4,
    daysRemaining: 1,
    availableQty: 40,
    reservedQty: 10,
    issuedQty: 20,
    unitCost: 180,
    stockValue: 7200,
    unit: "Packs",
    status: "Near Expiry",
    isFEFORecommended: true,
    qualityPassed: true,
    qrCode: "QR-BAT-FF-1120",
    barcode: "BAR-BAT-FF-1120",
    movements: [
      { timestamp: "2026-07-22 07:00 AM", action: "Goods Received (GRN-2026-002)", user: "Ajay Singh", qty: 70, location: "Kitchen Dock" },
      { timestamp: "2026-07-22 09:00 AM", action: "Issued to Banquet Prep", user: "Priya Das", qty: 20, location: "Banquet Kitchen" },
    ],
  },
  {
    id: "bat-3",
    batchNumber: "B-ECO-7741",
    itemCode: "HK-CHM-05",
    itemName: "Taski R2 All Surface Cleaner 5L",
    category: "Cleaning Chemicals",
    warehouse: "Housekeeping Store",
    zone: "Chemical Bay C-01",
    rack: "Rack C",
    shelf: "Shelf C2",
    bin: "BIN-CHEM-01",
    supplier: "EcoClean",
    grnNumber: "GRN-2026-003",
    poNumber: "PO-2026-043",
    mfgDate: "2026-06-01",
    expiryDate: "2028-06-01",
    totalShelfLifeDays: 730,
    daysRemaining: 676,
    availableQty: 10,
    reservedQty: 0,
    issuedQty: 5,
    unitCost: 1250,
    stockValue: 12500,
    unit: "Canisters",
    status: "Fresh",
    isFEFORecommended: false,
    qualityPassed: true,
    qrCode: "QR-BAT-ECO-7741",
    barcode: "BAR-BAT-ECO-7741",
    movements: [
      { timestamp: "2026-06-01 10:00 AM", action: "Goods Received (GRN-2026-003)", user: "Priya Das", qty: 15, location: "Housekeeping Store" },
    ],
  },
];
