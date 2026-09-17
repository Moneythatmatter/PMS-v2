/**
 * Canonical booking type catalog for Sales & Marketing.
 * Single source of truth for Create Booking, Leads, filters, and masters.
 */

export type SystemBookingTypeCode =
  | "BANQUET"
  | "CONFERENCE"
  | "ROOM"
  | "RESTAURANT"
  | "POOL"
  | "PRIVATE";

export type CustomBookingTypeCode = `CUSTOM-${string}`;

export type BookingTypeCode = SystemBookingTypeCode | CustomBookingTypeCode;

/** Operational type stored on central bookings / queue */
export type CentralBookingType =
  | "Room Booking"
  | "Banquet / Event Booking"
  | "Conference Booking"
  | "Restaurant Booking"
  | "Swimming Pool Booking"
  | "Private Event / Other"
  | (string & {});

/** Shorter labels used on leads & inquiries */
export type LeadBookingType =
  | "Room Booking"
  | "Banquet Event"
  | "Conference"
  | "Restaurant"
  | "Swimming Pool"
  | "Private Event"
  | (string & {});

export type BookingTypeIconKey =
  | "sparkles"
  | "building2"
  | "bed"
  | "utensils"
  | "waves"
  | "calendar";

export interface BookingTypeDefinition {
  code: BookingTypeCode;
  centralType: string;
  leadType: string;
  cardLabel: string;
  shortLabel: string;
  description: string;
  beoRequired: boolean;
  handoverNote?: string;
  iconKey: BookingTypeIconKey;
  defaultSortOrder: number;
  isSystem: boolean;
  createdAt?: string;
}

export const BOOKING_TYPE_CATALOG: BookingTypeDefinition[] = [
  {
    code: "BANQUET",
    centralType: "Banquet / Event Booking",
    leadType: "Banquet Event",
    cardLabel: "Banquet / Wedding Event",
    shortLabel: "Banquet / Event",
    description: "Weddings, receptions, parties, gala dinners",
    beoRequired: true,
    handoverNote: "BEO required",
    iconKey: "sparkles",
    defaultSortOrder: 1,
    isSystem: true,
  },
  {
    code: "CONFERENCE",
    centralType: "Conference Booking",
    leadType: "Conference",
    cardLabel: "Conference / Meeting",
    shortLabel: "Conference",
    description: "Corporate seminars, boardroom meets, MICE events",
    beoRequired: true,
    handoverNote: "BEO required",
    iconKey: "building2",
    defaultSortOrder: 2,
    isSystem: true,
  },
  {
    code: "ROOM",
    centralType: "Room Booking",
    leadType: "Room Booking",
    cardLabel: "Room Booking Stay",
    shortLabel: "Room Booking",
    description: "Individual or delegation room stays",
    beoRequired: false,
    handoverNote: "Front Office handover",
    iconKey: "bed",
    defaultSortOrder: 3,
    isSystem: true,
  },
  {
    code: "RESTAURANT",
    centralType: "Restaurant Booking",
    leadType: "Restaurant",
    cardLabel: "Restaurant Booking",
    shortLabel: "Restaurant",
    description: "Dining tables & group dinners",
    beoRequired: false,
    handoverNote: "F&B handover",
    iconKey: "utensils",
    defaultSortOrder: 4,
    isSystem: true,
  },
  {
    code: "POOL",
    centralType: "Swimming Pool Booking",
    leadType: "Swimming Pool",
    cardLabel: "Swimming Pool Booking",
    shortLabel: "Swimming Pool",
    description: "Pool deck buyouts & social gatherings",
    beoRequired: false,
    handoverNote: "Configurable BEO",
    iconKey: "waves",
    defaultSortOrder: 5,
    isSystem: true,
  },
  {
    code: "PRIVATE",
    centralType: "Private Event / Other",
    leadType: "Private Event",
    cardLabel: "Private / Other Event",
    shortLabel: "Private Event",
    description: "Custom private gatherings & special occasions",
    beoRequired: false,
    iconKey: "calendar",
    defaultSortOrder: 6,
    isSystem: true,
  },
];

export function isSystemBookingTypeCode(code: BookingTypeCode): code is SystemBookingTypeCode {
  return BOOKING_TYPE_CATALOG.some((item) => item.code === code);
}

export function buildCustomBookingTypeDefinition(input: {
  name: string;
  description: string;
  beoRequired: boolean;
  handoverNote?: string;
  iconKey: BookingTypeIconKey;
  sortOrder: number;
  code?: CustomBookingTypeCode;
}): BookingTypeDefinition {
  const name = input.name.trim();
  const code = input.code ?? (`CUSTOM-${Date.now()}` as CustomBookingTypeCode);

  return {
    code,
    centralType: name,
    leadType: name,
    cardLabel: name,
    shortLabel: name,
    description: input.description.trim() || "Custom booking classification",
    beoRequired: input.beoRequired,
    handoverNote: input.handoverNote?.trim() || undefined,
    iconKey: input.iconKey,
    defaultSortOrder: input.sortOrder,
    isSystem: false,
    createdAt: new Date().toISOString(),
  };
}

export function getBookingTypeByCode(
  code: BookingTypeCode,
  catalog: BookingTypeDefinition[] = BOOKING_TYPE_CATALOG,
): BookingTypeDefinition | undefined {
  return catalog.find((item) => item.code === code);
}

export function getBookingTypeByCentralType(
  centralType: string,
  catalog: BookingTypeDefinition[] = BOOKING_TYPE_CATALOG,
): BookingTypeDefinition | undefined {
  return catalog.find(
    (item) => item.centralType.toLowerCase() === centralType.toLowerCase(),
  );
}

export function getBookingTypeByLeadType(
  leadType: string,
  catalog: BookingTypeDefinition[] = BOOKING_TYPE_CATALOG,
): BookingTypeDefinition | undefined {
  return catalog.find((item) => item.leadType.toLowerCase() === leadType.toLowerCase());
}
