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

export default function DashboardPage() {
  return (
    <AppShell navItems={navItems} user={currentUser}>
      <div className="space-y-4 sm:space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {summaryStats.map((stat) => (
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
            <RoomOccupancy data={occupancyData} />
            <OverallRatings data={ratingsData} />
            <RecentActivity activities={activityLog} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
