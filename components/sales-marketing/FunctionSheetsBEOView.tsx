"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Printer,
  Sparkles,
  UtensilsCrossed,
  Tv,
  Volume2,
  Wrench,
  ShieldCheck,
  Building2,
  User,
  Phone,
  Mail,
  Calendar,
  Check,
  X,
  Plus,
  Eye,
  Share2,
  Layers,
  Send,
  AlertTriangle,
  RotateCcw,
  CheckSquare,
  FileCheck,
  Bed,
  ExternalLink,
  ChevronRight,
  Sparkle,
  Download,
  Building,
  Edit2,
  Copy,
  ChevronDown,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal } from "@/components/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import { cn } from "@/lib/utils";
import { INITIAL_CENTRAL_BOOKINGS, CentralBookingItem } from "./EventBookingsView";
import { INITIAL_CUSTOMER_MASTER } from "./CorporateClientsView";

// ─────────────────────────────────────────────────────────────
// 1. DATA TYPES & SCHEMAS FOR BEO (PMS V1 MASTER SPEC)
// ─────────────────────────────────────────────────────────────

export type BEOStatus =
  | "Draft"
  | "Pending Approval"
  | "Approved"
  | "Department Shared"
  | "In Progress"
  | "Completed"
  | "Cancelled";

export type SetupLayoutType =
  | "Round Banquet"
  | "Theatre"
  | "Classroom"
  | "Cluster"
  | "Cocktail"
  | "U-Shape"
  | "Boardroom"
  | "Other";

export interface BEOTimelineEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  notes?: string;
}

export interface BEOItem {
  beoId: string; // e.g. "BEO-1001"
  bookingId: string; // e.g. "BOOK-1001"
  version: number; // 1, 2, etc.
  status: BEOStatus;

  // Traceability & References
  contactId: string;
  venueId?: string;
  dealId?: string;
  leadId?: string;
  campaignId?: string;

  // Section A - Event Information
  eventName: string;
  eventCategory: string;
  bookingType: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  startTime: string; // e.g. "06:00 PM"
  endTime: string; // e.g. "11:30 PM"
  venueName: string;
  expectedPax: number;
  guaranteedPax: number;
  coordinatorName: string;
  coordinatorMobile: string;

  // Section B - Client & Contact Information
  contactName: string;
  companyName?: string;
  mobile: string;
  email: string;

  // Section C - Venue & Setup Layout
  setupLayout: SetupLayoutType;
  stageRequirement?: string;
  danceFloor: boolean;
  registrationDesk: boolean;
  backdropSize?: string;
  signageBoard: boolean;
  tableSetupNotes?: string;
  seatingNotes?: string;
  brandingNotes?: string;

  // Section D - Food & Beverage (F&B)
  mealServiceTypes: string[]; // ["Dinner", "Snacks", "High Tea", "Breakfast", "Lunch", "Cocktail"]
  menuSelection: string;
  dietaryRequirements?: string; // e.g. "30 Jain, 15 Vegan, Nut Allergy"
  fbNotes?: string;

  // Section E - AV & Technical Checklist
  projector: boolean;
  ledScreen: boolean;
  soundSystem: boolean;
  microphone: boolean;
  podium: boolean;
  lighting: boolean;
  wifiRequired: boolean;
  powerBackup: boolean;
  microphonesNotes?: string;
  lightingNotes?: string;
  avNotes?: string;

  // Section F - Decoration & Event Setup
  theme: string;
  stageDecoration?: string;
  floralSetup: string;
  tableDecoration: string;
  backdrop?: string;
  branding?: string;
  specialSetupInstructions?: string;

  // Section G - Room Requirement (Conditional)
  hasRoomBlock: boolean;
  roomCount?: number;
  roomNights?: number;
  roomType?: string;
  roomCheckIn?: string;
  roomCheckOut?: string;

  // Section H - Departmental Instructions
  banquetNotes?: string;
  kitchenNotes?: string;
  fnbNotes?: string;
  housekeepingNotes?: string;
  engineeringNotes?: string;
  avitNotes?: string;
  securityNotes?: string;
  frontOfficeNotes?: string;
  accountsNotes?: string;

  // Section I - Special Instructions & VIP Notes
  vipNotes?: string;
  customerSpecialRequests?: string;
  operationalAlerts?: string;
  specialGuestNotes?: string;

  // Commercial Reference (Read-Only)
  contractValue: number;
  advanceStatus?: string;

  createdAt: string;
  updatedAt: string;
  timeline: BEOTimelineEntry[];
}

// ─────────────────────────────────────────────────────────────
// 2. INITIAL SEED DATA (BEO FUNCTION SHEETS)
// ─────────────────────────────────────────────────────────────

export const INITIAL_BEOS: BEOItem[] = [
  {
    beoId: "BEO-1001",
    bookingId: "BOOK-1001",
    version: 1,
    status: "Approved",
    eventName: "Sharma Royal Wedding Reception",
    eventCategory: "Wedding",
    bookingType: "Banquet / Event Booking",
    startDate: "2026-11-15",
    endDate: "2026-11-15",
    startTime: "06:00 PM",
    endTime: "11:30 PM",
    venueId: "VEN-001",
    venueName: "Grand Ballroom",
    expectedPax: 400,
    guaranteedPax: 380,
    coordinatorName: "Vikram Malhotra",
    coordinatorMobile: "+91 98111 22334",
    contactId: "CONT-1001",
    contactName: "Raj Sharma",
    companyName: "Sharma Family Enterprise",
    mobile: "+91 98765 43210",
    email: "raj.sharma@gmail.com",
    dealId: "DEAL-1001",
    leadId: "LEAD-1001",
    campaignId: "CMP-WDG-2025",
    setupLayout: "Round Banquet",
    stageRequirement: "30ft x 16ft Elevated Mandap Stage with Royal Sofa Backdrop",
    danceFloor: true,
    registrationDesk: true,
    backdropSize: "40ft Custom Marigold Floral LED Wall",
    signageBoard: true,
    tableSetupNotes: "40 round tables of 10 covers with gold satin runners and crystal stemware.",
    seatingNotes: "VIP Family table placed center front with 12 covers. 40 round tables of 10 covers each.",
    brandingNotes: "Welcome arch with 'Raj & Simran Wedding Reception' at foyer entrance.",
    mealServiceTypes: ["Dinner", "Snacks", "Cocktail"],
    menuSelection: "Royal Indian Buffet (4 Starters, 8 Main Courses, Live Chaat Counter, 4 Desserts)",
    dietaryRequirements: "30 Pure Jain Meals & 15 Kids Meal Trays required.",
    fbNotes: "Dinner service live counter start time sharp 08:00 PM. Continuous hot food refills maintained.",
    projector: false,
    ledScreen: true,
    soundSystem: true,
    microphone: true,
    podium: false,
    lighting: true,
    wifiRequired: true,
    powerBackup: true,
    microphonesNotes: "4 Cordless Handheld Mics + 2 Collar Mics for Bride/Groom Entry",
    lightingNotes: "Stage Moving Head Spotlights + Warm Ambient Mood Uplighting throughout Ballroom",
    avNotes: "Dedicated AV sound engineer on console from 05:00 PM onwards.",
    theme: "Royal Marigold & Gold Velvet Luxury",
    stageDecoration: "Carved gold pillars with crystal chandeliers",
    floralSetup: "Fresh Yellow Marigold Canopy Entrance & Fragrant Rose Mandap Pillars",
    tableDecoration: "Crystal Glass Candelabras with Gold Satin Table Runners",
    backdrop: "Royal palace digital backdrop on LED wall",
    branding: "Custom monograms on menu cards and photo booth",
    specialSetupInstructions: "Bridal suite access from 02:00 PM; separate VIP gift table near stage.",
    hasRoomBlock: true,
    roomCount: 10,
    roomNights: 10,
    roomType: "Deluxe King Rooms",
    roomCheckIn: "2026-11-15 12:00 PM",
    roomCheckOut: "2026-11-16 11:00 AM",
    banquetNotes: "Ensure 2 dedicated banquet captains and 24 service associates on floor.",
    kitchenNotes: "Chef Special Rabdi Jalebi live counter. Jain food prepared in separate satellite kitchen.",
    fnbNotes: "Mocktail live bar on East Foyer with 3 flair bartenders.",
    housekeepingNotes: "Extra washroom attendant stationed at Ballroom Restrooms from 06:00 PM onwards.",
    engineeringNotes: "Backup generator on hot standby from 05:30 PM to 12:00 AM. AC set to 22°C.",
    avitNotes: "Test bride entry music track on main PA system at 04:30 PM.",
    securityNotes: "VIP valet parking management for 80 cars; VIP entrance gate security check.",
    frontOfficeNotes: "10 Deluxe rooms keycards pre-printed in Welcome Folders for family check-in.",
    accountsNotes: "Contract value ₹8,50,000; advance ₹3,00,000 received. Balance billable on checkout.",
    vipNotes: "Cabinet Minister attending at 08:30 PM; escort through VIP portico.",
    customerSpecialRequests: "Grandparents require wheelchair assistance at entrance.",
    operationalAlerts: "No pyrotechnics allowed indoors; cold sparklers approved for stage only.",
    specialGuestNotes: "Dedicated steward for VIP head table.",
    contractValue: 850000,
    advanceStatus: "Partial Advance Received (₹3,00,000)",
    createdAt: "10 Aug 2026",
    updatedAt: "28 Aug 2026",
    timeline: [
      { id: "LOG-01", timestamp: "10 Aug 2026 02:00 PM", action: "BEO Draft Created from Confirmed Booking #BOOK-1001", actor: "Vikram Malhotra" },
      { id: "LOG-02", timestamp: "12 Aug 2026 11:00 AM", action: "Submitted for Banquet Manager Approval", actor: "Vikram Malhotra" },
      { id: "LOG-03", timestamp: "12 Aug 2026 04:30 PM", action: "BEO Approved by General Manager", actor: "Suresh Menon (GM)" },
    ],
  },
  {
    beoId: "BEO-1002",
    bookingId: "BOOK-1003",
    version: 1,
    status: "Pending Approval",
    eventName: "IMA Annual Medical Conference",
    eventCategory: "Conference",
    bookingType: "Conference Booking",
    startDate: "2026-10-05",
    endDate: "2026-10-07",
    startTime: "08:30 AM",
    endTime: "06:00 PM",
    venueId: "VEN-003",
    venueName: "Executive Boardroom A",
    expectedPax: 30,
    guaranteedPax: 30,
    coordinatorName: "Jay Kumar",
    coordinatorMobile: "+91 98220 33445",
    contactId: "CONT-1005",
    contactName: "Dr. K.S. Rao",
    companyName: "Indian Medical Association",
    mobile: "+91 98450 11223",
    email: "drksrao@ima.org",
    dealId: "OPP-303",
    setupLayout: "Boardroom",
    stageRequirement: "Small presentation podium at head of boardroom table",
    danceFloor: false,
    registrationDesk: true,
    backdropSize: "Standard IMA Medical Summit Display",
    signageBoard: true,
    tableSetupNotes: "Executive leather chairs with pads, branded pens, and mineral water bottles.",
    seatingNotes: "30 executive delegates around master boardroom table with 2 breakout pods.",
    brandingNotes: "IMA Digital Backdrop on interactive 85-inch touch panel.",
    mealServiceTypes: ["Breakfast", "Lunch", "High Tea"],
    menuSelection: "Executive Continental & Indian Lunch Buffet + Mid-morning Cookies & Tea",
    dietaryRequirements: "5 Diabetic Friendly Sugar-Free desserts & low-sodium options.",
    fbNotes: "Coffee & High Tea service outside boardroom during 11:00 AM and 04:00 PM session breaks.",
    projector: true,
    ledScreen: true,
    soundSystem: true,
    microphone: true,
    podium: true,
    lighting: false,
    wifiRequired: true,
    powerBackup: true,
    microphonesNotes: "2 Podium Mics, 4 Q&A Aisle Cordless Mics, 2 Lapel Mics for Keynote Speakers",
    avNotes: "Dedicated 100 Mbps leased line Wi-Fi SSID: IMA_Conference_2026.",
    theme: "Corporate Medical Clean Blue & White",
    floralSetup: "Fresh Orchid Podium Arrangements & Registration Desk Vases",
    tableDecoration: "Not Applicable",
    hasRoomBlock: true,
    roomCount: 10,
    roomNights: 20,
    roomType: "Executive Suites",
    roomCheckIn: "2026-10-05 10:00 AM",
    roomCheckOut: "2026-10-07 02:00 PM",
    banquetNotes: "Ensure session water bottles replenished every 2 hours.",
    kitchenNotes: "Hot buffet lunch service from 01:00 PM to 02:30 PM sharp.",
    fnbNotes: "Continuous hot tea/coffee station running from 08:30 AM to 05:30 PM.",
    housekeepingNotes: "Boardroom trash bins cleared after each session break.",
    engineeringNotes: "Maintain 21°C throughout day in Boardroom A.",
    avitNotes: "Pre-load speaker PPT presentations on master console laptop at 07:30 AM.",
    securityNotes: "Delegate badge verification at main Boardroom foyer entry.",
    frontOfficeNotes: "10 Guest room arrivals on 05 Oct morning.",
    accountsNotes: "Direct bill to IMA Org. 25% token hold.",
    vipNotes: "Keynote speaker Dr. V. Sen arrives by executive car at 08:15 AM.",
    contractValue: 1850000,
    advanceStatus: "Pending Token Advance",
    createdAt: "18 Aug 2026",
    updatedAt: "28 Aug 2026",
    timeline: [
      { id: "LOG-04", timestamp: "18 Aug 2026 11:00 AM", action: "BEO Draft Created from Confirmed Booking #BOOK-1003", actor: "Jay Kumar" },
      { id: "LOG-05", timestamp: "20 Aug 2026 03:00 PM", action: "Submitted for Operations Review", actor: "Jay Kumar" },
    ],
  },
  {
    beoId: "BEO-1003",
    bookingId: "BOOK-1005",
    version: 1,
    status: "Draft",
    eventName: "Monsoon Sunset Sundowner Pool Party",
    eventCategory: "Pool Party",
    bookingType: "Swimming Pool Booking",
    startDate: "2026-09-05",
    endDate: "2026-09-05",
    startTime: "04:00 PM",
    endTime: "09:00 PM",
    venueId: "VEN-004",
    venueName: "Azure Poolside Deck",
    expectedPax: 60,
    guaranteedPax: 50,
    coordinatorName: "Vikram Malhotra",
    coordinatorMobile: "+91 98111 22334",
    contactId: "CONT-1003",
    contactName: "Pooja Reddy",
    companyName: "Reddy Family",
    mobile: "+91 99001 22334",
    email: "pooja.reddy@gmail.com",
    setupLayout: "Cocktail",
    stageRequirement: "DJ Console Setup near Pool Deck Cabana 4",
    danceFloor: false,
    registrationDesk: false,
    signageBoard: true,
    tableSetupNotes: "6 Poolside Cabanas with cushioned daybeds + 8 high cocktail tables.",
    seatingNotes: "Cabanas and lounge chairs.",
    mealServiceTypes: ["Snacks", "Cocktail", "Dinner"],
    menuSelection: "Live BBQ Grill & Tapas + Exotic Fruit Mocktail Bar",
    dietaryRequirements: "Finger foods suitable for poolside dining.",
    fbNotes: "Live cocktail & mocktail flair bartending counter stationed near deck.",
    projector: false,
    ledScreen: false,
    soundSystem: true,
    microphone: true,
    podium: false,
    lighting: true,
    wifiRequired: true,
    powerBackup: true,
    microphonesNotes: "1 Cordless Mic for DJ announcements",
    lightingNotes: "Underwater Pool LED Color Changing Lights + Fairy Light Canopy over Cabanas",
    avNotes: "Waterproof cabling and power connection to DJ booth.",
    theme: "Boho Tropical Sunset Vibe",
    floralSetup: "Tropical Palm Leaves & Hibiscus Table Vases",
    tableDecoration: "Floating LED Candle Lanterns in Swimming Pool",
    hasRoomBlock: false,
    banquetNotes: "Lifeguard on duty at pool edge throughout the event duration.",
    kitchenNotes: "Live skewers & sliders grill from 05:00 PM to 08:30 PM.",
    fnbNotes: "Beverage bar to cease serving at 08:45 PM.",
    housekeepingNotes: "Provide 100 dry pool towels in woven wicker baskets near cabanas.",
    engineeringNotes: "Inspect pool filtration and temperature at 02:00 PM.",
    avitNotes: "DJ setup sound test at 03:00 PM.",
    securityNotes: "Strict wristband access control to private pool deck area.",
    frontOfficeNotes: "No rooms associated with this event.",
    accountsNotes: "Contract value ₹1,50,000; advance ₹50,000 received.",
    contractValue: 150000,
    advanceStatus: "Partial Advance Received (₹50,000)",
    createdAt: "20 Aug 2026",
    updatedAt: "28 Aug 2026",
    timeline: [
      { id: "LOG-06", timestamp: "20 Aug 2026 05:00 PM", action: "BEO Draft Created", actor: "Vikram Malhotra" },
    ],
  },
];

export function FunctionSheetsBEOView() {
  const router = useRouter();
  const [beoList, setBeoList] = useState<BEOItem[]>(INITIAL_BEOS);
  const [masterBookings] = useState<CentralBookingItem[]>(INITIAL_CENTRAL_BOOKINGS);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [selectedVenueFilter, setSelectedVenueFilter] = useState<string>("ALL");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");
  const [viewScope, setViewScope] = useState<"ALL" | "PENDING_CREATION" | "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "SHARED" | "COMPLETED">("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Drawer & Modal States
  const [selectedBEO, setSelectedBEO] = useState<BEOItem | null>(null);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Editable Form State
  const [formData, setFormData] = useState<BEOItem | null>(null);
  const [activeTab, setActiveTab] = useState<"event_setup" | "fnb" | "av_decor" | "departments" | "timeline">("event_setup");

  // Department Share Selection State
  const [shareDepartments, setShareDepartments] = useState<string[]>([
    "Banquet",
    "Kitchen",
    "Food & Beverage",
    "Housekeeping",
    "Engineering",
    "AV / IT",
  ]);

  // ─────────────────────────────────────────────────────────────
  // PENDING BEO BOOKINGS INGESTION COMPUTATION
  // ─────────────────────────────────────────────────────────────
  const pendingBEOBookings = useMemo(() => {
    const existingBookingIds = new Set(beoList.map((b) => b.bookingId));
    return masterBookings.filter((b) => b.beoRequired && (!b.beoId || !existingBookingIds.has(b.bookingId)));
  }, [masterBookings, beoList]);

  // ─────────────────────────────────────────────────────────────
  // METRICS CALCULATION
  // ─────────────────────────────────────────────────────────────
  const kpiMetrics = useMemo(() => {
    const draftCount = beoList.filter((b) => b.status === "Draft").length;
    const pendingCount = beoList.filter((b) => b.status === "Pending Approval").length;
    const approvedCount = beoList.filter((b) => b.status === "Approved").length;
    const sharedCount = beoList.filter((b) => b.status === "Department Shared").length;
    const pendingCreationCount = pendingBEOBookings.length;

    return { draftCount, pendingCount, approvedCount, sharedCount, pendingCreationCount };
  }, [beoList, pendingBEOBookings]);

  // ─────────────────────────────────────────────────────────────
  // FILTERING LOGIC
  // ─────────────────────────────────────────────────────────────
  const filteredBEOs = useMemo(() => {
    return beoList.filter((b) => {
      // Scope Filter
      if (viewScope === "DRAFT" && b.status !== "Draft") return false;
      if (viewScope === "PENDING_APPROVAL" && b.status !== "Pending Approval") return false;
      if (viewScope === "APPROVED" && b.status !== "Approved") return false;
      if (viewScope === "SHARED" && b.status !== "Department Shared") return false;
      if (viewScope === "COMPLETED" && b.status !== "Completed") return false;

      // Text Search
      const searchLower = searchTerm.toLowerCase();
      const matchSearch =
        b.beoId.toLowerCase().includes(searchLower) ||
        b.bookingId.toLowerCase().includes(searchLower) ||
        b.eventName.toLowerCase().includes(searchLower) ||
        b.contactName.toLowerCase().includes(searchLower) ||
        (b.companyName && b.companyName.toLowerCase().includes(searchLower)) ||
        b.venueName.toLowerCase().includes(searchLower) ||
        b.coordinatorName.toLowerCase().includes(searchLower);

      const matchStatus = selectedStatusFilter === "ALL" || b.status === selectedStatusFilter;
      const matchVenue = selectedVenueFilter === "ALL" || b.venueName.includes(selectedVenueFilter);
      const matchType = selectedTypeFilter === "ALL" || b.eventCategory === selectedTypeFilter;

      return matchSearch && matchStatus && matchVenue && matchType;
    });
  }, [beoList, viewScope, searchTerm, selectedStatusFilter, selectedVenueFilter, selectedTypeFilter]);

  // ─────────────────────────────────────────────────────────────
  // HANDLERS: CREATE BEO FROM BOOKING & LIFECYCLE
  // ─────────────────────────────────────────────────────────────

  // Ingest & Create BEO from Booking
  const handleCreateBEOFromBooking = (booking: CentralBookingItem) => {
    const newBeoId = `BEO-${booking.bookingId.replace("BOOK-", "")}`;
    const newBEO: BEOItem = {
      beoId: newBeoId,
      bookingId: booking.bookingId,
      version: 1,
      status: "Draft",
      contactId: booking.contactId,
      venueId: booking.venueId,
      dealId: booking.dealId,
      leadId: booking.leadId,
      campaignId: booking.campaignId,
      eventName: booking.bookingName,
      eventCategory: booking.bookingCategory,
      bookingType: booking.bookingType,
      startDate: booking.startDate,
      endDate: booking.endDate || booking.startDate,
      startTime: booking.startTime || "06:00 PM",
      endTime: booking.endTime || "11:00 PM",
      venueName: booking.venueOrRoom,
      expectedPax: booking.guestCount || 100,
      guaranteedPax: booking.guestCount || 100,
      coordinatorName: booking.coordinatorName || "Vikram Malhotra",
      coordinatorMobile: booking.coordinatorMobile || "+91 98111 22334",
      contactName: booking.customerName,
      companyName: booking.companyName,
      mobile: booking.mobile,
      email: booking.email,
      setupLayout: (booking.setupLayout as SetupLayoutType) || "Round Banquet",
      danceFloor: true,
      registrationDesk: true,
      signageBoard: true,
      mealServiceTypes: ["Dinner", "Snacks"],
      menuSelection: booking.menuRequirement || "Standard Buffet Menu Plan",
      dietaryRequirements: "Standard Veg & Non-Veg",
      projector: true,
      ledScreen: false,
      soundSystem: true,
      microphone: true,
      podium: true,
      lighting: true,
      wifiRequired: true,
      powerBackup: true,
      theme: "Standard Elegant Setup",
      floralSetup: "Fresh floral entrance & stage arrangements",
      tableDecoration: "Standard Banquet table centerpieces",
      hasRoomBlock: Boolean(booking.roomCount && booking.roomCount > 0),
      roomCount: booking.roomCount,
      roomType: booking.roomType,
      banquetNotes: "Standard banquet staffing ratio (1:20 covers).",
      kitchenNotes: "Food replenishment checks every 30 minutes during service.",
      fnbNotes: "Welcome drink station on arrival.",
      housekeepingNotes: "Pre-event thorough vacuuming and washroom checks.",
      engineeringNotes: "Air conditioning set to 22°C 1 hour prior to event.",
      avitNotes: "Sound and mic check 1 hour prior to event start.",
      securityNotes: "Valet and entrance crowd control.",
      contractValue: booking.contractValue,
      advanceStatus: `₹${booking.advanceReceived.toLocaleString("en-IN")} Received`,
      createdAt: "Today",
      updatedAt: "Today",
      timeline: [
        {
          id: `LOG-${Date.now()}`,
          timestamp: "Just now",
          action: `BEO Draft Created from Confirmed Booking #${booking.bookingId}`,
          actor: booking.coordinatorName || "Sales Executive",
        },
      ],
    };

    setBeoList([newBEO, ...beoList]);
    setFormData(newBEO);
    setSelectedBEO(newBEO);
    setIsEditDrawerOpen(true);
    setViewScope("ALL");
    setToastMessage(`✓ Created BEO #${newBeoId} (Draft) for Booking #${booking.bookingId}!`);
  };

  // Open BEO Drawer for Viewing / Editing
  const handleOpenBEODetail = (beo: BEOItem) => {
    setSelectedBEO(beo);
    setFormData({ ...beo });
    setIsEditDrawerOpen(true);
    setActiveTab("event_setup");
  };

  // Save BEO Edit Changes
  const handleSaveBEO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    const updated = {
      ...formData,
      updatedAt: "Just now",
      timeline: [
        ...formData.timeline,
        {
          id: `LOG-${Date.now()}`,
          timestamp: "Just now",
          action: "BEO Draft Updated",
          actor: formData.coordinatorName,
          notes: "Operational specifications updated",
        },
      ],
    };

    setBeoList((prev) => prev.map((b) => (b.beoId === updated.beoId ? updated : b)));
    setSelectedBEO(updated);
    setFormData(updated);
    setToastMessage(`✓ Saved updates to BEO #${updated.beoId}!`);
  };

  // Submit for Approval
  const handleSubmitForApproval = () => {
    if (!selectedBEO) return;
    const updated: BEOItem = {
      ...selectedBEO,
      status: "Pending Approval",
      updatedAt: "Just now",
      timeline: [
        ...selectedBEO.timeline,
        {
          id: `LOG-${Date.now()}`,
          timestamp: "Just now",
          action: "Submitted for Banquet Manager Approval",
          actor: selectedBEO.coordinatorName,
        },
      ],
    };

    setBeoList((prev) => prev.map((b) => (b.beoId === updated.beoId ? updated : b)));
    setSelectedBEO(updated);
    if (formData) setFormData(updated);
    setToastMessage(`✓ BEO #${updated.beoId} submitted for Manager Approval!`);
  };

  // Approve BEO
  const handleApproveBEO = () => {
    if (!selectedBEO) return;
    const updated: BEOItem = {
      ...selectedBEO,
      status: "Approved",
      updatedAt: "Just now",
      timeline: [
        ...selectedBEO.timeline,
        {
          id: `LOG-${Date.now()}`,
          timestamp: "Just now",
          action: "BEO Approved by General Manager",
          actor: "Suresh Menon (GM)",
        },
      ],
    };

    setBeoList((prev) => prev.map((b) => (b.beoId === updated.beoId ? updated : b)));
    setSelectedBEO(updated);
    if (formData) setFormData(updated);
    setToastMessage(`✓ BEO #${updated.beoId} is officially Approved!`);
  };

  // Create Revision on Approved BEO
  const handleCreateRevision = () => {
    if (!selectedBEO) return;
    const newVersion = selectedBEO.version + 1;
    const updated: BEOItem = {
      ...selectedBEO,
      version: newVersion,
      status: "Draft",
      updatedAt: "Just now",
      timeline: [
        ...selectedBEO.timeline,
        {
          id: `LOG-${Date.now()}`,
          timestamp: "Just now",
          action: `Created Revision V${newVersion} (Draft)`,
          actor: selectedBEO.coordinatorName,
          notes: `Version ${selectedBEO.version} locked; new draft created for amendment`,
        },
      ],
    };

    setBeoList((prev) => prev.map((b) => (b.beoId === updated.beoId ? updated : b)));
    setSelectedBEO(updated);
    setFormData(updated);
    setToastMessage(`✓ Created Revision V${newVersion} for BEO #${updated.beoId}!`);
  };

  // Share with Departments Confirmation
  const handleConfirmDepartmentShare = () => {
    if (!selectedBEO) return;
    const deptsList = shareDepartments.join(", ");
    const updated: BEOItem = {
      ...selectedBEO,
      status: "Department Shared",
      updatedAt: "Just now",
      timeline: [
        ...selectedBEO.timeline,
        {
          id: `LOG-${Date.now()}`,
          timestamp: "Just now",
          action: `BEO shared with departments: ${deptsList}`,
          actor: "Banquet Operations Desk",
        },
      ],
    };

    setBeoList((prev) => prev.map((b) => (b.beoId === updated.beoId ? updated : b)));
    setSelectedBEO(updated);
    if (formData) setFormData(updated);
    setIsShareModalOpen(false);
    setToastMessage(`✓ BEO #${updated.beoId} shared with ${shareDepartments.length} departments!`);
  };

  // Cycle Next Status (In Progress / Completed)
  const handleAdvanceStatus = (nextStatus: BEOStatus) => {
    if (!selectedBEO) return;
    const updated: BEOItem = {
      ...selectedBEO,
      status: nextStatus,
      updatedAt: "Just now",
      timeline: [
        ...selectedBEO.timeline,
        {
          id: `LOG-${Date.now()}`,
          timestamp: "Just now",
          action: nextStatus === "In Progress" ? "Event Execution Started" : "Event Concluded & Marked Completed",
          actor: "Floor Captain",
        },
      ],
    };

    setBeoList((prev) => prev.map((b) => (b.beoId === updated.beoId ? updated : b)));
    setSelectedBEO(updated);
    if (formData) setFormData(updated);
    setToastMessage(`✓ BEO #${updated.beoId} status updated to "${nextStatus}"!`);
  };

  return (
    <ModulePageShell
      eyebrow="Sales & Marketing"
      title="Function Sheets (BEO)"
      description="Operational banquet event orders, setup instructions, catering specifications, and department handovers."
      breadcrumbs={[
        { label: "Sales & Marketing", href: "/sales-marketing/dashboard" },
        { label: "Banquets & Events" },
        { label: "Function Sheets (BEO)" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex items-center gap-2">
          {pendingBEOBookings.length > 0 && (
            <Button
              type="button"
              size="sm"
              onClick={() => setViewScope("PENDING_CREATION")}
              className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 px-3.5 h-8.5"
            >
              <Plus className="h-4 w-4" /> Pending BEOs ({pendingBEOBookings.length})
            </Button>
          )}
        </div>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: 5 CRISP V1 BEO KPI CARDS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        <HRKPICard
          label="Draft BEOs"
          value={`${kpiMetrics.draftCount}`}
          subtitle="Work In Progress"
          tone="amber"
          icon={<Clock className="h-4 w-4" />}
        />
        <HRKPICard
          label="Pending Approval"
          value={`${kpiMetrics.pendingCount}`}
          subtitle="Manager Review"
          tone="purple"
          icon={<AlertCircle className="h-4 w-4" />}
        />
        <HRKPICard
          label="Approved"
          value={`${kpiMetrics.approvedCount}`}
          subtitle="Operationally Locked"
          tone="emerald"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <HRKPICard
          label="Department Shared"
          value={`${kpiMetrics.sharedCount}`}
          subtitle="Dispatched to Ops"
          tone="blue"
          icon={<Share2 className="h-4 w-4" />}
        />
        <HRKPICard
          label="Pending Ingestion"
          value={`${kpiMetrics.pendingCreationCount}`}
          subtitle="Bookings Awaiting BEO"
          tone="slate"
          icon={<FileSpreadsheet className="h-4 w-4" />}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: SCOPE TABS & SEARCH / FILTER CONTROLS
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs space-y-3 mb-4">
        {/* Scope Tabs */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 overflow-x-auto gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setViewScope("ALL")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5",
                viewScope === "ALL" ? "bg-slate-900 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <Layers className="h-3.5 w-3.5" /> All BEOs ({beoList.length})
            </button>
            <button
              type="button"
              onClick={() => setViewScope("PENDING_CREATION")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5",
                viewScope === "PENDING_CREATION"
                  ? "bg-purple-700 text-white shadow-2xs"
                  : "text-purple-900 bg-purple-50/70 border border-purple-200 hover:bg-purple-100"
              )}
            >
              <Plus className="h-3.5 w-3.5" /> Pending Creation ({pendingBEOBookings.length})
            </button>
            <button
              type="button"
              onClick={() => setViewScope("DRAFT")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5",
                viewScope === "DRAFT" ? "bg-amber-700 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <Clock className="h-3.5 w-3.5" /> Draft ({kpiMetrics.draftCount})
            </button>
            <button
              type="button"
              onClick={() => setViewScope("PENDING_APPROVAL")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5",
                viewScope === "PENDING_APPROVAL" ? "bg-purple-700 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <AlertCircle className="h-3.5 w-3.5" /> Pending Approval ({kpiMetrics.pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setViewScope("APPROVED")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5",
                viewScope === "APPROVED" ? "bg-emerald-700 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Approved ({kpiMetrics.approvedCount})
            </button>
            <button
              type="button"
              onClick={() => setViewScope("SHARED")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5",
                viewScope === "SHARED" ? "bg-blue-700 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <Share2 className="h-3.5 w-3.5" /> Department Shared ({kpiMetrics.sharedCount})
            </button>
          </div>

          <span className="text-xs text-slate-500 font-medium hidden md:inline">
            Showing <strong>{viewScope === "PENDING_CREATION" ? pendingBEOBookings.length : filteredBEOs.length}</strong> items
          </span>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search BEOs by BEO #, Booking #, Event Name, Customer, Venue, or Coordinator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 pl-9 pr-3 py-2 bg-slate-50 font-medium text-slate-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="text-xs font-semibold rounded-lg border border-slate-200 py-2 px-2.5 bg-white text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Approved">Approved</option>
              <option value="Department Shared">Department Shared</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>

            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="text-xs font-semibold rounded-lg border border-slate-200 py-2 px-2.5 bg-white text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Event Types</option>
              <option value="Wedding">Wedding</option>
              <option value="Conference">Conference</option>
              <option value="Corporate">Corporate</option>
              <option value="Pool Party">Pool Party</option>
              <option value="Private Event">Private Event</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: BEO TABLE & PENDING CREATION INGESTION VIEW
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {viewScope === "PENDING_CREATION" ? (
            /* PENDING BEO CREATION INGESTION TABLE */
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-purple-50/70 text-[11px] font-semibold text-purple-950 border-b border-purple-200">
                <tr>
                  <th className="py-3 px-4">Booking ID</th>
                  <th className="py-3 px-4">Event Name &amp; Category</th>
                  <th className="py-3 px-4">Booking Type</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Venue Space</th>
                  <th className="py-3 px-4">Event Date</th>
                  <th className="py-3 px-4">Pax</th>
                  <th className="py-3 px-4">Coordinator</th>
                  <th className="py-3 px-4 text-center">BEO Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {pendingBEOBookings.length > 0 ? (
                  pendingBEOBookings.map((b) => (
                    <tr key={b.bookingId} className="hover:bg-purple-50/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-purple-900">#{b.bookingId}</td>
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 font-bold block">{b.bookingName}</strong>
                        <span className="text-[10px] text-purple-700">{b.bookingCategory}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                          {b.bookingType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{b.customerName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{b.mobile}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-800">{b.venueOrRoom}</td>
                      <td className="py-3 px-4 font-mono text-slate-900">{b.startDate}</td>
                      <td className="py-3 px-4 font-mono">{b.guestCount || 50} Pax</td>
                      <td className="py-3 px-4 text-slate-600">{b.coordinatorName || "Vikram Malhotra"}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          Pending BEO
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleCreateBEOFromBooking(b)}
                          className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-lg px-3.5 h-7 cursor-pointer flex items-center gap-1 shadow-xs ml-auto"
                        >
                          <Plus className="h-3.5 w-3.5" /> Create BEO →
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-slate-400 text-xs italic">
                      No pending bookings awaiting BEO creation. All bookings have function sheets!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            /* STANDARD BEO MASTER TABLE */
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">BEO Number</th>
                  <th className="py-3 px-4">Booking ID</th>
                  <th className="py-3 px-4">Event Name &amp; Category</th>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Venue</th>
                  <th className="py-3 px-4">Event Date</th>
                  <th className="py-3 px-4">Pax</th>
                  <th className="py-3 px-4">Coordinator</th>
                  <th className="py-3 px-4 text-center">BEO Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredBEOs.length > 0 ? (
                  filteredBEOs.map((beo) => (
                    <tr
                      key={beo.beoId}
                      onClick={() => handleOpenBEODetail(beo)}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                    >
                      {/* BEO Number */}
                      <td className="py-3 px-4 font-mono font-bold text-purple-900">
                        {beo.beoId} <span className="text-[10px] text-slate-400 font-normal">V{beo.version}</span>
                      </td>

                      {/* Booking ID */}
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800">
                        #{beo.bookingId}
                      </td>

                      {/* Event Name */}
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 font-bold block">{beo.eventName}</strong>
                        <span className="text-[10px] text-purple-700 font-semibold">{beo.eventCategory}</span>
                      </td>

                      {/* Event Type */}
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                          {beo.bookingType}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{beo.contactName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{beo.mobile}</span>
                      </td>

                      {/* Venue */}
                      <td className="py-3 px-4 text-slate-800 font-medium">{beo.venueName}</td>

                      {/* Event Date */}
                      <td className="py-3 px-4 font-mono text-slate-900 font-semibold text-[11px]">{beo.startDate}</td>

                      {/* Pax */}
                      <td className="py-3 px-4 font-mono text-slate-700">{beo.expectedPax} Pax</td>

                      {/* Coordinator */}
                      <td className="py-3 px-4 text-slate-600 text-[11px]">{beo.coordinatorName}</td>

                      {/* BEO Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block",
                            beo.status === "Approved"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : beo.status === "Department Shared"
                              ? "bg-blue-100 text-blue-800 border-blue-200"
                              : beo.status === "Pending Approval"
                              ? "bg-purple-100 text-purple-800 border-purple-200"
                              : beo.status === "Draft"
                              ? "bg-amber-100 text-amber-800 border-amber-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          )}
                        >
                          {beo.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenBEODetail(beo)}
                            className="text-[11px] font-semibold h-7 px-2.5 rounded-lg cursor-pointer"
                          >
                            View
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedBEO(beo);
                              setIsPrintModalOpen(true);
                            }}
                            className="text-[11px] h-7 px-2 rounded-lg text-slate-600 cursor-pointer"
                            title="Print BEO Sheet"
                          >
                            <Printer className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="py-10 text-center text-slate-400 text-xs italic">
                      No Function Sheets found matching your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: CLEAN, STREAMLINED BEO DETAIL & EDIT DRAWER
      ───────────────────────────────────────────────────────────── */}
      {selectedBEO && isEditDrawerOpen && formData && (
        <Drawer
          isOpen={isEditDrawerOpen}
          onClose={() => setIsEditDrawerOpen(false)}
          title={`Function Sheet — ${selectedBEO.beoId} (Version ${selectedBEO.version})`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            {/* 1. CLEAN HEADER SUMMARY CARD */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-purple-900 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                      #{selectedBEO.beoId}
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-500">
                      Booking #{selectedBEO.bookingId} • Version {selectedBEO.version}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{selectedBEO.eventName}</h3>
                  <p className="text-xs text-slate-600">
                    Customer: <strong className="text-slate-900">{selectedBEO.contactName}</strong>{" "}
                    {selectedBEO.companyName ? `(${selectedBEO.companyName})` : ""} • Venue:{" "}
                    <strong className="text-slate-900">{selectedBEO.venueName}</strong>
                  </p>
                </div>

                <span
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold border",
                    selectedBEO.status === "Approved"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                      : selectedBEO.status === "Department Shared"
                      ? "bg-blue-50 text-blue-800 border-blue-300"
                      : selectedBEO.status === "Pending Approval"
                      ? "bg-purple-50 text-purple-800 border-purple-300"
                      : "bg-amber-50 text-amber-800 border-amber-300"
                  )}
                >
                  {selectedBEO.status}
                </span>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Event Date</span>
                  <strong className="text-slate-800 font-mono">{selectedBEO.startDate}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Timing</span>
                  <strong className="text-slate-800">{selectedBEO.startTime} – {selectedBEO.endTime}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Guaranteed Pax</span>
                  <strong className="text-purple-900 font-bold">{selectedBEO.guaranteedPax} Pax</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Coordinator</span>
                  <strong className="text-slate-800 truncate block">{selectedBEO.coordinatorName}</strong>
                </div>
              </div>

              {/* Status Action Buttons Bar */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2.5 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPrintModalOpen(true)}
                  className="text-xs h-7.5 px-3 flex items-center gap-1.5 rounded-lg"
                >
                  <Printer className="h-3.5 w-3.5 text-slate-500" /> Print BEO
                </Button>

                {selectedBEO.status === "Draft" && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSubmitForApproval}
                    className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs h-7.5 px-3.5 flex items-center gap-1.5 rounded-lg shadow-xs"
                  >
                    <Send className="h-3.5 w-3.5" /> Submit for Approval
                  </Button>
                )}

                {selectedBEO.status === "Pending Approval" && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleApproveBEO}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs h-7.5 px-3.5 flex items-center gap-1.5 rounded-lg shadow-xs"
                  >
                    <Check className="h-3.5 w-3.5" /> Approve BEO ✓
                  </Button>
                )}

                {(selectedBEO.status === "Approved" || selectedBEO.status === "Department Shared") && (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsShareModalOpen(true)}
                      className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs h-7.5 px-3.5 flex items-center gap-1.5 rounded-lg shadow-xs"
                    >
                      <Share2 className="h-3.5 w-3.5" /> Share with Departments
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCreateRevision}
                      className="text-purple-800 bg-purple-50/70 border-purple-200 hover:bg-purple-100 text-xs h-7.5 px-3 flex items-center gap-1 rounded-lg"
                    >
                      <Copy className="h-3.5 w-3.5" /> Create Revision (V{selectedBEO.version + 1})
                    </Button>
                  </>
                )}

                {selectedBEO.status === "Department Shared" && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleAdvanceStatus("In Progress")}
                    className="bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs h-7.5 px-3 rounded-lg"
                  >
                    Start Event Execution →
                  </Button>
                )}

                {selectedBEO.status === "In Progress" && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleAdvanceStatus("Completed")}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs h-7.5 px-3.5 flex items-center gap-1 rounded-lg"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Mark Event Completed ✓
                  </Button>
                )}
              </div>
            </div>

            {/* 2. CLEAN 5-TAB SEGMENTED BAR (NO SCROLLBARS) */}
            <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
              {[
                { id: "event_setup", label: "1. Event & Setup", icon: Building2 },
                { id: "fnb", label: "2. Food & Beverage", icon: UtensilsCrossed },
                { id: "av_decor", label: "3. AV & Decor", icon: Sparkles },
                { id: "departments", label: "4. Department Notes", icon: FileCheck },
                { id: "timeline", label: "5. Audit Timeline", icon: Clock },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-center",
                      isActive
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* ─────────────────────────────────────────────────────────────
                3. STREAMLINED EDITABLE SECTIONS
            ───────────────────────────────────────────────────────────── */}
            <form onSubmit={handleSaveBEO} className="space-y-4">
              {/* TAB 1: EVENT DETAILS, CLIENT INFO & SETUP */}
              {activeTab === "event_setup" && (
                <div className="space-y-4">
                  {/* Event & Client Overview Card */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                    <strong className="text-xs font-bold text-slate-900 block border-b border-slate-100 pb-1.5">
                      Event &amp; Client Overview
                    </strong>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">Event Name *</label>
                        <input
                          type="text"
                          value={formData.eventName}
                          onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">Event Category</label>
                        <input
                          type="text"
                          value={formData.eventCategory}
                          onChange={(e) => setFormData({ ...formData, eventCategory: e.target.value })}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">Start Date</label>
                        <input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">End Date</label>
                        <input
                          type="date"
                          value={formData.endDate || formData.startDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">Start Time</label>
                        <input
                          type="text"
                          value={formData.startTime}
                          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">End Time</label>
                        <input
                          type="text"
                          value={formData.endTime}
                          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">Venue Space</label>
                        <input
                          type="text"
                          value={formData.venueName}
                          onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">Expected Pax</label>
                        <input
                          type="number"
                          value={formData.expectedPax}
                          onChange={(e) => setFormData({ ...formData, expectedPax: Number(e.target.value) || 0 })}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">Guaranteed Pax *</label>
                        <input
                          type="number"
                          value={formData.guaranteedPax}
                          onChange={(e) => setFormData({ ...formData, guaranteedPax: Number(e.target.value) || 0 })}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono font-bold text-purple-900 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Customer &amp; Mobile</span>
                        <strong className="text-slate-900 text-xs block">{formData.contactName}</strong>
                        <span className="font-mono text-emerald-800 text-[11px] font-semibold">{formData.mobile}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Company &amp; Email</span>
                        <span className="text-slate-800 text-xs block">{formData.companyName || "Individual Guest"}</span>
                        <span className="text-slate-500 text-[11px]">{formData.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Venue Setup & Layout Card */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                    <strong className="text-xs font-bold text-slate-900 block border-b border-slate-100 pb-1.5">
                      Venue Setup &amp; Seating Layout
                    </strong>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">Seating Layout *</label>
                        <select
                          value={formData.setupLayout}
                          onChange={(e) => setFormData({ ...formData, setupLayout: e.target.value as SetupLayoutType })}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                        >
                          <option value="Round Banquet">Round Banquet</option>
                          <option value="Theatre">Theatre</option>
                          <option value="Classroom">Classroom</option>
                          <option value="Cluster">Cluster</option>
                          <option value="Cocktail">Cocktail</option>
                          <option value="U-Shape">U-Shape</option>
                          <option value="Boardroom">Boardroom</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">Stage Requirements</label>
                        <input
                          type="text"
                          placeholder="e.g. 24ft x 12ft Mandap / Presentation Stage"
                          value={formData.stageRequirement || ""}
                          onChange={(e) => setFormData({ ...formData, stageRequirement: e.target.value })}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.danceFloor}
                          onChange={(e) => setFormData({ ...formData, danceFloor: e.target.checked })}
                          className="rounded text-purple-700 focus:ring-purple-600"
                        />
                        <span className="text-xs font-medium text-slate-800">Dance Floor</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.registrationDesk}
                          onChange={(e) => setFormData({ ...formData, registrationDesk: e.target.checked })}
                          className="rounded text-purple-700 focus:ring-purple-600"
                        />
                        <span className="text-xs font-medium text-slate-800">Registration Desk</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.signageBoard}
                          onChange={(e) => setFormData({ ...formData, signageBoard: e.target.checked })}
                          className="rounded text-purple-700 focus:ring-purple-600"
                        />
                        <span className="text-xs font-medium text-slate-800">Welcome Signage Board</span>
                      </label>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1 text-[11px]">Table Setup Instructions</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Round tables of 10 covers, satin runners, floral centerpieces..."
                        value={formData.tableSetupNotes || ""}
                        onChange={(e) => setFormData({ ...formData, tableSetupNotes: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1 text-[11px]">Seating &amp; Table Numbering Notes</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. VIP Family table in center front; delegates alphabetical by badge..."
                        value={formData.seatingNotes || ""}
                        onChange={(e) => setFormData({ ...formData, seatingNotes: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: FOOD & BEVERAGE */}
              {activeTab === "fnb" && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5">
                  <strong className="text-xs font-bold text-slate-900 block border-b border-slate-100 pb-1.5">
                    Food &amp; Beverage (Catering Plan)
                  </strong>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5 text-[11px]">Meal Service Types</label>
                    <div className="flex flex-wrap gap-2">
                      {["Breakfast", "Lunch", "Dinner", "Snacks", "High Tea", "Cocktail"].map((meal) => {
                        const isChecked = formData.mealServiceTypes.includes(meal);
                        return (
                          <label
                            key={meal}
                            className={cn(
                              "px-3 py-1 rounded-lg border text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition",
                              isChecked
                                ? "bg-purple-50 text-purple-900 border-purple-300 ring-1 ring-purple-300"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({ ...formData, mealServiceTypes: [...formData.mealServiceTypes, meal] });
                                } else {
                                  setFormData({
                                    ...formData,
                                    mealServiceTypes: formData.mealServiceTypes.filter((m) => m !== meal),
                                  });
                                }
                              }}
                              className="rounded text-purple-700 focus:ring-purple-600 h-3.5 w-3.5"
                            />
                            {meal}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[11px]">Menu Selection / Buffet Plan</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Royal Indian Buffet (4 Starters, 8 Main Courses, Live Chaat Counter, Desserts)..."
                      value={formData.menuSelection}
                      onChange={(e) => setFormData({ ...formData, menuSelection: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[11px]">Special Dietary Requirements (Jain / Vegan / Allergies)</label>
                    <input
                      type="text"
                      placeholder="e.g. 30 Pure Jain Meals, 10 Vegan, Nut Allergy alerts..."
                      value={formData.dietaryRequirements || ""}
                      onChange={(e) => setFormData({ ...formData, dietaryRequirements: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[11px]">Special F&amp;B Notes</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Live counter timing sharp 08:00 PM; hot food refills maintained..."
                      value={formData.fbNotes || ""}
                      onChange={(e) => setFormData({ ...formData, fbNotes: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: AV & DECORATION */}
              {activeTab === "av_decor" && (
                <div className="space-y-4">
                  {/* AV Card */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                    <strong className="text-xs font-bold text-slate-900 block border-b border-slate-100 pb-1.5">
                      Audio-Visual &amp; Technical Requirements
                    </strong>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">Microphones Detail</label>
                        <input
                          type="text"
                          placeholder="e.g. 4 Cordless Handheld + 2 Lapel Mics"
                          value={formData.microphonesNotes || ""}
                          onChange={(e) => setFormData({ ...formData, microphonesNotes: e.target.value })}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">Lighting Detail</label>
                        <input
                          type="text"
                          placeholder="e.g. Spotlights + Warm Mood Dimming"
                          value={formData.lightingNotes || ""}
                          onChange={(e) => setFormData({ ...formData, lightingNotes: e.target.value })}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1 text-[11px]">Other AV &amp; IT Instructions</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Sound test at 04:30 PM; dedicated sound technician on console..."
                        value={formData.avNotes || ""}
                        onChange={(e) => setFormData({ ...formData, avNotes: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                      />
                    </div>
                  </div>

                  {/* Decoration Card */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                    <strong className="text-xs font-bold text-slate-900 block border-b border-slate-100 pb-1.5">
                      Decoration, Theme &amp; Floral Setup
                    </strong>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">Event Theme</label>
                        <input
                          type="text"
                          placeholder="e.g. Royal Marigold & Gold Velvet Luxury"
                          value={formData.theme}
                          onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">Stage Decoration</label>
                        <input
                          type="text"
                          placeholder="e.g. Mandap Floral Pillars & Royal Sofa"
                          value={formData.stageDecoration || ""}
                          onChange={(e) => setFormData({ ...formData, stageDecoration: e.target.value })}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">Floral Arrangements</label>
                        <input
                          type="text"
                          placeholder="e.g. Yellow Marigold Canopy & Rose Pillars"
                          value={formData.floralSetup}
                          onChange={(e) => setFormData({ ...formData, floralSetup: e.target.value })}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">Table Centerpieces</label>
                        <input
                          type="text"
                          placeholder="e.g. Crystal Glass Candelabras"
                          value={formData.tableDecoration}
                          onChange={(e) => setFormData({ ...formData, tableDecoration: e.target.value })}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: DEPARTMENT INSTRUCTIONS & SPECIAL NOTES */}
              {activeTab === "departments" && (
                <div className="space-y-4">
                  {/* Department Notes Card */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                    <strong className="text-xs font-bold text-slate-900 block border-b border-slate-100 pb-1.5">
                      Department-Specific Instructions
                    </strong>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">Banquet Operations</label>
                        <textarea
                          rows={2}
                          value={formData.banquetNotes || ""}
                          onChange={(e) => setFormData({ ...formData, banquetNotes: e.target.value })}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">Kitchen / Chef</label>
                        <textarea
                          rows={2}
                          value={formData.kitchenNotes || ""}
                          onChange={(e) => setFormData({ ...formData, kitchenNotes: e.target.value })}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">Food &amp; Beverage / Bar</label>
                        <textarea
                          rows={2}
                          value={formData.fnbNotes || ""}
                          onChange={(e) => setFormData({ ...formData, fnbNotes: e.target.value })}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">Housekeeping</label>
                        <textarea
                          rows={2}
                          value={formData.housekeepingNotes || ""}
                          onChange={(e) => setFormData({ ...formData, housekeepingNotes: e.target.value })}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">Engineering / Power / AC</label>
                        <textarea
                          rows={2}
                          value={formData.engineeringNotes || ""}
                          onChange={(e) => setFormData({ ...formData, engineeringNotes: e.target.value })}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">AV / IT Desk</label>
                        <textarea
                          rows={2}
                          value={formData.avitNotes || ""}
                          onChange={(e) => setFormData({ ...formData, avitNotes: e.target.value })}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">Security &amp; Valet Parking</label>
                        <textarea
                          rows={2}
                          value={formData.securityNotes || ""}
                          onChange={(e) => setFormData({ ...formData, securityNotes: e.target.value })}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">Front Office / Reception</label>
                        <textarea
                          rows={2}
                          value={formData.frontOfficeNotes || ""}
                          onChange={(e) => setFormData({ ...formData, frontOfficeNotes: e.target.value })}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Special Instructions Card */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                    <strong className="text-xs font-bold text-slate-900 block border-b border-slate-100 pb-1.5">
                      VIP Requirements &amp; Operational Alerts
                    </strong>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1 text-[11px]">VIP Guest Notes</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Cabinet Minister attending at 08:30 PM; escort through VIP portico..."
                        value={formData.vipNotes || ""}
                        onChange={(e) => setFormData({ ...formData, vipNotes: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1 text-[11px]">Customer Special Requests</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Wheelchair assistance at main porch for grandparents..."
                        value={formData.customerSpecialRequests || ""}
                        onChange={(e) => setFormData({ ...formData, customerSpecialRequests: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1 text-[11px]">Operational &amp; Safety Alerts</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. No pyrotechnics allowed indoors; cold sparklers approved for stage only..."
                        value={formData.operationalAlerts || ""}
                        onChange={(e) => setFormData({ ...formData, operationalAlerts: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: TIMELINE AUDIT */}
              {activeTab === "timeline" && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <strong className="text-xs font-bold text-slate-900 block border-b border-slate-100 pb-1.5">
                    BEO Chronological Event Audit Log
                  </strong>
                  <div className="space-y-2 pt-1">
                    {formData.timeline.map((entry) => (
                      <div key={entry.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-[11px] space-y-0.5">
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

              {/* Drawer Footer Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditDrawerOpen(false)}
                  className="rounded-lg text-xs"
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs px-5 shadow-xs cursor-pointer"
                >
                  Save BEO Updates ✓
                </Button>
              </div>
            </form>
          </div>
        </Drawer>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 5: SHARE WITH DEPARTMENTS MODAL
      ───────────────────────────────────────────────────────────── */}
      {isShareModalOpen && selectedBEO && (
        <Modal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          title={`Share BEO #${selectedBEO.beoId} with Operational Departments`}
          maxWidth="sm"
        >
          <div className="space-y-3.5 p-1 text-xs">
            <p className="text-slate-600">
              Select which operational teams should receive the approved function sheet for execution.
            </p>

            <div className="space-y-2">
              {[
                { name: "Banquet", desc: "Table setup, service captains, staffing" },
                { name: "Kitchen", desc: "Chef buffet & live counter production" },
                { name: "Food & Beverage", desc: "Beverages, bar counters & cutlery" },
                { name: "Housekeeping", desc: "Restrooms, linen & venue cleaning" },
                { name: "Engineering", desc: "AC control, backup generator, lighting" },
                { name: "AV / IT", desc: "Sound console, mics, LED wall display" },
                { name: "Security", desc: "Valet parking & VIP guest escort" },
                { name: "Front Office", desc: "Guest check-in & keycards" },
                { name: "Accounts", desc: "Billing & balance settlement" },
              ].map((dept) => {
                const isChecked = shareDepartments.includes(dept.name);
                return (
                  <label
                    key={dept.name}
                    className={cn(
                      "flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition",
                      isChecked ? "bg-purple-50/80 border-purple-300 ring-1 ring-purple-300" : "bg-white border-slate-200"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setShareDepartments([...shareDepartments, dept.name]);
                        } else {
                          setShareDepartments(shareDepartments.filter((d) => d !== dept.name));
                        }
                      }}
                      className="mt-0.5 rounded text-purple-700 focus:ring-purple-600"
                    />
                    <div>
                      <strong className="text-xs font-bold text-slate-900 block">{dept.name}</strong>
                      <span className="text-[11px] text-slate-500">{dept.desc}</span>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsShareModalOpen(false)}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmDepartmentShare}
                disabled={shareDepartments.length === 0}
                className="bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg text-xs px-4"
              >
                Confirm Dispatch ({shareDepartments.length} Depts) ✓
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 6: PRINT / EXPORT BEO FUNCTION SHEET MODAL
      ───────────────────────────────────────────────────────────── */}
      {isPrintModalOpen && selectedBEO && (
        <Modal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          title={`Print Function Sheet — #${selectedBEO.beoId} (V${selectedBEO.version})`}
          maxWidth="2xl"
        >
          <div className="space-y-4 p-1 text-xs">
            {/* Printable Document Sheet Container */}
            <div className="border border-slate-300 rounded-xl p-5 bg-white space-y-4 font-sans text-slate-900 shadow-sm print:border-none print:p-0">
              {/* Hotel Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Grand Heritage Hotel &amp; Resorts</h2>
                  <p className="text-[11px] text-slate-500">Banquet Event Order / Operational Function Sheet</p>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="font-bold text-sm text-purple-900 block">{selectedBEO.beoId} (V{selectedBEO.version})</span>
                  <span className="text-slate-600 block">Booking: #{selectedBEO.bookingId}</span>
                  <span className="font-semibold text-emerald-800 uppercase text-[10px]">{selectedBEO.status}</span>
                </div>
              </div>

              {/* Event & Client Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[10px]">Event Name</span>
                  <strong className="text-slate-900">{selectedBEO.eventName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Client / Host</span>
                  <strong className="text-slate-900">{selectedBEO.contactName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Venue / Space</span>
                  <strong className="text-slate-900">{selectedBEO.venueName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Date &amp; Time</span>
                  <span className="font-mono">{selectedBEO.startDate} ({selectedBEO.startTime}–{selectedBEO.endTime})</span>
                </div>
              </div>

              {/* Section C: Venue Setup & Layout */}
              <div className="space-y-1">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-950 border-b border-purple-200 pb-0.5">
                  1. Venue Setup &amp; Seating Layout
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>Layout: <strong>{selectedBEO.setupLayout}</strong></div>
                  <div>Guaranteed Pax: <strong>{selectedBEO.guaranteedPax} Pax</strong></div>
                  <div>Stage: <span>{selectedBEO.stageRequirement || "Standard"}</span></div>
                  <div>Dance Floor: <span>{selectedBEO.danceFloor ? "Yes" : "No"}</span></div>
                </div>
                {selectedBEO.seatingNotes && (
                  <p className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">
                    {selectedBEO.seatingNotes}
                  </p>
                )}
              </div>

              {/* Section D: F&B Menu Plan */}
              <div className="space-y-1">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-950 border-b border-purple-200 pb-0.5">
                  2. Food &amp; Beverage (Catering Plan)
                </h4>
                <div className="text-[11px] space-y-1">
                  <div>Service: <strong>{selectedBEO.mealServiceTypes.join(", ")}</strong></div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-100 font-medium">
                    {selectedBEO.menuSelection}
                  </div>
                  {selectedBEO.dietaryRequirements && (
                    <div className="text-amber-900 font-semibold">
                      Dietary: {selectedBEO.dietaryRequirements}
                    </div>
                  )}
                </div>
              </div>

              {/* Section E & F: AV & Decoration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-950 border-b border-purple-200 pb-0.5">
                    3. AV &amp; Sound Requirements
                  </h4>
                  <p className="text-[11px] text-slate-700">{selectedBEO.avNotes || "Standard PA Sound System with 2 Mics"}</p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-950 border-b border-purple-200 pb-0.5">
                    4. Theme &amp; Decoration
                  </h4>
                  <p className="text-[11px] text-slate-700">{selectedBEO.theme} • {selectedBEO.floralSetup}</p>
                </div>
              </div>

              {/* Sign-off signatures */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-300 text-center text-[10px] text-slate-600">
                <div className="border-t border-slate-400 pt-1">Event Coordinator Signature</div>
                <div className="border-t border-slate-400 pt-1">Banquet Manager Signature</div>
                <div className="border-t border-slate-400 pt-1">Host / Client Acknowledgment</div>
              </div>
            </div>

            {/* Print Dialog Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPrintModalOpen(false)}
                className="rounded-lg text-xs"
              >
                Close
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => window.print()}
                className="bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg text-xs px-4 flex items-center gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" /> Print Now
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </ModulePageShell>
  );
}
