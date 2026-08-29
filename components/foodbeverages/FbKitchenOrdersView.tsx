"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, User, X } from "lucide-react";
import { posService, type FbPosKot } from "@/services/food-beverages";
import { useFbOutlets } from "@/services/food-beverages/useFbOutlets";
import { FbOutletSelect } from "@/components/foodbeverages/FbOutletSelect";
import { cn } from "@/lib/utils";

type KitchenTab = "kot" | "ready";

const ORDER_TYPE_LEGEND = [
  { label: "Dine In", className: "bg-amber-400" },
  { label: "Takeaway", className: "bg-sky-400" },
  { label: "Room Service", className: "bg-teal-500" },
  { label: "Delivery", className: "bg-emerald-500" },
  { label: "Online", className: "bg-indigo-700" },
] as const;

function orderTypeHeaderClass(orderType: string) {
  const type = orderType.toLowerCase();
  if (type.includes("dine")) return "bg-amber-400 text-amber-950";
  if (type.includes("take") || type.includes("pick")) return "bg-sky-400 text-sky-950";
  if (type.includes("room")) return "bg-teal-500 text-teal-950";
  if (type.includes("deliver")) return "bg-emerald-500 text-emerald-950";
  if (type.includes("online") || type.includes("website")) return "bg-indigo-700 text-white";
  return "bg-amber-400 text-amber-950";
}

function tableHeadLabel(kot: FbPosKot) {
  const ref = kot.ref?.trim() || "—";
  const type = kot.orderType?.toUpperCase() || "DINE IN";
  return `${ref} ${type}`;
}

function kotNumberLabel(kotNo: string) {
  const match = kotNo.match(/(\d+)\s*$/);
  return match ? `${match[1]} KOT No.` : kotNo;
}

function parseKotStartMs(kot: FbPosKot) {
  const raw = kot.createdAt ?? kot.placedAt;
  if (!raw) return Date.now();
  const ms = new Date(raw).getTime();
  return Number.isNaN(ms) ? Date.now() : ms;
}

function formatElapsed(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")} : ${String(secs).padStart(2, "0")}`;
}

function KotTimer({ startedAtMs }: { startedAtMs: number }) {
  const [elapsed, setElapsed] = useState(() =>
    Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)),
  );

  useEffect(() => {
    const tick = () =>
      setElapsed(Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [startedAtMs]);

  return (
    <span className="font-mono text-sm font-bold tracking-wide">{formatElapsed(elapsed)}</span>
  );
}

function KotCard({
  kot,
  busy,
  onCancel,
  onCancelItem,
  onFoodReady,
}: {
  kot: FbPosKot;
  busy: boolean;
  onCancel: () => void;
  onCancelItem: (lineId: string, lineName: string) => void;
  onFoodReady: () => void;
}) {
  const showActions = kot.status === "Preparing" || kot.status === "Pending";
  const activeLines = (kot.lines ?? []).filter(
    (line) => String(line.status).toUpperCase() !== "CANCELLED",
  );

  return (
    <article className="flex min-h-[320px] flex-col overflow-hidden rounded-sm border border-slate-300 bg-white shadow-sm">
      <div
        className={cn(
          "grid grid-cols-[1fr_auto_auto] items-center gap-2 px-3 py-2.5 font-semibold",
          orderTypeHeaderClass(kot.orderType),
        )}
      >
        <span className="truncate text-sm uppercase">{tableHeadLabel(kot)}</span>
        <span className="whitespace-nowrap text-xs uppercase">{kotNumberLabel(kot.kotNo)}</span>
        <KotTimer startedAtMs={parseKotStartMs(kot)} />
      </div>

      <div className="flex flex-1 flex-col px-3 py-3">
        <div className="mb-2 grid grid-cols-[1fr_auto] border-b border-slate-200 pb-2 text-xs font-semibold uppercase text-slate-500">
          <span>Item</span>
          <span>Qty.</span>
        </div>

        <div className="mb-3 flex items-center gap-2 text-xs text-slate-600">
          <User className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate">
            {kot.server || "Staff"} ({kot.guest || "Guest"})
          </span>
        </div>

        <ul className="flex-1 space-y-2">
          {(kot.lines ?? []).map((line) => {
            const cancelled = String(line.status).toUpperCase() === "CANCELLED";
            return (
            <li
              key={line.id}
              className={cn(
                "grid grid-cols-[1fr_auto_auto] items-center gap-2 text-sm font-medium",
                cancelled ? "text-slate-400 line-through" : "text-slate-800",
              )}
            >
              <span>{line.name}</span>
              <span className="text-right">{line.qty}</span>
              {showActions && !cancelled && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onCancelItem(line.id, line.name)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  aria-label={`Cancel ${line.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
            );
          })}
          {(kot.lines ?? []).length === 0 && (
            <li className="text-sm text-slate-400">No items</li>
          )}
        </ul>
      </div>

      {showActions && activeLines.length > 0 ? (
        <div className="flex items-center gap-3 border-t border-slate-200 px-3 py-3">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            aria-label="Cancel KOT"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onFoodReady}
            className="flex h-11 flex-1 items-center justify-center rounded-sm bg-red-600 text-sm font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? "Updating…" : "Food Is Ready"}
          </button>
        </div>
      ) : (
        <div className="border-t border-emerald-200 bg-emerald-50 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-emerald-800">
          Ready for service
        </div>
      )}
    </article>
  );
}

export function FbKitchenOrdersView() {
  const { outlets, loading: outletsLoading } = useFbOutlets([
    "restaurant",
    "cafe",
    "bar",
    "kitchen",
  ]);
  const [outletId, setOutletId] = useState("");
  const [kots, setKots] = useState<FbPosKot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<KitchenTab>("kot");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadKots = useCallback(async () => {
    try {
      setLoading(true);
      const data = await posService.listKots(outletId || undefined);
      setKots(data);
      setError(null);
    } catch (e) {
      setKots([]);
      setError(e instanceof Error ? e.message : "Failed to load KOTs");
    } finally {
      setLoading(false);
    }
  }, [outletId]);

  useEffect(() => {
    if (outletsLoading) return;
    void loadKots();
  }, [loadKots, outletsLoading]);

  useEffect(() => {
    if (outletsLoading) return;
    const id = window.setInterval(() => void loadKots(), 15000);
    return () => window.clearInterval(id);
  }, [loadKots, outletsLoading]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return kots.filter((kot) => {
      const inTab =
        tab === "kot"
          ? kot.status === "Preparing" || kot.status === "Pending"
          : kot.status === "Ready";
      if (!inTab) return false;
      if (!q) return true;
      return (
        kot.kotNo.toLowerCase().includes(q) ||
        kot.orderNo.toLowerCase().includes(q) ||
        kot.guest.toLowerCase().includes(q) ||
        kot.ref.toLowerCase().includes(q) ||
        kot.orderType.toLowerCase().includes(q) ||
        kot.server.toLowerCase().includes(q)
      );
    });
  }, [kots, tab, search]);

  const preparingCount = kots.filter(
    (k) => k.status === "Preparing" || k.status === "Pending",
  ).length;
  const readyCount = kots.filter((k) => k.status === "Ready").length;

  const cancelKotItem = async (kot: FbPosKot, lineId: string, lineName: string) => {
    if (!window.confirm(`Cancel ${lineName} on ${kot.kotNo}?`)) return;
    try {
      setBusyId(kot.id);
      const updated = await posService.cancelKotItem(lineId, {
        reason: "Item cancelled from kitchen",
      });
      if (updated.kotStatus === "CANCELLED" || updated.status === "Rejected") {
        setKots((prev) => prev.filter((row) => row.id !== updated.id));
      } else {
        setKots((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
      }
      setToast(`${lineName} cancelled on ${kot.kotNo}`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to cancel item");
    } finally {
      setBusyId(null);
    }
  };

  const cancelKot = async (kot: FbPosKot) => {
    if (!window.confirm(`Cancel ${kot.kotNo}?`)) return;
    try {
      setBusyId(kot.id);
      const updated = await posService.rejectKot(kot.id, {
        reason: "Cancelled from kitchen",
      });
      setKots((prev) => prev.filter((row) => row.id !== updated.id));
      setToast(`${kot.kotNo} cancelled`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to cancel KOT");
    } finally {
      setBusyId(null);
    }
  };

  const markFoodReady = async (kot: FbPosKot) => {
    try {
      setBusyId(kot.id);
      const updated = await posService.advanceKot(kot.id);
      setKots((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
      setToast(`${kot.kotNo} marked ready`);
      if (updated.status === "Ready") setTab("ready");
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to update KOT");
    } finally {
      setBusyId(null);
    }
  };

  if (loading || outletsLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center bg-slate-100 p-6">
        <p className="text-sm text-slate-500">Loading kitchen…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[420px] items-center justify-center bg-slate-100 p-6">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-100">
      <div className="border-b border-slate-300 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setTab("kot")}
              className={cn(
                "border-b-2 pb-2 text-sm font-semibold uppercase tracking-wide transition",
                tab === "kot"
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-slate-500 hover:text-slate-700",
              )}
            >
              Kot View ({preparingCount})
            </button>
            <button
              type="button"
              onClick={() => setTab("ready")}
              className={cn(
                "border-b-2 pb-2 text-sm font-semibold uppercase tracking-wide transition",
                tab === "ready"
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-slate-500 hover:text-slate-700",
              )}
            >
              Ready ({readyCount})
            </button>
          </div>
          <FbOutletSelect
            outlets={outlets}
            value={outletId}
            onChange={setOutletId}
            allowAll
            className="h-9 min-w-[11rem]"
          />
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-4 py-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="h-10 w-full rounded-sm border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none ring-red-500 focus:ring-1"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-600">
            {ORDER_TYPE_LEGEND.map((item) => (
              <span key={item.label} className="inline-flex items-center gap-1.5">
                <span className={cn("h-3 w-3 rounded-sm", item.className)} />
                {item.label}
              </span>
            ))}
          </div>
        </div>

        {toast && (
          <div className="mb-4 flex items-center justify-between rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <span>{toast}</span>
            <button
              type="button"
              className="text-emerald-700 underline"
              onClick={() => setToast(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="rounded-sm border border-dashed border-slate-300 bg-white py-20 text-center text-sm text-slate-500">
            {tab === "kot" ? "No KOTs in kitchen right now." : "No ready tickets."}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((kot) => (
              <KotCard
                key={kot.id}
                kot={kot}
                busy={busyId === kot.id}
                onCancel={() => void cancelKot(kot)}
                onCancelItem={(lineId, lineName) =>
                  void cancelKotItem(kot, lineId, lineName)
                }
                onFoodReady={() => void markFoodReady(kot)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
