import type { FbOutlet } from "./modules";
import { restaurantOutlets, kitchenOutlets } from "./modules";

export type LiveTableStatus = "Available" | "Reserved" | "Occupied" | "Billing" | "Dirty";

export interface LiveTable {
  id: string;
  tableNo: string;
  section: string;
  capacity: number;
  covers: number;
  guest: string;
  server: string;
  durationMin: number;
  checkAmount: number;
  status: LiveTableStatus;
  outletId: string;
}

export type FbOrderType = "Dine In" | "Takeaway" | "Room Service" | "Online";
export type FbOrderStatus = "Pending" | "Preparing" | "Ready" | "Served" | "Settled";

export interface FbOrderLine {
  name: string;
  qty: number;
}

export interface FbOrder {
  id: string;
  orderNo: string;
  type: FbOrderType;
  ref: string;
  guest: string;
  lines: FbOrderLine[];
  amount: number;
  status: FbOrderStatus;
  outletId: string;
  placedAt: string;
  server: string;
}

export type KdsStatus = "Pending" | "Preparing" | "Ready" | "Bumped";

export interface KdsTicket {
  id: string;
  ticket: string;
  station: string;
  table: string;
  orderNo: string;
  lines: { name: string; qty: number; note?: string }[];
  elapsedMin: number;
  slaMin: number;
  status: KdsStatus;
  outletId: string;
  priority: "Normal" | "High";
}

export interface FbCashierShift {
  id: string;
  cashier: string;
  shift: string;
  openedAt: string;
  openingFloat: number;
  cashSales: number;
  cardSales: number;
  upiSales: number;
  refunds: number;
  declaredCash: number | null;
  status: "Open" | "Closed" | "Pending";
  outletId: string;
}

export const liveTablesSeed: LiveTable[] = [
  { id: "L1", tableNo: "T-01", section: "Garden", capacity: 2, covers: 0, guest: "—", server: "—", durationMin: 0, checkAmount: 0, status: "Available", outletId: "rest-1" },
  { id: "L2", tableNo: "T-02", section: "Garden", capacity: 4, covers: 3, guest: "Rahul Sharma", server: "Meena", durationMin: 32, checkAmount: 3120, status: "Occupied", outletId: "rest-1" },
  { id: "L3", tableNo: "T-03", section: "Garden", capacity: 4, covers: 0, guest: "—", server: "—", durationMin: 0, checkAmount: 0, status: "Dirty", outletId: "rest-1" },
  { id: "L4", tableNo: "T-04", section: "Indoor", capacity: 4, covers: 4, guest: "Priya Patel", server: "Amit", durationMin: 48, checkAmount: 2180, status: "Occupied", outletId: "rest-1" },
  { id: "L5", tableNo: "T-05", section: "Indoor", capacity: 2, covers: 0, guest: "—", server: "—", durationMin: 0, checkAmount: 0, status: "Available", outletId: "rest-1" },
  { id: "L6", tableNo: "T-06", section: "Indoor", capacity: 6, covers: 0, guest: "—", server: "—", durationMin: 0, checkAmount: 0, status: "Available", outletId: "rest-1" },
  { id: "L7", tableNo: "T-07", section: "Indoor", capacity: 6, covers: 6, guest: "Corporate", server: "—", durationMin: 0, checkAmount: 0, status: "Reserved", outletId: "rest-1" },
  { id: "L8", tableNo: "T-08", section: "Window", capacity: 2, covers: 0, guest: "—", server: "—", durationMin: 0, checkAmount: 0, status: "Available", outletId: "rest-1" },
  { id: "L9", tableNo: "T-09", section: "Window", capacity: 2, covers: 0, guest: "—", server: "—", durationMin: 0, checkAmount: 0, status: "Available", outletId: "rest-1" },
  { id: "L10", tableNo: "T-10", section: "Window", capacity: 4, covers: 0, guest: "—", server: "—", durationMin: 0, checkAmount: 0, status: "Available", outletId: "rest-1" },
  { id: "L11", tableNo: "T-11", section: "Window", capacity: 4, covers: 2, guest: "Walk-in", server: "Neha", durationMin: 15, checkAmount: 680, status: "Occupied", outletId: "rest-1" },
  { id: "L12", tableNo: "T-12", section: "Window", capacity: 2, covers: 2, guest: "James Wilson", server: "Neha", durationMin: 65, checkAmount: 1840, status: "Billing", outletId: "rest-1" },
  { id: "L13", tableNo: "T-01", section: "Main", capacity: 4, covers: 0, guest: "—", server: "—", durationMin: 0, checkAmount: 0, status: "Available", outletId: "rest-2" },
  { id: "L14", tableNo: "T-02", section: "Main", capacity: 4, covers: 2, guest: "Anita Desai", server: "Ravi", durationMin: 22, checkAmount: 940, status: "Occupied", outletId: "rest-2" },
  { id: "L15", tableNo: "T-03", section: "Main", capacity: 8, covers: 5, guest: "Group", server: "Ravi", durationMin: 40, checkAmount: 4560, status: "Occupied", outletId: "rest-2" },
  { id: "L16", tableNo: "T-04", section: "Patio", capacity: 2, covers: 0, guest: "—", server: "—", durationMin: 0, checkAmount: 0, status: "Reserved", outletId: "rest-2" },
];

export const fbOrdersSeed: FbOrder[] = [
  {
    id: "OR1",
    orderNo: "ORD-501",
    type: "Dine In",
    ref: "T-04",
    guest: "Priya Patel",
    lines: [
      { name: "Butter Chicken", qty: 2 },
      { name: "Garlic Naan", qty: 3 },
      { name: "Dal Makhani", qty: 1 },
    ],
    amount: 2180,
    status: "Preparing",
    outletId: "rest-1",
    placedAt: "1:12 PM",
    server: "Amit",
  },
  {
    id: "OR2",
    orderNo: "ORD-502",
    type: "Room Service",
    ref: "Room 501",
    guest: "Priya Patel",
    lines: [
      { name: "Club Sandwich", qty: 1 },
      { name: "Fresh Lime Soda", qty: 2 },
    ],
    amount: 1240,
    status: "Ready",
    outletId: "rest-1",
    placedAt: "1:18 PM",
    server: "Room Service",
  },
  {
    id: "OR3",
    orderNo: "ORD-503",
    type: "Takeaway",
    ref: "Counter",
    guest: "Walk-in",
    lines: [
      { name: "Paneer Tikka", qty: 1 },
      { name: "Roti", qty: 2 },
    ],
    amount: 480,
    status: "Pending",
    outletId: "rest-1",
    placedAt: "1:25 PM",
    server: "Counter",
  },
  {
    id: "OR4",
    orderNo: "ORD-504",
    type: "Online",
    ref: "Zomato",
    guest: "Rahul S.",
    lines: [
      { name: "Chicken Biryani", qty: 2 },
      { name: "Raita", qty: 2 },
    ],
    amount: 920,
    status: "Preparing",
    outletId: "rest-2",
    placedAt: "1:22 PM",
    server: "Online",
  },
  {
    id: "OR5",
    orderNo: "ORD-505",
    type: "Dine In",
    ref: "T-02",
    guest: "Rahul Sharma",
    lines: [
      { name: "Thali", qty: 3 },
      { name: "Sweet Lassi", qty: 3 },
    ],
    amount: 3120,
    status: "Served",
    outletId: "rest-1",
    placedAt: "12:40 PM",
    server: "Meena",
  },
  {
    id: "OR6",
    orderNo: "ORD-506",
    type: "Dine In",
    ref: "T-12",
    guest: "James Wilson",
    lines: [
      { name: "Steak", qty: 1 },
      { name: "Salad", qty: 1 },
    ],
    amount: 1840,
    status: "Served",
    outletId: "rest-1",
    placedAt: "12:05 PM",
    server: "Neha",
  },
  {
    id: "OR7",
    orderNo: "ORD-507",
    type: "Room Service",
    ref: "Room 305",
    guest: "Michael Brown",
    lines: [{ name: "Continental Breakfast", qty: 1 }],
    amount: 650,
    status: "Pending",
    outletId: "rest-1",
    placedAt: "1:30 PM",
    server: "Room Service",
  },
];

export const kdsTicketsSeed: KdsTicket[] = [
  {
    id: "K1",
    ticket: "KDS-88",
    station: "Hot",
    table: "T-04",
    orderNo: "ORD-501",
    lines: [
      { name: "Butter Chicken", qty: 2 },
      { name: "Dal Makhani", qty: 1 },
    ],
    elapsedMin: 8,
    slaMin: 15,
    status: "Preparing",
    outletId: "indian-kitchen",
    priority: "Normal",
  },
  {
    id: "K2",
    ticket: "KDS-89",
    station: "Tandoor",
    table: "T-02",
    orderNo: "ORD-505",
    lines: [{ name: "Paneer Tikka", qty: 1, note: "Extra spice" }],
    elapsedMin: 4,
    slaMin: 12,
    status: "Pending",
    outletId: "indian-kitchen",
    priority: "Normal",
  },
  {
    id: "K3",
    ticket: "KDS-90",
    station: "Pastry",
    table: "T-12",
    orderNo: "ORD-506",
    lines: [{ name: "Gulab Jamun", qty: 2 }],
    elapsedMin: 12,
    slaMin: 10,
    status: "Ready",
    outletId: "main-kitchen",
    priority: "Normal",
  },
  {
    id: "K4",
    ticket: "KDS-91",
    station: "Grill",
    table: "T-03",
    orderNo: "ORD-508",
    lines: [{ name: "Steak Medium", qty: 1, note: "No sauce" }],
    elapsedMin: 16,
    slaMin: 18,
    status: "Preparing",
    outletId: "continental-kitchen",
    priority: "High",
  },
  {
    id: "K5",
    ticket: "KDS-92",
    station: "Hot",
    table: "Room 501",
    orderNo: "ORD-502",
    lines: [{ name: "Club Sandwich", qty: 1 }],
    elapsedMin: 6,
    slaMin: 12,
    status: "Ready",
    outletId: "main-kitchen",
    priority: "High",
  },
  {
    id: "K6",
    ticket: "KDS-93",
    station: "Tandoor",
    table: "Counter",
    orderNo: "ORD-503",
    lines: [{ name: "Paneer Tikka", qty: 1 }],
    elapsedMin: 2,
    slaMin: 12,
    status: "Pending",
    outletId: "indian-kitchen",
    priority: "Normal",
  },
  {
    id: "K7",
    ticket: "KDS-94",
    station: "Hot",
    table: "Online",
    orderNo: "ORD-504",
    lines: [
      { name: "Chicken Biryani", qty: 2 },
      { name: "Raita", qty: 2 },
    ],
    elapsedMin: 9,
    slaMin: 20,
    status: "Preparing",
    outletId: "indian-kitchen",
    priority: "Normal",
  },
];

export const fbCashierShiftsSeed: FbCashierShift[] = [
  {
    id: "C1",
    cashier: "Amit Kumar",
    shift: "Lunch",
    openedAt: "11:00 AM",
    openingFloat: 2000,
    cashSales: 8200,
    cardSales: 12400,
    upiSales: 7800,
    refunds: 200,
    declaredCash: null,
    status: "Open",
    outletId: "rest-1",
  },
  {
    id: "C2",
    cashier: "Neha Singh",
    shift: "Breakfast",
    openedAt: "7:00 AM",
    openingFloat: 1500,
    cashSales: 4200,
    cardSales: 6100,
    upiSales: 3900,
    refunds: 0,
    declaredCash: 14180,
    status: "Closed",
    outletId: "rest-1",
  },
  {
    id: "C3",
    cashier: "Ravi Menon",
    shift: "Dinner",
    openedAt: "—",
    openingFloat: 0,
    cashSales: 0,
    cardSales: 0,
    upiSales: 0,
    refunds: 0,
    declaredCash: null,
    status: "Pending",
    outletId: "rest-2",
  },
];

export function formatDuration(mins: number) {
  if (mins <= 0) return "—";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getRestaurantOutletOptions(): FbOutlet[] {
  return restaurantOutlets;
}

export function getKitchenOutletOptions(): FbOutlet[] {
  return kitchenOutlets;
}

export const tableStatusStyles: Record<
  LiveTableStatus,
  { bg: string; border: string; badge: string; label: string }
> = {
  Available: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    badge: "bg-emerald-100 text-emerald-800",
    label: "Available",
  },
  Reserved: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-800",
    label: "Reserved",
  },
  Occupied: {
    bg: "bg-red-50",
    border: "border-red-200",
    badge: "bg-red-100 text-red-800",
    label: "Occupied",
  },
  Billing: {
    bg: "bg-violet-50",
    border: "border-violet-200",
    badge: "bg-violet-100 text-violet-800",
    label: "Billing",
  },
  Dirty: {
    bg: "bg-slate-100",
    border: "border-slate-300",
    badge: "bg-slate-200 text-slate-700",
    label: "Dirty",
  },
};
