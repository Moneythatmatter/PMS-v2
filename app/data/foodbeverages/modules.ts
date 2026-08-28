import { fbMasterPageDefinitions } from "./mastersPages";

export type OutletScope = "restaurant" | "kitchen" | "none";

export interface FbOutlet {
  id: string;
  name: string;
  type: "restaurant" | "cafe" | "bar" | "kitchen";
}

export const restaurantOutlets: FbOutlet[] = [
  { id: "rest-1", name: "Restaurant #1", type: "restaurant" },
  { id: "rest-2", name: "Restaurant #2", type: "restaurant" },
  { id: "cafe-1", name: "Lobby Cafe", type: "cafe" },
  { id: "cafe-2", name: "Pool Cafe", type: "cafe" },
];

export const kitchenOutlets: FbOutlet[] = [
  { id: "main-kitchen", name: "Main Kitchen", type: "kitchen" },
  { id: "indian-kitchen", name: "Indian Kitchen", type: "kitchen" },
  { id: "continental-kitchen", name: "Continental Kitchen", type: "kitchen" },
  { id: "italian-kitchen", name: "Italian Kitchen", type: "kitchen" },
];

export interface FbStat {
  label: string;
  value: string | number;
  accent?: string;
  sublabel?: string;
}

export interface FbColumn {
  key: string;
  header: string;
  format?: "currency" | "percent";
  align?: "left" | "center" | "right";
  inputType?: "text" | "number" | "select" | "currency" | "tel" | "time" | "date";
  options?: { value: string; label: string }[] | string[];
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number | string;
  pattern?: string;
  patternMessage?: string;
}

export interface FbRow {
  id: string;
  status?: string;
  outletId?: string;
  [key: string]: string | number | undefined;
}

export interface FbPageDefinition {
  title: string;
  description: string;
  outletScope?: OutletScope;
  stats: FbStat[];
  columns: FbColumn[];
  rows: FbRow[];
  searchPlaceholder: string;
  filterOptions?: { id: string; label: string }[];
  filterKeys?: string[];
  actionLabel?: string;
  secondaryActions?: string[];
  statusStyle?: "pill" | "live";
}

const statusColors: Record<string, string> = {
  Available: "bg-emerald-50 text-emerald-700",
  Reserved: "bg-orange-50 text-orange-700",
  Occupied: "bg-red-50 text-red-700",
  Billing: "bg-violet-50 text-violet-700",
  Open: "bg-emerald-50 text-emerald-800",
  Confirmed: "bg-emerald-50 text-emerald-800",
  Seated: "bg-emerald-50 text-emerald-700",
  "No Show": "bg-slate-100 text-slate-600",
  Cancelled: "bg-red-50 text-red-700",
  Pending: "bg-amber-50 text-amber-700",
  Preparing: "bg-amber-50 text-amber-700",
  Ready: "bg-emerald-50 text-emerald-700",
  Served: "bg-slate-100 text-slate-600",
  Settled: "bg-emerald-50 text-emerald-700",
  Closed: "bg-slate-100 text-slate-600",
  Active: "bg-emerald-50 text-emerald-700",
  Inactive: "bg-slate-100 text-slate-600",
  Booked: "bg-sky-50 text-sky-700",
  Draft: "bg-slate-100 text-slate-600",
  Approved: "bg-emerald-50 text-emerald-700",
  Issued: "bg-emerald-50 text-emerald-800",
  Received: "bg-emerald-50 text-emerald-700",
  "In Progress": "bg-amber-50 text-amber-700",
  Completed: "bg-emerald-50 text-emerald-700",
  Posted: "bg-emerald-50 text-emerald-700",
  "Dine In": "bg-emerald-50 text-emerald-800",
  Takeaway: "bg-violet-50 text-violet-700",
  "Room Service": "bg-amber-50 text-amber-700",
  Online: "bg-cyan-50 text-cyan-700",
};

const liveStatusMeta: Record<string, { dot: string; className: string }> = {
  Available: { dot: "bg-emerald-500", className: "bg-emerald-50 text-emerald-800" },
  Reserved: { dot: "bg-orange-500", className: "bg-orange-50 text-orange-800" },
  Occupied: { dot: "bg-red-500", className: "bg-red-50 text-red-800" },
  Billing: { dot: "bg-violet-500", className: "bg-violet-50 text-violet-800" },
};

export function fbStatusClass(status: string) {
  return statusColors[status] ?? "bg-slate-100 text-slate-600";
}

export function fbLiveStatusMeta(status: string) {
  return liveStatusMeta[status] ?? { dot: "bg-slate-400", className: "bg-slate-100 text-slate-600" };
}

function page(
  partial: FbPageDefinition,
): FbPageDefinition {
  return partial;
}

export const fbPageDefinitions: Record<string, FbPageDefinition> = {
  ...fbMasterPageDefinitions,
  /* ——— Restaurants ——— */
  "/food-beverages/restaurants/outlets": page({
    title: "Outlets",
    description: "Manage restaurant and cafe outlets. Select an outlet on operational pages.",
    outletScope: "none",
    actionLabel: "Add Outlet",
    searchPlaceholder: "Search outlet…",
    filterOptions: [
      { id: "all", label: "All" },
      { id: "Active", label: "Active" },
      { id: "Inactive", label: "Inactive" },
    ],
    stats: [
      { label: "Outlets", value: 4, sublabel: "Restaurants & cafes" },
      { label: "Active", value: 4, accent: "#10b981", sublabel: "Open today" },
      { label: "Tables", value: 48, sublabel: "Across outlets" },
    ],
    columns: [
      {
        key: "name",
        header: "Outlet Name",
        inputType: "text",
        placeholder: "e.g. Grand Dining Room",
        helperText: "Unique display name for the restaurant, cafe or bar",
        required: true,
      },
      {
        key: "type",
        header: "Outlet Type",
        inputType: "select",
        options: [
          { value: "Restaurant", label: "Restaurant" },
          { value: "Cafe", label: "Cafe" },
          { value: "Kitchen", label: "Kitchen" },
          { value: "Bar", label: "Bar" },
        ],
        placeholder: "Select outlet type",
        helperText: "Operational category of this outlet",
        required: true,
      },
      {
        key: "tables",
        header: "Number of Tables",
        inputType: "number",
        min: 0,
        placeholder: "e.g. 15",
        helperText: "Total seating tables available (digits only)",
        required: true,
      },
      {
        key: "status",
        header: "Status",
        inputType: "select",
        options: [
          { value: "Active", label: "Active" },
          { value: "Inactive", label: "Inactive" },
        ],
        helperText: "Operational status of this outlet",
        required: true,
      },
      {
        key: "bookingStatus",
        header: "Booking Status",
        inputType: "select",
        options: [
          { value: "Available", label: "Available" },
          { value: "Booked", label: "Booked" },
        ],
        helperText: "Current booking / seating availability",
        required: true,
      },
    ],
    rows: [
      { id: "O1", name: "Restaurant #1", type: "Restaurant", tables: 16, status: "Active", bookingStatus: "Available", outletId: "rest-1" },
      { id: "O2", name: "Restaurant #2", type: "Restaurant", tables: 12, status: "Active", bookingStatus: "Booked", outletId: "rest-2" },
      { id: "O3", name: "Lobby Cafe", type: "Cafe", tables: 10, status: "Active", bookingStatus: "Available", outletId: "cafe-1" },
      { id: "O4", name: "Pool Cafe", type: "Cafe", tables: 10, status: "Inactive", bookingStatus: "Booked", outletId: "cafe-2" },
    ],
  }),

  "/food-beverages/restaurants/tables": page({
    title: "Tables",
    description: "Add and edit tables, and manage table map / QR codes.",
    outletScope: "restaurant",
    actionLabel: "Add Table",
    secondaryActions: ["Table Map", "QR Codes"],
    searchPlaceholder: "Search table…",
    filterOptions: [
      { id: "all", label: "All" },
      { id: "Available", label: "Available" },
      { id: "Occupied", label: "Occupied" },
      { id: "Reserved", label: "Reserved" },
    ],
    stats: [
      { label: "Tables", value: 16, sublabel: "Selected outlet" },
      { label: "Available", value: 8, accent: "#10b981", sublabel: "Ready to seat" },
      { label: "Occupied", value: 5, accent: "#ef4444", sublabel: "In service" },
      { label: "Reserved", value: 3, accent: "#f59e0b", sublabel: "Upcoming" },
    ],
    columns: [
      {
        key: "tableNo",
        header: "Table",
        inputType: "text",
        placeholder: "e.g. T-01",
        helperText: "Unique table number for this outlet",
        required: true,
      },
      {
        key: "outletId",
        header: "Outlet",
        inputType: "select",
        options: [],
        placeholder: "Select outlet",
        helperText: "Restaurant or cafe this table belongs to",
        required: true,
      },
      {
        key: "capacity",
        header: "Capacity",
        inputType: "number",
        min: 1,
        max: 50,
        step: 1,
        placeholder: "e.g. 4",
        helperText: "Number of seats (whole number only)",
        required: true,
      },
      {
        key: "shape",
        header: "Shape",
        inputType: "select",
        options: [
          { value: "Round", label: "Round" },
          { value: "Square", label: "Square" },
          { value: "Rectangle", label: "Rectangle" },
        ],
        placeholder: "Select shape",
        helperText: "Physical table shape",
        required: true,
      },
      {
        key: "qr",
        header: "QR",
        inputType: "select",
        options: [
          { value: "Pending", label: "Pending" },
          { value: "Linked", label: "Linked" },
        ],
        placeholder: "Select QR status",
        helperText: "QR code linking status",
        required: true,
      },
      {
        key: "status",
        header: "Status",
        inputType: "select",
        options: [
          { value: "Available", label: "Available" },
          { value: "Occupied", label: "Occupied" },
          { value: "Reserved", label: "Reserved" },
        ],
        placeholder: "Select status",
        helperText: "Current table status",
        required: true,
      },
    ],
    rows: [
      { id: "T1", tableNo: "T-01", section: "Garden", capacity: 2, shape: "Round", qr: "Linked", status: "Available", outletId: "rest-1" },
      { id: "T2", tableNo: "T-02", section: "Garden", capacity: 4, shape: "Square", qr: "Linked", status: "Occupied", outletId: "rest-1" },
      { id: "T3", tableNo: "T-04", section: "Indoor", capacity: 4, shape: "Square", qr: "Linked", status: "Occupied", outletId: "rest-1" },
      { id: "T4", tableNo: "T-07", section: "Indoor", capacity: 6, shape: "Rectangle", qr: "Pending", status: "Reserved", outletId: "rest-1" },
      { id: "T5", tableNo: "T-09", section: "Window", capacity: 2, shape: "Round", qr: "Linked", status: "Available", outletId: "rest-1" },
      { id: "T6", tableNo: "T-01", section: "Main", capacity: 4, shape: "Square", qr: "Linked", status: "Available", outletId: "rest-2" },
      { id: "T7", tableNo: "T-03", section: "Main", capacity: 8, shape: "Rectangle", qr: "Linked", status: "Occupied", outletId: "rest-2" },
    ],
  }),


  "/food-beverages/restaurants/reservations": page({
    title: "Reservations",
    description: "Table reservations for dine-in guests. Merge or split tables when seating parties.",
    outletScope: "restaurant",
    actionLabel: "New Reservation",
    secondaryActions: ["Merge Tables", "Split Tables"],
    searchPlaceholder: "Search guest, phone, or table…",
    filterOptions: [
      { id: "all", label: "All" },
      { id: "Confirmed", label: "Confirmed" },
      { id: "Seated", label: "Seated" },
      { id: "No Show", label: "No Show" },
      { id: "Cancelled", label: "Cancelled" },
    ],
    stats: [
      { label: "Today", value: 14, accent: "#15803d", sublabel: "Reservations" },
      { label: "Confirmed", value: 9, accent: "#10b981", sublabel: "Awaiting arrival" },
      { label: "Seated", value: 3, sublabel: "Already dining" },
      { label: "Covers Booked", value: 42, sublabel: "Tonight" },
    ],
    columns: [
      {
        key: "resNo",
        header: "Res #",
        inputType: "text",
        placeholder: "e.g. TR-1045",
        helperText: "Reservation reference number",
        required: true,
      },
      {
        key: "guest",
        header: "Guest",
        inputType: "text",
        placeholder: "e.g. Anita Desai",
        helperText: "Guest full name",
        required: true,
      },
      {
        key: "phone",
        header: "Phone",
        inputType: "tel",
        placeholder: "e.g. 9876543210",
        helperText: "10-digit mobile number",
        required: true,
        pattern: "^(\\+91[\\s-]?)?[6-9]\\d{9}$",
        patternMessage: "Enter a valid 10-digit Indian mobile number",
      },
      {
        key: "time",
        header: "Time",
        inputType: "time",
        placeholder: "Select time",
        helperText: "Reservation time",
        required: true,
      },
      {
        key: "covers",
        header: "Covers",
        inputType: "number",
        min: 1,
        max: 50,
        step: 1,
        placeholder: "e.g. 4",
        helperText: "Number of guests (whole number)",
        required: true,
      },
      {
        key: "outletId",
        header: "Outlet",
        inputType: "select",
        options: [],
        placeholder: "Select outlet",
        helperText: "Restaurant or cafe for this reservation",
        required: true,
      },
      {
        key: "tableNo",
        header: "Table",
        inputType: "select",
        options: [],
        placeholder: "Select table",
        helperText: "Assign a table at the selected outlet",
        required: true,
      },
      {
        key: "status",
        header: "Status",
        inputType: "select",
        options: [
          { value: "Confirmed", label: "Confirmed" },
          { value: "Seated", label: "Seated" },
          { value: "No Show", label: "No Show" },
          { value: "Cancelled", label: "Cancelled" },
        ],
        helperText: "Reservation status",
        required: true,
      },
    ],
    rows: [
      { id: "R1", resNo: "TR-1042", guest: "Anita Desai", phone: "+91 98765 11111", time: "7:30 PM", covers: 4, tableNo: "T-07", status: "Confirmed", outletId: "rest-1" },
      { id: "R2", resNo: "TR-1043", guest: "Michael Brown", phone: "+91 98765 22222", time: "8:00 PM", covers: 2, tableNo: "T-09", status: "Confirmed", outletId: "rest-1" },
      { id: "R3", resNo: "TR-1040", guest: "Priya Patel", phone: "+91 98765 33333", time: "1:00 PM", covers: 4, tableNo: "T-04", status: "Seated", outletId: "rest-1" },
      { id: "R4", resNo: "TR-1038", guest: "Sarah Chen", phone: "+91 98765 44444", time: "7:00 PM", covers: 6, tableNo: "—", status: "Cancelled", outletId: "rest-2" },
    ],
  }),


  "/food-beverages/restaurants/cashier": page({
    title: "Cashier",
    description: "Shift opening, shift closing, and cash report for the outlet.",
    outletScope: "restaurant",
    actionLabel: "Open Shift",
    secondaryActions: ["Close Shift", "Cash Report"],
    searchPlaceholder: "Search cashier or shift…",
    filterOptions: [
      { id: "all", label: "All" },
      { id: "Open", label: "Open" },
      { id: "Closed", label: "Closed" },
      { id: "Pending", label: "Pending" },
    ],
    stats: [
      { label: "Open Shifts", value: 1, accent: "#f59e0b", sublabel: "Needs close" },
      { label: "Shift Sales", value: "₹28,400", accent: "#15803d", sublabel: "Current shift" },
      { label: "Expected Cash", value: "₹8,200", sublabel: "System" },
      { label: "Variance", value: "−₹50", accent: "#ef4444", sublabel: "Last close" },
    ],
    columns: [
      {
        key: "cashier",
        header: "Cashier",
        inputType: "text",
        placeholder: "e.g. Amit Kumar",
        helperText: "Cashier name for this shift",
        required: true,
      },
      {
        key: "outletId",
        header: "Outlet",
        inputType: "select",
        options: [],
        placeholder: "Select outlet",
        helperText: "Outlet this shift belongs to",
        required: true,
      },
      {
        key: "shift",
        header: "Shift",
        inputType: "select",
        options: [
          { value: "Breakfast", label: "Breakfast" },
          { value: "Lunch", label: "Lunch" },
          { value: "Dinner", label: "Dinner" },
          { value: "Current", label: "Current" },
        ],
        placeholder: "Select shift",
        helperText: "Service period for the shift",
        required: true,
      },
      {
        key: "openedAt",
        header: "Opened",
        inputType: "time",
        placeholder: "Select time",
        helperText: "Shift open time",
        required: true,
      },
      {
        key: "openingFloat",
        header: "Opening",
        inputType: "currency",
        placeholder: "e.g. 2000",
        helperText: "Opening cash float",
        required: true,
      },
      {
        key: "sales",
        header: "Sales",
        inputType: "currency",
        placeholder: "e.g. 28400",
        helperText: "Optional — system sales for the shift",
      },
      {
        key: "declared",
        header: "Declared",
        inputType: "currency",
        placeholder: "e.g. 14180",
        helperText: "Optional — cash declared at close",
      },
      {
        key: "status",
        header: "Status",
        inputType: "select",
        options: [
          { value: "Open", label: "Open" },
          { value: "Closed", label: "Closed" },
          { value: "Pending", label: "Pending" },
        ],
        helperText: "Shift open / close status",
        required: true,
      },
    ],
    rows: [
      { id: "C1", cashier: "Amit Kumar", shift: "Lunch", openedAt: "11:00 AM", openingFloat: "₹2,000", sales: "₹28,400", declared: "—", status: "Open", outletId: "rest-1" },
      { id: "C2", cashier: "Neha Singh", shift: "Breakfast", openedAt: "7:00 AM", openingFloat: "₹1,500", sales: "₹14,200", declared: "₹14,180", status: "Closed", outletId: "rest-1" },
      { id: "C3", cashier: "Ravi Menon", shift: "Dinner", openedAt: "—", openingFloat: "—", sales: "—", declared: "—", status: "Pending", outletId: "rest-2" },
    ],
  }),

  "/food-beverages/restaurants/day-close": page({
    title: "Day Close",
    description: "End-of-day close checklist for the selected restaurant outlet.",
    outletScope: "restaurant",
    actionLabel: "Run Day Close",
    searchPlaceholder: "Search checkpoint…",
    filterOptions: [
      { id: "all", label: "All" },
      { id: "Pending", label: "Pending" },
      { id: "Completed", label: "Completed" },
    ],
    stats: [
      { label: "Business Date", value: "13 Jul", sublabel: "Current day" },
      { label: "Open Checks", value: 1, accent: "#f59e0b", sublabel: "Must settle" },
      { label: "Day Sales", value: "₹48,620", accent: "#15803d", sublabel: "Gross" },
      { label: "Status", value: "Open", accent: "#f59e0b", sublabel: "Not closed" },
    ],
    columns: [
      {
        key: "outletId",
        header: "Outlet",
        inputType: "select",
        options: [],
        placeholder: "Select outlet",
        helperText: "Outlet running this day close",
        required: true,
      },
      {
        key: "checkpoint",
        header: "Checkpoint",
        inputType: "text",
        placeholder: "e.g. Open tables",
        helperText: "Day-close checklist item",
        required: true,
      },
      {
        key: "detail",
        header: "Detail",
        inputType: "text",
        placeholder: "e.g. Active covers must be closed",
        helperText: "What must be verified",
        required: true,
      },
      {
        key: "count",
        header: "Count",
        inputType: "number",
        min: 0,
        step: 1,
        placeholder: "e.g. 0",
        helperText: "Outstanding count for this checkpoint",
        required: true,
      },
      {
        key: "status",
        header: "Status",
        inputType: "select",
        options: [
          { value: "Pending", label: "Pending" },
          { value: "Completed", label: "Completed" },
        ],
        helperText: "Checkpoint completion status",
        required: true,
      },
    ],
    rows: [
      { id: "D1", checkpoint: "Open tables", detail: "Active covers must be closed", count: 1, status: "Pending", outletId: "rest-1" },
      { id: "D2", checkpoint: "Cashier shifts", detail: "All shifts closed", count: 0, status: "Completed", outletId: "rest-1" },
      { id: "D3", checkpoint: "Void / comps", detail: "Manager approval complete", count: 2, status: "Completed", outletId: "rest-1" },
      { id: "D4", checkpoint: "Sales post to FO", detail: "Room charge sync", count: 3, status: "Pending", outletId: "rest-1" },
    ],
  }),


  /* ——— Menu ——— */
  "/food-beverages/menu/categories": page({
    title: "Categories",
    description: "Hierarchical menu categories shared across outlets.",
    outletScope: "none",
    actionLabel: "Add Category",
    searchPlaceholder: "Search category…",
    filterOptions: [
      { id: "all", label: "All" },
      { id: "Active", label: "Active" },
      { id: "Inactive", label: "Inactive" },
    ],
    filterKeys: ["status"],
    stats: [
      { label: "Categories", value: 12, sublabel: "Configured" },
      { label: "Active", value: 10, accent: "#10b981", sublabel: "On menu" },
      { label: "Top Level", value: 8, sublabel: "Root categories" },
      { label: "Inactive", value: 2, accent: "#f59e0b", sublabel: "Hidden" },
    ],
    columns: [
      {
        key: "code",
        header: "Code",
        inputType: "text",
        placeholder: "e.g. STAR",
        helperText: "Unique category code",
        required: true,
      },
      {
        key: "name",
        header: "Category",
        inputType: "text",
        placeholder: "e.g. Starters",
        helperText: "Category display name",
        required: true,
      },
      {
        key: "description",
        header: "Description",
        inputType: "text",
        placeholder: "e.g. Appetizers and small plates",
        helperText: "Optional description",
      },
      {
        key: "parentId",
        header: "Parent ID",
        inputType: "text",
        placeholder: "Leave blank for top-level",
        helperText: "Parent category UUID (optional)",
      },
      {
        key: "displayOrder",
        header: "Order",
        inputType: "number",
        min: 0,
        step: 1,
        placeholder: "e.g. 1",
        helperText: "Display sort order",
        required: true,
      },
      {
        key: "isActive",
        header: "Status",
        inputType: "select",
        options: [
          { value: "true", label: "Active" },
          { value: "false", label: "Inactive" },
        ],
        helperText: "Whether category is visible on menu",
        required: true,
      },
    ],
    rows: [
      {
        id: "a1000001-0000-4000-8000-000000000001",
        code: "STAR",
        name: "Starters",
        description: "Appetizers and small plates",
        displayOrder: 1,
        isActive: "true",
        status: "Active",
      },
      {
        id: "a1000001-0000-4000-8000-000000000002",
        code: "MAIN",
        name: "Main Course",
        description: "Curries, grills, and mains",
        displayOrder: 2,
        isActive: "true",
        status: "Active",
      },
      {
        id: "a1000001-0000-4000-8000-000000000003",
        code: "BEV",
        name: "Beverages",
        description: "Hot and cold drinks",
        displayOrder: 3,
        isActive: "true",
        status: "Active",
      },
      {
        id: "a1000001-0000-4000-8000-000000000005",
        code: "VEG-STAR",
        name: "Vegetarian Starters",
        description: "Vegetarian appetizers",
        parentId: "a1000001-0000-4000-8000-000000000001",
        displayOrder: 1,
        isActive: "true",
        status: "Active",
      },
    ],
  }),

  "/food-beverages/menu/items": page({
    title: "Items",
    description: "Sellable menu items linked to categories and tax groups.",
    outletScope: "none",
    actionLabel: "Add Item",
    searchPlaceholder: "Search item or code…",
    filterOptions: [
      { id: "all", label: "All" },
      { id: "Active", label: "Active" },
      { id: "Inactive", label: "Inactive" },
    ],
    filterKeys: ["status"],
    stats: [
      { label: "Items", value: 86, sublabel: "In menu" },
      { label: "Active", value: 79, accent: "#10b981", sublabel: "Sellable" },
      { label: "Vegetarian", value: 24, sublabel: "Veg items" },
    ],
    columns: [
      {
        key: "itemCode",
        header: "Code",
        inputType: "text",
        placeholder: "e.g. IT-BC01",
        helperText: "Unique item code",
        required: true,
      },
      {
        key: "name",
        header: "Item",
        inputType: "text",
        placeholder: "e.g. Butter Chicken",
        helperText: "Menu item name",
        required: true,
      },
      {
        key: "description",
        header: "Description",
        inputType: "text",
        placeholder: "Short description",
        helperText: "Optional item description",
      },
      {
        key: "categoryId",
        header: "Category",
        inputType: "select",
        options: [],
        helperText: "Menu category",
        required: true,
      },
      {
        key: "taxGroupId",
        header: "Tax Group",
        inputType: "select",
        options: [],
        helperText: "Tax group (optional)",
      },
      {
        key: "price",
        header: "Price",
        inputType: "currency",
        placeholder: "e.g. 420",
        helperText: "Default sell price (₹)",
        required: true,
      },
      {
        key: "isVegetarian",
        header: "Vegetarian",
        inputType: "select",
        options: [
          { value: "true", label: "Yes" },
          { value: "false", label: "No" },
        ],
        helperText: "Vegetarian item flag",
        required: true,
      },
      {
        key: "displayOrder",
        header: "Order",
        inputType: "number",
        min: 0,
        step: 1,
        placeholder: "e.g. 1",
        helperText: "Menu display sort order",
        required: true,
      },
      {
        key: "imageUrl",
        header: "Image URL",
        inputType: "text",
        placeholder: "https://…",
        helperText: "Optional item image",
        required: false,
      },
      {
        key: "isActive",
        header: "Status",
        inputType: "select",
        options: [
          { value: "true", label: "Active" },
          { value: "false", label: "Inactive" },
        ],
        helperText: "Whether item is sellable",
        required: true,
      },
    ],
    rows: [
      {
        id: "e3000001-0000-4000-8000-000000000001",
        itemCode: "IT-BC01",
        name: "Butter Chicken",
        description: "Creamy tomato-based curry",
        categoryId: "a1000001-0000-4000-8000-000000000002",
        isVegetarian: "false",
        displayOrder: 1,
        isActive: "true",
        status: "Active",
      },
      {
        id: "e3000001-0000-4000-8000-000000000002",
        itemCode: "IT-PT01",
        name: "Paneer Tikka",
        categoryId: "a1000001-0000-4000-8000-000000000001",
        isVegetarian: "true",
        displayOrder: 2,
        isActive: "true",
        status: "Active",
      },
    ],
  }),

  "/food-beverages/menu/modifiers": page({
    title: "Modifiers",
    description: "Add-ons and modifiers linked to menu items.",
    outletScope: "none",
    actionLabel: "Add Modifier",
    searchPlaceholder: "Search modifier…",
    filterOptions: [{ id: "all", label: "All" }, { id: "Active", label: "Active" }, { id: "Draft", label: "Draft" }],
    stats: [
      { label: "Modifiers", value: 18, sublabel: "Configured" },
      { label: "Active", value: 15, accent: "#10b981", sublabel: "On POS" },
      { label: "Linked Items", value: 42, sublabel: "Menu links" },
      { label: "Avg Price", value: "₹65", sublabel: "Per modifier" },
    ],
    columns: [
      {
        key: "code",
        header: "Code",
        inputType: "text",
        placeholder: "e.g. AO-01",
        helperText: "Modifier code",
        required: true,
      },
      {
        key: "name",
        header: "Modifier",
        inputType: "text",
        placeholder: "e.g. Extra Cheese",
        helperText: "Modifier display name",
        required: true,
      },
      {
        key: "group",
        header: "Group",
        inputType: "text",
        placeholder: "e.g. Toppings",
        helperText: "Modifier group",
        required: true,
      },
      {
        key: "price",
        header: "Price",
        inputType: "currency",
        placeholder: "e.g. 40",
        helperText: "Add-on price (0 allowed)",
        required: true,
      },
      {
        key: "items",
        header: "Linked",
        inputType: "number",
        min: 0,
        step: 1,
        placeholder: "e.g. 12",
        helperText: "Linked menu items",
        required: true,
      },
      {
        key: "status",
        header: "Status",
        inputType: "select",
        options: [
          { value: "Active", label: "Active" },
          { value: "Draft", label: "Draft" },
        ],
        helperText: "Publish status",
        required: true,
      },
    ],
    rows: [
      { id: "MD1", code: "AO-01", name: "Extra Cheese", group: "Toppings", price: "₹40", items: 12, status: "Active" },
      { id: "MD2", code: "AO-02", name: "Extra Spicy", group: "Spice", price: "₹0", items: 20, status: "Active" },
      { id: "MD3", code: "AO-03", name: "Garlic Bread", group: "Sides", price: "₹80", items: 6, status: "Active" },
      { id: "MD4", code: "AO-04", name: "Truffle Oil", group: "Premium", price: "₹120", items: 4, status: "Draft" },
    ],
  }),

  "/food-beverages/menu/recipes": page({
    title: "Recipes",
    description: "Recipe cards with ingredients, yield, and food cost.",
    outletScope: "none",
    actionLabel: "Add Recipe",
    searchPlaceholder: "Search recipe…",
    filterOptions: [{ id: "all", label: "All" }, { id: "Active", label: "Active" }, { id: "Draft", label: "Draft" }],
    stats: [
      { label: "Recipes", value: 64, sublabel: "Costed" },
      { label: "Avg Food Cost", value: "32%", accent: "#15803d", sublabel: "Target 30%" },
      { label: "High Cost", value: 7, accent: "#ef4444", sublabel: "Above target" },
      { label: "Linked Items", value: 58, sublabel: "Menu mapped" },
    ],
    columns: [
      {
        key: "recipe",
        header: "Recipe",
        inputType: "text",
        placeholder: "e.g. Butter Chicken",
        helperText: "Recipe name",
        required: true,
      },
      {
        key: "yield",
        header: "Yield",
        inputType: "text",
        placeholder: "e.g. 4 portions",
        helperText: "Yield / portions",
        required: true,
      },
      {
        key: "cost",
        header: "Cost",
        inputType: "currency",
        placeholder: "e.g. 145",
        helperText: "Recipe cost",
        required: true,
      },
      {
        key: "pct",
        header: "Cost %",
        inputType: "text",
        placeholder: "e.g. 34.5%",
        helperText: "Food cost percentage",
        required: true,
      },
      {
        key: "status",
        header: "Status",
        inputType: "select",
        options: [
          { value: "Active", label: "Active" },
          { value: "Draft", label: "Draft" },
        ],
        helperText: "Recipe status",
        required: true,
      },
    ],
    rows: [
      { id: "RC1", recipe: "Butter Chicken", yield: "4 portions", cost: "₹145", pct: "34.5%", status: "Active" },
      { id: "RC2", recipe: "Dal Makhani", yield: "6 portions", cost: "₹72", pct: "25.7%", status: "Active" },
      { id: "RC3", recipe: "Paneer Tikka", yield: "4 portions", cost: "₹98", pct: "30.6%", status: "Active" },
    ],
  }),

  /* ——— Kitchen ——— */
  "/food-beverages/kitchen/orders": page({
    title: "Kitchen Orders",
    description: "All kitchen tickets routed from restaurant and room service.",
    outletScope: "kitchen",
    searchPlaceholder: "Search order…",
    filterOptions: [
      { id: "all", label: "All" },
      { id: "Pending", label: "Pending" },
      { id: "Preparing", label: "Preparing" },
      { id: "Ready", label: "Ready" },
      { id: "Served", label: "Served" },
    ],
    stats: [
      { label: "Orders Today", value: 64, accent: "#15803d", sublabel: "All kitchens" },
      { label: "In Prep", value: 8, accent: "#f59e0b", sublabel: "Active" },
      { label: "Completed", value: 52, accent: "#10b981", sublabel: "Served" },
      { label: "Cancelled", value: 4, accent: "#ef4444", sublabel: "Voided" },
    ],
    columns: [
      { key: "orderNo", header: "Order" },
      { key: "source", header: "Source" },
      { key: "items", header: "Items" },
      { key: "priority", header: "Priority" },
      { key: "time", header: "Fired" },
      { key: "status", header: "Status" },
    ],
    rows: [],
  }),

  /* ——— Inventory ——— */
  "/food-beverages/inventory/ingredients": page({
    title: "Ingredients",
    description: "Raw materials and perishable stock items.",
    outletScope: "none",
    actionLabel: "Add Ingredient",
    searchPlaceholder: "Search ingredient…",
    filterOptions: [{ id: "all", label: "All" }, { id: "Active", label: "Active" }, { id: "Low Stock", label: "Low Stock" }],
    stats: [
      { label: "SKUs", value: 186, sublabel: "Ingredients" },
      { label: "Low Stock", value: 9, accent: "#ef4444", sublabel: "Below reorder" },
      { label: "Value On Hand", value: "₹4.8L", accent: "#15803d", sublabel: "Store" },
      { label: "Expiring 7d", value: 6, accent: "#f59e0b", sublabel: "Watch list" },
    ],
    columns: [
      {
        key: "code",
        header: "Code",
        inputType: "text",
        placeholder: "e.g. RM-01",
        helperText: "Ingredient SKU code",
        required: true,
      },
      {
        key: "name",
        header: "Ingredient",
        inputType: "text",
        placeholder: "e.g. Basmati Rice",
        helperText: "Ingredient name",
        required: true,
      },
      {
        key: "uom",
        header: "UOM",
        inputType: "select",
        options: [
          { value: "Kg", label: "Kg" },
          { value: "Ltr", label: "Ltr" },
          { value: "Pcs", label: "Pcs" },
          { value: "Bunch", label: "Bunch" },
        ],
        placeholder: "Select UOM",
        helperText: "Unit of measure",
        required: true,
      },
      {
        key: "onHand",
        header: "On Hand",
        inputType: "number",
        min: 0,
        step: 1,
        placeholder: "e.g. 86",
        helperText: "Current stock quantity",
        required: true,
      },
      {
        key: "reorder",
        header: "Reorder",
        inputType: "number",
        min: 0,
        step: 1,
        placeholder: "e.g. 40",
        helperText: "Reorder level",
        required: true,
      },
      {
        key: "status",
        header: "Status",
        inputType: "select",
        options: [
          { value: "Active", label: "Active" },
          { value: "Low Stock", label: "Low Stock" },
        ],
        helperText: "Stock status",
        required: true,
      },
    ],
    rows: [
      { id: "IN1", code: "RM-01", name: "Basmati Rice", uom: "Kg", onHand: 86, reorder: 40, status: "Active" },
      { id: "IN2", code: "RM-02", name: "Paneer", uom: "Kg", onHand: 12, reorder: 15, status: "Low Stock" },
      { id: "IN3", code: "RM-03", name: "Chicken", uom: "Kg", onHand: 48, reorder: 25, status: "Active" },
      { id: "IN4", code: "RM-04", name: "Fresh Cream", uom: "Ltr", onHand: 8, reorder: 10, status: "Low Stock" },
    ],
  }),

  "/food-beverages/inventory/wastage": page({
    title: "Wastage",
    description: "Spoilage, breakage, and write-off logging.",
    outletScope: "none",
    actionLabel: "Log Wastage",
    searchPlaceholder: "Search item or reason…",
    filterOptions: [
      { id: "all", label: "All" },
      { id: "Pending", label: "Pending" },
      { id: "Approved", label: "Approved" },
    ],
    stats: [
      { label: "Today", value: 3, accent: "#f59e0b", sublabel: "Entries" },
      { label: "Spoilage MTD", value: "₹12.4K", accent: "#ef4444", sublabel: "Food" },
      { label: "Breakage MTD", value: "₹3.2K", sublabel: "Crockery" },
      { label: "% of Sales", value: "0.9%", sublabel: "Target < 1%" },
    ],
    columns: [
      {
        key: "entryNo",
        header: "Entry",
        inputType: "text",
        placeholder: "e.g. WS-041",
        helperText: "Wastage entry number",
        required: true,
      },
      {
        key: "type",
        header: "Type",
        inputType: "select",
        options: [
          { value: "Spoilage", label: "Spoilage" },
          { value: "Breakage", label: "Breakage" },
        ],
        placeholder: "Select type",
        helperText: "Wastage type",
        required: true,
      },
      {
        key: "item",
        header: "Item",
        inputType: "text",
        placeholder: "e.g. Fresh Cream",
        helperText: "Item written off",
        required: true,
      },
      {
        key: "qty",
        header: "Qty",
        inputType: "number",
        min: 0,
        step: 1,
        placeholder: "e.g. 2",
        helperText: "Quantity wasted",
        required: true,
      },
      {
        key: "value",
        header: "Value",
        inputType: "currency",
        placeholder: "e.g. 480",
        helperText: "Write-off value",
        required: true,
      },
      {
        key: "reason",
        header: "Reason",
        inputType: "text",
        placeholder: "e.g. Expired",
        helperText: "Reason for wastage",
        required: true,
      },
      {
        key: "status",
        header: "Status",
        inputType: "select",
        options: [
          { value: "Pending", label: "Pending" },
          { value: "Approved", label: "Approved" },
        ],
        helperText: "Approval status",
        required: true,
      },
    ],
    rows: [
      { id: "W1", entryNo: "WS-041", type: "Spoilage", item: "Fresh Cream", qty: 2, value: "₹480", reason: "Expired", status: "Pending" },
      { id: "W2", entryNo: "WS-040", type: "Breakage", item: "Wine Glass", qty: 3, value: "₹450", reason: "Service drop", status: "Approved" },
      { id: "W3", entryNo: "WS-039", type: "Spoilage", item: "Salad Greens", qty: 2, value: "₹320", reason: "Wilted", status: "Approved" },
    ],
  }),

  "/food-beverages/inventory/adjustments": page({
    title: "Adjustments",
    description: "Stock quantity adjustments with reason codes.",
    outletScope: "none",
    actionLabel: "New Adjustment",
    searchPlaceholder: "Search adjustment…",
    filterOptions: [{ id: "all", label: "All" }, { id: "Pending", label: "Pending" }, { id: "Approved", label: "Approved" }],
    stats: [
      { label: "Pending", value: 2, accent: "#f59e0b", sublabel: "Awaiting approval" },
      { label: "MTD Adj", value: 14, sublabel: "Posted" },
      { label: "Value", value: "₹6,800", accent: "#ef4444", sublabel: "Net write-down" },
      { label: "Top Reason", value: "Damage", sublabel: "This month" },
    ],
    columns: [
      {
        key: "adjNo",
        header: "Adj #",
        inputType: "text",
        placeholder: "e.g. ADJ-31",
        helperText: "Adjustment number",
        required: true,
      },
      {
        key: "item",
        header: "Item",
        inputType: "text",
        placeholder: "e.g. Olive Oil",
        helperText: "Item being adjusted",
        required: true,
      },
      {
        key: "qty",
        header: "Qty",
        inputType: "number",
        step: 1,
        placeholder: "e.g. -2",
        helperText: "Signed quantity (+/-)",
        required: true,
      },
      {
        key: "reason",
        header: "Reason",
        inputType: "text",
        placeholder: "e.g. Damage",
        helperText: "Adjustment reason",
        required: true,
      },
      {
        key: "value",
        header: "Value",
        inputType: "currency",
        placeholder: "e.g. 1200",
        helperText: "Adjustment value",
        required: true,
      },
      {
        key: "status",
        header: "Status",
        inputType: "select",
        options: [
          { value: "Pending", label: "Pending" },
          { value: "Approved", label: "Approved" },
        ],
        helperText: "Approval status",
        required: true,
      },
    ],
    rows: [
      { id: "AD1", adjNo: "ADJ-31", item: "Olive Oil", qty: -2, reason: "Damage", value: "₹1,200", status: "Pending" },
      { id: "AD2", adjNo: "ADJ-30", item: "Basmati Rice", qty: 5, reason: "Count correction", value: "₹400", status: "Approved" },
    ],
  }),


  /* ——— Reports ——— */
  "/food-beverages/reports/daily-sales": page({
    title: "Daily Sales",
    description: "Day-wise F&B sales across outlets.",
    outletScope: "none",
    searchPlaceholder: "Search date or outlet…",
    filterOptions: [{ id: "all", label: "All" }],
    stats: [
      { label: "Today", value: "₹1.24L", accent: "#15803d", sublabel: "Gross sales" },
      { label: "Bills", value: 186, sublabel: "Settled" },
      { label: "Covers", value: 412, sublabel: "Guests" },
      { label: "vs Yesterday", value: "+6.2%", accent: "#10b981", sublabel: "Growth" },
    ],
    columns: [
      { key: "date", header: "Date" },
      { key: "bills", header: "Bills" },
      { key: "covers", header: "Covers" },
      { key: "sales", header: "Sales" },
      { key: "avgCheck", header: "Avg Check" },
      { key: "growth", header: "vs Prev" },
    ],
    rows: [
      { id: "DS1", date: "13 Jul", bills: 186, covers: 412, sales: "₹1,24,000", avgCheck: "₹667", growth: "+6.2%" },
      { id: "DS2", date: "12 Jul", bills: 172, covers: 390, sales: "₹1,16,800", avgCheck: "₹679", growth: "+2.1%" },
      { id: "DS3", date: "11 Jul", bills: 168, covers: 378, sales: "₹1,14,400", avgCheck: "₹681", growth: "-1.4%" },
    ],
  }),

  "/food-beverages/reports/item-sales": page({
    title: "Item Sales",
    description: "Top-selling menu items and contribution.",
    outletScope: "none",
    searchPlaceholder: "Search item…",
    filterOptions: [{ id: "all", label: "All" }],
    stats: [
      { label: "Items Sold", value: 1240, sublabel: "MTD qty" },
      { label: "Top Item", value: "Butter Chicken", accent: "#15803d", sublabel: "186 sold" },
      { label: "Revenue", value: "₹8.4L", sublabel: "Item sales" },
      { label: "Unique SKUs", value: 64, sublabel: "Sold MTD" },
    ],
    columns: [
      { key: "item", header: "Item" },
      { key: "category", header: "Category" },
      { key: "qty", header: "Qty" },
      { key: "sales", header: "Sales" },
      { key: "share", header: "Share" },
    ],
    rows: [
      { id: "IS1", item: "Butter Chicken", category: "Main", qty: 186, sales: "₹78,120", share: "9.3%" },
      { id: "IS2", item: "Dal Makhani", category: "Main", qty: 154, sales: "₹43,120", share: "5.1%" },
      { id: "IS3", item: "Classic Mojito", category: "Bar", qty: 128, sales: "₹53,760", share: "6.4%" },
    ],
  }),

  "/food-beverages/reports/category-sales": page({
    title: "Category Sales",
    description: "Sales mix by menu category.",
    outletScope: "none",
    searchPlaceholder: "Search category…",
    filterOptions: [{ id: "all", label: "All" }],
    stats: [
      { label: "Categories", value: 12, sublabel: "With sales" },
      { label: "Top Category", value: "Main Course", accent: "#15803d", sublabel: "38% mix" },
      { label: "Beverages", value: "22%", sublabel: "Of total" },
      { label: "Desserts", value: "8%", sublabel: "Of total" },
    ],
    columns: [
      { key: "category", header: "Category" },
      { key: "qty", header: "Qty" },
      { key: "sales", header: "Sales" },
      { key: "share", header: "Share" },
      { key: "growth", header: "vs LM" },
    ],
    rows: [
      { id: "CS1", category: "Main Course", qty: 420, sales: "₹3.2L", share: "38%", growth: "+7%" },
      { id: "CS2", category: "Starters", qty: 310, sales: "₹1.6L", share: "19%", growth: "+4%" },
      { id: "CS3", category: "Beverages / Bar", qty: 510, sales: "₹1.85L", share: "22%", growth: "+11%" },
    ],
  }),

  "/food-beverages/reports/outlet-sales": page({
    title: "Outlet Sales",
    description: "Performance comparison across F&B outlets.",
    outletScope: "none",
    searchPlaceholder: "Search outlet…",
    filterOptions: [{ id: "all", label: "All" }],
    stats: [
      { label: "Outlets", value: 8, sublabel: "Reporting" },
      { label: "Top Outlet", value: "Restaurant #1", accent: "#15803d", sublabel: "₹4.2L MTD" },
      { label: "MTD Total", value: "₹12.4L", sublabel: "All outlets" },
      { label: "Growth", value: "+8.4%", accent: "#10b981", sublabel: "vs last month" },
    ],
    columns: [
      { key: "outlet", header: "Outlet" },
      { key: "bills", header: "Bills" },
      { key: "covers", header: "Covers" },
      { key: "sales", header: "Sales" },
      { key: "avgCheck", header: "Avg Check" },
      { key: "growth", header: "vs LM" },
    ],
    rows: [
      { id: "OS1", outlet: "Restaurant #1", bills: 312, covers: 780, sales: "₹4.2L", avgCheck: "₹1,346", growth: "+9.2%" },
      { id: "OS2", outlet: "Restaurant #2", bills: 248, covers: 610, sales: "₹3.1L", avgCheck: "₹1,250", growth: "+5.1%" },
      { id: "OS3", outlet: "Main Bar", bills: 410, covers: 520, sales: "₹2.8L", avgCheck: "₹683", growth: "+11.0%" },
    ],
  }),

  "/food-beverages/reports/cashier": page({
    title: "Cashier Report",
    description: "Shift-wise cashier collections and variances.",
    outletScope: "restaurant",
    searchPlaceholder: "Search cashier…",
    filterOptions: [{ id: "all", label: "All" }, { id: "Closed", label: "Closed" }, { id: "Open", label: "Open" }],
    stats: [
      { label: "Collected", value: "₹1.42L", accent: "#15803d", sublabel: "Today" },
      { label: "Cash", value: "₹38.5K", sublabel: "27%" },
      { label: "Digital", value: "₹1.03L", sublabel: "Card + UPI" },
      { label: "Variance", value: "−₹70", accent: "#ef4444", sublabel: "Net" },
    ],
    columns: [
      { key: "cashier", header: "Cashier" },
      { key: "outlet", header: "Outlet" },
      { key: "shift", header: "Shift" },
      { key: "sales", header: "Sales" },
      { key: "variance", header: "Variance" },
      { key: "status", header: "Status" },
    ],
    rows: [
      { id: "CR1", cashier: "Amit Kumar", outlet: "Restaurant #1", shift: "Lunch", sales: "₹28,400", variance: "—", status: "Open", outletId: "rest-1" },
      { id: "CR2", cashier: "Neha Singh", outlet: "Restaurant #1", shift: "Breakfast", sales: "₹14,200", variance: "−₹20", status: "Closed", outletId: "rest-1" },
      { id: "CR3", cashier: "Ravi Menon", outlet: "Main Bar", shift: "Evening", sales: "₹22,800", variance: "−₹50", status: "Closed", outletId: "main-bar" },
    ],
  }),

  "/food-beverages/reports/table-turnover": page({
    title: "Table Turnover",
    description: "Table utilisation and turn time analytics.",
    outletScope: "restaurant",
    searchPlaceholder: "Search table or section…",
    filterOptions: [{ id: "all", label: "All" }],
    stats: [
      { label: "Avg Turn", value: "68 min", accent: "#15803d", sublabel: "Per table" },
      { label: "Turns / Table", value: 2.4, sublabel: "Today" },
      { label: "Peak Util", value: "86%", accent: "#10b981", sublabel: "Dinner" },
      { label: "Idle Tables", value: 3, accent: "#f59e0b", sublabel: "Now" },
    ],
    columns: [
      { key: "tableNo", header: "Table" },
      { key: "section", header: "Section" },
      { key: "turns", header: "Turns" },
      { key: "avgDuration", header: "Avg Duration" },
      { key: "revenue", header: "Revenue" },
      { key: "util", header: "Util %" },
    ],
    rows: [
      { id: "TT1", tableNo: "T-04", section: "Indoor", turns: 3, avgDuration: "62 min", revenue: "₹6,840", util: "92%", outletId: "rest-1" },
      { id: "TT2", tableNo: "T-02", section: "Garden", turns: 2, avgDuration: "74 min", revenue: "₹4,120", util: "78%", outletId: "rest-1" },
      { id: "TT3", tableNo: "T-07", section: "Indoor", turns: 1, avgDuration: "95 min", revenue: "₹3,200", util: "55%", outletId: "rest-1" },
    ],
  }),

  "/food-beverages/reports/food-cost": page({
    title: "Food Cost",
    description: "Theoretical vs actual food cost by outlet.",
    outletScope: "none",
    searchPlaceholder: "Search outlet…",
    filterOptions: [{ id: "all", label: "All" }],
    stats: [
      { label: "Food Cost %", value: "31.2%", accent: "#15803d", sublabel: "MTD" },
      { label: "Target", value: "30%", sublabel: "Budget" },
      { label: "Variance", value: "+1.2%", accent: "#ef4444", sublabel: "Over" },
      { label: "Potential Save", value: "₹18.4K", sublabel: "If on target" },
    ],
    columns: [
      { key: "outlet", header: "Outlet" },
      { key: "sales", header: "Sales" },
      { key: "cost", header: "Cost" },
      { key: "pct", header: "Cost %" },
      { key: "target", header: "Target" },
      { key: "status", header: "Status" },
    ],
    rows: [
      { id: "FC1", outlet: "Restaurant #1", sales: "₹4.2L", cost: "₹1.35L", pct: "32.1%", target: "30%", status: "Over" },
      { id: "FC2", outlet: "Restaurant #2", sales: "₹3.1L", cost: "₹0.89L", pct: "28.7%", target: "30%", status: "Under" },
      { id: "FC3", outlet: "Main Bar", sales: "₹2.8L", cost: "₹0.78L", pct: "27.9%", target: "28%", status: "Under" },
    ],
  }),

  "/food-beverages/reports/inventory": page({
    title: "Inventory Report",
    description: "Stock valuation and movement summary.",
    outletScope: "none",
    searchPlaceholder: "Search store or item…",
    filterOptions: [{ id: "all", label: "All" }],
    stats: [
      { label: "On Hand Value", value: "₹6.9L", accent: "#15803d", sublabel: "All stores" },
      { label: "Receipts MTD", value: "₹2.4L", sublabel: "GRN value" },
      { label: "Issues MTD", value: "₹1.9L", sublabel: "Transfers out" },
      { label: "Wastage", value: "₹15.6K", accent: "#ef4444", sublabel: "MTD" },
    ],
    columns: [
      { key: "store", header: "Store" },
      { key: "skus", header: "SKUs" },
      { key: "value", header: "Value" },
      { key: "lowStock", header: "Low Stock" },
      { key: "lastCount", header: "Last Count" },
    ],
    rows: [
      { id: "IR1", store: "Main Store", skus: 120, value: "₹4.8L", lowStock: 6, lastCount: "10 Jul" },
      { id: "IR2", store: "Bar Store", skus: 48, value: "₹2.1L", lowStock: 4, lastCount: "10 Jul" },
    ],
  }),

  "/food-beverages/reports/kitchen-performance": page({
    title: "Kitchen Performance",
    description: "Ticket times, SLA breaches, and station throughput.",
    outletScope: "kitchen",
    searchPlaceholder: "Search kitchen…",
    filterOptions: [{ id: "all", label: "All" }],
    stats: [
      { label: "Avg Ticket", value: "11 min", accent: "#15803d", sublabel: "Prep time" },
      { label: "SLA Hit", value: "91%", accent: "#10b981", sublabel: "< 15 min" },
      { label: "Over SLA", value: 18, accent: "#ef4444", sublabel: "Today" },
      { label: "Tickets", value: 214, sublabel: "Completed" },
    ],
    columns: [
      { key: "kitchen", header: "Kitchen" },
      { key: "tickets", header: "Tickets" },
      { key: "avgTime", header: "Avg Time" },
      { key: "sla", header: "SLA %" },
      { key: "overSla", header: "Over SLA" },
    ],
    rows: [
      { id: "KP1", kitchen: "Indian Kitchen", tickets: 96, avgTime: "10 min", sla: "93%", overSla: 6, outletId: "indian-kitchen" },
      { id: "KP2", kitchen: "Main Kitchen", tickets: 72, avgTime: "12 min", sla: "89%", overSla: 8, outletId: "main-kitchen" },
      { id: "KP3", kitchen: "Italian Kitchen", tickets: 46, avgTime: "11 min", sla: "92%", overSla: 4, outletId: "italian-kitchen" },
    ],
  }),

  "/food-beverages/reports/cancelled-bills": page({
    title: "Cancelled Bills",
    description: "Voids, cancellations, and manager approvals.",
    outletScope: "restaurant",
    searchPlaceholder: "Search bill…",
    filterOptions: [{ id: "all", label: "All" }],
    stats: [
      { label: "Cancelled Today", value: 4, accent: "#ef4444", sublabel: "Bills" },
      { label: "Value", value: "₹6,820", accent: "#ef4444", sublabel: "Voided" },
      { label: "MTD", value: 28, sublabel: "Cancellations" },
      { label: "% of Bills", value: "1.4%", sublabel: "Target < 2%" },
    ],
    columns: [
      { key: "billNo", header: "Bill" },
      { key: "outlet", header: "Outlet" },
      { key: "amount", header: "Amount" },
      { key: "reason", header: "Reason" },
      { key: "approvedBy", header: "Approved By" },
      { key: "time", header: "Time" },
    ],
    rows: [
      { id: "XB1", billNo: "FB-2391", outlet: "Restaurant #1", amount: "₹1,240", reason: "Wrong order", approvedBy: "Manager", time: "1:10 PM", outletId: "rest-1" },
      { id: "XB2", billNo: "FB-2388", outlet: "Main Bar", amount: "₹820", reason: "Guest left", approvedBy: "Manager", time: "12:40 PM", outletId: "main-bar" },
    ],
  }),

  "/food-beverages/reports/discount": page({
    title: "Discount Report",
    description: "Discounts, comps, and promotional reductions.",
    outletScope: "restaurant",
    searchPlaceholder: "Search bill or reason…",
    filterOptions: [{ id: "all", label: "All" }],
    stats: [
      { label: "Discount Value", value: "₹18.4K", accent: "#f59e0b", sublabel: "Today" },
      { label: "Bills", value: 22, sublabel: "With discount" },
      { label: "% of Sales", value: "3.1%", sublabel: "Target < 4%" },
      { label: "Top Reason", value: "Staff meal", sublabel: "Today" },
    ],
    columns: [
      { key: "billNo", header: "Bill" },
      { key: "outlet", header: "Outlet" },
      { key: "gross", header: "Gross" },
      { key: "discount", header: "Discount" },
      { key: "reason", header: "Reason" },
      { key: "by", header: "By" },
    ],
    rows: [
      { id: "DC1", billNo: "FB-2401", outlet: "Restaurant #1", gross: "₹2,400", discount: "₹220", reason: "Happy hour", by: "Amit", outletId: "rest-1" },
      { id: "DC2", billNo: "FB-2405", outlet: "Restaurant #2", gross: "₹1,800", discount: "₹1,800", reason: "Staff meal", by: "Manager", outletId: "rest-2" },
    ],
  }),

};

export function getFbPage(path: string): FbPageDefinition | undefined {
  return fbPageDefinitions[path];
}

export function getOutletsForScope(scope?: OutletScope): FbOutlet[] {
  switch (scope) {
    case "restaurant":
      return restaurantOutlets;
    case "kitchen":
      return kitchenOutlets;
    default:
      return [];
  }
}

export const fbDefaultRedirect = "/food-beverages/dashboard";

