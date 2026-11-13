"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, Package, Plus, RefreshCw, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import {
  AlertBanner,
  FormField,
  FOPageHeader,
  SelectInput,
  TextInput,
} from "@/components/frontoffice/ui";
import { ConfirmModal } from "@/components/frontoffice/ui/Modal";
import { OperationsToolbar } from "@/components/housekeeping/OperationsToolbar";
import { usePsList } from "@/hooks/usePsResource";
import { ingredientService } from "@/services/food-beverages";
import type { FbIngredient } from "@/app/data/foodbeverages/conversions";
import { formatQty } from "@/components/requisitions/requisitionUi";

const UOM_OPTIONS = ["Kg", "Ltr", "Pcs", "Bunch", "gm", "ml"] as const;

function statusTone(status: string) {
  if (status === "Active") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "Low Stock") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-100 text-slate-600";
}

function isRaw(ing: FbIngredient) {
  return String(ing.kind ?? "raw").toLowerCase() !== "prepared";
}

function formatOnHand(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 3,
  });
}

export function IngredientsPage() {
  const { data, loading, reload, error } = usePsList(
    () => ingredientService.list() as Promise<FbIngredient[]>,
    [],
  );

  const rows = useMemo(
    () =>
      (data as FbIngredient[])
        .filter(isRaw)
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    [data],
  );

  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [toast, setToast] = useState<{ message: string; variant: "success" | "info" | "error" } | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<FbIngredient | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FbIngredient | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [uom, setUom] = useState<string>("Kg");
  const [onHand, setOnHand] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      const qty = Number(row.onHand) || 0;
      if (statusTab === "Active" && String(row.status ?? "Active") !== "Active") return false;
      if (statusTab === "Inactive" && String(row.status) !== "Inactive") return false;
      if (statusTab === "In Stock" && !(qty > 0)) return false;
      if (statusTab === "Out of Stock" && qty > 0) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        String(row.code ?? "")
          .toLowerCase()
          .includes(q) ||
        String(row.uom ?? "")
          .toLowerCase()
          .includes(q)
      );
    });
  }, [rows, search, statusTab]);

  const kpis = useMemo(() => {
    const active = rows.filter((r) => String(r.status ?? "Active") === "Active").length;
    const inStock = rows.filter((r) => Number(r.onHand) > 0).length;
    const out = rows.filter((r) => !(Number(r.onHand) > 0)).length;
    return { total: rows.length, active, inStock, out };
  }, [rows]);

  const openCreate = () => {
    setEditing(null);
    setCode("");
    setName("");
    setUom("Kg");
    setOnHand("0");
    setStatus("Active");
    setDrawerOpen(true);
  };

  const openEdit = (row: FbIngredient) => {
    setEditing(row);
    setCode(String(row.code ?? ""));
    setName(row.name);
    setUom(String(row.uom || "Kg"));
    setOnHand(row.onHand == null ? "" : String(row.onHand));
    setStatus(String(row.status) === "Inactive" ? "Inactive" : "Active");
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setToast({ message: "Enter the ingredient name.", variant: "info" });
      return;
    }
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setToast({ message: "Enter a short code (e.g. TOM).", variant: "info" });
      return;
    }
    const qty = Number(onHand);
    if (onHand === "" || Number.isNaN(qty) || qty < 0) {
      setToast({ message: "Enter a valid on-hand quantity (decimals allowed).", variant: "info" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: trimmedCode,
        name: trimmedName,
        uom,
        onHand: qty,
        reorder: 0,
        status,
        kind: "raw" as const,
      };
      const saved = (
        editing
          ? await ingredientService.update(editing.id, payload)
          : await ingredientService.create(payload)
      ) as FbIngredient;
      await reload();
      setDrawerOpen(false);
      setToast({
        message: editing ? `${saved.name} updated.` : `${saved.name} added to ingredients.`,
        variant: "success",
      });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Save failed", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await ingredientService.remove(deleteTarget.id);
      setDeleteTarget(null);
      await reload();
      setToast({ message: `${deleteTarget.name} removed.`, variant: "info" });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Delete failed", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const statusFilters = [
    { id: "all", label: "All", count: kpis.total },
    { id: "In Stock", label: "In Stock", count: kpis.inStock },
    { id: "Out of Stock", label: "Out of Stock", count: kpis.out },
    { id: "Active", label: "Active", count: kpis.active },
  ];

  return (
    <div className="space-y-4 p-4 md:p-6">
      {toast && (
        <AlertBanner variant={toast.variant} message={toast.message} onDismiss={() => setToast(null)} />
      )}
      {error && <AlertBanner variant="error" message={`Could not load ingredients: ${error}`} />}

      <FOPageHeader
        eyebrow="Food & Beverages / Inventory"
        title="Ingredients"
        description="Raw kitchen materials. Prepared items live under Menu → Conversion Items."
        action={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void reload()}
              className="h-9 gap-1.5 rounded-xl px-3 text-xs font-bold"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
            </Button>
            <Button
              type="button"
              onClick={openCreate}
              className="h-9 gap-1.5 rounded-xl px-4 text-xs font-bold !bg-emerald-700 text-white"
            >
              <Plus className="h-3.5 w-3.5" /> Add Ingredient
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Ingredients", value: kpis.total, icon: UtensilsCrossed, tone: "bg-slate-50 text-slate-600" },
          { label: "In stock", value: kpis.inStock, icon: Package, tone: "bg-emerald-50 text-emerald-700" },
          { label: "Out of stock", value: kpis.out, icon: AlertTriangle, tone: "bg-amber-50 text-amber-700" },
          { label: "Active", value: kpis.active, icon: Package, tone: "bg-sky-50 text-sky-700" },
        ].map((card) => (
          <div
            key={card.label}
            className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 shadow-2xs"
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{card.label}</p>
              <p className="text-lg font-extrabold text-slate-800">{card.value}</p>
            </div>
            <div className={cn("rounded-lg p-2", card.tone)}>
              <card.icon className="h-4 w-4" />
            </div>
          </div>
        ))}
      </div>

      <OperationsToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, code or UOM…"
        showFilters={false}
        statusTabs={statusFilters}
        activeStatusTab={statusTab}
        onStatusTabChange={setStatusTab}
      />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        {loading && rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">Loading ingredients…</p>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-700">
              {rows.length === 0 ? "No ingredients yet" : "No ingredients match these filters"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {rows.length === 0
                ? "Add raw materials used in recipes and conversions."
                : "Try another tab or clear the search."}
            </p>
            {rows.length === 0 && (
              <Button type="button" onClick={openCreate} className="mt-4 h-9 rounded-xl text-xs font-bold">
                <Plus className="mr-1 h-3.5 w-3.5" /> Add Ingredient
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Ingredient</th>
                  <th className="px-4 py-2.5">UOM</th>
                  <th className="px-4 py-2.5 text-right">On hand</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((row) => {
                  const qty = Number(row.onHand) || 0;
                  const short = !(qty > 0);
                  return (
                    <tr key={row.id} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 font-mono text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-100">
                            {(row.code || row.name.slice(0, 3)).slice(0, 4).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">{row.name}</p>
                            <p className="font-mono text-[11px] text-slate-400">{row.code || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                          {row.uom || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p
                          className={cn(
                            "text-sm font-extrabold tabular-nums",
                            short ? "text-amber-700" : "text-slate-900",
                          )}
                        >
                          {formatOnHand(row.onHand)}
                        </p>
                        <p className="text-[10px] font-medium text-slate-400">{row.uom || ""}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                            short && String(row.status ?? "Active") === "Active"
                              ? statusTone("Low Stock")
                              : statusTone(String(row.status ?? "Active")),
                          )}
                        >
                          {short && String(row.status ?? "Active") === "Active"
                            ? "Out of stock"
                            : String(row.status ?? "Active")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-8 rounded-lg px-2.5 text-[11px] font-bold"
                            onClick={() => openEdit(row)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-8 rounded-lg px-2.5 text-[11px] font-bold text-red-600 hover:bg-red-50"
                            onClick={() => setDeleteTarget(row)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2 text-[11px] text-slate-500">
            Showing <strong className="text-slate-700">{filtered.length}</strong> of{" "}
            <strong className="text-slate-700">{rows.length}</strong> ingredients
          </div>
        )}
      </div>

      <Drawer
        side="bottom"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? `Edit ${editing.name}` : "Add Ingredient"}
        width="responsive"
        footer={
          <div className="flex w-full flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDrawerOpen(false)} className="h-9 rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="h-9 rounded-xl text-xs font-bold !bg-emerald-700 text-white"
            >
              {saving ? "Saving…" : editing ? "Save Changes" : "Create Ingredient"}
            </Button>
          </div>
        }
      >
        <div className="mx-auto grid max-w-2xl gap-4 p-1 sm:grid-cols-2">
          <FormField label="Code" required helperText="Short SKU used in recipes and search.">
            <TextInput
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. TOM"
              className="font-mono uppercase"
            />
          </FormField>
          <FormField label="Name" required>
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tomato" />
          </FormField>
          <FormField label="Unit of measure" required>
            <SelectInput value={uom} onChange={(e) => setUom(e.target.value)} className="block">
              {[...new Set([uom, ...UOM_OPTIONS])].filter(Boolean).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </SelectInput>
          </FormField>
          <FormField
            label="On hand"
            required
            helperText="Decimals allowed — e.g. 20.19 after gram-level usage."
          >
            <TextInput
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={onHand}
              onChange={(e) => setOnHand(e.target.value)}
              placeholder="e.g. 20.19"
            />
          </FormField>
          <FormField label="Status" className="sm:col-span-2">
            <SelectInput
              value={status}
              onChange={(e) => setStatus(e.target.value as "Active" | "Inactive")}
              className="block"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </SelectInput>
          </FormField>
          {onHand !== "" && Number(onHand) > 0 && (
            <p className="sm:col-span-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Stock preview: <strong className="text-slate-900">{formatQty(Number(onHand) || 0)}</strong> {uom}
            </p>
          )}
        </div>
      </Drawer>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="Delete ingredient?"
        message={
          deleteTarget
            ? `Remove ${deleteTarget.name} from the ingredients list. Recipes using it may need updating.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
        loading={saving}
      />
    </div>
  );
}
