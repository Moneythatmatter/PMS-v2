"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Wrench,
  AlertTriangle,
  ClipboardList,
  CalendarClock,
  DoorClosed,
  Plus,
  Clock,
  CheckCircle2,
  Search,
  ChevronRight,
  ShieldAlert,
  Check,
  X,
  Info,
  Layers,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ModulePageShell } from "@/components/pms";
import { cn } from "@/lib/utils";
import { usePsItem } from "@/hooks/usePsResource";
import { mntDashboardService } from "@/services/maintenance";
import {
  MaintenanceRequest,
  WorkOrder,
  RoomUnderMaintenance,
  PriorityLevel,
  EntryPreference,
  MaintenanceDashboardStats,
  PMSchedule,
} from "@/app/data/maintenance/types";

const EMPTY_STATS: MaintenanceDashboardStats = {
  openRequests: { total: 0, newCount: 0, inReviewCount: 0 },
  activeWorkOrders: { total: 0, inProgress: 0, awaitingParts: 0 },
  criticalIssues: { total: 0, safetyHazardCount: 0 },
  pmDueToday: { totalDue: 0, completed: 0, pending: 0 },
  roomsUnderMaintenance: { total: 0, oooCount: 0, oosCount: 0 },
};

export function MaintenanceDashboardView() {
  const { data: dashboard, loading } = usePsItem(() => mntDashboardService.get(), []);
  const stats = dashboard?.stats ?? EMPTY_STATS;
  const criticalIssues = dashboard?.criticalIssues ?? [];
  const activeWorkOrders = dashboard?.activeWorkOrders ?? [];
  const roomsUnderMaintenance = dashboard?.roomsUnderMaintenance ?? [];
  const pmTasksToday = dashboard?.pmTasksToday ?? [];

  const [searchTerm, setSearchTerm] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // State for slide-over drawer
  const [activeDrawerItem, setActiveDrawerItem] = useState<{
    type: "request" | "work_order" | "room";
    data: MaintenanceRequest | WorkOrder | RoomUnderMaintenance;
  } | null>(null);

  // State for Quick Create Request Modal
  const [isQuickRequestOpen, setIsQuickRequestOpen] = useState(false);
  const [quickLocation, setQuickLocation] = useState("");
  const [quickCategory, setQuickCategory] = useState("HVAC / Air Conditioning");
  const [quickPriority, setQuickPriority] = useState<PriorityLevel>("High");
  const [quickSafetyHazard, setQuickSafetyHazard] = useState(false);
  const [quickGuestInRoom, setQuickGuestInRoom] = useState<"Yes" | "No" | "Unknown">("Yes");
  const [quickEntryPref, setQuickEntryPref] = useState<EntryPreference>("Call Guest First");
  const [quickTitle, setQuickTitle] = useState("");
  const [quickDescription, setQuickDescription] = useState("");

  // Multi-issue snagging state
  const [snagItems, setSnagItems] = useState<{ id: string; issue: string; category: string }[]>([]);
  const [newSnagText, setNewSnagText] = useState("");

  const handleAddSnag = () => {
    if (!newSnagText.trim()) return;
    setSnagItems((prev) => [
      ...prev,
      {
        id: `snag-${Date.now()}`,
        issue: newSnagText.trim(),
        category: quickCategory,
      },
    ]);
    setNewSnagText("");
  };

  const handleRemoveSnag = (id: string) => {
    setSnagItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Filtered lists based on search
  const q = searchTerm.toLowerCase();
  const filteredCritical = criticalIssues.filter(
    (item) =>
      item.location.toLowerCase().includes(q) ||
      item.issue.toLowerCase().includes(q) ||
      (item.problemCategory || "").toLowerCase().includes(q) ||
      item.woNumber.toLowerCase().includes(q)
  );

  const filteredWorkOrders = activeWorkOrders.filter(
    (item) =>
      item.woNumber.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q) ||
      item.issue.toLowerCase().includes(q) ||
      (item.technicianName || "").toLowerCase().includes(q)
  );

  if (loading) {
    return (
      <div className="min-h-screen p-8 text-sm text-slate-600">Loading maintenance dashboard...</div>
    );
  }

  return (
    <ModulePageShell
      eyebrow="Engineering & Operations"
      title="Maintenance Dashboard"
      description="Real-time breakdown dispatch, active technician job cards, room maintenance blocks, and preventive compliance."
      breadcrumbs={[
        { label: "Maintenance", href: "/maintenance" },
        { label: "Dashboard" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      wrapChildren={false}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 sm:flex shadow-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Shift: <strong>Morning (08:00 - 16:00)</strong></span>
            <span className="text-slate-300">|</span>
            <span>Duty Eng: <strong>Amit Patel</strong></span>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-1.5 border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
            onClick={() => setIsQuickRequestOpen(true)}
          >
            <Plus className="h-3.5 w-3.5 text-slate-500" />
            <span>New Request</span>
          </Button>

          <Link href="/maintenance/work-orders">
            <Button
              size="sm"
              className="h-9 gap-1.5 bg-emerald-700 text-xs font-bold text-white hover:bg-emerald-800 shadow-xs"
            >
              <ClipboardList className="h-3.5 w-3.5" />
              <span>Work Orders</span>
            </Button>
          </Link>
        </div>
      }
    >
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. TOP 5 KPI METRIC CARDS */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 mb-5">
        {/* Card 1: Open Requests */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Open Requests</span>
            <span className="rounded-md bg-blue-50 p-1.5 text-blue-600">
              <ClipboardList className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {stats.openRequests.total}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            <span className="font-semibold text-blue-600">{stats.openRequests.newCount} new</span> · {stats.openRequests.inReviewCount} in review
          </p>
        </div>

        {/* Card 2: Active Work Orders */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-amber-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Active Work Orders</span>
            <span className="rounded-md bg-amber-50 p-1.5 text-amber-600">
              <Wrench className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {stats.activeWorkOrders.total}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            <span className="font-semibold text-amber-600">{stats.activeWorkOrders.inProgress} in progress</span> · {stats.activeWorkOrders.awaitingParts} parts wait
          </p>
        </div>

        {/* Card 3: PM Due Today */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">PM Due Today</span>
            <span className="rounded-md bg-emerald-50 p-1.5 text-emerald-600">
              <CalendarClock className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {stats.pmDueToday.totalDue}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            <span className="font-semibold text-emerald-600">{stats.pmDueToday.completed} done</span> · {stats.pmDueToday.pending} pending
          </p>
        </div>

        {/* Card 4: Rooms Blocked */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Rooms Blocked</span>
            <span className="rounded-md bg-emerald-50 p-1.5 text-emerald-600">
              <DoorClosed className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {stats.roomsUnderMaintenance.total}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            <span className="font-bold text-rose-600">{stats.roomsUnderMaintenance.oooCount} OOO</span> · <span className="font-bold text-amber-600">{stats.roomsUnderMaintenance.oosCount} OOS</span>
          </p>
        </div>

        {/* Card 5: Critical Issues */}
        <div className="col-span-2 sm:col-span-1 rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-rose-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Critical Issues</span>
            <span className="rounded-md bg-rose-50 p-1.5 text-rose-600">
              <AlertTriangle className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {stats.criticalIssues.total}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            <span className="font-bold text-rose-600">{stats.criticalIssues.safetyHazardCount} Safety Hazard</span> active
          </p>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. CRITICAL ISSUES REQUIRING IMMEDIATE ATTENTION */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden mb-5">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-rose-500" />
            <h2 className="text-sm font-bold text-slate-900">
              Critical Issues Requiring Attention
            </h2>
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
              {criticalIssues.length} Action Needed
            </span>
          </div>
          <Link
            href="/maintenance/work-orders"
            className="flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800"
          >
            <span>All Work Orders</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
              <tr>
                <th className="py-2.5 px-4">Location</th>
                <th className="py-2.5 px-3">Issue &amp; Category</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Technician / Due</th>
                <th className="py-2.5 px-3">Work Order</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCritical.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 px-4 text-center text-slate-500">
                    No critical work orders requiring attention.
                  </td>
                </tr>
              ) : (
                filteredCritical.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => setActiveDrawerItem({ type: "work_order", data: item })}
                  >
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {item.location}
                      <span className="block text-[10px] font-normal text-slate-400">
                        {item.locationType}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-900 line-clamp-1">{item.issue}</p>
                      <p className="text-[10px] text-slate-500">{item.problemCategory || item.woType}</p>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold border",
                            item.priority === "Critical"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          )}
                        >
                          {item.priority}
                        </span>
                        {item.isSafetyHazard && (
                          <span className="inline-flex items-center gap-1 rounded bg-rose-600 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                            <ShieldAlert className="h-2.5 w-2.5" />
                            Safety Hazard
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                      <p className="font-medium text-slate-800">{item.technicianName || "Unassigned"}</p>
                      <p className="text-[10px] text-slate-400">Due: {item.dueDate}</p>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-800 border border-slate-200">
                        {item.woNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDrawerItem({ type: "work_order", data: item });
                        }}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. MAIN 2-COLUMN OPERATIONAL GRID */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 mb-5">
        {/* LEFT COLUMN: ACTIVE WORK ORDERS (7 COLUMNS) */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 bg-slate-50/50 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Active Work Orders
              </h2>
              <p className="text-[11px] text-slate-500">
                In-progress job cards and technician dispatches
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search WO, room, tech..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-7.5 w-44 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
                <tr>
                  <th className="py-2.5 px-4">WO #</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Issue</th>
                  <th className="py-2.5 px-3">Technician / Vendor</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Due</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredWorkOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 px-4 text-center text-slate-500">
                      No active work orders.
                    </td>
                  </tr>
                ) : (
                  filteredWorkOrders.map((wo) => (
                  <tr
                    key={wo.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => setActiveDrawerItem({ type: "work_order", data: wo })}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {wo.woNumber}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {wo.location}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-900 line-clamp-1">{wo.issue}</p>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <p className="font-medium text-slate-900">{wo.technicianName}</p>
                      <p className="text-[10px] text-slate-400">
                        {wo.assignedType === "External Vendor" ? "External AMC" : "In-House"}
                      </p>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold border",
                          wo.status === "In Progress"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : wo.status === "Awaiting Parts"
                            ? "bg-slate-100 text-slate-700 border border-slate-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        )}
                      >
                        {wo.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-[11px] text-slate-600">
                      {wo.dueDate}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDrawerItem({ type: "work_order", data: wo });
                        }}
                      >
                        Open
                      </Button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: ROOMS UNDER MAINTENANCE (5 COLUMNS) */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <DoorClosed className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Rooms Under Maintenance
              </h3>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
              {roomsUnderMaintenance.length} Blocked
            </span>
          </div>

          <div className="mt-2.5 rounded-lg bg-slate-50 p-2 text-[11px] text-slate-600 border border-slate-200/60">
            <div className="flex items-start gap-1.5">
              <Info className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>
                <strong>OOO:</strong> Out of Order (Cannot Sell) · <strong>OOS:</strong> Out of Service (Short Repair)
              </span>
            </div>
          </div>

          <div className="mt-3 space-y-2.5">
            {roomsUnderMaintenance.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">No rooms currently blocked.</p>
            ) : (
              roomsUnderMaintenance.map((rm) => (
              <div
                key={rm.id}
                className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 hover:bg-slate-100/60 transition-colors cursor-pointer"
                onClick={() => setActiveDrawerItem({ type: "room", data: rm })}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{rm.roomNumber}</span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-bold border",
                        rm.blockType === "OOO"
                          ? "bg-rose-100 text-rose-800 border-rose-200"
                          : "bg-amber-100 text-amber-800 border-amber-200"
                      )}
                    >
                      {rm.blockType}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] font-semibold text-slate-500">
                    {rm.workOrderNo}
                  </span>
                </div>

                <p className="mt-1 text-xs text-slate-700 font-medium line-clamp-1">
                  {rm.reason}
                </p>

                <div className="mt-2 flex items-center justify-between border-t border-slate-200/60 pt-2 text-[10px] text-slate-500">
                  <span>Tech: <strong>{rm.technician}</strong></span>
                  <span className="font-medium text-slate-700">
                    ETA: {rm.expectedHandover}
                  </span>
                </div>

                <div className="mt-1 text-[10px] font-semibold text-emerald-700">
                  HK Status: {rm.hkHandoverStatus}
                </div>
              </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. TODAY'S PREVENTIVE MAINTENANCE CHECKLIST */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs mb-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Today&apos;s PM Checklist
              </h3>
              <p className="text-[11px] text-slate-500">
                Scheduled routine asset inspections and service tasks
              </p>
            </div>
          </div>
          <Link
            href="/maintenance/preventive"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>View All Tasks</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {pmTasksToday.length === 0 ? (
            <p className="col-span-full py-6 text-center text-xs text-slate-500">
              No preventive tasks due today.
            </p>
          ) : (
            pmTasksToday.map((task: PMSchedule) => (
              <div
                key={task.id}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-[10px] font-bold text-slate-500">
                    {task.assetCode}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 border",
                      task.status === "Due" || task.status === "Overdue"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    )}
                  >
                    {task.status}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">{task.assetName}</p>
                <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">{task.taskTitle}</p>
                <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                  <span>
                    {task.technicianName || task.maintenanceVendorName || "Unassigned"}
                  </span>
                  <span className="font-semibold text-slate-700">{task.frequency}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. RIGHT-SIDE SLIDE-OVER DRAWER */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeDrawerItem && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity">
          <div className="flex h-full w-full max-w-lg flex-col bg-white shadow-2xl border-l border-slate-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {activeDrawerItem.type === "request"
                    ? (activeDrawerItem.data as MaintenanceRequest).requestNo
                    : activeDrawerItem.type === "work_order"
                    ? (activeDrawerItem.data as WorkOrder).woNumber
                    : (activeDrawerItem.data as RoomUnderMaintenance).roomNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  {activeDrawerItem.type === "request"
                    ? "Maintenance Request Details & Status"
                    : activeDrawerItem.type === "work_order"
                    ? "Work Order & Technician Job Card"
                    : "Room Maintenance & Handover Status"}
                </p>
              </div>
              <button
                onClick={() => setActiveDrawerItem(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700">
              {activeDrawerItem.type === "request" && (() => {
                const req = activeDrawerItem.data as MaintenanceRequest;
                return (
                  <>
                    <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-slate-900 text-sm">{req.location}</span>
                          <span className="block text-[11px] text-slate-500">{req.category}</span>
                        </div>
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700 border border-amber-200">
                          {req.status}
                        </span>
                      </div>
                      <p className="mt-2 font-semibold text-slate-900">{req.issueTitle}</p>
                      <p className="mt-1 text-slate-600">{req.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="rounded border border-slate-200 p-2.5">
                        <span className="text-slate-400 block text-[10px]">Guest in Room</span>
                        <span className="font-semibold text-slate-800">{req.guestInRoom}</span>
                      </div>
                      <div className="rounded border border-slate-200 p-2.5">
                        <span className="text-slate-400 block text-[10px]">Entry Preference</span>
                        <span className="font-semibold text-slate-800">{req.entryPreference}</span>
                      </div>
                    </div>

                    {req.isSafetyHazard && (
                      <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 flex items-center gap-2 text-rose-800">
                        <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
                        <span className="font-semibold text-xs">Flagged as Safety Hazard</span>
                      </div>
                    )}

                    <div>
                      <h4 className="font-bold text-slate-900 mb-2">Ticket Timeline</h4>
                      <div className="space-y-2 border-l-2 border-slate-200 pl-3">
                        <div className="text-[11px]">
                          <p className="font-semibold text-slate-800">Request Created</p>
                          <p className="text-slate-400">By {req.reportedBy} ({req.reportedDept}) at {req.dateTime}</p>
                        </div>
                        {req.workOrderNo && (
                          <div className="text-[11px]">
                            <p className="font-semibold text-slate-800">Work Order Dispatched</p>
                            <p className="text-slate-400">Assigned as {req.workOrderNo}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}

              {activeDrawerItem.type === "work_order" && (() => {
                const wo = activeDrawerItem.data as WorkOrder;
                return (
                  <>
                    <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-slate-900 text-sm">{wo.woNumber} · {wo.location}</span>
                          <span className="block text-[11px] text-slate-500">{wo.issue}</span>
                        </div>
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700 border border-amber-200">
                          {wo.status}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900">Assigned Technician</h4>
                      <div className="flex items-center justify-between rounded border border-slate-200 p-3">
                        <div>
                          <p className="font-semibold text-slate-900">{wo.technicianName}</p>
                          <p className="text-[11px] text-slate-500">{wo.assignedType} {wo.vendorName ? `(${wo.vendorName})` : ""}</p>
                        </div>
                        {wo.technicianContact && (
                          <span className="text-xs font-mono text-slate-600">{wo.technicianContact}</span>
                        )}
                      </div>
                    </div>

                    {wo.checklistItems && wo.checklistItems.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-bold text-slate-900">Task Checklist</h4>
                        <div className="space-y-1.5">
                          {wo.checklistItems.map((c) => (
                            <div key={c.id} className="flex items-center gap-2 text-xs">
                              <span className={cn("flex h-4 w-4 items-center justify-center rounded", c.completed ? "bg-emerald-600 text-white" : "border border-slate-300")}>
                                {c.completed && <Check className="h-3 w-3" />}
                              </span>
                              <span className={c.completed ? "line-through text-slate-400" : "text-slate-800"}>
                                {c.description}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900">Cost Summary</h4>
                      <div className="rounded border border-slate-200 p-3 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Parts Cost</span>
                          <span className="font-mono font-medium">₹{wo.partsCost}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">External Service Cost</span>
                          <span className="font-mono font-medium">₹{wo.externalServiceCost}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-100 pt-1 font-bold text-slate-900">
                          <span>Total Maintenance Cost</span>
                          <span className="font-mono text-emerald-700">₹{wo.totalCost}</span>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}

              {activeDrawerItem.type === "room" && (() => {
                const rm = activeDrawerItem.data as RoomUnderMaintenance;
                return (
                  <>
                    <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-slate-900 text-base">{rm.roomNumber}</span>
                          <span className="block text-[11px] text-slate-500">{rm.roomType} · {rm.floor}</span>
                        </div>
                        <span className={cn("rounded px-2 py-0.5 text-xs font-bold", rm.blockType === "OOO" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800")}>
                          {rm.blockType === "OOO" ? "Out of Order" : "Out of Service"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900">Reason for Block</h4>
                      <p className="rounded border border-slate-200 p-3 text-slate-700">{rm.reason}</p>
                    </div>

                    <div className="rounded-lg bg-emerald-50 border border-emerald-200/80 p-3.5">
                      <h4 className="font-bold text-emerald-950 text-xs">Housekeeping Handshake</h4>
                      <p className="text-[11px] text-emerald-800 mt-1">
                        Current Status: <strong>{rm.hkHandoverStatus}</strong>. Front Office releases the room only after Housekeeping completes inspection.
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Drawer Footer */}
            <div className="border-t border-slate-200 px-6 py-3 flex justify-end gap-2 bg-slate-50">
              <Button variant="outline" size="sm" onClick={() => setActiveDrawerItem(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. MODAL: QUICK NEW REQUEST (MULTI-SNAG CAPABILITY) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isQuickRequestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Create Maintenance Request</h3>
                <p className="text-xs text-slate-500">Quick-entry for front desk, housekeeping & F&B</p>
              </div>
              <button onClick={() => setIsQuickRequestOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-slate-700 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-900 block mb-1">Location / Room #</label>
                  <input
                    type="text"
                    placeholder="e.g. Room 305 or Main Kitchen"
                    value={quickLocation}
                    onChange={(e) => setQuickLocation(e.target.value)}
                    className="w-full h-8 rounded-lg border border-slate-200 px-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-900 block mb-1">Problem Category</label>
                  <select
                    value={quickCategory}
                    onChange={(e) => setQuickCategory(e.target.value)}
                    className="w-full h-8 rounded-lg border border-slate-200 px-2 text-xs focus:border-emerald-500 focus:outline-none"
                  >
                    <option>HVAC / Air Conditioning</option>
                    <option>Electrical / Lighting</option>
                    <option>Plumbing & Sanitary</option>
                    <option>Carpentry & Furniture</option>
                    <option>Kitchen Machinery</option>
                    <option>Civil / Paint / Glass</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-900 block mb-1">Priority</label>
                  <select
                    value={quickPriority}
                    onChange={(e) => setQuickPriority(e.target.value as PriorityLevel)}
                    className="w-full h-8 rounded-lg border border-slate-200 px-2 text-xs focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={quickSafetyHazard}
                      onChange={(e) => setQuickSafetyHazard(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                    />
                    <span className="font-bold text-rose-700">Safety Hazard Flag</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 border border-slate-200/80">
                <div>
                  <label className="font-semibold text-slate-900 block mb-1">Guest in Room?</label>
                  <select
                    value={quickGuestInRoom}
                    onChange={(e) => setQuickGuestInRoom(e.target.value as "Yes" | "No" | "Unknown")}
                    className="w-full h-8 rounded-lg border border-slate-200 px-2 text-xs focus:border-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="Yes">Yes (Occupied)</option>
                    <option value="No">No (Vacant)</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-900 block mb-1">Entry Preference</label>
                  <select
                    value={quickEntryPref}
                    onChange={(e) => setQuickEntryPref(e.target.value as EntryPreference)}
                    className="w-full h-8 rounded-lg border border-slate-200 px-2 text-xs focus:border-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="Call Guest First">Call Guest First</option>
                    <option value="Guest Permission Confirmed">Guest Permission Confirmed</option>
                    <option value="Enter When Guest Absent">Enter When Guest Absent</option>
                    <option value="Coordinate with Duty Manager">Coordinate with Duty Manager</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-900 block mb-1">Primary Issue Title</label>
                <input
                  type="text"
                  placeholder="e.g. AC blowing warm air or bathroom tap leak"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  className="w-full h-8 rounded-lg border border-slate-200 px-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-900 block mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional details reported by guest or room attendant..."
                  value={quickDescription}
                  onChange={(e) => setQuickDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="rounded-lg border border-dashed border-slate-300 p-3 bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 text-[11px]">Multi-Issue Snagging (Room Audits)</span>
                  <span className="text-[10px] text-slate-400">Add multiple small items to 1 ticket</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Wardrobe handle loose, bulb flickering"
                    value={newSnagText}
                    onChange={(e) => setNewSnagText(e.target.value)}
                    className="flex-1 h-7 rounded border border-slate-200 px-2 text-xs bg-white"
                  />
                  <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={handleAddSnag}>
                    + Add
                  </Button>
                </div>

                {snagItems.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {snagItems.map((item, idx) => (
                      <div key={item.id} className="flex items-center justify-between bg-white px-2 py-1 rounded border border-slate-200 text-[11px]">
                        <span>{idx + 1}. {item.issue}</span>
                        <button onClick={() => handleRemoveSnag(item.id)} className="text-rose-500 hover:text-rose-700">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-3 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsQuickRequestOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-emerald-700 text-white hover:bg-emerald-800"
                onClick={() => {
                  setToastMessage("Maintenance request logged and dispatched to Engineering!");
                  setIsQuickRequestOpen(false);
                }}
              >
                Submit Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </ModulePageShell>
  );
}
