"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Search,
  Filter,
  Plus,
  Phone,
  Mail,
  Building2,
  Calendar,
  DollarSign,
  UserCheck,
  Clock,
  Eye,
  Edit2,
  CheckCircle2,
  FileText,
  Tag,
  ArrowRight,
  Send,
  Users,
  AlertTriangle,
  X,
  Sparkles,
  Layers,
  Upload,
  FileSpreadsheet,
  Save,
  Check,
  ExternalLink,
  Kanban,
  History,
  RotateCcw,
  CheckCircle,
  XCircle,
  MessageSquare,
  MapPin,
  Briefcase,
  Share2,
  Info,
  Lock,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, StatusBadge } from "@/components/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import { cn } from "@/lib/utils";
import { INITIAL_CENTRAL_LEADS, CentralLeadItem } from "@/app/data/centralLeadData";

// ─────────────────────────────────────────────────────────────
// VERSION 1 HOTEL PMS CRM TYPES & SCHEMAS
// ─────────────────────────────────────────────────────────────

export type LeadStatus =
  | "New"
  | "Contacted"
  | "Qualified"
  | "In Pipeline"
  | "Won"
  | "Lost";

export type PipelineStage =
  | "Qualification"
  | "Requirement Analysis"
  | "Quotation / Proposal"
  | "Negotiation"
  | "Tentative Booking"
  | "Final Decision"
  | "Won"
  | "Lost"
  | "Not in Pipeline";

export type LeadType =
  | "Wedding"
  | "Banquet Event"
  | "Corporate Booking"
  | "Conference"
  | "Room Booking"
  | "Restaurant Event"
  | "Travel Group";

export type LeadSource =
  | "Walk-In"
  | "Phone Call"
  | "Website"
  | "WhatsApp"
  | "Email"
  | "Referral"
  | "Marketing Campaign"
  | "Travel Agent"
  | "Corporate Reference"
  | "Google Ads"
  | "Meta Ads"
  | "Direct Inquiry";

export type LeadPriority = "High" | "Medium" | "Low";

export interface ActivityTimelineItem {
  action: string;
  user: string;
  date: string;
  note?: string;
  type?: "Phone Call" | "Follow-up" | "Meeting" | "Site Visit" | "Email" | "WhatsApp" | "Note" | "Stage Change";
  status?: "Scheduled" | "Completed" | "Cancelled";
  venue?: string;
  nextFollowupDate?: string;
}

export interface InternalNoteItem {
  id: string;
  text: string;
  user: string;
  date: string;
}

export interface HotelLeadItem {
  id: string;
  leadName: string;
  companyName?: string;
  mobile: string;
  email?: string;
  preferredContactMethod?: "Phone" | "WhatsApp" | "Email";

  // Inquiry & Commercial Info
  leadType: LeadType;
  leadSource: LeadSource;
  inquiryDate?: string;
  expectedEventDate?: string;
  guestCount?: number;
  expectedRoomNights?: number;
  expectedRevenue: string; // e.g. "₹8,90,000"
  rawRevenue: number;
  assignedExecutive: string;
  priority: LeadPriority;
  status: LeadStatus;
  pipelineStage: PipelineStage;

  // Extended Requirement Fields (Added for Progressive Sales Flow)
  customerRequirement: string;
  venuePreference?: string;
  mealRequirement?: string;
  roomRequirement?: string;
  specialRequirements?: string;
  additionalNotes?: string;

  // Marketing & Tariff Attribution
  createdDate: string;
  campaignId?: string | null;
  campaignName?: string | null;
  promotionCode?: string | null;
  rateTariff?: string | null;

  // Linked Records
  opportunityId?: string | null;
  bookingId?: string | null;
  bookingType?: "Room Reservation" | "Banquet Event" | "F&B Booking" | null;

  // Timelines & Notes
  activityTimeline: ActivityTimelineItem[];
  internalNotes?: InternalNoteItem[];
}

// ─────────────────────────────────────────────────────────────
// HELPER FORMATTERS FOR UNKNOWN VALUES (SECTION 5 & 6 RULES)
// ─────────────────────────────────────────────────────────────

/** Format missing text fields as 'Not Provided', 'Not Available', or 'Not Specified' */
const formatValue = (val?: string | number | null, fallbackType: "PROVIDED" | "AVAILABLE" | "SPECIFIED" | "APPLICABLE" = "PROVIDED") => {
  if (val !== undefined && val !== null && String(val).trim() !== "") {
    return String(val);
  }
  switch (fallbackType) {
    case "PROVIDED":
      return "Not Provided";
    case "AVAILABLE":
      return "Not Available";
    case "SPECIFIED":
      return "Not Specified";
    case "APPLICABLE":
      return "Not Applicable";
    default:
      return "Not Provided";
  }
};

/** Format Promotion / Promo Code separately from Rate / Tariff (Section 6 Rule) */
const formatPromoCode = (code?: string | null) => {
  if (code && code.trim() !== "" && code.trim().toLowerCase() !== "standard tariff") {
    return code.trim();
  }
  return "Not Applied";
};

// ─────────────────────────────────────────────────────────────
// DIRECT CSV SAMPLE IMPORT DATA
// ─────────────────────────────────────────────────────────────

const DIRECT_CSV_SAMPLE_ROWS = [
  {
    "Full Name": "Amitabh Bachchan & Group",
    "Phone Number": "+91 98111 22334",
    Email: "amitabh.b@group.com",
    "Company Name": "ABC Productions",
    "Event Date": "2026-10-15",
    "Guest Count": "250",
    Budget: "1500000",
    Notes: "Requires VVIP security and 40 luxury suites.",
  },
  {
    "Full Name": "Dr. Sameer Joshi",
    "Phone Number": "+91 98220 33445",
    Email: "dr.joshi@neurocon.org",
    "Company Name": "Neurocon India",
    "Event Date": "2026-11-20",
    "Guest Count": "300",
    Budget: "1200000",
    Notes: "Annual Medical Symposium. Needs Auditorium + 2 breakout halls.",
  },
  {
    "Full Name": "Siddharth Malhotra",
    "Phone Number": "+91 97330 44556",
    Email: "sid.m@gmail.com",
    "Company Name": "Malhotra Family",
    "Event Date": "2026-12-05",
    "Guest Count": "400",
    Budget: "2800000",
    Notes: "Destination Wedding package. Poolside Sangeet + Royal Lawn Reception.",
  },
];

export function LeadsInquiriesView() {
  const router = useRouter();

  // Dataset State
  const [leads, setLeads] = useState<HotelLeadItem[]>(INITIAL_CENTRAL_LEADS as any);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [leadTypeFilter, setLeadTypeFilter] = useState<string>("ALL");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");
  const [executiveFilter, setExecutiveFilter] = useState<string>("ALL");

  // Drawer & Modal States
  const [viewingLead, setViewingLead] = useState<HotelLeadItem | null>(null);
  const [editingLead, setEditingLead] = useState<HotelLeadItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Drawer Tab State: OVERVIEW | TIMELINE | OPPORTUNITY | BOOKING | NOTES
  const [activeDrawerTab, setActiveDrawerTab] = useState<"OVERVIEW" | "TIMELINE" | "OPPORTUNITY" | "BOOKING" | "NOTES">("OVERVIEW");

  // Add Activity Modal State inside Drawer
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false);
  const [actTypeInput, setActTypeInput] = useState<ActivityTimelineItem["type"]>("Phone Call");
  const [actDateInput, setActDateInput] = useState("2026-08-28");
  const [actTimeInput, setActTimeInput] = useState("03:00 PM");
  const [actNotesInput, setActNotesInput] = useState("");
  const [actVenueInput, setActVenueInput] = useState("");
  const [actNextFollowupInput, setActNextFollowupInput] = useState("2026-08-29");

  // Quick Note Input State in Notes Tab
  const [newNoteInput, setNewNoteInput] = useState("");

  // CSV Import Modal State
  const [importStep, setImportStep] = useState<"UPLOAD" | "PREVIEW_MAP" | "SUMMARY">("UPLOAD");
  const [importFileName, setImportFileName] = useState("");
  const [csvSourcePlatform, setCsvSourcePlatform] = useState<LeadSource>("Direct Inquiry");
  const [csvFieldMapping, setCsvFieldMapping] = useState({ fullName: "Full Name", phone: "Phone Number", email: "Email", company: "Company Name", budget: "Budget" });
  const [templateSaved, setTemplateSaved] = useState(false);

  // ─────────────────────────────────────────────────────────────
  // 1. FAST CREATE LEAD FORM STATE (BASIC INFO ONLY — SECTION 1)
  // ─────────────────────────────────────────────────────────────
  const [createLeadName, setCreateLeadName] = useState("");
  const [createMobile, setCreateMobile] = useState("");
  const [createCompanyName, setCreateCompanyName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createLeadType, setCreateLeadType] = useState<LeadType>("Wedding");
  const [createLeadSource, setCreateLeadSource] = useState<LeadSource>("Direct Inquiry");
  const [createRevenue, setCreateRevenue] = useState("");
  const [createRequirement, setCreateRequirement] = useState("");

  // Reset Fast Create Form
  const resetCreateForm = () => {
    setCreateLeadName("");
    setCreateMobile("");
    setCreateCompanyName("");
    setCreateEmail("");
    setCreateLeadType("Wedding");
    setCreateLeadSource("Direct Inquiry");
    setCreateRevenue("");
    setCreateRequirement("");
  };

  // ─────────────────────────────────────────────────────────────
  // 2. EDIT LEAD FORM STATE (PROGRESSIVE INFORMATION — SECTION 3)
  // ─────────────────────────────────────────────────────────────
  const [editName, setEditName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editContactMethod, setEditContactMethod] = useState<"Phone" | "WhatsApp" | "Email">("Phone");

  const [editLeadType, setEditLeadType] = useState<LeadType>("Wedding");
  const [editEventDate, setEditEventDate] = useState("");
  const [editGuestCount, setEditGuestCount] = useState("");
  const [editRoomNights, setEditRoomNights] = useState("");
  const [editRevenue, setEditRevenue] = useState("");
  const [editPriority, setEditPriority] = useState<LeadPriority>("High");

  const [editRequirement, setEditRequirement] = useState("");
  const [editVenuePref, setEditVenuePref] = useState("");
  const [editMealReq, setEditMealReq] = useState("");
  const [editRoomReq, setEditRoomReq] = useState("");
  const [editSpecialReq, setEditSpecialReq] = useState("");

  const [editLeadSource, setEditLeadSource] = useState<LeadSource>("Direct Inquiry");
  const [editCampaignName, setEditCampaignName] = useState("");
  const [editCampaignId, setEditCampaignId] = useState("");
  const [editPromoCode, setEditPromoCode] = useState("");
  const [editRateTariff, setEditRateTariff] = useState("Standard Tariff");

  // Populate Edit Modal Form State
  const openEditModal = (lead: HotelLeadItem) => {
    setEditingLead(lead);
    setEditName(lead.leadName);
    setEditMobile(lead.mobile);
    setEditEmail(lead.email || "");
    setEditCompanyName(lead.companyName || "");
    setEditContactMethod(lead.preferredContactMethod || "Phone");

    setEditLeadType(lead.leadType);
    setEditEventDate(lead.expectedEventDate || "");
    setEditGuestCount(lead.guestCount ? String(lead.guestCount) : "");
    setEditRoomNights(lead.expectedRoomNights ? String(lead.expectedRoomNights) : "");
    setEditRevenue(lead.rawRevenue ? String(lead.rawRevenue) : "");
    setEditPriority(lead.priority);

    setEditRequirement(lead.customerRequirement);
    setEditVenuePref(lead.venuePreference || "");
    setEditMealReq(lead.mealRequirement || "");
    setEditRoomReq(lead.roomRequirement || "");
    setEditSpecialReq(lead.specialRequirements || "");

    setEditLeadSource(lead.leadSource);
    setEditCampaignName(lead.campaignName || "");
    setEditCampaignId(lead.campaignId || "");
    setEditPromoCode(lead.promotionCode || "");
    setEditRateTariff(lead.rateTariff || "Standard Tariff");
  };

  // Metrics Computation
  const metrics = useMemo(() => {
    const totalLeads = leads.length;
    const newLeads = leads.filter((l) => l.status === "New").length;
    const contactedLeads = leads.filter((l) => l.status === "Contacted").length;
    const inPipelineLeads = leads.filter((l) => l.status === "In Pipeline").length;
    const wonLeads = leads.filter((l) => l.status === "Won").length;
    const totalPotentialRev = leads.reduce((acc, curr) => acc + (curr.rawRevenue || 0), 0);

    return {
      totalLeads,
      newLeads,
      contactedLeads,
      inPipelineLeads,
      wonLeads,
      totalPotentialRev,
    };
  }, [leads]);

  // Filtered Leads Dataset
  const filteredLeads = useMemo(() => {
    return leads.filter((item) => {
      const matchSearch =
        item.leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.companyName && item.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.mobile.includes(searchQuery) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.campaignName && item.campaignName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = statusFilter === "ALL" || item.status === statusFilter;
      const matchType = leadTypeFilter === "ALL" || item.leadType === leadTypeFilter;
      const matchSource = sourceFilter === "ALL" || item.leadSource === sourceFilter;
      const matchExec = executiveFilter === "ALL" || item.assignedExecutive === executiveFilter;

      return matchSearch && matchStatus && matchType && matchSource && matchExec;
    });
  }, [leads, searchQuery, statusFilter, leadTypeFilter, sourceFilter, executiveFilter]);

  // Submit Fast Create Form (Basic Info Only)
  const handleFastCreateLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createLeadName.trim() || !createMobile.trim()) {
      setToastMessage("⚠️ Lead Name and Mobile Number are required!");
      return;
    }

    const numRevenue = Number(createRevenue) || 0;
    const formattedRev = numRevenue > 0 ? `₹${numRevenue.toLocaleString("en-IN")}` : "₹0";

    const newLead: HotelLeadItem = {
      id: `LD-${Math.floor(500 + Math.random() * 500)}`,
      leadName: createLeadName.trim(),
      companyName: createCompanyName.trim() || undefined,
      mobile: createMobile.trim(),
      email: createEmail.trim() || undefined,
      preferredContactMethod: "Phone",
      leadType: createLeadType,
      leadSource: createLeadSource,
      expectedRevenue: formattedRev,
      rawRevenue: numRevenue,
      assignedExecutive: "Jay Kumar",
      priority: "High",
      status: "New", // Default Status = New
      pipelineStage: "Qualification",
      customerRequirement: createRequirement.trim() || "Inquiry recorded.",
      createdDate: "26 Aug 2026",
      campaignId: null,
      campaignName: null,
      rateTariff: "Standard Tariff",
      activityTimeline: [
        { action: "Lead Record Created", user: "Jay Kumar", date: "26 Aug 2026, Just now", note: "Created via Fast Capture Form" },
      ],
    };

    setLeads((prev) => [newLead, ...prev]);
    setToastMessage(`✓ Lead "${newLead.leadName}" created! Status automatically set to "New".`);
    setIsCreateModalOpen(false);
    resetCreateForm();
  };

  // Submit Edit Lead Form (Progressive Information Save)
  const handleEditLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;

    const numRevenue = Number(editRevenue) || 0;
    const formattedRev = numRevenue > 0 ? `₹${numRevenue.toLocaleString("en-IN")}` : "₹0";

    const updated: HotelLeadItem = {
      ...editingLead,
      leadName: editName.trim(),
      mobile: editMobile.trim(),
      email: editEmail.trim() || undefined,
      companyName: editCompanyName.trim() || undefined,
      preferredContactMethod: editContactMethod,

      leadType: editLeadType,
      expectedEventDate: editEventDate.trim() || undefined,
      guestCount: Number(editGuestCount) || undefined,
      expectedRoomNights: Number(editRoomNights) || undefined,
      expectedRevenue: formattedRev,
      rawRevenue: numRevenue,
      priority: editPriority,

      customerRequirement: editRequirement.trim(),
      venuePreference: editVenuePref.trim() || undefined,
      mealRequirement: editMealReq.trim() || undefined,
      roomRequirement: editRoomReq.trim() || undefined,
      specialRequirements: editSpecialReq.trim() || undefined,

      leadSource: editLeadSource,
      campaignName: editCampaignName.trim() || undefined,
      campaignId: editCampaignId.trim() || undefined,
      promotionCode: editPromoCode.trim() || undefined,
      rateTariff: editRateTariff.trim() || "Standard Tariff",

      activityTimeline: [
        { action: "Lead Details Updated", user: editingLead.assignedExecutive, date: "26 Aug 2026, Just now", note: "Updated progressive sales requirements via Edit Lead." },
        ...(editingLead.activityTimeline || []),
      ],
    };

    setLeads((prev) => prev.map((l) => (l.id === editingLead.id ? updated : l)));
    setViewingLead(updated);
    setEditingLead(null);
    setToastMessage(`✓ Progressive information updated for "${updated.leadName}"!`);
  };

  // Contextual Status Actions
  const handleMarkContacted = (lead: HotelLeadItem) => {
    const updated: HotelLeadItem = {
      ...lead,
      status: "Contacted",
      activityTimeline: [
        { action: "Customer Contacted", user: lead.assignedExecutive, date: "26 Aug 2026, Just now", note: "Sales representative logged initial contact." },
        ...(lead.activityTimeline || []),
      ],
    };
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? updated : l)));
    setViewingLead(updated);
    setToastMessage(`✓ Lead marked as "Contacted"!`);
  };

  const handleMoveToPipeline = (lead: HotelLeadItem) => {
    const updated: HotelLeadItem = {
      ...lead,
      status: "In Pipeline",
      pipelineStage: "Qualification",
      opportunityId: lead.opportunityId || `OPP-${Math.floor(300 + Math.random() * 500)}`,
      activityTimeline: [
        { action: "Moved To Pipeline", user: lead.assignedExecutive, date: "26 Aug 2026, Just now", note: "Qualified lead moved to Deals & Sales Pipeline." },
        ...(lead.activityTimeline || []),
      ],
    };
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? updated : l)));
    setViewingLead(updated);
    setToastMessage(`🚀 Lead moved to Deals & Pipeline! Status changed to "In Pipeline".`);
  };

  const handleReopenLead = (lead: HotelLeadItem) => {
    const updated: HotelLeadItem = {
      ...lead,
      status: "New",
      pipelineStage: "Qualification",
      activityTimeline: [
        { action: "Lead Reopened", user: lead.assignedExecutive, date: "26 Aug 2026, Just now", note: "Reopened from Lost status." },
        ...(lead.activityTimeline || []),
      ],
    };
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? updated : l)));
    setViewingLead(updated);
    setToastMessage(`✓ Lead reopened! Status reset to "New".`);
  };

  // Add Activity Submit from Modal inside Drawer
  const handleSaveActivityModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingLead || !actNotesInput.trim()) return;

    const newActivity: ActivityTimelineItem = {
      type: actTypeInput,
      action: `${actTypeInput}: ${actNotesInput.trim()}`,
      user: viewingLead.assignedExecutive,
      date: `${actDateInput}, ${actTimeInput}`,
      note: actNotesInput.trim(),
      status: "Completed",
      venue: actVenueInput.trim() || undefined,
      nextFollowupDate: actNextFollowupInput || undefined,
    };

    const updated: HotelLeadItem = {
      ...viewingLead,
      activityTimeline: [newActivity, ...(viewingLead.activityTimeline || [])],
    };

    setLeads((prev) => prev.map((l) => (l.id === viewingLead.id ? updated : l)));
    setViewingLead(updated);
    setIsAddActivityModalOpen(false);
    setActNotesInput("");
    setActVenueInput("");
    setToastMessage(`✓ ${actTypeInput} logged for "${viewingLead.leadName}"!`);
  };

  // Add Internal Note in Notes Tab
  const handleAddInternalNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingLead || !newNoteInput.trim()) return;

    const newNote: InternalNoteItem = {
      id: `NOTE-${Date.now()}`,
      text: newNoteInput.trim(),
      user: viewingLead.assignedExecutive,
      date: "26 Aug 2026, Just now",
    };

    const updated: HotelLeadItem = {
      ...viewingLead,
      internalNotes: [newNote, ...(viewingLead.internalNotes || [])],
    };

    setLeads((prev) => prev.map((l) => (l.id === viewingLead.id ? updated : l)));
    setViewingLead(updated);
    setNewNoteInput("");
    setToastMessage(`✓ Internal note added.`);
  };

  // Route to Booking Module on Won Lead
  const handleCreateBookingRoute = (lead: HotelLeadItem) => {
    if (lead.leadType === "Room Booking") {
      router.push(`/front-office/reservations?guestName=${encodeURIComponent(lead.leadName)}&mobile=${encodeURIComponent(lead.mobile)}&leadId=${lead.id}`);
    } else if (lead.leadType === "Wedding" || lead.leadType === "Banquet Event" || lead.leadType === "Conference" || lead.leadType === "Corporate Booking") {
      router.push(`/sales-marketing/banquets/bookings-enquiries?eventName=${encodeURIComponent(lead.leadName)}&pax=${lead.guestCount || 300}&revenue=${lead.rawRevenue || 0}&leadId=${lead.id}`);
    } else {
      router.push(`/food-beverages/outlet-billing?customer=${encodeURIComponent(lead.leadName)}`);
    }
  };

  // Confirm Direct CSV Import
  const handleConfirmDirectCsvImport = () => {
    const newLeads: HotelLeadItem[] = DIRECT_CSV_SAMPLE_ROWS.map((row, idx) => {
      const numRevenue = Number(row["Budget"]) || 500000;
      return {
        id: `LD-DIR-${Math.floor(700 + Math.random() * 200)}-${idx}`,
        leadName: row["Full Name"],
        companyName: row["Company Name"] || undefined,
        mobile: row["Phone Number"],
        email: row["Email"],
        preferredContactMethod: "Phone",
        leadType: "Banquet Event",
        leadSource: csvSourcePlatform,
        inquiryDate: "2026-08-26",
        expectedEventDate: row["Event Date"],
        guestCount: Number(row["Guest Count"]) || 150,
        expectedRevenue: `₹${numRevenue.toLocaleString("en-IN")}`,
        rawRevenue: numRevenue,
        assignedExecutive: "Jay Kumar",
        priority: "High",
        status: "New",
        pipelineStage: "Qualification",
        customerRequirement: row["Notes"] || "Direct CSV import inquiry.",
        createdDate: "26 Aug 2026",
        campaignId: null,
        campaignName: null,
        activityTimeline: [
          { action: `Lead Created (CSV Import - ${csvSourcePlatform})`, user: "Jay Kumar", date: "26 Aug 2026, Just now" },
        ],
      };
    });

    setLeads((prev) => [...newLeads, ...prev]);
    setToastMessage(`🚀 Successfully imported ${newLeads.length} leads from ${importFileName || "Direct_Inquiries_Aug2026.csv"} via ${csvSourcePlatform}!`);
    setIsImportModalOpen(false);
    setImportStep("UPLOAD");
    setImportFileName("");
  };

  // Helper for Status Badges Styling
  const getStatusBadgeStyle = (status: LeadStatus) => {
    switch (status) {
      case "New":
        return "bg-slate-100 text-slate-800 border-slate-200";
      case "Contacted":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "Qualified":
        return "bg-indigo-50 text-indigo-800 border-indigo-200";
      case "In Pipeline":
        return "bg-blue-100 text-blue-900 border-blue-200";
      case "Won":
        return "bg-emerald-100 text-emerald-900 border-emerald-200";
      case "Lost":
        return "bg-rose-100 text-rose-900 border-rose-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <ModulePageShell
      eyebrow="Sales & CRM Operations"
      title="Leads & Inquiries"
      description="Central Lead Management System: Fast capture, progressive sales editing, and lead conversion."
      breadcrumbs={[
        { label: "Sales & Marketing", href: "/sales-marketing/dashboard" },
        { label: "Lead & Sales Management" },
        { label: "Leads & Inquiries" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsImportModalOpen(true)}
            className="rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer bg-white"
          >
            <Upload className="h-4 w-4" /> Import CSV
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => {
              resetCreateForm();
              setIsCreateModalOpen(true);
            }}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Create Lead
          </Button>
        </div>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: KPI OVERVIEW CARDS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <HRKPICard
          label="Total Inquiries"
          value={`${metrics.totalLeads}`}
          subtitle="All Central Leads"
          tone="purple"
          icon={<Users className="h-5 w-5" />}
        />
        <HRKPICard
          label="New Inquiries"
          value={`${metrics.newLeads}`}
          subtitle="Awaiting Contact"
          tone="blue"
          icon={<UserPlus className="h-5 w-5" />}
        />
        <HRKPICard
          label="In Pipeline"
          value={`${metrics.inPipelineLeads}`}
          subtitle="Active Opportunities"
          tone="blue"
          icon={<Kanban className="h-5 w-5" />}
        />
        <HRKPICard
          label="Won Leads"
          value={`${metrics.wonLeads}`}
          subtitle="Converted Business"
          tone="emerald"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <HRKPICard
          label="Pipeline Potential"
          value={`₹${(metrics.totalPotentialRev / 100000).toFixed(1)}L`}
          subtitle="Expected Business Value"
          tone="emerald"
          icon={<DollarSign className="h-5 w-5" />}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: SEARCH & FILTERS TOOLBAR
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Lead Name, Company, Mobile, Lead ID, Campaign..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
          >
            <option value="ALL">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="In Pipeline">In Pipeline</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
          </select>

          {/* Lead Type Filter */}
          <select
            value={leadTypeFilter}
            onChange={(e) => setLeadTypeFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
          >
            <option value="ALL">All Lead Types</option>
            <option value="Wedding">Wedding</option>
            <option value="Banquet Event">Banquet Event</option>
            <option value="Corporate Booking">Corporate Booking</option>
            <option value="Conference">Conference</option>
            <option value="Room Booking">Room Booking</option>
            <option value="Restaurant Event">Restaurant Event</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
          >
            <option value="ALL">All Sources</option>
            <option value="Google Ads">Google Ads</option>
            <option value="Meta Ads">Meta Ads</option>
            <option value="Marketing Campaign">Marketing Campaign</option>
            <option value="Walk-In">Walk-In</option>
            <option value="Phone Call">Phone Call</option>
            <option value="Website">Website</option>
            <option value="Direct Inquiry">Direct Inquiry</option>
          </select>

          {/* Executive Filter */}
          <select
            value={executiveFilter}
            onChange={(e) => setExecutiveFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
          >
            <option value="ALL">All Executives</option>
            <option value="Jay Kumar">Jay Kumar</option>
            <option value="Vikram Malhotra">Vikram Malhotra</option>
            <option value="Ananya Roy">Ananya Roy</option>
          </select>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: CENTRAL LEADS TABLE
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 whitespace-nowrap">Lead ID</th>
                <th className="py-3 px-4 whitespace-nowrap">Lead Name</th>
                <th className="py-3 px-4">Contact Person / Company</th>
                <th className="py-3 px-4 whitespace-nowrap">Lead Type</th>
                <th className="py-3 px-4 whitespace-nowrap">Lead Source</th>
                <th className="py-3 px-4 whitespace-nowrap">Campaign</th>
                <th className="py-3 px-4 whitespace-nowrap">Event / Stay Date</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Est. Value</th>
                <th className="py-3 px-4 whitespace-nowrap">Executive</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => {
                      setViewingLead(lead);
                      setActiveDrawerTab("OVERVIEW");
                    }}
                    className="hover:bg-slate-50 transition cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      #{lead.id}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{lead.leadName}</td>
                    <td className="py-3 px-4">
                      <strong className="text-slate-900 block">{lead.mobile}</strong>
                      <span className="text-[10px] text-slate-500 block">{formatValue(lead.companyName, "PROVIDED")}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-bold">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] border border-slate-200">
                        {lead.leadType}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">{lead.leadSource}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {lead.campaignName ? (
                        <span className="text-slate-700 font-bold text-[10px] block truncate max-w-[130px]" title={lead.campaignName}>
                          {lead.campaignName}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[10px]">Direct Inquiry</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {formatValue(lead.expectedEventDate, "PROVIDED")}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900 whitespace-nowrap">
                      {lead.expectedRevenue}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{lead.assignedExecutive}</td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border inline-block",
                          getStatusBadgeStyle(lead.status)
                        )}
                      >
                        {lead.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 text-xs">
                    No leads found matching your search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: REDESIGNED ZOHO-INSPIRED LEAD DETAILS DRAWER
      ───────────────────────────────────────────────────────────── */}
      {viewingLead && (
        <Drawer
          isOpen={Boolean(viewingLead)}
          onClose={() => setViewingLead(null)}
          title={`Lead Record — #${viewingLead.id}`}
        >
          <div className="space-y-4 text-xs p-1">
            {/* 1. HEADER / IDENTITY SECTION */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs text-slate-900 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-extrabold text-slate-900">{viewingLead.leadName}</h2>
                    <span className="font-mono text-slate-500 text-xs font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Lead ID: #{viewingLead.id}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                    <span>Type: <strong className="text-slate-800 font-bold">{viewingLead.leadType}</strong></span>
                    <span>•</span>
                    <span>Source: <strong className="text-slate-800">{viewingLead.leadSource}</strong></span>
                    {viewingLead.campaignName && (
                      <>
                        <span>•</span>
                        <span>Campaign: <strong className="text-slate-900 font-bold">{viewingLead.campaignName}</strong></span>
                      </>
                    )}
                  </div>
                </div>

                {/* Status & Pipeline Badges */}
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Status:</span>
                    <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-black border", getStatusBadgeStyle(viewingLead.status))}>
                      {viewingLead.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Stage: <strong className="text-slate-800">{viewingLead.pipelineStage}</strong>
                  </div>
                </div>
              </div>

              {/* 2. CONTEXTUAL ACTION BUTTONS BAR (ALWAYS INCLUDES [ EDIT LEAD ]) */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-[11px] text-slate-500">
                  Assigned Executive: <strong className="text-slate-900">{viewingLead.assignedExecutive}</strong>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {/* EDIT LEAD BUTTON (ALWAYS AVAILABLE FOR PROGRESSIVE DATA ENTRY) */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(viewingLead)}
                    className="rounded-xl text-xs font-bold px-3.5 py-1.5 bg-white border-slate-300 text-slate-800 hover:bg-slate-50 cursor-pointer shadow-2xs"
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1.5 text-emerald-700" /> Edit Lead
                  </Button>

                  {/* Status: NEW */}
                  {viewingLead.status === "New" && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleMarkContacted(viewingLead)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl px-3.5 py-1.5 cursor-pointer"
                      >
                        <Phone className="h-3.5 w-3.5 mr-1" /> Contact Lead
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleMoveToPipeline(viewingLead)}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl px-4 py-1.5 cursor-pointer"
                      >
                        <ArrowRight className="h-3.5 w-3.5 mr-1" /> Move To Pipeline
                      </Button>
                    </>
                  )}

                  {/* Status: CONTACTED */}
                  {viewingLead.status === "Contacted" && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          setActTypeInput("Follow-up");
                          setIsAddActivityModalOpen(true);
                        }}
                        className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl px-3 py-1.5 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Follow-up
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleMoveToPipeline(viewingLead)}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl px-4 py-1.5 cursor-pointer"
                      >
                        <ArrowRight className="h-3.5 w-3.5 mr-1" /> Move To Pipeline
                      </Button>
                    </>
                  )}

                  {/* Status: QUALIFIED */}
                  {viewingLead.status === "Qualified" && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          setActTypeInput("Site Visit");
                          setIsAddActivityModalOpen(true);
                        }}
                        className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl px-3 py-1.5 cursor-pointer"
                      >
                        <Calendar className="h-3.5 w-3.5 mr-1" /> Add Site Visit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleMoveToPipeline(viewingLead)}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl px-4 py-1.5 cursor-pointer"
                      >
                        <ArrowRight className="h-3.5 w-3.5 mr-1" /> Move To Pipeline
                      </Button>
                    </>
                  )}

                  {/* Status: IN PIPELINE (NEVER SHOW Move To Pipeline) */}
                  {viewingLead.status === "In Pipeline" && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => router.push("/sales-marketing/crm/pipeline")}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl px-3.5 py-1.5 cursor-pointer"
                      >
                        <Kanban className="h-3.5 w-3.5 mr-1" /> View Opportunity
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setIsAddActivityModalOpen(true)}
                        className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl px-3 py-1.5 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Activity
                      </Button>
                    </>
                  )}

                  {/* Status: WON */}
                  {viewingLead.status === "Won" && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleCreateBookingRoute(viewingLead)}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold rounded-xl px-5 py-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Create Booking →
                    </Button>
                  )}

                  {/* Status: LOST */}
                  {viewingLead.status === "Lost" && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleReopenLead(viewingLead)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl px-4 py-1.5 cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reopen Lead
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* 3. QUICK CONTACT & QUICK ACTIONS BAR */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Contact Person:</span>
                  <strong className="text-slate-900 font-bold">{viewingLead.leadName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Company:</span>
                  <strong className="text-slate-900">{formatValue(viewingLead.companyName, "PROVIDED")}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Mobile Number:</span>
                  <strong className="text-slate-900 font-mono">{viewingLead.mobile}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Email:</span>
                  <strong className="text-slate-900 truncate block">{formatValue(viewingLead.email, "AVAILABLE")}</strong>
                </div>
              </div>

              {/* Action Buttons: Call, WhatsApp, Email */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Quick Actions:</span>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${viewingLead.mobile}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setToastMessage(`📞 Dialing ${viewingLead.mobile}...`);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-[11px] font-bold hover:bg-slate-100 flex items-center gap-1 transition"
                  >
                    <Phone className="h-3 w-3 text-emerald-700" /> Call
                  </a>
                  <a
                    href={`https://wa.me/${viewingLead.mobile.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => {
                      e.preventDefault();
                      setToastMessage(`💬 Opening WhatsApp for ${viewingLead.mobile}...`);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-[11px] font-bold hover:bg-slate-100 flex items-center gap-1 transition"
                  >
                    <MessageSquare className="h-3 w-3 text-emerald-700" /> WhatsApp
                  </a>
                  <a
                    href={`mailto:${viewingLead.email || ""}`}
                    onClick={(e) => {
                      if (!viewingLead.email) {
                        e.preventDefault();
                        setToastMessage("⚠️ No email address available for this lead.");
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-[11px] font-bold hover:bg-slate-100 flex items-center gap-1 transition"
                  >
                    <Mail className="h-3 w-3 text-emerald-700" /> Email
                  </a>
                </div>
              </div>
            </div>

            {/* 4. IMMEDIATE NEXT ACTION BANNER */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-slate-900">
              <span className="text-[10px] font-extrabold uppercase tracking-wider block text-slate-500">
                ⚡ Immediate Next Action
              </span>
              <p className="font-bold text-xs">
                {viewingLead.activityTimeline?.[0]?.nextFollowupDate
                  ? `Next Follow-up scheduled for ${viewingLead.activityTimeline[0].nextFollowupDate}`
                  : viewingLead.status === "New"
                  ? "Call customer to verify event requirement & guest count"
                  : viewingLead.status === "Contacted"
                  ? "Send tariff quotation & schedule venue walkthrough"
                  : viewingLead.status === "Qualified"
                  ? "Conduct venue site visit & prepare commercial proposal"
                  : viewingLead.status === "In Pipeline"
                  ? "Negotiate package terms & confirm tentative booking hold"
                  : viewingLead.status === "Won"
                  ? "Click 'Create Booking →' to generate confirmed reservation record"
                  : "Lead Closed Lost"}
              </p>
            </div>

            {/* 5. HORIZONTAL TAB NAVIGATION SYSTEM */}
            <div className="border-b border-slate-200 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveDrawerTab("OVERVIEW")}
                className={cn(
                  "py-2 px-3 text-xs font-bold border-b-2 transition cursor-pointer",
                  activeDrawerTab === "OVERVIEW"
                    ? "border-emerald-700 text-emerald-900"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                )}
              >
                Overview
              </button>

              <button
                type="button"
                onClick={() => setActiveDrawerTab("TIMELINE")}
                className={cn(
                  "py-2 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1",
                  activeDrawerTab === "TIMELINE"
                    ? "border-emerald-700 text-emerald-900"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                )}
              >
                Activity Timeline
                <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-full text-[10px]">
                  {(viewingLead.activityTimeline || []).length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveDrawerTab("OPPORTUNITY")}
                className={cn(
                  "py-2 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1",
                  activeDrawerTab === "OPPORTUNITY"
                    ? "border-emerald-700 text-emerald-900"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                )}
              >
                Opportunity / Deal
              </button>

              <button
                type="button"
                onClick={() => setActiveDrawerTab("BOOKING")}
                className={cn(
                  "py-2 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1",
                  activeDrawerTab === "BOOKING"
                    ? "border-emerald-700 text-emerald-900"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                )}
              >
                Booking
              </button>

              <button
                type="button"
                onClick={() => setActiveDrawerTab("NOTES")}
                className={cn(
                  "py-2 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1",
                  activeDrawerTab === "NOTES"
                    ? "border-emerald-700 text-emerald-900"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                )}
              >
                Notes
                <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-full text-[10px]">
                  {(viewingLead.internalNotes || []).length}
                </span>
              </button>
            </div>

            {/* TAB 1: OVERVIEW */}
            {activeDrawerTab === "OVERVIEW" && (
              <div className="space-y-4">
                {/* SECTION A — CONTACT */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-extrabold text-slate-900 uppercase text-[10px] tracking-wider block border-b border-slate-200 pb-1">
                    SECTION A — Contact Information
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-slate-400 text-[10px] block">Lead Name:</span><strong className="text-slate-900 font-bold">{viewingLead.leadName}</strong></div>
                    <div><span className="text-slate-400 text-[10px] block">Company Name:</span><strong className="text-slate-900">{formatValue(viewingLead.companyName, "PROVIDED")}</strong></div>
                    <div><span className="text-slate-400 text-[10px] block">Mobile Number:</span><strong className="text-slate-900 font-mono">{viewingLead.mobile}</strong></div>
                    <div><span className="text-slate-400 text-[10px] block">Email Address:</span><strong className="text-slate-900">{formatValue(viewingLead.email, "AVAILABLE")}</strong></div>
                    <div><span className="text-slate-400 text-[10px] block">Preferred Contact:</span><strong className="text-slate-900">{viewingLead.preferredContactMethod || "Phone"}</strong></div>
                  </div>
                </div>

                {/* SECTION B — INQUIRY SUMMARY */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-extrabold text-slate-900 uppercase text-[10px] tracking-wider block border-b border-slate-200 pb-1">
                    SECTION B — Inquiry &amp; Commercial Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-slate-400 text-[10px] block">Lead / Inquiry Type:</span><strong className="text-slate-900 font-bold">{viewingLead.leadType}</strong></div>
                    <div><span className="text-slate-400 text-[10px] block">Expected Event / Stay Date:</span><strong className="text-slate-900 font-mono">{formatValue(viewingLead.expectedEventDate, "PROVIDED")}</strong></div>
                    <div><span className="text-slate-400 text-[10px] block">Expected Guest Count (Pax):</span><strong className="text-slate-900 font-mono">{viewingLead.guestCount ? `${viewingLead.guestCount} Pax` : "Not Provided"}</strong></div>
                    <div><span className="text-slate-400 text-[10px] block">Expected Rooms Required:</span><strong className="text-slate-900 font-mono">{viewingLead.expectedRoomNights ? `${viewingLead.expectedRoomNights} Rooms` : "Not Provided"}</strong></div>
                    <div><span className="text-slate-400 text-[10px] block">Expected Revenue:</span><strong className="text-emerald-800 font-mono text-sm font-black">{viewingLead.expectedRevenue}</strong></div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Priority:</span>
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border inline-block", viewingLead.priority === "High" ? "bg-rose-50 text-rose-800 border-rose-200" : "bg-blue-50 text-blue-800 border-blue-200")}>
                        {viewingLead.priority} Priority
                      </span>
                    </div>
                  </div>
                </div>

                {/* SECTION C — REQUIREMENT */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-extrabold text-slate-900 uppercase text-[10px] tracking-wider block border-b border-slate-200 pb-1">
                    SECTION C — Customer Requirement
                  </h4>
                  <p className="text-slate-800 font-medium bg-white p-2.5 rounded-xl border border-slate-200 leading-relaxed text-[11px]">
                    {viewingLead.customerRequirement || "Not Provided"}
                  </p>
                  {(viewingLead.venuePreference || viewingLead.mealRequirement || viewingLead.roomRequirement) && (
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200">
                      <div><span className="text-slate-400 text-[10px] block">Venue Preference:</span><strong className="text-slate-800">{formatValue(viewingLead.venuePreference, "SPECIFIED")}</strong></div>
                      <div><span className="text-slate-400 text-[10px] block">Meal Requirement:</span><strong className="text-slate-800">{formatValue(viewingLead.mealRequirement, "SPECIFIED")}</strong></div>
                      <div><span className="text-slate-400 text-[10px] block">Room Requirement:</span><strong className="text-slate-800">{formatValue(viewingLead.roomRequirement, "SPECIFIED")}</strong></div>
                      <div><span className="text-slate-400 text-[10px] block">Special Requirements:</span><strong className="text-slate-800">{formatValue(viewingLead.specialRequirements, "SPECIFIED")}</strong></div>
                    </div>
                  )}
                </div>

                {/* SECTION D — MARKETING SOURCE & TARIFF (SECTION 6 PROMO VS TARIFF RULE) */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-extrabold text-slate-900 uppercase text-[10px] tracking-wider block border-b border-slate-200 pb-1">
                    SECTION D — Lead Source, Marketing &amp; Tariff Attribution
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-slate-400 text-[10px] block">Lead Source:</span><strong className="text-slate-900 font-bold">{viewingLead.leadSource}</strong></div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Campaign Name:</span>
                      {viewingLead.campaignName ? (
                        <strong className="text-slate-900 font-bold">{viewingLead.campaignName}</strong>
                      ) : (
                        <span className="text-slate-400 italic">Direct Inquiry / Not Linked</span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Campaign ID:</span>
                      <strong className="text-slate-800 font-mono">{formatValue(viewingLead.campaignId, "AVAILABLE")}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Promotion / Promo Code:</span>
                      <strong className="text-emerald-800 font-mono font-bold">{formatPromoCode(viewingLead.promotionCode)}</strong>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 text-[10px] block">Rate / Tariff Applied:</span>
                      <strong className="text-slate-900 font-bold">{viewingLead.rateTariff || "Standard Tariff"}</strong>
                    </div>
                  </div>
                </div>

                {/* SECTION E — HOTEL BUSINESS INFORMATION (TYPE-TAILORED) */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-extrabold text-slate-900 uppercase text-[10px] tracking-wider block border-b border-slate-200 pb-1">
                    SECTION E — Hotel Business Specifications ({viewingLead.leadType})
                  </h4>

                  {/* Wedding / Banquet Specifics */}
                  {(viewingLead.leadType === "Wedding" || viewingLead.leadType === "Banquet Event") && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-slate-400 text-[10px] block">Event Date:</span><strong className="text-slate-900 font-mono">{formatValue(viewingLead.expectedEventDate, "PROVIDED")}</strong></div>
                      <div><span className="text-slate-400 text-[10px] block">Guest Count:</span><strong className="text-slate-900 font-mono">{viewingLead.guestCount ? `${viewingLead.guestCount} Pax` : "Not Provided"}</strong></div>
                      <div><span className="text-slate-400 text-[10px] block">Venue Preference:</span><strong className="text-slate-900">{formatValue(viewingLead.venuePreference || "Grand Ballroom & Royal Lawn", "SPECIFIED")}</strong></div>
                      <div><span className="text-slate-400 text-[10px] block">Rooms Required:</span><strong className="text-slate-900">{viewingLead.expectedRoomNights ? `${viewingLead.expectedRoomNights} Rooms Block` : "Not Provided"}</strong></div>
                      <div><span className="text-slate-400 text-[10px] block">Food Requirement:</span><strong className="text-slate-900">{formatValue(viewingLead.mealRequirement || "Live North & South Indian Buffet", "SPECIFIED")}</strong></div>
                      <div><span className="text-slate-400 text-[10px] block">Event Requirements:</span><strong className="text-slate-900">Stage Decor, DJ &amp; AV Setup</strong></div>
                    </div>
                  )}

                  {/* Room Booking Specifics */}
                  {viewingLead.leadType === "Room Booking" && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-slate-400 text-[10px] block">Arrival Date:</span><strong className="text-slate-900 font-mono">{formatValue(viewingLead.expectedEventDate, "PROVIDED")}</strong></div>
                      <div><span className="text-slate-400 text-[10px] block">Departure Date:</span><strong className="text-slate-900 font-mono">Not Specified</strong></div>
                      <div><span className="text-slate-400 text-[10px] block">Rooms Required:</span><strong className="text-slate-900">{viewingLead.expectedRoomNights ? `${viewingLead.expectedRoomNights} Rooms` : "Not Provided"}</strong></div>
                      <div><span className="text-slate-400 text-[10px] block">Room Type Preference:</span><strong className="text-slate-900">{formatValue(viewingLead.roomRequirement || "Deluxe Suite", "SPECIFIED")}</strong></div>
                      <div><span className="text-slate-400 text-[10px] block">Meal Requirement:</span><strong className="text-slate-900">Not Applicable</strong></div>
                    </div>
                  )}

                  {/* Corporate / Conference Specifics */}
                  {(viewingLead.leadType === "Corporate Booking" || viewingLead.leadType === "Conference") && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-slate-400 text-[10px] block">Company Name:</span><strong className="text-slate-900">{formatValue(viewingLead.companyName, "PROVIDED")}</strong></div>
                      <div><span className="text-slate-400 text-[10px] block">Room Nights Block:</span><strong className="text-slate-900 font-mono">{viewingLead.expectedRoomNights ? `${viewingLead.expectedRoomNights} Room Nights` : "Not Provided"}</strong></div>
                      <div><span className="text-slate-400 text-[10px] block">Meeting Hall:</span><strong className="text-slate-900">{formatValue(viewingLead.venuePreference || "Executive Conference Hall A & B", "SPECIFIED")}</strong></div>
                      <div><span className="text-slate-400 text-[10px] block">Expected Revenue:</span><strong className="text-emerald-800 font-mono font-bold">{viewingLead.expectedRevenue}</strong></div>
                    </div>
                  )}
                </div>

                {/* SECTION F — SALES INFORMATION */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                  <h4 className="font-extrabold text-slate-900 uppercase text-[10px] tracking-wider block border-b border-slate-200 pb-1">
                    SECTION F — Sales Administration
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-slate-400 text-[10px] block">Assigned Executive:</span><strong className="text-slate-900 font-bold">{viewingLead.assignedExecutive}</strong></div>
                    <div><span className="text-slate-400 text-[10px] block">Lead Created Date:</span><strong className="text-slate-900 font-mono">{viewingLead.createdDate}</strong></div>
                    <div><span className="text-slate-400 text-[10px] block">Current Status:</span><strong className="text-slate-900">{viewingLead.status}</strong></div>
                    <div><span className="text-slate-400 text-[10px] block">Pipeline Stage:</span><strong className="text-slate-900">{viewingLead.pipelineStage}</strong></div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ACTIVITY TIMELINE */}
            {activeDrawerTab === "TIMELINE" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800 text-xs">Sales Activity History</span>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setIsAddActivityModalOpen(true)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl px-3 py-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Log Activity
                  </Button>
                </div>

                <div className="space-y-2 text-[11px]">
                  {(viewingLead.activityTimeline || []).length > 0 ? (
                    (viewingLead.activityTimeline || []).map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                        <div className="flex justify-between items-center font-bold text-slate-900">
                          <span className="text-emerald-800 flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {item.action}
                          </span>
                          <span className="text-slate-400 font-mono text-[10px]">{item.date}</span>
                        </div>
                        <div className="text-slate-500 text-[10px]">Logged by: <strong className="text-slate-700">{item.user}</strong></div>
                        {item.note && <p className="text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">{item.note}</p>}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl">
                      No activity history recorded yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: OPPORTUNITY / DEAL */}
            {activeDrawerTab === "OPPORTUNITY" && (
              <div className="space-y-3">
                {viewingLead.status === "In Pipeline" || viewingLead.status === "Won" ? (
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-extrabold text-slate-900 text-xs">Linked Opportunity Record</span>
                      <span className="font-mono text-emerald-800 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs">
                        #{viewingLead.opportunityId || "OPP-301"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-slate-400 text-[10px] block">Deal Value:</span><strong className="text-emerald-900 font-mono text-sm font-black">{viewingLead.expectedRevenue}</strong></div>
                      <div><span className="text-slate-400 text-[10px] block">Current Stage:</span><strong className="text-slate-900 font-bold">{viewingLead.pipelineStage}</strong></div>
                      <div><span className="text-slate-400 text-[10px] block">Assigned Executive:</span><strong className="text-slate-800">{viewingLead.assignedExecutive}</strong></div>
                      <div><span className="text-slate-400 text-[10px] block">Expected Close Date:</span><strong className="text-slate-800 font-mono">15 Sep 2026</strong></div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => router.push("/sales-marketing/crm/pipeline")}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl px-4 py-2 cursor-pointer shadow-xs"
                      >
                        <Kanban className="h-3.5 w-3.5 mr-1" /> View Opportunity in Pipeline →
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <p className="text-slate-600 text-xs font-medium">This lead has not yet entered the sales pipeline.</p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleMoveToPipeline(viewingLead)}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl px-5 py-2 cursor-pointer shadow-xs"
                    >
                      <ArrowRight className="h-4 w-4 mr-1" /> Move To Pipeline Now
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: BOOKING */}
            {activeDrawerTab === "BOOKING" && (
              <div className="space-y-3">
                {viewingLead.status === "Won" ? (
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-extrabold text-slate-900 text-xs">Confirmed Booking Record</span>
                      <span className="font-mono text-emerald-800 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full text-xs">
                        {viewingLead.bookingId || "BKT-2026-081"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-slate-400 text-[10px] block">Booking Type:</span><strong className="text-slate-900 font-bold">{viewingLead.bookingType || "Banquet Event"}</strong></div>
                      <div><span className="text-slate-400 text-[10px] block">Confirmed Revenue:</span><strong className="text-emerald-900 font-mono text-sm font-black">{viewingLead.expectedRevenue}</strong></div>
                      <div><span className="text-slate-400 text-[10px] block">Booking Status:</span><strong className="text-emerald-800 font-bold">Confirmed</strong></div>
                      <div><span className="text-slate-400 text-[10px] block">Event Date:</span><strong className="text-slate-800 font-mono">{formatValue(viewingLead.expectedEventDate, "PROVIDED")}</strong></div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleCreateBookingRoute(viewingLead)}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl px-4 py-2 cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" /> View / Create Booking →
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <p className="text-slate-600 text-xs font-medium">Booking can be created once the deal is marked Won.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: NOTES */}
            {activeDrawerTab === "NOTES" && (
              <div className="space-y-3">
                {/* Quick Add Note Form */}
                <form onSubmit={handleAddInternalNote} className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-800">Add Internal Note:</label>
                  <textarea
                    rows={2}
                    placeholder="Enter internal sales notes (e.g. Customer prefers evening event, requested Jain menu)..."
                    value={newNoteInput}
                    onChange={(e) => setNewNoteInput(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl px-4 py-1 cursor-pointer"
                    >
                      Save Internal Note
                    </Button>
                  </div>
                </form>

                {/* Notes List */}
                <div className="space-y-2 text-[11px]">
                  {(viewingLead.internalNotes || []).length > 0 ? (
                    (viewingLead.internalNotes || []).map((n) => (
                      <div key={n.id} className="p-3 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                        <div className="flex justify-between font-bold text-slate-900">
                          <span className="text-slate-800">{n.user}</span>
                          <span className="text-slate-400 font-mono text-[10px]">{n.date}</span>
                        </div>
                        <p className="text-slate-700 text-xs leading-relaxed">{n.text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl">
                      No internal notes recorded yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Drawer>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 5: ADD ACTIVITY MODAL
      ───────────────────────────────────────────────────────────── */}
      {isAddActivityModalOpen && viewingLead && (
        <Modal
          isOpen={isAddActivityModalOpen}
          onClose={() => setIsAddActivityModalOpen(false)}
          title={`Log Sales Activity — #${viewingLead.id}`}
        >
          <form onSubmit={handleSaveActivityModal} className="space-y-3.5 text-xs p-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Activity Type *</label>
                <select
                  value={actTypeInput}
                  onChange={(e) => setActTypeInput(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold bg-white"
                >
                  <option value="Phone Call">Phone Call</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Site Visit">Site Visit</option>
                  <option value="Email">Email</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Note">Note</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={actDateInput}
                  onChange={(e) => setActDateInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Time</label>
                <input
                  type="text"
                  placeholder="e.g. 03:00 PM"
                  value={actTimeInput}
                  onChange={(e) => setActTimeInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono bg-white"
                />
              </div>

              {actTypeInput === "Site Visit" && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Venue for Visit</label>
                  <input
                    type="text"
                    placeholder="e.g. Grand Ballroom"
                    value={actVenueInput}
                    onChange={(e) => setActVenueInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Activity Notes *</label>
              <textarea
                rows={3}
                required
                placeholder="Enter details of conversation, outcome, or site visit feedback..."
                value={actNotesInput}
                onChange={(e) => setActNotesInput(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddActivityModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs px-4 cursor-pointer"
              >
                Save Activity
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 6: FAST CREATE LEAD MODAL (BASIC INFO ONLY — SECTION 1)
      ───────────────────────────────────────────────────────────── */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Lead / Inquiry (Fast Capture)"
        >
          <form onSubmit={handleFastCreateLeadSubmit} className="space-y-3.5 text-xs p-1">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-[11px]">
              <strong>Fast Lead Capture:</strong> Enter basic lead information now (&lt;1 min). Additional event dates, guest counts, and venue preferences can be added later via <strong>[ Edit Lead ]</strong>.
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Lead Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Raj Sharma / Kapoor Wedding Inquiry"
                value={createLeadName}
                onChange={(e) => setCreateLeadName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900 bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={createMobile}
                  onChange={(e) => setCreateMobile(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-mono font-bold text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Company / Family Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sharma Family / TCS"
                  value={createCompanyName}
                  onChange={(e) => setCreateCompanyName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-900 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. raj@gmail.com"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lead Type *</label>
                <select
                  value={createLeadType}
                  onChange={(e) => setCreateLeadType(e.target.value as LeadType)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900 bg-white"
                >
                  <option value="Wedding">Wedding</option>
                  <option value="Banquet Event">Banquet Event</option>
                  <option value="Corporate Booking">Corporate Booking</option>
                  <option value="Conference">Conference</option>
                  <option value="Room Booking">Room Booking</option>
                  <option value="Restaurant Event">Restaurant Event</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Lead Source *</label>
                <select
                  value={createLeadSource}
                  onChange={(e) => setCreateLeadSource(e.target.value as LeadSource)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900 bg-white"
                >
                  <option value="Direct Inquiry">Direct Inquiry</option>
                  <option value="Walk-In">Walk-In</option>
                  <option value="Phone Call">Phone Call</option>
                  <option value="Website">Website</option>
                  <option value="Google Ads">Google Ads</option>
                  <option value="Meta Ads">Meta Ads</option>
                  <option value="Marketing Campaign">Marketing Campaign</option>
                  <option value="Corporate Reference">Corporate Reference</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Est. Revenue (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 1500000"
                  value={createRevenue}
                  onChange={(e) => setCreateRevenue(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-mono font-bold text-slate-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Customer Requirements *</label>
              <textarea
                rows={3}
                required
                placeholder="Enter initial customer requirement details..."
                value={createRequirement}
                onChange={(e) => setCreateRequirement(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-900 bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs px-5 shadow-xs cursor-pointer"
              >
                Create Lead Record
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 7: EDIT LEAD MODAL (PROGRESSIVE FORM — SECTIONS 2, 3, 4)
      ───────────────────────────────────────────────────────────── */}
      {editingLead && (
        <Modal
          isOpen={Boolean(editingLead)}
          onClose={() => setEditingLead(null)}
          title={`Edit Lead — #${editingLead.id}`}
          maxWidth="lg"
        >
          <form onSubmit={handleEditLeadSubmit} className="space-y-4 text-xs p-1 pb-14 relative">
            {/* SECTION 1: CONTACT INFORMATION */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="font-extrabold text-[10px] text-slate-600 uppercase tracking-wider block border-b border-slate-200 pb-1">
                Contact Information
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lead Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 font-bold bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={editMobile}
                    onChange={(e) => setEditMobile(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 font-mono font-bold bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company / Family Name</label>
                  <input
                    type="text"
                    value={editCompanyName}
                    onChange={(e) => setEditCompanyName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 bg-white text-slate-900"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Preferred Contact Method</label>
                  <select
                    value={editContactMethod}
                    onChange={(e) => setEditContactMethod(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 p-2 bg-white text-slate-900 font-bold"
                  >
                    <option value="Phone">Phone</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Email">Email</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 2: INQUIRY INFORMATION */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="font-extrabold text-[10px] text-slate-600 uppercase tracking-wider block border-b border-slate-200 pb-1">
                Inquiry &amp; Commercial Specifications
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lead Type *</label>
                  <select
                    value={editLeadType}
                    onChange={(e) => setEditLeadType(e.target.value as LeadType)}
                    className="w-full rounded-xl border border-slate-300 p-2 font-bold bg-white text-slate-900"
                  >
                    <option value="Wedding">Wedding</option>
                    <option value="Banquet Event">Banquet Event</option>
                    <option value="Corporate Booking">Corporate Booking</option>
                    <option value="Conference">Conference</option>
                    <option value="Room Booking">Room Booking</option>
                    <option value="Restaurant Event">Restaurant Event</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expected Event / Stay Date</label>
                  <input
                    type="date"
                    value={editEventDate}
                    onChange={(e) => setEditEventDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 bg-white text-slate-900 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expected Guest Count (Pax)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 500"
                    value={editGuestCount}
                    onChange={(e) => setEditGuestCount(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 bg-white text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expected Rooms Required</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 20"
                    value={editRoomNights}
                    onChange={(e) => setEditRoomNights(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 bg-white text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expected Revenue (₹)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 2400000"
                    value={editRevenue}
                    onChange={(e) => setEditRevenue(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 bg-white text-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as LeadPriority)}
                    className="w-full rounded-xl border border-slate-300 p-2 bg-white text-slate-900 font-bold"
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 3: REQUIREMENT INFORMATION */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="font-extrabold text-[10px] text-slate-600 uppercase tracking-wider block border-b border-slate-200 pb-1">
                Detailed Requirement Information
              </span>
              <div className="space-y-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer Requirements *</label>
                  <textarea
                    rows={2}
                    required
                    value={editRequirement}
                    onChange={(e) => setEditRequirement(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 bg-white text-slate-900"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Venue Preference</label>
                    <input
                      type="text"
                      placeholder="e.g. Grand Ballroom & Royal Lawn"
                      value={editVenuePref}
                      onChange={(e) => setEditVenuePref(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2 bg-white text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Meal / Food Requirement</label>
                    <input
                      type="text"
                      placeholder="e.g. Veg + Non-Veg Buffet, Jain counter"
                      value={editMealReq}
                      onChange={(e) => setEditMealReq(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2 bg-white text-slate-900"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Room Requirement Details</label>
                    <input
                      type="text"
                      placeholder="e.g. 20 Deluxe Rooms + 1 Bridal Suite"
                      value={editRoomReq}
                      onChange={(e) => setEditRoomReq(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2 bg-white text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Special Requirements</label>
                    <input
                      type="text"
                      placeholder="e.g. Stage Decor, DJ & AV Setup"
                      value={editSpecialReq}
                      onChange={(e) => setEditSpecialReq(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2 bg-white text-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 4: MARKETING / SOURCE (SECTION 4 CAMPAIGN DATA RULE) */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <span className="font-extrabold text-[10px] text-slate-600 uppercase tracking-wider block">
                  Marketing Source &amp; Promo Attribution
                </span>
                {editingLead.campaignId && (
                  <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                    <Lock className="h-3 w-3 text-slate-400" /> Campaign Attributed (Read-Only)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lead Source *</label>
                  <select
                    value={editLeadSource}
                    disabled={Boolean(editingLead.campaignId)}
                    onChange={(e) => setEditLeadSource(e.target.value as LeadSource)}
                    className={cn(
                      "w-full rounded-xl border border-slate-300 p-2 font-bold text-slate-900",
                      editingLead.campaignId ? "bg-slate-100 cursor-not-allowed text-slate-500" : "bg-white"
                    )}
                  >
                    <option value="Direct Inquiry">Direct Inquiry</option>
                    <option value="Google Ads">Google Ads</option>
                    <option value="Meta Ads">Meta Ads</option>
                    <option value="Marketing Campaign">Marketing Campaign</option>
                    <option value="Walk-In">Walk-In</option>
                    <option value="Phone Call">Phone Call</option>
                    <option value="Website">Website</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Campaign Name</label>
                  <input
                    type="text"
                    disabled={Boolean(editingLead.campaignId)}
                    value={editCampaignName}
                    onChange={(e) => setEditCampaignName(e.target.value)}
                    className={cn(
                      "w-full rounded-xl border border-slate-300 p-2 font-semibold text-slate-900",
                      editingLead.campaignId ? "bg-slate-100 cursor-not-allowed text-slate-500" : "bg-white"
                    )}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Campaign ID</label>
                  <input
                    type="text"
                    disabled={Boolean(editingLead.campaignId)}
                    value={editCampaignId}
                    onChange={(e) => setEditCampaignId(e.target.value)}
                    className={cn(
                      "w-full rounded-xl border border-slate-300 p-2 font-mono text-slate-900",
                      editingLead.campaignId ? "bg-slate-100 cursor-not-allowed text-slate-500" : "bg-white"
                    )}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Promotion / Promo Code</label>
                  <input
                    type="text"
                    placeholder="e.g. WEDDING10"
                    value={editPromoCode}
                    onChange={(e) => setEditPromoCode(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 font-mono text-slate-900 bg-white"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Rate / Tariff Applied</label>
                  <input
                    type="text"
                    placeholder="e.g. Standard Tariff"
                    value={editRateTariff}
                    onChange={(e) => setEditRateTariff(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 font-bold text-slate-900 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* STICKY FOOTER ACTIONS */}
            <div className="sticky bottom-0 bg-white py-2.5 px-1 border-t border-slate-200 flex justify-end gap-2 shrink-0 z-20 shadow-md rounded-b-xl">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingLead(null)}
                className="rounded-xl text-xs font-bold bg-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs px-5 shadow-xs cursor-pointer"
              >
                Save Progressive Information
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 8: NATURAL 3-STEP CSV IMPORT MODAL (ALIGNED WITH CAMPAIGNS)
      ───────────────────────────────────────────────────────────── */}
      {isImportModalOpen && (
        <Modal
          isOpen={isImportModalOpen}
          onClose={() => {
            setIsImportModalOpen(false);
            setImportStep("UPLOAD");
            setImportFileName("");
          }}
          title="Import Leads & Inquiries from CSV File"
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs p-1">
            {/* Workflow Progress Steps Bar */}
            <div className="flex items-center justify-between bg-slate-100 p-2 rounded-xl text-[10px] font-bold text-slate-600">
              <span className={cn("px-2.5 py-1 rounded-lg transition", importStep === "UPLOAD" ? "bg-emerald-700 text-white" : "bg-white text-slate-700 border border-slate-200")}>
                1. Upload CSV
              </span>
              <span>→</span>
              <span className={cn("px-2.5 py-1 rounded-lg transition", importStep === "PREVIEW_MAP" ? "bg-emerald-700 text-white" : "bg-white text-slate-700 border border-slate-200")}>
                2. Map Fields &amp; Preview
              </span>
              <span>→</span>
              <span className={cn("px-2.5 py-1 rounded-lg transition", importStep === "SUMMARY" ? "bg-emerald-700 text-white" : "bg-white text-slate-700 border border-slate-200")}>
                3. Summary &amp; Confirm
              </span>
            </div>

            {/* STEP 1: UPLOAD & PLATFORM SELECTION */}
            {importStep === "UPLOAD" && (
              <div className="space-y-4 text-center py-2">
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 bg-slate-50 flex flex-col items-center justify-center space-y-2">
                  <FileSpreadsheet className="h-10 w-10 text-emerald-700" />
                  <h4 className="font-bold text-slate-900 text-xs">Upload Lead Export File (.csv)</h4>
                  <p className="text-[11px] text-slate-500 max-w-xs">
                    Supports standard CSV files exported from CRM systems, Google Ads, Meta Ads, or website webforms.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setImportFileName("Direct_Inquiries_Aug2026.csv");
                      setImportStep("PREVIEW_MAP");
                    }}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs mt-2 px-4 py-2 cursor-pointer shadow-xs"
                  >
                    <Upload className="h-3.5 w-3.5 mr-1.5" /> Select Direct_Inquiries_Aug2026.csv
                  </Button>
                </div>

                <div className="text-left p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-800 block text-[11px]">Select Source Inquiry Channel / Platform:</span>
                  <div className="flex flex-wrap items-center gap-3">
                    {(["Direct Inquiry", "Google Ads", "Meta Ads", "Website", "Walk-In"] as const).map((plat) => (
                      <label key={plat} className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-800 text-xs">
                        <input
                          type="radio"
                          name="leadSourcePlatform"
                          checked={csvSourcePlatform === plat}
                          onChange={() => setCsvSourcePlatform(plat)}
                          className="accent-emerald-700"
                        />
                        {plat}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: PREVIEW & FIELD MAPPING */}
            {importStep === "PREVIEW_MAP" && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-950">File: {importFileName || "Direct_Inquiries_Aug2026.csv"}</span>
                  <span className="text-[11px] text-emerald-900 font-bold bg-emerald-200 px-2 py-0.5 rounded">
                    Source: {csvSourcePlatform}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 block text-xs">Map CSV Column Fields → PMS Central Lead Fields</span>
                    <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                      ✓ Auto-Mapped 5/5 Columns
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Full Name Column</label>
                      <select
                        value={csvFieldMapping.fullName}
                        onChange={(e) => setCsvFieldMapping({ ...csvFieldMapping, fullName: e.target.value })}
                        className="w-full p-2 rounded-xl border border-slate-200 font-bold text-slate-900 bg-white"
                      >
                        <option value="Full Name">Full Name</option>
                        <option value="Name">Name</option>
                        <option value="Contact Name">Contact Name</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Phone Number Column</label>
                      <select
                        value={csvFieldMapping.phone}
                        onChange={(e) => setCsvFieldMapping({ ...csvFieldMapping, phone: e.target.value })}
                        className="w-full p-2 rounded-xl border border-slate-200 p-2 font-bold text-slate-900 bg-white"
                      >
                        <option value="Phone Number">Phone Number</option>
                        <option value="Mobile">Mobile</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Email Column</label>
                      <select
                        value={csvFieldMapping.email}
                        onChange={(e) => setCsvFieldMapping({ ...csvFieldMapping, email: e.target.value })}
                        className="w-full p-2 rounded-xl border border-slate-200 font-bold text-slate-900 bg-white"
                      >
                        <option value="Email">Email</option>
                        <option value="Email Address">Email Address</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Company Name Column</label>
                      <select
                        value={csvFieldMapping.company}
                        onChange={(e) => setCsvFieldMapping({ ...csvFieldMapping, company: e.target.value })}
                        className="w-full p-2 rounded-xl border border-slate-200 font-bold text-slate-900 bg-white"
                      >
                        <option value="Company Name">Company Name</option>
                        <option value="Company">Company</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-1 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => {
                        setTemplateSaved(true);
                        setToastMessage("✓ Field mapping template saved for future lead CSV imports!");
                      }}
                      className="text-emerald-700 hover:text-emerald-800 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Save className="h-3.5 w-3.5" /> Save Mapping Template
                    </button>
                    {templateSaved && <span className="text-[10px] text-emerald-800 font-bold">✓ Template Saved</span>}
                  </div>
                </div>

                {/* CSV Rows Preview Table */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 block text-[11px]">CSV Sample Data Preview (3 Records)</span>
                  <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden text-[11px]">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                        <tr>
                          <th className="p-2">Name</th>
                          <th className="p-2">Phone</th>
                          <th className="p-2">Budget</th>
                          <th className="p-2">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                        {DIRECT_CSV_SAMPLE_ROWS.map((r, i) => (
                          <tr key={i}>
                            <td className="p-2 font-bold text-slate-900">{r["Full Name"]}</td>
                            <td className="p-2 font-mono">{r["Phone Number"]}</td>
                            <td className="p-2 font-mono">₹{Number(r["Budget"]).toLocaleString("en-IN")}</td>
                            <td className="p-2 text-[10px] truncate max-w-[150px]">{r["Notes"]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setImportStep("UPLOAD")}
                    className="rounded-xl text-xs"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setImportStep("SUMMARY")}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs px-4 cursor-pointer"
                  >
                    Validate &amp; Preview Summary →
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: SUMMARY & CONFIRM */}
            {importStep === "SUMMARY" && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-emerald-950">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                    <span className="font-extrabold text-xs">Import Validation Summary</span>
                    <span className="bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded text-[10px]">
                      Ready for Import
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                    <div className="bg-white p-2 rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-slate-500 block">Total Rows</span>
                      <strong className="text-slate-900 font-mono text-sm font-bold">3 Records</strong>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-slate-500 block">Clean Validation</span>
                      <strong className="text-emerald-800 font-mono text-sm font-bold">3 Clean (100%)</strong>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-slate-500 block">Source Platform</span>
                      <strong className="text-slate-900 text-xs font-bold">{csvSourcePlatform}</strong>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-slate-700 text-xs">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    <span>Auto-Attribution &amp; Default Status Rule:</span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-6">
                    All {DIRECT_CSV_SAMPLE_ROWS.length} imported inquiries will be created as <strong>New Lead</strong> records, assigned to <strong>Jay Kumar</strong>, and tagged with source <strong>"{csvSourcePlatform}"</strong>.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setImportStep("PREVIEW_MAP")}
                    className="rounded-xl text-xs"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleConfirmDirectCsvImport}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl text-xs px-5 shadow-xs cursor-pointer"
                  >
                    Confirm &amp; Import {DIRECT_CSV_SAMPLE_ROWS.length} Leads →
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </ModulePageShell>
  );
}
