import type { GuestProfile } from "@/app/data/frontoffice/modules";

export const GUEST_TITLES = ["Mr", "Mrs"] as const;
export type GuestTitle = (typeof GUEST_TITLES)[number] | "";

export function normalizeMobile(value: string): string {
  return value.replace(/\D/g, "");
}

export function splitGuestName(name: string): {
  title: GuestTitle;
  firstName: string;
  lastName: string;
} {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  const raw = (parts[0] ?? "").replace(/\.$/, "");
  const matched = GUEST_TITLES.find(
    (t) => t.toLowerCase() === raw.toLowerCase(),
  );
  if (matched) {
    return {
      title: matched,
      firstName: parts[1] ?? "",
      lastName: parts.slice(2).join(" "),
    };
  }
  return {
    title: "",
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

export function formatGuestDisplayName(
  title: string,
  firstName: string,
  lastName: string,
): string {
  return [title, firstName, lastName]
    .map((p) => p.trim())
    .filter(Boolean)
    .join(" ");
}

export function findGuestByMobile(
  guests: GuestProfile[],
  mobile: string,
  excludeGuestId?: string,
): GuestProfile | undefined {
  const search = normalizeMobile(mobile);
  if (search.length < 10) return undefined;
  return guests.find((g) => {
    if (excludeGuestId && g.id === excludeGuestId) return false;
    const gm = normalizeMobile(g.mobile || "");
    if (!gm) return false;
    return gm === search || gm.endsWith(search) || search.endsWith(gm);
  });
}

export function findGuestByEmail(
  guests: GuestProfile[],
  email: string,
  excludeGuestId?: string,
): GuestProfile | undefined {
  const search = email.trim().toLowerCase();
  if (!search || !search.includes("@")) return undefined;
  return guests.find((g) => {
    if (excludeGuestId && g.id === excludeGuestId) return false;
    return (g.email || "").trim().toLowerCase() === search;
  });
}

export function normalizeIdNumber(value: string): string {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

export function findGuestByIdNumber(
  guests: GuestProfile[],
  idNumber: string,
  excludeGuestId?: string,
): GuestProfile | undefined {
  const search = normalizeIdNumber(idNumber);
  if (search.length < 4) return undefined;
  return guests.find((g) => {
    if (excludeGuestId && g.id === excludeGuestId) return false;
    const gid = normalizeIdNumber(g.idNumber || "");
    return Boolean(gid) && gid === search;
  });
}

export function findGuestDuplicate(
  guests: GuestProfile[],
  fields: { mobile?: string; email?: string; idNumber?: string },
  excludeGuestId?: string,
): { guest: GuestProfile; field: "mobile" | "email" | "idNumber" } | null {
  const byMobile = fields.mobile
    ? findGuestByMobile(guests, fields.mobile, excludeGuestId)
    : undefined;
  if (byMobile) return { guest: byMobile, field: "mobile" };

  const byEmail = fields.email
    ? findGuestByEmail(guests, fields.email, excludeGuestId)
    : undefined;
  if (byEmail) return { guest: byEmail, field: "email" };

  const byId = fields.idNumber
    ? findGuestByIdNumber(guests, fields.idNumber, excludeGuestId)
    : undefined;
  if (byId) return { guest: byId, field: "idNumber" };

  return null;
}

export function guestMatchesQuery(guest: GuestProfile, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const { firstName, lastName } = splitGuestName(guest.name);
  const haystack = [
    guest.name,
    firstName,
    lastName,
    guest.mobile,
    guest.email,
    guest.guestNo,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function guestProfileToCheckInDetails(guest: GuestProfile) {
  return {
    gender: guest.gender || "",
    dob: guest.dob || "",
    nationality: guest.nationality || "",
    address: guest.address || "",
    city: guest.city || "",
    state: guest.state || "",
    country: guest.country || "",
    pincode: guest.pincode || "",
    idProofType: guest.idType || "",
    idNumber: guest.idNumber || "",
  };
}

export function guestToFormFields(guest: GuestProfile) {
  const { title, firstName, lastName } = splitGuestName(guest.name);
  return {
    guestId: guest.id,
    title,
    firstName,
    lastName,
    mobile: normalizeMobile(guest.mobile || ""),
    email: guest.email || "",
    nationality: guest.nationality || "",
    idProofType: guest.idType || "",
    idNumber: guest.idNumber || "",
    address: guest.address || "",
    gender: guest.gender || "",
    dob: guest.dob || "",
    city: guest.city || "",
    state: guest.state || "",
    country: guest.country || "",
    pincode: guest.pincode || "",
    preferences: guest.preferences || [],
    loyaltyPoints: guest.loyaltyPoints || 0,
  };
}
