import type { ReservationStatus } from "../types";

export interface InHouseGuest {
  id: string;
  bookingNo?: string;
  guestNo?: string;
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

export type RoomDayStatus =
  | "available"
  | "reserved"
  | "occupied"
  | "dirty"
  | "maintenance"
  | "blocked";

export interface RoomAvailabilityRow {
  room: string;
  type: string;
  floor: string;
  bedType?: string;
  maxOccupancy?: number;
  days: Record<string, RoomDayStatus>;
}

export interface RoomStatusCard {
  id?: string;
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
  guestNo?: string;
  name: string;
  mobile: string;
  email: string;
  nationality: string;
  totalStays: number;
  loyaltyPoints: number;
  idType?: string;
  idNumber?: string;
  address?: string;
  gender?: string;
  dob?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
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
  status:
    | "Stored"
    | "Returned"
    | "Claimed"
    | "Awaiting Claim"
    | "Under Verification"
    | "Courier Dispatched"
    | "Disposed";
  returnedDate?: string;
  itemNumber?: string;
  category?: string;
  foundLocation?: string;
  storedLocation?: string;
  returnMethod?: string;
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
  createdAtLabel?: string;
  bookingId?: string;
  bookingNo?: string;
  assignmentType?: "Auto" | "Manual";
  assignmentHistory?: {
    timestamp: string;
    action: string;
    by: string;
    reason?: string;
  }[];
}

export interface MaintenanceRequest {
  id: string;
  room: string;
  problem: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  engineer: string;
  status: "Open" | "Assigned" | "In Progress" | "Awaiting Verification" | "Closed" | "Cancelled";
  reportedBy?: string;
  createdAt: string;
  createdAtLabel?: string;
  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;
  estimatedCompletion?: string;
  actualCompletion?: string;
  assignmentType?: "Auto" | "Manual";
  assignmentHistory?: {
    timestamp: string;
    action: string;
    by: string;
    reason?: string;
  }[];
  attachments?: {
    name: string;
    type: "image" | "pdf" | "video";
    url: string;
  }[];
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
