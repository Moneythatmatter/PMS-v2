"use client";

import React, { useMemo } from "react";
import { FormField, TextAreaInput, TextInput } from "@/components/frontoffice/ui";
import { SearchSelect } from "@/components/frontoffice/SearchSelect";

const inputClass = "rounded-xl";

interface RoomAssignmentSectionProps {
  assignedRoom: string;
  onAssignedRoomChange: (val: string) => void;
  keyCard: string;
  onKeyCardChange: (val: string) => void;
  vehicle: string;
  onVehicleChange: (val: string) => void;
  remarks: string;
  onRemarksChange: (val: string) => void;
  availableRooms: string[];
}

export function RoomAssignmentSection({
  assignedRoom,
  onAssignedRoomChange,
  keyCard,
  onKeyCardChange,
  vehicle,
  onVehicleChange,
  remarks,
  onRemarksChange,
  availableRooms,
}: RoomAssignmentSectionProps) {
  const roomOptions = useMemo(
    () =>
      availableRooms.map((rm) => ({
        id: rm,
        label: `Room ${rm}`,
        hint: "Vacant",
      })),
    [availableRooms],
  );

  return (
    <>
      <FormField label="Assigned Room Number" required>
        <SearchSelect
          options={roomOptions}
          selectedId={assignedRoom || null}
          placeholder={
            roomOptions.length === 0
              ? "No vacant rooms available"
              : "Search vacant room…"
          }
          inputClassName={inputClass}
          onSelect={(opt) => onAssignedRoomChange(opt.id)}
          onClear={() => onAssignedRoomChange("")}
        />
      </FormField>

      <FormField label="Key Card RFID Number">
        <TextInput
          className={inputClass}
          placeholder="e.g. KC-88412"
          value={keyCard}
          onChange={(e) => onKeyCardChange(e.target.value)}
        />
      </FormField>

      <FormField label="Vehicle Number (Parking)">
        <TextInput
          className={inputClass}
          placeholder="e.g. MH 02 CD 4567"
          value={vehicle}
          onChange={(e) => onVehicleChange(e.target.value)}
        />
      </FormField>

      <div className="sm:col-span-2 lg:col-span-3">
        <FormField label="Special Remarks / Guest Requests">
          <TextAreaInput
            placeholder="High floor room requested, late check-out approved, etc."
            value={remarks}
            onChange={(e) => onRemarksChange(e.target.value)}
          />
        </FormField>
      </div>
    </>
  );
}
