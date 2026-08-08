"use client";

import { useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import {
  formatDuration,
  formatINR,
  tableStatusStyles,
  type LiveTableStatus,
} from "@/app/data/foodbeverages/ops";
import {
  liveTableService,
  type LiveTable,
} from "@/services/food-beverages";
import { useFbOutlets } from "@/services/food-beverages/useFbOutlets";
import { Button } from "@/components/ui/Button";
import { ModulePageShell } from "@/components/pms";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { FormField, TextInput } from "@/components/frontoffice/ui";
import { FbOutletSelect } from "@/components/foodbeverages/FbOutletSelect";
import { cn } from "@/lib/utils";

const statusFilters: { id: string; label: string }[] = [
  { id: "all", label: "All" },
  { id: "Available", label: "Available" },
  { id: "Occupied", label: "Occupied" },
  { id: "Reserved", label: "Reserved" },
  { id: "Billing", label: "Billing" },
  { id: "Dirty", label: "Dirty" },
];

export function FbLiveTablesView() {
  const { outlets } = useFbOutlets([
    "restaurant",
    "cafe",
  ]);
  const [outletId, setOutletId] = useState("");
  const [tables, setTables] = useState<LiveTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<LiveTable | null>(null);
  const [covers, setCovers] = useState("2");
  const [guest, setGuest] = useState("");
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
        const data = await liveTableService.list(outletId);
        if (!cancelled) {
          setTables(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setTables([]);
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

  const outletTables = useMemo(
    () => tables.filter((t) => t.outletId === outletId),
    [tables, outletId],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return outletTables.filter((t) => {
      if (filter !== "all" && t.status !== filter) return false;
      if (!q) return true;
      return (
        t.tableNo.toLowerCase().includes(q) ||
        t.guest.toLowerCase().includes(q) ||
        t.server.toLowerCase().includes(q) ||
        String(t.section ?? "").toLowerCase().includes(q)
      );
    });
  }, [outletTables, filter, search]);

  const sections = useMemo(() => {
    const map = new Map<string, LiveTable[]>();
    for (const t of visible) {
      const section = String(t.section ?? "").trim() || "Floor";
      const list = map.get(section) ?? [];
      list.push(t);
      map.set(section, list);
    }
    return [...map.entries()];
  }, [visible]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {
      Available: 0,
      Occupied: 0,
      Reserved: 0,
      Billing: 0,
      Dirty: 0,
    };
    for (const t of outletTables) c[t.status] = (c[t.status] ?? 0) + 1;
    return c;
  }, [outletTables]);

  const applyTable = (updated: LiveTable, message: string) => {
    setTables((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setToast(message);
    setSelected(null);
  };

  const openSelected = (table: LiveTable) => {
    setSelected(table);
    setCovers(String(table.covers || Math.min(2, table.capacity)));
    setGuest(table.guest === "—" ? "" : table.guest);
  };

  const seatTable = async () => {
    if (!selected) return;
    try {
      const updated = await liveTableService.seat(selected.id, {
        guest: guest.trim() || "Walk-in",
        covers: Math.min(selected.capacity, Math.max(1, Number(covers) || 1)),
        server: "Floor",
      });
      applyTable(updated, `${selected.tableNo} seated`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to seat");
    }
  };

  const requestBill = async () => {
    if (!selected) return;
    try {
      const updated = await liveTableService.update(selected.id, { status: "Billing" });
      applyTable(updated, `${selected.tableNo} moved to billing`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to update");
    }
  };

  const settleTable = async () => {
    if (!selected) return;
    try {
      const updated = await liveTableService.settle(selected.id);
      applyTable(updated, `${selected.tableNo} settled — marked dirty`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to settle");
    }
  };

  const cleanTable = async () => {
    if (!selected) return;
    try {
      const updated = await liveTableService.clean(selected.id);
      applyTable(updated, `${selected.tableNo} ready to seat`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to clean");
    }
  };

  if (loading) {
    return (
      <ModulePageShell
        eyebrow="Restaurants"
        title="Live Table Status"
        description="Floor view — seat guests, open checks, and move tables through service."
        wrapChildren={false}
      >
        <p className="text-sm text-slate-500">Loading…</p>
      </ModulePageShell>
    );
  }

  if (error) {
    return (
      <ModulePageShell
        eyebrow="Restaurants"
        title="Live Table Status"
        description="Floor view — seat guests, open checks, and move tables through service."
        wrapChildren={false}
      >
        <p className="text-sm text-red-600">{error}</p>
      </ModulePageShell>
    );
  }

  return (
    <ModulePageShell
      eyebrow="Restaurants"
      title="Live Table Status"
      description="Floor view — seat guests, open checks, and move tables through service."
      toast={toast}
      onDismissToast={() => setToast(null)}
      wrapChildren={false}
      beforeFilters={
        <FbOutletSelect outlets={outlets} value={outletId} onChange={setOutletId} />
      }
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search table, guest, or server…"
      filterPills={{
        active: filter,
        onChange: setFilter,
        options: statusFilters,
      }}
      stats={[
        { label: "Available", value: counts.Available ?? 0, accent: "#15803d", sublabel: "Ready to seat" },
        { label: "Occupied", value: counts.Occupied ?? 0, accent: "#dc2626", sublabel: "In service" },
        { label: "Billing", value: counts.Billing ?? 0, accent: "#7c3aed", sublabel: "Settling" },
        { label: "Reserved", value: counts.Reserved ?? 0, accent: "#d97706", sublabel: "Upcoming" },
      ]}
    >
      <>
      <div className="space-y-4">
        {sections.map(([section, sectionTables]) => (
          <section key={section} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">{section}</h2>
              <span className="text-[11px] text-slate-500">{sectionTables.length} tables</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
              {sectionTables.map((table) => {
                const style = tableStatusStyles[table.status as LiveTableStatus] ?? tableStatusStyles.Available;
                return (
                  <button
                    key={table.id || table.tableNo}
                    type="button"
                    onClick={() => openSelected(table)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm",
                      style.bg,
                      style.border,
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-base font-bold text-slate-900">{table.tableNo}</p>
                      <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold", style.badge)}>
                        {table.status}
                      </span>
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-600">
                      <Users className="h-3 w-3" />
                      {table.status === "Available" || table.status === "Dirty"
                        ? `${table.capacity} seats`
                        : `${table.covers} / ${table.capacity}`}
                    </p>
                    {table.guest !== "—" && (
                      <p className="mt-1 truncate text-xs font-medium text-slate-800">{table.guest}</p>
                    )}
                    {table.durationMin > 0 && (
                      <p className="mt-0.5 text-[11px] text-slate-500">{formatDuration(table.durationMin)}</p>
                    )}
                    {table.checkAmount > 0 && (
                      <p className="mt-1 text-xs font-semibold text-emerald-800">
                        {formatINR(table.checkAmount)}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
        {visible.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center text-sm text-slate-500">
            No tables match this filter.
          </div>
        )}
      </div>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Table ${selected.tableNo}` : "Table"}
        description={selected ? `${selected.section || "Floor"} · ${selected.status}` : undefined}
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[11px] text-slate-500">Guest</p>
                <p className="font-medium text-slate-900">{selected.guest}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Server</p>
                <p className="font-medium text-slate-900">{selected.server}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Duration</p>
                <p className="font-medium text-slate-900">{formatDuration(selected.durationMin)}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Check</p>
                <p className="font-medium text-slate-900">{formatINR(selected.checkAmount)}</p>
              </div>
            </div>

            {(selected.status === "Available" || selected.status === "Reserved") && (
              <div className="space-y-3 rounded-xl border border-slate-200 p-3">
                <p className="text-xs font-semibold text-slate-700">Seat guests</p>
                <FormField label="Guest name">
                  <TextInput
                    value={guest}
                    onChange={(e) => setGuest(e.target.value)}
                    placeholder="Walk-in or guest name"
                  />
                </FormField>
                <FormField label="Covers">
                  <TextInput
                    type="number"
                    min={1}
                    max={selected.capacity}
                    value={covers}
                    onChange={(e) => setCovers(e.target.value)}
                  />
                </FormField>
                <Button
                  type="button"
                  className="w-full bg-emerald-700 hover:bg-emerald-800"
                  onClick={seatTable}
                >
                  Seat table
                </Button>
              </div>
            )}

            {selected.status === "Occupied" && (
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  className="w-full bg-emerald-700 hover:bg-emerald-800"
                  onClick={requestBill}
                >
                  Request bill
                </Button>
              </div>
            )}

            {selected.status === "Billing" && (
              <Button
                type="button"
                className="w-full bg-emerald-700 hover:bg-emerald-800"
                onClick={settleTable}
              >
                Settle & clear
              </Button>
            )}

            {selected.status === "Dirty" && (
              <Button
                type="button"
                className="w-full bg-emerald-700 hover:bg-emerald-800"
                onClick={cleanTable}
              >
                Mark cleaned
              </Button>
            )}
          </div>
        )}
      </Drawer>
      </>
    </ModulePageShell>
  );
}
