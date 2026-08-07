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
import { Card, CardHeader } from "@/components/ui/Card";
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
      <div className="min-w-0 space-y-4 sm:space-y-6 lg:space-y-8">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          {frontOfficeStats.map((stat, i) => {
            const Icon = statIcons[i] ?? Users;
            return (
              <Card key={stat.title} className="h-full min-w-0 p-3 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
                    {stat.title}
                  </p>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 sm:h-8 sm:w-8">
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </span>
                </div>
                <p className="mt-1.5 truncate text-lg font-bold tracking-tight text-slate-900 sm:mt-2 sm:text-2xl">
                  {stat.value}
                </p>
                {stat.note && (
                  <p className="mt-0.5 truncate text-[11px] text-slate-500 sm:text-xs">
                    {stat.note}
                  </p>
                )}
              </Card>
            );
          })}
        </div>

        {alerts.length > 0 && (
          <Card className="min-w-0">
            <CardHeader
              title="Needs attention"
              subtitle={`${alerts.length} item${alerts.length === 1 ? "" : "s"} to review`}
              action={
                <Link
                  href="/frontoffice/day-closing"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:underline"
                >
                  <Bell className="h-3.5 w-3.5 text-amber-600" />
                  Day closing
                </Link>
              }
            />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {alerts.map((alert) => (
                <Link
                  key={alert.id}
                  href={alert.href}
                  className={cn(
                    "block min-w-0 rounded-lg border p-3 transition hover:shadow-sm",
                    alert.tone === "danger" && "border-red-200 bg-red-50 text-red-900",
                    alert.tone === "warning" && "border-amber-200 bg-amber-50 text-amber-950",
                    alert.tone === "info" && "border-emerald-200 bg-emerald-50 text-emerald-950",
                  )}
                >
                  <p className="text-sm font-semibold leading-snug">{alert.title}</p>
                  <p className="mt-0.5 truncate text-xs opacity-80">{alert.detail}</p>
                </Link>
              ))}
            </div>
          </Card>
        )}

        <Card className="min-w-0">
          <CardHeader title="Quick actions" subtitle="Front desk shortcuts" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/60 p-3 transition hover:border-emerald-300 hover:bg-emerald-50/60"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 ring-1 ring-slate-200">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{link.label}</p>
                    <p className="truncate text-xs text-slate-500">{link.hint}</p>
                  </span>
                </Link>
              );
            })}
          </div>
        </Card>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 lg:gap-8">
          <Card className="flex h-full min-w-0 flex-col">
            <CardHeader
              title="Today's arrivals"
              subtitle={`${todaysArrivals.length} expected`}
              action={
                <Link href="/frontoffice/reservation/check-in">
                  <Button type="button" size="sm" variant="outline">
                    Check-in
                  </Button>
                </Link>
              }
            />
            <ul className="flex flex-1 flex-col divide-y divide-slate-100">
              {todaysArrivals.map((guest) => (
                <li
                  key={guest.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{guest.name}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {guest.bookingId} · Rm {guest.roomNo} · {guest.roomType}
                    </p>
                  </div>
                  <StatusBadge status={guest.status} />
                </li>
              ))}
              {todaysArrivals.length === 0 && (
                <li className="py-6 text-center text-sm text-slate-500">No arrivals today</li>
              )}
            </ul>
          </Card>

          <Card className="flex h-full min-w-0 flex-col">
            <CardHeader
              title="Today's departures"
              subtitle={`${todaysDepartures.length} scheduled`}
              action={
                <Link href="/frontoffice/reservation/check-out">
                  <Button type="button" size="sm" variant="outline">
                    Check-out
                  </Button>
                </Link>
              }
            />
            <ul className="flex flex-1 flex-col divide-y divide-slate-100">
              {todaysDepartures.map((guest) => (
                <li
                  key={guest.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{guest.name}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {guest.bookingId} · Rm {guest.roomNo} · {guest.roomType}
                    </p>
                  </div>
                  <StatusBadge status={guest.status} />
                </li>
              ))}
              {todaysDepartures.length === 0 && (
                <li className="py-6 text-center text-sm text-slate-500">No departures today</li>
              )}
            </ul>
          </Card>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8">
          <Card className="flex h-full min-w-0 flex-col border-amber-200/80 bg-amber-50/40">
            <CardHeader
              title="Wake-up calls"
              subtitle={
                todayWakeUps.length > 0
                  ? `${todayWakeUps.length} due today`
                  : `${pendingWakeUps.length} upcoming`
              }
              action={
                <Link
                  href="/frontoffice/wake-up-calls"
                  className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 hover:underline"
                >
                  Manage
                  <ArrowRight className="h-3 w-3" />
                </Link>
              }
            />
            <ul className="flex flex-1 flex-col space-y-2">
              {(todayWakeUps.length > 0 ? todayWakeUps : pendingWakeUps).slice(0, 3).map((call) => (
                <li
                  key={call.id}
                  className="rounded-lg border border-amber-100 bg-white p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {call.guest}
                        <span className="font-normal text-slate-500"> · Rm {call.room}</span>
                      </p>
                      {call.notes && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">{call.notes}</p>
                      )}
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-amber-800">
                      <Clock className="h-3.5 w-3.5" />
                      {call.time}
                    </span>
                  </div>
                </li>
              ))}
              {pendingWakeUps.length === 0 && (
                <li className="py-6 text-center text-sm text-slate-500">All clear</li>
              )}
            </ul>
          </Card>

          <Card className="flex h-full min-w-0 flex-col">
            <CardHeader
              title="Room inventory"
              subtitle="Live house status"
              action={
                <Link
                  href="/frontoffice/room-status"
                  className="text-xs font-medium text-emerald-700 hover:underline"
                >
                  Details
                </Link>
              }
            />
            <div className="mb-4 flex items-center gap-3">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
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
                <span className="absolute text-sm font-bold text-slate-900">
                  {roomInventory.percentage}%
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold tracking-tight text-slate-900">
                  {roomInventory.occupied} / {roomInventory.total}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">rooms in use</p>
              </div>
            </div>
            <div className="mt-auto space-y-2">
              {roomInventory.statuses.map((status) => (
                <div key={status.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-600">{status.label}</span>
                    <span className="font-medium text-slate-900">{status.count}</span>
                  </div>
                  <ProgressBar value={status.count} max={roomInventory.total} color={status.color} />
                </div>
              ))}
            </div>
          </Card>

          <DeskActivityFeed activities={deskActivity} limit={8} />
        </div>

        <div className="grid grid-cols-1 items-stretch gap-4 sm:gap-6 lg:grid-cols-2 lg:gap-8">
          <WeeklyFlowChart data={weeklyFlow} />
          <BookingSourcesChart data={bookingSources} />
        </div>
      </div>
    </ModulePageShell>
  );
}
