"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import {
  BedDouble,
  Calendar,
  Download,
  LogIn,
  LogOut,
  MoreHorizontal,
  Pencil,
  Plus,
  Printer,
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
import { cn } from "@/lib/utils";
import { displayBookingNo } from "@/lib/booking-display";
import { formatBookingGuestLine } from "@/lib/reservation-display";
import { isArrivingToday } from "@/lib/reservation-dates";
import { BookingDetailDrawer } from "./BookingDetailDrawer";
import { ReservationStatusBadge } from "./ReservationStatusBadge";
import { ReservationSummaryCards } from "./ReservationSummaryCards";

const statusFilters: { id: ReservationFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "arriving-today", label: "Arriving Today" },
  { id: "in-house", label: "In-House" },
  { id: "reserved", label: "Reserved" },
  { id: "checked-out", label: "Checked Out" },
  { id: "cancelled", label: "Cancelled" },
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
      href: "/frontoffice/check-out",
      icon: LogOut,
      title: "Check out",
      className: "text-orange-700 hover:bg-orange-50",
    };
  }
  if (booking.status === "Reserved" || booking.status === "Confirmed") {
    return {
      href: "/frontoffice/check-in",
      icon: LogIn,
      title: "Check in",
      className: "text-emerald-700 hover:bg-emerald-50",
    };
  }
  return null;
}

function matchesFilter(booking: ReservationBooking, filter: ReservationFilter) {
  switch (filter) {
    case "all":
      return true;
    case "arriving-today":
      return (
        isArrivingToday(booking) &&
        booking.status !== "Cancelled" &&
        booking.status !== "Checked Out"
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
    case "outstanding":
      return booking.balance > 0 && booking.status !== "Cancelled";
    default:
      return true;
  }
}

export function AllBookingsView() {
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
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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

  const sourceOptions = useMemo(
    () => [...new Set(bookings.map((b) => b.source))].sort(),
    [bookings],
  );

  const filterCounts = useMemo(
    () =>
      Object.fromEntries(
        statusFilters.map((f) => [
          f.id,
          bookings.filter((b) => matchesFilter(b, f.id)).length,
        ]),
      ) as Record<ReservationFilter, number>,
    [bookings],
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
    return bookings.filter((booking) => {
      const matchesSearch =
        !query ||
        booking.guestName?.toLowerCase().includes(query) ||
        displayBookingNo(booking).toLowerCase().includes(query) ||
        (booking.guestNo ?? "").toLowerCase().includes(query) ||
        booking.phone?.toLowerCase().includes(query) ||
        booking.roomNo?.toLowerCase().includes(query) ||
        booking.roomType?.toLowerCase().includes(query) ||
        booking.source?.toLowerCase().includes(query);
      const matchesSource = sourceFilter === "all" || booking.source === sourceFilter;
      const matchesRoomType =
        roomTypeFilter === "all" || booking.roomType === roomTypeFilter;
      return (
        matchesSearch &&
        matchesSource &&
        matchesRoomType &&
        matchesFilter(booking, activeFilter)
      );
    });
  }, [bookings, search, activeFilter, sourceFilter, roomTypeFilter]);

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

      <FOPageHeader
        eyebrow="Reservations"
        title="All Bookings"
        description="Search, filter, and manage all reservations from a single view."
        badge={
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {filtered.length} of {bookings.length} shown
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
              {filtered.map((booking) => (
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
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[860px] text-left text-sm">
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
                      Balance
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th className="w-28 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((booking) => (
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
                        <div className="flex items-center justify-end gap-1">
                          {(() => {
                            const action = primaryAction(booking);
                            if (!action) return null;
                            const ActionIcon = action.icon;
                            return (
                              <Link
                                href={action.href}
                                className={cn("rounded-lg p-2", action.className)}
                                title={action.title}
                              >
                                <ActionIcon className="h-4 w-4" />
                              </Link>
                            );
                          })()}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenMenu(openMenu === booking.id ? null : booking.id)
                              }
                              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                              aria-label="More actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            {openMenu === booking.id && (
                              <>
                                <button
                                  type="button"
                                  className="fixed inset-0 z-10"
                                  onClick={() => setOpenMenu(null)}
                                  aria-label="Close menu"
                                />
                                <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                                  {[
                                    {
                                      icon: Pencil,
                                      label: "Edit",
                                      onClick: () => setToast(`Edit ${displayBookingNo(booking)} coming soon.`),
                                    },
                                    {
                                      icon: Printer,
                                      label: "Print",
                                      onClick: () => window.print(),
                                    },
                                    ...(booking.status === "Cancelled" ||
                                      booking.status === "Checked Out"
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
                                        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50",
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
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 text-center text-[11px] text-slate-400">
              Showing {filtered.length} booking{filtered.length !== 1 ? "s" : ""}
              {activeFilter !== "all" &&
                ` · filtered by ${statusFilters.find((f) => f.id === activeFilter)?.label}`}
              {hasActiveAdvancedFilters && " · advanced filters on"}
              {" · "}
              Click a row to view full details
            </div>
          </>
        )}
      </div>

      <BookingDetailDrawer
        booking={viewBooking}
        onClose={() => setViewBooking(null)}
        onCancel={(b) => {
          setViewBooking(null);
          setCancelBooking(b);
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
    </div>
  );
}
