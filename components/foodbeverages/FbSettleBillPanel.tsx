"use client";

import { CreditCard, Wallet } from "lucide-react";
import { formatINR } from "@/app/data/foodbeverages/ops";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export type BillBreakdown = {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
};

const BASE_METHODS = ["Cash", "Card", "UPI"] as const;
export const ROOM_CHARGE_MODE = "Room Charge";

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
  loading = false,
  disabled = false,
}: Props) {
  const isRoomCharge = paymentMode === ROOM_CHARGE_MODE;
  const showRoomCharge =
    formType === "Room Service" && hasInHouseGuest;
  const methods = showRoomCharge
    ? [...BASE_METHODS, ROOM_CHARGE_MODE]
    : [...BASE_METHODS];

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
          <span>Food subtotal</span>
          <span className="font-mono font-semibold text-slate-900">
            {formatINR(breakdown.subtotal)}
          </span>
        </div>
        {breakdown.discount > 0 && (
          <div className="flex justify-between text-slate-600">
            <span>Discount</span>
            <span className="font-mono font-semibold text-emerald-700">
              − {formatINR(breakdown.discount)}
            </span>
          </div>
        )}
        <div className="flex justify-between text-slate-600">
          <span>Tax</span>
          <span className="font-mono font-semibold text-slate-900">
            {formatINR(breakdown.tax)}
          </span>
        </div>
        <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
          <span>Grand total</span>
          <span className="font-mono text-emerald-800">
            {formatINR(breakdown.total)}
          </span>
        </div>
      </div>

      <p className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        How would you like to settle this bill?
      </p>

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

      <Button
        type="button"
        className="mt-5 w-full bg-emerald-700 hover:bg-emerald-800"
        disabled={disabled || loading}
        onClick={onConfirm}
      >
        {loading ? (
          "Settling…"
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Confirm Settlement
          </>
        )}
      </Button>
    </div>
  );
}
