"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { accLookupService, type Lookups } from "@/services/accounts";

let lookupsCache: { propertyId: string | null; data: Lookups } | null = null;
let lookupsInflight: Promise<Lookups> | null = null;

function activePropertyId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return (JSON.parse(localStorage.getItem("pms_active_property") ?? "null") as { id?: string } | null)?.id ?? null;
  } catch {
    return null;
  }
}

/** Clear cached dropdown data after creating / editing masters. */
export function invalidateAccLookups() {
  lookupsCache = null;
}

/** Shared dropdown data (accounts, parties, divisions, voucher types, …) for the active property. */
export function useAccLookups() {
  const [lookups, setLookups] = useState<Lookups | null>(
    lookupsCache && lookupsCache.propertyId === activePropertyId() ? lookupsCache.data : null,
  );
  const [loading, setLoading] = useState(!lookups);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (force = false) => {
    const pid = activePropertyId();
    if (!force && lookupsCache && lookupsCache.propertyId === pid) {
      setLookups(lookupsCache.data);
      setLoading(false);
      return lookupsCache.data;
    }
    setLoading(true);
    try {
      const data = await fetchLookups(force);
      setLookups(data);
      setError(null);
      return data;
    } catch (e) {
      setError(accErrorMessage(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (lookupsCache && lookupsCache.propertyId === activePropertyId()) return;
    let cancelled = false;
    fetchLookups(false)
      .then((data) => {
        if (cancelled) return;
        setLookups(data);
        setError(null);
      })
      .catch((e) => {
        if (!cancelled) setError(accErrorMessage(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { lookups, loading, error, reload };
}

async function fetchLookups(force: boolean): Promise<Lookups> {
  const pid = activePropertyId();
  if (force || !lookupsInflight) {
    const request: Promise<Lookups> = accLookupService.get().finally(() => {
      if (lookupsInflight === request) lookupsInflight = null;
    });
    lookupsInflight = request;
  }
  const data = await lookupsInflight;
  lookupsCache = { propertyId: pid, data };
  return data;
}

function sameDeps(a: readonly unknown[], b: readonly unknown[]): boolean {
  return a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
}

/** Run an async loader on mount / when deps change, exposing data + loading + error. */
export function useAccQuery<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prevDeps, setPrevDeps] = useState(deps);
  const [depsVersion, setDepsVersion] = useState(0);
  const loaderRef = useRef(loader);
  const seq = useRef(0);

  if (!sameDeps(prevDeps, deps)) {
    setPrevDeps(deps);
    setDepsVersion((v) => v + 1);
    setLoading(true);
  }

  useEffect(() => {
    loaderRef.current = loader;
  });

  const run = useCallback(async () => {
    const id = ++seq.current;
    try {
      const result = await loaderRef.current();
      if (id === seq.current) {
        setData(result);
        setError(null);
      }
      return result;
    } catch (e) {
      if (id === seq.current) setError(accErrorMessage(e));
      return null;
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    return run();
  }, [run]);

  useEffect(() => {
    void run();
  }, [depsVersion, run]);

  return { data, setData, loading, error, reload };
}

export function accErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return typeof e === "string" ? e : "Something went wrong";
}

export function formatINR(value: number | null | undefined, opts: { decimals?: number; symbol?: boolean } = {}): string {
  const n = Number(value ?? 0);
  const decimals = opts.decimals ?? 2;
  const s = Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return `${n < 0 ? "-" : ""}${opts.symbol === false ? "" : "₹"}${s}`;
}

export function todayIso(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/** Indian fiscal year start (1 April) for a date. */
export function fyStartIso(date: string = todayIso()): string {
  const y = parseInt(date.slice(0, 4), 10);
  const m = parseInt(date.slice(5, 7), 10);
  return `${m >= 4 ? y : y - 1}-04-01`;
}

/** "2026-09-28" → "28 Sep 2026" */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
