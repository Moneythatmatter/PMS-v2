import { api } from "../api";
import { fbPath } from "./index";
import type { GuestOrderLine } from "../front-office/guest-portal";

export type GuestOrderRequestStatus = "Pending" | "Accepted" | "Rejected" | "Cancelled";

export type GuestOrderRequestSource = "Table" | "Room";

export type GuestOrderRequest = {
  id: string;
  requestNo: string;
  outletId: string | null;
  outletName: string | null;
  source: GuestOrderRequestSource;
  liveTableId: string | null;
  tableNo: string | null;
  roomId: string | null;
  roomNo: string | null;
  reservationId: string | null;
  guestName: string | null;
  guestPhone: string | null;
  pax: number | null;
  lines: GuestOrderLine[];
  instructions: string | null;
  subtotal: number;
  status: GuestOrderRequestStatus;
  orderId: string | null;
  orderNo: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectReason: string | null;
  createdAt: string;
};

export const guestOrderRequestService = {
  list: (params: { status?: string; outletId?: string; source?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.status) q.set("status", params.status);
    if (params.source && params.source !== "all") q.set("source", params.source);
    if (params.outletId) q.set("outletId", params.outletId);
    const qs = q.toString();
    return api.get<GuestOrderRequest[]>(fbPath(`/guest-order-requests${qs ? `?${qs}` : ""}`));
  },
  pendingCount: () => api.get<{ pending: number }>(fbPath("/guest-order-requests/pending-count")),
  approve: (id: string, body: { lines: { menuItemId: string; qty: number }[]; instructions?: string }) =>
    api.post<GuestOrderRequest>(fbPath(`/guest-order-requests/${id}/approve`), body),
  reject: (id: string, reason: string) =>
    api.post<GuestOrderRequest>(fbPath(`/guest-order-requests/${id}/reject`), { reason }),
};
