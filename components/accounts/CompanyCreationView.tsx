"use client";

import React, { useState, useMemo } from "react";
import {
  Building2,
  Save,
  Phone,
  MapPin,
  FileCheck2,
  RefreshCw,
  Info,
  Upload,
  Calendar,
  ShieldCheck,
  Coins,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  TextInput,
  SelectInput,
  FODatePicker,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import { accCompanyService, type Company } from "@/services/accounts";
import { cn } from "@/lib/utils";
import { accErrorMessage, invalidateAccLookups, useAccLookups, useAccQuery } from "./accountsApi";

type CompanyForm = Omit<
  Company,
  "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy" | "baseCurrencyCode" | "logoUrl" | "registrationDate" | "baseCurrencyId"
> & {
  id: string | null;
  logoUrl: string;
  registrationDate: string;
  baseCurrencyId: string;
};

function suggestCompanyCode(list: Company[]): string {
  let max = 0;
  for (const c of list) {
    const m = (c.companyCode || "").match(/^CMP-(\d+)$/i);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `CMP-${String(max + 1).padStart(3, "0")}`;
}

function emptyCompanyForm(companyCode: string, baseCurrencyId = ""): CompanyForm {
  return {
    id: null,
    companyCode,
    tradeName: "",
    legalName: "",
    alias: "",
    companyType: "Private Limited",
    businessNature: "Hospitality & Hotel Operations",
    status: "Active",
    logoUrl: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    district: "",
    state: "",
    pincode: "",
    country: "India",
    primaryContact: "",
    mobile: "",
    telephone: "",
    email: "",
    website: "",
    gstNumber: "",
    panNumber: "",
    tanNumber: "",
    cinNumber: "",
    msmeNumber: "",
    registrationDate: "",
    taxRegion: "",
    gstApplicable: true,
    baseCurrencyId,
  };
}

function toCompanyForm(c: Company): CompanyForm {
  return {
    id: c.id,
    companyCode: c.companyCode ?? "",
    tradeName: c.tradeName ?? "",
    legalName: c.legalName ?? "",
    alias: c.alias ?? "",
    companyType: c.companyType || "Private Limited",
    businessNature: c.businessNature ?? "",
    status: c.status ?? "Active",
    logoUrl: c.logoUrl ?? "",
    addressLine1: c.addressLine1 ?? "",
    addressLine2: c.addressLine2 ?? "",
    city: c.city ?? "",
    district: c.district ?? "",
    state: c.state ?? "",
    pincode: c.pincode ?? "",
    country: c.country ?? "",
    primaryContact: c.primaryContact ?? "",
    mobile: c.mobile ?? "",
    telephone: c.telephone ?? "",
    email: c.email ?? "",
    website: c.website ?? "",
    gstNumber: c.gstNumber ?? "",
    panNumber: c.panNumber ?? "",
    tanNumber: c.tanNumber ?? "",
    cinNumber: c.cinNumber ?? "",
    msmeNumber: c.msmeNumber ?? "",
    registrationDate: c.registrationDate ? c.registrationDate.slice(0, 10) : "",
    taxRegion: c.taxRegion ?? "",
    gstApplicable: Boolean(c.gstApplicable),
    baseCurrencyId: c.baseCurrencyId ?? "",
  };
}

function toCompanyBody(f: CompanyForm): Partial<Company> {
  const { id: _id, ...rest } = f;
  void _id;
  return {
    ...rest,
    logoUrl: f.logoUrl.trim() || null,
    registrationDate: f.registrationDate || null,
    baseCurrencyId: f.baseCurrencyId || null,
  };
}

export function CompanyCreationView() {
  const { data, loading, error, reload } = useAccQuery(() => accCompanyService.list(), []);
  const companies = useMemo(() => data ?? [], [data]);
  const { lookups } = useAccLookups();

  // Unsaved edits (null = show the stored record)
  const [draft, setDraft] = useState<CompanyForm | null>(null);
  const [saving, setSaving] = useState(false);

  // Accounts data is property-scoped: this property has (at most) one company record.
  const activeCompany = useMemo(
    () => companies.find((c) => c.status === "Active") ?? companies[0],
    [companies]
  );

  const baseCurrencyDefault = lookups?.currencies.find((c) => c.isBaseCurrency)?.id ?? "";
  const formData: CompanyForm =
    draft ?? (activeCompany ? toCompanyForm(activeCompany) : emptyCompanyForm(suggestCompanyCode(companies), baseCurrencyDefault));
  const isNew = formData.id === null;
  const isDirty = draft !== null;
  const currentFiscalYear = lookups?.fiscalYears.find((fy) => fy.isCurrent);

  const [formTab, setFormTab] = useState<"general" | "address" | "registration">("general");

  const [toastMessage, setToastMessageRaw] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");
  const setToastMessage = (msg: string | null, variant: "success" | "error" = "success") => {
    setToastVariant(variant);
    setToastMessageRaw(msg);
  };

  const handleFormChange = <K extends keyof CompanyForm>(field: K, value: CompanyForm[K]) => {
    setDraft((prev) => ({ ...(prev ?? formData), [field]: value }));
  };

  const handleSaveCompany = async () => {
    if (!formData.companyCode.trim()) {
      setToastMessage("Please enter the Company Code.", "error");
      setFormTab("general");
      return;
    }
    if (!formData.tradeName.trim()) {
      setToastMessage("Please enter the Company Trade Name.", "error");
      setFormTab("general");
      return;
    }
    if (!formData.legalName.trim()) {
      setToastMessage("Please enter the Legal Registered Name.", "error");
      setFormTab("general");
      return;
    }

    setSaving(true);
    try {
      const body = toCompanyBody(formData);
      const saved = formData.id
        ? await accCompanyService.update(formData.id, body)
        : await accCompanyService.create(body);
      invalidateAccLookups();
      await reload();
      setDraft(null);
      setToastMessage(`Saved property details for '${saved.tradeName}'.`);
    } catch (e) {
      setToastMessage(accErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = async () => {
    setDraft(null);
    await reload();
    setToastMessage("Reloaded property details and discarded unsaved changes.");
  };

  return (
    <ModulePageShell
      eyebrow="Accounts & Masters"
      title="Property Details"
      description="Legal identity and statutory registration of the current property."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Masters", href: "/accounts/masters" },
        { label: "Property Details" },
      ]}
      toast={toastMessage}
      toastVariant={toastVariant}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          {isDirty && (
            <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 border border-amber-200">
              Unsaved changes
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleDiscard()}
            disabled={saving}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1 text-slate-500", loading && "animate-spin")} />
            {isDirty ? "Discard" : "Refresh"}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => void handleSaveCompany()}
            disabled={saving || loading || (!isDirty && !isNew)}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
            Save Changes
          </Button>
        </div>
      }
    >
      <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 flex items-start gap-2.5 text-xs text-slate-700">
        <Info className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
        <span>
          These are the legal and statutory details of the property you are working in. They appear on invoices,
          vouchers and reports. Fiscal year, tax slabs and posting rules are managed in their own master pages.
        </span>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-16 text-xs text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
          Loading property details…
        </div>
      ) : error && !data ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <span className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="h-4 w-4" />
            Could not load property details: {error}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={() => void reload()} className="h-7 bg-white text-xs">
            Retry
          </Button>
        </div>
      ) : (
      <div className="mb-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">
                  {formData.tradeName || formData.legalName || "Property details not set up"}
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Company Code: <strong className="font-mono text-slate-700">{formData.companyCode}</strong>
                {formData.legalName && (
                  <span> • Registered: <em>{formData.legalName}</em></span>
                )}
              </p>
            </div>

            {/* Badges: Entity Type & Status */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-200">
                {formData.companyType}
              </span>

              <span
                className={cn(
                  "inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-bold border",
                  formData.status === "Active"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                )}
              >
                {formData.status === "Active" ? "Active Entity" : "Inactive / Suspended"}
              </span>
            </div>
          </div>

          {/* TAB SELECTION HEADER (3 TABS ONLY) */}
          <div className="flex border-b border-slate-200 gap-2 pb-0 text-xs">
            <button
              type="button"
              onClick={() => setFormTab("general")}
              className={cn(
                "flex items-center gap-1.5 py-2 px-3.5 font-bold border-b-2 transition-all cursor-pointer",
                formTab === "general"
                  ? "border-emerald-700 text-emerald-800 bg-emerald-50/50 rounded-t-lg"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              )}
            >
              <Building2 className="h-4 w-4" />
              1. General & Legal Info
            </button>

            <button
              type="button"
              onClick={() => setFormTab("address")}
              className={cn(
                "flex items-center gap-1.5 py-2 px-3.5 font-bold border-b-2 transition-all cursor-pointer",
                formTab === "address"
                  ? "border-emerald-700 text-emerald-800 bg-emerald-50/50 rounded-t-lg"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              )}
            >
              <MapPin className="h-4 w-4" />
              2. Address & Contact
            </button>

            <button
              type="button"
              onClick={() => setFormTab("registration")}
              className={cn(
                "flex items-center gap-1.5 py-2 px-3.5 font-bold border-b-2 transition-all cursor-pointer",
                formTab === "registration"
                  ? "border-emerald-700 text-emerald-800 bg-emerald-50/50 rounded-t-lg"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              )}
            >
              <FileCheck2 className="h-4 w-4" />
              3. Registration & Tax
            </button>
          </div>

          {/* TAB CONTENT PANELS */}
          <div className="text-xs space-y-4 pt-1">
            {/* 🏢 TAB 1: GENERAL & LEGAL INFO */}
            {formTab === "general" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-emerald-600" />
                    Company Identity Particulars
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label="Company Code" required>
                      <TextInput
                        value={formData.companyCode || ""}
                        onChange={(e) => handleFormChange("companyCode", e.target.value.toUpperCase())}
                        placeholder="e.g. CMP-001"
                        className="bg-white font-mono font-bold uppercase text-slate-800 h-9"
                      />
                    </FormField>

                    <FormField label="Company Trade Name" required>
                      <TextInput
                        value={formData.tradeName || ""}
                        onChange={(e) => handleFormChange("tradeName", e.target.value)}
                        placeholder="e.g. Hotel & Resorts"
                        className="font-bold text-slate-900 bg-white h-9"
                      />
                    </FormField>

                    <FormField label="Legal Registered Name" required>
                      <TextInput
                        value={formData.legalName || ""}
                        onChange={(e) => handleFormChange("legalName", e.target.value)}
                        placeholder="e.g. Hotel & Resorts Private Limited"
                        className="font-semibold text-slate-800 bg-white h-9"
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <FormField label="Alias / Short Code">
                      <TextInput
                        value={formData.alias || ""}
                        onChange={(e) => handleFormChange("alias", e.target.value)}
                        placeholder="e.g. HRPL"
                        className="bg-white h-9"
                      />
                    </FormField>

                    <FormField label="Company Entity Type" required>
                      <SelectInput
                        value={formData.companyType || "Private Limited"}
                        onChange={(e) => handleFormChange("companyType", e.target.value)}
                        className="bg-white font-semibold h-9"
                      >
                        <option value="Private Limited">Private Limited</option>
                        <option value="Public Limited">Public Limited</option>
                        <option value="LLP">LLP</option>
                        <option value="Partnership">Partnership</option>
                        <option value="Sole Proprietorship">Sole Proprietorship</option>
                        <option value="Other">Other</option>
                      </SelectInput>
                    </FormField>

                    <FormField label="Business Nature">
                      <TextInput
                        value={formData.businessNature || ""}
                        onChange={(e) => handleFormChange("businessNature", e.target.value)}
                        placeholder="e.g. Hospitality & Hotel Operations"
                        className="bg-white h-9"
                      />
                    </FormField>

                  </div>

                  {/* Reference Indicators Box (Cross-Master References) */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Coins className="h-3.5 w-3.5 text-amber-600" />
                        <span className="font-semibold">Base Currency:</span>
                        <select
                          value={formData.baseCurrencyId}
                          onChange={(e) => handleFormChange("baseCurrencyId", e.target.value)}
                          className="h-7 rounded-lg border border-amber-200 bg-amber-50 px-2 text-[11px] font-bold text-slate-900 focus:border-emerald-600 focus:outline-none cursor-pointer"
                        >
                          <option value="">— Select —</option>
                          {(lookups?.currencies ?? []).map((cur) => (
                            <option key={cur.id} value={cur.id}>
                              {cur.code} – {cur.name}
                              {cur.isBaseCurrency ? " (Base)" : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Calendar className="h-3.5 w-3.5 text-blue-600" />
                        <span className="font-semibold">Current FY:</span>
                        <span className="font-bold text-slate-900 bg-blue-50 px-2 py-0.5 rounded text-[11px] border border-blue-200">
                          {currentFiscalYear?.fiscalYearName || "Not set"}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 italic">
                      Referenced from Currency & Fiscal Year Masters
                    </span>
                  </div>

                  {/* Logo Box */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-emerald-600" />
                      <span className="font-bold text-slate-800">Company Logo & Branding:</span>
                      <span className="text-[11px] text-slate-500">(Optional image URL)</span>
                    </div>
                    <TextInput
                      value={formData.logoUrl}
                      onChange={(e) => handleFormChange("logoUrl", e.target.value)}
                      placeholder="https://…/logo.png"
                      className="bg-white h-8 text-xs max-w-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 📍 TAB 2: ADDRESS & CONTACT */}
            {formTab === "address" && (
              <div className="space-y-4">
                {/* Registered Address */}
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    Registered Legal Address
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Registered Address Line 1">
                      <TextInput
                        value={formData.addressLine1 || ""}
                        onChange={(e) => handleFormChange("addressLine1", e.target.value)}
                        placeholder="Registered street address, premise name..."
                        className="bg-white h-9"
                      />
                    </FormField>

                    <FormField label="Registered Address Line 2">
                      <TextInput
                        value={formData.addressLine2 || ""}
                        onChange={(e) => handleFormChange("addressLine2", e.target.value)}
                        placeholder="Building, landmark, industrial zone..."
                        className="bg-white h-9"
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <FormField label="City">
                      <TextInput
                        value={formData.city || ""}
                        onChange={(e) => handleFormChange("city", e.target.value)}
                        placeholder="City"
                        className="bg-white h-9 font-semibold"
                      />
                    </FormField>

                    <FormField label="District">
                      <TextInput
                        value={formData.district || ""}
                        onChange={(e) => handleFormChange("district", e.target.value)}
                        placeholder="District"
                        className="bg-white h-9"
                      />
                    </FormField>

                    <FormField label="State">
                      <TextInput
                        value={formData.state || ""}
                        onChange={(e) => handleFormChange("state", e.target.value)}
                        placeholder="State"
                        className="bg-white h-9 font-semibold"
                      />
                    </FormField>

                    <FormField label="Pincode">
                      <TextInput
                        value={formData.pincode || ""}
                        onChange={(e) => handleFormChange("pincode", e.target.value)}
                        placeholder="e.g. 392130"
                        className="bg-white h-9 font-mono"
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Country">
                      <TextInput
                        value={formData.country || ""}
                        placeholder="Country"
                        onChange={(e) => handleFormChange("country", e.target.value)}
                        className="bg-white h-9 font-semibold"
                      />
                    </FormField>
                  </div>
                </div>

                {/* Primary Contact Particulars */}
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-emerald-600" />
                    Company Contact Information
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label="Primary Contact Person">
                      <TextInput
                        value={formData.primaryContact || ""}
                        onChange={(e) => handleFormChange("primaryContact", e.target.value)}
                        placeholder="e.g. General Manager / Director"
                        className="bg-white h-9 font-semibold text-slate-900"
                      />
                    </FormField>

                    <FormField label="Mobile Number">
                      <TextInput
                        value={formData.mobile || ""}
                        onChange={(e) => handleFormChange("mobile", e.target.value)}
                        placeholder="+91 00000 00000"
                        className="bg-white h-9 font-mono"
                      />
                    </FormField>

                    <FormField label="Telephone">
                      <TextInput
                        value={formData.telephone || ""}
                        onChange={(e) => handleFormChange("telephone", e.target.value)}
                        placeholder="Landline / Board No."
                        className="bg-white h-9 font-mono"
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Official Email Address">
                      <TextInput
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => handleFormChange("email", e.target.value)}
                        placeholder="official@company.com"
                        className="bg-white h-9"
                      />
                    </FormField>

                    <FormField label="Company Website">
                      <TextInput
                        value={formData.website || ""}
                        onChange={(e) => handleFormChange("website", e.target.value)}
                        placeholder="www.company.com"
                        className="bg-white h-9"
                      />
                    </FormField>
                  </div>
                </div>
              </div>
            )}

            {/* 📜 TAB 3: REGISTRATION & TAX IDENTITY */}
            {formTab === "registration" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <FileCheck2 className="h-4 w-4 text-emerald-600" />
                    Statutory Tax & Company Registrations
                  </h3>

                  {/* GST Applicability Toggle */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">
                        GST Registered / Applicable
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Specify whether this company entity operates under Goods & Services Tax.
                      </span>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 text-xs">
                      <input
                        type="checkbox"
                        checked={Boolean(formData.gstApplicable)}
                        onChange={(e) => handleFormChange("gstApplicable", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4 focus:ring-emerald-500"
                      />
                      <span>{formData.gstApplicable ? "Yes (Applicable)" : "No (Exempt / Unregistered)"}</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label="GSTIN (GST Number)">
                      <TextInput
                        value={formData.gstNumber || ""}
                        onChange={(e) => handleFormChange("gstNumber", e.target.value.toUpperCase())}
                        placeholder="15-digit GSTIN"
                        disabled={!formData.gstApplicable}
                        className={cn(
                          "font-mono uppercase font-bold text-slate-900 h-9",
                          !formData.gstApplicable ? "bg-slate-100 cursor-not-allowed text-slate-400" : "bg-white"
                        )}
                      />
                    </FormField>

                    <FormField label="PAN (Permanent Account Number)">
                      <TextInput
                        value={formData.panNumber || ""}
                        onChange={(e) => handleFormChange("panNumber", e.target.value.toUpperCase())}
                        placeholder="10-digit PAN"
                        className="font-mono uppercase font-bold text-slate-900 bg-white h-9"
                      />
                    </FormField>

                    <FormField label="TAN (Tax Deduction Number)">
                      <TextInput
                        value={formData.tanNumber || ""}
                        onChange={(e) => handleFormChange("tanNumber", e.target.value.toUpperCase())}
                        placeholder="TAN Number"
                        className="font-mono uppercase bg-white h-9"
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label="CIN (Corporate Identification No)">
                      <TextInput
                        value={formData.cinNumber || ""}
                        onChange={(e) => handleFormChange("cinNumber", e.target.value.toUpperCase())}
                        placeholder="Corporate Identification No"
                        className="font-mono uppercase bg-white h-9"
                      />
                    </FormField>

                    <FormField label="MSME / Udyam Registration">
                      <TextInput
                        value={formData.msmeNumber || ""}
                        onChange={(e) => handleFormChange("msmeNumber", e.target.value)}
                        placeholder="UDYAM-XX-00-0000000"
                        className="bg-white h-9"
                      />
                    </FormField>

                    <FormField label="Registration Date">
                      <FODatePicker
                        value={formData.registrationDate || ""}
                        onChange={(val) => handleFormChange("registrationDate", val)}
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="State / Tax Region Code">
                      <TextInput
                        value={formData.taxRegion || ""}
                        onChange={(e) => handleFormChange("taxRegion", e.target.value)}
                        placeholder="e.g. Gujarat (24)"
                        className="bg-white font-semibold h-9"
                      />
                    </FormField>
                  </div>

                  {/* Informational Guidance on Tax Master */}
                  <div className="p-3 rounded-xl bg-slate-100/80 border border-slate-200 text-slate-600 text-[11px] space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <Info className="h-3.5 w-3.5 text-emerald-700" />
                      Tax Rules & Rate Slabs Note:
                    </div>
                    <p>
                      GST tax rates (5%, 12%, 18%, 28%), room tariff thresholds, restaurant F&B tax slabs, and banquet tax rules are configured under <strong>Accounts → Masters → Tax / GST Master</strong>.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </ModulePageShell>
  );
}
