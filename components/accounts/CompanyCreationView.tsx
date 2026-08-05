"use client";

import React, { useState, useMemo } from "react";
import {
  Building2,
  Search,
  Plus,
  Save,
  X,
  Printer,
  Download,
  Trash2,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  Building,
  DollarSign,
  Percent,
  SlidersHorizontal,
  Filter,
  RefreshCw,
  Clock,
  Receipt,
  FileCheck2,
  Paperclip,
  History,
  Info,
  ChevronRight,
  Upload,
  Calendar,
  Globe,
  ShieldCheck,
  Settings,
  Layers,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  TextInput,
  SelectInput,
  TextAreaInput,
  StatMiniCard,
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

  // Form State (Derived from active company for full editing)
  const [formData, setFormData] = useState<CompanyRecord>(activeCompany);

  // Update formData when activeCompany changes
  React.useEffect(() => {
    setFormData({ ...activeCompany });
  }, [activeCompany]);

  // Sectional Tab State (Similar to Company Settings / Party Master)
  const [formTab, setFormTab] = useState<
    "general" | "address" | "registration" | "config"
  >("general");

  // Tab State for Bottom Activity Panel
  const [activeTab, setActiveTab] = useState<
    "branches" | "users" | "fy" | "audit" | "docs"
  >("branches");

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filtered Companies List
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          c.companyName.toLowerCase().includes(q) ||
          c.companyCode.toLowerCase().includes(q) ||
          c.gstNumber.toLowerCase().includes(q) ||
          c.panNumber.toLowerCase().includes(q) ||
          c.state.toLowerCase().includes(q) ||
          c.status.toLowerCase().includes(q)
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
      companyName: "NEW ENTERPRISE HOTEL PVT LTD",
      legalName: "New Enterprise Hotel & Hospitality Private Limited",
      alias: "NEW HOTEL",
      companyType: "Private Limited",
      businessNature: "Hospitality & Hotel Operations",
      status: "Active",

      gstNumber: "",
      panNumber: "",
      tanNumber: "",
      cinNumber: "",
      msmeNumber: "",
      registrationDate: "2026-04-01",

      addressLine1: "",
      addressLine2: "",
      city: "Dahej",
      district: "Bharuch",
      state: "Gujarat",
      pincode: "392130",
      country: "India",

      primaryContact: "Mr. New Admin",
      mobile: "",
      telephone: "",
      email: "",
      website: "",

      baseCurrency: "INR",
      financialYear: "01/04/2026 - 31/03/2027",
      fyStartMonth: "April",
      fyEndMonth: "March",
      accountingMethod: "Accrual Basis Accounting",
      lockPeriodBeforeDate: "2026-03-31",

      taxRegion: "Gujarat - 24",
      gstApplicable: true,
      eInvoicingEnabled: true,
      tdsApplicable: true,
      tcsApplicable: false,

      nightAuditAutoPost: true,
      posAutoPost: true,
      mandatoryCostCenter: false,
      cityLedgerTransferAuto: true,

      autoVoucherNo: true,
      voucherResetFrequency: "Annually",
      allowBackDatedVouchers: true,
      allowFutureDatedVouchers: false,

      remarks: "",
      createdDate: "01/04/2026",
      lastModified: "Today",

      branchesCount: 1,
      usersCount: 5,
    };

    setCompanies([newRecord, ...companies]);
    setSelectedId(newRecord.id);
    setFormData(newRecord);
    setToastMessage(`Prepared new Company Creation record (${newRecord.companyCode}).`);
  };

  const handleSaveCompany = () => {
    if (!formData.companyName.trim()) {
      setToastMessage("Please enter a valid Company Name.");
      return;
    }
    setCompanies((prev) =>
      prev.map((c) => (c.id === formData.id ? formData : c))
    );
    setToastMessage(`Company record '${formData.companyName}' (${formData.companyCode}) saved successfully!`);
  };

  const handleSaveAndNew = () => {
    handleSaveCompany();
    handleNewCompany();
  };

  const handleDeleteCompany = () => {
    if (companies.length <= 1) {
      setToastMessage("Cannot delete the last remaining Company record.");
      return;
    }
    setCompanies((prev) => prev.filter((c) => c.id !== formData.id));
    const remaining = companies.filter((c) => c.id !== formData.id);
    if (remaining.length > 0) {
      setSelectedId(remaining[0].id);
    }
    setToastMessage(`Deleted company '${formData.companyName}'.`);
  };

  const handleExportCSV = () => {
    const csvHeader = "CompanyCode,CompanyName,LegalName,CompanyType,State,GSTIN,Status\n";
    const csvRows = filteredCompanies
      .map(
        (c) =>
          `"${c.companyCode}","${c.companyName}","${c.legalName}","${c.companyType}","${c.state}","${c.gstNumber}","${c.status}"`
      )
      .join("\n");
    const blob = new Blob([csvHeader + csvRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Company_Master_Export_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMessage("Exported Company Master records to CSV.");
  };

  return (
    <ModulePageShell
      eyebrow="Accounts & Masters"
      title="Company Creation"
      description="Create and configure companies for multi-company accounting operations."
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
            onClick={handleSaveCompany}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            Save
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSaveAndNew}
            className="rounded-xl text-xs font-bold bg-white text-slate-800 border-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
            Save & New
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDeleteCompany}
            className="rounded-xl text-xs font-semibold bg-white border-rose-200 hover:bg-rose-50 text-rose-700 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1 text-rose-600" />
            Delete
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Print
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export
          </Button>
        </div>
      }
    >
      {/* Top Target Company Selector Bar (Identical to Company Settings UI) */}
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <Building2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="flex-1">
              <span className="font-bold text-xs text-slate-600 block">Target Company Entity:</span>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="h-8 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} ({c.companyCode}) — {c.companyType}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-slate-700 border border-slate-200 font-mono">
              <Calendar className="h-3.5 w-3.5 text-slate-600" />
              FY: {formData.financialYear}
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1 text-emerald-800 font-bold border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
              Status: {formData.status} Company
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-slate-800 font-mono font-bold border border-slate-200">
              Currency: {formData.baseCurrency} (₹)
            </span>
          </div>
        </div>
      </div>

      {/* Main Split Screen (35% Left / 65% Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
        {/* LEFT PANEL (35% Desktop / 40% Tablet / 100% Mobile) - Company List */}
        <div className="md:col-span-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col min-h-[620px]">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Building2 className="h-4.5 w-4.5 text-emerald-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Company List ({filteredCompanies.length})
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              Multi-Company
            </span>
          </div>

          {/* Quick Search */}
          <div className="mb-3 relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Name, Code, GSTIN..."
              className="h-8 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Company Cards Container */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[620px]">
            {filteredCompanies.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-medium text-xs">
                No company records found.
              </div>
            ) : (
              filteredCompanies.map((item) => {
                const isSelected = selectedId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={cn(
                      "p-3 rounded-xl border transition-all duration-150 cursor-pointer space-y-1.5",
                      isSelected
                        ? "bg-emerald-50/90 border-emerald-500 ring-1 ring-emerald-500 shadow-2xs"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-[11px] text-slate-500 block">
                          {item.companyCode}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900 leading-snug">
                          {item.companyName}
                        </h4>
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 border",
                          item.status === "Active"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        )}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px]">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        <MapPin className="h-3 w-3 text-slate-500" />
                        {item.city}, {item.state}
                      </span>

                      <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        FY: {item.financialYear.split(" - ")[0]}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL (65% Desktop / 60% Tablet / 100% Mobile) - Sectional Tabs + Summary Card */}
        <div className="md:col-span-8 space-y-4 font-sans text-xs">
          {/* Section Navigation Tabs (IDENTICAL TO COMPANY SETTINGS TAB BAR) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xs flex border-b border-slate-200 overflow-x-auto gap-1">
            {[
              { id: "general", label: "General & Legal Info", icon: Building2 },
              { id: "address", label: "Address & Contact", icon: MapPin },
              { id: "registration", label: "Registration & Tax", icon: FileCheck2 },
              { id: "config", label: "Financial & System Config", icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = formTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFormTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer",
                    isActive
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

            {/* TAB CONTENT CONTAINERS */}
            <div className="p-2 space-y-4">
              {/* 🏢 TAB 1: GENERAL & LEGAL INFO */}
              {formTab === "general" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-emerald-600" />
                      Company Particulars & Legal Identity
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField label="Company Code (Auto)" required>
                        <TextInput
                          value={formData.companyCode}
                          readOnly
                          className="bg-slate-100 font-mono font-bold text-slate-800 cursor-not-allowed h-9"
                        />
                      </FormField>

                      <FormField label="Company Trade Name" required>
                        <TextInput
                          value={formData.companyName}
                          onChange={(e) => handleFormChange("companyName", e.target.value)}
                          placeholder="Enter trade name..."
                          className="font-bold text-slate-900 bg-white h-9"
                        />
                      </FormField>

                      <FormField label="Legal Registered Name" required>
                        <TextInput
                          value={formData.legalName}
                          onChange={(e) => handleFormChange("legalName", e.target.value)}
                          placeholder="Official registered company name..."
                          className="font-semibold text-slate-800 bg-white h-9"
                        />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <FormField label="Alias / Short Code">
                        <TextInput
                          value={formData.alias}
                          onChange={(e) => handleFormChange("alias", e.target.value)}
                          placeholder="e.g. LUXY HOTEL"
                          className="bg-white h-9"
                        />
                      </FormField>

                      <FormField label="Company Entity Type">
                        <SelectInput
                          value={formData.companyType}
                          onChange={(e) => handleFormChange("companyType", e.target.value)}
                          className="bg-white font-semibold h-9"
                        >
                          <option value="Private Limited">Private Limited</option>
                          <option value="Public Limited">Public Limited</option>
                          <option value="Partnership">Partnership</option>
                          <option value="Sole Proprietorship">Sole Proprietorship</option>
                          <option value="LLP">LLP</option>
                        </SelectInput>
                      </FormField>

                      <FormField label="Business Nature">
                        <TextInput
                          value={formData.businessNature}
                          onChange={(e) => handleFormChange("businessNature", e.target.value)}
                          placeholder="Hospitality Operations"
                          className="bg-white h-9"
                        />
                      </FormField>

                      <FormField label="System Status">
                        <SelectInput
                          value={formData.status}
                          onChange={(e) => handleFormChange("status", e.target.value)}
                          className="bg-white font-bold h-9 text-slate-900"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </SelectInput>
                      </FormField>
                    </div>

                    {/* Logo Upload Box */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4 text-emerald-600" />
                        <span className="font-bold text-slate-800">Company Logo & Branding Upload:</span>
                        <span className="text-[11px] text-slate-500">(PNG / JPEG max 2MB)</span>
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
                  <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                      Registered Address & Location
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField label="Address Line 1">
                        <TextInput
                          value={formData.addressLine1}
                          onChange={(e) => handleFormChange("addressLine1", e.target.value)}
                          placeholder="Registered street address..."
                          className="bg-white h-9"
                        />
                      </FormField>

                      <FormField label="Address Line 2">
                        <TextInput
                          value={formData.addressLine2}
                          onChange={(e) => handleFormChange("addressLine2", e.target.value)}
                          placeholder="Building, industrial zone..."
                          className="bg-white h-9"
                        />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <FormField label="City">
                        <TextInput
                          value={formData.city}
                          onChange={(e) => handleFormChange("city", e.target.value)}
                          className="bg-white h-9 font-semibold"
                        />
                      </FormField>

                      <FormField label="District">
                        <TextInput
                          value={formData.district}
                          onChange={(e) => handleFormChange("district", e.target.value)}
                          className="bg-white h-9"
                        />
                      </FormField>

                      <FormField label="State">
                        <TextInput
                          value={formData.state}
                          onChange={(e) => handleFormChange("state", e.target.value)}
                          className="bg-white h-9 font-semibold"
                        />
                      </FormField>

                      <FormField label="Pincode">
                        <TextInput
                          value={formData.pincode}
                          onChange={(e) => handleFormChange("pincode", e.target.value)}
                          className="bg-white h-9 font-mono"
                        />
                      </FormField>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-emerald-600" />
                      Primary Contact Particulars
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField label="Primary Contact Person">
                        <TextInput
                          value={formData.primaryContact}
                          onChange={(e) => handleFormChange("primaryContact", e.target.value)}
                          className="bg-white h-9 font-semibold text-slate-900"
                        />
                      </FormField>

                      <FormField label="Mobile Number">
                        <TextInput
                          value={formData.mobile}
                          onChange={(e) => handleFormChange("mobile", e.target.value)}
                          className="bg-white h-9 font-mono"
                        />
                      </FormField>

                      <FormField label="Telephone">
                        <TextInput
                          value={formData.telephone}
                          onChange={(e) => handleFormChange("telephone", e.target.value)}
                          className="bg-white h-9 font-mono"
                        />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField label="Official Email Address">
                        <TextInput
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleFormChange("email", e.target.value)}
                          className="bg-white h-9"
                        />
                      </FormField>

                      <FormField label="Company Website">
                        <TextInput
                          value={formData.website}
                          onChange={(e) => handleFormChange("website", e.target.value)}
                          className="bg-white h-9"
                        />
                      </FormField>
                    </div>
                  </div>
                </div>
              )}

              {/* 📜 TAB 3: REGISTRATION & TAX */}
              {formTab === "registration" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                      <FileCheck2 className="h-4 w-4 text-emerald-600" />
                      Statutory Tax & Company Registrations
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField label="GST Number (GSTIN)">
                        <TextInput
                          value={formData.gstNumber}
                          onChange={(e) => handleFormChange("gstNumber", e.target.value)}
                          placeholder="15-digit GSTIN"
                          className="font-mono uppercase font-bold text-slate-900 bg-white h-9"
                        />
                      </FormField>

                      <FormField label="PAN Number">
                        <TextInput
                          value={formData.panNumber}
                          onChange={(e) => handleFormChange("panNumber", e.target.value)}
                          placeholder="10-digit PAN"
                          className="font-mono uppercase font-bold text-slate-900 bg-white h-9"
                        />
                      </FormField>

                      <FormField label="TAN Number">
                        <TextInput
                          value={formData.tanNumber}
                          onChange={(e) => handleFormChange("tanNumber", e.target.value)}
                          placeholder="TAN Number"
                          className="font-mono uppercase bg-white h-9"
                        />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField label="CIN Number">
                        <TextInput
                          value={formData.cinNumber}
                          onChange={(e) => handleFormChange("cinNumber", e.target.value)}
                          placeholder="Corporate Identification No"
                          className="font-mono uppercase bg-white h-9"
                        />
                      </FormField>

                      <FormField label="MSME Udyam Registration">
                        <TextInput
                          value={formData.msmeNumber}
                          onChange={(e) => handleFormChange("msmeNumber", e.target.value)}
                          placeholder="UDYAM Registration"
                          className="bg-white h-9"
                        />
                      </FormField>

                      <FormField label="Registration Date">
                        <FODatePicker
                          value={formData.registrationDate}
                          onChange={(val) => handleFormChange("registrationDate", val)}
                        />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField label="Tax Region / State Code">
                        <TextInput
                          value={formData.taxRegion}
                          onChange={(e) => handleFormChange("taxRegion", e.target.value)}
                          className="bg-white font-semibold h-9"
                        />
                      </FormField>

                      <FormField label="Base Currency">
                        <SelectInput
                          value={formData.baseCurrency}
                          onChange={(e) => handleFormChange("baseCurrency", e.target.value)}
                          className="bg-white font-bold h-9"
                        >
                          <option value="INR">INR (₹) - Indian Rupee</option>
                          <option value="USD">USD ($) - US Dollar</option>
                          <option value="EUR">EUR (€) - Euro</option>
                        </SelectInput>
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-slate-200">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                        <input
                          type="checkbox"
                          checked={formData.gstApplicable}
                          onChange={(e) => handleFormChange("gstApplicable", e.target.checked)}
                          className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                        />
                        <span>GST Applicable</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                        <input
                          type="checkbox"
                          checked={formData.eInvoicingEnabled}
                          onChange={(e) => handleFormChange("eInvoicingEnabled", e.target.checked)}
                          className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                        />
                        <span>E-Invoicing Active</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                        <input
                          type="checkbox"
                          checked={formData.tdsApplicable}
                          onChange={(e) => handleFormChange("tdsApplicable", e.target.checked)}
                          className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                        />
                        <span>TDS Deduction</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                        <input
                          type="checkbox"
                          checked={formData.tcsApplicable}
                          onChange={(e) => handleFormChange("tcsApplicable", e.target.checked)}
                          className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                        />
                        <span>TCS Collection</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* ⚙️ TAB 4: FINANCIAL & SYSTEM CONFIG */}
              {formTab === "config" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                      <Settings className="h-4 w-4 text-emerald-600" />
                      Financial Period & Operational Toggles
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField label="Financial Year Period">
                        <TextInput
                          value={formData.financialYear}
                          onChange={(e) => handleFormChange("financialYear", e.target.value)}
                          className="bg-white font-mono font-bold h-9"
                        />
                      </FormField>

                      <FormField label="Accounting Method">
                        <SelectInput
                          value={formData.accountingMethod}
                          onChange={(e) => handleFormChange("accountingMethod", e.target.value)}
                          className="bg-white font-semibold h-9"
                        >
                          <option value="Accrual Basis Accounting">Accrual Basis Accounting</option>
                          <option value="Cash Basis Accounting">Cash Basis Accounting</option>
                        </SelectInput>
                      </FormField>

                      <FormField label="Lock Financial Period Prior To">
                        <TextInput
                          type="date"
                          value={formData.lockPeriodBeforeDate}
                          onChange={(e) => handleFormChange("lockPeriodBeforeDate", e.target.value)}
                          className="bg-white font-mono h-9"
                        />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-200">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                        <input
                          type="checkbox"
                          checked={formData.nightAuditAutoPost}
                          onChange={(e) => handleFormChange("nightAuditAutoPost", e.target.checked)}
                          className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                        />
                        <span>Night Audit Auto-Post Sales</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                        <input
                          type="checkbox"
                          checked={formData.posAutoPost}
                          onChange={(e) => handleFormChange("posAutoPost", e.target.checked)}
                          className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                        />
                        <span>Restaurant POS Day-End Auto Post</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                        <input
                          type="checkbox"
                          checked={formData.mandatoryCostCenter}
                          onChange={(e) => handleFormChange("mandatoryCostCenter", e.target.checked)}
                          className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                        />
                        <span>Mandatory Cost Center Allocation</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                        <input
                          type="checkbox"
                          checked={formData.cityLedgerTransferAuto}
                          onChange={(e) => handleFormChange("cityLedgerTransferAuto", e.target.checked)}
                          className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                        />
                        <span>Checkout City Ledger Auto Transfer</span>
                      </label>
                    </div>

                    <FormField label="Company Configuration Remarks">
                      <TextAreaInput
                        rows={3}
                        value={formData.remarks}
                        onChange={(e) => handleFormChange("remarks", e.target.value)}
                        placeholder="Enter configuration notes..."
                        className="bg-white"
                      />
                    </FormField>
                  </div>
                </div>
              )}
            </div>

          {/* Bottom Property Activity Panel (Branches, Users, Audit) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
            <div className="flex border-b border-slate-200 gap-1 pb-1">
              {[
                { id: "branches", label: `Branches (${formData.branchesCount})`, icon: Building },
                { id: "users", label: `Users (${formData.usersCount})`, icon: Users },
                { id: "fy", label: "Financial Years", icon: Calendar },
                { id: "audit", label: "Audit Logs", icon: History },
                { id: "docs", label: "Documents", icon: Paperclip },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex items-center gap-1.5 py-1.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer",
                      isActive
                        ? "bg-slate-100 text-emerald-800 border border-slate-200 shadow-2xs"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 text-emerald-700" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
              {activeTab === "branches" && (
                <div className="space-y-1 font-semibold">
                  <p>• Dahej Resort Branch — Active (Branch Code: BR-01)</p>
                  <p>• Vadodara Corporate Sales Office — Active (Branch Code: BR-02)</p>
                </div>
              )}
              {activeTab === "users" && (
                <div className="space-y-1 font-semibold">
                  <p>• Jayesh Patel (General Manager) — Admin Rights</p>
                  <p>• Abhijit Suthar (Senior Accountant) — Full Financial Posting</p>
                  <p>• Priya Verma (Front Desk Manager) — Guest Billing Only</p>
                </div>
              )}
              {activeTab === "fy" && (
                <div className="space-y-1 font-mono font-semibold">
                  <p>• FY 2026-2027: 01/04/2026 to 31/03/2027 (Active & Open)</p>
                  <p>• FY 2025-2026: 01/04/2025 to 31/03/2026 (Audited & Locked)</p>
                </div>
              )}
              {activeTab === "audit" && (
                <p className="font-mono text-slate-600">
                  Last amended by <strong>ABHIJIT</strong> on 28/07/2026 at 14:35:10
                </p>
              )}
              {activeTab === "docs" && (
                <p className="font-semibold text-slate-800">
                  Incorporation Certificate & GST Registration files attached.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModulePageShell>
  );
}
