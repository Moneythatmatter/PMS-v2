"use client";

import React, { useState, useMemo } from "react";
import {
  FileText,
  Search,
  Plus,
  SlidersHorizontal,
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Eye,
  Edit2,
  UserCheck,
  MessageSquare,
  ChevronDown,
  Paperclip,
  Send,
  Building2,
  Calendar,
  Filter,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, StatusBadge } from "@/components/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import { HREmployeeCell } from "@/components/hr/shared/HREmployeeCell";

export type ComplaintStatus = "Open" | "In Review" | "Resolved" | "Escalated" | "Closed";
export type ComplaintPriority = "Low" | "Medium" | "High" | "Critical";

export interface GrievanceTimelineEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  notes?: string;
}

export interface ComplaintRecord {
  id: string;
  ticketNo: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  avatar: string;
  photoUrl?: string;
  category: string;
  subject: string;
  description: string;
  incidentDate: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  submittedDate: string;
  isAnonymous: boolean;
  assignedOfficer: string;
  assignedDepartment: string;
  attachmentName?: string;
  resolutionNotes?: string;
  timeline: GrievanceTimelineEvent[];
}

const CATEGORY_OPTIONS = [
  "Payroll & Salary Issues",
  "Attendance Issues",
  "Leave Related Issues",
  "Shift Scheduling Issues",
  "Overtime Issues",
  "Manager Complaint",
  "Team Conflict",
  "Workplace Harassment",
  "Sexual Harassment (POSH)",
  "Discrimination",
  "Workplace Safety",
  "Policy Violation",
  "Facilities & Infrastructure",
  "IT/System Issues",
  "Workload Concerns",
  "Other",
];

const OFFICERS_LIST = [
  "Neha Mehta (HR Manager)",
  "Sanjay Sharma (Roster Supervisor)",
  "Rajiv Kapoor (Head of Security)",
  "Anil Deshmukh (Finance Lead)",
  "POSH Internal Committee",
  "GM Office & Safety Committee",
];

export const INITIAL_COMPLAINT_RECORDS: ComplaintRecord[] = [
  {
    id: "CMP-501",
    ticketNo: "TCK-2026-081",
    employeeId: "EMP-0101",
    employeeName: "Rajesh Kumar",
    department: "Front Office",
    designation: "Front Desk Manager",
    avatar: "RK",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    category: "Payroll & Salary Issues",
    subject: "July Overtime Pay missing from payslip",
    description: "Calculated 8.5 hours of OT during weekend shift on July 18th, but net payout didn't reflect OT credit.",
    incidentDate: "18/07/2026",
    priority: "High",
    status: "In Review",
    submittedDate: "02/08/2026",
    isAnonymous: false,
    assignedOfficer: "Anil Deshmukh (Finance Lead)",
    assignedDepartment: "Finance & Payroll",
    attachmentName: "OT_Timesheet_July.pdf",
    timeline: [
      { id: "TL-1", timestamp: "02/08/2026 09:30 AM", actor: "Rajesh Kumar", action: "Submitted Complaint Ticket #TCK-2026-081" },
      { id: "TL-2", timestamp: "03/08/2026 11:00 AM", actor: "Neha Mehta (HR)", action: "Assigned ticket to Anil Deshmukh (Finance Lead)", notes: "Verifying July timesheet logs" },
    ],
  },
  {
    id: "CMP-502",
    ticketNo: "TCK-2026-082",
    employeeId: "EMP-0102",
    employeeName: "Priya Patel",
    department: "Front Office",
    designation: "Guest Relations Executive",
    avatar: "PP",
    category: "Shift Scheduling Issues",
    subject: "Three consecutive night shifts assigned without rest day",
    description: "Assigned Night Shift C from Aug 5 to Aug 8 without 24-hour mandatory rest break post night duty.",
    incidentDate: "05/08/2026",
    priority: "Medium",
    status: "Open",
    submittedDate: "06/08/2026",
    isAnonymous: false,
    assignedOfficer: "Sanjay Sharma (Roster Supervisor)",
    assignedDepartment: "Operations & Shift Rostering",
    timeline: [
      { id: "TL-1", timestamp: "06/08/2026 02:15 PM", actor: "Priya Patel", action: "Submitted Complaint Ticket #TCK-2026-082" }
    ],
  },
  {
    id: "CMP-503",
    ticketNo: "TCK-2026-083",
    employeeId: "ANON-99",
    employeeName: "Anonymous Employee",
    department: "Housekeeping",
    designation: "Housekeeping Associate",
    avatar: "AE",
    category: "Facilities & Infrastructure",
    subject: "Locker room AC non-functional and lack of hot water",
    description: "B-level basement locker room ventilation and cooling fan failed since last week causing health concerns.",
    incidentDate: "01/08/2026",
    priority: "Low",
    status: "Resolved",
    submittedDate: "03/08/2026",
    isAnonymous: true,
    assignedOfficer: "Engineering Maintenance Lead",
    assignedDepartment: "Property Engineering",
    resolutionNotes: "AC compressor repaired and hot water boiler valves replaced on 05/08/2026.",
    timeline: [
      { id: "TL-1", timestamp: "03/08/2026 08:00 AM", actor: "Anonymous", action: "Submitted Anonymous Ticket" },
      { id: "TL-2", timestamp: "05/08/2026 04:30 PM", actor: "Engineering Lead", action: "Marked Ticket as Resolved", notes: "AC and water heater restored." },
    ],
  },
  {
    id: "CMP-504",
    ticketNo: "TCK-2026-084",
    employeeId: "EMP-0104",
    employeeName: "Chef Vikramjit Singh",
    department: "Food & Beverage",
    designation: "Executive Head Chef",
    avatar: "VS",
    category: "Workplace Safety",
    subject: "Faulty exhaust hood in main banqueting kitchen",
    description: "Smoke accumulation in kitchen area during high-capacity banquets due to motor pressure loss.",
    incidentDate: "04/08/2026",
    priority: "Critical",
    status: "Escalated",
    submittedDate: "05/08/2026",
    isAnonymous: false,
    assignedOfficer: "GM Office & Safety Committee",
    assignedDepartment: "General Management",
    timeline: [
      { id: "TL-1", timestamp: "05/08/2026 10:00 AM", actor: "Chef Vikramjit Singh", action: "Submitted Safety Ticket" },
      { id: "TL-2", timestamp: "05/08/2026 11:30 AM", actor: "Safety Officer", action: "Escalated to GM Office due to Critical rating" },
    ],
  },
  {
    id: "CMP-505",
    ticketNo: "TCK-2026-085",
    employeeId: "EMP-0105",
    employeeName: "Arjun Verma",
    department: "Food & Beverage",
    designation: "Restaurant Captain",
    avatar: "AV",
    category: "Manager Complaint",
    subject: "Communication breakdown during evening banquet service",
    description: "Unreasonable verbal reprimand during live guest service without investigating kitchen delay.",
    incidentDate: "07/08/2026",
    priority: "Medium",
    status: "In Review",
    submittedDate: "08/08/2026",
    isAnonymous: false,
    assignedOfficer: "Neha Mehta (HR Manager)",
    assignedDepartment: "Human Resources",
    timeline: [
      { id: "TL-1", timestamp: "08/08/2026 09:00 AM", actor: "Arjun Verma", action: "Submitted Complaint Ticket" }
    ],
  },
];

export function ComplaintListView() {
  const [complaints, setComplaints] = useState<ComplaintRecord[]>(INITIAL_COMPLAINT_RECORDS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedPriority, setSelectedPriority] = useState("ALL");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Modals & Drawers
  const [viewingComplaint, setViewingComplaint] = useState<ComplaintRecord | null>(null);
  const [assigningComplaint, setAssigningComplaint] = useState<ComplaintRecord | null>(null);
  const [resolvingComplaint, setResolvingComplaint] = useState<ComplaintRecord | null>(null);

  // Form States
  const [assignOfficer, setAssignOfficer] = useState(OFFICERS_LIST[0]);
  const [assignNotes, setAssignNotes] = useState("");

  const [resolutionStatus, setResolutionStatus] = useState<ComplaintStatus>("Resolved");
  const [resolutionText, setResolutionText] = useState("");

  // Statistics KPI
  const stats = useMemo(() => {
    const total = complaints.length;
    const open = complaints.filter((c) => c.status === "Open").length;
    const inReview = complaints.filter((c) => c.status === "In Review").length;
    const resolved = complaints.filter((c) => c.status === "Resolved" || c.status === "Closed").length;
    const escalated = complaints.filter((c) => c.status === "Escalated" || c.priority === "Critical").length;

    return { total, open, inReview, resolved, escalated };
  }, [complaints]);

  // Filtered Records
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      const matchSearch =
        c.ticketNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = selectedDept === "ALL" || c.department === selectedDept;
      const matchCategory = selectedCategory === "ALL" || c.category === selectedCategory;
      const matchStatus = selectedStatus === "ALL" || c.status === selectedStatus;
      const matchPriority = selectedPriority === "ALL" || c.priority === selectedPriority;

      return matchSearch && matchDept && matchCategory && matchStatus && matchPriority;
    });
  }, [complaints, searchTerm, selectedDept, selectedCategory, selectedStatus, selectedPriority]);

  // Assign Officer Submit
  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningComplaint) return;

    const timestamp = new Date().toLocaleString("en-GB");
    const newTimelineEntry: GrievanceTimelineEvent = {
      id: `TL-${Math.floor(10 + Math.random() * 90)}`,
      timestamp,
      actor: "Neha Mehta (HR Manager)",
      action: `Assigned ticket to ${assignOfficer}`,
      notes: assignNotes ? assignNotes.trim() : undefined,
    };

    setComplaints((prev) =>
      prev.map((c) =>
        c.id === assigningComplaint.id
          ? {
              ...c,
              assignedOfficer: assignOfficer,
              status: c.status === "Open" ? "In Review" : c.status,
              timeline: [newTimelineEntry, ...c.timeline],
            }
          : c
      )
    );

    setAssigningComplaint(null);
    setAssignNotes("");
    setToastMessage(`Assigned ticket #${assigningComplaint.ticketNo} to ${assignOfficer}.`);
  };

  // Resolve Ticket Submit
  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingComplaint || !resolutionText.trim()) return;

    const timestamp = new Date().toLocaleString("en-GB");
    const newTimelineEntry: GrievanceTimelineEvent = {
      id: `TL-${Math.floor(10 + Math.random() * 90)}`,
      timestamp,
      actor: "Neha Mehta (HR Manager)",
      action: `Marked ticket as ${resolutionStatus}`,
      notes: resolutionText.trim(),
    };

    setComplaints((prev) =>
      prev.map((c) =>
        c.id === resolvingComplaint.id
          ? {
              ...c,
              status: resolutionStatus,
              resolutionNotes: resolutionText.trim(),
              timeline: [newTimelineEntry, ...c.timeline],
            }
          : c
      )
    );

    setResolvingComplaint(null);
    setResolutionText("");
    setToastMessage(`Ticket #${resolvingComplaint.ticketNo} marked as ${resolutionStatus}.`);
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource / Grievances"
      title="Complaint List"
      description="Central grievance redressal dashboard for HR managers to review, assign officers, track timelines, and resolve employee complaints."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Grievances" },
        { label: "Complaint List" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: DASHBOARD KPI CARDS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <HRKPICard
          label="Total Complaints"
          value={`${stats.total}`}
          subtitle="All Logged Grievances"
          tone="blue"
          icon={<FileText className="h-5 w-5" />}
        />
        <HRKPICard
          label="Open Tickets"
          value={`${stats.open}`}
          subtitle="Awaiting Initial Action"
          tone="amber"
          icon={<Clock className="h-5 w-5" />}
        />
        <HRKPICard
          label="Under Review"
          value={`${stats.inReview}`}
          subtitle="Active Investigations"
          tone="purple"
          icon={<MessageSquare className="h-5 w-5" />}
        />
        <HRKPICard
          label="Resolved"
          value={`${stats.resolved}`}
          subtitle="Redressed &amp; Closed"
          tone="emerald"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <HRKPICard
          label="Escalated / Critical"
          value={`${stats.escalated}`}
          subtitle="Immediate Action"
          tone="rose"
          icon={<ShieldAlert className="h-5 w-5" />}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: SEARCH & FILTERS TOOLBAR
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Ticket, Complainant..."
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
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All Departments</option>
                <option value="Front Office">Front Office</option>
                <option value="Housekeeping">Housekeeping</option>
                <option value="Food & Beverage">Food &amp; Beverage</option>
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All Categories</option>
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All Statuses</option>
                <option value="Open">🟡 Open</option>
                <option value="In Review">🔵 In Review</option>
                <option value="Resolved">🟢 Resolved</option>
                <option value="Escalated">🔴 Escalated</option>
              </select>

              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedDept("ALL");
                  setSelectedCategory("ALL");
                  setSelectedStatus("ALL");
                  setSelectedPriority("ALL");
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
          SECTION 3: MAIN DATA TABLE (DESKTOP) & CARDS (MOBILE)
      ───────────────────────────────────────────────────────────── */}
      {/* Desktop Table */}
      <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-3.5 px-4">Ticket No</th>
                <th className="py-3.5 px-4">Complainant</th>
                <th className="py-3.5 px-4">Category &amp; Subject</th>
                <th className="py-3.5 px-4">Assigned Officer</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Submitted Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredComplaints.length > 0 ? (
                filteredComplaints.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                    onClick={() => setViewingComplaint(c)}
                  >
                    <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900">
                      {c.ticketNo}
                    </td>

                    <td className="py-3.5 px-4">
                      {c.isAnonymous ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                            AE
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">Anonymous</p>
                            <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
                              Confidential
                            </span>
                          </div>
                        </div>
                      ) : (
                        <HREmployeeCell
                          name={c.employeeName}
                          id={c.employeeId}
                          avatar={c.avatar}
                          photoUrl={c.photoUrl}
                        />
                      )}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-extrabold text-emerald-800 text-[11px] uppercase tracking-wider">{c.category}</p>
                      <p className="font-bold text-slate-900 truncate">{c.subject}</p>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {c.assignedOfficer || <span className="text-slate-400 italic">Unassigned</span>}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          c.priority === "Critical"
                            ? "bg-rose-100 text-rose-800 border-rose-200"
                            : c.priority === "High"
                            ? "bg-amber-100 text-amber-800 border-amber-200"
                            : c.priority === "Medium"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {c.priority}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-medium">{c.submittedDate}</td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={c.status} />
                    </td>

                    <td
                      className="py-3.5 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingComplaint(c)}
                          className="rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1 text-slate-500" /> View
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setAssigningComplaint(c)}
                          className="rounded-xl text-xs font-semibold text-blue-800 border-blue-300 hover:bg-blue-50"
                        >
                          <UserCheck className="h-3.5 w-3.5 mr-1 text-blue-600" /> Assign
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setResolvingComplaint(c)}
                          className="rounded-xl text-xs font-semibold text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Resolve
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                    No complaints found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Stacked Cards View */}
      <div className="sm:hidden space-y-3">
        {filteredComplaints.map((c) => (
          <div
            key={c.id}
            onClick={() => setViewingComplaint(c)}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-extrabold text-slate-900 text-xs">{c.ticketNo}</span>
              <StatusBadge status={c.status} />
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-800">{c.category}</span>
              <h4 className="font-bold text-slate-900 text-sm">{c.subject}</h4>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p className="text-slate-600">Assigned: <strong>{c.assignedOfficer}</strong></p>
              <p className="text-slate-500">Submitted: {c.submittedDate}</p>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAssigningComplaint(c)}
                className="text-xs font-semibold text-blue-800 border-blue-300"
              >
                Assign Officer
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setResolvingComplaint(c)}
                className="text-xs font-semibold text-emerald-800 border-emerald-300"
              >
                Resolve Ticket
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: ASSIGN OFFICER MODAL
      ───────────────────────────────────────────────────────────── */}
      {assigningComplaint && (
        <Modal
          isOpen={Boolean(assigningComplaint)}
          onClose={() => setAssigningComplaint(null)}
          title={`Assign Investigation Officer: #${assigningComplaint.ticketNo}`}
          description={`Assign an HR officer or department supervisor to investigate this grievance.`}
          size="md"
        >
          <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Officer / Lead</label>
              <select
                value={assignOfficer}
                onChange={(e) => setAssignOfficer(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white"
              >
                {OFFICERS_LIST.map((officer) => (
                  <option key={officer} value={officer}>
                    {officer}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Assignment Instructions / Notes</label>
              <textarea
                rows={3}
                placeholder="Specific instructions for the investigating officer..."
                value={assignNotes}
                onChange={(e) => setAssignNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-900 bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAssigningComplaint(null)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-xl text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white"
              >
                Confirm Assignment
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: RESOLVE TICKET MODAL
      ───────────────────────────────────────────────────────────── */}
      {resolvingComplaint && (
        <Modal
          isOpen={Boolean(resolvingComplaint)}
          onClose={() => setResolvingComplaint(null)}
          title={`Resolve Grievance: #${resolvingComplaint.ticketNo}`}
          description="Log final investigation resolution and update ticket status."
          size="md"
        >
          <form onSubmit={handleResolveSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Resolution Status</label>
              <select
                value={resolutionStatus}
                onChange={(e) => setResolutionStatus(e.target.value as ComplaintStatus)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white"
              >
                <option value="Resolved">🟢 Resolved (Satisfaction Achieved)</option>
                <option value="Escalated">🔴 Escalated (Forwarded to Executive Committee)</option>
                <option value="Closed">⚪ Closed (Investigation Complete)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Resolution Statement &amp; Findings <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                placeholder="Detail the outcome, corrective actions taken, and employee feedback..."
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-900 bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setResolvingComplaint(null)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                Submit Resolution
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          DRAWER: VIEW COMPLAINT DETAILS & TIMELINE
      ───────────────────────────────────────────────────────────── */}
      <Drawer
        isOpen={Boolean(viewingComplaint)}
        onClose={() => setViewingComplaint(null)}
        title="Grievance Ticket Timeline &amp; Audit"
        icon={<FileText className="h-5 w-5 text-blue-600" />}
      >
        {viewingComplaint && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-mono font-bold">{viewingComplaint.ticketNo}</span>
                <StatusBadge status={viewingComplaint.status} />
              </div>
              <h3 className="text-base font-black text-amber-400">{viewingComplaint.subject}</h3>
              <p className="text-xs text-slate-300">Category: <strong>{viewingComplaint.category}</strong></p>
            </div>

            {/* Complainant Info */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <span className="font-extrabold text-slate-900 block uppercase text-[11px]">Complainant Profile</span>
              {viewingComplaint.isAnonymous ? (
                <p className="font-bold text-amber-800">Anonymous Employee (Confidential)</p>
              ) : (
                <HREmployeeCell
                  name={viewingComplaint.employeeName}
                  id={viewingComplaint.employeeId}
                  avatar={viewingComplaint.avatar}
                  photoUrl={viewingComplaint.photoUrl}
                  department={viewingComplaint.department}
                />
              )}
            </div>

            {/* Statement */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
              <span className="font-extrabold text-slate-900 block uppercase text-[11px]">Grievance Statement</span>
              <p className="text-slate-700 leading-relaxed font-medium">{viewingComplaint.description}</p>
            </div>

            {/* Timeline Audit Log */}
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
              <span className="font-extrabold text-blue-950 block uppercase text-[11px]">Audit &amp; Activity Timeline</span>
              <div className="space-y-2 relative border-l-2 border-blue-300 ml-2 pl-3">
                {viewingComplaint.timeline.map((event) => (
                  <div key={event.id} className="relative space-y-0.5">
                    <div className="w-2 h-2 rounded-full bg-blue-600 absolute -left-[17px] top-1" />
                    <span className="text-[10px] text-slate-400 font-mono block">{event.timestamp}</span>
                    <p className="font-bold text-slate-900">{event.action}</p>
                    <p className="text-slate-600 font-medium">By: {event.actor}</p>
                    {event.notes && <p className="text-slate-500 italic">"{event.notes}"</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* MOBILE FILTERS DRAWER */}
      <Drawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        title="Filter Complaints"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 bg-white"
            >
              <option value="ALL">All Departments</option>
              <option value="Front Office">Front Office</option>
              <option value="Housekeeping">Housekeeping</option>
              <option value="Food & Beverage">Food &amp; Beverage</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
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
