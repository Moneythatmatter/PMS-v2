"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BedDouble,
  Calendar,
  ChevronDown,
  Download,
  LogIn,
  MoreHorizontal,
  Pencil,
  Plus,
  Printer,
  Search,
  XCircle,
} from "lucide-react";
import type { ReservationBooking, ReservationFilter } from "@/app/data/types";
import { reservationSummaryStats } from "@/app/data";
import { Button } from "@/components/ui/Button";
import {
  AlertBanner,
  ConfirmModal,
  EmptyState,
  FOPageHeader,
} from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";
import { BookingDetailDrawer } from "./BookingDetailDrawer";
import { ReservationStatusBadge } from "./ReservationStatusBadge";
import { ReservationSummaryCards } from "./ReservationSummaryCards";

const filters: { id: ReservationFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "arriving-today", label: "Arriving Today" },
  { id: "confirmed", label: "Confirmed" },
  { id: "in-house", label: "In-House" },
  { id: "reserved", label: "Reserved" },
  { id: "checked-out", label: "Checked Out" },
  { id: "cancelled", label: "Cancelled" },
];

function formatBalance(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function matchesFilter(booking: ReservationBooking, filter: ReservationFilter) {
  switch (filter) {
    case "all":
      return true;
    case "arriving-today":
      return booking.arrivingToday === true;
    case "confirmed":
      return booking.status === "Confirmed";
    case "in-house":
      return booking.status === "Checked In" || booking.status === "In-House";
    case "reserved":
      return booking.status === "Reserved";
    case "checked-out":
      return booking.status === "Checked Out";
    case "cancelled":
      return booking.status === "Cancelled";
    default:
      return true;
  }
}

interface AllBookingsViewProps {
  bookings: ReservationBooking[];
}

export function AllBookingsView({ bookings: initialBookings }: AllBookingsViewProps) {
  const [bookings, setBookings] = useState(initialBookings);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ReservationFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewBooking, setViewBooking] = useState<ReservationBooking | null>(null);
  const [cancelBooking, setCancelBooking] = useState<ReservationBooking | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return bookings.filter((booking) => {
      const query = search.toLowerCase();
      const matchesSearch =
        booking.guestName.toLowerCase().includes(query) ||
        booking.id.toLowerCase().includes(query) ||
        booking.phone.includes(query) ||
        booking.roomNo.includes(query);
      return matchesSearch && matchesFilter(booking, activeFilter);
    });
  }, [bookings, search, activeFilter]);

  const filterCounts = useMemo(
    () =>
      Object.fromEntries(
        filters.map((f) => [
          f.id,
          bookings.filter((b) => matchesFilter(b, f.id)).length,
        ]),
      ) as Record<ReservationFilter, number>,
    [bookings],
  );

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

  const handleCancel = () => {
    if (!cancelBooking) return;
    setBookings((prev) =>
      prev.map((b) =>
        b.id === cancelBooking.id ? { ...b, status: "Cancelled" as const } : b,
      ),
    );
    setToast(`Booking ${cancelBooking.id} has been cancelled.`);
    setCancelBooking(null);
  };

  const handleExport = () => {
    const rows = filtered.map(
      (b) =>
        `${b.id},${b.guestName},${b.roomNo},${b.checkIn},${b.checkOut},${b.status},${b.balance}`,
    );
    const csv = ["Booking ID,Guest,Room,Check-in,Check-out,Status,Balance", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reservations.csv";
    a.click();
    URL.revokeObjectURL(url);
    setToast("Reservation list exported as CSV.");
  };

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
          <Link href="/frontoffice/reservation/new">
            <Button size="sm" className="gap-1.5 bg-blue-600 shadow-sm hover:bg-blue-700">
              <Plus className="h-3.5 w-3.5" />
              New Reservation
            </Button>
          </Link>
        }
      />

      <ReservationSummaryCards
        stats={reservationSummaryStats}
        activeFilter={activeFilter}
        onFilterClick={setActiveFilter}
      />

      {/* Toolbar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search guest, booking ID, phone, or room…"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-10 text-sm transition-colors focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="sm" className="h-11 gap-1.5 rounded-xl" onClick={handleExport}>
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
              <Button variant="outline" size="sm" className="h-11 gap-1.5 rounded-xl">
                More filters
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 rounded-xl bg-slate-100/80 p-1">
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-all sm:text-sm",
                  activeFilter === filter.id
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                {filter.label}
                <span className={cn("ml-1", activeFilter === filter.id ? "text-blue-400" : "text-slate-400")}>
                  {filterCounts[filter.id]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {selected.size > 0 && (
          <div className="mt-4 flex items-center justify-between rounded-xl bg-blue-50 px-4 py-2.5">
            <span className="text-sm font-medium text-blue-800">
              {selected.size} booking{selected.size !== 1 ? "s" : ""} selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>Export selected</Button>
              <button type="button" className="text-xs font-medium text-blue-600 hover:underline" onClick={() => setSelected(new Set())}>
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <EmptyState
            title="No bookings found"
            description="Try adjusting your search or filter criteria."
            action={
              <Link href="/frontoffice/reservation/new">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Create Reservation</Button>
              </Link>
            }
          />
        ) : (
          <>
            {/* Mobile */}
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
                  className="cursor-pointer p-4 transition-colors hover:bg-blue-50/40 active:bg-blue-50/60"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
                      {getInitials(booking.guestName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900">{booking.guestName}</p>
                          <p className="text-xs text-slate-500">{booking.id} · {booking.phone}</p>
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
                        <p className="font-bold text-slate-900">{formatBalance(booking.balance)}</p>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Link href="/frontoffice/check-in" className="rounded-lg p-2 text-blue-600 hover:bg-blue-50">
                            <LogIn className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="w-10 px-4 py-3">
                      <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-slate-300" aria-label="Select all" />
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Guest</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Stay</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Balance</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                    <th className="w-28 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((booking) => (
                    <tr
                      key={booking.id}
                      onClick={() => setViewBooking(booking)}
                      className="group cursor-pointer transition-colors hover:bg-blue-50/30"
                    >
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(booking.id)}
                          onChange={() => toggleOne(booking.id)}
                          className="rounded border-slate-300"
                          aria-label={`Select ${booking.id}`}
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 text-xs font-bold text-white group-hover:from-blue-500 group-hover:to-indigo-600 transition-colors">
                            {getInitials(booking.guestName)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">{booking.guestName}</p>
                            <p className="text-xs text-slate-500">{booking.id} · {booking.phone}</p>
                            <p className="text-[11px] text-slate-400">{booking.source}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-slate-800">
                          <span className="text-slate-500">Room</span> {booking.roomNo}
                          <span className="mx-1 text-slate-300">·</span>
                          {booking.roomType}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {booking.checkIn} – {booking.checkOut}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn("font-semibold", booking.balance > 0 ? "text-slate-900" : "text-slate-400")}>
                          {formatBalance(booking.balance)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <ReservationStatusBadge status={booking.status} />
                      </td>
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href="/frontoffice/check-in"
                            title="Check-in"
                            className="rounded-lg p-2 text-blue-500 transition-colors hover:bg-blue-50"
                          >
                            <LogIn className="h-4 w-4" />
                          </Link>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setOpenMenu(openMenu === booking.id ? null : booking.id)}
                              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                              aria-label="More actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            {openMenu === booking.id && (
                              <>
                                <button type="button" className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} aria-label="Close menu" />
                                <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                                  {[
                                    { icon: Pencil, label: "Edit", onClick: () => setToast(`Edit ${booking.id} coming soon.`) },
                                    { icon: Printer, label: "Print", onClick: () => window.print() },
                                    { icon: XCircle, label: "Cancel", onClick: () => setCancelBooking(booking), danger: true },
                                  ].map(({ icon: Icon, label, onClick, danger }) => (
                                    <button
                                      key={label}
                                      type="button"
                                      onClick={() => { onClick(); setOpenMenu(null); }}
                                      className={cn(
                                        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50",
                                        danger ? "text-red-600 hover:bg-red-50" : "text-slate-700",
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
              {activeFilter !== "all" && ` · filtered by ${filters.find((f) => f.id === activeFilter)?.label}`}
              {" · "}Click a row to view full details
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
        message={`Are you sure you want to cancel booking ${cancelBooking?.id} for ${cancelBooking?.guestName}? This action cannot be undone.`}
        confirmLabel="Cancel Booking"
        variant="danger"
      />
    </div>
  );
}
