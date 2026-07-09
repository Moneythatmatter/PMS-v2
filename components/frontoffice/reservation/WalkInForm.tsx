"use client";

import { useMemo, useState } from "react";
import { Zap } from "lucide-react";
import { paymentModes, roomNumbers, roomTypes } from "@/app/data/frontoffice/constants";
import { Button } from "@/components/ui/Button";
import {
  AlertBanner,
  FormField,
  FormSection,
  FOPageHeader,
  SelectInput,
  TextInput,
  formatINR,
} from "@/components/frontoffice/ui";

const rates: Record<string, number> = {
  Standard: 3500,
  Deluxe: 5200,
  Suite: 8500,
  "Executive Suite": 12000,
};

export function WalkInForm() {
  const [form, setForm] = useState({
    guestName: "",
    mobile: "",
    roomType: "Standard",
    room: "112",
    adults: 1,
    nights: 1,
    paymentMode: "Cash",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);

  const rate = rates[form.roomType] ?? 3500;
  const total = rate * form.nights * form.adults;

  const availableRooms = useMemo(
    () => roomNumbers.filter((r) => r.startsWith(form.roomType === "Standard" ? "1" : form.roomType === "Deluxe" ? "2" : "5")),
    [form.roomType],
  );

  const update = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleCheckIn = () => {
    const next: Record<string, string> = {};
    if (!form.guestName.trim()) next.guestName = "Guest name is required";
    if (!form.mobile.trim()) next.mobile = "Mobile is required";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setToast(
      `Walk-in guest ${form.guestName} checked in to Room ${form.room}. Total collected: ${formatINR(total)}`,
    );
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {toast && (
        <AlertBanner variant="success" message={toast} onDismiss={() => setToast(null)} />
      )}

      <FOPageHeader
        eyebrow="Reservations"
        title="Walk-in Guest"
        description="Quick booking and immediate check-in for walk-in arrivals."
        badge={
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            <Zap className="h-4 w-4" />
            Express Check-in
          </div>
        }
      />

      <FormSection title="Quick Booking" columns={2}>
        <FormField label="Guest Name" required>
          <TextInput
            placeholder="Full name"
            value={form.guestName}
            onChange={(e) => update("guestName", e.target.value)}
          />
          {errors.guestName && <p className="text-xs text-red-500">{errors.guestName}</p>}
        </FormField>
        <FormField label="Mobile" required>
          <TextInput
            placeholder="+91 XXXXX XXXXX"
            value={form.mobile}
            onChange={(e) => update("mobile", e.target.value)}
          />
          {errors.mobile && <p className="text-xs text-red-500">{errors.mobile}</p>}
        </FormField>
        <FormField label="Room Type">
          <SelectInput
            value={form.roomType}
            onChange={(e) => update("roomType", e.target.value)}
          >
            {roomTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </SelectInput>
        </FormField>
        <FormField label="Room">
          <SelectInput value={form.room} onChange={(e) => update("room", e.target.value)}>
            {(availableRooms.length > 0 ? availableRooms : roomNumbers).map((r) => (
              <option key={r} value={r}>
                {r} — {form.roomType}
              </option>
            ))}
          </SelectInput>
        </FormField>
        <FormField label="Adults">
          <TextInput
            type="number"
            min={1}
            value={form.adults}
            onChange={(e) => update("adults", Number(e.target.value))}
          />
        </FormField>
        <FormField label="Nights">
          <TextInput
            type="number"
            min={1}
            value={form.nights}
            onChange={(e) => update("nights", Number(e.target.value))}
          />
        </FormField>
        <FormField label="Rate / Night">
          <TextInput type="number" value={rate} readOnly />
        </FormField>
        <FormField label="Payment Mode">
          <SelectInput
            value={form.paymentMode}
            onChange={(e) => update("paymentMode", e.target.value)}
          >
            {paymentModes.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </SelectInput>
        </FormField>
      </FormSection>

      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-sm text-slate-500">Total Amount</p>
          <p className="text-2xl font-bold text-slate-900">{formatINR(total)}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {form.nights} night{form.nights !== 1 ? "s" : ""} × {formatINR(rate)} × {form.adults} guest{form.adults !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={handleCheckIn}
          className="w-full gap-1.5 bg-blue-600 hover:bg-blue-700 sm:w-auto"
        >
          <Zap className="h-4 w-4" />
          Check In & Collect Payment
        </Button>
      </div>
    </div>
  );
}
