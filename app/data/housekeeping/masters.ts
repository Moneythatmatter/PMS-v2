export type PublicAreaPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface PublicAreaMaster {
  id: string;
  areaCode: string;
  name: string;
  areaType: string;
  location?: string | null;
  floorNumber?: number | null;
  priority: PublicAreaPriority;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const PUBLIC_AREA_TYPES = [
  "Lobby",
  "Restaurant",
  "Corridor",
  "Gym",
  "Spa",
  "Restroom",
  "Washroom",
  "Pool",
  "Parking",
  "Banquet Hall",
  "Garden",
] as const;

export const PUBLIC_AREA_PRIORITIES: PublicAreaPriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
];

export const LAUNDRY_ITEM_CATEGORIES = [
  "Garment",
  "Uniform",
  "Soft Furnishing",
  "Other",
] as const;

export type LaundryItemCategory = (typeof LAUNDRY_ITEM_CATEGORIES)[number];

export const LAUNDRY_SERVICE_TYPES = [
  "Ironing",
  "Washing",
  "Wash & Iron",
  "Dry Cleaning",
] as const;

export type LaundryServiceType = (typeof LAUNDRY_SERVICE_TYPES)[number];

export interface LaundryItemMaster {
  id: string;
  itemCode: string;
  name: string;
  category: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LaundryPricingMaster {
  id: string;
  itemId: string;
  serviceType: string;
  unitPrice: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  /** Enriched client-side from item master */
  itemName?: string;
  itemCode?: string;
}
