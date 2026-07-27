export type WarehouseType =
  | "Main Warehouse"
  | "Sub Warehouse"
  | "Kitchen Store"
  | "Bar Store"
  | "Engineering Store"
  | "Laundry Store"
  | "Housekeeping Store"
  | "Cold Storage"
  | "Freezer"
  | "Receiving Area"
  | "Dispatch Area"
  | "Temporary Storage";

export interface BinRecord {
  id: string;
  binCode: string;
  binName: string;
  shelfName: string;
  rackName: string;
  zoneName: string;
  capacityQty: number;
  currentUtilizationQty: number;
  maxWeightKg: number;
  temperatureControlled: boolean;
  targetTemp?: string;
  isExpiryStorage: boolean;
  isDefaultBin: boolean;
  barcode: string;
  qrCode: string;
  status: "Active" | "Full" | "Maintenance" | "Inactive" | "Reserved" | "Overloaded";
}

export interface StorageZone {
  id: string;
  zoneName: string;
  zoneCode: string;
  aisleCount: number;
  rackCount: number;
  bins: BinRecord[];
}

export interface WarehouseItemStored {
  id: string;
  itemCode: string;
  itemName: string;
  category: string;
  batchNumber: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  expiryDate: string;
  unit: string;
  binLocation: string;
}

export interface WarehouseUser {
  id: string;
  name: string;
  role: "Warehouse Manager" | "Store Keeper" | "Supervisor" | "Approver";
  email: string;
  phone: string;
}

export interface WarehouseSettings {
  allowNegativeStock: boolean;
  enableFEFO: boolean;
  enableFIFO: boolean;
  requireApproval: boolean;
  defaultReceivingArea: string;
  defaultDispatchArea: string;
  temperatureControlled: boolean;
  barcodeRequired: boolean;
  qrCodeRequired: boolean;
  autoBinAllocation: boolean;
  defaultIssueBin: string;
  defaultReceivingBin: string;
}

export interface RecentTransaction {
  id: string;
  date: string;
  transactionNo: string;
  transactionType: "GRN" | "Issue" | "Transfer" | "Return" | "Adjustment";
  item: string;
  quantity: number;
  source: string;
  destination: string;
  status: "Completed" | "Pending" | "In Transit";
}

export interface SmartAlert {
  id: string;
  type: "warning" | "danger" | "info";
  title: string;
  message: string;
  actionText?: string;
}

export interface WarehouseRecord {
  id: string;
  code: string;
  name: string;
  type: WarehouseType;
  department: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  status: "Active" | "Inactive" | "Maintenance";
  description: string;
  storageLocationsCount: number;
  totalBinsCount: number;
  occupiedBinsCount: number;
  emptyBinsCount: number;
  reservedBinsCount: number;
  overloadedBinsCount: number;
  totalVolumeCapacityCuM: number;
  usedVolumeCapacityCuM: number;
  totalWeightCapacityKg: number;
  usedWeightCapacityKg: number;
  manager: string;
  lastUpdated: string;
  zones: StorageZone[];
  inventory: WarehouseItemStored[];
  users: WarehouseUser[];
  settings: WarehouseSettings;
  recentTransactions: RecentTransaction[];
  alerts: SmartAlert[];
  auditLogs: { timestamp: string; action: string; performedBy: string; status?: string }[];
}

export const INITIAL_WAREHOUSE_RECORDS: WarehouseRecord[] = [
  {
    id: "wh-1",
    code: "WH-MAIN-01",
    name: "Main Central Warehouse",
    type: "Main Warehouse",
    department: "Purchase & Stores",
    address: "Basement Level 1, Main Service Block, Hotel Complex",
    contactPerson: "Rajesh Kumar (Chief Store Manager)",
    phone: "+91 98765 43210",
    email: "stores.main@grandhotel.com",
    status: "Active",
    description: "Central receiving and master distribution warehouse for dry goods, linen, and operational supplies.",
    storageLocationsCount: 18,
    totalBinsCount: 140,
    occupiedBinsCount: 112,
    emptyBinsCount: 20,
    reservedBinsCount: 5,
    overloadedBinsCount: 3,
    totalVolumeCapacityCuM: 450,
    usedVolumeCapacityCuM: 340,
    totalWeightCapacityKg: 15000,
    usedWeightCapacityKg: 11200,
    manager: "Rajesh Kumar",
    lastUpdated: "2026-07-24 09:30 AM",
    zones: [
      {
        id: "z-1",
        zoneName: "Grocery & Dry Foods Zone",
        zoneCode: "Z-GROC-01",
        aisleCount: 4,
        rackCount: 8,
        bins: [
          {
            id: "b-1",
            binCode: "BIN-GROC-A1-01",
            binName: "Dry Rice & Grains Bin 01",
            shelfName: "Shelf A1",
            rackName: "Rack A",
            zoneName: "Grocery & Dry Foods Zone",
            capacityQty: 500,
            currentUtilizationQty: 420,
            maxWeightKg: 1000,
            temperatureControlled: false,
            isExpiryStorage: true,
            isDefaultBin: true,
            barcode: "BAR-WH1-A101",
            qrCode: "QR-WH1-A101",
            status: "Active",
          },
          {
            id: "b-2",
            binCode: "BIN-GROC-A1-02",
            binName: "Flour & Sugar Storage Bin 02",
            shelfName: "Shelf A1",
            rackName: "Rack A",
            zoneName: "Grocery & Dry Foods Zone",
            capacityQty: 400,
            currentUtilizationQty: 380,
            maxWeightKg: 800,
            temperatureControlled: false,
            isExpiryStorage: true,
            isDefaultBin: false,
            barcode: "BAR-WH1-A102",
            qrCode: "QR-WH1-A102",
            status: "Full",
          },
          {
            id: "b-3",
            binCode: "BIN-GROC-A2-03",
            binName: "Spices Reserve Bin 03",
            shelfName: "Shelf A2",
            rackName: "Rack A",
            zoneName: "Grocery & Dry Foods Zone",
            capacityQty: 300,
            currentUtilizationQty: 0,
            maxWeightKg: 500,
            temperatureControlled: false,
            isExpiryStorage: false,
            isDefaultBin: false,
            barcode: "BAR-WH1-A203",
            qrCode: "QR-WH1-A203",
            status: "Active",
          },
        ],
      },
      {
        id: "z-2",
        zoneName: "Beverages & Canned Goods Zone",
        zoneCode: "Z-BEV-02",
        aisleCount: 2,
        rackCount: 4,
        bins: [
          {
            id: "b-4",
            binCode: "BIN-BEV-B1-01",
            binName: "Mineral Water & Soda Crates Bin",
            shelfName: "Shelf B1",
            rackName: "Rack B",
            zoneName: "Beverages & Canned Goods Zone",
            capacityQty: 300,
            currentUtilizationQty: 180,
            maxWeightKg: 600,
            temperatureControlled: false,
            isExpiryStorage: false,
            isDefaultBin: false,
            barcode: "BAR-WH1-B101",
            qrCode: "QR-WH1-B101",
            status: "Active",
          },
        ],
      },
    ],
    inventory: [
      {
        id: "inv-1",
        itemCode: "FNB-DRY-01",
        itemName: "Basmati Biryani Rice 25kg Bag",
        category: "Grocery",
        batchNumber: "B-RICE-9920",
        quantity: 350,
        reservedQuantity: 50,
        availableQuantity: 300,
        expiryDate: "2027-06-30",
        unit: "Bags",
        binLocation: "BIN-GROC-A1-01",
      },
      {
        id: "inv-2",
        itemCode: "FNB-DRY-05",
        itemName: "Refined White Sugar 50kg Bag",
        category: "Grocery",
        batchNumber: "B-SUG-4412",
        quantity: 200,
        reservedQuantity: 20,
        availableQuantity: 180,
        expiryDate: "2028-01-15",
        unit: "Bags",
        binLocation: "BIN-GROC-A1-02",
      },
    ],
    users: [
      { id: "u-1", name: "Rajesh Kumar", role: "Warehouse Manager", email: "rajesh.k@hotel.com", phone: "+91 98765 43210" },
      { id: "u-2", name: "Amit Sharma", role: "Store Keeper", email: "amit.s@hotel.com", phone: "+91 98765 43211" },
    ],
    settings: {
      allowNegativeStock: false,
      enableFEFO: true,
      enableFIFO: true,
      requireApproval: true,
      defaultReceivingArea: "Receiving Bay 01",
      defaultDispatchArea: "Dispatch Bay 02",
      temperatureControlled: false,
      barcodeRequired: true,
      qrCodeRequired: true,
      autoBinAllocation: true,
      defaultIssueBin: "BIN-GROC-A1-01",
      defaultReceivingBin: "BIN-GROC-A1-01",
    },
    recentTransactions: [
      {
        id: "tx-1",
        date: "2026-07-24 10:15 AM",
        transactionNo: "SL-2026-8801",
        transactionType: "GRN",
        item: "Basmati Biryani Rice 25kg Bag",
        quantity: 200,
        source: "Supplier (ABC Linen)",
        destination: "BIN-GROC-A1-01",
        status: "Completed",
      },
      {
        id: "tx-2",
        date: "2026-07-24 11:30 AM",
        transactionNo: "SL-2026-8802",
        transactionType: "Issue",
        item: "Bedsheet (King Size 300TC)",
        quantity: 45,
        source: "BIN-GROC-A1-01",
        destination: "Housekeeping Floor 4",
        status: "Completed",
      },
    ],
    alerts: [
      { id: "alt-1", type: "warning", title: "Warehouse Nearly Full", message: "Storage capacity has reached 75% utilization.", actionText: "View Capacity" },
      { id: "alt-2", type: "info", title: "FEFO Auto-Routing Active", message: "Earliest expiry batch (B-AML-8821) allocated for next dispatch." },
    ],
    auditLogs: [
      { timestamp: "2026-07-24 09:30 AM", action: "Updated bin capacity for Rack A", performedBy: "Rajesh Kumar", status: "Success" },
      { timestamp: "2026-07-20 11:00 AM", action: "Created Warehouse Record", performedBy: "Admin System", status: "Success" },
    ],
  },
  {
    id: "wh-2",
    code: "WH-KIT-02",
    name: "Main Kitchen Store",
    type: "Kitchen Store",
    department: "Food & Beverage Production",
    address: "Level 1, Main Kitchen Production Wing",
    contactPerson: "Chef Marco (Executive Chef)",
    phone: "+91 98765 43212",
    email: "kitchen.store@grandhotel.com",
    status: "Active",
    description: "Daily ingredient and spice store feeding the main culinary kitchens & banquet operations.",
    storageLocationsCount: 12,
    totalBinsCount: 80,
    occupiedBinsCount: 65,
    emptyBinsCount: 10,
    reservedBinsCount: 3,
    overloadedBinsCount: 2,
    totalVolumeCapacityCuM: 200,
    usedVolumeCapacityCuM: 160,
    totalWeightCapacityKg: 6000,
    usedWeightCapacityKg: 4800,
    manager: "Chef Marco",
    lastUpdated: "2026-07-23 04:15 PM",
    zones: [
      {
        id: "z-3",
        zoneName: "Spices & Condiments Zone",
        zoneCode: "Z-SPICE-01",
        aisleCount: 2,
        rackCount: 3,
        bins: [
          {
            id: "b-5",
            binCode: "BIN-SPC-C1-01",
            binName: "Indian Exotic Spices Bin",
            shelfName: "Shelf C1",
            rackName: "Rack C",
            zoneName: "Spices & Condiments Zone",
            capacityQty: 150,
            currentUtilizationQty: 120,
            maxWeightKg: 300,
            temperatureControlled: false,
            isExpiryStorage: true,
            isDefaultBin: true,
            barcode: "BAR-WH2-C101",
            qrCode: "QR-WH2-C101",
            status: "Active",
          },
        ],
      },
    ],
    inventory: [
      {
        id: "inv-3",
        itemCode: "FNB-SPC-09",
        itemName: "Organic Saffron 100g Pack",
        category: "Spices",
        batchNumber: "B-SAF-1102",
        quantity: 25,
        reservedQuantity: 5,
        availableQuantity: 20,
        expiryDate: "2027-12-31",
        unit: "Packs",
        binLocation: "BIN-SPC-C1-01",
      },
    ],
    users: [
      { id: "u-3", name: "Chef Marco", role: "Warehouse Manager", email: "marco.c@hotel.com", phone: "+91 98765 43212" },
      { id: "u-4", name: "Priya Das", role: "Supervisor", email: "priya.d@hotel.com", phone: "+91 98765 43213" },
    ],
    settings: {
      allowNegativeStock: false,
      enableFEFO: true,
      enableFIFO: true,
      requireApproval: true,
      defaultReceivingArea: "Kitchen Dock",
      defaultDispatchArea: "Kitchen Pantry",
      temperatureControlled: false,
      barcodeRequired: true,
      qrCodeRequired: true,
      autoBinAllocation: true,
      defaultIssueBin: "BIN-SPC-C1-01",
      defaultReceivingBin: "BIN-SPC-C1-01",
    },
    recentTransactions: [],
    alerts: [
      { id: "alt-3", type: "warning", title: "Perishable Expiry Alert", message: "Organic Saffron batch B-SAF-1102 due for audit.", actionText: "Inspect" },
    ],
    auditLogs: [
      { timestamp: "2026-07-23 04:15 PM", action: "Assigned new Store Keeper Priya", performedBy: "Chef Marco", status: "Success" },
    ],
  },
  {
    id: "wh-3",
    code: "WH-COLD-03",
    name: "Central Cold Storage & Walk-In Freezer",
    type: "Cold Storage",
    department: "Food & Beverage",
    address: "Basement Level 1, Cold Chain Block B",
    contactPerson: "Suresh Chander (Cold Chain Supervisor)",
    phone: "+91 98765 43214",
    email: "coldstore@grandhotel.com",
    status: "Active",
    description: "Temperature-controlled cold rooms (-18°C to +4°C) for meats, poultry, seafood, dairy, and fresh produce.",
    storageLocationsCount: 10,
    totalBinsCount: 60,
    occupiedBinsCount: 52,
    emptyBinsCount: 5,
    reservedBinsCount: 2,
    overloadedBinsCount: 1,
    totalVolumeCapacityCuM: 300,
    usedVolumeCapacityCuM: 260,
    totalWeightCapacityKg: 8000,
    usedWeightCapacityKg: 6900,
    manager: "Suresh Chander",
    lastUpdated: "2026-07-24 10:00 AM",
    zones: [
      {
        id: "z-4",
        zoneName: "Dairy & Cheese Chiller Bay (+3°C)",
        zoneCode: "Z-CHILL-01",
        aisleCount: 2,
        rackCount: 2,
        bins: [
          {
            id: "b-6",
            binCode: "BIN-CHILL-D1-01",
            binName: "Fresh Milk & Yogurt Cold Bin",
            shelfName: "Shelf D1",
            rackName: "Rack D",
            zoneName: "Dairy & Cheese Chiller Bay (+3°C)",
            capacityQty: 600,
            currentUtilizationQty: 500,
            maxWeightKg: 1200,
            temperatureControlled: true,
            targetTemp: "+3.5°C",
            isExpiryStorage: true,
            isDefaultBin: true,
            barcode: "BAR-WH3-D101",
            qrCode: "QR-WH3-D101",
            status: "Active",
          },
        ],
      },
    ],
    inventory: [
      {
        id: "inv-4",
        itemCode: "FNB-DRY-01",
        itemName: "Full Cream Fresh Milk 1L",
        category: "Dairy",
        batchNumber: "B-AML-8821",
        quantity: 500,
        reservedQuantity: 100,
        availableQuantity: 400,
        expiryDate: "2026-07-28",
        unit: "Litres",
        binLocation: "BIN-CHILL-D1-01",
      },
    ],
    users: [
      { id: "u-5", name: "Suresh Chander", role: "Warehouse Manager", email: "suresh.c@hotel.com", phone: "+91 98765 43214" },
    ],
    settings: {
      allowNegativeStock: false,
      enableFEFO: true,
      enableFIFO: true,
      requireApproval: true,
      defaultReceivingArea: "Cold Chiller Receiving Bay",
      defaultDispatchArea: "Kitchen Dispatch",
      temperatureControlled: true,
      barcodeRequired: true,
      qrCodeRequired: true,
      autoBinAllocation: true,
      defaultIssueBin: "BIN-CHILL-D1-01",
      defaultReceivingBin: "BIN-CHILL-D1-01",
    },
    recentTransactions: [],
    alerts: [
      { id: "alt-4", type: "danger", title: "Temperature Alert Verified", message: "Cold room temp maintained steady at +3.5°C.", actionText: "Check Sensor" },
    ],
    auditLogs: [
      { timestamp: "2026-07-24 10:00 AM", action: "Verified temperature log at 3.5°C", performedBy: "Suresh Chander", status: "Success" },
    ],
  },
];
