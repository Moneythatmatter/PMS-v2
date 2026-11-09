"use client";

import React, { useMemo, useState } from "react";
import { FlaskConical, Package, Plus, Trash2 } from "lucide-react";
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
import { conversionItemService, ingredientService } from "@/services/food-beverages";
import type {
  ConversionItem,
  ConversionItemInput,
  ConversionLineInput,
  FbIngredient,
} from "@/app/data/foodbeverages/conversions";

type LineDraft = ConversionLineInput & { key: string };

function newLine(): LineDraft {
  return { key: `L-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ingredientId: "", qty: 0, uom: "" };
}

function statusTone(status: string) {
  if (status === "Active") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
}

/** Menu master — define prepared conversion items and their BOM. Does not move stock. */
export function ConversionItemsPage() {
  const { data: items, loading, reload } = usePsList(() => conversionItemService.list(), []);
  const { data: ingredientsRaw, reload: reloadIngredients } = usePsList(
    () => ingredientService.list() as Promise<FbIngredient[]>,
    [],
  );

  const ingredients = useMemo(
    () =>
      (ingredientsRaw as FbIngredient[])
        .filter((i) => String(i.status ?? "Active").toLowerCase() !== "inactive")
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    [ingredientsRaw],
  );

  const activeCount = useMemo(() => items.filter((i) => i.status === "Active").length, [items]);

  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [toast, setToast] = useState<{ message: string; variant: "success" | "info" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ConversionItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ConversionItem | null>(null);

  const [itemName, setItemName] = useState("");
  const [yieldQty, setYieldQty] = useState<number | "">("");
  const [yieldUom, setYieldUom] = useState("Kg");
  const [itemNotes, setItemNotes] = useState("");
  const [itemStatus, setItemStatus] = useState<"Active" | "Inactive">("Active");
  const [itemLines, setItemLines] = useState<LineDraft[]>([newLine()]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (statusTab === "Active" && i.status !== "Active") return false;
      if (statusTab === "Inactive" && i.status !== "Inactive") return false;
      if (!q) return true;
      return (
        i.name.toLowerCase().includes(q) ||
        i.code.toLowerCase().includes(q) ||
        i.lines.some((l) => l.ingredientName.toLowerCase().includes(q))
      );
    });
  }, [items, search, statusTab]);

  const openCreate = () => {
    setEditing(null);
    setItemName("");
    setYieldQty("");
    setYieldUom("Kg");
    setItemNotes("");
    setItemStatus("Active");
    setItemLines([newLine()]);
    setDrawerOpen(true);
  };

  const openEdit = (row: ConversionItem) => {
    setEditing(row);
    setItemName(row.name);
    setYieldQty(row.yieldQty);
    setYieldUom(row.yieldUom || "Kg");
    setItemNotes(row.notes || "");
    setItemStatus(row.status);
    setItemLines(
      row.lines.length
        ? row.lines.map((l) => ({
            key: l.id || `L-${l.lineNo}`,
            ingredientId: l.ingredientId,
            qty: l.qty,
            uom: l.uom,
          }))
        : [newLine()],
    );
    setDrawerOpen(true);
  };

  const buildPayload = (): ConversionItemInput | null => {
    const name = itemName.trim();
    if (!name) {
      setToast({ message: "Enter the conversion item name.", variant: "info" });
      return null;
    }
    const yq = Number(yieldQty);
    if (!(yq > 0)) {
      setToast({ message: "Enter yield quantity (how much one batch produces).", variant: "info" });
      return null;
    }
    const cleanLines = itemLines
      .filter((l) => l.ingredientId && Number(l.qty) > 0)
      .map((l) => {
        const ing = ingredients.find((i) => i.id === l.ingredientId);
        return { ingredientId: l.ingredientId, qty: Number(l.qty), uom: l.uom || ing?.uom || "" };
      });
    if (cleanLines.length === 0) {
      setToast({ message: "Add at least one ingredient used to make this item.", variant: "info" });
      return null;
    }
    return {
      name,
      yieldQty: yq,
      yieldUom: yieldUom,
      notes: itemNotes.trim(),
      status: itemStatus,
      outputIngredientId: editing?.outputIngredientId,
      lines: cleanLines,
    };
  };

  const handleSave = async () => {
    const payload = buildPayload();
    if (!payload) return;
    setSaving(true);
    try {
      const saved = editing
        ? await conversionItemService.update(editing.id, payload)
        : await conversionItemService.create(payload);
      await reload();
      await reloadIngredients();
      setDrawerOpen(false);
      setToast({
        message: editing
          ? `${saved.name} updated.`
          : `${saved.name} saved — it now appears in Conversion Stock with 0 on hand.`,
        variant: "success",
      });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Save failed", variant: "info" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await conversionItemService.remove(deleteTarget.id);
      setDeleteTarget(null);
      await reload();
      setToast({ message: `${deleteTarget.name} deleted.`, variant: "info" });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Delete failed", variant: "info" });
    } finally {
      setSaving(false);
    }
  };

  const statusFilters = [
    { id: "all", label: "All", count: items.length },
    { id: "Active", label: "Active", count: activeCount },
    { id: "Inactive", label: "Inactive", count: items.filter((i) => i.status === "Inactive").length },
  ];

  return (
    <div className="space-y-4 p-4 md:p-6">
      {toast && (
        <AlertBanner variant={toast.variant} message={toast.message} onDismiss={() => setToast(null)} />
      )}

      <FOPageHeader
        eyebrow="Food & Beverages / Menu"
        title="Conversion Items"
        description="Master list of prepared items (dough, batter, gravy) and the ingredients required to make them."
        action={
          <Button
            type="button"
            onClick={openCreate}
            className="h-9 gap-1.5 rounded-xl px-4 text-xs font-bold !bg-emerald-700 text-white"
          >
            <Plus className="h-3.5 w-3.5" /> New Conversion Item
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {[
          { label: "Items", value: items.length, icon: FlaskConical, tone: "bg-slate-50 text-slate-600" },
          { label: "Active", value: activeCount, icon: Package, tone: "bg-emerald-50 text-emerald-700" },
          {
            label: "Inactive",
            value: items.filter((i) => i.status === "Inactive").length,
            icon: Package,
            tone: "bg-slate-50 text-slate-500",
          },
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
        searchPlaceholder="Search conversion item or ingredient…"
        showFilters={false}
        statusTabs={statusFilters}
        activeStatusTab={statusTab}
        onStatusTabChange={setStatusTab}
      />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">Loading conversion items…</p>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-medium text-slate-600">No conversion items yet</p>
            <p className="mt-1 text-xs text-slate-400">
              Define masters here — e.g. Pizza Dough made from flour, yeast, water.
            </p>
            <Button type="button" onClick={openCreate} className="mt-4 h-9 rounded-xl text-xs font-bold">
              <Plus className="mr-1 h-3.5 w-3.5" /> New Conversion Item
            </Button>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Item</th>
                <th className="px-4 py-2.5">Yield</th>
                <th className="px-4 py-2.5">Ingredients</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{row.name}</p>
                    <p className="text-[11px] text-slate-400">{row.code || "—"}</p>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {row.yieldQty} {row.yieldUom}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {row.lines.length === 0
                      ? "—"
                      : row.lines
                          .slice(0, 3)
                          .map((l) => `${l.ingredientName} (${l.qty})`)
                          .join(", ")}
                    {row.lines.length > 3 ? ` +${row.lines.length - 3}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold",
                        statusTone(row.status),
                      )}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 rounded-lg px-2.5 text-[11px]"
                        onClick={() => openEdit(row)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 rounded-lg px-2.5 text-[11px] text-red-600"
                        onClick={() => setDeleteTarget(row)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Drawer
        side="bottom"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? `Edit ${editing.name}` : "New Conversion Item"}
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
              {saving ? "Saving…" : "Save Item"}
            </Button>
          </div>
        }
      >
        <div className="space-y-5 pb-2">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-1 text-sm font-semibold text-slate-900">Prepared item (master)</h3>
            <p className="mb-4 text-xs text-slate-500">
              Name what you make and how much one standard batch yields. This does not move stock.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField label="Name" required className="sm:col-span-2">
                <TextInput
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="h-10 text-sm"
                  placeholder="e.g. Pizza Dough / Gravy / Shake Base"
                />
              </FormField>
              <FormField label="Status">
                <SelectInput
                  value={itemStatus}
                  onChange={(e) => setItemStatus(e.target.value as "Active" | "Inactive")}
                  className="block h-10 text-sm"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </SelectInput>
              </FormField>
              <FormField label="Yield qty" required>
                <TextInput
                  type="number"
                  min={0}
                  step="any"
                  value={yieldQty}
                  onChange={(e) => setYieldQty(e.target.value === "" ? "" : Number(e.target.value))}
                  className="h-10 text-sm font-semibold"
                  placeholder="e.g. 10"
                />
              </FormField>
              <FormField label="Yield UOM" required>
                <SelectInput value={yieldUom} onChange={(e) => setYieldUom(e.target.value)} className="block h-10 text-sm">
                  <option value="Kg">Kg</option>
                  <option value="Ltr">Ltr</option>
                  <option value="Pcs">Pcs</option>
                  <option value="Bunch">Bunch</option>
                </SelectInput>
              </FormField>
              <FormField label="Notes">
                <TextInput
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  className="h-10 text-sm"
                  placeholder="Optional"
                />
              </FormField>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Ingredients (BOM)</h3>
                <p className="text-xs text-slate-500">Quantities required for one yield batch above.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setItemLines((prev) => [...prev, newLine()])}
                className="h-8 gap-1 rounded-lg px-3 text-xs font-bold"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
            <div className="space-y-2.5">
              {itemLines.map((line, idx) => {
                const ing = ingredients.find((i) => i.id === line.ingredientId);
                return (
                  <div
                    key={line.key}
                    className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3 sm:grid-cols-12"
                  >
                    <div className="sm:col-span-7">
                      <span className="mb-1 block text-[10px] font-medium text-slate-500">Ingredient #{idx + 1}</span>
                      <SelectInput
                        value={line.ingredientId}
                        onChange={(e) => {
                          const id = e.target.value;
                          const found = ingredients.find((i) => i.id === id);
                          setItemLines((prev) =>
                            prev.map((l) =>
                              l.key === line.key ? { ...l, ingredientId: id, uom: found?.uom || l.uom } : l,
                            ),
                          );
                        }}
                        className={cn("h-9 text-xs", !line.ingredientId && "text-slate-400")}
                      >
                        <option value="">Select ingredient…</option>
                        {ingredients.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.name}
                            {i.code ? ` (${i.code})` : ""} · on hand {Number(i.onHand) || 0} {i.uom || ""}
                          </option>
                        ))}
                      </SelectInput>
                    </div>
                    <div className="sm:col-span-3">
                      <span className="mb-1 block text-[10px] font-medium text-slate-500">
                        Qty{ing?.uom ? ` (${ing.uom})` : ""}
                      </span>
                      <TextInput
                        type="number"
                        min={0}
                        step="any"
                        value={line.qty || ""}
                        onChange={(e) =>
                          setItemLines((prev) =>
                            prev.map((l) =>
                              l.key === line.key ? { ...l, qty: Number(e.target.value) || 0 } : l,
                            ),
                          )
                        }
                        className="h-9 text-center text-xs font-semibold"
                      />
                    </div>
                    <div className="flex items-end justify-end sm:col-span-2">
                      <button
                        type="button"
                        disabled={itemLines.length <= 1}
                        onClick={() => setItemLines((prev) => prev.filter((l) => l.key !== line.key))}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                        aria-label="Remove line"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </Drawer>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="Delete conversion item?"
        message={
          deleteTarget
            ? `${deleteTarget.name} and any draft stock batches will be removed. Completed batches block delete.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
        loading={saving}
      />
    </div>
  );
}
