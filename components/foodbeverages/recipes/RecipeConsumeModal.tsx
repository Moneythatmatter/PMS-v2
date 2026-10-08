"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/frontoffice/ui/Modal";
import { FormField, SelectInput, TextInput } from "@/components/frontoffice/ui";
import type { WarehouseMasterItem } from "@/app/data/warehouseMasterData";
import type { Recipe, RecipeConsumption } from "@/app/data/foodbeverages/recipes";
import { recipeService } from "@/services/food-beverages";
import { formatMoney, formatQty } from "@/components/requisitions/requisitionUi";

export function RecipeConsumeModal({
  recipe,
  warehouses,
  onHandByStore,
  defaultStoreId,
  onClose,
  onDone,
}: {
  recipe: Recipe;
  warehouses: WarehouseMasterItem[];
  onHandByStore: Map<string, number>;
  defaultStoreId: string;
  onClose: () => void;
  onDone: (row: RecipeConsumption) => void;
}) {
  const [portions, setPortions] = useState(String(recipe.yieldQuantity));
  const [storeId, setStoreId] = useState(recipe.issueWarehouseId ?? defaultStoreId);
  const [reference, setReference] = useState("");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const qty = Number(portions) || 0;
  const plan = useMemo(
    () =>
      recipe.ingredients.map((i) => {
        const need = (i.grossStockQuantity * qty) / (recipe.yieldQuantity || 1);
        const have = onHandByStore.get(`${i.materialId}|${storeId}`) ?? 0;
        return { ingredient: i, need, have, short: need > have + 1e-9 };
      }),
    [recipe, qty, storeId, onHandByStore],
  );
  const shortCount = plan.filter((p) => p.short).length;
  const cost = plan.reduce((s, p) => s + p.need * p.ingredient.unitCost, 0);

  const submit = async () => {
    if (!(qty > 0)) return setError("Enter how many units were consumed.");
    if (!storeId) return setError("Choose the store to deduct from.");
    setSaving(true);
    setError(null);
    try {
      const row = await recipeService.consume(recipe.id, {
        portions: qty,
        warehouseId: storeId,
        reference: reference.trim() || undefined,
        remarks: remarks.trim() || undefined,
      });
      onDone(row);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not record consumption.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={`Record consumption · ${recipe.name}`}
      description="Deducts the ingredients below from the chosen store and posts them to the stock ledger."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={saving || shortCount > 0 || !(qty > 0)}
            className="!bg-emerald-700 text-white hover:!bg-emerald-800"
          >
            {saving ? "Deducting…" : "Deduct Stock"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label={`${recipe.yieldUnit} consumed`} required>
            <TextInput type="number" min={0} step="any" value={portions} onChange={(e) => setPortions(e.target.value)} />
          </FormField>
          <FormField label="Deduct from store" required>
            <SelectInput value={storeId} onChange={(e) => setStoreId(e.target.value)} className="block">
              <option value="">Select store</option>
              {warehouses
                .filter((w) => w.status !== "Inactive")
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
            </SelectInput>
          </FormField>
          <FormField label="Reference">
            <TextInput value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. Staff meal, Banquet BQ-12" />
          </FormField>
          <FormField label="Remarks">
            <TextInput value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional" />
          </FormField>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Material</th>
                <th className="px-3 py-2 text-right">Deduct</th>
                <th className="px-3 py-2 text-right">In store</th>
                <th className="px-3 py-2 text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {plan.map(({ ingredient, need, have, short }) => (
                <tr key={ingredient.id}>
                  <td className="px-3 py-2">
                    <p className="font-medium text-slate-900">{ingredient.materialName}</p>
                    <p className="text-xs text-slate-500">{ingredient.productCode}</p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right font-medium text-slate-800">
                    {formatQty(need)} <span className="text-xs text-slate-400">{ingredient.stockUnit}</span>
                  </td>
                  <td className={cn("whitespace-nowrap px-3 py-2 text-right", short ? "font-semibold text-red-600" : "text-slate-600")}>
                    {formatQty(have)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right text-slate-700">{formatMoney(need * ingredient.unitCost)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-semibold text-slate-900">
              <tr>
                <td className="px-3 py-2" colSpan={3}>
                  Total consumption value
                </td>
                <td className="px-3 py-2 text-right">{formatMoney(cost)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        {shortCount > 0 && (
          <p className="flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {shortCount} ingredient{shortCount === 1 ? " is" : "s are"} short in this store. Transfer or receive stock first,
            or pick another store.
          </p>
        )}
      </div>
    </Modal>
  );
}
