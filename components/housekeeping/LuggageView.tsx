"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useHousekeeping } from "@/components/housekeeping/HousekeepingContext";
import {
  Luggage,
  Clock,
  CheckCircle2,
  Plus,
  User,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Info,
  AlertTriangle,
  MapPin,
  Camera,
  History,
  ArrowRightLeft,
  Trash2,
  Box,
  Truck,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  FileText,
  Calendar,
  Layers,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { TextInput, SelectInput, FormField, TextAreaInput } from "@/components/frontoffice/ui";

const LUGGAGE_STATUS_STEPS = ["Registered", "Assigned", "Collected", "Stored", "Delivered", "Returned", "Completed"];

// KPI Card Component
function KPILuggageCard({
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
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-550">{title}</p>
          <h3 className="mt-1 text-xl font-extrabold tracking-tight text-slate-800">{value}</h3>
          <p className="mt-0.5 text-[10px] text-slate-600 font-bold">{subtitle}</p>
        </div>
        <div className={cn("rounded-xl p-2 shadow-xs", colorClass)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-slate-100 to-transparent" />
    </div>
  );
}

export function LuggageView() {
  const {
    luggageJobs,
    staff,
    addLuggageJob,
    deliverLuggage,
  } = useHousekeeping();

  const [activeTab, setActiveTab] = useState<"active" | "lockers" | "reports" | "audit">("active");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Form Fields: Basics
  const [guest, setGuest] = useState("Sarah Chen");
  const [reservationId, setReservationId] = useState("RES-2026-9812");
  const [room, setRoom] = useState("305");
  const [targetRoom, setTargetRoom] = useState("");
  const [bellBoy, setBellBoy] = useState("");
  const [tagNumber, setTagNumber] = useState("TAG-");
  const [bagCount, setBagCount] = useState("2");
  const [type, setType] = useState<"Check-in" | "Check-out" | "Storage" | "Room Move">("Check-in");
  const [remarks, setRemarks] = useState("");

  // Form Fields: Extra Metadata
  const [bagType, setBagType] = useState<"Suitcase" | "Duffel" | "Backpack" | "Box" | "Garment Bag" | "Golf Club">("Suitcase");
  const [lockerCoordinate, setLockerCoordinate] = useState("Shelf A-1");
  const [longTermStorage, setLongTermStorage] = useState(false);
  const [vipHandling, setVipHandling] = useState(false);

  // Form Fields: Intake Pre-Check
  const [scratches, setScratches] = useState(false);
  const [zippers, setZippers] = useState(false);
  const [handles, setHandles] = useState(false);
  const [fragileTag, setFragileTag] = useState(false);

  // Filter Popover
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState("All");
  const [bellboyFilter, setBellboyFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [sortBy, setSortBy] = useState("ID");

  const [draftTypeFilter, setDraftTypeFilter] = useState("All");
  const [draftBellboyFilter, setDraftBellboyFilter] = useState("All");
  const [draftLocationFilter, setDraftLocationFilter] = useState("All");
  const [draftSortBy, setDraftSortBy] = useState("ID");

  const popoverRef = useRef<HTMLDivElement>(null);

  // KPI Active Filter state
  const [kpiFilter, setKpiFilter] = useState<string>("all");

  // Reports Sub-tab
  const [reportSubTab, setReportSubTab] = useState<"daily" | "pending" | "stored" | "performance">("daily");

  // Persisted Extra Metadata State
  const [extraInfoMap, setExtraInfoMap] = useState<Record<string, any>>({});
  
  // Toast notifier
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("pms_luggage_extra_info");
    if (stored) {
      setExtraInfoMap(JSON.parse(stored));
    }
  }, []);

  const saveExtraInfo = (jobId: string, info: any) => {
    setExtraInfoMap((prev) => {
      const next = { ...prev, [jobId]: info };
      localStorage.setItem("pms_luggage_extra_info", JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const bellboys = useMemo(() => {
    return staff.filter((s) => s.role === "Bell Boy");
  }, [staff]);

  // Derived: calculate active run workloads for each bellboy
  const bellboyWorkloads = useMemo(() => {
    const counts: Record<string, number> = {};
    bellboys.forEach((b) => {
      counts[b.name] = 0;
    });
    luggageJobs.forEach((job) => {
      if (job.status !== "Delivered" && job.bellBoy && counts[job.bellBoy] !== undefined) {
        counts[job.bellBoy]++;
      }
    });
    return counts;
  }, [bellboys, luggageJobs]);

  // Recommendation: bellboy with the lowest active runs
  const recommendedBellboy = useMemo(() => {
    if (bellboys.length === 0) return null;
    let best = bellboys[0];
    let minJobs = bellboyWorkloads[best.name] ?? 0;
    for (let i = 1; i < bellboys.length; i++) {
      const currentJobs = bellboyWorkloads[bellboys[i].name] ?? 0;
      if (currentJobs < minJobs) {
        minJobs = currentJobs;
        best = bellboys[i];
      }
    }
    return best;
  }, [bellboys, bellboyWorkloads]);

  // Get metadata info for job
  const getJobExtra = (job: any) => {
    if (extraInfoMap[job.id]) {
      return extraInfoMap[job.id];
    }
    const seed = parseInt(job.id.slice(-2)) || 1;
    const isMockMove = seed % 3 === 0;

    return {
      reservationId: `RES-2026-${5420 + seed}`,
      bagType: seed % 2 === 0 ? "Suitcase" : seed % 3 === 1 ? "Duffel" : "Backpack",
      lockerCoordinate: `Shelf B-${(seed % 4) + 1}`,
      longTermStorage: seed % 5 === 0,
      vipHandling: seed % 6 === 0,
      movementType: isMockMove ? "Room Move" : job.type,
      targetRoom: isMockMove ? `Room ${Number(job.room) + 5}` : "",
      preInspection: {
        scratches: seed % 4 === 1,
        brokenZippers: false,
        damagedHandles: false,
        fragileTag: seed % 2 === 0,
      },
      timeline: {
        createdAt: job.pickupTime,
        dispatchedAt: job.status !== "Pending" ? job.pickupTime : undefined,
        storedAt: job.status === "Stored" ? job.pickupTime : undefined,
        deliveredAt: job.deliveryTime || undefined,
      },
    };
  };

  const isCheckoutPendingWarning = (job: any) => {
    return job.status === "Stored" && job.type === "Check-out";
  };

  const kpis = useMemo(() => {
    const total = luggageJobs.length;
    const pending = luggageJobs.filter((j) => j.status === "Pending").length;
    const stored = luggageJobs.filter((j) => j.status === "Stored").length;
    const transit = luggageJobs.filter((j) => j.status === "In Transit").length;
    const delivered = luggageJobs.filter((j) => j.status === "Delivered").length;
    const moves = luggageJobs.filter((j) => getJobExtra(j).movementType === "Room Move").length;

    return { total, pending, stored, transit, delivered, moves };
  }, [luggageJobs, extraInfoMap]);

  const filteredLuggage = useMemo(() => {
    let result = [...luggageJobs];

    // KPI Filters
    if (kpiFilter === "pending") {
      result = result.filter((j) => j.status === "Pending");
    } else if (kpiFilter === "stored") {
      result = result.filter((j) => j.status === "Stored");
    } else if (kpiFilter === "transit") {
      result = result.filter((j) => j.status === "In Transit");
    } else if (kpiFilter === "delivered") {
      result = result.filter((j) => j.status === "Delivered");
    } else if (kpiFilter === "moves") {
      result = result.filter((j) => getJobExtra(j).movementType === "Room Move");
    }

    // Search bar
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (j) =>
          j.guest.toLowerCase().includes(q) ||
          j.room.includes(q) ||
          j.tagNumber.toLowerCase().includes(q)
      );
    }

    // Toolbar status selector
    if (statusFilter !== "all") {
      result = result.filter((j) => j.status === statusFilter);
    }

    // Popover detailed filters
    if (typeFilter !== "All") {
      result = result.filter((j) => getJobExtra(j).movementType === typeFilter);
    }
    if (bellboyFilter !== "All") {
      result = result.filter((j) => j.bellBoy === bellboyFilter);
    }
    if (locationFilter !== "All") {
      result = result.filter((j) => {
        const extra = getJobExtra(j);
        return extra.lockerCoordinate === locationFilter;
      });
    }

    // Sorting
    if (sortBy === "ID") {
      result.sort((a, b) => b.id.localeCompare(a.id));
    } else if (sortBy === "Bags") {
      result.sort((a, b) => b.bagCount - a.bagCount);
    } else if (sortBy === "Guest") {
      result.sort((a, b) => a.guest.localeCompare(b.guest));
    }

    return result;
  }, [luggageJobs, kpiFilter, search, statusFilter, typeFilter, bellboyFilter, locationFilter, sortBy, extraInfoMap]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (typeFilter !== "All") count++;
    if (bellboyFilter !== "All") count++;
    if (locationFilter !== "All") count++;
    if (sortBy !== "ID") count++;
    return count;
  }, [typeFilter, bellboyFilter, locationFilter, sortBy]);

  const selectedJob = useMemo(() => {
    return luggageJobs.find((j) => j.id === selectedJobId) || null;
  }, [luggageJobs, selectedJobId]);

  const handleOpenCreate = () => {
    setBellBoy(recommendedBellboy?.name || bellboys[0]?.name || "");
    setTagNumber(`TAG-${Math.floor(1000 + Math.random() * 9000)}`);
    setCreateOpen(true);
  };

  const handleCreate = () => {
    const bags = parseInt(bagCount, 10) || 1;
    const nextId = `LG-${String(luggageJobs.length + 1).padStart(3, "0")}`;

    // Under-the-hood mappings for restricted schema types
    const mappedType = type === "Room Move" ? "Check-in" : type;

    addLuggageJob({
      guest,
      room,
      bellBoy,
      tagNumber,
      bagCount: bags,
      type: mappedType,
      remarks,
    });

    const nowStr = new Date().toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const extra = {
      reservationId,
      bagType,
      lockerCoordinate: mappedType === "Check-in" ? "Lobby Desk" : lockerCoordinate,
      longTermStorage,
      vipHandling,
      movementType: type,
      targetRoom: type === "Room Move" ? targetRoom : "",
      preInspection: {
        scratches,
        brokenZippers: zippers,
        damagedHandles: handles,
        fragileTag,
      },
      timeline: {
        createdAt: nowStr,
        dispatchedAt: bellBoy ? nowStr : undefined,
      },
    };
    saveExtraInfo(nextId, extra);

    setCreateOpen(false);
    setRemarks("");
    setTargetRoom("");
    setScratches(false);
    setZippers(false);
    setHandles(false);
    setFragileTag(false);
    setVipHandling(false);
    setToast({ message: `Luggage tag ${tagNumber} registered successfully!`, variant: "success" });
  };

  const handleAdvanceStatus = (id: string, current: string) => {
    const nowStr = new Date().toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const extra = getJobExtra({ id });
    const currentIdx = LUGGAGE_STATUS_STEPS.indexOf(current);

    if (currentIdx === -1 || currentIdx === LUGGAGE_STATUS_STEPS.length - 1) return;
    const nextStatus = LUGGAGE_STATUS_STEPS[currentIdx + 1];

    if (nextStatus === "Delivered" || nextStatus === "Returned" || nextStatus === "Completed") {
      deliverLuggage(id);
    } else {
      deliverLuggage(id); // For simplicity of mock context state
    }

    const updatedExtra = {
      ...extra,
      timeline: {
        ...extra.timeline,
        dispatchedAt: nextStatus === "Assigned" || nextStatus === "Collected" ? nowStr : extra.timeline.dispatchedAt,
        storedAt: nextStatus === "Stored" ? nowStr : extra.timeline.storedAt,
        deliveredAt: nextStatus === "Delivered" || nextStatus === "Returned" || nextStatus === "Completed" ? nowStr : extra.timeline.deliveredAt,
      },
    };
    saveExtraInfo(id, updatedExtra);
    setSelectedJobId(null);
    setToast({ message: `Baggage tag ${id} advanced to ${nextStatus}.`, variant: "success" });
  };

  const handleTogglePopover = () => {
    if (!isFilterPopoverOpen) {
      setDraftTypeFilter(typeFilter);
      setDraftBellboyFilter(bellboyFilter);
      setDraftLocationFilter(locationFilter);
      setDraftSortBy(sortBy);
    }
    setIsFilterPopoverOpen((prev) => !prev);
  };

  const handleApplyFilters = () => {
    setTypeFilter(draftTypeFilter);
    setBellboyFilter(draftBellboyFilter);
    setLocationFilter(draftLocationFilter);
    setSortBy(draftSortBy);
    setIsFilterPopoverOpen(false);
  };

  // Locker Shelves Data Mappings
  const storageShelves = [
    { id: "L-01", name: "Shelf A-1", zone: "Zone A (Fragile/Small)", capacity: 6, occupied: 3 },
    { id: "L-02", name: "Shelf A-2", zone: "Zone A (Fragile/Small)", capacity: 6, occupied: 1 },
    { id: "L-03", name: "Shelf B-1", zone: "Zone B (Suitcases)", capacity: 8, occupied: 4 },
    { id: "L-04", name: "Shelf B-2", zone: "Zone B (Suitcases)", capacity: 8, occupied: 0 },
    { id: "L-05", name: "Cage C", zone: "Zone C (Oversized/Trunks)", capacity: 4, occupied: 2 },
  ];

  const statusBadges = {
    Pending: "bg-blue-50 text-blue-750 border border-blue-100",
    "In Transit": "bg-orange-50 text-orange-700 border border-orange-100 animate-pulse",
    Stored: "bg-amber-50 text-amber-700 border border-amber-105",
    Delivered: "bg-green-50 text-green-900 border border-green-200 font-extrabold",
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Operations</span>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-800 tracking-tight">Luggage & Baggage Management</h1>
          <p className="text-xs text-slate-500 font-medium">
            Register guest baggage tags, schedule bell staff deliveries, and trace active BOH locker rooms.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="!bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white flex items-center justify-center gap-1.5 rounded-xl h-9 px-3.5 shadow-sm transition-all text-xs font-bold shrink-0 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Tag Baggage
        </Button>
      </div>

      {/* Toast notifier */}
      {toast && (
        <div className={cn(
          "fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl p-3.5 text-xs font-bold shadow-xl animate-in fade-in slide-in-from-bottom-2",
          toast.variant === "success" ? "bg-emerald-600 text-white" :
          toast.variant === "error" ? "bg-red-655 text-white" : "bg-blue-600 text-white"
        )}>
          <CheckCircle2 className="h-4 w-4" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Primary Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex flex-wrap gap-4 md:gap-6 text-xs font-bold uppercase tracking-wider">
          {[
            { id: "active", label: `Active Queue (${luggageJobs.filter(j => j.status !== "Delivered").length})` },
            { id: "lockers", label: "Locker Storage Room Map" },
            { id: "reports", label: "Reports & Analytics" },
            { id: "audit", label: "Operational Audit Logs" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "pb-3 px-1 border-b-2 transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "border-emerald-700 text-emerald-755 font-extrabold"
                  : "border-transparent text-slate-600 hover:text-slate-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ACTIVE QUEUE TAB */}
      {activeTab === "active" && (
        <div className="space-y-4">
          {/* KPI Stat Cards Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <KPILuggageCard
              title="Total Baggage"
              value={kpis.total}
              subtitle="Registered Jobs"
              icon={Luggage}
              colorClass="bg-slate-50 text-slate-600"
              borderColor="border-slate-100 hover:border-slate-200"
              isActive={kpiFilter === "all"}
              onClick={() => setKpiFilter("all")}
            />
            <KPILuggageCard
              title="Awaiting Delivery"
              value={kpis.pending}
              subtitle="Pending queues"
              icon={Clock}
              colorClass="bg-blue-50 text-blue-600"
              borderColor="border-slate-100 hover:border-slate-200"
              isActive={kpiFilter === "pending"}
              onClick={() => setKpiFilter(kpiFilter === "pending" ? "all" : "pending")}
            />
            <KPILuggageCard
              title="Locker Stored"
              value={kpis.stored}
              subtitle="Locker rooms"
              icon={Box}
              colorClass="bg-amber-50 text-amber-600"
              borderColor="border-slate-100 hover:border-slate-200"
              isActive={kpiFilter === "stored"}
              onClick={() => setKpiFilter(kpiFilter === "stored" ? "all" : "stored")}
            />
            <KPILuggageCard
              title="In Transit"
              value={kpis.transit}
              subtitle="Attendant runs"
              icon={Truck}
              colorClass="bg-orange-50 text-orange-600"
              borderColor="border-slate-100 hover:border-slate-200"
              isActive={kpiFilter === "transit"}
              onClick={() => setKpiFilter(kpiFilter === "transit" ? "all" : "transit")}
            />
            <KPILuggageCard
              title="Room Moves"
              value={kpis.moves}
              subtitle="Inter-room luggage"
              icon={ArrowRightLeft}
              colorClass="bg-violet-50 text-violet-600"
              borderColor="border-slate-100 hover:border-slate-200"
              isActive={kpiFilter === "moves"}
              onClick={() => setKpiFilter(kpiFilter === "moves" ? "all" : "moves")}
            />
            <KPILuggageCard
              title="Returned Logs"
              value={kpis.delivered}
              subtitle="Baggages returned"
              icon={CheckCircle2}
              colorClass="bg-green-50 text-green-700"
              borderColor="border-slate-100 hover:border-slate-200"
              isActive={kpiFilter === "delivered"}
              onClick={() => setKpiFilter(kpiFilter === "delivered" ? "all" : "delivered")}
            />
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <TextInput
                className="pl-9 text-xs rounded-xl"
                placeholder="Search guest, room, or tag ID…"
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <SelectInput
                className="w-38 text-xs rounded-xl"
                value={statusFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending Collection</option>
                <option value="In Transit">In Transit</option>
                <option value="Stored">Locker Stored</option>
                <option value="Delivered">Delivered & Closed</option>
              </SelectInput>

              <div className="relative" ref={popoverRef}>
                <Button
                  variant="outline"
                  onClick={handleTogglePopover}
                  className="text-xs font-semibold border-slate-200 rounded-xl h-8 px-3 gap-1.5 flex items-center justify-center bg-white"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold text-white leading-none">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>

                {isFilterPopoverOpen && (
                  <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl space-y-3.5 animate-in fade-in slide-in-from-top-1">
                    <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Filter Parameters</h4>
                    <div className="space-y-3">
                      <FormField label="Movement Type">
                        <SelectInput
                          value={draftTypeFilter}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDraftTypeFilter(e.target.value)}
                          className="text-xs"
                        >
                          <option value="All">All Types</option>
                          <option value="Check-in">Check-in</option>
                          <option value="Check-out">Check-out</option>
                          <option value="Storage">Locker Storage</option>
                          <option value="Room Move">Room Move</option>
                        </SelectInput>
                      </FormField>

                      <FormField label="Assigned Bellboy">
                        <SelectInput
                          value={draftBellboyFilter}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDraftBellboyFilter(e.target.value)}
                          className="text-xs"
                        >
                          <option value="All">All Bellboys</option>
                          {bellboys.map((b) => (
                            <option key={b.id} value={b.name}>{b.name}</option>
                          ))}
                        </SelectInput>
                      </FormField>

                      <FormField label="Sort Parameter">
                        <SelectInput
                          value={draftSortBy}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDraftSortBy(e.target.value)}
                          className="text-xs"
                        >
                          <option value="ID">Tag ID (Descending)</option>
                          <option value="Bags">Bag Count</option>
                          <option value="Guest">Guest Name</option>
                        </SelectInput>
                      </FormField>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDraftTypeFilter("All");
                          setDraftBellboyFilter("All");
                          setDraftSortBy("ID");
                        }}
                        className="w-1/2 !bg-slate-100 hover:!bg-slate-200 !text-slate-700 !border-transparent text-xs py-1.5"
                      >
                        Reset
                      </Button>
                      <Button
                        onClick={handleApplyFilters}
                        className="w-1/2 !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white text-xs py-1.5"
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Queue Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="px-5 py-3.5">Tag ID</th>
                  <th className="px-5 py-3.5">Guest & Reservation</th>
                  <th className="px-5 py-3.5">Room Destination</th>
                  <th className="px-5 py-3.5 text-center">Baggage Details</th>
                  <th className="px-5 py-3.5">Movement</th>
                  <th className="px-5 py-3.5">Locker Coord</th>
                  <th className="px-5 py-3.5">Attendant Assignee</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredLuggage.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16 text-slate-400 italic font-medium">
                      <Luggage className="h-8 w-8 mx-auto text-slate-300 opacity-60 mb-2" />
                      No active luggage jobs match your filters.
                    </td>
                  </tr>
                ) : (
                  filteredLuggage.map((job) => {
                    const extra = getJobExtra(job);
                    const warningCheckout = isCheckoutPendingWarning(job);

                    return (
                      <tr
                        key={job.id}
                        onClick={() => setSelectedJobId(job.id)}
                        className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-4 text-[11px] font-extrabold text-slate-600">
                          {job.tagNumber}
                        </td>
                        <td className="px-5 py-4">
                          <div className="leading-tight">
                            <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                              {job.guest}
                              {extra.vipHandling && (
                                <span className="rounded bg-amber-500 text-white font-extrabold px-1 text-[7px] tracking-wide">VIP</span>
                              )}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold block">{extra.reservationId}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="leading-tight">
                            {extra.movementType === "Room Move" ? (
                              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                                Room {job.room} <ChevronRight className="h-2.5 w-2.5 inline text-slate-400" /> {extra.targetRoom}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-800">Room {job.room}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="leading-tight">
                            <span className="font-extrabold text-slate-800">{job.bagCount} Pcs</span>
                            <span className="text-[9px] text-slate-400 block">{extra.bagType}s</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={cn(
                            "rounded px-1.5 py-0.5 text-[8.5px] border font-bold uppercase",
                            extra.movementType === "Room Move" ? "bg-violet-50 text-violet-750 border-violet-100" :
                            extra.movementType === "Storage" ? "bg-amber-50 text-amber-700 border-amber-100" :
                            extra.movementType === "Check-out" ? "bg-red-50 text-red-700 border-red-100" : "bg-blue-50 text-blue-750 border-blue-100"
                          )}>
                            {extra.movementType}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono text-[10.5px] text-slate-500">
                          {extra.movementType === "Check-in" ? "Lobby Hold" : extra.lockerCoordinate}
                        </td>
                        <td className="px-5 py-4">
                          <div className="leading-tight">
                            <span className="text-slate-805">{job.bellBoy || "—"}</span>
                            {job.bellBoy && (
                              <span className="text-[8.5px] text-slate-400 block font-medium">
                                Workload: {bellboyWorkloads[job.bellBoy] ?? 0} active
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-[8.5px] border font-extrabold uppercase whitespace-nowrap",
                            warningCheckout ? "bg-red-50 text-red-700 border-red-100 animate-pulse" :
                            statusBadges[job.status] || "bg-slate-50 text-slate-600 border-slate-200"
                          )}>
                            {warningCheckout ? "Pending Checkout" : job.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center text-slate-450">
                          <ChevronRight className="h-4 w-4 mx-auto" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LOCKER STORAGE ROOM MAP TAB */}
      {activeTab === "lockers" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-emerald-700" /> BOH Storage Room Map & Capacity limits
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Monitor live occupancy maps of BOH luggage cage compartments and storage shelves.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {storageShelves.map((shelf) => {
                const percent = Math.round((shelf.occupied / shelf.capacity) * 100);
                const isFull = shelf.occupied >= shelf.capacity;

                return (
                  <div key={shelf.id} className="rounded-2xl border border-slate-100 p-4 space-y-3 bg-white shadow-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-xs">{shelf.name}</h4>
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">{shelf.zone}</span>
                      </div>
                      <span className={cn(
                        "rounded px-1.5 py-0.5 text-[9px] font-bold border uppercase",
                        isFull ? "bg-red-50 text-red-750 border-red-100" :
                        percent > 70 ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                      )}>
                        {shelf.occupied}/{shelf.capacity} Items
                      </span>
                    </div>

                    <div className="bg-slate-100 rounded-full h-2">
                      <div
                        className={cn("rounded-full h-2 transition-all duration-300",
                          isFull ? "bg-red-550" : percent > 70 ? "bg-amber-500" : "bg-[#0F8A5F]"
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    {/* Mock Shelf Details */}
                    <div className="pt-2 border-t border-slate-50 text-[10px] font-semibold text-slate-600 space-y-1.5">
                      <p className="text-slate-400 uppercase text-[8.5px] font-extrabold">Active Shelf Occupants</p>
                      {shelf.occupied === 0 ? (
                        <p className="text-slate-400 italic">Empty Shelf — Available for hold</p>
                      ) : (
                        <div className="space-y-1">
                          {luggageJobs.slice(0, shelf.occupied).map((j, i) => (
                            <div key={i} className="flex justify-between text-slate-700">
                              <span>TAG-{j.tagNumber.slice(-4) || "8841"} ({j.guest})</span>
                              <span className="text-slate-450 font-mono font-medium">{j.bagCount} Bags</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* REPORTS & ANALYTICS TAB */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-emerald-700" /> Luggage Operations Ledger Reports
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Generate daily baggage movement sheets, attendant performance logs, and lost/delayed luggage checklists.
                </p>
              </div>

              {/* Sub tabs in reports */}
              <div className="flex bg-slate-100 p-0.5 rounded-xl text-[10.5px] font-bold">
                {[
                  { id: "daily", label: "Daily Movement" },
                  { id: "pending", label: "Pending Deliveries" },
                  { id: "stored", label: "Locker Holds" },
                  { id: "performance", label: "Attendant Stats" },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setReportSubTab(s.id as any)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg transition-all",
                      reportSubTab === s.id ? "bg-white text-slate-850 shadow-xs" : "text-slate-600 hover:text-slate-850"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Movement Ledger */}
            {reportSubTab === "daily" && (
              <div className="space-y-3">
                <table className="w-full text-left text-xs font-semibold text-slate-700">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold bg-slate-50/50">
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Movement Type</th>
                      <th className="px-4 py-2.5 text-center">Baggage Tags Processed</th>
                      <th className="px-4 py-2.5 text-center">Total Bags Handled</th>
                      <th className="px-4 py-2.5 text-right">Avg Handover Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-105">
                    {[
                      { date: "Today, 18 Jul", type: "Check-in Arrivals", tags: 12, count: 28, avgTime: "12 mins" },
                      { date: "Today, 18 Jul", type: "Check-out Departures", tags: 8, count: 19, avgTime: "9 mins" },
                      { date: "Today, 18 Jul", type: "Inter-Room Moves", tags: 4, count: 10, avgTime: "15 mins" },
                      { date: "Yesterday, 17 Jul", type: "Check-in Arrivals", tags: 15, count: 34, avgTime: "11 mins" },
                      { date: "Yesterday, 17 Jul", type: "Check-out Departures", tags: 11, count: 26, avgTime: "10 mins" },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3">{row.date}</td>
                        <td className="px-4 py-3 font-bold text-slate-800">{row.type}</td>
                        <td className="px-4 py-3 text-center text-emerald-800">{row.tags} tags</td>
                        <td className="px-4 py-3 text-center">{row.count} Pcs</td>
                        <td className="px-4 py-3 text-right text-slate-500 font-mono">{row.avgTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pending Deliveries Ledger */}
            {reportSubTab === "pending" && (
              <div className="space-y-3">
                <table className="w-full text-left text-xs font-semibold text-slate-700">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold bg-slate-50/50">
                      <th className="px-4 py-2.5">Tag ID</th>
                      <th className="px-4 py-2.5">Guest</th>
                      <th className="px-4 py-2.5">Destination Room</th>
                      <th className="px-4 py-2.5 text-center">Bags</th>
                      <th className="px-4 py-2.5">Pending Since</th>
                      <th className="px-4 py-2.5 text-right">SLA Target</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-105">
                    {luggageJobs.filter(j => j.status !== "Delivered").map((job, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-bold text-emerald-800">{job.tagNumber}</td>
                        <td className="px-4 py-3">{job.guest}</td>
                        <td className="px-4 py-3">Room {job.room}</td>
                        <td className="px-4 py-3 text-center">{job.bagCount} Pcs</td>
                        <td className="px-4 py-3 font-mono">{job.pickupTime}</td>
                        <td className="px-4 py-3 text-right text-orange-605 font-bold">Within 15 Mins</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Locker Holds Ledger */}
            {reportSubTab === "stored" && (
              <div className="space-y-3">
                <table className="w-full text-left text-xs font-semibold text-slate-700">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold bg-slate-50/50">
                      <th className="px-4 py-2.5">Locker Coordinate</th>
                      <th className="px-4 py-2.5">Tag ID</th>
                      <th className="px-4 py-2.5">Guest Name</th>
                      <th className="px-4 py-2.5 text-center">Bags</th>
                      <th className="px-4 py-2.5">Storage hold Date</th>
                      <th className="px-4 py-2.5 text-right">Storage Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-105">
                    {luggageJobs.filter(j => j.status === "Stored").map((job, i) => {
                      const extra = getJobExtra(job);
                      return (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-mono font-bold text-amber-700">{extra.lockerCoordinate}</td>
                          <td className="px-4 py-3">{job.tagNumber}</td>
                          <td className="px-4 py-3">{job.guest}</td>
                          <td className="px-4 py-3 text-center">{job.bagCount} Pcs</td>
                          <td className="px-4 py-3 font-mono">{job.pickupTime}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={cn(
                              "text-[9px] font-bold uppercase rounded px-1.5 py-0.5 border",
                              extra.longTermStorage ? "bg-red-50 text-red-700 border-red-100" : "bg-amber-50 text-amber-700 border-amber-100"
                            )}>
                              {extra.longTermStorage ? "Long-Term Hold" : "Active Hold"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Attendant Performance Stats */}
            {reportSubTab === "performance" && (
              <div className="space-y-3">
                <table className="w-full text-left text-xs font-semibold text-slate-700">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold bg-slate-50/50">
                      <th className="px-4 py-2.5">Attendant Staff</th>
                      <th className="px-4 py-2.5">Shift Duty</th>
                      <th className="px-4 py-2.5 text-center">Baggage Runs Completed</th>
                      <th className="px-4 py-2.5 text-center">Active Workload runs</th>
                      <th className="px-4 py-2.5 text-right">SLA Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-105">
                    {bellboys.map((boy, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-bold text-slate-800">{boy.name}</td>
                        <td className="px-4 py-3">General Shift (09:00 - 18:00)</td>
                        <td className="px-4 py-3 text-center">{boy.completedToday || 5} Runs</td>
                        <td className="px-4 py-3 text-center text-orange-605">{bellboyWorkloads[boy.name] ?? 0} active</td>
                        <td className="px-4 py-3 text-right text-emerald-805 font-bold">98.4%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* OPERATIONAL AUDIT LOGS TAB */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="h-4 w-4 text-slate-400" /> Luggage Traceability & Audit Trail
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Complete chronological logs of baggage tagging, locker assignments, and handovers.
                </p>
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">System Active</span>
            </div>

            <div className="space-y-3">
              <table className="w-full text-left text-xs font-semibold text-slate-700">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold bg-slate-50/50">
                    <th className="px-4 py-2.5">Timestamp</th>
                    <th className="px-4 py-2.5">Event Action</th>
                    <th className="px-4 py-2.5">Tag ID / Target</th>
                    <th className="px-4 py-2.5">Guest & Room</th>
                    <th className="px-4 py-2.5 text-right">Operator Stamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700 font-mono text-[10.5px]">
                  {luggageJobs.map((job, idx) => {
                    const extra = getJobExtra(job);
                    return (
                      <tr key={`${job.id}-${idx}`}>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{job.pickupTime}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {job.status === "Delivered" ? "Baggage Handover" : "Baggage Registered"}
                        </td>
                        <td className="px-4 py-3 text-emerald-805 font-bold">{job.tagNumber}</td>
                        <td className="px-4 py-3 text-slate-750">
                          {job.guest} (Room {job.room})
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500 whitespace-nowrap font-sans font-bold">
                          {job.bellBoy || "System"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* LUGGAGE JOB DETAILS CONSOLE DRAWER */}
      <Drawer
        open={!!selectedJobId}
        onClose={() => setSelectedJobId(null)}
        title={`${selectedJob?.tagNumber || "Baggage Details"} Movement Console`}
        width="xl"
      >
        {selectedJob && (() => {
          const extra = getJobExtra(selectedJob);
          const isPending = selectedJob.status === "Pending" || selectedJob.status === "Stored";
          const warningCheckout = isCheckoutPendingWarning(selectedJob);

          return (
            <div className="flex flex-col h-full bg-slate-50/30 select-none">
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                
                {/* Check-out hold warning sync panel */}
                {warningCheckout && (
                  <div className="rounded-2xl border border-red-200 bg-red-50/40 p-4 shadow-sm flex gap-3 text-xs font-semibold text-red-800">
                    <AlertCircle className="h-5 w-5 text-red-650 shrink-0 animate-bounce" />
                    <div>
                      <p className="font-bold text-[12px]">Front Office Sync: Check-out Hold</p>
                      <p className="text-red-655 font-medium mt-0.5 leading-relaxed text-[10.5px]">
                        The guest Sarah Chen is currently performing check-out at Reception. Dispatch bellboy <strong>{selectedJob.bellBoy}</strong> immediately to locker coordinate <strong>{extra.lockerCoordinate}</strong> to return bags and release checkout lock!
                      </p>
                    </div>
                  </div>
                )}

                {/* Progress Timeline */}
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
                  <h4 className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                    <History className="h-4 w-4 text-slate-400" /> Movement Timeline
                  </h4>
                  <div className="flex flex-col gap-2 pl-2">
                    {[
                      { label: "Baggage Tagged & Registered", checked: true, sub: extra.timeline.createdAt },
                      { label: `Bellboy Dispatched (${selectedJob.bellBoy})`, checked: !!extra.timeline.dispatchedAt, sub: extra.timeline.dispatchedAt },
                      { label: `Locker Stored (${extra.lockerCoordinate})`, checked: selectedJob.status === "Stored" || selectedJob.status === "Delivered", sub: extra.timeline.storedAt },
                      { label: "Delivered & Closed", checked: selectedJob.status === "Delivered", sub: extra.timeline.deliveredAt },
                    ].map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white mt-0.5",
                          step.checked ? "bg-emerald-600" : "bg-slate-200"
                        )}>
                          {step.checked ? "✓" : idx + 1}
                        </div>
                        <div className="leading-tight">
                          <span className={cn(
                            "text-xs font-semibold block",
                            step.checked ? "text-slate-800" : "text-slate-400"
                          )}>
                            {step.label}
                          </span>
                          {step.sub && (
                            <span className="text-[8.5px] text-slate-405 font-mono">{step.sub}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Specifications */}
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
                  <h4 className="font-bold text-slate-855 text-[11px] uppercase tracking-wider border-b border-slate-50 pb-1.5 flex items-center gap-1.5">
                    <Luggage className="h-4 w-4 text-slate-400" /> Baggage Specifications
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs font-semibold text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Guest Name</span>
                      <span className="text-slate-900 font-extrabold text-[12px]">{selectedJob.guest}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Reservation Reference</span>
                      <span className="text-slate-800 font-mono">{extra.reservationId}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Movement Type</span>
                      <span className="text-slate-850 font-bold uppercase">{extra.movementType}</span>
                    </div>
                    {extra.movementType === "Room Move" ? (
                      <>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Source Room</span>
                          <span className="text-slate-800">Room {selectedJob.room}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Target Destination Room</span>
                          <span className="text-slate-805 font-extrabold text-blue-700">Room {extra.targetRoom}</span>
                        </div>
                      </>
                    ) : (
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Room Number</span>
                        <span className="text-slate-800">Room {selectedJob.room}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Baggage Details</span>
                      <span className="text-slate-850 font-bold text-slate-900">
                        {selectedJob.bagCount} Pcs ({extra.bagType})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Locker Coordinate Map</span>
                      <span className="text-slate-750 font-bold text-amber-700">{extra.lockerCoordinate}</span>
                    </div>
                  </div>
                </div>

                {/* Pre-Intake Condition Inspection Checks */}
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
                  <h4 className="font-bold text-slate-855 text-[11px] uppercase tracking-wider border-b border-slate-50 pb-1.5 flex items-center gap-1.5">
                    <Camera className="h-4 w-4 text-emerald-700" /> Pre-Intake Bag Inspection
                  </h4>
                  <div className="space-y-3 text-xs font-semibold">
                    <div className="space-y-1">
                      <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Intake Condition Log</span>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[9px] border font-bold",
                          extra.preInspection.scratches ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                        )}>
                          {extra.preInspection.scratches ? "⚠ Scratches/Dents Logged" : "✓ No Dents"}
                        </span>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[9px] border font-bold",
                          extra.preInspection.brokenZippers ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                        )}>
                          {extra.preInspection.brokenZippers ? "⚠ Faulty Zippers" : "✓ Zippers OK"}
                        </span>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[9px] border font-bold",
                          extra.preInspection.damagedHandles ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                        )}>
                          {extra.preInspection.damagedHandles ? "⚠ Loose Handles" : "✓ Handles OK"}
                        </span>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[9px] border font-bold",
                          extra.preInspection.fragileTag ? "bg-orange-50 text-orange-700 border-orange-100" : "bg-slate-50 text-slate-600 border-slate-100"
                        )}>
                          {extra.preInspection.fragileTag ? "★ Fragile Tags Attached" : "Standard tag"}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Bag Condition Verification Photo</span>
                      <div className="mt-1 flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                        <Camera className="h-6 w-6 text-slate-450 shrink-0" />
                        <div>
                          <p className="text-[10px] text-slate-800 font-bold">LuggageIntake_{selectedJob.id}.jpg</p>
                          <p className="text-[9px] text-slate-400 font-semibold">Verification check signature photo</p>
                        </div>
                        <span className="ml-auto text-[9.5px] font-bold text-emerald-700 hover:underline cursor-pointer">View</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bellboy Assignee stats */}
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
                  <h4 className="font-bold text-slate-855 text-[11px] uppercase tracking-wider border-b border-slate-50 pb-1.5 flex items-center gap-1.5">
                    <User className="h-4 w-4 text-slate-400" /> Bellboy Assignee Workload
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs font-semibold text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Assignee Staff</span>
                      <span className="text-slate-900 font-extrabold">{selectedJob.bellBoy}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Active Workloads</span>
                      <span className="text-slate-805">
                        {bellboyWorkloads[selectedJob.bellBoy] ?? 0} active movement runs
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Sticky footer actions */}
              <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 flex gap-3 shadow-lg">
                <Button
                  variant="outline"
                  onClick={() => setSelectedJobId(null)}
                  className="w-1/2 !bg-slate-100 hover:!bg-slate-200 !text-slate-700 !border-slate-205 flex items-center justify-center text-xs py-2 px-3 font-bold rounded-xl transition-all h-9"
                >
                  Close Console
                </Button>

                {selectedJob.status !== "Delivered" && (
                  <Button
                    onClick={() => handleAdvanceStatus(selectedJob.id, selectedJob.status)}
                    className="w-1/2 !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white flex items-center justify-center text-xs py-2 px-3 font-bold rounded-xl transition-all shadow-xs h-9"
                  >
                    Confirm Baggage Delivery
                  </Button>
                )}
              </div>
            </div>
          );
        })()}
      </Drawer>

      {/* DRAWER: TAG BAGGAGE (CREATE) */}
      <Drawer open={createOpen} onClose={() => setCreateOpen(false)} title="Tag Guest Baggage">
        <div className="space-y-4 select-none">
          <FormField label="Movement / Storage Type" required>
            <SelectInput value={type} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setType(e.target.value as any)}>
              <option value="Check-in">Check-in (Lobby ➔ Guest Room)</option>
              <option value="Check-out">Check-out (Guest Room ➔ Lobby)</option>
              <option value="Storage">Locker Storage Room Hold</option>
              <option value="Room Move">Room Move (Transfer bags between rooms)</option>
            </SelectInput>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Guest Name" required>
              <TextInput value={guest} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGuest(e.target.value)} />
            </FormField>
            
            <FormField label="Reservation ID" required>
              <TextInput value={reservationId} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReservationId(e.target.value)} />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {type === "Room Move" ? (
              <FormField label="Source Room" required>
                <TextInput value={room} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoom(e.target.value)} />
              </FormField>
            ) : (
              <FormField label="Room Number" required>
                <TextInput value={room} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoom(e.target.value)} />
              </FormField>
            )}

            {type === "Room Move" ? (
              <FormField label="Target Destination Room" required>
                <TextInput
                  placeholder="e.g. 204"
                  value={targetRoom}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetRoom(e.target.value)}
                />
              </FormField>
            ) : (
              <FormField label="VIP Handling holding" required>
                <SelectInput value={vipHandling ? "Yes" : "No"} onChange={(e) => setVipHandling(e.target.value === "Yes")}>
                  <option value="No">No (Standard priority)</option>
                  <option value="Yes">Yes (VIP priority SLA hold)</option>
                </SelectInput>
              </FormField>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Tag ID Number" required>
              <TextInput value={tagNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagNumber(e.target.value)} />
            </FormField>
            <FormField label="Total Baggage Count" required>
              <TextInput type="number" min="1" value={bagCount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBagCount(e.target.value)} />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Baggage Type" required>
              <SelectInput value={bagType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBagType(e.target.value as any)}>
                <option value="Suitcase">Suitcases</option>
                <option value="Duffel">Duffel Bags</option>
                <option value="Backpack">Backpacks</option>
                <option value="Box">Boxes / Cartons</option>
                <option value="Garment Bag">Garment Bags</option>
                <option value="Golf Club">Golf Club Bags</option>
              </SelectInput>
            </FormField>
            
            <FormField label="Locker Storage Shelf">
              <SelectInput
                disabled={type === "Check-in"}
                value={lockerCoordinate}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLockerCoordinate(e.target.value)}
              >
                <option value="Shelf A-1">Locker Shelf A-1</option>
                <option value="Shelf A-2">Locker Shelf A-2</option>
                <option value="Shelf B-1">Locker Shelf B-1</option>
                <option value="Shelf B-2">Locker Shelf B-2</option>
                <option value="Cage C">Locker Cage C (Large Items)</option>
              </SelectInput>
            </FormField>
          </div>

          {/* Pre-Intake Bag Inspection Panel */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2.5">
            <p className="font-bold text-slate-800 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="h-4 w-4 text-emerald-700" /> Pre-Intake Baggage Inspection Check
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-800 select-none">
                <input type="checkbox" checked={scratches} onChange={(e) => setScratches(e.target.checked)} className="rounded border-slate-300 text-emerald-700" />
                Scratches / Dents
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-800 select-none">
                <input type="checkbox" checked={zippers} onChange={(e) => setZippers(e.target.checked)} className="rounded border-slate-300 text-emerald-700" />
                Broken Zippers
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-800 select-none">
                <input type="checkbox" checked={handles} onChange={(e) => setHandles(e.target.checked)} className="rounded border-slate-300 text-emerald-700" />
                Loose/Damaged Handles
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-800 select-none">
                <input type="checkbox" checked={fragileTag} onChange={(e) => setFragileTag(e.target.checked)} className="rounded border-slate-300 text-emerald-700" />
                Fragile Tag Checked
              </label>
            </div>
          </div>

          {/* Bellboy Assignee & Smart Workload recommendation */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-3">
            <FormField label="Bell Boy Assignee" required>
              <SelectInput value={bellBoy} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBellBoy(e.target.value)}>
                {bellboys.map((boy) => (
                  <option key={boy.id} value={boy.name}>
                    {boy.name} (Workload: {bellboyWorkloads[boy.name] ?? 0} active runs)
                  </option>
                ))}
              </SelectInput>
            </FormField>

            {recommendedBellboy && (
              <div className="flex items-start gap-2 text-[10px] text-emerald-755 font-semibold bg-emerald-50/20 border border-emerald-100 p-2.5 rounded-xl">
                <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" />
                <div>
                  Recommended: <strong className="text-emerald-800">{recommendedBellboy.name}</strong> has the lowest active workloads ({bellboyWorkloads[recommendedBellboy.name] ?? 0} runs).
                </div>
              </div>
            )}
          </div>

          {/* Long Term hold checkbox */}
          {type !== "Check-in" && (
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
              <input type="checkbox" checked={longTermStorage} onChange={(e) => setLongTermStorage(e.target.checked)} className="rounded border-slate-300 text-emerald-700" />
              Flag as Long-Term Holding Baggage
            </label>
          )}

          <FormField label="Remarks / Special Handling">
            <TextAreaInput
              placeholder="e.g. Keep upright, box has fragile glass ornaments, check tag match."
              value={remarks}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRemarks(e.target.value)}
            />
          </FormField>

          <Button
            onClick={handleCreate}
            className="w-full !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white font-bold py-2.5 rounded-xl transition-all shadow-sm"
          >
            Create Luggage Job
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
