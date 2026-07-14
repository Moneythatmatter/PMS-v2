import type {
  ArrivalGuest,
  BookingSource,
  DepartureGuest,
  DeskActivity,
  FrontOfficeStat,
  RoomInventoryData,
  WeeklyFlowPoint,
} from "../types";

export const frontOfficeStats: FrontOfficeStat[] = [
  { title: "Arrivals Today", value: "3", note: "+2 vs yesterday", trend: "up" },
  { title: "Departures Today", value: "2", note: "1 pending settlement", trend: "neutral" },
  { title: "In-House", value: "4", note: "4 rooms occupied", trend: "neutral" },
  { title: "Occupancy", value: "33%", note: "4 / 12 rooms", trend: "up" },
];

export const todaysArrivals: ArrivalGuest[] = [
  {
    id: "1",
    name: "Rahul Sharma",
    bookingId: "BK-1042",
    roomNo: "204",
    roomType: "Deluxe",
    status: "Confirmed",
  },
  {
    id: "2",
    name: "Priya Patel",
    bookingId: "BK-1041",
    roomNo: "501",
    roomType: "Suite",
    status: "Confirmed",
  },
  {
    id: "3",
    name: "Anita Desai",
    bookingId: "BK-1045",
    roomNo: "118",
    roomType: "Standard",
    status: "Pending",
  },
];

export const todaysDepartures: DepartureGuest[] = [
  {
    id: "1",
    name: "James Wilson",
    bookingId: "BK-1038",
    roomNo: "305",
    roomType: "Deluxe",
    status: "Checked In",
  },
  {
    id: "2",
    name: "Sarah Chen",
    bookingId: "BK-1036",
    roomNo: "412",
    roomType: "Standard",
    status: "Checked Out",
  },
];

export const roomInventory: RoomInventoryData = {
  percentage: 33,
  occupied: 4,
  total: 12,
  statuses: [
    { label: "Occupied", count: 4, color: "#166534" },
    { label: "Reserved", count: 2, color: "#15803d" },
    { label: "Vacant", count: 4, color: "#22c55e" },
    { label: "Dirty", count: 1, color: "#d97706" },
    { label: "Maint.", count: 1, color: "#64748b" },
  ],
};

export const weeklyFlow: WeeklyFlowPoint[] = [
  { day: "Mon", checkIn: 8, checkOut: 5 },
  { day: "Tue", checkIn: 12, checkOut: 7 },
  { day: "Wed", checkIn: 6, checkOut: 9 },
  { day: "Thu", checkIn: 10, checkOut: 4 },
  { day: "Fri", checkIn: 14, checkOut: 6 },
  { day: "Sat", checkIn: 18, checkOut: 8 },
  { day: "Sun", checkIn: 9, checkOut: 11 },
];

export const bookingSources: BookingSource[] = [
  { name: "Walk-in", value: 28, color: "#15803d" },
  { name: "Booking.com", value: 32, color: "#166534" },
  { name: "Corporate", value: 18, color: "#16a34a" },
  { name: "Direct", value: 22, color: "#22c55e" },
];

export const deskActivity: DeskActivity[] = [
  { id: "1", message: "Walk-in check-in — Room 105", timestamp: "5 min ago" },
  { id: "2", message: "Payment received — BK-1041 ($620)", timestamp: "18 min ago" },
  { id: "3", message: "Room 412 marked dirty after checkout", timestamp: "32 min ago" },
  { id: "4", message: "Extend stay approved — Room 501 (+2 nights)", timestamp: "1 hr ago" },
  { id: "5", message: "Group booking inquiry — 8 rooms", timestamp: "2 hr ago" },
];
