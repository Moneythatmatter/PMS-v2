"use client";

import React, { useState, useMemo } from "react";
import {
  Globe,
  TrendingUp,
  DollarSign,
  Percent,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  Layers,
  BarChart3,
  Calendar,
  Building2,
  Eye,
  Settings2,
  Award,
  Crown,
  Zap,
  BedDouble,
  UserCheck,
  X,
  ChevronRight,
  PieChart,
  ArrowLeftRight,
  Sliders,
  Check,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Card, Drawer, Modal, StatusBadge } from "@/components/ui";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// ENHANCED SCHEMAS & INTERFACES FOR HOTEL CHANNEL MANAGER
// ─────────────────────────────────────────────────────────────

export interface OtaChannel {
  id: string;
  name: string;
  code: string; // e.g. MMT, BKG, AGD, EXPD
  logoBadge: string;
  status: "Active Sync" | "Sync Delayed" | "Sync Error" | "Paused";
  
  // Financial & Booking Metrics
  monthlyRevenue: number;
  monthlyBookings: number;
  roomNightsSold: number;
  commissionRate: number; // e.g. 15%
  commissionCost: number; // monthlyRevenue * commissionRate / 100
  netPayout: number;
  adr: number; // Average Daily Rate
  profitabilityScore: "High" | "Medium" | "Low";
  occupancyContribution: number; // e.g. 28.5%

  // Guest Quality & Lead Time Metrics
  cancellationRate: number; // e.g. 5.8%
  avgStayNights: number; // e.g. 2.4 nights
  avgLeadTimeDays: number; // e.g. 18 days
  growthRatePercent: number; // e.g. +14.2% MoM

  // Channel Manager Sync Health
  lastSyncTime: string;
  inventoryPushStatus: "Success" | "Syncing" | "Error";
  ratePushStatus: "Success" | "Rate Mismatch" | "Error";
  restrictionPushStatus: "Success" | "Pending" | "Error";
  syncWarnings?: string[];

  // Room Mapping Configuration
  roomMappings: {
    pmsRoomCategory: string;
    otaMappedRoomName: string;
    inventoryAllocated: number;
    syncState: "Mapped" | "Unmapped";
  }[];
}

// ─────────────────────────────────────────────────────────────
// INITIAL ENRICHED CHANNEL MANAGER MOCK DATA
// ─────────────────────────────────────────────────────────────

export const INITIAL_OTA_CHANNELS: OtaChannel[] = [
  {
    id: "OTA-01",
    name: "Booking.com",
    code: "BKG",
    logoBadge: "BKG",
    status: "Active Sync",
    monthlyRevenue: 1820000,
    monthlyBookings: 285,
    roomNightsSold: 420,
    commissionRate: 15.0,
    commissionCost: 273000,
    netPayout: 1547000,
    adr: 4333,
    profitabilityScore: "High",
    occupancyContribution: 34.2,
    cancellationRate: 5.8,
    avgStayNights: 2.5,
    avgLeadTimeDays: 18,
    growthRatePercent: 14.5,
    lastSyncTime: "Just now",
    inventoryPushStatus: "Success",
    ratePushStatus: "Success",
    restrictionPushStatus: "Success",
    roomMappings: [
      { pmsRoomCategory: "Standard Room", otaMappedRoomName: "Standard Double", inventoryAllocated: 10, syncState: "Mapped" },
      { pmsRoomCategory: "Deluxe King Room", otaMappedRoomName: "Deluxe King Room with City View", inventoryAllocated: 15, syncState: "Mapped" },
      { pmsRoomCategory: "Royal Heritage Suite", otaMappedRoomName: "Heritage Executive Suite", inventoryAllocated: 5, syncState: "Mapped" },
    ],
  },
  {
    id: "OTA-02",
    name: "MakeMyTrip / Goibibo",
    code: "MMT",
    logoBadge: "MMT",
    status: "Active Sync",
    monthlyRevenue: 1450000,
    monthlyBookings: 240,
    roomNightsSold: 350,
    commissionRate: 16.5,
    commissionCost: 239250,
    netPayout: 1210750,
    adr: 4142,
    profitabilityScore: "High",
    occupancyContribution: 28.5,
    cancellationRate: 6.4,
    avgStayNights: 2.1,
    avgLeadTimeDays: 12,
    growthRatePercent: 9.8,
    lastSyncTime: "2 mins ago",
    inventoryPushStatus: "Success",
    ratePushStatus: "Success",
    restrictionPushStatus: "Success",
    roomMappings: [
      { pmsRoomCategory: "Standard Room", otaMappedRoomName: "MMT Standard Queen", inventoryAllocated: 8, syncState: "Mapped" },
      { pmsRoomCategory: "Deluxe King Room", otaMappedRoomName: "MMT Premium Deluxe", inventoryAllocated: 12, syncState: "Mapped" },
      { pmsRoomCategory: "Executive Twin Room", otaMappedRoomName: "MMT Executive Twin", inventoryAllocated: 10, syncState: "Mapped" },
    ],
  },
  {
    id: "OTA-03",
    name: "Agoda",
    code: "AGD",
    logoBadge: "AGD",
    status: "Active Sync",
    monthlyRevenue: 680000,
    monthlyBookings: 110,
    roomNightsSold: 165,
    commissionRate: 14.0,
    commissionCost: 95200,
    netPayout: 584800,
    adr: 4121,
    profitabilityScore: "Medium",
    occupancyContribution: 13.4,
    cancellationRate: 14.2,
    avgStayNights: 1.8,
    avgLeadTimeDays: 8,
    growthRatePercent: 4.2,
    lastSyncTime: "12 mins ago",
    inventoryPushStatus: "Success",
    ratePushStatus: "Rate Mismatch",
    restrictionPushStatus: "Success",
    syncWarnings: ["Rate Mismatch: Deluxe King ARI discrepancy ₹200 lower on Agoda."],
    roomMappings: [
      { pmsRoomCategory: "Standard Room", otaMappedRoomName: "Agoda Standard Room", inventoryAllocated: 5, syncState: "Mapped" },
      { pmsRoomCategory: "Deluxe King Room", otaMappedRoomName: "Agoda Super Deluxe", inventoryAllocated: 8, syncState: "Mapped" },
    ],
  },
  {
    id: "OTA-04",
    name: "Expedia Group",
    code: "EXPD",
    logoBadge: "EXPD",
    status: "Sync Delayed",
    monthlyRevenue: 520000,
    monthlyBookings: 78,
    roomNightsSold: 110,
    commissionRate: 18.0,
    commissionCost: 93600,
    netPayout: 426400,
    adr: 4727,
    profitabilityScore: "Low",
    occupancyContribution: 9.0,
    cancellationRate: 11.5,
    avgStayNights: 2.8,
    avgLeadTimeDays: 24,
    growthRatePercent: -2.1,
    lastSyncTime: "45 mins ago",
    inventoryPushStatus: "Syncing",
    ratePushStatus: "Success",
    restrictionPushStatus: "Pending",
    syncWarnings: ["Sync Delayed: ARI update buffer pending acknowledgment."],
    roomMappings: [
      { pmsRoomCategory: "Deluxe King Room", otaMappedRoomName: "Expedia Deluxe Suite", inventoryAllocated: 6, syncState: "Mapped" },
      { pmsRoomCategory: "Royal Heritage Suite", otaMappedRoomName: "Expedia Luxury Suite", inventoryAllocated: 3, syncState: "Mapped" },
    ],
  },
  {
    id: "OTA-05",
    name: "Trip.com / Yatra",
    code: "YTR",
    logoBadge: "YTR",
    status: "Active Sync",
    monthlyRevenue: 340000,
    monthlyBookings: 55,
    roomNightsSold: 80,
    commissionRate: 15.0,
    commissionCost: 51000,
    netPayout: 289000,
    adr: 4250,
    profitabilityScore: "Medium",
    occupancyContribution: 6.5,
    cancellationRate: 7.1,
    avgStayNights: 1.9,
    avgLeadTimeDays: 10,
    growthRatePercent: 6.5,
    lastSyncTime: "5 mins ago",
    inventoryPushStatus: "Success",
    ratePushStatus: "Success",
    restrictionPushStatus: "Success",
    roomMappings: [
      { pmsRoomCategory: "Standard Room", otaMappedRoomName: "Yatra Standard Room", inventoryAllocated: 4, syncState: "Mapped" },
    ],
  },
];

export function OtaChannelPerformanceView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Drawer & Modal States
  const [selectedDrawerChannel, setSelectedDrawerChannel] = useState<OtaChannel | null>(null);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [mappingChannel, setMappingChannel] = useState<OtaChannel | null>(null);

  // Channel Comparison Selection State
  const [compareChannelAId, setCompareChannelAId] = useState<string>("OTA-02"); // Booking.com
  const [compareChannelBId, setCompareChannelBId] = useState<string>("OTA-01"); // MMT

  const channels = INITIAL_OTA_CHANNELS;

  // ─────────────────────────────────────────────────────────────
  // HIGH-LEVEL AGGREGATE METRICS & RANKINGS
  // ─────────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const totalRev = channels.reduce((s, c) => s + c.monthlyRevenue, 0);
    const totalBookings = channels.reduce((s, c) => s + c.monthlyBookings, 0);
    const totalNet = channels.reduce((s, c) => s + c.netPayout, 0);
    const totalCommCost = channels.reduce((s, c) => s + c.commissionCost, 0);
    const avgCommission = (channels.reduce((s, c) => s + c.commissionRate, 0) / channels.length).toFixed(1);

    // Rankings
    const topRevenueOta = [...channels].sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)[0];
    const topBookingOta = [...channels].sort((a, b) => b.monthlyBookings - a.monthlyBookings)[0];
    const topAdrOta = [...channels].sort((a, b) => b.adr - a.adr)[0];
    const highestCommissionOta = [...channels].sort((a, b) => b.commissionRate - a.commissionRate)[0];

    // Channel Health Count
    const activeSyncCount = channels.filter((c) => c.status === "Active Sync").length;
    const syncWarningCount = channels.filter((c) => (c.syncWarnings && c.syncWarnings.length > 0) || c.status !== "Active Sync").length;

    return {
      totalRev,
      totalBookings,
      totalNet,
      totalCommCost,
      avgCommission,
      topRevenueOta,
      topBookingOta,
      topAdrOta,
      highestCommissionOta,
      activeSyncCount,
      syncWarningCount,
    };
  }, [channels]);

  // Filtered Channels for Table
  const filteredChannels = useMemo(() => {
    return channels.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [channels, searchTerm]);

  // Selected Channels for Comparison Tool
  const compareChannelA = channels.find((c) => c.id === compareChannelAId) || channels[0];
  const compareChannelB = channels.find((c) => c.id === compareChannelBId) || channels[1];

  return (
    <ModulePageShell
      eyebrow="Sales & Marketing / Revenue Operations"
      title="OTA & Channel Performance Analytics"
      description="Real-time 2-way Channel Manager ARI sync, channel profitability analytics, lead time trends, and room mapping control."
      breadcrumbs={[
        { label: "Sales & Marketing", href: "/sales-marketing/dashboard" },
        { label: "OTA Performance" },
      ]}
      actionButtons={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsCompareModalOpen(true)}
            className="rounded-lg text-xs font-semibold border-slate-200 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1.5 px-3.5 py-1.5 cursor-pointer shadow-2xs"
          >
            <ArrowLeftRight className="h-3.5 w-3.5 text-slate-600" /> Compare Channels
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setToastMessage("Full Channel Manager ARI sync triggered! Pushing Rates & Inventory to all OTAs...")}
            className="rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-2xs flex items-center gap-1.5 px-3.5 py-1.5 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Trigger Channel Sync
          </Button>
        </div>
      }
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. OTA PERFORMANCE RANKINGS & TOP METRICS (MATCHING F&B DASHBOARD STYLE)
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6 mb-5">
        {/* Card 1: Top Revenue Partner */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Top Revenue Partner
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 sm:h-8 sm:w-8">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl truncate">
            {metrics.topRevenueOta.name}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs truncate">
            ₹{(metrics.topRevenueOta.monthlyRevenue / 100000).toFixed(2)}L • {metrics.topRevenueOta.occupancyContribution}% of Total
          </p>
        </Card>

        {/* Card 2: Top Bookings Partner */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Top Bookings Partner
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 sm:h-8 sm:w-8">
              <BedDouble className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl truncate">
            {metrics.topBookingOta.name}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs truncate">
            {metrics.topBookingOta.monthlyBookings} Bookings • {metrics.topBookingOta.roomNightsSold} Nights
          </p>
        </Card>

        {/* Card 3: Highest ADR Partner */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Highest ADR Partner
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 sm:h-8 sm:w-8">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl truncate">
            {metrics.topAdrOta.name}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs truncate">
            ₹{metrics.topAdrOta.adr.toLocaleString("en-IN")} ADR • {metrics.topAdrOta.avgLeadTimeDays}d Lead Time
          </p>
        </Card>

        {/* Card 4: Average Commission */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Average Commission
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 sm:h-8 sm:w-8">
              <Percent className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl truncate">
            {metrics.avgCommission}%
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs truncate">
            Highest: {metrics.highestCommissionOta.name} ({metrics.highestCommissionOta.commissionRate}%)
          </p>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. VISUAL CHARTS & REVENUE CONTRIBUTION SECTION
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {/* Revenue Contribution Breakdown */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 md:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <PieChart className="h-4 w-4 text-emerald-600" /> Revenue &amp; Commission Breakdown by OTA
              </h4>
              <p className="text-[11px] text-slate-500">Gross production vs. OTA commission deduction</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-800">Gross: ₹{(metrics.totalRev / 100000).toFixed(2)}L</span>
          </div>

          <div className="space-y-3 pt-1">
            {channels.map((c) => {
              const pct = ((c.monthlyRevenue / metrics.totalRev) * 100).toFixed(1);
              return (
                <div key={c.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-800">
                    <span className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{c.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({c.code})</span>
                    </span>
                    <span className="font-mono font-semibold">
                      ₹{c.monthlyRevenue.toLocaleString("en-IN")} <span className="text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex">
                    <div className="bg-emerald-600 h-full transition-all" style={{ width: `${pct}%` }} title={`Net Revenue: ₹${c.netPayout.toLocaleString("en-IN")}`} />
                    <div className="bg-amber-400 h-full transition-all" style={{ width: `${(c.commissionCost / metrics.totalRev) * 100}%` }} title={`Commission Cut: ₹${c.commissionCost.toLocaleString("en-IN")}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Profitability Scores Summary */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-2.5">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Award className="h-4 w-4 text-emerald-600" /> Channel Profitability Index
              </h4>
              <p className="text-[11px] text-slate-500">Evaluated on ADR, Net Payout, and Cancellations</p>
            </div>

            <div className="space-y-2 pt-3">
              {channels.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-800">{c.name}</span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold border",
                      c.profitabilityScore === "High"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : c.profitabilityScore === "Medium"
                        ? "bg-slate-100 text-slate-700 border-slate-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    )}
                  >
                    {c.profitabilityScore} Profit
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MAIN OTA CHANNELS PERFORMANCE TABLE (CLEAN PMS FORMAT)
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search channel partner name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>Showing <strong className="font-semibold text-slate-800">{filteredChannels.length}</strong> of {channels.length} channels</span>
          <span className="h-3 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Channel Sync: <strong className="text-emerald-700 font-semibold">Live 2-Way Front Office Sync</strong></span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-left">OTA PARTNER</th>
                <th className="py-3 px-4 text-center">BOOKINGS / NIGHTS</th>
                <th className="py-3 px-4 text-right">GROSS REVENUE</th>
                <th className="py-3 px-4 text-center">COMM. %</th>
                <th className="py-3 px-4 text-right">NET PAYOUT</th>
                <th className="py-3 px-4 text-right">ADR</th>
                <th className="py-3 px-4 text-center">CANCELLATION %</th>
                <th className="py-3 px-4 text-center">LEAD TIME</th>
                <th className="py-3 px-4 text-center">PROFITABILITY</th>
                <th className="py-3 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredChannels.length > 0 ? (
                filteredChannels.map((ota) => (
                  <tr key={ota.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="p-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 shrink-0 font-mono text-[10px] font-bold">
                          {ota.code}
                        </span>
                        <div>
                          <strong className="text-xs font-bold text-slate-900 block">{ota.name}</strong>
                          <span className="text-[10px] text-slate-400">Sync: {ota.lastSyncTime}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <strong className="text-xs font-bold font-mono text-slate-900 block">{ota.monthlyBookings}</strong>
                      <span className="text-[10px] text-slate-400">{ota.roomNightsSold} Nights</span>
                    </td>

                    <td className="py-3 px-4 text-right font-bold font-mono text-slate-900">
                      ₹{ota.monthlyRevenue.toLocaleString("en-IN")}
                    </td>

                    <td className="py-3 px-4 text-center font-mono text-slate-700">
                      {ota.commissionRate}%
                    </td>

                    <td className="py-3 px-4 text-right font-bold font-mono text-emerald-800">
                      ₹{ota.netPayout.toLocaleString("en-IN")}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-700">
                      ₹{ota.adr.toLocaleString("en-IN")}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={cn(
                          "font-mono font-bold text-xs px-2 py-0.5 rounded",
                          ota.cancellationRate > 10
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "text-slate-700"
                        )}
                      >
                        {ota.cancellationRate}%
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center font-mono text-slate-700">
                      {ota.avgLeadTimeDays} Days
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold border",
                          ota.profitabilityScore === "High"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : ota.profitabilityScore === "Medium"
                            ? "bg-slate-100 text-slate-700 border-slate-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        )}
                      >
                        {ota.profitabilityScore}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDrawerChannel(ota)}
                        className="rounded-lg text-xs font-semibold px-2.5 h-7 border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs"
                      >
                        <BarChart3 className="h-3 w-3 mr-1 text-slate-500" /> Analytics
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500 text-xs">
                    No OTA channels found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. OTA DETAILED ANALYTICS DRAWER
         ───────────────────────────────────────────────────────────── */}
      {selectedDrawerChannel && (
        <Drawer
          isOpen={Boolean(selectedDrawerChannel)}
          onClose={() => setSelectedDrawerChannel(null)}
          title={`${selectedDrawerChannel.name} (${selectedDrawerChannel.code})`}
        >
          <div className="space-y-5 text-xs p-1">
            {/* KPI Cards in Drawer */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] block font-semibold uppercase">Gross Revenue</span>
                <strong className="text-slate-900 font-mono text-sm">₹{selectedDrawerChannel.monthlyRevenue.toLocaleString()}</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] block font-semibold uppercase">Commission Cut ({selectedDrawerChannel.commissionRate}%)</span>
                <strong className="text-amber-800 font-mono text-sm">₹{selectedDrawerChannel.commissionCost.toLocaleString()}</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] block font-semibold uppercase">Net Hotel Payout</span>
                <strong className="text-emerald-800 font-mono text-sm">₹{selectedDrawerChannel.netPayout.toLocaleString()}</strong>
              </div>
            </div>

            {/* Guest Quality & Booking Trends */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Guest Behavior &amp; Booking Trends</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-400 text-[10px] block">Average Daily Rate (ADR):</span>
                  <strong className="text-slate-900 font-mono">₹{selectedDrawerChannel.adr.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Average Lead Time:</span>
                  <strong className="text-slate-900">{selectedDrawerChannel.avgLeadTimeDays} Days Before Arrival</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Cancellation Rate:</span>
                  <strong className={cn(selectedDrawerChannel.cancellationRate > 10 ? "text-red-700 font-bold" : "text-slate-900")}>
                    {selectedDrawerChannel.cancellationRate}%
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Occupancy Contribution:</span>
                  <strong className="text-emerald-800 font-bold">{selectedDrawerChannel.occupancyContribution}% of Total Rooms</strong>
                </div>
              </div>
            </div>

            {/* Sync & Channel Manager Health */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">2-Way Channel Sync Status</h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                  <span>Inventory Push:</span>
                  <strong className="text-emerald-800">{selectedDrawerChannel.inventoryPushStatus}</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                  <span>Rate Push:</span>
                  <strong className={cn(selectedDrawerChannel.ratePushStatus === "Rate Mismatch" ? "text-amber-800 font-bold" : "text-slate-900")}>
                    {selectedDrawerChannel.ratePushStatus}
                  </strong>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                  <span>Restrictions:</span>
                  <strong className="text-slate-900">{selectedDrawerChannel.restrictionPushStatus}</strong>
                </div>
              </div>

              {selectedDrawerChannel.syncWarnings && selectedDrawerChannel.syncWarnings.length > 0 && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>{selectedDrawerChannel.syncWarnings[0]}</span>
                </div>
              )}
            </div>

            {/* Room Mapping Overview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">PMS Room Category Mapping</h4>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setMappingChannel(selectedDrawerChannel);
                    setIsMappingModalOpen(true);
                  }}
                  className="rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 cursor-pointer shadow-2xs"
                >
                  Configure Room Mapping
                </Button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                    <tr>
                      <th className="py-2 px-3">PMS Category</th>
                      <th className="py-2 px-3">OTA Mapped Room Name</th>
                      <th className="py-2 px-3 text-center">Allocated Rooms</th>
                      <th className="py-2 px-3 text-center">Sync State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedDrawerChannel.roomMappings.map((m, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 font-bold text-slate-900">{m.pmsRoomCategory}</td>
                        <td className="py-2 px-3 font-mono text-slate-700">{m.otaMappedRoomName}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold">{m.inventoryAllocated} Rooms</td>
                        <td className="py-2 px-3 text-center">
                          <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                            {m.syncState}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Drawer>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. OTA COMPARISON SIDE-BY-SIDE TOOL MODAL
         ───────────────────────────────────────────────────────────── */}
      {isCompareModalOpen && (
        <Modal
          isOpen={isCompareModalOpen}
          onClose={() => setIsCompareModalOpen(false)}
          title="OTA Channel Side-by-Side Performance Comparison"
          description="Compare revenue, commission rates, cancellation rates, and lead times between two channels."
          size="lg"
        >
          <div className="space-y-4 text-xs">
            {/* Selection Selectors */}
            <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Select First OTA Channel:</label>
                <select
                  value={compareChannelAId}
                  onChange={(e) => setCompareChannelAId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-bold text-slate-900 bg-white"
                >
                  {channels.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Select Second OTA Channel:</label>
                <select
                  value={compareChannelBId}
                  onChange={(e) => setCompareChannelBId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-bold text-slate-900 bg-white"
                >
                  {channels.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-3 gap-2 border border-slate-200 rounded-xl overflow-hidden text-xs">
              <div className="p-3 bg-slate-100 font-extrabold uppercase text-slate-600 text-[10px]">Metric</div>
              <div className="p-3 bg-emerald-50/70 font-extrabold text-emerald-900 text-center">{compareChannelA.name}</div>
              <div className="p-3 bg-blue-50/70 font-extrabold text-blue-900 text-center">{compareChannelB.name}</div>

              <div className="p-2.5 border-t border-slate-100 font-bold text-slate-700">Monthly Gross Revenue</div>
              <div className="p-2.5 border-t border-slate-100 text-center font-mono font-extrabold text-slate-900">
                ₹{compareChannelA.monthlyRevenue.toLocaleString()}
              </div>
              <div className="p-2.5 border-t border-slate-100 text-center font-mono font-extrabold text-slate-900">
                ₹{compareChannelB.monthlyRevenue.toLocaleString()}
              </div>

              <div className="p-2.5 border-t border-slate-100 font-bold text-slate-700">Commission Rate</div>
              <div className="p-2.5 border-t border-slate-100 text-center font-mono font-bold text-amber-800">
                {compareChannelA.commissionRate}%
              </div>
              <div className="p-2.5 border-t border-slate-100 text-center font-mono font-bold text-amber-800">
                {compareChannelB.commissionRate}%
              </div>

              <div className="p-2.5 border-t border-slate-100 font-bold text-slate-700">Net Hotel Payout</div>
              <div className="p-2.5 border-t border-slate-100 text-center font-mono font-extrabold text-emerald-800">
                ₹{compareChannelA.netPayout.toLocaleString()}
              </div>
              <div className="p-2.5 border-t border-slate-100 text-center font-mono font-extrabold text-emerald-800">
                ₹{compareChannelB.netPayout.toLocaleString()}
              </div>

              <div className="p-2.5 border-t border-slate-100 font-bold text-slate-700">Average Daily Rate (ADR)</div>
              <div className="p-2.5 border-t border-slate-100 text-center font-mono font-bold text-slate-900">
                ₹{compareChannelA.adr.toLocaleString()}
              </div>
              <div className="p-2.5 border-t border-slate-100 text-center font-mono font-bold text-slate-900">
                ₹{compareChannelB.adr.toLocaleString()}
              </div>

              <div className="p-2.5 border-t border-slate-100 font-bold text-slate-700">Cancellation Rate</div>
              <div className="p-2.5 border-t border-slate-100 text-center font-mono font-bold text-slate-800">
                {compareChannelA.cancellationRate}%
              </div>
              <div className="p-2.5 border-t border-slate-100 text-center font-mono font-bold text-slate-800">
                {compareChannelB.cancellationRate}%
              </div>

              <div className="p-2.5 border-t border-slate-100 font-bold text-slate-700">Avg Lead Time</div>
              <div className="p-2.5 border-t border-slate-100 text-center font-mono font-bold text-slate-800">
                {compareChannelA.avgLeadTimeDays} Days
              </div>
              <div className="p-2.5 border-t border-slate-100 text-center font-mono font-bold text-slate-800">
                {compareChannelB.avgLeadTimeDays} Days
              </div>

              <div className="p-2.5 border-t border-slate-100 font-bold text-slate-700">Profitability Rating</div>
              <div className="p-2.5 border-t border-slate-100 text-center font-extrabold text-emerald-800">
                {compareChannelA.profitabilityScore}
              </div>
              <div className="p-2.5 border-t border-slate-100 text-center font-extrabold text-emerald-800">
                {compareChannelB.profitabilityScore}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCompareModalOpen(false)}
                className="rounded-lg text-xs font-semibold px-4 py-2 border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
              >
                Close Comparison
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. ROOM MAPPING MODAL
         ───────────────────────────────────────────────────────────── */}
      {isMappingModalOpen && mappingChannel && (
        <Modal
          isOpen={isMappingModalOpen}
          onClose={() => setIsMappingModalOpen(false)}
          title={`Room Category Mapping - ${mappingChannel.name}`}
          description="Map PMS Room Categories to OTA rate plans and allocate channel inventory limits."
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              {mappingChannel.roomMappings.map((map, i) => (
                <div key={i} className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <strong className="text-slate-900 block">{map.pmsRoomCategory}</strong>
                    <span className="text-[10px] text-slate-400 font-mono">OTA: {map.otaMappedRoomName}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 block">{map.inventoryAllocated} Rooms</span>
                    <span className="text-[10px] text-emerald-700 font-bold">2-Way Synced</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsMappingModalOpen(false)}
                className="rounded-lg text-xs font-semibold px-4 py-2 border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
              >
                Close Mapping
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </ModulePageShell>
  );
}
