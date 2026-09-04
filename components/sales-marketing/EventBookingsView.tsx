"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Search,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Bed,
  UtensilsCrossed,
  Waves,
  Sparkles,
  User,
  Phone,
  Mail,
  Tag,
  Target,
  FileText,
  History,
  Check,
  X,
  Plus,
  ArrowRight,
  Layers,
  MapPin,
  Inbox,
  AlertTriangle,
  FileSpreadsheet,
  ExternalLink,
  ChevronRight,
  DollarSign,
  CreditCard,
  Briefcase,
  ShieldCheck,
  Wrench,
  HelpCircle,
  Send,
  Building,
  CheckCheck,
  Eye,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Card, Drawer, Modal } from "@/components/ui";
import { cn } from "@/lib/utils";
import { INITIAL_CUSTOMER_MASTER, CustomerMasterContact } from "./CorporateClientsView";
import { INITIAL_VENUES_MASTER, VenueSpaceMasterItem } from "./masters/SalesMarketingMastersView";

// ─────────────────────────────────────────────────────────────
// 1. DATA SCHEMA: CENTRAL BOOKINGS MANAGEMENT (HOTEL PMS V1)
// ─────────────────────────────────────────────────────────────

export type CentralBookingType =
  | "Room Booking"
  | "Banquet / Event Booking"
  | "Conference Booking"
  | "Restaurant Booking"
  | "Swimming Pool Booking"
  | "Private Event / Other";

export type BookingCategory =
  | "Wedding"
  | "Corporate"
  | "Birthday"
  | "Conference"
  | "Social Event"
  | "Exhibition"
  | "Pool Party"
  | "Restaurant Event"
  | "Private Event"
  | "Business Stay";

export type BookingStatus =
  | "Draft"
  | "Tentative"
  | "Confirmed"
  | "In Progress"
  | "Completed"
  | "Cancelled";

export type PaymentStatus =
  | "Pending Advance"
  | "Partial Advance"
  | "Full Advance"
  | "Fully Settled";

export type CreatedFromSource =
  | "Booking Queue"
  | "Direct Walk-In"
  | "Existing Contact"
  | "Corporate Client"
  | "Manual Entry";

export type HandoverStatus =
  | "Not Required"
  | "Pending Handover"
  | "Handed Over";

export interface BookingQueueItem {
  dealId: string;
  dealName: string;
  contactId: string;
  customerName: string;
  companyName?: string;
  mobile: string;
  email: string;
  bookingType: CentralBookingType;
  bookingCategory: BookingCategory;
  proposedDate: string;
  contractValue: number;
  campaignId?: string;
  leadId?: string;
  wonDate: string;
}

export interface BookingTimelineEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  notes?: string;
}

export interface CentralBookingItem {
  bookingId: string; // e.g. "BOOK-1001"
  bookingType: CentralBookingType;
  bookingCategory: BookingCategory;
  bookingName: string;

  // Contact Master Reference
  contactId: string;
  customerName: string;
  companyName?: string;
  mobile: string;
  email: string;

  // Deal & Marketing Attribution
  dealId?: string;
  leadId?: string;
  campaignId?: string;
  promotionId?: string;
  createdFrom: CreatedFromSource;

  // Schedule & Venue / Space
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  startTime?: string;
  endTime?: string;
  venueId?: string;
  venueOrRoom: string;

  // Capacity & Units
  guestCount?: number;
  roomCount?: number;

  // Financials (Contract Value != Revenue)
  contractValue: number;
  advanceReceived: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;

  // Operational Lifecycle
  status: BookingStatus;
  operationalStatus?: string;

  // Exact BEO & Handover Architecture (PMS V1)
  beoRequired: boolean;
  beoId?: string;
  beoStatus?: "Draft" | "Pending Approval" | "Approved" | "Department Shared" | "In Progress" | "Completed";
  destinationDepartment?: string;
  handoverStatus?: HandoverStatus;

  // Coordinator
  coordinatorName?: string;
  coordinatorMobile?: string;

  // Dynamic Type-Specific Specifics
  roomType?: string;
  ratePlan?: string;
  adults?: number;
  children?: number;
  expectedArrivalTime?: string;
  setupLayout?: string;
  menuRequirement?: string;
  specialRequests?: string;
  tableCount?: number;
  diningPackage?: string;
  poolPackageType?: string;
  holdExpiryDate?: string;

  notes?: string;
  createdAt: string;
  updatedAt: string;
  timeline: BookingTimelineEntry[];
}

// ─────────────────────────────────────────────────────────────
// 2. INITIAL SEED DATA: BOOKING QUEUE (WON DEALS) & BOOKINGS
// ─────────────────────────────────────────────────────────────

export const INITIAL_BOOKING_QUEUE: BookingQueueItem[] = [
  {
    dealId: "DEAL-801",
    dealName: "Singhania Destination 3-Day Wedding",
    contactId: "CONT-1006",
    customerName: "Rakesh Singhania",
    companyName: "Singhania Group",
    mobile: "+91 98220 11990",
    email: "rakesh@singhaniagroup.com",
    bookingType: "Banquet / Event Booking",
    bookingCategory: "Wedding",
    proposedDate: "2026-12-10",
    contractValue: 4200000,
    campaignId: "CMP-WDG-02",
    leadId: "LD-505",
    wonDate: "25 Aug 2026",
  },
  {
    dealId: "DEAL-802",
    dealName: "TechCorp Annual Leadership Summit",
    contactId: "CONT-1002",
    customerName: "Sunil Varma",
    companyName: "TCS India Ltd",
    mobile: "+91 97110 44556",
    email: "sunil.v@tcs.com",
    bookingType: "Conference Booking",
    bookingCategory: "Corporate",
    proposedDate: "2026-09-15",
    contractValue: 890000,
    campaignId: "CMP-CRP-03",
    leadId: "LD-501",
    wonDate: "27 Aug 2026",
  },
];

export const INITIAL_CENTRAL_BOOKINGS: CentralBookingItem[] = [
  {
    bookingId: "BOOK-1001",
    bookingType: "Banquet / Event Booking",
    bookingCategory: "Wedding",
    bookingName: "Sharma Royal Wedding Reception",
    contactId: "CONT-1001",
    customerName: "Raj Sharma",
    companyName: "Sharma Family Enterprise",
    mobile: "+91 98765 43210",
    email: "raj.sharma@gmail.com",
    dealId: "DEAL-1001",
    leadId: "LEAD-1001",
    campaignId: "CMP-WDG-2025",
    createdFrom: "Booking Queue",
    startDate: "2026-11-15",
    endDate: "2026-11-15",
    startTime: "06:00 PM",
    endTime: "11:30 PM",
    venueId: "VEN-001",
    venueOrRoom: "Grand Ballroom",
    guestCount: 400,
    contractValue: 850000,
    advanceReceived: 300000,
    balanceDue: 550000,
    paymentStatus: "Partial Advance",
    status: "Confirmed",
    operationalStatus: "Ready For Event",
    beoRequired: true,
    beoId: "BEO-801",
    beoStatus: "Approved",
    destinationDepartment: "Banquet Operations",
    handoverStatus: "Not Required",
    coordinatorName: "Vikram Malhotra",
    coordinatorMobile: "+91 98111 22334",
    setupLayout: "Round Banquet Tables with Center Stage",
    menuRequirement: "North & South Indian Live Buffet + Mocktail Bar",
    specialRequests: "Bridal suite access from 02:00 PM; floral mandap setup.",
    notes: "Token advance received; venue availability locked on calendar.",
    createdAt: "15 Jan 2025",
    updatedAt: "28 Aug 2026",
    timeline: [
      { id: "LOG-01", timestamp: "15 Jan 2025 04:00 PM", action: "Booking Created from Won Deal #DEAL-1001", actor: "Sales Pipeline" },
      { id: "LOG-02", timestamp: "15 Jan 2025 04:15 PM", action: "BEO Required for Operational Execution", actor: "System" },
      { id: "LOG-03", timestamp: "20 Jan 2025 11:00 AM", action: "Advance Payment Received (₹3,00,000)", actor: "Accounts" },
      { id: "LOG-04", timestamp: "10 Aug 2026 02:00 PM", action: "Function Sheet (BEO-801) Generated & Approved", actor: "Vikram Malhotra" },
    ],
  },
  {
    bookingId: "BOOK-1002",
    bookingType: "Room Booking",
    bookingCategory: "Business Stay",
    bookingName: "Amit Business Delegation Stay",
    contactId: "CONT-1002",
    customerName: "Sunil Varma",
    companyName: "TCS India Ltd",
    mobile: "+91 97110 44556",
    email: "sunil.v@tcs.com",
    dealId: "DEAL-1002",
    createdFrom: "Corporate Client",
    startDate: "2026-09-15",
    endDate: "2026-09-18",
    startTime: "02:00 PM",
    endTime: "12:00 PM",
    venueOrRoom: "12 Deluxe King Rooms (Wing B)",
    roomCount: 12,
    guestCount: 20,
    roomType: "Deluxe King Room",
    ratePlan: "Corporate SLA Bed & Breakfast",
    adults: 20,
    children: 0,
    contractValue: 120000,
    advanceReceived: 120000,
    balanceDue: 0,
    paymentStatus: "Fully Settled",
    status: "Confirmed",
    operationalStatus: "Reservation Created",
    beoRequired: false,
    destinationDepartment: "Front Office",
    handoverStatus: "Handed Over",
    coordinatorName: "Jay Kumar",
    specialRequests: "Airport shuttle pickup for 12 delegates at 01:00 PM on 15 Sep.",
    notes: "Direct company billing approved under 15-day credit SLA.",
    createdAt: "16 Aug 2026",
    updatedAt: "28 Aug 2026",
    timeline: [
      { id: "LOG-05", timestamp: "16 Aug 2026 02:00 PM", action: "Room Block Reservation Created", actor: "Jay Kumar" },
      { id: "LOG-06", timestamp: "16 Aug 2026 02:05 PM", action: "BEO Not Required — Handed over to Front Office", actor: "Jay Kumar" },
    ],
  },
  {
    bookingId: "BOOK-1003",
    bookingType: "Conference Booking",
    bookingCategory: "Conference",
    bookingName: "IMA Annual Medical Conference",
    contactId: "CONT-1005",
    customerName: "Dr. K.S. Rao",
    companyName: "Indian Medical Association",
    mobile: "+91 98450 11223",
    email: "drksrao@ima.org",
    dealId: "OPP-303",
    createdFrom: "Booking Queue",
    startDate: "2026-10-05",
    endDate: "2026-10-07",
    startTime: "08:30 AM",
    endTime: "06:00 PM",
    venueId: "VEN-003",
    venueOrRoom: "Executive Boardroom A",
    guestCount: 30,
    roomCount: 10,
    contractValue: 1850000,
    advanceReceived: 0,
    balanceDue: 1850000,
    paymentStatus: "Pending Advance",
    status: "Tentative",
    operationalStatus: "BEO Draft",
    beoRequired: true,
    beoId: "BEO-803",
    beoStatus: "Draft",
    handoverStatus: "Not Required",
    holdExpiryDate: "2026-08-30",
    coordinatorName: "Jay Kumar",
    setupLayout: "Boardroom Layout + 2 Breakout Pods",
    menuRequirement: "Morning Coffee & High Tea, Buffet Lunch (Veg & Non-Veg)",
    notes: "Tentative hold active until 30 Aug 2026 pending 25% advance token.",
    createdAt: "18 Aug 2026",
    updatedAt: "28 Aug 2026",
    timeline: [
      { id: "LOG-07", timestamp: "18 Aug 2026 11:00 AM", action: "Tentative Booking Created", actor: "Jay Kumar", notes: "Hold placed on Executive Boardroom A" },
      { id: "LOG-08", timestamp: "18 Aug 2026 11:05 AM", action: "BEO Created (Draft: BEO-803)", actor: "Jay Kumar" },
    ],
  },
  {
    bookingId: "BOOK-1004",
    bookingType: "Restaurant Booking",
    bookingCategory: "Restaurant Event",
    bookingName: "Apex Corporate Private Dinner",
    contactId: "CONT-1001",
    customerName: "Raj Sharma",
    companyName: "Sharma Family Enterprise",
    mobile: "+91 98765 43210",
    email: "raj.sharma@gmail.com",
    createdFrom: "Existing Contact",
    startDate: "2026-08-29",
    endDate: "2026-08-29",
    startTime: "07:30 PM",
    endTime: "11:00 PM",
    venueOrRoom: "Saffron Fine Dining (Private Lounge)",
    guestCount: 35,
    tableCount: 4,
    contractValue: 75000,
    advanceReceived: 75000,
    balanceDue: 0,
    paymentStatus: "Fully Settled",
    status: "Confirmed",
    operationalStatus: "Ready For Event",
    beoRequired: false,
    destinationDepartment: "Food & Beverage",
    handoverStatus: "Handed Over",
    coordinatorName: "Ananya Roy",
    specialRequests: "Chef's 5-course degustation menu + vintage wine pairing.",
    notes: "VIP recurring guest dinner.",
    createdAt: "22 Aug 2026",
    updatedAt: "28 Aug 2026",
    timeline: [
      { id: "LOG-09", timestamp: "22 Aug 2026 03:00 PM", action: "Restaurant Reservation Confirmed", actor: "Ananya Roy" },
      { id: "LOG-10", timestamp: "22 Aug 2026 03:05 PM", action: "Booking handed over to Food & Beverage", actor: "Ananya Roy" },
    ],
  },
  {
    bookingId: "BOOK-1005",
    bookingType: "Swimming Pool Booking",
    bookingCategory: "Pool Party",
    bookingName: "Monsoon Sunset Sundowner Pool Party",
    contactId: "CONT-1003",
    customerName: "Pooja Reddy",
    companyName: "Reddy Family",
    mobile: "+91 99001 22334",
    email: "pooja.reddy@gmail.com",
    createdFrom: "Existing Contact",
    startDate: "2026-09-05",
    endDate: "2026-09-05",
    startTime: "04:00 PM",
    endTime: "09:00 PM",
    venueId: "VEN-004",
    venueOrRoom: "Azure Poolside Deck",
    guestCount: 60,
    contractValue: 150000,
    advanceReceived: 50000,
    balanceDue: 100000,
    paymentStatus: "Partial Advance",
    status: "Confirmed",
    operationalStatus: "BEO Draft",
    beoRequired: true,
    beoId: "BEO-805",
    beoStatus: "Draft",
    handoverStatus: "Not Required",
    destinationDepartment: "Banquet Operations",
    coordinatorName: "Vikram Malhotra",
    specialRequests: "DJ sound setup at poolside cabana; mocktail live station.",
    notes: "Private pool deck buyout.",
    createdAt: "20 Aug 2026",
    updatedAt: "28 Aug 2026",
    timeline: [
      { id: "LOG-11", timestamp: "20 Aug 2026 05:00 PM", action: "Pool Booking Created", actor: "Vikram Malhotra" },
      { id: "LOG-12", timestamp: "20 Aug 2026 05:05 PM", action: "BEO Created (Draft: BEO-805)", actor: "Vikram Malhotra" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// 3. MAIN COMPONENT: CENTRAL BOOKINGS MANAGEMENT
// ─────────────────────────────────────────────────────────────

export function EventBookingsView() {
  const router = useRouter();
  const [bookings, setBookings] = useState<CentralBookingItem[]>(INITIAL_CENTRAL_BOOKINGS);
  const [bookingQueue, setBookingQueue] = useState<BookingQueueItem[]>(INITIAL_BOOKING_QUEUE);
  const [contacts, setContacts] = useState<CustomerMasterContact[]>(INITIAL_CUSTOMER_MASTER);
  const [venues] = useState<VenueSpaceMasterItem[]>(INITIAL_VENUES_MASTER);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");
  const [viewScope, setViewScope] = useState<"ALL" | "QUEUE" | "TENTATIVE" | "CONFIRMED">("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Drawer & Modal States
  const [selectedBooking, setSelectedBooking] = useState<CentralBookingItem | null>(null);
  const [drawerTab, setDrawerTab] = useState<"overview" | "financials" | "details" | "timeline" | "documents">("overview");

  // Create Booking Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2 | 3 | 4>(1);

  // Dynamic Create Form State
  const [formBookingType, setFormBookingType] = useState<CentralBookingType>("Banquet / Event Booking");
  const [formContactId, setFormContactId] = useState<string>("");
  const [formCustomerName, setFormCustomerName] = useState("");
  const [formMobile, setFormMobile] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formBookingName, setFormBookingName] = useState("");
  const [formCategory, setFormCategory] = useState<BookingCategory>("Wedding");
  const [formCreatedFrom, setFormCreatedFrom] = useState<CreatedFromSource>("Direct Walk-In");
  const [formDealId, setFormDealId] = useState<string | undefined>(undefined);
  const [formCampaignId, setFormCampaignId] = useState<string | undefined>(undefined);
  const [formLeadId, setFormLeadId] = useState<string | undefined>(undefined);

  // Dates & Venue
  const [formStartDate, setFormStartDate] = useState("2026-11-20");
  const [formEndDate, setFormEndDate] = useState("2026-11-20");
  const [formStartTime, setFormStartTime] = useState("06:00 PM");
  const [formEndTime, setFormEndTime] = useState("11:30 PM");
  const [formVenueId, setFormVenueId] = useState<string>("VEN-001");
  const [formVenueOrRoom, setFormVenueOrRoom] = useState("Grand Ballroom");
  const [formGuestCount, setFormGuestCount] = useState<number>(250);
  const [formRoomCount, setFormRoomCount] = useState<number>(1);
  const [formContractValue, setFormContractValue] = useState<number>(500000);
  const [formAdvanceReceived, setFormAdvanceReceived] = useState<number>(100000);
  const [formBookingStatus, setFormBookingStatus] = useState<BookingStatus>("Confirmed");
  const [formCoordinatorName, setFormCoordinatorName] = useState("Vikram Malhotra");
  const [formCoordinatorMobile, setFormCoordinatorMobile] = useState("+91 98111 22334");

  // Specific Type fields
  const [formRoomType, setFormRoomType] = useState("Deluxe King Room");
  const [formRatePlan, setFormRatePlan] = useState("Corporate Bed & Breakfast");
  const [formAdults, setFormAdults] = useState(2);
  const [formChildren, setFormChildren] = useState(0);
  const [formExpectedArrival, setFormExpectedArrival] = useState("02:00 PM");
  const [formSetupLayout, setFormSetupLayout] = useState("Round Banquet");
  const [formMenuRequirement, setFormMenuRequirement] = useState("Standard Premium Buffet");
  const [formSpecialRequests, setFormSpecialRequests] = useState("");
  const [formTableCount, setFormTableCount] = useState(2);
  const [formDiningPackage, setFormDiningPackage] = useState("Chef Special Menu");
  const [formPoolPackage, setFormPoolPackage] = useState("Private Pool Deck Access");
  const [formPoolRequiresBeo, setFormPoolRequiresBeo] = useState(true);

  // Contact quick creation inline
  const [isQuickContactOpen, setIsQuickContactOpen] = useState(false);
  const [quickContactName, setQuickContactName] = useState("");
  const [quickContactMobile, setQuickContactMobile] = useState("");
  const [quickContactEmail, setQuickContactEmail] = useState("");
  const [quickContactCompany, setQuickContactCompany] = useState("");

  // Post-Save Workflow States
  const [createdBookingResult, setCreatedBookingResult] = useState<CentralBookingItem | null>(null);
  const [showHandoverDialog, setShowHandoverDialog] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("Front Office");

  // Quick Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(50000);
  const [paymentMode, setPaymentMode] = useState("UPI / Bank Transfer");

  // Helper to get booking type display configuration
  const getBookingTypeConfig = (type: CentralBookingType) => {
    switch (type) {
      case "Banquet / Event Booking":
        return { icon: Sparkles, label: "Banquet / Wedding Event", color: "text-purple-700 bg-purple-50 border-purple-200" };
      case "Conference Booking":
        return { icon: Building2, label: "Conference / Meeting", color: "text-blue-700 bg-blue-50 border-blue-200" };
      case "Room Booking":
        return { icon: Bed, label: "Room Booking Stay", color: "text-amber-700 bg-amber-50 border-amber-200" };
      case "Restaurant Booking":
        return { icon: UtensilsCrossed, label: "Restaurant Booking", color: "text-rose-700 bg-rose-50 border-rose-200" };
      case "Swimming Pool Booking":
        return { icon: Waves, label: "Swimming Pool Booking", color: "text-cyan-700 bg-cyan-50 border-cyan-200" };
      case "Private Event / Other":
      default:
        return { icon: CalendarDays, label: "Private / Other Event", color: "text-slate-700 bg-slate-100 border-slate-200" };
    }
  };

  // ─────────────────────────────────────────────────────────────
  // METRICS COMPUTATION
  // ─────────────────────────────────────────────────────────────
  const kpiMetrics = useMemo(() => {
    const totalCount = bookings.length;
    const queueCount = bookingQueue.length;
    const tentativeCount = bookings.filter((b) => b.status === "Tentative").length;
    const confirmedCount = bookings.filter((b) => b.status === "Confirmed").length;
    const totalContractValue = bookings.reduce((sum, b) => (b.status !== "Cancelled" ? sum + b.contractValue : sum), 0);

    return { totalCount, queueCount, tentativeCount, confirmedCount, totalContractValue };
  }, [bookings, bookingQueue]);

  // Filter Bookings List
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Scope Filter
      if (viewScope === "TENTATIVE" && b.status !== "Tentative") return false;
      if (viewScope === "CONFIRMED" && b.status !== "Confirmed") return false;

      // Text Search
      const searchLower = searchTerm.toLowerCase();
      const matchSearch =
        b.bookingId.toLowerCase().includes(searchLower) ||
        b.bookingName.toLowerCase().includes(searchLower) ||
        b.customerName.toLowerCase().includes(searchLower) ||
        (b.companyName && b.companyName.toLowerCase().includes(searchLower)) ||
        b.venueOrRoom.toLowerCase().includes(searchLower) ||
        (b.coordinatorName && b.coordinatorName.toLowerCase().includes(searchLower)) ||
        b.mobile.includes(searchLower);

      const matchType = selectedTypeFilter === "ALL" || b.bookingType === selectedTypeFilter;
      const matchStatus = selectedStatusFilter === "ALL" || b.status === selectedStatusFilter;
      const matchCategory = selectedCategoryFilter === "ALL" || b.bookingCategory === selectedCategoryFilter;

      return matchSearch && matchType && matchStatus && matchCategory;
    });
  }, [bookings, viewScope, searchTerm, selectedTypeFilter, selectedStatusFilter, selectedCategoryFilter]);

  // Filter Queue
  const filteredQueue = useMemo(() => {
    return bookingQueue.filter((item) => {
      const searchLower = searchTerm.toLowerCase();
      const matchSearch =
        item.dealId.toLowerCase().includes(searchLower) ||
        item.dealName.toLowerCase().includes(searchLower) ||
        item.customerName.toLowerCase().includes(searchLower) ||
        (item.companyName && item.companyName.toLowerCase().includes(searchLower)) ||
        item.mobile.includes(searchLower);

      const matchType = selectedTypeFilter === "ALL" || item.bookingType === selectedTypeFilter;
      const matchCategory = selectedCategoryFilter === "ALL" || item.bookingCategory === selectedCategoryFilter;

      return matchSearch && matchType && matchCategory;
    });
  }, [bookingQueue, searchTerm, selectedTypeFilter, selectedCategoryFilter]);

  // Check venue availability & conflicts
  const venueAvailabilityCheck = useMemo(() => {
    const selectedVenue = venues.find((v) => v.venueId === formVenueId);
    if (!selectedVenue) {
      return { status: "AVAILABLE", message: "Space is available." };
    }

    if (selectedVenue.status === "Maintenance") {
      return {
        status: "MAINTENANCE",
        message: `⚠️ "${selectedVenue.venueName}" is currently under maintenance. Cannot book.`,
      };
    }

    // Check capacity
    if (formGuestCount > selectedVenue.maximumCapacity) {
      return {
        status: "WARNING",
        message: `⚠️ Guest count (${formGuestCount}) exceeds venue max capacity (${selectedVenue.maximumCapacity} Pax).`,
      };
    }

    // Check existing confirmed bookings on same venue & date
    const conflict = bookings.find(
      (b) =>
        b.venueId === formVenueId &&
        b.startDate === formStartDate &&
        b.status === "Confirmed"
    );

    if (conflict) {
      return {
        status: "CONFLICT",
        message: `✕ Conflict: Booked by #${conflict.bookingId} (${conflict.bookingName}) on ${formStartDate}.`,
        conflictBooking: conflict,
      };
    }

    return { status: "AVAILABLE", message: `✓ Available: "${selectedVenue.venueName}" is clear on ${formStartDate}.` };
  }, [formVenueId, formStartDate, formGuestCount, venues, bookings]);

  // ─────────────────────────────────────────────────────────────
  // HANDLERS: CREATE BOOKING & POST-SAVE WORKFLOW
  // ─────────────────────────────────────────────────────────────

  // Open Create Modal (Clean Start)
  const handleOpenCreateModal = (type: CentralBookingType = "Banquet / Event Booking") => {
    setFormBookingType(type);
    setCreateStep(1);
    setFormContactId("");
    setFormCustomerName("");
    setFormMobile("");
    setFormEmail("");
    setFormCompany("");
    setFormBookingName("");
    setFormCategory("Wedding");
    setFormCreatedFrom("Direct Walk-In");
    setFormDealId(undefined);
    setFormCampaignId(undefined);
    setFormLeadId(undefined);
    setFormStartDate("2026-11-20");
    setFormEndDate("2026-11-20");
    setFormStartTime("06:00 PM");
    setFormEndTime("11:30 PM");
    setFormVenueId("VEN-001");
    setFormVenueOrRoom("Grand Ballroom");
    setFormGuestCount(250);
    setFormRoomCount(1);
    setFormContractValue(500000);
    setFormAdvanceReceived(100000);
    setFormBookingStatus("Confirmed");
    setIsCreateModalOpen(true);
    setCreatedBookingResult(null);
    setShowHandoverDialog(false);
  };

  // Convert from Booking Queue (Won Deal)
  const handleConvertFromQueue = (item: BookingQueueItem) => {
    setFormBookingType(item.bookingType);
    setFormContactId(item.contactId);
    setFormCustomerName(item.customerName);
    setFormMobile(item.mobile);
    setFormEmail(item.email);
    setFormCompany(item.companyName || "");
    setFormBookingName(item.dealName);
    setFormCategory(item.bookingCategory);
    setFormCreatedFrom("Booking Queue");
    setFormDealId(item.dealId);
    setFormCampaignId(item.campaignId);
    setFormLeadId(item.leadId);
    setFormStartDate(item.proposedDate);
    setFormEndDate(item.proposedDate);
    setFormContractValue(item.contractValue);
    setFormAdvanceReceived(0);
    setFormBookingStatus("Confirmed");

    if (item.bookingType === "Room Booking") {
      setFormVenueOrRoom("10 Deluxe King Rooms");
      setFormRoomCount(10);
    } else if (item.bookingType === "Conference Booking") {
      setFormVenueId("VEN-003");
      setFormVenueOrRoom("Executive Boardroom A");
      setFormGuestCount(30);
    } else {
      setFormVenueId("VEN-001");
      setFormVenueOrRoom("Grand Ballroom");
      setFormGuestCount(350);
    }

    setCreateStep(2); // Jump directly to customer confirmation
    setIsCreateModalOpen(true);
    setCreatedBookingResult(null);
    setShowHandoverDialog(false);
  };

  // Select Contact from Master
  const handleSelectContact = (contact: CustomerMasterContact) => {
    setFormContactId(contact.contactId);
    setFormCustomerName(contact.contactName || `${contact.firstName || ""} ${contact.lastName || ""}`.trim());
    setFormMobile(contact.mobileNumber || contact.mobile || "");
    setFormEmail(contact.emailAddress || contact.email || "");
    setFormCompany(contact.companyName || "");
  };

  // Create Quick Contact Inline
  const handleCreateQuickContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickContactName || !quickContactMobile) return;

    const newContactId = `CONT-10${contacts.length + 10}`;
    const newContact: CustomerMasterContact = {
      contactId: newContactId,
      contactName: quickContactName,
      firstName: quickContactName.split(" ")[0] || quickContactName,
      lastName: quickContactName.split(" ").slice(1).join(" ") || "",
      contactType: "Individual",
      category: "Regular Customer",
      mobileNumber: quickContactMobile,
      mobile: quickContactMobile,
      emailAddress: quickContactEmail,
      email: quickContactEmail,
      companyName: quickContactCompany,
      createdDate: "Today",
      createdBy: "System",
      createdFrom: "Direct Walk-In",
      status: "Active",
      leads: [],
      deals: [],
      bookings: [],
      activities: [],
    };

    setContacts([newContact, ...contacts]);
    handleSelectContact(newContact);
    setIsQuickContactOpen(false);
    setToastMessage(`✓ Customer "${quickContactName}" created and linked!`);
  };

  // ─────────────────────────────────────────────────────────────
  // SAVE BOOKING (CREATES RECORD & SHOWS POST-SAVE WORKFLOW)
  // ─────────────────────────────────────────────────────────────
  const handleSaveBooking = () => {
    if (venueAvailabilityCheck.status === "MAINTENANCE" || venueAvailabilityCheck.status === "CONFLICT") {
      alert("Cannot save booking: Selected venue has a hard conflict or is under maintenance.");
      return;
    }

    const newBookingId = `BOOK-10${bookings.length + 15}`;
    
    // Exact BEO Required Rule:
    const isBeoRequired =
      formBookingType === "Banquet / Event Booking" ||
      formBookingType === "Conference Booking" ||
      formBookingType === "Private Event / Other" ||
      (formBookingType === "Swimming Pool Booking" && formPoolRequiresBeo);

    // Default destination department suggestion:
    const defaultDept =
      formBookingType === "Room Booking"
        ? "Front Office"
        : formBookingType === "Restaurant Booking"
        ? "Food & Beverage"
        : "Banquet Operations";

    setSelectedDepartment(defaultDept);

    const balance = Math.max(0, formContractValue - formAdvanceReceived);
    const payStatus: PaymentStatus =
      formAdvanceReceived >= formContractValue
        ? "Fully Settled"
        : formAdvanceReceived > 0
        ? "Partial Advance"
        : "Pending Advance";

    const venueObj = venues.find((v) => v.venueId === formVenueId);
    const finalVenueOrRoom =
      formBookingType === "Room Booking"
        ? `${formRoomCount} ${formRoomType}`
        : formBookingType === "Restaurant Booking"
        ? `Restaurant Table Area (${formTableCount} Tables)`
        : venueObj?.venueName || formVenueOrRoom;

    const newBooking: CentralBookingItem = {
      bookingId: newBookingId,
      bookingType: formBookingType,
      bookingCategory: formCategory,
      bookingName: formBookingName || `${formCustomerName} ${formBookingType}`,
      contactId: formContactId || "CONT-1001",
      customerName: formCustomerName,
      companyName: formCompany,
      mobile: formMobile,
      email: formEmail,
      dealId: formDealId,
      campaignId: formCampaignId,
      leadId: formLeadId,
      createdFrom: formCreatedFrom,
      startDate: formStartDate,
      endDate: formEndDate,
      startTime: formStartTime,
      endTime: formEndTime,
      venueId: formBookingType !== "Room Booking" ? formVenueId : undefined,
      venueOrRoom: finalVenueOrRoom,
      guestCount: formGuestCount,
      roomCount: formRoomCount,
      contractValue: formContractValue,
      advanceReceived: formAdvanceReceived,
      balanceDue: balance,
      paymentStatus: payStatus,
      status: formBookingStatus, // Preserves exact user selected status (Draft / Tentative / Confirmed)
      operationalStatus: isBeoRequired ? "BEO Draft" : "Reservation Created",
      beoRequired: isBeoRequired,
      destinationDepartment: isBeoRequired ? undefined : defaultDept,
      handoverStatus: isBeoRequired ? "Not Required" : "Pending Handover",
      coordinatorName: formCoordinatorName,
      coordinatorMobile: formCoordinatorMobile,
      roomType: formRoomType,
      ratePlan: formRatePlan,
      adults: formAdults,
      children: formChildren,
      expectedArrivalTime: formExpectedArrival,
      setupLayout: formSetupLayout,
      menuRequirement: formMenuRequirement,
      specialRequests: formSpecialRequests,
      tableCount: formTableCount,
      diningPackage: formDiningPackage,
      poolPackageType: formPoolPackage,
      createdAt: "Today",
      updatedAt: "Today",
      timeline: [
        {
          id: `LOG-${Date.now()}-1`,
          timestamp: "Just now",
          action: "Booking Created",
          actor: formCoordinatorName,
          notes: `Booking #${newBookingId} created with status: ${formBookingStatus}`,
        },
        {
          id: `LOG-${Date.now()}-2`,
          timestamp: "Just now",
          action: isBeoRequired ? "BEO Required" : "BEO Not Required",
          actor: "System Rule",
          notes: isBeoRequired ? "Pending BEO creation" : "Ready for Department Handover",
        },
        ...(formAdvanceReceived > 0
          ? [
              {
                id: `LOG-${Date.now()}-3`,
                timestamp: "Just now",
                action: `Advance Recorded (₹${formAdvanceReceived.toLocaleString("en-IN")})`,
                actor: "Front Desk",
              },
            ]
          : []),
      ],
    };

    // Save to master booking state
    setBookings([newBooking, ...bookings]);

    // If created from queue, remove from queue
    if (formDealId) {
      setBookingQueue((prev) => prev.filter((q) => q.dealId !== formDealId));
    }

    // Immediately show post-save next-step screen
    setCreatedBookingResult(newBooking);
    setShowHandoverDialog(false);
  };

  // ─────────────────────────────────────────────────────────────
  // PATH A: CREATE BEO HANDLER
  // ─────────────────────────────────────────────────────────────
  const handleCreateBeoForBooking = (booking: CentralBookingItem) => {
    const generatedBeoId = `BEO-${booking.bookingId.replace("BOOK-", "")}`;
    
    // Update booking with BEO ID, Draft status & timeline entry
    const updated: CentralBookingItem = {
      ...booking,
      beoId: generatedBeoId,
      beoStatus: "Draft",
      timeline: [
        ...booking.timeline,
        {
          id: `LOG-${Date.now()}`,
          timestamp: "Just now",
          action: `BEO Created (${generatedBeoId})`,
          actor: booking.coordinatorName || "Sales Executive",
          notes: "Initial Draft created linked to booking",
        },
      ],
    };

    setBookings((prev) => prev.map((b) => (b.bookingId === updated.bookingId ? updated : b)));
    setIsCreateModalOpen(false);
    setCreatedBookingResult(null);
    setToastMessage(`✓ Function Sheet #${generatedBeoId} created in Draft! Opening BEO list...`);
    
    // Navigate to Function Sheets (BEO) page
    router.push("/sales-marketing/banquets/beo");
  };

  // ─────────────────────────────────────────────────────────────
  // PATH B: DEPARTMENT HANDOVER HANDLER
  // ─────────────────────────────────────────────────────────────
  const handleConfirmDepartmentHandover = () => {
    if (!createdBookingResult) return;
    const dept = selectedDepartment;
    
    const updated: CentralBookingItem = {
      ...createdBookingResult,
      destinationDepartment: dept,
      handoverStatus: "Handed Over",
      timeline: [
        ...createdBookingResult.timeline,
        {
          id: `LOG-${Date.now()}`,
          timestamp: "Just now",
          action: `Booking handed over to ${dept}`,
          actor: "Booking Coordinator",
          notes: `Operational execution routed to ${dept}`,
        },
      ],
    };

    setBookings((prev) => prev.map((b) => (b.bookingId === updated.bookingId ? updated : b)));
    setIsCreateModalOpen(false);
    setCreatedBookingResult(null);
    setShowHandoverDialog(false);
    setToastMessage(`✓ Booking ${updated.bookingId} has been handed over to ${dept}.`);
  };

  // Record Payment Quick Action
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || paymentAmount <= 0) return;

    const newAdvance = (selectedBooking.advanceReceived || 0) + Number(paymentAmount);
    const newBalance = Math.max(0, selectedBooking.contractValue - newAdvance);
    const newStatus: PaymentStatus =
      newBalance === 0 ? "Fully Settled" : newAdvance > 0 ? "Partial Advance" : "Pending Advance";

    const updatedBooking: CentralBookingItem = {
      ...selectedBooking,
      advanceReceived: newAdvance,
      balanceDue: newBalance,
      paymentStatus: newStatus,
      timeline: [
        ...selectedBooking.timeline,
        {
          id: `LOG-${Date.now()}`,
          timestamp: "Just now",
          action: `Payment Recorded: ₹${Number(paymentAmount).toLocaleString("en-IN")} via ${paymentMode}`,
          actor: "Accounts Desk",
        },
      ],
    };

    setBookings((prev) => prev.map((b) => (b.bookingId === selectedBooking.bookingId ? updatedBooking : b)));
    setSelectedBooking(updatedBooking);
    setIsPaymentModalOpen(false);
    setToastMessage(`✓ Recorded payment of ₹${Number(paymentAmount).toLocaleString("en-IN")}!`);
  };

  return (
    <ModulePageShell
      eyebrow="Sales & Marketing"
      title="Bookings"
      description="Central booking management for room, event, conference, restaurant and pool bookings."
      breadcrumbs={[
        { label: "Sales & Marketing", href: "/sales-marketing/dashboard" },
        { label: "Banquets & Events" },
        { label: "Bookings" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <Button
          type="button"
          size="sm"
          onClick={() => handleOpenCreateModal("Banquet / Event Booking")}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 px-3.5 h-8.5"
        >
          <Plus className="h-4 w-4" /> Create Booking
        </Button>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: 4 CLEAN V1 KPI CARDS
      ───────────────────────────────────────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: 4 CLEAN V1 KPI CARDS (F&B STYLE)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6 mb-5">
        {/* Card 1: Total Bookings */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Total Bookings
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 sm:h-8 sm:w-8">
              <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            {kpiMetrics.totalCount}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            ₹{(kpiMetrics.totalContractValue / 100000).toFixed(1)}L contract value
          </p>
        </Card>

        {/* Card 2: Booking Queue */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Booking Queue
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 sm:h-8 sm:w-8">
              <Inbox className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            {kpiMetrics.queueCount}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            Won deals awaiting ingestion
          </p>
        </Card>

        {/* Card 3: Tentative Holds */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Tentative Holds
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 sm:h-8 sm:w-8">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            {kpiMetrics.tentativeCount}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            Pending advance deposit
          </p>
        </Card>

        {/* Card 4: Confirmed */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Confirmed
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 sm:h-8 sm:w-8">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            {kpiMetrics.confirmedCount}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            Operationally locked
          </p>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: SCOPE TABS & SEARCH / FILTER CONTROLS
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs space-y-3 mb-4">
        {/* Scope Tabs */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 overflow-x-auto gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setViewScope("ALL")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5",
                viewScope === "ALL" ? "bg-slate-900 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <Layers className="h-3.5 w-3.5" /> All Bookings
            </button>
            <button
              type="button"
              onClick={() => setViewScope("QUEUE")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5",
                viewScope === "QUEUE"
                  ? "bg-sky-700 text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <Inbox className="h-3.5 w-3.5" /> Booking Queue ({bookingQueue.length})
            </button>
            <button
              type="button"
              onClick={() => setViewScope("TENTATIVE")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5",
                viewScope === "TENTATIVE" ? "bg-amber-700 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <Clock className="h-3.5 w-3.5" /> Tentative Holds ({kpiMetrics.tentativeCount})
            </button>
            <button
              type="button"
              onClick={() => setViewScope("CONFIRMED")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5",
                viewScope === "CONFIRMED" ? "bg-emerald-700 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Confirmed ({kpiMetrics.confirmedCount})
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={
                viewScope === "QUEUE"
                  ? "Search queue by Deal Name, ID (#DEAL-801), Customer, or Mobile..."
                  : "Search by Booking Name, ID (#BOOK-1001), Customer, Venue, or Coordinator..."
              }
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
              className="text-xs rounded-lg border border-slate-200 py-2 px-2.5 bg-white text-slate-700 focus:outline-none focus:border-slate-300 cursor-pointer"
            >
              <option value="ALL">All 6 Booking Types</option>
              <option value="Room Booking">Room Booking</option>
              <option value="Banquet / Event Booking">Banquet / Event</option>
              <option value="Conference Booking">Conference</option>
              <option value="Restaurant Booking">Restaurant</option>
              <option value="Swimming Pool Booking">Swimming Pool</option>
              <option value="Private Event / Other">Private Event / Other</option>
            </select>

            {/* Status Filter */}
            {viewScope !== "QUEUE" && (
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="text-xs rounded-lg border border-slate-200 py-2 px-2.5 bg-white text-slate-700 focus:outline-none focus:border-slate-300 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Tentative">Tentative</option>
                <option value="Confirmed">Confirmed</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            )}

            {/* Category Filter */}
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 py-2 px-2.5 bg-white text-slate-700 focus:outline-none focus:border-slate-300 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="Wedding">Wedding</option>
              <option value="Corporate">Corporate</option>
              <option value="Conference">Conference</option>
              <option value="Birthday">Birthday</option>
              <option value="Pool Party">Pool Party</option>
              <option value="Restaurant Event">Restaurant Event</option>
              <option value="Business Stay">Business Stay</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: CENTRAL BOOKINGS / QUEUE TABLE
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-4 py-3 text-xs text-slate-500 font-medium border-b border-slate-100 flex items-center justify-between">
          <span>Showing <strong className="text-slate-700 font-semibold">{viewScope === "QUEUE" ? filteredQueue.length : filteredBookings.length}</strong> {viewScope === "QUEUE" ? "queue items" : "bookings"} &bull; Central Bookings Management</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">{viewScope === "QUEUE" ? "Deal & Category" : "Booking / Event & ID"}</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Customer &amp; Contact</th>
                <th className="py-3 px-4">{viewScope === "QUEUE" ? "Space / Requirement" : "Venue / Room Space"}</th>
                <th className="py-3 px-4">{viewScope === "QUEUE" ? "Target Date" : "Date"}</th>
                <th className="py-3 px-4">Pax / Rooms</th>
                <th className="py-3 px-4">{viewScope === "QUEUE" ? "Deal Value" : "Contract Value"}</th>
                <th className="py-3 px-4 text-center">{viewScope === "QUEUE" ? "Queue Status" : "Status & BEO"}</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {viewScope === "QUEUE" ? (
                filteredQueue.length > 0 ? (
                  filteredQueue.map((item) => (
                    <tr key={item.dealId} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                      {/* Deal & Category */}
                      <td className="py-3.5 px-4">
                        <strong className="text-slate-900 font-semibold text-xs block">{item.dealName}</strong>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-400 font-mono">#{item.dealId}</span>
                          <span className="text-slate-300 text-[10px]">&bull;</span>
                          <span className="text-[11px] text-slate-500">{item.bookingCategory}</span>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] font-semibold text-slate-900 block">
                          {item.bookingType}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-semibold text-slate-900 block">{item.customerName}</span>
                        <span className="text-[11px] text-slate-500 font-mono block mt-0.5">{item.mobile}</span>
                      </td>

                      {/* Venue / Room */}
                      <td className="py-3.5 px-4 text-slate-400 italic text-xs">
                        To be assigned in booking
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono text-slate-900 font-semibold text-xs">
                        {item.proposedDate}
                      </td>

                      {/* Pax / Rooms */}
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-xs">
                        —
                      </td>

                      {/* Contract Value */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-xs">
                        ₹{item.contractValue.toLocaleString("en-IN")}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/70">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
                          Pending Ingestion
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleConvertFromQueue(item)}
                          className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-2xs hover:bg-emerald-100 cursor-pointer ml-auto"
                        >
                          Create Booking →
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400 text-xs italic">
                      No won deals currently in the booking queue.
                    </td>
                  </tr>
                )
              ) : filteredBookings.length > 0 ? (
                filteredBookings.map((b) => (
                  <tr
                    key={b.bookingId}
                    onClick={() => {
                      setSelectedBooking(b);
                      setDrawerTab("overview");
                    }}
                    className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    {/* Booking Name & Category */}
                    <td className="py-3.5 px-4">
                      <strong className="text-slate-900 font-semibold text-xs block">{b.bookingName}</strong>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-mono">#{b.bookingId}</span>
                        <span className="text-slate-300 text-[10px]">&bull;</span>
                        <span className="text-[11px] text-slate-500">{b.bookingCategory}</span>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] font-semibold text-slate-900 block">
                        {b.bookingType}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-semibold text-slate-900 block">{b.customerName}</span>
                      <span className="text-[11px] text-slate-500 font-mono block mt-0.5">{b.mobile}</span>
                    </td>

                    {/* Venue / Room */}
                    <td className="py-3.5 px-4 text-slate-800 font-medium text-xs">
                      {b.venueOrRoom}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 font-mono text-slate-900 font-semibold text-xs">
                      {b.startDate}
                    </td>

                    {/* Pax / Rooms */}
                    <td className="py-3.5 px-4 font-mono text-slate-700 font-medium text-xs">
                      {b.bookingType === "Room Booking" ? `${b.roomCount || 1} Rooms` : `${b.guestCount || 50} Pax`}
                    </td>

                    {/* Contract Value */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-xs">
                      ₹{b.contractValue.toLocaleString("en-IN")}
                    </td>

                    {/* Status & BEO */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border",
                          b.status === "Confirmed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                            : b.status === "Tentative"
                            ? "bg-amber-50 text-amber-700 border-amber-200/70"
                            : b.status === "Draft"
                            ? "bg-slate-100 text-slate-600 border-slate-200/70"
                            : "bg-rose-50 text-rose-700 border-rose-200/70"
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            b.status === "Confirmed"
                              ? "bg-emerald-600"
                              : b.status === "Tentative"
                              ? "bg-amber-600"
                              : b.status === "Draft"
                              ? "bg-slate-400"
                              : "bg-rose-600"
                          )}
                        />
                        {b.status}
                      </span>
                      {b.beoRequired ? (
                        <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                          {b.beoId ? `${b.beoId} (${b.beoStatus || "Draft"})` : "BEO Required"}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                          {b.destinationDepartment || "Front Office"}{" "}
                          {b.handoverStatus === "Handed Over" ? "✓" : "(Pending)"}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBooking(b);
                          setDrawerTab("overview");
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                      >
                        <Eye className="h-3 w-3 text-slate-400" /> View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400 text-xs italic">
                    No bookings found matching your selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: CREATE BOOKING & POST-SAVE WORKFLOW MODAL
      ───────────────────────────────────────────────────────────── */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setCreatedBookingResult(null);
            setShowHandoverDialog(false);
          }}
          title={
            createdBookingResult
              ? showHandoverDialog
                ? "Department Handover"
                : `Booking Created — #${createdBookingResult.bookingId}`
              : `Create Booking — Step ${createStep} of 4: ${
                  createStep === 1
                    ? "Select Booking Type"
                    : createStep === 2
                    ? "Customer Master Selection"
                    : createStep === 3
                    ? `${formBookingType} Details`
                    : "Availability Check & Confirmation"
                }`
          }
          maxWidth={createdBookingResult ? (showHandoverDialog ? "md" : "lg") : "2xl"}
        >
          {createdBookingResult ? (
            /* ─────────────────────────────────────────────────────────────
               EXACT POST-SAVE NEXT-STEP WORKFLOW SCREEN
            ───────────────────────────────────────────────────────────── */
            showHandoverDialog ? (
              /* SUB-PANEL: DEPARTMENT HANDOVER DIALOG */
              <div className="space-y-4 p-1 text-xs">
                <div>
                  <label className="block font-bold text-slate-900 mb-1.5 text-xs">
                    Select Destination Department <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Routing operational execution directly to the selected hotel department.
                  </p>

                  <div className="space-y-2">
                    {[
                      {
                        name: "Front Office",
                        desc: "For Room Booking check-in, keycards, guest folio & room stay management",
                        suggested: createdBookingResult.bookingType === "Room Booking",
                      },
                      {
                        name: "Food & Beverage",
                        desc: "For Restaurant dining table reservations, kitchen prep & catering",
                        suggested: createdBookingResult.bookingType === "Restaurant Booking",
                      },
                      {
                        name: "Banquet Operations",
                        desc: "For standard event setup & hall management without full BEO sheet",
                        suggested: createdBookingResult.bookingType === "Banquet / Event Booking",
                      },
                      {
                        name: "Housekeeping",
                        desc: "For special room blocks, VIP turndown & linen preparations",
                        suggested: false,
                      },
                      {
                        name: "Other",
                        desc: "General hotel concierge / auxiliary operational teams",
                        suggested: false,
                      },
                    ].map((dept) => (
                      <label
                        key={dept.name}
                        className={cn(
                          "flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition",
                          selectedDepartment === dept.name
                            ? "bg-blue-50/80 border-blue-500 ring-1 ring-blue-500"
                            : "bg-white border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        <input
                          type="radio"
                          name="destDept"
                          value={dept.name}
                          checked={selectedDepartment === dept.name}
                          onChange={(e) => setSelectedDepartment(e.target.value)}
                          className="mt-0.5 text-blue-700 focus:ring-blue-600 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <strong className="text-xs font-bold text-slate-900">{dept.name}</strong>
                            {dept.suggested && (
                              <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded">
                                Recommended
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 block pt-0.5">{dept.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Handover Summary Box */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Booking:</span>
                    <strong className="font-mono text-slate-900">{createdBookingResult.bookingId}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Destination:</span>
                    <strong className="text-blue-900 font-bold">{selectedDepartment}</strong>
                  </div>
                </div>

                {/* Handover Dialog Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHandoverDialog(false)}
                    className="rounded-lg text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleConfirmDepartmentHandover}
                    className="bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg text-xs px-4 flex items-center gap-1"
                  >
                    <Send className="h-3.5 w-3.5" /> Proceed to Department
                  </Button>
                </div>
              </div>
            ) : (
              /* PRIMARY POST-SAVE SCREEN */
              <div className="space-y-4 p-1 text-xs">
                {/* 1. Booking Created Summary Card */}
                <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-4 text-emerald-950 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0" />
                    <strong className="text-sm font-bold">✅ Booking Created</strong>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-emerald-200/70">
                    <div>
                      <span className="text-[10px] text-emerald-800 font-medium block">Booking ID:</span>
                      <strong className="font-mono text-emerald-950 text-xs">{createdBookingResult.bookingId}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-800 font-medium block">Booking Name:</span>
                      <strong className="text-slate-900 text-xs truncate block">{createdBookingResult.bookingName}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-800 font-medium block">Booking Type:</span>
                      <span className="font-semibold text-slate-800">{createdBookingResult.bookingType}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-800 font-medium block">Customer:</span>
                      <span className="font-semibold text-slate-900">{createdBookingResult.customerName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-800 font-medium block">Date:</span>
                      <span className="font-mono font-semibold text-slate-900">{createdBookingResult.startDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-800 font-medium block">Status:</span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block",
                          createdBookingResult.status === "Confirmed"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : createdBookingResult.status === "Tentative"
                            ? "bg-purple-100 text-purple-800 border-purple-300"
                            : "bg-slate-100 text-slate-700 border-slate-300"
                        )}
                      >
                        {createdBookingResult.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. NEXT STEP DECISION BANNER */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
                    Next Step Actions
                  </span>

                  {createdBookingResult.beoRequired ? (
                    /* PATH A — BEO RECOMMENDED / REQUIRED */
                    <div className="p-4 bg-purple-50/80 border border-purple-200 rounded-xl space-y-3">
                      <div className="flex items-start gap-2.5">
                        <FileSpreadsheet className="h-5 w-5 text-purple-700 shrink-0 mt-0.5" />
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-xs font-bold text-purple-950 block">
                              BEO Required
                            </strong>
                            <span className="text-[10px] bg-purple-200 text-purple-900 font-semibold px-1.5 py-0.2 rounded">
                              Event / Banquet Standard
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 pt-0.5">
                            This booking requires a Function Sheet (BEO) to detail banquet setup, catering menu, audio-visual and operational department instructions. You can also proceed directly to department handover.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-200/70">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsCreateModalOpen(false);
                            setCreatedBookingResult(null);
                          }}
                          className="rounded-lg text-xs"
                        >
                          Close
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowHandoverDialog(true)}
                          className="text-blue-900 bg-blue-50/70 border-blue-200 hover:bg-blue-100 font-bold text-xs rounded-lg px-3.5 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Send className="h-3.5 w-3.5 text-blue-700" /> Proceed (Handover)
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleCreateBeoForBooking(createdBookingResult)}
                          className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-lg px-4 flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5" /> Create BEO
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* PATH B — BEO NOT REQUIRED BY DEFAULT */
                    <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl space-y-3">
                      <div className="flex items-start gap-2.5">
                        <Send className="h-5 w-5 text-blue-700 shrink-0 mt-0.5" />
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-xs font-bold text-blue-950 block">
                              BEO Not Required
                            </strong>
                            <span className="text-[10px] bg-blue-200 text-blue-900 font-semibold px-1.5 py-0.2 rounded">
                              Direct Department Handover
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 pt-0.5">
                            Operational execution for this booking is routed directly to the destination department. You can also create a Function Sheet (BEO) if special event setups are needed.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-blue-200/70">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsCreateModalOpen(false);
                            setCreatedBookingResult(null);
                          }}
                          className="rounded-lg text-xs"
                        >
                          Close
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCreateBeoForBooking(createdBookingResult)}
                          className="text-purple-900 bg-purple-50/70 border-purple-200 hover:bg-purple-100 font-bold text-xs rounded-lg px-3.5 flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5 text-purple-700" /> Create BEO
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setShowHandoverDialog(true)}
                          className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-lg px-4 flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Send className="h-3.5 w-3.5" /> Proceed
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          ) : (
            /* ─────────────────────────────────────────────────────────────
               4-STEP CREATION WIZARD
            ───────────────────────────────────────────────────────────── */
            <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1 text-xs">
              {/* STEP PROGRESS BAR */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 px-1 gap-2">
                <div className="flex items-center gap-3 sm:gap-4">
                  {[
                    { step: 1, label: "Booking Type" },
                    { step: 2, label: "Customer" },
                    { step: 3, label: "Booking Details" },
                    { step: 4, label: "Availability & Save" },
                  ].map((s) => (
                    <div key={s.step} className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono",
                          createStep === s.step
                            ? "bg-emerald-700 text-white"
                            : createStep > s.step
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-400"
                        )}
                      >
                        {createStep > s.step ? "✓" : s.step}
                      </span>
                      <span
                        className={cn(
                          "text-[11px] font-bold hidden sm:inline",
                          createStep === s.step ? "text-slate-900" : "text-slate-400"
                        )}
                      >
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Simple, compact Selected Booking Type Badge */}
                {createStep > 1 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs whitespace-nowrap">
                    {(() => {
                      const { icon: Icon } = getBookingTypeConfig(formBookingType);
                      return <Icon className="h-3.5 w-3.5 text-emerald-700" />;
                    })()}
                    {formBookingType}
                  </span>
                )}
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  STEP 1: 6 BOOKING TYPE CARDS
              ───────────────────────────────────────────────────────────── */}
              {createStep === 1 && (
                <div className="space-y-3">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
                    Select Booking Classification
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      {
                        type: "Banquet / Event Booking",
                        label: "Banquet / Wedding Event",
                        icon: Sparkles,
                        desc: "Weddings, receptions, parties, gala dinners (BEO required)",
                      },
                      {
                        type: "Conference Booking",
                        label: "Conference / Meeting",
                        icon: Building2,
                        desc: "Corporate seminars, boardroom meets (BEO required)",
                      },
                      {
                        type: "Room Booking",
                        label: "Room Booking Stay",
                        icon: Bed,
                        desc: "Individual or delegation room stays (Front Office handover)",
                      },
                      {
                        type: "Restaurant Booking",
                        label: "Restaurant Booking",
                        icon: UtensilsCrossed,
                        desc: "Dining tables & group dinners (F&B handover)",
                      },
                      {
                        type: "Swimming Pool Booking",
                        label: "Swimming Pool Booking",
                        icon: Waves,
                        desc: "Pool deck buyouts & socials (Configurable BEO)",
                      },
                      {
                        type: "Private Event / Other",
                        label: "Private / Other Event",
                        icon: CalendarDays,
                        desc: "Custom private gatherings & special occasions",
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = formBookingType === item.type;
                      return (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => {
                            setFormBookingType(item.type as CentralBookingType);
                            setCreateStep(2);
                          }}
                          className={cn(
                            "p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between h-28",
                            isSelected
                              ? "bg-emerald-50 border-emerald-500 shadow-2xs ring-1 ring-emerald-500"
                              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
                          )}
                        >
                          <Icon className={cn("h-5 w-5", isSelected ? "text-emerald-700" : "text-slate-500")} />
                          <div>
                            <strong className="text-xs font-bold text-slate-900 block leading-tight">
                              {item.label}
                            </strong>
                            <span className="text-[10px] text-slate-500 line-clamp-1">{item.desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 2: CUSTOMER MASTER SELECTION
              ───────────────────────────────────────────────────────────── */}
              {createStep === 2 && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
                      Select Customer / Contact Record *
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsQuickContactOpen(true)}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer flex items-center gap-1"
                    >
                      + Create New Contact
                    </button>
                  </div>

                  {/* Contact Selector Dropdown */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                      Search Customer Database (Name, Mobile, Email, Company)
                    </label>
                    <select
                      value={formContactId}
                      onChange={(e) => {
                        const c = contacts.find((item) => item.contactId === e.target.value);
                        if (c) handleSelectContact(c);
                      }}
                      className="w-full p-2.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    >
                      <option value="">-- Choose Existing Contact from Master Database --</option>
                      {contacts.map((c) => (
                        <option key={c.contactId} value={c.contactId}>
                          {c.contactName || `${c.firstName || ""} ${c.lastName || ""}`} • {c.mobileNumber || c.mobile} •{" "}
                          {c.companyName || "Individual Guest"} ({c.contactId})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Auto-Populated Contact Preview Card */}
                  {formCustomerName && (
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-emerald-700" /> Linked Customer Master Record
                        </span>
                        <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                          #{formContactId || "CONT-MASTER"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Contact Name</span>
                          <strong className="text-slate-900">{formCustomerName}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Mobile</span>
                          <span className="font-mono text-slate-800">{formMobile || "—"}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Email</span>
                          <span className="text-slate-800">{formEmail || "—"}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Company / Organization</span>
                          <span className="text-slate-800">{formCompany || "Individual"}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Inline Quick Contact Creation Modal */}
                  {isQuickContactOpen && (
                    <div className="border border-emerald-300 bg-white p-3 rounded-xl shadow-xs space-y-2.5">
                      <strong className="text-xs font-bold text-slate-900 block">
                        Create &amp; Link New Master Contact
                      </strong>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Full Name *"
                          value={quickContactName}
                          onChange={(e) => setQuickContactName(e.target.value)}
                          className="p-1.5 text-xs rounded border border-slate-200"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Mobile Number *"
                          value={quickContactMobile}
                          onChange={(e) => setQuickContactMobile(e.target.value)}
                          className="p-1.5 text-xs rounded border border-slate-200"
                        />
                        <input
                          type="email"
                          placeholder="Email Address"
                          value={quickContactEmail}
                          onChange={(e) => setQuickContactEmail(e.target.value)}
                          className="p-1.5 text-xs rounded border border-slate-200"
                        />
                        <input
                          type="text"
                          placeholder="Company (Optional)"
                          value={quickContactCompany}
                          onChange={(e) => setQuickContactCompany(e.target.value)}
                          className="p-1.5 text-xs rounded border border-slate-200"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsQuickContactOpen(false)}
                          className="h-7 text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleCreateQuickContact}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold h-7 text-xs"
                        >
                          Save &amp; Link
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 3: DYNAMIC TYPE-SPECIFIC DETAILS
              ───────────────────────────────────────────────────────────── */}
              {createStep === 3 && (
                <div className="space-y-3.5">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
                    {formBookingType} Details
                  </span>

                  {/* 1. ROOM BOOKING FORM */}
                  {formBookingType === "Room Booking" && (
                    <div className="space-y-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200/80">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1 text-[11px]">Check-In Date *</label>
                          <input
                            type="date"
                            value={formStartDate}
                            onChange={(e) => setFormStartDate(e.target.value)}
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1 text-[11px]">Check-Out Date *</label>
                          <input
                            type="date"
                            value={formEndDate}
                            onChange={(e) => setFormEndDate(e.target.value)}
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1 text-[11px]">Room Count</label>
                          <input
                            type="number"
                            min={1}
                            value={formRoomCount}
                            onChange={(e) => setFormRoomCount(Number(e.target.value) || 1)}
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono font-semibold text-xs"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1 text-[11px]">Room Type</label>
                          <select
                            value={formRoomType}
                            onChange={(e) => setFormRoomType(e.target.value)}
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium text-xs"
                          >
                            <option value="Deluxe King Room">Deluxe King Room</option>
                            <option value="Executive Suite">Executive Suite</option>
                            <option value="Twin Bed Standard">Twin Bed Standard</option>
                            <option value="Presidential Suite">Presidential Suite</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1 text-[11px]">Rate Plan</label>
                          <input
                            type="text"
                            value={formRatePlan}
                            onChange={(e) => setFormRatePlan(e.target.value)}
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2.5">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1 text-[11px]">Adults</label>
                          <input
                            type="number"
                            min={1}
                            value={formAdults}
                            onChange={(e) => setFormAdults(Number(e.target.value) || 1)}
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1 text-[11px]">Children</label>
                          <input
                            type="number"
                            min={0}
                            value={formChildren}
                            onChange={(e) => setFormChildren(Number(e.target.value) || 0)}
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1 text-[11px]">Arrival Time</label>
                          <input
                            type="text"
                            value={formExpectedArrival}
                            onChange={(e) => setFormExpectedArrival(e.target.value)}
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. BANQUET / WEDDING / CONFERENCE FORM */}
                  {(formBookingType === "Banquet / Event Booking" ||
                    formBookingType === "Conference Booking" ||
                    formBookingType === "Private Event / Other") && (
                    <div className="space-y-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200/80">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                          Event / Booking Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Sharma Royal Wedding Reception"
                          value={formBookingName}
                          onChange={(e) => setFormBookingName(e.target.value)}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1 text-[11px]">Start Date *</label>
                          <input
                            type="date"
                            value={formStartDate}
                            onChange={(e) => setFormStartDate(e.target.value)}
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1 text-[11px]">End Date</label>
                          <input
                            type="date"
                            value={formEndDate}
                            onChange={(e) => setFormEndDate(e.target.value)}
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1 text-[11px]">Start Time</label>
                          <input
                            type="text"
                            value={formStartTime}
                            onChange={(e) => setFormStartTime(e.target.value)}
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1 text-[11px]">End Time</label>
                          <input
                            type="text"
                            value={formEndTime}
                            onChange={(e) => setFormEndTime(e.target.value)}
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                            Venue / Space Master *
                          </label>
                          <select
                            value={formVenueId}
                            onChange={(e) => {
                              setFormVenueId(e.target.value);
                              const v = venues.find((vItem) => vItem.venueId === e.target.value);
                              if (v) setFormVenueOrRoom(v.venueName);
                            }}
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                          >
                            {venues.map((v) => (
                              <option key={v.venueId} value={v.venueId}>
                                {v.venueName} ({v.minimumCapacity}–{v.maximumCapacity} Pax) • {v.location}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1 text-[11px]">Guest Count (Pax)</label>
                          <input
                            type="number"
                            min={1}
                            value={formGuestCount}
                            onChange={(e) => setFormGuestCount(Number(e.target.value) || 1)}
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono font-semibold text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1 text-[11px]">Setup Layout</label>
                          <select
                            value={formSetupLayout}
                            onChange={(e) => setFormSetupLayout(e.target.value)}
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                          >
                            <option value="Round Banquet">Round Banquet</option>
                            <option value="Theatre">Theatre</option>
                            <option value="Classroom">Classroom</option>
                            <option value="Cluster">Cluster</option>
                            <option value="Cocktail">Cocktail</option>
                            <option value="U-Shape">U-Shape</option>
                            <option value="Boardroom">Boardroom</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1 text-[11px]">Food / Menu Plan</label>
                          <input
                            type="text"
                            value={formMenuRequirement}
                            onChange={(e) => setFormMenuRequirement(e.target.value)}
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. RESTAURANT BOOKING FORM */}
                  {formBookingType === "Restaurant Booking" && (
                    <div className="space-y-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200/80">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1 text-[11px]">Dining Date *</label>
                          <input
                            type="date"
                            value={formStartDate}
                            onChange={(e) => setFormStartDate(e.target.value)}
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1 text-[11px]">Dining Time</label>
                          <input
                            type="text"
                            value={formStartTime}
                            onChange={(e) => setFormStartTime(e.target.value)}
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2.5">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1 text-[11px]">Guest Count (Pax)</label>
                          <input
                            type="number"
                            min={1}
                            value={formGuestCount}
                            onChange={(e) => setFormGuestCount(Number(e.target.value) || 1)}
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1 text-[11px]">Table Count</label>
                          <input
                            type="number"
                            min={1}
                            value={formTableCount}
                            onChange={(e) => setFormTableCount(Number(e.target.value) || 1)}
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1 text-[11px]">Dining Package</label>
                          <input
                            type="text"
                            value={formDiningPackage}
                            onChange={(e) => setFormDiningPackage(e.target.value)}
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. SWIMMING POOL BOOKING FORM */}
                  {formBookingType === "Swimming Pool Booking" && (
                    <div className="space-y-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200/80">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1 text-[11px]">Pool Date *</label>
                          <input
                            type="date"
                            value={formStartDate}
                            onChange={(e) => setFormStartDate(e.target.value)}
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1 text-[11px]">Time Slot</label>
                          <input
                            type="text"
                            value={formStartTime}
                            onChange={(e) => setFormStartTime(e.target.value)}
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1 text-[11px]">Guest Count (Pax)</label>
                          <input
                            type="number"
                            min={1}
                            value={formGuestCount}
                            onChange={(e) => setFormGuestCount(Number(e.target.value) || 1)}
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1 text-[11px]">Access Type</label>
                          <input
                            type="text"
                            value={formPoolPackage}
                            onChange={(e) => setFormPoolPackage(e.target.value)}
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                          />
                        </div>
                      </div>

                      <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formPoolRequiresBeo}
                            onChange={(e) => setFormPoolRequiresBeo(e.target.checked)}
                            className="rounded text-emerald-700 focus:ring-emerald-600"
                          />
                          <span className="text-xs font-semibold text-slate-800">
                            Requires Function Sheet (BEO) setup for catering / sound setup
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Financials & Initial Status Section */}
                  <div className="grid grid-cols-3 gap-2.5 pt-1">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 text-[11px]">Contract Value (₹) *</label>
                      <input
                        type="number"
                        min={0}
                        value={formContractValue}
                        onChange={(e) => setFormContractValue(Number(e.target.value) || 0)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono font-bold text-emerald-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 text-[11px]">Advance Received (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={formAdvanceReceived}
                        onChange={(e) => setFormAdvanceReceived(Number(e.target.value) || 0)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono font-semibold text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 text-[11px]">Initial Booking Status</label>
                      <select
                        value={formBookingStatus}
                        onChange={(e) => setFormBookingStatus(e.target.value as BookingStatus)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white font-bold text-xs"
                      >
                        <option value="Confirmed">Confirmed</option>
                        <option value="Tentative">Tentative Hold</option>
                        <option value="Draft">Draft</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 4: AVAILABILITY & CONFLICT CHECK SUMMARY
              ───────────────────────────────────────────────────────────── */}
              {createStep === 4 && (
                <div className="space-y-3.5">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
                    Step 4 — Space Availability &amp; Booking Confirmation
                  </span>

                  {/* Availability Result Banner */}
                  <div
                    className={cn(
                      "p-3 rounded-xl border flex items-start gap-2.5",
                      venueAvailabilityCheck.status === "AVAILABLE"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                        : venueAvailabilityCheck.status === "CONFLICT"
                        ? "bg-rose-50 border-rose-200 text-rose-900"
                        : "bg-amber-50 border-amber-200 text-amber-900"
                    )}
                  >
                    {venueAvailabilityCheck.status === "AVAILABLE" ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
                    ) : venueAvailabilityCheck.status === "CONFLICT" ? (
                      <AlertTriangle className="h-5 w-5 text-rose-700 shrink-0 mt-0.5" />
                    ) : (
                      <Wrench className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                    )}
                    <div className="text-xs">
                      <strong className="font-bold block">{venueAvailabilityCheck.message}</strong>
                      <span className="text-[11px] opacity-80 block pt-0.5">
                        Venue: {formVenueOrRoom} • Date: {formStartDate} • Type: {formBookingType}
                      </span>
                    </div>
                  </div>

                  {/* Summary Card */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2 text-[11px]">
                    <strong className="text-xs font-bold text-slate-900 block">Booking Summary</strong>
                    <div className="grid grid-cols-2 gap-2 text-slate-700">
                      <div>Customer: <strong className="text-slate-900">{formCustomerName}</strong></div>
                      <div>Mobile: <span className="font-mono">{formMobile}</span></div>
                      <div>Space: <strong>{formVenueOrRoom}</strong></div>
                      <div>Date: <span className="font-mono">{formStartDate}</span></div>
                      <div>Contract Value: <strong className="text-emerald-900">₹{formContractValue.toLocaleString("en-IN")}</strong></div>
                      <div>Status: <strong className="text-purple-900">{formBookingStatus}</strong></div>
                    </div>
                  </div>
                </div>
              )}

              {/* MODAL NAVIGATION BUTTONS */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (createStep > 1) setCreateStep((prev) => (prev - 1) as any);
                    else setIsCreateModalOpen(false);
                  }}
                  className="rounded-lg text-xs"
                >
                  {createStep === 1 ? "Cancel" : "Back"}
                </Button>

                <div className="flex items-center gap-2">
                  {createStep < 4 ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (createStep === 2 && !formCustomerName) {
                          alert("Please select or create a customer first.");
                          return;
                        }
                        setCreateStep((prev) => (prev + 1) as any);
                      }}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs px-4"
                    >
                      Next Step →
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveBooking}
                      disabled={venueAvailabilityCheck.status === "CONFLICT" || venueAvailabilityCheck.status === "MAINTENANCE"}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs px-5 shadow-xs cursor-pointer"
                    >
                      Save Booking ✓
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 5: COMPREHENSIVE BOOKING DETAIL DRAWER (5 TABS)
      ───────────────────────────────────────────────────────────── */}
      {selectedBooking && (
        <Drawer
          isOpen={Boolean(selectedBooking)}
          onClose={() => setSelectedBooking(null)}
          title={`Booking Details — #${selectedBooking.bookingId}`}
          maxWidth="xl"
        >
          <div className="space-y-4 text-xs">
            {/* Header Card */}
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
                    {selectedBooking.bookingType} &bull; {selectedBooking.bookingCategory}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{selectedBooking.bookingName}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Customer: <strong className="text-slate-900">{selectedBooking.customerName}</strong>{" "}
                    {selectedBooking.companyName ? `(${selectedBooking.companyName})` : ""}
                  </p>
                </div>
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-[11px] font-semibold border inline-flex items-center gap-1.5",
                    selectedBooking.status === "Confirmed"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                      : selectedBooking.status === "Tentative"
                      ? "bg-amber-50 text-amber-700 border-amber-200/70"
                      : "bg-slate-100 text-slate-700 border-slate-200/70"
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      selectedBooking.status === "Confirmed"
                        ? "bg-emerald-600"
                        : selectedBooking.status === "Tentative"
                        ? "bg-amber-600"
                        : "bg-slate-400"
                    )}
                  />
                  {selectedBooking.status}
                </span>
              </div>

              {/* Quick Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/80 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Date</span>
                  <span className="text-slate-900 font-mono font-semibold">{selectedBooking.startDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Venue / Space</span>
                  <span className="text-slate-900 font-medium truncate block">{selectedBooking.venueOrRoom}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Contract Value</span>
                  <span className="text-slate-900 font-mono font-bold">
                    ₹{selectedBooking.contractValue.toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Balance Due</span>
                  <span className="text-amber-700 font-mono font-bold">
                    ₹{selectedBooking.balanceDue.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Drawer 5 Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-200 pb-1">
              {[
                { key: "overview", label: "Overview", icon: Layers },
                { key: "financials", label: "Financials", icon: DollarSign },
                { key: "details", label: "Venue / Stay Details", icon: Building },
                { key: "timeline", label: "Timeline", icon: History },
                { key: "documents", label: "Documents & BEO", icon: FileText },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = drawerTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setDrawerTab(tab.key as any)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer",
                      isActive ? "bg-slate-900 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* TAB 1: OVERVIEW */}
            {drawerTab === "overview" && (
              <div className="space-y-3">
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                  <strong className="text-xs font-bold text-slate-900 block">Customer Information</strong>
                  <div className="grid grid-cols-2 gap-2 text-slate-700 text-xs">
                    <div>Contact: <strong className="text-slate-900">{selectedBooking.customerName}</strong></div>
                    <div>Mobile: <span className="font-mono text-emerald-800 font-bold">{selectedBooking.mobile}</span></div>
                    <div>Email: <span>{selectedBooking.email || "—"}</span></div>
                    <div>Company: <span>{selectedBooking.companyName || "Individual Guest"}</span></div>
                    <div>Coordinator: <span className="font-medium text-slate-900">{selectedBooking.coordinatorName}</span></div>
                    <div>Attribution: <span className="font-mono text-slate-600">{selectedBooking.dealId || selectedBooking.createdFrom}</span></div>
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                  <strong className="text-xs font-bold text-slate-900 block">Operational Handover &amp; BEO Status</strong>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">BEO Requirement</span>
                      <strong className={selectedBooking.beoRequired ? "text-purple-900" : "text-slate-700"}>
                        {selectedBooking.beoRequired ? `Required (#${selectedBooking.beoId || "Pending BEO"})` : "Not Required"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Department Handover</span>
                      <strong className="text-blue-900 font-bold">
                        {selectedBooking.destinationDepartment || "Front Office"} ({selectedBooking.handoverStatus || "Handed Over"})
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: FINANCIALS */}
            {drawerTab === "financials" && (
              <div className="space-y-3">
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <strong className="text-xs font-bold text-slate-900">Payment Breakdown</strong>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs h-7 px-2.5 rounded-lg flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Record Payment
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 pt-1">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                      <span className="text-[10px] text-slate-500 block">Contract Value</span>
                      <strong className="text-sm font-mono text-slate-900">
                        ₹{selectedBooking.contractValue.toLocaleString("en-IN")}
                      </strong>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200/80">
                      <span className="text-[10px] text-emerald-800 block">Advance Received</span>
                      <strong className="text-sm font-mono text-emerald-900">
                        ₹{selectedBooking.advanceReceived.toLocaleString("en-IN")}
                      </strong>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200/80">
                      <span className="text-[10px] text-amber-800 block">Balance Due</span>
                      <strong className="text-sm font-mono text-amber-900">
                        ₹{selectedBooking.balanceDue.toLocaleString("en-IN")}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: VENUE / STAY DETAILS */}
            {drawerTab === "details" && (
              <div className="space-y-3">
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 text-xs">
                  <strong className="text-xs font-bold text-slate-900 block">Space &amp; Execution Specifications</strong>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div>Venue / Room: <strong className="text-slate-900">{selectedBooking.venueOrRoom}</strong></div>
                    <div>Dates: <span className="font-mono">{selectedBooking.startDate} to {selectedBooking.endDate || selectedBooking.startDate}</span></div>
                    <div>Timing: <span>{selectedBooking.startTime} - {selectedBooking.endTime}</span></div>
                    <div>Pax / Rooms: <strong className="font-mono">{selectedBooking.guestCount ? `${selectedBooking.guestCount} Pax` : `${selectedBooking.roomCount} Rooms`}</strong></div>
                    {selectedBooking.setupLayout && <div>Layout: <span>{selectedBooking.setupLayout}</span></div>}
                    {selectedBooking.menuRequirement && <div>Menu: <span>{selectedBooking.menuRequirement}</span></div>}
                    {selectedBooking.specialRequests && <div className="col-span-2">Special Requests: <span>{selectedBooking.specialRequests}</span></div>}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: TIMELINE */}
            {drawerTab === "timeline" && (
              <div className="space-y-2 p-3 bg-white border border-slate-200 rounded-xl">
                <strong className="text-xs font-bold text-slate-900 block">Booking Chronological Timeline</strong>
                <div className="space-y-2 pt-1">
                  {selectedBooking.timeline.map((entry) => (
                    <div key={entry.id} className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px] space-y-0.5">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900">{entry.action}</strong>
                        <span className="text-[10px] text-slate-500 font-mono">{entry.timestamp}</span>
                      </div>
                      <span className="text-slate-600 block">Actor: {entry.actor} {entry.notes ? `• ${entry.notes}` : ""}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: DOCUMENTS */}
            {drawerTab === "documents" && (
              <div className="space-y-3">
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2.5">
                  <strong className="text-xs font-bold text-slate-900 block">Operational Documents</strong>
                  {selectedBooking.beoRequired ? (
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-purple-700" />
                        <div>
                          <strong className="text-xs font-bold text-purple-950 block">
                            Function Sheet #{selectedBooking.beoId || "BEO"}
                          </strong>
                          <span className="text-[10px] text-purple-700 font-semibold">
                            Status: {selectedBooking.beoStatus || "Draft"}
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => router.push("/sales-marketing/banquets/beo")}
                        className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs h-7 px-3 rounded-lg"
                      >
                        View BEO →
                      </Button>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-xs">
                      BEO Not Required for this booking type ({selectedBooking.bookingType}). Handover routed to{" "}
                      <strong>{selectedBooking.destinationDepartment || "Front Office"}</strong>.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Drawer>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 6: RECORD PAYMENT MODAL
      ───────────────────────────────────────────────────────────── */}
      {isPaymentModalOpen && selectedBooking && (
        <Modal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          title={`Record Advance Payment — #${selectedBooking.bookingId}`}
          maxWidth="sm"
        >
          <form onSubmit={handleRecordPayment} className="space-y-3 p-1 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Payment Amount (₹) *</label>
              <input
                type="number"
                required
                min={1}
                max={selectedBooking.balanceDue || selectedBooking.contractValue}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
                className="w-full p-2 rounded-lg border border-slate-200 font-mono font-bold text-emerald-900 text-xs"
              />
              <span className="text-[10px] text-slate-500 pt-0.5 block">
                Balance Due: ₹{selectedBooking.balanceDue.toLocaleString("en-IN")}
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium text-xs"
              >
                <option value="UPI / Bank Transfer">UPI / Bank Transfer</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Cash Deposit">Cash Deposit</option>
                <option value="Corporate Cheque">Corporate Cheque</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPaymentModalOpen(false)}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs px-4"
              >
                Record Payment ✓
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </ModulePageShell>
  );
}
