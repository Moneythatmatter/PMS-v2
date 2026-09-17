"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import { smDashboardService, smDealService } from "@/services/sales-marketing";
import { formatInr } from "@/lib/sales-marketing/api-mappers";
import { formatSmCurrency, formatSmDate } from "@/lib/sales-marketing/useSmList";

const PIPELINE_PALETTE = [
  { barColor: "bg-slate-400", dotColor: "bg-slate-400", badgeColor: "bg-slate-100 text-slate-700 border-slate-200" },
  { barColor: "bg-slate-500", dotColor: "bg-slate-500", badgeColor: "bg-slate-100 text-slate-700 border-slate-200" },
  { barColor: "bg-teal-500", dotColor: "bg-teal-500", badgeColor: "bg-teal-50 text-teal-800 border-teal-200/70" },
  { barColor: "bg-emerald-600", dotColor: "bg-emerald-600", badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200/70" },
  { barColor: "bg-emerald-700", dotColor: "bg-emerald-700", badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300" },
];

export function SalesMarketingDashboardView() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    openDealsCount: 0,
    untouchedLeadsCount: 0,
    callsTodayCount: 0,
    activeLeadsCount: 0,
    totalPipelineValue: 0,
    totalContractValue: 0,
    totalBookingsCount: 0,
  });
  const [pipelineStages, setPipelineStages] = useState<
    Array<{ stage: string; count: number; amount: string; barColor: string; dotColor: string; badgeColor: string; widthPct: number; sharePct: string }>
  >([]);
  const [myActivities, setMyActivities] = useState<
    Array<{ id: string; title: string; type: string; time: string; location: string; contactPerson: string }>
  >([]);
  const [closingDeals, setClosingDeals] = useState<
    Array<{ id: string; name: string; company: string; amount: string; closingDate: string; dateBadge: string; stage: string }>
  >([]);
  const [upcomingBanquets, setUpcomingBanquets] = useState<
    Array<{ id: string; eventName: string; venue: string; pax: number; date: string; beoStatus: string; totalAmount: string }>
  >([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [dash, dealRows] = await Promise.all([
          smDashboardService.get(),
          smDealService.list(),
        ]);

        const openDeals = dealRows.filter((d) => String(d.status) === "Open");
        const stageMap = new Map<string, { count: number; value: number }>();
        for (const deal of openDeals) {
          const stage = String(deal.stage ?? "Qualification");
          const prev = stageMap.get(stage) ?? { count: 0, value: 0 };
          stageMap.set(stage, {
            count: prev.count + 1,
            value: prev.value + Number(deal.dealValue ?? 0),
          });
        }
        const totalDeals = openDeals.length || 1;
        const maxValue = Math.max(...Array.from(stageMap.values()).map((s) => s.value), 1);
        const stages = Array.from(stageMap.entries()).map(([stage, data], idx) => {
          const palette = PIPELINE_PALETTE[idx % PIPELINE_PALETTE.length];
          return {
            stage,
            count: data.count,
            amount: formatInr(data.value),
            ...palette,
            widthPct: Math.max(12, Math.round((data.value / maxValue) * 100)),
            sharePct: `${Math.round((data.count / totalDeals) * 100)}%`,
          };
        });
        setPipelineStages(stages);

        const today = new Date().toLocaleDateString("en-CA");
        const scheduledToday = (dash.recentActivities as Record<string, unknown>[] | undefined ?? []).filter(
          (a) => String(a.activityDate ?? "").slice(0, 10) === today,
        );

        setSummary({
          openDealsCount: Number(dash.openDealsCount ?? 0),
          untouchedLeadsCount: Number(dash.untouchedLeadsCount ?? 0),
          callsTodayCount: scheduledToday.length,
          activeLeadsCount: Number(dash.activeLeadsCount ?? 0),
          totalPipelineValue: Number(dash.totalPipelineValue ?? 0),
          totalContractValue: Number(dash.totalContractValue ?? 0),
          totalBookingsCount: Number(dash.totalBookingsCount ?? 0),
        });

        setMyActivities(
          ((dash.recentActivities as Record<string, unknown>[] | undefined) ?? []).slice(0, 5).map((a) => ({
            id: String(a.activityCode ?? a.id ?? ""),
            title: String(a.purpose ?? a.activityType ?? "Activity"),
            type: String(a.activityType ?? "Call"),
            time: [formatSmDate(String(a.activityDate ?? "")), a.activityTime].filter(Boolean).join(" • "),
            location: String(a.venueRequired ?? "—"),
            contactPerson: String(a.contactPerson ?? a.customerName ?? "—"),
          })),
        );

        const monthPrefix = today.slice(0, 7);
        setClosingDeals(
          openDeals
            .filter((d) => String(d.expectedCloseDate ?? "").startsWith(monthPrefix))
            .slice(0, 6)
            .map((d) => ({
              id: String(d.dealCode ?? d.id ?? ""),
              name: String(d.dealName ?? ""),
              company: String(d.companyName ?? d.customerName ?? ""),
              amount: formatInr(Number(d.dealValue ?? 0)),
              closingDate: formatSmDate(String(d.expectedCloseDate ?? "")),
              dateBadge: "bg-emerald-100 text-emerald-800 border-emerald-300",
              stage: String(d.stage ?? "Open"),
            })),
        );

        setUpcomingBanquets(
          ((dash.recentBookings as Record<string, unknown>[] | undefined) ?? [])
            .filter((b) => String(b.status) === "Confirmed" || String(b.status) === "Tentative")
            .slice(0, 5)
            .map((b) => ({
              id: String(b.bookingCode ?? b.id ?? ""),
              eventName: String(b.bookingName ?? ""),
              venue: String(b.venueOrRoom ?? "—"),
              pax: Number(b.guestCount ?? 0),
              date: formatSmDate(String(b.startDate ?? "")),
              beoStatus: String(b.beoStatus ?? (b.beoRequired ? "Pending" : "Not Required")),
              totalAmount: formatInr(Number(b.contractValue ?? 0)),
            })),
        );
      } catch (e) {
        setToastMessage(e instanceof Error ? e.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const pipelineTotals = useMemo(
    () => ({
      dealCount: pipelineStages.reduce((sum, s) => sum + s.count, 0),
      totalValue: formatSmCurrency(summary.totalPipelineValue),
    }),
    [pipelineStages, summary.totalPipelineValue],
  );

  return (
    <ModulePageShell
      eyebrow="Sales & Marketing Module"
      title="Sales & Marketing Dashboard"
      breadcrumbs={[
        { label: "Sales & Marketing", href: "/sales-marketing/dashboard" },
        { label: "Dashboard" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/sales-marketing/crm/leads?create=1">
            <Button size="sm" variant="outline" className="bg-white text-slate-700 border-slate-300 font-semibold text-xs rounded-xl shadow-xs">
              <UserPlus className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
              + Add Lead
            </Button>
          </Link>
          <Link href="/sales-marketing/crm/activities-calls?create=1">
            <Button size="sm" variant="outline" className="bg-white text-slate-700 border-slate-300 font-semibold text-xs rounded-xl shadow-xs">
              <Phone className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
              + Log Call / Visit
            </Button>
          </Link>
          <Link href="/sales-marketing/banquets/bookings-enquiries?create=1&type=banquet">
            <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs">
              <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
              New Banquet Booking
            </Button>
          </Link>
        </div>
      }
    >
      {loading && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-600">
          Loading dashboard metrics from database…
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: ZOHO-STYLE QUICK COUNTER CARDS (4 CARDS)
      ───────────────────────────────────────────────────────────── */}
      <div className="mb-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 hover:border-emerald-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>My Open Deals</span>
            <GitCommit className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{summary.openDealsCount}</p>
          <p className="text-[11px] font-bold text-emerald-700 font-mono">Value: {formatSmCurrency(summary.totalPipelineValue)}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 hover:border-amber-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>My Untouched Leads</span>
            <UserPlus className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{summary.untouchedLeadsCount}</p>
          <p className="text-[11px] text-amber-700 font-bold">Needs Immediate Action</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 hover:border-blue-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>My Calls &amp; Visits Today</span>
            <Phone className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{summary.callsTodayCount}</p>
          <p className="text-[11px] text-blue-700 font-bold">{myActivities.length} Recent Activities</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 hover:border-purple-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>My Total Active Leads</span>
            <Users className="h-4 w-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{summary.activeLeadsCount}</p>
          <p className="text-[11px] text-purple-700 font-bold">{summary.totalBookingsCount} Total Bookings</p>
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
            {pipelineStages.length === 0 && !loading && (
              <p className="text-xs text-slate-500 py-4 text-center">No open pipeline deals yet. Convert leads to populate this funnel.</p>
            )}
            {pipelineStages.map((stg, idx) => (
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
            <span>Total Active Pipeline: <strong className="text-slate-800 font-semibold">{pipelineTotals.dealCount} Deals</strong></span>
            <span>Total Value: <strong className="text-emerald-700 font-bold font-mono">{pipelineTotals.totalValue}</strong></span>
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
                  {myActivities.length} Scheduled
                </span>
              </div>
              <div className="space-y-2">
                {myActivities.length === 0 && !loading && (
                  <p className="text-xs text-slate-500 py-2">No scheduled activities yet.</p>
                )}
                {myActivities.map((act) => (
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
                  0 Tasks
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-slate-500 py-2">Task tracking will appear here once activities are logged.</p>
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
                {closingDeals.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-xs text-slate-500">
                      No deals closing this month yet.
                    </td>
                  </tr>
                )}
                {closingDeals.map((dl) => (
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
            {upcomingBanquets.length === 0 && !loading && (
              <p className="text-xs text-slate-500 py-4 text-center">No upcoming bookings yet. Create a banquet booking to see events here.</p>
            )}
            {upcomingBanquets.map((event) => (
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
            <p className="text-xs text-slate-500 py-4 text-center">
              Campaign metrics will load here once the campaigns module is connected to the database.
            </p>
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
            <p className="text-xs text-slate-500 py-4 text-center">
              Top corporate accounts will appear here once contacts and bookings are recorded in the system.
            </p>
          </div>
        </div>
      </div>
    </ModulePageShell>
  );
}
