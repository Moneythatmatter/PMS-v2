"use client";

import React, { useState, useMemo } from "react";
import {
  Coins,
  Building2,
  Plus,
  Save,
  RotateCcw,
  Search,
  X,
  Globe,
  Info,
  ChevronRight,
  AlertTriangle,
  Loader2,
  Trash2,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  TextInput,
  SelectInput,
  FODatePicker,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import { accCurrencyService, type Currency } from "@/services/accounts";
import { cn } from "@/lib/utils";
import {
  accErrorMessage,
  formatDate,
  invalidateAccLookups,
  todayIso,
  useAccLookups,
  useAccQuery,
} from "./accountsApi";

type CurrencyForm = Pick<
  Currency,
  | "code"
  | "name"
  | "symbol"
  | "country"
  | "decimalPlaces"
  | "isBaseCurrency"
  | "exchangeRateToBase"
  | "rateSource"
  | "foreignTransactionsAllowed"
  | "status"
> & { rateEffectiveDate: string };

const emptyCreateForm = (): CurrencyForm => ({
  code: "",
  name: "",
  symbol: "",
  country: "",
  decimalPlaces: 2,
  isBaseCurrency: false,
  exchangeRateToBase: 1,
  rateEffectiveDate: todayIso(),
  rateSource: "Manual",
  foreignTransactionsAllowed: true,
  status: "Active",
});

function toCurrencyBody(f: CurrencyForm): Partial<Currency> {
  return {
    code: f.code.trim().toUpperCase(),
    name: f.name.trim(),
    symbol: f.symbol.trim(),
    country: f.country ?? "",
    decimalPlaces: f.decimalPlaces,
    isBaseCurrency: f.isBaseCurrency,
    exchangeRateToBase: f.exchangeRateToBase,
    rateEffectiveDate: f.rateEffectiveDate || null,
    rateSource: f.rateSource,
    foreignTransactionsAllowed: f.foreignTransactionsAllowed,
    status: f.status,
  };
}

export function CurrencyMasterView() {
  // Master Currencies State
  const { data, loading, error, reload } = useAccQuery(() => accCurrencyService.list(), []);
  const currencies = useMemo(() => data ?? [], [data]);
  const { lookups } = useAccLookups();
  const company = lookups?.companies[0];
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Search Query State
  const [searchQuery, setSearchQuery] = useState("");

  // Toast Notification State
  const [toastMessage, setToastMessageRaw] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");
  const setToastMessage = (msg: string | null, variant: "success" | "error" = "success") => {
    setToastVariant(variant);
    setToastMessageRaw(msg);
  };

  // Modal State for New Currency
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Active Selected Currency Record
  const activeCurrency = useMemo(
    () => currencies.find((c) => c.id === selectedCurrencyId) || currencies[0],
    [currencies, selectedCurrencyId]
  );

  // Unsaved edits of the active currency (null = pristine)
  const [draft, setDraft] = useState<(CurrencyForm & { id: string }) | null>(null);
  const formData: (CurrencyForm & { id: string; createdAt?: string; updatedAt?: string }) | null =
    draft && draft.id === activeCurrency?.id
      ? draft
      : activeCurrency
        ? { ...activeCurrency, rateEffectiveDate: activeCurrency.rateEffectiveDate?.slice(0, 10) ?? "" }
        : null;

  // Create Currency Form State
  const [createForm, setCreateForm] = useState<CurrencyForm>(emptyCreateForm);

  // Base Currency of the company
  const baseCurrency = useMemo(() => currencies.find((c) => c.isBaseCurrency), [currencies]);
  const baseCode = baseCurrency?.code ?? "base";

  // Filtered Currencies
  const filteredCurrencies = useMemo(() => {
    return currencies.filter((c) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          c.code.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          (c.country || "").toLowerCase().includes(q) ||
          c.status.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [currencies, searchQuery]);

  // Handle Edit Form Field Change
  const handleFormChange = <K extends keyof CurrencyForm>(field: K, value: CurrencyForm[K]) => {
    if (!formData) return;
    setDraft({ ...formData, [field]: value });
  };

  const handleSelectCurrency = (id: string) => {
    setSelectedCurrencyId(id);
    setDraft(null);
  };

  const runAction = async (action: () => Promise<unknown>, successMessage: string) => {
    setSaving(true);
    try {
      await action();
      invalidateAccLookups();
      await reload();
      setToastMessage(successMessage);
      return true;
    } catch (e) {
      setToastMessage(accErrorMessage(e), "error");
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Save Active Currency Edits
  const handleSaveCurrency = async () => {
    if (!formData) return;
    if (!/^[A-Z]{3}$/.test(formData.code.trim().toUpperCase())) {
      setToastMessage("Currency Code must be a valid 3-letter ISO code (e.g. USD, EUR, CAD).", "error");
      return;
    }
    if (!formData.name?.trim()) {
      setToastMessage("Please enter a valid currency name.", "error");
      return;
    }
    if (!formData.symbol?.trim()) {
      setToastMessage("Please enter a currency symbol.", "error");
      return;
    }

    const ok = await runAction(
      () => accCurrencyService.update(formData.id, toCurrencyBody(formData)),
      `Saved currency configuration for ${formData.code} (${formData.name}).`
    );
    if (ok) setDraft(null);
  };

  // Toggle Active / Inactive Status
  const handleToggleStatus = async (currencyId: string) => {
    const target = currencies.find((c) => c.id === currencyId);
    if (!target) return;

    if (target.isBaseCurrency) {
      setToastMessage("Cannot deactivate the company's Base Reporting Currency.", "error");
      return;
    }

    const nextStatus: Currency["status"] = target.status === "Active" ? "Inactive" : "Active";
    const ok = await runAction(
      () => accCurrencyService.update(currencyId, { status: nextStatus }),
      nextStatus === "Inactive"
        ? `Deactivated ${target.code}. It will no longer appear in new transactions.`
        : `Activated ${target.code} for transactions.`
    );
    if (ok) setDraft((prev) => (prev && prev.id === currencyId ? { ...prev, status: nextStatus } : prev));
  };

  const handleSetBase = async () => {
    if (!formData || formData.isBaseCurrency) return;
    if (
      !window.confirm(
        `Make ${formData.code} the base reporting currency? ${baseCurrency ? `${baseCurrency.code} will become a foreign currency.` : ""}`
      )
    )
      return;
    const ok = await runAction(
      () => accCurrencyService.update(formData.id, { isBaseCurrency: true }),
      `${formData.code} is now the base reporting currency.`
    );
    if (ok) setDraft(null);
  };

  const handleDeleteCurrency = async () => {
    if (!formData) return;
    if (!window.confirm(`Delete currency ${formData.code} (${formData.name})? This cannot be undone.`)) return;
    const ok = await runAction(
      () => accCurrencyService.remove(formData.id),
      `Deleted currency ${formData.code}.`
    );
    if (ok) {
      setDraft(null);
      setSelectedCurrencyId(null);
    }
  };

  // Handle Create New Currency
  const handleCreateCurrency = async () => {
    const normalizedCode = createForm.code.trim().toUpperCase();

    // Validate 3-letter code
    if (!/^[A-Z]{3}$/.test(normalizedCode)) {
      setToastMessage("Currency Code must be a valid 3-letter ISO code (e.g. USD, EUR, CAD).", "error");
      return;
    }

    if (!createForm.name?.trim()) {
      setToastMessage("Please enter the full Currency Name.", "error");
      return;
    }

    if (!createForm.symbol?.trim()) {
      setToastMessage("Please enter the Currency Symbol.", "error");
      return;
    }

    // Check duplicate
    const exists = currencies.some((c) => c.code.toUpperCase() === normalizedCode);
    if (exists) {
      setToastMessage(`Currency ${normalizedCode} already exists in the system.`, "error");
      return;
    }

    setSaving(true);
    try {
      const created = await accCurrencyService.create(toCurrencyBody({ ...createForm, isBaseCurrency: false }));
      invalidateAccLookups();
      await reload();
      setSelectedCurrencyId(created.id);
      setDraft(null);
      setShowCreateModal(false);
      setCreateForm(emptyCreateForm());
      setToastMessage(`Created supported foreign currency ${created.code} (${created.name}).`);
    } catch (e) {
      setToastMessage(accErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModulePageShell
      eyebrow="Accounts & Masters"
      title="Currency Master"
      description="Configure supported foreign currencies, company base reporting currency, manual exchange rates, and transaction permissions."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Masters", href: "/accounts/masters" },
        { label: "Currency" },
      ]}
      toast={toastMessage}
      toastVariant={toastVariant}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            disabled={saving}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Currency
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleSaveCurrency()}
            disabled={!formData || saving}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-800 cursor-pointer"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin text-emerald-700" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1 text-emerald-700" />
            )}
            Save Currency
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={() => {
              setDraft(null);
              void reload();
              setToastMessage("Reset unsaved edits and reloaded currencies.");
            }}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Reset
          </Button>
        </div>
      }
    >
      {/* Top Company Context Header & Base Currency Indicator */}
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <Building2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <span className="text-[11px] font-bold text-slate-500 block uppercase">Target Company Entity:</span>
              <span className="font-bold text-xs text-slate-900">
                {company ? `${company.legalName || company.tradeName} (${company.companyCode})` : "—"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Base Currency Reference Badge */}
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-1.5 text-amber-900 border border-amber-200 font-bold">
              <Coins className="h-4 w-4 text-amber-700" />
              <span>Base Reporting Currency:</span>
              <span className="font-mono bg-amber-700 text-white px-2 py-0.5 rounded-md text-[11px]">
                {baseCurrency ? `${baseCurrency.code} (${baseCurrency.symbol})` : "Not set"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: 5 Cols List / 7 Cols Selected Details */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
        {/* LEFT COLUMN: Supported Currencies List (5 Cols) */}
        <div className="md:col-span-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col min-h-[580px]">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Coins className="h-4.5 w-4.5 text-emerald-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Supported Currencies
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {currencies.length} Currencies
            </span>
          </div>

          {/* Search Box */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search currencies..."
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

          {/* Currencies Cards List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 max-h-[480px]">
            {loading && !data && (
              <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                Loading currencies…
              </div>
            )}

            {error && !data && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 space-y-2">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Could not load currencies
                </div>
                <p>{error}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void reload()}
                  className="h-7 text-xs font-semibold bg-white"
                >
                  Retry
                </Button>
              </div>
            )}

            {filteredCurrencies.map((c) => {
              const isSelected = c.id === activeCurrency?.id;
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectCurrency(c.id)}
                  className={cn(
                    "p-3 rounded-xl border transition-all cursor-pointer select-none space-y-2",
                    isSelected
                      ? "border-emerald-600 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-600/30"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 bg-white"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {c.code}
                        </span>

                        <span className="text-xs font-bold text-slate-600">
                          ({c.symbol})
                        </span>

                        {/* Base vs Foreign Badge */}
                        {c.isBaseCurrency ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            BASE
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            FOREIGN
                          </span>
                        )}

                        {/* Status Badge */}
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                            c.status === "Active"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-600"
                          )}
                        >
                          {c.status}
                        </span>
                      </div>

                      <h4 className="text-xs font-semibold text-slate-700 line-clamp-1">
                        {c.name}
                      </h4>

                      <p className="text-[11px] text-slate-500 font-medium">
                        {c.country || "International"}
                      </p>
                    </div>

                    <ChevronRight
                      className={cn(
                        "h-4 w-4 shrink-0 transition-transform mt-1",
                        isSelected ? "text-emerald-700 translate-x-0.5" : "text-slate-400"
                      )}
                    />
                  </div>

                  {/* Exchange Rate Summary Bar */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium text-[10px]">
                      Rate as of {formatDate(c.rateEffectiveDate)}
                    </span>

                    <span className="font-bold text-slate-800">
                      {c.isBaseCurrency ? (
                        <span className="text-emerald-800">1.00 (Base Unit)</span>
                      ) : (
                        <span>
                          1 {c.code} = {baseCurrency?.symbol ?? ""}
                          {Number(c.exchangeRateToBase).toFixed(4)}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}

            {data && filteredCurrencies.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">
                {currencies.length === 0
                  ? "No currencies configured yet. Use Add Currency to create one."
                  : "No currencies match your search query."}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Selected Currency Configuration (7 Cols) */}
        {!formData ? (
          <div className="md:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-center text-xs text-slate-400">
            {loading ? "Loading…" : "Select or add a currency to view its configuration."}
          </div>
        ) : (
        <div className="md:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 font-mono">
                  {formData.code} - {formData.name}
                </h3>
                {formData.isBaseCurrency && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    Company Base Currency
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Symbol: <strong className="font-bold text-slate-800">{formData.symbol}</strong>
                {formData.updatedAt && (
                  <span>
                    {" "}• Last updated: <strong className="text-slate-700">{formatDate(formData.updatedAt)}</strong>
                  </span>
                )}
              </p>
            </div>

            {/* Status / Base / Delete Actions */}
            {!formData.isBaseCurrency && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={saving || formData.status !== "Active"}
                  onClick={() => void handleSetBase()}
                  className="rounded-xl text-xs font-bold border cursor-pointer bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                >
                  <Star className="h-3.5 w-3.5 mr-1 text-amber-600" />
                  Set as Base
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={saving}
                  onClick={() => void handleToggleStatus(formData.id)}
                  className={cn(
                    "rounded-xl text-xs font-bold border cursor-pointer",
                    formData.status === "Active"
                      ? "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                      : "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                  )}
                >
                  {formData.status === "Active" ? "Deactivate Currency" : "Activate Currency"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={saving}
                  onClick={() => void handleDeleteCurrency()}
                  className="rounded-xl text-xs font-bold border cursor-pointer bg-white text-rose-700 border-rose-200 hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1 text-rose-600" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          {/* Form Content */}
          <div className="text-xs space-y-4 pt-1">
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                <Globe className="h-4 w-4 text-emerald-600" />
                Currency Identity & Display Particulars
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label="Currency Code (ISO 4217)" required>
                  <TextInput
                    value={formData.code || ""}
                    onChange={(e) => handleFormChange("code", e.target.value.toUpperCase())}
                    disabled={formData.isBaseCurrency}
                    maxLength={3}
                    placeholder="e.g. USD"
                    className={cn(
                      "font-mono font-bold uppercase h-9",
                      formData.isBaseCurrency ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-white text-slate-900"
                    )}
                  />
                </FormField>

                <FormField label="Currency Full Name" required>
                  <TextInput
                    value={formData.name || ""}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    placeholder="e.g. United States Dollar"
                    className="bg-white font-semibold text-slate-900 h-9"
                  />
                </FormField>

                <FormField label="Currency Symbol" required>
                  <TextInput
                    value={formData.symbol || ""}
                    onChange={(e) => handleFormChange("symbol", e.target.value)}
                    placeholder="e.g. $"
                    className="bg-white font-bold text-slate-900 h-9"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label="Country / Region">
                  <TextInput
                    value={formData.country || ""}
                    onChange={(e) => handleFormChange("country", e.target.value)}
                    placeholder="e.g. United States"
                    className="bg-white h-9"
                  />
                </FormField>

                <FormField label="Decimal Precision" required>
                  <SelectInput
                    value={formData.decimalPlaces}
                    onChange={(e) => handleFormChange("decimalPlaces", parseInt(e.target.value, 10))}
                    className="bg-white font-semibold h-9"
                  >
                    <option value={2}>2 Decimals (0.00)</option>
                    <option value={0}>0 Decimals (No cents)</option>
                    <option value={3}>3 Decimals (0.000)</option>
                    <option value={4}>4 Decimals (0.0000)</option>
                  </SelectInput>
                </FormField>

                <FormField label="System Status" required>
                  <SelectInput
                    value={formData.status}
                    onChange={(e) => handleFormChange("status", e.target.value as Currency["status"])}
                    disabled={formData.isBaseCurrency}
                    className={cn(
                      "font-bold h-9",
                      formData.isBaseCurrency ? "bg-slate-100 cursor-not-allowed" : "bg-white"
                    )}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </SelectInput>
                </FormField>
              </div>
            </div>

            {/* Exchange Rate Section */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                <Coins className="h-4 w-4 text-emerald-600" />
                Exchange Rate & Transaction Settings
              </h4>

              {formData.isBaseCurrency ? (
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900 text-xs">
                  <Info className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Company Base Reporting Currency:</span>
                    <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                      {formData.code} is the official base currency for the company. All General Ledger reporting, Trial Balances, and statutory financial statements are calculated in {formData.code}. Exchange rate is permanently fixed at 1.00.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label={`Exchange Rate (1 ${formData.code} in ${baseCode})`} required>
                      <TextInput
                        type="number"
                        step="0.0001"
                        min={0}
                        value={formData.exchangeRateToBase}
                        onChange={(e) =>
                          handleFormChange("exchangeRateToBase", parseFloat(e.target.value) || 0)
                        }
                        className="bg-white font-mono font-bold text-slate-900 h-9"
                      />
                    </FormField>

                    <FormField label="Rate Effective Date">
                      <FODatePicker
                        value={formData.rateEffectiveDate || ""}
                        onChange={(val) => handleFormChange("rateEffectiveDate", val)}
                      />
                    </FormField>

                    <FormField label="Rate Source">
                      <SelectInput
                        value={formData.rateSource}
                        onChange={(e) => handleFormChange("rateSource", e.target.value)}
                        className="bg-white font-medium h-9"
                      >
                        <option value="Manual">Manual Entry</option>
                        <option value="Reference Rate">Reference Rate (Central Bank)</option>
                      </SelectInput>
                    </FormField>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-slate-800 text-xs">
                      <input
                        type="checkbox"
                        checked={Boolean(formData.foreignTransactionsAllowed)}
                        onChange={(e) => handleFormChange("foreignTransactionsAllowed", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4 focus:ring-emerald-500"
                      />
                      <span>Allow Foreign Currency Transactions in Guest Folios & Invoices</span>
                    </label>
                    <span className="text-[11px] text-slate-500 block ml-6.5 mt-0.5">
                      When enabled, front desk and POS operators can select {formData.code} as payment / folio denomination.
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void handleSaveCurrency()}
                  disabled={saving}
                  className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs"
                >
                  <Save className="h-3.5 w-3.5 mr-1" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* CREATE CURRENCY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <Coins className="h-5 w-5 text-emerald-600" />
                <span>Add Supported Foreign Currency</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Currency Code (ISO)" required>
                  <TextInput
                    value={createForm.code}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                    }
                    maxLength={3}
                    placeholder="e.g. CAD"
                    className="bg-white font-mono font-bold uppercase h-9"
                  />
                </FormField>

                <FormField label="Currency Symbol" required>
                  <TextInput
                    value={createForm.symbol}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, symbol: e.target.value }))
                    }
                    placeholder="e.g. CA$"
                    className="bg-white font-bold h-9"
                  />
                </FormField>
              </div>

              <FormField label="Currency Full Name" required>
                <TextInput
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g. Canadian Dollar"
                  className="bg-white font-semibold h-9"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Country / Region">
                  <TextInput
                    value={createForm.country || ""}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, country: e.target.value }))
                    }
                    placeholder="e.g. Canada"
                    className="bg-white h-9"
                  />
                </FormField>

                <FormField label="Decimal Precision" required>
                  <SelectInput
                    value={createForm.decimalPlaces}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, decimalPlaces: parseInt(e.target.value, 10) }))
                    }
                    className="bg-white font-semibold h-9"
                  >
                    <option value={2}>2 Decimals (0.00)</option>
                    <option value={0}>0 Decimals</option>
                    <option value={3}>3 Decimals</option>
                    <option value={4}>4 Decimals</option>
                  </SelectInput>
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label={`Exchange Rate to ${baseCode}`} required>
                  <TextInput
                    type="number"
                    step="0.0001"
                    min={0}
                    value={createForm.exchangeRateToBase}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        exchangeRateToBase: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="bg-white font-mono font-bold h-9"
                  />
                </FormField>

                <FormField label="Rate Effective Date">
                  <FODatePicker
                    value={createForm.rateEffectiveDate || ""}
                    onChange={(val) =>
                      setCreateForm((prev) => ({ ...prev, rateEffectiveDate: val }))
                    }
                  />
                </FormField>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800 text-xs">
                  <input
                    type="checkbox"
                    checked={Boolean(createForm.foreignTransactionsAllowed)}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, foreignTransactionsAllowed: e.target.checked }))
                    }
                    className="rounded border-slate-300 text-emerald-600 h-4 w-4 focus:ring-emerald-500"
                  />
                  <span>Allow Foreign Currency Transactions</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void handleCreateCurrency()}
                disabled={saving}
                className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                Create Currency
              </Button>
            </div>
          </div>
        </div>
      )}
    </ModulePageShell>
  );
}
