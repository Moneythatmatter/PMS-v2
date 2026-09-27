"use client";

import { useMemo } from "react";
import { Plus, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField, TextInput } from "@/components/frontoffice/ui";
import { SearchSelect } from "@/components/frontoffice/SearchSelect";
import {
  countries,
  genders,
  idProofTypes,
  nationalities,
  states,
} from "@/app/data/frontoffice/constants";
import type { GuestDetails } from "./GuestDetailsSection";

const inputClass = "rounded-xl";

function toOptions(values: readonly string[]) {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    unique.push(value);
  }
  return unique.map((v) => ({ id: v, label: v }));
}

/** Full companion profile — same fields as primary staying guest. */
export type RoomGuestDraft = GuestDetails & {
  id: string;
};

export function emptyRoomGuest(): RoomGuestDraft {
  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `g-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    firstName: "",
    lastName: "",
    mobile: "",
    email: "",
    gender: "",
    dob: "",
    nationality: "",
    address: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
    idProofType: "",
    idNumber: "",
  };
}

export function formatRoomGuestName(g: {
  firstName?: string;
  lastName?: string;
}) {
  return [g.firstName, g.lastName]
    .map((p) => String(p ?? "").trim())
    .filter(Boolean)
    .join(" ");
}

export function serializeRoomGuests(
  primary: GuestDetails,
  companions: RoomGuestDraft[],
): string {
  const lines: string[] = [];
  const primaryName = formatRoomGuestName(primary);
  if (primaryName || primary.mobile || primary.email) {
    lines.push(
      [
        "Primary",
        primaryName || "Guest",
        primary.mobile ? `Mob ${primary.mobile}` : "",
        primary.email ? `Email ${primary.email}` : "",
        primary.gender || "",
        primary.idProofType && primary.idNumber
          ? `${primary.idProofType}:${primary.idNumber}`
          : "",
      ]
        .filter(Boolean)
        .join(" · "),
    );
  }
  companions.forEach((g, i) => {
    const name = formatRoomGuestName(g) || `Companion ${i + 1}`;
    lines.push(
      [
        "Companion",
        name,
        g.mobile ? `Mob ${g.mobile}` : "",
        g.email ? `Email ${g.email}` : "",
        g.gender || "",
        g.idProofType && g.idNumber ? `${g.idProofType}:${g.idNumber}` : "",
      ]
        .filter(Boolean)
        .join(" · "),
    );
  });
  if (!lines.length) return "";
  return `Room guests:\n${lines.map((l) => `- ${l}`).join("\n")}`;
}

interface RoomGuestsSectionProps {
  guests: RoomGuestDraft[];
  onChange: (guests: RoomGuestDraft[]) => void;
  errors?: Record<string, string>;
  maxGuests?: number;
  onIdentityBlur?: (
    guestId: string,
    field: "mobile" | "email" | "idNumber",
  ) => void;
}

export function RoomGuestsSection({
  guests,
  onChange,
  errors = {},
  maxGuests = 7,
  onIdentityBlur,
}: RoomGuestsSectionProps) {
  const genderOptions = useMemo(() => toOptions(genders), []);
  const nationalityOptions = useMemo(() => toOptions(nationalities), []);
  const stateOptions = useMemo(() => toOptions(states), []);
  const countryOptions = useMemo(() => toOptions(countries), []);
  const idProofOptions = useMemo(() => toOptions(idProofTypes), []);

  function updateGuest(id: string, patch: Partial<Omit<RoomGuestDraft, "id">>) {
    onChange(guests.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }

  function addGuest() {
    if (guests.length >= maxGuests) return;
    onChange([...guests, emptyRoomGuest()]);
  }

  function removeGuest(id: string) {
    onChange(guests.filter((g) => g.id !== id));
  }

  return (
    <div className="space-y-4 sm:col-span-2 lg:col-span-3">
      {guests.map((guest, index) => (
        <div
          key={guest.id}
          className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
                <User className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Additional guest {index + 1}
                </p>
                <p className="text-[11px] text-slate-500">
                  Full profile — saved to guest master & booking guest list
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeGuest(guest.id)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-red-600"
              aria-label="Remove guest"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              label="First name"
              required
              error={errors[`${guest.id}.firstName`]}
            >
              <TextInput
                className={inputClass}
                value={guest.firstName ?? ""}
                placeholder="First name"
                onChange={(e) =>
                  updateGuest(guest.id, { firstName: e.target.value })
                }
              />
            </FormField>
            <FormField
              label="Last name"
              required
              error={errors[`${guest.id}.lastName`]}
            >
              <TextInput
                className={inputClass}
                value={guest.lastName ?? ""}
                placeholder="Last name"
                onChange={(e) =>
                  updateGuest(guest.id, { lastName: e.target.value })
                }
              />
            </FormField>
            <FormField
              label="Mobile"
              required
              error={errors[`${guest.id}.mobile`]}
            >
              <TextInput
                className={inputClass}
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={guest.mobile ?? ""}
                placeholder="10-digit mobile"
                onChange={(e) =>
                  updateGuest(guest.id, {
                    mobile: e.target.value.replace(/\D/g, "").slice(0, 10),
                  })
                }
                onBlur={
                  onIdentityBlur
                    ? () => onIdentityBlur(guest.id, "mobile")
                    : undefined
                }
              />
            </FormField>
            <FormField
              label="Email"
              required
              error={errors[`${guest.id}.email`]}
            >
              <TextInput
                className={inputClass}
                type="email"
                value={guest.email ?? ""}
                placeholder="guest@email.com"
                onChange={(e) =>
                  updateGuest(guest.id, { email: e.target.value })
                }
                onBlur={
                  onIdentityBlur
                    ? () => onIdentityBlur(guest.id, "email")
                    : undefined
                }
              />
            </FormField>
            <FormField
              label="Gender"
              required
              error={errors[`${guest.id}.gender`]}
            >
              <SearchSelect
                options={genderOptions}
                selectedId={guest.gender || null}
                placeholder="Search gender…"
                inputClassName={inputClass}
                onSelect={(opt) => updateGuest(guest.id, { gender: opt.id })}
                onClear={() => updateGuest(guest.id, { gender: "" })}
              />
            </FormField>
            <FormField
              label="Date of Birth"
              required
              error={errors[`${guest.id}.dob`]}
            >
              <TextInput
                className={inputClass}
                type="date"
                value={guest.dob}
                onChange={(e) => updateGuest(guest.id, { dob: e.target.value })}
              />
            </FormField>
            <FormField
              label="Nationality"
              required
              error={errors[`${guest.id}.nationality`]}
            >
              <SearchSelect
                options={nationalityOptions}
                selectedId={guest.nationality || null}
                placeholder="Search nationality…"
                inputClassName={inputClass}
                allowCustom
                onSelect={(opt) =>
                  updateGuest(guest.id, { nationality: opt.id })
                }
                onClear={() => updateGuest(guest.id, { nationality: "" })}
              />
            </FormField>
            <FormField
              label="Address"
              required
              error={errors[`${guest.id}.address`]}
              className="sm:col-span-2"
            >
              <TextInput
                className={inputClass}
                value={guest.address}
                placeholder="Street address"
                onChange={(e) =>
                  updateGuest(guest.id, { address: e.target.value })
                }
              />
            </FormField>
            <FormField label="City" required error={errors[`${guest.id}.city`]}>
              <TextInput
                className={inputClass}
                value={guest.city}
                placeholder="City"
                onChange={(e) => updateGuest(guest.id, { city: e.target.value })}
              />
            </FormField>
            <FormField
              label="State / Province"
              required
              error={errors[`${guest.id}.state`]}
            >
              <SearchSelect
                options={stateOptions}
                selectedId={guest.state || null}
                placeholder="Search state…"
                inputClassName={inputClass}
                allowCustom
                onSelect={(opt) => updateGuest(guest.id, { state: opt.id })}
                onClear={() => updateGuest(guest.id, { state: "" })}
              />
            </FormField>
            <FormField
              label="Country"
              required
              error={errors[`${guest.id}.country`]}
            >
              <SearchSelect
                options={countryOptions}
                selectedId={guest.country || null}
                placeholder="Search country…"
                inputClassName={inputClass}
                allowCustom
                onSelect={(opt) => updateGuest(guest.id, { country: opt.id })}
                onClear={() => updateGuest(guest.id, { country: "" })}
              />
            </FormField>
            <FormField
              label="Pincode / Zip"
              required
              error={errors[`${guest.id}.pincode`]}
            >
              <TextInput
                className={inputClass}
                maxLength={6}
                value={guest.pincode}
                placeholder="6-digit pincode"
                onChange={(e) =>
                  updateGuest(guest.id, {
                    pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                  })
                }
              />
            </FormField>
            <FormField
              label="ID Proof Type"
              required
              error={errors[`${guest.id}.idProofType`]}
            >
              <SearchSelect
                options={idProofOptions}
                selectedId={guest.idProofType || null}
                placeholder="Search ID proof…"
                inputClassName={inputClass}
                onSelect={(opt) =>
                  updateGuest(guest.id, { idProofType: opt.id })
                }
                onClear={() => updateGuest(guest.id, { idProofType: "" })}
              />
            </FormField>
            <FormField
              label="ID Document Number"
              required
              error={errors[`${guest.id}.idNumber`]}
            >
              <TextInput
                className={inputClass}
                value={guest.idNumber}
                placeholder="e.g. Aadhar / Passport No"
                onChange={(e) =>
                  updateGuest(guest.id, { idNumber: e.target.value })
                }
                onBlur={
                  onIdentityBlur
                    ? () => onIdentityBlur(guest.id, "idNumber")
                    : undefined
                }
              />
            </FormField>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={guests.length >= maxGuests}
        onClick={addGuest}
        className="gap-1.5"
      >
        <Plus className="h-3.5 w-3.5" />
        Add more guest
      </Button>
    </div>
  );
}
