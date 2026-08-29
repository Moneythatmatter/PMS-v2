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
  Layers,
  FileSpreadsheet,
  Zap,
  Bookmark,
  ShieldCheck,
  Timer,
  FileCheck,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal } from "@/components/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import { cn } from "@/lib/utils";
import { INITIAL_CENTRAL_LEADS, CentralLeadItem } from "@/app/data/centralLeadData";
import { LeadType, LeadSource } from "./LeadsInquiriesView";
import { AddActivityModal, ActivityPayload, SharedActivityType, SharedActivityStatus } from "./shared/AddActivityModal";

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
    quotations: [
      {
        id: "QTN-001",
        versionName: "Initial Grand Ballroom Package",
        date: "17 Aug 2026",
        amount: 2600000,
        status: "Superseded",
        inclusions: "Grand Ballroom, standard audio setup, 3 buffet live counters.",
        validUntil: "25 Aug 2026",
      },
      {
        id: "QTN-002",
        versionName: "Revised Wedding Gala & Lawn Package",
        date: "24 Aug 2026",
        amount: 2400000,
        status: "Sent",
        inclusions: "Grand Ballroom + Royal Lawn, premium North & South Indian buffet, bridal suite, 30 rooms.",
        validUntil: "05 Sep 2026",
      },
    ],
    tentativeHold: undefined,
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
    quotations: [
      {
        id: "QTN-003",
        versionName: "Standard Corporate Tariff Quotation",
        date: "16 Aug 2026",
        amount: 950000,
        status: "Superseded",
        inclusions: "45 rooms @ ₹7,000/night + Conference Hall A",
        validUntil: "22 Aug 2026",
      },
      {
        id: "QTN-004",
        versionName: "Negotiated Corporate SLA Proposal",
        date: "20 Aug 2026",
        amount: 890000,
        status: "Sent",
        inclusions: "45 rooms @ ₹5,800/night + Conference Hall A & B + Airport Shuttles",
        validUntil: "31 Aug 2026",
      },
    ],
    tentativeHold: undefined,
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
    stage: "Tentative Hold",
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
    requestedServices: ["Convention Center Hall", "120 Rooms x 2 Nights", "Pharma Exhibition Space", "3 Buffet Meals"],
    leadSource: "Website",
    dealValue: 1850000,
    quotedValue: 1950000,
    expectedRevenue: 1850000,
    expectedCloseDate: "2026-09-05",
    paymentTerms: "25% Advance, Balance prior to check-in",
    assignedExecutive: "Jay Kumar",
    nextActionSummary: "Hold active on Convention Center until 30 Aug 2026. Awaiting committee advance approval.",
    nextCallDate: "2026-08-29",
    nextCallTime: "11:30 AM",
    quotations: [
      {
        id: "QTN-005",
        versionName: "Medical Conference Master Proposal",
        date: "21 Aug 2026",
        amount: 1850000,
        status: "Sent",
        inclusions: "Convention Center, 120 rooms, audio visual setup, 3 buffet meals.",
        validUntil: "30 Aug 2026",
      },
    ],
    tentativeHold: {
      venueName: "Convention Center & Exhibition Lawn",
      startDate: "2026-10-05",
      endDate: "2026-10-07",
      holdExpiryDate: "2026-08-30",
      holdStatus: "Active",
      holdNotes: "Held for IMA annual delegation; hold expires 30 Aug 2026 unless 25% token advance paid.",
    },
    activities: [
      { id: "ACT-20", type: "Note", date: "17 Aug 2026, 11:00 AM", user: "System", notes: "Lead Record Linked (#LD-503)" },
      { id: "ACT-21", type: "Phone Call", date: "18 Aug 2026, 03:00 PM", user: "Jay Kumar", notes: "Spoke with Dr. Rao. Confirmed 350 delegates and banquet requirements." },
      { id: "ACT-22", type: "Stage Change", date: "22 Aug 2026, 10:00 AM", user: "Jay Kumar", notes: "Moved to Tentative Hold. Reserved Convention Center until 30 Aug 2026." },
    ],
    createdDate: "17 Aug 2026",
  },
  {
    id: "OPP-304",
    dealName: "Thomas Cook UK Inbound Group",
    leadId: "LD-504",
    stage: "Final Decision",
    status: "Open",
    customerName: "Vikram Rathi",
    companyName: "Thomas Cook India Ltd",
    travelAgentId: "TA-4401",
    travelAgentName: "Thomas Cook India Ltd",
    commissionAgreement: "10% Standard Commission on Room Tariff",
    contactPerson: "Vikram Rathi (Key Account Mgr)",
    mobile: "+91 98334 55667",
    email: "vikram.r@thomascook.in",
    preferredContactMethod: "Phone",
    leadType: "Travel Group",
    customerRequirement: "60 rooms block for 4 nights with dinner package for UK tourism group.",
    expectedEventDate: "2026-10-20",
    guestCount: 110,
    expectedRoomNights: 240,
    requestedServices: ["60 Deluxe Twin Rooms", "Daily Dinner Buffet", "Baggage Handling", "Welcome Drinks"],
    leadSource: "Corporate Reference",
    dealValue: 1560000,
    quotedValue: 1650000,
    expectedRevenue: 1560000,
    expectedCloseDate: "2026-08-30",
    paymentTerms: "100% Pre-payment via Agent VCC 7 days prior",
    assignedExecutive: "Vikram Malhotra",
    nextActionSummary: "Final contract signature expected by 30 Aug from Thomas Cook Head Office",
    nextCallDate: "2026-08-30",
    nextCallTime: "11:00 AM",
    quotations: [
      {
        id: "QTN-006",
        versionName: "UK Inbound Delegation Group Agreement",
        date: "22 Aug 2026",
        amount: 1560000,
        status: "Accepted",
        inclusions: "60 Deluxe Rooms x 4 Nights, Daily Dinner, 10% agent commission rebate.",
        validUntil: "30 Aug 2026",
      },
    ],
    tentativeHold: {
      venueName: "Room Block Wing A (60 Rooms)",
      startDate: "2026-10-20",
      endDate: "2026-10-24",
      holdExpiryDate: "2026-08-30",
      holdStatus: "Active",
      holdNotes: "60 room block locked for Thomas Cook UK inbound group.",
    },
    activities: [
      { id: "ACT-30", type: "Note", date: "18 Aug 2026, 01:00 PM", user: "System", notes: "Lead Record Linked (#LD-504)" },
      { id: "ACT-31", type: "Proposal Sent", date: "20 Aug 2026, 04:30 PM", user: "Vikram Malhotra", notes: "Sent group contract with 10% commission agreement." },
      { id: "ACT-32", type: "Stage Change", date: "26 Aug 2026, 12:00 PM", user: "Vikram Malhotra", notes: "Moved to Final Decision. Client approved terms." },
    ],
    createdDate: "18 Aug 2026",
  },
  {
    id: "OPP-305",
    dealName: "Singhania Destination 3-Day Wedding",
    leadId: "LD-505",
    stage: "Won",
    status: "Won",
    customerName: "Rakesh Singhania",
    companyName: "Singhania Group",
    contactPerson: "Rakesh Singhania",
    mobile: "+91 98220 11990",
    email: "rakesh@singhaniagroup.com",
    preferredContactMethod: "Phone",
    leadType: "Wedding",
    customerRequirement: "Full hotel buyout for 3 days: Sangeet, Mehendi, Wedding Ceremony & Reception.",
    expectedEventDate: "2026-12-10",
    guestCount: 500,
    expectedRoomNights: 360,
    venueRequired: "Grand Ballroom, Royal Lawn & Poolside",
    leadSource: "Walk-In",
    dealValue: 4200000,
    quotedValue: 4500000,
    expectedRevenue: 4200000,
    expectedCloseDate: "2026-08-25",
    paymentTerms: "50% Advance Received, Balance 15 Days Prior",
    assignedExecutive: "Vikram Malhotra",
    nextActionSummary: "Deal Won! Advance of ₹21.00L received. Ready for Event Booking creation.",
    quotations: [
      {
        id: "QTN-007",
        versionName: "Full Resort Buyout Contract",
        date: "15 Aug 2026",
        amount: 4200000,
        status: "Accepted",
        inclusions: "Full hotel buyout, 3-day banquet catering, decor, bridal suites, 120 rooms x 3 nights.",
        validUntil: "25 Aug 2026",
      },
    ],
    tentativeHold: {
      venueName: "Grand Ballroom, Royal Lawn & Poolside",
      startDate: "2026-12-10",
      endDate: "2026-12-13",
      holdExpiryDate: "2026-08-25",
      holdStatus: "Converted to Booking",
      holdNotes: "Token advance received; hold converted to confirmed booking queue.",
    },
    activities: [
      { id: "ACT-40", type: "Note", date: "10 Aug 2026, 10:00 AM", user: "System", notes: "Lead Record Linked (#LD-505)" },
      { id: "ACT-41", type: "Proposal Sent", date: "15 Aug 2026, 05:00 PM", user: "Vikram Malhotra", notes: "Contract signed and 50% advance payment receipt confirmed." },
      { id: "ACT-42", type: "Stage Change", date: "25 Aug 2026, 02:00 PM", user: "Vikram Malhotra", notes: "Deal Won! Advance received. Moved to Booking Queue." },
    ],
    createdDate: "10 Aug 2026",
  },
  {
    id: "OPP-306",
    dealName: "Infosys Q3 Tech Innovation Summit",
    leadId: "LD-506",
    stage: "Requirement Analysis",
    status: "Open",
    customerName: "Priya Menon",
    companyName: "Infosys Ltd",
    contactPerson: "Priya Menon (HR Lead)",
    mobile: "+91 98112 88990",
    email: "priya.m@infosys.com",
    preferredContactMethod: "Email",
    leadType: "Corporate Booking",
    customerRequirement: "Tech summit for 200 developers with high-speed internet and hackathon seating.",
    expectedEventDate: "2026-10-15",
    guestCount: 200,
    expectedRoomNights: 80,
    venueRequired: "Convention Hall B",
    leadSource: "Website",
    dealValue: 720000,
    quotedValue: 780000,
    expectedRevenue: 720000,
    expectedCloseDate: "2026-09-15",
    assignedExecutive: "Jay Kumar",
    nextActionSummary: "Requirements call scheduled for 29 Aug at 4:00 PM with Tech Lead",
    nextCallDate: "2026-08-29",
    nextCallTime: "04:00 PM",
    quotations: [],
    tentativeHold: undefined,
    activities: [
      { id: "ACT-50", type: "Phone Call", date: "19 Aug 2026, 03:00 PM", user: "Jay Kumar", notes: "Introductory call to understand hackathon AV requirements." },
    ],
    createdDate: "18 Aug 2026",
  },
  {
    id: "OPP-307",
    dealName: "Apex Events Annual Fashion Awards",
    leadId: "LD-507",
    stage: "Qualification",
    status: "Open",
    customerName: "Dr. Alok Nath",
    companyName: "Apex Event Management Co.",
    contactPerson: "Dr. Alok Nath",
    mobile: "+91 98221 66778",
    email: "alok@apexevents.in",
    preferredContactMethod: "Phone",
    leadType: "Restaurant Event",
    customerRequirement: "Private lounge buyout for 120 guests with signature cocktails.",
    expectedEventDate: "2026-11-05",
    guestCount: 120,
    venueRequired: "Saffron Lounge & Terrace",
    leadSource: "Direct Inquiry",
    dealValue: 650000,
    quotedValue: 700000,
    expectedRevenue: 650000,
    expectedCloseDate: "2026-09-20",
    assignedExecutive: "Jay Kumar",
    nextActionSummary: "Discovery call scheduled for 30 Aug at 10:00 AM",
    nextCallDate: "2026-08-30",
    nextCallTime: "10:00 AM",
    quotations: [],
    tentativeHold: undefined,
    activities: [
      { id: "ACT-60", type: "Phone Call", date: "19 Aug 2026, 11:30 AM", user: "Jay Kumar", notes: "Qualification call on guest numbers and catering style." },
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
    quotations: [],
    tentativeHold: undefined,
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

    applyStageChange(deal, next);
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

    applyStageChange(targetDeal, targetStage);
  };

  // Core Stage Changer with Audit Log Creation
  const applyStageChange = (deal: HotelDealItem, targetStage: HotelDealStage, extraAuditNotes?: string) => {
    const previousStage = deal.stage;
    const newStatus: HotelDealStatus = targetStage === "Won" ? "Won" : targetStage === "Lost" ? "Lost" : "Open";

    const auditActivity: DealActivity = {
      id: `ACT-${Date.now()}`,
      type: "Stage Change",
      date: "Today 12:45 PM",
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
          ? `Venue on Tentative Hold until ${deal.tentativeHold?.holdExpiryDate || "30 Aug 2026"}.`
          : `Advanced to ${targetStage}. Awaiting next action.`,
      activities: [auditActivity, ...deal.activities],
    };

    setDeals((prev) => prev.map((d) => (d.id === deal.id ? updatedDeal : d)));
    if (selectedDeal?.id === deal.id) {
      setSelectedDeal(updatedDeal);
    }

    setToastMessage(`🚀 Deal "${updatedDeal.dealName}" moved to "${targetStage}"!`);
  };

  // Handle Save Tentative Hold
  const handleSaveTentativeHold = (e: React.FormEvent) => {
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
          date: "Today 12:45 PM",
          user: holdDealTarget.assignedExecutive,
          notes: auditNotes,
          purpose: "Venue Reservation Hold",
          status: "Completed",
        },
        ...holdDealTarget.activities,
      ],
    };

    setDeals((prev) => prev.map((d) => (d.id === holdDealTarget.id ? updatedDeal : d)));
    if (selectedDeal?.id === holdDealTarget.id) {
      setSelectedDeal(updatedDeal);
    }

    setIsHoldModalOpen(false);
    setHoldDealTarget(null);
    setToastMessage(`🔒 Placed Tentative Hold on "${holdDetails.venueName}" until ${holdDetails.holdExpiryDate}!`);
  };

  // Handle Create Quotation Revision (QTN)
  const handleCreateQuotationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeal) return;

    const newQtnId = `QTN-${String(selectedDeal.quotations.length + 1).padStart(3, "0")}`;
    const newQuotation: DealQuotation = {
      id: newQtnId,
      versionName: qtnVersionName.trim() || `Quotation Revision #${selectedDeal.quotations.length + 1}`,
      date: "Today 01:00 PM",
      amount: Number(qtnAmount) || selectedDeal.dealValue,
      status: "Sent",
      inclusions: qtnInclusions.trim() || undefined,
      validUntil: qtnValidUntil,
    };

    // Supersede previous active quotations if any
    const updatedQuotations = selectedDeal.quotations.map((q) =>
      q.status === "Sent" ? { ...q, status: "Superseded" as const } : q
    );

    const auditActivity: DealActivity = {
      id: `ACT-${Date.now()}`,
      type: "Proposal Sent",
      date: "Today 01:00 PM",
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

    setDeals((prev) => prev.map((d) => (d.id === selectedDeal.id ? updatedDeal : d)));
    setSelectedDeal(updatedDeal);
    setIsQuotationModalOpen(false);
    setToastMessage(`✓ Created and issued Quotation #${newQtnId}!`);
  };

  // Handle Save Activity from Modal (Scheduled vs Completed)
  const handleSaveActivity = (payload: ActivityPayload) => {
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

    // Dynamically update immediate next action on deal card
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

    setDeals((prev) => prev.map((d) => (d.id === selectedDeal.id ? updatedDeal : d)));
    setSelectedDeal(updatedDeal);
    setIsAddActivityModalOpen(false);
    setToastMessage(`✓ Logged activity "${payload.subject}"!`);
  };

  // Handle Mark Lost Confirm
  const handleConfirmMarkLost = (e: React.FormEvent) => {
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
          date: "Today 01:15 PM",
          user: dealToMarkLost.assignedExecutive,
          notes: `Marked Lost: ${lostReasonInput}. ${lostNotesInput.trim()}`,
          purpose: "Opportunity Closeout",
          status: "Completed",
        },
        ...dealToMarkLost.activities,
      ],
    };

    setDeals((prev) => prev.map((d) => (d.id === dealToMarkLost.id ? updatedDeal : d)));
    if (selectedDeal?.id === dealToMarkLost.id) {
      setSelectedDeal(updatedDeal);
    }

    setIsLostModalOpen(false);
    setDealToMarkLost(null);
    setToastMessage(`✓ Opportunity #${updatedDeal.id} marked as Lost.`);
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
  const handleCreateDealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createDealName.trim() || !createCustomerName.trim() || !createMobile.trim()) return;

    const newDealId = `OPP-${300 + deals.length + 1}`;
    const newDeal: HotelDealItem = {
      id: newDealId,
      dealName: createDealName.trim(),
      leadId: createLeadIdSelect || `LD-${newDealId}`,
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
      expectedEventDate: "2026-11-20",
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
          date: "Today 12:00 PM",
          user: createExecutive,
          notes: `Opportunity #${newDealId} created from Qualified Lead (#${createLeadIdSelect || "Direct"}).`,
          status: "Completed",
          purpose: "Opportunity Inception",
        },
      ],
      createdDate: "29 Aug 2026",
    };

    setDeals([newDeal, ...deals]);
    setIsCreateModalOpen(false);
    setToastMessage(`✓ Created Sales Opportunity #${newDeal.id} for ${newDeal.dealName}!`);
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
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: PIPELINE COMMERCIAL KPI CARDS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <HRKPICard
          label="Total Active Deals"
          value={`${kpiMetrics.totalCount}`}
          subtitle={`${kpiMetrics.openCount} In Active Pipeline`}
          tone="emerald"
          icon={<Briefcase className="h-5 w-5" />}
        />
        <HRKPICard
          label="Pipeline Value"
          value={`₹${(kpiMetrics.totalPipelineValue / 100000).toFixed(1)}L`}
          subtitle="Weighted Commercial Value"
          tone="purple"
          icon={<DollarSign className="h-5 w-5" />}
        />
        <HRKPICard
          label="Won Bookings Value"
          value={`₹${(kpiMetrics.wonValue / 100000).toFixed(1)}L`}
          subtitle={`${kpiMetrics.wonCount} Deals Won This Month`}
          tone="blue"
          icon={<Award className="h-5 w-5" />}
        />
        <HRKPICard
          label="Conversion Velocity"
          value="68.5%"
          subtitle="Qualified to Won Rate"
          tone="amber"
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: SEARCH & FILTER TOOLBAR
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs mb-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Deal Name, Opportunity ID (#OPP-301), Client, Company, or Lead ID (#LD-502)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-200 pl-9 pr-3 py-2 bg-slate-50 font-medium text-slate-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {/* Stage Filter */}
          <select
            value={selectedStageFilter}
            onChange={(e) => setSelectedStageFilter(e.target.value)}
            className="text-xs font-semibold rounded-lg border border-slate-200 py-2 px-3 bg-white text-slate-700 focus:outline-none"
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
            className="text-xs font-semibold rounded-lg border border-slate-200 py-2 px-3 bg-white text-slate-700 focus:outline-none"
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
            className="text-xs font-semibold rounded-lg border border-slate-200 py-2 px-3 bg-white text-slate-700 focus:outline-none"
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
                      <span className="text-[11px] font-mono font-bold text-emerald-800 block">
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
                          className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs hover:shadow-xs hover:border-slate-300 transition cursor-grab active:cursor-grabbing space-y-2"
                        >
                          {/* Card Top: Booking Type Pill & Deal ID */}
                          <div className="flex items-center justify-between">
                            <span className="bg-purple-50 text-purple-800 border border-purple-200 px-1.5 py-0.5 rounded text-[10px] font-semibold truncate max-w-[120px]">
                              {deal.leadType}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400 font-semibold">
                              #{deal.id}
                            </span>
                          </div>

                          {/* Deal Title & Company */}
                          <div>
                            <h4 className="font-bold text-xs text-slate-900 leading-tight">
                              {deal.dealName}
                            </h4>
                            <span className="text-[10px] text-slate-500 font-medium block truncate">
                              {deal.companyName || deal.customerName} (Lead: #{deal.leadId})
                            </span>
                          </div>

                          {/* Commercial Value & Target Date */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                            <strong className="text-emerald-900 font-mono font-bold text-xs">
                              ₹{deal.dealValue.toLocaleString("en-IN")}
                            </strong>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {deal.expectedEventDate || "Date TBD"}
                            </span>
                          </div>

                          {/* Tentative Hold Badge if active */}
                          {deal.tentativeHold && (
                            <div className="bg-amber-50 border border-amber-200 p-1 rounded-md text-[10px] text-amber-900 flex items-center justify-between font-medium">
                              <span className="truncate flex items-center gap-1">
                                <Timer className="h-3 w-3 text-amber-700 shrink-0" />
                                Hold until {deal.tentativeHold.holdExpiryDate}
                              </span>
                            </div>
                          )}

                          {/* Quotation Badge if quotations exist */}
                          {deal.quotations.length > 0 && (
                            <div className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] text-slate-700 flex items-center justify-between">
                              <span className="font-medium">
                                QTN: #{deal.quotations[0].id} ({deal.quotations.length} Revs)
                              </span>
                              <span className="font-mono font-bold text-emerald-800 text-[10px]">
                                ₹{(deal.quotedValue || deal.dealValue).toLocaleString("en-IN")}
                              </span>
                            </div>
                          )}

                          {/* Immediate Next Action Strip (Driven by Activity) */}
                          <div className="bg-slate-50 rounded-lg p-1.5 border border-slate-100 text-[10px] space-y-0.5">
                            <span className="text-slate-400 font-bold uppercase text-[9px] block">
                              Immediate Next Action
                            </span>
                            <p className="text-slate-700 font-medium leading-tight truncate">
                              {deal.nextActionSummary || "No upcoming activity scheduled"}
                            </p>
                          </div>

                          {/* Executive & Contact Footer */}
                          <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                            <span className="truncate max-w-[130px] font-medium text-slate-600">
                              👤 {deal.assignedExecutive}
                            </span>
                            <a
                              href={`tel:${deal.mobile}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-emerald-700 hover:text-emerald-800 p-0.5 font-mono font-semibold"
                            >
                              📞 {deal.mobile}
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Opportunity ID</th>
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
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredDeals.map((deal) => (
                  <tr
                    key={deal.id}
                    onClick={() => {
                      setSelectedDeal(deal);
                      setDrawerTab("overview");
                    }}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800">
                      #{deal.id}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {deal.dealName}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <span className="block font-medium">{deal.companyName || deal.customerName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{deal.mobile}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                        {deal.leadType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-900">
                      ₹{deal.dealValue.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold">
                        {deal.stage}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px] truncate max-w-[200px]">
                      {deal.nextActionSummary || "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {deal.assignedExecutive}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDeal(deal);
                          setDrawerTab("overview");
                        }}
                        className="text-[11px] font-semibold rounded-lg px-2.5 h-7 cursor-pointer"
                      >
                        View
                      </Button>
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
                    onClick={() => applyStageChange(selectedDeal, "Qualification", "Reopened opportunity back to Qualification")}
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
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-emerald-800 block">
                    Opportunity #{selectedDeal.id} (Linked Lead: #{selectedDeal.leadId})
                  </span>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {selectedDeal.dealName}
                  </h3>
                  <span className="text-xs text-slate-600 font-medium">
                    {selectedDeal.companyName || selectedDeal.customerName} • {selectedDeal.contactPerson}
                  </span>
                </div>

                <div className="text-right space-y-1">
                  <span className="text-sm font-black font-mono text-emerald-900 block">
                    ₹{selectedDeal.dealValue.toLocaleString("en-IN")}
                  </span>
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block",
                      selectedDeal.status === "Won"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : selectedDeal.status === "Lost"
                        ? "bg-rose-100 text-rose-800 border-rose-200"
                        : "bg-slate-200 text-slate-800 border-slate-300"
                    )}
                  >
                    Stage: {selectedDeal.stage}
                  </span>
                </div>
              </div>

              {/* Immediate Next Action Banner (Driven dynamically by Activity) */}
              <div className="bg-emerald-50/80 border border-emerald-200 p-2.5 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1">
                  <Clock className="h-3 w-3 text-emerald-700" /> Immediate Next Action
                </span>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">
                  {selectedDeal.nextActionSummary || "No immediate next action configured."}
                </p>
              </div>
            </div>

            {/* Clean Tabs */}
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
                📋 Overview &amp; Requirements
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
                💰 Commercials &amp; Terms
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
                📜 Quotations ({selectedDeal.quotations.length})
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
                🏛️ Hold Details {selectedDeal.tentativeHold ? "🔒" : ""}
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
                📞 Activities ({selectedDeal.activities.length})
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
                ⏱️ Stage Timeline
              </button>
            </div>

            {/* ── TAB 1: OVERVIEW & EVENT REQUIREMENTS ── */}
            {drawerTab === "overview" && (
              <div className="space-y-3.5">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2.5">
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-emerald-700" /> Client &amp; Contact Information
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
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
                      <span className="font-mono font-semibold text-emerald-800">{selectedDeal.mobile}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Email Address:</span>
                      <span className="font-mono text-slate-800">{selectedDeal.email || "Not Provided"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Linked Lead ID:</span>
                      <span className="font-mono font-bold text-slate-900">#{selectedDeal.leadId}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Assigned Executive:</span>
                      <span className="font-semibold text-slate-800">{selectedDeal.assignedExecutive}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2.5">
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                    <Tag className="h-3.5 w-3.5 text-purple-700" /> Event &amp; Booking Specifications
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Event Booking Type:</span>
                      <strong className="text-purple-900">{selectedDeal.leadType}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Expected Date:</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {selectedDeal.expectedEventDate || "Not Provided"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Requested Venue:</span>
                      <strong className="text-slate-900 font-semibold">{selectedDeal.venueRequired || "Grand Ballroom"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Expected Guest Pax:</span>
                      <strong className="text-slate-900 font-mono">
                        {selectedDeal.guestCount ? `${selectedDeal.guestCount} Guests` : "Not Provided"}
                      </strong>
                    </div>
                    {selectedDeal.expectedRoomNights && (
                      <div>
                        <span className="text-slate-400 text-[10px] block">Room Block Nights:</span>
                        <strong className="text-slate-900 font-mono">{selectedDeal.expectedRoomNights} Room Nights</strong>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-400 text-[10px] block">Target Close Date:</span>
                      <span className="font-mono text-slate-700">{selectedDeal.expectedCloseDate}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-400 text-[10px] font-bold block mb-1">
                      Customer Requirements &amp; Notes:
                    </span>
                    <p className="text-slate-700 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed font-medium">
                      {selectedDeal.customerRequirement}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: COMMERCIALS & TERMS ── */}
            {drawerTab === "commercials" && (
              <div className="space-y-3.5">
                <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Deal Commercial Value</span>
                  <h3 className="text-2xl font-black text-emerald-400 font-mono">
                    ₹{selectedDeal.dealValue.toLocaleString("en-IN")}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Quoted Tariff:</span>
                      <strong className="text-white font-mono">
                        ₹{(selectedDeal.quotedValue || selectedDeal.dealValue).toLocaleString("en-IN")}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Discount / Rate Agreement:</span>
                      <span className="text-amber-300 font-semibold">{selectedDeal.discountOffered || "Standard Tariff"}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1.5">
                    Payment &amp; Credit Agreement
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Agreed Payment Terms:</span>
                      <strong className="text-slate-800">{selectedDeal.paymentTerms || "Standard 50% Advance on Booking"}</strong>
                    </div>
                    {selectedDeal.creditTerms && (
                      <div>
                        <span className="text-slate-400 text-[10px] block">Corporate Credit SLA:</span>
                        <span className="text-blue-800 font-semibold">{selectedDeal.creditTerms}</span>
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
                  applyStageChange(dealToMarkWon, "Won", "Deal confirmed Won and routed to Booking Queue.");
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
