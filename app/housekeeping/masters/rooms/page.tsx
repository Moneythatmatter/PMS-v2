"use client";

import React, { useState, useMemo } from "react";
import { useHousekeeping } from "@/components/housekeeping/HousekeepingContext";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { SelectInput, FormField } from "@/components/frontoffice/ui";
import { ModuleSelectionBar } from "@/components/pms/ModuleSelectionBar";
import { hkRoomService } from "@/services/housekeeping";
import { findRoomByKey, matchesRoomKey, roomApiId, roomKey } from "@/components/housekeeping/roomUtils";

export default function RoomMasterConfig() {
  const {
    rooms,
    changeRoomStatus,
    logAudit,
    setRooms,
  } = useHousekeeping();

  const [activeTab, setActiveTab] = useState<"floorplan" | "list">("floorplan");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectedRoom = useMemo(() => {
    return selectedRoomId ? findRoomByKey(rooms, selectedRoomId) ?? null : null;
  }, [rooms, selectedRoomId]);

  // Group rooms by floor for floorplan view
  const roomsByFloor = useMemo(() => {
    const map: Record<string, typeof rooms> = {};
    rooms.forEach((r) => {
      if (!map[r.floor]) map[r.floor] = [];
      map[r.floor].push(r);
    });
    // Sort floor names
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [rooms]);

  const handleToggleDnd = (roomKey: string) => {
    let nextState = false;
    let apiId = roomKey;
    setRooms((prev) =>
      prev.map((r) => {
        if (!matchesRoomKey(r, roomKey)) return r;
        apiId = roomApiId(r);
        nextState = !r.dnd;
        logAudit("Room Status", "DND Toggled", `Toggled DND state for room ${r.roomNo} to ${nextState ? "ON" : "OFF"}.`, r.roomNo);
        return { ...r, dnd: nextState };
      }),
    );

    void hkRoomService.update(apiId, { dnd: nextState }).catch((err) => {
      console.error(`[HK] Failed to sync DND toggle for room ${roomKey}`, err);
    });
  };

  const handleToggleSleepOut = (roomKey: string) => {
    let nextState = false;
    let apiId = roomKey;
    setRooms((prev) =>
      prev.map((r) => {
        if (!matchesRoomKey(r, roomKey)) return r;
        apiId = roomApiId(r);
        nextState = !r.sleepOut;
        logAudit("Room Status", "Sleep Out Toggled", `Toggled Sleep Out state for room ${r.roomNo} to ${nextState ? "ON" : "OFF"}.`, r.roomNo);
        return { ...r, sleepOut: nextState };
      }),
    );

    void hkRoomService.update(apiId, { sleepOut: nextState }).catch((err) => {
      console.error(`[HK] Failed to sync Sleep Out toggle for room ${roomKey}`, err);
    });
  };

  const handleStatusChange = (roomKey: string, val: any) => {
    changeRoomStatus(roomKey, val);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Masters</span>
        <h1 className="mt-1 text-2xl font-bold text-slate-800">Hotel Room Master</h1>
        <p className="text-sm text-slate-500 font-normal">
          Database of physical rooms, categories, facilities, and floorplan occupancy layout controls.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6 overflow-x-auto scrollbar-none text-sm font-semibold">
          <button
            onClick={() => setActiveTab("floorplan")}
            className={cn(
              "pb-4 px-1 border-b-2",
              activeTab === "floorplan"
                ? "border-emerald-700 text-emerald-700"
                : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            Visual Floor Plan
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={cn(
              "pb-4 px-1 border-b-2",
              activeTab === "list"
                ? "border-emerald-700 text-emerald-700"
                : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            Room Masters Directory ({rooms.length})
          </button>
        </nav>
      </div>

      {activeTab === "floorplan" ? (
        /* Visual Floor Plan Grid map */
        <div className="space-y-6">
          {roomsByFloor.map(([floor, floorRooms]) => (
            <div key={floor} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-50 pb-2">
                {floor}
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                {floorRooms.map((room) => {
                  const isDirty = room.status === "Dirty";
                  const isReady = room.status === "Vacant" || room.status === "Inspected";
                  const isCleaning = room.status === "Cleaning" || room.status === "Clean";
                  const isBlocked = room.status === "Blocked";

                  return (
                    <div
                      key={room.roomNo}
                      onClick={() => setSelectedRoomId(roomKey(room))}
                      className={cn(
                        "relative cursor-pointer rounded-xl border p-4 text-center transition-all hover:shadow-md hover:border-slate-400",
                        isReady
                          ? "bg-emerald-50/20 border-emerald-200"
                          : isDirty
                          ? "bg-red-50/20 border-red-200"
                          : isCleaning
                          ? "bg-amber-50/20 border-amber-200"
                          : isBlocked
                          ? "bg-slate-100/50 border-slate-300"
                          : "border-slate-200"
                      )}
                    >
                      <h4 className="text-sm font-bold text-slate-800">Room {room.roomNo}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate">{room.category}</p>
                      
                      <div className="mt-3 flex justify-center gap-1">
                        {room.dnd && (
                          <span className="rounded bg-red-500 px-1 py-0.5 text-[8px] font-extrabold text-white">DND</span>
                        )}
                        {room.sleepOut && (
                          <span className="rounded bg-indigo-500 px-1 py-0.5 text-[8px] font-extrabold text-white">SO</span>
                        )}
                        {isBlocked && (
                          <span className="rounded bg-slate-500 px-1 py-0.5 text-[8px] font-extrabold text-white">OOO</span>
                        )}
                      </div>
                      
                      {/* indicator status dot */}
                      <span
                        className={cn(
                          "absolute top-2 right-2 h-2.5 w-2.5 rounded-full border border-white",
                          isReady
                            ? "bg-emerald-500"
                            : isDirty
                            ? "bg-red-500"
                            : isCleaning
                            ? "bg-amber-500 animate-pulse"
                            : "bg-slate-400"
                        )}
                      ></span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Standard Database Table directory list */
        <div className="space-y-2">
          <ModuleSelectionBar
            count={selectedIds.size}
            noun="room"
            onClear={() => setSelectedIds(new Set())}
            actions={[
              {
                label: "Configure",
                icon: <Eye className="h-3.5 w-3.5" />,
                onClick: () => {
                  const firstId = Array.from(selectedIds)[0];
                  if (firstId) setSelectedRoomId(firstId);
                },
              },
            ]}
          />
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-200">
              <tr>
                <th className="w-10 px-5 py-3">
                  <input
                    type="checkbox"
                    checked={rooms.length > 0 && rooms.every((room) => selectedIds.has(roomKey(room)))}
                    onChange={() => {
                      const allIds = rooms.map((room) => roomKey(room));
                      const allSelected = allIds.every((id) => selectedIds.has(id));
                      setSelectedIds(allSelected ? new Set() : new Set(allIds));
                    }}
                    className="rounded border-slate-300"
                    aria-label="Select all"
                  />
                </th>
                <th className="px-5 py-3">Room</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Bed Type</th>
                <th className="px-5 py-3">Floor / Wing</th>
                <th className="px-5 py-3">Max Occ</th>
                <th className="px-5 py-3">Facilities</th>
                <th className="px-5 py-3">PMS Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rooms.map((room) => (
                <tr
                  key={roomKey(room)}
                  onClick={() => setSelectedRoomId(roomKey(room))}
                  className={cn(
                    "hover:bg-slate-50/50 cursor-pointer",
                    selectedIds.has(roomKey(room)) && "bg-emerald-50/40",
                  )}
                >
                  <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(roomKey(room))}
                      onChange={() => {
                        const next = new Set(selectedIds);
                        if (next.has(roomKey(room))) next.delete(roomKey(room));
                        else next.add(roomKey(room));
                        setSelectedIds(next);
                      }}
                      className="rounded border-slate-300"
                      aria-label={`Select room ${room.roomNo}`}
                    />
                  </td>
                  <td className="px-5 py-4 font-bold text-slate-800">Room {room.roomNo}</td>
                  <td className="px-5 py-4 text-slate-500 font-medium">{room.category}</td>
                  <td className="px-5 py-4 text-slate-500">{room.bedType}</td>
                  <td className="px-5 py-4 text-slate-500">{room.floor} · {room.wing}</td>
                  <td className="px-5 py-4 text-slate-600 font-semibold">{room.maxOccupancy} Adults</td>
                  <td className="px-5 py-4 text-slate-400 max-w-xs truncate">{room.facilities.join(", ")}</td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
                        room.status === "Vacant" || room.status === "Inspected"
                          ? "bg-emerald-50 text-emerald-700"
                          : room.status === "Dirty"
                          ? "bg-amber-50 text-amber-700"
                          : room.status === "Cleaning" || room.status === "Clean"
                          ? "bg-sky-50 text-sky-700"
                          : room.status === "Reserved"
                          ? "bg-blue-50 text-blue-700"
                          : room.status === "Occupied"
                          ? "bg-violet-50 text-violet-700"
                          : "bg-slate-100 text-slate-700"
                      )}
                    >
                      {room.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Drawer: Detail Override room values */}
      <Drawer open={!!selectedRoomId} onClose={() => setSelectedRoomId(null)} title={`Room ${selectedRoom?.roomNo} Configurations`}>
        {selectedRoom && (
          <div className="space-y-6">
            
            {/* Meta */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Class & Structure:</span>
                <span className="font-semibold text-slate-700">{selectedRoom.category} / {selectedRoom.bedType} Bed</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Location:</span>
                <span className="font-semibold text-slate-700">{selectedRoom.floor} · {selectedRoom.wing}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Facilities Installed:</span>
                <span className="font-semibold text-slate-700">{selectedRoom.facilities.join(", ")}</span>
              </div>
            </div>

            {/* Direct Status override */}
            <FormField label="Force PMS Status Override">
              <SelectInput
                value={selectedRoom.status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleStatusChange(roomKey(selectedRoom), e.target.value as any)}
              >
                <option value="Vacant">Vacant (Available for sale)</option>
                <option value="Reserved">Reserved (Future booking)</option>
                <option value="Occupied">Occupied (Guest checked in)</option>
                <option value="Dirty">Dirty (Needs cleaning)</option>
                <option value="Cleaning">Cleaning (In progress)</option>
                <option value="Clean">Clean (Awaiting inspection)</option>
                <option value="Inspected">Inspected (Ready for sale)</option>
                <option value="Blocked">Blocked (Out of service)</option>
              </SelectInput>
            </FormField>

            {/* Switch Flags */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Housekeeping Flag Settings</h4>
              
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => handleToggleDnd(roomKey(selectedRoom))}>
                <div>
                  <p className="text-xs font-bold text-slate-700">Do Not Disturb (DND) Flag</p>
                  <p className="text-[10px] text-slate-400">Skip cleaning. Alerts staff to not enter.</p>
                </div>
                <span className={cn(
                  "px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wide",
                  selectedRoom.dnd ? "bg-red-500 text-white" : "bg-slate-100 text-slate-400"
                )}>
                  {selectedRoom.dnd ? "ON" : "OFF"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => handleToggleSleepOut(roomKey(selectedRoom))}>
                <div>
                  <p className="text-xs font-bold text-slate-700">Sleep Out (SO) Flag</p>
                  <p className="text-[10px] text-slate-400">Guest is paying but did not spend the night.</p>
                </div>
                <span className={cn(
                  "px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wide",
                  selectedRoom.sleepOut ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-400"
                )}>
                  {selectedRoom.sleepOut ? "ON" : "OFF"}
                </span>
              </div>
            </div>

          </div>
        )}
      </Drawer>
    </div>
  );
}
