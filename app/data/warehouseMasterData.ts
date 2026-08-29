export type WarehouseMasterType = "Warehouse" | "Store";
export type WarehouseMasterStatus = "Active" | "Inactive";

export interface WarehouseMasterItem {
  id: string;
  code: string;
  name: string;
  type: WarehouseMasterType;
  location: string;
  status: WarehouseMasterStatus;
}

export const WAREHOUSE_TYPE_OPTIONS: WarehouseMasterType[] = ["Warehouse", "Store"];

export function getWarehouseMasterById(
  warehouses: WarehouseMasterItem[],
  id: string,
): WarehouseMasterItem | undefined {
  return warehouses.find((w) => w.id === id);
}

export function buildWarehouseFilterOptions(warehouses: WarehouseMasterItem[]) {
  return warehouses.map((w) => ({ id: w.id, name: w.name }));
}
