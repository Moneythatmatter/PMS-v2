"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, MapPin, Trees, AlertCircle } from "lucide-react";
import type { MntLocationStatus, MntPublicArea } from "@/app/data/maintenance/types";
import { mntPublicAreaService } from "@/services/maintenance/index";
import { Button, Drawer } from "@/components/ui";
import {
  FormField,
  SelectInput,
  TextAreaInput,
  FOPageHeader,
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

export function MaintenancePublicAreasView() {
  const [items, setItems] = useState<MntPublicArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<MntPublicArea | null>(null);
  const [formStatus, setFormStatus] = useState<MntLocationStatus>("Operational");
  const [formNotes, setFormNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const { saving, runLocked } = useSubmitLock();

  const load = async () => {
    try {
      setLoading(true);
      const data = await mntPublicAreaService.list();
      setItems(data);
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

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((a) => {
      const matchesSearch =
        !q ||
        String(a.areaCode ?? "").toLowerCase().includes(q) ||
        String(a.name ?? "").toLowerCase().includes(q) ||
        String(a.areaType ?? "").toLowerCase().includes(q) ||
        String(a.location ?? "").toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "ALL" || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

  const stats = useMemo(
    () => ({
      total: items.length,
      underMaint: items.filter((a) => a.status === "Under Maintenance").length,
      oos: items.filter((a) => a.status === "Out of Service").length,
    }),
    [items],
  );

  const openEdit = (row: MntPublicArea) => {
    setEditing(row);
    setFormStatus(row.status);
    setFormNotes(row.notes ?? "");
    setFormError(null);
    setDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setFormError(null);

    await runLocked(async () => {
      try {
        const updated = await mntPublicAreaService.update(editing.id, {
          status: formStatus,
          notes: formNotes.trim() || null,
        });
        setItems((prev) =>
          prev.map((r) => (r.id === updated.id ? updated : r)),
        );
        setToast(`Updated ${updated.name ?? updated.areaCode ?? "area"}`);
        setDrawerOpen(false);
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Save failed");
      }
    });
  };

  return (
    <div className="space-y-6">
      <FOPageHeader
        eyebrow="Masters"
        title="Public Area Master"
        description="Synced from Housekeeping public areas. Create areas in Housekeeping — they appear here automatically for engineering status."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Total areas</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <p className="text-xs font-semibold uppercase text-amber-700">Under maintenance</p>
          <p className="mt-1 text-2xl font-bold text-amber-900">{stats.underMaint}</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4">
          <p className="text-xs font-semibold uppercase text-rose-700">Out of service</p>
          <p className="mt-1 text-2xl font-bold text-rose-900">{stats.oos}</p>
        </div>
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
          placeholder="Search area code, name, location…"
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
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center text-sm text-slate-500">
          No public areas yet. Create them under Housekeeping → Masters → Public Areas.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((area) => (
            <button
              key={area.id}
              type="button"
              onClick={() => openEdit(area)}
              className="rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-emerald-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-100 bg-slate-50">
                    <Trees className="h-4 w-4 text-emerald-700" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      {area.areaCode}
                    </p>
                    <h3 className="font-semibold text-slate-900">{area.name}</h3>
                  </div>
                </div>
                <span
                  className={cn(
                    "inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold",
                    statusBadge[area.status],
                  )}
                >
                  {area.status}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {area.areaType}
                  {area.location ? ` · ${area.location}` : ""}
                </span>
              </div>
              {area.notes && (
                <p className="mt-2 line-clamp-2 text-xs text-slate-500">{area.notes}</p>
              )}
            </button>
          ))}
        </div>
      )}

      <Drawer
        isOpen={drawerOpen}
        onClose={() => !saving && setDrawerOpen(false)}
        title={editing ? editing.name ?? "Public area" : "Public area"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-1 text-xs">
          {editing && (
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-slate-600">
              <p className="font-semibold text-slate-800">{editing.areaCode}</p>
              <p>{editing.areaType}{editing.location ? ` · ${editing.location}` : ""}</p>
              <p className="mt-1 text-[11px] text-slate-400">
                Master data is managed in Housekeeping. Update engineering status here.
              </p>
            </div>
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
          {formError && <p className="text-sm text-rose-600">{formError}</p>}
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
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
