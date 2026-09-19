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
  Calendar,
  Filter,
  ArrowLeft,
  Wrench,
  Boxes,
  Building2,
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  Check,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Card, Drawer, Modal } from "@/components/ui";
import { cn } from "@/lib/utils";

// Mock Data for Reports
const MOCK_WO_TURNAROUND_REPORT = [
  { category: "HVAC / Air Conditioning", totalLogged: 14, resolvedOnTime: 13, overdue: 1, avgHours: 1.6, totalCost: 18400, compliancePct: 92.8 },
  { category: "Electrical & Lighting", totalLogged: 18, resolvedOnTime: 18, overdue: 0, avgHours: 0.8, totalCost: 6200, compliancePct: 100.0 },
  { category: "Plumbing & Sanitary", totalLogged: 12, resolvedOnTime: 11, overdue: 1, avgHours: 1.2, totalCost: 9800, compliancePct: 91.6 },
  { category: "Kitchen Equipment", totalLogged: 6, resolvedOnTime: 5, overdue: 1, avgHours: 3.4, totalCost: 12500, compliancePct: 83.3 },
  { category: "Lifts & Escalators", totalLogged: 3, resolvedOnTime: 3, overdue: 0, avgHours: 2.1, totalCost: 14000, compliancePct: 100.0 },
  { category: "Civil & Carpentry", totalLogged: 8, resolvedOnTime: 8, overdue: 0, avgHours: 1.5, totalCost: 3100, compliancePct: 100.0 },
];

const MOCK_PM_COMPLIANCE_REPORT = [
  { pmNumber: "PM-001", title: "Monthly Generator Inspection & Service", category: "Power & Backup", asset: "Cummins 250 kVA DG", frequency: "Monthly", target: 100, actual: 100, status: "Compliant" },
  { pmNumber: "PM-002", title: "Quarterly Chiller Plant Overhaul", category: "HVAC Plant", asset: "Daikin 120TR Chiller", frequency: "Quarterly", target: 100, actual: 100, status: "Compliant" },
  { pmNumber: "PM-003", title: "Monthly Swimming Pool Filtration & Pump Service", category: "Water & Pool", asset: "Pool Filtration & Pump #2", frequency: "Monthly", target: 100, actual: 80, status: "Action Required" },
  { pmNumber: "PM-004", title: "Monthly Elevator Safety & Traction Cable Test", category: "Lifts & Escalators", asset: "Schindler Elevator #1", frequency: "Monthly", target: 100, actual: 100, status: "Compliant" },
  { pmNumber: "PM-005", title: "Kitchen Exhaust Hood & Duct Degreasing", category: "Kitchen F&B", asset: "Commercial Kitchen Exhaust Hood", frequency: "Monthly", target: 100, actual: 100, status: "Compliant" },
];

const MOCK_ROOM_DOWNTIME_REPORT = [
  { room: "Room 305 (Deluxe Suite)", blockType: "OOO", reason: "AC Compressor & Capacitor Replacement", downtimeHours: 18.5, reportedDate: "2026-09-18", handoverStatus: "Inspected / Ready", cost: 4500 },
  { room: "Room 412 (Standard King)", blockType: "OOS", reason: "Shower Mixer Cartridge Jam & Dripping", downtimeHours: 6.0, reportedDate: "2026-09-18", handoverStatus: "Post-Maintenance Cleaning Req.", cost: 750 },
  { room: "Room 205 (Executive Room)", blockType: "OOO", reason: "Flush Valve & Concealed Cistern Repair", downtimeHours: 12.0, reportedDate: "2026-09-17", handoverStatus: "Under Repair", cost: 2800 },
  { room: "Room 108 (Junior Suite)", blockType: "OOS", reason: "Balcony Sliding Door Track Alignment", downtimeHours: 5.5, reportedDate: "2026-09-16", handoverStatus: "Inspected / Ready", cost: 400 },
];

const MOCK_SPARE_PARTS_REPORT = [
  { code: "GAS-R32-CYL", name: "R32 Refrigerant Gas Cylinder (1kg refill)", category: "HVAC", qty: 4, unitCost: 1200, totalCost: 4800, workOrders: "WO-102, WO-105" },
  { code: "ENG-FLTR-LF9009", name: "Cummins Oil Filter LF9009", category: "Power & Backup", qty: 2, unitCost: 1850, totalCost: 3700, workOrders: "WO-110" },
  { code: "PLUMB-FLUSH-GEB", name: "Geberit Concealed Dual Flush Cistern Assembly", category: "Plumbing", qty: 1, unitCost: 2800, totalCost: 2800, workOrders: "WO-108" },
  { code: "PLUMB-TAP-CARTRIDGE", name: "Jaquar 35mm Ceramic Disc Cartridge", category: "Plumbing", qty: 2, unitCost: 750, totalCost: 1500, workOrders: "WO-103" },
  { code: "ENG-CAP-45UF", name: "Motor Run Capacitor 45uF 440V", category: "HVAC", qty: 3, unitCost: 450, totalCost: 1350, workOrders: "WO-102, WO-109" },
];

export function MaintenanceReportsView() {
  const [activeTab, setActiveTab] = useState<"turnaround" | "pm_compliance" | "downtime" | "spare_parts">("turnaround");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("THIS_MONTH");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel" | "csv">("pdf");

  // Filtered turn around data
  const filteredTurnaround = useMemo(() => {
    return MOCK_WO_TURNAROUND_REPORT.filter((item) =>
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  // Filtered PM compliance data
  const filteredPm = useMemo(() => {
    return MOCK_PM_COMPLIANCE_REPORT.filter(
      (item) =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.pmNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  // Filtered Downtime data
  const filteredDowntime = useMemo(() => {
    return MOCK_ROOM_DOWNTIME_REPORT.filter(
      (item) =>
        item.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.reason.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  // Filtered Spare parts data
  const filteredParts = useMemo(() => {
    return MOCK_SPARE_PARTS_REPORT.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleTriggerExport = (e: React.FormEvent) => {
    e.preventDefault();
    setIsExportModalOpen(false);
    setToastMessage(`✓ Maintenance Report (${exportFormat.toUpperCase()}) generated and downloaded.`);
  };

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
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: OPERATIONAL SUMMARY CARDS (KPIS)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5 mb-5">
        {/* Card 1: Avg Turnaround Time */}
        <Card className="h-full min-w-0 p-3 sm:p-4.5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Avg Turnaround Time
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 sm:h-8 sm:w-8">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            1.8 Hours
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            Target benchmark: &lt; 2.5 Hours
          </p>
        </Card>

        {/* Card 2: PM Compliance Rate */}
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
            94.2%
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            28 of 30 tasks completed on schedule
          </p>
        </Card>

        {/* Card 3: Room Downtime */}
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
            42.0 Hours
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            4 rooms impacted this month
          </p>
        </Card>

        {/* Card 4: Spare Parts Consumption */}
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
            ₹14,150
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            12 items issued from stores
          </p>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: REPORT CATEGORY TAB SWITCHER & FILTERS TOOLBAR
      ───────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5 mb-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          {/* Report Tabs */}
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
              <option value="THIS_MONTH">This Month (Sep 2026)</option>
              <option value="LAST_MONTH">Last Month (Aug 2026)</option>
              <option value="THIS_QUARTER">Q3 2026</option>
              <option value="YTD">Year to Date (2026)</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="mt-3.5 relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search report by category, asset, code, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: REPORT DATA TABLES & ANALYTICS
      ───────────────────────────────────────────────────────────── */}
      {/* REPORT TAB 1: WORK ORDER TURNAROUND & RESOLUTION */}
      {activeTab === "turnaround" && (
        <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Work Order Resolution &amp; Turnaround Times</h3>
              <p className="text-xs text-slate-500">Breakdown of maintenance response times, resolution on-time rates, and service costs by category.</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              Overall SLA: 94.6%
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4">Problem Category</th>
                  <th className="py-3 px-3 text-center">Logged WOs</th>
                  <th className="py-3 px-3 text-center">Resolved On-Time</th>
                  <th className="py-3 px-3 text-center">Overdue WOs</th>
                  <th className="py-3 px-3 text-center">Avg Resolution Time</th>
                  <th className="py-3 px-3 text-center">On-Time SLA Rate</th>
                  <th className="py-3 px-4 text-right">Total Maintenance Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTurnaround.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {row.category}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-semibold text-slate-800">
                      {row.totalLogged}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-semibold text-emerald-700">
                      {row.resolvedOnTime}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-semibold text-rose-600">
                      {row.overdue}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-semibold text-slate-900">
                      {row.avgHours} hrs
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                          row.compliancePct >= 95
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : row.compliancePct >= 85
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        )}
                      >
                        {row.compliancePct}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{row.totalCost.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT TAB 2: PREVENTIVE MAINTENANCE COMPLIANCE */}
      {activeTab === "pm_compliance" && (
        <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Preventive Maintenance (PM) Compliance Audit</h3>
              <p className="text-xs text-slate-500">Tracking execution performance and adherence to recurring asset servicing schedules.</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              Audit Score: 94.2%
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4">PM Number</th>
                  <th className="py-3 px-4">PM Title &amp; Asset</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-center">Frequency</th>
                  <th className="py-3 px-3 text-center">Target SLA</th>
                  <th className="py-3 px-3 text-center">Actual Completion</th>
                  <th className="py-3 px-4 text-right">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredPm.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      #{row.pmNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{row.title}</span>
                      <span className="text-[10px] text-slate-400 block">{row.asset}</span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 font-medium">
                      {row.category}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-[10px] text-slate-700">
                        {row.frequency}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-semibold text-slate-700">
                      {row.target}%
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-900">
                      {row.actual}%
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                          row.status === "Compliant"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        )}
                      >
                        {row.status === "Compliant" ? <ShieldCheck className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT TAB 3: ROOM DOWNTIME & OOO/OOS ANALYTICS */}
      {activeTab === "downtime" && (
        <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Room Downtime (OOO / OOS) Log</h3>
              <p className="text-xs text-slate-500">Tracking room revenue impact, repair hours, and Housekeeping handover readiness.</p>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              42.0 Total Downtime Hrs
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4">Room Number</th>
                  <th className="py-3 px-3 text-center">Block Type</th>
                  <th className="py-3 px-4">Primary Maintenance Reason</th>
                  <th className="py-3 px-3 text-center">Downtime Hours</th>
                  <th className="py-3 px-3">Reported Date</th>
                  <th className="py-3 px-3">HK Handover Status</th>
                  <th className="py-3 px-4 text-right">Repair Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredDowntime.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {row.room}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full font-bold text-[10px] border",
                          row.blockType === "OOO"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        )}
                      >
                        {row.blockType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium">
                      {row.reason}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-900">
                      {row.downtimeHours} hrs
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 font-mono">
                      {row.reportedDate}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-700">
                      {row.handoverStatus}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{row.cost.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT TAB 4: SPARE PARTS CONSUMPTION */}
      {activeTab === "spare_parts" && (
        <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Spare Parts Consumption &amp; Material Expenditure</h3>
              <p className="text-xs text-slate-500">Record of store inventory issued to Maintenance Work Orders.</p>
            </div>
            <span className="text-xs font-bold text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
              Total Spent: ₹14,150
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4">Part Code</th>
                  <th className="py-3 px-4">Item Name &amp; Description</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-center">Issued Qty</th>
                  <th className="py-3 px-3 text-right">Unit Cost</th>
                  <th className="py-3 px-3 text-right">Total Cost</th>
                  <th className="py-3 px-4 text-right">Linked Work Orders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredParts.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {row.code}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {row.name}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 font-medium">
                      {row.category}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-900">
                      {row.qty}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-700">
                      ₹{row.unitCost.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                      ₹{row.totalCost.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-emerald-700 font-bold">
                      {row.workOrders}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Export Report Modal */}
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
              <option value="THIS_MONTH">This Month (Sep 2026)</option>
              <option value="LAST_MONTH">Last Month (Aug 2026)</option>
              <option value="THIS_QUARTER">Q3 2026</option>
              <option value="YTD">Year to Date (2026)</option>
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
