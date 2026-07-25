"use client";

import { useEffect, useState } from "react";
import { outletService, type FbOutlet } from "@/services/food-beverages";

export type OutletTypeFilter =
  | "restaurant"
  | "cafe"
  | "kitchen"
  | "banquet"
  | "bar"
  | "all";

export function useFbOutlets(types: OutletTypeFilter[] = ["all"]) {
  const [outlets, setOutlets] = useState<FbOutlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await outletService.list();
        if (cancelled) return;
        const filtered =
          types.includes("all")
            ? data
            : data.filter((o) => types.includes(o.type as OutletTypeFilter));
        const rank = (t: string) =>
          t === "restaurant" ? 0 : t === "cafe" ? 1 : t === "kitchen" ? 2 : 3;
        filtered.sort(
          (a, b) => rank(a.type) - rank(b.type) || a.name.localeCompare(b.name),
        );
        setOutlets(filtered);
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setOutlets([]);
          setError(e instanceof Error ? e.message : "Failed to load outlets");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [types.join(",")]);

  return { outlets, loading, error };
}
