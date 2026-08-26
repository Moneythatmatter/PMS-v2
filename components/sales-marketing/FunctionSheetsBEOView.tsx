"use client";

import React, { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  Calendar,
  Sparkles,
  Users,
  Search,
  SlidersHorizontal,
  Plus,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  UtensilsCrossed,
  Music,
  Bed,
  Phone,
  Mail,
  User,
  X,
  FileText,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Check,
  Edit2,
  Eye,
  Printer,
  Send,
  Wrench,
  Download,
  CheckSquare,
  History,
  Info,
  Package,
  Tv,
  Volume2,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, StatusBadge } from "@/components/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// TYPES & SCHEMAS FOR TABBED ENTERPRISE BEO OPERATIONAL DRAWER
// ─────────────────────────────────────────────────────────────

export type BEOStatus = "Draft" | "Submitted" | "Approved" | "Dispatched" | "Completed";
export type BEOTab = "event" | "fb" | "venue" | "rooms" | "dispatch" | "notes";

export interface BEOItem {
  id: string;
  beoNumber: string; // e.g. BEO-2026-001
  bookingCode: string; // e.g. EVT-001 / BKT-2026-001
  
  // Tab 1 — Event Information (Auto-filled Read-Only from Booking)
  eventName: string;
  clientName: string;
  venueHall: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  expectedPax: number;
  salesExecutive: string;
  coordinatorName: string;
  status: BEOStatus;

  // Tab 2 — Food & Beverage Plan
  mealSessions: {
    breakfast: boolean;
    lunch: boolean;
    highTea: boolean;
    dinner: boolean;
  };
  vegMenu?: string;
  nonVegMenu?: string;
  dessertMenu?: string;
  beveragePlan?: string;
  jainMealsCount: number;
  kidsMealsCount: number;
  veganMealsCount: number;
  specialDietaryNotes?: string;

  // Tab 3 — Venue Setup
  seatingLayout: "Banquet" | "Theatre" | "Classroom" | "U Shape" | "Cluster";
  stageRequired: boolean;
  danceFloor: boolean;
  djRequired: boolean;
  ledWall: boolean;
  soundSystem: boolean;
  projector: boolean;
  stageDetails?: string;
  decorationTheme?: string;
  decorationNotes?: string;
  avNotes?: string;
  specialSetupInstructions?: string;

  // Tab 4 — Accommodation
  roomsRequired: number; // Read-only from booking
  vipRooms: number;
  guestNotes?: string;
  roomingInstructions?: string;

  // Tab 5 — Department Dispatch
  dispatchKitchenStatus: "Pending" | "In Progress" | "Completed";
  dispatchHousekeepingStatus: "Pending" | "In Progress" | "Completed";
  dispatchFrontOfficeStatus: "Pending" | "In Progress" | "Completed";
  dispatchEngineeringStatus: "Pending" | "In Progress" | "Completed";
  dispatchPurchaseStatus: "Pending" | "In Progress" | "Completed";
  dispatchAccountsStatus: "Pending" | "In Progress" | "Completed";

  // Tab 6 — Notes & Approval
  specialInstructions?: string;
  internalNotes?: string;

  createdDate: string;
}

// ─────────────────────────────────────────────────────────────
// INITIAL MOCK BEOS AUTO-POPULATED FROM CONFIRMED BOOKINGS
// ─────────────────────────────────────────────────────────────

export const INITIAL_BEOS: BEOItem[] = [
  {
    id: "BEO-101",
    beoNumber: "BEO-2026-001",
    bookingCode: "EVT-001",
    eventName: "Sharma Wedding Reception",
    clientName: "Sharma Family (Rahul Sharma)",
    venueHall: "Grand Ballroom & Royal Lawn",
    eventDate: "2027-01-15",
    startTime: "18:00",
    endTime: "23:30",
    expectedPax: 500,
    salesExecutive: "Jay Kumar",
    coordinatorName: "Banquet Manager (Rohan Varma)",
    status: "Dispatched",

    mealSessions: {
      breakfast: false,
      lunch: false,
      highTea: true,
      dinner: true,
    },
    vegMenu: "Paneer Butter Masala, Dal Makhani Gold, Subz Handi Dum, Live Naan Counter",
    nonVegMenu: "Butter Chicken, Mutton Rogan Josh, Hyderabadi Biryani",
    dessertMenu: "Gulab Jamun with Rabri, Moong Dal Halwa, Ice Cream Bar",
    beveragePlan: "Tropical Mocktails & Masala Chai Counter",
    jainMealsCount: 40,
    kidsMealsCount: 15,
    veganMealsCount: 5,
    specialDietaryNotes: "No onion garlic counter for Jain guests",

    seatingLayout: "Banquet",
    stageRequired: true,
    danceFloor: true,
    djRequired: true,
    ledWall: true,
    soundSystem: true,
    projector: false,
    stageDetails: "24 x 16 ft stage required. Center stage with floral backdrop.",
    decorationTheme: "Royal Wedding Theme",
    decorationNotes: "White flowers, warm lighting, entrance arch, VIP table decoration",
    avNotes: "2 cordless microphones, 1 podium mic, LED wall behind stage",
    specialSetupInstructions: "Bride arrival at 7 PM from west gate. VIP seating near stage. Separate media area.",

    roomsRequired: 20,
    vipRooms: 2,
    guestNotes: "Bride family on 4th floor",
    roomingInstructions: "Early check-in at 12 PM requested for VIP Suites.",

    dispatchKitchenStatus: "In Progress",
    dispatchHousekeepingStatus: "In Progress",
    dispatchFrontOfficeStatus: "Completed",
    dispatchEngineeringStatus: "Completed",
    dispatchPurchaseStatus: "Completed",
    dispatchAccountsStatus: "Completed",

    specialInstructions: "Bride arrival at 7 PM. VIP seating near stage.",
    internalNotes: "Client paid ₹50,000 advance. Final settlement post event.",
    createdDate: "10 Jan 2027",
  },
  {
    id: "BEO-102",
    beoNumber: "BEO-2026-002",
    bookingCode: "EVT-002",
    eventName: "TCS Global Tech Summit 2026",
    clientName: "TCS India",
    venueHall: "Chamber Ballroom A",
    eventDate: "2026-09-18",
    startTime: "09:00",
    endTime: "15:30",
    expectedPax: 150,
    salesExecutive: "Jay Kumar",
    coordinatorName: "Amitabh Sen (Banquet Coordinator)",
    status: "Approved",

    mealSessions: {
      breakfast: true,
      lunch: true,
      highTea: true,
      dinner: false,
    },
    vegMenu: "Penne Arrabbiata, Exotic Stir Fry Veg, Garlic Rice",
    nonVegMenu: "Grilled Chicken in Mushroom Sauce",
    dessertMenu: "Tiramisu Cups & Fresh Fruit Gateau",
    beveragePlan: "Espresso Coffee & Gourmet Danish High Tea",
    jainMealsCount: 10,
    kidsMealsCount: 0,
    veganMealsCount: 8,
    specialDietaryNotes: "Allergen labels required for gluten-free & vegan options",

    seatingLayout: "Classroom",
    stageRequired: true,
    danceFloor: false,
    djRequired: false,
    ledWall: false,
    soundSystem: true,
    projector: true,
    stageDetails: "Podium with TCS Logo Backdrop",
    decorationTheme: "Corporate Blue Theme",
    decorationNotes: "Notepads & pens on all tables, corporate banner backdrop",
    avNotes: "2 lapel mics, HD projector & presentation clicker",
    specialSetupInstructions: "Registration desk outside Chamber Ballroom A at 8:30 AM",

    roomsRequired: 10,
    vipRooms: 2,
    guestNotes: "Keynote speakers in Executive Suites",
    roomingInstructions: "Welcome kit in all 10 delegates rooms.",

    dispatchKitchenStatus: "In Progress",
    dispatchHousekeepingStatus: "In Progress",
    dispatchFrontOfficeStatus: "Completed",
    dispatchEngineeringStatus: "Completed",
    dispatchPurchaseStatus: "Pending",
    dispatchAccountsStatus: "Completed",

    specialInstructions: "Morning espresso high tea at 8:30 AM. Keynote speeches from 10 AM.",
    internalNotes: "100% corporate billing contract signed.",
    createdDate: "13 Sep 2026",
  },
  {
    id: "BEO-103",
    beoNumber: "BEO-2026-003",
    bookingCode: "EVT-003",
    eventName: "Ananya Birthday Gala",
    clientName: "Vikram Kapoor",
    venueHall: "Poolside Pavilion",
    eventDate: "2026-09-22",
    startTime: "18:00",
    endTime: "23:00",
    expectedPax: 100,
    salesExecutive: "Sneha Kapadia",
    coordinatorName: "Banquet Manager",
    status: "Draft",

    mealSessions: {
      breakfast: false,
      lunch: false,
      highTea: false,
      dinner: true,
    },
    vegMenu: "Live Pizza Station, Paneer Tikka, Veg Biryani",
    nonVegMenu: "Chicken Satay, Mutton Seekh",
    dessertMenu: "Custom Chocolate Fountain & Ice Cream",
    beveragePlan: "Mocktail Bar & Sodas",
    jainMealsCount: 15,
    kidsMealsCount: 20,
    veganMealsCount: 0,
    specialDietaryNotes: "Kids friendly food counter",

    seatingLayout: "Cluster",
    stageRequired: false,
    danceFloor: true,
    djRequired: true,
    ledWall: false,
    soundSystem: true,
    projector: false,
    stageDetails: "",
    decorationTheme: "Casual Party Theme",
    decorationNotes: "Poolside fairy lights & high tables",
    avNotes: "DJ console & high bass sound setup",
    specialSetupInstructions: "Cake cutting at 9 PM by poolside",

    roomsRequired: 0,
    vipRooms: 0,

    dispatchKitchenStatus: "Pending",
    dispatchHousekeepingStatus: "Pending",
    dispatchFrontOfficeStatus: "Pending",
    dispatchEngineeringStatus: "Pending",
    dispatchPurchaseStatus: "Pending",
    dispatchAccountsStatus: "Pending",

    specialInstructions: "Cake cutting at 9 PM by poolside.",
    internalNotes: "Draft initial setup.",
    createdDate: "15 Sep 2026",
  },
];

export function FunctionSheetsBEOView() {
  const [beos, setBeos] = useState<BEOItem[]>(INITIAL_BEOS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // BEO Drawer State & Active Tab Selection
  const [selectedBEO, setSelectedBEO] = useState<BEOItem | null>(null);
  const [activeTab, setActiveTab] = useState<BEOTab>("event");
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // TAB 2 FORM STATE: FOOD & BEVERAGE
  const [formMealBreakfast, setFormMealBreakfast] = useState(false);
  const [formMealLunch, setFormMealLunch] = useState(false);
  const [formMealHighTea, setFormMealHighTea] = useState(false);
  const [formMealDinner, setFormMealDinner] = useState(true);
  const [formVegMenu, setFormVegMenu] = useState("");
  const [formNonVegMenu, setFormNonVegMenu] = useState("");
  const [formDessertMenu, setFormDessertMenu] = useState("");
  const [formBeveragePlan, setFormBeveragePlan] = useState("");
  const [formJainMealsCount, setFormJainMealsCount] = useState<string>("0");
  const [formKidsMealsCount, setFormKidsMealsCount] = useState<string>("0");
  const [formVeganMealsCount, setFormVeganMealsCount] = useState<string>("0");
  const [formSpecialDietaryNotes, setFormSpecialDietaryNotes] = useState("");

  // TAB 3 FORM STATE: VENUE SETUP
  const [formSeatingLayout, setFormSeatingLayout] = useState<"Banquet" | "Theatre" | "Classroom" | "U Shape" | "Cluster">("Banquet");
  const [formStageRequired, setFormStageRequired] = useState(false);
  const [formDanceFloor, setFormDanceFloor] = useState(false);
  const [formDjRequired, setFormDjRequired] = useState(false);
  const [formLedWall, setFormLedWall] = useState(false);
  const [formSoundSystem, setFormSoundSystem] = useState(true);
  const [formProjector, setFormProjector] = useState(false);
  const [formStageDetails, setFormStageDetails] = useState("");
  const [formDecorationTheme, setFormDecorationTheme] = useState("");
  const [formDecorationNotes, setFormDecorationNotes] = useState("");
  const [formAvNotes, setFormAvNotes] = useState("");
  const [formSpecialSetupInstructions, setFormSpecialSetupInstructions] = useState("");

  // TAB 4 FORM STATE: ACCOMMODATION
  const [formVipRooms, setFormVipRooms] = useState<string>("0");
  const [formGuestNotes, setFormGuestNotes] = useState("");
  const [formRoomingInstructions, setFormRoomingInstructions] = useState("");

  // TAB 5 FORM STATE: DEPARTMENT DISPATCH
  const [formDispatchKitchenStatus, setFormDispatchKitchenStatus] = useState<"Pending" | "In Progress" | "Completed">("Pending");
  const [formDispatchHousekeepingStatus, setFormDispatchHousekeepingStatus] = useState<"Pending" | "In Progress" | "Completed">("Pending");
  const [formDispatchFrontOfficeStatus, setFormDispatchFrontOfficeStatus] = useState<"Pending" | "In Progress" | "Completed">("Pending");
  const [formDispatchEngineeringStatus, setFormDispatchEngineeringStatus] = useState<"Pending" | "In Progress" | "Completed">("Pending");
  const [formDispatchPurchaseStatus, setFormDispatchPurchaseStatus] = useState<"Pending" | "In Progress" | "Completed">("Pending");
  const [formDispatchAccountsStatus, setFormDispatchAccountsStatus] = useState<"Pending" | "In Progress" | "Completed">("Pending");

  // TAB 6 FORM STATE: NOTES & APPROVAL
  const [formSpecialInstructions, setFormSpecialInstructions] = useState("");
  const [formInternalNotes, setFormInternalNotes] = useState("");
  const [formStatus, setFormStatus] = useState<BEOStatus>("Draft");

  // Open Drawer & Populate All Tab States
  const handleOpenBEODrawer = (beo: BEOItem) => {
    setSelectedBEO(beo);
    setActiveTab("event");

    // Tab 2
    setFormMealBreakfast(beo.mealSessions.breakfast);
    setFormMealLunch(beo.mealSessions.lunch);
    setFormMealHighTea(beo.mealSessions.highTea);
    setFormMealDinner(beo.mealSessions.dinner);
    setFormVegMenu(beo.vegMenu || "");
    setFormNonVegMenu(beo.nonVegMenu || "");
    setFormDessertMenu(beo.dessertMenu || "");
    setFormBeveragePlan(beo.beveragePlan || "");
    setFormJainMealsCount(String(beo.jainMealsCount || 0));
    setFormKidsMealsCount(String(beo.kidsMealsCount || 0));
    setFormVeganMealsCount(String(beo.veganMealsCount || 0));
    setFormSpecialDietaryNotes(beo.specialDietaryNotes || "");

    // Tab 3
    setFormSeatingLayout(beo.seatingLayout || "Banquet");
    setFormStageRequired(beo.stageRequired);
    setFormDanceFloor(beo.danceFloor);
    setFormDjRequired(beo.djRequired);
    setFormLedWall(beo.ledWall);
    setFormSoundSystem(beo.soundSystem);
    setFormProjector(beo.projector);
    setFormStageDetails(beo.stageDetails || "");
    setFormDecorationTheme(beo.decorationTheme || "");
    setFormDecorationNotes(beo.decorationNotes || "");
    setFormAvNotes(beo.avNotes || "");
    setFormSpecialSetupInstructions(beo.specialSetupInstructions || "");

    // Tab 4
    setFormVipRooms(String(beo.vipRooms || 0));
    setFormGuestNotes(beo.guestNotes || "");
    setFormRoomingInstructions(beo.roomingInstructions || "");

    // Tab 5
    setFormDispatchKitchenStatus(beo.dispatchKitchenStatus);
    setFormDispatchHousekeepingStatus(beo.dispatchHousekeepingStatus);
    setFormDispatchFrontOfficeStatus(beo.dispatchFrontOfficeStatus);
    setFormDispatchEngineeringStatus(beo.dispatchEngineeringStatus);
    setFormDispatchPurchaseStatus(beo.dispatchPurchaseStatus);
    setFormDispatchAccountsStatus(beo.dispatchAccountsStatus);

    // Tab 6
    setFormSpecialInstructions(beo.specialInstructions || "");
    setFormInternalNotes(beo.internalNotes || "");
    setFormStatus(beo.status);
  };

  // Save BEO Tabbed Form
  const handleSaveBEO = (targetStatus?: BEOStatus) => {
    if (!selectedBEO) return;

    const finalStatus = targetStatus || formStatus;

    const updatedBEO: BEOItem = {
      ...selectedBEO,

      // Tab 2
      mealSessions: {
        breakfast: formMealBreakfast,
        lunch: formMealLunch,
        highTea: formMealHighTea,
        dinner: formMealDinner,
      },
      vegMenu: formVegMenu || undefined,
      nonVegMenu: formNonVegMenu || undefined,
      dessertMenu: formDessertMenu || undefined,
      beveragePlan: formBeveragePlan || undefined,
      jainMealsCount: Number(formJainMealsCount) || 0,
      kidsMealsCount: Number(formKidsMealsCount) || 0,
      veganMealsCount: Number(formVeganMealsCount) || 0,
      specialDietaryNotes: formSpecialDietaryNotes || undefined,

      // Tab 3
      seatingLayout: formSeatingLayout,
      stageRequired: formStageRequired,
      danceFloor: formDanceFloor,
      djRequired: formDjRequired,
      ledWall: formLedWall,
      soundSystem: formSoundSystem,
      projector: formProjector,
      stageDetails: formStageDetails || undefined,
      decorationTheme: formDecorationTheme || undefined,
      decorationNotes: formDecorationNotes || undefined,
      avNotes: formAvNotes || undefined,
      specialSetupInstructions: formSpecialSetupInstructions || undefined,

      // Tab 4
      vipRooms: Number(formVipRooms) || 0,
      guestNotes: formGuestNotes || undefined,
      roomingInstructions: formRoomingInstructions || undefined,

      // Tab 5
      dispatchKitchenStatus: formDispatchKitchenStatus,
      dispatchHousekeepingStatus: formDispatchHousekeepingStatus,
      dispatchFrontOfficeStatus: formDispatchFrontOfficeStatus,
      dispatchEngineeringStatus: formDispatchEngineeringStatus,
      dispatchPurchaseStatus: formDispatchPurchaseStatus,
      dispatchAccountsStatus: formDispatchAccountsStatus,

      // Tab 6
      specialInstructions: formSpecialInstructions || undefined,
      internalNotes: formInternalNotes || undefined,
      status: finalStatus,
    };

    setBeos((prev) => prev.map((b) => (b.id === selectedBEO.id ? updatedBEO : b)));
    setSelectedBEO(updatedBEO);
    setToastMessage(`Saved BEO specifications for "${selectedBEO.beoNumber}" (${finalStatus}).`);
  };

  // Top KPI Metrics
  const stats = useMemo(() => {
    const total = beos.length;
    const draft = beos.filter((b) => b.status === "Draft").length;
    const approved = beos.filter((b) => b.status === "Approved").length;
    const dispatched = beos.filter((b) => b.status === "Dispatched").length;
    const completed = beos.filter((b) => b.status === "Completed").length;
    const totalPax = beos.reduce((sum, b) => sum + b.expectedPax, 0);

    return { total, draft, approved, dispatched, completed, totalPax };
  }, [beos]);

  // Filtered BEO Grid
  const filteredBEOS = useMemo(() => {
    return beos.filter((b) => {
      const matchSearch =
        b.beoNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.bookingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.venueHall.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = selectedStatus === "ALL" || b.status === selectedStatus;

      return matchSearch && matchStatus;
    });
  }, [beos, searchTerm, selectedStatus]);

  return (
    <ModulePageShell
      eyebrow="Sales & Marketing Management"
      title="Function Sheets (BEO)"
      description="Enterprise tabbed command center for Banquet Event Orders (BEO) auto-created from confirmed bookings."
      breadcrumbs={[
        { label: "Sales & Marketing", href: "/sales-marketing/dashboard" },
        { label: "Banquets & Events" },
        { label: "Function Sheets (BEO)" },
      ]}
      actionButtons={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => setToastMessage("BEO sheets auto-populate when bookings are created.")}
            className="rounded-full text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm flex items-center gap-1.5 px-4 cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" /> BEO Execution Center
          </Button>
        </div>
      }
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
    >
      {/* 1. TOP SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5 mb-5">
        <HRKPICard
          label="Total BEOs"
          value={`${stats.total}`}
          subtitle="Auto-created BEOs"
          tone="emerald"
          icon={<FileSpreadsheet className="h-4 w-4" />}
        />
        <HRKPICard
          label="Draft"
          value={`${stats.draft}`}
          subtitle="In Planning"
          tone="purple"
          icon={<Clock className="h-4 w-4" />}
        />
        <HRKPICard
          label="Approved"
          value={`${stats.approved}`}
          subtitle="Signed Off"
          tone="blue"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <HRKPICard
          label="Dispatched"
          value={`${stats.dispatched}`}
          subtitle="Departments Notified"
          tone="emerald"
          icon={<Send className="h-4 w-4" />}
        />
        <HRKPICard
          label="Completed"
          value={`${stats.completed}`}
          subtitle="Executed Events"
          tone="emerald"
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <HRKPICard
          label="Total Pax"
          value={`${stats.totalPax.toLocaleString()}`}
          subtitle="Catering Guests"
          tone="amber"
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs mb-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by BEO number, booking ID, event name, client, or hall..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-8 py-2 text-xs rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white font-medium text-slate-800 shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="rounded-full border-slate-200 text-xs font-bold gap-1.5 hidden md:inline-flex bg-white text-slate-700 hover:bg-slate-50 cursor-pointer px-4 shadow-2xs"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-700" />
              <span>Filters</span>
            </Button>
          </div>
        </div>

        {showFilterPanel && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in-50">
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs rounded-full border border-slate-200 py-1.5 px-3 bg-slate-50 font-bold text-slate-800"
              >
                <option value="ALL">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted</option>
                <option value="Approved">Approved</option>
                <option value="Dispatched">Dispatched</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedStatus("ALL");
              }}
              className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* 2. BEO MANAGEMENT GRID TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-3.5 px-4">BEO Number</th>
                <th className="py-3.5 px-4">Booking ID</th>
                <th className="py-3.5 px-4">Event Name</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Venue</th>
                <th className="py-3.5 px-4">Event Date</th>
                <th className="py-3.5 px-4">Pax Count</th>
                <th className="py-3.5 px-4">Sales Executive</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBEOS.length > 0 ? (
                filteredBEOS.map((beo) => (
                  <tr
                    key={beo.id}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                    onClick={() => handleOpenBEODrawer(beo)}
                  >
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 font-mono">
                      {beo.beoNumber}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">
                      {beo.bookingCode}
                    </td>

                    <td className="py-3.5 px-4 font-extrabold text-slate-900">
                      {beo.eventName}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {beo.clientName}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {beo.venueHall}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[10px] text-slate-600 font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                        {new Date(beo.eventDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {beo.expectedPax} Pax
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {beo.salesExecutive}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={beo.status} />
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenBEODrawer(beo)}
                          className="h-7 px-2.5 rounded-lg text-xs font-bold text-slate-700 hover:text-emerald-800 hover:bg-emerald-50 border-slate-200 cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="h-3.5 w-3.5 text-emerald-700" /> View BEO
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBEO(beo);
                            setIsPrintModalOpen(true);
                          }}
                          className="h-7 px-2.5 rounded-lg text-xs font-bold text-slate-700 hover:text-emerald-800 hover:bg-emerald-50 border-slate-200 cursor-pointer flex items-center gap-1"
                        >
                          <Printer className="h-3.5 w-3.5 text-emerald-700" /> Print
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500 text-xs">
                    No Function Sheets (BEO) found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3 & 4. ENTERPRISE TABBED BEO DRAWER COMMAND CENTER */}
      <Drawer
        isOpen={Boolean(selectedBEO)}
        onClose={() => setSelectedBEO(null)}
        title={`BEO Command Center - ${selectedBEO?.beoNumber}`}
        icon={<FileSpreadsheet className="h-5 w-5 text-emerald-700" />}
        footer={
          selectedBEO ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleSaveBEO("Draft")}
                className="rounded-full text-xs font-bold h-9 px-4 cursor-pointer"
              >
                Save Draft
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleSaveBEO("Submitted")}
                className="bg-purple-700 hover:bg-purple-800 text-white rounded-full text-xs font-bold h-9 px-4 cursor-pointer"
              >
                Submit
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleSaveBEO("Approved")}
                className="bg-blue-700 hover:bg-blue-800 text-white rounded-full text-xs font-bold h-9 px-4 cursor-pointer"
              >
                Approve
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleSaveBEO("Dispatched")}
                className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-full text-xs font-bold h-9 px-5 cursor-pointer flex items-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" /> Dispatch BEO
              </Button>
            </div>
          ) : undefined
        }
      >
        {selectedBEO && (
          <div className="space-y-4 text-xs">
            {/* BEO HEADER BANNER */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-mono font-bold block">
                  BEO NUMBER: {selectedBEO.beoNumber} | BOOKING REF: {selectedBEO.bookingCode}
                </span>
                <h3 className="text-sm font-extrabold text-slate-900">{selectedBEO.eventName}</h3>
              </div>
              <StatusBadge status={selectedBEO.status} />
            </div>

            {/* TAB NAVIGATION BAR */}
            <div className="flex border-b border-slate-200 overflow-x-auto gap-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("event")}
                className={cn(
                  "py-2.5 px-3.5 font-extrabold border-b-2 transition whitespace-nowrap cursor-pointer",
                  activeTab === "event"
                    ? "border-emerald-700 text-emerald-800 bg-emerald-50/50 rounded-t-lg"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                )}
              >
                Event
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("fb")}
                className={cn(
                  "py-2.5 px-3.5 font-extrabold border-b-2 transition whitespace-nowrap cursor-pointer",
                  activeTab === "fb"
                    ? "border-emerald-700 text-emerald-800 bg-emerald-50/50 rounded-t-lg"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                )}
              >
                Food &amp; Beverage
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("venue")}
                className={cn(
                  "py-2.5 px-3.5 font-extrabold border-b-2 transition whitespace-nowrap cursor-pointer",
                  activeTab === "venue"
                    ? "border-emerald-700 text-emerald-800 bg-emerald-50/50 rounded-t-lg"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                )}
              >
                Venue Setup
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("rooms")}
                className={cn(
                  "py-2.5 px-3.5 font-extrabold border-b-2 transition whitespace-nowrap cursor-pointer",
                  activeTab === "rooms"
                    ? "border-emerald-700 text-emerald-800 bg-emerald-50/50 rounded-t-lg"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                )}
              >
                Accommodation
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("dispatch")}
                className={cn(
                  "py-2.5 px-3.5 font-extrabold border-b-2 transition whitespace-nowrap cursor-pointer",
                  activeTab === "dispatch"
                    ? "border-emerald-700 text-emerald-800 bg-emerald-50/50 rounded-t-lg"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                )}
              >
                Department Dispatch
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("notes")}
                className={cn(
                  "py-2.5 px-3.5 font-extrabold border-b-2 transition whitespace-nowrap cursor-pointer",
                  activeTab === "notes"
                    ? "border-emerald-700 text-emerald-800 bg-emerald-50/50 rounded-t-lg"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                )}
              >
                Notes &amp; Approval
              </button>
            </div>

            {/* TAB CONTENT PANELS */}
            {/* TAB 1: EVENT INFORMATION (READ-ONLY) */}
            {activeTab === "event" && (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3 animate-in fade-in-50">
                <span className="text-[11px] font-extrabold uppercase text-slate-500 block tracking-wider">
                  Event Information (Auto-filled Read-Only from Booking)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Event Name:</span>
                    <strong className="text-slate-900 font-bold text-xs">{selectedBEO.eventName}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Client / Host:</span>
                    <strong className="text-slate-900 font-bold text-xs">{selectedBEO.clientName}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Venue Hall:</span>
                    <strong className="text-slate-900 font-bold text-xs">{selectedBEO.venueHall}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Date &amp; Time:</span>
                    <strong className="text-emerald-800 font-bold text-xs">
                      {selectedBEO.eventDate} ({selectedBEO.startTime} - {selectedBEO.endTime})
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Expected Pax:</span>
                    <strong className="text-slate-900 font-bold text-xs">{selectedBEO.expectedPax} Guests</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Sales Executive:</span>
                    <strong className="text-slate-900 font-bold text-xs">{selectedBEO.salesExecutive}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 sm:col-span-2">
                    <span className="text-slate-400 block text-[10px]">Event Coordinator:</span>
                    <strong className="text-slate-900 font-bold text-xs">{selectedBEO.coordinatorName}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: FOOD & BEVERAGE PLAN */}
            {activeTab === "fb" && (
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4 animate-in fade-in-50">
                <span className="text-[11px] font-extrabold uppercase text-slate-900 block tracking-wider flex items-center gap-1.5">
                  <UtensilsCrossed className="h-4 w-4 text-emerald-700" />
                  Food &amp; Beverage Operational Plan
                </span>

                {/* MEAL SESSIONS */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">Meal Sessions (Multiple Selection)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formMealBreakfast}
                        onChange={(e) => setFormMealBreakfast(e.target.checked)}
                        className="rounded text-emerald-700 h-4 w-4"
                      />
                      <span className="font-semibold text-slate-800">Breakfast</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formMealLunch}
                        onChange={(e) => setFormMealLunch(e.target.checked)}
                        className="rounded text-emerald-700 h-4 w-4"
                      />
                      <span className="font-semibold text-slate-800">Lunch</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formMealHighTea}
                        onChange={(e) => setFormMealHighTea(e.target.checked)}
                        className="rounded text-emerald-700 h-4 w-4"
                      />
                      <span className="font-semibold text-slate-800">High Tea</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formMealDinner}
                        onChange={(e) => setFormMealDinner(e.target.checked)}
                        className="rounded text-emerald-700 h-4 w-4"
                      />
                      <span className="font-semibold text-slate-800">Dinner</span>
                    </label>
                  </div>
                </div>

                {/* MENU PLAN */}
                <div className="space-y-3">
                  <span className="font-bold text-slate-800 block text-[11px] uppercase">Menu Plan Breakdown</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Veg Menu Items</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Paneer Butter Masala, Dal Makhani, Naan"
                        value={formVegMenu}
                        onChange={(e) => setFormVegMenu(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Non-Veg Menu Items</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Butter Chicken, Mutton Rogan Josh"
                        value={formNonVegMenu}
                        onChange={(e) => setFormNonVegMenu(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Dessert Menu</label>
                      <input
                        type="text"
                        placeholder="e.g. Gulab Jamun, Ice Cream Bar"
                        value={formDessertMenu}
                        onChange={(e) => setFormDessertMenu(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Beverage Plan</label>
                      <input
                        type="text"
                        placeholder="e.g. Tropical Mocktails & Masala Chai Counter"
                        value={formBeveragePlan}
                        onChange={(e) => setFormBeveragePlan(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* DIETARY REQUIREMENTS */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Special Dietary Requests</label>
                  <input
                    type="text"
                    placeholder="e.g. Jain meals for 40 guests, no onion garlic counter"
                    value={formSpecialDietaryNotes}
                    onChange={(e) => setFormSpecialDietaryNotes(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: VENUE SETUP */}
            {activeTab === "venue" && (
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4 animate-in fade-in-50">
                <span className="text-[11px] font-extrabold uppercase text-slate-900 block tracking-wider flex items-center gap-1.5">
                  <Wrench className="h-4 w-4 text-emerald-700" />
                  Venue Setup Requirements
                </span>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Seating Layout *</label>
                  <select
                    value={formSeatingLayout}
                    onChange={(e) => setFormSeatingLayout(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white"
                  >
                    <option value="Banquet">Banquet</option>
                    <option value="Theatre">Theatre</option>
                    <option value="Classroom">Classroom</option>
                    <option value="U Shape">U Shape</option>
                    <option value="Cluster">Cluster</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formStageRequired}
                      onChange={(e) => setFormStageRequired(e.target.checked)}
                      className="rounded text-emerald-700 h-4 w-4"
                    />
                    <span className="font-semibold text-slate-800">Stage Required</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formDanceFloor}
                      onChange={(e) => setFormDanceFloor(e.target.checked)}
                      className="rounded text-emerald-700 h-4 w-4"
                    />
                    <span className="font-semibold text-slate-800">Dance Floor</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formDjRequired}
                      onChange={(e) => setFormDjRequired(e.target.checked)}
                      className="rounded text-emerald-700 h-4 w-4"
                    />
                    <span className="font-semibold text-slate-800">DJ</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formLedWall}
                      onChange={(e) => setFormLedWall(e.target.checked)}
                      className="rounded text-emerald-700 h-4 w-4"
                    />
                    <span className="font-semibold text-slate-800">LED Wall</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formSoundSystem}
                      onChange={(e) => setFormSoundSystem(e.target.checked)}
                      className="rounded text-emerald-700 h-4 w-4"
                    />
                    <span className="font-semibold text-slate-800">Sound System</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formProjector}
                      onChange={(e) => setFormProjector(e.target.checked)}
                      className="rounded text-emerald-700 h-4 w-4"
                    />
                    <span className="font-semibold text-slate-800">Projector</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Stage Instructions</label>
                  <input
                    type="text"
                    placeholder="e.g. 24 x 16 ft stage required, center stage with floral backdrop"
                    value={formStageDetails}
                    onChange={(e) => setFormStageDetails(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Decoration Theme</label>
                    <input
                      type="text"
                      placeholder="e.g. Royal Wedding / Corporate Blue Theme"
                      value={formDecorationTheme}
                      onChange={(e) => setFormDecorationTheme(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Decoration Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. White flowers and warm lighting"
                      value={formDecorationNotes}
                      onChange={(e) => setFormDecorationNotes(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Audio Visual Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. 2 cordless microphones, 1 podium mic"
                    value={formAvNotes}
                    onChange={(e) => setFormAvNotes(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Special Setup Notes</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Bride entry from west gate, VIP seating near stage"
                    value={formSpecialSetupInstructions}
                    onChange={(e) => setFormSpecialSetupInstructions(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: ACCOMMODATION */}
            {activeTab === "rooms" && (
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4 animate-in fade-in-50">
                <span className="text-[11px] font-extrabold uppercase text-slate-900 block tracking-wider flex items-center gap-1.5">
                  <Bed className="h-4 w-4 text-emerald-700" />
                  Accommodation Details
                </span>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-semibold">Rooms Required (Auto-filled from Booking):</span>
                  <strong className="text-emerald-900 font-extrabold text-sm">{selectedBEO.roomsRequired} Rooms Blocked</strong>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">VIP Rooms</label>
                    <input
                      type="number"
                      placeholder="e.g. 2"
                      value={formVipRooms}
                      onChange={(e) => setFormVipRooms(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Guest Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Bride family on 4th floor"
                      value={formGuestNotes}
                      onChange={(e) => setFormGuestNotes(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Rooming Instructions</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Early check-in at 12 PM requested for VIP suites"
                    value={formRoomingInstructions}
                    onChange={(e) => setFormRoomingInstructions(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white"
                  />
                </div>
              </div>
            )}

            {/* TAB 5: DEPARTMENT DISPATCH */}
            {activeTab === "dispatch" && (
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4 animate-in fade-in-50">
                <span className="text-[11px] font-extrabold uppercase text-slate-900 block tracking-wider flex items-center gap-1.5">
                  <Send className="h-4 w-4 text-emerald-700" />
                  Departmental Dispatch Status Tracker
                </span>

                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <strong className="text-slate-900 font-bold block text-xs">Kitchen</strong>
                      <span className="text-[10px] text-slate-500">Menu prepping &amp; food production</span>
                    </div>
                    <select
                      value={formDispatchKitchenStatus}
                      onChange={(e) => setFormDispatchKitchenStatus(e.target.value as any)}
                      className="text-xs rounded-full border border-slate-300 py-1 px-3 bg-white font-bold text-slate-800"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <strong className="text-slate-900 font-bold block text-xs">Housekeeping</strong>
                      <span className="text-[10px] text-slate-500">Hall seating &amp; room cleaning</span>
                    </div>
                    <select
                      value={formDispatchHousekeepingStatus}
                      onChange={(e) => setFormDispatchHousekeepingStatus(e.target.value as any)}
                      className="text-xs rounded-full border border-slate-300 py-1 px-3 bg-white font-bold text-slate-800"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <strong className="text-slate-900 font-bold block text-xs">Front Office</strong>
                      <span className="text-[10px] text-slate-500">Room allocation &amp; VIP check-in</span>
                    </div>
                    <select
                      value={formDispatchFrontOfficeStatus}
                      onChange={(e) => setFormDispatchFrontOfficeStatus(e.target.value as any)}
                      className="text-xs rounded-full border border-slate-300 py-1 px-3 bg-white font-bold text-slate-800"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <strong className="text-slate-900 font-bold block text-xs">Engineering</strong>
                      <span className="text-[10px] text-slate-500">Sound, AC &amp; lighting setup</span>
                    </div>
                    <select
                      value={formDispatchEngineeringStatus}
                      onChange={(e) => setFormDispatchEngineeringStatus(e.target.value as any)}
                      className="text-xs rounded-full border border-slate-300 py-1 px-3 bg-white font-bold text-slate-800"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <strong className="text-slate-900 font-bold block text-xs">Purchase</strong>
                      <span className="text-[10px] text-slate-500">Raw materials &amp; POs</span>
                    </div>
                    <select
                      value={formDispatchPurchaseStatus}
                      onChange={(e) => setFormDispatchPurchaseStatus(e.target.value as any)}
                      className="text-xs rounded-full border border-slate-300 py-1 px-3 bg-white font-bold text-slate-800"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <strong className="text-slate-900 font-bold block text-xs">Accounts</strong>
                      <span className="text-[10px] text-slate-500">Advance verification &amp; billing</span>
                    </div>
                    <select
                      value={formDispatchAccountsStatus}
                      onChange={(e) => setFormDispatchAccountsStatus(e.target.value as any)}
                      className="text-xs rounded-full border border-slate-300 py-1 px-3 bg-white font-bold text-slate-800"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: NOTES & APPROVAL */}
            {activeTab === "notes" && (
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4 animate-in fade-in-50">
                <span className="text-[11px] font-extrabold uppercase text-slate-900 block tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" />
                  Notes &amp; BEO Lifecycle Status
                </span>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Special Instructions</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Bride arrival at 7 PM. VIP seating near stage."
                    value={formSpecialInstructions}
                    onChange={(e) => setFormSpecialInstructions(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Internal Notes</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Client paid advance. Final billing post event."
                    value={formInternalNotes}
                    onChange={(e) => setFormInternalNotes(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">BEO Lifecycle Status *</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as BEOStatus)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Approved">Approved</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* PRINT BEO MODAL */}
      {isPrintModalOpen && selectedBEO && (
        <Modal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          title={`Print Official BEO - ${selectedBEO.beoNumber}`}
          description="Format function sheet for print or PDF dispatch to Hotel Operations."
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 font-mono">
              <div className="text-center pb-2 border-b border-slate-200">
                <h4 className="text-sm font-extrabold font-sans text-slate-900">IMPACT HOTEL &amp; RESORTS</h4>
                <p className="text-[10px] text-slate-500 font-sans">BANQUET EVENT ORDER (BEO)</p>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>BEO: {selectedBEO.beoNumber} ({selectedBEO.status})</span>
                <span>Date: {selectedBEO.eventDate}</span>
              </div>
              <p className="font-sans font-bold text-slate-800 text-xs">{selectedBEO.eventName}</p>
              <p className="font-sans text-slate-600">Venue: {selectedBEO.venueHall} | Pax: {selectedBEO.expectedPax}</p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPrintModalOpen(false)}
                className="rounded-full text-xs font-bold px-4"
              >
                Close
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setToastMessage(`Sent BEO ${selectedBEO.beoNumber} to printer.`);
                  setIsPrintModalOpen(false);
                }}
                className="rounded-full text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white px-5 cursor-pointer"
              >
                Print BEO
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </ModulePageShell>
  );
}
