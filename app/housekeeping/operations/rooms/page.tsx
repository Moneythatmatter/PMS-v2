"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useHousekeeping } from "@/components/housekeeping/HousekeepingContext";
import { hkRoomService, hkTaskService } from "@/services/housekeeping";
import { roomService, type RoomDto } from "@/services/front-office/rooms";
import type { HKTask } from "@/components/housekeeping/HousekeepingTypes";
import { findRoomByKey, roomApiId, roomKey } from "@/components/housekeeping/roomUtils";
import { isActiveTask } from "@/components/housekeeping/taskUtils";
import { CreateCleaningTaskForm } from "@/components/housekeeping/CreateCleaningTaskForm";
import { CleaningTaskDetailPanel } from "@/components/housekeeping/CleaningTaskDetailPanel";
import {
  Clock,
  Play,
  Pause,
  CheckCircle2,
  User,
  Sparkles,
  ClipboardList,
  AlertTriangle,
  Eye,
  Building2,
  BedDouble,
  Camera,
  Layers,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import {
  SelectInput,
  FormField,
  FOPageHeader,
  StatMiniCard,
} from "@/components/frontoffice/ui";
import {
  OperationsToolbar,
  OperationsFilterDrawer,
} from "@/components/housekeeping/OperationsToolbar";
import { ModuleSelectionBar } from "@/components/pms/ModuleSelectionBar";

export default function RoomStatusOperations() {
  const {
    rooms,
    staff,
    checklists,
    pauseCleaning,
    resumeCleaning,
    completeCleaning,
    changeRoomStatus,
    refreshFromApi,
  } = useHousekeeping();

  const [tasks, setTasks] = useState<HKTask[]>([]);
  const [foRooms, setFoRooms] = useState<RoomDto[]>([]);
  const [search, setSearch] = useState("");
  const [floorFilter, setFloorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [checklistId, setChecklistId] = useState("");
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
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

  const reloadTasks = async () => {
    const taskList = await hkTaskService.list();
    setTasks(taskList);
    await refreshFromApi();
  };

  const activeTaskByRoom = useMemo(() => {
    const map = new Map<string, HKTask>();
    for (const task of tasks.filter(isActiveTask)) {
      const keys = [task.roomId, task.roomNo].filter(Boolean).map(String);
      for (const key of keys) map.set(key, task);
    }
    for (const room of rooms) {
      const task = tasks.find(
        (t) =>
          isActiveTask(t) &&
          [room.roomId, room.roomRefId, room.roomNo, room.id].filter(Boolean).some(
            (k) => String(k) === String(t.roomId) || String(k) === String(t.roomNo),
          ),
      );
      if (task) {
        for (const k of [room.roomId, room.roomRefId, room.roomNo, room.id].filter(Boolean)) {
          map.set(String(k), task);
        }
      }
    }
    return map;
  }, [tasks, rooms]);

  const selectedRoom = useMemo(
    () => (selectedRoomId ? findRoomByKey(rooms, selectedRoomId) ?? null : null),
    [rooms, selectedRoomId],
  );

  const getRoomTask = (room: (typeof rooms)[0]) => {
    if (room.activeTaskId) {
      const byId = tasks.find((t) => t.id === room.activeTaskId && isActiveTask(t));
      if (byId) return byId;
    }
    const keys = [room.roomId, room.roomRefId, room.roomNo, room.id].filter(Boolean).map(String);
    for (const k of keys) {
      const t = activeTaskByRoom.get(k);
      if (t) return t;
    }
    return null;
  };

  const selectedRoomFoId = useMemo(() => {
    if (!selectedRoom) return "";
    const fo = foRooms.find(
      (r) =>
        r.id === selectedRoom.roomId ||
        r.roomNo === selectedRoom.roomNo ||
        r.id === selectedRoom.roomRefId,
    );
    return fo?.id ?? selectedRoom.roomId ?? selectedRoom.roomRefId ?? selectedRoom.roomNo;
  }, [selectedRoom, foRooms]);

  const lockedRoomLabel = selectedRoom
    ? `Room ${selectedRoom.roomNo} — ${selectedRoom.category}${selectedRoom.floor ? ` (${selectedRoom.floor})` : ""}`
    : undefined;

  const selectedRoomActiveTask = useMemo(() => {
    if (!selectedRoom) return null;
    return getRoomTask(selectedRoom);
  }, [selectedRoom, activeTaskByRoom]);

  const canCreateTask =
    !!selectedRoom &&
    !selectedRoomActiveTask &&
    selectedRoom.status !== "Cleaning" &&
    selectedRoom.status !== "Inspection Pending" &&
    (selectedRoom.status.includes("Dirty") ||
      selectedRoom.status === "Vacant Ready" ||
      selectedRoom.status.includes("Occupied"));

  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const matchSearch =
        r.roomNo.includes(search) ||
        r.category.toLowerCase().includes(search.toLowerCase()) ||
        (r.assignedStaff && r.assignedStaff.toLowerCase().includes(search.toLowerCase()));

      const matchFloor = floorFilter === "all" || r.floor === floorFilter;

      let matchStatus = true;
      if (statusFilter === "dirty") matchStatus = r.status.includes("Dirty");
      else if (statusFilter === "cleaning") matchStatus = r.status === "Cleaning";
      else if (statusFilter === "inspection") matchStatus = r.status === "Inspection Pending";
      else if (statusFilter === "ready") matchStatus = r.status === "Vacant Ready";
      else if (statusFilter === "blocked") {
        matchStatus =
          r.status === "Blocked" ||
          r.status === "Out of Order" ||
          r.status === "Out of Service";
      }

      return matchSearch && matchFloor && matchStatus;
    });
  }, [rooms, search, floorFilter, statusFilter]);

  const uniqueFloors = useMemo(
    () => Array.from(new Set(rooms.map((r) => r.floor).filter(Boolean))).sort(),
    [rooms],
  );

  const stats = useMemo(() => {
    return {
      total: rooms.length,
      dirty: rooms.filter((r) => r.status.includes("Dirty")).length,
      cleaning: rooms.filter((r) => r.status === "Cleaning").length,
      inspection: rooms.filter((r) => r.status === "Inspection Pending").length,
      ready: rooms.filter((r) => r.status === "Vacant Ready").length,
    };
  }, [rooms]);

  const activeChecklist = useMemo(
    () => checklists.find((c) => c.id === checklistId) ?? null,
    [checklists, checklistId],
  );

  const calculatedProgress = useMemo(() => {
    if (!activeChecklist?.items.length) return 0;
    return Math.floor((checkedItems.length / activeChecklist.items.length) * 100);
  }, [activeChecklist, checkedItems]);

  const handleRoomClick = (id: string) => {
    const rm = findRoomByKey(rooms, id);
    if (!rm) return;
    setSelectedRoomId(id);
    const preferredChecklist = checklists.find((c) =>
      rm.status.includes("Occupied") ? c.type === "Stay-over" : c.type === "Departure",
    );
    setChecklistId(preferredChecklist?.id || checklists[0]?.id || "");
    setCheckedItems([]);
    setUploadedPhotos(rm.photos || []);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRoom) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const resultUrl = event.target?.result as string;
      if (!resultUrl) return;
      setUploadedPhotos((prev) => {
        const next = [...prev, resultUrl];
        hkRoomService.update(roomApiId(selectedRoom), { photos: next }).catch(console.error);
        return next;
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5">
      <FOPageHeader
        eyebrow="Operations"
        title="Room Status"
        description="Live HK room states — dirty, cleaning, inspection, and ready to sell."
        badge={
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-650">
            <BedDouble className="h-4 w-4 text-emerald-600" />
            {stats.cleaning} cleaning
          </div>
        }
        action={
          <div className="flex items-center gap-2">
            <Link href="/housekeeping/operations/room-cleaning">
              <Button variant="outline" className="flex items-center gap-1.5 text-xs">
                Cleaning Tasks <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
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
          { id: "blocked", label: "Blocked / OOS" },
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

      <OperationsFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        title="Filter Rooms"
        activeFilterCount={floorFilter !== "all" ? 1 : 0}
        onReset={() => setFloorFilter("all")}
      >
        <FormField label="Filter by Floor">
          <SelectInput
            value={floorFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setFloorFilter(e.target.value)
            }
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
      </OperationsFilterDrawer>

      {filteredRooms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-10 text-center">
          <Building2 className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-sm font-bold text-slate-800">No rooms match filters</h3>
          <p className="mt-1 text-xs text-slate-500">
            Link rooms in Room Master or adjust your filters.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredRooms.map((room) => {
            const isCleaning = room.status === "Cleaning";
            const isPendingInspect = room.status === "Inspection Pending";
            const isDirty = room.status.includes("Dirty");
            const isReady = room.status === "Vacant Ready";
            const task = getRoomTask(room);

            return (
              <div
                key={roomKey(room)}
                onClick={() => handleRoomClick(roomKey(room))}
                className={cn(
                  "cursor-pointer rounded-md border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md",
                  isCleaning
                    ? "border-amber-200 ring-2 ring-amber-100/50"
                    : isPendingInspect
                      ? "border-blue-200"
                      : isDirty
                        ? "border-red-200"
                        : isReady
                          ? "border-emerald-200"
                          : "border-slate-200",
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Room {room.roomNo}</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {task?.taskNumber ? `${task.taskNumber} · active task` : room.category}
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
                              : "bg-slate-100 text-slate-700",
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
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(room.cleaningTimer.elapsedSeconds)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Room</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Floor</th>
                <th className="px-5 py-3">Housekeeper</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Active Task</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRooms.map((room) => {
                const task = getRoomTask(room);
                return (
                  <tr
                    key={roomKey(room)}
                    onClick={() => handleRoomClick(roomKey(room))}
                    className="hover:bg-slate-50/50 cursor-pointer"
                  >
                    <td className="px-5 py-3.5 font-bold text-slate-800">Room {room.roomNo}</td>
                    <td className="px-5 py-3.5 text-slate-500">{room.category}</td>
                    <td className="px-5 py-3.5 text-slate-500">{room.floor}</td>
                    <td className="px-5 py-3.5">{room.assignedStaff || "—"}</td>
                    <td className="px-5 py-3.5">{room.status}</td>
                    <td className="px-5 py-3.5 text-slate-500">{task?.taskNumber ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Drawer
        open={!!selectedRoomId}
        onClose={() => setSelectedRoomId(null)}
        title={
          selectedRoomActiveTask
            ? `${selectedRoomActiveTask.taskNumber ?? "Task"} — Room ${selectedRoom?.roomNo}`
            : `Room ${selectedRoom?.roomNo} — HK Console`
        }
        description={
          selectedRoomActiveTask
            ? "Manage this cleaning task — assign, start, complete, or approve."
            : canCreateTask
              ? "Create a cleaning task for this room."
              : undefined
        }
      >
        {selectedRoom && (
          <div className="space-y-6">
            {!selectedRoomActiveTask && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Category</span>
                  <span className="font-semibold">{selectedRoom.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Floor</span>
                  <span className="font-semibold">{selectedRoom.floor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <span className="font-bold text-emerald-700">{selectedRoom.status}</span>
                </div>
              </div>
            )}

            {selectedRoomActiveTask ? (
              <CleaningTaskDetailPanel
                task={selectedRoomActiveTask}
                staff={staff}
                onUpdated={async () => {
                  await reloadTasks();
                }}
                roomStatusLink="/housekeeping/operations/rooms"
              />
            ) : canCreateTask ? (
              <CreateCleaningTaskForm
                foRooms={foRooms}
                initialRoomId={selectedRoomFoId}
                lockedRoomLabel={lockedRoomLabel}
                lockRoom
                onCreated={async () => {
                  await reloadTasks();
                  setSelectedRoomId(null);
                }}
              />
            ) : null}

            {!selectedRoomActiveTask && selectedRoom.status === "Cleaning" && selectedRoom.cleaningTimer && (
              <div className="space-y-4 rounded-xl border border-amber-100 bg-amber-50/20 p-4">
                <p className="text-xl font-bold">{formatTime(selectedRoom.cleaningTimer.elapsedSeconds)}</p>
                <div className="grid grid-cols-2 gap-3">
                  {selectedRoom.cleaningTimer.paused ? (
                    <Button variant="outline" onClick={() => resumeCleaning(roomKey(selectedRoom))}>
                      <Play className="h-3.5 w-3.5 mr-1" /> Resume
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => pauseCleaning(roomKey(selectedRoom))}>
                      <Pause className="h-3.5 w-3.5 mr-1" /> Pause
                    </Button>
                  )}
                  <Button
                    onClick={() =>
                      completeCleaning(roomKey(selectedRoom), checkedItems, uploadedPhotos)
                    }
                    className="bg-emerald-700 hover:bg-emerald-800 text-white"
                    disabled={calculatedProgress < 50}
                  >
                    Complete
                  </Button>
                </div>
              </div>
            )}

            {!selectedRoomActiveTask && selectedRoom.status === "Inspection Pending" && (
              <div className="text-center py-4 border border-dashed border-blue-100 rounded-xl">
                <Layers className="h-8 w-8 text-blue-600 mx-auto" />
                <p className="text-xs text-slate-500 mt-2">Awaiting supervisor inspection.</p>
              </div>
            )}

            {!selectedRoomActiveTask && selectedRoom.status === "Vacant Ready" && (
              <Button
                variant="outline"
                onClick={() => changeRoomStatus(roomKey(selectedRoom), "Vacant Dirty")}
                className="w-full text-xs"
              >
                Mark as Dirty
              </Button>
            )}

            {!selectedRoomActiveTask && selectedRoom.status === "Cleaning" && activeChecklist && (
              <div className="space-y-2 border-t pt-4">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <ClipboardList className="h-4 w-4" /> {activeChecklist.name}
                </h3>
                {activeChecklist.items.map((item, index) => (
                  <label key={index} className="flex items-start gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={checkedItems.includes(item)}
                      onChange={() =>
                        setCheckedItems((prev) =>
                          prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
                        )
                      }
                      className="mt-0.5"
                    />
                    {item}
                  </label>
                ))}
              </div>
            )}

            {!selectedRoomActiveTask && selectedRoom.status === "Cleaning" && (
              <div className="border-t pt-4">
                <label className="cursor-pointer flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 p-4 text-xs text-slate-500">
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  <Camera className="h-4 w-4 mb-1" /> Add photo evidence
                </label>
              </div>
            )}

            {!selectedRoomActiveTask && (
              <Link
                href="/housekeeping/operations/room-cleaning"
                className="block text-center text-xs text-emerald-700 hover:underline"
              >
                Manage all cleaning tasks →
              </Link>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
