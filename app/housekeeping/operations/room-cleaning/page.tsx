"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { hkGuestRequestService, hkTaskService } from "@/services/housekeeping";
import { roomService, type RoomDto } from "@/services/front-office/rooms";
import type { HKTask } from "@/components/housekeeping/HousekeepingTypes";
import type { GuestRequestDto } from "@/components/housekeeping/guestRequestUtils";
import {
  formatGuestRequestTypeLabel,
  isCleaningGuestRequest,
  isOpenGuestRequest,
} from "@/components/housekeeping/guestRequestUtils";
import {
  formatTaskTypeLabel,
  formatTaskStatusLabel,
  taskStatusTone,
  isTaskOverdue,
} from "@/components/housekeeping/taskUtils";
import { CleaningTaskDetailPanel } from "@/components/housekeeping/CleaningTaskDetailPanel";
import { CleaningRequestDetailPanel } from "@/components/housekeeping/CleaningRequestDetailPanel";
import { formatShortDateTime } from "@/components/housekeeping/detailParts";
import { StaffAvatarStack } from "@/components/housekeeping/StaffMultiSelect";
import { taskAssigneeNames } from "@/components/housekeeping/taskUtils";
import { CreateCleaningTaskForm } from "@/components/housekeeping/CreateCleaningTaskForm";
import {
  AlertTriangle,
  BedDouble,
  History,
  Sparkles,
  ClipboardList,
  Plus,
  ListTodo,
  ArrowRight,
  Search,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { FOPageHeader } from "@/components/frontoffice/ui";
import { useHousekeeping } from "@/components/housekeeping/HousekeepingContext";
import { roomKey } from "@/components/housekeeping/roomUtils";
import { matchesHkStatusFilter } from "@/lib/housekeeping/room-status-colors";

const TILE_TONES = {
  slate: { icon: "bg-slate-100 text-slate-600", ring: "border-slate-400 ring-slate-100" },
  rose: { icon: "bg-rose-50 text-rose-600", ring: "border-rose-400 ring-rose-100" },
  amber: { icon: "bg-amber-50 text-amber-600", ring: "border-amber-400 ring-amber-100" },
  blue: { icon: "bg-blue-50 text-blue-600", ring: "border-blue-400 ring-blue-100" },
  red: { icon: "bg-red-50 text-red-600", ring: "border-red-400 ring-red-100" },
} as const;

function FilterTile({
  label,
  sub,
  value,
  icon: Icon,
  tone,
  active,
  onClick,
}: {
  label: string;
  sub: string;
  value: number;
  icon: LucideIcon;
  tone: keyof typeof TILE_TONES;
  active: boolean;
  onClick: () => void;
}) {
  const t = TILE_TONES[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-white p-3.5 text-left transition-all hover:shadow-sm",
        active ? cn("ring-4", t.ring) : "border-slate-200 hover:border-slate-300",
      )}
    >
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", t.icon)}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-xl font-bold leading-tight text-slate-900">{value}</span>
        <span className="block truncate text-xs font-semibold text-slate-700">{label}</span>
        <span className="block truncate text-[10px] text-slate-400">{sub}</span>
      </span>
    </button>
  );
}

function Pill({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
        className,
      )}
    >
      {children}
    </span>
  );
}

function priorityPillClass(priority: string) {
  switch (priority.toUpperCase()) {
    case "URGENT":
      return "bg-red-600 text-white";
    case "HIGH":
      return "bg-orange-500 text-white";
    case "MEDIUM":
    case "NORMAL":
      return "bg-white text-amber-700 ring-1 ring-amber-200";
    default:
      return "bg-white text-slate-600 ring-1 ring-slate-200";
  }
}

function CreateTaskButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      size="sm"
      className="h-8 w-full bg-emerald-700 text-[11px] text-white hover:bg-emerald-800"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <Plus className="mr-1 h-3.5 w-3.5" /> Create Task
    </Button>
  );
}

const CARD_TINTS = {
  inProgress: { accent: "bg-amber-500", tint: "border-amber-200 bg-amber-50/70" },
  overdue: { accent: "bg-red-500", tint: "border-red-200 bg-red-50/70" },
  awaiting: { accent: "bg-blue-500", tint: "border-blue-200 bg-blue-50/70" },
  task: { accent: "bg-sky-400", tint: "border-slate-200 bg-white" },
  dirty: { accent: "bg-rose-500", tint: "border-rose-200 bg-rose-50/60" },
  request: { accent: "bg-violet-500", tint: "border-violet-200 bg-violet-50/60" },
} as const;

function taskCardTint(task: HKTask) {
  if (task.status === "IN_PROGRESS") return isTaskOverdue(task) ? CARD_TINTS.overdue : CARD_TINTS.inProgress;
  if (isTaskOverdue(task)) return CARD_TINTS.overdue;
  if (task.status === "PENDING_INSPECTION" || task.status === "COMPLETED") return CARD_TINTS.awaiting;
  return CARD_TINTS.task;
}

function taskSortRank(task: HKTask) {
  if (task.status === "IN_PROGRESS") return 0;
  if (isTaskOverdue(task)) return 1;
  if (task.status === "PENDING_INSPECTION" || task.status === "COMPLETED") return 2;
  return 3;
}

function floorLabel(floor?: string | number | null) {
  if (floor === undefined || floor === null || floor === "") return null;
  const s = String(floor);
  return /floor/i.test(s) ? s : `Floor ${s}`;
}

function BoardCard({
  accent,
  tint,
  roomNo,
  subtitle,
  badges,
  body,
  footer,
  onClick,
}: {
  accent: string;
  tint: string;
  roomNo: string;
  subtitle: string;
  badges: React.ReactNode;
  body?: React.ReactNode;
  footer: React.ReactNode;
  onClick: () => void;
}) {
  const content = (
    <>
      <span className={cn("absolute inset-y-0 left-0 w-1", accent)} />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Room</p>
          <h3 className="text-2xl font-bold leading-none text-slate-900">{roomNo}</h3>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">{badges}</div>
      </div>
      <p className="mt-2 truncate text-xs font-medium text-slate-500">{subtitle || "\u00a0"}</p>
      <div className="mt-2 min-h-[2rem]">{body}</div>
      <div className="mt-auto border-t border-black/5 pt-3">{footer}</div>
    </>
  );
  const base = cn(
    "relative flex h-full min-h-[11rem] flex-col overflow-hidden rounded-xl border p-4 pl-5 text-left",
    tint,
  );
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        base,
        "cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300",
      )}
    >
      {content}
    </div>
  );
}

function RoomDetail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 truncate font-semibold text-slate-800">{children}</dd>
    </div>
  );
}

const isCurrentTask = (task: HKTask) => task.status !== "APPROVED" && task.status !== "CANCELLED";

function statusPillClass(tone: ReturnType<typeof taskStatusTone>) {
  switch (tone) {
    case "amber":
      return "bg-amber-100 text-amber-800";
    case "blue":
      return "bg-blue-100 text-blue-700";
    case "emerald":
      return "bg-emerald-100 text-emerald-700";
    case "red":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function RoomCleaningOperations() {
  const { rooms: hkRooms } = useHousekeeping();
  const [tasks, setTasks] = useState<HKTask[]>([]);
  const [guestRequests, setGuestRequests] = useState<GuestRequestDto[]>([]);
  const [foRooms, setFoRooms] = useState<RoomDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createFormKey, setCreateFormKey] = useState(0);
  const [createRoomId, setCreateRoomId] = useState("");
  const [createFromRequest, setCreateFromRequest] = useState<GuestRequestDto | null>(
    null,
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedDirtyRoomNo, setSelectedDirtyRoomNo] = useState<string | null>(null);

  const reloadTasks = async () => {
    const [taskList, requestList] = await Promise.all([
      hkTaskService.list(),
      hkGuestRequestService.list("?requestType=CLEANING"),
    ]);
    setTasks(taskList);
    setGuestRequests(requestList);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [taskList, requestList, roomList] = await Promise.all([
          hkTaskService.list(),
          hkGuestRequestService.list("?requestType=CLEANING"),
          roomService.list(),
        ]);
        if (!cancelled) {
          setTasks(taskList);
          setGuestRequests(requestList);
          setFoRooms(roomList);
        }
      } catch {
        if (!cancelled) {
          setTasks([]);
          setGuestRequests([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeTasks = useMemo(() => tasks.filter(isCurrentTask), [tasks]);

  const filteredTasks = useMemo(() => {
    return activeTasks.filter((task) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (task.taskNumber ?? "").toLowerCase().includes(q) ||
        (task.roomNo ?? task.roomId).toLowerCase().includes(q) ||
        formatTaskTypeLabel(task.taskType).toLowerCase().includes(q) ||
        taskAssigneeNames(task).join(" ").toLowerCase().includes(q);
      
      let matchStatus = true;
      if (statusFilter === "needs-task") {
        matchStatus = false;
      } else if (statusFilter === "awaiting") {
        matchStatus = task.status === "PENDING_INSPECTION" || task.status === "COMPLETED";
      } else if (statusFilter === "overdue") {
        matchStatus = isTaskOverdue(task);
      } else if (statusFilter !== "all") {
        matchStatus = task.status === statusFilter;
      }

      return matchSearch && matchStatus;
    });
  }, [activeTasks, search, statusFilter]);

  const sortedTasks = useMemo(
    () => [...filteredTasks].sort((a, b) => taskSortRank(a) - taskSortRank(b)),
    [filteredTasks],
  );

  const linkedRequestIds = useMemo(
    () =>
      new Set(
        tasks.map((task) => task.requestId).filter(Boolean) as string[],
      ),
    [tasks],
  );

  const openCleaningRequests = useMemo(() => {
    return guestRequests.filter(
      (request) =>
        isCleaningGuestRequest(request) &&
        isOpenGuestRequest(request) &&
        !linkedRequestIds.has(request.id),
    );
  }, [guestRequests, linkedRequestIds]);

  const filteredGuestRequests = useMemo(() => {
    const q = search.toLowerCase();
    return openCleaningRequests.filter((request) => {
      if (!q) return true;
      return (
        (request.requestNumber ?? "").toLowerCase().includes(q) ||
        (request.roomNo ?? request.roomId).toLowerCase().includes(q) ||
        request.description.toLowerCase().includes(q) ||
        (request.guestName ?? "").toLowerCase().includes(q) ||
        (request.bookingNo ?? request.bookingId ?? "").toLowerCase().includes(q)
      );
    });
  }, [openCleaningRequests, search]);

  const dirtyRooms = useMemo(() => {
    const roomsWithTask = new Set(
      activeTasks.flatMap((t) => [t.roomId, t.roomNo].filter(Boolean) as string[]),
    );
    return hkRooms
      .filter((r) => r.hkStatus === "Dirty" || matchesHkStatusFilter(r.status, "dirty"))
      .filter(
        (r) =>
          ![r.roomNo, r.roomId, r.roomRefId, r.id]
            .filter(Boolean)
            .some((k) => roomsWithTask.has(String(k))),
      )
      .sort((a, b) => a.roomNo.localeCompare(b.roomNo, undefined, { numeric: true }));
  }, [hkRooms, activeTasks]);

  const showsNeedsTask = statusFilter === "all" || statusFilter === "needs-task";

  const visibleDirtyRooms = (() => {
    if (!showsNeedsTask) return [];
    const q = search.trim().toLowerCase();
    if (!q) return dirtyRooms;
    return dirtyRooms.filter((r) =>
      [r.roomNo, r.category, r.type, r.floor].some((v) => String(v ?? "").toLowerCase().includes(q)),
    );
  })();

  const visibleRequests = showsNeedsTask ? filteredGuestRequests : [];

  const openCreateForDirtyRoom = (roomNo: string) => {
    setSelectedDirtyRoomNo(null);
    const foRoom = foRooms.find((r) => r.roomNo === roomNo);
    openCreateDrawer({ roomId: foRoom ? roomKey(foRoom) : roomNo });
  };

  const stats = useMemo(() => {
    return {
      active: activeTasks.length,
      inProgress: activeTasks.filter((t) => t.status === "IN_PROGRESS").length,
      awaiting: activeTasks.filter(
        (t) => t.status === "PENDING_INSPECTION" || t.status === "COMPLETED",
      ).length,
      overdue: activeTasks.filter(isTaskOverdue).length,
      guestRequests: openCleaningRequests.length,
      needsTask: openCleaningRequests.length + dirtyRooms.length,
    };
  }, [activeTasks, openCleaningRequests, dirtyRooms]);

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId],
  );

  const openCreateDrawer = (options?: {
    roomId?: string;
    guestRequest?: GuestRequestDto | null;
  }) => {
    setCreateFromRequest(options?.guestRequest ?? null);
    setCreateRoomId(options?.roomId ?? "");
    setCreateFormKey((key) => key + 1);
    setCreateOpen(true);
  };

  const handleCreateTaskSuccess = async () => {
    await reloadTasks();
    setCreateOpen(false);
    setCreateRoomId("");
    setCreateFromRequest(null);
  };

  const openCreateFromRequest = (request: GuestRequestDto) => {
    setSelectedRequestId(null);
    openCreateDrawer({ guestRequest: request });
  };

  const selectedRequest = useMemo(
    () => guestRequests.find((r) => r.id === selectedRequestId) ?? null,
    [guestRequests, selectedRequestId],
  );

  const selectedDirtyRoom = useMemo(
    () => hkRooms.find((r) => r.roomNo === selectedDirtyRoomNo) ?? null,
    [hkRooms, selectedDirtyRoomNo],
  );

  const openTask = (task: HKTask) => {
    setSelectedTaskId(task.id);
  };

  return (
    <div className="space-y-5">
      <FOPageHeader
        eyebrow="Operations"
        title="Cleaning Tasks"
        description="Dirty rooms, guest requests and active cleaning work in one board."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/housekeeping/operations/all-tasks">
              <Button variant="outline" className="flex items-center gap-1.5 text-xs">
                <History className="h-3.5 w-3.5" /> All Tasks
              </Button>
            </Link>
            <Link href="/housekeeping/operations/rooms">
              <Button variant="outline" className="flex items-center gap-1.5 text-xs">
                Room Status <ArrowRight className="h-3.5 w-3.5" />
            </Button>
            </Link>
            <Button
              onClick={() => openCreateDrawer()}
              className="bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> Create Task
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <FilterTile
          label="All"
          sub="Everything open"
          value={stats.active + stats.needsTask}
          icon={ListTodo}
          tone="slate"
          active={statusFilter === "all"}
          onClick={() => setStatusFilter("all")}
        />
        <FilterTile
          label="Needs a Task"
          sub={`${dirtyRooms.length} dirty · ${stats.guestRequests} requests`}
          value={stats.needsTask}
          icon={BedDouble}
          tone="rose"
          active={statusFilter === "needs-task"}
          onClick={() => setStatusFilter("needs-task")}
        />
        <FilterTile
          label="In Progress"
          sub="Being cleaned"
          value={stats.inProgress}
          icon={Sparkles}
          tone="amber"
          active={statusFilter === "IN_PROGRESS"}
          onClick={() => setStatusFilter("IN_PROGRESS")}
        />
        <FilterTile
          label="Awaiting Inspection"
          sub="Ready for supervisor"
          value={stats.awaiting}
          icon={ClipboardList}
          tone="blue"
          active={statusFilter === "awaiting"}
          onClick={() => setStatusFilter("awaiting")}
        />
        <FilterTile
          label="Overdue"
          sub="Past cleaning date"
          value={stats.overdue}
          icon={AlertTriangle}
          tone="red"
          active={statusFilter === "overdue"}
          onClick={() => setStatusFilter("overdue")}
        />
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search room, task #, guest request or staff…"
          className="h-10 w-full rounded-full border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      {loading ? (
        <p className="text-center text-sm text-slate-500 py-12">Loading…</p>
      ) : filteredTasks.length + visibleDirtyRooms.length + visibleRequests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-10 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-sm font-bold text-slate-800">
            {search ? "Nothing matches your search" : "All caught up"}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            Approved and cancelled tasks are on{" "}
            <Link href="/housekeeping/operations/all-tasks" className="font-semibold text-emerald-700 hover:underline">
              All Tasks
            </Link>
            .
          </p>
          <Button
            onClick={() => openCreateDrawer()}
            className="mt-4 bg-emerald-700 hover:bg-emerald-800 text-white"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Create Cleaning Task
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedTasks.map((task) => {
            const tone = taskStatusTone(task.status);
            const inProgress = task.status === "IN_PROGRESS";
            const overdue = isTaskOverdue(task);
            const colors = taskCardTint(task);
            return (
              <BoardCard
                key={task.id}
                onClick={() => openTask(task)}
                accent={colors.accent}
                tint={colors.tint}
                roomNo={task.roomNo ?? task.roomId}
                subtitle={`${task.taskNumber ?? task.id.slice(0, 8)} · ${formatTaskTypeLabel(task.taskType)}`}
                badges={
                  <>
                    <Pill className={cn(statusPillClass(tone), inProgress && "animate-pulse")}>
                      {formatTaskStatusLabel(task.status)}
                    </Pill>
                    {overdue && <Pill className="bg-red-100 text-red-700">Overdue</Pill>}
                  </>
                }
                body={
                  task.notes ? <p className="line-clamp-2 text-xs text-slate-600">{task.notes}</p> : null
                }
                footer={
                  <div className="flex items-center justify-between gap-2">
                    <StaffAvatarStack names={taskAssigneeNames(task)} />
                    {task.priority ? (
                      <Pill className={priorityPillClass(task.priority)}>{task.priority}</Pill>
                    ) : null}
                  </div>
                }
              />
            );
          })}
          {visibleDirtyRooms.map((room) => (
            <BoardCard
              key={`dirty-${room.id ?? room.roomNo}`}
              onClick={() => setSelectedDirtyRoomNo(room.roomNo)}
              accent={CARD_TINTS.dirty.accent}
              tint={CARD_TINTS.dirty.tint}
              roomNo={room.roomNo}
              subtitle={[room.category || room.type, floorLabel(room.floor)].filter(Boolean).join(" · ")}
              badges={<Pill className="bg-rose-100 text-rose-700">Dirty</Pill>}
              body={
                <p className="text-xs text-slate-500">
                  No cleaning task yet
                  {room.foStatus ? <span className="text-slate-400"> · {room.foStatus}</span> : null}
                </p>
              }
              footer={<CreateTaskButton onClick={() => openCreateForDirtyRoom(room.roomNo)} />}
            />
          ))}
          {visibleRequests.map((request) => (
            <BoardCard
              key={`request-${request.id}`}
              onClick={() => setSelectedRequestId(request.id)}
              accent={CARD_TINTS.request.accent}
              tint={CARD_TINTS.request.tint}
              roomNo={request.roomNo ?? request.roomId}
              subtitle={`${request.requestNumber ?? request.id.slice(0, 8)} · ${formatGuestRequestTypeLabel(request.requestType)}`}
              badges={<Pill className="bg-violet-100 text-violet-700">Guest Request</Pill>}
              body={
                <>
                  {request.description ? (
                    <p className="line-clamp-2 text-xs text-slate-600">{request.description}</p>
                  ) : null}
                  {request.guestName ? (
                    <p className="mt-1 truncate text-[11px] text-slate-400">{request.guestName}</p>
                  ) : null}
                </>
              }
              footer={<CreateTaskButton onClick={() => openCreateFromRequest(request)} />}
            />
          ))}
        </div>
      )}

      {/* Create Task Drawer */}
      <Drawer
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setCreateFromRequest(null);
          setCreateRoomId("");
        }}
        title={
          createFromRequest
            ? `Create task — ${createFromRequest.requestNumber ?? createFromRequest.id.slice(0, 8)}`
            : "Create Cleaning Task"
        }
        description={
          createFromRequest
            ? "Create a cleaning task from this guest request."
            : "Select a room and create one cleaning task."
        }
      >
        <CreateCleaningTaskForm
          key={createFormKey}
          foRooms={foRooms}
          initialRoomId={createRoomId}
          sourceGuestRequest={createFromRequest}
          lockRoom={Boolean(createFromRequest)}
          onCreated={() => void handleCreateTaskSuccess()}
        />
      </Drawer>

      {/* Task Detail Drawer */}
      <Drawer
        open={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        title={
          selectedTask
            ? `${selectedTask.taskNumber ?? "Task"} — Room ${selectedTask.roomNo ?? selectedTask.roomId}`
            : "Task"
        }
        description={selectedTask ? formatTaskTypeLabel(selectedTask.taskType) : undefined}
      >
        {selectedTask && (
          <CleaningTaskDetailPanel
            task={selectedTask}
            onUpdated={reloadTasks}
          />
        )}
      </Drawer>

      {/* Guest Request Detail Drawer */}
      <Drawer
        open={!!selectedRequestId}
        onClose={() => setSelectedRequestId(null)}
        title={
          selectedRequest
            ? `${selectedRequest.requestNumber ?? "Request"} — Room ${selectedRequest.roomNo ?? selectedRequest.roomId}`
            : "Guest Request"
        }
        description="Guest cleaning request"
      >
        {selectedRequest && (
          <CleaningRequestDetailPanel
            key={selectedRequest.id}
            request={selectedRequest}
            onCreateTask={openCreateFromRequest}
            onClosed={async () => {
              setSelectedRequestId(null);
              await reloadTasks();
            }}
          />
        )}
      </Drawer>

      {/* Dirty Room Detail Drawer */}
      <Drawer
        open={!!selectedDirtyRoomNo}
        onClose={() => setSelectedDirtyRoomNo(null)}
        title={selectedDirtyRoom ? `Room ${selectedDirtyRoom.roomNo}` : "Room"}
        description="Dirty room — no cleaning task yet"
      >
        {selectedDirtyRoom && (
          <div className="space-y-5">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-start justify-between gap-3 bg-gradient-to-r from-rose-50 to-white px-4 py-3">
                <div>
                  <p className="text-lg font-bold leading-tight text-slate-900">
                    Room {selectedDirtyRoom.roomNo}
                  </p>
                  <p className="text-xs text-slate-500">
                    {[selectedDirtyRoom.category || selectedDirtyRoom.type, floorLabel(selectedDirtyRoom.floor)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <Pill className="bg-rose-100 text-rose-700">Dirty</Pill>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-3 text-xs">
                <RoomDetail label="FO status">{selectedDirtyRoom.foStatus || "—"}</RoomDetail>
                <RoomDetail label="Bed type">{selectedDirtyRoom.bedType || "—"}</RoomDetail>
                <RoomDetail label="Last cleaned">{formatShortDateTime(selectedDirtyRoom.lastCleanedAt)}</RoomDetail>
                <RoomDetail label="Last inspected">{formatShortDateTime(selectedDirtyRoom.lastInspectedAt)}</RoomDetail>
                {selectedDirtyRoom.dnd || selectedDirtyRoom.sleepOut ? (
                  <RoomDetail label="Flags">
                    {[selectedDirtyRoom.dnd && "Do not disturb", selectedDirtyRoom.sleepOut && "Sleep out"]
                      .filter(Boolean)
                      .join(", ")}
                  </RoomDetail>
                ) : null}
              </dl>
              {selectedDirtyRoom.remarks ? (
                <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Remarks: </span>
                  {selectedDirtyRoom.remarks}
                </div>
              ) : null}
            </div>
            <Button
              className="w-full bg-emerald-700 text-white hover:bg-emerald-800 flex items-center justify-center gap-2"
              onClick={() => openCreateForDirtyRoom(selectedDirtyRoom.roomNo)}
            >
              <Plus className="h-4 w-4" /> Create Cleaning Task
            </Button>
            <Link
              href="/housekeeping/operations/rooms"
              className="block text-center text-xs text-emerald-700 hover:underline"
            >
              View room status board →
            </Link>
          </div>
        )}
      </Drawer>
    </div>
  );
}
