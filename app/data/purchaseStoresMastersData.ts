export type MasterStatus = "Active" | "Inactive";

/** Core hotel departments — matches main app module nav (excludes Purchase & Stores). */
export const DEPARTMENT_OPTIONS = [
  "Front Office",
  "Food & Beverages",
  "Housekeeping",
  "Human Resource",
  "Accounts",
  "Sales & Marketing",
  "Maintenance",
] as const;

export type PurchaseStoresDepartment = (typeof DEPARTMENT_OPTIONS)[number];

export interface UnitItem {
  id: string;
  unitCode: string;
  unitName: string;
  symbol: string;
  description?: string;
  status: MasterStatus;
  createdDate: string;
}

export interface CategoryItem {
  id: string;
  categoryCode: string;
  categoryName: string;
  department: string;
  description?: string;
  productCount: number;
  status: MasterStatus;
  createdDate: string;
}

export interface SupplierItem {
  id: string;
  supplierCode: string;
  supplierName: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstin?: string;
  panNumber?: string;
  paymentTerms: "Net 15 Days" | "Net 30 Days" | "Net 45 Days" | "Immediate" | "Advance";
  address?: string;
  city?: string;
  rating: number;
  status: MasterStatus;
  createdDate: string;
}

export const PAYMENT_TERMS_OPTIONS = [
  "Net 15 Days",
  "Net 30 Days",
  "Net 45 Days",
  "Immediate",
  "Advance",
] as const;

/** Map API category rows to product form lookup shape. */
export function toMasterCategories(categories: CategoryItem[]) {
  return categories.map((c) => ({
    id: c.id,
    code: c.categoryCode,
    name: c.categoryName,
    description: c.description ?? "",
  }));
}

/** Map API unit rows to product form lookup shape. */
export function toMasterUnits(units: UnitItem[]) {
  return units.map((u) => ({
    id: u.id,
    code: u.unitCode,
    name: u.unitName,
    symbol: u.symbol,
  }));
}

/** Map API supplier rows to product form lookup shape. */
export function toMasterSuppliers(suppliers: SupplierItem[]) {
  return suppliers.map((s) => ({
    id: s.id,
    code: s.supplierCode,
    name: s.supplierName,
    contactPerson: s.contactPerson,
    phone: s.phone,
    email: s.email,
  }));
}
