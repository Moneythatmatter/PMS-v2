import type { ProductItem } from "./productMasterData";
import type { POLineItem } from "./purchaseOrdersData";
import type { PRRequestedItem } from "./purchaseRequisitionsData";
import type { RFQRequestedItem } from "./rfqData";

/** Catalog row for PR/RFQ material pickers — always sourced from Product Master. */
export interface MaterialCatalogItem {
  materialId: string;
  productCode: string;
  productName: string;
  category: string;
  unit: string;
  purchasePrice: number;
}

export function productsToCatalog(products: ProductItem[]): MaterialCatalogItem[] {
  return products
    .filter((p) => p.status === "Active")
    .map((p) => ({
      materialId: p.id,
      productCode: p.productCode,
      productName: p.productName,
      category: p.category,
      unit: p.unit,
      purchasePrice: p.purchasePrice,
    }));
}

export function findProductById(products: ProductItem[], materialId: string): ProductItem | undefined {
  return products.find((p) => p.id === materialId);
}

export function findProductByCode(products: ProductItem[], code: string): ProductItem | undefined {
  const c = code.trim().toLowerCase();
  if (!c) return undefined;
  return products.find((p) => p.productCode.toLowerCase() === c);
}

/** Match legacy PR/RFQ free-text item names to master when materialId is missing. */
export function findProductByName(products: ProductItem[], name: string): ProductItem | undefined {
  const n = name.trim().toLowerCase();
  if (!n) return undefined;
  return (
    products.find((p) => p.productName.toLowerCase() === n) ??
    products.find((p) => p.productName.toLowerCase().includes(n) || n.includes(p.productName.toLowerCase()))
  );
}

export function resolveProductForLine(
  products: ProductItem[],
  line: { materialId?: string; productCode?: string; item?: string; itemDescription?: string; productName?: string },
): ProductItem | undefined {
  if (line.materialId) {
    const byId = findProductById(products, line.materialId);
    if (byId) return byId;
  }
  const code = line.productCode ?? (line as { itemCode?: string }).itemCode;
  if (code) {
    const byCode = findProductByCode(products, code);
    if (byCode) return byCode;
  }
  const name = line.productName ?? line.itemDescription ?? line.item;
  if (name) return findProductByName(products, name);
  return undefined;
}

export function normalizePoLineItem(
  raw: Partial<POLineItem> & Record<string, unknown>,
  index: number,
  products: ProductItem[] = [],
): POLineItem {
  const productCode = String(raw.productCode ?? raw.itemCode ?? "");
  const productName = String(raw.productName ?? raw.itemDescription ?? "");
  const materialId = String(raw.materialId ?? "");
  const product = resolveProductForLine(products, {
    materialId,
    productCode,
    productName,
  });

  const quantity = Number(raw.quantity ?? 0);
  const unitRate = Number(raw.unitRate ?? product?.purchasePrice ?? 0);
  const taxPercent = Number(raw.taxPercent ?? product?.gstPercent ?? 18);

  return {
    id: String(raw.id ?? `pli-${index}`),
    materialId: product?.id ?? materialId,
    productCode: product?.productCode ?? productCode,
    productName: product?.productName ?? productName,
    itemCode: product?.productCode ?? productCode,
    itemDescription: product?.productName ?? productName,
    category: String(raw.category ?? product?.category ?? ""),
    quantity,
    unit: String(raw.unit ?? product?.unit ?? "Pieces"),
    unitRate,
    taxPercent,
    totalAmount: Number(raw.totalAmount ?? quantity * unitRate),
  };
}

export function normalizePoItems(items: unknown[], products: ProductItem[] = []): POLineItem[] {
  return (items ?? []).map((item, i) =>
    normalizePoLineItem(item as Partial<POLineItem> & Record<string, unknown>, i, products),
  );
}

export function poLineFromProduct(product: ProductItem, quantity = 1): POLineItem {
  const unitRate = product.purchasePrice;
  return {
    id: `pli-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    materialId: product.id,
    productCode: product.productCode,
    productName: product.productName,
    itemCode: product.productCode,
    itemDescription: product.productName,
    category: product.category,
    quantity,
    unit: product.unit,
    unitRate,
    taxPercent: product.gstPercent,
    totalAmount: quantity * unitRate,
  };
}

export function prItemFromCatalog(catalog: MaterialCatalogItem, quantity = 1): PRRequestedItem {
  return {
    id: `item-${Date.now()}`,
    materialId: catalog.materialId,
    productCode: catalog.productCode,
    item: catalog.productName,
    category: catalog.category,
    quantity,
    unit: catalog.unit,
    estimatedPrice: catalog.purchasePrice,
    total: quantity * catalog.purchasePrice,
    remarks: "",
  };
}

export function normalizePrRequestedItem(
  raw: Partial<PRRequestedItem> & Record<string, unknown>,
  index: number,
  products: ProductItem[] = [],
): PRRequestedItem {
  const product = resolveProductForLine(products, {
    materialId: raw.materialId ? String(raw.materialId) : undefined,
    productCode: raw.productCode ? String(raw.productCode) : undefined,
    item: String(raw.item ?? ""),
  });
  const qty = Number(raw.quantity ?? 1);
  const price = Number(raw.estimatedPrice ?? product?.purchasePrice ?? 0);
  return {
    id: String(raw.id ?? `item-${index}`),
    materialId: product?.id ?? String(raw.materialId ?? ""),
    productCode: product?.productCode ?? String(raw.productCode ?? ""),
    item: product?.productName ?? String(raw.item ?? ""),
    category: String(raw.category ?? product?.category ?? ""),
    quantity: qty,
    unit: String(raw.unit ?? product?.unit ?? "Pieces"),
    estimatedPrice: price,
    total: Number(raw.total ?? qty * price),
    remarks: raw.remarks ? String(raw.remarks) : undefined,
  };
}

export function rfqItemFromPrItem(item: PRRequestedItem): RFQRequestedItem {
  return {
    id: item.id,
    materialId: item.materialId,
    productCode: item.productCode,
    item: item.item,
    category: item.category,
    quantity: item.quantity,
    unit: item.unit,
    estimatedRate: item.estimatedPrice,
  };
}

export function poLinesFromPr(
  items: PRRequestedItem[],
  products: ProductItem[],
): POLineItem[] {
  return items.map((item, idx) => {
    const product = resolveProductForLine(products, item);
    const unitRate = item.estimatedPrice || product?.purchasePrice || 0;
    const qty = item.quantity;
    return {
      id: `pli-pr-${idx}-${Date.now()}`,
      materialId: product?.id ?? item.materialId ?? "",
      productCode: product?.productCode ?? item.productCode ?? "",
      productName: product?.productName ?? item.item,
      itemCode: product?.productCode ?? item.productCode ?? "",
      itemDescription: product?.productName ?? item.item,
      category: item.category,
      quantity: qty,
      unit: item.unit,
      unitRate,
      taxPercent: product?.gstPercent ?? 18,
      totalAmount: qty * unitRate,
    };
  });
}

export function poLinesFromRfq(
  items: RFQRequestedItem[],
  products: ProductItem[],
  unitRateOverride?: number,
): POLineItem[] {
  return items.map((item, idx) => {
    const product = resolveProductForLine(products, item);
    const unitRate = unitRateOverride ?? item.estimatedRate ?? product?.purchasePrice ?? 0;
    const qty = item.quantity;
    return {
      id: `pli-rfq-${idx}`,
      materialId: product?.id ?? item.materialId ?? "",
      productCode: product?.productCode ?? item.productCode ?? "",
      productName: product?.productName ?? item.item,
      itemCode: product?.productCode ?? item.productCode ?? "",
      itemDescription: product?.productName ?? item.item,
      category: item.category,
      quantity: qty,
      unit: item.unit,
      unitRate,
      taxPercent: product?.gstPercent ?? 18,
      totalAmount: qty * unitRate,
    };
  });
}

export function poLinesMissingMaterial(items: POLineItem[]): POLineItem[] {
  return items.filter((line) => !line.materialId?.trim());
}

export function catalogItemLabel(item: MaterialCatalogItem): string {
  return `${item.productCode} — ${item.productName}`;
}
