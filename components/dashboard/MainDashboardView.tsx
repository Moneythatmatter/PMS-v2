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

export function MainDashboardView() {
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
    if (!rooms.length) return occupancyData;
    const total = rooms.length;
    const occupied = rooms.filter((r) => r.status === "Occupied").length;
    const vacantReady = rooms.filter((r) => r.status === "Vacant Ready").length;
    const vacantDirty = rooms.filter((r) => r.status === "Vacant Dirty").length;

    const occRate = Math.round((occupied / total) * 100);

    return {
      percentage: occRate,
      occupied,
      total,
      statuses: [
        { label: "Occupied", count: occupied, color: "#16a34a" },
        { label: "Vacant Ready", count: vacantReady, color: "#2563eb" },
        { label: "Vacant Dirty", count: vacantDirty, color: "#eab308" },
      ],
    };
  }, [rooms]);

  return (
    <AppShell
      navItems={navItems}
      user={currentUser}
    >
      <WakeUpCallsAlert calls={wakeUpCalls} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {summaryStats.map((stat, index) => (
          <StatCard key={index} stat={stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <GuestsChart data={guestData} />
        </div>
        <div>
          <RevenueChart data={revenueData} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div>
          <BookingsChart data={bookingsChartData} />
        </div>
        <div>
          <PlatformChart data={platformData} />
        </div>
        <div>
          <RoomOccupancy data={computedOccupancy} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div>
          <OverallRatings data={ratingsData} />
        </div>
        <div className="lg:col-span-2">
          <RecentActivity activities={activityLog} />
        </div>
      </div>

      <div>
        <BookingList bookings={bookings} />
      </div>
    </AppShell>
  );
}
