"use client";

import React, { useState } from "react";
import {
  Settings,
  Save,
  RotateCcw,
  Printer,
  Download,
  Building2,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  FileText,
  Info,
  Calendar,
  Coins,
  AlertTriangle,
  X,
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
  initialCompanySettings,
  CompanySettingsModel,
  standardGLAccountOptions,
} from "@/app/data/accounts/companySettingsData";
import { cn } from "@/lib/utils";

export function CompanySettingsView() {
  // Master Settings State
  const [settings, setSettings] = useState<CompanySettingsModel>(initialCompanySettings);

  // Tab State (4 Dedicated Behavior Tabs)
  const [activeTab, setActiveTab] = useState<"general" | "vouchers" | "gl" | "tax">("general");

  // Confirmation Modal State for Reset Defaults
  const [showResetModal, setShowResetModal] = useState(false);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form Field Change Handler
  const handleChange = (field: keyof CompanySettingsModel, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  // Handlers for Save & Reset
  const handleSaveSettings = () => {
    const now = new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    setSettings((prev) => ({
      ...prev,
      lastAuditDate: now,
    }));
    setToastMessage("Company accounting settings updated and saved successfully.");
  };

  const handleConfirmReset = () => {
    setSettings(initialCompanySettings);
    setShowResetModal(false);
    setToastMessage("Reset company accounting settings to default parameters.");
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
      description="Configure enterprise accounting rules, general ledger parameters, voucher controls, and statutory preferences."
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
            onClick={() => setShowResetModal(true)}
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
            onClick={handleExportConfig}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export Config
          </Button>
        </div>
      }
    >
      {/* Top Company Selector Bar & Reference Indicators */}
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
                <option value="HOTEL & RESORTS PRIVATE LIMITED">
                  HOTEL & RESORTS PRIVATE LIMITED (CMP-001)
                </option>
                <option value="CATERING & BANQUETS LLP">
                  CATERING & BANQUETS LLP (CMP-002)
                </option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            {/* Base Currency Reference Badge */}
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1 text-amber-900 border border-amber-200 text-[11px] font-bold">
              <Coins className="h-3.5 w-3.5 text-amber-700" />
              Currency: {settings.baseCurrencyId}
            </span>

            {/* Fiscal Year Reference Badge */}
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-slate-700 border border-slate-200 font-mono text-[11px]">
              <Calendar className="h-3.5 w-3.5 text-slate-600" />
              FY: {settings.currentFiscalYearId}
            </span>

            {/* Accounting Method Badge */}
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1 text-emerald-800 font-bold border border-emerald-200 text-[11px]">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
              Method: {settings.accountingMethod}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Layout: 8 Cols Form / 4 Cols Audit Summary */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
        {/* Left Column: Tab Controls & Form Sections (8 Cols) */}
        <div className="md:col-span-8 space-y-4">
          {/* Section Navigation Tabs (4 Core Behavior Tabs) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xs flex border-b border-slate-200 overflow-x-auto gap-1">
            {[
              { id: "general", label: "1. General & Accounting", icon: Settings },
              { id: "vouchers", label: "2. Voucher Controls", icon: FileText },
              { id: "gl", label: "3. GL & Credit Policy", icon: CreditCard },
              { id: "tax", label: "4. Tax & Statutory", icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer",
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
            {/* ⚙️ TAB 1: General & Accounting Preferences */}
            {activeTab === "general" && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <Settings className="h-4 w-4 text-emerald-600" />
                  General & Accounting Preferences
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField label="Accounting Method" required>
                    <SelectInput
                      value={settings.accountingMethod}
                      onChange={(e) => handleChange("accountingMethod", e.target.value)}
                      className="bg-white font-semibold"
                    >
                      <option value="Accrual">Accrual Basis Accounting</option>
                      <option value="Cash">Cash Basis Accounting</option>
                    </SelectInput>
                  </FormField>

                  <FormField label="Decimal Precision" required>
                    <SelectInput
                      value={settings.decimalPlaces}
                      onChange={(e) => handleChange("decimalPlaces", parseInt(e.target.value) || 2)}
                      className="bg-white font-semibold"
                    >
                      <option value={2}>2 Decimals (0.00)</option>
                      <option value={0}>0 Decimals (Round INR)</option>
                      <option value={3}>3 Decimals (0.000)</option>
                      <option value={4}>4 Decimals (0.0000)</option>
                    </SelectInput>
                  </FormField>

                  <FormField label="Lock Financial Period Prior To Date">
                    <FODatePicker
                      value={settings.lockDateBefore}
                      onChange={(val) => handleChange("lockDateBefore", val)}
                    />
                  </FormField>
                </div>

                <div className="space-y-2.5 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.allowFutureTransactions)}
                      onChange={(e) => handleChange("allowFutureTransactions", e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 h-4 w-4 focus:ring-emerald-500"
                    />
                    <span>Allow Future-Dated Transaction Postings</span>
                  </label>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                    <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-slate-800">
                      <input
                        type="checkbox"
                        checked={Boolean(settings.allowBackDatedPosting)}
                        onChange={(e) => handleChange("allowBackDatedPosting", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4 focus:ring-emerald-500"
                      />
                      <span>Allow Back-Dated Voucher Postings</span>
                    </label>

                    {settings.allowBackDatedPosting && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 font-medium">Limit:</span>
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={settings.backDatedLimitDays}
                          onChange={(e) => handleChange("backDatedLimitDays", parseInt(e.target.value) || 30)}
                          className="w-16 h-7 rounded-lg border border-slate-300 bg-white px-2 text-center text-xs font-mono font-bold"
                        />
                        <span className="text-[11px] text-slate-500 font-medium">days</span>
                      </div>
                    )}
                  </div>

                  <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-slate-800 pt-1 border-t border-slate-200/60">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.requireVoucherApproval)}
                      onChange={(e) => handleChange("requireVoucherApproval", e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 h-4 w-4 focus:ring-emerald-500"
                    />
                    <span>Require Senior Accountant Approval for Journal Vouchers</span>
                  </label>
                </div>
              </div>
            )}

            {/* 📝 TAB 2: Voucher Controls */}
            {activeTab === "vouchers" && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  Voucher Controls & Numbering Sequences
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-slate-800">
                      <input
                        type="checkbox"
                        checked={Boolean(settings.autoVoucherNumbering)}
                        onChange={(e) => handleChange("autoVoucherNumbering", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4 focus:ring-emerald-500"
                      />
                      <span>Automatic System Voucher Numbering</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-slate-800">
                      <input
                        type="checkbox"
                        checked={Boolean(settings.allowManualVoucherNo)}
                        onChange={(e) => handleChange("allowManualVoucherNo", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4 focus:ring-emerald-500"
                      />
                      <span>Allow Manual Voucher Number Override</span>
                    </label>
                  </div>

                  <div className="space-y-2">
                    <FormField label="Voucher Reset Frequency">
                      <SelectInput
                        value={settings.voucherResetFrequency}
                        onChange={(e) => handleChange("voucherResetFrequency", e.target.value)}
                        className="bg-white"
                      >
                        <option value="Annually">Annually at Fiscal Year Start</option>
                        <option value="Monthly">Monthly Reset</option>
                        <option value="Never">Continuous Ongoing Sequence</option>
                      </SelectInput>
                    </FormField>

                    <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-slate-800 pt-1">
                      <input
                        type="checkbox"
                        checked={Boolean(settings.preventDuplicateVouchers)}
                        onChange={(e) => handleChange("preventDuplicateVouchers", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4 focus:ring-emerald-500"
                      />
                      <span>Enforce Strict Duplicate Number Protection</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Payment Voucher Series */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <h4 className="font-bold text-slate-800 uppercase text-[11px]">Payment Series</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <FormField label="Prefix">
                        <TextInput
                          value={settings.paymentPrefix}
                          onChange={(e) => handleChange("paymentPrefix", e.target.value)}
                          className="font-mono bg-white h-8 text-xs font-bold"
                        />
                      </FormField>
                      <FormField label="Start Number">
                        <TextInput
                          value={settings.paymentStartNo}
                          onChange={(e) => handleChange("paymentStartNo", e.target.value)}
                          className="font-mono bg-white h-8 text-xs font-bold"
                        />
                      </FormField>
                    </div>
                  </div>

                  {/* Receipt Voucher Series */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <h4 className="font-bold text-slate-800 uppercase text-[11px]">Receipt Series</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <FormField label="Prefix">
                        <TextInput
                          value={settings.receiptPrefix}
                          onChange={(e) => handleChange("receiptPrefix", e.target.value)}
                          className="font-mono bg-white h-8 text-xs font-bold"
                        />
                      </FormField>
                      <FormField label="Start Number">
                        <TextInput
                          value={settings.receiptStartNo}
                          onChange={(e) => handleChange("receiptStartNo", e.target.value)}
                          className="font-mono bg-white h-8 text-xs font-bold"
                        />
                      </FormField>
                    </div>
                  </div>

                  {/* Journal Voucher Series */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <h4 className="font-bold text-slate-800 uppercase text-[11px]">Journal Series</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <FormField label="Prefix">
                        <TextInput
                          value={settings.journalPrefix}
                          onChange={(e) => handleChange("journalPrefix", e.target.value)}
                          className="font-mono bg-white h-8 text-xs font-bold"
                        />
                      </FormField>
                      <FormField label="Start Number">
                        <TextInput
                          value={settings.journalStartNo}
                          onChange={(e) => handleChange("journalStartNo", e.target.value)}
                          className="font-mono bg-white h-8 text-xs font-bold"
                        />
                      </FormField>
                    </div>
                  </div>

                  {/* Contra Voucher Series */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <h4 className="font-bold text-slate-800 uppercase text-[11px]">Contra Series</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <FormField label="Prefix">
                        <TextInput
                          value={settings.contraPrefix}
                          onChange={(e) => handleChange("contraPrefix", e.target.value)}
                          className="font-mono bg-white h-8 text-xs font-bold"
                        />
                      </FormField>
                      <FormField label="Start Number">
                        <TextInput
                          value={settings.contraStartNo}
                          onChange={(e) => handleChange("contraStartNo", e.target.value)}
                          className="font-mono bg-white h-8 text-xs font-bold"
                        />
                      </FormField>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-100/80 border border-slate-200 text-slate-600 text-[11px] flex items-start gap-2">
                  <Info className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    Individual voucher types, custom document templates, and user authorization levels are configured under <strong>Accounts → Masters → Voucher Type</strong>.
                  </span>
                </div>
              </div>
            )}

            {/* 💳 TAB 3: General Ledger & Credit Policy */}
            {activeTab === "gl" && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                  GL Posting Controls & Default Ledger Accounts
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Negative Cash Handling" required>
                    <SelectInput
                      value={settings.allowNegativeCash}
                      onChange={(e) => handleChange("allowNegativeCash", e.target.value)}
                      className="bg-white font-semibold"
                    >
                      <option value="Warn">Warn User (Allow Posting)</option>
                      <option value="Block">Block Voucher Entry</option>
                      <option value="Allow">Allow Without Warning</option>
                    </SelectInput>
                  </FormField>

                  <FormField label="Customer Credit Limit Policy" required>
                    <SelectInput
                      value={settings.enforceCreditLimit}
                      onChange={(e) => handleChange("enforceCreditLimit", e.target.value)}
                      className="bg-white font-semibold"
                    >
                      <option value="Block Transaction">Block Posting on Limit Exceeded</option>
                      <option value="Warn Only">Warn User Only</option>
                      <option value="Ignore">Do Not Enforce</option>
                    </SelectInput>
                  </FormField>
                </div>

                {/* Structured GL Account Selectors (No free-text input) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <FormField label="Default Receivable Account (AR)" required>
                    <SelectInput
                      value={settings.defaultReceivableAcc}
                      onChange={(e) => handleChange("defaultReceivableAcc", e.target.value)}
                      className="bg-white font-mono font-semibold"
                    >
                      {standardGLAccountOptions.receivables.map((acc) => (
                        <option key={acc.id} value={acc.name}>
                          {acc.name}
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>

                  <FormField label="Default Payable Account (AP)" required>
                    <SelectInput
                      value={settings.defaultPayableAcc}
                      onChange={(e) => handleChange("defaultPayableAcc", e.target.value)}
                      className="bg-white font-mono font-semibold"
                    >
                      {standardGLAccountOptions.payables.map((acc) => (
                        <option key={acc.id} value={acc.name}>
                          {acc.name}
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>

                  <FormField label="Default Round Off Account" required>
                    <SelectInput
                      value={settings.defaultRoundOffAcc}
                      onChange={(e) => handleChange("defaultRoundOffAcc", e.target.value)}
                      className="bg-white font-mono font-semibold"
                    >
                      {standardGLAccountOptions.roundOff.map((acc) => (
                        <option key={acc.id} value={acc.name}>
                          {acc.name}
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>

                  <FormField label="Default Guest Security Deposit Ledger" required>
                    <SelectInput
                      value={settings.defaultGuestDepositAcc}
                      onChange={(e) => handleChange("defaultGuestDepositAcc", e.target.value)}
                      className="bg-white font-mono font-semibold"
                    >
                      {standardGLAccountOptions.guestDeposit.map((acc) => (
                        <option key={acc.id} value={acc.name}>
                          {acc.name}
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>
                </div>
              </div>
            )}

            {/* 🛡️ TAB 4: Statutory & Tax Configurations */}
            {activeTab === "tax" && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Statutory, GST & Tax Posting Configurations
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Default Tax Jurisdiction / State Region">
                    <TextInput
                      value={settings.defaultTaxRegion}
                      onChange={(e) => handleChange("defaultTaxRegion", e.target.value)}
                      placeholder="e.g. Gujarat (24)"
                      className="bg-white font-semibold"
                    />
                  </FormField>
                </div>

                <div className="space-y-2.5 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.enableGst)}
                      onChange={(e) => handleChange("enableGst", e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 h-4 w-4 focus:ring-emerald-500"
                    />
                    <span>Enable GST Invoicing & Input Tax Credit (ITC) Auto-Computation</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-slate-800 pt-1 border-t border-slate-200/60">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.enableEInvoicing)}
                      onChange={(e) => handleChange("enableEInvoicing", e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 h-4 w-4 focus:ring-emerald-500"
                    />
                    <span>Enable E-Invoicing (IRN & QR Code Generation on B2B / Tax Invoices)</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-slate-800 pt-1 border-t border-slate-200/60">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.enableTdsDeductions)}
                      onChange={(e) => handleChange("enableTdsDeductions", e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 h-4 w-4 focus:ring-emerald-500"
                    />
                    <span>Enable TDS Deduction on Applicable Vendor Disbursements</span>
                  </label>
                </div>

                <div className="p-3 rounded-xl bg-slate-100/80 border border-slate-200 text-slate-600 text-[11px] flex items-start gap-2">
                  <Info className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    Actual GST rate slabs (5%, 12%, 18%, 28%), room tariff thresholds, and service tax rules are configured under <strong>Accounts → Masters → Tax / GST Master</strong>.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: System Audit Summary (4 Cols) */}
        <div className="md:col-span-4 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-4 font-sans text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
              <span>System Audit Summary</span>
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </h3>

            <div className="space-y-3">
              <div className="space-y-2 border border-slate-100 bg-slate-50/60 rounded-xl p-3 text-[11px] text-slate-700">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Active Company:</span>
                  <span className="font-bold text-slate-900">{settings.companyCode}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Current FY Reference:</span>
                  <span className="font-mono font-semibold text-slate-800">{settings.currentFiscalYearId}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Base Currency:</span>
                  <span className="font-bold text-slate-800">{settings.baseCurrencyId}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Accounting Method:</span>
                  <span className="font-bold text-emerald-800">{settings.accountingMethod} Basis</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Last Updated:</span>
                  <span className="font-mono text-slate-800">{settings.lastAuditDate}</span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Updated By:</span>
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

      {/* Confirmation Modal for Reset Defaults */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <span>Confirm Reset Defaults</span>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-slate-600">
              Are you sure you want to reset company accounting settings to default parameters? This will only reset accounting control parameters and will not affect Company Identity, Fiscal Year, Currency, or Chart of Accounts.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowResetModal(false)}
                className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmReset}
                className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
              >
                Reset to Defaults
              </Button>
            </div>
          </div>
        </div>
      )}
    </ModulePageShell>
  );
}
