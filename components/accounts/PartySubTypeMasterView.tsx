"use client";

import React, { useState, useMemo } from "react";
import {
  Tag,
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
  Users,
  Percent,
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
  samplePartySubTypesData,
  PartySubTypeRecord,
} from "@/app/data/accounts/partySubTypeData";
import { cn } from "@/lib/utils";

export function PartySubTypeMasterView() {
  // Master List State
  const [subTypes, setSubTypes] = useState<PartySubTypeRecord[]>(samplePartySubTypesData);
  const [selectedId, setSelectedId] = useState<string>(samplePartySubTypesData[0].id);

  // Search & Parent Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [parentFilter, setParentFilter] = useState("All Parents");

  // Selected Record
  const activeRecord = useMemo(
    () => subTypes.find((s) => s.id === selectedId) || subTypes[0],
    [subTypes, selectedId]
  );

  // Form State
  const [formData, setFormData] = useState<PartySubTypeRecord>(activeRecord);

  // Sectional Tab ('identity' | 'financial' | 'credit' | 'compliance')
  const [activeTab, setActiveTab] = useState<"identity" | "financial" | "credit" | "compliance">("identity");

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync Form Data when selected record changes
  React.useEffect(() => {
    setFormData({ ...activeRecord });
  }, [activeRecord]);

  // Filtered List
  const filteredSubTypes = useMemo(() => {
    return subTypes.filter((s) => {
      const matchesParent =
        parentFilter === "All Parents" || s.parentPartyType === parentFilter;
      const matchesSearch =
        !searchQuery ||
        s.subTypeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.subTypeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.parentPartyType.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesParent && matchesSearch;
    });
  }, [subTypes, parentFilter, searchQuery]);

  // Field Change Handler
  const handleFormChange = (field: keyof PartySubTypeRecord, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Add New Sub Type Action
  const handleNewSubType = () => {
    const newRecord: PartySubTypeRecord = {
      id: `pst-${Date.now()}`,
      subTypeCode: "NEW_SUB",
      subTypeName: "New Party Sub Type",
      parentPartyType: "Travel Agent",
      description: "Custom party sub-classification details",
      seqNo: subTypes.length + 1,
      activeStatus: true,
      allowDirectSettlement: true,
      commissionRatePct: 12.0,
      commissionCalcBase: "Room Only Rate",
      allowNegotiatedRates: true,
      defaultDiscountPct: 5.0,
      creditLimitOverride: 500000.0,
      creditDaysOverride: 30,
      requireSecurityDeposit: false,
      lateFeePct: 18.0,
      contractExpiryDate: "31/12/2027",
      statutoryRegMandatory: true,
      blacklistingAllowed: true,
      signBy: "Accounts Manager",
      updatedBy: "Jay Admin",
      updatedDate: "Today",
    };

    setSubTypes([newRecord, ...subTypes]);
    setSelectedId(newRecord.id);
    setFormData(newRecord);
    setToastMessage(`Created new Party Sub Type category (${newRecord.subTypeName}).`);
  };

  // Save Settings Action
  const handleSaveSettings = () => {
    setSubTypes((prev) =>
      prev.map((s) => (s.id === formData.id ? { ...formData, updatedDate: "Just Now" } : s))
    );
    setFormData((prev) => ({ ...prev, updatedDate: "Just Now" }));
    setToastMessage(`Saved Party Sub Type '${formData.subTypeName}' setup successfully!`);
  };

  // Reset Action
  const handleReset = () => {
    setFormData({ ...activeRecord });
    setToastMessage("Reset Party Sub Type fields to saved values.");
  };

  // Export CSV Action
  const handleExportCSV = () => {
    const csvHeader = "Code,SubTypeName,ParentPartyType,CommissionPct,CreditLimit,CreditDays,Active\n";
    const csvRows = filteredSubTypes
      .map(
        (s) =>
          `"${s.subTypeCode}","${s.subTypeName}","${s.parentPartyType}","${s.commissionRatePct}","${s.creditLimitOverride}","${s.creditDaysOverride}","${s.activeStatus}"`
      )
      .join("\n");
    const blob = new Blob([csvHeader + csvRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Party_Sub_Types_Report_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMessage("Exported Party Sub Types configuration to CSV.");
  };

  return (
    <ModulePageShell
      eyebrow="Accounts & Masters"
      title="Party Sub Type Master"
      description="Configure granular party sub-classifications, parent party type mappings, commission rates, and credit terms."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Masters", href: "/accounts/masters" },
        { label: "Party Sub Type Master" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleNewSubType}
            className="rounded-xl text-xs font-bold bg-white text-slate-800 border-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1 text-emerald-600" />
            + New Sub Type
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
              <span className="font-bold text-xs text-slate-600 block">Filter Parent Party Type:</span>
              <select
                value={parentFilter}
                onChange={(e) => setParentFilter(e.target.value)}
                className="h-8 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
              >
                <option value="All Parents">All Parent Party Types</option>
                <option value="Travel Agent">Travel Agent</option>
                <option value="Corporate Client">Corporate Client</option>
                <option value="Vendor / Creditor">Vendor / Creditor</option>
                <option value="Guest / Customer">Guest / Customer</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-slate-700 border border-slate-200 font-mono">
              <Tag className="h-3.5 w-3.5 text-slate-600" />
              Sub Type: {formData.subTypeName} ({formData.subTypeCode})
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
              Status: {formData.activeStatus ? "Active Sub Type" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Split Layout: 35% Left Sub Types List / 65% Right Form */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6 font-sans text-xs">
        {/* LEFT PANEL (35% Desktop / 40% Tablet / 100% Mobile) - Sub Types List */}
        <div className="md:col-span-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col min-h-[620px]">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Tag className="h-4.5 w-4.5 text-emerald-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Party Sub Types ({filteredSubTypes.length})
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              Sub Category
            </span>
          </div>

          {/* Quick Search */}
          <div className="mb-3 relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Sub Type code, name..."
              className="h-8 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Records List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[600px]">
            {filteredSubTypes.map((item) => {
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
                          {item.subTypeCode}
                        </span>
                        <span>{item.subTypeName}</span>
                      </h4>
                      <span className="text-[11px] font-semibold text-slate-500 block mt-0.5">
                        Parent: <strong className="text-slate-700">{item.parentPartyType}</strong>
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
                      Comm: {item.commissionRatePct}%
                    </span>
                    <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-mono">
                      Limit: {formatINR(item.creditLimitOverride)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL (65% Desktop / 60% Tablet / 100% Mobile) - Sub Type Form */}
        <div className="md:col-span-8 space-y-4">
          {/* Top Overview Metrics Cards */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono font-bold text-xs text-slate-500 block">
                  Parent: {formData.parentPartyType} • Code: {formData.subTypeCode}
                </span>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>{formData.subTypeName}</span>
                  <span className="font-mono text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">
                    {formData.subTypeCode}
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
                  {formData.activeStatus ? "Active Sub Type" : "Inactive"}
                </span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Default Commission</span>
                <span className="text-xs font-mono font-bold text-emerald-700 mt-0.5 block">
                  {formData.commissionRatePct}% ({formData.commissionCalcBase})
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Credit Limit Override</span>
                <span className="text-xs font-mono font-bold text-slate-900 mt-0.5 block">
                  {formatINR(formData.creditLimitOverride)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Credit Days Terms</span>
                <span className="text-xs font-mono font-bold text-slate-900 mt-0.5 block">
                  {formData.creditDaysOverride} Days
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Contract Expiry</span>
                <span className="text-xs font-mono font-bold text-emerald-800 mt-0.5 block truncate">
                  {formData.contractExpiryDate}
                </span>
              </div>
            </div>
          </div>

          {/* Section Navigation Tabs (IDENTICAL TO COMPANY SETTINGS & PARTY MASTER TAB BAR) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xs flex border-b border-slate-200 overflow-x-auto gap-1">
            {[
              { id: "identity", label: "Sub Type Identity & Parent", icon: Tag },
              { id: "financial", label: "Financial & Commission Rules", icon: Percent },
              { id: "credit", label: "Credit Limits & Terms", icon: CreditCard },
              { id: "compliance", label: "Compliance & Terms", icon: ShieldCheck },
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
            {/* 🏷️ TAB 1: SUB TYPE IDENTITY & PARENT */}
            {activeTab === "identity" && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-emerald-600" />
                      Sub Type Category Mapping
                    </span>
                    <span className="text-[11px] font-mono text-emerald-800 font-bold">WINHMS SUB TYPE</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label="Parent Party Type" required>
                      <SelectInput
                        value={formData.parentPartyType}
                        onChange={(e) => handleFormChange("parentPartyType", e.target.value)}
                        className="bg-white font-bold text-slate-900 h-9"
                      >
                        <option value="Travel Agent">Travel Agent</option>
                        <option value="Corporate Client">Corporate Client</option>
                        <option value="Vendor / Creditor">Vendor / Creditor</option>
                        <option value="Guest / Customer">Guest / Customer</option>
                        <option value="Government / Tax Body">Government / Tax Body</option>
                      </SelectInput>
                    </FormField>

                    <FormField label="Sub Type Code" required>
                      <TextInput
                        value={formData.subTypeCode}
                        onChange={(e) => handleFormChange("subTypeCode", e.target.value.toUpperCase())}
                        className="bg-white font-mono font-bold text-slate-900 h-9"
                      />
                    </FormField>

                    <FormField label="Sub Type Name" required>
                      <TextInput
                        value={formData.subTypeName}
                        onChange={(e) => handleFormChange("subTypeName", e.target.value)}
                        className="bg-white font-bold text-slate-900 h-9"
                      />
                    </FormField>
                  </div>

                  <FormField label="Description / Sub Category Notes">
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
                      <span>Active Sub Type Category</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.allowDirectSettlement}
                        onChange={(e) => handleFormChange("allowDirectSettlement", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Allow Direct Bill Settlement & City Ledger Transfer</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 📊 TAB 2: FINANCIAL & COMMISSION RULES */}
            {activeTab === "financial" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <Percent className="h-4 w-4 text-emerald-600" />
                    Commission Rates & Discount Schedules
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label="Default Commission Rate (%)">
                      <TextInput
                        type="number"
                        step="0.5"
                        value={formData.commissionRatePct}
                        onChange={(e) => handleFormChange("commissionRatePct", parseFloat(e.target.value) || 0)}
                        className="bg-white font-mono font-bold text-slate-900 h-9"
                      />
                    </FormField>

                    <FormField label="Commission Calculation Base">
                      <SelectInput
                        value={formData.commissionCalcBase}
                        onChange={(e) => handleFormChange("commissionCalcBase", e.target.value)}
                        className="bg-white font-semibold h-9"
                      >
                        <option value="Room Only Rate">Room Only Rate (Excluding Food)</option>
                        <option value="Total Revenue">Total Bill Revenue (Inclusive)</option>
                        <option value="Fixed Amount">Fixed Amount per Booking</option>
                      </SelectInput>
                    </FormField>

                    <FormField label="Default Discount Rate (%)">
                      <TextInput
                        type="number"
                        step="0.5"
                        value={formData.defaultDiscountPct}
                        onChange={(e) => handleFormChange("defaultDiscountPct", parseFloat(e.target.value) || 0)}
                        className="bg-white font-mono h-9"
                      />
                    </FormField>
                  </div>

                  <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.allowNegotiatedRates}
                        onChange={(e) => handleFormChange("allowNegotiatedRates", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Allow Negotiated Contract Rates & Custom Tariff Schedules</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 💳 TAB 3: CREDIT LIMITS & TERMS OVERRIDE */}
            {activeTab === "credit" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-emerald-600" />
                    Sub Type Specific Credit Policies & Terms
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label="Credit Limit Override (INR)" required>
                      <TextInput
                        type="number"
                        value={formData.creditLimitOverride}
                        onChange={(e) => handleFormChange("creditLimitOverride", parseFloat(e.target.value) || 0)}
                        className="bg-white font-mono font-bold text-slate-900 h-9"
                      />
                    </FormField>

                    <FormField label="Credit Period Override (Days)">
                      <TextInput
                        type="number"
                        value={formData.creditDaysOverride}
                        onChange={(e) => handleFormChange("creditDaysOverride", parseInt(e.target.value) || 0)}
                        className="bg-white font-mono font-bold text-slate-900 h-9"
                      />
                    </FormField>

                    <FormField label="Late Fee Interest Rate (% p.a.)">
                      <TextInput
                        type="number"
                        step="0.1"
                        value={formData.lateFeePct}
                        onChange={(e) => handleFormChange("lateFeePct", parseFloat(e.target.value) || 0)}
                        className="bg-white font-mono h-9"
                      />
                    </FormField>
                  </div>

                  <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.requireSecurityDeposit}
                        onChange={(e) => handleFormChange("requireSecurityDeposit", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Require Security Deposit or Bank Guarantee Letter</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 🛡️ TAB 4: COMPLIANCE & OPERATIONAL TERMS */}
            {activeTab === "compliance" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Agreement Expiry & Statutory Controls
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Contract Agreement Expiry Date">
                      <TextInput
                        value={formData.contractExpiryDate}
                        onChange={(e) => handleFormChange("contractExpiryDate", e.target.value)}
                        placeholder="DD/MM/YYYY"
                        className="bg-white font-mono h-9"
                      />
                    </FormField>

                    <FormField label="Authorized Signatory">
                      <TextInput
                        value={formData.signBy}
                        onChange={(e) => handleFormChange("signBy", e.target.value)}
                        className="bg-white font-semibold h-9"
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.statutoryRegMandatory}
                        onChange={(e) => handleFormChange("statutoryRegMandatory", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Mandatory Statutory Registration Documents</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.blacklistingAllowed}
                        onChange={(e) => handleFormChange("blacklistingAllowed", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Allow Blacklisting for Non-Payment</span>
                    </label>
                  </div>

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
