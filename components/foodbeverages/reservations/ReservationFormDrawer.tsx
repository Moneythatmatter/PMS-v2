"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, Check, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { FormField, SelectInput, TextAreaInput, TextInput } from "@/components/frontoffice/ui";
import { ProcurementFormSection } from "@/components/purchase-stores/ui/ProcurementFormParts";
import { usePsList } from "@/hooks/usePsResource";
import { ApiError } from "@/services/api";
import { fbReservationService, liveTableService, type FbOutlet } from "@/services/food-beverages";
import {
  DURATION_PRESETS,
  formatClock,
  formatDuration,
  isActiveBooking,
  localDateKey,
  previewWindow,
  settingsForOutlet,
  windowsOverlap,
  type Reservation,
  type ReservationInput,
  type ReservationSettingsBundle,
} from "@/app/data/foodbeverages/reservations";
import { GROUP_INPUT, InputGroup } from "../ui/InputGroup";

const splitTables = (v: string) => v.split(/[+,]/).map((t) => t.trim()).filter(Boolean);
const norm = (v: string) => v.trim().toLowerCase();

export function ReservationFormDrawer({
  open,
  onClose,
  initial,
  defaultDate,
  defaultOutletId,
  outlets,
  settings,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial: Reservation | null;
  defaultDate: string;
  defaultOutletId: string;
  outlets: FbOutlet[];
  settings: ReservationSettingsBundle | null;
  onSaved: (reservation: Reservation, message: string) => void;
}) {
  const startOutlet = initial?.outletId || defaultOutletId || outlets[0]?.id || "";
  const [guest, setGuest] = useState(initial?.guest ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [date, setDate] = useState(initial?.reservationDate ?? defaultDate);
  const [time, setTime] = useState(initial?.reservationDate ? initial.time : "");
  const [covers, setCovers] = useState(String(initial?.covers || 2));
  const [outletId, setOutletId] = useState(startOutlet);
  const [tableNos, setTableNos] = useState<string[]>(initial ? splitTables(initial.tableNo) : []);
  const [durationMin, setDurationMin] = useState(
    String(initial?.durationMin ?? settingsForOutlet(settings, startOutlet).defaultDurationMin),
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [errors, setErrors] = useState<string[]>([]);
  const [conflict, setConflict] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const tables = usePsList(() => (outletId ? liveTableService.list(outletId) : Promise.resolve([])), [outletId]);
  const bookings = usePsList(
    () => (outletId && date ? fbReservationService.list({ date, outletId }) : Promise.resolve([] as Reservation[])),
    [outletId, date],
  );

  const outletSettings = settingsForOutlet(settings, outletId);
  const duration = Math.floor(Number(durationMin) || 0);
  const guestCount = Math.floor(Number(covers) || 0);
  const win = useMemo(() => previewWindow(date, time, duration, outletSettings), [date, time, duration, outletSettings]);
  const today = localDateKey();

  const tableInfo = useMemo(() => {
    const map = new Map<string, { clash: Reservation | null; capacity: number }>();
    for (const t of tables.data) {
      const clash =
        (win &&
          bookings.data.find(
            (b) =>
              b.id !== initial?.id &&
              isActiveBooking(b) &&
              b.blockFrom &&
              b.endsAt &&
              b.tableNos.some((x) => norm(x) === norm(t.tableNo)) &&
              windowsOverlap(win.blockFrom, win.endsAt, b.blockFrom, b.endsAt),
          )) ||
        null;
      map.set(norm(t.tableNo), { clash, capacity: Number(t.capacity) || 0 });
    }
    return map;
  }, [tables.data, bookings.data, win, initial?.id]);

  const selectedSeats = tableNos.reduce((s, t) => s + (tableInfo.get(norm(t))?.capacity ?? 0), 0);
  const selectedClashes = tableNos.map((t) => tableInfo.get(norm(t))?.clash).filter(Boolean) as Reservation[];

  const toggleTable = (tableNo: string) =>
    setTableNos((prev) => (prev.some((t) => norm(t) === norm(tableNo)) ? prev.filter((t) => norm(t) !== norm(tableNo)) : [...prev, tableNo]));

  const changeOutlet = (next: string) => {
    setOutletId(next);
    setTableNos([]);
    if (!initial) setDurationMin(String(settingsForOutlet(settings, next).defaultDurationMin));
  };

  const validate = () => {
    const out: string[] = [];
    if (!guest.trim()) out.push("Enter the guest's name.");
    if (phone.trim() && !/^\+?[\d\s-]{7,16}$/.test(phone.trim())) out.push("Enter a valid phone number.");
    if (!date) out.push("Pick a date.");
    if (!time) out.push("Pick a time.");
    if (guestCount < 1) out.push("Guest count must be at least 1.");
    if (!outletId) out.push("Choose an outlet.");
    if (tableNos.length === 0) out.push("Choose at least one table.");
    if (duration < 15 || duration > 720) out.push("Dining duration must be between 15 minutes and 12 hours.");
    const scheduleChanged = !initial || initial.reservationDate !== date || initial.time !== time;
    if (win && scheduleChanged && new Date(win.startsAt).getTime() < Date.now() - 5 * 60_000) {
      out.push("That date and time has already passed.");
    }
    return out;
  };

  const save = async (override = false) => {
    const problems = validate();
    setErrors(problems);
    if (problems.length > 0) return;
    const body: ReservationInput = {
      guest: guest.trim(),
      phone: phone.trim(),
      reservationDate: date,
      time,
      covers: guestCount,
      outletId,
      tableNo: tableNos.join("+"),
      durationMin: duration,
      notes: notes.trim(),
      ...(override ? { override: true } : {}),
    };
    setSaving(true);
    try {
      const saved = initial
        ? await fbReservationService.update(initial.id, body)
        : await fbReservationService.create(body);
      onSaved(saved, initial ? `${saved.resNo} updated.` : `${saved.resNo} booked for ${saved.guest}.`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setConflict(e.message);
      } else {
        setErrors([e instanceof Error ? e.message : "Could not save the reservation."]);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="2xl"
      title={initial ? `Edit ${initial.resNo}` : "New Reservation"}
      customHeader={
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 ring-1 ring-violet-100">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 id="drawer-title" className="truncate text-base font-bold text-slate-900 sm:text-lg">
              {initial ? `Edit Reservation · ${initial.resNo}` : "New Table Reservation"}
            </h2>
            <p className="truncate text-xs text-slate-500">
              The table is only held around the booking time; it stays open for walk-ins until then.
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            {tableNos.length ? (
              <>
                <strong className="text-slate-800">{tableNos.join(" + ")}</strong> · {selectedSeats} seats ·{" "}
              </>
            ) : null}
            <strong className="text-slate-800">{guestCount || 0}</strong> guest{guestCount === 1 ? "" : "s"} ·{" "}
            {formatDuration(duration)}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => save(false)} disabled={saving} className="!bg-violet-700 text-white hover:!bg-violet-800">
              {saving ? "Saving…" : initial ? "Save Changes" : "Book Table"}
            </Button>
          </div>
        </div>
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

        {conflict && (
          <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <div className="flex gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Table already held</p>
                <p className="mt-0.5 text-xs">{conflict}</p>
                <div className="mt-2 flex gap-2">
                  <Button
                    onClick={() => save(true)}
                    disabled={saving}
                    className="h-8 !bg-amber-600 px-3 text-xs font-bold text-white hover:!bg-amber-700"
                  >
                    Save anyway (override)
                  </Button>
                  <Button variant="outline" onClick={() => setConflict(null)} className="h-8 px-3 text-xs">
                    Change table or time
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <ProcurementFormSection step={1} title="Guest" subtitle="Who the table is booked for.">
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Guest Name" required className="sm:col-span-2">
              <TextInput value={guest} onChange={(e) => setGuest(e.target.value)} placeholder="e.g. Anita Desai" />
            </FormField>
            <FormField label="Guests" required>
              <InputGroup suffix="pax">
                <input
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  value={covers}
                  onChange={(e) => setCovers(e.target.value)}
                  className={GROUP_INPUT}
                />
              </InputGroup>
            </FormField>
            <FormField label="Phone" className="sm:col-span-2" helperText="Used to call the guest if they're running late.">
              <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 98765 43210" inputMode="tel" />
            </FormField>
          </div>
        </ProcurementFormSection>

        <ProcurementFormSection step={2} title="When" subtitle="Arrival time and how long the party will dine.">
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Date" required>
              <TextInput type="date" value={date} min={initial ? undefined : today} onChange={(e) => setDate(e.target.value)} />
            </FormField>
            <FormField label="Time" required>
              <TextInput type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </FormField>
            <FormField label="Dining duration" required>
              <InputGroup suffix="min">
                <input
                  type="number"
                  min={15}
                  max={720}
                  step={15}
                  inputMode="numeric"
                  value={durationMin}
                  onChange={(e) => setDurationMin(e.target.value)}
                  className={GROUP_INPUT}
                />
              </InputGroup>
            </FormField>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {DURATION_PRESETS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setDurationMin(String(m))}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition",
                  duration === m
                    ? "border-violet-500 bg-violet-50 text-violet-800"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                )}
              >
                {formatDuration(m)}
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/50 p-3">
            {win ? (
              <ol className="grid gap-2 text-xs sm:grid-cols-4">
                <WindowStep label="Table held from" value={formatClock(win.blockFrom)} hint={`${outletSettings.bufferBeforeMin} min before`} />
                <WindowStep label="Guest arrives" value={formatClock(win.startsAt)} hint="Booking time" strong />
                <WindowStep label="Auto no-show" value={formatClock(win.graceEndsAt)} hint={`${outletSettings.gracePeriodMin} min grace`} />
                <WindowStep label="Table free again" value={formatClock(win.endsAt)} hint={`after ${formatDuration(duration)}`} />
              </ol>
            ) : (
              <p className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="h-3.5 w-3.5" /> Pick a date and time to see when the table will be held.
              </p>
            )}
          </div>
        </ProcurementFormSection>

        <ProcurementFormSection
          step={3}
          title="Table"
          subtitle="Pick one table, or several to seat a large party together."
          action={
            outlets.length > 1 ? (
              <SelectInput value={outletId} onChange={(e) => changeOutlet(e.target.value)} className="block h-8 w-48 text-xs">
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </SelectInput>
            ) : null
          }
        >
          {tables.loading && tables.data.length === 0 ? (
            <p className="rounded-lg bg-slate-50 px-3 py-6 text-center text-xs text-slate-400">Loading tables…</p>
          ) : tables.data.length === 0 ? (
            <p className="rounded-lg bg-slate-50 px-3 py-6 text-center text-xs text-slate-400">This outlet has no tables yet.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {tables.data.map((t) => {
                const info = tableInfo.get(norm(t.tableNo));
                const on = tableNos.some((x) => norm(x) === norm(t.tableNo));
                const small = guestCount > 0 && tableNos.length <= 1 && (info?.capacity ?? 0) > 0 && (info?.capacity ?? 0) < guestCount;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTable(t.tableNo)}
                    className={cn(
                      "relative rounded-lg border px-3 py-2 text-left transition",
                      on
                        ? info?.clash
                          ? "border-amber-500 bg-amber-50 ring-1 ring-amber-500"
                          : "border-violet-500 bg-violet-50 ring-1 ring-violet-500"
                        : info?.clash
                          ? "border-dashed border-amber-300 bg-amber-50/40 hover:border-amber-400"
                          : "border-slate-200 bg-white hover:border-slate-300",
                    )}
                  >
                    {on && (
                      <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                    <span className="block text-sm font-bold text-slate-900">{t.tableNo}</span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Users className="h-3 w-3" /> {info?.capacity || "—"} seats{t.section ? ` · ${t.section}` : ""}
                    </span>
                    {info?.clash ? (
                      <span className="mt-1 block truncate text-[10px] font-semibold text-amber-700">
                        Held {formatClock(info.clash.blockFrom)}–{formatClock(info.clash.endsAt)} · {info.clash.guest}
                      </span>
                    ) : small ? (
                      <span className="mt-1 block text-[10px] font-semibold text-slate-500">Small for {guestCount}</span>
                    ) : win ? (
                      <span className="mt-1 block text-[10px] font-semibold text-emerald-700">Free for this slot</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
          {tableNos.length > 0 && guestCount > selectedSeats && selectedSeats > 0 && (
            <p className="mt-3 text-xs font-medium text-amber-700">
              {tableNos.join(" + ")} seat {selectedSeats}; the party is {guestCount}. Add a table or confirm extra chairs.
            </p>
          )}
          {selectedClashes.length > 0 && (
            <p className="mt-2 text-xs font-medium text-amber-700">
              Overlaps with {selectedClashes.map((c) => `${c.resNo} (${c.guest})`).join(", ")}. You can still save with an override.
            </p>
          )}
        </ProcurementFormSection>

        <ProcurementFormSection step={4} title="Notes" subtitle="Occasion, seating preference, allergies.">
          <TextAreaInput
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Anniversary, window seat, one high chair"
            className="min-h-[70px]"
          />
        </ProcurementFormSection>
      </div>
    </Drawer>
  );
}

function WindowStep({ label, value, hint, strong }: { label: string; value: string; hint: string; strong?: boolean }) {
  return (
    <li className="rounded-lg bg-white px-2.5 py-2 ring-1 ring-violet-100">
      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <span className={cn("block text-sm font-extrabold", strong ? "text-violet-800" : "text-slate-800")}>{value}</span>
      <span className="block text-[10px] text-slate-500">{hint}</span>
    </li>
  );
}
