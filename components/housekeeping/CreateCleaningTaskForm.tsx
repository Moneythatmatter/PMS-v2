"use client";

import React, { useEffect, useState } from "react";
import { reservationService } from "@/services/front-office/reservations";
import { hkTaskService } from "@/services/housekeeping";
import type { RoomDto } from "@/services/front-office/rooms";
import type { ReservationBooking } from "@/app/data/types";
import type { HKTask, HkTaskType } from "./HousekeepingTypes";
import { formatTaskTypeLabel } from "./taskUtils";
import { Button } from "@/components/ui/Button";
import {
  SelectInput,
  FormField,
  TextAreaInput,
} from "@/components/frontoffice/ui";

const TASK_TYPES: HkTaskType[] = [
  "CHECKOUT_CLEANING",
  "REGULAR_CLEANING",
  "DEEP_CLEANING",
  "INSPECTION",
  "TURNDOWN",
  "SPECIAL_REQUEST",
];

const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export type CreateCleaningTaskFormProps = {
  foRooms: RoomDto[];
  initialRoomId?: string;
  /** When true, room select is read-only (e.g. opened from room status board). */
  lockRoom?: boolean;
  /** Display label when room is locked (used if FO room list has no match). */
  lockedRoomLabel?: string;
  submitLabel?: string;
  onCreated?: (task: HKTask) => void;
};

export function CreateCleaningTaskForm({
  foRooms,
  initialRoomId = "",
  lockRoom = false,
  lockedRoomLabel,
  submitLabel = "Create Task",
  onCreated,
}: CreateCleaningTaskFormProps) {
  const [roomId, setRoomId] = useState(initialRoomId);
  const [taskType, setTaskType] = useState<HkTaskType>("REGULAR_CLEANING");
  const [priority, setPriority] = useState<string>("MEDIUM");
  const [notes, setNotes] = useState("");
  const [roomBooking, setRoomBooking] = useState<ReservationBooking | null>(null);
  const [linkBooking, setLinkBooking] = useState(true);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRoomId(initialRoomId);
  }, [initialRoomId]);

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
  }, [roomId]);

  const handleSubmit = async () => {
    if (!roomId.trim()) {
      setError("Select a room.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const task = await hkTaskService.create({
        roomId: roomId.trim(),
        bookingId: linkBooking && roomBooking?.id ? roomBooking.id : undefined,
        taskType,
        priority: priority as HKTask["priority"],
        notes: notes.trim() || undefined,
      });
      setNotes("");
      setTaskType("REGULAR_CLEANING");
      setPriority("MEDIUM");
      onCreated?.(task);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create task");
    } finally {
      setCreating(false);
    }
  };

  const selectedRoom = foRooms.find(
    (r) => r.id === roomId || r.roomNo === roomId,
  );

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-xs font-medium text-red-600 rounded-lg bg-red-50 px-3 py-2">
          {error}
        </p>
      )}

      <FormField label="Room" required>
        {lockRoom ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700">
            {lockedRoomLabel ??
              (selectedRoom ? (
                <>
                  <span className="font-semibold text-slate-900">{selectedRoom.roomNo}</span>
                  {" — "}
                  {selectedRoom.roomType ?? "Standard"}
                  {selectedRoom.floor ? ` (${selectedRoom.floor})` : ""}
                </>
              ) : (
                <span className="font-semibold text-slate-900">Room {roomId}</span>
              ))}
          </div>
        ) : (
          <SelectInput
            value={roomId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setRoomId(e.target.value)
            }
            className="text-xs"
          >
            <option value="">Select room…</option>
            {foRooms.map((r) => (
              <option key={r.id} value={r.id ?? r.roomNo}>
                {r.roomNo} — {r.roomType ?? "Standard"}
                {r.floor ? ` (${r.floor})` : ""}
              </option>
            ))}
          </SelectInput>
        )}
      </FormField>

      <FormField label="Guest booking">
        {loadingBooking ? (
          <p className="text-xs text-slate-500">Looking up booking for this room…</p>
        ) : roomBooking ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 space-y-2">
            <label className="flex items-start gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={linkBooking}
                onChange={(e) => setLinkBooking(e.target.checked)}
                className="mt-0.5 rounded border-slate-300"
              />
              <span>
                <span className="font-bold text-slate-800 block">
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
          <p className="text-xs text-slate-500 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2">
            No active booking for this room — task will be created without a booking
            link (e.g. vacant deep clean).
          </p>
        )}
      </FormField>

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

      <FormField label="Notes">
        <TextAreaInput
          value={notes}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setNotes(e.target.value)
          }
          rows={3}
          placeholder="Optional instructions for housekeeper…"
          className="text-xs"
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
