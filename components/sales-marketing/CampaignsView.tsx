"use client";

import React, { useState, useMemo } from "react";
import {
  Target,
  Plus,
  Search,
  Calendar,
  DollarSign,
  TrendingUp,
  Tag,
  Users,
  Eye,
  CheckCircle2,
  Filter,
  BarChart3,
  Clock,
  Sparkles,
  Award,
  BookOpen,
  Phone,
  Mail,
  UserCheck,
  Percent,
  Upload,
  FileSpreadsheet,
  Check,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Save,
  Globe,
  Share2,
  X,
} from "lucide-react";
import { INITIAL_PROMOTIONS, HotelPromotion } from "./PromosDiscountsView";
import { CentralLeadItem, INITIAL_CENTRAL_LEADS } from "@/app/data/centralLeadData";
import { LeadType, LeadSource, LeadPriority, LeadStatus } from "./LeadsInquiriesView";
import { ModulePageShell } from "@/components/pms";
import { Button, Card, Drawer, Modal, StatusBadge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { CsvLeadImportModal } from "./shared/CsvLeadImportModal";

// ─────────────────────────────────────────────────────────────
// TYPES & SCHEMAS FOR HOTEL PMS CAMPAIGN V1 ARCHITECTURE
// ─────────────────────────────────────────────────────────────

export type CampaignStatus = "Draft" | "Scheduled" | "Active" | "Paused" | "Completed";

export type CampaignType =
  | "Room Promotion"
  | "Banquet Promotion"
  | "Restaurant Promotion"
  | "Spa Promotion"
  | "Corporate Promotion"
  | "Loyalty Promotion"
  | "Seasonal Promotion";

export type TargetAudience =
  | "All Guests"
  | "Past Guests"
  | "VIP Guests"
  | "Corporate Clients"
  | "Wedding Leads"
  | "Travel Agents";

export type CampaignGoal =
  | "Lead Generation"
  | "Room Bookings"
  | "Banquet Bookings"
  | "Restaurant Sales"
  | "Brand Awareness";

export type ExternalPlatform = "Google Ads" | "Meta Ads" | "Other";

export interface CampaignBooking {
  id: string;
  bookingId: string; // e.g. BKT-2026-081 or RES-99401
  guestName: string;
  promotionUsed: string;
  revenueGenerated: number;
  bookingDate: string;
}

export interface HotelCampaign {
  id: string;
  campaignCode: string; // Internal PMS Campaign ID e.g. CMP-MON-01, CMP-WED-02
  campaignName: string;
  description: string;
  campaignType: CampaignType;
  linkedPromoCode: string; // From Promos & Discounts
  targetAudience: TargetAudience;
  goal: CampaignGoal;
  startDate: string;
  endDate: string;
  budget?: number;
  status: CampaignStatus;

  // External Platform Tracking (Optional)
  externalPlatform?: ExternalPlatform;
  externalCampaignId?: string;
  externalCampaignName?: string;

  // Expected Targets
  expectedLeads?: number;
  expectedBookings?: number;
  expectedRevenue?: number;

  // Tracked Bookings list specific to this campaign
  bookingsList: CampaignBooking[];
}

// ─────────────────────────────────────────────────────────────
// INITIAL SEED CAMPAIGNS DATA (VERSION 1 SPEC)
// ─────────────────────────────────────────────────────────────

export const INITIAL_CAMPAIGNS: HotelCampaign[] = [
  {
    id: "CMP-101",
    campaignCode: "CMP-MON-01",
    campaignName: "Monsoon Weekend Escape 2026",
    description: "Targeting weekend staycationers with 15% room discount on Deluxe & Executive stays.",
    campaignType: "Room Promotion",
    linkedPromoCode: "Monsoon Room Retreat",
    targetAudience: "Past Guests",
    goal: "Room Bookings",
    startDate: "2026-06-01",
    endDate: "2026-09-25",
    budget: 25000,
    status: "Active",
    externalPlatform: "Google Ads",
    externalCampaignId: "GADS-99102",
    externalCampaignName: "Monsoon_Room_Search_IN",
    expectedLeads: 80,
    expectedBookings: 50,
    expectedRevenue: 750000,
    bookingsList: [
      { id: "BK-101", bookingId: "RES-99401", guestName: "Rajesh Verma", promotionUsed: "Monsoon Room Retreat", revenueGenerated: 15000, bookingDate: "2026-08-18" },
    ],
  },
  {
    id: "CMP-102",
    campaignCode: "CMP-WDG-02",
    campaignName: "Grand Wedding Season Early Bird",
    description: "Free bridal suite & complimentary welcome drinks for wedding hall bookings above 300 Pax.",
    campaignType: "Banquet Promotion",
    linkedPromoCode: "WEDDING2026",
    targetAudience: "Wedding Leads",
    goal: "Banquet Bookings",
    startDate: "2026-08-01",
    endDate: "2026-11-30",
    budget: 75000,
    status: "Active",
    externalPlatform: "Meta Ads",
    externalCampaignId: "FB-WDG-5544",
    externalCampaignName: "Wedding_Banquet_FB_Ig_LeadForm",
    expectedLeads: 40,
    expectedBookings: 15,
    expectedRevenue: 9000000,
    bookingsList: [
      { id: "BK-201", bookingId: "BKT-2026-081", guestName: "Sharma Family Wedding", promotionUsed: "WEDDING2026", revenueGenerated: 850000, bookingDate: "2026-08-15" },
    ],
  },
  {
    id: "CMP-103",
    campaignCode: "CMP-CRP-03",
    campaignName: "Corporate Annual Partner Saver",
    description: "Flat ₹1,500 discount for verified corporate accounts on executive stays & conferences.",
    campaignType: "Corporate Promotion",
    linkedPromoCode: "CORP2026",
    targetAudience: "Corporate Clients",
    goal: "Lead Generation",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    budget: 40000,
    status: "Active",
    externalPlatform: "Google Ads",
    externalCampaignId: "987654321",
    externalCampaignName: "Corporate_B2B_Search",
    expectedLeads: 100,
    expectedBookings: 70,
    expectedRevenue: 1500000,
    bookingsList: [
      { id: "BK-301", bookingId: "RES-99422", guestName: "TCS Corporate Guest", promotionUsed: "CORP2026", revenueGenerated: 13500, bookingDate: "2026-08-19" },
    ],
  },
  {
    id: "CMP-104",
    campaignCode: "CMP-DWL-04",
    campaignName: "Diwali Festival Family Special",
    description: "Complimentary lavish buffet breakfast & luxury airport pickup during Diwali week.",
    campaignType: "Seasonal Promotion",
    linkedPromoCode: "Diwali Festival Family Special",
    targetAudience: "All Guests",
    goal: "Room Bookings",
    startDate: "2026-09-01",
    endDate: "2026-10-20",
    budget: 15000,
    status: "Scheduled",
    expectedLeads: 50,
    expectedBookings: 30,
    expectedRevenue: 500000,
    bookingsList: [],
  },
  {
    id: "CMP-105",
    campaignCode: "CMP-LOY-05",
    campaignName: "Gold Member VIP Rebate Campaign",
    description: "Exclusive 20% discount on rooms & venues for Gold & Platinum members.",
    campaignType: "Loyalty Promotion",
    linkedPromoCode: "GOLDLOYALTY",
    targetAudience: "VIP Guests",
    goal: "Room Bookings",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    budget: 20000,
    status: "Active",
    expectedLeads: 50,
    expectedBookings: 30,
    expectedRevenue: 1000000,
    bookingsList: [],
  },
];

/** Dynamic Client-Side CSV Parser */
function parseCsvContent(text: string) {
  const lines = text
    .split(/\r\n|\n|\r/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const parseRow = (rowStr: string) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < rowStr.length; i++) {
      const char = rowStr[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ""));
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ""));
    return result;
  };

  const headers = parseRow(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i]);
    if (values.length === 0) continue;
    const rowObj: Record<string, string> = {};
    headers.forEach((header, index) => {
      rowObj[header] = values[index] || "";
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

// Sample CSV Raw Rows for Import Simulation
const SAMPLE_CSV_ROWS: Record<string, string>[] = [
  { "Ad Lead ID": "GLD-77102", "Full Name": "Amit Kumar", "Phone Number": "+91 98112 33445", "Email": "amit.k@gmail.com", "Company Name": "Kumar Tech Ltd", "Event Date": "2026-11-20", "Guest Count": "300", "Expected Budget": "1200000", "Notes": "Need wedding lawn and 40 rooms" },
  { "Ad Lead ID": "GLD-77103", "Full Name": "Suresh Raina", "Phone Number": "+91 97700 88990", "Email": "suresh.r@sports.in", "Company Name": "SR Sports Academy", "Event Date": "2026-10-15", "Guest Count": "150", "Expected Budget": "650000", "Notes": "Corporate annual awards ceremony" },
  { "Ad Lead ID": "MLD-88204", "Full Name": "Neha Gupta", "Phone Number": "+91 99554 11223", "Email": "neha.gupta@fashion.com", "Company Name": "Gupta Designs", "Event Date": "2026-12-05", "Guest Count": "200", "Expected Budget": "800000", "Notes": "Fashion show and banquet dinner" },
];

export function CampaignsView() {
  const [campaignsList, setCampaignsList] = useState<HotelCampaign[]>(INITIAL_CAMPAIGNS);
  const [centralLeads, setCentralLeads] = useState<CentralLeadItem[]>(INITIAL_CENTRAL_LEADS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Drawer & Modal States
  const [selectedCampaignDetail, setSelectedCampaignDetail] = useState<HotelCampaign | null>(null);
  const [detailTab, setDetailTab] = useState<"overview" | "leads" | "bookings" | "roi">("overview");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Add Lead Actions Dropdown & Modals inside Tracked Leads
  const [isLeadActionMenuOpen, setIsLeadActionMenuOpen] = useState(false);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isImportCsvModalOpen, setIsImportCsvModalOpen] = useState(false);

  // Manual Add Lead Form State (Matching Central V1 Lead Form used in LeadsInquiriesView)
  const [leadForm, setLeadForm] = useState({
    leadName: "",
    companyName: "",
    mobile: "",
    email: "",
    preferredContactMethod: "Phone" as "Phone" | "WhatsApp" | "Email",
    leadType: "Room Booking" as LeadType,
    inquiryDate: "2026-08-26",
    expectedEventDate: "",
    guestCount: "",
    expectedRevenue: "",
    leadSource: "Marketing Campaign" as LeadSource,
    assignedExecutive: "Jay Kumar",
    priority: "Medium" as LeadPriority,
    customerRequirement: "",
    additionalNotes: "",
  });

  const resetLeadForm = () => {
    setLeadForm({
      leadName: "",
      companyName: "",
      mobile: "",
      email: "",
      preferredContactMethod: "Phone",
      leadType: "Room Booking",
      inquiryDate: "2026-08-26",
      expectedEventDate: "",
      guestCount: "",
      expectedRevenue: "",
      leadSource: "Marketing Campaign",
      assignedExecutive: "Jay Kumar",
      priority: "Medium",
      customerRequirement: "",
      additionalNotes: "",
    });
  };



  // New Campaign Form State (Matching exact V1 specification)
  const [newForm, setNewForm] = useState({
    campaignName: "",
    description: "",
    campaignType: "Room Promotion" as CampaignType,
    linkedPromoCode: INITIAL_PROMOTIONS[0]?.name || "Monsoon Room Retreat",
    targetAudience: "Past Guests" as TargetAudience,
    goal: "Room Bookings" as CampaignGoal,
    startDate: "2026-09-01",
    endDate: "2026-10-31",
    budget: 25000,
    expectedLeads: 50,
    expectedBookings: 25,
    expectedRevenue: 350000,
    externalPlatform: "Google Ads" as ExternalPlatform,
    externalCampaignId: "",
    externalCampaignName: "",
    status: "Active" as CampaignStatus,
  });

  // Calculate High Level Metrics for top KPI cards
  const metrics = useMemo(() => {
    const totalCampaigns = campaignsList.length;
    const activeCount = campaignsList.filter((c) => c.status === "Active").length;
    const totalLeads = centralLeads.filter((l) => l.campaignId != null).length;
    
    // Revenue calculated from central leads / bookings
    const totalRevenue = campaignsList.reduce((sum, c) => {
      const cBookingsRev = c.bookingsList.reduce((bSum, b) => bSum + b.revenueGenerated, 0);
      return sum + cBookingsRev;
    }, 0);

    const totalBookings = campaignsList.reduce((sum, c) => sum + c.bookingsList.length, 0);

    return {
      totalCampaigns,
      activeCount,
      totalLeads,
      totalBookings,
      totalRevenue,
    };
  }, [campaignsList, centralLeads]);

  // Filtered Campaign List
  const filteredCampaigns = useMemo(() => {
    return campaignsList.filter((c) => {
      const matchSearch =
        c.campaignName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.campaignCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.linkedPromoCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = selectedTypeFilter === "ALL" || c.campaignType === selectedTypeFilter;
      const matchStatus = selectedStatusFilter === "ALL" || c.status === selectedStatusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [campaignsList, searchTerm, selectedTypeFilter, selectedStatusFilter]);

  // Helper to get tracked leads for a specific campaign
  const getCampaignLeads = (campaignCode: string) => {
    return centralLeads.filter((l) => l.campaignId === campaignCode);
  };

  // Helper to calculate performance metrics for a specific campaign
  const getCampaignMetrics = (campaign: HotelCampaign) => {
    const leads = getCampaignLeads(campaign.campaignCode);
    const totalLeads = leads.length;
    const qualifiedLeads = leads.filter((l) => l.status === "Qualified" || l.status === "In Pipeline" || l.status === "Won").length;
    const bookingsCount = campaign.bookingsList.length;
    
    // Expected Revenue sum from qualified leads
    const expectedRevenue = leads.reduce((sum, l) => sum + (l.rawRevenue || 0), 0);
    
    // Actual Revenue from confirmed bookings
    const actualRevenue = campaign.bookingsList.reduce((sum, b) => sum + b.revenueGenerated, 0);

    return {
      totalLeads,
      qualifiedLeads,
      bookingsCount,
      expectedRevenue,
      actualRevenue,
    };
  };

  // Handle Create Campaign Submission
  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.campaignName.trim()) return;

    // Automatically generate internal PMS Campaign ID e.g. CMP-WED-02
    const typePrefix = newForm.campaignType.substring(0, 3).toUpperCase();
    const countIndex = campaignsList.length + 1;
    const campaignCode = `CMP-${typePrefix}-0${countIndex}`;

    const createdCampaign: HotelCampaign = {
      id: `CMP-${Math.floor(100 + Math.random() * 900)}`,
      campaignCode,
      campaignName: newForm.campaignName,
      description: newForm.description,
      campaignType: newForm.campaignType,
      linkedPromoCode: newForm.linkedPromoCode,
      targetAudience: newForm.targetAudience,
      goal: newForm.goal,
      startDate: newForm.startDate,
      endDate: newForm.endDate,
      budget: Number(newForm.budget) || 0,
      expectedLeads: Number(newForm.expectedLeads) || 0,
      expectedBookings: Number(newForm.expectedBookings) || 0,
      expectedRevenue: Number(newForm.expectedRevenue) || 0,
      externalPlatform: newForm.externalPlatform,
      externalCampaignId: newForm.externalCampaignId || undefined,
      externalCampaignName: newForm.externalCampaignName || undefined,
      status: newForm.status,
      bookingsList: [],
    };

    setCampaignsList((prev) => [createdCampaign, ...prev]);
    setToastMessage(`✓ PMS Campaign "${createdCampaign.campaignName}" (${createdCampaign.campaignCode}) created successfully!`);
    setIsCreateModalOpen(false);
    setNewForm({
      campaignName: "",
      description: "",
      campaignType: "Room Promotion",
      linkedPromoCode: INITIAL_PROMOTIONS[0]?.name || "Monsoon Room Retreat",
      targetAudience: "Past Guests",
      goal: "Room Bookings",
      startDate: "2026-09-01",
      endDate: "2026-10-31",
      budget: 25000,
      expectedLeads: 50,
      expectedBookings: 25,
      expectedRevenue: 350000,
      externalPlatform: "Google Ads",
      externalCampaignId: "",
      externalCampaignName: "",
      status: "Active",
    });
  };

  // Handle Manual Save Lead inside Campaign Drawer
  const handleSaveManualLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaignDetail || !leadForm.leadName.trim() || !leadForm.mobile.trim()) return;

    const numRevenue = Number(leadForm.expectedRevenue) || 0;
    const formattedRevenue = numRevenue > 0 ? `₹${numRevenue.toLocaleString("en-IN")}` : "₹0";

    const newLead: CentralLeadItem = {
      id: `LD-${Math.floor(500 + Math.random() * 500)}`,
      leadName: leadForm.leadName.trim(),
      companyName: leadForm.companyName.trim() || undefined,
      mobile: leadForm.mobile.trim(),
      email: leadForm.email.trim() || undefined,
      preferredContactMethod: leadForm.preferredContactMethod,
      leadType: leadForm.leadType,
      leadSource: leadForm.leadSource,
      inquiryDate: leadForm.inquiryDate || "2026-08-26",
      expectedEventDate: leadForm.expectedEventDate || undefined,
      guestCount: Number(leadForm.guestCount) || undefined,
      expectedRevenue: formattedRevenue,
      rawRevenue: numRevenue,
      assignedExecutive: leadForm.assignedExecutive,
      priority: leadForm.priority,
      status: "New", // Default status = New
      pipelineStage: "Qualification",
      customerRequirement: leadForm.customerRequirement.trim() || "Campaign inquiry",
      additionalNotes: leadForm.additionalNotes.trim() || undefined,
      createdDate: "26 Aug 2026",
      campaignId: selectedCampaignDetail.campaignCode,
      campaignName: selectedCampaignDetail.campaignName,
      externalPlatform: selectedCampaignDetail.externalPlatform,
      externalCampaignId: selectedCampaignDetail.externalCampaignId,
      activityTimeline: [
        { action: "Lead Created (Manual Campaign Entry)", user: leadForm.assignedExecutive, date: "26 Aug 2026, Just now" },
      ],
    };

    // Stored in central Lead dataset (automatically visible in both Leads & Inquiries and Campaign Tracked Leads)
    setCentralLeads((prev) => [newLead, ...prev]);
    setToastMessage(`✓ Lead "${newLead.leadName}" saved in central Leads database & auto-linked to ${selectedCampaignDetail.campaignCode}!`);
    setIsAddLeadModalOpen(false);
    resetLeadForm();
  };



  return (
    <ModulePageShell
      eyebrow="Sales & Marketing Operations"
      title="Marketing Campaigns"
      description="Create internal PMS campaign records, link Promos & Discounts, track leads, bookings, and revenue ROI."
      breadcrumbs={[
        { label: "Sales & Marketing", href: "/sales-marketing/dashboard" },
        { label: "Marketing" },
        { label: "Campaigns" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <Button
          type="button"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-2xs flex items-center gap-1.5 px-3.5 py-1.5 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" /> Create Campaign
        </Button>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: KPI CARDS (FRONT OFFICE & F&B HARMONIZED THEME)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <Card className="p-4 bg-white border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Campaigns</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
            {metrics.totalCampaigns}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            All Internal Schemes
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Campaigns</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
            {metrics.activeCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Currently Running
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Campaign Leads</span>
            <div className="h-8 w-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
            {metrics.totalLeads}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Inbound Inquiries
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Bookings Generated</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
            {metrics.totalBookings}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Confirmed Stays / Events
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Campaign Revenue</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
            ₹{(metrics.totalRevenue / 100000).toFixed(1)}L
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Tracked Actual Revenue
          </div>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: SEARCH & FILTERS BAR
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Campaign Name, PMS Campaign ID, Promo Code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 py-1.5 px-3 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
          >
            <option value="ALL">All Campaign Types</option>
            <option value="Room Promotion">Room Promotion</option>
            <option value="Banquet Promotion">Banquet Promotion</option>
            <option value="Corporate Promotion">Corporate Promotion</option>
            <option value="Restaurant Promotion">Restaurant Promotion</option>
            <option value="Seasonal Promotion">Seasonal Promotion</option>
            <option value="Loyalty Promotion">Loyalty Promotion</option>
          </select>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 py-1.5 px-3 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Draft">Draft</option>
            <option value="Paused">Paused</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Record count tracker */}
      <div className="flex items-center justify-between text-xs text-slate-500 mb-2 px-1">
        <span>
          Showing <strong className="text-slate-800">{filteredCampaigns.length}</strong> of {campaignsList.length} campaigns • Marketing &amp; Promotion Schemes
        </span>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: CAMPAIGNS TABLE (CLEAN PMS FRONT OFFICE / F&B STYLE)
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-[11px] font-semibold tracking-wider text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-left">Campaign &amp; PMS ID</th>
                <th className="py-3 px-4 text-left">Campaign Type</th>
                <th className="py-3 px-4 text-left">Linked Promotion</th>
                <th className="py-3 px-4 text-left">Target Audience</th>
                <th className="py-3 px-4 text-left">Duration</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Leads</th>
                <th className="py-3 px-4 text-center">Bookings</th>
                <th className="py-3 px-4 text-right">Revenue ROI</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredCampaigns.length > 0 ? (
                filteredCampaigns.map((camp) => {
                  const campMetrics = getCampaignMetrics(camp);
                  return (
                    <tr
                      key={camp.id}
                      className="hover:bg-slate-50/70 transition"
                    >
                      {/* Campaign & PMS ID */}
                      <td className="py-3 px-4">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900 text-xs">{camp.campaignName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">#{camp.campaignCode}</span>
                          </div>
                          {camp.externalPlatform && (
                            <span className="text-[11px] text-slate-400 block font-mono mt-0.5">
                              Ext: {camp.externalPlatform} ({camp.externalCampaignId || "N/A"})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Campaign Type */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-medium text-xs">
                        {camp.campaignType}
                      </td>

                      {/* Linked Promotion */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <code className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[11px] border border-slate-200">
                          {camp.linkedPromoCode}
                        </code>
                      </td>

                      {/* Target Audience */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 text-xs">
                        {camp.targetAudience}
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-600">
                        {camp.startDate} to {camp.endDate}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap",
                            camp.status === "Active"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : camp.status === "Scheduled"
                              ? "bg-sky-50 text-sky-800 border-sky-200"
                              : camp.status === "Paused"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              camp.status === "Active"
                                ? "bg-emerald-500"
                                : camp.status === "Scheduled"
                                ? "bg-sky-500"
                                : "bg-slate-400"
                            )}
                          />
                          {camp.status}
                        </span>
                      </td>

                      {/* Tracked Leads Count */}
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700 text-xs">
                        {campMetrics.totalLeads}
                      </td>

                      {/* Tracked Bookings Count */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 text-xs">
                        {campMetrics.bookingsCount}
                      </td>

                      {/* Tracked Revenue */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-xs whitespace-nowrap">
                        ₹{campMetrics.actualRevenue.toLocaleString("en-IN")}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCampaignDetail(camp);
                            setDetailTab("overview");
                          }}
                          className="h-7 px-2.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border-slate-200 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-400" />
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 text-xs">
                    No marketing campaigns found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: CREATE CAMPAIGN FORM MODAL
      ───────────────────────────────────────────────────────────── */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create Internal PMS Campaign Record"
        >
          <form onSubmit={handleCreateCampaign} className="space-y-3.5 text-xs p-1">
            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 space-y-1">
              <span className="font-bold block text-[11px]">📌 Hotel PMS V1 Architecture Notice</span>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Google Ads and Meta Ads remain external advertising platforms. Use this form to create your internal PMS campaign record to track leads, bookings, and ROI.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Campaign Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Grand Wedding Season Early Bird"
                value={newForm.campaignName}
                onChange={(e) => setNewForm({ ...newForm, campaignName: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Campaign Description</label>
              <textarea
                rows={2}
                placeholder="Brief summary of campaign objectives and offer details..."
                value={newForm.description}
                onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2.5 font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Campaign Type *</label>
                <select
                  value={newForm.campaignType}
                  onChange={(e) => setNewForm({ ...newForm, campaignType: e.target.value as CampaignType })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
                >
                  <option value="Room Promotion">Room Promotion</option>
                  <option value="Banquet Promotion">Banquet Promotion</option>
                  <option value="Corporate Promotion">Corporate Promotion</option>
                  <option value="Restaurant Promotion">Restaurant Promotion</option>
                  <option value="Seasonal Promotion">Seasonal Promotion</option>
                  <option value="Loyalty Promotion">Loyalty Promotion</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Linked Promotion *</label>
                <select
                  value={newForm.linkedPromoCode}
                  onChange={(e) => setNewForm({ ...newForm, linkedPromoCode: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
                >
                  {INITIAL_PROMOTIONS.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} ({p.promoCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Audience</label>
                <select
                  value={newForm.targetAudience}
                  onChange={(e) => setNewForm({ ...newForm, targetAudience: e.target.value as TargetAudience })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
                >
                  <option value="Past Guests">Past Guests</option>
                  <option value="VIP Guests">VIP Guests</option>
                  <option value="Corporate Clients">Corporate Clients</option>
                  <option value="Wedding Leads">Wedding Leads</option>
                  <option value="All Guests">All Guests</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Goal</label>
                <select
                  value={newForm.goal}
                  onChange={(e) => setNewForm({ ...newForm, goal: e.target.value as CampaignGoal })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
                >
                  <option value="Lead Generation">Lead Generation</option>
                  <option value="Room Bookings">Room Bookings</option>
                  <option value="Banquet Bookings">Banquet Bookings</option>
                  <option value="Restaurant Sales">Restaurant Sales</option>
                  <option value="Brand Awareness">Brand Awareness</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={newForm.startDate}
                  onChange={(e) => setNewForm({ ...newForm, startDate: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={newForm.endDate}
                  onChange={(e) => setNewForm({ ...newForm, endDate: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Budget (Optional ₹)</label>
                <input
                  type="number"
                  min={0}
                  placeholder="e.g. 50000"
                  value={newForm.budget}
                  onChange={(e) => setNewForm({ ...newForm, budget: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-bold text-slate-900 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={newForm.status}
                  onChange={(e) => setNewForm({ ...newForm, status: e.target.value as CampaignStatus })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Draft">Draft</option>
                  <option value="Paused">Paused</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Optional External Advertising Platform Reference */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 text-[11px] block uppercase tracking-wider">
                External Ad Platform Tracking (Optional)
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">External Platform</label>
                  <select
                    value={newForm.externalPlatform}
                    onChange={(e) => setNewForm({ ...newForm, externalPlatform: e.target.value as ExternalPlatform })}
                    className="w-full rounded-lg border border-slate-200 p-2 font-semibold text-slate-900 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
                  >
                    <option value="Google Ads">Google Ads</option>
                    <option value="Meta Ads">Meta Ads</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">External Campaign ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 123456789"
                    value={newForm.externalCampaignId}
                    onChange={(e) => setNewForm({ ...newForm, externalCampaignId: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2 font-mono text-slate-900 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg text-xs font-semibold px-4 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white px-5 shadow-2xs cursor-pointer"
              >
                Create Campaign
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 5: CAMPAIGN DETAILS DRAWER (4 TABS)
      ───────────────────────────────────────────────────────────── */}
      {selectedCampaignDetail && (
        <Drawer
          isOpen={Boolean(selectedCampaignDetail)}
          onClose={() => setSelectedCampaignDetail(null)}
          title={`Campaign Details - ${selectedCampaignDetail.campaignCode}`}
        >
          <div className="space-y-4 text-xs">
            {/* Header Summary Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-slate-700 text-xs font-bold">
                  #{selectedCampaignDetail.campaignCode}
                </span>
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10px] font-semibold border",
                    selectedCampaignDetail.status === "Active"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  )}
                >
                  {selectedCampaignDetail.status}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{selectedCampaignDetail.campaignName}</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">{selectedCampaignDetail.description}</p>
            </div>

            {/* 4 DRAWER TABS */}
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 overflow-x-auto">
              {[
                { id: "overview", label: "Campaign Info" },
                { id: "leads", label: "Tracked Leads" },
                { id: "bookings", label: "Tracked Bookings" },
                { id: "roi", label: "ROI & Performance" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDetailTab(tab.id as any)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg font-semibold transition text-xs cursor-pointer whitespace-nowrap",
                    detailTab === tab.id
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB 1: CAMPAIGN INFO */}
            {detailTab === "overview" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Campaign Type</span>
                    <strong className="text-slate-900 font-semibold">{selectedCampaignDetail.campaignType}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Linked Promotion</span>
                    <strong className="text-slate-900 font-mono font-semibold">{selectedCampaignDetail.linkedPromoCode}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Target Audience</span>
                    <strong className="text-slate-900 font-semibold">{selectedCampaignDetail.targetAudience}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Duration</span>
                    <strong className="text-slate-900 font-mono text-[11px]">{selectedCampaignDetail.startDate} to {selectedCampaignDetail.endDate}</strong>
                  </div>
                </div>

                {/* External Platform Info */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                    External Ad Platform Link
                  </span>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-medium">External Platform:</span>
                    <strong className="text-slate-900 font-semibold">{selectedCampaignDetail.externalPlatform || "Not Linked"}</strong>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-medium">External Campaign ID:</span>
                    <strong className="text-slate-900 font-mono font-semibold">{selectedCampaignDetail.externalCampaignId || "N/A"}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: TRACKED LEADS (VERSION 1 SPECIFIC WORKFLOW) */}
            {detailTab === "leads" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900 text-xs">
                    Central Tracked Leads ({getCampaignLeads(selectedCampaignDetail.campaignCode).length})
                  </span>

                  {/* Dual Actions Button Dropdown (+ Add Lead) */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsLeadActionMenuOpen(!isLeadActionMenuOpen)}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-3 py-1.5 rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Lead ▾
                    </button>

                    {isLeadActionMenuOpen && (
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl border border-slate-200/80 shadow-lg py-1 z-50 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setIsLeadActionMenuOpen(false);
                            setIsAddLeadModalOpen(true);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 font-medium text-slate-800 flex items-center gap-2 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5 text-slate-700" /> Add Lead Manually
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsLeadActionMenuOpen(false);
                            setIsImportCsvModalOpen(true);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 font-medium text-slate-800 flex items-center gap-2 border-t border-slate-100 cursor-pointer"
                        >
                          <Upload className="h-3.5 w-3.5 text-slate-700" /> Import Leads CSV
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tracked Leads Table */}
                <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/80 text-[10px] font-semibold tracking-wider uppercase text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Lead ID</th>
                          <th className="py-2.5 px-3">Lead Name</th>
                          <th className="py-2.5 px-3">Phone</th>
                          <th className="py-2.5 px-3">Email</th>
                          <th className="py-2.5 px-3">Lead Source</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                          <th className="py-2.5 px-3">Assigned To</th>
                          <th className="py-2.5 px-3 text-center">Created Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {getCampaignLeads(selectedCampaignDetail.campaignCode).length > 0 ? (
                          getCampaignLeads(selectedCampaignDetail.campaignCode).map((lead) => (
                            <tr key={lead.id} className="hover:bg-slate-50/70 transition">
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{lead.id}</td>
                              <td className="py-2.5 px-3 font-semibold text-slate-900">{lead.leadName}</td>
                              <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">{lead.mobile}</td>
                              <td className="py-2.5 px-3 text-slate-600">{lead.email || "—"}</td>
                              <td className="py-2.5 px-3">
                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-200">
                                  {lead.leadSource}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span
                                  className={cn(
                                    "px-2.5 py-0.5 rounded-full text-[10px] font-semibold border inline-block",
                                    lead.status === "Won"
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                      : lead.status === "Qualified" || lead.status === "In Pipeline"
                                      ? "bg-amber-50 text-amber-800 border-amber-200"
                                      : "bg-sky-50 text-sky-800 border-sky-200"
                                  )}
                                >
                                  {lead.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-700">{lead.assignedExecutive}</td>
                              <td className="py-2.5 px-3 text-center font-mono text-slate-500 whitespace-nowrap">{lead.createdDate}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-slate-400">
                              No leads associated with this campaign yet. Click "+ Add Lead" to record or import CSV.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: TRACKED BOOKINGS */}
            {detailTab === "bookings" && (
              <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-[10px] font-semibold tracking-wider uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Booking ID</th>
                      <th className="py-2.5 px-3">Guest / Account Name</th>
                      <th className="py-2.5 px-3">Promotion Used</th>
                      <th className="py-2.5 px-3 text-right">Revenue Generated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedCampaignDetail.bookingsList.length > 0 ? (
                      selectedCampaignDetail.bookingsList.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{b.bookingId}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{b.guestName}</td>
                          <td className="py-2.5 px-3 text-slate-700 font-mono">{b.promotionUsed}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            ₹{b.revenueGenerated.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400">
                          No confirmed bookings linked to this campaign yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 4: ROI & PERFORMANCE REPORTING */}
            {detailTab === "roi" && (
              <div className="space-y-4">
                {(() => {
                  const campMetrics = getCampaignMetrics(selectedCampaignDetail);
                  return (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-center">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                          <span className="text-slate-500 text-[10px] block font-medium">Total Leads</span>
                          <strong className="text-slate-900 font-mono text-base font-bold">{campMetrics.totalLeads}</strong>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                          <span className="text-slate-500 text-[10px] block font-medium">Qualified Leads</span>
                          <strong className="text-slate-900 font-mono text-base font-bold">{campMetrics.qualifiedLeads}</strong>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                          <span className="text-slate-500 text-[10px] block font-medium">Bookings</span>
                          <strong className="text-slate-900 font-mono text-base font-bold">{campMetrics.bookingsCount}</strong>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                          <span className="text-slate-500 text-[10px] block font-medium">Actual Revenue</span>
                          <strong className="text-slate-900 font-mono text-base font-bold">₹{campMetrics.actualRevenue.toLocaleString()}</strong>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600 font-medium">Expected Revenue from Leads:</span>
                          <strong className="text-slate-900 font-bold font-mono">₹{campMetrics.expectedRevenue.toLocaleString()}</strong>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600 font-medium">Lead Conversion Rate:</span>
                          <strong className="text-emerald-700 font-bold font-mono">
                            {campMetrics.totalLeads > 0
                              ? `${((campMetrics.bookingsCount / campMetrics.totalLeads) * 100).toFixed(1)}%`
                              : "0.0%"}
                          </strong>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </Drawer>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 6: ADD LEAD MANUALLY MODAL (READ-ONLY CAMPAIGN PARENT)
      ───────────────────────────────────────────────────────────── */}
      {isAddLeadModalOpen && selectedCampaignDetail && (
        <Modal
          isOpen={isAddLeadModalOpen}
          onClose={() => {
            setIsAddLeadModalOpen(false);
            resetLeadForm();
          }}
          title={`Add Lead Manually - ${selectedCampaignDetail.campaignCode}`}
        >
          <form onSubmit={handleSaveManualLead} className="space-y-3.5 text-xs p-1">
            {/* Auto-populated Read-Only Campaign Association Header */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase block">Associated Campaign (Read-Only)</span>
                <strong className="text-slate-900 font-semibold">{selectedCampaignDetail.campaignName}</strong>
              </div>
              <span className="bg-slate-900 text-white font-mono font-bold text-[11px] px-2.5 py-0.5 rounded-full">
                {selectedCampaignDetail.campaignCode}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lead Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Raj Sharma"
                  value={leadForm.leadName}
                  onChange={(e) => setLeadForm({ ...leadForm, leadName: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. ABC Pvt Ltd"
                  value={leadForm.companyName}
                  onChange={(e) => setLeadForm({ ...leadForm, companyName: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={leadForm.mobile}
                  onChange={(e) => setLeadForm({ ...leadForm, mobile: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-bold text-slate-900 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. raj@abc.com"
                  value={leadForm.email}
                  onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lead Type *</label>
                <select
                  value={leadForm.leadType}
                  onChange={(e) => setLeadForm({ ...leadForm, leadType: e.target.value as LeadType })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
                >
                  <option value="Wedding">Wedding</option>
                  <option value="Banquet Event">Banquet Event</option>
                  <option value="Corporate Booking">Corporate Booking</option>
                  <option value="Conference">Conference</option>
                  <option value="Room Booking">Room Booking</option>
                  <option value="Restaurant Event">Restaurant Event</option>
                  <option value="Travel Group">Travel Group</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lead Source *</label>
                <select
                  value={leadForm.leadSource}
                  onChange={(e) => setLeadForm({ ...leadForm, leadSource: e.target.value as LeadSource })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
                >
                  <option value="Walk-In">Walk-In</option>
                  <option value="Phone Call">Phone Call</option>
                  <option value="Website">Website</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Email">Email</option>
                  <option value="Referral">Referral</option>
                  <option value="Marketing Campaign">Marketing Campaign</option>
                  <option value="Travel Agent">Travel Agent</option>
                  <option value="Corporate Reference">Corporate Reference</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Requirement Details *</label>
              <textarea
                rows={3}
                required
                value={leadForm.customerRequirement}
                onChange={(e) => setLeadForm({ ...leadForm, customerRequirement: e.target.value })}
                placeholder="Enter customer requirement details..."
                className="w-full rounded-lg border border-slate-200 p-2.5 font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAddLeadModalOpen(false);
                  resetLeadForm();
                }}
                className="rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white px-5 shadow-2xs cursor-pointer"
              >
                Save &amp; Auto-Associate Lead
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 7: REUSABLE IMPORT LEADS CSV MODAL
      ───────────────────────────────────────────────────────────── */}
      {selectedCampaignDetail && (
        <CsvLeadImportModal
          isOpen={isImportCsvModalOpen}
          onClose={() => setIsImportCsvModalOpen(false)}
          campaignTitle={selectedCampaignDetail.campaignCode}
          defaultCampaignName={selectedCampaignDetail.campaignName}
          defaultLeadSource={selectedCampaignDetail.externalPlatform === "Meta Ads" ? "Meta Ads" : "Google Ads"}
          existingLeadCount={centralLeads.length}
          onImportLeads={(importedLeads) => {
            const convertedToCentral: CentralLeadItem[] = importedLeads.map((lead, idx) => {
              const rawRevenue = lead.estimatedRevenue || Number((lead.budgetRange || "500000").replace(/[^0-9]/g, "")) || 500000;
              return {
                id: `LD-CSV-${Math.floor(600 + Math.random() * 300)}-${idx + 1}`,
                leadName: lead.leadName,
                contactPerson: lead.contactPerson || lead.leadName,
                companyName: lead.companyName,
                mobileNumber: lead.mobileNumber,
                mobile: lead.mobileNumber,
                email: lead.email,
                preferredContactMethod: "Phone",
                bookingType: (selectedCampaignDetail.campaignType === "Banquet Promotion" ? "Banquet Event" : "Room Booking") as any,
                leadType: selectedCampaignDetail.campaignType === "Banquet Promotion" ? "Wedding" : "Room Booking",
                leadSource: lead.leadSource,
                inquiryDate: "2026-08-28",
                eventDate: lead.eventDate,
                expectedEventDate: lead.eventDate,
                guestCount: lead.guestCount,
                expectedRevenue: lead.budgetRange || `₹${rawRevenue.toLocaleString("en-IN")}`,
                rawRevenue: rawRevenue,
                estimatedRevenue: rawRevenue,
                assignedExecutive: lead.assignedExecutive || "Jay Kumar",
                priority: "High",
                status: "New",
                customerRequirements: lead.customerRequirements || lead.specialRequirements || "Imported from CSV campaign lead generation.",
                specialRequirements: lead.customerRequirements || lead.specialRequirements || "Imported from CSV campaign lead generation.",
                customerRequirement: lead.customerRequirements || lead.specialRequirements || "Imported from CSV campaign lead generation.",
                timeline: [],
                createdDate: "28 Aug 2026",
                campaignId: selectedCampaignDetail.campaignCode,
                campaignName: selectedCampaignDetail.campaignName,
                externalPlatform: lead.leadSource === "Google Ads" ? "Google Ads" : lead.leadSource === "Meta Ads" ? "Meta Ads" : "Other",
                activityTimeline: [
                  { action: `Lead Created (CSV Import - ${lead.leadSource})`, user: "System", date: "28 Aug 2026, Just now" },
                ],
              };
            });

            setCentralLeads((prev) => [...convertedToCentral, ...prev]);
            setToastMessage(`🚀 Successfully imported ${convertedToCentral.length} leads! Auto-associated with ${selectedCampaignDetail.campaignCode}.`);
            setIsImportCsvModalOpen(false);
          }}
        />
      )}
    </ModulePageShell>
  );
}
