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
