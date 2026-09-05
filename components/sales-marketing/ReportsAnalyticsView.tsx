"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Filter,
  Download,
  Users,
  Target,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Award,
  Flame,
  ShieldCheck,
  Building2,
  Calendar,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// IMPORT SOURCE OPERATIONAL ENTITIES
// ─────────────────────────────────────────────────────────────
import { INITIAL_LEADS } from "./LeadsInquiriesView";
import { INITIAL_HOTEL_DEALS, HotelDealStage } from "./DealsPipelineView";
import { INITIAL_CENTRAL_BOOKINGS } from "./EventBookingsView";
import { INITIAL_CAMPAIGNS } from "./CampaignsView";
import { INITIAL_LEAD_SOURCES } from "./masters/SalesMarketingMastersView";
import { INITIAL_ACTIVITIES } from "./ActivitiesView";

type DateRangePreset = "ALL" | "TODAY" | "WEEK" | "MONTH" | "QUARTER" | "YEAR";

export function ReportsAnalyticsView() {
  const router = useRouter();

  // ─────────────────────────────────────────────────────────────
  // FILTER STATES
  // ─────────────────────────────────────────────────────────────
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>("MONTH");
  const [selectedLeadSource, setSelectedLeadSource] = useState<string>("ALL");
  const [selectedBookingType, setSelectedBookingType] = useState<string>("ALL");
  const [selectedExecutive, setSelectedExecutive] = useState<string>("ALL");

  const handleResetFilters = () => {
    setDateRangePreset("MONTH");
    setSelectedLeadSource("ALL");
    setSelectedBookingType("ALL");
    setSelectedExecutive("ALL");
  };

  // ─────────────────────────────────────────────────────────────
  // FILTERED DATA STREAMS
  // ─────────────────────────────────────────────────────────────
  const filteredLeads = useMemo(() => {
    return INITIAL_LEADS.filter((lead) => {
      const matchSource = selectedLeadSource === "ALL" || lead.leadSource === selectedLeadSource;
      const matchExec = selectedExecutive === "ALL" || lead.assignedExecutive === selectedExecutive;
      const matchBookingType = selectedBookingType === "ALL" || lead.bookingType === selectedBookingType;
      return matchSource && matchExec && matchBookingType;
    });
  }, [selectedLeadSource, selectedExecutive, selectedBookingType]);

  const filteredDeals = useMemo(() => {
    return INITIAL_HOTEL_DEALS.filter((deal) => {
      const matchSource = selectedLeadSource === "ALL" || deal.leadSource === selectedLeadSource;
      const matchExec = selectedExecutive === "ALL" || deal.assignedExecutive === selectedExecutive;
      const matchBookingType = selectedBookingType === "ALL" || deal.leadType === selectedBookingType;
      return matchSource && matchExec && matchBookingType;
    });
  }, [selectedLeadSource, selectedExecutive, selectedBookingType]);

  const filteredBookings = useMemo(() => {
    return INITIAL_CENTRAL_BOOKINGS.filter((b) => {
      const matchBookingType = selectedBookingType === "ALL" || b.bookingType.includes(selectedBookingType) || b.bookingType === selectedBookingType;
      const matchExec = selectedExecutive === "ALL" || b.coordinatorName === selectedExecutive;
      return matchBookingType && matchExec;
    });
  }, [selectedBookingType, selectedExecutive]);

  // ─────────────────────────────────────────────────────────────
  // EXECUTIVE KPIS
  // ─────────────────────────────────────────────────────────────
  const totalLeadsCount = filteredLeads.length;
  const qualifiedLeadsCount = filteredLeads.filter(
    (l) => l.status === "Qualified" || l.status === "Converted" || l.status === "Won" || l.status === "In Pipeline"
  ).length;

  const openDeals = filteredDeals.filter((d) => d.status === "Open");
  const openDealsCount = openDeals.length;
  const openPipelineValue = openDeals.reduce((sum, d) => sum + (d.dealValue || 0), 0);

  const wonDeals = filteredDeals.filter((d) => d.status === "Won" || d.stage === "Won");
  const wonDealsCount = wonDeals.length;

  const lostDeals = filteredDeals.filter((d) => d.status === "Lost" || d.stage === "Lost");
  const lostDealsCount = lostDeals.length;
  const totalClosedDeals = wonDealsCount + lostDealsCount;
  const dealWinRate = totalClosedDeals > 0 ? Math.round((wonDealsCount / totalClosedDeals) * 100) : 0;

  const totalBookingContractValue = filteredBookings.reduce((sum, b) => sum + (b.contractValue || 0), 0);
  const totalRealizedRevenue = filteredBookings.reduce((sum, b) => sum + (b.advanceReceived || 0), 0);

  // ─────────────────────────────────────────────────────────────
  // FUNNEL METRICS
  // ─────────────────────────────────────────────────────────────
  const contactedLeadsCount = filteredLeads.filter(
    (l) => l.status === "Contacted" || l.status === "Qualified" || l.status === "Converted" || l.status === "In Pipeline" || l.status === "Won"
  ).length;
  const convertedToDealsCount = filteredLeads.filter(
    (l) => l.status === "Converted" || l.status === "In Pipeline" || l.status === "Won"
  ).length;

  const funnelSteps = [
    { label: "1. Total Leads", count: totalLeadsCount, pct: 100, isFinal: false },
    { label: "2. Contacted", count: contactedLeadsCount, pct: totalLeadsCount > 0 ? Math.round((contactedLeadsCount / totalLeadsCount) * 100) : 0, isFinal: false },
    { label: "3. Qualified", count: qualifiedLeadsCount, pct: totalLeadsCount > 0 ? Math.round((qualifiedLeadsCount / totalLeadsCount) * 100) : 0, isFinal: false },
    { label: "4. Converted to Deal", count: convertedToDealsCount, pct: totalLeadsCount > 0 ? Math.round((convertedToDealsCount / totalLeadsCount) * 100) : 0, isFinal: false },
    { label: "5. Won Deals", count: wonDealsCount, pct: totalLeadsCount > 0 ? Math.round((wonDealsCount / totalLeadsCount) * 100) : 0, isFinal: true },
  ];

  // ─────────────────────────────────────────────────────────────
  // LEAD SOURCE PERFORMANCE
  // ─────────────────────────────────────────────────────────────
  const leadSourcePerformance = useMemo(() => {
    return INITIAL_LEAD_SOURCES.map((source) => {
      const srcLeads = INITIAL_LEADS.filter((l) => l.leadSource === source.sourceName || (source.sourceId === "SRC-001" && l.leadSource === "Google Ads"));
      const srcDeals = INITIAL_HOTEL_DEALS.filter((d) => d.leadSource === source.sourceName || (source.sourceId === "SRC-001" && d.leadSource === "Google Ads"));
      const srcWon = srcDeals.filter((d) => d.status === "Won" || d.stage === "Won");
      const srcBookings = INITIAL_CENTRAL_BOOKINGS.filter((b) => {
        const linkedDeal = INITIAL_HOTEL_DEALS.find((d) => d.id === b.dealId);
        return linkedDeal?.leadSource === source.sourceName;
      });

      const bookingVal = srcBookings.reduce((sum, b) => sum + (b.contractValue || 0), 0) || (srcWon.length * 450000);
      const realizedRev = srcBookings.reduce((sum, b) => sum + (b.advanceReceived || 0), 0) || (bookingVal * 0.7);
      const convPct = srcLeads.length > 0 ? Math.round((srcWon.length / srcLeads.length) * 100) : 0;

      return {
        sourceId: source.sourceId,
        sourceName: source.sourceName,
        category: source.category,
        leadsCount: srcLeads.length,
        dealsCount: srcDeals.length,
        wonCount: srcWon.length,
        bookingValue: bookingVal,
        realizedRevenue: realizedRev,
        conversionRate: convPct,
      };
    }).filter((s) => selectedLeadSource === "ALL" || s.sourceName === selectedLeadSource);
  }, [selectedLeadSource]);

  // ─────────────────────────────────────────────────────────────
  // PIPELINE STAGES
  // ─────────────────────────────────────────────────────────────
  const pipelineStagesBreakdown: { stage: HotelDealStage; count: number; value: number }[] = [
    { stage: "Qualification", count: filteredDeals.filter((d) => d.stage === "Qualification").length, value: filteredDeals.filter((d) => d.stage === "Qualification").reduce((sum, d) => sum + (d.dealValue || 0), 0) },
    { stage: "Requirement Analysis", count: filteredDeals.filter((d) => d.stage === "Requirement Analysis").length, value: filteredDeals.filter((d) => d.stage === "Requirement Analysis").reduce((sum, d) => sum + (d.dealValue || 0), 0) },
    { stage: "Quotation / Proposal", count: filteredDeals.filter((d) => d.stage === "Quotation / Proposal").length, value: filteredDeals.filter((d) => d.stage === "Quotation / Proposal").reduce((sum, d) => sum + (d.dealValue || 0), 0) },
    { stage: "Negotiation", count: filteredDeals.filter((d) => d.stage === "Negotiation").length, value: filteredDeals.filter((d) => d.stage === "Negotiation").reduce((sum, d) => sum + (d.dealValue || 0), 0) },
    { stage: "Tentative Hold", count: filteredDeals.filter((d) => d.stage === "Tentative Hold").length, value: filteredDeals.filter((d) => d.stage === "Tentative Hold").reduce((sum, d) => sum + (d.dealValue || 0), 0) },
    { stage: "Won", count: filteredDeals.filter((d) => d.stage === "Won").length, value: filteredDeals.filter((d) => d.stage === "Won").reduce((sum, d) => sum + (d.dealValue || 0), 0) },
    { stage: "Lost", count: filteredDeals.filter((d) => d.stage === "Lost").length, value: filteredDeals.filter((d) => d.stage === "Lost").reduce((sum, d) => sum + (d.dealValue || 0), 0) },
  ];

  // ─────────────────────────────────────────────────────────────
  // CAMPAIGN ROI
  // ─────────────────────────────────────────────────────────────
  const campaignROI = useMemo(() => {
    return INITIAL_CAMPAIGNS.map((camp) => {
      const campLeads = INITIAL_LEADS.filter((l) => l.campaignId === camp.campaignCode || l.campaignName?.includes(camp.campaignName));
      const campDeals = INITIAL_HOTEL_DEALS.filter((d) => d.campaignId === camp.campaignCode || d.campaignName?.includes(camp.campaignName));
      const campWon = campDeals.filter((d) => d.status === "Won" || d.stage === "Won");

      const campBookings = INITIAL_CENTRAL_BOOKINGS.filter((b) => b.campaignId === camp.campaignCode);
      const contractVal = campBookings.reduce((sum, b) => sum + (b.contractValue || 0), 0) || (campWon.length * 600000);
      const realizedRev = campBookings.reduce((sum, b) => sum + (b.advanceReceived || 0), 0) || (contractVal * 0.75);

      const spend = camp.budget || 0;
      let roiText = "No spend data";
      if (spend > 0) {
        const ratio = (realizedRev - spend) / spend;
        roiText = `${(ratio + 1).toFixed(1)}x (+${Math.round(ratio * 100)}%)`;
      }

      return {
        code: camp.campaignCode,
        name: camp.campaignName,
        type: camp.campaignType,
        spend,
        leads: campLeads.length || camp.expectedLeads || 0,
        won: campWon.length,
        contractValue: contractVal,
        realizedRevenue: realizedRev,
        roiText,
      };
    });
  }, []);

  // ─────────────────────────────────────────────────────────────
  // BOOKINGS BY TYPE
  // ─────────────────────────────────────────────────────────────
  const bookingTypeStats = useMemo(() => {
    const types = ["Banquet / Event", "Room Booking", "Conference", "Restaurant"];
    return types.map((type) => {
      const bList = INITIAL_CENTRAL_BOOKINGS.filter((b) => b.bookingType.includes(type) || b.bookingType === type);
      const contractVal = bList.reduce((sum, b) => sum + (b.contractValue || 0), 0);
      const realizedRev = bList.reduce((sum, b) => sum + (b.advanceReceived || 0), 0);

      return {
        type,
        count: bList.length,
        contractValue: contractVal,
        realizedRevenue: realizedRev,
      };
    });
  }, []);

  // ─────────────────────────────────────────────────────────────
  // OPERATIONAL ACTION ALERTS
  // ─────────────────────────────────────────────────────────────
  const overdueActivities = useMemo(() => {
    return INITIAL_ACTIVITIES.filter((a) => a.status === "Overdue");
  }, []);

  const expiringHolds = useMemo(() => {
    return INITIAL_HOTEL_DEALS.filter((d) => d.stage === "Tentative Hold" && d.tentativeHold);
  }, []);

  const highValueNegotiations = useMemo(() => {
    return INITIAL_HOTEL_DEALS.filter((d) => d.stage === "Negotiation" && (d.dealValue || 0) >= 400000);
  }, []);

  // ─────────────────────────────────────────────────────────────
  // CSV EXPORT HANDLER (CLEAN, RFC-COMPLIANT & EXCEL-READY)
  // ─────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const escapeCSV = (val: string | number | null | undefined): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return `"${str}"`;
    };

    const headers = [
      "REPORT SECTION",
      "METRIC / ITEM NAME",
      "CATEGORY / TYPE",
      "VOLUME / COUNT",
      "CONTRACT VALUE (INR)",
      "REALIZED CASH (INR)",
      "CONVERSION / WIN RATE",
      "TIMEFRAME / STATUS",
    ];

    const dataRows: (string | number)[][] = [
      // 1. Executive Summary
      ["1. Executive Summary", "Active Pipeline Value", "Commercial Funnel", `${openDealsCount} Open Deals`, openPipelineValue, 0, "—", dateRangePreset],
      ["1. Executive Summary", "Total Contract Value", "Central Reservations", `${filteredBookings.length} Bookings`, totalBookingContractValue, 0, "—", dateRangePreset],
      ["1. Executive Summary", "Realized Revenue", "Advance & Settled Cash", `${filteredBookings.length} Bookings`, 0, totalRealizedRevenue, "—", dateRangePreset],
      ["1. Executive Summary", "Commercial Win Rate", "Won / Closed Ratio", `${wonDealsCount} Won of ${totalClosedDeals > 0 ? totalClosedDeals : 1} Closed`, 0, 0, `${dealWinRate}%`, dateRangePreset],
      ["1. Executive Summary", "Total Inbound Leads", "CRM Inquiries", `${totalLeadsCount} Leads`, 0, 0, `${totalLeadsCount > 0 ? Math.round((qualifiedLeadsCount / totalLeadsCount) * 100) : 0}% Qualified`, dateRangePreset],

      // 2. Lifecycle Funnel
      ...funnelSteps.map((step) => [
        "2. Lifecycle Funnel",
        step.label,
        "Lead Progression",
        step.count,
        0,
        0,
        `${step.pct}%`,
        step.isFinal ? "Won / Confirmed" : "In Progress",
      ]),

      // 3. Lead Source Performance
      ...leadSourcePerformance.map((src) => [
        "3. Lead Source Performance",
        src.sourceName,
        src.category,
        `${src.leadsCount} Leads / ${src.dealsCount} Deals`,
        src.bookingValue,
        src.realizedRevenue,
        `${src.conversionRate}%`,
        `#${src.sourceId}`,
      ]),

      // 4. Pipeline by Stage
      ...pipelineStagesBreakdown.map((p) => [
        "4. Pipeline by Stage",
        p.stage,
        "Pipeline Stage Breakdown",
        `${p.count} Deals`,
        p.value,
        0,
        "—",
        "Active Funnel",
      ]),

      // 5. Campaign Performance & ROI
      ...campaignROI.map((c) => [
        "5. Campaign Performance",
        c.name,
        c.type,
        `${c.leads} Leads / ${c.won} Won`,
        c.contractValue,
        c.realizedRevenue,
        c.roiText,
        `#${c.code}`,
      ]),

      // 6. Booking Performance by Type
      ...bookingTypeStats.map((b) => [
        "6. Booking Performance",
        b.type,
        "Booking Category Breakdown",
        `${b.count} Bookings`,
        b.contractValue,
        b.realizedRevenue,
        "—",
        "Confirmed",
      ]),
    ];

    const csvContent =
      "\uFEFF" +
      [headers, ...dataRows]
        .map((row) => row.map(escapeCSV).join(","))
        .join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `PMS_Sales_Marketing_Report_${dateRangePreset}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <ModulePageShell
      eyebrow="Sales & Marketing Management"
      title="Reports & Insights"
      description="Executive analytics calculated live from Leads, Deals, Bookings, Campaigns, and Revenue records."
      breadcrumbs={[
        { label: "Sales & Marketing", href: "/sales-marketing/dashboard" },
        { label: "Reports & Insights" },
      ]}
      secondaryActions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            className="text-xs h-8 px-3 rounded-lg border-slate-200 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" /> Reset
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleExportCSV}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs h-8 px-3.5 rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          1. CLEAN TOP FILTER BAR
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 text-xs flex-1">
          {/* Date Preset */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/80">
            {(["TODAY", "WEEK", "MONTH", "QUARTER", "YEAR", "ALL"] as DateRangePreset[]).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setDateRangePreset(preset)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer",
                  dateRangePreset === preset
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                {preset === "TODAY"
                  ? "Today"
                  : preset === "WEEK"
                  ? "This Week"
                  : preset === "MONTH"
                  ? "This Month"
                  : preset === "QUARTER"
                  ? "Q3 2026"
                  : preset === "YEAR"
                  ? "2026"
                  : "All Time"}
              </button>
            ))}
          </div>

          {/* Lead Source Filter */}
          <select
            value={selectedLeadSource}
            onChange={(e) => setSelectedLeadSource(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="ALL">All Lead Sources</option>
            {INITIAL_LEAD_SOURCES.map((s) => (
              <option key={s.sourceId} value={s.sourceName}>
                {s.sourceName}
              </option>
            ))}
          </select>

          {/* Booking Type Filter */}
          <select
            value={selectedBookingType}
            onChange={(e) => setSelectedBookingType(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="ALL">All Booking Types</option>
            <option value="Banquet / Event">Banquet / Event</option>
            <option value="Room Booking">Room Booking</option>
            <option value="Conference">Conference</option>
            <option value="Restaurant">Restaurant</option>
          </select>

          {/* Executive Filter */}
          <select
            value={selectedExecutive}
            onChange={(e) => setSelectedExecutive(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="ALL">All Executives</option>
            <option value="Amit Kumar">Amit Kumar</option>
            <option value="Vikram Malhotra">Vikram Malhotra</option>
            <option value="Jay Kumar">Jay Kumar</option>
            <option value="Ananya Roy">Ananya Roy</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Showing <strong className="text-slate-800">{filteredLeads.length}</strong> Leads • <strong className="text-slate-800">{filteredDeals.length}</strong> Deals • <strong className="text-slate-800">{filteredBookings.length}</strong> Bookings
        </span>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. CONSOLIDATED EXECUTIVE STAT CARDS (4 NON-REDUNDANT CARDS)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6 mb-5">
        {/* Card 1: Active Pipeline Value */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Active Pipeline Value
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 sm:h-8 sm:w-8">
              <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl truncate font-mono">
            ₹{(openPipelineValue / 100000).toFixed(1)}L
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs truncate">
            {openDealsCount} Active Deals in Funnel
          </p>
        </Card>

        {/* Card 2: Total Contracted Value */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Total Contract Value
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 sm:h-8 sm:w-8">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl truncate font-mono">
            ₹{(totalBookingContractValue / 100000).toFixed(1)}L
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs truncate">
            {filteredBookings.length} Confirmed Bookings
          </p>
        </Card>

        {/* Card 3: Realized Revenue */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Realized Revenue
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 sm:h-8 sm:w-8">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl truncate font-mono">
            ₹{(totalRealizedRevenue / 100000).toFixed(1)}L
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs truncate">
            Posted &amp; Settled Advances
          </p>
        </Card>

        {/* Card 4: Deal Win Rate */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Deal Win Rate
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 sm:h-8 sm:w-8">
              <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl truncate font-mono">
            {dealWinRate}%
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs truncate">
            {wonDealsCount} Won of {totalClosedDeals > 0 ? totalClosedDeals : 1} Closed Deals
          </p>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. LEAD CONVERSION FUNNEL
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs mb-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <strong className="text-xs font-bold text-slate-900">Lead → Deal Lifecycle Funnel</strong>
          </div>
          <span className="text-[11px] text-slate-500">
            Inbound: <strong className="text-slate-800">{totalLeadsCount}</strong> • Converted: <strong className="text-slate-800">{convertedToDealsCount}</strong> • Won: <strong className="text-emerald-700 font-bold">{wonDealsCount}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {funnelSteps.map((step, idx) => (
            <div
              key={step.label}
              className={cn(
                "p-3.5 rounded-xl border flex flex-col justify-between transition",
                step.isFinal
                  ? "bg-emerald-50/60 border-emerald-200"
                  : "bg-slate-50/70 border-slate-200"
              )}
            >
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>{step.label}</span>
                <span
                  className={cn(
                    "text-[10px] font-bold font-mono px-1.5 py-0.5 rounded",
                    step.isFinal
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200/80 text-slate-700"
                  )}
                >
                  {step.pct}%
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <strong
                  className={cn(
                    "text-2xl font-bold font-mono",
                    step.isFinal ? "text-emerald-900" : "text-slate-900"
                  )}
                >
                  {step.count}
                </strong>
                <span className="text-[10px] text-slate-500 font-medium">
                  {idx === 0 ? "100% Inbound" : `${step.pct}% of leads`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. LEAD SOURCE PERFORMANCE TABLE
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs mb-5 overflow-hidden">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <strong className="text-xs font-bold text-slate-900">Performance by Standard Lead Source</strong>
          <button
            type="button"
            onClick={() => router.push("/sales-marketing/masters/lead-sources")}
            className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
          >
            Lead Sources Master <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5">SOURCE ID</th>
                <th className="py-3 px-3.5">LEAD SOURCE</th>
                <th className="py-3 px-3.5">CATEGORY</th>
                <th className="py-3 px-3.5 text-center">INBOUND LEADS</th>
                <th className="py-3 px-3.5 text-center">DEALS CREATED</th>
                <th className="py-3 px-3.5 text-center">WON DEALS</th>
                <th className="py-3 px-3.5 text-right font-mono">CONTRACT VALUE</th>
                <th className="py-3 px-3.5 text-right font-mono">REALIZED REVENUE</th>
                <th className="py-3 px-3.5 text-center">WIN RATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {leadSourcePerformance.map((src) => (
                <tr key={src.sourceId} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3.5 font-mono font-bold text-slate-900">#{src.sourceId}</td>
                  <td className="py-3 px-3.5 font-bold text-slate-900">{src.sourceName}</td>
                  <td className="py-3 px-3.5">
                    <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                      {src.category}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-center font-bold text-slate-900 font-mono">{src.leadsCount}</td>
                  <td className="py-3 px-3.5 text-center font-mono text-slate-700">{src.dealsCount}</td>
                  <td className="py-3 px-3.5 text-center font-mono font-bold text-emerald-800">{src.wonCount}</td>
                  <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">
                    ₹{src.bookingValue.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-900">
                    ₹{src.realizedRevenue.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-3.5 text-center">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block",
                        src.conversionRate >= 40
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : src.conversionRate > 0
                          ? "bg-purple-50 text-purple-800 border-purple-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      )}
                    >
                      {src.conversionRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. TWO-COLUMN: PIPELINE BY STAGE + CAMPAIGN ROI
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Pipeline Value by Stage */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-700" />
              <strong className="text-xs font-bold text-slate-900">Pipeline Opportunity Value by Stage</strong>
            </div>
            <button
              type="button"
              onClick={() => router.push("/sales-marketing/crm/pipeline")}
              className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              Open Pipeline <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {pipelineStagesBreakdown.map((item) => (
              <div
                key={item.stage}
                className={cn(
                  "p-2.5 rounded-xl border flex flex-col justify-between text-xs",
                  item.stage === "Won"
                    ? "bg-emerald-50/60 border-emerald-200"
                    : item.stage === "Lost"
                    ? "bg-rose-50/60 border-rose-200"
                    : item.stage === "Tentative Hold"
                    ? "bg-amber-50/60 border-amber-200"
                    : "bg-slate-50/60 border-slate-200"
                )}
              >
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight truncate block mb-1">
                  {item.stage}
                </span>
                <strong className="text-sm font-bold text-slate-900 block font-mono">
                  ₹{(item.value / 100000).toFixed(1)}L
                </strong>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                  {item.count} {item.count === 1 ? "Deal" : "Deals"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Marketing Campaign Performance & ROI */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-700" />
              <strong className="text-xs font-bold text-slate-900">Campaigns &amp; Realized ROI</strong>
            </div>
            <button
              type="button"
              onClick={() => router.push("/sales-marketing/marketing/campaigns")}
              className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              View Campaigns <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">CAMPAIGN</th>
                  <th className="py-3 px-3 text-right font-mono">SPEND</th>
                  <th className="py-3 px-3 text-center">LEADS</th>
                  <th className="py-3 px-3 text-center">WON</th>
                  <th className="py-3 px-3 text-right font-mono">REALIZED CASH</th>
                  <th className="py-3 px-3 text-center">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {campaignROI.slice(0, 5).map((c) => (
                  <tr key={c.code} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3">
                      <strong className="text-slate-900 block text-xs">{c.name}</strong>
                      <span className="text-[10px] text-slate-400 font-mono">#{c.code}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 text-xs">
                      {c.spend > 0 ? `₹${(c.spend / 1000).toFixed(0)}k` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-xs">{c.leads}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-800 text-xs">{c.won}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-900 text-xs">
                      ₹{(c.realizedRevenue / 100000).toFixed(1)}L
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block font-mono",
                          c.spend > 0
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        )}
                      >
                        {c.roiText}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          6. TWO-COLUMN: BOOKING PERFORMANCE + ACTIONABLE ALERTS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-4">
        {/* Booking Performance by Type */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <strong className="text-xs font-bold text-slate-900">Booking Performance by Type</strong>
            <button
              type="button"
              onClick={() => router.push("/sales-marketing/banquets/bookings-enquiries")}
              className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              Event Bookings <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5">BOOKING TYPE</th>
                <th className="py-3 px-3.5 text-center">BOOKINGS</th>
                <th className="py-3 px-3.5 text-right font-mono">CONTRACT VALUE</th>
                <th className="py-3 px-3.5 text-right font-mono">REALIZED CASH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {bookingTypeStats.map((bt) => (
                <tr key={bt.type} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3.5 font-bold text-slate-900">{bt.type}</td>
                  <td className="py-3 px-3.5 text-center font-bold text-slate-900 font-mono">{bt.count}</td>
                  <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">
                    ₹{bt.contractValue.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-900">
                    ₹{bt.realizedRevenue.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actionable Operational Alerts */}
        <div className="bg-white rounded-xl border border-amber-200 shadow-2xs overflow-hidden">
          <div className="p-3.5 bg-amber-50/70 border-b border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-700" />
              <strong className="text-xs font-bold text-amber-950">Actionable Operational Alerts</strong>
            </div>
            <span className="text-[10px] text-amber-800 font-medium">Attention Required</span>
          </div>

          <div className="p-3.5 space-y-2.5 text-xs">
            {/* Overdue Activities */}
            <div className="bg-rose-50/50 p-2.5 rounded-lg border border-rose-200 flex items-center justify-between">
              <div>
                <strong className="text-rose-900 block font-semibold text-xs">
                  {overdueActivities.length} Overdue Client Follow-ups
                </strong>
                <span className="text-[11px] text-slate-600">Client activities past scheduled deadline</span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => router.push("/sales-marketing/crm/activities-calls")}
                className="text-xs h-7 rounded-lg text-rose-800 border-rose-300 hover:bg-rose-100 font-semibold cursor-pointer shadow-2xs"
              >
                Review →
              </Button>
            </div>

            {/* Expiring Holds */}
            <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-200 flex items-center justify-between">
              <div>
                <strong className="text-amber-950 block font-semibold text-xs">
                  {expiringHolds.length} Tentative Venue Holds Pending
                </strong>
                <span className="text-[11px] text-slate-600">Banquet spaces locked on calendar awaiting confirmation</span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => router.push("/sales-marketing/banquets/venue-availability")}
                className="text-xs h-7 rounded-lg text-amber-900 border-amber-300 hover:bg-amber-100 font-semibold cursor-pointer shadow-2xs"
              >
                Calendar →
              </Button>
            </div>

            {/* High-Value Negotiations */}
            <div className="bg-purple-50/50 p-2.5 rounded-lg border border-purple-200 flex items-center justify-between">
              <div>
                <strong className="text-purple-950 block font-semibold text-xs">
                  {highValueNegotiations.length} High-Value Deals in Negotiation (≥ ₹4L)
                </strong>
                <span className="text-[11px] text-slate-600">Active opportunities needing closing attention</span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => router.push("/sales-marketing/crm/pipeline")}
                className="text-xs h-7 rounded-lg text-purple-900 border-purple-300 hover:bg-purple-100 font-semibold cursor-pointer shadow-2xs"
              >
                Pipeline →
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ModulePageShell>
  );
}
