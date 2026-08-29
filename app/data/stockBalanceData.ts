import type { CategoryItem } from "./purchaseStoresMastersData";
import type { ProductItem } from "./productMasterData";
import type { WarehouseMasterItem } from "./warehouseMasterData";

export interface MaterialDetails {
  id: string;
  productCode: string;
  productName: string;
  unit: string;
  category: string;
  department: string;
}

export type StockBalanceStatus = "Active" | "Inactive" | "Blocked" | "Quarantine";

export interface StockBalanceRecord {
  id: string;
  materialId: string;
  warehouseId: string;
  quantity: number;
  averageCost: number;
  lastMovementAt: string;
  status: StockBalanceStatus;
}

export function buildCategoryDepartmentMap(categories: CategoryItem[]) {
  return new Map(categories.map((c) => [c.categoryName, c.department]));
}

export function getMaterialById(products: ProductItem[], materialId: string): ProductItem | undefined {
  return products.find((p) => p.id === materialId);
}

export function getDepartmentByCategory(
  categoryDepartmentMap: Map<string, string>,
  categoryName: string,
): string {
  return categoryDepartmentMap.get(categoryName) ?? "—";
}

export function getMaterialDetails(
  products: ProductItem[],
  categories: CategoryItem[],
  materialId: string,
): MaterialDetails | undefined {
  const material = getMaterialById(products, materialId);
  if (!material) return undefined;
  const deptMap = buildCategoryDepartmentMap(categories);
  return {
    id: material.id,
    productCode: material.productCode,
    productName: material.productName,
    unit: material.unit,
    category: material.category,
    department: getDepartmentByCategory(deptMap, material.category),
  };
}

export function getWarehouseById(warehouses: WarehouseMasterItem[], warehouseId: string) {
  return warehouses.find((w) => w.id === warehouseId);
}

export function buildStockMaterialOptions(products: ProductItem[]) {
  return products
    .filter((p) => p.status === "Active")
    .map((p) => ({
      id: p.id,
      code: p.productCode,
      name: p.productName,
      unit: p.unit,
      category: p.category,
    }));
}
