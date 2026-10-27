"use client";

import React, { useEffect, useMemo, useState } from "react";
import { BedDouble, ClipboardList, Info, Play, Users } from "lucide-react";
import { reservationService } from "@/services/front-office/reservations";
import { roomService } from "@/services/front-office/rooms";
import { hkGuestRequestService, hkTaskService } from "@/services/housekeeping";
import {
  type GuestRequestDto,
  OPEN_GUEST_REQUEST_STATUSES,
} from "./guestRequestUtils";
import type { RoomDto } from "@/services/front-office/rooms";
import type { ReservationBooking } from "@/app/data/types";
import type { HKTask, HkTaskType } from "./HousekeepingTypes";
import { formatTaskTypeLabel } from "./taskUtils";
import { useHrHousekeepers } from "./useHrHousekeepers";
import { StaffMultiSelect } from "./StaffMultiSelect";
import { Button } from "@/components/ui/Button";
import { DropdownSelect } from "@/components/ui/DropdownSelect";
import {
  FormField,
  TextAreaInput,
} from "@/components/frontoffice/ui";
import { todayIso } from "@/lib/reservation-dates";
import { formatScheduleDate } from "@/lib/hk-task-schedule";
import { getFoRoomStatusConfig, getFoRoomStatusListBadge } from "@/lib/frontoffice/room-status-colors";
import { isActiveRoomBookingStatus } from "@/lib/frontoffice/active-booking";
import { cn } from "@/lib/utils";

function formatGuestRequestLabel(request: GuestRequestDto): string {
  const label = request.requestNumber ?? request.id.slice(0, 8);
  const desc =
    request.description.length > 48
      ? `${request.description.slice(0, 48)}…`
      : request.description;
  return `${label} — ${desc}`;
}

const TASK_TYPES: HkTaskType[] = [
  "CHECKOUT_CLEANING",
  "REGULAR_CLEANING",
  "DEEP_CLEANING",
  "GUEST_REQUEST",
  "TURNDOWN",
  "INSPECTION",
  "OTHER",
];

const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

function roomKey(room: RoomDto): string {
  return String(room.id ?? room.roomNo);
}

export type CreateCleaningTaskFormProps = {
  foRooms: RoomDto[];
  initialRoomId?: string;
  /** When set, form is prefilled from this guest request — no DB re-fetch. */
  sourceGuestRequest?: GuestRequestDto | null;
  /** When true, room select is read-only (e.g. opened from room status board). */
  lockRoom?: boolean;
  /** Display label when room is locked (used if FO room list has no match). */
  lockedRoomLabel?: string;
  submitLabel?: string;
  onCreated?: (task: HKTask) => void;
};

function applyGuestRequestDefaults(request: GuestRequestDto) {
  return {
    roomId: request.roomId,
    requestId: request.id,
    bookingId: request.bookingId ?? undefined,
    taskType: "GUEST_REQUEST" as HkTaskType,
    priority: String(request.priority ?? "MEDIUM").toUpperCase(),
    notes: request.description ?? "",
  };
}

export function CreateCleaningTaskForm({
  foRooms,
  initialRoomId = "",
  sourceGuestRequest = null,
  lockRoom = false,
  lockedRoomLabel,
  submitLabel = "Create Task",
  onCreated,
}: CreateCleaningTaskFormProps) {
  const fromGuestRequest = Boolean(sourceGuestRequest);
  const lockedFromRequest = lockRoom || fromGuestRequest;

  const [roomId, setRoomId] = useState(
    sourceGuestRequest?.roomId ?? initialRoomId,
  );
  const [taskType, setTaskType] = useState<HkTaskType>(
    sourceGuestRequest ? "GUEST_REQUEST" : "REGULAR_CLEANING",
  );
  const [priority, setPriority] = useState<string>(
    sourceGuestRequest
      ? String(sourceGuestRequest.priority ?? "MEDIUM").toUpperCase()
      : "MEDIUM",
  );
  const [notes, setNotes] = useState(sourceGuestRequest?.description ?? "");
  const [roomBooking, setRoomBooking] = useState<ReservationBooking | null>(null);
  const [linkBooking, setLinkBooking] = useState(true);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [creating, setCreating] = useState<"create" | "start" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roomStatusByKey, setRoomStatusByKey] = useState<
    Record<string, { status: string; guestName?: string }>
  >({});
  const [guestRequests, setGuestRequests] = useState<GuestRequestDto[]>([]);
  const [loadingGuestRequests, setLoadingGuestRequests] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(
    sourceGuestRequest?.id ?? "",
  );
  const { housekeepers, loading: loadingStaff } = useHrHousekeepers();
  const [assignees, setAssignees] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    void roomService
      .status()
      .then((cards) => {
        if (cancelled) return;
        const next: Record<string, { status: string; guestName?: string }> = {};
        for (const card of cards) {
          const entry = { status: card.status, guestName: card.guestName };
          if (card.id) next[card.id] = entry;
          next[card.roomNo] = entry;
        }
        setRoomStatusByKey(next);
      })
      .catch(() => {
        if (!cancelled) setRoomStatusByKey({});
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (sourceGuestRequest) {
      const defaults = applyGuestRequestDefaults(sourceGuestRequest);
      setRoomId(defaults.roomId);
      setSelectedRequestId(defaults.requestId);
      setTaskType(defaults.taskType);
      setPriority(defaults.priority);
      setNotes(defaults.notes);
      setLinkBooking(Boolean(sourceGuestRequest.bookingId));
      return;
    }
    setRoomId(initialRoomId);
    setSelectedRequestId("");
  }, [sourceGuestRequest, initialRoomId]);

  useEffect(() => {
    if (!roomId.trim()) {
      setRoomBooking(null);
      return;
    }
    let cancelled = false;
    setLoadingBooking(true);
    void reservationService
      .getCurrentForRoom(roomId.trim())
      .then((booking) => {
        if (cancelled) return;
        setRoomBooking(booking);
        const active = isActiveRoomBookingStatus(booking.status);
        if (!fromGuestRequest) {
          setLinkBooking(active);
          if (booking.status === "Checked Out") {
            setTaskType("CHECKOUT_CLEANING");
          } else if (active) {
            setTaskType("REGULAR_CLEANING");
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRoomBooking(null);
          if (!fromGuestRequest) setLinkBooking(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingBooking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [roomId, fromGuestRequest]);

  useEffect(() => {
    if (fromGuestRequest || !roomId.trim()) {
      if (!fromGuestRequest) {
        setGuestRequests([]);
        setSelectedRequestId("");
      }
      return;
    }

    let cancelled = false;
    setLoadingGuestRequests(true);

    const params = new URLSearchParams({
      roomId: roomId.trim(),
      requestType: "CLEANING",
    });
    const activeBookingId =
      linkBooking && roomBooking && isActiveRoomBookingStatus(roomBooking.status)
        ? roomBooking.id
        : undefined;
    if (activeBookingId) {
      params.set("bookingId", activeBookingId);
    }

    void hkGuestRequestService
      .list(`?${params.toString()}`)
      .then((rows) => {
        if (cancelled) return;
        const open = rows.filter((row) =>
          OPEN_GUEST_REQUEST_STATUSES.has(String(row.status ?? "").toUpperCase()),
        );
        setGuestRequests(open);
        setSelectedRequestId((prev) =>
          prev && open.some((row) => row.id === prev) ? prev : "",
        );
      })
      .catch(() => {
        if (!cancelled) {
          setGuestRequests([]);
          setSelectedRequestId("");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingGuestRequests(false);
      });

    return () => {
      cancelled = true;
    };
  }, [roomId, roomBooking?.id, linkBooking, fromGuestRequest]);

  const activeRoomBooking =
    roomBooking && isActiveRoomBookingStatus(roomBooking.status)
      ? roomBooking
      : null;

  const resolvedBookingId =
    activeRoomBooking &&
    (fromGuestRequest || linkBooking) &&
    (!fromGuestRequest ||
      !sourceGuestRequest?.bookingId ||
      sourceGuestRequest.bookingId === activeRoomBooking.id)
      ? activeRoomBooking.id
      : undefined;

  const roomOptions = useMemo(
    () =>
      foRooms.map((room) => {
        const id = roomKey(room);
        const floor = room.floor ? ` (${room.floor})` : "";
        const statusCard = roomStatusByKey[id] ?? roomStatusByKey[room.roomNo];
        const status = statusCard?.status ?? "Vacant";
        const statusConfig = getFoRoomStatusConfig(status);
        const hintParts = [room.bedType, statusCard?.guestName].filter(Boolean);
        return {
          value: id,
          label: `${room.roomNo} — ${room.roomType ?? "Standard"}${floor}`,
          hint: hintParts.join(" · ") || undefined,
          tag: {
            label: statusConfig.label.toUpperCase(),
            className: getFoRoomStatusListBadge(status),
          },
        };
      }),
    [foRooms, roomStatusByKey],
  );

  const handleSubmit = async (startNow = false) => {
    if (!roomId.trim()) {
      setError("Select a room.");
      return;
    }
    if (startNow && !assignees.length) {
      setError("Assign at least one housekeeper to start cleaning now.");
      return;
    }
    setCreating(startNow ? "start" : "create");
    setError(null);
    try {
      const task = await hkTaskService.create({
        roomId: (fromGuestRequest
          ? sourceGuestRequest!.roomId
          : roomId
        ).trim(),
        bookingId: resolvedBookingId,
        requestId: fromGuestRequest
          ? sourceGuestRequest!.id
          : selectedRequestId || undefined,
        taskType: fromGuestRequest || selectedRequestId ? "GUEST_REQUEST" : taskType,
        priority: priority as HKTask["priority"],
        notes: notes.trim() || undefined,
        scheduledDate: todayIso(),
      });

      let result = task;
      let assigned = false;
      if (assignees.length) {
        try {
          result = await hkTaskService.assign(task.id, assignees);
          assigned = true;
        } catch (e) {
          window.alert(
            `Task created, but assigning staff failed: ${
              e instanceof Error ? e.message : "unknown error"
            }. Assign it from the task details.`,
          );
        }
      }
      if (startNow && assigned) {
        try {
          result = await hkTaskService.start(task.id);
        } catch (e) {
          window.alert(
            `Task created and assigned, but starting cleaning failed: ${
              e instanceof Error ? e.message : "unknown error"
            }. Start it from the task details.`,
          );
        }
      }

      if (!fromGuestRequest) {
        setNotes("");
        setTaskType("REGULAR_CLEANING");
        setPriority("MEDIUM");
        setSelectedRequestId("");
        if (!lockedFromRequest) setRoomId("");
      }
      setAssignees([]);
      onCreated?.(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create task");
    } finally {
      setCreating(null);
    }
  };

  const selectedRoom = foRooms.find(
    (r) => roomKey(r) === roomId || r.roomNo === roomId,
  );
  const summaryRoom = fromGuestRequest
    ? `Room ${sourceGuestRequest!.roomNo ?? sourceGuestRequest!.roomId}`
    : selectedRoom
      ? `Room ${selectedRoom.roomNo}`
      : roomId.trim()
        ? `Room ${roomId}`
        : "No room selected";

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
          {error}
        </p>
      )}

      <FormSection step={1} icon={BedDouble} title="Room & guest">
      <FormField label="Room" required>
        {lockedFromRequest ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700">
            {lockedRoomLabel ??
              (fromGuestRequest ? (
                <>
                  <span className="font-semibold text-slate-900">
                    Room {sourceGuestRequest!.roomNo ?? sourceGuestRequest!.roomId}
                  </span>
                </>
              ) : selectedRoom ? (
                <>
                  <span className="font-semibold text-slate-900">
                    {selectedRoom.roomNo}
                  </span>
                  {" — "}
                  {selectedRoom.roomType ?? "Standard"}
                  {selectedRoom.floor ? ` (${selectedRoom.floor})` : ""}
                </>
              ) : (
                <span className="font-semibold text-slate-900">
                  Room {roomId}
                </span>
              ))}
          </div>
        ) : (
          <DropdownSelect
            value={roomId}
            onChange={setRoomId}
            options={roomOptions}
            placeholder="Select room…"
            searchable
            aria-label="Select room"
            triggerClassName="text-xs"
          />
        )}
      </FormField>

      {!fromGuestRequest && !roomId.trim() ? (
        <p className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] text-slate-500">
          <Info className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          Pick a room — we&apos;ll find its active booking and open guest requests.
        </p>
      ) : (
      <>
      <FormField label="Guest booking">
        {fromGuestRequest ? (
          sourceGuestRequest?.bookingId ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2.5 text-xs">
              <span className="block font-bold text-slate-800">
                {sourceGuestRequest.bookingNo ?? sourceGuestRequest.bookingId}
              </span>
              <span className="text-slate-600">
                {sourceGuestRequest.guestName ?? "Guest"}
                {sourceGuestRequest.roomNo
                  ? ` · Room ${sourceGuestRequest.roomNo}`
                  : ""}
              </span>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              No booking on this guest request.
            </p>
          )
        ) : !roomId.trim() ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Select a room to check for an active booking.
          </p>
        ) : loadingBooking ? (
          <p className="text-xs text-slate-500">
            Looking up booking for this room…
          </p>
        ) : roomBooking && activeRoomBooking ? (
          <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
            <label className="flex cursor-pointer items-start gap-2 text-xs">
              <input
                type="checkbox"
                checked={linkBooking}
                onChange={(e) => setLinkBooking(e.target.checked)}
                className="mt-0.5 rounded border-slate-300"
              />
              <span>
                <span className="block font-bold text-slate-800">
                  Link to {activeRoomBooking.bookingNo ?? activeRoomBooking.id}
                </span>
                <span className="text-slate-600">
                  {activeRoomBooking.guestName ?? "Guest"} · {activeRoomBooking.status}
                  {activeRoomBooking.checkOut
                    ? ` · Out ${activeRoomBooking.checkOut}`
                    : ""}
                </span>
              </span>
            </label>
          </div>
        ) : roomBooking ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs">
            <span className="block font-semibold text-slate-800">
              {roomBooking.bookingNo ?? roomBooking.id} · {roomBooking.status}
            </span>
            <span className="text-slate-600">
              {roomBooking.guestName ?? "Guest"}
              {roomBooking.checkOut ? ` · Out ${roomBooking.checkOut}` : ""}
            </span>
            <p className="mt-1.5 text-slate-500">
              Room is not occupied — task will be created without a booking link.
            </p>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            No active booking for this room — task will be created without a
            booking link (e.g. vacant deep clean).
          </p>
        )}
      </FormField>

      {fromGuestRequest && sourceGuestRequest ? (
        <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-3 text-xs">
          <p className="font-semibold text-slate-900">
            From guest request{" "}
            {sourceGuestRequest.requestNumber ?? sourceGuestRequest.id.slice(0, 8)}
          </p>
          <p className="mt-1 text-slate-600">{sourceGuestRequest.description}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            {sourceGuestRequest.status}
            {sourceGuestRequest.priority
              ? ` · ${sourceGuestRequest.priority}`
              : ""}
          </p>
        </div>
      ) : (
        <FormField label="Guest request" helperText="Optional — link an open room-cleaning request from the guest.">
          {!roomId.trim() ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Select a room to search for open cleaning requests.
            </p>
          ) : loadingGuestRequests ? (
            <p className="text-xs text-slate-500">Searching guest requests…</p>
          ) : guestRequests.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              No open room-cleaning requests
              {resolvedBookingId ? " for this booking" : " for this room"}.
            </p>
          ) : (
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/50 p-2">
              <label
                className={cn(
                  "flex cursor-pointer items-start gap-2 rounded-lg px-2 py-2 text-xs transition-colors",
                  !selectedRequestId ? "bg-white ring-1 ring-slate-200" : "hover:bg-white",
                )}
              >
                <input
                  type="radio"
                  name="guest-request"
                  checked={!selectedRequestId}
                  onChange={() => {
                    setSelectedRequestId("");
                  }}
                  className="mt-0.5"
                />
                <span className="text-slate-600">None — do not link a guest request</span>
              </label>
              {guestRequests.map((request) => {
                const checked = selectedRequestId === request.id;
                return (
                  <label
                    key={request.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-2 rounded-lg px-2 py-2 text-xs transition-colors",
                      checked
                        ? "bg-emerald-50 ring-1 ring-emerald-200"
                        : "hover:bg-white",
                    )}
                  >
                    <input
                      type="radio"
                      name="guest-request"
                      checked={checked}
                      onChange={() => {
                        setSelectedRequestId(request.id);
                        setTaskType("GUEST_REQUEST");
                        if (!notes.trim() && request.description) {
                          setNotes(request.description);
                        }
                      }}
                      className="mt-0.5"
                    />
                    <span>
                      <span className="block font-semibold text-slate-900">
                        {formatGuestRequestLabel(request)}
                      </span>
                      <span className="text-slate-500">
                        {request.status}
                        {request.priority ? ` · ${request.priority}` : ""}
                        {request.bookingNo ? ` · ${request.bookingNo}` : ""}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </FormField>
      )}
      </>
      )}

      </FormSection>

      <FormSection
        step={2}
        icon={ClipboardList}
        title="Task details"
        hint={`Cleaning date: today (${formatScheduleDate(todayIso())})`}
      >
      {!fromGuestRequest && (
        <ChipGroup label="Type">
          {TASK_TYPES.map((t) => (
            <Chip key={t} active={taskType === t} onClick={() => setTaskType(t)}>
              {formatTaskTypeLabel(t).replace(/ Cleaning$/, "")}
            </Chip>
          ))}
        </ChipGroup>
      )}

      <ChipGroup label="Priority">
        {TASK_PRIORITIES.map((p) => (
          <Chip key={p} active={priority === p} onClick={() => setPriority(p)}>
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                priority === p ? "bg-white" : PRIORITY_DOT[p],
              )}
            />
            {p.charAt(0) + p.slice(1).toLowerCase()}
          </Chip>
        ))}
      </ChipGroup>

      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Notes
          {fromGuestRequest && (
            <span className="ml-1.5 normal-case tracking-normal text-slate-400">
              · prefilled from guest request
            </span>
          )}
        </p>
        <TextAreaInput
          value={notes}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setNotes(e.target.value)
          }
          rows={2}
          placeholder="Instructions for the housekeeper (optional)"
          className="min-h-[60px] text-xs leading-relaxed"
        />
      </div>
      </FormSection>

      <FormSection
        step={3}
        icon={Users}
        title="Assign team"
        hint="Optional — leave empty to assign later."
      >
        <StaffMultiSelect
          staff={housekeepers}
          value={assignees}
          onChange={setAssignees}
          loading={loadingStaff}
          placeholder="Select housekeepers…"
        />
      </FormSection>

      <div className="sticky -bottom-5 z-10 -mx-5 -mb-5 border-t border-slate-200 bg-white/95 px-5 py-3 backdrop-blur">
        <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
          <span className="font-semibold text-slate-800">{summaryRoom}</span>
          <span className="text-slate-300">•</span>
          <span>{formatTaskTypeLabel(fromGuestRequest || selectedRequestId ? "GUEST_REQUEST" : taskType)}</span>
          <span className="text-slate-300">•</span>
          <span className="inline-flex items-center gap-1">
            <span className={cn("h-1.5 w-1.5 rounded-full", PRIORITY_DOT[priority as keyof typeof PRIORITY_DOT])} />
            {priority.charAt(0) + priority.slice(1).toLowerCase()}
          </span>
          <span className="text-slate-300">•</span>
          <span>{assignees.length ? `${assignees.length} staff` : "Unassigned"}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="w-full border-emerald-600 text-emerald-700 hover:bg-emerald-50"
            onClick={() => void handleSubmit(false)}
            disabled={creating !== null}
          >
            {creating === "create" ? "Creating…" : submitLabel}
          </Button>
          <Button
            className="flex w-full items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800"
            onClick={() => void handleSubmit(true)}
            disabled={creating !== null || assignees.length === 0}
            title={assignees.length ? undefined : "Assign at least one housekeeper first"}
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            {creating === "start" ? "Starting…" : "Create & Start"}
          </Button>
        </div>
        {assignees.length === 0 && (
          <p className="mt-1.5 text-center text-[10px] text-slate-400">
            Select a housekeeper to create and start cleaning right away.
          </p>
        )}
      </div>
    </div>
  );
}

function ChipGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
        active
          ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700",
      )}
    >
      {children}
    </button>
  );
}

const PRIORITY_DOT: Record<(typeof TASK_PRIORITIES)[number], string> = {
  LOW: "bg-slate-400",
  MEDIUM: "bg-amber-500",
  HIGH: "bg-orange-500",
  URGENT: "bg-red-600",
};

function FormSection({
  step,
  icon: Icon,
  title,
  hint,
  children,
}: {
  step: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <header className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-2.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
          {step}
        </span>
        <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-900">
          <Icon className="h-3.5 w-3.5 text-slate-400" />
          {title}
        </h3>
        {hint && <p className="ml-auto truncate text-[11px] text-slate-500">{hint}</p>}
      </header>
      <div className="space-y-4 p-4">{children}</div>
    </section>
  );
}
