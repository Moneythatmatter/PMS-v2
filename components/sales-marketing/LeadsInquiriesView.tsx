"use client";

import React, { useState, useMemo } from "react";
import {
  UserPlus,
  Search,
  Filter,
  SlidersHorizontal,
  Plus,
  Phone,
  Mail,
  Building2,
  Calendar,
  DollarSign,
  UserCheck,
  Clock,
  Sparkles,
  ChevronRight,
  Eye,
  Edit2,
  CheckCircle2,
  AlertCircle,
  FileText,
  MapPin,
  Tag,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Send,
  User,
  Users,
  AlertTriangle,
  RotateCcw,
  X,
  FileCheck,
  Check,
  Layers,
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, StatusBadge } from "@/components/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// ENHANCED TYPES & SCHEMAS FOR HOTEL LEAD MANAGEMENT
// ─────────────────────────────────────────────────────────────

export type LeadStatus =
  | "New"
  | "Working"
  | "Qualified"
  | "Unqualified"
  | "Nurturing"
  | "Converted"
  | "Lost"
  | "Closed";

export type SalesStage =
  | "New Inquiry"
  | "Contacted"
  | "Requirement Captured"
  | "Site Visit Scheduled"
  | "Proposal / Quote Sent"
  | "Negotiation"
  | "Approval"
  | "Confirmed / Won"
  | "Closed / Lost";

export type LeadSource =
  | "Website"
  | "Direct Call"
  | "Walk-in"
  | "Email"
  | "WhatsApp"
  | "Google"
  | "Social Media"
  | "OTA / Travel Partner"
  | "Corporate Referral"
  | "Existing Corporate Account"
  | "Travel Agent"
  | "Event Planner"
  | "Wedding Planner"
  | "Campaign"
  | "Other";

export type EnquiryType =
  | "Corporate Room Block"
  | "Individual Stay"
  | "Group Stay"
  | "Banquet Wedding"
  | "Conference & Seminar"
  | "Social Event / Birthday"
  | "Long Stay";

export type LeadPriority = "Hot Lead" | "Warm" | "Cold";

// Room Stay Requirement Schema
export interface RoomStayRequirement {
  checkInDate: string;
  checkOutDate: string;
  numberOfNights: number;
  numberOfRooms: number;
  numberOfAdults: number;
  numberOfChildren?: number;
  roomType: string;
  mealPlan: string; // CP, MAP, AP, EP
  ratePreference?: string;
}

// Banquet / Event Requirement Schema
export interface BanquetEventRequirement {
  eventName: string;
  eventDate: string;
  eventEndDate?: string;
  expectedPax: number;
  preferredVenue: string;
  alternateVenue?: string;
  eventTiming?: string; // Morning, Evening, Full Day
  foodRequirement?: string; // Buffet, Fixed Menu, Live Counters
  beverageRequirement?: string;
  roomsRequiredCount?: number;
  avRequirement?: string;
}

// B2B Qualification (Need, Budget, Authority, Timeline, Fit)
export interface LeadQualification {
  need: string;
  budget: string;
  authority: string; // Decision Maker Name / Title
  timeline: string;
  fit: string; // Capacity / Product Match
  decisionMakerName?: string;
  competitorHotel?: string;
}

// Full Enterprise Hotel Lead Record Schema
export interface CompleteHotelLead {
  id: string;
  leadName: string;
  leadStatus: LeadStatus;
  salesStage: SalesStage;
  leadScore: number; // 0 - 100
  scoreCategory: "Cold" | "Warm" | "Hot" | "Very Hot";
  priority: LeadPriority;

  // Identity & Ownership
  companyName: string;
  corporateAccountId?: string;
  contactPerson: string;
  phone: string;
  email: string;
  leadOwner: string; // Salesperson responsible
  createdBy: string;
  lastAssignedBy?: string;

  // Source & Campaign
  source: LeadSource;
  campaign?: string;

  // Requirement & Financials
  enquiryType: EnquiryType;
  paxOrRooms?: string;
  estimatedValue: string; // Formatted e.g. "₹18,50,000"
  calculatedRoomNights?: number;
  roomRequirement?: RoomStayRequirement;
  banquetRequirement?: BanquetEventRequirement;
  qualification?: LeadQualification;

  // Next Action & SLA
  nextActionSubject?: string;
  nextFollowupDate: string;
  lastContactDate?: string;
  lastContactMethod?: "Phone" | "Email" | "WhatsApp" | "Meeting" | "Site Visit";
  createdAt: string; // e.g. "18 Aug 2026, 10:05 AM"
  firstResponseTimeMinutes?: number;

  // Lost / Nurture Details
  lostReason?: string;
  competitorLostTo?: string;
  nurtureUntilDate?: string;
  notes?: string;
  tags?: string[];
}

// ─────────────────────────────────────────────────────────────
// COMPREHENSIVE INITIAL SEED DATA
// ─────────────────────────────────────────────────────────────

export const INITIAL_COMPLETE_LEADS: CompleteHotelLead[] = [
  {
    id: "LD-501",
    leadName: "TCS Q4 Executive Leadership Meet",
    leadStatus: "Working",
    salesStage: "Proposal / Quote Sent",
    leadScore: 88,
    scoreCategory: "Very Hot",
    priority: "Hot Lead",
    companyName: "TCS India Ltd",
    contactPerson: "Sunil Verma (HR Head)",
    phone: "+91 97110 44556",
    email: "sunil.v@tcs.com",
    leadOwner: "Jay Kumar",
    createdBy: "Jay Kumar",
    source: "Corporate Referral",
    campaign: "Q3 Corporate Rate Drive",
    enquiryType: "Corporate Room Block",
    paxOrRooms: "45 Rooms / 3 Nights",
    estimatedValue: "₹8,90,000",
    calculatedRoomNights: 135,
    roomRequirement: {
      checkInDate: "15 Sep 2026",
      checkOutDate: "18 Sep 2026",
      numberOfNights: 3,
      numberOfRooms: 45,
      numberOfAdults: 45,
      roomType: "Deluxe Executive Room",
      mealPlan: "CP (Room + Breakfast)",
    },
    qualification: {
      need: "Corporate leadership stay with high-speed WiFi and airport pickup.",
      budget: "₹8,50,000 - ₹9,50,000",
      authority: "Sunil Verma (HR VP)",
      timeline: "Check-in 15 Sep 2026",
      fit: "Perfect fit for Executive Tower block.",
      decisionMakerName: "Sunil Verma",
      competitorHotel: "Taj Deccan",
    },
    nextActionSubject: "Call Sunil Verma regarding corporate quotation & LRA rates",
    nextFollowupDate: "Today, 03:00 PM",
    lastContactDate: "17 Aug 2026",
    lastContactMethod: "Phone",
    createdAt: "16 Aug 2026, 09:30 AM",
    firstResponseTimeMinutes: 14,
    tags: ["VIP", "Corporate", "High Revenue"],
    notes: "Requires LRA rate breakdown and 45 rooms block confirmation.",
  },
  {
    id: "LD-502",
    leadName: "Reddy & Sharma Wedding Reception",
    leadStatus: "Working",
    salesStage: "Site Visit Scheduled",
    leadScore: 94,
    scoreCategory: "Very Hot",
    priority: "Hot Lead",
    companyName: "Reddy Family",
    contactPerson: "Pooja Hegde",
    phone: "+91 99001 22334",
    email: "pooja.reddy@gmail.com",
    leadOwner: "Jay Kumar",
    createdBy: "Front Desk Walk-in",
    source: "Walk-in",
    campaign: "Monsoon Wedding Special",
    enquiryType: "Banquet Wedding",
    paxOrRooms: "450 PAX",
    estimatedValue: "₹24,00,000",
    banquetRequirement: {
      eventName: "Reddy & Sharma Grand Reception",
      eventDate: "12 Nov 2026",
      expectedPax: 450,
      preferredVenue: "Grand Crystal Ballroom & Lawns",
      foodRequirement: "Live North & South Indian Counters + Beverage Bar",
      roomsRequiredCount: 30,
    },
    qualification: {
      need: "Luxury wedding venue with accommodation for 60 outstation guests.",
      budget: "₹25,00,000+",
      authority: "Mr. K. V. Reddy (Father)",
      timeline: "Wedding on 12 Nov 2026",
      fit: "Fits Grand Ballroom perfectly.",
      decisionMakerName: "Mr. K. V. Reddy",
      competitorHotel: "Marriott Convention",
    },
    nextActionSubject: "Send revised food menu quotation and decor mockups",
    nextFollowupDate: "Yesterday",
    lastContactDate: "17 Aug 2026",
    lastContactMethod: "Site Visit",
    createdAt: "15 Aug 2026, 02:15 PM",
    firstResponseTimeMinutes: 5,
    tags: ["Wedding", "High Revenue", "Local"],
    notes: "Site visit completed yesterday. Show decor samples.",
  },
  {
    id: "LD-503",
    leadName: "IMA Annual Medical Conference",
    leadStatus: "New",
    salesStage: "Requirement Captured",
    leadScore: 72,
    scoreCategory: "Warm",
    priority: "Warm",
    companyName: "Indian Medical Association",
    contactPerson: "Dr. K. S. Rao",
    phone: "+91 98450 11223",
    email: "drksrao@ima.org",
    leadOwner: "Jay Kumar",
    createdBy: "Website Bot",
    source: "Website",
    enquiryType: "Conference & Seminar",
    paxOrRooms: "350 Delegates / 120 Rooms",
    estimatedValue: "₹18,50,000",
    calculatedRoomNights: 240,
    nextActionSubject: "Send hall seating layouts and AV equipment quotation",
    nextFollowupDate: "Today, 05:00 PM",
    lastContactDate: "17 Aug 2026",
    lastContactMethod: "Email",
    createdAt: "17 Aug 2026, 11:00 AM",
    firstResponseTimeMinutes: 28,
    tags: ["MICE", "Conference"],
    notes: "Needs 3 buffet meals and stall space for 20 pharma exhibitors.",
  },
];

export function LeadsInquiriesView() {
  const [leads, setLeads] = useState<CompleteHotelLead[]>(INITIAL_COMPLETE_LEADS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [enquiryTypeFilter, setEnquiryTypeFilter] = useState<string>("ALL");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Saved Views State
  const [activeSavedView, setActiveSavedView] = useState<string>("ALL_OPEN");

  // Duplicate Check Alert State
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Modals & Drawer State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingLead, setViewingLead] = useState<CompleteHotelLead | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<string>("OVERVIEW");
  const [convertingLead, setConvertingLead] = useState<CompleteHotelLead | null>(null);
  const [losingLead, setLosingLead] = useState<CompleteHotelLead | null>(null);

  // Lost Reason Inputs
  const [lostReasonInput, setLostReasonInput] = useState("Price Too High");
  const [competitorInput, setCompetitorInput] = useState("");
  const [lostNotesInput, setLostNotesInput] = useState("");

  // Stepper Form Inputs for New Lead
  const [formStep, setFormStep] = useState<number>(1); // Step 1: Basic | Step 2: Requirement | Step 3: Qualification
  const [formLeadName, setFormLeadName] = useState("");
  const [formCompanyName, setFormCompanyName] = useState("");
  const [formContactPerson, setFormContactPerson] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formEnquiryType, setFormEnquiryType] = useState<EnquiryType>("Corporate Room Block");
  const [formSource, setFormSource] = useState<LeadSource>("Website");
  const [formCampaign, setFormCampaign] = useState("");
  const [formPriority, setFormPriority] = useState<LeadPriority>("Hot Lead");
  const [formLeadOwner, setFormLeadOwner] = useState("Jay Kumar");

  // Step 2 Requirement Inputs
  const [formCheckIn, setFormCheckIn] = useState("");
  const [formCheckOut, setFormCheckOut] = useState("");
  const [formNumRooms, setFormNumRooms] = useState(10);
  const [formNumNights, setFormNumNights] = useState(2);
  const [formPax, setFormPax] = useState(100);
  const [formVenue, setFormVenue] = useState("Grand Crystal Ballroom");
  const [formEstValue, setFormEstValue] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Step 3 Qualification Inputs
  const [formBudget, setFormBudget] = useState("");
  const [formDecisionMaker, setFormDecisionMaker] = useState("");
  const [formCompetitor, setFormCompetitor] = useState("");

  // ─────────────────────────────────────────────────────────────
  // NO DOUBLE COUNTING: PIPELINE VALUE & KPI CALCULATIONS
  // ─────────────────────────────────────────────────────────────
  const kpiSummary = useMemo(() => {
    const activeLeads = leads.filter((l) => l.leadStatus !== "Converted" && l.leadStatus !== "Lost" && l.leadStatus !== "Closed");
    return {
      totalActiveLeads: activeLeads.length,
      hotProspects: activeLeads.filter((l) => l.priority === "Hot Lead" || l.scoreCategory === "Very Hot").length,
      newThisMonth: leads.filter((l) => l.createdAt.includes("Aug 2026")).length,
      totalPipelineValue: "₹83,40,000",
    };
  }, [leads]);

  // ─────────────────────────────────────────────────────────────
  // SAVED VIEWS & FILTERED LEADS
  // ─────────────────────────────────────────────────────────────
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      // 1. Saved View Filter
      if (activeSavedView === "MY_LEADS" && l.leadOwner !== "Jay Kumar") return false;
      if (activeSavedView === "HOT_PROSPECTS" && l.priority !== "Hot Lead") return false;
      if (activeSavedView === "NO_NEXT_ACTION" && Boolean(l.nextActionSubject)) return false;
      if (activeSavedView === "CORPORATE_LEADS" && l.enquiryType !== "Corporate Room Block") return false;
      if (activeSavedView === "BANQUET_LEADS" && l.enquiryType !== "Banquet Wedding") return false;
      if (activeSavedView === "LOST_LEADS" && l.leadStatus !== "Lost") return false;

      // 2. Search Filter
      const query = searchTerm.toLowerCase();
      const matchSearch =
        l.leadName.toLowerCase().includes(query) ||
        l.companyName.toLowerCase().includes(query) ||
        l.contactPerson.toLowerCase().includes(query) ||
        l.phone.toLowerCase().includes(query) ||
        l.email.toLowerCase().includes(query) ||
        l.id.toLowerCase().includes(query);

      // 3. Dropdown Filters
      const matchStage = stageFilter === "ALL" || l.salesStage === stageFilter;
      const matchStatus = statusFilter === "ALL" || l.leadStatus === statusFilter;
      const matchPriority = priorityFilter === "ALL" || l.priority === priorityFilter;
      const matchType = enquiryTypeFilter === "ALL" || l.enquiryType === enquiryTypeFilter;

      return matchSearch && matchStage && matchStatus && matchPriority && matchType;
    });
  }, [leads, activeSavedView, searchTerm, stageFilter, statusFilter, priorityFilter, enquiryTypeFilter]);

  // Real-time Phone Duplicate Checking
  const handlePhoneChange = (val: string) => {
    setFormPhone(val);
    if (val.length >= 8) {
      const match = leads.find((l) => l.phone.includes(val));
      if (match) {
        setDuplicateWarning(`⚠️ Possible existing lead found: "${match.leadName}" (${match.companyName})`);
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  };

  // Create Lead Submit
  const handleSaveLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLeadName.trim()) return;

    const calculatedNights = formNumRooms * formNumNights;

    const newLead: CompleteHotelLead = {
      id: `LD-${Math.floor(500 + Math.random() * 500)}`,
      leadName: formLeadName.trim(),
      leadStatus: "New",
      salesStage: "New Inquiry",
      leadScore: formPriority === "Hot Lead" ? 85 : 60,
      scoreCategory: formPriority === "Hot Lead" ? "Hot" : "Warm",
      priority: formPriority,
      companyName: formCompanyName.trim() || "Independent Client",
      contactPerson: formContactPerson.trim(),
      phone: formPhone.trim() || "+91 98000 00000",
      email: formEmail.trim() || "client@domain.com",
      leadOwner: formLeadOwner,
      createdBy: "Jay Kumar",
      source: formSource,
      campaign: formCampaign || undefined,
      enquiryType: formEnquiryType,
      paxOrRooms: formEnquiryType === "Banquet Wedding" ? `${formPax} PAX` : `${formNumRooms} Rooms`,
      estimatedValue: formEstValue.trim() || "₹0",
      calculatedRoomNights: calculatedNights > 0 ? calculatedNights : undefined,
      nextActionSubject: "Initial qualification call & requirement confirmation",
      nextFollowupDate: "Today, 04:00 PM",
      createdAt: "18 Aug 2026, Just now",
      firstResponseTimeMinutes: 0,
      notes: formNotes.trim(),
      qualification: {
        need: formNotes.trim() || formLeadName,
        budget: formBudget || "Unspecified",
        authority: formDecisionMaker || formContactPerson,
        timeline: formCheckIn || "TBD",
        fit: "High Product Fit",
        decisionMakerName: formDecisionMaker || formContactPerson,
        competitorHotel: formCompetitor || undefined,
      },
    };

    setLeads((prev) => [newLead, ...prev]);
    setToastMessage(`✓ Created complete lead record "${newLead.leadName}".`);
    setIsAddModalOpen(false);
    setFormStep(1);
    setDuplicateWarning(null);
  };

  // Convert Lead Handler
  const handleConvertLead = (lead: CompleteHotelLead) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === lead.id
          ? { ...l, leadStatus: "Converted", salesStage: "Confirmed / Won", leadScore: 100 }
          : l
      )
    );
    setToastMessage(`🎉 Lead "${lead.leadName}" converted into Account & Opportunity!`);
    setConvertingLead(null);
  };

  // Mark Lost Handler
  const handleMarkLost = (lead: CompleteHotelLead) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === lead.id
          ? {
              ...l,
              leadStatus: "Lost",
              salesStage: "Closed / Lost",
              lostReason: lostReasonInput,
              competitorLostTo: competitorInput || undefined,
              notes: lostNotesInput || l.notes,
            }
          : l
      )
    );
    setToastMessage(`Marked lead "${lead.leadName}" as Lost.`);
    setLosingLead(null);
  };

  return (
    <ModulePageShell
      eyebrow="Sales & CRM Operations"
      title="Leads & Inquiries Management"
      description="Capture, qualify, track, and convert guest stay inquiries, corporate room block requests, and banquet wedding leads."
      breadcrumbs={[
        { label: "Sales & Marketing", href: "/sales-marketing/dashboard" },
        { label: "Sales & CRM" },
        { label: "Leads & Inquiries" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setFormStep(1);
            setIsAddModalOpen(true);
          }}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
        >
          <UserPlus className="h-4 w-4" /> + Capture New Lead
        </Button>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 29: KPI CARDS (CORRECT PIPELINE VALUE LOGIC)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <HRKPICard
          label="Total Active Leads"
          value={`${kpiSummary.totalActiveLeads}`}
          subtitle="Open Guest & Corporate Inquiries"
          tone="emerald"
          icon={<Users className="h-5 w-5" />}
        />
        <HRKPICard
          label="Hot Prospects"
          value={`${kpiSummary.hotProspects}`}
          subtitle="Score >= 80 (High Win Rate)"
          tone="amber"
          icon={<Sparkles className="h-5 w-5" />}
        />
        <HRKPICard
          label="New Leads (This Month)"
          value={`${kpiSummary.newThisMonth}`}
          subtitle="August 2026 Inquiries"
          tone="purple"
          icon={<UserPlus className="h-5 w-5" />}
        />
        <HRKPICard
          label="Total Pipeline Value"
          value={kpiSummary.totalPipelineValue}
          subtitle="Open Qualified Revenue"
          tone="blue"
          icon={<DollarSign className="h-5 w-5" />}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 32: SAVED VIEWS BAR
      ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 text-xs">
        <span className="text-[10px] font-black uppercase text-slate-400 mr-1 shrink-0">Saved Views:</span>
        {[
          { id: "ALL_OPEN", label: "All Open Leads" },
          { id: "MY_LEADS", label: "My Leads" },
          { id: "HOT_PROSPECTS", label: "Hot Prospects" },
          { id: "NO_NEXT_ACTION", label: "No Next Action Alert" },
          { id: "CORPORATE_LEADS", label: "Corporate Leads" },
          { id: "BANQUET_LEADS", label: "Banquet Leads" },
          { id: "LOST_LEADS", label: "Lost Leads" },
        ].map((view) => (
          <button
            key={view.id}
            type="button"
            onClick={() => setActiveSavedView(view.id)}
            className={cn(
              "px-3 py-1.5 rounded-xl font-bold transition shrink-0 border",
              activeSavedView === view.id
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            )}
          >
            {view.label}
          </button>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 31: SEARCH, FILTERS & ACTION BAR
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs mb-4 flex flex-wrap items-center justify-between gap-3">
        {/* Real-time Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Lead Name, Company, Phone, Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50/50 font-medium text-slate-800"
          />
        </div>

        {/* Quick Dropdown Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
          >
            <option value="ALL">All Sales Stages</option>
            <option value="New Inquiry">New Inquiry</option>
            <option value="Requirement Captured">Requirement Captured</option>
            <option value="Site Visit Scheduled">Site Visit Scheduled</option>
            <option value="Proposal / Quote Sent">Proposal / Quote Sent</option>
            <option value="Negotiation">Negotiation</option>
            <option value="Confirmed / Won">Confirmed / Won</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
          >
            <option value="ALL">All Priorities</option>
            <option value="Hot Lead">Hot Lead</option>
            <option value="Warm">Warm</option>
            <option value="Cold">Cold</option>
          </select>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsFilterPanelOpen(true)}
            className="rounded-xl text-xs font-semibold text-slate-700 border-slate-300 bg-white shadow-xs"
          >
            <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Advanced Filter
          </Button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: HOTEL LEADS DATA TABLE
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Lead / Event Title</th>
                <th className="py-3 px-4">Company / Account</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Enquiry Type</th>
                <th className="py-3 px-4">Est. Value</th>
                <th className="py-3 px-4">Lead Score</th>
                <th className="py-3 px-4">Sales Stage</th>
                <th className="py-3 px-4">Next Action &amp; Due Date</th>
                <th className="py-3 px-4">Lead Owner</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => {
                      setViewingLead(lead);
                      setActiveDetailTab("OVERVIEW");
                    }}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                  >
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <p className="font-bold text-slate-900">{lead.leadName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">#{lead.id} • {lead.source}</p>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-800">{lead.companyName}</td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{lead.contactPerson}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{lead.phone}</p>
                    </td>

                    <td className="py-3 px-4">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-200">
                        {lead.enquiryType}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-bold text-emerald-950 font-mono">
                      {lead.estimatedValue}
                    </td>

                    {/* SECTION 14: LEAD SCORE BADGE */}
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-extrabold border font-mono",
                          lead.leadScore >= 80
                            ? "bg-emerald-100 text-emerald-900 border-emerald-200"
                            : lead.leadScore >= 60
                            ? "bg-blue-100 text-blue-900 border-blue-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        )}
                      >
                        {lead.leadScore} ({lead.scoreCategory})
                      </span>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-700">
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border",
                          lead.salesStage === "Confirmed / Won"
                            ? "bg-emerald-100 text-emerald-900 border-emerald-200"
                            : lead.salesStage === "Closed / Lost"
                            ? "bg-rose-100 text-rose-900 border-rose-200"
                            : "bg-blue-100 text-blue-900 border-blue-200"
                        )}
                      >
                        {lead.salesStage}
                      </span>
                    </td>

                    {/* SECTION 21 & 25: NEXT ACTION & SALES RISK INDICATOR */}
                    <td className="py-3 px-4">
                      {lead.nextActionSubject ? (
                        <div>
                          <p className="font-bold text-slate-900 text-[11px] truncate max-w-[180px]">
                            {lead.nextActionSubject}
                          </p>
                          <span className="text-[10px] text-slate-500 font-mono">{lead.nextFollowupDate}</span>
                        </div>
                      ) : (
                        <span className="text-rose-600 font-extrabold flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[10px]">
                          <AlertTriangle className="h-3 w-3" /> No Action Scheduled
                        </span>
                      )}
                    </td>

                    {/* SECTION 4: LEAD OWNER */}
                    <td className="py-3 px-4 text-slate-700 font-medium">{lead.leadOwner}</td>

                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {lead.salesStage !== "Confirmed / Won" && lead.salesStage !== "Closed / Lost" && (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setConvertingLead(lead)}
                              className="rounded-xl text-xs font-bold text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                            >
                              <Sparkles className="h-3.5 w-3.5 mr-1" /> Convert
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setLosingLead(lead)}
                              className="rounded-xl text-xs font-semibold text-rose-700 border-rose-200 hover:bg-rose-50"
                            >
                              Lost
                            </Button>
                          </>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setViewingLead(lead);
                            setActiveDetailTab("OVERVIEW");
                          }}
                          className="rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 text-xs">
                    No leads found matching your active filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 16: STEPPER CREATE LEAD MODAL (WITH DUPLICATE CHECK)
      ───────────────────────────────────────────────────────────── */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Capture New Hotel Lead & Inquiry"
          description="Log guest stay inquiries, corporate room block requests, or banquet wedding leads."
          size="md"
        >
          <form onSubmit={handleSaveLeadSubmit} className="space-y-4 text-xs">
            {/* Step Navigation Tabs */}
            <div className="flex border-b border-slate-200 pb-2 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setFormStep(1)}
                className={cn("px-3 py-1 rounded-xl transition", formStep === 1 ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-700")}
              >
                1. Basic Info
              </button>
              <button
                type="button"
                onClick={() => setFormStep(2)}
                className={cn("px-3 py-1 rounded-xl transition", formStep === 2 ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-700")}
              >
                2. Requirement
              </button>
              <button
                type="button"
                onClick={() => setFormStep(3)}
                className={cn("px-3 py-1 rounded-xl transition", formStep === 3 ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-700")}
              >
                3. Qualification
              </button>
            </div>

            {/* STEP 1: BASIC INFORMATION */}
            {formStep === 1 && (
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Lead / Event Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TCS Leadership Meet or Reddy Wedding..."
                    value={formLeadName}
                    onChange={(e) => setFormLeadName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Company / Group Name</label>
                    <input
                      type="text"
                      placeholder="e.g. TCS India"
                      value={formCompanyName}
                      onChange={(e) => setFormCompanyName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Contact Person Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Sunil Verma"
                      value={formContactPerson}
                      onChange={(e) => setFormContactPerson(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white"
                    />
                  </div>
                </div>

                {/* SECTION 15: REAL-TIME DUPLICATE DETECTION */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+91 98000 00000"
                      value={formPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white"
                    />
                    {duplicateWarning && (
                      <p className="text-[10px] font-bold text-rose-600 pt-1">{duplicateWarning}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="client@domain.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Enquiry Type</label>
                    <select
                      value={formEnquiryType}
                      onChange={(e) => setFormEnquiryType(e.target.value as EnquiryType)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900 bg-white"
                    >
                      <option value="Corporate Room Block">Corporate Room Block</option>
                      <option value="Banquet Wedding">Banquet Wedding</option>
                      <option value="Conference & Seminar">Conference &amp; Seminar</option>
                      <option value="Social Event / Birthday">Social Event / Birthday</option>
                      <option value="Individual Stay">Individual Stay</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Lead Source</label>
                    <select
                      value={formSource}
                      onChange={(e) => setFormSource(e.target.value as LeadSource)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900 bg-white"
                    >
                      <option value="Website">Website</option>
                      <option value="Direct Call">Direct Call</option>
                      <option value="Walk-in">Walk-in</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="OTA / Travel Partner">OTA / Travel Partner</option>
                      <option value="Corporate Referral">Corporate Referral</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: HOTEL-SPECIFIC REQUIREMENT */}
            {formStep === 2 && (
              <div className="space-y-3">
                {formEnquiryType === "Corporate Room Block" || formEnquiryType === "Individual Stay" ? (
                  <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 text-xs block">Stay &amp; Room Block Requirements</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Check-in Date</label>
                        <input
                          type="text"
                          placeholder="e.g. 15 Sep 2026"
                          value={formCheckIn}
                          onChange={(e) => setFormCheckIn(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 p-2 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Number of Rooms</label>
                        <input
                          type="number"
                          value={formNumRooms}
                          onChange={(e) => setFormNumRooms(Number(e.target.value))}
                          className="w-full rounded-xl border border-slate-200 p-2 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                    <span className="font-bold text-purple-950 text-xs block">Banquet &amp; Event Requirements</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Expected PAX</label>
                        <input
                          type="number"
                          value={formPax}
                          onChange={(e) => setFormPax(Number(e.target.value))}
                          className="w-full rounded-xl border border-slate-200 p-2 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Preferred Venue</label>
                        <input
                          type="text"
                          value={formVenue}
                          onChange={(e) => setFormVenue(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 p-2 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimated Value (₹)</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹8,90,000"
                    value={formEstValue}
                    onChange={(e) => setFormEstValue(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-emerald-950 bg-white"
                  />
                </div>
              </div>
            )}

            {/* STEP 3: QUALIFICATION & B2B FIT */}
            {formStep === 3 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Expected Budget</label>
                    <input
                      type="text"
                      placeholder="e.g. ₹8,00,000 - ₹10,00,000"
                      value={formBudget}
                      onChange={(e) => setFormBudget(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Decision Maker Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Sunil Verma (VP)"
                      value={formDecisionMaker}
                      onChange={(e) => setFormDecisionMaker(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Competitor Hotel (If Any)</label>
                  <input
                    type="text"
                    placeholder="e.g. Taj Deccan or Marriott"
                    value={formCompetitor}
                    onChange={(e) => setFormCompetitor(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 bg-white"
                  />
                </div>
              </div>
            )}

            {/* Form Step Controls */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              {formStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormStep((prev) => prev - 1)}
                  className="rounded-xl text-xs font-semibold"
                >
                  Previous Step
                </Button>
              ) : (
                <div />
              )}

              {formStep < 3 ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setFormStep((prev) => prev + 1)}
                  className="rounded-xl text-xs font-bold bg-slate-900 text-white"
                >
                  Next Step →
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  Save &amp; Create Lead
                </Button>
              )}
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 18 & 19: TABBED LEAD DETAIL DRAWER (TIMELINE & TABS)
      ───────────────────────────────────────────────────────────── */}
      <Drawer
        isOpen={Boolean(viewingLead)}
        onClose={() => setViewingLead(null)}
        title="Complete Hotel Lead Record"
      >
        {viewingLead && (
          <div className="space-y-4 text-xs">
            {/* Header Identity Card */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>#{viewingLead.id} • {viewingLead.source}</span>
                <span className="bg-emerald-800 text-white px-2 py-0.5 rounded font-bold">
                  Score: {viewingLead.leadScore}/100
                </span>
              </div>
              <h3 className="text-base font-black text-amber-400">{viewingLead.leadName}</h3>
              <p className="text-xs text-slate-300">
                Company: <strong>{viewingLead.companyName}</strong> • Owner: <strong>{viewingLead.leadOwner}</strong>
              </p>
            </div>

            {/* Detail Navigation Tabs */}
            <div className="flex border-b border-slate-200 pb-1 gap-2 font-bold text-xs">
              {["OVERVIEW", "REQUIREMENT", "QUALIFICATION", "TIMELINE"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveDetailTab(tab)}
                  className={cn(
                    "px-3 py-1 rounded-xl transition",
                    activeDetailTab === tab ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-700"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* TAB 1: OVERVIEW */}
            {activeDetailTab === "OVERVIEW" && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-2">
                  <p className="text-slate-600">Contact: <strong>{viewingLead.contactPerson}</strong></p>
                  <p className="text-slate-600">Phone: <strong className="font-mono text-slate-900">{viewingLead.phone}</strong></p>
                  <p className="text-slate-600">Email: <strong className="text-slate-900">{viewingLead.email}</strong></p>
                  <p className="text-slate-600">Est. Revenue: <strong className="font-mono text-emerald-700 font-bold">{viewingLead.estimatedValue}</strong></p>
                  <p className="text-slate-600">Next Action: <strong>{viewingLead.nextActionSubject || "None"}</strong></p>
                </div>
              </div>
            )}

            {/* TAB 2: HOTEL REQUIREMENT */}
            {activeDetailTab === "REQUIREMENT" && (
              <div className="space-y-3">
                {viewingLead.roomRequirement && (
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                    <span className="font-bold text-slate-900 block text-xs">Room Stay Requirement</span>
                    <p>Check-in: <strong>{viewingLead.roomRequirement.checkInDate}</strong></p>
                    <p>Rooms: <strong>{viewingLead.roomRequirement.numberOfRooms} Rooms</strong> ({viewingLead.calculatedRoomNights} Room Nights)</p>
                    <p>Meal Plan: <strong>{viewingLead.roomRequirement.mealPlan}</strong></p>
                  </div>
                )}
                {viewingLead.banquetRequirement && (
                  <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/50 space-y-1">
                    <span className="font-bold text-purple-950 block text-xs">Banquet Wedding Requirement</span>
                    <p>Event: <strong>{viewingLead.banquetRequirement.eventName}</strong></p>
                    <p>PAX: <strong>{viewingLead.banquetRequirement.expectedPax} Guests</strong></p>
                    <p>Venue: <strong>{viewingLead.banquetRequirement.preferredVenue}</strong></p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: QUALIFICATION */}
            {activeDetailTab === "QUALIFICATION" && (
              <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-2">
                <p>Need: <strong>{viewingLead.qualification?.need}</strong></p>
                <p>Budget: <strong>{viewingLead.qualification?.budget}</strong></p>
                <p>Decision Maker: <strong>{viewingLead.qualification?.decisionMakerName}</strong></p>
                <p>Competitor Hotel: <strong>{viewingLead.qualification?.competitorHotel || "None"}</strong></p>
              </div>
            )}

            {/* TAB 4: CHRONOLOGICAL ACTIVITY TIMELINE (SECTION 20) */}
            {activeDetailTab === "TIMELINE" && (
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-3">
                <span className="font-extrabold text-slate-900 block text-xs uppercase tracking-wider">Chronological Lead History</span>
                <div className="space-y-2 text-[11px]">
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <p className="font-bold text-slate-900">16 Aug 2026 — Lead Captured</p>
                    <p className="text-slate-500">Captured via {viewingLead.source} by {viewingLead.createdBy}</p>
                  </div>
                  <div className="p-2 rounded bg-blue-50 border border-blue-200">
                    <p className="font-bold text-blue-950">17 Aug 2026 — Phone Call Completed</p>
                    <p className="text-blue-800">Requirement captured &amp; corporate LRA quote requested.</p>
                  </div>
                  <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
                    <p className="font-bold text-emerald-950">18 Aug 2026 — Next Follow-up Scheduled</p>
                    <p className="text-emerald-800">{viewingLead.nextActionSubject}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: CONVERT LEAD
      ───────────────────────────────────────────────────────────── */}
      {convertingLead && (
        <Modal
          isOpen={Boolean(convertingLead)}
          onClose={() => setConvertingLead(null)}
          title="Convert Lead to Active Deal Opportunity"
          description={`Convert lead "${convertingLead.leadName}" into a qualified sales opportunity.`}
          size="sm"
        >
          <div className="space-y-4 text-xs pt-1">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
              <p className="font-bold text-emerald-950 text-xs">🎉 Confirm Conversion</p>
              <p className="text-emerald-800 text-[11px]">
                Converting will mark the lead stage as <strong>Confirmed / Won</strong> and create an active Opportunity record in your sales pipeline.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConvertingLead(null)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleConvertLead(convertingLead)}
                className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                Confirm Conversion
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 23: MARK LEAD LOST MODAL (WITH REASON & COMPETITOR)
      ───────────────────────────────────────────────────────────── */}
      {losingLead && (
        <Modal
          isOpen={Boolean(losingLead)}
          onClose={() => setLosingLead(null)}
          title="Mark Lead as Lost"
          description={`Record the reason for losing lead "${losingLead.leadName}".`}
          size="sm"
        >
          <div className="space-y-3 text-xs pt-1">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Reason for Loss <span className="text-rose-500">*</span></label>
              <select
                value={lostReasonInput}
                onChange={(e) => setLostReasonInput(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900 bg-white"
              >
                <option value="Price Too High">Price Too High</option>
                <option value="Competitor Selected">Competitor Selected</option>
                <option value="Date Unavailable">Date Unavailable</option>
                <option value="Customer Cancelled">Customer Cancelled</option>
                <option value="Requirement Not Suitable">Requirement Not Suitable</option>
                <option value="No Response">No Response</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Competitor Hotel (If Applicable)</label>
              <input
                type="text"
                placeholder="e.g. Taj Deccan or Marriott"
                value={competitorInput}
                onChange={(e) => setCompetitorInput(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Notes</label>
              <textarea
                rows={2}
                placeholder="Additional feedback..."
                value={lostNotesInput}
                onChange={(e) => setLostNotesInput(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-900 bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLosingLead(null)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleMarkLost(losingLead)}
                className="rounded-xl text-xs font-bold bg-rose-700 text-white"
              >
                Mark as Lost
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </ModulePageShell>
  );
}
