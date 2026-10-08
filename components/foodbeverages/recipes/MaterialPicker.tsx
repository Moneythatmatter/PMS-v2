"use client";

import React, { useMemo, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductItem } from "@/app/data/productMasterData";
import { formatMoney, formatQty } from "@/components/requisitions/requisitionUi";

type Group = { label: string; items: ProductItem[] };

export function MaterialPicker({
  groups,
  onPick,
  onHand,
  unitCost,
}: {
  groups: Group[];
  onPick: (materialId: string) => void;
  onHand: (materialId: string) => number | null;
  unitCost: (materialId: string) => number;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        items: q
          ? g.items.filter((p) =>
              [p.productName, p.productCode, p.category].some((v) => v?.toLowerCase().includes(q)),
            )
          : g.items,
      }))
      .filter((g) => g.items.length > 0)
      .reduce<(Group & { offset: number })[]>((acc, g) => {
        const prev = acc[acc.length - 1];
        acc.push({ ...g, offset: prev ? prev.offset + prev.items.length : 0 });
        return acc;
      }, []);
  }, [groups, query]);

  const flat = useMemo(() => visible.flatMap((g) => g.items), [visible]);
  const active = Math.min(highlight, Math.max(flat.length - 1, 0));

  const pick = (id: string) => {
    onPick(id);
    setQuery("");
    setHighlight(0);
    setOpen(false);
  };

  const move = (delta: number) => {
    if (flat.length === 0) return;
    const next = (active + delta + flat.length) % flat.length;
    setHighlight(next);
    listRef.current?.querySelector<HTMLElement>(`[data-index="${next}"]`)?.scrollIntoView({ block: "nearest" });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && flat[active]) pick(flat[active].id);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border bg-white px-3 transition-shadow",
          open ? "border-emerald-400 ring-4 ring-emerald-50" : "border-slate-200 hover:border-slate-300",
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlight(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          placeholder="Search raw materials by name, code or category…"
          className="h-11 w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          role="combobox"
          aria-expanded={open}
          aria-controls="recipe-material-list"
          aria-label="Add ingredient"
        />
        <kbd className="hidden shrink-0 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 sm:block">
          ↵ add
        </kbd>
      </div>

      {open && (
        <div
          ref={listRef}
          id="recipe-material-list"
          role="listbox"
          className="absolute inset-x-0 top-full z-30 mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
        >
          {visible.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-slate-500">
              {query ? `No material matches “${query}”.` : "Every available material is already in this recipe."}
            </p>
          ) : (
            visible.map((g) => (
              <div key={g.label}>
                <p className="sticky top-0 bg-white/95 px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 backdrop-blur">
                  {g.label}
                </p>
                {g.items.map((p, n) => {
                  const i = g.offset + n;
                  const stock = onHand(p.id);
                  const cost = unitCost(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="option"
                      aria-selected={i === active}
                      data-index={i}
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setHighlight(i)}
                      onClick={() => pick(p.id)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2 text-left",
                        i === active ? "bg-emerald-50" : "hover:bg-slate-50",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                          i === active ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500",
                        )}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-900">{p.productName}</span>
                        <span className="block truncate text-[11px] text-slate-500">
                          {p.productCode} · {p.category}
                        </span>
                      </span>
                      <span className="shrink-0 text-right text-[11px]">
                        <span className={cn("block font-semibold", stock !== null && stock <= 0 ? "text-red-600" : "text-slate-700")}>
                          {stock === null ? "—" : `${formatQty(stock)} ${p.unit}`}
                        </span>
                        <span className="block text-slate-400">{cost > 0 ? `${formatMoney(cost)} / ${p.unit}` : "no cost yet"}</span>
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
