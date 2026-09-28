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
  Loader2,
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
  accCompanySettingsService,
  accVoucherTypeService,
  type CompanySettings,
} from "@/services/accounts";
import { cn } from "@/lib/utils";
import { accErrorMessage, invalidateAccLookups, useAccLookups, useAccQuery } from "./accountsApi";

type SettingsTab = "general" | "vouchers" | "gl" | "tax";

const EDITABLE_FIELDS = [
  "currentFiscalYearId", "accountingMethod", "decimalPlaces", "allowFutureTransactions", "allowBackDatedPosting",
  "backDatedLimitDays", "lockDateBefore", "requireVoucherApproval", "autoVoucherNumbering", "voucherResetFrequency",
  "allowManualVoucherNo", "preventDuplicateVouchers", "requirePostingApproval", "allowNegativeCash",
  "enforceCreditLimit", "defaultReceivableAccountId", "defaultPayableAccountId", "defaultRoundOffAccountId",
  "defaultGuestDepositAccountId", "enableGst", "enableEinvoice", "defaultTaxRegion", "enableTdsDeductions",
] as const satisfies readonly (keyof CompanySettings)[];

/** Database defaults for accounting control parameters (identity, FY, GL defaults and tax region are kept). */
const CONTROL_DEFAULTS: Partial<CompanySettings> = {
  accountingMethod: "Accrual",
  decimalPlaces: 2,
  allowFutureTransactions: false,
  allowBackDatedPosting: true,
  backDatedLimitDays: 30,
  lockDateBefore: null,
  requireVoucherApproval: false,
  autoVoucherNumbering: true,
  voucherResetFrequency: "Yearly",
  allowManualVoucherNo: false,
  preventDuplicateVouchers: true,
  requirePostingApproval: false,
  allowNegativeCash: false,
  enforceCreditLimit: true,
  enableGst: true,
  enableEinvoice: false,
  enableTdsDeductions: false,
};

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function CompanySettingsView() {
  const { lookups } = useAccLookups();
  const [companyId, setCompanyId] = useState<string>("");

  // Master Settings State
  const {
    data: loadedSettings,
    loading,
    error,
    reload,
  } = useAccQuery(() => accCompanySettingsService.get(companyId || undefined), [companyId]);
  const {
    data: voucherTypes,
    loading: voucherTypesLoading,
    error: voucherTypesError,
    reload: reloadVoucherTypes,
  } = useAccQuery(() => accVoucherTypeService.list(), []);
  const [draft, setDraft] = useState<CompanySettings | null>(null);
  const [saving, setSaving] = useState(false);
  const settings: CompanySettings | null = draft ?? loadedSettings;

  const companies = lookups?.companies ?? [];
  const ledgers = lookups?.ledgers ?? [];
  const baseCurrency = lookups?.currencies.find((c) => c.isBaseCurrency);
  const fiscalYears = lookups?.fiscalYears ?? [];
  const currentFy = fiscalYears.find((fy) => fy.id === settings?.currentFiscalYearId);
  const selectableFiscalYears = fiscalYears.filter(
    (fy) => fy.status === "Open" || fy.id === settings?.currentFiscalYearId
  );

  // Tab State (4 Dedicated Behavior Tabs)
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  // Confirmation Modal State for Reset Defaults
  const [showResetModal, setShowResetModal] = useState(false);

  // Toast Notification State
  const [toastMessage, setToastMessageRaw] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");
  const setToastMessage = (msg: string | null, variant: "success" | "error" = "success") => {
    setToastVariant(variant);
    setToastMessageRaw(msg);
  };

  // Form Field Change Handler
  const handleChange = <K extends keyof CompanySettings>(field: K, value: CompanySettings[K]) => {
    setDraft((prev) => {
      const base = prev ?? loadedSettings;
      return base ? { ...base, [field]: value } : prev;
    });
  };

  const handleCompanyChange = (id: string) => {
    setDraft(null);
    setCompanyId(id);
  };

  const persist = async (body: Partial<CompanySettings>, successMessage: string) => {
    if (!settings) return;
    setSaving(true);
    try {
      await accCompanySettingsService.update(settings.id, body);
      invalidateAccLookups();
      setDraft(null);
      await reload();
      setToastMessage(successMessage);
    } catch (e) {
      setToastMessage(accErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  // Handlers for Save & Reset
  const handleSaveSettings = () => {
    if (!settings) return;
    const body: Partial<CompanySettings> = {};
    for (const f of EDITABLE_FIELDS) {
      (body as Record<string, unknown>)[f] = settings[f];
    }
    void persist(body, "Company accounting settings updated and saved successfully.");
  };

  const handleConfirmReset = () => {
    setShowResetModal(false);
    void persist(CONTROL_DEFAULTS, "Reset company accounting settings to default parameters.");
  };

  const handleExportConfig = () => {
    if (!settings) return;
    const jsonStr = JSON.stringify(settings, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Company_Settings_${settings.companyCode || "company"}_${Date.now()}.json`;
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
      toastVariant={toastVariant}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleSaveSettings}
            disabled={!settings || saving || loading}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
            Save Settings
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!settings || saving}
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
            disabled={!settings}
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
                value={settings?.companyId ?? companyId}
                onChange={(e) => handleCompanyChange(e.target.value)}
                disabled={companies.length === 0}
                className="h-8 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
              >
                {companies.length === 0 && (
                  <option value="">{settings ? `${settings.companyName} (${settings.companyCode})` : "No companies"}</option>
                )}
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.legalName || c.tradeName} ({c.companyCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            {/* Base Currency Reference Badge */}
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1 text-amber-900 border border-amber-200 text-[11px] font-bold">
              <Coins className="h-3.5 w-3.5 text-amber-700" />
              Currency: {baseCurrency?.code ?? "—"}
            </span>

            {/* Fiscal Year Reference Badge */}
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-slate-700 border border-slate-200 font-mono text-[11px]">
              <Calendar className="h-3.5 w-3.5 text-slate-600" />
              FY: {currentFy?.fiscalYearName ?? "Not set"}
            </span>

            {/* Accounting Method Badge */}
            {settings && (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1 text-emerald-800 font-bold border border-emerald-200 text-[11px]">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                Method: {settings.accountingMethod}
              </span>
            )}
          </div>
        </div>
      </div>

      {!settings ? (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-xs text-center text-xs">
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
              Loading company settings…
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-1.5 font-bold text-rose-700">
                <AlertTriangle className="h-4 w-4" />
                Could not load company settings
              </div>
              <p className="text-slate-600">{error ?? "No settings found."}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void reload()}
                className="h-8 text-xs font-semibold bg-white"
              >
                Retry
              </Button>
            </div>
          )}
        </div>
      ) : (
      <>

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
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
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
                      onChange={(e) => handleChange("accountingMethod", e.target.value as CompanySettings["accountingMethod"])}
                      className="bg-white font-semibold"
                    >
                      <option value="Accrual">Accrual Basis Accounting</option>
                      <option value="Cash">Cash Basis Accounting</option>
                    </SelectInput>
                  </FormField>

                  <FormField label="Decimal Precision" required>
                    <SelectInput
                      value={settings.decimalPlaces}
                      onChange={(e) => handleChange("decimalPlaces", parseInt(e.target.value, 10))}
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
                      value={settings.lockDateBefore ? settings.lockDateBefore.slice(0, 10) : ""}
                      onChange={(val) => handleChange("lockDateBefore", val || null)}
                    />
                    {settings.lockDateBefore && (
                      <button
                        type="button"
                        onClick={() => handleChange("lockDateBefore", null)}
                        className="mt-1 text-[11px] font-semibold text-slate-500 hover:text-rose-600"
                      >
                        Clear lock date
                      </button>
                    )}
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField label="Current Fiscal Year">
                    <SelectInput
                      value={settings.currentFiscalYearId ?? ""}
                      onChange={(e) => handleChange("currentFiscalYearId", e.target.value || null)}
                      className="bg-white font-semibold"
                    >
                      <option value="">— Not set —</option>
                      {selectableFiscalYears.map((fy) => (
                        <option key={fy.id} value={fy.id}>
                          {fy.fiscalYearName} ({fy.status})
                        </option>
                      ))}
                    </SelectInput>
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
                          onChange={(e) => handleChange("backDatedLimitDays", Math.max(0, parseInt(e.target.value, 10) || 0))}
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
                        <option value="Yearly">Annually at Fiscal Year Start</option>
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

                {/* Read-only numbering series summary (configured per Voucher Type) */}
                <div className="space-y-2 pt-1">
                  <h4 className="font-bold text-slate-800 uppercase text-[11px]">Voucher Numbering Series (Read Only)</h4>
                  {voucherTypesLoading && !voucherTypes && (
                    <div className="flex items-center gap-2 text-slate-500 py-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                      Loading voucher types…
                    </div>
                  )}
                  {voucherTypesError && !voucherTypes && (
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-800">
                      <span>{voucherTypesError}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void reloadVoucherTypes()}
                        className="h-7 text-xs font-semibold bg-white"
                      >
                        Retry
                      </Button>
                    </div>
                  )}
                  {voucherTypes && voucherTypes.length === 0 && (
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500">
                      No voucher types configured yet.
                    </div>
                  )}
                  {voucherTypes && voucherTypes.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {voucherTypes.map((vt) => (
                        <div key={vt.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-bold text-slate-800 uppercase text-[11px]">
                              {vt.voucherTypeName}
                              <span className="ml-1.5 font-mono text-slate-500">({vt.shortCode})</span>
                            </h4>
                            <span
                              className={cn(
                                "text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase",
                                vt.status === "Active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
                              )}
                            >
                              {vt.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-[11px]">
                            <div>
                              <span className="block text-slate-500">Prefix</span>
                              <span className="font-mono font-bold text-slate-900">{vt.prefixTemplate || "—"}</span>
                            </div>
                            <div>
                              <span className="block text-slate-500">Start No.</span>
                              <span className="font-mono font-bold text-slate-900">{vt.startingNumber}</span>
                            </div>
                            <div>
                              <span className="block text-slate-500">Numbering</span>
                              <span className="font-semibold text-slate-800">{vt.numberingMethod}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                      value={settings.allowNegativeCash ? "Allow" : "Block"}
                      onChange={(e) => handleChange("allowNegativeCash", e.target.value === "Allow")}
                      className="bg-white font-semibold"
                    >
                      <option value="Block">Block Voucher Entry</option>
                      <option value="Allow">Allow Negative Cash Balance</option>
                    </SelectInput>
                  </FormField>

                  <FormField label="Customer Credit Limit Policy" required>
                    <SelectInput
                      value={settings.enforceCreditLimit ? "Enforce" : "Ignore"}
                      onChange={(e) => handleChange("enforceCreditLimit", e.target.value === "Enforce")}
                      className="bg-white font-semibold"
                    >
                      <option value="Enforce">Block Posting on Limit Exceeded</option>
                      <option value="Ignore">Do Not Enforce</option>
                    </SelectInput>
                  </FormField>
                </div>

                {/* Structured GL Account Selectors (No free-text input) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {(
                    [
                      { field: "defaultReceivableAccountId", label: "Default Receivable Account (AR)" },
                      { field: "defaultPayableAccountId", label: "Default Payable Account (AP)" },
                      { field: "defaultRoundOffAccountId", label: "Default Round Off Account" },
                      { field: "defaultGuestDepositAccountId", label: "Default Guest Security Deposit Ledger" },
                    ] as const
                  ).map(({ field, label }) => (
                    <FormField key={field} label={label}>
                      <SelectInput
                        value={settings[field] ?? ""}
                        onChange={(e) => handleChange(field, e.target.value || null)}
                        className="bg-white font-mono font-semibold"
                      >
                        <option value="">— Select ledger —</option>
                        {ledgers.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.code} - {acc.name}
                          </option>
                        ))}
                      </SelectInput>
                    </FormField>
                  ))}
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
                      checked={Boolean(settings.enableEinvoice)}
                      onChange={(e) => handleChange("enableEinvoice", e.target.checked)}
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
                  <span className="font-bold text-slate-900">
                    {settings.companyName} ({settings.companyCode})
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Current FY Reference:</span>
                  <span className="font-mono font-semibold text-slate-800">{currentFy?.fiscalYearName ?? "Not set"}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Base Currency:</span>
                  <span className="font-bold text-slate-800">{baseCurrency ? `${baseCurrency.code} (${baseCurrency.symbol})` : "—"}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Accounting Method:</span>
                  <span className="font-bold text-emerald-800">{settings.accountingMethod} Basis</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Last Updated:</span>
                  <span className="font-mono text-slate-800">{formatTimestamp(settings.lastAuditDate ?? settings.updatedAt)}</span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Updated By:</span>
                  <span className="font-semibold text-slate-900">{settings.configuredBy || "—"}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <Button
                type="button"
                size="sm"
                onClick={handleSaveSettings}
                disabled={saving || loading}
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
      </>
      )}
    </ModulePageShell>
  );
}
