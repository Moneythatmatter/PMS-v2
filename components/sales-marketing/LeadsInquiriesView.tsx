"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Phone,
  Mail,
  Building2,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  Tag,
  ArrowRight,
  TrendingUp,
  X,
  Upload,
  FileSpreadsheet,
  Zap,
  Globe,
  History,
  AlertCircle,
  Check,
  SlidersHorizontal,
  Edit2,
  RotateCcw,
  Layers,
  Inbox,
  UserCheck,
  Briefcase,
  HelpCircle,
  Eye,
  ExternalLink,
  FileText,
  MoreHorizontal,
  PhoneCall,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Card, Drawer, Modal, ActionMenu, ActionMenuItem } from "@/components/ui";
import { cn } from "@/lib/utils";
import { CsvLeadImportModal } from "./shared/CsvLeadImportModal";

// ─────────────────────────────────────────────────────────────
// 1. DATA TYPES & SCHEMAS (HOTEL PMS V1 MASTER SPEC)
// ─────────────────────────────────────────────────────────────

export type BookingType =
  | "Room Booking"
  | "Banquet Event"
  | "Conference"
  | "Restaurant"
  | "Swimming Pool"
  | "Private Event"
  | "Other";

export type LeadType =
  | BookingType
  | "Wedding"
  | "Corporate Booking"
  | "Travel Group"
  | "Restaurant Event"
  | "Wedding Event";

export type LeadSource =
  | "Google Ads"
  | "Meta Ads"
  | "Website"
  | "Phone Inquiry"
  | "Phone Call"
  | "Walk-In"
  | "WhatsApp"
  | "Email"
  | "Referral"
  | "Corporate Inquiry"
  | "Corporate Reference"
  | "Marketing Campaign"
  | "OTA"
  | "Travel Agent"
  | "Other"
  | "Direct Inquiry";

export type LeadStatus = "New" | "Contacted" | "Qualified" | "Converted" | "Lost" | "Disqualified" | "In Pipeline" | "Won";

export type LeadPriority = "High" | "Medium" | "Low";

export type PipelineStage =
  | "Qualification"
  | "Requirement Analysis"
  | "Quotation / Proposal"
  | "Negotiation"
  | "Tentative Hold"
  | "Tentative Booking"
  | "Final Decision"
  | "Won"
  | "Lost"
  | "Not in Pipeline";

export type ImportedVia =
  | "CSV Import"
  | "Manual Entry"
  | "Website"
  | "Walk-In"
  | "Phone Inquiry"
  | "WhatsApp";

export interface ActivityTimelineItem {
  action: string;
  user: string;
  date: string;
  notes?: string;
}

export interface LeadTimelineEvent {
  id: string;
  date: string;
  title: string;
  actor: string;
  notes?: string;
}

export interface HotelLeadItem {
  id?: string;
  leadId?: string;
  leadName?: string;
  companyName?: string;
  contactPerson?: string;
  mobile?: string;
  mobileNumber?: string;
  email?: string;
  city?: string;
  preferredContactMethod?: string;
  leadType?: any;
  leadSource?: any;
  inquiryDate?: string;
  expectedEventDate?: string;
  guestCount?: number;
  expectedRevenue?: string | number;
  rawRevenue?: number;
  budgetRange?: string;
  assignedExecutive?: string;
  priority?: LeadPriority;
  status?: any;
  pipelineStage?: string;
  customerRequirement?: string;
  specialRequirements?: string;
  customerRequirements?: string;
  additionalNotes?: string;
  createdDate?: string;
  campaignId?: string | null;
  campaignName?: string | null;
  activityTimeline?: ActivityTimelineItem[];
  timeline?: LeadTimelineEvent[];
}

export interface LeadRecordItem {
  id: string; // e.g. "LEAD-001" or "LD-501"
  leadName: string;
  contactPerson: string;
  mobileNumber: string;
  mobile?: string; // alias
  email?: string;
  companyName?: string;
  city?: string;
  preferredContactMethod?: "Phone Call" | "WhatsApp" | "Email" | "Phone";

  // Inquiry Information
  bookingType: BookingType;
  leadType?: any;
  eventDate?: string; // Expected Event / Stay Date (YYYY-MM-DD)
  expectedEventDate?: string;
  guestCount?: number; // Expected Guest Count
  estimatedRevenue?: number; // Estimated / Expected Revenue
  rawRevenue?: number;
  expectedRevenue?: string | number;
  budgetRange?: string;
  priority: LeadPriority;
  customerRequirements: string; // Customer Requirements *
  customerRequirement?: string;
  specialRequirements?: string;

  // Marketing Attribution
  leadSource: LeadSource;
  campaignId?: string | null; // e.g. "CAMP-001" or null
  campaignName?: string | null; // e.g. "Wedding Campaign 2026" or null
  promotionCode?: string | null;
  promotionName?: string | null;
  importedVia: ImportedVia;
  createdDate: string; // YYYY-MM-DD

  // Operational Handling
  assignedExecutive: string;
  status: LeadStatus;
  pipelineStage?: string;

  // Pipeline Linkage (If Converted)
  linkedDealId?: string; // e.g. "DEAL-301"
  linkedDealStage?: string; // e.g. "Qualification" or "Negotiation"

  // Lead Timeline (Only Lead-Level Events)
  timeline: LeadTimelineEvent[];
  activityTimeline?: ActivityTimelineItem[];
}

export type CentralLeadItem = LeadRecordItem;

export const isUuidOrHash = (val: string | undefined): boolean => {
  if (!val) return false;
  return (
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val.trim()) ||
    /^[0-9a-fA-F]{16,}$/.test(val.trim())
  );
};

export const sanitizeDisplayDate = (val: string | undefined): string => {
  if (!val || isUuidOrHash(val)) return "2026-11-15";
  return val;
};

export const sanitizeDisplayBudget = (val: string | undefined): string => {
  if (!val || isUuidOrHash(val)) return "₹3,00,000 - ₹5,00,000";
  const digits = val.replace(/[^0-9]/g, "");
  if (digits.length > 8) return "₹3,00,000 - ₹5,00,000";
  return val;
};

// ─────────────────────────────────────────────────────────────
// 2. INITIAL MOCK LEADS DIRECTORY
// ─────────────────────────────────────────────────────────────

export const INITIAL_LEADS: LeadRecordItem[] = [
  {
    id: "LEAD-001",
    leadName: "Rajesh Sharma",
    contactPerson: "Rajesh Sharma",
    mobileNumber: "+91 98765 43210",
    mobile: "+91 98765 43210",
    email: "rajesh.sharma@sharmagroup.in",
    city: "Mumbai",
    companyName: "Sharma Family Enterprise",
    preferredContactMethod: "Phone Call",
    bookingType: "Banquet Event",
    eventDate: "2026-11-15",
    expectedEventDate: "2026-11-15",
    guestCount: 400,
    estimatedRevenue: 850000,
    rawRevenue: 850000,
    expectedRevenue: "₹8,50,000",
    budgetRange: "₹8,00,000 - ₹10,00,000",
    priority: "High",
    customerRequirements: "Looking for Grand Ballroom + Poolside Lawn for Wedding Reception. Pure veg catering required for 400 guests.",
    specialRequirements: "Looking for Grand Ballroom + Poolside Lawn for Wedding Reception. Pure veg catering required for 400 guests.",
    customerRequirement: "Looking for Grand Ballroom + Poolside Lawn for Wedding Reception. Pure veg catering required for 400 guests.",
    leadSource: "Google Ads",
    campaignId: "CAMP-001",
    campaignName: "Wedding Campaign 2026",
    promotionCode: "WEDDING2026",
    promotionName: "WEDDING2026",
    importedVia: "CSV Import",
    createdDate: "2026-08-28",
    assignedExecutive: "Vikram Malhotra",
    status: "Converted",
    linkedDealId: "DEAL-801",
    linkedDealStage: "Negotiation",
    timeline: [
      { id: "T-1", date: "2026-08-28 10:30 AM", title: "Lead Imported via Google Ads CSV", actor: "System Engine" },
      { id: "T-2", date: "2026-08-28 10:35 AM", title: "Assigned to Vikram Malhotra", actor: "Auto-Assignment Engine" },
      { id: "T-3", date: "2026-08-28 11:15 AM", title: "Introductory Discovery Call Completed", actor: "Vikram Malhotra", notes: "Client confirmed dates & ballroom preference." },
      { id: "T-4", date: "2026-08-28 01:00 PM", title: "Converted to Active Deal (#DEAL-801)", actor: "Vikram Malhotra" },
    ],
  },
  {
    id: "LEAD-002",
    leadName: "TechCorp Global Offsite",
    contactPerson: "Meera Kapoor",
    mobileNumber: "+91 98200 99881",
    mobile: "+91 98200 99881",
    email: "meera.k@techcorp.io",
    city: "Bangalore",
    companyName: "TechCorp Global Solutions",
    preferredContactMethod: "Email",
    bookingType: "Conference",
    eventDate: "2026-09-20",
    expectedEventDate: "2026-09-20",
    guestCount: 50,
    estimatedRevenue: 450000,
    rawRevenue: 450000,
    expectedRevenue: "₹4,50,000",
    budgetRange: "₹4,00,000 - ₹5,00,000",
    priority: "High",
    customerRequirements: "Need Executive Boardroom for 2 days with hybrid Zoom setup, dual mics, and executive business lunch.",
    specialRequirements: "Need Executive Boardroom for 2 days with hybrid Zoom setup, dual mics, and executive business lunch.",
    customerRequirement: "Need Executive Boardroom for 2 days with hybrid Zoom setup, dual mics, and executive business lunch.",
    leadSource: "Website",
    campaignId: "CAMP-002",
    campaignName: "Corporate Direct 2026",
    promotionCode: null,
    importedVia: "Website",
    createdDate: "2026-08-27",
    assignedExecutive: "Ananya Roy",
    status: "Qualified",
    timeline: [
      { id: "T-5", date: "2026-08-27 02:00 PM", title: "Inquiry Submitted via Website Form", actor: "Website Webhook" },
      { id: "T-6", date: "2026-08-27 03:30 PM", title: "Discovery Call Completed", actor: "Ananya Roy", notes: "Client requested quotation for 50 attendees" },
      { id: "T-7", date: "2026-08-28 11:00 AM", title: "Lead Marked as Qualified", actor: "Ananya Roy", notes: "Decision maker confirmed budget approval." },
    ],
  },
  {
    id: "LEAD-003",
    leadName: "Sanjay Oberoi Silver Anniversary",
    contactPerson: "Sanjay Oberoi",
    mobileNumber: "+91 98112 55443",
    mobile: "+91 98112 55443",
    email: "sanjay@oberoiind.com",
    city: "Delhi NCR",
    companyName: "Oberoi Industries",
    preferredContactMethod: "Phone Call",
    bookingType: "Banquet Event",
    eventDate: "2026-10-05",
    expectedEventDate: "2026-10-05",
    guestCount: 150,
    estimatedRevenue: 320000,
    rawRevenue: 320000,
    expectedRevenue: "₹3,20,000",
    budgetRange: "₹3,00,000 - ₹4,00,000",
    priority: "Medium",
    customerRequirements: "Rooftop Terrace Garden setup with live acoustic music and international cocktail menu.",
    specialRequirements: "Rooftop Terrace Garden setup with live acoustic music and international cocktail menu.",
    customerRequirement: "Rooftop Terrace Garden setup with live acoustic music and international cocktail menu.",
    leadSource: "Phone Inquiry",
    campaignId: null,
    campaignName: null,
    promotionCode: null,
    importedVia: "Phone Inquiry",
    createdDate: "2026-08-26",
    assignedExecutive: "Vikram Malhotra",
    status: "Contacted",
    timeline: [
      { id: "T-8", date: "2026-08-26 11:00 AM", title: "Direct Inbound Call Received", actor: "Front Desk Reception" },
      { id: "T-9", date: "2026-08-26 11:15 AM", title: "Assigned to Vikram Malhotra", actor: "Sales Lead" },
      { id: "T-10", date: "2026-08-26 04:00 PM", title: "Initial Follow-up Call Logged", actor: "Vikram Malhotra", notes: "Sent preliminary rooftop brochure via WhatsApp." },
    ],
  },
  {
    id: "LEAD-004",
    leadName: "Amitabh Choudhury Staycation",
    contactPerson: "Amitabh Choudhury",
    mobileNumber: "+91 98330 77661",
    mobile: "+91 98330 77661",
    email: "amitabh.c@gmail.com",
    city: "Kolkata",
    companyName: "Self / Family",
    preferredContactMethod: "WhatsApp",
    bookingType: "Room Booking",
    eventDate: "2026-09-01",
    expectedEventDate: "2026-09-01",
    guestCount: 12,
    estimatedRevenue: 120000,
    rawRevenue: 120000,
    expectedRevenue: "₹1,20,000",
    budgetRange: "₹1,00,000 - ₹1,50,000",
    priority: "Low",
    customerRequirements: "Weekend family getaway booking 4 Deluxe rooms with complimentary breakfast.",
    specialRequirements: "Weekend family getaway booking 4 Deluxe rooms with complimentary breakfast.",
    customerRequirement: "Weekend family getaway booking 4 Deluxe rooms with complimentary breakfast.",
    leadSource: "Walk-In",
    campaignId: null,
    campaignName: null,
    promotionCode: null,
    importedVia: "Walk-In",
    createdDate: "2026-08-28",
    assignedExecutive: "Rohan Varma",
    status: "New",
    timeline: [
      { id: "T-11", date: "2026-08-28 09:00 AM", title: "Walk-In Inquiry Logged", actor: "Rohan Varma" },
    ],
  },
  {
    id: "LEAD-005",
    leadName: "Dr. Vikram Sethi Healthcare Gala",
    contactPerson: "Dr. Vikram Sethi",
    mobileNumber: "+91 98112 33445",
    mobile: "+91 98112 33445",
    email: "v.sethi@healthcarecorp.com",
    city: "Hyderabad",
    companyName: "Healthcare Corp India",
    preferredContactMethod: "Email",
    bookingType: "Restaurant",
    eventDate: "2026-10-18",
    expectedEventDate: "2026-10-18",
    guestCount: 200,
    estimatedRevenue: 620000,
    rawRevenue: 620000,
    expectedRevenue: "₹6,20,000",
    budgetRange: "₹5,00,000 - ₹7,00,000",
    priority: "High",
    customerRequirements: "Saffron Fine Dining private buyout for doctors association annual awards gala dinner.",
    specialRequirements: "Saffron Fine Dining private buyout for doctors association annual awards gala dinner.",
    customerRequirement: "Saffron Fine Dining private buyout for doctors association annual awards gala dinner.",
    leadSource: "Corporate Inquiry",
    campaignId: null,
    campaignName: null,
    promotionCode: null,
    importedVia: "Manual Entry",
    createdDate: "2026-08-25",
    assignedExecutive: "Ananya Roy",
    status: "Qualified",
    timeline: [
      { id: "T-12", date: "2026-08-25 01:00 PM", title: "Corporate Inquiry Created", actor: "Ananya Roy" },
      { id: "T-13", date: "2026-08-26 10:00 AM", title: "Requirements Verified & Qualified", actor: "Ananya Roy" },
    ],
  },
  {
    id: "LEAD-006",
    leadName: "Tanya Oberoi Fashion Trunk Show",
    contactPerson: "Tanya Oberoi",
    mobileNumber: "+91 98199 44556",
    mobile: "+91 98199 44556",
    email: "tanya.oberoi@fashion.in",
    city: "Mumbai",
    companyName: "Oberoi Fashion Studio",
    preferredContactMethod: "Phone Call",
    bookingType: "Private Event",
    eventDate: "2026-09-05",
    expectedEventDate: "2026-09-05",
    guestCount: 300,
    estimatedRevenue: 550000,
    rawRevenue: 550000,
    expectedRevenue: "₹5,50,000",
    budgetRange: "₹5,00,000 - ₹6,00,000",
    priority: "Medium",
    customerRequirements: "Exhibition hall space for fashion designer trunk show and pop-up boutiques.",
    specialRequirements: "Exhibition hall space for fashion designer trunk show and pop-up boutiques.",
    customerRequirement: "Exhibition hall space for fashion designer trunk show and pop-up boutiques.",
    leadSource: "Referral",
    campaignId: null,
    campaignName: null,
    promotionCode: null,
    importedVia: "Manual Entry",
    createdDate: "2026-08-20",
    assignedExecutive: "Vikram Malhotra",
    status: "Lost",
    timeline: [
      { id: "T-14", date: "2026-08-20 11:00 AM", title: "Referral Lead Logged", actor: "Vikram Malhotra" },
      { id: "T-15", date: "2026-08-23 04:30 PM", title: "Client Selected Alternative Venue", actor: "Vikram Malhotra", notes: "Client postponed trunk show to next quarter." },
    ],
  },
];

export function LeadsInquiriesView() {
  const router = useRouter();
  const [leads, setLeads] = useState<LeadRecordItem[]>(INITIAL_LEADS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Drawer States
  const [selectedLead, setSelectedLead] = useState<LeadRecordItem | null>(null);
  const [drawerTab, setDrawerTab] = useState<"overview" | "timeline">("overview");

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  // Action Modal States (Refined Lead Lifecycle)
  const [contactingLead, setContactingLead] = useState<LeadRecordItem | null>(null);
  const [contactForm, setContactForm] = useState({
    method: "Phone Call" as "Phone Call" | "WhatsApp" | "Email" | "Walk-in Meeting",
    notes: "",
  });

  const [notingLead, setNotingLead] = useState<LeadRecordItem | null>(null);
  const [noteText, setNoteText] = useState("");

  const [movingLead, setMovingLead] = useState<LeadRecordItem | null>(null);
  const [moveForm, setMoveForm] = useState({
    dealName: "",
    expectedRevenue: 500000,
    assignedExecutive: "Vikram Malhotra",
  });

  // Create Form State (<1 min entry)
  const [createForm, setCreateForm] = useState({
    leadName: "",
    contactPerson: "",
    mobileNumber: "",
    email: "",
    companyName: "",
    city: "",
    preferredContactMethod: "Phone Call" as "Phone Call" | "WhatsApp" | "Email",
    bookingType: "Banquet Event" as BookingType,
    leadSource: "Google Ads" as LeadSource,
    campaignName: "",
    eventDate: "2026-11-20",
    guestCount: 150,
    estimatedRevenue: 450000,
    priority: "Medium" as LeadPriority,
    assignedExecutive: "Vikram Malhotra",
    customerRequirements: "",
  });

  // Edit Form State (Progressive profiling)
  const [editForm, setEditForm] = useState<LeadRecordItem | null>(null);

  // Summary Metrics (Clean Inquiries Dashboard)
  const summaryMetrics = useMemo(() => {
    const totalLeads = leads.length;
    const newCount = leads.filter((l) => l.status === "New").length;
    const qualifiedCount = leads.filter((l) => l.status === "Qualified").length;
    const convertedCount = leads.filter((l) => l.status === "Converted").length;

    return {
      totalLeads,
      newCount,
      qualifiedCount,
      convertedCount,
    };
  }, [leads]);

  // Filtered Leads List
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        l.id.toLowerCase().includes(q) ||
        l.leadName.toLowerCase().includes(q) ||
        l.contactPerson.toLowerCase().includes(q) ||
        l.mobileNumber.includes(q) ||
        (l.email && l.email.toLowerCase().includes(q)) ||
        (l.companyName && l.companyName.toLowerCase().includes(q)) ||
        l.customerRequirements.toLowerCase().includes(q);

      const matchType = selectedTypeFilter === "ALL" || l.bookingType === selectedTypeFilter;
      const matchSource = selectedSourceFilter === "ALL" || l.leadSource === selectedSourceFilter;
      const matchStatus = selectedStatusFilter === "ALL" || l.status === selectedStatusFilter;

      return matchSearch && matchType && matchSource && matchStatus;
    });
  }, [leads, searchTerm, selectedTypeFilter, selectedSourceFilter, selectedStatusFilter]);

  // Handle Quick Status Change
  const handleQuickStatusChange = (leadId: string, newStatus: LeadStatus) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === leadId) {
          const updatedTimeline: LeadTimelineEvent = {
            id: `T-${Date.now()}`,
            date: "Today 12:00 PM",
            title: `Status updated to ${newStatus}`,
            actor: l.assignedExecutive,
          };
          return {
            ...l,
            status: newStatus,
            timeline: [updatedTimeline, ...l.timeline],
          };
        }
        return l;
      })
    );

    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    setToastMessage(`✓ Lead status updated to "${newStatus}"`);
  };

  // Handle Create Lead (<1 min fast submission)
  const handleCreateLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.leadName.trim() || !createForm.mobileNumber.trim() || !createForm.customerRequirements.trim()) return;

    const newLeadId = `LEAD-${String(leads.length + 1).padStart(3, "0")}`;
    const newLead: LeadRecordItem = {
      id: newLeadId,
      leadName: createForm.leadName.trim(),
      contactPerson: createForm.contactPerson.trim() || createForm.leadName.trim(),
      mobileNumber: createForm.mobileNumber.trim(),
      mobile: createForm.mobileNumber.trim(),
      email: createForm.email.trim() || undefined,
      companyName: createForm.companyName.trim() || undefined,
      city: createForm.city.trim() || "Local",
      preferredContactMethod: createForm.preferredContactMethod,
      bookingType: createForm.bookingType,
      eventDate: createForm.eventDate || undefined,
      expectedEventDate: createForm.eventDate || undefined,
      guestCount: Number(createForm.guestCount) || undefined,
      estimatedRevenue: Number(createForm.estimatedRevenue) || undefined,
      rawRevenue: Number(createForm.estimatedRevenue) || undefined,
      expectedRevenue: createForm.estimatedRevenue ? `₹${Number(createForm.estimatedRevenue).toLocaleString("en-IN")}` : undefined,
      budgetRange: createForm.estimatedRevenue ? `₹${Number(createForm.estimatedRevenue).toLocaleString("en-IN")}` : undefined,
      priority: createForm.priority,
      customerRequirements: createForm.customerRequirements.trim(),
      specialRequirements: createForm.customerRequirements.trim(),
      customerRequirement: createForm.customerRequirements.trim(),
      leadSource: createForm.leadSource,
      campaignId: createForm.campaignName.trim() ? `CAMP-${Date.now()}` : null,
      campaignName: createForm.campaignName.trim() || null,
      promotionCode: null,
      importedVia: "Manual Entry",
      createdDate: "2026-08-29",
      assignedExecutive: createForm.assignedExecutive,
      status: "New",
      timeline: [
        {
          id: `T-${Date.now()}`,
          date: "2026-08-29 12:00 PM",
          title: "Lead Inquiry Created (Manual Entry)",
          actor: createForm.assignedExecutive,
        },
      ],
    };

    setLeads([newLead, ...leads]);
    setIsCreateModalOpen(false);
    setToastMessage(`✓ Created new inquiry #${newLead.id} for ${newLead.leadName}`);

    // Reset Form
    setCreateForm({
      leadName: "",
      contactPerson: "",
      mobileNumber: "",
      email: "",
      companyName: "",
      city: "",
      preferredContactMethod: "Phone Call",
      bookingType: "Banquet Event",
      leadSource: "Google Ads",
      campaignName: "",
      eventDate: "2026-11-20",
      guestCount: 150,
      estimatedRevenue: 450000,
      priority: "Medium",
      assignedExecutive: "Vikram Malhotra",
      customerRequirements: "",
    });
  };

  // Open Edit Modal
  const handleOpenEditModal = (lead: LeadRecordItem) => {
    setEditForm({ ...lead });
    setIsEditModalOpen(true);
  };

  // Handle Edit Lead Submit (Progressive profiling)
  const handleEditLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;

    setLeads((prev) => prev.map((l) => (l.id === editForm.id ? editForm : l)));
    if (selectedLead && selectedLead.id === editForm.id) {
      setSelectedLead(editForm);
    }
    setIsEditModalOpen(false);
    setToastMessage(`✓ Updated lead record #${editForm.id}`);
  };

  // ── 1. Contact Lead (New -> Contacted) ──
  const handleContactLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactingLead) return;

    const timestamp = "Today 04:30 PM";
    const updatedList = leads.map((l) => {
      if (l.id === contactingLead.id) {
        return {
          ...l,
          status: "Contacted" as LeadStatus,
          timeline: [
            {
              id: `T-${Date.now()}`,
              date: timestamp,
              title: `Contacted Lead via ${contactForm.method}`,
              actor: l.assignedExecutive,
              notes: contactForm.notes.trim() || `First customer outreach via ${contactForm.method}.`,
            },
            ...l.timeline,
          ],
        };
      }
      return l;
    });

    setLeads(updatedList);
    if (selectedLead?.id === contactingLead.id) {
      const updated = updatedList.find((l) => l.id === contactingLead.id);
      if (updated) setSelectedLead(updated);
    }
    setToastMessage(`✓ Lead #${contactingLead.id} marked as Contacted!`);
    setContactingLead(null);
  };

  // ── 2. Add Interaction Note (Contacted) ──
  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notingLead || !noteText.trim()) return;

    const timestamp = "Today 04:35 PM";
    const updatedList = leads.map((l) => {
      if (l.id === notingLead.id) {
        return {
          ...l,
          timeline: [
            {
              id: `T-${Date.now()}`,
              date: timestamp,
              title: "Interaction Note Added",
              actor: l.assignedExecutive,
              notes: noteText.trim(),
            },
            ...l.timeline,
          ],
        };
      }
      return l;
    });

    setLeads(updatedList);
    if (selectedLead?.id === notingLead.id) {
      const updated = updatedList.find((l) => l.id === notingLead.id);
      if (updated) setSelectedLead(updated);
    }
    setToastMessage(`✓ Interaction note logged for Lead #${notingLead.id}!`);
    setNotingLead(null);
    setNoteText("");
  };

  // ── 3. Mark Qualified (Contacted -> Qualified) ──
  const handleMarkQualified = (lead: LeadRecordItem) => {
    const timestamp = "Today 04:40 PM";
    const updatedList = leads.map((l) => {
      if (l.id === lead.id) {
        return {
          ...l,
          status: "Qualified" as LeadStatus,
          timeline: [
            {
              id: `T-${Date.now()}`,
              date: timestamp,
              title: "Lead Marked as Qualified",
              actor: l.assignedExecutive,
              notes: "Customer confirmed genuine requirements and buying interest.",
            },
            ...l.timeline,
          ],
        };
      }
      return l;
    });

    setLeads(updatedList);
    if (selectedLead?.id === lead.id) {
      const updated = updatedList.find((l) => l.id === lead.id);
      if (updated) setSelectedLead(updated);
    }
    setToastMessage(`✓ Lead #${lead.id} marked as Qualified! Ready to move to Pipeline.`);
  };

  // ── 4. Move To Pipeline (Qualified -> Converted / Stage 1: Qualification) ──
  const handleOpenMoveToPipeline = (lead: LeadRecordItem) => {
    setMovingLead(lead);
    setMoveForm({
      dealName: `${lead.leadName} (${lead.bookingType})`,
      expectedRevenue: lead.estimatedRevenue || lead.rawRevenue || 500000,
      assignedExecutive: lead.assignedExecutive,
    });
  };

  const handleConfirmMoveToPipeline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movingLead) return;

    const rawNum = movingLead.id.replace(/[^0-9]/g, "");
    const createdDealId = `DEAL-${rawNum ? String(Number(rawNum) + 1000).slice(-4) : "1001"}`;
    const timestamp = "Today 04:45 PM";

    const updatedLeads = leads.map((l) => {
      if (l.id === movingLead.id) {
        return {
          ...l,
          status: "Converted" as LeadStatus,
          linkedDealId: createdDealId,
          linkedDealStage: "Qualification",
          timeline: [
            {
              id: `T-${Date.now()}`,
              date: timestamp,
              title: `Moved to Pipeline • Deal Created (#${createdDealId})`,
              actor: moveForm.assignedExecutive,
              notes: `Initial Stage: Qualification • Opportunity: ${moveForm.dealName} • Expected Value: ₹${moveForm.expectedRevenue.toLocaleString("en-IN")}`,
            },
            ...l.timeline,
          ],
        };
      }
      return l;
    });

    setLeads(updatedLeads);

    if (selectedLead && selectedLead.id === movingLead.id) {
      setSelectedLead({
        ...selectedLead,
        status: "Converted",
        linkedDealId: createdDealId,
        linkedDealStage: "Qualification",
      });
    }

    setToastMessage(`✓ Lead #${movingLead.id} moved to Pipeline as Deal #${createdDealId} in Qualification stage!`);
    setMovingLead(null);
  };

  // Handle CSV Import Leads
  const handleImportLeads = (newImportedLeads: LeadRecordItem[]) => {
    setLeads((prev) => [...newImportedLeads, ...prev]);
    setIsCsvModalOpen(false);
    setToastMessage(`✓ Successfully imported ${newImportedLeads.length} leads from CSV!`);
  };

  // Mark Lead as Lost / Drop
  const handleMarkLost = (lead: LeadRecordItem) => {
    const reason = prompt(
      "Enter reason for dropping/marking lead as lost (optional):",
      "Client chose another venue / Budget mismatch"
    );
    if (reason === null) return;

    const timestamp = "Today";
    const updatedList = leads.map((l) => {
      if (l.id === lead.id) {
        return {
          ...l,
          status: "Lost" as LeadStatus,
          timeline: [
            {
              id: `T-${Date.now()}`,
              date: timestamp,
              title: "Lead Marked as Lost",
              actor: l.assignedExecutive,
              notes: reason || "Lead marked as dropped/lost.",
            },
            ...l.timeline,
          ],
        };
      }
      return l;
    });

    setLeads(updatedList);
    if (selectedLead?.id === lead.id) {
      const updated = updatedList.find((l) => l.id === lead.id);
      if (updated) setSelectedLead(updated);
    }
    setToastMessage(`✓ Lead #${lead.id} marked as Lost.`);
  };

  // Construct Action Menu Items for Reusable ActionMenu
  const getLeadActionMenuItems = (lead: LeadRecordItem): ActionMenuItem[] => {
    const items: ActionMenuItem[] = [
      {
        label: "View Lead Details",
        icon: Eye,
        onClick: () => {
          setSelectedLead(lead);
          setDrawerTab("overview");
        },
      },
      {
        label: "Add Quick Note",
        icon: FileText,
        onClick: () => {
          setNotingLead(lead);
          setNoteText("");
        },
      },
    ];

    if (lead.status === "New") {
      items.push({
        label: "Contact Lead",
        icon: Phone,
        variant: "primary",
        onClick: () => {
          setContactingLead(lead);
          setContactForm({ method: "Phone Call", notes: "" });
        },
      });
    }

    if (lead.status === "Contacted") {
      items.push({
        label: "Mark as Qualified",
        icon: CheckCircle2,
        variant: "success",
        onClick: () => handleMarkQualified(lead),
      });
    }

    if (lead.status === "Qualified") {
      items.push({
        label: "Move to Pipeline Deal",
        icon: Zap,
        variant: "success",
        onClick: () => handleOpenMoveToPipeline(lead),
      });
    }

    if (lead.status === "Converted") {
      items.push({
        label: "Open Pipeline Deal",
        icon: ExternalLink,
        variant: "primary",
        onClick: () => router.push(`/sales-marketing/crm/pipeline?leadId=${lead.id}`),
      });
    }

    if (lead.status !== "Converted" && lead.status !== "Lost") {
      items.push({ label: "divider", divider: true });
      items.push({
        label: "Mark as Lost / Drop",
        icon: X,
        variant: "danger",
        onClick: () => handleMarkLost(lead),
      });
    }

    return items;
  };

  return (
    <ModulePageShell
      eyebrow="Lead & Sales Management"
      title="Leads & Inquiries — Inquiry Ingestion Register"
      description="Central register to capture, qualify, and track customer inquiries before converting them into active Sales Pipeline Deals."
      breadcrumbs={[
        { label: "Sales & Marketing", href: "/sales-marketing/dashboard" },
        { label: "Lead & Sales" },
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
            onClick={() => setIsCsvModalOpen(true)}
            className="text-xs font-semibold rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
          >
            <Upload className="h-3.5 w-3.5 text-blue-700" /> Import Leads CSV
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> + Create Lead
          </Button>
        </div>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: INQUIRIES OPERATIONAL KPI CARDS (F&B DASHBOARD STYLE)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6 mb-5">
        {/* Card 1: Total Inquiries */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Total Inquiries
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 sm:h-8 sm:w-8">
              <Inbox className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            {summaryMetrics.totalLeads}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            All active records
          </p>
        </Card>

        {/* Card 2: New Inquiries */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              New Inquiries
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 sm:h-8 sm:w-8">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            {summaryMetrics.newCount}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            Awaiting first response
          </p>
        </Card>

        {/* Card 3: Qualified Leads */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Qualified Leads
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 sm:h-8 sm:w-8">
              <UserCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            {summaryMetrics.qualifiedCount}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            Ready for pipeline deal
          </p>
        </Card>

        {/* Card 4: Converted to Deals */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Converted to Deals
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 sm:h-8 sm:w-8">
              <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            {summaryMetrics.convertedCount}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            Active in pipeline
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
            placeholder="Search by Lead ID (#LEAD-001), Client Name, Mobile, Email, Company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs sm:text-sm rounded-lg border border-slate-200 pl-9 pr-3 py-2 bg-slate-50/50 font-normal text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-300"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {/* Booking Type Filter */}
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 py-2 px-3 bg-white text-slate-700 focus:outline-none focus:border-slate-300 cursor-pointer"
          >
            <option value="ALL">All Booking Types</option>
            <option value="Room Booking">Room Booking</option>
            <option value="Banquet Event">Banquet Event</option>
            <option value="Conference">Conference</option>
            <option value="Restaurant">Restaurant</option>
            <option value="Swimming Pool">Swimming Pool</option>
            <option value="Private Event">Private Event</option>
            <option value="Other">Other</option>
          </select>

          {/* Lead Source Filter */}
          <select
            value={selectedSourceFilter}
            onChange={(e) => setSelectedSourceFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 py-2 px-3 bg-white text-slate-700 focus:outline-none focus:border-slate-300 cursor-pointer"
          >
            <option value="ALL">All Lead Sources</option>
            <option value="Google Ads">Google Ads</option>
            <option value="Meta Ads">Meta Ads</option>
            <option value="Website">Website</option>
            <option value="Phone Inquiry">Phone Inquiry</option>
            <option value="Walk-In">Walk-In</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Email">Email</option>
            <option value="Referral">Referral</option>
            <option value="Corporate Inquiry">Corporate Inquiry</option>
            <option value="Travel Agent">Travel Agent</option>
            <option value="Other">Other</option>
          </select>

          {/* Lead Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 py-2 px-3 bg-white text-slate-700 focus:outline-none focus:border-slate-300 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Converted">Converted</option>
            <option value="Lost">Lost</option>
          </select>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: CLEAN LEADS TABLE (MATCHING F&B / FRONT OFFICE SPEC)
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-4 py-3 text-xs text-slate-500 font-medium border-b border-slate-100 flex items-center justify-between">
          <span>Showing <strong className="text-slate-700 font-semibold">{filteredLeads.length}</strong> of <strong className="text-slate-700 font-semibold">{leads.length}</strong> records &bull; Inquiries Register</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">Lead #</th>
                <th className="py-3 px-4">Guest / Client</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Booking Type</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Campaign</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => {
                      setSelectedLead(lead);
                      setDrawerTab("overview");
                    }}
                    className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    {/* 1. Lead ID */}
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-800">
                      #{lead.id}
                    </td>

                    {/* 2. Lead Name */}
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-semibold text-slate-900 block">{lead.leadName}</span>
                      <span className="text-[11px] text-slate-500 block truncate max-w-[180px]">
                        {lead.companyName || lead.contactPerson}
                      </span>
                    </td>

                    {/* 3. Mobile Number */}
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                      {lead.mobileNumber}
                    </td>

                    {/* 4. Booking Type */}
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {lead.bookingType}
                    </td>

                    {/* 5. Lead Source */}
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {lead.leadSource}
                    </td>

                    {/* 6. Campaign */}
                    <td className="py-3.5 px-4 text-xs">
                      {lead.campaignName ? (
                        <span className="text-slate-700 truncate block max-w-[150px]">
                          {lead.campaignName}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Not Linked</span>
                      )}
                    </td>

                    {/* 7. Created Date */}
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                      {lead.createdDate}
                    </td>

                    {/* 8. Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[11px] font-semibold border inline-block",
                          lead.status === "New"
                            ? "bg-amber-50 text-amber-700 border-amber-200/70"
                            : lead.status === "Contacted"
                            ? "bg-sky-50 text-sky-700 border-sky-200/70"
                            : lead.status === "Qualified"
                            ? "bg-teal-50 text-teal-700 border-teal-200/70"
                            : lead.status === "Converted"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                            : "bg-rose-50 text-rose-700 border-rose-200/70"
                        )}
                      >
                        {lead.status}
                      </span>
                    </td>

                    {/* 9. Actions Column */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLead(lead);
                            setDrawerTab("overview");
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                        >
                          <Eye className="h-3 w-3 text-slate-400" /> View
                        </button>
                        <ActionMenu items={getLeadActionMenuItems(lead)} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                    No lead inquiries found matching your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: LEAD DETAILS DRAWER (CLEAN, UNCLUTTERED)
      ───────────────────────────────────────────────────────────── */}
      {selectedLead && (
        <Drawer
          isOpen={Boolean(selectedLead)}
          onClose={() => {
            setSelectedLead(null);
            setDrawerTab("overview");
          }}
          title={`Inquiry Lead Record — #${selectedLead.id}`}
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full pt-1">
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${selectedLead.mobileNumber}`}
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-slate-50 transition"
                >
                  <Phone className="h-3.5 w-3.5 text-emerald-700" /> {selectedLead.mobileNumber}
                </a>
                {selectedLead.email && (
                  <a
                    href={`mailto:${selectedLead.email}`}
                    className="text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-slate-50 transition"
                  >
                    <Mail className="h-3.5 w-3.5 text-blue-700" /> Email
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEditModal(selectedLead)}
                  className="text-xs font-semibold rounded-lg"
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit Lead
                </Button>

                {/* Status = New */}
                {selectedLead.status === "New" && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setContactingLead(selectedLead);
                      setContactForm({ method: "Phone Call", notes: "" });
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Phone className="h-3.5 w-3.5" /> Contact Lead →
                  </Button>
                )}

                {/* Status = Contacted */}
                {selectedLead.status === "Contacted" && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNotingLead(selectedLead);
                        setNoteText("");
                      }}
                      className="text-xs font-semibold rounded-lg border-slate-200"
                    >
                      Add Note
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleMarkQualified(selectedLead)}
                      className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <UserCheck className="h-3.5 w-3.5" /> Mark as Qualified →
                    </Button>
                  </>
                )}

                {/* Status = Qualified */}
                {selectedLead.status === "Qualified" && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNotingLead(selectedLead);
                        setNoteText("");
                      }}
                      className="text-xs font-semibold rounded-lg border-slate-200"
                    >
                      Add Note
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleOpenMoveToPipeline(selectedLead)}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Zap className="h-3.5 w-3.5" /> Move To Pipeline →
                    </Button>
                  </>
                )}

                {/* Status = Converted */}
                {selectedLead.status === "Converted" && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      router.push(`/sales-marketing/crm/pipeline?leadId=${selectedLead.id}`);
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> View Deal in Pipeline →
                  </Button>
                )}

                {/* Status = Lost */}
                {selectedLead.status === "Lost" && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleQuickStatusChange(selectedLead.id, "New")}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3 py-2 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Reopen Lead
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs pb-4">
            {/* Top Hero Lead Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                    {selectedLead.contactPerson.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      {selectedLead.leadName}
                    </h3>
                    <span className="text-xs text-slate-500 font-medium">
                      Contact: {selectedLead.contactPerson} {selectedLead.companyName ? `• ${selectedLead.companyName}` : ""}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                      selectedLead.status === "New"
                        ? "bg-amber-100 text-amber-800 border-amber-200"
                        : selectedLead.status === "Contacted"
                        ? "bg-blue-100 text-blue-800 border-blue-200"
                        : selectedLead.status === "Qualified"
                        ? "bg-purple-100 text-purple-800 border-purple-200"
                        : selectedLead.status === "Converted"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : "bg-rose-100 text-rose-800 border-rose-200"
                    )}
                  >
                    {selectedLead.status}
                  </span>
                  <span className="bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                    {selectedLead.bookingType}
                  </span>
                </div>
              </div>

              {/* 4-Metric Key Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Target Event Date</span>
                  <strong className="text-slate-900 font-mono font-bold text-xs">
                    {selectedLead.eventDate || "Not Provided"}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Expected Guests</span>
                  <strong className="text-slate-900 font-mono text-xs">
                    {selectedLead.guestCount ? `${selectedLead.guestCount} Guests` : "Not Provided"}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Estimated Budget</span>
                  <strong className="text-emerald-900 font-mono text-xs">
                    {selectedLead.estimatedRevenue ? `₹${selectedLead.estimatedRevenue.toLocaleString("en-IN")}` : "Not Provided"}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Assigned Executive</span>
                  <strong className="text-slate-900 truncate block">
                    {selectedLead.assignedExecutive}
                  </strong>
                </div>
              </div>

              {/* Status Action Switcher for Sales Reps */}
              {selectedLead.status !== "Converted" && (
                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-500 mr-1">Move Status:</span>
                  {(["New", "Contacted", "Qualified", "Lost"] as LeadStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleQuickStatusChange(selectedLead.id, st)}
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-semibold border transition cursor-pointer",
                        selectedLead.status === st
                          ? "bg-slate-900 text-white border-slate-900 shadow-2xs font-bold"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clean Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setDrawerTab("overview")}
                className={cn(
                  "flex-1 py-1.5 px-3 rounded-lg text-center transition cursor-pointer",
                  drawerTab === "overview"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                📋 Inquiry &amp; Contact Details
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab("timeline")}
                className={cn(
                  "flex-1 py-1.5 px-3 rounded-lg text-center transition cursor-pointer",
                  drawerTab === "timeline"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                ⏱ Lead Timeline ({selectedLead.timeline.length})
              </button>
            </div>

            {/* ── TAB 1: OVERVIEW & INQUIRY DETAILS ── */}
            {drawerTab === "overview" && (
              <div className="space-y-3.5">
                {/* 1. Contact Information Card */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2.5">
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                    <User className="h-3.5 w-3.5 text-emerald-700" /> Contact Information
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Contact Person:</span>
                      <strong className="text-slate-900">{selectedLead.contactPerson}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Mobile Number:</span>
                      <span className="font-mono font-semibold text-emerald-800">{selectedLead.mobileNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Email Address:</span>
                      <span className="font-mono text-slate-800">{selectedLead.email || "Not Provided"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">City / Location:</span>
                      <span className="text-slate-800">{selectedLead.city || "Not Provided"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Company / Family Name:</span>
                      <span className="text-slate-800 font-medium">{selectedLead.companyName || "Not Provided"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Preferred Contact Method:</span>
                      <span className="text-slate-800 font-medium">{selectedLead.preferredContactMethod || "Phone Call"}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Event Requirements Card */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2.5">
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                    <Tag className="h-3.5 w-3.5 text-purple-700" /> Event &amp; Inquiry Requirements
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Booking Type:</span>
                      <strong className="text-purple-900">{selectedLead.bookingType}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Target Event / Stay Date:</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {selectedLead.eventDate || "Not Provided"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Expected Guest Pax:</span>
                      <strong className="text-slate-900 font-mono">
                        {selectedLead.guestCount ? `${selectedLead.guestCount} Guests` : "Not Provided"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Estimated Revenue:</span>
                      <span className="font-mono font-semibold text-emerald-800">
                        {selectedLead.estimatedRevenue ? `₹${selectedLead.estimatedRevenue.toLocaleString("en-IN")}` : "Not Provided"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Priority:</span>
                      <span className="font-semibold text-slate-800">{selectedLead.priority}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Assigned Staff:</span>
                      <span className="font-semibold text-slate-800">{selectedLead.assignedExecutive}</span>
                    </div>
                  </div>

                  {selectedLead.customerRequirements && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-slate-400 text-[10px] font-bold block mb-1">
                        Customer Requirements &amp; Notes:
                      </span>
                      <p className="text-slate-700 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed font-medium">
                        {selectedLead.customerRequirements}
                      </p>
                    </div>
                  )}
                </div>

                {/* 3. Acquisition & Marketing Card */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2.5">
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                    <Globe className="h-3.5 w-3.5 text-blue-700" /> Marketing Attribution
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Lead Source:</span>
                      <span className="font-semibold text-slate-900">{selectedLead.leadSource}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Campaign Name:</span>
                      <span className="text-slate-800 font-medium">
                        {selectedLead.campaignName || "Not Linked"}
                      </span>
                    </div>
                    {selectedLead.campaignId && (
                      <div>
                        <span className="text-slate-400 text-[10px] block">Campaign ID:</span>
                        <span className="font-mono text-slate-700">{selectedLead.campaignId}</span>
                      </div>
                    )}
                    {selectedLead.promotionCode && (
                      <div>
                        <span className="text-slate-400 text-[10px] block">Promotion Code:</span>
                        <span className="bg-emerald-50 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded text-[10px] border border-emerald-200">
                          {selectedLead.promotionCode}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-400 text-[10px] block">Imported Via:</span>
                      <span className="text-slate-800">{selectedLead.importedVia}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Created Date:</span>
                      <span className="font-mono text-slate-800">{selectedLead.createdDate}</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ── TAB 2: LEAD TIMELINE ── */}
            {drawerTab === "timeline" && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2.5">
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5 text-blue-700" /> Lead Lifecycle Timeline
                  </h4>
                  <div className="space-y-2 text-xs border-l-2 border-slate-200 pl-3 ml-1">
                    {selectedLead.timeline.map((t) => (
                      <div key={t.id} className="space-y-0.5">
                        <div className="flex justify-between font-bold text-slate-900 text-xs">
                          <span>{t.title}</span>
                          <span className="text-[10px] font-mono text-slate-400 font-normal">{t.date}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block font-medium">Actor: {t.actor}</span>
                        {t.notes && (
                          <p className="text-slate-700 text-xs bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1 leading-relaxed">
                            {t.notes}
                          </p>
                        )}
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
          SECTION 5: CREATE LEAD MODAL (< 1 MIN QUICK INTAKE)
      ───────────────────────────────────────────────────────────── */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Lead Inquiry"
          maxWidth="md"
        >
          <form onSubmit={handleCreateLeadSubmit} className="space-y-3.5 text-xs p-1">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Lead / Contact Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Sharma"
                  value={createForm.leadName}
                  onChange={(e) => setCreateForm({ ...createForm, leadName: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Mobile Number *</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98000 00000"
                  value={createForm.mobileNumber}
                  onChange={(e) => setCreateForm({ ...createForm, mobileNumber: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Email Address</label>
                <input
                  type="email"
                  placeholder="client@domain.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Company / Family Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sharma Family or TechCorp"
                  value={createForm.companyName}
                  onChange={(e) => setCreateForm({ ...createForm, companyName: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Booking Type *</label>
                <select
                  value={createForm.bookingType}
                  onChange={(e) => setCreateForm({ ...createForm, bookingType: e.target.value as BookingType })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs text-slate-900"
                >
                  <option value="Banquet Event">Banquet Event</option>
                  <option value="Room Booking">Room Booking</option>
                  <option value="Conference">Conference</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Swimming Pool">Swimming Pool</option>
                  <option value="Private Event">Private Event</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Lead Source *</label>
                <select
                  value={createForm.leadSource}
                  onChange={(e) => setCreateForm({ ...createForm, leadSource: e.target.value as LeadSource })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs text-slate-900"
                >
                  <option value="Google Ads">Google Ads</option>
                  <option value="Meta Ads">Meta Ads</option>
                  <option value="Website">Website</option>
                  <option value="Phone Inquiry">Phone Inquiry</option>
                  <option value="Walk-In">Walk-In</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Email">Email</option>
                  <option value="Referral">Referral</option>
                  <option value="Corporate Inquiry">Corporate Inquiry</option>
                  <option value="Travel Agent">Travel Agent</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Expected Event Date</label>
                <input
                  type="date"
                  value={createForm.eventDate}
                  onChange={(e) => setCreateForm({ ...createForm, eventDate: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Guest Count</label>
                <input
                  type="number"
                  placeholder="e.g. 150"
                  value={createForm.guestCount}
                  onChange={(e) => setCreateForm({ ...createForm, guestCount: Number(e.target.value) })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Estimated Revenue (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 450000"
                  value={createForm.estimatedRevenue}
                  onChange={(e) => setCreateForm({ ...createForm, estimatedRevenue: Number(e.target.value) })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono font-bold text-emerald-800 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Assigned Executive</label>
                <select
                  value={createForm.assignedExecutive}
                  onChange={(e) => setCreateForm({ ...createForm, assignedExecutive: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                >
                  <option value="Vikram Malhotra">Vikram Malhotra</option>
                  <option value="Ananya Roy">Ananya Roy</option>
                  <option value="Rohan Varma">Rohan Varma</option>
                  <option value="Jay Kumar">Jay Kumar</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Priority</label>
                <select
                  value={createForm.priority}
                  onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value as LeadPriority })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                >
                  <option value="High">High 🔴</option>
                  <option value="Medium">Medium 🟡</option>
                  <option value="Low">Low ⚪</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Customer Requirements *</label>
              <textarea
                rows={2.5}
                required
                placeholder="Enter client's requirements, venue preferences, menu notes, or stay specifications..."
                value={createForm.customerRequirements}
                onChange={(e) => setCreateForm({ ...createForm, customerRequirements: e.target.value })}
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
                Save &amp; Create Lead
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 6: EDIT LEAD MODAL (PROGRESSIVE PROFILING)
      ───────────────────────────────────────────────────────────── */}
      {isEditModalOpen && editForm && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Lead Record — #${editForm.id}`}
          maxWidth="md"
        >
          <form onSubmit={handleEditLeadSubmit} className="space-y-3.5 text-xs p-1">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Lead / Contact Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.leadName}
                  onChange={(e) => setEditForm({ ...editForm, leadName: e.target.value, contactPerson: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Mobile Number *</label>
                <input
                  type="text"
                  required
                  value={editForm.mobileNumber}
                  onChange={(e) => setEditForm({ ...editForm, mobileNumber: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Email Address</label>
                <input
                  type="email"
                  value={editForm.email || ""}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Company / Family Name</label>
                <input
                  type="text"
                  value={editForm.companyName || ""}
                  onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Target Event Date</label>
                <input
                  type="date"
                  value={editForm.eventDate || ""}
                  onChange={(e) => setEditForm({ ...editForm, eventDate: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Guest Count</label>
                <input
                  type="number"
                  value={editForm.guestCount || ""}
                  onChange={(e) => setEditForm({ ...editForm, guestCount: Number(e.target.value) })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Estimated Revenue (₹)</label>
                <input
                  type="number"
                  value={editForm.estimatedRevenue || ""}
                  onChange={(e) => setEditForm({ ...editForm, estimatedRevenue: Number(e.target.value) })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono font-bold text-emerald-800 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as LeadStatus })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Converted">Converted</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Assigned Staff</label>
                <select
                  value={editForm.assignedExecutive}
                  onChange={(e) => setEditForm({ ...editForm, assignedExecutive: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                >
                  <option value="Vikram Malhotra">Vikram Malhotra</option>
                  <option value="Ananya Roy">Ananya Roy</option>
                  <option value="Rohan Varma">Rohan Varma</option>
                  <option value="Jay Kumar">Jay Kumar</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Priority</label>
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as LeadPriority })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                >
                  <option value="High">High 🔴</option>
                  <option value="Medium">Medium 🟡</option>
                  <option value="Low">Low ⚪</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Customer Requirements *</label>
              <textarea
                rows={2.5}
                required
                value={editForm.customerRequirements}
                onChange={(e) => setEditForm({ ...editForm, customerRequirements: e.target.value })}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 7: CONTACT LEAD MODAL (NEW -> CONTACTED)
      ───────────────────────────────────────────────────────────── */}
      {contactingLead && (
        <Modal
          isOpen={Boolean(contactingLead)}
          onClose={() => setContactingLead(null)}
          title={`Contact Customer — #${contactingLead.id}`}
          maxWidth="sm"
        >
          <form onSubmit={handleContactLeadSubmit} className="space-y-3.5 text-xs p-1">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex justify-between font-bold text-slate-900">
                <span>{contactingLead.leadName}</span>
                <span className="text-purple-800 font-semibold">{contactingLead.bookingType}</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Phone: <strong className="font-mono text-emerald-800">{contactingLead.mobileNumber}</strong>
                {contactingLead.email ? ` • ${contactingLead.email}` : ""}
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Contact Channel *</label>
              <select
                value={contactForm.method}
                onChange={(e) => setContactForm({ ...contactForm, method: e.target.value as any })}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-900 text-xs"
              >
                <option value="Phone Call">Phone Call</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Email">Email</option>
                <option value="Walk-in Meeting">Walk-in Meeting</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Initial Outreach Notes</label>
              <textarea
                rows={3}
                placeholder="e.g. Spoke with client, discussed dates, sent banquet brochure via WhatsApp..."
                value={contactForm.notes}
                onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-900 text-xs leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setContactingLead(null)}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1"
              >
                <Check className="h-3.5 w-3.5" /> Mark as Contacted
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 8: ADD INTERACTION NOTE MODAL
      ───────────────────────────────────────────────────────────── */}
      {notingLead && (
        <Modal
          isOpen={Boolean(notingLead)}
          onClose={() => setNotingLead(null)}
          title={`Add Interaction Note — #${notingLead.id}`}
          maxWidth="sm"
        >
          <form onSubmit={handleAddNoteSubmit} className="space-y-3.5 text-xs p-1">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
              <span className="font-bold text-slate-900 block">{notingLead.leadName}</span>
              <span className="text-[11px] text-slate-500">Contact: {notingLead.contactPerson} ({notingLead.mobileNumber})</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Interaction / Discussion Note *</label>
              <textarea
                rows={3.5}
                required
                placeholder="Enter client feedback, menu discussion, budget updates, or next steps..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-900 text-xs leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setNotingLead(null)}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs"
              >
                Save Note
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 9: MOVE TO PIPELINE (CREATE DEAL IN STAGE 1: QUALIFICATION)
      ───────────────────────────────────────────────────────────── */}
      {movingLead && (
        <Modal
          isOpen={Boolean(movingLead)}
          onClose={() => setMovingLead(null)}
          title={`Move Lead to Sales Pipeline — #${movingLead.id}`}
          maxWidth="sm"
        >
          <form onSubmit={handleConfirmMoveToPipeline} className="space-y-3.5 text-xs p-1">
            <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 space-y-1 text-xs">
              <div className="flex justify-between font-bold text-purple-950">
                <span>{movingLead.leadName}</span>
                <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[10px]">
                  Stage 1: Qualification
                </span>
              </div>
              <p className="text-[11px] text-purple-800 font-mono">
                Phone: {movingLead.mobileNumber} • Source: {movingLead.leadSource}
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Deal Opportunity Name *</label>
              <input
                type="text"
                required
                value={moveForm.dealName}
                onChange={(e) => setMoveForm({ ...moveForm, dealName: e.target.value })}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-900 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Expected Value (₹) *</label>
                <input
                  type="number"
                  required
                  value={moveForm.expectedRevenue}
                  onChange={(e) => setMoveForm({ ...moveForm, expectedRevenue: Number(e.target.value) })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono font-bold text-emerald-800 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Assigned Executive</label>
                <select
                  value={moveForm.assignedExecutive}
                  onChange={(e) => setMoveForm({ ...moveForm, assignedExecutive: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                >
                  <option value="Vikram Malhotra">Vikram Malhotra</option>
                  <option value="Ananya Roy">Ananya Roy</option>
                  <option value="Rohan Varma">Rohan Varma</option>
                  <option value="Jay Kumar">Jay Kumar</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMovingLead(null)}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 px-4"
              >
                <Zap className="h-3.5 w-3.5" /> Move to Pipeline
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 8: REUSABLE CSV LEAD IMPORT MODAL
      ───────────────────────────────────────────────────────────── */}
      {isCsvModalOpen && (
        <CsvLeadImportModal
          isOpen={isCsvModalOpen}
          onClose={() => setIsCsvModalOpen(false)}
          onImportLeads={handleImportLeads}
          existingLeadCount={leads.length}
        />
      )}
    </ModulePageShell>
  );
}
