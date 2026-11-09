import { api } from "../api";
import type {
  Recipe,
  RecipeConsumeInput,
  RecipeConsumption,
  RecipeInput,
} from "@/app/data/foodbeverages/recipes";
import type {
  Conversion,
  ConversionInput,
  ConversionItem,
  ConversionItemInput,
} from "@/app/data/foodbeverages/conversions";
import type { ModifierGroup, ModifierGroupInput } from "@/app/data/foodbeverages/modifiers";
import type { CashierSession, CashierSessionDetail } from "../front-office/cashier-sessions";
import type {
  Reservation,
  ReservationInput,
  ReservationSettings,
  ReservationSettingsBundle,
  TableReservationOverlay,
} from "@/app/data/foodbeverages/reservations";

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
  reservationId?: string | null;
  /** Set on Room Service / Takeaway order tiles. */
  orderNo?: string;
  kotCount?: number;
  /** A KOT on the open order is still Pending/Preparing in the kitchen. */
  kitchenPending?: boolean;
  /** Every KOT on the open order is marked ready (or served) by the kitchen. */
  foodReady?: boolean;
  /** Booking relevant to this table right now; separate from the physical status. */
  reservation?: TableReservationOverlay | null;
};

export type PosEntryMode = "new" | "manage" | "settle";

export type FbBillTaxLine = {
  code: string;
  name: string;
  type: string;
  rate: number;
  fixed: boolean;
  amount: number;
};

/** `included`: menu prices already contain the tax (it is carved out, not added on top). */
export type FbBillTaxSummary = { included: boolean; lines: FbBillTaxLine[] };

export type FbBillPayment = { id: string; method: string; amount: number; at: string };

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
  /** OPEN | CLOSED | CANCELLED — POS lifecycle separate from kitchen status */
  lifecycleStatus?: string;
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
  listRoomServiceOpen: (outletId?: string) =>
    api.get<LiveTable[]>(
      fbPath(
        `/floor-plan/room-service${outletId ? `?outletId=${encodeURIComponent(outletId)}` : ""}`,
      ),
    ),
  listTakeawayOpen: (outletId?: string) =>
    api.get<LiveTable[]>(
      fbPath(
        `/floor-plan/takeaway${outletId ? `?outletId=${encodeURIComponent(outletId)}` : ""}`,
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
  /** Item base price; the server adds the chosen modifiers' prices. */
  unitPrice: number;
  note?: string;
  modifierIds?: string[];
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
    overrideReservation?: { reservationId: string; reason?: string };
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
      taxSummary?: FbBillTaxSummary;
      payments?: FbBillPayment[];
      paidAmount?: number;
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
  readyAt?: string | null;
  printedAt: string | null;
  prepMinutes: number | null;
  rejectReason: string | null;
  lines: { id: string; name: string; qty: number; status: string; note?: string; modifiers?: string[] }[];
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

type FbClosingBody = {
  lines: { paymentMethod: string; actualAmount: number | null; remarks?: string | null }[];
  closingRemarks?: string;
};

/** Cashier sessions at one outlet; same shape as the Front Office cashier service. */
export function fbCashierSessionService(outletId: string) {
  const base = "/cashier-sessions";
  const q = `outletId=${encodeURIComponent(outletId)}`;
  return {
    list: (status?: string) =>
      api.get<CashierSession[]>(fbPath(`${base}?${q}${status ? `&status=${encodeURIComponent(status)}` : ""}`)),
    active: () => api.get<CashierSession | null>(fbPath(`${base}/active?${q}`)),
    get: (id: string) => api.get<CashierSessionDetail>(fbPath(`${base}/${id}`)),
    start: (body: { shiftName: string; openingCash: number; openingRemarks?: string }) =>
      api.post<CashierSessionDetail>(fbPath(base), { ...body, outletId }),
    saveClosing: (id: string, body: FbClosingBody) =>
      api.put<CashierSessionDetail>(fbPath(`${base}/${id}/closing`), body),
    submit: (id: string, body: FbClosingBody) =>
      api.post<CashierSessionDetail>(fbPath(`${base}/${id}/submit`), body),
    approve: (id: string) => api.post<CashierSessionDetail>(fbPath(`${base}/${id}/approve`), {}),
    reject: (id: string, remarks: string) =>
      api.post<CashierSessionDetail>(fbPath(`${base}/${id}/reject`), { remarks }),
    resubmit: (id: string, body: FbClosingBody) =>
      api.post<CashierSessionDetail>(fbPath(`${base}/${id}/resubmit`), body),
  };
}

export type FbDayCloseCheck = {
  id: string;
  label: string;
  mandatory: boolean;
  passed: boolean;
  detail: string;
  href?: string;
};

export type FbOutletDayClosing = {
  id: string;
  outletId: string;
  outletName?: string | null;
  businessDate: string;
  billsCount: number;
  grossSales: number;
  discount: number;
  tax: number;
  netSales: number;
  roomCharges: number;
  collections: number;
  closedAt: string;
  closedByName?: string | null;
};

export type FbDayCloseStatus = {
  businessDate: string;
  calendarDate: string;
  outlet: { id: string; name: string; type: string };
  closed: boolean;
  closing: FbOutletDayClosing | null;
  canClose: boolean;
  checks: FbDayCloseCheck[];
  blockers: number;
  unsettledShifts: { id: string; cashierName: string; shiftName: string; openedAt: string; status: string }[];
  openOrders: { id: string; orderNo: string; type: string; ref: string; status: string; amount: number }[];
  unpaidBills: { id: string; billNo: string; total: number; paymentStatus: string }[];
  totals: {
    billsCount: number;
    grossSales: number;
    discount: number;
    tax: number;
    netSales: number;
    roomCharges: number;
    collections: {
      byMethod: { method: string; label: string; amount: number }[];
      gross: number;
      refunds: number;
      net: number;
    };
  };
};

export const fbDayCloseService = {
  status: (outletId: string) =>
    api.get<FbDayCloseStatus>(fbPath(`/day-close/status?outletId=${encodeURIComponent(outletId)}`)),
  run: (outletId: string) => api.post<FbOutletDayClosing>(fbPath("/day-close/run"), { outletId }),
  history: (outletId?: string) =>
    api.get<FbOutletDayClosing[]>(
      fbPath(`/day-close/history${outletId ? `?outletId=${encodeURIComponent(outletId)}` : ""}`),
    ),
};

export const menuCategoryService = crud("/menu/categories");
export const menuItemService = crud("/menu/items");
export const modifierGroupService = {
  list: () => api.get<ModifierGroup[]>(fbPath("/menu/modifier-groups")),
  get: (id: string) => api.get<ModifierGroup>(fbPath(`/menu/modifier-groups/${id}`)),
  create: (body: ModifierGroupInput) => api.post<ModifierGroup>(fbPath("/menu/modifier-groups"), body),
  update: (id: string, body: ModifierGroupInput) =>
    api.put<ModifierGroup>(fbPath(`/menu/modifier-groups/${id}`), body),
  remove: (id: string) => api.delete<{ id: string }>(fbPath(`/menu/modifier-groups/${id}`)),
};

export const ingredientService = crud("/inventory/ingredients");
export const fbUnitService = crud("/masters/units");
export const fbTaxGroupService = crud("/masters/tax-groups");
export const fbOutletTypeService = crud("/masters/outlet-types");
export const wastageService = crud("/inventory/wastage");
export const stockAdjustmentService = crud("/inventory/adjustments");

export const dayCloseService = crud("/day-close");
export const fbReservationService = {
  list: (params?: { date?: string; outletId?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.date) q.set("date", params.date);
    if (params?.outletId) q.set("outletId", params.outletId);
    if (params?.status) q.set("status", params.status);
    const qs = q.toString();
    return api.get<Reservation[]>(fbPath(`/reservations${qs ? `?${qs}` : ""}`));
  },
  get: (id: string) => api.get<Reservation>(fbPath(`/reservations/${id}`)),
  create: (body: ReservationInput) => api.post<Reservation>(fbPath("/reservations"), body),
  update: (id: string, body: Partial<ReservationInput>) =>
    api.put<Reservation>(fbPath(`/reservations/${id}`), body),
  remove: (id: string) => api.delete<{ id: string }>(fbPath(`/reservations/${id}`)),
  seat: (id: string, body?: { tableNo?: string; override?: boolean; server?: string }) =>
    api.post<{ reservation: Reservation; session: Record<string, unknown>; liveTableId: string; tableNo: string }>(
      fbPath(`/reservations/${id}/seat`),
      body ?? {},
    ),
  markNoShow: (id: string) => api.post<Reservation>(fbPath(`/reservations/${id}/no-show`), {}),
  cancel: (id: string, reason?: string) =>
    api.post<Reservation>(fbPath(`/reservations/${id}/cancel`), { reason }),
  complete: (id: string) => api.post<Reservation>(fbPath(`/reservations/${id}/complete`), {}),
};

export const reservationSettingsService = {
  get: () => api.get<ReservationSettingsBundle>(fbPath("/reservation-settings")),
  save: (scopeKey: string, body: Omit<ReservationSettings, "scopeKey" | "updatedAt">) =>
    api.put<ReservationSettingsBundle>(fbPath(`/reservation-settings/${encodeURIComponent(scopeKey)}`), body),
  remove: (scopeKey: string) =>
    api.delete<ReservationSettingsBundle>(fbPath(`/reservation-settings/${encodeURIComponent(scopeKey)}`)),
};

export const conversionItemService = {
  list: () => api.get<ConversionItem[]>(fbPath("/inventory/conversion-items")),
  get: (id: string) => api.get<ConversionItem>(fbPath(`/inventory/conversion-items/${id}`)),
  create: (body: ConversionItemInput) =>
    api.post<ConversionItem>(fbPath("/inventory/conversion-items"), body),
  update: (id: string, body: ConversionItemInput) =>
    api.put<ConversionItem>(fbPath(`/inventory/conversion-items/${id}`), body),
  remove: (id: string) => api.delete<{ id: string }>(fbPath(`/inventory/conversion-items/${id}`)),
};

export const conversionService = {
  list: () => api.get<Conversion[]>(fbPath("/inventory/conversions")),
  get: (id: string) => api.get<Conversion>(fbPath(`/inventory/conversions/${id}`)),
  create: (body: ConversionInput) => api.post<Conversion>(fbPath("/inventory/conversions"), body),
  update: (id: string, body: ConversionInput) =>
    api.put<Conversion>(fbPath(`/inventory/conversions/${id}`), body),
  complete: (id: string, body?: { completedBy?: string }) =>
    api.post<Conversion>(fbPath(`/inventory/conversions/${id}/complete`), body ?? {}),
  remove: (id: string) => api.delete<{ id: string }>(fbPath(`/inventory/conversions/${id}`)),
};

export const recipeService = {
  list: () => api.get<Recipe[]>(fbPath("/menu/recipes")),
  get: (id: string) => api.get<Recipe>(fbPath(`/menu/recipes/${id}`)),
  create: (body: RecipeInput) => api.post<Recipe>(fbPath("/menu/recipes"), body),
  update: (id: string, body: RecipeInput) => api.put<Recipe>(fbPath(`/menu/recipes/${id}`), body),
  remove: (id: string) => api.delete<{ id: string }>(fbPath(`/menu/recipes/${id}`)),
  consume: (id: string, body: RecipeConsumeInput) =>
    api.post<RecipeConsumption>(fbPath(`/menu/recipes/${id}/consume`), body),
  consumptions: (id?: string) =>
    api.get<RecipeConsumption[]>(
      fbPath(id ? `/menu/recipes/${id}/consumptions` : "/menu/recipes/consumptions"),
    ),
};

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
