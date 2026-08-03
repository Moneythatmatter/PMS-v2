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
