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

// Pipeline Funnel Data (By Stage)
const MOCK_PIPELINE_STAGES = [
  { stage: "Qualification / Inquiries", count: 14, amount: "₹65,00,000", color: "bg-teal-400 text-teal-950", widthPct: 100 },
  { stage: "Site Visit / Needs Analysis", count: 9, amount: "₹42,50,000", color: "bg-blue-500 text-white", widthPct: 80 },
  { stage: "Proposal / Price Quote", count: 6, amount: "₹28,50,000", color: "bg-indigo-500 text-white", widthPct: 62 },
  { stage: "Contract Negotiation", count: 4, amount: "₹18,20,000", color: "bg-rose-500 text-white", widthPct: 45 },
  { stage: "Closed Won / Booked", count: 18, amount: "₹48,20,000", color: "bg-emerald-600 text-white", widthPct: 32 },
];

// Open Tasks & Scheduled Meetings
const MOCK_MY_TASKS = [
  { id: "TSK-101", subject: "Send Wedding Quotation for 450 Pax", dueDate: "Today, 04:00 PM", priority: "High", status: "In Progress" },
  { id: "TSK-102", subject: "Follow up with TCS Corporate HR re: LRA Rates", dueDate: "19/08/2026", priority: "Medium", status: "Not Started" },
  { id: "TSK-103", subject: "Submit Banquet Menu Options for Rotary Gala", dueDate: "20/08/2026", priority: "Urgent", status: "In Progress" },
  { id: "TSK-104", subject: "Confirm Advance Payment for HDFC Leadership Summit", dueDate: "21/08/2026", priority: "High", status: "Not Started" },
];

const MOCK_MY_MEETINGS = [
  { id: "MTG-201", title: "Hotel Site Visit — Reddy Family", type: "Site Visit", time: "Today, 11:30 AM", location: "Grand Crystal Ballroom", attendee: "Pooja Hegde" },
  { id: "MTG-202", title: "Corporate LRA Contract Review — TCS", type: "Client Call", time: "Today, 03:00 PM", location: "Conference Call", attendee: "Sunil Verma" },
  { id: "MTG-203", title: "Menu Tasting & BEO Finalization", type: "In-Person", time: "Tomorrow, 02:00 PM", location: "Banquet Office", attendee: "Sharma Family" },
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
                <GitCommit className="h-4 w-4 text-teal-600" />
                My Pipeline Deals By Stage
              </h3>
              <p className="text-[11px] text-slate-500">Visual funnel breakdown of active corporate &amp; banquet prospects</p>
            </div>
            <a href="/sales-marketing/crm/pipeline" className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1">
              Pipeline View <ChevronRight className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Interactive Stage Funnel Visual */}
          <div className="space-y-2.5 pt-1">
            {MOCK_PIPELINE_STAGES.map((stg, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                    {stg.stage} ({stg.count})
                  </span>
                  <span className="font-mono text-slate-900">{stg.amount}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-xl h-7 overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className={cn("h-full rounded-lg flex items-center justify-between px-3 text-[11px] font-bold transition-all duration-500 shadow-xs", stg.color)}
                    style={{ width: `${stg.widthPct}%` }}
                  >
                    <span>{stg.count} Deals</span>
                    <span>{stg.amount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My Tasks & Scheduled Meetings Split Box (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-blue-600" />
                My Open Tasks &amp; Meetings
              </h3>
              <p className="text-[11px] text-slate-500">Scheduled follow-ups, calls &amp; client site visits</p>
            </div>
            <a href="/sales-marketing/workqueue" className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1">
              Workqueue <ChevronRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="space-y-3">
            {/* Meetings Section */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Meetings &amp; Site Visits Today</span>
              {MOCK_MY_MEETINGS.map((mtg) => (
                <div key={mtg.id} className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900 text-xs">
                    <span className="flex items-center gap-1.5">
                      <Video className="h-3.5 w-3.5 text-blue-600" />
                      {mtg.title}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-900 font-extrabold">
                      {mtg.type}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
                    <span>👤 {mtg.attendee} • 📍 {mtg.location}</span>
                    <span className="font-mono text-blue-950 font-bold">{mtg.time}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Open Tasks Section */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Priority Follow-up Tasks</span>
              {MOCK_MY_TASKS.slice(0, 2).map((tsk) => (
                <div key={tsk.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 text-xs">{tsk.subject}</p>
                    <p className="text-[10px] text-slate-500 font-mono">Due: {tsk.dueDate}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                    {tsk.status}
                  </span>
                </div>
              ))}
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
          SECTION 4: MARKETING CAMPAIGNS & SALES TARGET ACHIEVEMENT
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Active Campaigns (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-blue-700" />
              Active Marketing Campaigns
            </h3>
            <a href="/sales-marketing/marketing/campaigns" className="text-xs font-bold text-blue-700 hover:text-blue-800">
              Manage Campaigns →
            </a>
          </div>

          <div className="space-y-2 text-xs">
            {MOCK_ACTIVE_CAMPAIGNS.map((cmp) => (
              <div key={cmp.id} className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{cmp.title}</p>
                  <p className="text-[11px] text-slate-500">{cmp.channel}</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-blue-950">{cmp.leadsGenerated} Leads</p>
                  <p className="text-[10px] text-emerald-700 font-bold">{cmp.conversions} Booked</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Revenue Target Progress (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-600" />
              Monthly Sales Target Progress
            </h3>
            <a href="/sales-marketing/masters/sales-targets-incentives" className="text-xs font-bold text-amber-700 hover:text-amber-800">
              View Incentive Rules →
            </a>
          </div>

          <div className="space-y-3 text-xs p-2 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span>Overall Revenue Goal</span>
              <span className="text-emerald-700 font-mono">{MOCK_USER_SUMMARY.targetAchievedPct}% Achieved</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden border border-slate-300">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500 shadow-xs"
                style={{ width: `${MOCK_USER_SUMMARY.targetAchievedPct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-600 font-mono pt-1">
              <span>Achieved: <strong>{MOCK_USER_SUMMARY.achievedAmount}</strong></span>
              <span>Monthly Target: <strong>{MOCK_USER_SUMMARY.monthlyTarget}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </ModulePageShell>
  );
}
