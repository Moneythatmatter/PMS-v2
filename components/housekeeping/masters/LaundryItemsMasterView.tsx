"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Plus, Shirt, Tag } from "lucide-react";
import {
  LAUNDRY_ITEM_CATEGORIES,
  type LaundryItemMaster,
} from "@/app/data/housekeeping/masters";
import { laundryItemMasterService } from "@/services/housekeeping/laundry-items-master";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Drawer,
  FormField,
  FOPageHeader,
  FOSearchToolbar,
  SelectInput,
  StatMiniCard,
  TextAreaInput,
  TextInput,
} from "@/components/frontoffice/ui";
import { toast } from "@/components/ui/toast";

function formatUpdatedAt(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LaundryItemsMasterView() {
  const [items, setItems] = useState<LaundryItemMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LaundryItemMaster | null>(null);
  const [preview, setPreview] = useState<LaundryItemMaster | null>(null);
  const [saving, setSaving] = useState(false);

  const [itemCode, setItemCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(LAUNDRY_ITEM_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await laundryItemMasterService.list();
        if (!cancelled) setItems(data);
      } catch (e) {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : "Failed to load items");
        }
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
    return items
      .filter((row) => {
        const matchesActive =
          activeFilter === "all" ||
          (activeFilter === "active" && row.isActive !== false) ||
          (activeFilter === "inactive" && row.isActive === false);
        return (
          matchesActive &&
          (!q ||
            row.itemCode.toLowerCase().includes(q) ||
            row.name.toLowerCase().includes(q) ||
            row.category.toLowerCase().includes(q) ||
            (row.description ?? "").toLowerCase().includes(q))
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items, search, activeFilter]);

  const stats = useMemo(
    () => ({
      total: items.length,
      active: items.filter((a) => a.isActive !== false).length,
      categories: new Set(items.map((a) => a.category)).size,
    }),
    [items],
  );

  const resetForm = () => {
    setEditing(null);
    setItemCode("");
    setName("");
    setCategory(LAUNDRY_ITEM_CATEGORIES[0]);
    setDescription("");
    setIsActive(true);
  };

  const openCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (row: LaundryItemMaster) => {
    setEditing(row);
    setItemCode(row.itemCode);
    setName(row.name);
    setCategory(row.category);
    setDescription(row.description ?? "");
    setIsActive(row.isActive !== false);
    setPreview(null);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!itemCode.trim() || !name.trim()) {
      toast.error("Item code and name are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        itemCode: itemCode.trim().toUpperCase(),
        name: name.trim(),
        category,
        description: description.trim() || null,
        isActive,
      };
      if (editing) {
        const record = await laundryItemMasterService.update(editing.id, payload);
        setItems((prev) =>
          prev
            .map((a) => (a.id === editing.id ? record : a))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
        toast.success(`${record.name} updated`);
      } else {
        const record = await laundryItemMasterService.create(payload);
        setItems((prev) =>
          [...prev, record].sort((a, b) => a.name.localeCompare(b.name)),
        );
        toast.success(`${record.name} added`);
      }
      setFormOpen(false);
      resetForm();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="space-y-5">
      <FOPageHeader
        eyebrow="Housekeeping · Masters"
        title="Laundry Item Master"
        description="Define garments and linen items used in guest laundry orders — Shirt, Jeans, Blazer, and more."
        action={
          <Button
            size="sm"
            className="bg-[#0B6B4F] hover:bg-[#095a43]"
            onClick={openCreate}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Item
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatMiniCard label="Items" value={stats.total} icon={Shirt} />
        <StatMiniCard
          label="Active"
          value={stats.active}
          accent="#10b981"
          icon={CheckCircle2}
        />
        <StatMiniCard
          label="Categories"
          value={stats.categories}
          accent="#0ea5e9"
          icon={Tag}
        />
      </div>

      <FOSearchToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search code, name, category…"
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
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Item Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-sm text-slate-400"
                >
                  No laundry items found. Add Shirt, Jeans, Blazer, etc.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer hover:bg-emerald-50/40"
                  onClick={() => setPreview(row)}
                >
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                    {row.itemCode}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {row.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.category}</td>
                  <td className="max-w-[240px] truncate px-4 py-3 text-slate-500">
                    {row.description ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={row.isActive === false ? "Inactive" : "Active"}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {formatUpdatedAt(row.updatedAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Drawer
        open={!!preview}
        onClose={() => setPreview(null)}
        title={preview?.name ?? "Laundry Item"}
        description={preview?.itemCode}
        footer={
          preview ? (
            <>
              <Button variant="outline" onClick={() => setPreview(null)}>
                Close
              </Button>
              <Button
                className="bg-[#0B6B4F] hover:bg-[#095a43]"
                onClick={() => openEdit(preview)}
              >
                Edit
              </Button>
            </>
          ) : undefined
        }
      >
        {preview && (
          <dl className="space-y-3 text-sm">
            {[
              ["Item Code", preview.itemCode],
              ["Name", preview.name],
              ["Category", preview.category],
              ["Description", preview.description ?? "—"],
              ["Status", preview.isActive === false ? "Inactive" : "Active"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-slate-50 pb-2">
                <dt className="text-slate-500">{k}</dt>
                <dd className="font-medium text-slate-900">{v}</dd>
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
        title={editing ? "Edit Laundry Item" : "New Laundry Item"}
        description="Add garments like Shirt, Jeans, Blazer for guest laundry."
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setFormOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#0B6B4F] hover:bg-[#095a43]"
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {saving ? "Saving…" : editing ? "Update Item" : "Save Item"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Item Code" required>
              <TextInput
                placeholder="e.g. LI-SHIRT"
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value)}
                disabled={!!editing}
              />
            </FormField>
            <FormField label="Item Name" required>
              <TextInput
                placeholder="e.g. Shirt, Jeans, Blazer"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FormField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Category" required>
              <SelectInput
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {LAUNDRY_ITEM_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </SelectInput>
            </FormField>
            <FormField label="Status">
              <SelectInput
                value={isActive ? "active" : "inactive"}
                onChange={(e) => setIsActive(e.target.value === "active")}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </SelectInput>
            </FormField>
          </div>
          <FormField label="Description">
            <TextAreaInput
              rows={3}
              placeholder="Optional notes about this garment type"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>
        </div>
      </Drawer>
    </div>
  );
}
