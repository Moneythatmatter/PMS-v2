"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { reservationService } from "@/services/front-office/reservations";
import { hkGuestRequestService, hkTaskService } from "@/services/housekeeping";
import {
  type GuestRequestDto,
  OPEN_GUEST_REQUEST_STATUSES,
} from "./guestRequestUtils";
import type { RoomDto } from "@/services/front-office/rooms";
import type { ReservationBooking } from "@/app/data/types";
import type { HKTask, HkTaskType } from "./HousekeepingTypes";
import { formatTaskTypeLabel } from "./taskUtils";
import { Button } from "@/components/ui/Button";
import {
  SelectInput,
  FormField,
  TextAreaInput,
  TextInput,
} from "@/components/frontoffice/ui";
import { todayIso } from "@/lib/reservation-dates";
import { combineDateAndTime } from "@/lib/hk-task-schedule";
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

function formatTimeLabel(value: string): string {
  const [h, m] = value.split(":");
  const hour = Number(h);
  const minute = Number(m);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value;
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

function isDueBeforeStart(startTime: string, dueTime: string): boolean {
  return dueTime <= startTime;
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
  const [cleaningDate, setCleaningDate] = useState(todayIso());
  const [startTime, setStartTime] = useState("09:00");
  const [dueTime, setDueTime] = useState("11:00");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [roomBooking, setRoomBooking] = useState<ReservationBooking | null>(null);
  const [linkBooking, setLinkBooking] = useState(true);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomSearch, setRoomSearch] = useState("");
  const [guestRequests, setGuestRequests] = useState<GuestRequestDto[]>([]);
  const [loadingGuestRequests, setLoadingGuestRequests] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(
    sourceGuestRequest?.id ?? "",
  );

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
    if (fromGuestRequest || !roomId.trim()) {
      if (!fromGuestRequest) setRoomBooking(null);
      return;
    }
    let cancelled = false;
    setLoadingBooking(true);
    void reservationService
      .getCurrentForRoom(roomId.trim())
      .then((booking) => {
        if (cancelled) return;
        setRoomBooking(booking);
        setLinkBooking(true);
        if (booking.status === "Checked Out") {
          setTaskType("CHECKOUT_CLEANING");
        } else if (
          booking.status === "Checked In" ||
          booking.status === "In-House"
        ) {
          setTaskType("REGULAR_CLEANING");
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
    if (linkBooking && roomBooking?.id) {
      params.set("bookingId", roomBooking.id);
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

  const resolvedBookingId = fromGuestRequest
    ? sourceGuestRequest?.bookingId ?? undefined
    : linkBooking && roomBooking?.id
      ? roomBooking.id
      : undefined;

  const filteredRooms = useMemo(() => {
    const q = roomSearch.trim().toLowerCase();
    if (!q) return foRooms;
    return foRooms.filter((room) => {
      const haystack = [room.roomNo, room.roomType, room.floor, room.bedType]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [foRooms, roomSearch]);

  const handleSubmit = async () => {
    if (!roomId.trim()) {
      setError("Select a room.");
      return;
    }
    if (!cleaningDate.trim()) {
      setError("Cleaning date is required.");
      return;
    }
    if (scheduleEnabled) {
      if (!startTime.trim() || !dueTime.trim()) {
        setError("Start time and due time are required.");
        return;
      }
      if (isDueBeforeStart(startTime, dueTime)) {
        setError("Due time must be after start time.");
        return;
      }
    }

    setCreating(true);
    setError(null);
    try {
      const schedulePayload = scheduleEnabled
        ? {
            scheduledDate: cleaningDate,
            scheduledStartAt: combineDateAndTime(cleaningDate, startTime),
            dueAt: combineDateAndTime(cleaningDate, dueTime),
          }
        : { scheduledDate: cleaningDate };

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
        ...schedulePayload,
      });

      if (!fromGuestRequest) {
        setNotes("");
        setTaskType("REGULAR_CLEANING");
        setPriority("MEDIUM");
        setScheduleEnabled(false);
        setSelectedRequestId("");
        if (!lockedFromRequest) setRoomId("");
      }
      onCreated?.(task);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create task");
    } finally {
      setCreating(false);
    }
  };

  const selectedRoom = foRooms.find(
    (r) => roomKey(r) === roomId || r.roomNo === roomId,
  );

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
          {error}
        </p>
      )}

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
          <div className="space-y-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <TextInput
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                placeholder="Search room no., type, floor…"
                className="pl-9 text-xs"
              />
            </div>
            <SelectInput
              value={roomId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setRoomId(e.target.value)
              }
              className="text-xs"
            >
              <option value="">Select room…</option>
              {filteredRooms.map((room) => {
                const id = roomKey(room);
                return (
                  <option key={id} value={id}>
                    {room.roomNo} — {room.roomType ?? "Standard"}
                    {room.floor ? ` (${room.floor})` : ""}
                  </option>
                );
              })}
            </SelectInput>
            {roomSearch.trim() && filteredRooms.length === 0 && (
              <p className="text-[11px] text-slate-500">
                No rooms match &ldquo;{roomSearch.trim()}&rdquo;
              </p>
            )}
          </div>
        )}
      </FormField>

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
        ) : roomBooking ? (
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
              {linkBooking && roomBooking?.id ? " for this booking" : " for this room"}.
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

      <div className={scheduleEnabled ? "" : "grid gap-4 sm:grid-cols-2"}>
        {!scheduleEnabled && (
          <FormField label="Cleaning Date" required>
            <TextInput
              type="date"
              value={cleaningDate}
              onChange={(e) => setCleaningDate(e.target.value)}
              className="text-xs"
            />
          </FormField>
        )}
        {!fromGuestRequest && (
          <FormField label="Task Type" required>
            <SelectInput
              value={taskType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setTaskType(e.target.value as HkTaskType)
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
        )}
      </div>

      <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs">
        <input
          type="checkbox"
          checked={scheduleEnabled}
          onChange={(e) => setScheduleEnabled(e.target.checked)}
          className="mt-0.5 rounded border-slate-300"
        />
        <span>
          <span className="block font-semibold text-slate-900">
            Schedule this task
          </span>
          <span className="text-slate-500">
            Set a time window on the cleaning date
          </span>
        </span>
      </label>

      {scheduleEnabled && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <p className="mb-3 text-xs font-semibold text-slate-800">Schedule</p>
          <div className="space-y-3">
            <FormField label="Cleaning Date" required>
              <TextInput
                type="date"
                value={cleaningDate}
                onChange={(e) => setCleaningDate(e.target.value)}
                className="text-xs"
              />
            </FormField>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Start Time" required>
                <TextInput
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="text-xs"
                />
              </FormField>
              <FormField label="Due Time" required>
                <TextInput
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="text-xs"
                />
              </FormField>
            </div>
            {startTime && dueTime && !isDueBeforeStart(startTime, dueTime) && (
              <p className="text-[11px] text-slate-500">
                Window: {formatTimeLabel(startTime)} – {formatTimeLabel(dueTime)}
              </p>
            )}
          </div>
        </div>
      )}

      <FormField label="Priority">
        <SelectInput
          value={priority}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setPriority(e.target.value)
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

      <FormField
        label="Notes"
        helperText={
          fromGuestRequest
            ? "Prefilled from the guest request — edit if needed."
            : undefined
        }
      >
        <TextAreaInput
          value={notes}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setNotes(e.target.value)
          }
          rows={3}
          placeholder="Optional instructions for housekeeper…"
          className="min-h-[88px] text-xs leading-relaxed"
        />
      </FormField>

      <Button
        className="w-full bg-emerald-700 hover:bg-emerald-800"
        onClick={() => void handleSubmit()}
        disabled={creating}
      >
        {creating ? "Creating…" : submitLabel}
      </Button>
    </div>
  );
}
