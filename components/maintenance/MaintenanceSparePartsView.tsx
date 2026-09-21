"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Package,
  CheckCircle2,
  XCircle,
  Edit2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer } from "@/components/ui";
import { cn } from "@/lib/utils";
import { SparePartMaster } from "@/app/data/maintenance/types";
import { usePsList } from "@/hooks/usePsResource";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { mntSparePartService } from "@/services/maintenance/index";

const PART_CATEGORIES = [
  "Electrical",
  "Mechanical",
  "Plumbing",
  "HVAC",
  "Engineering",
  "General",
];

export function MaintenanceSparePartsView() {
  const { data: parts, loading, reload } = usePsList(() => mntSparePartService.list(), []);
  const { saving, runLocked } = useSubmitLock();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<SparePartMaster | null>(null);

  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState(PART_CATEGORIES[0]);
  const [formUnit, setFormUnit] = useState("Pcs");
  const [formUnitCost, setFormUnitCost] = useState<number | "">(0);
  const [formStoresRef, setFormStoresRef] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState<"Active" | "Inactive">("Active");
  const [formError, setFormError] = useState<string | null>(null);

  const filteredParts = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return parts.filter((part) => {
      const matchesSearch =
        !q ||
        String(part.partName ?? "").toLowerCase().includes(q) ||
        String(part.partCode ?? "").toLowerCase().includes(q) ||
        String(part.category ?? "").toLowerCase().includes(q) ||
        String(part.description ?? "").toLowerCase().includes(q);
      const matchesStatus =
        selectedStatusFilter === "ALL" ||
        String(part.status ?? "").toUpperCase() === selectedStatusFilter.toUpperCase();
      return matchesSearch && matchesStatus;
    });
  }, [parts, searchTerm, selectedStatusFilter]);

  const handleOpenAdd = () => {
    setEditingPart(null);
    setFormCode(`SP-${Math.floor(100 + Math.random() * 900)}`);
    setFormName("");
    setFormCategory(PART_CATEGORIES[0]);
    setFormUnit("Pcs");
    setFormUnitCost(0);
    setFormStoresRef("");
    setFormDescription("");
    setFormStatus("Active");
    setFormError(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (part: SparePartMaster) => {
    setEditingPart(part);
    setFormCode(part.partCode);
    setFormName(part.partName);
    setFormCategory(part.category || PART_CATEGORIES[0]);
    setFormUnit(part.unit || "Pcs");
    setFormUnitCost(Number(part.unitCost) || 0);
    setFormStoresRef(part.defaultStoresRef || "");
    setFormDescription(part.description || "");
    setFormStatus(part.status);
    setFormError(null);
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const nameTrimmed = formName.trim();
    const codeTrimmed = formCode.trim().toUpperCase();
    if (!nameTrimmed || !codeTrimmed) {
      setFormError("Part Name and Code are required.");
      return;
    }

    const duplicate = parts.find(
      (p) => p.partCode.toUpperCase() === codeTrimmed && p.id !== editingPart?.id,
    );
    if (duplicate) {
      setFormError(`Part Code "${codeTrimmed}" already exists.`);
      return;
    }

    const body = {
      partCode: codeTrimmed,
      partName: nameTrimmed,
      category: formCategory,
      unit: formUnit.trim() || "Pcs",
      unitCost: formUnitCost === "" ? 0 : Number(formUnitCost),
      defaultStoresRef: formStoresRef.trim() || undefined,
      description: formDescription.trim() || undefined,
      status: formStatus,
    };

    if (saving) return;
    await runLocked(async () => {
      try {
        if (editingPart) {
          await mntSparePartService.update(editingPart.id, body);
          setToastMessage(`Spare part "${nameTrimmed}" updated successfully.`);
        } else {
          await mntSparePartService.create(body);
          setToastMessage(`Spare part "${nameTrimmed}" created successfully.`);
        }
        setIsDrawerOpen(false);
        await reload();
      } catch (err) {
        console.error(err);
        setFormError(err instanceof Error ? err.message : "Failed to save spare part.");
      }
    });
  };

  const handleToggleStatus = async (part: SparePartMaster) => {
    const nextStatus = part.status === "Active" ? "Inactive" : "Active";
    try {
      await mntSparePartService.update(part.id, { status: nextStatus });
      setToastMessage(`Spare part "${part.partName}" set to ${nextStatus}.`);
      await reload();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to update status.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 text-sm text-slate-600">Loading spare parts catalog...</div>
    );
  }

  return (
    <ModulePageShell
      eyebrow="Maintenance / Masters"
      title="Spare Parts Catalog"
      description="Master catalog of spare parts used when recording material consumption on Work Orders. Purchase & Stores owns stock deduction."
      breadcrumbs={[
        { label: "Maintenance", href: "/maintenance" },
        { label: "Masters", href: "/maintenance/masters" },
        { label: "Spare Parts" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <Button
          type="button"
          size="sm"
          onClick={handleOpenAdd}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 h-9 px-3.5"
        >
          <Plus className="h-4 w-4" /> Add Spare Part
        </Button>
      }
    >
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5 mb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by part code, name, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-slate-500">Status:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Part Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Unit Cost</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Package className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-sm">No spare parts found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Add parts to the catalog so Work Orders can select them when recording usage.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredParts.map((part) => (
                  <tr key={part.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{part.partCode}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{part.partName}</span>
                      {part.defaultStoresRef && (
                        <span className="text-[10px] text-slate-400 font-mono">{part.defaultStoresRef}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{part.category || "—"}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900">
                      ₹{Number(part.unitCost || 0).toLocaleString()}
                      <span className="text-[10px] text-slate-400 font-sans ml-1">/ {part.unit || "Pcs"}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                          part.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200",
                        )}
                      >
                        {part.status === "Active" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {part.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(part)}
                        className="h-8 rounded-lg text-xs font-semibold px-2.5 text-slate-700 hover:bg-slate-100"
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1 text-slate-500" /> Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(part)}
                        className={cn(
                          "h-8 rounded-lg text-xs font-semibold px-2.5",
                          part.status === "Active"
                            ? "text-rose-700 border-rose-200 hover:bg-rose-50"
                            : "text-emerald-700 border-emerald-200 hover:bg-emerald-50",
                        )}
                      >
                        {part.status === "Active" ? "Deactivate" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => !saving && setIsDrawerOpen(false)}
        title={editingPart ? "Edit Spare Part" : "Add Spare Part"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs p-1">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Part Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Run Capacitor 45uF 440V"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full h-9 p-2 rounded-xl border border-slate-200 bg-white text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Part Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. ELEC-CAP-45UF"
              value={formCode}
              onChange={(e) => setFormCode(e.target.value)}
              className="w-full h-9 p-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full h-9 p-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:border-emerald-500 focus:outline-none"
              >
                {PART_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Unit</label>
              <input
                type="text"
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value)}
                placeholder="Pcs / Kg / Ltr"
                className="w-full h-9 p-2 rounded-xl border border-slate-200 bg-white text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Unit Cost (₹)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={formUnitCost}
                onChange={(e) =>
                  setFormUnitCost(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-full h-9 p-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Default Stores Ref</label>
              <input
                type="text"
                placeholder="e.g. STORES-REQ-401"
                value={formStoresRef}
                onChange={(e) => setFormStoresRef(e.target.value)}
                className="w-full h-9 p-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Optional notes for technicians..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs leading-relaxed focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Status</label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as "Active" | "Inactive")}
              className="w-full h-9 p-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:border-emerald-500 focus:outline-none"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={() => setIsDrawerOpen(false)}
              className="rounded-xl text-xs disabled:opacity-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs px-4 disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {saving ? "Saving..." : editingPart ? "Save Changes" : "Create Spare Part"}
            </Button>
          </div>
        </form>
      </Drawer>
    </ModulePageShell>
  );
}
