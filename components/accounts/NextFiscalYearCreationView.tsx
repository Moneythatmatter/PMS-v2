"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar,
  Building2,
  CheckCircle2,
  Plus,
  Save,
  RotateCcw,
  Printer,
  Download,
  Search,
  X,
  FileCheck2,
  Clock,
  ShieldCheck,
  Settings,
  Layers,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  CheckSquare,
  Lock,
  DollarSign,
  AlertCircle,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  TextInput,
  SelectInput,
  TextAreaInput,
  StatMiniCard,
  FODatePicker,
  formatINR,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import {
  sampleFiscalYearRecords,
  sampleFiscalPeriods2027,
  sampleValidationChecklist,
  FiscalYearRecord,
} from "@/app/data/accounts/nextFiscalYearData";
import { cn } from "@/lib/utils";

export function NextFiscalYearCreationView() {
  // Master Fiscal Years List
  const [fyRecords, setFyRecords] = useState<FiscalYearRecord[]>(sampleFiscalYearRecords);
  const [selectedFyId, setSelectedFyId] = useState<string>(sampleFiscalYearRecords[0].id);

  // Search Query State for History List
  const [searchQuery, setSearchQuery] = useState("");

  // Selected Active FY Record
  const activeRecord = useMemo(
    () => fyRecords.find((r) => r.id === selectedFyId) || fyRecords[0],
    [fyRecords, selectedFyId]
  );

  // Form Editing State
  const [formData, setFormData] = useState<FiscalYearRecord>(activeRecord);

  // Sectional Tab Navigation ('periods' | 'carry' | 'posting' | 'audit')
  const [activeTab, setActiveTab] = useState<"periods" | "carry" | "posting" | "audit">("periods");

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Update formData when activeRecord changes
  React.useEffect(() => {
    setFormData({ ...activeRecord });
  }, [activeRecord]);

  // Filtered Fiscal Years
  const filteredFyList = useMemo(() => {
    return fyRecords.filter((r) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          r.fyName.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q) ||
          r.companyName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [fyRecords, searchQuery]);

  // Form Field Change Handler
  const handleFormChange = (field: keyof FiscalYearRecord, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Create New Fiscal Year Setup Action
  const handleInitializeNewFY = () => {
    const newFy: FiscalYearRecord = {
      id: `fy-${Date.now()}`,
      fyName: "FY 2028-2029",
      companyCode: "CMP-001",
      companyName: "LUXY HOTEL & RESORTS PRIVATE LIMITED",
      startDate: "01/04/2028",
      endDate: "31/03/2029",
      startMonth: "April",
      endMonth: "March",
      status: "Pending Initialization",
      baseCurrency: "INR",
      totalLedgersCount: 142,
      retainedEarningsAccount: "3100 - Retained Earnings & Reserves A/c",
      retainedEarningsAmount: 58000000.0,
      allowBackPosting: true,
      lockDate: "31/03/2028",
      voucherResetFrequency: "Annually",
      createdDate: "Today",
      createdBy: "Accounts Admin (Jay)",
      lastAuditDate: "Just Now",
    };

    setFyRecords([newFy, ...fyRecords]);
    setSelectedFyId(newFy.id);
    setFormData(newFy);
    setToastMessage(`Initialized new Fiscal Year template (${newFy.fyName}).`);
  };

  // Save Fiscal Year Setup
  const handleSaveSetup = () => {
    setFyRecords((prev) =>
      prev.map((r) => (r.id === formData.id ? { ...formData, status: "Active" } : r))
    );
    setFormData((prev) => ({ ...prev, status: "Active" }));
    setToastMessage(`Fiscal Year setup '${formData.fyName}' saved and activated successfully!`);
  };

  // Reset Form
  const handleReset = () => {
    setFormData({ ...activeRecord });
    setToastMessage("Reset Fiscal Year parameters to original values.");
  };

  // Export Audit CSV
  const handleExportCSV = () => {
    const csvHeader = "FYName,Company,StartDate,EndDate,Status,TotalLedgers,CreatedBy\n";
    const csvRows = filteredFyList
      .map(
        (r) =>
          `"${r.fyName}","${r.companyName}","${r.startDate}","${r.endDate}","${r.status}","${r.totalLedgersCount}","${r.createdBy}"`
      )
      .join("\n");
    const blob = new Blob([csvHeader + csvRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Fiscal_Year_Audit_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMessage("Exported Fiscal Years audit log to CSV.");
  };

  return (
    <ModulePageShell
      eyebrow="Accounts & Masters"
      title="Next Fiscal Year Creation"
      description="Initialize upcoming financial years, carry forward ledger opening balances, and configure period posting rules."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Masters", href: "/accounts/masters" },
        { label: "Next Fiscal Year Creation" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleInitializeNewFY}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            + Initialize FY 2027-2028
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSaveSetup}
            className="rounded-xl text-xs font-bold bg-white text-slate-800 border-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5 mr-1 text-emerald-600" />
            Save Setup
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Reset Parameters
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Print Summary
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export Log
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
                value={formData.companyName}
                onChange={(e) => handleFormChange("companyName", e.target.value)}
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
              <Calendar className="h-3.5 w-3.5 text-slate-600" />
              Active FY: 2026-2027
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1 text-emerald-800 font-bold border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
              Target FY Status: {formData.status}
            </span>
          </div>
        </div>
      </div>

      {/* Main Split Layout: 35% Left Fiscal History / 65% Right Setup Form */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6 font-sans text-xs">
        {/* LEFT PANEL (35% Desktop / 40% Tablet / 100% Mobile) - FY History List */}
        <div className="md:col-span-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col min-h-[620px]">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-emerald-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Fiscal Years History ({filteredFyList.length})
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              Master FY
            </span>
          </div>

          {/* Quick Search */}
          <div className="mb-3 relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Fiscal Year name, status..."
              className="h-8 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* FY Records Cards */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[600px]">
            {filteredFyList.map((item) => {
              const isSelected = selectedFyId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedFyId(item.id)}
                  className={cn(
                    "p-3 rounded-xl border transition-all duration-150 cursor-pointer space-y-2",
                    isSelected
                      ? "bg-emerald-50/90 border-emerald-500 ring-1 ring-emerald-500 shadow-2xs"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 font-mono">
                        {item.fyName}
                      </h4>
                      <span className="text-[11px] font-semibold text-slate-500 block mt-0.5">
                        {item.startDate} — {item.endDate}
                      </span>
                    </div>

                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 border",
                        item.status === "Active" && "bg-emerald-100 text-emerald-800 border-emerald-200",
                        item.status === "Pending Initialization" && "bg-amber-100 text-amber-900 border-amber-200",
                        item.status === "Locked" && "bg-slate-100 text-slate-700 border-slate-200",
                        item.status === "Closed" && "bg-rose-100 text-rose-800 border-rose-200"
                      )}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px]">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      <Layers className="h-3 w-3 text-slate-500" />
                      {item.totalLedgersCount} Ledgers
                    </span>

                    <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                      {item.createdBy}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL (65% Desktop / 60% Tablet / 100% Mobile) - FY Setup Form & Metrics */}
        <div className="md:col-span-8 space-y-4">
          {/* Top Overview Metrics Strip (4 Stat Cards) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono font-bold text-xs text-slate-500 block">
                  {formData.companyCode} • {formData.companyName}
                </span>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>{formData.fyName}</span>
                  <span className="text-xs font-semibold text-slate-500">
                    ({formData.startDate} to {formData.endDate})
                  </span>
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "px-3 py-1 rounded-xl text-xs font-bold border",
                    formData.status === "Active"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-amber-50 text-amber-900 border-amber-200"
                  )}
                >
                  {formData.status}
                </span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Current Active FY</span>
                <span className="text-xs font-mono font-bold text-slate-900 mt-0.5 block">
                  FY 2026-2027
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Target Setup FY</span>
                <span className="text-xs font-mono font-bold text-emerald-700 mt-0.5 block">
                  {formData.fyName}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Carry Forward Ledgers</span>
                <span className="text-xs font-mono font-bold text-slate-900 mt-0.5 block">
                  {formData.totalLedgersCount} Accounts
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Retained Earnings Transfer</span>
                <span className="text-xs font-mono font-bold text-emerald-800 mt-0.5 block truncate">
                  {formatINR(formData.retainedEarningsAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Section Navigation Tabs (IDENTICAL TO COMPANY SETTINGS & PARTY MASTER TAB BAR) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xs flex border-b border-slate-200 overflow-x-auto gap-1">
            {[
              { id: "periods", label: "Period Configuration", icon: Calendar },
              { id: "carry", label: "Balance Carry Forward", icon: SlidersHorizontal },
              { id: "posting", label: "Posting Controls & Locks", icon: Lock },
              { id: "audit", label: "System Audit & Checklist", icon: ShieldCheck },
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
            {/* 📅 TAB 1: PERIOD CONFIGURATION */}
            {activeTab === "periods" && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                    New Fiscal Year Dates & Accounting Standard
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label="Fiscal Year Identifier" required>
                      <TextInput
                        value={formData.fyName}
                        onChange={(e) => handleFormChange("fyName", e.target.value)}
                        className="font-mono font-bold text-slate-900 bg-white h-9"
                      />
                    </FormField>

                    <FormField label="Start Date">
                      <TextInput
                        value={formData.startDate}
                        onChange={(e) => handleFormChange("startDate", e.target.value)}
                        className="font-mono font-bold bg-white h-9"
                      />
                    </FormField>

                    <FormField label="End Date">
                      <TextInput
                        value={formData.endDate}
                        onChange={(e) => handleFormChange("endDate", e.target.value)}
                        className="font-mono font-bold bg-white h-9"
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label="Start Month">
                      <SelectInput
                        value={formData.startMonth}
                        onChange={(e) => handleFormChange("startMonth", e.target.value)}
                        className="bg-white font-semibold h-9"
                      >
                        <option value="April">April (Standard Indian Financial Year)</option>
                        <option value="January">January (Calendar Year)</option>
                      </SelectInput>
                    </FormField>

                    <FormField label="Base Reporting Currency">
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

                    <FormField label="Target Status">
                      <SelectInput
                        value={formData.status}
                        onChange={(e) => handleFormChange("status", e.target.value)}
                        className="bg-white font-bold text-slate-900 h-9"
                      >
                        <option value="Pending Initialization">Pending Initialization</option>
                        <option value="Active">Active</option>
                        <option value="Locked">Locked</option>
                        <option value="Closed">Closed</option>
                      </SelectInput>
                    </FormField>
                  </div>
                </div>

                {/* 12 Monthly Period Grid Breakdown */}
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-emerald-600" />
                      12 Monthly Period Schedule Breakdown
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 font-bold">12 PERIODS</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    {sampleFiscalPeriods2027.map((period) => (
                      <div
                        key={period.periodNo}
                        className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-slate-900 block text-[11px]">
                            {period.periodName}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 block">
                            {period.startDate} to {period.endDate}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                          {period.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 🔄 TAB 2: BALANCE CARRY FORWARD */}
            {activeTab === "carry" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
                    Opening Balance & Year-End Transfer Rules
                  </h3>

                  <FormField label="Retained Earnings Account (P&L Year-End Transfer)" required>
                    <SelectInput
                      value={formData.retainedEarningsAccount}
                      onChange={(e) => handleFormChange("retainedEarningsAccount", e.target.value)}
                      className="bg-white font-bold text-slate-900 h-9"
                    >
                      <option value="3100 - Retained Earnings & Reserves A/c">
                        3100 - Retained Earnings & Reserves A/c
                      </option>
                      <option value="3200 - General Reserve A/c">3200 - General Reserve A/c</option>
                      <option value="3300 - Profit & Loss Transfer Ledger">3300 - Profit & Loss Transfer Ledger</option>
                    </SelectInput>
                  </FormField>

                  <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={true}
                        readOnly
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Carry Forward Assets & Liabilities Closing Balances as Opening Balances</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={true}
                        readOnly
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Automatically Transfer P&L Net Balance to Retained Earnings Reserve Account</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={true}
                        readOnly
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Copy Customer & Vendor Sub-Ledger Outstanding Item Details (Bill-by-Bill)</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={true}
                        readOnly
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Preserve Complete Chart of Accounts Structure & Master Sub-Ledgers</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 🔒 TAB 3: POSTING CONTROLS & LOCK RULES */}
            {activeTab === "posting" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-emerald-600" />
                    Voucher Reset & Posting Controls
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Prior FY Lock Date">
                      <TextInput
                        type="date"
                        value="2027-03-31"
                        onChange={(e) => handleFormChange("lockDate", e.target.value)}
                        className="bg-white font-mono h-9"
                      />
                    </FormField>

                    <FormField label="Voucher Sequence Reset Mode">
                      <SelectInput
                        value={formData.voucherResetFrequency}
                        onChange={(e) => handleFormChange("voucherResetFrequency", e.target.value)}
                        className="bg-white font-semibold h-9"
                      >
                        <option value="Annually">Annually (Reset to 0001 for FY 2027-2028)</option>
                        <option value="Continuous">Continuous (Maintain Running Sequence)</option>
                      </SelectInput>
                    </FormField>
                  </div>

                  <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.allowBackPosting}
                        onChange={(e) => handleFormChange("allowBackPosting", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Allow Back-Dated Journal Voucher Postings to Prior FY with Senior Approval</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={true}
                        readOnly
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Enforce Night Audit Sales Revenue Auto-Posting Rules in New FY</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={true}
                        readOnly
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Enforce Restaurant POS Day-End Settlement Rules in New FY</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 📜 TAB 4: SYSTEM AUDIT & CHECKLISTS */}
            {activeTab === "audit" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      Pre-Creation Readiness Audit Checklist
                    </h3>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-xl">
                      100% Fully Validated
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {sampleValidationChecklist.map((chk) => (
                      <div
                        key={chk.id}
                        className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block text-xs">
                            {chk.title}
                          </span>
                          <span className="text-[11px] text-slate-600 block">
                            {chk.detail}
                          </span>
                        </div>

                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {chk.status}
                        </span>
                      </div>
                    ))}
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
