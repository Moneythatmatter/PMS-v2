"use client";

import React, { useMemo, useState } from "react";
import { ChefHat, Clock, Info, Scale, UtensilsCrossed, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { FormField, SelectInput, TextAreaInput, TextInput } from "@/components/frontoffice/ui";
import { ProcurementFormSection, ProcurementSummaryRow } from "@/components/purchase-stores/ui/ProcurementFormParts";
import type { ProductItem } from "@/app/data/productMasterData";
import type { WarehouseMasterItem } from "@/app/data/warehouseMasterData";
import {
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

export function RecipeFormDrawer({
  open,
  onClose,
  initial,
  products,
  convertedProducts = [],
  kitchenMaterialIds,
  fbOnHandByMaterialId,
  fbCategoryNames,
  avgCostByMaterial: _avgCostByMaterial,
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
  /** Prepared conversion items exposed as PS materials for the recipe picker. */
  convertedProducts?: ProductItem[];
  /** PS product ids linked to F&B Inventory → Ingredients (raw kitchen materials). */
  kitchenMaterialIds?: Set<string>;
  /** On-hand from F&B Ingredients for those kitchen materials. */
  fbOnHandByMaterialId?: Map<string, number>;
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
  const kitchenIds = useMemo(() => kitchenMaterialIds ?? new Set<string>(), [kitchenMaterialIds]);
  const fbOnHand = useMemo(() => fbOnHandByMaterialId ?? new Map<string, number>(), [fbOnHandByMaterialId]);
  const allProducts = useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p]));
    for (const p of convertedProducts) {
      if (!byId.has(p.id)) byId.set(p.id, p);
    }
    return [...byId.values()];
  }, [products, convertedProducts]);
  const productById = useMemo(() => new Map(allProducts.map((p) => [p.id, p])), [allProducts]);
  const convertedIds = useMemo(() => new Set(convertedProducts.map((p) => p.id)), [convertedProducts]);
  const menuItemById = useMemo(() => new Map(menuItems.map((m) => [m.id, m])), [menuItems]);
  const [name, setName] = useState(initial?.name ?? "");
  const [menuItemId, setMenuItemId] = useState(initial?.menuItemId ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [yieldQuantity, setYieldQuantity] = useState(initial ? String(initial.yieldQuantity) : "1");
  const [yieldUnit, setYieldUnit] = useState(initial?.yieldUnit ?? "Portions");
  const [prepCost, setPrepCost] = useState(initial ? String(initial.costPerPortion || "") : "");
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
        remarks: i.remarks,
      })) ?? [],
  );
  const [showAllMaterials, setShowAllMaterials] = useState(fbCategoryNames.size === 0);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const yieldQty = Number(yieldQuantity) || 0;
  const prepCostValue = Number(prepCost) || 0;

  const materialOnHand = (materialId: string): number | null => {
    if (fbOnHand.has(materialId)) return fbOnHand.get(materialId) ?? 0;
    if (!storeId) return null;
    return onHandByStore.get(`${materialId}|${storeId}`) ?? 0;
  };

  const computed = useMemo(
    () =>
      lines.map((l) => {
        const product = productById.get(l.materialId);
        const factor = product ? unitConversionFactor(l.unit, product.unit) : null;
        const stockQty = factor === null ? 0 : (Number(l.quantity) || 0) * factor;
        const gross = grossStockQuantity(stockQty, 0, 0);
        const onHand = materialOnHand(l.materialId);
        return { line: l, product, factor, gross, unitCost: 0, cost: 0, onHand };
      }),
    [lines, productById, onHandByStore, storeId, fbOnHand],
  );

  const pickable = useMemo(() => {
    const chosen = new Set(lines.map((l) => l.materialId));
    const active = allProducts.filter((p) => p.status !== "Inactive" && !chosen.has(p.id));
    const converted = active.filter((p) => convertedIds.has(p.id));
    const raw = active.filter((p) => !convertedIds.has(p.id));
    const isKitchen = (p: ProductItem) => fbCategoryNames.has(p.category) || kitchenIds.has(p.id);
    return {
      converted,
      own: raw.filter(isKitchen),
      other: showAllMaterials ? raw.filter((p) => !isKitchen(p)) : [],
    };
  }, [allProducts, lines, fbCategoryNames, showAllMaterials, convertedIds, kitchenIds]);

  const availableMenuItems = menuItems.filter((m) => m.id === initial?.menuItemId || !linkedMenuItemIds.has(m.id));

  const handleMenuItem = (id: string) => {
    const prev = menuItemById.get(menuItemId);
    const next = menuItemById.get(id);
    setMenuItemId(id);
    if (!next) return;
    if (!name.trim() || name === prev?.name) setName(next.name);
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
        remarks: "",
      },
    ]);
  };

  const updateLine = (key: string, field: "quantity" | "unit" | "remarks", value: string) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, [field]: value } : l)));

  const removeLine = (key: string) => setLines((prev) => prev.filter((l) => l.key !== key));

  const save = async () => {
    const problems = [
      !name.trim() && "Enter the recipe name.",
      !(yieldQty > 0) && "Yield must be greater than 0.",
      (prepCost === "" || Number.isNaN(Number(prepCost))) && "Enter the prep cost per portion.",
      prepCostValue < 0 && "Prep cost cannot be negative.",
      lines.length === 0 && "Add at least one ingredient from the material master.",
      ...computed.map((c) => {
        const label = c.product?.productName ?? "An ingredient";
        if (!(Number(c.line.quantity) > 0)) return `${label}: enter a quantity greater than 0.`;
        if (c.factor === null) return `${label}: ${c.line.unit} can't be converted to ${c.product?.unit}.`;
        return null;
      }),
    ].filter((p): p is string => Boolean(p));
    setErrors(problems);
    if (problems.length > 0) return;

    const payload: RecipeInput = {
      name: name.trim(),
      menuItemId: menuItemId || null,
      categoryId: categoryId || null,
      // Selling price lives on the menu item; prep cost is entered manually.
      sellingPrice: menuItemById.get(menuItemId)?.price ?? initial?.sellingPrice ?? 0,
      costPerPortion: prepCostValue,
      yieldQuantity: yieldQty,
      yieldUnit,
      wastagePercent: 0,
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
        wastagePercent: 0,
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
              Build the recipe from raw materials and converted items. Saving does not move any stock.
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            <strong className="text-slate-800">{lines.length}</strong> ingredient{lines.length === 1 ? "" : "s"}
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
              <FormField
                label={`Prep Cost (per ${yieldUnitLabel(yieldUnit).toLowerCase()})`}
                required
                helperText="Enter manually. This value is frozen on each order for the linked menu item."
              >
                <InputGroup prefix="₹" invalid={prepCost !== "" && prepCostValue < 0}>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    inputMode="decimal"
                    value={prepCost}
                    onChange={(e) => setPrepCost(e.target.value)}
                    placeholder="0"
                    className={GROUP_INPUT}
                    aria-label="Prep cost per portion"
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
            subtitle="Add raw materials and converted items (dough, gravy, batter). One batch’s quantities."
            action={
              fbCategoryNames.size > 0 ? <AllMaterialsSwitch checked={showAllMaterials} onChange={setShowAllMaterials} /> : null
            }
          >
            <RecipeIngredientsEditor
              rows={computed}
              pickGroups={[
                { label: "Converted / prepared items", items: pickable.converted },
                { label: "Food & Beverage materials", items: pickable.own },
                { label: "Other materials", items: pickable.other },
              ]}
              emptyPickerHint={
                pickable.own.length === 0 && pickable.converted.length === 0 && !showAllMaterials
                  ? "Add ingredients under Inventory → Ingredients, converted items under Menu → Conversion Items, or turn on “All materials”."
                  : "Add raw materials under Inventory → Ingredients, or converted items under Menu → Conversion Items."
              }
              onAdd={addMaterial}
              onUpdate={updateLine}
              onRemove={removeLine}
              onHandFor={materialOnHand}
              costFor={() => 0}
              storeName={storeName ?? "the issue store"}
              yieldQty={yieldQty}
              yieldUnit={yieldUnit}
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
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Summary</h3>
            <dl className="space-y-2.5 text-xs">
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
              <ProcurementSummaryRow
                icon={<Scale className="h-3.5 w-3.5" />}
                label="Prep cost"
                value={prepCost !== "" ? formatMoney(prepCostValue) : undefined}
              />
              <ProcurementSummaryRow icon={<Clock className="h-3.5 w-3.5" />} label="Prep time" value={prepTime ? `${prepTime} min` : undefined} />
              <ProcurementSummaryRow icon={<Warehouse className="h-3.5 w-3.5" />} label="Issue store" value={storeName ?? "Default kitchen store"} />
            </dl>
            <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
              Prep cost is frozen on each order when the linked menu item is ordered.
            </p>
          </section>
          <section className="rounded-xl border border-sky-100 bg-sky-50/60 p-4 text-xs text-sky-900">
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
              <Info className="h-4 w-4" /> When does stock move?
            </h3>
            <ul className="list-disc space-y-1 pl-4">
              <li>Creating or editing a recipe never changes stock.</li>
              <li>When the linked menu item is ordered (KOT sent), ingredients are deducted from the issue store and Ingredients on-hand stays in sync.</li>
              <li>The recipe must be linked to the menu item you sell — otherwise stock will not move.</li>
              <li>Batch prep, staff meals or banquets can be recorded with &ldquo;Record Consumption&rdquo;.</li>
            </ul>
          </section>
        </aside>
      </div>
    </Drawer>
  );
}
