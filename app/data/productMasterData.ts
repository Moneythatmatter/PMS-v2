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

  // Purchase Info
  preferredSupplier: string;
  purchasePrice: number;
  gstPercent: number;
  hsnCode?: string;
  taxType: TaxType;

  // Inventory Controls
  minimumStock: number;
  maximumStock: number;
  parStock: number;
  reorderLevel: number;
  shelfLocation?: string;
  storageType: StorageType;

  // Status & System Metadata
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

// Category Master List
export const CATEGORY_MASTER_LIST: MasterCategory[] = [
  { id: "cat-1", code: "CAT-LIN", name: "Housekeeping Linen", description: "Bed sheets, pillow covers, duvet covers" },
  { id: "cat-2", code: "CAT-BTH", name: "Bath Linen", description: "Bath towels, hand towels, bath mats" },
  { id: "cat-3", code: "CAT-CHM", name: "Cleaning Chemicals", description: "Disinfectants, sanitizers, glass cleaners" },
  { id: "cat-4", code: "CAT-AMN", name: "Guest Amenities", description: "Shampoo, soaps, dental kits, slippers" },
  { id: "cat-5", code: "CAT-FNB", name: "F&B Groceries", description: "Grains, oils, spices, dairy products" },
  { id: "cat-6", code: "CAT-ENG", name: "Engineering Spares", description: "HVAC filters, light bulbs, plumbing spares" },
  { id: "cat-7", code: "CAT-OFF", name: "Office Supplies", description: "Paper, toner cartridges, register logs" },
  { id: "cat-8", code: "CAT-KTCH", name: "Kitchenware", description: "Cookware, chef knives, storage boxes" },
  { id: "cat-9", code: "CAT-GLS", name: "Glassware & Cutlery", description: "Wine glasses, ceramic plates, forks & spoons" },
];

// Unit Master List
export const UNIT_MASTER_LIST: MasterUnit[] = [
  { id: "u-1", code: "UNT-PCS", name: "Pieces", symbol: "Pcs" },
  { id: "u-2", code: "UNT-CAN", name: "Canisters", symbol: "Can" },
  { id: "u-3", code: "UNT-BOX", name: "Boxes", symbol: "Box" },
  { id: "u-4", code: "UNT-KG", name: "Kilograms", symbol: "Kg" },
  { id: "u-5", code: "UNT-LTR", name: "Liters", symbol: "Ltr" },
  { id: "u-6", code: "UNT-PAK", name: "Packs", symbol: "Pack" },
  { id: "u-7", code: "UNT-ROL", name: "Rolls", symbol: "Roll" },
  { id: "u-8", code: "UNT-MTR", name: "Meters", symbol: "Mtr" },
  { id: "u-9", code: "UNT-SET", name: "Sets", symbol: "Set" },
];

// Supplier Master List
export const SUPPLIER_MASTER_LIST: MasterSupplier[] = [
  { id: "sup-1", code: "SUP-APX", name: "Apex Linen Supplies Pvt Ltd", contactPerson: "Rakesh Sharma", phone: "+91 98765 43210", email: "orders@apexlinen.com" },
  { id: "sup-2", code: "SUP-DVR", name: "Diversey Chemicals India", contactPerson: "Meera Nair", phone: "+91 98123 45678", email: "sales@diversey.co.in" },
  { id: "sup-3", code: "SUP-TAJ", name: "Taj Quality Textiles", contactPerson: "Sunil Verma", phone: "+91 99887 76655", email: "info@tajtextiles.in" },
  { id: "sup-4", code: "SUP-HSP", name: "Hospitality Care Logistics", contactPerson: "Anil Kulkarni", phone: "+91 97654 32109", email: "contact@hsplogistics.com" },
  { id: "sup-5", code: "SUP-SUP", name: "Supreme Stationers & Co.", contactPerson: "Vikram Shah", phone: "+91 98234 56789", email: "supreme@stationers.org" },
  { id: "sup-6", code: "SUP-ECO", name: "EcoClean Solutions", contactPerson: "Priya Malhotra", phone: "+91 99112 23344", email: "support@ecoclean.com" },
  { id: "sup-7", code: "SUP-BHR", name: "Bharat Electricals & Hardware", contactPerson: "Deepak Gupta", phone: "+91 98450 12345", email: "sales@bharatelectricals.com" },
];

// Storage Type Options
export const STORAGE_TYPE_OPTIONS: StorageType[] = [
  "Dry Storage",
  "Cold Room",
  "Room Temp",
  "Freezer",
  "Hazardous Material",
];

// Tax Type Options
export const TAX_TYPE_OPTIONS: TaxType[] = [
  "Exclusive",
  "Inclusive",
  "Exempt",
];

// Initial Product Catalog Data
export const INITIAL_PRODUCTS_DATA: ProductItem[] = [
  {
    id: "prd-101",
    productCode: "PRD-LIN-001",
    productName: "Bedsheet (King Size 300TC)",
    category: "Housekeeping Linen",
    unit: "Pieces",
    brand: "Bombay Dyeing Pro",
    description: "Premium 100% combed cotton white hotel bedsheet with high durability.",
    preferredSupplier: "Apex Linen Supplies Pvt Ltd",
    purchasePrice: 350,
    gstPercent: 12,
    hsnCode: "63022100",
    taxType: "Exclusive",
    minimumStock: 50,
    maximumStock: 300,
    parStock: 200,
    reorderLevel: 80,
    shelfLocation: "Rack A-01",
    storageType: "Dry Storage",
    status: "Active",
    createdDate: "2026-06-15",
  },
  {
    id: "prd-102",
    productCode: "PRD-LIN-002",
    productName: "Pillow Cover (Satin Finish 20x30)",
    category: "Housekeeping Linen",
    unit: "Pieces",
    brand: "Bombay Dyeing Pro",
    description: "Ultra-soft satin finish pillow case for executive rooms.",
    preferredSupplier: "Apex Linen Supplies Pvt Ltd",
    purchasePrice: 90,
    gstPercent: 12,
    hsnCode: "63022110",
    taxType: "Exclusive",
    minimumStock: 100,
    maximumStock: 500,
    parStock: 350,
    reorderLevel: 150,
    shelfLocation: "Rack A-02",
    storageType: "Dry Storage",
    status: "Active",
    createdDate: "2026-06-15",
  },
  {
    id: "prd-103",
    productCode: "PRD-BTH-001",
    productName: "Bath Towel (750 GSM Plush White)",
    category: "Bath Linen",
    unit: "Pieces",
    brand: "Trident Hotel Elite",
    description: "Heavyweight plush white bath towel with quick-dry technology.",
    preferredSupplier: "Taj Quality Textiles",
    purchasePrice: 310,
    gstPercent: 12,
    hsnCode: "63026000",
    taxType: "Exclusive",
    minimumStock: 40,
    maximumStock: 250,
    parStock: 180,
    reorderLevel: 60,
    shelfLocation: "Rack B-01",
    storageType: "Dry Storage",
    status: "Active",
    createdDate: "2026-06-18",
  },
  {
    id: "prd-104",
    productCode: "PRD-CHM-001",
    productName: "Taski R2 All-Purpose Surface Cleaner",
    category: "Cleaning Chemicals",
    unit: "Canisters",
    brand: "Diversey",
    description: "5L Concentrated hygienic hard surface cleaner for floor and wall cleaning.",
    preferredSupplier: "Diversey Chemicals India",
    purchasePrice: 1250,
    gstPercent: 18,
    hsnCode: "34022090",
    taxType: "Exclusive",
    minimumStock: 15,
    maximumStock: 80,
    parStock: 50,
    reorderLevel: 25,
    shelfLocation: "Chemical Bay C-01",
    storageType: "Hazardous Material",
    status: "Active",
    createdDate: "2026-06-20",
  },
  {
    id: "prd-105",
    productCode: "PRD-CHM-002",
    productName: "Taski R6 Bowl Cleaner Super",
    category: "Cleaning Chemicals",
    unit: "Canisters",
    brand: "Diversey",
    description: "Heavy duty toilet bowl cleaner concentrate.",
    preferredSupplier: "Diversey Chemicals India",
    purchasePrice: 1400,
    gstPercent: 18,
    hsnCode: "34022090",
    taxType: "Exclusive",
    minimumStock: 10,
    maximumStock: 60,
    parStock: 40,
    reorderLevel: 20,
    shelfLocation: "Chemical Bay C-02",
    storageType: "Hazardous Material",
    status: "Active",
    createdDate: "2026-06-20",
  },
  {
    id: "prd-106",
    productCode: "PRD-AMN-001",
    productName: "Herbal Shampoo Bottle (30ml)",
    category: "Guest Amenities",
    unit: "Boxes",
    brand: "Kimirica Suite",
    description: "Box of 200 units organic herbal shampoo for luxury guest suites.",
    preferredSupplier: "Hospitality Care Logistics",
    purchasePrice: 1850,
    gstPercent: 18,
    hsnCode: "33051090",
    taxType: "Exclusive",
    minimumStock: 10,
    maximumStock: 50,
    parStock: 30,
    reorderLevel: 15,
    shelfLocation: "Rack D-04",
    storageType: "Room Temp",
    status: "Active",
    createdDate: "2026-06-22",
  },
  {
    id: "prd-107",
    productCode: "PRD-ENG-001",
    productName: "LED Panel Light 15W Square Warm White",
    category: "Engineering Spares",
    unit: "Pieces",
    brand: "Philips Commercial",
    description: "Energy-efficient recessed LED panel lights for guest corridors.",
    preferredSupplier: "Bharat Electricals & Hardware",
    purchasePrice: 420,
    gstPercent: 18,
    hsnCode: "94054090",
    taxType: "Exclusive",
    minimumStock: 25,
    maximumStock: 150,
    parStock: 100,
    reorderLevel: 40,
    shelfLocation: "Eng Room E-03",
    storageType: "Dry Storage",
    status: "Active",
    createdDate: "2026-06-25",
  },
  {
    id: "prd-108",
    productCode: "PRD-OFF-001",
    productName: "A4 Printing Paper Rim (80 GSM)",
    category: "Office Supplies",
    unit: "Boxes",
    brand: "JK Copier",
    description: "Box of 5 reams high-brightness multipurpose printing paper.",
    preferredSupplier: "Supreme Stationers & Co.",
    purchasePrice: 1150,
    gstPercent: 12,
    hsnCode: "48025610",
    taxType: "Exclusive",
    minimumStock: 12,
    maximumStock: 60,
    parStock: 40,
    reorderLevel: 18,
    shelfLocation: "Stationery Store S-01",
    storageType: "Dry Storage",
    status: "Active",
    createdDate: "2026-07-01",
  },
  {
    id: "prd-109",
    productCode: "PRD-KTCH-001",
    productName: "Stainless Steel Storage Container (20L)",
    category: "Kitchenware",
    unit: "Pieces",
    brand: "Vinod Stainless",
    description: "Food grade 304 stainless steel airtight container for main kitchen.",
    preferredSupplier: "Hospitality Care Logistics",
    purchasePrice: 2200,
    gstPercent: 18,
    hsnCode: "73239390",
    taxType: "Exclusive",
    minimumStock: 5,
    maximumStock: 30,
    parStock: 20,
    reorderLevel: 8,
    shelfLocation: "Main Kitchen Store K-02",
    storageType: "Room Temp",
    status: "Inactive",
    createdDate: "2026-07-05",
  },
  {
    id: "prd-110",
    productCode: "PRD-FNB-001",
    productName: "Extra Virgin Olive Oil (5L Tin)",
    category: "F&B Groceries",
    unit: "Canisters",
    brand: "Borges Italy",
    description: "First cold pressed olive oil for fine dining restaurant kitchen.",
    preferredSupplier: "Hospitality Care Logistics",
    purchasePrice: 3800,
    gstPercent: 5,
    hsnCode: "15091000",
    taxType: "Exclusive",
    minimumStock: 8,
    maximumStock: 40,
    parStock: 25,
    reorderLevel: 12,
    shelfLocation: "Pantry Store P-01",
    storageType: "Cold Room",
    status: "Active",
    createdDate: "2026-07-10",
  },
];
