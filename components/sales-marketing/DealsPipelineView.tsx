"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Kanban,
  List,
  Search,
  Filter,
  Plus,
  Building2,
  Calendar,
  DollarSign,
  UserCheck,
  Tag,
  CheckCircle2,
  XCircle,
  X,
  ChevronRight,
  ArrowRight,
  TrendingUp,
  Briefcase,
  Users,
  Award,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  Sparkles,
  MapPin,
  RotateCcw,
  FileText,
  ExternalLink,
  AlertTriangle,
  Check,
  Share2,
  Layers,
  FileSpreadsheet,
  Zap,
  Bookmark,
  ShieldCheck,
  Timer,
  FileCheck,
  Eye,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Card, Drawer, Modal } from "@/components/ui";
import { cn } from "@/lib/utils";
import { CentralLeadItem } from "@/app/data/centralLeadData";
import { LeadType, LeadSource } from "./LeadsInquiriesView";
import { AddActivityModal, ActivityPayload, SharedActivityType, SharedActivityStatus } from "./shared/AddActivityModal";
import { smDealService, smLeadService } from "@/services/sales-marketing";
import { mapDealFromApi, mapDealToApi, mapCentralLeadFromApi } from "@/lib/sales-marketing/api-mappers";
import { nowTimelineStamp, todayIsoDate } from "@/lib/sales-marketing/useSmList";

// ─────────────────────────────────────────────────────────────
// 1. HOTEL-SPECIFIC PIPELINE STAGES (8 VERSION 1 STAGES)
// ─────────────────────────────────────────────────────────────

export type HotelDealStage =
  | "Qualification"
  | "Requirement Analysis"
  | "Quotation / Proposal"
  | "Negotiation"
  | "Tentative Hold"
  | "Final Decision"
  | "Won"
  | "Lost";

export type HotelDealStatus = "Open" | "Won" | "Lost";

export interface PipelineStageConfig {
  id: HotelDealStage;
  label: string;
  probability: string;
  badgeBg: string;
  badgeText: string;
  headerBorder: string;
  description: string;
}

export const HOTEL_PIPELINE_STAGES: PipelineStageConfig[] = [
  {
    id: "Qualification",
    label: "Qualification",
    probability: "10%",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-800",
    headerBorder: "border-slate-200",
    description: "Confirm inquiry is genuine & worth pursuing",
  },
  {
    id: "Requirement Analysis",
    label: "Requirement Analysis",
    probability: "25%",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-800",
    headerBorder: "border-slate-200",
    description: "Collect detailed event & room requirements",
  },
  {
    id: "Quotation / Proposal",
    label: "Quotation / Proposal",
    probability: "50%",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-800",
    headerBorder: "border-slate-200",
    description: "Package proposal or tariff quotation sent",
  },
  {
    id: "Negotiation",
    label: "Negotiation",
    probability: "70%",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-800",
    headerBorder: "border-slate-200",
    description: "Discussing rates, date, venue, rooms & terms",
  },
  {
    id: "Tentative Hold",
    label: "Tentative Hold",
    probability: "85%",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-900",
    headerBorder: "border-amber-200",
    description: "Venue space & dates placed on temporary hold with hold expiry",
  },
  {
    id: "Final Decision",
    label: "Final Decision",
    probability: "90%",
    badgeBg: "bg-purple-100",
    badgeText: "text-purple-900",
    headerBorder: "border-purple-200",
    description: "Client reviewing contract/advance terms for final sign-off",
  },
  {
    id: "Won",
    label: "Won",
    probability: "100%",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-900",
    headerBorder: "border-emerald-200",
    description: "Business confirmed! Ready for Booking creation",
  },
  {
    id: "Lost",
    label: "Lost",
    probability: "0%",
    badgeBg: "bg-rose-100",
    badgeText: "text-rose-900",
    headerBorder: "border-rose-200",
    description: "Opportunity closed without booking",
  },
];

// ─────────────────────────────────────────────────────────────
// 2. DATA TYPES & SCHEMAS FOR DEAL OPPORTUNITY
// ─────────────────────────────────────────────────────────────

export interface DealQuotation {
  id: string; // e.g. "QTN-001"
  versionName: string; // e.g. "Initial Proposal", "Revised Catering & Decor", "Final Approved Tariff"
  date: string;
  amount: number;
  status: "Draft" | "Sent" | "Accepted" | "Superseded";
  inclusions?: string;
  validUntil?: string;
}

export interface TentativeHoldDetails {
  venueName: string;
  startDate: string;
  endDate: string;
  holdExpiryDate: string;
  holdStatus: "Active" | "Expired" | "Released" | "Converted to Booking";
  holdNotes?: string;
}

export interface DealActivity {
  id: string;
  type:
    | SharedActivityType
    | "WhatsApp Follow-up"
    | "Proposal Sent"
    | "Negotiation"
    | "Note"
    | "Stage Change"
    | string;
  date: string;
  time?: string;
  user: string;
  notes: string;
  status?: SharedActivityStatus | "Scheduled" | "Completed" | "Cancelled" | string;
  venue?: string;
  contactPerson?: string;
  purpose?: string;
  outcome?: string;
  nextAction?: string;
  nextActionDate?: string;
}

export interface HotelDealItem {
  dbId?: string;
  id: string; // e.g. "OPP-301"
  dealName: string;
  leadId: string; // Linked Lead ID e.g. "LD-502"
  stage: HotelDealStage;
  status: HotelDealStatus;

  // Customer Contact Info (Linked Lead)
  customerName: string;
  companyName?: string;
  contactPerson?: string;
  mobile: string;
  email?: string;
  preferredContactMethod: "Phone" | "WhatsApp" | "Email";

  // Business Requirements
  leadType: LeadType;
  customerRequirement: string;
  expectedEventDate?: string;
  guestCount?: number;
  expectedRoomNights?: number;
  venueRequired?: string;
  requestedServices?: string[];
  leadSource?: LeadSource;
  campaignName?: string | null;
  campaignId?: string | null;

  // Commercial Info
  dealValue: number;
  quotedValue?: number;
  expectedRevenue?: number;
  discountOffered?: string;
  expectedCloseDate: string;
  paymentTerms?: string;
  creditTerms?: string;

  // Quotations Entity Revisions (QTN)
  quotations: DealQuotation[];

  // Tentative Hold Details (When in Tentative Hold)
  tentativeHold?: TentativeHoldDetails;

  // Corporate & Travel Agent Integrations
  corporateClientId?: string | null;
  corporateClientName?: string | null;
  travelAgentId?: string | null;
  travelAgentName?: string | null;
  commissionAgreement?: string | null;
  contractedRate?: string | null;

  // Assignment
  assignedExecutive: string;

  // Next Action & Activities (Dynamically driven)
  nextActionSummary?: string;
  nextCallDate?: string;
  nextCallTime?: string;
  nextCallNotes?: string;

  // Site Visit Specifics
  siteVisitDate?: string;
  siteVisitTime?: string;
  siteVisitVenue?: string;
  siteVisitStatus?: "Scheduled" | "Completed" | "Cancelled";
  siteVisitNotes?: string;

  // Lost Opportunity Details
  lostReason?: string;
  lostNotes?: string;

  // Full Activity Timeline & Stage Audit Records
  activities: DealActivity[];
  createdDate: string;
}

// ─────────────────────────────────────────────────────────────
// 3. INITIAL SEED DEALS (LINKED TO CENTRAL LEADS)
// ─────────────────────────────────────────────────────────────

export const INITIAL_HOTEL_DEALS: HotelDealItem[] = [];

function buildDealPayload(deal: HotelDealItem, leadDbId?: string): Record<string, unknown> {
  return mapDealToApi({
    dealName: deal.dealName,
    leadDbId,
    leadId: deal.leadId,
    customerName: deal.customerName,
    companyName: deal.companyName,
    mobile: deal.mobile,
    email: deal.email,
    bookingType: deal.leadType,
    stage: deal.stage,
    status: deal.status,
    dealValue: deal.dealValue,
    expectedCloseDate: deal.expectedCloseDate,
    assignedExecutive: deal.assignedExecutive,
    campaignId: deal.campaignId,
    campaignName: deal.campaignName,
    leadSource: deal.leadSource,
    customerRequirement: deal.customerRequirement,
    guestCount: deal.guestCount,
    expectedEventDate: deal.expectedEventDate,
    metadata: {
      quotations: deal.quotations,
      activities: deal.activities,
      tentativeHold: deal.tentativeHold,
      lostReason: deal.lostReason,
      lostNotes: deal.lostNotes,
      nextActionSummary: deal.nextActionSummary,
      quotedValue: deal.quotedValue,
      venueRequired: deal.venueRequired,
      preferredContactMethod: deal.preferredContactMethod,
    },
  });
}

export function DealsPipelineView() {
  const router = useRouter();
  const [deals, setDeals] = useState<HotelDealItem[]>([]);
  const [centralLeads, setCentralLeads] = useState<CentralLeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadDealsAndLeads = async () => {
    setLoading(true);
    try {
      const [dealRows, leadRows] = await Promise.all([smDealService.list(), smLeadService.list()]);
      setDeals(dealRows.map(mapDealFromApi));
      setCentralLeads(leadRows.map(mapCentralLeadFromApi));
    } catch (e) {
      setToastMessage(e instanceof Error ? e.message : "Failed to load deals");
      setDeals([]);
      setCentralLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDealsAndLeads();
  }, []);

  const persistDeal = async (deal: HotelDealItem, leadDbId?: string): Promise<HotelDealItem | null> => {
    try {
      const payload = buildDealPayload(deal, leadDbId);
      const row = deal.dbId
        ? await smDealService.update(deal.dbId, payload)
        : await smDealService.create(payload);
      return mapDealFromApi(row);
    } catch (e) {
      setToastMessage(e instanceof Error ? e.message : "Failed to save deal");
      return null;
    }
  };

  // Drag and Drop State
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<HotelDealStage | null>(null);

  // View & Filters State
  const [viewMode, setViewMode] = useState<"KANBAN" | "LIST">("KANBAN");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>("ALL");
  const [selectedLeadTypeFilter, setSelectedLeadTypeFilter] = useState<string>("ALL");
  const [selectedExecutiveFilter, setSelectedExecutiveFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");

  // Drawer & Modal States
  const [selectedDeal, setSelectedDeal] = useState<HotelDealItem | null>(null);
  const [drawerTab, setDrawerTab] = useState<"overview" | "commercials" | "quotations" | "hold" | "activities" | "timeline">("overview");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false);
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [dealToMarkLost, setDealToMarkLost] = useState<HotelDealItem | null>(null);

  // Won Modal State
  const [isWonModalOpen, setIsWonModalOpen] = useState(false);
  const [dealToMarkWon, setDealToMarkWon] = useState<HotelDealItem | null>(null);

  // Tentative Hold Modal State
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [holdDealTarget, setHoldDealTarget] = useState<HotelDealItem | null>(null);
  const [holdVenueName, setHoldVenueName] = useState("Grand Ballroom & Royal Lawn");
  const [holdStartDate, setHoldStartDate] = useState("2026-11-15");
  const [holdEndDate, setHoldEndDate] = useState("2026-11-16");
  const [holdExpiryDate, setHoldExpiryDate] = useState("2026-09-05");
  const [holdNotes, setHoldNotes] = useState("");

  // Quotation Modal State
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [qtnVersionName, setQtnVersionName] = useState("");
  const [qtnAmount, setQtnAmount] = useState<number>(500000);
  const [qtnValidUntil, setQtnValidUntil] = useState("2026-09-15");
  const [qtnInclusions, setQtnInclusions] = useState("");

  // Lost Modal Input State
  const [lostReasonInput, setLostReasonInput] = useState("Price Too High");
  const [lostNotesInput, setLostNotesInput] = useState("");

  // Create Deal Form State (Pre-fills from Lead)
  const [createLeadIdSelect, setCreateLeadIdSelect] = useState<string>("");
  const [createDealName, setCreateDealName] = useState("");
  const [createCustomerName, setCreateCustomerName] = useState("");
  const [createCompanyName, setCreateCompanyName] = useState("");
  const [createMobile, setCreateMobile] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createLeadType, setCreateLeadType] = useState<LeadType>("Wedding");
  const [createDealValue, setCreateDealValue] = useState("");
  const [createExpectedCloseDate, setCreateExpectedCloseDate] = useState("2026-09-30");
  const [createStage, setCreateStage] = useState<HotelDealStage>("Qualification");
  const [createExecutive, setCreateExecutive] = useState("Jay Kumar");
  const [createRequirement, setCreateRequirement] = useState("");

  // ─────────────────────────────────────────────────────────────
  // STAGE PROGRESSION SHORTCUT (CALCULATES NEXT CONFIGURED STAGE)
  // ─────────────────────────────────────────────────────────────

  const getNextStage = (currentStage: HotelDealStage): HotelDealStage | null => {
    switch (currentStage) {
      case "Qualification":
        return "Requirement Analysis";
      case "Requirement Analysis":
        return "Quotation / Proposal";
      case "Quotation / Proposal":
        return "Negotiation";
      case "Negotiation":
        return "Tentative Hold";
      case "Tentative Hold":
        return "Final Decision";
      case "Final Decision":
        return "Won";
      default:
        return null;
    }
  };

  const handleAdvanceToNextStage = (deal: HotelDealItem) => {
    const next = getNextStage(deal.stage);
    if (!next) return;

    if (next === "Tentative Hold" && !deal.tentativeHold) {
      setHoldDealTarget(deal);
      setHoldVenueName(deal.venueRequired || "Grand Ballroom");
      setHoldStartDate(deal.expectedEventDate || "2026-11-15");
      setHoldEndDate(deal.expectedEventDate || "2026-11-16");
      setHoldExpiryDate("2026-09-05");
      setHoldNotes(`Hold for ${deal.dealName}`);
      setIsHoldModalOpen(true);
      return;
    }

    if (next === "Won") {
      setDealToMarkWon(deal);
      setIsWonModalOpen(true);
      return;
    }

    void applyStageChange(deal, next);
  };

  // ─────────────────────────────────────────────────────────────
  // METRICS COMPUTATION FOR STAGES & KPI HEADER
  // ─────────────────────────────────────────────────────────────

  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      const matchSearch =
        d.dealName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.companyName && d.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.leadId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStage = selectedStageFilter === "ALL" || d.stage === selectedStageFilter;
      const matchType = selectedLeadTypeFilter === "ALL" || d.leadType === selectedLeadTypeFilter;
      const matchExec = selectedExecutiveFilter === "ALL" || d.assignedExecutive === selectedExecutiveFilter;
      const matchStatus = selectedStatusFilter === "ALL" || d.status === selectedStatusFilter;

      return matchSearch && matchStage && matchType && matchExec && matchStatus;
    });
  }, [deals, searchQuery, selectedStageFilter, selectedLeadTypeFilter, selectedExecutiveFilter, selectedStatusFilter]);

  // Overall KPI Cards Metrics
  const kpiMetrics = useMemo(() => {
    const totalCount = deals.length;
    const totalPipelineValue = deals.reduce((sum, d) => sum + d.dealValue, 0);
    const wonCount = deals.filter((d) => d.status === "Won").length;
    const wonValue = deals.filter((d) => d.status === "Won").reduce((sum, d) => sum + d.dealValue, 0);
    const openCount = deals.filter((d) => d.status === "Open").length;

    return {
      totalCount,
      totalPipelineValue,
      wonCount,
      wonValue,
      openCount,
    };
  }, [deals]);

  // Map Deals by Stage for Kanban Columns
  const dealsByStage = useMemo(() => {
    const map: Record<HotelDealStage, HotelDealItem[]> = {
      Qualification: [],
      "Requirement Analysis": [],
      "Quotation / Proposal": [],
      Negotiation: [],
      "Tentative Hold": [],
      "Final Decision": [],
      Won: [],
      Lost: [],
    };

    filteredDeals.forEach((d) => {
      if (map[d.stage]) {
        map[d.stage].push(d);
      }
    });

    return map;
  }, [filteredDeals]);

  // Helper to calculate total value per stage
  const getStageTotalValue = (stageId: HotelDealStage) => {
    return (dealsByStage[stageId] || []).reduce((sum, d) => sum + d.dealValue, 0);
  };

  // ─────────────────────────────────────────────────────────────
  // STAGE AUDIT & DRAG-AND-DROP HANDLERS
  // ─────────────────────────────────────────────────────────────

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData("text/plain", dealId);
    setDraggedDealId(dealId);
  };

  const handleDragOver = (e: React.DragEvent, stageId: HotelDealStage) => {
    e.preventDefault();
    setDragOverStageId(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStageId(null);
  };

  const handleDrop = (e: React.DragEvent, targetStage: HotelDealStage) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData("text/plain") || draggedDealId;
    setDragOverStageId(null);
    setDraggedDealId(null);

    if (!dealId) return;

    const targetDeal = deals.find((d) => d.id === dealId);
    if (!targetDeal || targetDeal.stage === targetStage) return;

    // If moving to Tentative Hold, prompt for hold specifics
    if (targetStage === "Tentative Hold" && !targetDeal.tentativeHold) {
      setHoldDealTarget(targetDeal);
      setHoldVenueName(targetDeal.venueRequired || "Grand Ballroom");
      setHoldStartDate(targetDeal.expectedEventDate || "2026-11-15");
      setHoldEndDate(targetDeal.expectedEventDate || "2026-11-16");
      setHoldExpiryDate("2026-09-05");
      setHoldNotes(`Tentative hold for ${targetDeal.dealName}`);
      setIsHoldModalOpen(true);
      return;
    }

    // If moving to Won, open Won Confirmation Modal
    if (targetStage === "Won") {
      setDealToMarkWon(targetDeal);
      setIsWonModalOpen(true);
      return;
    }

    // If moving to Lost, open Lost Modal
    if (targetStage === "Lost") {
      setDealToMarkLost(targetDeal);
      setIsLostModalOpen(true);
      return;
    }

    void applyStageChange(targetDeal, targetStage);
  };

  // Core Stage Changer with Audit Log Creation
  const applyStageChange = async (deal: HotelDealItem, targetStage: HotelDealStage, extraAuditNotes?: string) => {
    const previousStage = deal.stage;
    const newStatus: HotelDealStatus = targetStage === "Won" ? "Won" : targetStage === "Lost" ? "Lost" : "Open";

    const auditActivity: DealActivity = {
      id: `ACT-${Date.now()}`,
      type: "Stage Change",
      date: nowTimelineStamp(),
      user: deal.assignedExecutive,
      notes: extraAuditNotes || `Stage moved from "${previousStage}" → "${targetStage}".`,
      purpose: "Pipeline Progression",
      status: "Completed",
    };

    const updatedDeal: HotelDealItem = {
      ...deal,
      stage: targetStage,
      status: newStatus,
      nextActionSummary:
        targetStage === "Won"
          ? "Deal Won! Advance received. Click 'Convert to Booking →' in Bookings Queue."
          : targetStage === "Lost"
          ? `Closed Lost: ${deal.lostReason || "Customer cancelled/chose alternative"}`
          : targetStage === "Tentative Hold"
          ? `Venue on Tentative Hold until ${deal.tentativeHold?.holdExpiryDate || todayIsoDate()}.`
          : `Advanced to ${targetStage}. Awaiting next action.`,
      activities: [auditActivity, ...deal.activities],
    };

    const saved = await persistDeal(updatedDeal);
    if (!saved) return;

    setDeals((prev) => prev.map((d) => (d.id === deal.id ? saved : d)));
    if (selectedDeal?.id === deal.id) {
      setSelectedDeal(saved);
    }

    setToastMessage(`🚀 Deal "${saved.dealName}" moved to "${targetStage}"!`);
  };

  // Handle Save Tentative Hold
  const handleSaveTentativeHold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holdDealTarget) return;

    const holdDetails: TentativeHoldDetails = {
      venueName: holdVenueName.trim() || "Grand Ballroom",
      startDate: holdStartDate,
      endDate: holdEndDate,
      holdExpiryDate: holdExpiryDate,
      holdStatus: "Active",
      holdNotes: holdNotes.trim() || undefined,
    };

    const auditNotes = `Moved to Tentative Hold: Locked "${holdDetails.venueName}" (${holdDetails.startDate} to ${holdDetails.endDate}). Hold expires on ${holdDetails.holdExpiryDate}.`;

    const updatedDeal: HotelDealItem = {
      ...holdDealTarget,
      stage: "Tentative Hold",
      status: "Open",
      tentativeHold: holdDetails,
      nextActionSummary: `Tentative Hold on "${holdDetails.venueName}" active until ${holdDetails.holdExpiryDate}.`,
      activities: [
        {
          id: `ACT-${Date.now()}`,
          type: "Stage Change",
          date: nowTimelineStamp(),
          user: holdDealTarget.assignedExecutive,
          notes: auditNotes,
          purpose: "Venue Reservation Hold",
          status: "Completed",
        },
        ...holdDealTarget.activities,
      ],
    };

    const saved = await persistDeal(updatedDeal);
    if (!saved) return;

    setDeals((prev) => prev.map((d) => (d.id === holdDealTarget.id ? saved : d)));
    if (selectedDeal?.id === holdDealTarget.id) {
      setSelectedDeal(saved);
    }

    setIsHoldModalOpen(false);
    setHoldDealTarget(null);
    setToastMessage(`🔒 Placed Tentative Hold on "${holdDetails.venueName}" until ${holdDetails.holdExpiryDate}!`);
  };

  // Handle Create Quotation Revision (QTN)
  const handleCreateQuotationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeal) return;

    const newQtnId = `QTN-${String(selectedDeal.quotations.length + 1).padStart(3, "0")}`;
    const newQuotation: DealQuotation = {
      id: newQtnId,
      versionName: qtnVersionName.trim() || `Quotation Revision #${selectedDeal.quotations.length + 1}`,
      date: nowTimelineStamp(),
      amount: Number(qtnAmount) || selectedDeal.dealValue,
      status: "Sent",
      inclusions: qtnInclusions.trim() || undefined,
      validUntil: qtnValidUntil,
    };

    const updatedQuotations = selectedDeal.quotations.map((q) =>
      q.status === "Sent" ? { ...q, status: "Superseded" as const } : q
    );

    const auditActivity: DealActivity = {
      id: `ACT-${Date.now()}`,
      type: "Proposal Sent",
      date: nowTimelineStamp(),
      user: selectedDeal.assignedExecutive,
      notes: `Generated and sent new quotation #${newQtnId} ("${newQuotation.versionName}") for ₹${newQuotation.amount.toLocaleString("en-IN")}.`,
      purpose: "Quotation Issuance",
      status: "Completed",
    };

    const updatedDeal: HotelDealItem = {
      ...selectedDeal,
      quotedValue: newQuotation.amount,
      quotations: [newQuotation, ...updatedQuotations],
      activities: [auditActivity, ...selectedDeal.activities],
    };

    const saved = await persistDeal(updatedDeal);
    if (!saved) return;

    setDeals((prev) => prev.map((d) => (d.id === selectedDeal.id ? saved : d)));
    setSelectedDeal(saved);
    setIsQuotationModalOpen(false);
    setToastMessage(`✓ Created and issued Quotation #${newQtnId}!`);
  };

  // Handle Save Activity from Modal (Scheduled vs Completed)
  const handleSaveActivity = async (payload: ActivityPayload) => {
    if (!selectedDeal) return;

    const newDealActivity: DealActivity = {
      id: payload.id,
      type: payload.activityType,
      date: payload.activityDate,
      time: payload.activityTime,
      user: payload.assignedExecutive,
      notes: payload.notes,
      status: payload.status,
      purpose: payload.subject,
      venue: payload.venue,
      contactPerson: payload.contactPerson,
      nextAction: payload.nextActionSummary,
      nextActionDate: payload.nextActionDate,
    };

    const nextSummary = payload.nextActionSummary
      ? `${payload.nextActionSummary} (${payload.nextActionDate || "Soon"})`
      : payload.status === "Upcoming"
      ? `${payload.activityType} scheduled for ${payload.activityDate} at ${payload.activityTime}`
      : selectedDeal.nextActionSummary;

    const updatedDeal: HotelDealItem = {
      ...selectedDeal,
      nextActionSummary: nextSummary,
      nextCallDate: payload.nextActionDate || (payload.status === "Upcoming" ? payload.activityDate : selectedDeal.nextCallDate),
      activities: [newDealActivity, ...selectedDeal.activities],
    };

    const saved = await persistDeal(updatedDeal);
    if (!saved) return;

    setDeals((prev) => prev.map((d) => (d.id === selectedDeal.id ? saved : d)));
    setSelectedDeal(saved);
    setIsAddActivityModalOpen(false);
    setToastMessage(`✓ Logged activity "${payload.subject}"!`);
  };

  // Handle Mark Lost Confirm
  const handleConfirmMarkLost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealToMarkLost) return;

    const updatedDeal: HotelDealItem = {
      ...dealToMarkLost,
      stage: "Lost",
      status: "Lost",
      lostReason: lostReasonInput,
      lostNotes: lostNotesInput.trim() || undefined,
      nextActionSummary: `Closed Lost: ${lostReasonInput}`,
      activities: [
        {
          id: `ACT-${Date.now()}`,
          type: "Stage Change",
          date: nowTimelineStamp(),
          user: dealToMarkLost.assignedExecutive,
          notes: `Marked Lost: ${lostReasonInput}. ${lostNotesInput.trim()}`,
          purpose: "Opportunity Closeout",
          status: "Completed",
        },
        ...dealToMarkLost.activities,
      ],
    };

    const saved = await persistDeal(updatedDeal);
    if (!saved) return;

    setDeals((prev) => prev.map((d) => (d.id === dealToMarkLost.id ? saved : d)));
    if (selectedDeal?.id === dealToMarkLost.id) {
      setSelectedDeal(saved);
    }

    setIsLostModalOpen(false);
    setDealToMarkLost(null);
    setToastMessage(`✓ Opportunity #${saved.id} marked as Lost.`);
  };

  // Pre-fill Create Deal from Lead Selection
  const handleSelectLeadForDeal = (leadId: string) => {
    setCreateLeadIdSelect(leadId);
    if (!leadId || leadId === "STANDALONE") {
      setCreateCustomerName("");
      setCreateCompanyName("");
      setCreateMobile("");
      setCreateEmail("");
      setCreateDealValue("");
      setCreateRequirement("");
      return;
    }

    const foundLead = centralLeads.find((l) => l.id === leadId);
    if (foundLead) {
      const bType = (foundLead as any).bookingType || foundLead.leadType || "Event";
      setCreateDealName(`${foundLead.leadName || "Inquiry"} (${bType})`);
      setCreateCustomerName(foundLead.contactPerson || foundLead.leadName || "");
      setCreateCompanyName(foundLead.companyName || "");
      setCreateMobile((foundLead as any).mobileNumber || foundLead.mobile || "");
      setCreateEmail(foundLead.email || "");
      setCreateLeadType((foundLead.leadType || "Wedding") as LeadType);
      setCreateDealValue(String((foundLead as any).estimatedRevenue || foundLead.rawRevenue || 500000));
      setCreateRequirement((foundLead as any).customerRequirements || foundLead.customerRequirement || "");
      if (foundLead.assignedExecutive) {
        setCreateExecutive(foundLead.assignedExecutive);
      }
    }
  };

  // Handle Create Deal Submit
  const handleCreateDealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createDealName.trim() || !createCustomerName.trim() || !createMobile.trim()) return;

    const linkedLead = centralLeads.find((l) => l.id === createLeadIdSelect);
    const newDeal: HotelDealItem = {
      id: `OPP-${Date.now()}`,
      dealName: createDealName.trim(),
      leadId: createLeadIdSelect || "",
      stage: createStage,
      status: createStage === "Won" ? "Won" : createStage === "Lost" ? "Lost" : "Open",
      customerName: createCustomerName.trim(),
      companyName: createCompanyName.trim() || undefined,
      contactPerson: createCustomerName.trim(),
      mobile: createMobile.trim(),
      email: createEmail.trim() || undefined,
      preferredContactMethod: "Phone",
      leadType: createLeadType,
      customerRequirement: createRequirement.trim() || "Event inquiry details pending discovery call.",
      expectedEventDate: todayIsoDate(),
      dealValue: Number(createDealValue) || 500000,
      quotedValue: Number(createDealValue) || 500000,
      expectedRevenue: Number(createDealValue) || 500000,
      expectedCloseDate: createExpectedCloseDate,
      assignedExecutive: createExecutive,
      nextActionSummary: `Initial discovery call scheduled with ${createCustomerName}.`,
      quotations: [],
      activities: [
        {
          id: `ACT-${Date.now()}`,
          type: "Note",
          date: nowTimelineStamp(),
          user: createExecutive,
          notes: `Opportunity created from Qualified Lead (#${createLeadIdSelect || "Direct"}).`,
          status: "Completed",
          purpose: "Opportunity Inception",
        },
      ],
      createdDate: todayIsoDate(),
    };

    const saved = await persistDeal(newDeal, linkedLead?.dbId);
    if (!saved) return;

    setDeals((prev) => [saved, ...prev]);
    setIsCreateModalOpen(false);
    setToastMessage(`✓ Created Sales Opportunity #${saved.id} for ${saved.dealName}!`);
  };

  return (
    <ModulePageShell
      eyebrow="Lead & Sales Management"
      title="Deals & Pipeline — Commercial Opportunities"
      description="Active sales opportunities pipeline across 8 operational stages from Qualification to Tentative Hold and Won/Lost bookings."
      breadcrumbs={[
        { label: "Sales & Marketing", href: "/sales-marketing/dashboard" },
        { label: "Lead & Sales" },
        { label: "Deals & Pipeline" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="bg-slate-100 p-0.5 rounded-xl flex items-center border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode("KANBAN")}
              className={cn(
                "px-2.5 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer",
                viewMode === "KANBAN" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
              )}
            >
              <Kanban className="h-3.5 w-3.5" /> Board
            </button>
            <button
              type="button"
              onClick={() => setViewMode("LIST")}
              className={cn(
                "px-2.5 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer",
                viewMode === "LIST" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
              )}
            >
              <List className="h-3.5 w-3.5" /> Table
            </button>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> + Create Deal
          </Button>
        </div>
      }
    >
      {loading && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-600">
          Loading deals and leads from database…
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: PIPELINE COMMERCIAL KPI CARDS (F&B DASHBOARD STYLE)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6 mb-5">
        {/* Card 1: Total Active Deals */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Total Active Deals
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 sm:h-8 sm:w-8">
              <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            {kpiMetrics.totalCount}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            {kpiMetrics.openCount} in active pipeline
          </p>
        </Card>

        {/* Card 2: Pipeline Value */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Pipeline Value
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 sm:h-8 sm:w-8">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            ₹{(kpiMetrics.totalPipelineValue / 100000).toFixed(1)}L
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            Weighted commercial value
          </p>
        </Card>

        {/* Card 3: Won Bookings Value */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Won Bookings Value
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 sm:h-8 sm:w-8">
              <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            ₹{(kpiMetrics.wonValue / 100000).toFixed(1)}L
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            {kpiMetrics.wonCount} {kpiMetrics.wonCount === 1 ? "deal" : "deals"} won this month
          </p>
        </Card>

        {/* Card 4: Conversion Velocity */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Conversion Velocity
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 sm:h-8 sm:w-8">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            68.5%
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            Qualified to won rate
          </p>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: SEARCH & FILTER TOOLBAR
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs mb-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Deal Name, Opportunity ID (#OPP-301), Client, Company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs sm:text-sm rounded-lg border border-slate-200 pl-9 pr-3 py-2 bg-slate-50/50 font-normal text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-300"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {/* Stage Filter */}
          <select
            value={selectedStageFilter}
            onChange={(e) => setSelectedStageFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 py-2 px-3 bg-white text-slate-700 focus:outline-none focus:border-slate-300 cursor-pointer"
          >
            <option value="ALL">All 8 Stages</option>
            {HOTEL_PIPELINE_STAGES.map((st) => (
              <option key={st.id} value={st.id}>
                {st.label}
              </option>
            ))}
          </select>

          {/* Lead Type Filter */}
          <select
            value={selectedLeadTypeFilter}
            onChange={(e) => setSelectedLeadTypeFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 py-2 px-3 bg-white text-slate-700 focus:outline-none focus:border-slate-300 cursor-pointer"
          >
            <option value="ALL">All Event Types</option>
            <option value="Wedding">Wedding</option>
            <option value="Corporate Booking">Corporate Booking</option>
            <option value="Conference">Conference</option>
            <option value="Travel Group">Travel Group</option>
            <option value="Restaurant Event">Restaurant Event</option>
          </select>

          {/* Executive Filter */}
          <select
            value={selectedExecutiveFilter}
            onChange={(e) => setSelectedExecutiveFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 py-2 px-3 bg-white text-slate-700 focus:outline-none focus:border-slate-300 cursor-pointer"
          >
            <option value="ALL">All Executives</option>
            <option value="Vikram Malhotra">Vikram Malhotra</option>
            <option value="Jay Kumar">Jay Kumar</option>
            <option value="Ananya Roy">Ananya Roy</option>
          </select>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: KANBAN BOARD (ALL 8 PIPELINE STAGES VISIBLE)
      ───────────────────────────────────────────────────────────── */}
      {viewMode === "KANBAN" ? (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3.5 min-w-[1920px]">
            {HOTEL_PIPELINE_STAGES.map((stage) => {
              const stageDeals = dealsByStage[stage.id] || [];
              const stageTotal = getStageTotalValue(stage.id);
              const isDragOver = dragOverStageId === stage.id;

              return (
                <div
                  key={stage.id}
                  onDragOver={(e) => handleDragOver(e, stage.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, stage.id)}
                  className={cn(
                    "flex-1 min-w-[240px] max-w-[280px] rounded-xl flex flex-col transition-all bg-slate-50/80 border p-2.5",
                    isDragOver ? "bg-emerald-50/50 border-emerald-400 ring-2 ring-emerald-200" : stage.headerBorder
                  )}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/80">
                    <div className="flex items-center gap-1.5 truncate">
                      <strong className="text-xs font-bold text-slate-900 truncate">
                        {stage.label}
                      </strong>
                      <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {stageDeals.length}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-mono font-semibold text-slate-600 block">
                        ₹{(stageTotal / 100000).toFixed(1)}L
                      </span>
                    </div>
                  </div>

                  {/* Deal Cards Column Body */}
                  <div className="space-y-2.5 flex-1 overflow-y-auto min-h-[500px]">
                    {stageDeals.length > 0 ? (
                      stageDeals.map((deal) => (
                        <div
                          key={deal.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, deal.id)}
                          onClick={() => {
                            setSelectedDeal(deal);
                            setDrawerTab("overview");
                          }}
                          className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-slate-300 transition cursor-grab active:cursor-grabbing space-y-2"
                        >
                          {/* Card Top: Booking Type Pill & Deal ID */}
                          <div className="flex items-center justify-between">
                            <span className="bg-slate-100 text-slate-700 border border-slate-200/80 px-2 py-0.5 rounded text-[10px] font-medium truncate max-w-[120px]">
                              {deal.leadType}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400 font-semibold">
                              #{deal.id}
                            </span>
                          </div>

                          {/* Deal Title & Company */}
                          <div>
                            <h4 className="font-semibold text-xs text-slate-900 leading-tight">
                              {deal.dealName}
                            </h4>
                            <span className="text-[10px] text-slate-500 font-normal block truncate">
                              {deal.companyName || deal.customerName} (Lead: #{deal.leadId})
                            </span>
                          </div>

                          {/* Commercial Value & Target Date */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                            <strong className="text-slate-900 font-mono font-semibold text-xs">
                              ₹{deal.dealValue.toLocaleString("en-IN")}
                            </strong>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {deal.expectedEventDate || "Date TBD"}
                            </span>
                          </div>

                          {/* Tentative Hold Badge if active */}
                          {deal.tentativeHold && (
                            <div className="bg-amber-50/70 border border-amber-200/80 p-1.5 rounded-md text-[10px] text-amber-800 flex items-center justify-between font-medium">
                              <span className="truncate flex items-center gap-1">
                                <Timer className="h-3 w-3 text-amber-700 shrink-0" />
                                Hold until {deal.tentativeHold.holdExpiryDate}
                              </span>
                            </div>
                          )}

                          {/* Quotation Badge if quotations exist */}
                          {deal.quotations.length > 0 && (
                            <div className="bg-slate-50 border border-slate-200/80 px-2 py-1 rounded text-[10px] text-slate-700 flex items-center justify-between">
                              <span className="font-medium">
                                QTN: #{deal.quotations[0].id} ({deal.quotations.length} Revs)
                              </span>
                              <span className="font-mono font-semibold text-slate-900 text-[10px]">
                                ₹{(deal.quotedValue || deal.dealValue).toLocaleString("en-IN")}
                              </span>
                            </div>
                          )}

                          {/* Immediate Next Action Strip (Driven by Activity) */}
                          <div className="bg-slate-50/80 rounded-lg p-2 border border-slate-100 text-[10px] space-y-0.5">
                            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[9px] block">
                              Immediate Next Action
                            </span>
                            <p className="text-slate-600 font-normal leading-tight truncate">
                              {deal.nextActionSummary || "No upcoming activity scheduled"}
                            </p>
                          </div>

                          {/* Executive & Contact Footer */}
                          <div className="flex items-center justify-between pt-1 text-[10px]">
                            <span className="truncate max-w-[130px] font-normal text-slate-500 flex items-center gap-1">
                              <Users className="h-3 w-3 text-slate-400 shrink-0" /> {deal.assignedExecutive}
                            </span>
                            <a
                              href={`tel:${deal.mobile}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-slate-600 hover:text-slate-900 p-0.5 font-mono font-medium flex items-center gap-1"
                            >
                              <Phone className="h-3 w-3 text-slate-400 shrink-0" /> {deal.mobile}
                            </a>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-slate-400 text-xs italic border-2 border-dashed border-slate-200 rounded-xl">
                        No deals in {stage.label}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
            LIST VIEW TABLE (FOR BULK SEARCH & EXPORT)
        ───────────────────────────────────────────────────────────── */
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-4 py-3 text-xs text-slate-500 font-medium border-b border-slate-100 flex items-center justify-between">
            <span>Showing <strong className="text-slate-700 font-semibold">{filteredDeals.length}</strong> of <strong className="text-slate-700 font-semibold">{deals.length}</strong> records &bull; Deals &amp; Pipeline</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Opportunity #</th>
                  <th className="py-3 px-4">Deal Name</th>
                  <th className="py-3 px-4">Customer / Company</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Deal Value</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Next Action</th>
                  <th className="py-3 px-4">Executive</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                {filteredDeals.map((deal) => (
                  <tr
                    key={deal.id}
                    onClick={() => {
                      setSelectedDeal(deal);
                      setDrawerTab("overview");
                    }}
                    className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-800">
                      #{deal.id}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {deal.dealName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <span className="block font-medium">{deal.companyName || deal.customerName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{deal.mobile}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-700 border border-slate-200/80 px-2 py-0.5 rounded text-[10px] font-medium">
                        {deal.leadType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                      ₹{deal.dealValue.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                        {deal.stage}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-[11px] truncate max-w-[200px]">
                      {deal.nextActionSummary || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {deal.assignedExecutive}
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDeal(deal);
                          setDrawerTab("overview");
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                      >
                        <Eye className="h-3 w-3 text-slate-400" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: COMPREHENSIVE DEAL DETAIL DRAWER
      ───────────────────────────────────────────────────────────── */}
      {selectedDeal && (
        <Drawer
          isOpen={Boolean(selectedDeal)}
          onClose={() => {
            setSelectedDeal(null);
            setDrawerTab("overview");
          }}
          title={`Sales Opportunity — #${selectedDeal.id}`}
          maxWidth="xl"
          footer={
            <div className="flex items-center justify-between w-full pt-1">
              {selectedDeal.status === "Won" ? (
                <>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        router.push(`/sales-marketing/crm/accounts-contacts?search=${encodeURIComponent(selectedDeal.customerName)}`);
                      }}
                      className="text-xs font-semibold rounded-lg border-slate-200"
                    >
                      <UserCheck className="h-3.5 w-3.5 mr-1 text-purple-700" /> View Contact
                    </Button>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      router.push(`/sales-marketing/banquets/bookings-enquiries?dealId=${selectedDeal.id}`);
                    }}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> View Booking Queue →
                  </Button>
                </>
              ) : selectedDeal.status === "Lost" ? (
                <>
                  <div className="text-xs text-rose-700 font-medium">
                    Closed Lost: {selectedDeal.lostReason || "Customer cancelled"}
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void applyStageChange(selectedDeal, "Qualification", "Reopened opportunity back to Qualification")}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Reopen Deal
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddActivityModalOpen(true)}
                      className="text-xs font-semibold rounded-lg border-slate-200"
                    >
                      <Clock className="h-3.5 w-3.5 mr-1 text-blue-700" /> + Log Activity
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsQuotationModalOpen(true)}
                      className="text-xs font-semibold rounded-lg border-slate-200"
                    >
                      <FileText className="h-3.5 w-3.5 mr-1 text-purple-700" /> + Create QTN
                    </Button>
                  </div>

                  {getNextStage(selectedDeal.stage) && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleAdvanceToNextStage(selectedDeal)}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      Move to {getNextStage(selectedDeal.stage)} →
                    </Button>
                  )}
                </>
              )}
            </div>
          }
        >
          <div className="space-y-4 text-xs pb-4">
            {/* Top Deal Hero Card */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-mono text-slate-500 font-medium block">
                    Opportunity #{selectedDeal.id} (Linked Lead: #{selectedDeal.leadId})
                  </span>
                  <h3 className="text-base font-bold text-slate-900 leading-tight mt-0.5">
                    {selectedDeal.dealName}
                  </h3>
                  <span className="text-xs text-slate-500 font-normal">
                    {selectedDeal.companyName || selectedDeal.customerName} &bull; {selectedDeal.contactPerson}
                  </span>
                </div>

                <div className="text-right space-y-1">
                  <span className="text-base font-bold font-mono text-slate-900 block">
                    ₹{selectedDeal.dealValue.toLocaleString("en-IN")}
                  </span>
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-[11px] font-semibold border inline-block",
                      selectedDeal.status === "Won"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                        : selectedDeal.status === "Lost"
                        ? "bg-rose-50 text-rose-700 border-rose-200/80"
                        : "bg-slate-100 text-slate-700 border-slate-200/80"
                    )}
                  >
                    Stage: {selectedDeal.stage}
                  </span>
                </div>
              </div>

              {/* Immediate Next Action Banner */}
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" /> Immediate Next Action
                </span>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  {selectedDeal.nextActionSummary || "No immediate next action configured."}
                </p>
              </div>
            </div>

            {/* Clean Tabs (No Emojis) */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
              <button
                type="button"
                onClick={() => setDrawerTab("overview")}
                className={cn(
                  "flex-1 py-1.5 px-2.5 rounded-lg text-center transition cursor-pointer whitespace-nowrap",
                  drawerTab === "overview"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Overview &amp; Requirements
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab("commercials")}
                className={cn(
                  "flex-1 py-1.5 px-2.5 rounded-lg text-center transition cursor-pointer whitespace-nowrap",
                  drawerTab === "commercials"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Commercials &amp; Terms
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab("quotations")}
                className={cn(
                  "flex-1 py-1.5 px-2.5 rounded-lg text-center transition cursor-pointer whitespace-nowrap",
                  drawerTab === "quotations"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Quotations ({selectedDeal.quotations.length})
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab("hold")}
                className={cn(
                  "flex-1 py-1.5 px-2.5 rounded-lg text-center transition cursor-pointer whitespace-nowrap",
                  drawerTab === "hold"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Hold Details
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab("activities")}
                className={cn(
                  "flex-1 py-1.5 px-2.5 rounded-lg text-center transition cursor-pointer whitespace-nowrap",
                  drawerTab === "activities"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Activities ({selectedDeal.activities.length})
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab("timeline")}
                className={cn(
                  "flex-1 py-1.5 px-2.5 rounded-lg text-center transition cursor-pointer whitespace-nowrap",
                  drawerTab === "timeline"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Stage Timeline
              </button>
            </div>

            {/* ── TAB 1: OVERVIEW & EVENT REQUIREMENTS ── */}
            {drawerTab === "overview" && (
              <div className="space-y-3.5">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-2.5">
                  <h4 className="font-semibold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <UserCheck className="h-3.5 w-3.5 text-emerald-700" /> Client &amp; Contact Information
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Customer / Organization:</span>
                      <strong className="text-slate-900">{selectedDeal.companyName || selectedDeal.customerName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Contact Person:</span>
                      <strong className="text-slate-900">{selectedDeal.contactPerson}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Mobile Number:</span>
                      <span className="font-mono text-slate-700">{selectedDeal.mobile}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Email Address:</span>
                      <span className="font-mono text-slate-700">{selectedDeal.email || "Not Provided"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Linked Lead ID:</span>
                      <span className="font-mono text-slate-700">#{selectedDeal.leadId}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Assigned Executive:</span>
                      <span className="text-slate-700 font-medium">{selectedDeal.assignedExecutive}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-2.5">
                  <h4 className="font-semibold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Tag className="h-3.5 w-3.5 text-slate-500" /> Event &amp; Booking Specifications
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Event Booking Type:</span>
                      <strong className="text-slate-800">{selectedDeal.leadType}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Expected Date:</span>
                      <span className="font-mono text-slate-700">
                        {selectedDeal.expectedEventDate || "Not Provided"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Requested Venue:</span>
                      <strong className="text-slate-800">{selectedDeal.venueRequired || "Grand Ballroom"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Expected Guest Pax:</span>
                      <strong className="text-slate-800 font-mono">
                        {selectedDeal.guestCount ? `${selectedDeal.guestCount} Guests` : "Not Provided"}
                      </strong>
                    </div>
                    {selectedDeal.expectedRoomNights && (
                      <div>
                        <span className="text-slate-400 text-[10px] block">Room Block Nights:</span>
                        <strong className="text-slate-800 font-mono">{selectedDeal.expectedRoomNights} Room Nights</strong>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-400 text-[10px] block">Target Close Date:</span>
                      <span className="font-mono text-slate-600">{selectedDeal.expectedCloseDate}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider block mb-1">
                      Customer Requirements &amp; Notes:
                    </span>
                    <p className="text-slate-600 text-xs bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/80 leading-relaxed font-normal">
                      {selectedDeal.customerRequirement}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: COMMERCIALS & TERMS (CLEAN PMS THEME, NO DARK BOX) ── */}
            {drawerTab === "commercials" && (
              <div className="space-y-3.5">
                <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Deal Commercial Value
                      </span>
                      <h3 className="text-2xl font-bold text-slate-900 font-mono mt-0.5">
                        ₹{selectedDeal.dealValue.toLocaleString("en-IN")}
                      </h3>
                    </div>
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-semibold px-2.5 py-1 rounded-lg">
                      {selectedDeal.discountOffered || "Standard Tariff"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Quoted Tariff:</span>
                      <strong className="text-slate-900 font-mono text-xs">
                        ₹{(selectedDeal.quotedValue || selectedDeal.dealValue).toLocaleString("en-IN")}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Discount / Rate Agreement:</span>
                      <span className="text-slate-700 font-medium">{selectedDeal.discountOffered || "Standard Tariff Rate"}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-2.5">
                  <h4 className="font-semibold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-slate-400" /> Payment &amp; Credit Agreement
                  </h4>
                  <div className="space-y-2 text-xs pt-0.5">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Agreed Payment Terms:</span>
                      <strong className="text-slate-800 font-medium">{selectedDeal.paymentTerms || "Standard 50% Advance on Booking"}</strong>
                    </div>
                    {selectedDeal.creditTerms && (
                      <div>
                        <span className="text-slate-400 text-[11px] block">Corporate Credit SLA:</span>
                        <span className="text-slate-700 font-medium">{selectedDeal.creditTerms}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 3: QUOTATIONS (QTN REVISIONS) ── */}
            {drawerTab === "quotations" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                    Quotation Revisions &amp; Proposals
                  </h4>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setIsQuotationModalOpen(true)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] rounded-lg h-7"
                  >
                    <Plus className="h-3 w-3 mr-1" /> + Create QTN Revision
                  </Button>
                </div>

                {selectedDeal.quotations.length > 0 ? (
                  selectedDeal.quotations.map((qtn) => (
                    <div key={qtn.id} className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-purple-700" />
                          <span className="font-mono font-bold text-slate-900 text-xs">#{qtn.id}</span>
                          <strong className="text-slate-800 text-xs font-semibold">{qtn.versionName}</strong>
                        </div>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold border",
                            qtn.status === "Accepted"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : qtn.status === "Sent"
                              ? "bg-blue-100 text-blue-800 border-blue-200"
                              : qtn.status === "Draft"
                              ? "bg-amber-100 text-amber-800 border-amber-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          )}
                        >
                          {qtn.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Issued Date:</span>
                          <span className="font-mono text-slate-700">{qtn.date}</span>
                        </div>
                        {qtn.validUntil && (
                          <div>
                            <span className="text-slate-400 text-[10px] block">Valid Until:</span>
                            <span className="font-mono text-slate-700">{qtn.validUntil}</span>
                          </div>
                        )}
                        <div className="text-right">
                          <span className="text-slate-400 text-[10px] block">Quotation Value:</span>
                          <strong className="text-emerald-900 font-mono font-bold text-xs">
                            ₹{qtn.amount.toLocaleString("en-IN")}
                          </strong>
                        </div>
                      </div>

                      {qtn.inclusions && (
                        <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {qtn.inclusions}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-slate-200">
                    No formal quotations drafted yet. Click "+ Create QTN Revision" above.
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 4: TENTATIVE HOLD DETAILS ── */}
            {drawerTab === "hold" && (
              <div className="space-y-3">
                {selectedDeal.tentativeHold ? (
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Timer className="h-5 w-5 text-amber-700" />
                        <div>
                          <strong className="text-amber-950 font-bold text-xs block">
                            Active Tentative Hold on Venue
                          </strong>
                          <span className="text-[11px] text-amber-800">
                            Hold Status: <strong>{selectedDeal.tentativeHold.holdStatus}</strong>
                          </span>
                        </div>
                      </div>

                      <span className="bg-amber-200 text-amber-900 font-mono font-bold text-xs px-2.5 py-1 rounded-lg">
                        Expires: {selectedDeal.tentativeHold.holdExpiryDate}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-amber-200/80 text-xs">
                      <div>
                        <span className="text-amber-700 text-[10px] block">Locked Venue:</span>
                        <strong className="text-amber-950">{selectedDeal.tentativeHold.venueName}</strong>
                      </div>
                      <div>
                        <span className="text-amber-700 text-[10px] block">Event Target Dates:</span>
                        <span className="font-mono text-amber-950 font-semibold">
                          {selectedDeal.tentativeHold.startDate} to {selectedDeal.tentativeHold.endDate}
                        </span>
                      </div>
                    </div>

                    {selectedDeal.tentativeHold.holdNotes && (
                      <p className="text-xs text-amber-900 bg-white/80 p-2 rounded-lg border border-amber-200">
                        {selectedDeal.tentativeHold.holdNotes}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <p className="italic">No temporary venue hold active on this opportunity.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 5: ACTIVITIES ── */}
            {drawerTab === "activities" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                    Sales Activities &amp; Follow-ups
                  </h4>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setIsAddActivityModalOpen(true)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] rounded-lg h-7"
                  >
                    <Plus className="h-3 w-3 mr-1" /> + Log Activity
                  </Button>
                </div>

                {selectedDeal.activities.map((act) => (
                  <div key={act.id} className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="bg-slate-100 text-slate-800 font-semibold px-2 py-0.5 rounded text-[10px] border border-slate-200">
                        {act.type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{act.date}</span>
                    </div>
                    {act.purpose && (
                      <strong className="text-slate-900 text-xs block">{act.purpose}</strong>
                    )}
                    <p className="text-slate-700 text-xs leading-relaxed font-medium">
                      {act.notes}
                    </p>
                    {act.nextAction && (
                      <div className="pt-1 border-t border-slate-100 text-[10px] text-emerald-800 font-semibold">
                        Next Action: {act.nextAction} ({act.nextActionDate || "Scheduled"})
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400 pt-0.5">
                      Logged by: <strong className="text-slate-600">{act.user}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── TAB 6: STAGE AUDIT TIMELINE ── */}
            {drawerTab === "timeline" && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2.5">
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-blue-700" /> Stage Transition Audit Log
                  </h4>
                  <div className="space-y-2.5 text-xs border-l-2 border-slate-200 pl-3 ml-1">
                    {selectedDeal.activities.map((a) => (
                      <div key={a.id} className="space-y-0.5">
                        <div className="flex justify-between font-bold text-slate-900 text-xs">
                          <span>{a.notes}</span>
                          <span className="text-[10px] font-mono text-slate-400 font-normal">{a.date}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block font-medium">Actor: {a.user}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Drawer>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 5: CREATE DEAL MODAL (PRE-FILLED FROM QUALIFIED LEAD)
      ───────────────────────────────────────────────────────────── */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Sales Opportunity (Deal)"
          maxWidth="md"
        >
          <form onSubmit={handleCreateDealSubmit} className="space-y-3.5 text-xs p-1">
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Convert from Qualified Lead
              </label>
              <select
                value={createLeadIdSelect}
                onChange={(e) => handleSelectLeadForDeal(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs text-slate-900"
              >
                <option value="">-- Select Qualified Inbound Lead --</option>
                {centralLeads.map((l) => (
                  <option key={l.id} value={l.id}>
                    #{l.id} — {l.leadName} ({(l as any).bookingType || l.leadType || "Inquiry"})
                  </option>
                ))}
                <option value="STANDALONE">Create Standalone Opportunity (Direct Inbound)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Opportunity Deal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Singhania Destination Wedding"
                  value={createDealName}
                  onChange={(e) => setCreateDealName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Customer / Booker Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rakesh Singhania"
                  value={createCustomerName}
                  onChange={(e) => setCreateCustomerName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Mobile Number *</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98000 00000"
                  value={createMobile}
                  onChange={(e) => setCreateMobile(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Company / Family Name</label>
                <input
                  type="text"
                  placeholder="e.g. Singhania Group"
                  value={createCompanyName}
                  onChange={(e) => setCreateCompanyName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Event Type</label>
                <select
                  value={createLeadType}
                  onChange={(e) => setCreateLeadType(e.target.value as LeadType)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                >
                  <option value="Wedding">Wedding</option>
                  <option value="Corporate Booking">Corporate Booking</option>
                  <option value="Conference">Conference</option>
                  <option value="Travel Group">Travel Group</option>
                  <option value="Restaurant Event">Restaurant Event</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Initial Stage</label>
                <select
                  value={createStage}
                  onChange={(e) => setCreateStage(e.target.value as HotelDealStage)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                >
                  {HOTEL_PIPELINE_STAGES.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Deal Value (₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1500000"
                  value={createDealValue}
                  onChange={(e) => setCreateDealValue(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono font-bold text-emerald-800 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Assigned Executive</label>
                <select
                  value={createExecutive}
                  onChange={(e) => setCreateExecutive(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                >
                  <option value="Vikram Malhotra">Vikram Malhotra</option>
                  <option value="Jay Kumar">Jay Kumar</option>
                  <option value="Ananya Roy">Ananya Roy</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Target Close Date</label>
                <input
                  type="date"
                  value={createExpectedCloseDate}
                  onChange={(e) => setCreateExpectedCloseDate(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Customer Requirements &amp; Notes</label>
              <textarea
                rows={2.5}
                placeholder="Enter client specifications, food preferences, rooms requested..."
                value={createRequirement}
                onChange={(e) => setCreateRequirement(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs"
              >
                Create Opportunity
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 6: TENTATIVE HOLD MODAL
      ───────────────────────────────────────────────────────────── */}
      {isHoldModalOpen && holdDealTarget && (
        <Modal
          isOpen={isHoldModalOpen}
          onClose={() => {
            setIsHoldModalOpen(false);
            setHoldDealTarget(null);
          }}
          title={`Place Tentative Hold — #${holdDealTarget.id}`}
          maxWidth="sm"
        >
          <form onSubmit={handleSaveTentativeHold} className="space-y-3.5 text-xs p-1">
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <strong>Temporary Venue Reservation</strong>: Blocks venue dates on Venue Availability to prevent double-booking.
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Venue to Hold *</label>
              <input
                type="text"
                required
                value={holdVenueName}
                onChange={(e) => setHoldVenueName(e.target.value)}
                placeholder="e.g. Grand Ballroom & Royal Lawn"
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Event Start Date</label>
                <input
                  type="date"
                  required
                  value={holdStartDate}
                  onChange={(e) => setHoldStartDate(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Event End Date</label>
                <input
                  type="date"
                  required
                  value={holdEndDate}
                  onChange={(e) => setHoldEndDate(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Hold Expiration Date *</label>
              <input
                type="date"
                required
                value={holdExpiryDate}
                onChange={(e) => setHoldExpiryDate(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono font-bold text-amber-900 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Hold Notes</label>
              <textarea
                rows={2}
                value={holdNotes}
                onChange={(e) => setHoldNotes(e.target.value)}
                placeholder="e.g. Awaiting 25% token advance before formal booking"
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsHoldModalOpen(false);
                  setHoldDealTarget(null);
                }}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs"
              >
                🔒 Confirm Tentative Hold
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 7: CONFIRM DEAL WON MODAL
      ───────────────────────────────────────────────────────────── */}
      {isWonModalOpen && dealToMarkWon && (
        <Modal
          isOpen={isWonModalOpen}
          onClose={() => {
            setIsWonModalOpen(false);
            setDealToMarkWon(null);
          }}
          title={`Confirm Deal Won — #${dealToMarkWon.id}`}
          maxWidth="sm"
        >
          <div className="space-y-3.5 text-xs p-1">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
              <strong className="text-emerald-950 font-bold text-sm block">
                {dealToMarkWon.dealName}
              </strong>
              <p className="text-emerald-800">
                Customer: <strong>{dealToMarkWon.companyName || dealToMarkWon.customerName}</strong>
              </p>
              <div className="pt-1 text-xs">
                Contract Value: <strong className="font-mono text-emerald-900 font-bold text-sm">₹{dealToMarkWon.dealValue.toLocaleString("en-IN")}</strong>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Confirming this deal as <strong>Won</strong> will close the pipeline opportunity, create or update the Customer Master record, and route it to the <strong>Banquet Booking Queue</strong> for operational execution.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsWonModalOpen(false);
                  setDealToMarkWon(null);
                }}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  void applyStageChange(dealToMarkWon, "Won", "Deal confirmed Won and routed to Booking Queue.");
                  setIsWonModalOpen(false);
                  setDealToMarkWon(null);
                }}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5"
              >
                <Award className="h-3.5 w-3.5" /> Confirm Deal Won
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 8: CREATE QUOTATION (QTN) MODAL
      ───────────────────────────────────────────────────────────── */}
      {isQuotationModalOpen && selectedDeal && (
        <Modal
          isOpen={isQuotationModalOpen}
          onClose={() => setIsQuotationModalOpen(false)}
          title={`Generate Quotation Revision — #${selectedDeal.id}`}
          maxWidth="sm"
        >
          <form onSubmit={handleCreateQuotationSubmit} className="space-y-3.5 text-xs p-1">
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Quotation Version Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Revised Banquet Gala Package"
                value={qtnVersionName}
                onChange={(e) => setQtnVersionName(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Quoted Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={qtnAmount}
                  onChange={(e) => setQtnAmount(Number(e.target.value))}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono font-bold text-emerald-800 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Valid Until</label>
                <input
                  type="date"
                  required
                  value={qtnValidUntil}
                  onChange={(e) => setQtnValidUntil(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Package Inclusions Summary</label>
              <textarea
                rows={2.5}
                placeholder="e.g. Grand Ballroom, 450 pax North/South Indian buffet, 30 Deluxe rooms block..."
                value={qtnInclusions}
                onChange={(e) => setQtnInclusions(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsQuotationModalOpen(false)}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs"
              >
                Issue Quotation
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 9: MARK LOST MODAL
      ───────────────────────────────────────────────────────────── */}
      {isLostModalOpen && dealToMarkLost && (
        <Modal
          isOpen={isLostModalOpen}
          onClose={() => {
            setIsLostModalOpen(false);
            setDealToMarkLost(null);
          }}
          title={`Mark Opportunity Lost — #${dealToMarkLost.id}`}
          maxWidth="sm"
        >
          <form onSubmit={handleConfirmMarkLost} className="space-y-3.5 text-xs p-1">
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Lost Reason *</label>
              <select
                value={lostReasonInput}
                onChange={(e) => setLostReasonInput(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
              >
                <option value="Price Too High">Price / Tariff Too High</option>
                <option value="Customer Chose Competitor">Customer Chose Competitor</option>
                <option value="Date Unavailable">Venue / Date Unavailable</option>
                <option value="Event Cancelled by Client">Event Cancelled by Client</option>
                <option value="No Response / Unresponsive">No Response / Unresponsive</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Competitor / Feedback Notes</label>
              <textarea
                rows={2.5}
                value={lostNotesInput}
                onChange={(e) => setLostNotesInput(e.target.value)}
                placeholder="Enter client feedback or competitor pricing..."
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsLostModalOpen(false);
                  setDealToMarkLost(null);
                }}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg text-xs"
              >
                Confirm Lost
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 10: ADD ACTIVITY MODAL
      ───────────────────────────────────────────────────────────── */}
      {isAddActivityModalOpen && selectedDeal && (
        <AddActivityModal
          isOpen={isAddActivityModalOpen}
          onClose={() => setIsAddActivityModalOpen(false)}
          onSave={handleSaveActivity}
          dealContext={{
            id: selectedDeal.id,
            dealName: selectedDeal.dealName,
            leadId: selectedDeal.leadId,
            customerName: selectedDeal.customerName,
            companyName: selectedDeal.companyName,
            mobile: selectedDeal.mobile,
            email: selectedDeal.email,
            stage: selectedDeal.stage,
            assignedExecutive: selectedDeal.assignedExecutive,
          }}
        />
      )}
    </ModulePageShell>
  );
}
