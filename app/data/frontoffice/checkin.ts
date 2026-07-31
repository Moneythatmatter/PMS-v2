export const walkInRates: Record<string, number> = {
  Standard: 3500,
  Deluxe: 5200,
  Suite: 8500,
  Premium: 6200,
};

export type CheckInStep = "find" | "verify" | "assign" | "done";

export const baseSteps: { id: CheckInStep; label: string; num: number }[] = [
  { id: "find", label: "Find Booking", num: 1 },
  { id: "verify", label: "Verify Guest", num: 2 },
  { id: "assign", label: "Assign Room", num: 3 },
  { id: "done", label: "Complete", num: 4 },
];

export const bookingTypeOptions = [
  { id: "Individual", label: "Individual", hint: "Personal" },
  { id: "Company", label: "Company", hint: "Corporate" },
] as const;

export const mockCorporateProfiles = [
  { id: "CORP-01", name: "Acme Corporation", code: "ACME", discountPercent: 15, contactPerson: "John Doe" },
  { id: "CORP-02", name: "Global Tech Solutions", code: "GTS", discountPercent: 20, contactPerson: "Jane Smith" },
  { id: "CORP-03", name: "Apex Logistics", code: "APEX", discountPercent: 10, contactPerson: "Robert Johnson" },
];

export const mockRatePlans = [
  { id: "RP-01", code: "EP", name: "European Plan (Room Only)", basePriceMultiplier: 1.0 },
  { id: "RP-02", code: "CP", name: "Continental Plan (Bed & Breakfast)", basePriceMultiplier: 1.15 },
  { id: "RP-03", code: "MAP", name: "Modified American Plan (Half Board)", basePriceMultiplier: 1.35 },
  { id: "RP-04", code: "AP", name: "American Plan (Full Board)", basePriceMultiplier: 1.5 },
];

export const mockAvailableRooms = [
  { roomNo: "101", type: "Standard", floor: "1st Floor", rate: 3500, status: "Clean" },
  { roomNo: "102", type: "Standard", floor: "1st Floor", rate: 3500, status: "Clean" },
  { roomNo: "204", type: "Deluxe", floor: "2nd Floor", rate: 5200, status: "Inspected" },
  { roomNo: "305", type: "Deluxe", floor: "3rd Floor", rate: 5200, status: "Clean" },
  { roomNo: "501", type: "Suite", floor: "5th Floor", rate: 8500, status: "Inspected" },
];
