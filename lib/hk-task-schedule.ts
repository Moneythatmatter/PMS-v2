export function normalizeIsoDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isPastIsoDate(date: string, minDate: string): boolean {
  const normalized = normalizeIsoDate(date);
  const min = normalizeIsoDate(minDate);
  if (!normalized || !min) return false;
  return normalized < min;
}

export function clampToMinIsoDate(date: string, minDate: string): string {
  const normalized = normalizeIsoDate(date);
  const min = normalizeIsoDate(minDate);
  if (!normalized || !min) return minDate;
  return normalized < min ? min : normalized;
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
