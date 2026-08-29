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
