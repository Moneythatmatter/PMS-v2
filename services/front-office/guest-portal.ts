import { foPath, api } from "../api";

export type GuestPortalRecent = {
  kind: "food" | "cleaning" | "laundry";
  id: string;
  label: string;
  status: string;
  at: string;
};

export type GuestPortalContext = {
  roomNo: string;
  roomType: string;
  occupied: boolean;
  guestFirstName: string | null;
  checkOut: string | null;
  recent: GuestPortalRecent[];
};

export type GuestMenuItem = {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  price: number;
  isVegetarian: boolean;
  imageUrl: string | null;
};

export type GuestMenu = {
  categories: { id: string; name: string }[];
  items: GuestMenuItem[];
};

export type RoomQrToken = { roomId: string; roomNo: string; token: string };

/** The guest opens the portal on their phone, so a localhost API URL must point at the host serving the page. */
function portalApiBase(): string {
  const env = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5001").replace(/\/$/, "");
  if (typeof window === "undefined") return env;
  try {
    const url = new URL(env);
    const local = ["localhost", "127.0.0.1"];
    if (local.includes(url.hostname) && !local.includes(window.location.hostname)) {
      url.hostname = window.location.hostname;
      return url.toString().replace(/\/$/, "");
    }
  } catch {
    /* fall through */
  }
  return env;
}

async function portalRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${portalApiBase()}/api/guest-portal${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    cache: "no-store",
  });
  let json: { success?: boolean; data?: T; error?: string } | null = null;
  try {
    json = await res.json();
  } catch {
    throw new Error("We couldn't reach the hotel right now. Please try again.");
  }
  if (!res.ok || !json?.success) throw new Error(json?.error || `Request failed (${res.status})`);
  return json.data as T;
}

const roomPath = (roomId: string, suffix = "") => `/rooms/${encodeURIComponent(roomId)}${suffix}`;
const tokenQuery = (token: string) => `?t=${encodeURIComponent(token)}`;
const post = <T>(path: string, token: string, body: unknown) =>
  portalRequest<T>(`${path}${tokenQuery(token)}`, { method: "POST", body: JSON.stringify(body) });

export const GuestPortalApi = {
  context: (roomId: string, token: string) =>
    portalRequest<GuestPortalContext>(`${roomPath(roomId)}${tokenQuery(token)}`),
  menu: (roomId: string, token: string) =>
    portalRequest<GuestMenu>(`${roomPath(roomId, "/menu")}${tokenQuery(token)}`),
  orderFood: (
    roomId: string,
    token: string,
    body: { lines: { menuItemId: string; qty: number }[]; instructions?: string },
  ) => post<{ id: string; requestNo: string; subtotal: number }>(roomPath(roomId, "/food-orders"), token, body),
  requestCleaning: (roomId: string, token: string, body: { preferredTime?: string; notes?: string }) =>
    post<{ requestId: string; requestNumber: string }>(roomPath(roomId, "/cleaning"), token, body),
  requestLaundry: (
    roomId: string,
    token: string,
    body: { serviceType?: string; urgency?: string; notes?: string },
  ) => post<{ requestId: string; requestNumber: string }>(roomPath(roomId, "/laundry"), token, body),

  /** Staff only: signed tokens for printing room QR codes. */
  qrTokens: () => api.get<RoomQrToken[]>(foPath("/rooms/guest-qr")),
};

export type GuestTableContext = {
  tableNo: string;
  section: string | null;
  outletName: string | null;
  accepting: boolean;
};

export type GuestOrderLine = { menuItemId: string; name: string; qty: number; unitPrice: number };

export type GuestTableRequestStatus = {
  id: string;
  requestNo: string;
  status: "Pending" | "Accepted" | "Rejected" | "Cancelled";
  subtotal: number;
  orderNo: string | null;
  rejectReason: string | null;
  createdAt: string;
  lines: GuestOrderLine[];
};

export type TableQrToken = { tableId: string; tableNo: string; outletId: string | null; token: string };

const tablePath = (tableId: string, suffix = "") => `/tables/${encodeURIComponent(tableId)}${suffix}`;

export const GuestTableApi = {
  context: (tableId: string, token: string) =>
    portalRequest<GuestTableContext>(`${tablePath(tableId)}${tokenQuery(token)}`),
  menu: (tableId: string, token: string) =>
    portalRequest<GuestMenu>(`${tablePath(tableId, "/menu")}${tokenQuery(token)}`),
  submit: (
    tableId: string,
    token: string,
    body: {
      lines: { menuItemId: string; qty: number }[];
      guestName?: string;
      guestPhone?: string;
      pax?: number;
      instructions?: string;
    },
  ) => post<{ id: string; requestNo: string; subtotal: number }>(tablePath(tableId, "/requests"), token, body),
  statuses: (tableId: string, token: string, ids: string[]) =>
    portalRequest<GuestTableRequestStatus[]>(
      `${tablePath(tableId, "/requests")}${tokenQuery(token)}&ids=${encodeURIComponent(ids.join(","))}`,
    ),

  /** Staff only: signed tokens for printing table QR codes. */
  qrTokens: () => api.get<TableQrToken[]>("/api/food-beverages/tables/guest-qr"),
};

export function buildTableQrUrl(tableId: string, token: string) {
  const base =
    process.env.NEXT_PUBLIC_GUEST_PORTAL_URL?.replace(/\/$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "https://pms.local");
  return `${base}/guest/table?tb=${encodeURIComponent(tableId)}&t=${encodeURIComponent(token)}`;
}

export function buildRoomQrUrl(roomId: string, token: string) {
  const base =
    process.env.NEXT_PUBLIC_GUEST_PORTAL_URL?.replace(/\/$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "https://pms.local");
  return `${base}/guest/room?r=${encodeURIComponent(roomId)}&t=${encodeURIComponent(token)}`;
}
