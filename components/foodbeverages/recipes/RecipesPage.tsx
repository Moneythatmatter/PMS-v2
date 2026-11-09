"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ChefHat,
  Clock,
  Link2,
  Plus,
  RefreshCw,
  Scale,
  Tag,
  UtensilsCrossed,
  Warehouse,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { AlertBanner, FormField, SelectInput } from "@/components/frontoffice/ui";
import { ConfirmModal } from "@/components/frontoffice/ui/Modal";
import { OperationsFilterDrawer, OperationsToolbar } from "@/components/housekeeping/OperationsToolbar";
import { ProcurementSummaryRow } from "@/components/purchase-stores/ui/ProcurementFormParts";
import { MODULE_REQUISITION_CONFIG } from "@/components/requisitions/moduleRequisitionConfig";
import { formatMoney, formatQty } from "@/components/requisitions/requisitionUi";
import { usePsList } from "@/hooks/usePsResource";
import {
  psCategoryService,
  psProductService,
  psStockBalanceService,
  psWarehouseService,
} from "@/services/purchase-stores/index";
import {
  conversionItemService,
  ingredientService,
  menuCategoryService,
  menuItemService,
  recipeService,
} from "@/services/food-beverages";
import type { ProductItem } from "@/app/data/productMasterData";
import type { FbIngredient } from "@/app/data/foodbeverages/conversions";
import { yieldUnitLabel, type Recipe } from "@/app/data/foodbeverages/recipes";
import { RecipeFormDrawer } from "./RecipeFormDrawer";
import { RecipeConsumeModal } from "./RecipeConsumeModal";

export type MenuItemOption = { id: string; name: string; price: number; categoryId: string | null; status?: string };
export type MenuCategoryOption = { id: string; name: string; status?: string };

type Tab = "recipes" | "log";
type StatusTab = "all" | "active" | "inactive";

const norm = (v: string) => v.trim().toLowerCase();

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value || "—";
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  tone: "slate" | "amber" | "emerald" | "sky" | "red";
}) {
  const tones = {
    slate: "bg-slate-50 text-slate-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-700",
    sky: "bg-sky-50 text-sky-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 shadow-2xs">
      <div className="min-w-0">
        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <h3 className="text-lg font-extrabold leading-tight text-slate-800">{value}</h3>
      </div>
      <div className={cn("shrink-0 rounded-lg p-2", tones[tone])}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
  );
}

function DetailSection({ title, meta, children }: { title: string; meta?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {meta}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-500",
      )}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function ingredientsSummary(recipe: Recipe) {
  if (recipe.ingredients.length === 0) return "No ingredients";
  const [first, ...rest] = recipe.ingredients;
  return rest.length ? `${first.materialName} +${rest.length} more` : first.materialName;
}

export function RecipesPage() {
  const recipes = usePsList(() => recipeService.list(), []);
  const consumptions = usePsList(() => recipeService.consumptions(), []);
  const products = usePsList(() => psProductService.list(), []);
  const conversionItems = usePsList(() => conversionItemService.list(), []);
  const ingredients = usePsList(() => ingredientService.list() as Promise<FbIngredient[]>, []);
  const categories = usePsList(() => psCategoryService.list(), []);
  const balances = usePsList(() => psStockBalanceService.list(), []);
  const warehouses = usePsList(() => psWarehouseService.list(), []);
  const menuItems = usePsList(() => menuItemService.list() as Promise<MenuItemOption[]>, []);
  const menuCategories = usePsList(() => menuCategoryService.list() as Promise<MenuCategoryOption[]>, []);

  const [tab, setTab] = useState<Tab>("recipes");
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [linkFilter, setLinkFilter] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" | "info" } | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [editing, setEditing] = useState<Recipe | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [consuming, setConsuming] = useState<Recipe | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Recipe | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = recipes.data;
  const selected = rows.find((r) => r.id === selectedId) ?? null;

  const fbCategoryNames = useMemo(() => {
    const wanted = new Set(MODULE_REQUISITION_CONFIG.foodBeverage.categoryDepartments.map(norm));
    return new Set(categories.data.filter((c) => wanted.has(norm(c.department ?? ""))).map((c) => c.categoryName));
  }, [categories.data]);

  const preferredFbCategory = useMemo(() => {
    const names = [...fbCategoryNames];
    return names.find((n) => /kitchen|grocer|food/i.test(n)) ?? names[0] ?? "Kitchen Groceries";
  }, [fbCategoryNames]);

  const rawKitchenIngredients = useMemo(
    () =>
      ingredients.data.filter(
        (i) =>
          String(i.kind ?? "raw").toLowerCase() !== "prepared" &&
          String(i.status ?? "Active").toLowerCase() !== "inactive",
      ),
    [ingredients.data],
  );

  const syncingKitchenRef = useRef(false);
  const ensureKitchenProductsInPs = useCallback(async () => {
    if (syncingKitchenRef.current || rawKitchenIngredients.length === 0) return;
    syncingKitchenRef.current = true;
    try {
      const byCode = new Map(products.data.map((p) => [norm(p.productCode), p]));
      const byName = new Map(products.data.map((p) => [norm(p.productName), p]));
      let changed = false;

      for (const ing of rawKitchenIngredients) {
        const codeKey = norm(ing.code ?? "");
        const nameKey = norm(ing.name);
        const match = (codeKey ? byCode.get(codeKey) : undefined) ?? byName.get(nameKey);

        if (match) {
          const needsCategory = preferredFbCategory && !fbCategoryNames.has(match.category);
          const needsUnit = !(match.unit || "").trim() && !!(ing.uom || "").trim();
          const needsActive = String(match.status ?? "Active") === "Inactive";
          if (needsCategory || needsUnit || needsActive) {
            await psProductService.update(match.id, {
              ...(needsCategory ? { category: preferredFbCategory } : {}),
              ...(needsUnit ? { unit: String(ing.uom).trim() } : {}),
              ...(needsActive ? { status: "Active" } : {}),
            });
            changed = true;
          }
          continue;
        }

        const created = await psProductService.create({
          productCode: (ing.code || "").trim() || `ING-${ing.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`,
          productName: ing.name,
          category: preferredFbCategory,
          unit: (ing.uom || "Kg").trim() || "Kg",
          minimumStock: 0,
          maximumStock: 0,
          parStock: 0,
          reorderLevel: Number(ing.reorder) || 0,
          storageType: "Dry Storage",
          status: "Active",
          createdDate: new Date().toISOString().slice(0, 10),
          description: "Synced from F&B Ingredients",
        });
        byCode.set(norm(created.productCode), created);
        byName.set(norm(created.productName), created);
        changed = true;
      }

      if (changed) await products.reload();
    } finally {
      syncingKitchenRef.current = false;
    }
  }, [rawKitchenIngredients, products.data, preferredFbCategory, fbCategoryNames, products]);

  useEffect(() => {
    if (ingredients.loading || products.loading || categories.loading) return;
    void ensureKitchenProductsInPs();
  }, [ingredients.loading, products.loading, categories.loading, rawKitchenIngredients.length, ensureKitchenProductsInPs]);

  /** PS product ids that map to F&B Inventory → Ingredients (raw). */
  const kitchenMaterialIds = useMemo(() => {
    const byCode = new Map(products.data.map((p) => [norm(p.productCode), p.id]));
    const byName = new Map(products.data.map((p) => [norm(p.productName), p.id]));
    const ids = new Set<string>();
    for (const ing of rawKitchenIngredients) {
      const id = (ing.code ? byCode.get(norm(ing.code)) : undefined) ?? byName.get(norm(ing.name));
      if (id) ids.add(id);
    }
    return ids;
  }, [products.data, rawKitchenIngredients]);

  /** Prefer F&B ingredient on-hand when the material is a kitchen raw item. */
  const fbOnHandByMaterialId = useMemo(() => {
    const byCode = new Map(products.data.map((p) => [norm(p.productCode), p.id]));
    const byName = new Map(products.data.map((p) => [norm(p.productName), p.id]));
    const map = new Map<string, number>();
    for (const ing of rawKitchenIngredients) {
      const id = (ing.code ? byCode.get(norm(ing.code)) : undefined) ?? byName.get(norm(ing.name));
      if (id) map.set(id, Number(ing.onHand) || 0);
    }
    return map;
  }, [products.data, rawKitchenIngredients]);

  const { avgCostByMaterial, onHandByStore } = useMemo(() => {
    const value = new Map<string, { qty: number; value: number; lastRate: number }>();
    const onHand = new Map<string, number>();
    for (const b of balances.data) {
      const qty = Number(b.quantity) || 0;
      const rate = Number(b.averageCost) || 0;
      const entry = value.get(b.materialId) ?? { qty: 0, value: 0, lastRate: 0 };
      if (qty > 0) {
        entry.qty += qty;
        entry.value += qty * rate;
      }
      entry.lastRate = Math.max(entry.lastRate, rate);
      value.set(b.materialId, entry);
      const key = `${b.materialId}|${b.warehouseId}`;
      onHand.set(key, (onHand.get(key) ?? 0) + qty);
    }
    const avg = new Map<string, number>();
    for (const [id, e] of value) avg.set(id, e.qty > 0 ? e.value / e.qty : e.lastRate);
    return { avgCostByMaterial: avg, onHandByStore: onHand };
  }, [balances.data]);

  const defaultStoreId = useMemo(() => {
    const active = warehouses.data.filter((w) => w.status !== "Inactive");
    return (active.find((w) => /kitchen/i.test(w.name)) ?? active[0])?.id ?? "";
  }, [warehouses.data]);

  /** Converted items as recipe-pickable materials (linked PS products). */
  const convertedProducts = useMemo((): ProductItem[] => {
    const productById = new Map(products.data.map((p) => [p.id, p]));
    const out: ProductItem[] = [];
    for (const item of conversionItems.data) {
      if (item.status !== "Active" || !item.psProductId) continue;
      const existing = productById.get(item.psProductId);
      if (existing) {
        out.push(existing);
        continue;
      }
      out.push({
        id: item.psProductId,
        productCode: item.code || item.psProductId,
        productName: item.name,
        category: "Prepared Item",
        unit: item.yieldUom || "Kg",
        minimumStock: 0,
        maximumStock: 0,
        parStock: 0,
        reorderLevel: 0,
        storageType: "Cold Room",
        status: "Active",
        createdDate: item.createdAt?.slice(0, 10) || "",
      });
    }
    return out;
  }, [conversionItems.data, products.data]);

  const warehouseName = useMemo(() => new Map(warehouses.data.map((w) => [w.id, w.name])), [warehouses.data]);
  const recipeById = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);
  const linkedMenuItemIds = useMemo(
    () => new Set(rows.map((r) => r.menuItemId).filter((id): id is string => Boolean(id))),
    [rows],
  );
  const activeMenuItems = useMemo(() => menuItems.data.filter((m) => m.status !== "Inactive"), [menuItems.data]);

  const statusCounts = useMemo(
    () => ({
      all: rows.length,
      active: rows.filter((r) => r.isActive).length,
      inactive: rows.filter((r) => !r.isActive).length,
    }),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const q = norm(search);
    return rows.filter((r) => {
      if (statusTab === "active" && !r.isActive) return false;
      if (statusTab === "inactive" && r.isActive) return false;
      if (categoryFilter !== "all" && r.categoryId !== categoryFilter) return false;
      if (linkFilter === "linked" && !r.menuItemId) return false;
      if (linkFilter === "unlinked" && r.menuItemId) return false;
      if (!q) return true;
      return [r.name, r.recipeCode, r.categoryName, r.menuItemName]
        .concat(r.ingredients.map((i) => i.materialName))
        .some((v) => norm(v ?? "").includes(q));
    });
  }, [rows, search, statusTab, categoryFilter, linkFilter]);

  const kpis = useMemo(() => {
    const active = rows.filter((r) => r.isActive);
    const withCost = active.filter((r) => r.costPerPortion > 0);
    const avgPrepCost = withCost.length
      ? withCost.reduce((s, r) => s + r.costPerPortion, 0) / withCost.length
      : 0;
    return {
      active: active.length,
      linked: active.filter((r) => r.menuItemId).length,
      unlinkedMenu: activeMenuItems.filter((m) => !linkedMenuItemIds.has(m.id)).length,
      avgPrepCost,
      uncosted: active.filter((r) => r.ingredients.some((i) => i.unitCost === 0)).length,
    };
  }, [rows, activeMenuItems, linkedMenuItemIds]);

  const activeFilterCount = Number(categoryFilter !== "all") + Number(linkFilter !== "all");
  const loading = recipes.loading && rows.length === 0;

  const refresh = async () => {
    await Promise.all([recipes.reload(), consumptions.reload(), balances.reload()]);
  };

  const openCreate = async () => {
    setBusy(true);
    try {
      await ensureKitchenProductsInPs();
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Could not sync kitchen ingredients", variant: "error" });
    } finally {
      setBusy(false);
    }
    setEditing(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const openEdit = async (recipe: Recipe) => {
    setBusy(true);
    try {
      await ensureKitchenProductsInPs();
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Could not sync kitchen ingredients", variant: "error" });
    } finally {
      setBusy(false);
    }
    setEditing(recipe);
    setFormKey((k) => k + 1);
    setSelectedId(null);
    setFormOpen(true);
  };

  const handleSaved = async (recipe: Recipe, message: string) => {
    setFormOpen(false);
    setToast({ message, variant: "success" });
    await recipes.reload();
    setSelectedId(recipe.id);
  };

  const runAction = async (fn: () => Promise<unknown>, message: string) => {
    setBusy(true);
    try {
      await fn();
      setToast({ message, variant: "success" });
      await refresh();
      return true;
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Action failed", variant: "error" });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "recipes", label: `Recipes (${rows.length})` },
    { id: "log", label: `Consumption Log (${consumptions.data.length})` },
  ];

  const selectedConsumptions = selected ? consumptions.data.filter((c) => c.recipeId === selected.id).slice(0, 6) : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Food &amp; Beverage · Menu</span>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-800">Recipes</h1>
          <p className="text-xs text-slate-500">
            Recipe cards from kitchen ingredients and converted items, with yield and live food cost.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refresh} className="h-8 gap-1.5 rounded-xl px-3 text-xs font-bold">
            <RefreshCw className={cn("h-3.5 w-3.5", recipes.loading && "animate-spin")} /> Refresh
          </Button>
          <Button
            onClick={openCreate}
            className="flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-xl !bg-[#0F8A5F] px-3.5 text-xs font-bold text-white shadow-xs hover:!bg-[#0d7d56]"
          >
            <Plus className="h-3.5 w-3.5" /> New Recipe
          </Button>
        </div>
      </div>

      {toast && <AlertBanner variant={toast.variant} message={toast.message} onDismiss={() => setToast(null)} />}
      {recipes.error && <AlertBanner variant="error" message={`Could not load recipes: ${recipes.error}`} />}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Active Recipes" value={String(kpis.active)} icon={ChefHat} tone="emerald" />
        <KpiCard label="Linked to Menu" value={String(kpis.linked)} icon={Link2} tone="sky" />
        <KpiCard label="Menu Items w/o Recipe" value={String(kpis.unlinkedMenu)} icon={UtensilsCrossed} tone="slate" />
        <KpiCard label="Avg Prep Cost" value={formatMoney(kpis.avgPrepCost)} icon={Scale} tone="emerald" />
        <KpiCard label="Missing Stock Cost" value={String(kpis.uncosted)} icon={AlertTriangle} tone="amber" />
      </div>

      <div className="border-b border-slate-200">
        <nav className="flex gap-4 overflow-x-auto text-xs font-bold uppercase tracking-wider" aria-label="Recipe views">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "whitespace-nowrap border-b-2 px-0.5 pb-2.5 transition-all",
                tab === t.id
                  ? "border-emerald-700 font-extrabold text-emerald-800"
                  : "border-transparent text-slate-500 hover:text-slate-800",
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === "recipes" && (
        <div className="space-y-3">
          <OperationsToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search recipe, code, menu item or ingredient…"
            activeFilterCount={activeFilterCount}
            onOpenFilters={() => setFiltersOpen(true)}
            statusTabs={[
              { id: "all", label: "All", count: statusCounts.all },
              { id: "active", label: "Active", count: statusCounts.active },
              { id: "inactive", label: "Inactive", count: statusCounts.inactive },
            ]}
            activeStatusTab={statusTab}
            onStatusTabChange={(id) => setStatusTab(id as StatusTab)}
          />

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full min-w-[1080px] border-collapse text-left text-xs">
              <thead>
                <tr className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-2.5">Recipe</th>
                  <th className="px-3 py-2.5">Category</th>
                  <th className="px-3 py-2.5">Menu Item</th>
                  <th className="px-3 py-2.5">Yield</th>
                  <th className="px-3 py-2.5">Ingredients</th>
                  <th className="px-3 py-2.5 text-right">Prep Cost</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="w-16 px-3 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-12 text-center text-sm font-medium text-slate-400">
                      Loading recipes…
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-12 text-center">
                      <ChefHat className="mx-auto h-7 w-7 text-slate-300" />
                      <p className="mt-2 text-sm font-semibold text-slate-600">
                        {rows.length === 0 ? "No recipes yet" : "No recipes match these filters"}
                      </p>
                      <p className="text-xs font-normal text-slate-400">
                        {rows.length === 0
                          ? "Create one from Purchase & Stores materials. Link it to a menu item so sales deduct stock."
                          : "Try another status tab or clear the filters."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((r) => (
                    <tr key={r.id} onClick={() => setSelectedId(r.id)} className="cursor-pointer transition-colors hover:bg-slate-50/60">
                      <td className="px-3 py-2.5">
                        <p className="font-bold text-slate-900">{r.name}</p>
                        <p className="font-mono text-[10px] font-medium text-slate-400">{r.recipeCode}</p>
                      </td>
                      <td className="px-3 py-2.5">{r.categoryName || <span className="text-slate-300">—</span>}</td>
                      <td className="px-3 py-2.5">
                        {r.menuItemName ? (
                          <span className="inline-flex items-center gap-1 text-sky-700">
                            <Link2 className="h-3 w-3" /> {r.menuItemName}
                          </span>
                        ) : (
                          <span className="font-medium text-slate-400">Not linked</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        {formatQty(r.yieldQuantity)} {r.yieldUnit}
                      </td>
                      <td className="max-w-[220px] truncate px-3 py-2.5" title={r.ingredients.map((i) => i.materialName).join(", ")}>
                        {ingredientsSummary(r)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-extrabold text-slate-900">{formatMoney(r.costPerPortion)}</td>
                      <td className="px-3 py-2.5">
                        <StatusPill active={r.isActive} />
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <Button
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(r.id);
                          }}
                          className="h-6 rounded-md !border-slate-200 !bg-slate-100 px-1.5 text-[10px] font-bold hover:!bg-slate-200"
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <OperationsFilterDrawer
            open={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            title="Filter Recipes"
            activeFilterCount={activeFilterCount}
            onReset={() => {
              setCategoryFilter("all");
              setLinkFilter("all");
            }}
          >
            <FormField label="Category">
              <SelectInput value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="block">
                <option value="all">All categories</option>
                {menuCategories.data.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </SelectInput>
            </FormField>
            <FormField label="Menu link">
              <SelectInput value={linkFilter} onChange={(e) => setLinkFilter(e.target.value)} className="block">
                <option value="all">All recipes</option>
                <option value="linked">Linked to a menu item</option>
                <option value="unlinked">Not linked</option>
              </SelectInput>
            </FormField>
          </OperationsFilterDrawer>
        </div>
      )}

      {tab === "log" && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">
            Every stock deduction made by a recipe — settled POS orders and manual entries. Each row is also in the Purchase &amp;
            Stores stock ledger as &ldquo;Recipe Consumption&rdquo;.
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full min-w-[900px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-2.5">Consumption</th>
                  <th className="px-3 py-2.5">Recipe</th>
                  <th className="px-3 py-2.5">Source</th>
                  <th className="px-3 py-2.5 text-right">Qty</th>
                  <th className="px-3 py-2.5">Store</th>
                  <th className="px-3 py-2.5">Materials</th>
                  <th className="px-3 py-2.5 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {consumptions.data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-12 text-center text-sm font-medium text-slate-400">
                      {consumptions.loading ? "Loading…" : "No stock has been consumed by recipes yet."}
                    </td>
                  </tr>
                ) : (
                  consumptions.data.map((c) => {
                    const recipe = recipeById.get(c.recipeId);
                    return (
                      <tr key={c.id}>
                        <td className="px-3 py-2.5">
                          <p className="font-mono text-[11px] font-extrabold text-emerald-800">{c.consumptionNo}</p>
                          <p className="text-[10px] font-medium text-slate-400">{formatDateTime(c.consumedAt)}</p>
                        </td>
                        <td className="px-3 py-2.5 text-slate-900">{recipe?.name ?? "Deleted recipe"}</td>
                        <td className="px-3 py-2.5">
                          <span
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[10px] font-bold",
                              c.sourceType === "POS Sale" ? "bg-sky-50 text-sky-700" : "bg-violet-50 text-violet-700",
                            )}
                          >
                            {c.sourceType}
                          </span>
                          {c.sourceRef && (
                            <p className="mt-0.5 max-w-[180px] truncate text-[10px] font-medium text-slate-400" title={c.sourceRef}>
                              {c.sourceRef}
                            </p>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right">
                          {formatQty(c.portions)} <span className="text-[10px] text-slate-400">{recipe?.yieldUnit ?? ""}</span>
                        </td>
                        <td className="px-3 py-2.5">{warehouseName.get(c.warehouseId) ?? "—"}</td>
                        <td
                          className="max-w-[240px] truncate px-3 py-2.5 font-medium"
                          title={c.lines.map((l) => `${l.materialName} ${formatQty(l.quantity)} ${l.stockUnit}`).join(", ")}
                        >
                          {c.lines.map((l) => `${l.materialName} ${formatQty(l.quantity)} ${l.stockUnit}`).join(", ") || "—"}
                        </td>
                        <td className="px-3 py-2.5 text-right font-extrabold text-slate-900">{formatMoney(c.totalCost)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {formOpen && (
        <RecipeFormDrawer
          key={formKey}
          open={formOpen}
          onClose={() => setFormOpen(false)}
          initial={editing}
          products={products.data}
          convertedProducts={convertedProducts}
          kitchenMaterialIds={kitchenMaterialIds}
          fbOnHandByMaterialId={fbOnHandByMaterialId}
          fbCategoryNames={fbCategoryNames}
          avgCostByMaterial={avgCostByMaterial}
          onHandByStore={onHandByStore}
          warehouses={warehouses.data}
          menuItems={activeMenuItems}
          menuCategories={menuCategories.data}
          linkedMenuItemIds={linkedMenuItemIds}
          defaultStoreId={defaultStoreId}
          onSaved={handleSaved}
        />
      )}

      {selected && (
        <Drawer
          open
          onClose={() => setSelectedId(null)}
          side="bottom"
          title={selected.name}
          customHeader={
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                <ChefHat className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id="drawer-title" className="text-base font-bold text-slate-900 sm:text-lg">
                    {selected.name}
                  </h2>
                  <StatusPill active={selected.isActive} />
                </div>
                <p className="truncate text-xs text-slate-500">
                  <span className="font-mono">{selected.recipeCode}</span>
                  {selected.categoryName && ` · ${selected.categoryName}`}
                  {selected.menuItemName ? ` · sold as ${selected.menuItemName}` : " · not linked to a menu item"}
                </p>
              </div>
            </div>
          }
          footer={
            <div className="flex w-full flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                <strong className="text-slate-800">{selected.ingredients.length}</strong> ingredient
                {selected.ingredients.length === 1 ? "" : "s"} · prep cost{" "}
                <strong className="text-slate-800">{formatMoney(selected.costPerPortion)}</strong>
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => setSelectedId(null)}>
                  Close
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setConfirmDelete(selected)}
                  disabled={busy}
                  className="!text-red-600 hover:!bg-red-50"
                >
                  Delete
                </Button>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    runAction(
                      () => recipeService.update(selected.id, { isActive: !selected.isActive }),
                      `${selected.name} marked ${selected.isActive ? "inactive" : "active"}.`,
                    )
                  }
                >
                  {selected.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button variant="outline" onClick={() => openEdit(selected)} disabled={busy}>
                  Edit
                </Button>
                <Button
                  onClick={() => setConsuming(selected)}
                  disabled={busy || !selected.isActive || selected.ingredients.length === 0}
                  className="!bg-emerald-700 text-white hover:!bg-emerald-800"
                >
                  Record Consumption
                </Button>
              </div>
            </div>
          }
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-5">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Prep Cost / {yieldUnitLabel(selected.yieldUnit)}
                </p>
                <p className="text-lg font-extrabold text-slate-900">{formatMoney(selected.costPerPortion)}</p>
              </div>

              <DetailSection
                title="Ingredients"
                meta={
                  <span className="text-xs text-slate-500">
                    Per batch of {formatQty(selected.yieldQuantity)} {selected.yieldUnit.toLowerCase()}
                  </span>
                }
              >
                <div className="-m-4 overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-2">Material</th>
                        <th className="px-4 py-2 text-right">Recipe Qty</th>
                        <th className="px-4 py-2 text-right">Draws from Stock</th>
                        <th className="px-4 py-2 text-right">In Issue Store</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selected.ingredients.map((i) => {
                        const onHand = i.onHandIssueStore ?? onHandByStore.get(`${i.materialId}|${defaultStoreId}`) ?? 0;
                        return (
                          <tr key={i.id}>
                            <td className="px-4 py-2.5">
                              <p className="font-medium text-slate-900">{i.materialName}</p>
                              <p className="text-xs text-slate-500">{[i.productCode, i.category].filter(Boolean).join(" · ")}</p>
                              {i.remarks && <p className="text-xs italic text-slate-400">{i.remarks}</p>}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2.5 text-right">
                              {formatQty(i.quantity)} <span className="text-xs text-slate-400">{i.unit}</span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-2.5 text-right font-medium">
                              {formatQty(i.grossStockQuantity)} <span className="text-xs text-slate-400">{i.stockUnit}</span>
                            </td>
                            <td
                              className={cn(
                                "whitespace-nowrap px-4 py-2.5 text-right",
                                onHand < i.grossStockQuantity ? "font-semibold text-red-600" : "text-slate-600",
                              )}
                            >
                              {formatQty(onHand)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </DetailSection>

              <DetailSection title="Instructions">
                <p className="whitespace-pre-line text-sm text-slate-700">
                  {selected.instructions || <span className="text-slate-400">No instructions written yet.</span>}
                </p>
                {selected.notes && (
                  <p className="mt-3 whitespace-pre-line rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">{selected.notes}</p>
                )}
              </DetailSection>
            </div>

            <aside className="space-y-4">
              <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Summary</h3>
                <dl className="space-y-2.5 text-xs">
                  <ProcurementSummaryRow icon={<Tag className="h-3.5 w-3.5" />} label="Category" value={selected.categoryName} />
                  <ProcurementSummaryRow
                    icon={<UtensilsCrossed className="h-3.5 w-3.5" />}
                    label="Menu item"
                    value={selected.menuItemName || undefined}
                  />
                  <ProcurementSummaryRow
                    icon={<Scale className="h-3.5 w-3.5" />}
                    label="Yield"
                    value={`${formatQty(selected.yieldQuantity)} ${selected.yieldUnit}`}
                  />
                  <ProcurementSummaryRow
                    icon={<Clock className="h-3.5 w-3.5" />}
                    label="Prep time"
                    value={selected.prepTimeMinutes != null ? `${selected.prepTimeMinutes} min` : undefined}
                  />
                  <ProcurementSummaryRow
                    icon={<Warehouse className="h-3.5 w-3.5" />}
                    label="Issue store"
                    value={selected.issueWarehouseName || warehouseName.get(defaultStoreId) || "Default kitchen store"}
                  />
                </dl>
              </section>
              <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Recent consumption</h3>
                {selectedConsumptions.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No stock deducted yet.{" "}
                    {selected.menuItemName
                      ? `It happens when ${selected.menuItemName} is billed and paid in POS.`
                      : "Link a menu item so POS sales deduct stock."}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {selectedConsumptions.map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-2 text-xs">
                        <span className="min-w-0">
                          <span className="block font-semibold text-slate-800">
                            {formatQty(c.portions)} {selected.yieldUnit.toLowerCase()} · {c.sourceType}
                          </span>
                          <span className="block text-slate-400">{formatDateTime(c.consumedAt)}</span>
                        </span>
                        <span className="shrink-0 font-semibold text-slate-700">{formatMoney(c.totalCost)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </aside>
          </div>
        </Drawer>
      )}

      {consuming && (
        <RecipeConsumeModal
          recipe={consuming}
          warehouses={warehouses.data}
          onHandByStore={onHandByStore}
          defaultStoreId={defaultStoreId}
          onClose={() => setConsuming(null)}
          onDone={async (row) => {
            setConsuming(null);
            setToast({
              message: `${row.consumptionNo}: ${formatQty(row.portions)} ${consuming.yieldUnit.toLowerCase()} of ${consuming.name} deducted (${formatMoney(row.totalCost)}).`,
              variant: "success",
            });
            await refresh();
          }}
        />
      )}

      <ConfirmModal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (!confirmDelete) return;
          const ok = await runAction(() => recipeService.remove(confirmDelete.id), `${confirmDelete.name} deleted.`);
          setConfirmDelete(null);
          if (ok) setSelectedId(null);
        }}
        loading={busy}
        variant="danger"
        title="Delete recipe?"
        message={`${confirmDelete?.name ?? ""} and its ingredient lines will be removed. Materials in Purchase & Stores and stock are not affected.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
