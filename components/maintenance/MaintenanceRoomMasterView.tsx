"use client";

import { useEffect, useMemo, useState } from "react";
import { Bed, CheckCircle2, Loader2, Plus, AlertCircle } from "lucide-react";
import type { MntLocationStatus, MntRoom } from "@/app/data/maintenance/types";
import { mntRoomMasterService } from "@/services/maintenance/index";
import { roomService, type RoomDto } from "@/services/front-office/rooms";
import { Button, Drawer } from "@/components/ui";
import {
  FormField,
  SelectInput,
  TextAreaInput,
} from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";
import { useSubmitLock } from "@/hooks/useSubmitLock";

const STATUSES: MntLocationStatus[] = [
  "Operational",
  "Under Maintenance",
  "Out of Service",
];

const statusBadge: Record<MntLocationStatus, string> = {
  Operational: "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Under Maintenance": "bg-amber-100 text-amber-800 border-amber-200",
  "Out of Service": "bg-rose-100 text-rose-800 border-rose-200",
};

export function MaintenanceRoomMasterView() {
  const [rooms, setRooms] = useState<MntRoom[]>([]);
  const [foRooms, setFoRooms] = useState<RoomDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<MntRoom | null>(null);
  const [formRoomId, setFormRoomId] = useState("");
  const [formStatus, setFormStatus] = useState<MntLocationStatus>("Operational");
  const [formNotes, setFormNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const { saving, runLocked } = useSubmitLock();

  const load = async () => {
    try {
      setLoading(true);
      const [mnt, fo] = await Promise.all([
        mntRoomMasterService.list(),
        roomService.list(),
      ]);
      setRooms(mnt);
      setFoRooms(fo);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const linkedIds = useMemo(
    () => new Set(rooms.map((r) => r.roomId)),
    [rooms],
  );

  const availableFoRooms = useMemo(
    () => foRooms.filter((r) => !linkedIds.has(r.id)),
    [foRooms, linkedIds],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rooms.filter((r) => {
      const matchesSearch =
        !q ||
        String(r.roomNo ?? "").toLowerCase().includes(q) ||
        String(r.roomType ?? "").toLowerCase().includes(q) ||
        String(r.floor ?? "").toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "ALL" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rooms, search, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setFormRoomId(availableFoRooms[0]?.id ?? "");
    setFormStatus("Operational");
    setFormNotes("");
    setFormError(null);
    setDrawerOpen(true);
  };

  const openEdit = (row: MntRoom) => {
    setEditing(row);
    setFormRoomId(row.roomId);
    setFormStatus(row.status);
    setFormNotes(row.notes ?? "");
    setFormError(null);
    setDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    await runLocked(async () => {
      try {
        if (editing) {
          const updated = await mntRoomMasterService.update(editing.id, {
            status: formStatus,
            notes: formNotes.trim() || null,
          });
          setRooms((prev) =>
            prev.map((r) => (r.id === updated.id ? updated : r)),
          );
          setToast(`Updated room ${updated.roomNo ?? ""}`);
        } else {
          if (!formRoomId) {
            setFormError("Select a Front Office room.");
            return;
          }
          const created = await mntRoomMasterService.create({
            roomId: formRoomId,
            status: formStatus,
            notes: formNotes.trim() || null,
          } as Partial<MntRoom>);
          setRooms((prev) =>
            [...prev, created].sort((a, b) =>
              String(a.roomNo ?? "").localeCompare(String(b.roomNo ?? ""), undefined, {
                numeric: true,
              }),
            ),
          );
          setToast(`Linked room ${created.roomNo ?? ""}`);
        }
        setDrawerOpen(false);
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Save failed");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Masters
          </span>
          <h1 className="mt-1 text-2xl font-bold text-slate-800">Room Master</h1>
          <p className="text-sm font-normal text-slate-500">
            Maintenance view of FO guest rooms. New FO rooms sync here automatically.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="flex items-center gap-1.5 self-start bg-emerald-700 text-white hover:bg-emerald-800 sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Link FO Room
        </Button>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          {toast}
          <button type="button" className="ml-auto text-xs" onClick={() => setToast(null)}>
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search rooms…"
          className="h-9 min-w-[200px] flex-1 rounded-lg border border-slate-200 px-3 text-sm"
        />
        <SelectInput
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-44"
        >
          <option value="ALL">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </SelectInput>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading…
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Room</th>
                <th className="px-4 py-3 font-semibold">Floor</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Notes</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    No rooms linked yet. Create rooms in Front Office or link one here.
                  </td>
                </tr>
              ) : (
                filtered.map((room) => (
                  <tr
                    key={room.id}
                    className="border-b border-slate-50 hover:bg-slate-50/80"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 font-semibold text-slate-800">
                        <Bed className="h-4 w-4 text-slate-400" />
                        {room.roomNo ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{room.floor ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{room.roomType ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-md border px-2 py-0.5 text-[11px] font-bold",
                          statusBadge[room.status],
                        )}
                      >
                        {room.status}
                      </span>
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-slate-500">
                      {room.notes || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(room)}
                        className="text-xs font-semibold text-emerald-700 hover:underline"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Drawer
        isOpen={drawerOpen}
        onClose={() => !saving && setDrawerOpen(false)}
        title={editing ? `Edit Room ${editing.roomNo ?? ""}` : "Link FO Room"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-1 text-xs">
          {!editing && (
            <FormField label="Front Office room" required>
              <SelectInput
                value={formRoomId}
                onChange={(e) => setFormRoomId(e.target.value)}
                required
              >
                <option value="">Select room…</option>
                {availableFoRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.roomNo} · {r.roomType ?? "Room"} · {r.floor ?? "—"}
                  </option>
                ))}
              </SelectInput>
            </FormField>
          )}
          <FormField label="Maintenance status" required>
            <SelectInput
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as MntLocationStatus)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Notes">
            <TextAreaInput
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={3}
              placeholder="Optional engineering notes"
            />
          </FormField>
          {formError && (
            <p className="text-sm text-rose-600">{formError}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setDrawerOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-emerald-700 text-white hover:bg-emerald-800"
            >
              {saving ? "Saving…" : editing ? "Save" : "Link room"}
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
