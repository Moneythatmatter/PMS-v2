"use client";

import React, { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/frontoffice/ui/Modal";
import { formatINR } from "@/app/data/foodbeverages/ops";
import {
  groupSelectionError,
  modifierSummary,
  selectionLimits,
  type ModifierGroup,
  type SelectedModifier,
} from "@/app/data/foodbeverages/modifiers";
import { ModifierGroupPicker } from "./ModifierGroupPicker";

function initialPicks(groups: ModifierGroup[], current?: SelectedModifier[]) {
  const picks: Record<string, string[]> = {};
  for (const g of groups) {
    if (current) {
      picks[g.id] = current.filter((m) => m.groupId === g.id).map((m) => m.modifierId);
      continue;
    }
    const { max } = selectionLimits(g);
    const defaults = g.options.filter((o) => o.isDefault).map((o) => o.id);
    picks[g.id] = max === null ? defaults : defaults.slice(0, max);
  }
  return picks;
}

export function ModifierSelectModal({
  itemName,
  basePrice,
  groups,
  initialModifiers,
  initialQty = 1,
  confirmLabel = "Add to order",
  onClose,
  onConfirm,
}: {
  itemName: string;
  basePrice: number;
  groups: ModifierGroup[];
  initialModifiers?: SelectedModifier[];
  initialQty?: number;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: (modifiers: SelectedModifier[], qty: number) => void;
}) {
  const [picks, setPicks] = useState<Record<string, string[]>>(() => initialPicks(groups, initialModifiers));
  const [qty, setQty] = useState(initialQty);
  const [attempted, setAttempted] = useState(false);

  const selected = useMemo<SelectedModifier[]>(
    () =>
      groups.flatMap((g) =>
        g.options
          .filter((o) => (picks[g.id] ?? []).includes(o.id))
          .map((o) => ({ groupId: g.id, groupName: g.name, modifierId: o.id, name: o.name, price: o.price })),
      ),
    [groups, picks],
  );
  const invalidGroups = groups.filter((g) => groupSelectionError(g, (picks[g.id] ?? []).length));
  const modifierTotal = selected.reduce((s, m) => s + m.price, 0);
  const unitPrice = basePrice + modifierTotal;

  const confirm = () => {
    setAttempted(true);
    if (invalidGroups.length > 0) return;
    onConfirm(selected, qty);
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={itemName}
      description={`Base price ${formatINR(basePrice)} · choose the options below`}
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center font-mono text-base font-extrabold text-slate-900">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => q + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={confirm}
              className="min-w-[180px] justify-between gap-3 !bg-emerald-700 text-white hover:!bg-emerald-800"
            >
              <span>{confirmLabel}</span>
              <span className="font-mono font-black">{formatINR(unitPrice * qty)}</span>
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {groups.map((g) => (
          <ModifierGroupPicker
            key={g.id}
            group={g}
            selected={picks[g.id] ?? []}
            onChange={(ids) => setPicks((prev) => ({ ...prev, [g.id]: ids }))}
            showErrors={attempted}
          />
        ))}

        <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>{itemName}</span>
            <span className="font-mono">{formatINR(basePrice)}</span>
          </div>
          {selected.map((m) => (
            <div key={m.modifierId} className="flex justify-between text-xs text-slate-500">
              <span>
                + {m.name} <span className="text-slate-400">({m.groupName})</span>
              </span>
              <span className="font-mono">{m.price > 0 ? formatINR(m.price) : "—"}</span>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 font-semibold text-slate-900">
            <span>
              Each{qty > 1 ? ` × ${qty}` : ""}
              {selected.length > 0 && (
                <span className="ml-1 text-xs font-normal text-slate-500">· {modifierSummary(selected)}</span>
              )}
            </span>
            <span className="font-mono">
              {qty > 1 ? `${formatINR(unitPrice)} × ${qty} = ` : ""}
              {formatINR(unitPrice * qty)}
            </span>
          </div>
          {attempted && invalidGroups.length > 0 && (
            <p className="mt-2 text-xs font-semibold text-red-600">
              Complete: {invalidGroups.map((g) => g.name).join(", ")}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
