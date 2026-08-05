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
  cashExpected?: number;
  cardExpected?: number;
  upiExpected?: number;
  refunds?: number;
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
