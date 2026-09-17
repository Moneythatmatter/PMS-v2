"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PhoneCall,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Eye,
  Check,
  Building2,
  User,
  Mail,
  Tag,
  Target,
  FileText,
  MessageSquare,
  Calendar,
  CheckSquare,
  Plus,
  ChevronDown,
  ArrowRight,
  UserCheck,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Briefcase,
  Layers,
  Filter,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Card, Drawer, Modal } from "@/components/ui";
import { cn } from "@/lib/utils";
import { HotelDealItem } from "./DealsPipelineView";
import {
  AddActivityModal,
  ActivityPayload,
  SharedActivityType,
} from "./shared/AddActivityModal";
import { smActivityService, smDealService } from "@/services/sales-marketing";
import { mapActivityFromApi, mapActivityToApi, mapDealFromApi } from "@/lib/sales-marketing/api-mappers";
import { nowTimelineStamp, todayIsoDate } from "@/lib/sales-marketing/useSmList";

// ─────────────────────────────────────────────────────────────
// 1. DATA TYPES & SCHEMAS (HOTEL PMS V1 ACTIVITIES)
// ─────────────────────────────────────────────────────────────

export type ActivityType =
  | "Call"
  | "Site Visit"
  | "Follow Up"
  | "Meeting"
  | "WhatsApp"
  | "Email"
  | "Task";

export type ActivityStatus = "Scheduled" | "Completed" | "Overdue" | "Cancelled";
export type ActivityPriority = "High" | "Medium" | "Low";

export type ActivityOutcome =
  | "Interested"
  | "Follow-up Required"
  | "Quotation Requested"
  | "Site Visit Required"
  | "No Response"
  | "Not Interested"
  | string;

export interface ActivityTimelineEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  notes?: string;
}

export interface HotelActivityItem {
  dbId?: string;
  dealDbId?: string;
  leadDbId?: string;
  id: string;
  activityType: ActivityType;
  priority: ActivityPriority;

  // Strict Deal / Opportunity Linkage (No orphan activities)
  dealId: string;
  dealName: string;
  leadId: string;
  leadName: string;
  customerName: string;
  companyName?: string;
  contactPerson: string;
  mobileNumber: string;
  email: string;
  pipelineStage: string;
  expectedRevenue: number;
  campaignName?: string;

  // Schedule & Assignment
  activityDate: string;
  activityTime: string;
  assignedExecutive: string;
  status: ActivityStatus;

  // Call-specific specifics
  callType?: "Incoming" | "Outgoing";

  // Site Visit specifics
  venueRequired?: string;
  visitorCount?: number;

  // Discussion & Outcomes
  purpose: string;
  outcomeNotes?: string;
  outcome?: ActivityOutcome;
  completedAt?: string;

  // Next Action (Carried forward across CRM)
  nextAction?: string;
  nextActionDate?: string;

  // Chronological Audit Timeline
  timelineLog: ActivityTimelineEntry[];
}

// ─────────────────────────────────────────────────────────────
// 2. INITIAL CENTRAL ACTIVITIES SEED DATA
// ─────────────────────────────────────────────────────────────

export const INITIAL_ACTIVITIES: HotelActivityItem[] = [];

export function ActivitiesView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activitiesList, setActivitiesList] = useState<HotelActivityItem[]>([]);
  const [deals, setDeals] = useState<HotelDealItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActivitiesAndDeals = async () => {
    setLoading(true);
    try {
      const [activityRows, dealRows] = await Promise.all([smActivityService.list(), smDealService.list()]);
      setActivitiesList(activityRows.map(mapActivityFromApi));
      setDeals(dealRows.map(mapDealFromApi));
    } catch (e) {
      setToastMessage(e instanceof Error ? e.message : "Failed to load activities");
      setActivitiesList([]);
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadActivitiesAndDeals();
  }, []);

  const persistActivity = async (activity: HotelActivityItem): Promise<HotelActivityItem | null> => {
    try {
      const linkedDeal = deals.find((d) => d.id === activity.dealId);
      const payload = mapActivityToApi({
        ...activity,
        dealDbId: linkedDeal?.dbId,
      });
      const row = activity.dbId
        ? await smActivityService.update(activity.dbId, payload)
        : await smActivityService.create(payload);
      return mapActivityFromApi(row);
    } catch (e) {
      setToastMessage(e instanceof Error ? e.message : "Failed to save activity");
      return null;
    }
  };

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [viewTab, setViewTab] = useState<"ALL" | "TODAY" | "OVERDUE">("ALL");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [selectedExecutiveFilter, setSelectedExecutiveFilter] = useState<string>("ALL");
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>("ALL");
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Drawer & Modal States
  const [selectedDrawerActivity, setSelectedDrawerActivity] = useState<HotelActivityItem | null>(null);
  const [completingActivity, setCompletingActivity] = useState<HotelActivityItem | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [modalSharedType, setModalSharedType] = useState<SharedActivityType>("Phone Call");

  // Mark Done / Completion Form State
  const [completeOutcome, setCompleteOutcome] = useState<ActivityOutcome>("Interested");
  const [completeNotes, setCompleteNotes] = useState("");
  const [completeNextAction, setCompleteNextAction] = useState("");
  const [completeNextActionDate, setCompleteNextActionDate] = useState("2026-09-02");

  const todayStr = todayIsoDate();

  // ─────────────────────────────────────────────────────────────
  // AUTOMATIC OVERDUE CALCULATION & KPI METRICS
  // ─────────────────────────────────────────────────────────────

  // Compute live activities with automatic overdue calculation
  const processedActivities = useMemo(() => {
    return activitiesList.map((act) => {
      // If activity is not completed or cancelled, and date is in past -> Overdue
      if (act.status !== "Completed" && act.status !== "Cancelled") {
        if (act.activityDate < todayStr) {
          return { ...act, status: "Overdue" as ActivityStatus };
        }
      }
      return act;
    });
  }, [activitiesList, todayStr]);

  // KPI Metrics Calculation from Central Data
  const metrics = useMemo(() => {
    const todayCalls = processedActivities.filter(
      (a) => a.activityType === "Call" && (a.activityDate === todayStr || a.status === "Scheduled")
    ).length;

    const upcomingVisits = processedActivities.filter(
      (a) => a.activityType === "Site Visit" && (a.status === "Scheduled" || a.activityDate >= todayStr)
    ).length;

    const overdueCount = processedActivities.filter((a) => a.status === "Overdue").length;
    const completedCount = processedActivities.filter((a) => a.status === "Completed").length;

    return { todayCalls, upcomingVisits, overdueCount, completedCount };
  }, [processedActivities, todayStr]);

  // ─────────────────────────────────────────────────────────────
  // FILTERING LOGIC
  // ─────────────────────────────────────────────────────────────

  const filteredActivities = useMemo(() => {
    return processedActivities.filter((a) => {
      // Tab Filtering
      if (viewTab === "OVERDUE" && a.status !== "Overdue") return false;
      if (viewTab === "TODAY" && a.activityDate !== todayStr) return false;

      // Text Search Filter
      const searchLower = searchTerm.toLowerCase();
      const matchSearch =
        a.id.toLowerCase().includes(searchLower) ||
        a.dealName.toLowerCase().includes(searchLower) ||
        a.customerName.toLowerCase().includes(searchLower) ||
        (a.companyName && a.companyName.toLowerCase().includes(searchLower)) ||
        a.contactPerson.toLowerCase().includes(searchLower) ||
        a.assignedExecutive.toLowerCase().includes(searchLower) ||
        (a.nextAction && a.nextAction.toLowerCase().includes(searchLower)) ||
        a.purpose.toLowerCase().includes(searchLower);

      const matchType = selectedTypeFilter === "ALL" || a.activityType === selectedTypeFilter;
      const matchStatus = selectedStatusFilter === "ALL" || a.status === selectedStatusFilter;
      const matchExec = selectedExecutiveFilter === "ALL" || a.assignedExecutive === selectedExecutiveFilter;
      const matchPriority = selectedPriorityFilter === "ALL" || a.priority === selectedPriorityFilter;

      let matchDate = true;
      if (selectedDateFilter === "TODAY") {
        matchDate = a.activityDate === todayStr;
      } else if (selectedDateFilter === "WEEK") {
        matchDate = a.activityDate >= "2026-08-25" && a.activityDate <= "2026-09-02";
      } else if (selectedDateFilter === "MONTH") {
        matchDate = a.activityDate.startsWith("2026-08") || a.activityDate.startsWith("2026-09");
      }

      return matchSearch && matchType && matchStatus && matchExec && matchPriority && matchDate;
    });
  }, [
    processedActivities,
    searchTerm,
    viewTab,
    selectedTypeFilter,
    selectedStatusFilter,
    selectedExecutiveFilter,
    selectedPriorityFilter,
    selectedDateFilter,
    todayStr,
  ]);

  // ─────────────────────────────────────────────────────────────
  // HANDLERS: COMPLETION MODAL & AUDIT LOGGING
  // ─────────────────────────────────────────────────────────────

  const handleOpenCompletionModal = (act: HotelActivityItem) => {
    setCompletingActivity(act);
    setCompleteOutcome("Interested");
    setCompleteNotes(act.outcomeNotes || "");
    setCompleteNextAction(act.nextAction || "");
    setCompleteNextActionDate(act.nextActionDate || "2026-09-02");
  };

  const handleSaveCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingActivity) return;

    const timestamp = nowTimelineStamp();
    const auditEntry: ActivityTimelineEntry = {
      id: `LOG-${Date.now()}`,
      timestamp,
      action: `${completingActivity.activityType} Marked Completed`,
      actor: completingActivity.assignedExecutive,
      notes: `Outcome: ${completeOutcome}. ${completeNotes.trim()}${
        completeNextAction ? ` Next Action: "${completeNextAction}" due on ${completeNextActionDate}.` : ""
      }`,
    };

    const updatedActivity: HotelActivityItem = {
      ...completingActivity,
      status: "Completed" as ActivityStatus,
      outcome: completeOutcome,
      outcomeNotes: completeNotes.trim() || undefined,
      completedAt: timestamp,
      nextAction: completeNextAction.trim() || undefined,
      nextActionDate: completeNextAction ? completeNextActionDate : undefined,
      timelineLog: [auditEntry, ...completingActivity.timelineLog],
    };

    const saved = await persistActivity(updatedActivity);
    if (!saved) return;

    setActivitiesList((prev) => prev.map((a) => (a.id === completingActivity.id ? saved : a)));
    if (selectedDrawerActivity?.id === completingActivity.id) {
      setSelectedDrawerActivity(saved);
    }

    setToastMessage(`✓ Activity #${completingActivity.id} completed! Outcome: "${completeOutcome}".`);
    setCompletingActivity(null);
  };

  // ─────────────────────────────────────────────────────────────
  // HANDLERS: CREATE / SCHEDULE ACTIVITY (REUSABLE COMPONENT)
  // ─────────────────────────────────────────────────────────────

  const handleOpenScheduleModal = (type: SharedActivityType = "Phone Call") => {
    setModalSharedType(type);
    setIsScheduleModalOpen(true);
  };

  useEffect(() => {
    if (searchParams.get("create") !== "1") return;

    const activityType =
      searchParams.get("type") === "visit" ? "Site Visit" : "Phone Call";
    handleOpenScheduleModal(activityType);
    router.replace("/sales-marketing/crm/activities-calls", { scroll: false });
  }, [searchParams, router]);

  const handleSaveSharedActivity = async (payload: ActivityPayload) => {
    const linkedDeal = deals.find((d) => d.id === payload.relatedEntityId) || deals[0];
    const timestamp = nowTimelineStamp();

    let mappedType: ActivityType = "Call";
    if (payload.activityType === "Phone Call") mappedType = "Call";
    else if (payload.activityType === "Site Visit") mappedType = "Site Visit";
    else if (payload.activityType === "Follow-up") mappedType = "Follow Up";
    else if (payload.activityType === "Meeting") mappedType = "Meeting";
    else if (payload.activityType === "WhatsApp") mappedType = "WhatsApp";
    else if (payload.activityType === "Email") mappedType = "Email";
    else if (payload.activityType === "Task / Note") mappedType = "Task";

    const newActivity: HotelActivityItem = {
      id: `ACT-${Date.now()}`,
      activityType: mappedType,
      priority: payload.priority as ActivityPriority,
      dealId: payload.relatedEntityId !== "NONE" && linkedDeal ? linkedDeal.id : "OPP-301",
      dealName: payload.dealName || linkedDeal?.dealName || "General Opportunity",
      leadId: linkedDeal?.leadId || "LD-501",
      leadName: payload.leadName || linkedDeal?.customerName || payload.contactPerson,
      customerName: payload.contactPerson || linkedDeal?.customerName || "Customer",
      companyName: payload.companyName || linkedDeal?.companyName,
      contactPerson: payload.contactPerson || linkedDeal?.contactPerson || linkedDeal?.customerName || "Customer",
      mobileNumber: payload.mobile || linkedDeal?.mobile || "+91 98000 00000",
      email: payload.email || linkedDeal?.email || "guest@hotel.com",
      pipelineStage: payload.pipelineStage || linkedDeal?.stage || "Qualification",
      expectedRevenue: linkedDeal?.dealValue || 500000,
      campaignName: linkedDeal?.campaignName || undefined,
      activityDate: payload.activityDate,
      activityTime: payload.activityTime,
      assignedExecutive: payload.assignedExecutive,
      status: payload.status === "Completed" ? "Completed" : "Scheduled",
      venueRequired: payload.venue,
      purpose: payload.subject || `${payload.activityType} regarding ${payload.dealName || "Opportunity"}`,
      outcomeNotes: payload.notes,
      outcome: payload.status === "Completed" ? "Completed" : undefined,
      completedAt: payload.status === "Completed" ? timestamp : undefined,
      nextAction: payload.nextActionSummary,
      nextActionDate: payload.nextActionDate,
      timelineLog: [
        {
          id: `LOG-${Date.now()}`,
          timestamp,
          action: `${payload.activityType} ${payload.status === "Completed" ? "Logged" : "Scheduled"}`,
          actor: payload.assignedExecutive,
          notes: payload.notes || payload.subject,
        },
      ],
    };

    const saved = await persistActivity(newActivity);
    if (!saved) return;

    setActivitiesList((prev) => [saved, ...prev]);
    setIsScheduleModalOpen(false);
    setToastMessage(`✓ ${saved.activityType} #${saved.id} ${payload.status === "Completed" ? "logged as completed" : "scheduled"} for ${saved.contactPerson}!`);
  };

  return (
    <ModulePageShell
      eyebrow="Lead & Sales Management"
      title="Activities — Sales Execution Center"
      description="Central command for sales team execution. Schedule, conduct, and log outcomes for calls, site visits, meetings, and follow-ups linked directly to sales deals."
      breadcrumbs={[
        { label: "Sales & Marketing", href: "/sales-marketing/dashboard" },
        { label: "Lead & Sales Management" },
        { label: "Activities" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <Button
          type="button"
          size="sm"
          onClick={() => handleOpenScheduleModal("Phone Call")}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 h-8.5 px-3.5 transition"
        >
          <Plus className="h-4 w-4" /> Log / Schedule Activity
        </Button>
      }
    >
      {loading && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-600">
          Loading activities and deals from database…
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: TOP KPI CARDS (F&B DASHBOARD STYLE)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6 mb-5">
        {/* Card 1: Today's Calls */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Today&apos;s Calls
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 sm:h-8 sm:w-8">
              <PhoneCall className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            {metrics.todayCalls}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            Scheduled / in progress
          </p>
        </Card>

        {/* Card 2: Upcoming Site Visits */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Upcoming Site Visits
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 sm:h-8 sm:w-8">
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            {metrics.upcomingVisits}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            Venue inspections
          </p>
        </Card>

        {/* Card 3: Overdue Follow-ups */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Overdue Follow-ups
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-700 sm:h-8 sm:w-8">
              <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            {metrics.overdueCount}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            Requires immediate action
          </p>
        </Card>

        {/* Card 4: Completed Activities */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Completed Activities
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 sm:h-8 sm:w-8">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            {metrics.completedCount}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            Logged with outcomes
          </p>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: VIEW TABS & FILTERS TOOLBAR
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs space-y-3 mb-4">
        {/* TABS ROW */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 overflow-x-auto gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setViewTab("ALL")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5",
                viewTab === "ALL" ? "bg-slate-900 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <Layers className="h-3.5 w-3.5" /> All Team Activities
            </button>
            <button
              type="button"
              onClick={() => setViewTab("TODAY")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5",
                viewTab === "TODAY" ? "bg-amber-700 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <Clock className="h-3.5 w-3.5" /> Today&apos;s Actions
            </button>
            <button
              type="button"
              onClick={() => setViewTab("OVERDUE")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5",
                viewTab === "OVERDUE" ? "bg-rose-700 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <AlertTriangle className="h-3.5 w-3.5" /> Overdue ({metrics.overdueCount})
            </button>
          </div>
        </div>

        {/* SEARCH & MULTI-FILTER CONTROLS */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Customer, Deal Name, Opportunity ID, Next Action, or Executive..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs sm:text-sm rounded-lg border border-slate-200 pl-9 pr-3 py-2 bg-slate-50/50 font-normal text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-300"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            {/* Type Filter */}
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 py-2 px-2.5 bg-white text-slate-700 focus:outline-none focus:border-slate-300 cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="Call">Call</option>
              <option value="Site Visit">Site Visit</option>
              <option value="Follow Up">Follow Up</option>
              <option value="Meeting">Meeting</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Email">Email</option>
              <option value="Task">Task</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 py-2 px-2.5 bg-white text-slate-700 focus:outline-none focus:border-slate-300 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Overdue">Overdue</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {/* Executive Filter */}
            <select
              value={selectedExecutiveFilter}
              onChange={(e) => setSelectedExecutiveFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 py-2 px-2.5 bg-white text-slate-700 focus:outline-none focus:border-slate-300 cursor-pointer"
            >
              <option value="ALL">All Executives</option>
              <option value="Vikram Malhotra">Vikram Malhotra</option>
              <option value="Jay Kumar">Jay Kumar</option>
              <option value="Ananya Roy">Ananya Roy</option>
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriorityFilter}
              onChange={(e) => setSelectedPriorityFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 py-2 px-2.5 bg-white text-slate-700 focus:outline-none focus:border-slate-300 cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: CLEAN ACTIVITY TABLE (MATCHING F&B / FRONT OFFICE SPEC)
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-4 py-3 text-xs text-slate-500 font-medium border-b border-slate-100 flex items-center justify-between">
          <span>Showing <strong className="text-slate-700 font-semibold">{filteredActivities.length}</strong> of <strong className="text-slate-700 font-semibold">{activitiesList.length}</strong> activities &bull; Sales Execution Center</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">Activity</th>
                <th className="py-3 px-4">Guest / Client</th>
                <th className="py-3 px-4">Deal &amp; Value</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">Schedule &amp; Owner</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Next Action</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {filteredActivities.length > 0 ? (
                filteredActivities.map((act) => (
                  <tr
                    key={act.id}
                    onClick={() => setSelectedDrawerActivity(act)}
                    className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    {/* Activity Type */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600 shrink-0">
                          {act.activityType === "Call" && <PhoneCall className="h-3.5 w-3.5 text-amber-700" />}
                          {act.activityType === "Site Visit" && <MapPin className="h-3.5 w-3.5 text-teal-700" />}
                          {act.activityType === "Follow Up" && <Clock className="h-3.5 w-3.5 text-sky-700" />}
                          {act.activityType === "WhatsApp" && <MessageSquare className="h-3.5 w-3.5 text-emerald-700" />}
                          {act.activityType === "Email" && <Mail className="h-3.5 w-3.5 text-indigo-700" />}
                          {act.activityType === "Meeting" && <Building2 className="h-3.5 w-3.5 text-slate-700" />}
                          {act.activityType === "Task" && <CheckSquare className="h-3.5 w-3.5 text-slate-700" />}
                        </span>
                        <div>
                          <strong className="text-slate-900 font-semibold block">{act.activityType}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">#{act.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Lead / Customer */}
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-semibold text-slate-900 block">{act.contactPerson}</span>
                      <span className="text-[11px] text-slate-500 block truncate max-w-[140px]">
                        {act.companyName || act.leadName}
                      </span>
                      <span className="text-[11px] text-slate-600 font-mono block">{act.mobileNumber}</span>
                    </td>

                    {/* Deal & Value */}
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-semibold text-slate-900 block truncate max-w-[160px]">
                        {act.dealName}
                      </span>
                      <span className="font-mono text-slate-900 font-semibold text-xs">
                        ₹{act.expectedRevenue.toLocaleString("en-IN")}
                      </span>
                    </td>

                    {/* Pipeline Stage */}
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-700 border border-slate-200/80 px-2 py-0.5 rounded text-[10px] font-medium inline-block">
                        {act.pipelineStage}
                      </span>
                    </td>

                    {/* Schedule & Owner */}
                    <td className="py-3.5 px-4">
                      <span className="text-slate-800 font-mono font-medium block text-xs">
                        {act.activityDate} &bull; {act.activityTime}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <User className="h-3 w-3 text-slate-400" /> {act.assignedExecutive}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-semibold border inline-block",
                          act.priority === "High"
                            ? "bg-rose-50 text-rose-700 border-rose-200/70"
                            : act.priority === "Medium"
                            ? "bg-amber-50 text-amber-700 border-amber-200/70"
                            : "bg-slate-100 text-slate-600 border-slate-200/70"
                        )}
                      >
                        {act.priority}
                      </span>
                    </td>

                    {/* Next Action */}
                    <td className="py-3.5 px-4">
                      {act.nextAction ? (
                        <div className="max-w-[170px]">
                          <span className="text-slate-800 font-medium block text-xs truncate">
                            {act.nextAction}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            Due: {act.nextActionDate}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">No next action</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border",
                          act.status === "Completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                            : act.status === "Scheduled"
                            ? "bg-sky-50 text-sky-700 border-sky-200/70"
                            : act.status === "Overdue"
                            ? "bg-rose-50 text-rose-700 border-rose-200/70"
                            : "bg-slate-100 text-slate-600 border-slate-200/70"
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            act.status === "Completed"
                              ? "bg-emerald-600"
                              : act.status === "Scheduled"
                              ? "bg-sky-600"
                              : act.status === "Overdue"
                              ? "bg-rose-600"
                              : "bg-slate-400"
                          )}
                        />
                        {act.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {act.status !== "Completed" ? (
                          <button
                            type="button"
                            onClick={() => handleOpenCompletionModal(act)}
                            className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-2xs hover:bg-emerald-100 cursor-pointer"
                          >
                            <Check className="h-3 w-3" /> Mark Done
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedDrawerActivity(act)}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                          >
                            <Eye className="h-3 w-3 text-slate-400" /> View
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400 text-xs italic">
                    No sales activities found matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: MARK COMPLETE MODAL (OUTCOME & NEXT ACTION REQUIRED)
      ───────────────────────────────────────────────────────────── */}
      {completingActivity && (
        <Modal
          isOpen={Boolean(completingActivity)}
          onClose={() => setCompletingActivity(null)}
          title={`Complete Activity — #${completingActivity.id}`}
          maxWidth="sm"
        >
          <form onSubmit={handleSaveCompletion} className="space-y-3.5 text-xs p-1">
            {/* Deal Context Info Banner */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex justify-between font-bold text-slate-900 text-xs">
                <span>{completingActivity.dealName}</span>
                <span className="font-mono text-emerald-800">
                  ₹{completingActivity.expectedRevenue.toLocaleString("en-IN")}
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Customer: <strong>{completingActivity.contactPerson}</strong> ({completingActivity.mobileNumber})
              </p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Discussion Outcome *
              </label>
              <select
                value={completeOutcome}
                onChange={(e) => setCompleteOutcome(e.target.value)}
                className="w-full text-xs font-semibold rounded-lg border border-slate-200 p-2 bg-white text-slate-900"
              >
                <option value="Interested">Interested — Proceeding Forward</option>
                <option value="Follow-up Required">Follow-up Required</option>
                <option value="Quotation Requested">Quotation / Proposal Requested</option>
                <option value="Site Visit Required">Site Visit Inspection Required</option>
                <option value="No Response">No Response / Unreachable</option>
                <option value="Not Interested">Not Interested / Cancelled</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Completion Notes &amp; Feedback *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Enter summary of client conversation, negotiated terms, food preferences, or next steps..."
                value={completeNotes}
                onChange={(e) => setCompleteNotes(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white text-slate-900 focus:outline-none leading-relaxed font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Immediate Next Action
                </label>
                <input
                  type="text"
                  placeholder="e.g. Send revised QTN-002"
                  value={completeNextAction}
                  onChange={(e) => setCompleteNextAction(e.target.value)}
                  className="w-full text-xs font-semibold rounded-lg border border-slate-200 p-2 bg-white text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Next Action Date
                </label>
                <input
                  type="date"
                  value={completeNextActionDate}
                  onChange={(e) => setCompleteNextActionDate(e.target.value)}
                  className="w-full text-xs font-semibold rounded-lg border border-slate-200 p-2 bg-white text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCompletingActivity(null)}
                className="text-xs font-semibold rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg px-4"
              >
                Complete Activity
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 5: ACTIVITY DETAIL DRAWER
      ───────────────────────────────────────────────────────────── */}
      {selectedDrawerActivity && (
        <Drawer
          isOpen={Boolean(selectedDrawerActivity)}
          onClose={() => setSelectedDrawerActivity(null)}
          title={`Sales Activity — #${selectedDrawerActivity.id}`}
          maxWidth="md"
          footer={
            <div className="flex items-center justify-between w-full pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  router.push(`/sales-marketing/crm/pipeline?dealId=${selectedDrawerActivity.dealId}`);
                }}
                className="text-xs font-semibold rounded-lg border-slate-200"
              >
                <Briefcase className="h-3.5 w-3.5 mr-1 text-purple-700" /> View Linked Deal →
              </Button>

              {selectedDrawerActivity.status !== "Completed" && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    handleOpenCompletionModal(selectedDrawerActivity);
                  }}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg px-4 shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" /> Mark Done
                </Button>
              )}
            </div>
          }
        >
          <div className="space-y-3.5 text-xs p-1">
            {/* Hero Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Activity Record</span>
                  <strong className="text-slate-900 text-sm font-bold">
                    {selectedDrawerActivity.activityType} ({selectedDrawerActivity.priority} Priority)
                  </strong>
                </div>

                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                    selectedDrawerActivity.status === "Completed"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                      : selectedDrawerActivity.status === "Scheduled"
                      ? "bg-blue-100 text-blue-800 border-blue-200"
                      : selectedDrawerActivity.status === "Overdue"
                      ? "bg-rose-100 text-rose-800 border-rose-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  )}
                >
                  {selectedDrawerActivity.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Scheduled Timing:</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {selectedDrawerActivity.activityDate} at {selectedDrawerActivity.activityTime}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Assigned Executive:</span>
                  <strong className="text-slate-800">{selectedDrawerActivity.assignedExecutive}</strong>
                </div>
              </div>
            </div>

            {/* Deal Context Banner */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-purple-700" /> Linked Deal &amp; Opportunity Context
              </h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Opportunity Name:</span>
                  <strong className="text-slate-900">{selectedDrawerActivity.dealName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Opportunity ID:</span>
                  <span className="font-mono font-bold text-purple-900">#{selectedDrawerActivity.dealId}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Client / Booker:</span>
                  <strong className="text-slate-900">{selectedDrawerActivity.contactPerson}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Mobile Number:</span>
                  <span className="font-mono font-semibold text-emerald-800">{selectedDrawerActivity.mobileNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Pipeline Stage:</span>
                  <span className="font-semibold text-purple-800">{selectedDrawerActivity.pipelineStage}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Contract Value:</span>
                  <span className="font-mono font-bold text-emerald-900">
                    ₹{selectedDrawerActivity.expectedRevenue.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Activity Specifics & Notes */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1.5">
                Activity Details &amp; Discussion
              </h4>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] font-bold block">Purpose / Topic:</span>
                  <p className="text-slate-800 font-semibold">{selectedDrawerActivity.purpose}</p>
                </div>

                {selectedDrawerActivity.outcome && (
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                    <span className="text-emerald-800 text-[10px] font-bold block">Recorded Outcome:</span>
                    <strong className="text-emerald-950 text-xs">{selectedDrawerActivity.outcome}</strong>
                  </div>
                )}

                {selectedDrawerActivity.outcomeNotes && (
                  <div>
                    <span className="text-slate-400 text-[10px] font-bold block">Feedback Notes:</span>
                    <p className="text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 leading-relaxed font-medium">
                      {selectedDrawerActivity.outcomeNotes}
                    </p>
                  </div>
                )}

                {selectedDrawerActivity.nextAction && (
                  <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 space-y-0.5">
                    <span className="text-amber-900 text-[10px] font-bold uppercase tracking-wide block">
                      Immediate Next Action
                    </span>
                    <p className="text-slate-900 font-bold text-xs">{selectedDrawerActivity.nextAction}</p>
                    <span className="text-[10px] text-amber-800 font-mono block">
                      Target Due Date: {selectedDrawerActivity.nextActionDate}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Chronological Audit Timeline */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2.5">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-blue-700" /> Chronological Timeline Log
              </h4>
              <div className="space-y-2 text-xs border-l-2 border-slate-200 pl-3 ml-1">
                {selectedDrawerActivity.timelineLog.map((log) => (
                  <div key={log.id} className="space-y-0.5">
                    <div className="flex justify-between font-bold text-slate-900 text-xs">
                      <span>{log.action}</span>
                      <span className="text-[10px] text-slate-400 font-mono font-normal">{log.timestamp}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block">Actor: {log.actor}</span>
                    {log.notes && <p className="text-slate-700 text-[11px] bg-slate-50 p-1.5 rounded border border-slate-100">{log.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Drawer>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 6: REUSABLE UNIFIED LOG / SCHEDULE ACTIVITY MODAL
      ───────────────────────────────────────────────────────────── */}
      {isScheduleModalOpen && (
        <AddActivityModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          onSave={handleSaveSharedActivity}
          initialActivityType={modalSharedType}
          availableDeals={deals.map((d) => ({
            id: d.id,
            dealName: d.dealName,
            customerName: d.customerName,
            companyName: d.companyName,
            mobile: d.mobile,
            email: d.email,
            stage: d.stage,
            assignedExecutive: d.assignedExecutive,
          }))}
        />
      )}
    </ModulePageShell>
  );
}
