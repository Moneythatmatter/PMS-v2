"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useHousekeeping } from "@/components/housekeeping/HousekeepingContext";
import { hkRoomService, hkTaskService } from "@/services/housekeeping";
import { roomService, type RoomDto } from "@/services/front-office/rooms";
import { reservationService } from "@/services/front-office/reservations";
import type { ReservationBooking } from "@/app/data/types";
import type { HKTask, HkTaskType } from "@/components/housekeeping/HousekeepingTypes";
import { mergeTasksIntoRooms, formatTaskTypeLabel } from "@/components/housekeeping/taskUtils";
import { normalizeHkRoom, findRoomByKey, roomApiId, roomKey } from "@/components/housekeeping/roomUtils";
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
  Building2,
  BedDouble,
  Plus,
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
import { ModuleSelectionBar } from "@/components/pms/ModuleSelectionBar";
import { TextAreaInput } from "@/components/frontoffice/ui";

const TASK_TYPES: HkTaskType[] = [
  "CHECKOUT_CLEANING",
  "REGULAR_CLEANING",
  "DEEP_CLEANING",
  "INSPECTION",
  "TURNDOWN",
  "SPECIAL_REQUEST",
];

const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

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
    setRooms,
  } = useHousekeeping();

  const [tasks, setTasks] = useState<HKTask[]>([]);
  const [foRooms, setFoRooms] = useState<RoomDto[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTaskRoomId, setNewTaskRoomId] = useState("");
  const [newTaskType, setNewTaskType] = useState<HkTaskType>("REGULAR_CLEANING");
  const [newTaskPriority, setNewTaskPriority] = useState<string>("MEDIUM");
  const [newTaskNotes, setNewTaskNotes] = useState("");
  const [roomBooking, setRoomBooking] = useState<ReservationBooking | null>(null);
  const [linkBooking, setLinkBooking] = useState(true);
  const [loadingBooking, setLoadingBooking] = useState(false);

  const [search, setSearch] = useState("");
  const [floorFilter, setFloorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [assignee, setAssignee] = useState("");
  const [checklistId, setChecklistId] = useState("");
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    void hkTaskService
      .list()
      .then(setTasks)
      .catch(() => setTasks([]));
    void roomService
      .list()
      .then(setFoRooms)
      .catch(() => setFoRooms([]));
  }, []);

  useEffect(() => {
    if (!createOpen || !newTaskRoomId.trim()) {
      setRoomBooking(null);
      return;
    }
    let cancelled = false;
    setLoadingBooking(true);
    void reservationService
      .getCurrentForRoom(newTaskRoomId.trim())
      .then((booking) => {
        if (cancelled) return;
        setRoomBooking(booking);
        setLinkBooking(true);
        if (booking.status === "Checked Out") {
          setNewTaskType("CHECKOUT_CLEANING");
        } else if (
          booking.status === "Checked In" ||
          booking.status === "In-House"
        ) {
          setNewTaskType("REGULAR_CLEANING");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRoomBooking(null);
          setLinkBooking(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingBooking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [createOpen, newTaskRoomId]);

  const queueRooms = useMemo(
    () => mergeTasksIntoRooms(rooms, tasks),
    [rooms, tasks],
  );

  const reloadQueue = async () => {
    const [taskList, roomList] = await Promise.all([
      hkTaskService.list(),
      hkRoomService.list(),
    ]);
    setTasks(taskList);
    setRooms(roomList.map(normalizeHkRoom));
  };

  const handleCreateTask = async () => {
    if (!newTaskRoomId.trim()) {
      setCreateError("Select a room.");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      await hkTaskService.create({
        roomId: newTaskRoomId.trim(),
        bookingId:
          linkBooking && roomBooking?.id ? roomBooking.id : undefined,
        taskType: newTaskType,
        priority: newTaskPriority as HKTask["priority"],
        notes: newTaskNotes.trim() || undefined,
      });
      await reloadQueue();
      setCreateOpen(false);
      setNewTaskRoomId("");
      setNewTaskNotes("");
      setRoomBooking(null);
      setLinkBooking(true);
      setNewTaskType("REGULAR_CLEANING");
      setNewTaskPriority("MEDIUM");
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Failed to create task");
    } finally {
      setCreating(false);
    }
  };

  // Selected room details
  const selectedRoom = useMemo(() => {
    return selectedRoomId ? findRoomByKey(queueRooms, selectedRoomId) ?? null : null;
  }, [queueRooms, selectedRoomId]);

  // Housekeepers list
  const housekeepers = useMemo(() => {
    return staff.filter((s) => s.role === "Housekeeper");
  }, [staff]);

  // Handle room click: Open Drawer
  const handleRoomClick = (roomId: string) => {
    const rm = findRoomByKey(queueRooms, roomId);
    if (!rm) return;
    setSelectedRoomId(roomId);
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
    return queueRooms.filter((r) => {
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
  }, [queueRooms, search, floorFilter, statusFilter]);

  const uniqueFloors = useMemo(() => {
    return Array.from(new Set(queueRooms.map((r) => r.floor).filter(Boolean))).sort();
  }, [queueRooms]);

  const stats = useMemo(() => {
    const total = queueRooms.length;
    const dirty = queueRooms.filter((r) => r.status.includes("Dirty")).length;
    const cleaning = queueRooms.filter((r) => r.status === "Cleaning").length;
    const inspection = queueRooms.filter((r) => r.status === "Inspection Pending").length;
    const ready = queueRooms.filter((r) => r.status === "Vacant Ready").length;

    return { total, dirty, cleaning, inspection, ready };
  }, [queueRooms]);

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

  // Real photo upload via FileReader
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const resultUrl = event.target?.result as string;
        if (resultUrl) {
          setUploadedPhotos((prev) => {
            const next = [...prev, resultUrl];
            if (selectedRoomId && selectedRoom) {
              hkRoomService.update(roomApiId(selectedRoom), { photos: next }).catch((err) => {
                console.error("[HK] Failed to sync photo upload to API", err);
              });
            }
            return next;
          });
        }
      };
      reader.readAsDataURL(file);
    }
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
              onClick={() => {
                setCreateError(null);
                if (!newTaskRoomId && foRooms[0]?.id) {
                  setNewTaskRoomId(foRooms[0].id);
                }
                setCreateOpen(true);
              }}
              className="bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> Create Task
            </Button>
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
          { id: "blocked", label: "Blocked / Out Of Service" },
        ]}
        activeStatusTab={statusFilter}
        onStatusTabChange={setStatusFilter}
        selectionBar={
          viewMode === "list" ? (
            <ModuleSelectionBar
              count={selectedIds.size}
              noun="room"
              onClear={() => setSelectedIds(new Set())}
              actions={[
                {
                  label: "Open Controls",
                  icon: <Eye className="h-3.5 w-3.5" />,
                  onClick: () => {
                    const firstId = Array.from(selectedIds)[0];
                    if (firstId) handleRoomClick(firstId);
                  },
                },
              ]}
            />
          ) : null
        }
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

      {filteredRooms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-10 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-sm font-bold text-slate-800">No cleaning tasks in queue</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            Tasks are created automatically on guest check-out, or you can add one manually
            (e.g. deep clean on a vacant room).
          </p>
          <Button
            onClick={() => setCreateOpen(true)}
            className="mt-4 bg-emerald-700 hover:bg-emerald-800 text-white"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Create Cleaning Task
          </Button>
        </div>
      ) : null}

      {/* Main Grid View */}
      {viewMode === "grid" && filteredRooms.length > 0 ? (
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
                key={roomKey(room)}
                onClick={() => handleRoomClick(roomKey(room))}
                className={cn(
                  "cursor-pointer rounded-md border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md",
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
                    <p className="text-xs text-slate-500 font-medium">
                      {room.activeTaskNumber
                        ? `${room.activeTaskNumber} · ${formatTaskTypeLabel(room.activeTaskType)}`
                        : room.category}
                    </p>
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
      ) : filteredRooms.length > 0 ? (
        /* List View */
        <>
          <div className="space-y-3 md:hidden">
            {filteredRooms.map((room) => (
              <button
                key={room.roomNo}
                type="button"
                onClick={() => handleRoomClick(roomKey(room))}
                className={cn(
                  "w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-2xs transition-colors",
                  selectedIds.has(roomKey(room)) && "border-emerald-300 bg-emerald-50/40",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(roomKey(room))}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => {
                        const next = new Set(selectedIds);
                        if (next.has(roomKey(room))) next.delete(roomKey(room));
                        else next.add(roomKey(room));
                        setSelectedIds(next);
                      }}
                      className="mt-0.5 rounded border-slate-300"
                      aria-label={`Select room ${room.roomNo}`}
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800">Room {room.roomNo}</p>
                      <p className="text-[11px] text-slate-500">
                        {room.category} · {room.floor}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
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
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                  <span>HK: {room.assignedStaff || "—"}</span>
                  {room.status === "Cleaning" && room.cleaningTimer && (
                    <span className="font-semibold text-amber-700">
                      {formatTime(room.cleaningTimer.elapsedSeconds)}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="w-10 px-5 py-3">
                    <input
                      type="checkbox"
                      checked={
                        filteredRooms.length > 0 &&
                        filteredRooms.every((room) => selectedIds.has(roomKey(room)))
                      }
                      onChange={() => {
                        const allIds = filteredRooms.map((room) => roomKey(room));
                        const allSelected = allIds.every((id) => selectedIds.has(id));
                        setSelectedIds(allSelected ? new Set() : new Set(allIds));
                      }}
                      className="rounded border-slate-300"
                      aria-label="Select all"
                    />
                  </th>
                  <th className="px-5 py-3">Room</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Floor</th>
                  <th className="px-5 py-3">Housekeeper</th>
                  <th className="px-5 py-3">PMS Status</th>
                  <th className="px-5 py-3">Active timer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRooms.map((room) => (
                  <tr
                    key={roomKey(room)}
                    onClick={() => handleRoomClick(roomKey(room))}
                    className={cn(
                      "hover:bg-slate-50/50 cursor-pointer",
                      selectedIds.has(roomKey(room)) && "bg-emerald-50/40",
                    )}
                  >
                    <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                      checked={selectedIds.has(roomKey(room))}
                      onChange={() => {
                        const next = new Set(selectedIds);
                        if (next.has(roomKey(room))) next.delete(roomKey(room));
                        else next.add(roomKey(room));
                          setSelectedIds(next);
                        }}
                        className="rounded border-slate-300"
                        aria-label={`Select room ${room.roomNo}`}
                      />
                    </td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {/* Create Task Drawer */}
      <Drawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Cleaning Task"
        description="Assign work to a room — booking is optional (e.g. deep clean on vacant room)."
      >
        <div className="space-y-4">
          {createError && (
            <p className="text-xs font-medium text-red-600 rounded-lg bg-red-50 px-3 py-2">
              {createError}
            </p>
          )}
          <FormField label="Room" required>
            <SelectInput
              value={newTaskRoomId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setNewTaskRoomId(e.target.value)
              }
              className="text-xs"
            >
              <option value="">Select room…</option>
              {foRooms.map((r) => (
                <option key={r.id} value={r.id ?? r.roomNo}>
                  {r.roomNo} — {r.roomType ?? "Standard"}
                  {r.floor ? ` (${r.floor})` : ""}
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField label="Guest booking">
            {loadingBooking ? (
              <p className="text-xs text-slate-500">Looking up booking for this room…</p>
            ) : roomBooking ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 space-y-2">
                <label className="flex items-start gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={linkBooking}
                    onChange={(e) => setLinkBooking(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300"
                  />
                  <span>
                    <span className="font-bold text-slate-800 block">
                      Link to {roomBooking.bookingNo ?? roomBooking.id}
                    </span>
                    <span className="text-slate-600">
                      {roomBooking.guestName ?? "Guest"} · {roomBooking.status}
                      {roomBooking.checkOut ? ` · Out ${roomBooking.checkOut}` : ""}
                    </span>
                  </span>
                </label>
              </div>
            ) : (
              <p className="text-xs text-slate-500 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2">
                No active booking for this room — task will be created without a
                booking link (e.g. vacant deep clean).
              </p>
            )}
          </FormField>

          <FormField label="Task Type" required>
            <SelectInput
              value={newTaskType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setNewTaskType(e.target.value as HkTaskType)
              }
              className="text-xs"
            >
              {TASK_TYPES.map((t) => (
                <option key={t} value={t}>
                  {formatTaskTypeLabel(t)}
                </option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Priority">
            <SelectInput
              value={newTaskPriority}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setNewTaskPriority(e.target.value)
              }
              className="text-xs"
            >
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0) + p.slice(1).toLowerCase()}
                </option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Notes">
            <TextAreaInput
              value={newTaskNotes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setNewTaskNotes(e.target.value)
              }
              rows={3}
              placeholder="Optional instructions for housekeeper…"
              className="text-xs"
            />
          </FormField>
          <Button
            className="w-full bg-emerald-700 hover:bg-emerald-800"
            onClick={() => void handleCreateTask()}
            disabled={creating}
          >
            {creating ? "Creating…" : "Create Task"}
          </Button>
        </div>
      </Drawer>

      {/* Drawer: Detailed Cleaning Operations */}
      <Drawer
        open={!!selectedRoomId}
        onClose={() => setSelectedRoomId(null)}
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

              {/* Assignment Form (only for Dirty rooms) */}
              {selectedRoom.status.includes("Dirty") ? (
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
                    onClick={() => startCleaning(roomKey(selectedRoom), assignee)}
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
                        onClick={() => resumeCleaning(roomKey(selectedRoom))}
                        className="flex items-center justify-center gap-1.5 text-xs"
                      >
                        <Play className="h-3.5 w-3.5" /> Resume
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => pauseCleaning(roomKey(selectedRoom))}
                        className="flex items-center justify-center gap-1.5 text-xs"
                      >
                        <Pause className="h-3.5 w-3.5" /> Pause
                      </Button>
                    )}
                    <Button
                      onClick={() => completeCleaning(roomKey(selectedRoom), checkedItems, uploadedPhotos)}
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
              ) : selectedRoom.status === "Inspection Pending" ? (
                /* Inspection Pending state */
                <div className="text-center py-6 border border-dashed border-blue-100 rounded-xl bg-blue-50/10 space-y-3">
                  <Layers className="h-8 w-8 text-blue-600 mx-auto" />
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">Room Awaiting Inspection</h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                      Cleaning has been completed by {selectedRoom.assignedStaff}. Supervisor inspection sign-off is required to release to Vacant Ready.
                    </p>
                  </div>
                </div>
              ) : selectedRoom.status === "Vacant Ready" ? (
                /* Vacant Ready state */
                <div className="text-center py-6 border border-emerald-100 rounded-xl bg-emerald-50/20 space-y-3">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">Room is Vacant & Ready</h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                      This room has been cleaned and inspected. It is ready for guest check-in.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => changeRoomStatus(roomKey(selectedRoom), "Vacant Dirty")}
                    className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    Mark as Dirty (Request Re-clean)
                  </Button>
                </div>
              ) : (
                /* Other statuses (Occupied, Blocked, OOO, OOS) */
                <div className="text-center py-6 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
                  <Building2 className="h-8 w-8 text-slate-400 mx-auto" />
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">Room Status: {selectedRoom.status}</h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                      {selectedRoom.remarks || `Current room status is set to ${selectedRoom.status}.`}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => changeRoomStatus(roomKey(selectedRoom), selectedRoom.status.includes("Occupied") ? "Occupied Dirty" : "Vacant Dirty")}
                    className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    Mark as Dirty
                  </Button>
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {uploadedPhotos.map((url, i) => (
                    <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 group bg-slate-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="cleaning preview" className="object-cover h-full w-full" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  ))}
                  {selectedRoom.status === "Cleaning" && (
                    <label className="cursor-pointer flex flex-col items-center justify-center aspect-video rounded-lg border border-dashed border-slate-300 text-slate-500 hover:text-emerald-700 hover:border-emerald-700 transition-all bg-slate-50/50">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <Camera className="h-4 w-4" />
                      <span className="text-[9px] mt-1 font-medium">Add Photo</span>
                    </label>
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
