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
import { Button, Drawer, Modal, StatusBadge } from "@/components/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
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
            className="rounded-full text-xs font-bold border-slate-300 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1.5 px-4 cursor-pointer"
          >
            <ArrowLeftRight className="h-3.5 w-3.5 text-purple-700" /> Compare Channels
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setToastMessage("Full Channel Manager ARI sync triggered! Pushing Rates & Inventory to all OTAs...")}
            className="rounded-full text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm flex items-center gap-1.5 px-4 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Trigger Channel Sync
          </Button>
        </div>
      }
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. OTA PERFORMANCE RANKINGS & TOP METRICS
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">🏆 Top Revenue Channel</span>
          <div className="flex items-center justify-between">
            <strong className="text-sm font-extrabold text-slate-900">{metrics.topRevenueOta.name}</strong>
            <span className="text-xs font-extrabold font-mono text-emerald-800">₹{(metrics.topRevenueOta.monthlyRevenue / 100000).toFixed(2)}L</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Contrib: {metrics.topRevenueOta.occupancyContribution}% of Total Rooms</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">📦 Top Bookings Channel</span>
          <div className="flex items-center justify-between">
            <strong className="text-sm font-extrabold text-slate-900">{metrics.topBookingOta.name}</strong>
            <span className="text-xs font-extrabold font-mono text-blue-800">{metrics.topBookingOta.monthlyBookings} Bookings</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Nights Sold: {metrics.topBookingOta.roomNightsSold} Room Nights</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">💎 Top ADR Channel</span>
          <div className="flex items-center justify-between">
            <strong className="text-sm font-extrabold text-slate-900">{metrics.topAdrOta.name}</strong>
            <span className="text-xs font-extrabold font-mono text-purple-900">₹{metrics.topAdrOta.adr.toLocaleString()}</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Lead Time: {metrics.topAdrOta.avgLeadTimeDays} Days Avg</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">⚠️ Highest Commission</span>
          <div className="flex items-center justify-between">
            <strong className="text-sm font-extrabold text-slate-900">{metrics.highestCommissionOta.name}</strong>
            <span className="text-xs font-extrabold font-mono text-amber-800">{metrics.highestCommissionOta.commissionRate}% Comm</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Monthly Cut: ₹{metrics.highestCommissionOta.commissionCost.toLocaleString()}</span>
        </div>
      </div>



      {/* ─────────────────────────────────────────────────────────────
          3. VISUAL CHARTS & REVENUE CONTRIBUTION SECTION
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {/* Revenue Contribution Breakdown */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 md:col-span-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <PieChart className="h-4 w-4 text-emerald-600" /> Revenue &amp; Commission Breakdown by OTA
            </h4>
            <span className="text-xs font-mono font-bold text-slate-500">Gross: ₹{(metrics.totalRev / 100000).toFixed(2)}L</span>
          </div>

          <div className="space-y-2.5 pt-1">
            {channels.map((c) => {
              const pct = ((c.monthlyRevenue / metrics.totalRev) * 100).toFixed(1);
              return (
                <div key={c.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-slate-100 text-[10px] flex items-center justify-center font-mono text-slate-700">{c.code}</span>
                      <span>{c.name}</span>
                    </span>
                    <span className="font-mono">
                      ₹{c.monthlyRevenue.toLocaleString()} <span className="text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex">
                    <div className="bg-emerald-600 h-full" style={{ width: `${pct}%` }} title={`Net Revenue: ₹${c.netPayout.toLocaleString()}`} />
                    <div className="bg-amber-400 h-full" style={{ width: `${(c.commissionCost / metrics.totalRev) * 100}%` }} title={`Commission Cut: ₹${c.commissionCost.toLocaleString()}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Profitability Scores Summary */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Crown className="h-4 w-4 text-purple-600" /> Channel Profitability Index
            </h4>
            <p className="text-[10px] text-slate-500 mt-1">Evaluated based on ADR, Net Payout, and Cancellation Rates</p>

            <div className="space-y-2 pt-3">
              {channels.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-bold text-slate-800">{c.name}</span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-extrabold border",
                      c.profitabilityScore === "High"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : c.profitabilityScore === "Medium"
                        ? "bg-blue-100 text-blue-800 border-blue-300"
                        : "bg-amber-100 text-amber-800 border-amber-300"
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
          4. MAIN OTA CHANNELS PERFORMANCE TABLE
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search channel partner name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white font-medium text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
          <span className="bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200 text-[11px] font-bold">
            All Reservations Direct Synced to Front Office
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">OTA Partner</th>
                <th className="py-3.5 px-4 text-center">Bookings / Nights</th>
                <th className="py-3.5 px-4 text-right">Gross Revenue</th>
                <th className="py-3.5 px-4 text-center">Comm. %</th>
                <th className="py-3.5 px-4 text-right">Net Payout</th>
                <th className="py-3.5 px-4 text-right">ADR</th>
                <th className="py-3.5 px-4 text-center">Cancellation %</th>
                <th className="py-3.5 px-4 text-center">Lead Time</th>
                <th className="py-3.5 px-4 text-center">Profitability</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredChannels.length > 0 ? (
                filteredChannels.map((ota) => (
                  <tr key={ota.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-800 font-extrabold flex items-center justify-center text-[10px] border border-emerald-200/80 shrink-0">
                          {ota.logoBadge}
                        </span>
                        <div>
                          <strong className="text-xs font-bold text-slate-900 block">{ota.name}</strong>
                          <span className="text-[10px] text-slate-400">Sync: {ota.lastSyncTime}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <strong className="text-xs font-extrabold font-mono text-slate-900 block">{ota.monthlyBookings}</strong>
                      <span className="text-[10px] text-slate-400">{ota.roomNightsSold} Nights</span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-extrabold font-mono text-slate-900">
                      ₹{ota.monthlyRevenue.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="bg-slate-100 text-slate-800 font-mono font-bold px-2 py-0.5 rounded text-[11px]">
                        {ota.commissionRate}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-extrabold font-mono text-emerald-800">
                      ₹{ota.netPayout.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700">
                      ₹{ota.adr.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={cn(
                          "font-mono font-bold text-xs px-2 py-0.5 rounded-full",
                          ota.cancellationRate > 10
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-slate-100 text-slate-700"
                        )}
                      >
                        {ota.cancellationRate}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                      {ota.avgLeadTimeDays} Days
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-extrabold border",
                          ota.profitabilityScore === "High"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : ota.profitabilityScore === "Medium"
                            ? "bg-blue-100 text-blue-800 border-blue-300"
                            : "bg-amber-100 text-amber-800 border-amber-300"
                        )}
                      >
                        {ota.profitabilityScore}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDrawerChannel(ota)}
                          className="rounded-lg text-xs font-bold px-2.5 h-7 border-slate-200 cursor-pointer"
                        >
                          <BarChart3 className="h-3 w-3 mr-1" /> Analytics
                        </Button>
                      </div>
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
          5. OTA DETAILED ANALYTICS DRAWER
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
                  className="rounded-full text-[10px] font-bold bg-slate-900 text-white px-3 py-1"
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
          6. OTA COMPARISON SIDE-BY-SIDE TOOL MODAL
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
                className="rounded-full text-xs font-bold px-4"
              >
                Close Comparison
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          7. ROOM MAPPING MODAL
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
                className="rounded-full text-xs font-bold px-4"
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
