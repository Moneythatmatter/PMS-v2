"use client";

import React, { useMemo, useState } from "react";
import { Building2, CheckCircle2, Plus, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import {
  AlertBanner,
  ConfirmModal,
  FOPageHeader,
  FormField,
  FormSection,
  SelectInput,
  StatMiniCard,
  TextInput,
} from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";
import {
  WAREHOUSE_TYPE_OPTIONS,
  type WarehouseMasterItem,
  type WarehouseMasterStatus,
  type WarehouseMasterType,
} from "@/app/data/warehouseMasterData";
import { usePsList } from "@/hooks/usePsResource";
import { psWarehouseService } from "@/services/purchase-stores/index";

function statusBadge(status: WarehouseMasterStatus) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
        status === "Active" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-600 ring-slate-200",
      )}
    >
      {status}
    </span>
  );
}

export default function WarehousesPage() {
  const { data: warehouses, loading, reload } = usePsList(() => psWarehouseService.list());
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<WarehouseMasterItem | null>(null);
  const [deleting, setDeleting] = useState<WarehouseMasterItem | null>(null);

  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<WarehouseMasterType>("Store");
  const [formLocation, setFormLocation] = useState("");
  const [formStatus, setFormStatus] = useState<WarehouseMasterStatus>("Active");

  const [toastMessage, setToastMessage] = useState<{ text: string; variant: "success" | "info" | "error" } | null>(null);

  const showToast = (text: string, variant: "success" | "info" | "error" = "success") => {
    setToastMessage({ text, variant });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return warehouses.filter((w) => {
      const matchSearch =
        !q ||
        w.code.toLowerCase().includes(q) ||
        w.name.toLowerCase().includes(q) ||
        w.location.toLowerCase().includes(q);
      const matchType = typeFilter === "all" || w.type === typeFilter;
      const matchStatus = statusFilter === "all" || w.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [warehouses, searchQuery, typeFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: warehouses.length,
    active: warehouses.filter((w) => w.status === "Active").length,
    stores: warehouses.filter((w) => w.type === "Store").length,
  }), [warehouses]);

  const openAdd = () => {
    setEditing(null);
    setFormCode("");
    setFormName("");
    setFormType("Store");
    setFormLocation("");
    setFormStatus("Active");
    setDrawerOpen(true);
  };

  const openEdit = (w: WarehouseMasterItem) => {
    setEditing(w);
    setFormCode(w.code);
    setFormName(w.name);
    setFormType(w.type);
    setFormLocation(w.location);
    setFormStatus(w.status);
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!formCode.trim() || !formName.trim()) {
      showToast("Code and name are required.", "error");
      return;
    }

    const payload = {
      code: formCode.trim(),
      name: formName.trim(),
      type: formType,
      location: formLocation.trim() || "—",
      status: formStatus,
    };

    try {
      if (editing) {
        await psWarehouseService.update(editing.id, payload);
        showToast(`Warehouse "${formName}" updated.`);
      } else {
        await psWarehouseService.create(payload);
        showToast(`Warehouse "${formName}" created.`);
      }
      setDrawerOpen(false);
      reload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to save warehouse.", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const name = deleting.name;
    try {
      await psWarehouseService.remove(deleting.id);
      showToast(`Warehouse "${name}" removed.`, "info");
      setDeleting(null);
      reload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to delete warehouse.", "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 text-sm text-slate-600">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-slate-50/50 p-4 sm:p-6 md:p-8">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 max-w-md animate-in fade-in slide-in-from-top-3">
          <AlertBanner variant={toastMessage.variant} message={toastMessage.text} onDismiss={() => setToastMessage(null)} />
        </div>
      )}

      <FOPageHeader
        eyebrow="Purchase & Stores · Inventory"
        title="Warehouses"
        description="Storage locations referenced by Stock, Issues, Transfers, and GRN."
        action={
          <Button type="button" size="sm" onClick={openAdd} className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white">
            <Plus className="h-4 w-4" /> Add Warehouse
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatMiniCard label="Locations" value={stats.total} sublabel="Warehouses & stores" accent="#0f766e" icon={Building2} />
        <StatMiniCard label="Active" value={stats.active} sublabel="In use" accent="#16a34a" icon={CheckCircle2} />
        <StatMiniCard label="Stores" value={stats.stores} sublabel="Sub-store locations" accent="#2563eb" icon={Building2} />
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code, name, location..."
              className="h-9.5 w-full rounded-xl border border-slate-200 bg-white pl-9.5 pr-3 text-xs sm:text-sm"
            />
          </div>
          <SelectInput value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-9.5 text-xs sm:text-sm">
            <option value="all">All Types</option>
            {WAREHOUSE_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </SelectInput>
          <div className="flex gap-2">
            <SelectInput value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9.5 flex-1 text-xs sm:text-sm">
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </SelectInput>
            {(searchQuery || typeFilter !== "all" || statusFilter !== "all") && (
              <Button type="button" variant="outline" size="sm" onClick={() => { setSearchQuery(""); setTypeFilter("all"); setStatusFilter("all"); }} className="h-9.5 px-2.5">
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="py-3.5 px-4">Code</th>
              <th className="py-3.5 px-4">Name</th>
              <th className="py-3.5 px-4">Type</th>
              <th className="py-3.5 px-4">Location</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {filtered.map((w) => (
              <tr key={w.id} className="hover:bg-slate-50/60">
                <td className="py-3.5 px-4 font-mono font-semibold text-emerald-800">{w.code}</td>
                <td className="py-3.5 px-4 font-semibold text-slate-900">{w.name}</td>
                <td className="py-3.5 px-4">{w.type}</td>
                <td className="py-3.5 px-4 text-slate-600">{w.location}</td>
                <td className="py-3.5 px-4 text-center">{statusBadge(w.status)}</td>
                <td className="py-3.5 px-4 text-right">
                  <Button type="button" variant="outline" size="sm" className="h-7 text-[11px] mr-1" onClick={() => openEdit(w)}>Edit</Button>
                  <Button type="button" variant="outline" size="sm" className="h-7 text-[11px] text-red-600" onClick={() => setDeleting(w)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? "Edit Warehouse" : "Add Warehouse"}
        width="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="button" size="sm" onClick={handleSave} className="bg-emerald-700 hover:bg-emerald-800 text-white">Save</Button>
          </div>
        }
      >
        <FormSection title="Warehouse Details" columns={1}>
          <FormField label="Code" required>
            <TextInput value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="CST-001" className="text-xs font-mono" />
          </FormField>
          <FormField label="Name" required>
            <TextInput value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Central Store" className="text-xs" />
          </FormField>
          <FormField label="Type" required>
            <SelectInput value={formType} onChange={(e) => setFormType(e.target.value as WarehouseMasterType)} className="text-xs">
              {WAREHOUSE_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Location">
            <TextInput value={formLocation} onChange={(e) => setFormLocation(e.target.value)} placeholder="Main Building" className="text-xs" />
          </FormField>
          <FormField label="Status" required>
            <SelectInput value={formStatus} onChange={(e) => setFormStatus(e.target.value as WarehouseMasterStatus)} className="text-xs">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </SelectInput>
          </FormField>
        </FormSection>
      </Drawer>

      <ConfirmModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete warehouse?"
        message={deleting ? `Remove "${deleting.name}" from the master list?` : ""}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
