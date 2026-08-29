import { api } from "../api";

/** F&B base path helper. */
export const fbPath = (segment: string) =>
  `/api/food-beverages${segment.startsWith("/") ? segment : `/${segment}`}`;

function crud<T>(base: string) {
  return {
    list: (query = "") => api.get<T[]>(fbPath(`${base}${query}`)),
    get: (id: string) => api.get<T>(fbPath(`${base}/${id}`)),
    create: (body: Partial<T>) => api.post<T>(fbPath(base), body),
    update: (id: string, body: Partial<T>) =>
      api.put<T>(fbPath(`${base}/${id}`), body),
    remove: (id: string) => api.delete<{ id: string }>(fbPath(`${base}/${id}`)),
  };
}

export type FbOutlet = {
  id: string;
  name: string;
  type: string;
  status?: string;
  bookingStatus?: string;
  tables?: number;
  covers?: number;
  sales?: string;
};

export type LiveTable = {
  id: string;
  outletId: string;
  tableNo: string;
  section: string;
  capacity: number;
  covers: number;
  guest: string;
  server: string;
  durationMin: number;
  checkAmount: number;
  status: string;
  displayState?: "BLANK" | "RUNNING" | "RUNNING_KOT" | "PRINTED" | "PAID";
  openOrderId?: string | null;
  openSessionId?: string | null;
  openBillId?: string | null;
  housekeeping?: string;
};

export type PosEntryMode = "new" | "manage" | "settle";

export type FbOrder = {
  id: string;
  orderNo: string;
  outletId: string;
  type: string;
  ref: string;
  guest: string;
  guestId?: string | null;
  guestNo?: string | null;
  reservationId?: string | null;
  pax?: number | null;
  lines: { name: string; qty: number; note?: string }[];
  amount: number;
  status: string;
  placedAt: string;
  server: string;
  /** Chef ETA in minutes after accept */
  prepMinutes?: number | null;
  /** Set when kitchen rejects */
  rejectReason?: string | null;
  paymentMode?: string | null;
  paidAt?: string | null;
  createdAt?: string;
};

export type KdsTicket = {
  id: string;
  ticket: string;
  outletId: string;
  station: string;
  table: string;
  orderNo: string;
  lines: { name: string; qty: number; note?: string }[];
  elapsedMin: number;
  slaMin: number;
  status: string;
  priority: string;
};

export type FbCashierShift = {
  id: string;
  outletId: string;
  cashier: string;
  shift: string;
  openedAt: string;
  openingFloat: number;
  cashSales: number;
  cardSales: number;
  upiSales: number;
  refunds: number;
  declaredCash: number | null;
  status: string;
};

export const fbDashboardService = {
  get: (outletId?: string) =>
    api.get<Record<string, unknown>>(
      fbPath(`/dashboard${outletId ? `?outletId=${encodeURIComponent(outletId)}` : ""}`),
    ),
};

export const outletService = crud<FbOutlet>("/outlets");

export const liveTableService = {
  list: (outletId?: string) =>
    api.get<LiveTable[]>(
      fbPath(
        `/live-tables${outletId ? `?outletId=${encodeURIComponent(outletId)}` : ""}`,
      ),
    ),
  update: (id: string, body: Partial<LiveTable>) =>
    api.patch<LiveTable>(fbPath(`/live-tables/${id}`), body),
  seat: (id: string, body?: Partial<LiveTable>) =>
    api.post<LiveTable>(fbPath(`/live-tables/${id}/seat`), body ?? {}),
  settle: (id: string) =>
    api.post<LiveTable>(fbPath(`/live-tables/${id}/settle`), {}),
  clean: (id: string) =>
    api.post<LiveTable>(fbPath(`/live-tables/${id}/clean`), {}),
};

export const floorPlanService = {
  list: (outletId?: string) =>
    api.get<LiveTable[]>(
      fbPath(
        `/floor-plan${outletId ? `?outletId=${encodeURIComponent(outletId)}` : ""}`,
      ),
    ),
  get: (tableId: string) => api.get<LiveTable>(fbPath(`/floor-plan/${tableId}`)),
  getOpenOrder: (tableId: string) =>
    api.get<{
      session: Record<string, unknown> | null;
      order: FbOrder | null;
      items?: unknown[];
      kots?: unknown[];
      bills?: unknown[];
    } | null>(fbPath(`/pos/tables/${tableId}/open-order`)),
};

export type PosKotLine = {
  menuItemId?: string;
  name: string;
  qty: number;
  unitPrice: number;
  note?: string;
};

export const posService = {
  sendKot: (body: {
    outletId: string;
    type: string;
    ref?: string;
    liveTableId?: string;
    orderId?: string;
    guest?: string;
    guestId?: string;
    guestNo?: string;
    reservationId?: string;
    pax?: number;
    server?: string;
    lines: PosKotLine[];
    print?: boolean;
  }) =>
    api.post<{
      order: FbOrder;
      kot: Record<string, unknown>;
      amount: number;
    }>(fbPath("/pos/kot"), body),
  printBillForOrder: (orderId: string) =>
    api.post<Record<string, unknown>>(fbPath(`/pos/orders/${orderId}/print-bill`), {}),
  payBill: (billId: string, body?: { amount?: number; paymentMode?: string; fullPay?: boolean }) =>
    api.post<{ bill: Record<string, unknown>; order: FbOrder | null }>(
      fbPath(`/pos/bills/${billId}/pay`),
      body ?? { fullPay: true },
    ),
  getOrderDetails: (orderId: string) =>
    api.get<{
      order: FbOrder;
      items: unknown[];
      kots: unknown[];
      bills: unknown[];
    }>(fbPath(`/pos/orders/${orderId}/details`)),
  listBills: (outletId?: string) =>
    api.get<FbPosBill[]>(
      fbPath(
        `/pos/bills${outletId ? `?outletId=${encodeURIComponent(outletId)}` : ""}`,
      ),
    ),
  listKots: (outletId?: string) =>
    api.get<FbPosKot[]>(
      fbPath(
        `/pos/kots${outletId ? `?outletId=${encodeURIComponent(outletId)}` : ""}`,
      ),
    ),
  acceptKot: (kotId: string, body?: { prepMinutes?: number }) =>
    api.post<FbPosKot>(fbPath(`/pos/kots/${kotId}/accept`), body ?? {}),
  rejectKot: (kotId: string, body: { reason: string }) =>
    api.post<FbPosKot>(fbPath(`/pos/kots/${kotId}/reject`), body),
  cancelKotItem: (kotItemId: string, body?: { reason?: string }) =>
    api.post<FbPosKot>(fbPath(`/pos/kot-items/${kotItemId}/cancel`), body ?? {}),
  advanceKot: (kotId: string) =>
    api.post<FbPosKot>(fbPath(`/pos/kots/${kotId}/advance`), {}),
};

export type FbPosKot = {
  id: string;
  kotNo: string;
  orderId: string;
  orderNo: string;
  orderType: string;
  ref: string;
  guest: string;
  server: string;
  outletId: string;
  status: string;
  kotStatus: string;
  placedAt: string;
  createdAt: string | null;
  printedAt: string | null;
  prepMinutes: number | null;
  rejectReason: string | null;
  lines: { id: string; name: string; qty: number; status: string; note?: string }[];
  amount: number;
};

export type FbPosBill = {
  id: string;
  billNo: string;
  orderId: string;
  orderNo: string;
  orderType: string;
  ref: string;
  guest: string;
  server: string;
  outletId: string;
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  status: string;
  paymentStatus: string;
  billPrintedAt: string | null;
  createdAt: string | null;
};

/** Master table records (floor plan / QR pages). */
export const tableService = crud<LiveTable & { shape?: string; qr?: string }>("/tables");

export const fbOrderService = {
  list: (outletId?: string, status?: string) => {
    const params = new URLSearchParams();
    if (outletId) params.set("outletId", outletId);
    if (status) params.set("status", status);
    const q = params.toString();
    return api.get<FbOrder[]>(fbPath(`/orders${q ? `?${q}` : ""}`));
  },
  get: (id: string) => api.get<FbOrder>(fbPath(`/orders/${id}`)),
  create: (body: Partial<FbOrder>) =>
    api.post<FbOrder>(fbPath("/orders"), body),
  update: (id: string, body: Partial<FbOrder>) =>
    api.put<FbOrder>(fbPath(`/orders/${id}`), body),
  remove: (id: string) => api.delete<{ id: string }>(fbPath(`/orders/${id}`)),
  advance: (id: string) =>
    api.post<FbOrder>(fbPath(`/orders/${id}/advance`), {}),
  accept: (id: string, body?: { prepMinutes?: number }) =>
    api.post<FbOrder>(fbPath(`/orders/${id}/accept`), body ?? {}),
  reject: (id: string, body: { reason: string }) =>
    api.post<FbOrder>(fbPath(`/orders/${id}/reject`), body),
  pay: (id: string, body?: { paymentMode?: string }) =>
    api.post<FbOrder>(fbPath(`/orders/${id}/pay`), body ?? {}),
};

export const kdsService = {
  list: (outletId?: string, includeBumped = false) => {
    const params = new URLSearchParams();
    if (outletId) params.set("outletId", outletId);
    if (includeBumped) params.set("includeBumped", "true");
    const q = params.toString();
    return api.get<KdsTicket[]>(fbPath(`/kds${q ? `?${q}` : ""}`));
  },
  create: (body: Partial<KdsTicket>) =>
    api.post<KdsTicket>(fbPath("/kds"), body),
  update: (id: string, body: Partial<KdsTicket>) =>
    api.put<KdsTicket>(fbPath(`/kds/${id}`), body),
  advance: (id: string) =>
    api.post<KdsTicket>(fbPath(`/kds/${id}/advance`), {}),
};

export const fbCashierService = {
  list: (outletId?: string) =>
    api.get<FbCashierShift[]>(
      fbPath(
        `/cashier-shifts${outletId ? `?outletId=${encodeURIComponent(outletId)}` : ""}`,
      ),
    ),
  open: (body: Partial<FbCashierShift>) =>
    api.post<FbCashierShift>(fbPath("/cashier-shifts"), body),
  update: (id: string, body: Partial<FbCashierShift>) =>
    api.patch<FbCashierShift>(fbPath(`/cashier-shifts/${id}`), body),
  close: (id: string, declaredCash: number) =>
    api.post<FbCashierShift>(fbPath(`/cashier-shifts/${id}/close`), {
      declaredCash,
    }),
};

export const menuCategoryService = crud("/menu/categories");
export const menuItemService = crud("/menu/items");
export const modifierService = crud("/menu/modifiers");

export const ingredientService = crud("/inventory/ingredients");
export const fbUnitService = crud("/masters/units");
export const fbTaxGroupService = crud("/masters/tax-groups");
export const fbModifierGroupService = crud("/masters/modifier-groups");
export const fbOutletTypeService = crud("/masters/outlet-types");
export const wastageService = crud("/inventory/wastage");
export const stockAdjustmentService = crud("/inventory/adjustments");

export const dayCloseService = crud("/day-close");
export const fbReservationService = crud("/reservations");

export const recipeService = crud("/menu/recipes");

export const fbReportService = {
  get: (
    type: string,
    params?: { outletId?: string; range?: string; from?: string; to?: string },
  ) => {
    const q = new URLSearchParams();
    if (params?.outletId) q.set("outletId", params.outletId);
    if (params?.range) q.set("range", params.range);
    if (params?.from) q.set("from", params.from);
    if (params?.to) q.set("to", params.to);
    const qs = q.toString();
    return api.get<{
      type: string;
      title: string;
      summary: Record<string, unknown>;
      rows: unknown[];
      generatedAt: string;
    }>(fbPath(`/reports/${type}${qs ? `?${qs}` : ""}`));
  },
};
