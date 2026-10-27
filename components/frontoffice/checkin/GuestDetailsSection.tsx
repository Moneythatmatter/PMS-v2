"use client";

import React, { useId, useMemo, useState } from "react";
import { Eye, X } from "lucide-react";
import { FormField, TextInput } from "@/components/frontoffice/ui";
import { SearchSelect } from "@/components/frontoffice/SearchSelect";
import {
  GuestDocumentPreviewModal,
  type PreviewableFile,
} from "@/components/frontoffice/guest-documents/GuestDocumentPreviewModal";
import {
  GUEST_DOCUMENT_ACCEPT,
  GuestDocumentsPanel,
} from "@/components/frontoffice/guest-documents/GuestDocumentsPanel";
import { MAX_ATTACHMENT_BYTES } from "@/app/data/purchaseAttachmentUtils";
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
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    unique.push(value);
  }
  return unique.map((v) => ({ id: v, label: v }));
}

export type GuestDetails = {
  firstName?: string;
  lastName?: string;
  mobile?: string;
  email?: string;
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
  onFileUpload?: (file: File | null) => void;
  idFile?: File | null;
  /** Existing guest — lists their saved ID documents. */
  guestId?: string | null;
  errors?: Record<string, boolean | string>;
  readOnlyFields?: Partial<Record<keyof GuestDetails, boolean>>;
  /** Include name / mobile / email at the top (group room guest form). */
  includeContact?: boolean;
  /** Fired after mobile / email / ID leave focus — used for duplicate checks. */
  onIdentityBlur?: (field: "mobile" | "email" | "idNumber") => void;
}

export function GuestDetailsSection({
  guestDetails,
  onChange,
  onFileUpload,
  idFile,
  guestId,
  errors = {},
  readOnlyFields = {},
  includeContact = false,
  onIdentityBlur,
}: GuestDetailsSectionProps) {
  const [preview, setPreview] = useState<PreviewableFile | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const inputId = useId();

  const openPreview = () => {
    if (!idFile) return;
    setPreview({
      fileName: idFile.name,
      mimeType: idFile.type,
      fileSize: idFile.size,
      src: URL.createObjectURL(idFile),
    });
  };

  const closePreview = () => {
    if (preview?.src.startsWith("blob:")) URL.revokeObjectURL(preview.src);
    setPreview(null);
  };
  const isReadOnly = (key: keyof GuestDetails) => Boolean(readOnlyFields[key]);
  const fieldClass = (key: keyof GuestDetails) =>
    cn(
      inputClass,
      errors[key] && errorClass,
      isReadOnly(key) && "cursor-default bg-slate-50 text-slate-700",
    );
  const genderOptions = useMemo(() => toOptions(genders), []);
  const nationalityOptions = useMemo(() => toOptions(nationalities), []);
  const stateOptions = useMemo(() => toOptions(states), []);
  const countryOptions = useMemo(() => toOptions(countries), []);
  const idProofOptions = useMemo(() => toOptions(idProofTypes), []);

  const idOnFile = isReadOnly("idNumber") && Boolean(guestDetails.idNumber.trim());

  return (
    <>
      {includeContact ? (
        <>
          <FormField label="First name" required error={errors?.firstName}>
            <TextInput
              className={fieldClass("firstName")}
              placeholder="First name"
              value={guestDetails.firstName ?? ""}
              readOnly={isReadOnly("firstName")}
              disabled={isReadOnly("firstName")}
              onChange={(e) => onChange("firstName", e.target.value)}
            />
          </FormField>
          <FormField label="Last name" required error={errors?.lastName}>
            <TextInput
              className={fieldClass("lastName")}
              placeholder="Last name"
              value={guestDetails.lastName ?? ""}
              readOnly={isReadOnly("lastName")}
              disabled={isReadOnly("lastName")}
              onChange={(e) => onChange("lastName", e.target.value)}
            />
          </FormField>
          <FormField label="Mobile" required error={errors?.mobile}>
            <TextInput
              className={fieldClass("mobile")}
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit mobile"
              value={guestDetails.mobile ?? ""}
              readOnly={isReadOnly("mobile")}
              disabled={isReadOnly("mobile")}
              onChange={(e) =>
                onChange(
                  "mobile",
                  e.target.value.replace(/\D/g, "").slice(0, 10),
                )
              }
              onBlur={
                isReadOnly("mobile") || !onIdentityBlur
                  ? undefined
                  : () => onIdentityBlur("mobile")
              }
            />
          </FormField>
          <FormField label="Email" required error={errors?.email}>
            <TextInput
              className={fieldClass("email")}
              type="email"
              placeholder="guest@email.com"
              value={guestDetails.email ?? ""}
              readOnly={isReadOnly("email")}
              disabled={isReadOnly("email")}
              onChange={(e) => onChange("email", e.target.value)}
              onBlur={
                isReadOnly("email") || !onIdentityBlur
                  ? undefined
                  : () => onIdentityBlur("email")
              }
            />
          </FormField>
        </>
      ) : null}

      <FormField label="Gender" required error={errors?.gender}>
        <SearchSelect
          options={genderOptions}
          selectedId={guestDetails.gender || null}
          placeholder="Search gender…"
          inputClassName={fieldClass("gender")}
          lockInputWhenSelected={isReadOnly("gender")}
          disabled={isReadOnly("gender")}
          onSelect={(opt) => onChange("gender", opt.id)}
          onClear={isReadOnly("gender") ? undefined : () => onChange("gender", "")}
        />
      </FormField>

      <FormField label="Date of Birth" required error={errors?.dob}>
        <TextInput
          type="date"
          className={fieldClass("dob")}
          value={guestDetails.dob}
          readOnly={isReadOnly("dob")}
          disabled={isReadOnly("dob")}
          onChange={(e) => onChange("dob", e.target.value)}
        />
      </FormField>

      <FormField label="Nationality" required error={errors?.nationality}>
        <SearchSelect
          options={nationalityOptions}
          selectedId={guestDetails.nationality || null}
          placeholder="Search or type nationality…"
          inputClassName={fieldClass("nationality")}
          allowCustom={!isReadOnly("nationality")}
          lockInputWhenSelected={isReadOnly("nationality")}
          disabled={isReadOnly("nationality")}
          onSelect={(opt) => onChange("nationality", opt.id)}
          onClear={isReadOnly("nationality") ? undefined : () => onChange("nationality", "")}
        />
      </FormField>

      <FormField label="Address" required error={errors?.address}>
        <TextInput
          className={fieldClass("address")}
          placeholder="Street address"
          value={guestDetails.address}
          readOnly={isReadOnly("address")}
          disabled={isReadOnly("address")}
          onChange={(e) => onChange("address", e.target.value)}
        />
      </FormField>

      <FormField label="City" required error={errors?.city}>
        <TextInput
          className={fieldClass("city")}
          placeholder="City name"
          value={guestDetails.city}
          readOnly={isReadOnly("city")}
          disabled={isReadOnly("city")}
          onChange={(e) => onChange("city", e.target.value)}
        />
      </FormField>

      <FormField label="State / Province" required error={errors?.state}>
        <SearchSelect
          options={stateOptions}
          selectedId={guestDetails.state || null}
          placeholder="Search or type state…"
          inputClassName={fieldClass("state")}
          allowCustom={!isReadOnly("state")}
          lockInputWhenSelected={isReadOnly("state")}
          disabled={isReadOnly("state")}
          onSelect={(opt) => onChange("state", opt.id)}
          onClear={isReadOnly("state") ? undefined : () => onChange("state", "")}
        />
      </FormField>

      <FormField label="Country" required error={errors?.country}>
        <SearchSelect
          options={countryOptions}
          selectedId={guestDetails.country || null}
          placeholder="Search or type country…"
          inputClassName={fieldClass("country")}
          allowCustom={!isReadOnly("country")}
          lockInputWhenSelected={isReadOnly("country")}
          disabled={isReadOnly("country")}
          onSelect={(opt) => onChange("country", opt.id)}
          onClear={isReadOnly("country") ? undefined : () => onChange("country", "")}
        />
      </FormField>

      <FormField label="Pincode / Zip" required error={errors?.pincode}>
        <TextInput
          className={fieldClass("pincode")}
          placeholder="6-digit pincode"
          maxLength={6}
          value={guestDetails.pincode}
          readOnly={isReadOnly("pincode")}
          disabled={isReadOnly("pincode")}
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
          lockInputWhenSelected={isReadOnly("idProofType")}
          disabled={isReadOnly("idProofType")}
          onSelect={(opt) => onChange("idProofType", opt.id)}
          onClear={isReadOnly("idProofType") ? undefined : () => onChange("idProofType", "")}
        />
      </FormField>

      <FormField label="ID Document Number" required error={errors?.idNumber}>
        <TextInput
          className={fieldClass("idNumber")}
          placeholder="e.g. Aadhar / Passport No"
          value={guestDetails.idNumber}
          readOnly={isReadOnly("idNumber")}
          disabled={isReadOnly("idNumber")}
          onChange={(e) => onChange("idNumber", e.target.value)}
          onBlur={
            isReadOnly("idNumber") || !onIdentityBlur
              ? undefined
              : () => onIdentityBlur("idNumber")
          }
        />
      </FormField>

      {onFileUpload && !idOnFile && (
        <FormField
          label="Upload ID Document"
          required
          error={fileError ?? errors?.idFile}
        >
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              id={inputId}
              accept={GUEST_DOCUMENT_ACCEPT}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                if (file.size > MAX_ATTACHMENT_BYTES) {
                  setFileError("File is too large. Maximum size is 5 MB.");
                  return;
                }
                setFileError(null);
                onFileUpload(file);
              }}
            />
            <label
              htmlFor={inputId}
              className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {idFile ? "Change File" : "Choose File"}
            </label>
            {idFile ? (
              <>
                <button
                  type="button"
                  onClick={openPreview}
                  className="max-w-[180px] truncate text-xs font-medium text-emerald-700 hover:underline"
                  title={idFile.name}
                >
                  {idFile.name}
                </button>
                <button
                  type="button"
                  onClick={openPreview}
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                >
                  <Eye className="h-3 w-3" /> Preview
                </button>
                <button
                  type="button"
                  title="Remove file"
                  onClick={() => onFileUpload(null)}
                  className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <span className="text-xs text-slate-400">No file chosen</span>
            )}
          </div>
        </FormField>
      )}

      {idOnFile && (
        <FormField label="ID Document">
          {guestId ? (
            <GuestDocumentsPanel
              guestId={guestId}
              compact
              emptyText="ID number on file — no scanned copy uploaded."
            />
          ) : (
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              On file from guest profile
            </p>
          )}
        </FormField>
      )}

      <GuestDocumentPreviewModal file={preview} onClose={closePreview} />
    </>
  );
}
