"use client";

import { useState } from "react";
import type { ReservationBooking } from "@/app/data/types";
import type { FolioChargeCategory } from "@/services/billing";
import { folioChargeService } from "@/services/front-office";
import { Button } from "@/components/ui/Button";
import {
  AlertBanner,
  Drawer,
  FormField,
  SelectInput,
  TextInput,
  formatINR,
} from "@/components/frontoffice/ui";

export const CHARGE_CATEGORY_LABELS: Record<FolioChargeCategory, string> = {
  FOOD_BEVERAGE: "Food & Beverage",
  MINIBAR: "Mini Bar",
  LAUNDRY: "Laundry",
  OTHER: "Other / Miscellaneous",
};

export function BookingAddChargeDrawer({
  booking,
  onClose,
  onPosted,
}: {
  booking: ReservationBooking;
  onClose: () => void;
  onPosted: (amount: number) => void;
}) {
  const [category, setCategory] = useState<FolioChargeCategory>("OTHER");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qty = Number(quantity) || 0;
  const price = Number(unitPrice) || 0;
  const amount = Math.round(qty * price * 100) / 100;

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError("Enter what the charge is for.");
      return;
    }
    if (qty <= 0 || price <= 0) {
      setError("Quantity and rate must be greater than 0.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await folioChargeService.post({
        bookingId: booking.id,
        chargeCategory: category,
        description: description.trim(),
        quantity: qty,
        unitPrice: price,
      });
      onPosted(amount);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to post charge");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title="Add Charge"
      description={`${booking.guestName ?? "Guest"} · Room ${booking.roomNo || "TBA"}`}
      width="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            className="bg-emerald-700 hover:bg-emerald-800"
            onClick={() => void handleSubmit()}
            disabled={submitting || amount <= 0}
          >
            {submitting ? "Posting…" : `Post ${amount > 0 ? formatINR(amount) : "Charge"}`}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <AlertBanner variant="error" message={error} onDismiss={() => setError(null)} />}
        <FormField label="Category" required>
          <SelectInput
            value={category}
            onChange={(e) => setCategory(e.target.value as FolioChargeCategory)}
          >
            {(Object.keys(CHARGE_CATEGORY_LABELS) as FolioChargeCategory[]).map((key) => (
              <option key={key} value={key}>
                {CHARGE_CATEGORY_LABELS[key]}
              </option>
            ))}
          </SelectInput>
        </FormField>
        <FormField label="Description" required>
          <TextInput
            value={description}
            maxLength={200}
            placeholder="e.g. Extra bed, airport pickup, damaged towel"
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Quantity" required>
            <TextInput
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </FormField>
          <FormField label="Rate (₹)" required>
            <TextInput
              type="number"
              min="0"
              step="0.01"
              value={unitPrice}
              placeholder="0.00"
              onChange={(e) => setUnitPrice(e.target.value)}
            />
          </FormField>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <span className="text-slate-600">Amount added to folio</span>
          <span className="text-base font-bold text-slate-900">{formatINR(amount)}</span>
        </div>
      </div>
    </Drawer>
  );
}
