"use client";

import { useEffect, useState, useMemo } from "react";
import {
  summaryStats,
  guestData,
  revenueData,
  bookingsChartData,
  platformData,
  occupancyData,
  ratingsData,
  activityLog,
  navItems,
  currentUser,
} from "@/app/data";
import type { Booking } from "@/app/data/types";
import type { ReservationBooking } from "@/app/data/types";
import { displayBookingNo } from "@/lib/booking-display";
import { isArrivingToday } from "@/lib/reservation-dates";
import { reservationService } from "@/services/front-office";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/ui/StatCard";
import { GuestsChart } from "@/components/charts/GuestsChart";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { BookingsChart } from "@/components/charts/BookingsChart";
import { PlatformChart } from "@/components/charts/PlatformChart";
import { RoomOccupancy } from "@/components/dashboard/RoomOccupancy";
import { OverallRatings } from "@/components/dashboard/OverallRatings";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { BookingList } from "@/components/dashboard/BookingList";
import { WakeUpCallsAlert } from "@/components/frontoffice/WakeUpCallsAlert";
import type { HKRoom } from "@/components/housekeeping/HousekeepingTypes";
import { normalizeHkRoom } from "@/components/housekeeping/roomUtils";
import { hkRoomService } from "@/services/housekeeping";
import { wakeUpCallService } from "@/services/front-office";
import type { WakeUpCall } from "@/app/data/frontoffice/modules";

function mapReservationStatus(status: string): Booking["status"] {
  switch (status) {
    case "Checked In":
    case "In-House":
      return "Checked In";
    case "Cancelled":
      return "Canceled";
    case "Reserved":
    case "Confirmed":
      return "Confirmed";
    default:
      return "Pending";
  }
}

function mapReservationToBooking(reservation: ReservationBooking): Booking {
  const nights = reservation.nights ?? 1;
  return {
    id: displayBookingNo(reservation),
    guestName: reservation.guestName ?? "Guest",
    roomType: reservation.roomType ?? "—",
    roomNo: reservation.roomNo ?? "TBA",
    duration: `${nights} night${nights !== 1 ? "s" : ""}`,
    checkIn: reservation.checkIn,
    checkOut: reservation.checkOut,
    status: mapReservationStatus(reservation.status),
  };
}

export function MainDashboardView() {
  const [rooms, setRooms] = useState<HKRoom[]>([]);
  const [wakeUpCalls, setWakeUpCalls] = useState<WakeUpCall[]>([]);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const apiRooms = await hkRoomService.list();
        if (!cancelled) {
          setRooms(apiRooms.map((r) => normalizeHkRoom(r)));
        }
      } catch {
        if (!cancelled) setRooms([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const calls = await wakeUpCallService.list();
        if (!cancelled) setWakeUpCalls(calls);
      } catch {
        if (!cancelled) setWakeUpCalls([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setBookingsLoading(true);
        const reservations = await reservationService.list();
        if (cancelled) return;
        const rows = reservations
          .filter(
            (r) =>
              isArrivingToday(r) &&
              r.status !== "Cancelled" &&
              r.status !== "No Show" &&
              r.status !== "Checked Out",
          )
          .map(mapReservationToBooking);
        setTodayBookings(rows);
      } catch {
        if (!cancelled) setTodayBookings([]);
      } finally {
        if (!cancelled) setBookingsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const computedOccupancy = useMemo(() => {
    if (!rooms.length) return occupancyData;
    const total = rooms.length;
    const occupied = rooms.filter((r) => r.status === "Occupied").length;
    const vacantReady = rooms.filter((r) => r.status === "Vacant" || r.status === "Inspected").length;
    const vacantDirty = rooms.filter((r) => r.status === "Dirty").length;

    const occRate = Math.round((occupied / total) * 100);

    return {
      percentage: occRate,
      occupied,
      total,
      statuses: [
        { label: "Occupied", count: occupied, color: "#16a34a" },
        { label: "Vacant", count: vacantReady, color: "#15803d" },
        { label: "Dirty", count: vacantDirty, color: "#f59e0b" },
      ],
    };
  }, [rooms]);

  return (
    <AppShell
      navItems={navItems}
      user={currentUser}
    >
      <div className="min-w-0 space-y-4 sm:space-y-6 lg:space-y-8">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          {summaryStats.map((stat, index) => (
            <StatCard key={index} stat={stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          <div className="min-w-0">
            <GuestsChart data={guestData} />
          </div>
          <div className="min-w-0">
            <RevenueChart data={revenueData} />
          </div>
          <div className="min-w-0 md:col-span-2 lg:col-span-1">
            <WakeUpCallsAlert calls={wakeUpCalls} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          <div className="min-w-0">
            <BookingsChart data={bookingsChartData} />
          </div>
          <div className="min-w-0">
            <PlatformChart data={platformData} />
          </div>
          <div className="min-w-0 md:col-span-2 lg:col-span-1">
            <RoomOccupancy data={computedOccupancy} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8">
          <div className="min-w-0">
            <OverallRatings data={ratingsData} />
          </div>
          <div className="min-w-0 lg:col-span-2">
            <RecentActivity activities={activityLog} />
          </div>
        </div>

        <div className="min-w-0">
          <BookingList bookings={todayBookings} loading={bookingsLoading} />
        </div>
      </div>
    </AppShell>
  );
}
