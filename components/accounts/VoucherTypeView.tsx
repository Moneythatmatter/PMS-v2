"use client";

import React, { useState, useMemo } from "react";
import {
  FileText,
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
  Check,
  Palette,
  CreditCard,
  FileCode,
  Tag,
  PenTool,
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
  sampleVoucherTypesData,
  VoucherTypeRecord,
} from "@/app/data/accounts/voucherTypeData";
import { cn } from "@/lib/utils";

export function VoucherTypeView() {
  // Master Voucher Types List State
  const [voucherTypes, setVoucherTypes] = useState<VoucherTypeRecord[]>(sampleVoucherTypesData);
  const [selectedId, setSelectedId] = useState<string>(sampleVoucherTypesData[0].id);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  // Currently Selected Record
  const activeRecord = useMemo(
    () => voucherTypes.find((v) => v.id === selectedId) || voucherTypes[0],
    [voucherTypes, selectedId]
  );

  // Form State
  const [formData, setFormData] = useState<VoucherTypeRecord>(activeRecord);

  // Sectional Tab ('general' | 'transaction' | 'tax' | 'ledger')
  const [activeTab, setActiveTab] = useState<"general" | "transaction" | "tax" | "ledger">("general");

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Update formData when activeRecord changes
  React.useEffect(() => {
    setFormData({ ...activeRecord });
  }, [activeRecord]);

  // Filtered List
  const filteredVoucherTypes = useMemo(() => {
    return voucherTypes.filter((v) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          v.voucherTypeId.toLowerCase().includes(q) ||
          v.voucherTypeName.toLowerCase().includes(q) ||
          v.voucherShortName.toLowerCase().includes(q) ||
          v.voucherPrefix.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [voucherTypes, searchQuery]);

  // Form Field Change Helper
  const handleFormChange = (field: keyof VoucherTypeRecord, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Add New Voucher Type Action
  const handleNewVoucherType = () => {
    const newRecord: VoucherTypeRecord = {
      id: `vt-${Date.now()}`,
      voucherTypeId: "Custom Voucher",
      voucherTypeName: "New Voucher Type",
      voucherShortName: "NV",
      seqNo: voucherTypes.length + 1,
      underVoucherType: "Primary",
      voucherNoType: "Automatic",
      voucherPrefix: "NV/26-27/",
      docType: "Journal",
      defaultDrCr: "DR",
      defaultRefType: "New Ref",
      activeTransaction: true,
      provisionalTrn: false,
      defaultDateSystemDate: true,
      commonNarrationMandatory: true,
      transactionBgColor: "#ecfdf5",
      voucherPrintingRequired: true,
      tdsApplicable: false,
      acceptBankBranchName: true,
      recurringChargeApplicable: false,
      otherDeductionsApplicable: false,
      approvalApplicable: true,
      allowExcelImport: true,
      atleastOneCreditBankLedger: false,
      atleastOneCreditCashLedger: false,
      signBy: "Accounts Manager",
      updatedBy: "Jay Admin",
      updatedDate: "Today",
    };

    setVoucherTypes([newRecord, ...voucherTypes]);
    setSelectedId(newRecord.id);
    setFormData(newRecord);
    setToastMessage(`Created new Voucher Type record (${newRecord.voucherTypeName}).`);
  };

  // Save Settings Action
  const handleSaveSettings = () => {
    setVoucherTypes((prev) =>
      prev.map((v) => (v.id === formData.id ? { ...formData, updatedDate: "Just Now" } : v))
    );
    setFormData((prev) => ({ ...prev, updatedDate: "Just Now" }));
    setToastMessage(`Saved Voucher Type '${formData.voucherTypeName}' settings successfully!`);
  };

  // Reset Action
  const handleReset = () => {
    setFormData({ ...activeRecord });
    setToastMessage("Reset Voucher Type fields to saved values.");
  };

  // Export CSV Action
  const handleExportCSV = () => {
    const csvHeader = "VoucherTypeID,VoucherTypeName,ShortName,SeqNo,VoucherNoType,Prefix,DocType,Active\n";
    const csvRows = filteredVoucherTypes
      .map(
        (v) =>
          `"${v.voucherTypeId}","${v.voucherTypeName}","${v.voucherShortName}","${v.seqNo}","${v.voucherNoType}","${v.voucherPrefix}","${v.docType}","${v.activeTransaction}"`
      )
      .join("\n");
    const blob = new Blob([csvHeader + csvRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Voucher_Types_Report_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMessage("Exported Voucher Types configuration to CSV.");
  };

  return (
    <ModulePageShell
      eyebrow="Accounts & Masters"
      title="Voucher Type"
      description="Configure accounting voucher definitions, numbering series, taxation rules, approval workflows, and transaction constraints."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Masters", href: "/accounts/masters" },
        { label: "Voucher Type" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleNewVoucherType}
            className="rounded-xl text-xs font-bold bg-white text-slate-800 border-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1 text-emerald-600" />
            + New Voucher Type
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
              Selected Voucher: {formData.voucherShortName} ({formData.voucherTypeId})
            </span>

            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3 py-1 font-bold border",
                formData.activeTransaction
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
              Status: {formData.activeTransaction ? "Active Transaction" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Split Layout: 35% Left Voucher Master List / 65% Right Form */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6 font-sans text-xs">
        {/* LEFT PANEL (35% Desktop / 40% Tablet / 100% Mobile) - Voucher Master List */}
        <div className="md:col-span-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col min-h-[620px]">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-emerald-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Voucher Types ({filteredVoucherTypes.length})
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              WINHMS Master
            </span>
          </div>

          {/* Quick Search */}
          <div className="mb-3 relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Voucher Type ID, name..."
              className="h-8 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Voucher Records List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[600px]">
            {filteredVoucherTypes.map((item) => {
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
                          {item.voucherShortName}
                        </span>
                        <span>{item.voucherTypeName}</span>
                      </h4>
                      <span className="text-[11px] font-semibold text-slate-500 block mt-0.5">
                        Prefix: <code className="font-mono text-slate-700">{item.voucherPrefix}</code>
                      </span>
                    </div>

                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 border",
                        item.activeTransaction
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      )}
                    >
                      {item.activeTransaction ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px]">
                    <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      Seq: #{item.seqNo}
                    </span>
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {item.voucherNoType}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL (65% Desktop / 60% Tablet / 100% Mobile) - Voucher Form */}
        <div className="md:col-span-8 space-y-4">
          {/* Top Overview Metrics Cards */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono font-bold text-xs text-slate-500 block">
                  Category: {formData.underVoucherType} • Doc Type: {formData.docType}
                </span>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>{formData.voucherTypeName}</span>
                  <span className="font-mono text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">
                    {formData.voucherShortName}
                  </span>
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "px-3 py-1 rounded-xl text-xs font-bold border",
                    formData.activeTransaction
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  )}
                >
                  {formData.activeTransaction ? "Active Transaction" : "Inactive"}
                </span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Voucher Numbering</span>
                <span className="text-xs font-mono font-bold text-emerald-700 mt-0.5 block">
                  {formData.voucherNoType}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Series Prefix</span>
                <span className="text-xs font-mono font-bold text-slate-900 mt-0.5 block truncate">
                  {formData.voucherPrefix}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Default DR/CR</span>
                <span className="text-xs font-mono font-bold text-emerald-800 mt-0.5 block">
                  {formData.defaultDrCr} Indicator
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Approval Required</span>
                <span className="text-xs font-mono font-bold text-slate-900 mt-0.5 block">
                  {formData.approvalApplicable ? "Yes (Super-User)" : "No"}
                </span>
              </div>
            </div>
          </div>

          {/* Section Navigation Tabs (IDENTICAL TO COMPANY SETTINGS & PARTY MASTER TAB BAR) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xs flex border-b border-slate-200 overflow-x-auto gap-1">
            {[
              { id: "general", label: "General & Particulars", icon: FileText },
              { id: "transaction", label: "Transaction & Entry Rules", icon: SlidersHorizontal },
              { id: "tax", label: "Taxation, Bank & Printing", icon: CreditCard },
              { id: "ledger", label: "Ledger Constraints & Sign-off", icon: ShieldCheck },
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
            {/* 📝 TAB 1: GENERAL & PARTICULARS */}
            {activeTab === "general" && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-emerald-600" />
                      Voucher Type Master Identity & Numbering
                    </span>
                    <span className="text-[11px] font-mono text-emerald-800 font-bold">WINHMS GL MASTER</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Voucher Type ID" required>
                      <SelectInput
                        value={formData.voucherTypeId}
                        onChange={(e) => handleFormChange("voucherTypeId", e.target.value)}
                        className="bg-white font-bold text-slate-900 h-9"
                      >
                        <option value="Contra">Contra</option>
                        <option value="Credit Note">Credit Note</option>
                        <option value="Debit Note">Debit Note</option>
                        <option value="Journal">Journal</option>
                        <option value="Payments">Payments</option>
                        <option value="Provisional">Provisional</option>
                        <option value="Purchase">Purchase</option>
                        <option value="Receipts">Receipts</option>
                        <option value="Sales">Sales</option>
                      </SelectInput>
                    </FormField>

                    <FormField label="Voucher Type Name" required>
                      <TextInput
                        value={formData.voucherTypeName}
                        onChange={(e) => handleFormChange("voucherTypeName", e.target.value)}
                        className="bg-white font-bold text-slate-900 h-9"
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label="Voucher Short Name" required>
                      <TextInput
                        value={formData.voucherShortName}
                        onChange={(e) => handleFormChange("voucherShortName", e.target.value)}
                        className="bg-white font-mono font-bold text-slate-900 h-9"
                      />
                    </FormField>

                    <FormField label="Sequence Number (Seq No.)">
                      <TextInput
                        type="number"
                        value={formData.seqNo}
                        onChange={(e) => handleFormChange("seqNo", parseInt(e.target.value) || 1)}
                        className="bg-white font-mono font-bold h-9"
                      />
                    </FormField>

                    <FormField label="Under Voucher Type">
                      <SelectInput
                        value={formData.underVoucherType}
                        onChange={(e) => handleFormChange("underVoucherType", e.target.value)}
                        className="bg-white font-semibold h-9"
                      >
                        <option value="Primary">Primary</option>
                        <option value="Journal">Journal Sub-Category</option>
                        <option value="Payments">Payments Sub-Category</option>
                        <option value="Receipts">Receipts Sub-Category</option>
                      </SelectInput>
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label="Voucher Numbering Type">
                      <SelectInput
                        value={formData.voucherNoType}
                        onChange={(e) => handleFormChange("voucherNoType", e.target.value)}
                        className="bg-white font-bold text-slate-900 h-9"
                      >
                        <option value="Automatic">Automatic Series</option>
                        <option value="Manual">Manual Entry</option>
                        <option value="Monthly Reset">Monthly Reset</option>
                        <option value="Yearly Reset">Yearly Reset</option>
                      </SelectInput>
                    </FormField>

                    <FormField label="Voucher Series Prefix">
                      <TextInput
                        value={formData.voucherPrefix}
                        onChange={(e) => handleFormChange("voucherPrefix", e.target.value)}
                        placeholder="e.g. JV/26-27/"
                        className="bg-white font-mono font-bold h-9"
                      />
                    </FormField>

                    <FormField label="Document Type (Doc Type)">
                      <SelectInput
                        value={formData.docType}
                        onChange={(e) => handleFormChange("docType", e.target.value)}
                        className="bg-white font-semibold h-9"
                      >
                        <option value="None">&lt;None&gt;</option>
                        <option value="Invoice">Invoice</option>
                        <option value="Receipt">Receipt</option>
                        <option value="Payment">Payment</option>
                        <option value="Credit Note">Credit Note</option>
                        <option value="Debit Note">Debit Note</option>
                        <option value="Journal">Journal</option>
                      </SelectInput>
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Default 1st Line DR/CR Indicator">
                      <SelectInput
                        value={formData.defaultDrCr}
                        onChange={(e) => handleFormChange("defaultDrCr", e.target.value)}
                        className="bg-white font-bold text-slate-900 h-9"
                      >
                        <option value="DR">DR (Debit)</option>
                        <option value="CR">CR (Credit)</option>
                      </SelectInput>
                    </FormField>

                    <FormField label="Default Reference Type for Bill Detail">
                      <SelectInput
                        value={formData.defaultRefType}
                        onChange={(e) => handleFormChange("defaultRefType", e.target.value)}
                        className="bg-white font-semibold h-9"
                      >
                        <option value="Agst Ref">Against Reference (Agst Ref)</option>
                        <option value="New Ref">New Reference (New Ref)</option>
                        <option value="Advance">Advance Payment</option>
                        <option value="On Account">On Account</option>
                      </SelectInput>
                    </FormField>
                  </div>
                </div>
              </div>
            )}

            {/* ⚙️ TAB 2: TRANSACTION & ENTRY RULES */}
            {activeTab === "transaction" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
                    Transaction Screen Flags & Appearance
                  </h3>

                  <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.activeTransaction}
                        onChange={(e) => handleFormChange("activeTransaction", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Active Transaction (Enable Voucher Entry in Accounts Module)</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.provisionalTrn}
                        onChange={(e) => handleFormChange("provisionalTrn", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Provisional Transaction (Temporary Unposted Voucher)</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.defaultDateSystemDate}
                        onChange={(e) => handleFormChange("defaultDateSystemDate", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Default Transaction Date as System Date, Yes</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.commonNarrationMandatory}
                        onChange={(e) => handleFormChange("commonNarrationMandatory", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Common Narration Mandatory, Yes</span>
                    </label>
                  </div>

                  <FormField label="Transaction Screen Background Color Theme">
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.transactionBgColor || "#ecfdf5"}
                        onChange={(e) => handleFormChange("transactionBgColor", e.target.value)}
                        className="h-9 w-14 rounded-xl border border-slate-300 p-0.5 cursor-pointer"
                      />
                      <TextInput
                        value={formData.transactionBgColor || "#ecfdf5"}
                        onChange={(e) => handleFormChange("transactionBgColor", e.target.value)}
                        className="font-mono text-xs font-bold max-w-[150px] bg-white h-9"
                      />
                      <span className="text-slate-500 font-semibold text-[11px]">
                        Custom WINHMS Grid Color Code
                      </span>
                    </div>
                  </FormField>
                </div>
              </div>
            )}

            {/* 🧾 TAB 3: TAXATION, BANK & PRINTING */}
            {activeTab === "tax" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-emerald-600" />
                    Taxation, Bank Details & Printing Controls
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.voucherPrintingRequired}
                        onChange={(e) => handleFormChange("voucherPrintingRequired", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Voucher Printing Required, Yes</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.tdsApplicable}
                        onChange={(e) => handleFormChange("tdsApplicable", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>TDS Applicable, Yes</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.acceptBankBranchName}
                        onChange={(e) => handleFormChange("acceptBankBranchName", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Accept Bank / Branch Name, Yes</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.recurringChargeApplicable}
                        onChange={(e) => handleFormChange("recurringChargeApplicable", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Recurring Charge Applicable, Yes</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.otherDeductionsApplicable}
                        onChange={(e) => handleFormChange("otherDeductionsApplicable", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Other Deductions Applicable, Yes</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.approvalApplicable}
                        onChange={(e) => handleFormChange("approvalApplicable", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Approval Workflow Applicable, Yes</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800 sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={formData.allowExcelImport}
                        onChange={(e) => handleFormChange("allowExcelImport", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Allow Import of Voucher from Excel</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 🏦 TAB 4: LEDGER CONSTRAINTS & SIGN-OFF */}
            {activeTab === "ledger" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Ledger Rules & Sign-Off Authorization
                  </h3>

                  <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.atleastOneCreditBankLedger}
                        onChange={(e) => handleFormChange("atleastOneCreditBankLedger", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Atleast one Credit should be Bank Ledger</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.atleastOneCreditCashLedger}
                        onChange={(e) => handleFormChange("atleastOneCreditCashLedger", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Atleast one Credit should be Cash Ledger</span>
                    </label>
                  </div>

                  <FormField label="Sign By (Authorized Signatory Line)">
                    <TextInput
                      value={formData.signBy}
                      onChange={(e) => handleFormChange("signBy", e.target.value)}
                      placeholder="e.g. Accounts Manager / Senior Auditor"
                      className="bg-white font-semibold h-9"
                    />
                  </FormField>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 text-slate-500 font-mono text-[11px]">
                    <div>
                      Update By: <strong className="text-slate-800">{formData.updatedBy}</strong>
                    </div>
                    <div>
                      Update Date: <strong className="text-slate-800">{formData.updatedDate}</strong>
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
