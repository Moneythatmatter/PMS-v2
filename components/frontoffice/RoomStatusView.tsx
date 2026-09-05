"use client";

import { useEffect, useMemo, useState } from "react";
import { Wrench } from "lucide-react";
import type { RoomStatusCard } from "@/app/data/frontoffice/modules";
import { floors, roomStatuses } from "@/app/data/frontoffice/constants";
import { roomService } from "@/services/front-office";
import {
  FO_ROOM_STATUS_LEGEND_ORDER,
  getFoRoomStatusConfig,
} from "@/lib/frontoffice/room-status-colors";
import {
  FormField,
  FOPageHeader,
  FOSearchToolbar,
  SelectInput,
} from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";

function compareFloorLabel(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function compareRoomNo(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function RoomStatusCardTile({ room }: { room: RoomStatusCard }) {
  const config = getFoRoomStatusConfig(room.status);
  const hasMaintenance = room.maintenance !== "OK";
  const footerText = hasMaintenance
    ? room.maintenance
    : room.guestName ?? (room.checkoutDate ? `Out ${room.checkoutDate}` : null);

  return (
    <div
      title={
        hasMaintenance
          ? `Maintenance: ${room.maintenance}`
          : room.guestName
            ? `${room.guestName}${room.checkoutDate ? ` · Out ${room.checkoutDate}` : ""}`
            : room.type
      }
      className={cn(
        "group flex h-[88px] flex-col rounded-xl border p-2.5 transition-all",
        "hover:-translate-y-0.5 hover:shadow-lg",
        config.card,
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <p className={cn("text-lg font-bold leading-none tracking-tight", config.roomNoText)}>
          {room.roomNo}
        </p>
        <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", config.dot)} />
      </div>

      <p className={cn("mt-0.5 truncate text-[10px] font-medium", config.metaText)}>
        {room.type}
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
        {footerText ? (
          <>
            {hasMaintenance && <Wrench className="h-2.5 w-2.5 shrink-0 opacity-80" />}
            <span className="truncate">{footerText}</span>
          </>
        ) : (
          <span className="invisible select-none" aria-hidden>
            —
          </span>
        )}
      </div>
    </div>
  );
}

export function RoomStatusView() {
  const [rooms, setRooms] = useState<RoomStatusCard[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [floorFilter, setFloorFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await roomService.status();
        if (!cancelled) {
          setRooms(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rooms.filter((r) => {
      const statusMatch = filter === "all" || r.status.toLowerCase() === filter;
      const floorMatch = floorFilter === "all" || r.floor === floorFilter;
      const searchMatch =
        !q ||
        r.roomNo.includes(q) ||
        r.type.toLowerCase().includes(q) ||
        (r.guestName?.toLowerCase().includes(q) ?? false);
      return statusMatch && floorMatch && searchMatch;
    });
  }, [rooms, filter, floorFilter, search]);

  const pillScopeRooms = useMemo(() => {
    const q = search.toLowerCase();
    return rooms.filter((r) => {
      const floorMatch = floorFilter === "all" || r.floor === floorFilter;
      const searchMatch =
        !q ||
        r.roomNo.includes(q) ||
        r.type.toLowerCase().includes(q) ||
        (r.guestName?.toLowerCase().includes(q) ?? false);
      return floorMatch && searchMatch;
    });
  }, [rooms, floorFilter, search]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: pillScopeRooms.length };
    for (const status of roomStatuses) {
      const key = status.toLowerCase();
      counts[key] = pillScopeRooms.filter((r) => r.status.toLowerCase() === key).length;
    }
    return counts;
  }, [pillScopeRooms]);

  const roomsByFloor = useMemo(() => {
    const groups = new Map<string, RoomStatusCard[]>();

    for (const room of filtered) {
      const floor = room.floor?.trim() || "Unassigned";
      const list = groups.get(floor) ?? [];
      list.push(room);
      groups.set(floor, list);
    }

    const knownFloors = floors.filter((floor) => groups.has(floor));
    const otherFloors = [...groups.keys()]
      .filter((floor) => !floors.includes(floor as (typeof floors)[number]))
      .sort(compareFloorLabel);

    return [...knownFloors, ...otherFloors].map((floor) => ({
      floor,
      rooms: (groups.get(floor) ?? []).sort((a, b) => compareRoomNo(a.roomNo, b.roomNo)),
    }));
  }, [filtered]);

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-5">
      <FOPageHeader
        eyebrow="Front Office"
        title="Room Status"
        description="Real-time room inventory and maintenance status board."
        action={
          <div className="flex max-w-xl flex-wrap items-center justify-end gap-x-3 gap-y-1.5">
            {FO_ROOM_STATUS_LEGEND_ORDER.map((status) => {
              const cfg = getFoRoomStatusConfig(status);
              return (
                <div
                  key={status}
                  className="flex items-center gap-1.5 text-[11px] text-slate-600"
                  title={cfg.description}
                >
                  <span className={cn("h-3 w-4 shrink-0 rounded border", cfg.legend)} />
                  <span className="font-medium text-slate-700">{cfg.label}</span>
                </div>
              );
            })}
          </div>
        }
      />

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <FOSearchToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search room number, type, or guest…"
            filterPills={{
              active: filter,
              onChange: setFilter,
              options: [
                { id: "all", label: `All (${statusCounts.all})` },
                ...roomStatuses.map((s) => ({
                  id: s.toLowerCase(),
                  label: `${s} (${statusCounts[s.toLowerCase()] ?? 0})`,
                })),
              ],
            }}
            hasActiveAdvancedFilters={floorFilter !== "all"}
            onClearAdvancedFilters={() => setFloorFilter("all")}
            advancedFilters={
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <FormField label="Floor">
                  <SelectInput
                    value={floorFilter}
                    onChange={(e) => setFloorFilter(e.target.value)}
                  >
                    <option value="all">All Floors</option>
                    {floors.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </SelectInput>
                </FormField>
              </div>
            }
          />
      </div>

      <div className="space-y-4">
        {roomsByFloor.map(({ floor, rooms: floorRooms }) => (
          <section
            key={floor}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3">
              <div className="h-7 w-1 rounded-full bg-emerald-500" />
              <h2 className="text-sm font-semibold text-slate-800">{floor}</h2>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                {floorRooms.length} {floorRooms.length === 1 ? "room" : "rooms"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 p-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
              {floorRooms.map((room) => (
                <RoomStatusCardTile key={room.roomNo} room={room} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-500">
          No rooms match the selected filters.
        </p>
      )}
    </div>
  );
}
