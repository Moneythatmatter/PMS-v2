"use client";

import React, { useMemo, useState } from "react";
import { CheckCircle2, FlaskConical, Package, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
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
import {
  conversionItemService,
  conversionService,
  ingredientService,
} from "@/services/food-beverages";
import type {
  Conversion,
  ConversionInput,
  FbIngredient,
} from "@/app/data/foodbeverages/conversions";

function todayISO() {
  return new Date().toLocaleDateString("sv-SE");
}

function formatWhen(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

function statusTone(status: string) {
  if (status === "Completed") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "Cancelled") return "bg-slate-100 text-slate-600 border-slate-200";
  return "bg-amber-50 text-amber-800 border-amber-200";
}

/** Inventory — produce prepared stock from conversion item masters. */
export function ConversionStockPage() {
  const { data: items, reload: reloadItems } = usePsList(() => conversionItemService.list(), []);
  const { data: conversions, loading, reload } = usePsList(() => conversionService.list(), []);
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

  const activeItems = useMemo(() => items.filter((i) => i.status === "Active"), [items]);

  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [toast, setToast] = useState<{ message: string; variant: "success" | "info" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Conversion | null>(null);
  const [completeTarget, setCompleteTarget] = useState<Conversion | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Conversion | null>(null);

  const [stockItemId, setStockItemId] = useState("");
  const [stockDate, setStockDate] = useState(todayISO());
  const [stockQty, setStockQty] = useState<number | "">("");
  const [stockNotes, setStockNotes] = useState("");

  const selectedMaster =
    activeItems.find((i) => i.id === stockItemId) ?? items.find((i) => i.id === stockItemId) ?? null;

  const previewScale =
    selectedMaster && Number(stockQty) > 0 ? Number(stockQty) / selectedMaster.yieldQty : 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return conversions.filter((c) => {
      if (statusTab !== "all" && c.status !== statusTab) return false;
      if (!q) return true;
      return (
        c.conversionNo.toLowerCase().includes(q) ||
        c.outputName.toLowerCase().includes(q) ||
        c.lines.some((l) => l.ingredientName.toLowerCase().includes(q))
      );
    });
  }, [conversions, search, statusTab]);

  const openCreate = () => {
    if (activeItems.length === 0) {
      setToast({
        message: "Add a conversion item under Menu → Conversion Items first.",
        variant: "info",
      });
      return;
    }
    setEditing(null);
    const first = activeItems[0];
    setStockItemId(first.id);
    setStockDate(todayISO());
    setStockQty(first.yieldQty);
    setStockNotes("");
    setDrawerOpen(true);
  };

  const openEdit = (row: Conversion) => {
    if (row.status !== "Draft") {
      setToast({ message: `${row.conversionNo} is ${row.status} and cannot be edited.`, variant: "info" });
      return;
    }
    setEditing(row);
    setStockItemId(row.conversionItemId);
    setStockDate(row.conversionDate || todayISO());
    setStockQty(row.outputQty);
    setStockNotes(row.notes || "");
    setDrawerOpen(true);
  };

  const buildPayload = (): ConversionInput | null => {
    if (!stockItemId) {
      setToast({ message: "Select a conversion item.", variant: "info" });
      return null;
    }
    const qty = Number(stockQty);
    if (!(qty > 0)) {
      setToast({ message: "Enter how much prepared item to produce.", variant: "info" });
      return null;
    }
    return {
      conversionItemId: stockItemId,
      conversionDate: stockDate,
      outputQty: qty,
      notes: stockNotes.trim(),
    };
  };

  const handleSave = async (andComplete: boolean) => {
    const payload = buildPayload();
    if (!payload) return;
    setSaving(true);
    try {
      let saved: Conversion;
      if (editing) {
        saved = await conversionService.update(editing.id, payload);
      } else {
        saved = await conversionService.create(payload);
      }
      if (andComplete) {
        saved = await conversionService.complete(saved.id);
        await reloadIngredients();
        setToast({
          message: `${saved.conversionNo} completed — stock updated for ${saved.outputName}.`,
          variant: "success",
        });
      } else {
        setToast({
          message: editing ? `${saved.conversionNo} updated.` : `${saved.conversionNo} saved as draft.`,
          variant: "success",
        });
      }
      setDrawerOpen(false);
      await reload();
      await reloadItems();
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Save failed", variant: "info" });
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!completeTarget) return;
    setSaving(true);
    try {
      const saved = await conversionService.complete(completeTarget.id);
      setCompleteTarget(null);
      await reload();
      await reloadIngredients();
      setToast({
        message: `${saved.conversionNo} completed — ${saved.outputQty} ${saved.outputUom} of ${saved.outputName} added to stock.`,
        variant: "success",
      });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Complete failed", variant: "info" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await conversionService.remove(deleteTarget.id);
      setDeleteTarget(null);
      await reload();
      setToast({ message: `${deleteTarget.conversionNo} deleted.`, variant: "info" });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Delete failed", variant: "info" });
    } finally {
      setSaving(false);
    }
  };

  const statusFilters = [
    { id: "all", label: "All", count: conversions.length },
    { id: "Draft", label: "Draft", count: conversions.filter((c) => c.status === "Draft").length },
    {
      id: "Completed",
      label: "Completed",
      count: conversions.filter((c) => c.status === "Completed").length,
    },
  ];

  return (
    <div className="space-y-4 p-4 md:p-6">
      {toast && (
        <AlertBanner variant={toast.variant} message={toast.message} onDismiss={() => setToast(null)} />
      )}

      <FOPageHeader
        eyebrow="Food & Beverages / Inventory"
        title="Conversion Stock"
        description="Produce prepared items from conversion masters — deducts ingredients and increases on-hand stock."
        action={
          <Button
            type="button"
            onClick={openCreate}
            className="h-9 gap-1.5 rounded-xl px-4 text-xs font-bold !bg-emerald-700 text-white"
          >
            <Plus className="h-3.5 w-3.5" /> Produce Stock
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Masters available", value: activeItems.length, icon: FlaskConical, tone: "bg-sky-50 text-sky-700" },
          {
            label: "Draft batches",
            value: conversions.filter((c) => c.status === "Draft").length,
            icon: RefreshCw,
            tone: "bg-amber-50 text-amber-700",
          },
          {
            label: "Completed",
            value: conversions.filter((c) => c.status === "Completed").length,
            icon: CheckCircle2,
            tone: "bg-emerald-50 text-emerald-700",
          },
          { label: "All batches", value: conversions.length, icon: Package, tone: "bg-slate-50 text-slate-600" },
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

      {activeItems.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No conversion items yet.{" "}
          <Link href="/food-beverages/menu/conversion-items" className="font-semibold underline">
            Create masters under Menu → Conversion Items
          </Link>{" "}
          before producing stock.
        </div>
      )}

      <OperationsToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search batch, prepared item or ingredient…"
        showFilters={false}
        statusTabs={statusFilters}
        activeStatusTab={statusTab}
        onStatusTabChange={setStatusTab}
      />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">Loading stock batches…</p>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-medium text-slate-600">No stock batches yet</p>
            <p className="mt-1 text-xs text-slate-400">
              Produce from a conversion item to add prepared stock and deduct raw ingredients.
            </p>
            <Button type="button" onClick={openCreate} className="mt-4 h-9 rounded-xl text-xs font-bold">
              <Plus className="mr-1 h-3.5 w-3.5" /> Produce Stock
            </Button>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Batch</th>
                <th className="px-4 py-2.5">Prepared item</th>
                <th className="px-4 py-2.5">Qty</th>
                <th className="px-4 py-2.5">Inputs</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <p className="font-mono font-bold text-emerald-800">{row.conversionNo}</p>
                    <p className="text-[11px] text-slate-400">{row.conversionDate}</p>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{row.outputName}</td>
                  <td className="px-4 py-3">
                    {row.outputQty} {row.outputUom}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {row.lines.map((l) => `${l.ingredientName} ${l.qty}`).join(", ") || "—"}
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
                    {row.completedAt && (
                      <p className="mt-0.5 text-[10px] text-slate-400">{formatWhen(row.completedAt)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      {row.status === "Draft" && (
                        <>
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
                            className="h-8 rounded-lg px-2.5 text-[11px] !bg-emerald-700 text-white"
                            onClick={() => setCompleteTarget(row)}
                          >
                            Complete
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-8 rounded-lg px-2.5 text-[11px] text-red-600"
                            onClick={() => setDeleteTarget(row)}
                          >
                            Delete
                          </Button>
                        </>
                      )}
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
        title={editing ? `Edit ${editing.conversionNo}` : "Produce Stock"}
        width="responsive"
        footer={
          <div className="flex w-full flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDrawerOpen(false)} className="h-9 rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => void handleSave(false)}
              className="h-9 rounded-xl text-xs font-semibold"
            >
              Save Draft
            </Button>
            <Button
              type="button"
              disabled={saving}
              onClick={() => void handleSave(true)}
              className="h-9 rounded-xl text-xs font-bold !bg-emerald-700 text-white"
            >
              {saving ? "Saving…" : "Save & Complete"}
            </Button>
          </div>
        }
      >
        <div className="grid gap-5 pb-2 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="space-y-5">
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-1 text-sm font-semibold text-slate-900">Produce from master</h3>
              <p className="mb-4 text-xs text-slate-500">
                Pick a conversion item and how much to produce. Ingredient usage scales from the master yield.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField label="Date" required>
                  <TextInput
                    type="date"
                    value={stockDate}
                    onChange={(e) => setStockDate(e.target.value)}
                    className="h-10 text-sm"
                  />
                </FormField>
                <FormField label="Conversion Item" required className="sm:col-span-2">
                  <SelectInput
                    value={stockItemId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setStockItemId(id);
                      const m = activeItems.find((i) => i.id === id);
                      if (m && !editing) setStockQty(m.yieldQty);
                    }}
                    className={cn("block h-10 text-sm", !stockItemId && "text-slate-400")}
                  >
                    <option value="">Select conversion item…</option>
                    {activeItems.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} · yield {i.yieldQty} {i.yieldUom}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
                <FormField
                  label={`Qty to produce${selectedMaster ? ` (${selectedMaster.yieldUom})` : ""}`}
                  required
                >
                  <TextInput
                    type="number"
                    min={0}
                    step="any"
                    value={stockQty}
                    onChange={(e) => setStockQty(e.target.value === "" ? "" : Number(e.target.value))}
                    className="h-10 text-sm font-semibold"
                    placeholder="e.g. 10"
                  />
                </FormField>
                <FormField label="Notes" className="sm:col-span-2">
                  <TextInput
                    value={stockNotes}
                    onChange={(e) => setStockNotes(e.target.value)}
                    className="h-10 text-sm"
                    placeholder="Batch notes (optional)"
                  />
                </FormField>
              </div>
            </section>

            {selectedMaster && (
              <section className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Ingredients that will be deducted</h3>
                <ul className="space-y-2 text-sm">
                  {selectedMaster.lines.map((l) => {
                    const scaled = previewScale > 0 ? Math.round(l.qty * previewScale * 1000) / 1000 : l.qty;
                    const ing = ingredients.find((i) => i.id === l.ingredientId);
                    const short = ing && previewScale > 0 && Number(ing.onHand) < scaled;
                    return (
                      <li
                        key={l.id || `${l.ingredientId}-${l.lineNo}`}
                        className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
                      >
                        <span className="text-slate-700">{l.ingredientName}</span>
                        <span className={cn("font-semibold", short ? "text-red-600" : "text-slate-900")}>
                          {scaled} {l.uom}
                          {short ? " · low stock" : ""}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </div>

          <aside className="space-y-3 lg:sticky lg:top-0">
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Batch summary</p>
              <dl className="space-y-2">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Item</dt>
                  <dd className="truncate font-medium text-slate-900">{selectedMaster?.name || "Not set"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Master yield</dt>
                  <dd className="font-medium text-slate-900">
                    {selectedMaster ? `${selectedMaster.yieldQty} ${selectedMaster.yieldUom}` : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Produce</dt>
                  <dd className="font-medium text-slate-900">
                    {stockQty || "—"} {selectedMaster?.yieldUom || ""}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Scale</dt>
                  <dd className="font-medium text-slate-900">
                    {previewScale > 0 ? `${Math.round(previewScale * 1000) / 1000}×` : "—"}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="rounded-xl bg-emerald-50/80 p-4 text-[11px] leading-relaxed text-emerald-900">
              <strong>Complete</strong> deducts scaled ingredients and adds prepared qty to Ingredients on-hand. Drafts
              do not move stock.
            </div>
          </aside>
        </div>
      </Drawer>

      <ConfirmModal
        open={!!completeTarget}
        onClose={() => setCompleteTarget(null)}
        onConfirm={() => void handleComplete()}
        title="Complete batch?"
        message={
          completeTarget
            ? `Deduct ingredients and add ${completeTarget.outputQty} ${completeTarget.outputUom} of ${completeTarget.outputName} to stock.`
            : ""
        }
        confirmLabel="Complete & Update Stock"
        variant="primary"
        loading={saving}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="Delete draft batch?"
        message={deleteTarget ? `${deleteTarget.conversionNo} will be removed. Stock is not affected.` : ""}
        confirmLabel="Delete"
        variant="danger"
        loading={saving}
      />
    </div>
  );
}
