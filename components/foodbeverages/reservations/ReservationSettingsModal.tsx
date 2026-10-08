"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/frontoffice/ui/Modal";
import { reservationSettingsService, type FbOutlet } from "@/services/food-beverages";
import {
  DEFAULT_RESERVATION_SETTINGS,
  type ReservationSettings,
  type ReservationSettingsBundle,
} from "@/app/data/foodbeverages/reservations";
import { GROUP_INPUT, InputGroup } from "../ui/InputGroup";

type Values = { bufferBeforeMin: string; gracePeriodMin: string; defaultDurationMin: string };
type OutletRow = Values & { custom: boolean; existed: boolean };

const toValues = (s: ReservationSettings): Values => ({
  bufferBeforeMin: String(s.bufferBeforeMin),
  gracePeriodMin: String(s.gracePeriodMin),
  defaultDurationMin: String(s.defaultDurationMin),
});

const FIELDS: { key: keyof Values; label: string; hint: string; min: number; max: number }[] = [
  { key: "bufferBeforeMin", label: "Hold table before", hint: "Table turns Reserved this long before the booking", min: 0, max: 240 },
  { key: "gracePeriodMin", label: "No-show grace", hint: "Wait this long after the booking time, then release", min: 0, max: 240 },
  { key: "defaultDurationMin", label: "Default dining time", hint: "Pre-filled on new bookings", min: 15, max: 720 },
];

function check(v: Values, label: string) {
  return FIELDS.flatMap((f) => {
    const n = Number(v[f.key]);
    return Number.isInteger(n) && n >= f.min && n <= f.max ? [] : [`${label}: ${f.label} must be ${f.min}–${f.max} minutes.`];
  });
}

const toBody = (v: Values) => ({
  bufferBeforeMin: Number(v.bufferBeforeMin),
  gracePeriodMin: Number(v.gracePeriodMin),
  defaultDurationMin: Number(v.defaultDurationMin),
});

export function ReservationSettingsModal({
  open,
  onClose,
  settings,
  outlets,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  settings: ReservationSettingsBundle | null;
  outlets: FbOutlet[];
  onSaved: (bundle: ReservationSettingsBundle) => void;
}) {
  const global = settings?.global ?? DEFAULT_RESERVATION_SETTINGS;
  const [globalValues, setGlobalValues] = useState<Values>(toValues(global));
  const [rows, setRows] = useState<Record<string, OutletRow>>(() =>
    Object.fromEntries(
      outlets.map((o) => {
        const own = settings?.outlets.find((s) => s.scopeKey === o.id);
        return [o.id, { ...toValues(own ?? global), custom: Boolean(own), existed: Boolean(own) }];
      }),
    ),
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const setRow = (id: string, patch: Partial<OutletRow>) => setRows((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const save = async () => {
    const problems = [
      ...check(globalValues, "Default"),
      ...outlets.flatMap((o) => (rows[o.id]?.custom ? check(rows[o.id], o.name) : [])),
    ];
    setErrors(problems);
    if (problems.length) return;
    setSaving(true);
    try {
      let bundle = await reservationSettingsService.save("global", toBody(globalValues));
      for (const o of outlets) {
        const row = rows[o.id];
        if (!row) continue;
        if (row.custom) bundle = await reservationSettingsService.save(o.id, toBody(row));
        else if (row.existed) bundle = await reservationSettingsService.remove(o.id);
      }
      onSaved(bundle);
    } catch (e) {
      setErrors([e instanceof Error ? e.message : "Could not save settings."]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Reservation Settings"
      description="Controls when a booked table is held and when a missing guest is released."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving} className="!bg-violet-700 text-white hover:!bg-violet-800">
            {saving ? "Saving…" : "Save Settings"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {errors.length > 0 && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <ul className="list-disc space-y-0.5 pl-4">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        <section>
          <h3 className="text-sm font-semibold text-slate-900">Default for all outlets</h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            {FIELDS.map((f) => (
              <label key={f.key} className="block">
                <span className="text-xs font-semibold text-slate-700">{f.label}</span>
                <InputGroup suffix="min" className="mt-1">
                  <input
                    type="number"
                    min={f.min}
                    max={f.max}
                    step={5}
                    inputMode="numeric"
                    value={globalValues[f.key]}
                    onChange={(e) => setGlobalValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    className={GROUP_INPUT}
                  />
                </InputGroup>
                <span className="mt-1 block text-[11px] text-slate-500">{f.hint}</span>
              </label>
            ))}
          </div>
          <p className="mt-3 rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-900">
            Example: a 1:00 PM booking turns its table Reserved at{" "}
            <strong>{exampleTime(13 * 60 - (Number(globalValues.bufferBeforeMin) || 0))}</strong>, and is marked No Show at{" "}
            <strong>{exampleTime(13 * 60 + (Number(globalValues.gracePeriodMin) || 0))}</strong> if the guest hasn&apos;t arrived.
          </p>
        </section>

        {outlets.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-slate-900">Outlet overrides</h3>
            <p className="text-xs text-slate-500">Turn on to give an outlet its own timings.</p>
            <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200">
              {outlets.map((o) => {
                const row = rows[o.id];
                if (!row) return null;
                return (
                  <div key={o.id} className="grid items-center gap-3 px-3 py-2.5 sm:grid-cols-[180px_repeat(3,minmax(0,1fr))]">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                      <input
                        type="checkbox"
                        checked={row.custom}
                        onChange={(e) => setRow(o.id, e.target.checked ? { custom: true } : { ...toValues(global), custom: false })}
                        className="h-4 w-4 accent-violet-600"
                      />
                      <span className="truncate">{o.name}</span>
                    </label>
                    {FIELDS.map((f) => (
                      <InputGroup key={f.key} suffix="min" className={cn(!row.custom && "opacity-50")}>
                        <input
                          type="number"
                          min={f.min}
                          max={f.max}
                          step={5}
                          inputMode="numeric"
                          aria-label={`${o.name} ${f.label}`}
                          disabled={!row.custom}
                          value={row.custom ? row[f.key] : globalValues[f.key]}
                          onChange={(e) => setRow(o.id, { [f.key]: e.target.value })}
                          className={GROUP_INPUT}
                        />
                      </InputGroup>
                    ))}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </Modal>
  );
}

function exampleTime(totalMin: number) {
  const m = ((totalMin % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  return `${h % 12 || 12}:${String(m % 60).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
