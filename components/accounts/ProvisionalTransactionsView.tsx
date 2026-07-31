"use client";

import React, { useState, useMemo } from "react";
import {
  Clock,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Printer,
  Download,
  Search,
  Calendar,
  Filter,
  Loader2,
  FileText,
  AlertCircle,
  ArrowRightLeft,
  X,
  SlidersHorizontal,
  ChevronDown,
  RotateCcw,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  TextInput,
  StatMiniCard,
  Drawer,
  FODatePicker,
  formatINR,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import {
  sampleProvisionalData,
  sampleProvisionalCategories,
  sampleProvisionalVoucherTypes,
  ProvisionalTransaction,
} from "@/app/data/accounts/provisionalTransactionsData";
import { cn } from "@/lib/utils";

export function ProvisionalTransactionsView() {
  // Mobile Filter Drawer State
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Provisional Entry Form State
  const [vouchNo, setVouchNo] = useState("PRV-2026-0017");
  const [vouchDt, setVouchDt] = useState("2026-04-28");
  const [expiryDt, setExpiryDt] = useState("2026-05-05");
  const [category, setCategory] = useState<any>("Provision for Utilities");
  const [vouchType, setVouchType] = useState<any>("Provisional Journal");
  const [accountLedger, setAccountLedger] = useState("HEAT LIGHT POWER");
  const [partyName, setPartyName] = useState("State Electricity Distribution Board");
  const [drAmt, setDrAmt] = useState<number>(38000);
  const [crAmt, setCrAmt] = useState<number>(0);
  const [narration, setNarration] = useState(
    "Provisional accrual entry for estimated monthly utility power consumption"
  );

  // Provisional Transactions List & Filters
  const [transactions, setTransactions] = useState<ProvisionalTransaction[]>(
    sampleProvisionalData
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"<ALL>" | "Provisional" | "Converted to GL" | "Reversed">("<ALL>");

  // Loading & Toast Notification State
  const [isPosting, setIsPosting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Post New Provisional Entry
  const handlePostProvisional = (e: React.FormEvent) => {
    e.preventDefault();
    if (drAmt <= 0 && crAmt <= 0) {
      alert("Please enter a valid Debit or Credit amount greater than zero.");
      return;
    }

    setIsPosting(true);

    setTimeout(() => {
      const newEntry: ProvisionalTransaction = {
        id: `prv-${Date.now()}`,
        vouchNo: vouchNo,
        vouchDt: vouchDt,
        expiryDt: expiryDt,
        category: category,
        vouchType: vouchType,
        accountLedger: accountLedger,
        partyName: partyName || "General Provision",
        drAmt: Number(drAmt) || 0,
        crAmt: Number(crAmt) || 0,
        narration: narration,
        status: "Provisional",
      };

      setTransactions([newEntry, ...transactions]);
      setIsPosting(false);
      setToastMessage(
        `Provisional entry ${vouchNo} for ${formatINR(
          drAmt > 0 ? drAmt : crAmt
        )} created successfully.`
      );

      // Reset form
      setVouchNo(`PRV-2026-00${Math.floor(Math.random() * 90 + 18)}`);
      setDrAmt(0);
      setCrAmt(0);
      setNarration("");
    }, 400);
  };

  // Convert Provisional Entry to Permanent GL Voucher
  const handleConvert = (id: string, vNo: string) => {
    setTransactions(
      transactions.map((t) =>
        t.id === id ? { ...t, status: "Converted to GL" } : t
      )
    );
    setToastMessage(`Provisional Voucher ${vNo} converted to permanent General Ledger voucher.`);
  };

  // Reverse Provisional Entry
  const handleReverse = (id: string, vNo: string) => {
    setTransactions(
      transactions.map((t) => (t.id === id ? { ...t, status: "Reversed" } : t))
    );
    setToastMessage(`Provisional Voucher ${vNo} reversed successfully.`);
  };

  // Filtered Data
  const filteredData = useMemo(() => {
    return transactions.filter((item) => {
      if (statusFilter !== "<ALL>" && item.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.vouchNo.toLowerCase().includes(q) ||
          item.partyName.toLowerCase().includes(q) ||
          item.accountLedger.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [transactions, statusFilter, searchQuery]);

  // KPI Calculations
  const activeProvisionalTotal = useMemo(() => {
    return transactions
      .filter((t) => t.status === "Provisional")
      .reduce((sum, t) => sum + (t.drAmt > 0 ? t.drAmt : t.crAmt), 0);
  }, [transactions]);

  const accruedExpenseTotal = useMemo(() => {
    return transactions
      .filter(
        (t) =>
          t.status === "Provisional" &&
          (t.category === "Accrued Expenses" || t.category === "Provision for Utilities")
      )
      .reduce((sum, t) => sum + t.drAmt, 0);
  }, [transactions]);

  const unbilledRevenueTotal = useMemo(() => {
    return transactions
      .filter((t) => t.status === "Provisional" && t.category === "Unbilled Revenue")
      .reduce((sum, t) => sum + t.crAmt, 0);
  }, [transactions]);

  // Badge Styling Helper for Status
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Provisional":
        return "bg-amber-100 text-amber-900 border-amber-300";
      case "Converted to GL":
        return "bg-emerald-100 text-emerald-900 border-emerald-300";
      case "Reversed":
        return "bg-slate-100 text-slate-700 border-slate-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  return (
    <ModulePageShell
      eyebrow="Accounts & Period-End Accruals"
      title="Provisional Transactions"
      description="Post temporary accruals, unbilled revenue provisions, and estimated expenses prior to permanent GL audit posting."
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl text-xs font-medium bg-white shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Print List
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => alert("Provisional transactions exported to CSV.")}
            className="rounded-xl text-xs font-medium bg-white shadow-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export CSV
          </Button>
        </div>
      }
    >
      {/* KPI Cards Grid */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatMiniCard
          label="Active Provisional Entries"
          value={formatINR(activeProvisionalTotal)}
          sublabel="Pending period-end accruals"
          accent="#0284c7"
          icon={Clock}
        />
        <StatMiniCard
          label="Accrued Expense Provisions"
          value={formatINR(accruedExpenseTotal)}
          sublabel="Estimated utility & supplier bills"
          accent="#e11d48"
          icon={FileText}
        />
        <StatMiniCard
          label="Unbilled Revenue Provisions"
          value={formatINR(unbilledRevenueTotal)}
          sublabel="Provisional guest room settlements"
          accent="#16a34a"
          icon={CheckCircle2}
        />
      </div>

      {/* Provisional Voucher Entry Form Card */}
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 font-bold text-white text-xs shadow-2xs">
              <Clock className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                New Provisional Entry / Accrual
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Record temporary estimated provisions prior to final bill verification.
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200">
            <AlertCircle className="h-3.5 w-3.5 text-amber-700" />
            Provisional Mode: Excluded from Tax Statements until Converted
          </span>
        </div>

        {/* Entry Form Grid */}
        <form onSubmit={handlePostProvisional} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/70">
            <FormField label="Prov Voucher No">
              <TextInput
                value={vouchNo}
                onChange={(e) => setVouchNo(e.target.value)}
                readOnly
                className="h-8 text-xs font-bold bg-white text-blue-800 border-slate-200"
              />
            </FormField>

            <FormField label="Posting Date">
              <FODatePicker
                value={vouchDt}
                onChange={(val) => setVouchDt(val)}
              />
            </FormField>

            <FormField label="Target Expiry Date">
              <FODatePicker
                value={expiryDt}
                onChange={(val) => setExpiryDt(val)}
              />
            </FormField>

            <FormField label="Provision Category">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 font-semibold focus:border-blue-500 focus:outline-none"
              >
                {sampleProvisionalCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Voucher Type">
              <select
                value={vouchType}
                onChange={(e) => setVouchType(e.target.value)}
                className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 font-semibold focus:border-blue-500 focus:outline-none"
              >
                {sampleProvisionalVoucherTypes.map((vt) => (
                  <option key={vt} value={vt}>
                    {vt}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Account Ledger">
              <TextInput
                value={accountLedger}
                onChange={(e) => setAccountLedger(e.target.value)}
                placeholder="e.g. HEAT LIGHT POWER..."
                className="h-8 text-xs bg-white font-medium"
              />
            </FormField>

            <FormField label="Party / Sub-Ledger" className="sm:col-span-2">
              <TextInput
                list="prov-party-suggestions"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                placeholder="Select party or type vendor..."
                className="h-8 text-xs bg-white"
              />
            </FormField>

            <FormField label="Debit Amount (₹)">
              <input
                type="number"
                value={drAmt || ""}
                onChange={(e) => setDrAmt(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-right text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </FormField>

            <FormField label="Credit Amount (₹)">
              <input
                type="number"
                value={crAmt || ""}
                onChange={(e) => setCrAmt(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-right text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </FormField>

            <FormField label="Provisional Narration" className="sm:col-span-2">
              <TextInput
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                placeholder="Explain the purpose of this provisional entry..."
                className="h-8 text-xs bg-white"
              />
            </FormField>
          </div>

          <datalist id="prov-party-suggestions">
            <option value="State Electricity Distribution Board" />
            <option value="Infosys Ltd" />
            <option value="Fresh Foods Supplies Ltd" />
            <option value="Mehta & Associates Statutory Auditors" />
            <option value="CleanLinen Laundry Co." />
            <option value="HVAC Elevator Services" />
          </datalist>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setDrAmt(0);
                setCrAmt(0);
                setNarration("");
              }}
              className="rounded-xl text-xs font-semibold bg-white"
            >
              Clear Form
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={isPosting}
              className="rounded-xl font-bold text-xs px-4 shadow-sm text-white bg-blue-700 hover:bg-blue-800 cursor-pointer disabled:opacity-75"
            >
              {isPosting ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Clock className="h-3.5 w-3.5 mr-1" />
              )}
              Post Provisional Entry
            </Button>
          </div>
        </form>
      </section>

      {/* Provisional Entries Audit & Conversion Table */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Provisional Transactions Audit Log
            </h2>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
              {(["<ALL>", "Provisional", "Converted to GL", "Reversed"] as const).map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={cn(
                      "px-2.5 py-1 rounded-md transition-all cursor-pointer select-none",
                      statusFilter === st
                        ? "bg-white text-slate-900 shadow-2xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    {st}
                  </button>
                )
              )}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search prov #, party or ledger..."
                className="h-8 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Desktop Table (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="px-3.5 py-2.5">Prov Vouch #</th>
                <th className="px-3 py-2.5">Date</th>
                <th className="px-3 py-2.5">Category</th>
                <th className="px-3.5 py-2.5">Account / Party</th>
                <th className="px-3.5 py-2.5 text-right">Debit (₹)</th>
                <th className="px-3.5 py-2.5 text-right">Credit (₹)</th>
                <th className="px-3.5 py-2.5 text-center">Status</th>
                <th className="px-3.5 py-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredData.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-3.5 py-2.5 font-bold text-slate-900">{row.vouchNo}</td>
                  <td className="px-3 py-2.5 text-slate-600 font-medium">
                    {row.vouchDt}
                    <span className="block text-[10px] text-slate-400">Exp: {row.expiryDt}</span>
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-slate-700">{row.category}</td>
                  <td className="px-3.5 py-2.5 font-semibold text-slate-900">
                    {row.partyName}
                    <span className="block text-[10px] text-slate-400 font-normal">
                      {row.accountLedger}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-slate-900">
                    {row.drAmt > 0 ? formatINR(row.drAmt) : "-"}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-slate-900">
                    {row.crAmt > 0 ? formatINR(row.crAmt) : "-"}
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    <span
                      className={cn(
                        "inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                        getStatusBadgeClass(row.status)
                      )}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    {row.status === "Provisional" ? (
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleConvert(row.id, row.vouchNo)}
                          className="h-6 px-2 text-[10px] font-bold bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 rounded-md"
                          title="Convert to Permanent GL Voucher"
                        >
                          <Check className="h-3 w-3 mr-0.5" /> Convert to GL
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleReverse(row.id, row.vouchNo)}
                          className="h-6 px-2 text-[10px] font-bold bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 rounded-md"
                          title="Reverse Provision"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Card View (md:hidden) */}
        <div className="md:hidden space-y-2.5">
          {filteredData.map((row) => (
            <div
              key={row.id}
              className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">{row.vouchNo}</span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                    getStatusBadgeClass(row.status)
                  )}
                >
                  {row.status}
                </span>
              </div>

              <p className="text-xs font-semibold text-slate-900">{row.partyName}</p>
              <p className="text-[11px] text-slate-500">{row.accountLedger} • {row.category}</p>

              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100">
                <span className="text-slate-500 font-medium">{row.vouchDt}</span>
                <span className="font-bold text-slate-900">
                  {row.drAmt > 0 ? `Dr ${formatINR(row.drAmt)}` : `Cr ${formatINR(row.crAmt)}`}
                </span>
              </div>

              {row.status === "Provisional" && (
                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleConvert(row.id, row.vouchNo)}
                    className="h-7 text-xs font-bold bg-emerald-50 text-emerald-800 border-emerald-300 w-full justify-center"
                  >
                    <Check className="h-3.5 w-3.5 mr-1" /> Convert to GL
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </ModulePageShell>
  );
}
