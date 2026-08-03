"use client";

import React, { useState, useMemo } from "react";
import {
  RotateCcw,
  Calendar,
  Building2,
  CheckCircle2,
  Save,
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
  Lock,
  Unlock,
  AlertTriangle,
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

export interface ClosedFYReversingRecord {
  id: string;
  fyName: string;
  companyCode: string;
  companyName: string;
  startDate: string;
  endDate: string;
  status: "Closed & Locked" | "Reopened for Audit" | "Archived";
  netProfitLoss: number;
  closingVoucherNo: string;
  retainedEarningsLedger: string;
  closedBy: string;
  closedDate: string;
  reversalReason?: string;
  reversalDate?: string;
  reversedBy?: string;
}

export const sampleClosedFYReversingRecords: ClosedFYReversingRecord[] = [
  {
    id: "fy-2025-26",
    fyName: "FY 2025-2026",
    companyCode: "CMP-001",
    companyName: "LUXY HOTEL & RESORTS PRIVATE LIMITED",
    startDate: "01/04/2025",
    endDate: "31/03/2026",
    status: "Closed & Locked",
    netProfitLoss: 38250000.0,
    closingVoucherNo: "YEC-2026-001",
    retainedEarningsLedger: "3100 - Retained Earnings & Reserves A/c",
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
    status: "Reopened for Audit",
    netProfitLoss: 29500000.0,
    closingVoucherNo: "YEC-2025-001",
    retainedEarningsLedger: "3100 - Retained Earnings & Reserves A/c",
    closedBy: "System Migration",
    closedDate: "31/03/2025 23:59",
    reversalReason: "Statutory Tax Audit Prior-Period Depreciation Adjustment",
    reversalDate: "15/05/2025 11:30",
    reversedBy: "Abhijit Suthar (Senior Controller)",
  },
];

export function ClosedFiscalYearReversingView() {
  // Records State
  const [records, setRecords] = useState<ClosedFYReversingRecord[]>(sampleClosedFYReversingRecords);
  const [selectedId, setSelectedId] = useState<string>(sampleClosedFYReversingRecords[0].id);
  const [searchQuery, setSearchQuery] = useState("");

  // Selected Record
  const activeRecord = useMemo(
    () => records.find((r) => r.id === selectedId) || records[0],
    [records, selectedId]
  );

  // Form State
  const [formData, setFormData] = useState<ClosedFYReversingRecord>(activeRecord);

  // Sectional Tab ('setup' | 'periods' | 'vouchers' | 'security')
  const [activeTab, setActiveTab] = useState<"setup" | "periods" | "vouchers" | "security">("setup");

  // Reversal Parameters
  const [reversalReasonType, setReversalReasonType] = useState("Statutory Audit Adjustment");
  const [reopenScope, setReopenScope] = useState("Audit Adjustment Only");
  const [autoRelockDays, setAutoRelockDays] = useState("7 Days");
  const [seniorPasscode, setSeniorPasscode] = useState("");
  const [auditRefId, setAuditRefId] = useState("AUD-REV-2026-094");
  const [reversalNotes, setReversalNotes] = useState(
    "Authorized reversal of Year-End Closing Journal Entry YEC-2026-001 to facilitate statutory audit adjustment postings."
  );

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync Form State
  React.useEffect(() => {
    setFormData({ ...activeRecord });
  }, [activeRecord]);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          r.fyName.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q) ||
          r.closingVoucherNo.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [records, searchQuery]);

  // Execute Reversal Action
  const handleExecuteReversal = () => {
    if (!seniorPasscode) {
      setToastMessage("ERROR: Please enter the Senior Controller security passcode to execute reversal.");
      return;
    }

    if (formData.status === "Reopened for Audit") {
      setToastMessage(`Fiscal year '${formData.fyName}' is already reopened for audit adjustment.`);
      return;
    }

    const updated = {
      ...formData,
      status: "Reopened for Audit" as const,
      reversalReason: `${reversalReasonType}: ${reversalNotes}`,
      reversalDate: "Today at 13:15",
      reversedBy: "Abhijit Suthar (Senior Controller)",
    };

    setRecords((prev) => prev.map((r) => (r.id === formData.id ? updated : r)));
    setFormData(updated);
    setToastMessage(
      `SUCCESS: Reversed year-end closing entry ${formData.closingVoucherNo} for ${formData.fyName}. FY is now Reopened for Audit.`
    );
  };

  // Reset Parameters
  const handleReset = () => {
    setFormData({ ...activeRecord });
    setSeniorPasscode("");
    setToastMessage("Reset reversal parameters to default state.");
  };

  // Export CSV Audit Report
  const handleExportCSV = () => {
    const csvHeader = "FYName,Company,ClosingVoucher,Status,NetProfitLoss,ReversedBy,ReversalDate,Reason\n";
    const csvRows = filteredRecords
      .map(
        (r) =>
          `"${r.fyName}","${r.companyName}","${r.closingVoucherNo}","${r.status}","${r.netProfitLoss}","${r.reversedBy || "N/A"}","${r.reversalDate || "N/A"}","${r.reversalReason || "N/A"}"`
      )
      .join("\n");
    const blob = new Blob([csvHeader + csvRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Closed_FY_Reversal_Audit_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMessage("Exported Closed FY Reversal log report to CSV.");
  };

  return (
    <ModulePageShell
      eyebrow="Accounts & Masters"
      title="Closed Fiscal Year Reversing"
      description="Reverse year-end closing entries, unlock closed financial years, and enable authorized prior-year audit adjustments."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Masters", href: "/accounts/masters" },
        { label: "Closed Fiscal Year Reversing" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleExecuteReversal}
            className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Execute FY Reversal
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setToastMessage("Saved reversal draft parameters.")}
            className="rounded-xl text-xs font-bold bg-white text-slate-800 border-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5 mr-1 text-emerald-600" />
            Save Draft
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1 text-slate-500" />
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
            Print Audit Trail
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
              Target FY: {formData.fyName}
            </span>

            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3 py-1 font-bold border",
                formData.status === "Closed & Locked"
                  ? "bg-rose-50 text-rose-800 border-rose-200"
                  : "bg-amber-50 text-amber-900 border-amber-200"
              )}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Status: {formData.status}
            </span>
          </div>
        </div>
      </div>

      {/* Main Split Layout: 35% Left Closed FY Selection / 65% Right Reversal Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6 font-sans text-xs">
        {/* LEFT PANEL (35% Desktop / 40% Tablet / 100% Mobile) - Closed FY List */}
        <div className="md:col-span-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col min-h-[620px]">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-emerald-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Closed Fiscal Years ({filteredRecords.length})
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              Reversal History
            </span>
          </div>

          {/* Quick Search */}
          <div className="mb-3 relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Closed FY name, voucher..."
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
                        item.status === "Closed & Locked" && "bg-rose-100 text-rose-800 border-rose-200",
                        item.status === "Reopened for Audit" && "bg-amber-100 text-amber-900 border-amber-200"
                      )}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px]">
                    <span className="font-bold text-slate-800 font-mono">
                      Voucher: {item.closingVoucherNo}
                    </span>
                    <span className="font-mono text-emerald-800 font-bold">
                      {formatINR(item.netProfitLoss)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL (65% Desktop / 60% Tablet / 100% Mobile) - Reversal Setup */}
        <div className="md:col-span-8 space-y-4">
          {/* Top Overview Metrics Cards */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono font-bold text-xs text-slate-500 block">
                  {formData.companyCode} • {formData.companyName}
                </span>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>{formData.fyName} Reversal Parameters</span>
                  <span className="text-xs font-semibold text-slate-500">
                    (Voucher: {formData.closingVoucherNo})
                  </span>
                </h2>
              </div>

              <span
                className={cn(
                  "px-3 py-1 rounded-xl text-xs font-bold border",
                  formData.status === "Reopened for Audit"
                    ? "bg-amber-50 text-amber-900 border-amber-200"
                    : "bg-rose-50 text-rose-800 border-rose-200"
                )}
              >
                {formData.status}
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Target Closed FY</span>
                <span className="text-xs font-mono font-bold text-slate-900 mt-0.5 block">
                  {formData.fyName}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Year-End Voucher</span>
                <span className="text-xs font-mono font-bold text-emerald-800 mt-0.5 block">
                  {formData.closingVoucherNo}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Transferred Net Balance</span>
                <span className="text-xs font-mono font-extrabold text-emerald-800 mt-0.5 block">
                  {formatINR(formData.netProfitLoss)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Security Override</span>
                <span className="text-xs font-mono font-bold text-amber-700 mt-0.5 block">
                  Senior Controller
                </span>
              </div>
            </div>
          </div>

          {/* Section Navigation Tabs (IDENTICAL TO COMPANY SETTINGS & PARTY MASTER TAB BAR) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xs flex border-b border-slate-200 overflow-x-auto gap-1">
            {[
              { id: "setup", label: "Reversal Setup & Target FY", icon: RotateCcw },
              { id: "periods", label: "Period Reopening Scope", icon: Unlock },
              { id: "vouchers", label: "Reversing Voucher Preview", icon: SlidersHorizontal },
              { id: "security", label: "Security & Authorization", icon: KeyRound },
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
            {/* 🔄 TAB 1: REVERSAL SETUP & TARGET FY */}
            {activeTab === "setup" && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <RotateCcw className="h-4 w-4 text-emerald-600" />
                    Target Year-End Closing Entry Reversal
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Target Closed Fiscal Year" required>
                      <SelectInput
                        value={formData.fyName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, fyName: e.target.value }))}
                        className="bg-white font-bold text-slate-900 h-9"
                      >
                        <option value="FY 2025-2026">FY 2025-2026 (Closed on 31/03/2026)</option>
                        <option value="FY 2024-2025">FY 2024-2025 (Closed on 31/03/2025)</option>
                      </SelectInput>
                    </FormField>

                    <FormField label="Closing Voucher ID to Reverse">
                      <TextInput
                        value={formData.closingVoucherNo}
                        readOnly
                        className="bg-slate-100 font-mono font-bold text-slate-800 h-9"
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Retained Earnings Account">
                      <TextInput
                        value={formData.retainedEarningsLedger}
                        readOnly
                        className="bg-slate-100 font-semibold h-9"
                      />
                    </FormField>

                    <FormField label="Reversal Reason Category" required>
                      <SelectInput
                        value={reversalReasonType}
                        onChange={(e) => setReversalReasonType(e.target.value)}
                        className="bg-white font-bold text-slate-900 h-9"
                      >
                        <option value="Statutory Audit Adjustment">Statutory Audit Adjustment</option>
                        <option value="Tax Assessment Opening Correction">Tax Assessment Opening Correction</option>
                        <option value="Prior Period Error Correction">Prior Period Error Correction</option>
                      </SelectInput>
                    </FormField>
                  </div>
                </div>
              </div>
            )}

            {/* 🔓 TAB 2: PERIOD REOPENING SCOPE */}
            {activeTab === "periods" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <Unlock className="h-4 w-4 text-emerald-600" />
                    Period Unlocking & Auto-Relock Parameters
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Reopening Scope Mode">
                      <SelectInput
                        value={reopenScope}
                        onChange={(e) => setReopenScope(e.target.value)}
                        className="bg-white font-semibold h-9"
                      >
                        <option value="Audit Adjustment Only">Audit Adjustment Only (Restricted Ledgers)</option>
                        <option value="Full Transaction Posting">Full Transaction Posting (All Ledgers)</option>
                      </SelectInput>
                    </FormField>

                    <FormField label="Automatic Re-Lock Schedule">
                      <SelectInput
                        value={autoRelockDays}
                        onChange={(e) => setAutoRelockDays(e.target.value)}
                        className="bg-white font-semibold h-9"
                      >
                        <option value="7 Days">Re-Lock Automatically After 7 Days</option>
                        <option value="14 Days">Re-Lock Automatically After 14 Days</option>
                        <option value="Manual">Manual Relock Only</option>
                      </SelectInput>
                    </FormField>
                  </div>
                </div>
              </div>
            )}

            {/* 📜 TAB 3: REVERSING VOUCHER PREVIEW */}
            {activeTab === "vouchers" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
                    Reversing Journal Voucher Draft (REV-{formData.closingVoucherNo})
                  </h3>

                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 font-mono text-[11px] text-slate-800 space-y-2">
                    <div className="flex justify-between border-b border-slate-200 pb-1.5 font-bold">
                      <span>Voucher: REV-{formData.closingVoucherNo}</span>
                      <span>Type: Year-End Reversal Journal</span>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="text-rose-700 font-bold">
                        DR: {formData.retainedEarningsLedger} — {formatINR(formData.netProfitLoss)}
                      </div>
                      <div className="text-emerald-700 font-bold">
                        CR: Profit & Loss Net Clearing Ledger — {formatINR(formData.netProfitLoss)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 🛡️ TAB 4: SECURITY & AUTHORIZATION */}
            {activeTab === "security" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-emerald-600" />
                    Senior Financial Controller Passcode Authorization
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Senior Controller Security Passcode" required>
                      <TextInput
                        type="password"
                        value={seniorPasscode}
                        onChange={(e) => setSeniorPasscode(e.target.value)}
                        placeholder="Enter passcode to authorize..."
                        className="bg-white font-mono h-9"
                      />
                    </FormField>

                    <FormField label="Audit Reference ID">
                      <TextInput
                        value={auditRefId}
                        onChange={(e) => setAuditRefId(e.target.value)}
                        className="bg-white font-mono font-bold h-9"
                      />
                    </FormField>
                  </div>

                  <FormField label="Reversal Justification Notes" required>
                    <TextAreaInput
                      rows={3}
                      value={reversalNotes}
                      onChange={(e) => setReversalNotes(e.target.value)}
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
