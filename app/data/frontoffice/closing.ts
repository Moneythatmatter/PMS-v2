export interface CashierShiftSummary {
  cashExpected: number;
  cardExpected: number;
  upiExpected: number;
  refunds: number;
}

export interface CashierShiftRecord {
  id: string;
  cashier: string;
  shift: string;
  date: string;
  expected: number;
  actual: number;
  variance: number;
  status: "Closed" | "Open";
}

export interface DayClosingChecklistItem {
  id: string;
  label: string;
  status: "done" | "pending" | "warning";
  detail: string;
}

export interface DayClosingSummary {
  businessDate: string;
  totalRevenue: number;
  roomRevenue: number;
  fbRevenue: number;
  occupancy: number;
  arrivals: number;
  departures: number;
  inHouse: number;
  pendingCheckouts: number;
}

export const currentShiftSummary: CashierShiftSummary = {
  cashExpected: 8450,
  cardExpected: 12300,
  upiExpected: 6200,
  refunds: 500,
};

export const cashierShiftRecords: CashierShiftRecord[] = [
  {
    id: "CS-01",
    cashier: "Meera Nair",
    shift: "Morning (6 AM – 2 PM)",
    date: "23 Jun 2026",
    expected: 22450,
    actual: 22450,
    variance: 0,
    status: "Closed",
  },
  {
    id: "CS-02",
    cashier: "Rajesh Kumar",
    shift: "Afternoon (2 PM – 10 PM)",
    date: "22 Jun 2026",
    expected: 31200,
    actual: 31150,
    variance: -50,
    status: "Closed",
  },
];

export const dayClosingSummary: DayClosingSummary = {
  businessDate: "2026-06-23",
  totalRevenue: 87400,
  roomRevenue: 58200,
  fbRevenue: 18600,
  occupancy: 67,
  arrivals: 3,
  departures: 2,
  inHouse: 4,
  pendingCheckouts: 1,
};

export const dayClosingChecklist: DayClosingChecklistItem[] = [
  { id: "1", label: "All cashier shifts closed", status: "warning", detail: "1 shift still open" },
  { id: "2", label: "Pending check-outs settled", status: "warning", detail: "1 guest pending" },
  { id: "3", label: "Room charges posted", status: "done", detail: "All in-house rooms posted" },
  { id: "4", label: "POS bills transferred", status: "done", detail: "No open POS tabs" },
  { id: "5", label: "Night audit ready", status: "pending", detail: "Run after day closing" },
];
