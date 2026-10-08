"use client";

import React, { useMemo, useRef, useState } from "react";
import { AlertTriangle, ChefHat, PackageSearch, Search, StickyNote, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductItem } from "@/app/data/productMasterData";
import { recipeUnitsFor, yieldUnitLabel } from "@/app/data/foodbeverages/recipes";
import { formatMoney, formatQty } from "@/components/requisitions/requisitionUi";

export type IngredientFormLine = {
  key: string;
  id?: string;
  materialId: string;
  quantity: string;
  unit: string;
  wastagePercent: string;
  remarks: string;
};

export type IngredientRowView = {
  line: IngredientFormLine;
  product?: ProductItem;
  factor: number | null;
  gross: number;
  unitCost: number;
  cost: number;
  onHand: number | null;
};

type EditableField = "quantity" | "unit" | "wastagePercent" | "remarks";

const GRID = "md:grid-cols-[minmax(0,1fr)_196px_104px_136px_112px_36px]";

export function AllMaterialsSwitch({ checked, onChange }: { checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex shrink-0 items-center gap-2 rounded-full px-1 py-0.5 text-xs font-medium text-slate-600 hover:text-slate-900"
    >
      <span className={cn("relative inline-flex h-4 w-7 rounded-full transition-colors", checked ? "bg-emerald-600" : "bg-slate-300")}>
        <span
          className={cn(
            "absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-all",
            checked ? "left-3.5" : "left-0.5",
          )}
        />
      </span>
      All materials
    </button>
  );
}

function MaterialPicker({
  groups,
  onPick,
  onHandFor,
  costFor,
  emptyHint,
}: {
  groups: { label: string; items: ProductItem[] }[];
  onPick: (materialId: string) => void;
  onHandFor: (materialId: string) => number | null;
  costFor: (materialId: string) => number;
  emptyHint: string | null;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups
      .map((g) => ({
        label: g.label,
        items: q
          ? g.items.filter((p) =>
              [p.productName, p.productCode, p.category].some((v) => (v ?? "").toLowerCase().includes(q)),
            )
          : g.items,
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, query]);
  const flat = useMemo(() => filtered.flatMap((g) => g.items), [filtered]);
  const groupStarts = useMemo(
    () => filtered.map((_, i) => filtered.slice(0, i).reduce((s, g) => s + g.items.length, 0)),
    [filtered],
  );
  const activeIndex = Math.min(active, Math.max(flat.length - 1, 0));

  const pick = (id: string) => {
    onPick(id);
    setQuery("");
    setActive(0);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && flat[activeIndex]) pick(flat[activeIndex].id);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex h-11 items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 shadow-2xs transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          placeholder="Search raw materials by name, code or category to add…"
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          role="combobox"
          aria-expanded={open}
          aria-controls="recipe-material-options"
          aria-label="Add ingredient"
        />
        <kbd className="hidden rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 sm:block">
          ↵ to add
        </kbd>
      </div>

      {open && (
        <div
          id="recipe-material-options"
          role="listbox"
          className="absolute inset-x-0 top-full z-30 mt-1.5 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl"
        >
          {flat.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <PackageSearch className="mx-auto h-6 w-6 text-slate-300" />
              <p className="mt-1.5 text-sm font-medium text-slate-600">
                {query ? `No materials match “${query}”` : "Every available material is already added"}
              </p>
              {emptyHint && <p className="mt-0.5 text-xs text-slate-400">{emptyHint}</p>}
            </div>
          ) : (
            filtered.map((group, gi) => (
              <div key={group.label}>
                <p className="px-3.5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {group.label} · {group.items.length}
                </p>
                {group.items.map((p, pi) => {
                  const myIndex = groupStarts[gi] + pi;
                  const isActive = myIndex === activeIndex;
                  const onHand = onHandFor(p.id);
                  const cost = costFor(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setActive(myIndex)}
                      onClick={() => pick(p.id)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3.5 py-2 text-left transition-colors",
                        isActive ? "bg-emerald-50/70" : "hover:bg-slate-50",
                      )}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold uppercase text-slate-500">
                        {p.productName.slice(0, 2)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-900">{p.productName}</span>
                        <span className="block truncate text-[11px] text-slate-500">
                          <span className="font-mono">{p.productCode}</span> · {p.category}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        {onHand !== null && (
                          <span
                            className={cn(
                              "block text-[11px] font-semibold",
                              onHand > 0 ? "text-emerald-700" : "text-slate-400",
                            )}
                          >
                            {onHand > 0 ? `${formatQty(onHand)} ${p.unit} in store` : "None in store"}
                          </span>
                        )}
                        <span className="block text-[10px] text-slate-400">
                          {cost > 0 ? `${formatMoney(cost)} / ${p.unit}` : `Stocked in ${p.unit}`}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400 md:hidden">{children}</span>;
}

export function RecipeIngredientsEditor({
  rows,
  pickGroups,
  emptyPickerHint,
  onAdd,
  onUpdate,
  onRemove,
  onHandFor,
  costFor,
  storeName,
  yieldQty,
  yieldUnit,
  batchCost,
  costPerPortion,
}: {
  rows: IngredientRowView[];
  pickGroups: { label: string; items: ProductItem[] }[];
  emptyPickerHint: string | null;
  onAdd: (materialId: string) => void;
  onUpdate: (key: string, field: EditableField, value: string) => void;
  onRemove: (key: string) => void;
  onHandFor: (materialId: string) => number | null;
  costFor: (materialId: string) => number;
  storeName: string;
  yieldQty: number;
  yieldUnit: string;
  batchCost: number;
  costPerPortion: number;
}) {
  const [noteOpen, setNoteOpen] = useState<Set<string>>(new Set());
  const shortCount = rows.filter((r) => r.onHand !== null && r.gross > 0 && r.onHand < r.gross).length;

  return (
    <div className="space-y-3">
      <MaterialPicker
        groups={pickGroups}
        onPick={onAdd}
        onHandFor={onHandFor}
        costFor={costFor}
        emptyHint={emptyPickerHint}
      />

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-10 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-emerald-600 shadow-2xs ring-1 ring-slate-100">
            <ChefHat className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-700">No ingredients yet</p>
          <p className="mx-auto mt-0.5 max-w-sm text-xs text-slate-500">
            Search above to add raw materials. They come straight from the Purchase &amp; Stores master, so there is no
            separate F&amp;B material list to maintain.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div
            className={cn(
              "hidden gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 md:grid",
              GRID,
            )}
          >
            <span>Material</span>
            <span>Qty per batch</span>
            <span>Wastage</span>
            <span className="text-right">From stock</span>
            <span className="text-right">Cost</span>
            <span />
          </div>

          <ul className="divide-y divide-slate-100">
            {rows.map(({ line, product, factor, gross, unitCost, cost, onHand }, idx) => {
              const label = product?.productName ?? "Unknown material";
              const qtyInvalid = line.quantity !== "" && !(Number(line.quantity) > 0);
              const wastage = Number(line.wastagePercent) || 0;
              const wastageInvalid = wastage < 0 || wastage > 100;
              const showNote = noteOpen.has(line.key) || line.remarks !== "";
              const short = onHand !== null && gross > 0 && onHand < gross;
              return (
                <li
                  key={line.key}
                  className={cn("relative grid grid-cols-2 items-start gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50/50", GRID)}
                >
                  <div className="col-span-2 flex min-w-0 items-start gap-3 pr-10 md:col-span-1 md:pr-0">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-100">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900" title={label}>
                        {label}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-slate-500">
                        {product?.productCode && <span className="font-mono">{product.productCode}</span>}
                        {product?.category && <span className="text-slate-300">•</span>}
                        {product?.category && <span className="truncate">{product.category}</span>}
                        {product?.unit && (
                          <span className="rounded bg-slate-100 px-1.5 py-px text-[10px] font-semibold text-slate-600">
                            Stocked in {product.unit}
                          </span>
                        )}
                      </div>
                      {showNote ? (
                        <div className="mt-2 flex items-center gap-1.5">
                          <StickyNote className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                          <input
                            value={line.remarks}
                            onChange={(e) => onUpdate(line.key, "remarks", e.target.value)}
                            autoFocus={line.remarks === ""}
                            placeholder="e.g. finely chopped, soaked overnight"
                            className="h-7 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            aria-label={`Prep note for ${label}`}
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setNoteOpen((prev) => new Set(prev).add(line.key))}
                          className="mt-1.5 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
                        >
                          + Add prep note
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <FieldLabel>Qty per batch</FieldLabel>
                    <div
                      className={cn(
                        "flex h-9 overflow-hidden rounded-lg border bg-white transition focus-within:ring-2",
                        qtyInvalid || factor === null
                          ? "border-red-300 focus-within:border-red-400 focus-within:ring-red-100"
                          : "border-slate-200 focus-within:border-emerald-500 focus-within:ring-emerald-100",
                      )}
                    >
                      <input
                        type="number"
                        min={0}
                        step="any"
                        inputMode="decimal"
                        value={line.quantity}
                        placeholder="0"
                        onChange={(e) => onUpdate(line.key, "quantity", e.target.value)}
                        className="w-full min-w-0 bg-transparent px-3 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none"
                        aria-label={`Quantity of ${label}`}
                      />
                      <select
                        value={line.unit}
                        onChange={(e) => onUpdate(line.key, "unit", e.target.value)}
                        className="w-[74px] shrink-0 cursor-pointer border-l border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-700 focus:outline-none"
                        aria-label={`Unit for ${label}`}
                      >
                        {(product ? recipeUnitsFor(product.unit) : [line.unit]).map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                    {qtyInvalid && <p className="mt-1 text-[10px] font-medium text-red-600">Must be more than 0</p>}
                  </div>

                  <div>
                    <FieldLabel>Wastage</FieldLabel>
                    <div
                      className={cn(
                        "flex h-9 overflow-hidden rounded-lg border bg-white transition focus-within:ring-2",
                        wastageInvalid
                          ? "border-red-300 focus-within:ring-red-100"
                          : "border-slate-200 focus-within:border-emerald-500 focus-within:ring-emerald-100",
                      )}
                    >
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="any"
                        inputMode="decimal"
                        value={line.wastagePercent}
                        placeholder="0"
                        onChange={(e) => onUpdate(line.key, "wastagePercent", e.target.value)}
                        className="w-full min-w-0 bg-transparent px-3 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none"
                        aria-label={`Wastage percent for ${label}`}
                      />
                      <span className="flex items-center border-l border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-400">
                        %
                      </span>
                    </div>
                  </div>

                  <div className="md:text-right">
                    <FieldLabel>From stock</FieldLabel>
                    {factor === null ? (
                      <p className="pt-2 text-xs font-semibold text-red-600">Unit can&apos;t convert</p>
                    ) : gross > 0 ? (
                      <>
                        <p className="pt-1.5 text-sm font-semibold text-slate-900">
                          {formatQty(gross)} <span className="text-xs font-medium text-slate-400">{product?.unit}</span>
                        </p>
                        {onHand !== null && (
                          <p
                            className={cn(
                              "mt-0.5 inline-flex items-center gap-1 text-[10px] font-medium",
                              short ? "text-red-600" : "text-emerald-700",
                            )}
                          >
                            <span className={cn("h-1.5 w-1.5 rounded-full", short ? "bg-red-500" : "bg-emerald-500")} />
                            {short ? `Only ${formatQty(onHand)} in store` : `${formatQty(onHand)} in store`}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="pt-2 text-xs text-slate-400">Enter quantity</p>
                    )}
                  </div>

                  <div className="md:text-right">
                    <FieldLabel>Cost</FieldLabel>
                    <p className="pt-1.5 text-sm font-semibold text-slate-900">{formatMoney(cost)}</p>
                    <p className={cn("mt-0.5 text-[10px]", unitCost > 0 ? "text-slate-400" : "font-medium text-amber-600")}>
                      {unitCost > 0 ? `${formatMoney(unitCost)} / ${product?.unit}` : "No stock cost yet"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemove(line.key)}
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 md:static md:mt-0.5"
                    aria-label={`Remove ${label}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-3">
            <div className="text-xs text-slate-500">
              <p>
                <strong className="text-slate-800">{rows.length}</strong> ingredient{rows.length === 1 ? "" : "s"} · batch makes{" "}
                <strong className="text-slate-800">
                  {formatQty(yieldQty)} {yieldUnitLabel(yieldUnit, yieldQty).toLowerCase()}
                </strong>
              </p>
              {shortCount > 0 && (
                <p className="mt-1 flex items-center gap-1 font-medium text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {shortCount} short in {storeName} for one batch
                </p>
              )}
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Batch cost</p>
                <p className="text-sm font-bold text-slate-900">{formatMoney(batchCost)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Per {yieldUnitLabel(yieldUnit).toLowerCase()}
                </p>
                <p className="text-base font-extrabold text-emerald-700">{formatMoney(costPerPortion)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
