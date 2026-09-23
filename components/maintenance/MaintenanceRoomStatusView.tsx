"use client";

import { useEffect, useMemo, useState } from "react";
import { Wrench, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import type { MntLocationStatus, MntRoom } from "@/app/data/maintenance/types";
import { mntRoomService } from "@/services/maintenance/index";
import {
  FOPageHeader,
  FOSearchToolbar,
  FormField,
  SelectInput,
} from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";

const STATUS_ORDER: MntLocationStatus[] = [
  "Operational",
  "Under Maintenance",
  "Out of Service",
];

const statusStyles: Record<
  MntLocationStatus,
  { card: string; roomNoText: string; metaText: string; badge: string; dot: string }
> = {
  Operational: {
    card: "border-emerald-200 bg-emerald-50/80",
    roomNoText: "text-emerald-900",
    metaText: "text-emerald-700/80",
    badge: "bg-emerald-100 text-emerald-800",
    dot: "bg-emerald-500",
  },
  "Under Maintenance": {
    card: "border-amber-200 bg-amber-50/80",
    roomNoText: "text-amber-900",
    metaText: "text-amber-700/80",
    badge: "bg-amber-100 text-amber-800",
    dot: "bg-amber-500",
  },
  "Out of Service": {
    card: "border-rose-200 bg-rose-50/80",
    roomNoText: "text-rose-900",
    metaText: "text-rose-700/80",
    badge: "bg-rose-100 text-rose-800",
    dot: "bg-rose-500",
  },
};

function compareFloorLabel(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function compareRoomNo(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function RoomTile({
  room,
  onClick,
}: {
  room: MntRoom;
  onClick: () => void;
}) {
  const config = statusStyles[room.status] ?? statusStyles.Operational;
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Room ${room.roomNo} — ${room.status}`}
      className={cn(
        "group flex h-[88px] w-full flex-col rounded-xl border p-2.5 text-left transition-all",
        "hover:-translate-y-0.5 hover:shadow-lg",
        config.card,
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <p className={cn("text-lg font-bold leading-none tracking-tight", config.roomNoText)}>
          {room.roomNo ?? "—"}
        </p>
        <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", config.dot)} />
      </div>
      <p className={cn("mt-0.5 truncate text-[10px] font-medium", config.metaText)}>
        {room.roomType ?? "Room"}
      </p>
      <span
        className={cn(
          "mt-1 inline-flex w-fit max-w-full truncate rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
          config.badge,
        )}
      >
        {room.status}
      </span>
      <div className={cn("mt-auto flex h-3.5 items-center gap-0.5 truncate text-[9px] font-medium", config.metaText)}>
        {room.notes ? (
          <>
            <Wrench className="h-2.5 w-2.5 shrink-0 opacity-80" />
            <span className="truncate">{room.notes}</span>
          </>
        ) : (
          <span className="invisible select-none" aria-hidden>
            —
          </span>
        )}
      </div>
    </button>
  );
}

export function MaintenanceRoomStatusView() {
  const [rooms, setRooms] = useState<MntRoom[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [floorFilter, setFloorFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await mntRoomService.list();
      setRooms(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const floors = useMemo(() => {
    const set = new Set(rooms.map((r) => r.floor || "Unassigned"));
    return Array.from(set).sort(compareFloorLabel);
  }, [rooms]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rooms.filter((r) => {
      const matchesSearch =
        !q ||
        String(r.roomNo ?? "").toLowerCase().includes(q) ||
        String(r.roomType ?? "").toLowerCase().includes(q) ||
        String(r.notes ?? "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      const floor = r.floor || "Unassigned";
      const matchesFloor = floorFilter === "all" || floor === floorFilter;
      return matchesSearch && matchesStatus && matchesFloor;
    });
  }, [rooms, search, statusFilter, floorFilter]);

  const byFloor = useMemo(() => {
    const map = new Map<string, MntRoom[]>();
    for (const room of filtered) {
      const floor = room.floor || "Unassigned";
      if (!map.has(floor)) map.set(floor, []);
      map.get(floor)!.push(room);
    }
    for (const list of map.values()) {
      list.sort((a, b) => compareRoomNo(String(a.roomNo ?? ""), String(b.roomNo ?? "")));
    }
    return Array.from(map.entries()).sort(([a], [b]) => compareFloorLabel(a, b));
  }, [filtered]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rooms.length };
    for (const s of STATUS_ORDER) c[s] = rooms.filter((r) => r.status === s).length;
    return c;
  }, [rooms]);

  const selected = useMemo(
    () => rooms.find((r) => r.id === selectedId) ?? null,
    [rooms, selectedId],
  );

  const updateStatus = async (status: MntLocationStatus) => {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await mntRoomService.update(selected.id, { status });
      setRooms((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <FOPageHeader
        eyebrow="Maintenance"
        title="Room Status"
        description="Engineering status board for guest rooms. Synced automatically when Front Office creates a room."
      />

      <div className="flex flex-wrap gap-2">
        {(["all", ...STATUS_ORDER] as const).map((key) => {
          const active = statusFilter === key;
          const label = key === "all" ? "All" : key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                active
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
              )}
            >
              {label} ({counts[key] ?? 0})
            </button>
          );
        })}
      </div>

      <FOSearchToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search room no, type, notes…"
        beforeFilters={
          <FormField label="Floor" className="min-w-[140px]">
            <SelectInput
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
            >
              <option value="all">All floors</option>
              {floors.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </SelectInput>
          </FormField>
        }
      />

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading rooms…
        </div>
      ) : byFloor.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center text-sm text-slate-500">
          No maintenance rooms yet. Create a room in Front Office to sync here.
        </div>
      ) : (
        <div className="space-y-8">
          {byFloor.map(([floor, list]) => (
            <section key={floor}>
              <h2 className="mb-3 text-sm font-bold text-slate-700">{floor}</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                {list.map((room) => (
                  <RoomTile
                    key={room.id}
                    room={room}
                    onClick={() => setSelectedId(room.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Room Status
              </p>
              <h3 className="text-xl font-bold text-slate-900">
                Room {selected.roomNo}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
            >
              Close
            </button>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <p className="text-sm text-slate-600">
              {selected.roomType ?? "—"} · {selected.floor ?? "—"}
            </p>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
                Engineering status
              </p>
              <div className="grid gap-2">
                {STATUS_ORDER.map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={saving}
                    onClick={() => void updateStatus(status)}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm font-semibold transition-colors",
                      selected.status === status
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                        : "border-slate-200 hover:border-slate-300",
                    )}
                  >
                    {status}
                    {selected.status === status && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            {selected.notes && (
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-600">
                {selected.notes}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
