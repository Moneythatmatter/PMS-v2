"use client";

import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BedDouble,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  DoorOpen,
  Info,
  Layers,
  Lock,
  SlidersHorizontal,
  Users,
  Wrench,
} from "lucide-react";
import type {
  RoomAvailabilityRow,
  RoomDayBooking,
  RoomDayStatus,
} from "@/app/data/frontoffice/modules";
import { roomService, type RoomAvailabilityBlock } from "@/services/front-office/rooms";
import { Button } from "@/components/ui/Button";
import {
  EmptyState,
  Modal,
  SelectInput,
  SearchInput,
} from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";
import { ReservationQuickView } from "@/components/frontoffice/reservation/ReservationQuickView";
import {
  QuickReservationModal,
  type QuickReservationDraft,
} from "@/components/frontoffice/reservation/QuickReservationModal";

type DayStatus = RoomDayStatus;
/** Days shown before today when the chart opens. */
const LOOKBACK_DAYS = 0;
const WINDOW_OPTIONS = [14, 31] as const;
type WindowSize = (typeof WINDOW_OPTIONS)[number];

const LABEL_W = 156;
const LABEL_W_PHONE = 76;
const ROW_H = 28;

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

function shiftIso(iso: string, n: number): string {
  return toIsoDate(addDays(parseIsoDate(iso), n));
}

function monthStartIso(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

function compareFloorLabel(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function matchesBaseRoomFilters(
  row: RoomAvailabilityRow,
  filters: {
    roomType: string;
    floor: string;
    bedType: string;
    maxOccupancy: string;
    search: string;
  },
): boolean {
  const q = filters.search.trim().toLowerCase();
  const typeMatch = filters.roomType === "all" || row.type === filters.roomType;
  const floorMatch = filters.floor === "all" || row.floor === filters.floor;
  const bedMatch =
    filters.bedType === "all" ||
    String(row.bedType ?? "").toLowerCase() === filters.bedType.toLowerCase();
  const occMatch =
    filters.maxOccupancy === "all" ||
    String(row.maxOccupancy ?? "") === filters.maxOccupancy;
  const searchMatch =
    !q ||
    [
      row.room,
      row.floor,
      row.type,
      row.bedType,
      row.maxOccupancy != null ? String(row.maxOccupancy) : "",
      ...Object.values(row.bookings ?? {}).flatMap((b) => [b.guestName, b.bookingNo]),
    ]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(q));
  return typeMatch && floorMatch && bedMatch && occMatch && searchMatch;
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

function formatRangeTitle(start: string, end: string): string {
  const fmt = (iso: string) =>
    parseIsoDate(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit" });
  return `${fmt(start)} - ${fmt(end)}, ${end.slice(0, 4)}`;
}

function nextDayIso(iso: string): string {
  return shiftIso(iso, 1);
}

function stayDays(checkIn: string, checkOut: string): string[] {
  const days: string[] = [];
  for (let d = checkIn; d < checkOut && days.length < 366; d = nextDayIso(d)) days.push(d);
  return days;
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
    const label = block.kind === "maintenance" ? "Maintenance" : "Blocked";
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

const statusConfig: Record<DayStatus, { label: string; description: string; dot: string }> = {
  available: { label: "Vacant", description: "Open for booking", dot: "bg-emerald-600" },
  reserved: { label: "Reserved", description: "Future booking on calendar", dot: "bg-sky-600" },
  occupied: { label: "In-House", description: "Checked-in guest in room", dot: "bg-emerald-700" },
  dirty: { label: "Dirty", description: "Needs housekeeping — still sellable", dot: "bg-rose-500" },
  maintenance: { label: "Maintenance", description: "Out of order / under repair", dot: "bg-orange-500" },
  blocked: { label: "Blocked", description: "Not available for sale", dot: "bg-slate-500" },
};

/** Room label tints, assigned per room type in display order. */
const TYPE_TONES = [
  "bg-lime-200/90 text-lime-950",
  "bg-sky-200/90 text-sky-950",
  "bg-violet-200/90 text-violet-950",
  "bg-amber-200/90 text-amber-950",
  "bg-teal-200/90 text-teal-950",
  "bg-fuchsia-200/90 text-fuchsia-950",
  "bg-orange-200/90 text-orange-950",
  "bg-indigo-200/90 text-indigo-950",
];

const HATCH = "repeating-linear-gradient(135deg, rgba(255,255,255,0.35) 0 4px, transparent 4px 8px)";

interface BarSegment {
  key: string;
  status: DayStatus;
  startIdx: number;
  endIdx: number;
  /** Stay begins inside the window: bar starts at the middle of the first night. */
  startsInside: boolean;
  /** Bar ends at the middle of the day after the last night. */
  endsInside: boolean;
  booking?: RoomDayBooking;
}

function buildSegments(row: RoomAvailabilityRow, days: string[]): BarSegment[] {
  const out: BarSegment[] = [];
  let i = 0;
  while (i < days.length) {
    const day = days[i];
    const status = row.days[day];
    const booking = row.bookings?.[day];
    if (booking && (status === "reserved" || status === "occupied")) {
      let j = i;
      while (j + 1 < days.length && row.bookings?.[days[j + 1]]?.id === booking.id) j++;
      out.push({
        key: `${booking.id}-${i}`,
        status,
        startIdx: i,
        endIdx: j,
        startsInside: i > 0 || booking.checkIn >= day,
        endsInside: true,
        booking,
      });
      i = j + 1;
      continue;
    }
    if (status === "blocked" || status === "maintenance") {
      let j = i;
      while (j + 1 < days.length && row.days[days[j + 1]] === status) j++;
      out.push({ key: `${status}-${i}`, status, startIdx: i, endIdx: j, startsInside: false, endsInside: false });
      i = j + 1;
      continue;
    }
    i++;
  }
  return out;
}

function bookingLabel(b: RoomDayBooking): string {
  return `${b.bookingNo ? `${b.bookingNo}. ` : ""}${b.guestName ?? "Guest"}`;
}

interface DetailCell {
  room: string;
  day: string;
  status: DayStatus;
  type: string;
  floor: string;
  booking?: RoomDayBooking;
}

type BookingDraft = QuickReservationDraft;

export function RoomAvailabilityView() {
  const router = useRouter();
  const todayIso = toIsoDate(new Date());
  const defaultStart = shiftIso(todayIso, -LOOKBACK_DAYS);
  const [windowStart, setWindowStart] = useState(defaultStart);
  const [windowSize, setWindowSize] = useState<WindowSize>(31);
  /** Calendar month ("YYYY-MM") picked from the month selector; overrides the rolling window. */
  const [calendarMonth, setCalendarMonth] = useState<string | null>(null);
  const [rows, setRows] = useState<RoomAvailabilityRow[]>([]);
  const [availabilityBlocks, setAvailabilityBlocks] = useState<RoomAvailabilityBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomType, setRoomType] = useState("all");
  const [floor, setFloor] = useState("all");
  const [bedType, setBedType] = useState("all");
  const [maxOccupancy, setMaxOccupancy] = useState("all");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = [roomType, floor, bedType, maxOccupancy].filter((v) => v !== "all").length;
  const clearFilters = () => {
    setRoomType("all");
    setFloor("all");
    setBedType("all");
    setMaxOccupancy("all");
  };
  const [detailCell, setDetailCell] = useState<DetailCell | null>(null);
  const [quickViewBookingId, setQuickViewBookingId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [bookingDraft, setBookingDraft] = useState<BookingDraft | null>(null);
  /** Availability for months outside the visible grid, fetched when a draft's dates reach them (null = failed). */
  const [extraAvailability, setExtraAvailability] = useState<Record<string, RoomAvailabilityRow[] | null>>({});
  const [dragState, setDragState] = useState<{
    room: string;
    type: string;
    floor: string;
    bedType?: string;
    startDay: string;
    endDay: string;
  } | null>(null);
  const isDraggingRef = useRef(false);

  const gridDays = useMemo(
    () => {
      if (calendarMonth) {
        const [y, m] = calendarMonth.split("-").map(Number);
        const count = new Date(y, m, 0).getDate();
        return Array.from({ length: count }, (_, i) => shiftIso(`${calendarMonth}-01`, i));
      }
      return Array.from({ length: windowSize }, (_, i) => shiftIso(windowStart, i));
    },
    [calendarMonth, windowStart, windowSize],
  );
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);
  const [scrollW, setScrollW] = useState(0);
  useEffect(() => {
    if (!scrollEl) return;
    const observer = new ResizeObserver(([entry]) => setScrollW(entry.contentRect.width));
    observer.observe(scrollEl);
    return () => observer.disconnect();
  }, [scrollEl]);
  const isPhone = scrollW > 0 && scrollW < 640;
  const labelW = isPhone ? LABEL_W_PHONE : LABEL_W;
  const minCellW = isPhone ? 40 : gridDays.length <= 14 ? 56 : 32;
  const cellW = Math.max(minCellW, Math.floor(((scrollW - labelW) / gridDays.length) * 10) / 10 || 0);
  const gridWidth = gridDays.length * cellW;

  const blockHints = useMemo(
    () => buildBlockHintMap(availabilityBlocks, gridDays),
    [availabilityBlocks, gridDays],
  );

  const monthsKey = useMemo(() => {
    const first = monthStartIso(gridDays[0]);
    const last = monthStartIso(gridDays[gridDays.length - 1]);
    return first === last ? first : `${first}|${last}`;
  }, [gridDays]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const responses = await Promise.all(monthsKey.split("|").map((m) => roomService.availability(m)));
        if (cancelled) return;
        const byRoom = new Map<string, RoomAvailabilityRow>();
        for (const res of responses) {
          for (const row of res.rows) {
            const existing = byRoom.get(row.room);
            if (!existing) {
              byRoom.set(row.room, { ...row, days: { ...row.days }, bookings: { ...(row.bookings ?? {}) } });
            } else {
              Object.assign(existing.days, row.days);
              existing.bookings = { ...(existing.bookings ?? {}), ...(row.bookings ?? {}) };
            }
          }
        }
        setRows([...byRoom.values()]);
        setAvailabilityBlocks(responses.flatMap((r) => r.blocks ?? []));
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [monthsKey, reloadKey]);

  const openBookingDraft = (draft: BookingDraft) => {
    setDetailCell(null);
    setBookingDraft(draft);
  };

  useEffect(() => {
    const onMouseUp = () => {
      if (!isDraggingRef.current || !dragState) return;
      isDraggingRef.current = false;
      setDragState(null);
      const row = rows.find((r) => r.room === dragState.room);
      const range = normalizeDateRange(dragState.startDay, dragState.endDay, gridDays);
      if (!row || range.days.length === 0) return;
      setDetailCell(null);
      setBookingDraft({
        room: dragState.room,
        type: dragState.type,
        floor: dragState.floor,
        bedType: row.bedType,
        maxOccupancy: row.maxOccupancy,
        checkIn: range.checkIn,
        checkOut: range.checkOut,
        days: range.days,
      });
    };
    window.addEventListener("mouseup", onMouseUp);
    return () => window.removeEventListener("mouseup", onMouseUp);
  }, [dragState, rows, gridDays]);

  const showDetail = (row: RoomAvailabilityRow, day: string, status: DayStatus) => {
    setBookingDraft(null);
    const booking = row.bookings?.[day];
    if (booking && (status === "reserved" || status === "occupied")) {
      setDetailCell(null);
      setQuickViewBookingId(booking.id);
      return;
    }
    setDetailCell({
      room: row.room,
      day,
      status,
      type: row.type,
      floor: row.floor,
      booking: row.bookings?.[day],
    });
  };

  const handleCellMouseDown = (row: RoomAvailabilityRow, day: string, status: DayStatus) => {
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
    showDetail(row, day, status);
  };

  const handleCellMouseEnter = (row: RoomAvailabilityRow, day: string) => {
    if (!isDraggingRef.current || !dragState || dragState.room !== row.room) return;
    setDragState((prev) => (prev ? { ...prev, endDay: day } : null));
  };

  const handleRoomLabelClick = (row: RoomAvailabilityRow) => {
    const firstBookable = gridDays.find((d) =>
      isBookableStatus((row.days[d] ?? "available") as DayStatus, d, todayIso),
    );
    if (!firstBookable) {
      const day = gridDays.find((d) => d >= todayIso) ?? gridDays[0];
      showDetail(row, day, (row.days[day] ?? "blocked") as DayStatus);
      return;
    }
    openBookingDraft({
      room: row.room,
      type: row.type,
      floor: row.floor,
      bedType: row.bedType,
      maxOccupancy: row.maxOccupancy,
      checkIn: firstBookable,
      checkOut: nextDayIso(firstBookable),
      days: [firstBookable],
    });
  };

  const loadedMonths = monthsKey.split("|");
  const missingDraftMonths = bookingDraft
    ? [...new Set(bookingDraft.days.map(monthStartIso))].filter(
        (m) => !loadedMonths.includes(m) && !(m in extraAvailability),
      )
    : [];
  const missingDraftKey = missingDraftMonths.join("|");

  useEffect(() => {
    if (!missingDraftKey) return;
    let cancelled = false;
    const months = missingDraftKey.split("|");
    Promise.all(months.map((m) => roomService.availability(m).then((res) => [m, res.rows] as const)))
      .then((entries) => {
        if (!cancelled) setExtraAvailability((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
      })
      .catch(() => {
        if (!cancelled) {
          setExtraAvailability((prev) => ({ ...prev, ...Object.fromEntries(months.map((m) => [m, null])) }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [missingDraftKey]);

  const draftDayStatus = (room: string, day: string): DayStatus | null => {
    const month = monthStartIso(day);
    const source = loadedMonths.includes(month) ? rows : extraAvailability[month];
    if (!source) return null;
    return (source.find((r) => r.room === room)?.days[day] ?? "available") as DayStatus;
  };
  const isDraftDayBookable = (room: string, day: string) => {
    const status = draftDayStatus(room, day);
    return status !== null && isBookableStatus(status, day, todayIso);
  };

  const draftAvailabilityNote = !bookingDraft
    ? null
    : missingDraftKey
      ? "Checking availability for the selected dates…"
      : bookingDraft.days.some((d) => extraAvailability[monthStartIso(d)] === null)
        ? "Could not check availability for these dates. Try different dates."
        : null;

  const bookingConflict = (() => {
    if (!bookingDraft || draftAvailabilityNote) return null;
    const bad = bookingDraft.days.filter((d) => !isDraftDayBookable(bookingDraft.room, d));
    if (bad.length === 0) return null;
    return `${bad.length} night${bad.length !== 1 ? "s" : ""} in your selection ${
      bad.length !== 1 ? "are" : "is"
    } not available. Choose vacant or dirty dates only.`;
  })();

  const draftRoomOptions = (() => {
    if (!bookingDraft || draftAvailabilityNote) return [];
    return rows
      .filter(
        (r) => r.type === bookingDraft.type && bookingDraft.days.every((d) => isDraftDayBookable(r.room, d)),
      )
      .map((r) => r.room);
  })();

  const changeDraftDates = (checkIn: string, checkOut: string) => {
    setBookingDraft((d) => (d ? { ...d, checkIn, checkOut, days: stayDays(checkIn, checkOut) } : d));
  };

  const handleViewReservation = () => {
    if (!detailCell) return;
    const params = detailCell.booking
      ? new URLSearchParams({ bookingId: detailCell.booking.id })
      : new URLSearchParams({ room: detailCell.room });
    setDetailCell(null);
    router.push(`/frontoffice/reservation/all-bookings?${params.toString()}`);
  };

  const step = windowSize === 14 ? 7 : 14;
  const currentMonth = todayIso.slice(0, 7);

  const shiftMonth = (ym: string, n: number) => {
    const [y, m] = ym.split("-").map(Number);
    const d = new Date(y, m - 1 + n, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  const goEarlier = () => {
    if (calendarMonth) setCalendarMonth(shiftMonth(calendarMonth, -1));
    else setWindowStart((s) => shiftIso(s, -step));
  };
  const goLater = () => {
    if (calendarMonth) setCalendarMonth(shiftMonth(calendarMonth, 1));
    else setWindowStart((s) => shiftIso(s, step));
  };
  const goToday = () => {
    setCalendarMonth(null);
    setWindowStart(defaultStart);
  };

  const positionLabel = (() => {
    const ahead = (n: number, unit: string) =>
      `${Math.abs(n)} ${unit}${Math.abs(n) !== 1 ? "s" : ""} ${n > 0 ? "Ahead" : "Back"}`;
    if (calendarMonth) {
      const [cy, cm] = currentMonth.split("-").map(Number);
      const [y, m] = calendarMonth.split("-").map(Number);
      const diff = (y - cy) * 12 + (m - cm);
      if (diff === 0) return "This Month";
      if (diff === 1) return "Next Month";
      if (diff === -1) return "Last Month";
      return ahead(diff, "Month");
    }
    const diffDays = Math.round(
      (parseIsoDate(windowStart).getTime() - parseIsoDate(defaultStart).getTime()) / 86_400_000,
    );
    if (diffDays === 0) return "Today";
    return diffDays % 7 === 0 ? ahead(diffDays / 7, "Week") : ahead(diffDays, "Day");
  })();
  const atToday = !calendarMonth && windowStart === defaultStart;

  const floorOptions = useMemo(() => {
    const values = new Set(rows.map((r) => r.floor).filter(Boolean));
    return [...values].sort(compareFloorLabel);
  }, [rows]);

  /** Room types in first-seen order (the API sorts rooms by floor / number). */
  const roomTypeOrder = useMemo(() => {
    const seen: string[] = [];
    for (const r of rows) if (r.type && !seen.includes(r.type)) seen.push(r.type);
    return seen;
  }, [rows]);

  const roomTypeOptions = useMemo(() => [...roomTypeOrder].sort((a, b) => a.localeCompare(b)), [roomTypeOrder]);

  const bedTypeOptions = useMemo(() => {
    const values = new Set(rows.map((r) => r.bedType).filter(Boolean));
    return [...values].sort((a, b) => String(a).localeCompare(String(b)));
  }, [rows]);

  const maxOccupancyOptions = useMemo(() => {
    const values = new Set(
      rows
        .map((r) => r.maxOccupancy)
        .filter((value): value is number => value != null && Number.isFinite(value)),
    );
    return [...values].sort((a, b) => a - b);
  }, [rows]);

  const baseFilters = useMemo(
    () => ({ roomType, floor, bedType, maxOccupancy, search }),
    [roomType, floor, bedType, maxOccupancy, search],
  );

  const filtered = useMemo(
    () => rows.filter((row) => matchesBaseRoomFilters(row, baseFilters)),
    [rows, baseFilters],
  );

  const groupedByType = useMemo(() => {
    const groups = new Map<string, RoomAvailabilityRow[]>();
    for (const row of filtered) {
      const key = row.type || "Unassigned";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    }
    const order = (t: string) => {
      const i = roomTypeOrder.indexOf(t);
      return i < 0 ? 999 : i;
    };
    return [...groups.entries()]
      .sort(([a], [b]) => order(a) - order(b))
      .map(([type, list]) => ({
        type,
        tone: TYPE_TONES[Math.max(roomTypeOrder.indexOf(type), 0) % TYPE_TONES.length],
        rows: [...list].sort((a, b) => a.room.localeCompare(b.room, undefined, { numeric: true })),
      }));
  }, [filtered, roomTypeOrder]);

  const dayTotals = useMemo(
    () =>
      gridDays.map((d) => {
        let booked = 0;
        let available = 0;
        let held = 0;
        for (const row of filtered) {
          const s = row.days[d];
          if (s === "reserved" || s === "occupied") booked++;
          else if (s === "blocked" || s === "maintenance") held++;
          else available++;
        }
        const sellable = filtered.length - held;
        return {
          booked,
          available,
          held,
          occupancy: sellable > 0 ? (booked / sellable) * 100 : 0,
        };
      }),
    [gridDays, filtered],
  );

  if (loading && rows.length === 0) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }
  if (error && rows.length === 0) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  const dayCellClass = (d: string) => {
    const dayName = formatDayName(d);
    return cn(
      d === todayIso && "bg-sky-50",
      d !== todayIso && (dayName === "Sat" || dayName === "Sun") && "bg-slate-50",
      d < todayIso && "bg-slate-100/60",
    );
  };

  const legend: { label: string; swatch: string; style?: CSSProperties }[] = [
    { label: "In-House", swatch: "bg-emerald-600" },
    { label: "Reserved", swatch: "bg-sky-600" },
    { label: "Group", swatch: "bg-indigo-600" },
    { label: "Blocked", swatch: "bg-slate-400", style: { backgroundImage: HATCH } },
    { label: "Maintenance", swatch: "bg-orange-400", style: { backgroundImage: HATCH } },
    { label: "Dirty room", swatch: "bg-rose-200 border border-rose-300" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Room Availability</h1>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search room, type, guest, booking no…"
              className="min-w-0 flex-1 sm:w-80 sm:flex-none"
            />
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className={cn(
                "inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-sm font-medium transition-colors",
                activeFilterCount > 0
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-700 px-1 text-[11px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-slate-500 hover:text-rose-600"
              >
                Clear
              </button>
            )}
          </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-xs text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Total Rooms</span>{" "}
            <span className="ml-1 text-sm font-black text-slate-900">{filtered.length}</span>
            {loading ? " · Updating…" : ""}
          </p>
          <div className="order-last flex w-full items-center gap-x-3 overflow-x-auto [scrollbar-width:none] lg:order-none lg:w-auto lg:flex-1 lg:flex-wrap lg:justify-center lg:gap-y-1 lg:overflow-visible">
            {legend.map((item) => (
              <span key={item.label} className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[11px] font-medium text-slate-600">
                <span className={cn("h-3 w-5 rounded-sm", item.swatch)} style={item.style} />
                {item.label}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-[11px] font-semibold">
              {WINDOW_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setWindowSize(n);
                    if (calendarMonth) {
                      setCalendarMonth(null);
                      setWindowStart(defaultStart);
                    }
                  }}
                  className={cn(
                    "rounded-md px-2.5 py-1 transition-colors",
                    !calendarMonth && windowSize === n ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-100",
                  )}
                >
                  {n === 14 ? "2 Weeks" : "30 Days"}
                </button>
              ))}
            </div>
            <label
              className={cn(
                "relative flex items-center rounded-lg",
                calendarMonth && "ring-2 ring-slate-800",
              )}
              title="Show a full calendar month"
            >
              <CalendarDays className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="month"
                value={calendarMonth ?? gridDays[0].slice(0, 7)}
                onChange={(e) => e.target.value && setCalendarMonth(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-white pl-8 pr-2 text-xs font-medium text-slate-700 outline-none focus:border-emerald-500"
                aria-label="Show month"
              />
            </label>
            <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5">
              <button
                type="button"
                onClick={goEarlier}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label={calendarMonth ? "Previous month" : `Back ${step} days`}
                title={calendarMonth ? "Previous month" : `Back ${step === 7 ? "1 week" : "2 weeks"}`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={goToday}
                title={atToday ? "Showing from today" : "Back to today"}
                className={cn(
                  "min-w-[7.5rem] rounded-md px-2.5 py-1 text-xs font-semibold",
                  atToday ? "bg-emerald-700 text-white" : "text-emerald-700 hover:bg-emerald-50",
                )}
              >
                {positionLabel}
              </button>
              <button
                type="button"
                onClick={goLater}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label={calendarMonth ? "Next month" : `Forward ${step} days`}
                title={calendarMonth ? "Next month" : `Forward ${step === 7 ? "1 week" : "2 weeks"}`}
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
          <div
            ref={setScrollEl}
            className="max-h-[70vh] min-h-[280px] overflow-auto overscroll-x-contain select-none sm:max-h-[calc(100vh-300px)] sm:min-h-[320px]"
          >
            <div style={{ width: labelW + gridWidth }} className="relative text-xs">
              {/* Header: blocked counts + dates */}
              <div className="sticky top-0 z-30">
                <div className="flex bg-[#4467ad] text-white">
                  <div
                    className="sticky left-0 z-10 flex shrink-0 items-center justify-between border-r border-white/20 bg-[#3a5a9b] px-2.5"
                    style={{ width: labelW, height: 22 }}
                  >
                    <span className="text-[11px] font-semibold">Blocked</span>
                    {!isPhone && <Info className="h-3.5 w-3.5 text-amber-300" />}
                  </div>
                  {gridDays.map((d, i) => (
                    <div
                      key={d}
                      className="flex shrink-0 items-center justify-center border-r border-white/15 text-[11px] font-semibold"
                      style={{ width: cellW, height: 22 }}
                    >
                      {dayTotals[i].held}
                    </div>
                  ))}
                </div>
                <div className="flex border-b border-slate-300 bg-white">
                  <div
                    className="sticky left-0 z-10 flex shrink-0 items-center border-r border-slate-300 bg-slate-100 px-2.5 text-[11px] font-bold text-[#3a5a9b]"
                    style={{ width: labelW, height: 36 }}
                  >
                    {isPhone
                      ? parseIsoDate(gridDays[0]).toLocaleDateString("en-US", { month: "short", year: "2-digit" })
                      : formatRangeTitle(gridDays[0], gridDays[gridDays.length - 1])}
                  </div>
                  {gridDays.map((d) => {
                    const isToday = d === todayIso;
                    return (
                      <div
                        key={d}
                        className={cn(
                          "flex shrink-0 flex-col items-center justify-center border-r border-slate-200 leading-tight",
                          isToday ? "bg-sky-500 text-white" : cn("text-slate-600", dayCellClass(d)),
                        )}
                        style={{ width: cellW, height: 36 }}
                      >
                        <span className="text-[11px] font-bold">{String(parseIsoDate(d).getDate()).padStart(2, "0")}</span>
                        <span className={cn("text-[10px]", isToday ? "font-semibold" : "text-slate-400")}>
                          {formatDayName(d).slice(0, 2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {groupedByType.map((group) => (
                <Fragment key={group.type}>
                  <div className="flex border-b border-slate-300 bg-slate-200/80">
                    <div
                      className="sticky left-0 z-20 flex shrink-0 items-center gap-1.5 border-r border-slate-300 bg-slate-200 px-2.5 font-bold text-slate-800"
                      style={{ width: labelW, height: 24 }}
                    >
                      <Layers className="h-3 w-3 text-slate-500" />
                      <span className="truncate">{group.type}</span>
                      <span className="ml-auto text-[10px] font-semibold text-slate-500">{group.rows.length}</span>
                    </div>
                    {gridDays.map((d) => {
                      const free = group.rows.filter((r) => {
                        const s = r.days[d];
                        return !s || s === "available" || s === "dirty";
                      }).length;
                      return (
                        <div
                          key={d}
                          className={cn(
                            "flex shrink-0 items-center justify-center border-r border-slate-300/60 text-[10px] font-semibold",
                            free === 0 ? "text-rose-600" : "text-slate-500",
                          )}
                          style={{ width: cellW, height: 24 }}
                          title={`${free} ${group.type} available on ${formatDayLabel(d)}`}
                        >
                          {free}
                        </div>
                      );
                    })}
                  </div>

                  {group.rows.map((row) => {
                    const todayStatus = row.days[todayIso];
                    const labelTone =
                      todayStatus === "dirty"
                        ? "bg-rose-200/90 text-rose-950"
                        : todayStatus === "maintenance" || todayStatus === "blocked"
                          ? "bg-slate-300 text-slate-800"
                          : group.tone;
                    const segments = buildSegments(row, gridDays);
                    return (
                      <div key={row.room} className="group/row flex border-b border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleRoomLabelClick(row)}
                          title={`${row.type} · ${row.floor}${row.bedType ? ` · ${row.bedType}` : ""}${
                            todayStatus === "dirty" ? " · Dirty today" : ""
                          }`}
                          className={cn(
                            "sticky left-0 z-20 flex shrink-0 items-center gap-2 border-r border-slate-300 px-2.5 text-left transition-[filter] hover:brightness-95",
                            labelTone,
                          )}
                          style={{ width: labelW, height: ROW_H }}
                        >
                          <span className="font-bold">{row.room}</span>
                          {!isPhone && (
                            <span className="truncate text-[10px] opacity-70">
                              {row.bedType ?? row.floor}
                            </span>
                          )}
                          {todayStatus === "dirty" && (
                            <span className="ml-auto rounded bg-rose-500 px-1 text-[9px] font-bold text-white">D</span>
                          )}
                        </button>

                        <div className="relative shrink-0" style={{ width: gridWidth, height: ROW_H }}>
                          <div className="flex h-full">
                            {gridDays.map((d) => {
                              const status = (row.days[d] ?? "available") as DayStatus;
                              const bookable = isBookableStatus(status, d, todayIso);
                              const inDrag =
                                dragState?.room === row.room && isDayInRange(d, dragState.startDay, dragState.endDay);
                              const inDraft = bookingDraft?.room === row.room && bookingDraft.days.includes(d);
                              return (
                                <div
                                  key={d}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleCellMouseDown(row, d, status);
                                  }}
                                  onMouseEnter={() => handleCellMouseEnter(row, d)}
                                  title={bookable ? `Drag to reserve Room ${row.room} from ${formatDayLabel(d)}` : undefined}
                                  className={cn(
                                    "h-full shrink-0 border-r border-slate-200/80 transition-colors",
                                    dayCellClass(d),
                                    bookable ? "cursor-cell group-hover/row:bg-emerald-50/50 hover:!bg-emerald-100" : "cursor-pointer",
                                    (inDrag || inDraft) && "!bg-emerald-300/70",
                                  )}
                                  style={{ width: cellW }}
                                />
                              );
                            })}
                          </div>

                          {segments.map((seg) => {
                            const left = seg.startsInside ? seg.startIdx * cellW + cellW / 2 : seg.startIdx * cellW;
                            const rightRaw = seg.endsInside ? (seg.endIdx + 1) * cellW + cellW / 2 : (seg.endIdx + 1) * cellW;
                            const right = Math.min(rightRaw, gridWidth);
                            const day = gridDays[seg.startIdx];
                            if (seg.booking) {
                              const b = seg.booking;
                              const tone = b.groupId
                                ? "bg-indigo-600 hover:bg-indigo-700"
                                : seg.status === "occupied"
                                  ? "bg-emerald-600 hover:bg-emerald-700"
                                  : "bg-sky-600 hover:bg-sky-700";
                              return (
                                <button
                                  key={seg.key}
                                  type="button"
                                  onClick={() => showDetail(row, day, seg.status)}
                                  title={[
                                    bookingLabel(b),
                                    statusConfig[seg.status].label,
                                    b.groupId ? `Group${b.groupName ? `: ${b.groupName}` : ""}` : null,
                                    `${formatDayLabel(b.checkIn)} → ${formatDayLabel(b.checkOut)}`,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                  className={cn(
                                    "absolute top-1/2 z-10 flex h-[20px] -translate-y-1/2 items-center overflow-hidden px-1.5 text-[11px] font-semibold text-white shadow-sm transition-colors",
                                    seg.startsInside ? "rounded-l-sm" : "rounded-l-none",
                                    seg.endsInside ? "rounded-r-sm" : "rounded-r-none",
                                    tone,
                                  )}
                                  style={{ left: left + 1, width: Math.max(right - left - 2, 6) }}
                                >
                                  <span className="truncate">{bookingLabel(b)}</span>
                                </button>
                              );
                            }
                            const hint = blockHints.get(`${row.room}-${day}`) ?? statusConfig[seg.status].label;
                            return (
                              <button
                                key={seg.key}
                                type="button"
                                onClick={() => showDetail(row, day, seg.status)}
                                title={hint}
                                className={cn(
                                  "absolute top-1/2 z-10 flex h-[20px] -translate-y-1/2 items-center gap-1 overflow-hidden rounded-sm px-1.5 text-[10px] font-semibold",
                                  seg.status === "maintenance" ? "bg-orange-400 text-orange-950" : "bg-slate-400 text-slate-900",
                                )}
                                style={{ left: left + 1, width: Math.max(right - left - 2, 6), backgroundImage: HATCH }}
                              >
                                {seg.status === "maintenance" ? (
                                  <Wrench className="h-3 w-3 shrink-0" />
                                ) : (
                                  <Lock className="h-3 w-3 shrink-0" />
                                )}
                                <span className="truncate">{hint}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </Fragment>
              ))}

              {/* Footer totals */}
              <div className="sticky bottom-0 z-30 bg-[#4467ad] text-white">
                {(
                  [
                    ["Bookings", (i: number) => dayTotals[i].booked],
                    ["Occupancy (%)", (i: number) => dayTotals[i].occupancy.toFixed(2)],
                    ["Available", (i: number) => dayTotals[i].available],
                  ] as const
                ).map(([label, value], rowIdx) => (
                  <div key={label} className={cn("flex", rowIdx === 0 && "border-t-2 border-[#2f4c86]")}>
                    <div
                      className="sticky left-0 z-10 flex shrink-0 items-center justify-end border-r border-white/20 bg-[#3a5a9b] px-2.5 text-[11px] font-semibold"
                      style={{ width: labelW, height: 20 }}
                    >
                      {isPhone ? { Bookings: "Booked", "Occupancy (%)": "Occ %", Available: "Free" }[label] : label}
                    </div>
                    {gridDays.map((d, i) => (
                      <div
                        key={d}
                        className={cn(
                          "flex shrink-0 items-center justify-center border-r border-white/15 text-[10px] font-semibold",
                          d === todayIso && "bg-white/15",
                        )}
                        style={{ width: cellW, height: 20 }}
                      >
                        {label === "Available" ? (
                          <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-white/70 px-0.5 text-[9px]">
                            {value(i)}
                          </span>
                        ) : (
                          value(i)
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 text-center text-[11px] text-slate-500">
            Drag across empty dates on a room to reserve · click a bar for booking or block details · numbers on room-type rows are rooms still available that day
          </div>
        )}
      </div>

      <Modal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filter Rooms"
        description="Narrow the chart by room attributes"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={clearFilters} disabled={activeFilterCount === 0}>
              Clear all
            </Button>
            <Button className="bg-emerald-700 hover:bg-emerald-800" onClick={() => setFiltersOpen(false)}>
              Show {filtered.length} room{filtered.length !== 1 ? "s" : ""}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              {
                label: "Room Type",
                icon: Layers,
                value: roomType,
                set: setRoomType,
                all: "All Room Types",
                options: roomTypeOptions.map((t) => ({ value: t, label: t })),
              },
              {
                label: "Floor",
                icon: DoorOpen,
                value: floor,
                set: setFloor,
                all: "All Floors",
                options: floorOptions.map((f) => ({ value: f, label: f })),
              },
              {
                label: "Bed Type",
                icon: BedDouble,
                value: bedType,
                set: setBedType,
                all: "All Bed Types",
                options: bedTypeOptions.map((b) => ({ value: String(b), label: String(b) })),
              },
              {
                label: "Max Occupancy",
                icon: Users,
                value: maxOccupancy,
                set: setMaxOccupancy,
                all: "Any Occupancy",
                options: maxOccupancyOptions.map((n) => ({
                  value: String(n),
                  label: `Max ${n} guest${n !== 1 ? "s" : ""}`,
                })),
              },
            ] as const
          ).map((f) => (
            <label key={f.label} className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{f.label}</span>
              <div className="relative">
                <f.icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <SelectInput
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  className={cn(
                    "h-10 w-full rounded-xl pl-9",
                    f.value !== "all" ? "border-emerald-500 bg-emerald-50/40" : "border-slate-200",
                  )}
                >
                  <option value="all">{f.all}</option>
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </SelectInput>
              </div>
            </label>
          ))}
        </div>
      </Modal>

      <QuickReservationModal
        draft={bookingDraft}
        conflict={bookingConflict}
        availabilityNote={draftAvailabilityNote}
        roomOptions={draftRoomOptions}
        todayIso={todayIso}
        onDatesChange={changeDraftDates}
        onClose={() => setBookingDraft(null)}
        onCreated={(booking) => {
          setBookingDraft(null);
          setExtraAvailability({});
          setReloadKey((k) => k + 1);
          setQuickViewBookingId(booking.id);
        }}
      />

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
            {(detailCell?.status === "reserved" || detailCell?.status === "occupied") && (
              <Button className="bg-emerald-700 hover:bg-emerald-800" onClick={handleViewReservation}>
                View Reservation
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
                detailCell.status === "occupied" && "border-emerald-200 bg-emerald-50",
                detailCell.status === "dirty" && "border-rose-200 bg-rose-50",
                detailCell.status === "maintenance" && "border-orange-200 bg-orange-50",
                detailCell.status === "blocked" && "border-slate-200 bg-slate-50",
              )}
            >
              <span className={cn("h-3 w-3 rounded-full", statusConfig[detailCell.status].dot)} />
              <div>
                <p className="font-semibold text-slate-900">{statusConfig[detailCell.status].label}</p>
                <p className="text-xs text-slate-500">
                  {detailCell.floor} · {detailCell.type}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              {blockHints.get(`${detailCell.room}-${detailCell.day}`) ?? statusConfig[detailCell.status].description}
            </p>
            {(detailCell.status === "reserved" || detailCell.status === "occupied") &&
              (detailCell.booking ? (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm">
                  <div className="col-span-2 flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="min-w-0">
                      <dt className="text-xs text-slate-500">Booking Type</dt>
                      <dd className="mt-1 flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1",
                            detailCell.booking.groupId
                              ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
                              : "bg-slate-50 text-slate-700 ring-slate-200",
                          )}
                        >
                          {detailCell.booking.groupId ? "Group" : "Individual"}
                        </span>
                        {detailCell.booking.groupId && (
                          <span className="truncate font-medium text-slate-900">
                            {detailCell.booking.groupName ?? "Group booking"}
                            {detailCell.booking.groupNo && (
                              <span className="ml-1 font-mono text-xs text-slate-500">
                                ({detailCell.booking.groupNo})
                              </span>
                            )}
                          </span>
                        )}
                      </dd>
                    </div>
                    {detailCell.booking.groupId && (
                      <Link
                        href={`/frontoffice/group-booking/${detailCell.booking.groupId}`}
                        className="shrink-0 text-xs font-semibold text-indigo-700 hover:underline"
                      >
                        Open Group
                      </Link>
                    )}
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Booking No</dt>
                    <dd className="font-mono font-semibold">
                      <Link
                        href={`/frontoffice/reservation/all-bookings?bookingId=${encodeURIComponent(detailCell.booking.id)}`}
                        className="text-emerald-700 hover:underline"
                        title="Open booking details"
                      >
                        {detailCell.booking.bookingNo ?? "View booking"}
                      </Link>
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs text-slate-500">Guest</dt>
                    <dd className="truncate font-medium text-slate-900">
                      {detailCell.booking.guestId ? (
                        <Link
                          href={`/frontoffice/guest-profiles?guestId=${encodeURIComponent(detailCell.booking.guestId)}`}
                          className="text-emerald-700 hover:underline"
                          title="Open guest profile"
                        >
                          {detailCell.booking.guestName ?? "View guest"}
                        </Link>
                      ) : (
                        (detailCell.booking.guestName ?? "—")
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Stay</dt>
                    <dd className="font-medium text-slate-900">
                      {formatDayLabel(detailCell.booking.checkIn)} → {formatDayLabel(detailCell.booking.checkOut)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Booking Status</dt>
                    <dd className="font-medium text-slate-900">{detailCell.booking.status}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-slate-600">View the linked reservation for guest details and folio.</p>
              ))}
          </div>
        )}
      </Modal>

      <ReservationQuickView bookingId={quickViewBookingId} onClose={() => setQuickViewBookingId(null)} />
    </div>
  );
}
