"use client";

import React, { useState, useMemo } from "react";
import {
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
  Landmark,
  Zap,
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
  sampleBankReconciliationTypesData,
  BankReconciliationTypeRecord,
} from "@/app/data/accounts/bankReconciliationTypeData";
import { cn } from "@/lib/utils";

export function BankReconciliationTypeMasterView() {
  // Master List State
  const [types, setTypes] = useState<BankReconciliationTypeRecord[]>(sampleBankReconciliationTypesData);
  const [selectedId, setSelectedId] = useState<string>(sampleBankReconciliationTypesData[0].id);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  // Selected Record
  const activeRecord = useMemo(
    () => types.find((t) => t.id === selectedId) || types[0],
    [types, selectedId]
  );

  // Form State
  const [formData, setFormData] = useState<BankReconciliationTypeRecord>(activeRecord);

  // Sectional Tab ('general' | 'matching' | 'ledgers' | 'audit')
  const [activeTab, setActiveTab] = useState<"general" | "matching" | "ledgers" | "audit">("general");

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync Form Data when selected record changes
  React.useEffect(() => {
    setFormData({ ...activeRecord });
  }, [activeRecord]);

  // Filtered List
  const filteredTypes = useMemo(() => {
    return types.filter((t) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          t.typeCode.toLowerCase().includes(q) ||
          t.typeName.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [types, searchQuery]);

  // Field Change Handler
  const handleFormChange = (field: keyof BankReconciliationTypeRecord, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Add New Action
  const handleNewType = () => {
    const newRecord: BankReconciliationTypeRecord = {
      id: `brt-${Date.now()}`,
      typeCode: "AUTO_BANK",
      typeName: "Direct Auto Debit / ECS",
      category: "Electronic / UTR",
      seqNo: types.length + 1,
      activeStatus: true,
      matchingRule: "Match by UTR Number",
      clearingPeriodDays: 1,
      autoClearExactMatches: true,
      allowPartialClearing: false,
      bankChargeLedger: "5200 - Bank Charges & Service Fees A/c",
      interestIncomeLedger: "4300 - Bank Interest Income A/c",
      merchantDiscountPct: 0.0,
      autoPostFeeJournal: false,
      requireStatementAttachment: true,
      requireSeniorSignOff: false,
      signBy: "Accounts Lead",
      updatedBy: "Jay Admin",
      updatedDate: "Today",
    };

    setTypes([newRecord, ...types]);
    setSelectedId(newRecord.id);
    setFormData(newRecord);
    setToastMessage(`Created new Bank Reconciliation Type (${newRecord.typeName}).`);
  };

  // Save Settings Action
  const handleSaveSettings = () => {
    setTypes((prev) =>
      prev.map((t) => (t.id === formData.id ? { ...formData, updatedDate: "Just Now" } : t))
    );
    setFormData((prev) => ({ ...prev, updatedDate: "Just Now" }));
    setToastMessage(`Saved Bank Reconciliation Type '${formData.typeName}' setup successfully!`);
  };

  // Reset Action
  const handleReset = () => {
    setFormData({ ...activeRecord });
    setToastMessage("Reset Bank Reconciliation Type fields to saved values.");
  };

  // Export CSV Action
  const handleExportCSV = () => {
    const csvHeader = "Code,TypeName,Category,MatchingRule,ClearingDays,ChargeLedger,Active\n";
    const csvRows = filteredTypes
      .map(
        (t) =>
          `"${t.typeCode}","${t.typeName}","${t.category}","${t.matchingRule}","${t.clearingPeriodDays}","${t.bankChargeLedger}","${t.activeStatus}"`
      )
      .join("\n");
    const blob = new Blob([csvHeader + csvRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Bank_Reconciliation_Types_Report_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMessage("Exported Bank Reconciliation Types configuration to CSV.");
  };

  return (
    <ModulePageShell
      eyebrow="Accounts & Masters"
      title="Bank Reconciliation Type"
      description="Define bank statement clearing categories, auto-matching rules, clearing period thresholds, and bank charge ledgers."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Masters", href: "/accounts/masters" },
        { label: "Bank Reconciliation Type" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleNewType}
            className="rounded-xl text-xs font-bold bg-white text-slate-800 border-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1 text-emerald-600" />
            + New Type
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
              <Landmark className="h-3.5 w-3.5 text-slate-600" />
              Category: {formData.typeName} ({formData.typeCode})
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
              Status: {formData.activeStatus ? "Active Clearing Type" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Split Layout: 35% Left Types List / 65% Right Form */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6 font-sans text-xs">
        {/* LEFT PANEL (35% Desktop / 40% Tablet / 100% Mobile) - Types List */}
        <div className="md:col-span-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col min-h-[620px]">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Landmark className="h-4.5 w-4.5 text-emerald-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Reconciliation Types ({filteredTypes.length})
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              Bank Master
            </span>
          </div>

          {/* Quick Search */}
          <div className="mb-3 relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Code, type name, category..."
              className="h-8 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Records List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[600px]">
            {filteredTypes.map((item) => {
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
                          {item.typeCode}
                        </span>
                        <span className="truncate max-w-[140px]">{item.typeName}</span>
                      </h4>
                      <span className="text-[11px] font-semibold text-slate-500 block mt-0.5">
                        Category: <strong className="text-slate-700">{item.category}</strong>
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
                    <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded truncate max-w-[150px]">
                      {item.matchingRule}
                    </span>
                    <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-mono">
                      {item.clearingPeriodDays} Days
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL (65% Desktop / 60% Tablet / 100% Mobile) - Type Form */}
        <div className="md:col-span-8 space-y-4">
          {/* Top Overview Metrics Cards */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono font-bold text-xs text-slate-500 block">
                  Category: {formData.category} • Code: {formData.typeCode}
                </span>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>{formData.typeName}</span>
                  <span className="font-mono text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">
                    {formData.typeCode}
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
                  {formData.activeStatus ? "Active Clearing Type" : "Inactive"}
                </span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Matching Primary Rule</span>
                <span className="text-xs font-mono font-bold text-emerald-700 mt-0.5 block truncate">
                  {formData.matchingRule}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Clearing Threshold</span>
                <span className="text-xs font-mono font-bold text-slate-900 mt-0.5 block">
                  {formData.clearingPeriodDays} Business Days
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Default Charge Ledger</span>
                <span className="text-xs font-mono font-bold text-slate-900 mt-0.5 block truncate">
                  {formData.bankChargeLedger}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Statement Attachment</span>
                <span className="text-xs font-mono font-bold text-emerald-800 mt-0.5 block">
                  {formData.requireStatementAttachment ? "Mandatory" : "Optional"}
                </span>
              </div>
            </div>
          </div>

          {/* Section Navigation Tabs (IDENTICAL TO COMPANY SETTINGS & PARTY MASTER TAB BAR) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xs flex border-b border-slate-200 overflow-x-auto gap-1">
            {[
              { id: "general", label: "General & Category", icon: Landmark },
              { id: "matching", label: "Matching & Auto-Clearing", icon: Zap },
              { id: "ledgers", label: "Bank Charges & Income", icon: Building },
              { id: "audit", label: "Audit & Statement Attachments", icon: ShieldCheck },
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
            {/* 🏦 TAB 1: GENERAL & CATEGORY */}
            {activeTab === "general" && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Landmark className="h-4 w-4 text-emerald-600" />
                      Reconciliation Category Identity
                    </span>
                    <span className="text-[11px] font-mono text-emerald-800 font-bold">WINHMS BRS MASTER</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label="Reconciliation Type Code" required>
                      <TextInput
                        value={formData.typeCode}
                        onChange={(e) => handleFormChange("typeCode", e.target.value.toUpperCase())}
                        className="bg-white font-mono font-bold text-slate-900 h-9"
                      />
                    </FormField>

                    <FormField label="Reconciliation Type Name" required>
                      <TextInput
                        value={formData.typeName}
                        onChange={(e) => handleFormChange("typeName", e.target.value)}
                        className="bg-white font-bold text-slate-900 h-9"
                      />
                    </FormField>

                    <FormField label="Sequence Number">
                      <TextInput
                        type="number"
                        value={formData.seqNo}
                        onChange={(e) => handleFormChange("seqNo", parseInt(e.target.value) || 1)}
                        className="bg-white font-mono font-bold h-9"
                      />
                    </FormField>
                  </div>

                  <FormField label="Reconciliation Category" required>
                    <SelectInput
                      value={formData.category}
                      onChange={(e) => handleFormChange("category", e.target.value)}
                      className="bg-white font-bold text-slate-900 h-9"
                    >
                      <option value="Cheque">Cheque (Outward / Inward Cheque Clearing)</option>
                      <option value="Electronic / UTR">Electronic / UTR (NEFT, RTGS, IMPS)</option>
                      <option value="Credit Card Merchant">Credit Card Merchant (EDC Settlement)</option>
                      <option value="Bank Adjustment">Bank Adjustment (Charges & Interest)</option>
                    </SelectInput>
                  </FormField>

                  <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.activeStatus}
                        onChange={(e) => handleFormChange("activeStatus", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Active Bank Reconciliation Type</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ⚡ TAB 2: MATCHING & AUTO-CLEARING */}
            {activeTab === "matching" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-emerald-600" />
                    Auto-Matching Rules & Grace Thresholds
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Primary Statement Matching Engine Rule" required>
                      <SelectInput
                        value={formData.matchingRule}
                        onChange={(e) => handleFormChange("matchingRule", e.target.value)}
                        className="bg-white font-bold text-slate-900 h-9"
                      >
                        <option value="Match by Cheque / Ref Number">Match by Cheque / Ref Number</option>
                        <option value="Match by UTR Number">Match by UTR Number (Electronic)</option>
                        <option value="Match by Amount & Date">Match by Amount & Date Range</option>
                      </SelectInput>
                    </FormField>

                    <FormField label="Clearing Grace Period (Business Days)">
                      <TextInput
                        type="number"
                        value={formData.clearingPeriodDays}
                        onChange={(e) => handleFormChange("clearingPeriodDays", parseInt(e.target.value) || 0)}
                        className="bg-white font-mono font-bold text-slate-900 h-9"
                      />
                    </FormField>
                  </div>

                  <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.autoClearExactMatches}
                        onChange={(e) => handleFormChange("autoClearExactMatches", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Automatically Clear 100% Exact Matching Entries</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.allowPartialClearing}
                        onChange={(e) => handleFormChange("allowPartialClearing", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Allow Partial Amount Clearing (Split Transactions)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 🧾 TAB 3: BANK CHARGE & INCOME LEDGERS */}
            {activeTab === "ledgers" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <Building className="h-4 w-4 text-emerald-600" />
                    Automated Fee & Income General Ledger Mappings
                  </h3>

                  <FormField label="Default Bank Service Charges Ledger" required>
                    <SelectInput
                      value={formData.bankChargeLedger}
                      onChange={(e) => handleFormChange("bankChargeLedger", e.target.value)}
                      className="bg-white font-bold text-slate-900 h-9"
                    >
                      <option value="5200 - Bank Charges & Service Fees A/c">
                        5200 - Bank Charges & Service Fees A/c
                      </option>
                      <option value="5250 - EDC Credit Card Merchant Commission A/c">
                        5250 - EDC Credit Card Merchant Commission A/c
                      </option>
                    </SelectInput>
                  </FormField>

                  <FormField label="Default Bank Interest Income Ledger">
                    <SelectInput
                      value={formData.interestIncomeLedger}
                      onChange={(e) => handleFormChange("interestIncomeLedger", e.target.value)}
                      className="bg-white font-bold text-slate-900 h-9"
                    >
                      <option value="4300 - Bank Interest Income A/c">
                        4300 - Bank Interest Income A/c
                      </option>
                    </SelectInput>
                  </FormField>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Merchant Discount Rate (% Fee Deduction)">
                      <TextInput
                        type="number"
                        step="0.1"
                        value={formData.merchantDiscountPct}
                        onChange={(e) => handleFormChange("merchantDiscountPct", parseFloat(e.target.value) || 0)}
                        className="bg-white font-mono font-bold text-slate-900 h-9"
                      />
                    </FormField>

                    <div className="flex items-center pt-6">
                      <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                        <input
                          type="checkbox"
                          checked={formData.autoPostFeeJournal}
                          onChange={(e) => handleFormChange("autoPostFeeJournal", e.target.checked)}
                          className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                        />
                        <span>Auto-Post Fee Deduction Journal Voucher</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 🛡️ TAB 4: AUDIT & STATEMENT ATTACHMENTS */}
            {activeTab === "audit" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Statement Upload & Senior Authorization Rules
                  </h3>

                  <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.requireStatementAttachment}
                        onChange={(e) => handleFormChange("requireStatementAttachment", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Require PDF / Excel Bank Statement Attachment for Verification</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.requireSeniorSignOff}
                        onChange={(e) => handleFormChange("requireSeniorSignOff", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Require Senior Auditor Sign-Off for Manual Force Clearing</span>
                    </label>
                  </div>

                  <FormField label="Sign By (Authorized Auditor Line)">
                    <TextInput
                      value={formData.signBy}
                      onChange={(e) => handleFormChange("signBy", e.target.value)}
                      placeholder="e.g. Finance Controller / Auditor"
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
