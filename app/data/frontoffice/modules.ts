import type { ReservationStatus } from "../types";

export interface InHouseGuest {
  id: string;
  guestName: string;
  room: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  balance: number;
  restaurantBill: number;
  laundry: number;
  status: ReservationStatus;
  isVip?: boolean;
  email?: string;
  adults: number;
  children: number;
}

export interface RoomAvailabilityRow {
  room: string;
  type: string;
  floor: string;
  days: Record<string, "booked" | "available" | "blocked">;
}

export interface RoomStatusCard {
  roomNo: string;
  type: string;
  floor: string;
  status: string;
  guestName?: string;
  housekeeping: string;
  maintenance: string;
  checkoutDate?: string;
}

export interface GuestProfile {
  id: string;
  name: string;
  mobile: string;
  email: string;
  nationality: string;
  totalStays: number;
  loyaltyPoints: number;
  idType?: string;
  idNumber?: string;
  address?: string;
  memberSince?: string;
  preferences?: string[];
}

export interface GuestStayHistory {
  id: string;
  guestId: string;
  checkIn: string;
  checkOut: string;
  room: string;
  roomType: string;
  amount: number;
}

export interface FolioEntry {
  id: string;
  guestName: string;
  room: string;
  date: string;
  description: string;
  category: "Room" | "Restaurant" | "Laundry" | "Payment" | "Tax" | "Other";
  debit: number;
  credit: number;
  balance: number;
}

export interface PaymentRecord {
  id: string;
  guestName: string;
  room?: string;
  amount: number;
  mode: string;
  type: "Payment" | "Refund" | "Advance";
  transactionNo: string;
  date: string;
  status: "Completed" | "Pending" | "Refunded";
}

export interface PosMenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
}

export interface RoomTransferRecord {
  id: string;
  guestName: string;
  fromRoom: string;
  toRoom: string;
  date: string;
  reason: string;
  status: "Completed" | "Pending";
}

export interface LostFoundItem {
  id: string;
  item: string;
  guest: string;
  foundBy: string;
  room: string;
  foundDate: string;
  description?: string;
  status: "Stored" | "Returned" | "Claimed";
  returnedDate?: string;
}

export interface VisitorEntry {
  id: string;
  visitorName: string;
  guestName: string;
  room: string;
  timeIn: string;
  timeOut: string;
  purpose: string;
  idProof?: string;
  status: "Inside" | "Checked Out";
}

export interface WakeUpCall {
  id: string;
  guest: string;
  room: string;
  date: string;
  time: string;
  notes?: string;
  completed: boolean;
}

export interface TaxiBooking {
  id: string;
  guest: string;
  room: string;
  pickup: string;
  drop: string;
  date: string;
  time: string;
  driver: string;
  vehicle: string;
  fare: number;
  status: "Scheduled" | "In Transit" | "Completed" | "Cancelled";
}

export interface LuggageRecord {
  id: string;
  guest: string;
  room: string;
  bagCount: number;
  tokenNo: string;
  stored: string;
  location: string;
  returned?: string;
  status: "Stored" | "Returned";
}

export interface MessageRecord {
  id: string;
  type: "Internal" | "Guest" | "System";
  subject: string;
  body: string;
  guest: string;
  room?: string;
  date: string;
  read: boolean;
  priority: "Normal" | "High";
}

export interface HousekeepingRequest {
  id: string;
  guest: string;
  room: string;
  issue: string;
  priority: "Low" | "Medium" | "High";
  status: "Open" | "In Progress" | "Completed";
  assignedStaff: string;
  createdAt: string;
}

export interface MaintenanceRequest {
  id: string;
  room: string;
  problem: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  engineer: string;
  status: "Open" | "In Progress" | "Completed";
  reportedBy?: string;
  createdAt: string;
}

export interface GuestFeedbackRecord {
  id: string;
  guest: string;
  room: string;
  date: string;
  rating: number;
  cleanliness: number;
  food: number;
  service: number;
  comments: string;
}

export interface InvoiceRecord {
  id: string;
  invoiceNo: string;
  guest: string;
  room: string;
  roomType: string;
  bookingId: string;
  phone: string;
  email?: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  roomCharges: number;
  restaurantCharges: number;
  laundry: number;
  miniBar: number;
  extraBed: number;
  otherCharges: number;
  discount: number;
  subtotal: number;
  gst: number;
  payment: number;
  date: string;
  status: "Paid" | "Partial" | "Pending";
  paymentMode: string;
}

export const inHouseGuests: InHouseGuest[] = [
  {
    id: "1",
    guestName: "James Wilson",
    room: "112",
    roomType: "Standard",
    checkIn: "22 Jun 2026",
    checkOut: "27 Jun 2026",
    nights: 5,
    balance: 3200,
    restaurantBill: 850,
    laundry: 200,
    status: "Checked In",
    email: "james.w@email.com",
    adults: 2,
    children: 0,
  },
  {
    id: "2",
    guestName: "Priya Patel",
    room: "501",
    roomType: "Suite",
    checkIn: "22 Jun 2026",
    checkOut: "27 Jun 2026",
    nights: 5,
    balance: 12400,
    restaurantBill: 1200,
    laundry: 450,
    status: "Checked In",
    isVip: true,
    email: "priya@email.com",
    adults: 2,
    children: 1,
  },
  {
    id: "3",
    guestName: "Rahul Sharma",
    room: "204",
    roomType: "Deluxe",
    checkIn: "23 Jun 2026",
    checkOut: "26 Jun 2026",
    nights: 3,
    balance: 8500,
    restaurantBill: 620,
    laundry: 180,
    status: "Checked In",
    email: "rahul@email.com",
    adults: 1,
    children: 0,
  },
  {
    id: "4",
    guestName: "Michael Brown",
    room: "305",
    roomType: "Deluxe",
    checkIn: "21 Jun 2026",
    checkOut: "24 Jun 2026",
    nights: 3,
    balance: 5600,
    restaurantBill: 940,
    laundry: 320,
    status: "Checked In",
    isVip: true,
    email: "m.brown@corp.com",
    adults: 1,
    children: 0,
  },
];

export const roomAvailability: RoomAvailabilityRow[] = [
  { room: "101", type: "Standard", floor: "1st Floor", days: { "24": "booked", "25": "booked", "26": "available", "27": "available", "28": "available", "29": "booked", "30": "booked" } },
  { room: "102", type: "Standard", floor: "1st Floor", days: { "24": "available", "25": "booked", "26": "booked", "27": "available", "28": "available", "29": "available", "30": "blocked" } },
  { room: "103", type: "Deluxe", floor: "1st Floor", days: { "24": "available", "25": "available", "26": "available", "27": "available", "28": "booked", "29": "booked", "30": "available" } },
  { room: "104", type: "Deluxe", floor: "1st Floor", days: { "24": "booked", "25": "available", "26": "available", "27": "blocked", "28": "available", "29": "available", "30": "available" } },
  { room: "204", type: "Deluxe", floor: "2nd Floor", days: { "24": "booked", "25": "booked", "26": "booked", "27": "available", "28": "available", "29": "available", "30": "available" } },
  { room: "305", type: "Deluxe", floor: "3rd Floor", days: { "24": "booked", "25": "booked", "26": "available", "27": "available", "28": "booked", "29": "booked", "30": "available" } },
  { room: "501", type: "Suite", floor: "5th Floor", days: { "24": "booked", "25": "booked", "26": "booked", "27": "booked", "28": "booked", "29": "available", "30": "available" } },
  { room: "602", type: "Suite", floor: "6th Floor", days: { "24": "available", "25": "available", "26": "booked", "27": "booked", "28": "available", "29": "available", "30": "available" } },
];

export const roomStatusCards: RoomStatusCard[] = [
  { roomNo: "101", type: "Standard", floor: "1st Floor", status: "Occupied", guestName: "James Wilson", housekeeping: "Clean", maintenance: "OK", checkoutDate: "27 Jun" },
  { roomNo: "102", type: "Standard", floor: "1st Floor", status: "Vacant", housekeeping: "Clean", maintenance: "OK" },
  { roomNo: "103", type: "Deluxe", floor: "1st Floor", status: "Dirty", housekeeping: "Dirty", maintenance: "OK" },
  { roomNo: "104", type: "Deluxe", floor: "1st Floor", status: "Maintenance", housekeeping: "Clean", maintenance: "In Progress" },
  { roomNo: "105", type: "Standard", floor: "1st Floor", status: "Blocked", housekeeping: "Clean", maintenance: "OK" },
  { roomNo: "204", type: "Deluxe", floor: "2nd Floor", status: "Occupied", guestName: "Rahul Sharma", housekeeping: "Inspected", maintenance: "OK", checkoutDate: "26 Jun" },
  { roomNo: "305", type: "Deluxe", floor: "3rd Floor", status: "Occupied", guestName: "Michael Brown", housekeeping: "Clean", maintenance: "OK", checkoutDate: "24 Jun" },
  { roomNo: "412", type: "Standard", floor: "4th Floor", status: "Vacant", housekeeping: "Clean", maintenance: "OK" },
  { roomNo: "501", type: "Suite", floor: "5th Floor", status: "Occupied", guestName: "Priya Patel", housekeeping: "Clean", maintenance: "OK", checkoutDate: "27 Jun" },
  { roomNo: "602", type: "Suite", floor: "6th Floor", status: "Vacant", housekeeping: "Inspected", maintenance: "OK" },
];

export const guestProfiles: GuestProfile[] = [
  { id: "G-001", name: "Rahul Sharma", mobile: "+91 98765 43210", email: "rahul@email.com", nationality: "Indian", totalStays: 12, loyaltyPoints: 2400, idType: "Aadhaar", idNumber: "XXXX-XXXX-4521", address: "Mumbai, Maharashtra", memberSince: "Jan 2022", preferences: ["Non-smoking", "High floor", "Late checkout"] },
  { id: "G-002", name: "Priya Patel", mobile: "+91 91234 56789", email: "priya@email.com", nationality: "Indian", totalStays: 5, loyaltyPoints: 850, idType: "Passport", idNumber: "P1234567", address: "Ahmedabad, Gujarat", memberSince: "Mar 2024", preferences: ["VIP amenities", "Extra pillows"] },
  { id: "G-003", name: "James Wilson", mobile: "+44 7700 900123", email: "james.w@email.com", nationality: "British", totalStays: 8, loyaltyPoints: 1600, idType: "Passport", idNumber: "GB9876543", address: "London, UK", memberSince: "Aug 2023", preferences: ["English breakfast", "Quiet room"] },
  { id: "G-004", name: "Michael Brown", mobile: "+1 555 0123", email: "m.brown@corp.com", nationality: "American", totalStays: 15, loyaltyPoints: 4200, idType: "Passport", idNumber: "US4455667", address: "New York, USA", memberSince: "Jun 2021", preferences: ["Corporate billing", "Airport transfer"] },
];

export const guestStayHistory: GuestStayHistory[] = [
  { id: "SH-01", guestId: "G-001", checkIn: "23 Jun 2026", checkOut: "26 Jun 2026", room: "204", roomType: "Deluxe", amount: 8500 },
  { id: "SH-02", guestId: "G-001", checkIn: "10 May 2026", checkOut: "13 May 2026", room: "305", roomType: "Deluxe", amount: 7200 },
  { id: "SH-03", guestId: "G-002", checkIn: "22 Jun 2026", checkOut: "27 Jun 2026", room: "501", roomType: "Suite", amount: 24500 },
  { id: "SH-04", guestId: "G-003", checkIn: "22 Jun 2026", checkOut: "27 Jun 2026", room: "112", roomType: "Standard", amount: 6200 },
  { id: "SH-05", guestId: "G-004", checkIn: "21 Jun 2026", checkOut: "24 Jun 2026", room: "305", roomType: "Deluxe", amount: 9800 },
];

export const folioEntries: FolioEntry[] = [
  { id: "1", guestName: "Rahul Sharma", room: "204", date: "23 Jun", description: "Room Rent — Deluxe", category: "Room", debit: 3500, credit: 0, balance: 3500 },
  { id: "2", guestName: "Rahul Sharma", room: "204", date: "23 Jun", description: "Restaurant — Dinner", category: "Restaurant", debit: 850, credit: 0, balance: 4350 },
  { id: "3", guestName: "Rahul Sharma", room: "204", date: "23 Jun", description: "Laundry Service", category: "Laundry", debit: 200, credit: 0, balance: 4550 },
  { id: "4", guestName: "Rahul Sharma", room: "204", date: "23 Jun", description: "Advance Payment", category: "Payment", debit: 0, credit: 2000, balance: 2550 },
  { id: "5", guestName: "Rahul Sharma", room: "204", date: "23 Jun", description: "GST @ 18%", category: "Tax", debit: 459, credit: 0, balance: 3009 },
  { id: "6", guestName: "James Wilson", room: "112", date: "22 Jun", description: "Room Rent — Standard", category: "Room", debit: 2800, credit: 0, balance: 2800 },
  { id: "7", guestName: "James Wilson", room: "112", date: "23 Jun", description: "Restaurant — Breakfast", category: "Restaurant", debit: 450, credit: 0, balance: 3250 },
  { id: "8", guestName: "Priya Patel", room: "501", date: "22 Jun", description: "Room Rent — Suite", category: "Room", debit: 8500, credit: 0, balance: 8500 },
  { id: "9", guestName: "Priya Patel", room: "501", date: "23 Jun", description: "Spa & Wellness", category: "Other", debit: 3200, credit: 0, balance: 11700 },
  { id: "10", guestName: "Michael Brown", room: "305", date: "21 Jun", description: "Room Rent — Deluxe", category: "Room", debit: 4200, credit: 0, balance: 4200 },
];

export const paymentRecords: PaymentRecord[] = [
  { id: "P-001", guestName: "Rahul Sharma", room: "204", amount: 2000, mode: "UPI", type: "Advance", transactionNo: "TXN882910", date: "23 Jun 2026", status: "Completed" },
  { id: "P-002", guestName: "James Wilson", room: "112", amount: 3200, mode: "Card", type: "Payment", transactionNo: "TXN882911", date: "22 Jun 2026", status: "Completed" },
  { id: "P-003", guestName: "Priya Patel", room: "501", amount: 10000, mode: "Bank Transfer", type: "Advance", transactionNo: "TXN882912", date: "22 Jun 2026", status: "Completed" },
  { id: "P-004", guestName: "Michael Brown", room: "305", amount: 500, mode: "Cash", type: "Refund", transactionNo: "TXN882913", date: "21 Jun 2026", status: "Refunded" },
  { id: "P-005", guestName: "James Wilson", room: "112", amount: 1500, mode: "UPI", type: "Payment", transactionNo: "TXN882914", date: "23 Jun 2026", status: "Pending" },
];

export const posMenuItems: PosMenuItem[] = [
  { id: "M-01", name: "Continental Breakfast", category: "Breakfast", price: 450 },
  { id: "M-02", name: "Paneer Tikka", category: "Main Course", price: 380 },
  { id: "M-03", name: "Chicken Biryani", category: "Main Course", price: 520 },
  { id: "M-04", name: "Fresh Lime Soda", category: "Beverages", price: 120 },
  { id: "M-05", name: "Club Sandwich", category: "Snacks", price: 320 },
  { id: "M-06", name: "Chocolate Brownie", category: "Dessert", price: 280 },
];

export const roomTransferRecords: RoomTransferRecord[] = [
  { id: "RT-01", guestName: "Sarah Chen", fromRoom: "305", toRoom: "412", date: "20 Jun 2026", reason: "AC maintenance in original room", status: "Completed" },
];

export const lostFoundItems: LostFoundItem[] = [
  { id: "LF-01", item: "Mobile Charger", guest: "Sarah Chen", foundBy: "Housekeeping", room: "305", foundDate: "22 Jun 2026", description: "White Samsung charger", status: "Stored" },
  { id: "LF-02", item: "Wallet", guest: "Unknown", foundBy: "Front Desk", room: "Lobby", foundDate: "21 Jun 2026", description: "Brown leather wallet", status: "Returned", returnedDate: "22 Jun 2026" },
  { id: "LF-03", item: "Sunglasses", guest: "James Wilson", foundBy: "Restaurant", room: "112", foundDate: "23 Jun 2026", description: "Ray-Ban aviators", status: "Stored" },
  { id: "LF-04", item: "Laptop Bag", guest: "Priya Patel", foundBy: "Concierge", room: "501", foundDate: "23 Jun 2026", status: "Claimed", returnedDate: "23 Jun 2026" },
];

export const wakeUpCalls: WakeUpCall[] = [
  { id: "W-01", guest: "James Wilson", room: "112", date: "24 Jun 2026", time: "06:00 AM", notes: "Call front desk if no answer", completed: false },
  { id: "W-02", guest: "Michael Brown", room: "305", date: "24 Jun 2026", time: "05:30 AM", notes: "Early flight", completed: false },
  { id: "W-03", guest: "Rahul Sharma", room: "204", date: "23 Jun 2026", time: "07:00 AM", completed: true },
  { id: "W-04", guest: "Priya Patel", room: "501", date: "23 Jun 2026", time: "06:15 AM", notes: "Room service tea first", completed: false },
  { id: "W-05", guest: "James Wilson", room: "112", date: "23 Jun 2026", time: "05:45 AM", notes: "Second attempt if no answer by 5:50", completed: false },
];

export const taxiBookings: TaxiBooking[] = [
  { id: "T-01", guest: "Anita Desai", room: "118", pickup: "Hotel Lobby", drop: "Airport T1", date: "24 Jun 2026", time: "08:00 AM", driver: "Raj Kumar", vehicle: "KA-01-AB-1234", fare: 850, status: "Scheduled" },
  { id: "T-02", guest: "Priya Patel", room: "501", pickup: "Hotel", drop: "MG Road Mall", date: "23 Jun 2026", time: "04:00 PM", driver: "Sunil Rao", vehicle: "KA-02-CD-5678", fare: 420, status: "Completed" },
  { id: "T-03", guest: "James Wilson", room: "112", pickup: "Hotel", drop: "Railway Station", date: "27 Jun 2026", time: "10:30 AM", driver: "Unassigned", vehicle: "—", fare: 350, status: "Scheduled" },
];

export const messageRecords: MessageRecord[] = [
  { id: "M-01", type: "Internal", subject: "VIP arrival Room 501", body: "Priya Patel arriving at 2 PM. Arrange welcome amenity.", guest: "Priya Patel", room: "501", date: "23 Jun", read: true, priority: "High" },
  { id: "M-02", type: "Guest", subject: "Extra towels requested", body: "Guest requested 4 extra bath towels for Room 112.", guest: "James Wilson", room: "112", date: "23 Jun", read: false, priority: "Normal" },
  { id: "M-03", type: "System", subject: "Night audit reminder", body: "Night audit pending for business date 23 Jun 2026.", guest: "—", date: "23 Jun", read: false, priority: "High" },
  { id: "M-04", type: "Guest", subject: "Late checkout request", body: "Guest Michael Brown requested late checkout until 2 PM.", guest: "Michael Brown", room: "305", date: "24 Jun", read: true, priority: "Normal" },
];

export const housekeepingRequests: HousekeepingRequest[] = [
  { id: "HK-01", guest: "James Wilson", room: "112", issue: "Extra towels", priority: "Medium", status: "In Progress", assignedStaff: "Meena", createdAt: "23 Jun 09:00 AM" },
  { id: "HK-02", guest: "Priya Patel", room: "501", issue: "Room cleaning — DND removed", priority: "High", status: "Open", assignedStaff: "—", createdAt: "23 Jun 11:30 AM" },
  { id: "HK-03", guest: "Rahul Sharma", room: "204", issue: "Minibar restock", priority: "Low", status: "Completed", assignedStaff: "Ravi", createdAt: "22 Jun 03:00 PM" },
  { id: "HK-04", guest: "Michael Brown", room: "305", issue: "Bed linen change", priority: "Medium", status: "Open", assignedStaff: "—", createdAt: "24 Jun 08:00 AM" },
];

export const maintenanceRequests: MaintenanceRequest[] = [
  { id: "MT-01", room: "104", problem: "AC not cooling", priority: "High", engineer: "Suresh", status: "In Progress", reportedBy: "Housekeeping", createdAt: "23 Jun 07:00 AM" },
  { id: "MT-02", room: "305", problem: "TV remote not working", priority: "Low", engineer: "Anil", status: "Open", reportedBy: "Guest", createdAt: "23 Jun 10:00 AM" },
  { id: "MT-03", room: "112", problem: "Bathroom tap leaking", priority: "Medium", engineer: "Suresh", status: "Completed", reportedBy: "Guest", createdAt: "22 Jun 02:00 PM" },
  { id: "MT-04", room: "501", problem: "Safe lock jammed", priority: "Critical", engineer: "Anil", status: "In Progress", reportedBy: "Front Desk", createdAt: "24 Jun 09:00 AM" },
];

export const guestFeedbacks: GuestFeedbackRecord[] = [
  { id: "FB-01", guest: "Rahul Sharma", room: "204", date: "23 Jun 2026", rating: 9, cleanliness: 9, food: 8, service: 9, comments: "Excellent stay, very helpful staff." },
  { id: "FB-02", guest: "James Wilson", room: "112", date: "22 Jun 2026", rating: 7, cleanliness: 8, food: 7, service: 7, comments: "Good value. Wi-Fi could be faster." },
  { id: "FB-03", guest: "Priya Patel", room: "501", date: "21 Jun 2026", rating: 10, cleanliness: 10, food: 9, service: 10, comments: "Outstanding suite and butler service!" },
];

export const invoiceRecords: InvoiceRecord[] = [
  {
    id: "INV-01", invoiceNo: "INV-2026-1042", guest: "Sarah Chen", room: "305", roomType: "Deluxe",
    bookingId: "BK-1045", phone: "+91 98123 45678", email: "sarah.chen@email.com",
    checkIn: "20 Jun 2026", checkOut: "23 Jun 2026", nights: 3, adults: 2, children: 0,
    roomCharges: 4500, restaurantCharges: 620, laundry: 180, miniBar: 100, extraBed: 0, otherCharges: 0,
    discount: 0, subtotal: 5400, gst: 540, payment: 5940, date: "23 Jun 2026", status: "Paid", paymentMode: "UPI",
  },
  {
    id: "INV-02", invoiceNo: "INV-2026-1038", guest: "James Wilson", room: "112", roomType: "Standard",
    bookingId: "BK-1040", phone: "+91 87654 32109", email: "james.w@email.com",
    checkIn: "22 Jun 2026", checkOut: "27 Jun 2026", nights: 5, adults: 2, children: 0,
    roomCharges: 4800, restaurantCharges: 850, laundry: 200, miniBar: 350, extraBed: 0, otherCharges: 0,
    discount: 500, subtotal: 6200, gst: 620, payment: 6820, date: "22 Jun 2026", status: "Paid", paymentMode: "Card",
  },
  {
    id: "INV-03", invoiceNo: "INV-2026-1035", guest: "Michael Brown", room: "305", roomType: "Deluxe",
    bookingId: "BK-1038", phone: "+91 99887 76655", email: "m.brown@corp.com",
    checkIn: "21 Jun 2026", checkOut: "24 Jun 2026", nights: 3, adults: 1, children: 0,
    roomCharges: 7200, restaurantCharges: 940, laundry: 320, miniBar: 0, extraBed: 0, otherCharges: 440,
    discount: 0, subtotal: 8900, gst: 890, payment: 4500, date: "21 Jun 2026", status: "Partial", paymentMode: "Cash",
  },
  {
    id: "INV-04", invoiceNo: "INV-2026-1045", guest: "Anita Desai", room: "118", roomType: "Standard",
    bookingId: "BK-1048", phone: "+91 91234 98765", email: "anita.desai@email.com",
    checkIn: "22 Jun 2026", checkOut: "24 Jun 2026", nights: 2, adults: 1, children: 0,
    roomCharges: 2600, restaurantCharges: 380, laundry: 120, miniBar: 100, extraBed: 0, otherCharges: 0,
    discount: 0, subtotal: 3200, gst: 320, payment: 0, date: "24 Jun 2026", status: "Pending", paymentMode: "—",
  },
];

export const visitorEntries: VisitorEntry[] = [
  { id: "V-01", visitorName: "Amit Sharma", guestName: "Rahul Sharma", room: "204", timeIn: "10:30 AM", timeOut: "12:00 PM", purpose: "Family Visit", idProof: "Aadhaar", status: "Checked Out" },
  { id: "V-02", visitorName: "Neha Patel", guestName: "Priya Patel", room: "501", timeIn: "02:15 PM", timeOut: "—", purpose: "Business Meeting", idProof: "Driving License", status: "Inside" },
  { id: "V-03", visitorName: "David Lee", guestName: "James Wilson", room: "112", timeIn: "11:00 AM", timeOut: "01:30 PM", purpose: "Colleague Visit", idProof: "Passport", status: "Checked Out" },
];

export const luggageRecords: LuggageRecord[] = [
  { id: "L-01", guest: "Priya Patel", room: "501", bagCount: 2, tokenNo: "LG-104", stored: "23 Jun 10:00 AM", location: "Locker A-12", status: "Stored" },
  { id: "L-02", guest: "James Wilson", room: "112", bagCount: 1, tokenNo: "LG-105", stored: "23 Jun 08:30 AM", location: "Locker B-03", returned: "23 Jun 06:00 PM", status: "Returned" },
  { id: "L-03", guest: "Michael Brown", room: "305", bagCount: 3, tokenNo: "LG-106", stored: "24 Jun 07:00 AM", location: "Storage Room", status: "Stored" },
];

export const availabilityDays = ["24", "25", "26", "27", "28", "29", "30"];

export const availabilityDayLabels: Record<string, string> = {
  "24": "Mon 24",
  "25": "Tue 25",
  "26": "Wed 26",
  "27": "Thu 27",
  "28": "Fri 28",
  "29": "Sat 29",
  "30": "Sun 30",
};
