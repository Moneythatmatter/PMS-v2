"use client";

import { useState } from "react";
import { CreditCard, Plus, SplitSquareHorizontal, Trash2, Users, Wallet } from "lucide-react";
import { formatINRExact } from "@/app/data/foodbeverages/ops";
import { Button } from "@/components/ui/Button";
import { billRoundOff, taxLineLabel, type BillTaxPrintLine } from "@/lib/food-beverages/print-slips";
import { cn } from "@/lib/utils";

export type BillBreakdown = {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  taxLines?: BillTaxPrintLine[];
  /** Menu prices already include the tax. */
  taxIncluded?: boolean;
  /** Already collected against this bill (earlier split parts / partial payments). */
  paid?: number;
};

export type SplitPart = { mode: string; amount: number };

const BASE_METHODS = ["Cash", "Card", "UPI"] as const;
export const ROOM_CHARGE_MODE = "Room Charge";

type SplitRow = { mode: string; amount: string };
type SplitKind = "equal" | "custom";

const round2 = (n: number) => Math.round(n * 100) / 100;

function equalRows(balance: number, people: number, prev: SplitRow[]): SplitRow[] {
  const n = Math.max(2, Math.min(20, Math.floor(people) || 2));
  const share = Math.floor((balance / n) * 100) / 100;
  return Array.from({ length: n }, (_, i) => ({
    mode: prev[i]?.mode ?? "Cash",
    amount: (i === n - 1 ? round2(balance - share * (n - 1)) : share).toFixed(2),
  }));
}

type Props = {
  orderLabel?: string;
  tableRef?: string;
  outletLabel?: string;
  breakdown: BillBreakdown;
  formType: string;
  hasInHouseGuest: boolean;
  paymentMode: string;
  onPaymentModeChange: (mode: string) => void;
  amountPaid: string;
  onAmountPaidChange: (value: string) => void;
  onConfirm: () => void;
  splitOpen?: boolean;
  onSplitOpenChange?: (open: boolean) => void;
  onConfirmSplit?: (parts: SplitPart[]) => void;
  loading?: boolean;
  disabled?: boolean;
};

export function FbSettleBillPanel({
  orderLabel,
  tableRef,
  outletLabel,
  breakdown,
  formType,
  hasInHouseGuest,
  paymentMode,
  onPaymentModeChange,
  amountPaid,
  onAmountPaidChange,
  onConfirm,
  splitOpen = false,
  onSplitOpenChange,
  onConfirmSplit,
  loading = false,
  disabled = false,
}: Props) {
  const paid = breakdown.paid ?? 0;
  const balance = round2(Math.max(0, breakdown.total - paid));
  const isRoomCharge = paymentMode === ROOM_CHARGE_MODE;
  const showRoomCharge = formType === "Room Service" && hasInHouseGuest && paid <= 0;
  const taxLines = breakdown.taxLines ?? [];
  const roundOff = billRoundOff(breakdown.subtotal, breakdown.discount, breakdown.tax, breakdown.total);

  const [splitKind, setSplitKind] = useState<SplitKind>("equal");
  const [people, setPeople] = useState("2");
  const [rows, setRows] = useState<SplitRow[]>(() => equalRows(balance, 2, []));

  const splitSum = round2(rows.reduce((s, r) => s + (Number(r.amount) || 0), 0));
  const splitDiff = round2(balance - splitSum);
  const splitValid =
    rows.length >= 2 && rows.every((r) => Number(r.amount) > 0) && Math.abs(splitDiff) < 0.01;

  const openSplit = (open: boolean) => {
    if (open) {
      setRows(equalRows(balance, Number(people), rows));
      if (isRoomCharge) onPaymentModeChange("Cash");
    }
    onSplitOpenChange?.(open);
  };

  const changeKind = (kind: SplitKind) => {
    setSplitKind(kind);
    if (kind === "equal") setRows(equalRows(balance, Number(people), rows));
  };

  const changePeople = (value: string) => {
    setPeople(value);
    if (Number(value) >= 2) setRows(equalRows(balance, Number(value), rows));
  };

  const updateRow = (idx: number, patch: Partial<SplitRow>) =>
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const addRow = () =>
    setRows((prev) => [...prev, { mode: "Cash", amount: Math.max(0, splitDiff).toFixed(2) }]);

  const removeRow = (idx: number) => setRows((prev) => prev.filter((_, i) => i !== idx));

  const confirmSplit = () => {
    if (!splitValid) return;
    onConfirmSplit?.(rows.map((r) => ({ mode: r.mode, amount: round2(Number(r.amount)) })));
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 text-center">
        <h2 className="text-lg font-semibold text-slate-900">Settle F&B Bill</h2>
        {orderLabel && (
          <p className="mt-1 text-sm font-medium text-slate-700">{orderLabel}</p>
        )}
        {(tableRef || outletLabel) && (
          <p className="mt-0.5 text-xs text-slate-500">
            {[tableRef ? `Room ${tableRef}` : null, outletLabel]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </div>

      <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>{breakdown.taxIncluded ? "Food (taxable value)" : "Food subtotal"}</span>
          <span className="font-mono font-semibold text-slate-900">
            {formatINRExact(breakdown.subtotal)}
          </span>
        </div>
        {breakdown.discount > 0 && (
          <div className="flex justify-between text-slate-600">
            <span>Discount</span>
            <span className="font-mono font-semibold text-emerald-700">
              − {formatINRExact(breakdown.discount)}
            </span>
          </div>
        )}
        {taxLines.length > 0 ? (
          taxLines.map((line) => (
            <div key={`${line.name}-${line.rate}`} className="flex justify-between text-slate-600">
              <span>{taxLineLabel(line)}</span>
              <span className="font-mono font-semibold text-slate-900">
                {formatINRExact(line.amount)}
              </span>
            </div>
          ))
        ) : (
          <div className="flex justify-between text-slate-600">
            <span>Tax</span>
            <span className="font-mono font-semibold text-slate-900">
              {formatINRExact(breakdown.tax)}
            </span>
          </div>
        )}
        {taxLines.length > 1 && (
          <div className="flex justify-between text-xs text-slate-500">
            <span>Total tax</span>
            <span className="font-mono">{formatINRExact(breakdown.tax)}</span>
          </div>
        )}
        {breakdown.taxIncluded && breakdown.tax > 0 && (
          <p className="text-[11px] text-slate-500">Tax is included in menu prices.</p>
        )}
        {roundOff !== 0 && (
          <div className="flex justify-between text-slate-600">
            <span>Round off</span>
            <span className="font-mono font-semibold text-slate-900">
              {roundOff > 0 ? "+" : "−"} {formatINRExact(Math.abs(roundOff))}
            </span>
          </div>
        )}
        <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
          <span>Grand total</span>
          <span className="font-mono text-emerald-800">
            {formatINRExact(breakdown.total)}
          </span>
        </div>
        {paid > 0 && (
          <>
            <div className="flex justify-between text-slate-600">
              <span>Already paid</span>
              <span className="font-mono font-semibold text-emerald-700">
                − {formatINRExact(paid)}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-900">
              <span>Balance due</span>
              <span className="font-mono text-amber-700">{formatINRExact(balance)}</span>
            </div>
          </>
        )}
      </div>

      <div className="mt-5 mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          How would you like to settle this bill?
        </p>
        {onConfirmSplit && balance > 0 && (
          <button
            type="button"
            onClick={() => openSplit(!splitOpen)}
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold transition",
              splitOpen
                ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                : "border-slate-200 text-slate-700 hover:border-emerald-300",
            )}
          >
            <SplitSquareHorizontal className="h-3.5 w-3.5" />
            {splitOpen ? "Single payment" : "Split bill"}
          </button>
        )}
      </div>

      {splitOpen ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {(["equal", "custom"] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => changeKind(kind)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm font-semibold transition",
                  splitKind === kind
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-100"
                    : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300",
                )}
              >
                {kind === "equal" ? "Split equally" : "Custom amounts"}
              </button>
            ))}
          </div>

          {splitKind === "equal" && (
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <Users className="h-4 w-4" />
              Number of people
              <input
                type="number"
                min={2}
                max={20}
                value={people}
                onChange={(e) => changePeople(e.target.value)}
                className="h-9 w-20 rounded-lg border border-slate-200 px-2 text-sm font-mono outline-none focus:border-emerald-500"
              />
            </label>
          )}

          <ul className="space-y-2">
            {rows.map((row, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="w-14 shrink-0 text-xs font-semibold text-slate-500">
                  Part {idx + 1}
                </span>
                <select
                  value={row.mode}
                  onChange={(e) => updateRow(idx, { mode: e.target.value })}
                  className="h-9 rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-emerald-500"
                >
                  {BASE_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={row.amount}
                  readOnly={splitKind === "equal"}
                  onChange={(e) => updateRow(idx, { amount: e.target.value })}
                  className={cn(
                    "h-9 min-w-0 flex-1 rounded-lg border border-slate-200 px-2 text-sm font-mono outline-none focus:border-emerald-500",
                    splitKind === "equal" && "bg-slate-50",
                  )}
                />
                {splitKind === "custom" && rows.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Remove part ${idx + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>

          {splitKind === "custom" && (
            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              <Plus className="h-3.5 w-3.5" />
              Add part
            </button>
          )}

          <div
            className={cn(
              "flex justify-between rounded-lg px-3 py-2 text-xs font-semibold",
              Math.abs(splitDiff) < 0.01
                ? "bg-emerald-50 text-emerald-800"
                : "bg-amber-50 text-amber-800",
            )}
          >
            <span>
              {Math.abs(splitDiff) < 0.01
                ? "Parts match the balance"
                : splitDiff > 0
                  ? "Still to allocate"
                  : "Over by"}
            </span>
            <span className="font-mono">{formatINRExact(Math.abs(splitDiff))}</span>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {BASE_METHODS.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onPaymentModeChange(mode)}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-sm font-semibold transition",
                  paymentMode === mode
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-100"
                    : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300",
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          {showRoomCharge && (
            <button
              type="button"
              onClick={() => onPaymentModeChange(ROOM_CHARGE_MODE)}
              className={cn(
                "mt-2 flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition",
                isRoomCharge
                  ? "border-emerald-700 bg-emerald-700 text-white ring-2 ring-emerald-200"
                  : "border-slate-300 bg-white text-slate-800 hover:border-emerald-400",
              )}
            >
              <Wallet className="h-4 w-4" />
              Room Charge
            </button>
          )}

          {isRoomCharge ? (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
              The F&B bill will be marked settled. The charge posts to the guest folio
              and remains outstanding until hotel checkout.
            </p>
          ) : (
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Amount received
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={amountPaid}
                onChange={(e) => onAmountPaidChange(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-mono outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-2"
              />
            </div>
          )}
        </>
      )}

      <Button
        type="button"
        className="mt-5 w-full bg-emerald-700 hover:bg-emerald-800"
        disabled={disabled || loading || (splitOpen && !splitValid)}
        onClick={splitOpen ? confirmSplit : onConfirm}
      >
        {loading ? (
          "Settling…"
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            {splitOpen ? `Settle in ${rows.length} parts` : "Confirm Settlement"}
          </>
        )}
      </Button>
    </div>
  );
}
