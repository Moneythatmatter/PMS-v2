"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useHousekeeping } from "@/components/housekeeping/HousekeepingContext";
import {
  Sparkles,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Calendar,
  User,
  MapPin,
  Box,
  History,
  FileText,
  Lock,
  ShieldCheck,
  Camera,
  Wrench,
  Layers,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { TextInput, SelectInput, FormField, TextAreaInput } from "@/components/frontoffice/ui";
import { OperationsToolbar, OperationsFilterDrawer } from "@/components/housekeeping/OperationsToolbar";

// Mock Data Sets (6 Active Tasks, 5 Recurring, 8 Checklists, 6 Chemicals, 8 Audit Logs)
const MOCK_ACTIVE_SCHEDULE = [
  { id: "DC-801", taskName: "Quarterly Deep Sanitize", room: "305", areaType: "Guest Room", priority: "High", staff: "Meena Kumari", supervisor: "Ravi Shankar", checklist: "Guest Room Deep Clean", blockType: "OOO", status: "In Progress", score: "—", dueDate: "2026-07-20", beforePhoto: true, afterPhoto: false, maintHold: false },
  { id: "DC-802", taskName: "Balcony Pressure Scrub", room: "Suite 412", areaType: "Suite", priority: "Critical", staff: "Rajesh Kumar", supervisor: "Ravi Shankar", checklist: "Luxury Suite Deep Clean", blockType: "OOO", status: "Pending Maintenance", score: "—", dueDate: "2026-07-20", beforePhoto: true, afterPhoto: true, maintHold: true, maintIssue: "AC Compressor Leakage" },
  { id: "DC-803", taskName: "Marble Buffing & Polish", room: "Main Lobby", areaType: "Public Area", priority: "Medium", staff: "Anita Roy", supervisor: "Sanjay Patel", checklist: "Public Lobby & Elevators", blockType: "OOS", status: "Awaiting Inspection", score: "96%", dueDate: "2026-07-20", beforePhoto: true, afterPhoto: true, maintHold: false },
  { id: "DC-804", taskName: "Exhaust Degreasing", room: "Main Kitchen", areaType: "Kitchen", priority: "High", staff: "Vikram Singh", supervisor: "Sanjay Patel", checklist: "Commercial Kitchen Degrease", blockType: "OOS", status: "Scheduled", score: "—", dueDate: "2026-07-21", beforePhoto: false, afterPhoto: false, maintHold: false },
  { id: "DC-805", taskName: "Deep Acid Wash", room: "Pool Deck", areaType: "Swimming Pool", priority: "Low", staff: "Pooja Verma", supervisor: "Ravi Shankar", checklist: "Outdoor Pool & Deck", blockType: "OOS", status: "Completed", score: "98%", dueDate: "2026-07-19", beforePhoto: true, afterPhoto: true, maintHold: false },
  { id: "DC-806", taskName: "Carpet Steam Wash", room: "Room 108", areaType: "Guest Room", priority: "High", staff: "Meena Kumari", supervisor: "Ravi Shankar", checklist: "Guest Room Deep Clean", blockType: "OOO", status: "Overdue", score: "—", dueDate: "2026-07-18", beforePhoto: false, afterPhoto: false, maintHold: false },
];

const MOCK_RECURRING_SCHEDULE = [
  { id: "REC-101", area: "Rooms 301–310", frequency: "Every 90 Days", lastClean: "2026-04-20", nextDue: "2026-07-20", team: "Team Alpha", badgeColor: "red", status: "Due Today" },
  { id: "REC-102", area: "Suites 401–405", frequency: "Every 60 Days", lastClean: "2026-05-25", nextDue: "2026-07-25", team: "Team Beta", badgeColor: "yellow", status: "Due in 5 Days" },
  { id: "REC-103", area: "Main Lobby & Atrium", frequency: "Monthly", lastClean: "2026-07-01", nextDue: "2026-08-01", team: "Night Crew", badgeColor: "green", status: "On Track" },
  { id: "REC-104", area: "Kitchen Exhaust Hoods", frequency: "Every 30 Days", lastClean: "2026-06-15", nextDue: "2026-07-15", team: "Specialist Team", badgeColor: "red", status: "Overdue" },
  { id: "REC-105", area: "Spa & Sauna Deck", frequency: "Weekly", lastClean: "2026-07-14", nextDue: "2026-07-21", team: "Team Alpha", badgeColor: "green", status: "On Track" },
];

const MOCK_CHECKLIST_TEMPLATES = [
  { name: "Guest Room Deep Clean", tasksCount: 12, duration: "45 mins", category: "Guest Room", updated: "10 Jul 2026" },
  { name: "Luxury Suite Deep Clean", tasksCount: 18, duration: "90 mins", category: "Suite", updated: "12 Jul 2026" },
  { name: "Public Lobby & Elevators", tasksCount: 10, duration: "60 mins", category: "Public Area", updated: "05 Jul 2026" },
  { name: "Main Restaurant & Dining", tasksCount: 14, duration: "75 mins", category: "Restaurant", updated: "08 Jul 2026" },
  { name: "Commercial Kitchen Degrease", tasksCount: 16, duration: "120 mins", category: "Kitchen", updated: "01 Jul 2026" },
  { name: "Outdoor Pool & Deck", tasksCount: 8, duration: "90 mins", category: "Swimming Pool", updated: "14 Jul 2026" },
  { name: "Conference Hall & Ballroom", tasksCount: 12, duration: "105 mins", category: "Conference Hall", updated: "11 Jul 2026" },
  { name: "Fitness Center & Spa", tasksCount: 11, duration: "60 mins", category: "Gym & Spa", updated: "09 Jul 2026" },
];

const MOCK_CHEMICAL_USAGE = [
  { name: "Taski R2 All-Purpose Cleaner", unit: "Liters", opening: 50, consumed: 8.5, balance: 41.5, isLow: false, autoDeduct: true, status: "Optimal" },
  { name: "Suma Degreaser D3 (Heavy Duty)", unit: "Canisters", opening: 20, consumed: 4.0, balance: 16.0, isLow: false, autoDeduct: true, status: "Optimal" },
  { name: "Taski TR103 Carpet Shampoo", unit: "Liters", opening: 15, consumed: 12.0, balance: 3.0, isLow: true, autoDeduct: true, status: "Low Stock" },
  { name: "Clorox Commercial Disinfectant", unit: "Gallons", opening: 30, consumed: 5.5, balance: 24.5, isLow: false, autoDeduct: true, status: "Optimal" },
  { name: "Marble Polish Wax C2", unit: "Kg", opening: 10, consumed: 2.0, balance: 8.0, isLow: false, autoDeduct: true, status: "Optimal" },
  { name: "Sanitizer Fogging Liquid", unit: "Liters", opening: 25, consumed: 18.0, balance: 7.0, isLow: true, autoDeduct: true, status: "Low Stock" },
];

const MOCK_AUDIT_LOGS = [
  { time: "2026-07-20 11:30 AM", user: "Ravi Shankar", action: "Maintenance Hold", room: "Suite 412", remarks: "AC Compressor leak flagged during balcony clean" },
  { time: "2026-07-20 10:15 AM", user: "Meena Kumari", action: "Cleaning Started", room: "305", remarks: "Before photos uploaded. OOO status active." },
  { time: "2026-07-20 09:00 AM", user: "Sanjay Patel", action: "Inspection Passed", room: "Main Lobby", remarks: "Score 96%. Area released." },
  { time: "2026-07-19 04:45 PM", user: "Pooja Verma", action: "Task Completed", room: "Pool Deck", remarks: "Deep acid wash finished. Score 98%." },
  { time: "2026-07-19 02:20 PM", user: "Ravi Shankar", action: "Schedule Created", room: "Main Kitchen", remarks: "Commercial degreasing assigned to Vikram" },
  { time: "2026-07-18 06:10 PM", user: "Meena Kumari", action: "Task Overdue Alert", room: "Room 108", remarks: "Carpet wash delayed past schedule limit" },
  { time: "2026-07-18 01:00 PM", user: "Anita Roy", action: "Photos Uploaded", room: "Main Lobby", remarks: "Before & After marble buffing photos saved" },
  { time: "2026-07-17 11:00 AM", user: "Ravi Shankar", action: "Room Blocked (OOO)", room: "Room 305", remarks: "Blocked in PMS for quarterly deep clean" },
];

export default function DeepCleaningPage() {
  const [isMounted, setIsMounted] = useState(false);
  const { rooms, staff } = useHousekeeping();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [activeTab, setActiveTab] = useState<"active" | "recurring" | "checklists" | "chemicals" | "reports" | "audit">("active");

  // Filters - Active Schedule
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (areaFilter !== "All") count++;
    if (statusFilter !== "All") count++;
    if (priorityFilter !== "All") count++;
    return count;
  }, [areaFilter, statusFilter, priorityFilter]);

  // Drawers & Consoles
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  // Form State - Register Deep Clean
  const [taskName, setTaskName] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("305");
  const [selectedAreaType, setSelectedAreaType] = useState("Guest Room");
  const [priority, setPriority] = useState("High");
  const [staffAssigned, setStaffAssigned] = useState("Meena Kumari");
  const [supervisor, setSupervisor] = useState("Ravi Shankar");
  const [blockType, setBlockType] = useState<"OOO" | "OOS" | "None">("OOO");
  const [scheduleDate, setScheduleDate] = useState("2026-07-20");
  const [duration, setDuration] = useState("60 mins");
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState("Every 90 Days");

  // Checklist Selection
  const [checklistItems, setChecklistItems] = useState([
    { id: 1, text: "AC Filter Removal & Chemical Wash", done: true },
    { id: 2, text: "Mattress Flip & Steam Sanitization", done: true },
    { id: 3, text: "Curtain & Upholstery Deep Vacuum", done: false },
    { id: 4, text: "Bathroom Tile Descaling & Grout Wash", done: false },
    { id: 5, text: "Wardrobe & Safe Interior Polish", done: false },
  ]);

  // Chemical Consumption Form
  const [chemicalList, setChemicalList] = useState([
    { name: "Taski R2 All-Purpose Cleaner", qty: "1.5", unit: "Liters" },
    { name: "Clorox Commercial Disinfectant", qty: "0.5", unit: "Gallons" },
  ]);

  // Photo Section State
  const [beforePhoto, setBeforePhoto] = useState<string | null>("uploaded_before.jpg");
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);

  // Maintenance Hold Section State
  const [hasMaintIssue, setHasMaintIssue] = useState(false);
  const [maintCategory, setMaintCategory] = useState("Plumbing");
  const [maintDesc, setMaintDesc] = useState("");
  const [maintSeverity, setMaintSeverity] = useState("High");

  // Toast
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Update Checklist when Area Type changes
  useEffect(() => {
    if (selectedAreaType === "Kitchen") {
      setChecklistItems([
        { id: 1, text: "Exhaust Hood Degreasing & Filter Scrub", done: false },
        { id: 2, text: "Floor Drain Flushing & Chemical Sanitize", done: false },
        { id: 3, text: "Commercial Oven & Griddle Polish", done: false },
        { id: 4, text: "Stainless Steel Prep Table Sanitization", done: false },
      ]);
    } else if (selectedAreaType === "Public Area" || selectedAreaType === "Lobby") {
      setChecklistItems([
        { id: 1, text: "Marble Floor Waxing & Machine Polish", done: false },
        { id: 2, text: "Chandelier & High Ceiling Dusting", done: false },
        { id: 3, text: "Leather Furniture Conditioning", done: false },
        { id: 4, text: "Exterior Glass & Entrance Scrubbing", done: false },
      ]);
    } else {
      setChecklistItems([
        { id: 1, text: "AC Filter Removal & Chemical Wash", done: true },
        { id: 2, text: "Mattress Flip & Steam Sanitization", done: true },
        { id: 3, text: "Curtain & Upholstery Deep Vacuum", done: false },
        { id: 4, text: "Bathroom Tile Descaling & Grout Wash", done: false },
        { id: 5, text: "Wardrobe & Safe Interior Polish", done: false },
      ]);
    }
  }, [selectedAreaType]);

  // Filtered Active Tasks
  const filteredActiveTasks = useMemo(() => {
    return MOCK_ACTIVE_SCHEDULE.filter((task) => {
      const matchSearch =
        task.taskName.toLowerCase().includes(search.toLowerCase()) ||
        task.id.toLowerCase().includes(search.toLowerCase()) ||
        task.room.toLowerCase().includes(search.toLowerCase()) ||
        task.staff.toLowerCase().includes(search.toLowerCase());
      const matchArea = areaFilter === "All" || task.areaType === areaFilter;
      const matchStatus = statusFilter === "All" || task.status === statusFilter;
      const matchPriority = priorityFilter === "All" || task.priority === priorityFilter;

      return matchSearch && matchArea && matchStatus && matchPriority;
    });
  }, [search, areaFilter, statusFilter, priorityFilter]);

  const handleCreateSubmit = () => {
    if (!taskName.trim()) return;
    setCreateDrawerOpen(false);
    setTaskName("");
    setToast({ message: `Deep cleaning schedule created for Room ${selectedRoom}!`, variant: "success" });
  };

  const statusBadges: Record<string, string> = {
    Scheduled: "bg-slate-100 text-slate-700 border-slate-200",
    Assigned: "bg-blue-50 text-blue-750 border-blue-200",
    "In Progress": "bg-amber-50 text-amber-700 border-amber-200 font-extrabold animate-pulse",
    "Awaiting Inspection": "bg-purple-50 text-purple-700 border-purple-200 font-extrabold",
    Completed: "bg-green-50 text-green-900 border-green-200 font-extrabold",
    "Pending Maintenance": "bg-red-50 text-red-700 border-red-200 font-extrabold animate-pulse",
    OnHold: "bg-slate-100 text-slate-600 border-slate-200",
    Overdue: "bg-red-50 text-red-700 border-red-200 font-extrabold",
  };

  const blockBadges: Record<string, string> = {
    OOO: "bg-red-50 text-red-700 border-red-200 font-extrabold",
    OOS: "bg-amber-50 text-amber-700 border-amber-200 font-bold",
    None: "bg-slate-50 text-slate-500 border-slate-200",
  };

  if (!isMounted) {
    return (
      <div className="space-y-4 select-none">
        <div className="flex flex-col gap-2 pb-1 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Operations</span>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Deep Cleaning & Preventive Care</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 select-none">
      {/* Header */}
      <div className="flex flex-col gap-2 pb-1 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Operations</span>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Deep Cleaning & Preventive Care</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setCreateDrawerOpen(true)}
            className="!bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white flex items-center justify-center gap-1.5 rounded-xl h-8 px-3.5 text-xs font-bold shrink-0 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" /> New Schedule
          </Button>
        </div>
      </div>

      {/* Toast notifier */}
      {toast && (
        <div className={cn(
          "fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl p-3 text-xs font-bold shadow-xl animate-in fade-in slide-in-from-bottom-2",
          toast.variant === "success" ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"
        )}>
          <CheckCircle2 className="h-4 w-4" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top 6 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Scheduled Today</p>
            <h3 className="text-lg font-extrabold text-slate-800 leading-tight">6 Tasks</h3>
          </div>
          <div className="rounded-lg bg-slate-50 p-2 text-slate-600 shrink-0">
            <Calendar className="h-4 w-4" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">In Progress</p>
            <h3 className="text-lg font-extrabold text-amber-700 leading-tight">3 Tasks</h3>
          </div>
          <div className="rounded-lg bg-amber-50 p-2 text-amber-600 shrink-0">
            <Clock className="h-4 w-4" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Awaiting Inspection</p>
            <h3 className="text-lg font-extrabold text-purple-700 leading-tight">2 Tasks</h3>
          </div>
          <div className="rounded-lg bg-purple-50 p-2 text-purple-600 shrink-0">
            <ShieldCheck className="h-4 w-4" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Overdue Tasks</p>
            <h3 className="text-lg font-extrabold text-red-700 leading-tight">2 Tasks</h3>
          </div>
          <div className="rounded-lg bg-red-50 p-2 text-red-600 shrink-0">
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Maint. Hold</p>
            <h3 className="text-lg font-extrabold text-red-700 leading-tight">1 Task</h3>
          </div>
          <div className="rounded-lg bg-red-50 p-2 text-red-600 shrink-0">
            <Wrench className="h-4 w-4" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Completed Today</p>
            <h3 className="text-lg font-extrabold text-emerald-800 leading-tight">4 Tasks</h3>
          </div>
          <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700 shrink-0">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Top Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex flex-wrap gap-4 text-xs font-bold uppercase tracking-wider">
          {[
            { id: "active", label: `Active Schedule (${MOCK_ACTIVE_SCHEDULE.length})` },
            { id: "recurring", label: `Recurring Schedule (${MOCK_RECURRING_SCHEDULE.length})` },
            { id: "checklists", label: `Checklist Templates (${MOCK_CHECKLIST_TEMPLATES.length})` },
            { id: "chemicals", label: `Chemical Usage (${MOCK_CHEMICAL_USAGE.length})` },
            { id: "reports", label: "Reports" },
            { id: "audit", label: `Operational Audit Logs (${MOCK_AUDIT_LOGS.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "pb-2.5 px-0.5 border-b-2 transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "border-emerald-700 text-emerald-755 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* TAB 1: ACTIVE SCHEDULE */}
      {activeTab === "active" && (
        <div className="space-y-3">
          {/* Standard Operations Toolbar */}
          <OperationsToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search task ID, room, staff name, or area type…"
            activeFilterCount={activeFilterCount}
            onOpenFilters={() => setFilterDrawerOpen(true)}
          />

          {/* Slide-over Filter Drawer */}
          <OperationsFilterDrawer
            open={filterDrawerOpen}
            onClose={() => setFilterDrawerOpen(false)}
            title="Filter Deep Cleaning Tasks"
            activeFilterCount={activeFilterCount}
            onReset={() => {
              setAreaFilter("All");
              setStatusFilter("All");
              setPriorityFilter("All");
            }}
          >
            <div className="space-y-4 select-none">
              <FormField label="Area Type">
                <SelectInput
                  value={areaFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAreaFilter(e.target.value)}
                  className="w-full text-xs rounded-xl h-9 bg-white"
                >
                  <option value="All">All Area Types</option>
                  <option value="Guest Room">Guest Room</option>
                  <option value="Suite">Suite</option>
                  <option value="Public Area">Public Area</option>
                  <option value="Kitchen">Kitchen</option>
                  <option value="Swimming Pool">Swimming Pool</option>
                </SelectInput>
              </FormField>

              <FormField label="Status">
                <SelectInput
                  value={statusFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
                  className="w-full text-xs rounded-xl h-9 bg-white"
                >
                  <option value="All">All Statuses</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Awaiting Inspection">Awaiting Inspection</option>
                  <option value="Pending Maintenance">Pending Maintenance</option>
                  <option value="Completed">Completed</option>
                  <option value="Overdue">Overdue</option>
                </SelectInput>
              </FormField>

              <FormField label="Priority">
                <SelectInput
                  value={priorityFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPriorityFilter(e.target.value)}
                  className="w-full text-xs rounded-xl h-9 bg-white"
                >
                  <option value="All">All Priorities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </SelectInput>
              </FormField>
            </div>
          </OperationsFilterDrawer>

          {/* Active Schedule Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold sticky top-0 bg-slate-50 z-10">
                  <th className="px-3 py-2.5">Task ID</th>
                  <th className="px-3 py-2.5">Room / Area</th>
                  <th className="px-3 py-2.5">Area Type</th>
                  <th className="px-3 py-2.5">Priority</th>
                  <th className="px-3 py-2.5">Assigned Staff</th>
                  <th className="px-3 py-2.5">Checklist Template</th>
                  <th className="px-3 py-2.5 text-center">Block Type</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                  <th className="px-3 py-2.5 text-center">Score</th>
                  <th className="px-3 py-2.5">Due Date</th>
                  <th className="px-3 py-2.5 text-right w-16">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredActiveTasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-2.5 font-extrabold text-emerald-800 text-[11px]">{task.id}</td>
                    <td className="px-3 py-2.5">
                      <span className="font-extrabold text-slate-800 block">{task.room}</span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{task.areaType}</td>
                    <td className="px-3 py-2.5">
                      <span className={cn(
                        "rounded px-1.5 py-0.5 text-[8.5px] border font-extrabold uppercase",
                        task.priority === "Critical" || task.priority === "High" ? "bg-red-50 text-red-700 border-red-200" : "bg-slate-100 text-slate-700 border-slate-200"
                      )}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-800">{task.staff}</td>
                    <td className="px-3 py-2.5 text-slate-500 font-medium">{task.checklist}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={cn("rounded px-1.5 py-0.5 text-[8.5px] border uppercase", blockBadges[task.blockType])}>
                        {task.blockType}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={cn("rounded-full px-2 py-0.5 text-[8.5px] border font-bold uppercase whitespace-nowrap w-28 inline-block text-center", statusBadges[task.status])}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold text-slate-800">{task.score}</td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">{task.dueDate}</td>
                    <td className="px-3 py-2.5 text-right">
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTask(task);
                        }}
                        className="h-6 px-1.5 text-[9.5px] font-bold !bg-slate-100 hover:!bg-slate-200 !text-slate-750 !border-slate-200 rounded-md"
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RECURRING SCHEDULE */}
      {activeTab === "recurring" && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold sticky top-0 bg-slate-50 z-10">
                  <th className="px-3 py-2.5">Schedule ID</th>
                  <th className="px-3 py-2.5">Area / Rooms</th>
                  <th className="px-3 py-2.5">Frequency</th>
                  <th className="px-3 py-2.5">Last Deep Clean</th>
                  <th className="px-3 py-2.5">Next Due Date</th>
                  <th className="px-3 py-2.5">Assigned Team</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {MOCK_RECURRING_SCHEDULE.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2.5 text-[11px] font-extrabold text-emerald-800">{rec.id}</td>
                    <td className="px-3 py-2.5 font-extrabold text-slate-800">{rec.area}</td>
                    <td className="px-3 py-2.5 text-slate-600">{rec.frequency}</td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">{rec.lastClean}</td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-slate-900 font-extrabold">{rec.nextDue}</td>
                    <td className="px-3 py-2.5 text-slate-800">{rec.team}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[8.5px] border font-bold uppercase w-24 inline-block text-center",
                        rec.badgeColor === "red" ? "bg-red-50 text-red-700 border-red-200 font-extrabold" :
                        rec.badgeColor === "yellow" ? "bg-amber-50 text-amber-700 border-amber-200 font-bold" : "bg-green-50 text-green-900 border-green-200"
                      )}>
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CHECKLIST TEMPLATES */}
      {activeTab === "checklists" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {MOCK_CHECKLIST_TEMPLATES.map((tmpl, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700">{tmpl.category}</span>
                  <h4 className="font-extrabold text-slate-800 text-xs">{tmpl.name}</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Updated: {tmpl.updated}</p>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 pt-2 border-t border-slate-100">
                  <span>{tmpl.tasksCount} Tasks</span>
                  <span className="font-mono text-[10px] text-slate-400">{tmpl.duration}</span>
                </div>

                <Button variant="outline" className="w-full h-7 text-[10px] font-bold !bg-slate-100 hover:!bg-slate-200 !text-slate-750 !border-slate-200 rounded-lg">
                  View Template Tasks
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CHEMICAL USAGE */}
      {activeTab === "chemicals" && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold sticky top-0 bg-slate-50 z-10">
                  <th className="px-3 py-2.5">Chemical Name</th>
                  <th className="px-3 py-2.5">Unit</th>
                  <th className="px-3 py-2.5 text-center">Opening Stock</th>
                  <th className="px-3 py-2.5 text-center">Consumed Today</th>
                  <th className="px-3 py-2.5 text-center">Balance Stock</th>
                  <th className="px-3 py-2.5 text-center">Auto-Deduct</th>
                  <th className="px-3 py-2.5 text-center">Stock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {MOCK_CHEMICAL_USAGE.map((chem, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2.5 font-extrabold text-slate-800">{chem.name}</td>
                    <td className="px-3 py-2.5 text-slate-500 font-mono text-[10px]">{chem.unit}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-slate-700">{chem.opening}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-amber-700">{chem.consumed}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-slate-900">{chem.balance}</td>
                    <td className="px-3 py-2.5 text-center text-emerald-700 font-extrabold text-[10px]">
                      {chem.autoDeduct ? "Active (Auto)" : "Manual"}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[8.5px] border font-bold uppercase w-24 inline-block text-center",
                        chem.isLow ? "bg-red-50 text-red-700 border-red-200 font-extrabold" : "bg-green-50 text-green-900 border-green-200"
                      )}>
                        {chem.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: REPORTS */}
      {activeTab === "reports" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { title: "Deep Cleaning Summary Report", desc: "Overview of all active, overdue, and completed tasks.", icon: FileText },
              { title: "Overdue Tasks Audit", desc: "List of tasks exceeding scheduled SLA limits.", icon: AlertTriangle },
              { title: "Recurring Schedule Rotation", desc: "Planned 30/60/90 day room cleaning cycles.", icon: RefreshCw },
              { title: "Chemical Inventory Usage", desc: "Departmental chemical consumption and reorder points.", icon: Box },
              { title: "Staff Productivity Report", desc: "Task duration and completion rates by attendant.", icon: User },
              { title: "Quality Inspection Scores", desc: "Supervisor grading scores and pass/fail statistics.", icon: ShieldCheck },
            ].map((rep, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-xs">{rep.title}</h4>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-tight">{rep.desc}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 text-slate-600 shrink-0">
                    <rep.icon className="h-4 w-4" />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <span className="text-[9.5px] font-bold text-emerald-750">Ready</span>
                  <Button variant="outline" className="h-6 px-2 text-[9.5px] font-bold !bg-slate-100 hover:!bg-slate-200 !text-slate-750 !border-slate-200 rounded-md">
                    Export
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT LOGS */}
      {activeTab === "audit" && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold sticky top-0 bg-slate-50 z-10">
                  <th className="px-3 py-2.5">Timestamp</th>
                  <th className="px-3 py-2.5">User</th>
                  <th className="px-3 py-2.5">Action</th>
                  <th className="px-3 py-2.5">Room / Area</th>
                  <th className="px-3 py-2.5 text-right">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[10.5px] text-slate-700">
                {MOCK_AUDIT_LOGS.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2.5 text-slate-400 whitespace-nowrap">{log.time}</td>
                    <td className="px-3 py-2.5 text-slate-900 font-sans font-bold">{log.user}</td>
                    <td className="px-3 py-2.5 font-bold text-slate-900">{log.action}</td>
                    <td className="px-3 py-2.5 text-emerald-805 font-bold">{log.room}</td>
                    <td className="px-3 py-2.5 text-right text-slate-500 font-sans">{log.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TASK CONSOLE DRAWER */}
      <Drawer
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title={`${selectedTask?.id || "Task"} Details & Console`}
        width="lg"
      >
        {selectedTask && (
          <div className="flex flex-col h-full bg-slate-50/30 select-none">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              
              {/* Task Details */}
              <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs space-y-2.5">
                <h4 className="font-bold text-slate-855 text-[11px] uppercase tracking-wider border-b border-slate-50 pb-1 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-700" /> Task Overview
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-semibold text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Task Name</span>
                    <span className="text-slate-900 font-extrabold text-[12px]">{selectedTask.taskName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Status</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[8.5px] border uppercase font-bold", statusBadges[selectedTask.status])}>
                      {selectedTask.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Room / Area</span>
                    <span className="text-slate-800">{selectedTask.room} ({selectedTask.areaType})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Block Type</span>
                    <span className={cn("rounded px-1.5 py-0.5 text-[8.5px] border uppercase", blockBadges[selectedTask.blockType])}>
                      {selectedTask.blockType}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Assigned Staff</span>
                    <span className="text-slate-800 font-bold">{selectedTask.staff}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Supervisor</span>
                    <span className="text-slate-800 font-bold">{selectedTask.supervisor}</span>
                  </div>
                </div>
              </div>

              {/* Maintenance Hold Alert Banner */}
              {selectedTask.maintHold && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 space-y-1">
                  <h4 className="font-extrabold text-red-800 text-xs flex items-center gap-1.5">
                    <Wrench className="h-4 w-4 text-red-600" /> Pending Maintenance Hold
                  </h4>
                  <p className="text-[10.5px] text-red-700 font-medium">
                    Issue: <strong className="font-extrabold">{selectedTask.maintIssue}</strong>
                  </p>
                  <p className="text-[9.5px] text-red-600 font-bold mt-1 bg-red-100/60 p-1.5 rounded-lg border border-red-200/50">
                    ⚠️ This room cannot be released until Engineering completes the maintenance repair.
                  </p>
                </div>
              )}

            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-3 flex gap-2 shadow-lg">
              <Button
                variant="outline"
                onClick={() => setSelectedTask(null)}
                className="w-full !bg-slate-100 hover:!bg-slate-200 !text-slate-700 !border-slate-205 flex items-center justify-center text-xs py-2 px-3 font-bold rounded-xl transition-all h-9"
              >
                Close Console
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* DRAWER: REGISTER DEEP CLEANING */}
      <Drawer open={createDrawerOpen} onClose={() => setCreateDrawerOpen(false)} title="Register Deep Cleaning" width="lg">
        <div className="space-y-4 select-none">
          
          {/* SECTION 1: BASIC DETAILS */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 border-b border-slate-100 pb-1">Basic Details</h4>
            
            <FormField label="Task Name" required>
              <TextInput
                placeholder="e.g. Quarterly Deep Sanitize"
                value={taskName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTaskName(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Room / Area" required>
                <TextInput
                  placeholder="e.g. Room 305 or Main Lobby"
                  value={selectedRoom}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedRoom(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </FormField>

              <FormField label="Area Type" required>
                <SelectInput
                  value={selectedAreaType}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedAreaType(e.target.value)}
                  className="h-9 text-xs rounded-xl bg-white text-slate-700 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 select-none"
                >
                  <option value="Guest Room">Guest Room</option>
                  <option value="Suite">Suite</option>
                  <option value="Public Area">Public Area / Lobby</option>
                  <option value="Kitchen">Commercial Kitchen</option>
                  <option value="Swimming Pool">Swimming Pool & Deck</option>
                </SelectInput>
              </FormField>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <FormField label="Priority" required>
                <SelectInput
                  value={priority}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPriority(e.target.value)}
                  className="h-9 text-xs rounded-xl bg-white text-slate-700 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 select-none"
                >
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </SelectInput>
              </FormField>

              <FormField label="Assigned Staff" required>
                <SelectInput
                  value={staffAssigned}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStaffAssigned(e.target.value)}
                  className="h-9 text-xs rounded-xl bg-white text-slate-700 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 select-none"
                >
                  <option value="Meena Kumari">Meena Kumari</option>
                  <option value="Rajesh Kumar">Rajesh Kumar</option>
                  <option value="Anita Roy">Anita Roy</option>
                  <option value="Vikram Singh">Vikram Singh</option>
                </SelectInput>
              </FormField>

              <FormField label="Supervisor" required>
                <SelectInput
                  value={supervisor}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSupervisor(e.target.value)}
                  className="h-9 text-xs rounded-xl bg-white text-slate-700 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 select-none"
                >
                  <option value="Ravi Shankar">Ravi Shankar</option>
                  <option value="Sanjay Patel">Sanjay Patel</option>
                </SelectInput>
              </FormField>
            </div>
          </div>

          {/* SECTION 2: SCHEDULING & BLOCK TYPE */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 border-b border-slate-100 pb-1">Scheduling & Room Blocking</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Schedule Date" required>
                <TextInput
                  type="date"
                  value={scheduleDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScheduleDate(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </FormField>

              <FormField label="Expected Duration" required>
                <TextInput
                  value={duration}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDuration(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </FormField>
            </div>

            <FormField label="Room Block Type (PMS Inventory)" required>
              <SelectInput
                value={blockType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBlockType(e.target.value as any)}
                className="h-9 text-xs rounded-xl bg-white text-slate-700 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 select-none"
              >
                <option value="OOO">Out of Order (OOO - Deduct Inventory)</option>
                <option value="OOS">Out of Service (OOS - Soft Hold)</option>
                <option value="None">None (Clean while Occupied)</option>
              </SelectInput>
            </FormField>

            {/* Informational Helper Text */}
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 text-[10px] text-slate-600 space-y-1">
              {blockType === "OOO" ? (
                <p>🔴 <strong className="font-bold text-red-700">Out of Order (OOO):</strong> Room removed from sellable inventory. Affects hotel occupancy & RevPAR metrics.</p>
              ) : blockType === "OOS" ? (
                <p>🟡 <strong className="font-bold text-amber-700">Out of Service (OOS):</strong> Room temporarily unavailable for assignment but not deducted from total sellable inventory.</p>
              ) : (
                <p>🟢 <strong className="font-bold text-emerald-700">None:</strong> Cleaning scheduled without PMS inventory hold.</p>
              )}
            </div>
          </div>

          {/* SECTION 3: DYNAMIC CHECKLIST TEMPLATE */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 border-b border-slate-100 pb-1 flex items-center justify-between">
              <span>Task Checklist ({selectedAreaType})</span>
              <span className="text-[9.5px] font-bold text-slate-400">Template Auto-Matched</span>
            </h4>

            <div className="space-y-1.5 rounded-xl border border-slate-200 bg-white p-3">
              {checklistItems.map((item) => (
                <label key={item.id} className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer font-medium hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => {
                      setChecklistItems(prev => prev.map(i => i.id === item.id ? { ...i, done: !i.done } : i));
                    }}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span className={cn(item.done && "line-through text-slate-400 font-normal")}>{item.text}</span>
                </label>
              ))}
            </div>
          </div>

          {/* SECTION 4: CHEMICAL CONSUMPTION */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 border-b border-slate-100 pb-1">Chemical Consumption</h4>
            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
              {chemicalList.map((chem, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 text-xs font-medium text-slate-700">
                  <span className="truncate flex-1 font-bold">{chem.name}</span>
                  <TextInput
                    value={chem.qty}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const val = e.target.value;
                      setChemicalList(prev => prev.map((c, i) => i === idx ? { ...c, qty: val } : c));
                    }}
                    className="w-16 h-7 text-xs rounded-lg text-center"
                  />
                  <span className="text-[10px] text-slate-400 w-12">{chem.unit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 5: PHOTO EVIDENCE */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 border-b border-slate-100 pb-1">Photo Evidence</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-center space-y-1 cursor-pointer hover:bg-slate-100/60 transition-colors">
                <Camera className="h-5 w-5 mx-auto text-slate-400" />
                <p className="text-[10px] font-bold text-slate-700">Before Cleaning</p>
                <p className="text-[9px] text-emerald-700 font-extrabold">{beforePhoto ? "✓ Photo Attached" : "Upload Photo"}</p>
              </div>

              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-center space-y-1 cursor-pointer hover:bg-slate-100/60 transition-colors">
                <Camera className="h-5 w-5 mx-auto text-slate-400" />
                <p className="text-[10px] font-bold text-slate-700">After Cleaning</p>
                <p className="text-[9px] text-slate-400 font-semibold">{afterPhoto ? "✓ Photo Attached" : "Upload Photo"}</p>
              </div>
            </div>
            <p className="text-[9.5px] text-amber-700 font-bold bg-amber-50 p-2 rounded-lg border border-amber-200/60">
              ⚠️ Validation: Minimum one Before photo and one After photo required before submitting for inspection.
            </p>
          </div>

          {/* SECTION 6: MAINTENANCE HOLD */}
          <div className="space-y-2.5 border-t border-slate-100 pt-3">
            <label className="flex items-center gap-2 text-xs font-extrabold text-red-700 cursor-pointer">
              <input
                type="checkbox"
                checked={hasMaintIssue}
                onChange={(e) => setHasMaintIssue(e.target.checked)}
                className="rounded border-slate-300 text-red-600 focus:ring-red-500 h-4 w-4"
              />
              <Wrench className="h-4 w-4 text-red-600" /> Maintenance Issue Found During Clean
            </label>

            {hasMaintIssue && (
              <div className="space-y-2.5 rounded-xl border border-red-200 bg-red-50/40 p-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Category" required>
                    <SelectInput
                      value={maintCategory}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMaintCategory(e.target.value)}
                      className="h-8 text-xs rounded-xl bg-white text-slate-700"
                    >
                      <option value="Plumbing">Plumbing</option>
                      <option value="Electrical">Electrical</option>
                      <option value="HVAC">HVAC / Air Conditioning</option>
                      <option value="Carpentry">Carpentry & Furniture</option>
                    </SelectInput>
                  </FormField>

                  <FormField label="Severity" required>
                    <SelectInput
                      value={maintSeverity}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMaintSeverity(e.target.value)}
                      className="h-8 text-xs rounded-xl bg-white text-slate-700"
                    >
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                      <option value="Medium">Medium</option>
                    </SelectInput>
                  </FormField>
                </div>

                <FormField label="Issue Description">
                  <TextInput
                    placeholder="e.g. AC compressor leaking water onto balcony"
                    value={maintDesc}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaintDesc(e.target.value)}
                    className="h-8 text-xs rounded-xl"
                  />
                </FormField>

                <p className="text-[9.5px] text-red-700 font-extrabold bg-red-100/60 p-2 rounded-lg border border-red-200">
                  🚫 This room cannot be released until Engineering completes the maintenance.
                </p>
              </div>
            )}
          </div>

          <Button
            onClick={handleCreateSubmit}
            className="w-full !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white font-bold rounded-xl shadow-xs h-11 text-xs transition-all mt-4"
          >
            Register Deep Cleaning
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
