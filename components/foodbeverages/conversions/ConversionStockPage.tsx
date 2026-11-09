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
import { OperationsToolbar } from "@/components/housekeeping/OperationsToolbar";
import { usePsList } from "@/hooks/usePsResource";
import {
  conversionItemService,
  conversionService,
  ingredientService,
} from "@/services/food-beverages";
import type {
  ConversionItem,
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

type StockRow = ConversionItem & {
  onHand: number;
  lastProducedAt: string | null;
  batchCount: number;
};

/** Inventory — one stock row per conversion master; produce updates on-hand. */
export function ConversionStockPage() {
  const { data: items, loading: itemsLoading, reload: reloadItems } = usePsList(
    () => conversionItemService.list(),
    [],
  );
  const { data: conversions, reload: reloadBatches } = usePsList(() => conversionService.list(), []);
  const { data: ingredientsRaw, reload: reloadIngredients } = usePsList(
    () => ingredientService.list() as Promise<FbIngredient[]>,
    [],
  );

  const ingredientsById = useMemo(() => {
    const map = new Map<string, FbIngredient>();
    for (const i of ingredientsRaw as FbIngredient[]) map.set(i.id, i);
    return map;
  }, [ingredientsRaw]);

  const stockRows = useMemo((): StockRow[] => {
    return items
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((item) => {
        const ing = ingredientsById.get(item.outputIngredientId);
        const batches = conversions.filter((c) => c.conversionItemId === item.id && c.status === "Completed");
        const last = batches
          .slice()
          .sort((a, b) => String(b.completedAt ?? "").localeCompare(String(a.completedAt ?? "")))[0];
        return {
          ...item,
          onHand: Number(ing?.onHand) || 0,
          lastProducedAt: last?.completedAt ?? null,
          batchCount: batches.length,
        };
      });
  }, [items, ingredientsById, conversions]);

  const activeItems = useMemo(() => items.filter((i) => i.status === "Active"), [items]);

  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [toast, setToast] = useState<{ message: string; variant: "success" | "info" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
    return stockRows.filter((row) => {
      if (statusTab === "Active" && row.status !== "Active") return false;
      if (statusTab === "Inactive" && row.status !== "Inactive") return false;
      if (statusTab === "In Stock" && !(row.onHand > 0)) return false;
      if (statusTab === "Zero" && row.onHand > 0) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        row.code.toLowerCase().includes(q) ||
        row.lines.some((l) => l.ingredientName.toLowerCase().includes(q))
      );
    });
  }, [stockRows, search, statusTab]);

  const openProduce = (itemId?: string) => {
    if (activeItems.length === 0) {
      setToast({
        message: "Add a conversion item under Menu → Conversion Items first.",
        variant: "info",
      });
      return;
    }
    const target = activeItems.find((i) => i.id === itemId) ?? activeItems[0];
    setStockItemId(target.id);
    setStockDate(todayISO());
    setStockQty(target.yieldQty);
    setStockNotes("");
    setDrawerOpen(true);
  };

  const handleProduce = async () => {
    if (!stockItemId) {
      setToast({ message: "Select a conversion item.", variant: "info" });
      return;
    }
    const qty = Number(stockQty);
    if (!(qty > 0)) {
      setToast({ message: "Enter how much prepared item to produce.", variant: "info" });
      return;
    }
    setSaving(true);
    try {
      const draft = await conversionService.create({
        conversionItemId: stockItemId,
        conversionDate: stockDate,
        outputQty: qty,
        notes: stockNotes.trim(),
      });
      const saved = await conversionService.complete(draft.id);
      await Promise.all([reloadItems(), reloadBatches(), reloadIngredients()]);
      setDrawerOpen(false);
      setToast({
        message: `Stock updated — ${saved.outputQty} ${saved.outputUom} of ${saved.outputName} added.`,
        variant: "success",
      });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Produce failed", variant: "info" });
    } finally {
      setSaving(false);
    }
  };

  const statusFilters = [
    { id: "all", label: "All", count: stockRows.length },
    { id: "In Stock", label: "In Stock", count: stockRows.filter((r) => r.onHand > 0).length },
    { id: "Zero", label: "Zero stock", count: stockRows.filter((r) => !(r.onHand > 0)).length },
    { id: "Active", label: "Active", count: stockRows.filter((r) => r.status === "Active").length },
  ];

  const loading = itemsLoading;

  return (
    <div className="space-y-4 p-4 md:p-6">
      {toast && (
        <AlertBanner variant={toast.variant} message={toast.message} onDismiss={() => setToast(null)} />
      )}

      <FOPageHeader
        eyebrow="Food & Beverages / Inventory"
        title="Conversion Stock"
        description="Prepared item balances from conversion masters. Produce adds to the same stock row — one line per item."
        action={
          <Button
            type="button"
            onClick={() => openProduce()}
            className="h-9 gap-1.5 rounded-xl px-4 text-xs font-bold !bg-emerald-700 text-white"
          >
            <Plus className="h-3.5 w-3.5" /> Produce Stock
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Prepared items", value: stockRows.length, icon: FlaskConical, tone: "bg-sky-50 text-sky-700" },
          {
            label: "In stock",
            value: stockRows.filter((r) => r.onHand > 0).length,
            icon: CheckCircle2,
            tone: "bg-emerald-50 text-emerald-700",
          },
          {
            label: "Zero stock",
            value: stockRows.filter((r) => !(r.onHand > 0)).length,
            icon: Package,
            tone: "bg-amber-50 text-amber-700",
          },
          {
            label: "Total on hand",
            value: Math.round(stockRows.reduce((s, r) => s + r.onHand, 0) * 1000) / 1000,
            icon: RefreshCw,
            tone: "bg-slate-50 text-slate-600",
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

      {items.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No conversion items yet.{" "}
          <Link href="/food-beverages/menu/conversion-items" className="font-semibold underline">
            Create masters under Menu → Conversion Items
          </Link>{" "}
          — they appear here automatically with 0 stock.
        </div>
      )}

      <OperationsToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search prepared item or ingredient…"
        showFilters={false}
        statusTabs={statusFilters}
        activeStatusTab={statusTab}
        onStatusTabChange={setStatusTab}
      />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">Loading conversion stock…</p>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-medium text-slate-600">No prepared stock rows</p>
            <p className="mt-1 text-xs text-slate-400">
              Conversion masters show here with 0 stock until you produce.
            </p>
            <Button type="button" onClick={() => openProduce()} className="mt-4 h-9 rounded-xl text-xs font-bold">
              <Plus className="mr-1 h-3.5 w-3.5" /> Produce Stock
            </Button>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Prepared item</th>
                <th className="px-4 py-2.5">On hand</th>
                <th className="px-4 py-2.5">Yield / BOM</th>
                <th className="px-4 py-2.5">Last produced</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{row.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {row.code || "—"}
                      {row.status !== "Active" ? ` · ${row.status}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className={cn("font-extrabold tabular-nums", row.onHand > 0 ? "text-emerald-800" : "text-slate-500")}>
                      {row.onHand} {row.yieldUom}
                    </p>
                    {row.batchCount > 0 && (
                      <p className="text-[10px] text-slate-400">{row.batchCount} production run{row.batchCount === 1 ? "" : "s"}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    <p className="font-medium text-slate-800">
                      {row.yieldQty} {row.yieldUom} / batch
                    </p>
                    <p className="mt-0.5">
                      {row.lines.length === 0
                        ? "—"
                        : row.lines
                            .slice(0, 2)
                            .map((l) => `${l.ingredientName} (${l.qty})`)
                            .join(", ")}
                      {row.lines.length > 2 ? ` +${row.lines.length - 2}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatWhen(row.lastProducedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      disabled={row.status !== "Active"}
                      onClick={() => openProduce(row.id)}
                      className="h-8 rounded-lg px-2.5 text-[11px] font-bold !bg-emerald-700 text-white disabled:opacity-40"
                    >
                      Produce
                    </Button>
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
        title="Produce Stock"
        width="responsive"
        footer={
          <div className="flex w-full flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDrawerOpen(false)} className="h-9 rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saving}
              onClick={() => void handleProduce()}
              className="h-9 rounded-xl text-xs font-bold !bg-emerald-700 text-white"
            >
              {saving ? "Updating…" : "Produce & Update Stock"}
            </Button>
          </div>
        }
      >
        <div className="grid gap-5 pb-2 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="space-y-5">
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-1 text-sm font-semibold text-slate-900">Add to existing stock</h3>
              <p className="mb-4 text-xs text-slate-500">
                Producing updates the prepared item’s on-hand. You will not get a duplicate stock row.
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
                <FormField label="Prepared item" required className="sm:col-span-2">
                  <SelectInput
                    value={stockItemId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setStockItemId(id);
                      const m = activeItems.find((i) => i.id === id);
                      if (m) setStockQty(m.yieldQty);
                    }}
                    className={cn("block h-10 text-sm", !stockItemId && "text-slate-400")}
                  >
                    <option value="">Select conversion item…</option>
                    {activeItems.map((i) => {
                      const onHand = Number(ingredientsById.get(i.outputIngredientId)?.onHand) || 0;
                      return (
                        <option key={i.id} value={i.id}>
                          {i.name} · on hand {onHand} {i.yieldUom} · yield {i.yieldQty}
                        </option>
                      );
                    })}
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
                    const ing = ingredientsById.get(l.ingredientId);
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
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Stock update</p>
              <dl className="space-y-2">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Item</dt>
                  <dd className="truncate font-medium text-slate-900">{selectedMaster?.name || "Not set"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Current</dt>
                  <dd className="font-medium text-slate-900">
                    {selectedMaster
                      ? `${Number(ingredientsById.get(selectedMaster.outputIngredientId)?.onHand) || 0} ${selectedMaster.yieldUom}`
                      : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Produce</dt>
                  <dd className="font-medium text-slate-900">
                    {stockQty || "—"} {selectedMaster?.yieldUom || ""}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">After</dt>
                  <dd className="font-bold text-emerald-800">
                    {selectedMaster && Number(stockQty) > 0
                      ? `${
                          Math.round(
                            ((Number(ingredientsById.get(selectedMaster.outputIngredientId)?.onHand) || 0) +
                              Number(stockQty)) *
                              1000,
                          ) / 1000
                        } ${selectedMaster.yieldUom}`
                      : "—"}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="rounded-xl bg-emerald-50/80 p-4 text-[11px] leading-relaxed text-emerald-900">
              Completing deducts BOM ingredients and adds quantity to this prepared item’s existing stock row.
            </div>
          </aside>
        </div>
      </Drawer>
    </div>
  );
}
