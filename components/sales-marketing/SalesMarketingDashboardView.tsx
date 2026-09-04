"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  Users,
  Building2,
  GitCommit,
  CalendarDays,
  Target,
  Phone,
  PhoneCall,
  Megaphone,
  Award,
  DollarSign,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  Briefcase,
  Layers,
  Sparkles,
  ChevronRight,
  UserPlus,
  FileSpreadsheet,
  Calendar,
  CheckSquare,
  Video,
  MapPin,
  Filter,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatMiniCard } from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import { StatusBadge } from "@/components/ui";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// MOCK DASHBOARD DATA (INSPIRED BY ZOHO CRM + HOTEL PMS REVENUE OPS)
// ─────────────────────────────────────────────────────────────

const MOCK_USER_SUMMARY = {
  userName: "Jay Kumar",
  userRole: "Senior Corporate & Banquet Sales Manager",
  openDealsCount: 6,
  untouchedLeadsCount: 1,
  callsTodayCount: 4,
  activeLeadsCount: 10,
  targetAchievedPct: 74.1,
  monthlyTarget: "₹65,00,000",
  achievedAmount: "₹48,20,000",
};

// Pipeline Funnel Data (By Stage) - Subtle Complementary Slate-to-Emerald Palette
const MOCK_PIPELINE_STAGES = [
  {
    stage: "Qualification / Inquiries",
    count: 14,
    amount: "₹65,00,000",
    barColor: "bg-slate-400",
    dotColor: "bg-slate-400",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
    widthPct: 100,
    sharePct: "32%",
  },
  {
    stage: "Site Visit / Needs Analysis",
    count: 9,
    amount: "₹42,50,000",
    barColor: "bg-slate-500",
    dotColor: "bg-slate-500",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
    widthPct: 75,
    sharePct: "21%",
  },
  {
    stage: "Proposal / Price Quote",
    count: 6,
    amount: "₹28,50,000",
    barColor: "bg-teal-500",
    dotColor: "bg-teal-500",
    badgeColor: "bg-teal-50 text-teal-800 border-teal-200/70",
    widthPct: 52,
    sharePct: "14%",
  },
  {
    stage: "Contract Negotiation",
    count: 4,
    amount: "₹18,20,000",
    barColor: "bg-emerald-600",
    dotColor: "bg-emerald-600",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200/70",
    widthPct: 35,
    sharePct: "9%",
  },
  {
    stage: "Closed Won / Booked",
    count: 18,
    amount: "₹48,20,000",
    barColor: "bg-emerald-700",
    dotColor: "bg-emerald-700",
    badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
    widthPct: 65,
    sharePct: "24%",
  },
];

// Open Tasks & Scheduled Meetings (Aligned with ActivitiesView schema)
const MOCK_MY_ACTIVITIES = [
  {
    id: "ACT-1002",
    title: "Hotel Site Visit — Reddy Family",
    type: "Site Visit" as const,
    time: "Today, 11:30 AM",
    location: "Grand Crystal Ballroom",
    contactPerson: "Pooja Hegde",
    priority: "High" as const,
    status: "Scheduled" as const,
  },
  {
    id: "ACT-1004",
    title: "Corporate LRA Contract Review — TCS",
    type: "Call" as const,
    time: "Today, 03:00 PM",
    location: "Conference Call",
    contactPerson: "Sunil Verma",
    priority: "Medium" as const,
    status: "Scheduled" as const,
  },
  {
    id: "ACT-1003",
    title: "Menu Tasting & BEO Finalization",
    type: "Meeting" as const,
    time: "Tomorrow, 02:00 PM",
    location: "Banquet Office",
    contactPerson: "Sharma Family",
    priority: "High" as const,
    status: "Scheduled" as const,
  },
];

const MOCK_MY_TASKS = [
  {
    id: "TSK-101",
    subject: "Send Wedding Quotation for 450 Pax",
    dueDate: "Today, 04:00 PM",
    priority: "High" as const,
    status: "In Progress" as const,
    deal: "Reddy & Sharma Wedding",
  },
  {
    id: "TSK-102",
    subject: "Follow up with TCS Corporate HR re: LRA Rates",
    dueDate: "19/08/2026",
    priority: "Medium" as const,
    status: "Not Started" as const,
    deal: "TCS Annual Corporate LRA",
  },
];

// Deals Closing This Month
const MOCK_CLOSING_DEALS = [
  { id: "DL-301", name: "Reddy & Verma Wedding Reception", company: "Reddy Family", amount: "₹14,50,000", closingDate: "Today", dateBadge: "bg-emerald-100 text-emerald-800 border-emerald-300", stage: "Contract Review" },
  { id: "DL-302", name: "HDFC Leadership Summit 2026", company: "HDFC Bank Ltd", amount: "₹5,80,000", closingDate: "Aug 19", dateBadge: "bg-blue-100 text-blue-800 border-blue-300", stage: "Proposal Sent" },
  { id: "DL-303", name: "Reliance Annual General Conference", company: "Reliance Industries", amount: "₹8,20,000", closingDate: "Aug 22", dateBadge: "bg-amber-100 text-amber-800 border-amber-300", stage: "In Negotiation" },
  { id: "DL-304", name: "Rotary International Gala Night", company: "Rotary Club", amount: "₹3,90,000", closingDate: "Aug 25", dateBadge: "bg-slate-100 text-slate-800 border-slate-300", stage: "Final Approval" },
];

// Upcoming Banquet Events
const MOCK_UPCOMING_BANQUETS = [
  { id: "BQ-801", eventName: "Verma & Sharma Wedding Reception", venue: "Grand Crystal Ballroom", pax: 450, date: "24 Aug 2026", beoStatus: "BEO Issued", totalAmount: "₹14,50,000" },
  { id: "BQ-802", eventName: "HDFC Annual Leadership Summit", venue: "Emerald Convention Hall", pax: 180, date: "28 Aug 2026", beoStatus: "Draft", totalAmount: "₹5,80,000" },
  { id: "BQ-803", eventName: "Rotary Club Gala Dinner", venue: "Poolside Lawns", pax: 220, date: "02 Sep 2026", beoStatus: "Approved", totalAmount: "₹3,90,000" },
];

// Active Marketing Campaigns
const MOCK_ACTIVE_CAMPAIGNS = [
  { id: "CMP-101", title: "Monsoon Wedding Special Package", channel: "WhatsApp & Instagram", leadsGenerated: 42, conversions: 8, status: "Active" },
  { id: "CMP-102", title: "Q3 Corporate Rate Drive", channel: "Email Broadcast", leadsGenerated: 65, conversions: 14, status: "Active" },
  { id: "CMP-103", title: "Independence Long Weekend Offer", channel: "Meta Ads", leadsGenerated: 89, conversions: 21, status: "Completed" },
];

// Top Producing Corporate Accounts (Key Accounts Production)
const MOCK_TOP_CORPORATE_ACCOUNTS = [
  {
    id: "CORP-101",
    companyName: "Tata Consultancy Services (TCS)",
    tier: "Platinum",
    roomNights: 142,
    revenue: "₹18,40,000",
    contactPerson: "Sunil Verma (Procurement)",
    contractStatus: "Active LRA",
  },
  {
    id: "CORP-102",
    companyName: "HDFC Bank Ltd",
    tier: "Gold",
    roomNights: 88,
    revenue: "₹11,20,000",
    contactPerson: "Anil Deshmukh (Admin)",
    contractStatus: "Active LRA",
  },
  {
    id: "CORP-103",
    companyName: "Reliance Industries",
    tier: "Platinum",
    roomNights: 65,
    revenue: "₹9,50,000",
    contactPerson: "Kavita Rao (HR & Events)",
    contractStatus: "Active LRA",
  },
];

export function SalesMarketingDashboardView() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  return (
    <ModulePageShell
      eyebrow="Sales & Marketing Module"
      title={`Welcome back, ${MOCK_USER_SUMMARY.userName}!`}
      description="Real-time sales pipeline, lead conversion metrics, corporate accounts revenue, banquet bookings, and marketing campaign performance."
      breadcrumbs={[
        { label: "Sales & Marketing", href: "/sales-marketing/dashboard" },
        { label: "Dashboard" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <a href="/sales-marketing/crm/leads">
            <Button size="sm" variant="outline" className="bg-white text-slate-700 border-slate-300 font-semibold text-xs rounded-xl shadow-xs">
              <UserPlus className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
              + Add Lead
            </Button>
          </a>
          <a href="/sales-marketing/crm/activities-calls">
            <Button size="sm" variant="outline" className="bg-white text-slate-700 border-slate-300 font-semibold text-xs rounded-xl shadow-xs">
              <Phone className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
              + Log Call / Visit
            </Button>
          </a>
          <a href="/sales-marketing/banquets/bookings-enquiries">
            <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs">
              <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
              New Banquet Booking
            </Button>
          </a>
        </div>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: ZOHO-STYLE QUICK COUNTER CARDS (4 CARDS)
      ───────────────────────────────────────────────────────────── */}
      <div className="mb-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 hover:border-emerald-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>My Open Deals</span>
            <GitCommit className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{MOCK_USER_SUMMARY.openDealsCount}</p>
          <p className="text-[11px] font-bold text-emerald-700 font-mono">Value: ₹42,85,000</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 hover:border-amber-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>My Untouched Leads</span>
            <UserPlus className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{MOCK_USER_SUMMARY.untouchedLeadsCount}</p>
          <p className="text-[11px] text-amber-700 font-bold">Needs Immediate Action</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 hover:border-blue-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>My Calls &amp; Visits Today</span>
            <Phone className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{MOCK_USER_SUMMARY.callsTodayCount}</p>
          <p className="text-[11px] text-blue-700 font-bold">4 Scheduled Activities</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 hover:border-purple-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>My Total Active Leads</span>
            <Users className="h-4 w-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{MOCK_USER_SUMMARY.activeLeadsCount}</p>
          <p className="text-[11px] text-purple-700 font-bold">28.5% Conversion Rate</p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: PIPELINE FUNNEL CHART + TASKS & MEETINGS SPLIT
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
        {/* Visual Pipeline Funnel (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <GitCommit className="h-4 w-4 text-emerald-700" />
                My Pipeline Deals By Stage
              </h3>
              <p className="text-[11px] text-slate-500">Visual funnel breakdown of active corporate &amp; banquet prospects</p>
            </div>
            <a href="/sales-marketing/crm/pipeline" className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
              Pipeline View <ChevronRight className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Interactive Clean Stage Funnel Visual */}
          <div className="space-y-3.5 pt-1">
            {MOCK_PIPELINE_STAGES.map((stg, idx) => (
              <a
                key={idx}
                href="/sales-marketing/crm/pipeline"
                className="block group p-2 -mx-2 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", stg.dotColor)} />
                    <span className="font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">
                      {stg.stage}
                    </span>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", stg.badgeColor)}>
                      {stg.count} {stg.count === 1 ? "Deal" : "Deals"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-medium">{stg.sharePct}</span>
                    <span className="font-mono font-bold text-slate-900">{stg.amount}</span>
                  </div>
                </div>

                {/* Sleek, Modern Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/70">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", stg.barColor)}
                    style={{ width: `${stg.widthPct}%` }}
                  />
                </div>
              </a>
            ))}
          </div>

          {/* Quick Pipeline Summary Footer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Total Active Pipeline: <strong className="text-slate-800 font-semibold">51 Deals</strong></span>
            <span>Total Value: <strong className="text-emerald-700 font-bold font-mono">₹2,02,40,000</strong></span>
          </div>
        </div>

        {/* My Tasks & Scheduled Activities Split Box (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-emerald-700" />
                My Open Tasks &amp; Activities
              </h3>
              <p className="text-[11px] text-slate-500">Scheduled follow-ups, calls &amp; client site visits</p>
            </div>
            <a href="/sales-marketing/crm/activities-calls" className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
              Activities &amp; Tasks <ChevronRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="space-y-4">
            {/* Scheduled Activities Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Scheduled Activities Today</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  {MOCK_MY_ACTIVITIES.length} Scheduled
                </span>
              </div>
              <div className="space-y-2">
                {MOCK_MY_ACTIVITIES.map((act) => (
                  <a
                    key={act.id}
                    href="/sales-marketing/crm/activities-calls"
                    className="block p-2.5 rounded-xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:bg-slate-50/70 transition shadow-2xs group"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="p-1.5 rounded-lg bg-slate-100 text-slate-700 shrink-0 mt-0.5">
                        {act.type === "Site Visit" && <MapPin className="h-3.5 w-3.5 text-purple-700" />}
                        {act.type === "Call" && <PhoneCall className="h-3.5 w-3.5 text-sky-700" />}
                        {act.type === "Meeting" && <Building2 className="h-3.5 w-3.5 text-slate-700" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5 mb-1">
                          <p className="font-bold text-slate-900 text-xs truncate group-hover:text-emerald-700 transition-colors">
                            {act.title}
                          </p>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold border shrink-0",
                              act.type === "Site Visit"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : act.type === "Call"
                                ? "bg-sky-50 text-sky-700 border-sky-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            )}
                          >
                            {act.type}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="truncate">👤 {act.contactPerson} • 📍 {act.location}</span>
                          <span className="font-mono text-slate-900 font-bold shrink-0 ml-2">{act.time}</span>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Open Priority Tasks Section */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Priority Follow-up Tasks</span>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  {MOCK_MY_TASKS.length} Tasks
                </span>
              </div>
              <div className="space-y-2">
                {MOCK_MY_TASKS.map((tsk) => (
                  <a
                    key={tsk.id}
                    href="/sales-marketing/crm/activities-calls"
                    className="block p-2.5 rounded-xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:bg-slate-50/70 transition shadow-2xs group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="p-1.5 rounded-lg bg-slate-100 text-slate-700 shrink-0 mt-0.5">
                          <CheckSquare className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-xs group-hover:text-emerald-700 transition-colors truncate">
                            {tsk.subject}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                            💼 {tsk.deal} • Due: {tsk.dueDate}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold border shrink-0",
                          tsk.status === "In Progress"
                            ? "bg-blue-50 text-blue-800 border-blue-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        )}
                      >
                        {tsk.status}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: DEALS CLOSING THIS MONTH + UPCOMING BANQUETS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
        {/* Deals Closing This Month (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                My Deals Closing This Month
              </h3>
              <p className="text-[11px] text-slate-500">Corporate &amp; event contracts near final clearance</p>
            </div>
            <a href="/sales-marketing/crm/pipeline" className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
              View All <ChevronRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Closing Date</th>
                  <th className="py-2.5 px-3">Deal Name / Company</th>
                  <th className="py-2.5 px-3">Stage</th>
                  <th className="py-2.5 px-3 text-right">Contract Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {MOCK_CLOSING_DEALS.map((dl) => (
                  <tr key={dl.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3">
                      <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-extrabold border", dl.dateBadge)}>
                        {dl.closingDate}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <p className="font-bold text-slate-900">{dl.name}</p>
                      <p className="text-[10px] text-slate-500">{dl.company}</p>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-200">
                        {dl.stage}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-950 font-mono">
                      {dl.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Banquet Events (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-purple-700" />
                Upcoming Banquet Events
              </h3>
              <p className="text-[11px] text-slate-500">Confirmed hall bookings &amp; BEO clearance</p>
            </div>
            <a href="/sales-marketing/banquets/bookings-enquiries" className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1">
              View All <ChevronRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="space-y-3">
            {MOCK_UPCOMING_BANQUETS.map((event) => (
              <div key={event.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">{event.eventName}</span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-bold border",
                      event.beoStatus === "BEO Issued"
                        ? "bg-emerald-100 text-emerald-900 border-emerald-200"
                        : event.beoStatus === "Approved"
                        ? "bg-blue-100 text-blue-900 border-blue-200"
                        : "bg-slate-200 text-slate-800 border-slate-300"
                    )}
                  >
                    {event.beoStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
                  <span>🏛️ {event.venue} ({event.pax} PAX)</span>
                  <span className="font-bold text-slate-900 font-mono">{event.totalAmount}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">Date: {event.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: MARKETING CAMPAIGNS & TOP CORPORATE ACCOUNTS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Active Marketing Campaigns (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-emerald-700" />
                Active Marketing Campaigns
              </h3>
              <p className="text-[11px] text-slate-500">Live promotions, leads generated &amp; conversion metrics</p>
            </div>
            <a href="/sales-marketing/marketing/campaigns" className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
              Manage <ChevronRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="space-y-2 text-xs">
            {MOCK_ACTIVE_CAMPAIGNS.map((cmp) => (
              <a
                key={cmp.id}
                href="/sales-marketing/marketing/campaigns"
                className="block p-3 rounded-xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:bg-slate-50/70 transition shadow-2xs group"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-xs group-hover:text-emerald-700 transition-colors truncate">
                      {cmp.title}
                    </p>
                    <p className="text-[11px] text-slate-500">{cmp.channel}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-extrabold text-slate-900">{cmp.leadsGenerated} Leads</p>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {cmp.conversions} Booked
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Top Producing Corporate Accounts (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-700" />
                Top Key Corporate Accounts
              </h3>
              <p className="text-[11px] text-slate-500">Contracted corporate room night production &amp; revenue</p>
            </div>
            <a href="/sales-marketing/corporate/clients" className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
              Corporate Clients <ChevronRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="space-y-2 text-xs">
            {MOCK_TOP_CORPORATE_ACCOUNTS.map((corp) => (
              <a
                key={corp.id}
                href="/sales-marketing/corporate/clients"
                className="block p-3 rounded-xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:bg-slate-50/70 transition shadow-2xs group"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="font-bold text-slate-900 text-xs group-hover:text-emerald-700 transition-colors truncate">
                        {corp.companyName}
                      </p>
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0",
                          corp.tier === "Platinum"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        )}
                      >
                        {corp.tier}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">👤 {corp.contactPerson}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-bold text-emerald-800 text-xs">{corp.revenue}</p>
                    <p className="text-[10px] text-slate-500 font-semibold">{corp.roomNights} Room Nights</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </ModulePageShell>
  );
}
