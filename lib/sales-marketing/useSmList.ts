"use client";

import { useCallback, useEffect, useState } from "react";

export function useSmList<T>(loader: () => Promise<T[]>, deps: unknown[] = []) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loader();
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
      setItems([]);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, setItems, loading, error, reload };
}

export function formatSmCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatSmDate(value?: string | null): string {
  if (!value) return "—";
  try {
    const iso = value.slice(0, 10);
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return value;
    return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

export function todayIsoDate(): string {
  return new Date().toLocaleDateString("en-CA");
}

export function nowTimelineStamp(): string {
  return new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
