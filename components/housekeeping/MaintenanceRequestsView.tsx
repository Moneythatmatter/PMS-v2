"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useHousekeeping } from "@/components/housekeeping/HousekeepingContext";
import { Wrench, Clock, CheckCircle2, AlertTriangle, Plus, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { TextInput, SelectInput, FormField, TextAreaInput } from "@/components/frontoffice/ui";
import { getSmartEngineerRecommendation } from "@/components/housekeeping/HousekeepingActions";
import { OperationsToolbar, OperationsFilterDrawer } from "@/components/housekeeping/OperationsToolbar";

const MAINTENANCE_CATEGORIES = [
  "Electrical",
  "Plumbing",
  "Air Conditioner",
  "Television",
  "Furniture",
  "Door Lock",
  "Window",
  "Painting",
  "Water Leakage",
  "Others",
];

export function MaintenanceRequestsView() {
  const {
    maintenance,
    staff,
    rooms,
    addMaintenanceRequest,
    assignMaintenanceRequest,
    startMaintenanceRepair,
    completeMaintenanceRequest,
    verifyMaintenanceRequest,
    currentUserRole,
    currentUsername,
  } = useHousekeeping();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedPill, setSelectedPill] = useState("all");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);

  // Form Fields
  const [roomNo, setRoomNo] = useState("104");
  const [selectedCategory, setSelectedCategory] = useState(MAINTENANCE_CATEGORIES[0]);
  const [priority, setPriority] = useState<"Low" | "Medium" | "High" | "Critical">("High");
  const [description, setDescription] = useState("");

  // Assignment states
  const [assignmentMode, setAssignmentMode] = useState<"Auto" | "Manual">("Auto");
  const [chosenEngineer, setChosenEngineer] = useState("");
  const [reassignReason, setReassignReason] = useState("");
  const [estimatedCompletion, setEstimatedCompletion] = useState("2 Hours");
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; type: "image" | "pdf" | "video"; url: string }[]>([]);

  const formatTimeAgo = (timeStr?: string): string => {
    if (!timeStr) return "Never";
    const diffMs = Date.now() - new Date(timeStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    return new Date(timeStr).toLocaleDateString();
  };

  const filteredMaint = useMemo(() => {
    return maintenance.filter((m) => {
      const matchSearch =
        m.room.includes(search) ||
        m.problem.toLowerCase().includes(search.toLowerCase()) ||
        m.engineer.toLowerCase().includes(search.toLowerCase());
      
      const matchStatus = filterStatus === "all" || m.status === filterStatus;
      
      let matchPill = true;
      if (selectedPill === "Open") matchPill = m.status === "Open";
      else if (selectedPill === "Assigned") matchPill = m.status === "Assigned";
      else if (selectedPill === "In Progress") matchPill = m.status === "In Progress";
      else if (selectedPill === "Awaiting Verification") matchPill = m.status === "Awaiting Verification";
      else if (selectedPill === "Closed") matchPill = m.status === "Closed";
      else if (selectedPill === "High") matchPill = m.priority === "High";
      else if (selectedPill === "Medium") matchPill = m.priority === "Medium";
      else if (selectedPill === "Low") matchPill = m.priority === "Low";
      else if (selectedPill === "Critical") matchPill = m.priority === "Critical";
      else if (selectedPill === "Electrical") matchPill = m.problem.toLowerCase().includes("elect");
      else if (selectedPill === "Plumbing") matchPill = m.problem.toLowerCase().includes("plumb");
      else if (selectedPill === "HVAC") matchPill = m.problem.toLowerCase().includes("ac ") || m.problem.toLowerCase().includes("air cond") || m.problem.toLowerCase().includes("hvac");
      else if (selectedPill === "Furniture") matchPill = m.problem.toLowerCase().includes("furn");
      else if (selectedPill === "Auto Assigned") matchPill = m.assignmentType === "Auto";
      else if (selectedPill === "Manual Assigned") matchPill = m.assignmentType === "Manual";
      else if (selectedPill === "My Jobs") {
        const usernameStr = typeof currentUsername === "string" ? currentUsername : "";
        matchPill = !!(m.engineer && usernameStr && m.engineer.toLowerCase().includes(usernameStr.toLowerCase()));
      }

      return matchSearch && matchStatus && matchPill;
    });
  }, [maintenance, search, filterStatus, selectedPill, currentUsername]);

  const recommendedEngineerObj = useMemo(() => {
    const targetRoomObj = rooms.find((r) => r.roomNo === roomNo);
    const targetFloor = targetRoomObj?.floor || "1st Floor";
    return getSmartEngineerRecommendation(staff, targetFloor, selectedCategory);
  }, [rooms, staff, roomNo, selectedCategory]);

  const sortedEngineerList = useMemo(() => {
    const targetRoomObj = rooms.find((r) => r.roomNo === roomNo);
    const targetFloor = targetRoomObj?.floor || "1st Floor";
    
    const candidateEngineers = staff.filter((s) => {
      const isEngineer = s.role === "Engineer";
      const isActive = s.status === "Active";
      const isAvailable = s.workStatus !== "Break" && s.workStatus !== "Off Shift";
      return isEngineer && isActive && isAvailable;
    });

    const matchSpecialization = (cat: string, spec?: string): boolean => {
      if (!spec) return false;
      const catLower = cat.toLowerCase();
      const specLower = spec.toLowerCase();
      if (catLower.includes("elect") && specLower === "electrical") return true;
      if (catLower.includes("plumb") && specLower === "plumbing") return true;
      if ((catLower.includes("ac") || catLower.includes("air cond") || catLower.includes("cooler") || catLower.includes("heating")) && specLower === "hvac") return true;
      if (catLower.includes("furn") && specLower === "carpentry") return true;
      if (catLower.includes("general") || catLower.includes("other") || specLower === "general") return true;
      return false;
    };

    return candidateEngineers.slice().sort((a, b) => {
      const jobsA = a.activeJobs || 0;
      const jobsB = b.activeJobs || 0;
      if (jobsA !== jobsB) return jobsA - jobsB;

      const floorMatchA = (a.currentFloor && targetFloor && a.currentFloor.toLowerCase() === targetFloor.toLowerCase()) ? 1 : 0;
      const floorMatchB = (b.currentFloor && targetFloor && b.currentFloor.toLowerCase() === targetFloor.toLowerCase()) ? 1 : 0;
      if (floorMatchA !== floorMatchB) {
        return floorMatchB - floorMatchA;
      }

      const specMatchA = matchSpecialization(selectedCategory, a.specialization) ? 1 : 0;
      const specMatchB = matchSpecialization(selectedCategory, b.specialization) ? 1 : 0;
      if (specMatchA !== specMatchB) {
        return specMatchB - specMatchA;
      }

      const timeA = a.lastAssignedTime ? new Date(a.lastAssignedTime).getTime() : 0;
      const timeB = b.lastAssignedTime ? new Date(b.lastAssignedTime).getTime() : 0;
      return timeA - timeB;
    });
  }, [staff, rooms, roomNo, selectedCategory]);

  const selectedRequest = useMemo(() => {
    return maintenance.find((r) => r.id === selectedReqId);
  }, [maintenance, selectedReqId]);

  const selectedCategoryFromProblem = useMemo(() => {
    if (!selectedRequest) return "Others";
    const parts = selectedRequest.problem.split(" — ");
    return parts[0] || "Others";
  }, [selectedRequest]);

  const selectedReqRecommendedEngineer = useMemo(() => {
    if (!selectedRequest) return null;
    const targetRoomObj = rooms.find((r) => r.roomNo === selectedRequest.room);
    const targetFloor = targetRoomObj?.floor || "1st Floor";
    return getSmartEngineerRecommendation(staff, targetFloor, selectedCategoryFromProblem);
  }, [selectedRequest, rooms, staff, selectedCategoryFromProblem]);

  const selectedReqSortedEngineerList = useMemo(() => {
    if (!selectedRequest) return [];
    const targetRoomObj = rooms.find((r) => r.roomNo === selectedRequest.room);
    const targetFloor = targetRoomObj?.floor || "1st Floor";
    
    const candidateEngineers = staff.filter((s) => {
      const isEngineer = s.role === "Engineer";
      const isActive = s.status === "Active";
      const isAvailable = s.workStatus !== "Break" && s.workStatus !== "Off Shift";
      return isEngineer && isActive && isAvailable;
    });

    const matchSpecialization = (cat: string, spec?: string): boolean => {
      if (!spec) return false;
      const catLower = cat.toLowerCase();
      const specLower = spec.toLowerCase();
      if (catLower.includes("elect") && specLower === "electrical") return true;
      if (catLower.includes("plumb") && specLower === "plumbing") return true;
      if ((catLower.includes("ac") || catLower.includes("air cond") || catLower.includes("cooler") || catLower.includes("heating")) && specLower === "hvac") return true;
      if (catLower.includes("furn") && specLower === "carpentry") return true;
      if (catLower.includes("general") || catLower.includes("other") || specLower === "general") return true;
      return false;
    };

    return candidateEngineers.slice().sort((a, b) => {
      const jobsA = a.activeJobs || 0;
      const jobsB = b.activeJobs || 0;
      if (jobsA !== jobsB) return jobsA - jobsB;

      const floorMatchA = (a.currentFloor && targetFloor && a.currentFloor.toLowerCase() === targetFloor.toLowerCase()) ? 1 : 0;
      const floorMatchB = (b.currentFloor && targetFloor && b.currentFloor.toLowerCase() === targetFloor.toLowerCase()) ? 1 : 0;
      if (floorMatchA !== floorMatchB) {
        return floorMatchB - floorMatchA;
      }

      const specMatchA = matchSpecialization(selectedCategoryFromProblem, a.specialization) ? 1 : 0;
      const specMatchB = matchSpecialization(selectedCategoryFromProblem, b.specialization) ? 1 : 0;
      if (specMatchA !== specMatchB) {
        return specMatchB - specMatchA;
      }

      const timeA = a.lastAssignedTime ? new Date(a.lastAssignedTime).getTime() : 0;
      const timeB = b.lastAssignedTime ? new Date(b.lastAssignedTime).getTime() : 0;
      return timeA - timeB;
    });
  }, [selectedRequest, staff, rooms, selectedCategoryFromProblem]);

  useEffect(() => {
    if (assignmentMode === "Auto" && recommendedEngineerObj) {
      setChosenEngineer(recommendedEngineerObj.name);
    }
  }, [recommendedEngineerObj, assignmentMode]);

  useEffect(() => {
    if (assignOpen && assignmentMode === "Auto" && selectedReqRecommendedEngineer) {
      setChosenEngineer(selectedReqRecommendedEngineer.name);
    }
  }, [selectedReqRecommendedEngineer, assignmentMode, assignOpen]);

  const handleOpenAssign = (id: string) => {
    setSelectedReqId(id);
    const req = maintenance.find((r) => r.id === id);
    setReassignReason("");
    setAssignmentMode("Auto");

    const categoryFromProblem = req ? req.problem.split(" — ")[0] : "Others";
    const targetRoomObj = rooms.find((r) => r.roomNo === req?.room);
    const targetFloor = targetRoomObj?.floor || "1st Floor";
    const recommended = getSmartEngineerRecommendation(staff, targetFloor, categoryFromProblem);
    setChosenEngineer(recommended?.name || "");

    setAssignOpen(true);
  };

  const handleSaveRequest = () => {
    addMaintenanceRequest({
      room: roomNo,
      problem: `${selectedCategory} — ${description}`,
      priority,
      engineer: chosenEngineer || "—",
      assignmentType: assignmentMode,
      estimatedCompletion,
      attachments: uploadedFiles,
    });
    setCreateOpen(false);
    setDescription("");
    setUploadedFiles([]);
  };

  const handleSaveAssignment = () => {
    if (!selectedReqId) return;
    assignMaintenanceRequest(selectedReqId, chosenEngineer, assignmentMode, reassignReason);
    setAssignOpen(false);
  };

  const handleStartRepair = (id: string) => {
    startMaintenanceRepair(id);
  };

  const handleMarkComplete = (id: string) => {
    completeMaintenanceRequest(id);
  };

  const handleVerify = (id: string) => {
    verifyMaintenanceRequest(id);
  };

  const isSupervisor = currentUserRole === "Executive Housekeeper" || currentUserRole === "Supervisor";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Operations</span>
          <h1 className="mt-1 text-2xl font-bold text-slate-800">Maintenance & Engineering</h1>
          <p className="text-sm text-slate-500 font-normal">
            Track and process room repairs. High-priority maintenance blocks rooms (Out of Order) in real time.
          </p>
        </div>
        <Button
          onClick={() => {
            setCreateOpen(true);
            setAssignmentMode("Auto");
            if (recommendedEngineerObj) {
              setChosenEngineer(recommendedEngineerObj.name);
            }
          }}
          className="bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Report Issue
        </Button>
      </div>

      {/* Standard Operations Toolbar */}
      <OperationsToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search room, problem category, or engineer…"
        activeFilterCount={filterStatus !== "all" ? 1 : 0}
        onOpenFilters={() => setFilterDrawerOpen(true)}
        statusTabs={[
          { id: "all", label: "All" },
          { id: "Open", label: "Open" },
          { id: "Assigned", label: "Assigned" },
          { id: "In Progress", label: "In Progress" },
          { id: "Awaiting Verification", label: "Awaiting Verification" },
          { id: "Closed", label: "Closed" },
          { id: "High", label: "High" },
          { id: "Critical", label: "Critical" },
          { id: "Electrical", label: "Electrical" },
          { id: "Plumbing", label: "Plumbing" },
          { id: "HVAC", label: "HVAC" },
          { id: "My Jobs", label: "My Jobs" },
        ]}
        activeStatusTab={selectedPill}
        onStatusTabChange={setSelectedPill}
      />

      {/* Slide-over Filter Drawer */}
      <OperationsFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        title="Filter Maintenance Work Orders"
        activeFilterCount={filterStatus !== "all" ? 1 : 0}
        onReset={() => setFilterStatus("all")}
      >
        <div className="space-y-4 select-none">
          <FormField label="Filter by Work Order Status">
            <SelectInput
              value={filterStatus}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Awaiting Verification">Awaiting Verification</option>
              <option value="Closed">Closed</option>
              <option value="Cancelled">Cancelled</option>
            </SelectInput>
          </FormField>
        </div>
      </OperationsFilterDrawer>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {filteredMaint.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No work orders match your filters.</p>
        ) : (
          filteredMaint.map((m, idx) => {
            const isOpen = m.status === "Open";
            const isAssigned = m.status === "Assigned";
            const isProgress = m.status === "In Progress";
            const isAwaiting = m.status === "Awaiting Verification";
            const isClosed = m.status === "Closed";
            return (
              <div
                key={`${m.id}-${idx}-m`}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800">Room {m.room}</p>
                    <p className="text-[11px] text-slate-500 font-semibold">{m.id}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase",
                      m.status === "Closed"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : m.status === "Awaiting Verification"
                        ? "bg-purple-50 text-purple-700 border border-purple-100"
                        : m.status === "In Progress"
                        ? "bg-amber-50 text-amber-700 border border-amber-100"
                        : m.status === "Assigned"
                        ? "bg-blue-50 text-blue-700 border border-blue-100"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                    )}
                  >
                    {m.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-700 font-medium line-clamp-2">{m.problem}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
                      m.priority === "Critical"
                        ? "bg-red-100 text-red-700 border border-red-200"
                        : m.priority === "High"
                        ? "bg-red-50 text-red-700 border border-red-100"
                        : m.priority === "Medium"
                        ? "bg-amber-50 text-amber-700 border border-amber-100"
                        : "bg-slate-100 text-slate-700"
                    )}
                  >
                    {m.priority}
                  </span>
                  <span>{m.engineer || "Unassigned"}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {isOpen && (
                    <Button
                      variant="outline"
                      onClick={() => handleOpenAssign(m.id)}
                      className="py-1.5 px-3 text-[11px] font-semibold text-slate-700 border-slate-200"
                    >
                      Assign
                    </Button>
                  )}
                  {isAssigned && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleOpenAssign(m.id)}
                        className="py-1.5 px-3 text-[11px] font-semibold text-slate-700 border-slate-200"
                      >
                        Reassign
                      </Button>
                      <Button
                        onClick={() => handleStartRepair(m.id)}
                        className="py-1.5 px-3 text-[11px] font-semibold bg-emerald-700 hover:bg-emerald-800 text-white"
                      >
                        Start Repair
                      </Button>
                    </>
                  )}
                  {isProgress && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleOpenAssign(m.id)}
                        className="py-1.5 px-3 text-[11px] font-semibold text-slate-700 border-slate-200"
                      >
                        Reassign
                      </Button>
                      <Button
                        onClick={() => handleMarkComplete(m.id)}
                        className="py-1.5 px-3 text-[11px] font-semibold bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        Complete
                      </Button>
                    </>
                  )}
                  {isAwaiting && (
                    <Button
                      onClick={() => handleVerify(m.id)}
                      disabled={!isSupervisor}
                      className="py-1.5 px-3 text-[11px] font-semibold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1"
                    >
                      <ShieldCheck className="h-3 w-3" /> Verify & Close
                    </Button>
                  )}
                  {isClosed && (
                    <span className="text-[11px] text-slate-400 font-semibold">Completed ✓</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3">ID</th>
              <th className="px-5 py-3">Room</th>
              <th className="px-5 py-3">Issue Details</th>
              <th className="px-5 py-3">Priority</th>
              <th className="px-5 py-3">Engineer</th>
              <th className="px-5 py-3">Assigned At</th>
              <th className="px-5 py-3">Started At</th>
              <th className="px-5 py-3">Completed At</th>
              <th className="px-5 py-3">Est. Completion</th>
              <th className="px-5 py-3">Actual Completion</th>
              <th className="px-5 py-3">Assign Type</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
            {filteredMaint.map((m, idx) => {
              const isOpen = m.status === "Open";
              const isAssigned = m.status === "Assigned";
              const isProgress = m.status === "In Progress";
              const isAwaiting = m.status === "Awaiting Verification";
              const isClosed = m.status === "Closed";

              return (
                <tr key={`${m.id}-${idx}`} className="hover:bg-slate-50/50">
                  <td className="px-5 py-4 font-semibold text-slate-500">{m.id}</td>
                  <td className="px-5 py-4 font-bold text-slate-800">Room {m.room}</td>
                  <td className="px-5 py-4 text-slate-700 font-medium max-w-xs truncate">{m.problem}</td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
                        m.priority === "Critical"
                          ? "bg-red-100 text-red-700 border border-red-200 font-extrabold animate-pulse"
                          : m.priority === "High"
                          ? "bg-red-50 text-red-650 border border-red-100"
                          : m.priority === "Medium"
                          ? "bg-amber-50 text-amber-700 border border-amber-100"
                          : "bg-slate-100 text-slate-700"
                      )}
                    >
                      {m.priority}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600 font-semibold">{m.engineer || "—"}</td>
                  <td className="px-5 py-4 text-slate-400 font-normal">{m.assignedAt || "—"}</td>
                  <td className="px-5 py-4 text-slate-400 font-normal">{m.startedAt || "—"}</td>
                  <td className="px-5 py-4 text-slate-400 font-normal">{m.completedAt || "—"}</td>
                  <td className="px-5 py-4 text-slate-400 font-normal">{m.estimatedCompletion || "—"}</td>
                  <td className="px-5 py-4 text-slate-400 font-normal">{m.actualCompletion || "—"}</td>
                  <td className="px-5 py-4 font-normal">
                    {m.assignmentType ? (
                      <span className="rounded-full bg-slate-105 border border-slate-200 px-2 py-0.5 text-[9px] font-bold text-slate-700 uppercase bg-slate-100">
                        {m.assignmentType}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase",
                        m.status === "Closed"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : m.status === "Awaiting Verification"
                          ? "bg-purple-50 text-purple-700 border border-purple-100 animate-pulse"
                          : m.status === "In Progress"
                          ? "bg-amber-50 text-amber-700 border border-amber-100"
                          : m.status === "Assigned"
                          ? "bg-blue-50 text-blue-700 border border-blue-100"
                          : m.status === "Cancelled"
                          ? "bg-red-50 text-red-700 border border-red-100"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      )}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                    {isOpen && (
                      <Button
                        variant="outline"
                        onClick={() => handleOpenAssign(m.id)}
                        className="py-1 px-2.5 text-[10px] font-semibold text-slate-700 border-slate-200"
                      >
                        Assign Engineer
                      </Button>
                    )}
                    {isAssigned && (
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          onClick={() => handleOpenAssign(m.id)}
                          className="py-1 px-2.5 text-[10px] font-semibold text-slate-700 border-slate-200"
                        >
                          Reassign Staff
                        </Button>
                        <Button
                          onClick={() => handleStartRepair(m.id)}
                          className="py-1 px-2.5 text-[10px] font-semibold bg-emerald-700 hover:bg-emerald-800 text-white"
                        >
                          Start Repair
                        </Button>
                      </div>
                    )}
                    {isProgress && (
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          onClick={() => handleOpenAssign(m.id)}
                          className="py-1 px-2.5 text-[10px] font-semibold text-slate-700 border-slate-200"
                        >
                          Reassign Staff
                        </Button>
                        <Button
                          onClick={() => handleMarkComplete(m.id)}
                          className="py-1 px-2.5 text-[10px] font-semibold bg-amber-600 hover:bg-amber-700 text-white"
                        >
                          Complete Repair
                        </Button>
                      </div>
                    )}
                    {isAwaiting && (
                      <Button
                        onClick={() => handleVerify(m.id)}
                        disabled={!isSupervisor}
                        title={!isSupervisor ? "Only Housekeeping Supervisor can verify and release rooms" : ""}
                        className="py-1 px-2.5 text-[10px] font-semibold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1 inline-flex"
                      >
                        <ShieldCheck className="h-3 w-3" /> Verify & Close
                      </Button>
                    )}
                    {isClosed && (
                      <Button
                        disabled
                        className="py-1 px-2.5 text-[10px] font-semibold bg-slate-100 text-slate-400 border border-slate-200"
                      >
                        Completed ✓
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Drawer: Report Issue */}
      <Drawer open={createOpen} onClose={() => setCreateOpen(false)} title="Report Maintenance Issue">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Room Number" required>
              <TextInput value={roomNo} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoomNo(e.target.value)} />
            </FormField>
            <FormField label="Category" required>
              <SelectInput value={selectedCategory} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCategory(e.target.value)}>
                {MAINTENANCE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </SelectInput>
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Priority / Urgency" required>
              <SelectInput value={priority} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPriority(e.target.value as any)}>
                <option value="Low">Low (OOS minor hold)</option>
                <option value="Medium">Medium (OOS minor hold)</option>
                <option value="High">High (OOO blocks sale)</option>
                <option value="Critical">Critical (OOO blocks sale)</option>
              </SelectInput>
            </FormField>

            <FormField label="Est. Completion Time" required>
              <SelectInput value={estimatedCompletion} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEstimatedCompletion(e.target.value)}>
                <option value="1 Hour">1 Hour</option>
                <option value="2 Hours">2 Hours</option>
                <option value="4 Hours">4 Hours</option>
                <option value="24 Hours">24 Hours</option>
              </SelectInput>
            </FormField>
          </div>

          <FormField label="Problem Description" required>
            <TextAreaInput
              placeholder="e.g. Toilet is leaking water from the tank side flush handle."
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            />
          </FormField>

          {/* Photo/File Attachment Upload Section */}
          <div className="space-y-2">
            <label className="text-[10px] text-slate-400 font-bold uppercase block">Attachments (Images, PDF, Videos)</label>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setUploadedFiles(prev => [...prev, { name: "defect_photo.png", type: "image", url: "/defect_photo.png" }]);
                }}
                className="text-xs h-8.5 font-semibold py-1.5"
              >
                + Upload Image
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setUploadedFiles(prev => [...prev, { name: "leak_video.mp4", type: "video", url: "/leak_video.mp4" }]);
                }}
                className="text-xs h-8.5 font-semibold py-1.5"
              >
                + Upload Video
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setUploadedFiles(prev => [...prev, { name: "wiring_spec.pdf", type: "pdf", url: "/wiring_spec.pdf" }]);
                }}
                className="text-xs h-8.5 font-semibold py-1.5"
              >
                + Upload PDF
              </Button>
            </div>
            {uploadedFiles.length > 0 && (
              <div className="space-y-1.5 mt-1 text-xs">
                {uploadedFiles.map((file, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="font-semibold text-slate-700">{file.name} ({file.type.toUpperCase()})</span>
                    <button
                      type="button"
                      onClick={() => setUploadedFiles(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-red-500 hover:text-red-700 font-bold text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Engineer Assignment Section inside Create Drawer */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Engineer Assignment</span>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={assignmentMode === "Auto" ? "primary" : "outline"}
                onClick={() => {
                  setAssignmentMode("Auto");
                  if (recommendedEngineerObj) {
                    setChosenEngineer(recommendedEngineerObj.name);
                  }
                }}
                className="text-xs font-semibold py-1.5 h-8.5"
              >
                Auto Assign
              </Button>
              <Button
                type="button"
                variant={assignmentMode === "Manual" ? "primary" : "outline"}
                onClick={() => setAssignmentMode("Manual")}
                className="text-xs font-semibold py-1.5 h-8.5"
              >
                Choose Manually
              </Button>
            </div>

            {assignmentMode === "Auto" ? (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/20 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Recommended Engineer</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-extrabold text-emerald-800 uppercase">
                    Auto Assigned
                  </span>
                </div>
                {recommendedEngineerObj ? (
                  <div className="space-y-1.5 text-xs">
                    <p className="font-bold text-slate-800 text-sm">{recommendedEngineerObj.name}</p>
                    <div className="flex flex-wrap items-center gap-4 text-slate-500 font-semibold">
                      <span><strong>Active Jobs:</strong> {recommendedEngineerObj.activeJobs || 0}</span>
                      <span><strong>Floor:</strong> {recommendedEngineerObj.currentFloor || "—"}</span>
                      <span><strong>Specialization:</strong> {recommendedEngineerObj.specialization || "General"}</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-bold block mt-1">
                      ✓ Recommended based on lowest workload and specialization match.
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">No active/available engineers found.</span>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Select Engineer (Sorted by Rank)</label>
                <select
                  value={chosenEngineer}
                  onChange={(e) => setChosenEngineer(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                >
                  <option value="">Select Engineer...</option>
                  {sortedEngineerList.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.specialization || "General"} | Floor: {s.currentFloor || "—"} | Jobs: {s.activeJobs || 0} | Last: {formatTimeAgo(s.lastAssignment)})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <Button
            onClick={handleSaveRequest}
            disabled={!chosenEngineer}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center gap-1 h-10 text-sm font-semibold rounded-lg mt-4"
          >
            Create Work Order
          </Button>
        </div>
      </Drawer>

      {/* Drawer: Assign Engineer / Reassign Engineer */}
      <Drawer
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title={selectedRequest?.engineer && selectedRequest.engineer !== "—" ? "Reassign Engineer" : "Assign Maintenance Engineer"}
      >
        {selectedRequest && (
          <div className="space-y-4">
            {/* Current Engineer Block */}
            {selectedRequest.engineer && selectedRequest.engineer !== "—" && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Current Engineer</span>
                <p className="font-bold text-slate-800">{selectedRequest.engineer}</p>
              </div>
            )}

            {/* Assignment Mode selection */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Assignment Mode</span>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={assignmentMode === "Auto" ? "primary" : "outline"}
                  onClick={() => {
                    setAssignmentMode("Auto");
                    if (selectedReqRecommendedEngineer) {
                      setChosenEngineer(selectedReqRecommendedEngineer.name);
                    }
                  }}
                  className="text-xs font-semibold py-1.5 h-8.5"
                >
                  Auto Assign
                </Button>
                <Button
                  type="button"
                  variant={assignmentMode === "Manual" ? "primary" : "outline"}
                  onClick={() => setAssignmentMode("Manual")}
                  className="text-xs font-semibold py-1.5 h-8.5"
                >
                  Choose Manually
                </Button>
              </div>
            </div>

            {/* Recommended / Manual block */}
            {assignmentMode === "Auto" ? (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/20 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Recommended Engineer</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-extrabold text-emerald-800 uppercase">
                    Auto Assigned
                  </span>
                </div>
                {selectedReqRecommendedEngineer ? (
                  <div className="space-y-1.5 text-xs">
                    <p className="font-bold text-slate-800 text-sm">{selectedReqRecommendedEngineer.name}</p>
                    <div className="flex flex-wrap items-center gap-4 text-slate-500 font-semibold">
                      <span><strong>Active Jobs:</strong> {selectedReqRecommendedEngineer.activeJobs || 0}</span>
                      <span><strong>Floor:</strong> {selectedReqRecommendedEngineer.currentFloor || "—"}</span>
                      <span><strong>Specialization:</strong> {selectedReqRecommendedEngineer.specialization || "General"}</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-bold block mt-1">
                      ✓ Recommended based on lowest workload and specialization match.
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">No engineers available.</span>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Select Engineer (Sorted by Rank)</label>
                <select
                  value={chosenEngineer}
                  onChange={(e) => setChosenEngineer(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                >
                  <option value="">Select Engineer...</option>
                  {selectedReqSortedEngineerList.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.specialization || "General"} | Floor: {s.currentFloor || "—"} | Jobs: {s.activeJobs || 0} | Last: {formatTimeAgo(s.lastAssignment)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Reassign Reason (Only for Reassignments) */}
            {selectedRequest.engineer && selectedRequest.engineer !== "—" && (
              <FormField label="Reassignment Reason">
                <TextInput
                  placeholder="e.g. Specialization match or shift changed"
                  value={reassignReason}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReassignReason(e.target.value)}
                />
              </FormField>
            )}

            {/* Assignment History Accordion/Section */}
            {selectedRequest.assignmentHistory && selectedRequest.assignmentHistory.length > 0 && (
              <div className="rounded-xl border border-slate-100 bg-white p-3 space-y-2 text-xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase block border-b border-slate-50 pb-1">
                  Assignment History
                </span>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                  {selectedRequest.assignmentHistory.map((h, idx) => (
                    <div key={idx} className="border-b border-slate-50 last:border-b-0 pb-1.5 last:pb-0">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-slate-700">{h.action}</span>
                        <span className="text-slate-400 font-normal">{h.timestamp}</span>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        By {h.by} {h.reason && `• Reason: ${h.reason}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handleSaveAssignment}
              disabled={!chosenEngineer}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center h-10 text-sm font-semibold rounded-lg mt-2"
            >
              {selectedRequest.engineer && selectedRequest.engineer !== "—" ? "Reassign Engineer" : "Assign Engineer"}
            </Button>
          </div>
        )}
      </Drawer>
    </div>
  );
}
