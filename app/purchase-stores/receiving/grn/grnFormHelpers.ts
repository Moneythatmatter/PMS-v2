import type { PORecord } from "@/app/data/purchaseOrdersData";
import type { GRNBatchAllocation, GRNLineItem } from "@/app/data/grnData";
import { normalizePoLineItem } from "@/app/data/procurementMaterial";
import type { ProductItem } from "@/app/data/productMasterData";

export type GrnFormLine = GRNLineItem;

export function newBatchAllocation(
  warehouse: string,
  qty: number,
  productCode: string,
): GRNBatchAllocation {
  return {
    id: `batch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    batchNumber: `B-${productCode}-${Date.now().toString(36).slice(-4).toUpperCase()}`,
    expiryDate: "",
    receivedQty: qty,
    acceptedQty: qty,
    rejectedQty: 0,
    storageWarehouse: warehouse,
    storageLocation: "",
    qcStatus: "Pending",
  };
}

export function poToGrnFormLines(po: PORecord, products: ProductItem[] = []): GrnFormLine[] {
  return po.items.map((rawItem, idx) => {
    const item = normalizePoLineItem(rawItem as Parameters<typeof normalizePoLineItem>[0], idx, products);
    const batch = newBatchAllocation(po.shipToWarehouse, item.quantity, item.productCode);
    return {
      id: `line-${idx}-${Date.now()}`,
      materialId: item.materialId,
      productCode: item.productCode,
      productName: item.productName,
      category: item.category,
      unit: item.unit,
      orderedQty: item.quantity,
      receivedQty: item.quantity,
      acceptedQty: item.quantity,
      rejectedQty: 0,
      unitRate: item.unitRate,
      receivedValue: item.quantity * item.unitRate,
      qcStatus: "Pending",
      batchAllocations: [batch],
    };
  });
}

export function syncLineTotals(line: GrnFormLine): GrnFormLine {
  const receivedQty = line.batchAllocations.reduce((s, b) => s + Number(b.receivedQty || 0), 0);
  const acceptedQty = line.batchAllocations.reduce((s, b) => s + Number(b.acceptedQty || 0), 0);
  const rejectedQty = line.batchAllocations.reduce((s, b) => s + Number(b.rejectedQty || 0), 0);
  return {
    ...line,
    receivedQty,
    acceptedQty,
    rejectedQty,
    receivedValue: acceptedQty * line.unitRate,
  };
}

export function addBatchToLine(line: GrnFormLine, warehouse: string): GrnFormLine {
  return syncLineTotals({
    ...line,
    batchAllocations: [
      ...line.batchAllocations,
      newBatchAllocation(warehouse, 0, line.productCode),
    ],
  });
}

export function updateLineBatch(
  line: GrnFormLine,
  batchId: string,
  patch: Partial<GRNBatchAllocation>,
): GrnFormLine {
  return syncLineTotals({
    ...line,
    batchAllocations: line.batchAllocations.map((b) =>
      b.id === batchId ? { ...b, ...patch } : b,
    ),
  });
}
