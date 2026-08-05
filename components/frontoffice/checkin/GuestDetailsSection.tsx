"use client";

import React, { useMemo } from "react";
import { FormField, TextInput } from "@/components/frontoffice/ui";
import { SearchSelect } from "@/components/frontoffice/SearchSelect";
import { cn } from "@/lib/utils";
import {
  countries,
  genders,
  idProofTypes,
  nationalities,
  states,
} from "@/app/data/frontoffice/constants";

const inputClass = "rounded-xl";
const errorClass = "border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-100";

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
  errors?: Record<string, boolean>;
}

export function GuestDetailsSection({
  guestDetails,
  onChange,
  onFileUpload,
  idFile,
  errors = {},
}: GuestDetailsSectionProps) {
  const fieldClass = (key: keyof GuestDetails) =>
    cn(inputClass, errors[key] && errorClass);
  const genderOptions = useMemo(() => toOptions(genders), []);
  const nationalityOptions = useMemo(() => toOptions(nationalities), []);
  const stateOptions = useMemo(() => toOptions(states), []);
  const countryOptions = useMemo(() => toOptions(countries), []);
  const idProofOptions = useMemo(() => toOptions(idProofTypes), []);

  const todayIso = useMemo(() => new Date().toISOString().split("T")[0], []);

  return (
    <>
      <FormField label="Gender" required error={errors?.gender}>
        <SearchSelect
          options={genderOptions}
          selectedId={guestDetails.gender || null}
          placeholder="Search gender…"
          inputClassName={fieldClass("gender")}
          onSelect={(opt) => onChange("gender", opt.id)}
          onClear={() => onChange("gender", "")}
        />
      </FormField>

      <FormField label="Date of Birth" required error={errors?.dob}>
        <TextInput
          type="date"
          className={fieldClass("dob")}
          value={guestDetails.dob}
          onChange={(e) => onChange("dob", e.target.value)}
        />
      </FormField>

      <FormField label="Nationality" required error={errors?.nationality}>
        <SearchSelect
          options={nationalityOptions}
          selectedId={guestDetails.nationality || null}
          placeholder="Search or type nationality…"
          inputClassName={fieldClass("nationality")}
          allowCustom
          onSelect={(opt) => onChange("nationality", opt.id)}
          onClear={() => onChange("nationality", "")}
        />
      </FormField>

      <FormField label="Address" required error={errors?.address}>
        <TextInput
          className={fieldClass("address")}
          placeholder="Street address"
          value={guestDetails.address}
          onChange={(e) => onChange("address", e.target.value)}
        />
      </FormField>

      <FormField label="City" required error={errors?.city}>
        <TextInput
          className={fieldClass("city")}
          placeholder="City name"
          value={guestDetails.city}
          onChange={(e) => onChange("city", e.target.value)}
        />
      </FormField>

      <FormField label="State / Province" required error={errors?.state}>
        <SearchSelect
          options={stateOptions}
          selectedId={guestDetails.state || null}
          placeholder="Search or type state…"
          inputClassName={fieldClass("state")}
          allowCustom
          onSelect={(opt) => onChange("state", opt.id)}
          onClear={() => onChange("state", "")}
        />
      </FormField>

      <FormField label="Country" required error={errors?.country}>
        <SearchSelect
          options={countryOptions}
          selectedId={guestDetails.country || null}
          placeholder="Search or type country…"
          inputClassName={fieldClass("country")}
          allowCustom
          onSelect={(opt) => onChange("country", opt.id)}
          onClear={() => onChange("country", "")}
        />
      </FormField>

      <FormField label="Pincode / Zip" required error={errors?.pincode}>
        <TextInput
          className={fieldClass("pincode")}
          placeholder="6-digit pincode"
          maxLength={6}
          value={guestDetails.pincode}
          onChange={(e) =>
            onChange("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))
          }
        />
      </FormField>

      <FormField label="ID Proof Type" required error={errors?.idProofType}>
        <SearchSelect
          options={idProofOptions}
          selectedId={guestDetails.idProofType || null}
          placeholder="Search ID proof…"
          inputClassName={fieldClass("idProofType")}
          onSelect={(opt) => onChange("idProofType", opt.id)}
          onClear={() => onChange("idProofType", "")}
        />
      </FormField>

      <FormField label="ID Document Number" required error={errors?.idNumber}>
        <TextInput
          className={fieldClass("idNumber")}
          placeholder="e.g. Aadhar / Passport No"
          value={guestDetails.idNumber}
          onChange={(e) => onChange("idNumber", e.target.value)}
        />
      </FormField>

      {onFileUpload && (
        <FormField label="Upload ID Document" required error={errors?.idFile}>
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
