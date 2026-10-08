"use client";

import React, { useMemo, useState } from "react";
import { AlertCircle, Layers, Link2, ListChecks, Pencil, Plus, RefreshCw, Trash2, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { AlertBanner, FormField, SelectInput } from "@/components/frontoffice/ui";
import { ConfirmModal } from "@/components/frontoffice/ui/Modal";
import { OperationsFilterDrawer, OperationsToolbar } from "@/components/housekeeping/OperationsToolbar";
import { formatMoney } from "@/components/requisitions/requisitionUi";
import { usePsList } from "@/hooks/usePsResource";
import { menuCategoryService, menuItemService, modifierGroupService } from "@/services/food-beverages";
import { ruleText, type ModifierGroup } from "@/app/data/foodbeverages/modifiers";
import { ModifierGroupFormDrawer, type MenuCategoryOption, type MenuItemOption } from "./ModifierGroupFormDrawer";

type Tab = "groups" | "items";
type StatusTab = "all" | "required" | "optional" | "inactive" | "unlinked";

const norm = (v: string) => v.trim().toLowerCase();

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  tone: "slate" | "amber" | "emerald" | "sky";
}) {
  const tones = {
    slate: "bg-slate-50 text-slate-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-700",
    sky: "bg-sky-50 text-sky-600",
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

function RuleBadges({ group }: { group: ModifierGroup }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
          group.isRequired ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600",
        )}
      >
        {group.isRequired ? "Required" : "Optional"}
      </span>
      <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-700">
        {group.selectionType}
      </span>
    </div>
  );
}

export function ModifiersPage() {
  const groups = usePsList(() => modifierGroupService.list(), []);
  const menuItems = usePsList(() => menuItemService.list() as Promise<MenuItemOption[]>, []);
  const menuCategories = usePsList(() => menuCategoryService.list() as Promise<MenuCategoryOption[]>, []);

  const [tab, setTab] = useState<Tab>("groups");
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectionFilter, setSelectionFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" | "info" } | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [editing, setEditing] = useState<ModifierGroup | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ModifierGroup | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = groups.data;
  const activeMenuItems = useMemo(() => menuItems.data.filter((m) => m.status !== "Inactive"), [menuItems.data]);
  const menuItemName = useMemo(() => new Map(menuItems.data.map((m) => [m.id, m.name])), [menuItems.data]);
  const categoryName = useMemo(() => new Map(menuCategories.data.map((c) => [c.id, c.name])), [menuCategories.data]);

  const counts = useMemo(
    () => ({
      all: rows.length,
      required: rows.filter((g) => g.isRequired).length,
      optional: rows.filter((g) => !g.isRequired).length,
      inactive: rows.filter((g) => g.status !== "Active").length,
      unlinked: rows.filter((g) => g.menuItemIds.length === 0).length,
    }),
    [rows],
  );

  const filteredGroups = useMemo(() => {
    const q = norm(search);
    return rows.filter((g) => {
      if (statusTab === "required" && !g.isRequired) return false;
      if (statusTab === "optional" && g.isRequired) return false;
      if (statusTab === "inactive" && g.status === "Active") return false;
      if (statusTab === "unlinked" && g.menuItemIds.length > 0) return false;
      if (selectionFilter !== "all" && g.selectionType !== selectionFilter) return false;
      if (!q) return true;
      return [g.name, g.code, g.description, ...g.options.map((o) => o.name), ...g.menuItemIds.map((id) => menuItemName.get(id) ?? "")]
        .some((v) => norm(v ?? "").includes(q));
    });
  }, [rows, search, statusTab, selectionFilter, menuItemName]);

  const groupsByItem = useMemo(() => {
    const map = new Map<string, ModifierGroup[]>();
    for (const g of rows) {
      for (const id of g.menuItemIds) map.set(id, [...(map.get(id) ?? []), g]);
    }
    return map;
  }, [rows]);

  const itemRows = useMemo(() => {
    const q = norm(search);
    return activeMenuItems
      .map((item) => ({ item, groups: groupsByItem.get(item.id) ?? [] }))
      .filter(({ item }) => categoryFilter === "all" || item.categoryId === categoryFilter)
      .filter(({ item, groups: g }) => !q || norm(item.name).includes(q) || g.some((x) => norm(x.name).includes(q)))
      .sort((a, b) => b.groups.length - a.groups.length || a.item.name.localeCompare(b.item.name));
  }, [activeMenuItems, groupsByItem, search, categoryFilter]);

  const kpis = useMemo(() => {
    const active = rows.filter((g) => g.status === "Active");
    const options = active.flatMap((g) => g.options.filter((o) => o.status === "Active"));
    const paid = options.filter((o) => o.price > 0);
    return {
      groups: active.length,
      options: options.length,
      required: active.filter((g) => g.isRequired).length,
      linkedItems: new Set(active.flatMap((g) => g.menuItemIds)).size,
      avgPrice: paid.length ? paid.reduce((s, o) => s + o.price, 0) / paid.length : 0,
    };
  }, [rows]);

  const openCreate = () => {
    setEditing(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };
  const openEdit = (group: ModifierGroup) => {
    setEditing(group);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const remove = async (group: ModifierGroup) => {
    setBusy(true);
    try {
      await modifierGroupService.remove(group.id);
      setToast({ message: `${group.name} deleted.`, variant: "success" });
      await groups.reload();
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Delete failed", variant: "error" });
    } finally {
      setBusy(false);
      setConfirmDelete(null);
    }
  };

  const loading = groups.loading && rows.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Food &amp; Beverage · Menu</span>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-800">Modifiers</h1>
          <p className="text-xs text-slate-500">
            Groups like Size, Sauce or Extra Toppings, with priced options and pick rules, attached to menu items.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => groups.reload()} className="h-8 gap-1.5 rounded-xl px-3 text-xs font-bold">
            <RefreshCw className={cn("h-3.5 w-3.5", groups.loading && "animate-spin")} /> Refresh
          </Button>
          <Button
            onClick={openCreate}
            className="flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-xl !bg-[#0F8A5F] px-3.5 text-xs font-bold text-white shadow-xs hover:!bg-[#0d7d56]"
          >
            <Plus className="h-3.5 w-3.5" /> New Modifier Group
          </Button>
        </div>
      </div>

      {toast && <AlertBanner variant={toast.variant} message={toast.message} onDismiss={() => setToast(null)} />}
      {groups.error && <AlertBanner variant="error" message={`Could not load modifier groups: ${groups.error}`} />}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Active Groups" value={String(kpis.groups)} icon={Layers} tone="emerald" />
        <KpiCard label="Active Options" value={String(kpis.options)} icon={ListChecks} tone="sky" />
        <KpiCard label="Required Groups" value={String(kpis.required)} icon={AlertCircle} tone="amber" />
        <KpiCard label="Items with Modifiers" value={String(kpis.linkedItems)} icon={UtensilsCrossed} tone="slate" />
        <KpiCard label="Avg Paid Add-on" value={formatMoney(kpis.avgPrice)} icon={Link2} tone="emerald" />
      </div>

      <div className="border-b border-slate-200">
        <nav className="flex gap-4 overflow-x-auto text-xs font-bold uppercase tracking-wider" aria-label="Modifier views">
          {(
            [
              { id: "groups", label: `Modifier Groups (${rows.length})` },
              { id: "items", label: `By Menu Item (${activeMenuItems.length})` },
            ] as const
          ).map((t) => (
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

      {tab === "groups" && (
        <div className="space-y-3">
          <OperationsToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search group, option or menu item…"
            activeFilterCount={Number(selectionFilter !== "all")}
            onOpenFilters={() => setFiltersOpen(true)}
            statusTabs={[
              { id: "all", label: "All", count: counts.all },
              { id: "required", label: "Required", count: counts.required },
              { id: "optional", label: "Optional", count: counts.optional },
              { id: "unlinked", label: "Not linked", count: counts.unlinked },
              { id: "inactive", label: "Inactive", count: counts.inactive },
            ]}
            activeStatusTab={statusTab}
            onStatusTabChange={(id) => setStatusTab(id as StatusTab)}
          />

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full min-w-[980px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-2.5">Group</th>
                  <th className="px-3 py-2.5">Rules</th>
                  <th className="px-3 py-2.5">Options</th>
                  <th className="px-3 py-2.5">Menu Items</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="w-24 px-3 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-12 text-center text-sm font-medium text-slate-400">
                      Loading modifier groups…
                    </td>
                  </tr>
                ) : filteredGroups.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-12 text-center">
                      <Layers className="mx-auto h-7 w-7 text-slate-300" />
                      <p className="mt-2 text-sm font-semibold text-slate-600">
                        {rows.length === 0 ? "No modifier groups yet" : "No groups match these filters"}
                      </p>
                      <p className="text-xs font-normal text-slate-400">
                        {rows.length === 0
                          ? "Create one — e.g. Pizza Size (required, single) or Extra Toppings (optional, up to 3)."
                          : "Try another tab or clear the search."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredGroups.map((g) => {
                    const linked = g.menuItemIds.map((id) => menuItemName.get(id)).filter(Boolean) as string[];
                    return (
                      <tr key={g.id} onClick={() => openEdit(g)} className="cursor-pointer transition-colors hover:bg-slate-50/60">
                        <td className="px-3 py-2.5">
                          <p className="font-bold text-slate-900">{g.name}</p>
                          <p className="max-w-[220px] truncate text-[10px] font-medium text-slate-400">
                            {[g.code, g.description].filter(Boolean).join(" · ") || "—"}
                          </p>
                        </td>
                        <td className="px-3 py-2.5">
                          <RuleBadges group={g} />
                          <p className="mt-1 text-[11px] font-medium text-slate-500">{ruleText(g)}</p>
                        </td>
                        <td className="max-w-[340px] px-3 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {g.options.slice(0, 5).map((o) => (
                              <span
                                key={o.id}
                                className={cn(
                                  "rounded-md border px-1.5 py-0.5 text-[11px] font-medium",
                                  o.status === "Active"
                                    ? "border-slate-200 bg-white text-slate-700"
                                    : "border-dashed border-slate-200 text-slate-400 line-through",
                                )}
                              >
                                {o.name}
                                <span className="ml-1 text-emerald-700">{o.price > 0 ? `+${formatMoney(o.price)}` : "free"}</span>
                              </span>
                            ))}
                            {g.options.length > 5 && (
                              <span className="px-1 py-0.5 text-[11px] text-slate-400">+{g.options.length - 5} more</span>
                            )}
                          </div>
                        </td>
                        <td className="max-w-[240px] px-3 py-2.5">
                          {linked.length === 0 ? (
                            <span className="font-medium text-amber-600">Not linked — won&apos;t show in POS</span>
                          ) : (
                            <span className="block truncate" title={linked.join(", ")}>
                              {linked.slice(0, 2).join(", ")}
                              {linked.length > 2 && <span className="text-slate-400"> +{linked.length - 2} more</span>}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                              g.status === "Active"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-100 text-slate-500",
                            )}
                          >
                            {g.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEdit(g);
                              }}
                              className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                              aria-label={`Edit ${g.name}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDelete(g);
                              }}
                              className="rounded-md p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                              aria-label={`Delete ${g.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "items" && (
        <div className="space-y-3">
          <OperationsToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search menu item or group…"
            activeFilterCount={Number(categoryFilter !== "all")}
            onOpenFilters={() => setFiltersOpen(true)}
          />
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full min-w-[760px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-2.5">Menu Item</th>
                  <th className="px-3 py-2.5">Category</th>
                  <th className="px-3 py-2.5 text-right">Base Price</th>
                  <th className="px-3 py-2.5">Modifier Groups (in POS order)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {itemRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-12 text-center text-sm font-medium text-slate-400">
                      {menuItems.loading ? "Loading menu items…" : "No menu items match."}
                    </td>
                  </tr>
                ) : (
                  itemRows.map(({ item, groups: g }) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2.5 font-bold text-slate-900">{item.name}</td>
                      <td className="px-3 py-2.5">{(item.categoryId && categoryName.get(item.categoryId)) || "—"}</td>
                      <td className="px-3 py-2.5 text-right">{formatMoney(Number(item.price) || 0)}</td>
                      <td className="px-3 py-2.5">
                        {g.length === 0 ? (
                          <span className="font-medium text-slate-400">No modifiers — added straight to the order</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {g.map((x) => (
                              <button
                                key={x.id}
                                type="button"
                                onClick={() => openEdit(x)}
                                className={cn(
                                  "rounded-md border px-1.5 py-0.5 text-[11px] font-semibold transition hover:border-emerald-400",
                                  x.isRequired ? "border-amber-200 bg-amber-50 text-amber-800" : "border-slate-200 bg-white text-slate-700",
                                  x.status !== "Active" && "opacity-50",
                                )}
                                title={`${x.isRequired ? "Required" : "Optional"} · ${ruleText(x)}`}
                              >
                                {x.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <OperationsFilterDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title={tab === "groups" ? "Filter Modifier Groups" : "Filter Menu Items"}
        activeFilterCount={tab === "groups" ? Number(selectionFilter !== "all") : Number(categoryFilter !== "all")}
        onReset={() => (tab === "groups" ? setSelectionFilter("all") : setCategoryFilter("all"))}
      >
        {tab === "groups" ? (
          <FormField label="Selection type">
            <SelectInput value={selectionFilter} onChange={(e) => setSelectionFilter(e.target.value)} className="block">
              <option value="all">Single and multiple</option>
              <option value="single">Single choice</option>
              <option value="multiple">Multiple choice</option>
            </SelectInput>
          </FormField>
        ) : (
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
        )}
      </OperationsFilterDrawer>

      {formOpen && (
        <ModifierGroupFormDrawer
          key={formKey}
          open={formOpen}
          onClose={() => setFormOpen(false)}
          initial={editing}
          menuItems={activeMenuItems}
          menuCategories={menuCategories.data}
          onSaved={async (_group, message) => {
            setFormOpen(false);
            setToast({ message, variant: "success" });
            await groups.reload();
          }}
        />
      )}

      <ConfirmModal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && remove(confirmDelete)}
        loading={busy}
        variant="danger"
        title="Delete modifier group?"
        message={`${confirmDelete?.name ?? ""} and its ${confirmDelete?.options.length ?? 0} option(s) will be removed and unlinked from menu items. Orders already placed keep their modifiers.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
