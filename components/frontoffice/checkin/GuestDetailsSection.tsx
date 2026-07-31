"use client";

import React from "react";
import { FormField, SelectInput, TextInput } from "@/components/frontoffice/ui";
import {
  countries,
  genders,
  idProofTypes,
  nationalities,
  states,
} from "@/app/data/frontoffice/constants";

const emptyOption = (label: string) => (
  <option value="" disabled hidden>{label}</option>
);

const inputClass = "rounded-xl";

interface GuestDetailsSectionProps {
  guestDetails: {
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
  return (
    <>
      <FormField label="Gender">
        <SelectInput
          className={inputClass}
          value={guestDetails.gender}
          onChange={(e) => onChange("gender", e.target.value)}
        >
          {emptyOption("Select gender")}
          {genders.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </SelectInput>
      </FormField>

      <FormField label="Date of Birth">
        <TextInput
          type="date"
          className={inputClass}
          value={guestDetails.dob}
          onChange={(e) => onChange("dob", e.target.value)}
        />
      </FormField>

      <FormField label="Nationality">
        <SelectInput
          className={inputClass}
          value={guestDetails.nationality}
          onChange={(e) => onChange("nationality", e.target.value)}
        >
          {emptyOption("Select nationality")}
          {nationalities.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </SelectInput>
      </FormField>

      <FormField label="Address">
        <TextInput
          className={inputClass}
          placeholder="Street address"
          value={guestDetails.address}
          onChange={(e) => onChange("address", e.target.value)}
        />
      </FormField>

      <FormField label="City">
        <TextInput
          className={inputClass}
          placeholder="City name"
          value={guestDetails.city}
          onChange={(e) => onChange("city", e.target.value)}
        />
      </FormField>

      <FormField label="State / Province">
        <SelectInput
          className={inputClass}
          value={guestDetails.state}
          onChange={(e) => onChange("state", e.target.value)}
        >
          {emptyOption("Select state")}
          {states.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </SelectInput>
      </FormField>

      <FormField label="Country">
        <SelectInput
          className={inputClass}
          value={guestDetails.country}
          onChange={(e) => onChange("country", e.target.value)}
        >
          {emptyOption("Select country")}
          {countries.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </SelectInput>
      </FormField>

      <FormField label="Pincode / Zip">
        <TextInput
          className={inputClass}
          placeholder="6-digit pincode"
          value={guestDetails.pincode}
          onChange={(e) => onChange("pincode", e.target.value)}
        />
      </FormField>

      <FormField label="ID Proof Type">
        <SelectInput
          className={inputClass}
          value={guestDetails.idProofType}
          onChange={(e) => onChange("idProofType", e.target.value)}
        >
          {emptyOption("Select ID proof")}
          {idProofTypes.map((id) => (
            <option key={id} value={id}>{id}</option>
          ))}
        </SelectInput>
      </FormField>

      <FormField label="ID Document Number">
        <TextInput
          className={inputClass}
          placeholder="e.g. Aadhar / Passport No"
          value={guestDetails.idNumber}
          onChange={(e) => onChange("idNumber", e.target.value)}
        />
      </FormField>

      {onFileUpload && (
        <FormField label="Upload ID Document">
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
