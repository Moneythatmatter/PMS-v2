/** One received stock lot — batch/expiry belong here, not on material master. */
export interface GRNBatchAllocation {
  id: string;
  batchNumber: string;
  expiryDate: string;
  mfgDate?: string;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  storageWarehouse: string;
  storageLocation?: string;
  qcStatus: "Pending" | "Passed" | "Failed";
}

/** GRN line — one PO material; may split across multiple batch allocations. */
export interface GRNLineItem {
  id: string;
  /** ps_products.id — inherited from PO line */
  materialId: string;
  productCode: string;
  productName: string;
  category: string;
  unit: string;
  orderedQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  unitRate: number;
  receivedValue: number;
  qcStatus: "Pending" | "Passed" | "Failed" | "Partial";
  batchAllocations: GRNBatchAllocation[];
  remarks?: string;
}

/** @deprecated Use GRNLineItem — kept for legacy rows */
export interface GRNItem {
  id: string;
  productCode: string;
  productName: string;
  category: string;
  orderedQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  unit: string;
  batchNumber: string;
  mfgDate?: string;
  expiryDate: string;
  storageBin: string;
  remarks?: string;
}

export interface GRNAttachment {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: string;
}

export interface QualityInspectionDetails {
  status: "Passed" | "Pending" | "Rejected" | "Under QC" | "Partially Accepted";
  inspector: string;
  inspectionDate: string;
  comments: string;
}

export interface GRNRecord {
  id: string;
  grnNumber: string;
  receiptDate: string;
  deliveryTime?: string;
  receivingDock?: string;
  deliveryPerson?: string;
  poNumber: string;
  supplierName: string;
  warehouse: string;
  itemCount: number;
  receivedBy: string;
  inspectionStatus: "Passed" | "Pending" | "Rejected" | "Under QC" | "Partially Accepted";
  status: "Received" | "Completed" | "Return" | "Pending" | "Approved";
  vehicleNumber: string;
  deliveryChallan: string;
  totalAmount: number;
  remarks?: string;
  items: GRNLineItem[];
  inspectionDetails: QualityInspectionDetails;
  attachments: GRNAttachment[];
  logs?: Array<{ timestamp: string; user: string; action: string; status: string }>;
}

function legacyItemToLine(raw: GRNItem & Record<string, unknown>, index: number): GRNLineItem {
  const unitRate = Number(raw.unitRate ?? raw.rate ?? 0);
  const accepted = Number(raw.acceptedQty ?? raw.receivedQty ?? 0);
  return {
    id: String(raw.id ?? `line-${index}`),
    materialId: String(raw.materialId ?? ""),
    productCode: String(raw.productCode ?? ""),
    productName: String(raw.productName ?? raw.itemName ?? ""),
    category: String(raw.category ?? ""),
    unit: String(raw.unit ?? raw.uom ?? "Pieces"),
    orderedQty: Number(raw.orderedQty ?? 0),
    receivedQty: Number(raw.receivedQty ?? 0),
    acceptedQty: accepted,
    rejectedQty: Number(raw.rejectedQty ?? 0),
    unitRate,
    receivedValue: Number(raw.receivedValue ?? accepted * unitRate),
    qcStatus: (raw.qcStatus as GRNLineItem["qcStatus"]) ?? "Pending",
    batchAllocations: Array.isArray(raw.batchAllocations)
      ? (raw.batchAllocations as GRNBatchAllocation[])
      : [
          {
            id: `batch-${index}-0`,
            batchNumber: String(raw.batchNumber ?? `B-${index}`),
            expiryDate: String(raw.expiryDate ?? ""),
            mfgDate: raw.mfgDate ? String(raw.mfgDate) : undefined,
            receivedQty: Number(raw.receivedQty ?? 0),
            acceptedQty: accepted,
            rejectedQty: Number(raw.rejectedQty ?? 0),
            storageWarehouse: String(raw.storageWarehouse ?? raw.storageBin ?? ""),
            storageLocation: raw.storageBin ? String(raw.storageBin) : undefined,
            qcStatus: "Pending",
          },
        ],
    remarks: raw.remarks ? String(raw.remarks) : undefined,
  };
}

/** Normalize API / legacy GRN JSON into canonical line + batch shape. */
export function normalizeGrnRecord(grn: GRNRecord): GRNRecord {
  const rawItems = (grn.items ?? []) as Array<GRNLineItem & GRNItem & Record<string, unknown>>;
  const items = rawItems.map((item, i) =>
    Array.isArray(item.batchAllocations) && item.batchAllocations.length > 0
      ? {
          ...item,
          unitRate: Number(item.unitRate ?? 0),
          receivedValue: Number(item.receivedValue ?? item.acceptedQty * Number(item.unitRate ?? 0)),
        }
      : legacyItemToLine(item, i),
  );

  return {
    ...grn,
    deliveryTime: grn.deliveryTime ?? (grn as GRNRecord & { delivery_time?: string }).delivery_time,
    receivingDock: grn.receivingDock ?? (grn as GRNRecord & { receiving_dock?: string }).receiving_dock,
    deliveryPerson: grn.deliveryPerson ?? (grn as GRNRecord & { delivery_person?: string }).delivery_person,
    items,
    itemCount: items.length,
    totalAmount: items.reduce((s, l) => s + l.receivedValue, 0),
  };
}
