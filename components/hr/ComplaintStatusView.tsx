"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  SlidersHorizontal,
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Eye,
  FileText,
  MessageSquare,
  Building2,
  Calendar,
  User,
  Paperclip,
  ChevronRight,
  HelpCircle,
  RefreshCw,
  Send,
  Lock,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, StatusBadge } from "@/components/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import { HREmployeeCell } from "@/components/hr/shared/HREmployeeCell";

export type TicketStatus = "Open" | "In Review" | "Resolved" | "Escalated" | "Closed";

export interface StatusTimelineStep {
  title: string;
  timestamp?: string;
  by?: string;
  notes?: string;
  completed: boolean;
  active?: boolean;
}

export interface ComplaintStatusTicket {
  id: string;
  ticketNo: string;
  category: string;
  subject: string;
  description: string;
  incidentDate: string;
  submittedDate: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: TicketStatus;
  isAnonymous: boolean;
  employeeName: string;
  assignedOfficer: string;
  assignedDepartment: string;
  lastUpdated: string;
  resolutionNotes?: string;
  attachmentName?: string;
  steps: StatusTimelineStep[];
}

export const INITIAL_MY_TICKETS: ComplaintStatusTicket[] = [
  {
    id: "ST-01",
    ticketNo: "TCK-2026-081",
    category: "Payroll & Salary Issues",
    subject: "July Overtime Pay missing from payslip",
    description: "Calculated 8.5 hours of OT during weekend shift on July 18th, but net payout didn't reflect OT credit.",
    incidentDate: "18/07/2026",
    submittedDate: "02/08/2026",
    priority: "High",
    status: "In Review",
    isAnonymous: false,
    employeeName: "Rajesh Kumar",
    assignedOfficer: "Anil Deshmukh (Finance Lead)",
    assignedDepartment: "Finance & Payroll",
    lastUpdated: "03/08/2026, 11:00 AM",
    attachmentName: "OT_Timesheet_July.pdf",
    steps: [
      { title: "Complaint Submitted", timestamp: "02/08/2026, 09:30 AM", by: "Rajesh Kumar", notes: "Ticket created and forwarded to HR desk.", completed: true },
      { title: "HR Review & Assignment", timestamp: "03/08/2026, 11:00 AM", by: "Neha Mehta (HR)", notes: "Assigned to Anil Deshmukh (Finance Lead) for timesheet audit.", completed: true, active: true },
      { title: "Investigation & Action", notes: "Awaiting Finance confirmation of July OT hours.", completed: false },
      { title: "Grievance Resolved", notes: "Final resolution statement and credit adjustment.", completed: false },
    ],
  },
  {
    id: "ST-02",
    ticketNo: "TCK-2026-082",
    category: "Shift Scheduling Issues",
    subject: "Three consecutive night shifts assigned without rest day",
    description: "Assigned Night Shift C from Aug 5 to Aug 8 without 24-hour mandatory rest break post night duty.",
    incidentDate: "05/08/2026",
    submittedDate: "06/08/2026",
    priority: "Medium",
    status: "Open",
    isAnonymous: false,
    employeeName: "Priya Patel",
    assignedOfficer: "Sanjay Sharma (Roster Supervisor)",
    assignedDepartment: "Operations & Shift Rostering",
    lastUpdated: "06/08/2026, 02:15 PM",
    steps: [
      { title: "Complaint Submitted", timestamp: "06/08/2026, 02:15 PM", by: "Priya Patel", notes: "Ticket submitted to Roster Supervisor.", completed: true, active: true },
      { title: "HR Review & Assignment", notes: "Pending assignment review.", completed: false },
      { title: "Investigation & Action", notes: "Roster adjustment under evaluation.", completed: false },
      { title: "Grievance Resolved", notes: "Final resolution statement.", completed: false },
    ],
  },
  {
    id: "ST-03",
    ticketNo: "TCK-2026-083",
    category: "Facilities & Infrastructure",
    subject: "Locker room AC non-functional and lack of hot water",
    description: "B-level basement locker room ventilation and cooling fan failed since last week causing health concerns.",
    incidentDate: "01/08/2026",
    submittedDate: "03/08/2026",
    priority: "Low",
    status: "Resolved",
    isAnonymous: true,
    employeeName: "Anonymous Employee",
    assignedOfficer: "Engineering Maintenance Lead",
    assignedDepartment: "Property Engineering",
    lastUpdated: "05/08/2026, 04:30 PM",
    resolutionNotes: "AC compressor repaired and hot water boiler valves replaced on 05/08/2026.",
    steps: [
      { title: "Complaint Submitted", timestamp: "03/08/2026, 08:00 AM", by: "Anonymous", notes: "Confidential ticket logged.", completed: true },
      { title: "HR Review & Assignment", timestamp: "03/08/2026, 10:15 AM", by: "HR Officer", notes: "Dispatched to Property Engineering.", completed: true },
      { title: "Investigation & Action", timestamp: "04/08/2026, 02:00 PM", by: "Engineering Lead", notes: "Parts ordered and replaced.", completed: true },
      { title: "Grievance Resolved", timestamp: "05/08/2026, 04:30 PM", by: "Engineering Lead", notes: "AC compressor repaired & hot water restored.", completed: true, active: true },
    ],
  },
  {
    id: "ST-04",
    ticketNo: "TCK-2026-084",
    category: "Workplace Safety",
    subject: "Faulty exhaust hood in main banqueting kitchen",
    description: "Smoke accumulation in kitchen area during high-capacity banquets due to motor pressure loss.",
    incidentDate: "04/08/2026",
    submittedDate: "05/08/2026",
    priority: "Critical",
    status: "Escalated",
    isAnonymous: false,
    employeeName: "Chef Vikramjit Singh",
    assignedOfficer: "GM Office & Safety Committee",
    assignedDepartment: "General Management",
    lastUpdated: "05/08/2026, 11:30 AM",
    steps: [
      { title: "Complaint Submitted", timestamp: "05/08/2026, 10:00 AM", by: "Chef Vikramjit Singh", notes: "Ticket submitted.", completed: true },
      { title: "HR Review & Assignment", timestamp: "05/08/2026, 11:30 AM", by: "Safety Lead", notes: "Escalated immediately to GM Office.", completed: true, active: true },
      { title: "Investigation & Action", notes: "Safety audit in progress.", completed: false },
      { title: "Grievance Resolved", notes: "Final safety signoff.", completed: false },
    ],
  },
];

export function ComplaintStatusView() {
  const [tickets, setTickets] = useState<ComplaintStatusTicket[]>(INITIAL_MY_TICKETS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Search Ticket lookup by exact Ticket Number
  const [lookupTicketNo, setLookupTicketNo] = useState("");
  const [foundTicket, setFoundTicket] = useState<ComplaintStatusTicket | null>(null);

  // Drawer details
  const [viewingTicket, setViewingTicket] = useState<ComplaintStatusTicket | null>(null);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = tickets.length;
    const active = tickets.filter((t) => t.status === "Open" || t.status === "In Review").length;
    const resolved = tickets.filter((t) => t.status === "Resolved" || t.status === "Closed").length;
    const escalated = tickets.filter((t) => t.status === "Escalated").length;

    return { total, active, resolved, escalated };
  }, [tickets]);

  // Filtered List
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchSearch =
        t.ticketNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === "ALL" || t.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [tickets, searchTerm, statusFilter]);

  // Direct Ticket Search Handler
  const handleTicketLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupTicketNo.trim()) return;

    const matched = tickets.find(
      (t) => t.ticketNo.toLowerCase() === lookupTicketNo.trim().toLowerCase()
    );

    if (matched) {
      setFoundTicket(matched);
      setViewingTicket(matched);
      setToastMessage(`Found ticket #${matched.ticketNo}! Details loaded.`);
    } else {
      alert(`No ticket found matching "${lookupTicketNo.trim()}". Please verify the ticket number.`);
    }
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource / Grievances"
      title="Complaint Status"
      description="Track live progress, investigation milestones, and resolution details for your submitted grievance tickets."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Grievances" },
        { label: "Complaint Status" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: TICKET LOOKUP BANNER
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 rounded-2xl text-white shadow-md mb-5">
        <div className="max-w-2xl space-y-2">
          <span className="text-[10px] uppercase font-extrabold text-amber-400 tracking-wider">
            Quick Grievance Tracker
          </span>
          <h3 className="text-base font-black">Track Ticket Status by Number</h3>
          <p className="text-xs text-slate-300">
            Enter your 11-digit Ticket Reference Number (e.g. <strong>TCK-2026-081</strong>) to view instant progress updates and resolution notes.
          </p>

          <form onSubmit={handleTicketLookup} className="pt-2 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Enter Ticket No (e.g. TCK-2026-081)..."
                value={lookupTicketNo}
                onChange={(e) => setLookupTicketNo(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-800/90 border border-slate-700 text-white font-mono font-bold placeholder:font-sans placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              className="rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-500 text-slate-950 py-2.5 h-auto cursor-pointer"
            >
              Track Ticket
            </Button>
          </form>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: REUSABLE KPI CARDS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <HRKPICard
          label="Tracked Tickets"
          value={`${stats.total}`}
          subtitle="My Logged Complaints"
          tone="blue"
          icon={<FileText className="h-5 w-5" />}
        />
        <HRKPICard
          label="Active In-Progress"
          value={`${stats.active}`}
          subtitle="Under Investigation"
          tone="amber"
          icon={<Clock className="h-5 w-5" />}
        />
        <HRKPICard
          label="Resolved Tickets"
          value={`${stats.resolved}`}
          subtitle="Redressed &amp; Closed"
          tone="emerald"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <HRKPICard
          label="Escalated Status"
          value={`${stats.escalated}`}
          subtitle="Executive Level Action"
          tone="rose"
          icon={<ShieldAlert className="h-5 w-5" />}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: FILTERS TOOLBAR
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Subject or Ticket No..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50/50 font-medium text-slate-800"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Desktop Filters */}
            <div className="hidden sm:flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All Statuses</option>
                <option value="Open">🟡 Open</option>
                <option value="In Review">🔵 In Review</option>
                <option value="Resolved">🟢 Resolved</option>
                <option value="Escalated">🔴 Escalated</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("ALL");
                }}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Mobile Filter Trigger */}
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="sm:hidden px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 flex items-center gap-1.5"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: DATA TABLE (DESKTOP) & STACKED CARDS (MOBILE)
      ───────────────────────────────────────────────────────────── */}
      {/* Desktop Table */}
      <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-3.5 px-4">Ticket No</th>
                <th className="py-3.5 px-4">Category &amp; Subject</th>
                <th className="py-3.5 px-4">Current Progress Stage</th>
                <th className="py-3.5 px-4">Assigned Officer</th>
                <th className="py-3.5 px-4">Submitted Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.length > 0 ? (
                filteredTickets.map((t) => {
                  const activeStep = t.steps.find((s) => s.active) || t.steps[0];

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                      onClick={() => setViewingTicket(t)}
                    >
                      <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900">
                        {t.ticketNo}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                          {t.category}
                        </span>
                        <p className="font-bold text-slate-900 truncate">{t.subject}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                          <span>{activeStep.title}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono pt-0.5">
                          Updated: {t.lastUpdated}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {t.assignedOfficer || "HR Review Desk"}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {t.submittedDate}
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={t.status} />
                      </td>

                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingTicket(t)}
                          className="rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1 text-slate-500" />
                          Track Status
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    No tickets found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Stacked Cards View */}
      <div className="sm:hidden space-y-3">
        {filteredTickets.map((t) => {
          const activeStep = t.steps.find((s) => s.active) || t.steps[0];

          return (
            <div
              key={t.id}
              onClick={() => setViewingTicket(t)}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-extrabold text-slate-900 text-xs">{t.ticketNo}</span>
                <StatusBadge status={t.status} />
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800">{t.category}</span>
                <h4 className="font-bold text-slate-900 text-sm">{t.subject}</h4>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Stage:</span>
                  <strong className="text-slate-900">{activeStep.title}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Officer:</span>
                  <span className="font-semibold text-slate-700">{t.assignedOfficer}</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewingTicket(t);
                }}
                className="w-full text-xs font-bold text-slate-700"
              >
                Track Live Progress
              </Button>
            </div>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          DRAWER: LIVE STATUS TRACKER & MILESTONES
      ───────────────────────────────────────────────────────────── */}
      <Drawer
        isOpen={Boolean(viewingTicket)}
        onClose={() => setViewingTicket(null)}
        title={`Live Grievance Tracker: #${viewingTicket?.ticketNo}`}
        icon={<Clock className="h-5 w-5 text-emerald-700" />}
      >
        {viewingTicket && (
          <div className="space-y-5 text-xs">
            {/* Header Card */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-mono font-bold">{viewingTicket.ticketNo}</span>
                <StatusBadge status={viewingTicket.status} />
              </div>
              <h3 className="text-base font-black text-amber-400">{viewingTicket.subject}</h3>
              <p className="text-xs text-slate-300">Category: <strong>{viewingTicket.category}</strong></p>
            </div>

            {/* Stepper Progress Bar */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
              <span className="font-extrabold text-slate-900 block uppercase text-[11px]">
                Investigation Milestone Progress
              </span>

              <div className="space-y-4 relative border-l-2 border-slate-200 ml-3 pl-4 pt-1">
                {viewingTicket.steps.map((step, idx) => (
                  <div key={idx} className="relative space-y-0.5">
                    {/* Circle Bullet */}
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center absolute -left-[23px] top-0.5 text-[9px] font-bold ${
                        step.completed
                          ? "bg-emerald-700 text-white ring-2 ring-emerald-100"
                          : "bg-slate-200 text-slate-500 border border-slate-300"
                      }`}
                    >
                      {step.completed ? "✓" : idx + 1}
                    </div>

                    <h4
                      className={`font-bold ${
                        step.active
                          ? "text-emerald-800 text-sm"
                          : step.completed
                          ? "text-slate-900"
                          : "text-slate-400"
                      }`}
                    >
                      {step.title}
                    </h4>

                    {step.timestamp && (
                      <span className="text-[10px] font-mono text-slate-400 block">
                        {step.timestamp} {step.by ? `• By ${step.by}` : ""}
                      </span>
                    )}

                    {step.notes && (
                      <p className="text-slate-600 font-medium bg-slate-50 p-2 rounded-xl border border-slate-200 mt-1">
                        "{step.notes}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Resolution Statement */}
            {viewingTicket.resolutionNotes && (
              <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 space-y-1">
                <span className="font-extrabold text-emerald-950 block uppercase text-[11px]">
                  Final HR Resolution Statement
                </span>
                <p className="text-slate-800 font-medium leading-relaxed">{viewingTicket.resolutionNotes}</p>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* MOBILE FILTERS DRAWER */}
      <Drawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        title="Status Filters"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Review">In Review</option>
              <option value="Resolved">Resolved</option>
              <option value="Escalated">Escalated</option>
            </select>
          </div>

          <Button
            type="button"
            onClick={() => setIsMobileFilterOpen(false)}
            className="w-full font-bold bg-emerald-700 text-white rounded-xl"
          >
            Apply Filters
          </Button>
        </div>
      </Drawer>
    </ModulePageShell>
  );
}
