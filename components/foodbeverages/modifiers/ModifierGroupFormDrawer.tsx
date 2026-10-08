"use client";

import React, { useMemo, useState } from "react";
import { Check, Layers, Plus, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { FormField, SelectInput, TextAreaInput, TextInput } from "@/components/frontoffice/ui";
import { ProcurementFormSection } from "@/components/purchase-stores/ui/ProcurementFormParts";
import { formatMoney } from "@/components/requisitions/requisitionUi";
import { modifierGroupService } from "@/services/food-beverages";
import {
  ruleText,
  selectionLimits,
  type ModifierGroup,
  type ModifierGroupInput,
  type ModifierSelectionType,
} from "@/app/data/foodbeverages/modifiers";
import { GROUP_INPUT, InputGroup } from "../ui/InputGroup";
import { ModifierGroupPicker } from "./ModifierGroupPicker";

export type MenuItemOption = { id: string; name: string; price: number; categoryId: string | null; status?: string };
export type MenuCategoryOption = { id: string; name: string };

type OptionLine = {
  key: string;
  id?: string;
  name: string;
  price: string;
  isDefault: boolean;
  active: boolean;
};

let optionSeq = 0;
const nextKey = () => `opt-${++optionSeq}`;
const blankOption = (): OptionLine => ({ key: nextKey(), name: "", price: "0", isDefault: false, active: true });

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string; hint: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            "rounded-lg border px-3 py-2 text-left transition",
            value === o.id
              ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
              : "border-slate-200 bg-white hover:border-slate-300",
          )}
        >
          <span className={cn("block text-sm font-semibold", value === o.id ? "text-emerald-800" : "text-slate-800")}>
            {o.label}
          </span>
          <span className="block text-[11px] text-slate-500">{o.hint}</span>
        </button>
      ))}
    </div>
  );
}

export function ModifierGroupFormDrawer({
  open,
  onClose,
  initial,
  menuItems,
  menuCategories,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial: ModifierGroup | null;
  menuItems: MenuItemOption[];
  menuCategories: MenuCategoryOption[];
  onSaved: (group: ModifierGroup, message: string) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState<"Active" | "Inactive">(initial?.status ?? "Active");
  const [isRequired, setIsRequired] = useState(initial?.isRequired ?? false);
  const [selectionType, setSelectionType] = useState<ModifierSelectionType>(initial?.selectionType ?? "single");
  const [minSelect, setMinSelect] = useState(String(initial?.minSelect ?? 1));
  const [maxSelect, setMaxSelect] = useState(initial?.maxSelect == null ? "" : String(initial.maxSelect));
  const [lines, setLines] = useState<OptionLine[]>(() =>
    initial?.options.length
      ? initial.options.map((o) => ({
          key: nextKey(),
          id: o.id,
          name: o.name,
          price: String(o.price),
          isDefault: o.isDefault,
          active: o.status === "Active",
        }))
      : [blankOption(), blankOption()],
  );
  const [menuItemIds, setMenuItemIds] = useState<string[]>(initial?.menuItemIds ?? []);
  const [itemSearch, setItemSearch] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const rules = useMemo(
    () => ({
      selectionType,
      isRequired,
      minSelect: Math.max(0, Math.floor(Number(minSelect) || 0)),
      maxSelect: maxSelect.trim() === "" || Number(maxSelect) <= 0 ? null : Math.floor(Number(maxSelect)),
    }),
    [selectionType, isRequired, minSelect, maxSelect],
  );
  const limits = selectionLimits(rules);
  const activeOptions = lines.filter((l) => l.active && l.name.trim());
  const defaultCount = lines.filter((l) => l.isDefault && l.active).length;
  const maxBelowMin = selectionType === "multiple" && limits.max !== null && limits.max < Math.max(limits.min, 1);

  const updateLine = (key: string, patch: Partial<OptionLine>) =>
    setLines((prev) =>
      prev.map((l) => {
        if (l.key === key) return { ...l, ...patch };
        // A single-choice group can only pre-select one option.
        if (patch.isDefault && selectionType === "single") return { ...l, isDefault: false };
        return l;
      }),
    );

  const changeSelectionType = (next: ModifierSelectionType) => {
    setSelectionType(next);
    if (next === "single") {
      let kept = false;
      setLines((prev) =>
        prev.map((l) => {
          if (!l.isDefault) return l;
          if (kept) return { ...l, isDefault: false };
          kept = true;
          return l;
        }),
      );
    }
  };

  const validate = () => {
    const out: string[] = [];
    if (!name.trim()) out.push("Give the group a name, e.g. Size or Extra Toppings.");
    const named = lines.filter((l) => l.name.trim());
    if (named.length === 0) out.push("Add at least one option.");
    if (lines.some((l) => !l.name.trim() && (Number(l.price) || 0) !== 0)) out.push("Every priced option needs a name.");
    if (lines.some((l) => l.name.trim() && (Number(l.price) < 0 || Number.isNaN(Number(l.price))))) {
      out.push("Option prices can't be negative.");
    }
    const seen = new Set<string>();
    for (const l of named) {
      const k = l.name.trim().toLowerCase();
      if (seen.has(k)) out.push(`"${l.name.trim()}" is listed twice.`);
      seen.add(k);
    }
    if (maxBelowMin) out.push("Maximum selection can't be less than the minimum.");
    if (limits.min > activeOptions.length) {
      out.push(`Customers must pick ${limits.min}, but only ${activeOptions.length} active option(s) exist.`);
    }
    if (limits.max !== null && defaultCount > limits.max) out.push(`Only ${limits.max} option(s) can be pre-selected.`);
    return out;
  };

  const save = async () => {
    const problems = validate();
    setErrors(problems);
    if (problems.length > 0) return;
    const body: ModifierGroupInput = {
      name: name.trim(),
      code: code.trim(),
      description: description.trim(),
      status,
      isRequired,
      selectionType,
      minSelect: limits.min,
      maxSelect: limits.max,
      options: lines
        .filter((l) => l.name.trim())
        .map((l) => ({
          ...(l.id ? { id: l.id } : {}),
          name: l.name.trim(),
          price: Math.round((Number(l.price) || 0) * 100) / 100,
          isDefault: l.isDefault,
          status: l.active ? "Active" : "Inactive",
        })),
      menuItemIds,
    };
    setSaving(true);
    try {
      const saved = initial
        ? await modifierGroupService.update(initial.id, body)
        : await modifierGroupService.create(body);
      onSaved(saved, initial ? `${saved.name} updated.` : `${saved.name} created.`);
    } catch (e) {
      setErrors([e instanceof Error ? e.message : "Could not save the modifier group."]);
    } finally {
      setSaving(false);
    }
  };

  const preview: ModifierGroup = {
    id: "preview",
    code,
    name: name.trim() || "Group name",
    description,
    status,
    sortOrder: 0,
    menuItemIds: [],
    ...rules,
    minSelect: limits.min,
    maxSelect: limits.max,
    options: activeOptions.map((l, i) => ({
      id: l.key,
      groupId: "preview",
      code: "",
      name: l.name.trim(),
      price: Number(l.price) || 0,
      isDefault: l.isDefault,
      sortOrder: i,
      status: "Active",
    })),
  };
  const [previewPicks, setPreviewPicks] = useState<string[]>([]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="bottom"
      title={initial ? `Edit ${initial.name}` : "New Modifier Group"}
      customHeader={
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
            <Layers className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 id="drawer-title" className="truncate text-base font-bold text-slate-900 sm:text-lg">
              {initial ? `Edit Modifier Group · ${initial.name}` : "New Modifier Group"}
            </h2>
            <p className="truncate text-xs text-slate-500">
              Options and prices the cashier picks from when one of the linked menu items is ordered.
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            <strong className="text-slate-800">{activeOptions.length}</strong> active option
            {activeOptions.length === 1 ? "" : "s"} · <strong className="text-slate-800">{ruleText(rules)}</strong> ·{" "}
            linked to <strong className="text-slate-800">{menuItemIds.length}</strong> item{menuItemIds.length === 1 ? "" : "s"}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving} className="!bg-emerald-700 text-white hover:!bg-emerald-800">
              {saving ? "Saving…" : initial ? "Save Changes" : "Create Group"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
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

          <ProcurementFormSection step={1} title="Group details" subtitle="How the group is labelled on the order screen.">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Group Name" required>
                <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pizza Size" />
              </FormField>
              <FormField label="Code" helperText="Optional short reference.">
                <TextInput value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. MG-SIZE" />
              </FormField>
              <FormField label="Description" className="sm:col-span-2" helperText="Shown under the group name in the order modal.">
                <TextAreaInput
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. All pizzas are hand-stretched"
                  className="min-h-[60px]"
                />
              </FormField>
              <FormField label="Status">
                <SelectInput value={status} onChange={(e) => setStatus(e.target.value as "Active" | "Inactive")} className="block">
                  <option value="Active">Active — shown in POS</option>
                  <option value="Inactive">Inactive — hidden from POS</option>
                </SelectInput>
              </FormField>
            </div>
          </ProcurementFormSection>

          <ProcurementFormSection step={2} title="Selection rules" subtitle="What the cashier has to pick before the item can be added.">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Requirement">
                <Segmented
                  value={isRequired ? "required" : "optional"}
                  onChange={(v) => setIsRequired(v === "required")}
                  options={[
                    { id: "optional", label: "Optional", hint: "Can be skipped" },
                    { id: "required", label: "Required", hint: "Must pick before adding" },
                  ]}
                />
              </FormField>
              <FormField label="Selection type">
                <Segmented
                  value={selectionType}
                  onChange={changeSelectionType}
                  options={[
                    { id: "single", label: "Single", hint: "One option, e.g. Size" },
                    { id: "multiple", label: "Multiple", hint: "Several, e.g. Toppings" },
                  ]}
                />
              </FormField>
              {selectionType === "multiple" && (
                <>
                  <FormField
                    label="Minimum selection"
                    helperText={isRequired ? "At least this many must be picked." : "Optional groups have no minimum."}
                  >
                    <InputGroup suffix="options">
                      <input
                        type="number"
                        min={1}
                        step={1}
                        inputMode="numeric"
                        value={isRequired ? minSelect : "0"}
                        disabled={!isRequired}
                        onChange={(e) => setMinSelect(e.target.value)}
                        className={cn(GROUP_INPUT, !isRequired && "cursor-not-allowed text-slate-400")}
                      />
                    </InputGroup>
                  </FormField>
                  <FormField label="Maximum selection" helperText="Leave blank for no limit.">
                    <InputGroup suffix="options" invalid={maxBelowMin}>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        inputMode="numeric"
                        value={maxSelect}
                        placeholder="No limit"
                        onChange={(e) => setMaxSelect(e.target.value)}
                        className={GROUP_INPUT}
                      />
                    </InputGroup>
                  </FormField>
                </>
              )}
            </div>
            <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Cashier sees: <strong className="text-slate-800">{isRequired ? "Required" : "Optional"}</strong> ·{" "}
              <strong className="text-slate-800">{ruleText(rules)}</strong>
            </p>
          </ProcurementFormSection>

          <ProcurementFormSection
            step={3}
            title="Options"
            subtitle="Each option adds its price to the item. Use ₹0 for free choices."
            action={
              <Button
                variant="outline"
                onClick={() => setLines((prev) => [...prev, blankOption()])}
                className="h-8 gap-1 rounded-lg px-2.5 text-xs font-semibold"
              >
                <Plus className="h-3.5 w-3.5" /> Add option
              </Button>
            }
          >
            <div className="-mx-5 -mb-5 overflow-x-auto border-t border-slate-100">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="w-8 px-3 py-2">#</th>
                    <th className="px-3 py-2">Option</th>
                    <th className="w-40 px-3 py-2">Extra price</th>
                    <th className="w-28 px-3 py-2 text-center">Pre-selected</th>
                    <th className="w-24 px-3 py-2 text-center">Active</th>
                    <th className="w-12 px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lines.map((l, idx) => (
                    <tr key={l.key} className={cn(!l.active && "bg-slate-50/60")}>
                      <td className="px-3 py-2 text-xs font-semibold text-slate-400">{idx + 1}</td>
                      <td className="px-3 py-2">
                        <TextInput
                          value={l.name}
                          onChange={(e) => updateLine(l.key, { name: e.target.value })}
                          placeholder={idx === 0 ? "e.g. Large" : "e.g. Extra Cheese"}
                          className={cn(!l.active && "text-slate-400")}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <InputGroup prefix="+₹" invalid={Number(l.price) < 0}>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            inputMode="decimal"
                            value={l.price}
                            onChange={(e) => updateLine(l.key, { price: e.target.value })}
                            className={GROUP_INPUT}
                          />
                        </InputGroup>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type={selectionType === "single" ? "radio" : "checkbox"}
                          name="modifier-default"
                          checked={l.isDefault}
                          disabled={!l.active}
                          onChange={(e) => updateLine(l.key, { isDefault: e.target.checked })}
                          onClick={() => {
                            if (selectionType === "single" && l.isDefault) updateLine(l.key, { isDefault: false });
                          }}
                          className="h-4 w-4 accent-emerald-600"
                          aria-label={`Pre-select ${l.name || `option ${idx + 1}`}`}
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={l.active}
                          onClick={() => updateLine(l.key, { active: !l.active, isDefault: l.active ? false : l.isDefault })}
                          className={cn(
                            "relative inline-flex h-5 w-9 items-center rounded-full transition",
                            l.active ? "bg-emerald-600" : "bg-slate-300",
                          )}
                          aria-label={`${l.active ? "Deactivate" : "Activate"} ${l.name || `option ${idx + 1}`}`}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 rounded-full bg-white shadow transition",
                              l.active ? "translate-x-4" : "translate-x-0.5",
                            )}
                          />
                        </button>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => setLines((prev) => (prev.length > 1 ? prev.filter((x) => x.key !== l.key) : [blankOption()]))}
                          className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          aria-label={`Remove ${l.name || `option ${idx + 1}`}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ProcurementFormSection>

          <ProcurementFormSection
            step={4}
            title="Menu items"
            subtitle="Ordering any of these items opens the modifier picker with this group."
            action={
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                {menuItemIds.length} selected
              </span>
            }
          >
            <MenuItemChecklist
              items={menuItems}
              categories={menuCategories}
              selected={menuItemIds}
              onChange={setMenuItemIds}
              search={itemSearch}
              onSearch={setItemSearch}
            />
          </ProcurementFormSection>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-0 lg:self-start">
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">POS preview</h3>
            <p className="mb-3 text-xs text-slate-500">How this group appears when the item is ordered. Try it.</p>
            {preview.options.length === 0 ? (
              <p className="rounded-lg bg-slate-50 px-3 py-6 text-center text-xs text-slate-400">Add options to see the preview.</p>
            ) : (
              <ModifierGroupPicker
                group={preview}
                selected={previewPicks.filter((id) => preview.options.some((o) => o.id === id))}
                onChange={setPreviewPicks}
                showErrors
              />
            )}
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Price range</h3>
            {activeOptions.length === 0 ? (
              <p className="text-slate-400">—</p>
            ) : (
              <p>
                Adds{" "}
                <strong className="text-slate-800">
                  {formatMoney(Math.min(...activeOptions.map((o) => Number(o.price) || 0)))}
                </strong>{" "}
                to{" "}
                <strong className="text-slate-800">
                  {formatMoney(Math.max(...activeOptions.map((o) => Number(o.price) || 0)))}
                </strong>{" "}
                per option.
              </p>
            )}
          </section>
        </aside>
      </div>
    </Drawer>
  );
}

function MenuItemChecklist({
  items,
  categories,
  selected,
  onChange,
  search,
  onSearch,
}: {
  items: MenuItemOption[];
  categories: MenuCategoryOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  search: string;
  onSearch: (v: string) => void;
}) {
  const [categoryId, setCategoryId] = useState("all");
  const chosen = new Set(selected);
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const q = search.trim().toLowerCase();
  const visible = items.filter(
    (i) => (categoryId === "all" || i.categoryId === categoryId) && (!q || i.name.toLowerCase().includes(q)),
  );
  const allVisibleChosen = visible.length > 0 && visible.every((i) => chosen.has(i.id));

  const toggle = (id: string) => onChange(chosen.has(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  const toggleVisible = () => {
    if (allVisibleChosen) {
      const drop = new Set(visible.map((i) => i.id));
      onChange(selected.filter((id) => !drop.has(id)));
    } else {
      onChange([...new Set([...selected, ...visible.map((i) => i.id)])]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <TextInput value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search menu items…" className="pl-9" />
        </div>
        <SelectInput value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="block sm:w-52">
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectInput>
        <Button variant="outline" onClick={toggleVisible} disabled={visible.length === 0} className="h-9 shrink-0 text-xs font-semibold">
          {allVisibleChosen ? "Clear shown" : "Select shown"}
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="rounded-lg bg-slate-50 px-3 py-6 text-center text-xs text-slate-400">No menu items yet. Add them under Menu → Items.</p>
      ) : visible.length === 0 ? (
        <p className="rounded-lg bg-slate-50 px-3 py-6 text-center text-xs text-slate-400">No items match.</p>
      ) : (
        <div className="grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((item) => {
            const on = chosen.has(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggle(item.id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition",
                  on ? "border-emerald-500 bg-emerald-50/70" : "border-slate-200 bg-white hover:border-slate-300",
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                    on ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white",
                  )}
                >
                  {on && <Check className="h-3 w-3" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-800">{item.name}</span>
                  <span className="block truncate text-[11px] text-slate-500">
                    {[item.categoryId ? categoryName.get(item.categoryId) : null, formatMoney(Number(item.price) || 0)]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
