export type AdjustmentStatus = "Draft" | "Pending Approval" | "Approved" | "Rejected";

export interface StockAdjustmentRecord {
  id: string;
  adjustmentNo: string;
  adjustmentDate: string;
  materialId: string;
  warehouseId: string;
  systemQty: number;
  actualQty: number;
  difference: number;
  reason: string;
  requestedBy: string;
  approvedBy?: string;
  status: AdjustmentStatus;
  ledgerRef?: string;
}

export const ADJUSTMENT_REASON_OPTIONS = [
  "Physical stock count",
  "Damaged goods write-off",
  "Expired stock write-off",
  "Found stock during audit",
  "Data correction",
  "Other",
] as const;
