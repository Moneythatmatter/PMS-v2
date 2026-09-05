"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useHousekeeping } from "@/components/housekeeping/HousekeepingContext";
import { hkRoomService, hkTaskService } from "@/services/housekeeping";
import { roomService, type RoomDto } from "@/services/front-office/rooms";
import type { HKRoom, HKTask } from "@/components/housekeeping/HousekeepingTypes";
import { findRoomByKey, roomApiId, roomKey } from "@/components/housekeeping/roomUtils";
import { isActiveTask } from "@/components/housekeeping/taskUtils";
import { CreateCleaningTaskForm } from "@/components/housekeeping/CreateCleaningTaskForm";
import { CleaningTaskDetailPanel } from "@/components/housekeeping/CleaningTaskDetailPanel";
import { floors } from "@/app/data/frontoffice/constants";
import {
  countHkStatusFilter,
  getHkLegendConfig,
  getHkRoomStatusConfig,
  getHkRoomStatusShortLabel,
  HK_ROOM_STATUS_LEGEND_ORDER,
  matchesHkStatusFilter,
} from "@/lib/housekeeping/room-status-colors";
import {
  Clock,
  Play,
  Pause,
  User,
  ClipboardList,
  Building2,
  Camera,
  Layers,
  DoorOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import {
  SelectInput,
  FOPageHeader,
  FOSearchToolbar,
} from "@/components/frontoffice/ui";

function compareFloorLabel(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function compareRoomNo(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function roomTypeLabel(room: HKRoom): string {
  return (room.type ?? room.category).trim();
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function HKRoomStatusCardTile({
  room,
  task,
  onClick,
}: {
  room: HKRoom;
  task: HKTask | null;
  onClick: () => void;
}) {
  const config = getHkRoomStatusConfig(room.status);
  const shortStatus = getHkRoomStatusShortLabel(room.status);
  const showTimer = room.status === "Cleaning" && room.cleaningTimer;
  const showGuest =
    !!room.guestName &&
    (room.status === "Occupied" || room.status === "Occupied Dirty");
  const showStaff = !!room.assignedStaff && !showGuest;
  const footerText = showTimer
    ? formatTime(room.cleaningTimer!.elapsedSeconds)
    : showGuest
      ? room.guestName
      : showStaff
        ? room.assignedStaff
        : null;

  return (
    <button
      type="button"
      onClick={onClick}
      title={`Room ${room.roomNo} — ${room.status}${room.guestName ? ` · ${room.guestName}` : ""}${room.assignedStaff ? ` · ${room.assignedStaff}` : ""}`}
      className={cn(
        "group flex h-[76px] w-full flex-col rounded-xl border p-3 text-left transition-all",
        "hover:-translate-y-0.5 hover:shadow-lg",
        config.card,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={cn("text-base font-bold leading-none tracking-tight", config.roomNoText)}>
          {room.roomNo}
        </p>
        <span className={cn("mt-0.5 h-2 w-2 shrink-0 rounded-full", config.dot)} />
      </div>

      <p className={cn("mt-2 truncate text-[11px] font-medium leading-tight", config.metaText)}>
        {room.category}
        <span className="opacity-60"> · </span>
        <span className="font-semibold">{shortStatus}</span>
      </p>

      <div className={cn("mt-auto flex min-h-[14px] items-center gap-1 truncate text-[10px]", config.metaText)}>
        {footerText ? (
          <>
            {showTimer ? (
              <Clock className="h-2.5 w-2.5 shrink-0 opacity-70" />
            ) : (
              <User className="h-2.5 w-2.5 shrink-0 opacity-70" />
            )}
            <span className="truncate opacity-80">{footerText}</span>
          </>
        ) : task?.taskNumber ? (
          <span className="truncate opacity-70">{task.taskNumber}</span>
        ) : (
          <span className="invisible select-none" aria-hidden>
            —
          </span>
        )}
      </div>
    </button>
  );
}

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
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [checklistId, setChecklistId] = useState("");
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);

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
    const q = search.toLowerCase();
    return rooms.filter((r) => {
      const matchSearch =
        !q ||
        r.roomNo.includes(q) ||
        r.category.toLowerCase().includes(q) ||
        (r.assignedStaff && r.assignedStaff.toLowerCase().includes(q));

      const matchFloor = floorFilter === "all" || r.floor === floorFilter;
      const matchRoomType =
        roomTypeFilter === "all" || roomTypeLabel(r) === roomTypeFilter;
      const matchStatus = matchesHkStatusFilter(r, statusFilter);

      return matchSearch && matchFloor && matchRoomType && matchStatus;
    });
  }, [rooms, search, floorFilter, roomTypeFilter, statusFilter]);

  const pillScopeRooms = useMemo(() => {
    const q = search.toLowerCase();
    return rooms.filter((r) => {
      const matchSearch =
        !q ||
        r.roomNo.includes(q) ||
        r.category.toLowerCase().includes(q) ||
        (r.assignedStaff && r.assignedStaff.toLowerCase().includes(q));
      const matchFloor = floorFilter === "all" || r.floor === floorFilter;
      const matchRoomType =
        roomTypeFilter === "all" || roomTypeLabel(r) === roomTypeFilter;
      return matchSearch && matchFloor && matchRoomType;
    });
  }, [rooms, search, floorFilter, roomTypeFilter]);

  const statusCounts = useMemo(
    () => ({
      all: pillScopeRooms.length,
      dirty: countHkStatusFilter(pillScopeRooms, "dirty"),
      occupied: countHkStatusFilter(pillScopeRooms, "occupied"),
      cleaning: countHkStatusFilter(pillScopeRooms, "cleaning"),
      inspection: countHkStatusFilter(pillScopeRooms, "inspection"),
      ready: countHkStatusFilter(pillScopeRooms, "ready"),
      blocked: countHkStatusFilter(pillScopeRooms, "blocked"),
    }),
    [pillScopeRooms],
  );

  const floorOptions = useMemo(() => {
    const known = floors.filter((f) => rooms.some((r) => r.floor === f));
    const other = [...new Set(rooms.map((r) => r.floor).filter(Boolean))]
      .filter((f) => !floors.includes(f as (typeof floors)[number]))
      .sort(compareFloorLabel);
    return [...known, ...other];
  }, [rooms]);

  const roomTypeOptions = useMemo(
    () =>
      [...new Set(rooms.map(roomTypeLabel).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" }),
      ),
    [rooms],
  );

  const roomsByFloor = useMemo(() => {
    const groups = new Map<string, HKRoom[]>();

    for (const room of filteredRooms) {
      const floor = room.floor?.trim() || "Unassigned";
      const list = groups.get(floor) ?? [];
      list.push(room);
      groups.set(floor, list);
    }

    const knownFloors = floors.filter((floor) => groups.has(floor));
    const otherFloors = [...groups.keys()]
      .filter((floor) => !floors.includes(floor as (typeof floors)[number]))
      .sort(compareFloorLabel);

    return [...knownFloors, ...otherFloors].map((floor) => ({
      floor,
      rooms: (groups.get(floor) ?? []).sort((a, b) => compareRoomNo(a.roomNo, b.roomNo)),
    }));
  }, [filteredRooms]);

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
    <div className="space-y-6">
      <FOPageHeader
        eyebrow="Operations"
        title="Room Status"
        action={
          <div className="flex max-w-xl flex-wrap items-center justify-end gap-x-3 gap-y-1.5">
            {HK_ROOM_STATUS_LEGEND_ORDER.map(({ key, label }) => {
              const cfg = getHkLegendConfig(key);
              return (
                <div
                  key={key}
                  className="flex items-center gap-1.5 text-[11px] text-slate-600"
                  title={cfg.description}
                >
                  <span className={cn("h-3 w-4 shrink-0 rounded border", cfg.legend)} />
                  <span className="font-medium text-slate-700">{label}</span>
                </div>
              );
            })}
          </div>
        }
      />

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <FOSearchToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search room, category, staff…"
          showFiltersButton={false}
          beforeFilters={
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <div className="relative">
                <DoorOpen className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <SelectInput
                  value={roomTypeFilter}
                  onChange={(e) => setRoomTypeFilter(e.target.value)}
                  className="h-10 w-full rounded-xl border-slate-200 pl-9 sm:w-44"
                >
                  <option value="all">All Room Types</option>
                  {roomTypeOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </SelectInput>
              </div>
              <div className="relative">
                <Layers className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <SelectInput
                  value={floorFilter}
                  onChange={(e) => setFloorFilter(e.target.value)}
                  className="h-10 w-full rounded-xl border-slate-200 pl-9 sm:w-40"
                >
                  <option value="all">All Floors</option>
                  {floorOptions.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </SelectInput>
              </div>
            </div>
          }
          filterPills={{
            active: statusFilter,
            onChange: setStatusFilter,
            options: [
              { id: "all", label: `All (${statusCounts.all})` },
              { id: "dirty", label: `Dirty (${statusCounts.dirty})` },
              { id: "occupied", label: `Occupied (${statusCounts.occupied})` },
              { id: "cleaning", label: `Cleaning (${statusCounts.cleaning})` },
              { id: "inspection", label: `Inspection (${statusCounts.inspection})` },
              { id: "ready", label: `Ready (${statusCounts.ready})` },
              { id: "blocked", label: `Blocked (${statusCounts.blocked})` },
            ],
          }}
        />
      </div>

      {filteredRooms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-10 text-center">
          <Building2 className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-sm font-bold text-slate-800">No rooms match filters</h3>
          <p className="mt-1 text-xs text-slate-500">
            Link rooms in Room Master or adjust your filters.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {roomsByFloor.map(({ floor, rooms: floorRooms }) => (
            <section
              key={floor}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-3.5">
                <div className="h-7 w-1 rounded-full bg-emerald-500" />
                <h2 className="text-sm font-semibold text-slate-800">{floor}</h2>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  {floorRooms.length} {floorRooms.length === 1 ? "room" : "rooms"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {floorRooms.map((room) => (
                  <HKRoomStatusCardTile
                    key={roomKey(room)}
                    room={room}
                    task={getRoomTask(room)}
                    onClick={() => handleRoomClick(roomKey(room))}
                  />
                ))}
              </div>
            </section>
          ))}
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
