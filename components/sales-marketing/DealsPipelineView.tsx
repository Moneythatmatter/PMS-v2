"use client";

import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal } from "@/components/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import { cn } from "@/lib/utils";
import { INITIAL_CENTRAL_LEADS, CentralLeadItem } from "@/app/data/centralLeadData";
import { LeadType, LeadSource } from "./LeadsInquiriesView";

// ─────────────────────────────────────────────────────────────
// 1. HOTEL-SPECIFIC PIPELINE STAGES (8 VERSION 1 STAGES)
// ─────────────────────────────────────────────────────────────

export type HotelDealStage =
  | "Qualification"
  | "Requirement Analysis"
  | "Quotation / Proposal"
  | "Negotiation"
  | "Tentative Booking"
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
    id: "Tentative Booking",
    label: "Tentative Booking",
    probability: "85%",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-800",
    headerBorder: "border-slate-200",
    description: "Venue/Room block temporarily reserved on hold",
  },
  {
    id: "Final Decision",
    label: "Final Decision",
    probability: "90%",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-800",
    headerBorder: "border-slate-200",
    description: "Customer making final approval decision",
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
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-600",
    headerBorder: "border-slate-200",
    description: "Opportunity closed without booking",
  },
];

// ─────────────────────────────────────────────────────────────
// 2. DATA TYPES & SCHEMAS FOR DEAL OPPORTUNITY
// ─────────────────────────────────────────────────────────────

export interface DealActivity {
  id: string;
  type:
    | "Phone Call"
    | "Follow-up"
    | "Meeting"
    | "Site Visit"
    | "Email"
    | "WhatsApp Follow-up"
    | "Proposal Sent"
    | "Negotiation"
    | "Note"
    | "Stage Change";
  date: string;
  time?: string;
  user: string;
  notes: string;
  status?: "Scheduled" | "Completed" | "Cancelled";
  venue?: string;
  contactPerson?: string;
}

export interface HotelDealItem {
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

  // Corporate & Travel Agent Integrations
  corporateClientId?: string | null;
  corporateClientName?: string | null;
  travelAgentId?: string | null;
  travelAgentName?: string | null;
  commissionAgreement?: string | null;
  contractedRate?: string | null;

  // Assignment
  assignedExecutive: string;

  // Next Action & Activities
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

  // Full Activity Timeline
  activities: DealActivity[];
  createdDate: string;
}

// ─────────────────────────────────────────────────────────────
// 3. INITIAL SEED DEALS (LINKED TO CENTRAL LEADS)
// ─────────────────────────────────────────────────────────────

export const INITIAL_HOTEL_DEALS: HotelDealItem[] = [
  {
    id: "OPP-301",
    dealName: "Reddy & Sharma Wedding Reception",
    leadId: "LD-502",
    stage: "Quotation / Proposal",
    status: "Open",
    customerName: "Pooja Reddy",
    companyName: "Reddy Family",
    contactPerson: "Pooja Reddy",
    mobile: "+91 99001 22334",
    email: "pooja.reddy@gmail.com",
    preferredContactMethod: "Phone",
    leadType: "Wedding",
    customerRequirement: "Need Grand Ballroom & Royal Lawn for 450 guests. Live North & South Indian buffet + 30 rooms block.",
    expectedEventDate: "2026-11-12",
    guestCount: 450,
    expectedRoomNights: 30,
    venueRequired: "Grand Ballroom & Royal Lawn",
    requestedServices: ["Live Buffet", "30 Room Block", "Stage Decor", "Bridal Suite"],
    leadSource: "Walk-In",
    campaignName: "Grand Wedding Season Early Bird",
    campaignId: "CMP-WDG-02",
    dealValue: 2400000,
    quotedValue: 2600000,
    expectedRevenue: 2400000,
    discountOffered: "8% Early Bird Discount",
    expectedCloseDate: "2026-09-10",
    paymentTerms: "30% Advance on Booking, 50% 10 Days Prior, 20% on Checkout",
    assignedExecutive: "Vikram Malhotra",
    nextActionSummary: "Site Visit scheduled for 28 Aug at 2:00 PM (Grand Ballroom)",
    siteVisitDate: "2026-08-28",
    siteVisitTime: "02:00 PM",
    siteVisitVenue: "Grand Ballroom & Royal Lawn",
    siteVisitStatus: "Scheduled",
    siteVisitNotes: "Decor sample catalogue to be presented during walkthrough.",
    nextCallDate: "2026-08-29",
    nextCallTime: "03:00 PM",
    nextCallNotes: "Discuss revised banquet menu package.",
    activities: [
      { id: "ACT-1", type: "Note", date: "15 Aug 2026, 02:15 PM", user: "Front Desk", notes: "Lead Record Linked (#LD-502)" },
      { id: "ACT-2", type: "Phone Call", date: "15 Aug 2026, 04:00 PM", user: "Vikram Malhotra", notes: "Initial requirement call with Ms. Pooja Reddy. Confirmed 450 pax." },
      { id: "ACT-3", type: "Proposal Sent", date: "17 Aug 2026, 05:00 PM", user: "Vikram Malhotra", notes: "Sent formal quotation for Grand Ballroom & Royal Lawn (₹24.00 Lakhs)." },
      { id: "ACT-4", type: "Site Visit", date: "28 Aug 2026, 02:00 PM", user: "Vikram Malhotra", notes: "Site visit scheduled for venue walkthrough.", status: "Scheduled", venue: "Grand Ballroom" },
    ],
    createdDate: "15 Aug 2026",
  },
  {
    id: "OPP-302",
    dealName: "TCS Q4 Executive Leadership Meet",
    leadId: "LD-501",
    stage: "Negotiation",
    status: "Open",
    customerName: "Sunil V",
    companyName: "TCS India Ltd",
    corporateClientId: "CORP-9910",
    corporateClientName: "TCS India Corporate Account",
    contactPerson: "Sunil V (Admin Lead)",
    mobile: "+91 97110 44556",
    email: "sunil.v@tcs.com",
    preferredContactMethod: "Email",
    leadType: "Corporate Booking",
    customerRequirement: "Need 45 rooms for 3 nights with breakfast. High-speed WiFi and airport transfer required.",
    expectedEventDate: "2026-09-15",
    guestCount: 150,
    expectedRoomNights: 135,
    venueRequired: "Executive Conference Hall A & B",
    requestedServices: ["45 Deluxe Rooms x 3 Nights", "High Speed WiFi", "Airport Pickup", "Buffet Breakfast"],
    leadSource: "Email",
    campaignName: "Corporate Annual Partner Saver",
    campaignId: "CMP-CRP-03",
    dealValue: 890000,
    quotedValue: 950000,
    expectedRevenue: 890000,
    discountOffered: "Corporate Tier Rate Code TCS-2026",
    expectedCloseDate: "2026-08-31",
    paymentTerms: "Direct Company Billing / 15 Days Credit",
    creditTerms: "Approved 15-Day Corporate Credit Account",
    assignedExecutive: "Jay Kumar",
    nextActionSummary: "Follow-up call on 29 Aug at 3:00 PM regarding corporate tariff confirmation",
    nextCallDate: "2026-08-29",
    nextCallTime: "03:00 PM",
    nextCallNotes: "Confirm airport transfer flight schedule.",
    activities: [
      { id: "ACT-10", type: "Note", date: "16 Aug 2026, 09:30 AM", user: "System", notes: "Lead Record Linked (#LD-501)" },
      { id: "ACT-11", type: "Phone Call", date: "16 Aug 2026, 02:00 PM", user: "Jay Kumar", notes: "Discussed corporate room rate inclusions." },
      { id: "ACT-12", type: "Negotiation", date: "17 Aug 2026, 11:00 AM", user: "Jay Kumar", notes: "Negotiating room rate from ₹6,500 to ₹5,800/night." },
    ],
    createdDate: "16 Aug 2026",
  },
  {
    id: "OPP-303",
    dealName: "IMA Annual Medical Conference",
    leadId: "LD-503",
    stage: "Qualification",
    status: "Open",
    customerName: "Dr. K.S. Rao",
    companyName: "Indian Medical Association",
    contactPerson: "Dr. K.S. Rao",
    mobile: "+91 98450 11223",
    email: "drksrao@ima.org",
    preferredContactMethod: "Email",
    leadType: "Conference",
    customerRequirement: "Need conference hall for 350 delegates and 120 rooms for 2 nights.",
    expectedEventDate: "2026-10-05",
    guestCount: 350,
    expectedRoomNights: 240,
    venueRequired: "Convention Center & Exhibition Lawn",
    requestedServices: ["120 Rooms x 2 Nights", "20 Pharma Exhibitor Stalls", "3 Buffet Meals Daily"],
    leadSource: "Website",
    dealValue: 1850000,
    quotedValue: 1850000,
    expectedRevenue: 1850000,
    expectedCloseDate: "2026-09-05",
    assignedExecutive: "Jay Kumar",
    nextActionSummary: "Call Dr. Rao on 28 Aug to verify delegate count and stall requirements",
    nextCallDate: "2026-08-28",
    nextCallTime: "11:00 AM",
    nextCallNotes: "Verify breakout room count and AV projector requirements.",
    activities: [
      { id: "ACT-20", type: "Note", date: "17 Aug 2026, 11:00 AM", user: "Website Bot", notes: "Web Inquiry Received (#LD-503)" },
    ],
    createdDate: "17 Aug 2026",
  },
  {
    id: "OPP-304",
    dealName: "Mehta 25th Anniversary Dinner",
    leadId: "LD-504",
    stage: "Won",
    status: "Won",
    customerName: "Anuj Mehta",
    companyName: "Mehta Family",
    contactPerson: "Anuj Mehta",
    mobile: "+91 98201 99887",
    email: "mehta.anniversary@gmail.com",
    preferredContactMethod: "WhatsApp",
    leadType: "Restaurant Event",
    customerRequirement: "Rooftop dining hall for 80 guests. Premium mocktail bar & live acoustic music.",
    expectedEventDate: "2026-09-02",
    guestCount: 80,
    venueRequired: "Rooftop Sky Lounge",
    requestedServices: ["Rooftop Dining", "Mocktail Bar", "Live Acoustic Music"],
    leadSource: "Phone Call",
    dealValue: 180000,
    quotedValue: 180000,
    expectedRevenue: 180000,
    expectedCloseDate: "2026-08-13",
    paymentTerms: "Full payment advance received",
    assignedExecutive: "Ananya Roy",
    nextActionSummary: "Deal Won! Advance deposit received. Ready for Event Booking creation.",
    activities: [
      { id: "ACT-30", type: "Note", date: "10 Aug 2026, 03:20 PM", user: "Phone Inbound", notes: "Inquiry received (#LD-504)" },
      { id: "ACT-31", type: "Phone Call", date: "11 Aug 2026, 11:00 AM", user: "Ananya Roy", notes: "Menu package confirmed." },
      { id: "ACT-32", type: "Stage Change", date: "13 Aug 2026, 02:00 PM", user: "Ananya Roy", notes: "Deal Won! Deposit of ₹50,000 received." },
    ],
    createdDate: "10 Aug 2026",
  },
  {
    id: "OPP-305",
    dealName: "MakeMyTrip Destination Wedding Group",
    leadId: "LD-505",
    stage: "Tentative Booking",
    status: "Open",
    customerName: "Rahul Kapoor",
    companyName: "Kapoor Family",
    travelAgentId: "TA-882",
    travelAgentName: "MakeMyTrip B2B Portal",
    commissionAgreement: "10% Standard B2B Agent Commission",
    contractedRate: "TA-NET-WEDDING-2026",
    contactPerson: "Rahul Kapoor",
    mobile: "+91 98880 33445",
    email: "rahul.kapoor@gmail.com",
    preferredContactMethod: "Phone",
    leadType: "Wedding",
    customerRequirement: "Destination wedding group booking with 60 rooms block and 3 event functions.",
    expectedEventDate: "2026-12-18",
    guestCount: 500,
    expectedRoomNights: 180,
    venueRequired: "Grand Ballroom, Poolside Lawn & Royal Courtyard",
    requestedServices: ["60 Rooms Block", "3 Pre-Wedding Functions", "Live Catering"],
    leadSource: "Travel Agent",
    dealValue: 3200000,
    quotedValue: 3500000,
    expectedRevenue: 3200000,
    discountOffered: "10% Agent Group Discount",
    expectedCloseDate: "2026-09-15",
    paymentTerms: "Tentative Hold valid till Sep 5. ₹5L deposit expected.",
    assignedExecutive: "Vikram Malhotra",
    nextActionSummary: "Tentative Hold active until 05 Sep. Awaiting advance deposit from Travel Agent.",
    activities: [
      { id: "ACT-40", type: "Note", date: "18 Aug 2026, 10:00 AM", user: "Vikram Malhotra", notes: "Travel Agent enquiry logged via MakeMyTrip B2B portal." },
      { id: "ACT-41", type: "Stage Change", date: "22 Aug 2026, 04:30 PM", user: "Vikram Malhotra", notes: "Tentative venue hold placed for 18 Dec 2026." },
    ],
    createdDate: "18 Aug 2026",
  },
  {
    id: "OPP-306",
    dealName: "Infosys Tech Hackathon 2026",
    leadId: "LD-506",
    stage: "Requirement Analysis",
    status: "Open",
    customerName: "Priya Nair",
    companyName: "Infosys Ltd",
    corporateClientId: "CORP-104",
    corporateClientName: "Infosys Corporate Account",
    contactPerson: "Priya Nair (HR Operations)",
    mobile: "+91 97441 55667",
    email: "priya.nair@infosys.com",
    preferredContactMethod: "Email",
    leadType: "Corporate Booking",
    customerRequirement: "24-Hour Hackathon event hall + 50 rooms block for engineers.",
    expectedEventDate: "2026-10-22",
    guestCount: 200,
    expectedRoomNights: 50,
    venueRequired: "Auditorium & Tech Lab Center",
    requestedServices: ["50 Rooms", "Midnight Catering", "1 Gbps Dedicated Fiber Line"],
    leadSource: "Corporate Reference",
    dealValue: 1250000,
    quotedValue: 1250000,
    expectedRevenue: 1250000,
    expectedCloseDate: "2026-09-20",
    assignedExecutive: "Ananya Roy",
    nextActionSummary: "Collecting high-speed network & midnight catering specifications from Infosys IT team.",
    activities: [
      { id: "ACT-50", type: "Note", date: "20 Aug 2026, 02:00 PM", user: "Ananya Roy", notes: "Logged Hackathon inquiry." },
    ],
    createdDate: "20 Aug 2026",
  },
  {
    id: "OPP-307",
    dealName: "Gupta Golden Jubilee Gala",
    leadId: "LD-507",
    stage: "Final Decision",
    status: "Open",
    customerName: "Ramesh Gupta",
    companyName: "Gupta Family",
    contactPerson: "Ramesh Gupta",
    mobile: "+91 98101 22334",
    email: "ramesh.gupta@gmail.com",
    preferredContactMethod: "Phone",
    leadType: "Banquet Event",
    customerRequirement: "Golden Jubilee anniversary celebration with dinner & DJ floor.",
    expectedEventDate: "2026-09-28",
    guestCount: 220,
    venueRequired: "Crystal Banquet Hall",
    requestedServices: ["220 Dinner Plates", "DJ & Lighting", "Decor Theme"],
    leadSource: "Phone Call",
    dealValue: 650000,
    quotedValue: 700000,
    expectedRevenue: 650000,
    expectedCloseDate: "2026-08-30",
    assignedExecutive: "Jay Kumar",
    nextActionSummary: "Final decision call scheduled with Mr. Gupta on 28 Aug at 5:00 PM.",
    nextCallDate: "2026-08-28",
    nextCallTime: "05:00 PM",
    nextCallNotes: "Final approval call.",
    activities: [
      { id: "ACT-60", type: "Proposal Sent", date: "19 Aug 2026, 11:30 AM", user: "Jay Kumar", notes: "Sent revised quotation of ₹6.50 Lakhs." },
    ],
    createdDate: "19 Aug 2026",
  },
  {
    id: "OPP-308",
    dealName: "Pharma Global Leadership Summit",
    leadId: "LD-508",
    stage: "Lost",
    status: "Lost",
    customerName: "Dr. S. Nambiar",
    companyName: "Sun Pharma Ltd",
    contactPerson: "Dr. S. Nambiar",
    mobile: "+91 98990 77889",
    email: "nambiar@sunpharma.com",
    preferredContactMethod: "Email",
    leadType: "Conference",
    customerRequirement: "Global summit for 400 delegates.",
    expectedEventDate: "2026-09-10",
    guestCount: 400,
    venueRequired: "Grand Convention Hall",
    leadSource: "Email",
    dealValue: 1400000,
    expectedCloseDate: "2026-08-24",
    assignedExecutive: "Vikram Malhotra",
    lostReason: "Customer Chose Competitor",
    lostNotes: "Selected competitor hotel due to closer proximity to airport.",
    nextActionSummary: "Closed Lost: Customer selected competitor due to airport proximity.",
    activities: [
      { id: "ACT-70", type: "Stage Change", date: "24 Aug 2026, 04:00 PM", user: "Vikram Malhotra", notes: "Marked Lost: Customer chose airport competitor." },
    ],
    createdDate: "12 Aug 2026",
  },
];

export function DealsPipelineView() {
  const router = useRouter();
  const [deals, setDeals] = useState<HotelDealItem[]>(INITIAL_HOTEL_DEALS);
  const [centralLeads, setCentralLeads] = useState<CentralLeadItem[]>(INITIAL_CENTRAL_LEADS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false);
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [dealToMarkLost, setDealToMarkLost] = useState<HotelDealItem | null>(null);

  // Lost Modal Input State
  const [lostReasonInput, setLostReasonInput] = useState("Price Too High");
  const [lostNotesInput, setLostNotesInput] = useState("");

  // Activity Modal Input State
  const [actTypeInput, setActTypeInput] = useState<DealActivity["type"]>("Phone Call");
  const [actDateInput, setActDateInput] = useState("2026-08-28");
  const [actTimeInput, setActTimeInput] = useState("03:00 PM");
  const [actNotesInput, setActNotesInput] = useState("");
  const [actVenueInput, setActVenueInput] = useState("");

  // Create Deal Form State
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
      "Tentative Booking": [],
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
  // DRAG AND DROP HANDLERS (STAGES & LEADS SYNCHRONIZATION)
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

    const previousStage = targetDeal.stage;
    const newStatus: HotelDealStatus = targetStage === "Won" ? "Won" : targetStage === "Lost" ? "Lost" : "Open";

    const newActivity: DealActivity = {
      id: `ACT-${Date.now()}`,
      type: "Stage Change",
      date: "26 Aug 2026, Just now",
      user: targetDeal.assignedExecutive,
      notes: `Moved stage from "${previousStage}" to "${targetStage}".`,
    };

    const updatedDeal: HotelDealItem = {
      ...targetDeal,
      stage: targetStage,
      status: newStatus,
      nextActionSummary:
        targetStage === "Won"
          ? "Deal Won! Click 'Create Booking →' to convert."
          : targetStage === "Lost"
          ? "Deal Closed Lost."
          : `Moved to ${targetStage}. Awaiting next action.`,
      activities: [newActivity, ...targetDeal.activities],
    };

    // Update local deals state
    setDeals((prev) => prev.map((d) => (d.id === dealId ? updatedDeal : d)));
    if (selectedDeal?.id === dealId) {
      setSelectedDeal(updatedDeal);
    }

    // Synchronize with Central Leads Dataset
    setCentralLeads((prev) =>
      prev.map((l) => {
        if (l.id === targetDeal.leadId) {
          return {
            ...l,
            pipelineStage: targetStage as any,
            status: targetStage === "Won" ? "Won" : targetStage === "Lost" ? "Lost" : "In Pipeline",
          };
        }
        return l;
      })
    );

    setToastMessage(`🚀 Deal "${updatedDeal.dealName}" moved to "${targetStage}"!`);
  };

  // ─────────────────────────────────────────────────────────────
  // STAGE ACTION HANDLERS
  // ─────────────────────────────────────────────────────────────

  const handleMoveStage = (deal: HotelDealItem, nextStage: HotelDealStage) => {
    const previousStage = deal.stage;
    const newStatus: HotelDealStatus = nextStage === "Won" ? "Won" : nextStage === "Lost" ? "Lost" : "Open";

    const newActivity: DealActivity = {
      id: `ACT-${Date.now()}`,
      type: "Stage Change",
      date: "26 Aug 2026, Just now",
      user: deal.assignedExecutive,
      notes: `Advanced pipeline stage from "${previousStage}" to "${nextStage}".`,
    };

    const updatedDeal: HotelDealItem = {
      ...deal,
      stage: nextStage,
      status: newStatus,
      nextActionSummary:
        nextStage === "Won"
          ? "Deal Won! Click 'Create Booking →' to generate booking."
          : `Pipeline stage updated to ${nextStage}.`,
      activities: [newActivity, ...deal.activities],
    };

    setDeals((prev) => prev.map((d) => (d.id === deal.id ? updatedDeal : d)));
    setSelectedDeal(updatedDeal);

    // Sync Lead Store
    setCentralLeads((prev) =>
      prev.map((l) => {
        if (l.id === deal.leadId) {
          return {
            ...l,
            pipelineStage: nextStage as any,
            status: nextStage === "Won" ? "Won" : nextStage === "Lost" ? "Lost" : "In Pipeline",
          };
        }
        return l;
      })
    );

    setToastMessage(`✓ Opportunity advanced to "${nextStage}"!`);
  };

  // Lost Modal Confirm
  const handleConfirmMarkLost = () => {
    if (!dealToMarkLost) return;

    const newActivity: DealActivity = {
      id: `ACT-${Date.now()}`,
      type: "Stage Change",
      date: "26 Aug 2026, Just now",
      user: dealToMarkLost.assignedExecutive,
      notes: `Marked Lost. Reason: ${lostReasonInput}. Notes: ${lostNotesInput.trim() || "N/A"}`,
    };

    const updatedDeal: HotelDealItem = {
      ...dealToMarkLost,
      stage: "Lost",
      status: "Lost",
      lostReason: lostReasonInput,
      lostNotes: lostNotesInput.trim() || undefined,
      nextActionSummary: `Closed Lost: ${lostReasonInput}`,
      activities: [newActivity, ...dealToMarkLost.activities],
    };

    setDeals((prev) => prev.map((d) => (d.id === dealToMarkLost.id ? updatedDeal : d)));
    if (selectedDeal?.id === dealToMarkLost.id) {
      setSelectedDeal(updatedDeal);
    }

    setToastMessage(`✓ Deal marked as Lost (${lostReasonInput}).`);
    setIsLostModalOpen(false);
    setDealToMarkLost(null);
    setLostNotesInput("");
  };

  // Reopen Opportunity
  const handleReopenDeal = (deal: HotelDealItem) => {
    const updatedDeal: HotelDealItem = {
      ...deal,
      stage: "Qualification",
      status: "Open",
      lostReason: undefined,
      lostNotes: undefined,
      nextActionSummary: "Opportunity reopened. Qualification in progress.",
      activities: [
        { id: `ACT-${Date.now()}`, type: "Stage Change", date: "26 Aug 2026, Just now", user: deal.assignedExecutive, notes: "Reopened Opportunity from Lost status." },
        ...deal.activities,
      ],
    };

    setDeals((prev) => prev.map((d) => (d.id === deal.id ? updatedDeal : d)));
    setSelectedDeal(updatedDeal);
    setToastMessage(`✓ Opportunity reopened and reset to "Qualification".`);
  };

  // Add Activity Submit
  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeal || !actNotesInput.trim()) return;

    const newActivity: DealActivity = {
      id: `ACT-${Date.now()}`,
      type: actTypeInput,
      date: `${actDateInput}, ${actTimeInput}`,
      user: selectedDeal.assignedExecutive,
      notes: actNotesInput.trim(),
      status: "Completed",
      venue: actVenueInput.trim() || undefined,
    };

    let summaryText = `${actTypeInput} completed: ${actNotesInput.trim()}`;
    if (actTypeInput === "Site Visit") {
      summaryText = `Site Visit logged for ${actDateInput} at ${actVenueInput || "Venue"}`;
    } else if (actTypeInput === "Phone Call" || actTypeInput === "Follow-up") {
      summaryText = `Next Follow-up scheduled for ${actDateInput} at ${actTimeInput}`;
    }

    const updatedDeal: HotelDealItem = {
      ...selectedDeal,
      nextActionSummary: summaryText,
      activities: [newActivity, ...selectedDeal.activities],
    };

    setDeals((prev) => prev.map((d) => (d.id === selectedDeal.id ? updatedDeal : d)));
    setSelectedDeal(updatedDeal);
    setToastMessage(`✓ ${actTypeInput} logged for "${selectedDeal.dealName}"!`);
    setIsAddActivityModalOpen(false);
    setActNotesInput("");
    setActVenueInput("");
  };

  // Route to Booking Module on Won Deal
  const handleCreateBookingRoute = (deal: HotelDealItem) => {
    if (deal.leadType === "Room Booking") {
      router.push(`/front-office/reservations?guestName=${encodeURIComponent(deal.customerName)}&mobile=${encodeURIComponent(deal.mobile)}&dealId=${deal.id}`);
    } else if (deal.leadType === "Wedding" || deal.leadType === "Banquet Event" || deal.leadType === "Conference" || deal.leadType === "Corporate Booking") {
      router.push(`/sales-marketing/banquets/bookings-enquiries?eventName=${encodeURIComponent(deal.dealName)}&pax=${deal.guestCount || 300}&revenue=${deal.dealValue}&dealId=${deal.id}`);
    } else {
      router.push(`/food-beverages/outlet-billing`);
    }
  };

  // Handle Lead Selector in Create Deal Modal
  const handleSelectLeadForDeal = (leadId: string) => {
    setCreateLeadIdSelect(leadId);
    const foundLead = centralLeads.find((l) => l.id === leadId);
    if (foundLead) {
      setCreateDealName(foundLead.leadName);
      setCreateCustomerName(foundLead.leadName);
      setCreateCompanyName(foundLead.companyName || "");
      setCreateMobile(foundLead.mobile);
      setCreateEmail(foundLead.email || "");
      setCreateLeadType(foundLead.leadType);
      setCreateDealValue(foundLead.rawRevenue ? String(foundLead.rawRevenue) : "500000");
      setCreateExecutive(foundLead.assignedExecutive || "Jay Kumar");
      setCreateRequirement(foundLead.customerRequirement || "");
    }
  };

  // Submit Create Deal Form
  const handleCreateDealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createDealName.trim() || !createCustomerName.trim() || !createMobile.trim()) return;

    const numValue = Number(createDealValue) || 500000;
    const newDealId = `OPP-${Math.floor(300 + Math.random() * 500)}`;
    const linkedLeadId = createLeadIdSelect || `LD-${Math.floor(500 + Math.random() * 500)}`;

    const newDeal: HotelDealItem = {
      id: newDealId,
      dealName: createDealName.trim(),
      leadId: linkedLeadId,
      stage: createStage,
      status: createStage === "Won" ? "Won" : createStage === "Lost" ? "Lost" : "Open",
      customerName: createCustomerName.trim(),
      companyName: createCompanyName.trim() || undefined,
      contactPerson: createCustomerName.trim(),
      mobile: createMobile.trim(),
      email: createEmail.trim() || undefined,
      preferredContactMethod: "Phone",
      leadType: createLeadType,
      customerRequirement: createRequirement.trim() || "Sales Opportunity created.",
      expectedCloseDate: createExpectedCloseDate,
      dealValue: numValue,
      quotedValue: numValue,
      expectedRevenue: numValue,
      assignedExecutive: createExecutive,
      nextActionSummary: `Opportunity created in ${createStage}. Awaiting initial follow-up.`,
      activities: [
        { id: `ACT-${Date.now()}`, type: "Note", date: "26 Aug 2026, Just now", user: createExecutive, notes: `Opportunity Created (#${newDealId}) linked to Lead #${linkedLeadId}.` },
      ],
      createdDate: "26 Aug 2026",
    };

    setDeals((prev) => [newDeal, ...prev]);

    // Sync Central Lead
    setCentralLeads((prev) => {
      const exists = prev.some((l) => l.id === linkedLeadId);
      if (exists) {
        return prev.map((l) =>
          l.id === linkedLeadId
            ? { ...l, status: "In Pipeline", pipelineStage: createStage as any }
            : l
        );
      }
      return prev;
    });

    setToastMessage(`✓ Opportunity "${newDeal.dealName}" (#${newDeal.id}) created & linked to Lead #${linkedLeadId}!`);
    setIsCreateModalOpen(false);
  };

  return (
    <ModulePageShell
      eyebrow="Sales & Marketing Operations"
      title="Deals & Sales Pipeline"
      description="Track qualified sales opportunities through hotel pipeline stages to Won bookings."
      breadcrumbs={[
        { label: "Sales & Marketing", href: "/sales-marketing/dashboard" },
        { label: "CRM" },
        { label: "Pipeline & Deals" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex items-center gap-2">
          {/* View Toggle (Kanban / List) */}
          <div className="bg-slate-100 p-0.5 rounded-xl border border-slate-200 flex items-center">
            <button
              type="button"
              onClick={() => setViewMode("KANBAN")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer",
                viewMode === "KANBAN" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Kanban className="h-3.5 w-3.5" /> Stage View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("LIST")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer",
                viewMode === "LIST" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <List className="h-3.5 w-3.5" /> List View
            </button>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Create Deal
          </Button>
        </div>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: KPI OVERVIEW CARDS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <HRKPICard
          label="Total Opportunities"
          value={`${kpiMetrics.totalCount}`}
          subtitle="All Pipeline Deals"
          tone="purple"
          icon={<Briefcase className="h-5 w-5" />}
        />
        <HRKPICard
          label="Open Pipeline Value"
          value={`₹${(kpiMetrics.totalPipelineValue / 100000).toFixed(1)}L`}
          subtitle="Total Active Value"
          tone="blue"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <HRKPICard
          label="Active Opportunities"
          value={`${kpiMetrics.openCount}`}
          subtitle="In Active Stages"
          tone="blue"
          icon={<Clock className="h-5 w-5" />}
        />
        <HRKPICard
          label="Won Deals"
          value={`${kpiMetrics.wonCount}`}
          subtitle="Confirmed Business"
          tone="emerald"
          icon={<Award className="h-5 w-5" />}
        />
        <HRKPICard
          label="Won Revenue"
          value={`₹${(kpiMetrics.wonValue / 100000).toFixed(1)}L`}
          subtitle="Converted Bookings"
          tone="emerald"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: SEARCH & FILTERS BAR
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Deal Name, Customer, Lead ID, Deal ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Stage Filter */}
          <select
            value={selectedStageFilter}
            onChange={(e) => setSelectedStageFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
          >
            <option value="ALL">All Stages</option>
            {HOTEL_PIPELINE_STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Lead Type Filter */}
          <select
            value={selectedLeadTypeFilter}
            onChange={(e) => setSelectedLeadTypeFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
          >
            <option value="ALL">All Deal Types</option>
            <option value="Wedding">Wedding</option>
            <option value="Banquet Event">Banquet Event</option>
            <option value="Corporate Booking">Corporate Booking</option>
            <option value="Conference">Conference</option>
            <option value="Room Booking">Room Booking</option>
            <option value="Restaurant Event">Restaurant Event</option>
          </select>

          {/* Executive Filter */}
          <select
            value={selectedExecutiveFilter}
            onChange={(e) => setSelectedExecutiveFilter(e.target.value)}
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
          SECTION 3A: STAGE VIEW (KANBAN BOARD WITH CLEAN UNIFIED STYLING)
      ───────────────────────────────────────────────────────────── */}
      {viewMode === "KANBAN" && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3.5 min-w-[2240px] items-start">
            {HOTEL_PIPELINE_STAGES.map((stage) => {
              const stageDeals = dealsByStage[stage.id] || [];
              const totalVal = getStageTotalValue(stage.id);
              const isOver = dragOverStageId === stage.id;

              return (
                <div
                  key={stage.id}
                  onDragOver={(e) => handleDragOver(e, stage.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, stage.id)}
                  className={cn(
                    "flex-1 min-w-[260px] md:min-w-[270px] rounded-2xl bg-slate-50/70 border border-slate-200 p-3 flex flex-col transition-all min-h-[550px]",
                    isOver ? "bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-400/50" : ""
                  )}
                >
                  {/* Stage Header Summary Box */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs mb-2.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 text-xs truncate">{stage.label}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-slate-100">
                      <span className="text-slate-500 font-bold">{stageDeals.length} Deals</span>
                      <span className="font-extrabold text-slate-900">₹{(totalVal / 100000).toFixed(1)}L</span>
                    </div>
                  </div>

                  {/* Deals Cards List inside Column */}
                  <div className="space-y-2 flex-1">
                    {stageDeals.length > 0 ? (
                      stageDeals.map((deal) => (
                        <div
                          key={deal.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, deal.id)}
                          onClick={() => setSelectedDeal(deal)}
                          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition cursor-pointer space-y-2 group relative"
                        >
                          {/* Top Row: Deal Name & Value */}
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-extrabold text-slate-900 text-xs leading-snug">
                              {deal.dealName}
                            </h4>
                            <span className="font-mono font-black text-slate-900 text-xs whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                              ₹{(deal.dealValue / 100000).toFixed(1)}L
                            </span>
                          </div>

                          {/* Customer & Lead ID */}
                          <div className="flex items-center justify-between text-[10px] text-slate-600 gap-1">
                            <span className="font-bold text-slate-800 truncate flex-1 min-w-0">
                              {deal.companyName || deal.customerName}
                            </span>
                            <span className="font-mono text-slate-700 font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap shrink-0">
                              #{deal.leadId}
                            </span>
                          </div>

                          {/* Type Badge & Event Date */}
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-bold border border-slate-200">
                              {deal.leadType}
                            </span>
                            <span className="font-mono text-slate-500 flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              {deal.expectedEventDate || "TBD"}
                            </span>
                          </div>

                          {/* Assigned Executive & Next Action Preview */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                            <span className="text-slate-600 font-medium">{deal.assignedExecutive}</span>
                            {deal.siteVisitDate ? (
                              <span className="text-slate-700 font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                Site Visit: {deal.siteVisitDate}
                              </span>
                            ) : deal.nextCallDate ? (
                              <span className="text-slate-700 font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                Call: {deal.nextCallDate}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">No activity</span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="h-32 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-[11px] text-slate-400 italic bg-white/50">
                        Drag deals here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3B: LIST VIEW
      ───────────────────────────────────────────────────────────── */}
      {viewMode === "LIST" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 whitespace-nowrap">Opportunity ID</th>
                  <th className="py-3 px-4 whitespace-nowrap">Deal Name</th>
                  <th className="py-3 px-4">Customer / Company</th>
                  <th className="py-3 px-4 whitespace-nowrap">Lead Type</th>
                  <th className="py-3 px-4 whitespace-nowrap">Pipeline Stage</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Deal Value</th>
                  <th className="py-3 px-4 whitespace-nowrap">Event Date</th>
                  <th className="py-3 px-4 whitespace-nowrap">Executive</th>
                  <th className="py-3 px-4">Next Action / Activity</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredDeals.length > 0 ? (
                  filteredDeals.map((deal) => (
                    <tr
                      key={deal.id}
                      onClick={() => setSelectedDeal(deal)}
                      className="hover:bg-slate-50 transition cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        #{deal.id} <span className="text-slate-400 font-normal">({deal.leadId})</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{deal.dealName}</td>
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 block">{deal.customerName}</strong>
                        {deal.companyName && <span className="text-[10px] text-slate-500">{deal.companyName}</span>}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-bold">
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] border border-slate-200">
                          {deal.leadType}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold">
                          {deal.stage}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900 whitespace-nowrap">
                        ₹{deal.dealValue.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {deal.expectedEventDate || "TBD"}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{deal.assignedExecutive}</td>
                      <td className="py-3 px-4 text-[11px] text-slate-600 max-w-[220px] truncate">
                        {deal.nextActionSummary || "N/A"}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border inline-block",
                            deal.status === "Won"
                              ? "bg-emerald-100 text-emerald-900 border-emerald-200"
                              : deal.status === "Lost"
                              ? "bg-rose-100 text-rose-900 border-rose-200"
                              : "bg-slate-100 text-slate-800 border-slate-200"
                          )}
                        >
                          {deal.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400 text-xs">
                      No deals found matching your filters.
                    </td>
                  </tr>
                )}
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
          onClose={() => setSelectedDeal(null)}
          title={`Opportunity Details — #${selectedDeal.id}`}
        >
          <div className="space-y-4 text-xs p-1">
            {/* Header Banner */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs text-slate-900 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-emerald-700 font-extrabold text-xs">
                  #{selectedDeal.id} (Lead #{selectedDeal.leadId})
                </span>
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border",
                    selectedDeal.status === "Won"
                      ? "bg-emerald-100 text-emerald-900 border-emerald-200"
                      : selectedDeal.status === "Lost"
                      ? "bg-rose-100 text-rose-900 border-rose-200"
                      : "bg-slate-100 text-slate-800 border-slate-200"
                  )}
                >
                  {selectedDeal.stage} • {selectedDeal.status}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900">{selectedDeal.dealName}</h3>
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
                <span>
                  Value: <strong className="text-slate-900 font-mono text-sm">₹{selectedDeal.dealValue.toLocaleString()}</strong>
                </span>
                <span>
                  Executive: <strong className="text-slate-800">{selectedDeal.assignedExecutive}</strong>
                </span>
              </div>
              {selectedDeal.campaignName && (
                <div className="pt-1 text-[10px] text-slate-600 font-mono font-bold">
                  Campaign: {selectedDeal.campaignName} ({selectedDeal.campaignId || "N/A"})
                </div>
              )}
            </div>

            {/* SECTION A — NEXT ACTION BANNER */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-slate-900">
              <span className="text-[10px] font-extrabold uppercase tracking-wider block text-slate-500">
                ⚡ Immediate Next Action
              </span>
              <p className="font-bold text-xs">{selectedDeal.nextActionSummary || "No next action set."}</p>
            </div>

            {/* SECTION B — LINKED CONTACT INFORMATION */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-extrabold text-slate-900 uppercase text-[10px] tracking-wider block border-b border-slate-200 pb-1">
                Linked Customer &amp; Account Contact
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Customer Name:</span>
                  <strong className="text-slate-900 font-bold">{selectedDeal.customerName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Company Name:</span>
                  <strong className="text-slate-900">{selectedDeal.companyName || "N/A"}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Mobile Number:</span>
                  <strong className="text-slate-900 font-mono">{selectedDeal.mobile}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Email:</span>
                  <strong className="text-slate-900">{selectedDeal.email || "N/A"}</strong>
                </div>
              </div>

              {/* Corporate Client Link */}
              {selectedDeal.corporateClientName && (
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 space-y-0.5 text-[11px] mt-1">
                  <span className="font-extrabold text-[10px] text-slate-500 uppercase block">Corporate Account Linked</span>
                  <div className="font-bold">{selectedDeal.corporateClientName} ({selectedDeal.corporateClientId})</div>
                </div>
              )}

              {/* Travel Agent Link */}
              {selectedDeal.travelAgentName && (
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 space-y-0.5 text-[11px] mt-1">
                  <span className="font-extrabold text-[10px] text-slate-500 uppercase block">Travel Agent Agreement Linked</span>
                  <div className="font-bold">{selectedDeal.travelAgentName} ({selectedDeal.travelAgentId})</div>
                  <div className="text-[10px] text-slate-600">
                    Commission: <strong>{selectedDeal.commissionAgreement}</strong> • Rate Code: <strong>{selectedDeal.contractedRate}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION C — BUSINESS REQUIREMENTS */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-extrabold text-slate-900 uppercase text-[10px] tracking-wider block border-b border-slate-200 pb-1">
                Business &amp; Event Requirements
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Lead / Deal Type:</span>
                  <strong className="text-slate-900 font-bold">{selectedDeal.leadType}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Expected Event Date:</span>
                  <strong className="text-slate-900 font-mono">{selectedDeal.expectedEventDate || "N/A"}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Expected Guests (Pax):</span>
                  <strong className="text-slate-900 font-mono">{selectedDeal.guestCount ? `${selectedDeal.guestCount} Pax` : "N/A"}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Room Nights Block:</span>
                  <strong className="text-slate-900 font-mono">{selectedDeal.expectedRoomNights ? `${selectedDeal.expectedRoomNights} Nights` : "N/A"}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 text-[10px] block">Venue Required:</span>
                  <strong className="text-slate-900 font-bold">{selectedDeal.venueRequired || "Not specified"}</strong>
                </div>
              </div>

              <div className="pt-1">
                <span className="text-slate-400 text-[10px] block font-bold">Requirement Notes:</span>
                <p className="text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200 leading-relaxed text-[11px] mt-0.5">
                  {selectedDeal.customerRequirement}
                </p>
              </div>

              {selectedDeal.requestedServices && selectedDeal.requestedServices.length > 0 && (
                <div className="pt-1">
                  <span className="text-slate-400 text-[10px] block font-bold mb-1">Requested Services / Packages:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedDeal.requestedServices.map((srv, idx) => (
                      <span key={idx} className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold">
                        ✓ {srv}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION D — COMMERCIAL INFORMATION */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-extrabold text-slate-900 uppercase text-[10px] tracking-wider block border-b border-slate-200 pb-1">
                Commercial &amp; Financial Terms
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Deal Value:</span>
                  <strong className="text-slate-900 font-mono text-sm font-black">₹{selectedDeal.dealValue.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Quoted Amount:</span>
                  <strong className="text-slate-900 font-mono font-bold">₹{(selectedDeal.quotedValue || selectedDeal.dealValue).toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Discount Offered:</span>
                  <strong className="text-emerald-800 font-bold">{selectedDeal.discountOffered || "Standard Tariff"}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Expected Close Date:</span>
                  <strong className="text-slate-900 font-mono">{selectedDeal.expectedCloseDate}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 text-[10px] block">Payment Terms:</span>
                  <strong className="text-slate-800">{selectedDeal.paymentTerms || "Standard Hotel Advance Policy"}</strong>
                </div>
              </div>
            </div>

            {/* SECTION E — TASK & ACTIVITY MANAGEMENT */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <h4 className="font-extrabold text-slate-900 uppercase text-[10px] tracking-wider">
                  Task &amp; Activity Management
                </h4>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsAddActivityModalOpen(true)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] rounded-lg px-2.5 py-1 cursor-pointer"
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Activity
                </Button>
              </div>

              {/* Site Visit Card if scheduled */}
              {selectedDeal.siteVisitDate && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 space-y-1">
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span>Site Visit: {selectedDeal.siteVisitVenue || "Hotel Property"}</span>
                    <span className="bg-slate-200 text-slate-800 border border-slate-300 px-2 py-0.5 rounded text-[10px]">
                      {selectedDeal.siteVisitStatus || "Scheduled"}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-600">Date: {selectedDeal.siteVisitDate} at {selectedDeal.siteVisitTime}</div>
                  {selectedDeal.siteVisitNotes && <p className="text-[10px] text-slate-600 italic">{selectedDeal.siteVisitNotes}</p>}
                </div>
              )}

              {/* Next Call Card if scheduled */}
              {selectedDeal.nextCallDate && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 space-y-1">
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span>Next Follow-up Call</span>
                    <span className="bg-slate-200 text-slate-800 border border-slate-300 px-2 py-0.5 rounded text-[10px]">Scheduled</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-600">Date: {selectedDeal.nextCallDate} at {selectedDeal.nextCallTime}</div>
                  {selectedDeal.nextCallNotes && <p className="text-[10px] text-slate-600 italic">{selectedDeal.nextCallNotes}</p>}
                </div>
              )}
            </div>

            {/* SECTION F — ACTIVITY TIMELINE */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-extrabold text-slate-900 uppercase text-[10px] tracking-wider border-b border-slate-200 pb-1">
                Activity Timeline ({selectedDeal.activities.length})
              </h4>
              <div className="space-y-2 text-[11px]">
                {selectedDeal.activities.length > 0 ? (
                  selectedDeal.activities.map((act) => (
                    <div key={act.id} className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-0.5">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span className="text-emerald-800">[{act.type}] {act.user}</span>
                        <span className="text-slate-400 font-mono text-[10px]">{act.date}</span>
                      </div>
                      <p className="text-slate-700 text-[11px]">{act.notes}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-slate-400 text-xs italic bg-white rounded-xl">
                    No activity timeline recorded yet.
                  </div>
                )}
              </div>
            </div>

            {/* SECTION G — CONTEXTUAL STAGE ACTIONS */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Contextual Stage Actions ({selectedDeal.stage})
              </span>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {/* Qualification */}
                {selectedDeal.stage === "Qualification" && (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsAddActivityModalOpen(true)}
                      className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl px-3 py-2 cursor-pointer shadow-xs"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Activity
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleMoveStage(selectedDeal, "Requirement Analysis")}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl px-4 py-2 cursor-pointer shadow-xs"
                    >
                      Move to Requirement Analysis →
                    </Button>
                  </>
                )}

                {/* Requirement Analysis */}
                {selectedDeal.stage === "Requirement Analysis" && (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsAddActivityModalOpen(true)}
                      className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl px-3 py-2 cursor-pointer shadow-xs"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Activity
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleMoveStage(selectedDeal, "Quotation / Proposal")}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl px-4 py-2 cursor-pointer shadow-xs"
                    >
                      Create &amp; Send Quotation →
                    </Button>
                  </>
                )}

                {/* Quotation / Proposal */}
                {selectedDeal.stage === "Quotation / Proposal" && (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsAddActivityModalOpen(true)}
                      className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl px-3 py-2 cursor-pointer shadow-xs"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Follow-up
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleMoveStage(selectedDeal, "Negotiation")}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl px-4 py-2 cursor-pointer shadow-xs"
                    >
                      Move to Negotiation →
                    </Button>
                  </>
                )}

                {/* Negotiation */}
                {selectedDeal.stage === "Negotiation" && (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsAddActivityModalOpen(true)}
                      className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl px-3 py-2 cursor-pointer shadow-xs"
                    >
                      <Calendar className="h-3.5 w-3.5 mr-1" /> Schedule Site Visit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleMoveStage(selectedDeal, "Tentative Booking")}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl px-4 py-2 cursor-pointer shadow-xs"
                    >
                      Move to Tentative Booking →
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setDealToMarkLost(selectedDeal);
                        setIsLostModalOpen(true);
                      }}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl px-3 py-2 cursor-pointer shadow-xs"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" /> Mark Lost
                    </Button>
                  </>
                )}

                {/* Tentative Booking */}
                {selectedDeal.stage === "Tentative Booking" && (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsAddActivityModalOpen(true)}
                      className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl px-3 py-2 cursor-pointer shadow-xs"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Follow-up
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleMoveStage(selectedDeal, "Final Decision")}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl px-4 py-2 cursor-pointer shadow-xs"
                    >
                      Move to Final Decision →
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setDealToMarkLost(selectedDeal);
                        setIsLostModalOpen(true);
                      }}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl px-3 py-2 cursor-pointer shadow-xs"
                    >
                      Cancel Hold
                    </Button>
                  </>
                )}

                {/* Final Decision */}
                {selectedDeal.stage === "Final Decision" && (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleMoveStage(selectedDeal, "Won")}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-xl px-5 py-2 cursor-pointer shadow-xs"
                    >
                      Mark Won 🎉
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setDealToMarkLost(selectedDeal);
                        setIsLostModalOpen(true);
                      }}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl px-3 py-2 cursor-pointer shadow-xs"
                    >
                      Mark Lost
                    </Button>
                  </>
                )}

                {/* Won Deal Stage Actions (ONLY Create Booking, View Booking, View Lead) */}
                {selectedDeal.stage === "Won" && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleCreateBookingRoute(selectedDeal)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold rounded-xl px-5 py-2 cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5" /> Create Booking →
                  </Button>
                )}

                {/* Lost Deal Stage Actions */}
                {selectedDeal.stage === "Lost" && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleReopenDeal(selectedDeal)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl px-4 py-2 cursor-pointer shadow-xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reopen Opportunity
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Drawer>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 5: CREATE DEAL MODAL (WITH AUTO-FILL FROM LEAD)
      ───────────────────────────────────────────────────────────── */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Sales Opportunity / Deal"
        >
          <form onSubmit={handleCreateDealSubmit} className="space-y-3.5 text-xs p-1">
            {/* Auto-fill Lead Selection Box */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <label className="block text-[11px] font-bold text-slate-800">
                Select Existing Qualified Lead (Auto-Fills Details):
              </label>
              <select
                value={createLeadIdSelect}
                onChange={(e) => handleSelectLeadForDeal(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2 font-bold text-slate-900 bg-white text-xs"
              >
                <option value="">-- Create Standalone / Select Lead --</option>
                {centralLeads.map((l) => (
                  <option key={l.id} value={l.id}>
                    #{l.id} — {l.leadName} ({l.companyName || l.mobile})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Deal / Opportunity Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Reddy & Sharma Wedding Reception"
                value={createDealName}
                onChange={(e) => setCreateDealName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900 bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pooja Reddy"
                  value={createCustomerName}
                  onChange={(e) => setCreateCustomerName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Reddy Family / TCS"
                  value={createCompanyName}
                  onChange={(e) => setCreateCompanyName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white"
                />
              </div>
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
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. pooja@gmail.com"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Lead / Deal Type *</label>
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

              <div>
                <label className="block font-bold text-slate-700 mb-1">Initial Pipeline Stage *</label>
                <select
                  value={createStage}
                  onChange={(e) => setCreateStage(e.target.value as HotelDealStage)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900 bg-white"
                >
                  {HOTEL_PIPELINE_STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Deal Value (₹) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  placeholder="e.g. 1200000"
                  value={createDealValue}
                  onChange={(e) => setCreateDealValue(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-mono font-bold text-slate-900 bg-white text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Expected Close Date *</label>
                <input
                  type="date"
                  required
                  value={createExpectedCloseDate}
                  onChange={(e) => setCreateExpectedCloseDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Requirement Notes</label>
              <textarea
                rows={2}
                placeholder="Enter customer requirement details..."
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
                Create Opportunity
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 6: ADD ACTIVITY MODAL
      ───────────────────────────────────────────────────────────── */}
      {isAddActivityModalOpen && selectedDeal && (
        <Modal
          isOpen={isAddActivityModalOpen}
          onClose={() => setIsAddActivityModalOpen(false)}
          title={`Log Activity — #${selectedDeal.id}`}
        >
          <form onSubmit={handleSaveActivity} className="space-y-3 text-xs p-1">
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
                  <option value="WhatsApp Follow-up">WhatsApp Follow-up</option>
                  <option value="Proposal Sent">Proposal Sent</option>
                  <option value="Negotiation">Negotiation</option>
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
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl px-4 cursor-pointer"
              >
                Save Activity Record
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 7: MARK LOST MODAL
      ───────────────────────────────────────────────────────────── */}
      {isLostModalOpen && dealToMarkLost && (
        <Modal
          isOpen={isLostModalOpen}
          onClose={() => setIsLostModalOpen(false)}
          title={`Mark Opportunity Lost — #${dealToMarkLost.id}`}
        >
          <div className="space-y-3.5 text-xs p-1">
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 font-semibold">
              You are marking opportunity <strong>"{dealToMarkLost.dealName}"</strong> as Lost. Please select the primary lost reason.
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Lost Reason *</label>
              <select
                value={lostReasonInput}
                onChange={(e) => setLostReasonInput(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-bold bg-white"
              >
                <option value="Price Too High">Price Too High</option>
                <option value="Customer Chose Competitor">Customer Chose Competitor</option>
                <option value="Date Unavailable">Date Unavailable</option>
                <option value="Customer Cancelled">Customer Cancelled</option>
                <option value="No Response">No Response</option>
                <option value="Requirement Changed">Requirement Changed</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Additional Lost Notes</label>
              <textarea
                rows={3}
                placeholder="Optional notes regarding why the opportunity was lost..."
                value={lostNotesInput}
                onChange={(e) => setLostNotesInput(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsLostModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmMarkLost}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs px-5 shadow-xs cursor-pointer"
              >
                Confirm Mark Lost
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </ModulePageShell>
  );
}
