"use client";

import React, { useState, useMemo } from "react";
import { useHousekeeping } from "@/components/housekeeping/HousekeepingContext";
import { CalendarClock, Sparkles, Clock, CheckCircle2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { TextInput, SelectInput, FormField } from "@/components/frontoffice/ui";

export default function DeepCleaning() {
  const {
    rooms,
    staff,
    startCleaning,
  } = useHousekeeping();

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedRoomNo, setSelectedRoomNo] = useState("");
  const [housekeeper, setHousekeeper] = useState("");

  const deepCleanRooms = useMemo(() => {
    return rooms.map((room) => {
      // Parse last deep cleaned date (e.g. "10 Jun 2026")
      let isOverdue = false;
      const daysFreq = room.deepCleaningFrequency.includes("30")
        ? 30
        : room.deepCleaningFrequency.includes("60")
        ? 60
        : 90;

      // Simple mock calculation: room 201 is overdue
      if (room.roomNo === "201") {
        isOverdue = true;
      }

      return {
        ...room,
        isOverdue,
        nextDueDate: `Overdue (Scheduled)`
      };
    });
  }, [rooms]);

  const activeHousekeepers = useMemo(() => {
    return staff.filter((s) => s.role === "Housekeeper");
  }, [staff]);

  const handleOpenSchedule = (roomNo: string) => {
    setSelectedRoomNo(roomNo);
    setHousekeeper(activeHousekeepers[0]?.name ?? "");
    setCreateOpen(true);
  };

  const handleScheduleDeepClean = () => {
    if (!selectedRoomNo) return;
    startCleaning(selectedRoomNo, housekeeper);
    setCreateOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Operations</span>
        <h1 className="mt-1 text-2xl font-bold text-slate-800">Deep Cleaning Scheduler</h1>
        <p className="text-sm text-slate-500 font-normal">
          Track periodic room deep cleanings based on cycles (30/60/90 Days). Schedule extensive tasks for stay-overs.
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3">Room</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Frequency</th>
              <th className="px-5 py-3">Last Deep Cleaned</th>
              <th className="px-5 py-3">Next Due Date</th>
              <th className="px-5 py-3">Current Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {deepCleanRooms.map((room) => {
              const isCleaning = room.status === "Cleaning";

              return (
                <tr key={room.roomNo} className="hover:bg-slate-50/50">
                  <td className="px-5 py-4 font-bold text-slate-800">Room {room.roomNo}</td>
                  <td className="px-5 py-4 text-slate-500 font-medium">{room.category}</td>
                  <td className="px-5 py-4 text-slate-600 font-semibold">{room.deepCleaningFrequency}</td>
                  <td className="px-5 py-4 text-slate-500">{room.lastDeepCleaned}</td>
                  <td className="px-5 py-4 font-semibold">
                    {room.isOverdue ? (
                      <span className="text-red-600 animate-pulse">Overdue</span>
                    ) : (
                      <span className="text-slate-500">In 14 Days</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
                        room.status === "Vacant Ready"
                          ? "bg-emerald-50 text-emerald-700"
                          : room.status === "Cleaning"
                          ? "bg-amber-50 text-amber-700 animate-pulse"
                          : "bg-red-50 text-red-700"
                      )}
                    >
                      {room.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {isCleaning ? (
                      <span className="text-[10px] text-amber-700 font-medium flex items-center justify-end gap-1">
                        <Clock className="h-3 w-3 animate-spin" /> In Progress
                      </span>
                    ) : (
                      <Button
                        onClick={() => handleOpenSchedule(room.roomNo)}
                        className="py-1 px-2.5 text-[10px] font-semibold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1 inline-flex"
                      >
                        <Sparkles className="h-3.5 w-3.5" /> Deep Clean
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Drawer: Schedule Deep Clean */}
      <Drawer open={createOpen} onClose={() => setCreateOpen(false)} title={`Schedule Deep Clean: Room ${selectedRoomNo}`}>
        <div className="space-y-4">
          <FormField label="Assign Housekeeper" required>
            <SelectInput value={housekeeper} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setHousekeeper(e.target.value)}>
              {activeHousekeepers.map((h) => (
                <option key={h.id} value={h.name}>
                  {h.name}
                </option>
              ))}
            </SelectInput>
          </FormField>

          <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-800">
            Scheduling deep clean automatically sets the Room Status to <strong>Cleaning</strong>. The housekeeper will follow the extensive deep cleaning checklist procedure.
          </div>

          <Button
            onClick={handleScheduleDeepClean}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white"
          >
            Start Deep Clean
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
