export type MasterStatus = "Active" | "Inactive";

// 1. UNIT MASTER INTERFACE & MOCK DATA
export interface UnitItem {
  id: string;
  unitCode: string;
  unitName: string;
  symbol: string;
  allowDecimals: boolean;
  description?: string;
  status: MasterStatus;
  createdDate: string;
}

export const INITIAL_UNITS_DATA: UnitItem[] = [
  { id: "u-101", unitCode: "UNT-PCS", unitName: "Pieces", symbol: "Pcs", allowDecimals: false, description: "Individual single count items such as bedsheets, towels, light bulbs", status: "Active", createdDate: "2026-06-01" },
  { id: "u-102", unitCode: "UNT-CAN", unitName: "Canisters", symbol: "Can", allowDecimals: false, description: "Bulk liquid containers or canisters for cleaning chemicals", status: "Active", createdDate: "2026-06-01" },
  { id: "u-103", unitCode: "UNT-BOX", unitName: "Boxes", symbol: "Box", allowDecimals: false, description: "Carton or packaged boxes of guest amenities or paper reams", status: "Active", createdDate: "2026-06-05" },
  { id: "u-104", unitCode: "UNT-KG", unitName: "Kilograms", symbol: "Kg", allowDecimals: true, description: "Weight measurement for kitchen groceries, vegetables, and meat", status: "Active", createdDate: "2026-06-05" },
  { id: "u-105", unitCode: "UNT-LTR", unitName: "Liters", symbol: "Ltr", allowDecimals: true, description: "Volume measurement for cooking oil, milk, and concentrated chemicals", status: "Active", createdDate: "2026-06-10" },
  { id: "u-106", unitCode: "UNT-PAK", unitName: "Packs", symbol: "Pack", allowDecimals: false, description: "Multi-item shrink-wrapped or sealed packs", status: "Active", createdDate: "2026-06-12" },
  { id: "u-107", unitCode: "UNT-ROL", unitName: "Rolls", symbol: "Roll", allowDecimals: false, description: "Toilet paper rolls, kitchen foil rolls, tissue rolls", status: "Active", createdDate: "2026-06-15" },
  { id: "u-108", unitCode: "UNT-MTR", unitName: "Meters", symbol: "Mtr", allowDecimals: true, description: "Linear length measurement for curtain fabrics or wiring cables", status: "Active", createdDate: "2026-06-20" },
  { id: "u-109", unitCode: "UNT-SET", unitName: "Sets", symbol: "Set", allowDecimals: false, description: "Matched sets of cutlery or crockery", status: "Inactive", createdDate: "2026-07-01" },
];

// 2. CATEGORY MASTER INTERFACE & MOCK DATA
export interface CategoryItem {
  id: string;
  categoryCode: string;
  categoryName: string;
  department: string;
  defaultTaxRate: number;
  description?: string;
  productCount: number;
  status: MasterStatus;
  createdDate: string;
}

export const DEPARTMENT_OPTIONS = [
  "Housekeeping",
  "Food & Beverage",
  "Engineering & Maintenance",
  "Front Office",
  "Kitchen & Culinary",
  "Administrative & Office",
] as const;

export const INITIAL_CATEGORIES_DATA: CategoryItem[] = [
  { id: "cat-101", categoryCode: "CAT-LIN", categoryName: "Housekeeping Linen", department: "Housekeeping", defaultTaxRate: 12, description: "Bed sheets, pillow covers, duvet covers, bath robes", productCount: 24, status: "Active", createdDate: "2026-06-01" },
  { id: "cat-102", categoryCode: "CAT-BTH", categoryName: "Bath Linen", department: "Housekeeping", defaultTaxRate: 12, description: "Bath towels, hand towels, bath mats, face towels", productCount: 18, status: "Active", createdDate: "2026-06-01" },
  { id: "cat-103", categoryCode: "CAT-CHM", categoryName: "Cleaning Chemicals", department: "Housekeeping", defaultTaxRate: 18, description: "Disinfectants, sanitizers, glass cleaners, floor polish", productCount: 15, status: "Active", createdDate: "2026-06-05" },
  { id: "cat-104", categoryCode: "CAT-AMN", categoryName: "Guest Amenities", department: "Housekeeping", defaultTaxRate: 18, description: "Shampoo, soaps, dental kits, slippers, comb kits", productCount: 32, status: "Active", createdDate: "2026-06-10" },
  { id: "cat-105", categoryCode: "CAT-FNB", categoryName: "F&B Groceries", department: "Food & Beverage", defaultTaxRate: 5, description: "Grains, oils, spices, dairy products, dry fruits", productCount: 45, status: "Active", createdDate: "2026-06-12" },
  { id: "cat-106", categoryCode: "CAT-ENG", categoryName: "Engineering Spares", department: "Engineering & Maintenance", defaultTaxRate: 18, description: "HVAC filters, light bulbs, plumbing spares, electrical switches", productCount: 28, status: "Active", createdDate: "2026-06-15" },
  { id: "cat-107", categoryCode: "CAT-OFF", categoryName: "Office Supplies", department: "Administrative & Office", defaultTaxRate: 12, description: "Paper, toner cartridges, registers, pens, binders", productCount: 12, status: "Active", createdDate: "2026-06-20" },
  { id: "cat-108", categoryCode: "CAT-KTCH", categoryName: "Kitchenware", department: "Kitchen & Culinary", defaultTaxRate: 18, description: "Cookware, chef knives, storage containers, stainless steel pans", productCount: 20, status: "Inactive", createdDate: "2026-07-02" },
];

// 3. SUPPLIER MASTER INTERFACE & MOCK DATA
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
  rating: number; // 1 to 5
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

export const INITIAL_SUPPLIERS_DATA: SupplierItem[] = [
  { id: "sup-101", supplierCode: "SUP-APX", supplierName: "Apex Linen Supplies Pvt Ltd", contactPerson: "Rakesh Sharma", phone: "+91 98765 43210", email: "orders@apexlinen.com", gstin: "27AAACA12341Z5", panNumber: "AAACA12341", paymentTerms: "Net 30 Days", address: "Plot 45, Industrial Estate, Lower Parel", city: "Mumbai", rating: 5, status: "Active", createdDate: "2026-05-10" },
  { id: "sup-102", supplierCode: "SUP-DVR", supplierName: "Diversey Chemicals India", contactPerson: "Meera Nair", phone: "+91 98123 45678", email: "sales@diversey.co.in", gstin: "27BBBDE56782Z9", panNumber: "BBBDE56782", paymentTerms: "Net 30 Days", address: "Building B-4, Tech Park, Powai", city: "Mumbai", rating: 5, status: "Active", createdDate: "2026-05-15" },
  { id: "sup-103", supplierCode: "SUP-TAJ", supplierName: "Taj Quality Textiles", contactPerson: "Sunil Verma", phone: "+91 99887 76655", email: "info@tajtextiles.in", gstin: "07CCCFT91013Z2", panNumber: "CCCFT91013", paymentTerms: "Net 15 Days", address: "G-12, Textile Hub, Okhla Phase 3", city: "New Delhi", rating: 4, status: "Active", createdDate: "2026-05-20" },
  { id: "sup-104", supplierCode: "SUP-HSP", supplierName: "Hospitality Care Logistics", contactPerson: "Anil Kulkarni", phone: "+91 97654 32109", email: "contact@hsplogistics.com", gstin: "27DDDHG34564Z8", panNumber: "DDDHG34564", paymentTerms: "Net 30 Days", address: "Sector 18, Vashi", city: "Navi Mumbai", rating: 4, status: "Active", createdDate: "2026-05-25" },
  { id: "sup-105", supplierCode: "SUP-SUP", supplierName: "Supreme Stationers & Co.", contactPerson: "Vikram Shah", phone: "+91 98234 56789", email: "supreme@stationers.org", gstin: "27EEEKL78905Z1", panNumber: "EEEKL78905", paymentTerms: "Immediate", address: "Fort Commercial Complex, MG Road", city: "Mumbai", rating: 3, status: "Active", createdDate: "2026-06-01" },
  { id: "sup-106", supplierCode: "SUP-ECO", supplierName: "EcoClean Solutions", contactPerson: "Priya Malhotra", phone: "+91 99112 23344", email: "support@ecoclean.com", gstin: "07FFFMN12346Z7", panNumber: "FFFMN12346", paymentTerms: "Net 15 Days", address: "Connaught Place Block B", city: "New Delhi", rating: 4, status: "Active", createdDate: "2026-06-10" },
  { id: "sup-107", supplierCode: "SUP-BHR", supplierName: "Bharat Electricals & Hardware", contactPerson: "Deepak Gupta", phone: "+91 98450 12345", email: "sales@bharatelectricals.com", gstin: "29GGGPR56787Z4", panNumber: "GGGPR56787", paymentTerms: "Advance", address: "SP Road Market", city: "Bengaluru", rating: 3, status: "Inactive", createdDate: "2026-06-18" },
];
