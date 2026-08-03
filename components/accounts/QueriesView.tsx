"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Building2,
  CheckCircle2,
  Save,
  RotateCcw,
  Printer,
  Download,
  X,
  ShieldCheck,
  Clock,
  Layers,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  CheckSquare,
  FileText,
  Eye,
  Calendar,
  Users,
  CreditCard,
  Building,
  DollarSign,
  AlertCircle,
  FileCheck2,
  HelpCircle,
  Landmark,
  FileCode,
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
  sampleQueryResultsData,
  QueryResultItem,
} from "@/app/data/accounts/queriesData";
import { cn } from "@/lib/utils";

export function QueriesView() {
  // Query Results State
  const [resultsList, setResultsList] = useState<QueryResultItem[]>(
    sampleQueryResultsData
  );

  // Active Query Mode ('voucher' | 'party' | 'cheque' | 'audit' | 'budget')
  const [queryMode, setQueryMode] = useState<
    "voucher" | "party" | "cheque" | "audit" | "budget"
  >("voucher");

  // Filters State
  const [dateFrom, setDateFrom] = useState("01/04/2026");
  const [dateTo, setDateTo] = useState("03/08/2026");
  const [voucherTypeFilter, setVoucherTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [accountFilter, setAccountFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Inspect Modal State
  const [inspectItem, setInspectItem] = useState<QueryResultItem | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Account Lookup Modal State
  const [isAccountLookupOpen, setIsAccountLookupOpen] = useState(false);

  // Sample Accounts for Lookup
  const sampleGLAccounts = [
    "1010 - Main Cash In Hand A/c",
    "1020 - HDFC Bank Operations A/c",
    "1030 - ICICI Bank Collection A/c",
    "1100 - Guest Ledger Control A/c",
    "1200 - City Ledger Control A/c",
    "2100 - Sundry Creditors Control A/c",
    "4100 - F&B Revenue Control A/c",
    "5100 - A&G Expense Control A/c",
    "5200 - Maintenance Control A/c",
  ];

  // Filtered Results
  const filteredResults = useMemo(() => {
    return resultsList.filter((item) => {
      // Voucher Type Filter
      if (voucherTypeFilter !== "All" && item.voucherType !== voucherTypeFilter) {
        return false;
      }
      // Status Filter
      if (statusFilter !== "All" && item.status !== statusFilter) {
        return false;
      }
      // Account Filter
      if (
        accountFilter &&
        !item.accountName.toLowerCase().includes(accountFilter.toLowerCase()) &&
        !item.accountCode.toLowerCase().includes(accountFilter.toLowerCase())
      ) {
        return false;
      }
      // General Keyword Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.voucherNo.toLowerCase().includes(q) ||
          item.accountName.toLowerCase().includes(q) ||
          item.narration.toLowerCase().includes(q) ||
          item.refNo.toLowerCase().includes(q) ||
          (item.chequeNo && item.chequeNo.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [resultsList, voucherTypeFilter, statusFilter, accountFilter, searchQuery]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalCount = filteredResults.length;
    const totalDebit = filteredResults.reduce((sum, r) => sum + r.debitAmount, 0);
    const totalCredit = filteredResults.reduce((sum, r) => sum + r.creditAmount, 0);
    const unpostedCount = filteredResults.filter((r) => r.status === "Unposted").length;

    return { totalCount, totalDebit, totalCredit, unpostedCount };
  }, [filteredResults]);

  // Reset Filters
  const handleResetFilters = () => {
    setDateFrom("01/04/2026");
    setDateTo("03/08/2026");
    setVoucherTypeFilter("All");
    setStatusFilter("All");
    setAccountFilter("");
    setSearchQuery("");
    setToastMessage("Cleared query filter criteria.");
  };

  // Run Query
  const handleRunQuery = () => {
    setToastMessage(`Query executed! Found ${filteredResults.length} matching entries.`);
  };

  // Export CSV Action
  const handleExportCSV = () => {
    const csvHeader =
      "VoucherDate,VoucherNo,VoucherType,AccountName,Narration,RefNo,DebitINR,CreditINR,CreatedBy,Status\n";
    const csvRows = filteredResults
      .map(
        (r) =>
          `"${r.voucherDate}","${r.voucherNo}","${r.voucherType}","${r.accountName}","${r.narration}","${r.refNo}","${r.debitAmount}","${r.creditAmount}","${r.createdBy}","${r.status}"`
      )
      .join("\n");
    const blob = new Blob([csvHeader + csvRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `WINHMS_Query_Export_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMessage("Exported query results to CSV file.");
  };

  return (
    <ModulePageShell
      eyebrow="Accounts"
      title="Queries"
      description="Interactive financial search, multi-criteria voucher inspection, party ledger lookup, and audit trail query engine."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Queries" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleRunQuery}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            <Search className="h-3.5 w-3.5 mr-1" />
            Run Query
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Clear Filters
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
            onClick={handleExportCSV}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export CSV
          </Button>
        </div>
      }
    >
      {/* Top Active Target Entity Selector & Mode Switcher */}
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-3">
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
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-slate-700 border border-slate-200 font-mono">
              <FileText className="h-3.5 w-3.5 text-slate-600" />
              Query Mode: {queryMode.toUpperCase()}
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1 text-emerald-800 border border-emerald-200 font-bold">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
              {metrics.totalCount} Matching Entries
            </span>
          </div>
        </div>

        {/* Query Mode Navigation Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100">
          {[
            { id: "voucher", label: "Voucher Search & Inspection", icon: FileText },
            { id: "party", label: "Party Ledger & Outstanding Query", icon: Users },
            { id: "cheque", label: "Cheque & Bank Clearance Query", icon: Landmark },
            { id: "audit", label: "Audit Log & Edited Entries", icon: ShieldCheck },
            { id: "budget", label: "Budget vs Actual Variance", icon: SlidersHorizontal },
          ].map((mode) => {
            const Icon = mode.icon;
            const isActive = queryMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setQueryMode(mode.id as any)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer",
                  isActive
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Metrics Overview Strip (4 Stat Mini-Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatMiniCard
          label="Total Matching Entries"
          value={`${metrics.totalCount} Vouchers`}
          icon={FileText}
        />
        <StatMiniCard
          label="Total Debit Volume"
          value={formatINR(metrics.totalDebit)}
          icon={DollarSign}
        />
        <StatMiniCard
          label="Total Credit Volume"
          value={formatINR(metrics.totalCredit)}
          icon={DollarSign}
        />
        <StatMiniCard
          label="Unposted / Draft Items"
          value={`${metrics.unpostedCount} Pending`}
          icon={AlertCircle}
        />
      </div>

      {/* Query Filter Panel */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs mb-4 font-sans text-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Query Search Filter Parameters
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500 font-bold">WINHMS QUERY ENGINE</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Date From */}
          <FormField label="Date From">
            <FODatePicker value={dateFrom} onChange={setDateFrom} placeholder="DD/MM/YYYY" />
          </FormField>

          {/* Date To */}
          <FormField label="Date To">
            <FODatePicker value={dateTo} onChange={setDateTo} placeholder="DD/MM/YYYY" />
          </FormField>

          {/* Voucher Type Filter */}
          <FormField label="Voucher Type">
            <SelectInput
              value={voucherTypeFilter}
              onChange={(e) => setVoucherTypeFilter(e.target.value)}
              className="bg-white font-bold h-9"
            >
              <option value="All">All Voucher Types</option>
              <option value="JV">Journal Voucher (JV)</option>
              <option value="PV">Payment Voucher (PV)</option>
              <option value="RV">Receipt Voucher (RV)</option>
              <option value="CV">Contra Voucher (CV)</option>
            </SelectInput>
          </FormField>

          {/* Status Filter */}
          <FormField label="Posting Status">
            <SelectInput
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white font-bold h-9"
            >
              <option value="All">All Posting Statuses</option>
              <option value="Posted">Posted Entries Only</option>
              <option value="Unposted">Unposted / Draft Only</option>
              <option value="Cancelled">Cancelled Entries Only</option>
            </SelectInput>
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Account / Party Filter */}
          <FormField label="GL Account / Party Filter">
            <div className="flex items-center gap-2">
              <TextInput
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value)}
                placeholder="Filter by Account or Party Name..."
                className="bg-white font-semibold h-9 flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAccountLookupOpen(true)}
                className="h-9 px-3 rounded-xl border-slate-300 hover:bg-slate-100 font-bold cursor-pointer"
                title="Lookup Account"
              >
                🔍
              </Button>
            </div>
          </FormField>

          {/* Keyword Search */}
          <FormField label="Search Keyword (Voucher #, Ref #, Narration, Cheque #)">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter voucher no, cheque no, narration keyword..."
                className="h-9 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </FormField>
        </div>
      </div>

      {/* Query Results Data Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs font-sans text-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-600" />
            Query Results Matrix ({filteredResults.length} Entries)
          </h3>
          <span className="font-mono text-[11px] text-slate-500 font-semibold">
            Showing {filteredResults.length} of {resultsList.length} total entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3 font-mono">Voucher No</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-4">Account / Party Name</th>
                <th className="py-3 px-4">Narration / Reference</th>
                <th className="py-3 px-3 text-right">Debit (INR)</th>
                <th className="py-3 px-3 text-right">Credit (INR)</th>
                <th className="py-3 px-3">Created By</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 font-semibold italic">
                    No matching query results found for the specified filter criteria.
                  </td>
                </tr>
              ) : (
                filteredResults.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {item.voucherDate}
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {item.voucherNo}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded font-mono font-extrabold text-[10px]",
                          item.voucherType === "JV"
                            ? "bg-purple-100 text-purple-800"
                            : item.voucherType === "PV"
                            ? "bg-rose-100 text-rose-800"
                            : item.voucherType === "RV"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-blue-100 text-blue-800"
                        )}
                      >
                        {item.voucherType}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div>{item.accountName}</div>
                      <span className="text-[10px] font-mono text-slate-400 font-normal">
                        {item.accountCode} • {item.division}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      <div>{item.narration}</div>
                      {item.refNo && (
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          Ref: {item.refNo}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {item.debitAmount > 0 ? formatINR(item.debitAmount) : "-"}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {item.creditAmount > 0 ? formatINR(item.creditAmount) : "-"}
                    </td>

                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      <div>{item.createdBy}</div>
                      <span className="text-[10px] font-mono text-slate-400">{item.createdDate}</span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                          item.status === "Posted"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : item.status === "Unposted"
                            ? "bg-amber-50 text-amber-900 border-amber-200"
                            : "bg-rose-50 text-rose-800 border-rose-200"
                        )}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setInspectItem(item)}
                        className="h-7 px-2.5 rounded-lg text-[11px] font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Voucher Details Modal */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl p-6 space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="font-mono text-xs text-slate-500 font-bold">
                  Voucher Inspection • {inspectItem.voucherType}
                </span>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <span>{inspectItem.voucherNo}</span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[11px] font-bold uppercase border",
                      inspectItem.status === "Posted"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-amber-50 text-amber-900 border-amber-200"
                    )}
                  >
                    {inspectItem.status}
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setInspectItem(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Voucher Meta Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-mono text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Voucher Date</span>
                <span className="font-bold text-slate-900">{inspectItem.voucherDate}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Division</span>
                <span className="font-bold text-slate-900">{inspectItem.division}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Reference No</span>
                <span className="font-bold text-slate-900">{inspectItem.refNo || "N/A"}</span>
              </div>
              {inspectItem.chequeNo && (
                <>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">Cheque / UTR #</span>
                    <span className="font-bold text-slate-900">{inspectItem.chequeNo}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">Bank Name</span>
                    <span className="font-bold text-slate-900">{inspectItem.bankName}</span>
                  </div>
                </>
              )}
            </div>

            {/* Narration */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 block uppercase mb-1">
                Narration / Transaction Description
              </span>
              <p className="font-semibold text-slate-800">{inspectItem.narration}</p>
            </div>

            {/* Line Items Table */}
            <div className="space-y-2">
              <span className="font-bold text-slate-900 block text-xs">General Ledger Line Item Entries:</span>
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
                    {inspectItem.lineItems.map((line) => (
                      <tr key={line.lineNo}>
                        <td className="py-2 px-3 text-slate-500">{line.lineNo}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{line.glAccount}</td>
                        <td className="py-2 px-3 text-right font-bold">
                          {line.debit > 0 ? formatINR(line.debit) : "-"}
                        </td>
                        <td className="py-2 px-3 text-right font-bold">
                          {line.credit > 0 ? formatINR(line.credit) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Audit Trail */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 font-mono text-[11px] text-slate-500">
              <div>Created By: <strong className="text-slate-800">{inspectItem.createdBy}</strong></div>
              <div>Audit Date: <strong className="text-slate-800">{inspectItem.createdDate}</strong></div>
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
                onClick={() => setInspectItem(null)}
                className="rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Account Lookup Modal */}
      {isAccountLookupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-5 space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">Select GL Account / Party</h3>
              <button
                onClick={() => setIsAccountLookupOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {sampleGLAccounts.map((acc) => (
                <div
                  key={acc}
                  onClick={() => {
                    setAccountFilter(acc);
                    setIsAccountLookupOpen(false);
                  }}
                  className="p-2.5 rounded-xl border border-slate-200 hover:bg-emerald-50 hover:border-emerald-400 cursor-pointer font-bold text-slate-800 flex items-center justify-between"
                >
                  <span>{acc}</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 opacity-0 hover:opacity-100" />
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAccountLookupOpen(false)}
                className="rounded-xl text-xs font-semibold cursor-pointer"
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
