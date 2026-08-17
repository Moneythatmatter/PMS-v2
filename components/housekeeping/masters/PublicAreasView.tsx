"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, MapPin, Plus, Trees } from "lucide-react";
import {
  PUBLIC_AREA_PRIORITIES,
  PUBLIC_AREA_TYPES,
  type PublicAreaMaster,
  type PublicAreaPriority,
} from "@/app/data/housekeeping/masters";
import { publicAreaMasterService } from "@/services/housekeeping/public-areas-master";
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

function formatUpdatedAt(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function priorityLabel(p: string) {
  return p.charAt(0) + p.slice(1).toLowerCase();
}

export function PublicAreasView() {
  const [items, setItems] = useState<PublicAreaMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PublicAreaMaster | null>(null);
  const [preview, setPreview] = useState<PublicAreaMaster | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [areaCode, setAreaCode] = useState("");
  const [name, setName] = useState("");
  const [areaType, setAreaType] = useState<string>(PUBLIC_AREA_TYPES[0]);
  const [location, setLocation] = useState("");
  const [floorNumber, setFloorNumber] = useState("");
  const [priority, setPriority] = useState<PublicAreaPriority>("MEDIUM");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await publicAreaMasterService.list();
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
    return items.filter((a) => {
      const matchesActive =
        activeFilter === "all" ||
        (activeFilter === "active" && a.isActive !== false) ||
        (activeFilter === "inactive" && a.isActive === false);
      return (
        matchesActive &&
        (!q ||
          a.areaCode.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          a.areaType.toLowerCase().includes(q) ||
          (a.location ?? "").toLowerCase().includes(q))
      );
    });
  }, [items, search, activeFilter]);

  const stats = useMemo(
    () => ({
      total: items.length,
      active: items.filter((a) => a.isActive !== false).length,
      highPriority: items.filter((a) => a.priority === "HIGH" || a.priority === "URGENT").length,
    }),
    [items],
  );

  const resetForm = () => {
    setEditing(null);
    setAreaCode("");
    setName("");
    setAreaType(PUBLIC_AREA_TYPES[0]);
    setLocation("");
    setFloorNumber("");
    setPriority("MEDIUM");
    setIsActive(true);
  };

  const openCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (row: PublicAreaMaster) => {
    setEditing(row);
    setAreaCode(row.areaCode);
    setName(row.name);
    setAreaType(row.areaType);
    setLocation(row.location ?? "");
    setFloorNumber(row.floorNumber != null ? String(row.floorNumber) : "");
    setPriority(row.priority);
    setIsActive(row.isActive !== false);
    setPreview(null);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!areaCode.trim() || !name.trim()) {
      setToast("Area code and name are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        areaCode: areaCode.trim().toUpperCase(),
        name: name.trim(),
        areaType,
        location: location.trim() || null,
        floorNumber: floorNumber.trim() ? parseInt(floorNumber, 10) : null,
        priority,
        isActive,
      };
      if (editing) {
        const record = await publicAreaMasterService.update(editing.id, payload);
        setItems((prev) => prev.map((a) => (a.id === editing.id ? record : a)));
        setToast(`${record.name} updated.`);
      } else {
        const record = await publicAreaMasterService.create(payload);
        setItems((prev) =>
          [...prev, record].sort((a, b) => a.areaCode.localeCompare(b.areaCode)),
        );
        setToast(`${record.name} added.`);
      }
      setFormOpen(false);
      resetForm();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to save public area");
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
        eyebrow="Housekeeping · Masters"
        title="Public Areas"
        description="Master list of lobbies, corridors, restrooms, and other shared spaces for cleaning operations."
        action={
          <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800" onClick={openCreate}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Public Area
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatMiniCard label="Areas" value={stats.total} icon={Trees} />
        <StatMiniCard label="Active" value={stats.active} accent="#10b981" icon={CheckCircle2} />
        <StatMiniCard label="High / Urgent" value={stats.highPriority} accent="#d97706" icon={MapPin} />
      </div>

      <FOSearchToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search code, name, type, location…"
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
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Floor</th>
              <th className="px-4 py-3">Priority</th>
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
                <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                  {row.areaCode}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-900">{row.name}</td>
                <td className="px-4 py-3 text-slate-600">{row.areaType}</td>
                <td className="px-4 py-3 text-slate-600">{row.location ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">
                  {row.floorNumber != null ? row.floorNumber : "—"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={priorityLabel(row.priority)} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.isActive === false ? "Inactive" : "Active"} />
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {formatUpdatedAt(row.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer
        open={!!preview}
        onClose={() => setPreview(null)}
        title={preview?.name ?? "Public Area"}
        description={preview?.areaCode}
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
              ["Area Code", preview.areaCode],
              ["Name", preview.name],
              ["Type", preview.areaType],
              ["Location", preview.location ?? "—"],
              ["Floor", preview.floorNumber != null ? String(preview.floorNumber) : "—"],
              ["Priority", priorityLabel(preview.priority)],
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
        title={editing ? `Edit ${editing.areaCode}` : "Add Public Area"}
      >
        <div className="space-y-4">
          <FormField label="Area Code" required>
            <TextInput
              value={areaCode}
              onChange={(e) => setAreaCode(e.target.value)}
              placeholder="PA-LOBBY"
              disabled={!!editing}
            />
          </FormField>
          <FormField label="Name" required>
            <TextInput value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>
          <FormField label="Area Type" required>
            <SelectInput value={areaType} onChange={(e) => setAreaType(e.target.value)}>
              {PUBLIC_AREA_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Location">
            <TextInput value={location} onChange={(e) => setLocation(e.target.value)} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Floor Number">
              <TextInput
                type="number"
                value={floorNumber}
                onChange={(e) => setFloorNumber(e.target.value)}
                placeholder="0 = Ground"
              />
            </FormField>
            <FormField label="Priority">
              <SelectInput value={priority} onChange={(e) => setPriority(e.target.value as PublicAreaPriority)}>
                {PUBLIC_AREA_PRIORITIES.map((p) => (
                  <option key={p} value={p}>{priorityLabel(p)}</option>
                ))}
              </SelectInput>
            </FormField>
          </div>
          <FormField label="Active">
            <SelectInput
              value={isActive ? "yes" : "no"}
              onChange={(e) => setIsActive(e.target.value === "yes")}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </SelectInput>
          </FormField>
          <Button
            className="w-full bg-emerald-700 hover:bg-emerald-800"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : editing ? "Update Area" : "Create Area"}
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
