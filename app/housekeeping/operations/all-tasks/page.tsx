"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ListTodo } from "lucide-react";
import { hkTaskService } from "@/services/housekeeping";
import type { HKTask, HkTaskPriority, HkTaskType } from "@/components/housekeeping/HousekeepingTypes";
import {
  formatTaskStatusLabel,
  formatTaskTypeLabel,
  isTaskOverdue,
  taskAssigneeNames,
  taskStatusTone,
} from "@/components/housekeeping/taskUtils";
import { CleaningTaskDetailPanel } from "@/components/housekeeping/CleaningTaskDetailPanel";
import { OperationsFilterDrawer, OperationsToolbar } from "@/components/housekeeping/OperationsToolbar";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { FOPageHeader, FormField, SelectInput, TextInput } from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";

const STATUS_TABS = [
  { id: "all", label: "All" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "awaiting", label: "Awaiting Inspection" },
  { id: "APPROVED", label: "Approved" },
  { id: "CANCELLED", label: "Cancelled" },
];

const TASK_TYPES: HkTaskType[] = [
  "CHECKOUT_CLEANING",
  "REGULAR_CLEANING",
  "DEEP_CLEANING",
  "GUEST_REQUEST",
  "TURNDOWN",
  "INSPECTION",
  "OTHER",
];

const PRIORITIES: HkTaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function matchesStatusTab(task: HKTask, tab: string) {
  if (tab === "all") return true;
  if (tab === "awaiting") return task.status === "PENDING_INSPECTION" || task.status === "COMPLETED";
  return task.status === tab;
}

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

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function taskDate(task: HKTask) {
  return String(task.scheduledDate ?? task.createdAt ?? "").slice(0, 10);
}

export default function AllCleaningTasksPage() {
  const [tasks, setTasks] = useState<HKTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const reloadTasks = async () => {
    setTasks(await hkTaskService.list());
  };

  useEffect(() => {
    let cancelled = false;
    hkTaskService
      .list()
      .then((list) => {
        if (!cancelled) setTasks(list);
      })
      .catch(() => {
        if (!cancelled) setTasks([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeFilterCount = [typeFilter, priorityFilter, fromDate, toDate].filter(Boolean).length;

  const baseFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((task) => {
      if (typeFilter && task.taskType !== typeFilter) return false;
      if (priorityFilter && task.priority !== priorityFilter) return false;
      const date = taskDate(task);
      if (fromDate && (!date || date < fromDate)) return false;
      if (toDate && (!date || date > toDate)) return false;
      if (!q) return true;
      return (
        (task.taskNumber ?? "").toLowerCase().includes(q) ||
        (task.roomNo ?? task.roomId).toLowerCase().includes(q) ||
        formatTaskTypeLabel(task.taskType).toLowerCase().includes(q) ||
        taskAssigneeNames(task).join(" ").toLowerCase().includes(q) ||
        (task.notes ?? "").toLowerCase().includes(q)
      );
    });
  }, [tasks, search, typeFilter, priorityFilter, fromDate, toDate]);

  const rows = useMemo(
    () =>
      baseFiltered
        .filter((task) => matchesStatusTab(task, statusTab))
        .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""))),
    [baseFiltered, statusTab],
  );

  const tabsWithCounts = STATUS_TABS.map((tab) => ({
    ...tab,
    count: baseFiltered.filter((task) => matchesStatusTab(task, tab.id)).length,
  }));

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;

  const resetFilters = () => {
    setTypeFilter("");
    setPriorityFilter("");
    setFromDate("");
    setToDate("");
  };

  return (
    <div className="space-y-5">
      <FOPageHeader
        eyebrow="Operations"
        title="All Cleaning Tasks"
        description="Every housekeeping task — active, approved and cancelled — in one list."
        action={
          <Link href="/housekeeping/operations/room-cleaning">
            <Button variant="outline" className="flex items-center gap-1.5 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" /> Active Tasks
            </Button>
          </Link>
        }
      />

      <OperationsToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search task #, room, type, staff, notes…"
        activeFilterCount={activeFilterCount}
        onOpenFilters={() => setFiltersOpen(true)}
        statusTabs={tabsWithCounts}
        activeStatusTab={statusTab}
        onStatusTabChange={setStatusTab}
      />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <p className="py-12 text-center text-sm text-slate-500">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center">
            <ListTodo className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-700">No tasks match these filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Task #</th>
                  <th className="px-4 py-3">Room</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Assigned To</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Started</th>
                  <th className="px-4 py-3">Completed</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((task) => {
                  const overdue = isTaskOverdue(task);
                  const names = taskAssigneeNames(task);
                  return (
                    <tr
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className="cursor-pointer transition-colors hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {task.taskNumber ?? task.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{task.roomNo ?? task.roomId}</td>
                      <td className="px-4 py-3 text-slate-700">{formatTaskTypeLabel(task.taskType)}</td>
                      <td className="max-w-[12rem] truncate px-4 py-3 text-slate-700">
                        {names.length ? names.join(", ") : <span className="text-slate-400">Unassigned</span>}
                      </td>
                      <td className="px-4 py-3 text-[11px] font-semibold uppercase text-slate-500">
                        {task.priority}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{taskDate(task) || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateTime(task.startedAt)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateTime(task.completedAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                              statusPillClass(taskStatusTone(task.status)),
                            )}
                          >
                            {formatTaskStatusLabel(task.status)}
                          </span>
                          {overdue && (
                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700">
                              Overdue
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && rows.length > 0 && (
          <p className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500">
            Showing {rows.length} of {tasks.length} tasks
          </p>
        )}
      </div>

      <OperationsFilterDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onReset={resetFilters}
        activeFilterCount={activeFilterCount}
      >
        <FormField label="Task Type">
          <SelectInput value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All types</option>
            {TASK_TYPES.map((t) => (
              <option key={t} value={t}>
                {formatTaskTypeLabel(t)}
              </option>
            ))}
          </SelectInput>
        </FormField>
        <FormField label="Priority">
          <SelectInput value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0) + p.slice(1).toLowerCase()}
              </option>
            ))}
          </SelectInput>
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="From Date">
            <TextInput type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </FormField>
          <FormField label="To Date">
            <TextInput type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </FormField>
        </div>
      </OperationsFilterDrawer>

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
        {selectedTask && <CleaningTaskDetailPanel task={selectedTask} onUpdated={reloadTasks} />}
      </Drawer>
    </div>
  );
}
