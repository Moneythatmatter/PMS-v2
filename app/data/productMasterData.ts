export type StorageType = "Dry Storage" | "Cold Room" | "Room Temp" | "Freezer" | "Hazardous Material";
export type TaxType = "Exclusive" | "Inclusive" | "Exempt";
export type ProductStatus = "Active" | "Inactive";

export interface ProductItem {
  id: string;
  productCode: string;
  productName: string;
  category: string;
  unit: string;
  brand?: string;
  description?: string;
  productImage?: string;
  preferredSupplier: string;
  purchasePrice: number;
  gstPercent: number;
  hsnCode?: string;
  taxType: TaxType;
  minimumStock: number;
  maximumStock: number;
  parStock: number;
  reorderLevel: number;
  shelfLocation?: string;
  storageType: StorageType;
  status: ProductStatus;
  createdDate: string;
  updatedDate?: string;
}

export interface MasterCategory {
  id: string;
  code: string;
  name: string;
  description: string;
}

export interface MasterUnit {
  id: string;
  code: string;
  name: string;
  symbol: string;
}

export interface MasterSupplier {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
}

export const STORAGE_TYPE_OPTIONS: StorageType[] = [
  "Dry Storage",
  "Cold Room",
  "Room Temp",
  "Freezer",
  "Hazardous Material",
];

export const TAX_TYPE_OPTIONS: TaxType[] = ["Exclusive", "Inclusive", "Exempt"];
