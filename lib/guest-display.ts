/** Human-readable guest reference for UI (G-0, G-1, …). */
export function displayGuestNo(
  guest: { guestNo?: string | null; id?: string | null },
): string {
  const no = String(guest.guestNo ?? "").trim();
  if (no) return no;
  return String(guest.id ?? "").trim();
}
