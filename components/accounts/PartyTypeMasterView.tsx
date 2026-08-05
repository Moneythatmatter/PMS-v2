"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  Building2,
  CheckCircle2,
  Plus,
  Save,
  RotateCcw,
  Printer,
  Download,
  Search,
  X,
  ShieldCheck,
  Clock,
  Layers,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  CheckSquare,
  Lock,
  DollarSign,
  AlertCircle,
  Building,
  CreditCard,
  FileText,
  Tag,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  TextInput,
  SelectInput,
  TextAreaInput,
  StatMiniCard,
  formatINR,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import {
  samplePartyTypesData,
  PartyTypeRecord,
} from "@/app/data/accounts/partyTypeData";
import { cn } from "@/lib/utils";

export function PartyTypeMasterView() {
  // Master Party Types List State
  const [partyTypes, setPartyTypes] = useState<PartyTypeRecord[]>(samplePartyTypesData);
  const [selectedId, setSelectedId] = useState<string>(samplePartyTypesData[0].id);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  // Selected Record
  const activeRecord = useMemo(
    () => partyTypes.find((p) => p.id === selectedId) || partyTypes[0],
    [partyTypes, selectedId]
  );

  // Form State
  const [formData, setFormData] = useState<PartyTypeRecord>(activeRecord);

  // Sectional Tab ('general' | 'financial' | 'credit' | 'compliance')
  const [activeTab, setActiveTab] = useState<"general" | "financial" | "credit" | "compliance">("general");

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync Form Data when selected record changes
  React.useEffect(() => {
    setFormData({ ...activeRecord });
  }, [activeRecord]);

  // Filtered Party Types
  const filteredPartyTypes = useMemo(() => {
    return partyTypes.filter((p) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          p.partyTypeCode.toLowerCase().includes(q) ||
          p.partyTypeName.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [partyTypes, searchQuery]);

  // Field Change Handler
  const handleFormChange = (field: keyof PartyTypeRecord, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Add New Party Type Action
  const handleNewPartyType = () => {
    const newRecord: PartyTypeRecord = {
      id: `pt-${Date.now()}`,
      partyTypeCode: "EMP",
      partyTypeName: "Employee / Staff",
      description: "Hotel Employees, Staff Advances & Payroll Ledger Accounts",
      seqNo: partyTypes.length + 1,
      activeStatus: true,
      allowDirectInvoicing: false,
      controlGLLedger: "2200 - Staff Advance & Payroll Payable A/c",
      subLedgerGroup: "Employee Payables",
      allowCommissionPosting: false,
      allowDiscountPosting: false,
      defaultCreditLimit: 25000.0,
      defaultCreditDays: 0,
      enforceHardCreditLimit: true,
      overdueInterestPct: 0.0,
      gstinMandatory: false,
      panMandatory: true,
      approvalRequiredForParty: true,
      blacklistingAllowed: false,
      signBy: "HR & Payroll Lead",
      updatedBy: "Jay Admin",
      updatedDate: "Today",
    };

    setPartyTypes([newRecord, ...partyTypes]);
    setSelectedId(newRecord.id);
    setFormData(newRecord);
    setToastMessage(`Created new Party Type category (${newRecord.partyTypeName}).`);
  };

  // Save Settings Action
  const handleSaveSettings = () => {
    setPartyTypes((prev) =>
      prev.map((p) => (p.id === formData.id ? { ...formData, updatedDate: "Just Now" } : p))
    );
    setFormData((prev) => ({ ...prev, updatedDate: "Just Now" }));
    setToastMessage(`Saved Party Type '${formData.partyTypeName}' settings successfully!`);
  };

  // Reset Action
  const handleReset = () => {
    setFormData({ ...activeRecord });
    setToastMessage("Reset Party Type fields to saved values.");
  };

  // Export CSV Action
  const handleExportCSV = () => {
    const csvHeader = "PartyTypeCode,PartyTypeName,ControlGL,CreditLimit,CreditDays,GSTINMandatory,Active\n";
    const csvRows = filteredPartyTypes
      .map(
        (p) =>
          `"${p.partyTypeCode}","${p.partyTypeName}","${p.controlGLLedger}","${p.defaultCreditLimit}","${p.defaultCreditDays}","${p.gstinMandatory}","${p.activeStatus}"`
      )
      .join("\n");
    const blob = new Blob([csvHeader + csvRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Party_Types_Report_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMessage("Exported Party Types configuration to CSV.");
  };

  return (
    <ModulePageShell
      eyebrow="Accounts & Masters"
      title="Party Type Master"
      description="Define accounting party categories, default control ledgers, credit terms, and validation rules."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Masters", href: "/accounts/masters" },
        { label: "Party Type Master" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleNewPartyType}
            className="rounded-xl text-xs font-bold bg-white text-slate-800 border-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1 text-emerald-600" />
            + New Party Type
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSaveSettings}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            Save Settings
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Reset Defaults
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
            Export Config
          </Button>
        </div>
      }
    >
      {/* Top Active Target Entity Selector Bar (Matching Company Settings & Company Creation UI) */}
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <Building2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="flex-1">
              <span className="font-bold text-xs text-slate-600 block">Target Company Entity:</span>
              <select
                value="LUXY HOTEL & RESORTS PRIVATE LIMITED"
                onChange={() => {}}
                className="h-8 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
              >
                <option value="LUXY HOTEL & RESORTS PRIVATE LIMITED">
                  LUXY HOTEL & RESORTS PRIVATE LIMITED (CMP-001)
                </option>
                <option value="LUXY CATERING & BANQUETS LLP">
                  LUXY CATERING & BANQUETS LLP (CMP-002)
                </option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-slate-700 border border-slate-200 font-mono">
              <Tag className="h-3.5 w-3.5 text-slate-600" />
              Category: {formData.partyTypeName} ({formData.partyTypeCode})
            </span>

            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3 py-1 font-bold border",
                formData.activeStatus
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-slate-100 text-slate-700 border-slate-200"
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
              Status: {formData.activeStatus ? "Active Category" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Split Layout: 35% Left Party Types List / 65% Right Form */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6 font-sans text-xs">
        {/* LEFT PANEL (35% Desktop / 40% Tablet / 100% Mobile) - Party Types List */}
        <div className="md:col-span-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col min-h-[620px]">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-emerald-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Party Types ({filteredPartyTypes.length})
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              Category Master
            </span>
          </div>

          {/* Quick Search */}
          <div className="mb-3 relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Party Type code, name..."
              className="h-8 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Records List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[600px]">
            {filteredPartyTypes.map((item) => {
              const isSelected = selectedId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "p-3 rounded-xl border transition-all duration-150 cursor-pointer space-y-2",
                    isSelected
                      ? "bg-emerald-50/90 border-emerald-500 ring-1 ring-emerald-500 shadow-2xs"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5 font-mono">
                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-extrabold text-[10px]">
                          {item.partyTypeCode}
                        </span>
                        <span>{item.partyTypeName}</span>
                      </h4>
                      <span className="text-[11px] font-semibold text-slate-500 block mt-0.5 truncate max-w-[200px]">
                        {item.description}
                      </span>
                    </div>

                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 border",
                        item.activeStatus
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      )}
                    >
                      {item.activeStatus ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px]">
                    <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      Limit: {formatINR(item.defaultCreditLimit)}
                    </span>
                    <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-mono">
                      {item.defaultCreditDays} Days
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL (65% Desktop / 60% Tablet / 100% Mobile) - Party Type Form */}
        <div className="md:col-span-8 space-y-4">
          {/* Top Overview Metrics Cards */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono font-bold text-xs text-slate-500 block">
                  Code: {formData.partyTypeCode} • Sequence: #{formData.seqNo}
                </span>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>{formData.partyTypeName}</span>
                  <span className="font-mono text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">
                    {formData.partyTypeCode}
                  </span>
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "px-3 py-1 rounded-xl text-xs font-bold border",
                    formData.activeStatus
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  )}
                >
                  {formData.activeStatus ? "Active Category" : "Inactive"}
                </span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Default Credit Limit</span>
                <span className="text-xs font-mono font-bold text-emerald-700 mt-0.5 block">
                  {formatINR(formData.defaultCreditLimit)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Default Credit Days</span>
                <span className="text-xs font-mono font-bold text-slate-900 mt-0.5 block">
                  {formData.defaultCreditDays} Days
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Control GL Ledger</span>
                <span className="text-xs font-mono font-bold text-slate-900 mt-0.5 block truncate">
                  {formData.controlGLLedger}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">GSTIN Mandatory</span>
                <span className="text-xs font-mono font-bold text-emerald-800 mt-0.5 block">
                  {formData.gstinMandatory ? "Enforced" : "Optional"}
                </span>
              </div>
            </div>
          </div>

          {/* Section Navigation Tabs (IDENTICAL TO COMPANY SETTINGS & PARTY MASTER TAB BAR) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xs flex border-b border-slate-200 overflow-x-auto gap-1">
            {[
              { id: "general", label: "General & Identity", icon: Users },
              { id: "financial", label: "Control GL & Financial Rules", icon: Building },
              { id: "credit", label: "Credit Limit & Terms", icon: CreditCard },
              { id: "compliance", label: "Taxation & Approval Compliance", icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
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

          {/* Form Content Cards */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs font-sans text-xs space-y-5">
            {/* 👤 TAB 1: GENERAL & IDENTITY */}
            {activeTab === "general" && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-emerald-600" />
                      Party Type Master Identity
                    </span>
                    <span className="text-[11px] font-mono text-emerald-800 font-bold">WINHMS MASTER</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label="Party Type Code" required>
                      <TextInput
                        value={formData.partyTypeCode}
                        onChange={(e) => handleFormChange("partyTypeCode", e.target.value.toUpperCase())}
                        className="bg-white font-mono font-bold text-slate-900 h-9"
                      />
                    </FormField>

                    <FormField label="Party Type Name" required>
                      <TextInput
                        value={formData.partyTypeName}
                        onChange={(e) => handleFormChange("partyTypeName", e.target.value)}
                        className="bg-white font-bold text-slate-900 h-9"
                      />
                    </FormField>

                    <FormField label="Sequence / Display Order">
                      <TextInput
                        type="number"
                        value={formData.seqNo}
                        onChange={(e) => handleFormChange("seqNo", parseInt(e.target.value) || 1)}
                        className="bg-white font-mono font-bold h-9"
                      />
                    </FormField>
                  </div>

                  <FormField label="Description / Category Notes">
                    <TextAreaInput
                      rows={2}
                      value={formData.description}
                      onChange={(e) => handleFormChange("description", e.target.value)}
                      className="bg-white text-xs font-semibold"
                    />
                  </FormField>

                  <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.activeStatus}
                        onChange={(e) => handleFormChange("activeStatus", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Active Party Type (Available for Party Master Selection)</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.allowDirectInvoicing}
                        onChange={(e) => handleFormChange("allowDirectInvoicing", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Allow Direct Invoicing & City Ledger Settlement</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 🏦 TAB 2: CONTROL GL & FINANCIAL RULES */}
            {activeTab === "financial" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <Building className="h-4 w-4 text-emerald-600" />
                    Default General Ledger Control Mapping
                  </h3>

                  <FormField label="Default General Ledger Control Account" required>
                    <SelectInput
                      value={formData.controlGLLedger}
                      onChange={(e) => handleFormChange("controlGLLedger", e.target.value)}
                      className="bg-white font-bold text-slate-900 h-9"
                    >
                      <option value="1200 - City Ledger Receivables A/c">
                        1200 - City Ledger Receivables A/c
                      </option>
                      <option value="2100 - Sundry Creditors Payable A/c">
                        2100 - Sundry Creditors Payable A/c
                      </option>
                      <option value="1100 - Guest Ledger Open Folios A/c">
                        1100 - Guest Ledger Open Folios A/c
                      </option>
                      <option value="2200 - Staff Advance & Payroll Payable A/c">
                        2200 - Staff Advance & Payroll Payable A/c
                      </option>
                      <option value="2300 - Statutory Taxes Payable A/c">
                        2300 - Statutory Taxes Payable A/c
                      </option>
                    </SelectInput>
                  </FormField>

                  <FormField label="Sub-Ledger Group Designation">
                    <SelectInput
                      value={formData.subLedgerGroup}
                      onChange={(e) => handleFormChange("subLedgerGroup", e.target.value)}
                      className="bg-white font-semibold h-9"
                    >
                      <option value="Trade Receivables - Travel Agents">Trade Receivables - Travel Agents</option>
                      <option value="Trade Receivables - Corporate">Trade Receivables - Corporate</option>
                      <option value="Trade Payables - Suppliers">Trade Payables - Suppliers</option>
                      <option value="Guest Receivables">Guest Receivables</option>
                      <option value="Employee Payables">Employee Payables</option>
                    </SelectInput>
                  </FormField>

                  <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.allowCommissionPosting}
                        onChange={(e) => handleFormChange("allowCommissionPosting", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Allow OTA Commission Postings (e.g. 15% Travel Agent Commission)</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.allowDiscountPosting}
                        onChange={(e) => handleFormChange("allowDiscountPosting", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Allow Contracted Corporate Discount Postings</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 💳 TAB 3: CREDIT LIMIT & PAYMENT TERMS */}
            {activeTab === "credit" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-emerald-600" />
                    Default Credit Policy & Payment Terms
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label="Default Credit Limit (INR)" required>
                      <TextInput
                        type="number"
                        value={formData.defaultCreditLimit}
                        onChange={(e) => handleFormChange("defaultCreditLimit", parseFloat(e.target.value) || 0)}
                        className="bg-white font-mono font-bold text-slate-900 h-9"
                      />
                    </FormField>

                    <FormField label="Default Credit Period (Days)">
                      <TextInput
                        type="number"
                        value={formData.defaultCreditDays}
                        onChange={(e) => handleFormChange("defaultCreditDays", parseInt(e.target.value) || 0)}
                        className="bg-white font-mono font-bold text-slate-900 h-9"
                      />
                    </FormField>

                    <FormField label="Overdue Interest Rate (% p.a.)">
                      <TextInput
                        type="number"
                        step="0.1"
                        value={formData.overdueInterestPct}
                        onChange={(e) => handleFormChange("overdueInterestPct", parseFloat(e.target.value) || 0)}
                        className="bg-white font-mono h-9"
                      />
                    </FormField>
                  </div>

                  <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.enforceHardCreditLimit}
                        onChange={(e) => handleFormChange("enforceHardCreditLimit", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Enforce Hard Credit Limit Lock (Block Check-in / Bill Transfer on Overlimit)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 🛡️ TAB 4: TAXATION & APPROVAL COMPLIANCE */}
            {activeTab === "compliance" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Statutory Validation & Approval Controls
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.gstinMandatory}
                        onChange={(e) => handleFormChange("gstinMandatory", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>GSTIN Verification Mandatory for New Parties</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.panMandatory}
                        onChange={(e) => handleFormChange("panMandatory", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>PAN Card Verification Mandatory</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.approvalRequiredForParty}
                        onChange={(e) => handleFormChange("approvalRequiredForParty", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Senior Approval Required before Activating Parties</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.blacklistingAllowed}
                        onChange={(e) => handleFormChange("blacklistingAllowed", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Allow Party Blacklisting in Master</span>
                    </label>
                  </div>

                  <FormField label="Sign By (Authorized Signatory Line)">
                    <TextInput
                      value={formData.signBy}
                      onChange={(e) => handleFormChange("signBy", e.target.value)}
                      placeholder="e.g. Revenue Manager / Controller"
                      className="bg-white font-semibold h-9"
                    />
                  </FormField>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 text-slate-500 font-mono text-[11px]">
                    <div>
                      Updated By: <strong className="text-slate-800">{formData.updatedBy}</strong>
                    </div>
                    <div>
                      Last Updated: <strong className="text-slate-800">{formData.updatedDate}</strong>
                    </div>
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
