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
import { KPILuggageCard } from "./KPICard";
import { LuggageEntryModal } from "./LuggageEntryModal";

const LUGGAGE_STATUS_STEPS = ["Registered", "Assigned", "Collected", "Stored", "Delivered", "Returned", "Completed"];

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
  const [kpiFilter, setKpiFilter] = useState<string>("all");
  const [reportSubTab, setReportSubTab] = useState<"daily" | "pending" | "stored" | "performance">("daily");

  const [extraInfoMap, setExtraInfoMap] = useState<Record<string, any>>({});
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

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (j) =>
          j.guest.toLowerCase().includes(q) ||
          j.room.includes(q) ||
          j.tagNumber.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((j) => j.status === statusFilter);
    }

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
    setCreateOpen(true);
  };

  const handleSaveJob = (data: any) => {
    const nextId = `LG-${String(luggageJobs.length + 1).padStart(3, "0")}`;
    const mappedType = data.type === "Room Move" ? "Check-in" : data.type;

    addLuggageJob({
      guest: data.guest,
      room: data.room,
      bellBoy: data.bellBoy,
      tagNumber: data.tagNumber,
      bagCount: data.bagCount,
      type: mappedType,
      remarks: data.remarks,
    });

    const nowStr = new Date().toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const extra = {
      reservationId: data.reservationId,
      bagType: data.bagType,
      lockerCoordinate: mappedType === "Check-in" ? "Lobby Desk" : data.lockerCoordinate,
      longTermStorage: data.longTermStorage,
      vipHandling: data.vipHandling,
      movementType: data.type,
      targetRoom: data.type === "Room Move" ? data.targetRoom : "",
      preInspection: data.preInspection,
      timeline: {
        createdAt: nowStr,
        dispatchedAt: data.bellBoy ? nowStr : undefined,
      },
    };
    saveExtraInfo(nextId, extra);

    setCreateOpen(false);
    setToast({ message: `Luggage tag ${data.tagNumber} registered successfully!`, variant: "success" });
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

    deliverLuggage(id);

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

  const storageShelves = [
    { id: "L-01", name: "Shelf A-1", zone: "Zone A (Fragile/Small)", capacity: 6, occupied: 3 },
    { id: "L-02", name: "Shelf A-2", zone: "Zone A (Fragile/Small)", capacity: 6, occupied: 1 },
    { id: "L-03", name: "Shelf B-1", zone: "Zone B (Suitcases)", capacity: 8, occupied: 4 },
    { id: "L-04", name: "Shelf B-2", zone: "Zone B (Suitcases)", capacity: 8, occupied: 0 },
    { id: "L-05", name: "Cage C", zone: "Zone C (Oversized/Trunks)", capacity: 4, occupied: 2 },
  ];

  const statusBadges: Record<string, string> = {
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
        <nav className="flex gap-4 overflow-x-auto scrollbar-none md:gap-6 text-xs font-bold uppercase tracking-wider">
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
                  className="flex items-center gap-1.5 text-xs h-9 rounded-xl border-slate-200 bg-white px-3 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-700 text-[9px] font-bold text-white">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>

                {isFilterPopoverOpen && (
                  <div className="absolute left-0 right-0 z-40 mt-2 w-auto max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl animate-in fade-in zoom-in-95 sm:left-auto sm:right-0 sm:w-72 sm:max-w-none">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3">
                      Refine Baggage Queue
                    </h4>
                    <div className="space-y-3">
                      <FormField label="Movement Type">
                        <SelectInput
                          className="text-xs rounded-xl"
                          value={draftTypeFilter}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDraftTypeFilter(e.target.value)}
                        >
                          <option value="All">All Movement Types</option>
                          <option value="Check-in">Check-in</option>
                          <option value="Check-out">Check-out</option>
                          <option value="Storage">Locker Hold</option>
                          <option value="Room Move">Room Move</option>
                        </SelectInput>
                      </FormField>

                      <FormField label="Bellboy Assignee">
                        <SelectInput
                          className="text-xs rounded-xl"
                          value={draftBellboyFilter}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDraftBellboyFilter(e.target.value)}
                        >
                          <option value="All">All Staff</option>
                          {bellboys.map((b) => (
                            <option key={b.id} value={b.name}>{b.name}</option>
                          ))}
                        </SelectInput>
                      </FormField>

                      <FormField label="Locker Coordinate">
                        <SelectInput
                          className="text-xs rounded-xl"
                          value={draftLocationFilter}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDraftLocationFilter(e.target.value)}
                        >
                          <option value="All">All Storage Shelves</option>
                          <option value="Shelf A-1">Shelf A-1</option>
                          <option value="Shelf A-2">Shelf A-2</option>
                          <option value="Shelf B-1">Shelf B-1</option>
                          <option value="Shelf B-2">Shelf B-2</option>
                          <option value="Cage C">Cage C</option>
                        </SelectInput>
                      </FormField>

                      <FormField label="Sort Order">
                        <SelectInput
                          className="text-xs rounded-xl"
                          value={draftSortBy}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDraftSortBy(e.target.value)}
                        >
                          <option value="ID">Latest Job Tag ID</option>
                          <option value="Bags">Highest Bag Count</option>
                          <option value="Guest">Guest Name (A-Z)</option>
                        </SelectInput>
                      </FormField>

                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setDraftTypeFilter("All");
                            setDraftBellboyFilter("All");
                            setDraftLocationFilter("All");
                            setDraftSortBy("ID");
                          }}
                          className="w-1/2 text-[11px] h-8 rounded-xl font-bold border-slate-200"
                        >
                          Reset
                        </Button>
                        <Button
                          onClick={handleApplyFilters}
                          className="w-1/2 !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white text-[11px] h-8 rounded-xl font-bold"
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile luggage cards */}
          <div className="space-y-3 md:hidden">
            {filteredLuggage.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">No active baggage jobs match your criteria.</p>
            ) : (
              filteredLuggage.map((job) => {
                const extra = getJobExtra(job);
                return (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => setSelectedJobId(job.id)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-mono text-[11px] font-extrabold text-emerald-800">{job.tagNumber}</p>
                        <p className="font-bold text-slate-900 truncate">
                          {job.guest}
                          {extra.vipHandling ? " · VIP" : ""}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Room {job.room} · {job.type} · {job.bagCount} bags
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-700">
                        {job.status}
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-500">
                      {job.bellBoy || "Unassigned"} · {job.pickupTime}
                    </p>
                  </button>
                );
              })
            )}
          </div>

          {/* Table */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Tag ID</th>
                    <th className="py-3 px-4">Guest & Reservation</th>
                    <th className="py-3 px-4">Room & Target</th>
                    <th className="py-3 px-4">Movement & Type</th>
                    <th className="py-3 px-4">Baggage Details</th>
                    <th className="py-3 px-4">Assignee Staff</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {filteredLuggage.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                        No active baggage jobs match your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLuggage.map((job) => {
                      const extra = getJobExtra(job);
                      const isWarning = isCheckoutPendingWarning(job);

                      return (
                        <tr
                          key={job.id}
                          className="hover:bg-emerald-50/20 transition-colors cursor-pointer"
                          onClick={() => setSelectedJobId(job.id)}
                        >
                          <td className="py-3 px-4 font-mono font-extrabold text-emerald-800">
                            {job.tagNumber}
                            <span className="block text-[9px] text-slate-400 font-sans">{job.id}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-slate-900">{job.guest}</span>
                              {extra.vipHandling && (
                                <span className="rounded bg-amber-100 px-1 py-0.2 text-[8px] font-extrabold text-amber-800 uppercase">
                                  VIP
                                </span>
                              )}
                            </div>
                            <span className="block text-[10px] text-slate-400 font-medium">{extra.reservationId}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-800">Room {job.room}</span>
                            {extra.targetRoom && (
                              <span className="block text-[10px] text-emerald-700 font-extrabold">
                                ➔ {extra.targetRoom}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                              {extra.movementType}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span>{job.bagCount} {extra.bagType}(s)</span>
                            {extra.longTermStorage && (
                              <span className="block text-[9px] text-purple-700 font-extrabold">Long-term hold</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-800">{job.bellBoy || "Unassigned"}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px]">
                            {extra.lockerCoordinate}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold", statusBadges[job.status] || "bg-slate-100 text-slate-700")}>
                              {job.status}
                            </span>
                            {isWarning && (
                              <span className="mt-0.5 block text-[8px] font-extrabold text-red-600 flex items-center justify-center gap-0.5">
                                <AlertTriangle className="h-2.5 w-2.5" /> Check-out Pending
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedJobId(job.id);
                              }}
                              className="h-7 text-[10px] font-bold rounded-lg border-slate-200 text-slate-700 hover:bg-slate-100"
                            >
                              Console
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* LOCKERS MAP TAB */}
      {activeTab === "lockers" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-1">
              Back-of-House Baggage Locker Storage Matrix
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-4">
              Real-time occupied shelf slots and oversized baggage cage holds.
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
              {storageShelves.map((shelf) => {
                const percent = Math.round((shelf.occupied / shelf.capacity) * 100);
                return (
                  <div key={shelf.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 text-xs">{shelf.name}</span>
                      <span className="text-[10px] font-bold text-slate-500 font-mono">{shelf.id}</span>
                    </div>
                    <p className="text-[10px] font-medium text-slate-400">{shelf.zone}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-700">
                        <span>Capacity</span>
                        <span>{shelf.occupied} / {shelf.capacity} Slots</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            percent >= 80 ? "bg-red-500" : percent >= 50 ? "bg-amber-500" : "bg-emerald-500"
                          )}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* REPORTS TAB */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <div className="flex gap-2 border-b border-slate-100 pb-2">
            {[
              { id: "daily", label: "Daily Summary" },
              { id: "pending", label: "Pending Deliveries" },
              { id: "stored", label: "Long-term Stored" },
              { id: "performance", label: "Bellboy Performance SLA" },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setReportSubTab(st.id as any)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                  reportSubTab === st.id ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center space-y-2">
            <TrendingUp className="mx-auto h-8 w-8 text-slate-400" />
            <h4 className="text-sm font-bold text-slate-800">Operational Baggage Analytics</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Average delivery SLA turnaround is <strong className="text-slate-800">8.4 minutes</strong> per run today across {luggageJobs.length} total baggage operations.
            </p>
          </div>
        </div>
      )}

      {/* AUDIT LOGS TAB */}
      {activeTab === "audit" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
            Operational Chain-of-Custody Audit Trail
          </h3>
          <div className="space-y-2.5 text-xs font-semibold text-slate-700">
            {luggageJobs.slice(0, 5).map((job) => (
              <div key={job.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 bg-slate-50/40">
                <div className="flex items-center gap-3">
                  <History className="h-4 w-4 text-emerald-700" />
                  <div>
                    <span className="font-extrabold text-slate-900">{job.tagNumber}</span> — Status updated to {job.status} by <span className="text-slate-800 font-bold">{job.bellBoy}</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{job.pickupTime}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      <LuggageEntryModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        bellboys={bellboys}
        bellboyWorkloads={bellboyWorkloads}
        recommendedBellboy={recommendedBellboy}
        onSaveJob={handleSaveJob}
      />

      {/* JOB CONSOLE DRAWER */}
      <Drawer open={!!selectedJobId} onClose={() => setSelectedJobId(null)} title={`Baggage Console — ${selectedJob?.tagNumber ?? ""}`}>
        {selectedJob && (() => {
          const extra = getJobExtra(selectedJob);
          return (
            <div className="space-y-4 text-xs select-none">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-sm">{selectedJob.guest}</span>
                  <span className="font-mono text-emerald-800 font-bold">{extra.reservationId}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Room: <strong>{selectedJob.room}</strong></span>
                  <span>Baggage: <strong>{selectedJob.bagCount} {extra.bagType}(s)</strong></span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Chain of Custody Progress</h4>
                <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                  {["Registered", "Stored", "In Transit", "Delivered"].map((st) => (
                    <div
                      key={st}
                      className={cn(
                        "rounded-lg p-2 border",
                        selectedJob.status === st
                          ? "bg-emerald-700 text-white border-emerald-700"
                          : "bg-slate-50 text-slate-500 border-slate-200"
                      )}
                    >
                      {st}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedJobId(null)}
                  className="w-1/2 text-xs rounded-xl font-bold"
                >
                  Close
                </Button>
                {selectedJob.status !== "Delivered" && (
                  <Button
                    onClick={() => handleAdvanceStatus(selectedJob.id, selectedJob.status)}
                    className="w-1/2 !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white text-xs rounded-xl font-bold"
                  >
                    Advance Status
                  </Button>
                )}
              </div>
            </div>
          );
        })()}
      </Drawer>
    </div>
  );
}
