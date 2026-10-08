"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BedDouble,
  Calendar,
  ChevronDown,
  ChevronRight,
  Download,
  ExternalLink,
  LogIn,
  LogOut,
  MoreHorizontal,
  Pencil,
  Plus,
  Printer,
  Users,
  UserX,
  XCircle,
} from "lucide-react";
import type {
  ReservationBooking,
  ReservationFilter,
  ReservationSummaryStat,
} from "@/app/data/types";
import { roomTypes } from "@/app/data/frontoffice/constants";
import { reservationService } from "@/services/front-office";
import { Button } from "@/components/ui/Button";
import {
  AlertBanner,
  ConfirmModal,
  EmptyState,
  FOPageHeader,
  FOSearchToolbar,
  FormField,
  SelectInput,
} from "@/components/frontoffice/ui";
import { usePropertyOptional } from "@/components/platform/PropertyProvider";
import { cn } from "@/lib/utils";
import { displayBookingNo } from "@/lib/booking-display";
import { formatBookingGuestLine } from "@/lib/reservation-display";
import {
  formatBookingCreatedAt,
  isArrivingToday,
  isNoShowEligible,
} from "@/lib/reservation-dates";
import { checkInHref, checkOutHref } from "@/lib/check-in-navigation";
import { BookingDetailDrawer } from "./BookingDetailDrawer";
import { printBookingDetail } from "./bookingPrintUtils";
import { ReservationStatusBadge } from "./ReservationStatusBadge";
import { ReservationSummaryCards } from "./ReservationSummaryCards";

const statusFilters: { id: ReservationFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "arriving-today", label: "Arriving Today" },
  { id: "in-house", label: "In-House" },
  { id: "reserved", label: "Reserved" },
  { id: "checked-out", label: "Checked Out" },
  { id: "cancelled", label: "Cancelled" },
  { id: "no-show", label: "No Show" },
  { id: "outstanding", label: "Outstanding" },
];

function formatBalance(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function getInitials(name?: string) {
  if (!name?.trim()) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Reserved bookings can be checked in; in-house bookings can only be checked out. */
function primaryAction(booking: ReservationBooking) {
  if (booking.status === "Checked In" || booking.status === "In-House") {
    return {
      href: checkOutHref(booking),
      icon: LogOut,
      title: "Check out",
      className: "text-orange-700 hover:bg-orange-50",
    };
  }
  if (booking.status === "Reserved" || booking.status === "Confirmed") {
    return {
      href: checkInHref(booking),
      icon: LogIn,
      title: "Check in",
      className: "text-emerald-700 hover:bg-emerald-50",
    };
  }
  return null;
}

/** Newest bookings first — prefer createdAt, then check-in date. */
function bookingRecencyMs(booking: ReservationBooking): number {
  if (booking.createdAt) {
    const created = Date.parse(booking.createdAt);
    if (!Number.isNaN(created)) return created;
  }
  if (booking.checkIn) {
    const checkIn = Date.parse(booking.checkIn);
    if (!Number.isNaN(checkIn)) return checkIn;
  }
  return 0;
}

type BookingListRow =
  | { kind: "solo"; booking: ReservationBooking }
  | {
      kind: "group";
      groupId: string;
      groupName: string;
      groupNo?: string | null;
      children: ReservationBooking[];
    };

function deriveGroupStatus(children: ReservationBooking[]): string {
  const statuses = [...new Set(children.map((c) => String(c.status ?? "").trim()).filter(Boolean))];
  if (statuses.length === 1) return statuses[0]!;
  if (statuses.some((s) => s === "Checked In" || s === "In-House")) {
    return "Partial / In-House";
  }
  return "Mixed";
}

function canCancelStatus(status?: string) {
  const s = String(status ?? "").trim();
  return s !== "Cancelled" && s !== "Checked Out" && s !== "No Show";
}

function groupHasCancelable(children: ReservationBooking[]) {
  return children.some((c) => canCancelStatus(c.status));
}

function groupHasNoShowEligible(children: ReservationBooking[]) {
  return children.some((c) => isNoShowEligible(c));
}

function buildBookingListRows(bookings: ReservationBooking[]): BookingListRow[] {
  const groups = new Map<string, ReservationBooking[]>();
  const solos: ReservationBooking[] = [];

  for (const booking of bookings) {
    const groupId = String(booking.groupId ?? "").trim();
    if (!groupId) {
      solos.push(booking);
      continue;
    }
    const list = groups.get(groupId) ?? [];
    list.push(booking);
    groups.set(groupId, list);
  }

  const rows: BookingListRow[] = [];

  for (const [groupId, children] of groups) {
    const sorted = [...children].sort(
      (a, b) => bookingRecencyMs(b) - bookingRecencyMs(a),
    );
    rows.push({
      kind: "group",
      groupId,
      groupName:
        sorted[0]?.groupName?.trim() ||
        sorted[0]?.guestName?.trim() ||
        "Group booking",
      groupNo: sorted[0]?.groupNo,
      children: sorted,
    });
  }

  for (const booking of solos) {
    rows.push({ kind: "solo", booking });
  }

  return rows.sort((a, b) => {
    const aMs =
      a.kind === "solo"
        ? bookingRecencyMs(a.booking)
        : Math.max(...a.children.map(bookingRecencyMs), 0);
    const bMs =
      b.kind === "solo"
        ? bookingRecencyMs(b.booking)
        : Math.max(...b.children.map(bookingRecencyMs), 0);
    return bMs - aMs;
  });
}

function matchesFilter(booking: ReservationBooking, filter: ReservationFilter) {
  switch (filter) {
    case "all":
      return true;
    case "arriving-today":
      return (
        isArrivingToday(booking) &&
        booking.status !== "Cancelled" &&
        booking.status !== "Checked Out" &&
        booking.status !== "No Show"
      );
    case "confirmed":
      return booking.status === "Confirmed";
    case "in-house":
      return booking.status === "Checked In" || booking.status === "In-House";
    case "reserved":
      return booking.status === "Reserved" || booking.status === "Confirmed";
    case "checked-out":
      return booking.status === "Checked Out";
    case "cancelled":
      return booking.status === "Cancelled";
    case "no-show":
      return booking.status === "No Show";
    case "outstanding":
      return booking.balance > 0 && booking.status !== "Cancelled";
    default:
      return true;
  }
}

function findBookingByKey(bookings: ReservationBooking[], key: string) {
  const trimmed = key.trim();
  if (!trimmed) return null;
  return (
    bookings.find((b) => b.id === trimmed) ??
    bookings.find((b) => displayBookingNo(b) === trimmed) ??
    bookings.find((b) => b.bookingNo === trimmed) ??
    null
  );
}

export function AllBookingsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyCtx = usePropertyOptional();
  const propertyName = propertyCtx?.property?.name ?? "IMPACT PMS";
  const bookingQuery =
    searchParams.get("bookingId") ?? searchParams.get("booking") ?? "";
  const guestIdQuery = searchParams.get("guestId") ?? "";
  const [bookings, setBookings] = useState<ReservationBooking[]>([]);
  const [summaryStats, setSummaryStats] = useState<ReservationSummaryStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ReservationFilter>("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewBooking, setViewBooking] = useState<ReservationBooking | null>(null);
  const [cancelBooking, setCancelBooking] = useState<ReservationBooking | null>(null);
  const [noShowBooking, setNoShowBooking] = useState<ReservationBooking | null>(null);
  const [groupAction, setGroupAction] = useState<{
    type: "cancel" | "no-show";
    groupId: string;
    groupName: string;
    groupNo?: string | null;
    children: ReservationBooking[];
  } | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const menuContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenu]);

  const handlePrintBooking = (booking: ReservationBooking) => {
    const printed = printBookingDetail(booking, propertyName);
    if (!printed) {
      setToast("Unable to open print dialog. Allow pop-ups and try again.");
      return;
    }
    setToast(`Printing booking details for ${displayBookingNo(booking)}.`);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [list, summary] = await Promise.all([
          reservationService.list(),
          reservationService.summary(),
        ]);
        if (!cancelled) {
          setBookings(list);
          setSummaryStats(summary);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!bookingQuery || bookings.length === 0) return;
    const match = findBookingByKey(bookings, bookingQuery);
    if (match) setViewBooking(match);
  }, [bookingQuery, bookings]);

  const closeBookingDetail = () => {
    setViewBooking(null);
    if (bookingQuery) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("bookingId");
      params.delete("booking");
      const qs = params.toString();
      router.replace(
        qs
          ? `/frontoffice/reservation/all-bookings?${qs}`
          : "/frontoffice/reservation/all-bookings",
        { scroll: false },
      );
    }
  };

  const clearGuestFilter = () => {
    router.replace("/frontoffice/reservation/all-bookings", { scroll: false });
  };

  const scopedBookings = useMemo(() => {
    if (!guestIdQuery) return bookings;
    return bookings.filter((b) => b.guestId === guestIdQuery);
  }, [bookings, guestIdQuery]);

  const guestFilterName = useMemo(() => {
    if (!guestIdQuery) return null;
    return scopedBookings[0]?.guestName ?? null;
  }, [guestIdQuery, scopedBookings]);

  const sourceOptions = useMemo(
    () => [...new Set(scopedBookings.map((b) => b.source))].sort(),
    [scopedBookings],
  );

  const filterCounts = useMemo(
    () =>
      Object.fromEntries(
        statusFilters.map((f) => [
          f.id,
          scopedBookings.filter((b) => matchesFilter(b, f.id)).length,
        ]),
      ) as Record<ReservationFilter, number>,
    [scopedBookings],
  );

  const displayStats = useMemo(
    () =>
      summaryStats.map((stat) =>
        stat.label === "Arriving Today"
          ? { ...stat, value: filterCounts["arriving-today"] }
          : stat,
      ),
    [summaryStats, filterCounts],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return scopedBookings
      .filter((booking) => {
      const matchesSearch =
        !query ||
          booking.guestName?.toLowerCase().includes(query) ||
          displayBookingNo(booking).toLowerCase().includes(query) ||
          (booking.guestNo ?? "").toLowerCase().includes(query) ||
          booking.phone?.toLowerCase().includes(query) ||
          booking.roomNo?.toLowerCase().includes(query) ||
          booking.roomType?.toLowerCase().includes(query) ||
          booking.source?.toLowerCase().includes(query) ||
          (booking.groupName ?? "").toLowerCase().includes(query) ||
          (booking.groupNo ?? "").toLowerCase().includes(query);
      const matchesSource = sourceFilter === "all" || booking.source === sourceFilter;
      const matchesRoomType =
        roomTypeFilter === "all" || booking.roomType === roomTypeFilter;
      return (
        matchesSearch &&
        matchesSource &&
        matchesRoomType &&
        matchesFilter(booking, activeFilter)
      );
      })
      .sort((a, b) => bookingRecencyMs(b) - bookingRecencyMs(a));
  }, [scopedBookings, search, activeFilter, sourceFilter, roomTypeFilter]);

  const listRows = useMemo(() => buildBookingListRows(filtered), [filtered]);

  const toggleGroupExpanded = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const hasActiveAdvancedFilters = sourceFilter !== "all" || roomTypeFilter !== "all";

  const clearAdvancedFilters = () => {
    setSourceFilter("all");
    setRoomTypeFilter("all");
  };

  const allSelected =
    filtered.length > 0 && filtered.every((b) => selected.has(b.id));

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(filtered.map((b) => b.id)));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCancel = async () => {
    if (!cancelBooking) return;
    try {
      await reservationService.update(cancelBooking.id, { status: "Cancelled" });
      setBookings((prev) =>
        prev.map((b) =>
          b.id === cancelBooking.id ? { ...b, status: "Cancelled" as const } : b,
        ),
      );
      const summary = await reservationService.summary();
      setSummaryStats(summary);
      setToast(`Booking ${displayBookingNo(cancelBooking)} has been cancelled.`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to cancel booking");
    }
    setCancelBooking(null);
  };

  const handleNoShow = async () => {
    if (!noShowBooking) return;
    try {
      await reservationService.update(noShowBooking.id, { status: "No Show" });
      setBookings((prev) =>
        prev.map((b) =>
          b.id === noShowBooking.id ? { ...b, status: "No Show" as const } : b,
        ),
      );
      const summary = await reservationService.summary();
      setSummaryStats(summary);
      setToast(
        `Booking ${displayBookingNo(noShowBooking)} marked as no show. Room released.`,
      );
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to mark no show");
    }
    setNoShowBooking(null);
  };

  const handleGroupAction = async () => {
    if (!groupAction) return;
    const status =
      groupAction.type === "cancel" ? ("Cancelled" as const) : ("No Show" as const);
    const ids = groupAction.children
      .filter((c) => {
        const s = String(c.status ?? "");
        return s !== "Cancelled" && s !== "Checked Out" && s !== "No Show";
      })
      .map((c) => c.id);

    if (!ids.length) {
      setToast("No eligible room bookings to update in this group.");
      setGroupAction(null);
      return;
    }

    try {
      await Promise.all(
        ids.map((id) => reservationService.update(id, { status })),
      );
      const idSet = new Set(ids);
      setBookings((prev) =>
        prev.map((b) => (idSet.has(b.id) ? { ...b, status } : b)),
      );
      const summary = await reservationService.summary();
      setSummaryStats(summary);
      const label = groupAction.groupNo || groupAction.groupName;
      setToast(
        groupAction.type === "cancel"
          ? `Cancelled ${ids.length} room booking${ids.length === 1 ? "" : "s"} in ${label}.`
          : `Marked ${ids.length} room booking${ids.length === 1 ? "" : "s"} in ${label} as No Show.`,
      );
    } catch (e) {
      setToast(
        e instanceof Error
          ? e.message
          : groupAction.type === "cancel"
            ? "Failed to cancel group bookings"
            : "Failed to mark group as no show",
      );
    }
    setGroupAction(null);
  };

  const handleExport = () => {
    const rows = filtered.map(
      (b) =>
        `${displayBookingNo(b)},${b.guestName ?? ""},${b.roomNo ?? ""},${b.checkIn},${b.checkOut},${b.status},${b.balance}`,
    );
    const csv = ["Booking ID,Guest,Room,Check-in,Check-out,Status,Balance", ...rows].join(
      "\n",
    );
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reservations.csv";
    a.click();
    URL.revokeObjectURL(url);
    setToast("Reservation list exported as CSV.");
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <div className="space-y-5">
      {toast && (
        <AlertBanner variant="success" message={toast} onDismiss={() => setToast(null)} />
      )}

      {guestIdQuery && (
        <AlertBanner
          variant="info"
          message={
            guestFilterName
              ? `Showing bookings for ${guestFilterName}`
              : "Showing bookings for selected guest"
          }
          onDismiss={clearGuestFilter}
          autoDismissMs={0}
        />
      )}

      <FOPageHeader
        eyebrow="Reservations"
        title="All Bookings"
        description={
          guestIdQuery
            ? "Bookings filtered to the selected guest profile."
            : "Search, filter, and manage all reservations from a single view."
        }
        badge={
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {filtered.length} of {scopedBookings.length} shown
            {guestIdQuery ? ` · guest filter on` : ""}
          </span>
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleExport}
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
            <Link href="/frontoffice/reservation/new">
              <Button size="sm" className="gap-1.5 bg-emerald-700 shadow-sm hover:bg-emerald-800">
                <Plus className="h-3.5 w-3.5" />
                New Reservation
              </Button>
            </Link>
          </div>
        }
      />

      <ReservationSummaryCards
        stats={displayStats}
        activeFilter={activeFilter}
        onFilterClick={setActiveFilter}
      />

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <FOSearchToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search guest, booking ID, phone, or room…"
          filterPills={{
            active: activeFilter,
            onChange: (id) => setActiveFilter(id as ReservationFilter),
            options: statusFilters.map((f) => ({
              id: f.id,
              label: `${f.label} ${filterCounts[f.id]}`,
            })),
          }}
          hasActiveAdvancedFilters={hasActiveAdvancedFilters}
          onClearAdvancedFilters={clearAdvancedFilters}
          advancedFilters={
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <FormField label="Source">
                <SelectInput
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                >
                  <option value="all">All sources</option>
                  {sourceOptions.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </SelectInput>
              </FormField>
              <FormField label="Room Type">
                <SelectInput
                  value={roomTypeFilter}
                  onChange={(e) => setRoomTypeFilter(e.target.value)}
                >
                  <option value="all">All room types</option>
                  {roomTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </SelectInput>
              </FormField>
              <FormField label="Showing">
                <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
                  {filtered.length} of {bookings.length} bookings
                </div>
              </FormField>
            </div>
          }
          selectionBar={
            selected.size > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-3">
                <span className="text-sm font-medium text-emerald-900">
                  {selected.size} booking{selected.size !== 1 ? "s" : ""} selected
                </span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 bg-white"
                    onClick={handleExport}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export selected
                  </Button>
                  <button
                    type="button"
                    className="text-xs font-medium text-emerald-700 hover:underline"
                    onClick={() => setSelected(new Set())}
                  >
                    Clear
                  </button>
                </div>
              </div>
            ) : undefined
          }
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <EmptyState
            title="No bookings found"
            description="Try adjusting your search or filter criteria."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setActiveFilter("all");
                    clearAdvancedFilters();
                  }}
                >
                  Clear filters
                </Button>
                <Link href="/frontoffice/reservation/new">
                  <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800">
                    Create Reservation
                  </Button>
                </Link>
              </div>
            }
          />
        ) : (
          <>
            <div className="space-y-0 divide-y divide-slate-100 md:hidden">
              {listRows.map((row) => {
                if (row.kind === "group") {
                  const expanded = expandedGroups.has(row.groupId);
                  const balance = row.children.reduce(
                    (sum, c) => sum + Number(c.balance ?? 0),
                    0,
                  );
                  const checkIn = row.children
                    .map((c) => c.checkIn)
                    .filter(Boolean)
                    .sort()[0];
                  const checkOut = [...row.children]
                    .map((c) => c.checkOut)
                    .filter(Boolean)
                    .sort()
                    .at(-1);
                  return (
                    <div key={`g-${row.groupId}`} className="bg-white">
                      <div
                        role="link"
                        tabIndex={0}
                        onClick={() =>
                          router.push(`/frontoffice/group-booking/${row.groupId}`)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            router.push(
                              `/frontoffice/group-booking/${row.groupId}`,
                            );
                          }
                        }}
                        className="cursor-pointer p-4 transition-colors hover:bg-emerald-50/40"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-slate-800 text-sm font-bold text-white">
                            {getInitials(row.groupName)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {row.groupName}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {[row.groupNo, `${row.children.length} rooms`]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </p>
                              </div>
                              <ReservationStatusBadge
                                status={deriveGroupStatus(row.children)}
                              />
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                              <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-indigo-700">
                                <Users className="h-3 w-3" />
                                Group
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5">
                                <Calendar className="h-3 w-3" />
                                {checkIn ?? "—"} – {checkOut ?? "—"}
                              </span>
                            </div>
                            <div className="mt-3 flex items-center justify-between gap-2">
                              <p className="font-bold text-slate-900">
                                {formatBalance(balance)}
                              </p>
                              <div
                                className="relative flex items-center gap-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Link
                                  href={`/frontoffice/group-booking/${row.groupId}`}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-teal-700"
                                >
                                  Open group
                                  <ExternalLink className="h-3 w-3" />
                                </Link>
                                <div
                                  className="relative"
                                  ref={
                                    openMenu === `group-m:${row.groupId}`
                                      ? menuContainerRef
                                      : undefined
                                  }
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenMenu(
                                        openMenu === `group-m:${row.groupId}`
                                          ? null
                                          : `group-m:${row.groupId}`,
                                      )
                                    }
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                    aria-label="Group actions"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </button>
                                  {openMenu === `group-m:${row.groupId}` ? (
                                    <div className="absolute right-0 top-full z-30 mt-1 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                                      {[
                                        ...(groupHasNoShowEligible(row.children)
                                          ? [
                                              {
                                                icon: UserX,
                                                label: "Mark No Show",
                                                onClick: () =>
                                                  setGroupAction({
                                                    type: "no-show",
                                                    groupId: row.groupId,
                                                    groupName: row.groupName,
                                                    groupNo: row.groupNo,
                                                    children: row.children,
                                                  }),
                                                danger: true,
                                              },
                                            ]
                                          : []),
                                        ...(groupHasCancelable(row.children)
                                          ? [
                                              {
                                                icon: XCircle,
                                                label: "Cancel all",
                                                onClick: () =>
                                                  setGroupAction({
                                                    type: "cancel",
                                                    groupId: row.groupId,
                                                    groupName: row.groupName,
                                                    groupNo: row.groupNo,
                                                    children: row.children,
                                                  }),
                                                danger: true,
                                              },
                                            ]
                                          : []),
                                      ].map(({ icon: Icon, label, onClick, danger }) => (
                                        <button
                                          key={label}
                                          type="button"
                                          onClick={() => {
                                            onClick();
                                            setOpenMenu(null);
                                          }}
                                          className={cn(
                                            "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50",
                                            danger
                                              ? "text-red-600 hover:bg-red-50"
                                              : "text-slate-700",
                                          )}
                                        >
                                          <Icon className="h-3.5 w-3.5" />
                                          {label}
                                        </button>
                                      ))}
                                    </div>
                                  ) : null}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleGroupExpanded(row.groupId)}
                                  className={cn(
                                    "rounded-lg p-1.5 hover:bg-indigo-100",
                                    expanded ? "text-indigo-700" : "text-slate-400 hover:text-slate-700",
                                  )}
                                  title={expanded ? "Hide rooms" : "Show rooms"}
                                  aria-label={expanded ? "Collapse group rooms" : "Expand group rooms"}
                                  aria-expanded={expanded}
                                >
                                  {expanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {expanded
                        ? row.children.map((booking) => (
                            <div
                              key={booking.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => setViewBooking(booking)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setViewBooking(booking);
                                }
                              }}
                              className="cursor-pointer border-t border-slate-100 bg-slate-50/70 py-3 pl-8 pr-4 transition-colors hover:bg-emerald-50/40"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {booking.guestName || "Unassigned"}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {formatBookingGuestLine(booking)}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-600">
                                    Room {booking.roomNo ?? "TBA"}
                                    {booking.roomType ? ` · ${booking.roomType}` : ""}
                                  </p>
                                </div>
                                <ReservationStatusBadge status={booking.status} />
                              </div>
                            </div>
                          ))
                        : null}
                    </div>
                  );
                }

                const booking = row.booking;
                return (
                <div
                  key={booking.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setViewBooking(booking)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setViewBooking(booking);
                    }
                  }}
                  className="cursor-pointer p-4 transition-colors hover:bg-emerald-50/40 active:bg-emerald-50/60"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-sm font-bold text-white">
                      {getInitials(booking.guestName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900">{booking.guestName}</p>
                          <p className="text-xs text-slate-500">
                              {formatBookingGuestLine(booking)}
                          </p>
                        </div>
                        <ReservationStatusBadge status={booking.status} />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5">
                          <BedDouble className="h-3 w-3" />
                          {booking.roomNo} · {booking.roomType}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5">
                          <Calendar className="h-3 w-3" />
                          {booking.checkIn}
                        </span>
                          {booking.createdAt && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5">
                              Created {formatBookingCreatedAt(booking.createdAt)}
                            </span>
                          )}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <p className="font-bold text-slate-900">
                          {formatBalance(booking.balance)}
                        </p>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            {(() => {
                              const action = primaryAction(booking);
                              if (!action) return null;
                              const ActionIcon = action.icon;
                              return (
                          <Link
                                  href={action.href}
                                  title={action.title}
                                  className={cn("rounded-lg p-2", action.className)}
                          >
                                  <ActionIcon className="h-4 w-4" />
                          </Link>
                              );
                            })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>

            <div className="hidden min-h-[280px] overflow-x-auto md:block">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="rounded border-slate-300"
                        aria-label="Select all"
                      />
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Guest
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Stay
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Created
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Balance
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th className="w-40 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {listRows.flatMap((row, idx) => {
                    if (row.kind === "group") {
                      const expanded = expandedGroups.has(row.groupId);
                      const balance = row.children.reduce(
                        (sum, c) => sum + Number(c.balance ?? 0),
                        0,
                      );
                      const checkIn = row.children
                        .map((c) => c.checkIn)
                        .filter(Boolean)
                        .sort()[0];
                      const checkOut = [...row.children]
                        .map((c) => c.checkOut)
                        .filter(Boolean)
                        .sort()
                        .at(-1);
                      const parentSelected = row.children.every((c) =>
                        selected.has(c.id),
                      );
                      const nodes = [
                        <tr
                          key={`g-${row.groupId}`}
                          role="link"
                          tabIndex={0}
                          onClick={() =>
                            router.push(`/frontoffice/group-booking/${row.groupId}`)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              router.push(
                                `/frontoffice/group-booking/${row.groupId}`,
                              );
                            }
                          }}
                          className="cursor-pointer bg-indigo-50/30 transition-colors hover:bg-indigo-50/60"
                        >
                          <td
                            className="px-4 py-3.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={parentSelected}
                              onChange={() => {
                                setSelected((prev) => {
                                  const next = new Set(prev);
                                  if (parentSelected) {
                                    for (const c of row.children) next.delete(c.id);
                                  } else {
                                    for (const c of row.children) next.add(c.id);
                                  }
                                  return next;
                                });
                              }}
                              className="rounded border-slate-300"
                              aria-label={`Select group ${row.groupNo ?? row.groupName}`}
                            />
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-slate-800 text-xs font-bold text-white">
                                {getInitials(row.groupName)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900">
                                  {row.groupName}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {[row.groupNo, `${row.children.length} rooms`]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </p>
                                <p className="text-[11px] text-indigo-600">Group booking</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="font-medium text-slate-800">
                              {row.children.length} rooms · TBA / assigned
                            </p>
                            <p className="text-xs text-slate-500">
                              {checkIn ?? "—"} – {checkOut ?? "—"}
                            </p>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-sm text-slate-800">
                              {formatBookingCreatedAt(
                                [...row.children]
                                  .map((c) => c.createdAt)
                                  .filter(Boolean)
                                  .sort()
                                  .at(-1),
                              )}
                            </p>
                          </td>
                          <td className="px-4 py-3.5">
                            <p
                              className={cn(
                                "font-semibold",
                                balance > 0 ? "text-slate-900" : "text-emerald-700",
                              )}
                            >
                              {formatBalance(balance)}
                            </p>
                          </td>
                          <td className="px-4 py-3.5">
                            <ReservationStatusBadge
                              status={deriveGroupStatus(row.children)}
                            />
                          </td>
                          <td
                            className="px-4 py-3.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="ml-auto grid w-[7.5rem] grid-cols-3 place-items-center gap-0">
                              <Link
                                href={`/frontoffice/group-booking/${row.groupId}`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-teal-700 hover:bg-teal-50"
                                title="Open group"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                              <div
                                className="relative"
                                ref={
                                  openMenu === `group:${row.groupId}`
                                    ? menuContainerRef
                                    : undefined
                                }
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenMenu(
                                      openMenu === `group:${row.groupId}`
                                        ? null
                                        : `group:${row.groupId}`,
                                    )
                                  }
                                  className="cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                  aria-label="Group actions"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>
                                {openMenu === `group:${row.groupId}` ? (
                                  <div className="absolute right-0 top-full z-30 mt-1 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                                    {[
                                      {
                                        icon: ExternalLink,
                                        label: "Open group",
                                        onClick: () =>
                                          router.push(
                                            `/frontoffice/group-booking/${row.groupId}`,
                                          ),
                                      },
                                      ...(groupHasNoShowEligible(row.children)
                                        ? [
                                            {
                                              icon: UserX,
                                              label: "Mark No Show",
                                              onClick: () =>
                                                setGroupAction({
                                                  type: "no-show",
                                                  groupId: row.groupId,
                                                  groupName: row.groupName,
                                                  groupNo: row.groupNo,
                                                  children: row.children,
                                                }),
                                              danger: true,
                                            },
                                          ]
                                        : []),
                                      ...(groupHasCancelable(row.children)
                                        ? [
                                            {
                                              icon: XCircle,
                                              label: "Cancel all",
                                              onClick: () =>
                                                setGroupAction({
                                                  type: "cancel",
                                                  groupId: row.groupId,
                                                  groupName: row.groupName,
                                                  groupNo: row.groupNo,
                                                  children: row.children,
                                                }),
                                              danger: true,
                                            },
                                          ]
                                        : []),
                                    ].map(({ icon: Icon, label, onClick, danger }) => (
                                      <button
                                        key={label}
                                        type="button"
                                        onClick={() => {
                                          onClick();
                                          setOpenMenu(null);
                                        }}
                                        className={cn(
                                          "flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50",
                                          danger
                                            ? "text-red-600 hover:bg-red-50"
                                            : "text-slate-700",
                                        )}
                                      >
                                        <Icon className="h-3.5 w-3.5" />
                                        {label}
                                      </button>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleGroupExpanded(row.groupId)}
                                className={cn(
                                  "cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-indigo-100",
                                  expanded ? "text-indigo-700" : "text-slate-400 hover:text-slate-700",
                                )}
                                title={expanded ? "Hide rooms" : "Show rooms"}
                                aria-label={expanded ? "Collapse group rooms" : "Expand group rooms"}
                                aria-expanded={expanded}
                              >
                                {expanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>,
                      ];

                      if (expanded) {
                        for (const [cIdx, booking] of row.children.entries()) {
                          const isNearBottom =
                            idx >= Math.max(0, listRows.length - 2) &&
                            cIdx >= Math.max(0, row.children.length - 2);
                          const isMenuOpen = openMenu === booking.id;
                          nodes.push(
                            <tr
                              key={booking.id}
                              onClick={() => setViewBooking(booking)}
                              className="cursor-pointer bg-slate-50/80 transition-colors hover:bg-emerald-50/30"
                            >
                              <td
                                className="px-4 py-3"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  checked={selected.has(booking.id)}
                                  onChange={() => toggleOne(booking.id)}
                                  className="ml-6 rounded border-slate-300"
                                  aria-label={`Select ${displayBookingNo(booking)}`}
                                />
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3 pl-6">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-[10px] font-bold text-slate-700">
                                    {getInitials(booking.guestName)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium text-slate-900">
                                      {booking.guestName || "Unassigned"}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {formatBookingGuestLine(booking)}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-medium text-slate-800">
                                  Room {booking.roomNo ?? "TBA"}
                                  {booking.roomType ? ` · ${booking.roomType}` : ""}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {booking.checkIn} – {booking.checkOut}
                                </p>
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-sm text-slate-800">
                                  {formatBookingCreatedAt(booking.createdAt)}
                                </p>
                              </td>
                              <td className="px-4 py-3">
                                <p
                                  className={cn(
                                    "font-semibold",
                                    booking.balance > 0
                                      ? "text-slate-900"
                                      : "text-emerald-700",
                                  )}
                                >
                                  {formatBalance(booking.balance)}
                                </p>
                              </td>
                              <td className="px-4 py-3">
                                <ReservationStatusBadge status={booking.status} />
                              </td>
                              <td
                                className="px-4 py-3"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="ml-auto grid w-[7.5rem] grid-cols-3 place-items-center gap-0">
                                  {(() => {
                                    const action = primaryAction(booking);
                                    if (!action) {
                                      return <span className="inline-flex h-8 w-8 items-center justify-center" aria-hidden="true" />;
                                    }
                                    const ActionIcon = action.icon;
                                    return (
                                      <Link
                                        href={action.href}
                                        className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg", action.className)}
                                        title={action.title}
                                      >
                                        <ActionIcon className="h-4 w-4" />
                                      </Link>
                                    );
                                  })()}
                                  <div
                                    className="relative"
                                    ref={isMenuOpen ? menuContainerRef : undefined}
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setOpenMenu(isMenuOpen ? null : booking.id)
                                      }
                                      className="cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                      aria-label="More actions"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </button>
                                    {isMenuOpen && (
                                      <div
                                        className={cn(
                                          "absolute right-0 z-30 w-40 rounded-xl border border-slate-200 bg-white py-1 shadow-lg",
                                          isNearBottom
                                            ? "bottom-full mb-1"
                                            : "top-full mt-1",
                                        )}
                                      >
                                        {[
                                          {
                                            icon: Pencil,
                                            label: "Edit",
                                            onClick: () =>
                                              router.push(
                                                `/frontoffice/reservation/new?bookingId=${encodeURIComponent(booking.id)}`,
                                              ),
                                          },
                                          {
                                            icon: Printer,
                                            label: "Print",
                                            onClick: () => handlePrintBooking(booking),
                                          },
                                          ...(!booking.groupId &&
                                          isNoShowEligible(booking)
                                            ? [
                                                {
                                                  icon: UserX,
                                                  label: "Mark No Show",
                                                  onClick: () =>
                                                    setNoShowBooking(booking),
                                                  danger: true,
                                                },
                                              ]
                                            : []),
                                          ...(booking.status === "Cancelled" ||
                                          booking.status === "Checked Out" ||
                                          booking.status === "No Show"
                                            ? []
                                            : [
                                                {
                                                  icon: XCircle,
                                                  label: "Cancel",
                                                  onClick: () =>
                                                    setCancelBooking(booking),
                                                  danger: true,
                                                },
                                              ]),
                                        ].map(
                                          ({ icon: Icon, label, onClick, danger }) => (
                                            <button
                                              key={label}
                                              type="button"
                                              onClick={() => {
                                                onClick();
                                                setOpenMenu(null);
                                              }}
                                              className={cn(
                                                "flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50",
                                                danger
                                                  ? "text-red-600 hover:bg-red-50"
                                                  : "text-slate-700",
                                              )}
                                            >
                                              <Icon className="h-3.5 w-3.5" />
                                              {label}
                                            </button>
                                          ),
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <span className="inline-flex h-8 w-8 items-center justify-center" aria-hidden="true" />
                                </div>
                              </td>
                            </tr>,
                          );
                        }
                      }

                      return nodes;
                    }

                    const booking = row.booking;
                    const isNearBottom = idx >= Math.max(0, listRows.length - 2);
                    const isMenuOpen = openMenu === booking.id;
                    return [
                    <tr
                      key={booking.id}
                      onClick={() => setViewBooking(booking)}
                      className="group cursor-pointer transition-colors hover:bg-emerald-50/30"
                    >
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(booking.id)}
                          onChange={() => toggleOne(booking.id)}
                          className="rounded border-slate-300"
                            aria-label={`Select ${displayBookingNo(booking)}`}
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 text-xs font-bold text-white transition-colors group-hover:from-emerald-600 group-hover:to-emerald-800">
                            {getInitials(booking.guestName)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">{booking.guestName}</p>
                            <p className="text-xs text-slate-500">
                                {formatBookingGuestLine(booking)}
                            </p>
                            <p className="text-[11px] text-slate-400">{booking.source}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-slate-800">
                          Room {booking.roomNo} · {booking.roomType}
                        </p>
                        <p className="text-xs text-slate-500">
                          {booking.checkIn} – {booking.checkOut}
                        </p>
                      </td>
                        <td className="px-4 py-3.5">
                          <p className="text-sm text-slate-800">
                            {formatBookingCreatedAt(booking.createdAt)}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p
                          className={cn(
                            "font-semibold",
                            booking.balance > 0 ? "text-slate-900" : "text-emerald-700",
                          )}
                        >
                          {formatBalance(booking.balance)}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <ReservationStatusBadge status={booking.status} />
                      </td>
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <div className="ml-auto grid w-[7.5rem] grid-cols-3 place-items-center gap-0">
                            {(() => {
                              const action = primaryAction(booking);
                              if (!action) {
                                return <span className="inline-flex h-8 w-8 items-center justify-center" aria-hidden="true" />;
                              }
                              const ActionIcon = action.icon;
                              return (
                          <Link
                                  href={action.href}
                                  className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg", action.className)}
                                  title={action.title}
                                >
                                  <ActionIcon className="h-4 w-4" />
                          </Link>
                              );
                            })()}
                            <div
                              className="relative"
                              ref={isMenuOpen ? menuContainerRef : undefined}
                            >
                            <button
                              type="button"
                              onClick={() =>
                                  setOpenMenu(isMenuOpen ? null : booking.id)
                              }
                                className="cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                              aria-label="More actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                              {isMenuOpen && (
                                <div
                                  className={cn(
                                    "absolute right-0 z-30 w-40 rounded-xl border border-slate-200 bg-white py-1 shadow-lg",
                                    isNearBottom ? "bottom-full mb-1" : "top-full mt-1",
                                  )}
                                >
                                  {[
                                    {
                                      icon: Pencil,
                                      label: "Edit",
                                      onClick: () =>
                                        router.push(
                                          `/frontoffice/reservation/new?bookingId=${encodeURIComponent(booking.id)}`,
                                        ),
                                    },
                                    {
                                      icon: Printer,
                                      label: "Print",
                                      onClick: () => handlePrintBooking(booking),
                                    },
                                    ...(!booking.groupId &&
                                    isNoShowEligible(booking)
                                      ? [
                                          {
                                            icon: UserX,
                                            label: "Mark No Show",
                                            onClick: () => setNoShowBooking(booking),
                                            danger: true,
                                          },
                                        ]
                                      : []),
                                    ...(booking.status === "Cancelled" ||
                                    booking.status === "Checked Out" ||
                                    booking.status === "No Show"
                                      ? []
                                      : [
                                    {
                                      icon: XCircle,
                                      label: "Cancel",
                                      onClick: () => setCancelBooking(booking),
                                      danger: true,
                                    },
                                        ]),
                                  ].map(({ icon: Icon, label, onClick, danger }) => (
                                    <button
                                      key={label}
                                      type="button"
                                      onClick={() => {
                                        onClick();
                                        setOpenMenu(null);
                                      }}
                                      className={cn(
                                        "flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50",
                                        danger
                                          ? "text-red-600 hover:bg-red-50"
                                          : "text-slate-700",
                                      )}
                                    >
                                      <Icon className="h-3.5 w-3.5" />
                                      {label}
                                    </button>
                                  ))}
                                </div>
                            )}
                          </div>
                            <span className="inline-flex h-8 w-8 items-center justify-center" aria-hidden="true" />
                        </div>
                      </td>
                      </tr>,
                    ];
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 text-center text-[11px] text-slate-400">
              Showing {listRows.length} row{listRows.length !== 1 ? "s" : ""} · {filtered.length} room booking{filtered.length !== 1 ? "s" : ""}
              {activeFilter !== "all" &&
                ` · filtered by ${statusFilters.find((f) => f.id === activeFilter)?.label}`}
              {hasActiveAdvancedFilters && " · advanced filters on"}
              {" · "}
              Use ▾ after ⋯ on a group to show rooms · click a group to open details · click a room for booking details
            </div>
          </>
        )}
      </div>

      <BookingDetailDrawer
        booking={viewBooking}
        onClose={closeBookingDetail}
        onCancel={(b) => {
          closeBookingDetail();
          setCancelBooking(b);
        }}
        onNoShow={(b) => {
          closeBookingDetail();
          setNoShowBooking(b);
        }}
      />

      <ConfirmModal
        open={!!cancelBooking}
        onClose={() => setCancelBooking(null)}
        onConfirm={handleCancel}
        title="Cancel Reservation"
        message={`Are you sure you want to cancel booking ${cancelBooking ? displayBookingNo(cancelBooking) : ""} for ${cancelBooking?.guestName}? This action cannot be undone.`}
        confirmLabel="Cancel Booking"
        variant="danger"
      />

      <ConfirmModal
        open={!!noShowBooking}
        onClose={() => setNoShowBooking(null)}
        onConfirm={handleNoShow}
        title="Mark as No Show"
        message={`Guest did not arrive for booking ${noShowBooking ? displayBookingNo(noShowBooking) : ""} (${noShowBooking?.guestName}). The reservation will be marked as No Show and the room will be released.`}
        confirmLabel="Mark No Show"
        variant="danger"
      />

      <ConfirmModal
        open={!!groupAction}
        onClose={() => setGroupAction(null)}
        onConfirm={() => void handleGroupAction()}
        title={
          groupAction?.type === "cancel"
            ? "Cancel group bookings"
            : "Mark group as No Show"
        }
        message={
          groupAction?.type === "cancel"
            ? `Cancel all eligible room bookings in ${groupAction.groupNo || groupAction.groupName} (${groupAction.children.length} rooms)? This cannot be undone.`
            : `Mark all eligible room bookings in ${groupAction?.groupNo || groupAction?.groupName} as No Show? Rooms will be released.`
        }
        confirmLabel={
          groupAction?.type === "cancel" ? "Cancel all rooms" : "Mark No Show"
        }
        variant="danger"
      />
    </div>
  );
}
