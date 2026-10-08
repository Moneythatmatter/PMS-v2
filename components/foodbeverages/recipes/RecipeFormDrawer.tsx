"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, ChefHat, Clock, Info, Scale, UtensilsCrossed, Warehouse } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { FormField, SelectInput, TextAreaInput, TextInput } from "@/components/frontoffice/ui";
import { ProcurementFormSection, ProcurementSummaryRow } from "@/components/purchase-stores/ui/ProcurementFormParts";
import type { ProductItem } from "@/app/data/productMasterData";
import type { WarehouseMasterItem } from "@/app/data/warehouseMasterData";
import {
  TARGET_FOOD_COST_PERCENT,
  YIELD_UNITS,
  defaultRecipeUnit,
  grossStockQuantity,
  unitConversionFactor,
  yieldUnitLabel,
  type Recipe,
  type RecipeInput,
} from "@/app/data/foodbeverages/recipes";
import { recipeService } from "@/services/food-beverages";
import { formatMoney, formatQty } from "@/components/requisitions/requisitionUi";
import type { MenuCategoryOption, MenuItemOption } from "./RecipesPage";
import { AllMaterialsSwitch, RecipeIngredientsEditor, type IngredientFormLine } from "./RecipeIngredientsEditor";
import { GROUP_INPUT, InputGroup } from "../ui/InputGroup";

let lineSeq = 0;
const nextKey = () => `ing-${++lineSeq}`;

export function FoodCostBadge({ percent, hasPrice }: { percent: number; hasPrice: boolean }) {
  if (!hasPrice) return <span className="text-slate-400">—</span>;
  const high = percent > TARGET_FOOD_COST_PERCENT;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold",
        high ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
    >
      {percent.toFixed(1)}%
    </span>
  );
}

export function RecipeFormDrawer({
  open,
  onClose,
  initial,
  products,
  fbCategoryNames,
  avgCostByMaterial,
  onHandByStore,
  warehouses,
  menuItems,
  menuCategories,
  linkedMenuItemIds,
  defaultStoreId,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial: Recipe | null;
  products: ProductItem[];
  fbCategoryNames: Set<string>;
  avgCostByMaterial: Map<string, number>;
  onHandByStore: Map<string, number>;
  warehouses: WarehouseMasterItem[];
  menuItems: MenuItemOption[];
  menuCategories: MenuCategoryOption[];
  linkedMenuItemIds: Set<string>;
  defaultStoreId: string;
  onSaved: (recipe: Recipe, message: string) => void;
}) {
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const menuItemById = useMemo(() => new Map(menuItems.map((m) => [m.id, m])), [menuItems]);

  const [name, setName] = useState(initial?.name ?? "");
  const [menuItemId, setMenuItemId] = useState(initial?.menuItemId ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [sellingPrice, setSellingPrice] = useState(initial ? String(initial.sellingPrice || "") : "");
  const [yieldQuantity, setYieldQuantity] = useState(initial ? String(initial.yieldQuantity) : "1");
  const [yieldUnit, setYieldUnit] = useState(initial?.yieldUnit ?? "Portions");
  const [wastagePercent, setWastagePercent] = useState(initial ? String(initial.wastagePercent || "") : "");
  const [prepTime, setPrepTime] = useState(initial?.prepTimeMinutes != null ? String(initial.prepTimeMinutes) : "");
  const [storeId, setStoreId] = useState(initial?.issueWarehouseId ?? defaultStoreId);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [instructions, setInstructions] = useState(initial?.instructions ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [lines, setLines] = useState<IngredientFormLine[]>(
    () =>
      initial?.ingredients.map((i) => ({
        key: nextKey(),
        id: i.id,
        materialId: i.materialId,
        quantity: String(i.quantity),
        unit: i.unit,
        wastagePercent: i.wastagePercent ? String(i.wastagePercent) : "",
        remarks: i.remarks,
      })) ?? [],
  );
  const [showAllMaterials, setShowAllMaterials] = useState(fbCategoryNames.size === 0);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const recipeWastage = Number(wastagePercent) || 0;
  const yieldQty = Number(yieldQuantity) || 0;
  const price = Number(sellingPrice) || 0;

  const computed = useMemo(
    () =>
      lines.map((l) => {
        const product = productById.get(l.materialId);
        const factor = product ? unitConversionFactor(l.unit, product.unit) : null;
        const stockQty = factor === null ? 0 : (Number(l.quantity) || 0) * factor;
        const gross = grossStockQuantity(stockQty, Number(l.wastagePercent) || 0, recipeWastage);
        const unitCost = avgCostByMaterial.get(l.materialId) ?? 0;
        const onHand = storeId ? (onHandByStore.get(`${l.materialId}|${storeId}`) ?? 0) : null;
        return { line: l, product, factor, gross, unitCost, cost: gross * unitCost, onHand };
      }),
    [lines, productById, recipeWastage, avgCostByMaterial, onHandByStore, storeId],
  );

  const batchCost = computed.reduce((s, c) => s + c.cost, 0);
  const costPerPortion = yieldQty > 0 ? batchCost / yieldQty : 0;
  const foodCost = price > 0 ? (costPerPortion / price) * 100 : 0;
  const uncosted = computed.filter((c) => c.product && c.unitCost === 0).length;

  const pickable = useMemo(() => {
    const chosen = new Set(lines.map((l) => l.materialId));
    const active = products.filter((p) => p.status !== "Inactive" && !chosen.has(p.id));
    return {
      own: active.filter((p) => fbCategoryNames.has(p.category)),
      other: showAllMaterials ? active.filter((p) => !fbCategoryNames.has(p.category)) : [],
    };
  }, [products, lines, fbCategoryNames, showAllMaterials]);

  const availableMenuItems = menuItems.filter((m) => m.id === initial?.menuItemId || !linkedMenuItemIds.has(m.id));

  const handleMenuItem = (id: string) => {
    const prev = menuItemById.get(menuItemId);
    const next = menuItemById.get(id);
    setMenuItemId(id);
    if (!next) return;
    if (!name.trim() || name === prev?.name) setName(next.name);
    if (!sellingPrice || Number(sellingPrice) === prev?.price) setSellingPrice(String(next.price || ""));
    if (next.categoryId && (!categoryId || categoryId === prev?.categoryId)) setCategoryId(next.categoryId);
  };

  const addMaterial = (materialId: string) => {
    const product = productById.get(materialId);
    if (!product) return;
    setLines((prev) => [
      ...prev,
      {
        key: nextKey(),
        materialId,
        quantity: "",
        unit: defaultRecipeUnit(product.unit),
        wastagePercent: "",
        remarks: "",
      },
    ]);
  };

  const updateLine = (key: string, field: "quantity" | "unit" | "wastagePercent" | "remarks", value: string) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, [field]: value } : l)));

  const removeLine = (key: string) => setLines((prev) => prev.filter((l) => l.key !== key));

  const save = async () => {
    const problems = [
      !name.trim() && "Enter the recipe name.",
      !(yieldQty > 0) && "Yield must be greater than 0.",
      price < 0 && "Selling price cannot be negative.",
      (recipeWastage < 0 || recipeWastage > 100) && "Process wastage must be between 0 and 100%.",
      lines.length === 0 && "Add at least one ingredient from the material master.",
      ...computed.map((c) => {
        const label = c.product?.productName ?? "An ingredient";
        if (!(Number(c.line.quantity) > 0)) return `${label}: enter a quantity greater than 0.`;
        if (c.factor === null) return `${label}: ${c.line.unit} can't be converted to ${c.product?.unit}.`;
        const w = Number(c.line.wastagePercent) || 0;
        if (w < 0 || w > 100) return `${label}: wastage must be between 0 and 100%.`;
        return null;
      }),
    ].filter((p): p is string => Boolean(p));
    setErrors(problems);
    if (problems.length > 0) return;

    const payload: RecipeInput = {
      name: name.trim(),
      menuItemId: menuItemId || null,
      categoryId: categoryId || null,
      sellingPrice: price,
      yieldQuantity: yieldQty,
      yieldUnit,
      wastagePercent: recipeWastage,
      prepTimeMinutes: prepTime === "" ? null : Number(prepTime),
      issueWarehouseId: storeId || null,
      isActive,
      instructions: instructions.trim(),
      notes: notes.trim(),
      ingredients: lines.map((l) => ({
        id: l.id,
        materialId: l.materialId,
        quantity: Number(l.quantity),
        unit: l.unit,
        wastagePercent: Number(l.wastagePercent) || 0,
        remarks: l.remarks.trim(),
      })),
    };

    setSaving(true);
    try {
      const saved = initial ? await recipeService.update(initial.id, payload) : await recipeService.create(payload);
      onSaved(saved, initial ? `${saved.name} updated. Stock was not changed.` : `${saved.name} (${saved.recipeCode}) created. Stock was not changed.`);
    } catch (e) {
      setErrors([e instanceof Error ? e.message : "Could not save the recipe."]);
    } finally {
      setSaving(false);
    }
  };

  const storeName = warehouses.find((w) => w.id === storeId)?.name;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="bottom"
      title={initial ? `Edit ${initial.name}` : "New Recipe"}
      customHeader={
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
            <ChefHat className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 id="drawer-title" className="truncate text-base font-bold text-slate-900 sm:text-lg">
              {initial ? `Edit Recipe · ${initial.recipeCode}` : "New Recipe"}
            </h2>
            <p className="truncate text-xs text-slate-500">
              Build the recipe from Purchase &amp; Stores materials. Saving does not move any stock.
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            <strong className="text-slate-800">{lines.length}</strong> ingredient{lines.length === 1 ? "" : "s"} · cost per{" "}
            {yieldUnitLabel(yieldUnit).toLowerCase()} <strong className="text-slate-800">{formatMoney(costPerPortion)}</strong>
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving} className="!bg-emerald-700 text-white hover:!bg-emerald-800">
              {saving ? "Saving…" : initial ? "Save Changes" : "Create Recipe"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          {errors.length > 0 && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <ul className="list-disc space-y-0.5 pl-4">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          <ProcurementFormSection step={1} title="Recipe details" subtitle="What it is, what it sells for and how much one batch makes.">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Recipe Name" required>
                <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Butter Chicken" />
              </FormField>
              <FormField label="Menu Item" helperText="Selling this item in POS deducts this recipe's ingredients.">
                <SelectInput value={menuItemId} onChange={(e) => handleMenuItem(e.target.value)} className="block">
                  <option value="">Not linked (prep / sub-recipe)</option>
                  {availableMenuItems.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                      {m.price ? ` · ${formatMoney(m.price)}` : ""}
                    </option>
                  ))}
                </SelectInput>
              </FormField>
              <FormField label="Category">
                <SelectInput value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="block">
                  <option value="">Uncategorised</option>
                  {menuCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </SelectInput>
              </FormField>
              <FormField label={`Selling Price (per ${yieldUnitLabel(yieldUnit).toLowerCase()})`}>
                <InputGroup prefix="₹">
                  <input
                    type="number"
                    min={0}
                    step="any"
                    inputMode="decimal"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="0"
                    className={GROUP_INPUT}
                    aria-label="Selling price"
                  />
                </InputGroup>
              </FormField>
              <FormField label="Yield" required helperText="How many units one batch of this recipe makes.">
                <InputGroup
                  invalid={yieldQuantity !== "" && !(yieldQty > 0)}
                  suffix={
                    <select
                      value={yieldUnit}
                      onChange={(e) => setYieldUnit(e.target.value)}
                      className="h-full w-32 cursor-pointer border-l border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 focus:outline-none"
                      aria-label="Yield unit"
                    >
                      {YIELD_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  }
                >
                  <input
                    type="number"
                    min={0}
                    step="any"
                    inputMode="decimal"
                    value={yieldQuantity}
                    onChange={(e) => setYieldQuantity(e.target.value)}
                    placeholder="1"
                    className={GROUP_INPUT}
                    aria-label="Yield quantity"
                  />
                </InputGroup>
              </FormField>
              <FormField label="Process Wastage" helperText="Extra loss on the whole batch (spillage, evaporation).">
                <InputGroup suffix="%" invalid={recipeWastage < 0 || recipeWastage > 100}>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="any"
                    inputMode="decimal"
                    value={wastagePercent}
                    onChange={(e) => setWastagePercent(e.target.value)}
                    placeholder="0"
                    className={GROUP_INPUT}
                    aria-label="Process wastage percent"
                  />
                </InputGroup>
              </FormField>
              <FormField label="Issue Store" helperText="Ingredients are deducted from this store when consumed.">
                <SelectInput value={storeId} onChange={(e) => setStoreId(e.target.value)} className="block">
                  <option value="">Default kitchen store</option>
                  {warehouses
                    .filter((w) => w.status !== "Inactive")
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                </SelectInput>
              </FormField>
              <FormField label="Prep Time">
                <InputGroup suffix="min">
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    placeholder="e.g. 25"
                    className={GROUP_INPUT}
                    aria-label="Prep time in minutes"
                  />
                </InputGroup>
              </FormField>
            </div>
            <label className="mt-4 flex w-fit cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
              />
              Active — inactive recipes are not deducted on sale
            </label>
          </ProcurementFormSection>

          <ProcurementFormSection
            step={2}
            title="Ingredients"
            subtitle="Raw materials from the Purchase & Stores master, with the quantity one batch needs."
            action={
              fbCategoryNames.size > 0 ? <AllMaterialsSwitch checked={showAllMaterials} onChange={setShowAllMaterials} /> : null
            }
          >
            <RecipeIngredientsEditor
              rows={computed}
              pickGroups={[
                { label: "Food & Beverage materials", items: pickable.own },
                { label: "Other materials", items: pickable.other },
              ]}
              emptyPickerHint={
                !showAllMaterials && fbCategoryNames.size > 0
                  ? "Turn on “All materials” to search outside Food & Beverage categories."
                  : "Add new materials in Purchase & Stores → Product Master."
              }
              onAdd={addMaterial}
              onUpdate={updateLine}
              onRemove={removeLine}
              onHandFor={(id) => (storeId ? (onHandByStore.get(`${id}|${storeId}`) ?? 0) : null)}
              costFor={(id) => avgCostByMaterial.get(id) ?? 0}
              storeName={storeName ?? "the issue store"}
              yieldQty={yieldQty}
              yieldUnit={yieldUnit}
              batchCost={batchCost}
              costPerPortion={costPerPortion}
            />
          </ProcurementFormSection>

          <ProcurementFormSection step={3} title="Method" subtitle="Cooking instructions and service notes for the kitchen.">
            <div className="space-y-4">
              <FormField label="Instructions">
                <TextAreaInput
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={6}
                  placeholder={"1. Marinate chicken in yogurt and spices for 2 hours.\n2. Grill until charred.\n3. Simmer in makhani gravy for 10 minutes."}
                />
              </FormField>
              <FormField label="Notes">
                <TextAreaInput
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Allergens, plating, garnish, holding time…"
                />
              </FormField>
            </div>
          </ProcurementFormSection>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-0 lg:self-start">
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Costing</h3>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-lg bg-slate-50 p-2">
                <p className="text-[10px] font-semibold uppercase text-slate-400">Batch Cost</p>
                <p className="truncate text-base font-bold text-slate-900">{formatMoney(batchCost)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <p className="text-[10px] font-semibold uppercase text-slate-400">Cost / {yieldUnitLabel(yieldUnit)}</p>
                <p className="truncate text-base font-bold text-slate-900">{formatMoney(costPerPortion)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <p className="text-[10px] font-semibold uppercase text-slate-400">Selling Price</p>
                <p className="truncate text-base font-bold text-slate-900">{price > 0 ? formatMoney(price) : "—"}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <p className="text-[10px] font-semibold uppercase text-slate-400">Food Cost</p>
                <p
                  className={cn(
                    "text-base font-bold",
                    price <= 0 ? "text-slate-400" : foodCost > TARGET_FOOD_COST_PERCENT ? "text-red-600" : "text-emerald-700",
                  )}
                >
                  {price > 0 ? `${foodCost.toFixed(1)}%` : "—"}
                </p>
              </div>
            </div>
            {price > 0 && (
              <p className="mt-3 text-xs text-slate-500">
                Margin {formatMoney(price - costPerPortion)} per {yieldUnitLabel(yieldUnit).toLowerCase()} · target food cost ≤{" "}
                {TARGET_FOOD_COST_PERCENT}%
              </p>
            )}
            {uncosted > 0 && (
              <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-xs text-amber-800">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {uncosted} ingredient{uncosted === 1 ? " has" : "s have"} no stock cost yet. Cost fills in after the first GRN.
              </p>
            )}
            <dl className="mt-4 space-y-2.5 border-t border-slate-100 pt-4 text-xs">
              <ProcurementSummaryRow
                icon={<UtensilsCrossed className="h-3.5 w-3.5" />}
                label="Menu item"
                value={menuItemById.get(menuItemId)?.name}
              />
              <ProcurementSummaryRow
                icon={<Scale className="h-3.5 w-3.5" />}
                label="Yield"
                value={yieldQty > 0 ? `${formatQty(yieldQty)} ${yieldUnit}` : undefined}
              />
              <ProcurementSummaryRow icon={<Clock className="h-3.5 w-3.5" />} label="Prep time" value={prepTime ? `${prepTime} min` : undefined} />
              <ProcurementSummaryRow icon={<Warehouse className="h-3.5 w-3.5" />} label="Issue store" value={storeName ?? "Default kitchen store"} />
            </dl>
          </section>
          <section className="rounded-xl border border-sky-100 bg-sky-50/60 p-4 text-xs text-sky-900">
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
              <Info className="h-4 w-4" /> When does stock move?
            </h3>
            <ul className="list-disc space-y-1 pl-4">
              <li>Creating or editing a recipe never changes stock.</li>
              <li>When the linked menu item is billed and paid in POS, its ingredients are deducted from the issue store.</li>
              <li>Batch prep, staff meals or banquets can be recorded with &ldquo;Record Consumption&rdquo;.</li>
            </ul>
          </section>
        </aside>
      </div>
    </Drawer>
  );
}
