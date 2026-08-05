"use client";

import React, { useMemo } from "react";
import { FormField, TextInput } from "@/components/frontoffice/ui";
import { SearchSelect } from "@/components/frontoffice/SearchSelect";
import {
  countries,
  genders,
  idProofTypes,
  nationalities,
  states,
} from "@/app/data/frontoffice/constants";

const inputClass = "rounded-xl";

function toOptions(values: readonly string[]) {
  return values.map((v) => ({ id: v, label: v }));
}

export type GuestDetails = {
  gender: string;
  dob: string;
  nationality: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  idProofType: string;
  idNumber: string;
};

interface GuestDetailsSectionProps {
  guestDetails: GuestDetails;
  onChange: (key: string, value: string) => void;
  onFileUpload?: (filename: string) => void;
  idFile?: string;
}

export function GuestDetailsSection({
  guestDetails,
  onChange,
  onFileUpload,
  idFile,
}: GuestDetailsSectionProps) {
  const genderOptions = useMemo(() => toOptions(genders), []);
  const nationalityOptions = useMemo(() => toOptions(nationalities), []);
  const stateOptions = useMemo(() => toOptions(states), []);
  const countryOptions = useMemo(() => toOptions(countries), []);
  const idProofOptions = useMemo(() => toOptions(idProofTypes), []);

  return (
    <>
      <FormField label="Gender" required>
        <SearchSelect
          options={genderOptions}
          selectedId={guestDetails.gender || null}
          placeholder="Search gender…"
          inputClassName={inputClass}
          onSelect={(opt) => onChange("gender", opt.id)}
          onClear={() => onChange("gender", "")}
        />
      </FormField>

      <FormField label="Date of Birth" required>
        <TextInput
          type="date"
          className={inputClass}
          value={guestDetails.dob}
          onChange={(e) => onChange("dob", e.target.value)}
        />
      </FormField>

      <FormField label="Nationality" required>
        <SearchSelect
          options={nationalityOptions}
          selectedId={guestDetails.nationality || null}
          placeholder="Search nationality…"
          inputClassName={inputClass}
          onSelect={(opt) => onChange("nationality", opt.id)}
          onClear={() => onChange("nationality", "")}
        />
      </FormField>

      <FormField label="Address" required>
        <TextInput
          className={inputClass}
          placeholder="Street address"
          value={guestDetails.address}
          onChange={(e) => onChange("address", e.target.value)}
        />
      </FormField>

      <FormField label="City" required>
        <TextInput
          className={inputClass}
          placeholder="City name"
          value={guestDetails.city}
          onChange={(e) => onChange("city", e.target.value)}
        />
      </FormField>

      <FormField label="State / Province" required>
        <SearchSelect
          options={stateOptions}
          selectedId={guestDetails.state || null}
          placeholder="Search state…"
          inputClassName={inputClass}
          onSelect={(opt) => onChange("state", opt.id)}
          onClear={() => onChange("state", "")}
        />
      </FormField>

      <FormField label="Country" required>
        <SearchSelect
          options={countryOptions}
          selectedId={guestDetails.country || null}
          placeholder="Search country…"
          inputClassName={inputClass}
          onSelect={(opt) => onChange("country", opt.id)}
          onClear={() => onChange("country", "")}
        />
      </FormField>

      <FormField label="Pincode / Zip" required>
        <TextInput
          className={inputClass}
          placeholder="6-digit pincode"
          value={guestDetails.pincode}
          onChange={(e) => onChange("pincode", e.target.value)}
        />
      </FormField>

      <FormField label="ID Proof Type" required>
        <SearchSelect
          options={idProofOptions}
          selectedId={guestDetails.idProofType || null}
          placeholder="Search ID proof…"
          inputClassName={inputClass}
          onSelect={(opt) => onChange("idProofType", opt.id)}
          onClear={() => onChange("idProofType", "")}
        />
      </FormField>

      <FormField label="ID Document Number" required>
        <TextInput
          className={inputClass}
          placeholder="e.g. Aadhar / Passport No"
          value={guestDetails.idNumber}
          onChange={(e) => onChange("idNumber", e.target.value)}
        />
      </FormField>

      {onFileUpload && (
        <FormField label="Upload ID Document" required>
          <div className="flex items-center gap-3">
            <input
              type="file"
              id="id-file-upload"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFileUpload(file.name);
              }}
            />
            <label
              htmlFor="id-file-upload"
              className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Choose File
            </label>
            {idFile ? (
              <span className="text-xs font-medium text-emerald-700">{idFile}</span>
            ) : (
              <span className="text-xs text-slate-400">No file chosen</span>
            )}
          </div>
        </FormField>
      )}
    </>
  );
}
