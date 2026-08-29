export type TransferStatus = "Draft" | "Pending Approval" | "In Transit" | "Completed" | "Cancelled";

export interface StockTransferLineItem {
  id: string;
  itemCode: string;
  itemName: string;
  unit: string;
  transferQty: number;
  availableAtSource: number;
  batchNo?: string;
  unitCost: number;
}

export interface StockTransferRecord {
  id: string;
  transferNo: string;
  transferDate: string;
  fromWarehouse: string;
  fromStore: string;
  toWarehouse: string;
  toStore: string;
  requestedBy: string;
  dispatchedBy?: string;
  receivedBy?: string;
  status: TransferStatus;
  reason: string;
  lineItems: StockTransferLineItem[];
  totalValue: number;
  remarks?: string;
}

export const STORE_OPTIONS = [
  "Main Housekeeping Store",
  "Floor 4 Linen Pantry",
  "Floor Linen Pantry",
  "Main Kitchen Prep Area",
  "Banquet Prep Kitchen",
  "Cold Room A",
  "Dry Grocery Rack",
  "HVAC Workshop",
  "Laundry Dispatch",
  "Public Area Cart",
] as const;
