"use client";

import React from "react";
import { FormField, SelectInput, TextInput, formatINR } from "@/components/frontoffice/ui";
import { paymentModes } from "@/app/data/frontoffice/constants";

const inputClass = "rounded-xl";

interface PaymentBillingSectionProps {
  paymentMode: string;
  onPaymentModeChange: (val: string) => void;
  deposit: number;
  onDepositChange: (val: number) => void;
  totalAmount: number;
}

export function PaymentBillingSection({
  paymentMode,
  onPaymentModeChange,
  deposit,
  onDepositChange,
  totalAmount,
}: PaymentBillingSectionProps) {
  const balance = Math.max(0, totalAmount - deposit);

  return (
    <>
      <FormField label="Payment Mode" required>
        <SelectInput
          className={inputClass}
          value={paymentMode}
          onChange={(e) => onPaymentModeChange(e.target.value)}
        >
          {paymentModes.map((mode) => (
            <option key={mode} value={mode}>{mode}</option>
          ))}
        </SelectInput>
      </FormField>

      <FormField label="Advance Deposit Collected (₹)">
        <TextInput
          type="number"
          min="0"
          className={inputClass}
          value={deposit || ""}
          onChange={(e) => onDepositChange(parseFloat(e.target.value) || 0)}
        />
      </FormField>

      <FormField label="Total Stay Cost">
        <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900">
          {formatINR(totalAmount)}
        </div>
      </FormField>

      <FormField label="Balance Due at Checkout">
        <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-emerald-700">
          {formatINR(balance)}
        </div>
      </FormField>
    </>
  );
}
