"use client";

import React, { useState, useMemo } from "react";
import {
  DollarSign,
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
  AlertCircle,
  Building,
  Globe,
  TrendingUp,
  CreditCard,
  FileText,
  Tag,
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
  sampleCurrenciesData,
  CurrencyRecord,
} from "@/app/data/accounts/currencyData";
import { cn } from "@/lib/utils";

export function CurrencyMasterView() {
  // Master Currencies List State
  const [currencies, setCurrencies] = useState<CurrencyRecord[]>(sampleCurrenciesData);
  const [selectedId, setSelectedId] = useState<string>(sampleCurrenciesData[0].id);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  // Selected Record
  const activeRecord = useMemo(
    () => currencies.find((c) => c.id === selectedId) || currencies[0],
    [currencies, selectedId]
  );

  // Form State
  const [formData, setFormData] = useState<CurrencyRecord>(activeRecord);

  // Sectional Tab ('definition' | 'rates' | 'forex' | 'formatting')
  const [activeTab, setActiveTab] = useState<"definition" | "rates" | "forex" | "formatting">("definition");

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync Form Data when selected record changes
  React.useEffect(() => {
    setFormData({ ...activeRecord });
  }, [activeRecord]);

  // Filtered Currencies
  const filteredCurrencies = useMemo(() => {
    return currencies.filter((c) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          c.currencyCode.toLowerCase().includes(q) ||
          c.currencyName.toLowerCase().includes(q) ||
          c.country.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [currencies, searchQuery]);

  // Field Change Handler
  const handleFormChange = (field: keyof CurrencyRecord, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Add New Currency Action
  const handleNewCurrency = () => {
    const newRecord: CurrencyRecord = {
      id: `cur-${Date.now()}`,
      currencyCode: "CAD",
      currencyName: "Canadian Dollar",
      currencySymbol: "CA$",
      subUnitName: "Cents",
      country: "Canada",
      isoCode: "124",
      isBaseCurrency: false,
      activeStatus: true,
      exchangeRate: 61.2,
      buyingRate: 60.9,
      sellingRate: 61.5,
      effectiveDate: "Today",
      rateTolerancePct: 2.0,
      rateSource: "Bank of Canada / RBI",
      forexGainLedger: "4200 - Foreign Exchange Realized Gain A/c",
      forexLossLedger: "5300 - Foreign Exchange Realized Loss A/c",
      unrealizedReserveLedger: "3400 - Forex Revaluation Reserve",
      decimalPlaces: 2,
      allowForeignVouchers: true,
      formatPreview: "CA$ 1,000.00",
      signBy: "Accounts Manager",
      updatedBy: "Jay Admin",
      updatedDate: "Today",
    };

    setCurrencies([newRecord, ...currencies]);
    setSelectedId(newRecord.id);
    setFormData(newRecord);
    setToastMessage(`Created new Currency definition (${newRecord.currencyCode} - ${newRecord.currencyName}).`);
  };

  // Save Settings Action
  const handleSaveSettings = () => {
    setCurrencies((prev) =>
      prev.map((c) => (c.id === formData.id ? { ...formData, updatedDate: "Just Now" } : c))
    );
    setFormData((prev) => ({ ...prev, updatedDate: "Just Now" }));
    setToastMessage(`Saved Currency '${formData.currencyCode}' setup and exchange rates!`);
  };

  // Reset Action
  const handleReset = () => {
    setFormData({ ...activeRecord });
    setToastMessage("Reset Currency parameters to saved values.");
  };

  // Export CSV Action
  const handleExportCSV = () => {
    const csvHeader = "CurrencyCode,CurrencyName,Symbol,BaseCurrency,Rate,BuyingRate,SellingRate,Country,Active\n";
    const csvRows = filteredCurrencies
      .map(
        (c) =>
          `"${c.currencyCode}","${c.currencyName}","${c.currencySymbol}","${c.isBaseCurrency}","${c.exchangeRate}","${c.buyingRate}","${c.sellingRate}","${c.country}","${c.activeStatus}"`
      )
      .join("\n");
    const blob = new Blob([csvHeader + csvRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Currency_Master_Report_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMessage("Exported Currency Master rate sheet to CSV.");
  };

  return (
    <ModulePageShell
      eyebrow="Accounts & Masters"
      title="Currency"
      description="Manage multi-currency definitions, live exchange rates, forex gain/loss ledgers, and foreign voucher posting rules."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Masters", href: "/accounts/masters" },
        { label: "Currency" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleNewCurrency}
            className="rounded-xl text-xs font-bold bg-white text-slate-800 border-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1 text-emerald-600" />
            + New Currency
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
            Print Rate Sheet
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
              <Globe className="h-3.5 w-3.5 text-slate-600" />
              Base Currency: INR (₹)
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
              Status: {formData.activeStatus ? "Active Currency" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Split Layout: 35% Left Currencies List / 65% Right Form */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6 font-sans text-xs">
        {/* LEFT PANEL (35% Desktop / 40% Tablet / 100% Mobile) - Currencies List */}
        <div className="md:col-span-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col min-h-[620px]">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Globe className="h-4.5 w-4.5 text-emerald-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Currencies ({filteredCurrencies.length})
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              Multi-Currency
            </span>
          </div>

          {/* Quick Search */}
          <div className="mb-3 relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Currency Code, name, country..."
              className="h-8 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Records List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[600px]">
            {filteredCurrencies.map((item) => {
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
                          {item.currencySymbol}
                        </span>
                        <span>{item.currencyCode}</span>
                        <span className="text-[11px] font-normal text-slate-500 truncate max-w-[120px]">
                          ({item.currencyName})
                        </span>
                      </h4>
                      <span className="text-[11px] font-semibold text-slate-500 block mt-0.5">
                        Country: {item.country}
                      </span>
                    </div>

                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 border",
                        item.isBaseCurrency
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      )}
                    >
                      {item.isBaseCurrency ? "BASE" : "FOREIGN"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px]">
                    <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      Rate: {item.isBaseCurrency ? "1.00" : `₹${item.exchangeRate}`}
                    </span>
                    <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-mono">
                      {item.formatPreview}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL (65% Desktop / 60% Tablet / 100% Mobile) - Currency Form */}
        <div className="md:col-span-8 space-y-4">
          {/* Top Overview Metrics Cards */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono font-bold text-xs text-slate-500 block">
                  ISO Code: {formData.isoCode} • Country: {formData.country}
                </span>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>{formData.currencyName}</span>
                  <span className="font-mono text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">
                    {formData.currencySymbol} ({formData.currencyCode})
                  </span>
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "px-3 py-1 rounded-xl text-xs font-bold border",
                    formData.isBaseCurrency
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  )}
                >
                  {formData.isBaseCurrency ? "Base Domestic Currency" : "Foreign Currency"}
                </span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Base Exchange Rate</span>
                <span className="text-xs font-mono font-bold text-emerald-700 mt-0.5 block">
                  {formData.isBaseCurrency ? "1.00 INR" : `₹ ${formData.exchangeRate}`}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Sub-Unit Name</span>
                <span className="text-xs font-mono font-bold text-slate-900 mt-0.5 block">
                  {formData.subUnitName}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Rate Source</span>
                <span className="text-xs font-mono font-bold text-slate-900 mt-0.5 block truncate">
                  {formData.rateSource}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Foreign Vouchers</span>
                <span className="text-xs font-mono font-bold text-emerald-800 mt-0.5 block">
                  {formData.allowForeignVouchers ? "Allowed" : "Disabled"}
                </span>
              </div>
            </div>
          </div>

          {/* Section Navigation Tabs (IDENTICAL TO COMPANY SETTINGS & PARTY MASTER TAB BAR) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xs flex border-b border-slate-200 overflow-x-auto gap-1">
            {[
              { id: "definition", label: "Currency Definition & Symbol", icon: Globe },
              { id: "rates", label: "Exchange Rates & Variations", icon: TrendingUp },
              { id: "forex", label: "Forex Gain/Loss Accounting", icon: Building },
              { id: "formatting", label: "Formatting & Voucher Rules", icon: FileText },
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
            {/* 💱 TAB 1: CURRENCY DEFINITION & SYMBOL */}
            {activeTab === "definition" && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-emerald-600" />
                      Currency Master Identity & ISO Codes
                    </span>
                    <span className="text-[11px] font-mono text-emerald-800 font-bold">WINHMS CURRENCY</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label="Currency Code (ISO 3-Letter)" required>
                      <TextInput
                        value={formData.currencyCode}
                        onChange={(e) => handleFormChange("currencyCode", e.target.value.toUpperCase())}
                        className="bg-white font-mono font-bold text-slate-900 h-9"
                      />
                    </FormField>

                    <FormField label="Currency Full Name" required>
                      <TextInput
                        value={formData.currencyName}
                        onChange={(e) => handleFormChange("currencyName", e.target.value)}
                        className="bg-white font-bold text-slate-900 h-9"
                      />
                    </FormField>

                    <FormField label="Currency Symbol" required>
                      <TextInput
                        value={formData.currencySymbol}
                        onChange={(e) => handleFormChange("currencySymbol", e.target.value)}
                        className="bg-white font-mono font-bold text-slate-900 h-9"
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label="Sub-Unit Name (Decimals)">
                      <TextInput
                        value={formData.subUnitName}
                        onChange={(e) => handleFormChange("subUnitName", e.target.value)}
                        placeholder="e.g. Cents, Paise, Fils"
                        className="bg-white font-semibold h-9"
                      />
                    </FormField>

                    <FormField label="Country / Jurisdiction">
                      <TextInput
                        value={formData.country}
                        onChange={(e) => handleFormChange("country", e.target.value)}
                        className="bg-white font-semibold h-9"
                      />
                    </FormField>

                    <FormField label="ISO Numeric Code">
                      <TextInput
                        value={formData.isoCode}
                        onChange={(e) => handleFormChange("isoCode", e.target.value)}
                        className="bg-white font-mono h-9"
                      />
                    </FormField>
                  </div>

                  <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.isBaseCurrency}
                        onChange={(e) => handleFormChange("isBaseCurrency", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Is Base Domestic Reporting Currency (INR ₹)</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.activeStatus}
                        onChange={(e) => handleFormChange("activeStatus", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Active for Voucher Postings & Guest Folios</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 📈 TAB 2: EXCHANGE RATES & VARIATIONS */}
            {activeTab === "rates" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    Exchange Rate Parameters (1 {formData.currencyCode} = INR)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label="Standard Exchange Rate (INR)" required>
                      <TextInput
                        type="number"
                        step="0.01"
                        value={formData.exchangeRate}
                        onChange={(e) => handleFormChange("exchangeRate", parseFloat(e.target.value) || 1)}
                        className="bg-white font-mono font-bold text-slate-900 h-9"
                      />
                    </FormField>

                    <FormField label="Bank Buying Rate (INR)">
                      <TextInput
                        type="number"
                        step="0.01"
                        value={formData.buyingRate}
                        onChange={(e) => handleFormChange("buyingRate", parseFloat(e.target.value) || 1)}
                        className="bg-white font-mono font-semibold h-9"
                      />
                    </FormField>

                    <FormField label="Bank Selling Rate (INR)">
                      <TextInput
                        type="number"
                        step="0.01"
                        value={formData.sellingRate}
                        onChange={(e) => handleFormChange("sellingRate", parseFloat(e.target.value) || 1)}
                        className="bg-white font-mono font-semibold h-9"
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label="Effective Date">
                      <TextInput
                        value={formData.effectiveDate}
                        onChange={(e) => handleFormChange("effectiveDate", e.target.value)}
                        className="bg-white font-mono h-9"
                      />
                    </FormField>

                    <FormField label="Rate Variation Tolerance (%)">
                      <TextInput
                        type="number"
                        step="0.1"
                        value={formData.rateTolerancePct}
                        onChange={(e) => handleFormChange("rateTolerancePct", parseFloat(e.target.value) || 0)}
                        className="bg-white font-mono h-9"
                      />
                    </FormField>

                    <FormField label="Exchange Rate Source">
                      <TextInput
                        value={formData.rateSource}
                        onChange={(e) => handleFormChange("rateSource", e.target.value)}
                        className="bg-white font-semibold h-9"
                      />
                    </FormField>
                  </div>
                </div>
              </div>
            )}

            {/* 🏦 TAB 3: FOREX GAIN/LOSS ACCOUNTING */}
            {activeTab === "forex" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <Building className="h-4 w-4 text-emerald-600" />
                    Foreign Exchange Difference General Ledger Mapping
                  </h3>

                  <FormField label="Realized Foreign Exchange Gain Ledger" required>
                    <SelectInput
                      value={formData.forexGainLedger}
                      onChange={(e) => handleFormChange("forexGainLedger", e.target.value)}
                      className="bg-white font-bold text-slate-900 h-9"
                    >
                      <option value="4200 - Foreign Exchange Realized Gain A/c">
                        4200 - Foreign Exchange Realized Gain A/c
                      </option>
                      <option value="4250 - Forex Exchange Rate Difference Income">
                        4250 - Forex Exchange Rate Difference Income
                      </option>
                    </SelectInput>
                  </FormField>

                  <FormField label="Realized Foreign Exchange Loss Ledger" required>
                    <SelectInput
                      value={formData.forexLossLedger}
                      onChange={(e) => handleFormChange("forexLossLedger", e.target.value)}
                      className="bg-white font-bold text-slate-900 h-9"
                    >
                      <option value="5300 - Foreign Exchange Realized Loss A/c">
                        5300 - Foreign Exchange Realized Loss A/c
                      </option>
                      <option value="5350 - Forex Rate Fluctuation Loss Ledger">
                        5350 - Forex Rate Fluctuation Loss Ledger
                      </option>
                    </SelectInput>
                  </FormField>

                  <FormField label="Unrealized Forex Revaluation Reserve Ledger">
                    <SelectInput
                      value={formData.unrealizedReserveLedger}
                      onChange={(e) => handleFormChange("unrealizedReserveLedger", e.target.value)}
                      className="bg-white font-semibold text-slate-900 h-9"
                    >
                      <option value="3400 - Forex Revaluation Reserve">
                        3400 - Forex Revaluation Reserve
                      </option>
                    </SelectInput>
                  </FormField>
                </div>
              </div>
            )}

            {/* 🧾 TAB 4: FORMATTING & VOUCHER RULES */}
            {activeTab === "formatting" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    Display Formatting & Foreign Voucher Posting Flags
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Decimal Precision Places">
                      <SelectInput
                        value={formData.decimalPlaces}
                        onChange={(e) => handleFormChange("decimalPlaces", parseInt(e.target.value) || 2)}
                        className="bg-white font-bold text-slate-900 h-9"
                      >
                        <option value={2}>2 Decimal Places (Standard e.g. 10.50)</option>
                        <option value={3}>3 Decimal Places (e.g. 10.500)</option>
                        <option value={0}>0 Decimal Places (Rounded)</option>
                      </SelectInput>
                    </FormField>

                    <FormField label="Formatted Amount Display Preview">
                      <TextInput
                        value={formData.formatPreview}
                        onChange={(e) => handleFormChange("formatPreview", e.target.value)}
                        className="bg-slate-100 font-mono font-extrabold text-emerald-800 h-9"
                      />
                    </FormField>
                  </div>

                  <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.allowForeignVouchers}
                        onChange={(e) => handleFormChange("allowForeignVouchers", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Allow Foreign Currency Postings in Journal, Receipt & Payment Vouchers</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 text-slate-500 font-mono text-[11px]">
                    <div>
                      Authorized Sign By: <strong className="text-slate-800">{formData.signBy}</strong>
                    </div>
                    <div>
                      Last Updated: <strong className="text-slate-800">{formData.updatedDate}</strong> (By {formData.updatedBy})
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
