"use client";

import React, { useState, useMemo } from "react";
import {
  BookOpen,
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
  CheckSquare,
  FileText,
  Eye,
  Users,
  CreditCard,
  Building,
  DollarSign,
  AlertCircle,
  FileCheck2,
  Clock,
  Landmark,
  Layers,
  Filter,
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
  sampleDayBookVouchers,
  sampleDayBookSummaryData,
  DayBookVoucher,
} from "@/app/data/accounts/dayBookData";
import { cn } from "@/lib/utils";

export function DayBookView() {
  // Selected Date State
  const [selectedDate, setSelectedDate] = useState("04/08/2026");

  // Filters State
  const [voucherTypeFilter, setVoucherTypeFilter] = useState("All");
  const [divisionFilter, setDivisionFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Inspect Voucher Modal State
  const [inspectVoucher, setInspectVoucher] = useState<DayBookVoucher | null>(
    null
  );

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Vouchers List Reference
  const vouchersList = sampleDayBookVouchers;
  const summary = sampleDayBookSummaryData;

  // Filtered Vouchers List
  const filteredVouchers = useMemo(() => {
    return vouchersList.filter((v) => {
      if (voucherTypeFilter !== "All" && v.voucherType !== voucherTypeFilter) {
        return false;
      }
      if (divisionFilter !== "All" && v.division !== divisionFilter) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          v.voucherNo.toLowerCase().includes(q) ||
          v.primaryAccount.toLowerCase().includes(q) ||
          v.refNo.toLowerCase().includes(q) ||
          v.lines.some(
            (l) =>
              l.glAccountName.toLowerCase().includes(q) ||
              l.particulars.toLowerCase().includes(q)
          )
        );
      }
      return true;
    });
  }, [vouchersList, voucherTypeFilter, divisionFilter, searchQuery]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalCount = filteredVouchers.length;
    const totalVolume = filteredVouchers.reduce((sum, v) => sum + v.totalDebit, 0);
    return { totalCount, totalVolume };
  }, [filteredVouchers]);

  // Export CSV Action
  const handleExportCSV = () => {
    const csvHeader =
      "VoucherDate,VoucherTime,VoucherNo,VoucherType,PrimaryAccount,RefNo,TotalDebitINR,TotalCreditINR,CreatedBy,Division\n";
    const csvRows = filteredVouchers
      .map(
        (v) =>
          `"${v.voucherDate}","${v.voucherTime}","${v.voucherNo}","${v.voucherType}","${v.primaryAccount}","${v.refNo}","${v.totalDebit}","${v.totalCredit}","${v.createdBy}","${v.division}"`
      )
      .join("\n");

    const blob = new Blob([csvHeader + csvRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `WINHMS_Day_Book_${selectedDate.replace(/\//g, "-")}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMessage("Exported Day Book transaction register to CSV.");
  };

  return (
    <ModulePageShell
      eyebrow="Accounts & Reports"
      title="Day Book"
      description="Chronological daily transaction register of all General Ledger vouchers, debit/credit postings, and cash/bank summary."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Reports", href: "/accounts/reports" },
        { label: "Day Book" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => setToastMessage(`Fetched Day Book register for ${selectedDate}.`)}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            <BookOpen className="h-3.5 w-3.5 mr-1" />
            Fetch Day Book
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setToastMessage("Saved Day Book view parameters.")}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Save Options
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Print Register
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export CSV
          </Button>
        </div>
      }
    >
      {/* Top Active Target Entity & Date Selector Bar */}
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <Building2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="flex-1 max-w-sm">
              <span className="font-bold text-xs text-slate-600 block">Target Company Entity:</span>
              <select
                value="HOTEL & RESORTS PRIVATE LIMITED"
                onChange={() => {}}
                className="h-8 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
              >
                <option value="HOTEL & RESORTS PRIVATE LIMITED">
                  HOTEL & RESORTS PRIVATE LIMITED (CMP-001)
                </option>
              </select>
            </div>

            <div className="w-44">
              <span className="font-bold text-xs text-slate-600 block">Selected Register Date:</span>
              <FODatePicker value={selectedDate} onChange={setSelectedDate} placeholder="DD/MM/YYYY" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1 text-emerald-800 border border-emerald-200 font-bold">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
              {metrics.totalCount} Vouchers Posted Today
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-slate-700 border border-slate-200 font-mono">
              <BookOpen className="h-3.5 w-3.5 text-slate-600" />
              Daily Volume: {formatINR(metrics.totalVolume)}
            </span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Voucher Type Filter */}
          <FormField label="Voucher Type Filter">
            <SelectInput
              value={voucherTypeFilter}
              onChange={(e) => setVoucherTypeFilter(e.target.value)}
              className="bg-white font-bold h-8 text-xs"
            >
              <option value="All">All Voucher Types</option>
              <option value="JV">Journal Voucher (JV)</option>
              <option value="PV">Payment Voucher (PV)</option>
              <option value="RV">Receipt Voucher (RV)</option>
              <option value="CV">Contra Voucher (CV)</option>
            </SelectInput>
          </FormField>

          {/* Division Filter */}
          <FormField label="Division Filter">
            <SelectInput
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value)}
              className="bg-white font-bold h-8 text-xs"
            >
              <option value="All">All Property Divisions</option>
              <option value="Rooms Division">Rooms Division</option>
              <option value="Food & Beverage">Food & Beverage</option>
              <option value="Administrative & General">Administrative & General</option>
              <option value="Property Operations & Maintenance">
                Property Operations & Maintenance
              </option>
            </SelectInput>
          </FormField>

          {/* Keyword Search */}
          <FormField label="Search Register Keyword">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Voucher #, Account, Ref #..."
                className="h-8 w-full rounded-xl border border-slate-300 bg-white pl-8 pr-3 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </FormField>
        </div>
      </div>

      {/* Metrics Overview Strip (4 Stat Mini-Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatMiniCard
          label="Total Vouchers Posted"
          value={`${metrics.totalCount} Vouchers`}
          icon={FileText}
        />
        <StatMiniCard
          label="Total Daily Debit / Credit"
          value={formatINR(metrics.totalVolume)}
          icon={DollarSign}
        />
        <StatMiniCard
          label="Cash Closing Balance"
          value={formatINR(summary.cashClosing)}
          sublabel="Till & Main Cash"
          icon={DollarSign}
        />
        <StatMiniCard
          label="Bank Closing Balance"
          value={formatINR(summary.bankClosing)}
          sublabel="HDFC / ICICI Accounts"
          icon={Landmark}
        />
      </div>

      {/* Day Book Detailed Register Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs font-sans text-xs space-y-4 mb-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-emerald-600" />
            Chronological Daily Register Entries ({filteredVouchers.length} Vouchers)
          </h3>
          <span className="font-mono text-[11px] text-slate-500 font-semibold">
            Date: {selectedDate}
          </span>
        </div>

        <div className="space-y-4">
          {filteredVouchers.length === 0 ? (
            <div className="py-8 text-center text-slate-400 font-semibold italic border border-dashed border-slate-200 rounded-xl">
              No matching vouchers posted in the Day Book for the selected filter parameters.
            </div>
          ) : (
            filteredVouchers.map((voucher) => (
              <div
                key={voucher.id}
                className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs space-y-0"
              >
                {/* Voucher Header Bar */}
                <div className="bg-slate-100/90 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-500 text-[11px]">
                      {voucher.voucherTime}
                    </span>

                    <span
                      className={cn(
                        "px-2 py-0.5 rounded font-mono font-extrabold text-[10px]",
                        voucher.voucherType === "JV"
                          ? "bg-purple-100 text-purple-800"
                          : voucher.voucherType === "PV"
                          ? "bg-rose-100 text-rose-800"
                          : voucher.voucherType === "RV"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-blue-100 text-blue-800"
                      )}
                    >
                      {voucher.voucherType}
                    </span>

                    <span className="font-mono font-extrabold text-slate-900 text-sm">
                      {voucher.voucherNo}
                    </span>

                    <span className="text-slate-600 font-semibold">
                      • {voucher.primaryAccount}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {voucher.refNo && (
                      <span className="font-mono text-[10px] bg-white border border-slate-300 px-2 py-0.5 rounded text-slate-700">
                        Ref: {voucher.refNo}
                      </span>
                    )}

                    <span className="font-mono font-extrabold text-emerald-800">
                      Total: {formatINR(voucher.totalDebit)}
                    </span>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setInspectVoucher(voucher)}
                      className="h-6 px-2 text-[10px] font-bold rounded-md border-slate-300 hover:bg-white cursor-pointer"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Inspect
                    </Button>
                  </div>
                </div>

                {/* Voucher Line Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                        <th className="py-2 px-4 border-r border-slate-200">#</th>
                        <th className="py-2 px-4 border-r border-slate-200">GL Account</th>
                        <th className="py-2 px-4 border-r border-slate-200">Particulars / Narration</th>
                        <th className="py-2 px-3 text-right border-r border-slate-200">Debit (INR)</th>
                        <th className="py-2 px-3 text-right">Credit (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                      {voucher.lines.map((line) => (
                        <tr key={line.lineNo} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-4 font-mono text-slate-400 border-r border-slate-200">
                            {line.lineNo}
                          </td>

                          <td className="py-2.5 px-4 font-bold text-slate-900 border-r border-slate-200">
                            <span className="font-mono text-slate-500 font-normal mr-1.5">
                              {line.glCode}
                            </span>
                            <span>{line.glAccountName}</span>
                          </td>

                          <td className="py-2.5 px-4 text-slate-600 border-r border-slate-200">
                            {line.particulars}
                          </td>

                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 border-r border-slate-200">
                            {line.debitAmount > 0 ? formatINR(line.debitAmount) : "-"}
                          </td>

                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {line.creditAmount > 0 ? formatINR(line.creditAmount) : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* WINHMS EXACT CASH & BANK DAILY SUMMARY CARD (Bottom Component) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs font-sans text-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Landmark className="h-4 w-4 text-emerald-600" />
            Daily Cash & Bank Balance Reconciliation Summary
          </h3>
          <span className="font-mono text-[11px] text-slate-500 font-semibold">
            Date: {selectedDate}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Cash Summary Panel */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 font-mono">
            <div className="font-extrabold text-xs text-slate-900 border-b border-slate-200 pb-1 flex justify-between">
              <span>CASH IN HAND SUMMARY</span>
              <span className="text-slate-500 text-[10px]">TILL FLOATS & MAIN CASH</span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Opening Cash Balance:</span>
                <strong className="text-slate-900">{formatINR(summary.cashOpening)}</strong>
              </div>
              <div className="flex justify-between text-emerald-800">
                <span>(+) Cash Receipts Today:</span>
                <strong>{formatINR(summary.cashReceipts)}</strong>
              </div>
              <div className="flex justify-between text-rose-700">
                <span>(-) Cash Payments Today:</span>
                <strong>{formatINR(summary.cashPayments)}</strong>
              </div>
              <div className="flex justify-between border-t border-slate-300 pt-1 text-slate-900 font-extrabold text-sm">
                <span>Closing Cash Balance:</span>
                <span className="text-emerald-800">{formatINR(summary.cashClosing)}</span>
              </div>
            </div>
          </div>

          {/* Bank Summary Panel */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 font-mono">
            <div className="font-extrabold text-xs text-slate-900 border-b border-slate-200 pb-1 flex justify-between">
              <span>BANK ACCOUNTS SUMMARY</span>
              <span className="text-slate-500 text-[10px]">HDFC / ICICI / SBI</span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Opening Bank Balance:</span>
                <strong className="text-slate-900">{formatINR(summary.bankOpening)}</strong>
              </div>
              <div className="flex justify-between text-emerald-800">
                <span>(+) Bank Deposits / Receipts:</span>
                <strong>{formatINR(summary.bankDeposits)}</strong>
              </div>
              <div className="flex justify-between text-rose-700">
                <span>(-) Bank Payments Outward:</span>
                <strong>{formatINR(summary.bankPayments)}</strong>
              </div>
              <div className="flex justify-between border-t border-slate-300 pt-1 text-slate-900 font-extrabold text-sm">
                <span>Closing Bank Balance:</span>
                <span className="text-emerald-800">{formatINR(summary.bankClosing)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inspect Voucher Modal */}
      {inspectVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-xl p-5 space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div>
                <span className="font-mono text-xs text-slate-500 font-bold">
                  Day Book Register Inspection
                </span>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <span>{inspectVoucher.voucherNo}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {inspectVoucher.status}
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setInspectVoucher(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Voucher Date</span>
                <span className="font-bold text-slate-900">
                  {inspectVoucher.voucherDate} ({inspectVoucher.voucherTime})
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Division</span>
                <span className="font-bold text-slate-900">{inspectVoucher.division}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Created By</span>
                <span className="font-bold text-slate-900">{inspectVoucher.createdBy}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Reference No</span>
                <span className="font-bold text-slate-900">{inspectVoucher.refNo || "N/A"}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-slate-900 block text-xs">Line Entries:</span>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">GL Account Description</th>
                      <th className="py-2 px-3 text-right">Debit (INR)</th>
                      <th className="py-2 px-3 text-right">Credit (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {inspectVoucher.lines.map((l) => (
                      <tr key={l.lineNo}>
                        <td className="py-2 px-3 text-slate-400">{l.lineNo}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{l.glAccountName}</td>
                        <td className="py-2 px-3 text-right font-bold">
                          {l.debitAmount > 0 ? formatINR(l.debitAmount) : "-"}
                        </td>
                        <td className="py-2 px-3 text-right font-bold">
                          {l.creditAmount > 0 ? formatINR(l.creditAmount) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="rounded-xl text-xs font-bold cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5 mr-1" />
                Print Voucher
              </Button>
              <Button
                size="sm"
                onClick={() => setInspectVoucher(null)}
                className="rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </ModulePageShell>
  );
}
