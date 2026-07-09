import {
  frontOfficeStats,
  todaysArrivals,
  todaysDepartures,
  roomInventory,
  weeklyFlow,
  bookingSources,
  deskActivity,
} from "@/app/data";
import { FrontOfficeStatCard } from "@/components/frontoffice/FrontOfficeStatCard";
import { ArrivalsList } from "@/components/frontoffice/ArrivalsList";
import { DeparturesList } from "@/components/frontoffice/DeparturesList";
import { RoomInventory } from "@/components/frontoffice/RoomInventory";
import { WeeklyFlowChart } from "@/components/frontoffice/WeeklyFlowChart";
import { BookingSourcesChart } from "@/components/frontoffice/BookingSourcesChart";
import { DeskActivityFeed } from "@/components/frontoffice/DeskActivityFeed";

export default function FrontOfficeDashboardPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-lg font-bold text-slate-900 sm:text-xl">Dashboard</h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          Quick view — arrivals, departures, occupancy, and daily front desk tasks.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {frontOfficeStats.map((stat) => (
          <FrontOfficeStatCard key={stat.title} stat={stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ArrivalsList arrivals={todaysArrivals} />
        <RoomInventory data={roomInventory} />
        <DeparturesList departures={todaysDepartures} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <WeeklyFlowChart data={weeklyFlow} />
        <BookingSourcesChart data={bookingSources} />
        <DeskActivityFeed activities={deskActivity} />
      </div>
    </div>
  );
}
