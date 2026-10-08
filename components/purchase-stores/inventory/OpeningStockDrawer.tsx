"use client";

import React, { useMemo, useState } from "react";
import { Info, PackagePlus, Trash2, Warehouse } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { FormField, SelectInput, TextInput } from "@/components/frontoffice/ui";
import { ProcurementFormSection } from "@/components/purchase-stores/ui/ProcurementFormParts";
import type { ProductItem } from "@/app/data/productMasterData";
import type { WarehouseMasterItem } from "@/app/data/warehouseMasterData";
import type { StockBalanceRecord } from "@/app/data/stockBalanceData";
import { psStockBalanceService } from "@/services/purchase-stores/index";
import { formatMoney, formatQty, todayIso } from "@/components/requisitions/requisitionUi";

type Line = { key: string; materialId: string; quantity: string; unitCost: string };

let seq = 0;
const nextKey = () => `opn-${++seq}`;

export type OpeningStockPrefill = { materialId?: string; warehouseId?: string };

export function OpeningStockDrawer({
  open,
  onClose,
  products,
  warehouses,
  balances,
  prefill,
  onPosted,
}: {
  open: boolean;
  onClose: () => void;
  products: ProductItem[];
  warehouses: WarehouseMasterItem[];
  balances: StockBalanceRecord[];
  prefill?: OpeningStockPrefill;
  onPosted: (message: string) => void;
}) {
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const activeStores = warehouses.filter((w) => w.status !== "Inactive");

  const [warehouseId, setWarehouseId] = useState(prefill?.warehouseId ?? "");
  const [date, setDate] = useState(todayIso());
  const [reference, setReference] = useState("");
  const [lines, setLines] = useState<Line[]>(() =>
    prefill?.materialId ? [{ key: nextKey(), materialId: prefill.materialId, quantity: "", unitCost: "" }] : [],
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const balanceFor = (materialId: string) =>
    balances.find((b) => b.materialId === materialId && b.warehouseId === warehouseId);

  const pickable = useMemo(() => {
    const chosen = new Set(lines.map((l) => l.materialId));
    const byCategory = new Map<string, ProductItem[]>();
    for (const p of products) {
      if (p.status === "Inactive" || chosen.has(p.id)) continue;
      const list = byCategory.get(p.category) ?? [];
      list.push(p);
      byCategory.set(p.category, list);
    }
    return [...byCategory.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [products, lines]);

  const totals = { value: lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitCost) || 0), 0) };

  const addMaterial = (materialId: string) => {
    if (!materialId) return;
    setLines((prev) => [...prev, { key: nextKey(), materialId, quantity: "", unitCost: "" }]);
  };

  const updateLine = (key: string, field: "quantity" | "unitCost", value: string) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, [field]: value } : l)));

  const submit = async () => {
    const problems = [
      !warehouseId && "Choose the store the stock is sitting in.",
      lines.length === 0 && "Add at least one material.",
      ...lines.map((l) => {
        const name = productById.get(l.materialId)?.productName ?? "A material";
        if (!(Number(l.quantity) > 0)) return `${name}: enter a quantity greater than 0.`;
        if (l.unitCost === "" || Number(l.unitCost) < 0) return `${name}: enter the purchase rate (₹ per unit).`;
        return null;
      }),
    ].filter((p): p is string => Boolean(p));
    setErrors(problems);
    if (problems.length > 0) return;

    setSaving(true);
    try {
      const result = await psStockBalanceService.addOpening({
        warehouseId,
        date,
        reference: reference.trim() || undefined,
        items: lines.map((l) => ({ materialId: l.materialId, quantity: Number(l.quantity), unitCost: Number(l.unitCost) })),
      });
      const store = warehouses.find((w) => w.id === warehouseId)?.name ?? "the store";
      onPosted(
        `${result.transactionNo}: opening stock for ${lines.length} material${lines.length === 1 ? "" : "s"} added to ${store} (${formatMoney(result.totalValue)}).`,
      );
    } catch (e) {
      setErrors([e instanceof Error ? e.message : "Could not post opening stock."]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="bottom"
      title="Add Opening Stock"
      customHeader={
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
            <PackagePlus className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 id="drawer-title" className="truncate text-base font-bold text-slate-900 sm:text-lg">
              Add Opening Stock
            </h2>
            <p className="truncate text-xs text-slate-500">
              Put stock you already have on the books, with the rate you paid for it.
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            <strong className="text-slate-800">{lines.length}</strong> material{lines.length === 1 ? "" : "s"} · value{" "}
            <strong className="text-slate-800">{formatMoney(totals.value)}</strong>
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving} className="!bg-emerald-700 text-white hover:!bg-emerald-800">
              {saving ? "Posting…" : "Post Opening Stock"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="mx-auto max-w-5xl space-y-5">
        {errors.length > 0 && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <ul className="list-disc space-y-0.5 pl-4">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-start gap-2.5 rounded-xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-xs text-sky-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Use this for stock that is already on the shelf when you start using the system. The rate you enter becomes the
            material&apos;s cost, which is what recipe costing uses. New purchases should come in through PO → GRN → QC.
          </p>
        </div>

        <ProcurementFormSection step={1} title="Where and when" subtitle="The store the stock is physically in.">
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Store" required>
              <SelectInput value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className="block">
                <option value="">Select store</option>
                {activeStores.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </SelectInput>
            </FormField>
            <FormField label="As of date" required>
              <TextInput type="date" value={date} max={todayIso()} onChange={(e) => setDate(e.target.value)} />
            </FormField>
            <FormField label="Reference">
              <TextInput value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. Physical count Oct 2026" />
            </FormField>
          </div>
        </ProcurementFormSection>

        <ProcurementFormSection step={2} title="Materials" subtitle="Quantity on hand and the rate per stock unit.">
          <SelectInput value="" onChange={(e) => addMaterial(e.target.value)} className="block" aria-label="Add material">
            <option value="">+ Add a material from the product master…</option>
            {pickable.map(([category, items]) => (
              <optgroup key={category} label={category}>
                {items.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.productName} ({p.productCode}) · {p.unit}
                  </option>
                ))}
              </optgroup>
            ))}
          </SelectInput>

          {lines.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
              <Warehouse className="mx-auto h-7 w-7 text-slate-300" />
              <p className="mt-2 text-sm font-medium text-slate-600">No materials added</p>
              <p className="text-xs text-slate-400">Pick materials above, then enter the quantity and rate.</p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Material</th>
                    <th className="px-4 py-2 text-right">Already in store</th>
                    <th className="w-40 px-4 py-2">Quantity</th>
                    <th className="w-40 px-4 py-2">Rate</th>
                    <th className="px-4 py-2 text-right">Value</th>
                    <th className="w-10 px-2 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lines.map((l) => {
                    const p = productById.get(l.materialId);
                    const existing = warehouseId ? balanceFor(l.materialId) : undefined;
                    const value = (Number(l.quantity) || 0) * (Number(l.unitCost) || 0);
                    return (
                      <tr key={l.key} className="align-top">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">{p?.productName ?? "Unknown material"}</p>
                          <p className="text-[11px] text-slate-500">
                            <span className="font-mono">{p?.productCode}</span> · {p?.category}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          {!warehouseId ? (
                            <span className="text-xs text-slate-400">Pick a store</span>
                          ) : existing && existing.quantity !== 0 ? (
                            <>
                              <p className="font-medium text-slate-800">
                                {formatQty(existing.quantity)} <span className="text-xs text-slate-400">{p?.unit}</span>
                              </p>
                              <p className="text-[10px] text-amber-600">Adds on top · cost re-averaged</p>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400">None</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex h-9 overflow-hidden rounded-lg border border-slate-200 bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                            <input
                              type="number"
                              min={0}
                              step="any"
                              inputMode="decimal"
                              value={l.quantity}
                              placeholder="0"
                              onChange={(e) => updateLine(l.key, "quantity", e.target.value)}
                              className="w-full min-w-0 bg-transparent px-3 text-sm font-medium focus:outline-none"
                              aria-label={`Quantity of ${p?.productName ?? "material"}`}
                            />
                            <span className="flex max-w-[84px] items-center truncate border-l border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-500">
                              {p?.unit}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex h-9 overflow-hidden rounded-lg border border-slate-200 bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                            <span className="flex items-center border-r border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-500">
                              ₹
                            </span>
                            <input
                              type="number"
                              min={0}
                              step="any"
                              inputMode="decimal"
                              value={l.unitCost}
                              placeholder="0.00"
                              onChange={(e) => updateLine(l.key, "unitCost", e.target.value)}
                              className="w-full min-w-0 bg-transparent px-3 text-sm font-medium focus:outline-none"
                              aria-label={`Rate per ${p?.unit ?? "unit"} for ${p?.productName ?? "material"}`}
                            />
                          </div>
                          <p className="mt-1 text-[10px] text-slate-400">per {p?.unit}</p>
                        </td>
                        <td className={cn("whitespace-nowrap px-4 py-3 text-right font-semibold", value > 0 ? "text-slate-900" : "text-slate-400")}>
                          {formatMoney(value)}
                        </td>
                        <td className="px-2 py-2.5">
                          <button
                            type="button"
                            onClick={() => setLines((prev) => prev.filter((x) => x.key !== l.key))}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                            aria-label={`Remove ${p?.productName ?? "material"}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 text-sm font-semibold text-slate-900">
                  <tr>
                    <td className="px-4 py-2.5" colSpan={4}>
                      Total opening value
                    </td>
                    <td className="px-4 py-2.5 text-right">{formatMoney(totals.value)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </ProcurementFormSection>
      </div>
    </Drawer>
  );
}
