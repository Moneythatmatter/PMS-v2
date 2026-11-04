"use client";

import { useMemo } from "react";
import { PackagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { StockBalanceRecord } from "@/app/data/stockBalanceData";

export type PickerLine = { key: string; materialId: string; qty: string };

type ProductLite = { id: string; productCode: string; productName: string; unit: string };

const inr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const newPickerLine = (): PickerLine => ({ key: Math.random().toString(36).slice(2), materialId: "", qty: "" });

/** Lines that have a material and a positive quantity, ready to send to the API. */
export function pickerLinesToPayload<K extends string>(lines: PickerLine[], qtyKey: K) {
  return lines
    .filter((l) => l.materialId && Number(l.qty) > 0)
    .map((l) => ({ materialId: l.materialId, [qtyKey]: Number(l.qty) }) as { materialId: string } & Record<K, number>);
}

export function pickerLinesProblem(lines: PickerLine[], balances: StockBalanceRecord[], warehouseId: string | undefined) {
  for (const line of lines) {
    if (!line.materialId && !line.qty) continue;
    if (!line.materialId) return "Choose a material on every line, or remove the empty line.";
    const qty = Number(line.qty);
    if (!(qty > 0)) return "Every line needs a quantity greater than 0.";
    const onHand = balances.find((b) => b.materialId === line.materialId && b.warehouseId === warehouseId)?.quantity ?? 0;
    if (qty > Number(onHand)) return "Some quantities are more than the stock available in this warehouse.";
  }
  return null;
}

export function StockLinePicker({
  warehouseId,
  balances,
  products,
  lines,
  onChange,
  emptyHint = "Choose a warehouse to see its stock.",
}: {
  warehouseId: string | undefined;
  balances: StockBalanceRecord[];
  products: ProductLite[];
  lines: PickerLine[];
  onChange: (lines: PickerLine[]) => void;
  emptyHint?: string;
}) {
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const stock = useMemo(
    () =>
      balances
        .filter((b) => b.warehouseId === warehouseId && Number(b.quantity) > 0)
        .map((b) => ({ balance: b, product: productById.get(b.materialId) }))
        .filter((row): row is { balance: StockBalanceRecord; product: ProductLite } => Boolean(row.product))
        .sort((a, b) => a.product.productName.localeCompare(b.product.productName)),
    [balances, warehouseId, productById],
  );

  const update = (key: string, patch: Partial<PickerLine>) => onChange(lines.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const total = lines.reduce((sum, l) => {
    const bal = stock.find((s) => s.balance.materialId === l.materialId)?.balance;
    return sum + (Number(l.qty) || 0) * Number(bal?.averageCost ?? 0);
  }, 0);

  if (!warehouseId) {
    return <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">{emptyHint}</p>;
  }

  return (
    <div className="space-y-2">
      {stock.length === 0 ? (
        <p className="rounded-xl border border-dashed border-amber-200 bg-amber-50/50 p-4 text-center text-xs text-amber-800">
          This warehouse has no stock on hand. Receive goods (GRN) or post opening stock first.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left">Material</th>
                <th className="w-24 px-3 py-2 text-right">Available</th>
                <th className="w-28 px-3 py-2 text-right">Quantity</th>
                <th className="w-24 px-3 py-2 text-right">Value</th>
                <th className="w-10 px-2 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lines.map((line) => {
                const row = stock.find((s) => s.balance.materialId === line.materialId);
                const onHand = Number(row?.balance.quantity ?? 0);
                const qty = Number(line.qty) || 0;
                const over = Boolean(line.materialId) && qty > onHand;
                const takenElsewhere = new Set(lines.filter((l) => l.key !== line.key).map((l) => l.materialId));
                return (
                  <tr key={line.key} className={cn(over && "bg-red-50/50")}>
                    <td className="px-3 py-2">
                      <select
                        aria-label="Material"
                        value={line.materialId}
                        onChange={(e) => update(line.key, { materialId: e.target.value })}
                        className="h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 text-xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      >
                        <option value="">Select material…</option>
                        {stock.map((s) => (
                          <option key={s.product.id} value={s.product.id} disabled={takenElsewhere.has(s.product.id)}>
                            {s.product.productName} ({s.product.productCode})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                      {row ? `${onHand} ${row.product.unit}` : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        inputMode="decimal"
                        aria-label="Quantity"
                        value={line.qty}
                        onChange={(e) => update(line.key, { qty: e.target.value })}
                        className={cn(
                          "h-9 w-full rounded-lg border bg-white px-2 text-right text-xs tabular-nums focus:outline-none focus:ring-2",
                          over ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-100",
                        )}
                      />
                      {over && <p className="mt-0.5 text-right text-[10px] font-medium text-red-600">Only {onHand} available</p>}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                      {row ? inr(qty * Number(row.balance.averageCost)) : "—"}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => onChange(lines.filter((l) => l.key !== line.key))}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        aria-label="Remove line"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {lines.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-5 text-center text-xs text-slate-500">No materials added yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5"
          disabled={stock.length === 0 || lines.length >= stock.length}
          onClick={() => onChange([...lines, newPickerLine()])}
        >
          <PackagePlus className="h-4 w-4" /> Add material
        </Button>
        {lines.length > 0 && (
          <p className="text-xs text-slate-500">
            Estimated value <span className="font-semibold text-slate-900">{inr(total)}</span>
          </p>
        )}
      </div>
    </div>
  );
}
