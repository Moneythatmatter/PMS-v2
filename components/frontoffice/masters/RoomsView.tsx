"use client";

import { useEffect, useMemo, useState } from "react";
import { BedDouble, CheckCircle2, Plus } from "lucide-react";
import { roomTypes } from "@/app/data/frontoffice/constants";
import type { RoomMaster } from "@/app/data/frontoffice/masters";
import { roomService } from "@/services/front-office";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  AlertBanner,
  Drawer,
  FormField,
  FOPageHeader,
  FOSearchToolbar,
  SelectInput,
  StatMiniCard,
  TextInput,
} from "@/components/frontoffice/ui";

const BED_TYPES = ["King", "Queen", "Twin", "Single"] as const;
const ROOM_STATUSES = ["Vacant", "Reserved", "Occupied", "Dirty", "Maintenance", "Blocked"] as const;

function formatUpdatedAt(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export function RoomsView() {
  const [items, setItems] = useState<RoomMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RoomMaster | null>(null);
  const [preview, setPreview] = useState<RoomMaster | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [roomNo, setRoomNo] = useState("");
  const [roomType, setRoomType] = useState(roomTypes[0] ?? "Standard");
  const [floor, setFloor] = useState("1st Floor");
  const [status, setStatus] = useState<string>("Vacant");
  const [maxOccupancy, setMaxOccupancy] = useState("2");
  const [bedType, setBedType] = useState<string>("Queen");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await roomService.list();
        if (!cancelled) {
          setItems(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((r) => {
      const matchesActive =
        activeFilter === "all" ||
        (activeFilter === "active" && r.isActive !== false) ||
        (activeFilter === "inactive" && r.isActive === false);
      return (
        matchesActive &&
        (!q ||
          r.roomNo.toLowerCase().includes(q) ||
          (r.roomType ?? "").toLowerCase().includes(q) ||
          (r.floor ?? "").toLowerCase().includes(q) ||
          (r.bedType ?? "").toLowerCase().includes(q))
      );
    });
  }, [items, search, activeFilter]);

  const stats = useMemo(
    () => ({
      total: items.length,
      active: items.filter((r) => r.isActive !== false).length,
      inactive: items.filter((r) => r.isActive === false).length,
    }),
    [items],
  );

  const resetForm = () => {
    setEditing(null);
    setRoomNo("");
    setRoomType(roomTypes[0] ?? "Standard");
    setFloor("1st Floor");
    setStatus("Vacant");
    setMaxOccupancy("2");
    setBedType("Queen");
    setIsActive(true);
  };

  const openCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (row: RoomMaster) => {
    setEditing(row);
    setRoomNo(row.roomNo);
    setRoomType(row.roomType ?? "Standard");
    setFloor(row.floor ?? "");
    setStatus(row.status ?? "Vacant");
    setMaxOccupancy(String(row.maxOccupancy ?? 2));
    setBedType(row.bedType ?? "Queen");
    setIsActive(row.isActive !== false);
    setPreview(null);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!roomNo.trim() || !roomType.trim()) {
      setToast("Room number and type are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        roomNo: roomNo.trim(),
        roomType: roomType.trim(),
        floor: floor.trim(),
        status,
        maxOccupancy: parseInt(maxOccupancy, 10) || 2,
        bedType,
        isActive,
      };
      if (editing) {
        const record = await roomService.update(editing.id ?? editing.roomNo, payload);
        setItems((prev) => prev.map((r) => (r.id === editing.id ? record : r)));
        setToast(`Room ${record.roomNo} updated.`);
      } else {
        const record = await roomService.create(payload);
        setItems((prev) => [...prev, record].sort((a, b) => a.roomNo.localeCompare(b.roomNo)));
        setToast(`Room ${record.roomNo} added.`);
      }
      setFormOpen(false);
      resetForm();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to save room");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-5">
      {toast && (
        <AlertBanner variant="success" message={toast} onDismiss={() => setToast(null)} />
      )}

      <FOPageHeader
        eyebrow="Front Office · Masters"
        title="Rooms"
        description="Physical room inventory — number, type, capacity, bed, and active flag."
        action={
          <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800" onClick={openCreate}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Room
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatMiniCard label="Rooms" value={stats.total} icon={BedDouble} />
        <StatMiniCard label="Active" value={stats.active} accent="#10b981" icon={CheckCircle2} />
        <StatMiniCard label="Inactive" value={stats.inactive} accent="#94a3b8" icon={BedDouble} />
      </div>

      <FOSearchToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search room no., type, floor, bed…"
        filterPills={{
          active: activeFilter,
          onChange: setActiveFilter,
          options: [
            { id: "all", label: "All" },
            { id: "active", label: "Active" },
            { id: "inactive", label: "Inactive" },
          ],
        }}
      />

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Room</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Floor</th>
              <th className="px-4 py-3">Max Occ.</th>
              <th className="px-4 py-3">Bed</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((row) => (
              <tr
                key={row.id}
                className="cursor-pointer hover:bg-emerald-50/40"
                onClick={() => setPreview(row)}
              >
                <td className="px-4 py-3 font-semibold text-slate-900">{row.roomNo}</td>
                <td className="px-4 py-3 text-slate-600">{row.roomType}</td>
                <td className="px-4 py-3 text-slate-600">{row.floor ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{row.maxOccupancy ?? 2}</td>
                <td className="px-4 py-3 text-slate-600">{row.bedType ?? "—"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status ?? "Vacant"} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.isActive === false ? "Inactive" : "Active"} />
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{formatUpdatedAt(row.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer
        open={!!preview}
        onClose={() => setPreview(null)}
        title={`Room ${preview?.roomNo ?? ""}`}
        description={preview?.roomType}
        footer={
          preview ? (
            <>
              <Button variant="outline" onClick={() => setPreview(null)}>Close</Button>
              <Button className="bg-emerald-700 hover:bg-emerald-800" onClick={() => openEdit(preview)}>
                Edit
              </Button>
            </>
          ) : undefined
        }
      >
        {preview && (
          <dl className="space-y-3 text-sm">
            {[
              ["Room No.", preview.roomNo],
              ["Type", preview.roomType],
              ["Floor", preview.floor ?? "—"],
              ["Max Occupancy", String(preview.maxOccupancy ?? 2)],
              ["Bed Type", preview.bedType ?? "—"],
              ["Inventory Status", preview.status ?? "Vacant"],
              ["Active", preview.isActive === false ? "No" : "Yes"],
              ["Updated", formatUpdatedAt(preview.updatedAt)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 border-b border-slate-50 pb-2">
                <dt className="text-slate-500">{label}</dt>
                <dd className="font-medium text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Drawer>

      <Drawer
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          resetForm();
        }}
        title={editing ? `Edit Room ${editing.roomNo}` : "Add Room"}
      >
        <div className="space-y-4">
          <FormField label="Room Number" required>
            <TextInput value={roomNo} onChange={(e) => setRoomNo(e.target.value)} disabled={!!editing} />
          </FormField>
          <FormField label="Room Type" required>
            <SelectInput value={roomType} onChange={(e) => setRoomType(e.target.value)}>
              {roomTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Floor">
            <TextInput value={floor} onChange={(e) => setFloor(e.target.value)} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Max Occupancy">
              <TextInput type="number" min={1} value={maxOccupancy} onChange={(e) => setMaxOccupancy(e.target.value)} />
            </FormField>
            <FormField label="Bed Type">
              <SelectInput value={bedType} onChange={(e) => setBedType(e.target.value)}>
                {BED_TYPES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </SelectInput>
            </FormField>
          </div>
          <FormField label="Inventory Status">
            <SelectInput value={status} onChange={(e) => setStatus(e.target.value)}>
              {ROOM_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Active">
            <SelectInput value={isActive ? "yes" : "no"} onChange={(e) => setIsActive(e.target.value === "yes")}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </SelectInput>
          </FormField>
          <Button className="w-full bg-emerald-700 hover:bg-emerald-800" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : editing ? "Update Room" : "Create Room"}
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
