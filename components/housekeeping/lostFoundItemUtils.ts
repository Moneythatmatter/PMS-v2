import type { LostFoundItem } from "@/app/data/frontoffice/modules";

/** API shape from lost_found_items table. */
export interface LostFoundItemDto {
  id: string;
  itemNumber?: string;
  roomId?: string | null;
  bookingId?: string | null;
  guestId?: string | null;
  itemName: string;
  description?: string | null;
  category?: string;
  foundLocation?: string;
  foundBy?: string | null;
  foundAt?: string | null;
  status?: string;
  storedLocation?: string | null;
  claimedBy?: string | null;
  claimedAt?: string | null;
  returnedTo?: string | null;
  returnMethod?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  roomNo?: string;
  guestName?: string;
  foundByName?: string;
  claimedByName?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  ELECTRONICS: "Electronics",
  JEWELRY: "Jewelry",
  CLOTHING: "Clothing",
  DOCUMENTS: "Documents",
  CASH: "Cash",
  BAGS: "Bags",
  ACCESSORIES: "Accessories",
  MEDICINE: "Medicine",
  KEYS: "Keys",
  PERSONAL_ITEMS: "Personal Items",
  OTHER: "Other",
};

function uiStatus(status?: string): LostFoundItem["status"] {
  switch (String(status ?? "").toUpperCase()) {
    case "RETURNED":
      return "Returned";
    case "CLAIMED":
      return "Claimed";
    case "AWAITING_CLAIM":
      return "Awaiting Claim";
    case "UNDER_VERIFICATION":
      return "Under Verification";
    case "COURIER_DISPATCHED":
      return "Courier Dispatched";
    case "DISPOSED":
      return "Disposed";
    default:
      return "Stored";
  }
}

function formatDate(iso?: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(iso);
  }
}

function categoryLabel(category?: string): string {
  const key = String(category ?? "").toUpperCase();
  return CATEGORY_LABELS[key] ?? "Other";
}

/** Map slim lost_found_items row → legacy LostFoundItem for existing UI. */
export function normalizeLostFoundItem(row: LostFoundItemDto): LostFoundItem {
  const foundAt = row.foundAt ?? row.createdAt ?? new Date().toISOString();
  const room = row.roomNo ?? (row.roomId ? String(row.roomId) : "") ?? "—";
  const guest =
    row.guestName ??
    row.returnedTo ??
    row.claimedByName ??
    "Unknown";
  const foundBy = row.foundByName ?? row.foundBy ?? "Housekeeping";

  return {
    id: row.itemNumber ?? row.id,
    itemNumber: row.itemNumber,
    item: row.itemName,
    guest,
    foundBy,
    room: room === "—" ? row.foundLocation ?? "Lobby" : room,
    foundLocation: row.foundLocation ?? undefined,
    storedLocation: row.storedLocation ?? undefined,
    category: categoryLabel(row.category),
    foundDate: formatDate(foundAt),
    description: row.description ?? row.notes ?? undefined,
    status: uiStatus(row.status),
    returnedDate: row.claimedAt ? formatDate(row.claimedAt) : undefined,
    returnMethod: row.returnMethod ?? undefined,
  };
}

export function uiCategoryToLostFoundApi(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes("elect")) return "ELECTRONICS";
  if (lower.includes("jewel")) return "JEWELRY";
  if (lower.includes("cloth")) return "CLOTHING";
  if (lower.includes("doc")) return "DOCUMENTS";
  if (lower.includes("cash")) return "CASH";
  if (lower.includes("bag")) return "BAGS";
  if (lower.includes("access")) return "ACCESSORIES";
  if (lower.includes("medic")) return "MEDICINE";
  if (lower.includes("key")) return "KEYS";
  if (lower.includes("personal")) return "PERSONAL_ITEMS";
  return "OTHER";
}

export type LostFoundCreateInput = {
  item: string;
  guest?: string;
  foundBy?: string;
  room?: string;
  description?: string;
  category?: string;
  foundLocation?: string;
  storedLocation?: string;
};

export function toLostFoundCreatePayload(
  input: LostFoundCreateInput,
): Record<string, unknown> & { itemName: string } {
  return {
    itemName: input.item.trim(),
    guest: input.guest?.trim() || "Unknown",
    foundBy: input.foundBy?.trim() || "Housekeeping",
    roomId: input.room?.trim() || undefined,
    foundLocation:
      input.foundLocation?.trim() ||
      input.room?.trim() ||
      "Unknown",
    storedLocation: input.storedLocation?.trim() || undefined,
    description: input.description?.trim() || undefined,
    category: input.category
      ? uiCategoryToLostFoundApi(input.category)
      : "OTHER",
    status: "STORED",
  };
}

export function resolveLostFoundApiId(
  item: Pick<LostFoundItem, "id" | "itemNumber">,
): string {
  return item.itemNumber ?? item.id;
}
