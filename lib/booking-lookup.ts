import { displayBookingNo } from "@/lib/booking-display";
import { normalizeMobile } from "@/components/frontoffice/guestFormUtils";
import type { SearchOption } from "@/components/ui/SearchSelect";

export interface BookingLookupRecord {
  id: string;
  bookingNo: string;
  guestName: string;
  phone?: string;
  email?: string;
  room?: string;
  guestNo?: string;
}

export function reservationToLookupRecord(booking: {
  id: string;
  bookingNo?: string | null;
  guestName?: string | null;
  phone?: string | null;
  email?: string | null;
  roomNo?: string | null;
  guestNo?: string | null;
}): BookingLookupRecord {
  return {
    id: booking.id,
    bookingNo: displayBookingNo(booking),
    guestName: String(booking.guestName ?? "").trim(),
    phone: booking.phone?.trim() || undefined,
    email: booking.email?.trim() || undefined,
    room: booking.roomNo?.trim() || undefined,
    guestNo: booking.guestNo?.trim() || undefined,
  };
}

export function folioToLookupRecord(folio: {
  id: string;
  bookingId: string;
  guestName: string;
  phone?: string;
  email?: string;
  room?: string;
}): BookingLookupRecord {
  return {
    id: folio.id,
    bookingNo: folio.bookingId,
    guestName: folio.guestName,
    phone: folio.phone?.trim() || undefined,
    email: folio.email?.trim() || undefined,
    room: folio.room?.trim() || undefined,
  };
}

function normalizeRoom(room?: string): string {
  const value = String(room ?? "").trim();
  if (!value || value === "TBA") return "";
  if (/^[0-9a-f-]{36}$/i.test(value)) return "";
  return value.toLowerCase();
}

export function bookingMatchesQuery(
  record: BookingLookupRecord,
  rawQuery: string,
): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;

  const qDigits = normalizeMobile(q);
  const room = normalizeRoom(record.room);

  const textFields = [
    record.bookingNo,
    record.id,
    record.guestName,
    record.guestNo,
    record.email,
    room ? `room ${room}` : "",
    room,
  ]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());

  if (textFields.some((f) => f.includes(q))) return true;

  if (qDigits.length >= 3 && record.phone) {
    const phoneDigits = normalizeMobile(record.phone);
    if (
      phoneDigits.includes(qDigits) ||
      qDigits.includes(phoneDigits) ||
      phoneDigits.endsWith(qDigits) ||
      qDigits.endsWith(phoneDigits)
    ) {
      return true;
    }
  }

  return false;
}

export function findBookingByQuery<T extends BookingLookupRecord>(
  pool: T[],
  query: string,
): T | undefined {
  const trimmed = query.trim();
  if (!trimmed) return undefined;
  return pool.find((record) => bookingMatchesQuery(record, trimmed));
}

function buildHint(record: BookingLookupRecord): string {
  const parts: string[] = [];
  if (record.bookingNo) parts.push(record.bookingNo);
  if (record.room) parts.push(`Room ${record.room}`);
  if (record.phone) parts.push(record.phone);
  if (record.email) parts.push(record.email);
  if (record.guestNo) parts.push(record.guestNo);
  return parts.join(" · ");
}

export function buildBookingSearchOptions<T extends BookingLookupRecord>(
  items: T[],
): SearchOption[] {
  return items.map((item) => ({
    id: item.id,
    label: item.guestName || item.bookingNo,
    sublabel: item.bookingNo,
    hint: buildHint(item),
    data: item,
  }));
}
