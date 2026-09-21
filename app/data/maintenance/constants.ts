/** Static UI helpers for Engineering Maintenance (not persisted business data). */

export const ON_DUTY_TECHNICIANS = [
  {
    id: "tech-1",
    name: "Ramesh Kumar",
    role: "Senior HVAC & AC Specialist",
    type: "In-House Staff" as const,
    status: "Available",
    currentTask: "",
    activeWOCount: 0,
    phone: "Ext. 402",
    shift: "Morning (08:00 - 16:00)",
  },
  {
    id: "tech-2",
    name: "Amit Patel",
    role: "Plumbing & Electrical Tech",
    type: "In-House Staff" as const,
    status: "Available",
    currentTask: "",
    activeWOCount: 0,
    phone: "Ext. 405",
    shift: "Morning (08:00 - 16:00)",
  },
  {
    id: "tech-3",
    name: "Deepak Rawat",
    role: "General Maintenance & Carpentry",
    type: "In-House Staff" as const,
    status: "Available",
    currentTask: "",
    activeWOCount: 0,
    phone: "Ext. 408",
    shift: "Morning (08:00 - 16:00)",
  },
];

/** Legacy alias used by some forms. */
export const MOCK_ON_DUTY_TECHNICIANS = ON_DUTY_TECHNICIANS;

export const PROBLEM_CATEGORIES = [
  "HVAC / Air Conditioning",
  "Plumbing & Sanitary",
  "Electrical & Lighting",
  "Elevators & Escalators",
  "Safety & Fire",
  "Carpentry & Furniture",
  "Appliances & TV/Electronics",
  "Painting & Civil",
  "Kitchen Equipment",
  "General / Other",
];

export const HOTEL_LOCATIONS = [
  { type: "Guest Room" as const, name: "Room 101 (Standard King)", floor: "1st Floor" },
  { type: "Guest Room" as const, name: "Room 108 (Standard Twin)", floor: "1st Floor" },
  { type: "Guest Room" as const, name: "Room 205 (Executive Club)", floor: "2nd Floor" },
  { type: "Guest Room" as const, name: "Room 305 (Deluxe Suite)", floor: "3rd Floor" },
  { type: "Guest Room" as const, name: "Room 410 (Standard King)", floor: "4th Floor" },
  { type: "Guest Room" as const, name: "Room 412 (Standard King)", floor: "4th Floor" },
  { type: "Guest Room" as const, name: "Room 501 (Presidential Suite)", floor: "5th Floor" },
  { type: "F&B Area" as const, name: "Main Kitchen - Pastry Section", floor: "Ground Floor" },
  { type: "F&B Area" as const, name: "Main Kitchen - Hot Line", floor: "Ground Floor" },
  { type: "F&B Area" as const, name: "The Grand Buffet Restaurant", floor: "Ground Floor" },
  { type: "Public Area" as const, name: "Main Lobby - East Entrance", floor: "Ground Floor" },
  { type: "Public Area" as const, name: "Main Lobby - Front Desk", floor: "Ground Floor" },
  { type: "Public Area" as const, name: "Passenger Elevator #1", floor: "Lobby Shaft" },
  { type: "Back of House" as const, name: "Engineering Workshop", floor: "Basement 1" },
  { type: "Back of House" as const, name: "Roof Top Chiller Plant", floor: "Roof Floor" },
  { type: "Back of House" as const, name: "DG Room", floor: "Basement 2" },
  { type: "Back of House" as const, name: "Laundry", floor: "Basement 1" },
];

export const SERVICE_CATEGORIES = [
  "HVAC / Air Conditioning",
  "Elevators & Escalators",
  "Electrical & Lighting",
  "Plumbing & Sanitary",
  "Safety & Fire",
  "Carpentry & Furniture",
  "Appliances & TV/Electronics",
  "Painting & Civil",
  "General / Other",
];
