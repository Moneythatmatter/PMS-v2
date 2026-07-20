import type { HousekeepingRequest, MaintenanceRequest, LostFoundItem } from "@/app/data/frontoffice/modules";

export interface HKInspectionHistory {
  id: string;
  date: string;
  time: string;
  inspector: string;
  supervisor: string;
  result: "Passed" | "Rejected";
  qualityScore: number;
  remarks: string;
  signature: string;
}

export interface HKRoom {
  roomNo: string;
  category: string;
  type?: string; // Front Office compatible naming
  bedType: string;
  floor: string;
  wing: string;
  maxOccupancy: number;
  cleaningFrequency: "Daily" | "Stay-over" | "Weekly" | "On-Demand";
  deepCleaningFrequency: "Every 30 Days" | "Every 60 Days" | "Every 90 Days";
  lastDeepCleaned: string;
  status: "Vacant Ready" | "Occupied" | "Vacant Dirty" | "Occupied Dirty" | "Cleaning" | "Inspection Pending" | "Blocked" | "Out of Order" | "Out of Service";
  hkStatus: "Clean" | "Dirty" | "Cleaning" | "Inspected" | "OOO" | "OOS";
  foStatus: "Vacant" | "Occupied" | "Blocked";
  dnd: boolean;
  sleepOut: boolean;
  facilities: string[];
  remarks: string;
  assignedStaff?: string;
  assignedSupervisor?: string;
  cleaningTimer?: {
    startedAt: string; // ISO string
    elapsedSeconds: number;
    paused: boolean;
    lastTick: string;
  };
  cleaningProgress?: number; // 0 to 100
  photos?: string[]; // array of strings / mock urls
  inspectionHistory?: HKInspectionHistory[];
  
  // Front Office sync properties
  guestName?: string;
  checkoutDate?: string;
  housekeeping?: string;
  maintenance?: string;
}


export interface HKPublicAreaChecklistItem {
  task: string;
  completed: boolean;
}

export interface HKPublicAreaHistoryLog {
  id: string;
  date: string;
  housekeeper: string;
  supervisor: string;
  duration: string;
  status: string;
  remarks: string;
}

export interface HKPublicArea {
  id: string;
  name: string;
  category: "Lobby" | "Restaurant" | "Corridor" | "Gym" | "Spa" | "Restroom" | "Pool" | "Parking" | "Banquet Hall" | "Washroom" | "Garden";
  floor: string;
  location: string;
  assignedStaff: string;
  supervisor: string;
  cleaningFrequency: string;
  status: "Dirty" | "Assigned" | "Cleaning" | "Pending Inspection" | "Inspected" | "Clean" | "Blocked";
  priority: "High" | "Medium" | "Low";
  lastCleaned: string;
  nextCleaning: string;
  estDuration: string;
  inspectionStatus: "Passed" | "Failed" | "Pending" | "None";
  checklist: HKPublicAreaChecklistItem[];
  history: HKPublicAreaHistoryLog[];
}

export interface HKChecklistTemplate {
  id: string;
  name: string;
  type: "Stay-over" | "Departure" | "Deep-Clean" | "Public-Area";
  items: string[];
}

export interface HKStaff {
  id: string;
  name: string;
  role: "Housekeeper" | "Supervisor" | "Inspector" | "Laundry Staff" | "Engineer" | "Bell Boy";
  activeShift: string;
  phone: string;
  status: "Active" | "Inactive";
  activeTaskCount?: number;
  completedToday?: number;
  currentFloor?: string;
  lastAssignedTime?: string;
  workStatus?: "Available" | "Busy" | "Break" | "Off Shift";
  activeJobs?: number;
  lastAssignment?: string;
  specialization?: "Electrical" | "Plumbing" | "HVAC" | "Carpentry" | "General";
}

export interface HKShift {
  id: string;
  name: string;
  timings: string;
  description: string;
}

export interface HKInventoryItem {
  id: string;
  name: string;
  category: "Linen" | "Amenity" | "Equipment" | "Chemical";
  available: number;
  laundry?: number;
  damaged: number;
  lost: number;
  discarded: number;
  parStock: number;
  unit: string;
}

export interface HKLaundryJob {
  id: string;
  type: "Guest" | "Hotel";
  item: string;
  quantity: number;
  room?: string;
  guestName?: string;
  status: "Collection" | "Washing" | "Ironing" | "Ready" | "Delivered";
  charges: number;
  timeline: {
    collectedAt: string;
    washedAt?: string;
    readyAt?: string;
    deliveredAt?: string;
  };
  notes?: string;
}

export interface HKDamageReport {
  id: string;
  room: string;
  damageType: "Electrical" | "Plumbing" | "AC" | "Furniture" | "Wall" | "Linen" | "Other";
  description: string;
  photo?: string;
  reportedBy: string;
  reportedAt: string;
  estimatedCost: number;
  status: "Reported" | "Approved" | "Repaired" | "Cancelled";
}

export interface HKRequisition {
  id: string;
  requestNo: string;
  requestedBy: string;
  items: { item: string; quantity: number; unit: string }[];
  status: "Pending" | "Approved" | "Issued" | "Rejected";
  requestedAt: string;
  issuedAt?: string;
  remarks?: string;
}

export interface HKHistoryLog {
  id: string;
  timestamp: string;
  user: string;
  category: "Cleaning" | "Room Status" | "Inspection" | "Laundry" | "Maintenance" | "Lost & Found" | "Inventory";
  action: string;
  room?: string;
  details: string;
}

export interface HKLuggageJob {
  id: string;
  guest: string;
  room: string;
  bellBoy: string;
  tagNumber: string;
  bagCount: number;
  type: "Check-in" | "Check-out" | "Storage";
  pickupTime: string;
  deliveryTime?: string;
  status: "Pending" | "In Transit" | "Delivered" | "Stored";
  remarks?: string;
}

export type { HousekeepingRequest, MaintenanceRequest, LostFoundItem };
