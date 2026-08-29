"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Plus,
  Sparkles,
  Wrench,
} from "lucide-react";
import type { RoomAvailabilityRow, RoomDayStatus } from "@/app/data/frontoffice/modules";
import { roomService, type RoomAvailabilityBlock } from "@/services/front-office/rooms";
import { Button } from "@/components/ui/Button";
import {
  EmptyState,
  FOPageHeader,
  Modal,
  SelectInput,
  SearchInput,
} from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";

type DayStatus = RoomDayStatus;
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

/** First day of the month containing `date`. */
function startOfMonth(date: Date): Date {
  const d = startOfDay(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function formatMonthTitle(startIso: string): string {
  return parseIsoDate(startIso).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function formatMonthDay(iso: string): string {
  return String(parseIsoDate(iso).getDate());
}

function compareFloorLabel(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
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

function nextDayIso(iso: string): string {
  return toIsoDate(addDays(parseIsoDate(iso), 1));
}

function formatBlockRange(start: string, end: string): string {
  if (start === end) return formatDayLabel(start);
  return `${formatDayLabel(start)} – ${formatDayLabel(end)}`;
}

function buildBlockHintMap(
  blocks: RoomAvailabilityBlock[],
  gridDays: string[],
): Map<string, string> {
  const hints = new Map<string, string>();
  for (const block of blocks) {
    const roomNo = String(block.roomNo ?? "").trim();
    if (!roomNo) continue;
    const label =
      block.kind === "maintenance" ? "Maintenance" : "Blocked";
    const reason = block.reason?.trim();
    const range = formatBlockRange(block.startDate, block.endDate);
    const text = reason ? `${label}: ${reason} (${range})` : `${label} (${range})`;

    for (const day of gridDays) {
      if (day >= block.startDate && day <= block.endDate) {
        hints.set(`${roomNo}-${day}`, text);
      }
    }
  }
  return hints;
}

function isBookableStatus(status: DayStatus, day: string, today: string): boolean {
  return (status === "available" || status === "dirty") && day >= today;
}

function normalizeDateRange(
  startDay: string,
  endDay: string,
  gridDays: string[],
): { checkIn: string; checkOut: string; days: string[] } {
  const start = startDay <= endDay ? startDay : endDay;
  const end = startDay <= endDay ? endDay : startDay;
  const days = gridDays.filter((d) => d >= start && d <= end);
  return {
    checkIn: start,
    checkOut: nextDayIso(end),
    days,
  };
}

function isDayInRange(day: string, startDay: string, endDay: string): boolean {
  const start = startDay <= endDay ? startDay : endDay;
  const end = startDay <= endDay ? endDay : startDay;
  return day >= start && day <= end;
}

const statusConfig: Record<
  DayStatus,
  {
    label: string;
    description: string;
    cell: string;
    dot: string;
    legend: string;
    ring: string;
  }
> = {
  available: {
    label: "Vacant",
    description: "Open for booking",
    cell: "bg-emerald-50 border-emerald-200/80 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 hover:shadow-sm",
    dot: "bg-emerald-500",
    legend: "bg-emerald-100 border-emerald-300",
    ring: "ring-emerald-300/50",
  },
  reserved: {
    label: "Reserved",
    description: "Future booking on calendar",
    cell: "bg-sky-100 border-sky-300 text-sky-800 hover:bg-sky-200 hover:border-sky-400 hover:shadow-sm",
    dot: "bg-sky-500",
    legend: "bg-sky-100 border-sky-400",
    ring: "ring-sky-300/60",
  },
  occupied: {
    label: "Occupied",
    description: "Checked-in guest in room",
    cell: "bg-gradient-to-br from-violet-500 to-violet-600 border-violet-400 text-white shadow-sm shadow-violet-200/60 hover:from-violet-600 hover:to-violet-700",
    dot: "bg-violet-500",
    legend: "bg-violet-500 border-violet-400",
    ring: "ring-violet-300/60",
  },
  dirty: {
    label: "Dirty",
    description: "Needs housekeeping — still sellable",
    cell: "bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 hover:border-amber-400 hover:shadow-sm",
    dot: "bg-amber-500",
    legend: "bg-amber-100 border-amber-400",
    ring: "ring-amber-300/50",
  },
  maintenance: {
    label: "Maintenance",
    description: "Out of order / under repair",
    cell: "bg-orange-50 border-orange-300 text-orange-800 hover:bg-orange-100 hover:border-orange-400",
    dot: "bg-orange-500",
    legend: "bg-orange-100 border-orange-400",
    ring: "ring-orange-300/50",
  },
  blocked: {
    label: "Blocked",
    description: "Not available for sale",
    cell: "bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200/80",
    dot: "bg-slate-400",
    legend: "bg-slate-200 border-slate-400",
    ring: "ring-slate-300/50",
  },
};

const LEGEND_ORDER: DayStatus[] = [
  "available",
  "reserved",
  "occupied",
  "dirty",
  "maintenance",
  "blocked",
];

const statCards = [
  { key: "rooms", label: "Rooms Shown", icon: DoorOpen, gradient: "from-slate-500 to-slate-700", bg: "bg-slate-50" },
  { key: "occupancy", label: "Occupancy", icon: BedDouble, gradient: "from-emerald-600 to-emerald-800", bg: "bg-emerald-50" },
  { key: "available", label: "Available Slots", icon: Sparkles, gradient: "from-emerald-500 to-teal-600", bg: "bg-emerald-50" },
  { key: "blocked", label: "Blocked", icon: Lock, gradient: "from-slate-400 to-slate-500", bg: "bg-slate-50" },
] as const;

function rowHasStatus(row: RoomAvailabilityRow, status: DayStatus) {
  return Object.values(row.days).some((d) => d === status);
}

function rowHasBooking(row: RoomAvailabilityRow) {
  return Object.values(row.days).some(
    (d) => d === "reserved" || d === "occupied",
  );
}

interface DetailCell {
  room: string;
  day: string;
  status: DayStatus;
  type: string;
  floor: string;
}

interface BookingDraft {
  room: string;
  type: string;
  floor: string;
  bedType?: string;
  checkIn: string;
  checkOut: string;
  days: string[];
}

export function RoomAvailabilityView() {
  const router = useRouter();
  const todayIso = toIsoDate(new Date());
  const currentMonthStart = toIsoDate(startOfMonth(new Date()));
  const [monthStart, setMonthStart] = useState(currentMonthStart);
  const [visibleDays, setVisibleDays] = useState<string[]>([]);
  const [rows, setRows] = useState<RoomAvailabilityRow[]>([]);
  const [availabilityBlocks, setAvailabilityBlocks] = useState<RoomAvailabilityBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomType, setRoomType] = useState("all");
  const [floor, setFloor] = useState("all");
  const [search, setSearch] = useState("");
  const [availFilter, setAvailFilter] = useState<AvailabilityFilter>("all");
  const [detailCell, setDetailCell] = useState<DetailCell | null>(null);
  const [bookingDraft, setBookingDraft] = useState<BookingDraft | null>(null);
  const [dragState, setDragState] = useState<{
    room: string;
    type: string;
    floor: string;
    bedType?: string;
    startDay: string;
    endDay: string;
  } | null>(null);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const isDraggingRef = useRef(false);

  const isCurrentMonth = monthStart === currentMonthStart;

  const gridDays = useMemo(() => {
    if (!isCurrentMonth) return visibleDays;
    return visibleDays.filter((d) => d >= todayIso);
  }, [visibleDays, isCurrentMonth, todayIso]);

  const blockHints = useMemo(
    () => buildBlockHintMap(availabilityBlocks, gridDays),
    [availabilityBlocks, gridDays],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await roomService.availability(monthStart);
        if (!cancelled) {
          setRows(data.rows);
          setVisibleDays(data.days?.length ? data.days : []);
          setAvailabilityBlocks(data.blocks ?? []);
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
  }, [monthStart]);

  const openBookingDraft = useCallback(
    (draft: BookingDraft) => {
      setDetailCell(null);
      setBookingDraft(draft);
    },
    [],
  );

  const finalizeDragSelection = useCallback(
    (state: NonNullable<typeof dragState>) => {
      const row = rows.find((r) => r.room === state.room);
      if (!row) return;

      const range = normalizeDateRange(state.startDay, state.endDay, gridDays);
      if (range.days.length === 0) return;

      openBookingDraft({
        room: state.room,
        type: state.type,
        floor: state.floor,
        bedType: row.bedType,
        checkIn: range.checkIn,
        checkOut: range.checkOut,
        days: range.days,
      });
    },
    [rows, gridDays, todayIso, openBookingDraft],
  );

  useEffect(() => {
    const onMouseUp = () => {
      if (!isDraggingRef.current || !dragState) return;
      finalizeDragSelection(dragState);
      setDragState(null);
      isDraggingRef.current = false;
    };
    window.addEventListener("mouseup", onMouseUp);
    return () => window.removeEventListener("mouseup", onMouseUp);
  }, [dragState, finalizeDragSelection]);

  const handleCellMouseDown = (
    row: RoomAvailabilityRow,
    day: string,
    status: DayStatus,
  ) => {
    if (isBookableStatus(status, day, todayIso)) {
      isDraggingRef.current = true;
      setDragState({
        room: row.room,
        type: row.type,
        floor: row.floor,
        bedType: row.bedType,
        startDay: day,
        endDay: day,
      });
      return;
    }
    setBookingDraft(null);
    setDetailCell({
      room: row.room,
      day,
      status,
      type: row.type,
      floor: row.floor,
    });
  };

  const handleCellMouseEnter = (row: RoomAvailabilityRow, day: string) => {
    setHoveredCell(`${row.room}-${day}`);
    if (!isDraggingRef.current || !dragState || dragState.room !== row.room) return;
    setDragState((prev) => (prev ? { ...prev, endDay: day } : null));
  };

  const handleRoomLabelClick = (row: RoomAvailabilityRow) => {
    const firstBookable = gridDays.find((d) =>
      isBookableStatus((row.days[d] ?? "available") as DayStatus, d, todayIso),
    );
    if (!firstBookable) {
      setDetailCell({
        room: row.room,
        day: gridDays[0] ?? todayIso,
        status: (row.days[gridDays[0] ?? ""] ?? "blocked") as DayStatus,
        type: row.type,
        floor: row.floor,
      });
      return;
    }
    openBookingDraft({
      room: row.room,
      type: row.type,
      floor: row.floor,
      bedType: row.bedType,
      checkIn: firstBookable,
      checkOut: nextDayIso(firstBookable),
      days: [firstBookable],
    });
  };

  const handleConfirmBooking = () => {
    if (!bookingDraft || bookingConflict) return;
    const params = new URLSearchParams({
      room: bookingDraft.room,
      roomType: bookingDraft.type,
      checkIn: bookingDraft.checkIn,
      checkOut: bookingDraft.checkOut,
    });
    setBookingDraft(null);
    router.push(`/frontoffice/reservation/new?${params.toString()}`);
  };

  const handleViewReservation = () => {
    if (!detailCell) return;
    const params = new URLSearchParams({ room: detailCell.room });
    setDetailCell(null);
    router.push(`/frontoffice/reservation/all-bookings?${params.toString()}`);
  };

  const bookingConflict = useMemo(() => {
    if (!bookingDraft) return null;
    const row = rows.find((r) => r.room === bookingDraft.room);
    if (!row) return null;
    const bad = bookingDraft.days.filter(
      (d) => !isBookableStatus((row.days[d] ?? "available") as DayStatus, d, todayIso),
    );
    if (bad.length === 0) return null;
    return `${bad.length} night${bad.length !== 1 ? "s" : ""} in your selection ${
      bad.length !== 1 ? "are" : "is"
    } not available. Drag only vacant or dirty dates.`;
  }, [bookingDraft, rows, todayIso]);

  const bookingNights = bookingDraft?.days.length ?? 0;

  const goPrevMonth = () => {
    const d = parseIsoDate(monthStart);
    setMonthStart(toIsoDate(new Date(d.getFullYear(), d.getMonth() - 1, 1)));
  };

  const goNextMonth = () => {
    const d = parseIsoDate(monthStart);
    setMonthStart(toIsoDate(new Date(d.getFullYear(), d.getMonth() + 1, 1)));
  };

  const goToday = () => {
    setMonthStart(currentMonthStart);
  };

  const onCalendarPick = (value: string) => {
    if (!value) return;
    setMonthStart(toIsoDate(startOfMonth(parseIsoDate(value))));
  };

  const floorOptions = useMemo(() => {
    const values = new Set(rows.map((r) => r.floor).filter(Boolean));
    return [...values].sort(compareFloorLabel);
  }, [rows]);

  const roomTypeOptions = useMemo(() => {
    const values = new Set(rows.map((r) => r.type).filter(Boolean));
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      const typeMatch = roomType === "all" || row.type === roomType;
      const floorMatch = floor === "all" || row.floor === floor;
      const availMatch =
        availFilter === "all" ||
        (availFilter === "vacant" && rowHasStatus(row, "available")) ||
        (availFilter === "occupied" && rowHasBooking(row));
      const searchMatch =
        !q ||
        [row.room, row.floor, row.type, row.bedType]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(q));
      return typeMatch && floorMatch && availMatch && searchMatch;
    });
  }, [rows, roomType, floor, availFilter, search]);

  const groupedByFloor = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach((row) => {
      if (!groups[row.floor]) groups[row.floor] = [];
      groups[row.floor].push(row);
    });
    return Object.keys(groups)
      .sort(compareFloorLabel)
      .map((floorName) => [floorName, groups[floorName]] as const);
  }, [filtered]);

  const stats = useMemo(() => {
    let available = 0;
    let reserved = 0;
    let occupied = 0;
    let dirty = 0;
    let maintenance = 0;
    let blocked = 0;
    filtered.forEach((row) => {
      gridDays.forEach((d) => {
        const status = row.days[d];
        if (status === "available") available++;
        else if (status === "reserved") reserved++;
        else if (status === "occupied") occupied++;
        else if (status === "dirty") dirty++;
        else if (status === "maintenance") maintenance++;
        else blocked++;
      });
    });
    const booked = reserved + occupied;
    const total = available + booked + dirty + maintenance + blocked;
    const occupancy = total > 0 ? Math.round((booked / total) * 100) : 0;
    return {
      available,
      booked,
      blocked: blocked + maintenance,
      occupancy,
      rooms: filtered.length,
    };
  }, [filtered, gridDays]);

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
        description="Monthly tape chart — reservations and dated maintenance blocks affect availability; dirty rooms show today only and remain sellable."
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
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search room, floor, type, bed…"
              className="min-w-[200px] flex-1 sm:max-w-xs"
            />
            <div className="relative">
              <Layers className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <SelectInput
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="h-10 w-full rounded-xl border-slate-200 pl-9 sm:w-44"
              >
                <option value="all">All Room Types</option>
                {roomTypeOptions.map((t) => (
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
                {floorOptions.map((f) => (
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

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3">
            {LEGEND_ORDER.map((key) => {
              const cfg = statusConfig[key];
              return (
                <div key={key} className="flex items-center gap-2 text-xs text-slate-600">
                  <span className={cn("h-3.5 w-5 shrink-0 rounded-md border", cfg.legend)} />
                  <span className="font-medium text-slate-700">{cfg.label}</span>
                </div>
              );
            })}
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
                {formatMonthTitle(monthStart)}
              </p>
              <p className="text-[11px] text-slate-400">
                {gridDays.length > 0
                  ? isCurrentMonth
                    ? `From today · ${formatDayLabel(gridDays[0])} – ${formatDayLabel(gridDays[gridDays.length - 1])}`
                    : `${gridDays.length}-day month view · ${formatDayLabel(gridDays[0])} – ${formatDayLabel(gridDays[gridDays.length - 1])}`
                  : "Monthly calendar view"}
                {loading ? " · Updating…" : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="relative flex items-center">
              <CalendarDays className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="month"
                value={monthStart.slice(0, 7)}
                onChange={(e) => {
                  if (!e.target.value) return;
                  onCalendarPick(`${e.target.value}-01`);
                }}
                className="h-9 rounded-xl border border-slate-200 bg-white pl-8 pr-2 text-xs font-medium text-slate-700 outline-none transition-colors hover:border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                aria-label="Pick month"
              />
            </label>

            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-0.5">
              <button
                type="button"
                onClick={goPrevMonth}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={goToday}
                className={cn(
                  "min-w-[4.5rem] rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  isCurrentMonth
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "text-emerald-700 hover:bg-emerald-50",
                )}
                title={isCurrentMonth ? "Current month" : "Jump to this month"}
              >
                {isCurrentMonth ? "Today" : "This month"}
              </button>
              <button
                type="button"
                onClick={goNextMonth}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
                aria-label="Next month"
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
          <div className="overflow-x-auto select-none">
            <table className="w-full min-w-[960px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 min-w-[120px] border-b border-r border-slate-100 bg-slate-50/95 px-4 py-3 text-left backdrop-blur-sm">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                      Room
                    </span>
                  </th>
                  {gridDays.map((d) => {
                    const isToday = d === todayIso;
                    const dayName = formatDayName(d);
                    const isWeekend = dayName === "Sat" || dayName === "Sun";
                    return (
                      <th
                        key={d}
                        className={cn(
                          "min-w-[34px] border-b border-slate-100 px-0.5 py-2 text-center",
                          isToday && "bg-emerald-50/80",
                          isWeekend && !isToday && "bg-slate-50/60",
                        )}
                      >
                        <span
                          className={cn(
                            "block text-[9px] font-medium uppercase",
                            isToday ? "text-emerald-700" : "text-slate-400",
                          )}
                        >
                          {dayName.slice(0, 1)}
                        </span>
                        <span
                          className={cn(
                            "mt-0.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full text-[10px] font-semibold",
                            isToday
                              ? "bg-emerald-700 text-white"
                              : "text-slate-600",
                          )}
                        >
                          {formatMonthDay(d)}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {groupedByFloor.map(([floorName, floorRows]) => (
                  <Fragment key={floorName}>
                    <tr>
                      <td
                        colSpan={gridDays.length + 1}
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
                          <button
                            type="button"
                            onClick={() => handleRoomLabelClick(row)}
                            className="flex w-full items-center gap-2.5 rounded-lg text-left transition-colors hover:bg-emerald-50/80"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700 transition-colors group-hover/row:bg-emerald-100 group-hover/row:text-emerald-800">
                              {row.room}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium text-slate-700">
                                {row.type}
                              </p>
                              <p className="truncate text-[10px] text-slate-400">
                                {row.floor}
                                {row.bedType ? ` · ${row.bedType}` : ""}
                              </p>
                            </div>
                          </button>
                        </td>
                        {gridDays.map((d) => {
                          const status = (row.days[d] ?? "available") as DayStatus;
                          const cfg = statusConfig[status];
                          const cellKey = `${row.room}-${d}`;
                          const isToday = d === todayIso;
                          const isHovered = hoveredCell === cellKey;
                          const blockHint = blockHints.get(cellKey);
                          const dirtyHint =
                            status === "dirty" && isToday
                              ? "Dirty today — still available to book"
                              : undefined;
                          const cellTitle = blockHint ?? dirtyHint ?? cfg.description;
                          const inDragPreview =
                            dragState?.room === row.room &&
                            isDayInRange(d, dragState.startDay, dragState.endDay);
                          const inBookingPreview =
                            bookingDraft?.room === row.room &&
                            bookingDraft.days.includes(d);

                          return (
                            <td
                              key={d}
                              className={cn(
                                "px-0.5 py-2 text-center",
                                isToday && "bg-emerald-50/40",
                              )}
                            >
                              <button
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleCellMouseDown(row, d, status);
                                }}
                                onMouseEnter={() => handleCellMouseEnter(row, d)}
                                title={cellTitle}
                                aria-label={`Room ${row.room}, ${formatDayLabel(d)}: ${cfg.label}`}
                                className={cn(
                                  "relative mx-auto flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border transition-all duration-150",
                                  cfg.cell,
                                  isHovered && !inDragPreview && "scale-105 ring-2",
                                  isHovered && !inDragPreview && cfg.ring,
                                  inDragPreview &&
                                    "z-10 scale-105 bg-emerald-200/90 ring-2 ring-emerald-500 ring-offset-1",
                                  inBookingPreview &&
                                    !inDragPreview &&
                                    "ring-2 ring-emerald-600 ring-offset-1",
                                )}
                              >
                                {status === "occupied" && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-white/90 shadow-sm" />
                                )}
                                {status === "reserved" && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-sky-600/80" />
                                )}
                                {status === "maintenance" && (
                                  <Wrench className="h-2.5 w-2.5 opacity-70" />
                                )}
                                {status === "blocked" && (
                                  <Lock className="h-2.5 w-2.5 opacity-60" />
                                )}
                                {status === "dirty" && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-600/70" />
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
            Click or drag across vacant or dirty (today) dates to create a booking · maintenance/blocked cells show dated holds
          </div>
        )}
      </div>

      <Modal
        open={!!bookingDraft}
        onClose={() => setBookingDraft(null)}
        title={bookingDraft ? `Create Booking · Room ${bookingDraft.room}` : ""}
        description={
          bookingDraft
            ? `${bookingDraft.type} · ${bookingDraft.floor}`
            : undefined
        }
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setBookingDraft(null)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-700 hover:bg-emerald-800"
              onClick={handleConfirmBooking}
              disabled={!!bookingConflict || bookingNights === 0}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Continue to Reservation
            </Button>
          </>
        }
      >
        {bookingDraft && (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">
                Selected stay
              </p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {formatDayLabel(bookingDraft.checkIn)} →{" "}
                {formatDayLabel(bookingDraft.checkOut)}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {bookingNights} night{bookingNights !== 1 ? "s" : ""} · Room{" "}
                {bookingDraft.room}
                {bookingDraft.bedType ? ` · ${bookingDraft.bedType} bed` : ""}
              </p>
            </div>

            {bookingNights > 1 && (
              <div className="flex flex-wrap gap-1.5">
                {bookingDraft.days.map((d) => (
                  <span
                    key={d}
                    className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800"
                  >
                    {formatDayLabel(d)}
                  </span>
                ))}
              </div>
            )}

            {bookingConflict ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                {bookingConflict}
              </p>
            ) : (
              <p className="text-sm text-slate-600">
                Drag on the grid to adjust dates, then continue to complete guest
                details on the reservation form.
              </p>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={!!detailCell}
        onClose={() => setDetailCell(null)}
        title={detailCell ? `Room ${detailCell.room}` : ""}
        description={
          detailCell
            ? `${formatDayName(detailCell.day)} ${formatDayLabel(detailCell.day)} · ${detailCell.type}`
            : undefined
        }
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDetailCell(null)}>
              Close
            </Button>
            {(detailCell?.status === "reserved" ||
              detailCell?.status === "occupied") && (
              <Button
                className="bg-emerald-700 hover:bg-emerald-800"
                onClick={handleViewReservation}
              >
                View Reservation
              </Button>
            )}
            {(detailCell?.status === "blocked" ||
              detailCell?.status === "maintenance") && (
              <Button variant="outline" onClick={() => setDetailCell(null)}>
                Close
              </Button>
            )}
          </>
        }
      >
        {detailCell && (
          <div className="space-y-4">
            <div
              className={cn(
                "flex items-center gap-3 rounded-xl border p-4",
                detailCell.status === "available" && "border-emerald-200 bg-emerald-50",
                detailCell.status === "reserved" && "border-sky-200 bg-sky-50",
                detailCell.status === "occupied" && "border-violet-200 bg-violet-50",
                detailCell.status === "dirty" && "border-amber-200 bg-amber-50",
                detailCell.status === "maintenance" && "border-orange-200 bg-orange-50",
                detailCell.status === "blocked" && "border-slate-200 bg-slate-50",
              )}
            >
              <span
                className={cn(
                  "h-3 w-3 rounded-full",
                  statusConfig[detailCell.status].dot,
                )}
              />
              <div>
                <p className="font-semibold text-slate-900">
                  {statusConfig[detailCell.status].label}
                </p>
                <p className="text-xs text-slate-500">
                  {detailCell.floor} · {detailCell.type}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              {blockHints.get(`${detailCell.room}-${detailCell.day}`) ??
                statusConfig[detailCell.status].description}
            </p>
            {(detailCell.status === "reserved" ||
              detailCell.status === "occupied") && (
              <p className="text-sm text-slate-600">
                View the linked reservation for guest details and folio.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
