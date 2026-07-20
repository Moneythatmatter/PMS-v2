"use client";

import React, { useMemo } from "react";
import { useHousekeeping } from "@/components/housekeeping/HousekeepingContext";
import {
  Sparkles,
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  Bed,
  Layers,
  ArrowRightLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Custom Card component
function DashboardStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorClass,
  borderColor,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  borderColor: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        borderColor
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <h3 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-800">{value}</h3>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className={cn("rounded-xl p-2.5 shadow-sm", colorClass)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
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
    currentUserRole,
    currentUsername,
  } = useHousekeeping();

  // Compute metrics
  const stats = useMemo(() => {
    const dirty = rooms.filter((r) => r.status.includes("Dirty")).length;
    const cleaning = rooms.filter((r) => r.status === "Cleaning").length;
    const pendingInspection = rooms.filter((r) => r.status === "Inspection Pending").length;
    const ready = rooms.filter((r) => r.status === "Vacant Ready").length;
    const occupied = rooms.filter((r) => r.status.startsWith("Occupied")).length;
    const blocked = rooms.filter(
      (r) => r.status === "Blocked" || r.status === "Out of Order" || r.status === "Out of Service"
    ).length;

    const openRequests = requests.filter((r) => r.status !== "Completed").length;
    const openMaint = maintenance.filter((m) => m.status !== "Closed").length;
    const pendingLaundry = laundryJobs.filter((l) => l.status !== "Delivered").length;
    const dirtyPublicAreas = publicAreas.filter((p) => p.status === "Dirty").length;

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
    };
  }, [rooms, requests, maintenance, laundryJobs, publicAreas]);

  // Chart 1: Room Status Pie Chart
  const roomStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    rooms.forEach((r) => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [rooms]);

  const PIE_COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#64748b", "#ec4899"];

  // Chart 2: Inventory low stock
  const linenStockData = useMemo(() => {
    return inventory
      .filter((item) => item.category === "Linen")
      .map((item) => ({
        name: item.name.replace("Bed Sheets", "Sheets").replace("Towels", "Tow").replace("Covers", "Cov"),
        Available: item.available,
        Par: item.parStock,
      }));
  }, [inventory]);

  // Table Data: Awaiting Inspection
  const inspectionPendingRooms = useMemo(() => {
    return rooms.filter((r) => r.status === "Inspection Pending");
  }, [rooms]);

  // Table Data: VIP Rooms Checked-In/Arriving
  const vipRooms = useMemo(() => {
    return rooms.filter((r) => r.remarks.toLowerCase().includes("vip") || r.category.includes("Suite"));
  }, [rooms]);

  // Table Data: Active Requests
  const activeRequestsList = useMemo(() => {
    return requests.filter((r) => r.status !== "Completed").slice(0, 5);
  }, [requests]);

  // Table Data: Maintenance Requests
  const activeMaintList = useMemo(() => {
    return maintenance.filter((m) => m.status !== "Closed").slice(0, 5);
  }, [maintenance]);

  // Inventory Low Stock Warnings
  const lowStockItems = useMemo(() => {
    return inventory.filter((item) => item.available < item.parStock * 0.6);
  }, [inventory]);

  return (
    <div className="space-y-6">
      {/* Eyebrow and Title */}
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">PMS Housekeeping</span>
          <h1 className="mt-1 text-2xl font-bold text-slate-800 sm:text-3xl">Housekeeping Operations</h1>
          <p className="text-sm text-slate-500">
            Real-time occupancy status, staff assignments, and room cleaning checklist tracking.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Active Profile: <strong className="text-slate-800">{currentUsername}</strong> ({currentUserRole})
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <DashboardStatCard
          title="Dirty Rooms"
          value={stats.dirty}
          subtitle="Needs cleaning"
          icon={AlertTriangle}
          colorClass="bg-red-50 text-red-600"
          borderColor="border-red-100 hover:border-red-200"
        />
        <DashboardStatCard
          title="In Progress"
          value={stats.cleaning}
          subtitle="Cleaning active"
          icon={Clock}
          colorClass="bg-amber-50 text-amber-600"
          borderColor="border-amber-100 hover:border-amber-200"
        />
        <DashboardStatCard
          title="Pending Verify"
          value={stats.pendingInspection}
          subtitle="Awaiting inspection"
          icon={Layers}
          colorClass="bg-blue-50 text-blue-600"
          borderColor="border-blue-100 hover:border-blue-200"
        />
        <DashboardStatCard
          title="Vacant Ready"
          value={stats.ready}
          subtitle="Available for sale"
          icon={CheckCircle2}
          colorClass="bg-emerald-50 text-emerald-600"
          borderColor="border-emerald-100 hover:border-emerald-200"
        />
        <DashboardStatCard
          title="Occupied"
          value={stats.occupied}
          subtitle="Guest in house"
          icon={Bed}
          colorClass="bg-violet-50 text-violet-600"
          borderColor="border-violet-100 hover:border-violet-200"
        />
        <DashboardStatCard
          title="Blocked / OOO"
          value={stats.blocked}
          subtitle="Out of order/Blocked"
          icon={FolderOpen}
          colorClass="bg-slate-50 text-slate-600"
          borderColor="border-slate-100 hover:border-slate-200"
        />
      </div>

      {/* Main Grid: Charts & Operations summaries */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left Side: Charts & Verification tables (8 cols) */}
        <div className="space-y-6 xl:col-span-8">
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            
            {/* Status Pie Chart */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-800">Room Status Distribution</h2>
              <p className="mb-4 text-xs text-slate-400">Total room allocation breakdown</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roomStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {roomStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Linen Stock Chart */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-800">Linen Stock Levels</h2>
              <p className="mb-4 text-xs text-slate-400">Current available stock vs par values</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={linenStockData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Available" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Par" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Table: Rooms Awaiting Verification */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Rooms Awaiting Verification</h2>
                <p className="text-xs text-slate-400">Completed cleanings ready for supervisor sign-off</p>
              </div>
              <Link
                href="/housekeeping/operations/inspection"
                className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                Go to Inspection <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            
            {inspectionPendingRooms.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-100 rounded-xl">
                No rooms currently awaiting inspection. All clean rooms are active or sold!
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-2.5">Room</th>
                      <th className="px-4 py-2.5">Category</th>
                      <th className="px-4 py-2.5">Floor</th>
                      <th className="px-4 py-2.5">Cleaned By</th>
                      <th className="px-4 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inspectionPendingRooms.map((room) => (
                      <tr key={room.roomNo} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-semibold text-slate-800">Room {room.roomNo}</td>
                        <td className="px-4 py-3 text-slate-500">{room.category}</td>
                        <td className="px-4 py-3 text-slate-500">{room.floor}</td>
                        <td className="px-4 py-3 text-slate-600 font-medium">{room.assignedStaff || "Staff"}</td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/housekeeping/operations/inspection?room=${room.roomNo}`}
                            className="inline-flex items-center rounded-lg bg-emerald-700 px-2.5 py-1 font-semibold text-white hover:bg-emerald-800"
                          >
                            Inspect
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pending Guest & Maintenance Requests */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            
            {/* Guest Requests list */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">Guest Services Queue</h3>
                <Link href="/housekeeping/housekeeping-requests" className="text-xs font-medium text-emerald-700 hover:underline">
                  View All
                </Link>
              </div>
              <div className="space-y-3">
                {activeRequestsList.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-400">No active guest requests.</p>
                ) : (
                  activeRequestsList.map((req) => (
                    <div key={req.id} className="flex items-start justify-between rounded-xl border border-slate-50 bg-slate-50/40 p-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 text-xs">Room {req.room}</span>
                          <span
                            className={cn(
                              "rounded-full px-1.5 py-0.5 text-[9px] font-medium",
                              req.priority === "High" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                            )}
                          >
                            {req.priority}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600 font-medium">{req.issue}</p>
                      </div>
                      <span className="text-[10px] text-slate-400">{req.createdAt}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Maintenance tickets */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">Engineering Work Orders</h3>
                <Link href="/housekeeping/maintenance-requests" className="text-xs font-medium text-emerald-700 hover:underline">
                  View All
                </Link>
              </div>
              <div className="space-y-3">
                {activeMaintList.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-400">No active maintenance work orders.</p>
                ) : (
                  activeMaintList.map((ticket, idx) => (
                    <div key={`${ticket.id}-${idx}`} className="flex items-start justify-between rounded-xl border border-slate-50 bg-slate-50/40 p-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 text-xs">Room {ticket.room}</span>
                          <span
                            className={cn(
                              "rounded-full px-1.5 py-0.5 text-[9px] font-medium",
                              ticket.priority === "Critical" || ticket.priority === "High"
                                ? "bg-red-50 text-red-700"
                                : "bg-slate-100 text-slate-700"
                            )}
                          >
                            {ticket.priority}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600 font-medium">{ticket.problem}</p>
                      </div>
                      <span className="text-[10px] text-slate-400">{ticket.status}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Right Side: Alerts, VIP, Public Areas (4 cols) */}
        <div className="space-y-6 xl:col-span-4">
          
          {/* Alerts panel */}
          <div className="rounded-2xl border border-red-100 bg-red-50/20 p-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-red-800">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Critical Alerts
            </h3>
            <div className="mt-4 space-y-3">
              {/* Public area dirty */}
              {stats.dirtyPublicAreas > 0 && (
                <div className="rounded-xl bg-white p-3 shadow-sm border border-red-50 flex items-start gap-2.5">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-600"></span>
                  <p className="text-xs text-slate-600">
                    <strong>{stats.dirtyPublicAreas} Public Areas</strong> are marked Dirty and need clean up.
                  </p>
                </div>
              )}
              {/* Low stock alerts */}
              {lowStockItems.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-xl bg-white p-3 shadow-sm border border-red-50 flex items-start gap-2.5">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"></span>
                  <p className="text-xs text-slate-600">
                    Low inventory stock: <strong>{item.name}</strong> has only {item.available} {item.unit} left (Par: {item.parStock}).
                  </p>
                </div>
              ))}
              {/* OOO rooms */}
              {rooms.some((r) => r.status === "Out of Order") && (
                <div className="rounded-xl bg-white p-3 shadow-sm border border-red-50 flex items-start gap-2.5">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-600"></span>
                  <p className="text-xs text-slate-600">
                    Rooms marked <strong>Out of Order</strong> are removed from sellable availability. Verify repair quickly!
                  </p>
                </div>
              )}
              {stats.dirtyPublicAreas === 0 && lowStockItems.length === 0 && (
                <p className="text-xs text-slate-500 py-2">No critical supply warnings or operational holds.</p>
              )}
            </div>
          </div>

          {/* VIP arrivals checklist */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              VIP Check-In Prep
            </h3>
            <p className="mb-4 text-xs text-slate-400">High priority arrivals needing ready rooms</p>
            <div className="space-y-3">
              {vipRooms.map((room) => (
                <div key={room.roomNo} className="rounded-xl border border-slate-100 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 text-xs">Room {room.roomNo}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[9px] font-semibold",
                        room.status === "Vacant Ready"
                          ? "bg-emerald-50 text-emerald-700"
                          : room.status === "Cleaning" || room.status === "Inspection Pending"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
                      )}
                    >
                      {room.status}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{room.category}</span>
                    <span className="italic text-emerald-700">{room.remarks || "VIP Prep"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Laundry work */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <ArrowRightLeft className="h-4 w-4 text-slate-600" />
                Laundry Operations
              </h3>
              <Link href="/housekeeping/operations/laundry" className="text-xs font-medium text-emerald-700 hover:underline">
                Manage
              </Link>
            </div>
            <div className="space-y-3">
              {laundryJobs.slice(0, 3).map((job) => (
                <div key={job.id} className="flex items-center justify-between text-xs border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-slate-700">{job.item}</p>
                    <p className="text-[10px] text-slate-400">Qty: {job.quantity} · {job.type} Laundry</p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[9px] font-semibold",
                      job.status === "Delivered" || job.status === "Ready"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    )}
                  >
                    {job.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
