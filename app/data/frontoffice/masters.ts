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

export interface CompanyMaster {
  id: string;
  code: string;
  name: string;
  type: "Corporate" | "Travel Agent" | "Government" | "Event";
  contactPerson: string;
  email: string;
  phone: string;
  gstNumber?: string;
  address: string;
  city: string;
  corporateDiscount: number;
  creditLimit: number;
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

export const companyMasters: CompanyMaster[] = [
  {
    id: "CO-01",
    code: "TCS",
    name: "Tata Consultancy Services",
    type: "Corporate",
    contactPerson: "Rajesh Mehta",
    email: "travel.desk@tcs.com",
    phone: "+91 98765 43210",
    gstNumber: "27AAACT2727Q1ZW",
    address: "TCS House, Raveline Street, Fort",
    city: "Mumbai",
    corporateDiscount: 15,
    creditLimit: 500000,
    status: "Active",
  },
  {
    id: "CO-02",
    code: "INFY",
    name: "Infosys Limited",
    type: "Corporate",
    contactPerson: "Priya Nair",
    email: "corporate.travel@infosys.com",
    phone: "+91 98001 23456",
    gstNumber: "29AABCI1234E1Z5",
    address: "Electronics City, Hosur Road",
    city: "Bengaluru",
    corporateDiscount: 12,
    creditLimit: 350000,
    status: "Active",
  },
  {
    id: "CO-03",
    code: "SOTC",
    name: "SOTC Travel",
    type: "Travel Agent",
    contactPerson: "Amit Kapoor",
    email: "b2b@sotc.in",
    phone: "+91 91234 56789",
    gstNumber: "27AABCS1234F1Z8",
    address: "Maker Chambers IV, Nariman Point",
    city: "Mumbai",
    corporateDiscount: 10,
    creditLimit: 200000,
    status: "Active",
  },
  {
    id: "CO-04",
    code: "GOVT",
    name: "Maharashtra Tourism Development",
    type: "Government",
    contactPerson: "Dr. S. Patil",
    email: "bookings@mtdc.gov.in",
    phone: "+91 92222 33444",
    address: "MTDC Building, CDO Hutments",
    city: "Mumbai",
    corporateDiscount: 20,
    creditLimit: 150000,
    status: "Active",
  },
  {
    id: "CO-05",
    code: "WEDG",
    name: "Wedding Planners India",
    type: "Event",
    contactPerson: "Neha Sharma",
    email: "events@weddingplanners.in",
    phone: "+91 99887 76655",
    address: "12, Linking Road, Bandra West",
    city: "Mumbai",
    corporateDiscount: 18,
    creditLimit: 100000,
    status: "Inactive",
  },
];
