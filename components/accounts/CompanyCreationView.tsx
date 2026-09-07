"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Building2,
  Search,
  Plus,
  Save,
  X,
  Phone,
  Mail,
  MapPin,
  FileCheck2,
  RefreshCw,
  Info,
  ChevronRight,
  Upload,
  Calendar,
  ShieldCheck,
  Ban,
  CheckCircle2,
  Coins,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  TextInput,
  SelectInput,
  FODatePicker,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import {
  sampleCompaniesList,
  CompanyRecord,
} from "@/app/data/accounts/companyCreationData";
import { cn } from "@/lib/utils";

export function CompanyCreationView() {
  // Master Company List & Active Selection State
  const [companies, setCompanies] = useState<CompanyRecord[]>(sampleCompaniesList);
  const [selectedId, setSelectedId] = useState<string>(sampleCompaniesList[0].id);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");

  // Selected Active Company Record
  const activeCompany = useMemo(
    () => companies.find((c) => c.id === selectedId) || companies[0],
    [companies, selectedId]
  );

  // Form State (Derived from active company for editing)
  const [formData, setFormData] = useState<CompanyRecord>(activeCompany);

  // Update formData when activeCompany changes
  useEffect(() => {
    setFormData({ ...activeCompany });
  }, [activeCompany]);

  // Sectional Tab State (3 Core Identity Tabs Only)
  const [formTab, setFormTab] = useState<"general" | "address" | "registration">("general");

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filtered Companies List
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          (c.tradeName || "").toLowerCase().includes(q) ||
          (c.legalName || "").toLowerCase().includes(q) ||
          (c.companyCode || "").toLowerCase().includes(q) ||
          (c.gstNumber || "").toLowerCase().includes(q) ||
          (c.panNumber || "").toLowerCase().includes(q) ||
          (c.state || "").toLowerCase().includes(q) ||
          (c.status || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [companies, searchQuery]);

  // Form Field Change Handler
  const handleFormChange = (field: keyof CompanyRecord, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handlers for Top Action Buttons
  const handleNewCompany = () => {
    const nextNum = Math.floor(100 + Math.random() * 900);
    const newRecord: CompanyRecord = {
      id: `cmp-${Date.now()}`,
      companyCode: `CMP-${nextNum}`,
      tradeName: "",
      legalName: "",
      alias: "",
      companyType: "Private Limited",
      businessNature: "Hospitality & Hotel Operations",
      status: "Active",

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

      baseCurrencyId: "INR",
      currentFiscalYearId: "FY-2026-27",

      createdAt: "Today",
      updatedAt: "Today",
    };

    setCompanies([newRecord, ...companies]);
    setSelectedId(newRecord.id);
    setFormData(newRecord);
    setFormTab("general");
    setToastMessage(`Prepared new Company Creation record (${newRecord.companyCode}).`);
  };

  // Validation & Save Handler
  const handleSaveCompany = (andNew = false) => {
    if (!formData.tradeName?.trim()) {
      setToastMessage("Please enter the Company Trade Name.");
      setFormTab("general");
      return;
    }

    if (!formData.legalName?.trim()) {
      setToastMessage("Please enter the Legal Registered Name.");
      setFormTab("general");
      return;
    }

    // Duplicate Company Code check (for newly edited or altered codes)
    const isDuplicateCode = companies.some(
      (c) => c.id !== formData.id && c.companyCode.toUpperCase() === formData.companyCode.toUpperCase()
    );
    if (isDuplicateCode) {
      setToastMessage(`Company Code '${formData.companyCode}' is already in use by another entity.`);
      return;
    }

    setCompanies((prev) =>
      prev.map((c) =>
        c.id === formData.id
          ? {
              ...formData,
              updatedAt: "Just now",
            }
          : c
      )
    );

    setToastMessage(`Saved Legal Company Record for '${formData.tradeName}'.`);

    if (andNew) {
      handleNewCompany();
    }
  };

  // Non-destructive Deactivation / Activation Handler
  const handleToggleDeactivate = () => {
    const nextStatus = formData.status === "Active" ? "Inactive" : "Active";
    const updated = { ...formData, status: nextStatus as "Active" | "Inactive", updatedAt: "Just now" };
    setFormData(updated);
    setCompanies((prev) => prev.map((c) => (c.id === formData.id ? updated : c)));
    setToastMessage(
      nextStatus === "Inactive"
        ? `Deactivated company '${formData.tradeName}'. Transactions will be protected.`
        : `Activated company '${formData.tradeName}'.`
    );
  };

  // Refresh / Reset Edits Handler
  const handleRefresh = () => {
    setFormData({ ...activeCompany });
    setToastMessage("Reset unsaved changes to active company record.");
  };

  return (
    <ModulePageShell
      eyebrow="Accounts & Masters"
      title="Company Creation"
      description="Create and maintain the primary business legal identity and statutory company registration."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Masters", href: "/accounts/masters" },
        { label: "Company Creation" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleNewCompany}
            className="rounded-xl text-xs font-bold bg-white text-slate-800 border-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1 text-emerald-600" />
            New Company
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => handleSaveCompany(false)}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            Save
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSaveCompany(true)}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            Save & New
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleToggleDeactivate}
            className={cn(
              "rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 cursor-pointer",
              formData.status === "Active" ? "text-amber-700 hover:text-amber-800" : "text-emerald-700 hover:text-emerald-800"
            )}
          >
            {formData.status === "Active" ? (
              <>
                <Ban className="h-3.5 w-3.5 mr-1 text-amber-600" />
                Deactivate
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                Activate
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Refresh
          </Button>
        </div>
      }
    >
      {/* Informational Scope Notice */}
      <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 flex items-start gap-2.5 text-xs text-slate-700">
        <Info className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-emerald-950">Company Legal Identity Master:</span>{" "}
          <span>
            This master defines the legal entity operating the PMS. Detailed accounting behavior, fiscal year calendar, tax slabs, and operational posting rules are managed under their respective master pages (Company Settings, Fiscal Year, and Tax Master).
          </span>
        </div>
      </div>

      {/* Main 2-Column Split Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
        {/* LEFT COLUMN: Registered Companies List (4 cols) */}
        <div className="md:col-span-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col min-h-[620px]">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Building2 className="h-4.5 w-4.5 text-emerald-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Registered Entities
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {companies.length} {companies.length === 1 ? "Entity" : "Entities"}
            </span>
          </div>

          {/* Search Box */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search companies..."
              className="h-8 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-8 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Company Cards List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[540px]">
            {filteredCompanies.map((c) => {
              const isSelected = c.id === selectedId;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    "p-3 rounded-xl border transition-all cursor-pointer select-none",
                    isSelected
                      ? "border-emerald-600 bg-emerald-50/80 shadow-xs ring-1 ring-emerald-600/30"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 bg-white"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {c.companyCode}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase",
                            c.status === "Active"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-700"
                          )}
                        >
                          {c.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                        {c.tradeName || c.legalName || "Untitled Company"}
                      </h4>
                      {c.legalName && c.legalName !== c.tradeName && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 font-medium">
                          {c.legalName}
                        </p>
                      )}
                    </div>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 shrink-0 transition-transform mt-1",
                        isSelected ? "text-emerald-700 translate-x-0.5" : "text-slate-400"
                      )}
                    />
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-medium text-slate-500">
                    <span>{c.companyType}</span>
                    <span>{c.state || c.country || "India"}</span>
                  </div>
                </div>
              );
            })}

            {filteredCompanies.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">
                No registered entities match your search.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: 3-Tab Company Identity Form (8 cols) */}
        <div className="md:col-span-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">
                  {formData.tradeName || formData.legalName || "New Company"}
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Entity ID: <strong className="font-mono text-slate-700">{formData.companyCode}</strong>
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
                    <FormField label="Company Code (System Auto)" required>
                      <TextInput
                        value={formData.companyCode || ""}
                        readOnly
                        className="bg-slate-100 font-mono font-bold text-slate-800 cursor-not-allowed h-9"
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

                    <FormField label="System Status">
                      <SelectInput
                        value={formData.status || "Active"}
                        onChange={(e) => handleFormChange("status", e.target.value)}
                        className="bg-white font-bold h-9 text-slate-900"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </SelectInput>
                    </FormField>
                  </div>

                  {/* Reference Indicators Box (Read-Only Cross-Master References) */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Coins className="h-3.5 w-3.5 text-amber-600" />
                        <span className="font-semibold">Base Currency:</span>
                        <span className="font-bold text-slate-900 bg-amber-50 px-2 py-0.5 rounded text-[11px] border border-amber-200">
                          {formData.baseCurrencyId || "INR"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Calendar className="h-3.5 w-3.5 text-blue-600" />
                        <span className="font-semibold">Current FY:</span>
                        <span className="font-bold text-slate-900 bg-blue-50 px-2 py-0.5 rounded text-[11px] border border-blue-200">
                          {formData.currentFiscalYearId || "FY-2026-27"}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 italic">
                      Referenced from Currency & Fiscal Year Masters
                    </span>
                  </div>

                  {/* Logo Upload Box */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-emerald-600" />
                      <span className="font-bold text-slate-800">Company Logo & Branding:</span>
                      <span className="text-[11px] text-slate-500">(Optional PNG / JPEG)</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setToastMessage("Company logo uploaded.")}
                      className="h-8 text-xs font-bold bg-white border-slate-300 hover:bg-slate-50 text-slate-800 cursor-pointer"
                    >
                      Browse File
                    </Button>
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
                        value={formData.country || "India"}
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
    </ModulePageShell>
  );
}
