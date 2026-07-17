"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useHousekeeping } from "@/components/housekeeping/HousekeepingContext";
import {
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Layers,
  FileText,
  BadgeAlert,
  User,
  Camera,
  Info,
  Settings,
  History,
  Check,
  Zap,
  ClipboardList,
  Search,
  AlertCircle,
  AlertOctagon,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  Coins,
  Package,
  Wrench,
  Percent,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { TextInput, SelectInput, FormField, TextAreaInput } from "@/components/frontoffice/ui";

const LAUNDRY_STATUS_STEPS: ["Collection", "Washing", "Ironing", "Ready", "Delivered"] = [
  "Collection",
  "Washing",
  "Ironing",
  "Ready",
  "Delivered",
];

// Helper components for design alignment
function KPIStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorClass,
  borderColor,
  isActive,
  onClick,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  borderColor: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-white p-4 shadow-sm cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        isActive ? "border-emerald-600 ring-2 ring-emerald-100 bg-emerald-50/5" : borderColor
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
          <h3 className="mt-1 text-xl font-extrabold tracking-tight text-slate-800">{value}</h3>
          <p className="mt-0.5 text-[10px] text-slate-500 font-medium">{subtitle}</p>
        </div>
        <div className={cn("rounded-xl p-2 shadow-xs", colorClass)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-slate-100 to-transparent" />
    </div>
  );
}

export default function LaundryOperations() {
  const {
    laundryJobs,
    inventory,
    addLaundryJob,
    updateLaundryStatus,
    discardLinenItem,
  } = useHousekeeping();

  const [activeTab, setActiveTab] = useState<"laundry" | "discard">("laundry");
  const [createOpen, setCreateOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  // Form: Laundry
  const [type, setType] = useState<"Guest" | "Hotel">("Guest");
  const [selectedItem, setSelectedItem] = useState("King Bed Sheets");
  const [guestItemText, setGuestItemText] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [room, setRoom] = useState("102");
  const [guestName, setGuestName] = useState("James Wilson");
  const [charges, setCharges] = useState("150");
  const [notes, setNotes] = useState("");

  // Form: Discard
  const [discardItemId, setDiscardItemId] = useState("");
  const [discardQty, setDiscardQty] = useState("1");

  // Advanced Filters State
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [roomFilter, setRoomFilter] = useState("All");
  const [staffFilter, setStaffFilter] = useState("All");
  const [machineFilter, setMachineFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [sortBy, setSortBy] = useState("ID");

  // Draft filter states for popover
  const [draftTypeFilter, setDraftTypeFilter] = useState("All");
  const [draftRoomFilter, setDraftRoomFilter] = useState("All");
  const [draftStaffFilter, setDraftStaffFilter] = useState("All");
  const [draftMachineFilter, setDraftMachineFilter] = useState("All");
  const [draftPriorityFilter, setDraftPriorityFilter] = useState("All");
  const [draftSortBy, setDraftSortBy] = useState("ID");

  const popoverRef = useRef<HTMLDivElement>(null);

  // Selection Drawers State
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedLinenId, setSelectedLinenId] = useState<string | null>(null);

  // KPI Active filters state
  const [kpiFilter, setKpiFilter] = useState<string>("all");

  // Toast State
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Sync draft states when popover toggles
  const handleTogglePopover = () => {
    if (!isFilterPopoverOpen) {
      setDraftTypeFilter(typeFilter);
      setDraftRoomFilter(roomFilter);
      setDraftStaffFilter(staffFilter);
      setDraftMachineFilter(machineFilter);
      setDraftPriorityFilter(priorityFilter);
      setDraftSortBy(sortBy);
    }
    setIsFilterPopoverOpen((prev) => !prev);
  };

  const handleApplyFilters = () => {
    setTypeFilter(draftTypeFilter);
    setRoomFilter(draftRoomFilter);
    setStaffFilter(draftStaffFilter);
    setMachineFilter(draftMachineFilter);
    setPriorityFilter(draftPriorityFilter);
    setSortBy(draftSortBy);
    setIsFilterPopoverOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsFilterPopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const hotelLinenItems = useMemo(() => {
    return inventory.filter((item) => item.category === "Linen");
  }, [inventory]);

  // Derived mock staff list
  const staffList = ["Meena", "Ravi Shankar", "Kiran Bala", "Suresh Kumar", "Anita Devi"];

  // Helper: map job ID or values to dynamic priorities
  const getJobPriority = (job: any): "Critical" | "High" | "Medium" | "Low" => {
    if (job.type === "Guest") {
      if (job.charges > 300) return "Critical";
      return "High";
    }
    if (job.quantity > 8) return "Medium";
    return "Low";
  };

  // Helper: map job status to dynamic machines
  const getJobMachine = (job: any): string => {
    if (job.status === "Washing") {
      const match = parseInt(job.id.slice(-2)) || 1;
      return `Machine W-0${(match % 3) + 1}`;
    }
    if (job.status === "Ironing") {
      return "Press Station P-02";
    }
    return "Unassigned";
  };

  // Helper: map job status to assigned staff
  const getJobStaff = (job: any): string => {
    const seed = parseInt(job.id.slice(-2)) || 0;
    return staffList[seed % staffList.length];
  };

  // Helper: get estimated finish time
  const getJobEstFinish = (job: any): string => {
    if (job.status === "Delivered") return "Delivered";
    const seed = parseInt(job.id.slice(-2)) || 1;
    const hour = (seed % 3) + 2; // 2, 3, or 4 hours
    return `16 Jul 0${hour}:30 PM`;
  };

  // Helper: check if delayed
  const isJobDelayed = (job: any): boolean => {
    return job.status !== "Delivered" && job.id.endsWith("2");
  };

  // Statistics & KPI calculations
  const kpis = useMemo(() => {
    const total = laundryJobs.length;
    const guest = laundryJobs.filter((j) => j.type === "Guest").length;
    const hotel = laundryJobs.filter((j) => j.type === "Hotel").length;
    const washing = laundryJobs.filter((j) => j.status === "Washing").length;
    const ironing = laundryJobs.filter((j) => j.status === "Ironing").length;
    const ready = laundryJobs.filter((j) => j.status === "Ready").length;
    const delivered = laundryJobs.filter((j) => j.status === "Delivered").length;
    const delayed = laundryJobs.filter(isJobDelayed).length;

    return { total, guest, hotel, washing, ironing, ready, delivered, delayed };
  }, [laundryJobs]);

  // Filtered laundry jobs
  const filteredJobs = useMemo(() => {
    let result = [...laundryJobs];

    // KPI Card Filter
    if (kpiFilter === "guest") {
      result = result.filter((j) => j.type === "Guest");
    } else if (kpiFilter === "hotel") {
      result = result.filter((j) => j.type === "Hotel");
    } else if (kpiFilter === "washing") {
      result = result.filter((j) => j.status === "Washing");
    } else if (kpiFilter === "ironing") {
      result = result.filter((j) => j.status === "Ironing");
    } else if (kpiFilter === "ready") {
      result = result.filter((j) => j.status === "Ready");
    } else if (kpiFilter === "delivered") {
      result = result.filter((j) => j.status === "Delivered");
    } else if (kpiFilter === "delayed") {
      result = result.filter(isJobDelayed);
    }

    // Search query
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (j) =>
          j.id.toLowerCase().includes(q) ||
          j.item.toLowerCase().includes(q) ||
          (j.guestName && j.guestName.toLowerCase().includes(q))
      );
    }

    // Status Filter
    if (statusFilter !== "All") {
      result = result.filter((j) => j.status === statusFilter);
    }

    // Type Filter
    if (typeFilter !== "All") {
      result = result.filter((j) => j.type === typeFilter);
    }

    // Room Filter
    if (roomFilter !== "All") {
      result = result.filter((j) => j.room === roomFilter);
    }

    // Staff Filter
    if (staffFilter !== "All") {
      result = result.filter((j) => getJobStaff(j) === staffFilter);
    }

    // Machine Filter
    if (machineFilter !== "All") {
      result = result.filter((j) => getJobMachine(j).includes(machineFilter));
    }

    // Priority Filter
    if (priorityFilter !== "All") {
      result = result.filter((j) => getJobPriority(j) === priorityFilter);
    }

    // Sort By
    if (sortBy === "ID") {
      result.sort((a, b) => b.id.localeCompare(a.id));
    } else if (sortBy === "Charges") {
      result.sort((a, b) => b.charges - a.charges);
    } else if (sortBy === "Items") {
      result.sort((a, b) => b.quantity - a.quantity);
    }

    return result;
  }, [laundryJobs, kpiFilter, search, statusFilter, typeFilter, roomFilter, staffFilter, machineFilter, priorityFilter, sortBy]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (typeFilter !== "All") count++;
    if (roomFilter !== "All") count++;
    if (staffFilter !== "All") count++;
    if (machineFilter !== "All") count++;
    if (priorityFilter !== "All") count++;
    if (sortBy !== "ID") count++;
    return count;
  }, [typeFilter, roomFilter, staffFilter, machineFilter, priorityFilter, sortBy]);

  // Selected laundry job
  const selectedJob = useMemo(() => {
    return laundryJobs.find((j) => j.id === selectedJobId) || null;
  }, [laundryJobs, selectedJobId]);

  // Selected linen item
  const selectedLinen = useMemo(() => {
    return hotelLinenItems.find((item) => item.id === selectedLinenId) || null;
  }, [hotelLinenItems, selectedLinenId]);

  const handleCreateJob = () => {
    const qty = parseInt(quantity, 10) || 1;
    const price = parseFloat(charges) || 0;

    addLaundryJob({
      type,
      item: type === "Hotel" ? selectedItem : guestItemText,
      quantity: qty,
      room: type === "Guest" ? room : undefined,
      guestName: type === "Guest" ? guestName : undefined,
      charges: price,
      notes,
    });

    setCreateOpen(false);
    setGuestItemText("");
    setNotes("");
    setToast({ message: "Laundry job booked successfully!", variant: "success" });
  };

  const handleDiscard = () => {
    const qty = parseInt(discardQty, 10) || 1;
    if (!discardItemId) return;
    discardLinenItem(discardItemId, qty);
    setDiscardOpen(false);
    setToast({ message: `${qty} Linen items discarded successfully.`, variant: "info" });
  };

  const advanceStatus = (id: string, current: string) => {
    const idx = LAUNDRY_STATUS_STEPS.indexOf(current as any);
    if (idx === -1 || idx === LAUNDRY_STATUS_STEPS.length - 1) return;
    const next = LAUNDRY_STATUS_STEPS[idx + 1];
    updateLaundryStatus(id, next);
    setToast({ message: `Job ${id} updated to ${next} status.`, variant: "success" });
  };

  // Status Badge Colors mapping (Matching exact requirements)
  const statusBadges = {
    Collection: "bg-blue-50 text-blue-700 border border-blue-100",
    Washing: "bg-orange-50 text-orange-700 border border-orange-100 animate-pulse",
    Drying: "bg-purple-50 text-purple-700 border border-purple-100",
    Ironing: "bg-yellow-50 text-yellow-800 border border-yellow-200",
    Ready: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    Delivered: "bg-green-50 text-green-900 border border-green-200 font-extrabold",
    Delayed: "bg-red-50 text-red-700 border border-red-100 font-extrabold animate-pulse",
  };

  const priorityColors = {
    Critical: "bg-red-100 text-red-800 border border-red-200 animate-pulse",
    High: "bg-red-50 text-red-700 border border-red-100",
    Medium: "bg-amber-50 text-amber-700 border border-amber-100",
    Low: "bg-slate-50 text-slate-600 border border-slate-200",
  };

  // Simulated machine stats helper
  const getMachineInfo = (job: any) => {
    const machine = getJobMachine(job);
    return {
      machine,
      capacity: "85%",
      load: job.type === "Hotel" ? "Internal Linen Batch" : "Guest Laundry Load",
      operator: getJobStaff(job),
      cycle: job.status === "Washing" ? "Normal Wash" : "Press Station Cycle",
      duration: "15 mins remaining",
    };
  };

  return (
    <div className="space-y-6">
      {/* Title Header with Action Buttons */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Operations</span>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-800 tracking-tight">Laundry & Linen Management</h1>
          <p className="text-xs text-slate-500 font-medium max-w-2xl mt-0.5">
            Process hotel linen batches, discard logs, and premium guest laundry bags. Track active laundry pipelines and wash capacities.
          </p>
        </div>

        <div className="flex gap-2.5 text-xs self-start lg:self-center">
          <Button
            onClick={() => {
              setSelectedItem(hotelLinenItems[0]?.name || "");
              setCreateOpen(true);
            }}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 rounded-xl h-9 px-3.5 shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" /> Book Laundry
          </Button>
          <Button
            onClick={() => {
              setDiscardItemId(hotelLinenItems[0]?.id || "");
              setDiscardOpen(true);
            }}
            className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold text-xs flex items-center justify-center gap-1.5 rounded-xl h-9 px-3.5 shadow-sm transition-all"
          >
            <Trash2 className="h-4 w-4" /> Discard Linen
          </Button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => {
              setActiveTab("laundry");
              setKpiFilter("all");
            }}
            className={cn(
              "pb-3 px-1 border-b-2 transition-all",
              activeTab === "laundry"
                ? "border-emerald-700 text-emerald-700"
                : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            Active Laundry Queue ({laundryJobs.filter((l) => l.status !== "Delivered").length})
          </button>
          <button
            onClick={() => {
              setActiveTab("discard");
              setKpiFilter("all");
            }}
            className={cn(
              "pb-3 px-1 border-b-2 transition-all",
              activeTab === "discard"
                ? "border-emerald-700 text-emerald-700"
                : "border-transparent text-slate-400 hover:text-slate-650"
            )}
          >
            Linen Discards & Lifespans ({hotelLinenItems.length})
          </button>
        </nav>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={cn(
          "fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl p-3.5 text-xs font-bold shadow-xl animate-in fade-in slide-in-from-bottom-2",
          toast.variant === "success" ? "bg-emerald-600 text-white" :
          toast.variant === "error" ? "bg-red-600 text-white" : "bg-blue-600 text-white"
        )}>
          {toast.variant === "success" ? <CheckCircle2 className="h-4 w-4" /> : <Info className="h-4 w-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ACTIVE TAB: LAUNDRY FLOW */}
      {activeTab === "laundry" ? (
        <div className="space-y-6">
          {/* Dashboard KPI Cards Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            <KPIStatCard
              title="Total Laundry"
              value={kpis.total}
              subtitle="Registered Jobs"
              icon={Layers}
              colorClass="bg-slate-50 text-slate-600"
              borderColor="border-slate-100 hover:border-slate-200"
              isActive={kpiFilter === "all"}
              onClick={() => setKpiFilter("all")}
            />
            <KPIStatCard
              title="Guest Laundry"
              value={kpis.guest}
              subtitle="Personal garments"
              icon={User}
              colorClass="bg-violet-50 text-violet-600"
              borderColor="border-slate-100 hover:border-slate-200"
              isActive={kpiFilter === "guest"}
              onClick={() => setKpiFilter(kpiFilter === "guest" ? "all" : "guest")}
            />
            <KPIStatCard
              title="Hotel Linen"
              value={kpis.hotel}
              subtitle="Internal stocks"
              icon={Package}
              colorClass="bg-blue-50 text-blue-600"
              borderColor="border-slate-100 hover:border-slate-200"
              isActive={kpiFilter === "hotel"}
              onClick={() => setKpiFilter(kpiFilter === "hotel" ? "all" : "hotel")}
            />
            <KPIStatCard
              title="Washing"
              value={kpis.washing}
              subtitle="Active wash cycle"
              icon={Clock}
              colorClass="bg-orange-50 text-orange-600"
              borderColor="border-slate-100 hover:border-slate-200"
              isActive={kpiFilter === "washing"}
              onClick={() => setKpiFilter(kpiFilter === "washing" ? "all" : "washing")}
            />
            <KPIStatCard
              title="Ironing"
              value={kpis.ironing}
              subtitle="Press station queue"
              icon={Zap}
              colorClass="bg-yellow-50 text-yellow-600"
              borderColor="border-slate-100 hover:border-slate-200"
              isActive={kpiFilter === "ironing"}
              onClick={() => setKpiFilter(kpiFilter === "ironing" ? "all" : "ironing")}
            />
            <KPIStatCard
              title="Ready"
              value={kpis.ready}
              subtitle="Packed & sorted"
              icon={CheckCircle2}
              colorClass="bg-emerald-50 text-emerald-600"
              borderColor="border-slate-100 hover:border-slate-200"
              isActive={kpiFilter === "ready"}
              onClick={() => setKpiFilter(kpiFilter === "ready" ? "all" : "ready")}
            />
            <KPIStatCard
              title="Delivered"
              value={kpis.delivered}
              subtitle="Discharged jobs"
              icon={ShieldCheck}
              colorClass="bg-green-50 text-green-700"
              borderColor="border-slate-100 hover:border-slate-200"
              isActive={kpiFilter === "delivered"}
              onClick={() => setKpiFilter(kpiFilter === "delivered" ? "all" : "delivered")}
            />
            <KPIStatCard
              title="Delayed Jobs"
              value={kpis.delayed}
              subtitle="Action required"
              icon={AlertOctagon}
              colorClass="bg-red-50 text-red-600"
              borderColor="border-red-100 hover:border-red-200"
              isActive={kpiFilter === "delayed"}
              onClick={() => setKpiFilter(kpiFilter === "delayed" ? "all" : "delayed")}
            />
          </div>

          {/* Search & Enterprise Filters Toolbar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row items-stretch md:items-center">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Active Laundry Jobs (ID, Item, Room, Guest)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100/50"
                />
              </div>

              {/* Quick Status filter */}
              <div className="w-full md:w-44">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="Collection">Collection</option>
                  <option value="Washing">Washing</option>
                  <option value="Ironing">Ironing</option>
                  <option value="Ready">Ready</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>

              {/* Advanced Filters Popover Panel */}
              <div className="relative flex shrink-0" ref={popoverRef}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTogglePopover}
                  className="h-10 px-4 flex items-center justify-center gap-2 rounded-xl transition-all font-semibold text-xs border border-slate-200 hover:bg-slate-50 text-slate-700 w-full md:w-auto"
                >
                  <SlidersHorizontal className="h-4 w-4 text-slate-400" />
                  <span>
                    Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 transition-transform duration-200" />
                </Button>

                {isFilterPopoverOpen && (
                  <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3.5">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Advanced Filters</h4>
                      {activeFiltersCount > 0 && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                          {activeFiltersCount} Active
                        </span>
                      )}
                    </div>

                    <div className="space-y-3.5">
                      {/* Guest / Hotel */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Laundry Type</label>
                        <select
                          value={draftTypeFilter}
                          onChange={(e) => setDraftTypeFilter(e.target.value)}
                          className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:outline-none"
                        >
                          <option value="All">All Types</option>
                          <option value="Guest">Guest Bag</option>
                          <option value="Hotel">Hotel Linen</option>
                        </select>
                      </div>

                      {/* Room Number */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Room Number</label>
                        <select
                          value={draftRoomFilter}
                          onChange={(e) => setDraftRoomFilter(e.target.value)}
                          className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:outline-none"
                        >
                          <option value="All">All Rooms</option>
                          <option value="101">Room 101</option>
                          <option value="102">Room 102</option>
                          <option value="201">Room 201</option>
                          <option value="204">Room 204</option>
                        </select>
                      </div>

                      {/* Assigned Staff */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Assigned Staff</label>
                        <select
                          value={draftStaffFilter}
                          onChange={(e) => setDraftStaffFilter(e.target.value)}
                          className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:outline-none"
                        >
                          <option value="All">All Staff</option>
                          {staffList.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      {/* Machine */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Machine</label>
                        <select
                          value={draftMachineFilter}
                          onChange={(e) => setDraftMachineFilter(e.target.value)}
                          className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:outline-none"
                        >
                          <option value="All">All Machines</option>
                          <option value="W-0">Washing Machine W-0</option>
                          <option value="P-0">Press Station P-0</option>
                        </select>
                      </div>

                      {/* Priority */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Priority</label>
                        <select
                          value={draftPriorityFilter}
                          onChange={(e) => setDraftPriorityFilter(e.target.value)}
                          className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:outline-none"
                        >
                          <option value="All">All Priorities</option>
                          <option value="Critical">Critical</option>
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>

                      {/* Sort */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sort By</label>
                        <select
                          value={draftSortBy}
                          onChange={(e) => setDraftSortBy(e.target.value)}
                          className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:outline-none"
                        >
                          <option value="ID">Job ID</option>
                          <option value="Charges">Charges</option>
                          <option value="Items">Item Count</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 mt-4 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setDraftTypeFilter("All");
                          setDraftRoomFilter("All");
                          setDraftStaffFilter("All");
                          setDraftMachineFilter("All");
                          setDraftPriorityFilter("All");
                          setDraftSortBy("ID");
                          setToast({ message: "Filters reset successfully.", variant: "info" });
                        }}
                        className="text-xs font-bold text-slate-500 hover:text-red-655 transition-colors px-2 py-1"
                      >
                        Reset
                      </button>
                      <Button
                        type="button"
                        onClick={handleApplyFilters}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs h-8 px-3.5 rounded-lg"
                      >
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Grid Layout: Active Table + Alerts */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
            {/* Left 3 columns: Active Table */}
            <div className="xl:col-span-3 space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-200 select-none">
                    <tr>
                      <th className="px-4 py-3.5 font-bold">Job ID</th>
                      <th className="px-4 py-3.5 font-bold">Guest / Room</th>
                      <th className="px-4 py-3.5 font-bold">Laundry Type</th>
                      <th className="px-4 py-3.5 font-bold">Assigned Staff</th>
                      <th className="px-4 py-3.5 font-bold">Current Machine</th>
                      <th className="px-4 py-3.5 font-bold text-center">Items</th>
                      <th className="px-4 py-3.5 font-bold text-center">Weight</th>
                      <th className="px-4 py-3.5 font-bold">Est. Finish</th>
                      <th className="px-4 py-3.5 font-bold text-center">Status</th>
                      <th className="px-4 py-3.5 font-bold text-center">Priority</th>
                      <th className="px-4 py-3.5 font-bold text-right">Charges</th>
                      <th className="px-4 py-3.5 font-bold text-center">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {filteredJobs.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="text-center py-16 text-slate-400 italic font-medium">
                          <ClipboardList className="h-8 w-8 mx-auto text-slate-300 opacity-60 mb-2" />
                          No active laundry jobs match your filters.
                        </td>
                      </tr>
                    ) : (
                      filteredJobs.map((job) => {
                        const priority = getJobPriority(job);
                        const machine = getJobMachine(job);
                        const staff = getJobStaff(job);
                        const estFinish = getJobEstFinish(job);
                        const isDelayed = isJobDelayed(job);
                        const weight = Math.round(job.quantity * 0.8 * 10) / 10;

                        return (
                          <tr
                            key={job.id}
                            onClick={() => setSelectedJobId(job.id)}
                            className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-4 text-[11px] font-extrabold text-slate-600">
                              {job.id}
                            </td>
                            <td className="px-4 py-4">
                              {job.type === "Guest" ? (
                                <div className="leading-tight">
                                  <span className="font-extrabold text-slate-800">Room {job.room}</span>
                                  <span className="text-[9px] text-slate-400 font-semibold block">{job.guestName}</span>
                                </div>
                              ) : (
                                <span className="text-slate-500 font-bold">Hotel Linen Stock</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <span className={cn(
                                "rounded px-1.5 py-0.5 text-[9px] border font-bold uppercase",
                                job.type === "Guest" ? "bg-violet-50 text-violet-700 border-violet-100" : "bg-blue-50 text-blue-700 border-blue-100"
                              )}>
                                {job.type}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-[10px] text-slate-600 font-medium">
                              {staff}
                            </td>
                            <td className="px-4 py-4 text-[10px]">
                              <span className="bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-mono">
                                {machine}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center text-slate-800">
                              {job.quantity} Pcs
                            </td>
                            <td className="px-4 py-4 text-center font-mono text-[10.5px] text-slate-500 font-medium">
                              {weight} kg
                            </td>
                            <td className="px-4 py-4 text-[10px] font-normal text-slate-400">
                              {estFinish}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className={cn(
                                "rounded-full px-2 py-0.5 text-[8.5px] border font-extrabold uppercase whitespace-nowrap",
                                isDelayed ? statusBadges.Delayed : statusBadges[job.status] || "bg-slate-50 text-slate-600 border-slate-250"
                              )}>
                                {isDelayed ? "Delayed" : job.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className={cn(
                                "rounded px-1.5 py-0.5 text-[8px] font-bold uppercase border",
                                priorityColors[priority]
                              )}>
                                {priority}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right text-slate-900 font-extrabold text-[11px]">
                              INR {job.charges}
                            </td>
                            <td className="px-4 py-4 text-center text-slate-400">
                              <ChevronRight className="h-4 w-4 mx-auto hover:text-emerald-700 transition-colors" />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right 1 column: Inventory Alerts Sidebar Card */}
            <div className="xl:col-span-1 space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                      <AlertOctagon className="h-4 w-4 text-red-600" />
                      Active Laundry Alerts
                    </h3>
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-extrabold text-red-600">
                      {hotelLinenItems.filter(i => i.available < i.parStock).length + (kpis.delayed > 0 ? 1 : 0) + 1}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 max-h-[450px] overflow-y-auto pr-1 sidebar-scroll text-[10px]">
                    {/* Delayed Jobs alert */}
                    {kpis.delayed > 0 && (
                      <div className="bg-red-50/50 border border-red-100 text-red-700 rounded-xl p-3 flex gap-2.5 items-start">
                        <AlertCircle className="h-4 w-4 shrink-0 text-red-500 animate-bounce" />
                        <div>
                          <p className="font-bold text-slate-800">Delayed Laundry Jobs</p>
                          <p className="text-slate-500 font-medium mt-0.5 leading-relaxed">
                            {kpis.delayed} jobs have exceeded the estimated process time limit.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Pillow covers Alert */}
                    {inventory.find(i => i.name.includes("Pillow Covers") && i.available < i.parStock) && (
                      <div className="bg-red-50/50 border border-red-100 text-red-700 rounded-xl p-3 flex gap-2.5 items-start">
                        <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                        <div>
                          <p className="font-bold text-slate-800">Low Pillow Covers</p>
                          <p className="text-slate-500 font-medium mt-0.5 leading-relaxed">
                            Pillow cover stock is below par. Available: {inventory.find(i => i.name.includes("Pillow Covers"))?.available || 24} / Par: {inventory.find(i => i.name.includes("Pillow Covers"))?.parStock || 60}.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Bath Towels alert */}
                    {inventory.find(i => i.name.includes("Bath Towels") && i.available < i.parStock) && (
                      <div className="bg-amber-50/50 border border-amber-100 text-amber-700 rounded-xl p-3 flex gap-2.5 items-start">
                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                        <div>
                          <p className="font-bold text-slate-800">Bath Towels Below Par</p>
                          <p className="text-slate-500 font-medium mt-0.5 leading-relaxed">
                            Towels are running low. Current count: {inventory.find(i => i.name.includes("Bath Towels"))?.available || 18}.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Machine maintenance alert */}
                    <div className="bg-amber-50/50 border border-amber-100 text-amber-700 rounded-xl p-3 flex gap-2.5 items-start">
                      <Wrench className="h-4 w-4 shrink-0 text-amber-550" />
                      <div>
                        <p className="font-bold text-slate-800">Machine Maintenance Due</p>
                        <p className="text-slate-500 font-medium mt-0.5 leading-relaxed">
                          Washing Machine W-02 requires standard cycle validation and safety tests.
                        </p>
                      </div>
                    </div>

                    {/* Discard threshold exceeded */}
                    {hotelLinenItems.some(i => i.discarded > i.parStock * 0.1) && (
                      <div className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl p-3 flex gap-2.5 items-start">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-slate-450" />
                        <div>
                          <p className="font-bold text-slate-800">Discard Threshold Warning</p>
                          <p className="text-slate-500 font-medium mt-0.5 leading-relaxed">
                            Linen discard limit has exceeded 10% of par value in the current cycle.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-4 text-[10px] text-slate-400 leading-relaxed bg-slate-50/50 -mx-4 -mb-4 p-4 rounded-b-2xl">
                  <div className="flex gap-2 items-start">
                    <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-700">PMS Operations Policy:</h4>
                      <p className="mt-1">
                        All guest bags must be weighed and inspected for staining. Internal hotel linen items returned from laundry are automatically returned to active stock.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ACTIVE TAB: DISCARD LINEN OVERHAUL */
        <div className="space-y-6">
          {/* Discard Linen Tab KPI cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Linen</span>
                <span className="text-lg font-extrabold text-slate-800">
                  {hotelLinenItems.reduce((acc, curr) => acc + curr.parStock, 0)} Pcs
                </span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-xl text-red-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Discarded Today</span>
                <span className="text-lg font-extrabold text-red-655">
                  {hotelLinenItems.reduce((acc, curr) => acc + curr.discarded, 0)} Pcs
                </span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Damaged Balance</span>
                <span className="text-lg font-extrabold text-amber-700">
                  {hotelLinenItems.reduce((acc, curr) => acc + curr.damaged, 0)} Pcs
                </span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl text-blue-650">
                <BadgeAlert className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Below Par Items</span>
                <span className="text-lg font-extrabold text-blue-700">
                  {hotelLinenItems.filter((i) => i.available < i.parStock).length} Items
                </span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                <Coins className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Replacement Cost</span>
                <span className="text-lg font-extrabold text-indigo-700">
                  INR {hotelLinenItems.reduce((acc, curr) => acc + curr.discarded * 350, 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Grid Layout: Table & Alerts for Linen */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
            {/* Left 3 columns: Discard table */}
            <div className="xl:col-span-3 space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-200 select-none">
                    <tr>
                      <th className="px-5 py-4 font-bold">Linen Item</th>
                      <th className="px-5 py-4 font-bold text-center">Par Level</th>
                      <th className="px-5 py-4 font-bold text-center">Available</th>
                      <th className="px-5 py-4 font-bold text-center">Discarded</th>
                      <th className="px-5 py-4 font-bold text-center">Damage %</th>
                      <th className="px-5 py-4 font-bold text-center">Remaining Life</th>
                      <th className="px-5 py-4 font-bold text-right">Replacement Cost</th>
                      <th className="px-5 py-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {hotelLinenItems.map((item) => {
                      const ratio = item.available / item.parStock;
                      const lowStock = ratio < 0.6;
                      const damagePercent = Math.round((item.damaged / (item.parStock || 1)) * 100);
                      const mockLife = Math.max(50, 150 - item.damaged * 10);
                      const mockCost = item.discarded * 350;

                      return (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedLinenId(item.id)}
                          className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                        >
                          <td className="px-5 py-4 font-bold text-slate-800 flex items-center gap-2">
                            <Package className="h-4 w-4 text-slate-400" />
                            {item.name}
                          </td>
                          <td className="px-5 py-4 text-center text-slate-500 font-medium">{item.parStock} Pcs</td>
                          <td className="px-5 py-4 text-center text-slate-755 font-bold">{item.available} Pcs</td>
                          <td className="px-5 py-4 text-center text-red-600 font-extrabold">{item.discarded} Pcs</td>
                          <td className="px-5 py-4 text-center font-mono text-slate-500">{damagePercent}%</td>
                          <td className="px-5 py-4 text-center font-normal text-slate-500">{mockLife} washes remaining</td>
                          <td className="px-5 py-4 text-right text-indigo-700 font-bold">INR {mockCost}</td>
                          <td className="px-5 py-4 text-center">
                            {lowStock ? (
                              <span className="inline-flex items-center gap-1 text-[8px] font-bold text-red-700 bg-red-50 border border-red-150 px-2 py-0.5 rounded-full uppercase leading-none">
                                Under Par
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[8px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded-full uppercase leading-none">
                                Satisfactory
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right 1 column: Discard alerts sidebar */}
            <div className="xl:col-span-1 space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3">
                  <AlertCircle className="h-4 w-4 text-emerald-755" />
                  Discard Notifications
                </h3>
                <div className="space-y-2 text-[10px] font-semibold text-slate-650">
                  <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 flex items-start gap-2">
                    <span className="text-slate-400 text-xs">📝</span>
                    <div>
                      <strong className="text-slate-800 block">Discard Threshold Limit</strong>
                      <span className="font-normal text-slate-500">Current month total discards: 12 Pcs. Threshold 5% is currently acceptable.</span>
                    </div>
                  </div>
                  <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 flex items-start gap-2">
                    <span className="text-slate-400 text-xs">🛁</span>
                    <div>
                      <strong className="text-slate-800 block">Bath Towels Stock alert</strong>
                      <span className="font-normal text-slate-500">Available: {hotelLinenItems.find(i => i.name.includes("Bath Towels"))?.available || 0} Pcs. Under par. Replacements required.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LAUNDRY CONSOLE DRAWER REDESIGN */}
      <Drawer
        open={!!selectedJobId}
        onClose={() => setSelectedJobId(null)}
        title={`${selectedJob?.id || "Laundry Job"} Cleaning Console`}
        width="xl"
      >
        {selectedJob && (
          <div className="flex flex-col h-full bg-slate-50/30">
            <div className="flex-1 overflow-y-auto p-5 space-y-4 select-none">
              
              {/* Drawer workflow timeline visual pipeline (Vertical format) */}
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
                <h4 className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                  Operational Pipeline Timeline
                </h4>
                <div className="flex flex-col gap-1.5 pl-2">
                  {[
                    { label: "Collected", stepStatus: "Collection" },
                    { label: "Sorting", stepStatus: "Sorting" },
                    { label: "Washing", stepStatus: "Washing" },
                    { label: "Drying", stepStatus: "Drying" },
                    { label: "Ironing", stepStatus: "Ironing" },
                    { label: "Packed", stepStatus: "Packed" },
                    { label: "Delivered", stepStatus: "Delivered" },
                  ].map((step, idx) => {
                    const stepsMap = ["Collection", "Washing", "Ironing", "Ready", "Delivered"];
                    const currentIdx = stepsMap.indexOf(selectedJob.status);
                    
                    // Map 7 visual steps to backend states
                    let isCompleted = false;
                    let isCurrent = false;

                    if (selectedJob.status === "Collection") {
                      if (idx === 0) isCurrent = true;
                    } else if (selectedJob.status === "Washing") {
                      if (idx < 2) isCompleted = true;
                      if (idx === 2) isCurrent = true;
                    } else if (selectedJob.status === "Ironing") {
                      if (idx < 4) isCompleted = true;
                      if (idx === 4) isCurrent = true;
                    } else if (selectedJob.status === "Ready") {
                      if (idx < 5) isCompleted = true;
                      if (idx === 5) isCurrent = true;
                    } else if (selectedJob.status === "Delivered") {
                      isCompleted = true;
                      if (idx === 6) isCompleted = true; // all green
                    }

                    return (
                      <div key={step.label} className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                          <div className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold border transition-all duration-300",
                            isCurrent ? "bg-emerald-600 border-emerald-700 text-white shadow-sm ring-2 ring-emerald-100" :
                            isCompleted ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                            "bg-white border-slate-200 text-slate-400"
                          )}>
                            {isCompleted && !isCurrent ? <Check className="h-3 w-3" /> : idx + 1}
                          </div>
                          {idx < 6 && (
                            <div className={cn(
                              "w-0.5 h-4 my-0.5",
                              isCompleted ? "bg-emerald-500" : "bg-slate-200"
                            )} />
                          )}
                        </div>
                        <div className="flex-1 pb-4 leading-tight">
                          <span className={cn(
                            "text-xs font-bold",
                            isCurrent ? "text-emerald-750 font-extrabold" :
                            isCompleted ? "text-slate-800" : "text-slate-400"
                          )}>
                            {step.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stack 1: Laundry Summary */}
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
                <h4 className="font-bold text-slate-855 text-[11px] uppercase tracking-wider border-b border-slate-50 pb-1.5 flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-slate-400" /> Laundry summary & Specs
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs font-semibold text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Job ID</span>
                    <span className="text-slate-900 font-extrabold text-[12px]">{selectedJob.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Laundry Type</span>
                    <span className="text-slate-850 font-bold uppercase">{selectedJob.type}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Estimated Finish</span>
                    <span className="text-slate-750 font-bold">{getJobEstFinish(selectedJob)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Priority status</span>
                    <span className={cn(
                      "font-bold uppercase",
                      getJobPriority(selectedJob) === "Critical" ? "text-red-655 animate-pulse" : "text-slate-655"
                    )}>
                      {getJobPriority(selectedJob)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stack 2: Guest Details */}
              {selectedJob.type === "Guest" && (
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
                  <h4 className="font-bold text-slate-855 text-[11px] uppercase tracking-wider border-b border-slate-50 pb-1.5 flex items-center gap-1.5">
                    <User className="h-4 w-4 text-slate-400" /> Guest & Room Information
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs font-semibold text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Guest Name</span>
                      <span className="text-slate-850 font-bold text-slate-900">{selectedJob.guestName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Room Number</span>
                      <span className="text-slate-850 font-bold text-slate-900">Room {selectedJob.room}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Stack 3: Item List Cards */}
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
                <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider border-b border-slate-50 pb-1.5 flex items-center gap-1.5">
                  <ClipboardList className="h-4 w-4 text-slate-400" /> Laundry Item Details
                </h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 rounded-xl border border-slate-100 p-3 text-xs bg-emerald-50/10 border-emerald-100 text-slate-700 font-bold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-800 font-extrabold">{selectedJob.item}</span>
                        <span className="text-slate-500 font-medium">Qty: {selectedJob.quantity} Pcs</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-3 text-[10px] text-slate-400 font-medium">
                        <div>Special Care: <strong className="text-slate-600">Wash & Press</strong></div>
                        <div>Wash Type: <strong className="text-slate-600">Cotton / Premium</strong></div>
                        <div>Iron Required: <strong className="text-emerald-700 font-bold">Yes</strong></div>
                        <div>Damage Flag: <strong className="text-slate-500 font-normal">None</strong></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stack 4: Machine Information */}
              {selectedJob.status === "Washing" && (
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
                  <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider border-b border-slate-50 pb-1.5 flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-slate-400" /> Active Machine status
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs font-semibold text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Active Machine</span>
                      <span className="text-slate-900 font-extrabold">{getMachineInfo(selectedJob).machine}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Capacity load</span>
                      <span className="text-slate-800">{getMachineInfo(selectedJob).capacity}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Operator Staff</span>
                      <span className="text-slate-800">{getMachineInfo(selectedJob).operator}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Remaining Duration</span>
                      <span className="text-blue-700 font-bold">{getMachineInfo(selectedJob).duration}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Stack 5: Charges Invoice Card */}
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
                <h4 className="font-bold text-slate-855 text-[11px] uppercase tracking-wider border-b border-slate-50 pb-1.5 flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-slate-400" /> Guest Folio Invoice Details
                </h4>
                <div className="space-y-2 text-xs font-semibold text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subtotal:</span>
                    <span>INR {selectedJob.charges}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tax GST (18%):</span>
                    <span>INR {Math.round(selectedJob.charges * 0.18)}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-400">Discount Code:</span>
                    <span className="text-emerald-700">- INR 0</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1">
                    <span>Grand Total:</span>
                    <span>INR {selectedJob.charges + Math.round(selectedJob.charges * 0.18)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-50">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Payment status</span>
                      <span className="bg-amber-50 text-amber-700 border border-amber-100 rounded px-1.5 py-0.5 text-[8px] uppercase font-extrabold">
                        Pending Folio Charge
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Payment method</span>
                      <span className="text-slate-750 font-bold">Room Account Transfer</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stack 6: Evidence / Optional Photos */}
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-1.5">
                  <Camera className="h-4 w-4 text-emerald-700" /> Evidence photos
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1 text-center">
                    <span className="text-[8.5px] text-slate-400 font-extrabold uppercase block">Before</span>
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-slate-150 bg-slate-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://images.unsplash.com/photo-1540518614846-7eded433c457?w=150&q=80"
                        alt="before-wash"
                        className="object-cover h-full w-full"
                      />
                    </div>
                  </div>
                  <div className="space-y-1 text-center">
                    <span className="text-[8.5px] text-slate-400 font-extrabold uppercase block">After</span>
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-slate-150 bg-slate-50 flex items-center justify-center text-slate-350 text-[9px] font-bold">
                      Awaiting
                    </div>
                  </div>
                  <div className="space-y-1 text-center">
                    <span className="text-[8.5px] text-slate-400 font-extrabold uppercase block">Damage</span>
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-slate-150 bg-slate-50 flex flex-col items-center justify-center hover:bg-slate-100 cursor-pointer">
                      <Camera className="h-4.5 w-4.5 text-slate-400" />
                      <span className="text-[8px] text-slate-400 font-bold mt-1">Upload</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stack 7: Chronological Timeline Logs */}
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
                <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider border-b border-slate-50 pb-1.5 flex items-center gap-1.5">
                  <History className="h-4 w-4 text-slate-400" /> Chronological Activity logs
                </h4>
                <div className="space-y-2 text-xs font-semibold text-slate-600 font-mono">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Collected from Room {selectedJob.room || "Hotel Lobby"}</span>
                    <span className="text-slate-400 font-normal">{selectedJob.timeline.collectedAt}</span>
                  </div>
                  {selectedJob.timeline.washedAt && (
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Washing Completed (Operator: Meena)</span>
                      <span className="text-slate-400 font-normal">{selectedJob.timeline.washedAt}</span>
                    </div>
                  )}
                  {selectedJob.timeline.readyAt && (
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Ironing Finished & Pressed (Station P-02)</span>
                      <span className="text-slate-400 font-normal">{selectedJob.timeline.readyAt}</span>
                    </div>
                  )}
                  {selectedJob.timeline.deliveredAt && (
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Delivered & Charged to Folio Account</span>
                      <span className="text-slate-400 font-normal">{selectedJob.timeline.deliveredAt}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Remarks Section */}
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-2">
                <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
                  Remarks / Special Instructions
                </label>
                <textarea
                  readOnly
                  value={selectedJob.notes || "No special instructions logged."}
                  className="w-full rounded-xl border border-slate-200 p-2.5 h-16 text-xs text-slate-700 bg-slate-50 focus:outline-none cursor-not-allowed font-medium"
                />
              </div>

            </div>

            {/* Sticky Actions Footer */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 grid grid-cols-2 gap-3 shadow-lg">
              <Button
                onClick={() => setSelectedJobId(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center text-xs py-2 px-3 font-bold rounded-xl transition-all h-9"
              >
                Close Panel
              </Button>
              {selectedJob.status !== "Delivered" ? (
                <Button
                  onClick={() => {
                    const stepsMap = ["Collection", "Washing", "Ironing", "Ready", "Delivered"];
                    const next = stepsMap[stepsMap.indexOf(selectedJob.status) + 1] as any;
                    advanceStatus(selectedJob.id, selectedJob.status);
                    setSelectedJobId(null);
                  }}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center text-xs py-2 px-3 font-bold rounded-xl transition-all shadow-xs h-9"
                >
                  Mark {LAUNDRY_STATUS_STEPS[LAUNDRY_STATUS_STEPS.indexOf(selectedJob.status) + 1]}
                </Button>
              ) : (
                <div className="text-emerald-700 text-xs font-extrabold uppercase flex items-center justify-center bg-emerald-50 border border-emerald-100 rounded-xl">
                  ✓ Job Delivered
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* LINEN DETAILS DRAWER */}
      <Drawer
        open={!!selectedLinenId}
        onClose={() => setSelectedLinenId(null)}
        title={`${selectedLinen?.name || "Linen"} Specifications Details`}
        width="xl"
      >
        {selectedLinen && (
          <div className="flex flex-col h-full bg-slate-50/30">
            <div className="flex-1 overflow-y-auto p-5 space-y-4 select-none">
              
              {/* Linen Information */}
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs space-y-3">
                <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                  <ClipboardList className="h-4 w-4 text-slate-400" /> Linen Information
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs font-semibold text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Item Name</span>
                    <span className="text-slate-900 font-extrabold">{selectedLinen.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Purchase Date</span>
                    <span className="text-slate-800 font-bold">12 Jan 2026</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Wash Count</span>
                    <span className="text-slate-800 font-bold">42 Washes</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Expected Life</span>
                    <span className="text-slate-800 font-bold">150 Wash Cycles</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Current Stock</span>
                    <span className="text-slate-855 font-extrabold text-[12px]">{selectedLinen.available} / {selectedLinen.parStock} (Avail / Par)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Stock Category</span>
                    <span className="text-slate-800 font-bold">Premium Egyptian Cotton</span>
                  </div>
                </div>
              </div>

              {/* Discard History */}
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
                <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider border-b border-slate-50 pb-1.5 flex items-center gap-1.5">
                  <History className="h-4 w-4 text-slate-400" /> Discard & Damage History
                </h4>
                <div className="space-y-2 text-xs font-semibold">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-550">Discarded items</span>
                    <span className="text-red-600 font-extrabold">{selectedLinen.discarded} Pcs</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-550">Damaged items</span>
                    <span className="text-amber-700 font-bold">{selectedLinen.damaged} Pcs</span>
                  </div>
                  <div className="pt-2 text-[10px] text-slate-400 font-medium leading-relaxed">
                    * Primary discard reasons logged: Fraying of borders, standard wear & tear stains, and chemical bleaching degradation.
                  </div>
                </div>
              </div>

              {/* Replacement Recommendation */}
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
                <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider border-b border-slate-50 pb-1.5 flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-slate-400" /> Replacement Recommendation
                </h4>
                <div className="p-3 bg-red-50/30 border border-red-100 rounded-xl text-xs font-semibold text-red-800 space-y-1">
                  <div>Recommendation: <strong>Purchase {selectedLinen.parStock - selectedLinen.available} replacement pieces</strong></div>
                  <div className="font-normal text-[10.5px] text-red-655">Current stock availability ratio is {Math.round((selectedLinen.available/selectedLinen.parStock)*100)}% of par levels. Ordering replacements is recommended to avoid hotel operational delays.</div>
                </div>
              </div>

              {/* Photos Grid */}
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-1.5">
                  <Camera className="h-4 w-4 text-emerald-700" /> Evidence damage photos
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1 text-center">
                    <span className="text-[8.5px] text-slate-400 font-extrabold uppercase block">Discard</span>
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-slate-150 bg-slate-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://images.unsplash.com/photo-1540518614846-7eded433c457?w=150&q=80"
                        alt="discard-linen"
                        className="object-cover h-full w-full"
                      />
                    </div>
                  </div>
                  <div className="space-y-1 text-center">
                    <span className="text-[8.5px] text-slate-400 font-extrabold uppercase block">Upload</span>
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-slate-150 bg-slate-50 flex flex-col items-center justify-center hover:bg-slate-100 cursor-pointer">
                      <Camera className="h-4.5 w-4.5 text-slate-400" />
                      <span className="text-[8px] text-slate-400 font-bold mt-1">Upload</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Audit History */}
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
                <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider border-b border-slate-50 pb-1.5 flex items-center gap-1.5">
                  <History className="h-4 w-4 text-slate-400" /> Inventory Audit History
                </h4>
                <div className="space-y-2 text-xs font-semibold text-slate-600 font-mono">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Stock audited & counted</span>
                    <span className="text-slate-450 font-normal">15 Jul 10:30 AM</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Discard logged: {selectedLinen.discarded} pieces</span>
                    <span className="text-slate-455 font-normal">14 Jul 04:15 PM</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Sticky Actions Footer */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 flex gap-3 shadow-lg">
              <Button
                onClick={() => setSelectedLinenId(null)}
                className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center text-xs py-2 px-3 font-bold rounded-xl transition-all h-9"
              >
                Close Details
              </Button>
              <Button
                onClick={() => {
                  setSelectedLinenId(null);
                  setToast({ message: `Purchase requisition triggered for Egypt Cotton ${selectedLinen.name}.`, variant: "success" });
                }}
                className="w-1/2 bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center text-xs py-2 px-3 font-bold rounded-xl transition-all shadow-xs h-9"
              >
                Order Replacements
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* CREATE LAUNDRY JOB DRAWER */}
      <Drawer open={createOpen} onClose={() => setCreateOpen(false)} title="Book Laundry Pipeline Job">
        <div className="space-y-4">
          <FormField label="Linen Source / Type" required>
            <SelectInput value={type} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setType(e.target.value as any)}>
              <option value="Guest">Guest Laundry Bag</option>
              <option value="Hotel">Hotel Linen (Internal stock)</option>
            </SelectInput>
          </FormField>

          {type === "Guest" ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Room Number" required>
                  <TextInput value={room} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoom(e.target.value)} />
                </FormField>
                <FormField label="Guest Name" required>
                  <TextInput value={guestName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGuestName(e.target.value)} />
                </FormField>
              </div>
              <FormField label="Guest Item Description" required>
                <TextInput
                  placeholder="e.g. 2 Silk shirts, 1 Cotton trousers"
                  value={guestItemText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGuestItemText(e.target.value)}
                />
              </FormField>
            </>
          ) : (
            <FormField label="Hotel Linen Item" required>
              <SelectInput value={selectedItem} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedItem(e.target.value)}>
                {hotelLinenItems.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </SelectInput>
            </FormField>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Quantity (Pcs)" required>
              <TextInput type="number" min="1" value={quantity} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuantity(e.target.value)} />
            </FormField>
            <FormField label="Estimated Price (INR)" required>
              <TextInput type="number" min="0" value={charges} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCharges(e.target.value)} />
            </FormField>
          </div>

          <FormField label="Wash Instructions / Remarks">
            <TextAreaInput
              placeholder="e.g. Low temp ironing, starch required, soft dry wash only."
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
            />
          </FormField>

          <Button
            onClick={handleCreateJob}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl transition-all shadow-sm"
          >
            Confirm Booking
          </Button>
        </div>
      </Drawer>

      {/* DISCARD LINEN ITEM DRAWER */}
      <Drawer open={discardOpen} onClose={() => setDiscardOpen(false)} title="Log Linen Wear Discard">
        <div className="space-y-4">
          <FormField label="Linen Stock Item" required>
            <SelectInput value={discardItemId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDiscardItemId(e.target.value)}>
              {hotelLinenItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} (Avail: {item.available} Pcs)
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField label="Quantity to Discard" required>
            <TextInput type="number" min="1" value={discardQty} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDiscardQty(e.target.value)} />
          </FormField>

          <div className="rounded-xl bg-red-50 border border-red-100 p-3.5 text-xs text-red-800 font-semibold leading-relaxed">
            <strong>Warning:</strong> Discarding items permanently removes them from active hotel in-use inventory. Verify physical audit counts match.
          </div>

          <Button
            onClick={handleDiscard}
            className="w-full bg-red-655 hover:bg-red-750 text-white font-bold py-2.5 rounded-xl transition-all shadow-sm"
          >
            Confirm Discard
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
