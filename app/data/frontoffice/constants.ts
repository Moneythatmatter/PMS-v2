export const genders = ["Male", "Female", "Other"] as const;

export const idProofTypes = [
  "Aadhaar",
  "Passport",
  "Driving License",
  "Voter ID",
  "PAN Card",
] as const;

export const roomTypes = ["Standard", "Deluxe", "Suite", "Premium"] as const;

export const tariffPlans = ["BAR", "Corporate", "Weekend", "Long Stay"] as const;
/** @deprecated Use tariffPlans */
export const ratePlans = tariffPlans;

export const mealPlans = ["EP", "CP", "MAP", "AP"] as const;

export const bookingSources = [
  "Walk-in",
  "Website",
  "Booking.com",
  "Agoda",
  "MakeMyTrip",
  "Travel Agent",
  "Corporate",
] as const;

export const paymentModes = ["Cash", "UPI", "Card", "Bank", "Split Payment"] as const;

export const reservationStatuses = [
  "Reserved",
  "Confirmed",
  "Checked In",
  "Checked Out",
  "Cancelled",
  "No Show",
] as const;

export const roomStatuses = [
  "Vacant",
  "Occupied",
  "Dirty",
  "Clean",
  "Maintenance",
  "Blocked",
] as const;

export const housekeepingStatuses = ["Clean", "Dirty", "Inspected", "In Progress"] as const;

export const maintenancePriorities = ["Low", "Medium", "High", "Critical"] as const;

export const requestStatuses = ["Open", "In Progress", "Completed", "Cancelled"] as const;

export const floors = ["Ground", "1st Floor", "2nd Floor", "3rd Floor"] as const;

export const countries = ["India", "USA", "UK", "UAE", "Singapore"] as const;

export const nationalities = ["Indian", "American", "British", "Emirati", "Singaporean"] as const;

export const states = [
  "Maharashtra",
  "Karnataka",
  "Delhi",
  "Tamil Nadu",
  "Gujarat",
  "Rajasthan",
] as const;
