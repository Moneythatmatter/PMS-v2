"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useHousekeeping } from "@/components/housekeeping/HousekeepingContext";
import { hkTaskService } from "@/services/housekeeping";
import { roomService, type RoomDto } from "@/services/front-office/rooms";
import type { HKTask } from "@/components/housekeeping/HousekeepingTypes";
import {
  formatTaskTypeLabel,
  formatTaskStatusLabel,
  taskStatusTone,
  isActiveTask,
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
  { id: "active", label: "Active" },
  { id: "PENDING", label: "Pending" },
  { id: "ASSIGNED", label: "Assigned" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "COMPLETED", label: "Awaiting Approval" },
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
  const [foRooms, setFoRooms] = useState<RoomDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createRoomId, setCreateRoomId] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const reloadTasks = async () => {
    const taskList = await hkTaskService.list();
    setTasks(taskList);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [taskList, roomList] = await Promise.all([
          hkTaskService.list(),
          roomService.list(),
        ]);
        if (!cancelled) {
          setTasks(taskList);
          setFoRooms(roomList);
        }
      } catch {
        if (!cancelled) setTasks([]);
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
      if (statusFilter === "active") {
        matchStatus = isActiveTask(task);
      } else if (statusFilter !== "all") {
        matchStatus = task.status === statusFilter;
      }

      return matchSearch && matchStatus;
    });
  }, [tasks, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === "PENDING" || t.status === "ASSIGNED").length,
      inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      awaiting: tasks.filter((t) => t.status === "COMPLETED").length,
      approved: tasks.filter((t) => t.status === "APPROVED").length,
    };
  }, [tasks]);

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId],
  );

  const handleCreateTaskSuccess = async () => {
    await reloadTasks();
    setCreateOpen(false);
    setCreateRoomId("");
  };

  const openTask = (task: HKTask) => {
    setSelectedTaskId(task.id);
  };

  return (
    <div className="space-y-5">
      <FOPageHeader
        eyebrow="Operations"
        title="Cleaning Tasks"
        description="Housekeeping work orders from checkout, requests, and manual scheduling."
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
              onClick={() => {
                if (!createRoomId && foRooms[0]?.id) {
                  setCreateRoomId(foRooms[0].id);
                }
                setCreateOpen(true);
              }}
              className="bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> Create Task
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatMiniCard label="Total Tasks" value={stats.total} icon={ListTodo} accent="#64748b" />
        <StatMiniCard label="Pending / Assigned" value={stats.pending} accent="#94a3b8" icon={Clock} />
        <StatMiniCard label="In Progress" value={stats.inProgress} accent="#f59e0b" icon={Sparkles} />
        <StatMiniCard label="Awaiting Approval" value={stats.awaiting} accent="#3b82f6" icon={ClipboardList} />
        <StatMiniCard label="Approved" value={stats.approved} accent="#10b981" icon={CheckCircle2} />
      </div>

      <OperationsToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search task #, room, type, staff…"
        activeFilterCount={0}
        onOpenFilters={() => {}}
        statusTabs={STATUS_TABS}
        activeStatusTab={statusFilter}
        onStatusTabChange={setStatusFilter}
      />

      {loading ? (
        <p className="text-center text-sm text-slate-500 py-12">Loading tasks…</p>
      ) : filteredTasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-10 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-sm font-bold text-slate-800">No cleaning tasks</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            Tasks are created on guest check-out or manually for deep cleans and special work.
          </p>
          <Button
            onClick={() => setCreateOpen(true)}
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
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => openTask(task)}
                className={cn(
                  "rounded-xl border bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
                  inProgress ? "border-amber-200 ring-2 ring-amber-100/50" : "border-slate-200",
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
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                      statusPillClass(tone),
                      inProgress && "animate-pulse",
                    )}
                  >
                    {formatTaskStatusLabel(task.status)}
                  </span>
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
        onClose={() => setCreateOpen(false)}
        title="Create Cleaning Task"
        description="Assign work to a room — booking is optional (e.g. deep clean on vacant room)."
      >
        <CreateCleaningTaskForm
          foRooms={foRooms}
          initialRoomId={createRoomId}
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
