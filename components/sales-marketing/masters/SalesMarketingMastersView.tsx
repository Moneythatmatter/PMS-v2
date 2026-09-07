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

// 5. Activity Type (Hotel PMS V1 Master Specification)
export type ActivityTypeCategory =
  | "Communication"
  | "Visit"
  | "Meeting"
  | "Task"
  | "Other";

export interface ActivityTypeMasterItem {
  activityTypeId: string; // e.g. "ACT-001" (system-generated)
  typeName: string; // Required, unique
  category: ActivityTypeCategory; // Dropdown
  description?: string; // Optional
  status: "Active" | "Inactive"; // Default: Active
  createdAt: string;
  updatedAt: string;
}

// 6. Deal Stage (Hotel PMS V1 Master Specification)
export interface DealStageMasterItem {
  stageId: string; // e.g. "STG-001" (system-generated)
  stageName: string; // Required, unique
  sequence: number; // Required, unique across active stages
  description?: string; // Optional
  status: "Active" | "Inactive"; // Default: Active
  createdAt?: string;
  updatedAt?: string;
}

// 7. Booking Category (Hotel PMS V1 Master Specification)
export type ApplicableBookingType =
  | "Room Booking"
  | "Banquet / Event"
  | "Conference / Meeting"
  | "Restaurant"
  | "Swimming Pool"
  | "Private / Other Event";

export const APPLICABLE_BOOKING_TYPES: ApplicableBookingType[] = [
  "Room Booking",
  "Banquet / Event",
  "Conference / Meeting",
  "Restaurant",
  "Swimming Pool",
  "Private / Other Event",
];

export interface BookingCategoryMasterItem {
  categoryId: string; // e.g. "CAT-001" (system-generated)
  categoryName: string; // Required, unique
  applicableBookingTypes: ApplicableBookingType[]; // Required (multi-select)
  description?: string; // Optional
  status: "Active" | "Inactive"; // Default: Active
  createdAt?: string;
  updatedAt?: string;
}

// 8. Contact Type (Hotel PMS V1 Master Specification)
export interface ContactTypeMasterItem {
  contactTypeId: string; // e.g. "CT-001" (system-generated)
  contactTypeName: string; // Required, unique
  description?: string; // Optional
  status: "Active" | "Inactive"; // Default: Active
  createdAt?: string;
  updatedAt?: string;
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

export const ACTIVITY_TYPE_CATEGORIES: ActivityTypeCategory[] = [
  "Communication",
  "Visit",
  "Meeting",
  "Task",
  "Other",
];

export const INITIAL_ACTIVITY_TYPES: ActivityTypeMasterItem[] = [
  {
    activityTypeId: "ACT-001",
    typeName: "Call",
    category: "Communication",
    description: "Phone communication with lead or client.",
    status: "Active",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    activityTypeId: "ACT-002",
    typeName: "Site Visit",
    category: "Visit",
    description: "Customer venue inspection.",
    status: "Active",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    activityTypeId: "ACT-003",
    typeName: "Follow Up",
    category: "Communication",
    description: "Sales follow-up after previous interaction.",
    status: "Active",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    activityTypeId: "ACT-004",
    typeName: "Meeting",
    category: "Meeting",
    description: "Formal customer or partner meeting.",
    status: "Active",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    activityTypeId: "ACT-005",
    typeName: "WhatsApp",
    category: "Communication",
    description: "WhatsApp customer communication.",
    status: "Active",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    activityTypeId: "ACT-006",
    typeName: "Email",
    category: "Communication",
    description: "Email communication.",
    status: "Active",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    activityTypeId: "ACT-007",
    typeName: "Task / Note",
    category: "Task",
    description: "Internal sales task or note.",
    status: "Active",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
];

export const INITIAL_DEAL_STAGES: DealStageMasterItem[] = [
  {
    stageId: "STG-001",
    stageName: "Qualification",
    sequence: 1,
    description: "Initial opportunity assessment.",
    status: "Active",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    stageId: "STG-002",
    stageName: "Requirement Analysis",
    sequence: 2,
    description: "Confirming event, stay, guest and business requirements.",
    status: "Active",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    stageId: "STG-003",
    stageName: "Quotation / Proposal",
    sequence: 3,
    description: "Formal commercial proposal has been prepared or sent.",
    status: "Active",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    stageId: "STG-004",
    stageName: "Negotiation",
    sequence: 4,
    description: "Customer and hotel are discussing pricing and terms.",
    status: "Active",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    stageId: "STG-005",
    stageName: "Tentative Hold",
    sequence: 5,
    description: "Venue/date temporarily held while awaiting final confirmation.",
    status: "Active",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    stageId: "STG-006",
    stageName: "Final Decision",
    sequence: 6,
    description: "Customer is making the final booking decision.",
    status: "Active",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    stageId: "STG-007",
    stageName: "Won",
    sequence: 7,
    description: "Sales opportunity successfully converted to business.",
    status: "Active",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    stageId: "STG-008",
    stageName: "Lost",
    sequence: 8,
    description: "Sales opportunity will not proceed.",
    status: "Active",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
];

export const INITIAL_BOOKING_CATEGORIES: BookingCategoryMasterItem[] = [
  {
    categoryId: "CAT-001",
    categoryName: "Wedding",
    applicableBookingTypes: ["Banquet / Event", "Room Booking"],
    description: "Wedding-related hotel event or celebration.",
    status: "Active",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    categoryId: "CAT-002",
    categoryName: "Corporate Event",
    applicableBookingTypes: ["Banquet / Event", "Conference / Meeting", "Room Booking"],
    description: "Corporate meetings, conferences, seminars or business events.",
    status: "Active",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    categoryId: "CAT-003",
    categoryName: "Conference",
    applicableBookingTypes: ["Conference / Meeting", "Room Booking"],
    description: "Formal industry conference, seminar or symposium.",
    status: "Active",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    categoryId: "CAT-004",
    categoryName: "Birthday",
    applicableBookingTypes: ["Banquet / Event", "Restaurant", "Private / Other Event"],
    description: "Birthday celebration or private social function.",
    status: "Active",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    categoryId: "CAT-005",
    categoryName: "Social Event",
    applicableBookingTypes: ["Banquet / Event", "Private / Other Event"],
    description: "Social gathering, anniversary or family celebration.",
    status: "Active",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    categoryId: "CAT-006",
    categoryName: "Exhibition",
    applicableBookingTypes: ["Banquet / Event", "Conference / Meeting"],
    description: "Trade fair, art display or commercial product showcase.",
    status: "Active",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    categoryId: "CAT-007",
    categoryName: "Pool Party",
    applicableBookingTypes: ["Swimming Pool"],
    description: "Private or group poolside celebration.",
    status: "Active",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    categoryId: "CAT-008",
    categoryName: "Restaurant Event",
    applicableBookingTypes: ["Restaurant"],
    description: "Special dining or restaurant-hosted event.",
    status: "Active",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    categoryId: "CAT-009",
    categoryName: "Private Event",
    applicableBookingTypes: ["Private / Other Event"],
    description: "Exclusive private gathering or closed-door session.",
    status: "Active",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
];

/**
 * Helper to get active booking categories applicable to a given booking type.
 */
export function getApplicableCategories(
  bookingType: string,
  categories: BookingCategoryMasterItem[] = INITIAL_BOOKING_CATEGORIES
): BookingCategoryMasterItem[] {
  return categories.filter(
    (cat) =>
      cat.status === "Active" &&
      (cat.applicableBookingTypes.includes(bookingType as ApplicableBookingType) ||
        bookingType === "ALL")
  );
}

export const INITIAL_CONTACT_TYPES: ContactTypeMasterItem[] = [
  {
    contactTypeId: "CT-001",
    contactTypeName: "Individual",
    description: "Individual guest or personal customer.",
    status: "Active",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    contactTypeId: "CT-002",
    contactTypeName: "Corporate",
    description: "Company or organization doing business with the hotel.",
    status: "Active",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    contactTypeId: "CT-003",
    contactTypeName: "Travel Agent",
    description: "Travel trade partner arranging guest stays or hotel services.",
    status: "Active",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    contactTypeId: "CT-004",
    contactTypeName: "Wedding Planner",
    description: "Professional wedding planner managing events or wedding bookings.",
    status: "Active",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    contactTypeId: "CT-005",
    contactTypeName: "Event Organizer",
    description: "Third-party event organizer arranging conferences, social events or other functions.",
    status: "Active",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    contactTypeId: "CT-006",
    contactTypeName: "Vendor Partner",
    description: "External business partner or vendor relationship.",
    status: "Active",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
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
  const [leadSources, setLeadSources] = useState<LeadSourceMasterItem[]>(INITIAL_LEAD_SOURCES);
  const [activityTypes, setActivityTypes] = useState<ActivityTypeMasterItem[]>(INITIAL_ACTIVITY_TYPES);
  const [dealStages, setDealStages] = useState<DealStageMasterItem[]>(INITIAL_DEAL_STAGES);
  const [bookingCategories, setBookingCategories] = useState<BookingCategoryMasterItem[]>(INITIAL_BOOKING_CATEGORIES);
  const [contactTypes, setContactTypes] = useState<ContactTypeMasterItem[]>(INITIAL_CONTACT_TYPES);

  // Lead Sources Filter State
  const [leadSourceCategoryFilter, setLeadSourceCategoryFilter] = useState<string>("ALL");
  const [leadSourceStatusFilter, setLeadSourceStatusFilter] = useState<string>("ALL");

  // Activity Types Filter State
  const [activityTypeCategoryFilter, setActivityTypeCategoryFilter] = useState<string>("ALL");
  const [activityTypeStatusFilter, setActivityTypeStatusFilter] = useState<string>("ALL");

  // Deal Stages Filter State
  const [dealStageStatusFilter, setDealStageStatusFilter] = useState<string>("ALL");

  // Deal Stage Create / Edit Modal State
  const [isDealStageModalOpen, setIsDealStageModalOpen] = useState(false);
  const [editingDealStageId, setEditingDealStageId] = useState<string | null>(null);
  const [dealStageFormData, setDealStageFormData] = useState<{
    stageName: string;
    sequence: number;
    description: string;
    status: "Active" | "Inactive";
  }>({
    stageName: "",
    sequence: 1,
    description: "",
    status: "Active",
  });

  // Booking Categories Filter State
  const [bookingCategoryTypeFilter, setBookingCategoryTypeFilter] = useState<string>("ALL");
  const [bookingCategoryStatusFilter, setBookingCategoryStatusFilter] = useState<string>("ALL");

  // Booking Category Create / Edit Modal State
  const [isBookingCategoryModalOpen, setIsBookingCategoryModalOpen] = useState(false);
  const [editingBookingCategoryId, setEditingBookingCategoryId] = useState<string | null>(null);
  const [bookingCategoryFormData, setBookingCategoryFormData] = useState<{
    categoryName: string;
    applicableBookingTypes: ApplicableBookingType[];
    description: string;
    status: "Active" | "Inactive";
  }>({
    categoryName: "",
    applicableBookingTypes: ["Banquet / Event"],
    description: "",
    status: "Active",
  });

  // Contact Types Filter State
  const [contactTypeStatusFilter, setContactTypeStatusFilter] = useState<string>("ALL");

  // Contact Type Create / Edit Modal State
  const [isContactTypeModalOpen, setIsContactTypeModalOpen] = useState(false);
  const [editingContactTypeId, setEditingContactTypeId] = useState<string | null>(null);
  const [contactTypeFormData, setContactTypeFormData] = useState<{
    contactTypeName: string;
    description: string;
    status: "Active" | "Inactive";
  }>({
    contactTypeName: "",
    description: "",
    status: "Active",
  });

  // Activity Type Create / Edit Modal State
  const [isActivityTypeModalOpen, setIsActivityTypeModalOpen] = useState(false);
  const [editingActivityTypeId, setEditingActivityTypeId] = useState<string | null>(null);
  const [activityTypeFormData, setActivityTypeFormData] = useState<{
    typeName: string;
    category: ActivityTypeCategory;
    status: "Active" | "Inactive";
    description: string;
  }>({
    typeName: "",
    category: "Communication",
    status: "Active",
    description: "",
  });

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

  const tabLabels: Record<MasterTabKey, string> = {
    "venues-halls": "Venues & Spaces",
    "rates-commissions": "Rates & Commissions",
    "lead-sources": "Lead Sources",
    "activity-types": "Activity Types",
    "deal-stages": "Deal Stages",
    "booking-categories": "Booking Categories",
    "contact-types": "Contact Types",
  };

  const masterDescriptions: Record<MasterTabKey, string> = {
    "venues-halls": "Define the bookable physical spaces in the hotel with their capacity, type, and location.",
    "rates-commissions": "Manage commercial pricing tariffs, banquet packages, and partner/travel agent commission rules.",
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

  // Handlers for Activity Types Master (Hotel PMS V1)
  const handleOpenCreateActivityType = () => {
    setEditingActivityTypeId(null);
    setActivityTypeFormData({
      typeName: "",
      category: "Communication",
      status: "Active",
      description: "",
    });
    setIsActivityTypeModalOpen(true);
  };

  const handleOpenEditActivityType = (item: ActivityTypeMasterItem) => {
    setEditingActivityTypeId(item.activityTypeId);
    setActivityTypeFormData({
      typeName: item.typeName,
      category: item.category,
      status: item.status,
      description: item.description || "",
    });
    setIsActivityTypeModalOpen(true);
  };

  const handleSaveActivityType = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = activityTypeFormData.typeName.trim();

    // 1. Required & Length Validations
    if (!cleanName) {
      alert("Type Name is required.");
      return;
    }
    if (cleanName.length < 3) {
      alert("Type Name must be at least 3 characters long.");
      return;
    }
    if (!/[a-zA-Z]/.test(cleanName)) {
      alert("Type Name must contain at least one alphabetic letter.");
      return;
    }

    // 2. Reject obviously invalid values
    const lower = cleanName.toLowerCase();
    if (lower === "test" || lower === "123") {
      alert("Please enter a valid Activity Type Name.");
      return;
    }

    // 3. Case-insensitive duplicate check
    const isDuplicate = activityTypes.some((a) => {
      if (editingActivityTypeId && a.activityTypeId === editingActivityTypeId) {
        return false;
      }
      return a.typeName.trim().toLowerCase() === lower;
    });

    if (isDuplicate) {
      alert("Activity type already exists.");
      return;
    }

    if (editingActivityTypeId) {
      // Edit existing
      setActivityTypes((prev) =>
        prev.map((a) =>
          a.activityTypeId === editingActivityTypeId
            ? {
                ...a,
                typeName: cleanName,
                category: activityTypeFormData.category,
                status: activityTypeFormData.status,
                description: activityTypeFormData.description.trim(),
                updatedAt: "Today",
              }
            : a
        )
      );
      setToastMessage(`✓ Updated Activity Type "${cleanName}" (#${editingActivityTypeId})!`);
    } else {
      // Create new: generate ACT-001, ACT-002, etc.
      const nextNum = activityTypes.reduce((max, a) => {
        const match = a.activityTypeId.match(/ACT-(\d+)/);
        if (match) {
          const n = parseInt(match[1], 10);
          return n > max ? n : max;
        }
        return max;
      }, 0) + 1;
      const newId = `ACT-${String(nextNum).padStart(3, "0")}`;
      const newActivityType: ActivityTypeMasterItem = {
        activityTypeId: newId,
        typeName: cleanName,
        category: activityTypeFormData.category,
        status: activityTypeFormData.status,
        description: activityTypeFormData.description.trim(),
        createdAt: "Today",
        updatedAt: "Today",
      };

      setActivityTypes((prev) => [...prev, newActivityType]);
      setToastMessage(`✓ Created new Activity Type "${cleanName}" (${newId})!`);
    }

    setIsActivityTypeModalOpen(false);
  };

  // Open Create Deal Stage Modal
  const handleOpenCreateDealStage = () => {
    const maxSeq = dealStages.reduce((max, d) => (d.sequence > max ? d.sequence : max), 0);
    setEditingDealStageId(null);
    setDealStageFormData({
      stageName: "",
      sequence: maxSeq + 1,
      description: "",
      status: "Active",
    });
    setIsDealStageModalOpen(true);
  };

  // Open Edit Deal Stage Modal
  const handleOpenEditDealStage = (item: DealStageMasterItem) => {
    setEditingDealStageId(item.stageId);
    setDealStageFormData({
      stageName: item.stageName,
      sequence: item.sequence,
      description: item.description || "",
      status: item.status,
    });
    setIsDealStageModalOpen(true);
  };

  // Save Deal Stage (Create or Edit)
  const handleSaveDealStage = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = dealStageFormData.stageName.trim();
    const seq = Number(dealStageFormData.sequence);

    // 1. Stage Name validations
    if (!cleanName) {
      alert("Stage Name is required.");
      return;
    }

    // Case-insensitive duplicate check
    const isDuplicateName = dealStages.some(
      (d) =>
        d.stageName.toLowerCase() === cleanName.toLowerCase() &&
        d.stageId !== editingDealStageId
    );
    if (isDuplicateName) {
      alert("Deal stage already exists.");
      return;
    }

    // 2. Sequence validations
    if (!Number.isInteger(seq) || seq <= 0) {
      alert("Sequence must be a positive integer greater than 0.");
      return;
    }

    // Unique sequence check (among other active stages)
    const isDuplicateSeq = dealStages.some(
      (d) =>
        d.sequence === seq &&
        d.stageId !== editingDealStageId &&
        d.status === "Active" &&
        dealStageFormData.status === "Active"
    );
    if (isDuplicateSeq) {
      alert("Sequence already exists. Please choose another sequence.");
      return;
    }

    if (editingDealStageId) {
      // Edit existing
      setDealStages((prev) =>
        prev.map((d) =>
          d.stageId === editingDealStageId
            ? {
                ...d,
                stageName: cleanName,
                sequence: seq,
                description: dealStageFormData.description.trim(),
                status: dealStageFormData.status,
                updatedAt: "Today",
              }
            : d
        )
      );
      setToastMessage(`✓ Updated Deal Stage "${cleanName}" (#${editingDealStageId})!`);
    } else {
      // Create new: generate STG-001, STG-002, etc.
      const nextNum = dealStages.reduce((max, d) => {
        const match = d.stageId.match(/STG-(\d+)/);
        if (match) {
          const n = parseInt(match[1], 10);
          return n > max ? n : max;
        }
        return max;
      }, 0) + 1;
      const newId = `STG-${String(nextNum).padStart(3, "0")}`;
      const newStage: DealStageMasterItem = {
        stageId: newId,
        stageName: cleanName,
        sequence: seq,
        description: dealStageFormData.description.trim(),
        status: dealStageFormData.status,
        createdAt: "Today",
        updatedAt: "Today",
      };

      setDealStages((prev) => [...prev, newStage]);
      setToastMessage(`✓ Created new Deal Stage "${cleanName}" (${newId})!`);
    }

    setIsDealStageModalOpen(false);
  };

  // Open Create Booking Category Modal
  const handleOpenCreateBookingCategory = () => {
    setEditingBookingCategoryId(null);
    setBookingCategoryFormData({
      categoryName: "",
      applicableBookingTypes: ["Banquet / Event"],
      description: "",
      status: "Active",
    });
    setIsBookingCategoryModalOpen(true);
  };

  // Open Edit Booking Category Modal
  const handleOpenEditBookingCategory = (item: BookingCategoryMasterItem) => {
    setEditingBookingCategoryId(item.categoryId);
    setBookingCategoryFormData({
      categoryName: item.categoryName,
      applicableBookingTypes: [...item.applicableBookingTypes],
      description: item.description || "",
      status: item.status,
    });
    setIsBookingCategoryModalOpen(true);
  };

  // Toggle applicable booking type checkbox
  const handleToggleBookingType = (type: ApplicableBookingType) => {
    setBookingCategoryFormData((prev) => {
      const exists = prev.applicableBookingTypes.includes(type);
      if (exists) {
        if (prev.applicableBookingTypes.length === 1) {
          alert("At least one booking type must be selected.");
          return prev;
        }
        return {
          ...prev,
          applicableBookingTypes: prev.applicableBookingTypes.filter((t) => t !== type),
        };
      } else {
        return {
          ...prev,
          applicableBookingTypes: [...prev.applicableBookingTypes, type],
        };
      }
    });
  };

  // Save Booking Category (Create or Edit)
  const handleSaveBookingCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = bookingCategoryFormData.categoryName.trim();

    // 1. Name validations
    if (!cleanName) {
      alert("Category Name is required.");
      return;
    }
    if (cleanName.length < 3) {
      alert("Category Name must be at least 3 characters.");
      return;
    }

    // Case-insensitive duplicate check
    const isDuplicateName = bookingCategories.some(
      (c) =>
        c.categoryName.toLowerCase() === cleanName.toLowerCase() &&
        c.categoryId !== editingBookingCategoryId
    );
    if (isDuplicateName) {
      alert("Booking category already exists.");
      return;
    }

    // 2. Applicable booking types validation
    if (!bookingCategoryFormData.applicableBookingTypes.length) {
      alert("Please select at least one applicable booking type.");
      return;
    }

    if (editingBookingCategoryId) {
      // Edit existing
      setBookingCategories((prev) =>
        prev.map((c) =>
          c.categoryId === editingBookingCategoryId
            ? {
                ...c,
                categoryName: cleanName,
                applicableBookingTypes: [...bookingCategoryFormData.applicableBookingTypes],
                description: bookingCategoryFormData.description.trim(),
                status: bookingCategoryFormData.status,
                updatedAt: "Today",
              }
            : c
        )
      );
      setToastMessage(`✓ Updated Booking Category "${cleanName}" (#${editingBookingCategoryId})!`);
    } else {
      // Create new: generate CAT-001, CAT-002, etc.
      const nextNum = bookingCategories.reduce((max, c) => {
        const match = c.categoryId.match(/CAT-(\d+)/);
        if (match) {
          const n = parseInt(match[1], 10);
          return n > max ? n : max;
        }
        return max;
      }, 0) + 1;
      const newId = `CAT-${String(nextNum).padStart(3, "0")}`;
      const newCategory: BookingCategoryMasterItem = {
        categoryId: newId,
        categoryName: cleanName,
        applicableBookingTypes: [...bookingCategoryFormData.applicableBookingTypes],
        description: bookingCategoryFormData.description.trim(),
        status: bookingCategoryFormData.status,
        createdAt: "Today",
        updatedAt: "Today",
      };

      setBookingCategories((prev) => [...prev, newCategory]);
      setToastMessage(`✓ Created new Booking Category "${cleanName}" (${newId})!`);
    }

    setIsBookingCategoryModalOpen(false);
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
      const stage = dealStages.find((d) => d.stageId === id);
      if (
        stage &&
        (stage.stageName.toLowerCase() === "won" || stage.stageName.toLowerCase() === "lost") &&
        stage.status === "Active"
      ) {
        const confirmDeactivate = confirm(
          `Warning: "${stage.stageName}" is a critical terminal outcome stage for the sales pipeline. Deactivating it may affect Deal closing workflows. Are you sure you want to proceed?`
        );
        if (!confirmDeactivate) return;
      }
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

  // Open Create Contact Type Modal
  const handleOpenCreateContactType = () => {
    setEditingContactTypeId(null);
    setContactTypeFormData({
      contactTypeName: "",
      description: "",
      status: "Active",
    });
    setIsContactTypeModalOpen(true);
  };

  // Open Edit Contact Type Modal
  const handleOpenEditContactType = (item: ContactTypeMasterItem) => {
    setEditingContactTypeId(item.contactTypeId);
    setContactTypeFormData({
      contactTypeName: item.contactTypeName,
      description: item.description || "",
      status: item.status,
    });
    setIsContactTypeModalOpen(true);
  };

  // Save Contact Type (Create or Edit)
  const handleSaveContactType = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = contactTypeFormData.contactTypeName.trim();

    // 1. Required & Length / Character Validations
    if (!cleanName) {
      alert("Contact Type Name is required.");
      return;
    }
    if (cleanName.length < 3) {
      alert("Contact Type Name must be at least 3 characters.");
      return;
    }
    if (!/[a-zA-Z]/.test(cleanName)) {
      alert("Contact Type Name must contain at least one alphabetic letter.");
      return;
    }

    // 2. Reject obviously invalid values
    const lower = cleanName.toLowerCase();
    if (lower === "test" || lower === "123" || lower === "abc") {
      alert("Please enter a valid Contact Type Name.");
      return;
    }

    // 3. Case-insensitive duplicate check
    const isDuplicate = contactTypes.some(
      (c) =>
        c.contactTypeName.trim().toLowerCase() === lower &&
        c.contactTypeId !== editingContactTypeId
    );
    if (isDuplicate) {
      alert("Contact type already exists.");
      return;
    }

    if (editingContactTypeId) {
      // Edit existing
      setContactTypes((prev) =>
        prev.map((c) =>
          c.contactTypeId === editingContactTypeId
            ? {
                ...c,
                contactTypeName: cleanName,
                description: contactTypeFormData.description.trim(),
                status: contactTypeFormData.status,
                updatedAt: "Today",
              }
            : c
        )
      );
      setToastMessage(`✓ Updated Contact Type "${cleanName}" (#${editingContactTypeId})!`);
    } else {
      // Create new: generate CT-001, CT-002, etc.
      const nextNum = contactTypes.reduce((max, c) => {
        const match = c.contactTypeId.match(/CT-(\d+)/);
        if (match) {
          const n = parseInt(match[1], 10);
          return n > max ? n : max;
        }
        return max;
      }, 0) + 1;
      const newId = `CT-${String(nextNum).padStart(3, "0")}`;
      const newContactType: ContactTypeMasterItem = {
        contactTypeId: newId,
        contactTypeName: cleanName,
        description: contactTypeFormData.description.trim(),
        status: contactTypeFormData.status,
        createdAt: "Today",
        updatedAt: "Today",
      };

      setContactTypes((prev) => [...prev, newContactType]);
      setToastMessage(`✓ Created new Contact Type "${cleanName}" (${newId})!`);
    }

    setIsContactTypeModalOpen(false);
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

  // Filtered Activity Types
  const filteredActivityTypes = useMemo(() => {
    return activityTypes.filter((a) => {
      const lower = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm.trim() ||
        a.activityTypeId.toLowerCase().includes(lower) ||
        a.typeName.toLowerCase().includes(lower) ||
        a.category.toLowerCase().includes(lower) ||
        (a.description && a.description.toLowerCase().includes(lower));

      const matchCategory =
        activityTypeCategoryFilter === "ALL" || a.category === activityTypeCategoryFilter;

      const matchStatus =
        activityTypeStatusFilter === "ALL" || a.status === activityTypeStatusFilter;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [activityTypes, searchTerm, activityTypeCategoryFilter, activityTypeStatusFilter]);

  // Filtered Deal Stages (sorted by sequence ascending)
  const filteredDealStages = useMemo(() => {
    return dealStages
      .filter((d) => {
        const lower = searchTerm.toLowerCase();
        const matchSearch =
          !searchTerm.trim() ||
          d.stageId.toLowerCase().includes(lower) ||
          d.stageName.toLowerCase().includes(lower) ||
          d.sequence.toString().includes(lower) ||
          (d.description && d.description.toLowerCase().includes(lower));

        const matchStatus =
          dealStageStatusFilter === "ALL" || d.status === dealStageStatusFilter;

        return matchSearch && matchStatus;
      })
      .sort((a, b) => a.sequence - b.sequence);
  }, [dealStages, searchTerm, dealStageStatusFilter]);

  // Filtered Booking Categories
  const filteredBookingCategories = useMemo(() => {
    return bookingCategories.filter((c) => {
      const lower = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm.trim() ||
        c.categoryId.toLowerCase().includes(lower) ||
        c.categoryName.toLowerCase().includes(lower) ||
        c.applicableBookingTypes.some((t) => t.toLowerCase().includes(lower)) ||
        (c.description && c.description.toLowerCase().includes(lower));

      const matchType =
        bookingCategoryTypeFilter === "ALL" ||
        c.applicableBookingTypes.includes(bookingCategoryTypeFilter as ApplicableBookingType);

      const matchStatus =
        bookingCategoryStatusFilter === "ALL" || c.status === bookingCategoryStatusFilter;

      return matchSearch && matchType && matchStatus;
    });
  }, [bookingCategories, searchTerm, bookingCategoryTypeFilter, bookingCategoryStatusFilter]);

  // Filtered Contact Types
  const filteredContactTypes = useMemo(() => {
    return contactTypes.filter((ct) => {
      const lower = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm.trim() ||
        ct.contactTypeId.toLowerCase().includes(lower) ||
        ct.contactTypeName.toLowerCase().includes(lower) ||
        (ct.description && ct.description.toLowerCase().includes(lower));

      const matchStatus =
        contactTypeStatusFilter === "ALL" || ct.status === contactTypeStatusFilter;

      return matchSearch && matchStatus;
    });
  }, [contactTypes, searchTerm, contactTypeStatusFilter]);

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
            <Plus className="h-4 w-4" /> Add Venue
          </Button>
        ) : activeTab === "lead-sources" ? (
          <Button
            type="button"
            size="sm"
            onClick={handleOpenCreateLeadSource}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 px-3.5 h-8.5"
          >
            <Plus className="h-4 w-4" /> Add Lead Source
          </Button>
        ) : activeTab === "activity-types" ? (
          <Button
            type="button"
            size="sm"
            onClick={handleOpenCreateActivityType}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 px-3.5 h-8.5"
          >
            <Plus className="h-4 w-4" /> Add Activity Type
          </Button>
        ) : activeTab === "deal-stages" ? (
          <Button
            type="button"
            size="sm"
            onClick={handleOpenCreateDealStage}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 px-3.5 h-8.5"
          >
            <Plus className="h-4 w-4" /> Add Deal Stage
          </Button>
        ) : activeTab === "booking-categories" ? (
          <Button
            type="button"
            size="sm"
            onClick={handleOpenCreateBookingCategory}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 px-3.5 h-8.5"
          >
            <Plus className="h-4 w-4" /> Add Booking Category
          </Button>
        ) : activeTab === "contact-types" ? (
          <Button
            type="button"
            size="sm"
            onClick={handleOpenCreateContactType}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 px-3.5 h-8.5"
          >
            <Plus className="h-4 w-4" /> Add Contact Type
          </Button>
        ) : null
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

        {/* Activity Types Filter Dropdowns */}
        {activeTab === "activity-types" && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={activityTypeCategoryFilter}
              onChange={(e) => setActivityTypeCategoryFilter(e.target.value)}
              className="text-xs font-semibold rounded-lg border border-slate-200 py-2 px-2.5 bg-white text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              {ACTIVITY_TYPE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={activityTypeStatusFilter}
              onChange={(e) => setActivityTypeStatusFilter(e.target.value)}
              className="text-xs font-semibold rounded-lg border border-slate-200 py-2 px-2.5 bg-white text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        )}

        {/* Deal Stages Filter Dropdown */}
        {activeTab === "deal-stages" && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={dealStageStatusFilter}
              onChange={(e) => setDealStageStatusFilter(e.target.value)}
              className="text-xs font-semibold rounded-lg border border-slate-200 py-2 px-2.5 bg-white text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        )}

        {/* Booking Categories Filter Dropdowns */}
        {activeTab === "booking-categories" && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={bookingCategoryTypeFilter}
              onChange={(e) => setBookingCategoryTypeFilter(e.target.value)}
              className="text-xs font-semibold rounded-lg border border-slate-200 py-2 px-2.5 bg-white text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Booking Types</option>
              {APPLICABLE_BOOKING_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select
              value={bookingCategoryStatusFilter}
              onChange={(e) => setBookingCategoryStatusFilter(e.target.value)}
              className="text-xs font-semibold rounded-lg border border-slate-200 py-2 px-2.5 bg-white text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        )}

        {/* Contact Types Filter Dropdown */}
        {activeTab === "contact-types" && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={contactTypeStatusFilter}
              onChange={(e) => setContactTypeStatusFilter(e.target.value)}
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
              : activeTab === "activity-types"
              ? filteredActivityTypes.length
              : activeTab === "deal-stages"
              ? filteredDealStages.length
              : activeTab === "booking-categories"
              ? filteredBookingCategories.length
              : activeTab === "contact-types"
              ? filteredContactTypes.length
              : "6"}
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
          5. ACTIVITY TYPES TABLE (HOTEL PMS V1 MASTER SPECIFICATION)
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
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredActivityTypes.length > 0 ? (
                  filteredActivityTypes.map((a) => (
                    <tr
                      key={a.activityTypeId}
                      onClick={() => handleOpenEditActivityType(a)}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                    >
                      {/* Activity Type ID */}
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800">#{a.activityTypeId}</td>

                      {/* Type Name */}
                      <td className="py-3 px-4 font-bold text-slate-900">{a.typeName}</td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-md text-[10px] font-semibold border inline-block",
                            a.category === "Communication"
                              ? "bg-blue-50 text-blue-900 border-blue-200"
                              : a.category === "Visit"
                              ? "bg-purple-50 text-purple-900 border-purple-200"
                              : a.category === "Meeting"
                              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                              : a.category === "Task"
                              ? "bg-amber-50 text-amber-900 border-amber-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          )}
                        >
                          {a.category}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 text-slate-500 max-w-[280px] truncate">
                        {a.description || <span className="italic text-slate-400">—</span>}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block",
                            a.status === "Active"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          )}
                        >
                          {a.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditActivityType(a)}
                            className="text-[11px] h-7 px-2.5"
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus("activity-types", a.activityTypeId)}
                            className={cn(
                              "text-[11px] h-7 px-2.5",
                              a.status === "Active"
                                ? "text-slate-600"
                                : "text-emerald-700 border-emerald-200 bg-emerald-50/50"
                            )}
                          >
                            {a.status === "Active" ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs italic">
                      No Activity Types found matching your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. DEAL STAGES TABLE (HOTEL PMS V1 MASTER SPECIFICATION)
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
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredDealStages.length > 0 ? (
                  filteredDealStages.map((d) => (
                    <tr
                      key={d.stageId}
                      onClick={() => handleOpenEditDealStage(d)}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                    >
                      {/* Stage ID */}
                      <td className="py-3 px-4 font-mono font-bold text-purple-800">#{d.stageId}</td>

                      {/* Stage Name */}
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{d.stageName}</span>
                          {(d.stageName.toLowerCase() === "won" || d.stageName.toLowerCase() === "lost") && (
                            <span className="bg-slate-100 text-slate-600 font-mono text-[9px] px-1.5 py-0.2 rounded border border-slate-200 uppercase font-semibold">
                              Terminal
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Sequence */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                        <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold">
                          Step {d.sequence}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 text-slate-500 max-w-[280px] truncate">
                        {d.description || <span className="italic text-slate-400">—</span>}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block",
                            d.status === "Active"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          )}
                        >
                          {d.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditDealStage(d)}
                            className="text-[11px] h-7 px-2.5"
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus("deal-stages", d.stageId)}
                            className={cn(
                              "text-[11px] h-7 px-2.5",
                              d.status === "Active"
                                ? "text-slate-600"
                                : "text-emerald-700 border-emerald-200 bg-emerald-50/50"
                            )}
                          >
                            {d.status === "Active" ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs italic">
                      No Deal Stages found matching your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          7. BOOKING CATEGORIES TABLE (HOTEL PMS V1 MASTER SPECIFICATION)
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
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredBookingCategories.length > 0 ? (
                  filteredBookingCategories.map((c) => (
                    <tr
                      key={c.categoryId}
                      onClick={() => handleOpenEditBookingCategory(c)}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                    >
                      {/* Category ID */}
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800">#{c.categoryId}</td>

                      {/* Category Name */}
                      <td className="py-3 px-4 font-bold text-slate-900">{c.categoryName}</td>

                      {/* Applicable Booking Types */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {c.applicableBookingTypes.map((t) => (
                            <span
                              key={t}
                              className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-semibold border",
                                t === "Banquet / Event"
                                  ? "bg-purple-50 text-purple-900 border-purple-200"
                                  : t === "Room Booking"
                                  ? "bg-blue-50 text-blue-900 border-blue-200"
                                  : t === "Conference / Meeting"
                                  ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                                  : t === "Swimming Pool"
                                  ? "bg-cyan-50 text-cyan-900 border-cyan-200"
                                  : t === "Restaurant"
                                  ? "bg-amber-50 text-amber-900 border-amber-200"
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                              )}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 text-slate-500 max-w-[280px] truncate">
                        {c.description || <span className="italic text-slate-400">—</span>}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block",
                            c.status === "Active"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          )}
                        >
                          {c.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditBookingCategory(c)}
                            className="text-[11px] h-7 px-2.5"
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus("booking-categories", c.categoryId)}
                            className={cn(
                              "text-[11px] h-7 px-2.5",
                              c.status === "Active"
                                ? "text-slate-600"
                                : "text-emerald-700 border-emerald-200 bg-emerald-50/50"
                            )}
                          >
                            {c.status === "Active" ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs italic">
                      No Booking Categories found matching your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          8. CONTACT TYPES TABLE (HOTEL PMS V1 MASTER SPECIFICATION)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "contact-types" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Contact Type ID</th>
                  <th className="py-3 px-4">Contact Type Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredContactTypes.length > 0 ? (
                  filteredContactTypes.map((ct) => (
                    <tr
                      key={ct.contactTypeId}
                      onClick={() => handleOpenEditContactType(ct)}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                    >
                      {/* Contact Type ID */}
                      <td className="py-3 px-4 font-mono font-bold text-blue-800">#{ct.contactTypeId}</td>

                      {/* Contact Type Name */}
                      <td className="py-3 px-4 font-bold text-slate-900">{ct.contactTypeName}</td>

                      {/* Description */}
                      <td className="py-3 px-4 text-slate-500 max-w-[320px] truncate">
                        {ct.description || <span className="italic text-slate-400">—</span>}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block",
                            ct.status === "Active"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          )}
                        >
                          {ct.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditContactType(ct)}
                            className="text-[11px] h-7 px-2.5"
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus("contact-types", ct.contactTypeId)}
                            className={cn(
                              "text-[11px] h-7 px-2.5",
                              ct.status === "Active"
                                ? "text-slate-600"
                                : "text-emerald-700 border-emerald-200 bg-emerald-50/50"
                            )}
                          >
                            {ct.status === "Active" ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs italic">
                      No Contact Types found matching your filter criteria.
                    </td>
                  </tr>
                )}
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
          CREATE / EDIT ACTIVITY TYPE MODAL (HOTEL PMS V1)
      ───────────────────────────────────────────────────────────── */}
      {isActivityTypeModalOpen && (
        <Modal
          isOpen={isActivityTypeModalOpen}
          onClose={() => setIsActivityTypeModalOpen(false)}
          title={
            editingActivityTypeId
              ? `Edit Activity Type — #${editingActivityTypeId}`
              : "Create Activity Type"
          }
          maxWidth="sm"
        >
          <form onSubmit={handleSaveActivityType} className="space-y-3.5 p-1 text-xs">
            {/* Auto ID Display when editing */}
            {editingActivityTypeId && (
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-500 font-medium">Activity Type ID:</span>
                <strong className="font-mono text-emerald-800 font-bold">#{editingActivityTypeId}</strong>
              </div>
            )}

            {/* 1. Type Name */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Type Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Call, Site Visit, Follow Up, Meeting..."
                value={activityTypeFormData.typeName}
                onChange={(e) =>
                  setActivityTypeFormData({ ...activityTypeFormData, typeName: e.target.value })
                }
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* 2. Category */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={activityTypeFormData.category}
                onChange={(e) =>
                  setActivityTypeFormData({
                    ...activityTypeFormData,
                    category: e.target.value as ActivityTypeCategory,
                  })
                }
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              >
                {ACTIVITY_TYPE_CATEGORIES.map((cat) => (
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
                placeholder="Brief notes about what this sales activity represents..."
                value={activityTypeFormData.description}
                onChange={(e) =>
                  setActivityTypeFormData({ ...activityTypeFormData, description: e.target.value })
                }
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* 4. Status */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Status</label>
              <select
                value={activityTypeFormData.status}
                onChange={(e) =>
                  setActivityTypeFormData({
                    ...activityTypeFormData,
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
                onClick={() => setIsActivityTypeModalOpen(false)}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs px-4"
              >
                {editingActivityTypeId ? "Save Changes" : "Create Activity Type"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          CREATE / EDIT DEAL STAGE MODAL (HOTEL PMS V1)
      ───────────────────────────────────────────────────────────── */}
      {isDealStageModalOpen && (
        <Modal
          isOpen={isDealStageModalOpen}
          onClose={() => setIsDealStageModalOpen(false)}
          title={
            editingDealStageId
              ? `Edit Deal Stage — #${editingDealStageId}`
              : "Create Deal Stage"
          }
          maxWidth="sm"
        >
          <form onSubmit={handleSaveDealStage} className="space-y-3.5 p-1 text-xs">
            {/* Auto ID Display when editing */}
            {editingDealStageId && (
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-500 font-medium">Stage ID:</span>
                <strong className="font-mono text-purple-800 font-bold">#{editingDealStageId}</strong>
              </div>
            )}

            {/* 1. Stage Name */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Stage Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Qualification, Negotiation, Tentative Hold..."
                value={dealStageFormData.stageName}
                onChange={(e) =>
                  setDealStageFormData({ ...dealStageFormData, stageName: e.target.value })
                }
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* 2. Sequence */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Sequence <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                step={1}
                placeholder="e.g. 1, 2, 3..."
                value={dealStageFormData.sequence}
                onChange={(e) =>
                  setDealStageFormData({
                    ...dealStageFormData,
                    sequence: parseInt(e.target.value, 10) || 1,
                  })
                }
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono font-semibold text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Determines the order of columns in the Deals & Pipeline Kanban.
              </span>
            </div>

            {/* 3. Description */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Description <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Brief notes about what occurs in this sales pipeline stage..."
                value={dealStageFormData.description}
                onChange={(e) =>
                  setDealStageFormData({ ...dealStageFormData, description: e.target.value })
                }
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* 4. Status */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Status</label>
              <select
                value={dealStageFormData.status}
                onChange={(e) =>
                  setDealStageFormData({
                    ...dealStageFormData,
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
                onClick={() => setIsDealStageModalOpen(false)}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs px-4"
              >
                {editingDealStageId ? "Save Changes" : "Create Deal Stage"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          CREATE / EDIT BOOKING CATEGORY MODAL (HOTEL PMS V1)
      ───────────────────────────────────────────────────────────── */}
      {isBookingCategoryModalOpen && (
        <Modal
          isOpen={isBookingCategoryModalOpen}
          onClose={() => setIsBookingCategoryModalOpen(false)}
          title={
            editingBookingCategoryId
              ? `Edit Booking Category — #${editingBookingCategoryId}`
              : "Create Booking Category"
          }
          maxWidth="sm"
        >
          <form onSubmit={handleSaveBookingCategory} className="space-y-3.5 p-1 text-xs">
            {/* Auto ID Display when editing */}
            {editingBookingCategoryId && (
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-500 font-medium">Category ID:</span>
                <strong className="font-mono text-emerald-800 font-bold">#{editingBookingCategoryId}</strong>
              </div>
            )}

            {/* 1. Category Name */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Category Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Wedding, Corporate Event, Birthday, Pool Party..."
                value={bookingCategoryFormData.categoryName}
                onChange={(e) =>
                  setBookingCategoryFormData({
                    ...bookingCategoryFormData,
                    categoryName: e.target.value,
                  })
                }
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* 2. Applicable Booking Types (Multi-select) */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Applicable Booking Types <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-500 block mb-1.5">
                Select which hotel booking services can use this category:
              </span>
              <div className="grid grid-cols-2 gap-1.5 p-2 bg-slate-50 rounded-lg border border-slate-200">
                {APPLICABLE_BOOKING_TYPES.map((type) => {
                  const isChecked = bookingCategoryFormData.applicableBookingTypes.includes(type);
                  return (
                    <label
                      key={type}
                      className={cn(
                        "flex items-center gap-2 p-1.5 rounded-md border text-[11px] font-medium cursor-pointer transition select-none",
                        isChecked
                          ? "bg-white border-emerald-500 text-slate-900 shadow-2xs font-semibold"
                          : "bg-white/60 border-slate-200 text-slate-600 hover:bg-white"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleBookingType(type)}
                        className="rounded text-emerald-700 focus:ring-emerald-600 h-3.5 w-3.5 cursor-pointer"
                      />
                      <span>{type}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 3. Description */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Description <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Brief notes about the business purpose or occasion for this category..."
                value={bookingCategoryFormData.description}
                onChange={(e) =>
                  setBookingCategoryFormData({
                    ...bookingCategoryFormData,
                    description: e.target.value,
                  })
                }
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* 4. Status */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Status</label>
              <select
                value={bookingCategoryFormData.status}
                onChange={(e) =>
                  setBookingCategoryFormData({
                    ...bookingCategoryFormData,
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
                onClick={() => setIsBookingCategoryModalOpen(false)}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs px-4"
              >
                {editingBookingCategoryId ? "Save Changes" : "Create Booking Category"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          CREATE / EDIT CONTACT TYPE MODAL (HOTEL PMS V1)
      ───────────────────────────────────────────────────────────── */}
      {isContactTypeModalOpen && (
        <Modal
          isOpen={isContactTypeModalOpen}
          onClose={() => setIsContactTypeModalOpen(false)}
          title={
            editingContactTypeId
              ? `Edit Contact Type — #${editingContactTypeId}`
              : "Create Contact Type"
          }
          maxWidth="sm"
        >
          <form onSubmit={handleSaveContactType} className="space-y-3.5 p-1 text-xs">
            {/* Auto ID Display when editing */}
            {editingContactTypeId && (
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-500 font-medium">Contact Type ID:</span>
                <strong className="font-mono text-blue-800 font-bold">#{editingContactTypeId}</strong>
              </div>
            )}

            {/* 1. Contact Type Name */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Contact Type Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Individual, Corporate, Travel Agent, Wedding Planner..."
                value={contactTypeFormData.contactTypeName}
                onChange={(e) =>
                  setContactTypeFormData({
                    ...contactTypeFormData,
                    contactTypeName: e.target.value,
                  })
                }
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* 2. Description */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Description <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Brief notes describing this relationship type..."
                value={contactTypeFormData.description}
                onChange={(e) =>
                  setContactTypeFormData({
                    ...contactTypeFormData,
                    description: e.target.value,
                  })
                }
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* 3. Status */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Status</label>
              <select
                value={contactTypeFormData.status}
                onChange={(e) =>
                  setContactTypeFormData({
                    ...contactTypeFormData,
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
                onClick={() => setIsContactTypeModalOpen(false)}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs px-4"
              >
                {editingContactTypeId ? "Save Changes" : "Create Contact Type"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </ModulePageShell>
  );
}
