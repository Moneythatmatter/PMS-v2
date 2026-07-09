export interface RoomTypeMaster {
  id: string;
  code: string;
  name: string;
  description: string;
  baseRate: number;
  maxOccupancy: number;
  maxAdults: number;
  maxChildren: number;
  totalRooms: number;
  sizeSqFt: number;
  amenities: string[];
  status: "Active" | "Inactive";
}

export interface RatePlanMaster {
  id: string;
  code: string;
  name: string;
  roomType: string;
  baseRate: number;
  weekendRate: number;
  mealPlan: string;
  cancellationPolicy: string;
  minNights: number;
  validFrom: string;
  validTo: string;
  status: "Active" | "Inactive";
}

export interface MarketSegmentMaster {
  id: string;
  code: string;
  name: string;
  category: "Corporate" | "Leisure" | "OTA" | "Government" | "Group";
  discountPercent: number;
  description: string;
  contactPerson?: string;
  commissionPercent?: number;
  status: "Active" | "Inactive";
}

export const roomTypeMasters: RoomTypeMaster[] = [
  {
    id: "RT-01",
    code: "STD",
    name: "Standard",
    description: "Comfortable room with essential amenities for business and leisure travellers.",
    baseRate: 2800,
    maxOccupancy: 2,
    maxAdults: 2,
    maxChildren: 1,
    totalRooms: 24,
    sizeSqFt: 220,
    amenities: ["Wi-Fi", "AC", "TV", "Work Desk"],
    status: "Active",
  },
  {
    id: "RT-02",
    code: "DLX",
    name: "Deluxe",
    description: "Spacious room with premium bedding and city view.",
    baseRate: 4200,
    maxOccupancy: 3,
    maxAdults: 2,
    maxChildren: 2,
    totalRooms: 18,
    sizeSqFt: 320,
    amenities: ["Wi-Fi", "AC", "Smart TV", "Mini Bar", "Bathtub"],
    status: "Active",
  },
  {
    id: "RT-03",
    code: "STE",
    name: "Suite",
    description: "Luxury suite with separate living area and VIP amenities.",
    baseRate: 8500,
    maxOccupancy: 4,
    maxAdults: 3,
    maxChildren: 2,
    totalRooms: 8,
    sizeSqFt: 580,
    amenities: ["Wi-Fi", "AC", "Smart TV", "Mini Bar", "Jacuzzi", "Butler Service"],
    status: "Active",
  },
  {
    id: "RT-04",
    code: "PRM",
    name: "Premium",
    description: "Top-floor premium rooms with panoramic views.",
    baseRate: 6200,
    maxOccupancy: 3,
    maxAdults: 2,
    maxChildren: 1,
    totalRooms: 6,
    sizeSqFt: 400,
    amenities: ["Wi-Fi", "AC", "Smart TV", "Mini Bar", "Balcony"],
    status: "Active",
  },
];

export const ratePlanMasters: RatePlanMaster[] = [
  {
    id: "RP-01",
    code: "BAR",
    name: "Best Available Rate",
    roomType: "All Types",
    baseRate: 3500,
    weekendRate: 4200,
    mealPlan: "EP",
    cancellationPolicy: "Free cancellation 24 hrs before arrival",
    minNights: 1,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    status: "Active",
  },
  {
    id: "RP-02",
    code: "CORP",
    name: "Corporate Rate",
    roomType: "Standard, Deluxe",
    baseRate: 3200,
    weekendRate: 3200,
    mealPlan: "CP",
    cancellationPolicy: "Free cancellation 48 hrs before arrival",
    minNights: 1,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    status: "Active",
  },
  {
    id: "RP-03",
    code: "WKND",
    name: "Weekend Package",
    roomType: "Deluxe, Premium",
    baseRate: 4800,
    weekendRate: 4800,
    mealPlan: "MAP",
    cancellationPolicy: "Non-refundable",
    minNights: 2,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    status: "Active",
  },
  {
    id: "RP-04",
    code: "LONG",
    name: "Long Stay",
    roomType: "All Types",
    baseRate: 2900,
    weekendRate: 2900,
    mealPlan: "EP",
    cancellationPolicy: "7-day notice required",
    minNights: 7,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    status: "Active",
  },
  {
    id: "RP-05",
    code: "SUITE",
    name: "Suite Experience",
    roomType: "Suite",
    baseRate: 9500,
    weekendRate: 11000,
    mealPlan: "AP",
    cancellationPolicy: "Free cancellation 72 hrs before arrival",
    minNights: 1,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    status: "Active",
  },
];

export const marketSegmentMasters: MarketSegmentMaster[] = [
  {
    id: "MS-01",
    code: "CORP",
    name: "Corporate",
    category: "Corporate",
    discountPercent: 15,
    description: "Direct corporate contracts and negotiated company rates.",
    contactPerson: "Sales Manager",
    status: "Active",
  },
  {
    id: "MS-02",
    code: "LEIS",
    name: "Leisure",
    category: "Leisure",
    discountPercent: 0,
    description: "Individual leisure travellers and walk-in guests.",
    status: "Active",
  },
  {
    id: "MS-03",
    code: "OTA",
    name: "Online Travel Agents",
    category: "OTA",
    discountPercent: 10,
    description: "Booking.com, MakeMyTrip, Agoda and other OTAs.",
    commissionPercent: 18,
    status: "Active",
  },
  {
    id: "MS-04",
    code: "GOVT",
    name: "Government",
    category: "Government",
    discountPercent: 20,
    description: "Government officials and PSU bookings.",
    contactPerson: "Front Office Manager",
    status: "Active",
  },
  {
    id: "MS-05",
    code: "GRP",
    name: "Group / Wedding",
    category: "Group",
    discountPercent: 25,
    description: "Group bookings, weddings, and events.",
    contactPerson: "Events Team",
    status: "Active",
  },
  {
    id: "MS-06",
    code: "TA",
    name: "Travel Agents",
    category: "OTA",
    discountPercent: 12,
    description: "Registered travel agents and tour operators.",
    commissionPercent: 10,
    status: "Inactive",
  },
];
