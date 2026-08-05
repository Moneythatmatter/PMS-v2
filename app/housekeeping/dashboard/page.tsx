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
import { ModulePageShell } from "@/components/pms";
import { StatMiniCard } from "@/components/frontoffice/ui";
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
      <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatMiniCard
          label="Dirty Rooms"
          value={stats.dirty}
          accent="#dc2626"
          icon={AlertTriangle}
          sublabel="Needs cleaning"
        />
        <StatMiniCard
          label="In Progress"
          value={stats.cleaning}
          accent="#d97706"
          icon={Clock}
          sublabel="Cleaning active"
        />
        <StatMiniCard
          label="Pending Verify"
          value={stats.pendingInspection}
          accent="#2563eb"
          icon={ClipboardCheck}
          sublabel="Awaiting inspection"
        />
        <StatMiniCard
          label="Vacant Ready"
          value={stats.ready}
          accent="#15803d"
          icon={CheckCircle2}
          sublabel="Available for sale"
        />
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
              href="/housekeeping/operations/room-cleaning"
              className="text-xs font-medium text-emerald-700 hover:underline"
            >
              Room cleaning
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
          <p className="text-[11px] text-slate-500">Housekeeping shortcuts</p>
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
              <h2 className="text-sm font-semibold text-slate-900">Dirty rooms</h2>
              <p className="text-[11px] text-slate-500">{stats.dirty} need cleaning</p>
            </div>
            <Link href="/housekeeping/operations/room-cleaning">
              <Button type="button" size="sm" variant="outline">
                Clean
              </Button>
            </Link>
          </div>
          <ul className="flex flex-1 flex-col divide-y divide-slate-100">
            {dirtyRooms.length === 0 ? (
              <li className="py-6 text-center text-sm text-slate-500">No dirty rooms</li>
            ) : (
              dirtyRooms.map((room) => (
                <li
                  key={room.roomNo}
                  className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">Room {room.roomNo}</p>
                    <p className="truncate text-[11px] text-slate-500">
                      {room.category} · Floor {room.floor}
                      {room.assignedStaff ? ` · ${room.assignedStaff}` : ""}
                    </p>
                  </div>
                  <Pill status={room.status} />
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Awaiting inspection</h2>
              <p className="text-[11px] text-slate-500">{stats.pendingInspection} ready for sign-off</p>
            </div>
            <Link href="/housekeeping/operations/inspection">
              <Button type="button" size="sm" variant="outline">
                Inspect
              </Button>
            </Link>
          </div>
          <ul className="flex flex-1 flex-col divide-y divide-slate-100">
            {inspectionPendingRooms.length === 0 ? (
              <li className="py-6 text-center text-sm text-slate-500">Inspection queue clear</li>
            ) : (
              inspectionPendingRooms.map((room) => (
                <li
                  key={room.roomNo}
                  className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">Room {room.roomNo}</p>
                    <p className="truncate text-[11px] text-slate-500">
                      {room.category} · {room.assignedStaff || "Staff"}
                    </p>
                  </div>
                  <Pill status={room.status} />
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <section className="flex h-full flex-col rounded-xl border border-amber-200/80 bg-amber-50/40 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Guest requests</h2>
              <p className="text-[11px] text-slate-500">
                {stats.openRequests > 0 ? `${stats.openRequests} open` : "All clear"}
              </p>
            </div>
            <Link
              href="/housekeeping/housekeeping-requests"
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 hover:underline"
            >
              Manage
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="flex flex-1 flex-col space-y-1.5">
            {activeRequests.length === 0 ? (
              <li className="py-3 text-center text-sm text-slate-500">No open requests</li>
            ) : (
              activeRequests.map((req) => (
                <li
                  key={req.id}
                  className="rounded-lg border border-amber-100 bg-white px-2.5 py-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        Room {req.room}
                        <span className="font-normal text-slate-500"> · {req.issue}</span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">{req.createdAt}</p>
                    </div>
                    <Pill status={req.priority} />
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">House status</h2>
              <p className="text-[11px] text-slate-500">Live room mix</p>
            </div>
            <Link
              href="/housekeeping/operations/room-cleaning"
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
                  strokeDasharray={`${readyPct} ${100 - readyPct}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-xs font-bold text-slate-900">{readyPct}%</span>
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">
                {stats.ready + stats.occupied} / {stats.total}
              </p>
              <p className="text-[11px] text-slate-500">ready or occupied</p>
            </div>
          </div>
          <div className="mt-auto space-y-1.5">
            {roomBreakdown.map((status) => (
              <div key={status.label}>
                <div className="mb-0.5 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">{status.label}</span>
                  <span className="font-medium text-slate-900">{status.count}</span>
                </div>
                <ProgressBar value={status.count} max={Math.max(stats.total, 1)} color={status.color} />
              </div>
            ))}
          </div>
        </section>

        <section className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Maintenance & laundry</h2>
              <p className="text-[11px] text-slate-500">
                {stats.openMaint} work orders · {stats.pendingLaundry} laundry
              </p>
            </div>
            <Link
              href="/housekeeping/maintenance-requests"
              className="text-xs font-medium text-emerald-700 hover:underline"
            >
              View all
            </Link>
          </div>
          <ul className="flex flex-1 flex-col divide-y divide-slate-100">
            {activeMaint.slice(0, 2).map((ticket) => (
              <li key={ticket.id} className="flex items-center justify-between gap-2 py-2 first:pt-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    Room {ticket.room}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">{ticket.problem}</p>
                </div>
                <Pill status={ticket.priority} />
              </li>
            ))}
            {laundryPreview.map((job) => (
              <li key={job.id} className="flex items-center justify-between gap-2 py-2 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{job.item}</p>
                  <p className="truncate text-[11px] text-slate-500">
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
        </section>
      </div>
      </>
      )}
    </ModulePageShell>
  );
}
