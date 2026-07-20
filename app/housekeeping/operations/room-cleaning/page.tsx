"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useHousekeeping } from "@/components/housekeeping/HousekeepingContext";
import {
  Clock,
  Play,
  Pause,
  CheckCircle2,
  User,
  Sparkles,
  ClipboardList,
  Camera,
  Layers,
  AlertTriangle,
  Eye,
  Filter,
  Building2,
  BedDouble,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import {
  TextInput,
  SelectInput,
  FormField,
  FOPageHeader,
  StatMiniCard,
} from "@/components/frontoffice/ui";
import { OperationsToolbar, OperationsFilterDrawer } from "@/components/housekeeping/OperationsToolbar";

export default function RoomCleaningOperations() {
  const {
    rooms,
    staff,
    checklists,
    currentUserRole,
    startCleaning,
    pauseCleaning,
    resumeCleaning,
    completeCleaning,
    changeRoomStatus,
  } = useHousekeeping();

  const [search, setSearch] = useState("");
  const [floorFilter, setFloorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedRoomNo, setSelectedRoomNo] = useState<string | null>(null);
  const [assignee, setAssignee] = useState("");
  const [checklistId, setChecklistId] = useState("");
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Selected room details
  const selectedRoom = useMemo(() => {
    return rooms.find((r) => r.roomNo === selectedRoomNo) || null;
  }, [rooms, selectedRoomNo]);

  // Housekeepers list
  const housekeepers = useMemo(() => {
    return staff.filter((s) => s.role === "Housekeeper");
  }, [staff]);

  // Handle room click: Open Drawer
  const handleRoomClick = (roomNo: string) => {
    const rm = rooms.find((r) => r.roomNo === roomNo);
    if (!rm) return;
    setSelectedRoomNo(roomNo);
    setAssignee(rm.assignedStaff || (housekeepers[0]?.name ?? ""));
    
    // Choose appropriate checklist based on occupancy
    const preferredChecklist = checklists.find((c) =>
      rm.status.includes("Occupied")
        ? c.type === "Stay-over"
        : c.type === "Departure"
    );
    setChecklistId(preferredChecklist?.id || checklists[0]?.id || "");
    setCheckedItems([]);
    setUploadedPhotos(rm.photos || []);
  };

  // Filters and search logic
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const matchSearch =
        r.roomNo.includes(search) ||
        r.category.toLowerCase().includes(search.toLowerCase()) ||
        (r.assignedStaff && r.assignedStaff.toLowerCase().includes(search.toLowerCase()));

      const matchFloor = floorFilter === "all" || r.floor === floorFilter;
      
      let matchStatus = true;
      if (statusFilter === "dirty") {
        matchStatus = r.status.includes("Dirty");
      } else if (statusFilter === "cleaning") {
        matchStatus = r.status === "Cleaning";
      } else if (statusFilter === "inspection") {
        matchStatus = r.status === "Inspection Pending";
      } else if (statusFilter === "ready") {
        matchStatus = r.status === "Vacant Ready";
      } else if (statusFilter === "blocked") {
        matchStatus = r.status === "Blocked" || r.status === "Out of Order" || r.status === "Out of Service";
      }

      return matchSearch && matchFloor && matchStatus;
    });
  }, [rooms, search, floorFilter, statusFilter]);

  // Floor lists helper
  const uniqueFloors = useMemo(() => {
    return Array.from(new Set(rooms.map((r) => r.floor))).sort();
  }, [rooms]);

  // KPI stats computation
  const stats = useMemo(() => {
    const total = rooms.length;
    const dirty = rooms.filter((r) => r.status.includes("Dirty")).length;
    const cleaning = rooms.filter((r) => r.status === "Cleaning").length;
    const inspection = rooms.filter((r) => r.status === "Inspection Pending").length;
    const ready = rooms.filter((r) => r.status === "Vacant Ready").length;

    return { total, dirty, cleaning, inspection, ready };
  }, [rooms]);

  // Checklist items
  const activeChecklist = useMemo(() => {
    return checklists.find((c) => c.id === checklistId) || null;
  }, [checklists, checklistId]);

  // Progress Bar calculation
  const calculatedProgress = useMemo(() => {
    if (!activeChecklist || activeChecklist.items.length === 0) return 0;
    return Math.floor((checkedItems.length / activeChecklist.items.length) * 100);
  }, [activeChecklist, checkedItems]);

  const handleCheckboxChange = (item: string) => {
    setCheckedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  // Simulated photo upload
  const triggerPhotoUpload = () => {
    const urls = [
      "/evidence-bed.jpg",
      "/evidence-bathroom.jpg",
      "/evidence-desk.jpg",
    ];
    const randomUrl = urls[Math.floor(Math.random() * urls.length)];
    setUploadedPhotos((prev) => [...prev, randomUrl]);
  };

  // Timer Tick Format helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-5">
      <FOPageHeader
        eyebrow="Operations"
        title="Room Cleaning Queue"
        description="Track active cleaning assignments and timing checklists."
        badge={
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-650">
            <BedDouble className="h-4 w-4 text-emerald-600 animate-pulse" />
            {stats.cleaning} in progress
          </div>
        }
        action={
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "primary" : "outline"}
              onClick={() => setViewMode("grid")}
              className="px-3"
            >
              Grid
            </Button>
            <Button
              variant={viewMode === "list" ? "primary" : "outline"}
              onClick={() => setViewMode("list")}
              className="px-3"
            >
              List
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatMiniCard label="Total Rooms" value={stats.total} icon={Building2} accent="#64748b" />
        <StatMiniCard label="Dirty" value={stats.dirty} accent="#ef4444" icon={AlertTriangle} />
        <StatMiniCard label="Cleaning" value={stats.cleaning} accent="#f59e0b" icon={Sparkles} />
        <StatMiniCard label="Awaiting Inspection" value={stats.inspection} accent="#3b82f6" icon={ClipboardList} />
        <StatMiniCard label="Vacant Ready" value={stats.ready} accent="#10b981" icon={CheckCircle2} />
      </div>

      {/* Standard Operations Toolbar */}
      <OperationsToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search room, category, staff…"
        activeFilterCount={floorFilter !== "all" ? 1 : 0}
        onOpenFilters={() => setFilterDrawerOpen(true)}
        statusTabs={[
          { id: "all", label: "All" },
          { id: "dirty", label: "Dirty" },
          { id: "cleaning", label: "Cleaning" },
          { id: "inspection", label: "Inspection Pending" },
          { id: "ready", label: "Vacant Ready" },
          { id: "blocked", label: "Blocked / OOO" },
        ]}
        activeStatusTab={statusFilter}
        onStatusTabChange={setStatusFilter}
      />

      {/* Slide-over Filter Drawer */}
      <OperationsFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        title="Filter Room Cleaning Queue"
        activeFilterCount={floorFilter !== "all" ? 1 : 0}
        onReset={() => setFloorFilter("all")}
      >
        <div className="space-y-4 select-none">
          <FormField label="Filter by Floor">
            <SelectInput
              value={floorFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFloorFilter(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="all">All Floors</option>
              {uniqueFloors.map((fl) => (
                <option key={fl} value={fl}>
                  {fl}
                </option>
              ))}
            </SelectInput>
          </FormField>
        </div>
      </OperationsFilterDrawer>

      {/* Main Grid View */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredRooms.map((room) => {
            const isCleaning = room.status === "Cleaning";
            const isPendingInspect = room.status === "Inspection Pending";
            const isDirty = room.status.includes("Dirty");
            const isReady = room.status === "Vacant Ready";
            const isBlocked =
              room.status === "Blocked" ||
              room.status === "Out of Order" ||
              room.status === "Out of Service";

            return (
              <div
                key={room.roomNo}
                onClick={() => handleRoomClick(room.roomNo)}
                className={cn(
                  "cursor-pointer rounded-2xl border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md",
                  isCleaning
                    ? "border-amber-200 ring-2 ring-amber-100/50 bg-amber-50/5"
                    : isPendingInspect
                    ? "border-blue-200 bg-blue-50/5"
                    : isDirty
                    ? "border-red-200"
                    : isReady
                    ? "border-emerald-200"
                    : "border-slate-200"
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Room {room.roomNo}</h3>
                    <p className="text-xs text-slate-500 font-medium">{room.category}</p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                      isReady
                        ? "bg-emerald-50 text-emerald-700"
                        : isDirty
                        ? "bg-red-50 text-red-700"
                        : isCleaning
                        ? "bg-amber-50 text-amber-700 animate-pulse"
                        : isPendingInspect
                        ? "bg-blue-50 text-blue-700"
                        : "bg-slate-100 text-slate-700"
                    )}
                  >
                    {room.status}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{room.assignedStaff || "Unassigned"}</span>
                  </div>
                  {isCleaning && room.cleaningTimer && (
                    <div className="flex items-center gap-1 font-semibold text-amber-700">
                      <Clock className="h-3 w-3 animate-spin" />
                      <span>{formatTime(room.cleaningTimer.elapsedSeconds)}</span>
                    </div>
                  )}
                </div>

                {/* Progress bar for cleaning */}
                {isCleaning && (
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-[10px] font-medium text-slate-500">
                      <span>Cleaning Progress</span>
                      <span>{room.cleaningProgress ?? 10}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100">
                      <div
                        className="h-1.5 rounded-full bg-amber-500 transition-all duration-300"
                        style={{ width: `${room.cleaningProgress ?? 10}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Room</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Floor</th>
                <th className="px-5 py-3">Housekeeper</th>
                <th className="px-5 py-3">PMS Status</th>
                <th className="px-5 py-3">Active timer</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRooms.map((room) => (
                <tr
                  key={room.roomNo}
                  onClick={() => handleRoomClick(room.roomNo)}
                  className="hover:bg-slate-50/50 cursor-pointer"
                >
                  <td className="px-5 py-3.5 font-bold text-slate-800">Room {room.roomNo}</td>
                  <td className="px-5 py-3.5 text-slate-500">{room.category}</td>
                  <td className="px-5 py-3.5 text-slate-500">{room.floor}</td>
                  <td className="px-5 py-3.5 text-slate-600 font-medium">{room.assignedStaff || "—"}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
                        room.status === "Vacant Ready"
                          ? "bg-emerald-50 text-emerald-700"
                          : room.status.includes("Dirty")
                          ? "bg-red-50 text-red-700"
                          : room.status === "Cleaning"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-blue-50 text-blue-700"
                      )}
                    >
                      {room.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {room.status === "Cleaning" && room.cleaningTimer ? (
                      <span className="font-semibold text-amber-700">
                        {formatTime(room.cleaningTimer.elapsedSeconds)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button className="text-emerald-700 font-semibold hover:text-emerald-800">
                      Open Controls
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer: Detailed Cleaning Operations */}
      <Drawer
        open={!!selectedRoomNo}
        onClose={() => setSelectedRoomNo(null)}
        title={`Room ${selectedRoom?.roomNo} Cleaning Console`}
      >
        {selectedRoom && (
          <div className="space-y-6">
            
            {/* Room Metadata Box */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Category & Bed:</span>
                <span className="font-semibold text-slate-700">{selectedRoom.category} ({selectedRoom.bedType})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Floor & Wing:</span>
                <span className="font-semibold text-slate-700">{selectedRoom.floor} · {selectedRoom.wing}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Status:</span>
                <span className="font-bold text-emerald-700">{selectedRoom.status}</span>
              </div>
              {selectedRoom.remarks && (
                <div className="pt-2 border-t border-slate-100 text-slate-500">
                  <strong>Remarks:</strong> {selectedRoom.remarks}
                </div>
              )}
            </div>

            {/* Task Controls: Start / Pause / Resume / Complete */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-700" />
                Work Assignment
              </h3>

              {/* Assignment Form (only editable if not cleaning) */}
              {selectedRoom.status !== "Cleaning" && selectedRoom.status !== "Inspection Pending" ? (
                <>
                  <FormField label="Assign Housekeeper">
                    <SelectInput value={assignee} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAssignee(e.target.value)}>
                      {housekeepers.map((h) => (
                        <option key={h.id} value={h.name}>
                          {h.name} ({h.activeShift})
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>

                  <FormField label="Checklist Template">
                    <SelectInput value={checklistId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setChecklistId(e.target.value)}>
                      {checklists.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>

                  <FormField label="Priority">
                    <SelectInput value={priority} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPriority(e.target.value as any)}>
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                    </SelectInput>
                  </FormField>

                  <Button
                    onClick={() => startCleaning(selectedRoom.roomNo, assignee)}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center gap-2"
                  >
                    <Play className="h-4 w-4" /> Start Cleaning
                  </Button>
                </>
              ) : selectedRoom.status === "Cleaning" && selectedRoom.cleaningTimer ? (
                /* Active cleaning timer controller */
                <div className="space-y-4 rounded-xl border border-amber-100 bg-amber-50/20 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">Cleaning Active</p>
                      <h4 className="text-xl font-bold text-slate-800 mt-1">
                        {formatTime(selectedRoom.cleaningTimer.elapsedSeconds)}
                      </h4>
                    </div>
                    <span className="text-xs text-slate-500">Staff: <strong>{selectedRoom.assignedStaff}</strong></span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                      <span>Tasks Complete</span>
                      <span>{calculatedProgress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-emerald-600 transition-all duration-300"
                        style={{ width: `${calculatedProgress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {selectedRoom.cleaningTimer.paused ? (
                      <Button
                        variant="outline"
                        onClick={() => resumeCleaning(selectedRoom.roomNo)}
                        className="flex items-center justify-center gap-1.5 text-xs"
                      >
                        <Play className="h-3.5 w-3.5" /> Resume
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => pauseCleaning(selectedRoom.roomNo)}
                        className="flex items-center justify-center gap-1.5 text-xs"
                      >
                        <Pause className="h-3.5 w-3.5" /> Pause
                      </Button>
                    )}
                    <Button
                      onClick={() => completeCleaning(selectedRoom.roomNo, checkedItems)}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center gap-1.5 text-xs"
                      disabled={calculatedProgress < 50} // Requires at least 50% task completion
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                    </Button>
                  </div>
                  {calculatedProgress < 50 && (
                    <p className="text-[10px] text-red-500 text-center font-medium">
                      * Must complete at least 50% of the checklist items to submit.
                    </p>
                  )}
                </div>
              ) : (
                /* Inspection Pending page state */
                <div className="text-center py-6 border border-dashed border-blue-100 rounded-xl bg-blue-50/10 space-y-3">
                  <Layers className="h-8 w-8 text-blue-600 mx-auto" />
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">Room Awaiting Inspection</h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                      Cleaning has been completed by {selectedRoom.assignedStaff}. Supervisor inspection sign-off is required to release to Vacant Ready.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Checklist elements rendering */}
            {(selectedRoom.status === "Cleaning" || selectedRoom.status === "Inspection Pending") && activeChecklist && (
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <ClipboardList className="h-4 w-4 text-emerald-700" />
                  Cleaning Checklist ({activeChecklist.name})
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {activeChecklist.items.map((item, index) => {
                    const isChecked = checkedItems.includes(item) || selectedRoom.status === "Inspection Pending";
                    return (
                      <label
                        key={index}
                        className={cn(
                          "flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer text-xs transition-colors",
                          isChecked
                            ? "bg-emerald-50/20 border-emerald-100 text-slate-700"
                            : "bg-white border-slate-100 hover:bg-slate-50 text-slate-600"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleCheckboxChange(item)}
                          disabled={selectedRoom.status === "Inspection Pending"}
                          className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>{item}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Photo Attachments evidence upload */}
            {(selectedRoom.status === "Cleaning" || selectedRoom.status === "Inspection Pending") && (
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-emerald-700" />
                  Inspection Evidence Photos
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {uploadedPhotos.map((url, i) => (
                    <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 group bg-slate-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80" alt="cleaning preview" className="object-cover h-full w-full" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  ))}
                  {selectedRoom.status === "Cleaning" && (
                    <button
                      onClick={triggerPhotoUpload}
                      className="flex flex-col items-center justify-center aspect-video rounded-lg border border-dashed border-slate-300 text-slate-500 hover:text-emerald-700 hover:border-emerald-700 transition-all bg-slate-50/50"
                    >
                      <Camera className="h-4 w-4" />
                      <span className="text-[9px] mt-1 font-medium">Add Photo</span>
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        )}
      </Drawer>
    </div>
  );
}
