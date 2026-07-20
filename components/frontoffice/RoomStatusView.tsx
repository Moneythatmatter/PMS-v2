"use client";

import { useEffect, useMemo, useState } from "react";
import { BedDouble, Building2, Sparkles, Wrench } from "lucide-react";
import type { RoomStatusCard } from "@/app/data/frontoffice/modules";
import { floors, roomStatuses } from "@/app/data/frontoffice/constants";
import { Button } from "@/components/ui/Button";
import { initialHKRooms } from "@/components/housekeeping/HousekeepingData";
import type { HKRoom } from "@/components/housekeeping/HousekeepingTypes";

const mapHKRoomToFOCard = (r: HKRoom): RoomStatusCard => {
  let foStatusStr = "Vacant";
  if (r.status === "Blocked") foStatusStr = "Blocked";
  else if (r.status === "Out of Order" || r.status === "Out of Service") foStatusStr = "Maintenance";
  else if (r.status.includes("Dirty")) foStatusStr = "Dirty";
  else if (r.status === "Vacant Ready") foStatusStr = "Clean";
  else if (r.foStatus === "Occupied") foStatusStr = "Occupied";
  else if (r.foStatus === "Vacant") foStatusStr = "Vacant";

  return {
    roomNo: r.roomNo,
    type: r.category,
    floor: r.floor,
    status: foStatusStr,
    guestName: r.guestName,
    housekeeping: r.hkStatus === "Inspected" ? "Inspected" : r.hkStatus === "Clean" ? "Clean" : r.hkStatus === "Cleaning" ? "In Progress" : r.hkStatus,
    maintenance: r.status === "Out of Order" ? "In Progress" : "OK",
    checkoutDate: r.checkoutDate,
  };
};
import {
  AlertBanner,
  FormField,
  FOPageHeader,
  FOSearchToolbar,
  Modal,
  SelectInput,
  StatMiniCard,
} from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  string,
  { card: string; dot: string; icon?: React.ComponentType<{ className?: string }> }
> = {
  Vacant: { card: "border-emerald-200 bg-emerald-50/80", dot: "bg-emerald-500" },
  Occupied: { card: "border-emerald-200 bg-emerald-50/80", dot: "bg-emerald-500" },
  Dirty: { card: "border-amber-200 bg-amber-50/80", dot: "bg-amber-500" },
  Clean: { card: "border-teal-200 bg-teal-50/80", dot: "bg-teal-500" },
  Maintenance: { card: "border-orange-200 bg-orange-50/80", dot: "bg-orange-500", icon: Wrench },
  Blocked: { card: "border-slate-300 bg-slate-100", dot: "bg-slate-400" },
};

const hkStatuses = ["Clean", "Dirty", "Inspected", "In Progress"] as const;

export function RoomStatusView() {
  const [rooms, setRooms] = useState<RoomStatusCard[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [floorFilter, setFloorFilter] = useState("all");
  const [selectedRoom, setSelectedRoom] = useState<RoomStatusCard | null>(null);
  const [actionType, setActionType] = useState<"assign" | "hk" | "status" | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [newHk, setNewHk] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const loadRooms = () => {
      const stored = localStorage.getItem("hk_rooms");
      if (stored) {
        const hkRooms: HKRoom[] = JSON.parse(stored);
        setRooms(hkRooms.map(mapHKRoomToFOCard));
      } else {
        localStorage.setItem("hk_rooms", JSON.stringify(initialHKRooms));
        setRooms(initialHKRooms.map(mapHKRoomToFOCard));
      }
    };
    loadRooms();
    window.addEventListener("storage", loadRooms);
    return () => window.removeEventListener("storage", loadRooms);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rooms.filter((r) => {
      const statusMatch = filter === "all" || r.status.toLowerCase() === filter;
      const floorMatch = floorFilter === "all" || r.floor === floorFilter;
      const searchMatch =
        !q ||
        r.roomNo.includes(q) ||
        r.type.toLowerCase().includes(q) ||
        (r.guestName?.toLowerCase().includes(q) ?? false);
      return statusMatch && floorMatch && searchMatch;
    });
  }, [rooms, filter, floorFilter, search]);

  const stats = useMemo(
    () => ({
      total: rooms.length,
      occupied: rooms.filter((r) => r.status === "Occupied").length,
      vacant: rooms.filter((r) => r.status === "Vacant").length,
      dirty: rooms.filter((r) => r.housekeeping === "Dirty" || r.status === "Dirty").length,
      maintenance: rooms.filter((r) => r.status === "Maintenance").length,
    }),
    [rooms],
  );

  const openAction = (room: RoomStatusCard, type: "assign" | "hk" | "status") => {
    setSelectedRoom(room);
    setActionType(type);
    setNewStatus(room.status);
    setNewHk(room.housekeeping);
  };

  const handleSave = () => {
    if (!selectedRoom) return;

    const stored = localStorage.getItem("hk_rooms");
    if (!stored) return;
    const hkRooms: HKRoom[] = JSON.parse(stored);

    const updatedHKRooms = hkRooms.map((r) => {
      if (r.roomNo !== selectedRoom.roomNo) return r;

      const updated = { ...r };

      if (actionType === "status" && newStatus) {
        if (newStatus === "Occupied") {
          updated.foStatus = "Occupied";
          updated.status = "Occupied";
        } else if (newStatus === "Vacant") {
          updated.foStatus = "Vacant";
          updated.status = updated.hkStatus === "Inspected" ? "Vacant Ready" : "Vacant Dirty";
        } else if (newStatus === "Blocked") {
          updated.foStatus = "Blocked";
          updated.status = "Blocked";
        } else if (newStatus === "Maintenance") {
          updated.status = "Out of Order";
          updated.hkStatus = "OOO";
        }
      }

      if (actionType === "hk" && newHk) {
        updated.hkStatus = newHk as any;
        if (newHk === "Dirty") {
          updated.status = updated.foStatus === "Occupied" ? "Occupied Dirty" : "Vacant Dirty";
        } else if (newHk === "Clean") {
          updated.status = updated.foStatus === "Occupied" ? "Occupied" : "Vacant Ready";
        } else if (newHk === "Inspected") {
          updated.status = updated.foStatus === "Occupied" ? "Occupied" : "Vacant Ready";
        }
      }

      return updated;
    });

    localStorage.setItem("hk_rooms", JSON.stringify(updatedHKRooms));
    setRooms(updatedHKRooms.map(mapHKRoomToFOCard));

    // Dispatch standard event so other components reload
    window.dispatchEvent(new Event("storage"));

    setToast(
      actionType === "hk"
        ? `Housekeeping updated for Room ${selectedRoom.roomNo}.`
        : actionType === "status"
          ? `Room ${selectedRoom.roomNo} status changed to ${newStatus}.`
          : `Room ${selectedRoom.roomNo} assigned successfully.`,
    );
    setSelectedRoom(null);
    setActionType(null);
  };

  return (
    <div className="space-y-5">
      {toast && (
        <AlertBanner variant="success" message={toast} onDismiss={() => setToast(null)} />
      )}

      <FOPageHeader
        eyebrow="Front Office"
        title="Room Status"
        description="Real-time room inventory, housekeeping, and maintenance status board."
        badge={
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
            <BedDouble className="h-4 w-4 text-emerald-600" />
            {stats.occupied}/{stats.total} occupied
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <StatMiniCard label="Total Rooms" value={stats.total} icon={Building2} />
        <StatMiniCard label="Occupied" value={stats.occupied} accent="#16a34a" icon={BedDouble} />
        <StatMiniCard label="Vacant" value={stats.vacant} accent="#22c55e" icon={BedDouble} />
        <StatMiniCard label="Dirty / HK" value={stats.dirty} accent="#f59e0b" icon={Sparkles} />
        <StatMiniCard label="Maintenance" value={stats.maintenance} accent="#f97316" icon={Wrench} />
      </div>

      <FOSearchToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search room number, type, or guest…"
        filterPills={{
          active: filter,
          onChange: setFilter,
          options: [
            { id: "all", label: "All" },
            ...roomStatuses.map((s) => ({ id: s.toLowerCase(), label: s })),
          ],
        }}
        hasActiveAdvancedFilters={floorFilter !== "all"}
        onClearAdvancedFilters={() => setFloorFilter("all")}
        advancedFilters={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Floor">
              <SelectInput
                value={floorFilter}
                onChange={(e) => setFloorFilter(e.target.value)}
              >
                <option value="all">All Floors</option>
                {floors.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </SelectInput>
            </FormField>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filtered.map((room) => {
          const config = statusConfig[room.status] ?? statusConfig.Vacant;
          const StatusIcon = config.icon;

          return (
            <div
              key={room.roomNo}
              className={cn(
                "group relative rounded-xl border p-4 transition-all hover:shadow-md",
                config.card,
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xl font-bold text-slate-900">{room.roomNo}</p>
                  <p className="text-[11px] text-slate-500">{room.type}</p>
                </div>
                <span className={cn("mt-1 h-2.5 w-2.5 rounded-full", config.dot)} />
              </div>

              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                {room.status}
              </p>
              {room.guestName && (
                <p className="mt-1 truncate text-sm font-medium text-slate-800">
                  {room.guestName}
                </p>
              )}
              {room.checkoutDate && (
                <p className="text-[11px] text-slate-500">Out: {room.checkoutDate}</p>
              )}

              <div className="mt-3 space-y-1 border-t border-black/5 pt-3">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                  <Sparkles className="h-3 w-3" />
                  HK: {room.housekeeping}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                  {StatusIcon ? <StatusIcon className="h-3 w-3" /> : <Wrench className="h-3 w-3" />}
                  Maint: {room.maintenance}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 flex-1 px-2 text-[10px] bg-white/80"
                  onClick={() => openAction(room, "status")}
                >
                  Status
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 flex-1 px-2 text-[10px] bg-white/80"
                  onClick={() => openAction(room, "hk")}
                >
                  HK
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-500">
          No rooms match the selected filters.
        </p>
      )}

      <Modal
        open={!!selectedRoom && !!actionType}
        onClose={() => { setSelectedRoom(null); setActionType(null); }}
        title={
          actionType === "hk"
            ? `Housekeeping — Room ${selectedRoom?.roomNo}`
            : actionType === "status"
              ? `Update Status — Room ${selectedRoom?.roomNo}`
              : `Assign Room ${selectedRoom?.roomNo}`
        }
        footer={
          <>
            <Button variant="outline" onClick={() => { setSelectedRoom(null); setActionType(null); }}>
              Cancel
            </Button>
            <Button className="bg-emerald-700 hover:bg-emerald-800" onClick={handleSave}>
              Save Changes
            </Button>
          </>
        }
      >
        {actionType === "status" && (
          <SelectInput value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
            {roomStatuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </SelectInput>
        )}
        {actionType === "hk" && (
          <SelectInput value={newHk} onChange={(e) => setNewHk(e.target.value)}>
            {hkStatuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </SelectInput>
        )}
      </Modal>
    </div>
  );
}
