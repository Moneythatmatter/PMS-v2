"use client";

import { useEffect, useMemo, useState } from "react";
import { BedDouble, CheckCircle2, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { roomTypes } from "@/app/data/frontoffice/constants";
import type { RoomMaster } from "@/app/data/frontoffice/masters";
import { roomService } from "@/services/front-office";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  AlertBanner,
  ConfirmModal,
  Drawer,
  FormField,
  FOPageHeader,
  FOSearchToolbar,
  SelectInput,
  StatMiniCard,
  TextInput,
} from "@/components/frontoffice/ui";

const BED_TYPES = ["King", "Queen", "Twin", "Single"] as const;

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
  const [softDeleteTarget, setSoftDeleteTarget] = useState<RoomMaster | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");
  const [saving, setSaving] = useState(false);

  const [roomNo, setRoomNo] = useState("");
  const [roomType, setRoomType] = useState<string>(roomTypes[0] ?? "Standard");
  const [floor, setFloor] = useState("1st Floor");
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
    setMaxOccupancy(String(row.maxOccupancy ?? 2));
    setBedType(row.bedType ?? "Queen");
    setIsActive(row.isActive !== false);
    setPreview(null);
    setFormOpen(true);
  };

  const showToast = (message: string, variant: "success" | "error" = "success") => {
    setToastVariant(variant);
    setToast(message);
  };

  const handleSave = async () => {
    if (!roomNo.trim() || !roomType.trim()) {
      showToast("Room number and type are required.", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        roomNo: roomNo.trim(),
        roomType: roomType.trim(),
        floor: floor.trim(),
        maxOccupancy: parseInt(maxOccupancy, 10) || 2,
        bedType,
        isActive,
      };
      if (editing) {
        const record = await roomService.update(editing.id ?? editing.roomNo, payload);
        setItems((prev) => prev.map((r) => (r.id === editing.id ? record : r)));
        showToast(`Room ${record.roomNo} updated.`);
      } else {
        const record = await roomService.create(payload);
        setItems((prev) => [...prev, record].sort((a, b) => a.roomNo.localeCompare(b.roomNo)));
        showToast(`Room ${record.roomNo} added.`);
      }
      setFormOpen(false);
      resetForm();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to save room", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSoftDelete = async () => {
    if (!softDeleteTarget) return;
    setSaving(true);
    try {
      const record = await roomService.update(softDeleteTarget.id ?? softDeleteTarget.roomNo, {
        isActive: false,
      });
      setItems((prev) => prev.map((r) => (r.id === softDeleteTarget.id ? record : r)));
      setSoftDeleteTarget(null);
      setPreview(null);
      showToast(`Room ${softDeleteTarget.roomNo} deactivated.`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to deactivate", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleReactivate = async (row: RoomMaster) => {
    setSaving(true);
    try {
      const record = await roomService.update(row.id ?? row.roomNo, { isActive: true });
      setItems((prev) => prev.map((r) => (r.id === row.id ? record : r)));
      setPreview(null);
      showToast(`Room ${row.roomNo} reactivated.`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to reactivate", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-5">
      {toast && (
        <AlertBanner variant={toastVariant} message={toast} onDismiss={() => setToast(null)} />
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
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3">Actions</th>
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
                  <StatusBadge status={row.isActive === false ? "Inactive" : "Active"} />
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{formatUpdatedAt(row.updatedAt)}</td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Edit"
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-emerald-700"
                      onClick={() => openEdit(row)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {row.isActive !== false ? (
                      <button
                        type="button"
                        title="Deactivate (soft delete)"
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => setSoftDeleteTarget(row)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        title="Reactivate"
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                        onClick={() => handleReactivate(row)}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </td>
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
            <div className="flex w-full flex-wrap gap-2">
              <Button variant="outline" onClick={() => setPreview(null)}>Close</Button>
              <Button variant="outline" className="gap-1.5" onClick={() => openEdit(preview)}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              {preview.isActive !== false ? (
                <Button
                  variant="outline"
                  className="gap-1.5 text-red-600 hover:bg-red-50"
                  onClick={() => setSoftDeleteTarget(preview)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Deactivate
                </Button>
              ) : (
                <Button
                  className="gap-1.5 bg-emerald-700 hover:bg-emerald-800"
                  onClick={() => handleReactivate(preview)}
                  disabled={saving}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reactivate
                </Button>
              )}
            </div>
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

      <ConfirmModal
        open={!!softDeleteTarget}
        onClose={() => setSoftDeleteTarget(null)}
        onConfirm={handleSoftDelete}
        title="Deactivate room?"
        message={
          softDeleteTarget
            ? `Room ${softDeleteTarget.roomNo} will be marked inactive (soft delete). It stays in the database but won't be available for new assignments.`
            : ""
        }
        confirmLabel="Deactivate"
        variant="danger"
        loading={saving}
      />
    </div>
  );
}
