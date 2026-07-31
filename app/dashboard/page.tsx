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
  bookings,
  navItems,
  currentUser,
  wakeUpCalls,
} from "@/app/data";
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
import { initialHKRooms } from "@/app/data/housekeepingData";
import type { HKRoom } from "@/components/housekeeping/HousekeepingTypes";

export default function DashboardPage() {
  const [rooms, setRooms] = useState<HKRoom[]>([]);

  useEffect(() => {
    const loadRooms = () => {
      const stored = localStorage.getItem("hk_rooms");
      if (stored) {
        setRooms(JSON.parse(stored));
      } else {
        localStorage.setItem("hk_rooms", JSON.stringify(initialHKRooms));
        setRooms(initialHKRooms);
      }
    };
    loadRooms();
    window.addEventListener("storage", loadRooms);
    return () => window.removeEventListener("storage", loadRooms);
  }, []);

  const computedOccupancy = useMemo(() => {
    if (!rooms || rooms.length === 0) return occupancyData;

    const total = rooms.length;
    const occupied = rooms.filter(
      (r) => r.foStatus === "Occupied" || r.status.includes("Occupied")
    ).length;
    const percentage = Math.round((occupied / total) * 100);

    const vacantClean = rooms.filter(
      (r) => (r.status === "Vacant Ready" || r.hkStatus === "Inspected") && r.foStatus === "Vacant"
    ).length;
    const dirty = rooms.filter(
      (r) => r.status.includes("Dirty") || r.status === "Cleaning" || r.status === "Inspection Pending"
    ).length;
    const blocked = rooms.filter(
      (r) => r.status === "Blocked" || r.status === "Out of Order" || r.status === "Out of Service" || r.foStatus === "Blocked"
    ).length;

    return {
      percentage,
      occupied,
      total,
      statuses: [
        { label: "Occupied", count: occupied, color: "#16a34a" },
        { label: "Available (Clean)", count: vacantClean, color: "#22c55e" },
        { label: "Dirty / Not Ready", count: dirty, color: "#f97316" },
        { label: "Blocked / Maintenance", count: blocked, color: "#a855f7" },
      ],
    };
  }, [rooms]);

  const computedStats = useMemo(() => {
    if (!rooms || rooms.length === 0) return summaryStats;
    const occupied = rooms.filter(
      (r) => r.foStatus === "Occupied" || r.status.includes("Occupied")
    ).length;

    return summaryStats.map((stat) => {
      if (stat.title === "Check In") {
        return {
          ...stat,
          value: occupied.toString(),
        };
      }
      return stat;
    });
  }, [rooms]);

  return (
    <AppShell navItems={navItems} user={currentUser}>
      <div className="space-y-4 sm:space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {computedStats.map((stat) => (
            <StatCard key={stat.title} stat={stat} />
          ))}
        </div>

        {/* Charts + booking list (left) | sidebar (right) */}
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
          <div className="space-y-4 xl:col-span-8">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <GuestsChart data={guestData} />
              </div>
              <div className="lg:col-span-2">
                <RevenueChart data={revenueData} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <BookingsChart data={bookingsChartData} />
              <PlatformChart data={platformData} />
            </div>
            <BookingList bookings={bookings} />
          </div>

          <div className="space-y-4 xl:col-span-4">
            <WakeUpCallsAlert calls={wakeUpCalls} />
            <RoomOccupancy data={computedOccupancy} />
            <OverallRatings data={ratingsData} />
            <RecentActivity activities={activityLog} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
