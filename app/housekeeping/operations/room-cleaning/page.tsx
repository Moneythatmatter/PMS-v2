"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useHousekeeping } from "@/components/housekeeping/HousekeepingContext";
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
  isActiveTask,
  isTaskOverdue,
} from "@/components/housekeeping/taskUtils";
import { CleaningTaskDetailPanel } from "@/components/housekeeping/CleaningTaskDetailPanel";
import { CreateCleaningTaskForm } from "@/components/housekeeping/CreateCleaningTaskForm";
import {
  Clock,
  CheckCircle2,
  User,
  Sparkles,
  ClipboardList,
  Plus,
  ListTodo,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import {
  FOPageHeader,
  StatMiniCard,
} from "@/components/frontoffice/ui";
import { OperationsToolbar } from "@/components/housekeeping/OperationsToolbar";

const STATUS_TABS = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "pending", label: "Pending" },
  { id: "guest-requests", label: "Guest Requests" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "PENDING_INSPECTION", label: "Awaiting Inspection" },
  { id: "APPROVED", label: "Approved" },
  { id: "CANCELLED", label: "Cancelled" },
];

function statusPillClass(tone: ReturnType<typeof taskStatusTone>) {
  switch (tone) {
    case "amber":
      return "bg-amber-50 text-amber-700";
    case "blue":
      return "bg-blue-50 text-blue-700";
    case "emerald":
      return "bg-emerald-50 text-emerald-700";
    case "red":
      return "bg-red-50 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function RoomCleaningOperations() {
  const { staff } = useHousekeeping();

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
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

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

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (task.taskNumber ?? "").toLowerCase().includes(q) ||
        (task.roomNo ?? task.roomId).toLowerCase().includes(q) ||
        formatTaskTypeLabel(task.taskType).toLowerCase().includes(q) ||
        (task.assignedToName ?? task.assignedTo ?? "").toLowerCase().includes(q);

      let matchStatus = true;
      if (statusFilter === "open") {
        matchStatus = isActiveTask(task);
      } else if (statusFilter === "pending") {
        matchStatus = task.status === "PENDING" || task.status === "ASSIGNED";
      } else if (statusFilter !== "all") {
        matchStatus = task.status === statusFilter;
      }

      return matchSearch && matchStatus;
    });
  }, [tasks, search, statusFilter]);

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

  const stats = useMemo(() => {
    return {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === "PENDING" || t.status === "ASSIGNED").length,
      inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      awaiting: tasks.filter(
        (t) => t.status === "PENDING_INSPECTION" || t.status === "COMPLETED",
      ).length,
      approved: tasks.filter((t) => t.status === "APPROVED").length,
      guestRequests: openCleaningRequests.length,
    };
  }, [tasks, openCleaningRequests]);

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
    openCreateDrawer({ guestRequest: request });
  };

  const openTask = (task: HKTask) => {
    setSelectedTaskId(task.id);
  };

  return (
    <div className="space-y-5">
      <FOPageHeader
        eyebrow="Operations"
        title="Cleaning Tasks"
        description="Create tasks, assign housekeepers, and mark cleaning complete. Pass/fail inspection is done on Cleaning Inspection."
        badge={
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-650">
            <ListTodo className="h-4 w-4 text-emerald-600" />
            {stats.inProgress} in progress
          </div>
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatMiniCard label="Total Tasks" value={stats.total} icon={ListTodo} accent="#64748b" />
        <StatMiniCard label="Pending" value={stats.pending} accent="#94a3b8" icon={Clock} />
        <StatMiniCard label="In Progress" value={stats.inProgress} accent="#f59e0b" icon={Sparkles} />
        <StatMiniCard label="Guest Requests" value={stats.guestRequests} accent="#8b5cf6" icon={MessageSquare} />
        <StatMiniCard label="Awaiting Inspection" value={stats.awaiting} accent="#3b82f6" icon={ClipboardList} />
        <StatMiniCard label="Approved" value={stats.approved} accent="#10b981" icon={CheckCircle2} />
      </div>

      <OperationsToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search task #, room, guest request, staff…"
        activeFilterCount={0}
        onOpenFilters={() => {}}
        statusTabs={STATUS_TABS}
        activeStatusTab={statusFilter}
        onStatusTabChange={setStatusFilter}
      />

      <p className="text-[11px] text-slate-500 -mt-2">
        <strong className="font-semibold text-slate-600">Workflow:</strong> Create task → Assign → Start → Mark complete →{" "}
        <Link href="/housekeeping/operations/inspection" className="text-emerald-700 hover:underline font-semibold">
          Cleaning Inspection
        </Link>{" "}
        (pass or reject).{" "}
        <strong className="font-semibold text-slate-600">Pending</strong> = not started ·{" "}
        <strong className="font-semibold text-slate-600">Awaiting Inspection</strong> = ready for supervisor
      </p>

      {!loading && statusFilter !== "guest-requests" && openCleaningRequests.length > 0 && (
        <div className="rounded-2xl border border-violet-200 bg-violet-50/30 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Open guest cleaning requests</h3>
              <p className="text-[11px] text-slate-500">
                Room-cleaning requests from guests — create a task to assign housekeeping.
              </p>
            </div>
            <Button
              variant="outline"
              className="text-xs"
              onClick={() => setStatusFilter("guest-requests")}
            >
              View all ({openCleaningRequests.length})
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {openCleaningRequests.slice(0, 3).map((request) => (
              <div
                key={request.id}
                className="rounded-xl border border-violet-100 bg-white p-4 text-left"
              >
                <p className="text-xs font-bold text-slate-800">
                  {request.requestNumber ?? request.id.slice(0, 8)} · Room{" "}
                  {request.roomNo ?? request.roomId}
                </p>
                <p className="mt-1 line-clamp-2 text-[11px] text-slate-600">
                  {request.description}
                </p>
                <Button
                  size="sm"
                  className="mt-3 h-8 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px]"
                  onClick={() => openCreateFromRequest(request)}
                >
                  Create task
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-center text-sm text-slate-500 py-12">Loading…</p>
      ) : statusFilter === "guest-requests" ? (
        filteredGuestRequests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-10 text-center">
            <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-3 text-sm font-bold text-slate-800">No open cleaning guest requests</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
              Guest room-cleaning requests from in-house bookings appear here until a cleaning task is created.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredGuestRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-xl border border-violet-200 bg-white p-5 text-left ring-1 ring-violet-100/60"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      {request.requestNumber ?? request.id.slice(0, 8)}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Room {request.roomNo ?? request.roomId} ·{" "}
                      {formatGuestRequestTypeLabel(request.requestType)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-violet-700">
                    {request.status.replace(/_/g, " ")}
                  </span>
                </div>

                <p className="mt-3 text-xs text-slate-700 line-clamp-3">{request.description}</p>

                <div className="mt-4 space-y-1 text-[11px] text-slate-500">
                  {request.guestName && <p>Guest: {request.guestName}</p>}
                  {request.bookingNo && <p>Booking: {request.bookingNo}</p>}
                  <p>Priority: {request.priority}</p>
                </div>

                <Button
                  className="mt-4 w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs"
                  onClick={() => openCreateFromRequest(request)}
                >
                  Create cleaning task
                </Button>
              </div>
            ))}
          </div>
        )
      ) : filteredTasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-10 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-sm font-bold text-slate-800">No cleaning tasks</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            Tasks are created on guest check-out or manually for deep cleans and special work.
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
          {filteredTasks.map((task) => {
            const tone = taskStatusTone(task.status);
            const inProgress = task.status === "IN_PROGRESS";
            const overdue = isTaskOverdue(task);
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => openTask(task)}
                className={cn(
                  "rounded-xl border bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
                  overdue
                    ? "border-red-200 ring-2 ring-red-100/60"
                    : inProgress
                      ? "border-amber-200 ring-2 ring-amber-100/50"
                      : "border-slate-200",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      {task.taskNumber ?? task.id.slice(0, 8)}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Room {task.roomNo ?? task.roomId} · {formatTaskTypeLabel(task.taskType)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                        statusPillClass(tone),
                        inProgress && "animate-pulse",
                      )}
                    >
                      {formatTaskStatusLabel(task.status)}
                    </span>
                    {overdue && (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-red-700">
                        Overdue
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{task.assignedToName ?? task.assignedTo ?? "Unassigned"}</span>
                  </div>
                  <span className="font-semibold uppercase text-[10px] text-slate-400">
                    {task.priority}
                  </span>
                </div>

                {task.notes ? (
                  <p className="mt-3 line-clamp-2 text-[11px] text-slate-500">{task.notes}</p>
                ) : null}
              </button>
            );
          })}
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
            ? "Schedule and create a cleaning task from this guest request."
            : "Select a room, set the schedule, and create one cleaning task."
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
            staff={staff}
            onUpdated={reloadTasks}
          />
        )}
      </Drawer>
    </div>
  );
}
