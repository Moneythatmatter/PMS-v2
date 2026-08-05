export type ReportId =
  | "arrival"
  | "departure"
  | "occupancy"
  | "revenue"
  | "cashier"
  | "night-audit"
  | "guest"
  | "room"
  | "tax";

export interface ReportStat {
  label: string;
  value: string | number;
  accent?: string;
  sublabel?: string;
}

export interface ReportColumn {
  key: string;
  header: string;
  format?: "currency" | "percent";
}

export interface ReportRow {
  id: string;
  status?: string;
  [key: string]: string | number | undefined;
}

export interface ReportDefinition {
  id: ReportId;
  title: string;
  description: string;
  stats: ReportStat[];
  columns: ReportColumn[];
  rows: ReportRow[];
  charts: ReportChartConfig[];
  searchPlaceholder: string;
  filterOptions?: { id: string; label: string }[];
  sortOptions: { value: string; label: string }[];
}

export type ReportChartType = "bar" | "line" | "pie" | "stacked-bar" | "area";

export interface ReportChartPoint {
  name: string;
  value?: number;
  amount?: number;
  count?: number;
  color?: string;
  cgst?: number;
  sgst?: number;
  [key: string]: string | number | undefined;
}

export interface ReportStackedSeries {
  key: string;
  label: string;
  color: string;
}

export interface ReportChartConfig {
  title: string;
  subtitle?: string;
  type: ReportChartType;
  data: ReportChartPoint[];
  dataKey?: string;
  nameKey?: string;
  colors?: string[];
  stackedSeries?: ReportStackedSeries[];
  valueFormat?: "currency" | "percent" | "number";
  layout?: "horizontal" | "vertical";
}

const statusBadge: Record<string, string> = {
  Confirmed: "bg-emerald-50 text-emerald-800",
  Reserved: "bg-violet-50 text-violet-700",
  Pending: "bg-amber-50 text-amber-700",
  "Checked In": "bg-emerald-50 text-emerald-700",
  "Checked Out": "bg-slate-100 text-slate-600",
  Settled: "bg-emerald-50 text-emerald-700",
  "Pending Settlement": "bg-amber-50 text-amber-700",
  Open: "bg-amber-50 text-amber-700",
  Balanced: "bg-emerald-50 text-emerald-700",
  Occupied: "bg-emerald-50 text-emerald-800",
  Vacant: "bg-emerald-50 text-emerald-700",
  Dirty: "bg-orange-50 text-orange-700",
  Clean: "bg-emerald-50 text-emerald-700",
  Posted: "bg-emerald-50 text-emerald-700",
};

export function reportStatusClass(status: string) {
  return statusBadge[status] ?? "bg-slate-100 text-slate-600";
}

export const arrivalReport: ReportDefinition = {
  id: "arrival",
  title: "Daily Arrival Report",
  description: "Guests arriving today and expected check-ins.",
  searchPlaceholder: "Search guest, booking, or room…",
  filterOptions: [
    { id: "all", label: "All" },
    { id: "Confirmed", label: "Confirmed" },
    { id: "Reserved", label: "Reserved" },
    { id: "Pending", label: "Pending" },
  ],
  sortOptions: [
    { value: "guest", label: "Guest A–Z" },
    { value: "room", label: "Room" },
    { value: "time", label: "ETA" },
  ],
  stats: [],
  columns: [
    { key: "guestName", header: "Guest" },
    { key: "bookingId", header: "Booking" },
    { key: "roomNo", header: "Room" },
    { key: "roomType", header: "Type" },
    { key: "eta", header: "ETA" },
    { key: "source", header: "Source" },
    { key: "status", header: "Status" },
  ],
  rows: [],
  charts: [],
};

export const departureReport: ReportDefinition = {
  id: "departure",
  title: "Departure Report",
  description: "Guests departing today with settlement status.",
  searchPlaceholder: "Search guest, booking, or room…",
  filterOptions: [
    { id: "all", label: "All" },
    { id: "Settled", label: "Settled" },
    { id: "Pending Settlement", label: "Pending" },
    { id: "Checked Out", label: "Checked Out" },
  ],
  sortOptions: [
    { value: "guest", label: "Guest A–Z" },
    { value: "balance-desc", label: "Balance high–low" },
    { value: "checkout", label: "Check-out time" },
  ],
  stats: [],
  columns: [
    { key: "guestName", header: "Guest" },
    { key: "bookingId", header: "Booking" },
    { key: "roomNo", header: "Room" },
    { key: "checkOutTime", header: "Check-out" },
    { key: "balance", header: "Balance", format: "currency" },
    { key: "paymentMode", header: "Payment" },
    { key: "status", header: "Status" },
  ],
  rows: [],
  charts: [],
};

export const occupancyReport: ReportDefinition = {
  id: "occupancy",
  title: "Occupancy Report",
  description: "Room occupancy and availability by room type.",
  searchPlaceholder: "Search room type or date…",
  filterOptions: [
    { id: "all", label: "All" },
    { id: "High", label: "High (>70%)" },
    { id: "Medium", label: "Medium (40–70%)" },
    { id: "Low", label: "Low (<40%)" },
  ],
  sortOptions: [
    { value: "occupancy-desc", label: "Occupancy high–low" },
    { value: "type", label: "Room type" },
  ],
  stats: [],
  columns: [
    { key: "roomType", header: "Room Type" },
    { key: "totalRooms", header: "Total" },
    { key: "occupied", header: "Occupied" },
    { key: "vacant", header: "Vacant" },
    { key: "occupancy", header: "Occupancy", format: "percent" },
    { key: "adr", header: "ADR", format: "currency" },
    { key: "band", header: "Band" },
  ],
  rows: [],
  charts: [],
};

export const revenueReport: ReportDefinition = {
  id: "revenue",
  title: "Revenue Report",
  description: "Front office revenue breakdown by category.",
  searchPlaceholder: "Search category or department…",
  filterOptions: [
    { id: "all", label: "All" },
    { id: "Rooms", label: "Rooms" },
    { id: "F&B", label: "F&B" },
    { id: "Other", label: "Other" },
  ],
  sortOptions: [
    { value: "amount-desc", label: "Amount high–low" },
    { value: "category", label: "Category A–Z" },
  ],
  stats: [],
  columns: [
    { key: "category", header: "Category" },
    { key: "department", header: "Department" },
    { key: "transactions", header: "Txns" },
    { key: "amount", header: "Amount", format: "currency" },
    { key: "share", header: "Share", format: "percent" },
    { key: "mtdChange", header: "vs Last Month" },
  ],
  rows: [],
  charts: [],
};

export const cashierReport: ReportDefinition = {
  id: "cashier",
  title: "Cashier Report",
  description: "Shift-wise collections and payment mode summary.",
  searchPlaceholder: "Search cashier or shift…",
  filterOptions: [
    { id: "all", label: "All" },
    { id: "Morning", label: "Morning" },
    { id: "Evening", label: "Evening" },
    { id: "Night", label: "Night" },
  ],
  sortOptions: [
    { value: "amount-desc", label: "Collection high–low" },
    { value: "cashier", label: "Cashier A–Z" },
  ],
  stats: [],
  columns: [
    { key: "cashier", header: "Cashier" },
    { key: "shift", header: "Shift" },
    { key: "openingFloat", header: "Opening", format: "currency" },
    { key: "collected", header: "Collected", format: "currency" },
    { key: "refunds", header: "Refunds", format: "currency" },
    { key: "closing", header: "Closing", format: "currency" },
    { key: "status", header: "Status" },
  ],
  rows: [],
  charts: [],
};

export const nightAuditReport: ReportDefinition = {
  id: "night-audit",
  title: "Night Audit Report",
  description: "End-of-day audit summary and room charge postings.",
  searchPlaceholder: "Search room or audit item…",
  filterOptions: [
    { id: "all", label: "All" },
    { id: "Posted", label: "Posted" },
    { id: "Pending", label: "Pending" },
    { id: "Exception", label: "Exception" },
  ],
  sortOptions: [
    { value: "room", label: "Room" },
    { value: "amount-desc", label: "Amount high–low" },
  ],
  stats: [],
  columns: [
    { key: "roomNo", header: "Room" },
    { key: "guestName", header: "Guest" },
    { key: "roomRate", header: "Rate", format: "currency" },
    { key: "extras", header: "Extras", format: "currency" },
    { key: "posted", header: "Posted", format: "currency" },
    { key: "auditTime", header: "Posted At" },
    { key: "status", header: "Status" },
  ],
  rows: [],
  charts: [],
};

export const guestReport: ReportDefinition = {
  id: "guest",
  title: "Guest Report",
  description: "Guest demographics, nationality, and stay statistics.",
  searchPlaceholder: "Search guest, nationality, or segment…",
  filterOptions: [
    { id: "all", label: "All" },
    { id: "Indian", label: "Indian" },
    { id: "International", label: "International" },
    { id: "Corporate", label: "Corporate" },
  ],
  sortOptions: [
    { value: "guest", label: "Guest A–Z" },
    { value: "stays-desc", label: "Stays high–low" },
    { value: "revenue-desc", label: "Revenue high–low" },
  ],
  stats: [],
  columns: [
    { key: "guestName", header: "Guest" },
    { key: "nationality", header: "Nationality" },
    { key: "segment", header: "Segment" },
    { key: "totalStays", header: "Stays" },
    { key: "lastStay", header: "Last Stay" },
    { key: "revenue", header: "Revenue", format: "currency" },
    { key: "status", header: "Status" },
  ],
  rows: [],
  charts: [],
};

export const roomReport: ReportDefinition = {
  id: "room",
  title: "Room Report",
  description: "Room-wise status, housekeeping, and guest assignment.",
  searchPlaceholder: "Search room, type, or guest…",
  filterOptions: [
    { id: "all", label: "All" },
    { id: "Occupied", label: "Occupied" },
    { id: "Vacant", label: "Vacant" },
    { id: "Dirty", label: "Dirty" },
  ],
  sortOptions: [
    { value: "room", label: "Room number" },
    { value: "type", label: "Room type" },
    { value: "floor", label: "Floor" },
  ],
  stats: [],
  columns: [
    { key: "roomNo", header: "Room" },
    { key: "roomType", header: "Type" },
    { key: "floor", header: "Floor" },
    { key: "guestName", header: "Guest" },
    { key: "housekeeping", header: "HK Status" },
    { key: "checkoutDate", header: "Check-out" },
    { key: "status", header: "Status" },
  ],
  rows: [],
  charts: [],
};

export const taxReport: ReportDefinition = {
  id: "tax",
  title: "Tax Report",
  description: "GST and tax collection summary by category.",
  searchPlaceholder: "Search SAC code or category…",
  filterOptions: [
    { id: "all", label: "All" },
    { id: "Rooms", label: "Rooms" },
    { id: "F&B", label: "F&B" },
    { id: "Services", label: "Services" },
  ],
  sortOptions: [
    { value: "tax-desc", label: "Tax high–low" },
    { value: "category", label: "Category A–Z" },
  ],
  stats: [],
  columns: [
    { key: "category", header: "Category" },
    { key: "sac", header: "SAC" },
    { key: "taxable", header: "Taxable", format: "currency" },
    { key: "cgst", header: "CGST", format: "currency" },
    { key: "sgst", header: "SGST", format: "currency" },
    { key: "totalTax", header: "Total Tax", format: "currency" },
    { key: "group", header: "Group" },
  ],
  rows: [],
  charts: [],
};

export const reportDefinitions: Record<ReportId, ReportDefinition> = {
  arrival: arrivalReport,
  departure: departureReport,
  occupancy: occupancyReport,
  revenue: revenueReport,
  cashier: cashierReport,
  "night-audit": nightAuditReport,
  guest: guestReport,
  room: roomReport,
  tax: taxReport,
};
