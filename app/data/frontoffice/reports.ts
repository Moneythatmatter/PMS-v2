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
  Confirmed: "bg-blue-50 text-blue-700",
  Reserved: "bg-violet-50 text-violet-700",
  Pending: "bg-amber-50 text-amber-700",
  "Checked In": "bg-emerald-50 text-emerald-700",
  "Checked Out": "bg-slate-100 text-slate-600",
  Settled: "bg-emerald-50 text-emerald-700",
  "Pending Settlement": "bg-amber-50 text-amber-700",
  Open: "bg-amber-50 text-amber-700",
  Balanced: "bg-emerald-50 text-emerald-700",
  Occupied: "bg-blue-50 text-blue-700",
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
  stats: [
    { label: "Arrivals Today", value: 5, accent: "#2563eb", sublabel: "Expected check-ins" },
    { label: "Confirmed", value: 3, accent: "#10b981", sublabel: "Ready for check-in" },
    { label: "Rooms Blocked", value: 5, sublabel: "Assigned rooms" },
    { label: "VIP / Suite", value: 1, accent: "#f59e0b", sublabel: "Priority arrivals" },
  ],
  columns: [
    { key: "guestName", header: "Guest" },
    { key: "bookingId", header: "Booking" },
    { key: "roomNo", header: "Room" },
    { key: "roomType", header: "Type" },
    { key: "eta", header: "ETA" },
    { key: "source", header: "Source" },
    { key: "status", header: "Status" },
  ],
  rows: [
    { id: "A1", guestName: "Rahul Sharma", bookingId: "BK-1042", roomNo: "204", roomType: "Deluxe", eta: "2:00 PM", source: "Walk-in", status: "Confirmed", nights: 3, mobile: "+91 98765 43210" },
    { id: "A2", guestName: "Priya Patel", bookingId: "BK-1041", roomNo: "501", roomType: "Suite", eta: "3:30 PM", source: "Direct", status: "Confirmed", nights: 5, mobile: "+91 91234 56789" },
    { id: "A3", guestName: "Anita Desai", bookingId: "BK-1039", roomNo: "308", roomType: "Deluxe", eta: "4:00 PM", source: "Agoda", status: "Reserved", nights: 1, mobile: "+91 76543 21098" },
    { id: "A4", guestName: "Michael Brown", bookingId: "BK-1038", roomNo: "305", roomType: "Deluxe", eta: "5:00 PM", source: "Corporate", status: "Pending", nights: 3, mobile: "+91 99887 76655" },
    { id: "A5", guestName: "Sarah Chen", bookingId: "BK-1036", roomNo: "412", roomType: "Standard", eta: "6:30 PM", source: "Booking.com", status: "Confirmed", nights: 2, mobile: "+91 88776 65544" },
  ],
  charts: [
    {
      title: "Arrivals by Time Slot",
      subtitle: "Expected check-ins today",
      type: "bar",
      dataKey: "count",
      data: [
        { name: "12–3 PM", count: 1, color: "#2563eb" },
        { name: "3–5 PM", count: 2, color: "#3b82f6" },
        { name: "5–7 PM", count: 2, color: "#60a5fa" },
      ],
      valueFormat: "number",
    },
    {
      title: "Booking Source Mix",
      subtitle: "Today's arrivals",
      type: "pie",
      dataKey: "value",
      data: [
        { name: "Direct / Walk-in", value: 2, color: "#2563eb" },
        { name: "OTA", value: 2, color: "#8b5cf6" },
        { name: "Corporate", value: 1, color: "#f59e0b" },
      ],
      valueFormat: "number",
    },
  ],
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
  stats: [
    { label: "Departures Today", value: 4, accent: "#f59e0b", sublabel: "Expected check-outs" },
    { label: "Settled", value: 2, accent: "#10b981", sublabel: "Folio cleared" },
    { label: "Pending", value: 2, accent: "#ef4444", sublabel: "Awaiting payment" },
    { label: "Total Due", value: "₹18,970.00", sublabel: "Outstanding balance" },
  ],
  columns: [
    { key: "guestName", header: "Guest" },
    { key: "bookingId", header: "Booking" },
    { key: "roomNo", header: "Room" },
    { key: "checkOutTime", header: "Check-out" },
    { key: "balance", header: "Balance", format: "currency" },
    { key: "paymentMode", header: "Payment" },
    { key: "status", header: "Status" },
  ],
  rows: [
    { id: "D1", guestName: "James Wilson", bookingId: "BK-1040", roomNo: "112", checkOutTime: "11:00 AM", balance: 10270, paymentMode: "UPI", status: "Pending Settlement", nights: 5 },
    { id: "D2", guestName: "Priya Patel", bookingId: "BK-1041", roomNo: "501", checkOutTime: "12:00 PM", balance: 0, paymentMode: "Card", status: "Settled", nights: 5 },
    { id: "D3", guestName: "Michael Brown", bookingId: "BK-1038", roomNo: "305", checkOutTime: "11:00 AM", balance: 4200, paymentMode: "Cash", status: "Pending Settlement", nights: 3 },
    { id: "D4", guestName: "Sarah Chen", bookingId: "BK-1036", roomNo: "412", checkOutTime: "10:30 AM", balance: 0, paymentMode: "Card", status: "Checked Out", nights: 2 },
  ],
  charts: [
    {
      title: "Settlement Status",
      subtitle: "Departures today",
      type: "pie",
      dataKey: "value",
      data: [
        { name: "Settled", value: 2, color: "#10b981" },
        { name: "Pending", value: 1, color: "#f59e0b" },
        { name: "Checked Out", value: 1, color: "#64748b" },
      ],
      valueFormat: "number",
    },
    {
      title: "Outstanding Balance",
      subtitle: "By guest",
      type: "bar",
      layout: "horizontal",
      dataKey: "amount",
      data: [
        { name: "James Wilson", amount: 10270, color: "#ef4444" },
        { name: "Michael Brown", amount: 4200, color: "#f97316" },
        { name: "Priya Patel", amount: 0, color: "#10b981" },
        { name: "Sarah Chen", amount: 0, color: "#10b981" },
      ],
      valueFormat: "currency",
    },
  ],
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
  stats: [
    { label: "Overall Occupancy", value: "67%", accent: "#2563eb", sublabel: "8 / 12 rooms" },
    { label: "Available Tonight", value: 4, accent: "#10b981", sublabel: "Sellable rooms" },
    { label: "Out of Order", value: 1, sublabel: "Maintenance block" },
    { label: "ADR", value: "₹4,850", sublabel: "Average daily rate" },
  ],
  columns: [
    { key: "roomType", header: "Room Type" },
    { key: "totalRooms", header: "Total" },
    { key: "occupied", header: "Occupied" },
    { key: "vacant", header: "Vacant" },
    { key: "occupancy", header: "Occupancy", format: "percent" },
    { key: "adr", header: "ADR", format: "currency" },
    { key: "band", header: "Band" },
  ],
  rows: [
    { id: "O1", roomType: "Standard", totalRooms: 5, occupied: 3, vacant: 2, occupancy: 60, adr: 3500, band: "Medium", revpar: 2100 },
    { id: "O2", roomType: "Deluxe", totalRooms: 4, occupied: 3, vacant: 1, occupancy: 75, adr: 5200, band: "High", revpar: 3900 },
    { id: "O3", roomType: "Suite", totalRooms: 2, occupied: 2, vacant: 0, occupancy: 100, adr: 8500, band: "High", revpar: 8500 },
    { id: "O4", roomType: "Premium", totalRooms: 1, occupied: 0, vacant: 1, occupancy: 0, adr: 6200, band: "Low", revpar: 0 },
  ],
  charts: [
    {
      title: "Occupancy by Room Type",
      subtitle: "Current snapshot",
      type: "bar",
      dataKey: "value",
      data: [
        { name: "Standard", value: 60, color: "#3b82f6" },
        { name: "Deluxe", value: 75, color: "#2563eb" },
        { name: "Suite", value: 100, color: "#1d4ed8" },
        { name: "Premium", value: 0, color: "#94a3b8" },
      ],
      valueFormat: "percent",
    },
    {
      title: "7-Day Occupancy Trend",
      subtitle: "Hotel-wide %",
      type: "area",
      dataKey: "value",
      data: [
        { name: "Mon", value: 58 },
        { name: "Tue", value: 62 },
        { name: "Wed", value: 55 },
        { name: "Thu", value: 67 },
        { name: "Fri", value: 72 },
        { name: "Sat", value: 83 },
        { name: "Sun", value: 67 },
      ],
      valueFormat: "percent",
    },
  ],
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
  stats: [
    { label: "Total Revenue", value: "₹2,84,500", accent: "#2563eb", sublabel: "Month to date" },
    { label: "Room Revenue", value: "₹1,98,200", accent: "#10b981", sublabel: "69.7% of total" },
    { label: "F&B Revenue", value: "₹52,400", sublabel: "Restaurant & bar" },
    { label: "Other Charges", value: "₹33,900", sublabel: "Laundry, mini bar, etc." },
  ],
  columns: [
    { key: "category", header: "Category" },
    { key: "department", header: "Department" },
    { key: "transactions", header: "Txns" },
    { key: "amount", header: "Amount", format: "currency" },
    { key: "share", header: "Share", format: "percent" },
    { key: "mtdChange", header: "vs Last Month" },
  ],
  rows: [
    { id: "R1", category: "Room Charges", department: "Rooms", transactions: 142, amount: 198200, share: 70, mtdChange: "+8.2%", group: "Rooms" },
    { id: "R2", category: "Restaurant", department: "F&B", transactions: 89, amount: 38400, share: 13, mtdChange: "+12.1%", group: "F&B" },
    { id: "R3", category: "Bar / POS", department: "F&B", transactions: 56, amount: 14000, share: 5, mtdChange: "+4.5%", group: "F&B" },
    { id: "R4", category: "Laundry", department: "Other", transactions: 34, amount: 12800, share: 5, mtdChange: "+2.0%", group: "Other" },
    { id: "R5", category: "Mini Bar", department: "Other", transactions: 28, amount: 11200, share: 4, mtdChange: "-1.2%", group: "Other" },
    { id: "R6", category: "Miscellaneous", department: "Other", transactions: 12, amount: 9900, share: 3, mtdChange: "+0.8%", group: "Other" },
  ],
  charts: [
    {
      title: "Revenue by Department",
      subtitle: "Month to date",
      type: "pie",
      dataKey: "value",
      data: [
        { name: "Rooms", value: 198200, color: "#2563eb" },
        { name: "F&B", value: 52400, color: "#10b981" },
        { name: "Other", value: 33900, color: "#f59e0b" },
      ],
      valueFormat: "currency",
    },
    {
      title: "Category Breakdown",
      subtitle: "MTD revenue",
      type: "bar",
      layout: "horizontal",
      dataKey: "amount",
      data: [
        { name: "Room Charges", amount: 198200, color: "#2563eb" },
        { name: "Restaurant", amount: 38400, color: "#10b981" },
        { name: "Bar / POS", amount: 14000, color: "#34d399" },
        { name: "Laundry", amount: 12800, color: "#f59e0b" },
        { name: "Mini Bar", amount: 11200, color: "#fbbf24" },
        { name: "Miscellaneous", amount: 9900, color: "#94a3b8" },
      ],
      valueFormat: "currency",
    },
  ],
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
  stats: [
    { label: "Total Collected", value: "₹1,42,800", accent: "#2563eb", sublabel: "All shifts today" },
    { label: "Cash", value: "₹38,500", sublabel: "27% of collections" },
    { label: "UPI / Card", value: "₹96,300", sublabel: "Digital payments" },
    { label: "Refunds", value: "₹2,400", accent: "#ef4444", sublabel: "2 refund transactions" },
  ],
  columns: [
    { key: "cashier", header: "Cashier" },
    { key: "shift", header: "Shift" },
    { key: "openingFloat", header: "Opening", format: "currency" },
    { key: "collected", header: "Collected", format: "currency" },
    { key: "refunds", header: "Refunds", format: "currency" },
    { key: "closing", header: "Closing", format: "currency" },
    { key: "status", header: "Status" },
  ],
  rows: [
    { id: "C1", cashier: "Amit Kumar", shift: "Morning", openingFloat: 5000, collected: 48200, refunds: 800, closing: 52400, status: "Balanced", modes: "Cash, UPI" },
    { id: "C2", cashier: "Neha Singh", shift: "Evening", openingFloat: 5000, collected: 62800, refunds: 1200, closing: 66600, status: "Balanced", modes: "Card, UPI" },
    { id: "C3", cashier: "Ravi Menon", shift: "Night", openingFloat: 3000, collected: 31800, refunds: 400, closing: 34400, status: "Open", modes: "Cash, Card" },
  ],
  charts: [
    {
      title: "Collections by Shift",
      subtitle: "Today",
      type: "bar",
      dataKey: "amount",
      data: [
        { name: "Morning", amount: 48200, color: "#f59e0b" },
        { name: "Evening", amount: 62800, color: "#2563eb" },
        { name: "Night", amount: 31800, color: "#6366f1" },
      ],
      valueFormat: "currency",
    },
    {
      title: "Payment Mode Split",
      subtitle: "All shifts",
      type: "pie",
      dataKey: "value",
      data: [
        { name: "UPI / Card", value: 96300, color: "#2563eb" },
        { name: "Cash", value: 38500, color: "#10b981" },
        { name: "Refunds", value: 2400, color: "#ef4444" },
      ],
      valueFormat: "currency",
    },
  ],
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
  stats: [
    { label: "Audit Date", value: "23 Jun 2026", sublabel: "Business date" },
    { label: "Room Charges Posted", value: "₹42,600", accent: "#2563eb", sublabel: "8 in-house rooms" },
    { label: "Exceptions", value: 2, accent: "#f59e0b", sublabel: "Needs review" },
    { label: "Audit Status", value: "Balanced", accent: "#10b981", sublabel: "Ready to close day" },
  ],
  columns: [
    { key: "roomNo", header: "Room" },
    { key: "guestName", header: "Guest" },
    { key: "roomRate", header: "Rate", format: "currency" },
    { key: "extras", header: "Extras", format: "currency" },
    { key: "posted", header: "Posted", format: "currency" },
    { key: "auditTime", header: "Posted At" },
    { key: "status", header: "Status" },
  ],
  rows: [
    { id: "N1", roomNo: "112", guestName: "James Wilson", roomRate: 3200, extras: 850, posted: 4050, auditTime: "11:45 PM", status: "Posted", note: "Restaurant charge included" },
    { id: "N2", roomNo: "204", guestName: "Rahul Sharma", roomRate: 4500, extras: 200, posted: 4700, auditTime: "11:46 PM", status: "Posted" },
    { id: "N3", roomNo: "305", guestName: "Michael Brown", roomRate: 5200, extras: 0, posted: 5200, auditTime: "11:47 PM", status: "Posted" },
    { id: "N4", roomNo: "501", guestName: "Priya Patel", roomRate: 8500, extras: 680, posted: 9180, auditTime: "11:48 PM", status: "Posted" },
    { id: "N5", roomNo: "118", guestName: "—", roomRate: 0, extras: 0, posted: 0, auditTime: "—", status: "Exception", note: "No-show — room vacant" },
    { id: "N6", roomNo: "412", guestName: "Sarah Chen", roomRate: 3500, extras: 120, posted: 0, auditTime: "—", status: "Pending", note: "Late checkout — hold posting" },
  ],
  charts: [
    {
      title: "Room Charges Posted",
      subtitle: "By room",
      type: "bar",
      dataKey: "amount",
      data: [
        { name: "112", amount: 4050, color: "#2563eb" },
        { name: "204", amount: 4700, color: "#3b82f6" },
        { name: "305", amount: 5200, color: "#2563eb" },
        { name: "501", amount: 9180, color: "#1d4ed8" },
      ],
      valueFormat: "currency",
    },
    {
      title: "Audit Status",
      subtitle: "Posting summary",
      type: "pie",
      dataKey: "value",
      data: [
        { name: "Posted", value: 4, color: "#10b981" },
        { name: "Pending", value: 1, color: "#f59e0b" },
        { name: "Exception", value: 1, color: "#ef4444" },
      ],
      valueFormat: "number",
    },
  ],
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
  stats: [
    { label: "Total Guests (MTD)", value: 186, accent: "#2563eb", sublabel: "Unique guests" },
    { label: "Indian", value: "62%", sublabel: "Domestic travellers" },
    { label: "International", value: "38%", sublabel: "Foreign nationals" },
    { label: "Repeat Guests", value: 44, accent: "#10b981", sublabel: "23.7% return rate" },
  ],
  columns: [
    { key: "guestName", header: "Guest" },
    { key: "nationality", header: "Nationality" },
    { key: "segment", header: "Segment" },
    { key: "totalStays", header: "Stays" },
    { key: "lastStay", header: "Last Stay" },
    { key: "revenue", header: "Revenue", format: "currency" },
    { key: "status", header: "Status" },
  ],
  rows: [
    { id: "G1", guestName: "Rahul Sharma", nationality: "Indian", segment: "Individual", totalStays: 12, lastStay: "23 Jun 2026", revenue: 98500, status: "In-House", group: "Indian" },
    { id: "G2", guestName: "James Wilson", nationality: "British", segment: "Individual", totalStays: 3, lastStay: "22 Jun 2026", revenue: 48200, status: "In-House", group: "International" },
    { id: "G3", guestName: "Priya Patel", nationality: "Indian", segment: "Corporate", totalStays: 8, lastStay: "22 Jun 2026", revenue: 156000, status: "In-House", group: "Corporate" },
    { id: "G4", guestName: "Michael Brown", nationality: "American", segment: "Corporate", totalStays: 5, lastStay: "21 Jun 2026", revenue: 112400, status: "In-House", group: "Corporate" },
    { id: "G5", guestName: "Anita Desai", nationality: "Indian", segment: "Individual", totalStays: 1, lastStay: "—", revenue: 5500, status: "Arriving", group: "Indian" },
    { id: "G6", guestName: "Sarah Chen", nationality: "Chinese", segment: "Individual", totalStays: 2, lastStay: "20 Jun 2026", revenue: 22400, status: "Departing", group: "International" },
  ],
  charts: [
    {
      title: "Guest Nationality",
      subtitle: "In-house & recent",
      type: "pie",
      dataKey: "value",
      data: [
        { name: "Indian", value: 3, color: "#2563eb" },
        { name: "British", value: 1, color: "#8b5cf6" },
        { name: "American", value: 1, color: "#f59e0b" },
        { name: "Chinese", value: 1, color: "#ef4444" },
      ],
      valueFormat: "number",
    },
    {
      title: "Revenue by Segment",
      subtitle: "Guest lifetime value",
      type: "bar",
      dataKey: "amount",
      data: [
        { name: "Corporate", amount: 268400, color: "#2563eb" },
        { name: "Individual", amount: 177600, color: "#10b981" },
      ],
      valueFormat: "currency",
    },
  ],
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
  stats: [
    { label: "Total Rooms", value: 12, sublabel: "Inventory count" },
    { label: "Occupied", value: 8, accent: "#2563eb", sublabel: "67% occupancy" },
    { label: "Vacant Clean", value: 3, accent: "#10b981", sublabel: "Ready to sell" },
    { label: "Dirty / Maint.", value: 1, accent: "#f59e0b", sublabel: "Not sellable" },
  ],
  columns: [
    { key: "roomNo", header: "Room" },
    { key: "roomType", header: "Type" },
    { key: "floor", header: "Floor" },
    { key: "guestName", header: "Guest" },
    { key: "housekeeping", header: "HK Status" },
    { key: "checkoutDate", header: "Check-out" },
    { key: "status", header: "Status" },
  ],
  rows: [
    { id: "RM1", roomNo: "112", roomType: "Standard", floor: "1st", guestName: "James Wilson", housekeeping: "Clean", checkoutDate: "27 Jun", status: "Occupied" },
    { id: "RM2", roomNo: "204", roomType: "Deluxe", floor: "2nd", guestName: "Rahul Sharma", housekeeping: "Inspected", checkoutDate: "26 Jun", status: "Occupied" },
    { id: "RM3", roomNo: "305", roomType: "Deluxe", floor: "3rd", guestName: "Michael Brown", housekeeping: "Clean", checkoutDate: "24 Jun", status: "Occupied" },
    { id: "RM4", roomNo: "501", roomType: "Suite", floor: "5th", guestName: "Priya Patel", housekeeping: "Clean", checkoutDate: "27 Jun", status: "Occupied" },
    { id: "RM5", roomNo: "101", roomType: "Standard", floor: "1st", guestName: "—", housekeeping: "Clean", checkoutDate: "—", status: "Vacant" },
    { id: "RM6", roomNo: "118", roomType: "Standard", floor: "1st", guestName: "—", housekeeping: "Dirty", checkoutDate: "—", status: "Dirty" },
    { id: "RM7", roomNo: "210", roomType: "Deluxe", floor: "2nd", guestName: "—", housekeeping: "Clean", checkoutDate: "—", status: "Vacant" },
    { id: "RM8", roomNo: "104", roomType: "Standard", floor: "1st", guestName: "—", housekeeping: "Maint.", checkoutDate: "—", status: "Vacant" },
  ],
  charts: [
    {
      title: "Room Status",
      subtitle: "Current inventory",
      type: "pie",
      dataKey: "value",
      data: [
        { name: "Occupied", value: 4, color: "#2563eb" },
        { name: "Vacant", value: 3, color: "#10b981" },
        { name: "Dirty", value: 1, color: "#f59e0b" },
      ],
      valueFormat: "number",
    },
    {
      title: "Occupied Rooms by Floor",
      subtitle: "Active assignments",
      type: "bar",
      dataKey: "count",
      data: [
        { name: "1st Floor", count: 1, color: "#3b82f6" },
        { name: "2nd Floor", count: 1, color: "#2563eb" },
        { name: "3rd Floor", count: 1, color: "#1d4ed8" },
        { name: "5th Floor", count: 1, color: "#6366f1" },
      ],
      valueFormat: "number",
    },
  ],
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
  stats: [
    { label: "Total GST Collected", value: "₹28,450", accent: "#2563eb", sublabel: "Month to date" },
    { label: "CGST", value: "₹14,225", sublabel: "9% component" },
    { label: "SGST", value: "₹14,225", sublabel: "9% component" },
    { label: "Taxable Turnover", value: "₹2,56,050", sublabel: "Before tax" },
  ],
  columns: [
    { key: "category", header: "Category" },
    { key: "sac", header: "SAC" },
    { key: "taxable", header: "Taxable", format: "currency" },
    { key: "cgst", header: "CGST", format: "currency" },
    { key: "sgst", header: "SGST", format: "currency" },
    { key: "totalTax", header: "Total Tax", format: "currency" },
    { key: "group", header: "Group" },
  ],
  rows: [
    { id: "T1", category: "Room Accommodation", sac: "996311", taxable: 198200, cgst: 17838, sgst: 17838, totalTax: 35676, group: "Rooms" },
    { id: "T2", category: "Restaurant / F&B", sac: "996331", taxable: 52400, cgst: 4716, sgst: 4716, totalTax: 9432, group: "F&B" },
    { id: "T3", category: "Laundry Services", sac: "999799", taxable: 12800, cgst: 1152, sgst: 1152, totalTax: 2304, group: "Services" },
    { id: "T4", category: "Mini Bar", sac: "996331", taxable: 11200, cgst: 1008, sgst: 1008, totalTax: 2016, group: "F&B" },
    { id: "T5", category: "Miscellaneous", sac: "999799", taxable: 9900, cgst: 891, sgst: 891, totalTax: 1782, group: "Services" },
  ],
  charts: [
    {
      title: "GST by Category",
      subtitle: "CGST + SGST split",
      type: "stacked-bar",
      dataKey: "totalTax",
      stackedSeries: [
        { key: "cgst", label: "CGST", color: "#2563eb" },
        { key: "sgst", label: "SGST", color: "#60a5fa" },
      ],
      data: [
        { name: "Rooms", cgst: 17838, sgst: 17838 },
        { name: "F&B", cgst: 5724, sgst: 5724 },
        { name: "Laundry", cgst: 1152, sgst: 1152 },
        { name: "Mini Bar", cgst: 1008, sgst: 1008 },
        { name: "Misc.", cgst: 891, sgst: 891 },
      ],
      valueFormat: "currency",
    },
    {
      title: "Tax by Group",
      subtitle: "Total GST collected",
      type: "pie",
      dataKey: "value",
      data: [
        { name: "Rooms", value: 35676, color: "#2563eb" },
        { name: "F&B", value: 11448, color: "#10b981" },
        { name: "Services", value: 4086, color: "#f59e0b" },
      ],
      valueFormat: "currency",
    },
  ],
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
