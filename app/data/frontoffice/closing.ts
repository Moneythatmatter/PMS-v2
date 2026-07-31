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
  href?: string;
}

export interface DayClosingSummary {
  businessDate: string;
  totalRevenue: number;
  roomRevenue: number;
  fbRevenue: number;
  otherRevenue: number;
  occupancy: number;
  arrivals: number;
  departures: number;
  inHouse: number;
  pendingCheckouts: number;
}

export interface PendingDeparture {
  id: string;
  guestName: string;
  roomNo: string;
  checkOut: string;
  balance: number;
  status: "Pending" | "Settled";
}

export interface RoomChargePosting {
  id: string;
  roomNo: string;
  guestName: string;
  roomRate: number;
  extras: number;
  status: "Posted" | "Pending";
}

export interface OpenPosTab {
  id: string;
  outlet: string;
  roomNo: string;
  guestName: string;
  amount: number;
  status: "Open" | "Transferred";
}

export interface DayClosingReport {
  closedAt: string;
  previousBusinessDate: string;
  nextBusinessDate: string;
  closedBy: string;
  steps: string[];
  roomRevenue: number;
  fbRevenue: number;
  otherRevenue: number;
  totalRevenue: number;
  occupancy: number;
  arrivals: number;
  departures: number;
  inHouse: number;
  shiftsClosed: number;
  chargesPosted: number;
  posTransferred: number;
}

export type NightAuditItemStatus = "Posted" | "Pending" | "Exception" | "Resolved";

export interface NightAuditItem {
  id: string;
  roomNo: string;
  guestName: string;
  roomRate: number;
  extras: number;
  posted: number;
  auditTime: string;
  status: NightAuditItemStatus;
  note?: string;
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
  {
    id: "CS-03",
    cashier: "Zain George",
    shift: "Evening (10 PM – 6 AM)",
    date: "23 Jun 2026",
    expected: 26450,
    actual: 0,
    variance: 0,
    status: "Open",
  },
];

export const dayClosingSummary: DayClosingSummary = {
  businessDate: "2026-06-23",
  totalRevenue: 87400,
  roomRevenue: 58200,
  fbRevenue: 18600,
  otherRevenue: 10600,
  occupancy: 67,
  arrivals: 3,
  departures: 2,
  inHouse: 4,
  pendingCheckouts: 1,
};

export const pendingDepartures: PendingDeparture[] = [
  {
    id: "PD-01",
    guestName: "Sarah Chen",
    roomNo: "305",
    checkOut: "23 Jun 2026",
    balance: 2400,
    status: "Pending",
  },
];

export const roomChargePostings: RoomChargePosting[] = [
  {
    id: "RC-01",
    roomNo: "112",
    guestName: "James Wilson",
    roomRate: 3200,
    extras: 850,
    status: "Posted",
  },
  {
    id: "RC-02",
    roomNo: "204",
    guestName: "Rahul Sharma",
    roomRate: 4500,
    extras: 200,
    status: "Posted",
  },
  {
    id: "RC-03",
    roomNo: "501",
    guestName: "Priya Patel",
    roomRate: 8500,
    extras: 680,
    status: "Posted",
  },
  {
    id: "RC-04",
    roomNo: "305",
    guestName: "Michael Brown",
    roomRate: 5200,
    extras: 0,
    status: "Pending",
  },
];

export const openPosTabs: OpenPosTab[] = [
  {
    id: "POS-18",
    outlet: "Restaurant #1",
    roomNo: "112",
    guestName: "James Wilson",
    amount: 850,
    status: "Open",
  },
  {
    id: "POS-19",
    outlet: "Main Bar",
    roomNo: "501",
    guestName: "Priya Patel",
    amount: 1200,
    status: "Open",
  },
];

/** Legacy static checklist — Day Closing now derives status from live mock state. */
export const dayClosingChecklist: DayClosingChecklistItem[] = [
  { id: "cashier", label: "All cashier shifts closed", status: "warning", detail: "1 shift still open", href: "/frontoffice/cashiers-closing" },
  { id: "checkouts", label: "Pending check-outs settled", status: "warning", detail: "1 guest pending", href: "/frontoffice/reservation/check-out" },
  { id: "charges", label: "Room charges posted", status: "warning", detail: "1 room pending posting" },
  { id: "pos", label: "POS bills transferred", status: "warning", detail: "2 open POS tabs" },
  { id: "audit", label: "Night audit ready", status: "pending", detail: "Run after day closing", href: "/frontoffice/reports/night-audit" },
];

export const initialNightAuditItems: NightAuditItem[] = [
  {
    id: "N1",
    roomNo: "112",
    guestName: "James Wilson",
    roomRate: 3200,
    extras: 850,
    posted: 4050,
    auditTime: "11:45 PM",
    status: "Posted",
    note: "Restaurant charge included",
  },
  {
    id: "N2",
    roomNo: "204",
    guestName: "Rahul Sharma",
    roomRate: 4500,
    extras: 200,
    posted: 4700,
    auditTime: "11:46 PM",
    status: "Posted",
  },
  {
    id: "N3",
    roomNo: "305",
    guestName: "Michael Brown",
    roomRate: 5200,
    extras: 0,
    posted: 5200,
    auditTime: "11:47 PM",
    status: "Posted",
  },
  {
    id: "N4",
    roomNo: "501",
    guestName: "Priya Patel",
    roomRate: 8500,
    extras: 680,
    posted: 9180,
    auditTime: "11:48 PM",
    status: "Posted",
  },
  {
    id: "N5",
    roomNo: "118",
    guestName: "—",
    roomRate: 0,
    extras: 0,
    posted: 0,
    auditTime: "—",
    status: "Exception",
    note: "No-show — room vacant",
  },
  {
    id: "N6",
    roomNo: "412",
    guestName: "Sarah Chen",
    roomRate: 3500,
    extras: 120,
    posted: 0,
    auditTime: "—",
    status: "Pending",
    note: "Late checkout — hold posting",
  },
];

