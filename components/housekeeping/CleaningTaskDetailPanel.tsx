"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Play,
  CheckCircle2,
  CalendarDays,
  BookOpen,
  MessageSquare,
  Users,
  XCircle,
} from "lucide-react";
import { hkTaskService } from "@/services/housekeeping";
import type { HKTask } from "./HousekeepingTypes";
import { useHrHousekeepers } from "./useHrHousekeepers";
import { StaffAvatar, StaffMultiSelect } from "./StaffMultiSelect";
import { cn } from "@/lib/utils";
import {
  formatTaskStatusLabel,
  formatTaskTypeLabel,
  isTaskOverdue,
} from "./taskUtils";
import { formatScheduleDate } from "@/lib/hk-task-schedule";
import { Button } from "@/components/ui/Button";

export type CleaningTaskDetailPanelProps = {
  task: HKTask;
  onUpdated?: () => void | Promise<void>;
  roomStatusLink?: string;
};

export function CleaningTaskDetailPanel({
  task,
  onUpdated,
  roomStatusLink = "/housekeeping/operations/rooms",
}: CleaningTaskDetailPanelProps) {
  const { housekeepers, loading: loadingStaff } = useHrHousekeepers();

  const currentAssigneeIds = useMemo(() => {
    const keys = task.assignedStaffIds?.length
      ? task.assignedStaffIds
      : task.assignedTo
        ? [task.assignedTo]
        : [];
    return keys
      .map((key) => housekeepers.find((h) => h.id === key || h.name === key)?.id)
      .filter((id): id is string => Boolean(id));
  }, [task.assignedStaffIds, task.assignedTo, housekeepers]);

  const assignedNames = useMemo(() => {
    if (task.assignedStaffNames?.length) return task.assignedStaffNames;
    return task.assignedToName ? [task.assignedToName] : [];
  }, [task.assignedStaffNames, task.assignedToName]);

  const [assignees, setAssignees] = useState<string[]>([]);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [closeOpen, setCloseOpen] = useState(false);
  const [closeReason, setCloseReason] = useState("");

  const currentKey = currentAssigneeIds.join("|");
  useEffect(() => {
    setAssignees(currentKey ? currentKey.split("|") : []);
  }, [task.id, currentKey]);

  const unchanged =
    [...assignees].sort().join("|") === [...currentAssigneeIds].sort().join("|");
  const overdue = isTaskOverdue(task);

  const runTaskAction = async (fn: () => Promise<unknown>) => {
    setActionBusy(true);
    setActionError(null);
    try {
      await fn();
      await onUpdated?.();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {actionError && (
        <p className="text-xs font-medium text-red-600 rounded-lg bg-red-50 px-3 py-2">
          {actionError}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-3 bg-gradient-to-r from-emerald-50 to-white px-4 py-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {task.taskNumber ?? task.id.slice(0, 8)}
            </p>
            <p className="text-lg font-bold leading-tight text-slate-900">
              Room {task.roomNo ?? task.roomId}
            </p>
            <p className="text-xs text-slate-500">{formatTaskTypeLabel(task.taskType)}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase",
                STATUS_BADGE[task.status] ?? "border-slate-200 bg-slate-50 text-slate-600",
              )}
            >
              {formatTaskStatusLabel(task.status)}
            </span>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase",
                PRIORITY_BADGE[task.priority] ?? "border-slate-200 bg-slate-50 text-slate-600",
              )}
            >
              {task.priority}
            </span>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-3 text-xs">
          <DetailItem icon={CalendarDays} label="Cleaning date">
            {task.scheduledDate ? formatScheduleDate(task.scheduledDate) : "—"}
            {overdue && (
              <span className="ml-1.5 rounded bg-red-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red-600">
                Overdue
              </span>
            )}
          </DetailItem>
          <DetailItem icon={BookOpen} label="Booking">
            {task.bookingNo ?? "—"}
          </DetailItem>
          {task.requestId && (
            <div className="col-span-2">
              <DetailItem icon={MessageSquare} label="Guest request">
                {task.requestNumber ?? task.requestId.slice(0, 8)}
                {task.requestDescription ? ` — ${task.requestDescription}` : ""}
              </DetailItem>
            </div>
          )}
          <div className="col-span-2">
            <DetailItem icon={Users} label="Assigned team">
              {assignedNames.length ? (
                <span className="mt-0.5 flex flex-wrap gap-1">
                  {assignedNames.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 py-0.5 pl-0.5 pr-2 text-[11px] font-semibold text-slate-700"
                    >
                      <StaffAvatar id={name} name={name} size="xs" />
                      {name}
                    </span>
                  ))}
                </span>
              ) : (
                <span className="text-slate-400">Unassigned</span>
              )}
            </DetailItem>
          </div>
        </dl>

        {task.notes && (
          <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Notes: </span>
            {task.notes}
          </div>
        )}
      </div>

      {(task.status === "PENDING" || task.status === "ASSIGNED") && (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              {currentAssigneeIds.length ? "Update team" : "Assign team"}
            </h4>
            <p className="text-[11px] text-slate-500">Select one or more housekeepers.</p>
          </div>
          <StaffMultiSelect
            staff={housekeepers}
            value={assignees}
            onChange={setAssignees}
            loading={loadingStaff}
            placeholder="Select housekeepers…"
          />
          <Button
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white"
            disabled={actionBusy || assignees.length === 0 || unchanged}
            onClick={() =>
              void runTaskAction(() => hkTaskService.assign(task.id, assignees))
            }
          >
            {assignees.length > 1 ? `Assign ${assignees.length} staff` : "Assign Task"}
          </Button>
          {(task.status === "ASSIGNED" || task.assignedTo) && (
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              disabled={actionBusy}
              onClick={() =>
                void runTaskAction(() => hkTaskService.start(task.id))
              }
            >
              <Play className="h-4 w-4" /> Start Cleaning
            </Button>
          )}
        </div>
      )}

      {task.status === "IN_PROGRESS" && (
        <Button
          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center gap-2"
          disabled={actionBusy}
          onClick={() =>
            void runTaskAction(() =>
              hkTaskService.complete(task.id, {
                notes: task.notes ?? undefined,
              }),
            )
          }
        >
          <CheckCircle2 className="h-4 w-4" /> Mark Complete
        </Button>
      )}

      {task.status === "PENDING_INSPECTION" && (
        <div className="space-y-3">
          <p className="text-xs text-blue-700 font-medium rounded-lg bg-blue-50 px-3 py-2 leading-relaxed">
            Cleaning is finished. Supervisor must pass or reject this task on the{" "}
            <strong>Cleaning Inspection</strong> page — inspection is not done here.
          </p>
          <Link href={`/housekeeping/operations/inspection?room=${encodeURIComponent(task.roomNo ?? task.roomId)}`}>
            <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white">
              Open Cleaning Inspection →
            </Button>
          </Link>
        </div>
      )}

      {task.status === "APPROVED" && (
        <p className="text-xs text-emerald-700 text-center font-medium">
          Task approved — room is ready for sale.
        </p>
      )}

      {task.status === "CANCELLED" && (
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-center text-xs font-medium text-slate-600">
          This task was closed and is no longer active.
        </p>
      )}

      {task.status !== "APPROVED" && task.status !== "CANCELLED" && (
        closeOpen ? (
          <div className="space-y-3 rounded-2xl border border-red-200 bg-red-50/40 p-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Close this task?</h4>
              <p className="text-[11px] text-slate-500">
                The task is cancelled and removed from active tasks. It stays on All Tasks.
              </p>
            </div>
            <textarea
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              rows={2}
              placeholder="Reason (optional) — e.g. guest declined service"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                disabled={actionBusy}
                onClick={() => {
                  setCloseOpen(false);
                  setCloseReason("");
                }}
              >
                Keep Task
              </Button>
              <Button
                className="flex-1 bg-red-600 text-white hover:bg-red-700"
                disabled={actionBusy}
                onClick={() =>
                  void runTaskAction(async () => {
                    const reason = closeReason.trim();
                    const notes = reason
                      ? [task.notes, `Closed: ${reason}`].filter(Boolean).join("\n")
                      : undefined;
                    await hkTaskService.cancel(task.id, notes ? { notes } : undefined);
                    setCloseOpen(false);
                    setCloseReason("");
                  })
                }
              >
                {actionBusy ? "Closing…" : "Close Task"}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
            disabled={actionBusy}
            onClick={() => setCloseOpen(true)}
          >
            <XCircle className="h-4 w-4" /> Close Task
          </Button>
        )
      )}

      <Link
        href={roomStatusLink}
        className="block text-center text-xs text-emerald-700 hover:underline"
      >
        View room status board →
      </Link>
    </div>
  );
}

const STATUS_BADGE: Partial<Record<HKTask["status"], string>> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  ASSIGNED: "border-indigo-200 bg-indigo-50 text-indigo-700",
  IN_PROGRESS: "border-sky-200 bg-sky-50 text-sky-700",
  PENDING_INSPECTION: "border-blue-200 bg-blue-50 text-blue-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELLED: "border-slate-300 bg-slate-100 text-slate-600",
};

const PRIORITY_BADGE: Record<string, string> = {
  LOW: "border-slate-200 bg-slate-50 text-slate-600",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-700",
  HIGH: "border-orange-200 bg-orange-50 text-orange-700",
  URGENT: "border-red-200 bg-red-600 text-white",
};

function DetailItem({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        <Icon className="h-3 w-3" />
        {label}
      </dt>
      <dd className="mt-0.5 font-semibold text-slate-800">{children}</dd>
    </div>
  );
}
