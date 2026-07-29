export interface ClosingStockItem {
  id: string;
  itemCode: string;
  category: string;
  itemName: string;
  uom: string;
  sysQty: number;
  physicalQty: number;
  unitRate: number;
  totalValuation: number;
  prevPeriodValue: number;
  glAccountCode: string;
  glAccountName: string;
  lastAuditDate: string;
  status: "Draft" | "Audited" | "GL Posted";
}

export const sampleDepartmentStores = [
  "Main F&B Central Store",
  "Kitchen Provisions Store",
  "Bar & Cellar Store",
  "Housekeeping & Amenities Store",
  "Linen & Uniforms Store",
  "Engineering & Maintenance Store",
];

export const sampleValuationMethods = [
  "Weighted Average Rate (Weighted Avg)",
  "FIFO (First In First Out)",
  "Last Purchase Rate (LPR)",
  "Standard Physical Valuation Rate",
];

export const sampleClosingStockData: ClosingStockItem[] = [
  {
    id: "cs-101",
    itemCode: "STK-FB-001",
    category: "F&B - Groceries & Provisions",
    itemName: "Basmati Rice Premium (50kg bags)",
    uom: "KG",
    sysQty: 450,
    physicalQty: 450,
    unitRate: 110,
    totalValuation: 49500,
    prevPeriodValue: 42000,
    glAccountCode: "1401-01",
    glAccountName: "Stock Asset - F&B Food Provisions",
    lastAuditDate: "31/03/2026",
    status: "Audited",
  },
  {
    id: "cs-102",
    itemCode: "STK-FB-002",
    category: "F&B - Groceries & Provisions",
    itemName: "Refined Cooking Oil (15L cans)",
    uom: "LTR",
    sysQty: 180,
    physicalQty: 175,
    unitRate: 140,
    totalValuation: 24500,
    prevPeriodValue: 28000,
    glAccountCode: "1401-01",
    glAccountName: "Stock Asset - F&B Food Provisions",
    lastAuditDate: "31/03/2026",
    status: "Audited",
  },
  {
    id: "cs-103",
    itemCode: "STK-FB-003",
    category: "F&B - Beverages & Spirits",
    itemName: "Single Malt Whisky 12YO (750ml)",
    uom: "BTL",
    sysQty: 32,
    physicalQty: 32,
    unitRate: 3800,
    totalValuation: 121600,
    prevPeriodValue: 114000,
    glAccountCode: "1401-02",
    glAccountName: "Stock Asset - Bar Beverages & Liquor",
    lastAuditDate: "31/03/2026",
    status: "GL Posted",
  },
  {
    id: "cs-104",
    itemCode: "STK-FB-004",
    category: "F&B - Beverages & Spirits",
    itemName: "Imported Red Wine - Cabernet Sauvignon",
    uom: "BTL",
    sysQty: 45,
    physicalQty: 42,
    unitRate: 1650,
    totalValuation: 69300,
    prevPeriodValue: 72000,
    glAccountCode: "1401-02",
    glAccountName: "Stock Asset - Bar Beverages & Liquor",
    lastAuditDate: "31/03/2026",
    status: "Audited",
  },
  {
    id: "cs-105",
    itemCode: "STK-HK-001",
    category: "Housekeeping Amenities",
    itemName: "Luxury Guest Body Wash (50ml bottles)",
    uom: "NOS",
    sysQty: 1200,
    physicalQty: 1200,
    unitRate: 28,
    totalValuation: 33600,
    prevPeriodValue: 30000,
    glAccountCode: "1402-01",
    glAccountName: "Stock Asset - Guest Room Amenities",
    lastAuditDate: "30/03/2026",
    status: "Audited",
  },
  {
    id: "cs-106",
    itemCode: "STK-HK-002",
    category: "Housekeeping Amenities",
    itemName: "Herbal Shampoo & Conditioner Kit",
    uom: "NOS",
    sysQty: 950,
    physicalQty: 940,
    unitRate: 32,
    totalValuation: 30080,
    prevPeriodValue: 35000,
    glAccountCode: "1402-01",
    glAccountName: "Stock Asset - Guest Room Amenities",
    lastAuditDate: "30/03/2026",
    status: "Draft",
  },
  {
    id: "cs-107",
    itemCode: "STK-LN-001",
    category: "Linen & Laundry Supplies",
    itemName: "King Bed Sheets (Cotton 300 TC)",
    uom: "NOS",
    sysQty: 120,
    physicalQty: 120,
    unitRate: 850,
    totalValuation: 102000,
    prevPeriodValue: 98000,
    glAccountCode: "1402-02",
    glAccountName: "Stock Asset - Hotel Linen & Towels",
    lastAuditDate: "29/03/2026",
    status: "GL Posted",
  },
  {
    id: "cs-108",
    itemCode: "STK-ENG-001",
    category: "Engineering & Spares",
    itemName: "LED Panel Lights 18W (Warm White)",
    uom: "NOS",
    sysQty: 75,
    physicalQty: 75,
    unitRate: 340,
    totalValuation: 25500,
    prevPeriodValue: 22000,
    glAccountCode: "1403-01",
    glAccountName: "Stock Asset - Maintenance & Spares",
    lastAuditDate: "31/03/2026",
    status: "Audited",
  },
];
