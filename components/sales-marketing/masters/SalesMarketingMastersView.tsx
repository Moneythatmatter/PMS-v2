"use client";

import React, { useState, useMemo } from "react";
import {
  Building2,
  Percent,
  Target,
  Share2,
  Activity,
  GitCommit,
  CalendarDays,
  Users,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Edit2,
  X,
  Check,
  Filter,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Modal } from "@/components/ui";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// 1. DATA TYPES & SCHEMAS FOR ALL 8 MASTERS
// ─────────────────────────────────────────────────────────────

export type MasterTabKey =
  | "venues-halls"
  | "rates-commissions"
  | "targets-incentives"
  | "lead-sources"
  | "activity-types"
  | "deal-stages"
  | "booking-categories"
  | "contact-types";

// 1. Venues & Spaces (Simplified V1 Schema)
export interface VenueSpaceMasterItem {
  venueId: string; // e.g. "VEN-001"
  venueName: string;
  venueType: string; // "Banquet Hall", "Lawn", "Conference Room", "Boardroom", etc.
  minimumCapacity: number;
  maximumCapacity: number;
  location: string;
  status: "Active" | "Maintenance" | "Inactive";
  description?: string;
}

// 2. Rates & Commissions
export interface RateMasterItem {
  rateId: string;
  rateName: string;
  rateType: "Fixed Per Night" | "Per Pax Buffet" | "Hourly Space" | "Flat Venue Rental";
  applicableTo: "Individual Guests" | "Corporate Clients" | "Wedding Clients" | "All Channels";
  roomTypeOrService: string;
  amount: number;
  validFrom: string;
  validTo: string;
  status: "Active" | "Inactive";
}

export interface CommissionMasterItem {
  commissionId: string;
  partnerType: "Travel Agent" | "Wedding Planner" | "Event Organizer" | "Corporate Booker";
  partnerName: string;
  commissionType: "Percentage %" | "Flat Per Booking" | "Slab Based";
  commissionValue: string;
  validFrom: string;
  validTo: string;
  status: "Active" | "Inactive";
}

// 3. Target & Incentive
export interface TargetIncentiveMasterItem {
  targetId: string;
  employeeName: string;
  targetPeriod: string;
  revenueTarget: number;
  bookingTarget: number;
  leadTarget: number;
  conversionTarget: string;
  incentiveRule: string;
  status: "Active" | "Closed";
}

// 4. Lead Source (Hotel PMS V1 Master Specification)
export type LeadSourceCategory =
  | "Digital Advertising"
  | "Direct"
  | "Referral / B2B"
  | "OTA / Channel"
  | "Offline"
  | "Other";

export interface LeadSourceMasterItem {
  sourceId: string; // e.g. "SRC-001" (system-generated)
  sourceName: string; // Required, unique
  category: LeadSourceCategory; // Standard category dropdown
  status: "Active" | "Inactive"; // Default: Active
  description?: string; // Optional
  createdAt?: string;
  updatedAt?: string;
}

// 5. Activity Type
export interface ActivityTypeMasterItem {
  activityTypeId: string;
  activityTypeName: string;
  category: "Outreach" | "Inspection" | "Discussion" | "Task";
  status: "Active" | "Inactive";
}

// 6. Deal Stage
export interface DealStageMasterItem {
  stageId: string;
  stageName: string;
  sequence: number;
  status: "Active" | "Inactive";
}

// 7. Booking Category
export interface BookingCategoryMasterItem {
  categoryId: string;
  categoryName: string;
  applicableBookingTypes: string[];
  status: "Active" | "Inactive";
}

// 8. Contact Type
export interface ContactTypeMasterItem {
  contactTypeId: string;
  contactTypeName: string;
  status: "Active" | "Inactive";
}

// ─────────────────────────────────────────────────────────────
// INITIAL SEED DATA FOR ALL 8 MASTERS
// ─────────────────────────────────────────────────────────────

export const INITIAL_VENUES_MASTER: VenueSpaceMasterItem[] = [
  {
    venueId: "VEN-001",
    venueName: "Grand Ballroom",
    venueType: "Banquet Hall",
    minimumCapacity: 100,
    maximumCapacity: 500,
    location: "Ground Floor - West Wing",
    status: "Active",
    description: "Pillarless luxury ballroom with royal crystal chandeliers and pre-function area.",
  },
  {
    venueId: "VEN-002",
    venueName: "Royal Lawn & Gazebo",
    venueType: "Lawn",
    minimumCapacity: 150,
    maximumCapacity: 600,
    location: "East Courtyard - Garden Block",
    status: "Active",
    description: "Manicured lush lawn ideal for grand destination weddings and evening receptions.",
  },
  {
    venueId: "VEN-003",
    venueName: "Executive Boardroom A",
    venueType: "Boardroom",
    minimumCapacity: 8,
    maximumCapacity: 30,
    location: "Level 2 - Business Tower",
    status: "Active",
    description: "High-tech boardroom with video conferencing, interactive display, and executive seating.",
  },
  {
    venueId: "VEN-004",
    venueName: "Azure Poolside Deck",
    venueType: "Pool / Poolside",
    minimumCapacity: 40,
    maximumCapacity: 150,
    location: "Level 3 - Club Wing",
    status: "Active",
    description: "Open-air poolside terrace ideal for sundowner parties, socials, and cocktail mixers.",
  },
  {
    venueId: "VEN-005",
    venueName: "Saffron Banquet Hall",
    venueType: "Banquet Hall",
    minimumCapacity: 40,
    maximumCapacity: 180,
    location: "Mezzanine Floor - North Wing",
    status: "Active",
    description: "Modern banquet hall suited for corporate seminars, birthdays, and engagement gatherings.",
  },
  {
    venueId: "VEN-006",
    venueName: "Rooftop Sky Terrace",
    venueType: "Terrace",
    minimumCapacity: 30,
    maximumCapacity: 200,
    location: "Level 7 (Rooftop) - Tower 2",
    status: "Maintenance",
    description: "Panoramic skyline views with ambient mood lighting and outdoor bar counter setup.",
  },
];

const INITIAL_RATES: RateMasterItem[] = [
  { rateId: "RATE-001", rateName: "Corporate Deluxe Room Rate", rateType: "Fixed Per Night", applicableTo: "Corporate Clients", roomTypeOrService: "Deluxe King Room", amount: 5000, validFrom: "2026-01-01", validTo: "2026-12-31", status: "Active" },
  { rateId: "RATE-002", rateName: "Grand Wedding Banquet Buffet", rateType: "Per Pax Buffet", applicableTo: "Wedding Clients", roomTypeOrService: "Grand Ballroom & Buffet", amount: 1850, validFrom: "2026-01-01", validTo: "2026-12-31", status: "Active" },
  { rateId: "RATE-003", rateName: "Full Day Conference Package", rateType: "Per Pax Buffet", applicableTo: "Corporate Clients", roomTypeOrService: "Conference Hall A & Hi-Tea", amount: 1200, validFrom: "2026-01-01", validTo: "2026-12-31", status: "Active" },
  { rateId: "RATE-004", rateName: "Full Resort Buyout (24 Hrs)", rateType: "Flat Venue Rental", applicableTo: "All Channels", roomTypeOrService: "Entire Resort Grounds", amount: 2500000, validFrom: "2026-04-01", validTo: "2027-03-31", status: "Active" },
];

const INITIAL_COMMISSIONS: CommissionMasterItem[] = [
  { commissionId: "COMM-001", partnerType: "Travel Agent", partnerName: "Thomas Cook India Ltd", commissionType: "Percentage %", commissionValue: "10%", validFrom: "2026-01-01", validTo: "2026-12-31", status: "Active" },
  { commissionId: "COMM-002", partnerType: "Wedding Planner", partnerName: "All Contracted Wedding Planners", commissionType: "Percentage %", commissionValue: "5%", validFrom: "2026-01-01", validTo: "2026-12-31", status: "Active" },
  { commissionId: "COMM-003", partnerType: "Event Organizer", partnerName: "Prime Event Management", commissionType: "Flat Per Booking", commissionValue: "₹15,000 Flat", validFrom: "2026-01-01", validTo: "2026-12-31", status: "Active" },
];

const INITIAL_TARGETS: TargetIncentiveMasterItem[] = [
  { targetId: "TARGET-001", employeeName: "Amit Kumar", targetPeriod: "August 2026", revenueTarget: 2500000, bookingTarget: 12, leadTarget: 40, conversionTarget: "20%", incentiveRule: "2% on revenue exceeding 100% target", status: "Active" },
  { targetId: "TARGET-002", employeeName: "Vikram Malhotra", targetPeriod: "August 2026", revenueTarget: 4000000, bookingTarget: 18, leadTarget: 60, conversionTarget: "25%", incentiveRule: "2.5% on banquets exceeding target", status: "Active" },
  { targetId: "TARGET-003", employeeName: "Jay Kumar", targetPeriod: "August 2026", revenueTarget: 3000000, bookingTarget: 15, leadTarget: 50, conversionTarget: "22%", incentiveRule: "2% on all corporate conference closings", status: "Active" },
  { targetId: "TARGET-004", employeeName: "Ananya Roy", targetPeriod: "August 2026", revenueTarget: 2000000, bookingTarget: 10, leadTarget: 35, conversionTarget: "20%", incentiveRule: "1.5% on group room block contracts", status: "Active" },
];

export const INITIAL_LEAD_SOURCES: LeadSourceMasterItem[] = [
  { sourceId: "SRC-001", sourceName: "Google Ads", category: "Digital Advertising", status: "Active", description: "Paid search & PPC advertising campaigns", createdAt: "2026-01-01" },
  { sourceId: "SRC-002", sourceName: "Meta Ads", category: "Digital Advertising", status: "Active", description: "Instagram & Facebook sponsored campaigns & lead forms", createdAt: "2026-01-01" },
  { sourceId: "SRC-003", sourceName: "Website Inbound Inquiry", category: "Direct", status: "Active", description: "Inquiries submitted through official hotel website", createdAt: "2026-01-01" },
  { sourceId: "SRC-004", sourceName: "Direct Walk-In", category: "Direct", status: "Active", description: "In-person front desk and banquet walk-in inquiries", createdAt: "2026-01-01" },
  { sourceId: "SRC-005", sourceName: "Phone Inquiry", category: "Direct", status: "Active", description: "Inbound telephone inquiries to central reservation office", createdAt: "2026-01-01" },
  { sourceId: "SRC-006", sourceName: "Corporate B2B Reference", category: "Referral / B2B", status: "Active", description: "Corporate client referrals and partner references", createdAt: "2026-01-01" },
  { sourceId: "SRC-007", sourceName: "Travel Trade Partner", category: "Referral / B2B", status: "Active", description: "Contracted travel agencies and DMCs", createdAt: "2026-01-01" },
  { sourceId: "SRC-008", sourceName: "Wedding Expo", category: "Offline", status: "Active", description: "Leads gathered at luxury bridal shows & expos", createdAt: "2026-01-01" },
  { sourceId: "SRC-009", sourceName: "Email Inquiry", category: "Direct", status: "Active", description: "Inbound emails to reservations & sales inbox", createdAt: "2026-01-01" },
  { sourceId: "SRC-010", sourceName: "OTA / Channel", category: "OTA / Channel", status: "Active", description: "Booking.com, Agoda, MakeMyTrip direct inquiry leads", createdAt: "2026-01-01" },
];

const INITIAL_ACTIVITY_TYPES: ActivityTypeMasterItem[] = [
  { activityTypeId: "ACT-001", activityTypeName: "Call", category: "Outreach", status: "Active" },
  { activityTypeId: "ACT-002", activityTypeName: "Site Visit", category: "Inspection", status: "Active" },
  { activityTypeId: "ACT-003", activityTypeName: "Follow Up", category: "Outreach", status: "Active" },
  { activityTypeId: "ACT-004", activityTypeName: "Meeting", category: "Discussion", status: "Active" },
  { activityTypeId: "ACT-005", activityTypeName: "WhatsApp", category: "Outreach", status: "Active" },
  { activityTypeId: "ACT-006", activityTypeName: "Email", category: "Outreach", status: "Active" },
  { activityTypeId: "ACT-007", activityTypeName: "Task / Note", category: "Task", status: "Active" },
];

const INITIAL_DEAL_STAGES: DealStageMasterItem[] = [
  { stageId: "STG-001", stageName: "Qualification", sequence: 1, status: "Active" },
  { stageId: "STG-002", stageName: "Requirement Analysis", sequence: 2, status: "Active" },
  { stageId: "STG-003", stageName: "Quotation / Proposal", sequence: 3, status: "Active" },
  { stageId: "STG-004", stageName: "Negotiation", sequence: 4, status: "Active" },
  { stageId: "STG-005", stageName: "Tentative Hold", sequence: 5, status: "Active" },
  { stageId: "STG-006", stageName: "Final Decision", sequence: 6, status: "Active" },
  { stageId: "STG-007", stageName: "Won", sequence: 7, status: "Active" },
  { stageId: "STG-008", stageName: "Lost", sequence: 8, status: "Active" },
];

const INITIAL_BOOKING_CATEGORIES: BookingCategoryMasterItem[] = [
  { categoryId: "CAT-001", categoryName: "Wedding", applicableBookingTypes: ["Banquet / Event", "Room Booking"], status: "Active" },
  { categoryId: "CAT-002", categoryName: "Corporate Event", applicableBookingTypes: ["Banquet / Event", "Conference"], status: "Active" },
  { categoryId: "CAT-003", categoryName: "Conference", applicableBookingTypes: ["Conference", "Room Booking"], status: "Active" },
  { categoryId: "CAT-004", categoryName: "Birthday", applicableBookingTypes: ["Banquet / Event", "Restaurant"], status: "Active" },
  { categoryId: "CAT-005", categoryName: "Social Event", applicableBookingTypes: ["Banquet / Event", "Private Event"], status: "Active" },
  { categoryId: "CAT-006", categoryName: "Exhibition", applicableBookingTypes: ["Banquet / Event", "Conference"], status: "Active" },
  { categoryId: "CAT-007", categoryName: "Pool Party", applicableBookingTypes: ["Swimming Pool"], status: "Active" },
  { categoryId: "CAT-008", categoryName: "Restaurant Event", applicableBookingTypes: ["Restaurant"], status: "Active" },
  { categoryId: "CAT-009", categoryName: "Private Event", applicableBookingTypes: ["Private Event"], status: "Active" },
];

const INITIAL_CONTACT_TYPES: ContactTypeMasterItem[] = [
  { contactTypeId: "TYPE-001", contactTypeName: "Individual", status: "Active" },
  { contactTypeId: "TYPE-002", contactTypeName: "Corporate", status: "Active" },
  { contactTypeId: "TYPE-003", contactTypeName: "Travel Agent", status: "Active" },
  { contactTypeId: "TYPE-004", contactTypeName: "Wedding Planner", status: "Active" },
  { contactTypeId: "TYPE-005", contactTypeName: "Event Organizer", status: "Active" },
  { contactTypeId: "TYPE-006", contactTypeName: "Vendor Partner", status: "Active" },
];

const DEFAULT_VENUE_TYPES = [
  "Banquet Hall",
  "Lawn",
  "Conference Room",
  "Boardroom",
  "Pool / Poolside",
  "Restaurant",
  "Terrace",
  "Private Dining",
  "Other",
];

export const LEAD_SOURCE_CATEGORIES: LeadSourceCategory[] = [
  "Digital Advertising",
  "Direct",
  "Referral / B2B",
  "OTA / Channel",
  "Offline",
  "Other",
];

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

interface Props {
  initialTab?: MasterTabKey;
}

export function SalesMarketingMastersView({ initialTab = "venues-halls" }: Props) {
  const [activeTab] = useState<MasterTabKey>(initialTab);
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Master State Stores
  const [venues, setVenues] = useState<VenueSpaceMasterItem[]>(INITIAL_VENUES_MASTER);
  const [venueTypes, setVenueTypes] = useState<string[]>(DEFAULT_VENUE_TYPES);
  const [rates, setRates] = useState<RateMasterItem[]>(INITIAL_RATES);
  const [commissions, setCommissions] = useState<CommissionMasterItem[]>(INITIAL_COMMISSIONS);
  const [targets, setTargets] = useState<TargetIncentiveMasterItem[]>(INITIAL_TARGETS);
  const [leadSources, setLeadSources] = useState<LeadSourceMasterItem[]>(INITIAL_LEAD_SOURCES);
  const [activityTypes, setActivityTypes] = useState<ActivityTypeMasterItem[]>(INITIAL_ACTIVITY_TYPES);
  const [dealStages, setDealStages] = useState<DealStageMasterItem[]>(INITIAL_DEAL_STAGES);
  const [bookingCategories, setBookingCategories] = useState<BookingCategoryMasterItem[]>(INITIAL_BOOKING_CATEGORIES);
  const [contactTypes, setContactTypes] = useState<ContactTypeMasterItem[]>(INITIAL_CONTACT_TYPES);

  // Lead Sources Filter State
  const [leadSourceCategoryFilter, setLeadSourceCategoryFilter] = useState<string>("ALL");
  const [leadSourceStatusFilter, setLeadSourceStatusFilter] = useState<string>("ALL");

  // Lead Source Create / Edit Modal State
  const [isLeadSourceModalOpen, setIsLeadSourceModalOpen] = useState(false);
  const [editingLeadSourceId, setEditingLeadSourceId] = useState<string | null>(null);
  const [leadSourceFormData, setLeadSourceFormData] = useState<{
    sourceName: string;
    category: LeadSourceCategory;
    status: "Active" | "Inactive";
    description: string;
  }>({
    sourceName: "",
    category: "Digital Advertising",
    status: "Active",
    description: "",
  });

  // Simplified Create / Edit Venue Modal State
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
  const [editingVenueId, setEditingVenueId] = useState<string | null>(null);
  const [isAddingNewType, setIsAddingNewType] = useState(false);
  const [customTypeInput, setCustomTypeInput] = useState("");

  const [venueFormData, setVenueFormData] = useState<Omit<VenueSpaceMasterItem, "venueId">>({
    venueName: "",
    venueType: "Banquet Hall",
    minimumCapacity: 100,
    maximumCapacity: 500,
    location: "Ground Floor - West Wing",
    status: "Active",
    description: "",
  });

  // Generic Simple Modal State (for non-venue/lead-source masters)
  const [isSimpleModalOpen, setIsSimpleModalOpen] = useState(false);
  const [simpleName, setSimpleName] = useState("");

  const tabLabels: Record<MasterTabKey, string> = {
    "venues-halls": "Venues & Spaces",
    "rates-commissions": "Rates & Commissions",
    "targets-incentives": "Targets & Incentives",
    "lead-sources": "Lead Sources",
    "activity-types": "Activity Types",
    "deal-stages": "Deal Stages",
    "booking-categories": "Booking Categories",
    "contact-types": "Contact Types",
  };

  const masterDescriptions: Record<MasterTabKey, string> = {
    "venues-halls": "Define the bookable physical spaces in the hotel with their capacity, type, and location.",
    "rates-commissions": "Manage commercial pricing tariffs, banquet packages, and partner/travel agent commission rules.",
    "targets-incentives": "Define sales quotas, revenue targets, conversion goals, and incentive structures for sales executives.",
    "lead-sources": "Standardize inquiry origins and advertising channels across Leads, Campaigns, Deals, and Bookings.",
    "activity-types": "Standardize sales interaction types and follow-up actions performed by the sales team.",
    "deal-stages": "Manage sales pipeline stages and sequence order for the CRM Kanban opportunity board.",
    "booking-categories": "Classify types of event occasions and business purposes distinct from operational booking types.",
    "contact-types": "Define relationship classifications for guests, corporate clients, travel agents, and partner records.",
  };

  // ─────────────────────────────────────────────────────────────
  // HANDLERS: VENUES & SPACES
  // ─────────────────────────────────────────────────────────────

  const handleOpenCreateVenue = () => {
    setEditingVenueId(null);
    setIsAddingNewType(false);
    setCustomTypeInput("");
    setVenueFormData({
      venueName: "",
      venueType: venueTypes[0] || "Banquet Hall",
      minimumCapacity: 100,
      maximumCapacity: 500,
      location: "",
      status: "Active",
      description: "",
    });
    setIsVenueModalOpen(true);
  };

  const handleOpenEditVenue = (venue: VenueSpaceMasterItem) => {
    setEditingVenueId(venue.venueId);
    setIsAddingNewType(false);
    setCustomTypeInput("");
    setVenueFormData({
      venueName: venue.venueName,
      venueType: venue.venueType,
      minimumCapacity: venue.minimumCapacity,
      maximumCapacity: venue.maximumCapacity,
      location: venue.location,
      status: venue.status,
      description: venue.description || "",
    });
    setIsVenueModalOpen(true);
  };

  const handleAddCustomType = () => {
    if (!customTypeInput.trim()) return;
    const cleanType = customTypeInput.trim();
    if (!venueTypes.includes(cleanType)) {
      setVenueTypes((prev) => [...prev, cleanType]);
    }
    setVenueFormData((prev) => ({ ...prev, venueType: cleanType }));
    setCustomTypeInput("");
    setIsAddingNewType(false);
    setToastMessage(`✓ Added new Venue Type "${cleanType}"!`);
  };

  const handleSaveVenue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueFormData.venueName.trim()) return;

    if (editingVenueId) {
      setVenues((prev) =>
        prev.map((v) => (v.venueId === editingVenueId ? { ...venueFormData, venueId: editingVenueId } : v))
      );
      setToastMessage(`✓ Updated venue "${venueFormData.venueName}" (${editingVenueId}) successfully!`);
    } else {
      const newId = `VEN-00${venues.length + 1}`;
      const newVenue: VenueSpaceMasterItem = {
        ...venueFormData,
        venueId: newId,
      };
      setVenues((prev) => [newVenue, ...prev]);
      setToastMessage(`✓ Created new venue "${venueFormData.venueName}" (${newId})!`);
    }
    setIsVenueModalOpen(false);
  };

  // ─────────────────────────────────────────────────────────────
  // HANDLERS: LEAD SOURCES MASTER (HOTEL PMS V1)
  // ─────────────────────────────────────────────────────────────

  const handleOpenCreateLeadSource = () => {
    setEditingLeadSourceId(null);
    setLeadSourceFormData({
      sourceName: "",
      category: "Digital Advertising",
      status: "Active",
      description: "",
    });
    setIsLeadSourceModalOpen(true);
  };

  const handleOpenEditLeadSource = (item: LeadSourceMasterItem) => {
    setEditingLeadSourceId(item.sourceId);
    setLeadSourceFormData({
      sourceName: item.sourceName,
      category: item.category,
      status: item.status,
      description: item.description || "",
    });
    setIsLeadSourceModalOpen(true);
  };

  const handleSaveLeadSource = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = leadSourceFormData.sourceName.trim();
    if (!cleanName) return;

    // Check duplicate source name (case-insensitive)
    const isDuplicate = leadSources.some(
      (s) => s.sourceName.toLowerCase() === cleanName.toLowerCase() && s.sourceId !== editingLeadSourceId
    );

    if (isDuplicate) {
      alert(`Lead Source "${cleanName}" already exists. Please enter a unique name.`);
      return;
    }

    if (editingLeadSourceId) {
      // Edit existing source
      setLeadSources((prev) =>
        prev.map((s) =>
          s.sourceId === editingLeadSourceId
            ? {
                ...s,
                sourceName: cleanName,
                category: leadSourceFormData.category,
                status: leadSourceFormData.status,
                description: leadSourceFormData.description.trim(),
                updatedAt: "Today",
              }
            : s
        )
      );
      setToastMessage(`✓ Updated Lead Source "${cleanName}" (#${editingLeadSourceId})!`);
    } else {
      // Create new source
      const nextNum = leadSources.length + 1;
      const newId = `SRC-${String(nextNum).padStart(3, "0")}`;
      const newSource: LeadSourceMasterItem = {
        sourceId: newId,
        sourceName: cleanName,
        category: leadSourceFormData.category,
        status: leadSourceFormData.status,
        description: leadSourceFormData.description.trim(),
        createdAt: "Today",
        updatedAt: "Today",
      };

      setLeadSources((prev) => [...prev, newSource]);
      setToastMessage(`✓ Created new Lead Source "${cleanName}" (${newId})!`);
    }

    setIsLeadSourceModalOpen(false);
  };

  // Toggle Status for Master Records
  const handleToggleStatus = (masterKey: MasterTabKey, id: string) => {
    if (masterKey === "venues-halls") {
      setVenues((prev) =>
        prev.map((v) => {
          if (v.venueId === id) {
            const nextStatus: "Active" | "Maintenance" | "Inactive" =
              v.status === "Active" ? "Maintenance" : v.status === "Maintenance" ? "Inactive" : "Active";
            return { ...v, status: nextStatus };
          }
          return v;
        })
      );
    } else if (masterKey === "lead-sources") {
      setLeadSources((prev) =>
        prev.map((s) => (s.sourceId === id ? { ...s, status: s.status === "Active" ? "Inactive" : "Active" } : s))
      );
    } else if (masterKey === "activity-types") {
      setActivityTypes((prev) =>
        prev.map((a) => (a.activityTypeId === id ? { ...a, status: a.status === "Active" ? "Inactive" : "Active" } : a))
      );
    } else if (masterKey === "deal-stages") {
      setDealStages((prev) =>
        prev.map((d) => (d.stageId === id ? { ...d, status: d.status === "Active" ? "Inactive" : "Active" } : d))
      );
    } else if (masterKey === "booking-categories") {
      setBookingCategories((prev) =>
        prev.map((c) => (c.categoryId === id ? { ...c, status: c.status === "Active" ? "Inactive" : "Active" } : c))
      );
    } else if (masterKey === "contact-types") {
      setContactTypes((prev) =>
        prev.map((c) => (c.contactTypeId === id ? { ...c, status: c.status === "Active" ? "Inactive" : "Active" } : c))
      );
    }
    setToastMessage(`✓ Updated status!`);
  };

  // Save Simple Master
  const handleSaveSimple = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simpleName.trim()) return;

    if (activeTab === "activity-types") {
      const newId = `ACT-00${activityTypes.length + 1}`;
      setActivityTypes([...activityTypes, { activityTypeId: newId, activityTypeName: simpleName.trim(), category: "Outreach", status: "Active" }]);
    } else if (activeTab === "booking-categories") {
      const newId = `CAT-00${bookingCategories.length + 1}`;
      setBookingCategories([...bookingCategories, { categoryId: newId, categoryName: simpleName.trim(), applicableBookingTypes: ["Banquet / Event"], status: "Active" }]);
    } else if (activeTab === "contact-types") {
      const newId = `TYPE-00${contactTypes.length + 1}`;
      setContactTypes([...contactTypes, { contactTypeId: newId, contactTypeName: simpleName.trim(), status: "Active" }]);
    }

    setToastMessage(`✓ Added new master item "${simpleName.trim()}"!`);
    setSimpleName("");
    setIsSimpleModalOpen(false);
  };

  // Filtered Venues
  const filteredVenues = useMemo(() => {
    if (!searchTerm.trim()) return venues;
    const lower = searchTerm.toLowerCase();
    return venues.filter(
      (v) =>
        v.venueId.toLowerCase().includes(lower) ||
        v.venueName.toLowerCase().includes(lower) ||
        v.venueType.toLowerCase().includes(lower) ||
        v.location.toLowerCase().includes(lower)
    );
  }, [venues, searchTerm]);

  // Filtered Lead Sources
  const filteredLeadSources = useMemo(() => {
    return leadSources.filter((s) => {
      // Search
      const lower = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm.trim() ||
        s.sourceId.toLowerCase().includes(lower) ||
        s.sourceName.toLowerCase().includes(lower) ||
        s.category.toLowerCase().includes(lower) ||
        (s.description && s.description.toLowerCase().includes(lower));

      // Category filter
      const matchCategory = leadSourceCategoryFilter === "ALL" || s.category === leadSourceCategoryFilter;

      // Status filter
      const matchStatus = leadSourceStatusFilter === "ALL" || s.status === leadSourceStatusFilter;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [leadSources, searchTerm, leadSourceCategoryFilter, leadSourceStatusFilter]);

  return (
    <ModulePageShell
      eyebrow="Sales & Marketing Masters"
      title={`${tabLabels[activeTab]} Master`}
      description={masterDescriptions[activeTab]}
      breadcrumbs={[
        { label: "Sales & Marketing", href: "/sales-marketing/dashboard" },
        { label: "Masters" },
        { label: tabLabels[activeTab] },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        activeTab === "venues-halls" ? (
          <Button
            type="button"
            size="sm"
            onClick={handleOpenCreateVenue}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 px-3.5 h-8.5"
          >
            <Plus className="h-4 w-4" /> + Add Venue
          </Button>
        ) : activeTab === "lead-sources" ? (
          <Button
            type="button"
            size="sm"
            onClick={handleOpenCreateLeadSource}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 px-3.5 h-8.5"
          >
            <Plus className="h-4 w-4" /> + Add Lead Source
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setSimpleName("");
              setIsSimpleModalOpen(true);
            }}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 px-3.5 h-8.5"
          >
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        )
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          SEARCH & FILTER TOOLBAR
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs mb-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${tabLabels[activeTab]} by name, ID, category, or notes...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-200 pl-9 pr-3 py-2 bg-slate-50 font-medium text-slate-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-400"
          />
        </div>

        {/* Lead Sources Filter Dropdowns */}
        {activeTab === "lead-sources" && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={leadSourceCategoryFilter}
              onChange={(e) => setLeadSourceCategoryFilter(e.target.value)}
              className="text-xs font-semibold rounded-lg border border-slate-200 py-2 px-2.5 bg-white text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              {LEAD_SOURCE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={leadSourceStatusFilter}
              onChange={(e) => setLeadSourceStatusFilter(e.target.value)}
              className="text-xs font-semibold rounded-lg border border-slate-200 py-2 px-2.5 bg-white text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        )}

        <span className="text-xs text-slate-500 font-medium whitespace-nowrap hidden sm:inline">
          Total:{" "}
          <strong>
            {activeTab === "venues-halls"
              ? filteredVenues.length
              : activeTab === "lead-sources"
              ? filteredLeadSources.length
              : "8"}
          </strong>{" "}
          items
        </span>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. VENUES & SPACES TABLE
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "venues-halls" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Venue ID</th>
                  <th className="py-3 px-4">Venue Name</th>
                  <th className="py-3 px-4">Venue Type</th>
                  <th className="py-3 px-4 text-center">Capacity</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredVenues.length > 0 ? (
                  filteredVenues.map((v) => (
                    <tr
                      key={v.venueId}
                      onClick={() => handleOpenEditVenue(v)}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800">#{v.venueId}</td>
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 font-bold block">{v.venueName}</strong>
                        {v.description && (
                          <span className="text-[10px] text-slate-500 line-clamp-1">{v.description}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                          {v.venueType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-900">
                        {v.minimumCapacity}–{v.maximumCapacity} Pax
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">{v.location}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1",
                            v.status === "Active"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : v.status === "Maintenance"
                              ? "bg-amber-100 text-amber-900 border-amber-300 font-bold"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          )}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditVenue(v)}
                            className="text-[11px] h-7 px-2.5"
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus("venues-halls", v.venueId)}
                            className="text-[11px] h-7 px-2.5"
                          >
                            {v.status === "Active" ? "Maintenance" : v.status === "Maintenance" ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs italic">
                      No venues found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. RATES & COMMISSIONS TABLE
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "rates-commissions" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
              <strong className="text-xs font-bold text-slate-900">Standard Pricing Tariffs &amp; Packages</strong>
            </div>
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Rate ID</th>
                  <th className="py-3 px-4">Rate Name</th>
                  <th className="py-3 px-4">Rate Type</th>
                  <th className="py-3 px-4">Applicable To</th>
                  <th className="py-3 px-4">Room / Service</th>
                  <th className="py-3 px-4 text-right">Standard Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {rates.map((r) => (
                  <tr key={r.rateId} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800">#{r.rateId}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{r.rateName}</td>
                    <td className="py-3 px-4 text-slate-600">{r.rateType}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{r.applicableTo}</td>
                    <td className="py-3 px-4 text-slate-600">{r.roomTypeOrService}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-900">
                      ₹{r.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
              <strong className="text-xs font-bold text-slate-900">Partner &amp; Agency Commission Rules</strong>
            </div>
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Commission ID</th>
                  <th className="py-3 px-4">Partner Type</th>
                  <th className="py-3 px-4">Partner / Agency Name</th>
                  <th className="py-3 px-4">Commission Type</th>
                  <th className="py-3 px-4 font-mono">Commission Value</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {commissions.map((c) => (
                  <tr key={c.commissionId} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-purple-800">#{c.commissionId}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{c.partnerType}</td>
                    <td className="py-3 px-4 text-slate-700">{c.partnerName}</td>
                    <td className="py-3 px-4 text-slate-600">{c.commissionType}</td>
                    <td className="py-3 px-4 font-mono font-bold text-purple-900">{c.commissionValue}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. TARGETS & INCENTIVES TABLE
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "targets-incentives" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Target ID</th>
                  <th className="py-3 px-4">Employee / Executive</th>
                  <th className="py-3 px-4">Target Period</th>
                  <th className="py-3 px-4 text-right">Revenue Target</th>
                  <th className="py-3 px-4 text-center">Bookings Target</th>
                  <th className="py-3 px-4 text-center">Lead Target</th>
                  <th className="py-3 px-4 text-center">Conversion %</th>
                  <th className="py-3 px-4">Incentive Rule</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {targets.map((t) => (
                  <tr key={t.targetId} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-amber-800">#{t.targetId}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{t.employeeName}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{t.targetPeriod}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-900">
                      ₹{t.revenueTarget.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">{t.bookingTarget}</td>
                    <td className="py-3 px-4 text-center font-mono text-slate-600">{t.leadTarget}</td>
                    <td className="py-3 px-4 text-center font-mono text-purple-900 font-bold">{t.conversionTarget}</td>
                    <td className="py-3 px-4 text-slate-600 text-[11px] max-w-[240px] truncate">{t.incentiveRule}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. LEAD SOURCES TABLE (HOTEL PMS V1 MASTER SPECIFICATION)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "lead-sources" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Source ID</th>
                  <th className="py-3 px-4">Source Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredLeadSources.length > 0 ? (
                  filteredLeadSources.map((s) => (
                    <tr
                      key={s.sourceId}
                      onClick={() => handleOpenEditLeadSource(s)}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                    >
                      {/* Source ID */}
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800">#{s.sourceId}</td>

                      {/* Source Name */}
                      <td className="py-3 px-4 font-bold text-slate-900">{s.sourceName}</td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-md text-[10px] font-semibold border inline-block",
                            s.category === "Digital Advertising"
                              ? "bg-purple-50 text-purple-900 border-purple-200"
                              : s.category === "Direct"
                              ? "bg-blue-50 text-blue-900 border-blue-200"
                              : s.category === "Referral / B2B"
                              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                              : s.category === "OTA / Channel"
                              ? "bg-amber-50 text-amber-900 border-amber-200"
                              : "bg-slate-100 text-slate-800 border-slate-200"
                          )}
                        >
                          {s.category}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {s.description || "—"}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block",
                            s.status === "Active"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          )}
                        >
                          {s.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditLeadSource(s)}
                            className="text-[11px] h-7 px-2.5"
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus("lead-sources", s.sourceId)}
                            className={cn(
                              "text-[11px] h-7 px-2.5",
                              s.status === "Active" ? "text-slate-600" : "text-emerald-700 border-emerald-200 bg-emerald-50/50"
                            )}
                          >
                            {s.status === "Active" ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs italic">
                      No Lead Sources found matching your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. ACTIVITY TYPES TABLE
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "activity-types" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Activity Type ID</th>
                  <th className="py-3 px-4">Type Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {activityTypes.map((a) => (
                  <tr key={a.activityTypeId} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800">#{a.activityTypeId}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{a.activityTypeName}</td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                        {a.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block",
                          a.status === "Active"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        )}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus("activity-types", a.activityTypeId)}
                        className="text-[11px] h-7 px-2.5"
                      >
                        {a.status === "Active" ? "Deactivate" : "Activate"}
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
          6. DEAL STAGES TABLE
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "deal-stages" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Stage ID</th>
                  <th className="py-3 px-4">Stage Name</th>
                  <th className="py-3 px-4 text-center">Sequence</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {dealStages.map((d) => (
                  <tr key={d.stageId} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-purple-800">#{d.stageId}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{d.stageName}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                      Step {d.sequence}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block",
                          d.status === "Active"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        )}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus("deal-stages", d.stageId)}
                        className="text-[11px] h-7 px-2.5"
                      >
                        {d.status === "Active" ? "Deactivate" : "Activate"}
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
          7. BOOKING CATEGORIES TABLE
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "booking-categories" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Category ID</th>
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4">Applicable Booking Types</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {bookingCategories.map((c) => (
                  <tr key={c.categoryId} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800">#{c.categoryId}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{c.categoryName}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {c.applicableBookingTypes.map((t) => (
                          <span
                            key={t}
                            className="bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.2 rounded text-[10px]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block",
                          c.status === "Active"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        )}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus("booking-categories", c.categoryId)}
                        className="text-[11px] h-7 px-2.5"
                      >
                        {c.status === "Active" ? "Deactivate" : "Activate"}
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
          8. CONTACT TYPES TABLE
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "contact-types" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Type ID</th>
                  <th className="py-3 px-4">Contact Type Name</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {contactTypes.map((ct) => (
                  <tr key={ct.contactTypeId} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-blue-800">#{ct.contactTypeId}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{ct.contactTypeName}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block",
                          ct.status === "Active"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        )}
                      >
                        {ct.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus("contact-types", ct.contactTypeId)}
                        className="text-[11px] h-7 px-2.5"
                      >
                        {ct.status === "Active" ? "Deactivate" : "Activate"}
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
          CREATE / EDIT VENUE MODAL
      ───────────────────────────────────────────────────────────── */}
      {isVenueModalOpen && (
        <Modal
          isOpen={isVenueModalOpen}
          onClose={() => setIsVenueModalOpen(false)}
          title={editingVenueId ? `Edit Venue / Space — #${editingVenueId}` : "Create Venue / Space"}
          maxWidth="md"
        >
          <form onSubmit={handleSaveVenue} className="space-y-3.5 p-1 text-xs">
            {/* 1. Venue / Space Name */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Venue / Space Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Grand Ballroom"
                value={venueFormData.venueName}
                onChange={(e) => setVenueFormData({ ...venueFormData, venueName: e.target.value })}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* 2. Venue Type */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-700 text-[11px]">
                  Venue Type <span className="text-rose-500">*</span>
                </label>
                {!isAddingNewType && (
                  <button
                    type="button"
                    onClick={() => setIsAddingNewType(true)}
                    className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer flex items-center gap-0.5"
                  >
                    <Plus className="h-3 w-3" /> Add Type
                  </button>
                )}
              </div>

              {isAddingNewType ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Enter custom venue type..."
                    value={customTypeInput}
                    onChange={(e) => setCustomTypeInput(e.target.value)}
                    className="flex-1 p-2 rounded-lg border border-emerald-300 bg-emerald-50/40 font-semibold text-slate-900 text-xs focus:outline-none"
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddCustomType}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold h-8 px-2.5 text-xs rounded-lg cursor-pointer"
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsAddingNewType(false);
                      setCustomTypeInput("");
                    }}
                    className="h-8 px-2 text-xs rounded-lg cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <select
                  value={venueFormData.venueType}
                  onChange={(e) => setVenueFormData({ ...venueFormData, venueType: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                >
                  {venueTypes.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 3 & 4. Capacity (Min & Max) */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Minimum Capacity (Pax)</label>
                <input
                  type="number"
                  min={1}
                  placeholder="e.g. 100"
                  value={venueFormData.minimumCapacity}
                  onChange={(e) => setVenueFormData({ ...venueFormData, minimumCapacity: Number(e.target.value) || 1 })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono font-semibold text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Maximum Capacity (Pax)</label>
                <input
                  type="number"
                  min={1}
                  placeholder="e.g. 500"
                  value={venueFormData.maximumCapacity}
                  onChange={(e) => setVenueFormData({ ...venueFormData, maximumCapacity: Number(e.target.value) || 1 })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono font-semibold text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            {/* 5. Location */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Location</label>
              <input
                type="text"
                placeholder="e.g. Ground Floor - West Wing"
                value={venueFormData.location}
                onChange={(e) => setVenueFormData({ ...venueFormData, location: e.target.value })}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* 6. Status */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Status</label>
              <select
                value={venueFormData.status}
                onChange={(e) =>
                  setVenueFormData({
                    ...venueFormData,
                    status: e.target.value as "Active" | "Maintenance" | "Inactive",
                  })
                }
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-bold text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="Active">Active</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* 7. Description */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Description <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Brief notes about the space, view, or ambiance..."
                value={venueFormData.description}
                onChange={(e) => setVenueFormData({ ...venueFormData, description: e.target.value })}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsVenueModalOpen(false)}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs px-4"
              >
                {editingVenueId ? "Save Changes" : "Create Venue"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          CREATE / EDIT LEAD SOURCE MODAL (HOTEL PMS V1)
      ───────────────────────────────────────────────────────────── */}
      {isLeadSourceModalOpen && (
        <Modal
          isOpen={isLeadSourceModalOpen}
          onClose={() => setIsLeadSourceModalOpen(false)}
          title={
            editingLeadSourceId
              ? `Edit Lead Source — #${editingLeadSourceId}`
              : "Create Lead Source"
          }
          maxWidth="sm"
        >
          <form onSubmit={handleSaveLeadSource} className="space-y-3.5 p-1 text-xs">
            {/* Auto ID Display when editing */}
            {editingLeadSourceId && (
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-500 font-medium">Source ID:</span>
                <strong className="font-mono text-emerald-800 font-bold">#{editingLeadSourceId}</strong>
              </div>
            )}

            {/* 1. Source Name */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Source Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Google Ads, Meta Ads, Website..."
                value={leadSourceFormData.sourceName}
                onChange={(e) => setLeadSourceFormData({ ...leadSourceFormData, sourceName: e.target.value })}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* 2. Category */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={leadSourceFormData.category}
                onChange={(e) =>
                  setLeadSourceFormData({
                    ...leadSourceFormData,
                    category: e.target.value as LeadSourceCategory,
                  })
                }
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              >
                {LEAD_SOURCE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Description */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Description <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Brief notes about how leads from this origin are captured..."
                value={leadSourceFormData.description}
                onChange={(e) => setLeadSourceFormData({ ...leadSourceFormData, description: e.target.value })}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* 4. Status */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Status</label>
              <select
                value={leadSourceFormData.status}
                onChange={(e) =>
                  setLeadSourceFormData({
                    ...leadSourceFormData,
                    status: e.target.value as "Active" | "Inactive",
                  })
                }
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-bold text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsLeadSourceModalOpen(false)}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs px-4"
              >
                {editingLeadSourceId ? "Save Changes" : "Create Lead Source"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          GENERIC SIMPLE MODAL (FOR OTHER MASTERS)
      ───────────────────────────────────────────────────────────── */}
      {isSimpleModalOpen && (
        <Modal
          isOpen={isSimpleModalOpen}
          onClose={() => setIsSimpleModalOpen(false)}
          title={`Add New — ${tabLabels[activeTab]}`}
          maxWidth="sm"
        >
          <form onSubmit={handleSaveSimple} className="space-y-3 p-1 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Name / Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Item Name"
                value={simpleName}
                onChange={(e) => setSimpleName(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-900 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsSimpleModalOpen(false)}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs"
              >
                Create Item
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </ModulePageShell>
  );
}
