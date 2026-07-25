"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bell,
  CalendarCheck,
  ClipboardList,
  Clock,
  DoorOpen,
  LogIn,
  LogOut,
  Moon,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ModulePageShell } from "@/components/pms";
import { StatMiniCard } from "@/components/frontoffice/ui";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { WeeklyFlowChart } from "@/components/frontoffice/WeeklyFlowChart";
import { BookingSourcesChart } from "@/components/frontoffice/BookingSourcesChart";
import { DeskActivityFeed } from "@/components/frontoffice/DeskActivityFeed";
import { StatusBadge } from "@/components/frontoffice/StatusBadge";
import { getPendingWakeUpCalls } from "@/components/frontoffice/WakeUpCallsAlert";
import { cn } from "@/lib/utils";
import { dashboardService, wakeUpCallService } from "@/services/front-office";
import type {
  ArrivalGuest,
  BookingSource,
  DepartureGuest,
  DeskActivity,
  FrontOfficeStat,
  RoomInventoryData,
  WeeklyFlowPoint,
} from "@/app/data/types";
import type { WakeUpCall } from "@/app/data/frontoffice/modules";

const BUSINESS_DATE = "23 Jun 2026";

const quickLinks = [
  {
    label: "Check-In",
    href: "/frontoffice/reservation/check-in",
    icon: LogIn,
    hint: "Arrivals",
  },
  {
    label: "Check-Out",
    href: "/frontoffice/reservation/check-out",
    icon: LogOut,
    hint: "Settle & leave",
  },
  {
    label: "All Bookings",
    href: "/frontoffice/reservation/all-bookings",
    icon: CalendarCheck,
    hint: "Reservations",
  },
  {
    label: "In-House",
    href: "/frontoffice/in-house-guests",
    icon: Users,
    hint: "Current guests",
  },
  {
    label: "Room Status",
    href: "/frontoffice/room-status",
    icon: DoorOpen,
    hint: "House status",
  },
  {
    label: "Payments",
    href: "/frontoffice/payments",
    icon: Wallet,
    hint: "Collections",
  },
  {
    label: "Day Closing",
    href: "/frontoffice/day-closing",
    icon: ClipboardList,
    hint: "End of day",
  },
  {
    label: "Night Audit",
    href: "/frontoffice/reports/night-audit",
    icon: Moon,
    hint: "Finalize audit",
  },
];

type DashboardData = {
  stats: FrontOfficeStat[];
  todaysArrivals: ArrivalGuest[];
  todaysDepartures: DepartureGuest[];
  roomInventory: RoomInventoryData;
  weeklyFlow: WeeklyFlowPoint[];
  bookingSources: BookingSource[];
  deskActivity: DeskActivity[];
};

const emptyInventory: RoomInventoryData = {
  percentage: 0,
  occupied: 0,
  total: 0,
  statuses: [],
};

export function FrontOfficeDashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [wakeUpCalls, setWakeUpCalls] = useState<WakeUpCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [dashboard, calls] = await Promise.all([
          dashboardService.get() as Promise<DashboardData>,
          wakeUpCallService.list(),
        ]);
        if (!cancelled) {
          setData(dashboard);
          setWakeUpCalls(calls);
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

  if (loading) {
    return (
      <ModulePageShell
        eyebrow="Front Office"
        title="Dashboard"
        description="Arrivals, departures, occupancy, and desk work for today."
        wrapChildren={false}
      >
        <p className="text-sm text-slate-500">Loading…</p>
      </ModulePageShell>
    );
  }

  if (error || !data) {
    return (
      <ModulePageShell
        eyebrow="Front Office"
        title="Dashboard"
        description="Arrivals, departures, occupancy, and desk work for today."
        wrapChildren={false}
      >
        <p className="text-sm text-red-600">{error ?? "Failed to load"}</p>
      </ModulePageShell>
    );
  }

  const {
    stats: frontOfficeStats,
    todaysArrivals,
    todaysDepartures,
    roomInventory = emptyInventory,
    weeklyFlow,
    bookingSources,
    deskActivity,
  } = data;

  const pendingWakeUps = getPendingWakeUpCalls(wakeUpCalls);
  const todayWakeUps = pendingWakeUps.filter((c) => c.date === BUSINESS_DATE);
  const pendingArrivals = todaysArrivals.filter((g) => g.status === "Pending");
  const pendingDepartures = todaysDepartures.filter((g) => g.status === "Checked In");
  const dirtyRooms =
    roomInventory.statuses.find((s) => s.label === "Dirty")?.count ?? 0;
  const maintRooms =
    roomInventory.statuses.find((s) => s.label === "Maint.")?.count ?? 0;

  const alerts = [
    todayWakeUps.length > 0 && {
      id: "wake",
      tone: "warning" as const,
      title: `${todayWakeUps.length} wake-up call${todayWakeUps.length === 1 ? "" : "s"} due today`,
      detail: todayWakeUps[0]
        ? `Next: ${todayWakeUps[0].time} · ${todayWakeUps[0].guest}`
        : "Review schedule",
      href: "/frontoffice/wake-up-calls",
      action: "Manage calls",
    },
    pendingArrivals.length > 0 && {
      id: "arrival",
      tone: "warning" as const,
      title: `${pendingArrivals.length} arrival pending confirmation`,
      detail: pendingArrivals.map((g) => g.name).join(", "),
      href: "/frontoffice/reservation/check-in",
      action: "Open check-in",
    },
    pendingDepartures.length > 0 && {
      id: "depart",
      tone: "danger" as const,
      title: `${pendingDepartures.length} departure still in-house`,
      detail: pendingDepartures.map((g) => `${g.name} · ${g.roomNo}`).join(", "),
      href: "/frontoffice/reservation/check-out",
      action: "Open check-out",
    },
    (dirtyRooms > 0 || maintRooms > 0) && {
      id: "rooms",
      tone: "info" as const,
      title: `${dirtyRooms} dirty · ${maintRooms} maintenance`,
      detail: "Housekeeping / engineering follow-up",
      href: "/frontoffice/room-status",
      action: "Room status",
    },
  ].filter(Boolean) as {
    id: string;
    tone: "danger" | "warning" | "info";
    title: string;
    detail: string;
    href: string;
    action: string;
  }[];

  const statIcons = [LogIn, LogOut, Users, DoorOpen] as const;

  return (
    <ModulePageShell
      eyebrow="Front Office"
      title="Dashboard"
      description="Arrivals, departures, occupancy, and desk work for today."
      wrapChildren={false}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {frontOfficeStats.map((stat, i) => {
          const Icon = statIcons[i] ?? Users;
          return (
            <StatMiniCard
              key={stat.title}
              label={stat.title}
              value={stat.value}
              accent={stat.trend === "up" ? "#15803d" : "#64748b"}
              icon={Icon}
              sublabel={stat.note}
            />
          );
        })}
      </div>

      {alerts.length > 0 && (
        <section className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Bell className="h-3.5 w-3.5 text-amber-600" />
              <h2 className="text-sm font-semibold text-slate-900">Needs attention</h2>
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                {alerts.length}
              </span>
            </div>
            <Link
              href="/frontoffice/day-closing"
              className="text-xs font-medium text-emerald-700 hover:underline"
            >
              Day closing
            </Link>
          </div>
          <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
            {alerts.map((alert) => (
              <Link
                key={alert.id}
                href={alert.href}
                className={cn(
                  "rounded-lg border px-2.5 py-2 transition hover:shadow-sm",
                  alert.tone === "danger" && "border-red-200 bg-red-50 text-red-900",
                  alert.tone === "warning" && "border-amber-200 bg-amber-50 text-amber-950",
                  alert.tone === "info" && "border-emerald-200 bg-emerald-50 text-emerald-950",
                )}
              >
                <p className="text-xs font-semibold leading-snug">{alert.title}</p>
                <p className="mt-0.5 truncate text-[11px] opacity-80">{alert.detail}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Quick actions</h2>
          <p className="text-[11px] text-slate-500">Front desk shortcuts</p>
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 xl:grid-cols-8">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-2 transition hover:border-emerald-300 hover:bg-emerald-50/60"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-emerald-700 ring-1 ring-slate-200">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-900">{link.label}</p>
                  <p className="truncate text-[10px] text-slate-500">{link.hint}</p>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <section className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Today&apos;s arrivals</h2>
              <p className="text-[11px] text-slate-500">{todaysArrivals.length} expected</p>
            </div>
            <Link href="/frontoffice/reservation/check-in">
              <Button type="button" size="sm" variant="outline">
                Check-in
              </Button>
            </Link>
          </div>
          <ul className="flex flex-1 flex-col divide-y divide-slate-100">
            {todaysArrivals.map((guest) => (
              <li
                key={guest.id}
                className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{guest.name}</p>
                  <p className="truncate text-[11px] text-slate-500">
                    {guest.bookingId} · Rm {guest.roomNo} · {guest.roomType}
                  </p>
                </div>
                <StatusBadge status={guest.status} />
              </li>
            ))}
          </ul>
        </section>

        <section className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Today&apos;s departures</h2>
              <p className="text-[11px] text-slate-500">{todaysDepartures.length} scheduled</p>
            </div>
            <Link href="/frontoffice/reservation/check-out">
              <Button type="button" size="sm" variant="outline">
                Check-out
              </Button>
            </Link>
          </div>
          <ul className="flex flex-1 flex-col divide-y divide-slate-100">
            {todaysDepartures.map((guest) => (
              <li
                key={guest.id}
                className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{guest.name}</p>
                  <p className="truncate text-[11px] text-slate-500">
                    {guest.bookingId} · Rm {guest.roomNo} · {guest.roomType}
                  </p>
                </div>
                <StatusBadge status={guest.status} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <section className="flex h-full flex-col rounded-xl border border-amber-200/80 bg-amber-50/40 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Wake-up calls</h2>
              <p className="text-[11px] text-slate-500">
                {todayWakeUps.length > 0
                  ? `${todayWakeUps.length} due today`
                  : `${pendingWakeUps.length} upcoming`}
              </p>
            </div>
            <Link
              href="/frontoffice/wake-up-calls"
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 hover:underline"
            >
              Manage
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="flex flex-1 flex-col space-y-1.5">
            {(todayWakeUps.length > 0 ? todayWakeUps : pendingWakeUps).slice(0, 3).map((call) => (
              <li
                key={call.id}
                className="rounded-lg border border-amber-100 bg-white px-2.5 py-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {call.guest}
                      <span className="font-normal text-slate-500"> · Rm {call.room}</span>
                    </p>
                    {call.notes && (
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">{call.notes}</p>
                    )}
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-amber-800">
                    <Clock className="h-3 w-3" />
                    {call.time}
                  </span>
                </div>
              </li>
            ))}
            {pendingWakeUps.length === 0 && (
              <li className="py-3 text-center text-sm text-slate-500">All clear</li>
            )}
          </ul>
        </section>

        <section className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Room inventory</h2>
              <p className="text-[11px] text-slate-500">Live house status</p>
            </div>
            <Link
              href="/frontoffice/room-status"
              className="text-xs font-medium text-emerald-700 hover:underline"
            >
              Details
            </Link>
          </div>
          <div className="mb-3 flex items-center gap-3">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="#15803d"
                  strokeWidth="3"
                  strokeDasharray={`${roomInventory.percentage} ${100 - roomInventory.percentage}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-xs font-bold text-slate-900">
                {roomInventory.percentage}%
              </span>
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">
                {roomInventory.occupied} / {roomInventory.total}
              </p>
              <p className="text-[11px] text-slate-500">rooms in use</p>
            </div>
          </div>
          <div className="mt-auto space-y-1.5">
            {roomInventory.statuses.map((status) => (
              <div key={status.label}>
                <div className="mb-0.5 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">{status.label}</span>
                  <span className="font-medium text-slate-900">{status.count}</span>
                </div>
                <ProgressBar value={status.count} max={roomInventory.total} color={status.color} />
              </div>
            ))}
          </div>
        </section>

        <DeskActivityFeed activities={deskActivity} />
      </div>

      <div className="mt-3 grid grid-cols-1 items-stretch gap-3 lg:grid-cols-2">
        <WeeklyFlowChart data={weeklyFlow} />
        <BookingSourcesChart data={bookingSources} />
      </div>
    </ModulePageShell>
  );
}
