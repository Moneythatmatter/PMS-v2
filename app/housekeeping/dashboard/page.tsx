"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ArrowRightLeft,
  Bell,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Layers,
  Sparkles,
  Trees,
  Users,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ModulePageShell } from "@/components/pms";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useHousekeeping } from "@/components/housekeeping/HousekeepingContext";
import { cn } from "@/lib/utils";

const quickLinks = [
  {
    label: "Room Cleaning",
    href: "/housekeeping/operations/room-cleaning",
    icon: Sparkles,
    hint: "Dirty & in progress",
  },
  {
    label: "Inspection",
    href: "/housekeeping/operations/inspection",
    icon: ClipboardCheck,
    hint: "Supervisor sign-off",
  },
  {
    label: "Guest Requests",
    href: "/housekeeping/housekeeping-requests",
    icon: Bell,
    hint: "Service queue",
  },
  {
    label: "Maintenance",
    href: "/housekeeping/maintenance-requests",
    icon: Wrench,
    hint: "Work orders",
  },
  {
    label: "Public Area",
    href: "/housekeeping/operations/public-cleaning",
    icon: Trees,
    hint: "Lobby & corridors",
  },
  {
    label: "Laundry",
    href: "/housekeeping/operations/laundry",
    icon: ArrowRightLeft,
    hint: "Linen flow",
  },
  {
    label: "Inventory",
    href: "/housekeeping/inventory",
    icon: Layers,
    hint: "Par & stock",
  },
  {
    label: "Staff",
    href: "/housekeeping/masters/staff",
    icon: Users,
    hint: "Shifts & roster",
  },
];

function Pill({ status }: { status: string }) {
  const tone =
    status === "Vacant Ready" || status === "Completed" || status === "Ready" || status === "Delivered"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : status === "Cleaning" || status === "Inspection Pending" || status === "Pending" || status === "Open"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : status.includes("Dirty") || status === "Critical" || status === "High"
          ? "bg-red-50 text-red-700 ring-red-200"
          : "bg-slate-100 text-slate-600 ring-slate-200";

  return (
    <span className={cn("inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", tone)}>
      {status}
    </span>
  );
}

export default function HousekeepingDashboard() {
  const {
    rooms,
    requests,
    maintenance,
    inventory,
    laundryJobs,
    publicAreas,
    loading,
    apiConnected,
  } = useHousekeeping();

  const stats = useMemo(() => {
    const dirty = rooms.filter((r) => r.status.includes("Dirty")).length;
    const cleaning = rooms.filter((r) => r.status === "Cleaning").length;
    const pendingInspection = rooms.filter((r) => r.status === "Inspection Pending").length;
    const ready = rooms.filter((r) => r.status === "Vacant Ready").length;
    const occupied = rooms.filter((r) => r.status.startsWith("Occupied")).length;
    const blocked = rooms.filter(
      (r) => r.status === "Blocked" || r.status === "Out of Order" || r.status === "Out of Service",
    ).length;
    const openRequests = requests.filter((r) => r.status !== "Completed").length;
    const openMaint = maintenance.filter((m) => m.status !== "Closed").length;
    const pendingLaundry = laundryJobs.filter((l) => l.status !== "Delivered").length;
    const dirtyPublicAreas = publicAreas.filter((p) => p.status === "Dirty").length;
    const lowStock = inventory.filter((item) => item.available < item.parStock * 0.6);

    return {
      dirty,
      cleaning,
      pendingInspection,
      ready,
      occupied,
      blocked,
      openRequests,
      openMaint,
      pendingLaundry,
      dirtyPublicAreas,
      lowStock,
      total: rooms.length,
    };
  }, [rooms, requests, maintenance, laundryJobs, publicAreas, inventory]);

  const inspectionPendingRooms = useMemo(
    () => rooms.filter((r) => r.status === "Inspection Pending").slice(0, 6),
    [rooms],
  );
  const dirtyRooms = useMemo(
    () => rooms.filter((r) => r.status.includes("Dirty")).slice(0, 6),
    [rooms],
  );
  const activeRequests = useMemo(
    () => requests.filter((r) => r.status !== "Completed").slice(0, 5),
    [requests],
  );
  const activeMaint = useMemo(
    () => maintenance.filter((m) => m.status !== "Closed").slice(0, 5),
    [maintenance],
  );
  const laundryPreview = useMemo(() => laundryJobs.slice(0, 4), [laundryJobs]);

  const roomBreakdown = [
    { label: "Dirty", count: stats.dirty, color: "#ef4444" },
    { label: "Cleaning", count: stats.cleaning, color: "#f59e0b" },
    { label: "Inspection", count: stats.pendingInspection, color: "#3b82f6" },
    { label: "Vacant Ready", count: stats.ready, color: "#15803d" },
    { label: "Occupied", count: stats.occupied, color: "#8b5cf6" },
    { label: "Blocked / OOO", count: stats.blocked, color: "#64748b" },
  ];

  const readyPct =
    stats.total > 0 ? Math.round(((stats.ready + stats.occupied) / stats.total) * 100) : 0;

  const alerts = [
    stats.dirty > 0 && {
      id: "dirty",
      tone: "danger" as const,
      title: `${stats.dirty} dirty room${stats.dirty === 1 ? "" : "s"} need cleaning`,
      detail: dirtyRooms.map((r) => r.roomNo).join(", ") || "Open room cleaning",
      href: "/housekeeping/operations/room-cleaning",
    },
    stats.pendingInspection > 0 && {
      id: "inspect",
      tone: "warning" as const,
      title: `${stats.pendingInspection} room${stats.pendingInspection === 1 ? "" : "s"} awaiting inspection`,
      detail: inspectionPendingRooms.map((r) => r.roomNo).join(", ") || "Supervisor queue",
      href: "/housekeeping/operations/inspection",
    },
    stats.openRequests > 0 && {
      id: "requests",
      tone: "warning" as const,
      title: `${stats.openRequests} open guest request${stats.openRequests === 1 ? "" : "s"}`,
      detail: activeRequests[0]?.issue ?? "Service queue",
      href: "/housekeeping/housekeeping-requests",
    },
    (stats.dirtyPublicAreas > 0 || stats.lowStock.length > 0) && {
      id: "supply",
      tone: "info" as const,
      title: `${stats.dirtyPublicAreas} dirty public · ${stats.lowStock.length} low stock`,
      detail: stats.lowStock[0]
        ? `${stats.lowStock[0].name} below par`
        : "Public areas / inventory follow-up",
      href: stats.lowStock.length > 0 ? "/housekeeping/inventory" : "/housekeeping/operations/public-cleaning",
    },
  ].filter(Boolean) as {
    id: string;
    tone: "danger" | "warning" | "info";
    title: string;
    detail: string;
    href: string;
  }[];

  const statCards = [
    {
      label: "Dirty Rooms",
      value: stats.dirty,
      accent: "#dc2626",
      icon: AlertTriangle,
      sublabel: "Needs cleaning",
    },
    {
      label: "In Progress",
      value: stats.cleaning,
      accent: "#d97706",
      icon: Clock,
      sublabel: "Cleaning active",
    },
    {
      label: "Pending Verify",
      value: stats.pendingInspection,
      accent: "#2563eb",
      icon: ClipboardCheck,
      sublabel: "Awaiting inspection",
    },
    {
      label: "Vacant Ready",
      value: stats.ready,
      accent: "#15803d",
      icon: CheckCircle2,
      sublabel: "Available for sale",
    },
  ];

  return (
    <ModulePageShell
      eyebrow="Housekeeping"
      title="Dashboard"
      description={
        loading
          ? "Loading housekeeping data…"
          : apiConnected
            ? "Room status, guest requests, inspections, and linen work for today."
            : "Offline mode — using local data (backend unavailable)."
      }
      wrapChildren={false}
    >
      {loading ? (
        <p className="py-12 text-center text-sm text-slate-500">Loading housekeeping…</p>
      ) : (
        <div className="min-w-0 space-y-4 sm:space-y-6 lg:space-y-8">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="h-full min-w-0 p-3 sm:p-5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
                      {stat.label}
                    </p>
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-8 sm:w-8"
                      style={{ backgroundColor: `${stat.accent}20`, color: stat.accent }}
                    >
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </span>
                  </div>
                  <p className="mt-1.5 truncate text-lg font-bold tracking-tight text-slate-900 sm:mt-2 sm:text-2xl">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-500 sm:text-xs">
                    {stat.sublabel}
                  </p>
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
                    href="/housekeeping/operations/room-cleaning"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:underline"
                  >
                    <Bell className="h-3.5 w-3.5 text-amber-600" />
                    Room cleaning
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
            <CardHeader title="Quick actions" subtitle="Housekeeping shortcuts" />
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
                title="Dirty rooms"
                subtitle={`${stats.dirty} need cleaning`}
                action={
                  <Link href="/housekeeping/operations/room-cleaning">
                    <Button type="button" size="sm" variant="outline">
                      Clean
                    </Button>
                  </Link>
                }
              />
              <ul className="flex flex-1 flex-col divide-y divide-slate-100">
                {dirtyRooms.length === 0 ? (
                  <li className="py-6 text-center text-sm text-slate-500">No dirty rooms</li>
                ) : (
                  dirtyRooms.map((room) => (
                    <li
                      key={room.roomNo}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          Room {room.roomNo}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {room.category} · Floor {room.floor}
                          {room.assignedStaff ? ` · ${room.assignedStaff}` : ""}
                        </p>
                      </div>
                      <Pill status={room.status} />
                    </li>
                  ))
                )}
              </ul>
            </Card>

            <Card className="flex h-full min-w-0 flex-col">
              <CardHeader
                title="Awaiting inspection"
                subtitle={`${stats.pendingInspection} ready for sign-off`}
                action={
                  <Link href="/housekeeping/operations/inspection">
                    <Button type="button" size="sm" variant="outline">
                      Inspect
                    </Button>
                  </Link>
                }
              />
              <ul className="flex flex-1 flex-col divide-y divide-slate-100">
                {inspectionPendingRooms.length === 0 ? (
                  <li className="py-6 text-center text-sm text-slate-500">Inspection queue clear</li>
                ) : (
                  inspectionPendingRooms.map((room) => (
                    <li
                      key={room.roomNo}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          Room {room.roomNo}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {room.category} · {room.assignedStaff || "Staff"}
                        </p>
                      </div>
                      <Pill status={room.status} />
                    </li>
                  ))
                )}
              </ul>
            </Card>
          </div>

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8">
            <Card className="flex h-full min-w-0 flex-col border-amber-200/80 bg-amber-50/40">
              <CardHeader
                title="Guest requests"
                subtitle={
                  stats.openRequests > 0 ? `${stats.openRequests} open` : "All clear"
                }
                action={
                  <Link
                    href="/housekeeping/housekeeping-requests"
                    className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 hover:underline"
                  >
                    Manage
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                }
              />
              <ul className="flex flex-1 flex-col space-y-2">
                {activeRequests.length === 0 ? (
                  <li className="py-6 text-center text-sm text-slate-500">No open requests</li>
                ) : (
                  activeRequests.map((req) => (
                    <li
                      key={req.id}
                      className="rounded-lg border border-amber-100 bg-white p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            Room {req.room}
                            <span className="font-normal text-slate-500"> · {req.issue}</span>
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">{req.createdAt}</p>
                        </div>
                        <Pill status={req.priority} />
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </Card>

            <Card className="flex h-full min-w-0 flex-col">
              <CardHeader
                title="House status"
                subtitle="Live room mix"
                action={
                  <Link
                    href="/housekeeping/operations/room-cleaning"
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
                      strokeDasharray={`${readyPct} ${100 - readyPct}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-sm font-bold text-slate-900">{readyPct}%</span>
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold tracking-tight text-slate-900">
                    {stats.ready + stats.occupied} / {stats.total}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">ready or occupied</p>
                </div>
              </div>
              <div className="mt-auto space-y-2">
                {roomBreakdown.map((status) => (
                  <div key={status.label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-slate-600">{status.label}</span>
                      <span className="font-medium text-slate-900">{status.count}</span>
                    </div>
                    <ProgressBar value={status.count} max={Math.max(stats.total, 1)} color={status.color} />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="flex h-full min-w-0 flex-col">
              <CardHeader
                title="Maintenance & laundry"
                subtitle={`${stats.openMaint} work orders · ${stats.pendingLaundry} laundry`}
                action={
                  <Link
                    href="/housekeeping/maintenance-requests"
                    className="text-xs font-medium text-emerald-700 hover:underline"
                  >
                    View all
                  </Link>
                }
              />
              <ul className="flex flex-1 flex-col divide-y divide-slate-100">
                {activeMaint.slice(0, 2).map((ticket) => (
                  <li
                    key={ticket.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        Room {ticket.room}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{ticket.problem}</p>
                    </div>
                    <Pill status={ticket.priority} />
                  </li>
                ))}
                {laundryPreview.map((job) => (
                  <li
                    key={job.id}
                    className="flex items-center justify-between gap-3 py-3 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{job.item}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        Qty {job.quantity} · {job.type}
                      </p>
                    </div>
                    <Pill status={job.status} />
                  </li>
                ))}
                {activeMaint.length === 0 && laundryPreview.length === 0 && (
                  <li className="py-6 text-center text-sm text-slate-500">Nothing pending</li>
                )}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </ModulePageShell>
  );
}
