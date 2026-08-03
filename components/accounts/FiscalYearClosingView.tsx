"use client";

import React, { useState, useMemo } from "react";
import {
  Lock,
  Calendar,
  Building2,
  CheckCircle2,
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
  FileCheck2,
  DollarSign,
  AlertCircle,
  Building,
  ShieldAlert,
  KeyRound,
  FileSpreadsheet,
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
import { cn } from "@/lib/utils";

export interface FiscalYearClosingRecord {
  id: string;
  fyName: string;
  companyCode: string;
  companyName: string;
  startDate: string;
  endDate: string;
  status: "Ready for Closing" | "Active" | "Closed & Locked" | "Archived";
  totalRevenue: number;
  totalExpense: number;
  netProfitLoss: number;
  retainedEarningsLedger: string;
  totalLedgersCount: number;
  unpostedVouchersCount: number;
  bankReconciled: boolean;
  closedBy?: string;
  closedDate?: string;
}

export const sampleClosingFYRecords: FiscalYearClosingRecord[] = [
  {
    id: "fy-2026-27",
    fyName: "FY 2026-2027",
    companyCode: "CMP-001",
    companyName: "LUXY HOTEL & RESORTS PRIVATE LIMITED",
    startDate: "01/04/2026",
    endDate: "31/03/2027",
    status: "Ready for Closing",
    totalRevenue: 184280000.0,
    totalExpense: 135759500.0,
    netProfitLoss: 48520500.0,
    retainedEarningsLedger: "3100 - Retained Earnings & Reserves A/c",
    totalLedgersCount: 142,
    unpostedVouchersCount: 0,
    bankReconciled: true,
  },
  {
    id: "fy-2025-26",
    fyName: "FY 2025-2026",
    companyCode: "CMP-001",
    companyName: "LUXY HOTEL & RESORTS PRIVATE LIMITED",
    startDate: "01/04/2025",
    endDate: "31/03/2026",
    status: "Closed & Locked",
    totalRevenue: 152000000.0,
    totalExpense: 113750000.0,
    netProfitLoss: 38250000.0,
    retainedEarningsLedger: "3100 - Retained Earnings & Reserves A/c",
    totalLedgersCount: 138,
    unpostedVouchersCount: 0,
    bankReconciled: true,
    closedBy: "Abhijit Suthar",
    closedDate: "31/03/2026 23:45",
  },
  {
    id: "fy-2024-25",
    fyName: "FY 2024-2025",
    companyCode: "CMP-001",
    companyName: "LUXY HOTEL & RESORTS PRIVATE LIMITED",
    startDate: "01/04/2024",
    endDate: "31/03/2025",
    status: "Archived",
    totalRevenue: 125000000.0,
    totalExpense: 95500000.0,
    netProfitLoss: 29500000.0,
    retainedEarningsLedger: "3100 - Retained Earnings & Reserves A/c",
    totalLedgersCount: 124,
    unpostedVouchersCount: 0,
    bankReconciled: true,
    closedBy: "System Auditor",
    closedDate: "31/03/2025 23:59",
  },
];

export const samplePreClosingVerifications = [
  { id: "v1", title: "Trial Balance Equilibrium", description: "Total Debits equal Total Credits. Zero difference balance.", status: "Passed", icon: CheckCircle2 },
  { id: "v2", title: "Unposted Vouchers Verification", description: "0 unposted draft journal vouchers found in active FY.", status: "Passed", icon: CheckCircle2 },
  { id: "v3", title: "Bank Reconciliation Audit", description: "All 4 bank ledgers fully reconciled through 31-Mar-2027.", status: "Passed", icon: CheckCircle2 },
  { id: "v4", title: "Closing Inventory Valuation", description: "Food & Beverage stores closing stock valued and journalized.", status: "Passed", icon: CheckCircle2 },
  { id: "v5", title: "Fixed Asset Depreciation Posting", description: "Annual asset depreciation posted across all cost centers.", status: "Passed", icon: CheckCircle2 },
  { id: "v6", title: "Retained Earnings Account Mapping", description: "Account 3100 set as default target for net surplus transfer.", status: "Passed", icon: CheckCircle2 },
];

export function FiscalYearClosingView() {
  // Records State
  const [fyRecords, setFyRecords] = useState<FiscalYearClosingRecord[]>(sampleClosingFYRecords);
  const [selectedId, setSelectedId] = useState<string>(sampleClosingFYRecords[0].id);
  const [searchQuery, setSearchQuery] = useState("");

  // Selected Record
  const activeRecord = useMemo(
    () => fyRecords.find((r) => r.id === selectedId) || fyRecords[0],
    [fyRecords, selectedId]
  );

  // Form State
  const [formData, setFormData] = useState<FiscalYearClosingRecord>(activeRecord);

  // Sectional Tab ('closing' | 'transfer' | 'audit' | 'logs')
  const [activeTab, setActiveTab] = useState<"closing" | "transfer" | "audit" | "logs">("closing");

  // Options Toggles
  const [lockAllPeriods, setLockAllPeriods] = useState(true);
  const [preventBackposting, setPreventBackposting] = useState(true);
  const [autoJournalVoucher, setAutoJournalVoucher] = useState(true);
  const [auditorPasscode, setAuditorPasscode] = useState("••••••••");
  const [closingRemarks, setClosingRemarks] = useState(
    "Final fiscal year 2026-2027 audited closing executed in accordance with statutory accounting standards."
  );

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync Form Data on Record Selection
  React.useEffect(() => {
    setFormData({ ...activeRecord });
  }, [activeRecord]);

  // Filtered List
  const filteredRecords = useMemo(() => {
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

  // Execute Year-End Closing Action
  const handleExecuteYearEndClose = () => {
    if (formData.status === "Closed & Locked" || formData.status === "Archived") {
      setToastMessage(`Fiscal year '${formData.fyName}' is already closed and locked.`);
      return;
    }

    const updated = {
      ...formData,
      status: "Closed & Locked" as const,
      closedBy: "Abhijit Suthar (Finance Controller)",
      closedDate: "Today at 23:59",
    };

    setFyRecords((prev) => prev.map((r) => (r.id === formData.id ? updated : r)));
    setFormData(updated);
    setToastMessage(
      `SUCCESS: Year-End Closing for ${formData.fyName} executed! P&L net surplus ${formatINR(
        formData.netProfitLoss
      )} transferred to ${formData.retainedEarningsLedger}.`
    );
  };

  // Reset Parameters
  const handleReset = () => {
    setFormData({ ...activeRecord });
    setToastMessage("Reset Year-End Closing rules to initial state.");
  };

  // Export Audit CSV
  const handleExportCSV = () => {
    const csvHeader = "FYName,Company,StartDate,EndDate,Status,Revenue,Expense,NetSurplus,ClosedBy\n";
    const csvRows = filteredRecords
      .map(
        (r) =>
          `"${r.fyName}","${r.companyName}","${r.startDate}","${r.endDate}","${r.status}","${r.totalRevenue}","${r.totalExpense}","${r.netProfitLoss}","${r.closedBy || "N/A"}"`
      )
      .join("\n");
    const blob = new Blob([csvHeader + csvRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Fiscal_Year_Closing_Report_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMessage("Exported Fiscal Year Closing certificate report to CSV.");
  };

  return (
    <ModulePageShell
      eyebrow="Accounts & Masters"
      title="Fiscal Year Closing"
      description="Execute final financial year-end closing, lock period postings, and transfer P&L net balances to retained earnings."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Masters", href: "/accounts/masters" },
        { label: "Fiscal Year Closing" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleExecuteYearEndClose}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            <Lock className="h-3.5 w-3.5 mr-1" />
            Execute Year-End Close
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setToastMessage("Saved Fiscal Year Closing rules & parameters.")}
            className="rounded-xl text-xs font-bold bg-white text-slate-800 border-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5 mr-1 text-emerald-600" />
            Save Rules
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Reset Rules
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Print Audit
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export Certificate
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
                onChange={(e) => setFormData((prev) => ({ ...prev, companyName: e.target.value }))}
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
              Target Year: {formData.fyName}
            </span>

            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3 py-1 font-bold border",
                formData.status === "Closed & Locked"
                  ? "bg-rose-50 text-rose-800 border-rose-200"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
              )}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Status: {formData.status}
            </span>
          </div>
        </div>
      </div>

      {/* Main Split Layout: 35% Left FY Selection / 65% Right Year-End Form */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6 font-sans text-xs">
        {/* LEFT PANEL (35% Desktop / 40% Tablet / 100% Mobile) - FY List */}
        <div className="md:col-span-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col min-h-[620px]">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-emerald-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Fiscal Years ({filteredRecords.length})
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              Audit Status
            </span>
          </div>

          {/* Quick Search */}
          <div className="mb-3 relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Fiscal Year..."
              className="h-8 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Records List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[600px]">
            {filteredRecords.map((item) => {
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
                        item.status === "Ready for Closing" && "bg-emerald-100 text-emerald-800 border-emerald-200",
                        item.status === "Closed & Locked" && "bg-rose-100 text-rose-800 border-rose-200",
                        item.status === "Archived" && "bg-slate-100 text-slate-700 border-slate-200"
                      )}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px]">
                    <span className="font-bold text-emerald-800 font-mono">
                      Net: {formatINR(item.netProfitLoss)}
                    </span>
                    <span className="font-mono text-slate-500">
                      {item.totalLedgersCount} Ledgers
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL (65% Desktop / 60% Tablet / 100% Mobile) - Closing Controls & Audit */}
        <div className="md:col-span-8 space-y-4">
          {/* Top Overview Metrics Cards */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono font-bold text-xs text-slate-500 block">
                  {formData.companyCode} • {formData.companyName}
                </span>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>{formData.fyName} Year-End Closing Audit</span>
                  <span className="text-xs font-semibold text-slate-500">
                    ({formData.startDate} to {formData.endDate})
                  </span>
                </h2>
              </div>

              <span
                className={cn(
                  "px-3 py-1 rounded-xl text-xs font-bold border",
                  formData.status === "Closed & Locked"
                    ? "bg-rose-50 text-rose-800 border-rose-200"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
                )}
              >
                {formData.status}
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Total FY Revenue</span>
                <span className="text-xs font-mono font-bold text-emerald-700 mt-0.5 block">
                  {formatINR(formData.totalRevenue)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Total FY Expense</span>
                <span className="text-xs font-mono font-bold text-rose-700 mt-0.5 block">
                  {formatINR(formData.totalExpense)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Net Profit / Surplus</span>
                <span className="text-xs font-mono font-extrabold text-emerald-800 mt-0.5 block">
                  {formatINR(formData.netProfitLoss)} Cr
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Unposted Draft Vouchers</span>
                <span className="text-xs font-mono font-bold text-slate-900 mt-0.5 block">
                  0 Drafts (Verified)
                </span>
              </div>
            </div>
          </div>

          {/* Section Navigation Tabs (IDENTICAL TO COMPANY SETTINGS & PARTY MASTER TAB BAR) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xs flex border-b border-slate-200 overflow-x-auto gap-1">
            {[
              { id: "closing", label: "Year-End Closing Controls", icon: Lock },
              { id: "transfer", label: "P&L Net Balance Transfer", icon: SlidersHorizontal },
              { id: "audit", label: "Pre-Closing Verification", icon: ShieldCheck },
              { id: "logs", label: "Compliance & Security", icon: KeyRound },
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
            {/* 🔒 TAB 1: YEAR-END CLOSING CONTROLS */}
            {activeTab === "closing" && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-emerald-600" />
                    Target Year-End Closing Parameters
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Target Fiscal Year" required>
                      <SelectInput
                        value={formData.fyName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, fyName: e.target.value }))}
                        className="bg-white font-bold text-slate-900 h-9"
                      >
                        <option value="FY 2026-2027">FY 2026-2027 (01/04/2026 to 31/03/2027)</option>
                        <option value="FY 2025-2026">FY 2025-2026 (01/04/2025 to 31/03/2026)</option>
                      </SelectInput>
                    </FormField>

                    <FormField label="Effective Closing Date">
                      <TextInput
                        value={formData.endDate}
                        readOnly
                        className="bg-slate-100 font-mono font-bold text-slate-800 h-9"
                      />
                    </FormField>
                  </div>

                  <FormField label="Retained Earnings Account (P&L Net Surplus Target)" required>
                    <SelectInput
                      value={formData.retainedEarningsLedger}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, retainedEarningsLedger: e.target.value }))
                      }
                      className="bg-white font-bold text-slate-900 h-9"
                    >
                      <option value="3100 - Retained Earnings & Reserves A/c">
                        3100 - Retained Earnings & Reserves A/c
                      </option>
                      <option value="3200 - General Reserve A/c">3200 - General Reserve A/c</option>
                    </SelectInput>
                  </FormField>

                  <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={lockAllPeriods}
                        onChange={(e) => setLockAllPeriods(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Permanently Lock All 12 Monthly Accounting Periods in {formData.fyName}</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={preventBackposting}
                        onChange={(e) => setPreventBackposting(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Block Back-Dated Voucher Postings to Closed FY without Senior Passcode Override</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={autoJournalVoucher}
                        onChange={(e) => setAutoJournalVoucher(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Auto-Generate Year-End Closing Journal Voucher (YEC-2027-001)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 🔄 TAB 2: P&L NET BALANCE TRANSFER */}
            {activeTab === "transfer" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
                    P&L Revenue & Expense Net Surplus Calculation
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block">Total Revenue & Gains</span>
                      <span className="text-sm font-mono font-bold text-emerald-900 mt-1 block">
                        {formatINR(formData.totalRevenue)}
                      </span>
                    </div>

                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                      <span className="text-[10px] font-bold text-rose-800 uppercase block">Total Expenses & Losses</span>
                      <span className="text-sm font-mono font-bold text-rose-900 mt-1 block">
                        {formatINR(formData.totalExpense)}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-900 text-white rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase block">Net Operating Profit</span>
                      <span className="text-sm font-mono font-extrabold text-white mt-1 block">
                        {formatINR(formData.netProfitLoss)} Cr
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-800 block text-xs">Generated Journal Entry Preview:</span>
                    <div className="font-mono text-[11px] text-slate-700 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div>DR: Revenue & Sales Accounts — {formatINR(formData.totalRevenue)}</div>
                      <div>CR: Expense Accounts — {formatINR(formData.totalExpense)}</div>
                      <div className="font-bold text-emerald-800">
                        CR: {formData.retainedEarningsLedger} — {formatINR(formData.netProfitLoss)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 📜 TAB 3: PRE-CLOSING VERIFICATION */}
            {activeTab === "audit" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      Year-End Pre-Closing Verification Audit
                    </h3>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-xl">
                      6/6 Audits Passed
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {samplePreClosingVerifications.map((chk) => (
                      <div
                        key={chk.id}
                        className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block text-xs flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            {chk.title}
                          </span>
                          <span className="text-[11px] text-slate-600 block pl-5">
                            {chk.description}
                          </span>
                        </div>

                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                          {chk.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 🛡️ TAB 4: COMPLIANCE & SECURITY */}
            {activeTab === "logs" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-emerald-600" />
                    Security Passcode & Audit Compliance Authorization
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Senior Auditor Passcode" required>
                      <TextInput
                        type="password"
                        value={auditorPasscode}
                        onChange={(e) => setAuditorPasscode(e.target.value)}
                        className="bg-white font-mono h-9"
                      />
                    </FormField>

                    <FormField label="Authorized Closing Officer">
                      <TextInput
                        value="Abhijit Suthar (Finance Controller)"
                        readOnly
                        className="bg-slate-100 font-semibold h-9"
                      />
                    </FormField>
                  </div>

                  <FormField label="Audit Remarks & Closure Notes">
                    <TextAreaInput
                      rows={3}
                      value={closingRemarks}
                      onChange={(e) => setClosingRemarks(e.target.value)}
                      className="bg-white text-xs font-semibold"
                    />
                  </FormField>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModulePageShell>
  );
}
