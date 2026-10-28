import { api, foPath } from "../api";

export type CashierLine = {
  paymentMethod: string;
  openingAmount: number;
  totalReceived: number;
  totalRefunded: number;
  totalPaidOut: number;
  expectedAmount: number;
  actualAmount: number | null;
  variance: number | null;
  remarks: string | null;
};

export type CashierSession = {
  id: string;
  propertyId: string;
  cashierId: string;
  cashierName?: string | null;
  cashierEmail?: string | null;
  shiftName: string;
  openedAt: string;
  openingCash: number;
  openingRemarks?: string | null;
  closedAt?: string | null;
  closingCashExpected?: number | null;
  closingCashActual?: number | null;
  cashVariance?: number | null;
  closingRemarks?: string | null;
  status: "Open" | "Pending Approval" | "Closed" | "Rejected" | string;
  closedBy?: string | null;
  closedByName?: string | null;
  approvedBy?: string | null;
  approvedByName?: string | null;
  approvedAt?: string | null;
};

export type CashierAudit = {
  id: string;
  action: string;
  actorId?: string | null;
  actorName?: string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  remarks?: string | null;
  createdAt: string;
};

export type CashierSessionDetail = {
  session: CashierSession;
  lines: CashierLine[];
  audits: CashierAudit[];
};

const base = "/cashier-sessions";

export const cashierSessionService = {
  list: (status?: string) =>
    api.get<CashierSession[]>(foPath(status ? `${base}?status=${encodeURIComponent(status)}` : base)),
  active: () => api.get<CashierSession | null>(foPath(`${base}/active`)),
  get: (id: string) => api.get<CashierSessionDetail>(foPath(`${base}/${id}`)),
  start: (body: { shiftName: string; openingCash: number; openingRemarks?: string }) =>
    api.post<CashierSessionDetail>(foPath(base), body),
  saveClosing: (
    id: string,
    body: { lines: { paymentMethod: string; actualAmount: number | null; remarks?: string | null }[]; closingRemarks?: string },
  ) => api.put<CashierSessionDetail>(foPath(`${base}/${id}/closing`), body),
  submit: (
    id: string,
    body: { lines: { paymentMethod: string; actualAmount: number | null; remarks?: string | null }[]; closingRemarks?: string },
  ) => api.post<CashierSessionDetail>(foPath(`${base}/${id}/submit`), body),
  approve: (id: string) => api.post<CashierSessionDetail>(foPath(`${base}/${id}/approve`), {}),
  reject: (id: string, remarks: string) =>
    api.post<CashierSessionDetail>(foPath(`${base}/${id}/reject`), { remarks }),
  resubmit: (
    id: string,
    body: { lines: { paymentMethod: string; actualAmount: number | null; remarks?: string | null }[]; closingRemarks?: string },
  ) => api.post<CashierSessionDetail>(foPath(`${base}/${id}/resubmit`), body),
};
