"use client";

import React, { useState, useMemo } from "react";
import {
  CalendarClock,
  Calendar,
  Building2,
  Users,
  Search,
  SlidersHorizontal,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
  Plus,
  Info,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  Sparkles,
  Bed,
  Check,
  CalendarDays,
  ShieldCheck,
  Eye,
  Lock,
  Hotel,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Card, Drawer, Modal, StatusBadge } from "@/components/ui";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// TYPES & MOCK DATA FOR VENUES & ROOM INVENTORY
// ─────────────────────────────────────────────────────────────

export interface VenueHall {
  id: string;
  name: string;
  category: "Indoor Hall" | "Outdoor Lawn" | "Poolside" | "Rooftop" | "Conference Room";
  maxCapacity: number;
  areaSqFt: number;
  halfDayRate: number;
  fullDayRate: number;
  status: "Available" | "Maintenance" | "Renovation";
}

export interface RoomCategoryAvailability {
  id: string;
  categoryName: string;
  totalInventory: number;
  availableRooms: number;
  bookedRooms: number;
  maintenanceRooms: number;
  startingPrice: number;
}

export interface VenueSlotBooking {
  id: string;
  venueId: string;
  venueName: string;
  date: string; // YYYY-MM-DD
  timeSlot: "Morning (09:00 - 15:00)" | "Evening (18:00 - 23:30)" | "Full Day (09:00 - 23:30)";
  eventName: string;
  clientName: string;
  expectedPax: number;
  bookingStatus: "Confirmed" | "Tentative Hold" | "In Maintenance";
  salesExecutive: string;
  roomsBlocked: number;
}

export const HOTEL_VENUES: VenueHall[] = [
  {
    id: "V-01",
    name: "Grand Ballroom & Royal Lawn",
    category: "Indoor Hall",
    maxCapacity: 800,
    areaSqFt: 12000,
    halfDayRate: 85000,
    fullDayRate: 150000,
    status: "Available",
  },
  {
    id: "V-02",
    name: "Chamber Ballroom A",
    category: "Indoor Hall",
    maxCapacity: 250,
    areaSqFt: 4500,
    halfDayRate: 40000,
    fullDayRate: 75000,
    status: "Available",
  },
  {
    id: "V-03",
    name: "Poolside Pavilion",
    category: "Poolside",
    maxCapacity: 150,
    areaSqFt: 3500,
    halfDayRate: 30000,
    fullDayRate: 55000,
    status: "Available",
  },
  {
    id: "V-04",
    name: "Skyline Rooftop Terrace",
    category: "Rooftop",
    maxCapacity: 200,
    areaSqFt: 4000,
    halfDayRate: 35000,
    fullDayRate: 65000,
    status: "Available",
  },
  {
    id: "V-05",
    name: "Executive Boardroom B",
    category: "Conference Room",
    maxCapacity: 40,
    areaSqFt: 1200,
    halfDayRate: 15000,
    fullDayRate: 25000,
    status: "Available",
  },
];

export const HOTEL_ROOM_CATEGORIES: RoomCategoryAvailability[] = [
  {
    id: "RC-01",
    categoryName: "Deluxe King Room",
    totalInventory: 40,
    availableRooms: 18,
    bookedRooms: 20,
    maintenanceRooms: 2,
    startingPrice: 5500,
  },
  {
    id: "RC-02",
    categoryName: "Executive Twin Room",
    totalInventory: 30,
    availableRooms: 12,
    bookedRooms: 16,
    maintenanceRooms: 2,
    startingPrice: 6500,
  },
  {
    id: "RC-03",
    categoryName: "Royal Heritage Suite",
    totalInventory: 15,
    availableRooms: 5,
    bookedRooms: 9,
    maintenanceRooms: 1,
    startingPrice: 12500,
  },
  {
    id: "RC-04",
    categoryName: "Presidential Villa",
    totalInventory: 5,
    availableRooms: 2,
    bookedRooms: 3,
    maintenanceRooms: 0,
    startingPrice: 28000,
  },
];

export const INITIAL_BOOKINGS: VenueSlotBooking[] = [
  {
    id: "SLOT-101",
    venueId: "V-01",
    venueName: "Grand Ballroom & Royal Lawn",
    date: "2027-01-15",
    timeSlot: "Full Day (09:00 - 23:30)",
    eventName: "Sharma Wedding Reception",
    clientName: "Sharma Family (Rahul Sharma)",
    expectedPax: 500,
    bookingStatus: "Confirmed",
    salesExecutive: "Jay Kumar",
    roomsBlocked: 20,
  },
  {
    id: "SLOT-102",
    venueId: "V-02",
    venueName: "Chamber Ballroom A",
    date: "2026-09-18",
    timeSlot: "Morning (09:00 - 15:00)",
    eventName: "TCS Global Tech Summit 2026",
    clientName: "TCS India",
    expectedPax: 150,
    bookingStatus: "Confirmed",
    salesExecutive: "Jay Kumar",
    roomsBlocked: 10,
  },
  {
    id: "SLOT-103",
    venueId: "V-03",
    venueName: "Poolside Pavilion",
    date: "2026-09-22",
    timeSlot: "Evening (18:00 - 23:30)",
    eventName: "Ananya Birthday Gala",
    clientName: "Vikram Kapoor",
    expectedPax: 100,
    bookingStatus: "Tentative Hold",
    salesExecutive: "Sneha Kapadia",
    roomsBlocked: 0,
  },
  {
    id: "SLOT-104",
    venueId: "V-04",
    venueName: "Skyline Rooftop Terrace",
    date: "2026-09-18",
    timeSlot: "Evening (18:00 - 23:30)",
    eventName: "Reddy Cocktail Party",
    clientName: "Sanjay Reddy",
    expectedPax: 120,
    bookingStatus: "Confirmed",
    salesExecutive: "Jay Kumar",
    roomsBlocked: 5,
  },
];

export function VenueAvailabilityView() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("day");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active View Toggle Pill State: 'venues' | 'rooms'
  const [viewMode, setViewMode] = useState<"venues" | "rooms">("venues");

  // Read-Only Slot Details Modal State
  const [selectedSlotModal, setSelectedSlotModal] = useState<{
    venue: VenueHall;
    slot: "Morning (09:00 - 15:00)" | "Evening (18:00 - 23:30)" | "Full Day (09:00 - 23:30)";
    booking?: VenueSlotBooking;
  } | null>(null);

  const [slotBookings] = useState<VenueSlotBooking[]>(INITIAL_BOOKINGS);

  // Filtered Venues
  const filteredVenues = useMemo(() => {
    return HOTEL_VENUES.filter((v) => {
      const matchSearch =
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCategory === "ALL" || v.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [searchTerm, selectedCategory]);

  // Filtered Rooms
  const filteredRooms = useMemo(() => {
    return HOTEL_ROOM_CATEGORIES.filter((r) =>
      r.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  // Metric Stats for Selected Date
  const dateMetrics = useMemo(() => {
    const totalHalls = HOTEL_VENUES.length;
    const dateSlots = slotBookings.filter((b) => b.date === selectedDate);
    const confirmedCount = dateSlots.filter((b) => b.bookingStatus === "Confirmed").length;
    const tentativeCount = dateSlots.filter((b) => b.bookingStatus === "Tentative Hold").length;
    const totalRoomsBlocked = dateSlots.reduce((sum, b) => sum + b.roomsBlocked, 0);

    const totalRoomsInventory = HOTEL_ROOM_CATEGORIES.reduce((s, r) => s + r.totalInventory, 0);
    const totalRoomsAvailable = HOTEL_ROOM_CATEGORIES.reduce((s, r) => s + r.availableRooms, 0);

    return {
      totalHalls,
      confirmedCount,
      tentativeCount,
      availableCount: totalHalls * 2 - (confirmedCount + tentativeCount),
      totalRoomsBlocked,
      totalRoomsInventory,
      totalRoomsAvailable,
    };
  }, [selectedDate, slotBookings]);

  // Helper to generate array of ISO date strings for current view range
  const dateColumns = useMemo(() => {
    const dates: { iso: string; formatted: string }[] = [];
    const [y, m, day] = selectedDate.split("-").map(Number);
    const base = new Date(y, m - 1, day);
    const numDays = timeRange === "day" ? 1 : timeRange === "week" ? 7 : 30;

    for (let i = 0; i < numDays; i++) {
      const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
      const isoY = d.getFullYear();
      const isoM = String(d.getMonth() + 1).padStart(2, "0");
      const isoD = String(d.getDate()).padStart(2, "0");
      const iso = `${isoY}-${isoM}-${isoD}`;
      const formatted = d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        weekday: timeRange === "month" ? undefined : "short",
      });
      dates.push({ iso, formatted });
    }
    return dates;
  }, [selectedDate, timeRange]);

  // Helper to check booking for venue & slot on specific date
  const getSlotBookingForDate = (venueId: string, slot: "Morning" | "Evening" | "FullDay", targetIsoDate: string) => {
    return slotBookings.find((b) => {
      if (b.venueId !== venueId || b.date !== targetIsoDate) return false;
      if (slot === "Morning" && b.timeSlot.startsWith("Morning")) return true;
      if (slot === "Evening" && b.timeSlot.startsWith("Evening")) return true;
      if (slot === "FullDay" || b.timeSlot.startsWith("Full Day")) return true;
      return false;
    });
  };

  return (
    <ModulePageShell
      eyebrow="Sales & Marketing Management"
      title="Venue & Room Availability Matrix"
      description="View-only real-time availability matrix for Banquet Venues and Hotel Rooms. Reservations are managed by Front Office."
      breadcrumbs={[
        { label: "Sales & Marketing", href: "/sales-marketing/dashboard" },
        { label: "Banquets & Events" },
        { label: "Venue Availability" },
      ]}
      actionButtons={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => setToastMessage("Booking process is executed by Front Office. Sales & Marketing has View-Only access.")}
            className="rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-2xs flex items-center gap-1.5 px-3.5 py-1.5 cursor-pointer"
          >
            <Lock className="h-3.5 w-3.5 text-amber-400" /> Front Office Managed Booking
          </Button>
        </div>
      }
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
    >
      {/* 1. SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <Card className="p-4 bg-white border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Banquet Venues</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
            {dateMetrics.totalHalls}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Halls &amp; Lawns
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Confirmed Events</span>
            <div className="h-8 w-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
            {dateMetrics.confirmedCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            For {selectedDate}
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tentative Holds</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
            {dateMetrics.tentativeCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            For {selectedDate}
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Slots Available</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
            {dateMetrics.availableCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Morning / Evening Slots
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Hotel Rooms Avail.</span>
            <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <Bed className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
            {dateMetrics.totalRoomsAvailable} <span className="text-sm font-semibold text-slate-400">/ {dateMetrics.totalRoomsInventory}</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Real-time FO Inventory
          </div>
        </Card>
      </div>

      {/* 2. FILTER & CONTROLS BAR */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs mb-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* View Mode Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setViewMode("venues")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
                viewMode === "venues"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              <Building2 className="h-3.5 w-3.5" /> Venue &amp; Hall Matrix
            </button>

            <button
              type="button"
              onClick={() => setViewMode("rooms")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
                viewMode === "rooms"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              <Hotel className="h-3.5 w-3.5" /> Room Availability (FO)
            </button>
          </div>

          {/* Search & Target Date Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-56 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={
                  viewMode === "venues"
                    ? "Search hall name or specs..."
                    : "Search room category..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-800 font-medium placeholder:text-slate-400"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Target Date Input */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              />
            </div>

            {/* Range Presets */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
              <button
                type="button"
                onClick={() => {
                  setTimeRange("day");
                  setSelectedDate(new Date().toISOString().split("T")[0]);
                }}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer",
                  timeRange === "day"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Day
              </button>
              <button
                type="button"
                onClick={() => setTimeRange("week")}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer",
                  timeRange === "week"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Week (7 Days)
              </button>
              <button
                type="button"
                onClick={() => setTimeRange("month")}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer",
                  timeRange === "month"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Month (30 Days)
              </button>
            </div>

            {viewMode === "venues" && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs rounded-lg border border-slate-200 py-1.5 px-3 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="Indoor Hall">Indoor Hall</option>
                <option value="Outdoor Lawn">Outdoor Lawn</option>
                <option value="Poolside">Poolside</option>
                <option value="Rooftop">Rooftop</option>
                <option value="Conference Room">Conference Room</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* 3. RECORD COUNT BAR */}
      <div className="flex items-center justify-between text-xs text-slate-500 mb-2 px-1">
        <span>
          Showing <strong className="text-slate-800">{viewMode === "venues" ? filteredVenues.length : filteredRooms.length}</strong> {viewMode === "venues" ? "venues" : "room categories"} • Real-Time Availability Matrix
        </span>
        <span className="text-[11px] text-slate-400">
          Target Date: {selectedDate} ({timeRange.toUpperCase()})
        </span>
      </div>

      {/* 4. MATRIX DISPLAY BASED ON PILL SELECTION */}
      {viewMode === "venues" ? (
        /* VENUE AVAILABILITY MATRIX GRID (VIEW-ONLY) */
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-[11px] font-semibold tracking-wider text-slate-500 uppercase border-b border-slate-200">
                {timeRange === "day" ? (
                  <tr>
                    <th className="py-3 px-4">Venue / Hall Specs</th>
                    <th className="py-3 px-4 text-center">Capacity</th>
                    <th className="py-3 px-4 text-center">Morning Slot (09:00 - 15:00)</th>
                    <th className="py-3 px-4 text-center">Evening Slot (18:00 - 23:30)</th>
                    <th className="py-3 px-4 text-right">Tariff (Full Day)</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="py-3 px-4 min-w-[200px] sticky left-0 bg-slate-50 border-r border-slate-200 z-10">
                      Venue / Hall Specs
                    </th>
                    <th className="py-3 px-3 text-center min-w-[80px]">Capacity</th>
                    {dateColumns.map((col) => {
                      const isSelected = col.iso === selectedDate;
                      return (
                        <th
                          key={col.iso}
                          onClick={() => {
                            setSelectedDate(col.iso);
                            setTimeRange("day");
                          }}
                          title="Click to view single day detail for this date"
                          className={cn(
                            "py-3 px-3 text-center min-w-[110px] border-l border-slate-200/60 cursor-pointer transition select-none",
                            isSelected
                              ? "bg-slate-900 text-white font-bold"
                              : "hover:bg-slate-100 text-slate-600"
                          )}
                        >
                          {col.formatted}
                        </th>
                      );
                    })}
                    <th className="py-3 px-4 text-right min-w-[110px]">Tariff</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVenues.length > 0 ? (
                  filteredVenues.map((venue) => {
                    if (timeRange === "day") {
                      const morningBooking = getSlotBookingForDate(venue.id, "Morning", selectedDate);
                      const eveningBooking = getSlotBookingForDate(venue.id, "Evening", selectedDate);
                      const fullDayBooking = getSlotBookingForDate(venue.id, "FullDay", selectedDate);

                      return (
                        <tr key={venue.id} className="hover:bg-slate-50/70 transition">
                          {/* Venue Info */}
                          <td className="py-3 px-4">
                            <strong className="text-xs font-semibold text-slate-900 block">{venue.name}</strong>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-600">{venue.category}</span>
                              <span>{venue.areaSqFt.toLocaleString()} sq. ft.</span>
                            </div>
                          </td>

                          {/* Capacity */}
                          <td className="py-3 px-4 text-center font-medium">
                            <span className="font-bold text-slate-800 font-mono text-xs">{venue.maxCapacity}</span>
                            <span className="block text-[10px] text-slate-400">Pax</span>
                          </td>

                          {/* Morning Slot */}
                          <td className="py-3 px-4 text-center">
                            {fullDayBooking ? (
                              <div
                                onClick={() =>
                                  setSelectedSlotModal({
                                    venue,
                                    slot: "Full Day (09:00 - 23:30)",
                                    booking: fullDayBooking,
                                  })
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold hover:bg-purple-100 transition cursor-pointer"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-purple-600" />
                                <span>Full Day: {fullDayBooking.eventName}</span>
                              </div>
                            ) : morningBooking ? (
                              <div
                                onClick={() =>
                                  setSelectedSlotModal({
                                    venue,
                                    slot: "Morning (09:00 - 15:00)",
                                    booking: morningBooking,
                                  })
                                }
                                className={cn(
                                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer border transition",
                                  morningBooking.bookingStatus === "Confirmed"
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                    : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                                )}
                              >
                                <span
                                  className={cn(
                                    "h-1.5 w-1.5 rounded-full",
                                    morningBooking.bookingStatus === "Confirmed" ? "bg-emerald-600" : "bg-amber-500"
                                  )}
                                />
                                <span>{morningBooking.eventName} ({morningBooking.bookingStatus})</span>
                              </div>
                            ) : (
                              <div
                                onClick={() =>
                                  setSelectedSlotModal({
                                    venue,
                                    slot: "Morning (09:00 - 15:00)",
                                  })
                                }
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50/70 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100 transition cursor-pointer text-xs font-semibold"
                                title="Available Slot - Click for details"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <span>Available</span>
                              </div>
                            )}
                          </td>

                          {/* Evening Slot */}
                          <td className="py-3 px-4 text-center">
                            {fullDayBooking ? (
                              <div
                                onClick={() =>
                                  setSelectedSlotModal({
                                    venue,
                                    slot: "Full Day (09:00 - 23:30)",
                                    booking: fullDayBooking,
                                  })
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold hover:bg-purple-100 transition cursor-pointer"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-purple-600" />
                                <span>Full Day: {fullDayBooking.eventName}</span>
                              </div>
                            ) : eveningBooking ? (
                              <div
                                onClick={() =>
                                  setSelectedSlotModal({
                                    venue,
                                    slot: "Evening (18:00 - 23:30)",
                                    booking: eveningBooking,
                                  })
                                }
                                className={cn(
                                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer border transition",
                                  eveningBooking.bookingStatus === "Confirmed"
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                    : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                                )}
                              >
                                <span
                                  className={cn(
                                    "h-1.5 w-1.5 rounded-full",
                                    eveningBooking.bookingStatus === "Confirmed" ? "bg-emerald-600" : "bg-amber-500"
                                  )}
                                />
                                <span>{eveningBooking.eventName} ({eveningBooking.bookingStatus})</span>
                              </div>
                            ) : (
                              <div
                                onClick={() =>
                                  setSelectedSlotModal({
                                    venue,
                                    slot: "Evening (18:00 - 23:30)",
                                  })
                                }
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50/70 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100 transition cursor-pointer text-xs font-semibold"
                                title="Available Slot - Click for details"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <span>Available</span>
                              </div>
                            )}
                          </td>

                          {/* Tariff */}
                          <td className="py-3 px-4 text-right">
                            <span className="font-bold text-slate-900 font-mono text-xs">
                              ₹{venue.fullDayRate.toLocaleString()}
                            </span>
                            <span className="block text-[10px] text-slate-400 font-mono">₹{venue.halfDayRate.toLocaleString()} Half Day</span>
                          </td>
                        </tr>
                      );
                    }

                    // Multi-Day Columns (Week or Month view)
                    return (
                      <tr key={venue.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 sticky left-0 bg-white border-r border-slate-200 z-10">
                          <strong className="text-xs font-semibold text-slate-900 block truncate">{venue.name}</strong>
                          <span className="text-[11px] text-slate-500 font-medium">{venue.category}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-mono text-xs font-bold text-slate-800">{venue.maxCapacity}</span>
                        </td>
                        {dateColumns.map((col) => {
                          const morningBooking = getSlotBookingForDate(venue.id, "Morning", col.iso);
                          const eveningBooking = getSlotBookingForDate(venue.id, "Evening", col.iso);
                          const fullDayBooking = getSlotBookingForDate(venue.id, "FullDay", col.iso);

                          return (
                            <td key={col.iso} className="py-2.5 px-2 text-center border-l border-slate-200/60 text-[10px]">
                              {fullDayBooking ? (
                                <div
                                  onClick={() => {
                                    setSelectedDate(col.iso);
                                    setTimeRange("day");
                                  }}
                                  title={`Full Day: ${fullDayBooking.eventName} - Click to open day view`}
                                  className="w-10 h-7 rounded-lg bg-purple-600 text-white font-bold flex items-center justify-center mx-auto cursor-pointer shadow-2xs hover:scale-105 transition text-[10px]"
                                >
                                  FD
                                </div>
                              ) : (morningBooking || eveningBooking) ? (
                                <div className="flex items-center justify-center gap-1">
                                  {morningBooking && (
                                    <div
                                      onClick={() => {
                                        setSelectedDate(col.iso);
                                        setTimeRange("day");
                                      }}
                                      title={`Morning: ${morningBooking.eventName} - Click to open day view`}
                                      className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center cursor-pointer shadow-2xs hover:scale-105 transition text-[9px]"
                                    >
                                      AM
                                    </div>
                                  )}
                                  {eveningBooking && (
                                    <div
                                      onClick={() => {
                                        setSelectedDate(col.iso);
                                        setTimeRange("day");
                                      }}
                                      title={`Evening: ${eveningBooking.eventName} - Click to open day view`}
                                      className="w-7 h-7 rounded-lg bg-amber-500 text-white font-bold flex items-center justify-center cursor-pointer shadow-2xs hover:scale-105 transition text-[9px]"
                                    >
                                      PM
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div
                                  onClick={() => {
                                    setSelectedDate(col.iso);
                                    setTimeRange("day");
                                  }}
                                  title={`Available on ${col.formatted} - Click to view single day availability`}
                                  className="w-10 h-7 rounded-lg bg-emerald-50 border border-emerald-200/80 hover:bg-emerald-100 cursor-pointer transition mx-auto"
                                />
                              )}
                            </td>
                          );
                        })}
                        <td className="py-3 px-4 text-right font-mono text-xs font-bold text-slate-900">
                          ₹{venue.fullDayRate.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={dateColumns.length + 3} className="py-8 text-center text-slate-500 text-xs">
                      No venues found matching your search parameters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ROOM AVAILABILITY MATRIX GRID (VIEW-ONLY, MATCHING VENUE MATRIX) */
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-[11px] font-semibold tracking-wider text-slate-500 uppercase border-b border-slate-200">
                {timeRange === "day" ? (
                  <tr>
                    <th className="py-3 px-4">Room Category</th>
                    <th className="py-3 px-4 text-center">Total Inventory</th>
                    <th className="py-3 px-4 text-center">Available Vacant Rooms</th>
                    <th className="py-3 px-4 text-center">Booked / Occupied</th>
                    <th className="py-3 px-4 text-center">Maintenance</th>
                    <th className="py-3 px-4 text-right">Tariff / Night</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="py-3 px-4 min-w-[200px] sticky left-0 bg-slate-50 border-r border-slate-200 z-10">
                      Room Category
                    </th>
                    <th className="py-3 px-3 text-center min-w-[70px]">Inventory</th>
                    {dateColumns.map((col) => {
                      const isSelected = col.iso === selectedDate;
                      return (
                        <th
                          key={col.iso}
                          onClick={() => {
                            setSelectedDate(col.iso);
                            setTimeRange("day");
                          }}
                          title="Click to view single day detail for this date"
                          className={cn(
                            "py-3 px-3 text-center min-w-[110px] border-l border-slate-200/60 cursor-pointer transition select-none",
                            isSelected
                              ? "bg-slate-900 text-white font-bold"
                              : "hover:bg-slate-100 text-slate-600"
                          )}
                        >
                          {col.formatted}
                        </th>
                      );
                    })}
                    <th className="py-3 px-4 text-right min-w-[100px]">Tariff</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRooms.length > 0 ? (
                  filteredRooms.map((room) => {
                    if (timeRange === "day") {
                      return (
                        <tr key={room.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4">
                            <strong className="text-xs font-semibold text-slate-900 block">{room.categoryName}</strong>
                            <span className="text-[11px] text-slate-400">Target Date: {selectedDate}</span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span className="font-bold text-slate-800 font-mono text-xs">{room.totalInventory}</span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/90 text-xs font-semibold">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              <span>{room.availableRooms} Available</span>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-xs font-semibold">
                              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                              <span>{room.bookedRooms} Booked</span>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              <span>{room.maintenanceRooms} Maintenance</span>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <span className="font-bold text-slate-900 font-mono text-xs">
                              ₹{room.startingPrice.toLocaleString()}
                            </span>
                            <span className="block text-[10px] text-slate-400 font-mono">/ Night</span>
                          </td>
                        </tr>
                      );
                    }

                    // Multi-Day Columns for Room Availability (Week & Month views)
                    return (
                      <tr key={room.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 sticky left-0 bg-white border-r border-slate-200 z-10">
                          <strong className="text-xs font-semibold text-slate-900 block truncate">{room.categoryName}</strong>
                          <span className="text-[11px] text-slate-500 font-medium">{room.totalInventory} Rooms Total</span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className="font-mono text-xs font-bold text-slate-800">{room.totalInventory}</span>
                        </td>

                        {dateColumns.map((col) => {
                          // Simple deterministic mock variation based on date offset
                          const dateDay = parseInt(col.iso.split("-")[2], 10);
                          const avail = Math.max(1, (room.availableRooms + (dateDay % 5) - 2) % room.totalInventory);
                          const isFullyBooked = avail === 0;

                          return (
                            <td key={col.iso} className="py-2.5 px-2 text-center border-l border-slate-200/60 text-[10px]">
                              {isFullyBooked ? (
                                <div
                                  onClick={() => {
                                    setSelectedDate(col.iso);
                                    setTimeRange("day");
                                  }}
                                  title={`Fully Booked on ${col.formatted}`}
                                  className="w-10 h-7 rounded-lg bg-slate-200 text-slate-700 font-bold flex items-center justify-center mx-auto cursor-pointer shadow-2xs hover:scale-105 transition text-[9px]"
                                >
                                  FULL
                                </div>
                              ) : (
                                <div
                                  onClick={() => {
                                    setSelectedDate(col.iso);
                                    setTimeRange("day");
                                  }}
                                  title={`${avail} rooms available on ${col.formatted} - Click to view single day details`}
                                  className="w-10 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold flex items-center justify-center mx-auto cursor-pointer hover:bg-emerald-100 transition text-[10px] shadow-2xs"
                                >
                                  {avail}
                                </div>
                              )}
                            </td>
                          );
                        })}

                        <td className="py-3 px-4 text-right font-mono text-xs font-bold text-slate-900">
                          ₹{room.startingPrice.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={dateColumns.length + 3} className="py-8 text-center text-slate-500 text-xs">
                      No room categories found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. SLOT DETAILS VIEW MODAL (READ-ONLY) */}
      {selectedSlotModal && (
        <Modal
          isOpen={Boolean(selectedSlotModal)}
          onClose={() => setSelectedSlotModal(null)}
          title={`Venue Slot Details - ${selectedSlotModal.venue.name}`}
          description={`Date: ${selectedDate} | Slot: ${selectedSlotModal.slot}`}
          size="md"
        >
          {selectedSlotModal.booking ? (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <strong className="text-sm font-bold text-slate-900">{selectedSlotModal.booking.eventName}</strong>
                  <StatusBadge status={selectedSlotModal.booking.bookingStatus} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Client / Host:</span>
                    <strong className="text-slate-900">{selectedSlotModal.booking.clientName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Pax Count:</span>
                    <strong className="text-slate-900">{selectedSlotModal.booking.expectedPax} Guests</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Sales Executive:</span>
                    <strong className="text-slate-900">{selectedSlotModal.booking.salesExecutive}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Rooms Blocked:</span>
                    <strong className="text-emerald-800 font-bold">{selectedSlotModal.booking.roomsBlocked} Rooms</strong>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSlotModal(null)}
                  className="rounded-lg text-xs font-semibold px-4"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/90 space-y-2">
                <h4 className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" /> Slot Available
                </h4>
                <p className="text-slate-700">
                  This slot is available on <strong>{selectedDate}</strong> for <strong>{selectedSlotModal.venue.name}</strong>.
                </p>
                <div className="p-3 rounded-lg bg-white border border-emerald-200 text-slate-600 text-[11px] flex items-start gap-2">
                  <Lock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Front Office Process Directive:</strong> Booking entries and room allocations are created and finalized through Front Office Operations. Contact Front Office Desk for reservation processing.
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSlotModal(null)}
                  className="rounded-lg text-xs font-semibold px-4"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </ModulePageShell>
  );
}

