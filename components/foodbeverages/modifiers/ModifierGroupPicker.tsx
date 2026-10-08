"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatINR } from "@/app/data/foodbeverages/ops";
import {
  groupSelectionError,
  ruleText,
  selectionLimits,
  type ModifierGroup,
} from "@/app/data/foodbeverages/modifiers";

export function ModifierGroupPicker({
  group,
  selected,
  onChange,
  showErrors,
}: {
  group: ModifierGroup;
  selected: string[];
  onChange: (ids: string[]) => void;
  showErrors?: boolean;
}) {
  const { max } = selectionLimits(group);
  const single = group.selectionType === "single";
  const chosen = new Set(selected);
  const atMax = !single && max !== null && chosen.size >= max;
  const error = groupSelectionError(group, chosen.size);

  const toggle = (id: string) => {
    if (single) {
      if (chosen.has(id)) {
        if (!group.isRequired) onChange([]);
        return;
      }
      onChange([id]);
      return;
    }
    if (chosen.has(id)) onChange(selected.filter((x) => x !== id));
    else if (!atMax) onChange([...selected, id]);
  };

  return (
    <fieldset className="space-y-2">
      <legend className="flex w-full items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-sm font-bold text-slate-900">{group.name}</span>
          {group.description && <span className="block text-xs text-slate-500">{group.description}</span>}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              group.isRequired ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600",
            )}
          >
            {group.isRequired ? "Required" : "Optional"}
          </span>
          <span className="text-[11px] font-semibold text-slate-500">{ruleText(group)}</span>
        </span>
      </legend>

      <div className="grid gap-1.5 sm:grid-cols-2">
        {group.options.map((o) => {
          const on = chosen.has(o.id);
          const disabled = !on && atMax;
          return (
            <button
              key={o.id}
              type="button"
              role={single ? "radio" : "checkbox"}
              aria-checked={on}
              disabled={disabled}
              onClick={() => toggle(o.id)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition",
                on
                  ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                  : "border-slate-200 bg-white hover:border-slate-300",
                disabled && "cursor-not-allowed opacity-45 hover:border-slate-200",
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center border",
                  single ? "rounded-full" : "rounded",
                  on ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white",
                )}
              >
                {on && (single ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : <Check className="h-3 w-3" />)}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{o.name}</span>
              <span className={cn("shrink-0 text-xs font-semibold", o.price > 0 ? "text-emerald-700" : "text-slate-400")}>
                {o.price > 0 ? `+${formatINR(o.price)}` : "Free"}
              </span>
            </button>
          );
        })}
      </div>

      {showErrors && error ? (
        <p className="text-xs font-semibold text-red-600">{error}</p>
      ) : atMax ? (
        <p className="text-xs text-slate-500">Maximum reached — remove one to pick another.</p>
      ) : null}
    </fieldset>
  );
}
