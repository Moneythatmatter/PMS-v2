"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BedDouble,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  DoorOpen,
  Layers,
  Lock,
  Sparkles,
} from "lucide-react";
import type { RoomAvailabilityRow } from "@/app/data/frontoffice/modules";
import { floors, roomTypes } from "@/app/data/frontoffice/constants";
import { roomService } from "@/services/front-office";
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

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseIsoDate(value: string): Date {
  return startOfDay(new Date(`${value}T00:00:00`));
}

function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

/** Monday of the week containing `date`. */
function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay(); // 0 Sun … 6 Sat
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

function formatDayName(iso: string): string {
  return parseIsoDate(iso).toLocaleDateString("en-IN", { weekday: "short" });
}

function formatDayLabel(iso: string): string {
  return parseIsoDate(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function formatWeekRange(startIso: string, days: string[]): string {
  if (days.length === 0) return startIso;
  const start = parseIsoDate(days[0]);
  const end = parseIsoDate(days[days.length - 1]);
  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();
  if (sameMonth && sameYear) {
    return `${start.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`;
  }
  return `${formatDayLabel(days[0])} – ${formatDayLabel(days[days.length - 1])}`;
}

function nextDayIso(iso: string): string {
  return toIsoDate(addDays(parseIsoDate(iso), 1));
}

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
    cell: "bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-400 text-white shadow-sm shadow-emerald-200/60 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-md hover:shadow-emerald-200/80",
    dot: "bg-emerald-500",
    legend: "bg-emerald-500 border-emerald-400",
    ring: "ring-emerald-300/60",
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
  { key: "occupancy", label: "Occupancy", icon: BedDouble, gradient: "from-emerald-600 to-emerald-800", bg: "bg-emerald-50" },
  { key: "available", label: "Available Slots", icon: Sparkles, gradient: "from-emerald-500 to-teal-600", bg: "bg-emerald-50" },
  { key: "blocked", label: "Blocked", icon: Lock, gradient: "from-slate-400 to-slate-500", bg: "bg-slate-50" },
] as const;

function rowHasStatus(row: RoomAvailabilityRow, status: DayStatus) {
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
  const router = useRouter();
  const todayIso = toIsoDate(new Date());
  const currentWeekStart = toIsoDate(startOfWeek(new Date()));
  const [weekStart, setWeekStart] = useState(currentWeekStart);
  const [visibleDays, setVisibleDays] = useState<string[]>([]);
  const [rows, setRows] = useState<RoomAvailabilityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomType, setRoomType] = useState("all");
  const [floor, setFloor] = useState("all");
  const [availFilter, setAvailFilter] = useState<AvailabilityFilter>("all");
  const [selectedCell, setSelectedCell] = useState<CellSelection | null>(null);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const weekOffset = Math.round(
    (parseIsoDate(weekStart).getTime() - parseIsoDate(currentWeekStart).getTime()) /
      (7 * 24 * 60 * 60 * 1000),
  );
  const isCurrentWeek = weekOffset === 0;
  const canGoPrev = weekOffset > 0;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await roomService.availability(weekStart);
        if (!cancelled) {
          setRows(data.rows);
          setVisibleDays(data.days?.length ? data.days : []);
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
  }, [weekStart]);

  const handleCreateBooking = () => {
    if (!selectedCell) return;
    if (selectedCell.day < todayIso) return;
    const params = new URLSearchParams({
      room: selectedCell.room,
      roomType: selectedCell.type,
      checkIn: selectedCell.day,
      checkOut: nextDayIso(selectedCell.day),
    });
    setSelectedCell(null);
    router.push(`/frontoffice/reservation/new?${params.toString()}`);
  };

  const handleViewReservation = () => {
    if (!selectedCell) return;
    const params = new URLSearchParams({ room: selectedCell.room });
    setSelectedCell(null);
    router.push(`/frontoffice/reservation/all-bookings?${params.toString()}`);
  };

  const goPrevWeek = () => {
    if (!canGoPrev) return;
    const prev = toIsoDate(addDays(parseIsoDate(weekStart), -7));
    setWeekStart(prev < currentWeekStart ? currentWeekStart : prev);
  };

  const goNextWeek = () => {
    setWeekStart(toIsoDate(addDays(parseIsoDate(weekStart), 7)));
  };

  const goToday = () => {
    setWeekStart(currentWeekStart);
  };

  const onCalendarPick = (value: string) => {
    if (!value) return;
    const monday = toIsoDate(startOfWeek(parseIsoDate(value)));
    setWeekStart(monday < currentWeekStart ? currentWeekStart : monday);
  };

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const typeMatch = roomType === "all" || row.type === roomType;
      const floorMatch = floor === "all" || row.floor === floor;
      const availMatch =
        availFilter === "all" ||
        (availFilter === "vacant" && rowHasStatus(row, "available")) ||
        (availFilter === "occupied" && rowHasStatus(row, "booked"));
      return typeMatch && floorMatch && availMatch;
    });
  }, [rows, roomType, floor, availFilter]);

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
      visibleDays.forEach((d) => {
        const status = row.days[d];
        if (status === "available") available++;
        else if (status === "booked") booked++;
        else blocked++;
      });
    });
    const total = available + booked + blocked;
    const occupancy = total > 0 ? Math.round((booked / total) * 100) : 0;
    return { available, booked, blocked, occupancy, rooms: filtered.length };
  }, [filtered, visibleDays]);

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

  if (loading && rows.length === 0) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }
  if (error && rows.length === 0) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <FOPageHeader
        eyebrow="Front Office"
        title="Room Availability"
        description="Visual tape chart — scan inventory, spot gaps, and plan allocations at a glance."
        badge={
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-2.5">
            <div className="relative flex h-10 w-10 items-center justify-center">
              <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth="3"
                  strokeDasharray={`${stats.occupancy} ${100 - stats.occupancy}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-[10px] font-bold text-emerald-800">
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map(({ key, label, icon: Icon, gradient, bg }) => (
          <div
            key={key}
            className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
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
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700",
                  )}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 lg:border-t-0 lg:pt-0">
            {(Object.entries(statusConfig) as [DayStatus, typeof statusConfig.available][]).map(
              ([key, cfg]) => (
                <div key={key} className="flex items-center gap-2 text-xs text-slate-600">
                  <span className={cn("h-3 w-5 rounded-md border", cfg.legend)} />
                  {cfg.label}
                </div>
              ),
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <CalendarRange className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {formatWeekRange(weekStart, visibleDays)}
              </p>
              <p className="text-[11px] text-slate-400">
                {visibleDays.length > 0
                  ? `${formatDayLabel(visibleDays[0])} – ${formatDayLabel(visibleDays[visibleDays.length - 1])}`
                  : "7-day rolling view"}
                {loading ? " · Updating…" : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="relative flex items-center">
              <CalendarDays className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="date"
                min={currentWeekStart}
                value={weekStart}
                onChange={(e) => onCalendarPick(e.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-white pl-8 pr-2 text-xs font-medium text-slate-700 outline-none transition-colors hover:border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                aria-label="Pick week start date"
              />
            </label>

            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-0.5">
              <button
                type="button"
                onClick={goPrevWeek}
                disabled={!canGoPrev}
                className={cn(
                  "rounded-lg p-2 transition-colors",
                  canGoPrev
                    ? "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                    : "cursor-not-allowed text-slate-200",
                )}
                aria-label="Previous week"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={goToday}
                className={cn(
                  "min-w-[4.5rem] rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  isCurrentWeek
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "text-emerald-700 hover:bg-emerald-50",
                )}
                title={isCurrentWeek ? "Current week" : "Jump back to this week"}
              >
                {isCurrentWeek
                  ? "Today"
                  : `+${weekOffset} week${weekOffset === 1 ? "" : "s"}`}
              </button>
              <button
                type="button"
                onClick={goNextWeek}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
                aria-label="Next week"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
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
                  {visibleDays.map((d) => {
                    const isToday = d === todayIso;
                    const dayName = formatDayName(d);
                    const isWeekend = dayName === "Sat" || dayName === "Sun";
                    return (
                      <th
                        key={d}
                        className={cn(
                          "min-w-[76px] border-b border-slate-100 px-1 py-3 text-center",
                          isToday && "bg-emerald-50/80",
                          isWeekend && !isToday && "bg-slate-50/60",
                        )}
                      >
                        <span
                          className={cn(
                            "block text-[11px] font-semibold",
                            isToday ? "text-emerald-700" : "text-slate-600",
                          )}
                        >
                          {dayName}
                        </span>
                        <span
                          className={cn(
                            "mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
                            isToday
                              ? "bg-emerald-700 text-white"
                              : "text-slate-400",
                          )}
                        >
                          {formatDayLabel(d)}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedByFloor).map(([floorName, floorRows]) => (
                  <Fragment key={floorName}>
                    <tr>
                      <td
                        colSpan={visibleDays.length + 1}
                        className="sticky left-0 bg-slate-50/90 px-4 py-2 backdrop-blur-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-1 w-1 rounded-full bg-emerald-500" />
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            {floorName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            · {floorRows.length} room{floorRows.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </td>
                    </tr>
                    {floorRows.map((row, rowIdx) => (
                      <tr
                        key={row.room}
                        className={cn(
                          "group/row transition-colors hover:bg-emerald-50/30",
                          rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50/30",
                        )}
                      >
                        <td className="sticky left-0 z-10 border-r border-slate-100 bg-inherit px-4 py-2.5 backdrop-blur-sm">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700 transition-colors group-hover/row:bg-emerald-100 group-hover/row:text-emerald-800">
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
                        {visibleDays.map((d) => {
                          const status = (row.days[d] ?? "available") as DayStatus;
                          const cfg = statusConfig[status];
                          const cellKey = `${row.room}-${d}`;
                          const isToday = d === todayIso;
                          const isHovered = hoveredCell === cellKey;

                          return (
                            <td
                              key={d}
                              className={cn(
                                "px-1.5 py-2.5 text-center",
                                isToday && "bg-emerald-50/40",
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
                                aria-label={`Room ${row.room}, ${formatDayLabel(d)}: ${cfg.label}`}
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

        {filtered.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 text-center text-[11px] text-slate-400 sm:px-5">
            Click any cell for details · Past weeks are hidden · Center label shows Today or +N weeks ahead
          </div>
        )}
      </div>

      <Modal
        open={!!selectedCell}
        onClose={() => setSelectedCell(null)}
        title={selectedCell ? `Room ${selectedCell.room}` : ""}
        description={
          selectedCell
            ? `${formatDayName(selectedCell.day)} ${formatDayLabel(selectedCell.day)} · ${selectedCell.type}`
            : undefined
        }
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setSelectedCell(null)}>
              Close
            </Button>
            {selectedCell?.status === "available" && selectedCell.day >= todayIso && (
              <Button
                className="bg-emerald-700 hover:bg-emerald-800"
                onClick={handleCreateBooking}
              >
                Create Booking
              </Button>
            )}
            {selectedCell?.status === "available" && selectedCell.day < todayIso && (
              <Button variant="outline" disabled>
                Past date
              </Button>
            )}
            {selectedCell?.status === "booked" && (
              <Button
                className="bg-emerald-700 hover:bg-emerald-800"
                onClick={handleViewReservation}
              >
                View Reservation
              </Button>
            )}
            {selectedCell?.status === "blocked" && (
              <Button variant="outline" onClick={() => setSelectedCell(null)}>
                Unblock Room
              </Button>
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
                selectedCell.status === "booked" && "border-emerald-200 bg-emerald-50",
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
