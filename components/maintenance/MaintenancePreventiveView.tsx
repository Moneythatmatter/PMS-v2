"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar as CalendarIcon,
  List,
  Search,
  Plus,
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  Truck,
  UserCheck,
  RotateCcw,
  ExternalLink,
  Layers,
  Repeat,
  FileText,
  Info,
  CalendarDays,
  ShieldCheck,
  CheckSquare,
  Loader2,
  ChevronLeft,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Badge, Button, Drawer, Modal, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  ON_DUTY_TECHNICIANS,
  MOCK_ON_DUTY_TECHNICIANS,
} from "@/app/data/maintenance/constants";
import {
  PMSchedule,
  PMScheduleStatus,
  PMFrequency,
  ExecutionMethod,
  WorkOrder,
} from "@/app/data/maintenance/types";
import { currentUser } from "@/app/data/user";
import { usePsList } from "@/hooks/usePsResource";
import {
  mntPmScheduleService,
  mntPmTemplateService,
  mntVendorService,
  mntAssetService,
  mntWorkOrderService,
} from "@/services/maintenance";

export const getPMStatusBadgeConfig = (status: PMScheduleStatus) => {
  switch (status) {
    case "Upcoming":
      return { bg: "bg-blue-50 text-blue-800", border: "border-blue-200", label: "Upcoming" };
    case "Due":
      return { bg: "bg-amber-50 text-amber-800", border: "border-amber-200 animate-pulse", label: "Due Today" };
    case "Overdue":
      return { bg: "bg-rose-50 text-rose-800", border: "border-rose-200", label: "Overdue" };
    case "Inactive":
      return { bg: "bg-slate-100 text-slate-600", border: "border-slate-200", label: "Inactive" };
    default:
      return { bg: "bg-slate-100 text-slate-700", border: "border-slate-200", label: status };
  }
};

export function MaintenancePreventiveView() {
  const router = useRouter();
  const { data: pmSchedules, loading, reload: reloadSchedules } = usePsList(() => mntPmScheduleService.list(), []);
  const { data: templates } = usePsList(() => mntPmTemplateService.list(), []);
  const { data: vendors } = usePsList(() => mntVendorService.list(), []);
  const { data: assets } = usePsList(() => mntAssetService.list(), []);
  const [saving, setSaving] = useState(false);
  const savingLockRef = useRef(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // View Switcher: "list" | "calendar"
  const [activeView, setActiveView] = useState<"list" | "calendar">("list");
  const [calendarCursor, setCalendarCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() }; // month 0-11
  });

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [selectedFrequencyFilter, setSelectedFrequencyFilter] = useState<string>("ALL");
  const [selectedExecutionFilter, setSelectedExecutionFilter] = useState<string>("ALL");

  // Multi-Selection State
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  // Drawer / Modal States
  const [isScheduleDrawerOpen, setIsScheduleDrawerOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<PMSchedule | null>(null);

  const handleSelectAllRows = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(filteredSchedules.map((item) => item.id));
      setSelectedRowIds(allIds);
    } else {
      setSelectedRowIds(new Set());
    }
  };

  const handleToggleRowSelect = (id: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Form State for Creating PM Schedule (Execution Method only; no preselected technician/vendor)
  const [formAssetCode, setFormAssetCode] = useState("");
  const [formAssetName, setFormAssetName] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formTemplateId, setFormTemplateId] = useState("");
  const [formTaskTitle, setFormTaskTitle] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formFrequency, setFormFrequency] = useState<PMFrequency>("Monthly");
  const [formNextDueDate, setFormNextDueDate] = useState("2026-09-25");
  const [formExecutionMethod, setFormExecutionMethod] = useState<ExecutionMethod>("In-House");
  const [formNotes, setFormNotes] = useState("");

  // ─────────────────────────────────────────────────────────────
  // 1. COMPACT KPI SUMMARY METRICS
  // ─────────────────────────────────────────────────────────────
  const summaryMetrics = useMemo(() => {
    const total = pmSchedules.length;
    const upcoming = pmSchedules.filter((p) => p.status === "Upcoming").length;
    const due = pmSchedules.filter((p) => p.status === "Due").length;
    const overdue = pmSchedules.filter((p) => p.status === "Overdue").length;
    return { total, upcoming, due, overdue };
  }, [pmSchedules]);

  // ─────────────────────────────────────────────────────────────
  // 2. FILTERING LOGIC
  // ─────────────────────────────────────────────────────────────
  const filteredSchedules = useMemo(() => {
    return pmSchedules.filter((pm) => {
      // Status Filter
      if (selectedStatusFilter !== "ALL" && pm.status !== selectedStatusFilter) return false;

      // Frequency Filter
      if (selectedFrequencyFilter !== "ALL" && pm.frequency !== selectedFrequencyFilter) return false;

      // Execution Method Filter
      if (selectedExecutionFilter !== "ALL" && pm.executionMethod !== selectedExecutionFilter) return false;

      // Search Query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchNum = pm.pmNumber.toLowerCase().includes(q);
        const matchAsset = pm.assetName.toLowerCase().includes(q) || pm.assetCode.toLowerCase().includes(q);
        const matchTask = pm.taskTitle.toLowerCase().includes(q);
        const matchLoc = pm.location.toLowerCase().includes(q);

        if (!matchNum && !matchAsset && !matchTask && !matchLoc) {
          return false;
        }
      }

      return true;
    });
  }, [pmSchedules, selectedStatusFilter, selectedFrequencyFilter, selectedExecutionFilter, searchTerm]);

  const calendarMonthLabel = useMemo(() => {
    return new Date(calendarCursor.year, calendarCursor.month, 1).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  }, [calendarCursor]);

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const calendarCells = useMemo(() => {
    const { year, month } = calendarCursor;
    const firstWeekday = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ day: number | null; dateStr: string | null }> = [];

    for (let i = 0; i < firstWeekday; i++) {
      cells.push({ day: null, dateStr: null });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const mm = String(month + 1).padStart(2, "0");
      const dd = String(day).padStart(2, "0");
      cells.push({ day, dateStr: `${year}-${mm}-${dd}` });
    }
    // Pad to full weeks
    while (cells.length % 7 !== 0) {
      cells.push({ day: null, dateStr: null });
    }
    return cells;
  }, [calendarCursor]);

  const shiftCalendarMonth = (delta: number) => {
    setCalendarCursor((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const goToCurrentMonth = () => {
    const now = new Date();
    setCalendarCursor({ year: now.getFullYear(), month: now.getMonth() });
  };

  // ─────────────────────────────────────────────────────────────
  // 3. CREATE PM SCHEDULE HANDLER
  // ─────────────────────────────────────────────────────────────
  const handleOpenScheduleDrawer = () => {
    const asset = assets[0];
    const tmpl = templates[0];
    setFormAssetCode(asset?.assetCode ?? "");
    setFormAssetName(asset?.assetName ?? "");
    setFormLocation(asset?.location ?? "");
    setFormTemplateId(tmpl?.id ?? "");
    setFormTaskTitle(tmpl?.templateTitle ?? "");
    setFormCategory(tmpl?.category ?? "");
    setFormFrequency(tmpl?.defaultFrequency ?? "Monthly");
    setFormNextDueDate("2026-09-25");
    setFormExecutionMethod("In-House");
    setFormNotes("");
    setIsScheduleDrawerOpen(true);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTaskTitle.trim() || !formNextDueDate || saving) return;

    const tmpl = templates.find((t) => t.id === formTemplateId) || templates[0];
    const nextPmNo = `PM-00${pmSchedules.length + 1}`;

    const newSchedule: Partial<PMSchedule> = {
      pmNumber: nextPmNo,
      assetCode: formAssetCode,
      assetName: formAssetName,
      category: formCategory,
      location: formLocation,
      templateId: tmpl?.id,
      taskTitle: formTaskTitle.trim(),
      checklist: tmpl?.checklist || [formTaskTitle.trim()],
      frequency: formFrequency,
      firstDueDate: formNextDueDate,
      nextDueDate: formNextDueDate,
      executionMethod: formExecutionMethod,
      assignedType: formExecutionMethod === "In-House" ? "In-House Staff" : "External Vendor",
      scheduleNotes: formNotes.trim() || undefined,
      status: "Upcoming",
      pmHistory: [],
      createdAt: new Date().toISOString(),
    };

    if (savingLockRef.current) return;
    savingLockRef.current = true;
    setSaving(true);
    try {
      await mntPmScheduleService.create(newSchedule);
      await reloadSchedules();
      setIsScheduleDrawerOpen(false);
      setToastMessage(`✓ PM Schedule #${nextPmNo} created successfully.`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to create PM schedule");
    } finally {
      savingLockRef.current = false;
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 4. GENERATE WORK ORDER FROM PM SCHEDULE (NO DUPLICATE ACTIVE WOs)
  // ─────────────────────────────────────────────────────────────
  const handleGenerateWorkOrder = async (pm: PMSchedule) => {
    if (saving) return;
    // Prevent duplicate active Work Order if already generated
    if (pm.activeWorkOrderNo) {
      setToastMessage(`⚠️ Active Work Order #${pm.activeWorkOrderNo} already exists for ${pm.pmNumber}. View it on the Work Orders page.`);
      return;
    }

    const newWoNumber = `WO-${130 + Math.floor(Math.random() * 50)}`;

    const createdWo: Partial<WorkOrder> = {
      woNumber: newWoNumber,
      sourceRef: pm.pmNumber,
      woType: "Preventive",
      location: pm.location,
      locationType: pm.locationType || "Back of House",
      problemCategory: pm.category,
      issue: `${pm.taskTitle} (${pm.assetName})`,
      description: pm.scheduleNotes || `Scheduled ${pm.frequency} PM servicing for asset ${pm.assetCode}.`,
      priority: "Medium",
      isSafetyHazard: false,
      executionMethod: pm.executionMethod,
      assignedType: pm.assignedType,
      technicianName:
        pm.technicianName ||
        pm.maintenanceVendorName ||
        (pm.executionMethod === "In-House" ? "Unassigned Staff" : "Pending Vendor Selection"),
      assetCode: pm.assetCode,
      assetName: pm.assetName,
      scheduledDate: pm.nextDueDate,
      dueDate: `${pm.nextDueDate}, 05:00 PM`,
      status: "New",
      partsCost: 0,
      externalServiceCost: 0,
      totalCost: 0,
      checklistItems: (pm.checklist || []).map((item, idx) => ({ id: `c-${idx}`, description: item, completed: false })),
      progressUpdates: [],
      timeline: [
        { time: "Just now", action: `Preventive Work Order #${newWoNumber} Generated from ${pm.pmNumber}`, user: currentUser.name },
        { time: "Just now", action: `Dispatched to Work Orders page for technician/vendor assignment`, user: currentUser.name },
      ],
    };

    if (savingLockRef.current) return;
    savingLockRef.current = true;
    setSaving(true);
    try {
      await mntWorkOrderService.create(createdWo);
      const updatedSchedule = await mntPmScheduleService.update(pm.id, {
        activeWorkOrderNo: newWoNumber,
      });
      await reloadSchedules();
      if (selectedSchedule?.id === pm.id) setSelectedSchedule(updatedSchedule);
      setToastMessage(`✓ Work Order #${newWoNumber} generated for ${pm.pmNumber} and sent to Work Orders page.`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to generate work order");
    } finally {
      savingLockRef.current = false;
      setSaving(false);
    }
  };

  // Toggle Schedule Active / Inactive
  const handleToggleScheduleActive = async (pm: PMSchedule) => {
    if (saving) return;
    const nextStatus: PMScheduleStatus = pm.status === "Inactive" ? "Upcoming" : "Inactive";
    if (savingLockRef.current) return;
    savingLockRef.current = true;
    setSaving(true);
    try {
      const updated = await mntPmScheduleService.update(pm.id, { status: nextStatus });
      await reloadSchedules();
      if (selectedSchedule?.id === pm.id) setSelectedSchedule(updated);
      setToastMessage(`Schedule #${pm.pmNumber} marked as ${nextStatus}.`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to update schedule");
    } finally {
      savingLockRef.current = false;
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 text-sm text-slate-600">Loading preventive schedules...</div>
    );
  }

  return (
    <ModulePageShell
      eyebrow="Maintenance & Engineering"
      title="Preventive Maintenance"
      description="Schedule regular equipment servicing, monitor due dates, generate preventive work orders, and track asset PM service history."
      breadcrumbs={[
        { label: "Maintenance", href: "/maintenance" },
        { label: "Preventive Maintenance" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <Button
          type="button"
          size="sm"
          onClick={handleOpenScheduleDrawer}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 h-9 px-3.5 disabled:opacity-50 inline-flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Schedule PM Task
        </Button>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: OPERATIONAL KPI CARDS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5 mb-5">
        {/* Card 1: Total PM Schedules */}
        <Card className="h-full min-w-0 p-3 sm:p-4.5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Total PM Schedules
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 sm:h-8 sm:w-8">
              <Repeat className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            {summaryMetrics.total}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            All active recurring servicing schedules
          </p>
        </Card>

        {/* Card 2: Upcoming */}
        <Card className="h-full min-w-0 p-3 sm:p-4.5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Upcoming
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 sm:h-8 sm:w-8">
              <CalendarDays className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            {summaryMetrics.upcoming}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            Scheduled for future dates
          </p>
        </Card>

        {/* Card 3: Due Today */}
        <Card className="h-full min-w-0 p-3 sm:p-4.5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Due Today
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 sm:h-8 sm:w-8">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            {summaryMetrics.due}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            Ready for Work Order generation
          </p>
        </Card>

        {/* Card 4: Overdue */}
        <Card className="h-full min-w-0 p-3 sm:p-4.5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Overdue
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-700 sm:h-8 sm:w-8">
              <AlertTriangle className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            {summaryMetrics.overdue}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            Action required immediately
          </p>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: TOOLBAR WITH VIEW TOGGLE & FILTERS
      ───────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5 mb-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          {/* View Toggle Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveView("list")}
              className={cn(
                "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
                activeView === "list" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <List className="h-3.5 w-3.5" /> Schedule List
            </button>
            <button
              type="button"
              onClick={() => setActiveView("calendar")}
              className={cn(
                "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
                activeView === "calendar" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <CalendarIcon className="h-3.5 w-3.5" /> Calendar View
            </button>
          </div>

          <p className="text-xs text-slate-500 font-medium">
            {filteredSchedules.length} PM schedules active
          </p>
        </div>

        {/* Search & Filter Inputs */}
        <div className="mt-3.5 flex flex-col gap-3 md:flex-row md:items-center">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search PM#, asset name, code, task..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Due">Due Today</option>
            <option value="Overdue">Overdue</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* Frequency Filter */}
          <select
            value={selectedFrequencyFilter}
            onChange={(e) => setSelectedFrequencyFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Frequencies</option>
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Yearly">Yearly</option>
          </select>

          {/* Execution Method Filter */}
          <select
            value={selectedExecutionFilter}
            onChange={(e) => setSelectedExecutionFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Execution</option>
            <option value="In-House">In-House</option>
            <option value="Outsource">Outsource Vendor</option>
          </select>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: SCHEDULE LIST VIEW (TABLE VIEW)
      ───────────────────────────────────────────────────────────── */}
      {activeView === "list" && (
        <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="w-10 px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAllRows}
                      checked={
                        filteredSchedules.length > 0 &&
                        filteredSchedules.every((item) => selectedRowIds.has(item.id))
                      }
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </th>
                  <th className="py-3 px-4">PM Number</th>
                  <th className="py-3 px-3">Asset Equipment</th>
                  <th className="py-3 px-3">PM Task Title</th>
                  <th className="py-3 px-3">Frequency</th>
                  <th className="py-3 px-3">Execution Method</th>
                  <th className="py-3 px-3">Last Service</th>
                  <th className="py-3 px-3">Next Due</th>
                  <th className="py-3 px-3">Schedule Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredSchedules.length > 0 ? (
                  filteredSchedules.map((pm) => {
                    const badgeCfg = getPMStatusBadgeConfig(pm.status);
                    return (
                      <tr
                        key={pm.id}
                        onClick={() => setSelectedSchedule(pm)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        {/* 0. Row Select Checkbox */}
                        <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedRowIds.has(pm.id)}
                            onChange={() => handleToggleRowSelect(pm.id)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>

                        {/* 1. PM Number */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <strong className="font-mono font-bold text-slate-900 group-hover:text-emerald-700 transition block">
                            #{pm.pmNumber}
                          </strong>
                          <span className="text-[10px] text-slate-400 font-mono">{pm.templateId || "Custom"}</span>
                        </td>

                        {/* 2. Asset & Location */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <p className="font-semibold text-slate-900">{pm.assetName}</p>
                          <span className="text-[10px] text-slate-400 block">{pm.assetCode} — {pm.location}</span>
                        </td>

                        {/* 3. Task Title */}
                        <td className="py-3 px-3 max-w-[240px]">
                          <p className="font-semibold text-slate-900 line-clamp-1" title={pm.taskTitle}>
                            {pm.taskTitle}
                          </p>
                          <span className="text-[10px] text-slate-400 font-normal">{pm.category}</span>
                        </td>

                        {/* 4. Frequency */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                            {pm.frequency}
                          </span>
                        </td>

                        {/* 5. Execution Method */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-bold border",
                              pm.executionMethod === "In-House"
                                ? "bg-slate-100 text-slate-800 border-slate-200"
                                : "bg-blue-50 text-blue-800 border-blue-200"
                            )}
                          >
                            {pm.executionMethod}
                          </span>
                        </td>

                        {/* 6. Last Service / Cycle Result */}
                        <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-600">
                          {pm.lastCompletedDate ? (
                            <div>
                              <span>{pm.lastCompletedDate}</span>
                              <span className="text-[9px] block text-emerald-700 font-bold">✓ Completed</span>
                            </div>
                          ) : (
                            "Initial Run"
                          )}
                        </td>

                        {/* 7. Next Due */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-900">{pm.nextDueDate}</span>
                        </td>

                        {/* 8. Schedule Status */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold border", badgeCfg.bg, badgeCfg.border)}>
                            {badgeCfg.label}
                          </span>
                        </td>

                        {/* 9. Contextual Action */}
                        <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {pm.activeWorkOrderNo ? (
                              <Link href={`/maintenance/work-orders?searchTerm=${pm.activeWorkOrderNo}`}>
                                <span className="inline-flex items-center gap-1 rounded-lg bg-teal-50 border border-teal-200 px-2 py-1 text-[11px] font-bold text-teal-800 hover:bg-teal-100">
                                  <Wrench className="h-3 w-3" /> Active #{pm.activeWorkOrderNo}
                                </span>
                              </Link>
                            ) : (pm.status === "Due" || pm.status === "Overdue") ? (
                              <Button
                                type="button"
                                size="sm"
                                disabled={saving}
                                onClick={() => handleGenerateWorkOrder(pm)}
                                className="h-7 px-2 text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 rounded-lg cursor-pointer flex items-center gap-1 disabled:opacity-50"
                              >
                                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                                {saving ? "Saving..." : "Generate Work Order"}
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedSchedule(pm)}
                                className="h-7 px-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                              >
                                View Details
                              </Button>
                            )}

                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      <div className="max-w-xs mx-auto space-y-2">
                        <Repeat className="h-8 w-8 mx-auto text-slate-300" />
                        <strong className="text-sm font-bold text-slate-800 block">No PM schedules found</strong>
                        <p className="text-xs text-slate-400">
                          {searchTerm || selectedStatusFilter !== "ALL" || selectedFrequencyFilter !== "ALL"
                            ? "No records match your active search or filters."
                            : "Click '+ Schedule PM Task' to configure a recurring maintenance schedule."}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: CALENDAR VIEW
      ───────────────────────────────────────────────────────────── */}
      {activeView === "calendar" && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => shiftCalendarMonth(-1)}
                className="h-8 w-8 rounded-lg p-0 cursor-pointer"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 min-w-[200px] justify-center">
                <CalendarIcon className="h-4 w-4 text-emerald-700" />
                {calendarMonthLabel} PM Schedule
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => shiftCalendarMonth(1)}
                className="h-8 w-8 rounded-lg p-0 cursor-pointer"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={goToCurrentMonth}
                className="h-8 rounded-lg px-2.5 text-xs font-semibold cursor-pointer"
              >
                Today
              </Button>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-rose-700">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span> Overdue
              </span>
              <span className="flex items-center gap-1.5 text-amber-700">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span> Due Today
              </span>
              <span className="flex items-center gap-1.5 text-blue-700">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span> Upcoming
              </span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center font-bold text-slate-600 text-xs mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-1 bg-slate-50 rounded">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarCells.map((cell, idx) => {
              if (!cell.day || !cell.dateStr) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="min-h-[90px] p-1.5 rounded-xl border border-transparent bg-transparent"
                  />
                );
              }

              const itemsForDay = filteredSchedules.filter((p) => p.nextDueDate === cell.dateStr);
              const isToday = cell.dateStr === todayIso;

              return (
                <div
                  key={cell.dateStr}
                  className={cn(
                    "min-h-[90px] p-1.5 rounded-xl border flex flex-col justify-between text-left transition-colors",
                    isToday
                      ? "border-emerald-500 bg-emerald-50/20"
                      : itemsForDay.length > 0
                        ? "border-slate-200 bg-white"
                        : "border-slate-100 bg-slate-50/30",
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-bold font-mono px-1 rounded w-max",
                      isToday ? "bg-emerald-700 text-white" : "text-slate-700",
                    )}
                  >
                    {cell.day}
                    {isToday ? " (Today)" : ""}
                  </span>

                  <div className="space-y-1 mt-1">
                    {itemsForDay.map((item) => {
                      const b = getPMStatusBadgeConfig(item.status);
                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedSchedule(item)}
                          className={cn(
                            "p-1 rounded text-[10px] font-bold truncate cursor-pointer transition hover:opacity-80 border",
                            b.bg,
                            b.border,
                          )}
                          title={`${item.pmNumber}: ${item.taskTitle} (${item.assetName})`}
                        >
                          <strong>#{item.pmNumber}</strong>: {item.assetCode}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 5: CREATE PM SCHEDULE SLIDE-OUT DRAWER
      ───────────────────────────────────────────────────────────── */}
      {isScheduleDrawerOpen && (
        <Drawer
          isOpen={isScheduleDrawerOpen}
          onClose={() => setIsScheduleDrawerOpen(false)}
          title="Schedule PM Task"
          maxWidth="md"
        >
          <form onSubmit={handleSaveSchedule} className="space-y-4 p-1 text-xs">
            {/* Asset Selection */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Asset / Equipment <span className="text-rose-500">*</span>
              </label>
              <select
                value={formAssetCode}
                onChange={(e) => {
                  const code = e.target.value;
                  setFormAssetCode(code);
                  const a = assets.find((asset) => asset.assetCode === code);
                  if (a) {
                    setFormAssetName(a.assetName);
                    setFormLocation(a.location);
                  }
                }}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs text-slate-900"
              >
                {assets.length === 0 ? (
                  <option value="">No assets registered</option>
                ) : (
                  assets.map((asset) => (
                    <option key={asset.id} value={asset.assetCode}>
                      {asset.assetCode} — {asset.assetName} ({asset.location})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* PM Task Template Selection */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                PM Task Template <span className="text-rose-500">*</span>
              </label>
              <select
                value={formTemplateId}
                onChange={(e) => {
                  const tid = e.target.value;
                  setFormTemplateId(tid);
                  const tmpl = templates.find((t) => t.id === tid);
                  if (tmpl) {
                    setFormTaskTitle(tmpl.templateTitle);
                    setFormCategory(tmpl.category);
                    setFormFrequency(tmpl.defaultFrequency);
                  }
                }}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs text-slate-900"
              >
                {templates.length === 0 ? (
                  <option value="">No PM templates available</option>
                ) : (
                  templates.map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.templateTitle} ({tmpl.category} — {tmpl.defaultFrequency})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Task Title Override */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                PM Task Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formTaskTitle}
                onChange={(e) => setFormTaskTitle(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs text-slate-900"
              />
            </div>

            {/* Frequency & First/Next Due Date */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  Recurrence Frequency <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formFrequency}
                  onChange={(e) => setFormFrequency(e.target.value as PMFrequency)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  First / Next Due Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formNextDueDate}
                  onChange={(e) => setFormNextDueDate(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-xs text-slate-900 font-bold"
                />
              </div>
            </div>

            {/* Execution Method Only (No final tech / vendor selection on PM schedule level) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block font-bold text-slate-800 text-[11px]">
                Execution Method <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormExecutionMethod("In-House")}
                  className={cn(
                    "p-2.5 rounded-lg border font-bold text-xs transition cursor-pointer text-center",
                    formExecutionMethod === "In-House"
                      ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  In-House Technician
                </button>
                <button
                  type="button"
                  onClick={() => setFormExecutionMethod("Outsource")}
                  className={cn(
                    "p-2.5 rounded-lg border font-bold text-xs transition cursor-pointer text-center",
                    formExecutionMethod === "Outsource"
                      ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  Outsource AMC Vendor
                </button>
              </div>
              <p className="text-[10px] text-slate-400 italic mt-1">
                ℹ️ Final technician or Maintenance Vendor selection will be made on the Work Order when generated.
              </p>
            </div>

            {/* Schedule Notes */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Schedule Notes &amp; Safety Instructions</label>
              <textarea
                rows={2}
                placeholder="e.g. Perform before 09:00 AM before peak power consumption..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsScheduleDrawerOpen(false)}
                className="rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs px-4 cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {saving ? "Saving..." : "Save PM Schedule ✓"}
              </Button>
            </div>
          </form>
        </Drawer>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 6: PM SCHEDULE DETAILS SLIDE-OUT DRAWER
      ───────────────────────────────────────────────────────────── */}
      {selectedSchedule && (
        <Drawer
          isOpen={Boolean(selectedSchedule)}
          onClose={() => setSelectedSchedule(null)}
          title={`PM Schedule #${selectedSchedule.pmNumber}`}
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleToggleScheduleActive(selectedSchedule)}
                className="text-xs font-semibold rounded-lg cursor-pointer"
              >
                {selectedSchedule.status === "Inactive" ? "Activate Schedule" : "Mark Inactive"}
              </Button>

              {selectedSchedule.activeWorkOrderNo ? (
                <Link href={`/maintenance/work-orders?searchTerm=${selectedSchedule.activeWorkOrderNo}`}>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Wrench className="h-3.5 w-3.5" /> View Active WO (#{selectedSchedule.activeWorkOrderNo}) →
                  </Button>
                </Link>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  disabled={saving}
                  onClick={() => handleGenerateWorkOrder(selectedSchedule)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  {saving ? "Saving..." : "Generate Work Order"}
                </Button>
              )}
            </div>
          }
        >
          <div className="space-y-4 text-xs p-1">
            {/* Header Hero */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-900">#{selectedSchedule.pmNumber}</span>
                  <span className="rounded-md bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-800">
                    {selectedSchedule.frequency}
                  </span>
                </div>

                {(() => {
                  const b = getPMStatusBadgeConfig(selectedSchedule.status);
                  return (
                    <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold border", b.bg, b.border)}>
                      {b.label}
                    </span>
                  );
                })()}
              </div>

              <h3 className="text-sm font-bold text-slate-900">{selectedSchedule.taskTitle}</h3>
              <p className="text-slate-600 text-xs">Asset: <strong>{selectedSchedule.assetName}</strong> ({selectedSchedule.assetCode}) — {selectedSchedule.location}</p>
            </div>

            {/* SECTION 1: SCHEDULE CONFIGURATION & RECURRENCE */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2.5">
              <strong className="text-xs font-bold text-slate-900 block border-b border-slate-100 pb-1.5">
                1. Schedule Configuration &amp; Recurrence
              </strong>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Category</span>
                  <strong className="text-slate-900">{selectedSchedule.category}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Next Due Date</span>
                  <strong className="font-mono text-slate-900">{selectedSchedule.nextDueDate}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Execution Method</span>
                  <span className="font-semibold text-slate-800">{selectedSchedule.executionMethod}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Last Service Completed</span>
                  <span className="font-mono text-slate-700">{selectedSchedule.lastCompletedDate || "Initial Schedule"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Active Work Order</span>
                  <span className="font-mono text-slate-800">
                    {selectedSchedule.activeWorkOrderNo ? `#${selectedSchedule.activeWorkOrderNo}` : "None (Ready to Generate)"}
                  </span>
                </div>
              </div>

              {selectedSchedule.scheduleNotes && (
                <div className="p-2 bg-slate-50 rounded text-[11px] text-slate-700 mt-1">
                  <strong>Notes:</strong> {selectedSchedule.scheduleNotes}
                </div>
              )}
            </div>

            {/* SECTION 2: INHERITED CHECKLIST ITEMS */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
              <strong className="text-xs font-bold text-slate-900 block border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                <CheckSquare className="h-3.5 w-3.5 text-slate-500" /> 2. PM Checklist (Inherited from Master Template)
              </strong>
              <ul className="space-y-1 text-xs">
                {selectedSchedule.checklist.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2 p-1 bg-slate-50 rounded text-slate-800 font-medium">
                    <span className="font-mono text-[10px] text-emerald-700 font-bold">{idx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* SECTION 3: PM SERVICE HISTORY */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
              <strong className="text-xs font-bold text-slate-900 block border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-500" /> 3. Previous Servicing &amp; PM History
              </strong>

              {selectedSchedule.pmHistory && selectedSchedule.pmHistory.length > 0 ? (
                <div className="space-y-2">
                  {selectedSchedule.pmHistory.map((rec) => (
                    <div key={rec.id} className="p-2 rounded bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="font-mono font-bold text-slate-900">#{rec.workOrderNo}</strong>
                          <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
                            {rec.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">{rec.notes}</p>
                        <span className="text-[10px] text-slate-400">By {rec.technicianOrVendor}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500 font-semibold">{rec.date}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">No previous PM history recorded yet.</p>
              )}
            </div>
          </div>
        </Drawer>
      )}
    </ModulePageShell>
  );
}
