"use client";

import React, { useState } from "react";
import {
  Settings,
  Save,
  RotateCcw,
  Printer,
  Download,
  Building2,
  SlidersHorizontal,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  FileText,
  DollarSign,
  Lock,
  Building,
  CheckSquare,
  Square,
  Info,
  Calendar,
  Layers,
  FileCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  TextInput,
  SelectInput,
  StatMiniCard,
  FODatePicker,
  formatINR,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import {
  initialCompanySettings,
  CompanySettingsModel,
} from "@/app/data/accounts/companySettingsData";
import { cn } from "@/lib/utils";

export function CompanySettingsView() {
  // Master Settings State
  const [settings, setSettings] = useState<CompanySettingsModel>(initialCompanySettings);

  // Tab State
  const [activeTab, setActiveTab] = useState<"general" | "vouchers" | "gl" | "tax" | "hotel">("general");

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form Field Change Handler
  const handleChange = (field: keyof CompanySettingsModel, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  // Handlers for Save & Reset
  const handleSaveSettings = () => {
    setSettings((prev) => ({
      ...prev,
      lastAuditDate: new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));
    setToastMessage("Company accounting settings updated and saved successfully!");
  };

  const handleResetDefaults = () => {
    setSettings(initialCompanySettings);
    setToastMessage("Reset company accounting settings to system default parameters.");
  };

  const handleExportConfig = () => {
    const jsonStr = JSON.stringify(settings, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Company_Settings_${settings.companyCode}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMessage("Exported Company Settings configuration JSON.");
  };

  return (
    <ModulePageShell
      eyebrow="Accounts & Masters"
      title="Company Settings"
      description="Configure enterprise accounting rules, general ledger parameters, voucher controls, and operational preferences."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Masters", href: "/accounts/masters" },
        { label: "Company Settings" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex items-center gap-2">
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
            onClick={handleResetDefaults}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Reset Defaults
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Print
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportConfig}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export Config
          </Button>
        </div>
      }
    >
      {/* Top Company Selector Bar */}
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <Building2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="flex-1">
              <span className="font-bold text-xs text-slate-600 block">Target Company Entity:</span>
              <select
                value={settings.companyName}
                onChange={(e) => handleChange("companyName", e.target.value)}
                className="h-8 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
              >
                <option value="LUXY HOTEL & RESORTS PRIVATE LIMITED">LUXY HOTEL & RESORTS PRIVATE LIMITED (CMP-001)</option>
                <option value="LUXY CATERING & BANQUETS LLP">LUXY CATERING & BANQUETS LLP (CMP-002)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-slate-700 border border-slate-200 font-mono">
              <Calendar className="h-3.5 w-3.5 text-slate-600" />
              FY: {settings.financialYear}
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1 text-emerald-800 font-bold border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
              System Status: {settings.accountingMethod} Accounting
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
        {/* Left Column: Tab Controls & Form Sections (8 Cols) */}
        <div className="md:col-span-8 space-y-4">
          {/* Section Navigation Tabs */}
          <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xs flex border-b border-slate-200 overflow-x-auto gap-1">
            {[
              { id: "general", label: "General & Accounting", icon: Settings },
              { id: "vouchers", label: "Voucher Controls", icon: FileText },
              { id: "gl", label: "GL & Credit Policy", icon: CreditCard },
              { id: "tax", label: "Tax & Statutory", icon: ShieldCheck },
              { id: "hotel", label: "Hotel & Operational", icon: Building },
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
            {/* TAB 1: General & Accounting Preferences */}
            {activeTab === "general" && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <Settings className="h-4 w-4 text-emerald-600" />
                  General & Accounting Preferences
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField label="Fiscal Year Start Month">
                    <SelectInput
                      value={settings.fiscalStartMonth}
                      onChange={(e) => handleChange("fiscalStartMonth", e.target.value)}
                    >
                      <option value="April">April (Standard India FY)</option>
                      <option value="January">January (Calendar Year)</option>
                    </SelectInput>
                  </FormField>

                  <FormField label="Default Currency">
                    <SelectInput
                      value={settings.currency}
                      onChange={(e) => handleChange("currency", e.target.value)}
                    >
                      <option value="INR">INR (₹) - Indian Rupee</option>
                      <option value="USD">USD ($) - US Dollar</option>
                      <option value="EUR">EUR (€) - Euro</option>
                    </SelectInput>
                  </FormField>

                  <FormField label="Decimal Precision">
                    <SelectInput
                      value={settings.decimalPlaces}
                      onChange={(e) => handleChange("decimalPlaces", parseInt(e.target.value) || 2)}
                    >
                      <option value={2}>2 Decimals (0.00)</option>
                      <option value={4}>4 Decimals (0.0000)</option>
                    </SelectInput>
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Accounting Method">
                    <SelectInput
                      value={settings.accountingMethod}
                      onChange={(e) => handleChange("accountingMethod", e.target.value)}
                    >
                      <option value="Accrual">Accrual Basis Accounting</option>
                      <option value="Cash">Cash Basis Accounting</option>
                    </SelectInput>
                  </FormField>

                  <FormField label="Lock Financial Period Prior To Date">
                    <FODatePicker
                      value={settings.lockDateBefore}
                      onChange={(val) => handleChange("lockDateBefore", val)}
                    />
                  </FormField>
                </div>

                <div className="space-y-2 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.allowFutureTransactions)}
                      onChange={(e) => handleChange("allowFutureTransactions", e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                    />
                    <span>Allow Future-Dated Transaction Postings</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.allowBackDatedPosting)}
                      onChange={(e) => handleChange("allowBackDatedPosting", e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                    />
                    <span>Allow Back-Dated Voucher Postings (Within 30 Days Limit)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.requireVoucherApproval)}
                      onChange={(e) => handleChange("requireVoucherApproval", e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                    />
                    <span>Require Senior Accountant Approval for Journal Vouchers</span>
                  </label>
                </div>
              </div>
            )}

            {/* TAB 2: Voucher Numbering & Prefix Controls */}
            {activeTab === "vouchers" && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  Voucher Numbering & Prefix Controls
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.autoVoucherNumbering)}
                      onChange={(e) => handleChange("autoVoucherNumbering", e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                    />
                    <span>Automatic System Voucher Numbering</span>
                  </label>

                  <FormField label="Voucher Reset Frequency">
                    <SelectInput
                      value={settings.voucherResetFrequency}
                      onChange={(e) => handleChange("voucherResetFrequency", e.target.value)}
                    >
                      <option value="Annually">Annually at Fiscal Year Start</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Never">Continuous Sequence</option>
                    </SelectInput>
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Payment Voucher */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <h4 className="font-bold text-slate-800 uppercase text-[11px]">Payment Voucher Series</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <FormField label="Prefix">
                        <TextInput
                          value={settings.paymentPrefix}
                          onChange={(e) => handleChange("paymentPrefix", e.target.value)}
                          className="font-mono font-bold"
                        />
                      </FormField>
                      <FormField label="Starting #">
                        <TextInput
                          value={settings.paymentStartNo}
                          onChange={(e) => handleChange("paymentStartNo", e.target.value)}
                          className="font-mono font-bold"
                        />
                      </FormField>
                    </div>
                  </div>

                  {/* Receipt Voucher */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <h4 className="font-bold text-slate-800 uppercase text-[11px]">Receipt Voucher Series</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <FormField label="Prefix">
                        <TextInput
                          value={settings.receiptPrefix}
                          onChange={(e) => handleChange("receiptPrefix", e.target.value)}
                          className="font-mono font-bold"
                        />
                      </FormField>
                      <FormField label="Starting #">
                        <TextInput
                          value={settings.receiptStartNo}
                          onChange={(e) => handleChange("receiptStartNo", e.target.value)}
                          className="font-mono font-bold"
                        />
                      </FormField>
                    </div>
                  </div>

                  {/* Journal Voucher */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <h4 className="font-bold text-slate-800 uppercase text-[11px]">Journal Voucher Series</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <FormField label="Prefix">
                        <TextInput
                          value={settings.journalPrefix}
                          onChange={(e) => handleChange("journalPrefix", e.target.value)}
                          className="font-mono font-bold"
                        />
                      </FormField>
                      <FormField label="Starting #">
                        <TextInput
                          value={settings.journalStartNo}
                          onChange={(e) => handleChange("journalStartNo", e.target.value)}
                          className="font-mono font-bold"
                        />
                      </FormField>
                    </div>
                  </div>

                  {/* Contra Voucher */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <h4 className="font-bold text-slate-800 uppercase text-[11px]">Contra Voucher Series</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <FormField label="Prefix">
                        <TextInput
                          value={settings.contraPrefix}
                          onChange={(e) => handleChange("contraPrefix", e.target.value)}
                          className="font-mono font-bold"
                        />
                      </FormField>
                      <FormField label="Starting #">
                        <TextInput
                          value={settings.contraStartNo}
                          onChange={(e) => handleChange("contraStartNo", e.target.value)}
                          className="font-mono font-bold"
                        />
                      </FormField>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: General Ledger & Credit Controls */}
            {activeTab === "gl" && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                  General Ledger & Credit Controls
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Negative Cash Handling">
                    <SelectInput
                      value={settings.allowNegativeCash}
                      onChange={(e) => handleChange("allowNegativeCash", e.target.value)}
                    >
                      <option value="Warn">Warn User (Allow Posting)</option>
                      <option value="Block">Block Voucher Entry</option>
                      <option value="Allow">Allow Without Warning</option>
                    </SelectInput>
                  </FormField>

                  <FormField label="Enforce Customer Credit Limit">
                    <SelectInput
                      value={settings.enforceCreditLimit}
                      onChange={(e) => handleChange("enforceCreditLimit", e.target.value)}
                    >
                      <option value="Block Transaction">Block Posting on Limit Exceeded</option>
                      <option value="Warn Only">Warn User Only</option>
                      <option value="Ignore">Do Not Enforce</option>
                    </SelectInput>
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField label="Default Receivable Account">
                    <TextInput
                      value={settings.defaultReceivableAcc}
                      onChange={(e) => handleChange("defaultReceivableAcc", e.target.value)}
                    />
                  </FormField>

                  <FormField label="Default Payable Account">
                    <TextInput
                      value={settings.defaultPayableAcc}
                      onChange={(e) => handleChange("defaultPayableAcc", e.target.value)}
                    />
                  </FormField>

                  <FormField label="Default Round Off Account">
                    <TextInput
                      value={settings.defaultRoundOffAcc}
                      onChange={(e) => handleChange("defaultRoundOffAcc", e.target.value)}
                    />
                  </FormField>
                </div>
              </div>
            )}

            {/* TAB 4: Statutory & Tax Configurations */}
            {activeTab === "tax" && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Statutory & Tax Configurations
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Default Tax Jurisdiction / State Region">
                    <TextInput
                      value={settings.defaultTaxRegion}
                      onChange={(e) => handleChange("defaultTaxRegion", e.target.value)}
                    />
                  </FormField>

                  <FormField label="TDS Threshold Exemption Limit (₹)">
                    <TextInput
                      type="number"
                      value={settings.tdsThresholdAmount}
                      onChange={(e) => handleChange("tdsThresholdAmount", parseFloat(e.target.value) || 0)}
                      className="font-mono font-bold text-right"
                    />
                  </FormField>
                </div>

                <div className="space-y-2 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.enableGst)}
                      onChange={(e) => handleChange("enableGst", e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                    />
                    <span>Enable GST Invoicing & Input Tax Credit (ITC) Auto-Computation</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.autoTdsVendorPayments)}
                      onChange={(e) => handleChange("autoTdsVendorPayments", e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                    />
                    <span>Auto-Deduct TDS on Vendor Bill Disbursements Exceeding Threshold</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.enableTcs)}
                      onChange={(e) => handleChange("enableTcs", e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                    />
                    <span>Enable TCS Tax Collection at Source on Room Sales Exceeding Limit</span>
                  </label>
                </div>
              </div>
            )}

            {/* TAB 5: Hotel & Property Operational Settings */}
            {activeTab === "hotel" && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <Building className="h-4 w-4 text-emerald-600" />
                  Hotel & Property Operational Settings
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Default Guest Security Deposit Ledger">
                    <TextInput
                      value={settings.defaultGuestDepositAcc}
                      onChange={(e) => handleChange("defaultGuestDepositAcc", e.target.value)}
                    />
                  </FormField>
                </div>

                <div className="space-y-2 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.autoPostRoomRevenue)}
                      onChange={(e) => handleChange("autoPostRoomRevenue", e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                    />
                    <span>Auto-Post Room Sales Revenue to GL on Night Audit Completion</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.autoPostPosSales)}
                      onChange={(e) => handleChange("autoPostPosSales", e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                    />
                    <span>Auto-Post Restaurant & Banquets POS Revenue at Day-End Closing</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.cityLedgerAutoTransfer)}
                      onChange={(e) => handleChange("cityLedgerAutoTransfer", e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                    />
                    <span>Auto-Transfer Checked-Out Corporate Folios to City Ledger Debtors</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.enableCostCenterAllocations)}
                      onChange={(e) => handleChange("enableCostCenterAllocations", e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                    />
                    <span>Enforce Mandatory Cost Center Allocations on All Expense Vouchers</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Status & Summary Sidebar (4 Cols) */}
        <div className="md:col-span-4 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-4 font-sans text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
              <span>System Audit Summary</span>
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </h3>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-900 block text-xs">Configuration Health</span>
                  <span className="text-[11px] text-emerald-700">100% Fully Validated</span>
                </div>
                <CheckCircle2 className="h-5 w-5 text-emerald-700" />
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-2 text-[11px] text-slate-700">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Active Company:</span>
                  <span className="font-bold text-slate-900">{settings.companyCode}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Fiscal Period:</span>
                  <span className="font-mono font-semibold text-slate-800">Open & Active</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Voucher Prefixes:</span>
                  <span className="font-mono font-bold text-emerald-800">PAY, RCP, VCH, CTR</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Last System Audit:</span>
                  <span className="font-mono text-slate-800">{settings.lastAuditDate}</span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Configured By:</span>
                  <span className="font-semibold text-slate-900">{settings.configuredBy}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <Button
                type="button"
                size="sm"
                onClick={handleSaveSettings}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2 shadow-xs cursor-pointer"
              >
                <Save className="h-3.5 w-3.5 mr-1" />
                Apply & Save Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ModulePageShell>
  );
}
