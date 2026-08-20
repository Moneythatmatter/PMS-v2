import type { GuestProfile } from "@/app/data/frontoffice/modules";

export function normalizeMobile(value: string): string {
  return value.replace(/\D/g, "");
}

export function splitGuestName(name: string): { firstName: string; lastName: string } {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
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
  if (!search) return undefined;
  return guests.find((g) => {
    if (excludeGuestId && g.id === excludeGuestId) return false;
    return (g.email || "").trim().toLowerCase() === search;
  });
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

export function guestToFormFields(guest: GuestProfile) {
  const { firstName, lastName } = splitGuestName(guest.name);
  return {
    guestId: guest.id,
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
    totalStays: guest.totalStays || 0,
  };
}
