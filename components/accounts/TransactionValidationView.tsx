"use client";

import React, { useState, useMemo } from "react";
import {
  ShieldAlert,
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
  Trash2,
  CheckSquare,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  SelectInput,
  TextInput,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import {
  sampleTransactionValidationMatrixData,
  TransactionValidationMatrix,
} from "@/app/data/accounts/transactionValidationData";
import { cn } from "@/lib/utils";

export function TransactionValidationView() {
  // Master Matrix State
  const [matrixList, setMatrixList] = useState<TransactionValidationMatrix[]>(
    sampleTransactionValidationMatrixData
  );

  // Selected Transaction Type
  const [selectedTxType, setSelectedTxType] = useState<string>(
    sampleTransactionValidationMatrixData[0].transactionType
  );

  // Active Record
  const activeRecord = useMemo(
    () =>
      matrixList.find((m) => m.transactionType === selectedTxType) ||
      matrixList[0],
    [matrixList, selectedTxType]
  );

  // Editable State for active record
  const [formData, setFormData] = useState<TransactionValidationMatrix>(activeRecord);

  // Account Lookup Modal State
  const [targetQuadrant, setTargetQuadrant] = useState<
    "drAllow" | "drNotAllow" | "crAllow" | "crNotAllow" | null
  >(null);
  const [accountSearchQuery, setAccountSearchQuery] = useState("");

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sample GL Accounts
  const sampleGLAccounts = [
    "1010 - Main Cash In Hand A/c",
    "1020 - HDFC Bank Operations A/c",
    "1030 - ICICI Bank Collection A/c",
    "1100 - Guest Ledger Control A/c",
    "1200 - City Ledger Control A/c",
    "2100 - Sundry Creditors Control A/c",
    "4100 - F&B Revenue Control A/c",
    "4200 - Spa Revenue Control A/c",
    "5100 - A&G Expense Control A/c",
    "5200 - Maintenance Control A/c",
  ];

  // Sync Form Data on selected type change
  React.useEffect(() => {
    setFormData({ ...activeRecord });
  }, [activeRecord]);

  // Save Action
  const handleSave = () => {
    setMatrixList((prev) =>
      prev.map((m) =>
        m.transactionType === formData.transactionType
          ? { ...formData, updateDate: "24-July-2026" }
          : m
      )
    );
    setToastMessage(
      `Saved Transaction Validation matrix for ${formData.transactionType} successfully!`
    );
  };

  // Refresh Action
  const handleRefresh = () => {
    setFormData({ ...activeRecord });
    setToastMessage("Refreshed validation matrix to saved settings.");
  };

  // Export CSV
  const handleExportCSV = () => {
    const csvHeader = "TransactionType,DrAllow,DrNotAllow,CrAllow,CrNotAllow\n";
    const csvRows = matrixList
      .map(
        (m) =>
          `"${m.transactionType}","${m.drAllowAccounts.join("; ")}","${m.drNotAllowAccounts.join("; ")}","${m.crAllowAccounts.join("; ")}","${m.crNotAllowAccounts.join("; ")}"`
      )
      .join("\n");
    const blob = new Blob([csvHeader + csvRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Transaction_Validation_Matrix_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMessage("Exported Transaction Validation matrix to CSV.");
  };

  // Add Account to Quadrant
  const handleAddAccountToQuadrant = (acc: string) => {
    if (!targetQuadrant) return;
    setFormData((prev) => {
      const fieldMap = {
        drAllow: "drAllowAccounts",
        drNotAllow: "drNotAllowAccounts",
        crAllow: "crAllowAccounts",
        crNotAllow: "crNotAllowAccounts",
      } as const;

      const key = fieldMap[targetQuadrant];
      const currentList = prev[key];
      if (currentList.includes(acc)) return prev;

      return {
        ...prev,
        [key]: [...currentList, acc],
      };
    });
    setTargetQuadrant(null);
  };

  // Remove Account from Quadrant
  const handleRemoveAccount = (
    quadrant: "drAllowAccounts" | "drNotAllowAccounts" | "crAllowAccounts" | "crNotAllowAccounts",
    index: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [quadrant]: prev[quadrant].filter((_, i) => i !== index),
    }));
  };

  // Clear All Accounts from Quadrant
  const handleClearQuadrant = (
    quadrant: "drAllowAccounts" | "drNotAllowAccounts" | "crAllowAccounts" | "crNotAllowAccounts"
  ) => {
    setFormData((prev) => ({
      ...prev,
      [quadrant]: [],
    }));
  };

  return (
    <ModulePageShell
      eyebrow="Accounts & Masters"
      title="Transaction Validation"
      description="Set Debit (Dr) and Credit (Cr) Allowed and Not Allowed General Ledger accounts per Transaction Type."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Masters", href: "/accounts/masters" },
        { label: "Transaction Validation" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            Save
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Refresh
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Report
          </Button>
        </div>
      }
    >
      {/* Top Selector Bar */}
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <ShieldAlert className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="flex-1 max-w-md">
              <span className="font-bold text-xs text-slate-600 block">Transaction Type:</span>
              <select
                value={selectedTxType}
                onChange={(e) => setSelectedTxType(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
              >
                {matrixList.map((m) => (
                  <option key={m.transactionType} value={m.transactionType}>
                    {m.transactionType}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-slate-700 border border-slate-200 font-mono">
              Dr Rules: {formData.drAllowAccounts.length} Allowed / {formData.drNotAllowAccounts.length} Blocked
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-slate-700 border border-slate-200 font-mono">
              Cr Rules: {formData.crAllowAccounts.length} Allowed / {formData.crNotAllowAccounts.length} Blocked
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Card: EXACT 4 Quadrants matching WINHMS Image 3 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs font-sans text-xs space-y-6">
        {/* DR SIDE SECTION */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold font-mono rounded text-xs">
              Dr Side
            </span>
            <h3 className="font-bold text-sm text-slate-900">Debit Side Validation Rules</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dr Side -> Allow Quadrant */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
              <div className="flex items-center justify-between bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                <span className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
                  <CheckSquare className="h-4 w-4 text-emerald-600" />
                  Allow (Debit Allowed Accounts)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setTargetQuadrant("drAllow")}
                    className="p-1 hover:bg-white rounded text-slate-700 font-bold border border-slate-200 cursor-pointer"
                    title="Add GL Account"
                  >
                    🔍
                  </button>
                  <button
                    onClick={() => handleClearQuadrant("drAllowAccounts")}
                    className="p-1 hover:bg-rose-50 rounded text-rose-600 font-bold border border-slate-200 cursor-pointer"
                    title="Clear All"
                  >
                    ❌
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 min-h-[140px] max-h-[200px] overflow-y-auto p-2 space-y-1">
                {formData.drAllowAccounts.length === 0 ? (
                  <span className="text-slate-400 font-semibold italic block text-center pt-8">
                    No Debit Allowed account restriction added (All allowed by default).
                  </span>
                ) : (
                  formData.drAllowAccounts.map((acc, idx) => (
                    <div
                      key={acc}
                      className="flex items-center justify-between p-2 rounded-md bg-slate-50 hover:bg-emerald-50 text-slate-800 font-bold border border-slate-200"
                    >
                      <span>{acc}</span>
                      <button
                        onClick={() => handleRemoveAccount("drAllowAccounts", idx)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Dr Side -> Not Allow Quadrant */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
              <div className="flex items-center justify-between bg-rose-50 p-2 rounded-lg border border-rose-200">
                <span className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 text-rose-600" />
                  Not Allow (Debit Blocked Accounts)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setTargetQuadrant("drNotAllow")}
                    className="p-1 hover:bg-white rounded text-slate-700 font-bold border border-slate-200 cursor-pointer"
                    title="Add GL Account"
                  >
                    🔍
                  </button>
                  <button
                    onClick={() => handleClearQuadrant("drNotAllowAccounts")}
                    className="p-1 hover:bg-rose-50 rounded text-rose-600 font-bold border border-slate-200 cursor-pointer"
                    title="Clear All"
                  >
                    ❌
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 min-h-[140px] max-h-[200px] overflow-y-auto p-2 space-y-1">
                {formData.drNotAllowAccounts.length === 0 ? (
                  <span className="text-slate-400 font-semibold italic block text-center pt-8">
                    No Debit Blocked accounts assigned.
                  </span>
                ) : (
                  formData.drNotAllowAccounts.map((acc, idx) => (
                    <div
                      key={acc}
                      className="flex items-center justify-between p-2 rounded-md bg-slate-50 hover:bg-rose-50 text-slate-800 font-bold border border-slate-200"
                    >
                      <span>{acc}</span>
                      <button
                        onClick={() => handleRemoveAccount("drNotAllowAccounts", idx)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CR SIDE SECTION */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold font-mono rounded text-xs">
              Cr Side
            </span>
            <h3 className="font-bold text-sm text-slate-900">Credit Side Validation Rules</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cr Side -> Allow Quadrant */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
              <div className="flex items-center justify-between bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                <span className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
                  <CheckSquare className="h-4 w-4 text-emerald-600" />
                  Allow (Credit Allowed Accounts)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setTargetQuadrant("crAllow")}
                    className="p-1 hover:bg-white rounded text-slate-700 font-bold border border-slate-200 cursor-pointer"
                    title="Add GL Account"
                  >
                    🔍
                  </button>
                  <button
                    onClick={() => handleClearQuadrant("crAllowAccounts")}
                    className="p-1 hover:bg-rose-50 rounded text-rose-600 font-bold border border-slate-200 cursor-pointer"
                    title="Clear All"
                  >
                    ❌
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 min-h-[140px] max-h-[200px] overflow-y-auto p-2 space-y-1">
                {formData.crAllowAccounts.length === 0 ? (
                  <span className="text-slate-400 font-semibold italic block text-center pt-8">
                    No Credit Allowed account restriction added (All allowed by default).
                  </span>
                ) : (
                  formData.crAllowAccounts.map((acc, idx) => (
                    <div
                      key={acc}
                      className="flex items-center justify-between p-2 rounded-md bg-slate-50 hover:bg-emerald-50 text-slate-800 font-bold border border-slate-200"
                    >
                      <span>{acc}</span>
                      <button
                        onClick={() => handleRemoveAccount("crAllowAccounts", idx)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Cr Side -> Not Allow Quadrant */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
              <div className="flex items-center justify-between bg-rose-50 p-2 rounded-lg border border-rose-200">
                <span className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 text-rose-600" />
                  Not Allow (Credit Blocked Accounts)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setTargetQuadrant("crNotAllow")}
                    className="p-1 hover:bg-white rounded text-slate-700 font-bold border border-slate-200 cursor-pointer"
                    title="Add GL Account"
                  >
                    🔍
                  </button>
                  <button
                    onClick={() => handleClearQuadrant("crNotAllowAccounts")}
                    className="p-1 hover:bg-rose-50 rounded text-rose-600 font-bold border border-slate-200 cursor-pointer"
                    title="Clear All"
                  >
                    ❌
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 min-h-[140px] max-h-[200px] overflow-y-auto p-2 space-y-1">
                {formData.crNotAllowAccounts.length === 0 ? (
                  <span className="text-slate-400 font-semibold italic block text-center pt-8">
                    No Credit Blocked accounts assigned.
                  </span>
                ) : (
                  formData.crNotAllowAccounts.map((acc, idx) => (
                    <div
                      key={acc}
                      className="flex items-center justify-between p-2 rounded-md bg-slate-50 hover:bg-rose-50 text-slate-800 font-bold border border-slate-200"
                    >
                      <span>{acc}</span>
                      <button
                        onClick={() => handleRemoveAccount("crNotAllowAccounts", idx)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* WINHMS Exact Bottom Audit Box */}
        <div className="pt-4 border-t border-slate-200 text-slate-500 font-mono text-[11px] flex justify-end">
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1 min-w-[200px]">
            <div>
              Update By : <strong className="text-slate-800">{formData.updateBy}</strong>
            </div>
            <div>
              Date : <strong className="text-slate-800">{formData.updateDate}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* GL Account Lookup Modal */}
      {targetQuadrant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-5 space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">
                Add Account to {targetQuadrant.includes("dr") ? "Dr Side" : "Cr Side"}{" "}
                {targetQuadrant.includes("Allow") && !targetQuadrant.includes("Not") ? "Allow" : "Not Allow"}
              </h3>
              <button
                onClick={() => setTargetQuadrant(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={accountSearchQuery}
                onChange={(e) => setAccountSearchQuery(e.target.value)}
                placeholder="Search GL Ledger Account..."
                className="h-8 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {sampleGLAccounts
                .filter((acc) => acc.toLowerCase().includes(accountSearchQuery.toLowerCase()))
                .map((acc) => (
                  <div
                    key={acc}
                    onClick={() => handleAddAccountToQuadrant(acc)}
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-emerald-50 hover:border-emerald-400 cursor-pointer font-bold text-slate-800 flex items-center justify-between"
                  >
                    <span>{acc}</span>
                    <Plus className="h-4 w-4 text-emerald-600" />
                  </div>
                ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTargetQuadrant(null)}
                className="rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </ModulePageShell>
  );
}
