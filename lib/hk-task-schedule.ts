/** Combine ISO date (YYYY-MM-DD) and HH:mm into an ISO timestamp string. */
export function combineDateAndTime(date: string, time: string): string {
  const d = date.trim();
  const t = time.trim();
  if (!d || !t) return "";
  const normalized = t.length === 5 ? `${t}:00` : t;
  return `${d}T${normalized}`;
}

export function formatScheduleTime(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "—";
  }
}

export function formatScheduleDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
