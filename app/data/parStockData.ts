export type ParStockStatus = "OK" | "Below Par" | "Critical" | "Overstock";

export interface ParStockRecord {
  id: string;
  itemCode: string;
  itemName: string;
  category: string;
  unit: string;
  warehouse: string;
  store: string;
  currentStock: number;
  parLevel: number;
  minLevel: number;
  maxLevel: number;
  reorderLevel: number;
  status: ParStockStatus;
  lastIssuedDate?: string;
  lastReceivedDate?: string;
}

export function deriveParStockStatus(
  current: number,
  par: number,
  min: number,
  max: number,
): ParStockStatus {
  if (current > max) return "Overstock";
  if (current <= min) return "Critical";
  if (current < par) return "Below Par";
  return "OK";
}
