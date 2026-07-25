"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, ChefHat, Flame, Play } from "lucide-react";
import { type KdsStatus } from "@/app/data/foodbeverages/ops";
import { kdsService, type KdsTicket } from "@/services/food-beverages";
import { useFbOutlets } from "@/services/food-beverages/useFbOutlets";
import { Button } from "@/components/ui/Button";
import { ModulePageShell } from "@/components/pms";
import { FbOutletSelect } from "@/components/foodbeverages/FbOutletSelect";
import { cn } from "@/lib/utils";

const stations = ["all", "Hot", "Tandoor", "Grill", "Pastry"] as const;

const nextBump: Partial<Record<KdsStatus, KdsStatus>> = {
  Pending: "Preparing",
  Preparing: "Ready",
  Ready: "Bumped",
};

export function FbKdsView() {
  const { outlets } = useFbOutlets(["kitchen"]);
  const [outletId, setOutletId] = useState("");
  const [tickets, setTickets] = useState<KdsTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [station, setStation] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!outletId && outlets[0]?.id) setOutletId(outlets[0].id);
  }, [outlets, outletId]);

  useEffect(() => {
    if (!outletId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await kdsService.list(outletId);
        if (!cancelled) {
          setTickets(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setTickets([]);
          setError(e instanceof Error ? e.message : "Failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [outletId]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((t) => {
      if (t.status === "Bumped") return false;
      if (t.outletId !== outletId) return false;
      if (station !== "all" && t.station !== station) return false;
      if (!q) return true;
      return (
        t.ticket.toLowerCase().includes(q) ||
        t.table.toLowerCase().includes(q) ||
        t.orderNo.toLowerCase().includes(q) ||
        t.lines.some((l) => l.name.toLowerCase().includes(q))
      );
    });
  }, [tickets, outletId, station, search]);

  const overSla = visible.filter((t) => t.elapsedMin > t.slaMin).length;

  const bump = async (ticket: KdsTicket) => {
    if (!nextBump[ticket.status as KdsStatus]) return;
    try {
      const updated = await kdsService.advance(ticket.id);
      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? updated : t)),
      );
      setToast(
        updated.status === "Bumped"
          ? `${ticket.ticket} cleared from board`
          : `${ticket.ticket} → ${updated.status}`,
      );
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to advance");
    }
  };

  if (loading) {
    return (
      <ModulePageShell
        eyebrow="Kitchen"
        title="KDS"
        description="Live kitchen tickets — start prep, mark ready, and bump."
        wrapChildren={false}
      >
        <p className="text-sm text-slate-500">Loading…</p>
      </ModulePageShell>
    );
  }

  if (error) {
    return (
      <ModulePageShell
        eyebrow="Kitchen"
        title="KDS"
        description="Live kitchen tickets — start prep, mark ready, and bump."
        wrapChildren={false}
      >
        <p className="text-sm text-red-600">{error}</p>
      </ModulePageShell>
    );
  }

  return (
    <ModulePageShell
      eyebrow="Kitchen"
      title="KDS"
      description="Live kitchen tickets — start prep, mark ready, and bump."
      toast={toast}
      onDismissToast={() => setToast(null)}
      wrapChildren={false}
      beforeFilters={
        <FbOutletSelect outlets={outlets} value={outletId} onChange={setOutletId} />
      }
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search ticket, table, or item…"
      filterPills={{
        active: station,
        onChange: setStation,
        options: stations.map((s) => ({
          id: s,
          label: s === "all" ? "All stations" : s,
        })),
      }}
      stats={[
        { label: "On screen", value: visible.length, accent: "#d97706", sublabel: "Open tickets" },
        {
          label: "Preparing",
          value: visible.filter((t) => t.status === "Preparing").length,
          accent: "#ea580c",
          sublabel: "Cooking",
        },
        {
          label: "Ready",
          value: visible.filter((t) => t.status === "Ready").length,
          accent: "#15803d",
          sublabel: "Pass",
        },
        {
          label: "Over SLA",
          value: overSla,
          accent: overSla > 0 ? "#dc2626" : "#15803d",
          sublabel: "Need bump",
        },
      ]}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {visible.map((ticket) => {
          const late = ticket.elapsedMin > ticket.slaMin;
          return (
            <article
              key={ticket.id}
              className={cn(
                "flex flex-col rounded-xl border bg-white p-3 shadow-sm",
                late ? "border-red-300 ring-1 ring-red-100" : "border-slate-200",
                ticket.status === "Ready" && "border-emerald-300 bg-emerald-50/30",
                ticket.priority === "High" && !late && "border-amber-300",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-slate-900">{ticket.ticket}</p>
                  <p className="text-[11px] text-slate-500">
                    {ticket.table} · {ticket.orderNo}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      late
                        ? "bg-red-100 text-red-800"
                        : ticket.status === "Ready"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-700",
                    )}
                  >
                    {late ? <AlertTriangle className="h-3 w-3" /> : <Flame className="h-3 w-3" />}
                    {ticket.elapsedMin}m / {ticket.slaMin}m
                  </span>
                  <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    {ticket.station}
                    {ticket.priority === "High" ? " · High" : ""}
                  </p>
                </div>
              </div>

              <ul className="mt-3 flex-1 space-y-1.5 border-t border-slate-100 pt-3">
                {ticket.lines.map((line) => (
                  <li key={`${ticket.id}-${line.name}`} className="text-sm text-slate-800">
                    <span className="font-semibold">{line.qty}×</span> {line.name}
                    {line.note && (
                      <span className="mt-0.5 block text-[11px] text-amber-700">↳ {line.note}</span>
                    )}
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    ticket.status === "Pending" && "bg-amber-100 text-amber-800",
                    ticket.status === "Preparing" && "bg-orange-100 text-orange-800",
                    ticket.status === "Ready" && "bg-emerald-100 text-emerald-800",
                  )}
                >
                  {ticket.status}
                </span>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 gap-1.5 bg-emerald-700 hover:bg-emerald-800"
                  onClick={() => bump(ticket)}
                >
                  {ticket.status === "Pending" && (
                    <>
                      <Play className="h-3.5 w-3.5" /> Start
                    </>
                  )}
                  {ticket.status === "Preparing" && (
                    <>
                      <ChefHat className="h-3.5 w-3.5" /> Ready
                    </>
                  )}
                  {ticket.status === "Ready" && (
                    <>
                      <Check className="h-3.5 w-3.5" /> Bump
                    </>
                  )}
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      {visible.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center text-sm text-slate-500">
          Kitchen board clear for this station.
        </div>
      )}
    </ModulePageShell>
  );
}
