"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Play, CheckCircle2 } from "lucide-react";
import { hkTaskService } from "@/services/housekeeping";
import type { HKStaff, HKTask } from "./HousekeepingTypes";
import {
  formatTaskStatusLabel,
  formatTaskTypeLabel,
  isTaskOverdue,
} from "./taskUtils";
import {
  formatScheduleDate,
  formatScheduleTime,
} from "@/lib/hk-task-schedule";
import { Button } from "@/components/ui/Button";
import { SelectInput, FormField } from "@/components/frontoffice/ui";

export type CleaningTaskDetailPanelProps = {
  task: HKTask;
  staff: HKStaff[];
  onUpdated?: () => void | Promise<void>;
  roomStatusLink?: string;
};

export function CleaningTaskDetailPanel({
  task,
  staff,
  onUpdated,
  roomStatusLink = "/housekeeping/operations/rooms",
}: CleaningTaskDetailPanelProps) {
  const housekeepers = staff.filter((s) => s.role === "Housekeeper");
  const [assignee, setAssignee] = useState(
    task.assignedToName ?? task.assignedTo ?? housekeepers[0]?.name ?? "",
  );
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setAssignee(
      task.assignedToName ?? task.assignedTo ?? housekeepers[0]?.name ?? "",
    );
  }, [task.id, task.assignedTo, task.assignedToName, housekeepers]);

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

      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-xs space-y-2">
        <div className="flex justify-between">
          <span className="text-slate-400">Task</span>
          <span className="font-bold text-slate-800">
            {task.taskNumber ?? task.id.slice(0, 8)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Room</span>
          <span className="font-semibold text-slate-700">
            {task.roomNo ?? task.roomId}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Type</span>
          <span className="font-semibold text-slate-700">
            {formatTaskTypeLabel(task.taskType)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Status</span>
          <span className="font-bold text-slate-800">
            {formatTaskStatusLabel(task.status)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Priority</span>
          <span className="font-semibold text-slate-700">{task.priority}</span>
        </div>
        {task.bookingNo && (
          <div className="flex justify-between">
            <span className="text-slate-400">Booking</span>
            <span className="font-semibold text-slate-700">{task.bookingNo}</span>
          </div>
        )}
        {task.requestId && (
          <div className="flex justify-between gap-4">
            <span className="text-slate-400 shrink-0">Guest request</span>
            <span className="text-right font-semibold text-slate-700">
              {task.requestNumber ?? task.requestId.slice(0, 8)}
              {task.requestDescription
                ? ` — ${task.requestDescription}`
                : ""}
            </span>
          </div>
        )}
        {(task.scheduledDate || task.scheduledStartAt || task.dueAt) && (
          <div className="space-y-1.5 border-t border-slate-100 pt-2">
            {task.scheduledDate && (
              <div className="flex justify-between">
                <span className="text-slate-400">Cleaning date</span>
                <span className="font-semibold text-slate-700">
                  {formatScheduleDate(task.scheduledDate)}
                </span>
              </div>
            )}
            {(task.scheduledStartAt || task.dueAt) && (
              <div className="flex justify-between gap-4">
                <span className="text-slate-400 shrink-0">Time window</span>
                <span className="text-right font-semibold text-slate-700">
                  {formatScheduleTime(task.scheduledStartAt)}
                  {" – "}
                  {formatScheduleTime(task.dueAt)}
                </span>
              </div>
            )}
            {isTaskOverdue(task) && (
              <p className="text-[11px] font-semibold text-red-600">Overdue</p>
            )}
          </div>
        )}
        {task.notes && (
          <div className="pt-2 border-t border-slate-100 text-slate-600">
            <strong>Notes:</strong> {task.notes}
          </div>
        )}
      </div>

      {(task.status === "PENDING" || task.status === "ASSIGNED") && (
        <div className="space-y-3">
          <FormField label="Assign Housekeeper">
            <SelectInput
              value={assignee}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setAssignee(e.target.value)
              }
            >
              {housekeepers.length === 0 ? (
                <option value="">No housekeepers configured</option>
              ) : (
                housekeepers.map((h) => (
                  <option key={h.id} value={h.name}>
                    {h.name}
                  </option>
                ))
              )}
            </SelectInput>
          </FormField>
          <Button
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white"
            disabled={actionBusy || !assignee}
            onClick={() =>
              void runTaskAction(() => hkTaskService.assign(task.id, assignee))
            }
          >
            Assign Task
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

      <Link
        href={roomStatusLink}
        className="block text-center text-xs text-emerald-700 hover:underline"
      >
        View room status board →
      </Link>
    </div>
  );
}
