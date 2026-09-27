"use client";

import React, { useMemo } from "react";
import { BedDouble, CheckCircle2 } from "lucide-react";
import { FormField, TextAreaInput } from "@/components/frontoffice/ui";
import { SearchSelect } from "@/components/frontoffice/SearchSelect";
import { cn } from "@/lib/utils";

const inputClass = "rounded-xl";

export type RoomOption = {
  roomNo: string;
  roomType?: string;
};

interface RoomAssignmentSectionProps {
  assignedRoom: string;
  onAssignedRoomChange: (val: string) => void;
  remarks: string;
  onRemarksChange: (val: string) => void;
  availableRooms: RoomOption[] | string[];
  preferredRoomType?: string;
}

function normalizeRooms(rooms: RoomOption[] | string[]): RoomOption[] {
  return rooms.map((r) =>
    typeof r === "string" ? { roomNo: r } : r,
  );
}

export function RoomAssignmentSection({
  assignedRoom,
  onAssignedRoomChange,
  remarks,
  onRemarksChange,
  availableRooms,
  preferredRoomType,
}: RoomAssignmentSectionProps) {
  const rooms = useMemo(() => normalizeRooms(availableRooms), [availableRooms]);

  const roomOptions = useMemo(
    () =>
      rooms.map((rm) => ({
        id: rm.roomNo,
        label: `Room ${rm.roomNo}`,
        hint: rm.roomType ? `${rm.roomType} · Vacant` : "Vacant",
      })),
    [rooms],
  );

  const selected = useMemo(
    () => rooms.find((r) => r.roomNo === assignedRoom) ?? null,
    [rooms, assignedRoom],
  );

  const vacantCount = rooms.length;
  const typeLabel = preferredRoomType?.trim() || selected?.roomType || "";

  return (
    <div className="sm:col-span-2 lg:col-span-3 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1",
            vacantCount > 0
              ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
              : "bg-amber-50 text-amber-800 ring-amber-200",
          )}
        >
          <BedDouble className="h-3 w-3" />
          {vacantCount > 0
            ? `${vacantCount} vacant room${vacantCount === 1 ? "" : "s"}`
            : "No vacant rooms"}
        </span>
        {typeLabel ? (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
            Preferred: {typeLabel}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-2">
          <FormField label="Assigned Room Number" required>
            <SearchSelect
              options={roomOptions}
              selectedId={assignedRoom || null}
              placeholder={
                vacantCount === 0
                  ? "No vacant rooms available"
                  : "Search vacant room…"
              }
              inputClassName={inputClass}
              onSelect={(opt) => onAssignedRoomChange(opt.id)}
              onClear={() => onAssignedRoomChange("")}
            />
          </FormField>

          {assignedRoom ? (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-emerald-900">
                  Room {assignedRoom}
                </p>
                <p className="text-[11px] text-emerald-700/80">
                  {[selected?.roomType || typeLabel, "Ready for check-in"]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-3.5 py-3">
              <p className="text-xs text-slate-500">
                Select a vacant room to continue check-in.
              </p>
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          <FormField label="Special Remarks / Guest Requests">
            <TextAreaInput
              className="min-h-[112px] resize-y"
              placeholder="High floor, late check-out, allergy notes…"
              value={remarks}
              onChange={(e) => onRemarksChange(e.target.value)}
            />
          </FormField>
        </div>
      </div>
    </div>
  );
}
