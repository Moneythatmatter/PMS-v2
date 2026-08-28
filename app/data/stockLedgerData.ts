import type { ProductItem } from "./productMasterData";
import type { WarehouseMasterItem } from "./warehouseMasterData";

export type LedgerMovementType = "GRN" | "Issue" | "Transfer In" | "Transfer Out" | "Adjustment";

export type LedgerTypeFilter = "all" | "GRN" | "Issues" | "Transfers" | "Adjustments";

export interface StockLedgerRecord {
  id: string;
  transactionDate: string;
  transactionNo: string;
  movementType: LedgerMovementType;
  materialId: string;
  warehouseId: string;
  quantityIn: number;
  quantityOut: number;
  balanceQty: number;
  remarks?: string;
}

export function getLedgerMaterialName(products: ProductItem[], materialId: string): string {
  return products.find((p) => p.id === materialId)?.productName ?? "Unknown Material";
}

export function getLedgerMaterialCode(products: ProductItem[], materialId: string): string {
  return products.find((p) => p.id === materialId)?.productCode ?? materialId;
}

export function getLedgerMaterialUnit(products: ProductItem[], materialId: string): string {
  return products.find((p) => p.id === materialId)?.unit ?? "—";
}

export function getLedgerMaterialCategory(products: ProductItem[], materialId: string): string {
  return products.find((p) => p.id === materialId)?.category ?? "—";
}

export function getLedgerWarehouseName(warehouses: WarehouseMasterItem[], warehouseId: string): string {
  return warehouses.find((w) => w.id === warehouseId)?.name ?? "Unknown Warehouse";
}

export function matchesLedgerFilter(record: StockLedgerRecord, filter: LedgerTypeFilter): boolean {
  if (filter === "all") return true;
  if (filter === "GRN") return record.movementType === "GRN";
  if (filter === "Issues") return record.movementType === "Issue";
  if (filter === "Transfers") return record.movementType === "Transfer In" || record.movementType === "Transfer Out";
  if (filter === "Adjustments") return record.movementType === "Adjustment";
  return true;
}

export const LEDGER_TYPE_FILTERS: { id: LedgerTypeFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "GRN", label: "GRN" },
  { id: "Issues", label: "Issues" },
  { id: "Transfers", label: "Transfers" },
  { id: "Adjustments", label: "Adjustments" },
];

function parseLedgerDate(raw: string): number {
  const parsed = Date.parse(raw.replace(/(\d{2}:\d{2}) (AM|PM)/, "$1 $2"));
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function getLedgerForBalance(
  ledger: StockLedgerRecord[],
  materialId: string,
  warehouseId: string,
): StockLedgerRecord[] {
  return ledger
    .filter((r) => r.materialId === materialId && r.warehouseId === warehouseId)
    .sort((a, b) => parseLedgerDate(b.transactionDate) - parseLedgerDate(a.transactionDate));
}

export function enrichLedgerRows(
  records: StockLedgerRecord[],
  products: ProductItem[],
  warehouses: WarehouseMasterItem[],
) {
  return records.map((rec) => ({
    ...rec,
    materialName: getLedgerMaterialName(products, rec.materialId),
    materialCode: getLedgerMaterialCode(products, rec.materialId),
    materialUnit: getLedgerMaterialUnit(products, rec.materialId),
    materialCategory: getLedgerMaterialCategory(products, rec.materialId),
    warehouseName: getLedgerWarehouseName(warehouses, rec.warehouseId),
  }));
}
