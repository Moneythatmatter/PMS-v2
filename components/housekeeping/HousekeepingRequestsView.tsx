"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useHousekeeping } from "@/components/housekeeping/HousekeepingContext";
import { Sparkles, Bell, Clock, CheckCircle2, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { TextInput, SelectInput, FormField, TextAreaInput } from "@/components/frontoffice/ui";
import { getSmartStaffRecommendation } from "@/components/housekeeping/HousekeepingActions";
import { OperationsToolbar, OperationsFilterDrawer } from "@/components/housekeeping/OperationsToolbar";

const REQUEST_ITEMS = [
  "Extra Towels",
  "Extra Pillows",
  "Extra Blanket",
  "Water Bottles",
  "Toiletries Kit",
  "Tea & Coffee Sachets",
  "Baby Cot",
  "Hair Dryer",
  "Minibar Refill",
  "Room Cleaning (On-Demand)",
  "Iron & Ironing Board",
];

export function HousekeepingRequestsView() {
  const {
    requests,
    staff,
    rooms,
    addHKRequest,
    assignHKRequest,
    completeHKRequest,
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
  const [roomNo, setRoomNo] = useState("102");
  const [guestName, setGuestName] = useState("James Wilson");
  const [selectedItem, setSelectedItem] = useState(REQUEST_ITEMS[0]);
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [remarks, setRemarks] = useState("");

  // Assignment states
  const [assignmentMode, setAssignmentMode] = useState<"Auto" | "Manual">("Auto");
  const [chosenStaff, setChosenStaff] = useState("");
  const [reassignReason, setReassignReason] = useState("");

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

  const formatDisplayDate = (req: { createdAt: string; createdAtLabel?: string }) => {
    if (req.createdAtLabel) return req.createdAtLabel;
    if (!req.createdAt) return "";
    if (req.createdAt.includes("T")) {
      try {
        return new Date(req.createdAt).toLocaleString("en-IN", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      } catch {
        return req.createdAt;
      }
    }
    return req.createdAt;
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchSearch =
        r.room.includes(search) ||
        r.guest.toLowerCase().includes(search.toLowerCase()) ||
        r.issue.toLowerCase().includes(search.toLowerCase());
      
      const matchStatus = filterStatus === "all" || r.status === filterStatus;
      
      let matchPill = true;
      if (selectedPill === "Open") matchPill = r.status === "Open";
      else if (selectedPill === "Assigned") matchPill = r.assignedStaff !== "—" && r.status !== "Completed";
      else if (selectedPill === "In Progress") matchPill = r.status === "In Progress";
      else if (selectedPill === "Completed") matchPill = r.status === "Completed";
      else if (selectedPill === "High") matchPill = r.priority === "High";
      else if (selectedPill === "Medium") matchPill = r.priority === "Medium";
      else if (selectedPill === "Low") matchPill = r.priority === "Low";
      else if (selectedPill === "Auto") matchPill = r.assignmentType === "Auto";
      else if (selectedPill === "Manual") matchPill = r.assignmentType === "Manual";
      else if (selectedPill === "My Requests") matchPill = r.assignedStaff === currentUsername;

      return matchSearch && matchStatus && matchPill;
    });
  }, [requests, search, filterStatus, selectedPill, currentUsername]);

  const recommendedStaffObj = useMemo(() => {
    const targetRoom = rooms.find((r) => r.roomNo === roomNo);
    const targetFloor = targetRoom?.floor || "1st Floor";
    return getSmartStaffRecommendation(staff, targetFloor);
  }, [rooms, staff, roomNo]);

  const sortedStaffList = useMemo(() => {
    const targetRoom = rooms.find((r) => r.roomNo === roomNo);
    const targetFloor = targetRoom?.floor || "1st Floor";
    
    const candidateStaff = staff.filter((s) => {
      const isHousekeeper = s.role === "Housekeeper";
      const isActive = s.status === "Active";
      const isAvailable = s.workStatus !== "Break" && s.workStatus !== "Off Shift";
      return isHousekeeper && isActive && isAvailable;
    });

    return candidateStaff.slice().sort((a, b) => {
      const tasksA = a.activeTaskCount || 0;
      const tasksB = b.activeTaskCount || 0;
      if (tasksA !== tasksB) return tasksA - tasksB;

      const floorMatchA = (a.currentFloor && targetFloor && a.currentFloor.toLowerCase() === targetFloor.toLowerCase()) ? 1 : 0;
      const floorMatchB = (b.currentFloor && targetFloor && b.currentFloor.toLowerCase() === targetFloor.toLowerCase()) ? 1 : 0;
      if (floorMatchA !== floorMatchB) {
        return floorMatchB - floorMatchA;
      }

      const timeA = a.lastAssignedTime ? new Date(a.lastAssignedTime).getTime() : 0;
      const timeB = b.lastAssignedTime ? new Date(b.lastAssignedTime).getTime() : 0;
      return timeA - timeB;
    });
  }, [staff, rooms, roomNo]);

  const selectedRequest = useMemo(() => {
    return requests.find((r) => r.id === selectedReqId);
  }, [requests, selectedReqId]);

  const selectedReqRecommendedStaff = useMemo(() => {
    if (!selectedRequest) return null;
    const targetRoom = rooms.find((r) => r.roomNo === selectedRequest.room);
    const targetFloor = targetRoom?.floor || "1st Floor";
    return getSmartStaffRecommendation(staff, targetFloor);
  }, [selectedRequest, rooms, staff]);

  const selectedReqSortedStaffList = useMemo(() => {
    if (!selectedRequest) return [];
    const targetRoom = rooms.find((r) => r.roomNo === selectedRequest.room);
    const targetFloor = targetRoom?.floor || "1st Floor";
    
    const candidateStaff = staff.filter((s) => {
      const isHousekeeper = s.role === "Housekeeper";
      const isActive = s.status === "Active";
      const isAvailable = s.workStatus !== "Break" && s.workStatus !== "Off Shift";
      return isHousekeeper && isActive && isAvailable;
    });

    return candidateStaff.slice().sort((a, b) => {
      const tasksA = a.activeTaskCount || 0;
      const tasksB = b.activeTaskCount || 0;
      if (tasksA !== tasksB) return tasksA - tasksB;

      const floorMatchA = (a.currentFloor && targetFloor && a.currentFloor.toLowerCase() === targetFloor.toLowerCase()) ? 1 : 0;
      const floorMatchB = (b.currentFloor && targetFloor && b.currentFloor.toLowerCase() === targetFloor.toLowerCase()) ? 1 : 0;
      if (floorMatchA !== floorMatchB) {
        return floorMatchB - floorMatchA;
      }

      const timeA = a.lastAssignedTime ? new Date(a.lastAssignedTime).getTime() : 0;
      const timeB = b.lastAssignedTime ? new Date(b.lastAssignedTime).getTime() : 0;
      return timeA - timeB;
    });
  }, [selectedRequest, staff, rooms]);

  useEffect(() => {
    if (assignmentMode === "Auto" && recommendedStaffObj) {
      setChosenStaff(recommendedStaffObj.name);
    }
  }, [recommendedStaffObj, assignmentMode]);

  useEffect(() => {
    if (assignOpen && assignmentMode === "Auto" && selectedReqRecommendedStaff) {
      setChosenStaff(selectedReqRecommendedStaff.name);
    }
  }, [selectedReqRecommendedStaff, assignmentMode, assignOpen]);

  const handleOpenAssign = (id: string) => {
    setSelectedReqId(id);
    const req = requests.find((r) => r.id === id);
    setReassignReason("");
    setAssignmentMode("Auto");
    
    const targetRoom = rooms.find((r) => r.roomNo === req?.room);
    const targetFloor = targetRoom?.floor || "1st Floor";
    const recommended = getSmartStaffRecommendation(staff, targetFloor);
    setChosenStaff(recommended?.name || "");
    
    setAssignOpen(true);
  };

  const handleSaveRequest = () => {
    addHKRequest({
      room: roomNo,
      guest: guestName,
      issue: selectedItem + (remarks ? ` (${remarks})` : ""),
      priority,
      assignedStaff: chosenStaff || "—",
      assignmentType: assignmentMode,
    });
    setCreateOpen(false);
    setRemarks("");
  };

  const handleSaveAssignment = () => {
    if (!selectedReqId) return;
    assignHKRequest(selectedReqId, chosenStaff, assignmentMode, reassignReason);
    setAssignOpen(false);
  };

  const handleMarkComplete = (id: string) => {
    completeHKRequest(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Operations</span>
          <h1 className="mt-1 text-2xl font-bold text-slate-800">Guest Services Requests</h1>
          <p className="text-sm text-slate-500 font-normal">
            Track and process guest requests for linen, towels, minibars, and toiletries.
          </p>
        </div>
        <Button
          onClick={() => {
            setCreateOpen(true);
            setAssignmentMode("Auto");
            if (recommendedStaffObj) {
              setChosenStaff(recommendedStaffObj.name);
            }
          }}
          className="bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> New Request
        </Button>
      </div>

      {/* Standard Operations Toolbar */}
      <OperationsToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search room, guest, or request item…"
        activeFilterCount={filterStatus !== "all" ? 1 : 0}
        onOpenFilters={() => setFilterDrawerOpen(true)}
        statusTabs={[
          { id: "all", label: "All" },
          { id: "Open", label: "Open" },
          { id: "Assigned", label: "Assigned" },
          { id: "In Progress", label: "In Progress" },
          { id: "Completed", label: "Completed" },
          { id: "High", label: "High Priority" },
          { id: "Medium", label: "Medium" },
          { id: "Low", label: "Low" },
          { id: "My Requests", label: "My Requests" },
        ]}
        activeStatusTab={selectedPill}
        onStatusTabChange={setSelectedPill}
      />

      {/* Slide-over Filter Drawer */}
      <OperationsFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        title="Filter Guest Requests"
        activeFilterCount={filterStatus !== "all" ? 1 : 0}
        onReset={() => setFilterStatus("all")}
      >
        <div className="space-y-4 select-none">
          <FormField label="Filter by Request Status">
            <SelectInput
              value={filterStatus}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="all">All Requests</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </SelectInput>
          </FormField>
        </div>
      </OperationsFilterDrawer>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {filteredRequests.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No requests match your filters.</p>
        ) : (
          filteredRequests.map((req) => {
            const isOpen = req.status === "Open";
            const isProgress = req.status === "In Progress";
            return (
              <div
                key={req.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800">Room {req.room}</p>
                    <p className="text-[11px] text-slate-500 font-semibold truncate">{req.guest}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase",
                      req.status === "Completed"
                        ? "bg-emerald-50 text-emerald-700"
                        : req.status === "In Progress"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-700"
                    )}
                  >
                    {req.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-700 font-medium line-clamp-2">{req.issue}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
                      req.priority === "High" ? "bg-red-50 text-red-700 border border-red-100" :
                      req.priority === "Medium" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                      "bg-slate-100 text-slate-700"
                    )}
                  >
                    {req.priority}
                  </span>
                  <span>{req.assignedStaff || "Unassigned"}</span>
                  <span>·</span>
                  <span>{formatDisplayDate(req)}</span>
                </div>
                {(isOpen || isProgress) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {isOpen && (
                      <Button
                        variant="outline"
                        onClick={() => handleOpenAssign(req.id)}
                        className="py-1.5 px-3 text-[11px] font-semibold text-slate-700 border-slate-200"
                      >
                        Assign
                      </Button>
                    )}
                    {isProgress && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => handleOpenAssign(req.id)}
                          className="py-1.5 px-3 text-[11px] font-semibold text-slate-700 border-slate-200"
                        >
                          Reassign
                        </Button>
                        <Button
                          onClick={() => handleMarkComplete(req.id)}
                          className="py-1.5 px-3 text-[11px] font-semibold bg-emerald-700 hover:bg-emerald-800 text-white"
                        >
                          Complete
                        </Button>
                      </>
                    )}
                  </div>
                )}
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
              <th className="px-5 py-3">Req ID</th>
              <th className="px-5 py-3">Room / Guest</th>
              <th className="px-5 py-3">Request Details</th>
              <th className="px-5 py-3">Priority</th>
              <th className="px-5 py-3">Assigned Staff</th>
              <th className="px-5 py-3">Logged At</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
            {filteredRequests.map((req) => {
              const isOpen = req.status === "Open";
              const isProgress = req.status === "In Progress";

              return (
                <tr key={req.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-4 font-semibold text-slate-500">{req.id}</td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-800">Room {req.room}</p>
                    <p className="text-[10px] text-slate-500 font-semibold">{req.guest}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-700 font-medium max-w-xs truncate">{req.issue}</td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
                        req.priority === "High" ? "bg-red-50 text-red-700 font-extrabold border border-red-100" :
                        req.priority === "Medium" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                        "bg-slate-105 text-slate-700 bg-slate-100"
                      )}
                    >
                      {req.priority}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600 font-semibold">
                    {req.assignedStaff || "—"}
                    {req.assignedStaff && req.assignedStaff !== "—" && req.assignmentType && (
                      <span className="block text-[8px] text-slate-400 font-normal">
                        {req.assignmentType === "Auto" ? "Auto Assigned" : "Manual Override"}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-400 font-normal">{formatDisplayDate(req)}</td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase",
                        req.status === "Completed"
                          ? "bg-emerald-50 text-emerald-700"
                          : req.status === "In Progress"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
                      )}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                    {isOpen && (
                      <Button
                        variant="outline"
                        onClick={() => handleOpenAssign(req.id)}
                        className="py-1 px-2.5 text-[10px] font-semibold text-slate-700 border-slate-200"
                      >
                        Assign
                      </Button>
                    )}
                    {isProgress && (
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          onClick={() => handleOpenAssign(req.id)}
                          className="py-1 px-2.5 text-[10px] font-semibold text-slate-700 border-slate-200"
                        >
                          Reassign Staff
                        </Button>
                        <Button
                          onClick={() => handleMarkComplete(req.id)}
                          className="py-1 px-2.5 text-[10px] font-semibold bg-emerald-700 hover:bg-emerald-800 text-white"
                        >
                          Complete
                        </Button>
                      </div>
                    )}
                    {req.status === "Completed" && <span className="text-[10px] text-slate-400">✓ Done</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Drawer: Create New Guest Request */}
      <Drawer open={createOpen} onClose={() => setCreateOpen(false)} title="Create Guest Request">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Room Number" required>
              <TextInput value={roomNo} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoomNo(e.target.value)} />
            </FormField>
            <FormField label="Guest Name" required>
              <TextInput value={guestName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGuestName(e.target.value)} />
            </FormField>
          </div>

          <FormField label="Item Requested" required>
            <SelectInput value={selectedItem} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedItem(e.target.value)}>
              {REQUEST_ITEMS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField label="Priority">
            <SelectInput value={priority} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPriority(e.target.value as any)}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </SelectInput>
          </FormField>

          <FormField label="Remarks / Quantity">
            <TextAreaInput
              placeholder="e.g. Needs 4 bottles. Guest requests fast service."
              value={remarks}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRemarks(e.target.value)}
            />
          </FormField>

          {/* Assignment Selection inside Create Drawer */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Assignment</span>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={assignmentMode === "Auto" ? "primary" : "outline"}
                onClick={() => {
                  setAssignmentMode("Auto");
                  if (recommendedStaffObj) {
                    setChosenStaff(recommendedStaffObj.name);
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
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Recommended Staff</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-extrabold text-emerald-800 uppercase">
                    Auto Assigned
                  </span>
                </div>
                {recommendedStaffObj ? (
                  <div className="space-y-1.5 text-xs">
                    <p className="font-bold text-slate-800 text-sm">{recommendedStaffObj.name}</p>
                    <div className="flex items-center gap-4 text-slate-500 font-semibold">
                      <span><strong>Floor:</strong> {recommendedStaffObj.currentFloor || "—"}</span>
                      <span><strong>Active Tasks:</strong> {recommendedStaffObj.activeTaskCount || 0}</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-bold block mt-1">
                      ✓ Recommended based on workload and floor.
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">No housekeepers available.</span>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Select Housekeeper (Sorted by Rank)</label>
                <select
                  value={chosenStaff}
                  onChange={(e) => setChosenStaff(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                >
                  <option value="">Select Staff...</option>
                  {sortedStaffList.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} (Floor: {s.currentFloor || "—"} | Tasks: {s.activeTaskCount || 0} | Last: {formatTimeAgo(s.lastAssignedTime)})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <Button
            onClick={handleSaveRequest}
            disabled={!chosenStaff}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center gap-1 h-10 text-sm font-semibold rounded-lg mt-4"
          >
            Create Work Request
          </Button>
        </div>
      </Drawer>

      {/* Drawer: Assign Staff / Reassign Staff */}
      <Drawer
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title={selectedRequest?.assignedStaff && selectedRequest.assignedStaff !== "—" ? "Reassign Staff" : "Assign Housekeeper Task"}
      >
        {selectedRequest && (
          <div className="space-y-4">
            {/* Current Staff Block */}
            {selectedRequest.assignedStaff && selectedRequest.assignedStaff !== "—" && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Current Staff</span>
                <p className="font-bold text-slate-800">{selectedRequest.assignedStaff}</p>
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
                    if (selectedReqRecommendedStaff) {
                      setChosenStaff(selectedReqRecommendedStaff.name);
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
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Recommended Staff</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-extrabold text-emerald-800 uppercase">
                    Auto Assigned
                  </span>
                </div>
                {selectedReqRecommendedStaff ? (
                  <div className="space-y-1.5 text-xs">
                    <p className="font-bold text-slate-800 text-sm">{selectedReqRecommendedStaff.name}</p>
                    <div className="flex items-center gap-4 text-slate-500 font-semibold">
                      <span><strong>Floor:</strong> {selectedReqRecommendedStaff.currentFloor || "—"}</span>
                      <span><strong>Active Tasks:</strong> {selectedReqRecommendedStaff.activeTaskCount || 0}</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-bold block mt-1">
                      ✓ Recommended based on workload and floor.
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">No housekeepers available.</span>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Select Housekeeper (Sorted by Rank)</label>
                <select
                  value={chosenStaff}
                  onChange={(e) => setChosenStaff(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                >
                  <option value="">Select Staff...</option>
                  {selectedReqSortedStaffList.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} (Floor: {s.currentFloor || "—"} | Tasks: {s.activeTaskCount || 0} | Last: {formatTimeAgo(s.lastAssignedTime)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Reassign Reason (Only for Reassignments) */}
            {selectedRequest.assignedStaff && selectedRequest.assignedStaff !== "—" && (
              <FormField label="Reassignment Reason" required>
                <TextInput
                  placeholder="e.g. VIP Room or Shift Change"
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
              disabled={!chosenStaff}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center h-10 text-sm font-semibold rounded-lg mt-2"
            >
              {selectedRequest.assignedStaff && selectedRequest.assignedStaff !== "—" ? "Reassign Housekeeper" : "Assign Housekeeper"}
            </Button>
          </div>
        )}
      </Drawer>
    </div>
  );
}
