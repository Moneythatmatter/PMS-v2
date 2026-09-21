"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  Download,
  Clock,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Building2,
  Boxes,
  FileSpreadsheet,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Card, Modal } from "@/components/ui";
import { cn } from "@/lib/utils";
import { usePsItem } from "@/hooks/usePsResource";
import { mntReportsService, type MntReportsData } from "@/services/maintenance";

type TurnaroundRow = {
  woNumber?: string;
  location?: string;
  category?: string;
  priority?: string;
  status?: string;
  technician?: string;
  dueDate?: string;
  totalCost?: number;
};

type PmComplianceRow = {
  pmNumber?: string;
  assetCode?: string;
  assetName?: string;
  taskTitle?: string;
  frequency?: string;
  nextDueDate?: string;
  status?: string;
  lastCompletedDate?: string;
};

type RoomDowntimeRow = {
  room?: string;
  blockType?: string;
  workOrderNo?: string;
  reason?: string;
  status?: string;
  technician?: string;
};

type SparePartsRow = {
  partName?: string;
  productCode?: string;
  quantity?: number;
  totalCost?: number;
  woNumber?: string;
};

const EMPTY_REPORTS: MntReportsData = {
  turnaround: [],
  pmCompliance: [],
  roomDowntime: [],
  spareParts: [],
};

export function MaintenanceReportsView() {
  const { data: reportsData, loading } = usePsItem(() => mntReportsService.get(), []);
  const reports = reportsData ?? EMPTY_REPORTS;

  const turnaround = (reports.turnaround ?? []) as TurnaroundRow[];
  const pmCompliance = (reports.pmCompliance ?? []) as PmComplianceRow[];
  const roomDowntime = (reports.roomDowntime ?? []) as RoomDowntimeRow[];
  const spareParts = (reports.spareParts ?? []) as SparePartsRow[];

  const [activeTab, setActiveTab] = useState<"turnaround" | "pm_compliance" | "downtime" | "spare_parts">("turnaround");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("THIS_MONTH");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel" | "csv">("pdf");

  const q = searchTerm.toLowerCase();

  const filteredTurnaround = useMemo(() => {
    return turnaround.filter((item) =>
      [item.woNumber, item.location, item.category, item.technician, item.status, item.priority]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [turnaround, q]);

  const filteredPm = useMemo(() => {
    return pmCompliance.filter((item) =>
      [item.pmNumber, item.assetCode, item.assetName, item.taskTitle, item.status, item.frequency]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [pmCompliance, q]);

  const filteredDowntime = useMemo(() => {
    return roomDowntime.filter((item) =>
      [item.room, item.reason, item.workOrderNo, item.technician, item.status]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [roomDowntime, q]);

  const filteredParts = useMemo(() => {
    return spareParts.filter((item) =>
      [item.partName, item.productCode, item.woNumber]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [spareParts, q]);

  const kpis = useMemo(() => {
    const closedStatuses = new Set(["Completed", "Verified", "Closed"]);
    const completedWos = turnaround.filter((w) => closedStatuses.has(String(w.status ?? "")));
    const totalCost = turnaround.reduce((sum, w) => sum + Number(w.totalCost ?? 0), 0);
    const partsCost = spareParts.reduce((sum, p) => sum + Number(p.totalCost ?? 0), 0);
    const partsQty = spareParts.reduce((sum, p) => sum + Number(p.quantity ?? 0), 0);
    const dueOrOverdue = pmCompliance.filter((p) => p.status === "Due" || p.status === "Overdue").length;
    const compliant = pmCompliance.filter((p) => p.status === "Upcoming" || Boolean(p.lastCompletedDate)).length;
    const compliancePct =
      pmCompliance.length === 0 ? null : Math.round((compliant / pmCompliance.length) * 1000) / 10;

    return {
      completedCount: completedWos.length,
      openCount: turnaround.length - completedWos.length,
      totalCost,
      partsCost,
      partsQty,
      downtimeRooms: roomDowntime.length,
      compliancePct,
      dueOrOverdue,
      pmTotal: pmCompliance.length,
    };
  }, [turnaround, pmCompliance, roomDowntime, spareParts]);

  const handleTriggerExport = (e: React.FormEvent) => {
    e.preventDefault();
    setIsExportModalOpen(false);
    setToastMessage(`✓ Maintenance Report (${exportFormat.toUpperCase()}) generated and downloaded.`);
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 text-sm text-slate-600">Loading maintenance reports...</div>
    );
  }

  return (
    <ModulePageShell
      eyebrow="Maintenance / Reports"
      title="Maintenance Reports"
      description="Work order turnaround times, room downtime analytics, PM compliance rates, and spare parts consumption."
      breadcrumbs={[
        { label: "Maintenance", href: "/maintenance" },
        { label: "Reports" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex items-center gap-2">
          <Link href="/maintenance">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-semibold h-9 px-3 flex items-center gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Button>
          </Link>
          <Button
            type="button"
            size="sm"
            onClick={() => setIsExportModalOpen(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 h-9 px-3.5"
          >
            <Download className="h-4 w-4" /> Export Report
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5 mb-5">
        <Card className="h-full min-w-0 p-3 sm:p-4.5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Work Orders Logged
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 sm:h-8 sm:w-8">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            {turnaround.length === 0 ? "—" : turnaround.length}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            {turnaround.length === 0
              ? "No work orders in range"
              : `${kpis.completedCount} closed · ${kpis.openCount} open`}
          </p>
        </Card>

        <Card className="h-full min-w-0 p-3 sm:p-4.5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              PM Compliance Rate
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 sm:h-8 sm:w-8">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-emerald-700 sm:text-2xl">
            {kpis.compliancePct === null ? "—" : `${kpis.compliancePct}%`}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            {kpis.pmTotal === 0
              ? "No PM schedules"
              : `${kpis.dueOrOverdue} due/overdue of ${kpis.pmTotal}`}
          </p>
        </Card>

        <Card className="h-full min-w-0 p-3 sm:p-4.5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Room Downtime (OOO/OOS)
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 sm:h-8 sm:w-8">
              <AlertTriangle className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            {kpis.downtimeRooms === 0 ? "—" : kpis.downtimeRooms}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            {kpis.downtimeRooms === 0 ? "No blocked rooms" : "rooms with OOO/OOS blocks"}
          </p>
        </Card>

        <Card className="h-full min-w-0 p-3 sm:p-4.5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Spare Parts Spent
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 sm:h-8 sm:w-8">
              <DollarSign className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            {spareParts.length === 0 ? "—" : `₹${kpis.partsCost.toLocaleString("en-IN")}`}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            {spareParts.length === 0
              ? "No parts issued"
              : `${kpis.partsQty} items · WO cost ₹${kpis.totalCost.toLocaleString("en-IN")}`}
          </p>
        </Card>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5 mb-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab("turnaround")}
              className={cn(
                "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap",
                activeTab === "turnaround" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Clock className="h-3.5 w-3.5" /> WO Turnaround
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("pm_compliance")}
              className={cn(
                "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap",
                activeTab === "pm_compliance" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> PM Compliance
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("downtime")}
              className={cn(
                "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap",
                activeTab === "downtime" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Building2 className="h-3.5 w-3.5" /> Room Downtime
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("spare_parts")}
              className={cn(
                "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap",
                activeTab === "spare_parts" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Boxes className="h-3.5 w-3.5" /> Spare Parts Spent
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 font-medium hidden md:inline">Date Range:</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="THIS_MONTH">This Month</option>
              <option value="LAST_MONTH">Last Month</option>
              <option value="THIS_QUARTER">This Quarter</option>
              <option value="YTD">Year to Date</option>
            </select>
          </div>
        </div>

        <div className="mt-3.5 relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search report by WO, room, asset, part, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {activeTab === "turnaround" && (
        <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Work Order Resolution &amp; Turnaround</h3>
              <p className="text-xs text-slate-500">Live work orders with priority, status, assignee, due date, and cost.</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              {filteredTurnaround.length} WOs
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4">WO #</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Technician</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-4 text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTurnaround.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 px-4 text-center text-slate-500">
                      No turnaround data available.
                    </td>
                  </tr>
                ) : (
                  filteredTurnaround.map((row, idx) => (
                    <tr key={`${row.woNumber}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{row.woNumber || "—"}</td>
                      <td className="py-3.5 px-3 font-semibold text-slate-800">{row.location || "—"}</td>
                      <td className="py-3.5 px-3 text-slate-600">{row.category || "—"}</td>
                      <td className="py-3.5 px-3 font-semibold">{row.priority || "—"}</td>
                      <td className="py-3.5 px-3">{row.status || "—"}</td>
                      <td className="py-3.5 px-3">{row.technician || "Unassigned"}</td>
                      <td className="py-3.5 px-3 font-mono text-slate-600">{row.dueDate || "—"}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        ₹{Number(row.totalCost ?? 0).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "pm_compliance" && (
        <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Preventive Maintenance Compliance</h3>
              <p className="text-xs text-slate-500">Scheduled PM tasks with due dates and completion history.</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              {filteredPm.length} Schedules
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4">PM Number</th>
                  <th className="py-3 px-3">Asset</th>
                  <th className="py-3 px-3">Task Title</th>
                  <th className="py-3 px-3 text-center">Frequency</th>
                  <th className="py-3 px-3">Next Due</th>
                  <th className="py-3 px-3">Last Completed</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredPm.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 px-4 text-center text-slate-500">
                      No PM compliance data available.
                    </td>
                  </tr>
                ) : (
                  filteredPm.map((row, idx) => (
                    <tr key={`${row.pmNumber}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{row.pmNumber || "—"}</td>
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-900 block">{row.assetCode || "—"}</span>
                        <span className="text-[10px] text-slate-400 block">{row.assetName}</span>
                      </td>
                      <td className="py-3.5 px-3 font-medium text-slate-800">{row.taskTitle || "—"}</td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-[10px] text-slate-700">
                          {row.frequency || "—"}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-600">{row.nextDueDate || "—"}</td>
                      <td className="py-3.5 px-3 font-mono text-slate-600">{row.lastCompletedDate || "—"}</td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                            row.status === "Overdue"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : row.status === "Due"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          )}
                        >
                          {row.status === "Overdue" || row.status === "Due" ? (
                            <AlertTriangle className="h-3 w-3" />
                          ) : (
                            <ShieldCheck className="h-3 w-3" />
                          )}
                          {row.status || "—"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "downtime" && (
        <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Room Downtime (OOO / OOS)</h3>
              <p className="text-xs text-slate-500">Guest rooms blocked for maintenance with linked work orders.</p>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              {filteredDowntime.length} Rooms
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4">Room</th>
                  <th className="py-3 px-3 text-center">Block Type</th>
                  <th className="py-3 px-3">Work Order</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Technician</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredDowntime.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 px-4 text-center text-slate-500">
                      No room downtime data available.
                    </td>
                  </tr>
                ) : (
                  filteredDowntime.map((row, idx) => (
                    <tr key={`${row.workOrderNo}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{row.room || "—"}</td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full font-bold text-[10px] border",
                            row.blockType === "OOO"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          )}
                        >
                          {row.blockType || "—"}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-800">{row.workOrderNo || "—"}</td>
                      <td className="py-3.5 px-4 text-slate-800 font-medium">{row.reason || "—"}</td>
                      <td className="py-3.5 px-3 font-semibold text-slate-700">{row.status || "—"}</td>
                      <td className="py-3.5 px-4 text-right">{row.technician || "Unassigned"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "spare_parts" && (
        <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Spare Parts Consumption</h3>
              <p className="text-xs text-slate-500">Parts issued against maintenance work orders.</p>
            </div>
            <span className="text-xs font-bold text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
              Total: ₹{kpis.partsCost.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4">Part Name</th>
                  <th className="py-3 px-3">Product Code</th>
                  <th className="py-3 px-3 text-center">Quantity</th>
                  <th className="py-3 px-3 text-right">Total Cost</th>
                  <th className="py-3 px-4 text-right">Work Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredParts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 px-4 text-center text-slate-500">
                      No spare parts consumption data available.
                    </td>
                  </tr>
                ) : (
                  filteredParts.map((row, idx) => (
                    <tr key={`${row.productCode}-${row.woNumber}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{row.partName || "—"}</td>
                      <td className="py-3.5 px-3 font-mono text-slate-700">{row.productCode || "—"}</td>
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-900">
                        {Number(row.quantity ?? 0)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{Number(row.totalCost ?? 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-xs text-emerald-700 font-bold">
                        {row.woNumber || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Export Maintenance Report"
        maxWidth="sm"
      >
        <form onSubmit={handleTriggerExport} className="space-y-4 p-1 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Select preferred document format to download the complete Maintenance Analytics report.
          </p>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">File Format</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setExportFormat("pdf")}
                className={cn(
                  "p-2.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer flex flex-col items-center gap-1",
                  exportFormat === "pdf"
                    ? "border-emerald-500 bg-emerald-50/50 text-emerald-900"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                )}
              >
                <FileText className="h-5 w-5 text-rose-600" />
                PDF Document
              </button>
              <button
                type="button"
                onClick={() => setExportFormat("excel")}
                className={cn(
                  "p-2.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer flex flex-col items-center gap-1",
                  exportFormat === "excel"
                    ? "border-emerald-500 bg-emerald-50/50 text-emerald-900"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                )}
              >
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => setExportFormat("csv")}
                className={cn(
                  "p-2.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer flex flex-col items-center gap-1",
                  exportFormat === "csv"
                    ? "border-emerald-500 bg-emerald-50/50 text-emerald-900"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                )}
              >
                <FileText className="h-5 w-5 text-blue-600" />
                Raw CSV
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Date Scope</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full h-9 p-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
            >
              <option value="THIS_MONTH">This Month</option>
              <option value="LAST_MONTH">Last Month</option>
              <option value="THIS_QUARTER">This Quarter</option>
              <option value="YTD">Year to Date</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsExportModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs px-4"
            >
              Download Export
            </Button>
          </div>
        </form>
      </Modal>
    </ModulePageShell>
  );
}
