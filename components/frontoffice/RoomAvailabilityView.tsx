"use client";

import { Fragment, useMemo, useState } from "react";
import {
  BedDouble,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  DoorOpen,
  Layers,
  Lock,
  Sparkles,
} from "lucide-react";
import {
  availabilityDayLabels,
  availabilityDays,
  roomAvailability,
} from "@/app/data";
import { floors, roomTypes } from "@/app/data/frontoffice/constants";
import { Button } from "@/components/ui/Button";
import {
  EmptyState,
  FOPageHeader,
  Modal,
  SelectInput,
} from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";

type DayStatus = "booked" | "available" | "blocked";
type AvailabilityFilter = "all" | "vacant" | "occupied";

const TODAY = "24";

const statusConfig: Record<
  DayStatus,
  {
    label: string;
    cell: string;
    dot: string;
    legend: string;
    ring: string;
  }
> = {
  available: {
    label: "Available",
    cell: "bg-emerald-50 border-emerald-200/80 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 hover:shadow-sm",
    dot: "bg-emerald-400",
    legend: "bg-emerald-100 border-emerald-200",
    ring: "ring-emerald-300/50",
  },
  booked: {
    label: "Booked",
    cell: "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400 text-white shadow-sm shadow-blue-200/60 hover:from-blue-600 hover:to-blue-700 hover:shadow-md hover:shadow-blue-200/80",
    dot: "bg-blue-500",
    legend: "bg-blue-500 border-blue-400",
    ring: "ring-blue-300/60",
  },
  blocked: {
    label: "Blocked",
    cell: "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200/80",
    dot: "bg-slate-400",
    legend: "bg-slate-200 border-slate-300",
    ring: "ring-slate-300/50",
  },
};

const statCards = [
  { key: "rooms", label: "Rooms Shown", icon: DoorOpen, gradient: "from-slate-500 to-slate-700", bg: "bg-slate-50" },
  { key: "occupancy", label: "Occupancy", icon: BedDouble, gradient: "from-blue-500 to-indigo-600", bg: "bg-blue-50" },
  { key: "available", label: "Available Slots", icon: Sparkles, gradient: "from-emerald-500 to-teal-600", bg: "bg-emerald-50" },
  { key: "blocked", label: "Blocked", icon: Lock, gradient: "from-slate-400 to-slate-500", bg: "bg-slate-50" },
] as const;

function rowHasStatus(row: (typeof roomAvailability)[0], status: DayStatus) {
  return Object.values(row.days).some((d) => d === status);
}

interface CellSelection {
  room: string;
  day: string;
  status: DayStatus;
  type: string;
  floor: string;
}

export function RoomAvailabilityView() {
  const [roomType, setRoomType] = useState("all");
  const [floor, setFloor] = useState("all");
  const [availFilter, setAvailFilter] = useState<AvailabilityFilter>("all");
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedCell, setSelectedCell] = useState<CellSelection | null>(null);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return roomAvailability.filter((row) => {
      const typeMatch = roomType === "all" || row.type === roomType;
      const floorMatch = floor === "all" || row.floor === floor;
      const availMatch =
        availFilter === "all" ||
        (availFilter === "vacant" && rowHasStatus(row, "available")) ||
        (availFilter === "occupied" && rowHasStatus(row, "booked"));
      return typeMatch && floorMatch && availMatch;
    });
  }, [roomType, floor, availFilter]);

  const groupedByFloor = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach((row) => {
      if (!groups[row.floor]) groups[row.floor] = [];
      groups[row.floor].push(row);
    });
    return groups;
  }, [filtered]);

  const stats = useMemo(() => {
    let available = 0;
    let booked = 0;
    let blocked = 0;
    filtered.forEach((row) => {
      availabilityDays.forEach((d) => {
        const status = row.days[d];
        if (status === "available") available++;
        else if (status === "booked") booked++;
        else blocked++;
      });
    });
    const total = available + booked + blocked;
    const occupancy = total > 0 ? Math.round((booked / total) * 100) : 0;
    return { available, booked, blocked, occupancy, rooms: filtered.length };
  }, [filtered]);

  const statValues: Record<(typeof statCards)[number]["key"], string | number> = {
    rooms: stats.rooms,
    occupancy: `${stats.occupancy}%`,
    available: stats.available,
    blocked: stats.blocked,
  };

  const filterPills: { id: AvailabilityFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "vacant", label: "Has Vacancy" },
    { id: "occupied", label: "Has Bookings" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <FOPageHeader
        eyebrow="Front Office"
        title="Room Availability"
        description="Visual tape chart — scan inventory, spot gaps, and plan allocations at a glance."
        badge={
          <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2.5">
            <div className="relative flex h-10 w-10 items-center justify-center">
              <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeDasharray={`${stats.occupancy} ${100 - stats.occupancy}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-[10px] font-bold text-blue-700">
                {stats.occupancy}%
              </span>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Live occupancy</p>
              <p className="text-sm font-semibold text-slate-800">
                {stats.booked} booked · {stats.available} open
              </p>
            </div>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map(({ key, label, icon: Icon, gradient, bg }) => (
          <div
            key={key}
            className={cn(
              "group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
            )}
          >
            <div className={cn("absolute inset-0 opacity-40", bg)} />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
                  {statValues[key]}
                </p>
              </div>
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
                  gradient,
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative">
              <Layers className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <SelectInput
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="h-10 w-full rounded-xl border-slate-200 pl-9 sm:w-44"
              >
                <option value="all">All Room Types</option>
                {roomTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </SelectInput>
            </div>
            <div className="relative">
              <DoorOpen className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <SelectInput
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="h-10 w-full rounded-xl border-slate-200 pl-9 sm:w-40"
              >
                <option value="all">All Floors</option>
                {floors.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </SelectInput>
            </div>
            <div className="flex rounded-xl bg-slate-100/80 p-1">
              {filterPills.map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setAvailFilter(pill.id)}
                  className={cn(
                    "rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-200 sm:text-sm",
                    availFilter === pill.id
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700",
                  )}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 lg:border-t-0 lg:pt-0">
            {(Object.entries(statusConfig) as [DayStatus, typeof statusConfig.available][]).map(
              ([key, cfg]) => (
                <div key={key} className="flex items-center gap-2 text-xs text-slate-600">
                  <span
                    className={cn("h-3 w-5 rounded-md border", cfg.legend)}
                  />
                  {cfg.label}
                </div>
              ),
            )}
          </div>
        </div>
      </div>

      {/* Tape chart */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {/* Chart header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <CalendarRange className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                June 2026
                {weekOffset !== 0 && (
                  <span className="ml-1.5 text-xs font-normal text-slate-400">
                    {weekOffset > 0 ? `+${weekOffset}w` : `${weekOffset}w`}
                  </span>
                )}
              </p>
              <p className="text-[11px] text-slate-400">7-day rolling view</p>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setWeekOffset((o) => o - 1)}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
              aria-label="Previous week"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                weekOffset === 0
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-blue-600 hover:bg-blue-50",
              )}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset((o) => o + 1)}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
              aria-label="Next week"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No rooms match your filters"
            description="Try changing room type, floor, or availability filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 min-w-[120px] border-b border-r border-slate-100 bg-slate-50/95 px-4 py-3 text-left backdrop-blur-sm">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                      Room
                    </span>
                  </th>
                  {availabilityDays.map((d) => {
                    const isToday = d === TODAY;
                    const dayName = availabilityDayLabels[d]?.split(" ")[0] ?? "";
                    const isWeekend = dayName === "Sat" || dayName === "Sun";
                    return (
                      <th
                        key={d}
                        className={cn(
                          "min-w-[76px] border-b border-slate-100 px-1 py-3 text-center",
                          isToday && "bg-blue-50/80",
                          isWeekend && !isToday && "bg-slate-50/60",
                        )}
                      >
                        <span
                          className={cn(
                            "block text-[11px] font-semibold",
                            isToday ? "text-blue-600" : "text-slate-600",
                          )}
                        >
                          {dayName}
                        </span>
                        <span
                          className={cn(
                            "mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
                            isToday
                              ? "bg-blue-600 text-white"
                              : "text-slate-400",
                          )}
                        >
                          {d} Jun
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedByFloor).map(([floorName, rows]) => (
                  <Fragment key={floorName}>
                    <tr>
                      <td
                        colSpan={availabilityDays.length + 1}
                        className="sticky left-0 bg-slate-50/90 px-4 py-2 backdrop-blur-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-1 w-1 rounded-full bg-blue-500" />
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            {floorName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            · {rows.length} room{rows.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </td>
                    </tr>
                    {rows.map((row, rowIdx) => (
                      <tr
                        key={row.room}
                        className={cn(
                          "group/row transition-colors hover:bg-blue-50/30",
                          rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50/30",
                        )}
                      >
                        <td className="sticky left-0 z-10 border-r border-slate-100 bg-inherit px-4 py-2.5 backdrop-blur-sm">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700 group-hover/row:bg-blue-100 group-hover/row:text-blue-700 transition-colors">
                              {row.room}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium text-slate-700">
                                {row.type}
                              </p>
                              <p className="truncate text-[10px] text-slate-400">
                                {row.floor}
                              </p>
                            </div>
                          </div>
                        </td>
                        {availabilityDays.map((d) => {
                          const status = (row.days[d] ?? "available") as DayStatus;
                          const cfg = statusConfig[status];
                          const cellKey = `${row.room}-${d}`;
                          const isToday = d === TODAY;
                          const isHovered = hoveredCell === cellKey;

                          return (
                            <td
                              key={d}
                              className={cn(
                                "px-1.5 py-2.5 text-center",
                                isToday && "bg-blue-50/40",
                              )}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedCell({
                                    room: row.room,
                                    day: d,
                                    status,
                                    type: row.type,
                                    floor: row.floor,
                                  })
                                }
                                onMouseEnter={() => setHoveredCell(cellKey)}
                                onMouseLeave={() => setHoveredCell(null)}
                                aria-label={`Room ${row.room}, ${availabilityDayLabels[d]}: ${cfg.label}`}
                                className={cn(
                                  "relative mx-auto flex h-9 w-full max-w-[58px] items-center justify-center rounded-xl border transition-all duration-200",
                                  cfg.cell,
                                  isHovered && "scale-105 ring-2",
                                  isHovered && cfg.ring,
                                  selectedCell?.room === row.room &&
                                    selectedCell?.day === d &&
                                    "ring-2 ring-offset-1",
                                )}
                              >
                                {status === "booked" && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-white/90 shadow-sm" />
                                )}
                                {status === "blocked" && (
                                  <Lock className="h-3 w-3 opacity-60" />
                                )}
                                {status === "available" && isHovered && (
                                  <span className="text-[9px] font-semibold opacity-70">
                                    Open
                                  </span>
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer hint */}
        {filtered.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 text-center text-[11px] text-slate-400 sm:px-5">
            Click any cell to view details · Blue column marks today
          </div>
        )}
      </div>

      {/* Cell detail modal */}
      <Modal
        open={!!selectedCell}
        onClose={() => setSelectedCell(null)}
        title={selectedCell ? `Room ${selectedCell.room}` : ""}
        description={
          selectedCell
            ? `${availabilityDayLabels[selectedCell.day]} · ${selectedCell.type}`
            : undefined
        }
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setSelectedCell(null)}>
              Close
            </Button>
            {selectedCell?.status === "available" && (
              <Button className="bg-blue-600 hover:bg-blue-700">Create Booking</Button>
            )}
            {selectedCell?.status === "booked" && (
              <Button className="bg-blue-600 hover:bg-blue-700">View Reservation</Button>
            )}
            {selectedCell?.status === "blocked" && (
              <Button variant="outline">Unblock Room</Button>
            )}
          </>
        }
      >
        {selectedCell && (
          <div className="space-y-4">
            <div
              className={cn(
                "flex items-center gap-3 rounded-xl border p-4",
                selectedCell.status === "available" && "border-emerald-200 bg-emerald-50",
                selectedCell.status === "booked" && "border-blue-200 bg-blue-50",
                selectedCell.status === "blocked" && "border-slate-200 bg-slate-50",
              )}
            >
              <span
                className={cn(
                  "h-3 w-3 rounded-full",
                  statusConfig[selectedCell.status].dot,
                )}
              />
              <div>
                <p className="font-semibold text-slate-900">
                  {statusConfig[selectedCell.status].label}
                </p>
                <p className="text-xs text-slate-500">
                  {selectedCell.floor} · {selectedCell.type}
                </p>
              </div>
            </div>
            {selectedCell.status === "booked" && (
              <p className="text-sm text-slate-600">
                This slot is occupied. View the linked reservation for guest details and folio.
              </p>
            )}
            {selectedCell.status === "available" && (
              <p className="text-sm text-slate-600">
                This room is open for the selected date. You can create a new reservation or assign a walk-in guest.
              </p>
            )}
            {selectedCell.status === "blocked" && (
              <p className="text-sm text-slate-600">
                Room is blocked for maintenance or out-of-order. Unblock when ready to sell.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
