"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar,
  CalendarDays,
  Sparkles,
  Users,
  Search,
  SlidersHorizontal,
  Plus,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  DollarSign,
  UtensilsCrossed,
  Music,
  Bed,
  Phone,
  Mail,
  User,
  X,
  FileText,
  Layers,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Check,
  Edit2,
  Trash2,
  Eye,
  Info,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, StatusBadge } from "@/components/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// TYPES & SCHEMAS FOR EVENT BOOKINGS
// ─────────────────────────────────────────────────────────────

export type EventType =
  | "Wedding Ceremony & Reception"
  | "Corporate Annual Conference"
  | "Product Launch & Gala"
  | "Birthday & Anniversary Party"
  | "Exhibition & Trade Show"
  | "Social Gathering / Dinner";

export type EventStatus = "Tentative Hold" | "Confirmed" | "In Progress" | "Completed" | "Cancelled";
export type PaymentStatus = "Pending Deposit" | "Advance Paid" | "Fully Settled" | "Partially Paid";

export interface MealPlanConfig {
  welcomeDrinks?: string;
  starterCount: number;
  mainCourseCount: number;
  dessertCount: number;
  buffetType: "Pure Veg Buffet" | "Non-Veg Deluxe" | "Premium International" | "High Tea Only";
  specialDietaryNotes?: string;
}

export interface ResourceAllocation {
  stageSetup: boolean;
  djAndSound: boolean;
  ledScreen: boolean;
  floralDecor: boolean;
  projectorAndAV: boolean;
  roomsAllocatedCount: number;
}

export interface EventBookingItem {
  id: string;
  bookingCode: string; // e.g. BKT-2026-081
  eventName: string;
  eventType: EventType;
  clientName: string;
  clientType: "Corporate" | "Individual / Family" | "Event Agency";
  companyName?: string;
  clientPhone: string;
  clientEmail: string;

  venueHall: string; // e.g. Grand Ballroom, Royal Lawn
  eventDate: string; // YYYY-MM-DD
  timeSlot: "Morning (09:00 AM - 03:00 PM)" | "Evening (06:00 PM - 11:30 PM)" | "Full Day (09:00 AM - 11:30 PM)";
  startTime?: string; // e.g. "18:00"
  endTime?: string; // e.g. "23:30"
  expectedPax: number;
  guaranteedPax: number;

  // Pricing & Payments
  perPlateRate: number; // e.g. ₹1,800
  hallRentalFee: number; // e.g. ₹75,000
  extrasFee: number; // e.g. ₹40,000 (Decor + AV)
  totalEstimatedAmount: number;
  advanceAmountPaid: number;
  paymentMethod?: string; // Cash, Card, UPI, Bank Transfer, Cheque, Credit
  balanceDue: number;
  paymentStatus: PaymentStatus;

  // Status & Workflow
  status: EventStatus;
  leadSource?: string; // Walk-in, Phone, Website, Email, Corporate, Wedding Planner, Travel Agent, Referral
  salesExecutive: string;
  roomsRequired?: number;
  mealType?: string; // Breakfast, Lunch, Dinner, High Tea
  specialRequirements?: string;
  beoGenerated: boolean;
  beoVersion?: number;

  // Configurations
  mealPlan: MealPlanConfig;
  resources: ResourceAllocation;

  // Timestamps
  bookingDate: string;
  notes?: string;
}

// ─────────────────────────────────────────────────────────────
// MOCK DATA FOR EVENT BOOKINGS
// ─────────────────────────────────────────────────────────────

export const INITIAL_EVENT_BOOKINGS: EventBookingItem[] = [
  {
    id: "BKT-101",
    bookingCode: "BKT-2026-001",
    eventName: "Sharma & Verma Grand Wedding",
    eventType: "Wedding Ceremony & Reception",
    clientName: "Rajesh Sharma",
    clientType: "Individual / Family",
    clientPhone: "+91 98201 44332",
    clientEmail: "rajesh.sharma@gmail.com",
    venueHall: "Grand Ballroom & Royal Lawn",
    eventDate: "2026-09-15",
    timeSlot: "Full Day (09:00 AM - 11:30 PM)",
    expectedPax: 550,
    guaranteedPax: 500,
    perPlateRate: 2200,
    hallRentalFee: 120000,
    extrasFee: 85000,
    totalEstimatedAmount: 1305000,
    advanceAmountPaid: 500000,
    balanceDue: 805000,
    paymentStatus: "Advance Paid",
    status: "Confirmed",
    salesExecutive: "Neha Mehta",
    beoGenerated: true,
    beoVersion: 2,
    mealPlan: {
      buffetType: "Non-Veg Deluxe",
      starterCount: 6,
      mainCourseCount: 10,
      dessertCount: 4,
      welcomeDrinks: "Fresh Mocktails & Tender Coconut Water",
      specialDietaryNotes: "Separate Pure Jain Food counter required for 40 guests.",
    },
    resources: {
      stageSetup: true,
      djAndSound: true,
      ledScreen: true,
      floralDecor: true,
      projectorAndAV: false,
      roomsAllocatedCount: 20,
    },
    bookingDate: "10 Aug 2026",
    notes: "Requires VIP entrance setup and 50 valet parking passes.",
  },
  {
    id: "BKT-102",
    bookingCode: "BKT-2026-002",
    eventName: "TCS Global Tech Summit 2026",
    eventType: "Corporate Annual Conference",
    clientName: "Tata Consultancy Services (TCS)",
    clientType: "Corporate",
    clientPhone: "+91 98112 88990",
    clientEmail: "events.mice@tcs.com",
    venueHall: "Chamber Ballroom A",
    eventDate: "2026-09-18",
    timeSlot: "Morning (09:00 AM - 03:00 PM)",
    expectedPax: 180,
    guaranteedPax: 150,
    perPlateRate: 1650,
    hallRentalFee: 60000,
    extrasFee: 45000,
    totalEstimatedAmount: 352500,
    advanceAmountPaid: 100000,
    balanceDue: 252500,
    paymentStatus: "Advance Paid",
    status: "Confirmed",
    salesExecutive: "Jay Kumar",
    beoGenerated: true,
    beoVersion: 1,
    mealPlan: {
      buffetType: "Premium International",
      starterCount: 4,
      mainCourseCount: 8,
      dessertCount: 3,
      welcomeDrinks: "High Tea & Gourmet Pastries on Arrival",
      specialDietaryNotes: "Corporate High-Tea & Mid-morning Espresso service.",
    },
    resources: {
      stageSetup: true,
      djAndSound: false,
      ledScreen: true,
      floralDecor: false,
      projectorAndAV: true,
      roomsAllocatedCount: 10,
    },
    bookingDate: "12 Aug 2026",
    notes: "High-speed dedicated Wi-Fi access codes required for all delegates.",
  },
  {
    id: "BKT-103",
    bookingCode: "BKT-2026-003",
    eventName: "Ananya 25th Birthday Celebration",
    eventType: "Birthday & Anniversary Party",
    clientName: "Vikram Kapoor",
    clientType: "Individual / Family",
    clientPhone: "+91 97665 11223",
    clientEmail: "v kapoor@kapoorgroup.in",
    venueHall: "Poolside Pavilion",
    eventDate: "2026-09-22",
    timeSlot: "Evening (06:00 PM - 11:30 PM)",
    expectedPax: 120,
    guaranteedPax: 100,
    perPlateRate: 1800,
    hallRentalFee: 45000,
    extrasFee: 35000,
    totalEstimatedAmount: 260000,
    advanceAmountPaid: 50000,
    balanceDue: 210000,
    paymentStatus: "Advance Paid",
    status: "Tentative Hold",
    salesExecutive: "Sneha Kapadia",
    beoGenerated: false,
    mealPlan: {
      buffetType: "Pure Veg Buffet",
      starterCount: 5,
      mainCourseCount: 6,
      dessertCount: 3,
      welcomeDrinks: "Mocktail Bar & Live Pizza Station",
    },
    resources: {
      stageSetup: false,
      djAndSound: true,
      ledScreen: false,
      floralDecor: true,
      projectorAndAV: false,
      roomsAllocatedCount: 2,
    },
    bookingDate: "15 Aug 2026",
    notes: "Tentative hold until 25th August pending client confirmation.",
  },
  {
    id: "BKT-104",
    bookingCode: "BKT-2026-004",
    eventName: "Reliance Retail Product Unveiling",
    eventType: "Product Launch & Gala",
    clientName: "Reliance Retail MICE Team",
    clientType: "Corporate",
    clientPhone: "+91 99001 77665",
    clientEmail: "corporate.events@ril.com",
    venueHall: "Grand Ballroom",
    eventDate: "2026-09-28",
    timeSlot: "Full Day (09:00 AM - 11:30 PM)",
    expectedPax: 400,
    guaranteedPax: 350,
    perPlateRate: 2500,
    hallRentalFee: 150000,
    extrasFee: 120000,
    totalEstimatedAmount: 1145000,
    advanceAmountPaid: 0,
    balanceDue: 1145000,
    paymentStatus: "Pending Deposit",
    status: "Tentative Hold",
    salesExecutive: "Vikram Rathi",
    beoGenerated: false,
    mealPlan: {
      buffetType: "Premium International",
      starterCount: 8,
      mainCourseCount: 12,
      dessertCount: 5,
      welcomeDrinks: "Sparkling Drinks & Canapés",
    },
    resources: {
      stageSetup: true,
      djAndSound: true,
      ledScreen: true,
      floralDecor: true,
      projectorAndAV: true,
      roomsAllocatedCount: 15,
    },
    bookingDate: "18 Aug 2026",
    notes: "Requires full stage backdrop construction on 27th night.",
  },
  {
    id: "BKT-105",
    bookingCode: "BKT-2026-005",
    eventName: "Rotary International District Meet",
    eventType: "Social Gathering / Dinner",
    clientName: "Dr. Alok Nath",
    clientType: "Event Agency",
    clientPhone: "+91 98221 66778",
    clientEmail: "alok@rotary3140.org",
    venueHall: "Crystal Lawn",
    eventDate: "2026-08-14",
    timeSlot: "Evening (06:00 PM - 11:30 PM)",
    expectedPax: 250,
    guaranteedPax: 250,
    perPlateRate: 1500,
    hallRentalFee: 50000,
    extrasFee: 25000,
    totalEstimatedAmount: 450000,
    advanceAmountPaid: 450000,
    balanceDue: 0,
    paymentStatus: "Fully Settled",
    status: "Completed",
    salesExecutive: "Neha Mehta",
    beoGenerated: true,
    beoVersion: 1,
    mealPlan: {
      buffetType: "Pure Veg Buffet",
      starterCount: 4,
      mainCourseCount: 7,
      dessertCount: 3,
    },
    resources: {
      stageSetup: true,
      djAndSound: true,
      ledScreen: false,
      floralDecor: true,
      projectorAndAV: true,
      roomsAllocatedCount: 5,
    },
    bookingDate: "01 Aug 2026",
    notes: "Event completed cleanly with 100% guest feedback rating.",
  },
];

export function EventBookingsView() {
  const [bookings, setBookings] = useState<EventBookingItem[]>(INITIAL_EVENT_BOOKINGS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedEventType, setSelectedEventType] = useState<string>("ALL");
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Modal & Drawer State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<EventBookingItem | null>(null);

  // Create Form State
  const [formEventName, setFormEventName] = useState("");
  const [formEventType, setFormEventType] = useState<EventType>("Wedding Ceremony & Reception");
  const [formStatus, setFormStatus] = useState<EventStatus>("Tentative Hold");
  const [formSalesExecutive, setFormSalesExecutive] = useState("Jay Kumar");
  const [formEventCoordinator, setFormEventCoordinator] = useState("Banquet Manager");

  const [formClientName, setFormClientName] = useState("");
  const [formCompanyName, setFormCompanyName] = useState("");
  const [formContactPerson, setFormContactPerson] = useState("");
  const [formClientPhone, setFormClientPhone] = useState("");
  const [formClientEmail, setFormClientEmail] = useState("");
  const [formLeadSource, setFormLeadSource] = useState("Walk-in");

  const [formVenueHall, setFormVenueHall] = useState("Grand Ballroom");
  const [formEventDate, setFormEventDate] = useState("");
  const [formStartTime, setFormStartTime] = useState("");
  const [formEndTime, setFormEndTime] = useState("");

  const [formExpectedPax, setFormExpectedPax] = useState<string>("");
  const [formRoomsRequired, setFormRoomsRequired] = useState<string>("");
  const [formMealType, setFormMealType] = useState("Lunch + Dinner");
  const [formSpecialRequirements, setFormSpecialRequirements] = useState("");

  const [formHallRental, setFormHallRental] = useState<string>("");
  const [formPerPlateRate, setFormPerPlateRate] = useState<string>("");
  const [formAdvancePaid, setFormAdvancePaid] = useState<string>("");
  const [formPaymentMethod, setFormPaymentMethod] = useState("UPI / Bank Transfer");

  const [formRemarks, setFormRemarks] = useState("");

  // KPI Calculations
  const stats = useMemo(() => {
    const total = bookings.length;
    const confirmed = bookings.filter((b) => b.status === "Confirmed").length;
    const tentative = bookings.filter((b) => b.status === "Tentative Hold").length;
    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalEstimatedAmount, 0);

    return { total, confirmed, tentative, totalRevenue };
  }, [bookings]);

  // Filtered Bookings Table
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchSearch =
        b.bookingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.venueHall.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = selectedStatus === "ALL" || b.status === selectedStatus;
      const matchEventType = selectedEventType === "ALL" || b.eventType === selectedEventType;

      return matchSearch && matchStatus && matchEventType;
    });
  }, [bookings, searchTerm, selectedStatus, selectedEventType]);

  // Create Booking Handler
  const handleSaveBooking = (e: React.FormEvent) => {
    e.preventDefault();

    const expectedPax = Number(formExpectedPax) || 0;
    const perPlateRate = Number(formPerPlateRate) || 0;
    const hallRental = Number(formHallRental) || 0;
    const advancePaid = Number(formAdvancePaid) || 0;
    const roomsRequired = Number(formRoomsRequired) || 0;

    const estimatedTotal = expectedPax * perPlateRate + hallRental;
    const balance = Math.max(0, estimatedTotal - advancePaid);
    const newCode = `BKT-2026-00${bookings.length + 1}`;

    const newBooking: EventBookingItem = {
      id: `BKT-${Math.floor(100 + Math.random() * 900)}`,
      bookingCode: newCode,
      eventName: formEventName,
      eventType: formEventType,
      clientName: formClientName,
      clientType: "Individual / Family",
      companyName: formCompanyName || undefined,
      clientPhone: formClientPhone,
      clientEmail: formClientEmail,
      venueHall: formVenueHall,
      eventDate: formEventDate,
      timeSlot: "Full Day (09:00 AM - 11:30 PM)",
      startTime: formStartTime || undefined,
      endTime: formEndTime || undefined,
      expectedPax: expectedPax,
      guaranteedPax: expectedPax,
      perPlateRate: perPlateRate,
      hallRentalFee: hallRental,
      extrasFee: 0,
      totalEstimatedAmount: estimatedTotal,
      advanceAmountPaid: advancePaid,
      paymentMethod: formPaymentMethod,
      balanceDue: balance,
      paymentStatus: advancePaid >= estimatedTotal && estimatedTotal > 0 ? "Fully Settled" : advancePaid > 0 ? "Advance Paid" : "Pending Deposit",
      status: formStatus,
      leadSource: formLeadSource,
      salesExecutive: formSalesExecutive,
      roomsRequired: roomsRequired,
      mealType: formMealType,
      specialRequirements: formSpecialRequirements || undefined,
      beoGenerated: false,
      mealPlan: {
        buffetType: formMealType.includes("Veg") ? "Pure Veg Buffet" : "Non-Veg Deluxe",
        starterCount: 4,
        mainCourseCount: 8,
        dessertCount: 3,
      },
      resources: {
        stageSetup: true,
        djAndSound: true,
        ledScreen: false,
        floralDecor: true,
        projectorAndAV: false,
        roomsAllocatedCount: roomsRequired,
      },
      bookingDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      notes: formRemarks || undefined,
    };

    setBookings((prev) => [newBooking, ...prev]);
    setToastMessage(`Created new Event Booking "${newCode}" for ${formEventName}.`);
    setIsCreateModalOpen(false);

    // Reset Form
    setFormEventName("");
    setFormClientName("");
    setFormCompanyName("");
    setFormContactPerson("");
    setFormClientPhone("");
    setFormClientEmail("");
    setFormEventDate("");
    setFormStartTime("");
    setFormEndTime("");
    setFormExpectedPax("");
    setFormPerPlateRate("");
    setFormHallRental("");
    setFormAdvancePaid("");
    setFormRoomsRequired("");
    setFormSpecialRequirements("");
    setFormRemarks("");
  };

  // Convert Status Action
  const handleUpdateStatus = (booking: EventBookingItem, newStatus: EventStatus) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === booking.id ? { ...b, status: newStatus } : b))
    );
    if (selectedBooking && selectedBooking.id === booking.id) {
      setSelectedBooking((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    setToastMessage(`Updated status for ${booking.bookingCode} to "${newStatus}".`);
  };

  return (
    <ModulePageShell
      eyebrow="Sales & Marketing Management"
      title="Event Bookings"
      description="Manage banquet event reservations, tentative holds, confirmed bookings, and billing details."
      breadcrumbs={[
        { label: "Sales & Marketing", href: "/sales-marketing/dashboard" },
        { label: "Banquets & Events" },
        { label: "Event Bookings" },
      ]}
      actionButtons={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-full text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm flex items-center gap-1.5 px-4 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Create Event Booking
          </Button>
        </div>
      }
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: DASHBOARD KPI CARDS (4 COMPACT NEUTRAL CARDS)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <HRKPICard
          label="Total Event Bookings"
          value={`${stats.total}`}
          subtitle="System Master Bookings"
          tone="emerald"
          icon={<CalendarDays className="h-5 w-5" />}
        />
        <HRKPICard
          label="Confirmed Events"
          value={`${stats.confirmed}`}
          subtitle="Advance Paid & Verified"
          tone="blue"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <HRKPICard
          label="Tentative Holds"
          value={`${stats.tentative}`}
          subtitle="Pending Advance Deposit"
          tone="amber"
          icon={<Clock className="h-5 w-5" />}
        />
        <HRKPICard
          label="Estimated Revenue"
          value={`₹${(stats.totalRevenue / 100000).toFixed(2)} L`}
          subtitle="Total Contract Value"
          tone="purple"
          icon={<Sparkles className="h-5 w-5" />}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: REUSABLE FILTER BAR TOOLBAR
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs mb-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          {/* Full-width Rounded Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by code, event name, client, or venue..."
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

          {/* Filters Toggle Button (Right) */}
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

        {/* Collapsible Secondary Filters Panel */}
        {showFilterPanel && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in-50">
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs rounded-full border border-slate-200 py-1.5 px-3 bg-slate-50 font-bold text-slate-800"
              >
                <option value="ALL">All Booking Statuses</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Tentative Hold">Tentative Hold</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <select
                value={selectedEventType}
                onChange={(e) => setSelectedEventType(e.target.value)}
                className="text-xs rounded-full border border-slate-200 py-1.5 px-3 bg-slate-50 font-bold text-slate-800"
              >
                <option value="ALL">All Event Types</option>
                <option value="Wedding Ceremony & Reception">Wedding Ceremony & Reception</option>
                <option value="Corporate Annual Conference">Corporate Annual Conference</option>
                <option value="Product Launch & Gala">Product Launch & Gala</option>
                <option value="Birthday & Anniversary Party">Birthday & Anniversary Party</option>
                <option value="Social Gathering / Dinner">Social Gathering / Dinner</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedStatus("ALL");
                setSelectedEventType("ALL");
              }}
              className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: MAIN DATA TABLE (DESKTOP)
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-3.5 px-4">Event &amp; Booking Code</th>
                <th className="py-3.5 px-4">Client / Organization</th>
                <th className="py-3.5 px-4">Venue &amp; Date</th>
                <th className="py-3.5 px-4">Pax &amp; Rate</th>
                <th className="py-3.5 px-4">Estimated Total</th>
                <th className="py-3.5 px-4">Advance Paid</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 font-bold shrink-0">
                          <CalendarDays className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900">{booking.eventName}</p>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {booking.bookingCode} • {booking.eventType}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{booking.clientName}</p>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {booking.clientType} • {booking.clientPhone}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800 block">{booking.venueHall}</span>
                      <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                        {new Date(booking.eventDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{booking.expectedPax} Guests</p>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ₹{booking.perPlateRate.toLocaleString()} / Plate
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900">
                      ₹{booking.totalEstimatedAmount.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                      ₹{booking.advanceAmountPaid.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={booking.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    No event bookings found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: CREATE NEW EVENT BOOKING
      ───────────────────────────────────────────────────────────── */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Banquet Event Booking"
          description="Register event details, venue hall selection, expected pax, and advance deposit."
          size="lg"
        >
          <form onSubmit={handleSaveBooking} className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
            {/* SECTION 1: EVENT INFORMATION */}
            <div className="space-y-3">
              <span className="text-[11px] font-extrabold uppercase text-slate-400 block tracking-wider">
                1. Event Information
              </span>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Event Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sharma Wedding"
                  value={formEventName}
                  onChange={(e) => setFormEventName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Event Category / Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formEventType}
                    onChange={(e) => setFormEventType(e.target.value as EventType)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                  >
                    <option value="Wedding Ceremony & Reception">Wedding Ceremony</option>
                    <option value="Corporate Annual Conference">Corporate Annual Conference</option>
                    <option value="Product Launch & Gala">Product Launch & Gala</option>
                    <option value="Birthday & Anniversary Party">Birthday Party</option>
                    <option value="Social Gathering / Dinner">Social Gathering</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Booking Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as EventStatus)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                  >
                    <option value="Tentative Hold">Tentative Hold</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sales Executive <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formSalesExecutive}
                    onChange={(e) => setFormSalesExecutive(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                  >
                    <option value="Jay Kumar">Jay Kumar</option>
                    <option value="Neha Mehta">Neha Mehta</option>
                    <option value="Vikram Rathi">Vikram Rathi</option>
                    <option value="Sneha Kapadia">Sneha Kapadia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Event Coordinator</label>
                  <input
                    type="text"
                    placeholder="e.g. Banquet Manager"
                    value={formEventCoordinator}
                    onChange={(e) => setFormEventCoordinator(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* SECTION 2: CLIENT INFORMATION */}
            <div className="space-y-3">
              <span className="text-[11px] font-extrabold uppercase text-slate-400 block tracking-wider">
                2. Client Information
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client / Host Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sharma Family"
                    value={formClientName}
                    onChange={(e) => setFormClientName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Organization</label>
                  <input
                    type="text"
                    placeholder="e.g. TCS / Infosys (Optional)"
                    value={formCompanyName}
                    onChange={(e) => setFormCompanyName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={formContactPerson}
                    onChange={(e) => setFormContactPerson(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="9876543210"
                    value={formClientPhone}
                    onChange={(e) => setFormClientPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Client Email</label>
                  <input
                    type="email"
                    placeholder="rahul@gmail.com"
                    value={formClientEmail}
                    onChange={(e) => setFormClientEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Source</label>
                <select
                  value={formLeadSource}
                  onChange={(e) => setFormLeadSource(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                >
                  <option value="Walk-in">Walk-in</option>
                  <option value="Phone Call">Phone Call</option>
                  <option value="Website Form">Website Form</option>
                  <option value="Email Inquiry">Email Inquiry</option>
                  <option value="Corporate Account">Corporate Account</option>
                  <option value="Wedding Planner">Wedding Planner</option>
                  <option value="Travel Agent">Travel Agent</option>
                  <option value="Referral">Referral</option>
                </select>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* SECTION 3: VENUE & SCHEDULE */}
            <div className="space-y-3">
              <span className="text-[11px] font-extrabold uppercase text-slate-400 block tracking-wider">
                3. Venue &amp; Schedule
              </span>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Venue Hall <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formVenueHall}
                  onChange={(e) => setFormVenueHall(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                >
                  <option value="Grand Ballroom">Grand Ballroom</option>
                  <option value="Grand Ballroom & Royal Lawn">Grand Ballroom & Royal Lawn</option>
                  <option value="Chamber Ballroom A">Chamber Ballroom A</option>
                  <option value="Poolside Pavilion">Poolside Pavilion</option>
                  <option value="Crystal Lawn">Crystal Lawn</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Event Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formEventDate}
                    onChange={(e) => setFormEventDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* SECTION 4: EVENT REQUIREMENTS */}
            <div className="space-y-3">
              <span className="text-[11px] font-extrabold uppercase text-slate-400 block tracking-wider">
                4. Event Requirements
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expected Pax <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 500"
                    value={formExpectedPax}
                    onChange={(e) => setFormExpectedPax(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rooms Required</label>
                  <input
                    type="number"
                    placeholder="e.g. 20"
                    value={formRoomsRequired}
                    onChange={(e) => setFormRoomsRequired(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Meal Requirement</label>
                <select
                  value={formMealType}
                  onChange={(e) => setFormMealType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                >
                  <option value="Lunch + Dinner">Lunch + Dinner</option>
                  <option value="Dinner Buffet">Dinner Buffet</option>
                  <option value="Lunch Buffet">Lunch Buffet</option>
                  <option value="High Tea & Snacks">High Tea & Snacks</option>
                  <option value="Breakfast & High Tea">Breakfast & High Tea</option>
                  <option value="Full Day Meals (BF + Lunch + Dinner)">Full Day Meals (BF + Lunch + Dinner)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Special Requirements</label>
                <input
                  type="text"
                  placeholder="e.g. DJ, LED Wall, Stage Setup"
                  value={formSpecialRequirements}
                  onChange={(e) => setFormSpecialRequirements(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                />
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* SECTION 5: COMMERCIAL INFORMATION */}
            <div className="space-y-3">
              <span className="text-[11px] font-extrabold uppercase text-slate-400 block tracking-wider">
                5. Commercial Information
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hall Rental (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 50000"
                    value={formHallRental}
                    onChange={(e) => setFormHallRental(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rate / Plate (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1800"
                    value={formPerPlateRate}
                    onChange={(e) => setFormPerPlateRate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                  />
                </div>
              </div>

              {/* LIVE TOTAL SUMMARY CARD (AUTO CALCULATED) */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 text-emerald-900">
                <div>
                  <span className="text-[11px] font-semibold block text-emerald-700">Estimated Total</span>
                  <span className="text-[10px] text-emerald-600">({Number(formExpectedPax) || 0} Pax × ₹{Number(formPerPlateRate) || 0}) + ₹{Number(formHallRental) || 0} Rental</span>
                </div>
                <span className="text-base font-extrabold font-mono">
                  ₹{((Number(formExpectedPax) || 0) * (Number(formPerPlateRate) || 0) + (Number(formHallRental) || 0)).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Advance Deposit (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 50000"
                    value={formAdvancePaid}
                    onChange={(e) => setFormAdvancePaid(e.target.value)}
                    className="w-full rounded-lg border border-emerald-300 bg-emerald-50/40 p-2.5 text-xs font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                  >
                    <option value="UPI">UPI</option>
                    <option value="UPI / Bank Transfer">Bank Transfer</option>
                    <option value="Credit Card / Debit Card">Credit / Debit Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* SECTION 6: INTERNAL NOTES */}
            <div className="space-y-3">
              <span className="text-[11px] font-extrabold uppercase text-slate-400 block tracking-wider">
                6. Internal Notes
              </span>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Internal Remarks</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Client prefers Jain food. VIP guests arriving."
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                />
              </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-full text-xs font-semibold px-6 border-slate-300 hover:bg-slate-50 cursor-pointer h-10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-full text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white px-7 cursor-pointer h-10 shadow-sm"
              >
                Create Event Booking
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          DRAWER: EVENT BOOKING DETAILS & BEO DISPATCH PREVIEW
      ───────────────────────────────────────────────────────────── */}
      <Drawer
        isOpen={Boolean(selectedBooking)}
        onClose={() => setSelectedBooking(null)}
        title="Event Booking Details &amp; BEO Overview"
        icon={<Sparkles className="h-5 w-5 text-emerald-700" />}
        footer={
          selectedBooking ? (
            <div className="flex items-center gap-2">
              {selectedBooking.status === "Tentative Hold" && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleUpdateStatus(selectedBooking, "Confirmed")}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full text-xs font-bold h-9 cursor-pointer"
                >
                  <Check className="mr-1 h-3.5 w-3.5" /> Confirm Booking
                </Button>
              )}
              {selectedBooking.status === "Confirmed" && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleUpdateStatus(selectedBooking, "In Progress")}
                  className="flex-1 bg-blue-700 hover:bg-blue-800 text-white rounded-full text-xs font-bold h-9 cursor-pointer"
                >
                  Start Event Operations
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedBooking(null)}
                className="rounded-full border-slate-200 text-xs font-bold h-9 cursor-pointer"
              >
                Close
              </Button>
            </div>
          ) : undefined
        }
      >
        {selectedBooking && (
          <div className="space-y-4 text-xs">
            {/* Header Summary Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-mono font-bold">
                  {selectedBooking.bookingCode} • {selectedBooking.eventType}
                </span>
                <StatusBadge status={selectedBooking.status} />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">{selectedBooking.eventName}</h3>
              <div className="grid grid-cols-2 gap-2 text-slate-600 font-medium text-[11px]">
                <p>
                  Client: <strong className="text-slate-900">{selectedBooking.clientName}</strong>
                </p>
                {selectedBooking.companyName && (
                  <p>
                    Company: <strong className="text-slate-900">{selectedBooking.companyName}</strong>
                  </p>
                )}
                <p>
                  Phone: <strong className="text-slate-900">{selectedBooking.clientPhone}</strong>
                </p>
                {selectedBooking.leadSource && (
                  <p>
                    Source: <strong className="text-emerald-800">{selectedBooking.leadSource}</strong>
                  </p>
                )}
                <p className="col-span-2">
                  Sales Owner: <strong className="text-slate-900">{selectedBooking.salesExecutive}</strong>
                </p>
              </div>
            </div>

            {/* Venue & Time Schedule Card */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
              <span className="font-extrabold text-slate-900 uppercase block text-[11px]">
                Venue &amp; Time Schedule
              </span>
              <div className="grid grid-cols-2 gap-2 text-slate-700 font-medium">
                <div>
                  <span className="text-slate-400 block text-[10px]">Assigned Venue:</span>
                  <strong className="text-slate-900">{selectedBooking.venueHall}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Event Date:</span>
                  <strong className="text-emerald-800 font-mono">
                    {new Date(selectedBooking.eventDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Time Slot / Hours:</span>
                  <strong className="text-slate-800">
                    {selectedBooking.startTime && selectedBooking.endTime
                      ? `${selectedBooking.startTime} - ${selectedBooking.endTime}`
                      : selectedBooking.timeSlot}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Rooms Blocked (FO):</span>
                  <strong className="text-slate-800">{selectedBooking.roomsRequired || 0} Rooms</strong>
                </div>
              </div>
            </div>

            {/* Financial & Payment Summary */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
              <span className="font-extrabold text-slate-900 uppercase block text-[11px]">
                Contract Value &amp; Billing
              </span>
              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-500 block font-sans">Guaranteed Pax</span>
                  <strong className="text-slate-900">{selectedBooking.expectedPax} Guests</strong>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-500 block font-sans">Rate / Plate</span>
                  <strong className="text-slate-900">₹{selectedBooking.perPlateRate.toLocaleString()}</strong>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 block font-sans">Total Estimated Amount</span>
                  <strong className="text-emerald-900">₹{selectedBooking.totalEstimatedAmount.toLocaleString()}</strong>
                </div>
                <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
                  <span className="text-[10px] text-blue-700 block font-sans">Advance Received ({selectedBooking.paymentMethod || "UPI"})</span>
                  <strong className="text-blue-900">₹{selectedBooking.advanceAmountPaid.toLocaleString()}</strong>
                </div>
              </div>
            </div>

            {/* Special Requirements & Notes */}
            {(selectedBooking.specialRequirements || selectedBooking.notes) && (
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <span className="font-extrabold text-slate-900 uppercase block text-[11px]">
                  Special Instructions &amp; Notes
                </span>
                {selectedBooking.specialRequirements && (
                  <p className="text-slate-700">
                    <strong className="text-slate-900">Setup Specs:</strong> {selectedBooking.specialRequirements}
                  </p>
                )}
                {selectedBooking.notes && (
                  <p className="text-slate-700">
                    <strong className="text-slate-900">Remarks:</strong> {selectedBooking.notes}
                  </p>
                )}
              </div>
            )}

            {/* Cross-Department Execution Dispatch (BEO Status) */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 uppercase block text-[11px]">
                  Cross-Department BEO Dispatch Status
                </span>
                {selectedBooking.beoGenerated ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    BEO Released (v{selectedBooking.beoVersion})
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    BEO Pending Approval
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <span>🍽️ Kitchen ({selectedBooking.mealType || "Buffet"})</span>
                  <span className="font-bold text-emerald-700">Ready</span>
                </div>
                <div className="p-2 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <span>🧹 Housekeeping (Hall)</span>
                  <span className="font-bold text-emerald-700">Allocated</span>
                </div>
                <div className="p-2 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <span>🛏️ Front Office (Rooms)</span>
                  <span className="font-bold text-slate-800">{selectedBooking.roomsRequired || 0} Rooms</span>
                </div>
                <div className="p-2 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <span>🔊 Maintenance (AV/Sound)</span>
                  <span className="font-bold text-emerald-700">Checked</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </ModulePageShell>
  );
}
