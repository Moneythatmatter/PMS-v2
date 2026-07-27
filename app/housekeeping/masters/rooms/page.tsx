"use client";

import React, { useState, useMemo } from "react";
import { useHousekeeping } from "@/components/housekeeping/HousekeepingContext";
import { Bed, Plus, CheckCircle2, ShieldAlert, FolderOpen, Heart, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { TextInput, SelectInput, FormField, TextAreaInput } from "@/components/frontoffice/ui";
import { ModuleSelectionBar } from "@/components/pms/ModuleSelectionBar";

const ROOM_CATEGORIES = ["Standard", "Deluxe", "Executive Suite", "Presidential Suite"];
const BED_TYPES = ["King", "Queen", "Twin", "Single"];

export default function RoomMasterConfig() {
  const {
    rooms,
    changeRoomStatus,
    logAudit,
    setRooms,
  } = useHousekeeping();

  const [activeTab, setActiveTab] = useState<"floorplan" | "list">("floorplan");
  const [selectedRoomNo, setSelectedRoomNo] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);

  // Form Fields: New Room
  const [newRoomNo, setNewRoomNo] = useState("");
  const [newCategory, setNewCategory] = useState(ROOM_CATEGORIES[0]);
  const [newBed, setNewBed] = useState(BED_TYPES[0]);
  const [newFloor, setNewFloor] = useState("1st Floor");
  const [newWing, setNewWing] = useState("East Wing");
  const [newOccupancy, setNewOccupancy] = useState("2");
  const [facilities, setFacilities] = useState("WiFi, TV, Safe");
  const [remarks, setRemarks] = useState("");

  const selectedRoom = useMemo(() => {
    return rooms.find((r) => r.roomNo === selectedRoomNo) || null;
  }, [rooms, selectedRoomNo]);

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

  const handleCreateRoom = () => {
    if (!newRoomNo.trim()) return;
    const occ = parseInt(newOccupancy, 10) || 2;
    const facs = facilities.split(",").map((f) => f.trim()).filter(Boolean);

    const newRecord: any = {
      roomNo: newRoomNo,
      category: newCategory,
      bedType: newBed,
      floor: newFloor,
      wing: newWing,
      maxOccupancy: occ,
      cleaningFrequency: "Daily",
      deepCleaningFrequency: "Every 30 Days",
      lastDeepCleaned: "Never",
      status: "Vacant Dirty",
      hkStatus: "Dirty",
      foStatus: "Vacant",
      dnd: false,
      sleepOut: false,
      facilities: facs,
      remarks,
    };

    setRooms((prev: any) => [...prev, newRecord].sort((a, b) => a.roomNo.localeCompare(b.roomNo)));
    logAudit("Room Status", "Room Added", `Created new Room ${newRoomNo} in master plan.`);
    setCreateOpen(false);
    setNewRoomNo("");
    setRemarks("");
  };

  const handleToggleDnd = (roomNo: string) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.roomNo !== roomNo) return r;
        const next = !r.dnd;
        logAudit("Room Status", "DND Toggled", `Toggled DND state for room ${roomNo} to ${next ? "ON" : "OFF"}.`, roomNo);
        return { ...r, dnd: next };
      })
    );
  };

  const handleToggleSleepOut = (roomNo: string) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.roomNo !== roomNo) return r;
        const next = !r.sleepOut;
        logAudit("Room Status", "Sleep Out Toggled", `Toggled Sleep Out state for room ${roomNo} to ${next ? "ON" : "OFF"}.`, roomNo);
        return { ...r, sleepOut: next };
      })
    );
  };

  const handleStatusChange = (roomNo: string, val: any) => {
    changeRoomStatus(roomNo, val);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Masters</span>
          <h1 className="mt-1 text-2xl font-bold text-slate-800">Hotel Room Master</h1>
          <p className="text-sm text-slate-500 font-normal">
            Database of physical rooms, categories, facilities, and floorplan occupancy layout controls.
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Add New Room
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6 text-sm font-semibold">
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
                  const isDirty = room.status.includes("Dirty");
                  const isReady = room.status === "Vacant Ready";
                  const isCleaning = room.status === "Cleaning" || room.status === "Inspection Pending";
                  const isBlocked =
                    room.status === "Blocked" ||
                    room.status === "Out of Order" ||
                    room.status === "Out of Service";

                  return (
                    <div
                      key={room.roomNo}
                      onClick={() => setSelectedRoomNo(room.roomNo)}
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
                  if (firstId) setSelectedRoomNo(firstId);
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
                    checked={rooms.length > 0 && rooms.every((room) => selectedIds.has(room.roomNo))}
                    onChange={() => {
                      const allIds = rooms.map((room) => room.roomNo);
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
                  key={room.roomNo}
                  onClick={() => setSelectedRoomNo(room.roomNo)}
                  className={cn(
                    "hover:bg-slate-50/50 cursor-pointer",
                    selectedIds.has(room.roomNo) && "bg-emerald-50/40",
                  )}
                >
                  <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(room.roomNo)}
                      onChange={() => {
                        const next = new Set(selectedIds);
                        if (next.has(room.roomNo)) next.delete(room.roomNo);
                        else next.add(room.roomNo);
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
                        room.status === "Vacant Ready"
                          ? "bg-emerald-50 text-emerald-700"
                          : room.status.includes("Dirty")
                          ? "bg-red-50 text-red-700"
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
      <Drawer open={!!selectedRoomNo} onClose={() => setSelectedRoomNo(null)} title={`Room ${selectedRoom?.roomNo} Configurations`}>
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
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleStatusChange(selectedRoom.roomNo, e.target.value as any)}
              >
                <option value="Vacant Ready">Vacant Ready (Clean & Inspected)</option>
                <option value="Vacant Dirty">Vacant Dirty (Awaiting clean)</option>
                <option value="Occupied">Occupied Clean (Stay-over ready)</option>
                <option value="Occupied Dirty">Occupied Dirty (Stay-over dirty)</option>
                <option value="Cleaning">Cleaning In Progress</option>
                <option value="Inspection Pending">Inspection Pending</option>
                <option value="Blocked">Blocked (Hold Reservation)</option>
                <option value="Out of Order">Out of Order (OOO locks inventory)</option>
                <option value="Out of Service">Out of Service (OOS minor repairs)</option>
              </SelectInput>
            </FormField>

            {/* Switch Flags */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Housekeeping Flag Settings</h4>
              
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => handleToggleDnd(selectedRoom.roomNo)}>
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

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => handleToggleSleepOut(selectedRoom.roomNo)}>
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

      {/* Drawer: Add New Room */}
      <Drawer open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Hotel Room Master">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Room Number" required>
              <TextInput placeholder="e.g. 105" value={newRoomNo} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRoomNo(e.target.value)} />
            </FormField>
            <FormField label="Room Category">
              <SelectInput value={newCategory} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewCategory(e.target.value)}>
                {ROOM_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </SelectInput>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Bed Specification">
              <SelectInput value={newBed} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewBed(e.target.value)}>
                {BED_TYPES.map((bed) => (
                  <option key={bed} value={bed}>
                    {bed}
                  </option>
                ))}
              </SelectInput>
            </FormField>
            <FormField label="Floor Location">
              <SelectInput value={newFloor} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewFloor(e.target.value)}>
                <option value="1st Floor">1st Floor</option>
                <option value="2nd Floor">2nd Floor</option>
                <option value="3rd Floor">3rd Floor</option>
                <option value="4th Floor">4th Floor</option>
                <option value="5th Floor">5th Floor</option>
              </SelectInput>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Hotel Wing">
              <TextInput placeholder="e.g. East Wing" value={newWing} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewWing(e.target.value)} />
            </FormField>
            <FormField label="Max Occupancy (Adults)">
              <TextInput type="number" value={newOccupancy} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewOccupancy(e.target.value)} />
            </FormField>
          </div>

          <FormField label="Facilities Installed (comma separated)">
            <TextInput value={facilities} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFacilities(e.target.value)} />
          </FormField>

          <FormField label="Configuration Remarks">
            <TextAreaInput
              placeholder="Any structural anomalies, proximity notes, or connection doors details."
              value={remarks}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRemarks(e.target.value)}
            />
          </FormField>

          <Button
            onClick={handleCreateRoom}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white"
          >
            Register Room
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
